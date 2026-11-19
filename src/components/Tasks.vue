<script setup lang="ts">
import { onUnmounted, ref } from "vue";
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

const { removeTask, resetTasks } = useTasks();
const { start, stop, reset, display } = useCountdown();

if (props.type === "daily") {
  start(() => {
    resetTasks(props.collection.name, props.type);
    return getDailyTarget(props.collection.daily.resetHour);
  });
} else if (props.type === "weekly") {
  start(() => {
    resetTasks(props.collection.name, props.type);
    return getWeeklyTarget(
      props.collection.weekly.resetDay,
      props.collection.daily.resetHour,
    );
  });
}

onUnmounted(() => {
  stop();
});

function handleDelete(id: string) {
  removeTask(props.collection.name, props.type, id);
}
</script>

<template>
  <UCard variant="subtle">
    <template #header>
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

      <div
        v-if="type === 'daily' || type === 'weekly'"
        class="flex items-center gap-1 mt-1"
      >
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
