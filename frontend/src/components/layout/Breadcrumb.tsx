import { useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/framework-agreement': 'Framework Agreement',
  '/entities': 'Suppliers & Buyers',
  '/transactions': 'Transactions',
  '/fee-limits': 'Fee & Limits',
  '/treasury': 'Treasury',
  '/monitoring': 'Monitoring',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function Breadcrumb() {
  const location = useLocation();
  const currentRoute = routeNames[location.pathname] || 'Page';

  return (
    <div className="h-12 flex items-center px-6 border-b border-border bg-muted/30">
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {location.pathname !== '/' && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{currentRoute}</span>
          </>
        )}
        {location.pathname === '/' && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">Dashboard</span>
          </>
        )}
      </nav>
    </div>
  );
}
