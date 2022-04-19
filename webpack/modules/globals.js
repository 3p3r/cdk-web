const createEvalExpression = (symbol) => `(typeof ${symbol}!=='undefined')&&${symbol}`;

const contextProcess = eval(createEvalExpression("process"));
const contextRequire = eval(createEvalExpression("require"));

const hasProcess = false !== (contextProcess && contextProcess.version && contextProcess.versions.node);
const hasBrowser = typeof window !== undefined;

const actualRequire = contextRequire || __webpack_require__;
const actualProcess = hasProcess ? contextProcess : require("./process");
const actualFs = hasProcess ? contextRequire("fs") : require("./fs");

class Globals {
  static get hasProcess() {
    return hasProcess;
  }
  static get hasBrowser() {
    return hasBrowser;
  }
  /** @type {typeof require} */
  static get require() {
    return actualRequire;
  }
  /** @type {typeof process} */
  static get process() {
    return actualProcess;
  }
  /** @type {typeof import("fs")} */
  static get fs() {
    return actualFs;
  }
}

module.exports = Globals;
