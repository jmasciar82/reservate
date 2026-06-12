"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Trophy, Lock, Mail, Download, X } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Detect if already installed/standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Listen for install prompt on Android/Chrome/Windows
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log("Install choice outcome:", outcome);
    setInstallPrompt(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }

      const data = await response.json();
      
      // Guardar token en las cookies (válido por 7 días en toda la app)
      Cookies.set("token", data.access_token, { expires: 7, path: "/" });
      
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Login failure details:", err);
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.jpg"
            alt="Reservate Logo"
            className="w-16 h-16 object-cover rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(57,255,20,0.2)] mb-4"
          />
          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-zinc-800 via-zinc-600 to-primary dark:from-white dark:via-zinc-200 dark:to-primary bg-clip-text text-transparent">RESERVATE</h1>
          <p className="text-xs text-zinc-400 mt-2 font-semibold uppercase tracking-wider">Ingresa al panel de administración</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="admin@reservate.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Iniciando sesión..." : "Ingresar"}
          </button>
        </form>

        {/* PWA Install Button */}
        {!isInstalled && (installPrompt || isIOS) && (
          <div className="mt-6 pt-6 border-t border-zinc-800/50 flex flex-col items-center">
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-sm font-bold text-zinc-300 hover:text-white"
              >
                <Download className="w-4 h-4 text-primary" />
                Instalar App de Reservate
              </button>
            )}
            {isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-sm font-bold text-zinc-300 hover:text-white"
              >
                <Download className="w-4 h-4 text-primary" />
                Instalar App en tu iPhone/iPad
              </button>
            )}
          </div>
        )}
      </div>

      {/* iOS Install Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSModal(false)}
          />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-all p-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Instalar en iOS</h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                Sigue estos sencillos pasos para agregar **Reservate** a tu pantalla de inicio:
              </p>
              <div className="w-full text-left space-y-3 mt-5 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center shrink-0">1</span>
                  <p className="text-zinc-300">Presiona el botón **Compartir** en Safari (el icono del cuadrado con una flecha hacia arriba abajo en tu pantalla).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center shrink-0">2</span>
                  <p className="text-zinc-300">Desplázate hacia abajo y selecciona **"Añadir a la pantalla de inicio"**.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-lg mt-5 hover:opacity-90 transition-all text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
