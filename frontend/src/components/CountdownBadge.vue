<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
  getNextDailyReset,
  getNextWeeklyReset,
  formatTimeRemaining,
} from "@/lib/reset-calculator";
import { Clock } from "lucide-vue-next";

const props = defineProps<{
  cadence: "daily" | "weekly";
  resetHourUTC: number;
  resetMinuteUTC: number;
  weeklyResetDay: number;
}>();

const emit = defineEmits<{
  (e: "reset-occurred"): void;
}>();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    const prev = now.value;
    now.value = new Date();

    // Check if target was crossed
    if (
      targetReset.value.getTime() <= now.value.getTime() &&
      targetReset.value.getTime() > prev.getTime()
    ) {
      emit("reset-occurred");
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const targetReset = computed(() => {
  if (props.cadence === "daily") {
    return getNextDailyReset(
      now.value,
      props.resetHourUTC,
      props.resetMinuteUTC,
    );
  }
  return getNextWeeklyReset(
    now.value,
    props.resetHourUTC,
    props.resetMinuteUTC,
    props.weeklyResetDay,
  );
});

const timeRemaining = computed(() => {
  return formatTimeRemaining(targetReset.value, now.value);
});
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium backdrop-blur-md"
    :class="
      props.cadence === 'daily'
        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
    "
  >
    <Clock class="w-3 h-3 shrink-0" />
    <span
      class="text-[10px] uppercase font-sans tracking-wider font-semibold opacity-80"
    >
      {{ props.cadence === "daily" ? "Daily" : "Weekly" }}:
    </span>
    <span>{{ timeRemaining }}</span>
  </div>
</template>
