
import React from 'react';
import { InventoryItem, StockStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Maximize2, AlertCircle, CheckCircle } from 'lucide-react';

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
    // Fix: Explicitly cast value as number to resolve 'unknown' type error when calling toFixed
    value: Number((value as number).toFixed(2)) 
  }));

  const recentItems = [...inventory]
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Área Total" value={`${totalArea.toFixed(2)} m²`} icon={<Maximize2 size={20} className="text-blue-500" />} />
        <StatCard title="Chapas Inteiras" value={itemsFull} icon={<CheckCircle size={20} className="text-green-500" />} />
        <StatCard title="Em Produção" value={itemsInUse} icon={<TrendingUp size={20} className="text-amber-500" />} />
        <StatCard title="Sobras" value={itemsLeftover} icon={<AlertCircle size={20} className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Área por Categoria (m²)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Entradas Recentes</h3>
          <div className="space-y-4">
            {recentItems.length > 0 ? recentItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => onSelectItem(item.id)}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <img src={item.photos[0]} className="w-12 h-12 rounded object-cover shadow-sm" alt="" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{item.commercialName}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{item.category} • {item.thickness}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.availableArea.toFixed(2)} m²</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.id}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-slate-400 italic text-sm">Nenhum material cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className="bg-slate-50 p-2.5 rounded-lg shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">{title}</p>
      <p className="text-lg font-black text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

export default Dashboard;
