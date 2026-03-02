'use client';
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const getIuryPrompt = (toneMode: string, dynamicInstructions: Record<string, string>) => {
  const selectedToneInstruction = dynamicInstructions[toneMode] ||
    'Modo PROVOCATIVO (O Soco no Estômago): Focado em quebrar o ego, expor o erro e gerar desconforto. Seu tom é irônico, inteligente e instigador. Ideal para criar identificação extrema pela dor (topo de funil).';

  const globalInstruction = dynamicInstructions['GLOBAL_INSTRUCTIONS'] ||
    `🧠 1. PERFIL COGNITIVO DO IURY
Você é um Diretor de Criação e Engenheiro Narrativo. NUNCA resuma textos; você usa a ideia do usuário apenas como uma SEMENTE para criar narrativas autorais, densas e poderosas.

Sua mente opera em camadas (Visceral para prender atenção, Intelecto com repertório de biografia/história, e Prática no último slide).

✍️ 3. DIRETRIZES DE ESCRITA
- Títulos SEMPRE em CAIXA ALTA, com expressões autênticas e zero 'marketinglês'.
- Formatação de Tópicos: Quando houver listas ou dicas (bullets), você DEVE quebrar a linha sistematicamente (um item abaixo do outro).

📏 4. REGRAS DE LAYOUT E ESTRUTURA (RESTRIÇÃO MORTAL)
Slide 01 (CAPA): Manchete visceral em CAIXA ALTA + Contexto. PROIBIDO SUBTÍTULO. Somente Título.
Slides Seguintes: [TÍTULO] curto + [SUBTÍTULO] narrativo longo.
LIMITE ABSOLUTO: MÁXIMO DE 250 CARACTERES POR SLIDE (Título + Subtítulo). Escreva com poder, mas conciso. Em hipótese alguma passe desse limite.

EXEMPLO DE OUTPUT ESPERADO COM LISTAS:
SLIDE 01:
[TÍTULO]: O COMPLEXO DE DEUS QUE MATA O SEU LUCRO.
[SUBTÍTULO]: 
SLIDE 02:
[TÍTULO]: A SÍNDROME DA BLOCKBUSTER.
[SUBTÍTULO]: Em 2000, eles riram da Netflix. A arrogância cega. O mercado não liga para sua soberba acadêmica.
SLIDE 03:
[TÍTULO]: COMO MUDAR O JOGO AGORA.
[SUBTÍTULO]: 
- Desça do pedestal;
- Exponha a falha calculada;
- Aprenda a vender ou morra esquecido.

🚨 REGRA CRÍITCA DE FORMATAÇÃO:
PROIBIDO gerar qualquer texto fora das tags [TÍTULO]: e [SUBTÍTULO]:.
NUNCA repita o texto do título dentro do subtítulo.
Sempre separe slides com a tag nativa (Ex: SLIDE 01:).`;

  return `${globalInstruction}

🎯 DIRETRIZ DE TOM ATUAL:
Você deve OBRIGATORIAMENTE se portar sob este tom em todo o texto gerado:
[ ${selectedToneInstruction} ]

CRIANDO COM BASE NO SEU TOM SELECIONADO ACIMA, metamorfoseie brutalmente o seguinte rascunho:
`;
};

const getImagePrompt = (nicheMode: string, dynamicImageInstructions: Record<string, string>, title: string, subtitle: string) => {
  const globalInstruction = dynamicImageInstructions['GLOBAL_IMAGE'] ||
    `🎨 1. PADRÃO ESTÉTICO OBRIGATÓRIO:
Você opera sempre no estilo "Theatrical Dark Cinematic" (Cinematográfico Escuro e Teatral) com foco em Chiaroscuro (contraste dramático) e efeito Bokeh (fundo elegantemente distorcido).

📸 2. REGRAS DE DIREÇÃO DE ARTE:
- Ângulos: Evite sempre visões padrão (eye-level). Alterne entre Low Angle (de baixo pra cima, denota poder/imposição), High Angle (vulnerabilidade), Over-the-shoulder e Close-ups detalhados.
- Iluminação: Luzes de recorte dramáticas, sombras marcadas. Iluminação lateral misteriosa.
- Metáforas: NUNCA crie interpretações literais e óbvias do texto. Se o texto for sobre "ganhar dinheiro", NÃO crie de pessoas segurando dinheiro ou cifrões. Crie algo como: "A close-up of a sleek black mechanical watch with gold gears turning amidst dark smoke".

🧠 3. COMPOSIÇÃO:
- Cores: Paleta Industrial e Terrosa (Preto, chumbo, ouro envelhecido, cobre escuro, verde musgo).
- Sempre inclua: "High end, 8k resolution, raw photo, highly detailed, sharp focus" no final do seu prompt.`;

  const nicheInstruction = dynamicImageInstructions[nicheMode] ||
    'Crie algo focado em cinematografia dark de altíssimo nível com as regras gerais acima.';

  return `Crie UMA ÚNICA IMAGEM de "Cinematografia Multimodal" de altíssimo nível, baseada na seguinte semente emocional do texto do slide:
Título do Slide: "${title}"
Subtítulo: "${subtitle}"

INSTRUÇÕES GERAIS DE ARTE (BASE):
${globalInstruction}

DIRETRIZ ESPECÍFICA DO NICHO ESCOLHIDO (IMPRESCINDÍVEL):
${nicheInstruction}

5. Restrição Absoluta de Textos Nativos: É VERBEMENTE PROIBIDO criar qualquer frase, palavra ou explicação legível ilustrada dentro da arte! A imagem PRECISA ser muda. O texto longo será redigido por nós por cima. 
6. Composição Vertical (Top-Heavy) - LEI INQUEBRÁVEL: O texto descritivo ocupará quase toda a METADE INFERIOR (Bottom Half) do slide. Portanto, posicione os objetos centrais, personagens e elementos dramáticos EXCLUSIVAMENTE NA METADE SUPERIOR (Top Half). A metade inferior DEVE SER um imenso e pesado VAZIO ESCURO (Negative Space), garantindo contraste absoluto para leitura.`;
};

export default function CarouselGenerator({ onLogout }: { onLogout: () => void }) {
  const [dbPrompts, setDbPrompts] = useState<Record<string, string>>({});
  const [dbLabels, setDbLabels] = useState<{ key: string, label: string }[]>([]);
  const [dbImagePrompts, setDbImagePrompts] = useState<Record<string, string>>({});
  const [dbImageLabels, setDbImageLabels] = useState<{ key: string, label: string }[]>([]);
  const [imageNiche, setImageNiche] = useState('SAUDE');
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [styleModel, setStyleModel] = useState('Escuro');
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [generatingImages, setGeneratingImages] = useState<boolean[]>([]);
  const [isIuryMode, setIsIuryMode] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [toneMode, setToneMode] = useState('PROVOCATIVO');
  const [content, setContent] = useState('');
  const [zoom, setZoom] = useState(100);
  const [activeMobileTab, setActiveMobileTab] = useState<'config' | 'preview'>('config');
  const [saveDefaults, setSaveDefaults] = useState(true);

  const [parsedSlides, setParsedSlides] = useState<{ title: string, subtitle: string }[]>([
    { title: '', subtitle: '' }
  ]);

  const slideCount = React.useMemo(() => {
    if (!content.trim()) return Math.max(1, parsedSlides.length);
    let blocks = content.split(/\n\s*\n/).filter(b => b.trim());
    if (blocks.length === 1) {
      blocks = content.split('\n').filter(b => b.trim());
    }
    return Math.max(1, blocks.length);
  }, [content, parsedSlides.length]);

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
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const individualFileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setCustomApiKey(savedKey);
    }

    const savedPrefs = localStorage.getItem('carousel_preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        if (prefs.saveDefaults !== undefined) {
          setSaveDefaults(prefs.saveDefaults);
        }

        // Se na última sessão o toggle estava ligado, os dados existem:
        if (prefs.brandHandle) setBrandHandle(prefs.brandHandle);
        if (prefs.brandLogo) setBrandLogo(prefs.brandLogo);
        if (prefs.styleModel) setStyleModel(prefs.styleModel);
        if (prefs.customColor) setCustomColor(prefs.customColor);

        if (prefs.aspectRatio) setAspectRatio(prefs.aspectRatio);
        if (prefs.content) setContent(prefs.content);
        if (prefs.toneMode) setToneMode(prefs.toneMode);
        if (prefs.parsedSlides && Array.isArray(prefs.parsedSlides) && prefs.parsedSlides.length > 0) {
          setParsedSlides(prefs.parsedSlides);
        }
      } catch (e) {
        console.error("Failed to parse saved preferences", e);
      }
    }
    isInitialized.current = true;

    const fetchSettings = async () => {
      try {
        const [promptsRes, imageRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/image-settings')
        ]);

        const promptsData = await promptsRes.json();
        const imageData = await imageRes.json();

        if (promptsData.success && promptsData.prompts) {
          const instructionsMap: Record<string, string> = {};
          const labelsArr: { key: string, label: string }[] = [];
          promptsData.prompts.forEach((p: any) => {
            instructionsMap[p.toneKey] = p.instruction;
            labelsArr.push({ key: p.toneKey, label: p.label });
          });
          setDbPrompts(instructionsMap);
          setDbLabels(labelsArr);
        }

        if (imageData.success && imageData.settings) {
          const imgInstructionsMap: Record<string, string> = {};
          const imgLabelsArr: { key: string, label: string }[] = [];
          imageData.settings.forEach((s: any) => {
            imgInstructionsMap[s.nicheKey] = s.instruction;
            imgLabelsArr.push({ key: s.nicheKey, label: s.label });
          });
          setDbImagePrompts(imgInstructionsMap);
          setDbImageLabels(imgLabelsArr);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic dynamic configurations:", err);
      }
    };
    fetchSettings();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      const prefs: any = {
        aspectRatio,
        content,
        parsedSlides,
        saveDefaults,
        toneMode
      };

      if (saveDefaults) {
        prefs.brandHandle = brandHandle;
        prefs.brandLogo = brandLogo;
        prefs.styleModel = styleModel;
        prefs.customColor = customColor;
      } else {
        prefs.brandHandle = '';
        prefs.brandLogo = null;
        prefs.styleModel = 'Escuro';
        prefs.customColor = '#6366f1';
      }

      try {
        localStorage.setItem('carousel_preferences', JSON.stringify(prefs));
      } catch (e) {
        // Se a logo for MT gigante (exceder 5MB base64 de localStorage), zera ela pra prevenir crash do app inteiro
        console.warn("Storage limit exceeded, resetting logo", e);
        prefs.brandLogo = null;
        localStorage.setItem('carousel_preferences', JSON.stringify(prefs));
      }
    }
  }, [brandHandle, brandLogo, styleModel, customColor, aspectRatio, content, parsedSlides, saveDefaults, toneMode]);

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
        while (updated.length < slideCount) updated.push(null);

        let newImageIndex = 0;
        for (let i = 0; i < updated.length; i++) {
          if (!updated[i] && newImageIndex < newImages.length) {
            updated[i] = newImages[newImageIndex];
            newImageIndex++;
          }
        }

        while (newImageIndex < newImages.length) {
          updated.push(newImages[newImageIndex]);
          newImageIndex++;
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

  const handleIndividualUploadAction = (index: number) => {
    setTargetUploadIndex(index);
    if (individualFileInputRef.current) {
      individualFileInputRef.current.click();
    }
  };

  const handleIndividualFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && targetUploadIndex !== null) {
      const file = files[0];
      const reader = new FileReader();
      const currentTargetIndex = targetUploadIndex;
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setUploadedImages(prev => {
            const updated = [...prev];
            updated[currentTargetIndex] = e.target!.result as string;
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    }
    setTargetUploadIndex(null);
    if (individualFileInputRef.current) {
      individualFileInputRef.current.value = '';
    }
  };

  const handleBrandLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setBrandLogo(e.target.result);
        }
      };
      reader.readAsDataURL(file);
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

  const processTextIntoSlides = (textToParse: string) => {
    // Quebra o texto garantidamente pela separação de slide (ex: SLIDE 01:, Slide 1 -)
    // Usamos um lookahead para manter o bloco do slide inteiro ou dar um fallback seguro.
    let blocks = textToParse.split(/(?=SLIDE\s*\d+[:\-]?)/i).filter(b => b.trim());

    // Fallback: se a IA não gerou a palavra SLIDE, tentamos quebrar por linha dupla.
    if (blocks.length === 0 || (blocks.length === 1 && !/SLIDE\s*\d+/i.test(blocks[0]))) {
      blocks = textToParse.split(/\n\s*\n/).filter(b => b.trim());
      // Se não houver linha dupla, quebramos pelas tags de título atiradas juntas
      if (blocks.length === 1) {
        blocks = textToParse.split(/(?=\[T[ÍI]TULO\]:)/i).filter(b => b.trim());
      }
    }

    const newSlides = blocks.map((block) => {
      let title = '';
      let subtitle = '';

      // Tenta capturar as tags independentemente da quebra de linha.
      // O [TÍTULO]: pega tudo até encontrar a quebra de [SUBTÍTULO]: ou final da string
      const titleMatch = block.match(/\[?T[ÍI]TULO\]?:\s*([\s\S]*?)(?=\[SUBT[ÍI]TULO\]:|$)/i);
      // O [SUBTÍTULO]: pega tudo após ele (dentro desse bloco em específico)
      const subtitleMatch = block.match(/\[?SUBT[ÍI]TULO\]?:\s*([\s\S]*?)$/i);

      if (titleMatch || subtitleMatch) {
        title = titleMatch ? titleMatch[1].replace(/^(?:SLIDE\s*\d+\s*[:\-]?\s*)/i, '').trim() : '';
        subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

        // Anti-Repetição: Se o subtítulo for misteriosamente igual ao título, limpamos ele.
        if (title.toLowerCase() === subtitle.toLowerCase()) {
          subtitle = '';
        }
      } else {
        // Fallback genérico para texto cru (sem as tags exigidas)
        // Pega a primeira linha como título e o resto como subtítulo
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          title = lines[0].replace(/^(?:SLIDE\s*\d+\s*[:\-]?\s*|^\d+\.\s*|^-\s*|^:\s*)/i, '').trim();
          subtitle = lines.slice(1).join(' ').trim();
        }
      }
      return { title, subtitle };
    });

    setParsedSlides(newSlides);

    setUploadedImages(prev => {
      const newImages = [...prev];
      while (newImages.length < newSlides.length) newImages.push(null);
      return newImages;
    });

    return newSlides;
  };

  const executarIury = async () => {
    if (!content.trim()) return;

    const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Chave da API Gemini não encontrada. Por favor, insira sua chave nas configurações para usar o Modo Iury.");
      return;
    }

    setIsGeneratingText(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${getIuryPrompt(toneMode, dbPrompts)}\n\nRASCUNHO DO USUÁRIO:\n${content}`,
      });

      const generatedText = response.text || '';
      setContent(generatedText); // Sobrescreve a caixa
      return processTextIntoSlides(generatedText); // Processa e retorna
    } catch (error) {
      console.error("Erro ao gerar Modo Iury:", error);
      alert("Ocorreu um erro ao processar o texto pelo Iury. Tente novamente.");
      return null;
    } finally {
      setIsGeneratingText(false);
    }
  };

  const regenerateImageForSlide = async (index: number) => {
    const slide = parsedSlides[index];
    if (!slide) return;

    const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Chave da API Gemini não encontrada. Insira sua chave nas configurações para regerar imagens com IA.");
      return;
    }

    setGeneratingImages(prev => {
      const updated = [...prev];
      while (updated.length <= index) updated.push(false);
      updated[index] = true;
      return updated;
    });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = getImagePrompt(imageNiche, dbImagePrompts, slide.title, slide.subtitle);

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
          setUploadedImages(prev => {
            const updated = [...prev];
            while (updated.length <= index) updated.push(null);
            updated[index] = imageUrl;
            return updated;
          });
          break;
        }
      }
    } catch (error) {
      console.error("Erro ao regerar imagem:", error);
      alert("Falha ao regerar a imagem. Tente novamente.");
    } finally {
      setGeneratingImages(prev => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };

  const handleGenerateCarousel = async () => {
    if (!content.trim()) return;

    let newSlides: { title: string, subtitle: string }[] = [];

    if (isIuryMode) {
      const generated = await executarIury();
      if (!generated) return;
      newSlides = generated;
    } else {
      newSlides = processTextIntoSlides(content);
    }

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
          const prompt = getImagePrompt(imageNiche, dbImagePrompts, newSlides[i].title, newSlides[i].subtitle);

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
              setUploadedImages(prev => {
                const updated = [...prev];
                while (updated.length < newSlides.length) updated.push(null);
                updated[i] = imageUrl;
                return updated;
              });
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
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display h-[100dvh] flex flex-col overflow-hidden">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-20">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined">view_carousel</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">Carrossel Viral Lab</h2>
        </div>
        <div className="flex flex-1 justify-end gap-4 items-center">
          <button
            onClick={onLogout}
            className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden sm:inline">Sair</span>
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-border-dark"></div>
          <div className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-slate-100 dark:ring-border-dark cursor-pointer" data-alt="User profile picture" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDq8gwC2gYGw_ekJwtNXfCb7lnyQKPM_v5edKwjUZbSvOHK3eYZUrn0j9Zsp7DnI1y5irWu2M9jQ8s27oX9C8VS53cOb9lolxw7slhfmMAVnMrVv7AoCeW5zlCoAc6K89RUNfLyHiuWD2nCP-hNqvC-N3TSMzM6wY_FpkfrN3zKZ4yMFoV73t4WFlcggVqWO74G61RtArjXqmpvvCjTcciK-vFVCqOgWfn7BHR7aqjPLuP0MvRVXmzESNUpycuKFMtYIohCwRulGoY")' }}></div>
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

      <main className="flex flex-1 min-h-0 overflow-hidden relative flex-col md:flex-row">
        <aside
          style={{ width: `${sidebarWidth}px` }}
          className={`scrollbar-custom flex flex-col min-h-0 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark overflow-y-auto shrink-0 z-10 relative transition-[width] duration-0 ${activeMobileTab !== 'config' ? 'max-md:hidden' : 'max-md:!w-full max-md:flex-1'}`}
        >
          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary z-50 transition-colors hidden md:block"
          />
          <div className="p-6 space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Conteúdo</h3>
              </div>

              <div className="flex bg-slate-100 dark:bg-surface-darker rounded-lg p-1.5 shrink-0 gap-1 border border-slate-200 dark:border-border-dark">
                <button
                  onClick={() => setIsIuryMode(false)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${!isIuryMode ? 'bg-white dark:bg-surface-dark text-slate-800 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Modo Manual
                </button>
                <button
                  onClick={() => setIsIuryMode(true)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${isIuryMode ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Modo Iury
                </button>
              </div>

              {isIuryMode && (
                <div className="space-y-2 pt-1 pb-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">tune</span> Estratégia Narrativa
                  </label>
                  <select
                    value={toneMode}
                    onChange={(e) => setToneMode(e.target.value)}
                    className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer font-medium"
                  >
                    {dbLabels.filter(label => label.key !== 'GLOBAL_INSTRUCTIONS').length > 0 ? (
                      dbLabels.filter(label => label.key !== 'GLOBAL_INSTRUCTIONS').map(label => (
                        <option key={label.key} value={label.key}>{label.label}</option>
                      ))
                    ) : (
                      <>
                        <option value="PROVOCATIVO">🥊 Provocativo (Quebra de Padrão e Ego)</option>
                        <option value="ANALITICO">🧊 Analítico (Autoridade Fria e Dados)</option>
                        <option value="STORYTELLING">📖 Storytelling (Jornada Histórica)</option>
                        <option value="PRATICO">✅ Prático (Manual e Ação Imediata)</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div className="relative">
                <textarea
                  className={`w-full h-48 border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none leading-relaxed font-sans transition-colors ${isIuryMode ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-400 dark:placeholder:text-indigo-300' : 'bg-slate-50 dark:bg-surface-darker border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600'}`}
                  style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
                  placeholder={isIuryMode ? 'Deixe o Iury fazer o trabalho. Escreva um tema, cole um rascunho completo, reclame de um nicho... e veja a mágica visceral acontecer.' : 'Cole o texto dos seus carrosséis aqui, clique em gerar e veja a mágica acontecer...'}
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

                <div className="pt-2">
                  <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 p-3 rounded-lg border border-primary/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary dark:text-primary-light">Lembrar Marca & Estilo</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Salva a logo, arroba e cores para o futuro</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={saveDefaults}
                        onChange={(e) => setSaveDefaults(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
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
                <>
                  <div className="space-y-2 mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">imagesmode</span> Nicho Visual da Imagem
                    </label>
                    <select
                      value={imageNiche}
                      onChange={(e) => setImageNiche(e.target.value)}
                      className="w-full bg-white dark:bg-surface-dark border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-medium"
                    >
                      {dbImageLabels.filter(label => label.key !== 'GLOBAL_IMAGE').length > 0 ? (
                        dbImageLabels.filter(label => label.key !== 'GLOBAL_IMAGE').map(label => (
                          <option key={label.key} value={label.key}>{label.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="SAUDE">🍎 Saúde, Nutrição</option>
                          <option value="MINDSET">🧠 Mindset, Psicologia</option>
                        </>
                      )}
                    </select>
                  </div>
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
                </>
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
                disabled={!content.trim() || isGeneratingText}
                className={`w-full flex items-center justify-center gap-2 rounded-xl h-12 text-white text-base font-bold shadow-lg transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed ${isIuryMode ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25' : 'bg-primary hover:bg-primary/90 hover:scale-[1.02] shadow-primary/25 active:scale-[0.98]'}`}>
                {isGeneratingText ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">{isIuryMode ? 'psychology' : 'auto_fix_high'}</span>
                )}
                {isGeneratingText ? 'Pensando de Forma Visceral...' : isIuryMode ? 'Gerar com Iury' : 'Gerar Carrossel'}
              </button>
            </div>
          </div>
        </aside>
        <section className={`flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-background-dark overflow-hidden relative ${activeMobileTab !== 'preview' ? 'max-md:hidden' : 'max-md:flex max-md:flex-1'}`}>
          <div className="flex flex-wrap items-center justify-between px-2 sm:px-4 md:px-8 py-3 shrink-0 gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-border-dark shadow-sm shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-primary/20 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                title="Visualização em Grade"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('carousel')}
                className={`p-1.5 rounded ${viewMode === 'carousel' ? 'bg-slate-100 dark:bg-primary/20 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                title="Visualização em Carrossel"
              >
                <span className="material-symbols-outlined text-[18px]">view_carousel</span>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-0.5"></div>
              <div className="flex items-center gap-1 px-1">
                <input
                  className="w-16 sm:w-24 md:w-24 accent-primary h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  type="range"
                  min="25"
                  max="150"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-500 w-7 text-right font-mono">{zoom}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap">
                {isDownloading ? (
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] fill">download</span>
                )}
                <span>{isDownloading ? 'Baixando...' : 'Baixar Tudo'}</span>
              </button>
            </div>
          </div>
          <div className="scrollbar-custom flex-1 overflow-auto p-4 sm:p-8">
            <div
              className="origin-top-left transition-transform duration-200"
              style={{
                transform: `scale(${(isMobile ? 0.65 : 1) * (zoom / 100)})`,
                width: `${100 / ((isMobile ? 0.65 : 1) * (zoom / 100))}%`,
              }}
            >
              <div className={`flex ${viewMode === 'grid' ? 'flex-wrap' : 'flex-nowrap snap-x snap-mandatory'} justify-start gap-4 sm:gap-6 pb-24 max-w-[2300px]`}>
                {parsedSlides.map((parsedSlide, index) => {
                  const isFirst = index === 0;

                  const defaultImages = [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBEDUi4qtUqrH8-KI69ZbnhQZq-Snc28JyH-ubsgnikhUANHvd-Xzq_3tg9gUpXgSoRx7EXYn6phYh54OADr8Nrn4HgeYKQXuhPIGBhGGy01d9j_isuAcbMkqXfpsXGtVb93CwkoA2WfjLbnuCcsr7TWIy6yjB145itn0mCY7d_aXtyA8r-LPlAqVeC08vNiWPEoEgnK_-UUzehpswrcOMG-LTNMw5WUHn2eDQfsufJyJM9_AcXije1XBQd7-MH75eHSL8NJy5x-_0",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAe0_vHIt2A3hxagDcxuywE2lsRTajBr4HnEBFFQ3WjkgVYCAFC7RU1esxK_dyfQXf5xv4hCzwJtU5tuAfDBspIPjNJrpmZmu5M1I468-WspjfQn8OKGwCkUW_tOqliplDMNx--mI2aDq0JzFtqvxFNLnbS-Zon3xqFCsV5eoYduNiHAqUbvMQiMlgbLkQD3n4d4A5kEZW4s4zkQ6FSgmJF5WAA_6zxXUlGB_2VEjPDMKnnY53RRXdcrZTEALC-0KIekgS5zv3fC-Y",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCCwW5LVWmQqUjL-DQzhrfxbNkADj5HCxpCntC6G0iBYkFzapKcF_UD_E7fmmiVyCYoZU5d9HsDTrROsHJcfIP6aE9UfXzDxfXA_CI639Qyt8Nve2yQhPbhO3L3wmc_4ODjd4WqA33umoJEKsneslNVRG_374l_HlEugXIeokASwj8LrQ0W5-0-vDCWZ_U4rXPHxrCXv6kPMiHqDi7XNgToQV8hhdrmQLB_UfwFNXangbzIOYmgyw26UN0sbXgE0RRa5VEXcW18m0A"
                  ];

                  const slide = {
                    title: parsedSlide.title,
                    subtitle: parsedSlide.subtitle,
                    defaultImage: index < defaultImages.length ? defaultImages[index] : `https://picsum.photos/seed/${index}/800/1000`
                  };

                  const imageSrc = uploadedImages[index] || slide.defaultImage;

                  const titleLength = slide.title ? slide.title.length : 0;
                  const subtitleLength = slide.subtitle ? slide.subtitle.length : 0;
                  const totalLength = titleLength + subtitleLength;

                  const theme = getSlideTheme();
                  let titleClass = isFirst ? `font-extrabold ${theme.textClass} leading-tight ` : `font-bold ${theme.textClass} leading-snug `;
                  let subtitleClass = `${theme.subtextClass} leading-relaxed whitespace-pre-wrap `;

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
                    <div key={index} className={`relative group/slide ${getSlideDimensions()} shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-300 snap-center`}>
                      <div
                        ref={(el) => { slideRefs.current[index] = el; }}
                        className={`absolute inset-0 flex flex-col ${theme.bgClass}`}
                        style={theme.bgStyle}
                      >
                        <div
                          className="w-full flex-1 min-h-0 overflow-hidden group/image z-10 relative"
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
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover/image:scale-105" style={{ backgroundImage: `url('${imageSrc}')` }}></div>
                          </a>
                        </div>
                        <div className={`w-full px-8 pt-1 flex flex-col justify-end shrink-0 z-20 relative ${index === 0 ? 'pb-14' : 'pb-8'}`}>
                          <div className="flex flex-col gap-2">
                            {slide.title && <h2 className={titleClass}>{slide.title}</h2>}
                            {slide.subtitle && <p className={subtitleClass}>{slide.subtitle}</p>}
                          </div>
                          {index === 0 && (
                            <div className={`absolute bottom-5 left-8 right-6 flex items-center justify-end gap-1 ${theme.textClass} opacity-50`}>
                              <span className="text-[8px] font-bold uppercase tracking-wider">Deslize para ver mais</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/80 opacity-0 active:opacity-100 sm:group-hover/slide:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 backdrop-blur-[4px] z-[60] sm:pointer-events-none">
                        <div className="flex w-full h-full gap-2 sm:gap-4 items-center justify-center">
                          <div className="flex flex-col gap-2 w-1/2 max-w-[160px]">
                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Conteúdo</span>
                            <button
                              onClick={() => handleEditClick(index)}
                              className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                              <span className="material-symbols-outlined text-[16px]">edit</span> Editar Texto
                            </button>
                            <button
                              onClick={() => handleDownloadSingle(index)}
                              className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                              <span className="material-symbols-outlined text-[16px]">download</span> Baixar
                            </button>
                            {imageSrc && (
                              <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span> Expandir
                              </a>
                            )}
                          </div>

                          <div className="w-px h-[80%] bg-white/10 shrink-0"></div>

                          <div className="flex flex-col gap-2 w-1/2 max-w-[160px]">
                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Mídia</span>
                            <button
                              onClick={() => regenerateImageForSlide(index)}
                              disabled={generatingImages[index]}
                              className="pointer-events-auto flex items-center justify-start gap-3 bg-indigo-600/90 text-white hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 disabled:opacity-50">
                              <span className={`material-symbols-outlined text-[16px] ${generatingImages[index] ? 'animate-spin' : ''}`}>
                                {generatingImages[index] ? 'progress_activity' : 'auto_awesome'}
                              </span> Regerar IA
                            </button>
                            <button
                              onClick={() => handleIndividualUploadAction(index)}
                              className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                              <span className="material-symbols-outlined text-[16px]">cloud_upload</span> Upload
                            </button>
                            <button
                              onClick={(e) => handleRemoveImage(index, e)}
                              className="pointer-events-auto flex items-center justify-start gap-3 bg-red-500/20 text-red-100 hover:bg-red-500/40 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/30">
                              <span className="material-symbols-outlined text-[16px]">delete</span> Remover
                            </button>
                          </div>
                        </div>
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border border-slate-200 dark:border-border-dark rounded-full px-3 sm:px-4 py-2 shadow-xl z-10 w-max max-w-[95vw]">
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">first_page</span></button>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">chevron_left</span></button>
            <span className="text-[10px] sm:text-xs font-mono text-slate-900 dark:text-white font-medium whitespace-nowrap">Slide 1 / {slideCount}</span>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">chevron_right</span></button>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">last_page</span></button>
          </div>
        </section>
      </main>

      {/* Edit Text Modal */}
      {
        editingSlideIndex !== null && (
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
        )
      }
    </div >
  );
}
