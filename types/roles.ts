/**
 * Organization roles with hierarchical permissions.
 * Higher rank = more permissions.
 */
export type OrgRole = "owner" | "manager" | "member" | "viewer" | "invited";

/**
 * Numerical rank for each role.
 * Used for role comparison and permission checks.
 */
export const RoleRank: Record<OrgRole, number> = {
  owner: 4,
  manager: 3,
  member: 2,
  viewer: 1,
  invited: 0,
};

/**
 * Check if a role has at least the required rank.
 */
export function hasRoleRank(userRole: OrgRole, requiredRole: OrgRole): boolean {
  return RoleRank[userRole] >= RoleRank[requiredRole];
}

/**
 * Type for organization membership data.
 */
export type OrgMembership = {
  role: OrgRole;
  org_id: string;
  user_id: string;
  created_at?: string;
};
