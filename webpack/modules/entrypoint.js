const STATICS = {};

// leave these on top of entrypoint
require("aws-cdk-lib/package.json");

const os = require("os");
const fs = require("fs");
const { rootDir } = require("aws-cdk/lib/util/directories");
const baseFolders = [rootDir(), os.tmpdir(), process.env.CDK_OUTDIR];
baseFolders.forEach((path) => fs.existsSync(path) || fs.mkdirSync(path, { recursive: true }));
Object.keys(STATICS.assets)
  .filter((asset) => !fs.existsSync(STATICS.assets[asset].path))
  .forEach((asset) => fs.writeFileSync(STATICS.assets[asset].path, STATICS.assets[asset].code));

/** @returns {typeof require} */
const _require = (name) => {
  return module.exports[name];
};

module.exports = {
  PseudoCli: require("./cli"),
  version: STATICS.versions,
  emitter: require("./emitter"),
  require: _require,
};
// exports
