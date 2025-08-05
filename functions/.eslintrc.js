module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "quotes": [
      "error",
      "double",
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    "import/no-unresolved": 0,
    "indent": "off",
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
    "no-unused-vars": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "linebreak-style": "off",
  },
  overrides: [
    {
      // 針對所有 ts 和 tsx 檔案套用此設定
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        sourceType: "module",
      },
      // 確保這些 extends 也適用於 TS 檔案
      extends: [
        "plugin:import/typescript",
        "plugin:@typescript-eslint/recommended",
      ],
      // 這裡可以放 TS 專屬的 rules
      rules: {
        "@typescript-eslint/require-jsdoc": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    {
      // 針對所有 js 和 jsx 檔案套用此設定
      files: ["**/*.js", "**/*.jsx"],
      parser: "espree", // 或其他適合 JavaScript 的解析器
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
    },
  ],
};
