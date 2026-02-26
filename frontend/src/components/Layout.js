import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Utensils, Droplet, Dumbbell, PlaySquare, LineChart, ChefHat, User, LogOut } from 'lucide-react';
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
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary flex items-center justify-center transform skew-x-[-10deg]">
                <Dumbbell className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-barlow font-black text-primary uppercase tracking-wider">FitTrack AI</span>
            </Link>
            
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-4 py-2 uppercase text-xs font-semibold tracking-widest transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                className="flex items-center gap-2 px-4 py-2 uppercase text-xs font-semibold tracking-widest text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 py-2 rounded-sm ${
                location.pathname === item.path
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:pt-20 pb-20 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
