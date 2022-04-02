const memfs = require("memfs");

module.exports = { ...memfs };
module.exports.Module = __filename;
globalThis.fs = memfs;
