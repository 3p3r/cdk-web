const puppeteer = require("puppeteer");
const express = require("express");
const path = require("path");
const chai = require("chai");
const app = express();
const { __ROOT, __DEBUG } = require("../webpack/common");

const NODE = __DEBUG;
const BROWSER = !NODE;

// set this for the lambdaJS construct when it's executed in Node
process.env.CDK_WEB_ESBUILD_WASM = path.resolve(__ROOT, 'dist/esbuild.wasm')

app.use(express.static(path.resolve(__ROOT, "dist")));
chai.use(require("deep-equal-in-any-order"));
chai.use(require("chai-as-promised"));

/** @returns {typeof window.CDK} */
function importCdk() {
  let CDK;
  if (BROWSER) {
    // in BROWSER mode, bundle is loaded in puppeteer
    // and native cdk is used as ground truth for tests
    CDK = { require };
  } else {
    // in NODE mode we directly require the bundle in node to
    // verify it's also cross compatible and collect coverage
    CDK = require("../dist/cdk-web");
  }
  return CDK;
}

globalThis.chai = chai;
globalThis.CDK = importCdk();

let browser = null;
let server = null;
let hostUrl = "";

before(async function () {
  if (BROWSER) {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await new Promise((resolve) => {
      server = app.listen(() => resolve());
      hostUrl = `http://localhost:${server.address().port}/`;
    });
    await page.goto(hostUrl);
    globalThis.page = page;
  } else {
    globalThis.page = {
      title: () => Promise.resolve("cdk-web"),
      goto: () => Promise.resolve(),
      evaluate: (fn, ...args) => fn(...args),
    };
  }
});

after(async function () {
  if (BROWSER) {
    await browser.close();
    server.close();
  }
});
