
import React, { useState } from 'react';
import { User } from '../types';
import { login } from '../services/storageService';
import { LogIn, Building2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        setLoading(false);
        return setError('Por favor, informe seu e-mail e sua senha para entrar.');
      }
      
      const user = login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Falha na autenticação. Verifique os dados informados.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 space-y-8 animate-popIn">
        <div className="text-center space-y-2">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Building2 className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Acesso Restrito
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Painel de Gestão de Marmoraria
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex gap-3 animate-shake">
            <AlertCircle className="shrink-0" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="E-mail de Acesso"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold transition-all outline-none text-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Sua Senha"
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold transition-all outline-none text-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
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
            disabled={loading}
            className={`w-full bg-slate-900 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 mt-4 group uppercase tracking-widest ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
               <>
                 <LogIn size={20} />
                 Entrar no Sistema
               </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
             Dúvidas? Entre em contato com o suporte da plataforma.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
