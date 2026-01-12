
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, Point, User } from '../types';
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { 
  ArrowLeft, Scissors, Printer, Plus, Undo2, Trash2, MapPin, 
  CheckCircle2, X as XIcon, Zap, ChevronLeft, ChevronRight,
  Maximize, Move, MapPinned, Info, Target, Camera, Image as ImageIcon,
  Gauge as GaugeIcon
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
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage > 60) return '#10b981'; // Verde
    if (percentage > 20) return '#3b82f6'; // Azul
    return '#ef4444'; // Vermelho
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
      <svg className="w-20 h-20 transform -rotate-90">
        <circle cx="40" cy="40" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
        <circle
          cx="40" cy="40" r={radius}
          stroke={getColor()}
          strokeWidth="6"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'all 1s ease' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-lg font-black text-slate-900 leading-none">{Math.round(percentage)}%</span>
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Livre</span>
      </div>
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
  const scale = (containerW - 30) / maxDim;
  const offsetX = (containerW - originalW * scale) / 2;
  const offsetY = (containerH - originalH * scale) / 2;

  const pointsString = points.map(p => `${offsetX + p.x * scale},${offsetY + p.y * scale}`).join(' ');

  return (
    <div className={`bg-slate-900 rounded-2xl p-3 border border-slate-800 shadow-inner overflow-hidden flex flex-col items-center ${className}`}>
      <svg width={containerW} height={containerH} className="overflow-visible">
        <defs>
          <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {points.length > 0 && (
          <polygon points={pointsString} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
        )}
        {showMeasurements && points.length > 1 && points.map((p, i) => {
          const nextP = points[(i + 1) % points.length];
          const midX = offsetX + ((p.x + nextP.x) / 2) * scale;
          const midY = offsetY + ((p.y + nextP.y) / 2) * scale;
          const dist = Math.round(calculateDistance(p, nextP));
          if (dist < 10) return null;
          return (
            <g key={i}>
              <rect x={midX - 14} y={midY - 8} width="28" height="16" rx="4" fill="#0f172a" stroke="rgba(255,255,255,0.1)" />
              <text x={midX} y={midY + 3.5} fill="white" fontSize="9" fontWeight="900" textAnchor="middle">{dist}</text>
            </g>
          );
        })}
      </svg>
      {label && <p className="text-[9px] text-slate-500 mt-2 uppercase font-black tracking-widest">{label}</p>}
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

  if (!item) return <div className="p-20 text-center font-black text-slate-400">Carregando...</div>;

  const currentArea = calculatePolygonArea(drawingPoints);
  const areaUsed = item.availableArea - currentArea;
  const usagePercentage = (item.availableArea / (item.totalArea || 1)) * 100;

  const handleRegisterCut = (isTotal: boolean = false) => {
    if (!isTotal && drawingPoints.length < 3) return alert('Desenhe a sobra na chapa.');
    if (!cutProject || !cutClientName) return alert('Preencha os campos obrigatórios.');
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
    <div className="pb-10 animate-fadeIn max-w-7xl mx-auto px-2">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">Estoque</span>
        </button>
        <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400 hover:text-slate-900"><Printer size={20} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-[40%] p-4 bg-slate-50/50 space-y-4 border-r border-slate-50">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-sm border-2 border-white group">
                <img src={item.photos[activePhotoIdx]} className="w-full h-full object-cover" />
                {item.photos.length > 1 && (
                   <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => setActivePhotoIdx(p => (p-1+item.photos.length)%item.photos.length)} className="p-2 bg-white/90 rounded-xl shadow-lg"><ChevronLeft size={16}/></button>
                     <button onClick={() => setActivePhotoIdx(p => (p+1)%item.photos.length)} className="p-2 bg-white/90 rounded-xl shadow-lg"><ChevronRight size={16}/></button>
                   </div>
                )}
              </div>
              <ShapeRenderer points={item.shapePoints || []} containerW={200} containerH={200} originalW={item.currentWidth} originalH={item.currentHeight} label="Geometria Atual" showMeasurements className="!p-2" />
            </div>
            
            <div className="flex-1 p-6 sm:p-10 space-y-8">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{item.commercialName}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{item.category} • {item.id}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 shrink-0 ${STATUS_COLORS[item.status]}`}>{item.status}</div>
              </div>

              <div className="grid grid-cols-2 gap-6 relative">
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-400 font-black uppercase">Medidas Úteis</p>
                      <p className="text-lg font-black text-blue-600 leading-none">{item.currentWidth} × {item.currentHeight} cm</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-400 font-black uppercase">Disponível</p>
                      <p className="text-lg font-black text-emerald-600 leading-none">{item.availableArea.toFixed(2)} m²</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] text-slate-400 font-black uppercase">Localização</p>
                       <p className="text-xs font-black text-slate-900 flex items-center gap-1"><MapPin size={12} className="text-red-500" /> {item.location || 'Não informado'}</p>
                    </div>
                 </div>
                 <div className="flex items-center justify-center border-t border-slate-50 pt-4">
                    <UsageGauge percentage={usagePercentage} />
                 </div>
              </div>
            </div>
          </div>

          {/* Histórico Compactado */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-3 mb-8"><Scissors size={20} className="text-blue-500" /> Histórico de Produção</h3>
             <div className="space-y-4">
               {item.history.length > 0 ? item.history.map(log => (
                 <div key={log.id} className="flex items-center gap-6 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <ShapeRenderer points={log.leftoverPoints || []} containerW={80} containerH={80} originalW={log.leftoverWidth || item.originalWidth} originalH={log.leftoverHeight || item.originalHeight} className="!p-1 !rounded-xl" />
                    <div className="flex-1">
                       <p className="text-sm font-black text-slate-900 uppercase">{log.project}</p>
                       <p className="text-[9px] text-blue-600 font-black uppercase">{log.clientName}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-red-500">-{log.areaUsed.toFixed(2)} m²</p>
                       <p className="text-[9px] text-slate-400 font-bold">{log.date}</p>
                    </div>
                 </div>
               )) : <p className="text-center py-10 text-slate-300 font-black uppercase text-[10px]">Sem registros de corte.</p>}
             </div>
          </div>
        </div>

        {/* Lado Direito: Identidade */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit sticky top-6 flex flex-col items-center">
           <QRCodeSVG value={`MARM:${item.id}`} size={160} className="mb-6" />
           <p className="text-2xl font-black text-slate-900 mb-1">{item.id}</p>
           <div className="bg-slate-900 text-white w-full py-4 rounded-2xl font-black text-xl shadow-lg uppercase text-center mb-6">{item.currentWidth} × {item.currentHeight}</div>
           {item.status !== StockStatus.FINALIZADA && (
              <button onClick={() => { setShowCutModal(true); setDrawingPoints([]); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl active:scale-95 transition-all">
                <Scissors size={20} /> NOVO CORTE
              </button>
           )}
        </div>
      </div>

      {/* Modal de Corte Refinado para não cortar */}
      {showCutModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-2 sm:p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-7xl overflow-hidden shadow-2xl flex flex-col lg:flex-row animate-popIn border border-white/10 max-h-[95vh] relative">
              <button onClick={() => setShowCutModal(false)} className="absolute top-4 right-4 z-[220] p-2 bg-white rounded-2xl shadow-xl text-slate-400 hover:text-slate-900"><XIcon size={24} /></button>
              
              {/* Lado Esquerdo: Desenho (Fixado) */}
              <div className="bg-slate-900 lg:w-[45%] p-6 flex flex-col min-h-0 border-r border-white/5 overflow-y-auto lg:overflow-visible">
                 <h3 className="text-white text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-3 mb-6 shrink-0"><Move size={18} className="text-blue-500" /> Geometria da Sobra</h3>
                 <div className="flex-1 flex items-center justify-center bg-slate-950/50 rounded-[2rem] border border-white/5 shadow-inner min-h-[260px] mb-4 relative overflow-hidden">
                    <svg ref={svgRef} width={window.innerWidth < 640 ? 250 : 300} height={window.innerWidth < 640 ? 250 : 300} onClick={(e) => {
                      const coords = getCanvasCoords(e);
                      if (coords) setDrawingPoints([...drawingPoints, coords]);
                    }} className="cursor-crosshair overflow-visible">
                       {drawingPoints.length > 0 && (
                          <>
                            <polygon points={drawingPoints.map(p => {
                               const s = window.innerWidth < 640 ? 250 : 300;
                               const sc = (s-30)/Math.max(item.currentWidth, item.currentHeight);
                               return `${((s-item.currentWidth*sc)/2) + p.x*sc},${((s-item.currentHeight*sc)/2) + p.y*sc}`;
                            }).join(' ')} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="3" />
                            {drawingPoints.map((p, i) => {
                               const s = window.innerWidth < 640 ? 250 : 300;
                               const sc = (s-30)/Math.max(item.currentWidth, item.currentHeight);
                               return <circle key={i} cx={((s-item.currentWidth*sc)/2) + p.x*sc} cy={((s-item.currentHeight*sc)/2) + p.y*sc} r={draggingIdx === i ? 12 : 8} fill={draggingIdx === i ? "#60a5fa" : "#3b82f6"} className="stroke-slate-950 stroke-[3px] cursor-grab" onMouseDown={(e) => { e.stopPropagation(); setDraggingIdx(i); }} />;
                            })}
                          </>
                       )}
                    </svg>
                 </div>
                 <div className="flex gap-2 shrink-0">
                    <button onClick={() => setDrawingPoints(p => p.slice(0,-1))} className="bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><Undo2 size={14}/> Desfazer</button>
                    <button onClick={() => setDrawingPoints([])} className="bg-slate-800 text-red-400 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><Trash2 size={14}/> Limpar</button>
                 </div>
              </div>

              {/* Lado Direito: Formulário (Scroll Independente) */}
              <div className="lg:w-[55%] flex flex-col h-full bg-slate-50 min-h-0">
                 <div className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-6 pb-28 lg:pb-10">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase leading-none">Registro Técnico</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Dados da chapa e produção</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto da Peça</label>
                          <button onClick={() => { setActivePhotoType('piece'); fileInputRef.current?.click(); }} className="w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                             {cutPiecePhoto ? <img src={cutPiecePhoto} className="w-full h-full object-cover" /> : <Camera size={20} className="text-slate-300" />}
                          </button>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto da Sobra</label>
                          <button onClick={() => { setActivePhotoType('leftover'); fileInputRef.current?.click(); }} className="w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                             {cutLeftoverPhoto ? <img src={cutLeftoverPhoto} className="w-full h-full object-cover" /> : <Camera size={20} className="text-slate-300" />}
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" placeholder="Cliente" className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" value={cutClientName} onChange={e => setCutClientName(e.target.value)} />
                       <input type="text" placeholder="Projeto (Pia, Escada...)" className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" value={cutProject} onChange={e => setCutProject(e.target.value)} />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex justify-around text-center">
                       <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Área da Sobra</p><p className="text-xl font-black text-slate-900">{currentArea.toFixed(3)} m²</p></div>
                       <div className="w-px bg-blue-100"></div>
                       <div><p className="text-[8px] font-black text-red-500 uppercase mb-1">Consumo Real</p><p className="text-xl font-black text-red-600">{(areaUsed).toFixed(3)} m²</p></div>
                    </div>

                    <div className="space-y-3">
                       <input type="text" placeholder="Localização do Corte (ex: Canto Direito)" className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={cutLocationOnSlab} onChange={e => setCutLocationOnSlab(e.target.value)} />
                       <input type="text" placeholder="Nova Posição no Cavalete" className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={cutNewSlabLocation} onChange={e => setCutNewSlabLocation(e.target.value)} />
                    </div>
                 </div>

                 <div className="p-6 bg-white border-t border-slate-100 space-y-3 shrink-0">
                    <button onClick={() => handleRegisterCut(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                       <CheckCircle2 size={20} /> SALVAR CORTE E SOBRA
                    </button>
                    <button onClick={() => handleRegisterCut(true)} className="w-full bg-slate-100 text-slate-500 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                       <Zap size={14} /> USO TOTAL (SEM SOBRA)
                    </button>
                 </div>
              </div>
           </div>
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
