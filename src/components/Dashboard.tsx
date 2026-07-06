import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Briefcase, Award, Search, Filter, Download, Trash2, 
  ExternalLink, Calendar, MapPin, Mail, Phone, ChevronRight, X,
  ArrowLeft, RefreshCw, Layers, CheckCircle2, AlertTriangle, Play, LogOut
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, getDocs, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
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
                            <span className="font-bold text-white group-hover:text-accent transition-colors">
                              {reg.fullName}
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
                        <td className="py-4 px-6 text-sm text-white/60">
                          {formattedDate}
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
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

    </div>
  );
}
