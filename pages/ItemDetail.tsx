
import React, { useState, useEffect, useRef } from 'react';
// Import User type from types
import { InventoryItem, StockStatus, CutHistoryRecord, Point, User } from '../types';
// Import getCurrentUser from storageService
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { ArrowLeft, Scissors, Printer, Calendar, Check, Plus, Maximize2, Undo2, MousePointer2, Trash2, Info, Layout } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ItemDetailProps {
  itemId: string;
  onBack: () => void;
  onUpdate: () => void;
}

// Cálculo de Área de Polígono (Fórmula de Shoelace)
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
  label?: string
}> = ({ points, containerW, containerH, originalW, originalH, label }) => {
  const maxDim = Math.max(originalW, originalH);
  const scale = (containerW - 40) / maxDim;
  const offsetX = (containerW - originalW * scale) / 2;
  const offsetY = (containerH - originalH * scale) / 2;

  const pointsString = points.map(p => `${offsetX + p.x * scale},${offsetY + p.y * scale}`).join(' ');

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner overflow-hidden flex flex-col items-center">
      <svg width={containerW} height={containerH} className="drop-shadow-xl">
        <defs>
          <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        
        {/* Polígono da Peça */}
        <polygon 
          points={pointsString} 
          fill="rgba(59, 130, 246, 0.1)" 
          stroke="#3b82f6" 
          strokeWidth="2" 
          strokeLinejoin="round"
        />

        {/* Labels de Medida Simbolizados */}
        {points.length > 1 && points.map((p, i) => {
          const nextP = points[(i + 1) % points.length];
          const midX = offsetX + ((p.x + nextP.x) / 2) * scale;
          const midY = offsetY + ((p.y + nextP.y) / 2) * scale;
          const dist = Math.sqrt(Math.pow(nextP.x - p.x, 2) + Math.pow(nextP.y - p.y, 2));
          if (dist < 10) return null;

          return (
            <text 
              key={i} 
              x={midX} 
              y={midY} 
              fill="rgba(255,255,255,0.4)" 
              fontSize="9" 
              fontWeight="bold" 
              textAnchor="middle"
            >
              {Math.round(dist)}
            </text>
          );
        })}
      </svg>
      {label && <p className="text-[9px] text-slate-500 mt-2 uppercase font-black tracking-widest">{label}</p>}
    </div>
  );
};

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, onBack, onUpdate }) => {
  const [item, setItem] = useState<InventoryItem | undefined>();
  const [showCutModal, setShowCutModal] = useState(false);
  const [cutProject, setCutProject] = useState('');
  const [cutObservations, setCutObservations] = useState('');
  // Added user state for session tracking
  const [user, setUser] = useState<User | null>(null);
  
  // Editor States
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Fix: Expected 2 arguments, but got 1. 
    // Get the current session user to obtain companyId for getItemById.
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      const foundItem = getItemById(itemId, currentUser.companyId);
      if (foundItem) {
        setItem(foundItem);
        if (!foundItem.shapePoints || foundItem.shapePoints.length === 0) {
          const defaultPoints = [
            { x: 0, y: 0 },
            { x: foundItem.currentWidth, y: 0 },
            { x: foundItem.currentWidth, y: foundItem.currentHeight },
            { x: 0, y: foundItem.currentHeight }
          ];
          setDrawingPoints(defaultPoints);
        } else {
          setDrawingPoints(foundItem.shapePoints);
        }
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
    const canvasSize = 340;
    const padding = 40;
    const scale = (canvasSize - padding) / maxDim;
    const offsetX = (canvasSize - item.currentWidth * scale) / 2;
    const offsetY = (canvasSize - item.currentHeight * scale) / 2;

    const cmX = Math.max(0, Math.min(item.currentWidth, Math.round((rawX - offsetX) / scale)));
    const cmY = Math.max(0, Math.min(item.currentHeight, Math.round((rawY - offsetY) / scale)));

    setDrawingPoints(prev => [...prev, { x: cmX, y: cmY }]);
  };

  const handleRegisterCut = () => {
    if (drawingPoints.length < 3) {
      alert('Desenhe pelo menos 3 pontos para formar o polígono da sobra.');
      return;
    }

    // Fix: Ensure user is available to populate required operator fields in CutHistoryRecord
    if (!user) return;

    // Fix: Added operatorId and operatorName which are required by type CutHistoryRecord.
    const newHistory: CutHistoryRecord = {
      id: `CUT-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      project: cutProject,
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
      history: [newHistory, ...item.history]
    };

    saveItem(updatedItem);
    setItem(updatedItem);
    setShowCutModal(false);
    onUpdate();
    setCutProject('');
    setCutObservations('');
  };

  return (
    <div className="pb-20 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors no-print">
          <ArrowLeft size={20} />
          <span className="font-medium">Voltar ao Estoque</span>
        </button>
        <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 no-print">
          <Printer size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 p-4 space-y-4">
                <img src={item.photos[0]} className="w-full aspect-square object-cover rounded-xl shadow-sm" alt="" />
                <ShapeRenderer 
                  points={item.shapePoints || [
                    {x:0,y:0}, {x:item.currentWidth,y:0}, {x:item.currentWidth,y:item.currentHeight}, {x:0,y:item.currentHeight}
                  ]} 
                  containerW={240} 
                  containerH={240}
                  originalW={item.currentWidth}
                  originalH={item.currentHeight}
                  label="Mapa de Geometria Atual"
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

                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-50">
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

          {/* History Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Scissors size={20} className="text-blue-500" />
                Rastreio de Produção
              </h3>
              {item.status !== StockStatus.FINALIZADA && (
                <button 
                  onClick={() => {
                    setDrawingPoints([]);
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
                          <p className="text-xs text-slate-500">{log.date} • {log.observations}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-red-500 block">-{log.areaUsed.toFixed(2)} m²</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOBRA: {log.leftoverWidth}x{log.leftoverHeight}cm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-300 italic font-medium">Nenhuma operação registrada para esta chapa.</div>
              )}
            </div>
          </div>
        </div>

        {/* QR Label Section */}
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
        </div>
      </div>

      {/* Editor de Desenho Livre Refatorado */}
      {showCutModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[850px] animate-popIn">
            
            {/* Seção do Workbench (Desenho) */}
            <div className="bg-slate-900 md:w-[55%] p-6 flex flex-col h-full border-r border-white/10">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-white text-lg font-black uppercase tracking-tight">Workbench de Corte</h3>
                   <p className="text-slate-400 text-[10px] font-bold uppercase">Clique para definir os novos vértices da sobra</p>
                 </div>
                 <div className="flex gap-2">
                   <button 
                    onClick={() => setDrawingPoints(prev => prev.slice(0, -1))}
                    className="bg-slate-800 text-slate-300 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                    title="Desfazer"
                   >
                     <Undo2 size={18} />
                   </button>
                   <button 
                    onClick={() => setDrawingPoints([])}
                    className="bg-slate-800 text-red-400 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    title="Limpar"
                   >
                     <Trash2 size={18} />
                   </button>
                 </div>
               </div>
               
               <div className="flex-1 flex items-center justify-center bg-slate-800/40 rounded-3xl border border-white/5 relative overflow-hidden">
                 <svg 
                  ref={svgRef}
                  width={340} 
                  height={340} 
                  className="cursor-crosshair overflow-visible z-10"
                  onClick={handleAddPoint}
                 >
                   <defs>
                     <pattern id="edit-grid-dark" width="20" height="20" patternUnits="userSpaceOnUse">
                       <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                     </pattern>
                   </defs>
                   <rect width="100%" height="100%" fill="url(#edit-grid-dark)" />

                   {/* Base Atual */}
                   <rect 
                    x={(340 - item.currentWidth * ((340-40)/Math.max(item.currentWidth, item.currentHeight)))/2}
                    y={(340 - item.currentHeight * ((340-40)/Math.max(item.currentWidth, item.currentHeight)))/2}
                    width={item.currentWidth * ((340-40)/Math.max(item.currentWidth, item.currentHeight))}
                    height={item.currentHeight * ((340-40)/Math.max(item.currentWidth, item.currentHeight))}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="6"
                   />

                   {/* Desenho Interativo */}
                   {drawingPoints.length > 0 && (
                     <>
                      <polygon 
                        points={drawingPoints.map(p => {
                          const scale = (340 - 40) / Math.max(item.currentWidth, item.currentHeight);
                          const ox = (340 - item.currentWidth * scale) / 2;
                          const oy = (340 - item.currentHeight * scale) / 2;
                          return `${ox + p.x * scale},${oy + p.y * scale}`;
                        }).join(' ')}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      {drawingPoints.map((p, i) => {
                        const scale = (340 - 40) / Math.max(item.currentWidth, item.currentHeight);
                        const ox = (340 - item.currentWidth * scale) / 2;
                        const oy = (340 - item.currentHeight * scale) / 2;
                        return (
                          <circle 
                            key={i} 
                            cx={ox + p.x * scale} 
                            cy={oy + p.y * scale} 
                            r="6" 
                            fill="#3b82f6" 
                            className="stroke-slate-900 stroke-2"
                          />
                        );
                      })}
                     </>
                   )}
                 </svg>
                 
                 {/* Legenda de auxílio no workbench */}
                 <div className="absolute bottom-4 left-6 flex items-center gap-2">
                   <Info size={14} className="text-blue-500" />
                   <span className="text-[10px] text-slate-500 font-bold uppercase">Snap-to-Grid Ativado (1cm)</span>
                 </div>
               </div>

               <div className="mt-4 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                 <div className="flex justify-between mb-2">
                   <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Coordenadas Atuais</span>
                   <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{drawingPoints.length} Vértices</span>
                 </div>
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {drawingPoints.length > 0 ? drawingPoints.map((p, idx) => (
                      <div key={idx} className="shrink-0 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5 flex flex-col items-center">
                        <span className="text-[8px] text-slate-500 font-bold">P{idx+1}</span>
                        <span className="text-[10px] text-white font-black">{p.x},{p.y}</span>
                      </div>
                    )) : (
                      <span className="text-[10px] text-slate-600 italic">Inicie o desenho clicando acima...</span>
                    )}
                 </div>
               </div>
            </div>

            {/* Seção de Dados e Ação */}
            <div className="md:w-[45%] p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Finalizar Corte</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Confirmação de Dados</p>
                  </div>
                  <button onClick={() => setShowCutModal(false)} className="text-slate-300 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-colors">✕</button>
                </div>

                <div className="space-y-6">
                  {/* Grupo: Identificação */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Layout size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Identificação</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Projeto / Nome do Cliente"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800"
                      value={cutProject}
                      onChange={(e) => setCutProject(e.target.value)}
                    />
                  </div>

                  {/* Grupo: Métricas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] border border-blue-100 flex flex-col justify-center items-center">
                      <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Nova Sobra</p>
                      <p className="text-3xl font-black text-blue-700 tracking-tighter">{currentArea.toFixed(3)}<span className="text-sm ml-1">m²</span></p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-[2rem] border border-red-100 flex flex-col justify-center items-center">
                      <p className="text-[9px] font-black text-red-400 uppercase mb-1">Consumido</p>
                      <p className="text-3xl font-black text-red-700 tracking-tighter">{areaUsed.toFixed(3)}<span className="text-sm ml-1">m²</span></p>
                    </div>
                  </div>

                  {/* Grupo: Observações */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Observações Técnicas</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="Detalhes sobre a qualidade da sobra ou restrições de uso..."
                      value={cutObservations}
                      onChange={(e) => setCutObservations(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button 
                  onClick={handleRegisterCut}
                  disabled={drawingPoints.length < 3 || !cutProject}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-2xl hover:shadow-blue-500/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group active:scale-95"
                >
                  <MousePointer2 size={24} className="group-hover:rotate-12 transition-transform" />
                  CONFIRMAR E GERAR ETIQUETA
                </button>
                <p className="text-center text-[9px] text-slate-400 font-bold uppercase mt-4 tracking-widest">A chapa original será atualizada com o novo formato</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
