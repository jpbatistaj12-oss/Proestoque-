
import React, { useState, useEffect } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, User } from '../types';
import { getItemByUid, saveItem, getCurrentUser } from '../services/storageService';
import { STATUS_COLORS } from '../constants';
import { ArrowLeft, Scissors, Ruler, Plus, X as XIcon, ShoppingBag, Maximize2, MapPin, History, PackagePlus, Save, ZoomIn } from 'lucide-react';
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
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [usageType, setUsageType] = useState<'BAIXA' | 'SOBRA' | 'ENTRADA'>('BAIXA');
  
  // Form States
  const [project, setProject] = useState('');
  const [client, setClient] = useState('');
  const [observations, setObservations] = useState('');
  const [cutWidth, setCutWidth] = useState<number>(0);
  const [cutHeight, setCutHeight] = useState<number>(0);
  const [leftoverWidth, setLeftoverWidth] = useState<number>(0);
  const [leftoverHeight, setLeftoverHeight] = useState<number>(0);
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

  if (!item) return <div className="p-20 text-center font-black uppercase">Carregando material...</div>;

  const handleRegisterUsage = () => {
    if (usageType !== 'ENTRADA' && item.quantity <= 0) return alert('Estoque esgotado para este material.');
    
    // Validações
    if (usageType === 'ENTRADA') {
        if (quantityToAdd <= 0) return alert('Informe uma quantidade válida.');
    } else {
        if (!project || !client) return alert('Cliente e Projeto são obrigatórios para o histórico.');
    }

    let newQuantity = item.quantity;
    let newStatus = item.status;
    let areaUsed = 0;

    if (usageType === 'ENTRADA') {
        newQuantity = item.quantity + quantityToAdd;
        newStatus = StockStatus.DISPONIVEL;
    } else if (usageType === 'BAIXA') {
        newQuantity = item.quantity - 1;
        newStatus = newQuantity <= 0 ? StockStatus.ESGOTADO : item.status;
        areaUsed = (item.width * item.height) / 10000;
    } else if (usageType === 'SOBRA') {
        if (leftoverWidth <= 0 || leftoverHeight <= 0) return alert("Informe as medidas da sobra.");
        areaUsed = (cutWidth * cutHeight) / 10000;

        // Decrementa 1 do lote original
        newQuantity = item.quantity - 1;
        newStatus = newQuantity <= 0 ? StockStatus.ESGOTADO : item.status;

        // CRIAÇÃO AUTOMÁTICA DA SOBRA COMO NOVO ITEM
        const sobraUid = `SOBRA-${Date.now()}`;
        const sobraItem: InventoryItem = {
          ...item,
          uid: sobraUid,
          width: leftoverWidth,
          height: leftoverHeight,
          availableArea: (leftoverWidth * leftoverHeight) / 10000,
          quantity: 1,
          status: StockStatus.COM_SOBRA,
          history: [{
            id: `H-SOB-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            project: `Sobra gerada de: ${item.commercialName}`,
            clientName: 'Estoque de Retalhos',
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
      quantityChange: usageType === 'ENTRADA' ? quantityToAdd : -1,
      observations,
      operatorName: user?.name || 'Operador',
      areaUsed,
      cutWidth, cutHeight, leftoverWidth, leftoverHeight
    };

    saveItem({
      ...item,
      quantity: newQuantity, 
      status: newStatus, 
      history: [newRecord, ...item.history],
      lastUpdatedAt: new Date().toISOString()
    });

    setShowUsageModal(false);
    onUpdate();
    onBack();
  };

  return (
    <div className="pb-10 animate-fadeIn max-w-7xl mx-auto px-4">
      {/* HEADER SUPERIOR */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all group">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest">Painel de Estoque</span>
        </button>
        <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-black text-slate-900 text-xs uppercase tracking-widest">
          Nº SÉRIE: {item.id}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: DETALHES E FOTO */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            {/* FOTO E ZOOM */}
            <div className="md:w-[40%] p-8 bg-slate-50/50 flex flex-col items-center justify-center border-r border-slate-100 relative group">
               <div 
                 onClick={() => setShowFullPhoto(true)}
                 className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]"
               >
                  <img src={item.photos[0]} className="w-full h-full object-cover" alt={item.commercialName} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                       <ZoomIn size={32} />
                    </div>
                  </div>
               </div>
               <div className="mt-6 text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Identificação</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">SÉRIE: {item.id}</p>
               </div>
            </div>

            {/* INFO DO MATERIAL */}
            <div className="flex-1 p-10 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{item.commercialName}</h2>
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">{item.category}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{item.thickness}</span>
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border-2 shadow-sm ${STATUS_COLORS[item.status]}`}>
                  {item.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] text-center border border-slate-100 shadow-inner relative overflow-hidden group">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Qtd em Estoque</p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">{item.quantity}</p>
                    <PackagePlus className="absolute -bottom-2 -right-2 text-slate-100 group-hover:text-blue-50 transition-colors" size={64} />
                 </div>
                 <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl shadow-sm"><Ruler size={18} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimensões</p>
                          <p className="text-sm font-black text-slate-800">{item.width} x {item.height} cm</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl shadow-sm"><Maximize2 size={18} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Área Unitária</p>
                          <p className="text-sm font-black text-slate-800">{item.availableArea.toFixed(2)} m²</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl shadow-sm"><MapPin size={18} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localização</p>
                          <p className="text-sm font-black text-slate-800 uppercase">{item.location || 'NÃO DEFINIDO'}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO */}
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                   <History size={28} className="text-blue-600" /> Histórico de Movimentações
                </h3>
             </div>
             <div className="space-y-4">
               {item.history.length > 0 ? item.history.map(log => (
                 <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${log.type === 'ENTRADA' ? 'bg-emerald-500 shadow-emerald-500/20' : (log.type === 'SOBRA' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-slate-900 shadow-slate-900/20')}`}>
                       {log.type === 'ENTRADA' ? <Plus size={24} /> : <Scissors size={24} />}
                    </div>
                    <div className="flex-1">
                       <p className="text-lg font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">{log.project}</p>
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{log.clientName}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className={`text-xl font-black ${log.type === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {log.type === 'ENTRADA' ? `+${log.quantityChange}` : '-1'}
                       </p>
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{log.date}</p>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-10 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhuma movimentação registrada.</div>
               )}
             </div>
          </div>
        </div>

        {/* COLUNA DIREITA: QR CODE E AÇÕES */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col items-center sticky top-8">
             <div className="p-8 bg-slate-50 rounded-[3rem] shadow-inner mb-10 border border-slate-100/50 hover:bg-white transition-colors">
                <QRCodeSVG value={item.id} size={180} />
             </div>
             
             <div className="w-full space-y-4">
                <button 
                   onClick={() => { setUsageType('ENTRADA'); setShowUsageModal(true); }} 
                   className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-lg active:scale-95 transition-all"
                >
                    <PackagePlus size={22} /> ADICIONAR ESTOQUE
                </button>
                <button 
                   onClick={() => { setUsageType('BAIXA'); setShowUsageModal(true); }} 
                   disabled={item.quantity <= 0} 
                   className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-lg active:scale-95 disabled:opacity-30"
                >
                   <ShoppingBag size={22} /> BAIXA TOTAL
                </button>
                <button 
                   onClick={() => { setUsageType('SOBRA'); setShowUsageModal(true); }} 
                   disabled={item.quantity <= 0} 
                   className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-30"
                >
                   <Scissors size={22} /> REGISTRAR CORTE
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* MODAL ZOOM DE FOTO */}
      {showFullPhoto && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[500] flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setShowFullPhoto(false)}
        >
          <button className="absolute top-10 right-10 p-5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all shadow-2xl">
            <XIcon size={32} />
          </button>
          <img 
            src={item.photos[0]} 
            className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-popIn" 
            alt="Chapa Ampliada"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* MODAL DE AÇÃO (BAIXA / CORTE / ENTRADA) */}
      {showUsageModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-12 shadow-2xl space-y-10 animate-popIn">
            <div className="flex justify-between items-center">
               <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                     {usageType === 'ENTRADA' ? 'Entrada manual' : (usageType === 'BAIXA' ? 'Saída de Chapa' : 'Registro de Corte')}
                  </h3>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Atualizando saldo de estoque</p>
               </div>
               <button onClick={() => setShowUsageModal(false)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                  <XIcon size={24} />
               </button>
            </div>

            <div className="space-y-8">
               {usageType === 'ENTRADA' ? (
                   <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-1">Quantidade a Repor</label>
                            <div className="relative">
                                <Plus className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
                                <input 
                                    type="number" 
                                    className="w-full pl-16 p-6 bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] font-black text-4xl text-blue-700 outline-none shadow-inner" 
                                    value={quantityToAdd} 
                                    onChange={e => setQuantityToAdd(Math.max(1, Number(e.target.value)))} 
                                />
                            </div>
                        </div>
                        <input type="text" placeholder="Observações/Fornecedor" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={observations} onChange={e => setObservations(e.target.value)} />
                   </div>
               ) : (
                   <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                            <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={client} onChange={e => setClient(e.target.value)} placeholder="Nome do Cliente" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Projeto/Obra</label>
                            <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={project} onChange={e => setProject(e.target.value)} placeholder="Ex: Banheiro Suíte" />
                          </div>
                       </div>

                       {usageType === 'SOBRA' && (
                         <div className="space-y-6">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4 shadow-inner">
                               <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-3"><ShoppingBag size={14}/> Peça Vendida (Vai p/ Obra)</p>
                               <div className="grid grid-cols-2 gap-4">
                                  <input type="number" placeholder="Largura cm" className="w-full p-4 bg-white border rounded-xl font-black text-center" value={cutWidth || ''} onChange={e => setCutWidth(Number(e.target.value))} />
                                  <input type="number" placeholder="Altura cm" className="w-full p-4 bg-white border rounded-xl font-black text-center" value={cutHeight || ''} onChange={e => setCutHeight(Number(e.target.value))} />
                               </div>
                            </div>
                            <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border-2 border-dashed border-blue-200 space-y-4">
                               <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-3"><Scissors size={14}/> Medida do Retalho (Volta p/ Estoque)</p>
                               <div className="grid grid-cols-2 gap-4">
                                  <input type="number" placeholder="Largura cm" className="w-full p-4 bg-white border rounded-xl font-black text-center" value={leftoverWidth || ''} onChange={e => setLeftoverWidth(Number(e.target.value))} />
                                  <input type="number" placeholder="Altura cm" className="w-full p-4 bg-white border rounded-xl font-black text-center" value={leftoverHeight || ''} onChange={e => setLeftoverHeight(Number(e.target.value))} />
                               </div>
                            </div>
                         </div>
                       )}
                   </div>
               )}

               <button 
                  onClick={handleRegisterUsage} 
                  className={`w-full py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-widest text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 ${usageType === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-slate-900 hover:bg-blue-600 shadow-slate-900/20'}`}
               >
                  {usageType === 'ENTRADA' ? <Save size={24} /> : null}
                  {usageType === 'ENTRADA' ? 'EFETIVAR REPOSIÇÃO' : 'CONFIRMAR E PROCESSAR'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
