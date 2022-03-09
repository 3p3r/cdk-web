# sample-web-construct

this folder is a sample webpack 5 project to get you started building constructs for `cdk-web`.

this setup allows you to have **breakpoints in both your node tests and puppeteer** tests at the same time.

in `vscode` launch its debugger. it should break both in vscode and puppeteer (don't forget to let the breakpoint go!).

if you are using `ndb`, you can run `npm serve` in one shell and in another run `npx --yes ndb` to launch ndb. in `ndb`
then go ahead and hit the play button next to "test" under "npm scripts" section.

it is recommended that you copy this folder outside of `cdk-web`'s repository and work off-tree so webpack does not get
confused with all the different configurations available in the repo.
