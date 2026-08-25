import os
from PIL import Image
import sys

def convert_to_webp(source_dir):
    print(f"Avvio conversione per la cartella: {source_dir}")
    if not os.path.exists(source_dir):
        print("Cartella non trovata!")
        return

    # Crea cartella di output
    output_dir = os.path.join(source_dir, "webp_output")
    os.makedirs(output_dir, exist_ok=True)

    count = 0
    for filename in os.listdir(source_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            file_path = os.path.join(source_dir, filename)
            
            try:
                # Apri l'immagine
                img = Image.open(file_path)
                
                # Nome file di output (.webp)
                base_name = os.path.splitext(filename)[0]
                output_path = os.path.join(output_dir, f"{base_name}.webp")
                
                # Check se il file esiste già per evitare doppioni/sovrascritture
                if os.path.exists(output_path):
                    print(f"⏩ Saltato (già convertito): {filename}")
                    continue
                
                # Salva in formato WEBP con qualità ottimizzata all'80%
                img.save(output_path, "WEBP", quality=80)
                print(f"✅ Convertito: {filename} -> {base_name}.webp")
                count += 1
            except Exception as e:
                print(f"❌ Errore con {filename}: {e}")

    print(f"\nConversione completata! {count} immagini ottimizzate.")
    print(f"Le trovi nella sottocartella: {output_dir}")

if __name__ == "__main__":
    # Puoi passare il percorso della cartella come argomento, altrimenti usa il default Desktop
    target_folder = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Sem\Desktop\Fase Concept\immagini p.o.i"
    convert_to_webp(target_folder)
