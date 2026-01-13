
import React, { useState, useEffect } from 'react';
import { InventoryItem, StockStatus, CutHistoryRecord, User } from '../types';
import { getItemById, saveItem, getCurrentUser } from '../services/storageService';
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
  
  // Peça que SAIU (Venda/Obra)
  const [cutWidth, setCutWidth] = useState<number>(0);
  const [cutHeight, setCutHeight] = useState<number>(0);

  // Sobra que FICOU (Volta ao cavalete)
  const [leftoverWidth, setLeftoverWidth] = useState<number>(0);
  const [leftoverHeight, setLeftoverHeight] = useState<number>(0);
  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentItem = getItemById(itemId, companyId);
    setItem(currentItem);
    setUser(getCurrentUser());
    if (currentItem) {
      setLeftoverWidth(currentItem.width);
      setLeftoverHeight(currentItem.height);
    }
  }, [itemId, companyId]);

  if (!item) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Carregando...</div>;

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
      areaUsed = (cutWidth * cutHeight) / 10000; // Registra a área do que SAIU
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
      cutWidth, cutHeight, leftoverWidth, leftoverHeight
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
  };

  return (
    <div className="pb-10 animate-fadeIn max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-black text-xs uppercase tracking-widest">
          <ArrowLeft size={18} /> Voltar ao Estoque
        </button>
        <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"><Printer size={20} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-slate-50 p-8 flex flex-col items-center justify-center border-r border-slate-100">
               <img src={item.photos[0]} className="w-full aspect-square object-cover rounded-3xl shadow-lg mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código de Série</p>
               <p className="text-xl font-black text-slate-900">{item.id}</p>
            </div>
            <div className="flex-1 p-10 space-y-6">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{item.commercialName}</h2>
                    <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest mt-1">{item.category} • {item.thickness}</p>
                 </div>
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 ${STATUS_COLORS[item.status]}`}>{item.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                 <div className="bg-slate-50 p-6 rounded-3xl text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Qtd</p>
                    <p className="text-4xl font-black text-slate-900">{item.quantity}</p>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Ruler size={14}/> {item.width}x{item.height}cm</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Maximize2 size={14}/> {item.availableArea.toFixed(2)} m²</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><MapPin size={14}/> {item.location || 'Sem local'}</div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-8"><History size={24} className="text-blue-600" /> Histórico de Cortes</h3>
             <div className="space-y-4">
               {item.history.map(log => (
                 <div key={log.id} className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${log.type === 'ENTRADA' ? 'bg-emerald-500' : (log.type === 'SOBRA' ? 'bg-purple-500' : 'bg-red-500')}`}>
                       {log.type === 'ENTRADA' ? <PlusCircle size={20} /> : (log.type === 'SOBRA' ? <Scissors size={20} /> : <MinusCircle size={20} />)}
                    </div>
                    <div className="flex-1">
                       <p className="text-sm font-black text-slate-900 uppercase">{log.project}</p>
                       <p className="text-[10px] text-blue-600 font-bold uppercase">{log.clientName}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-slate-900">{log.type === 'SOBRA' ? 'SOBRA' : log.quantityChange}</p>
                       <p className="text-[9px] text-slate-400 font-bold">{log.date}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-8 text-center space-y-6">
             <div className="p-6 bg-slate-50 rounded-3xl inline-block mx-auto mb-4">
                <QRCodeSVG value={item.id} size={150} />
             </div>
             <div className="space-y-3">
                <button onClick={() => { setUsageType('BAIXA'); setShowUsageModal(true); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all">Baixa Total</button>
                <button onClick={() => { setUsageType('SOBRA'); setShowUsageModal(true); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Registrar Corte</button>
             </div>
          </div>
        </div>
      </div>

      {showUsageModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-6 animate-popIn max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 uppercase">{usageType === 'BAIXA' ? 'Baixa de Chapa' : 'Registrar Corte'}</h3>
               <button onClick={() => setShowUsageModal(false)} className="p-2 bg-slate-100 rounded-full"><XIcon size={20}/></button>
            </div>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nome do Cliente" className="p-4 bg-slate-50 border rounded-2xl font-bold" value={client} onChange={e => setClient(e.target.value)} />
                  <input type="text" placeholder="Obra/Projeto" className="p-4 bg-slate-50 border rounded-2xl font-bold" value={project} onChange={e => setProject(e.target.value)} />
               </div>

               {usageType === 'SOBRA' && (
                 <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                       <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><ShoppingBag size={14}/> Peça que Saiu (Obra)</p>
                       <div className="grid grid-cols-2 gap-4">
                          <input type="number" placeholder="Largura (cm)" className="p-4 bg-white border rounded-xl font-black" value={cutWidth || ''} onChange={e => setCutWidth(Number(e.target.value))} />
                          <input type="number" placeholder="Altura (cm)" className="p-4 bg-white border rounded-xl font-black" value={cutHeight || ''} onChange={e => setCutHeight(Number(e.target.value))} />
                       </div>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                       <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><Scissors size={14}/> Sobra que Ficou (Estoque)</p>
                       <div className="grid grid-cols-2 gap-4">
                          <input type="number" placeholder="Largura (cm)" className="p-4 bg-white border rounded-xl font-black text-blue-700" value={leftoverWidth || ''} onChange={e => setLeftoverWidth(Number(e.target.value))} />
                          <input type="number" placeholder="Altura (cm)" className="p-4 bg-white border rounded-xl font-black text-blue-700" value={leftoverHeight || ''} onChange={e => setLeftoverHeight(Number(e.target.value))} />
                       </div>
                    </div>
                 </div>
               )}
               <textarea placeholder="Observações..." className="w-full p-4 bg-slate-50 border rounded-2xl font-bold h-24 resize-none" value={observations} onChange={e => setObservations(e.target.value)}></textarea>
               <button onClick={handleRegisterUsage} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Confirmar Movimentação</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
