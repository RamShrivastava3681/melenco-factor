import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Landmark,
  Bell,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Suppliers & Buyers', icon: Users, path: '/entities' },
  { title: 'Transactions', icon: FileText, path: '/transactions' },
  { title: 'Treasury', icon: Landmark, path: '/treasury' },
  { title: 'Monitoring', icon: Bell, path: '/monitoring' },
  { title: 'Reports', icon: BarChart3, path: '/reports' },
];

export function AppSidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 w-72 h-screen flex flex-col bg-gradient-to-b from-indigo-700 via-violet-700 to-blue-700 text-white shadow-2xl">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/15">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center p-1.5 shadow-lg">
          <img
            src="/logo-vertical-light (2).png"
            alt="Whizunik Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="ml-3 text-xl font-semibold tracking-wide">Whizunik</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/dashboard'
            ? location.pathname === '/dashboard' || location.pathname === '/'
            : location.pathname === item.path;

          return (
            <NavLink
              key={`${item.title}-${item.path}`}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:translate-x-0.5',
                isActive
                  ? 'bg-white text-indigo-700 shadow-lg'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/15">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
