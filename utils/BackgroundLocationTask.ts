import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Logica di "Isteresi" per evitare l'effetto ping-pong sui confini urbani
let lastCityChangeTimestamp = 0;
const HYSTERESIS_TIMER_MS = 10 * 60 * 1000; // 10 minuti di "raffreddamento" prima di cambiare città di nuovo

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any): Promise<void> => {
  if (error) {
    console.error('[BackgroundLocationTask] Errore:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const currentLocation = locations[0];
    
    // TODO: Inviare le coordinate al backend per la logica di Geofencing TSaaSI (aggiornamento heatmaps DaaS)
    // E aggiornare il CityContext in background se cambiamo macro-area (App Camaleonte)
    
    console.log('[BackgroundLocationTask] Ricevuta posizione in background:', currentLocation.coords.latitude, currentLocation.coords.longitude);
    
    const now = Date.now();
    if (now - lastCityChangeTimestamp > HYSTERESIS_TIMER_MS) {
      // Qui avverrà il calcolo per verificare se l'utente è entrato in una nuova città
      // Es. const newCity = calculateCity(currentLocation.coords);
      // lastCityChangeTimestamp = now;
    }
  }
});

export const startBackgroundLocationUpdates = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === 'granted') {
    // RICHIESTA BACKGROUND DISABILITATA PER MVP (Evita doppio popup di sistema e rifiuto automatico)
    // const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (true) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // 60 secondi
        distanceInterval: 50, // 50 metri
        deferredUpdatesInterval: 60000,
        showsBackgroundLocationIndicator: true,
      });
      console.log('[BackgroundLocationTask] Servizio avviato con successo.');
    } else {
      console.warn('[BackgroundLocationTask] Permessi background negati.');
    }
  } else {
    console.warn('[BackgroundLocationTask] Permessi foreground negati.');
  }
};

export const stopBackgroundLocationUpdates = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    console.log('[BackgroundLocationTask] Servizio interrotto.');
  }
};
