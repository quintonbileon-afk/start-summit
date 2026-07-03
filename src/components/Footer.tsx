import { Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0a121e] text-white/70 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <a href="#" className="font-display font-bold text-2xl tracking-tighter text-white block mb-6">
              START-UP <span className="text-accent">SUMMIT</span>
            </a>
            <p className="max-w-md mb-8">
              Transforming Botswana's Economy Through Innovation & Entrepreneurship. Join us in building the startup ecosystem from the ground up.
            </p>
            <div className="flex items-center gap-6">
              {/* Logos */}
              <div className="h-16 px-5 bg-[#ffffff] rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIGU6pt-b6wYv1mhTGDU2LQwpXB0DzBPjrNLH0zgb4cehYu8iGCoRaqKI&s=10" alt="Gaborone Business Associates" className="h-12 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="h-16 px-5 bg-[#fcf7f7] rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuvr8ERAahYtbd_dfMFuQsPzct1JQ5PZqdX7_xY3sUp3FFb9RbjwIgEJo&s=10" alt="Game City" className="h-12 object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="#about" className="hover:text-accent transition-colors">About</a></li>
              <li><a href="#areas" className="hover:text-accent transition-colors">Discussion Areas</a></li>
              <li><a href="#agenda" className="hover:text-accent transition-colors">Agenda</a></li>
              <li><a href="#register" className="hover:text-accent transition-colors">Registration</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:win@startupsummit.co.bw" className="flex items-center gap-3 hover:text-accent transition-colors">
                  <Mail className="w-5 h-5 text-secondary" />
                  win@startupsummit.co.bw
                </a>
              </li>
              <li>
                <a href="tel:+26771843386" className="flex items-center gap-3 hover:text-accent transition-colors">
                  <Phone className="w-5 h-5 text-secondary" />
                  +267 71843386
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; 2026 Start-Up Summit Botswana. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
