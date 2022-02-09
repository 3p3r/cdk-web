import React from "react";
import ReactDOM from "react-dom";
import Container from "react-bootstrap/Container";
import { Grid } from "react-loader-spinner";
import { withResizeDetector } from "react-resize-detector";

import App from "./App";
import lazyLoadScript from "./lazyLoadScript";
import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
import "github-fork-ribbon-css/gh-fork-ribbon.css";
import "@forevolve/bootstrap-dark/dist/css/bootstrap-dark.min.css";
import "./index.css";

class Index extends React.Component {
  static CDK_WEB_REQUIRE = "CDK_WEB_REQUIRE";

  state = { require: null };

  componentDidMount = () => {
    window.CDK_WEB_REQUIRE = Index.CDK_WEB_REQUIRE;
    lazyLoadScript("cdk-web.js").then(() => {
      this.setState({ require: window[Index.CDK_WEB_REQUIRE] });
    });
  };

  render() {
    const { width, height } = this.props;
    return (
      <Container fluid className="w-100 h-100 p-0 m-0">
        {width > 0 && height > 0 && this.state.require ? (
          <App require={this.state.require} width={width} height={height} />
        ) : (
          <Grid
            wrapperClass="loading-spinner"
            heigth="100"
            width="100"
            color="#5050EC"
            ariaLabel="loading"
          />
        )}
        <a
          class="github-fork-ribbon"
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
