const _ = require("../../../utils");
const WasmExec = require("esbuild-wasm/wasm_exec");
const isNode =
  typeof process !== "undefined" && typeof window === "undefined" && process.version && process.versions.node;
const nodeRequire = isNode && eval("require");
const proc = require("../../../process");
const crypto = isNode ? nodeRequire("crypto") : require("crypto");
const fs = require("../../../fs");

const Go = WasmExec({
  TextDecoder: isNode ? nodeRequire("util").TextDecoder : TextDecoder,
  TextEncoder: isNode ? nodeRequire("util").TextEncoder : TextEncoder,
  crypto: {
    getRandomValues(b) {
      crypto.randomFillSync(b);
    },
  },
  performance: isNode
    ? eval("performance")
    : {
        now() {
          const [sec, nsec] = proc.hrtime();
          return sec * 1000 + nsec / 1000000;
        },
      },
  process: proc,
  fs,
});

let WORK = null;

class EsBuild extends Go {
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
