/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { DiscussionAreas } from './components/DiscussionAreas';
import { Speakers } from './components/Speakers';
import { Agenda } from './components/Agenda';
import { FAQ } from './components/FAQ';
import { Venue } from './components/Venue';
import { Registration } from './components/Registration';
import { Footer } from './components/Footer';
import { TicketModal } from './components/TicketModal';
import { Dashboard } from './components/Dashboard';
import { RegistrationData } from './types';
import { isFirebaseConfigured } from './firebase';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

export default function App() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');
  const [showConfigError, setShowConfigError] = useState(!isFirebaseConfigured);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const renderConfigErrorBanner = () => {
    if (!showConfigError) return null;
    return (
      <div className="fixed bottom-4 right-4 max-w-md bg-secondary/95 border border-accent/30 rounded-2xl p-5 shadow-2xl z-[9999] text-white backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-start gap-3">
          <div className="bg-accent/10 p-2 rounded-lg text-accent shrink-0">
            <AlertTriangle className="w-5 h-5 text-accent animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-accent">Vercel Deployment Guide</h3>
              <button 
                onClick={() => setShowConfigError(false)}
                className="text-gray-400 hover:text-white transition-colors"
                id="close-config-banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              Your frontend is running, but Firebase has defaulted to dummy configurations because environment variables are not configured in Vercel.
            </p>
            
            <div className="bg-primary/50 rounded-lg p-3 mt-3 text-xs font-mono text-gray-400 space-y-1 max-h-32 overflow-y-auto">
              <span className="text-accent/80 block font-sans font-bold text-[10px] uppercase tracking-wider">Required Environment Keys:</span>
              <div>VITE_FIREBASE_API_KEY=...</div>
              <div>VITE_FIREBASE_AUTH_DOMAIN=...</div>
              <div>VITE_FIREBASE_PROJECT_ID=...</div>
              <div>VITE_FIREBASE_STORAGE_BUCKET=...</div>
              <div>VITE_FIREBASE_MESSAGING_SENDER_ID=...</div>
              <div>VITE_FIREBASE_APP_ID=...</div>
            </div>

            <div className="mt-4 flex gap-2">
              <a 
                href="https://vercel.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-primary font-bold px-3 py-1.5 rounded-full text-xs transition-colors"
              >
                Configure in Vercel
                <ExternalLink className="w-3 h-3" />
              </a>
              <button 
                onClick={() => setShowConfigError(false)}
                className="text-xs border border-gray-600 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-full transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle Hash routing for quick bookmarking/access to dashboard
  useEffect(() => {
    document.title = "Startup Summit Botswana 2026";
    // Clear admin hash on initial startup to ensure the landing page opens by default
    if (window.location.hash === '#admin' || window.location.hash === '#dashboard') {
      window.location.hash = '';
    }

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#dashboard') {
        setCurrentView('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setCurrentView('landing');
      }
    };

    // Check on initial mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRegistrationSuccess = (data: RegistrationData) => {
    setRegistrationData(data);
    setIsTicketModalOpen(true);
  };

  const navigateToLanding = () => {
    window.location.hash = '';
    setCurrentView('landing');
  };

  const navigateToAdmin = () => {
    window.location.hash = 'admin';
    setCurrentView('admin');
  };

  if (currentView === 'admin') {
    return (
      <div className="font-sans antialiased bg-primary text-white selection:bg-accent selection:text-primary">
        <Navigation onNavigateToAdmin={navigateToAdmin} currentView={currentView} onNavigateToLanding={navigateToLanding} />
        <Dashboard onBack={navigateToLanding} />
        <Footer />
        {renderConfigErrorBanner()}
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-primary text-white selection:bg-accent selection:text-primary">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-[100]"
        style={{ scaleX }}
      />
      <Navigation onNavigateToAdmin={navigateToAdmin} currentView={currentView} onNavigateToLanding={navigateToLanding} />
      
      <main>
        <Hero />
        <About />
        <DiscussionAreas />
        <Speakers />
        <Agenda />
        <FAQ />
        <Venue />
        <Registration onSuccess={handleRegistrationSuccess} />
      </main>

      <Footer />

      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => {
          setIsTicketModalOpen(false);
          window.location.hash = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        data={registrationData} 
      />
      {renderConfigErrorBanner()}
    </div>
  );
}

