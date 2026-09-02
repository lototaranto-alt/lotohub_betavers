import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { supabase } from './supabase';

/**
 * Apre il prompt NFC del dispositivo, legge il payload NDEF di un tag NTAG424 DNA
 * ed estrae i parametri crittografici 'p' e 'c'. Invia poi i dati al backend Supabase
 * per la validazione AES-128 sicura (Zero Spoofing).
 * 
 * @returns {Promise<string>} Il poi_id decifrato se il tag è autentico.
 */
export const scanEncryptedTag = async (): Promise<string> => {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    
    if (!tag || !tag.ndefMessage || tag.ndefMessage.length === 0) {
      throw new Error("Nessun messaggio NDEF trovato sul tag.");
    }

    const ndefRecord = tag.ndefMessage[0];
    const uri = Ndef.uri.decodePayload(ndefRecord.payload as any);
    
    if (!uri) throw new Error("Impossibile decodificare l'URI.");

    // Estrae i parametri crittografici 'p' (PICCDATA) e 'c' (CMAC)
    const pMatch = uri.match(/[?&]p=([^&]+)/);
    const cMatch = uri.match(/[?&]c=([^&]+)/);

    const p = pMatch ? pMatch[1] : null;
    const c = cMatch ? cMatch[1] : null;

    if (!p || !c) {
      throw new Error("Tag Non Valido o Clonato"); // Manca crittografia hardware
    }

    // SICUREZZA ARCHITETTURALE: L'app fa solo da postino.
    // Invia i parametri crittografici a Supabase per evitare furto di chiavi AES dall'APK.
    const { data, error } = await supabase.rpc('validate_ntag424_sdm', { 
      picc_data: p, 
      cmac: c 
    });

    if (error || !data || !data.poi_id) {
      throw new Error("Tag Non Valido o Clonato"); // Il backend ha respinto la firma
    }

    return data.poi_id;

  } catch (error) {
    console.warn("Errore scansione NFC:", error);
    throw new Error("Tag Non Valido o Clonato");
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
};
