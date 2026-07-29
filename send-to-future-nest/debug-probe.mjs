import http from 'http';
import crypto from 'crypto';
import { URL } from 'url';

const INSPECT_HOST = '127.0.0.1';
const INSPECT_PORT = 9229;
const APP_URL = 'http://127.0.0.1:3000/health';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getTargets() {
  return new Promise((resolve, reject) => {
    http
      .get(`http://${INSPECT_HOST}:${INSPECT_PORT}/json`, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(JSON.parse(data)));
      })
      .on('error', reject);
  });
}

class WsClient {
  constructor(socket) {
    this.socket = socket;
    this.buf = Buffer.alloc(0);
    this.onMessage = () => {};
    socket.on('data', (chunk) => this._onData(chunk));
  }
  _onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    while (true) {
      if (this.buf.length < 2) break;
      const b0 = this.buf[0];
      const b1 = this.buf[1];
      const opcode = b0 & 0x0f;
      let len = b1 & 0x7f;
      let offset = 2;
      if (len === 126) {
        if (this.buf.length < 4) break;
        len = this.buf.readUInt16BE(2);
        offset = 4;
      } else if (len === 127) {
        if (this.buf.length < 10) break;
        len = Number(this.buf.readBigUInt64BE(2));
        offset = 10;
      }
      const masked = (b1 & 0x80) !== 0;
      let maskKey;
      if (masked) {
        if (this.buf.length < offset + 4) break;
        maskKey = this.buf.subarray(offset, offset + 4);
        offset += 4;
      }
      if (this.buf.length < offset + len) break;
      let payload = this.buf.subarray(offset, offset + len);
      if (masked) {
        const out = Buffer.alloc(len);
        for (let i = 0; i < len; i++) out[i] = payload[i] ^ maskKey[i & 3];
        payload = out;
      }
      this.buf = this.buf.subarray(offset + len);
      if (opcode === 0x1) {
        try {
          this.onMessage(JSON.parse(payload.toString('utf8')));
        } catch {}
      } else if (opcode === 0x9) {
        this._sendFrame(0xa, payload);
      } else if (opcode === 0x8) {
        this.socket.end();
      }
    }
  }
  _sendFrame(opcode, payload) {
    const mask = crypto.randomBytes(4);
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.alloc(2);
      header[1] = 0x80 | len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    header[0] = 0x80 | opcode;
    const masked = Buffer.alloc(len);
    for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i & 3];
    this.socket.write(Buffer.concat([header, mask, masked]));
  }
  send(str) {
    this._sendFrame(0x1, Buffer.from(str, 'utf8'));
  }
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const u = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      host: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
      },
    });
    req.on('upgrade', (_res, socket) => resolve(new WsClient(socket)));
    req.on('error', reject);
    req.end();
  });
}

function getHealth() {
  return new Promise((resolve) => {
    http
      .get(APP_URL, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => resolve(d));
      })
      .on('error', () => resolve(null));
  });
}

async function main() {
  const targets = await getTargets();
  const target = targets.find((t) => t.webSocketDebuggerUrl);
  if (!target) throw new Error('no inspector target');
  const ws = await connect(target.webSocketDebuggerUrl);

  let id = 0;
  let success = false;
  let armed = false;
  let hitLocation = null;
  const pending = new Map();
  ws.onMessage = (msg) => {
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
    if (msg.method === 'Debugger.paused') {
      // ignore the initial --inspect-brk entry pause
      if (!armed) return;
      success = true;
      hitLocation = msg.params.location;
      console.log('BREAKPOINT_HIT location=', JSON.stringify(hitLocation));
    }
  };
  const send = (method, params) =>
    new Promise((res) => {
      const myId = ++id;
      ws.send(JSON.stringify({ id: myId, method, params }));
      pending.set(myId, res);
    });

  await send('Debugger.enable');
  await send('Runtime.enable');
  await send('Runtime.runIfWaitingForDebugger'); // release --inspect-brk pause

  // wait until the server is actually listening
  let listening = false;
  for (let i = 0; i < 40; i++) {
    const body = await getHealth();
    if (body) {
      listening = true;
      console.log('LISTENING body=', body);
      break;
    }
    await sleep(1000);
  }
  if (!listening) {
    console.log('RESULT: FAIL (server never started listening)');
    process.exit(3);
  }

  const bp = await send('Debugger.setBreakpointByUrl', {
    lineNumber: 13,
    urlRegex: 'app\\.controller\\.ts',
    columnNumber: 0,
  });
  console.log('BREAKPOINT_SET', JSON.stringify(bp.result || bp.error));

  armed = true;
  const body = await getHealth();
  console.log('HEALTH_AFTER_BP', body);

  await sleep(4000);
  console.log(
    success
      ? 'RESULT: PASS (debugger paused inside getHealth on /health)'
      : 'RESULT: FAIL (no pause on /health)'
  );
  process.exit(success ? 0 : 1);
}

main().catch((e) => {
  console.error('PROBE_ERROR', e);
  process.exit(2);
});
