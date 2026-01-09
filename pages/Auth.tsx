
import React, { useState } from 'react';
import { User } from '../types';
import { login, registerCompany } from '../services/storageService';
import { LogIn, UserPlus, Building2, Mail, User as UserIcon } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const user = login(email);
      if (user) onLogin(user);
      else alert('Usuário não encontrado. Registre sua empresa!');
    } else {
      if (!name || !email || !company) return alert('Preencha todos os campos.');
      const user = registerCompany(name, email, company);
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 space-y-8 animate-popIn">
        <div className="text-center space-y-2">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Building2 className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
            {isLogin ? 'Bem-vindo de volta' : 'Nova Empresa'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            {isLogin ? 'Acesse seu painel de marmoraria' : 'Inicie sua gestão profissional hoje'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Seu Nome Completo"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Nome da Marmoraria"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="E-mail de Acesso"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 mt-4"
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? 'ENTRAR NO SISTEMA' : 'CRIAR CONTA ADM'}
          </button>
        </form>

        <div className="text-center pt-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isLogin ? 'Não tem conta? Registre sua empresa' : 'Já possui empresa cadastrada? Entre aqui'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
