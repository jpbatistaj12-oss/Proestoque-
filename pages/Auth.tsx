
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { login, restoreDatabaseFromJSON } from '../services/storageService';
import { LogIn, Building2, Mail, Lock, Eye, EyeOff, AlertCircle, Shield, HardHat, Info, Sparkles, Upload } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError(null);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (restoreDatabaseFromJSON(content)) {
          alert("Dados restaurados! Tente logar agora.");
          window.location.reload();
        } else {
          alert("Arquivo inválido.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setLoading(false);
      return setError('Preencha seu e-mail e sua senha.');
    }

    setTimeout(() => {
      try {
        const user = login(cleanEmail, cleanPass, activeRole);
        if (user) {
          onLogin(user);
        }
      } catch (err: any) {
        setError(err.message || 'Falha na autenticação.');
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      <div className="w-full max-w-md relative animate-slideUp">
        <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 relative z-10">
          
          <div className="bg-gradient-to-b from-slate-50 to-white pt-12 pb-8 px-8 text-center border-b border-slate-100">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl relative rotate-3 hover:rotate-0 transition-transform duration-500">
                <Building2 size={38} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                <Sparkles size={14} />
              </div>
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
              Marmoraria<br/>Control
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Acesso do Sistema
              <span className="w-8 h-[1px] bg-slate-200"></span>
            </p>
          </div>

          <div className="p-8 sm:p-10 space-y-8">
            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] gap-1 relative border border-slate-200/50">
              <button 
                type="button"
                onClick={() => handleRoleChange(UserRole.ADMIN)}
                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${activeRole === UserRole.ADMIN ? 'text-slate-900' : 'text-slate-400 hover:text-slate-500'}`}
              >
                <Shield size={16} /> Administrador
              </button>
              <button 
                type="button"
                onClick={() => handleRoleChange(UserRole.OPERATOR)}
                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${activeRole === UserRole.OPERATOR ? 'text-slate-900' : 'text-slate-400 hover:text-slate-500'}`}
              >
                <HardHat size={16} /> Colaborador
              </button>
              <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-2xl shadow-md transition-all duration-500 ease-out ${activeRole === UserRole.ADMIN ? 'left-1.5' : 'left-[50%]'}`}></div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 animate-shake">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest">Atenção</p>
                  <p className="text-[11px] font-bold leading-tight">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação (E-mail)</label>
                <div className="group relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="nome@marmoraria.com"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-bold transition-all outline-none text-slate-900 text-sm placeholder:text-slate-300 shadow-inner"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Senha Segura</label>
                <div className="group relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    className="w-full pl-14 pr-14 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-bold transition-all outline-none text-slate-900 text-sm placeholder:text-slate-300 shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-[0_10px_30px_rgba(59,130,246,0.4)] transition-all active:scale-95 mt-4 uppercase tracking-widest text-sm ${loading ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)]'}`}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Autenticando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <LogIn size={20} />
                    <span>ENTRAR NO PORTAL</span>
                  </div>
                )}
              </button>
            </form>

            <div className="text-center pt-2 space-y-4">
               <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 mx-auto text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline group"
               >
                  <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Acessando de outro computador? Importar Backup
               </button>
               
               <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all cursor-help group">
                 <Info size={16} className="text-blue-500 group-hover:animate-bounce" />
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">
                   Problemas com acesso? <span className="text-blue-600">Fale com o Suporte</span>
                 </p>
               </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-8 opacity-50">
          Secure Infrastructure v2.1.0 • Marmoraria Control
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-slideUp {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Auth;
