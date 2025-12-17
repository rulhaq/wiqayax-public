import React, { useState, useEffect, useRef } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { adminLogin, isAdminAuthenticated } from '../services/adminAuthService';
import { onAuthChange } from '../../services/authService';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('cto@scalovate.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const onLoginSuccessRef = useRef(onLoginSuccess);

  // Keep ref updated
  useEffect(() => {
    onLoginSuccessRef.current = onLoginSuccess;
  }, [onLoginSuccess]);

  // Check if already authenticated
  useEffect(() => {
    const checkAndRedirect = () => {
      const isAuth = isAdminAuthenticated();
      console.log('AdminLogin - checking auth:', isAuth);
      if (isAuth) {
        console.log('Already authenticated, redirecting...');
        onLoginSuccessRef.current();
      }
    };
    
    // Wait a bit for Firebase to initialize
    const timer = setTimeout(() => {
      checkAndRedirect();
    }, 300);
    
    const unsubscribe = onAuthChange((user) => {
      console.log('Auth state changed:', user?.email);
      if (user && isAdminAuthenticated()) {
        checkAndRedirect();
      }
    });
    
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      
      if (!password) {
        setError('Password is required');
        setLoading(false);
        return;
      }

      console.log('Attempting admin login...');
      const result = await adminLogin(email.trim(), password);
      
      if (result.success) {
        console.log('Admin login successful, waiting for auth state...');
        // Wait for auth state to update, then trigger redirect
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds max wait
        const checkAuth = setInterval(() => {
          attempts++;
          if (isAdminAuthenticated()) {
            console.log('Admin authenticated, redirecting...');
            clearInterval(checkAuth);
            onLoginSuccess();
          } else if (attempts >= maxAttempts) {
            // Timeout - try redirect anyway
            clearInterval(checkAuth);
            console.warn('Auth state check timeout, redirecting anyway...');
            onLoginSuccess();
          }
        }, 100);
      } else {
        console.error('Admin login failed:', result.error);
        setError(result.error || 'Invalid credentials. Please check your email and password.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Admin login form error:', err);
      const errorMessage = err?.message || err?.toString() || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0f1117] rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-400 text-sm">WiqayaX Admin Dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#181a1f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="cto@scalovate.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#181a1f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Restricted access. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

