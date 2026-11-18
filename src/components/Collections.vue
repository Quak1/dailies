<script setup lang="ts">
import { computed } from "vue";
import { useTasks } from "../composables/useTasks";

const { getCollections, getCollection } = useTasks();

const collections = computed(() => {
  return getCollections().map((name) => getCollection(name));
});
</script>

<template>
  <CreateCollectionModal />

  <div v-for="collection in collections">
    <Collection :collection="collection" />
  </div>
</template>
