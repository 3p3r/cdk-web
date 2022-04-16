const path = require("path");
const console = require("./console-browserify/index");
const original = require("../../node_modules/process/browser");

const isBrowser = typeof window !== "undefined";
const nodeProcess = isBrowser ? null : eval("process");

module.exports = {
  ...original,
  chdir(dir) {
    this.cwd = () => {
      return path.resolve(dir);
    };
  },
  listenerCount(sym) {
    return this.listeners ? this.listeners(sym).length : 0;
  },
  hrtime: require("browser-process-hrtime"),
  env: isBrowser ? original.env : { ...nodeProcess.env, ...original.env },
  stderr: { write: console.log },
  stdout: { write: console.log },
};
