"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Newspaper, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function CuradoriaLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Verifica se o e-mail existe no MySQL (Prisma) e se está ativo
      const res = await fetch(`/api/user/setup?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.success) {
        // Sucesso: Salva no localStorage para manter a sessão
        localStorage.setItem('is_authenticated', 'true');
        localStorage.setItem('user_email', email.toLowerCase().trim());
        localStorage.setItem('user_role', data.data.role || 'USER');
        
        router.push('/curadoria');
      } else {
        setError("E-mail não encontrado ou sem acesso ao LAB. Verifique sua compra.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Falha na conexão. Tente novamente em instantes.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 p-4 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-500/20">
            <Newspaper className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Curadoria <span className="text-blue-500">Viral</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest italic">
            Área de Membros • LAB
          </p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center border-b border-slate-800/50 pb-8">
            <CardTitle className="text-xl font-bold text-slate-100">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-slate-400">
              Digite seu e-mail de compra para acessar a mesa de curadoria.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="pt-8 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-shake">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Seu E-mail</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="exemplo@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 h-12 text-slate-100 focus:border-blue-500/50 transition-all text-base placeholder:text-slate-700"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/20 group transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Acessar Mesa de Edição
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-tight">
                <ShieldCheck className="h-3 w-3" />
                Acesso Seguro • Carrossel Viral LAB
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-8 text-center text-slate-600 text-xs font-medium px-8">
          Ao entrar, você concorda com nossos termos de curadoria assistida por IA inteligente.
        </p>
      </div>
    </div>
  );
}
