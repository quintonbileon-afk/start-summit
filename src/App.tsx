/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
import { RegistrationData } from './types';

export default function App() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);

  const handleRegistrationSuccess = (data: RegistrationData) => {
    setRegistrationData(data);
    setIsTicketModalOpen(true);
  };

  return (
    <div className="font-sans antialiased bg-primary text-white selection:bg-accent selection:text-primary">
      <Navigation />
      
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

