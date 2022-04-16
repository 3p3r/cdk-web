const memfs = require("memfs");
const path = require("path");

module.exports = {
  ...memfs,
  realpathSync(fileOrFolderPath, options) {
    if (path.resolve(fileOrFolderPath) === "/") {
      return "/";
    }
    return memfs.realpathSync(fileOrFolderPath, options);
  },
  chmodSync(..._args) {
    // no-op
  },
};
