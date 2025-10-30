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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        {action}
      </header>
      {value !== undefined && (
        <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
      )}
      {children && <div className="mt-4 text-sm text-gray-600">{children}</div>}
    </div>
  );
}

export default DashboardCard;
