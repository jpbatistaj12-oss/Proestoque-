
import React, { useState, useEffect } from 'react';
import { Company, CompanyStatus, UserRole } from '../types';
import { 
  getAllCompanies, 
  updateCompanyStatus, 
  getInventory, 
  createCompanyAccount, 
  updateCompanyFee,
  getCompanyAdminCredentials, 
  StoredUser,
  getGlobalCategories,
  getGlobalMaterials,
  addGlobalCategory,
  addGlobalMaterial,
  removeGlobalCategory,
  removeGlobalMaterial,
  getGlobalSupplyCategories,
  addGlobalSupplyCategory,
  removeGlobalSupplyCategory,
  getGlobalSupplyMaterials,
  addGlobalSupplyMaterial,
  removeGlobalSupplyMaterial,
  GlobalMaterial,
  deleteCompany,
  getCloudConfig,
  saveCloudConfig,
  generateSyncKey,
  getFullDatabaseSnapshot,
  restoreDatabaseFromSnapshot,
  CloudConfig,
  notifyCloudChange
} from '../services/storageService';
import { 
  Search, Lock, Unlock, UserPlus, X, Key, Globe, 
  Database, Wallet, TrendingUp, CreditCard, LayoutGrid, Plus, Tag, Package, Trash2, FlaskConical, 
  Cloud, CloudUpload, CloudDownload, RefreshCw, ShieldCheck, Eye, EyeOff, Terminal, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlatformManagementProps {
  onImpersonate: (companyId: string) => void;
}

const PlatformManagement: React.FC<PlatformManagementProps> = ({ onImpersonate }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'catalogo' | 'financeiro' | 'cloud'>('dashboard');
  const [catalogSubTab, setCatalogSubTab] = useState<'chapas' | 'insumos'>('chapas');
  
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(getCloudConfig());
  const [showSyncKey, setShowSyncKey] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');
  const [backupInput, setBackupInput] = useState('');

  const [globalMaterials, setGlobalMaterials] = useState<GlobalMaterial[]>([]);
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  const [globalSupplyMaterials, setGlobalSupplyMaterials] = useState<GlobalMaterial[]>([]);
  const [globalSupplyCategories, setGlobalSupplyCategories] = useState<string[]>([]);
  
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newMatName, setNewMatName] = useState('');
  const [newMatCat, setNewMatCat] = useState('');

  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedCreds, setSelectedCreds] = useState<StoredUser | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCompanies(getAllCompanies());
    setGlobalCategories(getGlobalCategories());
    setGlobalMaterials(getGlobalMaterials());
    setGlobalSupplyCategories(getGlobalSupplyCategories());
    setGlobalSupplyMaterials(getGlobalSupplyMaterials());
    setCloudConfig(getCloudConfig());
  };

  const handleCreateSyncKey = () => {
    const newKey = generateSyncKey();
    const newConfig: CloudConfig = {
      ...cloudConfig,
      syncKey: newKey,
      status: 'ONLINE',
      lastSync: new Date().toISOString()
    };
    saveCloudConfig(newConfig);
    setCloudConfig(newConfig);
  };

  const handlePushToCloud = () => {
    setSyncStatus('SYNCING');
    setTimeout(() => {
      const snapshot = getFullDatabaseSnapshot();
      console.log("Snapshot gerado:", snapshot.slice(0, 50) + "...");
      const newConfig: CloudConfig = {
        ...cloudConfig,
        lastSync: new Date().toISOString()
      };
      saveCloudConfig(newConfig);
      setCloudConfig(newConfig);
      setSyncStatus('SUCCESS');
      setTimeout(() => setSyncStatus('IDLE'), 2000);
    }, 1500);
  };

  const handleRestoreBackup = () => {
    if (!backupInput) return;
    if (confirm("ATENÇÃO: Isso irá substituir todos os dados deste computador pelos dados da nuvem. Deseja continuar?")) {
      const success = restoreDatabaseFromSnapshot(backupInput);
      if (success) {
        alert("Dados sincronizados com sucesso! A aplicação irá recarregar.");
        window.location.reload();
      } else {
        alert("Snapshot inválido.");
      }
    }
  };

  const totalSlabs = companies.reduce((acc, c) => acc + getInventory(c.id).length, 0);
  const totalRevenue = companies.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);

  const chartData = [
    { name: 'Jan', receita: totalRevenue * 0.7 },
    { name: 'Fev', receita: totalRevenue * 0.75 },
    { name: 'Mar', receita: totalRevenue * 0.82 },
    { name: 'Abr', receita: totalRevenue * 0.9 },
    { name: 'Mai', receita: totalRevenue * 0.95 },
    { name: 'Jun', receita: totalRevenue },
  ];

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formCompany) return;
    createCompanyAccount(formName, formEmail, formCompany);
    refreshData();
    setShowAddModal(false);
    setFormName(''); setFormEmail(''); setFormCompany('');
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (window.confirm(`Excluir permanentemente "${name}"?`)) {
        deleteCompany(id);
        refreshData();
    }
  };

  const handleAddGlobalCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    if (catalogSubTab === 'chapas') addGlobalCategory(newCatName);
    else addGlobalSupplyCategory(newCatName);
    refreshData();
    setNewCatName('');
  };

  const handleAddGlobalMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName || !newMatCat) return;
    if (catalogSubTab === 'chapas') addGlobalMaterial(newMatName, newMatCat);
    else addGlobalSupplyMaterial(newMatName, newMatCat);
    refreshData();
    setNewMatName('');
  };

  // Funções Financeiras Atualizadas
  const handleToggleStatus = (company: Company) => {
    const newStatus = company.status === CompanyStatus.ACTIVE ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE;
    const actionText = newStatus === CompanyStatus.SUSPENDED ? "BLOQUEAR" : "LIBERAR";
    
    if (confirm(`Deseja realmente ${actionText} o acesso da marmoraria ${company.name}?`)) {
      updateCompanyStatus(company.id, newStatus);
      // Atualiza o estado local para refletir na UI imediatamente
      setCompanies(prev => prev.map(c => c.id === company.id ? {...c, status: newStatus} : c));
    }
  };

  const handleUpdateFee = (id: string, fee: string) => {
    const numericFee = parseFloat(fee);
    if (!isNaN(numericFee)) {
      updateCompanyFee(id, numericFee);
      setCompanies(prev => prev.map(c => c.id === id ? {...c, monthlyFee: numericFee} : c));
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5 py-2 flex-none">
           <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl">
              <LayoutGrid size={32} />
           </div>
           <div className="py-1">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">Painel Control</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Administração de Rede de Marmorarias</p>
           </div>
        </div>

        <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm overflow-x-auto max-w-full scrollbar-hide pr-10">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-none whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('clientes')} className={`flex-none whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'clientes' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Marmorarias</button>
          <button onClick={() => setActiveTab('catalogo')} className={`flex-none whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalogo' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Catálogo Global</button>
          <button onClick={() => setActiveTab('financeiro')} className={`flex-none whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'financeiro' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Financeiro</button>
          <button onClick={() => setActiveTab('cloud')} className={`flex-none whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cloud' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Cloud Sync</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slideUp">
            <StatCard title="Total de Unidades" value={companies.length} icon={<Globe size={24} className="text-blue-500" />} />
            <StatCard title="Chapas em Rede" value={totalSlabs} icon={<Database size={24} className="text-emerald-500" />} />
            <StatCard title="Receita Mensal (SaaS)" value={`R$ ${totalRevenue.toLocaleString()}`} icon={<Wallet size={24} className="text-amber-500" />} color="bg-slate-900 text-white" />
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="text-blue-600" /> Projeção de Faturamento
            </h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} />
                    <Area type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={4} fill="#3b82f6" fillOpacity={0.1} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cloud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slideUp">
           <div className="lg:col-span-7 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 text-blue-500/10"><Cloud size={160} /></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl"><Cloud size={32} /></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Cloud Sync Hub</h3>
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-2 flex items-center gap-2"><ShieldCheck size={14} /> Canal de Dados Criptografado</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 relative z-10">
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chave de Rede Única (Cloud Key)</p>
                       <button onClick={() => setShowSyncKey(!showSyncKey)} className="text-slate-400 hover:text-slate-900">{showSyncKey ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-5 font-mono font-black text-xl text-slate-900 tracking-widest flex items-center justify-center shadow-inner">
                          {cloudConfig.syncKey ? (showSyncKey ? cloudConfig.syncKey : '••••-••••-••••-••••') : 'NÃO CONECTADO'}
                       </div>
                       <button onClick={handleCreateSyncKey} className="bg-slate-900 text-white p-5 rounded-2xl hover:bg-blue-600 transition-all active:scale-95">
                          <RefreshCw size={24} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} />
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 relative z-10">
                    <button onClick={handlePushToCloud} disabled={!cloudConfig.syncKey || syncStatus === 'SYNCING'} className="bg-blue-600 text-white p-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4 hover:bg-blue-700 shadow-xl transition-all disabled:opacity-50">
                       <CloudUpload size={24} /> {syncStatus === 'SYNCING' ? 'Enviando...' : 'Enviar para Nuvem'}
                    </button>
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4 shadow-xl">
                       <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                          <div className={`w-3 h-3 bg-emerald-500 rounded-full ${cloudConfig.status === 'ONLINE' ? 'animate-pulse' : 'opacity-20'}`}></div>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] text-slate-400 mb-1">Status Global</p>
                          <p className="text-emerald-400 uppercase">{cloudConfig.status === 'ONLINE' ? 'Conectado' : 'Offline'}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8 h-full">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem]"><CloudDownload size={28} /></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase">Sincronização Manual</h3>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Insira o Snapshot de Backup abaixo para sincronizar este computador.</p>
                    <textarea className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-mono text-[10px] outline-none shadow-inner" placeholder="Cole o snapshot aqui..." value={backupInput} onChange={e => setBackupInput(e.target.value)}></textarea>
                    <button onClick={handleRestoreBackup} className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-lg">RESTAURAR DA NUVEM</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input type="text" placeholder="Localizar marmoraria..." className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all text-xs">
              <UserPlus size={18} /> Cadastrar Nova Unidade
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(company => (
              <div key={company.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 space-y-8 hover:shadow-2xl transition-all relative overflow-hidden group">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-900 font-black text-3xl shadow-inner border border-slate-100">{company.name.charAt(0)}</div>
                    <div className="py-1">
                      <h4 className="font-black text-slate-900 uppercase tracking-tighter text-xl leading-tight mb-2">{company.name}</h4>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase inline-block border ${company.status === CompanyStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{company.status === CompanyStatus.ACTIVE ? 'Operante' : 'Bloqueada'}</div>
                    </div>
                 </div>
                 <div className="flex gap-3">
                  <button onClick={() => onImpersonate(company.id)} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-lg">Acessar Painel</button>
                  <button onClick={() => handleDeleteCompany(company.id, company.name)} className="p-5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'catalogo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-slideUp">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4"><Tag size={28} className="text-blue-600" /> Categorias</h3>
              <form onSubmit={handleAddGlobalCategory} className="flex gap-2">
                 <input type="text" placeholder="Nova Categoria..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                 <button type="submit" className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all"><Plus /></button>
              </form>
              <div className="grid grid-cols-2 gap-3">
                 {(catalogSubTab === 'chapas' ? globalCategories : globalSupplyCategories).map((cat, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-700">{cat}</span></div>
                 ))}
              </div>
           </div>
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4"><Package size={28} className="text-emerald-600" /> Materiais Globais</h3>
              <form onSubmit={handleAddGlobalMaterial} className="space-y-3">
                 <input type="text" placeholder="Nome do Material..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newMatName} onChange={e => setNewMatName(e.target.value)} />
                 <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all uppercase font-black text-xs tracking-widest">Adicionar ao Catálogo</button>
              </form>
           </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 animate-slideUp">
           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4 mb-8"><CreditCard size={28} className="text-amber-600" /> Financeiro SaaS</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marmoraria</th>
                    <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento mensal</th>
                    <th className="pb-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso do sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {companies.map(c => (
                    <tr key={c.id} className="group">
                      <td className="py-6 font-black text-slate-900 uppercase text-sm">{c.name}</td>
                      <td className="py-6">
                        <div className="flex items-center gap-2">
                           <span className="text-blue-600 font-black text-lg">R$</span>
                           <input 
                              type="number" 
                              className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                              defaultValue={c.monthlyFee}
                              onBlur={(e) => handleUpdateFee(c.id, e.target.value)}
                           />
                        </div>
                      </td>
                      <td className="py-6 text-right flex items-center justify-end gap-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${c.status === CompanyStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {c.status === CompanyStatus.ACTIVE ? 'Liberado' : 'Bloqueado'}
                        </span>
                        <button 
                          onClick={() => handleToggleStatus(c)}
                          className={`p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 ${c.status === CompanyStatus.ACTIVE ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                          title={c.status === CompanyStatus.ACTIVE ? "Bloquear Cliente" : "Liberar Cliente"}
                        >
                          {c.status === CompanyStatus.ACTIVE ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-popIn">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-slate-900 uppercase leading-tight">Novo Cliente</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full"><X size={28} /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-6">
               <input type="text" placeholder="Nome do Admin" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={formName} onChange={e => setFormName(e.target.value)} required />
               <input type="text" placeholder="Nome da Marmoraria" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={formCompany} onChange={e => setFormCompany(e.target.value)} required />
               <input type="email" placeholder="E-mail Corporativo" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={formEmail} onChange={e => setFormEmail(e.target.value)} required />
               <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase shadow-xl hover:bg-emerald-600 transition-all text-xs tracking-widest">ATIVAR UNIDADE AGORA</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color }) => (
  <div className={`p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all ${color || 'bg-white'}`}>
    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${color ? 'bg-white/10' : 'bg-slate-50'}`}>{icon}</div>
    <div className="py-1">
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${color ? 'text-slate-400' : 'text-slate-400'}`}>{title}</p>
      <p className="text-3xl font-black tracking-tighter leading-tight">{value}</p>
    </div>
  </div>
);

export default PlatformManagement;
