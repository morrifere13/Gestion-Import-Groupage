
import React, { useState } from 'react';
import { AppData, Transaction } from '../types';
import { ArrowUpRight, ArrowDownRight, DollarSign, Package, ShoppingBag, Truck, Eye, X, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinanceProps {
  data: AppData;
}

export const Finance: React.FC<FinanceProps> = ({ data }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // --- CALCULS FINANCIERS ---
  const income = data.transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const expense = data.transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  // Recettes par catégorie
  const incomeSales = data.transactions.filter(t => t.type === 'INCOME' && t.category === 'VENTE').reduce((acc, t) => acc + t.amount, 0);
  const incomeDelivery = data.transactions.filter(t => t.type === 'INCOME' && t.category === 'TRANSPORT').reduce((acc, t) => acc + t.amount, 0);
  const incomeOther = income - incomeSales - incomeDelivery;

  // --- CALCULS STOCKS ---
  let totalQuantitySold = 0;
  let totalQuantityInStock = 0;
  
  data.groupages.forEach(g => {
    g.products.forEach(p => {
        totalQuantitySold += p.quantitySold;
        totalQuantityInStock += (p.quantityTotal - p.quantitySold);
    });
  });

  // --- GRAPHIQUE DEPENSES ---
  const expenseData = [
    { name: 'Achat Marchandise', value: data.transactions.filter(t => t.category === 'ACHAT_STOCK').reduce((acc, t) => acc + t.amount, 0) },
    { name: 'Transport/Douane', value: data.transactions.filter(t => t.category === 'TRANSPORT' || t.category === 'DOUANE').reduce((acc, t) => acc + t.amount, 0) },
    { name: 'Autres', value: data.transactions.filter(t => t.type === 'EXPENSE' && t.category !== 'ACHAT_STOCK' && t.category !== 'TRANSPORT' && t.category !== 'DOUANE').reduce((acc, t) => acc + t.amount, 0) },
  ].filter(d => d.value > 0);
  
  const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800">Caisse & Performance</h2>

      {/* SECTION 1: INDICATEURS STOCK & VOLUME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Produits Vendus</p>
                  <p className="text-2xl font-bold text-brand-600">{totalQuantitySold}</p>
              </div>
              <div className="p-3 bg-brand-50 text-brand-500 rounded-xl">
                  <ShoppingBag size={24}/>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">En Stock</p>
                  <p className="text-2xl font-bold text-slate-800">{totalQuantityInStock}</p>
              </div>
              <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
                  <Package size={24}/>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Recette Livraison</p>
                  <p className="text-2xl font-bold text-amber-600">{incomeDelivery.toLocaleString()} F</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                  <Truck size={24}/>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Recette Vente</p>
                  <p className="text-2xl font-bold text-emerald-600">{incomeSales.toLocaleString()} F</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                  <DollarSign size={24}/>
              </div>
          </div>
      </div>

      {/* SECTION 2: SYNTHÈSE FINANCIÈRE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Carte Solde Principal */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                  <DollarSign size={200} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 h-full">
                  <div>
                      <p className="text-slate-400 font-medium mb-1">Solde Net en Caisse</p>
                      <h3 className={`text-5xl font-bold tracking-tight ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                          {balance.toLocaleString()} FCFA
                      </h3>
                      <div className="flex gap-6 mt-6">
                          <div>
                              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><ArrowUpRight size={14} className="text-emerald-400"/> Total Entrées</p>
                              <p className="text-xl font-bold text-emerald-400">{income.toLocaleString()} F</p>
                          </div>
                          <div>
                              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><ArrowDownRight size={14} className="text-red-400"/> Total Sorties</p>
                              <p className="text-xl font-bold text-red-400">{expense.toLocaleString()} F</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Graphique Répartition Dépenses */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-2">Répartition Dépenses</h3>
              <div className="flex-1 min-h-[200px]">
                {expense > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Aucune dépense enregistrée</div>
                )}
              </div>
          </div>
      </div>

      {/* SECTION 3: HISTORIQUE DES TRANSACTIONS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Historique des Transactions</h3>
              <button className="text-sm font-medium text-brand-600 hover:text-brand-700">Exporter</button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                      <tr>
                          <th className="p-4 pl-6">Date</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Catégorie</th>
                          <th className="p-4 text-right">Montant</th>
                          <th className="p-4 text-center">Détails</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {data.transactions.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400">Aucune transaction trouvée.</td></tr>
                      ) : (
                          data.transactions.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="p-4 pl-6 text-slate-500 font-mono text-xs">
                                      {new Date(t.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-4 font-medium text-slate-800">
                                      {t.description}
                                  </td>
                                  <td className="p-4">
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                          t.category === 'VENTE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                          t.category === 'TRANSPORT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                          t.category === 'ACHAT_STOCK' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                          'bg-slate-50 text-slate-600 border-slate-100'
                                      }`}>
                                          {t.category}
                                      </span>
                                  </td>
                                  <td className={`p-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {t.type === 'INCOME' ? '+' : '-'} {t.amount.toLocaleString()} F
                                  </td>
                                  <td className="p-4 text-center">
                                      <button 
                                        onClick={() => setSelectedTransaction(t)}
                                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                                      >
                                          <Eye size={16}/>
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* MODAL DÉTAILS TRANSACTION */}
      {selectedTransaction && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">Détails Transaction</h3>
                      <button onClick={() => setSelectedTransaction(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="text-center mb-6">
                          <p className="text-sm text-slate-500 font-bold uppercase mb-1">{selectedTransaction.type === 'INCOME' ? 'Encaissement' : 'Décaissement'}</p>
                          <p className={`text-4xl font-bold ${selectedTransaction.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {selectedTransaction.amount.toLocaleString()} F
                          </p>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <Calendar className="text-slate-400" size={20}/>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
                                  <p className="font-medium text-slate-800">{new Date(selectedTransaction.date).toLocaleString()}</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <FileText className="text-slate-400" size={20}/>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase">Description</p>
                                  <p className="font-medium text-slate-800">{selectedTransaction.description}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</p>
                                  <span className="font-bold text-sm text-slate-700">{selectedTransaction.category}</span>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Réf. ID</p>
                                  <span className="font-mono text-xs text-slate-500 break-all">{selectedTransaction.referenceId || 'N/A'}</span>
                              </div>
                          </div>
                      </div>

                      {/* Contextuel Link (Si c'est une commande ou un groupage) */}
                      {selectedTransaction.category === 'VENTE' && (
                          <div className="flex items-center gap-2 text-xs text-brand-600 bg-brand-50 p-3 rounded-lg border border-brand-100">
                              <CheckCircle size={14}/>
                              Lié à une vente client (Commande)
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-white text-right">
                      <button onClick={() => setSelectedTransaction(null)} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Fermer</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
