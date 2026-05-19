import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import FrameworkAgreement from "./pages/FrameworkAgreement";
import Entities from "./pages/Entities";
import Transactions from "./pages/Transactions";
import FeeLimits from "./pages/FeeLimits";
import Treasury from "./pages/Treasury";
import Monitoring from "./pages/Monitoring";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { NOAPage } from "./pages/NOAPage";
import FrameworkAgreementSignPage from "./pages/FrameworkAgreementSignPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/noa/:token" element={<NOAPage />} />
            <Route path="/framework-agreement/sign/:token" element={<FrameworkAgreementSignPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/framework-agreement" element={<FrameworkAgreement />} />
              <Route path="/entities" element={<Entities />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/fee-limits" element={<FeeLimits />} />
              <Route path="/treasury" element={<Treasury />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
