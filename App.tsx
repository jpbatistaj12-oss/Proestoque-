
import React, { useState, useEffect, useRef } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { InventoryItem, User, UserRole, SupplyItem } from './types';
import { getInventory, getCurrentUser, logout, getAllCompanies, getSupplies, getCloudConfig } from './services/storageService';
import { LogOut, LayoutGrid, ArrowLeftCircle, Bell, Settings, X, ShoppingCart, AlertCircle, Menu, FlaskConical, Package, Cloud, ChevronRight } from 'lucide-react';

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
import SuppliesInventory from './pages/SuppliesInventory';
import AddSupply from './pages/AddSupply';
import SyncSettings from './pages/SyncSettings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [isAppReady, setIsAppReady] = useState(false);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<string | undefined>(undefined);
  const [cloudStatus, setCloudStatus] = useState<'ONLINE' | 'OFFLINE'>(getCloudConfig().status);
  
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

    const handleCloudUpdate = () => {
      setCloudStatus(getCloudConfig().status);
    };

    window.addEventListener('marm_cloud_updated', handleCloudUpdate);

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('marm_cloud_updated', handleCloudUpdate);
    };
  }, []);

  const refreshInventory = (companyId: string) => {
    const data = getInventory(companyId);
    const supplyData = getSupplies(companyId);
    setInventory(data || []);
    setSupplies(supplyData || []);
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

  const slabAlerts = inventory.filter(item => Number(item.quantity) <= item.minQuantity).map(item => ({
    uid: item.uid,
    id: item.id,
    name: item.commercialName,
    type: 'CHAPA',
    status: Number(item.quantity) <= 0 ? 'ZERADO' : 'BAIXO',
    icon: <Package size={16} />
  }));

  const supplyAlerts = supplies.filter(item => item.quantity <= item.minQuantity).map(item => ({
    uid: item.uid,
    id: item.id,
    name: item.name,
    type: 'INSUMO',
    status: item.quantity <= 0 ? 'ZERADO' : 'BAIXO',
    icon: <FlaskConical size={16} />
  }));

  const allAlerts = [...slabAlerts, ...supplyAlerts];

  const menuItems = NAV_ITEMS.filter(item => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN && !impersonatedCompanyId) return item.id === 'platform';
    if (impersonatedCompanyId || user.role !== UserRole.SUPER_ADMIN) {
       if (item.id === 'platform') return false;
       if (!item.roles.includes(user.role)) return false;
       return true;
    }
    return false;
  });

  const getActiveTabLabel = () => {
    if (activeTab === 'platform') return 'GERENCIAMENTO GLOBAL';
    if (impersonatedCompanyName) return impersonatedCompanyName.toUpperCase();
    const item = NAV_ITEMS.find(i => i.id === activeTab);
    return item ? item.label.toUpperCase() : activeTab.toUpperCase();
  };

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
          onRefresh={() => refreshInventory(currentCompanyId)}
          initialFilter={inventoryFilter}
          onFilterCleared={() => setInventoryFilter(undefined)}
        />
      );
      case 'supplies': return (
        <SuppliesInventory 
          supplies={supplies} 
          onNewItem={() => { setActiveTab('addSupply'); setIsMobileMenuOpen(false); }} 
          onUpdate={() => refreshInventory(currentCompanyId)}
          user={user!}
        />
      );
      case 'addSupply': return <AddSupply onComplete={() => { refreshInventory(currentCompanyId); setActiveTab('supplies'); }} user={user!} companyId={currentCompanyId} />;
      case 'projects': return <ProjectSearch inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'add': return <AddItem onComplete={() => { refreshInventory(currentCompanyId); setActiveTab('inventory'); }} user={user!} companyId={currentCompanyId} />;
      case 'scanner': return <QRScanner onScan={(id) => {
        const item = inventory.find(i => i.id === id);
        if (item) handleSelectItem(item.uid);
      }} />;
      case 'team': return <TeamManagement user={{ id: user!.id, companyId: currentCompanyId }} />;
      case 'history': return <HistoryLog inventory={inventory} />;
      case 'sync': return <SyncSettings />;
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
              onClick={() => { setActiveTab(item.id); setSelectedItemUid(null); setInventoryFilter(undefined); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/30' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
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
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 md:h-24 flex items-center justify-between px-6 md:px-10 bg-white border-b border-slate-200 shrink-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 active:scale-90 transition-transform">
              <LayoutGrid size={22} />
            </button>
            <div className="min-w-0 py-2">
              <h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight truncate">
                {getActiveTabLabel()}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
             {user.role === UserRole.SUPER_ADMIN && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${cloudStatus === 'ONLINE' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                   <Cloud size={16} className={cloudStatus === 'ONLINE' ? 'animate-pulse' : ''} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{cloudStatus}</span>
                </div>
             )}
             <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all relative ${showNotifications ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                   <Bell size={20} />
                   {allAlerts.length > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                       {allAlerts.length}
                     </span>
                   )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-popIn">
                    <div className="p-6 bg-slate-900 text-white">
                       <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                         <Bell size={14} className="text-blue-400" /> Alertas de Estoque
                       </h4>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-hide p-4 space-y-3">
                      {allAlerts.length > 0 ? (
                        allAlerts.map((alert, idx) => (
                          <div 
                            key={`${alert.uid}-${idx}`}
                            onClick={() => alert.type === 'CHAPA' && handleSelectItem(alert.uid)}
                            className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer group ${alert.status === 'ZERADO' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.status === 'ZERADO' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                              {alert.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-black text-slate-900 uppercase truncate leading-tight">{alert.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{alert.type}</span>
                                 <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${alert.status === 'ZERADO' ? 'text-red-600' : 'text-amber-600'}`}>{alert.status}</span>
                               </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center space-y-3 opacity-40">
                          <AlertCircle size={32} className="mx-auto text-slate-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tudo em dia!</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                       <button 
                        onClick={() => { setActiveTab('inventory'); setShowNotifications(false); }}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-800 transition-colors"
                       >
                         Ver inventário completo
                       </button>
                    </div>
                  </div>
                )}
             </div>
             <div className="flex items-center gap-3 md:gap-4 border-l border-slate-200 pl-4 md:pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-2">{user.role}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-xl uppercase">{user.name.charAt(0)}</div>
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth bg-slate-50/50">{renderContent()}</main>
      </div>
      <SupportBot />
    </div>
  );
};

export default App;
