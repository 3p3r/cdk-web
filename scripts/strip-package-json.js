#! /usr/bin/env node
const PJSON_LOCATION = "../package.json";
const fs = require("fs");
const path = require("path");
const pJson = require(PJSON_LOCATION);
const name = process.argv[2];
const stripped = {
  name,
  description: pJson.description,
  repository: pJson.repository,
  homepage: pJson.homepage,
  version: pJson.version.includes("build")
    ? pJson.version
    : `${pJson.version}-build.${process.env.GITHUB_RUN_ATTEMPT || 0}${process.env.GITHUB_RUN_ID || ""}`,
  author: pJson.author,
  license: pJson.license,
  keywords: pJson.keywords,
  types: pJson.types,
  main: pJson.main,
  ...(name.includes("aws") ? {} : { devDependencies: pJson.devDependencies }),
};
fs.writeFileSync(path.resolve(__dirname, PJSON_LOCATION), JSON.stringify(stripped, null, 2));
