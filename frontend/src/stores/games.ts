import { defineStore } from "pinia";
import { ref } from "vue";
import PocketBase from "pocketbase";
import type { UserGame, FetchUserGame, Task, Todo } from "../models";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const rand = Math.random().toString(36).substring(2, 7);
  return `${base || "game"}-${rand}`;
}

export function getMostRecentReset(
  task: Task,
  game: UserGame,
  now: Date = new Date(),
): Date {
  const reset = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      game.reset_hour_utc,
      game.reset_minute_utc,
      0,
      0,
    ),
  );

  const isWeekly = task.cadence === "weekly";
  const daysBack = isWeekly
    ? (now.getUTCDay() - game.weekly_reset_day + 7) % 7
    : 0;

  reset.setUTCDate(reset.getUTCDate() - daysBack);

  if (reset > now) {
    reset.setUTCDate(reset.getUTCDate() - (isWeekly ? 7 : 1));
  }

  return reset;
}

export function isTaskCompleted(
  task: Task,
  game: UserGame,
  now: Date = new Date(),
): boolean {
  if (!task.last_completed_at) {
    return false;
  }

  const completedTime = new Date(task.last_completed_at).getTime();
  if (isNaN(completedTime)) {
    return false;
  }

  const mostRecentReset = getMostRecentReset(task, game, now);
  return completedTime >= mostRecentReset.getTime();
}

const pb = new PocketBase(window.location.origin);

export const useGamesStore = defineStore("games", () => {
  const games = ref<UserGame[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // USER GAMES
  async function fetchGames() {
    if (!pb.authStore.record?.id) {
      games.value = [];
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const gamesResult = await pb
        .collection("user_games")
        .getFullList<FetchUserGame>({
          filter: `user = "${pb.authStore.record.id}"`,
          sort: "sort_order",
          expand: "tasks_via_user_game, todos_via_user_game",
        });

      if (gamesResult.length === 0) {
        games.value = [];
        return;
      }

      games.value = gamesResult.map((game) => ({
        ...game,
        expand: {
          tasks: game.expand?.tasks_via_user_game,
          todos: game.expand?.todos_via_user_game,
        },
      }));
    } catch (err: any) {
      error.value = err?.message || "Failed to load games";
    } finally {
      loading.value = false;
    }
  }

  async function createGame(payload: {
    name: string;
    image_url?: string;
    imageFile?: File | null;
    reset_hour_utc: number;
    reset_minute_utc: number;
    weekly_reset_day: number;
    is_public: boolean;
  }) {
    if (!pb.authStore.record?.id) throw new Error("Not authenticated");

    const created = await pb.collection("user_games").create<UserGame>({
      ...payload,
      user: pb.authStore.record.id,
      image: payload.imageFile,
      share_slug: generateSlug(payload.name),
      sort_order: games.value.length + 1,
    });

    await fetchGames();
    return created;
  }

  async function updateGame(
    id: string,
    payload: {
      name?: string;
      image_url?: string;
      imageFile?: File | null;
      reset_hour_utc?: number;
      reset_minute_utc?: number;
      weekly_reset_day?: number;
      is_public?: boolean;
    },
  ) {
    const updated = await pb
      .collection("user_games")
      .update<UserGame>(id, payload);

    await fetchGames();
    return updated;
  }

  async function deleteGame(id: string) {
    await pb.collection("user_games").delete(id);
    await fetchGames();
  }

  // TASKS
  async function createTask(
    userGameId: string,
    payload: {
      title: string;
      cadence: "daily" | "weekly";
      description: string;
    },
  ) {
    if (!pb.authStore.record?.id) throw new Error("Not authenticated");

    const game = games.value.find((g) => g.id === userGameId);
    const existingCount =
      game?.expand?.tasks?.filter((t) => t.cadence === payload.cadence)
        .length || 0;

    const created = await pb.collection("tasks").create<Task>({
      ...payload,
      user_game: userGameId,
      user: pb.authStore.record.id,
      sort_order: existingCount + 1,
    });

    if (game) {
      if (!game.expand) game.expand = {};
      if (!game.expand.tasks) game.expand.tasks = [];
      game.expand.tasks.push(created);
    }

    return created;
  }

  async function deleteTask(taskId: string, userGameId: string) {
    await pb.collection("tasks").delete(taskId);
    const game = games.value.find((g) => g.id === userGameId);
    if (game?.expand?.tasks) {
      game.expand.tasks = game.expand.tasks.filter((t) => t.id !== taskId);
    }
  }

  async function toggleTask(task: Task, game: UserGame) {
    const currentlyDone = isTaskCompleted(task, game);

    const newTimestamp = currentlyDone ? "" : new Date().toISOString();
    const prevTimestamp = task.last_completed_at;
    task.last_completed_at = newTimestamp;

    try {
      await pb.collection("tasks").update(task.id, {
        last_completed_at: newTimestamp,
      });
    } catch (err) {
      task.last_completed_at = prevTimestamp;
      throw err;
    }
  }

  async function reorderTasks(
    userGameId: string,
    cadence: "daily" | "weekly",
    fromIndex: number,
    toIndex: number,
  ) {
    const game = games.value.find((g) => g.id === userGameId);
    if (!game?.expand?.tasks) return;
    if (fromIndex === toIndex) return;

    const cadenceTasks = game.expand.tasks
      .filter((t) => t.cadence === cadence)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (
      fromIndex < 0 ||
      fromIndex >= cadenceTasks.length ||
      toIndex < 0 ||
      toIndex >= cadenceTasks.length
    ) {
      return;
    }

    const [moved] = cadenceTasks.splice(fromIndex, 1);
    cadenceTasks.splice(toIndex, 0, moved);

    const updates: Promise<any>[] = [];
    cadenceTasks.forEach((t, idx) => {
      const newOrder = idx + 1;
      if (t.sort_order !== newOrder) {
        t.sort_order = newOrder;
        updates.push(
          pb.collection("tasks").update(t.id, { sort_order: newOrder }),
        );
      }
    });

    game.expand.tasks = [
      ...game.expand.tasks.sort((a, b) => a.sort_order - b.sort_order),
    ];

    try {
      await Promise.all(updates);
    } catch (err) {
      console.error("Failed to persist task reordering:", err);
      await fetchGames();
    }
  }

  // TODOS
  async function createTodo(
    userGameId: string,
    title: string,
    notes: string = "",
    dueDate?: string,
  ) {
    if (!pb.authStore.record?.id) throw new Error("Not authenticated");

    const game = games.value.find((g) => g.id === userGameId);
    const existingCount = game?.expand?.todos?.length || 0;

    const created = await pb.collection("todos").create<Todo>({
      user_game: userGameId,
      user: pb.authStore.record.id,
      title,
      notes,
      completed: false,
      due_date: dueDate || "",
      sort_order: existingCount + 1,
    });

    if (game) {
      if (!game.expand) game.expand = {};
      if (!game.expand.todos) game.expand.todos = [];
      game.expand.todos.push(created);
    }

    return created;
  }

  async function toggleTodo(todo: Todo) {
    const prevCompleted = todo.completed;
    todo.completed = !todo.completed;

    try {
      await pb.collection("todos").update(todo.id, {
        completed: todo.completed,
      });
    } catch (err) {
      todo.completed = prevCompleted;
      throw err;
    }
  }

  async function deleteTodo(todoId: string, userGameId: string) {
    await pb.collection("todos").delete(todoId);
    const game = games.value.find((g) => g.id === userGameId);
    if (game?.expand?.todos) {
      game.expand.todos = game.expand.todos.filter((td) => td.id !== todoId);
    }
  }

  // Public List Import
  async function importPublicGame(shareSlug: string): Promise<UserGame> {
    if (!pb.authStore.record?.id)
      throw new Error("Must be logged in to import a game list");

    const clonedGame = await pb.send(
      `/api/dailies/user_games/${shareSlug}/clone`,
      {
        method: "POST",
      },
    );

    await fetchGames();
    return clonedGame;
  }

  return {
    games,
    loading,
    error,
    fetchGames,
    createGame,
    updateGame,
    deleteGame,
    createTask,
    deleteTask,
    reorderTasks,
    toggleTask,
    createTodo,
    toggleTodo,
    deleteTodo,
    importPublicGame,
  };
});
