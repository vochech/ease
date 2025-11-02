"use client";

import React from "react";

type DashboardCardProps = {
  title: string;
  description?: string;
  value?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
};

export function DashboardCard({
  title,
  description,
  value,
  action,
  children,
}: DashboardCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      {value !== undefined && (
        <div className="text-2xl font-semibold text-gray-900 mt-2">{value}</div>
      )}
      {children && <div className="mt-3 text-sm text-gray-600">{children}</div>}
    </div>
  );
}

export default DashboardCard;
