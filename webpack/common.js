const path = require("path");

const __ROOT = path.resolve(__dirname, "..");
const __DEBUG = process.env.CDK_WEB_DEBUG !== undefined;
const __SERVER = process.env.WEBPACK_DEV_SERVER !== undefined;

module.exports = { __ROOT, __DEBUG, __SERVER };
