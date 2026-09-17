import re

with open("app/(tabs)/map.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """  // Inizializza Sincro-Avventura in base allo switch accessibilità
  useEffect(() => {
    if (userId) {
      startBackgroundTracking(isAccessibleMode, userId);
    }
  }, [isAccessibleMode, userId]);"""

new_block = """  // [MODIFICA UX] Il pedometro NON si avvia più in automatico all'apertura della mappa
  // Verrà spostato in un trigger manuale (es. Onboarding Tips) per azzerare la frizione.
  useEffect(() => {
    // Sincro-Avventura rimossa dall'auto-avvio
  }, [isAccessibleMode, userId]);"""

content = content.replace(old_block, new_block)

with open("app/(tabs)/map.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Pedometer auto-start friction removed")
