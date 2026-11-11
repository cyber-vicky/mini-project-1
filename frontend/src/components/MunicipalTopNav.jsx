import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Bell, Search, User, LogOut, ChevronRight } from 'lucide-react';

const MunicipalTopNav = ({ title = 'Municipal Operations', breadcrumb = 'Dashboard' }) => {
  const { user, logout } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/municipal/issues?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E4E7] px-4 sm:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Page Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[#747982] mb-0.5">
            <span className="font-medium">Municipal</span>
            <ChevronRight className="w-3 h-3 text-[#747982]" />
            <span className="font-semibold text-[#FF8A3D]">{breadcrumb}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#202226] truncate tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right: Search, Notifications, User info, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Search */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center relative">
            <Search className="w-4 h-4 text-[#747982] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-[#F4F5F6] border border-[#E2E4E7] rounded-lg text-[#202226] placeholder-[#747982] focus:bg-white focus:outline-none focus:border-[#FF8A3D] focus:ring-2 focus:ring-[#FF8A3D]/20 w-48 xl:w-60 transition"
            />
          </form>

          {/* Notifications Link */}
          <Link
            to="/municipal/notifications"
            className="p-2 rounded-xl text-[#747982] hover:text-[#202226] hover:bg-[#F4F5F6] border border-transparent hover:border-[#E2E4E7] transition relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF8A3D]"></span>
          </Link>

          {/* User Profile Pill */}
          {user && (
            <Link
              to="/municipal/profile"
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#E2E4E7] bg-white hover:bg-[#F4F5F6] transition text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#17191C] text-[#FF8A3D] flex items-center justify-center font-bold text-xs border border-[#292D32]">
                {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#202226] truncate max-w-[110px] leading-tight">
                  {user.name}
                </p>
                <span className="text-[10px] font-bold text-[#FF8A3D] uppercase tracking-wider block">
                  {user.role}
                </span>
              </div>
            </Link>
          )}

          {/* Sign Out Action */}
          <button
            onClick={logout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-[#747982] hover:text-[#E45757] hover:bg-red-50 border border-transparent hover:border-red-100 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default MunicipalTopNav;
