module.exports = {
  env: {
    node: true,
    browser: true,
    commonjs: true,
  },
  plugins: ["es"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  ignorePatterns: ["src", "webpack", "build", "public"],
  rules: {
    "es/no-regexp-lookbehind-assertions": "error",
  },
};
