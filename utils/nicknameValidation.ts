// Convalida definitiva del nickname (P-D7, decisa 08/10/2026)
//
// Regole (valgono per il primo e unico set del nome):
//   1. trim + spazi multipli compressi in uno solo
//   2. lunghezza 3-20 caratteri
//   3. solo lettere (anche accentate), cifre e spazi: niente caratteri speciali
//   4. blocklist: riservati del sistema + parole volgari
//   5. l'univoco NON e' qui: lo garantisce il vincolo UNIQUE del DB
//      (profiles_nickname_key) + codice errore 23505 gestito nei modal.
//
// Stesso charset del CHECK applicato dal DB in M14
// (supabase/migrations/20261008120000_profiles_hardening_m14.sql):
//   ^[A-Za-z0-9 àèéìòùÀÈÉÌÒÙ]{3,20}$
// Se cambia uno, cambia l'altro.

export const NICK_MIN = 3;
export const NICK_MAX = 20;
export const NICK_REGEX = /^[A-Za-z0-9 àèéìòùÀÈÉÌÒÙ]{3,20}$/;

const BLOCKLIST = [
  // riservati del sistema / brand
  'admin', 'root', 'loto', 'system', 'moderator', 'staff', 'support',
  'null', 'undefined', 'supabase',
  // volgare (it)
  'cazzo', 'merda', 'stronzo', 'puttana', 'troia', 'minchia', 'coglione',
  'deficiente', 'vaffanculo', 'fanculo', 'figata', 'incazz', 'stupido',
  'sesso', 'porno', 'sex',
];

export type EsitoNickname = { ok: true; valido: string } | { ok: false; errore: string };

export function validaNickname(raw: string): EsitoNickname {
  const valido = (raw || '').trim().replace(/\s+/g, ' ');

  if (valido.length < NICK_MIN) {
    return { ok: false, errore: `Il nome deve avere almeno ${NICK_MIN} caratteri.` };
  }
  if (valido.length > NICK_MAX) {
    return { ok: false, errore: `Il nome può avere al massimo ${NICK_MAX} caratteri.` };
  }
  if (!NICK_REGEX.test(valido)) {
    return { ok: false, errore: 'Solo lettere, cifre e spazi: niente caratteri speciali.' };
  }

  const minuscolo = valido.toLowerCase();
  if (BLOCKLIST.some((parola) => minuscolo.includes(parola))) {
    return { ok: false, errore: 'Nome non consentito, scegline un altro.' };
  }

  return { ok: true, valido };
}
