"use client";

import { useState } from "react";
import { ProjectMember, ProjectMemberRole } from "@/types/project-members";
import { X, UserPlus, Shield, User } from "lucide-react";

type OrgMember = {
  user_id: string;
  role: string;
  users?: {
    email: string;
  };
};

type ProjectMembersManagerProps = {
  projectId: string;
  projectMembers: ProjectMember[];
  orgMembers: OrgMember[];
  canManage: boolean;
  onAddMemberAction: (userId: string, role: ProjectMemberRole) => Promise<void>;
  onRemoveMemberAction: (memberId: string) => Promise<void>;
  onUpdateRoleAction: (
    memberId: string,
    role: ProjectMemberRole,
  ) => Promise<void>;
};

export function ProjectMembersManager({
  projectId,
  projectMembers,
  orgMembers,
  canManage,
  onAddMemberAction,
  onRemoveMemberAction,
  onUpdateRoleAction,
}: ProjectMembersManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>("member");
  const [loading, setLoading] = useState(false);

  // Filter out org members who are already in the project
  const projectMemberUserIds = new Set(projectMembers.map((pm) => pm.user_id));
  const availableOrgMembers = orgMembers.filter(
    (om) => !projectMemberUserIds.has(om.user_id),
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await onAddMemberAction(selectedUserId, selectedRole);
      setIsAdding(false);
      setSelectedUserId("");
      setSelectedRole("member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Opravdu chcete odebrat tohoto člena z projektu?")) return;
    setLoading(true);
    try {
      await onRemoveMemberAction(memberId);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: ProjectMemberRole,
  ) => {
    setLoading(true);
    try {
      await onUpdateRoleAction(memberId, newRole);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "manager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "member":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    return role === "manager" ? Shield : User;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            Členové projektu
          </h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {projectMembers.length}
          </span>
        </div>
        {canManage && !isAdding && availableOrgMembers.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Přidat člena
          </button>
        )}
      </div>

      {/* Add member form */}
      {isAdding && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Vyberte člena
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Vyberte --</option>
              {availableOrgMembers.map((om) => (
                <option key={om.user_id} value={om.user_id}>
                  {om.users?.email || om.user_id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(e.target.value as ProjectMemberRole)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddMember}
              disabled={!selectedUserId || loading}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Přidávám..." : "Přidat"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setSelectedUserId("");
                setSelectedRole("member");
              }}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        {projectMembers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Zatím žádní členové projektu
          </p>
        ) : (
          projectMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.role);
            const email = member.users?.email || "Unknown";
            const username = email.split("@")[0];

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
              >
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                  {username.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {username}
                  </p>
                  <p className="truncate text-xs text-gray-500">{email}</p>
                </div>

                {/* Role selector */}
                {canManage ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleUpdateRole(
                        member.id,
                        e.target.value as ProjectMemberRole,
                      )
                    }
                    disabled={loading}
                    className={`rounded border px-2 py-1 text-xs font-medium disabled:opacity-50 ${getRoleBadgeColor(
                      member.role,
                    )}`}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                  </select>
                ) : (
                  <span
                    className={`flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium ${getRoleBadgeColor(
                      member.role,
                    )}`}
                  >
                    <RoleIcon className="h-3 w-3" />
                    {member.role}
                  </span>
                )}

                {/* Remove button */}
                {canManage && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={loading}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Odebrat člena"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info message */}
      {availableOrgMembers.length === 0 && canManage && !isAdding && (
        <p className="text-xs text-gray-500">
          Všichni členové organizace jsou již přidáni do projektu.
        </p>
      )}
    </div>
  );
}
