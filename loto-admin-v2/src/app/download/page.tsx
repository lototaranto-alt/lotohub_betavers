import Image from 'next/image';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-5 rounded-2xl shadow-xl">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">
            L.O.T.O. HUB Alpha
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Versione Beta a numero chiuso
          </p>
        </div>

        {/* Guida Anti-Attrito Play Protect (ORA SOPRA IL BOTTONE) */}
        <div className="mt-4 border-b border-gray-200 pb-6">
          <h3 className="text-base font-bold text-gray-900 mb-2 text-center">
            &#9888; Guida all&apos;installazione
          </h3>
          <p className="text-xs text-gray-600 mb-4 text-center leading-relaxed">
            Google mostrerà un avviso di sicurezza perché l&apos;App non è ancora pubblica. Leggi questi 3 passi per installarla in sicurezza:
          </p>

          {/* Immagine con freccia/evidenza */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-4 bg-gray-900">
            <img 
              src="/play-protect-warning.jpg" 
              alt="Guida Play Protect" 
              className="w-full h-auto opacity-90"
            />
            {/* Cerchio rosso animato centrato su "Altri dettagli" nel nuovo ritaglio */}
            <div className="absolute bottom-[23%] left-[7%] w-32 h-8 border-2 border-red-500 rounded-lg animate-pulse bg-red-500/20"></div>
          </div>

          {/* Steps */}
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">1</span>
              <p className="ml-2 text-xs text-gray-700">All&apos;avviso di Play Protect, <strong className="text-red-600">NON cliccare OK</strong>.</p>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">2</span>
              <p className="ml-2 text-xs text-gray-700">Tocca la scritta <strong className="text-gray-900">&quot;Altri dettagli&quot;</strong>.</p>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">3</span>
              <p className="ml-2 text-xs text-gray-700">Tocca <strong className="text-gray-900">&quot;Installa comunque&quot;</strong>.</p>
            </li>
          </ul>
        </div>

        {/* Download Button (ORA SOTTO LA GUIDA) */}
        <div className="mt-6">
          <a
            href="https://lototaranto-alt.github.io/loto-app-alpha/loto-app.apk" download
            className="w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-md"
          >
            Scarica l&apos;APK Ufficiale
          </a>
        </div>
        
        {/* Badge Sicurezza */}
        <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-100">
          <p className="text-[11px] text-green-800 text-center font-medium">
            &#10004; Software verificato dal Team. Nessun virus.
          </p>
        </div>

      </div>
    </div>
  );
}