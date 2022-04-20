const _ = require("./utils");
const path = require("path");
const konsole = require("./console-browserify/index");
const proc = require("../../node_modules/process/browser");

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
  stderr: { write: konsole.log },
  stdout: { write: konsole.log },
};
