
import React, { useState, useEffect } from 'react';
import { AppData, Order, OrderStatus } from '../types';
import { Truck, MapPin, Phone, CheckCircle, Search, Printer, X, Banknote, Calendar, Package, User, Save, AlertCircle, Car, Edit2, Plus, ChevronRight, ShoppingBag } from 'lucide-react';

interface DeliveriesProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  preselectedOrderId?: string | null;
  clearPreselection?: () => void;
}

export const Deliveries: React.FC<DeliveriesProps> = ({ data, setData, preselectedOrderId, clearPreselection }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals States
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<Order | null>(null);
  const [deliveryFormOrder, setDeliveryFormOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  
  const [deliveryForm, setDeliveryForm] = useState<{
      driver: string;
      driverPhone: string;
      vehicle: string;
      deliveryAddress: string;
      note: string;
      collectPayment: boolean;
      paymentMethod: string;
      deliveryDate: string;
      deliveryFee: number;
  }>({ 
      driver: '', 
      driverPhone: '',
      vehicle: '',
      deliveryAddress: '',
      note: '', 
      collectPayment: true,
      paymentMethod: 'Espèces',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryFee: 0
  });

  const getClient = (id: string) => data.clients.find(c => c.id === id);
  const getGroupage = (id: string) => data.groupages.find(g => g.id === id);
  const getProduct = (id: string, groupageId: string) => {
      const groupage = getGroupage(groupageId);
      return groupage?.products.find(p => p.id === id);
  };

  // Auto-open form if preselectedOrderId is provided
  useEffect(() => {
    if (preselectedOrderId) {
        const order = data.orders.find(o => o.id === preselectedOrderId);
        if (order) {
            openDeliveryForm(order);
        }
        if (clearPreselection) clearPreselection();
    }
  }, [preselectedOrderId, data.orders]);

  // Filtrer les commandes concernées
  const pendingDeliveries = data.orders.filter(o => o.status === OrderStatus.READY);
  const historyDeliveries = data.orders.filter(o => o.status === OrderStatus.DELIVERED);

  const displayedOrders = (activeTab === 'pending' ? pendingDeliveries : historyDeliveries).filter(o => {
    const client = data.clients.find(c => c.id === o.clientId);
    return client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           client?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
           o.id.includes(searchTerm);
  });

  const openDeliveryForm = (order: Order) => {
      setError('');
      setDeliveryFormOrder(order);
      const client = getClient(order.clientId);
      setDeliveryForm({
          driver: order.deliveryDriver || '',
          driverPhone: '',
          vehicle: '',
          deliveryAddress: client?.address || '',
          note: order.deliveryNote || '',
          collectPayment: order.balanceRemaining > 0,
          paymentMethod: 'Espèces',
          deliveryDate: new Date().toISOString().split('T')[0],
          deliveryFee: order.deliveryFee || 0
      });
      setShowSelectionModal(false); // Close selection modal if open
  };

  const handleProcessDelivery = () => {
    if (!deliveryFormOrder) return;
    setError('');

    // Validation : Le chauffeur est obligatoire si on encaisse de l'argent
    if (deliveryForm.collectPayment && (deliveryFormOrder.balanceRemaining > 0 || deliveryForm.deliveryFee > 0) && !deliveryForm.driver.trim()) {
        setError("Le nom du livreur est obligatoire pour valider l'encaissement.");
        return;
    }

    const updatedOrder: Order = {
        ...deliveryFormOrder,
        status: OrderStatus.DELIVERED,
        deliveryDriver: deliveryForm.driver || 'Non assigné',
        deliveryNote: `${deliveryForm.note} [Livreur: ${deliveryForm.driverPhone}, Vehicule: ${deliveryForm.vehicle}]`,
        balanceRemaining: deliveryForm.collectPayment ? 0 : deliveryFormOrder.balanceRemaining,
        isDeliveryPaid: deliveryForm.collectPayment ? true : deliveryFormOrder.isDeliveryPaid,
        deliveryDate: deliveryForm.deliveryDate,
        paymentMethod: deliveryForm.collectPayment ? deliveryForm.paymentMethod : undefined,
        deliveryFee: deliveryForm.deliveryFee // Sauvegarde du frais de livraison appliqué
    };

    const newTransactions = [];
    const clientName = data.clients.find(c => c.id === updatedOrder.clientId)?.name || 'Client';

    // 1. Transaction pour le SOLDE MARCHANDISE (Catégorie VENTE)
    if (deliveryForm.collectPayment && deliveryFormOrder.balanceRemaining > 0) {
        newTransactions.push({
            id: Date.now().toString() + 't1',
            date: new Date().toISOString(),
            type: 'INCOME' as const,
            category: 'VENTE' as const,
            amount: deliveryFormOrder.balanceRemaining,
            description: `Solde Commande #${updatedOrder.id.slice(-6)} - ${clientName}`,
            referenceId: updatedOrder.id
        });
    }

    // 2. Transaction pour le SERVICE LIVRAISON (Catégorie TRANSPORT/AUTRE)
    if (deliveryForm.collectPayment && deliveryForm.deliveryFee > 0) {
        newTransactions.push({
            id: Date.now().toString() + 't2',
            date: new Date().toISOString(),
            type: 'INCOME' as const,
            category: 'TRANSPORT' as const, // Utilisation de TRANSPORT pour marquer le service de livraison
            amount: deliveryForm.deliveryFee,
            description: `Service Livraison - Commande #${updatedOrder.id.slice(-6)}`,
            referenceId: updatedOrder.id
        });
    }

    setData(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
        transactions: [...newTransactions, ...prev.transactions]
    }));

    setDeliveryFormOrder(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Livraisons</h2>
          <p className="text-sm text-slate-500">Gérez les expéditions, les tournées et les bons de livraison.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
             <button 
                onClick={() => setShowSelectionModal(true)}
                className="btn btn-primary shadow-lg shadow-brand-200 flex items-center gap-2"
            >
                <Plus size={20} /> Nouvelle Livraison
            </button>

            <div className="flex gap-4">
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Truck size={20}/></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">À Livrer</p>
                        <p className="text-xl font-bold text-slate-800">{pendingDeliveries.length}</p>
                    </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={20}/></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Livrées</p>
                        <p className="text-xl font-bold text-slate-800">{historyDeliveries.length}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
         <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button 
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                À préparer / En cours
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Historique
            </button>
         </div>

         <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18}/>
            <input 
                type="text" 
                placeholder="Rechercher (Client, Ville...)" 
                className="w-full pl-10 p-2.5 rounded-xl bg-transparent outline-none text-slate-700 placeholder-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Delivery Cards Grid */}
      {displayedOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <Truck size={48} className="mx-auto mb-4 opacity-50"/>
              <p>Aucune livraison {activeTab === 'pending' ? 'en attente' : 'dans l\'historique'}.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedOrders.map(order => {
                  const client = getClient(order.clientId);
                  const isPending = order.status === OrderStatus.READY;
                  
                  return (
                      <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-lg transition-all hover:-translate-y-1">
                          {/* Card Header */}
                          <div className={`px-5 py-4 border-b border-slate-100 flex justify-between items-start ${isPending ? 'bg-blue-50/30' : 'bg-slate-50'}`}>
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-mono text-xs text-slate-400">#{order.id.slice(-6)}</span>
                                      <span className="text-xs font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">{order.date}</span>
                                  </div>
                                  <h3 className="font-bold text-slate-800 text-lg">{client?.name}</h3>
                              </div>
                              <div className="text-right">
                                  {order.balanceRemaining > 0 ? (
                                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                                          <Banknote size={16}/>
                                          <span className="font-bold text-sm">{order.balanceRemaining.toLocaleString()} F</span>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                          <CheckCircle size={16}/>
                                          <span className="font-bold text-sm">Payé</span>
                                      </div>
                                  )}
                                  {order.balanceRemaining > 0 && <p className="text-[10px] text-red-400 mt-1 font-medium uppercase">À encaisser</p>}
                              </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-5 space-y-4 flex-1">
                              {/* Location & Contact */}
                              <div className="space-y-2">
                                  <div className="flex items-start gap-3">
                                      <div className="p-1.5 bg-slate-100 rounded text-slate-500 mt-0.5"><MapPin size={14}/></div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-700">{client?.city}</p>
                                          <p className="text-xs text-slate-500">{client?.address || "Adresse non spécifiée"}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="p-1.5 bg-slate-100 rounded text-slate-500"><Phone size={14}/></div>
                                      <p className="text-sm font-medium text-slate-600">{client?.phone}</p>
                                  </div>
                              </div>

                              {/* Items Summary */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Contenu du colis</p>
                                  <ul className="space-y-1">
                                      {order.items.slice(0, 3).map((item, idx) => {
                                          const product = getProduct(item.productId, order.groupageId);
                                          return (
                                              <li key={idx} className="text-xs text-slate-700 flex justify-between">
                                                  <span className="truncate pr-2">• {product?.name || 'Produit'}</span>
                                                  <span className="font-bold text-slate-900 shrink-0">x{item.quantity}</span>
                                              </li>
                                          );
                                      })}
                                      {order.items.length > 3 && (
                                          <li className="text-[10px] text-slate-400 italic pl-2">+ {order.items.length - 3} autres articles...</li>
                                      )}
                                  </ul>
                              </div>
                              
                              {/* Driver Info if Delivered */}
                              {!isPending && (
                                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
                                      <div>
                                        <div className="flex items-center gap-1"><Truck size={12}/> Livré par: <span className="font-bold">{order.deliveryDriver}</span></div>
                                      </div>
                                      {order.deliveryFee && order.deliveryFee > 0 && (
                                         <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">Course: {order.deliveryFee} F</span>
                                      )}
                                  </div>
                              )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                              <button 
                                onClick={() => setSelectedOrderForSlip(order)}
                                className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                              >
                                  <Printer size={16}/> Bon
                              </button>
                              
                              {isPending && (
                                  <button 
                                    onClick={() => openDeliveryForm(order)}
                                    className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-brand-600 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                  >
                                      <Truck size={16}/> Livrer
                                  </button>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      )}

      {/* MODAL SELECTION RAPIDE (NOUVELLE LIVRAISON) */}
      {showSelectionModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-lg text-slate-800">Sélectionner une commande</h3>
                     <button onClick={() => setShowSelectionModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20}/></button>
                 </div>
                 <div className="max-h-[60vh] overflow-y-auto p-2">
                     {pendingDeliveries.length === 0 ? (
                         <div className="p-8 text-center text-slate-400">
                             <Package size={32} className="mx-auto mb-2 opacity-50"/>
                             <p className="text-sm">Aucune commande en attente de livraison.</p>
                             <p className="text-xs mt-1">Validez d'abord les commandes dans l'onglet "Commandes".</p>
                         </div>
                     ) : (
                         <div className="space-y-2">
                             {pendingDeliveries.map(order => {
                                 const client = getClient(order.clientId);
                                 return (
                                     <div 
                                        key={order.id} 
                                        onClick={() => openDeliveryForm(order)}
                                        className="flex justify-between items-center p-4 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50 cursor-pointer transition-all group"
                                     >
                                         <div>
                                             <p className="font-bold text-slate-800">{client?.name}</p>
                                             <div className="flex items-center gap-2 text-xs text-slate-500">
                                                 <span><MapPin size={12} className="inline mr-1"/>{client?.city}</span>
                                                 <span>•</span>
                                                 <span>Commande #{order.id.slice(-6)}</span>
                                             </div>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             {order.balanceRemaining > 0 ? (
                                                 <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">{order.balanceRemaining.toLocaleString()} F à payer</span>
                                             ) : (
                                                 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Payé</span>
                                             )}
                                             <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-600"/>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     )}
                 </div>
             </div>
          </div>
      )}

      {/* FORMULAIRE DE LIVRAISON (MODAL) */}
      {deliveryFormOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                      <div>
                          <h3 className="font-bold text-xl text-slate-800">Détails de la Livraison</h3>
                          <p className="text-xs text-slate-500">Commande #{deliveryFormOrder.id.slice(-6)}</p>
                      </div>
                      <button onClick={() => setDeliveryFormOrder(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
                      
                      {error && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                            <AlertCircle size={18} className="shrink-0 mt-0.5"/>
                            <p>{error}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           
                           {/* SECTION 1: CLIENT & LIEU */}
                           <div className="space-y-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><User size={20}/></div>
                                        <h4 className="font-bold text-slate-800">Client & Destinataire</h4>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Nom du Client</label>
                                            <p className="text-sm font-bold text-slate-900">{getClient(deliveryFormOrder.clientId)?.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Lieu de Livraison <span className="text-brand-500">*</span></label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-9 p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm focus:border-brand-500 transition-colors"
                                                    value={deliveryForm.deliveryAddress}
                                                    onChange={(e) => setDeliveryForm(prev => ({...prev, deliveryAddress: e.target.value}))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Téléphone Contact</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-9 p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm focus:border-brand-500 transition-colors"
                                                    value={getClient(deliveryFormOrder.clientId)?.phone}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ShoppingBag size={20}/></div>
                                        <h4 className="font-bold text-slate-800">Produits à Livrer</h4>
                                    </div>
                                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {deliveryFormOrder.items.map((item, idx) => {
                                            const product = getProduct(item.productId, deliveryFormOrder.groupageId);
                                            return (
                                                <li key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                    <span className="font-medium text-slate-700 truncate pr-2">{product?.name}</span>
                                                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">x{item.quantity}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                           </div>

                           {/* SECTION 2: LOGISTIQUE & PRIX */}
                           <div className="space-y-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Truck size={20}/></div>
                                        <h4 className="font-bold text-slate-800">Logistique</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Date Livraison</label>
                                            <input 
                                                type="date" 
                                                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm"
                                                value={deliveryForm.deliveryDate}
                                                onChange={(e) => setDeliveryForm(prev => ({...prev, deliveryDate: e.target.value}))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Livreur</label>
                                            <input 
                                                type="text" 
                                                placeholder="Nom"
                                                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm"
                                                value={deliveryForm.driver}
                                                onChange={(e) => setDeliveryForm(prev => ({...prev, driver: e.target.value}))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Note / Instruction</label>
                                        <textarea 
                                            className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm resize-none h-20"
                                            placeholder="Ex: Appeler à l'arrivée..."
                                            value={deliveryForm.note}
                                            onChange={(e) => setDeliveryForm(prev => ({...prev, note: e.target.value}))}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Banknote size={20}/></div>
                                        <h4 className="font-bold text-slate-800">Finance</h4>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                            <span className="text-slate-500 font-medium">Solde Marchandise</span>
                                            <span className="font-bold text-slate-900">{deliveryFormOrder.balanceRemaining.toLocaleString()} F</span>
                                        </div>
                                        
                                        <div className="p-2 border border-brand-100 bg-brand-50/50 rounded-lg">
                                            <label className="text-[10px] uppercase font-bold text-brand-600 mb-1 block">Frais de Service (Livraison)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-brand-500 text-xs font-bold">FCFA</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full pl-12 p-2 rounded-lg bg-white border border-brand-200 outline-none text-sm font-bold text-brand-700 focus:ring-2 focus:ring-brand-200"
                                                    placeholder="0"
                                                    value={deliveryForm.deliveryFee || ''}
                                                    onChange={(e) => setDeliveryForm(prev => ({...prev, deliveryFee: Number(e.target.value)}))}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                            <span className="font-bold text-slate-700">Total à Encaisser</span>
                                            <span className="font-bold text-xl text-slate-900">{(deliveryFormOrder.balanceRemaining + (deliveryForm.deliveryFee || 0)).toLocaleString()} F</span>
                                        </div>
                                        
                                        {/* Checkbox Encaissement */}
                                        <label className="flex items-center gap-2 cursor-pointer mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                                                checked={deliveryForm.collectPayment}
                                                onChange={(e) => setDeliveryForm(prev => ({...prev, collectPayment: e.target.checked}))}
                                            />
                                            <span className="text-sm font-medium text-slate-700">Confirmer l'encaissement</span>
                                        </label>
                                    </div>
                                </div>
                           </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                      <button onClick={() => setDeliveryFormOrder(null)} className="px-5 py-2.5 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
                      <button 
                        onClick={handleProcessDelivery}
                        className="px-8 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-brand-600 shadow-lg shadow-slate-200 transition-all transform active:scale-95 flex items-center gap-2"
                      >
                          <CheckCircle size={18} /> Valider la Livraison
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL BON DE LIVRAISON (Print Slip) */}
      {selectedOrderForSlip && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center print:hidden">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Printer size={20}/> Aperçu Bon de Livraison</h3>
                      <button onClick={() => setSelectedOrderForSlip(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                  </div>

                  <div className="p-8 print:p-0" id="delivery-slip">
                      {/* En-tête Bon */}
                      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-100">
                          <div>
                              <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Import Pro</h1>
                              <p className="text-sm text-slate-500">Service Logistique & Groupage</p>
                              <p className="text-sm text-slate-500">Niamey, Niger</p>
                              <p className="text-sm text-slate-500">Tel: +227 90 00 00 00</p>
                          </div>
                          <div className="text-right">
                              <h2 className="text-xl font-bold text-slate-800 mb-1">BON DE LIVRAISON</h2>
                              <p className="font-mono text-slate-500">#{selectedOrderForSlip.id}</p>
                              <p className="text-sm text-slate-600 mt-2">Date: {new Date().toLocaleDateString()}</p>
                          </div>
                      </div>

                      {/* Info Client & Livraison */}
                      <div className="grid grid-cols-2 gap-8 mb-8">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Destinataire</p>
                              <p className="font-bold text-lg text-slate-800">{getClient(selectedOrderForSlip.clientId)?.name}</p>
                              <p className="text-slate-600">{getClient(selectedOrderForSlip.clientId)?.phone}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Lieu de Livraison</p>
                              <p className="font-medium text-slate-800 flex items-center gap-2"><MapPin size={16}/> {getClient(selectedOrderForSlip.clientId)?.city}</p>
                              <p className="text-sm text-slate-600 mt-1">{getClient(selectedOrderForSlip.clientId)?.address}</p>
                          </div>
                      </div>

                      {/* Tableau Articles */}
                      <table className="w-full mb-8">
                          <thead>
                              <tr className="border-b-2 border-slate-800">
                                  <th className="text-left py-3 font-bold text-slate-800">Désignation</th>
                                  <th className="text-right py-3 font-bold text-slate-800">Qté</th>
                                  <th className="text-right py-3 font-bold text-slate-800">Prix Unit.</th>
                                  <th className="text-right py-3 font-bold text-slate-800">Total</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {selectedOrderForSlip.items.map((item, idx) => {
                                  const product = getProduct(item.productId, selectedOrderForSlip.groupageId);
                                  return (
                                      <tr key={idx}>
                                          <td className="py-3 text-slate-700">{product?.name}</td>
                                          <td className="py-3 text-right text-slate-700">{item.quantity} {item.unit}</td>
                                          <td className="py-3 text-right text-slate-700">{item.unitPrice.toLocaleString()}</td>
                                          <td className="py-3 text-right font-bold text-slate-800">{(item.quantity * item.unitPrice).toLocaleString()}</td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>

                      {/* Totaux & Finance */}
                      <div className="flex justify-end mb-8">
                          <div className="w-72 space-y-4">
                              {/* Sous-total Marchandise */}
                              <div className="space-y-2 border-b border-slate-100 pb-2">
                                  <div className="flex justify-between text-slate-600 text-sm">
                                      <span>Total Marchandise</span>
                                      <span>{selectedOrderForSlip.totalAmount.toLocaleString()} F</span>
                                  </div>
                                  <div className="flex justify-between text-slate-600 text-sm">
                                      <span>Avance payée</span>
                                      <span>- {selectedOrderForSlip.advancePaid.toLocaleString()} F</span>
                                  </div>
                                  <div className="flex justify-between items-center text-slate-900 font-bold">
                                      <span>Reste Marchandise</span>
                                      <span>{selectedOrderForSlip.balanceRemaining.toLocaleString()} F</span>
                                  </div>
                              </div>

                              {/* Section Service Livraison Distinguée */}
                              {selectedOrderForSlip.deliveryFee && selectedOrderForSlip.deliveryFee > 0 && (
                                  <div className="space-y-2 border-b border-slate-100 pb-2 bg-slate-50 p-2 rounded">
                                      <div className="flex justify-between items-center text-slate-800">
                                          <span className="text-sm font-bold flex items-center gap-1"><Truck size={14}/> Service Livraison</span>
                                          <span className="font-bold">{selectedOrderForSlip.deliveryFee.toLocaleString()} F</span>
                                      </div>
                                  </div>
                              )}

                              {/* Grand Total */}
                              <div className="flex justify-between items-center py-3 border-t-2 border-slate-800 mt-2">
                                  <span className="font-bold text-slate-900 uppercase text-lg">Net à Payer</span>
                                  <span className="font-bold text-2xl text-slate-900">
                                    {(selectedOrderForSlip.balanceRemaining + (selectedOrderForSlip.deliveryFee || 0)).toLocaleString()} F
                                  </span>
                              </div>
                          </div>
                      </div>

                      {/* Signature */}
                      <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-100">
                          <div className="text-center">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-8">Signature Livreur</p>
                              <div className="h-0.5 w-32 bg-slate-200 mx-auto"></div>
                              {selectedOrderForSlip.deliveryDriver && <p className="text-xs text-slate-500 mt-2">{selectedOrderForSlip.deliveryDriver}</p>}
                          </div>
                          <div className="text-center">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-8">Signature Client</p>
                              <div className="h-0.5 w-32 bg-slate-200 mx-auto"></div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 print:hidden">
                      <button onClick={() => setSelectedOrderForSlip(null)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-white rounded-lg transition-colors">Fermer</button>
                      <button onClick={() => window.print()} className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-lg shadow-lg hover:bg-brand-700 transition-colors flex items-center gap-2">
                          <Printer size={18}/> Imprimer
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
