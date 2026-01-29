
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Building2,
  MapPin,
  ChevronRight,
  X,
  Save,
  Trash2,
  Filter,
  ArrowRight,
  DollarSign,
  ClipboardCheck,
  Bell,
  FileText,
  Phone,
  Truck,
  CreditCard,
  Paperclip,
  ListChecks,
  Users2
} from 'lucide-react';
import { Customer, Visit, VisitStatus, User as AppUser } from '../types';
import { dateUtils } from '../services/dateUtils';

interface VisitPlanViewProps {
  customers: Customer[];
  visits: Visit[];
  setVisits: React.Dispatch<React.SetStateAction<Visit[]>>;
  currentUser: AppUser;
}

export const VisitPlanView: React.FC<VisitPlanViewProps> = ({ customers, visits, setVisits, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const [activeTab, setActiveTab] = useState('general');

  // Form State
  const [newVisit, setNewVisit] = useState({
    customerId: '',
    date: dateUtils.getISTIsoDate(),
    purpose: '',
    assignedTo: '',
    notes: '',
    location: '',
    expenseAmount: '',
    expenseNote: '',
    visitResult: '',
    nextFollowUpDate: '',
    reminderEnabled: false,

    // Transport
    transportMode: 'Bike',
    vehicleNo: '',
    startLocation: '',
    endLocation: '',
    distance: '',

    // Commercial
    paymentMode: 'Cash',
    expectedAmount: '',
    paymentStatus: 'Not Discussed' as any,
    expectedPaymentDate: '',

    // Call Logs
    callLogs: [] as any[],

    // Phase 2 Fields
    metContacts: [] as any[],
    checklist: {
      quotation: false,
      samples: false,
      pricing: false,
      technical: false
    } as any,
    attachments: [] as any[]
  });

  // Pre-fill personnel when opening the modal
  useEffect(() => {
    if (showAddModal) {
      setNewVisit(prev => ({
        ...prev,
        assignedTo: currentUser.name,
        date: dateUtils.getISTIsoDate()
      }));
    }
  }, [showAddModal, currentUser]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const matchesSearch = v.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: visits.length,
      upcoming: visits.filter(v => v.status === VisitStatus.PLANNED && new Date(v.date) >= today).length,
      completed: visits.filter(v => v.status === VisitStatus.COMPLETED).length,
      cancelled: visits.filter(v => v.status === VisitStatus.CANCELLED).length
    };
  }, [visits]);

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === newVisit.customerId);
    if (!customer) return;

    const visit: Visit = {
      id: `v-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      date: newVisit.date,
      purpose: newVisit.purpose,
      assignedTo: newVisit.assignedTo,
      status: VisitStatus.PLANNED,
      notes: newVisit.notes,
      location: newVisit.location,
      expenseAmount: newVisit.expenseAmount ? parseFloat(newVisit.expenseAmount) : undefined,
      expenseNote: newVisit.expenseNote,
      visitResult: newVisit.visitResult,
      nextFollowUpDate: newVisit.nextFollowUpDate,
      reminderEnabled: newVisit.reminderEnabled,

      transportMode: newVisit.transportMode,
      vehicleNo: newVisit.vehicleNo,
      startLocation: newVisit.startLocation,
      endLocation: newVisit.endLocation,
      distance: newVisit.distance ? parseFloat(newVisit.distance) : undefined,

      paymentMode: newVisit.paymentMode,
      expectedAmount: newVisit.expectedAmount ? parseFloat(newVisit.expectedAmount) : undefined,
      paymentStatus: newVisit.paymentStatus,
      expectedPaymentDate: newVisit.expectedPaymentDate,
      callLogs: newVisit.callLogs,
      metContacts: newVisit.metContacts,
      checklist: newVisit.checklist,
      attachments: newVisit.attachments
    };


    setVisits(prev => [visit, ...prev]);
    setShowAddModal(false);
    setNewVisit({
      customerId: '',
      date: dateUtils.getISTIsoDate(),
      purpose: '',
      assignedTo: '',
      notes: '',
      location: '',
      expenseAmount: '',
      expenseNote: '',
      visitResult: '',
      nextFollowUpDate: '',
      reminderEnabled: false,
      transportMode: 'Bike',
      vehicleNo: '',
      startLocation: '',
      endLocation: '',
      distance: '',
      paymentMode: 'Cash',
      expectedAmount: '',
      paymentStatus: 'Not Discussed',
      expectedPaymentDate: '',
      callLogs: [],
      metContacts: [],
      checklist: { quotation: false, samples: false, pricing: false, technical: false },
      attachments: []
    });
    setActiveTab('general');
  };

  const updateVisitStatus = (id: string, status: VisitStatus) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    if (selectedVisit?.id === id) {
      setSelectedVisit(prev => prev ? { ...prev, status } : null);
    }
  };

  const deleteVisit = (id: string) => {
    if (window.confirm("Remove this visit record?")) {
      setVisits(prev => prev.filter(v => v.id !== id));
      setSelectedVisit(null);
    }
  };

  const getStatusColor = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.PLANNED: return 'bg-amber-100 text-amber-700 border-amber-200';
      case VisitStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case VisitStatus.CANCELLED: return 'bg-rose-100 text-rose-700 border-rose-200';
      case VisitStatus.RESCHEDULED: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Visit Management</h2>
          <p className="text-slate-500 text-lg">Logged in as: <span className="text-blue-600 font-black">{currentUser.name}</span></p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 text-sm font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" /> Log Customer Visit
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem label="Total Visits" value={stats.total} icon={Calendar} color="blue" />
        <StatItem label="Upcoming" value={stats.upcoming} icon={Clock} color="amber" />
        <StatItem label="Completed" value={stats.completed} icon={CheckCircle2} color="emerald" />
        <StatItem label="Cancelled" value={stats.cancelled} icon={XCircle} color="rose" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className={selectedVisit ? 'xl:col-span-8' : 'xl:col-span-12'}>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header / Filters */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search visits..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Filter Status:</span>
                <select
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="All">All Statuses</option>
                  {Object.values(VisitStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 py-4">Client Hub</th>
                    <th className="px-6 py-4">Visit Date</th>
                    <th className="px-6 py-4">Strategy / Purpose</th>
                    <th className="px-6 py-4">Personnel</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVisits.map(visit => (
                    <tr
                      key={visit.id}
                      onClick={() => setSelectedVisit(visit)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${selectedVisit?.id === visit.id ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm ${visit.assignedTo === currentUser.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {visit.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{visit.customerName}</p>
                            {visit.assignedTo === currentUser.name && <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest">My Record</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-700 font-bold">{visit.date}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs text-slate-500 font-medium line-clamp-1">{visit.purpose}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <UserIcon size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{visit.assignedTo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${getStatusColor(visit.status)}`}>
                          {visit.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </td>
                    </tr>
                  ))}
                  {filteredVisits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <Calendar size={48} className="mb-4" />
                          <p className="font-bold">No visit records matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar for Details */}
        {selectedVisit && (
          <div className="xl:col-span-4 animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 bg-slate-900 text-white relative">
                <button onClick={() => setSelectedVisit(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <div className="flex items-center space-x-5 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-black uppercase shadow-xl ring-4 ring-white/10">
                    {selectedVisit.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight">{selectedVisit.customerName}</h3>
                    <div className={`mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 ${getStatusColor(selectedVisit.status)} bg-opacity-20`}>
                      {selectedVisit.status}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Visit Date</p>
                    <p className="text-sm font-bold">{selectedVisit.date}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Personnel</p>
                    <p className="text-sm font-bold">{selectedVisit.assignedTo}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Visit Purpose & Notes</h4>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-900 mb-2">{selectedVisit.purpose}</p>
                    <p className="text-xs text-slate-500 leading-relaxed italic">{selectedVisit.notes || 'No additional notes provided.'}</p>
                  </div>
                </div>

                {/* Additional Details Grid */}
                {(selectedVisit.location || selectedVisit.expenseAmount || selectedVisit.visitResult || selectedVisit.nextFollowUpDate) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedVisit.location && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{selectedVisit.location}</p>
                      </div>
                    )}
                    {selectedVisit.expenseAmount !== undefined && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign size={14} className="text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">₹{selectedVisit.expenseAmount.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedVisit.visitResult && (
                      <div className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center space-x-2 mb-1">
                          <ClipboardCheck size={14} className="text-indigo-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outcome / Result</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{selectedVisit.visitResult}</p>
                      </div>
                    )}
                    {selectedVisit.nextFollowUpDate && (
                      <div className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center space-x-2 mb-1">
                          <Bell size={14} className="text-amber-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Follow-Up</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-700">{selectedVisit.nextFollowUpDate}</p>
                          {selectedVisit.reminderEnabled && (
                            <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold uppercase">Reminder Active</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Visit Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <StatusButton
                      label="Mark Completed"
                      onClick={() => updateVisitStatus(selectedVisit.id, VisitStatus.COMPLETED)}
                      active={selectedVisit.status === VisitStatus.COMPLETED}
                      color="emerald"
                    />
                    <StatusButton
                      label="Reschedule"
                      onClick={() => updateVisitStatus(selectedVisit.id, VisitStatus.RESCHEDULED)}
                      active={selectedVisit.status === VisitStatus.RESCHEDULED}
                      color="blue"
                    />
                    <StatusButton
                      label="Cancel Visit"
                      onClick={() => updateVisitStatus(selectedVisit.id, VisitStatus.CANCELLED)}
                      active={selectedVisit.status === VisitStatus.CANCELLED}
                      color="rose"
                    />
                    <StatusButton
                      label="Set Planned"
                      onClick={() => updateVisitStatus(selectedVisit.id, VisitStatus.PLANNED)}
                      active={selectedVisit.status === VisitStatus.PLANNED}
                      color="amber"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                  <button onClick={() => deleteVisit(selectedVisit.id)} className="flex items-center text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-700">
                    <Trash2 size={16} className="mr-2" /> Delete Record
                  </button>
                  <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                    Email Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleAddVisit}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl">
                    <Navigation2Icon size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Record Visit</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Strategic Market Deployment</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-transform hover:rotate-90">
                  <X size={28} />
                </button>
              </div>

              {/* Tabs Integration */}
              <div className="flex items-center px-8 border-b border-slate-100 overflow-x-auto hide-scrollbar">
                {/* Tab Buttons Helper */}
                {[
                  { id: 'general', icon: Calendar, label: 'General Info' },
                  { id: 'location', icon: MapPin, label: 'Location' },
                  { id: 'calling', icon: Phone, label: 'Client Calling' },
                  { id: 'contacts', icon: Users2, label: 'Contact Persons' },
                  { id: 'checklist', icon: ListChecks, label: 'Checklist' },
                  { id: 'transport', icon: Truck, label: 'Transport' },
                  { id: 'expense', icon: DollarSign, label: 'Expenses' },
                  { id: 'attachments', icon: Paperclip, label: 'Attachments' },
                  { id: 'commercial', icon: CreditCard, label: 'Commercial' },
                  { id: 'result', icon: ClipboardCheck, label: 'Result & Outcome' },
                  { id: 'followup', icon: Bell, label: 'Next Follow-up' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                      } ${tab.id === 'result' && newVisit.paymentStatus !== 'Received' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  // Note: User asked to unlock result ONLY on completion phases. For now valid status logic is complex in form, keeping enabled but visually flagging? 
                  // Actually request was "Result tab unlocks only on completion". BUT this is the CREATE form. 
                  // Usually you plan a visit (Status: Planned) -> Then execute -> Then add result (Status: Completed).
                  // So if Status is 'Planned', maybe Result should be disabled?
                  // Let's implement that logic via tab click handler instead of here or just disable button.
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar min-h-[400px]">

                {/* General Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Selection*</label>
                      <select
                        required
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newVisit.customerId}
                        onChange={e => setNewVisit({ ...newVisit, customerId: e.target.value })}
                      >
                        <option value="">-- Choose Customer --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visit Date*</label>
                        <input
                          required
                          type="date"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.date}
                          onChange={e => setNewVisit({ ...newVisit, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Personnel</label>
                        <input
                          type="text"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none bg-blue-50/30 border-blue-100"
                          placeholder="e.g. Salil Anand"
                          value={newVisit.assignedTo}
                          onChange={e => setNewVisit({ ...newVisit, assignedTo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Strategy/Purpose*</label>
                      <input
                        required
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="e.g. Semi-annual contract review"
                        value={newVisit.purpose}
                        onChange={e => setNewVisit({ ...newVisit, purpose: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Location Tab */}
                {activeTab === 'location' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visit Location</label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="e.g. Client HQ, Factory Site, or Coffee Shop"
                          value={newVisit.location}
                          onChange={e => setNewVisit({ ...newVisit, location: e.target.value })}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 pl-1">Leave blank if executed at client registered address.</p>
                    </div>
                  </div>
                )}

                {/* Expense Tab */}
                {activeTab === 'expense' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Amount (INR)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">₹</span>
                          <input
                            type="number"
                            className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="0.00"
                            value={newVisit.expenseAmount}
                            onChange={e => setNewVisit({ ...newVisit, expenseAmount: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Details / Justification</label>
                      <textarea
                        rows={3}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none resize-none"
                        placeholder="Lunch, Travel tickets, etc..."
                        value={newVisit.expenseNote}
                        onChange={e => setNewVisit({ ...newVisit, expenseNote: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Result Tab */}
                {activeTab === 'result' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visit Outcome / Key Result</label>
                      <input
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/10"
                        placeholder="e.g. Order Confirmed, Demo Scheduled, etc."
                        value={newVisit.visitResult}
                        onChange={e => setNewVisit({ ...newVisit, visitResult: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Discussion Notes</label>
                      <textarea
                        rows={6}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none resize-none"
                        placeholder="Provide full details of the meeting..."
                        value={newVisit.notes}
                        onChange={e => setNewVisit({ ...newVisit, notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Follow-up Tab */}
                {activeTab === 'followup' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Follow-Up Date</label>
                        <input
                          type="date"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.nextFollowUpDate}
                          onChange={e => setNewVisit({ ...newVisit, nextFollowUpDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <input
                        type="checkbox"
                        id="reminderCheck"
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={newVisit.reminderEnabled}
                        onChange={e => setNewVisit({ ...newVisit, reminderEnabled: e.target.checked })}
                      />
                      <label htmlFor="reminderCheck" className="text-sm font-bold text-amber-900 cursor-pointer select-none">
                        Enable Reminder Notification
                      </label>
                    </div>
                    <p className="text-xs text-slate-400 italic">
                      * The system will alert you 24 hours before the follow-up date.
                    </p>
                  </div>
                )}

                {/* Client Calling Tab */}
                {activeTab === 'calling' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-900">Call Schedule</h4>
                      <button
                        type="button"
                        onClick={() => setNewVisit({
                          ...newVisit,
                          callLogs: [
                            ...newVisit.callLogs,
                            {
                              id: Date.now().toString(),
                              type: 'Pre-Visit',
                              date: dateUtils.getISTIsoDate(),
                              contactPerson: '',
                              purpose: '',
                              completed: false
                            }
                          ]
                        })}
                        className="text-xs text-blue-600 font-bold flex items-center hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Plus size={14} className="mr-1" /> Add Call
                      </button>
                    </div>

                    <div className="space-y-4">
                      {newVisit.callLogs.length === 0 && (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Phone size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-400">No calls scheduled yet.</p>
                        </div>
                      )}
                      {newVisit.callLogs.map((call, idx) => (
                        <div key={call.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group">
                          <button
                            type="button"
                            onClick={() => {
                              const logs = [...newVisit.callLogs];
                              logs.splice(idx, 1);
                              setNewVisit({ ...newVisit, callLogs: logs });
                            }}
                            className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle size={18} />
                          </button>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                              <select
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                value={call.type}
                                onChange={(e) => {
                                  const logs = [...newVisit.callLogs];
                                  logs[idx].type = e.target.value as any;
                                  setNewVisit({ ...newVisit, callLogs: logs });
                                }}
                              >
                                <option value="Pre-Visit">Pre-Visit</option>
                                <option value="Post-Visit">Post-Visit</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                              <input
                                type="date"
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                value={call.date}
                                onChange={(e) => {
                                  const logs = [...newVisit.callLogs];
                                  logs[idx].date = e.target.value;
                                  setNewVisit({ ...newVisit, callLogs: logs });
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
                              <input
                                type="text"
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                placeholder="Name..."
                                value={call.contactPerson}
                                onChange={(e) => {
                                  const logs = [...newVisit.callLogs];
                                  logs[idx].contactPerson = e.target.value;
                                  setNewVisit({ ...newVisit, callLogs: logs });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose</label>
                              <select
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                value={call.purpose}
                                onChange={(e) => {
                                  const logs = [...newVisit.callLogs];
                                  logs[idx].purpose = e.target.value;
                                  setNewVisit({ ...newVisit, callLogs: logs });
                                }}
                              >
                                <option value="">Select Purpose</option>
                                <option value="Appointment">Appointment</option>
                                <option value="Confirmation">Confirmation</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Feedback">Feedback</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <textarea
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none"
                              placeholder="Brief call notes..."
                              rows={2}
                              value={call.notes || ''}
                              onChange={(e) => {
                                const logs = [...newVisit.callLogs];
                                logs[idx].notes = e.target.value;
                                setNewVisit({ ...newVisit, callLogs: logs });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transport Tab */}
                {activeTab === 'transport' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transport Mode</label>
                        <select
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.transportMode}
                          onChange={e => setNewVisit({ ...newVisit, transportMode: e.target.value })}
                        >
                          {['Bike', 'Car', 'Cab', 'Train', 'Flight', 'Bus'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle No. (Opt)</label>
                        <input
                          type="text"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.vehicleNo}
                          onChange={e => setNewVisit({ ...newVisit, vehicleNo: e.target.value })}
                          placeholder="XX-00-XX-0000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Location</label>
                        <input
                          type="text"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.startLocation}
                          onChange={e => setNewVisit({ ...newVisit, startLocation: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Location</label>
                        <input
                          type="text"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.endLocation}
                          onChange={e => setNewVisit({ ...newVisit, endLocation: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Distance (Km)</label>
                      <input
                        type="number"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        value={newVisit.distance}
                        onChange={e => setNewVisit({ ...newVisit, distance: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Commercial Tab */}
                {activeTab === 'commercial' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Status</label>
                        <select
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.paymentStatus}
                          onChange={e => setNewVisit({ ...newVisit, paymentStatus: e.target.value as any })}
                        >
                          <option value="Not Discussed">Not Discussed</option>
                          <option value="Pending">Pending</option>
                          <option value="Received">Received</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Date</label>
                        <input
                          type="date"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.expectedPaymentDate}
                          onChange={e => setNewVisit({ ...newVisit, expectedPaymentDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Amount (INR)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                          <input
                            type="number"
                            className="w-full pl-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                            value={newVisit.expectedAmount}
                            onChange={e => setNewVisit({ ...newVisit, expectedAmount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
                        <select
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          value={newVisit.paymentMode}
                          onChange={e => setNewVisit({ ...newVisit, paymentMode: e.target.value })}
                        >
                          {['Cash', 'UPI', 'Bank', 'Credit', 'Other'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <div className="flex space-x-2">
                  {/* Step Navigation Dots for visual flair */}
                  {['general', 'location', 'calling', 'contacts', 'checklist', 'transport', 'expense', 'attachments', 'commercial', 'result', 'followup'].map((step, idx) => (
                    <div key={step} className={`w-2 h-2 rounded-full transition-colors ${activeTab === step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  ))}
                </div>

                <div className="flex items-center space-x-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Discard</button>
                  <button type="submit" className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center active:scale-95">
                    <Save size={18} className="mr-3" /> Commit Visit Record
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Navigation2Icon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const StatItem: React.FC<{ label: string; value: number; icon: React.ElementType; color: 'blue' | 'emerald' | 'rose' | 'amber' }> = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4`}>
      <div className={`p-3 rounded-xl ${colorMap[color]} shadow-inner`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
};

const StatusButton: React.FC<{ label: string; onClick: () => void; active: boolean; color: 'emerald' | 'blue' | 'rose' | 'amber' }> = ({ label, onClick, active, color }) => {
  const activeStyles = {
    emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200',
    blue: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200',
    rose: 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200',
    amber: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-200'
  }[color];

  const hoverStyles = {
    emerald: 'hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50',
    blue: 'hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50',
    rose: 'hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50',
    amber: 'hover:border-amber-600 hover:text-amber-600 hover:bg-amber-50'
  }[color];

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${active ? activeStyles : `bg-white border-slate-200 text-slate-400 ${hoverStyles}`}`}
    >
      {label}
    </button>
  );
};
