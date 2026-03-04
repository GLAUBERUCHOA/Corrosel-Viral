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
  const globalInstruction = dynamicImageInstructions['GLOBAL_IMAGE'] || '';

  const nicheInstructions = Object.entries(dynamicImageInstructions)
    .filter(([key]) => key !== 'GLOBAL_IMAGE')
    .map(([key, value]) => `[NICHO: ${key}]\n${value}`)
    .join('\n\n');

  return `Crie UMA ÚNICA IMAGEM de alta qualidade baseada no seguinte slide:
Título do Slide: "${title}"
Subtítulo: "${subtitle}"

INSTRUÇÕES GERAIS DE ARTE (BASE):
${globalInstruction}

DIRETRIZES ESPECÍFICAS DE CADA NICHO:
(Atenção: de acordo com as instruções gerais, tente identificar a qual nicho esse slide pertence e utilize EXCLUSIVAMENTE o estilo de arte correspondente. NÃO misture os nichos.)
${nicheInstructions}

REGRAS DE LAYOUT E COMPOSIÇÃO (OBRIGATÓRIO):
1. Restrição Absoluta de Textos Nativos: É ESTRITAMENTE PROIBIDO criar qualquer frase, palavra ou explicação legível ilustrada dentro da arte! A imagem PRECISA ser muda. O texto longo será redigido por nós por cima.
2. Composição Vertical (Top-Heavy): O texto descritivo será sobreposto e ocupará a METADE INFERIOR (Bottom Half) do slide. Portanto, posicione os objetos centrais, personagens e elementos dramáticos EXCLUSIVAMENTE NA METADE SUPERIOR (Top Half) ou de modo centralizado. Deixe um espaço mais limpo (com pouca informação visual) na parte inferior.
3. Fidelidade ao Nicho: NUNCA crie estilo "dark/futurista" nem imagens "abstratas" se o nicho classificado não pedir isso. Siga rigorosamente o estilo de cor, textura e iluminação descrito nas regras do nicho que você identificar!`;
};

const SimpleRichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    editorRef.current?.focus();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelection(sel.getRangeAt(0).cloneRange());
    }
  };

  const execWithColor = (command: string, color: string) => {
    if (savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection);
    }
    document.execCommand(command, false, color);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const fgColors = ['#ffffff', '#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899'];
  const bgColors = ['#000000', '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

  return (
    <div className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl shadow-inner flex flex-col focus-within:ring-2 ring-primary transition-all">
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-1.5 flex flex-wrap gap-1 items-center z-10 rounded-t-xl">
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold" title="Negrito">B</button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 italic font-serif" title="Itálico">I</button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 underline" title="Sublinhado">U</button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Letra:</span>
        <input
          type="color"
          onMouseDown={saveSelection}
          onClick={saveSelection}
          onInput={(e) => { execWithColor('foreColor', e.currentTarget.value); }}
          className="size-6 cursor-pointer border-0 p-0 bg-transparent rounded-full shadow-sm"
          title="Cor da Letra"
          defaultValue="#ffffff"
        />

        <span className="text-[10px] text-slate-500 font-bold uppercase ml-2">Fundo:</span>
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-0.5 gap-0.5 items-center">
          <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); exec('hiliteColor', 'transparent'); }} className="size-[14px] rounded-full border border-slate-300 flex items-center justify-center bg-slate-100 hover:bg-slate-200" title="Sem Fundo">
            <span className="material-symbols-outlined text-[10px] text-red-500 font-bold">close</span>
          </button>
          <input
            type="color"
            onMouseDown={saveSelection}
            onClick={saveSelection}
            onInput={(e) => { execWithColor('hiliteColor', e.currentTarget.value); }}
            className="size-4 cursor-pointer border-0 p-0 bg-transparent"
            title="Cor de Fundo"
            defaultValue="#000000"
          />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Alinhar Esquerda">
          <span className="material-symbols-outlined text-[16px] leading-none block">format_align_left</span>
        </button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Centralizar">
          <span className="material-symbols-outlined text-[16px] leading-none block">format_align_center</span>
        </button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Alinhar Direita">
          <span className="material-symbols-outlined text-[16px] leading-none block">format_align_right</span>
        </button>
      </div>
      <div
        ref={editorRef}
        className="p-3 min-h-[100px] max-h-[150px] overflow-y-auto w-full text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-0 [&_span]:!bg-transparent rounded-b-xl"
        style={{
          // Hack para exibir placeholder quando vazio e desativado
          emptyCells: 'show'
        }}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
};

export default function CarouselGenerator({ onLogout }: { onLogout: () => void }) {
  const [dbPrompts, setDbPrompts] = useState<Record<string, string>>({});
  const [dbLabels, setDbLabels] = useState<{ key: string, label: string }[]>([]);
  const [dbImagePrompts, setDbImagePrompts] = useState<Record<string, string>>({});
  const [dbImageLabels, setDbImageLabels] = useState<{ key: string, label: string }[]>([]);
  const [imageNiche, setImageNiche] = useState('OUTROS');
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [styleModel, setStyleModel] = useState('Escuro');
  const [fontFamily, setFontFamily] = useState('var(--font-poppins), sans-serif');
  const [textAlign, setTextAlign] = useState('text-left');
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [generatingImages, setGeneratingImages] = useState<boolean[]>([]);
  const [isIuryMode, setIsIuryMode] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [imageEngine, setImageEngine] = useState<'gemini' | 'leonardo' | 'pollinations'>('gemini');
  const [hasNewPreview, setHasNewPreview] = useState(false);
  const [toneMode, setToneMode] = useState('PROVOCATIVO');
  const [content, setContent] = useState('');
  const [zoom, setZoom] = useState(100);
  const [activeMobileTab, setActiveMobileTab] = useState<'config' | 'preview'>('config');
  const [saveDefaults, setSaveDefaults] = useState(true);

  const [addCtaSlide, setAddCtaSlide] = useState(false);
  const [ctaContent, setCtaContent] = useState('O que você achou? Deixe nos comentários e salve este post para não esquecer!');
  const [ctaImage, setCtaImage] = useState<string | null>(null);
  const ctaImageInputRef = useRef<HTMLInputElement>(null);

  const [parsedSlides, setParsedSlides] = useState<{ title: string, subtitle: string, isCta?: boolean }[]>([
    { title: '', subtitle: '', isCta: false }
  ]);

  const slideCount = parsedSlides.length;

  const [uploadedImages, setUploadedImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [targetUploadIndex, setTargetUploadIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandHandle, setBrandHandle] = useState<string>('');
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [openSlideIndex, setOpenSlideIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [customColor, setCustomColor] = useState('#6366f1');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');

  const [imagePosMap, setImagePosMap] = useState<Record<number, number>>({});
  const isDraggingImg = useRef<{ index: number, startY: number, startPos: number } | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDraggingImg.current) {
        const { index, startY, startPos } = isDraggingImg.current;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - startY;
        const deltaPercent = (deltaY / window.innerHeight) * 150;
        let newPos = startPos + deltaPercent;
        newPos = Math.max(0, Math.min(100, newPos));
        setImagePosMap(prev => ({ ...prev, [index]: newPos }));
      }
    };
    const handleUp = () => {
      isDraggingImg.current = null;
    };
    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  const handleImgDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (e.cancelable) e.preventDefault();
    const currentPos = imagePosMap[index] ?? 50;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    isDraggingImg.current = { index, startY: clientY, startPos: currentPos };
  };

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
        if (prefs.fontFamily) setFontFamily(prefs.fontFamily);
        if (prefs.textAlign) setTextAlign(prefs.textAlign);

        if (prefs.aspectRatio) setAspectRatio(prefs.aspectRatio);
        if (prefs.content) setContent(prefs.content);
        if (prefs.toneMode) setToneMode(prefs.toneMode);
        if (prefs.addCtaSlide !== undefined) setAddCtaSlide(prefs.addCtaSlide);
        if (prefs.ctaContent !== undefined) {
          if (prefs.ctaContent.includes('Gostou do conteúdo')) {
            setCtaContent('O que você achou? Deixe nos comentários e salve este post para não esquecer!');
          } else {
            setCtaContent(prefs.ctaContent);
          }
        }
        if (prefs.ctaImage !== undefined) setCtaImage(prefs.ctaImage);
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

    const isMob = window.innerWidth < 768;
    setIsMobile(isMob);
    if (isMob) setViewMode('carousel');

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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
        addCtaSlide,
        ctaContent,
        ctaImage,
        toneMode
      };

      if (saveDefaults) {
        prefs.brandHandle = brandHandle;
        prefs.brandLogo = brandLogo;
        prefs.styleModel = styleModel;
        prefs.customColor = customColor;
        prefs.fontFamily = fontFamily;
        prefs.textAlign = textAlign;
      } else {
        prefs.brandHandle = '';
        prefs.brandLogo = null;
        prefs.styleModel = 'Escuro';
        prefs.customColor = '#6366f1';
        prefs.fontFamily = 'var(--font-poppins), sans-serif';
        prefs.textAlign = 'text-left';
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
  }, [brandHandle, brandLogo, styleModel, customColor, aspectRatio, content, parsedSlides, saveDefaults, toneMode, fontFamily, textAlign, addCtaSlide, ctaContent, ctaImage]);

  // Clipboard Paste Support (Ctrl+V) para Imagens
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Evita interceptar o paste se o usuário estiver digitando em campos de texto
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true' ||
        editingSlideIndex !== null) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            setUploadedImages(prev => {
              const updated = [...prev];
              // Garantir que o array acompanhe a contagem de slides
              while (updated.length < slideCount) updated.push(null);

              // 1. Alvo: Slide aberto/selecionado (se houver)
              if (openSlideIndex !== null) {
                updated[openSlideIndex] = dataUrl;
                return updated;
              }

              // 2. Alvo: Index específico de upload (se o usuário clicou no botão mas resolveu colar)
              if (targetUploadIndex !== null) {
                updated[targetUploadIndex] = dataUrl;
                setTargetUploadIndex(null);
                return updated;
              }

              // 3. Alvo: Primeiro slot vazio encontrado nos slides atuais
              let slotFound = false;
              for (let j = 0; j < slideCount; j++) {
                if (!updated[j]) {
                  updated[j] = dataUrl;
                  slotFound = true;
                  break;
                }
              }

              // 4. Se não houver slot vazio, adiciona ao final (pode gerar novo slide dependendo da lógica do app)
              if (!slotFound) {
                updated.push(dataUrl);
              }

              return updated;
            });
          };
          reader.readAsDataURL(file);
          break; // Processa apenas a primeira imagem colada
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [openSlideIndex, targetUploadIndex, slideCount, editingSlideIndex]);

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

  const handleCtaImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande. O limite é 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setCtaImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processTextIntoSlides = (textToParse: string, useCta = addCtaSlide, ctaText = ctaContent) => {
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

    const newSlides: { title: string, subtitle: string, isCta?: boolean }[] = blocks.map((block) => {
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

    if (newSlides.length === 0) {
      newSlides.push({ title: '', subtitle: '' });
    }

    if (useCta && ctaText.trim()) {
      newSlides.push({ title: '', subtitle: ctaText, isCta: true });
    }

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
      processTextIntoSlides(generatedText, addCtaSlide, ctaContent); // Processa imediatamente
      setHasNewPreview(true);
    } catch (error) {
      console.error("Erro ao gerar Modo Iury:", error);
      alert("Ocorreu um erro ao processar o texto pelo Iury. Tente novamente.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  // ── IMAGE ENGINE ROUTER ──────────────────────────────────────────────────

  // Convert an external image URL to base64 data URL via hidden <img> + canvas
  // This works because <img> tags bypass CORS/Cloudflare restrictions in the browser
  const urlToDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas not supported')); return; }
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          console.log(`[CarouselGenerator] Canvas converted: ${img.naturalWidth}x${img.naturalHeight}`);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image from URL'));
      img.src = url;
    });
  };

  const generateImageWithEngine = async (
    prompt: string,
    slideIndex: number,
    _totalSlides: number
  ): Promise<string | null> => {

    // ── Pollinations: free, no API key ──
    // Strategy: Build the URL, load via <img> (bypasses Cloudflare), convert via canvas
    if (imageEngine === 'pollinations') {
      const encodedPrompt = encodeURIComponent(prompt);
      const seed = Date.now() + slideIndex;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=768&height=960&nologo=true&model=flux`;
      console.log(`[CarouselGenerator] Pollinations: loading image for slide ${slideIndex}...`);

      // Pollinations generates on-the-fly, the <img> request will hang until ready (10-30s)
      // We try loading it directly as an image, then canvas-convert to base64
      try {
        const dataUrl = await urlToDataUrl(pollinationsUrl);
        console.log(`[CarouselGenerator] Pollinations: success for slide ${slideIndex}`);
        return dataUrl;
      } catch (err) {
        console.warn(`[CarouselGenerator] Pollinations canvas failed (CORS), returning raw URL`);
        // Fallback: return the raw URL — it'll work in background-image
        return pollinationsUrl;
      }
    }

    // ── Leonardo AI: calls go through our server-side endpoint ──
    if (imageEngine === 'leonardo') {
      const apiKey = customApiKey;
      if (!apiKey) throw new Error('Chave da API Leonardo AI é obrigatória.');

      console.log(`[CarouselGenerator] Leonardo: starting server-side generation for slide ${slideIndex}`);
      const res = await fetch('/api/leonardo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey, width: 768, height: 960 }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`[CarouselGenerator] Leonardo server error:`, data);
        throw new Error(data.error || `Leonardo falhou: HTTP ${res.status}`);
      }

      if (data.dataUrl) {
        console.log(`[CarouselGenerator] Leonardo: got base64 image for slide ${slideIndex}`);
        return data.dataUrl;
      }

      if (data.url) {
        console.log(`[CarouselGenerator] Leonardo: got URL, converting via canvas...`);
        try {
          return await urlToDataUrl(data.url);
        } catch {
          return data.url;
        }
      }

      throw new Error('Leonardo não retornou imagem.');
    }

    // ── Default: Gemini (SDK, returns base64 inline) ──
    const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Chave da API Gemini não encontrada.');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { imageConfig: { aspectRatio: aspectRatio === '9:16' ? '9:16' : '3:4' } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log(`[CarouselGenerator] Gemini: image received (${part.inlineData.mimeType})`);
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    console.warn('[CarouselGenerator] Gemini: no image parts returned');
    return null;
  };

  const regenerateImageForSlide = async (index: number) => {
    const slide = parsedSlides[index];
    if (!slide) return;
    if (imageEngine !== 'pollinations' && !customApiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      alert('Por favor, insira sua chave da API para regerar a imagem.');
      return;
    }
    setGeneratingImages(prev => {
      const updated = [...prev];
      while (updated.length <= index) updated.push(false);
      updated[index] = true;
      return updated;
    });
    try {
      const prompt = getImagePrompt(imageNiche, dbImagePrompts, slide.title, slide.subtitle);
      const imageUrl = await generateImageWithEngine(prompt, index, parsedSlides.length);
      if (imageUrl) {
        setUploadedImages(prev => {
          const updated = [...prev];
          while (updated.length <= index) updated.push(null);
          updated[index] = imageUrl;
          return updated;
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao regerar imagem:', msg, error);
      alert(`❌ Falha ao gerar imagem (${imageEngine === 'pollinations' ? 'Pollinations' : imageEngine === 'leonardo' ? 'Leonardo AI' : 'Gemini'}): ${msg}`);
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

    let newSlides = processTextIntoSlides(content, addCtaSlide, ctaContent);
    setHasNewPreview(true);

    if (generateWithAI) {
      if (imageEngine !== 'pollinations') {
        const apiKey = customApiKey || (imageEngine === 'gemini' ? process.env.NEXT_PUBLIC_GEMINI_API_KEY : null);
        if (!apiKey) {
          alert(`Chave da API ${imageEngine === 'leonardo' ? 'Leonardo AI' : 'Gemini'} não encontrada. Por favor, insira sua chave.`);
          return;
        }
      }

      const newGenerating = Array(newSlides.length).fill(true);
      setGeneratingImages(newGenerating);

      for (let i = 0; i < newSlides.length; i++) {
        try {
          const prompt = getImagePrompt(imageNiche, dbImagePrompts, newSlides[i].title, newSlides[i].subtitle);
          const imageUrl = await generateImageWithEngine(prompt, i, newSlides.length);
          if (imageUrl) {
            setUploadedImages(prev => {
              const updated = [...prev];
              while (updated.length < newSlides.length) updated.push(null);
              updated[i] = imageUrl;
              return updated;
            });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error(`Error generating image for slide ${i}:`, msg, error);
          alert(`⚠️ Slide ${i + 1}: falha ao gerar imagem (${imageEngine === 'pollinations' ? 'Pollinations' : imageEngine === 'leonardo' ? 'Leonardo AI' : 'Gemini'}). ${msg}`);
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

      {/* Wrapper fixo para Header e Tabs no Celular */}
      <div className="sticky top-0 z-40 flex flex-col w-full shadow-sm relative">
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
            onClick={() => {
              setActiveMobileTab('preview');
              setHasNewPreview(false);
            }}
            className={`flex-1 flex justify-center items-center py-3 text-sm font-bold transition-colors ${activeMobileTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
          >
            <div className="relative flex items-center gap-1.5">
              <span>Visualização ({slideCount})</span>
              {hasNewPreview && activeMobileTab !== 'preview' && (
                <span className="absolute -top-1 -right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-sm"></span>
                </span>
              )}
            </div>
          </button>
        </div>
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
                  placeholder={isIuryMode ? 'Deixe o Iury fazer o trabalho. Escreva um tema, cole um rascunho completo, reclame de um nicho... e veja a mágica visceral acontecer.' : 'Modo manual ativado. Cole SEU TEXTO FORMATADO aqui e clique em gerar.\n\n⚠️ REGRA DE OURO:\nSeu slide não pode ter mais que 250 caracteres (linhas de texto demais vão sobrescrever sua foto principal!).\n\nUse este formato nativo para cada slide:\n\nSLIDE 01:\n[TÍTULO]: Título explosivo aqui\n[SUBTÍTULO]: Texto da narrativa curto aqui...\n\nSLIDE 02:\n[TÍTULO]: Segundo título...'}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (!isIuryMode) {
                      processTextIntoSlides(e.target.value, addCtaSlide, ctaContent);
                    }
                  }}
                ></textarea>
                <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium bg-slate-100 dark:bg-border-dark px-2 py-1 rounded">{content.length} caracteres</div>
              </div>

              {isIuryMode && (
                <button
                  onClick={executarIury}
                  disabled={!content.trim() || isGeneratingText}
                  className="w-full flex items-center justify-center gap-2 rounded-xl h-11 text-white text-sm font-bold shadow-md transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25 mt-2"
                >
                  {isGeneratingText ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  )}
                  {isGeneratingText ? 'Pensando de Forma Visceral...' : 'Gerar Texto com Iury'}
                </button>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-border-dark">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipografia</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-surface-darker text-slate-900 dark:text-white border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                    >
                      <option value="var(--font-poppins), sans-serif">Padrão (Poppins)</option>
                      <option value="'Playfair Display', serif">Clássica (Playfair)</option>
                      <option value="'Inter', sans-serif">Clean (Inter)</option>
                      <option value="'Montserrat', sans-serif">Impacto (Montserrat)</option>
                      <option value="'Courier New', monospace">Código (Monospace)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alinhamento</label>
                    <div className="flex bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg h-[38px] overflow-hidden">
                      <button onClick={(e) => { e.preventDefault(); setTextAlign('text-left'); }} className={`flex-1 flex items-center justify-center transition-colors ${textAlign === 'text-left' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                        <span className="material-symbols-outlined text-[18px]">format_align_left</span>
                      </button>
                      <div className="w-px bg-slate-200 dark:bg-border-dark"></div>
                      <button onClick={(e) => { e.preventDefault(); setTextAlign('text-center'); }} className={`flex-1 flex items-center justify-center transition-colors ${textAlign === 'text-center' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                        <span className="material-symbols-outlined text-[18px]">format_align_center</span>
                      </button>
                      <div className="w-px bg-slate-200 dark:bg-border-dark"></div>
                      <button onClick={(e) => { e.preventDefault(); setTextAlign('text-right'); }} className={`flex-1 flex items-center justify-center transition-colors ${textAlign === 'text-right' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                        <span className="material-symbols-outlined text-[18px]">format_align_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-border-dark">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Adicionar CTA Final</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Gera um slide extra para Call-to-Action</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={addCtaSlide}
                      onChange={(e) => {
                        setAddCtaSlide(e.target.checked);
                        if (!isIuryMode) processTextIntoSlides(content, e.target.checked, ctaContent);
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
                {addCtaSlide && (
                  <div className="flex flex-col gap-3">
                    <SimpleRichTextEditor
                      value={ctaContent}
                      onChange={(val) => {
                        setCtaContent(val);
                        if (!isIuryMode) processTextIntoSlides(content, addCtaSlide, val);
                      }}
                      placeholder="Deixe sua mensagem final..."
                    />

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-border-dark pt-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Imagem de Fundo CTA</span>
                        <span className="text-[10px] text-slate-500">Opcional: preenche o fundo do CTA</span>
                      </div>
                      <button onClick={() => ctaImageInputRef.current?.click()} className="text-[11px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                        {ctaImage ? 'Trocar Imagem' : 'Upload Imagem +'}
                      </button>
                      <input type="file" ref={ctaImageInputRef} onChange={handleCtaImageUpload} accept="image/*" className="hidden" />
                    </div>

                    {ctaImage && (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-border-dark group shadow-sm bg-slate-100 dark:bg-slate-800">
                        <img src={ctaImage} alt="CTA Background" className="w-full h-full object-cover" />
                        <button onClick={() => setCtaImage(null)} className="absolute top-2 right-2 size-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg" title="Remover Imagem">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-border-dark">
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
                  {/* API KEY FIELD — simplified for Gemini only */}
                  <div className="space-y-2 mt-4 p-3 bg-slate-50 dark:bg-surface-darker rounded-lg border border-slate-200 dark:border-border-dark">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Sua Chave da API Gemini <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
                      </label>
                      {customApiKey && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">lock</span> Salva</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Insira sua chave para uso ilimitado. Ela é <strong>criptografada e salva apenas no seu navegador</strong>.
                    </p>
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={handleApiKeyChange}
                      placeholder="Cole sua chave AIzaSy... aqui"
                      className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-md px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <div className="flex justify-end">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
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
                disabled={!content.trim() || isGeneratingText || (isIuryMode && content.length < 50)}
                className={`w-full flex items-center justify-center gap-2 rounded-xl h-12 text-white text-base font-bold shadow-lg transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-emerald-500/25 active:scale-[0.98]`}>
                <span className="material-symbols-outlined">auto_fix_high</span>
                Gerar Carrossel e Imagens
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
                transform: `scale(${zoom / 100})`,
                width: `${100 / (zoom / 100)}%`,
              }}
            >
              <div className={`flex ${viewMode === 'grid' ? 'flex-wrap' : 'flex-nowrap snap-x snap-mandatory'} justify-start gap-12 sm:gap-16 pb-24 ${isMobile ? 'px-4' : ''} max-w-[2300px]`}>
                {parsedSlides.map((parsedSlide, index) => {
                  const isFirst = index === 0;

                  const defaultImages = [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBEDUi4qtUqrH8-KI69ZbnhQZq-Snc28JyH-ubsgnikhUANHvd-Xzq_3tg9gUpXgSoRx7EXYn6phYh54OADr8Nrn4HgeYKQXuhPIGBhGGy01d9j_isuAcbMkqXfpsXGtVb93CwkoA2WfjLbnuCcsr7TWIy6yjB145itn0mCY7d_aXtyA8r-LPlAqVeC08vNiWPEoEgnK_-UUzehpswrcOMG-LTNMw5WUHn2eDQfsufJyJM9_AcXije1XBQd7-MH75eHSL8NJy5x-_0",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAe0_vHIt2A3hxagDcxuywE2lsRTajBr4HnEBFFQ3WjkgVYCAFC7RU1esxK_dyjQXf5xv4hCzwJtU5tuAfDBspIPjNJrpmZmu5M1I468-WspjfQn8OKGwCkUW_tOqliplDMNx--mI2aDq0JzFtqvxFNLnbS-Zon3xqFCsV5eoYduNiHAqUbvMQiMlgbLkQD3n4d4A5kEZW4s4zkQ6FSgmJF5WAA_6zxXUlGB_2VEjPDMKnnY53RRXdcrZTEALC-0KIekgS5zv3fC-Y",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCCwW5LVWmQqUjL-DQzhrfxbNkADj5HCxpCntC6G0iBYkFzapKcF_UD_E7fmmiVyCYoZU5d9HsDTrROsHJcfIP6aE9UfXzDxfXA_CI639Qyt8Nve2yQhPbhO3L3wmc_4ODjd4WqA33umoJEKsneslNVRG_374l_HlEugXIeokASwj8LrQ0W5-0-vDCWZ_U4rXPHxrCXv6kPMiHqDi7XNgToQV8hhdrmQLB_UfwFNXangbzIOYmgyw26UN0sbXgE0RRa5VEXcW18m0A"
                  ];

                  const slide = {
                    title: parsedSlide.title,
                    subtitle: parsedSlide.subtitle,
                    isCta: parsedSlide.isCta,
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

                  if (slide.isCta) {
                    return (
                      <div key={index} className={`relative shrink-0 snap-center flex items-center group/slide-wrapper ${getSlideDimensions()}`}
                        onClick={() => { if (openSlideIndex !== index) setOpenSlideIndex(index); }}
                      >
                        <div className="relative group/slide w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-300">
                          <div
                            ref={(el) => { slideRefs.current[index] = el; }}
                            className={`absolute inset-0 flex flex-col items-center justify-start pt-12 text-center ${theme.bgClass}`}
                            style={theme.bgStyle}
                          >

                            {ctaImage && (
                              <div className="w-[85%] aspect-[16/9] sm:aspect-video rounded-[20px] overflow-hidden shadow-xl shrink-0 border border-white/10 mt-2 mb-0 relative z-10 mx-auto">
                                <img src={ctaImage} alt="CTA Landscape" className="w-full h-full object-cover" />
                              </div>
                            )}

                            {(brandHandle || brandLogo) && (
                              <div className={`w-full h-0 shrink-0 relative z-[60] flex items-center justify-center ${!ctaImage ? 'mb-10 mt-2' : ''}`}>
                                <div className="flex items-center gap-[4px] pr-2 pl-[1px] py-1 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ minWidth: 'fit-content', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.95)) drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>
                                  {brandLogo && (
                                    <div className={`size-[22px] sm:size-[26px] rounded-full overflow-hidden shrink-0 bg-white border-2 border-white/50`} style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.7)' }}>
                                      <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  {brandHandle && (
                                    <div className={`flex items-center text-[10px] sm:text-[12px] font-black tracking-widest text-white pb-[0.5px]`} style={{ textShadow: '0 1px 4px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8)' }}>
                                      <span className="ml-[2px]">{brandHandle}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className={`w-full flex-1 flex flex-col items-center p-8 shrink-0 z-20 relative ${ctaImage ? 'justify-start' : 'justify-center'} ${theme.textClass}`} style={{ fontFamily }}>
                              {slide.title && <h2 className={`font-extrabold text-2xl sm:text-3xl leading-tight uppercase mb-4`}>{slide.title}</h2>}
                              <div className={`text-base sm:text-lg ${theme.subtextClass} font-medium leading-relaxed whitespace-pre-wrap [&_span]:!bg-transparent focus:outline-none w-[90%] mx-auto`} dangerouslySetInnerHTML={{ __html: slide.subtitle }}></div>
                            </div>
                          </div>

                          <div
                            className={`absolute inset-0 bg-black/80 transition-opacity flex flex-col items-center justify-center p-6 backdrop-blur-[4px] z-[60] cursor-pointer outline-none overflow-hidden ${openSlideIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            onClick={(e) => { if (e.target === e.currentTarget) setOpenSlideIndex(null); }}
                          >
                            <div className="flex w-full h-full gap-2 sm:gap-4 items-center justify-center pointer-events-none">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(index); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                                <span className="material-symbols-outlined text-[16px]">download</span> Baixar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const randomPattern = [false, true, false, false, true, false, true, true, false, true];
                  const isImageBottom = index === 0 ? false : randomPattern[index % randomPattern.length];
                  const contentOrder = isImageBottom ? 'flex-col-reverse' : 'flex-col';
                  const textAlignmentPadding = isImageBottom
                    ? 'pt-12 pb-6 justify-center'
                    : (index === 0 ? 'pt-3 pb-10 justify-end' : 'pt-3 pb-4 justify-end');

                  return (
                    <div key={index} className={`relative shrink-0 snap-center flex items-center group/slide-wrapper ${getSlideDimensions()}`}
                      onClick={() => { if (openSlideIndex !== index) setOpenSlideIndex(index); }}
                    >
                      <div className="relative group/slide w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-300">
                        {totalLength > 250 && !isIuryMode && (
                          <div className="absolute top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none">
                            <div className="bg-red-600/95 backdrop-blur-sm border border-red-400 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-2xl shadow-red-500/50 flex items-center gap-1.5 animate-pulse">
                              <span className="material-symbols-outlined text-[14px]">warning</span> Texto muito longo ({totalLength} carac.)
                            </div>
                          </div>
                        )}
                        <div
                          ref={(el) => { slideRefs.current[index] = el; }}
                          className={`absolute inset-0 flex ${contentOrder} ${theme.bgClass}`}
                          style={theme.bgStyle}
                        >
                          <div
                            className="w-full flex-1 min-h-[35%] overflow-hidden group/image z-10 relative"
                          >
                            <div
                              className="block h-full w-full relative z-30 pointer-events-none"
                            >
                              <div className="absolute inset-0 bg-cover transition-transform duration-500 pointer-events-none" style={{ backgroundImage: `url('${imageSrc}')`, backgroundPosition: `center ${imagePosMap[index] ?? 50}%` }}></div>
                            </div>
                          </div>

                          <div className="w-full h-0 shrink-0 relative z-[60] flex items-center justify-center">
                            {(brandHandle || brandLogo) && (
                              <div className="flex items-center gap-[4px] pr-2 pl-[1px] py-1 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ minWidth: 'fit-content', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.95)) drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>
                                {brandLogo && (
                                  <div className={`size-[22px] sm:size-[26px] rounded-full overflow-hidden shrink-0 bg-white border-2 border-white/50`} style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.7)' }}>
                                    <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {brandHandle && (
                                  <div className={`flex items-center text-[10px] sm:text-[12px] font-black tracking-widest text-white pb-[0.5px]`} style={{ textShadow: '0 1px 4px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8)' }}>
                                    <span className="ml-[2px]">{brandHandle}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className={`w-full px-8 flex flex-col shrink-0 z-20 relative pt-6 ${index === 0 ? 'pb-16' : 'pb-6'} ${textAlign}`} style={{ fontFamily }}>
                            <div className={`flex flex-col gap-2 ${textAlign === 'text-center' ? 'items-center text-center' : textAlign === 'text-right' ? 'items-end text-right' : 'items-start text-left'}`}>
                              {slide.title && <h2 className={titleClass}>{slide.title}</h2>}
                              {slide.subtitle && <p className={subtitleClass}>{slide.subtitle}</p>}
                            </div>
                            {index === 0 && (
                              <div className={`absolute bottom-3 right-5 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 ${theme.textClass} shadow-xl group/swipe select-none`}>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-90 drop-shadow-md">Passe para ver mais</span>
                                <div className="flex items-center justify-center size-5 rounded-full bg-white/10 border border-white/20 group-hover/swipe:translate-x-1 transition-transform duration-300">
                                  <span className="material-symbols-outlined text-[14px] !font-bold">arrow_forward</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`absolute inset-0 bg-black/80 transition-opacity flex flex-col items-center justify-center p-6 backdrop-blur-[4px] z-[60] cursor-pointer outline-none overflow-hidden ${openSlideIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                          onClick={(e) => { if (e.target === e.currentTarget) setOpenSlideIndex(null); }}
                        >
                          <div className="flex w-full h-full gap-2 sm:gap-4 items-center justify-center pointer-events-none">
                            <div className="flex flex-col gap-2 w-1/2 max-w-[160px] pointer-events-none">
                              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Conteúdo</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditClick(index); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                                <span className="material-symbols-outlined text-[16px]">edit</span> Editar Texto
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(index); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                                <span className="material-symbols-outlined text-[16px]">download</span> Baixar
                              </button>
                              {imageSrc && (
                                <a href={imageSrc} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                                  <span className="material-symbols-outlined text-[16px]">open_in_new</span> Expandir
                                </a>
                              )}
                            </div>

                            <div className="w-px h-[80%] bg-white/10 shrink-0"></div>

                            <div className="flex flex-col gap-2 w-1/2 max-w-[160px] pointer-events-none">
                              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Mídia</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); regenerateImageForSlide(index); }}
                                disabled={generatingImages[index]}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-indigo-600/90 text-white hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 disabled:opacity-50">
                                <span className={`material-symbols-outlined text-[16px] ${generatingImages[index] ? 'animate-spin' : ''}`}>
                                  {generatingImages[index] ? 'progress_activity' : 'auto_awesome'}
                                </span> Regerar IA
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleIndividualUploadAction(index); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                                <span className="material-symbols-outlined text-[16px]">cloud_upload</span> Upload
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(index, e); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-red-500/20 text-red-100 hover:bg-red-500/40 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/30">
                                <span className="material-symbols-outlined text-[16px]">delete</span> Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-auto bottom-8 right-6 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-full lg:right-auto lg:ml-4 max-lg:opacity-100 opacity-0 group-hover/slide-wrapper:opacity-100 transition-opacity z-[999] pointer-events-auto">
                        <button
                          onMouseDown={(e) => handleImgDragStart(e, index)}
                          onTouchStart={(e) => {
                            setOpenSlideIndex(null);
                            handleImgDragStart(e, index);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white/90 backdrop-blur-md p-2 rounded-full cursor-ns-resize shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/40 hover:bg-white transition-colors flex items-center justify-center text-slate-900 hover:text-primary touch-none"
                          title="Arraste para ajustar"
                        >
                          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">swap_vert</span>
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border border-slate-200 dark:border-border-dark rounded-full px-3 sm:px-4 py-2 shadow-xl z-10 w-max max-w-[95vw]">
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">first_page</span></button>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">chevron_left</span></button>
            <span className="text-[10px] sm:text-xs font-mono text-slate-900 dark:text-white font-medium whitespace-nowrap">Slide 1 / {slideCount}</span>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">chevron_right</span></button>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">last_page</span></button>
          </div>
        </section >
      </main >

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
