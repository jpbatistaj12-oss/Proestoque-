
import React, { useState, useMemo } from 'react';
import { InventoryItem, CutHistoryRecord } from '../types';
import { Search, User as UserIcon, Calendar, Package, ChevronRight, FileText } from 'lucide-react';

interface ProjectSearchProps {
  inventory: InventoryItem[];
  onSelectItem: (id: string) => void;
}

const ProjectSearch: React.FC<ProjectSearchProps> = ({ inventory, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Agrupa os cortes por cliente
  const projectsByClient = useMemo(() => {
    const clients: Record<string, { client: string, cuts: { cut: CutHistoryRecord, item: InventoryItem }[] }> = {};

    inventory.forEach(item => {
      item.history.forEach(cut => {
        const client = cut.clientName || 'Cliente não informado';
        if (!clients[client]) {
          clients[client] = { client, cuts: [] };
        }
        clients[client].cuts.push({ cut, item });
      });
    });

    // Filtra pelo termo de busca
    return Object.values(clients).filter(c => 
      c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cuts.some(cc => cc.cut.project.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.client.localeCompare(b.client));
  }, [inventory, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Search size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Busca de Projetos</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pesquise por cliente ou nome do projeto</p>
          </div>
        </div>
        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Nome do cliente ou projeto..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projectsByClient.length > 0 ? projectsByClient.map((clientGroup, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">{clientGroup.client}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{clientGroup.cuts.length} Peças cortadas</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 divide-y divide-slate-50">
              {clientGroup.cuts.map((cc, cutIdx) => (
                <div 
                  key={cutIdx} 
                  onClick={() => onSelectItem(cc.item.id)}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 items-center cursor-pointer group hover:bg-slate-50/50 transition-colors"
                >
                  <img src={cc.item.photos[0]} className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                  
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">{cc.cut.project}</h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                        <Package size={12} /> {cc.item.commercialName}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                        <Calendar size={12} /> {cc.cut.date}
                      </span>
                    </div>
                  </div>

                  <div className="bg-red-50 px-4 py-2 rounded-2xl border border-red-100 text-center">
                    <p className="text-[10px] font-black text-red-400 uppercase">Área Peça</p>
                    <p className="text-xl font-black text-red-600 tracking-tighter">{cc.cut.areaUsed.toFixed(2)}m²</p>
                  </div>

                  <div className="text-slate-300 group-hover:text-blue-500 transition-colors hidden md:block">
                    <ChevronRight size={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="py-20 text-center space-y-4">
             <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <FileText size={40} />
             </div>
             <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum projeto encontrado para este termo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSearch;
