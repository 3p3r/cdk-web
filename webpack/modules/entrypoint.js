const STATICS = {};
// leave this on top of entrypoint
const globals = require("./globals");

const os = require("os");
const fs = require("fs");
const { rootDir } = require("aws-cdk/lib/util/directories");
const baseFolders = ["/ui", rootDir(), os.tmpdir(), process.env.CDK_OUTDIR];

// this is a dummy call so we can modify it in webpack. leave this here.
require("aws-cdk-lib/package.json");

let initialized = false;
let merged = null;

class CdkWeb {
  static get PseudoCli() {
    return require("./cli");
  }
  static get version() {
    return STATICS.versions;
  }
  static get emitter() {
    return require("./emitter");
  }
  static require(name, autoInit = true) {
    autoInit && CdkWeb.init();
    return module.exports[name];
  }
  static init(opts) {
    if (initialized) return;
    const options = { ...{ requireHook: false }, ...opts };
    baseFolders.forEach((path) => fs.existsSync(path) || fs.mkdirSync(path, { recursive: true }));
    Object.keys(STATICS.assets)
      .filter((asset) => !fs.existsSync(STATICS.assets[asset].path))
      .forEach((asset) => fs.writeFileSync(STATICS.assets[asset].path, STATICS.assets[asset].code));
    if (globals.hasProcess && options.requireHook === true) {
      const Module = globals.require("module");
      const _require = Module.prototype.require;
      Module.prototype._require = _require;
      Module.prototype.require = function (name, ...args) {
        // compatibility between cdk-web and monocdk
        if (name === "monocdk") {
          return merged === null
            ? (merged = { ...CdkWeb.require("constructs", false), ...CdkWeb.require("aws-cdk-lib", false) })
            : merged;
        }
        // compatibility between cdk-web and monocdk/aws-cdk-lib 2+
        if (
          ["fs", "path", "process", "constructs"].includes(name) ||
          name.startsWith("aws-cdk-lib") ||
          name.startsWith("monocdk")
        )
          return CdkWeb.require(name.replace("monocdk", "aws-cdk-lib"), false);
        // best effort v1 compatibility but not guaranteed
        if (name.startsWith("@aws-cdk")) {
          return name.replace("@aws-cdk/core", "aws-cdk-lib").replace("@aws-cdk/", "aws-cdk-lib/");
        }
        // don't recognize the import, handoff back to node
        return _require.call(this, name, ...args);
      };
    }
    initialized = true;
  }

  static free() {
    if (!initialized) return;
    initialized = false;
    fs.vol.reset();
  }
}

module.exports = CdkWeb;
// exports
