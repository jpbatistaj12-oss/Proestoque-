
import React, { useState, useMemo } from 'react';
import { InventoryItem, MaterialCategory, StockStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Filter, Layers, Calendar, Truck, ArrowUpDown, Info, X, UserCheck } from 'lucide-react';

interface InventoryListProps {
  inventory: InventoryItem[];
  onSelectItem: (id: string) => void;
}

type SortOption = 'latest' | 'oldest' | 'area-desc' | 'area-asc' | 'name';

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterEntryDate, setFilterEntryDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Extrair fornecedores únicos para o filtro
  const suppliers = useMemo(() => {
    const set = new Set(inventory.map(item => item.supplier).filter(Boolean));
    return Array.from(set).sort();
  }, [inventory]);

  const filteredAndSortedItems = useMemo(() => {
    let result = inventory.filter(item => {
      const matchesSearch = item.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesSupplier = filterSupplier === 'all' || item.supplier === filterSupplier;
      const matchesEntryDate = !filterEntryDate || item.entryDate === filterEntryDate;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier && matchesEntryDate;
    });

    // Ordenação
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'latest': return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
        case 'oldest': return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        case 'area-desc': return b.availableArea - a.availableArea;
        case 'area-asc': return a.availableArea - b.availableArea;
        case 'name': return a.commercialName.localeCompare(b.commercialName);
        default: return 0;
      }
    });
  }, [inventory, searchTerm, filterCategory, filterStatus, filterSupplier, filterEntryDate, sortBy]);

  const totalFilteredArea = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, item) => acc + item.availableArea, 0);
  }, [filteredAndSortedItems]);

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterSupplier('all');
    setFilterEntryDate('');
    setSearchTerm('');
    setSortBy('latest');
  };

  const isFiltered = filterCategory !== 'all' || filterStatus !== 'all' || filterSupplier !== 'all' || filterEntryDate !== '' || searchTerm !== '';

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Barra de Busca e Filtros Superior */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome comercial ou ID..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative group min-w-[160px]">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select 
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="latest">MAIS RECENTES</option>
                <option value="oldest">MAIS ANTIGOS</option>
                <option value="area-desc">MAIOR ÁREA</option>
                <option value="area-asc">MENOR ÁREA</option>
                <option value="name">NOME (A-Z)</option>
              </select>
            </div>
            {isFiltered && (
              <button 
                onClick={clearFilters}
                className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors border border-red-100"
                title="Limpar todos os filtros"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Filtros omitidos para brevidade, mantendo os existentes... */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            <select 
              className={`w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase appearance-none cursor-pointer transition-colors ${filterCategory !== 'all' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-500'}`}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">TODAS CATEGORIAS</option>
              {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            <select 
              className={`w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase appearance-none cursor-pointer transition-colors ${filterSupplier !== 'all' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-500'}`}
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
            >
              <option value="all">FORNECEDORES</option>
              {suppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
            </select>
          </div>

          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            <select 
              className={`w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase appearance-none cursor-pointer transition-colors ${filterStatus !== 'all' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-500'}`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">TODOS STATUS</option>
              {Object.values(StockStatus).map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            <input 
              type="date"
              className={`w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-colors ${filterEntryDate !== '' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-500'}`}
              value={filterEntryDate}
              onChange={(e) => setFilterEntryDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Resumo da Listagem */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-2 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/10 text-white">
        <div className="flex items-center gap-4 py-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Itens Filtrados</span>
            <span className="text-lg font-black">{filteredAndSortedItems.length} Unidades</span>
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total em Estoque</span>
            <span className="text-lg font-black text-blue-400">{totalFilteredArea.toFixed(2)} m²</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-white/5 px-4 py-2 rounded-xl border border-white/5">
          <Info size={14} className="text-blue-400" /> Clique na chapa para detalhes e corte
        </div>
      </div>

      {/* Listagem de Itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => onSelectItem(item.id)}
            className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="h-52 relative overflow-hidden">
              <img 
                src={item.photos[0]} 
                alt={item.commercialName} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60"></div>
              
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 shadow-xl backdrop-blur-md ${STATUS_COLORS[item.status]}`}>
                  {item.status}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest backdrop-blur-xl border border-white/20 shadow-lg">
                  {item.id}
                </div>
                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg">
                  {item.category.toUpperCase()}
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-xl leading-tight group-hover:text-blue-600 transition-colors truncate">{item.commercialName}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Truck size={10} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider truncate">{item.supplier || 'Fornecedor N/A'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-blue-600 font-black text-2xl tracking-tighter">{item.availableArea.toFixed(2)}</span>
                  <span className="text-blue-400 font-bold text-[10px] ml-1 uppercase">m²</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-slate-100 flex items-center gap-1.5">
                  <Layers size={12} className="text-slate-400" /> {item.thickness}
                </div>
                <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-slate-100 flex items-center gap-1.5 truncate max-w-[120px]">
                  <UserCheck size={12} className="text-blue-400" /> {item.lastOperatorName || 'Entrada'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white shadow-lg flex items-center justify-center text-[10px] font-black">
                    {item.lastOperatorName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-400 font-black uppercase">Última ação por</span>
                    <span className="text-[10px] text-slate-700 font-bold">{item.lastOperatorName || 'Sistema'}</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ArrowUpDown size={18} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryList;
