<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pb } from '@/lib/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { useGamesStore } from '@/stores/games'
import GameCard from '@/components/GameCard.vue'
import { Download, Sparkles, Check, ArrowRight } from 'lucide-vue-next'
import type { UserGame, Task, Todo } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const gamesStore = useGamesStore()

const game = ref<UserGame | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const importing = ref(false)
const imported = ref(false)

onMounted(async () => {
  const slug = route.params.slug as string
  if (!slug) {
    error.value = 'Game checklist not found'
    loading.value = false
    return
  }

  try {
    const fetchedGame = await pb.collection('user_games').getFirstListItem<UserGame>(`share_slug = "${slug}"`)
    const [tasks, todos] = await Promise.all([
      pb.collection('tasks').getFullList<Task>({
        filter: `user_game = "${fetchedGame.id}"`,
        sort: 'sort_order'
      }),
      pb.collection('todos').getFullList<Todo>({
        filter: `user_game = "${fetchedGame.id}"`,
        sort: 'sort_order'
      })
    ])

    game.value = {
      ...fetchedGame,
      expand: {
        tasks,
        todos
      }
    }
  } catch (err: any) {
    error.value = 'This game checklist is private or does not exist.'
    console.error(err)
  } finally {
    loading.value = false
  }
})

async function handleImport() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  const slug = route.params.slug as string
  importing.value = true
  try {
    await gamesStore.importPublicGame(slug)
    imported.value = true
  } catch (err: any) {
    alert(err?.message || 'Failed to import checklist')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
    <!-- Loading -->
    <div v-if="loading" class="py-24 text-center">
      <div class="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm text-zinc-400">Loading shared checklist...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error || !game" class="py-24 text-center space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
        <Sparkles class="w-8 h-8" />
      </div>
      <h2 class="text-xl font-bold text-white">{{ error || 'Checklist not found' }}</h2>
      <p class="text-sm text-zinc-400">The author may have set this list to private or deleted it.</p>
      <router-link to="/repository" class="inline-block px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700">
        Browse Public Repository
      </router-link>
    </div>

    <!-- Shared Game Content -->
    <div v-else class="space-y-6">
      <!-- Import Header Bar -->
      <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-zinc-900 to-zinc-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span>Shared Checklist: {{ game.name }}</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Read-Only
            </span>
          </h2>
          <p class="text-xs text-zinc-400 mt-1">
            Want to track this game on your own account? Clone it with one click!
          </p>
        </div>

        <div>
          <button
            v-if="!imported"
            type="button"
            @click="handleImport"
            :disabled="importing"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <div v-if="importing" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <Download v-else class="w-4 h-4" />
            <span>Import to My Account</span>
          </button>

          <router-link
            v-else
            to="/"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Check class="w-4 h-4" />
            <span>Imported! Open Tracker</span>
            <ArrowRight class="w-4 h-4" />
          </router-link>
        </div>
      </div>

      <!-- Game Card Preview -->
      <div class="max-w-xl mx-auto">
        <GameCard :game="game" :readOnly="true" />
      </div>
    </div>
  </div>
</template>
