import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { Breadcrumb } from './Breadcrumb';

export function AppLayout() {
  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <div className="ml-72 h-full flex flex-col overflow-hidden">
        <TopBar />
        <div className="border-b border-border bg-muted/30">
          <Breadcrumb />
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
