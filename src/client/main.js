import App from "./App.svelte";

const app = new App({
    target: document.body,
    props: {
      vchains: [1000, 1003, 2000],
    }
  });
  
  export default app;
  