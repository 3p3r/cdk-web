module.exports = {
  common: require("./common"),
  generateEntrypoint: require("./generate-entrypoint"),
  loaders: {
    empty: require("./loaders/empty-loader"),
    override: require("./loaders/override-loader"),
  },
  plugins: {
    PostBuildPlugin: require("./plugins/post-build-plugin"),
    OverrideTrackerPlugin: require("./plugins/override-tracker-plugin"),
    WebpackMildCompile: require("webpack-mild-compile").Plugin,
    ExtendedAliasPlugin: require("./plugins/extended-alias-plugin"),
  },
};
