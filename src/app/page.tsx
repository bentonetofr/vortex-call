"use client";

import { AppShell } from "@/components/AppShell";
import { JoinScreen } from "@/components/JoinScreen";
import { useSession } from "@/lib/useSession";

export default function Home() {
  const { member, loading, join, joinError } = useSession();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-vc-app text-vc-text-muted" />;
  }

  if (!member) {
    return <JoinScreen onJoin={join} error={joinError} />;
  }

  return <AppShell member={member} />;
}
