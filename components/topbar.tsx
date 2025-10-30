"use client";

import React from "react";

export default function Topbar({ title = "Dashboard" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium">Vojta</span>
            <span className="text-xs text-gray-500">vojta@example.com</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">V</div>
        </div>
      </div>
    </header>
  );
}
