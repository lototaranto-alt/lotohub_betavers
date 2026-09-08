import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const POI_GEOFENCE_TASK = 'POI_GEOFENCE_TASK';

// Logica di "Isteresi" per evitare l'effetto ping-pong sui confini urbani
let lastCityChangeTimestamp = 0;
const HYSTERESIS_TIMER_MS = 10 * 60 * 1000;

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any): Promise<void> => {
  if (error) return;
  if (data) {
    const { locations } = data as any;
    const currentLocation = locations[0];
    const now = Date.now();
    if (now - lastCityChangeTimestamp > HYSTERESIS_TIMER_MS) {
       // Logica cambio città (omessa per brevità)
    }
  }
});

// TASK: Geofencing per i POI (Risolve il problema dei "Check-in dimenticati")
TaskManager.defineTask(POI_GEOFENCE_TASK, async ({ data, error }: any): Promise<void> => {
  if (error) {
    console.error('[GeofenceTask] Errore:', error.message);
    return;
  }
  
  if (data) {
    const { eventType, region } = data;
    
    // 1 = ENTER (Utente entrato nel raggio di 50 metri)
    // 2 = EXIT (Utente uscito)
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log('[GeofenceTask] Entrato nel POI:', region.identifier);
      
      // Spara notifica locale gratuita e offline
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Sei arrivato! 📍",
          body: `Apri L.O.T.O. e fai check-in per sbloccare i tuoi punti XP!`,
          data: { poiId: region.identifier },
        },
        trigger: null, // Subito
      });
    }
  }
});

export const startBackgroundLocationUpdates = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === 'granted') {
    if (true) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 50,
        deferredUpdatesInterval: 60000,
        showsBackgroundLocationIndicator: true,
      });
      console.log('[BackgroundLocationTask] Tracking Avviato.');
    }
  }
};

export const startPoiGeofencing = async (pois: { id: string, latitude: number, longitude: number }[]) => {
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  if (backgroundStatus === 'granted') {
    // Prepariamo le "bolle" (Geofence) attorno ai monumenti
    const regions = pois.map(poi => ({
      identifier: poi.id,
      latitude: poi.latitude,
      longitude: poi.longitude,
      radius: 60, // 60 metri di raggio
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    await Location.startGeofencingAsync(POI_GEOFENCE_TASK, regions);
    console.log(`[GeofenceTask] Monitoraggio avviato per ${regions.length} POI in background.`);
  } else {
    console.log('[GeofenceTask] Permessi background necessari per il geofencing a schermo spento.');
  }
};

export const stopBackgroundLocationUpdates = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
  const isGeofenceRegistered = await TaskManager.isTaskRegisteredAsync(POI_GEOFENCE_TASK);
  if (isGeofenceRegistered) {
    await Location.stopGeofencingAsync(POI_GEOFENCE_TASK);
  }
};
