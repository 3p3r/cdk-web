const memfs = require("memfs");
const path = require("path");

const inBrowser = typeof window !== "undefined";
const hasExistingFileSystem = inBrowser && window.FS;

/** @type {typeof import("fs")} */
module.exports = hasExistingFileSystem
  ? window.FS
  : {
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
