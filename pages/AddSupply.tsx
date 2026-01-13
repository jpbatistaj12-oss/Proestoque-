
import React, { useState, useEffect } from 'react';
import { SupplyItem, User } from '../types';
import { getGlobalSupplyCategories, getGlobalSupplyMaterials, saveSupplyItem, getSupplies, GlobalMaterial } from '../services/storageService';
import { Database, Package, Save, Tag, Search, ArrowRight, X, Edit3 } from 'lucide-react';

interface AddSupplyProps {
  onComplete: () => void;
  user: User;
  companyId: string;
}

const AddSupply: React.FC<AddSupplyProps> = ({ onComplete, user, companyId }) => {
  const [globalMaterials, setGlobalMaterials] = useState<GlobalMaterial[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Adesivos',
    unit: 'Un',
    quantity: 1,
    minQuantity: 5,
    location: '',
    supplier: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  useEffect(() => {
    setCategories(getGlobalSupplyCategories());
    setGlobalMaterials(getGlobalSupplyMaterials());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.quantity <= 0) return;

    const existingSupplies = getSupplies(companyId);
    const existing = existingSupplies.find(s => s.name.toLowerCase() === formData.name.toLowerCase());

    if (existing) {
      const updated: SupplyItem = {
        ...existing,
        quantity: existing.quantity + formData.quantity,
        lastUpdatedAt: new Date().toISOString(),
        history: [
          {
            id: `SUP-H-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'ENTRADA',
            quantityChange: formData.quantity,
            operatorName: user.name,
            observations: 'Entrada manual / Reposição'
          },
          ...existing.history
        ]
      };
      saveSupplyItem(updated);
    } else {
      const newItem: SupplyItem = {
        uid: `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        id: `INS-${Date.now().toString().slice(-4)}`,
        companyId,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        quantity: formData.quantity,
        minQuantity: formData.minQuantity,
        location: formData.location,
        supplier: formData.supplier,
        lastUpdatedAt: new Date().toISOString(),
        photos: [],
        history: [{
          id: `SUP-H-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'ENTRADA',
          quantityChange: formData.quantity,
          operatorName: user.name,
          observations: 'Cadastro inicial'
        }]
      };
      saveSupplyItem(newItem);
    }
    onComplete();
  };

  const filteredCatalog = globalMaterials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (isCustomCategory || m.category === formData.category)
  );

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fadeIn">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl">
          <Database size={28} />
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Novo Insumo</h2>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-3">Reposição ou cadastro de consumíveis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex justify-between items-center ml-2">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Catálogo Global</h4>
                <Tag size={14} className="text-slate-300" />
             </div>
             
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar insumo..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                {filteredCatalog.map((mat, i) => (
                  <button 
                    key={i} 
                    onClick={() => setFormData({...formData, name: mat.name, category: mat.category})}
                    className={`w-full p-5 rounded-3xl text-left transition-all group flex justify-between items-center ${formData.name === mat.name ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <div>
                      <p className={`text-sm font-black uppercase ${formData.name === mat.name ? 'text-white' : 'text-slate-900'}`}>{mat.name}</p>
                      <p className={`text-[9px] font-bold uppercase mt-1 ${formData.name === mat.name ? 'text-blue-100' : 'text-slate-400'}`}>{mat.category}</p>
                    </div>
                    <ArrowRight size={16} className={formData.name === mat.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-white p-10 sm:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Insumo</label>
                <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Cola PU 40 Branca" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <button type="button" onClick={() => setIsCustomCategory(!isCustomCategory)} className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    {isCustomCategory ? <X size={10}/> : <Edit3 size={10}/>} {isCustomCategory ? 'Cancelar' : '+ Outra'}
                  </button>
                </div>
                {isCustomCategory ? (
                   <input type="text" className="w-full p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl font-black outline-none" placeholder="Nova categoria..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                ) : (
                  <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2 col-span-2">
                 <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-1">Quantidade a Adicionar</label>
                 <div className="relative">
                    <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={24} />
                    <input type="number" className="w-full pl-14 p-5 bg-blue-50/50 border-2 border-blue-100 rounded-3xl font-black text-2xl text-blue-700 outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} required min="1" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Unid. Medida</label>
                 <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="Un">Unidade</option>
                    <option value="Kg">Kg</option>
                    <option value="L">Litro</option>
                    <option value="Pacote">Pacote</option>
                    <option value="Galão">Galão</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque Mín.</label>
                 <input type="number" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-center" value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: Number(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-50">
               <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização</label>
                 <input type="text" placeholder="Prateleira A2" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fornecedor Preferencial</label>
                 <input type="text" placeholder="Loja Central" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
               </div>
            </div>

            <button type="submit" className="w-full bg-[#1e293b] text-white py-8 rounded-[2.5rem] font-black uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 text-xl tracking-widest">
              <Save size={28} /> Confirmar Entrada
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSupply;
