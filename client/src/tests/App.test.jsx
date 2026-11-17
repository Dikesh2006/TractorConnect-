import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Foundation', () => {
  it('renders brand heading and status', () => {
    render(<App />);
    expect(screen.getByText(/Kisan Tractor & Krishi Seva/i)).toBeInTheDocument();
    expect(screen.getByText(/Modern Tractor & Farming Services/i)).toBeInTheDocument();
  });
});
