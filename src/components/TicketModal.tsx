import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, User, Briefcase, Share2, Lock, CheckCircle2, Building2, Smartphone } from 'lucide-react';
import { RegistrationData } from '../types';
import { useRef, useState, useEffect, FormEvent } from 'react';
import { toPng } from 'html-to-image';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RegistrationData | null;
}

const getAmountText = (reg: RegistrationData) => {
  if (reg.registrationType === 'partner') return 'Free';
  if (reg.registrationType === 'attendant') {
    if (reg.ticketOption === 'starter') return 'BWP 850';
    return 'BWP 300';
  }
  if (reg.registrationType === 'exhibitor') {
    if (reg.exhibitorCategory === 'GOVERNMENT AGENCY' || reg.exhibitorCategory === 'CORPORATE EXHIBITOR') return 'BWP 30,000';
    return 'BWP 1,500';
  }
  return 'TBD';
};

export function TicketModal({ isOpen, onClose, data }: TicketModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Payment states
  const [localPaymentStatus, setLocalPaymentStatus] = useState<'pending' | 'verified' | 'free'>('pending');
  const [localPaymentReference, setLocalPaymentReference] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const [refSuccess, setRefSuccess] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'bank' | 'mobile'>('bank');

  useEffect(() => {
    if (data) {
      setLocalPaymentStatus(data.paymentStatus || 'pending');
      setLocalPaymentReference(data.paymentReference || '');
      setReference(data.paymentReference || '');
      setRefSuccess(!!data.paymentReference);
    }
  }, [data]);

  if (!data) return null;

  const ticketId = data.ticketId || `SSB26-${data.fullName.replace(/\s+/g, '').substring(0, 5).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrData = JSON.stringify({ name: data.fullName, email: data.email, ticketId });

  const handleReferenceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!data.id) {
      setRefError("Unable to submit: Missing registration ID.");
      return;
    }
    if (!reference.trim()) {
      setRefError("Please enter a valid reference number.");
      return;
    }

    setIsSubmittingRef(true);
    setRefError(null);

    try {
      const regDocRef = doc(db, 'registrations', data.id);
      await updateDoc(regDocRef, {
        paymentReference: reference.trim(),
        paymentSubmittedAt: new Date()
      });

      setRefSuccess(true);
      setLocalPaymentReference(reference.trim());
    } catch (err: any) {
      console.error("Error submitting reference:", err);
      setRefError("Failed to update payment reference. Please check your network and try again.");
    } finally {
      setIsSubmittingRef(false);
    }
  };

  const captureTicket = async (): Promise<string | null> => {
    if (!ticketRef.current) return null;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: 'transparent'
      });
      return dataUrl;
    } catch (error) {
      console.error('Error capturing ticket:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await captureTicket();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `StartupSummitTicket-${data.fullName.replace(/\s+/g, '')}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleWhatsAppShare = () => {
    const text = `I'm attending the Botswana Startup Summit 2026! 🚀 Join me at Game City Center on Aug 7. Register here: https://www.startupsummit.co.bw`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-primary/80 backdrop-blur-sm">
          {/* Fixed Floating Close Button for reliable visibility on any scroll/viewport */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 z-[60] p-3 bg-primary hover:bg-accent hover:text-white text-white rounded-full border border-white/10 transition-all shadow-xl active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md my-4"
            >
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 md:-right-12 md:top-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Close"
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
                  <p className="text-accent font-semibold text-sm tracking-widest mb-3">BOTSWANA 2026</p>
                  
                  {localPaymentStatus === 'pending' ? (
                    <span className="inline-block px-3 py-1 bg-yellow/20 border border-yellow/40 text-yellow font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                      ⚠️ Payment Pending
                    </span>
                  ) : localPaymentStatus === 'free' ? (
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                      🤝 Compliment Partner
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                      ✅ Paid & Confirmed
                    </span>
                  )}
                </div>

                {/* Cutouts */}
                <div className="absolute left-0 w-6 h-6 bg-primary/80 rounded-full -translate-x-1/2 top-[120px]"></div>
                <div className="absolute right-0 w-6 h-6 bg-primary/80 rounded-full translate-x-1/2 top-[120px]"></div>
                
                <div className="border-t-2 border-dashed border-gray-200 mx-6 mt-[4px]"></div>

                <div className="p-8 pb-10">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center mb-8 relative">
                    {localPaymentStatus === 'pending' ? (
                      <div className="relative p-3 bg-white rounded-xl shadow-sm border border-gray-100 mb-4 flex items-center justify-center">
                        <div className="filter blur-md opacity-20">
                          <QRCodeSVG 
                            value={qrData} 
                            size={160}
                            level="H"
                            fgColor="#0F1B2B"
                          />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                          <Lock className="w-10 h-10 text-yellow mb-2 animate-pulse" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ticket Locked</span>
                          <span className="text-[10px] text-gray-400 mt-1">Awaiting Verification</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
                        <QRCodeSVG 
                          value={qrData} 
                          size={160}
                          level="H"
                          fgColor="#0F1B2B"
                        />
                      </div>
                    )}
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
                              <span className="text-xs text-yellow font-semibold uppercase">{(data.exhibitorCategory || 'SME').replace(/ – BWP.*/, '')}</span>
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

                    {/* Manual Payment Section */}
                    {localPaymentStatus === 'pending' && (
                      <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 text-left">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-primary">
                          <h4 className="font-bold text-xs text-amber-800 flex items-center gap-1.5 mb-2.5">
                            <span>💳</span> Select a Payment Method
                          </h4>
                          
                          <p className="text-[11px] text-amber-950 mb-3 leading-relaxed">
                            Please transfer <strong className="text-amber-800 font-bold">{getAmountText(data)}</strong> to activate your digital ticket:
                          </p>

                          {/* Tab Switcher */}
                          <div className="flex gap-2 p-1 bg-amber-100/50 rounded-xl mb-3 border border-amber-200/30">
                            <button
                              type="button"
                              onClick={() => setPaymentTab('bank')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                paymentTab === 'bank'
                                  ? 'bg-amber-800 text-white shadow-sm'
                                  : 'text-amber-800/70 hover:text-amber-800 hover:bg-amber-100'
                              }`}
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              Bank Transfer
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentTab('mobile')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                paymentTab === 'mobile'
                                  ? 'bg-amber-800 text-white shadow-sm'
                                  : 'text-amber-800/70 hover:text-amber-800 hover:bg-amber-100'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              Mobile Money
                            </button>
                          </div>

                          {/* Tab Content */}
                          {paymentTab === 'bank' ? (
                            <div className="space-y-1 text-[11px] font-mono text-amber-900 bg-white/70 p-3 rounded-xl border border-amber-100/50">
                              <div><span className="text-gray-500">Bank:</span> FNBB (First National Bank)</div>
                              <div><span className="text-gray-500">Name:</span> Start-up Summit Botswana</div>
                              <div><span className="text-gray-500">Account:</span> <span className="font-bold">62912345678</span></div>
                              <div><span className="text-gray-500">Branch Code:</span> 282267 (Corporate Branch)</div>
                              <div className="pt-1 mt-1 border-t border-amber-200/40">
                                <span className="text-gray-500">Reference:</span> <span className="font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-100">{ticketId}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-[11px] font-mono text-amber-900 bg-white/70 p-3 rounded-xl border border-amber-100/50">
                              <div className="font-sans font-bold text-[10px] text-amber-800/80 uppercase tracking-wider mb-1">Send payment to:</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-amber-50/50 p-1.5 rounded border border-amber-100/30">
                                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Pay2Cell</span>
                                  <span className="font-bold text-amber-950">71843386</span>
                                </div>
                                <div className="bg-amber-50/50 p-1.5 rounded border border-amber-100/30">
                                  <span className="text-gray-500 block text-[9px] uppercase font-bold">E-Wallet</span>
                                  <span className="font-bold text-amber-950">71843386</span>
                                </div>
                                <div className="bg-amber-50/50 p-1.5 rounded border border-amber-100/30">
                                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Orange Money</span>
                                  <span className="font-bold text-amber-950">72846420</span>
                                </div>
                                <div className="bg-amber-50/50 p-1.5 rounded border border-amber-100/30">
                                  <span className="text-gray-500 block text-[9px] uppercase font-bold">MyZaka</span>
                                  <span className="font-bold text-amber-950">71843386</span>
                                </div>
                              </div>
                              <div className="pt-1 mt-1 border-t border-amber-200/40 text-[10px] leading-relaxed">
                                <span className="text-gray-500">Reference:</span> <span className="font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-100">{ticketId}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {refSuccess ? (
                          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 text-xs">
                            <p className="font-bold flex items-center gap-1.5 mb-1 text-green-900">
                              <CheckCircle2 className="w-4 h-4 text-green-600" /> Payment Reference Submitted
                            </p>
                            <p className="text-[11px] text-green-700">Ref Code: <strong className="font-mono">{localPaymentReference}</strong></p>
                            <p className="text-[10px] text-green-600 mt-2 leading-relaxed">
                              Our team is currently verifying this payment. You will receive an email confirmation with your activated digital ticket once confirmed.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleReferenceSubmit} className="space-y-2">
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                              Enter Bank Transfer Ref or Number that made the payment
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                required
                                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent font-mono"
                                placeholder="e.g. FT260714 or 71843386"
                                value={reference}
                                onChange={(e) => {
                                  setReference(e.target.value);
                                  setRefError(null);
                                }}
                              />
                              <button
                                type="submit"
                                disabled={isSubmittingRef}
                                className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                              >
                                {isSubmittingRef ? 'Saving...' : 'Submit'}
                              </button>
                            </div>
                            {refError && <p className="text-red-500 text-[10px] mt-1">{refError}</p>}
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
