import re

with open('utils/SincroAvventura.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Ripristino import
content = content.replace("// import notifee", "import notifee")

# Sostituiamo il corpo ripristinando il codice rimosso
content = re.sub(r"let lastPeakTime = 0;\n\n\n\nasync function syncSteps", r'''let lastPeakTime = 0;

// Registrazione Headless Task per Android Notifee
notifee.registerForegroundService((notification) => {
  return new Promise((resolve) => {
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop') {
        stopBackgroundTracking();
        resolve();
      }
    });
  });
});

async function syncSteps''', content)


content = re.sub(r"DeviceEventEmitter\.emit\('onStepIncrement', \{ total: totalLocal \}\);\n    \n    \n\n    if \(currentSessionCount >=", r'''DeviceEventEmitter.emit('onStepIncrement', { total: totalLocal });
    
    if (Platform.OS === 'android') {
      await notifee.displayNotification({
        id: 'sincro-avventura',
        title: 'Sincro-Avventura Attiva',
        body: Passi/Spinte elaborati: ,
        android: {
          channelId: 'sincro-avventura',
          asForegroundService: true,
          importance: AndroidImportance.HIGH,
          onlyAlertOnce: true,
          ongoing: true,
        },
      });
    }

    if (currentSessionCount >=''', content)


content = re.sub(r"export async function startBackgroundTracking\(isAccessibilityMode: boolean, userId: string\): Promise<void> \{\n  \n\n  if \(subscription\) \{", r'''export async function startBackgroundTracking(isAccessibilityMode: boolean, userId: string): Promise<void> {
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'sincro-avventura',
      name: 'Sincro Avventura Tracking',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: 'sincro-avventura',
      title: 'Sincro-Avventura Avviata',
      body: 'In attesa di movimento...',
      android: {
        channelId,
        asForegroundService: true,
        importance: AndroidImportance.HIGH,
        ongoing: true,
        onlyAlertOnce: true,
      },
    });
  }

  if (subscription) {''', content)


content = content.replace("// await notifee.stopForegroundService();", "await notifee.stopForegroundService();")


with open('utils/SincroAvventura.ts', 'w', encoding='utf-8') as f:
    f.write(content)
