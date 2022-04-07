const path = require("path");
const webpack = require("webpack");
const { generateEntrypoint, loaders, plugins, common } = require("./webpack");

generateEntrypoint();
const __ = common.crossPlatformPathRegExp;
const $ = (s = "") => path.resolve(common.__ROOT, s);

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
  ...(common.__DEBUG
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
          minimize: false,
        },
      }),
  cache: false,
  entry: "./index.generated.js",
  output: {
    library: {
      commonjs: "cdk-web",
      amd: "cdk-web",
      root: "CDK",
    },
    libraryTarget: "umd",
    umdNamedDefine: true,
    globalObject: `(typeof self !== 'undefined' ? self : this)`,
    filename: "cdk-web.js",
    path: $("dist"),
  },
  externals: {
    "aws-sdk": {
      commonjs2: "aws-sdk",
      commonjs: "aws-sdk",
      amd: "aws-sdk",
      root: "AWS",
    },
  },
  resolve: {
    extensions: [".js"],
    alias: {
      ["fs"]: require.resolve("./webpack/modules/fs"),
      ["os"]: require.resolve("./webpack/modules/os"),
      ["promptly"]: require.resolve("./webpack/modules/empty"),
      ["proxy-agent"]: require.resolve("./webpack/modules/empty"),
      [$("node_modules/aws-cdk-lib/core/lib/stage.js")]: $("webpack/modules/aws-cdk-lib/core/lib/stage.js"),
      [$("node_modules/aws-cdk/lib/util/directories.js")]: $("webpack/modules/aws-cdk/lib/util/directories.js"),
      [$("node_modules/console-browserify/index.js")]: $("webpack/modules/console-browserify/index.js"),
    },
  },
  plugins: [
    ...(common.__SERVER ? [new plugins.WebpackMildCompile()] : []),
    new plugins.PostBuildPlugin(),
    new plugins.ExtendedAliasPlugin(),
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      "process.versions.node": JSON.stringify(process.versions.node),
      "process.version": JSON.stringify(process.version),
      "process.env.CDK_OUTDIR": JSON.stringify("/cdk.out"),
    }),
  ],
  performance: {
    hints: false,
  },
  stats: {
    warningsFilter: [/aws-lambda-(go|nodejs|python)/, /.*custom-resource.*/],
  },
  module: {
    rules: [
      {
        use: loaders.empty.Loader,
        test: loaders.empty.KeepTrack([
          /hotswap/,
          __("node_modules/aws-cdk/lib/api/plugin/plugin.js"),
          __("node_modules/aws-cdk/lib/api/aws-auth/aws-sdk-inifile.js"),
        ]),
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/aws-cdk-lib/package.json")),
        options: {
          replace: (source) => {
            const excludedModules = common.getExcludedModules();
            const moduleNames = excludedModules
              .map((p) => p.replace("aws-cdk-lib/", "./"))
              .filter((p) => !p.endsWith(".js"))
              .concat(".");
            const pJson = JSON.parse(source);
            const { exports } = pJson;
            for (const mod of moduleNames) delete exports[mod];
            return JSON.stringify({ ...pJson, exports });
          },
        },
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/aws-cdk-lib/index.js")),
        options: {
          replace: (source) => {
            const excludedModules = common.getExcludedModules();
            const moduleNames = excludedModules
              .map((p) => p.replace("aws-cdk-lib/", "./"))
              .filter((p) => !p.endsWith(".js"))
              .filter((p) => p !== "./package.json");
            const exports = source
              .match(/exports\.[^=]+=require\("([^"]+)"\),/g)
              .filter((exp) => moduleNames.some((m) => exp.includes(m)));
            for (const exp of exports) {
              source = source.replace(exp, "");
            }
            return source;
          },
        },
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/@mhlabs/cfn-diagram/graph/Vis.js")),
        options: {
          search: /if\s+\(standaloneIndex\)([^]*)else/gm,
          replace:
            "if(standaloneIndex){fs.writeFileSync(path.join(uiPath,'index.html'),fs.readFileSync('/ui/render-template.html','utf8').replace('/*RENDERED*/',fileContent),'utf8')}else",
        },
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/aws-cdk/lib/api/bootstrap/bootstrap-environment.js")),
        options: {
          search: "'lib', 'api', 'bootstrap', 'bootstrap-template.yaml'",
          replace: "'bootstrap-template.yaml'",
        },
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/aws-cdk-lib/core/lib/app.js")),
        options: {
          search: "process.env[cxapi.OUTDIR_ENV]",
          replace: '"/cdk.out"',
        },
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/fs-extra/lib/fs/index.js")),
        options: {
          search: "exports.realpath.native = u(fs.realpath.native)",
          replace: "",
        },
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/aws-cdk-lib/core/lib/private/token-map.js")),
        options: {
          search: "=global",
          replace: "=((typeof window === 'undefined') ? global : window)",
        },
      },
      ...(common.getModules().includes("aws-cdk-lib/cloudformation-include")
        ? [
            {
              loader: loaders.override.Loader,
              test: loaders.override.KeepTrack(
                __("node_modules/aws-cdk-lib/cloudformation-include/lib/cfn-include.js")
              ),
              options: {
                search: "require(moduleName)",
                replace: "eval((typeof window === 'undefined') ? 'require' : 'window.CDK.require')(moduleName)",
              },
            },
            {
              loader: loaders.override.Loader,
              test: loaders.override.KeepTrack(
                __("node_modules/aws-cdk-lib/cloudformation-include/lib/cfn-type-to-l1-mapping.js")
              ),
              options: {
                search: /readJsonSync\([^;]+\)/,
                replace: 'readJsonSync("/cdk/cfn-types-2-classes.json")',
              },
            },
          ]
        : []),
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/aws-cdk/lib/logging.js")),
        options: {
          multiple: [
            {
              search: /stream.write\(str.*/,
              replace: "console.log(str);",
            },
            {
              search: "exports.logLevel = LogLevel.DEFAULT;",
              replace: "exports.logLevel = LogLevel.TRACE;",
            },
          ],
        },
      },
      {
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/cdk-assets/lib/private/handlers/files.js")),
        options: {
          search: "Body: fs_1.createReadStream(publishFile.packagedPath),",
          replace: "Body: fs_1.readFileSync(publishFile.packagedPath, {encoding: 'utf-8'}),",
        },
      },
      {
        // regular expressions used in this module are not Safari-compatible. sources:
        // https://stackoverflow.com/q/51568821/388751
        // https://caniuse.com/js-regexp-lookbehind
        loader: loaders.override.Loader,
        test: loaders.override.KeepTrack(__("node_modules/aws-cdk-lib/node_modules/@balena/dockerignore/ignore.js")),
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
