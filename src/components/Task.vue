<script setup lang="ts">
import { useTasks } from "../composables/useTasks";
import type { CategoryType, Task } from "../models";

const props = defineProps<{
  task: Task;
  collection: string;
  category: CategoryType;
}>();

const { setTaskCount } = useTasks();

function handleUpdate(value: boolean | "indeterminate") {
  const newCount = value ? 1 : 0;
  setTaskCount(props.collection, props.category, props.task.id, newCount);
}
</script>

<template>
  <div class="flex items-center gap-1">
    <UCheckbox
      :default-value="!!task.count"
      @update:modelValue="handleUpdate"
    />
    <p :style="{ textDecoration: task.count ? 'line-through' : '' }">
      {{ task.title }}
    </p>
  </div>
</template>
