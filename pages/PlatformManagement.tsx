
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
  GlobalMaterial
} from '../services/storageService';
import { 
  Users, Search, Lock, Unlock, UserPlus, X, Key, Globe, 
  Database, Wallet, TrendingUp, CreditCard, LayoutGrid, Plus, Tag, Package, Trash2, FlaskConical, Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlatformManagementProps {
  onImpersonate: (companyId: string) => void;
}

const PlatformManagement: React.FC<PlatformManagementProps> = ({ onImpersonate }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'catalogo' | 'financeiro'>('dashboard');
  const [catalogSubTab, setCatalogSubTab] = useState<'chapas' | 'insumos'>('chapas');
  
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

  const handleRemoveCategory = (cat: string) => {
    if (window.confirm(`Remover categoria global "${cat}"?`)) {
      if (catalogSubTab === 'chapas') removeGlobalCategory(cat);
      else removeGlobalSupplyCategory(cat);
      refreshData();
    }
  };

  const handleRemoveMaterial = (name: string) => {
    if (window.confirm(`Remover item global "${name}"?`)) {
      if (catalogSubTab === 'chapas') removeGlobalMaterial(name);
      else removeGlobalSupplyMaterial(name);
      refreshData();
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl">
              <LayoutGrid size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Painel Control</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Administração de Rede de Marmorarias</p>
           </div>
        </div>

        <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm overflow-x-auto max-w-full scrollbar-hide">
          <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('clientes')} className={`whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'clientes' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Marmorarias</button>
          <button onClick={() => setActiveTab('catalogo')} className={`whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalogo' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Catálogo Global</button>
          <button onClick={() => setActiveTab('financeiro')} className={`whitespace-nowrap px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'financeiro' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Financeiro</button>
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
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-blue-600" /> Projeção de Faturamento
               </h3>
            </div>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} />
                    <Area type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorReceita)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CLIENTES TAB RESTORED */}
      {activeTab === 'clientes' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-all" size={20} />
              <input type="text" placeholder="Localizar marmoraria..." className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 shadow-xl transition-all text-xs">
              <UserPlus size={18} /> Cadastrar Nova Unidade
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(company => (
              <div key={company.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 space-y-8 hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-900 font-black text-3xl shadow-inner border border-slate-100">{company.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tighter text-xl leading-none mb-2">{company.name}</h4>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase inline-block border ${company.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{company.status === 'ACTIVE' ? 'Operante' : 'Suspensa'}</div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 shadow-inner">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Chapas</p>
                    <p className="text-xl font-black text-slate-900">{getInventory(company.id).length}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 shadow-inner">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee/mês</p>
                    <p className="text-xl font-black text-blue-600">R$ {company.monthlyFee}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => onImpersonate(company.id)} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">Acessar Painel</button>
                  <button onClick={() => { const c = getCompanyAdminCredentials(company.id); if(c){setSelectedCreds(c); setSelectedCompanyName(company.name); setShowCredsModal(true);}}} className="p-5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm"><Key size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'catalogo' && (
        <div className="space-y-8 animate-slideUp">
           <div className="flex justify-center">
              <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                 <button onClick={() => setCatalogSubTab('chapas')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${catalogSubTab === 'chapas' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Catálogo Chapas</button>
                 <button onClick={() => setCatalogSubTab('insumos')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${catalogSubTab === 'insumos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Catálogo Insumos</button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Tag size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Categorias ({catalogSubTab})</h3>
                 </div>
                 
                 <form onSubmit={handleAddGlobalCategory} className="flex gap-2">
                    <input type="text" placeholder="Nova Categoria..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                    <button type="submit" className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all"><Plus /></button>
                 </form>

                 <div className="grid grid-cols-2 gap-3">
                    {(catalogSubTab === 'chapas' ? globalCategories : globalSupplyCategories).map((cat, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-red-100 transition-all">
                         <span className="text-xs font-black uppercase text-slate-700 tracking-widest">{cat}</span>
                         <button onClick={() => handleRemoveCategory(cat)} className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                       {catalogSubTab === 'chapas' ? <Package size={24} /> : <FlaskConical size={24} />}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Materiais ({catalogSubTab})</h3>
                 </div>

                 <form onSubmit={handleAddGlobalMaterial} className="space-y-3">
                    <div className="flex gap-2">
                       <input type="text" placeholder="Nome do Item..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={newMatName} onChange={e => setNewMatName(e.target.value)} />
                       <select className="w-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none uppercase text-[10px]" value={newMatCat} onChange={e => setNewMatCat(e.target.value)} required>
                          <option value="">Categoria...</option>
                          {(catalogSubTab === 'chapas' ? globalCategories : globalSupplyCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                       <button type="submit" className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all"><Plus /></button>
                    </div>
                 </form>

                 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {(catalogSubTab === 'chapas' ? globalMaterials : globalSupplyMaterials).map((mat, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-red-100 transition-all">
                         <div className="flex flex-col">
                           <span className="text-sm font-black uppercase text-slate-800 tracking-tight">{mat.name}</span>
                           <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">{mat.category}</span>
                         </div>
                         <button onClick={() => handleRemoveMaterial(mat.name)} className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FINANCEIRO TAB RESTORED */}
      {activeTab === 'financeiro' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 animate-slideUp space-y-10">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CreditCard size={24} /></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão de Mensalidades</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-slate-100">
                       <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marmoraria</th>
                       <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano Mensal</th>
                       <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="pb-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {companies.map(c => (
                      <tr key={c.id} className="group">
                         <td className="py-6 font-black text-slate-900 uppercase text-sm">{c.name}</td>
                         <td className="py-6">
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-slate-600">R$</span>
                               <input 
                                 type="number" 
                                 className="w-24 p-2 bg-slate-50 rounded-xl font-black text-sm outline-none border border-transparent focus:border-blue-500" 
                                 defaultValue={c.monthlyFee} 
                                 onBlur={e => updateCompanyFee(c.id, Number(e.target.value))}
                               />
                            </div>
                         </td>
                         <td className="py-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                               {c.status}
                            </span>
                         </td>
                         <td className="py-6 text-right">
                            <button 
                              onClick={() => updateCompanyStatus(c.id, c.status === 'ACTIVE' ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE)}
                              className={`p-2 rounded-xl transition-all ${c.status === 'ACTIVE' ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                            >
                               {c.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODAL: ONBOARDING CLIENTE RESTORED */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl space-y-8 animate-popIn border border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase leading-tight">Onboarding</h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">Nova Marmoraria na Rede</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAccount} className="space-y-6">
               <div className="space-y-1.5">
                 <label htmlFor="formName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Responsável</label>
                 <input 
                    id="formName"
                    type="text" 
                    placeholder="Nome completo do administrador"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm outline-none" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)} 
                    required 
                 />
               </div>
               <div className="space-y-1.5">
                 <label htmlFor="formCompany" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Marmoraria</label>
                 <input 
                    id="formCompany"
                    type="text" 
                    placeholder="Ex: Marmoraria São João"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm outline-none" 
                    value={formCompany} 
                    onChange={e => setFormCompany(e.target.value)} 
                    required 
                 />
               </div>
               <div className="space-y-1.5">
                 <label htmlFor="formEmail" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                 <input 
                    id="formEmail"
                    type="email" 
                    placeholder="admin@marmoraria.com.br"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm outline-none" 
                    value={formEmail} 
                    onChange={e => setFormEmail(e.target.value)} 
                    required 
                 />
               </div>
               <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase shadow-xl hover:bg-emerald-600 transition-all text-xs tracking-widest">
                 ATIVAR UNIDADE AGORA
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDENCIAIS RESTORED */}
      {showCredsModal && selectedCreds && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-popIn border border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase">Chaves de Acesso</h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">{selectedCompanyName}</p>
              </div>
              <button onClick={() => setShowCredsModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all"><X size={24} /></button>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 shadow-inner border border-slate-100">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail de Login</p>
                  <p className="font-bold text-slate-900">{selectedCreds.email}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Senha Padrão (Onboarding)</p>
                  <p className="font-mono font-black text-blue-600 text-lg">marm123</p>
               </div>
            </div>
            <button onClick={() => setShowCredsModal(false)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest">ENTENDI, FECHAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color }) => (
  <div className={`p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all ${color || 'bg-white'}`}>
    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${color ? 'bg-white/10' : 'bg-slate-50'}`}>{icon}</div>
    <div>
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${color ? 'text-slate-400' : 'text-slate-400'}`}>{title}</p>
      <p className="text-3xl font-black tracking-tighter leading-none">{value}</p>
    </div>
  </div>
);

export default PlatformManagement;
