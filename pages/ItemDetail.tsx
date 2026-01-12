
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, Point, User } from '../types';
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { 
  ArrowLeft, Scissors, Printer, Plus, Undo2, Trash2, MapPin, 
  CheckCircle2, X as XIcon, Zap, ChevronLeft, ChevronRight,
  Maximize, Move, MapPinned, Info, Target, Camera, Image as ImageIcon,
  Gauge as GaugeIcon, Activity
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ItemDetailProps {
  itemId: string;
  companyId: string;
  onBack: () => void;
  onUpdate: () => void;
}

const calculateDistance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const calculatePolygonArea = (points: Point[]): number => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 20000; // cm² para m²
};

const UsageGauge: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage > 70) return '#10b981'; // Emerald-500
    if (percentage > 25) return '#3b82f6'; // Blue-500
    return '#ef4444'; // Red-500
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <svg className="w-28 h-28 transform -rotate-90">
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke={getColor()}
          strokeWidth="10"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-in-out' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-2xl font-black text-slate-900 leading-none">{Math.round(percentage)}%</span>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Livre</span>
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
        <Activity size={10} className="text-blue-500" /> Status da Chapa
      </p>
    </div>
  );
};

const ShapeRenderer: React.FC<{ 
  points: Point[], 
  containerW: number, 
  containerH: number,
  originalW: number,
  originalH: number,
  label?: string,
  showMeasurements?: boolean,
  className?: string
}> = ({ points, containerW, containerH, originalW, originalH, label, showMeasurements, className = "" }) => {
  const maxDim = Math.max(originalW, originalH, 1);
  const scale = (containerW - 40) / maxDim;
  const offsetX = (containerW - originalW * scale) / 2;
  const offsetY = (containerH - originalH * scale) / 2;

  const pointsString = points.map(p => `${offsetX + p.x * scale},${offsetY + p.y * scale}`).join(' ');

  return (
    <div className={`bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner overflow-hidden flex flex-col items-center ${className}`}>
      <svg width={containerW} height={containerH} className="drop-shadow-2xl overflow-visible">
        <defs>
          <pattern id="blueprint" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint)" />
        {points.length > 0 && (
          <polygon 
            points={pointsString} 
            fill="rgba(59, 130, 246, 0.15)" 
            stroke="#3b82f6" 
            strokeWidth="2.5" 
            strokeLinejoin="round"
          />
        )}
        {showMeasurements && points.length > 1 && points.map((p, i) => {
          const nextP = points[(i + 1) % points.length];
          const midX = offsetX + ((p.x + nextP.x) / 2) * scale;
          const midY = offsetY + ((p.y + nextP.y) / 2) * scale;
          const dist = Math.round(calculateDistance(p, nextP));
          if (dist < 10) return null;
          return (
            <g key={i}>
              <rect x={midX - 16} y={midY - 9} width="32" height="18" rx="6" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x={midX} y={midY + 4} fill="white" fontSize="10" fontWeight="900" textAnchor="middle">{dist}</text>
            </g>
          );
        })}
      </svg>
      {label && <p className="text-[10px] text-slate-500 mt-3 uppercase font-black tracking-[0.2em]">{label}</p>}
    </div>
  );
};

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, companyId, onBack, onUpdate }) => {
  const [item, setItem] = useState<InventoryItem | undefined>();
  const [showCutModal, setShowCutModal] = useState(false);
  const [cutProject, setCutProject] = useState('');
  const [cutClientName, setCutClientName] = useState('');
  const [cutInstallationLocation, setCutInstallationLocation] = useState('');
  const [cutLocationOnSlab, setCutLocationOnSlab] = useState('');
  const [cutNewSlabLocation, setCutNewSlabLocation] = useState('');
  const [cutPiecePhoto, setCutPiecePhoto] = useState<string | undefined>();
  const [cutLeftoverPhoto, setCutLeftoverPhoto] = useState<string | undefined>();
  
  const [user, setUser] = useState<User | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const wasDraggingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoType, setActivePhotoType] = useState<'piece' | 'leftover' | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    const foundItem = getItemById(itemId, companyId);
    if (foundItem) {
      setItem(foundItem);
      setCutNewSlabLocation(foundItem.location || '');
    }
  }, [itemId, companyId]);

  const getCanvasCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current || !item) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const size = window.innerWidth < 640 ? 250 : 300;
    const scale = (size - 30) / Math.max(item.currentWidth, item.currentHeight);
    const ox = (size - item.currentWidth * scale) / 2;
    const oy = (size - item.currentHeight * scale) / 2;
    return { 
      x: Math.max(0, Math.min(item.currentWidth, Math.round((rawX - ox) / scale))), 
      y: Math.max(0, Math.min(item.currentHeight, Math.round((rawY - oy) / scale))) 
    };
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (draggingIdx === null) return;
    const coords = getCanvasCoords(e);
    if (coords) {
        wasDraggingRef.current = true;
        setDrawingPoints(prev => {
            const up = [...prev];
            up[draggingIdx] = coords;
            return up;
        });
    }
  };

  useEffect(() => {
    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', () => setDraggingIdx(null));
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [draggingIdx]);

  if (!item) return <div className="p-20 text-center font-black text-slate-400">Carregando dados...</div>;

  const currentArea = calculatePolygonArea(drawingPoints);
  const areaUsed = item.availableArea - currentArea;
  const usagePercentage = (item.availableArea / (item.totalArea || 1)) * 100;

  const handleRegisterCut = (isTotal: boolean = false) => {
    if (!isTotal && drawingPoints.length < 3) return alert('Desenhe a geometria da sobra na chapa.');
    if (!cutProject || !cutClientName) return alert('Preencha o Nome do Cliente e o Projeto.');
    if (!user) return;

    const finalPoints = isTotal ? [] : drawingPoints;
    const finalArea = isTotal ? 0 : Number(currentArea.toFixed(4));
    const usedArea = isTotal ? item.availableArea : Number((item.availableArea - currentArea).toFixed(4));

    const newHistory: CutHistoryRecord = {
      id: `CUT-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      project: cutProject,
      clientName: cutClientName,
      installationLocation: cutInstallationLocation,
      cutLocationOnSlab: cutLocationOnSlab,
      areaUsed: usedArea,
      leftoverWidth: isTotal ? 0 : Math.max(...finalPoints.map(p => p.x)),
      leftoverHeight: isTotal ? 0 : Math.max(...finalPoints.map(p => p.y)),
      leftoverPoints: finalPoints,
      piecePhoto: cutPiecePhoto,
      leftoverPhoto: cutLeftoverPhoto,
      operatorId: user.id,
      operatorName: user.name
    };

    const updatedItem: InventoryItem = {
      ...item,
      currentWidth: newHistory.leftoverWidth,
      currentHeight: newHistory.leftoverHeight,
      shapePoints: finalPoints,
      availableArea: finalArea,
      status: isTotal || finalArea < 0.05 ? StockStatus.FINALIZADA : StockStatus.COM_SOBRA,
      history: [newHistory, ...item.history],
      photos: cutLeftoverPhoto ? [cutLeftoverPhoto, ...item.photos].slice(0, 5) : item.photos,
      lastUpdatedAt: new Date().toISOString()
    };

    saveItem(updatedItem);
    setItem(updatedItem);
    setShowCutModal(false);
    onUpdate();
  };

  return (
    <div className="pb-10 animate-fadeIn max-w-7xl mx-auto px-2 sm:px-4">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">Painel de Estoque</span>
        </button>
        <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-all"><Printer size={20} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Card Principal de Detalhes */}
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-[45%] p-6 bg-slate-50/50 space-y-6 border-r border-slate-50 flex flex-col items-center">
              <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden shadow-sm border-4 border-white group">
                <img src={item.photos[activePhotoIdx]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                {item.photos.length > 1 && (
                   <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => setActivePhotoIdx(p => (p-1+item.photos.length)%item.photos.length)} className="p-2.5 bg-white/95 rounded-xl shadow-xl text-slate-900 active:scale-90"><ChevronLeft size={20}/></button>
                     <button onClick={() => setActivePhotoIdx(p => (p+1)%item.photos.length)} className="p-2.5 bg-white/95 rounded-xl shadow-xl text-slate-900 active:scale-90"><ChevronRight size={20}/></button>
                   </div>
                )}
              </div>
              <ShapeRenderer points={item.shapePoints || []} containerW={220} containerH={220} originalW={item.currentWidth} originalH={item.currentHeight} label="Geometria da Chapa" showMeasurements className="w-full" />
            </div>
            
            <div className="flex-1 p-8 sm:p-12 space-y-10">
              <div className="flex justify-between items-start gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">{item.commercialName}</h2>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">{item.category} • ID: {item.id}</p>
                </div>
                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border-2 shrink-0 ${STATUS_COLORS[item.status]}`}>{item.status}</div>
              </div>

              <div className="grid grid-cols-2 gap-8 relative border-t border-slate-50 pt-10">
                 <div className="space-y-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Medidas em Estoque</p>
                      <p className="text-xl font-black text-blue-600 leading-none">{item.currentWidth} × {item.currentHeight} cm</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Área Livre (m²)</p>
                      <p className="text-xl font-black text-emerald-600 leading-none">{item.availableArea.toFixed(3)} m²</p>
                    </div>
                    <div className="space-y-1.5">
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cavalete / Local</p>
                       <p className="text-sm font-black text-slate-900 flex items-center gap-2"><MapPin size={16} className="text-red-500" /> {item.location || 'Não informado'}</p>
                    </div>
                 </div>
                 <div className="flex items-center justify-center">
                    <UsageGauge percentage={usagePercentage} />
                 </div>
              </div>
            </div>
          </div>

          {/* Histórico de Produção */}
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-10"><Scissors size={24} className="text-blue-500" /> Linha de Produção</h3>
             <div className="space-y-6">
               {item.history.length > 0 ? item.history.map(log => (
                 <div key={log.id} className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                    <ShapeRenderer points={log.leftoverPoints || []} containerW={100} containerH={100} originalW={log.leftoverWidth || item.originalWidth} originalH={log.leftoverHeight || item.originalHeight} className="!p-1 !rounded-2xl" />
                    <div className="flex-1 text-center sm:text-left">
                       <p className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{log.project}</p>
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Cliente: {log.clientName}</p>
                       <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Operador: {log.operatorName}</p>
                    </div>
                    <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-8">
                       <p className="text-xl font-black text-red-500 leading-none">-{log.areaUsed.toFixed(3)} m²</p>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{log.date}</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-16 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                   <p className="text-slate-300 font-black uppercase text-xs tracking-[0.3em]">Nenhuma operação registrada nesta chapa.</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Lado Direito: Identidade Visual e QR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center sticky top-8">
             <div className="p-6 bg-slate-50 rounded-[2.5rem] shadow-inner mb-8">
               <QRCodeSVG value={`MARM-ID:${item.id}`} size={180} />
             </div>
             <p className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">{item.id}</p>
             <div className="bg-slate-900 text-white w-full py-5 rounded-2xl font-black text-2xl shadow-2xl uppercase text-center mb-8">{item.currentWidth} × {item.currentHeight}</div>
             
             {item.status !== StockStatus.FINALIZADA && (
                <button onClick={() => { setShowCutModal(true); setDrawingPoints([]); }} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-4 hover:bg-blue-700 shadow-xl active:scale-95 transition-all text-lg group">
                  <Scissors size={24} className="group-hover:rotate-12 transition-transform" /> NOVO REGISTRO DE CORTE
                </button>
             )}
          </div>
        </div>
      </div>

      {/* Modal de Corte - Design Refinado para não "cortar" */}
      {showCutModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-2 sm:p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-7xl overflow-hidden shadow-2xl flex flex-col lg:flex-row animate-popIn border border-white/10 max-h-[95vh] relative">
              <button onClick={() => setShowCutModal(false)} className="absolute top-6 right-6 z-[220] p-3 bg-white rounded-2xl shadow-xl text-slate-400 hover:text-red-500 transition-all active:scale-90"><XIcon size={28} /></button>
              
              {/* Esquerda: Área de Desenho Técnica */}
              <div className="bg-slate-900 lg:w-[45%] p-8 flex flex-col min-h-0 border-r border-white/5">
                 <h3 className="text-white text-xl font-black uppercase tracking-tight flex items-center gap-4 mb-8 shrink-0"><Move size={24} className="text-blue-500" /> Geometria da Sobra</h3>
                 <div className="flex-1 flex items-center justify-center bg-slate-950/50 rounded-[2.5rem] border border-white/5 shadow-inner relative overflow-hidden group">
                    <svg ref={svgRef} width={window.innerWidth < 640 ? 250 : 350} height={window.innerWidth < 640 ? 250 : 350} onClick={(e) => {
                      const coords = getCanvasCoords(e);
                      if (coords) setDrawingPoints([...drawingPoints, coords]);
                    }} className="cursor-crosshair overflow-visible z-10">
                       {drawingPoints.length > 0 && (
                          <>
                            <polygon points={drawingPoints.map(p => {
                               const s = window.innerWidth < 640 ? 250 : 350;
                               const sc = (s-30)/Math.max(item.currentWidth, item.currentHeight);
                               return `${((s-item.currentWidth*sc)/2) + p.x*sc},${((s-item.currentHeight*sc)/2) + p.y*sc}`;
                            }).join(' ')} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="4" strokeLinejoin="round" />
                            {drawingPoints.map((p, i) => {
                               const s = window.innerWidth < 640 ? 250 : 350;
                               const sc = (s-30)/Math.max(item.currentWidth, item.currentHeight);
                               return <circle key={i} cx={((s-item.currentWidth*sc)/2) + p.x*sc} cy={((s-item.currentHeight*sc)/2) + p.y*sc} r={draggingIdx === i ? 14 : 9} fill={draggingIdx === i ? "#60a5fa" : "#3b82f6"} className="stroke-slate-950 stroke-[4px] cursor-grab active:cursor-grabbing transition-all shadow-xl" onMouseDown={(e) => { e.stopPropagation(); setDraggingIdx(i); }} />;
                            })}
                          </>
                       )}
                    </svg>
                    <div className="absolute top-6 left-6 px-4 py-2 bg-slate-900/80 backdrop-blur rounded-xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest">
                       {item.currentWidth} × {item.currentHeight} cm
                    </div>
                 </div>
                 <div className="flex gap-4 mt-8 shrink-0">
                    <button onClick={() => setDrawingPoints(p => p.slice(0,-1))} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all"><Undo2 size={18}/> Desfazer Ponto</button>
                    <button onClick={() => setDrawingPoints([])} className="flex-1 bg-slate-800 text-red-400 py-4 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all"><Trash2 size={18}/> Limpar Tudo</button>
                 </div>
              </div>

              {/* Direita: Dados da Produção */}
              <div className="lg:w-[55%] flex flex-col h-full bg-slate-50 min-h-0">
                 <div className="flex-1 p-8 sm:p-12 overflow-y-auto space-y-8 pb-32">
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 uppercase leading-none tracking-tighter">Ficha de Corte</h3>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Documentação técnica do consumo</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peça Saindo</label>
                          <button onClick={() => { setActivePhotoType('piece'); fileInputRef.current?.click(); }} className="w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm">
                             {cutPiecePhoto ? <img src={cutPiecePhoto} className="w-full h-full object-cover" /> : <Camera size={28} className="text-slate-300" />}
                          </button>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sobras Cavalete</label>
                          <button onClick={() => { setActivePhotoType('leftover'); fileInputRef.current?.click(); }} className="w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm">
                             {cutLeftoverPhoto ? <img src={cutLeftoverPhoto} className="w-full h-full object-cover" /> : <Camera size={28} className="text-slate-300" />}
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome do Cliente</label>
                          <input type="text" placeholder="Ex: João da Silva" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm" value={cutClientName} onChange={e => setCutClientName(e.target.value)} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Projeto / Obra</label>
                          <input type="text" placeholder="Ex: Balcão Cozinha" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm" value={cutProject} onChange={e => setCutProject(e.target.value)} />
                       </div>
                    </div>

                    <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl flex justify-around text-center text-white">
                       <div><p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-2">Área da Sobra</p><p className="text-3xl font-black">{currentArea.toFixed(3)} m²</p></div>
                       <div className="w-px bg-white/20"></div>
                       <div><p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-2">Consumo Real</p><p className="text-3xl font-black">{(areaUsed).toFixed(3)} m²</p></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <input type="text" placeholder="Local do Corte na Chapa" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={cutLocationOnSlab} onChange={e => setCutLocationOnSlab(e.target.value)} />
                       <input type="text" placeholder="Nova Posição (Ex: Cavalete 5)" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={cutNewSlabLocation} onChange={e => setCutNewSlabLocation(e.target.value)} />
                    </div>
                 </div>

                 {/* Botões de Finalização Fixos no Rodapé */}
                 <div className="p-8 bg-white border-t border-slate-100 space-y-3 shrink-0 absolute bottom-0 inset-x-0 lg:relative">
                    <button onClick={() => handleRegisterCut(false)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 text-sm active:scale-95">
                       <CheckCircle2 size={24} /> FINALIZAR CORTE E ATUALIZAR ESTOQUE
                    </button>
                    <button onClick={() => handleRegisterCut(true)} className="w-full bg-slate-50 text-slate-400 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all">
                       <Zap size={16} /> USO TOTAL DA CHAPA (SEM SOBRAS)
                    </button>
                 </div>
              </div>
           </div>
           {/* Input de Arquivo Oculto */}
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                    if (activePhotoType === 'piece') setCutPiecePhoto(ev.target?.result as string);
                    else setCutLeftoverPhoto(ev.target?.result as string);
                 };
                 reader.readAsDataURL(file);
              }
           }} />
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
