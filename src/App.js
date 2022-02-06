import React, { useEffect, useState } from "react";
import lazyLoadScript from "./lazyLoadScript";

function App() {
  const [took, setTook] = useState(0);
  useEffect(() => {
    const tic = Date.now();
    lazyLoadScript("cdk-web.js").then(() => {
      const toc = Date.now();
      const took = toc - tic;
      setTook(took);
    });
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Lazy Loading cdk-web took: {took}ms
        </p>
      </header>
    </div>
  );
}

export default App;
