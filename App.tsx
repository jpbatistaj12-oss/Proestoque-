
import React, { useState, useEffect, useRef } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { InventoryItem, User, UserRole } from './types';
import { getInventory, getCurrentUser, logout, getAllCompanies } from './services/storageService';
import { LogOut, LayoutGrid, ArrowLeftCircle, Bell, Settings, X, ShoppingCart, AlertCircle, Menu } from 'lucide-react';

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
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAppReady, setIsAppReady] = useState(false);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<string | undefined>(undefined);
  
  // States para Notificações e Menu Mobile
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

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

    // Fechar notificações ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshInventory = (companyId: string) => {
    const data = getInventory(companyId);
    setInventory(data || []);
  };

  const handleSelectItem = (uid: string) => {
    setSelectedItemUid(uid);
    setActiveTab('detail');
    setShowNotifications(false);
    setIsMobileMenuOpen(false);
  };

  const handleFilterRequest = (filter: string) => {
    setInventoryFilter(filter);
    setActiveTab('inventory');
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setImpersonatedCompanyId(null);
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  const currentCompanyId = impersonatedCompanyId || user?.companyId || '';
  const impersonatedCompanyName = impersonatedCompanyId ? getAllCompanies().find(c => c.id === impersonatedCompanyId)?.name : null;

  // Itens com estoque zerado para o alerta do sino
  const zeroStockItems = inventory.filter(item => Number(item.quantity) <= 0);

  const menuItems = NAV_ITEMS.filter(item => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN && !impersonatedCompanyId) {
      return item.id === 'platform';
    }
    if (impersonatedCompanyId || user.role !== UserRole.SUPER_ADMIN) {
      return item.id !== 'platform';
    }
    return false;
  });

  const renderContent = () => {
    if (selectedItemUid && activeTab === 'detail') {
      return (
        <ItemDetail 
          itemUid={selectedItemUid} 
          companyId={currentCompanyId}
          onBack={() => { setActiveTab('inventory'); setSelectedItemUid(null); }} 
          onUpdate={() => refreshInventory(currentCompanyId)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} onFilterRequest={handleFilterRequest} />;
      case 'inventory': return (
        <InventoryList 
          inventory={inventory} 
          onSelectItem={handleSelectItem} 
          onNewItem={() => { setActiveTab('add'); setIsMobileMenuOpen(false); }} 
          onScan={() => { setActiveTab('scanner'); setIsMobileMenuOpen(false); }} 
          initialFilter={inventoryFilter}
          onFilterCleared={() => setInventoryFilter(undefined)}
        />
      );
      case 'projects': return <ProjectSearch inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'add': return <AddItem onComplete={() => { refreshInventory(currentCompanyId); setActiveTab('inventory'); }} user={user!} companyId={currentCompanyId} />;
      case 'scanner': return <QRScanner onScan={(id) => {
        const item = inventory.find(i => i.id === id);
        if (item) handleSelectItem(item.uid);
      }} />;
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
      {/* SIDEBAR DESKTOP */}
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
              onClick={() => { setActiveTab(item.id); setSelectedItemUid(null); setInventoryFilter(undefined); }}
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

      {/* DRAWER MOBILE */}
      <div className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-[#0f172a] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white"><LayoutGrid size={20} /></div>
              <h1 className="text-white font-black text-xs uppercase tracking-widest">{APP_NAME}</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
          </div>
          
          <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto scrollbar-hide">
             {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSelectedItemUid(null); setInventoryFilter(undefined); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          <div className="p-5 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all">
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 md:h-24 flex items-center justify-between px-6 md:px-10 bg-white border-b border-slate-200 shrink-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            {/* BOTÃO TRIGGER MOBILE */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 active:scale-90 transition-transform">
              <LayoutGrid size={22} />
            </button>
            
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none truncate">
                {activeTab === 'platform' ? 'Gerenciamento Global' : impersonatedCompanyName || activeTab}
              </h2>
              {impersonatedCompanyName && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                  <p className="text-[8px] md:text-[10px] text-amber-600 font-black uppercase tracking-widest truncate">Sessão Admin Central</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
             {/* SINO DE NOTIFICAÇÃO */}
             <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all relative ${showNotifications ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                   <Bell size={20} className={zeroStockItems.length > 0 && !showNotifications ? 'animate-bounce-slow md:block' : ''} />
                   {zeroStockItems.length > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-[9px] md:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                        {zeroStockItems.length}
                     </span>
                   )}
                </button>

                {/* PAINEL DE NOTIFICAÇÕES */}
                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-72 md:w-80 bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-popIn z-[100]">
                    <div className="bg-slate-900 p-4 md:p-5 text-white flex justify-between items-center">
                       <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Alertas de Compra</h4>
                       <ShoppingCart size={14} className="text-blue-400" />
                    </div>
                    <div className="max-h-[300px] md:max-h-[350px] overflow-y-auto p-2 scrollbar-hide">
                       {zeroStockItems.length > 0 ? (
                         zeroStockItems.map(item => (
                           <div 
                             key={item.uid} 
                             onClick={() => handleSelectItem(item.uid)}
                             className="p-3 md:p-4 hover:bg-slate-50 rounded-2xl cursor-pointer flex items-center gap-3 md:gap-4 transition-all group"
                           >
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                 <AlertCircle size={18} />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[11px] md:text-xs font-black text-slate-900 uppercase truncate">{item.commercialName}</p>
                                 <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase mt-1 truncate">SÉRIE: {item.id} • ZERADO</p>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="p-8 text-center space-y-3 opacity-40">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto"><Bell size={18} /></div>
                            <p className="text-[8px] font-black uppercase tracking-widest">Nenhum alerta pendente</p>
                         </div>
                       )}
                    </div>
                    {zeroStockItems.length > 0 && (
                      <div className="p-3 md:p-4 bg-slate-50 border-t border-slate-100">
                         <button 
                           onClick={() => { setActiveTab('inventory'); setInventoryFilter('zerado'); setShowNotifications(false); }}
                           className="w-full py-2.5 md:py-3 bg-white border border-slate-200 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                         >
                            Ver todos os itens zerados
                         </button>
                      </div>
                    )}
                  </div>
                )}
             </div>

             <div className="flex items-center gap-3 md:gap-4 border-l border-slate-200 pl-4 md:pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-2">{user.role}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-xl uppercase">
                  {user.name.charAt(0)}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth bg-slate-50/50">
          {renderContent()}
        </main>
      </div>
      <SupportBot />
    </div>
  );
};

export default App;
