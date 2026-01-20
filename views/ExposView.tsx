
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
  Save
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Expo } from '../types';
import { ExcelImporter } from '../components/ExcelImporter';

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

  // New Expo Form State
  const [newExpo, setNewExpo] = useState({
    name: '',
    date: '',
    location: '',
    industry: 'Manufacturing',
    region: 'India',
    link: ''
  });

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

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpo.name || !newExpo.date) return;

    const expo: Expo = {
      id: `e-${Date.now()}`,
      ...newExpo
    };

    setExpos(prev => [expo, ...prev]);
    setShowAddModal(false);
    setNewExpo({ name: '', date: '', location: '', industry: 'Manufacturing', region: 'India', link: '' });
    addNotification("Event added to national repository.", "success");
  };

  const handleImport = (data: any[]) => {
    const newExpos: Expo[] = data.map(row => ({
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: row.name,
      date: row.date || '',
      location: row.location || '',
      industry: row.industry || 'Manufacturing',
      region: row.region || 'India'
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
          isAiScouted: true
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
          <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 text-sm font-bold shadow-lg transition-all active:scale-95">
            <Plus size={18} className="mr-2" /> Manual Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {expos.map((expo: any) => (
          <div key={expo.id} className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl hover:border-blue-300 transition-all duration-300 relative">
            <div className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Calendar size={28} />
                </div>
                <button onClick={() => toggleReminder(expo)} className={`p-3 rounded-2xl transition-all ${reminders.includes(expo.id) ? 'bg-amber-100 text-amber-600 shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                  <Bell size={20} className={reminders.includes(expo.id) ? "fill-current" : ""} />
                </button>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{expo.name}</h3>
              <div className="flex items-center space-x-2 mb-6">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                  {expo.industry}
                </span>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-start text-sm text-slate-600 font-medium">
                  <MapPin size={18} className="mr-3 text-blue-500 shrink-0" />
                  <span>{expo.location}</span>
                </div>
                <div className="flex items-start text-sm text-slate-900 font-bold">
                  <Globe size={18} className="mr-3 text-indigo-500 shrink-0" />
                  <span>{expo.date}</span>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center">
                <CheckCircle2 size={12} className="mr-2 text-emerald-500" /> National Event
              </span>
              {expo.link && (
                <a href={expo.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 flex items-center hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition-all bg-white border border-blue-100">
                  Details <ExternalLink size={14} className="ml-2" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleManualAdd}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Add Global Expo</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Event Registry</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Name*</label>
                  <input required type="text" value={newExpo.name} onChange={e => setNewExpo({...newExpo, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. World Manufacturing Forum" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range*</label>
                    <input required type="text" value={newExpo.date} onChange={e => setNewExpo({...newExpo, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="Oct 12-14, 2024" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City, Country*</label>
                    <input required type="text" value={newExpo.location} onChange={e => setNewExpo({...newExpo, location: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="Pune, India" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry focus</label>
                  <input type="text" value={newExpo.industry} onChange={e => setNewExpo({...newExpo, industry: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Additive Manufacturing" />
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-end space-x-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-sm font-bold text-slate-500">Cancel</button>
                <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl flex items-center">
                  <Save size={18} className="mr-2" /> Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
