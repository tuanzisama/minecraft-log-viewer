import { createApp } from "vue";
import App from "./App.vue";

import "./plugins/tdesign";
import router from "./plugins/router";
import store from "./plugins/store";

import "reset.css";
import "@/styles/global.less";

const app = createApp(App);
app.use(router);
app.use(store);
app.mount("#app");
