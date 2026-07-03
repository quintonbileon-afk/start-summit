import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

import logoImage from '../assets/images/startup_summit_logo_blue_1783060620265.jpg';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Key Areas', href: '#areas' },
    { name: 'Agenda', href: '#agenda' },
    { name: 'Venue', href: '#venue' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-primary/90 backdrop-blur-md shadow-lg py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center">
          <img src={logoImage} alt="Startup Summit Botswana Logo" className="h-16 md:h-20 w-auto object-contain mix-blend-screen rounded-2xl" />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-semibold text-white/80 hover:text-accent transition-colors">
              {link.name}
            </a>
          ))}
          <a href="#register" className="bg-accent hover:bg-accent/90 text-primary font-bold py-2.5 px-6 rounded-full transition-all hover:scale-105 active:scale-95">
            Register Now
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-primary-light border-t border-white/10 shadow-xl">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-semibold text-white/90 hover:text-accent transition-colors"
              >
                {link.name}
              </a>
            ))}
            <a 
              href="#register" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-accent text-center text-primary font-bold py-3 px-6 rounded-xl mt-4"
            >
              Register Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
