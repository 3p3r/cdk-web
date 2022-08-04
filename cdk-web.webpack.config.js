const path = require("path");
const webpack = require("webpack");
const { generateEntrypoint, loaders, plugins, common } = require("./webpack");

generateEntrypoint();
const __ = common.crossPlatformPathRegExp;
const rooted = (s = "") => path.resolve(common.__ROOT, s);

module.exports = {
  ...(common.__DEBUG
    ? {
      mode: "development",
      devtool: "inline-source-map",
      devServer: {
        static: [
          { directory: rooted("./dist") },
          { directory: rooted("./node_modules/esbuild-wasm") }
        ]
      },
      watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 500,
      },
    }
    : {
      mode: "production",
      devtool: false,
      optimization: {
        minimize: false,
      },
    }),
  cache: false,
  entry: generateEntrypoint.ENTRYPOINT_PATH,
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
    path: rooted("dist"),
  },
  externals: {
    ["vm2"]: "vm2",
    ["aws-sdk"]: {
      commonjs2: "aws-sdk",
      commonjs: "aws-sdk",
      amd: "aws-sdk",
      root: "AWS",
    },
  },
  resolve: {
    extensions: [".js"],
    fallback: {
      net: false,
      child_process: false,
      buffer: require.resolve('buffer'),
      zlib: require.resolve('browserify-zlib'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      console: require.resolve('console-browserify'),
      constants: require.resolve('constants-browserify'),
    },
    alias: {
      ["fs"]: require.resolve("./webpack/modules/fs"),
      ["os"]: require.resolve("./webpack/modules/os"),
      ["promptly"]: require.resolve("./webpack/modules/empty"),
      ["proxy-agent"]: require.resolve("./webpack/modules/empty"),
      ["path"]: require.resolve("path-browserify"),
      ["process"]: require.resolve("./webpack/modules/process"),
      ...Object.assign(
        ...[
          "node_modules/aws-cdk-lib/core/lib/stage.js",
          "node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/function.js",
          "node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/bundling.js",
          "node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/index.js",
          "node_modules/aws-cdk/lib/util/directories.js",
          "node_modules/console-browserify/index.js",
        ].map((mod) => ({ [rooted(mod)]: rooted(mod.replace("node_modules", "webpack/modules")) }))
      ),
    },
  },
  plugins: [
    ...(common.__CI ? [] : [new webpack.ProgressPlugin()]),
    new plugins.OverrideTrackerPlugin(),
    new plugins.ExtendedAliasPlugin(),
    new plugins.PostBuildPlugin(),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: require.resolve("./webpack/modules/process.js"),
      console: require.resolve("./webpack/modules/console-browserify/index.js"),
    }),
    new webpack.DefinePlugin({
      "process.versions.node": JSON.stringify(process.versions.node),
      "process.version": JSON.stringify(process.version),
      "process.env.CDK_OUTDIR": JSON.stringify("/cdk.out"),
    }),
  ],
  performance: {
    hints: false,
  },
  ignoreWarnings: [
    { module: /aws-lambda-(go|nodejs|python)/ },
    { module: /.*custom-resource.*/ },
  ],
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: false,
          minimize: false,
          esModule: false,
        },
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "last 2 Chrome versions" }]],
            ...(common.__DEBUG ? { plugins: ["istanbul"] } : {}),
          },
        },
      },
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
        test: __("node_modules/aws-cdk-lib/package.json"),
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
        test: __("node_modules/aws-cdk-lib/index.js"),
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
        test: __("node_modules/aws-cdk/lib/api/bootstrap/bootstrap-environment.js"),
        options: {
          search: "'lib', 'api', 'bootstrap', 'bootstrap-template.yaml'",
          replace: "'bootstrap-template.yaml'",
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/aws-eks/lib/alb-controller.js"),
        options: {
          search:
            'JSON.parse(fs.readFileSync(path.join(__dirname,"addons",`alb-iam_policy-${props.version.version}.json`),"utf8"))',
          replace: 'require("./addons/" + `alb-iam_policy-${props.version.version}` + ".json")',
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/custom-resources/lib/aws-custom-resource/aws-custom-resource.js"),
        options: {
          search: 'JSON.parse(fs.readFileSync(path.join(__dirname,"sdk-api-metadata.json"),"utf-8"))',
          replace: 'require("./sdk-api-metadata.json")',
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/custom-resources/lib/aws-custom-resource/runtime/index.js"),
        options: {
          search: 'JSON.parse(fs.readFileSync(path_1.join(__dirname,`${modelFilePrefix}.service.json`),"utf-8"))',
          replace: 'require("./" + `${modelFilePrefix}.service` + ".json")',
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/core/lib/app.js"),
        options: {
          search: "process.env[cxapi.OUTDIR_ENV]",
          replace: '"/cdk.out"',
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/core/lib/private/token-map.js"),
        options: {
          search: "=global",
          replace: "=((typeof window === 'undefined') ? global : window)",
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/cloudformation-include/lib/cfn-include.js"),
        options: {
          search: "require(moduleName)",
          replace: "eval((typeof window === 'undefined') ? 'require' : 'window.CDK.require')(moduleName)",
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/cloudformation-include/lib/cfn-type-to-l1-mapping.js"),
        options: {
          search: 'futils.readJsonSync(path.join(__dirname,"..","cfn-types-2-classes.json"))',
          replace: 'require("../cfn-types-2-classes.json")',
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk/lib/logging.js"),
        options: {
          multiple: [
            {
              search: /realStream.write\(str.*/,
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
        test: __("node_modules/cdk-assets/lib/private/handlers/files.js"),
        options: {
          search: "Body: fs_1.createReadStream(publishFile.packagedPath),",
          replace: "Body: fs_1.readFileSync(publishFile.packagedPath, 'utf8'),",
        },
      },
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/node_modules/@balena/dockerignore/ignore.js"),
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
      {
        loader: loaders.override.Loader,
        test: __("node_modules/aws-cdk-lib/aws-events/lib/input.js"),
        options: {
          search: /r\.replace\(new RegExp[^.]+`\)/g,
          replace: 'r.startsWith("\\\\")?r:r.replace(/"([^"]+)"/g,"$1")',
        },
      },
    ],
  },
};
