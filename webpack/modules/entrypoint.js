const STATICS = {};

// leave this on top of entrypoint
require("aws-cdk-lib/package.json");

const os = require("os");
const fs = require("fs"); // this is actually memfs!
const { rootDir } = require("aws-cdk/lib/util/directories");
const baseFolders = [rootDir(), os.tmpdir(), process.env.CDK_OUTDIR];

const _init = () => {
  baseFolders.forEach((path) => fs.existsSync(path) || fs.mkdirSync(path, { recursive: true }));
  Object.keys(STATICS.assets)
    .filter((asset) => !fs.existsSync(STATICS.assets[asset].path))
    .forEach((asset) => fs.writeFileSync(STATICS.assets[asset].path, STATICS.assets[asset].code));
};
const _dump = () => {
  return fs.vol.toJSON();
};
const _free = () => {
  fs.vol.reset();
};

/** @returns {typeof require} */
const _require = (name) => {
  _init();
  return module.exports[name];
};

module.exports = {
  PseudoCli: require("./cli"),
  version: STATICS.versions,
  emitter: require("./emitter"),
  require: _require,
  init: _init,
  free: _free,
  dump: _dump,
};

// exports
