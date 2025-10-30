import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardCard from '../dashboard-card';

describe('DashboardCard', () => {
  it('renders title and value', () => {
    render(<DashboardCard title="Test" value={42}>Details</DashboardCard>);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });
});
