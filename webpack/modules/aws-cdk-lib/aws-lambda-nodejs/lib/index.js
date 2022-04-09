const original = require("../../../../../node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/types");
const { NodejsFunction } = require("./function");
module.exports = { ...original, NodejsFunction };
