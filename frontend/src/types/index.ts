export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  created?: string;
  updated?: string;
}

export interface GameTemplate {
  id: string;
  name: string;
  banner_image_url?: string;
  banner_file?: string;
  reset_hour_utc: number;
  reset_minute_utc: number;
  weekly_reset_day: number;
  sort_order: number;
  expand?: {
    template_tasks?: TemplateTask[];
  };
}

export interface TemplateTask {
  id: string;
  game_template: string;
  title: string;
  description?: string;
  cadence: "daily" | "weekly";
  sort_order: number;
}

export interface UserGame {
  id: string;
  user: string;
  name: string;
  image_url?: string;
  image_file?: string;
  reset_hour_utc: number;
  reset_minute_utc: number;
  weekly_reset_day: number;
  is_public: boolean;
  share_slug: string;
  sort_order: number;
  expand?: {
    tasks?: Task[];
    todos?: Todo[];
    user?: User;
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
  user_game: string;
  user: string;
  title: string;
  notes?: string;
  completed: boolean;
  due_date?: string;
  sort_order: number;
}
