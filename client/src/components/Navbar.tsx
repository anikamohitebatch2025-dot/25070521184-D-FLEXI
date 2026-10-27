import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Menu, X, User as UserIcon, Shield, LogOut, ChevronRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isTrainer, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Plans', path: '/plans' },
    { name: 'Trainers', path: '/trainers' },
    { name: 'Workouts', path: '/workouts' },
    { name: 'Diet & Nutrition', path: '/diet' },
    { name: 'Book Session', path: '/book' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0b0c]/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#ff6a00] to-[#e05500] flex items-center justify-center text-white shadow-lg shadow-[#ff6a00]/25 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-2xl font-black tracking-wider text-white flex items-center gap-1">
                FLEXI <span className="text-[#ff6a00] text-3xl leading-none">.</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] font-semibold text-neutral-400 uppercase">
                Athletic Club
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? 'text-[#ff6a00] bg-[#ff6a00]/10 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Shopping Basket Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-[#ff6a00] transition-colors"
              title="Open Gym Basket"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#ff6a00] text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <NotificationBell />

                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-white border border-neutral-700 transition-colors shadow-sm"
                  >
                    <Shield className="w-4 h-4 text-[#ff6a00]" />
                    Admin Panel
                  </Link>
                ) : isTrainer ? (
                  <Link
                    to="/trainer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-white border border-neutral-700 transition-colors shadow-sm"
                  >
                    <Dumbbell className="w-4 h-4 text-[#ff6a00]" />
                    Coach Portal
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-white border border-neutral-700 transition-colors shadow-sm"
                  >
                    <UserIcon className="w-4 h-4 text-[#ff6a00]" />
                    My Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="relative group overflow-hidden px-5 py-2.5 rounded-lg bg-[#ff6a00] hover:bg-[#e65c00] text-white text-sm font-bold tracking-wide uppercase transition-all shadow-lg shadow-[#ff6a00]/30 hover:shadow-[#ff6a00]/50"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu & Basket Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff6a00] text-black font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-[#121214] px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-[#ff6a00]/15 text-[#ff6a00] font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span>{link.name}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </Link>
          ))}

          <div className="pt-4 border-t border-neutral-800 flex flex-col gap-2.5">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : isTrainer ? '/trainer' : '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#ff6a00] text-white font-bold"
                >
                  {isAdmin ? <Shield className="w-5 h-5" /> : isTrainer ? <Dumbbell className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  {isAdmin ? 'Admin Dashboard' : isTrainer ? 'Coach Portal' : 'My Dashboard'}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-rose-400"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-lg bg-neutral-800 text-neutral-200 font-semibold text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-lg bg-[#ff6a00] text-white font-bold text-center"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
