module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'jsdoc'],
  extends: ['plugin:@typescript-eslint/recommended'],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
  },
  overrides: [
    {
      // 微信登录模块强制 JSDoc（与 AGENTS.md 的「注释规范（强制）」对齐）
      files: ['src/wechat/**/*.ts'],
      rules: {
        'jsdoc/require-jsdoc': [
          'error',
          {
            require: {
              FunctionDeclaration: true,
              MethodDefinition: true,
            },
          },
        ],
        'jsdoc/require-param': 'error',
        'jsdoc/require-param-type': 'error',
        'jsdoc/require-param-description': 'error',
        'jsdoc/require-returns-type': 'error',
        'jsdoc/check-param-names': 'error',
        'jsdoc/check-tag-names': 'error',
        'jsdoc/require-async': 'error',
        'jsdoc/valid-jsdoc': 'error',
        'jsdoc/no-undefined-types': 'off',
      },
    },
  ],
};
