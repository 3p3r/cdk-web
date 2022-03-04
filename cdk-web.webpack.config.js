/* global imports versions */

const _ = require("lodash");
const path = require("path");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const PostBuildPlugin = require("./webpack/plugins/post-build-plugin");
const empty = require("./webpack/loaders/empty-loader");
const { __ROOT, __DEBUG } = require("./webpack/common");
const generateEntrypoint = require("./webpack/generate-entrypoint");
const override = require("./webpack/loaders/override-loader");
const nulled = require("./webpack/empty");
const os = require("./webpack/os");

generateEntrypoint();

module.exports = {
  node: {
    os: true,
    dns: "mock",
    tls: "mock",
    net: "mock",
    zlib: true,
    path: true,
    http: true,
    https: true,
    stream: true,
    console: true,
    process: "mock",
    child_process: "empty",
  },
  ...(__DEBUG
    ? {
        mode: "development",
        devtool: "inline-source-map",
        devServer: {
          filename: "cdk-web.js",
          contentBase: "./dist",
        },
      }
    : {
        mode: "production",
        optimization: {
          minimize: true,
          minimizer: [
            new UglifyJsPlugin({
              cache: false,
              uglifyOptions: {
                keep_classnames: true,
                keep_fnames: true,
                comments: "@license",
                compress: false,
                mangle: false,
              },
            }),
          ],
        },
      }),
  cache: false,
  entry: "./index.generated.js",
  output: {
    filename: "cdk-web.js",
    path: path.resolve(__ROOT, "dist"),
  },
  resolve: {
    extensions: [".js"],
    alias: {
      fs: "memfs",
      os: os.Module,
      promptly: nulled.Module,
      "proxy-agent": nulled.Module,
    },
  },
  plugins: [
    new PostBuildPlugin(),
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      "process.versions.node": `"${process.versions.node}"`,
      "process.version": `"${process.version}"`,
    }),
  ],
  stats: {
    warningsFilter: [
      /webpack performance recommendations*/,
      /aws-lambda-(go|nodejs|python)/,
      /.*custom-resource.*/,
      /.*size limit.*/,
    ],
  },
  module: {
    rules: [
      {
        use: empty.Loader,
        test: empty.KeepTrack([
          /hotswap/,
          /node_modules\/aws-cdk\/lib\/plugin\.js$/,
          /node_modules\/aws-cdk\/lib\/api\/aws-auth\/aws-sdk-inifile\.js$/,
        ]),
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/fs-extra\/lib\/fs\/index\.js$/]),
        options: {
          search: "exports.realpath.native = u(fs.realpath.native)",
          replace: "",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk-lib\/core\/lib\/private\/token-map\.js$/]),
        options: {
          search: "=global",
          replace: "=window",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk\/lib\/api\/cloudformation-deployments\.js$/]),
        options: {
          search: "art instanceof cxapi.AssetManifestArtifact",
          replace: "art.file !== undefined",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk-lib\/cloudformation-include\/lib\/cfn-include\.js$/]),
        options: {
          search: "require(moduleName)",
          replace: "(window.CDK_WEB_REQUIRE || window.require)(moduleName)",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk\/lib\/logging\.js$/]),
        options: {
          multiple: [
            { search: /stream.write\(str.*/, replace: "console.log(str);" },
            {
              search: "exports.logLevel = LogLevel.DEFAULT;",
              replace: "exports.logLevel = LogLevel.TRACE;",
            },
          ],
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/cdk-assets\/lib\/private\/handlers\/files\.js$/]),
        options: {
          search: "Body: fs_1.createReadStream(publishFile.packagedPath),",
          replace: "Body: fs_1.readFileSync(publishFile.packagedPath, {encoding: 'utf-8'}),",
        },
      },
      {
        // regular expressions used in this module are not Safari-compatible. sources:
        // https://stackoverflow.com/q/51568821/388751
        // https://caniuse.com/js-regexp-lookbehind
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk-lib\/node_modules\/@balena\/dockerignore\/ignore\.js$/]),
        options: {
          multiple: [
            {
              search: /const REGEX_TRAILING_SLASH = .*;/,
              replace: "const REGEX_TRAILING_SLASH = new RegExp();",
            },
            {
              search: /const REGEX_TRAILING_BACKSLASH = .*;/,
              replace: "const REGEX_TRAILING_BACKSLASH = new RegExp();",
            },
          ],
        },
      },
    ],
  },
};
