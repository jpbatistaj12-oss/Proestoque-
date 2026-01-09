
import React from 'react';
import { InventoryItem, StockStatus } from '../types';
import { Scissors, Package, ArrowRight, Calendar, Maximize2 } from 'lucide-react';

interface HistoryLogProps {
  inventory: InventoryItem[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ inventory }) => {
  const allEvents = inventory.flatMap(item => [
    {
      type: 'ENTRY',
      date: item.entryDate,
      itemName: item.commercialName,
      itemId: item.id,
      details: `Entrada de material: ${item.availableArea.toFixed(2)} m²`,
      dims: `${item.originalWidth}x${item.originalHeight} cm`,
      user: 'Sistema'
    },
    ...item.history.map(h => ({
      type: 'CUT',
      date: h.date,
      itemName: item.commercialName,
      itemId: item.id,
      details: `Corte para ${h.project} (-${h.areaUsed.toFixed(2)} m²)`,
      dims: `Restou: ${h.leftoverWidth}x${h.leftoverHeight} cm`,
      user: 'Oficina'
    }))
  ]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Histórico Global</h2>
      
      <div className="space-y-4">
        {allEvents.map((event, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 hover:border-blue-100 transition-colors">
            <div className={`p-3 rounded-full h-fit shrink-0 ${
              event.type === 'ENTRY' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {event.type === 'ENTRY' ? <Package size={20} /> : <Scissors size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 truncate">{event.details}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold shrink-0 ml-2 ${
                  event.type === 'ENTRY' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {event.type}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Material: <span className="font-semibold">{event.itemName}</span> ({event.itemId})
              </p>
              
              <div className="flex items-center gap-2 mt-2 text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded text-[10px] font-bold">
                <Maximize2 size={12} />
                {event.dims}
              </div>

              <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                <span className="flex items-center gap-1"><ArrowRight size={12} /> {event.user}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allEvents.length === 0 && (
        <div className="text-center py-20 text-slate-400 italic">
          Nenhuma atividade registrada no sistema.
        </div>
      )}
    </div>
  );
};

export default HistoryLog;
