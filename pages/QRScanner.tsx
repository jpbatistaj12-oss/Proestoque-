
import React, { useState } from 'react';
import { QrCode, Camera, Search, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (id: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [manualId, setManualId] = useState('');

  const handleManualSearch = () => {
    if (manualId) onScan(manualId.toUpperCase());
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pt-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Scanner de Chapas</h2>
        <p className="text-slate-500 text-sm">Aponte a câmera para o QR Code da etiqueta na chapa.</p>
      </div>

      <div className="relative aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200">
        <div className="absolute inset-0 flex items-center justify-center">
           {/* In a real environment we would use a camera stream here */}
           <div className="text-center space-y-4 px-10">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Camera size={40} className="text-slate-600" />
              </div>
              <p className="text-xs text-slate-400">Aguardando câmera ou simulação de leitura...</p>
           </div>
        </div>
        
        {/* Scanning Overlay UI */}
        <div className="absolute inset-0 border-[40px] border-black/40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)]">
           <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
           <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
           <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
           <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
           <div className="absolute w-full h-0.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,1)] top-1/2 animate-scan"></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Problemas com a câmera?</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Digite o código (ex: CHP-001)" 
            className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase font-bold"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
          />
          <button 
            onClick={handleManualSearch}
            className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Search size={24} />
          </button>
        </div>
      </div>

      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
        <AlertCircle className="text-amber-500 shrink-0" size={20} />
        <p className="text-[11px] text-amber-700 leading-tight">
          Para melhor leitura, limpe a lente da câmera e garanta boa iluminação na área de estoque. 
          O QR Code deve estar em superfície plana.
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
