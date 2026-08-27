"use client";

import { useState } from "react";

interface JoinScreenProps {
  onJoin: (inviteCode: string, displayName: string) => Promise<void>;
  error: string | null;
}

export function JoinScreen({ onJoin, error }: JoinScreenProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim() || !displayName.trim()) return;
    setSubmitting(true);
    await onJoin(inviteCode.trim(), displayName.trim());
    setSubmitting(false);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-vc-app px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-vc-sidebar p-6"
      >
        <h1 className="text-lg font-medium text-vc-accent">Vortex Call</h1>
        <p className="mt-1 text-sm text-vc-text-muted">Entre com o código de convite do grupo.</p>

        <label className="mt-5 block text-xs text-vc-text-muted">Código de convite</label>
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="mt-1 w-full rounded-md bg-vc-input px-3 py-2 text-sm text-vc-text focus:outline-none"
          autoFocus
        />

        <label className="mt-4 block text-xs text-vc-text-muted">Seu nome</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 w-full rounded-md bg-vc-input px-3 py-2 text-sm text-vc-text focus:outline-none"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-md bg-vc-accent py-2 text-sm font-medium text-vc-sidebar disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
