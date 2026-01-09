
import React, { useState, useEffect, useRef } from 'react';
import { MaterialCategory, InventoryItem, StockStatus, User } from '../types';
import { saveItem, getCurrentUser } from '../services/storageService';
import { Camera, Save, ArrowLeft, Image as ImageIcon, Trash2, UploadCloud, ChevronLeft, ChevronRight, Plus, X, RotateCcw } from 'lucide-react';

interface AddItemProps {
  onComplete: () => void;
}

const AddItem: React.FC<AddItemProps> = ({ onComplete }) => {
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray: File[] = Array.from(files);
      fileArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => [...prev, imageData]);
        setActivePhotoIndex(photos.length); // Focar na foto nova
        stopCamera();
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      if (activePhotoIndex >= newPhotos.length) {
        setActivePhotoIndex(Math.max(0, newPhotos.length - 1));
      }
      return newPhotos;
    });
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
    <div className="max-w-5xl mx-auto pb-10 animate-fadeIn">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg">
          <ImageIcon size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Cadastro de Material</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Entrada de estoque para {user?.companyId}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seção de Carrossel de Fotos */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-3 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            {/* Preview Principal */}
            <div 
              className={`aspect-square rounded-[2rem] overflow-hidden relative group bg-slate-50 border-2 border-dashed ${
                photos.length > 0 ? 'border-transparent' : 'border-slate-200'
              }`}
            >
              {photos.length > 0 ? (
                <>
                  <img 
                    src={photos[activePhotoIndex]} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    alt="Preview principal" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                    <button 
                      type="button"
                      onClick={() => removePhoto(activePhotoIndex)}
                      className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-red-600 transition-all font-black text-xs flex items-center gap-2"
                    >
                      <Trash2 size={18} /> REMOVER ESTA FOTO
                    </button>
                  </div>
                  
                  {photos.length > 1 && (
                    <>
                      <button 
                        type="button"
                        onClick={() => setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-xl text-slate-900 shadow-lg hover:scale-110 transition-transform"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActivePhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-xl text-slate-900 shadow-lg hover:scale-110 transition-transform"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                    <UploadCloud size={40} className="text-blue-400" />
                  </div>
                  <h4 className="text-slate-800 font-black text-lg">Nenhuma foto</h4>
                  <p className="text-slate-400 text-sm font-medium mt-2">Use os botões abaixo para adicionar fotos do material</p>
                </div>
              )}
            </div>

            {/* Ações de Foto */}
            <div className="grid grid-cols-2 gap-3 px-1">
              <button 
                type="button"
                onClick={startCamera}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-600 transition-all shadow-md active:scale-95"
              >
                <Camera size={18} /> TIRAR FOTO
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all border border-slate-200 shadow-sm active:scale-95"
              >
                <ImageIcon size={18} /> GALERIA
              </button>
            </div>

            {/* Miniaturas */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1 mt-2">
              {photos.map((photo, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all relative group ${
                    activePhotoIndex === idx ? 'border-blue-500 scale-95 shadow-lg' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <img src={photo} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {photos.length > 0 && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
              multiple 
            />
          </div>
        </div>

        {/* Formulário de Dados */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria do Material</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-800 transition-all"
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
                  placeholder="Ex: Quartzo Calacatta"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
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
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({...formData, width: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (cm)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor de Compra (Opcional)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  placeholder="0.00"
                  value={formData.purchaseValue}
                  onChange={(e) => setFormData({...formData, purchaseValue: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium h-24 transition-all focus:ring-4 focus:ring-blue-500/10"
                placeholder="Ex: Material com veios horizontais, faces polidas..."
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="flex gap-4">
             <button 
              type="submit" 
              className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 shadow-2xl active:scale-95 transition-all text-lg group"
            >
              <Save size={24} className="group-hover:rotate-12 transition-transform" />
              SALVAR NO ESTOQUE
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Câmera */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-[3/4] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-800">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            {/* Overlay da Câmera UI */}
            <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/30 rounded-3xl pointer-events-none"></div>

            <button 
              onClick={stopCamera}
              className="absolute top-6 right-6 bg-black/50 text-white p-3 rounded-full hover:bg-red-500 transition-all backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mt-8 flex items-center gap-8">
            <button 
              onClick={stopCamera}
              className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-all"
            >
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={takePhoto}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-8 border-slate-300"
            >
              <div className="w-16 h-16 bg-slate-900 rounded-full"></div>
            </button>
            <div className="w-16 h-16"></div> {/* Spacer for symmetry */}
          </div>
          
          <p className="mt-6 text-white/50 text-[10px] font-black uppercase tracking-widest">Aponte para a chapa e clique no botão branco</p>
        </div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AddItem;
