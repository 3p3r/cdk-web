#! /usr/bin/env node

const pJson = require("../package.json");
const stripped = {
  name: pJson.name,
  description: pJson.description,
  repository: pJson.repository,
  homepage: pJson.homepage,
  version: pJson.version,
  author: pJson.author,
  license: pJson.license,
  keywords: pJson.keywords,
  types: pJson.types,
  main: pJson.main,
  devDependencies: pJson.devDependencies,
};
console.log(JSON.stringify(stripped, null, 2));
