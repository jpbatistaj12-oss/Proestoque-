
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { getTeamMembers, addTeamMember, updateTeamMemberCredentials, deleteTeamMember, StoredUser } from '../services/storageService';
import { UserPlus, Shield, HardHat, Mail, Trash2, Lock, Eye, EyeOff, X, Key, Check, Copy, AlertCircle } from 'lucide-react';

interface TeamManagementProps {
  user: { id: string; companyId: string; };
}

const TeamManagement: React.FC<TeamManagementProps> = ({ user }) => {
  const [members, setMembers] = useState<StoredUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StoredUser | null>(null);
  
  // States para novos membros
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState(UserRole.OPERATOR);
  const [showPassword, setShowPassword] = useState(false);

  // States para edição
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState(UserRole.OPERATOR);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    refreshMembers();
  }, [user.companyId]);

  const refreshMembers = () => {
    setMembers(getTeamMembers(user.companyId));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newName || !newEmail || !newPassword) return alert("Preencha todos os campos.");
      addTeamMember(newName, newEmail, newRole, user.companyId, newPassword);
      refreshMembers();
      setShowAddModal(false);
      resetAddForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetAddForm = () => {
    setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole(UserRole.OPERATOR);
  };

  const handleOpenEdit = (member: StoredUser) => {
    setSelectedMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditPassword(member.password || '');
    setEditRole(member.role);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      updateTeamMemberCredentials(selectedMember.id, user.companyId, {
        name: editName,
        email: editEmail,
        password: editPassword,
        role: editRole
      });
      refreshMembers();
      setShowEditModal(false);
      alert("Credenciais atualizadas com sucesso!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = (memberId: string, memberName: string) => {
    if (window.confirm(`Tem certeza que deseja remover ${memberName} da equipe?`)) {
      deleteTeamMember(memberId, user.companyId);
      refreshMembers();
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Minha Equipe</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Controle de acessos e cargos da marmoraria</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 shadow-xl transition-all active:scale-95 text-sm"
        >
          <UserPlus size={20} /> ADICIONAR COLABORADOR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 relative group hover:shadow-xl hover:border-blue-100 transition-all">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              member.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {member.role === UserRole.ADMIN ? <Shield size={32} /> : <HardHat size={32} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-900 truncate uppercase tracking-tight text-lg leading-tight mb-1">{member.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold truncate flex items-center gap-1.5 uppercase tracking-widest">
                <Mail size={12} className="text-slate-300" /> {member.email}
              </p>
              <div className="flex gap-2 mt-3">
                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                  member.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {member.role === UserRole.ADMIN ? 'Administrador' : 'Operador'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleOpenEdit(member)}
                className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                title="Editar Credenciais"
              >
                <Key size={18} className="group-hover/btn:rotate-12 transition-transform" />
              </button>
              {member.id !== user.id && (
                <button 
                  onClick={() => handleDelete(member.id, member.name)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                  title="Remover Colaborador"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Adicionar Colaborador */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-popIn border border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Novo Acesso</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" placeholder="Ex: João da Silva" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/5 outline-none" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Login</label>
                <input type="email" placeholder="funcionario@empresa.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/5 outline-none" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Entrada</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type={showPassword ? "text" : "password"} placeholder="Defina a senha" className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/5 outline-none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Nível</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none cursor-pointer" value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                  <option value={UserRole.OPERATOR}>Operador (Só Oficina)</option>
                  <option value={UserRole.ADMIN}>Administrador (Controle Total)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
                CRIAR ACESSO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição/Visualização de Credenciais */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl space-y-8 animate-popIn border border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Credenciais</h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">{selectedMember.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
               <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/50 space-y-6 shadow-inner">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Atual (Login)</label>
                    <div className="flex gap-2">
                       <input type="email" className="flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                       <button type="button" onClick={() => copyToClipboard(editEmail, 'email')} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all">
                          {copiedField === 'email' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400" />}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alterar Senha de Acesso</label>
                    <div className="flex gap-2">
                       <input type="text" placeholder="Digite a nova senha" className="flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none tracking-widest" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                       <button type="button" onClick={() => copyToClipboard(editPassword, 'pass')} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all">
                          {copiedField === 'pass' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400" />}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Permissão</label>
                    <select className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none" value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                      <option value={UserRole.OPERATOR}>Operador de Oficina</option>
                      <option value={UserRole.ADMIN}>Administrador do Painel</option>
                    </select>
                  </div>
               </div>

               <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed tracking-tight">
                    Atenção: Ao alterar a senha, o colaborador precisará deslogar e logar novamente com os novos dados.
                  </p>
               </div>

               <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 shadow-xl transition-all">Salvar Mudanças</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
