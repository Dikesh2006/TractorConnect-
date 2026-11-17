import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from '../routes/ProtectedRoute';
import AdminRoute from '../routes/AdminRoute';

// Mock AuthContext values for testing route guards
const MockProtectedConsumer = () => <div>Protected Content Visible</div>;
const MockAdminConsumer = () => <div>Admin Content Visible</div>;

describe('Frontend Auth Components & Validation', () => {
  it('renders Login form with mobile and password inputs', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login to Account/i })).toBeInTheDocument();
  });

  it('validates mobile number format in Login', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    const mobileInput = screen.getByLabelText(/Mobile Number/i);
    fireEvent.change(mobileInput, { target: { value: '12345' } });

    const submitBtn = screen.getByRole('button', { name: /Login to Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid 10-digit mobile number/i)).toBeInTheDocument();
    });
  });

  it('renders Register form and validates password confirmation', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Village/i)).toBeInTheDocument();

    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'different123' } });

    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('ProtectedRoute redirects unauthenticated visitors to /login', () => {
    render(
      <MemoryRouter initialEntries={['/customer/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Redirected</div>} />
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute>
                  <MockProtectedConsumer />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Unauthenticated -> redirected to login
    expect(screen.getByText(/Login Page Redirected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Protected Content Visible/i)).not.toBeInTheDocument();
  });
});

