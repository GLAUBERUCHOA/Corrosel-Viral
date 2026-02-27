'use client';
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Page() {
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [styleModel, setStyleModel] = useState('Escuro');
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [generatingImages, setGeneratingImages] = useState<boolean[]>([]);
  const [content, setContent] = useState(`5 Dicas para Dominar CSS Grid\n1. Defina seu container grid com display: grid.\n2. Use grid-template-columns para definir tamanhos das trilhas.\n3. Utilize a unidade fr para layouts flexíveis.\n4. Posicione itens explicitamente com grid-column e grid-row.\n5. Use grid-gap para espaçamento consistente.`);
  const [zoom, setZoom] = useState(100);
  const [activeMobileTab, setActiveMobileTab] = useState<'config' | 'preview'>('config');
  
  const [parsedSlides, setParsedSlides] = useState<{title: string, subtitle: string}[]>([
    { title: "5 Dicas para Dominar CSS Grid", subtitle: "Deslize para ver mais" },
    { title: "Defina seu container grid com display: grid.", subtitle: "" },
    { title: "Use grid-template-columns para definir tamanhos das trilhas.", subtitle: "" },
    { title: "Utilize a unidade fr para layouts flexíveis.", subtitle: "" },
    { title: "Posicione itens explicitamente com grid-column e grid-row.", subtitle: "" },
    { title: "Use grid-gap para espaçamento consistente.", subtitle: "" }
  ]);
  
  const slideCount = Math.max(1, parsedSlides.length);

  const [uploadedImages, setUploadedImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [targetUploadIndex, setTargetUploadIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandHandle, setBrandHandle] = useState<string>('');
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [customColor, setCustomColor] = useState('#6366f1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const individualFileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setCustomApiKey(savedKey);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomApiKey(val);
    if (val) {
      localStorage.setItem('gemini_api_key', val);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState(450);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = sidebarWidth;
    const startPosition = mouseDownEvent.clientX;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + mouseMoveEvent.clientX - startPosition;
      setSidebarWidth(Math.max(300, Math.min(newWidth, 800)));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => {
        const updated = [...prev];
        let newImageIndex = 0;
        for (let i = 0; i < updated.length; i++) {
          if (!updated[i] && newImageIndex < newImages.length) {
            updated[i] = newImages[newImageIndex];
            newImageIndex++;
          }
        }
        return updated;
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    const currentImages = uploadedImages.filter(img => img !== null);
    if (draggedIndex >= currentImages.length) return;
    
    const [draggedImage] = currentImages.splice(draggedIndex, 1);
    const targetIndex = Math.min(index, currentImages.length);
    
    currentImages.splice(targetIndex, 0, draggedImage);
    
    const newUploadedImages: (string | null)[] = [...currentImages];
    while (newUploadedImages.length < slideCount) {
      newUploadedImages.push(null);
    }
    
    setUploadedImages(newUploadedImages);
    setDraggedIndex(null);
  };

  const handleMassUploadClick = () => {
    if (!generateWithAI && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleIndividualUploadClick = (index: number) => {
    if (!generateWithAI && !uploadedImages[index]) {
      setTargetUploadIndex(index);
      if (individualFileInputRef.current) {
        individualFileInputRef.current.click();
      }
    }
  };

  const handleIndividualFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && targetUploadIndex !== null) {
      const newImage = URL.createObjectURL(files[0]);
      setUploadedImages(prev => {
        const updated = [...prev];
        updated[targetUploadIndex] = newImage;
        return updated;
      });
    }
    setTargetUploadIndex(null);
    if (individualFileInputRef.current) {
      individualFileInputRef.current.value = '';
    }
  };

  const handleBrandLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImage = URL.createObjectURL(files[0]);
      setBrandLogo(newImage);
    }
    if (brandLogoInputRef.current) {
      brandLogoInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImages(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const handleGenerateCarousel = async () => {
    if (!content.trim()) return;
    
    // Parse content locally without AI
    let blocks = content.split(/\n\s*\n/).filter(b => b.trim());
    if (blocks.length === 1) {
      blocks = content.split('\n').filter(b => b.trim());
    }

    const newSlides = blocks.map((block) => {
      const lines = block.split('\n').filter(l => l.trim());
      const title = lines[0].replace(/^(?:Slide\s*\d+\s*[:\-]?\s*|^\d+\.\s*|^-\s*|^:\s*)/i, '').trim();
      const subtitle = lines.slice(1).join(' ').trim();
      return { title, subtitle };
    });

    setParsedSlides(newSlides);
    
    setUploadedImages(prev => {
      const newImages = [...prev];
      while (newImages.length < newSlides.length) newImages.push(null);
      return newImages;
    });

    if (generateWithAI) {
      const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Chave da API Gemini não encontrada. Por favor, insira sua chave nas configurações.");
        console.error("Gemini API key is missing");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const newGenerating = Array(newSlides.length).fill(true);
      setGeneratingImages(newGenerating);
      
      const newImages = [...uploadedImages];
      while (newImages.length < newSlides.length) newImages.push(null);

      for (let i = 0; i < newSlides.length; i++) {
        try {
          const prompt = `Crie uma imagem no estilo Hiper-realismo Cinematográfico baseada no seguinte texto:
Título: ${newSlides[i].title}
Subtítulo: ${newSlides[i].subtitle}

Diretrizes obrigatórias (Diretriz Davinci):
- Realismo Cru: texturas humanas reais, poros visíveis, suor, rugas de expressão e fios de cabelo detalhados. Nada de peles perfeitamente lisas ou artificiais.
- Iluminação Dramática: Uso de Chiaroscuro (contraste forte entre luz e sombra) para criar profundidade e foco no sujeito principal.
- Metáforas Visuais: Em vez de conceitos abstratos, use objetos físicos e situações literais para representar sentimentos.
- Foco Seletivo: Uso de profundidade de campo (bokeh) para manter o protagonista nítido enquanto o fundo permanece suave.
- Consistência Texto-Imagem: A imagem deve ser uma extensão visual do texto, mostrando o impacto físico e literal da mensagem.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
              imageConfig: {
                aspectRatio: aspectRatio === '9:16' ? '9:16' : '3:4',
              }
            }
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64 = part.inlineData.data;
              const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64}`;
              newImages[i] = imageUrl;
              setUploadedImages([...newImages]);
              break;
            }
          }
        } catch (error) {
          console.error(`Error generating image for slide ${i}:`, error);
        } finally {
          setGeneratingImages(prev => {
            const updated = [...prev];
            updated[i] = false;
            return updated;
          });
        }
      }
    }
  };

  const handleEditClick = (index: number) => {
    setEditingSlideIndex(index);
    setEditTitle(parsedSlides[index].title);
    setEditSubtitle(parsedSlides[index].subtitle);
  };

  const handleSaveEdit = () => {
    if (editingSlideIndex !== null) {
      setParsedSlides(prev => {
        const updated = [...prev];
        updated[editingSlideIndex] = { title: editTitle, subtitle: editSubtitle };
        return updated;
      });
      setEditingSlideIndex(null);
    }
  };

  const getSlideDimensions = () => {
    if (aspectRatio === '9:16') return 'w-[315px] h-[560px]';
    return 'w-[400px] h-[500px]'; // 4:5
  };

  const getSlideTheme = () => {
    switch (styleModel) {
      case 'Moderno': 
        return { 
          bgClass: 'bg-gradient-to-br from-indigo-500 to-purple-600', 
          bgStyle: {}, 
          textClass: 'text-white', 
          subtextClass: 'text-indigo-100'
        };
      case 'Escuro': 
        return { 
          bgClass: 'bg-[#151525]', 
          bgStyle: {}, 
          textClass: 'text-white', 
          subtextClass: 'text-[#cbd5e1]'
        };
      case 'Vibrante': 
        return { 
          bgClass: 'bg-gradient-to-br from-orange-400 to-pink-500', 
          bgStyle: {}, 
          textClass: 'text-white', 
          subtextClass: 'text-orange-100'
        };
      case 'Minimalista': 
        return { 
          bgClass: 'bg-white', 
          bgStyle: {}, 
          textClass: 'text-slate-900', 
          subtextClass: 'text-slate-600'
        };
      case 'Regional': 
        return { 
          bgClass: 'bg-[#efe9dc]', 
          bgStyle: {}, 
          textClass: 'text-slate-900', 
          subtextClass: 'text-slate-700'
        };
      case 'Personalizado': {
        let hex = customColor.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substr(0, 2), 16) || 0;
        const g = parseInt(hex.substr(2, 2), 16) || 0;
        const b = parseInt(hex.substr(4, 2), 16) || 0;
        const isLight = ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128;
        
        return { 
          bgClass: '', 
          bgStyle: { backgroundColor: customColor }, 
          textClass: isLight ? 'text-slate-900' : 'text-white', 
          subtextClass: isLight ? 'text-slate-700' : 'text-slate-200'
        };
      }
      default: 
        return { 
          bgClass: 'bg-[#151525]', 
          bgStyle: {}, 
          textClass: 'text-white', 
          subtextClass: 'text-[#cbd5e1]'
        };
    }
  };

  const handleDownloadSingle = async (index: number) => {
    const slideElement = slideRefs.current[index];
    if (!slideElement) return;

    try {
      const dataUrl = await htmlToImage.toPng(slideElement, {
        quality: 1,
        pixelRatio: 3, // Higher quality
      });

      saveAs(dataUrl, `slide-${index + 1}.png`);
    } catch (error) {
      console.error("Erro ao baixar slide:", error);
      alert("Ocorreu um erro ao baixar o slide.");
    }
  };

  const handleDownloadAll = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const promises = parsedSlides.map(async (_, index) => {
        const slideElement = slideRefs.current[index];
        if (!slideElement) return null;

        const dataUrl = await htmlToImage.toPng(slideElement, {
          quality: 1,
          pixelRatio: 3,
        });

        // Remove the data:image/png;base64, part
        const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
        zip.file(`slide-${index + 1}.png`, base64Data, { base64: true });
      });

      await Promise.all(promises);

      const zipContent = await zip.generateAsync({ type: "blob" });
      saveAs(zipContent, "carrossel.zip");
    } catch (error) {
      console.error("Erro ao baixar todos os slides:", error);
      alert("Ocorreu um erro ao gerar o arquivo ZIP.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col overflow-hidden">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-20">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined">view_carousel</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">Criador de Carrossel</h2>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors" href="#">Painel</a>
            <a className="text-slate-900 dark:text-white text-sm font-medium" href="#">Workspace</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors" href="#">Modelos</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors" href="#">Salvos</a>
          </nav>
          <div className="h-6 w-px bg-slate-200 dark:bg-border-dark mx-2"></div>
          <button className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <span className="material-symbols-outlined text-[18px]">diamond</span>
            <span>Upgrade</span>
          </button>
          <div className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-slate-100 dark:ring-border-dark cursor-pointer" data-alt="User profile picture" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDq8gwC2gYGw_ekJwtNXfCb7lnyQKPM_v5edKwjUZbSvOHK3eYZUrn0j9Zsp7DnI1y5irWu2M9jQ8s27oX9C8VS53cOb9lolxw7slhfmMAVnMrVv7AoCeW5zlCoAc6K89RUNfLyHiuWD2nCP-hNqvC-N3TSMzM6wY_FpkfrN3zKZ4yMFoV73t4WFlcggVqWO74G61RtArjXqmpvvCjTcciK-vFVCqOgWfn7BHR7aqjPLuP0MvRVXmzESNUpycuKFMtYIohCwRulGoY")'}}></div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shrink-0">
        <button 
          onClick={() => setActiveMobileTab('config')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeMobileTab === 'config' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
        >
          Configurações
        </button>
        <button 
          onClick={() => setActiveMobileTab('preview')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeMobileTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
        >
          Visualização ({slideCount})
        </button>
      </div>

      <main className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        <aside 
          style={{ width: `${sidebarWidth}px` }}
          className={`scrollbar-custom flex flex-col border-r border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark overflow-y-auto shrink-0 z-10 relative transition-[width] duration-0 ${activeMobileTab !== 'config' ? 'max-md:hidden' : 'max-md:!w-full max-md:flex-1'}`}
        >
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary z-50 transition-colors hidden md:block"
          />
          <div className="p-6 space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Conteúdo</h3>
                <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Gerar com IA
                </button>
              </div>
              <div className="relative">
                <textarea 
                  className="w-full h-48 bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed" 
                  placeholder="Cole sua postagem de blog, artigo ou tópico aqui. Nós magicamente o transformaremos em um carrossel..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                ></textarea>
                <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium bg-slate-100 dark:bg-border-dark px-2 py-1 rounded">{content.length} caracteres</div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">Configuração</h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Proporção</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setAspectRatio('4:5')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all group relative ${aspectRatio === '4:5' ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10'}`}>
                    {aspectRatio === '4:5' && (
                      <div className="absolute -top-1.5 -right-1.5 size-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px] font-bold">check</span>
                      </div>
                    )}
                    <div className={`w-5 h-7 border-2 rounded-sm ${aspectRatio === '4:5' ? 'border-primary' : 'border-slate-400 dark:border-slate-500 group-hover:border-primary'}`}></div>
                    <span className={`text-xs font-medium ${aspectRatio === '4:5' ? 'text-primary' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`}>4:5</span>
                  </button>
                  <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all group relative ${aspectRatio === '9:16' ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10'}`}>
                    {aspectRatio === '9:16' && (
                      <div className="absolute -top-1.5 -right-1.5 size-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px] font-bold">check</span>
                      </div>
                    )}
                    <div className={`w-4 h-8 border-2 rounded-sm ${aspectRatio === '9:16' ? 'border-primary' : 'border-slate-400 dark:border-slate-500 group-hover:border-primary'}`}></div>
                    <span className={`text-xs font-medium ${aspectRatio === '9:16' ? 'text-primary' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`}>9:16</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Modelo de Estilo</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative cursor-pointer group" onClick={() => setStyleModel('Moderno')}>
                    <div className={`h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-end p-2 overflow-hidden ring-2 transition-all ${styleModel === 'Moderno' ? 'ring-primary' : 'ring-transparent group-hover:ring-primary'}`}>
                      <span className="text-[10px] text-white font-bold opacity-80">Moderno</span>
                      {styleModel === 'Moderno' && <div className="absolute top-2 right-2 size-2 bg-primary rounded-full"></div>}
                    </div>
                    {styleModel !== 'Moderno' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-xs font-bold">Aplicar</span>
                      </div>
                    )}
                  </div>
                  <div className="relative cursor-pointer group" onClick={() => setStyleModel('Escuro')}>
                    <div className={`h-16 rounded-lg bg-gradient-to-br from-slate-800 to-black border border-slate-700 flex items-end p-2 overflow-hidden ring-2 transition-all ${styleModel === 'Escuro' ? 'ring-primary' : 'ring-transparent group-hover:ring-primary'}`}>
                      <span className="text-[10px] text-white font-bold opacity-80">Escuro</span>
                      {styleModel === 'Escuro' && <div className="absolute top-2 right-2 size-2 bg-primary rounded-full"></div>}
                    </div>
                    {styleModel !== 'Escuro' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-xs font-bold">Aplicar</span>
                      </div>
                    )}
                  </div>
                  <div className="relative cursor-pointer group" onClick={() => setStyleModel('Vibrante')}>
                    <div className={`h-16 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-end p-2 overflow-hidden ring-2 transition-all ${styleModel === 'Vibrante' ? 'ring-primary' : 'ring-transparent group-hover:ring-primary'}`}>
                      <span className="text-[10px] text-white font-bold opacity-80">Vibrante</span>
                      {styleModel === 'Vibrante' && <div className="absolute top-2 right-2 size-2 bg-primary rounded-full"></div>}
                    </div>
                    {styleModel !== 'Vibrante' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-xs font-bold">Aplicar</span>
                      </div>
                    )}
                  </div>
                  <div className="relative cursor-pointer group" onClick={() => setStyleModel('Minimalista')}>
                    <div className={`h-16 rounded-lg bg-white border border-slate-200 flex items-end p-2 overflow-hidden ring-2 transition-all ${styleModel === 'Minimalista' ? 'ring-primary' : 'ring-transparent group-hover:ring-primary'}`}>
                      <span className="text-[10px] text-slate-800 font-bold opacity-80">Minimalista</span>
                      {styleModel === 'Minimalista' && <div className="absolute top-2 right-2 size-2 bg-primary rounded-full"></div>}
                    </div>
                    {styleModel !== 'Minimalista' && (
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-slate-800 text-xs font-bold">Aplicar</span>
                      </div>
                    )}
                  </div>
                  <div className="relative cursor-pointer group" onClick={() => setStyleModel('Regional')}>
                    <div className={`h-16 rounded-lg bg-[#efe9dc] border border-slate-200 flex items-end p-2 overflow-hidden ring-2 transition-all ${styleModel === 'Regional' ? 'ring-primary' : 'ring-transparent group-hover:ring-primary'}`}>
                      <span className="text-[10px] text-slate-800 font-bold opacity-80">Regional</span>
                      {styleModel === 'Regional' && <div className="absolute top-2 right-2 size-2 bg-primary rounded-full"></div>}
                    </div>
                    {styleModel !== 'Regional' && (
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-slate-800 text-xs font-bold">Aplicar</span>
                      </div>
                    )}
                  </div>
                  <div className="relative cursor-pointer group" onClick={() => setStyleModel('Personalizado')}>
                    <div className={`h-16 rounded-lg border border-slate-200 flex flex-col items-center justify-center overflow-hidden ring-2 transition-all ${styleModel === 'Personalizado' ? 'ring-primary' : 'ring-transparent group-hover:ring-primary'}`} style={{ backgroundColor: styleModel === 'Personalizado' ? customColor : '#f8fafc' }}>
                      {styleModel === 'Personalizado' ? (
                        <input 
                          type="color" 
                          value={customColor} 
                          onChange={(e) => setCustomColor(e.target.value)} 
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400">palette</span>
                      )}
                      <span className={`text-[10px] font-bold mt-1 ${styleModel === 'Personalizado' ? 'opacity-0' : 'text-slate-500'}`}>Personalizado</span>
                      {styleModel === 'Personalizado' && <div className="absolute top-2 right-2 size-2 bg-white rounded-full shadow-sm"></div>}
                    </div>
                    {styleModel !== 'Personalizado' && (
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-slate-800 text-xs font-bold">Aplicar</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Marca</label>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">Arroba / Nome do Perfil</label>
                  <input 
                    type="text" 
                    value={brandHandle}
                    onChange={(e) => setBrandHandle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="@seu.perfil"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">Logo do Perfil</label>
                  {brandLogo ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker">
                      <div className="size-8 rounded bg-slate-900 flex items-center justify-center overflow-hidden">
                        <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Logo Enviado</p>
                        <p className="text-xs text-slate-500">Visível em todos os slides</p>
                      </div>
                      <button 
                        onClick={() => setBrandLogo(null)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => brandLogoInputRef.current?.click()}
                      className="w-full py-3 flex flex-col items-center justify-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-surface-darker hover:text-primary hover:border-primary/50 transition-colors">
                      <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                      Fazer upload da Logo
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={brandLogoInputRef} 
                    onChange={handleBrandLogoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-border-dark">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Gerar imagens com IA</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Usa o modelo Gemini 2.5 Flash</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={generateWithAI}
                    onChange={(e) => setGenerateWithAI(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {generateWithAI && (
                <div className="space-y-2 mt-4 p-3 bg-slate-50 dark:bg-surface-darker rounded-lg border border-slate-200 dark:border-border-dark">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sua Chave da API Gemini (Opcional)</label>
                    {customApiKey && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">lock</span> Salva</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Insira sua chave para uso ilimitado. Ela é <strong>criptografada e salva apenas no seu navegador</strong>. Você só precisa inserir uma vez.
                  </p>
                  <input 
                    type="password" 
                    value={customApiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Cole sua chave AIzaSy... aqui"
                    className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-md px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="flex justify-end">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                      Pegar minha chave gratuita <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              )}

              <div className={`${generateWithAI ? 'opacity-50 pointer-events-none filter grayscale mt-4' : 'mt-4'} transition-all duration-300`}>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upload de Imagens</label>
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">Manual</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: slideCount }).map((_, index) => {
                    const num = index + 1;
                    return (
                    <div 
                      key={num} 
                      draggable={!generateWithAI && !!uploadedImages[index]}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      onClick={() => handleIndividualUploadClick(index)}
                      className={`aspect-[4/5] rounded border-2 border-dashed border-slate-200 dark:border-border-dark flex flex-col items-center justify-center gap-1 group transition-colors ${!generateWithAI ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5' : 'cursor-not-allowed'} overflow-hidden relative ${draggedIndex === index ? 'opacity-50' : ''}`}>
                      {uploadedImages[index] ? (
                        <>
                          <img src={uploadedImages[index] as string} alt={`Slide ${num}`} className="w-full h-full object-cover pointer-events-none" />
                          <button 
                            onClick={(e) => handleRemoveImage(index, e)}
                            className="absolute top-1 right-1 size-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                            title="Remover imagem"
                          >
                            <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-slate-400 text-sm">add</span>
                          <span className="text-[8px] font-bold text-slate-400">S{num}</span>
                        </>
                      )}
                    </div>
                    );
                  })}
                  <div className={`aspect-[4/5] rounded bg-slate-50 dark:bg-surface-darker flex items-center justify-center ${!generateWithAI ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : 'cursor-not-allowed'}`}>
                    <span className="material-symbols-outlined text-slate-300">more_horiz</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={individualFileInputRef}
                  onChange={handleIndividualFileUpload}
                />
                <button 
                  onClick={handleMassUploadClick}
                  disabled={generateWithAI}
                  className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors border ${!generateWithAI ? 'bg-white dark:bg-surface-dark text-slate-700 dark:text-white border-slate-200 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer' : 'bg-slate-100 dark:bg-surface-darker text-slate-400 border-slate-200 dark:border-border-dark cursor-not-allowed'}`}>
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  Upload em Massa ({slideCount} Slides)
                </button>
              </div>
            </div>
            <div className="mt-auto p-6 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker sticky bottom-0">
              <button 
                onClick={handleGenerateCarousel}
                disabled={!content.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined">auto_fix_high</span>
                Gerar Carrossel
              </button>
            </div>
          </div>
        </aside>
        <section className={`flex-1 flex flex-col bg-slate-100 dark:bg-background-dark overflow-hidden relative ${activeMobileTab !== 'preview' ? 'max-md:hidden' : 'max-md:flex max-md:flex-1'}`}>
          <div className="flex items-center justify-between px-4 md:px-8 py-4 shrink-0 overflow-x-auto no-scrollbar gap-4">
            <div className="flex items-center gap-1 bg-white dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-border-dark shadow-sm shrink-0">
              <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400" title="Desfazer">
                <span className="material-symbols-outlined text-[18px]">undo</span>
              </button>
              <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400" title="Refazer">
                <span className="material-symbols-outlined text-[18px]">redo</span>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-0.5"></div>
              <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400" title="Visualização em Grade">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button className="p-1.5 bg-slate-100 dark:bg-primary/20 text-primary rounded" title="Visualização em Carrossel">
                <span className="material-symbols-outlined text-[18px]">view_carousel</span>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-0.5"></div>
              <div className="flex items-center gap-1 px-1">
                <input 
                  className="w-16 md:w-24 accent-primary h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" 
                  type="range" 
                  min="25"
                  max="150"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-500 w-7 text-right font-mono">{zoom}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center justify-center size-9 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm" title="Compartilhar">
                <span className="material-symbols-outlined text-[18px]">share</span>
              </button>
              <button 
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap">
                {isDownloading ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] fill">download</span>
                )}
                <span className="hidden sm:inline">{isDownloading ? 'Baixando...' : 'Baixar Tudo'}</span>
              </button>
            </div>
          </div>
          <div className="scrollbar-custom flex-1 overflow-auto p-8">
            <div 
              className="origin-top-left transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom / 100})`, 
                width: `${100 * (100 / zoom)}%`,
              }}
            >
              <div className="flex flex-wrap justify-start gap-6 pb-24 max-w-[2300px]">
                {parsedSlides.map((parsedSlide, index) => {
                  const isFirst = index === 0;
                  
                  const defaultImages = [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBEDUi4qtUqrH8-KI69ZbnhQZq-Snc28JyH-ubsgnikhUANHvd-Xzq_3tg9gUpXgSoRx7EXYn6phYh54OADr8Nrn4HgeYKQXuhPIGBhGGy01d9j_isuAcbMkqXfpsXGtVb93CwkoA2WfjLbnuCcsr7TWIy6yjB145itn0mCY7d_aXtyA8r-LPlAqVeC08vNiWPEoEgnK_-UUzehpswrcOMG-LTNMw5WUHn2eDQfsufJyJM9_AcXije1XBQd7-MH75eHSL8NJy5x-_0",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAe0_vHIt2A3hxagDcxuywE2lsRTajBr4HnEBFFQ3WjkgVYCAFC7RU1esxK_dyfQXf5xv4hCzwJtU5tuAfDBspIPjNJrpmZmu5M1I468-WspjfQn8OKGwCkUW_tOqliplDMNx--mI2aDq0JzFtqvxFNLnbS-Zon3xqFCsV5eoYduNiHAqUbvMQiMlgbLkQD3n4d4A5kEZW4s4zkQ6FSgmJF5WAA_6zxXUlGB_2VEjPDMKnnY53RRXdcrZTEALC-0KIekgS5zv3fC-Y",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCCwW5LVWmQqUjL-DQzhrfxbNkADj5HCxpCntC6G0iBYkFzapKcF_UD_E7fmmiVyCYoZU5d9HsDTrROsHJcfIP6aE9UfXzDxfXA_CI639Qyt8Nve2yQhPbhO3L3wmc_4ODjd4WqA33umoJEKsneslNVRG_374l_HlEugXIeokASwj8LrQ0W5-0-vDCWZ_U4rXPHxrCXv6kPMiHqDi7XNgToQV8hhdrmQLB_UfwFNXangbzIOYmgyw26UN0sbXgE0RRa5VEXcW18m0A"
                  ];

                  const slide = {
                    title: parsedSlide.title || `Slide ${index + 1}`,
                    subtitle: parsedSlide.subtitle,
                    defaultImage: index < defaultImages.length ? defaultImages[index] : `https://picsum.photos/seed/${index}/800/1000`
                  };

                  const imageSrc = uploadedImages[index] || slide.defaultImage;
                  
                  const titleLength = slide.title.length;
                  const subtitleLength = slide.subtitle ? slide.subtitle.length : 0;
                  const totalLength = titleLength + subtitleLength;
                  
                  const theme = getSlideTheme();
                  let titleClass = isFirst ? `font-extrabold ${theme.textClass} leading-tight mb-2 ` : `font-bold ${theme.textClass} leading-snug mb-1.5 `;
                  let subtitleClass = `${theme.subtextClass} leading-relaxed mt-1 `;
                  
                  if (isFirst) {
                    if (titleLength > 100) titleClass += "text-xl";
                    else if (titleLength > 60) titleClass += "text-2xl";
                    else if (titleLength > 30) titleClass += "text-3xl";
                    else titleClass += "text-4xl";
                    subtitleClass += "text-base line-clamp-6";
                  } else {
                    if (totalLength > 450) {
                      titleClass += "text-xs";
                      subtitleClass += "text-[10px] leading-normal";
                    } else if (totalLength > 350) {
                      titleClass += "text-sm";
                      subtitleClass += "text-xs";
                    } else if (totalLength > 250) {
                      titleClass += "text-base";
                      subtitleClass += "text-sm";
                    } else if (totalLength > 150) {
                      titleClass += "text-lg";
                      subtitleClass += "text-sm";
                    } else if (totalLength > 80) {
                      titleClass += "text-xl";
                      subtitleClass += "text-base";
                    } else if (totalLength > 40) {
                      titleClass += "text-2xl";
                      subtitleClass += "text-base";
                    } else {
                      titleClass += "text-3xl";
                      subtitleClass += "text-base";
                    }
                  }
                  
                  return (
                    <div key={index} className={`relative group/slide ${getSlideDimensions()} shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-300`}>
                      <div 
                        ref={(el) => { slideRefs.current[index] = el; }}
                        className={`absolute inset-0 ${theme.bgClass}`}
                        style={theme.bgStyle}
                      >
                        <div 
                          className="absolute inset-x-0 top-0 h-[55%] w-full overflow-hidden group/image z-10"
                          style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)' }}
                        >
                          {(brandHandle || brandLogo) && (
                            <div className="absolute top-4 left-4 flex items-center gap-1 z-50 bg-[rgba(0,0,0,0.15)] backdrop-blur-md px-2 py-0.5 rounded-full border border-[rgba(255,255,255,0.05)]">
                              {brandLogo && (
                                <div className="size-3 rounded-full overflow-hidden bg-[#ffffff] opacity-90">
                                  <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
                                </div>
                              )}
                              {brandHandle && (
                                <span className="text-[6px] text-[rgba(255,255,255,0.7)] font-medium tracking-wide">{brandHandle}</span>
                              )}
                            </div>
                          )}
                          <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="block h-full w-full relative z-30">
                            <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover/image:scale-105" style={{backgroundImage: `url('${imageSrc}')`}}></div>
                          </a>
                        </div>
                        <div className={`absolute inset-x-0 bottom-0 h-[45%] w-full px-8 pt-4 pb-16 flex flex-col justify-center overflow-hidden z-20`}>
                          <div className="flex flex-col">
                            <h2 className={titleClass}>{slide.title}</h2>
                            {slide.subtitle && <p className={subtitleClass}>{slide.subtitle}</p>}
                          </div>
                          {index === 0 && (
                            <div className={`absolute bottom-6 left-8 right-6 flex items-center justify-between ${theme.textClass} opacity-40`}>
                              <span className="text-xs font-medium uppercase tracking-widest">Deslize para ver mais</span>
                              <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                            </div>
                          )}
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/slide:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px] z-[60] pointer-events-none">
                      <button 
                        onClick={() => handleEditClick(index)}
                        className="pointer-events-auto flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors min-w-[140px] justify-center">
                        <span className="material-symbols-outlined text-[18px]">edit</span> Editar Texto
                      </button>
                      <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="pointer-events-auto flex items-center gap-2 bg-white/10 text-white backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-colors min-w-[140px] justify-center">
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span> Ver Imagem
                      </a>
                      <button 
                        onClick={() => handleDownloadSingle(index)}
                        className="pointer-events-auto flex items-center gap-2 bg-white/10 text-white backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-colors min-w-[140px] justify-center">
                        <span className="material-symbols-outlined text-[18px]">download</span> Baixar
                      </button>
                    </div>
                  </div>
                );
                })}

                <button className={`w-[100px] ${aspectRatio === '9:16' ? 'h-[560px]' : 'h-[500px]'} shrink-0 rounded-2xl border-2 border-dashed border-slate-300 dark:border-border-dark flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group`}>
                  <div className="size-12 rounded-full bg-slate-200 dark:bg-surface-darker group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[24px]">add</span>
                  </div>
                  <span className="font-medium text-sm text-center px-2">Adicionar Slide</span>
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border border-slate-200 dark:border-border-dark rounded-full px-4 py-2 shadow-xl z-10">
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined">first_page</span></button>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
            <span className="text-xs font-mono text-slate-900 dark:text-white font-medium">Slide 1 / {slideCount}</span>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined">chevron_right</span></button>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined">last_page</span></button>
          </div>
        </section>
      </main>

      {/* Edit Text Modal */}
      {editingSlideIndex !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-border-dark">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Slide {editingSlideIndex + 1}</h3>
              <button 
                onClick={() => setEditingSlideIndex(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Título</label>
                <textarea 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24"
                  placeholder="Digite o título do slide..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subtítulo / Texto de Apoio</label>
                <textarea 
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32"
                  placeholder="Digite o texto de apoio (opcional)..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker flex justify-end gap-3">
              <button 
                onClick={() => setEditingSlideIndex(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-md shadow-primary/20 transition-all">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
