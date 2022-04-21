const _ = require("./utils");
const path = require("path");
const proc = require("../../node_modules/process/browser");
const emitter = require("./emitter");

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
    write: (...args) => emitter.emit("process.stderr.write", ...args),
  },
  stdout: {
    write: (...args) => emitter.emit("process.stdout.write", ...args),
  },
};
