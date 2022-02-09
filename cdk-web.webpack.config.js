/* global imports versions cfn_types_2_classes */

const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

const entryPointTemplate = function (window = {}) {
  const exportName = window.CDK_WEB_REQUIRE || "require";
  /* VERSION */
  /* IMPORTS */
  /* CFN_INCLUDE_FIX */
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.document !== "undefined"
    ) {
      const assert = require("assert");
      const fs = require("fs");
      fs.mkdirSync("/tmp", { recursive: true });
      fs.writeFileSync(
        "/cfn-types-2-classes.json",
        JSON.stringify(cfn_types_2_classes)
      );
      window[exportName] = (name) => {
        assert.ok(Object.keys(imports).includes(name), "Module not found.");
        return imports[name];
      };
      window[exportName].versions = versions;
    } else {
      module.exports = { ...imports, versions };
    }
  } catch (err) {
    console.error("FATAL: unable to launch CDK", err);
  }
};

const entryPointFunction = entryPointTemplate
  .toString()
  .replace(
    "/* IMPORTS */",
    `const imports = {\n${["aws-cdk-lib", "constructs", "path", "fs"]
      .concat(
        fs
          .readdirSync(path.resolve(__dirname, "node_modules/aws-cdk-lib"), {
            withFileTypes: true,
          })
          .filter((handle) => handle.isDirectory())
          .map((directory) => `aws-cdk-lib/${directory.name}`)
      )
      .filter((packageName) => {
        try {
          require(packageName);
          return true;
        } catch (err) {
          return false;
        }
      })
      .map((packageName) => `    "${packageName}": require("${packageName}")`)
      .join(",\n")}\n  };`
  )
  .replace(
    "/* VERSION */",
    `const versions = {
    "aws-cdk-web": ${JSON.stringify(require("./package.json").version)},
    "aws-cdk-lib": ${JSON.stringify(
      require("aws-cdk-lib/package.json").version
    )},
    "constructs": ${JSON.stringify(
      require("constructs/package.json").version
    )},\n  };`
  )
  .replace(
    "/* CFN_INCLUDE_FIX */",
    `const cfn_types_2_classes = ${fs.readFileSync(
      path.resolve(
        __dirname,
        "node_modules",
        "aws-cdk-lib/cloudformation-include/cfn-types-2-classes.json"
      )
    )}\n`
  );

const entryPointPath = path.resolve(__dirname, "index.generated.js");
const entryPointText = `;${[
  `/* Auto Generated - DO NOT EDIT - time: ${Date.now()} */`,
  'require("idempotent-babel-polyfill")',
  `(${entryPointFunction.toString()})(window)`,
  `/* Auto Generated - DO NOT EDIT - time: ${Date.now()} */`,
].join(";\n")};\n`;

fs.writeFileSync(entryPointPath, entryPointText, { encoding: "utf-8" });

module.exports = {
  node: {
    net: "mock",
    path: true,
    process: "mock",
    console: "mock",
    child_process: "empty",
  },
  mode: "production",
  cache: false,
  entry: "./index.generated.js",
  devtool: "inline-source-map",
  output: {
    filename: "cdk-web.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".js"],
    alias: {
      fs: "memfs",
    },
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      "process.versions.node": `"${process.versions.node}"`,
      "process.version": `"${process.version}"`,
    }),
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
          console.log(); // leave this for an empty line
          console.log("copying the bundle out for playground React app");
          shell.cp(
            path.resolve(__dirname, "dist/cdk-web.js"),
            path.resolve(__dirname, "public")
          );
        });
      },
    },
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        cache: false,
        uglifyOptions: {
          keep_classnames: true,
          keep_fnames: true,
          compress: false,
          mangle: false,
        },
      }),
    ],
  },
  stats: {
    warningsFilter: [
      // custom resources need bootstraps and aren't supported anyway
      /.\/node_modules\/aws-cdk-lib\/custom-resources\/lib\/aws-custom-resource*/,
      // all aws-lambda-* modules require native access to do their job correctly and aren't supported anyway
      /.\/node_modules\/aws-cdk-lib\/aws-lambda-*/,
      // cdk-web is not a conventional bundle and it should be lazy loaded, ignore this stuff
      /webpack performance recommendations*/,
      / * size limit */,
    ],
  },
  module: {
    rules: [
      {
        test: /node_modules\/aws-cdk-lib\/cloudformation-include\/lib\/cfn-include\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require(moduleName)",
          replace: "(window.CDK_WEB_REQUIRE || window.require)(moduleName)",
        },
      },
    ],
  },
};
