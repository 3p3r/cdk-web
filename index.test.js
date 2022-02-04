const path = require("path");
const CDK_WEB_URL = `file://${path.resolve(__dirname, "dist/index.html")}`;

describe("cdk-web tests", () => {
  beforeAll(async () => {
    await page.goto(CDK_WEB_URL);
  });

  it('sanity test', async () => {
    await expect(page.title()).resolves.toMatch("cdk-web");
  });
});
