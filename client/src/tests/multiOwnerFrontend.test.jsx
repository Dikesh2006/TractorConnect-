import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import OwnerLogin from '../pages/public/OwnerLogin';
import OwnerRegister from '../pages/public/OwnerRegister';
import FindTractorOwners from '../pages/customer/FindTractorOwners';

// Mock axios client
vi.mock('../api/axios', () => {
  return {
    default: {
      get: vi.fn((url) => {
        if (url.includes('/discovery/nearby-owners')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                owners: [
                  {
                    _id: 'owner1',
                    name: 'Ramesh Patidar',
                    businessName: 'Patidar Krishi Seva',
                    village: 'Bilkisganj',
                    district: 'Sehore',
                    distanceKm: 2.5,
                    serviceRadiusKm: 25,
                    tractorsCount: 2,
                    availableTractorsCount: 2,
                    hasAvailableTractors: true,
                    services: [
                      { _id: 's1', name: 'Deep Ploughing', currentPrice: 850, pricingUnit: 'per_acre' }
                    ]
                  }
                ]
              }
            }
          });
        }
        return Promise.resolve({ data: { success: true, data: {} } });
      }),
      post: vi.fn(),
      patch: vi.fn()
    }
  };
});

describe('Multi-Owner Frontend Interfaces', () => {
  it('renders Tractor Owner Login form with dedicated fields and link to registration', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <OwnerLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Tractor Owner Login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Owner Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login to Owner Portal/i })).toBeInTheDocument();
    expect(screen.getByText(/Register as a Tractor Owner/i)).toBeInTheDocument();
  });

  it('renders Tractor Owner Registration with business name, service radius, and depot location inputs', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <OwnerRegister />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Tractor Owner Registration/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Patidar Krishi Yantra Seva/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Ramesh Chandra Patidar/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Service Radius/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Admin Verification Required/i)).toBeInTheDocument();
  });

  it('renders Find Nearby Tractor Owners page with field location inputs and contractor list', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <FindTractorOwners />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Find Nearby Tractor Owners/i)).toBeInTheDocument();
    expect(screen.getByText(/खेत का स्थान/i)).toBeInTheDocument();

    // Verify discovered owner appears
    const contractorTitle = await screen.findByText(/Patidar Krishi Seva/i);
    expect(contractorTitle).toBeInTheDocument();
    expect(screen.getByText(/2.5 km away/i)).toBeInTheDocument();
    expect(screen.getByText(/Deep Ploughing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book With This Owner/i })).toBeInTheDocument();
  });
});
