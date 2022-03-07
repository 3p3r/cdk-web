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
    if (!error.message) return console.error("cdk-web encountered an error", error);
    const message = error.message ? error.message.trim() : "unknown error, check your dev console.";
    this.setState({ errors: [message, ...this.state.errors] });
  };

  componentDidMount = () => {
    window.addEventListener("error", this.handleOnError);
    lazyLoadScript("https://sdk.amazonaws.com/js/aws-sdk-2.1000.0.min.js").then(() =>
      lazyLoadScript("cdk-web.js").then(() => {
        this.setState({ ready: true });
      })
    );
  };

  componentWillUnmount = () => {
    window.removeEventListener("error", this.handleOnError);
  };

  render() {
    const { width, height } = this.props;
    return (
      <Container fluid className="w-100 h-100 p-0 m-0">
        {width > 0 && height > 0 && this.state.ready ? (
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
          <Grid wrapperClass="loading-spinner" heigth="100" width="100" color="#5050EC" ariaLabel="loading" />
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
