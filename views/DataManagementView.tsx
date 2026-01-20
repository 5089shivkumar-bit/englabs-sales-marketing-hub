
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  Search,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Layers,
  Save,
  HardDrive,
  ArrowRight,
  Globe,
  Zap,
  Download,
  Share2,
  Box,
  Copy,
  Terminal,
  Cpu
} from 'lucide-react';
import { ExcelImporter } from '../components/ExcelImporter';
import { Customer, Expo, PricingRecord, Visit, normalizeTechCategory } from '../types';
import { INDIA_GEO_DATA } from '../constants';
import { dateUtils } from '../services/dateUtils';

interface DataManagementViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  expos: Expo[];
  setExpos: React.Dispatch<React.SetStateAction<Expo[]>>;
  marketingTeam: any[];
  visits: Visit[];
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ 
  customers, 
  setCustomers, 
  expos, 
  setExpos,
  marketingTeam,
  visits
}) => {
  const [activeModal, setActiveModal] = useState<'customers' | 'pricing' | 'expos' | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem('enging_import_logs');
    return savedLogs ? JSON.parse(savedLogs) : [
      { id: 1, action: 'Initial System Load', count: 'Seed', date: 'System', status: 'Success' }
    ];
  });

  // Listener for global export event from Layout
  useEffect(() => {
    const handleGlobalTrigger = () => handleAntiGravityExport(true);
    window.addEventListener('trigger-antigravity-export', handleGlobalTrigger);
    return () => window.removeEventListener('trigger-antigravity-export', handleGlobalTrigger);
  }, [customers, expos, marketingTeam, visits]);

  const importConfigs = {
    customers: [
      { key: 'name', label: 'Customer Name', required: true },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' },
      { key: 'industry', label: 'Industry' },
      { key: 'annualTurnover', label: 'Annual Turnover' },
      { key: 'contactName', label: 'Primary Contact' },
      { key: 'contactEmail', label: 'Contact Email' }
    ],
    pricing: [
      { key: 'customerName', label: 'Customer Name', required: true },
      { key: 'tech', label: 'Technology / Material Category', required: true },
      { key: 'rate', label: 'Rate / Price' },
      { key: 'unit', label: 'Unit (e.g., gram, ml)', required: true },
      { key: 'date', label: 'Effective Date' }
    ],
    expos: [
      { key: 'name', label: 'Event Name', required: true },
      { key: 'location', label: 'Location' },
      { key: 'date', label: 'Date' },
      { key: 'industry', label: 'Industry Focus' },
      { key: 'region', label: 'Region' }
    ]
  };

  const getExportPayload = () => {
    return {
      meta: {
        system: "Mark-Eng B2B Hub",
        engine_signature: "anti-gravity-protocol-v4",
        version: "4.2.0-AntiGravity",
        timestamp: dateUtils.getISTTimestamp(),
        epoch: Date.now(),
        total_record_count: customers.length + expos.length + marketingTeam.length + visits.length,
        state_digest: btoa(JSON.stringify({ c: customers.length, v: visits.length }))
      },
      registries: {
        customers,
        expos,
        personnel: marketingTeam,
        visit_logs: visits
      }
    };
  };

  const handleAntiGravityExport = (downloadOnly: boolean = true) => {
    const exportData = getExportPayload();

    if (downloadOnly) {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MarkEng_AntiGravity_Registry_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
    
    addLog('Anti-Gravity Export Executed', exportData.meta.total_record_count, 'Success');
  };

  const handleImport = (data: any[]) => {
    if (activeModal === 'customers') {
      const newCustomers: Customer[] = data.map(row => ({
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: String(row.name || "").trim(),
        city: String(row.city || "N/A").trim(),
        state: String(row.state || "").trim(),
        country: String(row.country || "India").trim(),
        industry: String(row.industry || "Manufacturing").trim(),
        annualTurnover: parseFloat(row.annualTurnover) || 0,
        projectTurnover: 0,
        contacts: row.contactName ? [{
          id: `cp-${Date.now()}`,
          name: String(row.contactName).trim(),
          designation: 'Contact',
          email: String(row.contactEmail || "").trim(),
          phone: ''
        }] : [],
        pricingHistory: []
      })).filter(c => c.name.length > 0);
      
      setCustomers(prev => {
        const existingNames = new Set(prev.map(c => c.name.toLowerCase().trim()));
        const uniqueNew = newCustomers.filter(c => !existingNames.has(c.name.toLowerCase().trim()));
        return [...prev, ...uniqueNew];
      });
      addLog('Bulk Saved Customers', data.length, 'Success');
    } 
    else if (activeModal === 'pricing') {
      setCustomers(prev => {
        const next = [...prev];
        let matchedCount = 0;
        data.forEach(row => {
          const rowName = String(row.customerName || "").toLowerCase().trim();
          const cust = next.find(c => c.name.toLowerCase().trim() === rowName);
          if (cust) {
            matchedCount++;
            const normalizedTech = normalizeTechCategory(String(row.tech || "").trim());
            const newPricing: PricingRecord = {
              id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              customerId: cust.id,
              tech: normalizedTech,
              rate: parseFloat(row.rate) || 0,
              unit: String(row.unit || "gram").trim(),
              date: row.date || dateUtils.getISTIsoDate()
            };
            cust.pricingHistory = [newPricing, ...cust.pricingHistory];
          }
        });
        addLog('Bulk Saved Pricing', matchedCount, 'Success');
        return next;
      });
    }
    else if (activeModal === 'expos') {
      const newExpos: Expo[] = data.map(row => ({
        id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: String(row.name || "").trim(),
        date: String(row.date || "").trim(),
        location: String(row.location || "").trim(),
        industry: String(row.industry || "Manufacturing").trim(),
        region: String(row.region || "India").trim()
      })).filter(e => e.name.length > 0);
      setExpos(prev => [...prev, ...newExpos]);
      addLog('Bulk Saved National Expos', newExpos.length, 'Success');
    }
  };

  const addLog = (action: string, count: number, status: string) => {
    const newLogs = [{
      id: Date.now(),
      action,
      count: count.toString(),
      date: dateUtils.formatISTTime(), 
      status
    }, ...logs].slice(0, 15);
    setLogs(newLogs);
    localStorage.setItem('enging_import_logs', JSON.stringify(newLogs));
  };

  const clearDatabase = () => {
    if (confirm("Are you sure you want to clear all imported data? This will reset Mark-Eng to its initial state.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Data Management Center</h2>
          <p className="text-slate-500 text-lg">Master persistence and Anti-Gravity extraction controls.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={clearDatabase}
            className="flex items-center px-6 py-3 border border-rose-200 text-rose-600 bg-rose-50 rounded-2xl hover:bg-rose-100 text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <Trash2 size={18} className="mr-2" /> Wipe DB
          </button>
          <div className="flex items-center space-x-3 bg-slate-900 text-white px-6 py-3 rounded-2xl border border-slate-800 shadow-xl">
            <HardDrive size={20} className="text-blue-400" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">State Sync</p>
              <p className="text-xs font-bold leading-none">Local/Cloud Connected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ImportCard 
          title="Clients & CRM" 
          description="Read and save national client lists with auto-geo state mapping."
          icon={FileSpreadsheet}
          color="blue"
          onClick={() => setActiveModal('customers')}
        />
        <ImportCard 
          title="Market Pricing" 
          description="Bulk update material rates and manufacturing pricing histories."
          icon={Layers}
          color="emerald"
          onClick={() => setActiveModal('pricing')}
        />
        <ImportCard 
          title="Global Expos" 
          description="Import major industrial events and national manufacturing hub expos."
          icon={Globe}
          color="indigo"
          onClick={() => setActiveModal('expos')}
        />
      </div>

      {/* Special Anti-Gravity Export Section (Re-designed for tool usage) */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-slate-700">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
          <Cpu size={300} className="text-blue-400" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center space-x-3 bg-blue-500/10 w-fit px-5 py-2 rounded-full border border-blue-500/20">
              <Terminal size={14} className="text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">Anti-Gravity Protocol Verified</span>
            </div>
            <h3 className="text-5xl font-black tracking-tighter leading-none">Export Master Registry</h3>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              Extract the entire organizational state for direct injection into the Anti-Gravity processing tool. 
              Current payload size: <span className="text-white font-black underline decoration-blue-500">{(customers.length + expos.length + marketingTeam.length + visits.length)} high-fidelity records</span>.
            </p>
            <div className="flex items-center space-x-3 text-emerald-400 bg-emerald-500/10 w-fit px-4 py-2 rounded-xl border border-emerald-500/20 animate-pulse">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Master Buffer Synchronized</span>
            </div>
          </div>
          
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <button 
              onClick={() => handleAntiGravityExport(true)}
              className="group w-full py-8 bg-blue-600 hover:bg-white hover:text-blue-900 text-white rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center"
            >
              <Download size={28} className="mr-4 group-hover:bounce" />
              Download JSON
            </button>
            
            <div className="flex gap-4">
              <button 
                onClick={() => handleAntiGravityExport(false)}
                className={`flex-1 py-5 border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center ${
                  copyFeedback 
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'bg-transparent border-slate-700 text-slate-300 hover:border-blue-400 hover:text-blue-400'
                }`}
              >
                {copyFeedback ? (
                  <><CheckCircle2 size={16} className="mr-2" /> Buffer Updated</>
                ) : (
                  <><Copy size={16} className="mr-2" /> Copy Master Payload</>
                )}
              </button>
              
              <div className="flex-none p-5 bg-slate-800/50 rounded-2xl border border-slate-700 text-blue-400">
                <Share2 size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-bold text-slate-900 flex items-center text-lg">
                <Clock size={20} className="mr-3 text-blue-500" /> Registry Sync History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                  <tr>
                    <th className="px-8 py-5">System Action</th>
                    <th className="px-8 py-5">Record Volume</th>
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Persistence Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4">
                            <Save size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-600 font-bold">{log.count} Items</td>
                      <td className="px-8 py-6 text-[11px] text-slate-400 font-black">{log.date}</td>
                      <td className="px-8 py-6">
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tighter border border-emerald-100">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
            <h3 className="text-2xl font-black mb-8">Registry Insights</h3>
            <div className="space-y-8">
              <InsightRow label="Total Customers" value={customers.length} color="blue" />
              <InsightRow label="Events Logged" value={expos.length} color="indigo" />
              <InsightRow label="Pricing Points" value={customers.reduce((acc, c) => acc + c.pricingHistory.length, 0)} color="emerald" />
              <InsightRow label="Personnel Active" value={marketingTeam.length} color="amber" />
            </div>
          </div>

          <div className="bg-blue-600 rounded-[2rem] p-8 text-white flex items-center space-x-6 shadow-xl shadow-blue-200">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Zap size={32} className="fill-current" />
            </div>
            <div>
              <h4 className="font-black text-lg">Instant Sync</h4>
              <p className="text-xs text-blue-100 leading-relaxed font-bold mt-1">Registry is live-locked and ready for export to Anti-Gravity.</p>
            </div>
          </div>
        </div>
      </div>

      {activeModal && (
        <ExcelImporter 
          type={activeModal} 
          targetFields={importConfigs[activeModal]}
          onClose={() => setActiveModal(null)}
          onImport={(data) => {
            handleImport(data);
          }}
        />
      )}
    </div>
  );
};

const InsightRow: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const barColor = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  }[color];

  const textColor = {
    blue: 'text-blue-400',
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400'
  }[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
        <span className="text-slate-400">{label}</span>
        <span className={textColor}>{value}</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full ${barColor} transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.3)]`} style={{ width: `${Math.min(value * 2, 100)}%` }}></div>
      </div>
    </div>
  );
};

const ImportCard: React.FC<{ 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  color: string; 
  onClick: () => void 
}> = ({ title, description, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-white hover:border-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-white hover:border-emerald-400',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-white hover:border-indigo-400',
  }[color];

  return (
    <div 
      onClick={onClick}
      className={`p-10 rounded-[3rem] border-2 transition-all cursor-pointer group shadow-sm ${colorClasses}`}
    >
      <div className="mb-8 inline-flex p-5 rounded-3xl bg-white shadow-lg group-hover:scale-110 transition-transform">
        <Icon size={32} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">{description}</p>
      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
        Open Importer <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
