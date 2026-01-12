
import React, { useState, useEffect } from 'react';
import { Company, CompanyStatus, UserRole } from '../types';
import { getAllCompanies, updateCompanyStatus, getTeamMembers, getInventory, createCompanyAccount, updateCompanyFee, getCompanyAdminCredentials, StoredUser } from '../services/storageService';
import { 
  ShieldCheck, ShieldAlert, Users, Package, TrendingUp, Search, Calendar, 
  CheckCircle2, Lock, Unlock, UserPlus, X, LogIn, ExternalLink, AlertCircle,
  DollarSign, BarChart3, Wallet, ArrowUpRight, Key, Eye, Copy, Check, MessageSquareText,
  Headphones, History, Bot, Activity, Globe, Zap, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface PlatformManagementProps {
  onImpersonate: (companyId: string) => void;
}

const PlatformManagement: React.FC<PlatformManagementProps> = ({ onImpersonate }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'financeiro'>('dashboard');
  
  // Modal de Credenciais
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedCreds, setSelectedCreds] = useState<StoredUser | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => {
    setCompanies(getAllCompanies());
  }, []);

  const totalRevenue = companies.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);
  const totalSlabs = companies.reduce((acc, c) => acc + getInventory(c.id).length, 0);
  const totalUsers = companies.reduce((acc, c) => acc + getTeamMembers(c.id).length, 0);

  const statsData = [
    { name: 'Jan', revenue: totalRevenue * 0.7, clients: 12 },
    { name: 'Fev', revenue: totalRevenue * 0.8, clients: 15 },
    { name: 'Mar', revenue: totalRevenue * 0.85, clients: 18 },
    { name: 'Abr', revenue: totalRevenue * 0.95, clients: 22 },
    { name: 'Mai', revenue: totalRevenue, clients: companies.length },
  ];

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newCompany) return;
    createCompanyAccount(newName, cleanEmail(newEmail), newCompany);
    setCompanies(getAllCompanies());
    setShowAddModal(false);
    resetForm();
  };

  // Fix: Adicionado handler para exibir as credenciais de uma empresa
  const handleShowCredentials = (company: Company) => {
    const creds = getCompanyAdminCredentials(company.id);
    if (creds) {
      setSelectedCreds(creds);
      setSelectedCompanyName(company.name);
      setShowCredsModal(true);
    } else {
      alert("Credenciais administrativas não encontradas para esta unidade.");
    }
  };

  // Fix: Adicionado handler para alternar o status de ativação de uma empresa
  const handleToggleStatus = (companyId: string, currentStatus: CompanyStatus) => {
    const newStatus = currentStatus === CompanyStatus.ACTIVE ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE;
    updateCompanyStatus(companyId, newStatus);
    setCompanies(getAllCompanies());
  };

  const cleanEmail = (email: string) => email.trim().toLowerCase();

  const resetForm = () => {
    setNewName(''); setNewEmail(''); setNewCompany('');
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20">
      {/* Header com Navegação de Gestão */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Globe size={24} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h2>
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Gestão Global da Plataforma v2.1</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 w-full lg:w-auto overflow-x-auto scrollbar-hide">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={16} />} label="Overview" />
          <TabButton active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={<Users size={16} />} label="Marmorarias" />
          <TabButton active={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} icon={<DollarSign size={16} />} label="Financeiro" />
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest whitespace-nowrap w-full lg:w-auto"
        >
          <UserPlus size={20} /> Onboard de Cliente
        </button>
      </div>

      {/* Visão de Dashboard Global */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-slideUp">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Receita Mensal (MRR)" value={`R$ ${totalRevenue.toLocaleString()}`} icon={<Wallet size={20} />} trend="+12%" color="text-emerald-600" />
            <StatCard label="Marmorarias Ativas" value={companies.length} icon={<Building2Icon size={20} />} trend="+3" color="text-blue-600" />
            <StatCard label="Total de Chapas" value={totalSlabs} icon={<Package size={20} />} trend="+142" color="text-amber-600" />
            <StatCard label="Usuários na Plataforma" value={totalUsers} icon={<Users size={20} />} trend="+8" color="text-indigo-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-500" /> Crescimento de Receita
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Últimos 5 Meses</span>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white space-y-8 flex flex-col justify-between overflow-hidden relative group">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
               <div className="relative z-10">
                 <h3 className="text-xl font-black uppercase tracking-tight mb-2">Suporte Marmobot</h3>
                 <p className="text-slate-400 text-xs font-medium">Monitoramento de IA em tempo real.</p>
               </div>
               
               <div className="space-y-4 relative z-10">
                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Taxa de Resolução IA</p>
                    <p className="text-3xl font-black">94.2%</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Chamados Abertos</p>
                    <p className="text-3xl font-black text-amber-400">08</p>
                 </div>
               </div>

               <button onClick={() => setActiveTab('clientes')} className="relative z-10 w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:text-slate-900 transition-all shadow-xl">
                 Gerenciar Chamados <ArrowRight size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Marmorarias e Impersonation */}
      {activeTab === 'clientes' && (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Localizar cliente na rede..."
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">Ativas ({companies.length})</span>
              <span className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase border border-red-100">Suspensas (0)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(company => {
              const members = getTeamMembers(company.id).length;
              const slabs = getInventory(company.id).length;
              return (
                <div key={company.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-2 bg-gradient-to-l ${company.status === 'ACTIVE' ? 'from-emerald-500' : 'from-red-500'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transform group-hover:rotate-6 transition-transform">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-xl leading-none truncate max-w-[150px]">{company.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {company.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleShowCredentials(company)}
                      className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all"
                    >
                      <Key size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-[1.5rem] shadow-inner">
                    <div className="text-center">
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Membros</p>
                       <p className="text-xl font-black text-slate-900">{members}</p>
                    </div>
                    <div className="text-center border-l border-slate-200">
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Estoque</p>
                       <p className="text-xl font-black text-slate-900">{slabs}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => onImpersonate(company.id)}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
                    >
                      <Zap size={14} className="fill-current" /> Acessar Unidade
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(company.id, company.status)}
                      className={`p-4 rounded-2xl transition-all ${company.status === 'ACTIVE' ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    >
                      {company.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modais omitidos para brevidade mas preservados na lógica */}
      {showCredsModal && selectedCreds && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[210] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-popIn border border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Admin Master</h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{selectedCompanyName}</p>
              </div>
              <button onClick={() => setShowCredsModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-5">
                 <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Login</p>
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                       <span className="font-bold text-slate-700 text-sm truncate pr-2">{selectedCreds.email}</span>
                       <button onClick={() => copyToClipboard(selectedCreds.email, 'email')} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                         {copiedField === 'email' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                       </button>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Gerada</p>
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                       <span className="font-black text-slate-900 text-sm tracking-widest">{selectedCreds.password}</span>
                       <button onClick={() => copyToClipboard(selectedCreds.password || '', 'pass')} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                         {copiedField === 'pass' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                       </button>
                    </div>
                 </div>
              </div>
              <button onClick={() => setShowCredsModal(false)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">FECHAR</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl space-y-8 animate-popIn">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Onboarding de Unidade</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputGroup label="Responsável" value={newName} onChange={setNewName} placeholder="Ex: João Silva" />
                <InputGroup label="Marmoraria" value={newCompany} onChange={setNewCompany} placeholder="Ex: Marmoraria Premium" />
              </div>
              <InputGroup label="E-mail Administrativo" value={newEmail} onChange={setNewEmail} placeholder="adm@marmoraria.com" type="email" />
              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95 text-lg">ATIVAR NOVA UNIDADE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Componentes Auxiliares para Limpeza de Código
const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon} {label}
  </button>
);

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, trend: string, color: string }> = ({ label, value, icon, trend, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-1 h-full ${color.replace('text', 'bg')} opacity-40`}></div>
    <div className={`bg-slate-50 ${color} p-5 rounded-3xl shadow-inner group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
        <span className={`text-[8px] font-black ${color} bg-white px-2 py-0.5 rounded-full border border-slate-100`}>{trend}</span>
      </div>
      <p className="text-3xl font-black text-slate-900 tracking-tighter truncate">{value}</p>
    </div>
  </div>
);

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  </div>
);

const Building2Icon: React.FC<{ size?: number, className?: string }> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
  </svg>
);

export default PlatformManagement;
