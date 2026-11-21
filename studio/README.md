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

## Stories με μουσική (απόφαση 20/11)
Κάθε στατικό story γίνεται σύντομο βίντεο με μουσική από το `music_library.json`:
`python3 story_video.py out/<φάκελος>/<BRAND>/<ημ/νία>_story_01.jpg <track_id> out/<φάκελος>/<BRAND>/<ημ/νία>_story_01.mp4 [12|15]`
(12″, ή 15″ για stories με πολύ κείμενο / λίστες / κριτικές). Το mp4 μπαίνει δίπλα στο jpg με το ίδιο όνομα· το `make_queue.py` το βάζει στο `video` του story (το jpg μένει για δοκιμές). Προαιρετικά `captions.json` '<BRAND>|<ημ/νία>|story_music' = «Τίτλος — Καλλιτέχνης». Ταίριαξε κομμάτι με ύφος (NDT house/chill/corporate· Amaze romantic/cocktail για γάμους και κριτικές, party για πάρτι) και μην επαναλαμβάνεις το ίδιο σε κοντινές μέρες. Ο ήχος κατεβαίνει σε cache εκτός repo (`MUSIC_CACHE`, προεπιλογή /tmp/music_cache)· ποτέ mp3 στο repo.

## LinkedIn (απόφαση 21/11)
Posts για το προσωπικό προφίλ του Πέτρου, μόνο για την NDT (το εταιρικό κοινό είναι εκεί· η Amaze όχι). 3 την εβδομάδα, Τρίτη–Πέμπτη 08:45.
1. Γράψε `studio/linkedin/<ημ/νία πρώτου>.json`: λίστα `{"date", "time", "from": "<id post Instagram της ουράς>", "text"}` (πρότυπο: `studio/linkedin/2026-11-24.json`). Χωρίς `from` = μόνο κείμενο· `slides` για υποσύνολο εικόνων· reel → βίντεο.
2. `python3 linkedin_queue.py linkedin/<αρχείο>.json ..` → γράφει στο `linkedin.json` (ποτέ στο `queue.json`) → commit & push.
Κείμενα: πρώτο πρόσωπο (ο Πέτρος, Event Director της NDT), πληθυντικός ευγενείας, άγκιστρο στις 2 πρώτες γραμμές, σύντομες παράγραφοι, λίστες με αριθμούς ή →, CTA ΠΑΝΤΑ με email («στείλτε μας email…»), ΠΟΤΕ «στείλτε μου μήνυμα» (ο Πέτρος δεν παρακολουθεί τα εισερχόμενα του LinkedIn, 21/11), 3–5 hashtags στο τέλος, χωρίς links και χωρίς @ στο κείμενο. Το `linkedin_queue.py` βάζει μόνο του την υπογραφή πριν τα hashtags: email info@newdjsteam.gr και link της σελίδας https://www.linkedin.com/company/newdjsteam. Όχι αντιγραφή της λεζάντας Instagram: πρακτική γνώση για HR / marketing / γραμματείες / agencies, case studies με κριτικές ΑΥΤΟΥΣΙΕΣ. Ποτέ τιμές, προσφορές ή «τελευταίες ημερομηνίες» που δεν έχει πει ο Πέτρος. Όριο 3000 χαρακτήρες (στόχος < 1300).

## Reels του social media manager (απόφαση 21/11)
Ο SMM ανεβάζει τελικά reels στο Drive «ΥΛΙΚΟ SOCIAL MEDIA/ΝΕΑ REELS SMM/NDT» ή «…/AMAZE» (9:16, έως 60″ για να μπαίνουν και σε story, μουσική χωρίς πνευματικά δικαιώματα μέσα στο αρχείο). Κάθε Παρασκευή είναι ενός brand εναλλάξ (NDT 18/12/2026, AMAZE 25/12, NDT 1/1/2027 …) και το reel του SMM παίρνει τη θέση του post της ημέρας για εκείνο το brand (NDT 20:00 / AMAZE 21:00)· το άλλο brand έχει το κανονικό του post. Δικά μας reels ποτέ Παρασκευή.
1. Κατέβασμα από το Drive → `python3 smm_reel.py <mp4> <NDT|AMAZE> .. <out> [--from ΗΗ] [--date ΗΗ]`: διαλέγει την επόμενη ελεύθερη Παρασκευή του brand, ξανακωδικοποιεί μόνο αν χρειάζεται (H.264/AAC, 1080×1920, ≤45 MB, -14 LUFS) και βγάζει cover.
2. `captions.json` στο `<out>`: '<BRAND>|<ημ/νία>' = λεζάντα (γραμμένη από εμάς, με βάση το βίντεο και το .txt του SMM αν υπάρχει) και '<BRAND>|<ημ/νία>|reel' = {"source": "smm", title, yt_title, yt_description, tiktok_caption, yt_tags} (+ "story": false αν > 60″).
3. Μετά την έγκριση του Πέτρου: `python3 make_queue.py <out> .. auto` (αντικαθιστά το post <BRAND>-<ημ/νία>-post) → commit & push → το mp4 της πηγής στο Drive «ΧΡΗΣΙΜΟΠΟΙΗΜΕΝΑ/<ΕΕΕΕ-ΜΜ>».
Το Apps Script κάνει τα υπόλοιπα όπως σε κάθε reel: Facebook, story 15′ μετά, αντίγραφο με κείμενα/ετικέτες στο «REELS» για YouTube/TikTok (τα προγραμματίζει ο SMM).
