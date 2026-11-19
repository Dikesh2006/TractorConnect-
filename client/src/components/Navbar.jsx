import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, User, LogOut, Menu, X, Shield, Calendar, Wrench, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const businessPhone = '9876543210';

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <span className="text-3xl">🚜</span>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-brand-900 block leading-tight">
                  Tractor<span className="text-harvest-600">Connect</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">
                  Kisan Tractor & Krishi Seva
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-5">
            <Link
              to="/"
              className={`text-sm font-semibold ${
                isActivePath('/') ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/customer/find-tractors"
              className={`text-sm font-bold flex items-center space-x-1 ${
                isActivePath('/customer/find-tractors')
                  ? 'text-amber-700'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              <span>🔍 Find Tractor Owners</span>
            </Link>
            <Link
              to="/services"
              className={`text-sm font-semibold ${
                isActivePath('/services') ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Farming Services
            </Link>
            <Link
              to="/about"
              className={`text-sm font-semibold ${
                isActivePath('/about') ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`text-sm font-semibold ${
                isActivePath('/contact') ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contact
            </Link>

            {/* Quick Call */}
            <a
              href={`tel:+91${businessPhone}`}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>+91 {businessPhone}</span>
            </a>
          </div>

          {/* User / Auth Actions */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 px-3.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                  {isAdmin && (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                  {isOwner && (
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Owner
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500">+91 {user?.mobile}</p>
                    </div>

                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                        <Link
                          to="/admin/owners"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <span className="text-amber-700">🚜</span>
                          <span>Tractor Owners</span>
                        </Link>
                        <Link
                          to="/admin/bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>All Bookings</span>
                        </Link>
                      </>
                    ) : isOwner ? (
                      <>
                        <Link
                          to="/owner/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50"
                        >
                          <span>🚜 Owner Dashboard</span>
                        </Link>
                        <Link
                          to="/owner/bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>Booking Requests</span>
                        </Link>
                        <Link
                          to="/owner/services"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Wrench className="w-4 h-4 text-slate-500" />
                          <span>My Services & Prices</span>
                        </Link>
                        <Link
                          to="/owner/tractors"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <span>My Fleet</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/customer/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <span>Farmer Dashboard</span>
                        </Link>
                        <Link
                          to="/customer/find-tractors"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50"
                        >
                          <span>🔍 Find Nearby Tractors</span>
                        </Link>
                        <Link
                          to="/customer/book"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <span>New Tractor Booking</span>
                        </Link>
                        <Link
                          to="/customer/my-bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <span>My Bookings</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/owner/login"
                  className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl transition-colors"
                >
                  🚜 Tractor Owners
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-brand-700 px-3 py-2"
                >
                  Farmer Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 px-3.5 py-2 rounded-xl shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center md:hidden">
            <a
              href={`tel:+91${businessPhone}`}
              className="mr-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
              title="Call Helpline"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="text-slate-600 hover:text-slate-900 p-2.5 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-slate-900/50 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 relative z-40 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl animate-in slide-in-from-top-2 duration-150">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-xl text-sm font-semibold ${
              isActivePath('/') ? 'bg-brand-50 text-brand-700' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            Home
          </Link>
          <Link
            to="/customer/find-tractors"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-xl text-sm font-bold flex items-center space-x-1.5 ${
              isActivePath('/customer/find-tractors')
                ? 'bg-amber-100/70 text-amber-900'
                : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100'
            }`}
          >
            <span>🔍 Find Tractor Owners (ट्रैक्टर खोजें)</span>
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-xl text-sm font-semibold ${
              isActivePath('/services') ? 'bg-brand-50 text-brand-700' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            Farming Services (सेवाएं)
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-xl text-sm font-semibold ${
              isActivePath('/about') ? 'bg-brand-50 text-brand-700' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            About Us
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-xl text-sm font-semibold ${
              isActivePath('/contact') ? 'bg-brand-50 text-brand-700' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            Contact
          </Link>

          {/* Quick Call in Drawer */}
          <a
            href={`tel:+91${businessPhone}`}
            className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Call Helpline: +91 {businessPhone}</span>
          </a>

          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-1">
                <div className="py-2 px-3 bg-slate-50 rounded-xl mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500">+91 {user?.mobile}</p>
                  </div>
                  {isAdmin ? (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  ) : isOwner ? (
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Owner
                    </span>
                  ) : (
                    <span className="bg-brand-100 text-brand-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Farmer
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-50"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/owners"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      🚜 Tractor Owners Management
                    </Link>
                    <Link
                      to="/admin/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      All Bookings
                    </Link>
                    <Link
                      to="/admin/services"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Farming Services
                    </Link>
                    <Link
                      to="/admin/reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Reports & CSV
                    </Link>
                  </>
                ) : isOwner ? (
                  <>
                    <Link
                      to="/owner/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-bold text-amber-900 bg-amber-50"
                    >
                      🚜 Owner Dashboard
                    </Link>
                    <Link
                      to="/owner/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Booking Requests
                    </Link>
                    <Link
                      to="/owner/services"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      My Services & Prices
                    </Link>
                    <Link
                      to="/owner/tractors"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      My Tractor Fleet
                    </Link>
                    <Link
                      to="/owner/work-records"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Work Records & Billing
                    </Link>
                    <Link
                      to="/owner/payments"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Payments Received
                    </Link>
                    <Link
                      to="/owner/reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Earnings & Reports
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/customer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-bold text-brand-700 bg-brand-50"
                    >
                      Farmer Dashboard
                    </Link>
                    <Link
                      to="/customer/find-tractors"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-50"
                    >
                      🔍 Find Nearby Tractors
                    </Link>
                    <Link
                      to="/customer/book"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Book a Tractor
                    </Link>
                    <Link
                      to="/customer/my-bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/customer/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Profile Settings
                    </Link>
                  </>
                )}
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left py-2.5 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <Link
                  to="/owner/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 font-bold text-amber-900 text-xs"
                >
                  🚜 Tractor Owner Portal
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 px-3 rounded-xl border border-slate-300 font-semibold text-slate-700 text-xs hover:bg-slate-50"
                  >
                    Farmer Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 px-3 rounded-xl bg-brand-700 font-semibold text-white text-xs shadow-xs hover:bg-brand-800"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

