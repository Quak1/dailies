import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/lib/pocketbase'
import { isTaskCompleted } from '@/lib/reset-calculator'
import type { UserGame, Task, Todo } from '@/types'

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  return `${base || 'game'}-${randomSuffix}`
}

export const useGamesStore = defineStore('games', () => {
  const games = ref<UserGame[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchGames() {
    if (!pb.authStore.record?.id) return
    loading.value = true
    error.value = null
    try {
      const userId = pb.authStore.record.id

      // Fetch games, tasks, and todos belonging to current user
      const [fetchedGames, fetchedTasks, fetchedTodos] = await Promise.all([
        pb.collection('user_games').getFullList<UserGame>({
          filter: `user = "${userId}"`,
          sort: 'sort_order'
        }),
        pb.collection('tasks').getFullList<Task>({
          filter: `user = "${userId}"`,
          sort: 'sort_order'
        }),
        pb.collection('todos').getFullList<Todo>({
          filter: `user = "${userId}"`,
          sort: 'sort_order'
        })
      ])

      // Associate tasks and todos to their parent games
      const tasksByGame = new Map<string, Task[]>()
      fetchedTasks.forEach(task => {
        const list = tasksByGame.get(task.user_game) || []
        list.push(task)
        tasksByGame.set(task.user_game, list)
      })

      const todosByGame = new Map<string, Todo[]>()
      fetchedTodos.forEach(todo => {
        const list = todosByGame.get(todo.user_game) || []
        list.push(todo)
        todosByGame.set(todo.user_game, list)
      })

      games.value = fetchedGames.map(game => {
        const gameTasks = (tasksByGame.get(game.id) || []).sort((a, b) => a.sort_order - b.sort_order)
        const gameTodos = (todosByGame.get(game.id) || []).sort((a, b) => a.sort_order - b.sort_order)
        return {
          ...game,
          expand: {
            tasks: gameTasks,
            todos: gameTodos
          }
        }
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to load games'
      console.error('Error fetching games:', err)
    } finally {
      loading.value = false
    }
  }

  async function createGame(payload: Partial<UserGame> | FormData): Promise<UserGame> {
    if (!pb.authStore.record?.id) throw new Error('Not authenticated')

    let created: UserGame
    if (payload instanceof FormData) {
      if (!payload.get('user')) payload.append('user', pb.authStore.record.id)
      if (!payload.get('sort_order')) payload.append('sort_order', String(games.value.length + 1))
      if (!payload.get('share_slug')) {
        const name = payload.get('name')?.toString() || 'game'
        payload.append('share_slug', generateSlug(name))
      }
      created = await pb.collection('user_games').create<UserGame>(payload)
    } else {
      const data: Partial<UserGame> = {
        ...payload,
        user: pb.authStore.record.id,
        sort_order: games.value.length + 1,
        share_slug: payload.share_slug || generateSlug(payload.name || 'game')
      }
      created = await pb.collection('user_games').create<UserGame>(data)
    }

    created.expand = { tasks: [], todos: [] }
    games.value.push(created)
    return created
  }

  async function updateGame(gameId: string, payload: Partial<UserGame> | FormData): Promise<UserGame> {
    const updated = await pb.collection('user_games').update<UserGame>(gameId, payload)
    const index = games.value.findIndex(g => g.id === gameId)
    if (index !== -1) {
      const existing = games.value[index]
      games.value[index] = {
        ...updated,
        expand: existing.expand
      }
    }
    return updated
  }

  async function deleteGame(gameId: string) {
    await pb.collection('user_games').delete(gameId)
    games.value = games.value.filter(g => g.id !== gameId)
  }

  // --- Tasks ---

  async function addTask(userGameId: string, title: string, cadence: 'daily' | 'weekly', description: string = '') {
    if (!pb.authStore.record?.id) throw new Error('Not authenticated')

    const game = games.value.find(g => g.id === userGameId)
    const existingCount = game?.expand?.tasks?.filter(t => t.cadence === cadence).length || 0

    const created = await pb.collection('tasks').create<Task>({
      user_game: userGameId,
      user: pb.authStore.record.id,
      title,
      description,
      cadence,
      sort_order: existingCount + 1
    })

    if (game) {
      if (!game.expand) game.expand = {}
      if (!game.expand.tasks) game.expand.tasks = []
      game.expand.tasks.push(created)
    }

    return created
  }

  async function deleteTask(taskId: string, userGameId: string) {
    await pb.collection('tasks').delete(taskId)
    const game = games.value.find(g => g.id === userGameId)
    if (game?.expand?.tasks) {
      game.expand.tasks = game.expand.tasks.filter(t => t.id !== taskId)
    }
  }

  async function toggleTask(task: Task, game: UserGame) {
    const currentlyDone = isTaskCompleted(
      task.last_completed_at,
      task.cadence,
      game.reset_hour_utc,
      game.reset_minute_utc,
      game.weekly_reset_day
    )

    // Optimistic toggle
    const newTimestamp = currentlyDone ? '' : new Date().toISOString()
    const prevTimestamp = task.last_completed_at
    task.last_completed_at = newTimestamp

    try {
      await pb.collection('tasks').update(task.id, {
        last_completed_at: newTimestamp
      })
    } catch (err) {
      task.last_completed_at = prevTimestamp
      throw err
    }
  }

  async function reorderTasks(userGameId: string, cadence: 'daily' | 'weekly', fromIndex: number, toIndex: number) {
    const game = games.value.find(g => g.id === userGameId)
    if (!game?.expand?.tasks) return
    if (fromIndex === toIndex) return

    // Get current tasks for this cadence sorted by sort_order
    const cadenceTasks = game.expand.tasks
      .filter(t => t.cadence === cadence)
      .sort((a, b) => a.sort_order - b.sort_order)

    if (fromIndex < 0 || fromIndex >= cadenceTasks.length || toIndex < 0 || toIndex >= cadenceTasks.length) {
      return
    }

    // Move element in array
    const [moved] = cadenceTasks.splice(fromIndex, 1)
    cadenceTasks.splice(toIndex, 0, moved)

    // Update sort_order for each task in this cadence
    const updates: Promise<any>[] = []
    cadenceTasks.forEach((t, idx) => {
      const newOrder = idx + 1
      if (t.sort_order !== newOrder) {
        t.sort_order = newOrder
        updates.push(pb.collection('tasks').update(t.id, { sort_order: newOrder }))
      }
    })

    // Re-sort parent tasks and trigger reactivity
    game.expand.tasks = [...game.expand.tasks.sort((a, b) => a.sort_order - b.sort_order)]

    try {
      await Promise.all(updates)
    } catch (err) {
      console.error('Failed to persist task reordering:', err)
      await fetchGames()
    }
  }

  // --- Todos ---

  async function addTodo(userGameId: string, title: string, notes: string = '', dueDate?: string) {
    if (!pb.authStore.record?.id) throw new Error('Not authenticated')

    const game = games.value.find(g => g.id === userGameId)
    const existingCount = game?.expand?.todos?.length || 0

    const created = await pb.collection('todos').create<Todo>({
      user_game: userGameId,
      user: pb.authStore.record.id,
      title,
      notes,
      completed: false,
      due_date: dueDate || '',
      sort_order: existingCount + 1
    })

    if (game) {
      if (!game.expand) game.expand = {}
      if (!game.expand.todos) game.expand.todos = []
      game.expand.todos.push(created)
    }

    return created
  }

  async function toggleTodo(todo: Todo) {
    const prevCompleted = todo.completed
    todo.completed = !todo.completed

    try {
      await pb.collection('todos').update(todo.id, {
        completed: todo.completed
      })
    } catch (err) {
      todo.completed = prevCompleted
      throw err
    }
  }

  async function deleteTodo(todoId: string, userGameId: string) {
    await pb.collection('todos').delete(todoId)
    const game = games.value.find(g => g.id === userGameId)
    if (game?.expand?.todos) {
      game.expand.todos = game.expand.todos.filter(td => td.id !== todoId)
    }
  }

  // --- Public List Import ---

  async function importPublicGame(shareSlug: string): Promise<UserGame> {
    if (!pb.authStore.record?.id) throw new Error('Must be logged in to import a game list')

    try {
      // Try backend clone endpoint first
      const res = await pb.send<UserGame>(`/api/dailies/user_games/${shareSlug}/clone`, {
        method: 'POST'
      })
      await fetchGames()
      return res
    } catch {
      // Fallback manual clone
      const sourceGame = await pb.collection('user_games').getFirstListItem<UserGame>(`share_slug = "${shareSlug}"`)
      const [tasks, todos] = await Promise.all([
        pb.collection('tasks').getFullList<Task>({
          filter: `user_game = "${sourceGame.id}"`,
          sort: 'sort_order'
        }),
        pb.collection('todos').getFullList<Todo>({
          filter: `user_game = "${sourceGame.id}"`,
          sort: 'sort_order'
        })
      ])

      const clonedGame = await pb.collection('user_games').create<UserGame>({
        user: pb.authStore.record.id,
        name: sourceGame.name,
        image_url: sourceGame.image_url || '',
        reset_hour_utc: sourceGame.reset_hour_utc,
        reset_minute_utc: sourceGame.reset_minute_utc,
        weekly_reset_day: sourceGame.weekly_reset_day,
        is_public: false,
        share_slug: generateSlug(sourceGame.name),
        sort_order: games.value.length + 1
      })

      for (const t of tasks) {
        await pb.collection('tasks').create({
          user_game: clonedGame.id,
          user: pb.authStore.record.id,
          title: t.title,
          description: t.description || '',
          cadence: t.cadence,
          last_completed_at: '',
          sort_order: t.sort_order
        })
      }

      for (const td of todos) {
        await pb.collection('todos').create({
          user_game: clonedGame.id,
          user: pb.authStore.record.id,
          title: td.title,
          notes: td.notes || '',
          completed: false,
          due_date: td.due_date || '',
          sort_order: td.sort_order
        })
      }

      await fetchGames()
      return clonedGame
    }
  }

  return {
    games,
    loading,
    error,
    fetchGames,
    createGame,
    updateGame,
    deleteGame,
    addTask,
    deleteTask,
    reorderTasks,
    toggleTask,
    addTodo,
    toggleTodo,
    deleteTodo,
    importPublicGame
  }
})
