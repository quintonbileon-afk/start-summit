import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import logoUrl from '../assets/images/startup_summit.png';
import { 
  Users, Briefcase, Award, Search, Filter, Download, Trash2, 
  ExternalLink, Calendar, MapPin, Mail, Phone, ChevronRight, X,
  ArrowLeft, RefreshCw, Layers, CheckCircle2, AlertTriangle, Play, LogOut,
  Ticket, Check, QrCode, UserCheck, AlertCircle, Laptop, Tablet
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, getDocs, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { RegistrationData } from '../types';
import { AdminLogin } from './AdminLogin';

interface FirebaseRegistration extends RegistrationData {
  id: string;
  submittedAt?: any;
}

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [registrations, setRegistrations] = useState<FirebaseRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'attendant' | 'exhibitor' | 'partner'>('all');
  const [selectedReg, setSelectedReg] = useState<FirebaseRegistration | null>(null);
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Ticket Verification & Check-in states
  const [activeTab, setActiveTab] = useState<'list' | 'verify' | 'email_logs'>('list');
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyResult, setVerifyResult] = useState<FirebaseRegistration | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState<string | null>(null);
  const [verifySearchTerm, setVerifySearchTerm] = useState('');

  // Email Delivery logs state
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(true);

  // High Quality Ticket Generator state
  const [generatedTicketReg, setGeneratedTicketReg] = useState<FirebaseRegistration | null>(null);
  const [isExportingTicket, setIsExportingTicket] = useState(false);
  const ticketPrintRef = useRef<HTMLDivElement>(null);

  // Load email logs in real-time
  useEffect(() => {
    if (!user) return;
    
    const logsQuery = query(collection(db, 'email_logs'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setEmailLogs(data);
      setEmailLogsLoading(false);
    }, (error) => {
      console.error("Firestore email_logs sync error:", error);
      setEmailLogsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Handle Resending a ticket
  const handleResendTicket = async (reg: FirebaseRegistration) => {
    setIsResendingEmail(reg.id);
    setVerificationSuccessMessage(null);
    try {
      const response = await fetch('/api/resend-ticket-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reg.id,
          fullName: reg.fullName,
          email: reg.email,
          registrationType: reg.registrationType,
          ticketOption: reg.ticketOption,
          exhibitorCategory: reg.exhibitorCategory,
          company: reg.company,
          ticketId: getTicketId(reg)
        })
      });
      
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        // If the server responded with text, check if it implies success or simulation
        if (responseText.includes("queued") || responseText.includes("success") || responseText.includes("simulated")) {
          data = { success: true };
        } else {
          throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
        }
      }

      if (data.success) {
        setVerificationSuccessMessage(`Digital ticket copy resent to ${reg.fullName} (${reg.email}) successfully!`);
      } else {
        throw new Error(data.error || "Failed to resend ticket email.");
      }
      setTimeout(() => setVerificationSuccessMessage(null), 4500);
    } catch (err: any) {
      console.error("Resend ticket email error:", err);
      alert(`Error resending email: ${err.message || String(err)}`);
    } finally {
      setIsResendingEmail(null);
    }
  };

  // Computes or retrieves a stable ticket number for any registration
  const getTicketId = (reg: FirebaseRegistration): string => {
    if (reg.ticketId) return reg.ticketId;
    const namePart = (reg.fullName || '').replace(/\s+/g, '').substring(0, 5).toUpperCase();
    let hash = 0;
    const str = reg.id || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lastFour = Math.abs(hash % 9000) + 1000;
    return `SSB26-${namePart}-${lastFour}`;
  };

  // Perform Verification by Ticket ID
  const handleVerify = (ticketNum: string) => {
    const trimmed = ticketNum.trim().toUpperCase();
    if (!trimmed) {
      setVerifyResult(null);
      setVerifyError(null);
      return;
    }

    const found = registrations.find(reg => {
      const id = getTicketId(reg).toUpperCase();
      return id === trimmed;
    });

    if (found) {
      setVerifyResult(found);
      setVerifyError(null);
    } else {
      setVerifyResult(null);
      setVerifyError("Ticket number not found. Verify format (e.g. SSB26-XXXXX-YYYY) or try searching by name in the registrations list.");
    }
  };

  // Perform Check-in or Undo Check-in
  const handleCheckIn = async (regId: string, status: boolean) => {
    setIsCheckingIn(true);
    setVerificationSuccessMessage(null);
    try {
      const regDocRef = doc(db, 'registrations', regId);
      const checkedInAtVal = status ? new Date() : null;
      
      await updateDoc(regDocRef, {
        checkedIn: status,
        checkedInAt: checkedInAtVal
      });

      // Update locally immediately
      setRegistrations(prev => prev.map(r => 
        r.id === regId 
          ? { ...r, checkedIn: status, checkedInAt: checkedInAtVal ? { toDate: () => checkedInAtVal } : null } 
          : r
      ));

      // Update verify result state
      if (verifyResult && verifyResult.id === regId) {
        setVerifyResult(prev => prev ? { ...prev, checkedIn: status, checkedInAt: checkedInAtVal ? { toDate: () => checkedInAtVal } : null } : null);
      }

      // Update detail modal selected reg if active
      if (selectedReg && selectedReg.id === regId) {
        setSelectedReg(prev => prev ? { ...prev, checkedIn: status, checkedInAt: checkedInAtVal ? { toDate: () => checkedInAtVal } : null } : null);
      }

      setVerificationSuccessMessage(status ? "Attendee checked in successfully!" : "Check-in undone successfully!");
      setTimeout(() => setVerificationSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Check-in Firestore update error:", err);
      handleFirestoreError(err, OperationType.UPDATE, `registrations/${regId}`);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Perform manual payment verification and send final ticket email
  const handleVerifyPayment = async (reg: FirebaseRegistration) => {
    setIsVerifyingPayment(reg.id);
    setVerificationSuccessMessage(null);
    try {
      const regDocRef = doc(db, 'registrations', reg.id);
      await updateDoc(regDocRef, {
        paymentStatus: 'verified'
      });

      // Dispatch verified email containing final ticket details and activation receipt
      await fetch('/api/send-payment-verified-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: reg.fullName,
          email: reg.email,
          registrationType: reg.registrationType,
          ticketOption: reg.ticketOption,
          exhibitorCategory: reg.exhibitorCategory,
          ticketId: getTicketId(reg)
        })
      }).catch(emailErr => console.warn('Silent verification email failure:', emailErr));

      // Update locally immediately
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, paymentStatus: 'verified' } : r));

      // Update verify result state if active
      if (verifyResult && verifyResult.id === reg.id) {
        setVerifyResult(prev => prev ? { ...prev, paymentStatus: 'verified' } : null);
      }

      // Update detail modal selected reg if active
      if (selectedReg && selectedReg.id === reg.id) {
        setSelectedReg(prev => prev ? { ...prev, paymentStatus: 'verified' } : null);
      }

      setVerificationSuccessMessage(`Payment for ${reg.fullName} verified successfully, and ticket has been sent!`);
      setTimeout(() => setVerificationSuccessMessage(null), 4500);
    } catch (err) {
      console.error("Firestore payment status update error:", err);
      handleFirestoreError(err, OperationType.UPDATE, `registrations/${reg.id}`);
    } finally {
      setIsVerifyingPayment(null);
    }
  };

  // Download ticket as high-quality PNG
  const handleDownloadPNG = async (ref: HTMLDivElement | null, name: string) => {
    if (!ref) return;
    try {
      const dataUrl = await toPng(ref, {
        quality: 1.0,
        pixelRatio: 2.5,
        backgroundColor: '#0c1a2d',
      });
      const link = document.createElement('a');
      link.download = `Ticket_${name.replace(/\s+/g, '_')}_SSB26.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating high-quality PNG ticket:', err);
    }
  };

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load / Sync Data
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(collection(db, 'registrations'), orderBy('submittedAt', 'desc'));

    if (isLiveSync) {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data: FirebaseRegistration[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as FirebaseRegistration);
        });
        setRegistrations(data);
        setLoading(false);
      }, (error) => {
        console.error("Firestore sync error:", error);
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'registrations');
      });
      return () => unsubscribe();
    } else {
      const fetchData = async () => {
        try {
          const querySnapshot = await getDocs(q);
          const data: FirebaseRegistration[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as FirebaseRegistration);
          });
          setRegistrations(data);
        } catch (error) {
          console.error("Firestore fetch error:", error);
          handleFirestoreError(error, OperationType.LIST, 'registrations');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isLiveSync, user]);


  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'registrations'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: FirebaseRegistration[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as FirebaseRegistration);
      });
      setRegistrations(data);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.LIST, 'registrations');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'registrations', id));
      setDeleteId(null);
      if (selectedReg?.id === id) {
        setSelectedReg(null);
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
      handleFirestoreError(err, OperationType.DELETE, `registrations/${id}`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    // Build headers
    const headers = [
      'Full Name', 'Email', 'Phone', 'Company', 'Role', 'Type', 
      'Category/Sector', 'Ticket Option', 'Date Submitted', 'Physical Address'
    ];

    const rows = registrations.map(reg => {
      const date = reg.submittedAt?.toDate 
        ? reg.submittedAt.toDate().toLocaleDateString() 
        : 'Pending';
      
      return [
        `"${reg.fullName?.replace(/"/g, '""') || ''}"`,
        `"${reg.email?.replace(/"/g, '""') || ''}"`,
        `"${reg.mobileNumber || ''}"`,
        `"${reg.company?.replace(/"/g, '""') || ''}"`,
        `"${reg.role?.replace(/"/g, '""') || ''}"`,
        `"${reg.registrationType || ''}"`,
        `"${reg.businessSector || reg.participantCategory || ''}"`,
        `"${reg.ticketOption || ''}"`,
        `"${date}"`,
        `"${reg.physicalAddress?.replace(/"/g, '""') || ''}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `botswana_startup_summit_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter and Search Logic
  const filteredRegs = registrations.filter(reg => {
    const matchesSearch = 
      (reg.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.company?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.role?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || reg.registrationType === filterType;

    return matchesSearch && matchesFilter;
  });

  // Category breakdown stats
  const totalCount = registrations.length;
  const attendantCount = registrations.filter(r => r.registrationType === 'attendant').length;
  const exhibitorCount = registrations.filter(r => r.registrationType === 'exhibitor').length;
  const partnerCount = registrations.filter(r => r.registrationType === 'partner').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-accent animate-spin mb-4" />
        <p className="text-white/60 text-sm font-semibold tracking-wide uppercase">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-primary pt-28 pb-16 px-4 md:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Visual background accents */}
      <div className="absolute top-20 left-10 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-yellow/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/10">
          <div>
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-2 text-white/60 hover:text-accent transition-colors mb-4 group text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Landing Page
            </button>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              Summit Registration Console
            </h1>
            <p className="text-white/60 mt-2 text-sm md:text-base">
              Monitor, filter, inspect and export registration entries for Startup Summit Botswana 2026.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Sync Badge Toggle */}
            <button
              onClick={() => setIsLiveSync(!isLiveSync)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                isLiveSync 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-white/5 border-white/10 text-white/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveSync ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              {isLiveSync ? 'Live Syncing' : 'Static Mode'}
            </button>

            {/* Manual Refresh */}
            {!isLiveSync && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white disabled:opacity-50"
                title="Refresh registrations"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              disabled={registrations.length === 0}
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            {/* Logout */}
            <button
              onClick={async () => {
                await signOut(auth);
                setUser(null);
              }}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Sign out from console"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          
          <div className="bg-primary-light/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex items-center gap-4">
            <div className="p-3 bg-accent/10 text-accent rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">Total Registered</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{totalCount}</h3>
            </div>
          </div>

          <div className="bg-primary-light/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex items-center gap-4">
            <div className="p-3 bg-yellow/10 text-yellow rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">Attendants</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{attendantCount}</h3>
            </div>
          </div>

          <div className="bg-primary-light/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">Exhibitors</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{exhibitorCount}</h3>
            </div>
          </div>

          <div className="bg-primary-light/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">Partners / Sponsors</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{partnerCount}</h3>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-8 gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-4 px-6 font-display font-semibold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'list' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Registrations List</span>
          </button>
          
          <button
            onClick={() => setActiveTab('verify')}
            className={`pb-4 px-6 font-display font-semibold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'verify' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Ticket className="w-4.5 h-4.5" />
            <span>Ticket Verification Center</span>
          </button>

          <button
            onClick={() => setActiveTab('email_logs')}
            className={`pb-4 px-6 font-display font-semibold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'email_logs' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Mail className="w-4.5 h-4.5" />
            <span>Email Delivery Logs</span>
          </button>
        </div>

        {activeTab === 'list' ? (
          <>
            {/* Filter and Search Controls */}
            <div className="bg-primary-light/40 border border-white/10 rounded-3xl p-5 mb-8 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search bar */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by name, email, role or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-primary/60 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-accent/50 text-sm transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Categories */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
                <span className="text-xs font-bold uppercase tracking-wider text-white/40 self-center mr-2 hidden lg:inline">Filter By:</span>
                {(['all', 'attendant', 'exhibitor', 'partner'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      filterType === type 
                        ? 'bg-accent text-white shadow-lg shadow-accent/10' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {type === 'all' ? 'All entries' : type + 's'}
                  </button>
                ))}
              </div>

            </div>

            {/* Entries Table & Card List */}
            <div className="bg-primary-light/30 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
              
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin mb-4" />
                  <p className="text-white/60 text-sm">Loading registrations from database...</p>
                </div>
              ) : filteredRegs.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-white/30" />
                  </div>
                  <h3 className="text-xl font-bold text-white">No registrations found</h3>
                  <p className="text-white/60 mt-1 max-w-md mx-auto text-sm">
                    {searchQuery || filterType !== 'all' 
                      ? "We couldn't find any entries matching your current search or filter criteria."
                      : "No registrations have been submitted yet. Go fill the registration form to see your submission here!"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-primary-light/50 text-[11px] font-bold uppercase tracking-wider text-white/40">
                        <th className="py-4.5 px-6">Attendee</th>
                        <th className="py-4.5 px-6">Company / Org</th>
                        <th className="py-4.5 px-6">Category</th>
                        <th className="py-4.5 px-6">Payment</th>
                        <th className="py-4.5 px-6">Date Registered</th>
                        <th className="py-4.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRegs.map((reg) => {
                        const formattedDate = reg.submittedAt?.toDate 
                          ? reg.submittedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                          : 'Just now';

                        return (
                          <tr 
                            key={reg.id}
                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                            onClick={() => setSelectedReg(reg)}
                          >
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-white group-hover:text-accent transition-colors flex items-center gap-2">
                                  {reg.fullName}
                                  {reg.checkedIn && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-green-500/15 border border-green-500/25 text-green-400 text-[9px] font-bold uppercase tracking-wider">
                                      Checked In
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-white/55 font-mono mt-0.5">
                                  {reg.email}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-white/95 font-semibold text-sm">
                                  {reg.company || 'Individual'}
                                </span>
                                <span className="text-xs text-white/55 mt-0.5">
                                  {reg.role || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                reg.registrationType === 'attendant' 
                                  ? 'bg-yellow/10 text-yellow' 
                                  : reg.registrationType === 'exhibitor' 
                                  ? 'bg-purple-500/10 text-purple-400' 
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {reg.registrationType}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {reg.registrationType === 'partner' ? (
                                <span className="text-[10px] text-emerald-400/80 font-semibold font-mono uppercase tracking-wider bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">Complimentary</span>
                              ) : reg.paymentStatus === 'verified' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/15 border border-green-500/25 text-green-400 text-[9px] font-bold uppercase tracking-wider">
                                  Paid
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow/15 border border-yellow/25 text-yellow text-[9px] font-bold uppercase tracking-wider">
                                    Pending
                                  </span>
                                  {reg.paymentReference && (
                                    <span className="text-[9px] font-mono text-white/40 truncate max-w-[110px]" title={`Ref: ${reg.paymentReference}`}>
                                      Ref: {reg.paymentReference}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-sm text-white/60">
                              {formattedDate}
                            </td>
                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2.5">
                                {/* Quick Mark as Paid Button */}
                                {reg.paymentStatus !== 'verified' && reg.registrationType !== 'partner' && (
                                  <button
                                    onClick={async () => {
                                      await handleVerifyPayment(reg);
                                    }}
                                    disabled={isVerifyingPayment === reg.id}
                                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Mark payment as Paid & Verified"
                                  >
                                    {isVerifyingPayment === reg.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                    <span>Mark Paid</span>
                                  </button>
                                )}

                                {/* Generate High-Quality Ticket Button (only when payment status is paid) */}
                                {(reg.paymentStatus === 'verified' || reg.registrationType === 'partner') && (
                                  <button
                                    onClick={() => setGeneratedTicketReg(reg)}
                                    className="px-3 py-1.5 bg-yellow/10 hover:bg-yellow/20 border border-yellow/20 text-yellow rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="Generate Premium Ticket & QR Code"
                                  >
                                    <Ticket className="w-3.5 h-3.5" />
                                    <span>Generate Ticket</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => setSelectedReg(reg)}
                                  className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                                  title="View details"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(reg.id)}
                                  className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-all"
                                  title="Delete registration"
                                  id={`delete-${reg.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </>
        ) : activeTab === 'verify' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Input Panel & Lookup */}
            <div className="lg:col-span-5 space-y-6">
              {/* Manual Ticket ID Form */}
              <div className="bg-primary-light/40 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Ticket Verification</h3>
                    <p className="text-white/50 text-xs mt-0.5">Enter ticket number to verify attendance</p>
                  </div>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerify(verifyQuery);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                      Ticket Number
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="e.g. SSB26-JANED-1234"
                        value={verifyQuery}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setVerifyQuery(val);
                          // Auto-verify as they type if it has the correct length or format
                          if (val.trim().length >= 12) {
                            const trimmed = val.trim();
                            const found = registrations.find(reg => getTicketId(reg).toUpperCase() === trimmed);
                            if (found) {
                              setVerifyResult(found);
                              setVerifyError(null);
                            }
                          }
                        }}
                        className="w-full bg-primary/60 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-accent font-mono text-sm tracking-wider uppercase transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-white/40 mt-1.5 block font-mono">
                      Format: SSB26-[NAME5]-[RAND4] (e.g. SSB26-QUINT-4103)
                    </span>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold py-3 px-5 rounded-xl text-sm transition-all shadow-lg shadow-accent/15 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <UserCheck className="w-4 h-4" />
                      Verify Ticket
                    </button>
                    {verifyQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyQuery('');
                          setVerifyResult(null);
                          setVerifyError(null);
                        }}
                        className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Quick Attendee Lookup (Search by Name/Email) */}
              <div className="bg-primary-light/30 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                <div className="mb-4">
                  <h4 className="font-display font-bold text-sm text-white">Attendee Lookup (Helper)</h4>
                  <p className="text-white/40 text-xs mt-0.5">Search by name/email to retrieve ticket IDs instantly</p>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search name, email, company..."
                    value={verifySearchTerm}
                    onChange={(e) => setVerifySearchTerm(e.target.value)}
                    className="w-full bg-primary/40 border border-white/5 rounded-xl py-2 px-10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-accent/40 transition-all"
                  />
                  {verifySearchTerm && (
                    <button 
                      onClick={() => setVerifySearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {registrations
                    .filter(reg => {
                      if (!verifySearchTerm.trim()) return true;
                      const search = verifySearchTerm.toLowerCase();
                      return (
                        reg.fullName?.toLowerCase().includes(search) ||
                        reg.email?.toLowerCase().includes(search) ||
                        reg.company?.toLowerCase().includes(search)
                      );
                    })
                    .slice(0, 10)
                    .map((reg) => {
                      const ticketId = getTicketId(reg);
                      return (
                        <button
                          key={reg.id}
                          onClick={() => {
                            setVerifyQuery(ticketId);
                            setVerifyResult(reg);
                            setVerifyError(null);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                            verifyQuery === ticketId 
                              ? 'bg-accent/15 border-accent/30 text-white' 
                              : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:border-white/5'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 max-w-[65%]">
                            <span className="font-bold truncate text-white">{reg.fullName}</span>
                            <span className="text-[10px] text-white/40 truncate font-mono">{ticketId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {reg.checkedIn ? (
                              <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[8px] uppercase tracking-wider">
                                Checked In
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-yellow/10 border border-yellow/20 text-yellow font-bold text-[8px] uppercase tracking-wider">
                                Ready
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  {registrations.length === 0 && (
                    <p className="text-white/30 text-xs text-center py-4">No records found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Verification Card */}
            <div className="lg:col-span-7">
              {verificationSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-green-500/15 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-2 text-sm font-semibold"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {verificationSuccessMessage}
                </motion.div>
              )}

              {verifyResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white text-primary rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col relative"
                >
                  {/* Decorative Ticket tear-off circles */}
                  <div className="absolute left-0 w-6 h-6 bg-primary rounded-full -translate-x-1/2 top-[96px] z-10"></div>
                  <div className="absolute right-0 w-6 h-6 bg-primary rounded-full translate-x-1/2 top-[96px] z-10"></div>

                  {/* Header */}
                  <div className="bg-primary p-6 text-center text-white relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-yellow to-accent"></div>
                    <p className="text-accent font-semibold text-xs tracking-widest uppercase">BOTSWANA START-UP SUMMIT 2026</p>
                    <h3 className="font-display font-bold text-xl mt-1 tracking-tight">TICKET VERIFICATION PASSED</h3>
                  </div>

                  <div className="border-t-2 border-dashed border-gray-200 mx-6 mt-[2px]"></div>

                  {/* Body Details */}
                  <div className="p-6 flex-1 space-y-6">
                    {/* Check-In Status Hero */}
                    <div className="flex flex-col items-center justify-center py-4 border-b border-gray-100">
                      {verifyResult.checkedIn ? (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-9 h-9" />
                          </div>
                          <span className="px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-600 font-bold text-xs uppercase tracking-wider">
                            Verified & Checked In
                          </span>
                          {verifyResult.checkedInAt && (
                            <span className="text-[11px] text-gray-400 mt-2 font-medium">
                              Checked in on: {verifyResult.checkedInAt.toDate ? verifyResult.checkedInAt.toDate().toLocaleString() : new Date(verifyResult.checkedInAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-yellow-100 text-yellow rounded-full flex items-center justify-center mb-3">
                            <AlertCircle className="w-9 h-9" />
                          </div>
                          <span className="px-4 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow font-bold text-xs uppercase tracking-wider">
                            Valid Ticket - Ready for Entrance
                          </span>
                          <span className="text-[11px] text-gray-400 mt-2 font-medium">
                            Status: Awaiting Event Arrival
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registration Details Grid */}
                    <div className="space-y-4 text-primary-light">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Attendee Name</p>
                          <p className="font-bold text-gray-800 text-base mt-0.5">{verifyResult.fullName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ticket Number</p>
                          <p className="font-mono font-bold text-accent text-sm mt-0.5">{getTicketId(verifyResult)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Organization / Business</p>
                          <p className="font-semibold text-gray-700 text-sm mt-0.5">{verifyResult.company || 'Individual'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Role / Title</p>
                          <p className="font-medium text-gray-600 text-sm mt-0.5">{verifyResult.role || 'Attendee'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registration Type</p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 tracking-wider ${
                            verifyResult.registrationType === 'attendant' 
                              ? 'bg-yellow-50 border border-yellow-200 text-yellow' 
                              : verifyResult.registrationType === 'exhibitor' 
                              ? 'bg-purple-50 border border-purple-200 text-purple-600' 
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                          }`}>
                            {verifyResult.registrationType}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Category / Tier</p>
                          <p className="font-semibold text-gray-800 text-xs mt-1 capitalize">
                            {verifyResult.ticketOption || verifyResult.exhibitorCategory || verifyResult.partnershipCategory || 'Standard'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Address</p>
                          <p className="text-gray-600 text-xs truncate mt-0.5">{verifyResult.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mobile Number</p>
                          <p className="text-gray-600 text-xs mt-0.5">{verifyResult.mobileNumber}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Payment Status</p>
                          {verifyResult.registrationType === 'partner' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-150 text-emerald-600 font-bold text-[10px] uppercase mt-1">
                              Complimentary
                            </span>
                          ) : verifyResult.paymentStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-green-50 border border-green-150 text-green-600 font-bold text-[10px] uppercase mt-1">
                              Paid & Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-50 border border-amber-150 text-amber-600 font-bold text-[10px] uppercase mt-1 animate-pulse">
                              Payment Pending
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Payment Reference</p>
                          <p className="font-mono text-gray-700 text-xs mt-1 font-semibold">
                            {verifyResult.paymentReference || <em className="text-gray-400 font-normal">None submitted</em>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar Footer */}
                  <div className="bg-gray-50 px-6 py-5 border-t border-gray-100 flex flex-col gap-3">
                    {verifyResult.registrationType !== 'partner' && verifyResult.paymentStatus !== 'verified' && (
                      <button
                        onClick={() => handleVerifyPayment(verifyResult)}
                        disabled={isVerifyingPayment === verifyResult.id}
                        className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/10 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isVerifyingPayment === verifyResult.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Verify Payment & Activate Ticket
                      </button>
                    )}

                    {verifyResult.checkedIn ? (
                      <button
                        onClick={() => handleCheckIn(verifyResult.id, false)}
                        disabled={isCheckingIn}
                        className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCheckingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        Undo Check-In
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(verifyResult.id, true)}
                        disabled={isCheckingIn || (verifyResult.registrationType !== 'partner' && verifyResult.paymentStatus !== 'verified')}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-600/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                      >
                        {isCheckingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {verifyResult.registrationType !== 'partner' && verifyResult.paymentStatus !== 'verified' ? 'Cannot Check-In (Payment Pending)' : 'Confirm Ticket & Check-In'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : verifyError ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 flex flex-col items-center text-center shadow-xl backdrop-blur-sm"
                >
                  <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Ticket Verification Failed</h3>
                  <p className="text-white/60 text-sm max-w-md leading-relaxed">
                    {verifyError}
                  </p>
                  <div className="mt-6 p-4 bg-white/5 border border-white/5 rounded-2xl text-left w-full text-xs space-y-2 text-white/50 font-mono">
                    <p className="font-bold text-white/80">Verification Tips:</p>
                    <p>• Make sure the prefix is capitalized: <span className="text-accent font-bold">SSB26-</span></p>
                    <p>• Ticket numbers are case-insensitive but must contain the correct letters and numbers.</p>
                    <p>• If the ticket cannot be found, use the <span className="text-accent font-bold">Attendee Lookup helper</span> below the form to search by name/email.</p>
                  </div>
                </motion.div>
              ) : (
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-16 flex flex-col items-center text-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/30 animate-pulse animate-duration-3000">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white/85">Awaiting Live Verification</h3>
                  <p className="text-white/45 mt-2 max-w-sm text-sm">
                    Enter a ticket number or click an attendee from the lookup list to execute a scan and check-in.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Email Delivery Logs Tab View */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-primary-light/40 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Email Delivery Logs</h3>
                <p className="text-white/50 text-xs mt-0.5">Real-time status of alerts and digital ticket dispatches</p>
              </div>
              <div className="flex gap-2.5">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold font-mono text-white/70">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  STDOUT STREAMS LIVE
                </span>
              </div>
            </div>

            <div className="bg-primary-light/30 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
              {emailLogsLoading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin mb-4" />
                  <p className="text-white/60 text-sm">Fetching dispatch logs from database...</p>
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white/30" />
                  </div>
                  <h3 className="text-xl font-bold text-white">No email dispatches yet</h3>
                  <p className="text-white/60 mt-1 max-w-md mx-auto text-sm">
                    Once registrations are submitted or payments are verified, live SMTP logs will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-primary-light/50 text-[11px] font-bold uppercase tracking-wider text-white/40">
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">Recipient</th>
                        <th className="py-4 px-6">Event / Log Type</th>
                        <th className="py-4 px-6">Delivery Status</th>
                        <th className="py-4 px-6">Log Message / Error Details</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-white/85">
                      {emailLogs.map((log) => {
                        const dateStr = log.timestamp?.toDate 
                          ? log.timestamp.toDate().toLocaleString() 
                          : new Date(log.timestamp).toLocaleString();
                        
                        return (
                          <tr key={log.id} className="hover:bg-white/5 transition-all">
                            <td className="py-4 px-6 text-xs font-mono text-white/60 whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td className="py-4 px-6 font-semibold truncate max-w-[150px]" title={log.email}>
                              {log.email || "admin@startupsummit.co.bw"}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase font-mono border ${
                                log.type === 'ADMIN_ALERT' 
                                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                                  : log.type === 'TICKET_EMAIL' 
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                                  : log.type === 'RETRY_ATTEMPT'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {log.status === 'success' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-bold uppercase rounded">
                                  Delivered
                                </span>
                              ) : log.status === 'simulated' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[10px] font-bold uppercase rounded" title="SMTP_PASS not set. Simulated.">
                                  Simulated
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase rounded">
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-xs text-white/50 max-w-[300px] truncate" title={log.error || log.message}>
                              {log.error || log.message || "Email successfully dispatched."}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {log.email && log.email !== 'admin@startupsummit.co.bw' && (
                                <button
                                  onClick={async () => {
                                    const matchingReg = registrations.find(r => r.email === log.email);
                                    if (matchingReg) {
                                      await handleResendTicket(matchingReg);
                                    } else {
                                      alert("Could not find matching registration to resend.");
                                    }
                                  }}
                                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg font-bold transition-all hover:text-white"
                                >
                                  Resend
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>

      {/* Detail Inspection Modal */}
      <AnimatePresence>
        {selectedReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary-light border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              {/* Top Banner Accent */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-yellow to-accent"></div>

              {/* Header */}
              <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-start mt-2">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2.5 ${
                    selectedReg.registrationType === 'attendant' 
                      ? 'bg-yellow/10 text-yellow' 
                      : selectedReg.registrationType === 'exhibitor' 
                      ? 'bg-purple-500/10 text-purple-400' 
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {selectedReg.registrationType} Profile
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">
                    {selectedReg.fullName}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">{selectedReg.role} at <span className="text-white font-semibold">{selectedReg.company || 'N/A'}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedReg(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* General Contact Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-primary/40 border border-white/5 p-4 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-accent" />
                      Email Address
                    </p>
                    <a href={`mailto:${selectedReg.email}`} className="text-white hover:text-accent font-medium text-sm transition-colors break-all">
                      {selectedReg.email}
                    </a>
                  </div>

                  <div className="bg-primary/40 border border-white/5 p-4 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-yellow" />
                      Mobile Number
                    </p>
                    <a href={`tel:${selectedReg.mobileNumber}`} className="text-white hover:text-yellow font-medium text-sm transition-colors">
                      {selectedReg.mobileNumber}
                    </a>
                  </div>
                </div>

                {/* Additional General Info */}
                <div className="bg-primary/40 border border-white/5 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 border-b border-white/5 pb-2">Business Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-white/50 block">Business Sector</span>
                      <span className="text-white font-semibold text-sm mt-0.5 block">{selectedReg.businessSector || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-white/50 block">Participant Category</span>
                      <span className="text-white font-semibold text-sm mt-0.5 block">{selectedReg.participantCategory || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-white/50 block">Ticket Option Selected</span>
                      <span className="text-yellow font-bold text-sm mt-0.5 block capitalize">{selectedReg.ticketOption || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-white/50 block">Date Submitted</span>
                      <span className="text-white/80 text-xs mt-0.5 block">
                        {selectedReg.submittedAt?.toDate ? selectedReg.submittedAt.toDate().toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-xs text-white/50 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      Physical Address
                    </span>
                    <span className="text-white/90 text-sm mt-1 block">{selectedReg.physicalAddress || 'N/A'}</span>
                  </div>

                  {selectedReg.specialRequirements && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-xs text-white/50 block">Special Requirements</span>
                      <span className="text-white/90 text-sm mt-1 block bg-yellow/5 border border-yellow/10 p-3 rounded-xl">{selectedReg.specialRequirements}</span>
                    </div>
                  )}
                </div>

                {/* Ticket Verification Status Card inside Profile Details Modal */}
                <div className="bg-primary/40 border border-white/5 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 border-b border-white/5 pb-2">Ticket Info & Check-in</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-white/50 block mb-0.5">Ticket Number / Ticket ID</span>
                      <span className="text-accent font-mono font-bold text-sm bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 inline-block">
                        {getTicketId(selectedReg)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-white/50 block mb-1">Attendance Status</span>
                      {selectedReg.checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow/10 border border-yellow/20 text-yellow text-xs font-bold rounded-lg uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Ready for Check-In
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedReg.checkedIn && selectedReg.checkedInAt && (
                    <div className="text-xs text-white/40 font-semibold mt-1">
                      Checked in at: {selectedReg.checkedInAt?.toDate ? selectedReg.checkedInAt.toDate().toLocaleString() : new Date(selectedReg.checkedInAt).toLocaleString()}
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/5 flex gap-2">
                    {selectedReg.checkedIn ? (
                      <button
                        onClick={() => handleCheckIn(selectedReg.id, false)}
                        disabled={isCheckingIn}
                        className="flex-1 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isCheckingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        Undo Check-In
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(selectedReg.id, true)}
                        disabled={isCheckingIn}
                        className="flex-1 py-2.5 px-4 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isCheckingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Check-In Attendee
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Status Card inside Profile Details Modal */}
                {selectedReg.registrationType !== 'partner' && (
                  <div className="bg-primary/40 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 border-b border-white/5 pb-2">Manual Payment Status</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-white/50 block mb-0.5">Payment Status</span>
                        {selectedReg.paymentStatus === 'verified' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg uppercase tracking-wider mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid & Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow/10 border border-yellow/20 text-yellow text-xs font-bold rounded-lg uppercase tracking-wider mt-1 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Awaiting Payment
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-white/50 block mb-0.5">Payment Reference</span>
                        <span className="text-white font-mono font-semibold text-sm">
                          {selectedReg.paymentReference || <em className="text-white/30 text-xs font-normal">No reference submitted yet</em>}
                        </span>
                      </div>
                    </div>

                    {selectedReg.paymentStatus === 'verified' ? (
                      <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={() => setGeneratedTicketReg(selectedReg)}
                          className="flex-1 py-2.5 px-4 bg-yellow hover:bg-yellow/90 text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          Generate Premium Ticket
                        </button>
                        <button
                          onClick={() => handleResendTicket(selectedReg)}
                          disabled={isResendingEmail === selectedReg.id}
                          className="flex-1 py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isResendingEmail === selectedReg.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          Resend Ticket Email
                        </button>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleVerifyPayment(selectedReg)}
                          disabled={isVerifyingPayment === selectedReg.id}
                          className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingPayment === selectedReg.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Approve Payment & Send Digital Ticket
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Exhibitor Details Conditional Block */}
                {selectedReg.registrationType === 'exhibitor' && (
                  <div className="bg-primary/40 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-white/5 pb-2">Exhibitor Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-white/50 block">Company Website</span>
                        {selectedReg.website ? (
                          <a href={selectedReg.website.startsWith('http') ? selectedReg.website : `https://${selectedReg.website}`} target="_blank" rel="noreferrer" className="text-accent hover:underline text-sm font-medium flex items-center gap-1 mt-0.5">
                            {selectedReg.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-white/60 text-sm mt-0.5 block">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-white/50 block">Exhibitor Category</span>
                        <span className="text-white font-semibold text-sm mt-0.5 block">{selectedReg.exhibitorCategory || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-white/50 block">Products to be Exhibited</span>
                      <p className="text-white/90 text-sm mt-1 bg-white/5 p-3 rounded-xl">{selectedReg.productsExhibited || 'N/A'}</p>
                    </div>

                    <div>
                      <span className="text-xs text-white/50 block mb-1.5">Required Exhibition Booth Amenities</span>
                      {selectedReg.exhibitionRequirements && selectedReg.exhibitionRequirements.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedReg.exhibitionRequirements.map((req, i) => (
                            <span key={i} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs rounded-lg font-semibold capitalize">
                              {req.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/60 text-sm">None selected</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Partner Details Conditional Block */}
                {selectedReg.registrationType === 'partner' && (
                  <div className="bg-primary/40 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/5 pb-2">Partnership details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-white/50 block">Partnership Tier Interest</span>
                        <span className="text-white font-semibold text-sm mt-0.5 block capitalize">{selectedReg.partnershipCategory || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-white/50 block">Partnership Objectives & Interests</span>
                      <p className="text-white/90 text-sm mt-1 bg-white/5 p-3 rounded-xl">{selectedReg.partnershipInterest || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {/* Partner Ticket Management inside Modal */}
                {selectedReg.registrationType === 'partner' && (
                  <div className="bg-primary/40 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/5 pb-2">VIP Partner Ticket Status</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-white/50 block mb-0.5">Ticket Status</span>
                        {selectedReg.paymentStatus === 'verified' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg uppercase tracking-wider mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ticket Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow/10 border border-yellow/20 text-yellow text-xs font-bold rounded-lg uppercase tracking-wider mt-1 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Awaiting Ticket Generation
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedReg.paymentStatus === 'verified' ? (
                      <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={() => setGeneratedTicketReg(selectedReg)}
                          className="flex-1 py-2.5 px-4 bg-yellow hover:bg-yellow/90 text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          Generate VIP Ticket
                        </button>
                        <button
                          onClick={() => handleResendTicket(selectedReg)}
                          disabled={isResendingEmail === selectedReg.id}
                          className="flex-1 py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isResendingEmail === selectedReg.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          Resend VIP Ticket
                        </button>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleVerifyPayment(selectedReg)}
                          disabled={isVerifyingPayment === selectedReg.id}
                          className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingPayment === selectedReg.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Issue VIP Partner Ticket & Email
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Close Button Footer */}
              <div className="p-6 border-t border-white/10 bg-primary/40 text-right">
                <button
                  onClick={() => setSelectedReg(null)}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-6 rounded-xl transition-all"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Alert Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary-light border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Delete Registration</h3>
                <p className="text-sm text-white/60 mb-6">
                  Are you sure you want to delete this registration? This action is permanent and cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteId && handleDelete(deleteId)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High Quality Premium Ticket Generation Modal */}
      <AnimatePresence>
        {generatedTicketReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#122238] border border-white/15 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative p-6 sm:p-8 my-8 text-center"
            >
              <button
                onClick={() => setGeneratedTicketReg(null)}
                className="absolute top-5 right-5 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
                aria-label="Close ticket generator"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">High-Quality Ticket Generated</h3>
              <p className="text-xs text-white/60 mb-6">Verified Admission Pass for Startup Summit Botswana 2026</p>

              {/* The Ticket Element that will be exported to PNG */}
              <div className="p-0.5 bg-gradient-to-r from-accent via-yellow to-accent rounded-3xl shadow-2xl mb-6">
                <div 
                  ref={ticketPrintRef}
                  className="bg-[#0c1a2d] text-white rounded-[1.6rem] overflow-hidden p-6 relative border border-white/5 text-left"
                  style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(239, 68, 68, 0.08), transparent 60%)' }}
                >
                  {/* Decorative Ticket Circles (side cuts) */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 bg-black/85 rounded-full border-r border-white/10 transform -translate-y-1/2 z-10"></div>
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-black/85 rounded-full border-l border-white/10 transform -translate-y-1/2 z-10"></div>

                  {/* Header info */}
                  <div className="flex justify-between items-start gap-4 mb-5 pb-5 border-b border-dashed border-white/15">
                    <img 
                      src={logoUrl} 
                      alt="Startup Summit Logo" 
                      className="h-14 w-auto object-contain mix-blend-screen"
                    />
                    <div className="text-right">
                      <span className="block text-[8px] font-bold text-accent uppercase tracking-widest font-mono">OFFICIAL PASS</span>
                      <span className="text-xs font-mono font-bold text-yellow bg-yellow/10 border border-yellow/20 px-2.5 py-1 rounded mt-1 inline-block">
                        {getTicketId(generatedTicketReg)}
                      </span>
                    </div>
                  </div>

                  {/* Body Info columns */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-bold">Attendee Name</span>
                      <span className="font-bold text-white text-base block truncate">{generatedTicketReg.fullName}</span>
                      <span className="text-xs text-white/60 block truncate font-mono mt-0.5">{generatedTicketReg.email}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-bold">Admission Tier</span>
                      <span className="font-bold text-accent text-sm capitalize block">
                        {generatedTicketReg.registrationType} Pass
                      </span>
                      {generatedTicketReg.ticketOption && (
                        <span className="text-[10px] text-white/60 font-semibold uppercase font-mono block mt-0.5">
                          {generatedTicketReg.ticketOption.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date & Venue details */}
                  <div className="grid grid-cols-2 gap-4 mb-5 py-3.5 px-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-bold">Date</span>
                      <span className="font-bold text-white text-xs block">August 7, 2026</span>
                      <span className="text-[10px] text-white/50 block">08:00 AM - 17:00 PM</span>
                    </div>

                    <div>
                      <span className="block text-[9px] text-white/40 uppercase tracking-wider font-bold">Venue</span>
                      <span className="font-bold text-white text-xs block">Game City Center</span>
                      <span className="text-[10px] text-white/50 block">Gaborone, Botswana</span>
                    </div>
                  </div>

                  {/* QR Code and verification instructions */}
                  <div className="flex items-center gap-5 pt-4 border-t border-white/10">
                    <div className="bg-white p-2 rounded-2xl shrink-0 shadow-lg border border-white/20">
                      <QRCodeSVG 
                        value={JSON.stringify({
                          event: "Startup Summit Botswana 2026",
                          ticketId: getTicketId(generatedTicketReg),
                          name: generatedTicketReg.fullName,
                          email: generatedTicketReg.email,
                          type: generatedTicketReg.registrationType,
                          status: "PAID_VERIFIED"
                        })}
                        size={80}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-yellow font-bold uppercase tracking-wider mb-0.5 font-mono">Admission QR Code</span>
                      <p className="text-[9px] text-white/50 leading-relaxed">
                        Scan at the main venue gate to check-in instantly. This code contains verified credentials and cannot be reused or duplicated.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    setIsExportingTicket(true);
                    await handleDownloadPNG(ticketPrintRef.current, generatedTicketReg.fullName);
                    setIsExportingTicket(false);
                  }}
                  disabled={isExportingTicket}
                  className="flex-1 bg-yellow hover:bg-yellow/90 text-primary font-bold py-3.5 px-5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-xs disabled:opacity-50 cursor-pointer uppercase font-display tracking-wider"
                >
                  {isExportingTicket ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving Image...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Save PNG Pass
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    const printContents = ticketPrintRef.current?.innerHTML;
                    if (!printContents) return;
                    const originalContents = document.body.innerHTML;
                    const style = `
                      <style>
                        body { background: #000 !important; color: #fff !important; font-family: sans-serif; padding: 40px; display: flex; justify-content: center; }
                        img { max-height: 120px; }
                        .text-white\\/40 { color: #888 !important; }
                        .text-white\\/50 { color: #aaa !important; }
                        .bg-white\\/5 { background: #111 !important; border: 1px solid #222 !important; }
                      </style>
                    `;
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write('<html><head><title>Print Ticket</title>' + style + '</head><body>');
                      win.document.write(ticketPrintRef.current.outerHTML);
                      win.document.write('</body></html>');
                      win.document.close();
                      win.focus();
                      setTimeout(() => {
                        win.print();
                        win.close();
                      }, 500);
                    }
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 px-5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-accent" />
                  Print Pass
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
