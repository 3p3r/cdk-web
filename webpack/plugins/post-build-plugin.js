const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const empty = require("../loaders/empty-loader");
const debug = require("debug")("CdkWeb:PostBuildPlugin");
const { Generator: TypingsGenerator } = require("npm-dts");
const { __ROOT, __DEBUG, __SERVER, MakeSureReplaced } = require("../common");
const override = require("../loaders/override-loader");
const copyDeclarations = require("../copy-declarations");

module.exports = class PostBuildPlugin {
  async postBuildActions() {
    debug("copying the bundle out for playground React app");
    shell.cp(path.resolve(__ROOT, "dist/cdk-web.js"), path.resolve(__ROOT, "public"));
    debug("generating typings");
    shell.mkdir("-p", path.resolve(__ROOT, "types"));
    await Promise.all(
      ["aws-sdk", "aws-cdk-lib", "constructs"].map((m) =>
        copyDeclarations(
          path.resolve(__ROOT, `node_modules/${m}`),
          path.resolve(__ROOT, `types/${m}`),
          !__DEBUG /* overwrite? */
        )
      )
    );
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
      new MakeSureReplaced(typingsFileText)
        .do(/declare.*\.d\..*$\n.*\n}/gm, "")
        .do(/.*sourceMappingURL.*/g, "")
        .do("export = main;", "export = main; global { interface Window { require: typeof main.pseudoRequire; }}")
        .do(/import\("aws-cdk-lib/g, 'import("./types/aws-cdk-lib')
        .do(/import\("constructs/g, 'import("./types/constructs/lib')
        .do(/import\("aws-sdk/g, 'import("./types/aws-sdk')
        .do(/import \{ (.*) \} from \"aws-cdk\/.*;/g, "type $1 = any;")
        .do('import cdk = require("aws-cdk-lib");', "namespace cdk { type StageSynthesisOptions = any }")
        .value,
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
      debug("making sure all override loaders did their thing");
      override.KeepTrack();
      debug("making sure all empty loaders did their thing");
      empty.KeepTrack();
      setTimeout(() =>
        this.postBuildActions()
          .then(() => {
            debug("postBuildActions finished");
          })
          .catch((err) => {
            debug("postBuildActions failed: %o", err);
            throw err;
          })
      );
    });
  }
};
