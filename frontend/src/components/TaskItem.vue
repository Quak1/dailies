<script setup lang="ts">
import { computed } from 'vue'
import { Check, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { isTaskCompleted } from '@/lib/reset-calculator'
import type { Task, UserGame } from '@/types'

const props = defineProps<{
  task: Task
  game: UserGame
  readOnly?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', task: Task): void
  (e: 'delete', taskId: string): void
  (e: 'move-up'): void
  (e: 'move-down'): void
}>()

const isCompleted = computed(() => {
  return isTaskCompleted(
    props.task.last_completed_at,
    props.task.cadence,
    props.game.reset_hour_utc,
    props.game.reset_minute_utc,
    props.game.weekly_reset_day
  )
})

function handleToggle() {
  if (props.readOnly) return
  emit('toggle', props.task)
}
</script>

<template>
  <div 
    class="group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200"
    :class="[
      isCompleted 
        ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60' 
        : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850',
      props.readOnly ? 'cursor-default' : 'cursor-pointer'
    ]"
    @click="handleToggle"
  >
    <div class="flex items-center gap-2.5 min-w-0 flex-1">
      <!-- Drag handle (shown when not read-only) -->
      <div
        v-if="!props.readOnly"
        class="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing p-0.5 -ml-1 transition-colors shrink-0"
        title="Drag to reorder"
        @click.stop
      >
        <GripVertical class="w-3.5 h-3.5" />
      </div>

      <!-- Checkbox -->
      <button
        type="button"
        class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0"
        :class="isCompleted 
          ? 'bg-emerald-600 border-emerald-500 text-white' 
          : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500 text-transparent'"
        :disabled="props.readOnly"
        :aria-label="props.task.title"
      >
        <Check class="w-3.5 h-3.5 stroke-[3]" />
      </button>

      <!-- Task info -->
      <div class="min-w-0 flex-1">
        <p 
          class="text-sm font-medium leading-snug truncate select-none transition-colors"
          :class="isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'"
        >
          {{ props.task.title }}
        </p>
        <p v-if="props.task.description" class="text-xs text-zinc-400 truncate mt-0.5">
          {{ props.task.description }}
        </p>
      </div>
    </div>

    <!-- Actions (only if not read-only) -->
    <div v-if="!props.readOnly" class="flex items-center gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2 shrink-0">
      <!-- Move Up -->
      <button
        type="button"
        @click.stop="emit('move-up')"
        :disabled="!props.canMoveUp"
        class="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-colors"
        title="Move up"
      >
        <ChevronUp class="w-3.5 h-3.5" />
      </button>

      <!-- Move Down -->
      <button
        type="button"
        @click.stop="emit('move-down')"
        :disabled="!props.canMoveDown"
        class="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-colors"
        title="Move down"
      >
        <ChevronDown class="w-3.5 h-3.5" />
      </button>

      <!-- Delete -->
      <button
        type="button"
        @click.stop="emit('delete', props.task.id)"
        class="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors ml-0.5"
        title="Delete task"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
