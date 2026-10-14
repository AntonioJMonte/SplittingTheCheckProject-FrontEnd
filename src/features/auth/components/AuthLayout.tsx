import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <header className="grid gap-1">
        <p className="text-2xl font-semibold">splittr</p>
        <p className="text-sm text-muted-foreground">Divida as despesas do grupo e acerte por Pix.</p>
      </header>
      {children}
    </main>
  )
}
