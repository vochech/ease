"use client";

import { createContext, useContext, ReactNode } from "react";
import type { OrgRole } from "@/types/roles";

export type OrgContextValue = {
  orgId: string;
  orgSlug: string;
  orgName: string;
  userId: string;
  userRole: OrgRole;
  isLoading?: boolean;
};

const OrgContext = createContext<OrgContextValue | null>(null);

type OrgProviderProps = {
  value: OrgContextValue;
  children: ReactNode;
};

export function OrgProvider({ value, children }: OrgProviderProps) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}

export function useOrgRole(): OrgRole {
  const { userRole } = useOrg();
  return userRole;
}
