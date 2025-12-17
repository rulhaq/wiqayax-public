import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { EditorApp } from './components/EditorApp';
import { AdminDashboard } from './components/AdminDashboard';
import { MembersArea } from './components/MembersArea';
import { UserDashboard } from './components/UserDashboard';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { PricingPage } from './components/PricingPage';
import { HelpCenter } from './components/HelpCenter';
import { CheckoutPage } from './components/CheckoutPage';
import { CheckoutSuccess } from './components/CheckoutSuccess';
import { ApiGuide } from './components/ApiGuide';
import { LicensePage } from './components/LicensePage';
import { AdminLogin } from './abbakialmari/components/AdminLogin';
import { AdminDashboard as AdminDashboardComponent } from './abbakialmari/components/AdminDashboard';
import { isAdminAuthenticated } from './abbakialmari/services/adminAuthService';
import { onAuthChange } from './services/authService';
import { AppRoute } from './types';

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Function to check and set admin route
    const checkAdminRoute = () => {
      const path = window.location.pathname;
      const isAdmin = path === '/abbakialmari' || path.startsWith('/abbakialmari/');
      setIsAdminRoute(isAdmin);
    };
    
    // Check immediately on mount
    checkAdminRoute();
    
    // Check auth state (local storage)
    let authUnsubscribe: (() => void) | null = null;
    
    const initAuth = () => {
      authUnsubscribe = onAuthChange((user) => {
        setAuthInitialized(true);
        // Re-check admin route when auth changes
        checkAdminRoute();
      });
    };
    
    // Initialize auth check
    initAuth();
    
    // Fallback: set initialized after delay
    const timer = setTimeout(() => {
      setAuthInitialized(true);
    }, 500);
    
    // Listen for popstate (back/forward navigation)
    const handlePopState = () => {
      checkAdminRoute();
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, []);

  const navigate = useCallback((route: AppRoute | string) => {
    if (route === '/abbakialmari') {
      setIsAdminRoute(true);
      window.history.pushState({}, '', '/abbakialmari');
    } else if (typeof route === 'string' && route.startsWith('/')) {
      // Handle string routes (for admin)
      window.history.pushState({}, '', route);
      if (route === '/abbakialmari') {
        setIsAdminRoute(true);
      } else {
        setIsAdminRoute(false);
        setCurrentRoute(AppRoute.LANDING);
      }
    } else {
      setIsAdminRoute(false);
      setCurrentRoute(route as AppRoute);
    }
  }, []);

  const handleAdminLoginSuccess = useCallback(() => {
    console.log('handleAdminLoginSuccess called');
    setIsAdminRoute(true);
    window.history.pushState({}, '', '/abbakialmari');
    // Force re-render by updating auth initialized state
    setAuthInitialized(false);
    setTimeout(() => {
      setAuthInitialized(true);
    }, 100);
  }, []);

  // Handle admin route
  if (isAdminRoute) {
    // Show loading while auth initializes
    if (!authInitialized) {
      return (
        <div className="min-h-screen bg-[#050507] flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      );
    }
    
    // Check authentication status
    const adminAuth = isAdminAuthenticated();
    console.log('Admin route - authenticated:', adminAuth);
    
    if (adminAuth) {
      return <AdminDashboardComponent onNavigate={navigate} />;
    } else {
      return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
    }
  }

  // Handle regular app routes
  switch (currentRoute) {
    case AppRoute.EDITOR:
      return <EditorApp onNavigate={navigate} />;
    case AppRoute.ADMIN:
      return <AdminDashboard onNavigate={navigate} />;
    case AppRoute.MEMBERS:
      return <MembersArea onNavigate={navigate} />;
    case AppRoute.PRIVACY:
      return <PrivacyPolicy onNavigate={navigate} />;
    case AppRoute.TERMS:
      return <TermsOfService onNavigate={navigate} />;
    case AppRoute.PRICING:
      return <PricingPage onNavigate={navigate} />;
    case AppRoute.SUPPORT:
      return <HelpCenter onNavigate={navigate} />;
    case AppRoute.CHECKOUT:
      return <CheckoutPage onNavigate={navigate} />;
    case AppRoute.CHECKOUT_SUCCESS:
      return <CheckoutSuccess onNavigate={navigate} />;
    case AppRoute.API_GUIDE:
      return <ApiGuide onNavigate={navigate} />;
    case AppRoute.LICENSE:
      return <LicensePage onNavigate={navigate} />;
    case AppRoute.LANDING:
    default:
      return <LandingPage onNavigate={navigate} />;
  }
}

export default App;