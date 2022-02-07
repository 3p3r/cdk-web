import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Container from "react-bootstrap/Container";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <Container style={{ backgroundColor: "#5050EC" }} fluid className="p-0 h-100 w-100">
      <App />
    </Container>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
