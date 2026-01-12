
import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { InventoryItem, User, UserRole } from './types';
import { getInventory, getCurrentUser, logout, getAllCompanies } from './services/storageService';
import { LogOut, LayoutGrid, ArrowLeftCircle, ShieldCheck } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
      refreshInventory(impersonatedCompanyId || sessionUser.companyId);
      if (sessionUser.role === UserRole.SUPER_ADMIN && activeTab === 'inventory' && !impersonatedCompanyId) {
        setActiveTab('platform');
      }
    }
  }, [impersonatedCompanyId]);

  const refreshInventory = (companyId: string) => {
    setInventory(getInventory(companyId));
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    setActiveTab('detail');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setImpersonatedCompanyId(null);
  };

  const handleImpersonate = (companyId: string) => {
    setImpersonatedCompanyId(companyId);
    setActiveTab('dashboard');
  };

  const stopImpersonating = () => {
    setImpersonatedCompanyId(null);
    setActiveTab('platform');
  };

  if (!user) {
    return (
      <>
        <Auth onLogin={(u) => { 
          setUser(u); 
          refreshInventory(u.companyId); 
          if (u.role === UserRole.SUPER_ADMIN) setActiveTab('platform');
        }} />
        <SupportBot />
      </>
    );
  }

  const currentCompanyId = impersonatedCompanyId || user.companyId;
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
        return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'inventory':
        return <InventoryList inventory={inventory} onSelectItem={handleSelectItem} onNewItem={() => setActiveTab('add')} onScan={() => setActiveTab('scanner')} />;
      case 'projects':
        return <ProjectSearch inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'add':
        return <AddItem onComplete={() => { refreshInventory(currentCompanyId); setActiveTab('inventory'); }} user={user} companyId={currentCompanyId} />;
      case 'scanner':
        return <QRScanner onScan={handleSelectItem} />;
      case 'team':
        return <TeamManagement user={{ ...user, companyId: currentCompanyId }} />;
      case 'history':
        return <HistoryLog inventory={inventory} />;
      case 'platform':
        return <PlatformManagement onImpersonate={handleImpersonate} />;
      default:
        return <InventoryList inventory={inventory} onSelectItem={handleSelectItem} onNewItem={() => setActiveTab('add')} onScan={() => setActiveTab('scanner')} />;
    }
  };

  const filteredNav = NAV_ITEMS.filter(item => {
    if (impersonatedCompanyId && item.roles.includes('ADMIN')) return true;
    return item.roles.includes(user.role);
  });

  const pageTitles: Record<string, { title: string, subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Visão geral do negócio' },
    inventory: { title: 'Estoque', subtitle: 'Gerencie materiais disponíveis' },
    projects: { title: 'Projetos', subtitle: 'Busca por cliente ou obra' },
    add: { title: 'Cadastro', subtitle: 'Novas chapas no estoque' },
    scanner: { title: 'Scanner QR', subtitle: 'Identificação imediata' },
    team: { title: 'Equipe', subtitle: 'Permissões e acessos' },
    history: { title: 'Histórico', subtitle: 'Rastreabilidade completa' },
    platform: { title: 'Gestão Global', subtitle: 'Clientes e Assinaturas' },
    detail: { title: 'Material', subtitle: 'Detalhes técnicos' }
  };

  const activePageInfo = pageTitles[activeTab] || { title: APP_NAME, subtitle: '' };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside className="hidden md:flex w-64 bg-[#1E293B] flex-col shrink-0 border-r border-slate-200">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#334155] p-2 rounded-lg text-white">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight">{APP_NAME}</h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">v2.1 Secured</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedItemId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id ? 'bg-[#334155] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className={activeTab === item.id ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {impersonatedCompanyId && (
          <div className="px-4 py-4 border-t border-slate-700/50">
            <button 
              onClick={stopImpersonating}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
            >
              <ArrowLeftCircle size={18} /> Painel Global
            </button>
          </div>
        )}

        <div className="p-4 border-t border-slate-700/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden md:flex h-20 items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activePageInfo.title}</h2>
              <p className="text-xs text-slate-500 font-medium">{activePageInfo.subtitle}</p>
            </div>
            {impersonatedCompanyId && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl">
                 <ShieldCheck size={16} className="text-amber-600" />
                 <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">VISUALIZANDO: {impersonatedCompanyName}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
              <div className="text-right">
                 <p className="text-xs font-black text-slate-900">{user.name}</p>
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                {user.name.charAt(0)}
              </div>
          </div>
        </header>

        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <h1 className="text-lg font-bold tracking-tight">{activePageInfo.title}</h1>
          <button onClick={handleLogout} className="p-2 bg-slate-800 rounded-lg"><LogOut size={18} /></button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderContent()}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50">
          {filteredNav.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedItemId(null); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl flex-1 ${activeTab === item.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
              {item.icon}
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <SupportBot />
    </div>
  );
};

export default App;
