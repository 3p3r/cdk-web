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
    ExtendedAliasPlugin: require("./plugins/extended-alias-plugin"),
    SearchAndDestroyPlugin: require("./plugins/search-and-destroy-plugin"),
  },
};
