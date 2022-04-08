const lambda = require("../../../../../node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/index.js");
const { NodejsFunction } = require("./lambda");
const { Bundling } = require("./bundling");

module.exports = {
  ...lambda,
  NodejsFunction,
  Bundling,
};
