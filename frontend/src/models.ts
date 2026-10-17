export interface User {
  id: string;
  username: string;
  avatar?: string;
  role: "user" | "admin";
  created: string;
  updated: string;
}

export interface GameTemplate {
  id: string;
  name: string;
  image?: string;
  image_url?: string;
  description?: string;
  reset_hour_utc: number;
  reset_minute_utc: number;
  weekly_reset_day: number; // 0 = Monday, 1 = Tuesday, etc.
  created: string;
  updated: string;
  expand?: {
    template_tasks?: TemplateTask[];
  };
}

export interface TemplateTask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  cadence: "daily" | "weekly";
  sort_order: number;
}

export interface UserGame {
  id: string;
  user: string;
  name: string;
  image?: string;
  image_url?: string;
  reset_hour_utc: number;
  reset_minute_utc: number;
  weekly_reset_day: number; // 0 = Sunday, 1 = Monday, etc.
  is_public: boolean;
  share_slug: string;
  sort_order: number;
  created: string;
  updated: string;
  expand?: {
    tasks?: Task[];
    todos?: Todo[];
  };
}

export interface FetchUserGame extends Omit<UserGame, "expand"> {
  expand?: {
    tasks_via_user_game?: Task[];
    todos_via_user_game?: Todo[];
  };
}

export interface Task {
  id: string;
  user_game: string;
  user: string;
  title: string;
  description?: string;
  cadence: "daily" | "weekly";
  last_completed_at?: string;
  sort_order: number;
}

export interface Todo {
  id: string;
  user: string;
  user_game: string;
  title: string;
  notes?: string;
  completed: boolean;
  sort_order: number;
}
