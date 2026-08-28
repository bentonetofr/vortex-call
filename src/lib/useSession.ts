"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { memberFromRow, type Member } from "./types";

type Status = "loading" | "signed-out" | "no-member" | "member";
export type AuthResult = { ok: true; message?: string } | { ok: false; message: string };

export function useSession() {
  const [status, setStatus] = useState<Status>("loading");
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabase();

    async function loadMember(userId: string) {
      const { data: row } = await supabase
        .from("members")
        .select("id, name, nickname, color, avatar_url, onboarded")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (row) {
        setMember({ ...memberFromRow(row), online: true, voiceChannelId: null });
        setStatus("member");
      } else {
        setMember(null);
        setStatus("no-member");
      }
    }

    // Rely solely on onAuthStateChange rather than also calling getSession()
    // separately: onAuthStateChange always fires once with the resolved
    // current session (event INITIAL_SESSION) after Supabase finishes
    // detecting a session from the URL (e.g. the Google OAuth redirect
    // hash). Calling getSession() ourselves in parallel could read the
    // session before that detection finished, wrongly reporting
    // signed-out right after a successful login.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadMember(session.user.id);
      else if (!cancelled) {
        setMember(null);
        setStatus("signed-out");
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: "E-mail ou senha incorretos." };
    return { ok: true };
  }

  async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered")) {
        return { ok: false, message: "Essa conta já existe. Tente entrar." };
      }
      if (msg.includes("password")) {
        return { ok: false, message: "A senha precisa ter pelo menos 6 caracteres." };
      }
      return { ok: false, message: "Não deu pra criar a conta." };
    }
    if (!data.session) return { ok: true, message: "Confira seu e-mail para confirmar a conta." };
    return { ok: true };
  }

  async function signOut() {
    await getSupabase().auth.signOut();
  }

  function updateMemberLocal(patch: Partial<Member>) {
    setMember((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  return {
    status,
    member,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    updateMemberLocal,
  };
}
