

import React, { useState, useEffect } from 'react';
import { AppData, Order, OrderStatus, Product, SellingOption, GroupageStatus } from '../types';
import { ShoppingCart, PlusCircle, Truck, Check, Printer, User, Search, Package, ArrowRight, Trash2, CreditCard, AlertCircle, Minus, Plus, ChevronLeft, Calendar, Send, Wallet, Banknote, Smartphone, Landmark } from 'lucide-react';

interface OrdersProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  onNavigateToDelivery: (orderId: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({ data, setData, onNavigateToDelivery }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedGroupageFilter, setSelectedGroupageFilter] = useState<string>(''); // Filtre Groupage
  const [productSearch, setProductSearch] = useState('');
  
  // State pour le paiement anticipé (Solde)
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  
  // Panier
  const [cart, setCart] = useState<{
    productId: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    tempId: string;
    groupageId: string; // On garde la trace de l'origine
  }[]>([]);

  // Montant payé à la commande (Avance ou Total) - Editable par l'utilisateur
  const [manualAdvanceAmount, setManualAdvanceAmount] = useState<number | null>(null);

  // Pour gérer la sélection d'unité temporaire sur les cartes produits
  const [selectedUnitState, setSelectedUnitState] = useState<{[productId: string]: {unit: string, price: number}}>({});

  // Reset manual advance when cart changes
  useEffect(() => {
     setManualAdvanceAmount(null);
  }, [cart.length]);

  // --- LOGIC ---

  const handleCreateOrder = () => {
    if (!selectedClient || cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    // Si l'utilisateur a saisi un montant manuel, on l'utilise, sinon on calcule 30% par défaut
    const advance = manualAdvanceAmount !== null ? manualAdvanceAmount : Math.round(total * 0.3);

    // Détermine si la commande est liée à un groupage unique ou mixte
    const uniqueGroupageId = selectedGroupageFilter || (cart.every(i => i.groupageId === cart[0].groupageId) ? cart[0].groupageId : undefined);

    const newOrder: Order = {
      id: Date.now().toString(),
      clientId: selectedClient,
      groupageId: uniqueGroupageId, // Enregistre l'ID si un filtre est actif ou si tous les produits viennent du même
      date: new Date().toLocaleDateString(),
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, unit: i.unit })),
      totalAmount: total,
      advancePaid: advance,
      balanceRemaining: Math.max(0, total - advance),
      status: OrderStatus.READY, // Par défaut prêt, car on vend souvent du stock
      isDeliveryPaid: false
    };

    // Mise à jour des stocks (Multi-Groupage)
    const updatedGroupages = data.groupages.map(g => {
        // Est-ce que ce groupage contient des produits vendus ?
        const productsInGroupage = g.products.filter(p => cart.some(c => c.productId === p.id));
        
        if (productsInGroupage.length > 0) {
            return {
                ...g,
                products: g.products.map(p => {
                    const cartItems = cart.filter(c => c.productId === p.id);
                    if (cartItems.length > 0) {
                        const qtySold = cartItems.reduce((s, i) => s + i.quantity, 0);
                        return { ...p, quantitySold: p.quantitySold + qtySold };
                    }
                    return p;
                })
            };
        }
        return g;
    });

    const transaction = {
      id: Date.now().toString() + 't',
      date: new Date().toISOString(),
      type: 'INCOME' as const,
      category: 'VENTE' as const,
      amount: advance,
      description: `Encaissement Commande - ${advance === total ? 'Solde Total' : 'Avance'}`,
      referenceId: newOrder.id
    };

    // Update Client Spend
    const updatedClients = data.clients.map(c => 
        c.id === selectedClient ? { ...c, totalSpent: c.totalSpent + total } : c
    );

    setData(prev => ({ 
        ...prev, 
        orders: [newOrder, ...prev.orders], 
        groupages: updatedGroupages, 
        transactions: [transaction, ...prev.transactions],
        clients: updatedClients
    }));
    
    // Reset
    setView('list'); 
    setCart([]); 
    setSelectedClient(''); 
    setManualAdvanceAmount(null);
    setSelectedUnitState({});
    setSelectedGroupageFilter('');
  };

  const addToCart = (product: Product) => {
    let unitToUse = product.buyingUnit;
    let priceToUse = product.sellingPrice;

    // 1. Priorité: Sélection manuelle dans l'interface (clic sur un bouton d'unité)
    if (selectedUnitState[product.id]) {
        unitToUse = selectedUnitState[product.id].unit;
        priceToUse = selectedUnitState[product.id].price;
    } 
    // 2. Sinon: Unité par défaut définie dans le produit (isDefault: true)
    else if (product.sellingOptions && product.sellingOptions.length > 0) {
        const defaultOption = product.sellingOptions.find(o => o.isDefault) || product.sellingOptions[0];
        unitToUse = defaultOption.unit;
        priceToUse = defaultOption.price;
    }

    // Check duplicate
    const existingItemIndex = cart.findIndex(i => i.productId === product.id && i.unit === unitToUse);

    if (existingItemIndex >= 0) {
        const newCart = [...cart];
        newCart[existingItemIndex].quantity += 1;
        setCart(newCart);
    } else {
        setCart([...cart, { 
            productId: product.id, 
            quantity: 1, 
            unit: unitToUse, 
            unitPrice: priceToUse,
            tempId: Date.now().toString(),
            groupageId: product.groupageId
        }]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number) => {
      const newCart = [...cart];
      const newQty = newCart[index].quantity + delta;
      if (newQty > 0) {
          newCart[index].quantity = newQty;
          setCart(newCart);
      }
  };

  // Récupérer les produits en fonction du filtre de groupage
  const getAllAvailableProducts = () => {
      // 1. Filtrer les groupages si un filtre est actif
      const sourceGroupages = selectedGroupageFilter 
        ? data.groupages.filter(g => g.id === selectedGroupageFilter)
        : data.groupages;

      // 2. Extraire les produits
      return sourceGroupages
        .flatMap(g => g.products.map(p => ({ ...p, groupageName: g.name, groupageStatus: g.status })))
        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.groupageName.toLowerCase().includes(productSearch.toLowerCase()))
        .sort((a, b) => (b.quantityTotal - b.quantitySold) - (a.quantityTotal - a.quantitySold)); // Stock dispo en premier
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  
  // Si l'utilisateur n'a pas touché au champ, on propose le total (Solde immédiat) ou un acompte par défaut.
  const suggestedAmount = manualAdvanceAmount !== null ? manualAdvanceAmount : cartTotal;

  // Change status from PENDING to READY
  const validateOrder = (orderId: string) => {
      setData(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.READY } : o)
      }));
  };

  const handleSettleBalance = () => {
      if (!orderToPay) return;
      const amountToPay = orderToPay.balanceRemaining;
      const transaction = {
          id: Date.now().toString() + 't_settle',
          date: new Date().toISOString(),
          type: 'INCOME' as const,
          category: 'VENTE' as const,
          amount: amountToPay,
          description: `Solde Commande #${orderToPay.id.slice(-6)} (Paiement anticipé)`,
          referenceId: orderToPay.id
      };
      const updatedOrder: Order = {
          ...orderToPay,
          balanceRemaining: 0,
          paymentMethod: paymentMethod 
      };
      setData(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === orderToPay.id ? updatedOrder : o),
          transactions: [transaction, ...prev.transactions]
      }));
      setOrderToPay(null);
  };

  // --- RENDER ---

  if (view === 'create') {
      return (
        <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('list')} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-slate-600">
                    <ChevronLeft size={20}/>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Nouvelle Vente / Commande</h2>
                    <p className="text-sm text-slate-500">Vente directe de stock ou réservation groupage.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                
                {/* LEFT COLUMN: Configuration & Catalog */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    
                    {/* Top Bar: Configuration */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                        {/* Sélecteur Client */}
                        <div className="relative group">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Client</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500" size={18} />
                                <select 
                                    className="w-full pl-10 p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-500 focus:bg-white transition-colors cursor-pointer appearance-none font-medium text-sm"
                                    value={selectedClient} 
                                    onChange={e => setSelectedClient(e.target.value)}
                                >
                                    <option value="">-- Sélectionner Client --</option>
                                    {data.clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Sélecteur Groupage (Filtre) */}
                        <div className="relative group">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Groupage / Arrivage (Source)</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500" size={18} />
                                <select 
                                    className="w-full pl-10 p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-500 focus:bg-white transition-colors cursor-pointer appearance-none font-medium text-sm"
                                    value={selectedGroupageFilter} 
                                    onChange={e => setSelectedGroupageFilter(e.target.value)}
                                >
                                    <option value="">-- Tout le Stock (Multi-sources) --</option>
                                    {data.groupages.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} ({g.status})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-slate-300" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="Rechercher produit par nom..." 
                                    className="w-full pl-10 p-2.5 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-brand-200 border outline-none transition-colors"
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Scrollable Grid */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {getAllAvailableProducts().map(p => {
                                    const remaining = p.quantityTotal - p.quantitySold;
                                    // Déterminer l'unité active : Selection > Défaut > Première Option > Achat
                                    const defaultOption = p.sellingOptions?.find(o => o.isDefault) || p.sellingOptions?.[0];
                                    const activeUnit = selectedUnitState[p.id]?.unit || (defaultOption?.unit || p.buyingUnit);
                                    const activePrice = selectedUnitState[p.id]?.price || (defaultOption?.price || p.sellingPrice);
                                    
                                    return (
                                        <div key={p.id} className="border border-slate-100 rounded-xl p-3 hover:shadow-md transition-shadow group bg-white flex flex-col relative overflow-hidden">
                                            {/* Source Badge */}
                                            <div className="absolute top-0 left-0 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-br-lg font-bold z-10 opacity-70">
                                                {p.groupageName}
                                            </div>

                                            <div className="aspect-square bg-slate-50 rounded-lg mb-3 overflow-hidden relative">
                                                <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name}/>
                                                <div className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${remaining > 0 ? 'bg-white/90 text-slate-800' : 'bg-red-500 text-white'}`}>
                                                    {remaining > 0 ? `Stock: ${remaining}` : 'Épuisé'}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 leading-tight min-h-[2.5em]">{p.name}</h4>
                                            
                                            {/* Unit Selector */}
                                            {p.sellingOptions && p.sellingOptions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {p.sellingOptions.map((opt, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setSelectedUnitState(prev => ({...prev, [p.id]: {unit: opt.unit, price: opt.price}}))}
                                                            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${activeUnit === opt.unit ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            {opt.unit}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-auto pt-2 flex items-center justify-between">
                                                <span className="font-bold text-brand-600 text-sm">{activePrice.toLocaleString()} F</span>
                                                <button 
                                                    onClick={() => addToCart(p)}
                                                    disabled={remaining <= 0}
                                                    className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <PlusCircle size={18}/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {getAllAvailableProducts().length === 0 && (
                                    <div className="col-span-full text-center py-12 text-slate-400">
                                        <p>Aucun produit disponible dans ce groupage/recherche.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Cart & Summary */}
                <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col shrink-0 overflow-hidden h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingCart size={18}/> Panier</h3>
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">{cart.length} art.</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
                                <ShoppingCart size={40} />
                                <p className="text-sm">Votre panier est vide</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => {
                                // Retrouver le produit original pour le nom/image
                                const originGroupage = data.groupages.find(g => g.id === item.groupageId);
                                const product = originGroupage?.products.find(p => p.id === item.productId);
                                
                                return (
                                    <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
                                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
                                            <img src={product?.imageUrl} className="w-full h-full object-cover"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-xs truncate mb-1">{product?.name}</p>
                                            <p className="text-[10px] text-slate-400 mb-1">{originGroupage?.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{item.unitPrice.toLocaleString()} F / {item.unit}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center bg-white rounded border border-slate-200">
                                                    <button onClick={() => updateCartQuantity(idx, -1)} className="p-1 hover:bg-slate-100 text-slate-500"><Minus size={12}/></button>
                                                    <span className="text-xs font-bold px-2 w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateCartQuantity(idx, 1)} className="p-1 hover:bg-slate-100 text-slate-500"><Plus size={12}/></button>
                                                </div>
                                                <span className="font-bold text-slate-800 text-xs ml-auto">{(item.unitPrice * item.quantity).toLocaleString()} F</span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFromCart(idx)} className="absolute -top-1 -right-1 bg-white border border-slate-100 text-red-400 hover:text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                            <Trash2 size={12}/>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3">
                        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                            <p className="text-sm text-slate-500 font-bold uppercase">Total Commande</p>
                            <p className="text-2xl font-bold text-slate-900">{cartTotal.toLocaleString()} <span className="text-sm font-normal text-slate-500">F</span></p>
                        </div>

                        {/* PAIEMENT CONFIG */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 flex justify-between">
                                <span>Montant Versé (Acompte ou Solde)</span>
                                {manualAdvanceAmount === null && <span className="text-brand-500 cursor-pointer hover:underline" onClick={() => setManualAdvanceAmount(Math.round(cartTotal * 0.3))}>Mettre 30%</span>}
                            </label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
                                    value={suggestedAmount}
                                    onChange={e => {
                                        const val = Math.min(Number(e.target.value), cartTotal);
                                        setManualAdvanceAmount(val);
                                    }}
                                />
                                <span className="absolute right-3 top-3 text-slate-400 text-sm font-bold">FCFA</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium">
                                <span className={suggestedAmount >= cartTotal ? 'text-emerald-600' : 'text-amber-600'}>
                                    {suggestedAmount >= cartTotal ? 'Commande Soldée' : 'Paiement partiel (Avance)'}
                                </span>
                                <span className="text-slate-400">Reste: {(cartTotal - suggestedAmount).toLocaleString()} F</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateOrder}
                            disabled={!selectedClient || cart.length === 0}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            <Check size={18}/> Valider la Vente
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Historique Commandes</h2>
            <p className="text-sm text-slate-500">Suivi des achats et des livraisons clients</p>
        </div>
        <button onClick={() => setView('create')} className="btn btn-primary shadow-lg shadow-brand-200 flex items-center gap-2">
            <PlusCircle size={20} /> Nouvelle Commande
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {data.orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50"/>
                <p>Aucune commande enregistrée pour le moment.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                        <tr>
                            <th className="p-4 pl-6">Réf.</th>
                            <th className="p-4">Client</th>
                            <th className="p-4">Origine</th>
                            <th className="p-4 text-right">Montant Total</th>
                            <th className="p-4 text-right">Reste à Payer</th>
                            <th className="p-4 text-center">Statut</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.orders.map(o => {
                            const client = data.clients.find(c => c.id === o.clientId);
                            // Pour l'origine, si groupageId existe, on l'affiche, sinon "Multi"
                            const groupageName = o.groupageId 
                                ? data.groupages.find(g => g.id === o.groupageId)?.name 
                                : 'Stock / Multi';
                            
                            return (
                                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 pl-6 font-mono text-xs text-slate-500">#{o.id.slice(-6)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-100">
                                                {client?.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{client?.name}</p>
                                                <p className="text-[10px] text-slate-400">{client?.city}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{groupageName}</span>
                                    </td>
                                    <td className="p-4 text-right font-medium">{o.totalAmount.toLocaleString()} F</td>
                                    <td className="p-4 text-right">
                                        <span className={`font-bold px-2 py-1 rounded-md text-xs ${o.balanceRemaining > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                            {o.balanceRemaining.toLocaleString()} F
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                                            ${o.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700' : 
                                              o.status === OrderStatus.READY ? 'bg-blue-100 text-blue-700' : 
                                              o.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
                                        `}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${o.status === OrderStatus.DELIVERED ? 'bg-emerald-500' : o.status === OrderStatus.READY ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {o.status === OrderStatus.PENDING && (
                                            <button 
                                                onClick={() => validateOrder(o.id)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <Check size={14}/> Valider
                                            </button>
                                        )}
                                        {o.status === OrderStatus.READY && (
                                            <div className="flex gap-2 justify-center">
                                                {o.balanceRemaining > 0 && (
                                                    <button 
                                                        onClick={() => setOrderToPay(o)} 
                                                        className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm"
                                                        title="Solder le paiement sans livrer"
                                                    >
                                                        <Wallet size={14}/> Encaisser
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => onNavigateToDelivery(o.id)} 
                                                    className="inline-flex items-center gap-1 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
                                                    title="Envoyer en livraison"
                                                >
                                                    <Send size={14}/> Expédier
                                                </button>
                                            </div>
                                        )}
                                        {o.status === OrderStatus.DELIVERED && (
                                            <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition-colors" title="Imprimer reçu">
                                                <Printer size={16}/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* MODAL PAIEMENT ANTICIPÉ (Solde) */}
      {orderToPay && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">Encaissement Solde</h3>
                        <p className="text-xs text-slate-500">Commande #{orderToPay.id.slice(-6)}</p>
                      </div>
                      <button onClick={() => setOrderToPay(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><Trash2 size={18}/></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                          <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Montant à Encaisser</p>
                          <p className="text-3xl font-bold text-slate-900">{orderToPay.balanceRemaining.toLocaleString()} FCFA</p>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Mode de Paiement</label>
                          <div className="grid grid-cols-2 gap-3">
                              {['Espèces', 'Mobile Money', 'Virement', 'Chèque'].map(method => (
                                  <button
                                      key={method}
                                      onClick={() => setPaymentMethod(method)}
                                      className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 justify-center transition-all ${
                                          paymentMethod === method 
                                          ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                      }`}
                                  >
                                      {method === 'Espèces' && <Banknote size={16}/>}
                                      {method === 'Mobile Money' && <Smartphone size={16}/>}
                                      {method === 'Virement' && <Landmark size={16}/>}
                                      {method === 'Chèque' && <CreditCard size={16}/>}
                                      {method}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-2">
                          <AlertCircle size={14} className="mt-0.5 text-slate-400"/>
                          La commande restera au statut "Prêt à livrer", mais la dette client sera effacée.
                      </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                      <button onClick={() => setOrderToPay(null)} className="px-5 py-2.5 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
                      <button 
                        onClick={handleSettleBalance}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
                      >
                          <Check size={18} /> Confirmer le Paiement
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};