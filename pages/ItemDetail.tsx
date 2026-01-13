
import React, { useState, useEffect } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, User } from '../types';
import { getItemById, saveItem, getCurrentUser, getInventory } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { 
  ArrowLeft, Scissors, Printer, MapPin, 
  X as XIcon, Package, PlusCircle, MinusCircle, 
  History, Maximize2, Ruler, ShoppingBag, Plus
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
  const [usageType, setUsageType] = useState<'BAIXA' | 'SOBRA'>('BAIXA');
  const [project, setProject] = useState('');
  const [client, setClient] = useState('');
  const [observations, setObservations] = useState('');
  const [restockQty, setRestockQty] = useState(1);
  
  // Peça que SAIU (Cliente)
  const [cutWidth, setCutWidth] = useState<number>(0);
  const [cutHeight, setCutHeight] = useState<number>(0);

  // Sobra que FICOU (Estoque)
  const [leftoverWidth, setLeftoverWidth] = useState<number>(0);
  const [leftoverHeight, setLeftoverHeight] = useState<number>(0);
  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentItem = getItemById(itemId, companyId);
    setItem(currentItem);
    setUser(getCurrentUser());
    if (currentItem) {
      // Sugere a sobra como as dimensões atuais até que o usuário altere
      setLeftoverWidth(currentItem.width);
      setLeftoverHeight(currentItem.height);
      setCutWidth(0);
      setCutHeight(0);
    }
  }, [itemId, companyId]);

  if (!item) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Localizando Material...</p>
    </div>
  );

  const handleRegisterUsage = () => {
    if (item.quantity <= 0) return alert('Estoque esgotado.');
    if (!project || !client) return alert('Identificação (Cliente/Obra) é obrigatória.');

    let newQuantity = item.quantity;
    let newWidth = item.width;
    let newHeight = item.height;
    let newStatus = item.status;
    let areaSold = 0;

    if (usageType === 'BAIXA') {
      newQuantity = item.quantity - 1;
      newStatus = newQuantity <= 0 ? StockStatus.ESGOTADO : (newQuantity <= item.minQuantity ? StockStatus.BAIXO_ESTOQUE : StockStatus.DISPONIVEL);
      areaSold = (item.width * item.height) / 10000;
    } else {
      if (leftoverWidth <= 0 || leftoverHeight <= 0 || cutWidth <= 0 || cutHeight <= 0) {
        return alert("Informe as medidas da peça que saiu e da sobra que retorna ao estoque.");
      }
      
      areaSold = (cutWidth * cutHeight) / 10000;

      // Se tiver mais de uma chapa igual, decrementa uma e cria uma nova entrada para a sobra
      if (item.quantity > 1) {
        newQuantity = item.quantity - 1;
        
        // Criar novo item para a sobra
        const allItems = getInventory(companyId);
        const lastIndex = allItems.reduce((max, i) => Math.max(max, i.entryIndex || 0), 0);
        const nextIdx = lastIndex + 1;

        const sobraItem: InventoryItem = {
          id: nextIdx.toString().padStart(4, '0'),
          entryIndex: nextIdx,
          companyId: companyId,
          category: item.category,
          commercialName: `${item.commercialName} (Sobra)`,
          thickness: item.thickness,
          width: leftoverWidth,
          height: leftoverHeight,
          availableArea: (leftoverWidth * leftoverHeight) / 10000,
          originalWidth: item.width,
          originalHeight: item.height,
          location: item.location,
          quantity: 1,
          minQuantity: 0,
          supplier: item.supplier,
          entryDate: new Date().toISOString(),
          photos: item.photos,
          status: StockStatus.COM_SOBRA,
          history: [{
            id: `SOB-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            project: `Sobra de ${item.commercialName}`,
            clientName: 'Estoque',
            type: 'ENTRADA',
            quantityChange: 1,
            operatorName: user?.name || 'Sistema',
            areaUsed: 0
          }],
          lastUpdatedAt: new Date().toISOString()
        };
        saveItem(sobraItem);
      } else {
        // Se for a última chapa, apenas atualiza as dimensões dela
        newWidth = leftoverWidth;
        newHeight = leftoverHeight;
        newStatus = StockStatus.COM_SOBRA;
      }
    }

    const newRecord: CutHistoryRecord = {
      id: `MOV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      project,
      clientName: client,
      type: usageType === 'BAIXA' ? 'SAIDA' : 'SOBRA',
      quantityChange: usageType === 'BAIXA' ? -1 : 0,
      observations: observations + (usageType === 'SOBRA' ? ` [Corte: ${cutWidth}x${cutHeight} | Sobra: ${newWidth}x${newHeight}]` : ''),
      operatorName: user?.name || 'Operador',
      areaUsed: areaSold,
      cutWidth: usageType === 'SOBRA' ? cutWidth : item.width,
      cutHeight: usageType === 'SOBRA' ? cutHeight : item.height,
      leftoverWidth: usageType === 'SOBRA' ? leftoverWidth : undefined,
      leftoverHeight: usageType === 'SOBRA' ? leftoverHeight : undefined
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
    if (restockQty <= 0) return alert('Quantidade inválida.');
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
        operatorName: user?.name || 'Sistema',
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
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all group">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest">Painel de Estoque</span>
        </button>
        <div className="flex items-center gap-3">
           <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-black text-slate-900 text-xs uppercase">
              REGISTRO: #{item.entryIndex}
           </div>
           <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 hover:shadow-md transition-all">
             <Printer size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-[35%] p-8 bg-slate-50/50 flex flex-col items-center justify-center border-r border-slate-100">
               <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white mb-6">
                  <img src={item.photos[0]} className="w-full h-full object-cover" alt="" />
               </div>
               <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Nº DE SÉRIE</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{item.id}</p>
               </div>
            </div>

            <div className="flex-1 p-10 space-y-8">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{item.commercialName}</h2>
                  <div className="flex items-center gap-3 mt-4">
                    <p className="text-xs text-blue-600 font-black uppercase tracking-widest">{item.category}</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{item.thickness}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border-2 shrink-0 ${STATUS_COLORS[item.status]}`}>
                  {item.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-100">
                 <div className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100 shadow-inner">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Chapas Inteiras</p>
                    <p className={`text-4xl font-black ${item.quantity <= 0 ? 'text-red-500' : 'text-slate-900'}`}>{item.quantity}</p>
                 </div>
                 <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Ruler size={14} /></div>
                      <p className="text-xs font-bold text-slate-600">{item.width} x {item.height} cm</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Maximize2 size={14} /></div>
                      <p className="text-xs font-bold text-slate-600">{item.availableArea.toFixed(2)} m² / un.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"><MapPin size={14} /></div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{item.location || 'Sem local'}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-8">
               <History size={24} className="text-blue-600" /> Histórico de Movimentações
             </h3>
             <div className="space-y-4">
               {item.history.length > 0 ? item.history.map(log => (
                 <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 ${log.type === 'ENTRADA' ? 'bg-emerald-500' : (log.type === 'SOBRA' ? 'bg-purple-500' : 'bg-red-500')}`}>
                       {log.type === 'ENTRADA' ? <PlusCircle size={28} /> : (log.type === 'SOBRA' ? <Scissors size={28} /> : <MinusCircle size={28} />)}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-lg font-black text-slate-900 uppercase truncate">{log.project}</p>
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{log.clientName}</p>
                       {log.observations && <p className="text-[10px] text-slate-400 mt-2 italic font-medium leading-relaxed">{log.observations}</p>}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                       <p className="text-xl font-black text-slate-900">
                         {log.type === 'ENTRADA' ? `+${log.quantityChange}` : (log.type === 'SOBRA' ? 'RECORTE' : '-1')}
                       </p>
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{log.date}</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-16 text-center opacity-30">
                    <Package size={64} className="mx-auto mb-4" />
                    <p className="font-black uppercase text-[10px] tracking-widest">Nenhuma movimentação registrada</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center sticky top-8">
             <div className="p-8 bg-slate-50 rounded-[3rem] shadow-inner mb-10 border border-slate-100/50">
               <QRCodeSVG value={`SERIE:${item.id}`} size={180} />
             </div>
             <div className="w-full space-y-4">
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
             <p className="mt-8 text-[9px] text-slate-400 font-black uppercase tracking-widest">Atualizado em: {new Date(item.lastUpdatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Modal de Uso / Sobra */}
      {showUsageModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl space-y-8 animate-popIn max-h-[95vh] overflow-y-auto scrollbar-hide border border-white/20">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-2xl text-white ${usageType === 'BAIXA' ? 'bg-slate-900' : 'bg-blue-600'}`}>
                   {usageType === 'BAIXA' ? <MinusCircle size={24}/> : <Scissors size={24}/>}
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                   {usageType === 'BAIXA' ? 'Baixa de Chapa' : 'Registrar Corte'}
                 </h3>
               </div>
               <button onClick={() => setShowUsageModal(false)} className="p-3 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><XIcon size={24} /></button>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                    <input type="text" placeholder="Nome" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={client} onChange={e => setClient(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obra / Projeto</label>
                    <input type="text" placeholder="Ex: Cozinha" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={project} onChange={e => setProject(e.target.value)} />
                  </div>
               </div>

               {usageType === 'SOBRA' && (
                 <div className="space-y-6">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4 shadow-inner">
                       <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                         <ShoppingBag size={14} className="text-blue-500"/> PEÇA VENDIDA (SAI DA LOJA)
                       </p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">LARGURA (CM)</label>
                            <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black text-lg" value={cutWidth || ''} onChange={e => setCutWidth(Number(e.target.value))} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">ALTURA (CM)</label>
                            <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black text-lg" value={cutHeight || ''} onChange={e => setCutHeight(Number(e.target.value))} />
                          </div>
                       </div>
                    </div>
                    <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-200 space-y-4 shadow-sm">
                       <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 tracking-widest">
                         <Scissors size={14} className="text-blue-500"/> SOBRA / RETALHO (FICA NA LOJA)
                       </p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">LARGURA (CM)</label>
                            <input type="number" className="w-full p-4 bg-white border border-blue-200 rounded-xl font-black text-lg text-blue-700" value={leftoverWidth || ''} onChange={e => setLeftoverWidth(Number(e.target.value))} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">ALTURA (CM)</label>
                            <input type="number" className="w-full p-4 bg-white border border-blue-200 rounded-xl font-black text-lg text-blue-700" value={leftoverHeight || ''} onChange={e => setLeftoverHeight(Number(e.target.value))} />
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
                  <textarea placeholder="Detalhes adicionais do corte..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-24 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={observations} onChange={e => setObservations(e.target.value)}></textarea>
               </div>

               <button onClick={handleRegisterUsage} className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all text-white active:scale-95 ${usageType === 'BAIXA' ? 'bg-slate-900 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                 CONFIRMAR E ATUALIZAR ESTOQUE
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reposição */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-popIn border border-white/20">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center">Entrada de Chapas</h3>
            <div className="space-y-8 text-center">
               <div className="relative">
                  <input type="number" className="w-full p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] font-black text-6xl text-emerald-700 text-center outline-none shadow-inner" value={restockQty} onChange={e => setRestockQty(Number(e.target.value))} min="1" />
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-4">Quantas unidades inteiras chegaram?</p>
               </div>
               <div className="flex gap-4">
                 <button onClick={() => setShowRestockModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                 <button onClick={handleRestock} className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:scale-95">Adicionar</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
