import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Calendar, MapPin, User, Briefcase } from 'lucide-react';
import { RegistrationData } from '../types';
import { useRef } from 'react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RegistrationData | null;
}

export function TicketModal({ isOpen, onClose, data }: TicketModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const ticketId = `SSB26-${data.fullName.replace(/\s+/g, '').substring(0, 5).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrData = JSON.stringify({ name: data.fullName, email: data.email, ticketId });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Ticket Card */}
            <div 
              ref={ticketRef}
              className="bg-white text-primary rounded-3xl overflow-hidden shadow-2xl relative"
            >
              {/* Top Banner */}
              <div className="bg-primary p-6 text-center text-white relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-yellow to-accent"></div>
                <h3 className="font-display font-bold text-2xl mb-1 tracking-tight">START-UP SUMMIT</h3>
                <p className="text-accent font-semibold text-sm tracking-widest">BOTSWANA 2026</p>
              </div>

              {/* Cutouts */}
              <div className="absolute left-0 w-6 h-6 bg-primary/80 rounded-full -translate-x-1/2 top-[104px]"></div>
              <div className="absolute right-0 w-6 h-6 bg-primary/80 rounded-full translate-x-1/2 top-[104px]"></div>
              
              <div className="border-t-2 border-dashed border-gray-200 mx-6 mt-[4px]"></div>

              <div className="p-8 pb-10">
                <div className="flex flex-col items-center mb-8">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
                    <QRCodeSVG 
                      value={qrData} 
                      size={160}
                      level="H"
                      fgColor="#0F1B2B"
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{ticketId}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Attendee</p>
                      <p className="font-bold text-lg leading-tight">{data.fullName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Role / Organization</p>
                      <p className="font-medium text-gray-800 leading-tight">{data.role} at {data.company}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-accent font-semibold uppercase">{data.registrationType}</span>
                        {data.registrationType === 'attendant' && (
                          <>
                            <span className="text-xs text-gray-400 font-semibold uppercase">•</span>
                            <span className="text-xs text-yellow font-semibold uppercase">{data.ticketOption === 'standard' ? 'Standard Ticket' : 'Starter Pack'}</span>
                          </>
                        )}
                        {data.registrationType === 'exhibitor' && (
                          <>
                            <span className="text-xs text-gray-400 font-semibold uppercase">•</span>
                            <span className="text-xs text-yellow font-semibold uppercase">{data.exhibitorCategory.replace(/ – BWP.*/, '')}</span>
                          </>
                        )}
                        {data.registrationType === 'partner' && (
                          <>
                            <span className="text-xs text-gray-400 font-semibold uppercase">•</span>
                            <span className="text-xs text-yellow font-semibold uppercase">{data.partnershipCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-yellow shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Date</p>
                        <p className="font-medium text-sm">Aug 7, 2026</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-yellow shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Venue</p>
                        <p className="font-medium text-sm leading-tight">Game City Center</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button 
                className="flex items-center gap-2 bg-yellow hover:bg-yellow/90 text-primary font-bold py-3 px-8 rounded-full transition-all hover:scale-105 active:scale-95"
                onClick={() => alert("In a real app, this would download the ticket image.")}
              >
                <Download className="w-5 h-5" />
                Download Ticket
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
