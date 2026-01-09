
import React, { useState } from 'react';
import { User } from '../types';
import { login, registerCompany } from '../services/storageService';
import { LogIn, UserPlus, Building2, Mail, User as UserIcon, Lock, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      if (!email || !password) return alert('Por favor, preencha e-mail e senha.');
      const user = login(email, password);
      if (user) onLogin(user);
      else alert('E-mail ou senha incorretos. Tente novamente ou registre sua empresa.');
    } else {
      if (!name || !email || !company || !password) return alert('Preencha todos os campos obrigatórios.');
      const user = registerCompany(name, email, company, password);
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
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Nome da Marmoraria"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
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
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Sua Senha"
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 mt-4 group"
          >
            {isLogin ? <LogIn size={20} className="group-hover:translate-x-1 transition-transform" /> : <UserPlus size={20} />}
            {isLogin ? 'ENTRAR' : 'CRIAR CONTA ADM'}
          </button>
        </form>

        <div className="text-center pt-4">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword('');
              setEmail('');
            }}
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
