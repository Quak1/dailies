<script setup lang="ts">
import { useTasks } from "../composables/useTasks";
import type { Collection } from "../models";

const props = defineProps<{
  collection: Collection;
}>();

const { removeCollection } = useTasks();

function handleDelete(collectionName: string) {
  removeCollection(collectionName);
}
</script>

<template>
  <div>
    <div class="flex items-center gap-1">
      <h1>{{ collection.name }}</h1>
      <UButton
        label="Delete"
        color="error"
        variant="outline"
        size="xs"
        icon="i-lucide-trash"
        @click="handleDelete(collection.name)"
      />
    </div>

    <div
      v-for="type in ['task', 'daily', 'weekly']"
      :key="`${collection.name} - ${type}`"
    >
      <div class="flex items-center gap-1">
        <h2>{{ collection[type].name }}</h2>
        <CreateTaskModal :collection="collection.name" :type="type" />
      </div>
      <ul>
        <li v-for="task in collection[type].tasks" :key="task.id">
          <Task :task="task" :collection="collection.name" :category="type" />
        </li>
      </ul>
    </div>
  </div>
</template>
