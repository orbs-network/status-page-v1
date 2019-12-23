import App from "./App.svelte";

const app = new App({
    target: document.body,
    props: {
      vchains: [1000, 1003, 2000],
      validators: ["node1", "node2", "node3"],
    }
  });
  
  export default app;
  