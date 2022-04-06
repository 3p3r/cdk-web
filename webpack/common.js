const _ = require("lodash");
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const assert = require("assert");
const cxapi = require("@aws-cdk/cx-api");
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
    const processed =
      "function" === typeof replaceValue ? replaceValue(searchValue) : this.value.replace(searchValue, replaceValue);
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
  const libAssets = glob.sync(path.resolve(libCwd, "**/*.json"));
  const cliCwd = path.resolve(__ROOT, "node_modules/aws-cdk");
  const cliAssets = glob.sync(path.resolve(cliCwd, "**/*.yaml"));
  const postProcess = (assets, cwd) =>
    assets
      .filter(
        (module) =>
          !["node_modules", "jsii", "package.json", "package-lock.json"]
            .map((ex) => path.relative(cwd, module).includes(ex))
            .some((res) => res === true)
      )
      .map((module) => ({
        path: `/cdk/${path.basename(module)}`,
        code: (() => {
          const content = fs.readFileSync(module, { encoding: "utf-8" });
          try {
            return JSON.stringify(JSON.parse(content));
          } catch {
            return content;
          }
        })(),
      }));
  const assets = [...postProcess(cliAssets, cliCwd), ...postProcess(libAssets, libCwd)];
  const context = { ...cxapi.NEW_PROJECT_DEFAULT_CONTEXT };
  Object.entries(cxapi.FUTURE_FLAGS)
    .filter(([k, _]) => !cxapi.FUTURE_FLAGS_EXPIRED.includes(k))
    .forEach(([k, v]) => (context[k] = v));
  assets.push({ path: "/cdk/cdk.json", code: JSON.stringify({ app: "index.html", context }) });
  return assets;
});

const crossPlatformPathRegExp = (path = "node_modules/...") => new RegExp(`${path.split("/").join("(/|\\|\\\\)")}$`);

module.exports = { ...Constants, MakeSureReplaced, PathTracker, getAssets, getModules, crossPlatformPathRegExp };
