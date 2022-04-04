module.exports = {
  common: require("./common"),
  generateEntrypoint: require("./generate-entrypoint"),
  loaders: {
    empty: require("./loaders/empty-loader"),
    override: require("./loaders/override-loader"),
  },
  plugins: {
    PostBuildPlugin: require("./plugins/post-build-plugin"),
    ExtendedAliasPlugin: require("./plugins/extended-alias-plugin"),
  },
};
