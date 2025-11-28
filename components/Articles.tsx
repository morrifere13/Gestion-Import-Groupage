
import React, { useState } from 'react';
import { AppData, Article } from '../types';
import { Plus, Search, Image as ImageIcon, Trash2, Edit2, X, Filter, CloudUpload, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ArticlesProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const PRODUCT_CATEGORIES = [
  'Mode & Accessoires',
  'Électronique',
  'Cosmétiques & Beauté',
  'Maison & Cuisine',
  'Textile & Tissus',
  'Chaussures',
  'Enfants & Jouets',
  'Pièces Auto/Moto',
  'Divers'
];

const ITEMS_PER_PAGE = 8;

export const Articles: React.FC<ArticlesProps> = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [form, setForm] = useState<{
    id?: string;
    name: string;
    category: string;
    description: string;
    imageUrl: string;
  }>({
    name: '',
    category: '',
    description: '',
    imageUrl: ''
  });

  const [errors, setErrors] = useState<{name?: boolean, category?: boolean}>({});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setForm(prev => ({ ...prev, imageUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
      const newErrors = {
          name: !form.name,
          category: !form.category
      };
      setErrors(newErrors);
      return !newErrors.name && !newErrors.category;
  };

  const handleSave = () => {
    if (!validate()) return;

    const newArticle: Article = {
      id: form.id || Date.now().toString(),
      name: form.name,
      category: form.category,
      description: form.description,
      imageUrl: form.imageUrl,
    };

    if (form.id) {
      setData(prev => ({ ...prev, articles: prev.articles.map(a => a.id === form.id ? { ...a, ...newArticle } : a) }));
    } else {
      setData(prev => ({ ...prev, articles: [...prev.articles, newArticle] }));
    }
    setIsCreating(false);
    setForm({ name: '', category: '', description: '', imageUrl: '' });
    setErrors({});
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Empêche le déclenchement d'autres événements
    if(confirm('Êtes-vous sûr de vouloir supprimer cet article du catalogue ?')) {
      setData(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
      // Si la page devient vide après suppression, on retourne à la précédente
      if (currentItems.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setForm({
      id: article.id,
      name: article.name,
      category: article.category || '',
      description: article.description || '',
      imageUrl: article.imageUrl || ''
    });
    setIsCreating(true);
    setErrors({});
  };

  // Filtrage
  const filteredArticles = data.articles.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? a.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const currentItems = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page quand on filtre
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Catalogue Articles</h2>
            <p className="text-sm text-slate-500">Base de données centrale de vos produits ({filteredArticles.length} références)</p>
        </div>
        <button 
          onClick={() => { setForm({ name: '', category: '', description: '', imageUrl: '' }); setIsCreating(true); setErrors({}); }} 
          className="btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-brand-200 hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Nouvel Article
        </button>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, description..." 
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
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
                <option value="">Toutes les catégories</option>
                {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
        </div>
      </div>

      {/* Liste avec Pagination */}
      {filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <Search size={48} className="mb-4 text-slate-300" />
            <p className="font-medium">Aucun article ne correspond à votre recherche.</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentItems.map(article => (
                <div key={article.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="h-56 bg-slate-50 relative overflow-hidden">
                        {article.imageUrl ? (
                            <img src={article.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={article.name} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-300 bg-slate-50">
                                <ImageIcon size={48}/>
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                            <button onClick={(e) => handleEdit(e, article)} className="p-3 bg-white text-slate-700 rounded-full shadow-lg hover:text-brand-600 hover:scale-110 transition-all transform"><Edit2 size={18}/></button>
                            <button onClick={(e) => handleDelete(e, article.id)} className="p-3 bg-white text-slate-700 rounded-full shadow-lg hover:text-red-600 hover:scale-110 transition-all transform"><Trash2 size={18}/></button>
                        </div>
                        
                        {article.category && (
                            <div className="absolute top-3 left-3">
                                <span className="px-2.5 py-1 bg-white/95 backdrop-blur text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border border-slate-100/50">
                                    {article.category}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="p-5">
                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-brand-600 transition-colors">{article.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 h-10 leading-relaxed">
                            {article.description || <span className="italic text-slate-300">Aucune description ajoutée.</span>}
                        </p>
                    </div>
                </div>
                ))}
            </div>

            {/* Contrôles de Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="text-sm font-medium text-slate-600">
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}
        </>
      )}

      {/* Modal Création/Édition (Identique à avant) */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 scale-100">
            
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-2xl text-slate-800">{form.id ? 'Modifier l\'article' : 'Nouvelle Référence'}</h3>
                <p className="text-slate-500 text-sm mt-1">Remplissez les détails pour ajouter ce produit au catalogue.</p>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-50/50">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-5 space-y-4">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Visuel du produit</label>
                        <div className={`w-full aspect-square bg-white border-2 ${form.imageUrl ? 'border-brand-200' : 'border-dashed border-slate-300'} rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group transition-colors hover:border-brand-400 cursor-pointer`}>
                             {form.imageUrl ? (
                                 <>
                                     <img src={form.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                         <CloudUpload size={32} className="mb-2"/>
                                         <span className="text-sm font-medium">Changer l'image</span>
                                     </div>
                                 </>
                             ) : (
                                 <div className="text-center p-6">
                                     <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <ImageIcon size={28}/>
                                     </div>
                                     <p className="text-sm font-medium text-slate-700">Cliquez pour uploader</p>
                                     <p className="text-xs text-slate-400 mt-1">PNG, JPG jusqu'à 5Mo</p>
                                 </div>
                             )}
                             <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-xs text-slate-400 font-mono">URL</span>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Ou coller un lien image https://..." 
                                className="block w-full pl-10 pr-3 py-2 sm:text-xs border-slate-200 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                                value={form.imageUrl} 
                                onChange={e => setForm({...form, imageUrl: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-7 space-y-6">
                        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom de l'article <span className="text-brand-500">*</span></label>
                                 <input 
                                    className={`w-full p-3 rounded-lg bg-slate-50 border ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-200'} outline-none focus:ring-4 transition-all font-medium`}
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                    placeholder="Ex: Sac à main Cuir Luxe" 
                                 />
                                 {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/> Le nom est requis</p>}
                             </div>
                             
                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Catégorie <span className="text-brand-500">*</span></label>
                                 <div className="relative">
                                     <select 
                                        className={`w-full p-3 rounded-lg bg-slate-50 border ${errors.category ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-200'} outline-none focus:ring-4 transition-all appearance-none cursor-pointer`}
                                        value={form.category} 
                                        onChange={e => setForm({...form, category: e.target.value})}
                                     >
                                         <option value="">-- Sélectionner une catégorie --</option>
                                         {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                     </select>
                                     <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                     </div>
                                 </div>
                                 {errors.category && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/> Veuillez choisir une catégorie</p>}
                             </div>
                             
                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Description / Notes</label>
                                 <textarea 
                                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:ring-4 focus:ring-brand-200 transition-all min-h-[120px] resize-none text-sm"
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                    placeholder="Ajoutez des détails techniques, dimensions, matériaux ou notes internes..."
                                 />
                             </div>
                        </div>
                    </div>
                 </div>
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-4">
               <button 
                 onClick={() => setIsCreating(false)} 
                 className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
               >
                 Annuler
               </button>
               <button 
                 onClick={handleSave} 
                 className="px-8 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 hover:shadow-brand-300 transition-all transform active:scale-95 flex items-center gap-2"
               >
                 <Check size={20} /> {form.id ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
