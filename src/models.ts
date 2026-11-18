export interface Task {
  id: string;
  title: string;
  description?: string;
  maxCount: number;
  count: number;
}

export interface Category {
  name: string;
  description?: string;
  tasks: Task[];
}

export interface CategoryDaily extends Category {
  resetHour: number;
}

export interface CategoryWeekly extends Category {
  resetHour: number;
  resetDay: number;
}

export interface Collection {
  name: string;
  banner?: string;
  task: Category;
  daily: CategoryDaily;
  weekly: CategoryWeekly;
}

export type CategoryType = "task" | "daily" | "weekly";
