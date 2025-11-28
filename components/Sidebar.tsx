
import React from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, Truck, Wallet, LogOut, Library, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  
  const allMenuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'groupages', label: 'Groupages (Logistique)', icon: Package, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'deliveries', label: 'Livraisons', icon: Truck, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'clients', label: 'Clients', icon: Users, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'articles', label: 'Catalogue Articles', icon: Library, roles: ['ADMIN', 'ASSISTANT'] },
    // FINANCE EST RÉSERVÉ AUX ADMINS
    { id: 'finance', label: 'Caisse & Profit', icon: Wallet, roles: ['ADMIN'] },
  ];

  // Filtrer les menus selon le rôle
  const visibleMenuItems = allMenuItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-20 hidden md:flex">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-brand-500 tracking-wider">IMPORT PRO</h1>
        <div className="flex items-center gap-2 mt-2 bg-slate-800 p-2 rounded-lg">
           <div className={`w-2 h-2 rounded-full ${currentUser?.role === 'ADMIN' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
           <div>
               <p className="text-xs font-bold text-white">{currentUser?.name}</p>
               <p className="text-[10px] text-slate-400 uppercase">{currentUser?.role}</p>
           </div>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200
                ${isActive 
                  ? 'bg-brand-600 text-white border-r-4 border-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon size={20} className="mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};
