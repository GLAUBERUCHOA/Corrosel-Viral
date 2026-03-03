'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Zap, Image as ImageIcon, LayoutTemplate, Calendar, Video, BookOpen, Infinity, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import ViralCoverflow from './components/ViralCoverflow';
import Image from 'next/image';

// Efeito de intersecção suave (Fade-in ao rolar)
const useScrollFade = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const FadeInSection = ({ children, delay = '' }: { children: React.ReactNode, delay?: string }) => {
  const ref = useScrollFade();
  return (
    <div ref={ref} className={`opacity-0 translate-y-8 transition-all duration-1000 ease-out ${delay}`}>
      {children}
    </div>
  );
};

export default function HomePage() {
  const primaryGlowingShadow = "shadow-[0_0_30px_rgba(139,92,246,0.3)]";
  const cardGlowingShadow = "hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-start justify-center">
        <div className="absolute top-[-10%] w-[800px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen opacity-60"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen opacity-50"></div>
      </div>

      <div className="relative z-10">

        {/* HEADER / HERO SECTION */}
        <section className="pt-10 pb-12 sm:pt-20 sm:pb-24 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
          <FadeInSection>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Crie Carrosséis virais <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                COM APENAS 1 CLIQUE
              </span><br className="hidden md:block" />
              <span className="mt-2 block">e transforme seu Instagram em uma máquina de vendas automáticas</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8 px-2 font-medium">
              A nossa ferramenta Carrossel Viral Labs e nossas IAs fazem o trabalho todo por você.
            </p>

            {/* ESPAÇO PARA O VÍDEO DE VENDAS */}
            <div className="w-full max-w-4xl mx-auto h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] border-2 border-slate-800 border-dashed rounded-[2rem] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center text-slate-500 gap-4 group hover:border-slate-600 transition-colors relative overflow-hidden mb-12 shadow-2xl">
              <div className="absolute inset-0 bg-black/40 z-10"></div>
              <Video size={56} className="text-slate-600 group-hover:text-slate-400 transition-colors z-20" />
              <p className="font-medium z-20 text-center px-4">[ESPAÇO DO VÍDEO] <br className="sm:hidden" /> Inserir iFrame do YouTube ou Vimeo aqui.</p>
            </div>

            <div className="flex flex-col items-center justify-center relative">
              <div className="absolute top-0 left-0 w-full h-full border border-orange-500/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] z-0"></div>
              <div className="absolute top-0 left-0 w-full h-full border border-amber-500/30 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] delay-150 z-0"></div>

              <a
                href="/login"
                className="relative z-10 inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black uppercase tracking-wide text-base sm:text-lg px-8 py-4 sm:px-10 sm:py-5 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-orange-400/80 w-[95%] sm:w-auto text-center leading-snug"
              >
                <span>SIM, EU QUERO VIRALIZAR HOJE!</span>
              </a>

              <span className="text-sm sm:text-base font-medium text-amber-200/80 mt-4 relative z-10 flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-400" /> Acesso Vitalício + Bônus Exclusivos
              </span>
            </div>

            {/* ESPAÇO PARA A IMAGEM PRINCIPAL DO HERO (Produto/Mockups ou Autor) */}
            <div className="mt-20 w-full max-w-4xl mx-auto h-[400px] border border-slate-800 border-dashed rounded-[2rem] bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500 gap-4 group hover:border-slate-600 transition-colors relative overflow-hidden hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10"></div>
              <ImageIcon size={48} className="text-slate-700 group-hover:text-slate-500 transition-colors z-20" />
              <p className="font-medium z-20">[ESPAÇO 1] Insira aqui a foto da capa ou mockups do Sistema</p>
              <span className="text-xs text-slate-600 z-20">(Sugestão: 1200x800px)</span>
            </div>
          </FadeInSection>
        </section>

        {/* VIRAL CAROUSEL SHOWCASE */}
        <section className="py-20 relative overflow-hidden bg-slate-950/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05)_0%,transparent_70%)] pointer-events-none"></div>

          <div className="max-w-6xl mx-auto px-6 mb-2 text-center relative z-10">
            <FadeInSection>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                Veja o poder dos <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Carrosséis Virais</span>
              </h2>
              <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
                Milhões de visualizações = audiência = seguidores = muitas vendas em qualquer nicho!
              </p>
            </FadeInSection>
          </div>

          <FadeInSection delay="delay-100">
            <ViralCoverflow />
          </FadeInSection>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-16 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-6">
            <FadeInSection>
              <div className="text-center mb-10">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                  <span className="w-8 h-px bg-slate-700"></span>
                  Métricas Comprovadas 🔥
                  <span className="w-8 h-px bg-slate-700"></span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-12">
                <div className="flex flex-col gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">+2.540</span>
                  <span className="text-slate-400 font-medium">Alunos Lucrando.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">+20 Milhões</span>
                  <span className="text-slate-400 font-medium">de Alcance Mensal gerado.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">+1 Milhão</span>
                  <span className="text-slate-400 font-medium">de Seguidores nos Perfis da Comunidade.</span>
                </div>
              </div>

              {/* ESPAÇO PARA A IMAGEM DE DASHBOARD / GRÁFICO DE ALCANCE */}
              <div className="w-full max-w-5xl mx-auto h-[350px] border border-slate-800 border-dashed rounded-[2rem] bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500 gap-4 group hover:border-slate-600 transition-colors mb-16">
                <ImageIcon size={48} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                <p className="font-medium">[ESPAÇO 2] Imagem: Um dashboard ou gráfico mostrando a curva de crescimento de alcance de 20 milhões e um contador de 1.000.000+ seguidores</p>
              </div>

              {/* ESPAÇO PARA PRINTS E PROVAS SOCIAIS (Carrossel ou Grid) */}
              <div className="w-full max-w-5xl mx-auto h-[350px] border border-slate-800 border-dashed rounded-[2rem] bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500 gap-4 group hover:border-slate-600 transition-colors">
                <ImageIcon size={48} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                <p className="font-medium">[ESPAÇO 2] Insira aqui os prints de métricas absurdas ou depoimentos do WhatsApp</p>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* PAIN & AGITATION */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeInSection>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-16">
                Você se sente um <span className="text-red-400 relative">"escravo"<svg className="absolute w-full h-3 -bottom-1 left-0 text-red-500 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" /></svg></span> do Instagram?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
                <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><Zap /></div>
                  <p className="text-slate-300 font-medium">Você passa horas tentando ter uma ideia, sofre olhando para a tela em branco do Canva...</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><Infinity /></div>
                  <p className="text-slate-300 font-medium">E quando finalmente posta o seu Carrossel, recebe apenas 15 curtidas e zero vendas.</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><ShieldCheck /></div>
                  <p className="text-slate-300 font-medium">Enquanto você patina no amadorismo, seus concorrentes estão usando Sistemas Inteligentes.</p>
                </div>
              </div>

              <div className="bg-[#0A0A0B] border border-slate-800/80 rounded-[2rem] overflow-hidden flex flex-col md:flex-row mt-16 group hover:border-slate-700 transition-all duration-500 shadow-2xl max-w-5xl mx-auto">
                <div className="w-full md:w-5/12 h-[350px] md:h-auto relative overflow-hidden shrink-0">
                  <Image
                    src="/images/cinematic_portrait.png"
                    alt="Empreendedor Digital"
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent md:bg-gradient-to-l md:from-[#0A0A0B] md:via-transparent opacity-90 z-10"></div>
                </div>

                <div className="w-full md:w-7/12 p-8 md:p-10 lg:p-12 text-left flex flex-col justify-center relative z-20 bg-[#0A0A0B]">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">
                    Quer crescer a audiência do seu perfil, viralizar e atrair mais clientes para <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">vender todos os dias?</span>
                  </h3>

                  <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                    Com os modelos de carrosséis virais gerados com um clique por IA você acelera sua produção e seus resultados.
                  </p>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3">
                      <span className="text-xl bg-slate-900/50 p-2 rounded-xl">🚀</span>
                      <span className="text-slate-200 font-medium">Aulas práticas de como usar a ferramenta</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-xl bg-slate-900/50 p-2 rounded-xl">🧩</span>
                      <span className="text-slate-200 font-medium">Serve para qualquer nicho</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-xl bg-slate-900/50 p-2 rounded-xl">🤖</span>
                      <span className="text-slate-200 font-medium">Inteligência Artificial que faz o trabalho duro por você</span>
                    </li>
                  </ul>

                  <div className="text-slate-200 font-medium mb-8 space-y-3 leading-relaxed text-sm lg:text-base">
                    <p>Seja você nutricionista, psicólogo, advogado, empreendedor digital ou de qualquer outro nicho: <strong className="text-white">se você não tem velocidade, você está perdendo dinheiro.</strong></p>
                    <p>Se você não sabe criar narrativas, <strong className="text-white">você está perdendo dinheiro.</strong></p>
                    <p>Se você ainda não usa IA no seu processo produtivo, <strong className="text-purple-400">vai ficar pra trás.</strong></p>
                  </div>

                  <p className="text-orange-400 font-bold text-sm md:text-base tracking-wide mt-auto">
                    Esqueça o trabalho manual, o Canva... Nossos modelos são validados em diversos nichos!
                  </p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* SOLUTION 3 STEPS */}
        <section className="py-24 bg-black/40 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Conheça o seu novo <span className="text-purple-400">"Time de Elite" de IA</span> 🤖</h2>
                <p className="text-slate-400 text-lg">Dentro do Carrossel Viral Lab, você não ganha apenas um curso, você ganha agentes treinados para trabalhar por você:</p>
              </div>

              {/* MOCKUP DO LABORATÓRIO */}
              <div className="w-full max-w-4xl mx-auto h-[350px] border border-slate-800 border-dashed rounded-[2rem] bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500 gap-4 group hover:border-slate-600 transition-colors mb-16">
                <ImageIcon size={48} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                <p className="font-medium text-center px-4">[ESPAÇO 3] Imagem: Mockup do Carrossel Viral Lab no Celular e Computador</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative max-w-5xl mx-auto">
                {[
                  { icon: BookOpen, title: "🎙️ Agente Iury (Roteiros)", desc: "Esqueça o bloqueio criativo. O Iury cria roteiros magnéticos, automáticos e persuasivos. Ele entende o que faz o dedo do usuário parar o scroll e clicar no 'saiba mais'." },
                  { icon: ImageIcon, title: "🎨 Agente DaVinci (Imagens)", desc: "Chega de fotos de banco de imagem genéricas. O DaVinci gera imagens com IA de altíssimo nível, de forma automática, para deixar seu perfil com cara de agência de luxo." },
                  { icon: Video, title: "🎬 Aulas Passo a Passo", desc: "Você vai aprender a apertar os botões certos. Sem enrolação, direto ao ponto." },
                  { icon: Sparkles, title: "🧠 Segredos da Viralização", desc: "A ciência por trás dos posts que explodem. O que postar, quando postar e como forçar o algoritmo a te entregar para milhares de pessoas." }
                ].map((item, i) => (
                  <div key={i} className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl relative z-10 hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl mb-6 shadow-lg shadow-purple-500/20">
                      <item.icon />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* THE DELIVERABLES (O QUE VOCÊ RECEBE) */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeInSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-xs font-semibold tracking-wide mb-6">
                  TUDO O QUE ESTÁ INCLUSO NO SEU ACESSO HOJE
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">O que você vai receber</h2>
              </div>

              {/* MOCKUP DO BUNDLE */}
              <div className="w-full max-w-5xl mx-auto flex items-center justify-center mb-16 relative group px-2 sm:px-4">
                <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0 pointer-events-none"></div>
                <div className="relative z-10 w-full h-auto flex justify-center">
                  <Image
                    src="/images/mockup-lab.png"
                    alt="Mockup do Bundle Carrossel Viral Lab"
                    width={1200}
                    height={800}
                    quality={90}
                    className="w-full h-auto max-w-full sm:max-w-[900px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-2 hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: LayoutTemplate, title: "Plataforma Carrossel Viral Lab", val: "R$ 197" },
                  { icon: BookOpen, title: "Agente Iury - Roteiros Automáticos", val: "R$ 97" },
                  { icon: ImageIcon, title: "Agente DaVinci - Imagens com IA", val: "R$ 97" },
                  { icon: Sparkles, title: "Workshop Segredos da Viralização", val: "R$ 147" },
                  { icon: Video, title: "Aulas Passo a Passo de Implementação", val: "R$ 97" }
                ].map((feature, i) => (
                  <div key={i} className={`bg-slate-900/50 border border-slate-800 p-8 rounded-3xl transition-all duration-300 flex flex-col items-center text-center ${cardGlowingShadow} group`}>
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-amber-500 mb-6 group-hover:bg-amber-500/20 transition-colors">
                      <feature.icon strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 font-medium mb-4">Valor avulso: <span className="line-through">{feature.val}</span></p>
                    <div className="mt-auto inline-flex items-center text-green-400 text-sm font-bold gap-1 bg-green-500/10 px-3 py-1 rounded-lg">
                      <CheckCircle2 size={14} /> INCLUSO
                    </div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* BONUSES */}
        <section className="py-20 bg-gradient-to-b from-transparent to-purple-900/10 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6">
            <FadeInSection>
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">ENTRE HOJE E LEVE TAMBÉM: 🎁 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Bônus Exclusivos</span></h2>

              <div className="space-y-4">
                {[
                  { title: "BÔNUS 1: Acesso Vitalício (Tempo Limitado)", desc: "Pague uma vez e use para sempre. Sem mensalidades enquanto esta oferta estiver no ar.", icon: Infinity },
                  { title: "BÔNUS 2: Workshop 'Viva do Instagram'", desc: "O plano de ação para transformar seguidores em clientes e viver exclusivamente da sua presença digital.", icon: Sparkles },
                  { title: "BÔNUS 3: Updates e Melhorias Futuras", desc: "O mundo da IA muda todo dia. Você terá acesso a todas as novas ferramentas e atualizações que lançarmos sem pagar um centavo a mais.", icon: Zap }
                ].map((bonus, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900/80 to-slate-900/40 border border-slate-800">
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <bonus.icon size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white">{bonus.title}</h3>
                      </div>
                      <p className="text-slate-400">{bonus.desc}</p>
                    </div>
                    <div className="hidden sm:block text-amber-500 font-bold uppercase text-sm bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20">
                      GRÁTIS HOJE
                    </div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* OFFER & PRICE */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_60%)] pointer-events-none"></div>
          <div className="max-w-3xl mx-auto">
            <FadeInSection>
              <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-purple-500/30 rounded-[2.5rem] p-8 sm:p-14 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full"></div>

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 border border-amber-500/30 text-amber-400 font-bold uppercase text-xs tracking-widest px-5 py-2 rounded-full mb-8 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Acesso vitalício terminando
                  </div>

                  <div className="text-slate-400 font-medium mb-4 text-base sm:text-lg max-w-xs mx-auto">Saia do amadorismo pelo preço de uma pizza por mês 🍕<br /> De <span className="line-through">R$ 397,00</span> por apenas:</div>

                  <div className="flex flex-col items-center justify-center mt-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-purple-400">12x de</span>
                      <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 leading-none">R$ 9,74</span>
                    </div>
                    <div className="text-white/90 font-semibold text-lg bg-white/5 px-4 py-1 rounded-full border border-white/10">ou R$ 97,00 à vista no PIX</div>
                  </div>

                  <div className="flex flex-col items-center justify-center relative w-[95%] sm:w-auto mx-auto mb-6">
                    <div className="absolute top-0 left-0 w-full h-full border border-orange-500/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] z-0"></div>
                    <div className="absolute top-0 left-0 w-full h-full border border-amber-500/30 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] delay-150 z-0"></div>
                    <a
                      href="/login"
                      className="relative z-10 block w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black uppercase tracking-widest text-base sm:text-lg px-8 py-5 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-orange-400/50 leading-snug"
                    >
                      QUERO MEU ACESSO VITALÍCIO AGORA
                    </a>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-400" /> Acesso liberado no seu e-mail imediatamente logo após a compra.
                  </p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* GUARANTEE */}
        <section className="py-16 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <FadeInSection>
              <div className="w-20 h-20 mx-auto bg-green-500/10 border border-green-500/20 flex items-center justify-center rounded-3xl text-green-400 mb-8">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">Risco Zero: 15 Dias de Garantia Blindada</h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
                Teste o sistema, use o Iury e o DaVinci. Se em 15 dias você não achar que esse é o sistema mais rápido de criação de conteúdo que já viu, eu devolvo seu dinheiro integralmente.
              </p>
            </FadeInSection>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <FadeInSection>
              <h2 className="text-3xl font-bold text-center text-white mb-16">Dúvidas Frequentes</h2>

              <div className="space-y-4">
                {[
                  { q: "Serve para o meu nicho?", a: "Sim, se você precisa de atenção e vendas no Instagram, o sistema se adapta a qualquer área." },
                  { q: "Preciso ser designer?", a: "Não. O DaVinci e os templates fazem tudo com um clique." },
                  { q: "O acesso é vitalício mesmo?", a: "Sim, para quem comprar nesta oferta atual." }
                ].map((faq, i) => (
                  <details key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl group overflow-hidden">
                    <summary className="text-white font-bold text-lg p-6 flex items-center justify-between cursor-pointer list-none appearance-none outline-none">
                      <div className="flex items-start gap-4">
                        <span className="text-purple-500 shrink-0 mt-0.5"><CheckCircle2 size={20} /></span>
                        {faq.q}
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-400 group-open:-rotate-180 transition-transform duration-300" />
                    </summary>
                    <div className="px-6 pb-6 pt-0 ml-9 border-t border-white/5 mt-2">
                      <p className="text-slate-400 leading-relaxed pt-4">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* AUTHOR SUMMARY */}
        <section className="py-24 bg-slate-900 border-t border-white/5 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-[2rem] bg-gradient-to-tr from-slate-900 to-slate-800 shrink-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative border border-slate-700 flex items-center justify-center group flex-col text-slate-500">
              <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay z-0"></div>
              <img src="/images/author.webp" alt="Glauber Uchoa" className="w-[120%] h-[120%] object-cover object-center relative z-10 transition-transform duration-700 group-hover:scale-105 opacity-90 hover:opacity-100" />
            </div>
            <div className="text-center md:text-left">
              <FadeInSection>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-xs font-semibold tracking-wide mb-6">
                  SOBRE O AUTOR
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Quem é Glauber Uchoa?</h2>
                <div className="text-slate-400 text-lg leading-relaxed space-y-4">
                  <p>
                    Estrategista digital e criador de ecossistemas que somam mais de 1,5 milhão de seguidores. Glauber transformou sua paixão por tecnologia e marketing em ferramentas práticas que eliminam o trabalho braçal de quem quer crescer na internet.
                  </p>
                  <p>
                    Com o <strong className="text-white">Carrossel Viral Lab</strong>, ele traz a mesma tecnologia secreta que usa em seus grandes projetos para o seu negócio, simplificando o que parece complexo em 3 cliques para que você foque no que importa: <strong>vender e crescer.</strong>
                  </p>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* FOOTER & SCARCITY */}
        <footer className="pt-24 pb-12 px-6 bg-slate-950 border-t border-white/10 text-center relative overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-purple-600/10 blur-[100px] rounded-t-full pointer-events-none"></div>

          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">Sua decisão de <span className="text-purple-400">hoje</span> define seu Instagram pelos próximos 12 meses.</h2>

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-12 text-left sm:text-center text-lg">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="text-red-500 font-bold">❌</span> Continuar postando no escuro, ignorado pelo nicho.
              </div>
              <div className="flex items-center gap-3 text-white font-medium">
                <span className="text-green-500 font-bold">✅</span> Trocar o valor de uma pizza por um sistema validado.
              </div>
            </div>

            <div className="flex flex-col items-center justify-center relative mb-16 w-[95%] sm:w-auto mx-auto">
              <div className="absolute top-0 left-0 w-full h-full border border-orange-500/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] z-0"></div>
              <div className="absolute top-0 left-0 w-full h-full border border-amber-500/30 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] delay-150 z-0"></div>
              <a
                href="/login"
                className="relative z-10 block w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black uppercase tracking-widest text-base sm:text-lg px-8 py-5 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-orange-400/50 leading-snug"
              >
                APROVEITE O DESCONTO E GARANTA SUA VAGA
              </a>
            </div>

            <div className="text-slate-600 text-sm flex flex-col items-center gap-2">
              <p>© 2026 Carrossel Viral Lab. Todos os direitos reservados.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-slate-400 transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-slate-400 transition-colors">Privacidade</a>
                <a href="/login" className="hover:text-purple-400 transition-colors">Área de Membros</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
