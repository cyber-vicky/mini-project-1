import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Map,
  Building2,
  BarChart3,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  CheckSquare,
  Landmark,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const MunicipalSidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile drawer & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    if (mobileOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Role-based municipal navigation items (strictly supported existing routes)
  const navItems = [
    { name: 'Dashboard', path: '/municipal/dashboard', roles: ['ADMIN', 'OFFICER'], icon: LayoutDashboard },
    { name: 'All Complaints', path: '/municipal/issues', roles: ['ADMIN', 'OFFICER'], icon: FileText },
    { name: 'My Tasks', path: '/municipal/tasks', roles: ['WORKER'], icon: CheckSquare },
    { name: 'Operations Map', path: '/municipal/map', roles: ['ADMIN', 'OFFICER', 'WORKER'], icon: Map },
    { name: 'Departments', path: '/municipal/departments', roles: ['ADMIN'], icon: Building2 },
    { name: 'Analytics & Hotspots', path: '/municipal/analytics', roles: ['ADMIN'], icon: BarChart3 },
    { name: 'Notifications', path: '/municipal/notifications', roles: ['ADMIN', 'OFFICER', 'WORKER'], icon: Bell },
    { name: 'Staff Profile', path: '/municipal/profile', roles: ['ADMIN', 'OFFICER', 'WORKER'], icon: User },
  ];

  const allowedItems = user ? navItems.filter(i => i.roles.includes(user.role)) : [];

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 px-3 py-4 space-y-1.5 municipal-sidebar-nav overflow-y-auto">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#747982]">
        Main Navigation
      </div>
      {allowedItems.map(item => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => {
              if (isMobile) setMobileOpen(false);
            }}
            className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
              isActive
                ? 'bg-[#292D32] text-white shadow-sm font-semibold border-l-3 border-[#FF8A3D]'
                : 'text-[#747982] hover:text-white hover:bg-[#292D32]/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-[#FF8A3D]' : 'text-[#747982] group-hover:text-white'
                }`}
              />
              <span className="truncate">{item.name}</span>
            </div>
            {isActive ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A3D] shrink-0 shadow-xs"></span>
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-transparent group-hover:text-[#747982] shrink-0 transition-colors" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Mobile Header (Visible only on small viewports < md) */}
      <div className="md:hidden sticky top-0 z-40 bg-[#17191C] text-white px-4 py-3 flex items-center justify-between shadow-md w-full border-b border-[#292D32]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#292D32] flex items-center justify-center border border-[#373C44]">
            <Landmark className="w-4 h-4 text-[#FF8A3D]" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Civic<span className="text-[#FF8A3D]">Connect</span></span>
          {user && (
            <span className="ml-1 text-[10px] font-bold bg-[#292D32] text-[#FF8A3D] px-2 py-0.5 rounded border border-[#373C44] uppercase tracking-wider">
              {user.role}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[#747982] hover:text-white hover:bg-[#292D32] focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] transition min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          aria-label="Open Municipal Menu"
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>
      </div>

      {/* 2. Mobile Drawer & Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#17191C] text-white h-full flex flex-col shadow-2xl z-10 border-r border-[#292D32]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#292D32] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#292D32] flex items-center justify-center border border-[#373C44]">
                  <Landmark className="w-4 h-4 text-[#FF8A3D]" />
                </div>
                <span className="font-bold text-lg text-white">Civic<span className="text-[#FF8A3D]">Connect</span></span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-[#747982] hover:text-white hover:bg-[#292D32] transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staff Info Card */}
            {user && (
              <div className="p-4 border-b border-[#292D32] bg-[#292D32]/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#17191C] border border-[#373C44] flex items-center justify-center font-bold text-sm text-[#FF8A3D] shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                    <p className="text-xs text-[#747982] mt-0.5 truncate flex items-center gap-1.5">
                      <span className="text-[#FF8A3D] font-bold">{user.role}</span>
                      {user.employeeId && <span>&bull; {user.employeeId}</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            {renderNavLinks(true)}

            {/* Logout button */}
            <div className="p-4 border-t border-[#292D32] shrink-0 bg-[#17191C]">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-[#E45757] hover:bg-[#E45757]/10 font-semibold text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Stationary Sidebar */}
      <aside className="hidden md:flex md:flex-col md:sticky md:top-0 h-screen w-64 shrink-0 bg-[#17191C] text-white z-40 municipal-sidebar shadow-xl border-r border-[#292D32]">
        {/* Top Branding */}
        <div className="p-5 border-b border-[#292D32] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#292D32] flex items-center justify-center border border-[#373C44] shadow-sm">
              <Landmark className="w-5 h-5 text-[#FF8A3D]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                Civic<span className="text-[#FF8A3D]">Connect</span>
              </span>
              <span className="text-[10px] text-[#747982] font-semibold tracking-wider uppercase block">
                Municipal Management
              </span>
            </div>
          </div>
        </div>

        {/* Staff Profile Card */}
        {user && (
          <div className="mx-3 my-3 p-3 rounded-xl bg-[#292D32]/70 border border-[#373C44]/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#17191C] border border-[#373C44] flex items-center justify-center font-bold text-xs text-[#FF8A3D] shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-white leading-tight">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-black bg-[#FF8A3D]/15 text-[#FF8A3D] px-1.5 py-0.5 rounded border border-[#FF8A3D]/30 uppercase tracking-wider">
                    {user.role}
                  </span>
                  {user.employeeId && (
                    <span className="text-[10px] text-[#747982] font-mono truncate">{user.employeeId}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        {renderNavLinks(false)}

        {/* Bottom Logout Area */}
        <div className="p-3 border-t border-[#292D32] shrink-0 bg-[#17191C]">
          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#292D32] text-[#747982] hover:text-[#E45757] transition-colors duration-200 font-medium text-sm group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 shrink-0 text-[#747982] group-hover:text-[#E45757] transition-colors" />
              <span>Sign Out</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#747982] group-hover:text-[#E45757] transition-colors" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default MunicipalSidebar;
