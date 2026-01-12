
import React, { useState, useEffect, useRef } from 'react';
import { MaterialCategory, InventoryItem, StockStatus, User } from '../types';
import { saveItem } from '../services/storageService';
import { Camera, Save, Image as ImageIcon, Trash2, UploadCloud, ChevronLeft, ChevronRight, Plus, X, RotateCcw, MonitorPlay, MapPin } from 'lucide-react';

interface AddItemProps {
  onComplete: () => void;
  user: User;
  companyId: string;
}

const AddItem: React.FC<AddItemProps> = ({ onComplete, user, companyId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [formData, setFormData] = useState({
    category: MaterialCategory.GRANITO,
    commercialName: '',
    thickness: '2cm',
    width: 0,
    height: 0,
    location: '',
    supplier: '',
    purchaseValue: '',
    observations: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showFlash, setShowFlash] = useState(false);

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
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }, 
        audio: false 
      }).catch(() => {
        return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
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
      
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 150);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        setPhotos(prev => [...prev, imageData]);
        setActivePhotoIndex(photos.length);
        if ('vibrate' in navigator) navigator.vibrate(50);
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
    if (!formData.commercialName || !formData.width || !formData.height) {
      alert('Por favor, preencha os campos obrigatórios (Nome e Medidas).');
      return;
    }

    if (photos.length === 0) {
      alert('Por favor, adicione pelo menos uma foto da chapa para registro visual.');
      return;
    }

    const area = (formData.width * formData.height) / 10000;
    const newItem: InventoryItem = {
      id: `CHP-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId: companyId,
      category: formData.category,
      commercialName: formData.commercialName,
      thickness: formData.thickness,
      originalWidth: formData.width,
      originalHeight: formData.height,
      currentWidth: formData.width,
      currentHeight: formData.height,
      location: formData.location,
      totalArea: area,
      availableArea: area,
      supplier: formData.supplier,
      entryDate: new Date().toISOString().split('T')[0],
      purchaseValue: Number(formData.purchaseValue) || undefined,
      observations: formData.observations,
      photos: photos,
      status: StockStatus.INTEIRA,
      history: [],
      lastOperatorId: user.id,
      lastOperatorName: user.name,
      lastUpdatedAt: new Date().toISOString()
    };

    saveItem(newItem);
    onComplete();
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-fadeIn px-2 sm:px-0">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl">
          <UploadCloud size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Novo Material</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Entrada de estoque e registro fotográfico</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className={`aspect-square rounded-[2rem] overflow-hidden relative group bg-slate-50 border-2 border-dashed ${photos.length > 0 ? 'border-transparent' : 'border-slate-200'}`}>
              {photos.length > 0 ? (
                <>
                  <img src={photos[activePhotoIndex]} className="w-full h-full object-cover" alt="Visualização" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button type="button" onClick={() => removePhoto(activePhotoIndex)} className="bg-white/90 backdrop-blur-md text-red-500 p-3 rounded-2xl shadow-xl hover:bg-red-500 hover:text-white transition-all border border-red-100">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  {photos.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                      <button type="button" onClick={() => setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))} className="pointer-events-auto bg-white/80 backdrop-blur-sm p-3 rounded-2xl text-slate-900 shadow-lg hover:scale-110 transition-transform border border-white/50">
                        <ChevronLeft size={24} />
                      </button>
                      <button type="button" onClick={() => setActivePhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))} className="pointer-events-auto bg-white/80 backdrop-blur-sm p-3 rounded-2xl text-slate-900 shadow-lg hover:scale-110 transition-transform border border-white/50">
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] text-white font-black uppercase tracking-widest border border-white/20">
                    {activePhotoIndex + 1} / {photos.length} FOTOS
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                    <Camera size={48} className="text-blue-400" />
                  </div>
                  <h4 className="text-slate-900 font-black text-xl tracking-tight">Registro Visual Obrigatório</h4>
                  <p className="text-slate-400 text-xs font-bold mt-2 leading-relaxed">Adicione fotos reais da chapa para controle de veios e tonalidade.</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={startCamera} className="flex flex-col items-center justify-center gap-2 bg-slate-900 text-white p-6 rounded-[2rem] hover:bg-blue-600 transition-all shadow-xl group active:scale-95">
                <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform"><Camera size={28} /></div>
                <span className="font-black text-[10px] uppercase tracking-widest">Usar Câmera</span>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-600 p-6 rounded-[2rem] border border-slate-200 hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all shadow-sm group active:scale-95">
                <div className="bg-slate-200 p-3 rounded-2xl group-hover:scale-110 transition-transform"><ImageIcon size={28} /></div>
                <span className="font-black text-[10px] uppercase tracking-widest">Galeria</span>
              </button>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1 mt-2">
                {photos.map((photo, idx) => (
                  <div key={idx} onClick={() => setActivePhotoIndex(idx)} className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-4 transition-all relative ${activePhotoIndex === idx ? 'border-blue-500 scale-105 shadow-xl' : 'border-white shadow-sm grayscale-[0.3]'}`}>
                    <img src={photo} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 w-20 h-20 rounded-2xl border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all bg-slate-50">
                  <Plus size={32} />
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Classificação</label>
                <select 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold text-slate-900 transition-all outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as MaterialCategory})}
                >
                  {Object.values(MaterialCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nome do Material</label>
                <input 
                  type="text" 
                  placeholder="Ex: Granito Branco Siena"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 font-bold transition-all outline-none"
                  value={formData.commercialName}
                  onChange={(e) => setFormData({...formData, commercialName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Espessura</label>
                <input 
                  type="text" 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none"
                  value={formData.thickness}
                  onChange={(e) => setFormData({...formData, thickness: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Largura (cm)</label>
                <input 
                  type="number" 
                  className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-blue-600 text-xl focus:border-blue-600 transition-all outline-none shadow-inner"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({...formData, width: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Altura (cm)</label>
                <input 
                  type="number" 
                  className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-blue-600 text-xl focus:border-blue-600 transition-all outline-none shadow-inner"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Localização Física</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none"
                    placeholder="Ex: Corredor A, Palito 3"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fornecedor</label>
                <input 
                  type="text" 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Observações Técnicas</label>
              <textarea 
                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-medium h-32 transition-all focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none resize-none"
                placeholder="Ex: Material com veios horizontais, faces polidas..."
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="flex gap-4">
             <button type="submit" className="flex-1 bg-slate-900 text-white py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:bg-emerald-600 shadow-2xl active:scale-95 transition-all text-xl group relative overflow-hidden">
              <Save size={28} />
              CONFIRMAR ENTRADA
            </button>
          </div>
        </div>
      </form>

      {isCameraOpen && (
        <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center animate-fadeIn overflow-hidden">
          <div className="w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 z-10">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><Camera size={20} className="text-white" /></div>
               <div>
                 <p className="text-white font-black text-xs uppercase tracking-widest">Câmera de Produção</p>
                 <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest">Modo Alta Definição</p>
               </div>
             </div>
             <button onClick={stopCamera} className="bg-white/10 backdrop-blur-xl text-white p-3 rounded-2xl hover:bg-red-500 transition-all border border-white/10"><X size={24} /></button>
          </div>
          <div className="relative w-full h-full flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover sm:rounded-[3rem] sm:w-[90%] sm:h-[80%] sm:border-8 sm:border-white/10" />
            {showFlash && <div className="absolute inset-0 bg-white z-50 animate-pulse"></div>}
          </div>
          <div className="w-full p-10 flex items-center justify-center gap-10 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0">
            <button onClick={stopCamera} className="w-16 h-16 bg-white/10 backdrop-blur-2xl text-white rounded-3xl flex items-center justify-center hover:bg-red-500 transition-all border border-white/10 active:scale-90"><RotateCcw size={28} /></button>
            <button onClick={takePhoto} className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] active:scale-90 transition-all border-8 border-slate-900 ring-4 ring-white"><div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center"></div></button>
            <div className="relative group">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl text-white rounded-3xl flex items-center justify-center border border-white/10 overflow-hidden">
                {photos.length > 0 ? <img src={photos[photos.length - 1]} className="w-full h-full object-cover" alt="" /> : <MonitorPlay size={24} className="opacity-40" />}
              </div>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AddItem;
