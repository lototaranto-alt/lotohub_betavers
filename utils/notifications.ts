import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura il gestore notifiche globale (come comportarsi quando l'app è in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('gamification', {
      name: 'Ricompense ed Esplorazione',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

/**
 * Pianifica una notifica locale istantanea (es. quando l'utente sblocca un traguardo camminando)
 */
export const scheduleGamificationNotification = async (title: string, body: string, data = {}) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // trigger null = immediato
  });
};

/**
 * Notifica motivazionale per i passi
 */
export const triggerStepMilestoneNotification = async (km: number) => {
  await scheduleGamificationNotification(
    "🌍 Traguardo Sincro-Avventura!",
    `Hai esplorato per ${km.toFixed(1)} km e abbattuto la CO2. Apri l'app per sincronizzare e ricevere punti XP!`,
    { type: 'step_milestone', km }
  );
};
