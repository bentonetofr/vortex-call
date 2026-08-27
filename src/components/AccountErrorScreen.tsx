interface AccountErrorScreenProps {
  onSignOut: () => void;
}

export function AccountErrorScreen({ onSignOut }: AccountErrorScreenProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-vc-app px-4">
      <div className="w-full max-w-sm rounded-xl bg-vc-sidebar p-6 text-center">
        <h1 className="text-lg font-medium text-vc-accent">Algo deu errado</h1>
        <p className="mt-2 text-sm text-vc-text-muted">
          Não conseguimos carregar sua conta. Tente sair e entrar de novo.
        </p>

        <button
          onClick={onSignOut}
          className="mt-6 w-full rounded-md bg-vc-input py-2 text-sm font-medium text-vc-text"
        >
          Sair e tentar de novo
        </button>
      </div>
    </div>
  );
}
