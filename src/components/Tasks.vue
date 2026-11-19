<script setup lang="ts">
import { ref } from "vue";
import type { Category, CategoryType } from "../models";
import { useTasks } from "../composables/useTasks";

const props = defineProps<{
  collectionName: string;
  type: CategoryType;
  category: Category;
}>();

const isEdit = ref(false);

const { removeTask } = useTasks();

function handleDelete(id: string) {
  removeTask(props.collectionName, props.type, id);
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
          :collection="collectionName"
          :type="type"
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
          :collection="collectionName"
          :category="type"
          class="w-full"
        />
      </li>
    </ul>
  </UCard>
</template>
