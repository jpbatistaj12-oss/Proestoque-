
import React, { useState, useMemo } from 'react';
import { InventoryItem, CutHistoryRecord } from '../types';
import { Search, User as UserIcon, Calendar, Package, ChevronRight, FileText, ShoppingBag, Ruler } from 'lucide-react';

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
        // Busca agora inclui tanto saídas totais quanto registros de sobras/cortes
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
    <div className="space-y-6 animate-fadeIn pb-20 max-w-5xl mx-auto px-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 text-white p-5 rounded-[1.5rem] shadow-xl">
            <Search size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Projetos & Obras</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Rastreabilidade completa de peças e sobras</p>
          </div>
        </div>

        <div className="relative group">
          <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-all" size={24} />
          <input 
            type="text" 
            placeholder="Nome do cliente ou local da obra..." 
            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:outline-none focus:bg-white focus:ring-8 focus:ring-blue-600/5 font-black text-base transition-all shadow-inner placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-10">
        {projectsByClient.length > 0 ? projectsByClient.map((clientGroup, idx) => (
          <div key={idx} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slideUp">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white relative">
              <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/20">
                  <UserIcon size={28} />
                </div>
                <div>
                  <h3 className="font-black text-3xl uppercase tracking-tighter leading-none">{clientGroup.client}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">{clientGroup.cuts.length} PEÇA(S) REGISTRADA(S)</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6 bg-slate-50/20">
              {clientGroup.cuts.map((cc, cutIdx) => (
                <div 
                  key={cutIdx} 
                  onClick={() => onSelectItem(cc.item.id)}
                  className="p-8 bg-white border border-slate-100 rounded-[3rem] flex flex-col md:flex-row gap-10 items-center cursor-pointer group hover:shadow-2xl hover:border-blue-200 transition-all duration-500"
                >
                  <div className="relative shrink-0">
                    <img src={cc.item.photos[0]} className="w-28 h-28 rounded-[2rem] object-cover shadow-xl group-hover:rotate-6 transition-transform duration-500" alt="" />
                    <div className="absolute -top-3 -left-3 bg-slate-900 text-white px-4 py-2 text-[10px] font-black rounded-xl shadow-2xl border border-white/10">
                      ID: {cc.item.id}
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                       <h4 className="font-black text-slate-900 text-2xl uppercase tracking-tight group-hover:text-blue-600 transition-colors">{cc.cut.project}</h4>
                       <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-blue-100 self-center md:self-auto">
                          {cc.item.category}
                       </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        <Package size={16} className="text-slate-300" /> {cc.item.commercialName}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        <Calendar size={16} className="text-slate-300" /> {cc.cut.date}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-black text-blue-600 uppercase tracking-widest">
                        <Ruler size={16} className="text-blue-400" /> 
                        {cc.cut.cutWidth && cc.cut.cutHeight ? `Peça: ${cc.cut.cutWidth}x${cc.cut.cutHeight}cm` : `Total: ${cc.item.width}x${cc.item.height}cm`}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-center min-w-[160px] shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Área Entregue</p>
                    <p className="text-4xl font-black text-white tracking-tighter leading-none">
                      {cc.cut.areaUsed.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-black text-slate-500 uppercase mt-2">m² vendidos</p>
                  </div>

                  <div className="text-slate-200 group-hover:text-blue-500 transition-all hidden md:block group-hover:translate-x-2">
                    <ChevronRight size={40} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="py-40 text-center space-y-8 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
             <div className="bg-slate-50 w-32 h-32 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner border border-slate-100">
                <FileText size={64} />
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Base de dados limpa</h3>
                <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.4em] mt-4">Localize obras buscando pelo nome do cliente</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSearch;
