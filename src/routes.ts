import { createRouter, createWebHistory } from "vue-router";
import Collection from "./views/Collection.vue";
import Home from "./views/Home.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/collections/:name", component: Collection },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
