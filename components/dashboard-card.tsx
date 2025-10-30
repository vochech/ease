"use client";

import React from "react";

type DashboardCardProps = {
  title: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
};

export function DashboardCard({ title, value, children }: DashboardCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {value !== undefined && (
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
        )}
      </header>
      {children && <div className="mt-3 text-sm text-gray-500">{children}</div>}
    </div>
  );
}

export default DashboardCard;
