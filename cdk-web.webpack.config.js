/* global imports versions */

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const assert = require("assert");
const webpack = require("webpack");
const ignore = require("gitignore-parser");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

const exportIgnore = ignore.compile(fs.readFileSync(path.resolve(__dirname, ".gitignore.export"), "utf8"));
const nulledIgnore = ignore.compile(fs.readFileSync(path.resolve(__dirname, ".gitignore.nulled"), "utf8"));
const localizePackagePath = _.memoize((packagePath = "") =>
  path.isAbsolute(packagePath)
    ? path.relative(path.resolve(__dirname, "node_modules"), packagePath)
    : packagePath.replace(/^\.\/node_modules\//, "")
);
const shouldUseNullLoader = _.memoize((packagePath = "") => nulledIgnore.denies(localizePackagePath(packagePath)));
const shouldExportInclude = _.memoize((packagePath = "") => exportIgnore.accepts(localizePackagePath(packagePath)));
const getAllModulePaths = _.memoize((packageName = "") => {
  const { stdout: files } = shell.exec(
    `find ./node_modules/${packageName} -type f -iname '*.json' -o -type f -iname '*.js'`,
    { silent: true }
  );
  const { stdout: folders } = shell.exec(`find . -type d`, {
    cwd: path.resolve(__dirname, `node_modules/${packageName}`),
    silent: true,
  });
  const paths = [
    ...folders
      .trim()
      .split("\n")
      .map((p) => p.replace("./", `${packageName}/`)),
    ...files.trim().split("\n"),
    packageName,
  ].filter(shouldExportInclude);
  return _.uniq(paths);
});

function getAssets() {
  const assets = getAllModulePaths("aws-cdk-lib")
    .filter(shouldExportInclude)
    .filter((p) => p.endsWith(".json"))
    .map((module) => ({
      path: module,
      name: path.basename(module),
      code: fs.readFileSync(path.resolve(__dirname, module), {
        encoding: "utf-8",
      }),
    }));
  return assets;
}

const entryPointTemplate = function (window = {}) {
  const exportName = window.CDK_WEB_REQUIRE || "require";
  try {
    /* VERSION */
    /* IMPORTS */
    if (typeof window !== "undefined" && typeof window.document !== "undefined") {
      window[exportName] = (name) => {
        if (!Object.keys(imports).includes(name)) throw new Error(`cdk module not found: ${name}`);
        else return imports[name];
      };
      window[exportName].versions = versions;
    } else {
      module.exports = { ...imports, versions };
    }
    /* ASSETS */
  } catch (err) {
    delete window[exportName];
    console.error("FATAL: unable to launch CDK", err);
  }
};

const entryPointFunction = entryPointTemplate
  .toString()
  .replace(
    "/* IMPORTS */",
    `const imports = {\n${[
      ...["path", "fs"],
      ...getAllModulePaths("aws-cdk"),
      ...getAllModulePaths("aws-cdk-lib"),
      ...getAllModulePaths("constructs"),
    ]
      .filter((path) => {
        try {
          require(path);
          console.log(`[x] ${path}`);
          return true;
        } catch (err) {
          console.log(`[ ] ${path}`);
          return false;
        }
      })
      .map((packageName) => `    "${packageName}": require("${packageName}")`)
      .join(",")}};`
  )
  .replace(
    "/* VERSION */",
    `const versions = {
    "cdk-web": ${JSON.stringify(require("./package.json").version)},
    "aws-cdk": ${JSON.stringify(require("aws-cdk/package.json").version)},
    "aws-cdk-lib": ${JSON.stringify(require("aws-cdk-lib/package.json").version)},
    "constructs": ${JSON.stringify(require("constructs/package.json").version)},};`
  )
  .replace(
    "/* ASSETS */",
    `const assets = {
      ${getAllModulePaths("aws-cdk-lib")
        .filter(shouldExportInclude)
        .filter((p) => p.endsWith(".json"))
        .map((p) => `"${p}": ${JSON.stringify({ name: p, code: fs.readFileSync(p, { encoding: "utf-8" }) })}`)
        .join(",\n")}};
        const fs = require("fs");
        if (!fs.existsSync("/tmp")) fs.mkdirSync("/tmp");
        Object.keys(assets)
          .filter((asset) => !fs.existsSync(assets[asset].name))
          .forEach((asset) => fs.writeFileSync(assets[asset].name, JSON.stringify(assets[asset].code)));`
  );

const entryPointPath = path.resolve(__dirname, "index.generated.js");
const entryPointText = `;require("idempotent-babel-polyfill");(${entryPointFunction.toString()})(window);`;

fs.writeFileSync(entryPointPath, entryPointText, { encoding: "utf-8" });

module.exports = {
  node: {
    dns: "mock",
    tls: "mock",
    net: "mock",
    zlib: true,
    util: true,
    path: true,
    http: true,
    https: true,
    global: true,
    assert: true,
    buffer: true,
    crypto: true,
    process: "mock",
    console: "mock",
    child_process: "empty",
  },
  mode: "production",
  cache: false,
  entry: "./index.generated.js",
  output: {
    filename: "cdk-web.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".js"],
    alias: {
      fs: "memfs",
    },
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      "process.versions.node": `"${process.versions.node}"`,
      "process.version": `"${process.version}"`,
    }),
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
          console.log(); // leave this for an empty line
          console.log("copying the bundle out for playground React app");
          shell.cp(path.resolve(__dirname, "dist/cdk-web.js"), path.resolve(__dirname, "public"));
        });
      },
    },
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        cache: false,
        uglifyOptions: {
          keep_classnames: true,
          keep_fnames: true,
          comments: "@license",
          compress: false,
          mangle: false,
        },
      }),
    ],
  },
  stats: {
    warningsFilter: [
      // cdk-web is not a conventional bundle and it should be lazy loaded, ignore this stuff
      /webpack performance recommendations*/,
      / * size limit */,
    ],
  },

  module: {
    noParse: (resource) =>
      [
        "ansi-styles",
        "assert",
        "aws-cdk-lib/core/lib/private/token-map.js ",
        "aws-sdk",
        "bn.js",
        "brorand",
        "escodegen",
        "graceful-fs",
        "iconv-lite",
        "idempotent-babel-polyfill",
        "lodash",
        "memfs",
        "node-libs-browser",
        "pbkdf2",
        "randombytes",
        "randomfill",
        "raw-body",
        "readable-stream",
        "setimmediate",
        "source-map-support",
        "stream-http",
        "timers-browserify",
        "uuid",
        "yaml",
      ]
        .map((dep) => resource.includes(dep))
        .some((had) => had === true),
    rules: [
      {
        test: shouldUseNullLoader,
        use: "null-loader",
      },
      {
        test: /node_modules\/aws-cdk-lib\/core\/lib\/private\/token-map.js$/,
        loader: "string-replace-loader",
        options: {
          search: "=global",
          replace: "=window",
        },
      },
      {
        test: /node_modules\/aws-cdk-lib\/cloudformation-include\/lib\/cfn-include\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require(moduleName)",
          replace: "(window.CDK_WEB_REQUIRE || window.require)(moduleName)",
        },
      },
      {
        // regular expressions used in this module are not Safari-compatible. sources:
        // https://stackoverflow.com/q/51568821/388751
        // https://caniuse.com/js-regexp-lookbehind
        test: /node_modules\/aws-cdk-lib\/node_modules\/@balena\/dockerignore\/ignore\.js$/,
        loader: "string-replace-loader",
        options: {
          multiple: [
            {
              search: /const REGEX_TRAILING_SLASH = .*;/,
              replace: "const REGEX_TRAILING_SLASH = new RegExp();",
            },
            {
              search: /const REGEX_TRAILING_BACKSLASH = .*;/,
              replace: "const REGEX_TRAILING_BACKSLASH = new RegExp();",
            },
          ],
        },
      },
    ],
  },
};
