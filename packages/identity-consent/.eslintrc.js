module.exports = {
  extends: [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
  ],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  rules: {
    // Nest specific rules
    "class-methods-use-this": "off",
  },
};
