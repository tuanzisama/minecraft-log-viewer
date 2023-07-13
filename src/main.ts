import { createApp } from "vue";
import App from "./App.vue";
import router from "./plugins/router";

import "reset.css";
import "@/styles/global.less";

const app = createApp(App);
app.use(router);
app.mount("#app");
