const path = require("path");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  node: {
    fs: "empty",
    net: "mock",
    path: true,
    process: "mock",
    console: "mock",
    child_process: "empty",
  },
  mode: "production",
  cache: false,
  entry: "./index.js",
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
