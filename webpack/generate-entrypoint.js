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

const entryPointLibrary = function (window = {}) {
  try {
    /* ASSETS */ //  <- json assets required at runtime by cdk to exist on disk memfs
    /* VERSION */ // <- version of libraries transpiled and exported from this module
    /* IMPORTS */ // <- a list of all calls to cdk "require(...)"s so we can reexport
    const exportName = window.CDK_WEB_REQUIRE || "require";
    const exportFunc = (name) => {
      if (!Object.keys(imports).includes(name)) throw new Error(`module not found: ${name}`);
      else return imports[name];
    };
    imports["aws-cdk"] = require("./cdk-web-cli");
    exportFunc.versions = versions;
    window[exportName] = exportFunc;
  } catch (err) {
    console.error("FATAL: unable to launch cdk web", err);
  }
};

module.exports = function generateEntrypoint() {
  const entryPointFunction = entryPointLibrary
    .toString()
    .replace(
      "/* IMPORTS */",
      `const imports = {
        ${getModules()
          .map((packageName) => `"${packageName}": require("${packageName}")`)
          .join(",")}
      };`
    )
    .replace(
      "/* VERSION */",
      `const versions = {
        "cdk-web": ${JSON.stringify(require("../package.json").version)},
        "aws-sdk": ${JSON.stringify(require("aws-sdk/package.json").version)},
        "constructs": ${JSON.stringify(require("constructs/package.json").version)},
        "aws-cdk-lib": ${JSON.stringify(require("aws-cdk-lib/package.json").version)}
      };`
    )
    .replace(
      "/* ASSETS */",
      `const assets = {
        ${getAssets()
          .map(({ code, path }) => `"${path}": ${JSON.stringify({ path, code })}`)
          .join(",\n")}
      };
      const os = require("os");
      const fs = require("fs");
      if (!fs.existsSync(os.tmpdir())) fs.mkdirSync(os.tmpdir());
      Object.keys(assets)
        .filter((asset) => !fs.existsSync(assets[asset].path))
        .forEach((asset) => fs.writeFileSync(assets[asset].path, assets[asset].code));`
    );

  const entryPointPath = path.resolve(__ROOT, "index.generated.js");
  const entryPointText = `;require("idempotent-babel-polyfill");(${entryPointFunction.toString()})(window);`;
  fs.writeFileSync(entryPointPath, entryPointText, { encoding: "utf-8" });
  fs.writeFileSync(
    path.resolve(__ROOT, "index.generated.ts"),
    getModules()
      .filter((n) => !["path", "fs"].includes(n))
      .map((packageName) => `function pseudoRequire(module: "${packageName}"): typeof import("${packageName}")`)
      .concat(
        'function pseudoRequire(module: "aws-cdk"): typeof import("./cdk-web-cli")',
        "function pseudoRequire(module: string): any { /* empty */ }",
        "pseudoRequire.versions = { 'cdk-web': 0, 'aws-cdk-lib': 0, 'aws-sdk': 0, constructs: 0 };"
      )
      .join(";\n"),
    { encoding: "utf-8" }
  );
};
