export type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
  project_id: string;
  assigned_to: string | null;
  projects?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assigned_user?: {
    id: string;
    full_name: string;
  } | null;
};

export type Meeting = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_link: string | null;
  created_by: string;
  creator?: {
    user_id: string;
    role: string;
    users?: {
      email: string;
    };
  };
  meeting_participants?: {
    user_id: string;
    status: string;
    participant?: {
      user_id: string;
      role: string;
      users?: {
        email: string;
      };
    };
  }[];
};

export type OrgMember = {
  user_id: string;
  role: string;
  users?: {
    email: string;
  };
};
