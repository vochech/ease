import { NextResponse } from "next/server";
import { supabaseServer } from "./supabaseServer";
import type { OrgRole, OrgMembership } from "../types/roles";
import { RoleRank } from "../types/roles";

/**
 * Get the current authenticated user.
 * Returns null if not authenticated.
 */
export async function getUser() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("getUser error:", error);
    return null;
  }
}

/**
 * Get the current session.
 * Returns null if no active session.
 */
export async function getSession() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("getSession error:", error);
    return null;
  }
}

/**
 * Get the user's membership for a specific organization.
 * Returns null if the user is not a member.
 */
export async function getOrgMembership(
  orgId: string
): Promise<OrgMembership | null> {
  try {
    const user = await getUser();
    if (!user) {
      return null;
    }

    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("org_members")
      .select("role, org_id, user_id, created_at")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as OrgMembership;
  } catch (error) {
    console.error("getOrgMembership error:", error);
    return null;
  }
}

/**
 * Require that the current user has one of the allowed roles for the organization.
 * Throws a 401 if not authenticated, 403 if not a member or insufficient permissions.
 * 
 * @param orgId - The organization ID to check membership for
 * @param allowedRoles - Array of roles that are allowed to access this resource
 * @returns The user's membership if authorized
 * 
 * @example
 * ```ts
 * // In an API route:
 * const membership = await requireRole(orgId, ['owner', 'manager']);
 * // Continues if user has owner or manager role, otherwise throws 403
 * ```
 */
export async function requireRole(
  orgId: string,
  allowedRoles: OrgRole[]
): Promise<OrgMembership> {
  const user = await getUser();
  
  if (!user) {
    throw NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const membership = await getOrgMembership(orgId);

  if (!membership) {
    throw NextResponse.json(
      { error: "Forbidden. You are not a member of this organization." },
      { status: 403 }
    );
  }

  const hasPermission = allowedRoles.includes(membership.role);

  if (!hasPermission) {
    throw NextResponse.json(
      {
        error: "Forbidden. Insufficient permissions.",
        requiredRoles: allowedRoles,
        yourRole: membership.role,
      },
      { status: 403 }
    );
  }

  return membership;
}

/**
 * Check if a user has at least a specific role rank.
 * Useful for hierarchical permission checks (e.g., "manager or above").
 */
export async function hasMinimumRole(
  orgId: string,
  minimumRole: OrgRole
): Promise<boolean> {
  const membership = await getOrgMembership(orgId);
  
  if (!membership) {
    return false;
  }

  return RoleRank[membership.role] >= RoleRank[minimumRole];
}
