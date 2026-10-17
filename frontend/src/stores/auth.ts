import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { pb } from "../lib/pocketbase";
import type { User } from "../models";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(
    pb.authStore.record ? (pb.authStore.record as unknown as User) : null,
  );
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  pb.authStore.onChange((_, record) => {
    user.value = record ? (record as unknown as User) : null;
  });

  async function login(username: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(username, password);
      user.value = authData.record as unknown as User;
      return authData;
    } catch (err: any) {
      error.value =
        err?.message || "Login failed. Please check your credentials.";
      console.log(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      await pb.collection("users").create({
        username,
        password,
        passwordConfirm: password,
        role: "user",
      });
      return await login(username, password);
    } catch (err: any) {
      error.value = err?.message || "Registration failed.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    pb.authStore.clear();
    user.value = null;
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  };
});
