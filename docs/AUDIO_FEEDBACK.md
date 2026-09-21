<!-- Stato: Vivente -->
<!-- Scopo: Gestire in un'unica ottica tutti i feedback dell'app (tattile, audio, visivo) e progettare il sistema SFX con expo-audio -->
<!-- SSOT: questo file (per suoni); expo-haptics è documentato a scopo di inventario -->
<!-- Owner: Gamification & UX / App -->
<!-- Ultimo aggiornamento: 2026-09-21 -->

# L.O.T.O. HUB — Gestione Feedback: Tattile, Audio, Visivo

> **Questo documento risponde a:** "che tipo di feedback usa oggi l'app, come vogliamo introdurre l'audio/SFX senza rovinare l'esperienza, e come tenere tutto coerente?"

--- 

## 1. Inventario feedback ATTUALE (feedback tattile — `expo-haptics`)

| Punto | Evento | Haptics |
|---|---|---|
| `app/(tabs)/_layout.tsx:39` | Tab press | `impactAsync(Medium)` |
| `app/(tabs)/_layout.tsx:59` | Avvio scan NFC scanner | `notificationAsync(Success)` |
| `app/(tabs)/index.tsx:418` | Bottone Tips (Home) | `notificationAsync(Warning)` + animazione scala |
| `app/(tabs)/index.tsx:572` | Avvicinamento a un POI (radar) | `impactAsync(Medium)` |
| `app/(tabs)/index.tsx:582` | Doppio tap/refresh radar | `impactAsync(Medium)` |
| `app/p/[id].tsx:59` | Check-in NFC in corso | `impactAsync(Medium)` |
| `app/p/[id].tsx:70` | **Check-in validato** | `notificationAsync(Success)` |
| `app/poi/[id].tsx:13` | Scan POI | `notificationAsync(Success)` |
| `components/CivicDashboard.tsx:95/128` | Report civico OK / errore | `notificationAsync(Success/Error)` |

**Punto di stato:** oggi l'UNICO canale di "risposta" non-verbale è la vibrazione. Il 9/09 era stato installato `expo-av` per gli SFX ma è andato perso in un reset: **nessun suono è mai stato implementato** (`package.json` non contiene librerie audio).

---

## 2. Obiettivo: un feedback a 3 canali, coerente e discreto

Vogliamo che ogni evento l'utente lo "senta" su più canali MA senza mai disturbare:

| Canale | Ruolo | Regola |
|---|---|---|
| **Visivo** (animazioni, glow, toast) | Riconoscimento | Sempre presente, mai fastidioso |
| **Tattile** (impatto) | Conferma immediata | Breve, medium/light, mai `Heavy` |
| **Audio** (SFX) | Emozione/celebrazione | **Opzionale e disattivabile**; corto; MAI i suoni lunghi |

Principi vincolanti:
- **Silenzio di default** = l'utente può attivare i "Suoni" (toggle in Impostazioni). Nessun suono senza permesso.
- Nelle modalità **Risparmio Batteria** (`SincroAvventura` battery saver) i suoni NON sono bloccati ma non si accumulano in coda.
- **Niente preset di sistema** del device: usiamo ASSET locali per SFX controllati e leggeri.
- Rispetto del **tono Eco-Boutique**: suoni discreti, naturali, "di legno e acqua", mai aggressivi/da arcade.
- Accessibilità: stesso evento deve avere sempre anche il canale tattile (nessun feedback SOLO audio).

---

## 3. Architettura proposta (SDK 54 → `expo-audio`)

`expo-av` è deprecated e non compatibile con Expo SDK 54: si adotta **`expo-audio`**.

Layout previsto:

```
utils/SfxManager.ts        ← SSOT suoni: registra asset, play(più) con anti-overlap
assets/sounds/             ← SUONI LOCALI (wav/m4a, pochi KB)
  tap.wav, toggle.wav, confirm.wav, unlock.wav, levelup.wav, petal.wav
settings (Impostazioni)    ← toggle globale "Suoni On/Off" (AsyncStorage @loto_sfx_enabled)
```

`SfxManager` API (bozza):
```ts
import { Audio } from 'expo-audio';
const enabled = await AsyncStorage.getItem('@loto_sfx_enabled');

export async function playSfx(kind: 'tap'|'toggle'|'confirm'|'unlock'|'levelup'|'petal') {
  if (enabled !== '1') return;      // silenzio di default
  // carica un unico Audio player riusabile; playIfLoaded (no sovrapposizioni)
}
```

## 4. Tabella SFX proposta (evento → suono → priorità)

| Evento | Suono | Priorità release | Canali |
|---|---|---|---|
| Tap tab / apertura sheet | `tap` — legno/click leggero | P1 | tact + (audio) |
| Toggle (batteria, Fog of War, suoni) | `toggle` — scatto morbido | P2 | tact + audio |
| Check-in validato | `confirm` — tintinnio discreto | P1 | **tact Success** + audio |
| POI scoperto / media sbloccato | `unlock` — arpa/glissando breve | P1 | tact + audio + glow |
| Level-up | `levelup` — jingle 2s del Tier | P1 | tact + audio + LevelUpLore |
| Petalo Fiore 4 completato | `petal` — nota singola cresce | P2 | tact Light + audio |

> NB: **PTI e XP**: nessun SFX speciale per i PTI; il suono celebra l'esperienza/esplorazione (XP). I PTI sono impatto civico e restano silenziosi (si riflette solo nel barra della Comunità).

## 5. Regole anti-degrado

1. `playSfx` NON è mai chiamato in loop; ogni evento chiama al massimo 1 suono.
2. I suoni **non bloccano l'UI**: fire-and-forget, niente `await` a cascata.
3. Con `battery saver` attivo: skip se c'è già un player attivo (niente coda).
4. Il toggle è **persistito** e rispettato da ogni chiamata (unico punto).

## 6. Ticket di implementazione (dopo F6, prima della build AAB)

- [ ] `npx expo install expo-audio` (SDK 54) — verifica compatibilità con `expo build-properties`
- [ ] `utils/SfxManager.ts` + toggle `@loto_sfx_enabled` (UI nel Profilo/Impostazioni)
- [ ] Asset audio minimi (P1: tap, confirm, unlock, levelup) in `assets/sounds/`
- [ ] Aggancio nei punti dell'inventario §1 (stessa riga dove oggi c'è l'`Haptics.`)
- [ ] Verifica su device reale con toggle ON/OFF e batteria saver
- [ ] Aggiornare `docs/REPORT_GAMIFICATION_STATUS.md` PARTE A al completamento