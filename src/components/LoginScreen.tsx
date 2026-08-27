"use client";

import { IconBrandGoogle } from "@tabler/icons-react";
import { useState } from "react";
import type { AuthResult } from "@/lib/useSession";

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => Promise<AuthResult>;
  onSignUp: (email: string, password: string) => Promise<AuthResult>;
  onGoogle: () => void;
}

export function LoginScreen({ onSignIn, onSignUp, onGoogle }: LoginScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setError(null);
    setInfo(null);

    const action = mode === "signin" ? onSignIn : onSignUp;
    const result = await action(email.trim(), password);

    if (!result.ok) setError(result.message);
    else if (result.message) setInfo(result.message);

    setSubmitting(false);
  }

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setInfo(null);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-vc-app px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-vc-sidebar p-6">
        <h1 className="text-lg font-medium text-vc-accent">Vortex Call</h1>
        <p className="mt-1 text-sm text-vc-text-muted">
          {mode === "signin" ? "Entre na sua conta." : "Crie sua conta."}
        </p>

        <label className="mt-5 block text-xs text-vc-text-muted">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md bg-vc-input px-3 py-2 text-sm text-vc-text focus:outline-none"
          autoFocus
        />

        <label className="mt-4 block text-xs text-vc-text-muted">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md bg-vc-input px-3 py-2 text-sm text-vc-text focus:outline-none"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {info && <p className="mt-3 text-sm text-vc-text-secondary">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-md bg-vc-accent py-2 text-sm font-medium text-vc-sidebar disabled:opacity-60"
        >
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <button type="button" onClick={toggleMode} className="mt-3 w-full text-xs text-vc-text-muted">
          {mode === "signin" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>

        <div className="my-4 flex items-center gap-2 text-xs text-vc-text-muted">
          <div className="h-px flex-1 bg-vc-border" />
          ou
          <div className="h-px flex-1 bg-vc-border" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-vc-input py-2 text-sm font-medium text-vc-text"
        >
          <IconBrandGoogle size={18} />
          Continuar com Google
        </button>
      </form>
    </div>
  );
}
