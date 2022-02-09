/* eslint-disable no-eval */

import React from "react";
import Editor from "@monaco-editor/react";
import { Row, Col } from "react-bootstrap";

const DEFAULT_STACK_PROGRAM = `
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
  state = {
    source: "",
    errors: [],
  };

  componentDidMount = () => {
    this.updateTemplate();
  };

  updateTemplate = (program = DEFAULT_STACK_PROGRAM) => {
    // react dev server keeps replacing the global require
    window.require = this.props.require;
    this.setState({ template: eval(program.trim()) });
  };

  handleOnEditorDidMount = (editor, monaco) => {
    editor.onDidChangeModelDecorations(() => {
      const model = editor.getModel();
      if (model === null || model.getModeId() !== "javascript") return;
      const owner = model.getModeId();
      const markers = monaco.editor.getModelMarkers({ owner });
      const errors = markers.filter((marker) => marker.severity === 8);
      this.setState({ source: editor.getValue(), errors });
    });
  };

  handleOnSynthesize = () => {
    if (this.state.errors.length > 0) return;
    this.updateTemplate(this.state.source);
  };

  render() {
    return (
      <>
        <Row className="h-100 align-items-center">
          <Col className="h-100">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              defaultValue={DEFAULT_STACK_PROGRAM}
              language="javascript"
              theme="vs-dark"
              onMount={this.handleOnEditorDidMount}
            />
          </Col>
          <Col className="text-center" xs={1}>
            <button onClick={this.handleOnSynthesize}>Synthesize Stack</button>
          </Col>
          <Col className="h-100">
            <Editor
              height="100%"
              defaultLanguage="json"
              language="json"
              theme="vs-dark"
              value={JSON.stringify(this.state.template, null, 2)}
            />
          </Col>
        </Row>
      </>
    );
  }
}

export default App;
