
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, ArrowRight, Download, FileSpreadsheet } from 'lucide-react';
import { excelService } from '../services/excelService';

interface ExcelImporterProps {
  type?: 'customers' | 'pricing' | 'expos' | 'projects';
  onImport: (mappedData: any[], importType: string) => void;
  onClose: () => void;
  targetFields?: { key: string, label: string, required?: boolean }[];
}

const IMPORT_CONFIGS: Record<string, { label: string, fields: { key: string, label: string, required?: boolean }[] }> = {
  customers: {
    label: 'Customers',
    fields: [
      { key: 'name', label: 'Customer Name', required: true },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' },
      { key: 'industry', label: 'Industry' },
      { key: 'annualTurnover', label: 'Annual Turnover' },
      { key: 'contactName', label: 'Primary Contact' },
      { key: 'contactEmail', label: 'Contact Email' }
    ]
  },
  pricing: {
    label: 'Pricing',
    fields: [
      { key: 'customerName', label: 'Customer Name', required: true },
      { key: 'tech', label: 'Technology / Material Category', required: true },
      { key: 'rate', label: 'Rate / Price' },
      { key: 'unit', label: 'Unit (e.g., gram, ml)', required: true },
      { key: 'date', label: 'Effective Date' }
    ]
  },
  expos: {
    label: 'Master Inquiries',
    fields: [
      { key: 'name', label: 'Event Name', required: true },
      { key: 'location', label: 'Location' },
      { key: 'date', label: 'Date' },
      { key: 'industry', label: 'Industry Focus' },
      { key: 'region', label: 'Region' }
    ]
  },
  projects: {
    label: 'Projects',
    fields: [
      { key: 'name', label: 'Project Name', required: true },
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'description', label: 'Description' },
      { key: 'startDate', label: 'Start Date', required: true },
      { key: 'endDate', label: 'End Date' },
      { key: 'status', label: 'Status (Active/Completed/On Hold)' },
      { key: 'type', label: 'Project Type (IN_HOUSE/VENDOR)' },
      { key: 'location', label: 'Location' },
      { key: 'totalValue', label: 'Value' }
    ]
  },
  automatic: {
    label: '⚡ Anti-Gravity Auto',
    fields: [
      { key: 'inquiryId', label: 'Inquiry ID (EQ No.)', required: true },
      { key: 'leadName', label: 'Lead Name (FROM)', required: true },
      { key: 'date', label: 'Date', required: true },
      { key: 'value', label: 'Deal Value', required: true },
      { key: 'status', label: 'Status (Open/Closed)' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'city', label: 'City' }
    ]
  }
};

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ type: initialType, onImport, onClose, targetFields: initialFields }) => {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importType, setImportType] = useState<'customers' | 'pricing' | 'expos' | 'projects' | 'automatic'>(initialType || 'customers');
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFields = initialFields || IMPORT_CONFIGS[importType].fields;

  // Improved auto-mapping with fuzzy matching
  useEffect(() => {
    if (columns.length > 0 && step === 'mapping') {
      const initialMapping: Record<string, string> = {};
      activeFields.forEach(field => {
        const fieldLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const fieldKey = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');

        const match = columns.find(col => {
          const normalizedCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedCol === fieldLabel ||
            normalizedCol === fieldKey ||
            normalizedCol.includes(fieldLabel) ||
            fieldLabel.includes(normalizedCol);
        });

        if (match) initialMapping[field.key] = match;
      });
      setMapping(initialMapping);
    }
  }, [columns, step, activeFields]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    try {
      const { columns, data } = await excelService.parseExcel(uploadedFile);
      if (!data || data.length === 0) {
        alert("We couldn't find any data in the selected file. Please check if the spreadsheet contains records and that they are on a visible sheet.");
        return;
      }
      setFile(uploadedFile);
      setColumns(columns);
      setRawData(data);
      setStep('mapping');
    } catch (err) {
      alert("Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.");
    }
  };

  const generatePreview = () => {
    const finalData = rawData.map(row => {
      const entry: any = {};
      activeFields.forEach(field => {
        const excelColumn = mapping[field.key];
        if (excelColumn) {
          const rawValue = row[excelColumn];
          entry[field.key] = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        } else {
          entry[field.key] = "";
        }
      });
      return entry;
    }).filter(entry => {
      const requiredMissing = activeFields.some(f => f.required && (!entry[f.key] || entry[f.key].toString().trim() === ""));
      return !requiredMissing;
    });

    setProcessedData(finalData);
    setStep('preview');
  };

  const executeImport = () => {
    onImport(processedData, importType);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">Smart Ingestion Engine</h3>
              <p className="text-xs text-slate-500 font-medium">Reading all data for: {IMPORT_CONFIGS[importType].label.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>

        <div className="p-10">
          {step === 'upload' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {['customers', 'pricing', 'expos', 'projects', 'automatic'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setImportType(t as any)}
                    className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${importType === t
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-400'
                      }`}
                  >
                    {IMPORT_CONFIGS[t].label}
                  </button>
                ))}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    const fakeEvent = { target: { files: e.dataTransfer.files } } as any;
                    handleFileUpload(fakeEvent);
                  }
                }}
                className="border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-all group relative overflow-hidden"
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={40} />
                </div>
                <h4 className="font-bold text-slate-900 text-2xl">Upload Spreadsheet</h4>
                <p className="text-slate-500 text-base mt-2">Select the Excel file containing your records.</p>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-8">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  We found <strong>{columns.length} columns</strong>. Match the Enging fields below to your Excel headers to ensure all information is read correctly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {activeFields.map(field => (
                  <div key={field.key} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{field.label}</span>
                      {field.required && <span className="text-[10px] font-black text-rose-500 uppercase">Required</span>}
                    </div>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                      value={mapping[field.key] || ""}
                      onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      <option value="">-- Ignore / Skip --</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button onClick={() => setStep('upload')} className="text-sm font-bold text-slate-500 hover:text-slate-900 px-6">Back</button>
                <button
                  onClick={generatePreview}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center"
                >
                  Confirm & Preview <ArrowRight className="ml-2" size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-8">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start space-x-4 mb-6">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                <div>
                  <h5 className="font-bold text-emerald-900 text-sm">Dry Run Successful - Previewing {processedData.length} records</h5>
                  <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">
                    Please verify the records below. This is a <strong>Dry Run</strong>. No data has been saved to the registry yet.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {activeFields.slice(0, 4).map(f => (
                        <th key={f.key} className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                        {activeFields.slice(0, 4).map(f => (
                          <td key={f.key} className="p-3 text-[11px] font-medium text-slate-600">{row[f.key] || <span className="text-slate-300 italic">N/A</span>}</td>
                        ))}
                      </tr>
                    ))}
                    {processedData.length > 10 && (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-[10px] text-slate-400 font-bold bg-slate-50/50 italic">
                          + {processedData.length - 10} more records...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button onClick={() => setStep('mapping')} className="text-sm font-bold text-slate-500 hover:text-slate-900 px-6">Adjust Mapping</button>
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-100 px-3 py-1 rounded-full">{processedData.length} Valid Records</span>
                  <button
                    onClick={executeImport}
                    className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    Commit & Save Records
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 size={56} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900">Import Complete</h3>
              <p className="text-slate-500 mt-4 max-w-md mx-auto text-lg leading-relaxed">
                All information has been read from Excel and securely saved into the application database.
              </p>
              <button
                onClick={onClose}
                className="mt-12 px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-2xl hover:bg-slate-800 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
