const fs = require("fs");
const path = require("path");
const debug = require("debug")("CdkWeb:PreBuildPlugin");
const PrebuildPlugin = require("prebuild-webpack-plugin");
const { __ROOT } = require("../common");

module.exports = new PrebuildPlugin({
  build: (compiler, compilation, matchedFiles) => {
    debug("copying esbuild to dist");
    const esbuildRoot = path.resolve(require.resolve("esbuild-wasm"), "../..");
    fs.copyFileSync(path.resolve(esbuildRoot, "esbuild.wasm"), path.resolve(__ROOT, "dist/esbuild.wasm"));
    debug("copying esbuild to playground");
    fs.copyFileSync(path.resolve(esbuildRoot, "esbuild.wasm"), path.resolve(__ROOT, "public/esbuild.wasm"));
    debug("copying esbuild go wasm binder to dist");
    fs.copyFileSync(
      path.resolve(esbuildRoot, "wasm_exec.js"),
      path.resolve(__ROOT, "webpack/modules/aws-cdk-lib/aws-lambda-nodejs/lib/go-wasm.js")
    );
  },
  // watch: (compiler, compilation, changedFile) => {
  // function that runs each time webpack rebuilds in dev mode. if `files.pattern` is provided,
  // this function will only fire if the most recently changed file matches the specified pattern
  // },
  // the files object allows for file matching, providing an array
  // of matching files as the last parameter to the `build` option.
  // files: { pattern: "**/*.md", options: {}, addFilesAsDependencies: true },
});
