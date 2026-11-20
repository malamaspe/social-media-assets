# social-media-assets

Εικόνες, βίντεο και πρόγραμμα (`queue.json`) για τις αυτόματες δημοσιεύσεις στο Instagram και στις σελίδες Facebook της **NDT** (@newdjsteam) και της **Amaze DJs** (@amaze.djs).

Το repo είναι δημόσιο, γιατί το Instagram Graph API κατεβάζει τα αρχεία από δημόσιο link τη στιγμή της δημοσίευσης. Εδώ μπαίνει μόνο περιεχόμενο που έχει ήδη εγκριθεί. Είναι ανεξάρτητο από το NDT OPS.

```
queue.json                 το εγκεκριμένο πρόγραμμα (τι, πότε, σε ποιον λογαριασμό)
media/2026-11/NDT/...      εικόνες NDT ανά μήνα
media/2026-11/AMAZE/...    εικόνες Amaze ανά μήνα
publisher/Code.gs          το Apps Script που δημοσιεύει
publisher/appsscript.json  manifest του Apps Script
```

Κάθε εγγραφή του `queue.json` περιέχει: `id`, `account` (NDT / AMAZE), `type` (IMAGE, CAROUSEL, STORY, REEL), `publish_at` (ώρα Ελλάδας), `images` ή `video`, και `caption`.

## Εγκατάσταση (μία φορά, ~20 λεπτά)

### 1. Token από το Meta
Εφαρμογή Meta: **NDT Social Publisher** (Live), με τα use cases «Manage everything on your Page» και «Manage messaging & content on Instagram» (API setup with Facebook login). Χρειάζονται τα δικαιώματα `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `business_management`.

**Τρόπος Α (προτεινόμενος, χωρίς SMS): μόνιμα tokens σελίδας**
1. developers.facebook.com/tools/explorer → Meta App: **NDT Social Publisher** → «User or Page»: **User Token** → πρόσθεσε τα 6 δικαιώματα → **Generate Access Token** → στο παράθυρο του Facebook επίλεξε τις δύο σελίδες και τα δύο Instagram → Συνέχεια.
2. Αντέγραψε το token → developers.facebook.com/tools/debug/accesstoken → **Debug** → κάτω κάτω **Extend Access Token** → αντέγραψε το νέο token (λήγει σε ~60 μέρες, είναι μόνο ενδιάμεσο).
3. Πίσω στο Graph API Explorer: επικόλλησε το νέο token στο πεδίο Access Token, γράψε στο ερώτημα `me/accounts?fields=name,access_token` → **Submit**.
4. Για κάθε σελίδα αντιγράφεις το `access_token` της. Στο Debugger πρέπει να γράφει **Type: Page, Expires: Never**.
5. Στις Ιδιότητες σεναρίου: `TOKEN_NDT` = το token της NDT, `TOKEN_AMAZE` = το token της Amaze.

Τα tokens σελίδας δεν λήγουν. Σταματούν μόνο αν αλλάξεις κωδικό στο Facebook ή χάσεις τον ρόλο σου στη σελίδα: τότε έρχεται email σφάλματος και επαναλαμβάνεις τα βήματα 1–5.

**Τρόπος Β: System User token** (business.facebook.com/settings → Χρήστες συστήματος → NDTautopost → Δημιουργία διακριτικού, λήξη «Ποτέ», τα 6 δικαιώματα). Μπαίνει ως `IG_TOKEN`. Θέλει επαλήθευση με SMS.

### 2. Google Sheet + Apps Script
1. Νέο Google Sheet με όνομα **IG Publisher**.
2. Επεκτάσεις → Apps Script.
3. Σβήνεις ό,τι υπάρχει στο `Code.gs` και επικολλάς το `publisher/Code.gs`.
4. Ρυθμίσεις έργου (γρανάζι) → «Εμφάνιση αρχείου manifest appsscript.json» → επικολλάς το `publisher/appsscript.json`. Ζώνη ώρας: Athens.
5. Ρυθμίσεις έργου → Ιδιότητες σεναρίου → προσθέτεις τα tokens του βήματος 1 (`TOKEN_NDT` και `TOKEN_AMAZE`, ή `IG_TOKEN`).

### 3. IDs λογαριασμών
Στον επεξεργαστή επιλέγεις `findInstagramIds` → Εκτέλεση. Την πρώτη φορά ζητάει άδειες Google: τις δίνεις («Σύνθετες ρυθμίσεις → Μετάβαση στο IG Publisher» αν πει ότι δεν είναι επαληθευμένη). Βρίσκει και **αποθηκεύει μόνο του** τα `IG_USER_NDT`, `IG_USER_AMAZE`, `FB_PAGE_NDT`, `FB_PAGE_AMAZE`.

### 4. Έλεγχος χωρίς δημοσίευση
1. `checkSetup` → πρέπει να δείξει για κάθε token «δεν λήγει, δικαιώματα εντάξει», @newdjsteam, @amaze.djs, τις δύο σελίδες Facebook και «προβληματικά αρχεία: 0».
2. `dryRun` → πρέπει να γράψει «Instagram OK» και «Facebook OK … ΔΕΝ δημοσιεύτηκε τίποτα».
3. `dryRunReel` (όταν υπάρχει reel στην ουρά) → φτιάχνει το reel στο Instagram χωρίς να το δημοσιεύσει και γράφει «Instagram OK: το reel … επεξεργάστηκε σωστά». Παίρνει 1–3 λεπτά.

### 5. Ενεργοποίηση
`setup` → από εδώ και πέρα ελέγχει κάθε 10 λεπτά και δημοσιεύει ό,τι έφτασε η ώρα του.

## Καθημερινά
- Καρτέλα **Ουρά** στο Sheet: όλο το πρόγραμμα με την κατάσταση κάθε δημοσίευσης και link.
- Καρτέλα **Ιστορικό**: κάθε δημοσίευση ή σφάλμα με την ώρα του.
- Σε σφάλμα έρχεται email. Μετά από 3 αποτυχίες ή καθυστέρηση πάνω από 3 ώρες, η δημοσίευση παραλείπεται, ώστε να μη βγει ποτέ διπλή.
- Instagram και Facebook παρακολουθούνται χωριστά: αν αποτύχει το ένα, το άλλο δεν ξαναδημοσιεύεται.
- **Κάθε reel και ως story:** κάθε reel της ουράς βγαίνει αυτόματα και ως story (το ίδιο βίντεο) 15 λεπτά μετά, σε Instagram και Facebook. Το ίδιο γίνεται και για reels που ανεβάζετε εσείς από την εφαρμογή (10′–3 ώρες μετά), εκτός αν έχουν μουσική από τη βιβλιοθήκη του Instagram (το API δεν δίνει το βίντεο) ή είναι πάνω από 60″ (όριο story)· τότε έρχεται email να το κάνετε με το χέρι. Το API δεν βάζει την «κάρτα» του reel (sticker), μόνο το βίντεο. `REEL_STORY=false` / `MANUAL_REEL_STORY=false` στις Ιδιότητες σεναρίου τα σταματούν· `"story": false` σε ένα reel της ουράς το εξαιρεί.
- **Tags του crew στα stories:** στις Ιδιότητες σεναρίου `CREW_TAGS_NDT` / `CREW_TAGS_AMAZE` = usernames με κόμμα (χωρίς @). Μπαίνουν σε κάθε story στο Instagram (όχι στο Facebook, δεν υποστηρίζεται) για να έρχεται ειδοποίηση και να κάνουν repost. `checkCrewTags` τα ελέγχει χωρίς να δημοσιεύσει. Αν το Instagram δεν δεχτεί τα tags, το story βγαίνει χωρίς αυτά και έρχεται email μία φορά. Τα usernames μένουν μόνο στις Ιδιότητες σεναρίου, όχι στο δημόσιο repo.
- **Tags σε posts μόνο σε όσους φαίνονται:** στο post της ουράς `"people": [{"name": "Κώστας", "slide": 0, "x": 0.6, "y": 0.3}]` (μόνο μικρά ονόματα· στο captions.json ως `<BRAND>|<ημ/νία>|people`). Τα usernames είναι στις Ιδιότητες σεναρίου: `CREW_MAP` = `Κώστας=kostas.ndt, Ιγνάτης=ignatis`. Στις φωτογραφίες τα ονόματα δεν φαίνονται πάνω στην εικόνα (μόνο ένα μικρό εικονίδιο κάτω αριστερά, εμφανίζονται με πάτημα). Στα reels το username φαίνεται κάτω αριστερά, γι’ αυτό εκεί δεν μπαίνουν. Αν το Instagram δεν δεχτεί τα tags, το post βγαίνει χωρίς αυτά και έρχεται email μία φορά.
- **Reels για YouTube Shorts / TikTok:** κάθε reel της ουράς αντιγράφεται μόνο του στο Drive, φάκελος «ΥΛΙΚΟ SOCIAL MEDIA/REELS», ως `2026-12-01 Τρι 20.00 – NDT – Τίτλος.mp4` μαζί με `.txt` (τίτλος, περιγραφή και ετικέτες YouTube, λεζάντα TikTok· οι ετικέτες πάνε στο πεδίο «Ετικέτες» του YouTube Studio, όχι στην περιγραφή, έως 500 χαρακτήρες). Από εκεί τα προγραμματίζεις με το χέρι. `syncReelsNow` το κάνει αμέσως. Αν ένα reel ξαναφτιαχτεί, η παλιά έκδοση πάει στον κάδο. Θέλει την άδεια Drive του manifest (`https://www.googleapis.com/auth/drive`).
- **Εξαγωγές Instagram (`publisher/Tidy.gs`):** `tidyIgExports` ενώνει τους φακέλους media, media1, media2… μέσα σε κάθε «IG …» του «ΥΛΙΚΟ SOCIAL MEDIA» σε μία δομή (posts / stories / reels / … ανά μήνα) και στέλνει στον κάδο τα ακριβή διπλότυπα (MD5). Περιμένει μόνο του να τελειώσουν τα ανεβάσματα, συνεχίζει κάθε 10 λεπτά και στέλνει email όταν τελειώσει.
- **Ανέβασμα από iPhone (`publisher/Upload.gs`):** εφαρμογή ιστού που δίνει στη συντόμευση «Στείλε στο ΥΛΙΚΟ» διεύθυνση ανεβάσματος του Drive· το αρχείο πάει κατευθείαν στο «ΥΛΙΚΟ SOCIAL MEDIA» σε πρωτότυπη ποιότητα. Ανάπτυξη ως Εφαρμογή ιστού (Εκτέλεση ως: Εγώ, Πρόσβαση: Οποιοσδήποτε) και μετά `sendUploadLink` για το email με τον σύνδεσμο (περιέχει κρυφό κλειδί, UPLOAD_KEY).
- `pause()` σταματάει τα πάντα, `resume()` συνεχίζει. Για να σταματήσει μόνο το Facebook: Ιδιότητα σεναρίου `FB_ENABLED` = `false`.
