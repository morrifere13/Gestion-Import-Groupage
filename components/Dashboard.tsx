import React from 'react';
import { AppData, OrderStatus, GroupageStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Package, ShoppingCart, Truck, MapPin, Trophy, ShoppingBag } from 'lucide-react';

interface DashboardProps {
  data: AppData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {

  // --- 1. KPI COUNTS ---
  const totalGroupages = data.groupages.length;
  const totalOrders = data.orders.length;
  const totalClients = data.clients.length;
  const totalDeliveries = data.orders.filter(o => o.status === OrderStatus.DELIVERED).length;

  // --- 2. SALES CHARTS DATA ---
  const revenueData = [
    { name: 'Lun', value: 4000 },
    { name: 'Mar', value: 3000 },
    { name: 'Mer', value: 2000 },
    { name: 'Jeu', value: 2780 },
    { name: 'Ven', value: 1890 },
    { name: 'Sam', value: 2390 },
    { name: 'Dim', value: 3490 },
  ];

  const statusData = [
    { name: 'Livré', value: totalDeliveries },
    { name: 'En Attente', value: data.orders.filter(o => o.status === OrderStatus.PENDING).length },
    { name: 'Prêt', value: data.orders.filter(o => o.status === OrderStatus.READY).length },
  ];
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

  // --- 3. TOP RANKINGS CALCULATION ---
  
  // Top Clients (par dépense)
  const topClients = [...data.clients]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Top Produits (par quantité vendue)
  const allProducts = data.groupages.flatMap(g => g.products);
  const topProducts = [...allProducts]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10);

  // Top Villes (par nombre de clients)
  const cityCounts: Record<string, number> = {};
  data.clients.forEach(c => {
      const city = c.city || 'Inconnu';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const topCities = Object.entries(cityCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Tableau de Bord</h2>
        <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            Aujourd'hui: {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* SECTION 1: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Groupages */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
             <Package size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Total Groupages</p>
            <h3 className="text-3xl font-bold text-slate-900">{totalGroupages}</h3>
          </div>
        </div>

        {/* Commandes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
             <ShoppingCart size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Commandes</p>
            <h3 className="text-3xl font-bold text-slate-900">{totalOrders}</h3>
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
             <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Clients</p>
            <h3 className="text-3xl font-bold text-slate-900">{totalClients}</h3>
          </div>
        </div>

        {/* Livraisons */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
             <Truck size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Livraisons OK</p>
            <h3 className="text-3xl font-bold text-slate-900">{totalDeliveries}</h3>
          </div>
        </div>
      </div>

      {/* SECTION 2: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={20} className="text-brand-500"/> Aperçu des Ventes</h3>
              <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1 outline-none">
                  <option>Cette Semaine</option>
                  <option>Ce Mois</option>
              </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ShoppingCart size={20} className="text-brand-500"/> État des Commandes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: TOP RANKINGS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Top Clients */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Top 10 Clients</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
                  {topClients.map((client, idx) => (
                      <div key={client.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                              <div>
                                  <p className="text-sm font-bold text-slate-700">{client.name}</p>
                                  <p className="text-[10px] text-slate-400">{client.city}</p>
                              </div>
                          </div>
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                              {(client.totalSpent / 1000).toFixed(0)}k F
                          </span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Top Produits */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingBag size={18} className="text-pink-500"/> Top Produits</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
                  {topProducts.map((product, idx) => (
                      <div key={product.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                              <span className="text-xs font-bold text-slate-400 min-w-[1.5rem]">{idx + 1}.</span>
                              <div className="truncate">
                                  <p className="text-sm font-bold text-slate-700 truncate">{product.name}</p>
                                  <p className="text-[10px] text-slate-400">Stock: {product.quantityTotal - product.quantitySold}</p>
                              </div>
                          </div>
                          <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-lg shrink-0">
                              {product.quantitySold} vtes
                          </span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Top Villes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-emerald-500"/> Top Villes</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
                  {topCities.map(([city, count], idx) => (
                      <div key={city} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                               <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><MapPin size={14}/></div>
                               <p className="text-sm font-bold text-slate-700">{city}</p>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${(count / totalClients) * 100}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600">{count}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};