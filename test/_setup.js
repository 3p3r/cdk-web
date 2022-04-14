/// <reference path="../index.d.ts" />

const puppeteer = require("puppeteer");
const express = require("express");
const path = require("path");
const chai = require("chai");
const app = express();
const { __ROOT, __DEBUG } = require("../webpack/common");

const NODE = __DEBUG;
const BROWSER = !NODE;

app.use(express.static(path.resolve(__ROOT, "dist")));
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

let server = null;

before(async function () {
  if (BROWSER) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await new Promise((resolve) => {
      server = app.listen(() => resolve());
      hostUrl = `http://localhost:${server.address().port}/`;
    });
    await page.goto(hostUrl);
    globalThis.browser = browser;
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
