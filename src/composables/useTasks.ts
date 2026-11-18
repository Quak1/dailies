import { ref } from "vue";

import type { CategoryType, Collection, Task } from "../models";

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
    daily: { name: "Dailies", tasks: [], resetHour: 0 },
    weekly: { name: "Weeklies", tasks: [], resetHour: 0, resetDay: 0 },
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
  collections.value[collectionName][type].tasks.forEach((task) => {
    task.count = 0;
  });
  saveToStorage();
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

  return {
    getCollections,
    getCollection,
    createCollection,
    removeCollection,
    addTask,
    removeTask,
    setTaskCount,
    resetTasks,
  };
}
