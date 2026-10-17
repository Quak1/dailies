<script setup lang="ts">
import { ref, computed } from "vue";
import { resolveImageUrl } from "../lib/image";
import { isTaskCompleted } from "../lib/resetCalculator";
import CountdownBadge from "./CountdownBadge.vue";
import TaskItem from "./TaskItem.vue";
import GameTodoSection from "./GameTodoSection.vue";
import {
  Globe,
  Lock,
  Share2,
  CheckCheck,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
} from "@lucide/vue";
import type { UserGame, Task, Todo } from "../models";

const props = defineProps<{
  game: UserGame;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-task", task: Task, game: UserGame): void;
  (e: "delete-task", taskId: string, gameId: string): void;
  (
    e: "add-task",
    gameId: string,
    title: string,
    cadence: "daily" | "weekly",
  ): void;
  (
    e: "reorder-tasks",
    gameId: string,
    cadence: "daily" | "weekly",
    fromIndex: number,
    toIndex: number,
  ): void;
  (
    e: "add-todo",
    gameId: string,
    data: { title: string; notes?: string; dueDate?: string },
  ): void;
  (e: "toggle-todo", todo: Todo): void;
  (e: "delete-todo", todoId: string, gameId: string): void;
  (e: "edit-game", game: UserGame): void;
  (e: "delete-game", gameId: string): void;
  (e: "toggle-visibility", game: UserGame): void;
}>();

const activeTab = ref<"daily" | "weekly" | "todos">("daily");
const isAddingTask = ref(false);
const newTaskTitle = ref("");
const copied = ref(false);
const showMenu = ref(false);

const dragIndex = ref<number | null>(null);
const dragCadence = ref<"daily" | "weekly" | null>(null);
const dragOverIndex = ref<number | null>(null);

const dailyTasks = computed(() => {
  return (props.game.expand?.tasks || [])
    .filter((t) => t.cadence === "daily")
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
});

const weeklyTasks = computed(() => {
  return (props.game.expand?.tasks || [])
    .filter((t) => t.cadence === "weekly")
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
});

function handleDragStart(
  event: DragEvent,
  index: number,
  cadence: "daily" | "weekly",
) {
  if (props.readOnly) return;
  dragIndex.value = index;
  dragCadence.value = cadence;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${cadence}:${index}`);
  }
}

function handleDragOver(
  event: DragEvent,
  index: number,
  cadence: "daily" | "weekly",
) {
  if (dragCadence.value !== cadence) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  dragOverIndex.value = index;
}

function handleDragLeave() {
  dragOverIndex.value = null;
}

function handleDrop(
  event: DragEvent,
  toIndex: number,
  cadence: "daily" | "weekly",
) {
  event.preventDefault();
  if (
    dragIndex.value !== null &&
    dragCadence.value === cadence &&
    dragIndex.value !== toIndex
  ) {
    emit("reorder-tasks", props.game.id, cadence, dragIndex.value, toIndex);
  }
  dragIndex.value = null;
  dragCadence.value = null;
  dragOverIndex.value = null;
}

function handleDragEnd() {
  dragIndex.value = null;
  dragCadence.value = null;
  dragOverIndex.value = null;
}

function handleMoveTask(
  fromIndex: number,
  toIndex: number,
  cadence: "daily" | "weekly",
) {
  emit("reorder-tasks", props.game.id, cadence, fromIndex, toIndex);
}

const gameTodos = computed(() => {
  return props.game.expand?.todos || [];
});

// Progress calculations
const dailyCompletedCount = computed(() => {
  return dailyTasks.value.filter((t) =>
    isTaskCompleted(
      t.last_completed_at,
      "daily",
      props.game.reset_hour_utc,
      props.game.reset_minute_utc,
      props.game.weekly_reset_day,
    ),
  ).length;
});

const weeklyCompletedCount = computed(() => {
  return weeklyTasks.value.filter((t) =>
    isTaskCompleted(
      t.last_completed_at,
      "weekly",
      props.game.reset_hour_utc,
      props.game.reset_minute_utc,
      props.game.weekly_reset_day,
    ),
  ).length;
});

const currentProgressPercent = computed(() => {
  if (activeTab.value === "daily") {
    if (dailyTasks.value.length === 0) return 0;
    return Math.round(
      (dailyCompletedCount.value / dailyTasks.value.length) * 100,
    );
  }
  if (activeTab.value === "weekly") {
    if (weeklyTasks.value.length === 0) return 0;
    return Math.round(
      (weeklyCompletedCount.value / weeklyTasks.value.length) * 100,
    );
  }
  // Todos
  if (gameTodos.value.length === 0) return 0;
  const completedTodos = gameTodos.value.filter((td) => td.completed).length;
  return Math.round((completedTodos / gameTodos.value.length) * 100);
});

function handleAddTask() {
  if (!newTaskTitle.value.trim() || activeTab.value === "todos") return;
  emit("add-task", props.game.id, newTaskTitle.value.trim(), activeTab.value);
  newTaskTitle.value = "";
  isAddingTask.value = false;
}

async function copyShareLink() {
  const shareUrl = `${window.location.origin}/share/${props.game.share_slug}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy share link", err);
  }
}
</script>

<template>
  <div
    class="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl hover:border-zinc-700/80 transition-all duration-300 flex flex-col"
  >
    <!-- Header Banner -->
    <div class="relative h-32 w-full overflow-hidden bg-zinc-800">
      <img
        :src="resolveImageUrl(props.game)"
        :alt="props.game.name"
        class="w-full h-full object-cover object-center filter brightness-[0.65] group-hover:scale-105 transition-transform duration-500"
      />

      <!-- Overlay Gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40"
      ></div>

      <!-- Top Badges -->
      <div
        class="absolute top-3 left-3 right-3 flex items-center justify-between"
      >
        <!-- Visibility Badge -->
        <div class="flex items-center gap-1.5">
          <button
            v-if="!props.readOnly"
            @click="emit('toggle-visibility', props.game)"
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-colors"
            :class="
              props.game.is_public
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80'
            "
            :title="
              props.game.is_public
                ? 'Public checklist (click to make private)'
                : 'Private checklist (click to make public)'
            "
          >
            <component
              :is="props.game.is_public ? Globe : Lock"
              class="w-3 h-3"
            />
            <span>{{ props.game.is_public ? "Public" : "Private" }}</span>
          </button>

          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          >
            <Globe class="w-3 h-3" />
            <span>Public</span>
          </span>

          <!-- Share Button if Public -->
          <button
            v-if="props.game.is_public"
            @click="copyShareLink"
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 backdrop-blur-md transition-colors"
            title="Copy shareable link"
          >
            <component
              :is="copied ? CheckCheck : Share2"
              class="w-3 h-3"
              :class="copied ? 'text-emerald-400' : ''"
            />
            <span>{{ copied ? "Copied!" : "Share" }}</span>
          </button>
        </div>

        <!-- Options Menu (Edit/Delete) -->
        <div v-if="!props.readOnly" class="relative">
          <button
            @click="showMenu = !showMenu"
            type="button"
            class="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white backdrop-blur-md transition-colors"
            title="Game options"
          >
            <MoreVertical class="w-4 h-4" />
          </button>

          <div
            v-if="showMenu"
            @click.outside="showMenu = false"
            class="absolute right-0 mt-1 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-20 text-xs font-medium"
          >
            <button
              @click="
                emit('edit-game', props.game);
                showMenu = false;
              "
              class="w-full px-3 py-2 flex items-center gap-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
            >
              <Edit2 class="w-3.5 h-3.5" />
              <span>Edit Game</span>
            </button>
            <button
              @click="
                emit('delete-game', props.game.id);
                showMenu = false;
              "
              class="w-full px-3 py-2 flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Delete Game</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Title -->
      <div
        class="absolute bottom-3 left-4 right-4 flex items-end justify-between"
      >
        <h3 class="text-lg font-bold text-white drop-shadow-md truncate">
          {{ props.game.name }}
        </h3>
      </div>
    </div>

    <!-- Countdown Timers Bar -->
    <div
      class="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 flex flex-wrap items-center gap-2"
    >
      <CountdownBadge
        cadence="daily"
        :resetHourUTC="props.game.reset_hour_utc"
        :resetMinuteUTC="props.game.reset_minute_utc"
        :weeklyResetDay="props.game.weekly_reset_day"
      />
      <CountdownBadge
        cadence="weekly"
        :resetHourUTC="props.game.reset_hour_utc"
        :resetMinuteUTC="props.game.reset_minute_utc"
        :weeklyResetDay="props.game.weekly_reset_day"
      />
    </div>

    <!-- Navigation Tabs -->
    <div
      class="px-3 pt-2 flex items-center justify-between border-b border-zinc-800/60"
    >
      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="activeTab = 'daily'"
          class="px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2"
          :class="
            activeTab === 'daily'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          "
        >
          <span>Dailies</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 font-mono"
          >
            {{ dailyCompletedCount }}/{{ dailyTasks.length }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'weekly'"
          class="px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2"
          :class="
            activeTab === 'weekly'
              ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          "
        >
          <span>Weeklies</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 font-mono"
          >
            {{ weeklyCompletedCount }}/{{ weeklyTasks.length }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'todos'"
          class="px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2"
          :class="
            activeTab === 'todos'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          "
        >
          <span>Goals</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 font-mono"
          >
            {{ gameTodos.length }}
          </span>
        </button>
      </div>

      <!-- Add Task Button (for Dailies & Weeklies) -->
      <button
        v-if="!props.readOnly && activeTab !== 'todos' && !isAddingTask"
        @click="isAddingTask = true"
        type="button"
        class="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors mb-1.5"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add {{ activeTab === "daily" ? "Daily" : "Weekly" }}</span>
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="w-full bg-zinc-800/40 h-1">
      <div
        class="h-full transition-all duration-300"
        :class="
          activeTab === 'daily'
            ? 'bg-amber-500'
            : activeTab === 'weekly'
              ? 'bg-indigo-500'
              : 'bg-emerald-500'
        "
        :style="{ width: `${currentProgressPercent}%` }"
      ></div>
    </div>

    <!-- Card Content Body -->
    <div class="p-4 flex-1 space-y-2.5">
      <!-- Inline Add Task Input -->
      <div
        v-if="isAddingTask && activeTab !== 'todos'"
        class="flex items-center gap-2 p-1.5 bg-zinc-950 border border-indigo-500/50 rounded-xl"
      >
        <input
          v-model="newTaskTitle"
          type="text"
          :placeholder="`New ${activeTab} task title...`"
          class="flex-1 bg-transparent px-2.5 py-1 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          @keydown.enter.prevent="handleAddTask"
        />
        <button
          type="button"
          @click="isAddingTask = false"
          class="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleAddTask"
          :disabled="!newTaskTitle.trim()"
          class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Add
        </button>
      </div>

      <!-- Tab Content: Dailies -->
      <div v-if="activeTab === 'daily'" class="space-y-1.5">
        <div
          v-if="dailyTasks.length === 0 && !isAddingTask"
          class="py-8 text-center text-zinc-500 text-xs"
        >
          No daily tasks configured for this game.
        </div>
        <div
          v-for="(task, index) in dailyTasks"
          :key="task.id"
          :draggable="!props.readOnly"
          @dragstart="handleDragStart($event, index, 'daily')"
          @dragover="handleDragOver($event, index, 'daily')"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, index, 'daily')"
          @dragend="handleDragEnd"
          :class="[
            dragIndex === index && dragCadence === 'daily'
              ? 'opacity-40 scale-[0.98]'
              : '',
            dragOverIndex === index &&
            dragCadence === 'daily' &&
            dragIndex !== index
              ? 'ring-2 ring-indigo-500/80 rounded-xl bg-indigo-500/10'
              : '',
          ]"
          class="transition-all duration-150"
        >
          <TaskItem
            :task="task"
            :game="props.game"
            :readOnly="props.readOnly"
            :canMoveUp="index > 0"
            :canMoveDown="index < dailyTasks.length - 1"
            @toggle="emit('toggle-task', task, props.game)"
            @delete="emit('delete-task', $event, props.game.id)"
            @move-up="handleMoveTask(index, index - 1, 'daily')"
            @move-down="handleMoveTask(index, index + 1, 'daily')"
          />
        </div>
      </div>

      <!-- Tab Content: Weeklies -->
      <div v-else-if="activeTab === 'weekly'" class="space-y-1.5">
        <div
          v-if="weeklyTasks.length === 0 && !isAddingTask"
          class="py-8 text-center text-zinc-500 text-xs"
        >
          No weekly tasks configured for this game.
        </div>
        <div
          v-for="(task, index) in weeklyTasks"
          :key="task.id"
          :draggable="!props.readOnly"
          @dragstart="handleDragStart($event, index, 'weekly')"
          @dragover="handleDragOver($event, index, 'weekly')"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, index, 'weekly')"
          @dragend="handleDragEnd"
          :class="[
            dragIndex === index && dragCadence === 'weekly'
              ? 'opacity-40 scale-[0.98]'
              : '',
            dragOverIndex === index &&
            dragCadence === 'weekly' &&
            dragIndex !== index
              ? 'ring-2 ring-indigo-500/80 rounded-xl bg-indigo-500/10'
              : '',
          ]"
          class="transition-all duration-150"
        >
          <TaskItem
            :task="task"
            :game="props.game"
            :readOnly="props.readOnly"
            :canMoveUp="index > 0"
            :canMoveDown="index < weeklyTasks.length - 1"
            @toggle="emit('toggle-task', task, props.game)"
            @delete="emit('delete-task', $event, props.game.id)"
            @move-up="handleMoveTask(index, index - 1, 'weekly')"
            @move-down="handleMoveTask(index, index + 1, 'weekly')"
          />
        </div>
      </div>

      <!-- Tab Content: Goals / Todos -->
      <div v-else-if="activeTab === 'todos'">
        <GameTodoSection
          :game="props.game"
          :readOnly="props.readOnly"
          @add-todo="emit('add-todo', props.game.id, $event)"
          @toggle-todo="emit('toggle-todo', $event)"
          @delete-todo="emit('delete-todo', $event, props.game.id)"
        />
      </div>
    </div>
  </div>
</template>
