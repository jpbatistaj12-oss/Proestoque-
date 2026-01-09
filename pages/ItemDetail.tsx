
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, Point, User } from '../types';
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { ArrowLeft, Scissors, Printer, Plus, Undo2, MousePointer2, Trash2, Info, Layout, Ruler, Eye, User as UserIcon, Maximize2, FileText, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
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
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        
        {points.length > 0 && (
          <polygon 
            points={pointsString} 
            fill={`${highlightColor}1A`} 
            stroke={highlightColor} 
            strokeWidth="2.5" 
            strokeLinejoin="round"
            filter={showMeasurements ? "url(#glow)" : ""}
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
              <text 
                x={midX} 
                y={midY + 4} 
                fill="white" 
                fontSize="10" 
                fontWeight="900" 
                textAnchor="middle"
                className="select-none"
              >
                {Math.round(dist)}
              </text>
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
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      const foundItem = getItemById(itemId, currentUser.companyId);
      if (foundItem) {
        setItem(foundItem);
        setDrawingPoints(foundItem.shapePoints || [
          { x: 0, y: 0 },
          { x: foundItem.currentWidth, y: 0 },
          { x: foundItem.currentWidth, y: foundItem.currentHeight },
          { x: 0, y: foundItem.currentHeight }
        ]);
      }
    }
  }, [itemId]);

  if (!item) return <div className="p-10 text-center font-bold text-slate-500">Material não encontrado.</div>;

  const currentArea = calculatePolygonArea(drawingPoints);
  const areaUsed = Number((item.availableArea - currentArea).toFixed(4));

  const handleAddPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const maxDim = Math.max(item.currentWidth, item.currentHeight);
    const canvasSize = 380;
    const padding = 40;
    const scale = (canvasSize - padding) / maxDim;
    const offsetX = (canvasSize - item.currentWidth * scale) / 2;
    const offsetY = (canvasSize - item.currentHeight * scale) / 2;

    const cmX = Math.max(0, Math.min(item.currentWidth, Math.round((rawX - offsetX) / scale)));
    const cmY = Math.max(0, Math.min(item.currentHeight, Math.round((rawY - offsetY) / scale)));

    setDrawingPoints(prev => [...prev, { x: cmX, y: cmY }]);
  };

  const updateSegmentLength = (index: number, newLength: number) => {
    if (drawingPoints.length < 2) return;
    const nextIndex = (index + 1) % drawingPoints.length;
    const p1 = drawingPoints[index];
    const p2 = drawingPoints[nextIndex];
    
    const currentDist = calculateDistance(p1, p2);
    if (currentDist === 0) return;

    const ratio = newLength / currentDist;
    const newPoints = [...drawingPoints];
    newPoints[nextIndex] = {
      x: Math.round(p1.x + (p2.x - p1.x) * ratio),
      y: Math.round(p1.y + (p2.y - p1.y) * ratio)
    };
    setDrawingPoints(newPoints);
  };

  const handleRegisterCut = () => {
    if (drawingPoints.length < 3) {
      alert('Desenhe pelo menos 3 pontos.');
      return;
    }
    if (!cutProject || !cutClientName) {
      alert('Por favor, informe o Nome do Cliente e o Projeto.');
      return;
    }
    if (!user) return;

    const newHistory: CutHistoryRecord = {
      id: `CUT-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      project: cutProject,
      clientName: cutClientName,
      areaUsed: areaUsed,
      leftoverWidth: Math.max(...drawingPoints.map(p => p.x)),
      leftoverHeight: Math.max(...drawingPoints.map(p => p.y)),
      leftoverPoints: drawingPoints,
      observations: cutObservations,
      operatorId: user.id,
      operatorName: user.name
    };

    const isFinished = currentArea < 0.05;

    const updatedItem: InventoryItem = {
      ...item,
      currentWidth: newHistory.leftoverWidth,
      currentHeight: newHistory.leftoverHeight,
      shapePoints: drawingPoints,
      availableArea: Number(currentArea.toFixed(4)),
      status: isFinished ? StockStatus.FINALIZADA : StockStatus.COM_SOBRA,
      history: [newHistory, ...item.history],
      // Auditoria
      lastOperatorId: user.id,
      lastOperatorName: user.name,
      lastUpdatedAt: new Date().toISOString()
    };

    saveItem(updatedItem);
    setItem(updatedItem);
    setShowCutModal(false);
    onUpdate();
  };

  return (
    <div className="pb-20 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors no-print">
          <ArrowLeft size={20} />
          <span className="font-medium font-bold">Voltar ao Estoque</span>
        </button>
        <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 no-print">
          <Printer size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 p-4 space-y-4">
                <img src={item.photos[0]} className="w-full aspect-square object-cover rounded-xl shadow-sm" alt="" />
                <ShapeRenderer 
                  points={item.shapePoints || []} 
                  containerW={240} 
                  containerH={240}
                  originalW={item.currentWidth}
                  originalH={item.currentHeight}
                  label="Mapa de Geometria Atual"
                  showMeasurements
                />
              </div>
              <div className="md:w-2/3 p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">{item.commercialName}</h2>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{item.category} • {item.id}</p>
                  </div>
                  <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border-2 ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Espessura</p>
                    <p className="font-bold text-slate-700">{item.thickness}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Medidas Max</p>
                    <p className="font-bold text-blue-600">{item.currentWidth}x{item.currentHeight} cm</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Disponível</p>
                    <p className="font-bold text-green-600">{item.availableArea.toFixed(2)} m²</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Responsável</p>
                    <div className="flex items-center gap-1.5 font-bold text-slate-500">
                       <UserCheck size={14} className="text-blue-500" />
                       <span className="truncate max-w-[80px]">{item.lastOperatorName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Aproveitamento</span>
                    <span className="text-xs font-black text-blue-600">{((item.availableArea / item.totalArea) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-700 shadow-sm" 
                      style={{ width: `${(item.availableArea / item.totalArea) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Scissors size={20} className="text-blue-500" />
                Rastreio de Produção
              </h3>
              {item.status !== StockStatus.FINALIZADA && (
                <button 
                  onClick={() => {
                    const defaultPoints = [
                      { x: 0, y: 0 },
                      { x: item.currentWidth, y: 0 },
                      { x: item.currentWidth, y: item.currentHeight },
                      { x: 0, y: item.currentHeight }
                    ];
                    setDrawingPoints(defaultPoints);
                    setShowCutModal(true);
                  }}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg hover:scale-105"
                >
                  <Plus size={18} /> DESENHAR NOVO CORTE
                </button>
              )}
            </div>

            <div className="space-y-4">
              {item.history.length > 0 ? (
                item.history.map((log) => (
                  <div key={log.id} className="flex gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 items-center">
                    <div className="w-20 shrink-0">
                       <ShapeRenderer 
                        points={log.leftoverPoints || []} 
                        containerW={80} 
                        containerH={80}
                        originalW={log.leftoverWidth}
                        originalH={log.leftoverHeight}
                       />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{log.project}</h4>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-tight text-blue-600">Cliente: {log.clientName}</p>
                          <div className="flex items-center gap-4 mt-2">
                             <span className="text-[10px] text-slate-400 flex items-center gap-1"><FileText size={12} /> {log.date}</span>
                             <span className="text-[10px] text-slate-400 flex items-center gap-1 font-black uppercase text-slate-900"><UserCheck size={12} className="text-blue-500" /> OP: {log.operatorName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-red-500 block">-{log.areaUsed.toFixed(2)} m²</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RESTO: {log.leftoverWidth}x{log.leftoverHeight}cm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-300 italic font-medium">Nenhuma operação registrada.</div>
              )}
            </div>
          </div>
        </div>

        <div id="printable-qr" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center sticky top-24 h-fit">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-[0.2em]">Etiqueta de Oficina</p>
          <div className="p-4 border-2 border-slate-900 rounded-3xl mb-6 shadow-xl">
            <QRCodeSVG value={`MARM-ID:${item.id}`} size={180} />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter mb-1">{item.id}</p>
          <p className="text-xs font-bold text-slate-500 mb-6">{item.commercialName}</p>
          <div className="bg-slate-900 text-white w-full py-4 rounded-2xl font-black text-xl shadow-lg uppercase">
            {item.currentWidth} X {item.currentHeight}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50 w-full">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Último Operador</p>
            <p className="text-xs font-black text-slate-800 uppercase">{item.lastOperatorName || 'ENTRADA SISTEMA'}</p>
          </div>
        </div>
      </div>

      {showCutModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-7xl overflow-hidden shadow-2xl flex flex-col lg:flex-row h-full max-h-[920px] animate-popIn border border-white/10">
            
            {/* 1. MESA DE DESENHO (WORKBENCH) */}
            <div className="bg-slate-900 lg:w-[62%] p-5 sm:p-8 flex flex-col h-full border-r border-white/5">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <div>
                   <h3 className="text-white text-xl font-black uppercase tracking-tight flex items-center gap-3">
                     <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <Ruler size={22} className="text-white" />
                     </div>
                     Workbench Digital
                   </h3>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Mapeamento Geométrico de Retalho</p>
                 </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                   <button 
                    onClick={() => setDrawingPoints(prev => prev.slice(0, -1))} 
                    className="flex-1 sm:flex-none bg-slate-800 text-slate-300 px-4 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 font-black text-[10px] uppercase"
                    disabled={drawingPoints.length === 0}
                   >
                     <Undo2 size={16} /> Desfazer
                   </button>
                   <button 
                    onClick={() => setDrawingPoints([])} 
                    className="flex-1 sm:flex-none bg-slate-800 text-red-400 px-4 py-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 font-black text-[10px] uppercase"
                    disabled={drawingPoints.length === 0}
                   >
                     <Trash2 size={16} /> Limpar
                   </button>
                 </div>
               </div>
               
               <div className="flex-1 flex items-center justify-center bg-slate-950/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-inner">
                 <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 </div>

                 <svg 
                  ref={svgRef}
                  width={380} 
                  height={380} 
                  className="cursor-crosshair overflow-visible z-10 drop-shadow-2xl"
                  onClick={handleAddPoint}
                 >
                   <rect width="100%" height="100%" fill="transparent" />

                   {drawingPoints.length > 0 && (
                     <>
                      <polygon 
                        points={drawingPoints.map(p => {
                          const scale = (380 - 40) / Math.max(item.currentWidth, item.currentHeight);
                          const ox = (380 - item.currentWidth * scale) / 2;
                          const oy = (380 - item.currentHeight * scale) / 2;
                          return `${ox + p.x * scale},${oy + p.y * scale}`;
                        }).join(' ')}
                        fill="rgba(59, 130, 246, 0.15)"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                      {drawingPoints.map((p, i) => {
                        const scale = (380 - 40) / Math.max(item.currentWidth, item.currentHeight);
                        const ox = (380 - item.currentWidth * scale) / 2;
                        const oy = (380 - item.currentHeight * scale) / 2;
                        const nextP = drawingPoints[(i + 1) % drawingPoints.length];
                        
                        const midX = ox + ((p.x + nextP.x) / 2) * scale;
                        const midY = oy + ((p.y + nextP.y) / 2) * scale;
                        const dist = calculateDistance(p, nextP);

                        return (
                          <g key={i}>
                            <circle cx={ox + p.x * scale} cy={oy + p.y * scale} r="7" fill="#3b82f6" className="stroke-slate-950 stroke-[3px]" />
                            {drawingPoints.length > 1 && (
                               <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                 <rect x={midX - 20} y={midY - 10} width="40" height="20" rx="8" fill="#1e293b" className="stroke-blue-500/50 stroke-1" />
                                 <text x={midX} y={midY + 4} fill="#60a5fa" fontSize="10" fontWeight="900" textAnchor="middle">{Math.round(dist)}</text>
                               </g>
                            )}
                          </g>
                        );
                      })}
                     </>
                   )}
                 </svg>
                 
                 <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-xl">
                      <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">Área Disponível</p>
                      <p className="text-white text-xl font-black">{item.currentWidth} <span className="text-[10px] text-slate-500">X</span> {item.currentHeight}</p>
                    </div>
                 </div>

                 <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg ${drawingPoints.length >= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {drawingPoints.length >= 3 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {drawingPoints.length < 3 ? 'Desenho Incompleto' : 'Geometria Válida'}
                    </div>
                 </div>
               </div>

               <div className="mt-6 bg-slate-950/40 p-5 rounded-[2rem] border border-white/5">
                 <div className="flex justify-between items-center mb-4">
                   <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ajuste Fino de Dimensões (cm)</span>
                   <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      <UserCheck size={12} className="text-blue-500" /> Operador: {user?.name}
                   </div>
                 </div>
                 <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                    {drawingPoints.length > 1 ? drawingPoints.map((p, idx) => {
                      const nextP = drawingPoints[(idx + 1) % drawingPoints.length];
                      const dist = Math.round(calculateDistance(p, nextP));
                      return (
                        <div key={idx} className="shrink-0 bg-slate-900/80 p-3 rounded-2xl border border-white/5 min-w-[120px] transition-all hover:border-blue-500/50">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[8px] text-slate-500 font-black uppercase">Lado {idx+1}</span>
                          </div>
                          <input 
                            type="number" 
                            className="bg-slate-950 text-white font-black text-lg p-3 rounded-xl border border-white/5 w-full focus:ring-4 focus:ring-blue-600/20 outline-none transition-all text-center"
                            value={dist}
                            onChange={(e) => updateSegmentLength(idx, Number(e.target.value))}
                          />
                        </div>
                      );
                    }) : (
                      <p className="text-slate-600 text-[10px] font-bold uppercase italic py-4">Inicie o desenho para ver as dimensões...</p>
                    )}
                 </div>
               </div>
            </div>

            <div className="lg:w-[38%] p-6 sm:p-10 flex flex-col justify-between overflow-y-auto bg-slate-50">
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Registrar Corte</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Responsável: {user?.name}</p>
                  </div>
                  <button 
                    onClick={() => setShowCutModal(false)} 
                    className="text-slate-400 hover:text-slate-900 p-3 bg-white rounded-2xl transition-all border border-slate-200 shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                   <div className="flex items-center gap-3 text-slate-900 font-black text-xs uppercase tracking-tight border-b border-slate-50 pb-4">
                     <div className="bg-emerald-500 p-1.5 rounded-lg">
                        <Maximize2 size={14} className="text-white" />
                     </div>
                     Impacto no Estoque
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Área da Sobra</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">
                          {currentArea.toFixed(3)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span>
                        </p>
                      </div>
                      <div className="space-y-1 border-l border-slate-50 pl-6">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Peça Cortada</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">
                          {areaUsed.toFixed(3)}<span className="text-sm font-bold text-slate-400 ml-1">m²</span>
                        </p>
                      </div>
                   </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-slate-900 font-black text-xs uppercase tracking-tight mb-2">
                     <FileText size={18} className="text-blue-500" />
                     Dados do Destino
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2 group">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                        <UserIcon size={12} /> Cliente / Obra
                      </label>
                      <input 
                        type="text" 
                        placeholder="Nome do Cliente"
                        className="w-full p-5 bg-white border border-slate-200 rounded-3xl font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                        value={cutClientName}
                        onChange={(e) => setCutClientName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 group">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                        <Layout size={12} /> Descrição da Peça
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: Saia da Bancada Cozinha"
                        className="w-full p-5 bg-white border border-slate-200 rounded-3xl font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                        value={cutProject}
                        onChange={(e) => setCutProject(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-200/60">
                <button 
                  onClick={handleRegisterCut}
                  disabled={drawingPoints.length < 3 || !cutProject || !cutClientName}
                  className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl disabled:opacity-20 active:scale-95 group"
                >
                  <CheckCircle2 size={26} />
                  CONFIRMAR PRODUÇÃO
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                  <UserCheck size={14} className="text-blue-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Registrando como: {user?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default ItemDetail;
