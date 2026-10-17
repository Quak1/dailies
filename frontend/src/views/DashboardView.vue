<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGamesStore } from "../stores/games";
import GameCard from "../components/GameCard.vue";
import GameModal from "../components/GameModal.vue";
import { Plus, Compass, Sparkles } from "@lucide/vue";
import type { UserGame, Task, Todo } from "../models";

const gamesStore = useGamesStore();

const showModal = ref(false);
const gameToEdit = ref<UserGame | null>(null);

onMounted(async () => {
  await gamesStore.fetchGames();
});

function openAddModal() {
  gameToEdit.value = null;
  showModal.value = true;
}

function openEditModal(game: UserGame) {
  gameToEdit.value = game;
  showModal.value = true;
}

async function handleSaveGame(payload: any) {
  try {
    if (gameToEdit.value) {
      await gamesStore.updateGame(gameToEdit.value.id, payload);
    } else {
      await gamesStore.createGame(payload);
    }
    showModal.value = false;
  } catch (err: any) {
    alert(err?.message || "Failed to save game");
  }
}

async function handleToggleTask(task: Task, game: UserGame) {
  await gamesStore.toggleTask(task, game);
}

async function handleDeleteTask(taskId: string, gameId: string) {
  await gamesStore.deleteTask(taskId, gameId);
}

async function handleAddTask(
  gameId: string,
  title: string,
  cadence: "daily" | "weekly",
) {
  await gamesStore.createTask(gameId, { title, cadence, description: "" });
}

async function handleReorderTasks(
  gameId: string,
  cadence: "daily" | "weekly",
  fromIndex: number,
  toIndex: number,
) {
  await gamesStore.reorderTasks(gameId, cadence, fromIndex, toIndex);
}

async function handleAddTodo(
  gameId: string,
  data: { title: string; notes?: string; dueDate?: string },
) {
  await gamesStore.createTodo(gameId, data.title, data.notes, data.dueDate);
}

async function handleToggleTodo(todo: Todo) {
  await gamesStore.toggleTodo(todo);
}

async function handleDeleteTodo(todoId: string, gameId: string) {
  await gamesStore.deleteTodo(todoId, gameId);
}

async function handleDeleteGame(gameId: string) {
  if (
    confirm(
      "Are you sure you want to delete this game section and all its tasks?",
    )
  ) {
    await gamesStore.deleteGame(gameId);
  }
}

async function handleToggleVisibility(game: UserGame) {
  await gamesStore.updateGame(game.id, { is_public: !game.is_public });
}
</script>

<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <!-- Header Hero -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80"
    >
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        Game Tracker
      </h1>

      <div class="flex items-center gap-2.5">
        <router-link
          to="/repository"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors shadow-sm"
        >
          <Compass class="w-4 h-4 text-indigo-400" />
          <span>Browse Repository</span>
        </router-link>

        <button
          @click="openAddModal"
          type="button"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-colors"
        >
          <Plus class="w-4 h-4" />
          <span>Add Game</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="gamesStore.loading && gamesStore.games.length === 0"
      class="py-20 text-center"
    >
      <div
        class="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"
      ></div>
      <p class="text-sm text-zinc-400 font-medium">
        Loading your games & checklists...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="gamesStore.games.length === 0"
      class="py-20 text-center rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-950/40 p-8 max-w-xl mx-auto space-y-4"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center"
      >
        <Compass class="w-8 h-8" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-white">No games tracked yet</h3>
        <p class="text-sm text-zinc-400 mt-1">
          Get started by adding a custom game section or cloning curated
          templates from the repository.
        </p>
      </div>
      <div class="flex items-center justify-center gap-3 pt-2">
        <router-link
          to="/repository"
          class="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
        >
          Explore Repository
        </router-link>
        <button
          @click="openAddModal"
          class="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Create Custom Game
        </button>
      </div>
    </div>

    <!-- Games Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <GameCard
        v-for="game in gamesStore.games"
        :key="game.id"
        :game="game"
        @toggle-task="handleToggleTask"
        @delete-task="handleDeleteTask"
        @add-task="handleAddTask"
        @reorder-tasks="handleReorderTasks"
        @add-todo="handleAddTodo"
        @toggle-todo="handleToggleTodo"
        @delete-todo="handleDeleteTodo"
        @edit-game="openEditModal"
        @delete-game="handleDeleteGame"
        @toggle-visibility="handleToggleVisibility"
      />
    </div>

    <!-- Create/Edit Game Modal -->
    <GameModal
      :show="showModal"
      :gameToEdit="gameToEdit"
      @close="showModal = false"
      @save="handleSaveGame"
    />
  </div>
</template>
