import React from "react";
import Editor from "@monaco-editor/react";
import { Button, Tab, Tabs } from "react-bootstrap";
import stripIndent from "strip-indent";

const DEFAULT_STACK_PROGRAM = `\
// go to "CFN" tab ^ to synth.

const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const sqs = require("aws-cdk-lib/aws-sqs");
const sns = require("aws-cdk-lib/aws-sns");
const s3 = require("aws-cdk-lib/aws-s3");
const app = new cdk.App();
const stack = new cdk.Stack(app, "BrowserStack");
const vpc = new ec2.Vpc(stack, "VPC");
const queue = new sqs.Queue(stack, "Queue");
const topic = new sns.Topic(stack, "Topic");
const bucket = new s3.Bucket(stack, "Bucket");
const assembly = app.synth();
const template = assembly.getStackArtifact("BrowserStack").template;
template; // last statement is the return of eval()`;

class App extends React.Component {
  Tabs = {
    cdk: "cdk",
    cfn: "cfn",
    about: "about",
  };

  state = {
    tab: this.Tabs.cdk,
    dirty: true,
    template: {},
    source: DEFAULT_STACK_PROGRAM,
  };

  componentDidMount = () => {
    this.updateTemplate();
  };

  updateTemplate = (program = DEFAULT_STACK_PROGRAM) => {
    // react dev server keeps replacing the global require
    window.require = this.props.require;
    // eslint-disable-next-line no-eval
    this.setState({ template: eval(program.trim()), dirty: true });
  };

  handleOnEditorChanged = (source) => {
    this.setState({ source, dirty: true });
  };

  synthesize = () => {
    this.updateTemplate(this.state.source);
    this.setState({ tab: this.Tabs.cfn, dirty: false });
  };

  render() {
    const { width, height } = this.props;
    return width > 0 && height > 0 ? (
      <>
        <Tabs
          className="mb-3"
          defaultActiveKey={this.Tabs.cdk}
          activeKey={this.state.tab}
          onSelect={(tab) => {
            this.setState({ tab });
            if (tab === this.Tabs.cfn) this.synthesize();
          }}
        >
          <Tab eventKey={this.Tabs.cdk} title={this.Tabs.cdk}>
            <Editor
              width={`${width}px`}
              height={`${height}px`}
              theme="vs-dark"
              path="app.js"
              language="javascript"
              defaultValue={DEFAULT_STACK_PROGRAM}
              onChange={this.handleOnEditorChanged}
            />
          </Tab>
          <Tab
            eventKey={this.Tabs.cfn}
            title={`${this.Tabs.cfn}${this.state.dirty ? "*" : ""}`}
            tabClassName={
              this.state.dirty
                ? "font-weight-bold text-uppercase text-warning"
                : "font-weight-light text-lowercase"
            }
          >
            <Editor
              width={`${width}px`}
              height={`${height}px`}
              theme="vs-dark"
              path={"cfn-template.json"}
              options={{ readOnly: true }}
              language="json"
              value={JSON.stringify(this.state.template, null, 2)}
            />
          </Tab>
          <Tab eventKey={this.Tabs.about} title={this.Tabs.about}>
            <Editor
              width={`${width}px`}
              height={`${height}px`}
              theme="vs-dark"
              path="ABOUT.md"
              options={{ readOnly: true }}
              language="markdown"
              value={stripIndent(`\
                # CDK WEB Playground
                Try out AWS CDK directly in your browser!

                ## versions
                aws-cdk-web version: ${require("../package.json").version}
                aws-cdk-lib version: ${
                  require("aws-cdk-lib/package.json").version
                }
                constructs version: ${
                  require("constructs/package.json").version
                }

                ## help and support:
                go to the repository: https://github.com/3p3r/cdk-web/`)}
            />
          </Tab>
        </Tabs>
        {this.state.dirty && (
          <Button
            variant="warning"
            className="position-absolute synthesis-button"
            onClick={this.synthesize}
          >
            Synthesize
          </Button>
        )}
      </>
    ) : null;
  }
}

export default App;
