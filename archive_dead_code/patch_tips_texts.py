import re

with open('components/TipsBoutiqueSheet.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change section title
content = content.replace("I Sensi del Camaleonte", "Sincro-Avventura")
content = content.replace("Attiva i sensori per sbloccare il pieno potenziale dell'app.", "Sincronizza il tuo dispositivo per sbloccare il pieno potenziale dell'ecosistema L.O.T.O.")

# 2. Upgrade the Tips text
old_tips = """const TIPS_DATA = [
  {
    id: 'explore',
    title: 'Esplorazione Dinamica',
    icon: 'map',
    content: 'La mappa non mostra tutti i luoghi contemporaneamente per non sovraccaricarti. Usa i filtri per scoprire dove pulsa il cuore della citt in questo momento.'
  },
  {
    id: 'earn',
    title: 'Guadagnare LOTO PTI',
    icon: 'nfc',
    content: 'Quando raggiungi un Luogo d\\'Interesse, avvicina il telefono all\\'adesivo NFC che trovi all\\'ingresso, o scansiona il QR Code. Riceverai i tuoi punti istantaneamente.'
  }
];"""

new_tips = """const TIPS_DATA = [
  {
    id: 'explore',
    title: 'L\\'Arte dell\\'Esplorazione',
    icon: 'map',
    content: 'L.O.T.O. rivela i suoi segreti con eleganza, un passo alla volta. Usa il radar sensoriale nella mappa per percepire le zone attive senza spezzare la magia del viaggio.'
  },
  {
    id: 'earn',
    title: 'Sigilli Digitali (Zero-IoT)',
    icon: 'nfc',
    content: 'Ogni Luogo Custode protegge un emblema invisibile. Sfiora l\\'adesivo L.O.T.O. con il tuo dispositivo per validare la tua presenza e rivendicare i tuoi Punti Impatto (PTI).'
  }
];"""

content = content.replace(old_tips, new_tips)

with open('components/TipsBoutiqueSheet.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Tips texts upgraded")
