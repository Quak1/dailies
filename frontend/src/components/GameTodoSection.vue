<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Trash2, Plus, Calendar } from 'lucide-vue-next'
import type { Todo, UserGame } from '@/types'

const props = defineProps<{
  game: UserGame
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-todo', data: { title: string; notes?: string; dueDate?: string }): void
  (e: 'toggle-todo', todo: Todo): void
  (e: 'delete-todo', todoId: string): void
}>()

const todos = computed(() => props.game.expand?.todos || [])

// New Todo form state
const isAdding = ref(false)
const newTitle = ref('')
const newNotes = ref('')
const newDueDate = ref('')

function handleAdd() {
  if (!newTitle.value.trim()) return
  emit('add-todo', {
    title: newTitle.value.trim(),
    notes: newNotes.value.trim() || undefined,
    dueDate: newDueDate.value || undefined
  })
  newTitle.value = ''
  newNotes.value = ''
  newDueDate.value = ''
  isAdding.value = false
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header & Add button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Goals & Milestones</span>
        <span class="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">{{ todos.length }}</span>
      </div>

      <button
        v-if="!props.readOnly && !isAdding"
        @click="isAdding = true"
        type="button"
        class="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Goal</span>
      </button>
    </div>

    <!-- Inline Add Form -->
    <div v-if="isAdding" class="p-3 bg-zinc-950 border border-zinc-700 rounded-xl space-y-2.5">
      <input
        v-model="newTitle"
        type="text"
        placeholder="Milestone or goal title..."
        class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        @keydown.enter="handleAdd"
      />

      <textarea
        v-model="newNotes"
        placeholder="Notes or requirements (optional)..."
        rows="2"
        class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
      ></textarea>

      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-400">
          <Calendar class="w-3.5 h-3.5" />
          <input
            v-model="newDueDate"
            type="date"
            class="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="isAdding = false"
            class="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleAdd"
            :disabled="!newTitle.trim()"
            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="todos.length === 0 && !isAdding" class="py-6 text-center text-zinc-500 text-xs">
      No long-term milestones or goals added for this game yet.
    </div>

    <!-- Todo Items List -->
    <div v-else class="space-y-1.5">
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="group flex items-start justify-between p-2.5 rounded-xl border transition-all duration-200"
        :class="[
          todo.completed 
            ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60' 
            : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850',
          props.readOnly ? 'cursor-default' : 'cursor-pointer'
        ]"
        @click="!props.readOnly && emit('toggle-todo', todo)"
      >
        <div class="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            class="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0"
            :class="todo.completed 
              ? 'bg-emerald-600 border-emerald-500 text-white' 
              : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500 text-transparent'"
            :disabled="props.readOnly"
          >
            <Check class="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <div class="min-w-0 flex-1">
            <p 
              class="text-sm font-medium leading-snug truncate select-none transition-colors"
              :class="todo.completed ? 'line-through text-zinc-400' : 'text-zinc-100'"
            >
              {{ todo.title }}
            </p>
            <p v-if="todo.notes" class="text-xs text-zinc-400 mt-1 whitespace-pre-wrap">
              {{ todo.notes }}
            </p>
            <span 
              v-if="todo.due_date" 
              class="inline-flex items-center gap-1 mt-1 text-[11px] text-zinc-500 font-mono"
            >
              <Calendar class="w-3 h-3" />
              <span>Target: {{ formatDate(todo.due_date) }}</span>
            </span>
          </div>
        </div>

        <button
          v-if="!props.readOnly"
          type="button"
          @click.stop="emit('delete-todo', todo.id)"
          class="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors ml-2"
          title="Delete goal"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
