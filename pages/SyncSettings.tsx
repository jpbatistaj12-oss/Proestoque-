
import React, { useRef } from 'react';
import { Download, Upload, Cloud, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import { exportDatabaseAsFile, restoreDatabaseFromJSON } from '../services/storageService';

const SyncSettings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (restoreDatabaseFromJSON(content)) {
          alert("Dados sincronizados com sucesso! O sistema irá reiniciar.");
          window.location.reload();
        } else {
          alert("Arquivo inválido. Use apenas arquivos .json gerados pelo sistema.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fadeIn space-y-8">
      <div className="flex items-center gap-5 mb-4">
        <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-500/20">
          <RefreshCw size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Sincronização</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Mova seus dados entre diferentes navegadores</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 flex gap-6 items-start shadow-sm">
        <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
          <Info size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Importante: Armazenamento Local</h4>
          <p className="text-sm font-medium text-amber-800 leading-relaxed">
            Seus dados são salvos de forma privada no seu navegador atual. Se você planeja usar o sistema em outro computador ou navegador (ex: trocar de Chrome para Edge), você deve baixar o backup aqui e restaurá-lo lá.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <Download size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">Exportar Dados</h3>
            <p className="text-xs text-slate-500 font-medium">Gere um arquivo com todo o seu estoque, equipe e histórico para levar para outro lugar.</p>
          </div>
          <button 
            onClick={exportDatabaseAsFile}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Download size={18} /> Baixar Backup (.json)
          </button>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">Importar Dados</h3>
            <p className="text-xs text-slate-500 font-medium">Carregue um arquivo de backup para atualizar este navegador com os dados de outro dispositivo.</p>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Upload size={18} /> Restaurar Backup
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5 text-center md:text-left">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
            <ShieldCheck size={32} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-tight">Segurança de Dados</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Seus dados nunca saem do seu controle.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
          <Cloud size={16} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Offline First Mode</span>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;
