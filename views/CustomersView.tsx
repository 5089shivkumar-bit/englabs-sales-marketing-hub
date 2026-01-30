
import React, { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  Search,
  MapPin,
  Mail,
  Briefcase,
  ChevronRight,
  FileSpreadsheet,
  Map as MapIcon,
  X,
  Navigation,
  Save,
  Building2,
  Trash2,
  ShieldCheck,
  Edit3,
  UserCheck,
  Clock,
  Fingerprint,
  RefreshCw,
  PencilLine,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, User } from '../types';
import { INDIA_GEO_DATA, ZONES } from '../constants';
import { dateUtils } from '../services/dateUtils';

interface CustomersViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onDeleteCustomer: (id: string) => void;
  onSaveCustomer?: (customer: Customer, isNew: boolean) => void;
  currentUser: User;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, setCustomers, onDeleteCustomer, onSaveCustomer, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State for Add/Edit
  const [formCust, setFormCust] = useState({
    name: '',
    city: '',
    state: '',
    industry: '',
    annualTurnover: '',
    contactName: '',
    contactEmail: '',
    areaSector: '',
    pincode: '',
    status: 'Open',
    enquiryNo: '',
    lastDate: ''
  });

  const customerFields = [
    { key: 'name', label: 'Customer Name', required: true },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'industry', label: 'Industry' },
    { key: 'annualTurnover', label: 'Annual Turnover' },
    { key: 'contactName', label: 'Primary Contact' },
    { key: 'contactEmail', label: 'Contact Email' }
  ];


  const handleActionDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    const customer = customers.find(c => c.id === id);
    const customerName = customer?.name || "this account";

    // Final Personnel Confirmation
    const confirmed = window.confirm(
      `REGISTRY PURGE AUTHORIZATION\n\n` +
      `Personnel: ${currentUser.name}\n` +
      `Target: ${customerName}\n\n` +
      `Confirming this will permanently remove the client and all associated visit/pricing logs from the national database.`
    );

    if (confirmed) {
      // Clear selection if needed
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      // Execute global state deletion
      onDeleteCustomer(id);
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingCustomer(customer);
    setFormCust({
      name: customer.name || '',
      city: customer.city || '',
      state: customer.state || '',
      industry: customer.industry || '',
      annualTurnover: (customer.annualTurnover || 0).toString(),
      contactName: customer.contacts[0]?.name || '',
      contactEmail: customer.contacts[0]?.email || '',
      areaSector: customer.areaSector || '',
      pincode: customer.pincode || '',
      // @ts-ignore
      status: customer.status || 'Open',
      enquiryNo: customer.enquiryNo || '',
      lastDate: customer.lastDate || ''
    });
    setShowAddModal(true);
  };

  const inferStateFromCity = (city: string) => {
    for (const stateName in INDIA_GEO_DATA) {
      if (INDIA_GEO_DATA[stateName].cities.some(c => c.toLowerCase() === city.toLowerCase())) {
        return stateName;
      }
    }
    return '';
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCust.name) return;

    // Automation Logic: If state is missing but city is present, infer it.
    let finalState = formCust.state;
    if (!finalState && formCust.city) {
      finalState = inferStateFromCity(formCust.city);
    }

    // If city is missing but state is present, we might just use the principal city or leave generic.
    // Requirement says "User only enters City or State".
    const finalCity = formCust.city || 'Principal City';

    const timestamp = dateUtils.getISTTimestamp();
    let customerToSave: Customer;

    if (editingCustomer) {
      customerToSave = {
        ...editingCustomer,
        name: formCust.name,
        city: finalCity,
        state: finalState || 'N/A',
        industry: formCust.industry,
        annualTurnover: parseFloat(formCust.annualTurnover) || 0,
        areaSector: formCust.areaSector,
        pincode: formCust.pincode,
        // @ts-ignore
        status: formCust.status,
        enquiryNo: formCust.enquiryNo,
        lastDate: formCust.lastDate,
        lastModifiedBy: currentUser.name,
        updatedAt: timestamp,
        contacts: editingCustomer.contacts.length > 0
          ? [{ ...editingCustomer.contacts[0], name: formCust.contactName, email: formCust.contactEmail }]
          : formCust.contactName ? [{
            id: `cp-${Date.now()}`,
            name: formCust.contactName,
            designation: 'Primary Contact',
            email: formCust.contactEmail,
            phone: ''
          }] : []
      };

      if (onSaveCustomer) {
        await onSaveCustomer(customerToSave, false);
      } else {
        setCustomers(prev => prev.map(c => c.id === customerToSave.id ? customerToSave : c));
      }
    } else {
      customerToSave = {
        id: `c-${Date.now()}`,
        name: formCust.name,
        city: finalCity,
        state: finalState || 'N/A',
        country: 'India',
        annualTurnover: parseFloat(formCust.annualTurnover) || 0,
        areaSector: formCust.areaSector,
        pincode: formCust.pincode,
        projectTurnover: 0,
        industry: formCust.industry || 'Manufacturing',
        // @ts-ignore
        status: formCust.status,
        enquiryNo: formCust.enquiryNo,
        lastDate: formCust.lastDate,
        contacts: formCust.contactName ? [{
          id: `cp-${Date.now()}`,
          name: formCust.contactName,
          designation: 'Primary Contact',
          email: formCust.contactEmail,
          phone: ''
        }] : [],
        pricingHistory: [],
        lastModifiedBy: currentUser.name,
        updatedAt: timestamp
      };

      if (onSaveCustomer) {
        await onSaveCustomer(customerToSave, true);
      } else {
        setCustomers(prev => [customerToSave, ...prev]);
      }
    }

    setShowAddModal(false);
    setEditingCustomer(null);
    setFormCust({ name: '', city: '', state: '', industry: '', annualTurnover: '', contactName: '', contactEmail: '', areaSector: '', pincode: '' });
  };

  const handleExportExcel = () => {
    const dataToExport = filteredCustomers.map(c => ({
      'Company Name': c.name,
      'City': c.city,
      'State': c.state,
      'Zone': getZoneForCustomer(c),
      'Industry': c.industry,
      'Annual Turnover (Cr)': formatRevenue(c.annualTurnover),
      'Last Modified By': c.lastModifiedBy || 'N/A',
      'Last Updated': c.updatedAt || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, `Customers_Export_${selectedZone.replace(' ', '_')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF() as any;

    doc.setFontSize(20);
    doc.text('National Client Directory', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Region: ${selectedZone} | Total Records: ${filteredCustomers.length}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    const tableData = filteredCustomers.map(c => [
      c.name,
      c.city,
      c.state,
      getZoneForCustomer(c),
      c.industry,
      formatRevenue(c.annualTurnover)
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Identity', 'City', 'State', 'Zone', 'Vertical', 'Rev (Cr)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Customers_Export_${selectedZone.replace(' ', '_')}.pdf`);
  };

  const getZoneForCustomer = (customer: Customer) => {
    if (customer.zone) return customer.zone;
    if (customer.state && INDIA_GEO_DATA[customer.state]) {
      return INDIA_GEO_DATA[customer.state].zone;
    }
    for (const stateName in INDIA_GEO_DATA) {
      if (INDIA_GEO_DATA[stateName].cities.some(c => c.toLowerCase() === customer.city.toLowerCase())) {
        return INDIA_GEO_DATA[stateName].zone;
      }
    }
    return 'Other';
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.state?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'All Zones' || getZoneForCustomer(c) === selectedZone;
    const matchesState = selectedState === 'All States' || c.state === selectedState;
    const matchesCity = selectedCity === 'All Cities' || c.city.trim() === selectedCity;
    return matchesSearch && matchesZone && matchesState && matchesCity;
  });

  const formatRevenue = (val: number) => {
    if (val >= 10000000) return (val / 10000000).toFixed(2);
    return (val / 10000000).toFixed(2); // Always show Cr equivalent as per screenshot
  };

  return (
    <div className="space-y-6 relative">
      {/* Universal Personnel Access Banner */}
      <div className="bg-slate-900 rounded-[1.5rem] p-5 flex flex-col md:flex-row md:items-center justify-between shadow-2xl shadow-slate-200 border-b-4 border-blue-600 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center space-x-5 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-white/10">
            <Fingerprint size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">Registry Handshake Status</p>
            <p className="text-base font-bold text-white">Proper Access Verified for: <span className="text-blue-400">{currentUser.name}</span></p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
            <UserCheck size={14} />
            <span>Personnel CRUD Controls Active</span>
          </div>
        </div>
      </div>

      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">National Client Directory</h2>
          <p className="text-slate-500 font-medium">Enterprise data management for {customers.length} manufacturing accounts.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormCust({ name: '', city: '', state: '', industry: '', annualTurnover: '', contactName: '', contactEmail: '', areaSector: '', pincode: '', status: 'Open' });
              setShowAddModal(true);
            }}
            className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 text-sm font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={20} className="mr-3" /> Register New Account
          </button>
        </div>
      </div>

      {/* Filters Overlay */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
            {ZONES.map(zone => {
              const count = customers.filter(c => getZoneForCustomer(c) === zone || (zone === 'All Zones')).length;
              return (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-6 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest flex items-center space-x-2 ${selectedZone === zone
                    ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10 ring-1 ring-slate-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span>{zone}</span>
                  {count > 0 && <span className={`px-2 py-0.5 rounded-lg text-[9px] ${selectedZone === zone ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 max-w-lg flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by company, city, state..."
                className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleExportExcel}
              className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase"
              title="Export to Excel"
            >
              <Download size={16} /> XL
            </button>
            <button
              onClick={handleExportPDF}
              className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase"
              title="Export to PDF"
            >
              <Download size={16} /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-32">
        <div className={`${selectedCustomer ? 'xl:col-span-8' : 'xl:col-span-12'} transition-all duration-300`}>
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-widest bg-slate-50/30">
                    <th className="px-8 py-6">Client Identity</th>
                    <th className="px-8 py-6">Sector / Vertical</th>
                    <th className="px-8 py-6 text-center">Revenue (Cr)</th>
                    <th className="px-8 py-6 text-center">Operational Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map(customer => (
                    <tr
                      key={customer.id}
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors group ${selectedCustomer?.id === customer.id ? 'bg-blue-50/40' : ''}`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-base shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {customer.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{customer.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{customer.city}, {customer.state}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-tight border border-slate-100">
                          {customer.industry || 'General Mfg'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center text-sm font-black text-slate-900">
                        {formatRevenue(customer.annualTurnover)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center space-x-3">
                          {/* Exact Styling from Screenshot: Pen/Edit Icon */}
                          <button
                            onClick={(e) => handleOpenEdit(e, customer)}
                            className="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all border border-slate-100/50 shadow-sm"
                            title="Edit Personnel Entry"
                          >
                            <PencilLine size={18} />
                          </button>
                          {/* Exact Styling from Screenshot: Trash/Delete Icon */}
                          <button
                            onClick={(e) => handleActionDelete(e, customer.id)}
                            className="w-11 h-11 flex items-center justify-center bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-100/50 shadow-sm active:scale-90"
                            title="Remove Client Permanently"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center opacity-40">
                        <p className="font-black uppercase text-xs tracking-[0.2em] text-slate-400">No Registry Matches Found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedCustomer && (
          <div className="xl:col-span-4 space-y-6 animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden sticky top-20">
              <div className="p-10 bg-slate-900 text-white relative">
                <button className="absolute top-8 right-8 p-2.5 hover:bg-white/10 rounded-full transition-colors" onClick={() => setSelectedCustomer(null)}>
                  <X size={24} />
                </button>
                <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-3xl font-black uppercase shadow-2xl ring-4 ring-white/10 mb-8">
                  {selectedCustomer.name?.charAt(0)}
                </div>
                <h3 className="text-2xl font-black leading-tight mb-2">{selectedCustomer.name}</h3>
                <p className="text-blue-400 text-[11px] uppercase tracking-[0.2em] font-black">{selectedCustomer.industry}</p>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Hub Hub</p>
                    <p className="text-sm font-bold text-slate-900">{selectedCustomer.city}</p>
                    {(selectedCustomer.areaSector || selectedCustomer.pincode) && (
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {[selectedCustomer.areaSector, selectedCustomer.pincode].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Cr Revenue</p>
                    <p className="text-sm font-bold text-slate-900">{formatRevenue(selectedCustomer.annualTurnover)}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                    <ShieldCheck size={14} className="mr-2 text-blue-500" /> Authorized Entry Log
                  </h4>
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                        <Fingerprint size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">Last Modified By</p>
                        <p className="text-sm font-black text-slate-900">{selectedCustomer.lastModifiedBy || 'Master Registry'}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 font-bold">
                      <Clock size={14} className="mr-2" />
                      {selectedCustomer.updatedAt || 'Initial Sync'}
                    </div>
                  </div>
                </div>

                <div className="pt-10 grid grid-cols-2 gap-4">
                  <button
                    onClick={(e) => handleOpenEdit(e, selectedCustomer)}
                    className="py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center shadow-xl active:scale-95"
                  >
                    <Edit3 size={16} className="mr-3" /> Update Record
                  </button>
                  <button
                    onClick={(e) => handleActionDelete(e, selectedCustomer.id)}
                    className="py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center shadow-xl shadow-rose-200 active:scale-95"
                  >
                    <Trash2 size={16} className="mr-3" /> Purge Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleSaveCustomer}>
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
                    <Building2 size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{editingCustomer ? 'Modify Client Entry' : 'New Client Registration'}</h3>
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-1">Personnel Authorization: {currentUser.name}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-4 hover:bg-slate-200 rounded-full text-slate-400 transition-transform hover:rotate-90">
                  <X size={32} />
                </button>
              </div>

              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Company Name*</label>
                    <input required type="text" value={formCust.name} onChange={e => setFormCust({ ...formCust, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Bharat Aerospace" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">From</label>
                    <input type="text" value={formCust.industry} onChange={e => setFormCust({ ...formCust, industry: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="e.g. Automotive" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formCust.pincode}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormCust(prev => ({ ...prev, pincode: val }));

                        // Simulation of Pincode Lookup
                        if (val.length === 6) {
                          // Mock lookup map for demonstration
                          const mockLookup: Record<string, { city: string, state: string }> = {
                            '110001': { city: 'New Delhi', state: 'Delhi' },
                            '400001': { city: 'Mumbai', state: 'Maharashtra' },
                            '560001': { city: 'Bengaluru', state: 'Karnataka' },
                            '600001': { city: 'Chennai', state: 'Tamil Nadu' },
                            '700001': { city: 'Kolkata', state: 'West Bengal' },
                            '500001': { city: 'Hyderabad', state: 'Telangana' }
                          };

                          if (mockLookup[val]) {
                            setFormCust(prev => ({
                              ...prev,
                              pincode: val,
                              city: mockLookup[val].city,
                              state: mockLookup[val].state
                            }));
                          }
                        }
                      }}
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono tracking-widest"
                      placeholder="000000"
                    />
                    <p className="text-[9px] text-slate-400 font-bold ml-2">City & State will auto-fill. You can edit if needed.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">City Hub</label>
                    <input
                      type="text"
                      value={formCust.city}
                      onChange={e => {
                        const val = e.target.value;
                        const inferredState = inferStateFromCity(val);
                        setFormCust(prev => ({
                          ...prev,
                          city: val,
                          state: inferredState || prev.state
                        }));
                      }}
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                      placeholder="e.g. Ludhiana"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">State</label>
                    <input
                      type="text"
                      list="state-list"
                      value={formCust.state}
                      onChange={e => setFormCust({ ...formCust, state: e.target.value })}
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="e.g. Punjab"
                    />
                    <datalist id="state-list">
                      {Object.keys(INDIA_GEO_DATA).sort().map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Area / Sector</label>
                    <input type="text" value={formCust.areaSector} onChange={e => setFormCust({ ...formCust, areaSector: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="e.g. Sector 58" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Annual Revenue (INR)</label>
                    <input type="number" value={formCust.annualTurnover} onChange={e => setFormCust({ ...formCust, annualTurnover: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="50000000" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Handled by</label>
                    <input type="text" value={formCust.contactName} onChange={e => setFormCust({ ...formCust, contactName: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Rahul Sharma" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
                    <select
                      value={formCust.status}
                      onChange={e => setFormCust({ ...formCust, status: e.target.value as any })}
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                    >
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Enquiry No.</label>
                    <input type="text" value={formCust.enquiryNo} onChange={e => setFormCust({ ...formCust, enquiryNo: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="e.g. ENQ-2024-001" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Last Date</label>
                    <input type="date" value={formCust.lastDate} onChange={e => setFormCust({ ...formCust, lastDate: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50 flex items-center justify-end space-x-8 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" className="px-14 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center active:scale-95">
                  {editingCustomer ? <Save size={20} className="mr-3" /> : <Plus size={20} className="mr-3" />}
                  {editingCustomer ? 'Update Authorized Registry' : 'Commit New Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
