
import React, { useState, useMemo } from 'react';
import { InventoryItem, CutHistoryRecord } from '../types';
import { Search, User as UserIcon, Calendar, Package, ChevronRight, FileText, ShoppingBag } from 'lucide-react';

interface ProjectSearchProps {
  inventory: InventoryItem[];
  onSelectItem: (id: string) => void;
}

const ProjectSearch: React.FC<ProjectSearchProps> = ({ inventory, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const projectsByClient = useMemo(() => {
    const clients: Record<string, { client: string, cuts: { cut: CutHistoryRecord, item: InventoryItem }[] }> = {};

    inventory.forEach(item => {
      item.history.forEach(cut => {
        // Ignora entradas de estoque na busca de obras
        if (cut.type === 'ENTRADA') return;

        const client = cut.clientName || 'Cliente não informado';
        if (!clients[client]) {
          clients[client] = { client, cuts: [] };
        }
        clients[client].cuts.push({ cut, item });
      });
    });

    return Object.values(clients).filter(c => 
      c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cuts.some(cc => cc.cut.project.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.client.localeCompare(b.client));
  }, [inventory, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn pb-20 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="flex items-center gap-5 mb-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
            <Search size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Rastreio de Entregas</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Localize materiais por cliente ou obra</p>
          </div>
        </div>

        <div className="relative group">
          <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou nome da obra..." 
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/5 font-black text-sm transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-8">
        {projectsByClient.length > 0 ? projectsByClient.map((clientGroup, idx) => (
          <div key={idx} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slideUp">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white relative">
              <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h3 className="font-black text-2xl uppercase tracking-tight leading-none">{clientGroup.client}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Peças Entregues: {clientGroup.cuts.length}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-4 bg-slate-50/30">
              {clientGroup.cuts.map((cc, cutIdx) => (
                <div 
                  key={cutIdx} 
                  onClick={() => onSelectItem(cc.item.id)}
                  className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center cursor-pointer group hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
                >
                  <div className="relative shrink-0">
                    <img src={cc.item.photos[0]} className="w-24 h-24 rounded-[2rem] object-cover shadow-lg group-hover:rotate-3 transition-transform" alt="" />
                    <div className="absolute -top-2 -left-2 bg-slate-900 text-white px-3 py-1 text-[9px] font-black rounded-lg shadow-xl">
                      ID: {cc.item.id}
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                       <h4 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-none group-hover:text-blue-600 transition-colors">{cc.cut.project}</h4>
                       <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 self-center md:self-auto">
                          {cc.item.category}
                       </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Package size={14} className="text-slate-300" /> {cc.item.commercialName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={14} className="text-slate-300" /> {cc.cut.date}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        <ShoppingBag size={14} className="text-blue-400" /> 
                        {cc.cut.cutWidth && cc.cut.cutHeight ? `Peça: ${cc.cut.cutWidth}x${cc.cut.cutHeight}cm` : `Obra: ${cc.item.thickness}`}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-[2rem] text-center min-w-[140px] shadow-xl transform group-hover:scale-105 transition-transform">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Área Vendida</p>
                    <p className="text-3xl font-black text-white tracking-tighter">
                      {cc.cut.areaUsed.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">m² entregues</p>
                  </div>

                  <div className="text-slate-300 group-hover:text-blue-500 transition-colors hidden md:block">
                    <ChevronRight size={32} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="py-32 text-center space-y-6 bg-white rounded-[3.5rem] border border-dashed border-slate-200">
             <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
                <FileText size={48} />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sem projetos para exibir</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Use a barra de busca para filtrar obras</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSearch;
