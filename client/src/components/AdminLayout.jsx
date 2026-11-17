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
  Users,
  FileSpreadsheet,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Tractor Owners', path: '/admin/owners', icon: ShieldCheck },
    { label: 'Farming Services', path: '/admin/services', icon: Wrench },
    { label: 'Bookings', path: '/admin/bookings', icon: CalendarDays },
    { label: 'Tractors & Schedule', path: '/admin/tractors', icon: Truck },
    { label: 'Work Records', path: '/admin/work-records', icon: FileCheck2 },
    { label: 'Payments & Dues', path: '/admin/payments', icon: Banknote },
    { label: 'Expenses', path: '/admin/expenses', icon: Receipt },
    { label: 'Farmers', path: '/admin/customers', icon: Users },
    { label: 'Reports & CSV', path: '/admin/reports', icon: FileSpreadsheet }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🚜</span>
          <span className="font-bold text-base">TractorConnect Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-md text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out shadow-lg md:shadow-none`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center border-b border-slate-800">
          <Link to="/" className="flex items-center space-x-2.5">
            <span className="text-2xl">🚜</span>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight block leading-none">
                Tractor<span className="text-harvest-400">Admin</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase block mt-1">
                Kisan Seva Operations
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-700 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-brand-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin profile & logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-harvest-600 text-white font-bold flex items-center justify-center text-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.mobile} &bull; Admin</p>
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
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

