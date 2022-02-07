const lazyLoadScript = (src = "") => {
  const scripts = Array.from(document.getElementsByTagName("script")).map(
    (s) => s.src
  );
  if (scripts.includes(src)) {
    return new Promise((resolve) => resolve());
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    const body = document.getElementsByTagName("body")[0];
    body?.parentNode?.insertBefore(script, body);
    script.addEventListener("load", (e) => {
      resolve(e);
    });
  });
};

export default lazyLoadScript;
