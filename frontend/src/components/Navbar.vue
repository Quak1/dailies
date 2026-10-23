<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Sparkles, Compass, Shield, LogOut, User } from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push("/login");
}
</script>

<template>
  <header
    class="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-40"
  >
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
    >
      <!-- Left: Logo & Links -->
      <div class="flex items-center gap-8">
        <router-link
          to="/"
          class="flex items-center gap-2.5 text-lg font-bold text-white tracking-tight hover:opacity-90 transition-opacity"
        >
          <div
            class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25"
          >
            <Sparkles class="w-4 h-4 text-white" />
          </div>
          <span
            class="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent"
            >Dailies</span
          >
        </router-link>

        <nav class="hidden sm:flex items-center gap-1">
          <router-link
            v-if="authStore.isAuthenticated"
            to="/"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="
              $route.path === '/'
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            "
          >
            My Tracker
          </router-link>

          <router-link
            to="/repository"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="
              $route.path === '/repository'
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            "
          >
            <Compass class="w-4 h-4" />
            <span>Repository</span>
          </router-link>

          <router-link
            v-if="authStore.isAdmin"
            to="/admin"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="
              $route.path === '/admin'
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            "
          >
            <Shield class="w-4 h-4 text-indigo-400" />
            <span>Admin</span>
          </router-link>
        </nav>
      </div>

      <!-- Right: User Auth / Profile -->
      <div class="flex items-center gap-3">
        <template v-if="authStore.isAuthenticated">
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300"
          >
            <User class="w-3.5 h-3.5 text-zinc-400" />
            <span>{{ authStore.user?.username }}</span>
            <span
              v-if="authStore.isAdmin"
              class="ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
            >
              Admin
            </span>
          </div>

          <button
            @click="handleLogout"
            type="button"
            class="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Log out"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </template>

        <template v-else>
          <router-link
            to="/login"
            class="px-3.5 py-1.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Sign In
          </router-link>
          <router-link
            to="/register"
            class="px-4 py-1.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-colors"
          >
            Get Started
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>
