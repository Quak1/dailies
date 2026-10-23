<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  X,
  Image,
  Upload,
  Clock,
  Calendar,
  Globe,
  Lock,
} from "lucide-vue-next";
import type { UserGame } from "@/types";

const props = defineProps<{
  show: boolean;
  gameToEdit?: UserGame | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: Partial<UserGame> | FormData): void;
}>();

const name = ref("");
const imageType = ref<"url" | "file">("url");
const imageUrl = ref("");
const imageFile = ref<File | null>(null);
const resetHourUTC = ref(0);
const resetMinuteUTC = ref(0);
const weeklyResetDay = ref(2); // Tuesday
const isPublic = ref(false);

const weekDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.gameToEdit) {
        name.value = props.gameToEdit.name;
        imageUrl.value = props.gameToEdit.image_url || "";
        imageType.value = props.gameToEdit.image_file ? "file" : "url";
        resetHourUTC.value = props.gameToEdit.reset_hour_utc;
        resetMinuteUTC.value = props.gameToEdit.reset_minute_utc;
        weeklyResetDay.value = props.gameToEdit.weekly_reset_day;
        isPublic.value = props.gameToEdit.is_public;
      } else {
        name.value = "";
        imageUrl.value = "";
        imageFile.value = null;
        imageType.value = "url";
        resetHourUTC.value = 0;
        resetMinuteUTC.value = 0;
        weeklyResetDay.value = 2;
        isPublic.value = false;
      }
    }
  },
);

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    imageFile.value = target.files[0];
  }
}

// Local time preview
const localTimePreview = computed(() => {
  const d = new Date();
  d.setUTCHours(resetHourUTC.value, resetMinuteUTC.value, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
});

function handleSubmit() {
  if (!name.value.trim()) return;

  if (imageType.value === "file" && imageFile.value) {
    const formData = new FormData();
    formData.append("name", name.value.trim());
    formData.append("image_file", imageFile.value);
    formData.append("reset_hour_utc", String(resetHourUTC.value));
    formData.append("reset_minute_utc", String(resetMinuteUTC.value));
    formData.append("weekly_reset_day", String(weeklyResetDay.value));
    formData.append("is_public", String(isPublic.value));
    emit("save", formData);
  } else {
    emit("save", {
      name: name.value.trim(),
      image_url: imageUrl.value.trim() || undefined,
      reset_hour_utc: Number(resetHourUTC.value),
      reset_minute_utc: Number(resetMinuteUTC.value),
      weekly_reset_day: Number(weeklyResetDay.value),
      is_public: isPublic.value,
    });
  }
}
</script>

<template>
  <div
    v-if="props.show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
  >
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between"
      >
        <h3 class="text-lg font-bold text-white">
          {{ props.gameToEdit ? "Edit Game Section" : "Add New Game Tracker" }}
        </h3>
        <button
          @click="emit('close')"
          type="button"
          class="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <form
        @submit.prevent="handleSubmit"
        class="p-6 space-y-4 overflow-y-auto"
      >
        <!-- Game Name -->
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Game Name *
          </label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="e.g. Final Fantasy XIV, Genshin Impact"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Banner Image Type -->
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Banner Image
          </label>
          <div class="flex items-center gap-2 mb-2">
            <button
              type="button"
              @click="imageType = 'url'"
              class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5"
              :class="
                imageType === 'url'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              "
            >
              <Image class="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
            <button
              type="button"
              @click="imageType = 'file'"
              class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5"
              :class="
                imageType === 'file'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              "
            >
              <Upload class="w-3.5 h-3.5" />
              <span>File Upload</span>
            </button>
          </div>

          <input
            v-if="imageType === 'url'"
            v-model="imageUrl"
            type="url"
            placeholder="https://example.com/banner.jpg"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />

          <input
            v-else
            type="file"
            accept="image/*"
            @change="handleFileChange"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
          />
        </div>

        <!-- Reset Time (UTC) -->
        <div
          class="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5"
            >
              <Clock class="w-3.5 h-3.5 text-indigo-400" />
              <span>Daily Server Reset (UTC)</span>
            </span>
            <span class="text-xs text-zinc-400 font-mono">
              Local:
              <span class="text-indigo-300 font-bold">{{
                localTimePreview
              }}</span>
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] text-zinc-400 mb-1"
                >UTC Hour (0-23)</label
              >
              <input
                v-model.number="resetHourUTC"
                type="number"
                min="0"
                max="23"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-[11px] text-zinc-400 mb-1"
                >UTC Minute (0-59)</label
              >
              <input
                v-model.number="resetMinuteUTC"
                type="number"
                min="0"
                max="59"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- Weekly Reset Day -->
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5"
          >
            <Calendar class="w-3.5 h-3.5 text-indigo-400" />
            <span>Weekly Reset Day</span>
          </label>
          <select
            v-model.number="weeklyResetDay"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          >
            <option v-for="day in weekDays" :key="day.value" :value="day.value">
              {{ day.label }}
            </option>
          </select>
        </div>

        <!-- Public / Private toggle -->
        <div
          class="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800"
        >
          <div class="flex items-center gap-2.5">
            <component
              :is="isPublic ? Globe : Lock"
              class="w-4 h-4"
              :class="isPublic ? 'text-emerald-400' : 'text-zinc-400'"
            />
            <div>
              <p class="text-xs font-semibold text-zinc-200">
                Public Checklist
              </p>
              <p class="text-[11px] text-zinc-400">
                Generates a shareable read-only link with 1-click import.
              </p>
            </div>
          </div>

          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="isPublic" class="sr-only peer" />
            <div
              class="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"
            ></div>
          </label>
        </div>

        <!-- Modal Actions -->
        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800"
        >
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!name.trim()"
            class="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/25 transition-colors"
          >
            {{ props.gameToEdit ? "Save Changes" : "Create Game" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
