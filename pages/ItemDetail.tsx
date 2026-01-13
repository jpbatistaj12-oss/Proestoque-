
import React, { useState, useEffect } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, User } from '../types';
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { 
  ArrowLeft, Scissors, Printer, MapPin, 
  X as XIcon, Package, PlusCircle, MinusCircle, 
  History, Maximize2, Ruler, ShoppingBag, Plus, Bell
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ItemDetailProps {
  itemId: string;
  companyId: string;
  onBack: () => void;
  onUpdate: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, companyId, onBack, onUpdate }) => {
  const [item, setItem] = useState<InventoryItem | undefined>();
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [usageType, setUsageType] = useState<'BAIXA' | 'SOBRA'>('BAIXA');
  const [project, setProject] = useState('');
  const [client, setClient] = useState('');
  const [restockQty, setRestockQty] = useState(1);
  const [observations, setObservations] = useState('');
  
  // Peça que SAIU (Cliente)
  const [cutWidth, setCutWidth] = useState<number>(0);
  const [cutHeight, setCutHeight] = useState<number>(0);

  // Peça que FICOU (Sobra no Estoque)
  const [leftoverWidth, setLeftoverWidth] = useState<number>(0);
  const [leftoverHeight, setLeftoverHeight] = useState<number>(0);
  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    const currentItem = getItemById(itemId, companyId);
    setItem(currentItem);
    if (currentItem) {
      setLeftoverWidth(currentItem.width);
      setLeftoverHeight(currentItem.height);
      setCutWidth(0);
      setCutHeight(0);
    }
  }, [itemId, companyId]);

  if (!item) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Carregando Material...</div>;

  const handleRegisterUsage = () => {
    if (item.quantity <= 0) return alert('Estoque esgotado.');
    if (!project || !client) return alert('Cliente e Projeto são obrigatórios.');

    let newQuantity = item.quantity;
    let newWidth = item.width;
    let newHeight = item.height;
    let newStatus = item.status;
    let areaUsed = (item.width * item.height) / 10000;

    if (usageType === 'BAIXA') {
      newQuantity = item.quantity - 1;
      newStatus = newQuantity <= 0 ? StockStatus.ESGOTADO : (newQuantity <= item.minQuantity ? StockStatus.BAIXO_ESTOQUE : StockStatus.DISPONIVEL);
    } else {
      if (leftoverWidth <= 0 || leftoverHeight <= 0 || cutWidth <= 0 || cutHeight <= 0) {
        return alert("Informe as medidas da peça que saiu e da sobra que retornou.");
      }
      newWidth = leftoverWidth;
      newHeight = leftoverHeight;
      newStatus = StockStatus.COM_SOBRA;
      areaUsed = (cutWidth * cutHeight) / 10000;
    }

    const newRecord: CutHistoryRecord = {
      id: `MOV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      project,
      clientName: client,
      type: usageType === 'BAIXA' ? 'SAIDA' : 'SOBRA',
      quantityChange: usageType === 'BAIXA' ? -1 : 0,
      observations: observations + (usageType === 'SOBRA' ? ` (Sobra: ${newWidth}x${newHeight} | Cortado: ${cutWidth}x${cutHeight})` : ''),
      operatorName: user?.name || 'Operador',
      areaUsed: areaUsed,
      cutWidth: usageType === 'SOBRA' ? cutWidth : item.width,
      cutHeight: usageType === 'SOBRA' ? cutHeight : item.height,
      leftoverWidth: usageType === 'SOBRA' ? newWidth : undefined,
      leftoverHeight: usageType === 'SOBRA' ? newHeight : undefined
    };

    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQuantity,
      width: newWidth,
      height: newHeight,
      availableArea: (newWidth * newHeight) / 10000,
      status: newStatus,
      history: [newRecord, ...item.history],
      lastUpdatedAt: new Date().toISOString()
    };

    saveItem(updatedItem);
    setItem(updatedItem);
    setShowUsageModal(false);
    onUpdate();
    setProject(''); setClient(''); setObservations('');
  };

  const handleRestock = () => {
    if (restockQty <= 0) return alert('Quantidade deve ser maior que zero.');
    const newQuantity = item.quantity + restockQty;
    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQuantity,
      status: newQuantity > item.minQuantity ? StockStatus.DISPONIVEL : StockStatus.BAIXO_ESTOQUE,
      history: [{
        id: `ENT-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        project: 'Reposição manual',
        clientName: 'Estoque',
        type: 'ENTRADA',
        quantityChange: restockQty,
        operatorName: user?.name || 'Operador',
        areaUsed: 0
      }, ...item.history]
    };
    saveItem(updatedItem);
    setItem(updatedItem);
    setShowRestockModal(false);
    onUpdate();
  };

  return (
    <div className="pb-10 animate-fadeIn max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">Painel de Estoque</span>
        </button>
        <div className="flex items-center gap-3">
           <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm font-black text-slate-900 text-xs uppercase tracking-tighter">
              CADASTRO: #{item.entryIndex}
           </div>
           <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-all"><Printer size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-[40%] p-8 bg-slate-50/50 flex flex-col items-center justify-center border-r border-slate-100">
               <div onClick={() => setShowImageZoom(true)} className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white cursor-zoom-in">
                  <img src={item.photos[0]} className="w-full h-full object-cover" alt="" />
               </div>
               <div className="mt-6 text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">CÓDIGO DE SÉRIE</p>
                  <p className="text-xl font-black text-slate-900 tracking-tighter">{item.id}</p>
               </div>
            </div>

            <div className="flex-1 p-10 space-y-8">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{item.commercialName}</h2>
                  <p className="text-sm text-blue-600 font-black uppercase tracking-widest mt-3">{item.category} • {item.thickness}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 shrink-0 ${STATUS_COLORS[item.status]}`}>{item.status}</div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                 <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Quantidade</p>
                    <p className={`text-4xl font-black ${item.quantity <= 0 ? 'text-red-500' : 'text-slate-900'}`}>{item.quantity}</p>
                 </div>
                 <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Ruler size={14} className="text-blue-500" />
                      <p className="text-xs font-bold text-slate-600">Medida: {item.width}x{item.height}cm</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Maximize2 size={14} className="text-emerald-500" />
                      <p className="text-xs font-bold text-slate-600">Área: {item.availableArea.toFixed(2)} m²</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <p className="text-xs font-bold text-slate-600">{item.location || 'Sem Local'}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-8"><History size={24} className="text-blue-500" /> Histórico de Corte</h3>
             <div className="space-y-4">
               {item.history.length > 0 ? item.history.map(log => (
                 <div key={log.id} className="flex items-center gap-6 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${log.type === 'ENTRADA' ? 'bg-emerald-500' : (log.type === 'SOBRA' ? 'bg-purple-500' : 'bg-red-500')}`}>
                       {log.type === 'ENTRADA' ? <PlusCircle size={24} /> : (log.type === 'SOBRA' ? <Scissors size={24} /> : <MinusCircle size={24} />)}
                    </div>
                    <div className="flex-1">
                       <p className="text-base font-black text-slate-900 uppercase truncate">{log.project}</p>
                       <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{log.clientName}</p>
                       {log.observations && <p className="text-[9px] text-slate-400 mt-1 italic">{log.observations}</p>}
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-slate-900">{log.type === 'ENTRADA' ? `+${log.quantityChange}` : (log.type === 'SOBRA' ? 'CORTE' : '-1')}</p>
                       <p className="text-[9px] text-slate-400 font-bold">{log.date}</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-12 text-center opacity-30">
                    <Package size={48} className="mx-auto mb-2" />
                    <p className="font-black uppercase text-[10px] tracking-widest">Nenhuma movimentação</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center sticky top-8">
             <div className="p-6 bg-slate-50 rounded-[2.5rem] shadow-inner mb-8">
               <QRCodeSVG value={`SERIE:${item.id}`} size={160} />
             </div>
             <div className="w-full space-y-3">
                <button onClick={() => setShowRestockModal(true)} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl transition-all">
                  <Plus size={20} /> REPOSIÇÃO
                </button>
                <button onClick={() => { setUsageType('BAIXA'); setShowUsageModal(true); }} disabled={item.quantity <= 0} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-red-600 shadow-xl transition-all disabled:opacity-50">
                  <MinusCircle size={20} /> BAIXA TOTAL
                </button>
                <button onClick={() => { setUsageType('SOBRA'); setShowUsageModal(true); }} disabled={item.quantity <= 0} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl transition-all disabled:opacity-50">
                  <Scissors size={20} /> REGISTRAR CORTE
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Modal de Uso / Sobra */}
      {showUsageModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-6 animate-popIn max-h-[95vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{usageType === 'BAIXA' ? 'BAIXA DE CHAPA' : 'REGISTRAR CORTE'}</h3>
               <button onClick={() => setShowUsageModal(false)} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 transition-colors"><XIcon size={24} /></button>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                    <input type="text" placeholder="Nome" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={client} onChange={e => setClient(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Projeto</label>
                    <input type="text" placeholder="Obra" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={project} onChange={e => setProject(e.target.value)} />
                  </div>
               </div>

               {usageType === 'SOBRA' && (
                 <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                       <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><ShoppingBag size={14} className="text-blue-500"/> Peça Cortada (O que saiu)</p>
                       <div className="grid grid-cols-2 gap-4">
                          <input type="number" placeholder="Largura (cm)" className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black" value={cutWidth || ''} onChange={e => setCutWidth(Number(e.target.value))} />
                          <input type="number" placeholder="Altura (cm)" className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black" value={cutHeight || ''} onChange={e => setCutHeight(Number(e.target.value))} />
                       </div>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-200 space-y-4">
                       <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><Scissors size={14} className="text-blue-500"/> Sobra (O que voltou ao cavalete)</p>
                       <div className="grid grid-cols-2 gap-4">
                          <input type="number" placeholder="Largura (cm)" className="w-full p-4 bg-white border border-blue-200 rounded-xl font-black" value={leftoverWidth || ''} onChange={e => setLeftoverWidth(Number(e.target.value))} />
                          <input type="number" placeholder="Altura (cm)" className="w-full p-4 bg-white border border-blue-200 rounded-xl font-black" value={leftoverHeight || ''} onChange={e => setLeftoverHeight(Number(e.target.value))} />
                       </div>
                    </div>
                 </div>
               )}

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações</label>
                  <textarea placeholder="Detalhes adicionais..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-20 resize-none outline-none" value={observations} onChange={e => setObservations(e.target.value)}></textarea>
               </div>

               <button onClick={handleRegisterUsage} className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl transition-all text-white ${usageType === 'BAIXA' ? 'bg-slate-900 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                 CONFIRMAR MOVIMENTAÇÃO
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reposição */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl space-y-6 animate-popIn">
            <h3 className="text-2xl font-black text-slate-900 uppercase">REPOSIÇÃO</h3>
            <div className="space-y-6">
               <input type="number" className="w-full p-6 bg-emerald-50 border-2 border-emerald-100 rounded-3xl font-black text-4xl text-emerald-700 text-center outline-none" value={restockQty} onChange={e => setRestockQty(Number(e.target.value))} min="1" />
               <p className="text-[10px] text-emerald-600 font-black uppercase text-center tracking-widest">Quantas unidades estão entrando?</p>
               <button onClick={handleRestock} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-emerald-700 transition-all">ADICIONAR AO ESTOQUE</button>
            </div>
          </div>
        </div>
      )}

      {showImageZoom && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-4" onClick={() => setShowImageZoom(false)}>
          <img src={item.photos[0]} className="max-w-full max-h-full rounded-3xl shadow-2xl" alt="" />
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
