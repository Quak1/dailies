import { ref, computed } from "vue";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const secondsHour = 3600;
const secondsDay = secondsHour * 24;

export function useCountdown() {
  const target = ref(new Date());
  const remainingMs = ref(0);

  let intervalId: NodeJS.Timeout | null = null;
  let getTarget: (() => Date) | null = null;
  let onExpireCallback: (() => void) | null = null;

  const display = computed(() => {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs.value / 1000));
    const d = Math.floor(totalSeconds / secondsDay);
    const h = Math.floor((totalSeconds % secondsDay) / secondsHour);
    const m = Math.floor((totalSeconds % secondsHour) / 60);
    const s = totalSeconds % 60;

    const hours = `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
    return d > 0 ? `${d}d ${hours}` : hours;
  });

  function tick() {
    const left = target.value.getTime() - Date.now();
    if (left <= 0) {
      remainingMs.value = 0;
      if (onExpireCallback) onExpireCallback();
      reset();
      return;
    }
    remainingMs.value = left;
  }

  function start(getTargetFn: () => Date, onExpire?: () => void) {
    getTarget = getTargetFn;
    onExpireCallback = onExpire ?? null;
    target.value = getTarget();
    remainingMs.value = Math.max(0, target.value.getTime() - Date.now());

    stop();
    intervalId = setInterval(tick, 100);
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  function reset() {
    if (getTarget) {
      target.value = getTarget();
      remainingMs.value = Math.max(0, target.value.getTime() - Date.now());
    }
  }

  return { start, stop, reset, display };
}
