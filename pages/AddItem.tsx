
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, StockStatus, User } from '../types';
import { saveItem, getInventory, getGlobalMaterials, getGlobalCategories, GlobalMaterial } from '../services/storageService';
import { Camera, Save, Image as ImageIcon, Search, Database, ArrowRight, Package, Maximize2, QrCode, Edit3, X, Hash, Filter } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AddItemProps {
  onComplete: () => void;
  user: User;
  companyId: string;
}

const AddItem: React.FC<AddItemProps> = ({ onComplete, user, companyId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [globalMaterials, setGlobalMaterials] = useState<GlobalMaterial[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [generatedSerial, setGeneratedSerial] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [nextIndex, setNextIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    uid: '',
    id: '', 
    category: 'Granito',
    commercialName: '',
    thickness: '2cm',
    width: 0,
    height: 0,
    location: '',
    quantity: 1,
    minQuantity: 2,
    supplier: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentInventory = getInventory(companyId);
    setInventory(currentInventory);
    setGlobalMaterials(getGlobalMaterials());
    setCategories(getGlobalCategories());
    
    const lastIndex = currentInventory.reduce((max, item) => Math.max(max, item.entryIndex || 0), 0);
    const newIndex = lastIndex + 1;
    
    setNextIndex(newIndex);
    setGeneratedSerial(newIndex.toString().padStart(4, '0'));
  }, [companyId]);

  const handleSelectPredefined = (mat: GlobalMaterial) => {
    // Ao selecionar um material pré-definido, preenchemos apenas os dados básicos.
    // Garantimos que o ID de série seja sempre o próximo disponível para criar um novo registro.
    setFormData({
      ...formData,
      commercialName: mat.name,
      category: mat.category,
      id: nextIndex.toString().padStart(4, '0')
    });
    setGeneratedSerial(nextIndex.toString().padStart(4, '0'));
    setIsCustomCategory(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.commercialName || formData.quantity <= 0) {
      alert('Nome e Quantidade são obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sempre criamos um novo item/lote por padrão para garantir rastreabilidade individual
      const itemToSave: InventoryItem = {
        uid: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        id: generatedSerial, 
        entryIndex: nextIndex,
        companyId: companyId,
        category: formData.category,
        commercialName: formData.commercialName,
        thickness: formData.thickness,
        width: formData.width,
        height: formData.height,
        location: formData.location,
        quantity: formData.quantity,
        minQuantity: formData.minQuantity,
        supplier: formData.supplier,
        entryDate: new Date().toISOString(),
        photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1590373199833-2808c7d6c8b4?auto=format&fit=crop&q=80&w=400'],
        status: StockStatus.DISPONIVEL,
        availableArea: (formData.width * formData.height) / 10000,
        history: [{
          id: `H-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          project: 'Entrada Inicial',
          clientName: 'Estoque',
          type: 'ENTRADA',
          quantityChange: formData.quantity,
          operatorName: user.name,
          areaUsed: 0
        }],
        lastUpdatedAt: new Date().toISOString()
      };

      saveItem(itemToSave);
      
      // Feedback visual antes de completar
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      alert("Erro ao salvar material. Verifique os dados e tente novamente.");
      setIsSubmitting(false);
    }
  };

  const filteredCatalog = globalMaterials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = isCustomCategory || m.category === formData.category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fadeIn">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e293b] text-white p-4 rounded-2xl shadow-2xl">
            <Database size={28} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-[#1e293b] tracking-tighter">Gerenciar Estoque</h2>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Cadastre novos lotes ou materiais</p>
          </div>
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
           <Hash className="text-blue-500" size={20} />
           <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Próximo Cadastro</p>
             <p className="text-xl font-black text-slate-900 tracking-tighter">#{nextIndex}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex justify-between items-center ml-2">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Catálogo: {formData.category}</h4>
                <Filter size={14} className="text-slate-300" />
             </div>
             
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar material..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                {filteredCatalog.length > 0 ? filteredCatalog.map((mat, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => handleSelectPredefined(mat)}
                    className={`w-full p-5 rounded-3xl text-left transition-all group flex justify-between items-center ${formData.commercialName === mat.name ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <div>
                      <p className={`text-sm font-black uppercase tracking-tight leading-none ${formData.commercialName === mat.name ? 'text-white' : 'text-slate-900'}`}>{mat.name}</p>
                      <p className={`text-[9px] font-bold uppercase mt-1.5 ${formData.commercialName === mat.name ? 'text-blue-100' : 'text-slate-400'}`}>{mat.category}</p>
                    </div>
                    <ArrowRight size={16} className={formData.commercialName === mat.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                  </button>
                )) : (
                  <div className="py-10 text-center opacity-40 grayscale flex flex-col items-center gap-3">
                    <Package size={32} />
                    <p className="text-[9px] font-black uppercase tracking-widest">Nenhum material encontrado</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-white p-10 sm:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 relative overflow-hidden">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Material</label>
                <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" value={formData.commercialName} onChange={e => setFormData({...formData, commercialName: e.target.value})} required placeholder="Ex: Preto São Gabriel" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  {!isCustomCategory ? (
                    <button 
                      type="button" 
                      onClick={() => setIsCustomCategory(true)}
                      className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-800"
                    >
                      <Edit3 size={10} /> + Outra
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setIsCustomCategory(false)}
                      className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:text-red-700"
                    >
                      <X size={10} /> Cancelar
                    </button>
                  )}
                </div>
                
                {!isCustomCategory ? (
                  <select 
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none appearance-none cursor-pointer" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    className="w-full p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl font-black text-slate-900 outline-none focus:bg-white animate-fadeIn" 
                    placeholder="Digite a nova categoria..." 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2 col-span-2">
                 <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-1">Quantidade Entrando</label>
                 <div className="relative">
                    <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={24} />
                    <input type="number" className="w-full pl-14 p-5 bg-blue-50/50 border-2 border-blue-100 rounded-3xl font-black text-2xl text-blue-700 outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Math.max(1, Number(e.target.value))})} required min="1" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Espessura</label>
                 <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-center" value={formData.thickness} onChange={e => setFormData({...formData, thickness: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Aviso Est. Baixo</label>
                 <input type="number" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-center" value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: Math.max(0, Number(e.target.value))})} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-8 border-t border-slate-50 pt-10">
               <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Largura (cm)</label>
                 <div className="relative">
                    <Maximize2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="number" placeholder="Ex: 300" className="w-full pl-14 p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" value={formData.width || ''} onChange={e => setFormData({...formData, width: Number(e.target.value)})} />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (cm)</label>
                 <div className="relative">
                    <Maximize2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="number" placeholder="Ex: 180" className="w-full pl-14 p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" value={formData.height || ''} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
                 </div>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-end border-t border-slate-50 pt-10">
               <div className="space-y-4 flex-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto do Material</label>
                  <div className="flex gap-6 items-center">
                     <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                       {photos.length > 0 ? <img src={photos[0]} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-slate-300" />}
                     </div>
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-[#1e293b] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl">
                       <Camera size={20} /> Adicionar Foto
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onload = (ev) => setPhotos([ev.target?.result as string]);
                         reader.readAsDataURL(file);
                       }
                     }} />
                  </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-inner">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                    <QRCodeSVG value={generatedSerial} size={80} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nº Série Gerado</p>
                    <p className="text-xl font-black text-slate-900 tracking-tighter">{generatedSerial}</p>
                  </div>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-8 rounded-[2.5rem] font-black uppercase shadow-[0_20px_40px_rgba(59,130,246,0.3)] transition-all active:scale-95 text-xl flex items-center justify-center gap-4 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-blue-600 text-white'}`}
            >
              {isSubmitting ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save size={28} /> CONFIRMAR ENTRADA
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItem;
