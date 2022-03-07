/// <reference types=".." />

import React from "react";
import ReactDOM from "react-dom";
import { Grid } from "react-loader-spinner";
import { Alert, Container } from "react-bootstrap";
import { withResizeDetector } from "react-resize-detector";

import App from "./App";
import lazyLoadScript from "./lazyLoadScript";
import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
import "github-fork-ribbon-css/gh-fork-ribbon.css";
import "@forevolve/bootstrap-dark/dist/css/bootstrap-dark.min.css";
import "./index.css";

class Index extends React.Component {
  state = { ready: false, errors: [] };

  handleOnError = (error) => {
    const message = error.message || error.reason.message || "unknown error, check your dev console.";
    console.error("cdk-web encountered an error", error);
    this.setState({ errors: [message, ...this.state.errors] });
  };

  initErrorHandling = () => {
    window.onerror = (message, file, line, col, error) => {
      this.handleOnError(error);
      return false;
    };
    window.addEventListener("error", (e) => {
      this.handleOnError(e.error);
      return false;
    });
    window.addEventListener("unhandledrejection", (e) => {
      this.handleOnError(e.reason);
    });
  };

  freeErrorHandling = () => {
    window.onerror = undefined;
    window.removeEventListener("error", this.handleOnError);
    window.removeEventListener("unhandledrejection", this.handleOnError);
  };

  componentDidMount = () => {
    this.initErrorHandling();
    if (window.AWS && window.CDK) this.setState({ ready: true });
    else {
      lazyLoadScript("https://sdk.amazonaws.com/js/aws-sdk-2.1000.0.min.js").then(() =>
        lazyLoadScript("cdk-web.js").then(() => {
          this.setState({ ready: true });
        })
      );
    }
  };

  componentWillUnmount = () => {
    this.freeErrorHandling();
  };

  canRender = () => {
    const { width, height } = this.props;
    return width > 0 && height > 0 && this.state.ready && window.CDK !== undefined && window.AWS !== undefined;
  };

  render() {
    const { width, height } = this.props;
    return (
      <Container fluid className="w-100 h-100 p-0 m-0">
        {this.canRender() ? (
          <>
            {this.state.errors.length > 0 && (
              <Alert dismissible variant="danger" onClose={() => this.setState({ errors: [] })}>
                <Alert.Heading>Oh snap! CDK Synthesis failed!</Alert.Heading>
                <p>check error message below:</p>
                <p className="text-monospace">{this.state.errors.map((e) => `- ${e}`).join("\n")}</p>
              </Alert>
            )}
            <App width={width} height={height} />
          </>
        ) : (
          <Grid wrapperClass="loading-spinner" height="100" width="100" color="#5050EC" ariaLabel="loading" />
        )}
        <a
          className="github-fork-ribbon"
          href="https://github.com/3p3r/cdk-web/"
          data-ribbon="Fork this on GitHub"
          title="Fork this on GitHub"
        >
          Fork this on GitHub
        </a>
      </Container>
    );
  }
}

const ResizeAwareIndex = withResizeDetector(Index);
ReactDOM.render(<ResizeAwareIndex />, document.getElementById("root"));
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
