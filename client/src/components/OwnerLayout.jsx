import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Wrench,
  CalendarDays,
  Truck,
  FileCheck2,
  Banknote,
  Receipt,
  FileSpreadsheet,
  Menu,
  X,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Building2,
  Clock
} from 'lucide-react';

const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'My Services & Prices', path: '/owner/services', icon: Wrench },
    { label: 'My Tractor Fleet', path: '/owner/tractors', icon: Truck },
    { label: 'Booking Requests', path: '/owner/bookings', icon: CalendarDays },
    { label: 'Work Records & Billing', path: '/owner/work-records', icon: FileCheck2 },
    { label: 'Payments Received', path: '/owner/payments', icon: Banknote },
    { label: 'Diesel & Expenses', path: '/owner/expenses', icon: Receipt },
    { label: 'Earnings & Reports', path: '/owner/reports', icon: FileSpreadsheet }
  ];

  const isActive = (path) => location.pathname === path;
  const isPendingApproval = user && user.approvalStatus === 'pending';
  const isSuspended = user && user.approvalStatus === 'suspended';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-amber-900 text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
          <span className="text-2xl flex-shrink-0">🚜</span>
          <div className="min-w-0">
            <span className="font-bold text-sm block leading-tight truncate">
              {user?.businessName || 'Tractor Owner Portal'}
            </span>
            <span className="text-[10px] text-amber-200 block truncate">Owner Dashboard</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close Menu' : 'Open Menu'}
          className="p-2 min-h-[44px] min-w-[44px] rounded-lg text-amber-200 hover:text-white flex items-center justify-center focus:outline-none"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-35 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out shadow-xl md:shadow-none`}
      >
        {/* Brand header */}
        <div className="h-20 px-5 flex items-center border-b border-slate-800 bg-slate-950/60">
          <Link to="/" className="flex items-center space-x-2.5">
            <span className="text-3xl">🚜</span>
            <div className="overflow-hidden">
              <span className="font-extrabold text-white text-sm tracking-tight block truncate">
                {user?.businessName || 'My Tractor Seva'}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase block mt-0.5">
                Contractor Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-amber-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Owner profile & logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">
                +91 {user?.mobile} &bull; {user?.village || 'Sehore'}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Link
              to="/"
              className="flex-1 text-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
            >
              Public Site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="py-1.5 px-3 bg-red-900/50 hover:bg-red-800 text-red-200 text-xs rounded-lg flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-3 sm:p-6 lg:p-8 space-y-6">
        {/* Pending Verification Notice Banner */}
        {isPendingApproval && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-amber-900 shadow-xs">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Account Pending Platform Administrator Approval
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                Your tractor business profile has been registered and is undergoing verification by our platform administrator. During this time, you can add your tractors, set up services, and configure custom pricing. Once verified, farmers in your service radius will be able to discover and book your tractors!
              </p>
            </div>
          </div>
        )}

        {/* Suspended Notice Banner */}
        {isSuspended && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-start space-x-3 text-red-900 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-red-900">
                Account Temporarily Suspended
              </h4>
              <p className="text-xs text-red-800 mt-1">
                Your business account has been suspended by the platform administrator: {user?.rejectionReason || 'Please contact support.'}
              </p>
            </div>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
};

export default OwnerLayout;

