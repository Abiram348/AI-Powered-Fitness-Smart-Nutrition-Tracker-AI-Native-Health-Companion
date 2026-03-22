import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Utensils, Droplet, Dumbbell, PlaySquare, LineChart, ChefHat, MessageCircle, User, LogOut, MoreHorizontal, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/food', icon: Utensils, label: 'Food' },
    { path: '/water', icon: Droplet, label: 'Water' },
    { path: '/workout', icon: Dumbbell, label: 'Workout' },
    { path: '/library', icon: PlaySquare, label: 'Library' },
    { path: '/analytics', icon: LineChart, label: 'Analytics' },
    { path: '/diet-coach', icon: ChefHat, label: 'Diet Coach' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  // Mobile: show first 4 + More button to access all
  const mobileMainItems = navItems.slice(0, 4);
  const mobileOverflowItems = navItems.slice(4);
  const isOverflowActive = mobileOverflowItems.some(item => item.path === location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]">
        <div className="container mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center rounded-lg transform skew-x-[-6deg] group-hover:skew-x-0 transition-transform shadow-lg shadow-primary/20">
                <Dumbbell className="w-5 h-5 lg:w-5 lg:h-5 text-black" />
              </div>
              <span className="text-lg lg:text-xl font-barlow font-black text-primary uppercase tracking-wider text-glow">FitTrack AI</span>
            </Link>
            
            <div className="flex items-center gap-0.5 lg:gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg uppercase text-[10px] lg:text-xs font-semibold tracking-widest transition-all duration-200 ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
              <div className="w-px h-6 bg-border mx-1 lg:mx-2" />
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                className="flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg uppercase text-[10px] lg:text-xs font-semibold tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06]">
        <div className="grid grid-cols-5 gap-0.5 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)]">
          {mobileMainItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground active:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-wider">{item.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all duration-200 ${
              isOverflowActive || mobileMenuOpen
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground active:bg-white/5'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[9px] uppercase font-bold tracking-wider">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile overflow menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] glass rounded-t-2xl border-t border-white/[0.08] pb-[max(env(safe-area-inset-bottom,16px),16px)]"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Navigate</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {mobileOverflowItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                        className={`flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'text-primary bg-primary/10 border border-primary/20'
                            : 'text-muted-foreground bg-white/[0.03] border border-transparent active:bg-white/5'
                        }`}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive text-xs uppercase font-bold tracking-widest"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="md:pt-16 pb-20 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
