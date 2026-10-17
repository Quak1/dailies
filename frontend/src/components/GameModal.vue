<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { DAYS_OF_WEEK } from "../lib/resetCalculator";
import { X, Upload, Globe, Lock } from "@lucide/vue";
import type { UserGame } from "../models";

const props = defineProps<{
  show: boolean;
  gameToEdit?: UserGame | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "save",
    payload: {
      name: string;
      image_url?: string;
      imageFile?: File | null;
      reset_hour_utc: number;
      reset_minute_utc: number;
      weekly_reset_day: number;
      is_public: boolean;
    },
  ): void;
}>();

const name = ref("");
const imageMode = ref<"url" | "upload">("url");
const imageUrl = ref("");
const selectedFile = ref<File | null>(null);
const filePreview = ref<string | null>(null);
const resetHourUTC = ref(0);
const resetMinuteUTC = ref(0);
const weeklyResetDay = ref(2); // Tuesday default
const isPublic = ref(false);

watch(
  () => props.gameToEdit,
  (editGame) => {
    if (editGame) {
      name.value = editGame.name;
      imageUrl.value = editGame.image_url || "";
      resetHourUTC.value = editGame.reset_hour_utc;
      resetMinuteUTC.value = editGame.reset_minute_utc;
      weeklyResetDay.value = editGame.weekly_reset_day;
      isPublic.value = editGame.is_public;
      selectedFile.value = null;
      filePreview.value = null;
      imageMode.value = editGame.image_url ? "url" : "upload";
    } else {
      // Defaults for new game
      name.value = "";
      imageUrl.value = "";
      resetHourUTC.value = 15; // Common 15:00 UTC
      resetMinuteUTC.value = 0;
      weeklyResetDay.value = 2; // Tuesday
      isPublic.value = false;
      selectedFile.value = null;
      filePreview.value = null;
      imageMode.value = "url";
    }
  },
  { immediate: true },
);

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    selectedFile.value = file;
    filePreview.value = URL.createObjectURL(file);
  }
}

// Local time representation helper
const localResetTimePreview = computed(() => {
  const date = new Date();
  date.setUTCHours(resetHourUTC.value, resetMinuteUTC.value, 0, 0);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
});

function handleSubmit() {
  if (!name.value.trim()) return;

  emit("save", {
    name: name.value.trim(),
    image_url: imageMode.value === "url" ? imageUrl.value.trim() : undefined,
    imageFile: imageMode.value === "upload" ? selectedFile.value : null,
    reset_hour_utc: Number(resetHourUTC.value),
    reset_minute_utc: Number(resetMinuteUTC.value),
    weekly_reset_day: Number(weeklyResetDay.value),
    is_public: isPublic.value,
  });
}
</script>

<template>
  <div
    v-if="props.show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
  >
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div
        class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between"
      >
        <h3 class="text-base font-bold text-white">
          {{ props.gameToEdit ? "Edit Game Section" : "Add New Game Section" }}
        </h3>
        <button
          type="button"
          @click="emit('close')"
          class="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <form
        @submit.prevent="handleSubmit"
        class="p-6 space-y-4 overflow-y-auto flex-1"
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
            class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Picture Mode Tabs -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label
              class="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              Banner Picture
            </label>
            <div
              class="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs"
            >
              <button
                type="button"
                @click="imageMode = 'url'"
                class="px-2.5 py-0.5 rounded-md transition-colors"
                :class="
                  imageMode === 'url'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                "
              >
                URL
              </button>
              <button
                type="button"
                @click="imageMode = 'upload'"
                class="px-2.5 py-0.5 rounded-md transition-colors"
                :class="
                  imageMode === 'upload'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                "
              >
                Upload File
              </button>
            </div>
          </div>

          <!-- URL Input -->
          <div v-if="imageMode === 'url'">
            <input
              v-model="imageUrl"
              type="url"
              placeholder="https://example.com/cover.jpg"
              class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- File Upload -->
          <div v-else>
            <label
              class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition-colors"
            >
              <div
                v-if="!filePreview"
                class="flex flex-col items-center justify-center pt-2 pb-2"
              >
                <Upload class="w-6 h-6 text-zinc-400 mb-1" />
                <p class="text-xs text-zinc-400">
                  Click to upload image (PNG, JPG, WebP)
                </p>
              </div>
              <div v-else class="flex items-center gap-3 p-2">
                <img
                  :src="filePreview"
                  class="w-16 h-14 object-cover rounded-lg border border-zinc-700"
                />
                <p class="text-xs text-zinc-300 truncate max-w-[200px]">
                  {{ selectedFile?.name }}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileChange"
              />
            </label>
          </div>
        </div>

        <!-- Server Reset Time (UTC) -->
        <div
          class="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-3"
        >
          <div class="flex items-center justify-between">
            <label
              class="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Server Reset Time (UTC)
            </label>
            <span class="text-xs text-indigo-400 font-mono">
              = {{ localResetTimePreview }} (Local)
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="text-xs text-zinc-500 block mb-1"
                >Hour (00 - 23 UTC)</span
              >
              <input
                v-model.number="resetHourUTC"
                type="number"
                min="0"
                max="23"
                required
                class="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <span class="text-xs text-zinc-500 block mb-1"
                >Minute (00 - 59)</span
              >
              <input
                v-model.number="resetMinuteUTC"
                type="number"
                min="0"
                max="59"
                required
                class="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Weekly Reset Day -->
          <div>
            <span class="text-xs text-zinc-500 block mb-1"
              >Weekly Reset Day</span
            >
            <select
              v-model.number="weeklyResetDay"
              class="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option
                v-for="(day, idx) in DAYS_OF_WEEK"
                :key="idx"
                :value="idx"
              >
                {{ day }}
              </option>
            </select>
          </div>
        </div>

        <!-- Privacy & Visibility -->
        <div
          class="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-zinc-900 text-zinc-300">
              <component :is="isPublic ? Globe : Lock" class="w-4 h-4" />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-200">
                {{ isPublic ? "Public Checklist" : "Private Checklist" }}
              </p>
              <p class="text-xs text-zinc-500">
                {{
                  isPublic
                    ? "Anyone with the share link can view and import your list"
                    : "Only you can see this section"
                }}
              </p>
            </div>
          </div>

          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="isPublic" class="sr-only peer" />
            <div
              class="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800"
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
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-colors"
          >
            {{ props.gameToEdit ? "Save Changes" : "Create Section" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
