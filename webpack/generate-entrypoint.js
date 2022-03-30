const fs = require("fs");
const path = require("path");
const { __ROOT, getModules, getAssets } = require("./common");

const entryPoint = function () {
  const STATICS = {};
  const os = require("os");
  const fs = require("fs");
  const { EventEmitter } = require("stream");
  const { aggregator } = require("./webpack/modules/console-browserify/index.js");
  const { modules } = STATICS;
  const allModules = Object.keys(modules);
  const baseFolders = ["/ui", "/cdk", os.tmpdir(), process.env.CDK_OUTDIR];
  // this is a dummy call so we can modify it in webpack. leave this here.
  require("aws-cdk-lib/package.json");
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
    /** @type {EventEmitter} */
    get logger() {
      return aggregator;
    }
    require(name, autoInit = true) {
      const self = this || window.CDK;
      autoInit && self.init();
      if (!allModules.includes(name))
        throw new Error(`module not found: ${name}`);
      else return self.modules[name];
    }
    init() {
      if (initialized) return;
      baseFolders.forEach((path) => fs.existsSync(path) || fs.mkdirSync(path, { recursive: true }));
      Object.keys(STATICS.assets)
        .filter((asset) => !fs.existsSync(STATICS.assets[asset].path))
        .forEach((asset) =>
          fs.writeFileSync(
            STATICS.assets[asset].path,
            STATICS.assets[asset].code
          )
        );
      initialized = true;
    }
    free() {
      if (!initialized) return;
      initialized = false;
      fs.vol.reset();
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
    .concat({
      code: fs.readFileSync(path.resolve(__ROOT, "dist/index.html"), { encoding: "utf-8" }),
      path: "/ui/render-template.html",
    })
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
