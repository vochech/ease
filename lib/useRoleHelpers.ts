"use client";

import { useState, useEffect } from "react";
import type { OrgRole } from "../types/roles";
import { RoleRank } from "../types/roles";

/**
 * Client-side hook to check if the current user has at least a specific role.
 * 
 * @param requiredRole - The minimum role required
 * @param userRole - The user's current role (pass from parent component or context)
 * @returns boolean indicating if user has sufficient permissions
 * 
 * @example
 * ```tsx
 * const canEdit = useCan('member', currentUserRole);
 * 
 * return (
 *   <div>
 *     {canEdit && <button>Edit Project</button>}
 *   </div>
 * );
 * ```
 */
export function useCan(requiredRole: OrgRole, userRole: OrgRole | null | undefined): boolean {
  if (!userRole) {
    return false;
  }

  return RoleRank[userRole] >= RoleRank[requiredRole];
}

/**
 * Client-side helper to get role comparison utilities.
 * 
 * @param userRole - The user's current role
 * @returns Object with helper methods for permission checks
 * 
 * @example
 * ```tsx
 * const { can, canManage, canEdit, isOwner } = useRoleHelpers(currentUserRole);
 * 
 * return (
 *   <div>
 *     {canEdit && <button>Edit</button>}
 *     {canManage && <button>Manage Team</button>}
 *     {isOwner && <button>Delete Organization</button>}
 *   </div>
 * );
 * ```
 */
export function useRoleHelpers(userRole: OrgRole | null | undefined) {
  const can = (requiredRole: OrgRole) => useCan(requiredRole, userRole);

  return {
    /**
     * Check if user has at least the specified role
     */
    can,
    
    /**
     * Check if user can manage (manager or owner)
     */
    canManage: can("manager"),
    
    /**
     * Check if user can edit/contribute (member or above)
     */
    canEdit: can("member"),
    
    /**
     * Check if user can view (viewer or above)
     */
    canView: can("viewer"),
    
    /**
     * Check if user is owner
     */
    isOwner: userRole === "owner",
    
    /**
     * Check if user is manager or owner
     */
    isManagerOrOwner: userRole === "owner" || userRole === "manager",
    
    /**
     * Get the user's current role
     */
    role: userRole,
  };
}

/**
 * Context type for organization and role information.
 * Use this with React Context to provide role information throughout your app.
 */
export type OrgContextValue = {
  orgId: string | null;
  userRole: OrgRole | null;
  loading: boolean;
};

/**
 * Example usage with React Context:
 * 
 * ```tsx
 * // context/OrgContext.tsx
 * import { createContext, useContext } from 'react';
 * import type { OrgContextValue } from '../lib/useRoleHelpers';
 * 
 * const OrgContext = createContext<OrgContextValue>({
 *   orgId: null,
 *   userRole: null,
 *   loading: true,
 * });
 * 
 * export const useOrg = () => useContext(OrgContext);
 * 
 * // Then in components:
 * const { userRole } = useOrg();
 * const { canManage } = useRoleHelpers(userRole);
 * ```
 */
