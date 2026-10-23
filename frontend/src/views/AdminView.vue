<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRepositoryStore } from "@/stores/repository";
import { resolveImageUrl } from "@/lib/pocketbase";
import { Shield, Plus, Trash2 } from "lucide-vue-next";
import type { GameTemplate } from "@/types";

const repoStore = useRepositoryStore();

const showAddTemplate = ref(false);
const name = ref("");
const bannerImageUrl = ref("");
const resetHourUTC = ref(0);
const resetMinuteUTC = ref(0);
const weeklyResetDay = ref(2);

// Task creation modal/state
const activeTemplateForTask = ref<GameTemplate | null>(null);
const taskTitle = ref("");
const taskDesc = ref("");
const taskCadence = ref<"daily" | "weekly">("daily");

onMounted(async () => {
  await repoStore.fetchTemplates();
});

async function handleCreateTemplate() {
  if (!name.value.trim()) return;
  try {
    await repoStore.createTemplate({
      name: name.value.trim(),
      banner_image_url: bannerImageUrl.value.trim() || undefined,
      reset_hour_utc: Number(resetHourUTC.value),
      reset_minute_utc: Number(resetMinuteUTC.value),
      weekly_reset_day: Number(weeklyResetDay.value),
      sort_order: repoStore.templates.length + 1,
    });
    name.value = "";
    bannerImageUrl.value = "";
    showAddTemplate.value = false;
  } catch (err: any) {
    alert(err?.message || "Failed to create template");
  }
}

async function handleDeleteTemplate(id: string) {
  if (confirm("Are you sure you want to delete this template?")) {
    await repoStore.deleteTemplate(id);
  }
}

async function handleAddTask() {
  if (!activeTemplateForTask.value || !taskTitle.value.trim()) return;
  try {
    await repoStore.createTemplateTask(activeTemplateForTask.value.id, {
      title: taskTitle.value.trim(),
      description: taskDesc.value.trim() || undefined,
      cadence: taskCadence.value,
    });
    taskTitle.value = "";
    taskDesc.value = "";
    activeTemplateForTask.value = null;
  } catch (err: any) {
    alert(err?.message || "Failed to add task to template");
  }
}

async function handleDeleteTask(taskId: string, templateId: string) {
  await repoStore.deleteTemplateTask(taskId, templateId);
}
</script>

<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <div
      class="flex items-center justify-between pb-6 border-b border-zinc-800"
    >
      <div>
        <h1
          class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5"
        >
          <Shield class="w-7 h-7 text-indigo-400" />
          <span>Curated Repository Admin</span>
        </h1>
        <p class="text-sm text-zinc-400 mt-1">
          Manage system-level game templates and default tasks that all players
          can clone.
        </p>
      </div>

      <button
        @click="showAddTemplate = true"
        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-colors"
      >
        <Plus class="w-4 h-4" />
        <span>New Template</span>
      </button>
    </div>

    <!-- Add Template Form Modal -->
    <div
      v-if="showAddTemplate"
      class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
    >
      <h3 class="text-lg font-bold text-white">
        Create New Curated Game Template
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1"
            >Game Name</label
          >
          <input
            v-model="name"
            type="text"
            placeholder="e.g. World of Warcraft"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1"
            >Banner Image URL</label
          >
          <input
            v-model="bannerImageUrl"
            type="url"
            placeholder="https://..."
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1"
            >UTC Reset (Hour / Minute)</label
          >
          <div class="flex gap-2">
            <input
              v-model.number="resetHourUTC"
              type="number"
              min="0"
              max="23"
              class="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              placeholder="Hour"
            />
            <input
              v-model.number="resetMinuteUTC"
              type="number"
              min="0"
              max="59"
              class="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              placeholder="Min"
            />
          </div>
        </div>
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1"
            >Weekly Reset Day (0=Sun, 2=Tue)</label
          >
          <input
            v-model.number="weeklyResetDay"
            type="number"
            min="0"
            max="6"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button
          @click="showAddTemplate = false"
          class="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          @click="handleCreateTemplate"
          :disabled="!name.trim()"
          class="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Save Template
        </button>
      </div>
    </div>

    <!-- Templates List -->
    <div class="space-y-6">
      <div
        v-for="tmpl in repoStore.templates"
        :key="tmpl.id"
        class="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <img
              :src="resolveImageUrl(tmpl)"
              class="w-16 h-16 rounded-xl object-cover bg-zinc-800 border border-zinc-700"
            />
            <div>
              <h3 class="text-lg font-bold text-white">{{ tmpl.name }}</h3>
              <p class="text-xs text-zinc-400 font-mono">
                Daily Reset:
                {{ String(tmpl.reset_hour_utc).padStart(2, "0") }}:{{
                  String(tmpl.reset_minute_utc).padStart(2, "0")
                }}
                UTC · Weekly Day: {{ tmpl.weekly_reset_day }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="activeTemplateForTask = tmpl"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
            <button
              @click="handleDeleteTemplate(tmpl.id)"
              class="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Tasks list -->
        <div class="border-t border-zinc-800/80 pt-3 space-y-1.5">
          <p
            class="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Default Tasks ({{ (tmpl.expand?.template_tasks || []).length }})
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div
              v-for="task in tmpl.expand?.template_tasks || []"
              :key="task.id"
              class="flex items-center justify-between p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs"
            >
              <div class="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0"
                  :class="
                    task.cadence === 'daily'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  "
                >
                  {{ task.cadence }}
                </span>
                <span class="truncate text-zinc-200">{{ task.title }}</span>
              </div>
              <button
                @click="handleDeleteTask(task.id, tmpl.id)"
                class="text-zinc-500 hover:text-red-400 p-0.5 rounded"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div
      v-if="activeTemplateForTask"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4"
      >
        <h3 class="text-lg font-bold text-white">
          Add Task to {{ activeTemplateForTask.name }}
        </h3>
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1"
            >Title</label
          >
          <input
            v-model="taskTitle"
            type="text"
            placeholder="e.g. Daily Roulette"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1"
            >Description (optional)</label
          >
          <input
            v-model="taskDesc"
            type="text"
            placeholder="Notes or rewards"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1"
            >Cadence</label
          >
          <select
            v-model="taskCadence"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="activeTemplateForTask = null"
            class="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            @click="handleAddTask"
            :disabled="!taskTitle.trim()"
            class="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
