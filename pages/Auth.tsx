
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { login } from '../services/storageService';
import { LogIn, Building2, Mail, Lock, Eye, EyeOff, AlertCircle, Shield, HardHat, Search, X } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.ADMIN);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = login(email, password, activeRole);
      if (user) {
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ajuda de diagnóstico (Apenas para ambiente de teste)
  const getStoredAccounts = () => {
    const users = JSON.parse(localStorage.getItem('marm_users_v2') || '[]');
    return users;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 sm:p-12 space-y-8 animate-popIn border border-white/10">
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

        {/* Seletor de Perfil Corrigido */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
           <button 
             type="button"
             onClick={() => { setActiveRole(UserRole.ADMIN); setError(null); }}
             className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeRole === UserRole.ADMIN ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Shield size={14} /> Proprietário / ADM
           </button>
           <button 
             type="button"
             onClick={() => { setActiveRole(UserRole.OPERATOR); setError(null); }}
             className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeRole === UserRole.OPERATOR ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <HardHat size={14} /> Colaborador
           </button>
        </div>

        {error && (
          <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-3xl flex items-start gap-4 animate-shake">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
               <p className="text-[10px] font-black uppercase tracking-widest">Erro de Acesso</p>
               <p className="text-[11px] font-bold leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="exemplo@gmail.com"
                className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-bold transition-all outline-none text-slate-900 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Digite sua senha"
                className="w-full pl-12 pr-12 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-bold transition-all outline-none text-slate-900 text-sm"
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
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-slate-900 text-white py-5.5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 mt-6 uppercase tracking-widest text-sm ${loading ? 'opacity-50' : 'hover:bg-blue-600'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <><LogIn size={20} /> ENTRAR NO SISTEMA</>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
           <button 
             onClick={() => setShowHelp(true)}
             className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-blue-600 transition-all flex items-center justify-center gap-2 mx-auto"
           >
             <Search size={12} /> Ajuda com Acesso
           </button>
        </div>
      </div>

      {/* Modal de Ajuda Diagnóstica */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-8 sm:p-10 shadow-2xl space-y-6 relative animate-popIn">
              <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><X size={20} /></button>
              <div className="text-center space-y-1">
                 <h3 className="text-xl font-black text-slate-900 uppercase">Diagnóstico de Contas</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contas registradas neste navegador</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                 {getStoredAccounts().length > 0 ? getStoredAccounts().map((acc: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[11px] font-black text-slate-900 uppercase">{acc.name}</p>
                       <p className="text-[10px] text-blue-600 font-bold">{acc.email}</p>
                       <div className="flex justify-between items-center mt-2 border-t border-slate-200 pt-2">
                          <span className="text-[8px] font-black uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-600">{acc.role === 'ADMIN' ? 'Proprietário' : 'Colaborador'}</span>
                          <span className="text-[8px] font-black text-slate-400">Senha: {acc.password}</span>
                       </div>
                    </div>
                 )) : (
                    <p className="text-center py-10 text-slate-400 italic text-xs">Nenhuma conta encontrada na memória.</p>
                 )}
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                 <p className="text-[9px] text-amber-700 font-bold uppercase text-center leading-relaxed">
                   Se sua conta não aparece aqui, você precisa cadastrá-la no Painel Global (Super Admin) ou seu chefe precisa te cadastrar em "Equipe".
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
