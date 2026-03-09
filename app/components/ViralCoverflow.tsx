'use client';

import React, { useRef, useEffect, useState } from 'react';

const viralImages = [
    { id: 1, src: '/images/viral-1.jpg', alt: 'Carrossel Viral 1' },
    { id: 2, src: '/images/viral-2.png', alt: 'Carrossel Viral 2' },
    { id: 3, src: '/images/viral-3.png', alt: 'Carrossel Viral 3' },
    { id: 4, src: '/images/viral-4.png', alt: 'Carrossel Viral 4' },
    { id: 5, src: '/images/viral-5.jpg', alt: 'Agente de Roteiros Pizza' },
    { id: 6, src: '/images/viral-6.jpg', alt: 'Insight Curioso Cães' },
    { id: 7, src: '/images/viral-7.jpg', alt: 'Saladeconhecimento Detox' },
    { id: 8, src: '/images/viral-8.jpg', alt: 'Psicologia e Autenticidade' }
];

export default function ViralCoverflow() {
    const scrollRef = useRef<HTMLDivElement>(null);
    // Começa no meio do carrossel para balancear visualmente
    const [activeIndex, setActiveIndex] = useState(Math.floor(viralImages.length / 2));

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current) return;
            const container = scrollRef.current;
            const { scrollLeft, clientWidth } = container;
            const children = Array.from(container.children);

            let closest = 0;
            let minDistance = Infinity;
            const viewCenter = scrollLeft + (clientWidth / 2);

            children.forEach((child, index) => {
                const el = child as HTMLElement;
                const itemCenter = el.offsetLeft + (el.offsetWidth / 2);
                const distance = Math.abs(viewCenter - itemCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = index;
                }
            });
            setActiveIndex(closest);
        };

        const scrollEl = scrollRef.current;
        if (scrollEl) {
            scrollEl.addEventListener('scroll', handleScroll, { passive: true });

            // Força a centralização inicial no meio após o carregamento
            setTimeout(() => {
                scrollToIndex(Math.floor(viralImages.length / 2));
            }, 100);

            handleScroll();
            // Refazer após o mount pleno
            setTimeout(handleScroll, 500);
        }
        return () => scrollEl?.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToIndex = (index: number) => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const items = Array.from(container.children);
        if (items[index]) {
            const item = items[index] as HTMLElement;
            const scrollPosition = item.offsetLeft - (container.clientWidth / 2) + (item.offsetWidth / 2);
            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="w-full relative py-16 sm:py-24">
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-16 pt-8 relative z-20"
                style={{
                    paddingLeft: 'calc(50% - 150px)',
                    paddingRight: 'calc(50% - 150px)'
                }}
            >
                {viralImages.map((img, idx) => {
                    const isActive = activeIndex === idx;
                    const distance = Math.abs(activeIndex - idx);
                    const isAdjacent = distance === 1;

                    return (
                        <div
                            key={img.id}
                            onClick={() => scrollToIndex(idx)}
                            className={`shrink-0 snap-center transition-all duration-700 ease-out cursor-pointer mx-2 sm:mx-6 relative
                ${isActive
                                    ? 'z-30 scale-110 opacity-100 shadow-[0_0_100px_rgba(168,85,247,0.5)]'
                                    : isAdjacent
                                        ? 'z-20 scale-90 opacity-40'
                                        : 'z-10 scale-[0.75] opacity-10'
                                }
              `}
                            style={{
                                width: '300px',
                                height: '533px',
                                borderRadius: '1.5rem',
                                transform: isActive ? 'scale(1.1)' : `scale(0.9) ${idx < activeIndex ? 'rotateY(15deg)' : 'rotateY(-15deg)'}`,
                                perspective: '1000px'
                            }}
                        >
                            <div className="w-full h-full bg-slate-900 rounded-[1.5rem] overflow-hidden border-2 border-slate-700/30 relative group shadow-2xl">
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="w-full h-full object-contain bg-black transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <div className="hidden absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 border-2 border-dashed border-slate-700/50 rounded-[1.5rem]">
                                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                        <span className="material-symbols-outlined text-4xl text-purple-400 opacity-80">image_not_supported</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                                        Slide: {img.id}<br />
                                        <span className="text-purple-400/80">Aguardando seu Upload</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-8 relative z-40">
                <div className="flex gap-3 bg-slate-900/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
                    {viralImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollToIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${activeIndex === idx ? 'w-10 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'w-1.5 bg-slate-700 hover:bg-slate-500'}`}
                        />
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
        </div >
    );
}
