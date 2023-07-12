import { createApp } from "vue";
import App from "./App.vue";
import router from "./plugins/router";
import viewUIPlus from "./plugins/view-design";

import "reset.css";
import "@/styles/global.less";

const app = createApp(App);
app.use(router);
app.use(viewUIPlus);
app.mount("#app");
