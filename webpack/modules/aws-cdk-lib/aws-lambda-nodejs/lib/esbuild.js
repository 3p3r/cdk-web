function WasmExec() {
  globalThis.fs = require("fs");
  globalThis.process = require("process");
  if (typeof window === "undefined") {
    eval(`
      globalThis.TextEncoder = require("util").TextEncoder;
      globalThis.TextDecoder = require("util").TextDecoder;
      globalThis.performance = {
        now() {
          const [sec, nsec] = process.hrtime();
          return sec * 1000 + nsec / 1000000;
        },
      };
      const crypto = require("crypto");
      globalThis.crypto = {
        getRandomValues(b) {
          crypto.randomFillSync(b);
        },
      };
    `);
  }
  require("esbuild-wasm/wasm_exec");
  const GoClass = Go;
  delete globalThis.Go;
  return GoClass;
}

class EsBuild extends WasmExec() {
  constructor(fetch) {
    super();
    this.fetch = fetch;
  }
  /**
   * Load the esbuild.wasm file as a singleton
   */
  async load() {
    EsBuild.prototype.loading = true;
    const response = await this.fetch();
    EsBuild.prototype.wasm = await response.arrayBuffer();
    EsBuild.prototype.loading = false;
  }
  /**
   * Load or wait for our esbuild.wasm to be loaded as a singleton
   * @returns boolean
   */
  async loaded() {
    if (this.wasm) {
      return true;
    }
    if (!this.loading) {
      await this.load();
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.loaded();
  }

  async command(args) {
    this.argv = ["esbuild", ...args];
    const res = await super.run((await WebAssembly.instantiate(this.wasm, this.importObject)).instance);
    return res;
  }
  /**
   *
   * @param {Object} args
   * @param {string[]} args.entryPoints
   * @param {string} args.outdir
   */
  async build(args) {
    await this.loaded();
    return await this.command([
      ...args.entryPoints,
      `--outdir=${args.outdir}`,
      ...(args.bundle ? ["--bundle"] : []), // "--bundle",
      ...(args.minify ? ["--minify"] : []), // "--minify",
      ...(args.sourcemap ? [`--sourcemap=${args.sourcemap}`] : []), // "--sourcemap=inline",
    ]);
  }
}
module.exports = { EsBuild };
