import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import DashboardCard from '../dashboard-card';

describe('DashboardCard', () => {
  it('renders title and value', () => {
    render(<DashboardCard title="Test" value={42}>Details</DashboardCard>);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('renders description and action', () => {
    render(
      <DashboardCard 
        title="Project" 
        description="A test project"
        action={<button>Edit</button>}
      />
    );
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });
});
