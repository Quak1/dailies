<script setup lang="ts">
import { ref, computed } from "vue";
import { Check, Trash2, Plus } from "@lucide/vue";
import type { Todo, UserGame } from "../models";

const props = defineProps<{
  game: UserGame;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (
    e: "add-todo",
    data: { title: string; notes?: string; dueDate?: string },
  ): void;
  (e: "toggle-todo", todo: Todo): void;
  (e: "delete-todo", todoId: string): void;
}>();

const todos = computed(() => props.game.expand?.todos || []);

// New Todo form state
const isAdding = ref(false);
const newTitle = ref("");
const newNotes = ref("");
const newDueDate = ref("");

function handleAdd() {
  if (!newTitle.value.trim()) return;
  emit("add-todo", {
    title: newTitle.value.trim(),
    notes: newNotes.value.trim() || undefined,
    dueDate: newDueDate.value || undefined,
  });
  newTitle.value = "";
  newNotes.value = "";
  newDueDate.value = "";
  isAdding.value = false;
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header & Add button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
          >Goals & Milestones</span
        >
        <span
          class="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono"
          >{{ todos.length }}</span
        >
      </div>

      <button
        v-if="!props.readOnly && !isAdding"
        @click="isAdding = true"
        type="button"
        class="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Goal</span>
      </button>
    </div>

    <!-- Inline Add Goal Form -->
    <div
      v-if="isAdding"
      class="p-3 bg-zinc-900/90 border border-indigo-500/40 rounded-xl space-y-2.5"
    >
      <input
        v-model="newTitle"
        type="text"
        placeholder="Goal or milestone title..."
        class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        @keydown.enter.prevent="handleAdd"
      />
      <textarea
        v-model="newNotes"
        rows="2"
        placeholder="Notes, targets, or materials (optional)..."
        class="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
      ></textarea>

      <div class="flex items-center justify-between pt-1">
        <input
          v-model="newDueDate"
          type="date"
          class="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
          title="Target date"
        />

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="isAdding = false"
            class="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleAdd"
            :disabled="!newTitle.trim()"
            class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>

    <!-- Todo list -->
    <div
      v-if="todos.length === 0 && !isAdding"
      class="py-6 text-center text-zinc-500 text-xs"
    >
      No goals or todos added for this game yet.
    </div>

    <div v-else class="space-y-1.5">
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="group flex items-start justify-between p-2.5 rounded-xl border transition-all duration-200"
        :class="[
          todo.completed
            ? 'bg-zinc-900/30 border-zinc-800/50 opacity-60'
            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700',
          props.readOnly ? 'cursor-default' : 'cursor-pointer',
        ]"
        @click="!props.readOnly && emit('toggle-todo', todo)"
      >
        <div class="flex items-start gap-2.5 min-w-0 flex-1">
          <!-- Checkbox -->
          <button
            type="button"
            class="w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition-colors shrink-0"
            :class="
              todo.completed
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500 text-transparent'
            "
            :disabled="props.readOnly"
          >
            <Check class="w-3 h-3 stroke-[3]" />
          </button>

          <!-- Text -->
          <div class="min-w-0 flex-1 select-none">
            <p
              class="text-sm font-medium leading-snug truncate"
              :class="
                todo.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
              "
            >
              {{ todo.title }}
            </p>
            <p
              v-if="todo.notes"
              class="text-xs text-zinc-400 mt-0.5 break-words"
            >
              {{ todo.notes }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 ml-2">
          <!-- Delete action -->
          <button
            v-if="!props.readOnly"
            type="button"
            @click.stop="emit('delete-todo', todo.id)"
            class="p-1 rounded text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete goal"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
