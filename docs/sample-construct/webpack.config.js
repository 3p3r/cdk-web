const path = require("path");

module.exports = {
  node: { global: true },
  mode: "development",
  entry: "./sample-web-construct.js",
  output: {
    path: __dirname,
    filename: "bundle.js",
    library: {
      name: "sample-web-construct",
      type: "umd",
    },
  },
  resolve: {
    alias: {
      "cdk-web": path.resolve(__dirname, "utils/browser-cdk.js"),
      "aws-sdk": path.resolve(__dirname, "utils/browser-aws.js"),
    },
  },
  devServer: {
    static: [
      { directory: path.join(__dirname, "public") },
      { directory: path.join(__dirname, "node_modules/aws-sdk/dist") },
      { directory: path.join(__dirname, "node_modules/cdk-web/dist") },
    ],
    compress: true,
    port: 9000,
  },
};
