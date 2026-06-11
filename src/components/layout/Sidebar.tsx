// ─── Sidebar Navigation Component ─────────────────────────────

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Search,
  Bell,
  User,
  Menu,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Sidebar: React.FC = () => {
  const { profile, user, logOut } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch (err: any) {
      toast.error('Logout failed.');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: Clock },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'People & Notes', path: '/people', icon: Users },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn('sidebar', sidebarOpen ? 'open' : '')}>
        {/* Brand Logo Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-mk-glass-border">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-silver shadow-silver-sm text-mk-black font-display font-bold text-xl">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-wider text-foreground">
                MomentKeeper
              </span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
                Luxury Memory
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Mini Profile */}
        {(profile || user) && (
          <div className="p-6 border-b border-mk-glass-border flex items-center gap-3">
            {profile?.photoURL || user?.photoURL ? (
              <img
                src={profile?.photoURL || user?.photoURL || undefined}
                alt={profile?.displayName || user?.displayName || 'User'}
                className="h-10 w-10 rounded-full object-cover border border-mk-silver/30 shadow-silver-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-sm font-bold border border-mk-glass-border text-muted-foreground">
                {((profile?.displayName || user?.displayName || profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'U').substring(0, 2)).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-foreground">
                {profile?.displayName || user?.displayName || profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Valued User'}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {profile?.email || user?.email}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-gradient-silver text-mk-black shadow-silver font-semibold'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  )
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button Footer */}
        <div className="p-4 border-t border-mk-glass-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
