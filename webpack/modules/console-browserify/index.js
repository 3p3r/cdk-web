const console = require("../../../node_modules/console-browserify/index.js");
const debug = require("debug")("CdkWeb:console");
const emitter = require("../emitter");
module.exports = {
  ...console,
  log: function (...args) {
    emitter.emit("console.log", ...args);
    debug("%o", args);
  },
};
