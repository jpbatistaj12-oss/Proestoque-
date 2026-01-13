
import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, Search, AlertCircle, X, RotateCcw, MonitorOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (id: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [manualId, setManualId] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Navegador não suporta acesso à câmera.");
      setHasCamera(false);
      return;
    }

    // Lista de tentativas em ordem de preferência
    const attempts = [
      { video: { facingMode: 'environment' }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false }
    ];

    let stream = null;
    let lastError = null;

    for (const constraints of attempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
        console.warn("Tentativa de câmera falhou para:", constraints, err);
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Tenta dar play e garante que o estado de "tem câmera" seja setado apenas se o vídeo carregar
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Erro ao iniciar play:", e));
          setHasCamera(true);
        };
      }
    } else {
      setHasCamera(false);
      if (lastError instanceof Error) {
        if (lastError.name === 'NotAllowedError') {
          setCameraError("Permissão de câmera negada. Por favor, autorize o acesso.");
        } else if (lastError.name === 'NotFoundError') {
          setCameraError("Nenhuma câmera detectada neste dispositivo.");
        } else {
          setCameraError("Erro ao acessar câmera. Tente digitar o código manualmente.");
        }
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleManualSearch = () => {
    if (manualId) {
      // Normaliza para o formato 0001 se for apenas número
      const formatted = manualId.padStart(4, '0');
      onScan(formatted);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-2 pb-10 animate-fadeIn px-2">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Scanner de Chapas</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Aponte para o QR Code na etiqueta</p>
      </div>

      <div className="relative aspect-square bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
        {hasCamera ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center space-y-4 px-10">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                {cameraError?.includes("Nenhuma") ? <MonitorOff size={32} className="text-slate-500" /> : <Camera size={32} className="text-slate-600" />}
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-white font-black uppercase tracking-widest leading-relaxed">
                  {cameraError || "Iniciando câmera..."}
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">
                  Você pode usar a busca manual abaixo se preferir.
                </p>
              </div>
              <button 
                onClick={startCamera}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <RotateCcw size={14} /> Tentar Novamente
              </button>
            </div>
          </div>
        )}
        
        {/* Scanning Overlay UI */}
        {hasCamera && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[30px] sm:border-[50px] border-black/40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 border-2 border-blue-500 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)]">
               <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
               <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
               <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
               <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
               <div className="absolute w-full h-0.5 bg-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,1)] top-1/2 animate-scan"></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Problemas com o scanner?</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Digite o Nº (ex: 0001)" 
            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 uppercase font-black text-sm outline-none transition-all"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
          />
          <button 
            onClick={handleManualSearch}
            className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-95"
          >
            <Search size={22} />
          </button>
        </div>
      </div>

      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start">
        <AlertCircle className="text-blue-500 shrink-0" size={18} />
        <p className="text-[10px] text-blue-800 font-bold leading-tight uppercase tracking-tight">
          Certifique-se de que o QR Code está bem iluminado e centralizado no quadrado azul.
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
