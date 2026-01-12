
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, Point, User } from '../types';
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { 
  ArrowLeft, Scissors, Printer, Plus, Undo2, Trash2, MapPin, 
  CheckCircle2, X as XIcon, Zap, ChevronLeft, ChevronRight,
  Maximize, Move, MapPinned, Info, Target, Camera, Image as ImageIcon,
  Gauge
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
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage > 70) return '#10b981'; // Emerald-500
    if (percentage > 25) return '#3b82f6'; // Blue-500
    return '#ef4444'; // Red-500
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={getColor()}
          strokeWidth="8"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-900 leading-none">{Math.round(percentage)}%</span>
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Livre</span>
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
    } else {
      setItem(undefined);
    }
  }, [itemId, companyId]);

  const getCanvasCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current || !item) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const maxDim = Math.max(item.currentWidth, item.currentHeight);
    const canvasSize = window.innerWidth < 640 ? 260 : 320;
    const padding = 25;
    const scale = (canvasSize - padding) / maxDim;
    const offsetX = (canvasSize - item.currentWidth * scale) / 2;
    const offsetY = (canvasSize - item.currentHeight * scale) / 2;

    const cmX = Math.max(0, Math.min(item.currentWidth, Math.round((rawX - offsetX) / scale)));
    const cmY = Math.max(0, Math.min(item.currentHeight, Math.round((rawY - offsetY) / scale)));

    return { x: cmX, y: cmY };
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (draggingIdx === null) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const currentPoint = drawingPoints[draggingIdx];
    if (currentPoint && (currentPoint.x !== coords.x || currentPoint.y !== coords.y)) {
        wasDraggingRef.current = true;
    }

    setDrawingPoints(prev => {
      const updated = [...prev];
      if (updated[draggingIdx]) {
        updated[draggingIdx] = coords;
      }
      return updated;
    });
  };

  const handleGlobalMouseUp = () => {
    if (draggingIdx !== null) {
        setTimeout(() => {
            setDraggingIdx(null);
        }, 50);
    }
  };

  useEffect(() => {
    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    } else {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingIdx, drawingPoints, item]);

  if (!item) {
    return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Carregando material...</div>;
  }

  const currentArea = calculatePolygonArea(drawingPoints);
  const areaUsed = Number((item.availableArea - (drawingPoints.length > 0 ? currentArea : 0)).toFixed(4));
  const usagePercentage = (item.availableArea / item.totalArea) * 100;

  const handleAddPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    if (wasDraggingRef.current) {
        wasDraggingRef.current = false;
        return;
    }
    if (draggingIdx !== null) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    if (drawingPoints.length > 0) {
      const last = drawingPoints[drawingPoints.length - 1];
      if (last.x === coords.x && last.y === coords.y) return;
    }
    setDrawingPoints(prev => [...prev, coords]);
  };

  const handlePointMouseDown = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingIdx(idx);
    wasDraggingRef.current = false;
  };

  const updateSegmentLength = (index: number, newLength: number) => {
    if (drawingPoints.length < 2) return;
    const nextIndex = (index + 1) % drawingPoints.length;
    const p1 = drawingPoints[index];
    const p2 = drawingPoints[nextIndex];
    let currentDist = calculateDistance(p1, p2);
    
    const newPoints = [...drawingPoints];
    if (currentDist === 0) {
      newPoints[nextIndex] = { x: Math.round(p1.x + newLength), y: p1.y };
    } else {
      const ratio = newLength / currentDist;
      newPoints[nextIndex] = {
        x: Math.round(p1.x + (p2.x - p1.x) * ratio),
        y: Math.round(p1.y + (p2.y - p1.y) * ratio)
      };
    }
    newPoints[nextIndex].x = Math.max(0, Math.min(item.currentWidth, newPoints[nextIndex].x));
    newPoints[nextIndex].y = Math.max(0, Math.min(item.currentHeight, newPoints[nextIndex].y));
    setDrawingPoints(newPoints);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePhotoType) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (activePhotoType === 'piece') setCutPiecePhoto(event.target.result as string);
          else setCutLeftoverPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    setActivePhotoType(null);
  };

  const triggerUpload = (type: 'piece' | 'leftover') => {
    setActivePhotoType(type);
    fileInputRef.current?.click();
  };

  const handleRegisterCut = (isTotal: boolean = false) => {
    if (!isTotal && drawingPoints.length < 3) {
      alert('Desenhe pelo menos 3 pontos para definir a sobra.');
      return;
    }
    if (!cutProject || !cutClientName) {
      alert('Informe o Nome do Cliente e o Projeto.');
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

    const updatedPhotos = [...item.photos];
    if (cutLeftoverPhoto) updatedPhotos.unshift(cutLeftoverPhoto);

    const updatedItem: InventoryItem = {
      ...item,
      currentWidth: newHistory.leftoverWidth,
      currentHeight: newHistory.leftoverHeight,
      location: cutNewSlabLocation || item.location,
      shapePoints: finalPoints,
      availableArea: finalArea,
      status: isTotal || finalArea < 0.05 ? StockStatus.FINALIZADA : StockStatus.COM_SOBRA,
      history: [newHistory, ...item.history],
      photos: updatedPhotos.slice(0, 5),
      lastOperatorId: user.id,
      lastOperatorName: user.name,
      lastUpdatedAt: new Date().toISOString()
    };

    saveItem(updatedItem);
    setItem(updatedItem);
    setShowCutModal(false);
    resetCutForm();
    onUpdate();
  };

  const resetCutForm = () => {
    setCutProject('');
    setCutClientName('');
    setCutInstallationLocation('');
    setCutLocationOnSlab('');
    setCutPiecePhoto(undefined);
    setCutLeftoverPhoto(undefined);
    setDrawingPoints([]);
  };

  return (
    <div className="pb-10 animate-fadeIn px-1 sm:px-0">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors no-print">
          <ArrowLeft size={18} />
          <span className="font-bold text-xs uppercase tracking-widest">Estoque</span>
        </button>
        <button onClick={() => window.print()} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 no-print shadow-sm">
          <Printer size={18} />
        </button>
      </div>

      {/* Item Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 p-4 space-y-4 border-b md:border-b-0 md:border-r border-slate-50 bg-slate-50/50">
                <div className="relative aspect-square w-full group">
                  <img src={item.photos[activePhotoIdx]} className="w-full h-full object-cover rounded-2xl shadow-sm border-2 border-white transition-all duration-300" alt={`Foto ${activePhotoIdx + 1}`} />
                  {item.photos.length > 1 && (
                    <>
                      <button onClick={() => setActivePhotoIdx((prev) => (prev - 1 + item.photos.length) % item.photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={() => setActivePhotoIdx((prev) => (prev + 1) % item.photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
                <ShapeRenderer points={item.shapePoints || []} containerW={240} containerH={240} originalW={item.currentWidth || item.originalWidth} originalH={item.currentHeight || item.originalHeight} label="Geometria Atual" showMeasurements className="!p-2 !rounded-2xl" />
              </div>
              <div className="md:w-2/3 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-tight">{item.commercialName}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{item.category} • {item.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 pt-6 border-t border-slate-50 relative">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Medidas Max</p>
                    <p className="font-black text-blue-600 text-sm">{item.currentWidth}×{item.currentHeight} cm</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Disponível</p>
                    <p className="font-black text-emerald-600 text-sm">{item.availableArea.toFixed(2)} m²</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Localização</p>
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 text-sm">
                       <MapPin size={12} className="text-red-500" />
                       <span className="truncate">{item.location || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Gauge de Aproveitamento em destaque */}
                  <div className="absolute -top-4 right-0 hidden sm:block">
                    <UsageGauge percentage={usagePercentage} />
                  </div>
                </div>

                <div className="sm:hidden flex justify-center py-4 border-t border-slate-50">
                  <UsageGauge percentage={usagePercentage} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase mb-8">
              <Scissors size={20} className="text-blue-500" /> Histórico de Produção
            </h3>
            <div className="space-y-6">
              {item.history.length > 0 ? item.history.map((log) => (
                <div key={log.id} className="flex flex-col gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <ShapeRenderer points={log.leftoverPoints || []} containerW={100} containerH={100} originalW={log.leftoverWidth || item.originalWidth} originalH={log.leftoverHeight || item.originalHeight} className="!p-1 !rounded-2xl" />
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-black text-slate-900 text-lg uppercase leading-tight">{log.project}</h4>
                      <p className="text-[10px] text-blue-600 font-black uppercase">
                        Cliente: {log.clientName} {log.installationLocation && `• Local: ${log.installationLocation}`}
                      </p>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="text-base font-black text-red-500 block">-{log.areaUsed.toFixed(2)} m²</span>
                      <span className="text-[10px] text-slate-400 font-black">{log.date}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">Sem registros de produção.</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center h-fit sticky top-8">
          <QRCodeSVG value={`MARM-ID:${item.id}`} size={160} className="mb-6" />
          <p className="text-2xl font-black text-slate-900 mb-1">{item.id}</p>
          <div className="bg-slate-900 text-white w-full py-4 rounded-2xl font-black text-xl shadow-lg uppercase mb-6">
            {item.currentWidth} × {item.currentHeight}
          </div>
          {item.status !== StockStatus.FINALIZADA && (
            <button onClick={() => { resetCutForm(); setShowCutModal(true); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95">
              <Scissors size={20} /> NOVO CORTE
            </button>
          )}
        </div>
      </div>

      {/* Cut Modal Refinado - Ajuste de Altura e Scroll */}
      {showCutModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-7xl overflow-hidden shadow-2xl flex flex-col lg:flex-row animate-popIn border border-white/10 relative max-h-[90vh]">
            <button onClick={() => setShowCutModal(false)} className="absolute top-4 right-4 z-[110] text-slate-400 hover:text-slate-900 p-2 bg-white rounded-2xl shadow-xl">
              <XIcon size={24} />
            </button>
            
            {/* Esquerda: Editor Visual (Ajustado) */}
            <div className="bg-slate-900 lg:w-[48%] p-4 sm:p-8 flex flex-col border-r border-white/5 overflow-y-auto lg:overflow-visible min-h-0">
               <h3 className="text-white text-base sm:text-xl font-black uppercase tracking-tight flex items-center gap-3 mb-4 shrink-0">
                 <Move size={18} className="text-blue-500" /> Geometria da Sobra
               </h3>
               
               <div className="flex-1 flex items-center justify-center bg-slate-950/40 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-inner min-h-[250px] mb-4">
                 <svg ref={svgRef} width={window.innerWidth < 640 ? 260 : 320} height={window.innerWidth < 640 ? 260 : 320} className="cursor-crosshair overflow-visible z-10" onClick={handleAddPoint}>
                   <rect width="100%" height="100%" fill="transparent" />
                   {drawingPoints.length > 0 && (
                     <>
                      <polygon points={drawingPoints.map(p => {
                          const size = window.innerWidth < 640 ? 260 : 320;
                          const scale = (size - 25) / Math.max(item.currentWidth, item.currentHeight);
                          const ox = (size - item.currentWidth * scale) / 2;
                          const oy = (size - item.currentHeight * scale) / 2;
                          return `${ox + p.x * scale},${oy + p.y * scale}`;
                        }).join(' ')} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="3" />
                      {drawingPoints.map((p, i) => {
                        const size = window.innerWidth < 640 ? 260 : 320;
                        const scale = (size - 25) / Math.max(item.currentWidth, item.currentHeight);
                        const ox = (size - item.currentWidth * scale) / 2;
                        const oy = (size - item.currentHeight * scale) / 2;
                        return (
                          <circle key={i} cx={ox + p.x * scale} cy={oy + p.y * scale} r={draggingIdx === i ? 12 : 8} fill={draggingIdx === i ? "#60a5fa" : "#3b82f6"} className="stroke-slate-950 stroke-[3px] cursor-grab active:cursor-grabbing transition-all" onMouseDown={(e) => handlePointMouseDown(i, e)} />
                        );
                      })}
                     </>
                   )}
                 </svg>
                 <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-white font-black text-[10px] uppercase">
                   {item.currentWidth}×{item.currentHeight} cm
                 </div>
               </div>

               <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 overflow-x-auto whitespace-nowrap mb-4 shrink-0">
                 <p className="text-[9px] text-slate-400 font-black uppercase mb-2">Ajuste de Lados (cm)</p>
                 <div className="flex gap-2">
                    {drawingPoints.length > 1 ? drawingPoints.map((p, idx) => {
                        const dist = Math.round(calculateDistance(p, drawingPoints[(idx + 1) % drawingPoints.length]));
                        return (
                          <div key={idx} className="shrink-0 bg-slate-900 p-2 rounded-xl border border-white/5 min-w-[70px] text-center">
                            <span className="text-[7px] text-slate-500 font-black uppercase block mb-1">Lado {idx+1}</span>
                            <input type="number" className="bg-slate-950 text-white font-black text-[10px] p-1 rounded-lg border border-white/5 w-full text-center outline-none focus:border-blue-500" value={dist || ''} onChange={(e) => updateSegmentLength(idx, Number(e.target.value))} />
                          </div>
                        );
                    }) : <p className="text-slate-600 text-[9px] font-bold uppercase py-2">Inicie clicando na chapa...</p>}
                 </div>
               </div>

               <div className="flex gap-2 shrink-0">
                 <button onClick={() => setDrawingPoints(prev => prev.slice(0, -1))} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><Undo2 size={14} /> Desfazer</button>
                 <button onClick={() => setDrawingPoints([])} className="bg-slate-800 text-red-400 px-3 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><Trash2 size={14} /> Limpar</button>
               </div>
            </div>

            {/* Direita: Formulário (Rolagem Independente e Compactado) */}
            <div className="lg:w-[52%] flex flex-col h-full bg-slate-50 min-h-0">
              <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-5 pb-24 lg:pb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Registro Técnico</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Dados da produção e documentação</p>
                </div>

                {/* Seção de Fotos Mais Compacta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Peça Produzida</label>
                      <button onClick={() => triggerUpload('piece')} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group ${cutPiecePhoto ? 'border-transparent' : 'border-slate-300 bg-white hover:bg-blue-50'}`}>
                        {cutPiecePhoto ? <img src={cutPiecePhoto} className="w-full h-full object-cover" /> : <Camera size={18} className="text-slate-400" />}
                      </button>
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sobras no Cavalete</label>
                      <button onClick={() => triggerUpload('leftover')} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group ${cutLeftoverPhoto ? 'border-transparent' : 'border-slate-300 bg-white hover:bg-emerald-50'}`}>
                        {cutLeftoverPhoto ? <img src={cutLeftoverPhoto} className="w-full h-full object-cover" /> : <Camera size={18} className="text-slate-400" />}
                      </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cliente</label>
                      <input type="text" placeholder="Nome" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none text-sm" value={cutClientName} onChange={(e) => setCutClientName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Projeto</label>
                      <input type="text" placeholder="Ex: Pia" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none text-sm" value={cutProject} onChange={(e) => setCutProject(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-600 uppercase ml-1 flex items-center gap-1"><Target size={12} /> Local do corte na chapa</label>
                    <input type="text" placeholder="Ex: Canto Superior Direito" className="w-full p-2.5 bg-blue-50 border border-blue-100 rounded-xl font-black text-blue-900 focus:border-blue-600 outline-none text-sm" value={cutLocationOnSlab} onChange={(e) => setCutLocationOnSlab(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Instalação</label>
                      <input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold outline-none text-sm" value={cutInstallationLocation} onChange={(e) => setCutInstallationLocation(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nova Posição</label>
                      <input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold outline-none text-sm" value={cutNewSlabLocation} onChange={(e) => setCutNewSlabLocation(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Resumo de Área Compacto */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex justify-around text-center shadow-sm">
                  <div>
                    <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Área da Sobra</p>
                    <p className="text-lg font-black text-slate-900 leading-none">{currentArea.toFixed(3)} m²</p>
                  </div>
                  <div className="w-px bg-slate-100"></div>
                  <div>
                    <p className="text-[7px] font-black text-red-500 uppercase mb-1">Área Consumida</p>
                    <p className="text-lg font-black text-red-600 leading-none">{areaUsed.toFixed(3)} m²</p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Fixos no Rodapé */}
              <div className="p-5 bg-white border-t border-slate-100 space-y-2 shrink-0">
                <button onClick={() => handleRegisterCut(false)} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 size={18} /> SALVAR PRODUÇÃO
                </button>
                <button onClick={() => handleRegisterCut(true)} className="w-full bg-slate-100 text-slate-500 py-2.5 rounded-xl font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px]">
                  <Zap size={14} /> USO TOTAL DA CHAPA
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
