const konsole = require("../../../node_modules/console-browserify/index.js");
let emitter = null;
function getEmitter() {
  if (!emitter) emitter = require("../emitter.js");
  return emitter;
}
module.exports = {
  ...konsole,
  log: function (...args) {
    getEmitter().emit("console", ...args);
  },
};
