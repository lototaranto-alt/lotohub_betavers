'use client'

import React from 'react'

export default function DownloadPage() {
  // SOSTITUISCI QUESTO LINK CON IL LINK FORNITO DA SUPABASE
  const APK_URL = "https://github.com/lototaranto-alt/loto-app-alpha/releases/download/v1.0.0/application-c1081064-fbba-4760-b4a3-8f12f8d152a9.apk"

  return (
    <div className="min-h-screen bg-[#F9F6EE] font-sans selection:bg-[#4A5D23] selection:text-white flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 md:p-12">
        
        <div className="text-center mb-8">
          <h2 className="text-[#4A5D23] font-bold tracking-widest uppercase text-sm mb-2">L.O.T.O. HUB</h2>
          <h1 className="text-3xl md:text-5xl font-serif text-[#1F1F1F] font-bold leading-tight mb-4">
            Alpha Access
          </h1>
          <p className="text-lg text-gray-600">
            Benvenuto nel programma di test a numero chiuso. Stai per accedere alla versione esclusiva e in anteprima dell'app.
          </p>
        </div>

        <div className="bg-[#4A5D23]/5 rounded-2xl p-6 mb-8 border border-[#4A5D23]/10">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <span className="text-2xl">???</span>
            </div>
            <div>
              <h3 className="font-bold text-[#1F1F1F] text-lg mb-2">Nota di Sicurezza di Sistema</h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                Poiché questa versione esclusiva non è ancora pubblicata sul circuito commerciale (Google Play Store), il tuo dispositivo Android mostrerà un avviso di sicurezza standard <span className="font-semibold">("File potenzialmente dannoso")</span>. 
              </p>
              <p className="text-[#4A5D23] font-semibold text-sm">
                È assolutamente normale. Stai ricevendo un pacchetto cifrato direttamente dai nostri laboratori di test.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <a 
            href={APK_URL}
            className="inline-block w-full md:w-auto bg-[#4A5D23] hover:bg-[#3A491C] text-white font-bold py-4 px-12 rounded-full transition-transform transform hover:scale-105 shadow-lg text-lg"
          >
            Scarica la Versione Alpha
          </a>
          <p className="mt-4 text-xs text-gray-500 font-medium">
            Clicca "Scarica comunque" ? Apri il file ? Consenti l'installazione
          </p>
        </div>

        <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-8">
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">??</span> Zero Dati Personali
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">??</span> Nessun Tracciamento GPS
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">??</span> Ottimizzata per Android
          </div>
        </div>

      </div>
    </div>
  )
}

