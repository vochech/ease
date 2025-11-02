export type OrgSettings = {
  id: string;
  org_id: string;
  timezone: string;
  work_days: string[];
  default_work_hours_per_day: number;
  notifications: Record<string, unknown>;
  meeting_policy: Record<string, unknown>;
  ai_assistant_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type PartialOrgSettings = Partial<
  Pick<
    OrgSettings,
    | "timezone"
    | "work_days"
    | "default_work_hours_per_day"
    | "notifications"
    | "meeting_policy"
    | "ai_assistant_enabled"
  >
>;

export type UserSettings = {
  id: string;
  user_id: string;
  org_id: string;
  theme: "system" | "light" | "dark";
  language: string;
  notifications: Record<string, unknown>;
  focus_start: string | null; // HH:MM:SS
  focus_end: string | null;   // HH:MM:SS
  meeting_reminders: boolean;
  created_at: string;
  updated_at: string;
};

export type PartialUserSettings = Partial<
  Pick<
    UserSettings,
    | "theme"
    | "language"
    | "notifications"
    | "focus_start"
    | "focus_end"
    | "meeting_reminders"
  >
>;
