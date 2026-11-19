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

const state = ref({ title: "", description: "", maxCount: 1 });

function handleSubmit() {
  if (!state.value.title || state.value.maxCount <= 0) return;

  addTask(props.collection, props.type, {
    title: state.value.title,
    description: state.value.description,
    maxCount: state.value.maxCount,
    count: 0,
  });

  open.value = false;
}

function handleClose() {
  state.value = { title: "", description: "", maxCount: 1 };
}
</script>

<template>
  <UModal title="New Collection" v-model:open="open" @after:leave="handleClose">
    <UButton label="Add" variant="subtle" size="lg" icon="i-lucide-plus" />

    <template #body>
      <UForm class="flex flex-col gap-2" @submit="handleSubmit">
        <UFormField label="Title">
          <UInput v-model="state.title" required class="w-full" autofocus />
        </UFormField>

        <UFormField label="Description">
          <UInput v-model="state.description" class="w-full" />
        </UFormField>

        <UFormField label="Count">
          <UInputNumber v-model="state.maxCount" :min="1" class="w-full" />
        </UFormField>

        <UButton type="submit" label="Create" class="self-end" />
      </UForm>
    </template>
  </UModal>
</template>
