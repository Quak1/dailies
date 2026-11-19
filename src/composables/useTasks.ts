import { ref } from "vue";

import type { CategoryType, Collection, Task } from "../models";
import { getLastDailyReset, getLastWeeklyReset } from "../utils";

const storageKey = "collections";

const collections = ref<Record<string, Collection>>({});

function saveToStorage() {
  localStorage.setItem(storageKey, JSON.stringify(collections.value));
}

function getCollections() {
  return Object.keys(collections.value);
}

function getCollection(collectionName: string) {
  return collections.value[collectionName];
}

function createCollection(name: string, banner?: string) {
  if (collections.value[name]) return;

  collections.value[name] = {
    name: name,
    banner: banner,
    task: { name: "Tasks", tasks: [] },
    daily: { name: "Dailies", tasks: [], resetHour: 0, lastReset: Date.now() },
    weekly: {
      name: "Weeklies",
      tasks: [],
      resetHour: 0,
      resetDay: 0,
      lastReset: Date.now(),
    },
  };

  saveToStorage();
}

function removeCollection(collectionName: string) {
  delete collections.value[collectionName];
  saveToStorage();
}

function addTask(
  collectionName: string,
  type: CategoryType,
  task: Omit<Task, "id">,
) {
  const collection = collections.value[collectionName];
  const newTask = {
    id: crypto.randomUUID(),
    ...task,
  };

  if (collection[type]) {
    collection[type].tasks.push(newTask);
    saveToStorage();
  } else {
    console.error("Collection is missing type:", type);
  }
}

function removeTask(collectionName: string, type: CategoryType, id: string) {
  const collection = collections.value[collectionName];

  if (!collection[type]) {
    return;
  }

  collection[type].tasks = collection[type].tasks.filter(
    (task) => task.id !== id,
  );
  saveToStorage();
}

function setTaskCount(
  collectionName: string,
  type: CategoryType,
  id: string,
  count: number,
) {
  const task = collections.value[collectionName][type]?.tasks.find(
    (task) => task.id === id,
  );
  if (!task) return;

  if (count > task.maxCount) task.count = task.maxCount;
  else task.count = count;

  saveToStorage();
}

function resetTasks(collectionName: string, type: CategoryType) {
  const collection = collections.value[collectionName];
  if (!collection || !collection[type]) return;

  collection[type].tasks.forEach((task) => {
    task.count = 0;
  });

  if (type === "daily") {
    collection.daily.lastReset = Date.now();
  } else if (type === "weekly") {
    collection.weekly.lastReset = Date.now();
  }

  saveToStorage();
}

function checkAndReset(collectionName: string, type: CategoryType): boolean {
  const collection = collections.value[collectionName];
  if (!collection) return false;

  if (type === "daily" && collection.daily) {
    const lastReset = collection.daily.lastReset;
    const lastScheduledReset = getLastDailyReset(collection.daily.resetHour);
    if (lastReset === undefined || lastReset < lastScheduledReset.getTime()) {
      resetTasks(collectionName, "daily");
      return true;
    }
  } else if (type === "weekly" && collection.weekly) {
    const lastReset = collection.weekly.lastReset;
    const lastScheduledReset = getLastWeeklyReset(
      collection.weekly.resetDay,
      collection.weekly.resetHour,
    );
    if (lastReset === undefined || lastReset < lastScheduledReset.getTime()) {
      resetTasks(collectionName, "weekly");
      return true;
    }
  }

  return false;
}

function checkAndResetAll(): boolean {
  let changed = false;
  for (const collectionName of Object.keys(collections.value)) {
    if (checkAndReset(collectionName, "daily")) changed = true;
    if (checkAndReset(collectionName, "weekly")) changed = true;
  }

  if (changed) {
    saveToStorage();
  }

  return changed;
}

function setResetTime(
  collectionName: string,
  type: CategoryType,
  hour: number,
  day: number,
) {
  const collection = collections.value[collectionName];
  if (!collection || !collection[type]) return;

  if (type === "daily") {
    collection.daily.resetHour = localToUTCDaily(hour);
    collection.daily.lastReset = Date.now();
  } else if (type === "weekly") {
    const { utcDay, utcHour } = localToUTCWeekly(day, hour);
    collection.weekly.resetHour = utcHour;
    collection.weekly.resetDay = utcDay;
    collection.weekly.lastReset = Date.now();
  }

  saveToStorage();
}

function localToUTCDaily(hour: number) {
  const now = new Date();
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    0,
    0,
    0,
  );
  return d.getUTCHours();
}

function localToUTCWeekly(weekday: number, hour: number) {
  const now = new Date();
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    0,
    0,
    0,
  );

  const daysAhead = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + daysAhead);
  if (d <= now) d.setDate(d.getDate() + 7);

  return {
    utcDay: d.getUTCDay(),
    utcHour: d.getUTCHours(),
  };
}

export function useTasks() {
  const stored = localStorage.getItem(storageKey);

  if (stored != null) {
    try {
      const val = JSON.parse(stored);
      collections.value = val;
    } catch (e) {
      console.error("Error parsing localStorage");
    }
  }

  checkAndResetAll();

  return {
    getCollections,
    getCollection,
    createCollection,
    removeCollection,
    addTask,
    removeTask,
    setTaskCount,
    resetTasks,
    checkAndReset,
    checkAndResetAll,
    setResetTime,
  };
}
