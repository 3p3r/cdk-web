module.exports = {
  generateEntrypoint: require("./generate-entrypoint"),
  common: require("./common"),
  modules: {
    os: require("./modules/os"),
    fs: require("./modules/fs"),
    empty: require("./modules/empty"),
  },
  loaders: {
    empty: require("./loaders/empty-loader"),
    override: require("./loaders/override-loader"),
  },
  plugins: {
    PostBuildPlugin: require("./plugins/post-build-plugin"),
    ExtendedAliasPlugin: require("./plugins/extended-alias-plugin"),
  },
};
