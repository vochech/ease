import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Topbar from '../topbar';

describe('Topbar', () => {
  it('renders title and user initial', () => {
    render(<Topbar title="My Title" />);
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('V')).toBeInTheDocument();
  });
});
