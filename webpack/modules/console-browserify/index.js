const console = require("../../../node_modules/console-browserify/index.js");
const debug = require("debug")("CdkWeb:console");
const { EventEmitter2 } = require("eventemitter2");
const aggregator = new EventEmitter2({ wildcard: true });
module.exports = {
  ...console,
  aggregator,
  log: function (...args) {
    aggregator.emit("console.log", ...args);
    debug("%o", args);
  },
};
