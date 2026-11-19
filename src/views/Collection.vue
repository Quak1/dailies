<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useTasks } from "../composables/useTasks";
import { categories } from "../models";
import { computed } from "vue";

const route = useRoute();
const router = useRouter();

const { getCollection, removeCollection } = useTasks();

const collection = computed(() => {
  const name = route.params.name;
  if (!name || typeof name === "object") {
    router.push("/");
    return;
  }

  return getCollection(name);
});

function handleDelete(collectionName: string) {
  const ok = confirm(`Delete collection: ${collectionName}?`);
  if (!ok) return;

  removeCollection(collectionName);
  router.push("/");
}
</script>

<template>
  <div v-if="collection" class="mt-4">
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
        :collection="collection"
        class="md:last:col-span-2"
      />
    </div>
  </div>
</template>
