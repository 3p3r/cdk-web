const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const debug = require("debug")("CdkWeb:PostBuildPlugin");
const { Generator: TypingsGenerator } = require("npm-dts");
const { __ROOT, __DEBUG, __SERVER } = require("../common");

module.exports = class PostBuildPlugin {
  async postBuildActions() {
    debug("copying the bundle out for playground React app");
    shell.cp(path.resolve(__ROOT, "dist/cdk-web.js"), path.resolve(__ROOT, "public"));
    debug("generating typings");
    const generator = new TypingsGenerator(
      {
        entry: path.resolve(__ROOT, "index.generated.ts"),
        logLevel: "debug",
      },
      __DEBUG /* enable logs */,
      true /* throw error */
    );
    await generator.generate();
    debug("post processing typings");
    const typingsFile = path.resolve(__ROOT, "index.d.ts");
    debug("reading typings unprocessed file as text");
    const typingsFileText = await fs.promises.readFile(typingsFile, { encoding: "utf-8" });
    debug("writing typings back to disk");
    await fs.promises.writeFile(
      typingsFile,
      typingsFileText
        .replace(/declare.*\.d\..*$\n.*\n}/gm, "")
        .replace(/.*sourceMappingURL.*/g, "")
        .replace("export = main;", "export = main; global { interface Window { require: typeof main.pseudoRequire; }}"),
      { encoding: "utf-8" }
    );
  }

  apply(compiler) {
    debug("setting up post build actions");
    if (__SERVER) {
      debug("post build actions are skipped in dev server mode");
      return;
    }
    compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
      setTimeout(() =>
        this.postBuildActions()
          .then(() => {
            debug("postBuildActions finished");
          })
          .catch((err) => {
            debug("postBuildActions failed: %o", err);
            process.exit(1);
          })
      );
    });
  }
};
