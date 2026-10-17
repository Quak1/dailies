<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRepositoryStore } from '@/stores/repository'
import { useAuthStore } from '@/stores/auth'
import { resolveImageUrl } from '@/lib/pocketbase'
import { Compass, Plus, Check, Clock, Search } from 'lucide-vue-next'
import type { GameTemplate } from '@/types'

const router = useRouter()
const repoStore = useRepositoryStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const cloningId = ref<string | null>(null)
const clonedIds = ref<Set<string>>(new Set())

onMounted(async () => {
  await repoStore.fetchTemplates()
})

const filteredTemplates = computed(() => {
  if (!searchQuery.value.trim()) return repoStore.templates
  const q = searchQuery.value.toLowerCase()
  return repoStore.templates.filter(t => t.name.toLowerCase().includes(q))
})

async function handleClone(template: GameTemplate) {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: '/repository' } })
    return
  }

  cloningId.value = template.id
  try {
    await repoStore.cloneTemplate(template)
    clonedIds.value.add(template.id)
    setTimeout(() => {
      router.push('/')
    }, 800)
  } catch (err: any) {
    alert(err?.message || 'Failed to add template to tracker')
  } finally {
    cloningId.value = null
  }
}
</script>

<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span>Game Repository</span>
          <Compass class="w-6 h-6 text-indigo-400" />
        </h1>
        <p class="text-sm text-zinc-400 mt-1">
          Explore curated game templates and add pre-configured dailies and weeklies with one click.
        </p>
      </div>

      <!-- Search Bar -->
      <div class="relative w-full sm:w-72">
        <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search games..."
          class="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="repoStore.loading && repoStore.templates.length === 0" class="py-20 text-center">
      <div class="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm text-zinc-400 font-medium">Loading curated templates...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTemplates.length === 0" class="py-20 text-center text-zinc-500">
      No game templates found matching your search.
    </div>

    <!-- Templates Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl hover:border-zinc-700/80 transition-all flex flex-col group"
      >
        <!-- Banner -->
        <div class="relative h-36 w-full overflow-hidden bg-zinc-800">
          <img
            :src="resolveImageUrl(template)"
            :alt="template.name"
            class="w-full h-full object-cover object-center filter brightness-[0.7] group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30"></div>
          <div class="absolute bottom-3 left-4 right-4">
            <h3 class="text-lg font-bold text-white drop-shadow-md truncate">
              {{ template.name }}
            </h3>
          </div>
        </div>

        <!-- Info Bar -->
        <div class="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div class="flex items-center gap-1.5 font-mono">
            <Clock class="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset: {{ String(template.reset_hour_utc).padStart(2, '0') }}:{{ String(template.reset_minute_utc).padStart(2, '0') }} UTC</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-medium text-zinc-300">
              {{ (template.expand?.template_tasks || []).length }} tasks
            </span>
          </div>
        </div>

        <!-- Tasks Preview -->
        <div class="p-4 flex-1 space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-zinc-500">Included Tasks</p>
          <ul class="space-y-1.5">
            <li
              v-for="task in (template.expand?.template_tasks || []).slice(0, 4)"
              :key="task.id"
              class="flex items-center gap-2 text-xs text-zinc-300 truncate"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="task.cadence === 'daily' ? 'bg-amber-400' : 'bg-indigo-400'"
              ></span>
              <span class="truncate">{{ task.title }}</span>
            </li>
            <li v-if="(template.expand?.template_tasks || []).length > 4" class="text-[11px] text-zinc-500 italic pl-3.5">
              + {{ (template.expand?.template_tasks || []).length - 4 }} more tasks...
            </li>
          </ul>
        </div>

        <!-- Card Footer -->
        <div class="p-4 pt-0">
          <button
            type="button"
            @click="handleClone(template)"
            :disabled="cloningId === template.id || clonedIds.has(template.id)"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all"
            :class="clonedIds.has(template.id)
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'"
          >
            <template v-if="cloningId === template.id">
              <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding to Tracker...</span>
            </template>
            <template v-else-if="clonedIds.has(template.id)">
              <Check class="w-4 h-4 text-emerald-400" />
              <span>Added to Your Tracker!</span>
            </template>
            <template v-else>
              <Plus class="w-4 h-4" />
              <span>Add to My Tracker</span>
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
