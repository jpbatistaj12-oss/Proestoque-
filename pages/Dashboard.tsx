
import React from 'react';
import { InventoryItem, StockStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package, AlertTriangle, CheckCircle, Scissors } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  onSelectItem: (uid: string) => void;
  onFilterRequest?: (filter: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, onSelectItem, onFilterRequest }) => {
  // Quantidade total de chapas inteiras (disponíveis e não são sobras)
  const wholePlatesCount = inventory.reduce((acc, item) => {
    if (item.status !== StockStatus.COM_SOBRA && Number(item.quantity) > 0) {
      return acc + Number(item.quantity);
    }
    return acc;
  }, 0);

  // Itens que estão com estoque zerado
  const zeroStockCount = inventory.filter(item => Number(item.quantity) <= 0).length;

  // Quantidade de retalhos/sobras em estoque
  const sobrasCount = inventory.reduce((acc, item) => {
    if (item.status === StockStatus.COM_SOBRA && Number(item.quantity) > 0) {
      return acc + Number(item.quantity);
    }
    return acc;
  }, 0);

  // Dados para o gráfico por categoria (m² acumulado)
  const dataByCategory = Object.entries(
    inventory.reduce((acc, item) => {
      const area = Number(item.availableArea) || 0;
      const qty = Number(item.quantity) || 0;
      acc[item.category] = (acc[item.category] || 0) + (area * qty);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ 
    name, 
    value: Number(value.toFixed(2)) 
  }));

  const recentItems = [...inventory]
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
    .slice(0, 5);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-10">
      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onFilterRequest && onFilterRequest('inteira')}
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        >
          <StatCard 
            title="Chapas em Estoque" 
            value={wholePlatesCount} 
            icon={<CheckCircle size={24} className="text-emerald-500" />} 
            subtitle="Materiais inteiros disponíveis"
            color="border-emerald-100 hover:bg-emerald-50/30 shadow-sm"
          />
        </div>

        <div 
          onClick={() => onFilterRequest && onFilterRequest('zerado')}
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        >
          <StatCard 
            title="Estoque Zerado" 
            value={zeroStockCount} 
            icon={<AlertTriangle size={24} className={zeroStockCount > 0 ? "text-red-500" : "text-slate-300"} />} 
            color={zeroStockCount > 0 ? "border-red-200 bg-red-50" : "border-slate-100 shadow-sm"}
            subtitle="Materiais sem saldo"
          />
        </div>

        <div 
          onClick={() => onFilterRequest && onFilterRequest('sobra')}
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        >
          <StatCard 
            title="Estoque de Sobras" 
            value={sobrasCount} 
            icon={<Scissors size={24} className="text-purple-500" />} 
            color={sobrasCount > 0 ? "border-purple-200 bg-purple-50" : "border-slate-100 shadow-sm"}
            subtitle="Retalhos e recortes de corte"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">M² por Categoria</h3>
            <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-lg uppercase tracking-widest border border-slate-100">m² Acumulado</div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  fontWeight={800} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis fontSize={10} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 900, fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {dataByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Entradas Recentes</h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-hide">
            {recentItems.length > 0 ? recentItems.map(item => {
              const itemQty = Number(item.quantity) || 0;
              const itemArea = Number(item.availableArea) || 0;
              return (
                <div 
                  key={item.uid} 
                  onClick={() => onSelectItem(item.uid)}
                  className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-2xl cursor-pointer transition-all border border-transparent hover:border-slate-100 hover:shadow-md group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={item.photos[0] || 'https://via.placeholder.com/150'} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:rotate-3 transition-transform" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${itemQty > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors uppercase truncate max-w-[150px]">{item.commercialName}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{item.category} • Qtd: {itemQty}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900 tracking-tighter">{(itemArea * itemQty).toFixed(2)} m²</p>
                    <p className="text-[9px] text-slate-400 font-bold tracking-widest">{item.id}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40 grayscale">
                 <Package size={48} className="mb-4 text-slate-200" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Nenhum material cadastrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string; subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
  <div className={`bg-white p-8 rounded-[2.5rem] shadow-sm border ${color || 'border-slate-100'} flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all h-full relative overflow-hidden group`}>
    <div className="bg-white p-5 rounded-[1.5rem] shadow-inner border border-slate-100 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      {subtitle && <p className="text-[8px] text-slate-400 font-bold uppercase mt-3 tracking-widest">{subtitle}</p>}
    </div>
  </div>
);

export default Dashboard;
