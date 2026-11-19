<script setup lang="ts">
import { ref } from "vue";
import { useTasks } from "../composables/useTasks";
import { useRouter } from "vue-router";

const open = defineModel<boolean>("open");

const router = useRouter();
const { createCollection } = useTasks();

const name = ref("");
const banner = ref("");

function handleSubmit() {
  if (!name.value) return;

  createCollection(name.value, banner.value);

  open.value = false;
  router.push("/collections/" + name.value);
}
</script>

<template>
  <UModal title="New Collection" v-model:open="open">
    <UButton label="Create new collection" />

    <template #body>
      <UForm class="flex flex-col gap-2" @submit="handleSubmit">
        <UFormField label="Name">
          <UInput v-model="name" required class="w-full" />
        </UFormField>

        <UFormField label="Banner" description="Image URL for the collection">
          <UInput v-model="banner" class="w-full" />
        </UFormField>

        <UButton type="submit" label="Create" class="self-end" />
      </UForm>
    </template>
  </UModal>
</template>
