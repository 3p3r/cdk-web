const fs = require("fs");
const path = require("path");
const empty = require("../loaders/empty-loader");
const debug = require("debug")("CdkWeb:PostBuildPlugin");
const { Generator: TypingsGenerator } = require("npm-dts");
const { __ROOT, __DEBUG, __SERVER, MakeSureReplaced, getModules } = require("../common");
const override = require("../loaders/override-loader");
const copyDeclarations = require("../copy-declarations");

module.exports = class PostBuildPlugin {
  async postBuildActions() {
    debug("copying the bundle out for playground React app");
    fs.copyFileSync(path.resolve(__ROOT, "dist/cdk-web.js"), path.resolve(__ROOT, "public/cdk-web.js"));
    copyEsBuildWasm();
    debug("generating typings");
    fs.mkdirSync(path.resolve(__ROOT, "types"), { recursive: true });
    await Promise.all(
      ["aws-cdk-lib", "constructs"].map((m) =>
        copyDeclarations(
          path.resolve(__ROOT, `node_modules/${m}`),
          path.resolve(__ROOT, `types/${m}`),
          !__DEBUG /* overwrite? */
        )
      )
    );
    const generator = new TypingsGenerator(
      {
        entry: path.resolve(__ROOT, "index.generated.js"),
        tsc: `-p ${path.resolve(__ROOT, "cdk-web.tsconfig.json")}`,
        logLevel: "debug",
      },
      __DEBUG /* enable logs */,
      true /* throw error */
    );
    await generator.generate();
    debug("post processing typings");
    const typingsFile = path.resolve(__ROOT, "index.d.ts");
    debug("reading typings unprocessed file as text");
    const typingsFileText = [
      '/// <reference types="node" />',
      '/// <reference types="aws-sdk" />',
      await fs.promises.readFile(typingsFile, { encoding: "utf-8" }),
    ].join("\n");
    debug("writing typings back to disk");
    await fs.promises.writeFile(
      typingsFile,
      new MakeSureReplaced(typingsFileText)
        .do(/.*sourceMappingURL.*/g, "")
        .do(/declare.*\.d\..*$\n.*\n}/gm, "")
        .do(/import { ([^}]+) } from "aws-cdk.*;/g, "type $1 = any;")
        .do('import cdk = require("aws-cdk-lib");', "namespace cdk { type StageSynthesisOptions = any }")
        .do("export = main;", "export = main; global { interface Window { CDK: typeof main; }}")
        .do(/import\("(construct[^"]+)"\);/g, 'import("./types/$1/lib");')
        .do(/import\("((aws)[^"]+)"\);/g, 'import("./types/$1");')
        .do(/EventEmitter2/g, 'EventEmitter')
        .do(/eventemitter2/g, 'events')
        .do(
          "static require(name: any, autoInit?: boolean): any;",
          `static require(name: any, autoInit?: boolean): any;
           static require(name: "constructs", autoInit?: boolean): typeof import("./types/constructs/lib");
         ${getModules()
           .filter((m) => m.startsWith("aws-cdk"))
           .map(
             (m) => `
           static require(name: "${m}", autoInit?: boolean): typeof import("./types/${m}");
         `
           )
           .join("\n")}`
        ).value,
      { encoding: "utf-8" }
    );
  }

  apply(compiler) {
    debug("setting up post build actions");
    if (__SERVER) {
      debug("post build actions are skipped in dev server mode");
      return;
    }
    compiler.hooks.afterEmit.tapPromise("AfterEmitPlugin", async () => {
      debug("making sure all override loaders did their thing");
      override.KeepTrack();
      debug("making sure all empty loaders did their thing");
      empty.KeepTrack();
      try {
        await this.postBuildActions();
        debug("postBuildActions finished");
      } catch (err) {
        debug("postBuildActions failed: %o", err);
        throw err;
      }
    });
  }
};

function copyEsBuildWasm() {
  debug("copying esbuild to dist");
  const esbuildRoot = path.resolve(require.resolve("esbuild-wasm"), "../..");
  fs.copyFileSync(path.resolve(esbuildRoot, "esbuild.wasm"), path.resolve(__ROOT, "dist/esbuild.wasm"));
  debug("copying esbuild to playground");
  fs.copyFileSync(path.resolve(esbuildRoot, "esbuild.wasm"), path.resolve(__ROOT, "public/esbuild.wasm"));
}
