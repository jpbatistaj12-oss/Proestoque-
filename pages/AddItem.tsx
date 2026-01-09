
import React, { useState, useEffect } from 'react';
import { MaterialCategory, InventoryItem, StockStatus, User } from '../types';
import { saveItem, getCurrentUser } from '../services/storageService';
import { Camera, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface AddItemProps {
  onComplete: () => void;
}

const AddItem: React.FC<AddItemProps> = ({ onComplete }) => {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    category: MaterialCategory.GRANITO,
    commercialName: '',
    thickness: '2cm',
    width: 0,
    height: 0,
    supplier: '',
    purchaseValue: '',
    observations: '',
  });

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const [photos, setPhotos] = useState<string[]>(['https://picsum.photos/seed/newstone/800/600']);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.commercialName || !formData.width || !formData.height) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const area = (formData.width * formData.height) / 10000;
    const newItem: InventoryItem = {
      id: `CHP-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId: user.companyId, // Vínculo multi-empresa
      category: formData.category,
      commercialName: formData.commercialName,
      thickness: formData.thickness,
      originalWidth: formData.width,
      originalHeight: formData.height,
      currentWidth: formData.width,
      currentHeight: formData.height,
      totalArea: area,
      availableArea: area,
      supplier: formData.supplier,
      entryDate: new Date().toISOString().split('T')[0],
      purchaseValue: Number(formData.purchaseValue) || undefined,
      observations: formData.observations,
      photos: photos,
      status: StockStatus.INTEIRA,
      history: []
    };

    saveItem(newItem);
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Nova Chapa</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Entrada de Material</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria de Material</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as MaterialCategory})}
              >
                {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Comercial</label>
              <input 
                type="text" 
                placeholder="Ex: Granito Preto Absoluto"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold"
                value={formData.commercialName}
                onChange={(e) => setFormData({...formData, commercialName: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Espessura</label>
              <input 
                type="text" 
                placeholder="2cm"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                value={formData.thickness}
                onChange={(e) => setFormData({...formData, thickness: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Largura (cm)</label>
              <input 
                type="number" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                value={formData.width || ''}
                onChange={(e) => setFormData({...formData, width: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (cm)</label>
              <input 
                type="number" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                value={formData.height || ''}
                onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fornecedor</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 shadow-2xl active:scale-95 transition-all text-lg"
        >
          <Save size={24} />
          CONCLUIR ENTRADA NO ESTOQUE
        </button>
      </form>
    </div>
  );
};

export default AddItem;
