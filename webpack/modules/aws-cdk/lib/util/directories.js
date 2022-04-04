const directories = require("../../../../../node_modules/aws-cdk/lib/util/directories");

module.exports = { ...directories, rootDir: () => "/" };
