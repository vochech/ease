/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

// Mock next/navigation usePathname
vi.mock("next/navigation", () => ({ usePathname: () => "/projects" }));

// Mock next/link to render a simple anchor without using JSX (avoid jsx-runtime duplicates)
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) =>
    React.createElement("a", { href }, children),
}));

import SidebarNav from "../sidebar-nav";

describe("SidebarNav", () => {
  it.skip("renders links and highlights active route", () => {
    // Work around React 19 hook dispatcher in test by stubbing useState
    const useStateSpy = vi
      .spyOn(React, "useState")
      .mockImplementation(((init: any) => [init, vi.fn()]) as any);
    render(<SidebarNav />);

    const projects = screen.getByText("Projects");
    expect(projects).toBeInTheDocument();

    // Active link should have font-medium or bg-gray-100
    const link = projects.closest("a");
    expect(link).toBeTruthy();
    expect(link).toHaveClass("font-medium");

    useStateSpy.mockRestore();
  });
});
