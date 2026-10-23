import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { pb } from "@/lib/pocketbase";
import type { User } from "@/types";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(pb.authStore.record as unknown as User);
  const token = ref<string>(pb.authStore.token);

  pb.authStore.onChange((newToken, model) => {
    token.value = newToken;
    user.value = model as unknown as User;
  });

  const isAuthenticated = computed(
    () => Boolean(token.value) && pb.authStore.isValid,
  );
  const isAdmin = computed(() => user.value?.role === "admin");

  async function login(identity: string, password: string) {
    const authData = await pb
      .collection("users")
      .authWithPassword<User>(identity, password);
    user.value = authData.record;
    token.value = authData.token;
    return authData;
  }

  async function register(
    username: string,
    password: string,
    passwordConfirm: string,
  ) {
    await pb.collection("users").create({
      username,
      password,
      passwordConfirm,
    });
    return await login(username, password);
  }

  function logout() {
    pb.authStore.clear();
    user.value = null;
    token.value = "";
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  };
});
