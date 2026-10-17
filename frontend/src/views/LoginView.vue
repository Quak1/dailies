<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { KeyRound, User, AlertCircle } from "@lucide/vue";
import Logo from "../components/Logo.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");

async function handleLogin() {
  if (!username.value.trim() || !password.value) return;

  try {
    await authStore.login(username.value.trim(), password.value);
    const redirect = (route.query.redirect as string) || "/";
    router.push(redirect);
  } catch (err: any) {
    console.log(err);
    console.log(authStore.error);
  }
}
</script>

<template>
  <div class="flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Top Logo -->
      <div class="text-center space-y-2 mb-6">
        <Logo />
        <h2 class="text-4xl font-extrabold text-white tracking-tight">Login</h2>
      </div>

      <!-- Card -->
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5"
      >
        <!-- Error Alert -->
        <div
          v-if="authStore.error"
          class="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ authStore.error }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Username -->
          <div>
            <label
              for="username"
              class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
            >
              Username
            </label>
            <div class="relative">
              <User
                class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                v-model="username"
                id="username"
                type="text"
                required
                autocomplete="username"
                placeholder="Enter your username"
                class="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label
              for="password"
              class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
            >
              Password
            </label>
            <div class="relative">
              <KeyRound
                class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                v-model="password"
                id="password"
                type="password"
                required
                autocomplete="current-password"
                class="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.loading || !username.trim() || !password"
            class="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/25 transition-colors flex items-center justify-center gap-2 pt-2"
          >
            <div
              v-if="authStore.loading"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>Sign In</span>
          </button>
        </form>

        <!-- Footer Link -->
        <p class="text-center text-xs text-zinc-500">
          Need an account?
          <router-link
            to="/register"
            class="text-indigo-400 hover:text-indigo-300 font-semibold ml-1"
          >
            Register here
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
