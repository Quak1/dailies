<script setup lang="ts">
import { computed } from "vue";
import { useTasks } from "../composables/useTasks";

const { getCollections } = useTasks();

const collections = computed(() => {
  return getCollections();
});
</script>

<template>
  <div class="flex flex-wrap gap-5 mt-5">
    <RouterLink v-for="name in collections" :to="`/collections/${name}`">
      <UCard variant="subtle">
        <h2>{{ name }}</h2>
      </UCard>
    </RouterLink>
  </div>
</template>
