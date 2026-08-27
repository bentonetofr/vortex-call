"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-vc-app px-4">
      <div className="w-full max-w-sm rounded-xl bg-vc-sidebar p-6 text-center">
        <h1 className="text-lg font-medium text-vc-accent">Algo deu errado</h1>
        <p className="mt-2 text-sm text-vc-text-muted">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 w-full rounded-md bg-vc-input py-2 text-sm font-medium text-vc-text"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
