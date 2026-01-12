
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, Point, User } from '../types';
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { 
  ArrowLeft, Scissors, Printer, Plus, Undo2, Trash2, Ruler, Eye, MapPin, 
  CheckCircle2, X as XIcon, Zap, MousePointerClick, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ItemDetailProps {
  itemId: string;
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

const ShapeRenderer: React.FC<{ 
  points: Point[], 
  containerW: number, 
  containerH: number,
  originalW: number,
  originalH: number,
  label?: string,
  showMeasurements?: boolean,
  highlightColor?: string,
  className?: string
}> = ({ points, containerW, containerH, originalW, originalH, label, showMeasurements, highlightColor = "#3b82f6", className = "" }) => {
  const maxDim = Math.max(originalW, originalH, 1);
  const scale = (containerW - 40) / maxDim;
  const offsetX = (containerW - originalW * scale) / 2;
  const offsetY = (containerH - originalH * scale) / 2;

  const pointsString = points.map(p => `${offsetX + p.x * scale},${offsetY + p.y * scale}`).join(' ');

  return (
    <div className={`bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner overflow-hidden flex flex-col items-center ${className}`}>
      <svg width={containerW} height={containerH} className="drop-shadow-2xl overflow-visible">
        <defs>
          <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        
        {points.length > 0 && (
          <polygon 
            points={pointsString} 
            fill={`${highlightColor}1A`} 
            stroke={highlightColor} 
            strokeWidth="2.5" 
            strokeLinejoin="round"
          />
        )}

        {showMeasurements && points.length > 1 && points.map((p, i) => {
          const nextP = points[(i + 1) % points.length];
          const midX = offsetX + ((p.x + nextP.x) / 2) * scale;
          const midY = offsetY + ((p.y + nextP.y) / 2) * scale;
          const dist = calculateDistance(p, nextP);
          if (dist < 8) return null;

          return (
            <g key={i}>
              <rect x={midX - 16} y={midY - 9} width="32" height="18" rx="6" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x={midX} y={midY + 4} fill="white" fontSize="10" fontWeight="900" textAnchor="middle">{Math.round(dist)}</text>
            </g>
          );
        })}
      </svg>
      {label && <p className="text-[10px] text-slate-400 mt-3 uppercase font-black tracking-[0.2em]">{label}</p>}
    </div>
  );
};

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, onBack, onUpdate }) => {
  const [item, setItem] = useState<InventoryItem | undefined>();
  const [showCutModal, setShowCutModal] = useState(false);
  const [cutProject, setCutProject] = useState('');
  const [cutClientName, setCutClientName] = useState('');
  const [cutObservations, setCutObservations] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      const foundItem = getItemById(itemId, currentUser.companyId);
      if (foundItem) setItem(foundItem);
    }
  }, [itemId]);

  if (!item) return <div className="p-10 text-center font-bold text-slate-500">Material não encontrado.</div>;

  const currentArea = calculatePolygonArea(drawingPoints);
  const areaUsed = Number((item.availableArea - (drawingPoints.length > 0 ? currentArea : 0)).toFixed(4));

  const handleAddPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const maxDim = Math.max(item.currentWidth, item.currentHeight);
    const canvasSize = window.innerWidth < 640 ? 300 : 380;
    const padding = 40;
    const scale = (canvasSize - padding) / maxDim;
    const offsetX = (canvasSize - item.currentWidth * scale) / 2;
    const offsetY = (canvasSize - item.currentHeight * scale) / 2;

    const cmX = Math.max(0, Math.min(item.currentWidth, Math.round((rawX - offsetX) / scale)));
    const cmY = Math.max(0, Math.min(item.currentHeight, Math.round((rawY - offsetY) / scale)));

    // Se o ponto for idêntico ao anterior, ignora para evitar distância zero impossível de editar
    if (drawingPoints.length > 0) {
      const last = drawingPoints[drawingPoints.length - 1];
      if (last.x === cmX && last.y === cmY) return;
    }

    setDrawingPoints(prev => [...prev, { x: cmX, y: cmY }]);
  };

  const updateSegmentLength = (index: number, newLength: number) => {
    if (drawingPoints.length < 2) return;
    const nextIndex = (index + 1) % drawingPoints.length;
    const p1 = drawingPoints[index];
    const p2 = drawingPoints[nextIndex];
    let currentDist = calculateDistance(p1, p2);
    
    const newPoints = [...drawingPoints];
    
    // Se a distância for 0, assumimos uma direção padrão (para a direita) para permitir "crescer" o segmento
    if (currentDist === 0) {
      newPoints[nextIndex] = {
        x: Math.round(p1.x + newLength),
        y: p1.y
      };
    } else {
      const ratio = newLength / currentDist;
      newPoints[nextIndex] = {
        x: Math.round(p1.x + (p2.x - p1.x) * ratio),
        y: Math.round(p1.y + (p2.y - p1.y) * ratio)
      };
    }
    
    // Garante que o ponto não saia dos limites da chapa
    newPoints[nextIndex].x = Math.max(0, Math.min(item.currentWidth, newPoints[nextIndex].x));
    newPoints[nextIndex].y = Math.max(0, Math.min(item.currentHeight, newPoints[nextIndex].y));
    
    setDrawingPoints(newPoints);
  };

  const handleRegisterCut = (isTotal: boolean = false) => {
    if (!isTotal && drawingPoints.length < 3) {
      alert('Desenhe pelo menos 3 pontos para definir a sobra ou clique em "Uso Total".');
      return;
    }
    if (!cutProject || !cutClientName) {
      alert('Por favor, informe o Nome do Cliente e o Projeto.');
      return;
    }
    if (!user) return;

    const finalPoints = isTotal ? [] : drawingPoints;
    const finalArea = isTotal ? 0 : Number(currentArea.toFixed(4));
    const usedArea = isTotal ? item.availableArea : Number((item.availableArea - currentArea).toFixed(4));

    const newHistory: CutHistoryRecord = {
      id: `CUT-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      project: cutProject,
      clientName: cutClientName,
      areaUsed: usedArea,
      leftoverWidth: isTotal ? 0 : Math.max(...finalPoints.map(p => p.x)),
      leftoverHeight: isTotal ? 0 : Math.max(...finalPoints.map(p => p.y)),
      leftoverPoints: finalPoints,
      observations: isTotal ? 'Uso Total da Chapa (Sem sobras)' : cutObservations,
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
      lastOperatorId: user.id,
      lastOperatorName: user.name,
      lastUpdatedAt: new Date().toISOString()
    };

    saveItem(updatedItem);
    setItem(updatedItem);
    setShowCutModal(false);
    onUpdate();
  };

  const nextPhoto = () => {
    if (!item.photos.length) return;
    setActivePhotoIdx((prev) => (prev + 1) % item.photos.length);
  };

  const prevPhoto = () => {
    if (!item.photos.length) return;
    setActivePhotoIdx((prev) => (prev - 1 + item.photos.length) % item.photos.length);
  };

  return (
    <div className="pb-10 animate-fadeIn px-1 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors no-print">
          <ArrowLeft size={18} />
          <span className="font-bold text-xs uppercase tracking-widest">Estoque</span>
        </button>
        <button onClick={() => window.print()} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 no-print shadow-sm">
          <Printer size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 p-4 space-y-4 border-b md:border-b-0 md:border-r border-slate-50 bg-slate-50/50">
                {/* Carrossel de Fotos */}
                <div className="relative aspect-square w-full group">
                  <img 
                    src={item.photos[activePhotoIdx]} 
                    className="w-full h-full object-cover rounded-2xl shadow-sm border-2 border-white transition-all duration-300" 
                    alt={`Foto ${activePhotoIdx + 1}`} 
                  />
                  
                  {item.photos.length > 1 && (
                    <>
                      <button 
                        onClick={prevPhoto} 
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={nextPhoto} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {item.photos.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all ${idx === activePhotoIdx ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-300'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <ShapeRenderer 
                  points={item.shapePoints || []} 
                  containerW={240} 
                  containerH={240}
                  originalW={item.currentWidth || item.originalWidth}
                  originalH={item.currentHeight || item.originalHeight}
                  label="Geometria Atual"
                  showMeasurements
                  className="!p-2 !rounded-2xl"
                />
              </div>
              <div className="md:w-2/3 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-tight">{item.commercialName}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{item.category} • {item.id}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 shrink-0 ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Espessura</p>
                    <p className="font-bold text-slate-700 text-sm">{item.thickness}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Medidas Max</p>
                    <p className="font-black text-blue-600 text-sm">{item.currentWidth}×{item.currentHeight} cm</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Originais</p>
                    <p className="font-bold text-slate-500 text-sm">{item.originalWidth}×{item.originalHeight} cm</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Disponível</p>
                    <p className="font-black text-emerald-600 text-sm">{item.availableArea.toFixed(2)} m²</p>
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Localização</p>
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 text-sm">
                       <MapPin size={12} className="text-red-500" />
                       <span className="truncate">{item.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uso do Material</span>
                    <span className="text-[10px] font-black text-blue-600">{( (item.availableArea / item.totalArea) * 100).toFixed(1)}% RESTANTE</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-700 shadow-sm" style={{ width: `${(item.availableArea / item.totalArea) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                <Scissors size={20} className="text-blue-500" /> Histórico de Produção
              </h3>
              {item.status !== StockStatus.FINALIZADA && (
                <button 
                  onClick={() => { setDrawingPoints([]); setShowCutModal(true); }}
                  className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  <Plus size={16} /> REGISTRAR NOVO CORTE
                </button>
              )}
            </div>

            <div className="space-y-4">
              {item.history.length > 0 ? item.history.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-5 bg-slate-50 rounded-3xl border border-slate-100 items-start sm:items-center group">
                  <div className="w-full sm:w-20 shrink-0">
                     <ShapeRenderer points={log.leftoverPoints || []} containerW={window.innerWidth < 640 ? 100 : 80} containerH={window.innerWidth < 640 ? 100 : 80} originalW={log.leftoverWidth || item.originalWidth} originalH={log.leftoverHeight || item.originalHeight} className="!p-1 !rounded-xl" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 text-base uppercase tracking-tight group-hover:text-blue-600 transition-colors">{log.project}</h4>
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-tight">Cliente: {log.clientName}</p>
                      </div>
                      <div className="text-left sm:text-right bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-100 w-full sm:w-auto">
                        <span className="text-sm font-black text-red-500 block">-{log.areaUsed.toFixed(2)} m²</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SOBRA: {log.leftoverWidth}x{log.leftoverHeight}cm</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma produção registrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center sticky top-24 h-fit">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-[0.2em]">Etiqueta de Oficina</p>
          <div className="p-4 border-4 border-slate-900 rounded-[2.5rem] mb-6 shadow-xl bg-white">
            <QRCodeSVG value={`MARM-ID:${item.id}`} size={160} />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter mb-1">{item.id}</p>
          <p className="text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest">{item.commercialName}</p>
          <div className="bg-slate-900 text-white w-full py-4 rounded-2xl font-black text-xl shadow-lg uppercase tracking-tighter">
            {item.currentWidth} × {item.currentHeight}
          </div>
        </div>
      </div>

      {showCutModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-7xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-full sm:min-h-0 sm:h-[90vh] lg:max-h-[920px] animate-popIn border border-white/10 relative">
            <button onClick={() => setShowCutModal(false)} className="absolute top-4 right-4 z-[110] text-slate-400 hover:text-slate-900 p-2 sm:p-3 bg-white/90 backdrop-blur rounded-2xl transition-all border border-slate-200 shadow-xl">
              <XIcon size={20} />
            </button>

            <div className="bg-slate-900 lg:w-[62%] p-5 sm:p-8 flex flex-col h-full border-r border-white/5 min-h-[500px] sm:min-h-0 overflow-y-auto sm:overflow-hidden">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <div>
                   <h3 className="text-white text-base sm:text-xl font-black uppercase tracking-tight flex items-center gap-3">
                     <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><MousePointerClick size={18} className="text-white" /></div>
                     Mapear Retalho
                   </h3>
                   <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Clique na área abaixo para definir os pontos do retalho</p>
                 </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                   <button onClick={() => setDrawingPoints(prev => prev.slice(0, -1))} className="flex-1 sm:flex-none bg-slate-800 text-slate-300 px-4 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest" disabled={drawingPoints.length === 0}><Undo2 size={14} /> Desfazer</button>
                   <button onClick={() => setDrawingPoints([])} className="flex-1 sm:flex-none bg-slate-800 text-red-400 px-4 py-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest" disabled={drawingPoints.length === 0}><Trash2 size={14} /> Limpar</button>
                 </div>
               </div>
               
               <div className="flex-1 flex items-center justify-center bg-slate-950/40 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-inner min-h-[300px] sm:min-h-0">
                 <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 </div>

                 <svg ref={svgRef} width={window.innerWidth < 640 ? 300 : 380} height={window.innerWidth < 640 ? 300 : 380} className="cursor-crosshair overflow-visible z-10 drop-shadow-2xl" onClick={handleAddPoint}>
                   <rect width="100%" height="100%" fill="transparent" />
                   {drawingPoints.length > 0 && (
                     <>
                      <polygon points={drawingPoints.map(p => {
                          const canvasSize = window.innerWidth < 640 ? 300 : 380;
                          const scale = (canvasSize - 40) / Math.max(item.currentWidth, item.currentHeight);
                          const ox = (canvasSize - item.currentWidth * scale) / 2;
                          const oy = (canvasSize - item.currentHeight * scale) / 2;
                          return `${ox + p.x * scale},${oy + p.y * scale}`;
                        }).join(' ')} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="3" strokeLinejoin="round" />
                      {drawingPoints.map((p, i) => {
                        const canvasSize = window.innerWidth < 640 ? 300 : 380;
                        const scale = (canvasSize - 40) / Math.max(item.currentWidth, item.currentHeight);
                        const ox = (canvasSize - item.currentWidth * scale) / 2;
                        const oy = (canvasSize - item.currentHeight * scale) / 2;
                        const nextP = drawingPoints[(i + 1) % drawingPoints.length];
                        const midX = ox + ((p.x + nextP.x) / 2) * scale;
                        const midY = oy + ((p.y + nextP.y) / 2) * scale;
                        const dist = calculateDistance(p, nextP);
                        return (
                          <g key={i}>
                            <circle cx={ox + p.x * scale} cy={oy + p.y * scale} r="6" fill="#3b82f6" className="stroke-slate-950 stroke-[3px]" />
                            {drawingPoints.length > 1 && (
                               <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                 <rect x={midX - 18} y={midY - 9} width="36" height="18" rx="6" fill="#1e293b" />
                                 <text x={midX} y={midY + 3} fill="#60a5fa" fontSize="8" fontWeight="900" textAnchor="middle">{Math.round(dist)}</text>
                               </g>
                            )}
                          </g>
                        );
                      })}
                     </>
                   )}
                 </svg>
                 
                 <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                   <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest mb-1">Peça Atual</p>
                   <p className="text-white text-base sm:text-xl font-black">{item.currentWidth}×{item.currentHeight} cm</p>
                 </div>
               </div>

               <div className="mt-6 bg-slate-950/40 p-4 sm:p-5 rounded-[1.5rem] border border-white/5">
                 <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-4">Ajustar Lados (cm)</span>
                 <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {drawingPoints.length > 1 ? drawingPoints.map((p, idx) => {
                        const dist = Math.round(calculateDistance(p, drawingPoints[(idx + 1) % drawingPoints.length]));
                        return (
                          <div key={idx} className="shrink-0 bg-slate-900/80 p-3 rounded-xl border border-white/5 min-w-[100px]">
                            <span className="text-[7px] text-slate-500 font-black uppercase block mb-1">Lado {idx+1}</span>
                            <input 
                              type="number" 
                              className="bg-slate-950 text-white font-black text-base p-2 rounded-lg border border-white/5 w-full text-center outline-none focus:border-blue-500" 
                              value={dist || ''} 
                              onChange={(e) => updateSegmentLength(idx, Number(e.target.value))} 
                              placeholder="0"
                            />
                          </div>
                        );
                    }) : <p className="text-slate-600 text-[9px] font-bold uppercase italic py-4">Clique acima para iniciar o desenho do retalho...</p>}
                 </div>
               </div>
            </div>

            <div className="lg:w-[38%] p-6 sm:p-10 flex flex-col bg-slate-50 overflow-y-auto">
              <div className="space-y-8 flex-1">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Dados do Corte</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Registro de Produção</p>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sobra m²</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{drawingPoints.length > 0 ? currentArea.toFixed(3) : '0.000'}</p>
                      </div>
                      <div className="space-y-1 border-l border-slate-50 pl-4">
                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Uso m²</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{areaUsed.toFixed(3)}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Obra</label>
                    <input type="text" placeholder="Nome do Cliente" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none text-sm" value={cutClientName} onChange={(e) => setCutClientName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Item</label>
                    <input type="text" placeholder="Ex: Soleira Banheiro" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none text-sm" value={cutProject} onChange={(e) => setCutProject(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-3">
                <button onClick={() => handleRegisterCut(false)} disabled={drawingPoints.length < 3 || !cutProject || !cutClientName} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-2xl disabled:opacity-20 active:scale-95">
                  <CheckCircle2 size={24} /> SALVAR COM SOBRA
                </button>
                <button onClick={() => handleRegisterCut(true)} disabled={!cutProject || !cutClientName} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
                  <Zap size={20} /> USO TOTAL (SEM SOBRAS)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
