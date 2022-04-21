const _ = require("./utils");
const path = require("path");
const proc = require("../../node_modules/process/browser");
let emitter = null;
function getEmitter() {
  if (!emitter) emitter = require("./emitter.js");
  return emitter;
}
module.exports = {
  ...proc,
  chdir(dir) {
    this.cwd = () => {
      return path.resolve(dir);
    };
  },
  listenerCount(sym) {
    return _.ternary(this.listeners, this.listeners(sym).length, 0);
  },
  hrtime: require("browser-process-hrtime"),
  stderr: {
    write: (...args) => getEmitter().emit("stderr", ...args),
  },
  stdout: {
    write: (...args) => getEmitter().emit("stdout", ...args),
  },
};
