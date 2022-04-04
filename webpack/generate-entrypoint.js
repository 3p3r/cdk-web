const fs = require("fs");
const path = require("path");
const { __ROOT, getModules, getAssets } = require("./common");

const entryPoint = function () {
  const STATICS = {};
  const os = require("os");
  const fs = require("fs");
  const { modules } = STATICS;
  const allModules = Object.keys(modules);
  let initialized = false;
  class CdkWeb {
    get PseudoCli() {
      return require("./webpack/modules/cli");
    }
    get version() {
      return STATICS.versions;
    }
    get modules() {
      return STATICS.modules;
    }
    require(name, autoInit = true) {
      const self = this || window.CDK;
      autoInit && self.init();
      if (!allModules.includes(name)) throw new Error(`module not found: ${name}`);
      else return self.modules[name];
    }
    init() {
      if (initialized) return;
      if (!fs.existsSync("/cdk")) fs.mkdirSync("/cdk");
      if (!fs.existsSync(os.tmpdir())) fs.mkdirSync(os.tmpdir());
      Object.keys(STATICS.assets)
        .filter((asset) => !fs.existsSync(STATICS.assets[asset].path))
        .forEach((asset) => fs.writeFileSync(STATICS.assets[asset].path, STATICS.assets[asset].code));
      initialized = true;
    }
    free() {
      if (!initialized) return;
      if (fs.existsSync("/cdk")) fs.rmdirSync("/cdk");
      if (fs.existsSync(os.tmpdir())) fs.rmdirSync(os.tmpdir());
      Object.keys(STATICS.assets)
        .filter((asset) => fs.existsSync(STATICS.assets[asset].path))
        .forEach((asset) => fs.rmSync(STATICS.assets[asset].path));
      initialized = false;
    }
  }
  const LIBRARY = new CdkWeb();
  module.exports = LIBRARY;
};

module.exports = function generateEntrypoint() {
  const modules = getModules()
    .map((packageName) => `"${packageName}": require("${packageName}")`)
    .join(",");
  const versions = JSON.stringify({
    constructs: require("constructs/package.json").version,
    "aws-cdk-lib": require("aws-cdk-lib/package.json").version,
    "aws-cdk": require("aws-cdk/package.json").version,
    "cdk-web": require("../package.json").version,
  });
  const assets = getAssets()
    .map(({ code, path }) => `"${path}": ${JSON.stringify({ path, code })}`)
    .join(",");
  const entryPointText = entryPoint
    .toString()
    // removes surrounding function declaration
    .match(/function[^{]+\{([\s\S]*)\}$/)[1]
    .replace(
      "const STATICS = {};",
      `const STATICS = {
          modules: {${modules}},
          versions: ${versions},
          assets: {${assets}},
        };`
    );

  const entryPointPath = path.resolve(__ROOT, "index.generated.js");
  fs.writeFileSync(entryPointPath, entryPointText, { encoding: "utf-8" });
};
