<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import type { Category, CategoryType, Collection } from "../models";
import { useTasks } from "../composables/useTasks";
import { getDailyTarget, getWeeklyTarget } from "../utils";
import { useCountdown } from "../composables/useCountdown";

const props = defineProps<{
  collection: Collection;
  type: CategoryType;
  category: Category;
}>();

const isEdit = ref(false);

const { removeTask, resetTasks, checkAndReset } = useTasks();
const { start, stop, reset, display } = useCountdown();

const progress = computed(() =>
  props.collection[props.type].tasks.reduce(
    (acc, task) => (acc += task.count),
    0,
  ),
);
const progressMax = computed(() =>
  props.collection[props.type].tasks.reduce(
    (acc, task) => (acc += task.maxCount),
    0,
  ),
);

if (props.type === "daily") {
  checkAndReset(props.collection.name, "daily");
  start(
    () => getDailyTarget(props.collection.daily.resetHour),
    () => {
      resetTasks(props.collection.name, "daily");
    },
  );
} else if (props.type === "weekly") {
  checkAndReset(props.collection.name, "weekly");
  start(
    () =>
      getWeeklyTarget(
        props.collection.weekly.resetDay,
        props.collection.weekly.resetHour,
      ),
    () => {
      resetTasks(props.collection.name, "weekly");
    },
  );
}

function handleVisibilityOrFocus() {
  if (props.type === "daily" || props.type === "weekly") {
    const wasReset = checkAndReset(props.collection.name, props.type);
    if (wasReset) reset();
  }
}

window.addEventListener("focus", handleVisibilityOrFocus);
document.addEventListener("visibilitychange", handleVisibilityOrFocus);

onUnmounted(() => {
  stop();
  window.removeEventListener("focus", handleVisibilityOrFocus);
  document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
});

function handleDelete(id: string) {
  removeTask(props.collection.name, props.type, id);
}
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <h2>{{ category.name }}</h2>
          <UButton
            @click="isEdit = !isEdit"
            variant="outline"
            size="sm"
            icon="i-lucide-pencil"
          />
          <CreateTaskModal
            :collection="collection.name"
            :type="type"
            class="ml-auto"
          />
        </div>

        <div v-if="type === 'daily' || type === 'weekly'">
          <div class="flex items-center gap-1">
            <p class="text-muted">
              Reset in:
              <span class="text-primary font-bold text-lg">{{ display }}</span>
            </p>
            <ModalEditResetTime
              :collectionName="collection.name"
              :type="type"
              @update="reset"
              class="ml-auto"
            />
          </div>
        </div>

        <UProgress :max="progressMax" v-model="progress" />
      </div>
    </template>

    <ul class="flex flex-col gap-1">
      <li
        v-for="task in category.tasks"
        :key="task.id"
        class="flex items-center gap-2"
      >
        <UButton
          v-if="isEdit"
          @click="handleDelete(task.id)"
          variant="outline"
          color="error"
          size="sm"
          icon="i-lucide-trash"
        />
        <Task
          :task="task"
          :collection="collection.name"
          :category="type"
          class="w-full"
        />
      </li>
    </ul>
  </UCard>
</template>
