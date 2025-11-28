
import React, { useState } from 'react';
import { User, Role } from '../types';
import { Lock, User as UserIcon, LogIn, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulation d'une authentification (Hardcoded pour la démo)
    if (username === 'admin' && password === 'admin') {
      onLogin({
        id: 'u1',
        username: 'admin',
        name: 'Administrateur',
        role: 'ADMIN'
      });
    } else if (username === 'assistant' && password === '1234') {
      onLogin({
        id: 'u2',
        username: 'assistant',
        name: 'Assistant Commercial',
        role: 'ASSISTANT'
      });
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
        
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-brand-600/20 blur-3xl rounded-full transform -translate-y-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white tracking-wider">IMPORT PRO</h1>
            <p className="text-slate-400 text-sm mt-2">Logiciel de Gestion & Logistique</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Connexion</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
               <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Nom d'utilisateur</label>
               <div className="relative group">
                  <UserIcon className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20}/>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white transition-all font-medium text-slate-800"
                    placeholder="Entrez votre identifiant"
                  />
               </div>
            </div>

            <div>
               <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Mot de passe</label>
               <div className="relative group">
                  <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20}/>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white transition-all font-medium text-slate-800"
                    placeholder="Entrez votre mot de passe"
                  />
               </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium animate-pulse">
                <ShieldAlert size={18}/> {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-brand-600 hover:shadow-brand-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              <LogIn size={20}/> Se Connecter
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Comptes de Démonstration</p>
            <div className="flex justify-center gap-4 text-xs text-slate-600">
               <div className="bg-slate-50 px-3 py-1 rounded border border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => {setUsername('admin'); setPassword('admin')}}>
                 <span className="font-bold">Admin:</span> admin / admin
               </div>
               <div className="bg-slate-50 px-3 py-1 rounded border border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => {setUsername('assistant'); setPassword('1234')}}>
                 <span className="font-bold">Assistant:</span> assistant / 1234
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
