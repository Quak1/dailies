<script setup lang="ts">
import { ref } from "vue";
import { useTasks } from "../composables/useTasks";
import type { CategoryType } from "../models";

const props = defineProps<{
  collectionName: string;
  type: CategoryType;
}>();

const open = defineModel<boolean>("open");

const emit = defineEmits(["update"]);

const { setResetTime } = useTasks();

const resetHour = ref(0);
const resetDay = ref(0);

const items = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

function handleSubmit() {
  setResetTime(
    props.collectionName,
    props.type,
    resetHour.value,
    resetDay.value,
  );

  resetHour.value = 0;
  resetDay.value = 0;
  open.value = false;

  emit("update");
}
</script>

<template>
  <UModal title="Update reset time" v-model:open="open">
    <UButton icon="i-lucide-clock" variant="outline" size="sm" />

    <template #body>
      <UForm class="flex flex-col gap-2" @submit="handleSubmit">
        <UFormField label="Reset hour">
          <UInputNumber v-model="resetHour" :max="23" required class="w-full" />
        </UFormField>

        <UFormField v-if="type === 'weekly'" label="Reset day">
          <USelect v-model="resetDay" :items="items" class="w-full" />
        </UFormField>

        <UButton type="submit" label="Save" class="self-end" />
      </UForm>
    </template>
  </UModal>
</template>
