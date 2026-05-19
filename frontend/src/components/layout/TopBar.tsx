import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TopBar() {
  const { user } = useAuth();

  // Get initials from user name or email
  const getInitials = (name: string, email: string) => {
    if (name && name !== email) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const initials = user ? getInitials(user.name, user.email) : 'U';
  const displayName = user?.name && user.name !== user?.email ? user.name : user?.email?.split('@')[0] || 'User';

  return (
    <header className="h-20 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Welcome to Melenco, {displayName}</h2>
        <p className="text-sm text-slate-500">Trade finance overview and invoice intelligence</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search..."
            className="pl-10 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-200"
          />
        </div>

        <NotificationCenter />

        <Avatar className="h-10 w-10 ring-2 ring-indigo-200">
          <AvatarFallback className="bg-indigo-600 text-white font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

