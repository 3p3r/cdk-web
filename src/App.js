/// <reference types=".." />

import React from "react";
import Iframe from "react-iframe";
import stripIndent from "strip-indent";
import Editor from "@monaco-editor/react";
import { Button, Tab, Tabs, OverlayTrigger } from "react-bootstrap";

const DEFAULT_STACK_PROGRAM = `\
// go to "CFN" tab ^ to synth.

const cdk = CDK.require("aws-cdk-lib");
const ec2 = CDK.require("aws-cdk-lib/aws-ec2");
const sqs = CDK.require("aws-cdk-lib/aws-sqs");
const sns = CDK.require("aws-cdk-lib/aws-sns");
const s3 = CDK.require("aws-cdk-lib/aws-s3");

const app = new cdk.App();
const stack = new cdk.Stack(app, "BrowserStack");
const vpc = new ec2.Vpc(stack, "VPC");
const queue = new sqs.Queue(stack, "Queue");
const topic = new sns.Topic(stack, "Topic");
const bucket = new s3.Bucket(stack, "Bucket");

const cli = new CDK.PseudoCli({ stack });
cli.synth();
`;

const DEFAULT_IFRAME_CONTENT = "javascript:void(0);";
const createSrcAttr = (html) => "data:text/html;charset=utf-8," + escape(html);

class App extends React.Component {
  Tabs = {
    cdk: "cdk",
    cfn: "cfn",
    dia: "diagram",
    about: "about",
  };

  InitialTab = window.location.hash.replace("#", "");
  DefaultTab = Object.values(this.Tabs).includes(this.InitialTab) ? this.InitialTab : this.Tabs.cdk;

  state = {
    tab: this.DefaultTab,
    dirty: true,
    template: {},
    source: DEFAULT_STACK_PROGRAM,
    rendered: createSrcAttr(DEFAULT_IFRAME_CONTENT),
  };

  componentDidMount = () => {
    const { Stack } = window.CDK.require("aws-cdk-lib");
    window.CDK.emitter.on("synth", async (assembly, app) => {
      const stack = app.node.children.filter(Stack.isStack)[0];
      const rendered = await new window.CDK.PseudoCli({ stack }).render();
      const template = assembly.getStackByName(stack.node.id).template;
      this.setState({ template, rendered: createSrcAttr(rendered), dirty: true });
    });
    this.updateTemplate();
  };

  componentWillUnmount = () => {
    window.CDK.emitter.off("synth");
  };

  updateTemplate = async (program = DEFAULT_STACK_PROGRAM) => {
    try {
      // eslint-disable-next-line no-eval
      await eval(program.trim());
    } catch (err) {
      this.setState({ template: {}, rendered: createSrcAttr(DEFAULT_IFRAME_CONTENT), dirty: false });
      throw err;
    }
  };

  handleOnEditorChanged = (source) => {
    this.setState({ source, dirty: true });
  };

  synthesize = async () => {
    await this.updateTemplate(this.state.source);
    this.setState({ dirty: false, tab: this.Tabs.cfn });
  };

  render() {
    const { width, height } = this.props;
    return width > 0 && height > 0 ? (
      <>
        <Tabs
          className="mb-3"
          defaultActiveKey={this.DefaultTab}
          activeKey={this.state.tab}
          onSelect={(tab) => {
            this.setState({ tab });
            window.location.hash = `#${tab}`;
            if (tab === this.Tabs.cfn) return this.synthesize();
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
              this.state.dirty ? "font-weight-bold text-uppercase text-warning" : "font-weight-light text-lowercase"
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
          <Tab
            title={this.Tabs.dia}
            eventKey={this.Tabs.dia}
            style={{ boxShadow: "0 0 5px 5px #111" }}
            tabClassName="font-weight-light text-lowercase"
          >
            <Iframe width={`${width}px`} height={`${height}px`} src={this.state.rendered} />
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
                cdk-web version: ${require("../package.json").version}
                aws-cdk-lib version: ${require("aws-cdk-lib/package.json").version}
                constructs version: ${require("constructs/package.json").version}

                ## help and support:
                go to the repository: https://github.com/3p3r/cdk-web/`)}
            />
          </Tab>
        </Tabs>
        {this.state.tab === this.Tabs.cdk && (
          <Button variant="warning" className="position-absolute synthesis-button" onClick={this.synthesize}>
            Synthesize
          </Button>
        )}
      </>
    ) : null;
  }
}

export default App;
