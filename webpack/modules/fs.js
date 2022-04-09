const memfs = require("memfs");

module.exports = { ...memfs };
globalThis.fs = memfs;
