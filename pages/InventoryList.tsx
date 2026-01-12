
import React, { useState, useMemo } from 'react';
import { InventoryItem, MaterialCategory, StockStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Package, CheckCircle, AlertCircle, Layers, Ruler, Calendar, MapPin, QrCode, Eye, ChevronRight, FileX } from 'lucide-react';

interface InventoryListProps {
  inventory: InventoryItem[];
  onSelectItem: (id: string) => void;
  onNewItem: () => void;
  onScan: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onSelectItem, onNewItem, onScan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('Disponíveis');

  const stats = useMemo(() => {
    const totalArea = inventory.reduce((acc, item) => acc + item.availableArea, 0);
    const disponiveis = inventory.filter(i => i.status === StockStatus.INTEIRA).length;
    const sobras = inventory.filter(i => i.status === StockStatus.COM_SOBRA).length;
    const usados = inventory.filter(i => i.status === StockStatus.FINALIZADA).length;
    
    return { totalArea, disponiveis, sobras, usados };
  }, [inventory]);

  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      let matchesStatus = true;
      if (filterStatus === 'Disponíveis') matchesStatus = item.status === StockStatus.INTEIRA;
      else if (filterStatus === 'Sobras') matchesStatus = item.status === StockStatus.COM_SOBRA || item.status === StockStatus.EM_USO;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, filterCategory, filterStatus]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Fix: Correct '2d' to '2-digit' for toLocaleDateString options to fix TypeScript error
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total em Estoque" value={stats.totalArea.toFixed(0)} icon={<Package size={22} />} bg="bg-slate-50" color="text-slate-400" />
        <StatCard label="Disponíveis" value={stats.disponiveis} icon={<CheckCircle size={22} />} bg="bg-green-50" color="text-green-500" />
        <StatCard label="Sobras" value={stats.sobras} icon={<Layers size={22} />} bg="bg-blue-50" color="text-blue-500" />
        <StatCard label="Usados" value={stats.usados} icon={<AlertCircle size={22} />} bg="bg-amber-50" color="text-amber-500" />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..." 
              className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-slate-100 rounded-xl focus:outline-none font-medium text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              className="w-full md:w-48 pl-4 pr-10 py-3 bg-[#F8FAFC] border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Todos os Tipos</option>
              {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="flex bg-[#F8FAFC] p-1 rounded-xl border border-slate-100 w-full md:w-auto">
              {['Disponíveis', 'Sobras', 'Todos'].map((label) => (
                <button
                  key={label}
                  onClick={() => setFilterStatus(label)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === label ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
              {/* Barra superior colorida baseada no status (opcional, simulando o dark sliver da imagem) */}
              <div className="h-2 bg-[#1E293B]"></div>
              
              <div className="p-8 space-y-5">
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{item.commercialName}</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">{item.category} {item.commercialName.split(' ')[1] || ''}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-lg text-xs font-bold border ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </span>
                </div>

                {/* Info Técnica */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Ruler size={18} className="text-slate-400" />
                    <span className="text-sm font-medium">
                      {item.currentWidth} x {item.currentHeight} cm <span className="mx-2 text-slate-300">•</span> <span className="font-black text-slate-900">{item.availableArea.toFixed(2)} m²</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600">
                    <Package size={18} className="text-slate-400" />
                    <span className="text-sm font-medium">Espessura: {item.thickness}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="text-sm font-medium">{formatDate(item.entryDate)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin size={18} className="text-slate-400" />
                    <span className="text-sm font-black uppercase tracking-tight">{item.location || 'Local não definido'}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="space-y-3 pt-4">
                  <button 
                    onClick={() => onSelectItem(item.id)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-black text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    <QrCode size={18} className="text-slate-600" />
                    Código
                  </button>
                  <button 
                    onClick={() => onSelectItem(item.id)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-black text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    <Eye size={18} className="text-slate-600" />
                    Ver Desenho
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-slate-200"><FileX size={48} /></div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum material encontrado</h3>
          <div className="mt-8 flex gap-3">
             <button onClick={onNewItem} className="px-6 py-2.5 bg-[#1E293B] text-white rounded-xl text-sm font-bold">Novo Material</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, bg: string, color: string }> = ({ label, value, icon, bg, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`${bg} ${color} p-3 rounded-xl`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  </div>
);

export default InventoryList;
