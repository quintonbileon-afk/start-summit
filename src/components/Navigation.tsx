import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, LayoutDashboard, Home } from 'lucide-react';
import logoUrl from '../assets/images/startup_summit.png';

interface NavigationProps {
  onNavigateToAdmin?: () => void;
  onNavigateToLanding?: () => void;
  currentView?: 'landing' | 'admin';
}

export function Navigation({ onNavigateToAdmin, onNavigateToLanding, currentView = 'landing' }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('light') ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const navLinks = currentView === 'admin'
    ? [
        { name: 'Landing Page', href: '#', onClick: onNavigateToLanding, icon: <Home className="w-4 h-4 inline mr-1" /> },
        { name: '', title: 'Console Dashboard', href: '#admin', onClick: onNavigateToAdmin, isActive: true, icon: <LayoutDashboard className="w-5 h-5 inline" /> }
      ]
    : [
        { name: 'About', href: '#about' },
        { name: 'Key Areas', href: '#areas' },
        { name: 'Agenda', href: '#agenda' },
        { name: 'Venue', href: '#venue' },
        { name: '', title: 'Console Dashboard', href: '#admin', onClick: onNavigateToAdmin, icon: <LayoutDashboard className="w-5 h-5 inline" /> }
      ];

  const handleLinkClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    } else if (currentView === 'admin' && onNavigateToLanding) {
      // If we are in admin view and click a landing section hash, redirect first
      e.preventDefault();
      onNavigateToLanding();
      const targetHash = link.href;
      setTimeout(() => {
        window.location.hash = targetHash;
      }, 100);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-primary/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a 
          href="#" 
          onClick={(e) => {
            if (currentView === 'admin' && onNavigateToLanding) {
              e.preventDefault();
              onNavigateToLanding();
            }
          }} 
          className="flex items-center"
        >
          <img 
            src={logoUrl} 
            alt="Startup Summit Botswana Logo" 
            className={`h-20 md:h-24 w-auto object-contain transition-all duration-300 ${theme === 'dark' ? 'mix-blend-screen' : 'brightness-90 contrast-125'}`} 
          />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name || link.title} 
              href={link.href} 
              onClick={(e) => handleLinkClick(e, link)}
              title={'title' in link ? link.title : undefined}
              className={`text-sm font-semibold transition-all flex items-center ${
                'isActive' in link && link.isActive 
                  ? 'text-accent border-b-2 border-accent pb-1 mt-0.5' 
                  : 'text-white/80 hover:text-accent'
              }`}
            >
              {link.icon && link.icon}
              {link.name}
            </a>
          ))}
          {currentView !== 'admin' && (
            <a href="#register" className="bg-accent hover:bg-accent/90 text-primary font-bold py-2.5 px-6 rounded-full transition-all hover:scale-105 active:scale-95">
              Register Now
            </a>
          )}
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-white/10 transition-colors text-white hover:text-accent cursor-pointer"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow" /> : <Moon className="w-5 h-5 text-accent" />}
          </button>
        </div>

        {/* Mobile Menu & Theme Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow" /> : <Moon className="w-5 h-5 text-accent" />}
          </button>
          <button className="text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-primary-light border-t border-white/10 shadow-xl">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.name || link.title} 
                href={link.href} 
                onClick={(e) => handleLinkClick(e, link)}
                title={'title' in link ? link.title : undefined}
                className={`text-lg font-semibold flex items-center ${
                  'isActive' in link && link.isActive ? 'text-accent' : 'text-white/90 hover:text-accent'
                }`}
              >
                {link.icon && <span className="mr-2">{link.icon}</span>}
                {link.name || link.title}
              </a>
            ))}
            {currentView !== 'admin' && (
              <a 
                href="#register" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-accent text-center text-primary font-bold py-3 px-6 rounded-xl mt-4"
              >
                Register Now
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

