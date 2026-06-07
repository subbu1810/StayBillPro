import React, { useState, useEffect } from 'react';
import './App.css';
import { ServiceProvider } from './context/ServiceContext';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AboutUs from './components/AboutUs';
import Contact from './components/Contact';
import TrackTicket from './components/TrackTicket';
import { PopupProvider } from './components/ui/PopupProvider';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'auth', 'register', 'dashboard', 'privacy', 'terms', 'about', 'contact', 'track'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState('both');

  // Check for existing session on load
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
      window.history.replaceState(
        { view: 'dashboard', selectedPlan: null, selectedFeatures: 'both', isAuthenticated: true },
        '',
        window.location.pathname
      );
    }
  }, []);

  // Browser back button functionality
  useEffect(() => {
    const handlePopState = (event) => {
      // Handle browser back button
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        setSelectedPlan(event.state.selectedPlan || null);
        setSelectedFeatures(event.state.selectedFeatures || 'both');
        setIsAuthenticated(event.state.isAuthenticated || false);
      } else {
        // Default fallback to landing page
        setCurrentView('landing');
        setSelectedPlan(null);
        setSelectedFeatures('both');
        setIsAuthenticated(false);
      }
    };

    // Add event listener for browser back button
    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state
    window.history.pushState(
      { view: 'landing', selectedPlan: null, selectedFeatures: 'both', isAuthenticated: false },
      '',
      window.location.pathname
    );

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const updateHistory = (view, plan = null, features = 'both', auth = false) => {
    window.history.pushState(
      { view, selectedPlan: plan, selectedFeatures: features, isAuthenticated: auth },
      '',
      window.location.pathname
    );
  };

  const handleNavigateToAuth = () => {
    setCurrentView('auth');
    updateHistory('auth', null, 'both', false);
  };

  const handleNavigateToRegister = (planName, planFeatures = 'both') => {
    setSelectedPlan(planName);
    setSelectedFeatures(planFeatures);
    setCurrentView('register');
    updateHistory('register', planName, planFeatures, false);
  };

  const handleNavigateToPrivacy = () => {
    setCurrentView('privacy');
    updateHistory('privacy', null, false);
  };

  const handleNavigateToTerms = () => {
    setCurrentView('terms');
    updateHistory('terms', null, false);
  };

  const handleNavigateToAbout = () => {
    setCurrentView('about');
    updateHistory('about', null, false);
  };

  const handleNavigateToContact = () => {
    setCurrentView('contact');
    updateHistory('contact', null, false);
  };

  const handleNavigateToTrack = () => {
    setCurrentView('track');
    updateHistory('track', null, false);
  };

  const handleBackToHome = () => {
    setCurrentView('landing');
    setSelectedPlan(null);
    setSelectedFeatures('both');
    updateHistory('landing', null, 'both', false);
  };

  const handleLogin = (success) => {
    setIsAuthenticated(success);
    if (success) {
      setCurrentView('dashboard');
      updateHistory('dashboard', null, true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentView('landing');
    updateHistory('landing', null, false);
  };

  return (
    <PopupProvider>
      <ServiceProvider>
        <div className="App">
          {currentView === 'landing' && (
            <LandingPage
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToRegister={handleNavigateToRegister}
              onNavigateToPrivacy={handleNavigateToPrivacy}
              onNavigateToTerms={handleNavigateToTerms}
              onNavigateToAbout={handleNavigateToAbout}
              onNavigateToContact={handleNavigateToContact}
              onNavigateToTrack={handleNavigateToTrack}
            />
          )}
          {currentView === 'auth' && (
            <Auth onLogin={handleLogin} onBackToHome={handleBackToHome} mode="login" />
          )}
          {currentView === 'register' && (
            <Auth onLogin={handleLogin} onBackToHome={handleBackToHome} mode="register" selectedPlan={selectedPlan} selectedFeatures={selectedFeatures} />
          )}
          {currentView === 'dashboard' && isAuthenticated && (
            <AdminPanel onLogout={handleLogout} />
          )}
          {currentView === 'privacy' && (
            <PrivacyPolicy onBack={handleBackToHome} />
          )}
          {currentView === 'terms' && (
            <TermsOfService onBack={handleBackToHome} />
          )}
          {currentView === 'about' && (
            <AboutUs onBack={handleBackToHome} />
          )}
          {currentView === 'contact' && (
            <Contact onBack={handleBackToHome} />
          )}
          {currentView === 'track' && (
            <TrackTicket onBack={handleBackToHome} />
          )}
        </div>
      </ServiceProvider>
    </PopupProvider>
  );
}

export default App;
