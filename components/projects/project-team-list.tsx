import type { OrgRole } from "@/types/roles";

type TeamMember = {
  user_id: string;
  role: OrgRole;
  users?: { email?: string };
};

type ProjectTeamListProps = {
  members: TeamMember[];
  canManage: boolean;
};

/**
 * Display team members assigned to a project with their roles.
 * Shows member count, emails, and role badges.
 */
export function ProjectTeamList({ members, canManage }: ProjectTeamListProps) {
  const getRoleBadgeColor = (role: OrgRole) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700";
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "member":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-600">No team members yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Team Members</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {members.map((member) => {
          const email = member.users?.email || "Unknown";
          const displayName = email.split("@")[0];

          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                {/* Name & Email */}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500">{email}</p>
                </div>
              </div>

              {/* Role Badge */}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                  member.role,
                )}`}
              >
                {member.role}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
