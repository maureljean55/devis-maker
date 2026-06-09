"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");
  const router  = useRouter();
  const supabase = createClient();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Vérifiez votre boite email pour confirmer votre compte.");
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-app-bg, #18181b)" }}
    >
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Tutto Legno" className="w-16 h-14 object-contain mb-4" />
          <div className="text-gold text-[15px] font-bold tracking-[3px] uppercase">Tutto Legno</div>
          <div className="text-app-muted text-[10px] tracking-[1.5px] mt-1 uppercase">Générateur de Devis</div>
        </div>

        {/* Card */}
        <div className="bg-app-panel border border-app-border p-6">
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-gold mb-6 pb-3 border-b border-app-border text-center">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </div>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-[11px] text-app-muted mb-1.5 tracking-[0.5px]">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@email.com"
                className="w-full bg-app-input border border-app-border text-app-text px-3 py-3 outline-none focus:border-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-app-muted mb-1.5 tracking-[0.5px]">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-app-input border border-app-border text-app-text px-3 py-3 outline-none focus:border-gold transition-colors"
              />
            </div>

            {error && (
              <div className="text-red-400 text-[12px] py-2 px-3 border border-red-900/40 bg-red-950/30">
                {error}
              </div>
            )}
            {info && (
              <div className="text-green-400 text-[12px] py-2 px-3 border border-green-900/40 bg-green-950/30">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-white py-3 font-bold tracking-[1.5px] uppercase text-[12px] cursor-pointer disabled:opacity-50 hover:opacity-85 transition-opacity border-none"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setError("");
              setInfo("");
            }}
            className="w-full text-center text-app-muted text-[11px] mt-4 cursor-pointer bg-transparent border-none hover:text-gold transition-colors py-1"
          >
            {mode === "login"
              ? "Pas encore de compte ? S'inscrire"
              : "Déjà un compte ? Se connecter"}
          </button>
        </div>

        <div className="text-center text-app-muted text-[10px] mt-6 tracking-[1px]">
          TUTTO LEGNO © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
