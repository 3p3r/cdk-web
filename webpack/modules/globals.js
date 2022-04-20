const utils = require("./utils");
const createEvalExpression = (symbol) => `(typeof ${symbol}!=='undefined')&&${symbol}`;

const contextProcess = eval(createEvalExpression("process"));
const contextRequire = eval(createEvalExpression("require"));

const hasProcess = false !== (contextProcess && contextProcess.version && contextProcess.versions.node);
const hasBrowser = typeof window !== undefined;

const actualRequire = utils.get(contextRequire, __webpack_require__);
const actualProcess = utils.ternary(hasProcess, contextProcess, require("./process"));
const actualFs = utils.ternary(hasProcess, contextRequire("fs"), require("./fs"));

module.exports = {
  hasProcess,
  hasBrowser,
  fs: actualFs,
  require: actualRequire,
  process: actualProcess,
};
