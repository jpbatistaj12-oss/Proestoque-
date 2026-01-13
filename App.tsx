
import React, { useState, useEffect, useMemo } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { InventoryItem, User, UserRole } from './types';
import { getInventory, getCurrentUser, logout, getAllCompanies } from './services/storageService';
import { LogOut, LayoutGrid, ArrowLeftCircle, ShieldCheck, Bell, AlertTriangle, Package, ChevronRight, X } from 'lucide-react';

// Pages - Garantindo caminhos absolutos relativos à src/
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/InventoryList';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import QRScanner from './pages/QRScanner';
import HistoryLog from './pages/HistoryLog';
import TeamManagement from './pages/TeamManagement';
import Auth from './pages/Auth';
import ProjectSearch from './pages/ProjectSearch';
import PlatformManagement from './pages/PlatformManagement';
import SupportBot from './components/SupportBot';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [inventoryFilterMode, setInventoryFilterMode] = useState<string>('');
  
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sessionUser = getCurrentUser();
      if (sessionUser) {
        setUser(sessionUser);
        refreshInventory(impersonatedCompanyId || sessionUser.companyId);
        if (sessionUser.role === UserRole.SUPER_ADMIN && !impersonatedCompanyId) {
          setActiveTab('platform');
        }
      }
    } catch (e) {
      console.error("Erro na sessão:", e);
    }
  }, [impersonatedCompanyId]);

  const refreshInventory = (companyId: string) => {
    const data = getInventory(companyId);
    setInventory(data || []);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    setActiveTab('detail');
    setShowNotifications(false);
  };

  const handleDashboardFilter = (filter: string) => {
    setInventoryFilterMode(filter);
    setActiveTab('inventory');
    setSelectedItemId(null);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setImpersonatedCompanyId(null);
  };

  const currentCompanyId = impersonatedCompanyId || user?.companyId || '';
  const impersonatedCompanyName = impersonatedCompanyId ? getAllCompanies().find(c => c.id === impersonatedCompanyId)?.name : null;

  const renderContent = () => {
    if (selectedItemId && activeTab === 'detail') {
      return (
        <ItemDetail 
          itemId={selectedItemId} 
          companyId={currentCompanyId}
          onBack={() => setActiveTab('inventory')} 
          onUpdate={() => refreshInventory(currentCompanyId)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} onFilterRequest={handleDashboardFilter} />;
      case 'inventory':
        return (
          <InventoryList 
            inventory={inventory} 
            onSelectItem={handleSelectItem} 
            onNewItem={() => setActiveTab('add')} 
            onScan={() => setActiveTab('scanner')} 
            initialFilter={inventoryFilterMode}
            onFilterCleared={() => setInventoryFilterMode('')}
          />
        );
      case 'projects':
        return <ProjectSearch inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'add':
        return <AddItem onComplete={() => { refreshInventory(currentCompanyId); setActiveTab('inventory'); }} user={user!} companyId={currentCompanyId} />;
      case 'scanner':
        return <QRScanner onScan={handleSelectItem} />;
      case 'team':
        return <TeamManagement user={{ id: user!.id, companyId: currentCompanyId }} />;
      case 'history':
        return <HistoryLog inventory={inventory} />;
      case 'platform':
        return <PlatformManagement onImpersonate={(id) => { setImpersonatedCompanyId(id); setActiveTab('dashboard'); }} />;
      default:
        return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} />;
    }
  };

  if (!user) return <Auth onLogin={(u) => { setUser(u); refreshInventory(u.companyId); }} />;

  const zeroStockItems = inventory.filter(item => item.quantity <= 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><LayoutGrid size={24} /></div>
          <div>
            <h1 className="text-white font-black text-sm uppercase tracking-tight">{APP_NAME}</h1>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">v2.1 Stable</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedItemId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-red-400 transition-all">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeTab}</h2>
            {impersonatedCompanyName && <p className="text-[10px] text-amber-600 font-black uppercase">Visão: {impersonatedCompanyName}</p>}
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-400 hover:text-blue-600">
                <Bell size={22} />
                {zeroStockItems.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{zeroStockItems.length}</span>}
             </button>
             <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{user.name}</p>
                  <p className="text-[9px] text-blue-600 font-bold uppercase">{user.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black">{user.name.charAt(0)}</div>
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{renderContent()}</main>
      </div>
      <SupportBot />
    </div>
  );
};

export default App;
