// this mainly controls test timeouts. you don't want puppeteer devtools to close because jest timed out.
const isDebugger = require("./utils/is-debugger");

module.exports = {
  preset: "jest-puppeteer",
  verbose: isDebugger,
  testTimeout: isDebugger ? 1e9 : 1e5,
};
