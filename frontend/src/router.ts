import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "./views/DashboardView.vue";
import LoginView from "./views/LoginView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

export default router;
