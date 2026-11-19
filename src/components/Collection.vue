<script setup lang="ts">
import { useTasks } from "../composables/useTasks";
import { categories, type Collection } from "../models";

const props = defineProps<{
  collection: Collection;
}>();

const { removeCollection } = useTasks();

function handleDelete(collectionName: string) {
  const ok = confirm(`Delete collection: ${collectionName}?`);
  if (!ok) return;

  removeCollection(collectionName);
}
</script>

<template>
  <div class="mt-4">
    <div class="flex items-center gap-1 mb-4">
      <h1>{{ collection.name }}</h1>
      <UButton
        label="Delete"
        color="error"
        variant="outline"
        size="xs"
        icon="i-lucide-trash"
        @click="handleDelete(collection.name)"
        class="ml-auto"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Tasks
        v-for="type in categories"
        :key="`${collection.name} - ${type}`"
        :type="type"
        :category="collection[type]"
        :collectionName="collection.name"
        class="md:last:col-span-2"
      />
    </div>
  </div>
</template>
