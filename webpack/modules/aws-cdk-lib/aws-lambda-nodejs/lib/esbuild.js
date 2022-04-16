const _ = require("../../../utils");

function WasmExec() {
  globalThis.fs = require("fs");
  globalThis.process = require("process");
  const initializer = _.ternary(
    typeof window === "undefined",
    () =>
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
`),
    _.noop
  );
  initializer();
  require("esbuild-wasm/wasm_exec");
  const GoClass = Go;
  delete globalThis.Go;
  return GoClass;
}

let WORK = null;

class EsBuild extends WasmExec() {
  constructor(fetch) {
    super();
    this.fetch = fetch;
  }

  load() {
    return _.get(
      WORK,
      (WORK = this.fetch()
        .then((response) => response.arrayBuffer())
        .then((wasm) => {
          this.wasm = wasm;
        }))
    );
  }

  async command(args) {
    this.argv = ["esbuild", ...args];
    const res = await super.run((await WebAssembly.instantiate(this.wasm, this.importObject)).instance);
    return res;
  }

  async build(args) {
    await this.load();
    return await this.command([
      ...args.entryPoints,
      `--outdir=${args.outdir}`,
      ..._.ternary(!!args.bundle, ["--bundle"], []), // "--bundle",
      ..._.ternary(!!args.minify, ["--minify"], []), // "--minify",
      ..._.ternary(!!args.sourcemap, [`--sourcemap=${args.sourcemap}`], []), // "--sourcemap=inline"
    ]);
  }
}
module.exports = { EsBuild };
