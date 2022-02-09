import React from "react";
import ReactDOM from "react-dom";
import Container from "react-bootstrap/Container";
import { Grid } from "react-loader-spinner";

import App from "./App";
import lazyLoadScript from "./lazyLoadScript";
import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
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
    return (
      <React.StrictMode>
        <Container fluid className="w-100 h-100 p-0 m-0">
          {this.state.require ? (
            <App require={this.state.require} />
          ) : (
            <Grid
              wrapperClass="loading-spinner"
              heigth="100"
              width="100"
              color="#5050EC"
              ariaLabel="loading"
            />
          )}
        </Container>
      </React.StrictMode>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
