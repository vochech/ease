"use client";

import dynamic from "next/dynamic";

export const GanttChartWrapper = dynamic(
  () => import("@/components/timeline/gantt-chart").then((m) => m.GanttChart),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-md bg-gray-100" />,
  }
);
