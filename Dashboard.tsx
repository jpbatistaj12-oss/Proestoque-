
import React from 'react';
import { InventoryItem, StockStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Maximize2, AlertCircle, CheckCircle, Package } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  onSelectItem: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, onSelectItem }) => {
  const totalArea = inventory.reduce((acc, item) => acc + item.availableArea, 0);
  const itemsInUse = inventory.filter(item => item.status === StockStatus.EM_USO).length;
  const itemsLeftover = inventory.filter(item => item.status === StockStatus.COM_SOBRA).length;
  const itemsFull = inventory.filter(item => item.status === StockStatus.INTEIRA).length;

  const dataByCategory = Object.entries(
    inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.availableArea;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ 
    name, 
    value: Number((value as number).toFixed(2)) 
  }));

  const recentItems = [...inventory]
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
    .slice(0, 5);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Área Total" value={`${totalArea.toFixed(1)} m²`} icon={<Maximize2 size={20} className="text-blue-500" />} />
        <StatCard title="Disponíveis" value={itemsFull} icon={<CheckCircle size={20} className="text-green-500" />} />
        <StatCard title="Produção" value={itemsInUse} icon={<TrendingUp size={20} className="text-amber-500" />} />
        <StatCard title="Sobras" value={itemsLeftover} icon={<AlertCircle size={20} className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Estoque por Categoria</h3>
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
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Entradas Recentes</h3>
            <button className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors">Ver todos</button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {recentItems.length > 0 ? recentItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => onSelectItem(item.id)}
                className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-2xl cursor-pointer transition-all border border-transparent hover:border-slate-100 hover:shadow-md group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={item.photos[0]} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:rotate-3 transition-transform" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors uppercase truncate max-w-[120px]">{item.commercialName}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{item.category} • {item.thickness}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900 tracking-tighter">{item.availableArea.toFixed(2)} m²</p>
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest">{item.id}</p>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40 grayscale">
                 <Package size={48} className="mb-4 text-slate-200" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma chapa cadastrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-lg transition-shadow">
    <div className="bg-slate-50 p-4 rounded-2xl shrink-0 shadow-inner border border-slate-100/50">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 truncate">{title}</p>
      <p className="text-2xl font-black text-slate-900 truncate tracking-tighter">{value}</p>
    </div>
  </div>
);

export default Dashboard;
