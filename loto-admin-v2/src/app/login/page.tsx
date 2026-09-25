import type { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Accesso Admin · L.O.T.O.',
  description: 'Accesso riservato alla dashboard interna L.O.T.O.',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">L.O.T.O. Intelligence</p>
          <h1 className="mt-3 text-3xl font-black text-white">Accesso interno</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Dashboard riservata al team L.O.T.O. I partner operano tramite Zero-UI e WhatsApp.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
