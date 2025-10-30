import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock next/navigation usePathname
vi.mock('next/navigation', () => ({ usePathname: () => '/projects' }));

// Mock next/link to render a simple anchor
vi.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

import SidebarNav from '../sidebar-nav';

describe('SidebarNav', () => {
  it('renders links and highlights active route', () => {
    render(<SidebarNav />);

    const projects = screen.getByText('Projects');
    expect(projects).toBeInTheDocument();

    // Active link should have font-medium or bg-gray-100
    const link = projects.closest('a');
    expect(link).toBeTruthy();
    expect(link).toHaveClass('font-medium');
  });
});
