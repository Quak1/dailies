import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/lib/pocketbase'
import { useGamesStore } from './games'
import type { GameTemplate, TemplateTask } from '@/types'

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  return `${base || 'game'}-${randomSuffix}`
}

export const useRepositoryStore = defineStore('repository', () => {
  const templates = ref<GameTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTemplates() {
    loading.value = true
    error.value = null
    try {
      const [fetchedTemplates, fetchedTasks] = await Promise.all([
        pb.collection('game_templates').getFullList<GameTemplate>({
          sort: 'sort_order'
        }),
        pb.collection('template_tasks').getFullList<TemplateTask>({
          sort: 'sort_order'
        })
      ])

      const tasksByTemplate = new Map<string, TemplateTask[]>()
      fetchedTasks.forEach(task => {
        const list = tasksByTemplate.get(task.game_template) || []
        list.push(task)
        tasksByTemplate.set(task.game_template, list)
      })

      templates.value = fetchedTemplates.map(template => ({
        ...template,
        expand: {
          template_tasks: tasksByTemplate.get(template.id) || []
        }
      }))
    } catch (err: any) {
      error.value = err.message || 'Failed to load templates'
      console.error('Error fetching templates:', err)
    } finally {
      loading.value = false
    }
  }

  async function cloneTemplate(template: GameTemplate) {
    if (!pb.authStore.record?.id) {
      throw new Error('You must be logged in to add templates to your tracker')
    }

    const gamesStore = useGamesStore()
    const userId = pb.authStore.record.id

    // 1. Create user game
    const newGame = await pb.collection('user_games').create({
      user: userId,
      name: template.name,
      image_url: template.banner_image_url || '',
      reset_hour_utc: template.reset_hour_utc,
      reset_minute_utc: template.reset_minute_utc,
      weekly_reset_day: template.weekly_reset_day,
      is_public: false,
      share_slug: generateSlug(template.name),
      sort_order: gamesStore.games.length + 1
    })

    // 2. Clone template tasks
    const tasks = template.expand?.template_tasks || []
    for (const t of tasks) {
      await pb.collection('tasks').create({
        user_game: newGame.id,
        user: userId,
        title: t.title,
        description: t.description || '',
        cadence: t.cadence,
        last_completed_at: '',
        sort_order: t.sort_order
      })
    }

    await gamesStore.fetchGames()
    return newGame
  }

  async function createTemplate(payload: Partial<GameTemplate> | FormData) {
    const created = await pb.collection('game_templates').create<GameTemplate>(payload)
    await fetchTemplates()
    return created
  }

  async function updateTemplate(id: string, payload: Partial<GameTemplate> | FormData) {
    const updated = await pb.collection('game_templates').update<GameTemplate>(id, payload)
    await fetchTemplates()
    return updated
  }

  async function deleteTemplate(id: string) {
    await pb.collection('game_templates').delete(id)
    templates.value = templates.value.filter(t => t.id !== id)
  }

  async function createTemplateTask(gameTemplateId: string, data: { title: string; description?: string; cadence: 'daily' | 'weekly' }) {
    const tmpl = templates.value.find(t => t.id === gameTemplateId)
    const existingCount = tmpl?.expand?.template_tasks?.length || 0

    const created = await pb.collection('template_tasks').create<TemplateTask>({
      game_template: gameTemplateId,
      title: data.title,
      description: data.description || '',
      cadence: data.cadence,
      sort_order: existingCount + 1
    })

    if (tmpl) {
      if (!tmpl.expand) tmpl.expand = {}
      if (!tmpl.expand.template_tasks) tmpl.expand.template_tasks = []
      tmpl.expand.template_tasks.push(created)
    }

    return created
  }

  async function deleteTemplateTask(taskId: string, templateId: string) {
    await pb.collection('template_tasks').delete(taskId)
    const tmpl = templates.value.find(t => t.id === templateId)
    if (tmpl?.expand?.template_tasks) {
      tmpl.expand.template_tasks = tmpl.expand.template_tasks.filter(t => t.id !== taskId)
    }
  }

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    cloneTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createTemplateTask,
    deleteTemplateTask
  }
})
