
import React, { useState, useMemo } from 'react';
import { InventoryItem, MaterialCategory, StockStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Filter, Layers, Calendar, Truck } from 'lucide-react';

interface InventoryListProps {
  inventory: InventoryItem[];
  onSelectItem: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterEntryDate, setFilterEntryDate] = useState<string>('');

  // Extrair fornecedores únicos para o filtro
  const suppliers = useMemo(() => {
    const set = new Set(inventory.map(item => item.supplier).filter(Boolean));
    return Array.from(set).sort();
  }, [inventory]);

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSupplier = filterSupplier === 'all' || item.supplier === filterSupplier;
    const matchesEntryDate = !filterEntryDate || item.entryDate === filterEntryDate;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier && matchesEntryDate;
  });

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterSupplier('all');
    setFilterEntryDate('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Barra de Busca e Filtros Superior */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome comercial ou ID..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={clearFilters}
            className="px-6 py-3 text-sm font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Filtro Categoria */}
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={14} />
            <select 
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">TODAS CATEGORIAS</option>
              {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Filtro Status */}
          <div className="relative group">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={14} />
            <select 
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">TODOS STATUS</option>
              {Object.values(StockStatus).map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>

          {/* Filtro Fornecedor (NOVO) */}
          <div className="relative group">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={14} />
            <select 
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
            >
              <option value="all">FORNECEDORES</option>
              {suppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
            </select>
          </div>

          {/* Filtro Data de Entrada (NOVO) */}
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={14} />
            <input 
              type="date"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              value={filterEntryDate}
              onChange={(e) => setFilterEntryDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Listagem de Itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => onSelectItem(item.id)}
            className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="h-48 relative overflow-hidden">
              <img 
                src={item.photos[0]} 
                alt={item.commercialName} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 shadow-sm backdrop-blur-md ${STATUS_COLORS[item.status]}`}>
                {item.status}
              </div>
              <div className="absolute bottom-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-xl text-[10px] font-black tracking-widest backdrop-blur-md">
                {item.id}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">{item.commercialName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-blue-600 font-black text-xl tracking-tighter">{item.availableArea.toFixed(2)}</span>
                  <span className="text-blue-400 font-bold text-[10px] ml-1 uppercase">m²</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-slate-100">{item.thickness}</span>
                <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-slate-100">{item.currentWidth}x{item.currentHeight} cm</span>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-100 flex items-center gap-1">
                  <Truck size={10} /> {item.supplier || 'N/A'}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-[10px] text-slate-600 font-black">
                    {item.supplier?.charAt(0) || '?'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Entrada: {item.entryDate}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                  <Layers size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-32 text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={40} className="text-slate-200" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Nenhum material encontrado</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">Tente ajustar os filtros de fornecedor, data ou categoria para encontrar o que procura.</p>
          </div>
          <button 
            onClick={clearFilters}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
          >
            Resetar Todos Filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
