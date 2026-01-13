
import React, { useState, useEffect } from 'react';
import { Company, CompanyStatus, UserRole } from '../types';
import { 
  getAllCompanies, 
  updateCompanyStatus, 
  getInventory, 
  createCompanyAccount, 
  updateCompanyFee,
  getCompanyAdminCredentials, 
  StoredUser 
} from '../services/storageService';
import { 
  Users, Search, Lock, Unlock, UserPlus, X, Key, Globe, Zap, 
  Activity, ShieldCheck, Database, DollarSign, TrendingUp, 
  ArrowUpRight, BarChart3, Wallet, Edit3, Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlatformManagementProps {
  onImpersonate: (companyId: string) => void;
}

const PlatformManagement: React.FC<PlatformManagementProps> = ({ onImpersonate }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'financeiro'>('dashboard');
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');

  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedCreds, setSelectedCreds] = useState<StoredUser | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');

  // State para edição de mensalidade
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [tempFee, setTempFee] = useState<number>(0);

  useEffect(() => {
    setCompanies(getAllCompanies());
  }, []);

  const totalSlabs = companies.reduce((acc, c) => acc + getInventory(c.id).length, 0);
  const totalRevenue = companies.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);

  // Dados fictícios para o gráfico de crescimento
  const chartData = [
    { name: 'Jan', valor: 400 },
    { name: 'Fev', valor: 700 },
    { name: 'Mar', valor: 900 },
    { name: 'Abr', valor: 1200 },
    { name: 'Mai', valor: 1500 },
    { name: 'Jun', valor: totalRevenue },
  ];

  const handleShowCredentials = (company: Company) => {
    const creds = getCompanyAdminCredentials(company.id);
    if (creds) {
      setSelectedCreds(creds);
      setSelectedCompanyName(company.name);
      setShowCredsModal(true);
    }
  };

  const handleToggleStatus = (companyId: string, currentStatus: CompanyStatus) => {
    const newStatus = currentStatus === CompanyStatus.ACTIVE ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE;
    updateCompanyStatus(companyId, newStatus);
    setCompanies(getAllCompanies());
  };

  const handleUpdateFee = (id: string) => {
    updateCompanyFee(id, tempFee);
    setEditingFeeId(null);
    setCompanies(getAllCompanies());
  };

  const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20 px-2 sm:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
              <Globe size={24} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h2>
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Administração Central da Plataforma</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200 overflow-x-auto max-w-full scrollbar-hide">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={14} />} label="Overview" />
          <TabButton active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={<Users size={14} />} label="Marmorarias" />
          <TabButton active={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} icon={<DollarSign size={14} />} label="Financeiro" />
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-slideUp">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={20}/></div>
                  <ArrowUpRight size={20} className="text-emerald-500" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidades Ativas</p>
               <p className="text-4xl font-black text-slate-900">{companies.length}</p>
             </div>
             
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Database size={20}/></div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12%</span>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Materiais</p>
               <p className="text-4xl font-black text-slate-900">{totalSlabs}</p>
             </div>

             <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 text-white rounded-2xl"><Wallet size={20}/></div>
                  <TrendingUp size={20} className="text-emerald-400" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receita Mensal Estimada</p>
               <p className="text-4xl font-black">R$ {totalRevenue.toLocaleString()}</p>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                   <BarChart3 size={20} className="text-blue-600" /> Crescimento da Plataforma
                </h3>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Receita (R$)</span>
                   </div>
                </div>
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        labelStyle={{fontWeight: 900, textTransform: 'uppercase', fontSize: '10px'}}
                      />
                      <Area type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" size={20} />
              <input 
                type="text" 
                placeholder="Localizar unidade..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95 text-xs"
            >
              <UserPlus size={18} /> Novo Cliente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(company => (
              <div key={company.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 hover:shadow-2xl transition-all duration-500 group">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-xl leading-none">{company.name}</h4>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${company.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}`}>
                           {company.status === 'ACTIVE' ? 'Unidade Ativa' : 'Acesso Suspenso'}
                        </p>
                      </div>
                   </div>
                   <button 
                    onClick={() => handleShowCredentials(company)}
                    className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all"
                   >
                    <Key size={18} />
                   </button>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => onImpersonate(company.id)}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg"
                  >
                    <Zap size={14} className="fill-current" /> Acessar Painel
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(company.id, company.status)}
                    className={`p-4 rounded-2xl transition-all ${company.status === 'ACTIVE' ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                  >
                    {company.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 animate-slideUp overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestão de Mensalidades</h3>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">
                 Faturamento Total: R$ {totalRevenue.toLocaleString()}
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marmoraria</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensalidade</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {companies.map(company => (
                       <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                             <p className="font-black text-slate-900 uppercase text-sm">{company.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{company.id}</p>
                          </td>
                          <td className="px-8 py-6">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${company.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {company.status}
                             </span>
                          </td>
                          <td className="px-8 py-6">
                             {editingFeeId === company.id ? (
                                <div className="flex items-center gap-2">
                                   <input 
                                      type="number" 
                                      className="w-24 p-2 bg-white border border-blue-200 rounded-lg font-black text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                      value={tempFee}
                                      onChange={(e) => setTempFee(Number(e.target.value))}
                                      autoFocus
                                   />
                                   <button onClick={() => handleUpdateFee(company.id)} className="p-2 bg-blue-600 text-white rounded-lg"><Check size={16}/></button>
                                </div>
                             ) : (
                                <p className="font-black text-slate-700 text-sm">R$ {company.monthlyFee || 0}</p>
                             )}
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                                onClick={() => { setEditingFeeId(company.id); setTempFee(company.monthlyFee || 0); }}
                                className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all"
                             >
                                <Edit3 size={18} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Modal de Onboarding */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl space-y-8 animate-popIn">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Novo Cliente</h3>
              <button onClick={() => { setShowAddModal(false); setNewName(''); setNewEmail(''); setNewCompany(''); }} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all"><X size={28} /></button>
            </div>
            <div className="space-y-6">
               <input type="text" placeholder="Nome do Responsável" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newName} onChange={e => setNewName(e.target.value)} />
               <input type="text" placeholder="Nome da Marmoraria" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
               <input type="email" placeholder="E-mail Administrativo" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
               <button 
                onClick={() => {
                  if (!newName || !newEmail || !newCompany) {
                    alert("Preencha todos os campos.");
                    return;
                  }
                  createCompanyAccount(newName, newEmail, newCompany);
                  setCompanies(getAllCompanies());
                  setShowAddModal(false);
                  setNewName(''); setNewEmail(''); setNewCompany('');
                }}
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all text-lg"
               >
                 ATIVAR UNIDADE
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Credenciais */}
      {showCredsModal && selectedCreds && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-popIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Credenciais de Acesso</h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">{selectedCompanyName}</p>
              </div>
              <button onClick={() => setShowCredsModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all"><X size={24} /></button>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100 shadow-inner">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail Administrativo</p>
                  <p className="font-bold text-slate-900">{selectedCreds.email}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Senha Padrão</p>
                  <p className="font-mono font-black text-blue-600 text-lg">marm123</p>
               </div>
            </div>
            <button onClick={() => setShowCredsModal(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest">FECHAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformManagement;
