const _ = require("./utils");
const path = require("path");
const konsole = require("./console-browserify/index");
const proc = require("../../node_modules/process/browser");

const isBrowser = typeof window !== "undefined";
const nodeProcess = eval("!isBrowser && process");

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
  env: _.ternary(isBrowser, proc.env, { ...nodeProcess.env, ...proc.env }),
  stderr: { write: konsole.log },
  stdout: { write: konsole.log },
};
