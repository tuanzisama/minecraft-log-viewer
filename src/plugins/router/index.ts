import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "MainPage",
    component: () => import("@/views/index/MainPage.vue"),
  },
  //   {
  //     path: "/ccc",
  //     name: "MainPage",
  //     component: () => import("@/views/index/Copy.vue"),
  //   },
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
