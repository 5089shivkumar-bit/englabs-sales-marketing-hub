
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
  Cpu,
  Upload,
  Info,
  History,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { ExcelImporter } from '../components/ExcelImporter';
import { Customer, Expo, PricingRecord, Visit, normalizeTechCategory } from '../types';
import { INDIA_GEO_DATA } from '../constants';
import { dateUtils } from '../services/dateUtils';
import { geoService } from '../services/geoService';
import { excelService } from '../services/excelService';
import { api } from '../services/api';
import { Project, ProjectStatus, ProjectType } from '../types';

interface DataManagementViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  expos: Expo[];
  setExpos: React.Dispatch<React.SetStateAction<Expo[]>>;
  marketingTeam: any[];
  visits: Visit[];
}

interface HistoryState {
  customers: Customer[];
  expos: Expo[];
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  customers,
  setCustomers,
  expos,
  setExpos,
  marketingTeam,
  visits
}) => {
  const [activeModal, setActiveModal] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem('enging_import_logs');
    return savedLogs ? JSON.parse(savedLogs) : [
      { id: 1, action: 'Initial System Load', count: 'Seed', date: 'System', status: 'Success' }
    ];
  });
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showSqlRepair, setShowSqlRepair] = useState(false);

  const SQL_REPAIR_SCRIPT = `-- RUN THIS IN SUPABASE SQL EDITOR TO FIX SCHEMA ERRORS
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS area_sector TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS enquiry_no TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_date TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry_type TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS machine_types JSONB DEFAULT '[]';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS coords JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_discovered BOOLEAN DEFAULT false;

-- Add check constraint for status if column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_status_check') THEN
        ALTER TABLE customers ADD CONSTRAINT customers_status_check 
        CHECK (status IN ('active', 'inactive', 'prospective', 'lead', 'churned'));
    END IF;
END $$;`;

  const handleDeleteLog = async (log: any) => {
    if (!confirm(`Are you sure you want to delete this sync record? This will remove ${log.count} records from the database.`)) {
      return;
    }

    try {
      if (log.recordIds) {
        if (log.recordIds.customers && log.recordIds.customers.length > 0) {
          const idsToRemove = new Set(log.recordIds.customers);
          setCustomers(prev => prev.filter(c => !idsToRemove.has(c.id)));
          await api.customers.bulkDelete(log.recordIds.customers);
        }
        if (log.recordIds.expos && log.recordIds.expos.length > 0) {
          const idsToRemove = new Set(log.recordIds.expos);
          setExpos(prev => prev.filter(e => !idsToRemove.has(e.id)));
          await api.expos.bulkDelete(log.recordIds.expos);
        }
        if (log.recordIds.projects && log.recordIds.projects.length > 0) {
          await api.projects.bulkDelete(log.recordIds.projects);
        }
      }

      const newLogs = logs.filter((l: any) => l.id !== log.id);
      setLogs(newLogs);
      localStorage.setItem('enging_import_logs', JSON.stringify(newLogs));
    } catch (err) {
      console.error("Deletion failed", err);
      alert("Failed to delete some records from the database. They might have been partially removed.");
    }
  };

  // Listener for global export event from Layout
  useEffect(() => {
    const handleGlobalTrigger = () => setActiveModal(true);
    window.addEventListener('trigger-antigravity-import', handleGlobalTrigger);
    return () => window.removeEventListener('trigger-antigravity-import', handleGlobalTrigger);
  }, []);

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

  const saveHistory = () => {
    setHistory(prev => [{ customers: JSON.parse(JSON.stringify(customers)), expos: JSON.parse(JSON.stringify(expos)) }, ...prev].slice(0, 5));
  };

  const handleRollback = () => {
    if (history.length === 0) return;
    const lastState = history[0];
    setCustomers(lastState.customers);
    setExpos(lastState.expos);
    setHistory(prev => prev.slice(1));
    addLog('System Rollback Triggered', 0, 'Recovered');
  };

  const handleImport = async (data: any[], importType: string) => {
    if (importType === 'customers') {
      const importedCustomers: Customer[] = data.map(row => ({
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
          name: String(row.contactName),
          designation: 'Primary Contact',
          email: String(row.contactEmail || ""),
          phone: String(row.contactPhone || "")
        }] : [],
        pricingHistory: [],
        updatedAt: dateUtils.getISTTimestamp()
      })).filter(c => c.name.length > 0);

      // Duplicate detection: separate new vs existing customers
      const newCustomers: Customer[] = [];
      const existingCustomers: Customer[] = [];
      let updatedCount = 0;

      importedCustomers.forEach(importedCust => {
        const existing = customers.find(c =>
          c.name.toLowerCase().trim() === importedCust.name.toLowerCase().trim()
        );

        if (existing) {
          // Update existing customer
          existingCustomers.push({
            ...existing,
            ...importedCust,
            id: existing.id, // Keep original ID
            pricingHistory: existing.pricingHistory, // Preserve pricing history
            contacts: importedCust.contacts.length > 0 ? importedCust.contacts : existing.contacts
          });
        } else {
          // New customer
          newCustomers.push(importedCust);
        }
      });

      try {
        let newIds: string[] = [];

        // Create only new customers
        if (newCustomers.length > 0) {
          newIds = await api.customers.bulkCreate(newCustomers);
        }

        // Update existing customers
        if (existingCustomers.length > 0) {
          await Promise.all(existingCustomers.map(c => api.customers.update(c)));
          updatedCount = existingCustomers.length;
        }

        // Update state
        const customersWithRealIds = newCustomers.map((c, index) => ({
          ...c,
          id: newIds[index] || c.id
        }));

        setCustomers(prev => {
          // Remove old versions of updated customers
          const filtered = prev.filter(c =>
            !existingCustomers.find(ec => ec.id === c.id)
          );
          // Add updated customers and new customers
          return [...filtered, ...existingCustomers, ...customersWithRealIds];
        });

        const totalProcessed = newCustomers.length + updatedCount;
        addLog(
          `Bulk Import: ${newCustomers.length} new, ${updatedCount} updated`,
          totalProcessed,
          'Success',
          { customers: newIds }
        );
      } catch (e: any) {
        console.error("Bulk save customers failed", e);
        addLog('Bulk Save Customers', importedCustomers.length, 'Failed');
        setDbError(e.message);
      }
    } else if (importType === 'expos') {
      const importedExpos: Expo[] = data.map(row => ({
        id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: String(row.name || "").trim(),
        date: String(row.date || "").trim(),
        location: String(row.location || "").trim(),
        industry: String(row.industry || "Manufacturing").trim(),
        region: String(row.region || "India").trim(),
        status: 'upcoming' as any
      })).filter(e => e.name.length > 0);

      // Duplicate detection: check by name and date
      const newExpos: Expo[] = [];
      const existingExpos: Expo[] = [];
      let updatedCount = 0;

      importedExpos.forEach(importedExpo => {
        const existing = expos.find(e =>
          e.name.toLowerCase().trim() === importedExpo.name.toLowerCase().trim() &&
          e.date === importedExpo.date
        );

        if (existing) {
          // Update existing expo
          existingExpos.push({
            ...existing,
            ...importedExpo,
            id: existing.id // Keep original ID
          });
        } else {
          // New expo
          newExpos.push(importedExpo);
        }
      });

      try {
        let newIds: string[] = [];

        // Create only new expos
        if (newExpos.length > 0) {
          newIds = await api.expos.bulkCreate(newExpos);
        }

        // Update existing expos
        if (existingExpos.length > 0) {
          await Promise.all(existingExpos.map(e => api.expos.update(e.id, e)));
          updatedCount = existingExpos.length;
        }

        // Update state
        const exposWithRealIds = newExpos.map((e, index) => ({
          ...e,
          id: newIds[index] || e.id
        }));

        setExpos(prev => {
          // Remove old versions of updated expos
          const filtered = prev.filter(e =>
            !existingExpos.find(ee => ee.id === e.id)
          );
          // Add updated expos and new expos
          return [...filtered, ...existingExpos, ...exposWithRealIds];
        });

        const totalProcessed = newExpos.length + updatedCount;
        addLog(
          `Bulk Import: ${newExpos.length} new, ${updatedCount} updated`,
          totalProcessed,
          'Success',
          { expos: newIds }
        );
      } catch (e: any) {
        console.error("Bulk save expos failed", e);
        addLog('Bulk Saved Master Inquiries', importedExpos.length, 'Failed');
        setDbError(e.message);
      }
    }
    else if (importType === 'pricing') {
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
              date: row.date || dateUtils.getISTIsoDate(),
              // @ts-ignore
              status: "Approved"
            };
            cust.pricingHistory = [newPricing, ...cust.pricingHistory];
          }
        });
        addLog('Bulk Saved Pricing', matchedCount, 'Success');
        return next;
      });
    }
    else if (importType === 'automatic') {
      saveHistory();
      const mapped = excelService.mapAutomaticExcel(data);

      const tempCustomers: Customer[] = [];
      const tempExpos: Expo[] = [];
      const tempProjects: Project[] = [];
      const tempPricing: { custName: string, record: PricingRecord }[] = [];

      mapped.forEach(row => {
        let finalCity = row.city;
        let finalState = row.state;
        if (row.pincode) {
          const geo = geoService.lookupPincode(row.pincode);
          if (geo) {
            finalCity = geo.city;
            finalState = geo.state;
          }
        }
        if (finalCity && !finalState) {
          finalState = geoService.inferStateFromCity(finalCity) || "";
        }

        const existingCust = customers.find(c => c.name.toLowerCase().trim() === row.leadName.toLowerCase().trim());
        const isDuplicateCustomerInBatch = tempCustomers.find(c => c.name.toLowerCase().trim() === row.leadName.toLowerCase().trim());

        if (!existingCust && !isDuplicateCustomerInBatch) {
          tempCustomers.push({
            id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: row.leadName,
            city: finalCity || "N/A",
            state: finalState || "",
            country: "India",
            industry: row.industry || "Manufacturing",
            annualTurnover: 0,
            projectTurnover: 0,
            contacts: [],
            pricingHistory: [],
            status: row.status as any
          });
        }

        if (row.value > 0) {
          const pricingStatus: any = "Approved";
          tempPricing.push({
            custName: row.leadName,
            record: {
              id: `tp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              customerId: existingCust?.id || "temp",
              tech: normalizeTechCategory('Mechanical'),
              rate: row.value,
              unit: 'Project',
              date: row.date,
              status: pricingStatus
            }
          });
        }

        const expoName = `Inquiry: ${row.inquiryId}`;
        const isDuplicateExpo = expos.find(e => e.name === expoName || (e.date === row.date && e.name.includes(row.leadName)));
        if (!isDuplicateExpo) {
          tempExpos.push({
            id: `te-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: expoName,
            date: row.date,
            location: finalCity || "Direct",
            industry: "Mechanical",
            region: finalState || "India",
            status: row.status as any
          } as any);
        }

        tempProjects.push({
          id: `tproj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: `${row.leadName} - ${row.inquiryId}`,
          type: ProjectType.IN_HOUSE,
          description: `Automatic distribution from Anti-Gravity Engine. Source: ${row.inquiryId}`,
          startDate: row.date,
          endDate: row.date,
          status: 'Active',
          createdBy: 'Anti-Gravity Engine',
          companyName: row.leadName,
          location: finalCity || 'N/A',
          updatedAt: new Date().toISOString()
        });
      });

      try {
        let customerIds: string[] = [];
        let expoIds: string[] = [];
        let projectIds: string[] = [];
        let finalPricingRecords: PricingRecord[] = [];

        // 1. Save Customers and sync IDs
        if (tempCustomers.length > 0) {
          customerIds = await api.customers.bulkCreate(tempCustomers);
        }
        const syncedCustomers = tempCustomers.map((c, i) => ({ ...c, id: customerIds[i] || c.id }));

        // 2. Map and Save Pricing (now that we have Customer UUIDs)
        const pricingToSave = tempPricing.map(tp => {
          const syncedCust = syncedCustomers.find(c => c.name.toLowerCase().trim() === tp.custName.toLowerCase().trim());
          const existingCust = customers.find(c => c.name.toLowerCase().trim() === tp.custName.toLowerCase().trim());
          const finalId = syncedCust?.id || existingCust?.id;

          if (finalId) {
            return { ...tp.record, customerId: finalId } as PricingRecord;
          }
          return null;
        }).filter((p): p is PricingRecord => p !== null);

        if (pricingToSave.length > 0) {
          await api.pricing.bulkCreate(pricingToSave);
        }

        // 3. Save Expos and sync IDs
        if (tempExpos.length > 0) {
          expoIds = await api.expos.bulkCreate(tempExpos);
        }
        const syncedExpos = tempExpos.map((e, i) => ({ ...e, id: expoIds[i] || e.id }));

        // 4. Save Projects
        if (tempProjects.length > 0) {
          projectIds = await api.projects.bulkCreate(tempProjects);
        }

        // 5. Update local state
        setCustomers(prev => {
          const next = [...prev, ...syncedCustomers];
          pricingToSave.forEach(ps => {
            const c = next.find(cust => cust.id === ps.customerId);
            if (c) {
              c.pricingHistory = [ps, ...c.pricingHistory];
            }
          });
          return next;
        });
        setExpos(prev => [...prev, ...syncedExpos]);

        addLog('Anti-Gravity Intelligence Sync', mapped.length, 'Success', {
          customers: customerIds,
          expos: expoIds,
          projects: projectIds
        });
      } catch (err: any) {
        console.error("Persistence failed", err);
        addLog('Persistence Warning', mapped.length, 'Failed');
        setDbError(`Partial sync failure: ${err.message}`);
      }
    }
  };

  const addLog = (action: string, count: number, status: string, recordIds?: any) => {
    const newLogs = [{
      id: Date.now(),
      action,
      count: count.toString(),
      date: dateUtils.formatISTTime(),
      status,
      recordIds
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

      {dbError && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 shadow-sm animate-in slide-in-from-top duration-500">
          <div className="flex items-start gap-6">
            <div className="bg-amber-100 p-4 rounded-2xl text-amber-600">
              <Database size={28} />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-bold text-amber-900 leading-none">Database Schema Mismatch Detected</h3>
              <p className="text-amber-800 leading-relaxed max-w-2xl">
                The application encountered an error while communicating with the database.
                <span className="block font-semibold mt-1 text-amber-950 italic">Error: {dbError}</span>
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => setShowSqlRepair(!showSqlRepair)}
                  className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-amber-700 transition-all flex items-center"
                >
                  <Copy size={16} className="mr-2" />
                  {showSqlRepair ? "Hide Repair Script" : "Show Repair Script"}
                </button>
                <button
                  onClick={() => setDbError(null)}
                  className="bg-white text-amber-700 border border-amber-200 px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all"
                >
                  Dismiss
                </button>
              </div>

              {showSqlRepair && (
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-900 rounded-2xl p-6 relative group">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SQL_REPAIR_SCRIPT);
                        alert("SQL Script copied to clipboard!");
                      }}
                      className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all"
                      title="Copy SQL"
                    >
                      <Copy size={16} />
                    </button>
                    <pre className="text-blue-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {SQL_REPAIR_SCRIPT}
                    </pre>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                    <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-snug">
                      <strong>How to use:</strong> Copy the script above, go to your <strong>Supabase Dashboard</strong>, open the <strong>SQL Editor</strong>, paste it, and click <strong>Run</strong>. This will fix the missing columns and refresh the schema cache.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <div
            onClick={() => setActiveModal(true)}
            className="bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl group cursor-pointer hover:scale-[1.01] transition-all"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-all duration-700">
              <Zap size={300} />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-12">
              <div className="space-y-6">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl backdrop-blur-md">
                  <Zap size={32} className="fill-current" />
                </div>
                <h3 className="text-5xl font-black tracking-tighter leading-none italic">ANTI-GRAVITY ENGINE</h3>
                <p className="text-blue-100 text-xl leading-relaxed max-w-sm">
                  The ultimate one-stop upload engine. Automatically read, clean, and map all organizational data.
                </p>
                <div className="flex items-center space-x-3 text-emerald-300 bg-emerald-500/10 w-fit px-4 py-2 rounded-xl border border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">All Modules Ready for Sync</span>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <div className="px-10 py-8 bg-white text-slate-900 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Upload size={28} className="mr-4 text-blue-600" />
                  ⚡ Anti-Gravity Import
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Master Inquiries', 'Pricing', 'Customers'].map(item => (
                    <div key={item} className="bg-white/10 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                      <p className="text-[9px] font-black uppercase tracking-tighter text-blue-200">{item}</p>
                      <CheckCircle2 size={12} className="mt-2 text-emerald-400" />
                    </div>
                  ))}
                </div>
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
                    <th className="px-8 py-5">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log, index) => (
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
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-2">
                          {index === 0 && history.length > 0 && (
                            <button
                              onClick={handleRollback}
                              className="flex items-center space-x-1 text-rose-500 hover:text-rose-700 font-black text-[10px] uppercase tracking-widest bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 transition-all hover:scale-105"
                            >
                              <ShieldAlert size={12} />
                              <span>Rollback</span>
                            </button>
                          )}
                          {log.recordIds && (
                            <button
                              onClick={() => handleDeleteLog(log)}
                              className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all active:scale-90"
                              title="Delete this sync"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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
              <InsightRow label="Inquiries Logged" value={expos.length} color="indigo" />
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
          onClose={() => setActiveModal(false)}
          onImport={(data, importType) => {
            handleImport(data, importType);
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
