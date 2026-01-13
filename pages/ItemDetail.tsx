
import React, { useState, useEffect } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, User } from '../types';
import { getItemByUid, saveItem, getCurrentUser, getInventory } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { ArrowLeft, Scissors, Ruler, Plus, X as XIcon, ShoppingBag, Maximize2, MapPin, History, PackagePlus, Save } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ItemDetailProps {
  itemUid: string;
  companyId: string;
  onBack: () => void;
  onUpdate: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ itemUid, companyId, onBack, onUpdate }) => {
  const [item, setItem] = useState<InventoryItem | undefined>();
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageType, setUsageType] = useState<'BAIXA' | 'SOBRA' | 'ENTRADA'>('BAIXA');
  const [project, setProject] = useState('');
  const [client, setClient] = useState('');
  const [observations, setObservations] = useState('');
  
  // Peça que SAIU (Para Projetos)
  const [cutWidth, setCutWidth] = useState<number>(0);
  const [cutHeight, setCutHeight] = useState<number>(0);

  // Sobra que FICOU (No Estoque)
  const [leftoverWidth, setLeftoverWidth] = useState<number>(0);
  const [leftoverHeight, setLeftoverHeight] = useState<number>(0);
  
  // Entrada de Material
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentItem = getItemByUid(itemUid, companyId);
    setItem(currentItem);
    setUser(getCurrentUser());
    if (currentItem) {
      setLeftoverWidth(currentItem.width);
      setLeftoverHeight(currentItem.height);
    }
  }, [itemUid, companyId]);

  if (!item) return <div className="p-20 text-center font-black uppercase">Carregando...</div>;

  const handleRegisterUsage = () => {
    if (usageType !== 'ENTRADA' && item.quantity <= 0) return alert('Estoque esgotado.');
    
    // Validações básicas por tipo
    if (usageType === 'ENTRADA') {
        if (quantityToAdd <= 0) return alert('Informe uma quantidade válida.');
    } else {
        if (!project || !client) return alert('Identificação (Cliente/Projeto) é obrigatória.');
    }

    let newQuantity = item.quantity;
    let newWidth = item.width;
    let newHeight = item.height;
    let newStatus = item.status;
    let areaSold = 0;

    if (usageType === 'ENTRADA') {
        newQuantity = item.quantity + quantityToAdd;
        newStatus = StockStatus.DISPONIVEL;
    } else if (usageType === 'BAIXA') {
      newQuantity = item.quantity - 1;
      newStatus = newQuantity <= 0 ? StockStatus.ESGOTADO : item.status;
      areaSold = (item.width * item.height) / 10000;
    } else if (usageType === 'SOBRA') {
      if (leftoverWidth <= 0 || leftoverHeight <= 0 || cutWidth <= 0 || cutHeight <= 0) {
        return alert("Informe as medidas da peça que saiu e da sobra.");
      }
      areaSold = (cutWidth * cutHeight) / 10000;

      // Decrementa 1 do item original
      newQuantity = item.quantity - 1;
      newStatus = newQuantity <= 0 ? StockStatus.ESGOTADO : item.status;

      // Cria NOVO registro para a SOBRA, mas com o MESMO ID visual (id) do original
      const sobraUid = `SOBRA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const sobraItem: InventoryItem = {
        ...item,
        uid: sobraUid,
        id: item.id, // MESMO ID VISUAL (ex: 0001)
        width: leftoverWidth,
        height: leftoverHeight,
        availableArea: (leftoverWidth * leftoverHeight) / 10000,
        quantity: 1,
        status: StockStatus.COM_SOBRA,
        history: [{
          id: `H-SOB-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          project: `Retalho originado de ${item.commercialName}`,
          clientName: 'Estoque de Sobras',
          type: 'SOBRA',
          quantityChange: 1,
          operatorName: user?.name || 'Sistema',
          areaUsed: 0,
          leftoverWidth,
          leftoverHeight
        }]
      };
      saveItem(sobraItem);
    }

    const newRecord: CutHistoryRecord = {
      id: `MOV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      project: usageType === 'ENTRADA' ? 'Reposição de Estoque' : project,
      clientName: usageType === 'ENTRADA' ? 'Almoxarifado' : client,
      type: usageType === 'ENTRADA' ? 'ENTRADA' : (usageType === 'BAIXA' ? 'SAIDA' : 'SOBRA'),
      quantityChange: usageType === 'ENTRADA' ? quantityToAdd : (usageType === 'BAIXA' ? -1 : (usageType === 'SOBRA' ? -1 : 0)),
      observations: observations + (usageType === 'SOBRA' ? ` [Corte p/ Cliente: ${cutWidth}x${cutHeight}]` : ''),
      operatorName: user?.name || 'Operador',
      areaUsed: areaSold,
      cutWidth, cutHeight, leftoverWidth, leftoverHeight
    };

    // Salva atualização do item original (ou decrementado)
    saveItem({
      ...item,
      quantity: newQuantity, 
      width: newWidth, 
      height: newHeight,
      status: newStatus, 
      history: [newRecord, ...item.history],
      lastUpdatedAt: new Date().toISOString()
    });

    setShowUsageModal(false);
    onUpdate();
    onBack();
  };

  return (
    <div className="pb-10 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all group">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all"><ArrowLeft size={20} /></div>
          <span className="font-black text-[10px] uppercase tracking-widest">Painel de Estoque</span>
        </button>
        <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-black text-slate-900 text-xs uppercase">SÉRIE: {item.id}</div>
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
                <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border-2 shrink-0 ${STATUS_COLORS[item.status]}`}>{item.status}</div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-100">
                 <div className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100 shadow-inner">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Qtd Atual</p>
                    <p className="text-4xl font-black text-slate-900">{item.quantity}</p>
                 </div>
                 <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3"><div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Ruler size={14} /></div><p className="text-xs font-bold text-slate-600">{item.width} x {item.height} cm</p></div>
                    <div className="flex items-center gap-3"><div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Maximize2 size={14} /></div><p className="text-xs font-bold text-slate-600">{item.availableArea.toFixed(2)} m² / un.</p></div>
                    <div className="flex items-center gap-3"><div className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"><MapPin size={14} /></div><p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{item.location || 'Sem local'}</p></div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-8"><History size={24} className="text-blue-600" /> Histórico de Movimentações</h3>
             <div className="space-y-4">
               {item.history.map(log => (
                 <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 ${log.type === 'ENTRADA' ? 'bg-emerald-500' : (log.type === 'SOBRA' ? 'bg-blue-500' : 'bg-red-500')}`}>{log.type === 'ENTRADA' ? <Plus size={28} /> : <Scissors size={28} />}</div>
                    <div className="flex-1 min-w-0">
                       <p className="text-lg font-black text-slate-900 uppercase truncate">{log.project}</p>
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{log.clientName}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                       <p className="text-xl font-black text-slate-900">{log.type === 'SAIDA' ? '-1' : (log.type === 'SOBRA' ? 'CORTE' : '+'+log.quantityChange)}</p>
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{log.date}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center sticky top-8">
             <div className="p-8 bg-slate-50 rounded-[3rem] shadow-inner mb-10 border border-slate-100/50"><QRCodeSVG value={item.id} size={180} /></div>
             <div className="w-full space-y-4">
                <button onClick={() => { setUsageType('ENTRADA'); setShowUsageModal(true); }} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
                    <PackagePlus size={22} /> ADICIONAR ESTOQUE
                </button>
                <button onClick={() => { setUsageType('BAIXA'); setShowUsageModal(true); }} disabled={item.quantity <= 0} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase flex items-center justify-center gap-3 hover:bg-red-600 transition-all disabled:opacity-50">BAIXA TOTAL</button>
                <button onClick={() => { setUsageType('SOBRA'); setShowUsageModal(true); }} disabled={item.quantity <= 0} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50">REGISTRAR CORTE</button>
             </div>
          </div>
        </div>
      </div>

      {showUsageModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl space-y-8 animate-popIn">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 uppercase">
                  {usageType === 'ENTRADA' ? 'Entrada de Material' : (usageType === 'BAIXA' ? 'Baixa de Chapa' : 'Registrar Corte')}
               </h3>
               <button onClick={() => setShowUsageModal(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"><XIcon size={24} /></button>
            </div>

            <div className="space-y-6">
               {usageType === 'ENTRADA' ? (
                   <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Quantidade a Adicionar</label>
                            <div className="relative">
                                <Plus className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
                                <input 
                                    type="number" 
                                    className="w-full pl-14 p-5 bg-blue-50 border-2 border-blue-100 rounded-[2rem] font-black text-3xl text-blue-700 outline-none" 
                                    value={quantityToAdd} 
                                    onChange={e => setQuantityToAdd(Math.max(1, Number(e.target.value)))} 
                                    min="1" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações / Fornecedor</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                                value={observations} 
                                onChange={e => setObservations(e.target.value)} 
                                placeholder="Opcional..." 
                            />
                        </div>
                   </div>
               ) : (
                   <>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                            <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={client} onChange={e => setClient(e.target.value)} placeholder="Nome do Cliente" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obra / Projeto</label>
                            <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={project} onChange={e => setProject(e.target.value)} placeholder="Ex: Cozinha" />
                          </div>
                       </div>

                       {usageType === 'SOBRA' && (
                         <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                               <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><ShoppingBag size={14}/> PEÇA VENDIDA (VAI P/ CLIENTE)</p>
                               <div className="grid grid-cols-2 gap-4">
                                  <input type="number" placeholder="Largura cm" className="w-full p-3 bg-white border rounded-xl font-black" value={cutWidth || ''} onChange={e => setCutWidth(Number(e.target.value))} />
                                  <input type="number" placeholder="Altura cm" className="w-full p-3 bg-white border rounded-xl font-black" value={cutHeight || ''} onChange={e => setCutHeight(Number(e.target.value))} />
                               </div>
                            </div>
                            <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-200 space-y-4">
                               <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><Scissors size={14}/> SOBRA (VOLTA PRO ESTOQUE)</p>
                               <div className="grid grid-cols-2 gap-4">
                                  <input type="number" placeholder="Largura cm" className="w-full p-3 bg-white border rounded-xl font-black" value={leftoverWidth || ''} onChange={e => setLeftoverWidth(Number(e.target.value))} />
                                  <input type="number" placeholder="Altura cm" className="w-full p-3 bg-white border rounded-xl font-black" value={leftoverHeight || ''} onChange={e => setLeftoverHeight(Number(e.target.value))} />
                               </div>
                            </div>
                         </div>
                       )}
                   </>
               )}

               <button 
                  onClick={handleRegisterUsage} 
                  className={`w-full py-6 rounded-[2rem] font-black uppercase text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${usageType === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-blue-600'}`}
               >
                  {usageType === 'ENTRADA' ? <Save size={20} /> : null}
                  {usageType === 'ENTRADA' ? 'SALVAR ENTRADA' : 'CONFIRMAR E PROCESSAR'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
