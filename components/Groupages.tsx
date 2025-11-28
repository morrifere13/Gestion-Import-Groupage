
import React, { useState, useEffect } from 'react';
import { AppData, Groupage, GroupageStatus, Product, SellingOption, Article } from '../types';
import { Plus, Edit2, Trash2, Upload, MapPin, Plane, Ship, Truck, X, Save, Library, TrendingUp, DollarSign, ChevronLeft, ChevronRight, Calendar, Package, Image as ImageIcon, Link as LinkIcon, Star, Search, Filter, Wallet, Landmark, Coins } from 'lucide-react';

interface GroupagesProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const ITEMS_PER_PAGE = 6;

// --- COMPOSANT FORMULAIRE EXTRAIT (Pour éviter la perte de focus) ---
interface ProductFormProps {
    form: {
        name: string;
        buyingPrice: number;
        buyingUnit: string;
        quantityTotal: number;
        imageUrl: string;
        sellingOptions: SellingOption[];
        transportFee?: number;
        customsFee?: number;
    };
    setForm: React.Dispatch<React.SetStateAction<{
        name: string;
        buyingPrice: number;
        buyingUnit: string;
        quantityTotal: number;
        imageUrl: string;
        sellingOptions: SellingOption[];
        transportFee?: number;
        customsFee?: number;
    }>>;
    errors: {
        name?: boolean;
        buyingPrice?: boolean;
        buyingUnit?: boolean;
        quantity?: boolean;
        sellingOptions?: boolean;
    };
    setErrors: React.Dispatch<React.SetStateAction<any>>;
    articles: Article[];
    isStandalone?: boolean;
}

const ProductFormFields: React.FC<ProductFormProps> = ({ form, setForm, errors, setErrors, articles, isStandalone = false }) => {
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') setForm(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const selectArticleForForm = (articleId: string) => {
        const article = articles.find(a => a.id === articleId);
        if (article) {
            setForm(prev => ({
                ...prev,
                name: article.name,
                imageUrl: article.imageUrl || prev.imageUrl,
            }));
            setErrors((prev: any) => ({...prev, name: false}));
        }
    };

    const addSellingOption = () => {
        setForm(prev => ({ ...prev, sellingOptions: [...prev.sellingOptions, { unit: '', price: 0, isDefault: false }] }));
    };

    const removeSellingOption = (index: number) => {
        if (form.sellingOptions.length > 1) {
            const newOptions = form.sellingOptions.filter((_, i) => i !== index);
            // Ensure one default remains
            if (form.sellingOptions[index].isDefault && newOptions.length > 0) {
                newOptions[0].isDefault = true;
            }
            setForm(prev => ({ ...prev, sellingOptions: newOptions }));
        }
    };

    const updateSellingOption = (index: number, field: keyof SellingOption, value: string | number | boolean) => {
        const newOptions = [...form.sellingOptions];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setForm(prev => ({ ...prev, sellingOptions: newOptions }));
        if (newOptions.some(o => o.unit && o.price > 0)) {
            setErrors((prev: any) => ({...prev, sellingOptions: false}));
        }
    };

    const setDefaultOption = (index: number) => {
        const newOptions = form.sellingOptions.map((opt, i) => ({
            ...opt,
            isDefault: i === index
        }));
        setForm(prev => ({ ...prev, sellingOptions: newOptions }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-brand-50 p-3 rounded-xl border border-brand-100 flex items-center gap-3">
                <Library size={18} className="text-brand-600 shrink-0"/>
                <select className="w-full bg-transparent text-sm text-brand-900 outline-none cursor-pointer" onChange={(e) => selectArticleForForm(e.target.value)} defaultValue="">
                    <option value="">-- Importer depuis le catalogue --</option>
                    {articles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Image */}
                <div className="md:col-span-3 space-y-2">
                    <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative group hover:border-brand-400 transition-colors cursor-pointer overflow-hidden">
                        {form.imageUrl ? (
                            <img src={form.imageUrl} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                            <div className="text-center p-2 text-slate-400">
                                <Upload className="mx-auto mb-1" size={20}/>
                                <span className="text-[10px]">Photo (optionnel)</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload}/>
                    </div>
                    <div className="relative">
                        <LinkIcon size={12} className="absolute left-2 top-2.5 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Ou coller URL..." 
                            className="w-full pl-6 p-2 text-xs border border-slate-200 rounded bg-slate-50 outline-none focus:border-brand-500 focus:bg-white transition-colors"
                            value={form.imageUrl || ''}
                            onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Basic Info */}
                <div className="md:col-span-9 space-y-3">
                    <div>
                        <input 
                            className={`w-full p-2 border-b ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-brand-500'} outline-none transition-colors font-bold placeholder-slate-400`} 
                            placeholder="Nom du produit *" 
                            value={form.name} 
                            onChange={e => {
                                setForm(prev => ({...prev, name: e.target.value}));
                                if(e.target.value) setErrors((prev: any) => ({...prev, name: false}));
                            }} 
                        />
                    </div>
                    
                    {/* Row 2: Price in FCFA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Prix Achat (FCFA) *</label>
                            <div className="flex gap-1 relative">
                                <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">F</span>
                                <input type="number" 
                                    className={`w-full pl-6 p-1.5 rounded bg-white border ${errors.buyingPrice ? 'border-red-300' : 'border-slate-200'} outline-none text-sm font-bold`} 
                                    value={form.buyingPrice || ''} 
                                    onChange={e => {
                                        setForm(prev => ({...prev, buyingPrice: parseFloat(e.target.value)}));
                                        if(parseFloat(e.target.value) > 0) setErrors((prev: any) => ({...prev, buyingPrice: false}));
                                    }}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Unité Achat *</label>
                            <input type="text" placeholder="Ex: Carton" className={`w-full p-1.5 rounded bg-slate-50 border ${errors.buyingUnit ? 'border-red-300' : 'border-slate-200'} outline-none text-sm`} 
                                value={form.buyingUnit} 
                                onChange={e => {
                                    setForm(prev => ({...prev, buyingUnit: e.target.value}));
                                    if(e.target.value) setErrors((prev: any) => ({...prev, buyingUnit: false}));
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Quantité *</label>
                            <input type="number" className={`w-full p-1.5 rounded bg-slate-50 border ${errors.quantity ? 'border-red-300' : 'border-slate-200'} outline-none text-sm font-bold`} 
                                value={form.quantityTotal || ''} 
                                onChange={e => {
                                    setForm(prev => ({...prev, quantityTotal: parseFloat(e.target.value)}));
                                    if(parseFloat(e.target.value) > 0) setErrors((prev: any) => ({...prev, quantity: false}));
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Selling Options */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><DollarSign size={14}/> Prix de Vente (FCFA) *</label>
                    <button onClick={addSellingOption} className="text-[10px] bg-white hover:bg-brand-50 text-brand-600 border border-slate-200 px-2 py-1 rounded-lg font-bold transition-colors">+ Variante</button>
                </div>
                <div className={`space-y-2 ${errors.sellingOptions ? 'p-2 bg-red-50 rounded border border-red-200' : ''}`}>
                    {form.sellingOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center group">
                            <button 
                                onClick={() => setDefaultOption(idx)}
                                title="Définir comme unité par défaut pour les commandes"
                                className={`p-1.5 rounded transition-colors ${opt.isDefault ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-slate-300 hover:text-yellow-400'}`}
                            >
                                <Star size={16} fill={opt.isDefault ? "currentColor" : "none"} />
                            </button>
                            <input placeholder="Unité (ex: Pièce)" className="w-1/3 p-1.5 text-xs rounded border border-slate-200 outline-none" value={opt.unit} onChange={e => updateSellingOption(idx, 'unit', e.target.value)} />
                            <input type="number" placeholder="Prix (FCFA)" className="flex-1 p-1.5 text-xs rounded border border-slate-200 outline-none font-bold" value={opt.price || ''} onChange={e => updateSellingOption(idx, 'price', parseFloat(e.target.value))} />
                            {form.sellingOptions.length > 1 && <button onClick={() => removeSellingOption(idx)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>}
                            {opt.isDefault && <span className="text-[9px] font-bold text-yellow-600 uppercase border border-yellow-200 bg-yellow-50 px-1 rounded">Défaut</span>}
                        </div>
                    ))}
                </div>
                {errors.sellingOptions && <p className="text-[10px] text-red-500 mt-1">Prix de vente requis.</p>}
            </div>
            
            {isStandalone && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase">Transport (Lot FCFA)</label><input type="number" className="w-full p-2 border rounded text-sm" value={form.transportFee || ''} onChange={e => setForm(prev => ({...prev, transportFee: parseFloat(e.target.value)}))} /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase">Douane (Lot FCFA)</label><input type="number" className="w-full p-2 border rounded text-sm" value={form.customsFee || ''} onChange={e => setForm(prev => ({...prev, customsFee: parseFloat(e.target.value)}))} /></div>
                </div>
            )}
        </div>
    );
};


export const Groupages: React.FC<GroupagesProps> = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroupage, setSelectedGroupage] = useState<Groupage | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // --- State pour l'édition d'un groupage existant ---
  const [isEditingGroupage, setIsEditingGroupage] = useState(false);
  const [editGroupageForm, setEditGroupageForm] = useState<Partial<Groupage>>({});

  // --- State pour la création d'un NOUVEAU groupage ---
  const [creationForm, setCreationForm] = useState<{
    name: string;
    startDate: string;
    endDate: string;
    status: GroupageStatus;
    minAdvanceAmount: number;
    isShippingIncluded: boolean;
    originCountry: string;
    transportMode: string;
    estimatedTransportCost: number;
    estimatedCustomsCost: number;
  }>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: GroupageStatus.OPEN,
    minAdvanceAmount: 0,
    isShippingIncluded: false,
    originCountry: 'Chine',
    transportMode: 'Avion',
    estimatedTransportCost: 0,
    estimatedCustomsCost: 0,
  });

  // State pour les produits en cours d'ajout DANS la création de groupage
  const [pendingProducts, setPendingProducts] = useState<Array<{
    tempId: string;
    name: string;
    buyingPrice: number;
    buyingUnit: string;
    sellingOptions: SellingOption[];
    quantityTotal: number;
    imageUrl: string;
  }>>([]);

  // Formulaire temporaire pour un produit
  const [tempProductForm, setTempProductForm] = useState<{
    name: string;
    buyingPrice: number;
    buyingUnit: string;
    quantityTotal: number;
    imageUrl: string;
    sellingOptions: SellingOption[];
    transportFee?: number; 
    customsFee?: number; 
  }>({
    name: '',
    buyingPrice: 0,
    buyingUnit: 'Pièce',
    quantityTotal: 0,
    imageUrl: '',
    sellingOptions: [{ unit: 'Pièce', price: 0, isDefault: true }],
    transportFee: 0,
    customsFee: 0
  });

  // Validation State
  const [productFormErrors, setProductFormErrors] = useState<{
    name?: boolean;
    buyingPrice?: boolean;
    buyingUnit?: boolean;
    quantity?: boolean;
    sellingOptions?: boolean;
  }>({});

  const COUNTRIES = ['Chine', 'Nigeria', 'Dubaï', 'Turquie', 'USA', 'France', 'Bénin', 'Togo', 'Autre'];
  const TRANSPORT_MODES = ['Avion', 'Bateau', 'Route', 'Train', 'Autre'];

  // --- Handlers ---
  const validateTempForm = () => {
      const errors: typeof productFormErrors = {};
      let isValid = true;

      if (!tempProductForm.name || tempProductForm.name.trim() === '') { errors.name = true; isValid = false; }
      if (!tempProductForm.buyingPrice || tempProductForm.buyingPrice <= 0) { errors.buyingPrice = true; isValid = false; }
      if (!tempProductForm.buyingUnit || tempProductForm.buyingUnit.trim() === '') { errors.buyingUnit = true; isValid = false; }
      if (!tempProductForm.quantityTotal || tempProductForm.quantityTotal <= 0) { errors.quantity = true; isValid = false; }
      
      const validOptions = tempProductForm.sellingOptions.filter(o => o.unit && o.unit.trim() !== '' && o.price > 0);
      if (validOptions.length === 0) { errors.sellingOptions = true; isValid = false; }

      setProductFormErrors(errors);
      return isValid;
  };

  // --- Logic Specific to Creation Modal ---

  const addProductToPendingList = () => {
      if (!validateTempForm()) return;
      
      const newPending = {
          tempId: Date.now().toString(),
          name: tempProductForm.name,
          buyingPrice: tempProductForm.buyingPrice,
          buyingUnit: tempProductForm.buyingUnit,
          quantityTotal: tempProductForm.quantityTotal,
          imageUrl: tempProductForm.imageUrl,
          sellingOptions: tempProductForm.sellingOptions.filter(o => o.unit && o.price > 0)
      };

      setPendingProducts(prev => [...prev, newPending]);
      
      // Reset form
      setTempProductForm(prev => ({
          ...prev, name: '', buyingPrice: 0, buyingUnit: 'Pièce', quantityTotal: 0, imageUrl: '',
          sellingOptions: [{ unit: 'Pièce', price: 0, isDefault: true }], transportFee: 0, customsFee: 0
      }));
  };

  const removePendingProduct = (tempId: string) => {
      setPendingProducts(prev => prev.filter(p => p.tempId !== tempId));
  };

  const handleCreateGroupage = () => {
    if (!creationForm.name || !creationForm.startDate) return;

    const groupId = Date.now().toString();
    const finalProducts: Product[] = pendingProducts.map((p, index) => {
        const validSellingOptions = p.sellingOptions;
        const mainSellingPrice = validSellingOptions.length > 0 ? validSellingOptions[0].price : 0;
        
        const estTrans = 0; 
        const estCust = 0;
        const costPrice = p.buyingPrice + estTrans + estCust;

        return {
            id: groupId + '_p' + index,
            groupageId: groupId,
            name: p.name,
            buyingPrice: p.buyingPrice,
            buyingUnit: p.buyingUnit,
            costPrice: costPrice,
            sellingPrice: mainSellingPrice,
            sellingOptions: validSellingOptions,
            customsFee: estCust,
            transportFee: estTrans,
            quantityTotal: p.quantityTotal,
            quantitySold: 0,
            imageUrl: p.imageUrl || `https://picsum.photos/200/200?random=${Date.now() + index}`
        };
    });

    const g: Groupage = {
      id: groupId,
      ...creationForm,
      products: finalProducts
    };

    setData(prev => ({ ...prev, groupages: [...prev.groupages, g] }));
    setIsCreating(false);
    setPendingProducts([]);
  };

  // --- Logic Specific to Adding Product to Existing Groupage ---

  const handleAddProductToExisting = () => {
    if (!selectedGroupage) return;
    if (!validateTempForm()) return;

    const validSellingOptions = tempProductForm.sellingOptions.filter(o => o.unit && o.price > 0);
    const mainSellingPrice = validSellingOptions.length > 0 ? validSellingOptions[0].price : 0;
    
    // Cost calculation
    const costPrice = (tempProductForm.buyingPrice || 0) + (tempProductForm.transportFee || 0) + (tempProductForm.customsFee || 0);

    const p: Product = {
      id: Date.now().toString(),
      groupageId: selectedGroupage.id,
      name: tempProductForm.name,
      buyingPrice: tempProductForm.buyingPrice,
      buyingUnit: tempProductForm.buyingUnit,
      costPrice: costPrice,
      sellingPrice: mainSellingPrice,
      sellingOptions: validSellingOptions,
      customsFee: tempProductForm.customsFee || 0,
      transportFee: tempProductForm.transportFee || 0,
      quantityTotal: tempProductForm.quantityTotal,
      quantitySold: 0,
      imageUrl: tempProductForm.imageUrl || `https://picsum.photos/200/200?random=${Date.now()}`
    };

    const updatedGroupage = {
      ...selectedGroupage,
      products: [...selectedGroupage.products, p]
    };

    setData(prev => ({
      ...prev,
      groupages: prev.groupages.map(g => g.id === selectedGroupage.id ? updatedGroupage : g)
    }));
    
    setSelectedGroupage(updatedGroupage);
    setShowAddProduct(false);
    setTempProductForm(prev => ({
          ...prev, name: '', buyingPrice: 0, buyingUnit: 'Pièce', quantityTotal: 0, imageUrl: '',
          sellingOptions: [{ unit: 'Pièce', price: 0, isDefault: true }], transportFee: 0, customsFee: 0
    }));
    setProductFormErrors({});
  };


  // --- Calculations ---
  const calculateGroupageProfit = (g: Groupage) => {
    return g.products.reduce((sum, p) => {
        const margin = p.sellingPrice - p.costPrice;
        return sum + (margin * p.quantitySold);
    }, 0);
  };

  const handleUpdateStatus = (status: GroupageStatus) => {
    if (!selectedGroupage) return;
    const updated = { ...selectedGroupage, status };
    setSelectedGroupage(updated);
    setData(prev => ({
      ...prev,
      groupages: prev.groupages.map(g => g.id === updated.id ? updated : g)
    }));
  };
  
  const handleSaveGroupageChanges = () => {
    if (!selectedGroupage || !editGroupageForm.name) return;
    const updatedGroupage = { ...selectedGroupage, ...editGroupageForm } as Groupage;
    setData(prev => ({
      ...prev,
      groupages: prev.groupages.map(g => g.id === updatedGroupage.id ? updatedGroupage : g)
    }));
    setSelectedGroupage(updatedGroupage);
    setIsEditingGroupage(false);
  };

  const handleDeleteGroupage = () => {
      if (!selectedGroupage) return;
      if (confirm(`ATTENTION : Voulez-vous vraiment supprimer le groupage "${selectedGroupage.name}" ?`)) {
          setData(prev => ({
              ...prev,
              groupages: prev.groupages.filter(g => g.id !== selectedGroupage.id)
          }));
          setSelectedGroupage(null);
          setIsEditingGroupage(false);
      }
  };
  
  const startEditingGroupage = () => {
    if (selectedGroupage) {
      setEditGroupageForm({
        name: selectedGroupage.name,
        startDate: selectedGroupage.startDate,
        endDate: selectedGroupage.endDate,
        originCountry: selectedGroupage.originCountry,
        transportMode: selectedGroupage.transportMode,
        minAdvanceAmount: selectedGroupage.minAdvanceAmount,
        isShippingIncluded: selectedGroupage.isShippingIncluded,
        status: selectedGroupage.status
      });
      setIsEditingGroupage(true);
    }
  };

  // Filter Logic
  const filteredGroupages = data.groupages.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.originCountry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic (Groupages)
  const totalPages = Math.ceil(filteredGroupages.length / ITEMS_PER_PAGE);
  const currentGroupages = filteredGroupages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ---------------- RENDER ----------------

  if (selectedGroupage) {
    // === DETAILS VIEW ===
    const totalBuyingCost = selectedGroupage.products.reduce((acc, p) => acc + (p.buyingPrice * p.quantityTotal), 0);
    const totalTransport = selectedGroupage.estimatedTransportCost || 0;
    const totalCustoms = selectedGroupage.estimatedCustomsCost || 0;
    const profit = calculateGroupageProfit(selectedGroupage);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* MODE EDIT */}
        {isEditingGroupage ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Edit2 size={20} className="text-brand-600"/> Modifier les détails</h2>
                        <p className="text-sm text-slate-500 mt-1">Mettez à jour les informations logistiques et financières.</p>
                    </div>
                    <button onClick={() => setIsEditingGroupage(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Colonne 1: Identité */}
                    <div className="space-y-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Identité</h3>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom du Groupage</label>
                            <input className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none" value={editGroupageForm.name || ''} onChange={e => setEditGroupageForm(prev => ({...prev, name: e.target.value}))} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Statut actuel</label>
                            <select className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 outline-none" value={editGroupageForm.status} onChange={e => setEditGroupageForm(prev => ({...prev, status: e.target.value as GroupageStatus}))}>
                                {Object.values(GroupageStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Colonne 2: Logistique */}
                    <div className="space-y-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Logistique</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pays</label>
                                <select className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 outline-none" value={editGroupageForm.originCountry} onChange={e => setEditGroupageForm(prev => ({...prev, originCountry: e.target.value}))}>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Transport</label>
                                <select className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 outline-none" value={editGroupageForm.transportMode} onChange={e => setEditGroupageForm(prev => ({...prev, transportMode: e.target.value}))}>
                                    {TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div><label className="text-xs text-slate-500">Début</label><input type="date" className="w-full p-2 rounded border border-slate-200 text-sm" value={editGroupageForm.startDate} onChange={e => setEditGroupageForm(prev => ({...prev, startDate: e.target.value}))} /></div>
                            <div><label className="text-xs text-slate-500">Fin (Est.)</label><input type="date" className="w-full p-2 rounded border border-slate-200 text-sm" value={editGroupageForm.endDate} onChange={e => setEditGroupageForm(prev => ({...prev, endDate: e.target.value}))} /></div>
                        </div>
                    </div>
                    {/* Colonne 3: Finance */}
                    <div className="space-y-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Finance</h3>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Acompte Min. (FCFA)</label>
                            <input type="number" className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 outline-none" value={editGroupageForm.minAdvanceAmount} onChange={e => setEditGroupageForm(prev => ({...prev, minAdvanceAmount: Number(e.target.value)}))} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" onClick={() => setEditGroupageForm(prev => ({...prev, isShippingIncluded: !prev.isShippingIncluded}))}>
                            <span className="text-sm font-medium text-slate-700">Transport inclus ?</span>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${editGroupageForm.isShippingIncluded ? 'bg-brand-500' : 'bg-slate-300'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${editGroupageForm.isShippingIncluded ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center px-8 py-5 bg-slate-50 border-t border-slate-200">
                     <button onClick={handleDeleteGroupage} className="text-red-500 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"><Trash2 size={16}/> Supprimer</button>
                     <div className="flex gap-3">
                        <button onClick={() => setIsEditingGroupage(false)} className="px-6 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-white border border-transparent hover:border-slate-200 transition-all">Annuler</button>
                        <button onClick={handleSaveGroupageChanges} className="px-6 py-2.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg flex items-center gap-2"><Save size={18}/> Enregistrer</button>
                     </div>
                 </div>
            </div>
        ) : (
            // MODE VIEW
            <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedGroupage(null)} className="text-slate-500 hover:text-slate-800 group flex items-center gap-1 text-sm font-medium"><ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour</button>
                        <div className="h-8 w-[1px] bg-slate-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                {selectedGroupage.name}
                                <button onClick={startEditingGroupage} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"><Edit2 size={18}/></button>
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-slate-700"><MapPin size={14}/> {selectedGroupage.originCountry}</span>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                                    {selectedGroupage.transportMode === 'Avion' ? <Plane size={14}/> : <Truck size={14}/>}
                                    {selectedGroupage.transportMode}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                         <select 
                                value={selectedGroupage.status}
                                onChange={(e) => handleUpdateStatus(e.target.value as GroupageStatus)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer outline-none transition-colors appearance-none text-center min-w-[120px] shadow-sm
                                    ${selectedGroupage.status === GroupageStatus.OPEN ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                                    selectedGroupage.status === GroupageStatus.ARRIVED ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-slate-100 text-slate-800 border-slate-200'}
                                `}
                            >
                                {Object.values(GroupageStatus).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                    </div>
                </div>

                {/* STATS FINANCIERES */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-28">
                         <div className="flex justify-between items-start">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={18}/></div>
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Calculé</span>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-400 uppercase">Achat Marchandise</p>
                             <p className="text-lg font-bold text-slate-800">{totalBuyingCost.toLocaleString()} F</p>
                         </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-28">
                         <div className="flex justify-between items-start">
                             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Plane size={18}/></div>
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Estimé</span>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-400 uppercase">Transport Total</p>
                             <p className="text-lg font-bold text-slate-800">{totalTransport.toLocaleString()} F</p>
                         </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-28">
                         <div className="flex justify-between items-start">
                             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Landmark size={18}/></div>
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Estimé</span>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-400 uppercase">Douane Totale</p>
                             <p className="text-lg font-bold text-slate-800">{totalCustoms.toLocaleString()} F</p>
                         </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-28 relative overflow-hidden">
                         <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                         <div className="flex justify-between items-start relative z-10">
                             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18}/></div>
                             <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Projection</span>
                         </div>
                         <div className="relative z-10">
                             <p className="text-xs font-bold text-slate-400 uppercase">Marge Potentielle</p>
                             <p className="text-lg font-bold text-emerald-600">{profit.toLocaleString()} F</p>
                         </div>
                    </div>
                </div>
            </>
        )}

        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Package className="text-brand-600"/> Produits du Groupage ({selectedGroupage.products.length})</h3>
           <button onClick={() => {setShowAddProduct(true); setTempProductForm({ name: '', buyingPrice: 0, buyingUnit: 'Pièce', quantityTotal: 0, imageUrl: '', sellingOptions: [{ unit: 'Pièce', price: 0, isDefault: true }], transportFee: 0, customsFee: 0 }); setProductFormErrors({});}} className="btn btn-primary flex items-center gap-2 shadow-md shadow-brand-200">
             <Plus size={18} /> Ajouter Produit
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {selectedGroupage.products.map(product => (
             <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                   {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-300">
                           <ImageIcon size={40} />
                       </div>
                   )}
                   <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-800 shadow-sm border border-slate-100">
                       {product.buyingPrice} FCFA
                   </div>
                </div>
                <div className="p-5 space-y-4">
                   <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-xs text-slate-500 font-medium uppercase">Disponibilité</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${product.quantityTotal - product.quantitySold > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {product.quantityTotal - product.quantitySold} / {product.quantityTotal} {product.buyingUnit}
                      </span>
                   </div>
                   <div>
                       <h4 className="font-bold text-slate-800 truncate">{product.name}</h4>
                       <div className="mt-2 flex flex-wrap gap-2">
                          {product.sellingOptions?.map((opt, idx) => (
                             <span key={idx} className={`text-xs px-2 py-1 rounded font-medium border ${opt.isDefault ? 'bg-brand-600 text-white border-brand-600' : 'bg-brand-50 text-brand-700 border-brand-100'}`}>
                                 {opt.price.toLocaleString()} F / {opt.unit}
                             </span>
                          ))}
                       </div>
                   </div>
                   {/* Cost Preview */}
                   <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <TrendingUp size={10}/> Coût Revient: {product.costPrice.toLocaleString()} F
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* MODAL AJOUT PRODUIT INDIVIDUEL (DANS GROUPAGE EXISTANT) */}
        {showAddProduct && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
             <div className="bg-white w-full max-w-2xl rounded-2xl p-0 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <div>
                     <h3 className="text-xl font-bold text-slate-800">Nouvelle Entrée de Stock</h3>
                     <p className="text-xs text-slate-400">Ajout dans : {selectedGroupage.name}</p>
                 </div>
                 <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
               </div>
               <div className="p-6 overflow-y-auto max-h-[80vh]">
                   <ProductFormFields form={tempProductForm} setForm={setTempProductForm} errors={productFormErrors} setErrors={setProductFormErrors} articles={data.articles} isStandalone={true} />
               </div>
               <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setShowAddProduct(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white rounded-lg transition-colors">Annuler</button>
                  <button onClick={handleAddProductToExisting} className="btn btn-primary px-6 py-2.5 shadow-lg shadow-brand-200">Confirmer l'Entrée</button>
               </div>
             </div>
           </div>
        )}
      </div>
    );
  }

  // === MAIN PAGE (LIST) ===
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Groupages</h2>
          <p className="text-sm text-slate-500">Gérez vos arrivages logistiques, transport et douane.</p>
        </div>
        
        <button onClick={() => { 
            setIsCreating(true); 
            setPendingProducts([]); 
            setTempProductForm({ name: '', buyingPrice: 0, buyingUnit: 'Pièce', quantityTotal: 0, imageUrl: '', sellingOptions: [{ unit: 'Pièce', price: 0, isDefault: true }], transportFee: 0, customsFee: 0 });
        }} className="btn btn-primary flex items-center gap-2 shadow-xl shadow-brand-200">
        <Plus size={20} /> Créer un Groupage
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Rechercher par nom de groupage, pays..." 
                className="w-full pl-12 p-3 rounded-xl bg-transparent outline-none text-slate-700 placeholder-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 my-auto hidden md:block"></div>
          <div className="relative md:w-64 group">
            <Filter className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <select 
              className="w-full pl-11 p-3 rounded-xl bg-transparent outline-none text-slate-700 cursor-pointer appearance-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="ALL">Tous les statuts</option>
                {Object.values(GroupageStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentGroupages.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                    <Package size={48} className="mx-auto mb-4 opacity-50"/>
                    <p>Aucun groupage ne correspond à vos critères.</p>
                </div>
            ) : (
                currentGroupages.map(groupage => {
                const profit = calculateGroupageProfit(groupage);
                return (
                    <div key={groupage.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col" onClick={() => setSelectedGroupage(groupage)}>
                    <div className={`h-1.5 w-full ${groupage.status === GroupageStatus.OPEN ? 'bg-brand-500' : groupage.status === GroupageStatus.ARRIVED ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${groupage.status === GroupageStatus.OPEN ? 'bg-brand-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{groupage.status}</span>
                            </div>
                            <h3 className="font-bold text-xl text-slate-800 group-hover:text-brand-600 transition-colors">{groupage.name}</h3>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                            {groupage.transportMode === 'Avion' ? <Plane size={20}/> : groupage.transportMode === 'Bateau' ? <Ship size={20}/> : <Truck size={20}/>}
                        </div>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <MapPin size={16} className="text-slate-400"/>
                                <span>Origine: <span className="font-medium text-slate-800">{groupage.originCountry}</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Calendar size={16} className="text-slate-400"/>
                                <span>Départ: <span className="font-medium text-slate-800">{new Date(groupage.startDate).toLocaleDateString()}</span ></span>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Produits</p>
                                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                    <Package size={16} className="text-brand-500"/> {groupage.products.length}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Marge Est.</p>
                                <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                                    <TrendingUp size={16}/> {profit > 0 ? (profit/1000).toFixed(1) + 'k' : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                );
                })
            )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30 text-slate-600 transition-all"><ChevronLeft size={20}/></button>
            <span className="text-sm font-medium text-slate-600 bg-white px-4 py-1 rounded-full border border-slate-100 shadow-sm">Page {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30 text-slate-600 transition-all"><ChevronRight size={20}/></button>
        </div>
      )}

      {/* MODAL CREATE GROUPAGE - MULTI PRODUCT */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl my-auto overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0 z-20">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-900">Nouveau Groupage</h2>
                      <p className="text-slate-500 text-sm mt-1">Configurez les détails et ajoutez la liste des produits.</p>
                  </div>
                  <button onClick={() => setIsCreating(false)} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/50">
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN: Configuration Principale */}
                        <div className="lg:col-span-5 space-y-6">
                            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 sticky top-0">
                                <div className="flex items-center gap-3 text-slate-800 pb-2 border-b border-slate-50">
                                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm">1</div>
                                    <h3 className="font-bold text-lg">Infos Générales</h3>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nom du Groupage</label>
                                    <input className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm" placeholder="Ex: Arrivage Chine..." value={creationForm.name} onChange={e => setCreationForm({...creationForm, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Origine</label>
                                        <select className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm" value={creationForm.originCountry} onChange={e => setCreationForm({...creationForm, originCountry: e.target.value})}>
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Transport</label>
                                        <select className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm" value={creationForm.transportMode} onChange={e => setCreationForm({...creationForm, transportMode: e.target.value})}>
                                            {TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Date Début</label>
                                        <input type="date" className="w-full p-2.5 rounded-lg border border-slate-200 text-xs" value={creationForm.startDate} onChange={e => setCreationForm({...creationForm, startDate: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Date Fin</label>
                                        <input type="date" className="w-full p-2.5 rounded-lg border border-slate-200 text-xs" value={creationForm.endDate} onChange={e => setCreationForm({...creationForm, endDate: e.target.value})} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-500">Acompte Minimum (FCFA)</span>
                                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                            <input type="number" className="w-20 bg-transparent text-right font-bold text-xs outline-none" value={creationForm.minAdvanceAmount} onChange={e => setCreationForm({...creationForm, minAdvanceAmount: Number(e.target.value)})} placeholder="0" />
                                            <span className="text-xs text-slate-500">F</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                         <div><label className="text-[10px] text-slate-400">Est. Transport (Total)</label><input type="number" className="w-full p-2 rounded bg-slate-50 border border-slate-200 text-xs" placeholder="0" value={creationForm.estimatedTransportCost || ''} onChange={e => setCreationForm({...creationForm, estimatedTransportCost: Number(e.target.value)})} /></div>
                                         <div><label className="text-[10px] text-slate-400">Est. Douane (Total)</label><input type="number" className="w-full p-2 rounded bg-slate-50 border border-slate-200 text-xs" placeholder="0" value={creationForm.estimatedCustomsCost || ''} onChange={e => setCreationForm({...creationForm, estimatedCustomsCost: Number(e.target.value)})} /></div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN: Liste Produits & Ajout */}
                        <div className="lg:col-span-7 space-y-4">
                            
                            {/* Products Added List */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-h-[120px]">
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Package size={18} className="text-brand-500"/>
                                    Articles ajoutés ({pendingProducts.length})
                                </h3>
                                {pendingProducts.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                                        <p className="text-sm">La liste est vide.</p>
                                        <p className="text-xs">Ajoutez des produits ci-dessous.</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {pendingProducts.map((p) => (
                                            <div key={p.tempId} className="flex-shrink-0 w-48 bg-slate-50 rounded-xl border border-slate-200 p-3 relative group hover:border-brand-300 transition-colors">
                                                <button onClick={() => removePendingProduct(p.tempId)} className="absolute top-1 right-1 p-1 bg-white text-red-400 hover:text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 overflow-hidden">
                                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover"/> : <ImageIcon className="w-full h-full p-2 text-slate-300"/>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-xs text-slate-800 truncate">{p.name}</p>
                                                        <p className="text-[10px] text-slate-500">{p.buyingPrice} FCFA</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-bold">x{p.quantityTotal}</span>
                                                    <span className="text-[10px] font-medium text-slate-600">{p.sellingOptions[0]?.price} F</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Form to add NEW product */}
                            <div className="bg-indigo-900 rounded-2xl p-1 shadow-lg text-white overflow-hidden">
                                <div className="p-4 bg-indigo-800/50 backdrop-blur-sm border-b border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">2</div>
                                        <h3 className="font-bold text-lg">Ajouter un article à la liste</h3>
                                    </div>
                                </div>
                                
                                <div className="p-5 bg-white text-slate-900 rounded-b-xl">
                                     <ProductFormFields form={tempProductForm} setForm={setTempProductForm} errors={productFormErrors} setErrors={setProductFormErrors} articles={data.articles} isStandalone={false} />
                                     <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                         <button onClick={addProductToPendingList} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-105">
                                             <Plus size={18}/> Ajouter à la liste
                                         </button>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              {/* Footer (Sticky Bottom) */}
              <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-4">
                  <button onClick={() => setIsCreating(false)} className="px-6 py-3 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
                  <button onClick={handleCreateGroupage} className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold hover:shadow-lg hover:shadow-brand-200 hover:-translate-y-0.5 transition-all transform flex items-center gap-2">
                      <Save size={20} /> Confirmer et Créer ({pendingProducts.length} articles)
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
