const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const assert = require("assert");
const debug = require("debug")("CdkWeb:Common");
const { default: ignore } = require("ignore");

const __ROOT = path.resolve(__dirname, "..");
const __DEBUG = process.env.CDK_WEB_DEBUG !== undefined;
const __SERVER = process.env.WEBPACK_DEV_SERVER !== undefined;
const Constants = { __ROOT, __DEBUG, __SERVER };
debug("constants: %o", JSON.stringify(Constants));

const ig = ignore().add(
  fs.readFileSync(path.resolve(__ROOT, "bundle.ignore"), { encoding: "utf-8" }).trim().split("\n")
);

class MakeSureReplaced {
  static debug = require("debug")("CdkWeb:MakeSureReplaced");
  constructor(inputValue = "") {
    this.value = inputValue;
  }
  do = (searchValue, replaceValue) => {
    MakeSureReplaced.debug("trying to replace %o with %o", searchValue, replaceValue);
    MakeSureReplaced.debug("input: %s", _.truncate(this.value));
    const processed = this.value.replace(searchValue, replaceValue);
    assert.ok(
      processed !== this.value && typeof processed === typeof this.value,
      `failed for: ${JSON.stringify({ inputValue: this.value, searchValue, replaceValue })}`
    );
    return new MakeSureReplaced(processed);
  };
}

class PathTracker {
  static debug = require("debug")("CdkWeb:PathTracker");
  patterns = [];

  track = (patterns) => {
    if (patterns) {
      patterns = _.isArray(patterns) ? patterns : [patterns];
      PathTracker.debug("tracking: %o", patterns);
      this.patterns = this.patterns.concat(...patterns);
      return patterns;
    } else {
      PathTracker.debug("patterns: %o", this.patterns);
      assert.ok(this.patterns.length === 0, "tracker is dirty");
    }
  };

  check = (resourcePath) => {
    PathTracker.debug("checking for: %o against %o", resourcePath, this.patterns);
    if (this.patterns.length > 0) this.patterns = this.patterns.filter((pattern) => resourcePath.search(pattern) < 0);
  };
}

const getModules = _.memoize(() => {
  const exports = Object.keys(require("aws-cdk-lib/package.json").exports);
  const paths = ["fs", "path", "constructs", ...exports.map((p) => p.replace(/^\.(\/?)/, "aws-cdk-lib$1"))]
    .filter((m) => {
      try {
        require(m);
        debug("[x] %s", m);
        return true;
      } catch (err) {
        debug("[ ] %s", m);
        return false;
      }
    })
    .filter((m) => !ig.ignores(m));
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

module.exports = { ...Constants, MakeSureReplaced, PathTracker, getAssets, getModules };
