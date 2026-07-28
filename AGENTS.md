# AGENTS.md — 项目协作规则

本文件记录本项目约定，供 AI 编码助手（CodeBuddy 等）在编写或修改代码时遵循。

## 注释规范（强制）

> **强制等级：必须（Mandatory）。** 所有新增或修改的函数、方法、类都必须按 JSDoc 格式编写注释；缺失注释或注释不合规视为不可接受。AI 编码助手在生成或修改代码时**必须**遵守，不得省略或弱化。
>
> 该规则同时由 ESLint（`eslint-plugin-jsdoc`）在 `src/wechat/**` 强制校验，提交前 `npm run lint` 会拦截不合规代码。

具体要求：

- **必须有 JSDoc 块注释**（`/** ... */`），并至少有一句简体中文描述方法/函数的作用。
- **`@param` 必填类型与说明**：`@param {Type} name - 描述`；可选参数用方括号：`@param {Type} [name] - 描述`。当代码已用 TS 显式声明类型时，JSDoc 类型可省略（避免与 TS 类型重复产生噪声），但参数描述必须保留。
- **`@returns` 必填类型与说明**：`@returns {Type} 描述`；异步方法返回值类型**必须**写为 `Promise<...>`；确实无返回值时省略 `@returns`。
- **异步方法必须加 `@async`**。
- 涉及错误抛出 / 废弃 / 明显副作用时，使用 `@throws {Error} ...`、`@deprecated`、`@fires` 等标签补充说明。
- 注释统一使用**简体中文**，简洁准确。

### 示例

```js
/**
 * 模拟登录：跳过微信 code2session，直接用 openid 建档/识别。
 * 用于无微信开发者工具环境下联调——用户不存在则模拟创建。
 * @async
 * @param {string} [providedOpenid] - 可选，指定 openid（不传则自动生成）
 * @returns {Promise<object>} 包含 token 与用户信息的登录结果
 */
async function mockLogin(providedOpenid?: string) {
  // ...
}
```

## 其他约定

- 本项目采用 OpenSpec（spec-driven）开发流程，规格与变更提案位于 `openspec/` 目录。
- 涉及重大功能变更时，优先通过 OpenSpec 提交 proposal 并梳理 tasks。
