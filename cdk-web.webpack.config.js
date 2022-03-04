/* global imports versions */

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const PostBuildPlugin = require("./webpack/plugins/post-build-plugin");
const empty = require("./webpack/loaders/empty-loader");
const override = require("./webpack/loaders/override-loader");

const DEBUG = process.env.CDK_WEB_DEBUG !== undefined;
DEBUG && console.log(">> building in DEBUG mode <<");

const getModules = _.memoize(() => {
  const { stdout: folders } = shell.exec(`find -type d -maxdepth 1`, {
    cwd: path.resolve(__dirname, `node_modules/${"aws-cdk-lib"}`),
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
      console.log(`[x] ${m}`);
      return true;
    } catch (err) {
      console.log(`[ ] ${m}`);
      return false;
    }
  });
  return paths;
});

const getAssets = _.memoize(() => {
  const cwd = path.resolve(__dirname, "node_modules/aws-cdk-lib");
  const { stdout: jsons } = shell.exec("find -wholename './**/*.json' | awk '!/node/ && !/.vscode/ && !/jsii/'", {
    silent: true,
    cwd,
  });
  const assets = jsons
    .trim()
    .split("\n")
    .map((module) => ({
      path: `/${path.basename(module)}`,
      code: fs.readFileSync(path.resolve(cwd, module), {
        encoding: "utf-8",
      }),
    }));
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
    console.error("FATAL: unable to launch CDK", err);
  }
};

const entryPointFunction = entryPointLibrary
  .toString()
  .replace(
    "/* IMPORTS */",
    `const imports = {\n${getModules()
      .map((packageName) => `"${packageName}": require("${packageName}")`)
      .join(",")}};`
  )
  .replace(
    "/* VERSION */",
    `const versions = {
    "cdk-web": ${JSON.stringify(require("./package.json").version)},
    "aws-sdk": ${JSON.stringify(require("aws-sdk/package.json").version)},
    "constructs": ${JSON.stringify(require("constructs/package.json").version)},
    "aws-cdk-lib": ${JSON.stringify(require("aws-cdk-lib/package.json").version)}};`
  )
  .replace(
    "/* ASSETS */",
    `const assets = {
      ${getAssets()
        .map(({ code, path }) => `"${path}": ${JSON.stringify({ path, code })}`)
        .join(",\n")}};
        const os = require("os");
        const fs = require("fs");
        if (!fs.existsSync(os.tmpdir())) fs.mkdirSync(os.tmpdir());
        Object.keys(assets)
          .filter((asset) => !fs.existsSync(assets[asset].path))
          .forEach((asset) => fs.writeFileSync(assets[asset].path, JSON.stringify(assets[asset].code)));`
  );

const entryPointPath = path.resolve(__dirname, "index.generated.js");
const entryPointText = `;require("idempotent-babel-polyfill");(${entryPointFunction.toString()})(window);`;
fs.writeFileSync(entryPointPath, entryPointText, { encoding: "utf-8" });

fs.writeFileSync(
  path.resolve(__dirname, "index.generated.ts"),
  getModules()
    .filter((n) => n !== "fs") // this gets replaced with "memfs" below^
    .map((packageName) => `function pseudoRequire(module: "${packageName}"): typeof import("${packageName}")`)
    .concat(
      'function pseudoRequire(module: "fs"): typeof import("memfs")',
      'function pseudoRequire(module: "aws-cdk"): typeof import("./cdk-web-cli")',
      "function pseudoRequire(module: string): any { /* empty */ }",
      "pseudoRequire.versions = { 'cdk-web': 0, 'aws-cdk-lib': 0, 'aws-sdk': 0, constructs: 0 };"
    )
    .join(";\n"),
  { encoding: "utf-8" }
);

module.exports = {
  node: {
    os: true,
    dns: "mock",
    tls: "mock",
    net: "mock",
    zlib: true,
    path: true,
    http: true,
    https: true,
    stream: true,
    console: true,
    process: "mock",
    child_process: "empty",
  },
  ...(DEBUG
    ? {
        mode: "development",
        devtool: "inline-source-map",
        devServer: {
          filename: "cdk-web.js",
          contentBase: "./dist",
        },
      }
    : {
        mode: "production",
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
      }),
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
      os: path.resolve(__dirname, "cdk-web-os.js"),
      promptly: path.resolve(__dirname, "cdk-web-null.js"),
      "proxy-agent": path.resolve(__dirname, "cdk-web-null.js"),
    },
  },
  plugins: [
    new PostBuildPlugin(),
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      "process.versions.node": `"${process.versions.node}"`,
      "process.version": `"${process.version}"`,
    }),
  ],
  stats: {
    warningsFilter: [
      /webpack performance recommendations*/,
      /aws-lambda-(go|nodejs|python)/,
      /.*custom-resource.*/,
      /.*size limit.*/,
    ],
  },
  module: {
    rules: [
      {
        use: empty.Loader,
        test: empty.KeepTrack([
          /hotswap/,
          /node_modules\/aws-cdk\/lib\/plugin\.js$/,
          /node_modules\/aws-cdk\/lib\/api\/aws-auth\/aws-sdk-inifile\.js$/,
        ]),
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/fs-extra\/lib\/fs\/index\.js$/]),
        options: {
          search: "exports.realpath.native = u(fs.realpath.native)",
          replace: "",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk-lib\/core\/lib\/private\/token-map\.js$/]),
        options: {
          search: "=global",
          replace: "=window",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk\/lib\/api\/cloudformation-deployments\.js$/]),
        options: {
          search: "art instanceof cxapi.AssetManifestArtifact",
          replace: "art.file !== undefined",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk-lib\/cloudformation-include\/lib\/cfn-include\.js$/]),
        options: {
          search: "require(moduleName)",
          replace: "(window.CDK_WEB_REQUIRE || window.require)(moduleName)",
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk\/lib\/logging\.js$/]),
        options: {
          multiple: [
            { search: /stream.write\(str.*/, replace: "console.log(str);" },
            {
              search: "exports.logLevel = LogLevel.DEFAULT;",
              replace: "exports.logLevel = LogLevel.TRACE;",
            },
          ],
        },
      },
      {
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/cdk-assets\/lib\/private\/handlers\/files\.js$/]),
        options: {
          search: "Body: fs_1.createReadStream(publishFile.packagedPath),",
          replace: "Body: fs_1.readFileSync(publishFile.packagedPath, {encoding: 'utf-8'}),",
        },
      },
      {
        // regular expressions used in this module are not Safari-compatible. sources:
        // https://stackoverflow.com/q/51568821/388751
        // https://caniuse.com/js-regexp-lookbehind
        loader: override.Loader,
        test: override.KeepTrack([/node_modules\/aws-cdk-lib\/node_modules\/@balena\/dockerignore\/ignore\.js$/]),
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
