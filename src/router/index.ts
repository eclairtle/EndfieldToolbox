import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const EmptyRouteComponent = {
  render: () => null,
};

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "build-list",
    component: EmptyRouteComponent,
  },
  {
    path: "/build/:buildId/build",
    name: "build-builder",
    component: EmptyRouteComponent,
  },
  {
    path: "/build/:buildId/rotation",
    name: "build-rotation",
    component: EmptyRouteComponent,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
