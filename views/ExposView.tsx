
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Globe,
  ExternalLink,
  RefreshCw,
  Plus,
  Sparkles,
  CheckCircle2,
  Bell,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  X,
  Zap,
  BellRing,
  Save,
  ChevronRight,
  Upload,
  Loader2,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Expo } from '../types';
import { ExcelImporter } from '../components/ExcelImporter';
import { api } from '../services/api';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'alert';
}

interface ExposViewProps {
  expos: Expo[];
  setExpos: React.Dispatch<React.SetStateAction<Expo[]>>;
}

export const ExposView: React.FC<ExposViewProps> = ({ expos, setExpos }) => {
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<string[]>(() => {
    const saved = localStorage.getItem('enging_expo_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [showImport, setShowImport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingExpo, setEditingExpo] = useState<Expo | null>(null);

  // New Expo Form State
  const [newExpo, setNewExpo] = useState<Partial<Expo>>({
    name: '',
    date: '',
    location: '',
    industry: 'Mechanical',
    region: 'India',
    link: '',
    eventType: 'Expo / Trade Fair',
    organizerName: '',
    website: '',
    startDate: '',
    endDate: '',
    city: '',
    state: '',
    venue: '',
    zone: 'North',
    participationType: 'Visitor',
    stallNo: '',
    boothSize: '',
    feeCost: 0,
    registrationStatus: 'Applied',
    assignedTeam: '',
    visitPlan: '',
    transportMode: '',
    hotelDetails: '',
    budget: 0,
    status: 'upcoming',
    leadsGenerated: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    ordersReceived: 0,
    pipeLineInquiries: 0,
    newContacts: 0,
    brochureLink: '',
    entryPassLink: '',
    stallLayoutLink: '',
    photosLink: '',
    visitorListLink: ''
  });

  const [formTab, setFormTab] = useState<'basic' | 'location' | 'participation' | 'planning' | 'outcomes' | 'documents'>('basic');

  useEffect(() => {
    localStorage.setItem('enging_expo_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addNotification = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const toggleReminder = (expo: Expo) => {
    const isAdding = !reminders.includes(expo.id);
    setReminders(prev => isAdding ? [...prev, expo.id] : prev.filter(x => x !== expo.id));
    if (isAdding) {
      addNotification(`Alert set for ${expo.name}! You will be notified closer to ${expo.date}.`, 'success');
    }
  };

  const handleEdit = (expo: Expo) => {
    setEditingExpo(expo);
    setNewExpo({
      ...expo,
      // Ensure numeric fields are numbers
      feeCost: expo.feeCost || 0,
      budget: expo.budget || 0,
      leadsGenerated: expo.leadsGenerated || 0,
      hotLeads: expo.hotLeads || 0,
      warmLeads: expo.warmLeads || 0,
      coldLeads: expo.coldLeads || 0,
      ordersReceived: expo.ordersReceived || 0,
      pipeLineInquiries: expo.pipeLineInquiries || 0,
      newContacts: expo.newContacts || 0,
    });
    setFormTab('basic');
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      await api.expos.delete(id);
      setExpos(prev => prev.filter(e => e.id !== id));
      addNotification("Event deleted successfully.", "success");
    } catch (err) {
      console.error('Failed to delete expo:', err);
      addNotification("Failed to delete event.", "alert");
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const validatedDate = newExpo.date || newExpo.startDate;
    if (!newExpo.name || !validatedDate) {
      addNotification("Please enter Event Name and Start Date.", "alert");
      return;
    }

    try {
      const displayDate = newExpo.startDate && newExpo.endDate
        ? `${newExpo.startDate} to ${newExpo.endDate}`
        : newExpo.startDate || newExpo.date || '';

      const expo: Expo = {
        ...newExpo,
        date: displayDate,
        industry: newExpo.industry || 'Mechanical',
        region: newExpo.region || 'India',
        eventType: newExpo.eventType || 'Expo / Trade Fair',
      } as Expo;

      if (editingExpo) {
        await api.expos.update(editingExpo.id, expo);
        setExpos(prev => prev.map(e => e.id === editingExpo.id ? { ...expo, id: editingExpo.id } : e));
        addNotification("Event updated successfully.", "success");
      } else {
        const savedExpo = await api.expos.create(expo);
        setExpos(prev => [savedExpo, ...prev]);
        addNotification("Event added to repository.", "success");
      }

      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to save expo:', err);
      const msg = err.message || "Failed to save event.";
      addNotification(`Error: ${msg}`, "alert");
    }
  };

  const resetForm = () => {
    setNewExpo({
      name: '',
      date: '',
      location: '',
      industry: 'Mechanical',
      region: 'India',
      link: '',
      eventType: 'Expo / Trade Fair',
      organizerName: '',
      website: '',
      startDate: '',
      endDate: '',
      city: '',
      state: '',
      venue: '',
      zone: 'North',
      participationType: 'Visitor',
      stallNo: '',
      boothSize: '',
      feeCost: 0,
      registrationStatus: 'Applied',
      assignedTeam: '',
      visitPlan: '',
      transportMode: '',
      hotelDetails: '',
      budget: 0,
      status: 'upcoming',
      leadsGenerated: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      ordersReceived: 0,
      pipeLineInquiries: 0,
      newContacts: 0,
      brochureLink: '',
      entryPassLink: '',
      stallLayoutLink: '',
      photosLink: '',
      visitorListLink: ''
    });
    setEditingExpo(null);
    setFormTab('basic');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Expo) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const path = fileName; // Upload directly to bucket root
      const publicUrl = await api.storage.upload('expos', path, file);

      setNewExpo(prev => ({ ...prev, [field]: publicUrl }));
      addNotification(`${file.name} uploaded successfully!`, 'success');
    } catch (err) {
      console.error('Upload failed:', err);
      addNotification(`Failed to upload ${file.name}.`, 'alert');
    } finally {
      setUploading(null);
    }
  };

  const handleImport = (data: any[]) => {
    const newExpos: Expo[] = data.map(row => ({
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: row.name,
      date: row.date || '',
      location: row.location || '',
      industry: row.industry || 'Mechanical',
      region: row.region || 'India',
      eventType: row.eventType || 'Expo / Trade Fair'
    }));
    setExpos(prev => [...prev, ...newExpos]);
    addNotification(`Successfully imported ${newExpos.length} events.`, 'success');
  };

  const fetchLatestExpos = async () => {
    setLoading(true);
    addNotification("Scouting Indian industrial hubs for new events...", "info");
    try {
      const latest = await geminiService.fetchUpcomingExpos();
      if (latest && latest.length > 0) {
        const formatted: (Expo & { isAiScouted?: boolean, description?: string })[] = latest.map((e, idx) => ({
          ...e,
          id: `ai-${idx}-${Date.now()}`,
          isAiScouted: true,
          industry: e.industry || 'Mechanical',
          region: e.region || 'India'
        }));

        setExpos(prev => {
          const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
          const uniqueNew = formatted.filter(f => !existingNames.has(f.name.toLowerCase()));
          if (uniqueNew.length > 0) {
            addNotification(`Found ${uniqueNew.length} new manufacturing expos in India!`, 'alert');
          } else {
            addNotification("Database is already up to date.", "info");
          }
          return [...uniqueNew, ...prev];
        });
      }
    } catch (err) {
      addNotification("Failed to fetch live events.", "alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative min-h-[600px] animate-in fade-in duration-500">
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className={`pointer-events-auto flex items-center p-4 rounded-2xl shadow-2xl border min-w-[300px] max-w-md animate-in slide-in-from-right duration-300 ${n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : n.type === 'alert' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            <div className="mr-3">
              {n.type === 'success' ? <CheckCircle2 size={20} /> : n.type === 'alert' ? <BellRing size={20} className="animate-bounce" /> : <Info size={20} />}
            </div>
            <p className="text-sm font-bold flex-1">{n.message}</p>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="ml-4 opacity-50 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Indian Expo Scout</h2>
            <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full tracking-widest flex items-center shadow-lg">
              <Zap size={10} className="mr-1 fill-current" /> Live Feed
            </div>
          </div>
          <p className="text-slate-500">Auto-tracking manufacturing & additive events across all Indian industrial zones.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowImport(true)} className="flex items-center px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-2xl hover:bg-slate-50 text-sm font-bold shadow-sm transition-all">
            <FileSpreadsheet size={18} className="mr-2 text-slate-400" /> Bulk Import
          </button>
          <button onClick={fetchLatestExpos} disabled={loading} className="group flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 text-sm font-black shadow-xl transition-all">
            {loading ? <RefreshCw className="animate-spin mr-2" size={18} /> : <Sparkles className="mr-2 text-blue-400" size={18} />}
            {loading ? "Scouting..." : "Gather Live Events"}
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 text-sm font-bold shadow-lg transition-all active:scale-95">
            <Plus size={18} className="mr-2" /> Manual Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {expos.map((expo: Expo) => (
          <div key={expo.id} className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl hover:border-blue-300 transition-all duration-300 relative">
            <div className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Calendar size={28} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(expo.id)} className="p-3 bg-white border border-rose-100 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm group/del" title="Delete Event">
                      <Trash2 size={20} />
                    </button>
                    <button onClick={() => handleEdit(expo)} className="p-3 bg-white border border-blue-100 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Edit/View Details">
                      <Edit size={20} />
                    </button>
                    {expo.participationType && (
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${expo.participationType === 'Exhibitor' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        {expo.participationType}
                      </div>
                    )}
                    <button onClick={() => toggleReminder(expo)} className={`p-3 rounded-2xl transition-all ${reminders.includes(expo.id) ? 'bg-amber-100 text-amber-600 shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      <Bell size={20} className={reminders.includes(expo.id) ? "fill-current" : ""} />
                    </button>
                  </div>
                  {expo.status && (
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${expo.status === 'live' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                      expo.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        expo.status === 'canceled' ? 'bg-slate-100 text-slate-400 border-slate-200 line-through' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                      {expo.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{expo.eventType || 'Expo / Trade Fair'}</span>
                <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase line-clamp-2 min-h-[3.5rem]">{expo.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                  {expo.industry}
                </span>
                {expo.registrationStatus && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${expo.registrationStatus === 'Confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {expo.registrationStatus}
                  </span>
                )}
                {expo.leadsGenerated ? (
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-700 shadow-sm">
                    {expo.leadsGenerated} Leads
                  </span>
                ) : null}
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-start text-sm text-slate-600 font-medium">
                  <MapPin size={18} className="mr-3 text-blue-500 shrink-0" />
                  <div className="flex flex-col">
                    <span>{expo.venue || expo.location}</span>
                    {(expo.city || expo.state) && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {expo.city}{expo.city && expo.state ? ', ' : ''}{expo.state} {expo.zone && `(${expo.zone})`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-start text-sm text-slate-900 font-bold">
                  <Globe size={18} className="mr-3 text-indigo-500 shrink-0" />
                  <span>{expo.startDate && expo.endDate ? `${expo.startDate} - ${expo.endDate}` : expo.date}</span>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center">
                <CheckCircle2 size={12} className="mr-2 text-emerald-500" /> National Event
              </span>
              {(expo.link || expo.website) && (
                <a href={expo.link || expo.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 flex items-center hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition-all bg-white border border-blue-100">
                  {expo.participationType === 'Exhibitor' && expo.stallNo ? `Stall: ${expo.stallNo}` : 'Details'} <ExternalLink size={14} className="ml-2" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleManualAdd}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    {editingExpo ? <Edit size={24} /> : <Calendar size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{editingExpo ? 'Edit Event Details' : 'Add Global Expo'}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{editingExpo ? 'Update Registry' : 'Detailed Event Registry'}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-8 pt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: 'basic', label: 'Basic Details' },
                  { id: 'location', label: 'Date & Location' },
                  { id: 'participation', label: 'Participation' },
                  { id: 'planning', label: 'Planning' },
                  { id: 'outcomes', label: 'Outcomes' },
                  { id: 'documents', label: 'Documents' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormTab(t.id as any)}
                    className={`whitespace-nowrap py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formTab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
                {formTab === 'basic' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Name*</label>
                      <input required type="text" value={newExpo.name} onChange={e => setNewExpo({ ...newExpo, name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none uppercase" placeholder="e.g. IMTEX 2025" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Type</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" value={newExpo.eventType} onChange={e => setNewExpo({ ...newExpo, eventType: e.target.value })} >
                          <option value="Expo / Trade Fair">Expo / Trade Fair</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Conference">Conference</option>
                          <option value="Buyer-Seller Meet">Buyer-Seller Meet</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry focus</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" value={newExpo.industry} onChange={e => setNewExpo({ ...newExpo, industry: e.target.value })} >
                          <option value="Mechanical">Mechanical</option>
                          <option value="Tooling">Tooling</option>
                          <option value="Automotive">Automotive</option>
                          <option value="Aerospace">Aerospace</option>
                          <option value="General Manufacturing">General Manufacturing</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer Name</label>
                        <input type="text" value={newExpo.organizerName} onChange={e => setNewExpo({ ...newExpo, organizerName: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. IMTMA" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" value={newExpo.status} onChange={e => setNewExpo({ ...newExpo, status: e.target.value as any })} >
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live Now</option>
                          <option value="Completed">Completed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Website / Source URL</label>
                      <input type="url" value={newExpo.website} onChange={e => setNewExpo({ ...newExpo, website: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="https://example.com" />
                    </div>
                  </div>
                )}

                {formTab === 'location' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date*</label>
                        <input required type="date" value={newExpo.startDate} onChange={e => setNewExpo({ ...newExpo, startDate: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date*</label>
                        <input required type="date" value={newExpo.endDate} onChange={e => setNewExpo({ ...newExpo, endDate: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City*</label>
                        <input required type="text" value={newExpo.city} onChange={e => setNewExpo({ ...newExpo, city: e.target.value, location: `${e.target.value}, ${newExpo.state || ''}` })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Bangalore" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">State*</label>
                        <input required type="text" value={newExpo.state} onChange={e => setNewExpo({ ...newExpo, state: e.target.value, location: `${newExpo.city || ''}, ${e.target.value}` })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Karnataka" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue / Expo Center</label>
                        <input type="text" value={newExpo.venue} onChange={e => setNewExpo({ ...newExpo, venue: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. BIEC" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zone</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" value={newExpo.zone} onChange={e => setNewExpo({ ...newExpo, zone: e.target.value as any })} >
                          <option value="North">North</option>
                          <option value="South">South</option>
                          <option value="West">West</option>
                          <option value="East">East</option>
                          <option value="Central">Central</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'participation' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participation Type</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" value={newExpo.participationType} onChange={e => setNewExpo({ ...newExpo, participationType: e.target.value as any })} >
                          <option value="Visitor">Visitor</option>
                          <option value="Exhibitor">Exhibitor</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Status</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" value={newExpo.registrationStatus} onChange={e => setNewExpo({ ...newExpo, registrationStatus: e.target.value as any })} >
                          <option value="Applied">Applied</option>
                          <option value="Confirmed">Confirmed</option>
                        </select>
                      </div>
                    </div>
                    {newExpo.participationType === 'Exhibitor' && (
                      <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stall No</label>
                          <input type="text" value={newExpo.stallNo} onChange={e => setNewExpo({ ...newExpo, stallNo: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Hall 1, A-10" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booth Size</label>
                          <input type="text" value={newExpo.boothSize} onChange={e => setNewExpo({ ...newExpo, boothSize: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. 18 sqm" />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Fee / Stall Cost (₹)</label>
                      <input type="number" value={newExpo.feeCost} onChange={e => setNewExpo({ ...newExpo, feeCost: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="0" />
                    </div>
                  </div>
                )}

                {formTab === 'planning' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Team Member(s)</label>
                        <input type="text" value={newExpo.assignedTeam} onChange={e => setNewExpo({ ...newExpo, assignedTeam: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Rahul, Sneha" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget (Estimated ₹)</label>
                        <input type="number" value={newExpo.budget} onChange={e => setNewExpo({ ...newExpo, budget: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Plan (Date-wise)</label>
                      <textarea rows={2} value={newExpo.visitPlan} onChange={e => setNewExpo({ ...newExpo, visitPlan: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Day 1: Site visit, Day 2: Meetings" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transport Mode</label>
                        <input type="text" value={newExpo.transportMode} onChange={e => setNewExpo({ ...newExpo, transportMode: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Flight/Train" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotel / Stay (Optional)</label>
                        <input type="text" value={newExpo.hotelDetails} onChange={e => setNewExpo({ ...newExpo, hotelDetails: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Ginger Hotel" />
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'outcomes' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Generated (Total)</label>
                        <input type="number" value={newExpo.leadsGenerated} onChange={e => setNewExpo({ ...newExpo, leadsGenerated: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders Received (₹)</label>
                        <input type="number" value={newExpo.ordersReceived} onChange={e => setNewExpo({ ...newExpo, ordersReceived: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">🔥 Hot Leads</label>
                        <input type="number" value={newExpo.hotLeads} onChange={e => setNewExpo({ ...newExpo, hotLeads: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">⚡ Warm Leads</label>
                        <input type="number" value={newExpo.warmLeads} onChange={e => setNewExpo({ ...newExpo, warmLeads: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">❄️ Cold Leads</label>
                        <input type="number" value={newExpo.coldLeads} onChange={e => setNewExpo({ ...newExpo, coldLeads: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiries in Pipeline</label>
                        <input type="number" value={newExpo.pipeLineInquiries} onChange={e => setNewExpo({ ...newExpo, pipeLineInquiries: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Contacts Added</label>
                        <input type="number" value={newExpo.newContacts} onChange={e => setNewExpo({ ...newExpo, newContacts: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'documents' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      {[
                        { id: 'brochureLink', label: 'Event Brochure', placeholder: 'Brochure PDF/Image' },
                        { id: 'entryPassLink', label: 'Entry Pass', placeholder: 'Entry pass document' },
                        { id: 'stallLayoutLink', label: 'Stall Layout', placeholder: 'Stall layout blueprint' },
                        { id: 'photosLink', label: 'Photos', placeholder: 'Event photos gallery' },
                        { id: 'visitorListLink', label: 'Visitor List', placeholder: 'Visitor list Excel/PDF' }
                      ].map((field) => (
                        <div key={field.id} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <input
                                type="url"
                                value={(newExpo as any)[field.id] || ''}
                                onChange={e => setNewExpo({ ...newExpo, [field.id]: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none pr-10"
                                placeholder={field.placeholder}
                              />
                              {(newExpo as any)[field.id] && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                  <CheckCircle2 size={14} />
                                </div>
                              )}
                            </div>
                            <label className={`shrink-0 cursor-pointer p-3 px-4 rounded-xl border flex items-center justify-center transition-all ${uploading === field.id ? 'bg-slate-100 border-slate-200' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'}`}>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, field.id as keyof Expo)}
                                disabled={!!uploading}
                              />
                              {uploading === field.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Upload size={16} />
                              )}
                              <span className="ml-2 text-[10px] font-black uppercase tracking-widest">Upload</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-red-500 transition-colors">Cancel</button>
                <div className="flex gap-4">
                  {formTab !== 'documents' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'location', 'participation', 'planning', 'outcomes', 'documents'];
                        setFormTab(tabs[tabs.indexOf(formTab) + 1] as any);
                      }}
                      className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl flex items-center hover:bg-blue-600 transition-all"
                    >
                      Next Step <ChevronRight size={18} className="ml-2" />
                    </button>
                  ) : (
                    <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl flex items-center hover:bg-blue-700 transition-all">
                      <Save size={18} className="mr-2" /> {editingExpo ? 'Update Event' : 'Save Event'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
