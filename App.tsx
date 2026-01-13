
import React, { useState, useEffect, useMemo } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { InventoryItem, User, UserRole } from './types';
import { getInventory, getCurrentUser, logout, getAllCompanies } from './services/storageService';
import { LogOut, LayoutGrid, ArrowLeftCircle, ShieldCheck, Bell, AlertTriangle, Package, ChevronRight, X } from 'lucide-react';

// Pages - Usando caminhos relativos consistentes
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
  const [isAppReady, setIsAppReady] = useState(false);
  
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sessionUser = getCurrentUser();
      if (sessionUser) {
        setUser(sessionUser);
        refreshInventory(impersonatedCompanyId || sessionUser.companyId);
        
        // Se for Super Admin sem empresa selecionada, vai para o painel de plataforma
        if (sessionUser.role === UserRole.SUPER_ADMIN && !impersonatedCompanyId) {
          setActiveTab('platform');
        }
      }
      setIsAppReady(true);
    } catch (e) {
      console.error("Erro crítico de inicialização:", e);
      setIsAppReady(true);
    }
  }, [impersonatedCompanyId]);

  const refreshInventory = (companyId: string) => {
    try {
      const data = getInventory(companyId);
      setInventory(data || []);
    } catch (e) {
      console.error("Falha ao carregar estoque:", e);
      setInventory([]);
    }
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
    setActiveTab('dashboard');
  };

  const currentCompanyId = impersonatedCompanyId || user?.companyId || '';
  const impersonatedCompanyName = impersonatedCompanyId ? getAllCompanies().find(c => c.id === impersonatedCompanyId)?.name : null;

  const renderContent = () => {
    if (selectedItemId && activeTab === 'detail') {
      return (
        <ItemDetail 
          itemId={selectedItemId} 
          companyId={currentCompanyId}
          onBack={() => {
            setActiveTab('inventory');
            setSelectedItemId(null);
          }} 
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

  if (!isAppReady) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={(u) => { setUser(u); refreshInventory(u.companyId); }} />;
  }

  const zeroStockItems = inventory.filter(item => item && item.quantity <= 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="hidden md:flex w-64 bg-[#0f172a] flex-col border-r border-slate-800 shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20"><LayoutGrid size={24} /></div>
          <div>
            <h1 className="text-white font-black text-sm uppercase tracking-tighter leading-none">{APP_NAME}</h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-2">Enterprise v2.5</p>
          </div>
        </div>
        
        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.filter(item => user && item.roles.includes(user.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedItemId(null); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/30' 
                : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className={activeTab === item.id ? 'animate-pulse' : ''}>{item.icon}</span> 
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-5 border-t border-slate-800">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-10 bg-white border-b border-slate-200 shrink-0 z-20">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab}</h2>
            {impersonatedCompanyName && (
              <div className="mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Atuando como: {impersonatedCompanyName}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-8">
             <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-3 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-2xl">
                <Bell size={24} />
                {zeroStockItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-4 border-white">
                    {zeroStockItems.length}
                  </span>
                )}
             </button>
             
             <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-2">{user.role}</p>
                </div>
                <div className="w-12 h-12 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-blue-500/20 uppercase">
                  {user.name.charAt(0)}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth bg-slate-50/50">
          {renderContent()}
        </main>
      </div>
      
      <SupportBot />
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-popIn { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
