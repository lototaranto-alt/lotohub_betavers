'use client'

import React, { useEffect, useState } from 'react'

export default function LandingPage() {
  const [isIOS, setIsIOS] = useState(false)
  
  useEffect(() => {
    // Semplice device detection lato client
    const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setIsIOS(true)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F9F6EE] font-sans selection:bg-[#4A5D23] selection:text-white">
      {/* Hero Section */}
      <header className="px-6 py-12 md:py-20 text-center max-w-4xl mx-auto">
        <h2 className="text-[#4A5D23] font-bold tracking-widest uppercase text-sm mb-4">L.O.T.O. HUB</h2>
        <h1 className="text-4xl md:text-6xl font-serif text-[#1F1F1F] font-bold leading-tight mb-6">
          Scopri Taranto, Proteggi l'Ambiente.
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          L'app gamificata che trasforma i tuoi passi e le tue esplorazioni in impatto reale. Sblocca storie segrete, aiuta la comunità e diventa una Leggenda L.O.T.O.
        </p>
        <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 text-sm font-medium text-gray-700">
          <span className="mr-2">💚</span> Zero Registrazione. 100% Privacy.
        </div>
      </header>

      {/* Download Section (CUORE DELLA PAGINA) */}
      <section className="px-6 pb-16 text-center">
        <div className="max-w-md mx-auto bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/50">
          {isIOS ? (
            <div className="space-y-4">
              <button 
                disabled 
                className="w-full bg-[#D96C4A] text-white py-4 rounded-xl font-bold text-lg opacity-90 cursor-not-allowed shadow-lg"
              >
                In arrivo su App Store 🍎
              </button>
              <p className="text-sm text-gray-600">
                La versione per iPhone è attualmente in fase di revisione finale da parte di Apple. Ritorna su questa pagina tra pochi giorni per scaricarla ufficialmente!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <a 
                href="#" // TO-DO: Inserire il link del file APK su Supabase Storage
                className="block w-full bg-[#4A5D23] hover:bg-[#3d4d1d] transition-colors text-white py-4 rounded-xl font-bold text-lg shadow-lg"
              >
                Scarica per Android (.apk)
              </a>
              <p className="text-xs text-gray-500">
                (Se il telefono chiede conferma per "fonti sconosciute", consenti l'installazione. L'app è sicura e certificata).
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Come Funziona */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif text-center font-bold text-[#1F1F1F] mb-12">Come Funziona</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-xl bg-[#F9F6EE]/50">
              <div className="w-16 h-16 mx-auto bg-[#4A5D23] text-white rounded-full flex items-center justify-center text-2xl font-bold">1</div>
              <h3 className="font-bold text-xl text-[#1F1F1F]">Cammina</h3>
              <p className="text-gray-600">Tieni il telefono in tasca. L'app conta i tuoi passi e la CO2 risparmiata.</p>
            </div>
            
            <div className="text-center space-y-4 p-6 rounded-xl bg-[#F9F6EE]/50">
              <div className="w-16 h-16 mx-auto bg-[#4A5D23] text-white rounded-full flex items-center justify-center text-2xl font-bold">2</div>
              <h3 className="font-bold text-xl text-[#1F1F1F]">Esplora & Scansiona</h3>
              <p className="text-gray-600">Trova i Nodi Civici e i Partner. Scansiona i QR o i chip NFC per fare check-in.</p>
            </div>
            
            <div className="text-center space-y-4 p-6 rounded-xl bg-[#F9F6EE]/50">
              <div className="w-16 h-16 mx-auto bg-[#D96C4A] text-white rounded-full flex items-center justify-center text-2xl font-bold">3</div>
              <h3 className="font-bold text-xl text-[#1F1F1F]">Sblocca i Segreti</h3>
              <p className="text-gray-600">Usa i LOTO Punti (PTI) guadagnati per accedere a contenuti premium esclusivi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F1F1F] text-gray-400 py-8 px-6 text-center text-sm">
        <div className="max-w-4xl mx-auto space-y-2">
          <p>Un progetto per l'innovazione turistica di Taranto 2026.</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Termini di Servizio</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
