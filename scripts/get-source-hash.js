#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const { __ROOT } = require("../webpack/common");
const { execSync } = require("child_process");
const GIT_DIR = path.join(__ROOT, ".git");
console.log(
  fs.existsSync(GIT_DIR) ? execSync("git rev-parse --short HEAD", { encoding: "utf8", cwd: __ROOT }).trim() : "000000"
);
