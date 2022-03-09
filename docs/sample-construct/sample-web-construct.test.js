const isDebugger = require("./utils/is-debugger");

describe("breakpoint test", () => {
  it("should break in both host and puppeteer", async () => {
    const value = await page.evaluate(async function () {
      const localValue = "test";
      debugger; // this should break in puppeteer's devtools window
      return localValue;
    });
    debugger; // this should break in your host (e.g vscode, ndb, etc.)
    expect(value).toBe("test");
  });

  beforeAll(async () => {
    if (!isDebugger) return;
    // webpack dev server is hosted here. you need to run "npm serve" if this is
    // failing on you. it should be configured to launch automatically in vscode
    try {
      await page.goto("http://localhost:9000/");
    } catch {
      console.error("RUN: 'npm serve' before running tests if you want breakpoints");
      throw new Error("debugger found but webpack dev server is not available");
    }
  });
});
