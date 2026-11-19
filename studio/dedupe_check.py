"""Βρίσκει ίδιες φωτογραφίες ανάμεσα στο υλικό που κατέβηκε, και όσες έχουν ήδη χρησιμοποιηθεί.

Συγκρίνει περιεχόμενο (perceptual hash), όχι ονόματα: πιάνει το ίδιο αρχείο ανεβασμένο δύο φορές, μετονομασμένο,
ή ξανασυμπιεσμένο (WhatsApp, εξαγωγή Instagram, μικρότερη ανάλυση).

    python3 dedupe_check.py <φάκελος με τα κατεβασμένα> [used_assets.txt] [όριο=8]

Τυπώνει ομάδες ίδιων φωτογραφιών (κράτα μία) και ποιες μοιάζουν με ήδη χρησιμοποιημένες (μην τις ξαναβάλεις).
Όταν χρησιμοποιείς μια φωτογραφία, γράψε στο used_assets.txt: «<παρτίδα> <όνομα asset> phash=<hash της πηγής>».
"""
import sys, os, re
from PIL import Image, ImageOps
import imagehash

EXT = ('.jpg', '.jpeg', '.png', '.webp', '.heic')


def phash(path):
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    return imagehash.phash(im)


def main():
    folder = sys.argv[1]
    used_file = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), 'used_assets.txt')
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    files = sorted(f for f in os.listdir(folder) if f.lower().endswith(EXT))
    hashes = {}
    for f in files:
        try:
            hashes[f] = phash(os.path.join(folder, f))
        except Exception as e:  # αρχείο που δεν ανοίγει
            print(f'?? {f}: {e}')
    used = []
    if os.path.exists(used_file):
        for line in open(used_file, encoding='utf-8'):
            m = re.search(r'phash=([0-9a-f]{16})', line)
            if m:
                used.append((line.split()[1] if len(line.split()) > 1 else line.strip(), imagehash.hex_to_hash(m.group(1))))

    seen, groups = set(), []
    names = list(hashes)
    for i, a in enumerate(names):
        if a in seen:
            continue
        g = [a] + [b for b in names[i + 1:] if b not in seen and hashes[a] - hashes[b] <= limit]
        seen.update(g)
        if len(g) > 1:
            groups.append(g)
    print(f'{len(hashes)} φωτογραφίες, {len(groups)} ομάδες ίδιων:')
    for g in groups:
        print('  ΙΔΙΕΣ:', ' = '.join(g))
    print('Ήδη χρησιμοποιημένες:')
    for f, h in hashes.items():
        hit = [(n, h - uh) for n, uh in used if h - uh <= limit]
        if hit:
            print(f'  {f} ≈ {min(hit, key=lambda x: x[1])[0]}')


if __name__ == '__main__':
    main()
