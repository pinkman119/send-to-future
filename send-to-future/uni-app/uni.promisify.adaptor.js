uni.addInterceptor({
	/**
	 * 拦截 uni 异步 API 返回值，将 [err, res] 形式转换为标准 Promise
	 * @param {any} res - 原始返回值（Promise 或普通值）
	 * @returns {any} 非 Promise 原样返回；Promise 则按 [err, data] 解析
	 */
	returnValue(res) {
		if (!(!!res && (typeof res === "object" || typeof res === "function") && typeof res.then ===
			"function")) {
			return res;
		}
		return new Promise((resolve, reject) => {
			res.then((res) => {
				if (!res) return resolve(res)
				return res[0] ? reject(res[0]) : resolve(res[1])
			});
		});
	},
});
