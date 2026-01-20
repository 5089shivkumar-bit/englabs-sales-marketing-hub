
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, ArrowRight, Download, FileSpreadsheet } from 'lucide-react';
import { excelService } from '../services/excelService';

interface ExcelImporterProps {
  type: 'customers' | 'pricing' | 'expos';
  onImport: (mappedData: any[]) => void;
  onClose: () => void;
  targetFields: { key: string, label: string, required?: boolean }[];
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ type, onImport, onClose, targetFields }) => {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Improved auto-mapping with fuzzy matching
  useEffect(() => {
    if (columns.length > 0 && step === 'mapping') {
      const initialMapping: Record<string, string> = {};
      targetFields.forEach(field => {
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
  }, [columns, step, targetFields]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    try {
      const { columns, data } = await excelService.parseExcel(uploadedFile);
      if (!data || data.length === 0) {
        alert("The selected file appears to be empty.");
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

  const executeImport = () => {
    // Transform raw Excel rows into structured App Objects based on user mapping
    const finalData = rawData.map(row => {
      const entry: any = {};
      targetFields.forEach(field => {
        const excelColumn = mapping[field.key];
        if (excelColumn) {
          const rawValue = row[excelColumn];
          // Basic sanitization: trim strings, handle numbers
          entry[field.key] = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        } else {
          entry[field.key] = "";
        }
      });
      return entry;
    }).filter(entry => {
      // Basic validation: ensure required fields aren't completely empty
      const requiredMissing = targetFields.some(f => f.required && (!entry[f.key] || entry[f.key].toString().trim() === ""));
      return !requiredMissing;
    });

    if (finalData.length === 0) {
      alert("No valid records found after mapping. Please ensure required fields are mapped to non-empty columns.");
      return;
    }

    onImport(finalData);
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
              <p className="text-xs text-slate-500 font-medium">Reading all data for: {type.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>

        <div className="p-10">
          {step === 'upload' && (
            <div className="space-y-8">
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
                {targetFields.map(field => (
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
                  onClick={() => setStep('preview')}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center"
                >
                  Confirm Mapping <ArrowRight className="ml-2" size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-8">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start space-x-4">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                <div>
                  <h5 className="font-bold text-emerald-900 text-sm">Data Ready for Save</h5>
                  <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                    System successfully processed <strong>{rawData.length} rows</strong>. Click below to read and permanently save this data.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button onClick={() => setStep('mapping')} className="text-sm font-bold text-slate-500 hover:text-slate-900 px-6">Adjust Mapping</button>
                <button 
                  onClick={executeImport}
                  className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
                >
                  Read & Save {rawData.length} Records
                </button>
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
