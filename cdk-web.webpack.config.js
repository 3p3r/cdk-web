/* global imports versions */

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

const getModules = _.memoize((packageName = "") => {
  const { stdout: folders } = shell.exec(`find -type d -maxdepth 1`, {
    cwd: path.resolve(__dirname, `node_modules/${packageName}`),
    silent: true,
  });
  const paths = [
    packageName,
    ...folders
      .trim()
      .split("\n")
      .map((p) => p.replace("./", `${packageName}/`))
      .filter((m) => m !== ".")
      .filter((m) =>
        _.chain(() => require.resolve(m))
          .attempt()
          .isError()
      ),
  ];
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
  return assets;
});

const entryPointTemplate = function (window = {}) {
  try {
    /* ASSETS */ //  <- json assets required at runtime by cdk to exist on disk memfs
    /* VERSION */ // <- version of libraries transpiled and exported from this module
    /* IMPORTS */ // <- a list of all calls to cdk "require(...)"s so we can reexport
    const exportName = window.CDK_WEB_REQUIRE || "require";
    const exportFunc = (name) => {
      if (!Object.keys(imports).includes(name)) throw new Error(`module not found: ${name}`);
      else return imports[name];
    };
    exportFunc.versions = versions;
    window[exportName] = exportFunc;
  } catch (err) {
    console.error("FATAL: unable to launch CDK", err);
  }
};

const entryPointFunction = entryPointTemplate
  .toString()
  .replace(
    "/* IMPORTS */",
    `const imports = {\n${["fs", "path", "constructs", ...getModules("aws-cdk-lib")]
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
      .map((packageName) => `"${packageName}": require("${packageName}")`)
      .join(",")}};`
  )
  .replace(
    "/* VERSION */",
    `const versions = {
    "cdk-web": ${JSON.stringify(require("./package.json").version)},
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
        if (!fs.existsSync(os.tmpdir())) { fs.mkdirSync(os.tmpdir()); }
        Object.keys(assets)
          .filter((asset) => !fs.existsSync(assets[asset].path))
          .forEach((asset) => fs.writeFileSync(assets[asset].path, JSON.stringify(assets[asset].code)));`
  );

const entryPointPath = path.resolve(__dirname, "index.generated.js");
const entryPointText = `;require("idempotent-babel-polyfill");(${entryPointFunction.toString()})(window);`;

fs.writeFileSync(entryPointPath, entryPointText, { encoding: "utf-8" });

module.exports = {
  node: {
    net: "mock",
    path: true,
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
      /webpack performance recommendations*/,
      /aws-lambda-(go|nodejs|python)/,
      /custom-resource/,
      / * size limit */,
    ],
  },
  module: {
    rules: [
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
