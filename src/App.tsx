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

export default function App() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });


  // Handle Hash routing for quick bookmarking/access to dashboard
  useEffect(() => {
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
        onClose={() => setIsTicketModalOpen(false)} 
        data={registrationData} 
      />
    </div>
  );
}

