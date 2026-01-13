
import React, { useState, useMemo } from 'react';
import { SupplyItem, User } from '../types';
import { saveSupplyItem } from '../services/storageService';
import { Search, FlaskConical, Plus, AlertCircle, ShoppingCart, History, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';

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

  const filteredSupplies = useMemo(() => {
    return supplies.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplies, searchTerm]);

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
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Estoque de Insumos</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Gestão de consumíveis e ferramentas</p>
        </div>
        <button onClick={onNewItem} className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 shadow-xl transition-all text-xs">
          <Plus size={20} /> Cadastrar Insumo
        </button>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Localizar insumo (PU, Cola, Disco...)" 
            className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSupplies.map(supply => {
          const isLowStock = supply.quantity <= supply.minQuantity;
          const isSelected = selectedSupply === supply.uid;

          return (
            <div key={supply.uid} className={`bg-white rounded-[3rem] border transition-all duration-500 overflow-hidden flex flex-col ${isSelected ? 'ring-4 ring-blue-600/10 shadow-2xl scale-[1.02]' : 'border-slate-100 shadow-sm'}`}>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <div className={`p-4 rounded-2xl ${isLowStock ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      <FlaskConical size={24} />
                   </div>
                   <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border-2 ${isLowStock ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {isLowStock ? 'Estoque Baixo' : 'Disponível'}
                   </div>
                </div>

                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{supply.name}</h3>
                   <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{supply.category}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-inner">
                   <div className="text-center flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Qtd Atual</p>
                      <p className="text-3xl font-black text-slate-900 leading-none">{supply.quantity} <span className="text-sm text-slate-400">{supply.unit}</span></p>
                   </div>
                   <div className="w-px h-10 bg-slate-200"></div>
                   <div className="text-center flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mínimo</p>
                      <p className="text-xl font-black text-slate-400">{supply.minQuantity}</p>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button onClick={() => setSelectedSupply(isSelected ? null : supply.uid)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                      {isSelected ? <ChevronUp size={16} /> : <ShoppingCart size={16} />} 
                      {isSelected ? 'Fechar' : 'Movimentar'}
                   </button>
                   <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100"><History size={20} /></button>
                </div>
              </div>

              {isSelected && (
                <div className="bg-slate-50 border-t border-slate-100 p-8 space-y-6 animate-slideUp">
                   <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        className="flex-1 p-5 bg-white border border-slate-200 rounded-2xl font-black text-2xl text-center outline-none" 
                        placeholder="0"
                        value={usageValue || ''}
                        onChange={e => setUsageValue(Number(e.target.value))}
                        min="1"
                      />
                      <div className="flex flex-col gap-2 flex-1">
                         <button onClick={() => handleAdjustStock(supply, usageValue, 'ENTRADA')} className="bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-[9px] hover:bg-emerald-600 transition-all">+ Repor</button>
                         <button onClick={() => handleAdjustStock(supply, usageValue, 'SAIDA')} className="bg-red-500 text-white py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-600 transition-all">- Retirar</button>
                      </div>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Informar quantidade em {supply.unit}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default SuppliesInventory;
