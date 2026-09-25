import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#333' }}>
      <h1 style={{ color: '#1A3621' }}>Informativa sulla Privacy - L.O.T.O. HUB</h1>
      <p><em>Ultimo aggiornamento: Settembre 2026</em></p>
      
      <h2>1. Quali dati raccogliamo? (ZERO-PII)</h2>
      <p>
        L.O.T.O. HUB (la &quot;Piattaforma&quot;) è stata progettata con un principio di <strong>Zero-PII (Zero Personally Identifiable Information)</strong>.
        L&apos;app <strong>non richiede, non raccoglie e non conserva</strong> dati personali sensibili come nome, cognome, indirizzo email o numero di telefono.
        L&apos;autenticazione avviene in maniera totalmente anonima e crittografata tramite Supabase.
      </p>

      <h2>2. Permessi Richiesti dall&apos;App</h2>
      <p>Per fornire le funzionalità di gamification, l&apos;app richiede i seguenti permessi locali sul dispositivo:</p>
      <ul>
        <li><strong>Posizione (GPS) e Background Location:</strong> Utilizzata esclusivamente per il geofencing, per permettere i check-in presso i punti di interesse (POI) e calcolare i percorsi.</li>
        <li><strong>Attività Fisica (Pedometro):</strong> Utilizzato per la funzione &quot;Sincro-Avventura&quot;, calcolando le emissioni di CO2 risparmiate (mobilità dolce).</li>
        <li><strong>Fotocamera:</strong> Utilizzata unicamente in locale per la scansione dei QR code (L.O.T.O. Pass) e lo sblocco dei POI. Le immagini non vengono salvate o inviate ai nostri server.</li>
        <li><strong>Bluetooth / NFC:</strong> Utilizzati per comunicare con i beacon interni (Musei, B&B) per l&apos;accessibilità indoor e i check-in senza GPS.</li>
      </ul>

      <h2>3. Come proteggiamo i tuoi progressi</h2>
      <p>
        Poiché l&apos;account è anonimo, il recupero dei progressi (Punti, Livelli, Badge) avviene esclusivamente tramite il <strong>L.O.T.O. Pass</strong>, un QR Code generato e salvato localmente nella galleria del dispositivo dell&apos;utente. Nessun dato viene ceduto a terzi.
      </p>

      <h2>4. Modifiche a questa Policy</h2>
      <p>Ci riserviamo il diritto di aggiornare questa informativa. Ti consigliamo di rivedere periodicamente questa pagina per eventuali cambiamenti.</p>

      <h2>5. Contatti</h2>
      <p>Per qualsiasi domanda relativa alla privacy, puoi contattare i gestori del progetto L.O.T.O. HUB tramite i canali ufficiali del Comune o dell&apos;ente promotore.</p>
    </div>
  );
}
