import os
from PIL import Image

def sanitize_images(directory):
    for filename in os.listdir(directory):
        if filename.lower().endswith('.png'):
            filepath = os.path.join(directory, filename)
            try:
                # Apre l'immagine
                img = Image.open(filepath)
                # Forza la conversione a RGBA (standard PNG) per eliminare profili colore strani
                img = img.convert("RGBA")
                # Salva sovrascrivendo, rimuovendo i metadati exif/icc
                img.save(filepath, format="PNG")
                print(f"Sanitized: {filename}")
            except Exception as e:
                print(f"Error on {filename}: {e}")

if __name__ == "__main__":
    assets_dir = os.path.join(os.getcwd(), 'assets', 'images')
    sanitize_images(assets_dir)
