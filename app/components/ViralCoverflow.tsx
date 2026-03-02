'use client';

import React, { useRef, useEffect, useState } from 'react';

const viralImages = [
    { id: 1, src: '/images/viral-1.jpg', alt: 'Carrossel Viral 1' },
    { id: 2, src: '/images/viral-2.png', alt: 'Carrossel Viral 2' },
    { id: 3, src: '/images/viral-3.png', alt: 'Carrossel Viral 3' },
    { id: 4, src: '/images/viral-4.png', alt: 'Carrossel Viral 4' }
];

export default function ViralCoverflow() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current) return;
            const { scrollLeft, clientWidth } = scrollRef.current;
            const items = Array.from(scrollRef.current.children);
            let closest = 0;
            let minDistance = Infinity;

            items.forEach((item, index) => {
                const itemCenter = (item as HTMLElement).offsetLeft + ((item as HTMLElement).offsetWidth / 2);
                const viewCenter = scrollLeft + (clientWidth / 2);
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
            // call once to initialize
            handleScroll();
            // small timeout to ensure layout is done
            setTimeout(handleScroll, 100);
        }
        return () => scrollEl?.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToIndex = (index: number) => {
        if (!scrollRef.current) return;
        const items = Array.from(scrollRef.current.children);
        if (items[index]) {
            const item = items[index] as HTMLElement;
            // Calcula posição exata para centralizar
            const scrollPosition = item.offsetLeft - (scrollRef.current.clientWidth / 2) + (item.offsetWidth / 2);
            scrollRef.current.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="w-full relative overflow-hidden py-4 sm:py-6">
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 pt-2"
                style={{
                    paddingLeft: 'calc(50vw - 140px)',
                    paddingRight: 'calc(50vw - 140px)'
                }}
            >
                {viralImages.map((img, idx) => {
                    const isActive = activeIndex === idx;
                    // Efeitos extras dinâmicos dependendo da distância para ser mais "Coverflow"
                    // O mais distante fica menor.
                    const isAdjacent = Math.abs(activeIndex - idx) === 1;

                    return (
                        <div
                            key={img.id}
                            onClick={() => scrollToIndex(idx)}
                            className={`shrink-0 snap-center transition-all duration-500 ease-out cursor-pointer -mx-6 sm:-mx-8 relative
                ${isActive
                                    ? 'z-30 scale-100 opacity-100 shadow-[0_20px_50px_rgba(168,85,247,0.4)] blur-none'
                                    : isAdjacent
                                        ? 'z-20 scale-[0.85] opacity-60 shadow-lg blur-[1px]'
                                        : 'z-10 scale-[0.75] opacity-30 shadow-md blur-[3px]'
                                }
              `}
                            style={{ width: '280px', height: '420px', borderRadius: '1.5rem' }}
                        >
                            <div className="w-full h-full bg-slate-900 rounded-[1.5rem] overflow-hidden border-2 border-slate-700/50 relative">
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <div className="hidden absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-900 border-2 border-dashed border-slate-700 rounded-[1.5rem]">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">image</span>
                                    <span className="text-xs font-semibold">COLOQUE A<br />FOTO: {img.src.replace('/', '')}<br />NA PASTA /PUBLIC</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-0 relative z-40">
                <div className="flex gap-2.5">
                    {viralImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollToIndex(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]' : 'w-2.5 bg-slate-700 hover:bg-slate-600'}`}
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
        </div>
    );
}
