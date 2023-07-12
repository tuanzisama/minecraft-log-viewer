import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "MainPage",
    component: () => import("@/views/index/MainPage.vue"),
  },
  {
    path: "/viewer",
    name: "ViewerPage",
    component: () => import("@/views/viewer/ViewerPage.vue"),
  },
  {
    path: "/(.*)",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
