
import React, { useState, useMemo } from 'react';
import { InventoryItem, StockStatus } from '../types';
import { Scissors, Package, ArrowRight, Calendar, Maximize2, Search, User as UserIcon, Filter } from 'lucide-react';

interface HistoryLogProps {
  inventory: InventoryItem[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const allEvents = useMemo(() => {
    const events = inventory.flatMap(item => [
      {
        type: 'ENTRY',
        date: item.entryDate,
        itemName: item.commercialName,
        itemId: item.id,
        clientName: 'Entrada Inicial',
        details: `Entrada de material: ${item.availableArea.toFixed(2)} m²`,
        dims: `${item.originalWidth}x${item.originalHeight} cm`,
        user: 'Sistema'
      },
      ...item.history.map(h => ({
        type: 'CUT',
        date: h.date,
        itemName: item.commercialName,
        itemId: item.id,
        clientName: h.clientName || 'Consumo Interno',
        details: `Corte para ${h.project} (-${h.areaUsed.toFixed(2)} m²)`,
        dims: `Restou: ${h.leftoverWidth}x${h.leftoverHeight} cm`,
        user: h.operatorName || 'Oficina'
      }))
    ]);

    // Ordenação por data (mais recente primeiro)
    const sorted = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filtro por termo de busca (Cliente ou Projeto/Detalhes)
    if (!searchTerm) return sorted;
    
    const term = searchTerm.toLowerCase();
    return sorted.filter(event => 
      event.clientName.toLowerCase().includes(term) || 
      event.itemName.toLowerCase().includes(term) ||
      event.details.toLowerCase().includes(term) ||
      event.itemId.toLowerCase().includes(term)
    );
  }, [inventory, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fadeIn">
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Rastreabilidade</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Linha do tempo de movimentações e cortes</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Filter size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{allEvents.length} REGISTROS</span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Filtrar por nome do cliente, projeto ou chapa..." 
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-4 relative">
        {/* Linha vertical decorativa (Timeline) */}
        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-slate-100 hidden sm:block"></div>

        {allEvents.length > 0 ? allEvents.map((event, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 hover:shadow-xl hover:border-blue-100 transition-all relative z-10 group">
            <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
              event.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {event.type === 'ENTRY' ? <Package size={32} /> : <Scissors size={32} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                <div>
                  <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-tight">
                    {event.clientName}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {event.details}
                  </p>
                </div>
                <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                  <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                    event.type === 'ENTRY' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {event.type === 'ENTRY' ? 'ENTRADA' : 'CORTE'}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 font-mono hidden sm:block">#{event.itemId}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-blue-100">
                  <Maximize2 size={12} />
                  {event.dims}
                </div>
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-slate-100">
                  <Package size={12} />
                  {event.itemName}
                </div>
              </div>

              <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                <span className="flex items-center gap-2"><Calendar size={14} className="text-slate-300" /> {event.date}</span>
                <span className="flex items-center gap-2"><UserIcon size={14} className="text-slate-300" /> {event.user}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                <Search size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhum registro</h3>
             <p className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest">Tente outro termo de busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryLog;
