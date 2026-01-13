
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, MaterialCategory, StockStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Package, CheckCircle, AlertCircle, Ruler, Calendar, MapPin, QrCode, Eye, FileX, Database, Hash, ArrowUpAZ, ArrowDownZA, X, Scissors } from 'lucide-react';

interface InventoryListProps {
  inventory: InventoryItem[];
  onSelectItem: (id: string) => void;
  onNewItem: () => void;
  onScan: () => void;
  initialFilter?: string;
  onFilterCleared?: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onSelectItem, onNewItem, onScan, initialFilter, onFilterCleared }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isShowingZeroStock, setIsShowingZeroStock] = useState(false);
  const [isShowingAvailableOnly, setIsShowingAvailableOnly] = useState(false);
  const [isShowingSobrasOnly, setIsShowingSobrasOnly] = useState(false);

  useEffect(() => {
    if (initialFilter === 'zerado') {
      setIsShowingZeroStock(true);
      setIsShowingAvailableOnly(false);
      setIsShowingSobrasOnly(false);
    } else if (initialFilter === 'disponivel') {
      setIsShowingAvailableOnly(true);
      setIsShowingZeroStock(false);
      setIsShowingSobrasOnly(false);
    } else if (initialFilter === 'sobra') {
      setIsShowingSobrasOnly(true);
      setIsShowingZeroStock(false);
      setIsShowingAvailableOnly(false);
    }
    setSearchTerm('');
    setFilterCategory('all');
  }, [initialFilter]);

  const filteredItems = useMemo(() => {
    let result = inventory.filter(item => {
      if (isShowingZeroStock && item.quantity > 0) return false;
      if (isShowingAvailableOnly && item.quantity <= 0) return false;
      if (isShowingSobrasOnly && item.status !== StockStatus.COM_SOBRA) return false;

      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = item.commercialName.toLowerCase().includes(lowerSearch) || 
                            item.id.includes(lowerSearch) || 
                            item.entryIndex.toString() === searchTerm;
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });

    return result.sort((a, b) => {
      return sortOrder === 'asc' ? a.entryIndex - b.entryIndex : b.entryIndex - a.entryIndex;
    });
  }, [inventory, searchTerm, filterCategory, sortOrder, isShowingZeroStock, isShowingAvailableOnly, isShowingSobrasOnly]);

  const clearSpecialFilters = () => {
    setIsShowingZeroStock(false);
    setIsShowingAvailableOnly(false);
    setIsShowingSobrasOnly(false);
    if (onFilterCleared) onFilterCleared();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {isShowingZeroStock && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-3xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
             <AlertCircle className="text-red-500" size={20} />
             <p className="text-xs font-black text-red-700 uppercase tracking-widest">Filtrando por: Materiais Esgotados</p>
          </div>
          <button onClick={clearSpecialFilters} className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all">
            <X size={14} /> Limpar Filtro
          </button>
        </div>
      )}

      {isShowingAvailableOnly && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-3xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
             <CheckCircle className="text-green-500" size={20} />
             <p className="text-xs font-black text-green-700 uppercase tracking-widest">Exibindo: Apenas itens em estoque</p>
          </div>
          <button onClick={clearSpecialFilters} className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 hover:bg-green-600 hover:text-white transition-all">
            <X size={14} /> Ver Todos
          </button>
        </div>
      )}

      {isShowingSobrasOnly && (
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-3xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
             <Scissors className="text-purple-500" size={20} />
             <p className="text-xs font-black text-purple-700 uppercase tracking-widest">Filtro Ativo: Estoque de Sobras (Retalhos)</p>
          </div>
          <button onClick={clearSpecialFilters} className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-100 hover:bg-purple-600 hover:text-white transition-all">
            <X size={14} /> Limpar Filtro
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou Nº Série..." 
            className="w-full pl-11 pr-4 py-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl focus:outline-none font-black text-sm transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (isShowingZeroStock || isShowingAvailableOnly || isShowingSobrasOnly) clearSpecialFilters();
            }}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:w-64 px-6 py-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-sm font-black text-slate-700 appearance-none cursor-pointer outline-none"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              if (isShowingZeroStock || isShowingAvailableOnly || isShowingSobrasOnly) clearSpecialFilters();
            }}
          >
            <option value="all">TODOS OS TIPOS</option>
            {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm">
            {sortOrder === 'asc' ? <ArrowUpAZ size={20} /> : <ArrowDownZA size={20} />}
          </button>
        </div>
        <button onClick={onNewItem} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
           <Database size={16} /> NOVO MATERIAL
        </button>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 group">
              <div className={`h-2 ${item.status === StockStatus.COM_SOBRA ? 'bg-purple-500' : (item.quantity <= 0 ? 'bg-red-500' : 'bg-slate-900')} group-hover:bg-blue-600 transition-colors`}></div>
              
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm">
                    <img src={item.photos[0]} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-0 left-0 bg-slate-900 text-white px-2 py-1 text-[8px] font-black rounded-br-lg shadow-lg">
                      #{item.entryIndex}
                    </div>
                  </div>
                  <div className="text-right">
                     <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                     </span>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-3 flex items-center justify-end gap-1">
                        ID: <span className="text-slate-900">{item.id}</span>
                     </p>
                  </div>
                </div>

                <div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1 truncate">{item.commercialName}</h3>
                   <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em]">{item.category}</p>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-6 flex justify-between items-center border border-slate-100 shadow-inner">
                   <div className="text-center flex-1 border-r border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dimensões</p>
                      <p className="text-xl font-black text-slate-900">{item.width}x{item.height}</p>
                   </div>
                   <div className="text-center flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estoque</p>
                      <p className={`text-3xl font-black tracking-tighter ${item.quantity <= 0 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>{item.quantity}</p>
                   </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button onClick={() => onSelectItem(item.id)} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                    <QrCode size={18} /> GERENCIAR MATERIAL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <FileX size={64} className="text-slate-100 mb-6" />
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vazio</h3>
          <p className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest">Nenhum material encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
