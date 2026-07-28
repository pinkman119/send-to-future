/**
 * 环境判定工具：统一基于 process.env.NODE_ENV 判断当前运行环境，
 * 避免在业务代码中散落 `NODE_ENV === 'xxx'` 的硬编码比较。
 */

/** 当前 NODE_ENV，未设置时默认按 development 处理 */
export function getNodeEnv(): string {
    return (process.env.NODE_ENV ?? 'development').toLowerCase();
}

/** 是否为开发环境 */
export function isDev(): boolean {
    return getNodeEnv() === 'development';
}

/** 是否为生产环境 */
export function isProd(): boolean {
    return getNodeEnv() === 'production';
}
