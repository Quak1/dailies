<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { Clock } from "@lucide/vue";
import { getNextReset, formatCountdown } from "../lib/resetCalculator";

const props = defineProps<{
  cadence: "daily" | "weekly";
  resetHourUTC: number;
  resetMinuteUTC: number;
  weeklyResetDay: number;
}>();

const emit = defineEmits<{
  (e: "tick-reset"): void;
}>();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | null = null;

const nextReset = computed(() => {
  return getNextReset(
    props.cadence,
    props.resetHourUTC,
    props.resetMinuteUTC,
    props.weeklyResetDay,
    now.value,
  );
});

const countdown = computed(() => {
  return formatCountdown(nextReset.value, now.value);
});

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
    if (countdown.value.isPast) {
      emit("tick-reset");
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border"
    :class="
      props.cadence === 'daily'
        ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
        : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
    "
    :title="`Next ${props.cadence} reset at ${String(props.resetHourUTC).padStart(2, '0')}:${String(props.resetMinuteUTC).padStart(2, '0')} UTC`"
  >
    <Clock class="w-3.5 h-3.5 shrink-0 opacity-80" />
    <span
      >{{ props.cadence === "daily" ? "Daily" : "Weekly" }}:
      {{ countdown.formatted }}</span
    >
  </div>
</template>
