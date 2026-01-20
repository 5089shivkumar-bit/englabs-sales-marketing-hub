
import React, { useState } from 'react';
import { 
  Plus, 
  Search,
  Layers,
  History,
  TrendingUp,
  FileText,
  X,
  Save,
  DollarSign
} from 'lucide-react';
import { TECH_LIST } from '../constants';
import { TechCategory, Customer, PricingRecord } from '../types';
import { dateUtils } from '../services/dateUtils';

interface PricingViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export const PricingView: React.FC<PricingViewProps> = ({ customers, setCustomers }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'comparison'>('history');
  const [selectedTech, setSelectedTech] = useState<TechCategory | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Quote Form State
  const [newQuote, setNewQuote] = useState({
    customerId: '',
    tech: TECH_LIST[0] as TechCategory,
    rate: '',
    unit: 'gram'
  });

  const allPricing = customers.flatMap(c => 
    c.pricingHistory.map(p => ({
      ...p,
      customerName: c.name,
      industry: c.industry
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredPricing = selectedTech === 'All' 
    ? allPricing 
    : allPricing.filter(p => p.tech === selectedTech);

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.customerId || !newQuote.rate) return;

    const record: PricingRecord = {
      id: `p-${Date.now()}`,
      customerId: newQuote.customerId,
      tech: newQuote.tech,
      rate: parseFloat(newQuote.rate) || 0,
      unit: newQuote.unit,
      date: dateUtils.getISTIsoDate()
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === newQuote.customerId) {
        return {
          ...c,
          pricingHistory: [record, ...c.pricingHistory]
        };
      }
      return c;
    }));

    setShowAddModal(false);
    setNewQuote({ customerId: '', tech: TECH_LIST[0] as TechCategory, rate: '', unit: 'gram' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Pricing (INR)</h2>
          <p className="text-slate-500">Live categorized records for the Indian additive manufacturing market.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm flex items-center transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" /> Log New Quote
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center">
            <History size={18} className="mr-2" /> Price History
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('comparison')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'comparison' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center">
            <TrendingUp size={18} className="mr-2" /> Variance Analysis
          </div>
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search pricing records..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
              <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Category:</span>
              <select 
                className="text-sm font-medium text-slate-600 outline-none bg-transparent pr-2 py-1"
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value as any)}
              >
                <option value="All">All Technologies</option>
                {TECH_LIST.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                  <th className="px-6 py-4">Technology</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">IST Date</th>
                  <th className="px-6 py-4 text-right">Rate (₹)</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPricing.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Layers size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{record.tech}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{record.customerName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ₹{record.rate.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/{record.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      <FileText size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_LIST.map(tech => {
            const techPrices = allPricing.filter(p => p.tech === tech);
            const avgPrice = techPrices.length > 0 
              ? techPrices.reduce((acc, curr) => acc + curr.rate, 0) / techPrices.length 
              : 0;
            const unit = techPrices[0]?.unit || 'unit';

            return (
              <div key={tech} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700">
                    <Layers size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Nat. Avg</p>
                    <p className="text-lg font-bold text-slate-900">₹{avgPrice.toFixed(2)} <span className="text-xs font-normal text-slate-400">/{unit}</span></p>
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 mb-4">{tech}</h4>
                <div className="flex-1 space-y-3">
                  {techPrices.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 truncate mr-4">{p.customerName}</span>
                      <span className="font-semibold text-slate-900 shrink-0">₹{p.rate.toFixed(2)}</span>
                    </div>
                  ))}
                  {techPrices.length === 0 && <p className="text-xs text-slate-400 italic">No national records synced.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleAddQuote}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Log New Pricing Record</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Quote Sync</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Client Account*</label>
                  <select 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                    value={newQuote.customerId}
                    onChange={e => setNewQuote({...newQuote, customerId: e.target.value})}
                  >
                    <option value="">-- Choose Account --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technology Category*</label>
                    <select 
                      required 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                      value={newQuote.tech}
                      onChange={e => setNewQuote({...newQuote, tech: e.target.value as TechCategory})}
                    >
                      {TECH_LIST.map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate (INR)*</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                      placeholder="e.g. 75.00"
                      value={newQuote.rate}
                      onChange={e => setNewQuote({...newQuote, rate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit of Measure</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                    placeholder="e.g. gram, cm3, hour"
                    value={newQuote.unit}
                    onChange={e => setNewQuote({...newQuote, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-end space-x-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-sm font-bold text-slate-500">Cancel</button>
                <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl flex items-center">
                  <Save size={18} className="mr-2" /> Commit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
