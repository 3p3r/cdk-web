const fs = require("fs");
const path = require("path");
const { __ROOT, getModules, getAssets } = require("./common");

const ENTRYPOINT_SRC = path.resolve(__ROOT, "webpack/modules/entrypoint.js");
const ENTRYPOINT_DST = path.resolve(__ROOT, "webpack/modules/entrypoint.generated.js");

module.exports = function generateEntrypoint() {
  const entryPoint = fs.readFileSync(ENTRYPOINT_SRC, "utf8");
  const modules = getModules()
    .map((packageName) => `module.exports['${packageName}'] = require('${packageName}');`)
    .join("\n");
  const versions = JSON.stringify({
    constructs: require("constructs/package.json").version,
    "aws-cdk-lib": require("aws-cdk-lib/package.json").version,
    "aws-cdk": require("aws-cdk/package.json").version,
    "cdk-web": require("../package.json").version,
  });
  const assets = getAssets()
    .map(({ code, path }) => `"${path}": ${JSON.stringify({ path, code })}`)
    .join(",");
  const entryPointText = entryPoint
    .replace(
      "const STATICS = {};",
      `const STATICS = {
          versions: ${versions},
          assets: {${assets}},
        };`
    )
    .replace("// exports", modules);

  fs.writeFileSync(ENTRYPOINT_DST, entryPointText, { encoding: "utf-8" });
};

module.exports.ENTRYPOINT_PATH = ENTRYPOINT_DST;
