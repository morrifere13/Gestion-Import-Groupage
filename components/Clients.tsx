
import React, { useState } from 'react';
import { AppData, Client, OrderStatus } from '../types';
import { Plus, Search, Phone, MapPin, MessageCircle, Edit2, Trash2, ChevronLeft, ChevronRight, User, X, Save, AlertCircle, Map, Home, Eye, Package, Calendar, CheckCircle, Clock } from 'lucide-react';

interface ClientsProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const ITEMS_PER_PAGE = 10;

export const Clients: React.FC<ClientsProps> = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [viewHistoryClient, setViewHistoryClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<{ id?: string; name: string; phone: string; whatsapp: string; city: string; address: string; }>({ name: '', phone: '', whatsapp: '', city: '', address: '' });

  const handleSave = () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim()) { setError('Le nom et le numéro de téléphone sont obligatoires.'); return; }
    
    // Check duplicate phone
    if (data.clients.find(c => c.phone === form.phone && c.id !== form.id)) { 
        setError('Ce numéro de téléphone est déjà associé à un autre client.'); 
        return; 
    }

    const newClient: Client = {
      id: form.id || Date.now().toString(),
      name: form.name,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone, // Par défaut whatsapp = téléphone
      city: form.city || 'Non renseigné',
      address: form.address || '',
      totalSpent: form.id ? (data.clients.find(c => c.id === form.id)?.totalSpent || 0) : 0
    };

    if (form.id) {
      setData(prev => ({ ...prev, clients: prev.clients.map(c => c.id === form.id ? newClient : c) }));
    } else {
      setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
    }
    setIsCreating(false); setForm({ name: '', phone: '', whatsapp: '', city: '', address: '' });
  };

  const handleDelete = (id: string) => {
    if (data.orders.some(o => o.clientId === id)) { 
        alert("Impossible de supprimer ce client car il possède un historique de commandes. Archivez-le plutôt."); 
        return; 
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce client ?')) {
      setData(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
      if (currentItems.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
    }
  };

  const filtered = data.clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));
  
  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // Helpers for History View
  const getClientOrders = (clientId: string) => {
      return data.orders
        .filter(o => o.clientId === clientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Répertoire Clients</h2>
            <p className="text-sm text-slate-500">Gérez vos contacts et leur historique d'achat ({data.clients.length} clients)</p>
        </div>
        <button 
            onClick={() => { setForm({name:'', phone:'', whatsapp:'', city:'', address: ''}); setIsCreating(true); setError(''); }} 
            className="btn btn-primary flex items-center gap-2 shadow-lg shadow-brand-200 hover:scale-105 transition-transform"
        >
            <Plus size={18}/> Nouveau Client
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <Search className="ml-2 text-slate-400" size={20} />
        <input 
            type="text" 
            placeholder="Rechercher par nom ou téléphone..." 
            className="w-full p-2 bg-transparent outline-none text-slate-700 placeholder-slate-400" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-xs font-semibold">
              <tr>
                  <th className="p-4 pl-6">Nom du Client</th>
                  <th className="p-4">Contacts</th>
                  <th className="p-4">Localisation</th>
                  <th className="p-4 text-right">Volume d'Achat</th>
                  <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg border border-brand-100">
                              {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{c.name}</span>
                      </div>
                  </td>
                  <td className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-100 w-fit px-2 py-0.5 rounded text-xs"><Phone size={12}/> {c.phone}</div>
                      {c.whatsapp && <div className="flex items-center gap-2 text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded text-xs border border-emerald-100"><MessageCircle size={12}/> {c.whatsapp}</div>}
                  </td>
                  <td className="p-4 text-slate-600">
                      <div className="space-y-1">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> {c.city}</span>
                          {c.address && <span className="text-xs text-slate-400 block pl-5">{c.address}</span>}
                      </div>
                  </td>
                  <td className="p-4 text-right">
                      <span className="font-bold text-slate-800 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">{c.totalSpent.toLocaleString()} F</span>
                  </td>
                  <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewHistoryClient(c)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Historique Commandes"><Eye size={16}/></button>
                        <button onClick={() => { setForm({id:c.id, name:c.name, phone:c.phone, whatsapp:c.whatsapp||'', city:c.city, address: c.address || ''}); setIsCreating(true); setError(''); }} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16}/></button>
                      </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center">
                              <Search size={32} className="mb-2 opacity-50"/>
                              <p>Aucun client trouvé pour cette recherche.</p>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
        </table>
        
        {totalPages > 1 && (
            <div className="flex items-center justify-center p-4 border-t border-slate-100 gap-4">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 text-slate-500 transition-colors"><ChevronLeft size={20}/></button>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 text-slate-500 transition-colors"><ChevronRight size={20}/></button>
            </div>
        )}
      </div>

      {/* MODAL FORMULAIRE CLIENT PRO */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                 <h3 className="font-bold text-xl text-slate-800">{form.id ? 'Modifier la fiche client' : 'Nouveau Client'}</h3>
                 <p className="text-xs text-slate-500 mt-0.5">Saisissez les coordonnées pour la facturation et la livraison.</p>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={20}/></button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6 bg-slate-50/50">
                {error && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5"/>
                        <p>{error}</p>
                    </div>
                )}

                {/* Section Identité */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Identité</label>
                    <div className="relative group">
                        <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input 
                            className="w-full pl-10 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium text-slate-800"
                            placeholder="Nom Complet *" 
                            value={form.name} 
                            onChange={e => setForm({...form, name:e.target.value})} 
                            autoFocus
                        />
                    </div>
                </div>

                {/* Section Contact */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Coordonnées</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <Phone className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input 
                                className="w-full pl-10 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all text-sm"
                                placeholder="Téléphone *" 
                                value={form.phone} 
                                onChange={e => setForm({...form, phone:e.target.value})} 
                            />
                        </div>
                        <div className="relative group">
                            <MessageCircle className="absolute left-3 top-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input 
                                className="w-full pl-10 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-sm"
                                placeholder="WhatsApp (Optionnel)" 
                                value={form.whatsapp} 
                                onChange={e => setForm({...form, whatsapp:e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                {/* Section Localisation */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Localisation</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative group">
                            <Map className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input 
                                className="w-full pl-10 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all text-sm"
                                placeholder="Ville" 
                                value={form.city} 
                                onChange={e => setForm({...form, city:e.target.value})} 
                            />
                        </div>
                        <div className="relative group">
                            <Home className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input 
                                className="w-full pl-10 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all text-sm"
                                placeholder="Adresse / Quartier" 
                                value={form.address} 
                                onChange={e => setForm({...form, address:e.target.value})} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button onClick={() => setIsCreating(false)} className="px-5 py-2.5 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
                <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                    <Save size={18} /> Enregistrer le client
                </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE COMMANDES */}
      {viewHistoryClient && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                                {viewHistoryClient.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{viewHistoryClient.name}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-2"><Phone size={12}/> {viewHistoryClient.phone} <span className="text-slate-300">|</span> <MapPin size={12}/> {viewHistoryClient.city}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setViewHistoryClient(null)} className="p-2 bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Historique Multi-Groupage</h4>
                    {getClientOrders(viewHistoryClient.id).length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                            <Package size={40} className="mx-auto text-slate-300 mb-2"/>
                            <p className="text-slate-500">Aucune commande trouvée pour ce client.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {getClientOrders(viewHistoryClient.id).map(order => {
                                const groupage = data.groupages.find(g => g.id === order.groupageId);
                                const isPaid = order.balanceRemaining <= 0;
                                
                                return (
                                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-300 transition-colors shadow-sm">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">#{order.id.slice(-6)}</span>
                                                    <span className="flex items-center gap-1 text-xs text-slate-400"><Calendar size={12}/> {order.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Package size={16} className="text-brand-500"/>
                                                    <span className="font-bold text-slate-800 text-lg">{groupage?.name || 'Groupage inconnu'}</span>
                                                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100 font-medium">
                                                        {groupage?.originCountry}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Montant Total</div>
                                                <div className="font-bold text-xl text-slate-900">{order.totalAmount.toLocaleString()} F</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Articles</p>
                                                <ul className="text-xs text-slate-700 space-y-1">
                                                    {order.items.map((item, i) => {
                                                        const prod = groupage?.products.find(p => p.id === item.productId);
                                                        return <li key={i} className="flex justify-between"><span>{prod?.name}</span> <span className="font-bold">x{item.quantity}</span></li>
                                                    })}
                                                </ul>
                                            </div>
                                            <div className={`p-3 rounded-lg border ${isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                                <p className={`text-[10px] uppercase font-bold mb-1 ${isPaid ? 'text-emerald-500' : 'text-red-400'}`}>Paiement</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-600">Avance: {order.advancePaid.toLocaleString()}</span>
                                                    <span className={`font-bold ${isPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        Reste: {order.balanceRemaining.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center p-3">
                                                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                                                     order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700' :
                                                     order.status === OrderStatus.READY ? 'bg-blue-100 text-blue-700' :
                                                     'bg-amber-100 text-amber-700'
                                                 }`}>
                                                     {order.status === OrderStatus.DELIVERED ? <CheckCircle size={14}/> : <Clock size={14}/>}
                                                     {order.status}
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                    <button onClick={() => setViewHistoryClient(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors">Fermer</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
