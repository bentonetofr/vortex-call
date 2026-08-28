"use client";

import { IconCamera, IconX } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Member } from "@/lib/types";
import { Avatar } from "./Avatar";

interface ProfileSettingsModalProps {
  member: Member;
  firstTime: boolean;
  onClose: () => void;
  onSaved: (patch: Partial<Member>) => void;
  onSignOut: () => void;
}

export function ProfileSettingsModal({
  member,
  firstTime,
  onClose,
  onSaved,
  onSignOut,
}: ProfileSettingsModalProps) {
  const [name, setName] = useState(member.fullName);
  const [nickname, setNickname] = useState(member.nickname ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shownAvatarUrl = avatarRemoved ? null : (previewUrl ?? member.avatarUrl);

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem precisa ter no máximo 5MB.");
      return;
    }
    setError(null);
    setAvatarRemoved(false);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveAvatar() {
    setPendingFile(null);
    setPreviewUrl(null);
    setAvatarRemoved(true);
  }

  async function handleSkip() {
    if (!firstTime) {
      onClose();
      return;
    }
    await getSupabase().from("members").update({ onboarded: true }).eq("id", member.id);
    onSaved({ onboarded: true });
    onClose();
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("O nome não pode ficar em branco.");
      return;
    }

    setSaving(true);
    setError(null);

    let avatarUrl = member.avatarUrl;
    if (pendingFile) {
      const ext = pendingFile.name.split(".").pop() || "jpg";
      const path = `${member.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await getSupabase()
        .storage.from("avatars")
        .upload(path, pendingFile, { cacheControl: "31536000" });

      if (uploadError) {
        setError("Não deu pra enviar a imagem. Tente de novo.");
        setSaving(false);
        return;
      }
      avatarUrl = getSupabase().storage.from("avatars").getPublicUrl(path).data.publicUrl;
    } else if (avatarRemoved) {
      avatarUrl = null;
    }

    const trimmedNickname = nickname.trim() || null;

    const { error: updateError } = await getSupabase()
      .from("members")
      .update({ name: trimmedName, nickname: trimmedNickname, avatar_url: avatarUrl, onboarded: true })
      .eq("id", member.id);

    if (updateError) {
      setError("Não deu pra salvar. Tente de novo.");
      setSaving(false);
      return;
    }

    onSaved({
      name: trimmedNickname ?? trimmedName,
      fullName: trimmedName,
      nickname: trimmedNickname,
      avatarUrl,
      onboarded: true,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-vc-sidebar p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vc-text">Configurar perfil</h2>
          {!firstTime && (
            <button onClick={onClose} aria-label="Fechar" className="text-vc-text-muted hover:text-vc-text">
              <IconX size={18} />
            </button>
          )}
        </div>
        <p className="mb-4 text-sm text-vc-text-muted">
          {firstTime ? "Deixa do seu jeito antes de começar." : "Edite seu nome, nick e foto."}
        </p>

        <div className="mb-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-full"
            aria-label="Trocar foto de perfil"
          >
            <Avatar name={nickname.trim() || name || "?"} color={member.color} avatarUrl={shownAvatarUrl} size={88} />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-transparent transition group-hover:bg-black/40 group-hover:text-white">
              <IconCamera size={22} />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          {shownAvatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-xs text-vc-text-muted hover:text-red-400"
            >
              Remover foto
            </button>
          )}
        </div>

        <label className="mb-3 block text-xs text-vc-text-muted">
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="mt-1 w-full rounded-md bg-vc-input px-3 py-2 text-sm text-vc-text focus:outline-none"
          />
        </label>
        <label className="mb-4 block text-xs text-vc-text-muted">
          Nick <span className="text-vc-text-faint">(opcional)</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Como quer aparecer"
            maxLength={32}
            className="mt-1 w-full rounded-md bg-vc-input px-3 py-2 text-sm text-vc-text placeholder:text-vc-text-faint focus:outline-none"
          />
        </label>

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="text-xs text-vc-text-muted hover:text-vc-text"
          >
            {firstTime ? "Pular por agora" : "Cancelar"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-md bg-vc-accent px-4 py-2 text-sm font-medium text-vc-sidebar disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <div className="mt-4 border-t border-vc-border pt-3 text-center">
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs text-vc-text-faint hover:text-red-400"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
