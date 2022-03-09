// this launches puppeteer in devtools mode if a debugger is present in host
const isDebugger = require("./utils/is-debugger");

module.exports = {
  launch: {
    devtools: isDebugger,
    product: "chrome",
  },
};
