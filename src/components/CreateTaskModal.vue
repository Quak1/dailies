<script setup lang="ts">
import { ref } from "vue";
import { useTasks } from "../composables/useTasks";
import type { CategoryType } from "../models";

const open = defineModel<boolean>("open");

const props = defineProps<{
  collection: string;
  type: CategoryType;
}>();

const { addTask } = useTasks();

const title = ref("");
const description = ref("");
const maxCount = ref(1);

function handleSubmit() {
  if (!title.value || maxCount.value <= 0) return;

  addTask(props.collection, props.type, {
    title: title.value,
    description: description.value,
    maxCount: maxCount.value,
    count: 0,
  });

  open.value = false;
}
</script>

<template>
  <UModal title="New Collection" v-model:open="open">
    <UButton label="Add" variant="subtle" icon="i-lucide-plus" />

    <template #body>
      <UForm class="flex flex-col gap-2" @submit="handleSubmit">
        <UFormField label="Title">
          <UInput v-model="title" required class="w-full" />
        </UFormField>

        <UFormField label="Description">
          <UInput v-model="description" class="w-full" />
        </UFormField>

        <UFormField label="Count">
          <UInputNumber v-model="maxCount" :min="1" class="w-full" />
        </UFormField>

        <UButton type="submit" label="Create" class="self-end" />
      </UForm>
    </template>
  </UModal>
</template>
