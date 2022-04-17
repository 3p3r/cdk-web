const fs = require("fs");
const path = require("path");
const { __ROOT, getModules, getAssets } = require("./common");

const entryPoint = function () {
  const STATICS = {};
  const nodeProcess = eval("typeof process !== 'undefined' && process");
  const os = require("os");
  const fs = require("fs");
  const emitter = require("./webpack/modules/emitter");
  const { modules } = STATICS;
  const allModules = Object.keys(modules);
  const { rootDir } = require("aws-cdk/lib/util/directories");
  const baseFolders = ["/ui", rootDir(), os.tmpdir(), process.env.CDK_OUTDIR];
  // this is a dummy call so we can modify it in webpack. leave this here.
  require("aws-cdk-lib/package.json");
  let initialized = false;
  module.exports = class CdkWeb {
    static get PseudoCli() {
      return require("./webpack/modules/cli");
    }
    static get version() {
      return STATICS.versions;
    }
    static get modules() {
      return STATICS.modules;
    }
    static get emitter() {
      return emitter;
    }
    static require(name, autoInit = true) {
      autoInit && CdkWeb.init();
      if (!allModules.includes(name)) throw new Error(`module not found: ${name}`);
      else return CdkWeb.modules[name];
    }
    static init(opts) {
      if (initialized) return;
      const options = { ...{ requireHook: false }, ...opts };
      baseFolders.forEach((path) => fs.existsSync(path) || fs.mkdirSync(path, { recursive: true }));
      Object.keys(STATICS.assets)
        .filter((asset) => !fs.existsSync(STATICS.assets[asset].path))
        .forEach((asset) => fs.writeFileSync(STATICS.assets[asset].path, STATICS.assets[asset].code));
      if (nodeProcess && options.requireHook === true) {
        const Module = eval("require")("module");
        Module.prototype.nodeRequire = Module.prototype.require;
        Module.prototype.require = function (name, ...args) {
          // compatibility between cdk-web and monocdk
          if (name === "monocdk") return { ...CdkWeb.require("constructs"), ...CdkWeb.require("aws-cdk-lib") };
          // compatibility between cdk-web and monocdk/aws-cdk-lib 2+
          if (
            ["fs", "path", "process", "constructs"].includes(name) ||
            name.startsWith("aws-cdk-lib") ||
            name.startsWith("monocdk")
          )
            return CdkWeb.require(name.replace("monocdk", "aws-cdk-lib"));
          // best effort v1 compatibility but not guaranteed
          if (name.startsWith("@aws-cdk"))
            return name.replace("@aws-cdk/core", "aws-cdk-lib").replace("@aws-cdk/", "aws-cdk-lib/");
          // don't recognize the import, handoff back to node
          return Module.prototype.nodeRequire.call(this, name, ...args);
        };
        globalThis.process = nodeProcess;
        initialized = true;
      }
    }
    static free() {
      if (!initialized) return;
      initialized = false;
      fs.vol.reset();
    }
  };
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
