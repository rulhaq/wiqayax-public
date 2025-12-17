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
import { onAuthChange } from './services/authService';
import { AppRoute } from './types';

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Check auth state (local storage)
    let authUnsubscribe: (() => void) | null = null;
    
    const initAuth = () => {
      authUnsubscribe = onAuthChange((user) => {
        setAuthInitialized(true);
      });
    };
    
    // Initialize auth check
    initAuth();
    
    // Fallback: set initialized after delay
    const timer = setTimeout(() => {
      setAuthInitialized(true);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, []);

  const navigate = useCallback((route: AppRoute | string) => {
    if (typeof route === 'string' && route.startsWith('/')) {
      // Handle string routes
      window.history.pushState({}, '', route);
      setCurrentRoute(AppRoute.LANDING);
    } else {
      setCurrentRoute(route as AppRoute);
    }
  }, []);

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