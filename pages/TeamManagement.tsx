
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getTeamMembers, addTeamMember } from '../services/storageService';
import { UserPlus, Shield, HardHat, Mail, Trash2, Lock, Eye, EyeOff, X } from 'lucide-react';

interface TeamManagementProps {
  user: User;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ user }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState(UserRole.OPERATOR);

  useEffect(() => {
    setMembers(getTeamMembers(user.companyId));
  }, [user.companyId]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      alert("Preencha todos os campos, incluindo a senha de acesso.");
      return;
    }
    addTeamMember(newName, newEmail, newRole, user.companyId, newPassword);
    setMembers(getTeamMembers(user.companyId));
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Equipe de Oficina</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Gestão de Colaboradores e Acessos</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-600 shadow-xl transition-all active:scale-95"
        >
          <UserPlus size={20} /> ADICIONAR COLABORADOR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 relative group hover:shadow-md transition-shadow">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              member.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {member.role === UserRole.ADMIN ? <Shield size={32} /> : <HardHat size={32} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-800 truncate uppercase tracking-tighter text-lg">{member.name}</h4>
              <p className="text-xs text-slate-400 font-bold truncate flex items-center gap-1">
                <Mail size={12} /> {member.email}
              </p>
              <div className="flex gap-2 mt-2">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                  member.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {member.role}
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                  ID: {member.id.split('-')[1]}
                </span>
              </div>
            </div>
            {member.id !== user.id && (
              <button className="opacity-0 group-hover:opacity-100 absolute top-6 right-6 text-red-300 hover:text-red-500 transition-all">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-popIn">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Novo Colaborador</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Funcionário</label>
                <input 
                  type="text" 
                  placeholder="Nome Completo"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Login</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    placeholder="ex@empresa.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Defina uma senha"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Permissão</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none cursor-pointer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.OPERATOR}>Operador de Oficina</option>
                  <option value={UserRole.ADMIN}>Administrador do Sistema</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all active:scale-95"
                >
                  SALVAR COLABORADOR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
