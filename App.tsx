
import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { InventoryItem, User, UserRole } from './types';
import { getInventory, getCurrentUser, logout, getAllCompanies } from './services/storageService';
import { LogOut, LayoutGrid, ArrowLeftCircle, Bell, Settings } from 'lucide-react';

// Pages
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
  const [isAppReady, setIsAppReady] = useState(false);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
      if (sessionUser.role === UserRole.SUPER_ADMIN) {
        setActiveTab('platform');
      } else {
        refreshInventory(sessionUser.companyId);
        setActiveTab('dashboard');
      }
    }
    setIsAppReady(true);
  }, []);

  const refreshInventory = (companyId: string) => {
    const data = getInventory(companyId);
    setInventory(data || []);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    setActiveTab('detail');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setImpersonatedCompanyId(null);
    setActiveTab('dashboard');
  };

  const currentCompanyId = impersonatedCompanyId || user?.companyId || '';
  const impersonatedCompanyName = impersonatedCompanyId ? getAllCompanies().find(c => c.id === impersonatedCompanyId)?.name : null;

  // Filtrar itens do menu com base no contexto (Plataforma vs Cliente)
  const menuItems = NAV_ITEMS.filter(item => {
    if (!user) return false;
    
    // Super Admin na Plataforma
    if (user.role === UserRole.SUPER_ADMIN && !impersonatedCompanyId) {
      return item.id === 'platform';
    }
    
    // Super Admin personificando ou Cliente comum
    if (impersonatedCompanyId || user.role !== UserRole.SUPER_ADMIN) {
      return item.id !== 'platform';
    }

    return false;
  });

  const renderContent = () => {
    if (selectedItemId && activeTab === 'detail') {
      return (
        <ItemDetail 
          itemId={selectedItemId} 
          companyId={currentCompanyId}
          onBack={() => { setActiveTab('inventory'); setSelectedItemId(null); }} 
          onUpdate={() => refreshInventory(currentCompanyId)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} onFilterRequest={(f) => setActiveTab('inventory')} />;
      case 'inventory': return <InventoryList inventory={inventory} onSelectItem={handleSelectItem} onNewItem={() => setActiveTab('add')} onScan={() => setActiveTab('scanner')} />;
      case 'projects': return <ProjectSearch inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'add': return <AddItem onComplete={() => { refreshInventory(currentCompanyId); setActiveTab('inventory'); }} user={user!} companyId={currentCompanyId} />;
      case 'scanner': return <QRScanner onScan={handleSelectItem} />;
      case 'team': return <TeamManagement user={{ id: user!.id, companyId: currentCompanyId }} />;
      case 'history': return <HistoryLog inventory={inventory} />;
      case 'platform': return <PlatformManagement onImpersonate={(id) => { setImpersonatedCompanyId(id); refreshInventory(id); setActiveTab('dashboard'); }} />;
      default: return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} />;
    }
  };

  if (!isAppReady) return null;
  if (!user) return <Auth onLogin={(u) => { 
    setUser(u); 
    if(u.role === UserRole.SUPER_ADMIN) setActiveTab('platform');
    else { refreshInventory(u.companyId); setActiveTab('dashboard'); }
  }} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="hidden md:flex w-72 bg-[#0f172a] flex-col border-r border-slate-800 shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20"><LayoutGrid size={24} /></div>
          <div>
            <h1 className="text-white font-black text-sm uppercase tracking-tighter leading-none">{APP_NAME}</h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-2">Enterprise V2.5</p>
          </div>
        </div>
        
        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          {impersonatedCompanyId && user.role === UserRole.SUPER_ADMIN && (
            <button
              onClick={() => { setImpersonatedCompanyId(null); setActiveTab('platform'); }}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all mb-6"
            >
              <ArrowLeftCircle size={20} /> Voltar p/ Plataforma
            </button>
          )}

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedItemId(null); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/30' 
                : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-5 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-10 bg-white border-b border-slate-200 shrink-0 z-20">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab === 'platform' ? 'Gerenciamento Global' : impersonatedCompanyName || activeTab}</h2>
            {impersonatedCompanyName && (
              <div className="mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Sessão Administrador Central</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-2">{user.role}</p>
                </div>
                <div className="w-12 h-12 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xl uppercase">
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
    </div>
  );
};

export default App;
