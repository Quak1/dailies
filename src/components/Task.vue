<script setup lang="ts">
import { computed, ref } from "vue";
import { useTasks } from "../composables/useTasks";
import type { CategoryType, Task } from "../models";

const props = defineProps<{
  task: Task;
  collection: string;
  category: CategoryType;
}>();

const { setTaskCount } = useTasks();
const checked = ref(props.task.count > 0);
const count = ref(props.task.count);
const isMax = computed(() => count.value === props.task.maxCount);

function handleCheck(value: boolean | "indeterminate") {
  setTaskCount(props.collection, props.category, props.task.id, Number(value));
}

function handleCount(value: number) {
  setTaskCount(props.collection, props.category, props.task.id, value);
}
</script>

<template>
  <UCheckbox
    v-if="task.maxCount === 1"
    v-model="checked"
    :label="task.title"
    :description="task.description"
    @update:model-value="handleCheck"
    class="items-center p-2"
    :ui="{
      label: `${checked ? 'line-through' : ''} text-base`,
      description: 'text-xs',
    }"
    variant="card"
  />
  <div
    v-else
    class="flex items-center gap-2 border border-default rounded-lg p-2"
    :class="{
      'border-primary/50 bg-primary/10 line-through': isMax,
      'hover:bg-elevated/50 hover:border-accented': !isMax,
    }"
  >
    <div>
      <UInputNumber
        v-model="count"
        :label="task.title"
        :description="task.description"
        size="xs"
        :max="task.maxCount"
        :min="0"
        class="w-18"
        :color="`${isMax ? 'neutral' : 'primary'}`"
        @update:model-value="handleCount"
      />

      <UButton
        :label="`Max: ${task.maxCount}`"
        @click="count = task.maxCount"
        variant="outline"
        size="xs"
        class="ml-1"
        :disabled="isMax"
      />
    </div>
    <div class="cursor-default">
      <p>{{ task.title }}</p>
      <p class="text-muted text-xs">{{ task.description }}</p>
    </div>
  </div>
</template>
