# 多阶段构建 NestJS 应用镜像
FROM node:20-alpine AS builder
WORKDIR /app
# 使用国内镜像源并加大网络重试，规避 ECONNRESET / 代理导致的安装失败
RUN npm config set registry https://registry.npmmirror.com \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 300000
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 安装 openssl，让 Prisma 正确识别 openssl 版本（否则会回退到 1.1.x 并触发引擎重新下载）
# 使用阿里云 alpine 镜像源，规避默认源在国内网络不可达导致的安装卡死
RUN sed -i 's#dl-cdn.alpinelinux.org#mirrors.aliyun.com#g' /etc/apk/repositories \
 && apk add --no-cache openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 注：以 root 运行，避免 prisma 运行时写入 engines 的权限问题（原型环境足够）。
# 已安装 openssl，Prisma 能正确识别 openssl 版本并使用已下载的引擎，无需联网重新下载。
EXPOSE 3000
CMD ["node", "dist/main"]
