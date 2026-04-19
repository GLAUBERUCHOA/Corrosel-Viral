'use client';
// Version: 1.1 - Added mobile download fixes and layout adjustments
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Image from 'next/image';

const getIuryPrompt = (toneMode: string, dynamicInstructions: Record<string, string>) => {
  const selectedToneInstruction = dynamicInstructions[toneMode] ||
    `🧠 PERFIL COGNITIVO DO IURY
Você é um Diretor de Criação e Engenheiro Narrativo. Use a ideia do usuário apenas como uma SEMENTE para criar narrativas autorais, densas e poderosas.

✍️ DIRETRIZES DE ESCRITA:
- Títulos SEMPRE em CAIXA ALTA.
- Slides Seguintes: [TÍTULO] curto + [SUBTÍTULO] narrativo longo.
- Slides Seguintes: [TÍTULO] curto + [SUBTÍTULO] narrativo longo.

🚨 REGRA CRÍTICA DE FORMATAÇÃO:
PROIBIDO gerar qualquer texto fora das tags [TÍTULO]: e [SUBTÍTULO]:.
Sempre separe slides com a tag nativa (Ex: SLIDE 01:).`;

  return `${selectedToneInstruction}

CRIANDO COM BASE NA INSTRUÇÃO ACIMA, metamorfoseie brutalmente o seguinte rascunho:
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

const isEmptyHtml = (html: string | undefined | null) => {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, '').trim();
  const cleanText = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, '').trim();
  return cleanText === '';
};

const SimpleRichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(value);
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    // Atualiza o conteúdo se o valor externo mudar e o editor não estiver focado
    // Isso evita o erro de 'digitar de trás pra frente' causado por re-renders do React
    if (editorRef.current && value !== lastHtmlRef.current) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
        lastHtmlRef.current = value;
      }
    }
  }, [value]);

  // Sincroniza o valor inicial no componente ao montar para garantir que o conteúdo apareça
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
      lastHtmlRef.current = value;
    }
  }, [value]);

  const emitChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== lastHtmlRef.current) {
        lastHtmlRef.current = html;
        onChange(html);
      }
    }
  };

  const executeCommand = (command: string, val?: string) => {
    editorRef.current?.focus();
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelectionRef.current);
    }
    
    // Se estivermos tentando mudar a fonte, primeiro limpamos a formatação da fonte atual
    // para garantir que novos spans não fiquem aninhados em spans com font-family antigo
    if (command === 'fontName') {
      document.execCommand('styleWithCSS', false, 'true');
    } else {
      document.execCommand('styleWithCSS', false, 'true');
    }
    
    document.execCommand(command, false, val);
    emitChange();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // Pega apenas o texto plano para evitar o lixo de HTML (ex: Google Docs)
    // Se o usuário quiser formatar, ele usa os botões do editor. Isso mantém tudo "limpo".
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  };

  const fgColors = ['#ffffff', '#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899'];
  const bgColors = ['#000000', '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

  return (
    <div className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl shadow-inner flex flex-col focus-within:ring-2 ring-primary transition-all">
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-1.5 flex flex-wrap gap-1 items-center z-10 rounded-t-xl" onMouseDown={(e) => e.preventDefault()}>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold" title="Negrito">B</button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 italic font-serif" title="Itálico">I</button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 underline" title="Sublinhado">U</button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Letra:</span>
        <input
          type="color"
          onInput={(e) => executeCommand('foreColor', e.currentTarget.value)}
          defaultValue="#ffffff"
          className="size-6 cursor-pointer border-0 p-0 bg-transparent rounded-full shadow-sm"
          title="Cor da Letra"
        />

        <span className="text-[10px] text-slate-500 font-bold uppercase ml-2">Fundo:</span>
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-0.5 gap-1 items-center">
          <button
            tabIndex={-1}
            onMouseDown={(e) => { e.preventDefault(); executeCommand('hiliteColor', 'transparent'); }}
            className="size-4 rounded-full border border-slate-300 flex items-center justify-center bg-white hover:bg-slate-100 shadow-sm transition-transform active:scale-95"
            title="Sem Fundo"
          >
            <span className="material-symbols-outlined text-[10px] text-red-500 font-bold">close</span>
          </button>
          <input
            type="color"
            onInput={(e) => executeCommand('hiliteColor', e.currentTarget.value)}
            defaultValue="#000000"
            className="size-4 cursor-pointer border-0 p-0 bg-transparent"
            title="Cor de Fundo"
          />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <select
          tabIndex={-1}
          className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          onChange={(e) => executeCommand('fontName', e.target.value)}
          defaultValue=""
          title="Trocar Fonte"
        >
          <option value="">Fonte</option>
          <option value="var(--font-poppins), sans-serif">Poppins</option>
          <option value="'Playfair Display', serif">Playfair</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Montserrat', sans-serif">Montserrat</option>
          <option value="'Outfit', sans-serif">Outfit</option>
          <option value="'Roboto', sans-serif">Roboto</option>
        </select>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyLeft'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Alinhar Esquerda">
          <span className="material-symbols-outlined text-[16px] leading-none block">format_align_left</span>
        </button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyCenter'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Centralizar">
          <span className="material-symbols-outlined text-[16px] leading-none block">format_align_center</span>
        </button>
        <button tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyRight'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300" title="Alinhar Direita">
          <span className="material-symbols-outlined text-[16px] leading-none block">format_align_right</span>
        </button>
      </div>
      <div
        ref={editorRef}
        className="p-3 min-h-[100px] max-h-[250px] overflow-y-auto w-full text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-0 rounded-b-xl resize-none [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline"
        style={{
          // Hack para exibir placeholder quando vazio e desativado
          emptyCells: 'show'
        }}
        contentEditable
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onMouseLeave={saveSelection}
        onPaste={handlePaste}
        onInput={(e) => { saveSelection(); emitChange(); }}
        onBlur={() => { emitChange(); }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default function CarouselGenerator({ onLogout }: { onLogout: () => void }) {
  const [pautaId, setPautaId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isIuryMode, setIsIuryMode] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [toneMode, setToneMode] = useState('PROVOCATIVO');
  const [addCtaSlide, setAddCtaSlide] = useState(true);
  const [ctaContent, setCtaContent] = useState('O que você achou? Deixe nos comentários e salve este post para não esquecer!');
  const [ctaImage, setCtaImage] = useState<string | null>(null);
  const [parsedSlides, setParsedSlides] = useState<{ title: string; subtitle: string; isCta?: boolean }[]>([{ title: '', subtitle: '', isCta: false }]);
  const [uploadedImages, setUploadedImages] = useState<(string | null)[]>(Array(10).fill(null));
  const [activeMobileTab, setActiveMobileTab] = useState<'config' | 'preview'>('config');
  const [hasNewPreview, setHasNewPreview] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [targetUploadIndex, setTargetUploadIndex] = useState<number | null>(null);
  const [openSlideIndex, setOpenSlideIndex] = useState<number | null>(null);
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoom, setZoom] = useState(100);

  // Estados de Estilo
  const [brandHandle, setBrandHandle] = useState('');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [saveDefaults, setSaveDefaults] = useState(true);
  const [styleModel, setStyleModel] = useState('Escuro');
  const [customColor, setCustomColor] = useState('#6366f1');
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('var(--font-poppins), sans-serif');
  const [textAlign, setTextAlign] = useState('text-left');
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [titleSize, setTitleSize] = useState(32);
  const [subSize, setSubSize] = useState(16);
  const [ctaBgColor, setCtaBgColor] = useState('#6366f1');
  const [ctaTextColor, setCtaTextColor] = useState('#ffffff');
  const [ctaTextSize, setCtaTextSize] = useState(24);
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<boolean[]>([]);

  // Estados de Configuração Dinâmica
  const [dbPrompts, setDbPrompts] = useState<Record<string, string>>({});
  const [dbLabels, setDbLabels] = useState<{ key: string; label: string }[]>([]);
  const [dbImagePrompts, setDbImagePrompts] = useState<Record<string, string>>({});
  const [dbImageLabels, setDbImageLabels] = useState<{ key: string; label: string }[]>([]);
  const [imageNiche, setImageNiche] = useState('OUTROS');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const individualFileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const ctaImageInputRef = useRef<HTMLInputElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isInitialized = useRef(false);

  const processTextIntoSlides = React.useCallback((textToParse: string, useCta = addCtaSlide, ctaText = ctaContent) => {
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
  }, [addCtaSlide, ctaContent]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('pautaId');
    if (id) setPautaId(id);
  }, []);

  const pautaData = useQuery(api.agents.getPautaById, pautaId ? { id: pautaId as any } : "skip");

  const slideCount = parsedSlides.length;

  useEffect(() => {
    if (pautaId && pautaData && pautaData.carrossel) {
      console.log("--- AUTOFILL: CARREGANDO PAUTA NO LAB ---", pautaId);
      setContent(pautaData.carrossel);
      processTextIntoSlides(pautaData.carrossel, addCtaSlide, ctaContent);
      setHasNewPreview(true);
      if (window.innerWidth < 768) setActiveMobileTab('preview');
    }
  }, [pautaData, addCtaSlide, ctaContent, pautaId, processTextIntoSlides]);

  // Dark Mode Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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

  // Monitorar slide visível e colar imagens
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            const targetIndex = openSlideIndex !== null ? openSlideIndex : currentSlideIndex;

            if (targetIndex < parsedSlides.length) {
              setUploadedImages(prev => {
                const updated = [...prev];
                while (updated.length <= targetIndex) updated.push(null);
                
                if (updated[targetIndex] !== null) {
                  // Insere a imagem e empurra as outras (reordena) em vez de apenas sobrepor
                  updated.splice(targetIndex, 0, result);
                  
                  // Se exceder o tamanho, aparamos o último null (que foi gerado ao adicionar a text slide)
                  if (updated.length > parsedSlides.length) {
                    const lastNullIndex = updated.lastIndexOf(null);
                    if (lastNullIndex !== -1) {
                      updated.splice(lastNullIndex, 1);
                    }
                  }
                } else {
                  // Se o slot estava vazio, apenas preenche
                  updated[targetIndex] = result;
                }
                
                return updated;
              });
            }
          };
          reader.readAsDataURL(blob);
          break; // Apenas a primeira imagem se houver múltiplas
        }
      }
    };

    window.addEventListener('paste', handlePaste);

    // Setup do IntersectionObserver para saber qual slide está no centro
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.6 // 60% visível para ser considerado o "atual"
    };

    const observer = new IntersectionObserver((entries) => {
      // Encontrar a entrada com maior interseção para ser mais preciso
      let highestRatio = 0;
      let targetIndex = currentSlideIndex;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
          highestRatio = entry.intersectionRatio;
          const idx = entry.target.getAttribute('data-slide-index');
          if (idx !== null) targetIndex = parseInt(idx);
        }
      });
      
      if (targetIndex !== currentSlideIndex) {
        setCurrentSlideIndex(targetIndex);
      }
    }, {
      root: null,
      threshold: [0.1, 0.3, 0.5, 0.7, 0.9] // Múltiplos níveis para melhor detecção
    });

    // Observar todos os slides atuais
    const currentRefs = slideRefs.current;
    currentRefs.forEach(ref => {
      if (ref) {
        // Observar o wrapper snap-center do slide
        const wrapper = ref.closest('[data-slide-index]');
        if (wrapper) observer.observe(wrapper);
      }
    });

    return () => {
      window.removeEventListener('paste', handlePaste);
      observer.disconnect();
    };
  }, [openSlideIndex, currentSlideIndex, parsedSlides.length, viewMode]);

  const handleImgDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (e.cancelable) e.preventDefault();
    const currentPos = imagePosMap[index] ?? 50;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    isDraggingImg.current = { index, startY: clientY, startPos: currentPos };
  };

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
        if (prefs.customTextColor) setCustomTextColor(prefs.customTextColor);
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
        if (prefs.titleSize) setTitleSize(prefs.titleSize);
        if (prefs.subSize) setSubSize(prefs.subSize);
        if (prefs.ctaBgColor) setCtaBgColor(prefs.ctaBgColor);
        if (prefs.ctaTextColor) setCtaTextColor(prefs.ctaTextColor);
        if (prefs.ctaTextSize) setCtaTextSize(prefs.ctaTextSize);
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
        prefs.customTextColor = customTextColor;
        prefs.fontFamily = fontFamily;
        prefs.textAlign = textAlign;
        prefs.titleSize = titleSize;
        prefs.subSize = subSize;
        prefs.ctaBgColor = ctaBgColor;
        prefs.ctaTextColor = ctaTextColor;
        prefs.ctaTextSize = ctaTextSize;
      } else {
        prefs.brandHandle = '';
        prefs.brandLogo = null;
        prefs.styleModel = 'Escuro';
        prefs.customColor = '#6366f1';
        prefs.customTextColor = '#ffffff';
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
  }, [brandHandle, brandLogo, styleModel, customColor, customTextColor, aspectRatio, content, parsedSlides, saveDefaults, toneMode, fontFamily, textAlign, addCtaSlide, ctaContent, ctaImage, ctaBgColor, ctaTextColor, ctaTextSize, subSize, titleSize]);

  // Scroll automático para o CTA quando alterado no Passo 1
  useEffect(() => {
    if (activeStep === 1 && addCtaSlide) {
      const ctaIndex = parsedSlides.length - 1;
      const ctaRef = slideRefs.current[ctaIndex];
      if (ctaRef) {
        ctaRef.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setCurrentSlideIndex(ctaIndex);
      }
    }
  }, [ctaBgColor, ctaTextColor, ctaTextSize, activeStep, addCtaSlide, parsedSlides.length]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomApiKey(val);
    if (val) {
      localStorage.setItem('gemini_api_key', val);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const readAsDataURL = (file: File): Promise<string> => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const newImages = await Promise.all(Array.from(files).map(readAsDataURL));

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

  const handleDragOver = (event: React.DragEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, index?: number) => {
    if ('preventDefault' in event) event.preventDefault();
    if (index !== undefined && dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number, event?: React.DragEvent<HTMLDivElement>) => {
    setDragOverIndex(null);
    
    // Suporte para arquivos externos
    if (event?.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            setUploadedImages(prev => {
              const updated = [...prev];
              // Insere a nova imagem na posição e empurra as outras
              updated.splice(index, 1, e.target!.result as string);
              return updated;
            });
          }
        };
        reader.readAsDataURL(file);
      }
      if ('preventDefault' in event) event.preventDefault();
      return;
    }

    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      return;
    }

    setUploadedImages(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1); // Remove o item da origem
      updated.splice(index, 0, movedItem); // Insere no destino, empurrando os outros
      return updated;
    });
    setDraggedIndex(null);
  };

  const handleTouchStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = targetEl?.closest('[data-drag-index]');
    if (dropTarget) {
      const targetIndex = Number(dropTarget.getAttribute('data-drag-index'));
      if (dragOverIndex !== targetIndex) setDragOverIndex(targetIndex);
    } else {
      setDragOverIndex(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (draggedIndex === null) return;
    setDragOverIndex(null);

    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = targetEl?.closest('[data-drag-index]');

    if (dropTarget) {
      const targetIndex = Number(dropTarget.getAttribute('data-drag-index'));
      handleDrop(targetIndex);
    } else {
      setDraggedIndex(null);
    }
  };

  const handleDeleteSlide = (index: number) => {
    if (parsedSlides.length <= 1) {
      alert("O carrossel precisa de pelo menos 1 slide.");
      return;
    }

    if (confirm("Deseja realmente excluir este slide?")) {
      const isCta = parsedSlides[index].isCta;
      if (isCta) {
        setAddCtaSlide(false);
      }

      const newSlides = parsedSlides.filter((_, i) => i !== index);
      setParsedSlides(newSlides);
      setUploadedImages(prev => prev.filter((_, i) => i !== index));

      // Se não estivermos no modo Iury e não for o CTA sendo excluído, atualizamos o conteúdo bruto
      if (!isIuryMode && !isCta) {
        const manualSlides = newSlides.filter(s => !s.isCta);
        const newContent = manualSlides.map((s, i) => {
          const slideNum = i + 1;
          const numStr = slideNum < 10 ? `0${slideNum}` : slideNum;
          return `SLIDE ${numStr}:\n[TÍTULO]: ${s.title}\n[SUBTÍTULO]: ${s.subtitle}`;
        }).join('\n\n');
        setContent(newContent);
      }

      setOpenSlideIndex(null);
      setEditingSlideIndex(null);
    }
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
    // Reset via target para permitir upload consecutivo do mesmo arquivo sem depender de ref
    event.target.value = '';
  };

  const handleRemoveBrandLogo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBrandLogo(null);
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



  // Efeito para atualização em tempo real do carrossel ao digitar no editor principal
  useEffect(() => {
    if (!isIuryMode && isInitialized.current) {
      processTextIntoSlides(content, addCtaSlide, ctaContent);
    }
  }, [content, addCtaSlide, ctaContent, isIuryMode, processTextIntoSlides]);



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
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = getImagePrompt(imageNiche, dbImagePrompts, slide.title, slide.subtitle);

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const parts = response.response?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
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

    let finalContent = content;
    const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // ETAPA 01: GERAÇÃO DE TEXTO (MODO IURY)
    if (isIuryMode) {
      if (!apiKey) {
        alert("Chave da API Gemini não encontrada. Por favor, insira sua chave nas configurações para usar o Modo Iury.");
        return;
      }

      setIsGeneratingText(true);
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const promptFinal = `${getIuryPrompt(toneMode, dbPrompts)}\n\nRASCUNHO DO USUÁRIO:\n${content}`;

        // Gemini 2.5 Flash - Estabilizado para restauração do Modo Iury
        console.log('--- PIPELINE: GERANDO TEXTO COM IURY ---');

        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
        });

        finalContent = response.response.text();
        setContent(finalContent); // Atualiza a caixa de texto visualmente
      } catch (error) {
        console.error("Erro no Pipeline (Texto):", error);
        alert("Ocorreu um erro ao processar o texto pelo Iury. Tente novamente.");
        setIsGeneratingText(false);
        return;
      } finally {
        setIsGeneratingText(false);
      }
    }

    // ETAPA 02: PROCESSAMENTO DE SLIDES
    const newSlides = processTextIntoSlides(finalContent, addCtaSlide, ctaContent);
    setHasNewPreview(true);

    // ETAPA 03: GERAÇÃO DE IMAGENS
    if (generateWithAI) {
      if (!apiKey) {
        alert("Chave da API Gemini não encontrada. Por favor, insira sua chave nas configurações para gerar imagens.");
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const newGenerating = Array(newSlides.length).fill(true);
      setGeneratingImages(newGenerating);

      const newImages = [...uploadedImages];
      while (newImages.length < newSlides.length) newImages.push(null);

      const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      for (let i = 0; i < newSlides.length; i++) {
        try {
          const prompt = getImagePrompt(imageNiche, dbImagePrompts, newSlides[i].title, newSlides[i].subtitle);

          const response = await imageModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });

          const parts = response.response?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) {
              const base64 = part.inlineData.data;
              const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64}`;
              setUploadedImages(prev => {
                const updated = [...prev];
                while (updated.length <= i) updated.push(null);
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
      const isCta = parsedSlides[editingSlideIndex].isCta;
      
      // Função auxiliar para limpar HTML de tags complexas e manter apenas texto limpo
      const stripHtml = (html: string) => {
        if (typeof document === 'undefined') return html;
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        // Substituir divs e brs por espaços ou novas linhas se necessário
        return tmp.textContent || tmp.innerText || "";
      };

      // 1. Criar nova lista de slides para atualização visual imediata
      const newSlides = [...parsedSlides];
      newSlides[editingSlideIndex] = { 
        ...newSlides[editingSlideIndex], 
        title: editTitle, 
        subtitle: editSubtitle 
      };
      
      setParsedSlides(newSlides);

      // 2. Sincronizar com o estado específico do CTA se for o caso
      if (isCta) {
        setCtaContent(stripHtml(editSubtitle));
      }

      // 3. Sincronizar com o textarea da sidebar (content) com texto LIMPO
      const manualSlides = newSlides.filter(s => !s.isCta);
      const newContent = manualSlides.map((s, i) => {
        const slideNum = i + 1;
        const numStr = slideNum < 10 ? `0${slideNum}` : slideNum;
        // Limpamos o HTML para a sidebar ficar legível
        const cleanTitle = stripHtml(s.title);
        const cleanSubtitle = stripHtml(s.subtitle);
        return `SLIDE ${numStr}:\n[TÍTULO]: ${cleanTitle}\n[SUBTÍTULO]: ${cleanSubtitle}`;
      }).join('\n\n');
      
      setContent(newContent);
      
      if (isIuryMode && !isCta) {
        setIsIuryMode(false);
      }

      setEditingSlideIndex(null);
      setHasNewPreview(true);
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
        return {
          bgClass: '',
          bgStyle: { backgroundColor: customColor },
          textClass: '',
          subtextClass: ''
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

  const prepareSlideForCapture = async (slideElement: HTMLElement) => {
    // ScrollIntoView removido para evitar a animação estranha ao baixar

    // Espera garantir que imagens estejam carregadas e posicionamento ok
    const imgs = Array.from(slideElement.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise(resolve => {
        const timer = setTimeout(resolve, 1500); // Segurança mais rápida
        img.onload = () => { clearTimeout(timer); resolve(null); };
        img.onerror = () => { clearTimeout(timer); resolve(null); };
      });
    }));

    // Retirado o delay longo de estabilização da interface (um tick é suficiente e não afeta a usabilidade)
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const handleDownloadSingle = async (index: number) => {
    const slideElement = slideRefs.current[index];
    if (!slideElement) return;

    try {
      await prepareSlideForCapture(slideElement);

      const filter = (node: any) => {
        const exclusionClasses = ['animate-pulse', 'invisible', 'capture-exclude'];
        return !exclusionClasses.some(classname => node.classList?.contains?.(classname));
      };

      // Resgata dimensões base para evitar problemas com zoom/escala do CSS
      const width = aspectRatio === '9:16' ? 315 : 400;
      const height = aspectRatio === '9:16' ? 560 : 500;

      const dataUrl = await htmlToImage.toPng(slideElement, {
        width: width,
        height: height,
        quality: 1.0,
        pixelRatio: window.innerWidth < 768 ? 2 : 3, // Qualidade superior no desktop, altíssima no mobile
        skipFonts: false,
        cacheBust: false,
        filter: filter,
        style: {
          transform: 'none',
          borderRadius: '0'
        }
      });

      saveAs(dataUrl, `slide-${index + 1}.png`);
    } catch (error: any) {
      console.error("Erro ao baixar slide:", error);
      alert(`Erro no Slide ${index + 1}: ${error?.message || 'Falha ao processar imagem'}. Tente baixar novamente ou mude o estilo de visualização.`);
    }
  };

  const handleSequentialDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const zip = new JSZip();

      for (let index = 0; index < parsedSlides.length; index++) {
        const slideElement = slideRefs.current[index];
        if (!slideElement) continue;

        try {
          await prepareSlideForCapture(slideElement);

          const filter = (node: any) => {
            const exclusionClasses = ['animate-pulse', 'invisible', 'capture-exclude'];
            return !exclusionClasses.some(classname => node.classList?.contains?.(classname));
          };

          const width = aspectRatio === '9:16' ? 315 : 400;
          const height = aspectRatio === '9:16' ? 560 : 500;

          const dataUrl = await htmlToImage.toPng(slideElement, {
            width: width,
            height: height,
            quality: 1.0,
            pixelRatio: window.innerWidth < 768 ? 2 : 3, // Restaurado para qualidade altíssima no mobile e desktop
            skipFonts: false,
            cacheBust: false,
            filter: filter,
            style: {
              transform: 'none',
              borderRadius: '0'
            }
          });

          const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
          zip.file(`slide-${index + 1}.png`, base64Data, { base64: true });
        } catch (slideErr: any) {
          console.error(`Falha no slide ${index + 1}:`, slideErr);
          throw new Error(`O slide ${index + 1} impediu a geração do pacote. Tente baixar os slides individualmente.`);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Carrossel_Viral.zip");

    } catch (error: any) {
      console.error("Erro ao gerar ZIP:", error);
      alert(`Erro no ZIP: ${error?.message || 'Erro desconhecido'}.`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display h-[100dvh] flex flex-col overflow-hidden">

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
              onClick={toggleDarkMode}
              className="size-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors border border-slate-200 dark:border-border-dark"
              title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              onClick={onLogout}
              className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Sair</span>
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-border-dark"></div>
            <div className="flex items-center justify-center rounded-full size-9 ring-2 ring-slate-100 dark:ring-border-dark cursor-pointer bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400" data-alt="User profile picture">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
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
          <div className="p-5 flex flex-col gap-4 flex-1">
            <h3 className="text-slate-900 dark:text-white font-black text-xl px-1">Configurações</h3>

            <div className="space-y-3">
              {/* PASSO 1: CONTEÚDO E TEXTO */}
              <div className={`border rounded-2xl overflow-hidden bg-white dark:bg-surface-dark transition-all duration-300 ${activeStep === 1 ? 'border-primary/30 shadow-lg ring-1 ring-primary/5' : 'border-slate-100 dark:border-border-dark shadow-sm'}`}>
                <button onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)} className={`w-full flex items-center justify-between p-4 text-left transition-colors ${activeStep === 1 ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-surface-darker'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${activeStep === 1 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[20px]">edit_document</span>
                    </div>
                    <span className={`font-bold text-sm ${activeStep === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Passo 1: Conteúdo e Texto</span>
                  </div>
                  <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${activeStep === 1 ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                </button>
                <div className={`transition-all duration-300 ${activeStep === 1 ? 'max-h-[1500px] opacity-100 p-4 border-t border-slate-50 dark:border-border-dark' : 'max-h-0 opacity-0 p-0 pointer-events-none'}`}>
                  <div className="space-y-4">
                    {/* Modo Iury Ocultado (Soft Delete) */}
                    <div className="hidden flex gap-2 p-1 bg-slate-50 dark:bg-surface-darker rounded-xl border border-slate-100 dark:border-border-dark">
                      <button onClick={() => setIsIuryMode(true)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${isIuryMode ? 'bg-white dark:bg-surface-dark shadow-sm text-primary ring-1 ring-slate-100 dark:ring-border-dark' : 'text-slate-500 hover:bg-white/50'}`}>
                        <span className="material-symbols-outlined text-[16px]">psychology</span> Modo Iury
                      </button>
                      <button onClick={() => setIsIuryMode(false)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${!isIuryMode ? 'bg-white dark:bg-surface-dark shadow-sm text-primary ring-1 ring-slate-100 dark:ring-border-dark' : 'text-slate-500 hover:bg-white/50'}`}>
                        <span className="material-symbols-outlined text-[16px]">edit_note</span> Manual
                      </button>
                    </div>

                    {isIuryMode && (
                      <div className="hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <select value={toneMode} onChange={(e) => setToneMode(e.target.value)} className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                          {dbLabels.filter(l => l.key !== 'GLOBAL_INSTRUCTIONS').map((t) => (
                            <option key={t.key} value={t.key} className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Painel de Agentes Externos */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5 border border-indigo-100/50 dark:border-indigo-500/20 rounded-2xl p-4 mb-2 shadow-sm">
                      <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Acelere sua criação com nossos Agentes de IA
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a href="https://gemini.google.com/gem/1iQPq18-mjh8IWq4tGpGuD3e4wn46BEPG?usp=sharing" target="_blank" className="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-surface-dark border border-indigo-100 dark:border-indigo-500/30 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[16px]">psychology</span> Agente de Roteiros
                        </a>
                        <a href="https://gemini.google.com/gem/1SJm7_JjDoeyhxtbTQG3s789RlLad58z7?usp=sharing" target="_blank" className="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-surface-dark border border-indigo-100 dark:border-indigo-500/30 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[16px]">palette</span> Agente de Imagens
                        </a>
                      </div>
                    </div>

                    <div className="space-y-2 relative group">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{isIuryMode ? 'O que quer ensinar hoje?' : 'Conteúdo do Carrossel'}</label>
                        <span className={`text-[10px] font-bold ${content.length > 2000 ? 'text-red-500' : 'text-slate-300'}`}>{content.length}/2000</span>
                      </div>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={isIuryMode ? "Ex: Como criar uma landing page que converte em 7 passos..." : "SLIDE 01:\n[TÍTULO]: SEU TÍTULO AQUI\n[SUBTÍTULO]: Texto detalhado do seu slide...\n\nSLIDE 02:\n[TÍTULO]: PRÓXIMO TÍTULO\n[SUBTÍTULO]: Mais texto aqui..."}
                        className={`w-full dark:bg-surface-darker border border-slate-100 dark:border-border-dark rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300 overflow-y-auto ${isIuryMode ? 'h-80' : 'h-48 whitespace-pre-wrap'}`}
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Slide de CTA Final</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={addCtaSlide} onChange={(e) => {
                            setAddCtaSlide(e.target.checked);
                            if (!isIuryMode) processTextIntoSlides(content, e.target.checked, ctaContent);
                          }} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                      {addCtaSlide && (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <SimpleRichTextEditor value={ctaContent} onChange={(val) => { setCtaContent(val); if (!isIuryMode) processTextIntoSlides(content, addCtaSlide, val); }} placeholder="Mensagem final..." />
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-border-dark pt-3">
                            <span className="text-[11px] font-semibold text-slate-500">Imagem de Fundo</span>
                            <div className="flex items-center gap-2">
                              {ctaImage && (
                                <button onClick={() => setCtaImage(null)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center" title="Remover Imagem">
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              )}
                              <button onClick={() => ctaImageInputRef.current?.click()} className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                                {ctaImage ? 'Trocar' : 'Upload +'}
                              </button>
                              <input type="file" ref={ctaImageInputRef} onChange={handleCtaImageUpload} accept="image/*" className="hidden" />
                            </div>
                          </div>

                          {/* Painel Exclusivo do CTA */}
                          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-border-dark">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Fundo do CTA</span>
                              <input type="color" value={ctaBgColor} onChange={(e) => setCtaBgColor(e.target.value)} className="size-6 cursor-pointer bg-transparent border-0 p-0" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Texto do CTA</span>
                              <input type="color" value={ctaTextColor} onChange={(e) => setCtaTextColor(e.target.value)} className="size-6 cursor-pointer bg-transparent border-0 p-0" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Tamanho Texto CTA</label>
                                <span className="text-[10px] font-mono font-bold text-primary">{ctaTextSize}px</span>
                              </div>
                              <input type="range" min="12" max="50" value={ctaTextSize} onChange={(e) => setCtaTextSize(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* API Key Block - Moved to Step 1 */}
                    {/* Campo de API Key Ocultado (Soft Delete) */}
                    <div className="hidden space-y-3 pt-4 border-t border-slate-100 dark:border-border-dark mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Sua Chave da API Gemini (Opcional)</label>
                          <p className="text-[10px] text-slate-400 leading-tight">Criptografia Local: Sua chave nunca toca nosso servidor.</p>
                        </div>
                        {customApiKey && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-[14px]">lock</span> Salva
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <input
                          type="password"
                          value={customApiKey}
                          onChange={handleApiKeyChange}
                          placeholder="Cole aqui: AIzaSy..."
                          className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-100 dark:border-border-dark rounded-xl px-4 py-3 text-xs opacity-80 focus:opacity-100 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                        />
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                          title="Obter chave no Google AI Studio"
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PASSO 2: ESTILO E MARCA */}
              <div className={`border rounded-2xl overflow-hidden bg-white dark:bg-surface-dark transition-all duration-300 ${activeStep === 2 ? 'border-primary/30 shadow-lg ring-1 ring-primary/5' : 'border-slate-100 dark:border-border-dark shadow-sm'}`}>
                <button onClick={() => setActiveStep(activeStep === 2 ? 0 : 2)} className={`w-full flex items-center justify-between p-4 text-left transition-colors ${activeStep === 2 ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-surface-darker'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${activeStep === 2 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[20px]">palette</span>
                    </div>
                    <span className={`font-bold text-sm ${activeStep === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Passo 2: Estilo e Marca</span>
                  </div>
                  <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${activeStep === 2 ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                </button>
                <div className={`transition-all duration-300 ${activeStep === 2 ? 'max-h-[1500px] opacity-100 p-4 border-t border-slate-50 dark:border-border-dark' : 'max-h-0 opacity-0 p-0 pointer-events-none'}`}>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proporção</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setAspectRatio('4:5')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${aspectRatio === '4:5' ? 'border-2 border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-primary/30'}`}>
                          <div className={`w-4 h-6 border-2 rounded-sm ${aspectRatio === '4:5' ? 'border-primary' : 'border-slate-400'}`}></div>
                          <span className={`text-[10px] font-bold ${aspectRatio === '4:5' ? 'text-primary' : 'text-slate-500'}`}>Vertical (4:5)</span>
                        </button>
                        <button onClick={() => setAspectRatio('9:16')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${aspectRatio === '9:16' ? 'border-2 border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-primary/30'}`}>
                          <div className={`w-3.5 h-6 border-2 rounded-sm ${aspectRatio === '9:16' ? 'border-primary' : 'border-slate-400'}`}></div>
                          <span className={`text-[10px] font-bold ${aspectRatio === '9:16' ? 'text-primary' : 'text-slate-500'}`}>Stories (9:16)</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estilo Visual</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Moderno', 'Escuro', 'Vibrante', 'Minimalista', 'Regional', 'Personalizado'].map((mode) => (
                          <div key={mode} className={`h-12 rounded-lg flex items-center justify-center cursor-pointer ring-2 transition-all ${styleModel === mode ? 'ring-primary' : 'ring-transparent'}`}
                            style={{ background: mode === 'Moderno' ? 'linear-gradient(135deg, #6366f1, #a855f7)' : mode === 'Escuro' ? '#1e293b' : mode === 'Vibrante' ? 'linear-gradient(135deg, #f87171, #fb923c)' : mode === 'Minimalista' ? '#fff' : mode === 'Regional' ? '#efe9dc' : mode === 'Personalizado' ? customColor : '#f8fafc', border: (mode === 'Minimalista' || mode === 'Regional') ? '1px solid #e2e8f0' : 'none' }}
                            onClick={() => {
                              setStyleModel(mode);
                              // Ajuste automático de contraste
                              if (mode === 'Minimalista' || mode === 'Regional') {
                                setCustomTextColor('#0f172a'); // text-slate-900
                              } else {
                                setCustomTextColor('#ffffff'); // text-white
                              }
                              // Ajuste automático de fundo base
                              if (mode === 'Escuro') setCustomColor('#151525');
                              if (mode === 'Minimalista') setCustomColor('#ffffff');
                              if (mode === 'Regional') setCustomColor('#efe9dc');
                            }}>
                            <span className={`text-[9px] font-black uppercase ${mode === 'Minimalista' || mode === 'Regional' ? 'text-slate-800' : 'text-white'}`}>{mode}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div key="custom-theme-controls" className="p-3 bg-slate-50 dark:bg-surface-darker rounded-xl border border-slate-100 dark:border-border-dark space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Cor do Fundo</span>
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="size-8 cursor-pointer bg-transparent border-0 p-0"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Cor do Texto</span>
                        <input
                          type="color"
                          value={customTextColor}
                          onChange={(e) => setCustomTextColor(e.target.value)}
                          className="size-8 cursor-pointer bg-transparent border-0 p-0"
                        />
                      </div>
                    </div>

                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Fonte</label>
                      <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-primary outline-none">
                        <option value="var(--font-poppins), sans-serif" className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">Poppins</option>
                        <option value="'Playfair Display', serif" className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">Playfair</option>
                        <option value="'Inter', sans-serif" className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">Inter</option>
                        <option value="'Montserrat', sans-serif" className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">Montserrat</option>
                        <option value="'Outfit', sans-serif" className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">Outfit</option>
                        <option value="'Roboto', sans-serif" className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">Roboto</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Alinhamento</label>
                      <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button onClick={() => setTextAlign('text-left')} className={`flex-1 py-1 rounded ${textAlign === 'text-left' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}><span className="material-symbols-outlined text-[16px]">format_align_left</span></button>
                        <button onClick={() => setTextAlign('text-center')} className={`flex-1 py-1 rounded ${textAlign === 'text-center' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}><span className="material-symbols-outlined text-[16px]">format_align_center</span></button>
                        <button onClick={() => setTextAlign('text-right')} className={`flex-1 py-1 rounded ${textAlign === 'text-right' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}><span className="material-symbols-outlined text-[16px]">format_align_right</span></button>
                      </div>
                    </div>
                  </div>

                  {/* Gaveta 2: Tamanhos Globais */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-border-dark mt-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tamanho do Título</label>
                        <span className="text-[10px] font-mono font-bold text-primary">{titleSize}px</span>
                      </div>
                      <input type="range" min="16" max="60" value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tamanho do Texto</label>
                        <span className="text-[10px] font-mono font-bold text-primary">{subSize}px</span>
                      </div>
                      <input type="range" min="10" max="40" value={subSize} onChange={(e) => setSubSize(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">verified_user</span>
                        <span className="text-xs font-bold text-slate-700">Lembrar Marca & Estilo</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer z-20">
                        <input type="checkbox" className="sr-only peer" checked={saveDefaults} onChange={(e) => setSaveDefaults(e.target.checked)} />
                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">@</span>
                        <input
                          type="text"
                          value={brandHandle}
                          onChange={(e) => setBrandHandle(e.target.value.replace('@', ''))}
                          placeholder="seu_perfil"
                          className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white rounded-lg pl-6 pr-3 py-2 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        />
                      </div>
                      <div className="flex-1 flex gap-2">
                        <label className="flex-1 py-2 bg-white dark:bg-surface-dark border border-dashed border-slate-200 dark:border-border-dark rounded-lg text-[10px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer relative overflow-hidden">
                          <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span> {brandLogo ? 'Trocar Logo' : 'Logo +'}
                          <input type="file" onChange={handleBrandLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>
                        {brandLogo && (
                          <button
                            onClick={handleRemoveBrandLogo}
                            className="px-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center"
                            title="Remover Logo"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 3: MÍDIA E IMAGENS */}
            <div className={`border rounded-2xl overflow-hidden bg-white dark:bg-surface-dark transition-all duration-300 ${activeStep === 3 ? 'border-primary/30 shadow-lg ring-1 ring-primary/5' : 'border-slate-100 dark:border-border-dark shadow-sm'}`}>
              <button onClick={() => setActiveStep(activeStep === 3 ? 0 : 3)} className={`w-full flex items-center justify-between p-4 text-left transition-colors ${activeStep === 3 ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-surface-darker'}`}>
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${activeStep === 3 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[20px]">imagesmode</span>
                  </div>
                  <span className={`font-bold text-sm ${activeStep === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Passo 3: Mídia e Imagens</span>
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${activeStep === 3 ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
              </button>
              <div className={`transition-all duration-300 ${activeStep === 3 ? 'max-h-[1500px] opacity-100 p-4 border-t border-slate-50 dark:border-border-dark' : 'max-h-0 opacity-0 p-0 pointer-events-none'}`}>
                <div className="space-y-4">
                  {/* Geração de Imagem com IA Ocultada (Soft Delete) */}
                  <div className="hidden flex items-center justify-between bg-orange-50 dark:bg-orange-500/10 p-3 rounded-xl border border-orange-100 dark:border-orange-500/20">
                    <span className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase">Gerar com IA</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={generateWithAI} onChange={(e) => setGenerateWithAI(e.target.checked)} />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                  {generateWithAI && (
                    <div className="hidden space-y-3 animate-in fade-in duration-300">
                      <select value={imageNiche} onChange={(e) => setImageNiche(e.target.value)} className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none">
                        {dbImageLabels.filter(label => label.key !== 'GLOBAL_IMAGE').map(label => (
                          <option key={label.key} value={label.key} className="bg-white dark:bg-surface-darker text-slate-900 dark:text-white">
                            {label.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={`${generateWithAI ? 'opacity-40 grayscale pointer-events-none' : ''} space-y-3`}>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: slideCount }).map((_, i) => (
                        <div
                          key={i}
                          onClick={() => handleIndividualUploadClick(i)}
                          className={`aspect-[4/5] rounded-xl border-2 flex items-center justify-center group transition-all cursor-pointer relative overflow-hidden ${dragOverIndex === i ? 'border-primary ring-4 ring-primary/30 scale-105 bg-primary/10 border-solid' : draggedIndex === i ? 'border-dashed border-primary ring-2 ring-primary/20 scale-95 opacity-50' : 'border-dashed border-slate-200 hover:border-primary'}`}
                          draggable={!generateWithAI && !!uploadedImages[i]}
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(i, e)}
                          onTouchStart={() => !generateWithAI && !!uploadedImages[i] && handleTouchStart(i)}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={handleTouchMove}
                          data-drag-index={i}
                        >
                          {uploadedImages[i] ? (
                            <>
                              <Image src={uploadedImages[i] as string} alt={`Slide upload ${i + 1}`} fill className="object-cover pointer-events-none" unoptimized />
                              <button onClick={(e) => handleRemoveImage(i, e)} className="absolute top-1 right-1 size-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10">
                                <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-black text-slate-200">S{i + 1}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={handleMassUploadClick} className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1 transition-all">
                      <span className="material-symbols-outlined text-[16px]">upload_file</span> Upload Massa
                    </button>

                    {/* Hidden Inputs Restored */}
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <input type="file" accept="image/*" className="hidden" ref={individualFileInputRef} onChange={handleIndividualFileUpload} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-auto p-6 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker sticky bottom-0">
            <button
              onClick={handleGenerateCarousel}
              disabled={!content.trim() || isGeneratingText || generatingImages.some(v => v) || (isIuryMode && content.length < 50)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl h-12 text-white text-base font-bold shadow-lg transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 shadow-orange-500/25 active:scale-[0.98]`}>
              {isGeneratingText || generatingImages.some(v => v) ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined">layers</span>
              )}
              {isGeneratingText ? 'Processando...' : generatingImages.some(v => v) ? 'Gerando Imagens...' : 'Montar Carrossel'}
            </button>
          </div>
        </aside>
        <section className={`flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-background-dark overflow-hidden relative ${activeMobileTab !== 'preview' ? 'max-md:hidden' : 'max-md:flex max-md:flex-1'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between px-2 sm:px-4 md:px-8 py-3 shrink-0 gap-3">
            <div className="flex flex-1 w-full md:w-auto justify-between md:justify-start items-center gap-1 bg-white dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-border-dark shadow-sm shrink-0">
              <div className="flex gap-1">
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
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-0.5"></div>
              <div className="flex items-center gap-1 px-1 flex-1 md:flex-none justify-end md:justify-start">
                <input
                  className="w-full max-w-[100px] sm:w-24 md:w-24 accent-primary h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  type="range"
                  min="25"
                  max="150"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-500 w-7 text-right font-mono">{zoom}%</span>
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2 shrink-0">
              <button
                onClick={handleSequentialDownload}
                disabled={isDownloading}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.98]">
                {isDownloading ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] fill">download_for_offline</span>
                )}
                <span>{isDownloading ? 'Baixando...' : 'Baixar Todos'}</span>
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

                  const slide = {
                    title: parsedSlide.title,
                    subtitle: parsedSlide.subtitle,
                    isCta: parsedSlide.isCta
                  };

                  const imageSrc = uploadedImages[index] || null;

                  const titleLength = slide.title ? slide.title.length : 0;
                  const subtitleLength = slide.subtitle ? slide.subtitle.length : 0;
                  const totalLength = titleLength + subtitleLength;

                  const theme = getSlideTheme();
                  let titleClass = isFirst ? `font-extrabold ${theme.textClass} leading-tight ` : `font-bold ${theme.textClass} leading-snug `;
                  let subtitleClass = `${theme.subtextClass} leading-relaxed whitespace-pre-wrap `;

                  if (isFirst) {
                    if (titleLength > 80) titleClass += "text-lg";
                    else if (titleLength > 50) titleClass += "text-xl";
                    else if (titleLength > 25) titleClass += "text-2xl";
                    else titleClass += "text-3xl";
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
                      <div key={index} data-slide-index={index} className={`relative shrink-0 snap-center flex items-center group/slide-wrapper ${getSlideDimensions()}`}
                        onClick={() => { 
                          setCurrentSlideIndex(index);
                          if (openSlideIndex !== index) setOpenSlideIndex(index); 
                        }}
                      >
                        <div className="relative group/slide w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-300">
                          <div
                            ref={(el) => { slideRefs.current[index] = el; }}
                            className={`absolute inset-0 flex flex-col items-center justify-start pt-12 pb-12 px-10 text-center overflow-hidden transition-colors duration-300`}
                            style={{ backgroundColor: ctaBgColor }}
                          >
                            {(brandHandle || brandLogo) && (
                              <div className="absolute top-4 left-4 z-[60]" style={{ opacity: 0.85 }}>
                                <div className="flex items-center gap-[5px] px-2 py-1">
                                  {brandLogo && (
                                    <div className="size-[20px] sm:size-[22px] rounded-full overflow-hidden shrink-0 bg-white/20 border border-white/30 relative">
                                      <Image src={brandLogo} alt="Logo" fill className="object-cover" crossOrigin="anonymous" unoptimized />
                                    </div>
                                  )}
                                  {brandHandle && (
                                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black tracking-wider text-white uppercase">
                                      <span>{brandHandle}</span>
                                      <svg className="w-[14px] h-[14px] shrink-0 fill-[#3897f0]" viewBox="0 0 40 40">
                                        <circle cx="20" cy="20" r="12" fill="white" />
                                        <path d="M20 0L24.5 3.5L30 2.5L31 8L36 11L34.5 16.5L37.5 21.5L33.5 25.5L33.5 31.5L28 32L24 36.5L19.5 33L14 35.5L11 30.5L5.5 29L6 23.5L2 19.5L5.5 15L5 9.5L10.5 8L14 3.5L20 0Z" />
                                        <path d="M17 21L14.5 18.5L13 20L17 24L27 14L25.5 12.5L17 21Z" fill="white" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {ctaImage && (
                              <div className="w-[85%] aspect-[16/9] sm:aspect-video rounded-[20px] overflow-hidden shadow-xl shrink-0 border border-white/10 mt-2 mb-4 relative z-10 mx-auto">
                                <Image src={ctaImage} alt="CTA Landscape" fill className="object-cover" crossOrigin="anonymous" unoptimized />
                              </div>
                            )}

                            <div className={`w-full flex-1 flex flex-col items-center justify-center shrink-0 z-20 relative`} style={{
                              fontFamily,
                              color: ctaTextColor,
                              fontSize: `${ctaTextSize}px`
                            }}>
                              {!isEmptyHtml(slide.title) && (
                                <h2 className={`font-extrabold text-2xl sm:text-3xl leading-tight uppercase mb-4 break-words w-full`}
                                  style={{ color: ctaTextColor }}>
                                  {slide.title}
                                </h2>
                              )}
                              <div className={`font-medium leading-relaxed whitespace-pre-wrap focus:outline-none w-full break-words mx-auto`}
                                style={{ color: ctaTextColor }}
                                dangerouslySetInnerHTML={{ __html: slide.subtitle }}>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`absolute inset-0 bg-black/80 transition-opacity flex flex-col items-center justify-center p-6 backdrop-blur-[4px] z-[60] cursor-pointer outline-none overflow-hidden capture-exclude ${openSlideIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            onClick={(e) => { if (e.target === e.currentTarget) setOpenSlideIndex(null); }}
                          >
                            <div className="flex w-full h-full gap-2 sm:gap-4 items-center justify-center pointer-events-none">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(index); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-white/10 text-white hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10">
                                <span className="material-symbols-outlined text-[16px]">download</span> Baixar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSlide(index); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-red-500/20 text-red-100 hover:bg-red-500/40 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/30">
                                <span className="material-symbols-outlined text-[16px]">folder_delete</span> Excluir Slide
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
                  // Padding dinâmico para evitar espaços vazios excessivos
                  const textPadding = isFirst
                    ? 'pt-20 pb-10 px-10' // Capa: Layout mais compacto
                    : (isImageBottom ? 'pt-10 pb-10 px-8' : 'pt-8 pb-10 px-8'); // Internos: Tighter margins

                  return (
                    <div key={index} data-slide-index={index} className={`relative shrink-0 snap-center flex items-center group/slide-wrapper ${getSlideDimensions()}`}
                      onClick={() => { 
                        setCurrentSlideIndex(index);
                        if (openSlideIndex !== index) setOpenSlideIndex(index); 
                      }}
                    >
                      <div className="relative group/slide w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-300">

                        <div
                          ref={(el) => { slideRefs.current[index] = el; }}
                          className={`absolute inset-0 flex flex-col overflow-hidden ${theme.bgClass} transition-all duration-300`}
                          style={styleModel === 'Personalizado' || styleModel === 'Escuro' || styleModel === 'Minimalista' || styleModel === 'Regional' ? { backgroundColor: customColor } : {}}
                        >
                          {isFirst ? (
                            /* --- LAYOUT CAPA (SLIDE 1) --- */
                            <>
                              {imageSrc && (
                                <div className="flex-1 w-full relative z-0 overflow-hidden">
                                   <Image
                                    src={imageSrc}
                                    alt={`Slide ${index}`}
                                    fill
                                    className="object-cover transition-transform duration-500"
                                    style={{
                                      objectPosition: `center ${imagePosMap[index] ?? 50}%`,
                                      maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                                      WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                                    }}
                                    crossOrigin="anonymous"
                                    unoptimized
                                  />
                                </div>
                              )}

                              {/* Branding Flutuante no Topo (Reduzido em 20%) - FIXO NO TOPO */}
                              <div className="absolute top-6 left-6 z-[60]" style={{ opacity: 1 }}>
                                {(brandHandle || brandLogo) && (
                                  <div className="flex items-center gap-[5px] px-2 py-1 bg-black/30 rounded-full border border-white/10 shadow-lg overflow-hidden">
                                    {brandLogo && (
                                     <div className="size-[18px] sm:size-[20px] rounded-full overflow-hidden shrink-0 bg-white/40 border border-white/40 shadow-sm relative">
                                       <Image src={brandLogo} alt="Logo" fill className="object-cover" crossOrigin="anonymous" unoptimized />
                                     </div>
                                    )}
                                    {brandHandle && (
                                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black tracking-wider text-white uppercase drop-shadow-md pr-1">
                                        <span>{brandHandle}</span>
                                        <svg className="w-[11px] h-[11px] shrink-0 fill-[#3897f0]" viewBox="0 0 40 40">
                                          <circle cx="20" cy="20" r="12" fill="white" />
                                          <path d="M20 0L24.5 3.5L30 2.5L31 8L36 11L34.5 16.5L37.5 21.5L33.5 25.5L33.5 31.5L28 32L24 36.5L19.5 33L14 35.5L11 30.5L5.5 29L6 23.5L2 19.5L5.5 15L5 9.5L10.5 8L14 3.5L20 0Z" />
                                          <path d="M17 21L14.5 18.5L13 20L17 24L27 14L25.5 12.5L17 21Z" fill="white" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Conteúdo da Capa com Gradiente Dinâmico (Escala com o texto) */}
                              <div className={`w-full ${textPadding} ${textAlign} z-20 relative mt-auto ${theme.bgClass ? '' : 'bg-gradient-to-t from-black/60 to-transparent'}`}
                                style={{
                                  fontFamily,
                                  color: styleModel === 'Personalizado' ? customTextColor : theme.textClass.includes('text-white') ? '#ffffff' : '#0f172a',
                                  background: styleModel === 'Personalizado' ? `linear-gradient(to top, ${customColor} 0%, ${customColor}F2 75%, ${customColor}A6 95%, ${customColor}00 100%)` : undefined,
                                  paddingTop: '22px' // Margem mínima no topo
                                }}>

                                <div className={`flex flex-col gap-2 ${textAlign === 'text-center' ? 'items-center text-center' : textAlign === 'text-right' ? 'items-end text-right' : 'items-start text-left'}`}>
                                  {!isEmptyHtml(slide.title) && (
                                    <h2 className={`${titleClass} uppercase [&>div]:inline cursor-text select-text`}
                                      style={{
                                        color: customTextColor,
                                        fontSize: `${isFirst ? Math.min(titleSize, titleLength > 100 ? 20 : titleLength > 60 ? 24 : 32) : titleSize}px`
                                      }}
                                      onDoubleClick={(e) => { e.stopPropagation(); handleEditClick(index); }}
                                      dangerouslySetInnerHTML={{ __html: slide.title }}
                                    />
                                  )}
                                  {!isEmptyHtml(slide.subtitle) && (
                                    <p className={`${subtitleClass} [&>div]:inline leading-tight font-medium opacity-100 cursor-text select-text`}
                                      style={{
                                        color: customTextColor,
                                        fontSize: `${subSize}px`
                                      }}
                                      onDoubleClick={(e) => { e.stopPropagation(); handleEditClick(index); }}
                                      dangerouslySetInnerHTML={{ __html: slide.subtitle }}
                                    />
                                  )}
                                </div>
                                <div className="absolute bottom-3 right-6 z-30">
                                  <div className={`flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity`} style={{ color: customTextColor }}>
                                    <span className={`text-[9px] font-black tracking-[0.3em] uppercase`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Deslize</span>
                                    <span className="text-[12px] font-bold">&gt;</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            /* --- LAYOUT INTERNO (DEMAIS SLIDES) --- */
                            <div className={`flex flex-col flex-1 ${contentOrder}`}>
                              <div
                                className="flex-1 relative overflow-hidden z-10"
                              >
                                {imageSrc && (
                                  <Image
                                    src={imageSrc}
                                    alt={`Slide ${index}`}
                                    fill
                                    className="absolute inset-0 object-cover transition-transform duration-500"
                                    style={{ objectPosition: `center ${imagePosMap[index] ?? 50}%` }}
                                    crossOrigin="anonymous"
                                    unoptimized
                                  />
                                )}

                                {/* Branding para slides internos (segue o layout) */}
                                <div className={`absolute ${isImageBottom ? 'bottom-4' : 'top-4'} left-4 z-50`} style={{ opacity: 0.7 }}>
                                  {(brandHandle || brandLogo) && (
                                    <div className="flex items-center gap-1.5 px-2 py-1">
                                      {brandLogo && (
                                        <div className="size-[18px] rounded-full overflow-hidden bg-white/20 border border-white/30 relative">
                                          <Image src={brandLogo} alt="Logo" fill className="object-cover" crossOrigin="anonymous" unoptimized />
                                        </div>
                                      )}
                                      {brandHandle && <span className="text-[9px] font-bold text-white uppercase tracking-wider">{brandHandle}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className={`w-full ${textPadding} ${textAlign} relative z-20 ${theme.bgClass}`} style={{ 
                                fontFamily, 
                                color: styleModel === 'Personalizado' ? customTextColor : undefined, 
                                backgroundColor: styleModel === 'Personalizado' || styleModel === 'Escuro' || styleModel === 'Minimalista' || styleModel === 'Regional' ? customColor : undefined 
                              }}>
                                <div className={`flex flex-col gap-2 ${textAlign === 'text-center' ? 'items-center text-center' : textAlign === 'text-right' ? 'items-end text-right' : 'items-start text-left'}`}>
                                  {!isEmptyHtml(slide.title) && <h2 className={`${titleClass} uppercase [&>div]:inline cursor-text select-text`} style={{ color: customTextColor, fontSize: `${titleSize}px` }} onDoubleClick={(e) => { e.stopPropagation(); handleEditClick(index); }} dangerouslySetInnerHTML={{ __html: slide.title }} />}
                                  {!isEmptyHtml(slide.subtitle) && <p className={`${subtitleClass} [&>div]:inline leading-relaxed cursor-text select-text`} style={{ color: customTextColor, fontSize: `${subSize}px` }} onDoubleClick={(e) => { e.stopPropagation(); handleEditClick(index); }} dangerouslySetInnerHTML={{ __html: slide.subtitle }} />}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className={`absolute inset-0 bg-black/80 transition-opacity duration-200 flex flex-col items-center justify-center p-6 backdrop-blur-[4px] z-[60] cursor-pointer outline-none overflow-hidden capture-exclude ${openSlideIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover/slide:opacity-100 group-hover/slide:pointer-events-auto'}`}
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
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSlide(index); }}
                                className="pointer-events-auto flex items-center justify-start gap-3 bg-red-500/20 text-red-100 hover:bg-red-500/40 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/30">
                                <span className="material-symbols-outlined text-[16px]">folder_delete</span> Excluir Slide
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
                              {/* Regerar IA Ocultado (Soft Delete) */}
                              <button
                                onClick={(e) => { e.stopPropagation(); regenerateImageForSlide(index); }}
                                disabled={generatingImages[index]}
                                className="hidden pointer-events-auto flex items-center justify-start gap-3 bg-indigo-600/90 text-white hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 disabled:opacity-50">
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
                                <span className="material-symbols-outlined text-[16px]">image_not_supported</span> Remover Imagem
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-auto bottom-8 right-6 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-full lg:right-auto lg:ml-4 max-lg:opacity-100 opacity-0 group-hover/slide-wrapper:opacity-100 transition-opacity z-[999] pointer-events-auto capture-exclude">
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

                <button
                  onClick={() => {
                    const normalSlides = parsedSlides.filter(s => !s.isCta);
                    const nextSlideNum = normalSlides.length + 1;
                    const newSlideData = { title: 'Novo Título', subtitle: 'Novo texto do slide aqui...', isCta: false };

                    // 1. Atualizar parsedSlides (mantém o CTA no final)
                    setParsedSlides(prev => {
                      const newArr = [...prev];
                      if (addCtaSlide && newArr.length > 0 && newArr[newArr.length - 1].isCta) {
                        newArr.splice(newArr.length - 1, 0, newSlideData);
                      } else {
                        newArr.push(newSlideData);
                      }
                      return newArr;
                    });

                    // 2. Atualizar uploadedImages (mantém o CTA no final)
                    setUploadedImages(prev => {
                      const newArr = [...prev];
                      if (addCtaSlide && parsedSlides.length > 0 && parsedSlides[parsedSlides.length - 1].isCta) {
                        newArr.splice(newArr.length - 1, 0, null);
                      } else {
                        newArr.push(null);
                      }
                      return newArr;
                    });

                    // 3. Sincronizar com a sidebar (content)
                    const updatedManualSlides = [...normalSlides, newSlideData];
                    const newContent = updatedManualSlides.map((s, i) => {
                      const sNum = i + 1;
                      const sNumStr = sNum < 10 ? `0${sNum}` : sNum;
                      return `SLIDE ${sNumStr}:\n[TÍTULO]: ${s.title}\n[SUBTÍTULO]: ${s.subtitle}`;
                    }).join('\n\n');

                    setContent(newContent);
                    if (isIuryMode) setIsIuryMode(false);
                    setHasNewPreview(true);
                  }}
                  className={`w-[100px] ${aspectRatio === '9:16' ? 'h-[560px]' : 'h-[500px]'} shrink-0 rounded-2xl border-2 border-dashed border-slate-300 dark:border-border-dark flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group`}
                >
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
            <span className="text-[10px] sm:text-xs font-mono text-slate-900 dark:text-white font-medium whitespace-nowrap">Slide {currentSlideIndex + 1} / {slideCount}</span>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">chevron_right</span></button>
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-[18px] sm:text-[24px]">last_page</span></button>
          </div>
        </section>
      </main>

      {
        editingSlideIndex !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-border-dark">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Slide {(editingSlideIndex ?? 0) + 1}</h3>
                <button
                  onClick={() => setEditingSlideIndex(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-custom">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Título</label>
                  <SimpleRichTextEditor
                    value={editTitle}
                    onChange={setEditTitle}
                    placeholder="Digite o título do slide..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subtítulo / Texto de Apoio</label>
                  <SimpleRichTextEditor
                    value={editSubtitle}
                    onChange={setEditSubtitle}
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
