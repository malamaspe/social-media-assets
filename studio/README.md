# Studio: παραγωγή αναρτήσεων NDT & Amaze DJs

Τα εργαλεία με τα οποία ο Claude φτιάχνει posts, stories και reels. Οι κανόνες, οι αποφάσεις και η κατάσταση βρίσκονται στο Project «Social Media» του claude.ai (`claude/instagram-production.md`). Διάβασέ το πριν από κάθε παραγωγή.

Το repo είναι **δημόσιο**: εδώ μπαίνουν μόνο κώδικας, γραμματοσειρές (μέσω npm) και λογότυπα. Φωτογραφίες και βίντεο ΔΕΝ ανεβαίνουν εδώ αυτούσια. Πηγή υλικού είναι πάντα ο φάκελος Drive «ΥΛΙΚΟ SOCIAL MEDIA». Τα IDs των αρχείων του Drive δεν γράφονται εδώ, γιατί ο φάκελος είναι κοινόχρηστος με σύνδεσμο.

## Στήσιμο σε καθαρή συνεδρία
```bash
cd studio
pip install playwright imagehash --break-system-packages && python3 -m playwright install chromium
(cd fonts && npm install)
mkdir -p assets && cp logos/*.png assets/
```
Το `engine.py` βρίσκει μόνο του τον φάκελό του (ή `IG_ROOT`).

## Ροή μιας εβδομάδας / ενός μήνα
1. Υλικό από το Drive (Drive connector για αναζήτηση, κατέβασμα από `drive.usercontent.google.com/download?id=…&export=download&confirm=t`) → επιλεγμένες φωτογραφίες/stills στο `assets/` με περιγραφικό όνομα (`ndt_…`, `amaze_…`). Δες το `used_assets.txt` για να μην επαναλαμβάνονται.
2. Script περιεχομένου (πρότυπο: `examples/week4.py`) → `python3 weekN.py` → `out/weekN/{NDT,AMAZE}/` + `captions.json`.
3. Reels (πρότυπο: `examples/reel_week4.py`): ffmpeg, 1080×1920, ~20″, μουσική ΜΟΝΟ χωρίς πνευματικά δικαιώματα, όχι Παρασκευή.
4. Προεπισκόπηση: `python3 build_preview.py out/weekN previewN "<τίτλος>" "<υπότιτλος>" notes.html` → artifact για έγκριση.
5. Μετά την έγκριση: `python3 make_queue.py out/weekN .. auto` (με `noreels` αν τα reels περιμένουν) → commit & push του repo → έλεγχος ότι τα raw URLs απαντούν 200.
6. Ενημέρωση Sheet (artifact «Instagram 60 ημέρες») και του `claude/instagram-production.md`.

## Διπλότυπες φωτογραφίες
`python3 dedupe_check.py <φάκελος με τα κατεβασμένα>` βρίσκει την ίδια φωτογραφία ανεβασμένη δύο φορές, μετονομασμένη ή ξανασυμπιεσμένη (WhatsApp, εξαγωγή Instagram), και όσες μοιάζουν με ήδη χρησιμοποιημένες (`used_assets.txt`, πεδίο `phash=`). Κάθε νέα γραμμή στο `used_assets.txt`: `<παρτίδα> <όνομα asset> phash=<hash της πηγής>`. Τα ακριβή διπλότυπα στο ίδιο το Drive τα καθαρίζει κάθε βράδυ το `dedupeMaterial` του Apps Script (publisher/Tidy.gs).

