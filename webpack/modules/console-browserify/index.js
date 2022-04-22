const konsole = require("../../../node_modules/console-browserify/index.js");
let emitter = null;
function getEmitter() {
  if (!emitter) emitter = require("../emitter.js");
  return emitter;
}
function emitConsole(...args) {
  getEmitter().emit("console", ...args);
}
module.exports = {
  ...konsole,
  log: emitConsole,
  info: emitConsole,
  warn: emitConsole,
  error: emitConsole,
};
