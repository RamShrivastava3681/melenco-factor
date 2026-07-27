import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: string;
  phone?: string;
  company?: string;
  department?: string;
  jobTitle?: string;
  address?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  country?: string;
  lastLogin?: string;
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    transactionAlerts?: boolean;
    systemUpdates?: boolean;
    riskAlerts?: boolean;
    reportNotifications?: boolean;
  };
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'whizunik_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token on app start
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      try {
        // Decode the mock JWT token
        const payload = JSON.parse(atob(storedToken));
        
        // Check if token is expired
        if (payload.exp > Date.now()) {
          setToken(storedToken);
          setUser({
            email: payload.email,
            name: payload.name,
            role: payload.role,
            phone: payload.phone || '',
            company: payload.company || 'TradeFlow Nexus',
            department: payload.department || 'Operations',
            jobTitle: payload.jobTitle || 'Trade Finance Manager',
            timezone: payload.timezone || 'America/New_York',
            language: payload.language || 'en',
            lastLogin: payload.lastLogin || new Date().toISOString(),
            preferences: payload.preferences || {
              emailNotifications: true,
              transactionAlerts: true,
              riskAlerts: true,
              systemUpdates: true
            }
          });
        } else {
          // Token expired, remove it
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (error) {
        // Invalid token, remove it
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }, []);

  const login = (newToken: string) => {
    try {
      // Decode the token to get user info
      const payload = JSON.parse(atob(newToken));
      
      setToken(newToken);
      setUser({
        email: payload.email,
        name: payload.name,
        role: payload.role,
        phone: payload.phone || '',
        company: payload.company || 'TradeFlow Nexus',
        department: payload.department || 'Operations',
        jobTitle: payload.jobTitle || 'Trade Finance Manager',
        timezone: payload.timezone || 'America/New_York',
        language: payload.language || 'en',
        lastLogin: new Date().toISOString(),
        preferences: payload.preferences || {
          emailNotifications: true,
          transactionAlerts: true,
          riskAlerts: true,
          systemUpdates: true
        }
      });
      
      // Store token in localStorage
      localStorage.setItem(TOKEN_KEY, newToken);
    } catch (error) {
      console.error('Invalid token provided to login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // In a real app, you might also want to update the token or make an API call
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
