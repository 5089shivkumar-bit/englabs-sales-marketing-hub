import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, Layers, History, TrendingUp, FileText, X, Save,
  DollarSign, Briefcase, Calculator, ShieldCheck, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Calculator as CalcIcon, CreditCard, User, MapPin
} from 'lucide-react';
import { TECH_LIST, MARKETING_TEAM, INDIA_GEO_DATA } from '../constants';
import { TechCategory, Customer, PricingRecord, PricingStatus } from '../types';
import { dateUtils } from '../services/dateUtils';
import { api } from '../services/api';

interface PricingViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

type FormTab = 'basic' | 'cost' | 'final' | 'status';

export const PricingView: React.FC<PricingViewProps> = ({ customers, setCustomers }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'comparison'>('history');
  const [selectedTech, setSelectedTech] = useState<TechCategory | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTab, setFormTab] = useState<FormTab>('basic');
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewedRecord, setViewedRecord] = useState<PricingRecord | null>(null);

  // New Quote Form State with all requested fields
  const [newQuote, setNewQuote] = useState<Partial<PricingRecord>>({
    customerId: '',
    tech: TECH_LIST[0] as TechCategory,
    rate: 0,
    unit: 'piece',
    date: dateUtils.getISTIsoDate(),
    salesPerson: MARKETING_TEAM[0].name,
    status: PricingStatus.DRAFT,
    currency: 'INR',
    gstIncluded: true,
    rawMaterialCost: 0,
    machiningCost: 0,
    laborCost: 0,
    overhead: 0,
    transportationCost: 0,
    otherCharges: 0,
    moq: 1,
    quotedQty: 1,
  });

  // Derived calculations
  const totalCost = (newQuote.rawMaterialCost || 0) +
    (newQuote.machiningCost || 0) +
    (newQuote.laborCost || 0) +
    (newQuote.overhead || 0) +
    (newQuote.transportationCost || 0) +
    (newQuote.otherCharges || 0);

  const margin = newQuote.rate && newQuote.rate > 0
    ? ((newQuote.rate - totalCost) / newQuote.rate) * 100
    : 0;

  const totalAmount = (newQuote.rate || 0) * (newQuote.quotedQty || 1);

  const allPricing = useMemo(() =>
    customers.flatMap(c =>
      c.pricingHistory.map(p => ({
        ...p,
        customerName: c.name,
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [customers]);

  const filteredPricing = selectedTech === 'All'
    ? allPricing
    : allPricing.filter(p => p.tech === selectedTech);

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.customerId || !newQuote.rate) return;

    try {
      const record: PricingRecord = {
        ...newQuote,
        id: viewedRecord?.id || `p-${Date.now()}`,
        totalAmount,
        marginPercent: margin,
      } as PricingRecord;

      if (isViewMode && viewedRecord) {
        await api.pricing.update(record);
        setCustomers(prev => prev.map(c => {
          if (c.id === record.customerId) {
            return {
              ...c,
              pricingHistory: c.pricingHistory.map(ph => ph.id === record.id ? record : ph)
            };
          }
          return c;
        }));
      } else {
        // Persistence - capture the saved record with the real UUID
        const savedRecord = await api.pricing.create(record);

        setCustomers(prev => prev.map(c => {
          if (c.id === savedRecord.customerId) {
            return {
              ...c,
              pricingHistory: [savedRecord, ...c.pricingHistory]
            };
          }
          return c;
        }));
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save pricing record:', err);
      alert('Error saving record. Check database connection.');
    }
  };

  const handleDelete = async (record: PricingRecord) => {
    if (!window.confirm('Are you sure you want to delete this pricing record? This action cannot be undone.')) return;

    try {
      await api.pricing.delete(record.id);
      setCustomers(prev => prev.map(c => {
        if (c.id === record.customerId) {
          return {
            ...c,
            pricingHistory: c.pricingHistory.filter(ph => ph.id !== record.id)
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Failed to delete pricing record:', err);
      alert('Error deleting record.');
    }
  };

  const handleView = (record: PricingRecord) => {
    setViewedRecord(record);
    setNewQuote(record);
    setIsViewMode(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setNewQuote({
      customerId: '',
      tech: TECH_LIST[0] as TechCategory,
      rate: 0,
      unit: 'piece',
      date: dateUtils.getISTIsoDate(),
      salesPerson: MARKETING_TEAM[0].name,
      status: PricingStatus.DRAFT,
      currency: 'INR',
      gstIncluded: true,
      rawMaterialCost: 0,
      machiningCost: 0,
      laborCost: 0,
      overhead: 0,
      transportationCost: 0,
      otherCharges: 0,
      moq: 1,
      quotedQty: 1,
    });
    setFormTab('basic');
    setIsViewMode(false);
    setViewedRecord(null);
  };

  const statusColors = {
    [PricingStatus.DRAFT]: 'bg-slate-100 text-slate-600',
    [PricingStatus.SENT_TO_CLIENT]: 'bg-blue-100 text-blue-600',
    [PricingStatus.APPROVED]: 'bg-emerald-100 text-emerald-600',
    [PricingStatus.REJECTED]: 'bg-red-100 text-red-600',
    [PricingStatus.REVISED]: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <DollarSign className="text-blue-600" />
            Pricing & Commercial Intelligence
          </h2>
          <p className="text-slate-500 font-medium">Categorized cost records, margin analysis & quote tracking.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 text-sm font-black uppercase tracking-widest shadow-xl flex items-center transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2" /> Log New Quote
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          <div className="flex items-center">
            <History size={16} className="mr-2" /> Price History
          </div>
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'comparison' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          <div className="flex items-center">
            <TrendingUp size={16} className="mr-2" /> Variance Analysis
          </div>
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search products, clients, or codes..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
              <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Technology</span>
              <select
                className="text-xs font-black text-slate-700 outline-none bg-transparent pr-4 py-2"
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value as any)}
              >
                <option value="All">All Categories</option>
                {TECH_LIST.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-widest bg-slate-50/50">
                  <th className="px-8 py-5">Product / Client</th>
                  <th className="px-8 py-5">Details</th>
                  <th className="px-8 py-5">Date & Owner</th>
                  <th className="px-8 py-5 text-right">Quote (₹)</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPricing.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                          <Layers size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{record.productName || 'Unnamed Part'}</p>
                          <p className="text-xs font-bold text-slate-500">{record.customerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">
                          {record.tech} {record.materialType ? `| ${record.materialType}` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">DWG: {record.drawingNo || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{record.salesPerson || 'Market Sync'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{record.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-black text-slate-900">₹{record.rate.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-emerald-600 font-black uppercase">{record.marginPercent ? `${record.marginPercent.toFixed(1)}% Margin` : 'Market Price'}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[record.status] || 'bg-slate-100 text-slate-600'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleView(record as PricingRecord)}
                          className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record as PricingRecord)}
                          className="p-2 bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPricing.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <Calculator size={48} className="mb-4" />
                        <p className="text-lg font-bold">No pricing records found</p>
                        <p className="text-sm">Log a new quote to start your intelligence database.</p>
                      </div>
                    </td>
                  </tr>
                )}
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
              <div key={tech} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                    <Layers size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">National Average</p>
                    <p className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">₹{avgPrice.toFixed(2)} <span className="text-xs font-medium text-slate-400">/{unit}</span></p>
                  </div>
                </div>
                <h4 className="font-black text-slate-900 mb-6 text-lg tracking-tight">{tech}</h4>
                <div className="flex-1 space-y-4">
                  {techPrices.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-slate-600 truncate mr-4">{p.customerName}</span>
                      <span className="text-xs font-black text-slate-900">₹{p.rate.toFixed(2)}</span>
                    </div>
                  ))}
                  {techPrices.length === 0 && <p className="text-xs text-slate-400 italic font-medium py-10 text-center uppercase tracking-widest opacity-50">No market data available.</p>}
                </div>
                <button className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 flex items-center justify-center gap-2">
                  View Full Report <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Multi-Tab Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="flex flex-col h-[650px]">
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-200">
                    <CalcIcon size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Smart Pricing Console</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg">Version 2.0</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Advanced Cost Breakup & CRM Sync</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={28} />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="px-8 py-4 flex gap-2">
                {[
                  { id: 'basic', label: 'Basic Details', icon: Briefcase },
                  { id: 'cost', label: 'Cost Breakup', icon: Calculator },
                  { id: 'final', label: 'Final Pricing', icon: DollarSign },
                  { id: 'status', label: 'Status & Terms', icon: ShieldCheck },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFormTab(t.id as FormTab)}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formTab === t.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                  >
                    <t.icon size={16} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Form Content */}
              <div className="flex-1 p-8 pt-4 overflow-y-auto custom-scrollbar">
                <form id="priceForm" onSubmit={handleAddQuote} className="h-full">
                  {formTab === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
                      <div className="space-y-6">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Record Identity</p>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Client Account*</label>
                          <select
                            required
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            value={newQuote.customerId}
                            onChange={(e) => {
                              const customer = customers.find(c => c.id === e.target.value);
                              setNewQuote({
                                ...newQuote,
                                customerId: e.target.value,
                                industry: customer?.industry,
                                city: customer?.city,
                                state: customer?.state
                              });
                            }}
                          >
                            <option value="">-- Choose Account --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sales Representative</label>
                          <select
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                            value={newQuote.salesPerson}
                            onChange={e => setNewQuote({ ...newQuote, salesPerson: e.target.value })}
                          >
                            {MARKETING_TEAM.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Drawing No.</label>
                            <input
                              type="text"
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none uppercase"
                              placeholder="e.g. ME-204-X"
                              value={newQuote.drawingNo}
                              onChange={e => setNewQuote({ ...newQuote, drawingNo: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Type</label>
                            <input
                              type="text"
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                              placeholder="e.g. SS304"
                              value={newQuote.materialType}
                              onChange={e => setNewQuote({ ...newQuote, materialType: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Technical Context</p>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technology Category*</label>
                          <select
                            required
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                            value={newQuote.tech}
                            onChange={e => setNewQuote({ ...newQuote, tech: e.target.value as TechCategory })}
                          >
                            {TECH_LIST.map(tech => <option key={tech} value={tech}>{tech}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Machine Type</label>
                          <select
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                            value={newQuote.machineType}
                            onChange={e => setNewQuote({ ...newQuote, machineType: e.target.value })}
                          >
                            <option value="">-- Generic --</option>
                            <option value="CNC">CNC Turning</option>
                            <option value="VMC">VMC 3-Axis</option>
                            <option value="VMC-5">VMC 5-Axis</option>
                            <option value="Lathe">Manual Lathe</option>
                            <option value="3D">Commercial 3D Printer</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Part Name / Service Description*</label>
                          <input
                            required
                            type="text"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                            placeholder="e.g. Support Plate Fabrication"
                            value={newQuote.productName}
                            onChange={e => setNewQuote({ ...newQuote, productName: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formTab === 'cost' && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                      <div className="bg-slate-900 rounded-[2rem] p-8 mb-8 flex justify-between items-center shadow-2xl">
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Calculated Cost Basis</p>
                          <h4 className="text-3xl font-black text-white">₹{totalCost.toLocaleString('en-IN')}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impact on Margin</p>
                          <p className="text-sm font-bold text-indigo-400">{margin > 0 ? `+${margin.toFixed(1)}%` : `${margin.toFixed(1)}%`} Estimated</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { key: 'rawMaterialCost', label: 'Raw Material', icon: Layers },
                          { key: 'machiningCost', label: 'Machining Cost', icon: Briefcase },
                          { key: 'laborCost', label: 'Labor / Skill', icon: User },
                          { key: 'overhead', label: 'Overhead (Electricity, etc)', icon: Clock },
                          { key: 'transportationCost', label: 'Transportation', icon: MapPin },
                          { key: 'otherCharges', label: 'Other Buffer Charges', icon: Plus },
                        ].map(field => (
                          <div key={field.key} className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <field.icon size={12} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                              {field.label}
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold ml-1">₹</span>
                              <input
                                type="number"
                                className="w-full p-4 pl-9 bg-white border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-indigo-500 transition-all shadow-sm"
                                placeholder="0"
                                value={newQuote[field.key as keyof PricingRecord] as number}
                                onChange={e => setNewQuote({ ...newQuote, [field.key]: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formTab === 'final' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-right-4 duration-500">
                      <div className="space-y-8">
                        <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <DollarSign size={14} /> Quoted Unit Rate
                          </p>
                          <div className="relative mb-6">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-indigo-600 opacity-30">₹</span>
                            <input
                              required
                              type="number"
                              className="w-full p-8 pl-14 bg-white border-2 border-indigo-200 rounded-[2rem] text-4xl font-black text-indigo-700 outline-none focus:ring-8 focus:ring-indigo-500/10 transition-all shadow-xl"
                              placeholder="0"
                              value={newQuote.rate || ''}
                              onChange={e => setNewQuote({ ...newQuote, rate: parseFloat(e.target.value) || 0 })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                              <input
                                type="text"
                                className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-black"
                                value={newQuote.unit}
                                onChange={e => setNewQuote({ ...newQuote, unit: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valid Till</label>
                              <input
                                type="date"
                                className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-black"
                                value={newQuote.validTill}
                                onChange={e => setNewQuote({ ...newQuote, validTill: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 flex flex-col justify-center">
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200">
                          <div className="flex justify-between items-center mb-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Summary</p>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-tighter text-slate-400">Auto Calculation</span>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500">Quoted Quantity</span>
                              <div className="flex items-center gap-3">
                                <button onClick={() => setNewQuote({ ...newQuote, quotedQty: Math.max(1, (newQuote.quotedQty || 1) - 1) })} type="button" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black">-</button>
                                <span className="text-sm font-black w-8 text-center">{newQuote.quotedQty}</span>
                                <button onClick={() => setNewQuote({ ...newQuote, quotedQty: (newQuote.quotedQty || 1) + 1 })} type="button" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black">+</button>
                              </div>
                            </div>
                            <div className="h-px bg-slate-200 my-2" />
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500">Gross Amount</span>
                              <span className="text-sm font-black text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500">Profit Margin</span>
                              <span className={`text-sm font-black ${margin >= 15 ? 'text-emerald-600' : margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {margin.toFixed(2)} %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formTab === 'status' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
                      <div className="space-y-6">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Pipeline Status</p>
                        <div className="grid grid-cols-1 gap-3">
                          {Object.values(PricingStatus).map(status => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setNewQuote({ ...newQuote, status })}
                              className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${newQuote.status === status
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg'
                                : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                }`}
                            >
                              <span className="text-xs font-black uppercase tracking-widest">{status}</span>
                              {newQuote.status === status && <CheckCircle2 size={18} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Payment & GST</p>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                              <CreditCard size={14} /> Preferred Payment Mode
                            </label>
                            <div className="flex gap-2">
                              {['Bank', 'UPI', 'Credit', 'Cash'].map(mode => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => setNewQuote({ ...newQuote, paymentMode: mode })}
                                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${newQuote.paymentMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'
                                    }`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black text-slate-700">GST Compliance</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Included in Quoted Price?</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewQuote({ ...newQuote, gstIncluded: !newQuote.gstIncluded })}
                              className={`w-14 h-8 rounded-full relative transition-all ${newQuote.gstIncluded ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${newQuote.gstIncluded ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>

                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-4">
                            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg">
                              <AlertCircle size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Notice</p>
                              <p className="text-[11px] text-amber-700 font-medium">Final record will be saved as an immutable audit entry once approved.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400">
                  {formTab === 'status' ? 'Ready to commit record' : 'Continue to next tab to finalize'}
                </p>
                <div className="flex items-center space-x-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Abort</button>
                  {formTab !== 'status' ? (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === 'basic' ? 'cost' : formTab === 'cost' ? 'final' : 'status')}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-indigo-600 transition-all"
                    >
                      Next Step <ChevronRight size={18} className="ml-2" />
                    </button>
                  ) : (
                    <button
                      form="priceForm"
                      type="submit"
                      className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-emerald-700 transition-all"
                    >
                      <Save size={18} className="mr-2" /> Commit Record
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
