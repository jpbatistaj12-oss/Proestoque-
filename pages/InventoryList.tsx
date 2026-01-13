
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, MaterialCategory, StockStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Package, CheckCircle, AlertCircle, Ruler, MapPin, QrCode, FileX, Database, ArrowUpAZ, ArrowDownZA, X, Scissors } from 'lucide-react';

interface InventoryListProps {
  inventory: InventoryItem[];
  onSelectItem: (uid: string) => void;
  onNewItem: () => void;
  onScan: () => void;
  initialFilter?: string;
  onFilterCleared?: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onSelectItem, onNewItem, onScan, initialFilter, onFilterCleared }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estados de Filtros Rápidos
  const [isShowingZeroStock, setIsShowingZeroStock] = useState(false);
  const [isShowingInteirasOnly, setIsShowingInteirasOnly] = useState(false);
  const [isShowingSobrasOnly, setIsShowingSobrasOnly] = useState(false);

  useEffect(() => {
    // Reseta filtros antes de aplicar o novo vindo do Dashboard
    setIsShowingZeroStock(false);
    setIsShowingInteirasOnly(false);
    setIsShowingSobrasOnly(false);

    if (initialFilter === 'zerado') {
      setIsShowingZeroStock(true);
    } else if (initialFilter === 'inteira') {
      setIsShowingInteirasOnly(true);
    } else if (initialFilter === 'sobra') {
      setIsShowingSobrasOnly(true);
    }
  }, [initialFilter]);

  const filteredItems = useMemo(() => {
    let result = inventory.filter(item => {
      // Regras de filtragem estritas conforme solicitado
      if (isShowingZeroStock && Number(item.quantity) > 0) return false;
      if (isShowingInteirasOnly && (Number(item.quantity) <= 0 || item.status === StockStatus.COM_SOBRA)) return false;
      if (isShowingSobrasOnly && (Number(item.quantity) <= 0 || item.status !== StockStatus.COM_SOBRA)) return false;

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
  }, [inventory, searchTerm, filterCategory, sortOrder, isShowingZeroStock, isShowingInteirasOnly, isShowingSobrasOnly]);

  const clearFilters = () => {
    setIsShowingZeroStock(false);
    setIsShowingInteirasOnly(false);
    setIsShowingSobrasOnly(false);
    setSearchTerm('');
    setFilterCategory('all');
    if (onFilterCleared) onFilterCleared();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Banner de Filtro Ativo */}
      {(isShowingZeroStock || isShowingInteirasOnly || isShowingSobrasOnly) && (
        <div className={`p-4 rounded-3xl flex items-center justify-between animate-fadeIn border ${
          isShowingZeroStock ? 'bg-red-50 border-red-100 text-red-700' : 
          isShowingInteirasOnly ? 'bg-green-50 border-green-100 text-green-700' : 
          'bg-purple-50 border-purple-100 text-purple-700'
        }`}>
          <div className="flex items-center gap-3">
             {isShowingZeroStock ? <AlertCircle size={20}/> : isShowingInteirasOnly ? <CheckCircle size={20}/> : <Scissors size={20}/>}
             <p className="text-xs font-black uppercase tracking-widest">
               {isShowingZeroStock ? 'Exibindo: Materiais com estoque zerado' : 
                isShowingInteirasOnly ? 'Exibindo: Chapas inteiras disponíveis' : 
                'Exibindo: Apenas sobras e retalhos de corte'}
             </p>
          </div>
          <button onClick={clearFilters} className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent hover:border-slate-200 transition-all">Ver Tudo</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar material ou série..." 
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-black text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:w-48 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-700 appearance-none cursor-pointer outline-none uppercase tracking-widest"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">TODOS</option>
            {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all">
            {sortOrder === 'asc' ? <ArrowUpAZ size={20} /> : <ArrowDownZA size={20} />}
          </button>
        </div>
        <button onClick={onNewItem} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
           <Database size={16} /> NOVO MATERIAL
        </button>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.uid} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
              <div className={`h-2 ${item.status === StockStatus.COM_SOBRA ? 'bg-purple-500' : (item.quantity <= 0 ? 'bg-red-500' : 'bg-slate-900')}`}></div>
              <div className="p-8 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-100">
                    <img src={item.photos[0]} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-0 left-0 bg-black/60 text-white text-[8px] font-black p-1">#{item.entryIndex}</div>
                  </div>
                  <div className="text-right">
                     <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase border-2 ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                     </span>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">SÉRIE: {item.id}</p>
                  </div>
                </div>

                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase truncate leading-none mb-1">{item.commercialName}</h3>
                   <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">{item.category}</p>
                </div>

                <div className="bg-slate-50 rounded-3xl p-5 flex justify-between items-center border border-slate-100">
                   <div className="text-center flex-1 border-r border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Medida</p>
                      <p className="text-sm font-black text-slate-800 tracking-tighter">{item.width}x{item.height}</p>
                   </div>
                   <div className="text-center flex-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Estoque</p>
                      <p className={`text-2xl font-black ${item.quantity <= 0 ? 'text-red-500' : 'text-slate-900'}`}>{item.quantity}</p>
                   </div>
                </div>

                <button onClick={() => onSelectItem(item.uid)} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg">
                  <QrCode size={16} /> GERENCIAR
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <FileX size={64} className="text-slate-100 mb-4" />
          <h3 className="text-xl font-black text-slate-900 uppercase">Estoque Vazio</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum material encontrado nestes critérios.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
