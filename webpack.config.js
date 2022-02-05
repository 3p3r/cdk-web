const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

const entryPointTemplate = function (window = {}) {
  const assert = require("assert");
  const mkdirp = require("mkdirp");
  const rimraf = require("rimraf");
  rimraf.sync("/tmp");
  mkdirp.sync("/tmp");
  /* IMPORTS */
  window.require = (name) => {
    assert.ok(Object.keys(imports).includes(name), "Module not found.");
    return imports[name];
  };
};

const entryPointFunction = entryPointTemplate.toString().replace(
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
        return require(packageName), true;
      } catch (err) {
        return false;
      }
    })
    .map((packageName) => `    "${packageName}": require("${packageName}")`)
    .join(",\n")}\n  };`
);

const entryPointPath = path.resolve(__dirname, "index.generated.js");
const entryPointText = `;${[
  `/* Auto Generated - DO NOT EDIT - time: ${Date.now()} */`,
  'require("babel-polyfill")',
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
};
