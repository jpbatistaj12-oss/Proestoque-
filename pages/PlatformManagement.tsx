
import React, { useState, useEffect } from 'react';
import { Company, CompanyStatus, UserRole } from '../types';
import { 
  getAllCompanies, 
  updateCompanyStatus, 
  getInventory, 
  createCompanyAccount, 
  updateCompanyFee,
  getCompanyAdminCredentials, 
  updateTeamMemberCredentials,
  StoredUser,
  getGlobalCategories,
  getGlobalMaterials,
  addGlobalCategory,
  addGlobalMaterial,
  getGlobalSupplyCategories,
  addGlobalSupplyCategory,
  getGlobalSupplyMaterials,
  addGlobalSupplyMaterial,
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
  Database, Wallet, TrendingUp, CreditCard, LayoutGrid, Plus, Tag, Package, Trash2,
  Cloud, CloudUpload, CloudDownload, RefreshCw, ShieldCheck, Eye, EyeOff, Check, Copy
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
  
  // Cloud States
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(getCloudConfig());
  const [showSyncKey, setShowSyncKey] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');
  const [backupInput, setBackupInput] = useState('');

  // Credentials States
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<StoredUser | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPass, setEditAdminPass] = useState('');

  const [globalMaterials, setGlobalMaterials] = useState<GlobalMaterial[]>([]);
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCompanies(getAllCompanies());
    setGlobalCategories(getGlobalCategories());
    setGlobalMaterials(getGlobalMaterials());
    setCloudConfig(getCloudConfig());
  };

  const handleOpenCreds = (companyId: string) => {
    const admin = getCompanyAdminCredentials(companyId);
    if (admin) {
      setSelectedAdmin(admin);
      setSelectedCompanyId(companyId);
      setEditAdminEmail(admin.email);
      setEditAdminPass(admin.password || '');
      setShowCredsModal(true);
    } else {
      alert("Administrador não encontrado para esta unidade.");
    }
  };

  const handleSaveCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    
    updateTeamMemberCredentials(selectedAdmin.id, selectedCompanyId, {
      email: editAdminEmail,
      password: editAdminPass
    });
    
    alert("Credenciais atualizadas com sucesso!");
    setShowCredsModal(false);
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

  const totalSlabs = companies.reduce((acc, c) => acc + getInventory(c.id).length, 0);
  const totalRevenue = companies.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);

  // Generate mock chart data based on active companies and revenue
  const chartData = [
    { name: 'Jan', receita: totalRevenue * 0.8 },
    { name: 'Fev', receita: totalRevenue * 0.85 },
    { name: 'Mar', receita: totalRevenue * 0.9 },
    { name: 'Abr', receita: totalRevenue * 0.95 },
    { name: 'Mai', receita: totalRevenue },
    { name: 'Jun', receita: totalRevenue * 1.1 },
  ];

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formCompany) return;
    createCompanyAccount(formName, formEmail, formCompany);
    refreshData();
    setShowAddModal(false);
    setFormName(''); setFormEmail(''); setFormCompany('');
  };

  const handleToggleStatus = (company: Company) => {
    const newStatus = company.status === CompanyStatus.ACTIVE ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE;
    const actionText = newStatus === CompanyStatus.SUSPENDED ? "BLOQUEAR" : "LIBERAR";
    
    if (confirm(`Deseja realmente ${actionText} o acesso da marmoraria ${company.name}?`)) {
      updateCompanyStatus(company.id, newStatus);
      setCompanies(prev => prev.map(c => c.id === company.id ? {...c, status: newStatus} : c));
    }
  };

  // Fixed undefined handleDeleteCompany by calling deleteCompany from storageService
  const handleDeleteCompany = (id: string, name: string) => {
    if (confirm(`AVISO CRÍTICO: Deseja realmente EXCLUIR permanentemente a marmoraria ${name}? Todos os dados de estoque e usuários serão perdidos.`)) {
      deleteCompany(id);
      refreshData();
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
                  <button onClick={() => handleOpenCreds(company.id)} className="p-5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm" title="Gerenciar Credenciais"><Key size={20} /></button>
                  <button onClick={() => handleDeleteCompany(company.id, company.name)} className="p-5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINANCEIRO TAB */}
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
                      <td className="py-6 font-black text-blue-600">R$ {c.monthlyFee}</td>
                      <td className="py-6 text-right flex items-center justify-end gap-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${c.status === CompanyStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {c.status === CompanyStatus.ACTIVE ? 'Liberado' : 'Bloqueado'}
                        </span>
                        <button 
                          onClick={() => handleToggleStatus(c)}
                          className={`p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 ${c.status === CompanyStatus.ACTIVE ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
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

      {/* MODAL DE CREDENCIAIS */}
      {showCredsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-popIn">
             <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Gestão de Acesso</h3>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Admin: {selectedAdmin.name}</p>
               </div>
               <button onClick={() => setShowCredsModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full"><X size={24} /></button>
             </div>
             
             <form onSubmit={handleSaveCreds} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Login</label>
                   <input 
                      type="email" 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" 
                      value={editAdminEmail} 
                      onChange={e => setEditAdminEmail(e.target.value)} 
                      required
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                   <div className="relative">
                      <input 
                        type={showAdminPass ? "text" : "password"} 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none tracking-widest" 
                        value={editAdminPass} 
                        onChange={e => setEditAdminPass(e.target.value)} 
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowAdminPass(!showAdminPass)} 
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showAdminPass ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                   </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase shadow-xl hover:bg-blue-600 transition-all text-xs tracking-widest">SALVAR NOVAS CREDENCIAIS</button>
             </form>
           </div>
        </div>
      )}

      {/* DASHBOARD TAB (default) */}
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

      {/* CLOUD TAB */}
      {activeTab === 'cloud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slideUp">
           <div className="lg:col-span-12">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl"><Cloud size={32} /></div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Cloud Sync Hub</h3>
                 </div>
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="flex gap-4">
                       <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-5 font-mono font-black text-xl text-slate-900 tracking-widest flex items-center justify-center shadow-inner">
                          {cloudConfig.syncKey || 'NÃO CONECTADO'}
                       </div>
                       <button onClick={handleCreateSyncKey} className="bg-slate-900 text-white p-5 rounded-2xl hover:bg-blue-600 transition-all"><RefreshCw size={24} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} /></button>
                    </div>
                    <button onClick={handlePushToCloud} disabled={!cloudConfig.syncKey || syncStatus === 'SYNCING'} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                       <CloudUpload size={22} /> {syncStatus === 'SYNCING' ? 'SINCRONIZANDO...' : 'ENVIAR DADOS PARA NUVEM'}
                    </button>
                 </div>
              </div>
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
