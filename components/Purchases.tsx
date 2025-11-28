
import React, { useState } from 'react';
import { AppData, Product, GroupageStatus } from '../types';
import { ShoppingBag, Plus, DollarSign, Package, Check, TrendingDown, Search, X, List, History, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface PurchasesProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const STOCK_ITEMS_PER_PAGE = 10;

export const Purchases: React.FC<PurchasesProps> = ({ data, setData }) => {
  const [activeView, setActiveView] = useState<'inventory' | 'history'>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockPage, setStockPage] = useState(1);

  // Form State
  const [form, setForm] = useState<{
    groupageId: string;
    articleId: string;
    supplier: string;
    buyingPrice: number;
    buyingUnit: string;
    quantity: number;
    sellingPriceEst: number; // Prix vente estimé (pour configurer le produit)
    sellingUnitEst: string;
  }>({
    groupageId: '',
    articleId: '',
    supplier: '',
    buyingPrice: 0,
    buyingUnit: 'Pièce',
    quantity: 0,
    sellingPriceEst: 0,
    sellingUnitEst: 'Pièce'
  });

  // Derived Values for Form
  const selectedArticle = data.articles.find(a => a.id === form.articleId);
  const totalCostFCFA = form.buyingPrice * form.quantity;

  const handleCreatePurchase = () => {
    if (!form.groupageId || !form.articleId || form.quantity <= 0) return;

    // 1. Create the Product object
    const newProduct: Product = {
      id: Date.now().toString(),
      groupageId: form.groupageId,
      name: selectedArticle?.name || 'Produit Inconnu',
      imageUrl: selectedArticle?.imageUrl || '',
      buyingPrice: form.buyingPrice,
      buyingUnit: form.buyingUnit,
      // Initial estimation costs
      costPrice: form.buyingPrice, 
      transportFee: 0,
      customsFee: 0,
      sellingPrice: form.sellingPriceEst,
      sellingOptions: [{ unit: form.sellingUnitEst, price: form.sellingPriceEst, isDefault: true }],
      quantityTotal: form.quantity,
      quantitySold: 0,
      dateAdded: new Date().toISOString(),
      supplier: form.supplier
    };

    // 2. Create Transaction (Expense)
    const transaction = {
      id: Date.now().toString() + '_t',
      date: new Date().toISOString(),
      type: 'EXPENSE' as const,
      category: 'ACHAT_STOCK' as const,
      amount: totalCostFCFA,
      description: `Achat Stock: ${newProduct.name} x${newProduct.quantityTotal}`,
      referenceId: newProduct.id
    };

    // 3. Update Data
    const updatedGroupages = data.groupages.map(g => {
        if (g.id === form.groupageId) {
            return { ...g, products: [...g.products, newProduct] };
        }
        return g;
    });

    setData(prev => ({
        ...prev,
        groupages: updatedGroupages,
        transactions: [transaction, ...prev.transactions]
    }));

    setIsModalOpen(false);
    // Reset form partial
    setForm(prev => ({ ...prev, quantity: 0, buyingPrice: 0, sellingPriceEst: 0 }));
  };

  // --- DATA PROCESSING FOR VIEWS ---

  // 1. Flatten all products for Global Inventory
  const getAllProducts = () => {
    return data.groupages.flatMap(g => 
        g.products.map(p => ({
            ...p,
            groupageName: g.name,
            groupageStatus: g.status,
            purchaseDate: p.dateAdded || g.startDate
        }))
    ).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  };

  const allProducts = getAllProducts();
  
  const filteredProducts = allProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.groupageName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for Inventory
  const totalStockPages = Math.ceil(filteredProducts.length / STOCK_ITEMS_PER_PAGE);
  const currentStock = filteredProducts.slice((stockPage - 1) * STOCK_ITEMS_PER_PAGE, stockPage * STOCK_ITEMS_PER_PAGE);

  // Stats
  const totalPurchasedMonth = allProducts.filter(p => {
      const d = new Date(p.purchaseDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((acc, p) => acc + (p.buyingPrice * p.quantityTotal), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Stock & Achats</h2>
            <p className="text-sm text-slate-500">Vue globale de l'inventaire et enregistrement des approvisionnements.</p>
        </div>
        
        {/* Toggle Views */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
            <button 
                onClick={() => setActiveView('inventory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'inventory' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <List size={16}/> Inventaire Global
            </button>
            <button 
                onClick={() => setActiveView('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <History size={16}/> Journal des Achats
            </button>
        </div>

        <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary shadow-lg shadow-brand-200 flex items-center gap-2"
        >
            <Plus size={20} /> Nouvel Achat
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-full">
                  <TrendingDown size={24}/>
              </div>
              <div>
                  <p className="text-sm text-slate-500 font-medium">Dépenses ce mois</p>
                  <p className="text-2xl font-bold text-slate-900">{totalPurchasedMonth.toLocaleString()} F</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-full">
                  <Package size={24}/>
              </div>
              <div>
                  <p className="text-sm text-slate-500 font-medium">Total Articles Stock</p>
                  <p className="text-2xl font-bold text-slate-900">{allProducts.length}</p>
              </div>
          </div>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg">
               <p className="text-slate-300 text-sm mb-1">Stock Valorisé (Vente)</p>
               <p className="text-xl font-bold">
                 {allProducts.reduce((acc, p) => acc + ((p.quantityTotal - p.quantitySold) * p.sellingPrice), 0).toLocaleString()} F
               </p>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
             <div className="font-bold text-slate-700 flex items-center gap-2">
                 <ShoppingBag size={18}/> {activeView === 'inventory' ? 'État du Stock' : 'Historique des Achats'}
             </div>
             <div className="relative w-full md:w-80">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                 <input 
                    type="text" 
                    placeholder="Rechercher produit, groupage..." 
                    className="w-full pl-10 p-2 rounded-lg bg-white border border-slate-200 text-sm outline-none focus:border-brand-500"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setStockPage(1); }}
                 />
             </div>
          </div>

          <div className="overflow-x-auto">
              {activeView === 'inventory' ? (
                  // === VUE INVENTAIRE GLOBAL ===
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                          <tr>
                              <th className="p-4 pl-6">Produit</th>
                              <th className="p-4">Source (Groupage)</th>
                              <th className="p-4 text-center">Disponibilité</th>
                              <th className="p-4 text-right">Prix Vente</th>
                              <th className="p-4 text-right">Valeur Restante</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {currentStock.map((p, idx) => {
                               const remaining = p.quantityTotal - p.quantitySold;
                               const stockValue = remaining * p.sellingPrice;
                               return (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 pl-6">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover"/> : <ImageIcon className="p-2 text-slate-300"/>}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-slate-800">{p.name}</p>
                                                  <p className="text-xs text-slate-400">{p.buyingPrice} FCFA</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-4">
                                          <span className="font-medium text-slate-700">{p.groupageName}</span>
                                          <div className="flex items-center gap-1 mt-0.5">
                                              <span className={`w-1.5 h-1.5 rounded-full ${p.groupageStatus === GroupageStatus.ARRIVED ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                              <span className="text-[10px] text-slate-400">{p.groupageStatus}</span>
                                          </div>
                                      </td>
                                      <td className="p-4 text-center">
                                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${remaining > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                              {remaining} <span className="text-[10px] font-normal uppercase text-slate-500 ml-0.5">{p.buyingUnit}</span>
                                          </span>
                                      </td>
                                      <td className="p-4 text-right">
                                          {p.sellingOptions && p.sellingOptions.length > 0 ? (
                                              <div className="flex flex-col items-end gap-1">
                                                  {p.sellingOptions.map((opt, oIdx) => (
                                                      <span key={oIdx} className={`text-xs px-1.5 py-0.5 rounded ${opt.isDefault ? 'bg-brand-50 text-brand-700 font-medium' : 'bg-slate-100 text-slate-600'}`}>
                                                          {opt.price.toLocaleString()} / {opt.unit}
                                                      </span>
                                                  ))}
                                              </div>
                                          ) : (
                                              <span className="font-bold text-slate-700">{p.sellingPrice.toLocaleString()} F</span>
                                          )}
                                      </td>
                                      <td className="p-4 text-right font-mono text-slate-600">
                                          {stockValue.toLocaleString()} F
                                      </td>
                                  </tr>
                               );
                          })}
                      </tbody>
                  </table>
              ) : (
                  // === VUE HISTORIQUE ACHATS ===
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4 pl-6">Date</th>
                            <th className="p-4">Produit</th>
                            <th className="p-4">Destination</th>
                            <th className="p-4 text-right">Prix Achat</th>
                            <th className="p-4 text-right">Quantité</th>
                            <th className="p-4 text-right">Coût Total (FCFA)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentStock.map((purchase, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 pl-6 text-slate-500 whitespace-nowrap">
                                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                                </td>
                                <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                                    {purchase.imageUrl && <img src={purchase.imageUrl} className="w-8 h-8 rounded object-cover border border-slate-200"/>}
                                    {purchase.name}
                                </td>
                                <td className="p-4">
                                    <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs border border-brand-100">
                                        {purchase.groupageName}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {purchase.buyingPrice} FCFA
                                </td>
                                <td className="p-4 text-right font-medium">
                                    {purchase.quantityTotal} {purchase.buyingUnit}
                                </td>
                                <td className="p-4 text-right font-bold text-slate-800">
                                    {(purchase.buyingPrice * purchase.quantityTotal).toLocaleString()} F
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              )}
              
              {currentStock.length === 0 && (
                 <div className="p-12 text-center text-slate-400 italic">Aucun élément trouvé.</div>
              )}
          </div>

          {/* Pagination */}
          {totalStockPages > 1 && (
            <div className="flex justify-center items-center gap-4 p-4 border-t border-slate-100">
                <button onClick={() => setStockPage(p => Math.max(1, p - 1))} disabled={stockPage === 1} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18}/></button>
                <span className="text-xs font-medium text-slate-600">Page {stockPage} / {totalStockPages}</span>
                <button onClick={() => setStockPage(p => Math.min(totalStockPages, p + 1))} disabled={stockPage === totalStockPages} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={18}/></button>
            </div>
          )}
      </div>

      {/* MODAL NOUVEL ACHAT */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                      <div>
                          <h3 className="font-bold text-xl text-slate-800">Enregistrer un Achat</h3>
                          <p className="text-xs text-slate-500">Ajoute le stock au groupage et crée une dépense.</p>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
                      
                      {/* Destination & Source */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Groupage de Destination <span className="text-red-500">*</span></label>
                              <select 
                                  className="w-full p-2 bg-slate-50 rounded-lg border-none outline-none font-medium text-sm"
                                  value={form.groupageId}
                                  onChange={e => setForm({...form, groupageId: e.target.value})}
                              >
                                  <option value="">-- Choisir Groupage --</option>
                                  {data.groupages.filter(g => g.status !== 'Terminé').map(g => (
                                      <option key={g.id} value={g.id}>{g.name} ({g.status})</option>
                                  ))}
                              </select>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Article du Catalogue <span className="text-red-500">*</span></label>
                              <select 
                                  className="w-full p-2 bg-slate-50 rounded-lg border-none outline-none font-medium text-sm"
                                  value={form.articleId}
                                  onChange={e => setForm({...form, articleId: e.target.value})}
                              >
                                  <option value="">-- Choisir Article --</option>
                                  {data.articles.map(a => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      {/* Details Achat */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                              <DollarSign size={16} className="text-brand-500"/> Coûts & Quantités
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prix Achat (FCFA)</label>
                                  <input type="number" className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm font-bold" 
                                      value={form.buyingPrice || ''} onChange={e => setForm({...form, buyingPrice: Number(e.target.value)})} placeholder="0" />
                              </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Quantité</label>
                                  <input type="number" className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm font-bold" 
                                      value={form.quantity || ''} onChange={e => setForm({...form, quantity: Number(e.target.value)})} placeholder="0" />
                               </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Unité Achat</label>
                                  <input type="text" className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm" 
                                      value={form.buyingUnit} onChange={e => setForm({...form, buyingUnit: e.target.value})} placeholder="Ex: Carton" />
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fournisseur</label>
                                  <input type="text" className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm" 
                                      value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} placeholder="Ex: Alibaba" />
                               </div>
                          </div>
                      </div>

                      {/* Details Vente (Config Initiale) */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                              <DollarSign size={16} className="text-emerald-500"/> Configuration Vente (Estimée)
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prix Vente (FCFA)</label>
                                  <input type="number" className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm font-bold text-emerald-600" 
                                      value={form.sellingPriceEst || ''} onChange={e => setForm({...form, sellingPriceEst: Number(e.target.value)})} placeholder="0" />
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Unité Vente</label>
                                  <input type="text" className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm" 
                                      value={form.sellingUnitEst} onChange={e => setForm({...form, sellingUnitEst: e.target.value})} placeholder="Ex: Pièce" />
                               </div>
                          </div>
                      </div>

                      {/* Total */}
                      <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                          <span className="text-sm font-medium opacity-80">Total Dépense Estimée</span>
                          <span className="text-2xl font-bold">{totalCostFCFA.toLocaleString()} FCFA</span>
                      </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
                      <button 
                        onClick={handleCreatePurchase}
                        disabled={!form.groupageId || !form.articleId || form.quantity <= 0}
                        className="px-8 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                          <Check size={18} /> Valider l'Achat
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};