
import React, { useState, useMemo } from 'react';
import { SupplyItem, User } from '../types';
import { saveSupplyItem } from '../services/storageService';
import { 
  Search, FlaskConical, Plus, AlertCircle, ShoppingCart, 
  History, Trash2, Edit, ChevronDown, ChevronUp, 
  ArrowUpRight, ArrowDownRight, Package, Hash, Filter, X
} from 'lucide-react';

interface SuppliesInventoryProps {
  supplies: SupplyItem[];
  onNewItem: () => void;
  onUpdate: () => void;
  user: User;
}

const SuppliesInventory: React.FC<SuppliesInventoryProps> = ({ supplies, onNewItem, onUpdate, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupply, setSelectedSupply] = useState<string | null>(null);
  const [usageValue, setUsageValue] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'zero'>('all');

  const filteredSupplies = useMemo(() => {
    return supplies.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeFilter === 'zero') return matchesSearch && s.quantity <= 0;
      if (activeFilter === 'low') return matchesSearch && s.quantity > 0 && s.quantity <= s.minQuantity;
      
      return matchesSearch;
    });
  }, [supplies, searchTerm, activeFilter]);

  const handleAdjustStock = (supply: SupplyItem, amount: number, type: 'ENTRADA' | 'SAIDA') => {
    if (amount <= 0) return;
    
    const newQty = type === 'ENTRADA' ? supply.quantity + amount : supply.quantity - amount;
    if (newQty < 0) return alert("Estoque insuficiente.");

    const updated: SupplyItem = {
      ...supply,
      quantity: newQty,
      lastUpdatedAt: new Date().toISOString(),
      history: [
        {
          id: `SUP-H-${Date.now()}`,
          date: new Date().toISOString(),
          type,
          quantityChange: amount,
          operatorName: user.name,
          observations: type === 'SAIDA' ? 'Uso em produção' : 'Reposição de estoque'
        },
        ...supply.history
      ]
    };

    saveSupplyItem(updated);
    onUpdate();
    setUsageValue(0);
    setSelectedSupply(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20 px-4">
      {/* HEADER E AÇÕES RÁPIDAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Estoque de Insumos</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Materiais consumíveis, colas e ferramentas</p>
        </div>
        <button onClick={onNewItem} className="w-full lg:w-auto bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 shadow-xl transition-all text-xs active:scale-95">
          <Plus size={22} /> Cadastrar Novo Insumo
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Localizar por Nome, Categoria ou ID..." 
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-1 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setActiveFilter('low')}
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'low' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Estoque Baixo
            </button>
            <button 
              onClick={() => setActiveFilter('zero')}
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'zero' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Zerados
            </button>
          </div>
        </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSupplies.map(supply => {
          const isZeroStock = supply.quantity <= 0;
          const isLowStock = supply.quantity > 0 && supply.quantity <= supply.minQuantity;
          const isSelected = selectedSupply === supply.uid;

          return (
            <div key={supply.uid} className={`bg-white rounded-[3rem] border transition-all duration-500 overflow-hidden flex flex-col group ${isSelected ? 'ring-4 ring-blue-600/10 shadow-2xl scale-[1.02] z-10' : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100'}`}>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <div className={`p-4 rounded-[1.5rem] shadow-inner ${isZeroStock ? 'bg-red-50 text-red-500' : isLowStock ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                      <FlaskConical size={28} />
                   </div>
                   <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border-2 shadow-sm ${isZeroStock ? 'bg-red-500 text-white border-red-400 animate-pulse' : isLowStock ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {isZeroStock ? 'Estoque Zerado' : isLowStock ? 'Baixo Estoque' : 'Disponível'}
                   </div>
                </div>

                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <Hash size={12} className="text-slate-300" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{supply.id}</span>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">{supply.name}</h3>
                   <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">{supply.category}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-inner group-hover:bg-white transition-colors">
                   <div className="text-center flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Atual</p>
                      <p className={`text-4xl font-black tracking-tighter leading-none ${isZeroStock ? 'text-red-500' : 'text-slate-900'}`}>
                        {supply.quantity} 
                        <span className="text-[10px] text-slate-400 ml-1 font-bold">{supply.unit}</span>
                      </p>
                   </div>
                   <div className="w-px h-10 bg-slate-200"></div>
                   <div className="text-center flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mínimo</p>
                      <p className="text-xl font-black text-slate-400 tracking-tighter">{supply.minQuantity}</p>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => { setSelectedSupply(isSelected ? null : supply.uid); setUsageValue(0); }} 
                     className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                   >
                      {isSelected ? <X size={18} /> : <ShoppingCart size={18} />} 
                      {isSelected ? 'Fechar' : 'Movimentar'}
                   </button>
                   <button className="p-5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><History size={20} /></button>
                </div>
              </div>

              {isSelected && (
                <div className="bg-slate-900 p-8 space-y-6 animate-slideUp border-t border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <input 
                          type="number" 
                          className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-black text-3xl text-center text-white outline-none focus:ring-4 focus:ring-blue-500/20 transition-all" 
                          placeholder="0"
                          value={usageValue || ''}
                          onChange={e => setUsageValue(Math.abs(Number(e.target.value)))}
                          min="1"
                        />
                        <p className="absolute -bottom-5 left-0 right-0 text-[8px] font-black text-slate-500 uppercase text-center tracking-widest">Quantidade em {supply.unit}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                         <button 
                           onClick={() => handleAdjustStock(supply, usageValue, 'ENTRADA')} 
                           disabled={usageValue <= 0}
                           className="bg-emerald-500 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95"
                         >
                           <ArrowUpRight size={16} /> Reposição
                         </button>
                         <button 
                           onClick={() => handleAdjustStock(supply, usageValue, 'SAIDA')} 
                           disabled={usageValue <= 0 || supply.quantity < usageValue}
                           className="bg-red-500 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95"
                         >
                           <ArrowDownRight size={16} /> Registrar Saída
                         </button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredSupplies.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
              <Package size={64} className="mx-auto text-slate-100 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 uppercase">Nenhum Insumo</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-3">Ajuste os filtros ou cadastre um novo item</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default SuppliesInventory;
