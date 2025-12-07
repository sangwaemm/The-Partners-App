
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { Download, Upload } from 'lucide-react';

export default function Settings() {
   const { settings, updateSettings, currentUser, translations, exportData, importData } = useData();
  const [formSettings, setFormSettings] = useState(settings);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
   const [importPreview, setImportPreview] = useState<string>('');
   const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
        loanInterestRate: Number(formSettings.loanInterestRate),
        sharePrice: Number(formSettings.sharePrice)
    });
    setMessage({ text: "Settings saved successfully!", type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

   const handleExport = () => {
      try {
         const data = exportData();
         const blob = new Blob([data], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `coop_backup_${new Date().toISOString().slice(0,10)}.json`;
         document.body.appendChild(a);
         a.click();
         a.remove();
         URL.revokeObjectURL(url);
         setMessage({ text: 'Export completed — JSON file downloaded.', type: 'success' });
         setTimeout(() => setMessage(null), 3000);
      } catch (e) {
         setMessage({ text: 'Export failed.', type: 'error' });
      }
   };

   const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
         const text = String(reader.result || '');
         setImportPreview(text);
      };
      reader.readAsText(file);
   };

   const handleRestore = () => {
      if (!importPreview) {
         setMessage({ text: 'No JSON to import.', type: 'error' });
         setTimeout(() => setMessage(null), 3000);
         return;
      }
      const ok = importData(importPreview);
      if (ok) {
         setMessage({ text: 'Data restored from JSON successfully.', type: 'success' });
      } else {
         setMessage({ text: 'Failed to restore data. Invalid JSON.', type: 'error' });
      }
      setTimeout(() => setMessage(null), 3000);
   };

  if (!isAdmin) {
      return (
          <div className="p-8 text-center text-slate-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
              <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
              <p>Only Administrators can modify system settings.</p>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
           <SettingsIcon size={24} />
        </div>
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{translations.settings}</h2>
           <p className="text-slate-500">Manage global application configurations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h3 className="font-semibold text-slate-800">Financial Configurations</h3>
           <p className="text-sm text-slate-500 mt-1">These settings affect all future transactions.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Loan Interest Rate (%)</label>
              <div className="relative">
                 <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="w-full pl-4 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formSettings.loanInterestRate}
                    onChange={e => setFormSettings({...formSettings, loanInterestRate: parseFloat(e.target.value)})}
                 />
                 <span className="absolute right-4 top-2 text-slate-400 font-medium">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                 Default interest rate applied to new loans. Current loans are not affected.
              </p>
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Share Price (RWF)</label>
              <div className="relative">
                 <input 
                    type="number" 
                    min="0"
                    className="w-full pl-4 pr-16 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formSettings.sharePrice}
                    onChange={e => setFormSettings({...formSettings, sharePrice: parseFloat(e.target.value)})}
                 />
                 <span className="absolute right-4 top-2 text-slate-400 font-medium">RWF</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                 Value of a single share. Used for calculating member net worth.
              </p>
           </div>

           {message && (
               <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                   {message.text}
               </div>
           )}

           <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/30"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
           </div>
        </form>
       
            {/* Data Export / Import */}
            <div className="p-6 border-t border-slate-100">
               <h3 className="font-semibold text-slate-800 mb-3">Data Backup & Restore</h3>
               <p className="text-sm text-slate-500 mb-4">Export the full application data as JSON or restore from a previously exported file.</p>

               <div className="flex gap-3 items-center">
                  <button onClick={handleExport} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded hover:bg-slate-100">
                     <Download size={16} />
                     <span>Export JSON</span>
                  </button>

                  <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded cursor-pointer hover:bg-slate-100">
                     <Upload size={16} />
                     <span>Upload JSON</span>
                     <input ref={fileInputRef} onChange={handleImportFile} accept="application/json" type="file" className="hidden" />
                  </label>

                  <button onClick={handleRestore} className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded">
                     Restore Data
                  </button>
               </div>

               {importPreview && (
                  <div className="mt-4">
                     <label className="block text-sm font-medium text-slate-700 mb-2">Preview imported JSON (first 10k chars)</label>
                     <textarea readOnly value={importPreview.slice(0, 10000)} className="w-full h-40 p-3 border rounded text-xs font-mono" />
                  </div>
               )}
            </div>
      </div>
    </div>
  );
}
