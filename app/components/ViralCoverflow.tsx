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
    const [activeIndex, setActiveIndex] = useState(0);

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
            handleScroll();
            // Refazer após o mount pleno
            setTimeout(handleScroll, 200);
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
        <div className="w-full relative overflow-hidden py-8 sm:py-12">
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-10 pt-4"
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
                            className={`shrink-0 snap-center transition-all duration-700 ease-out cursor-pointer mx-2 sm:mx-4 relative
                ${isActive
                                    ? 'z-30 scale-110 opacity-100 shadow-[0_30px_60px_rgba(168,85,247,0.5)] blur-none rotate-0'
                                    : isAdjacent
                                        ? 'z-20 scale-90 opacity-60 shadow-xl blur-[0.5px]'
                                        : 'z-10 scale-[0.75] opacity-20 shadow-md blur-[2px]'
                                }
              `}
                            style={{
                                width: '300px',
                                height: '450px',
                                borderRadius: '2rem',
                                transform: isActive ? 'scale(1.1)' : `scale(0.9) ${idx < activeIndex ? 'rotateY(10deg)' : 'rotateY(-10deg)'}`
                            }}
                        >
                            <div className="w-full h-full bg-slate-900 rounded-[2rem] overflow-hidden border-2 border-slate-700/50 relative group">
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <div className="hidden absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-900 border-2 border-dashed border-slate-700 rounded-[2rem]">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">image</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Slide: {img.id}<br />Aguardando Imagem</span>
                                </div>
                                <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
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
