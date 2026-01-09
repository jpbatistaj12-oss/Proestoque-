
import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { InventoryItem, User, UserRole } from './types';
import { getInventory, getCurrentUser, logout } from './services/storageService';

// Pages
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/InventoryList';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import QRScanner from './pages/QRScanner';
import HistoryLog from './pages/HistoryLog';
import TeamManagement from './pages/TeamManagement';
import Auth from './pages/Auth';
import ProjectSearch from './pages/ProjectSearch'; // Nova página

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
      refreshInventory(sessionUser.companyId);
    }
  }, []);

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
  };

  if (!user) {
    return <Auth onLogin={(u) => { setUser(u); refreshInventory(u.companyId); }} />;
  }

  const renderContent = () => {
    if (selectedItemId && activeTab === 'detail') {
      return (
        <ItemDetail 
          itemId={selectedItemId} 
          onBack={() => setActiveTab('inventory')} 
          onUpdate={() => refreshInventory(user.companyId)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'inventory':
        return <InventoryList inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'projects':
        return <ProjectSearch inventory={inventory} onSelectItem={handleSelectItem} />;
      case 'add':
        return <AddItem onComplete={() => { refreshInventory(user.companyId); setActiveTab('inventory'); }} />;
      case 'scanner':
        return <QRScanner onScan={handleSelectItem} />;
      case 'team':
        return <TeamManagement user={user} />;
      case 'history':
        return <HistoryLog inventory={inventory} />;
      default:
        return <Dashboard inventory={inventory} onSelectItem={handleSelectItem} />;
    }
  };

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1 rounded">📦</div>
          {APP_NAME}
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold uppercase text-blue-400">{user.name}</p>
            <p className="text-[9px] uppercase text-slate-500 font-black">Empresa: {user.companyId}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[10px] bg-slate-800 px-3 py-1 rounded hover:bg-red-500 transition-colors uppercase font-bold"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24 max-w-7xl mx-auto w-full px-4 pt-6">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 shadow-2xl z-50">
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSelectedItemId(null);
            }}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-xl ${
              activeTab === item.id 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
