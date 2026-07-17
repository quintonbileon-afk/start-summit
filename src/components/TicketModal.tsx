import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, User, Ticket, Calendar, MapPin } from 'lucide-react';
import { RegistrationData } from '../types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RegistrationData | null;
}

export function TicketModal({ isOpen, onClose, data }: TicketModalProps) {
  if (!data) return null;

  const ticketId = data.ticketId || `SSB26-${data.fullName.replace(/\s+/g, '').substring(0, 5).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/95 backdrop-blur-md">
          {/* Backdrop Close Click */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-gradient-to-b from-[#162a45] to-primary border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden z-10 p-8 sm:p-10 text-center"
          >
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-yellow to-accent"></div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing success circle */}
            <div className="relative mx-auto w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <div className="absolute inset-2 bg-emerald-500/20 rounded-full blur-md"></div>
              <CheckCircle2 className="w-10 h-10 text-emerald-400 relative z-10" />
            </div>

            {/* Heading */}
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-3">
              Registration Complete!
            </h3>

            {/* Essential Message */}
            <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-8">
              Our staff will get back to you with the next steps.
            </p>

            {/* Elegant Registration Details Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
                <span className="text-xs text-white/40 font-mono tracking-wider uppercase">Reference Code</span>
                <span className="font-mono text-sm font-bold text-yellow bg-yellow/10 px-2.5 py-1 rounded-md border border-yellow/20">
                  {ticketId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-accent">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold">Attendee</span>
                    <span className="font-bold text-white text-sm">{data.fullName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-accent">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold">Pass Type</span>
                    <span className="font-semibold text-white text-sm capitalize">
                      {data.registrationType} {data.ticketOption ? `(${data.ticketOption})` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-accent">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold">Date</span>
                    <span className="font-medium text-white/80 text-sm">August 7, 2026</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-accent">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold">Venue</span>
                    <span className="font-medium text-white/80 text-sm">Game City Center, Gaborone</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={onClose}
              className="w-full bg-yellow hover:bg-yellow/90 text-primary font-bold py-4 px-8 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-yellow/10 text-sm tracking-wide uppercase font-display"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
