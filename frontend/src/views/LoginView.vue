<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Sparkles, LogIn, AlertCircle } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  if (!username.value.trim() || !password.value) return;
  loading.value = true;
  error.value = "";

  try {
    await authStore.login(username.value.trim(), password.value);
    const redirect = (route.query.redirect as string) || "/";
    await router.push(
      redirect === "/login" || redirect === "/register" ? "/" : redirect,
    );
  } catch (err: any) {
    error.value = err?.message || "Invalid username or password";
  } finally {
    loading.value = false;
  }
}

function fillDemo(user: string, pass: string) {
  username.value = user;
  password.value = pass;
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
    <div
      class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
    >
      <!-- Title -->
      <div class="text-center space-y-2">
        <div
          class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25"
        >
          <Sparkles class="w-6 h-6 text-white" />
        </div>
        <h2 class="text-2xl font-bold text-white tracking-tight">
          Welcome Back
        </h2>
        <p class="text-xs text-zinc-400">
          Sign in with your username to access your game checklists.
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0 text-red-400" />
        <span>{{ error }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Username
          </label>
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
            placeholder="Enter your username"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="Enter your password"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || !username.trim() || !password"
          class="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
        >
          <div
            v-if="loading"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></div>
          <LogIn v-else class="w-4 h-4" />
          <span>Sign In</span>
        </button>
      </form>

      <!-- Quick Demo Logins -->
      <div class="pt-2 border-t border-zinc-800 space-y-2">
        <p
          class="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center"
        >
          Quick Demo Accounts
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="fillDemo('player', 'player123456')"
            class="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-300 font-medium transition-colors text-center"
          >
            Demo Player
          </button>
          <button
            type="button"
            @click="fillDemo('admin', 'admin123456')"
            class="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs text-indigo-300 font-medium transition-colors text-center"
          >
            Demo Admin
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center text-xs text-zinc-500">
        Don't have an account?
        <router-link
          to="/register"
          class="text-indigo-400 hover:text-indigo-300 font-medium ml-1"
        >
          Create one now
        </router-link>
      </div>
    </div>
  </div>
</template>
