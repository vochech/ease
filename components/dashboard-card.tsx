"use client";

import React from "react";

type DashboardCardProps = {
  title: string;
  description?: string;
  value?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
};

export function DashboardCard({ title, description, value, action, children }: DashboardCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {value !== undefined && (
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
          )}
        </div>
      </header>
      {children && <div className="mt-3 text-sm text-gray-500">{children}</div>}
    </div>
  );
}

export default DashboardCard;
