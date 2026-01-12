
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
      if (!email.trim() || !password.trim()) {
        setLoading(false);
        return setError('E-mail e senha são obrigatórios.');
      }
      
      const user = login(email, password);
      if (user) {
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 sm:p-12 space-y-8 animate-popIn">
        <div className="text-center space-y-2">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
            <Building2 className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            Acesso Restrito
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
            Gestão de Marmoraria v2.1
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
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="email" 
              placeholder="exemplo@gmail.com"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 font-bold transition-all outline-none text-slate-900 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Senha de acesso"
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 font-bold transition-all outline-none text-slate-900 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 mt-6 uppercase tracking-widest text-sm ${loading ? 'opacity-50' : 'hover:bg-blue-600'}`}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><LogIn size={20} /> Entrar no Sistema</>}
          </button>
        </form>

        <div className="text-center pt-2">
           <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
             Esqueceu o e-mail? Consulte o administrador da plataforma.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
