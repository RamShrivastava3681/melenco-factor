import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const ADMIN_NAME = import.meta.env.VITE_ADMIN_NAME || 'Admin';

const VALID_CREDENTIALS = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD
};

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!VALID_CREDENTIALS.email || !VALID_CREDENTIALS.password) {
        setError('Login credentials are not configured. Set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD in .env.');
        return;
      }

      // Validate credentials
      if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate a mock JWT token
        const mockToken = btoa(JSON.stringify({
          email: email,
          name: ADMIN_NAME,
          role: 'admin',
          exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
        }));

        // Store token and update auth state
        login(mockToken);
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-financial-navy via-financial-navy/95 to-financial-navy/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4 p-2">
            <img 
              src="/logo-vertical-light (2).png" 
              alt="Whizunik Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Whizunik Factoring</h1>
          <p className="text-white/70">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-financial-navy">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your factoring portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-financial-navy">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-financial-navy">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 btn-financial"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/60 text-sm">
          © 2025 Whizunik Factoring. All rights reserved.
        </p>
      </div>
    </div>
  );
}
