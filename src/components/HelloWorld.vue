<script setup lang="ts">
import { computed, ref } from "vue";
import { useTasks } from "../composables/useTasks";

const { getCollections, getCollection } = useTasks();

const collections = computed(() => {
  return getCollections().map((name) => getCollection(name));
});
</script>

<template>
  <div v-for="collection in collections">
    <h2>{{ collection.name }}</h2>
  </div>
</template>
