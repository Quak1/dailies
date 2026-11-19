<script setup lang="ts">
import { ref, watch } from "vue";
import { useTasks } from "../composables/useTasks";
import type { CategoryType } from "../models";

const props = defineProps<{
  collectionName: string;
  type: CategoryType;
}>();

const open = defineModel<boolean>("open");

const emit = defineEmits(["update"]);

const { setResetTime, getCollection } = useTasks();

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

function initValues() {
  const collection = getCollection(props.collectionName);
  if (!collection) return;

  const now = new Date();
  if (props.type === "daily" && collection.daily) {
    const d = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        collection.daily.resetHour,
      ),
    );
    resetHour.value = d.getHours();
  } else if (props.type === "weekly" && collection.weekly) {
    const d = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        collection.weekly.resetHour,
      ),
    );
    const dayDiff = (collection.weekly.resetDay - d.getUTCDay() + 7) % 7;
    d.setUTCDate(d.getUTCDate() + dayDiff);
    resetHour.value = d.getHours();
    resetDay.value = d.getDay();
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    initValues();
  }
});

function handleSubmit() {
  setResetTime(
    props.collectionName,
    props.type,
    resetHour.value,
    resetDay.value,
  );

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
