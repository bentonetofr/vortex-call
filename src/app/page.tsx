"use client";

import { AccountErrorScreen } from "@/components/AccountErrorScreen";
import { AppShell } from "@/components/AppShell";
import { LoginScreen } from "@/components/LoginScreen";
import { useSession } from "@/lib/useSession";

// Entirely per-session/authenticated content — nothing here is safe or useful
// to prerender statically at build time.
export const dynamic = "force-dynamic";

export default function Home() {
  const { status, member, signInWithGoogle, signInWithPassword, signUpWithPassword, signOut } =
    useSession();

  if (status === "loading") {
    return <div className="h-screen bg-vc-app" />;
  }

  if (status === "signed-out") {
    return (
      <LoginScreen onSignIn={signInWithPassword} onSignUp={signUpWithPassword} onGoogle={signInWithGoogle} />
    );
  }

  if (status === "no-member") {
    return <AccountErrorScreen onSignOut={signOut} />;
  }

  return <AppShell member={member!} />;
}
