
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getTeamMembers, addTeamMember } from '../services/storageService';
import { UserPlus, Shield, HardHat, Mail, Trash2 } from 'lucide-react';

interface TeamManagementProps {
  user: User;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ user }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState(UserRole.OPERATOR);

  useEffect(() => {
    setMembers(getTeamMembers(user.companyId));
  }, [user.companyId]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    addTeamMember(newName, newEmail, newRole, user.companyId);
    setMembers(getTeamMembers(user.companyId));
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Equipe de Oficina</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Gestão de Colaboradores</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-900 shadow-xl transition-all"
        >
          <UserPlus size={20} /> CONVIDAR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 relative group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              member.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
            }`}>
              {member.role === UserRole.ADMIN ? <Shield size={28} /> : <HardHat size={28} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-800 truncate uppercase tracking-tighter">{member.name}</h4>
              <p className="text-xs text-slate-400 font-bold truncate">{member.email}</p>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded mt-1 inline-block ${
                member.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {member.role}
              </span>
            </div>
            {member.id !== user.id && (
              <button className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-red-300 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6 animate-popIn">
            <h3 className="text-2xl font-black text-slate-900">Novo Membro</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <input 
                  type="email" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Permissão</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.OPERATOR}>Operador (Oficina)</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold uppercase text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-500/20"
                >
                  Adicionar
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
