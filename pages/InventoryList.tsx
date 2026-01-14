
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, MaterialCategory, StockStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Package, CheckCircle, AlertCircle, Ruler, MapPin, QrCode, FileX, Database, ArrowUpAZ, ArrowDownZA, X, Scissors, ShoppingBag, Trash2 } from 'lucide-react';
import { deleteItem } from '../services/storageService';

interface InventoryListProps {
  inventory: InventoryItem[];
  onSelectItem: (uid: string) => void;
  onNewItem: () => void;
  onScan: () => void;
  onRefresh: () => void;
  initialFilter?: string;
  onFilterCleared?: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onSelectItem, onNewItem, onScan, onRefresh, initialFilter, onFilterCleared }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estados de Filtros Rápidos
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'available' | 'zero' | 'low' | 'sobra'>('all');

  useEffect(() => {
    if (initialFilter === 'zerado') setActiveQuickFilter('zero');
    else if (initialFilter === 'inteira') setActiveQuickFilter('available');
    else if (initialFilter === 'sobra') setActiveQuickFilter('sobra');
  }, [initialFilter]);

  // Cálculos para os contadores dos cards
  const stats = useMemo(() => ({
    available: inventory.filter(i => Number(i.quantity) > 0 && i.status !== StockStatus.COM_SOBRA).length,
    zero: inventory.filter(i => Number(i.quantity) <= 0).length,
    low: inventory.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= i.minQuantity).length,
    sobra: inventory.filter(i => i.status === StockStatus.COM_SOBRA && Number(i.quantity) > 0).length,
  }), [inventory]);

  const filteredItems = useMemo(() => {
    let result = inventory.filter(item => {
      // Aplicar filtros rápidos das caixinhas
      if (activeQuickFilter === 'zero' && Number(item.quantity) > 0) return false;
      if (activeQuickFilter === 'available' && (Number(item.quantity) <= 0 || item.status === StockStatus.COM_SOBRA)) return false;
      if (activeQuickFilter === 'sobra' && (Number(item.quantity) <= 0 || item.status !== StockStatus.COM_SOBRA)) return false;
      if (activeQuickFilter === 'low' && (Number(item.quantity) <= 0 || Number(item.quantity) > item.minQuantity)) return false;

      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = item.commercialName.toLowerCase().includes(lowerSearch) || 
                            item.id.toLowerCase().includes(lowerSearch) ||
                            item.entryIndex.toString() === searchTerm;
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });

    return result.sort((a, b) => {
      return sortOrder === 'asc' ? a.entryIndex - b.entryIndex : b.entryIndex - a.entryIndex;
    });
  }, [inventory, searchTerm, filterCategory, sortOrder, activeQuickFilter]);

  const clearFilters = () => {
    setActiveQuickFilter('all');
    setSearchTerm('');
    setFilterCategory('all');
    if (onFilterCleared) onFilterCleared();
  };

  const toggleFilter = (filter: typeof activeQuickFilter) => {
    setActiveQuickFilter(activeQuickFilter === filter ? 'all' : filter);
  };

  const handleDelete = (uid: string, name: string) => {
    if (window.confirm(`Deseja realmente EXCLUIR permanentemente o material "${name}" do sistema?`)) {
      deleteItem(uid);
      onRefresh();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* GRID DE CAIXINHAS DE FILTRO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideUp">
         <FilterCard 
           label="Disponível" 
           count={stats.available} 
           icon={<CheckCircle size={20} />} 
           isActive={activeQuickFilter === 'available'}
           onClick={() => toggleFilter('available')}
           colorClass="text-emerald-500 bg-emerald-50 border-emerald-100"
           activeColorClass="ring-emerald-500 bg-emerald-500 text-white"
         />
         <FilterCard 
           label="Estoque Baixo" 
           count={stats.low} 
           icon={<AlertCircle size={20} />} 
           isActive={activeQuickFilter === 'low'}
           onClick={() => toggleFilter('low')}
           colorClass="text-amber-500 bg-amber-50 border-amber-100"
           activeColorClass="ring-amber-500 bg-amber-500 text-white"
         />
         <FilterCard 
           label="Estoque Zerado" 
           count={stats.zero} 
           icon={<FileX size={20} />} 
           isActive={activeQuickFilter === 'zero'}
           onClick={() => toggleFilter('zero')}
           colorClass="text-red-500 bg-red-50 border-red-100"
           activeColorClass="ring-red-500 bg-red-500 text-white"
         />
         <FilterCard 
           label="Sobras" 
           count={stats.sobra} 
           icon={<Scissors size={20} />} 
           isActive={activeQuickFilter === 'sobra'}
           onClick={() => toggleFilter('sobra')}
           colorClass="text-purple-500 bg-purple-50 border-purple-100"
           activeColorClass="ring-purple-500 bg-purple-500 text-white"
         />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar material ou série..." 
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none font-black text-sm transition-all focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:w-48 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-700 appearance-none cursor-pointer outline-none uppercase tracking-widest"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">TODAS CATEGORIAS</option>
            {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm">
            {sortOrder === 'asc' ? <ArrowUpAZ size={20} /> : <ArrowDownZA size={20} />}
          </button>
        </div>
        <button onClick={onNewItem} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
           <Database size={16} /> NOVO MATERIAL
        </button>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredItems.map(item => (
            <div key={item.uid} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
              <div className={`h-2 ${item.status === StockStatus.COM_SOBRA ? 'bg-purple-500' : (item.quantity <= 0 ? 'bg-red-500' : 'bg-slate-900')}`}></div>
              <div className="p-8 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                    <img src={item.photos[0]} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-0 left-0 bg-black/60 text-white text-[8px] font-black p-1">#{item.entryIndex}</div>
                  </div>
                  <div className="text-right">
                     <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase border-2 ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                     </span>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">SÉRIE: {item.id}</p>
                  </div>
                </div>

                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase truncate leading-none mb-1 group-hover:text-blue-600 transition-colors">{item.commercialName}</h3>
                   <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.2em]">{item.category}</p>
                </div>

                <div className="bg-slate-50 rounded-3xl p-5 flex justify-between items-center border border-slate-100 shadow-inner">
                   <div className="text-center flex-1 border-r border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Medida</p>
                      <p className="text-sm font-black text-slate-800 tracking-tighter">{item.width}x{item.height}</p>
                   </div>
                   <div className="text-center flex-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Estoque</p>
                      <p className={`text-2xl font-black ${item.quantity <= 0 ? 'text-red-500' : 'text-slate-900'}`}>{item.quantity}</p>
                   </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onSelectItem(item.uid)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg">
                    <QrCode size={16} /> GERENCIAR
                  </button>
                  <button 
                    onClick={() => handleDelete(item.uid, item.commercialName)}
                    className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 active:scale-90"
                    title="Excluir Material"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <FileX size={64} className="text-slate-100 mb-4" />
          <h3 className="text-xl font-black text-slate-900 uppercase">Estoque Vazio</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum material encontrado nestes critérios.</p>
          <button onClick={clearFilters} className="mt-6 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Limpar todos os filtros</button>
        </div>
      )}
    </div>
  );
};

// Componente Interno para os Cards de Filtro
const FilterCard: React.FC<{ 
  label: string; 
  count: number; 
  icon: React.ReactNode; 
  isActive: boolean; 
  onClick: () => void;
  colorClass: string;
  activeColorClass: string;
}> = ({ label, count, icon, isActive, onClick, colorClass, activeColorClass }) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center text-center gap-3 active:scale-95 shadow-sm ${
      isActive 
        ? `${activeColorClass} shadow-xl ring-4` 
        : `${colorClass} hover:shadow-md hover:scale-[1.02]`
    }`}
  >
    <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={`text-2xl font-black tracking-tighter leading-none`}>{count}</p>
      <p className={`text-[9px] font-black uppercase tracking-widest mt-2 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{label}</p>
    </div>
  </button>
);

export default InventoryList;
