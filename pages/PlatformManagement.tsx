
import React, { useState, useEffect } from 'react';
import { Company, CompanyStatus, UserRole } from '../types';
import { getAllCompanies, updateCompanyStatus, getTeamMembers, getInventory, createCompanyAccount, updateCompanyFee } from '../services/storageService';
import { 
  ShieldCheck, ShieldAlert, Users, Package, TrendingUp, Search, Calendar, 
  CheckCircle2, Lock, Unlock, UserPlus, X, LogIn, ExternalLink, AlertCircle,
  DollarSign, BarChart3, Wallet, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

interface PlatformManagementProps {
  onImpersonate: (companyId: string) => void;
}

const PlatformManagement: React.FC<PlatformManagementProps> = ({ onImpersonate }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'financeiro'>('geral');
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    setCompanies(getAllCompanies());
  }, []);

  const handleToggleStatus = (companyId: string, currentStatus: CompanyStatus) => {
    const newStatus = currentStatus === CompanyStatus.ACTIVE ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE;
    updateCompanyStatus(companyId, newStatus);
    setCompanies(getAllCompanies());
  };

  const handleUpdateFee = (companyId: string, fee: number) => {
    updateCompanyFee(companyId, fee);
    setCompanies(getAllCompanies());
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newName || !newEmail || !newCompany) return alert("Preencha os campos essenciais.");
    
    try {
      createCompanyAccount(newName, newEmail, newCompany, newPass);
      setCompanies(getAllCompanies());
      setShowAddModal(false);
      setNewName(''); setNewEmail(''); setNewCompany(''); setNewPass('');
      alert("Conta criada com sucesso! O cliente já pode acessar o sistema.");
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = companies.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);
  const activeCompanies = companies.filter(c => c.status === CompanyStatus.ACTIVE).length;

  // Simulação de dados mensais para o balanço
  const monthlyBalanceData = [
    { name: 'Jan', value: totalRevenue * 0.7 },
    { name: 'Fev', value: totalRevenue * 0.75 },
    { name: 'Mar', value: totalRevenue * 0.82 },
    { name: 'Abr', value: totalRevenue * 0.9 },
    { name: 'Mai', value: totalRevenue }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20 px-2 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Administração Global</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Painel de Controle da Plataforma</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex bg-slate-200 p-1 rounded-2xl">
             <button 
               onClick={() => setActiveTab('geral')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'geral' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Clientes
             </button>
             <button 
               onClick={() => setActiveTab('financeiro')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'financeiro' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Financeiro
             </button>
          </div>
          <button 
            onClick={() => { setErrorMessage(null); setShowAddModal(true); }}
            className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95"
          >
            <UserPlus size={24} /> NOVO CLIENTE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total de Empresas" value={companies.length} icon={<ShieldCheck size={20} />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="MRR (Mensalidade)" value={`R$ ${totalRevenue.toLocaleString()}`} icon={<Wallet size={20} />} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Ativos/Bloqueados" value={`${activeCompanies} / ${companies.length - activeCompanies}`} icon={<ShieldAlert size={20} />} color="text-slate-600" bg="bg-slate-100" />
      </div>

      {activeTab === 'geral' ? (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="relative mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar marmoraria cadastrada..."
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marmoraria</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dados</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCompanies.map(company => (
                  <tr key={company.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight text-base leading-none mb-1">{company.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{company.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-col gap-1 items-center">
                         <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><Users size={12} /> {getTeamMembers(company.id).length} Membros</span>
                         <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><Package size={12} /> {getInventory(company.id).length} Chapas</span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      {company.status === CompanyStatus.ACTIVE ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-widest">Ativo</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg text-[9px] font-black uppercase tracking-widest">Suspenso</span>
                      )}
                    </td>
                    <td className="px-4 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => onImpersonate(company.id)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2"
                        >
                          <ExternalLink size={14} /> Acessar Unidade
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(company.id, company.status)}
                          className={`p-2.5 rounded-xl transition-all ${company.status === CompanyStatus.ACTIVE ? 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                        >
                          {company.status === CompanyStatus.ACTIVE ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Balanço Mensal */}
           <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-500" /> Balanço de Faturamento
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Comparativo de receita mensal (MRR)</p>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">+12% vs mês anterior</span>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyBalanceData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                      labelStyle={{fontWeight: 900, fontSize: '12px', marginBottom: '4px'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Precificação por Empresa */}
           <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-6">
                <DollarSign size={20} className="text-emerald-500" /> Precificação (Fee)
              </h3>
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {companies.map(company => (
                  <div key={company.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[120px]">{company.name}</span>
                       <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{company.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}</span>
                    </div>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                       <input 
                         type="number" 
                         className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:border-emerald-500 transition-all"
                         value={company.monthlyFee}
                         onChange={(e) => handleUpdateFee(company.id, Number(e.target.value))}
                       />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50">
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center leading-relaxed">
                   Os valores alterados impactam<br/>diretamente o MRR global do próximo mês.
                 </p>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl space-y-8 animate-popIn">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Novo Cadastro de Cliente</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100"><X size={24} /></button>
            </div>
            
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-shake">
                <AlertCircle size={20} />
                <span className="text-xs font-black uppercase tracking-widest">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Marmoraria</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-blue-600" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Login</label>
                <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Provisória</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="marm123" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95">FINALIZAR CADASTRO</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, color: string, bg: string }> = ({ label, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
    <div className={`${bg} ${color} p-4 rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  </div>
);

export default PlatformManagement;
