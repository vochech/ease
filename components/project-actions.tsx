"use client";

import { useRoleHelpers } from "../lib/useRoleHelpers";
import type { OrgRole } from "../types/roles";

type ProjectActionsProps = {
  projectId: string;
  userRole: OrgRole | null;
  onEditAction?: () => void;
  onDeleteAction?: () => void;
};

/**
 * Example component showing how to use role-based permissions in the UI.
 *
 * This component conditionally renders action buttons based on the user's role.
 */
export default function ProjectActions({
  projectId,
  userRole,
  onEditAction,
  onDeleteAction,
}: ProjectActionsProps) {
  const { canEdit, canManage, isOwner } = useRoleHelpers(userRole);

  return (
    <div className="flex gap-2">
      {/* View button - all authenticated users can view */}
      <button
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
        onClick={() => (window.location.href = `/projects/${projectId}`)}
      >
        View
      </button>

      {/* Edit button - members and above can edit */}
      {canEdit && onEditAction && (
        <button
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={onEditAction}
        >
          Edit
        </button>
      )}

      {/* Delete button - only managers and owners can delete */}
      {canManage && onDeleteAction && (
        <button
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          onClick={onDeleteAction}
        >
          Delete
        </button>
      )}

      {/* Owner badge */}
      {isOwner && (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
          Owner
        </span>
      )}
    </div>
  );
}
