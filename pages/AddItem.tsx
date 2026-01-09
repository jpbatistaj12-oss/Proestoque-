
import React, { useState, useEffect, useRef } from 'react';
import { MaterialCategory, InventoryItem, StockStatus, User } from '../types';
import { saveItem, getCurrentUser } from '../services/storageService';
import { Camera, Save, ArrowLeft, Image as ImageIcon, Trash2, UploadCloud } from 'lucide-react';

interface AddItemProps {
  onComplete: () => void;
}

const AddItem: React.FC<AddItemProps> = ({ onComplete }) => {
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos([event.target.result as string]);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.commercialName || !formData.width || !formData.height) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    if (photos.length === 0) {
      alert('Por favor, adicione pelo menos uma foto da chapa.');
      return;
    }

    const area = (formData.width * formData.height) / 10000;
    const newItem: InventoryItem = {
      id: `CHP-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId: user.companyId,
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
    <div className="max-w-4xl mx-auto pb-10 animate-fadeIn">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg">
          <ImageIcon size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Nova Chapa</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Importação de Material para {user?.companyId}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção de Upload de Foto */}
        <div className="space-y-6">
          <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-full min-h-[400px] flex flex-col">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 rounded-[2rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center group ${
                photos.length > 0 ? 'border-transparent p-0' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
              
              {photos.length > 0 ? (
                <div className="relative w-full h-full">
                  <img 
                    src={photos[0]} 
                    className="w-full h-full object-cover rounded-[2rem] shadow-inner" 
                    alt="Preview" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl hover:scale-110 transition-transform font-black text-xs flex items-center gap-2"
                      >
                        <Camera size={20} /> ALTERAR FOTO
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPhotos([]); }}
                        className="bg-red-500 text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition-transform"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <UploadCloud size={40} className="text-slate-300 group-hover:text-blue-500" />
                  </div>
                  <h4 className="text-slate-800 font-black text-lg">Clique para importar a foto</h4>
                  <p className="text-slate-400 text-sm font-medium mt-2 max-w-[200px]">Tire uma foto da chapa inteira na oficina para melhor rastreio</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de Dados */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-800"
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
                  placeholder="Ex: Preto São Gabriel"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold"
                  value={formData.commercialName}
                  onChange={(e) => setFormData({...formData, commercialName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Espessura</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={formData.thickness}
                  onChange={(e) => setFormData({...formData, thickness: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Largura (cm)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-blue-600"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({...formData, width: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (cm)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-blue-600"
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

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium h-24"
                placeholder="Ex: Chapa com pequena fissura no canto inferior esquerdo..."
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
              ></textarea>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 shadow-2xl active:scale-95 transition-all text-lg group"
          >
            <Save size={24} className="group-hover:rotate-12 transition-transform" />
            CADASTRAR NO ESTOQUE
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItem;
