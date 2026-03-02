'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Zap, Image as ImageIcon, LayoutTemplate, Calendar, Video, BookOpen, Infinity, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';

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
        <section className="pt-24 pb-20 sm:pt-32 sm:pb-24 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide mb-8">
              <Sparkles className="w-4 h-4" /> NOVO SISTEMA DE CRIAÇÃO VIRAL
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
              Transforme seu Instagram em uma <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                MÁQUINA de vendas automática
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
              com carrosséis virais criados em 5 minutos — usando IA, plugin e templates validados que já geraram milhões de views. Funciona com ChatGPT gratuito. Só copiar, colar e viralizar!
            </p>

            <a
              href="/login"
              className={`inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg sm:text-xl px-10 py-5 rounded-2xl hover:scale-105 transition-all duration-300 animate-pulse ${primaryGlowingShadow} border border-purple-500/30 w-full sm:w-auto`}
            >
              Tenha acesso imediato a tudo
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </a>
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
                  <span className="text-4xl sm:text-5xl font-black text-white">+3.425</span>
                  <span className="text-slate-400 font-medium">pessoas pararam de ser invisíveis no Instagram usando esse sistema.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">+68 Mi</span>
                  <span className="text-slate-400 font-medium">de visualizações orgânicas geradas em apenas 30 dias.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">+200k</span>
                  <span className="text-slate-400 font-medium">seguidores ganhos sem tráfego pago ou equipe cara.</span>
                </div>
              </div>

              <div className="max-w-4xl mx-auto bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 sm:p-10 relative">
                <div className="absolute -top-4 -left-4 text-purple-500 opacity-20"><svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg></div>
                <p className="text-lg sm:text-xl text-slate-300 italic text-center relative z-10 leading-relaxed">
                  "Gente que não sabia nem por onde começar... perfis pequenos, nichos saturados... Hoje? Conteúdos viralizando. Vendas pingando direto no direct toda semana."
                </p>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* PAIN & AGITATION */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeInSection>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-16">
                O que está <span className="text-red-400 relative">impedindo você<svg className="absolute w-full h-3 -bottom-1 left-0 text-red-500 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" /></svg></span> de ter sucesso no Instagram?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
                <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><Zap /></div>
                  <p className="text-slate-300 font-medium">Você perde horas criando conteúdo que ninguém vê (20 curtidas e desaparece).</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><Infinity /></div>
                  <p className="text-slate-300 font-medium">Seus concorrentes passam na sua frente enquanto você fica patinando no mesmo lugar.</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><ShieldCheck /></div>
                  <p className="text-slate-300 font-medium">Você já chegou a duvidar se o Instagram realmente funciona para o seu modelo de negócio.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 p-8 rounded-3xl text-left">
                <h4 className="text-xl font-bold text-white mb-2">A Verdade Desconfortável:</h4>
                <p className="text-slate-300">95% das pessoas fazem carrosséis completamente errados, focando apenas em "templates bonitinhos" do Canva e esquecendo a engenharia de retenção que prende a atenção nos primeiros 3 segundos.</p>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* SOLUTION 3 STEPS */}
        <section className="py-24 bg-black/40 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">A Solução em <span className="text-purple-400">3 Passos Simples</span></h2>
                <p className="text-slate-400 text-lg">Esqueça a complexidade. Seu único trabalho agora é executar o método.</p>
              </div>

              <div className="flex flex-col md:flex-row justify-center gap-8 relative">
                {/* Linha conectora (Desktop) */}
                <div className="hidden md:block absolute top-[45px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 -z-10"></div>

                {[
                  { step: "01", time: "1 min", title: "Gere Sua Ideia Viral", desc: "Use nosso Agente de Ideias calibrado para sugar os assuntos em alta exatos para o seu nicho." },
                  { step: "02", time: "2 min", title: "Crie o Conteúdo Completo", desc: "O Agente de Copy estrutura todo o texto persuasivo, com ganchos retentivos e chamada pra ação matemática." },
                  { step: "03", time: "2 min", title: "Aplique no Template", desc: "Use nosso Sistema para formatar texto, cores e imagens automaticamente, gerando o PDF final." }
                ].map((item, i) => (
                  <div key={i} className="flex-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl relative z-10 hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl mb-6 shadow-lg shadow-purple-500/20">
                      {item.step}
                    </div>
                    <div className="text-xs font-bold text-purple-400 mb-2 tracking-widest uppercase">⏱️ Tempo médio: {item.time}</div>
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
                  O ECOSSISTEMA COMPLETO
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Adquirindo HOJE <br className="hidden sm:block" />você recebe o acesso a:</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: Zap, title: "🤖 Tempestade IA", desc: "Sua máquina de ideias infinitas. Descubra mais de 50 tópicos magnéticos instantaneamente." },
                  { icon: BookOpen, title: "✍️ Deadpool IA", desc: "Agente de Copy viral. Cria Títulos impossíveis de ignorar, slides retentivos e CTA pronta em segundos." },
                  { icon: ImageIcon, title: "📷 Dr. Estranho IA", desc: "Gerador integrado de imagens cinematográficas e metáforas visuais lendárias em segundos." },
                  { icon: LayoutTemplate, title: "⚡ Plugin M.I.O.S", desc: "Laboratório de Carrosséis automáticos. Ajusta texto, cores e recortes de imagens com apenas 1 clique." },
                  { icon: ImageIcon, title: "📱 Viral Templates Arsenal", desc: "Nossos pilares de designs que já geraram milhões de curtidas, prontos para plugar a sua marca." },
                  { icon: Calendar, title: "📅 Viral365™", desc: "Uma nova ideia de carrossel viral por dia caindo direto na palma da sua mão (no seu WhatsApp)." }
                ].map((feature, i) => (
                  <div key={i} className={`bg-slate-900/50 border border-slate-800 p-8 rounded-3xl transition-all duration-300 ${cardGlowingShadow} group`}>
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                      <feature.icon strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
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
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12">Bônus <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Exclusivos</span></h2>

              <div className="space-y-4">
                {[
                  { title: "BÔNUS #01: Reels Virais Express", val: "R$ 197", desc: "Agente treinado especificamente para escrever roteiros de vídeos curtos dramáticos.", icon: Video },
                  { title: "BÔNUS #02: Masterclass 'InstaVendas'", val: "R$ 197", desc: "O Workshop secreto de conversão mostrando como transformar visualizações do topo de funil em PIX na conta.", icon: Sparkles },
                  { title: "BÔNUS #03: Acesso Vitalício + Updates", val: "Inestimável", desc: "Você recebe todas as futuras melhorias, novos templates e refinos de agentes do sistema SEM CUSTO ADICIONAL.", icon: ShieldCheck }
                ].map((bonus, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900/80 to-slate-900/40 border border-slate-800">
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <bonus.icon size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white">{bonus.title}</h3>
                        <span className="text-xs font-bold px-2 py-1 bg-red-500/20 text-red-300 rounded line-through">Valor: {bonus.val}</span>
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
                  <div className="inline-block bg-red-500 text-white font-black uppercase text-sm tracking-widest px-4 py-1.5 rounded-full mb-8 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    ÚLTIMAS HORAS DA OFERTA ESPECIAL
                  </div>

                  <div className="text-slate-400 font-medium mb-4 text-lg">O valor normal de tudo isso é <span className="line-through">R$ 697</span></div>
                  <div className="text-white text-2xl font-medium mb-2">Hoje, destrave tudo por apenas:</div>

                  <div className="flex flex-col items-center justify-center gap-2 mb-10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-purple-400">12x de</span>
                      <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">R$ 10,03</span>
                    </div>
                    <div className="text-slate-500 font-medium">ou R$ 97 à vista</div>
                  </div>

                  <a
                    href="/login"
                    className={`inline-block w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl px-12 py-6 rounded-2xl hover:scale-[1.02] transition-transform ${primaryGlowingShadow} border border-purple-500/30 mb-6`}
                  >
                    Tenha acesso imediato a tudo
                  </a>
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
              <h2 className="text-3xl font-bold text-white mb-6">Garantia Blindada de 30 Dias</h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
                Seu risco é absolutamente zero. Teste todo o Ecossistema de Carrosséis Virais, gere seus conteúdos, baixe os PDFs. Se você não gostar do modelo ou achar que não serviu pra você, te devolvemos 100% do dinheiro sem perguntas, e você ainda pode ficar com o que já gerou como nosso agradecimento.
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
                  { q: "Funciona para qualquer nicho?", a: "Sim. Nossas IAs foram treinadas com as métricas do algoritmo do Instagram, abrangendo desde emagrecimento, finanças, até contabilidade corporativa e advocacia." },
                  { q: "Preciso saber design ou usar Photoshop?", a: "Não. A ferramenta M.I.O.S (O gerador visual) constrói as sombras, recortes, margens e topografia automaticamente e te dá o slide pronto pra baixar." },
                  { q: "Funciona com o ChatGPT gratuito?", a: "Perfeitamente. O sistema lida com arquiteturas de prompt que entregam resultados brilhantes até mesmo na versão 3.5 gratuita." },
                  { q: "E se eu tiver poucos seguidores?", a: "Carrosséis de alto impacto são a ÚNICA ferramenta capaz de furar a bolha orgânica hoje no Instagram porque retém a pessoa na tela. Nosso método foi validado em contas que começaram do zero Absoluto." }
                ].map((faq, i) => (
                  <div key={i} className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
                    <h4 className="text-white font-bold text-lg mb-2 flex items-start gap-3">
                      <span className="text-purple-500 shrink-0 mt-1"><CheckCircle2 size={18} /></span>
                      {faq.q}
                    </h4>
                    <p className="text-slate-400 pl-7 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* AUTHOR SUMMARY */}
        <section className="py-24 bg-black/40 border-t border-white/5 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-[2rem] bg-gradient-to-tr from-slate-800 to-slate-700 shrink-0 shadow-2xl overflow-hidden relative border border-slate-700">
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-medium">Foto Autor</div>
              {/* <img src="..." alt="Leonardo Baltazar" className="w-full h-full object-cover" /> */}
            </div>
            <div className="text-center md:text-left">
              <FadeInSection>
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Quem criou este sistema?</h3>
                <h2 className="text-3xl font-bold text-white mb-6">Leonardo Baltazar</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Especialista de bastidores que já escalou infoprodutos a múltiplos 6 dígitos mensais em tempo recorde utilizando "funcionários perfeitos" — codificando Agentes de Inteligência Artificial para substituir equipes de design e copywriting caras, lentas e ineficientes. Hoje, ele abre essa mesma tecnologia de guerra para o público.
                </p>
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

            <a
              href="/login"
              className={`inline-block w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl px-12 py-6 rounded-2xl hover:scale-105 transition-transform ${primaryGlowingShadow} border border-purple-500/30 mb-16`}
            >
              Começar a Viralizar Agora
            </a>

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
