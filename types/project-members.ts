// Project member types

export type ProjectMemberRole = "manager" | "member";

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  added_by: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    email: string;
  };
};

export type AddProjectMemberPayload = {
  user_id: string;
  role: ProjectMemberRole;
};

export type UpdateProjectMemberPayload = {
  role: ProjectMemberRole;
};
