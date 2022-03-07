/* global imports versions */

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const debug = require("debug")("CdkWeb:GenerateEntrypoint");
const { __ROOT } = require("./common");

const getModules = _.memoize(() => {
  const { stdout: folders } = shell.exec(`find -type d -maxdepth 1`, {
    cwd: path.resolve(__ROOT, `node_modules/${"aws-cdk-lib"}`),
    silent: true,
  });
  const paths = [
    "fs",
    "path",
    "aws-sdk",
    "constructs",
    "aws-cdk-lib",
    ...folders
      .trim()
      .split("\n")
      .map((p) => p.replace("./", `${"aws-cdk-lib"}/`))
      .filter((m) => m !== ".")
      .filter((m) =>
        _.chain(() => require.resolve(m))
          .attempt()
          .isError()
      ),
  ].filter((m) => {
    try {
      require(m);
      debug("[x] %s", m);
      return true;
    } catch (err) {
      debug("[ ] %s", m);
      return false;
    }
  });
  return paths;
});

const getAssets = _.memoize(() => {
  const libCwd = path.resolve(__ROOT, "node_modules/aws-cdk-lib");
  const findJsonCmd = "find -wholename './**/*.json' | awk '!/node/ && !/.vscode/ && !/jsii/'";
  const { stdout: libAssets } = shell.exec(findJsonCmd, { silent: true, cwd: libCwd });
  const findYamlCmd = "find -wholename './**/*.yaml' | awk '!/node/ && !/.vscode/ && !/jsii/'";
  const cliCwd = path.resolve(__ROOT, "node_modules/aws-cdk");
  const { stdout: cliAssets } = shell.exec(findYamlCmd, { silent: true, cwd: cliCwd });
  const postProcess = (assets, cwd) =>
    assets
      .trim()
      .split("\n")
      .map((module) => ({
        path: `/${path.basename(module)}`,
        code: fs.readFileSync(path.resolve(cwd, module), {
          encoding: "utf-8",
        }),
      }));
  const assets = [...postProcess(cliAssets, cliCwd), ...postProcess(libAssets, libCwd)];
  assets.push({
    path: "/cdk.json",
    code: JSON.stringify(
      {
        app: "index.js",
        context: {
          "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
          "@aws-cdk/core:stackRelativeExports": true,
          "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
          "@aws-cdk/aws-lambda:recognizeVersionProps": true,
          "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
          "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
          "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
          "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
        },
      },
      null,
      2
    ),
  });
  return assets;
});

const entryPoint = function () {
  const STATICS = {};
  const os = require("os");
  const fs = require("fs");
  const { modules } = STATICS;
  const allModules = Object.keys(modules);
  let initialized = false;
  class CdkWeb {
    get PseudoCli() {
      return require("./cdk-web-cli");
    }
    get version() {
      return STATICS.versions;
    }
    get modules() {
      return STATICS.modules;
    }
    require(name, autoInit = true) {
      autoInit && this.init();
      if (!allModules.includes(name)) throw new Error(`module not found: ${name}`);
      else return this.modules[name];
    }
    init() {
      if (initialized) return;
      if (!fs.existsSync(os.tmpdir())) fs.mkdirSync(os.tmpdir());
      Object.keys(STATICS.assets)
        .filter((asset) => !fs.existsSync(STATICS.assets[asset].path))
        .forEach((asset) => fs.writeFileSync(STATICS.assets[asset].path, STATICS.assets[asset].code));
      initialized = true;
    }
    free() {
      if (!initialized) return;
      if (fs.existsSync(os.tmpdir())) fs.rmdirSync(os.tmpdir());
      Object.keys(STATICS.assets)
        .filter((asset) => fs.existsSync(STATICS.assets[asset].path))
        .forEach((asset) => fs.rmSync(STATICS.assets[asset].path));
      initialized = false;
    }
  }
  const LIBRARY = new CdkWeb();
  module.exports = LIBRARY;
};

module.exports = function generateEntrypoint() {
  const modules = getModules()
    .map((packageName) => `"${packageName}": require("${packageName}")`)
    .join(",");
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
    .toString()
    // removes surrounding function declaration
    .match(/function[^{]+\{([\s\S]*)\}$/)[1]
    .replace(
      "const STATICS = {};",
      `const STATICS = {
          modules: {${modules}},
          versions: ${versions},
          assets: {${assets}},
        };`
    );

  const entryPointPath = path.resolve(__ROOT, "index.generated.js");
  fs.writeFileSync(entryPointPath, entryPointText, { encoding: "utf-8" });
};
