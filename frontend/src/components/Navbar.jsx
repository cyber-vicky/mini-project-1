import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Bell,
  User,
  Landmark,
  LogOut,
  Menu,
  X,
  PlusCircle,
  FileText,
  LayoutDashboard
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-[#17191C] text-white border-b border-[#292D32] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              to={user?.role === 'citizen' ? '/citizen/dashboard' : '/'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#292D32] flex items-center justify-center border border-[#373C44] group-hover:border-[#FF8A3D]/50 transition-colors">
                <Landmark className="w-4 h-4 text-[#FF8A3D]" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Civic<span className="text-[#FF8A3D]">Connect</span>
              </span>
            </Link>

            {/* Desktop Navigation Links (Citizen) */}
            {user?.role === 'citizen' && (
              <div className="hidden md:flex items-center space-x-1.5">
                <Link
                  to="/citizen/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/citizen/dashboard')
                      ? 'bg-[#292D32] text-white font-semibold border-b-2 border-[#FF8A3D]'
                      : 'text-[#747982] hover:text-white hover:bg-[#292D32]/60'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/citizen/issues"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/citizen/issues')
                      ? 'bg-[#292D32] text-white font-semibold border-b-2 border-[#FF8A3D]'
                      : 'text-[#747982] hover:text-white hover:bg-[#292D32]/60'
                  }`}
                >
                  My Complaints
                </Link>
                <Link
                  to="/citizen/report"
                  className="ml-2 bg-[#FF8A3D] hover:bg-[#F37B2B] text-white px-3.5 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report Issue</span>
                </Link>
              </div>
            )}
          </div>

          {/* Right Action Area */}
          {user ? (
            <div className="hidden md:flex items-center space-x-3">
              {user.role === 'citizen' && (
                <>
                  <Link
                    to="/citizen/notifications"
                    className={`p-2 rounded-lg transition-colors relative ${
                      isActive('/citizen/notifications')
                        ? 'bg-[#292D32] text-[#FF8A3D]'
                        : 'text-[#747982] hover:text-white hover:bg-[#292D32]'
                    }`}
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF8A3D]"></span>
                  </Link>

                  <Link
                    to="/citizen/profile"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      isActive('/citizen/profile')
                        ? 'bg-[#292D32] border-[#FF8A3D]/40 text-white'
                        : 'border-[#373C44] bg-[#292D32]/60 text-gray-200 hover:text-white hover:bg-[#292D32]'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#17191C] flex items-center justify-center text-[10px] font-bold text-[#FF8A3D]">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold truncate max-w-[120px]">{user.name}</span>
                  </Link>
                </>
              )}

              <button
                onClick={logout}
                className="text-[#747982] hover:text-[#E45757] hover:bg-[#292D32] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/select-role"
                className="btn-orange-primary text-xs py-2 px-4 shadow-sm"
              >
                Sign In / Access Portal
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#292D32] focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] transition min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[#17191C] text-white h-full flex flex-col shadow-2xl z-10 border-r border-[#292D32]">
            <div className="p-4 border-b border-[#292D32] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#292D32] flex items-center justify-center border border-[#373C44]">
                  <Landmark className="w-3.5 h-3.5 text-[#FF8A3D]" />
                </div>
                <span className="font-bold text-base text-white">Civic<span className="text-[#FF8A3D]">Connect</span></span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#747982] hover:text-white hover:bg-[#292D32] transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user && (
              <div className="p-4 border-b border-[#292D32] bg-[#292D32]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#17191C] border border-[#373C44] flex items-center justify-center font-bold text-xs text-[#FF8A3D]">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                    <span className="text-[10px] font-bold uppercase bg-[#FF8A3D]/20 text-[#FF8A3D] px-1.5 py-0.5 rounded border border-[#FF8A3D]/30 inline-block mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              {user?.role === 'citizen' ? (
                <>
                  <Link
                    to="/citizen/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive('/citizen/dashboard')
                        ? 'bg-[#292D32] text-white font-semibold border-l-2 border-[#FF8A3D]'
                        : 'text-gray-300 hover:bg-[#292D32]/60 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#FF8A3D]" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/citizen/report"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FF8A3D] hover:bg-[#F37B2B] transition mt-2 mb-2 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Report New Issue</span>
                  </Link>
                  <Link
                    to="/citizen/issues"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive('/citizen/issues')
                        ? 'bg-[#292D32] text-white font-semibold border-l-2 border-[#FF8A3D]'
                        : 'text-gray-300 hover:bg-[#292D32]/60 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-[#747982]" />
                    <span>My Complaints</span>
                  </Link>
                  <Link
                    to="/citizen/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive('/citizen/notifications')
                        ? 'bg-[#292D32] text-white font-semibold border-l-2 border-[#FF8A3D]'
                        : 'text-gray-300 hover:bg-[#292D32]/60 hover:text-white'
                    }`}
                  >
                    <Bell className="w-4 h-4 text-[#747982]" />
                    <span>Notifications</span>
                  </Link>
                  <Link
                    to="/citizen/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive('/citizen/profile')
                        ? 'bg-[#292D32] text-white font-semibold border-l-2 border-[#FF8A3D]'
                        : 'text-gray-300 hover:bg-[#292D32]/60 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#747982]" />
                    <span>Profile Settings</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/select-role"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center btn-orange-primary w-full py-2.5 text-sm font-bold"
                >
                  Sign In / Select Portal
                </Link>
              )}
            </div>

            {user && (
              <div className="p-4 border-t border-[#292D32] shrink-0 bg-[#17191C]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#292D32] hover:bg-[#E45757]/20 text-[#E45757] hover:border-[#E45757] border border-transparent py-2.5 rounded-xl text-sm font-bold transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
