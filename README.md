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
Εφαρμογή Meta: **NDT Social Publisher** (Live), με τα use cases «Manage everything on your Page» και «Manage messaging & content on Instagram» (API setup with Facebook login). Χρειάζονται τα δικαιώματα `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `business_management` και (από 26/11, για τις «Ώρες κοινού») `instagram_manage_insights`. Αν το `instagram_manage_insights` δεν εμφανίζεται στο Graph API Explorer: developers.facebook.com/apps → NDT Social Publisher → Use cases → «Manage messaging & content on Instagram» → Customize → Permissions → `instagram_manage_insights` → Add.

**Τρόπος Α (προτεινόμενος, χωρίς SMS): μόνιμα tokens σελίδας**
1. developers.facebook.com/tools/explorer → Meta App: **NDT Social Publisher** → «User or Page»: **User Token** → πρόσθεσε τα 7 δικαιώματα → **Generate Access Token** → στο παράθυρο του Facebook επίλεξε τις δύο σελίδες και τα δύο Instagram → Συνέχεια.
2. Αντέγραψε το token → developers.facebook.com/tools/debug/accesstoken → **Debug** → κάτω κάτω **Extend Access Token** → αντέγραψε το νέο token (λήγει σε ~60 μέρες, είναι μόνο ενδιάμεσο).
3. Πίσω στο Graph API Explorer: επικόλλησε το νέο token στο πεδίο Access Token, γράψε στο ερώτημα `me/accounts?fields=name,access_token` → **Submit**.
4. Για κάθε σελίδα αντιγράφεις το `access_token` της. Στο Debugger πρέπει να γράφει **Type: Page, Expires: Never**.
5. Στο Sheet: μενού ⚙️ Publisher → «Αλλαγή ρύθμισης…»: `TOKEN_NDT` = το token της NDT, μετά `TOKEN_AMAZE` = το token της Amaze (η οθόνη Ιδιότητες σεναρίου είναι μόνο για ανάγνωση με πάνω από 50 ιδιότητες).

Τα tokens σελίδας δεν λήγουν. Σταματούν μόνο αν αλλάξεις κωδικό στο Facebook ή χάσεις τον ρόλο σου στη σελίδα: τότε έρχεται email σφάλματος και επαναλαμβάνεις τα βήματα 1–5.

**Τρόπος Β: System User token** (business.facebook.com/settings → Χρήστες συστήματος → NDTautopost → Δημιουργία διακριτικού, λήξη «Ποτέ», τα 7 δικαιώματα). Μπαίνει ως `IG_TOKEN`. Θέλει επαλήθευση με SMS.

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
- Instagram, Facebook και LinkedIn παρακολουθούνται χωριστά: αν αποτύχει το ένα, τα άλλα δεν ξαναδημοσιεύονται.
- **Κάθε reel και ως story:** κάθε reel της ουράς βγαίνει αυτόματα και ως story (το ίδιο βίντεο) 15 λεπτά μετά, σε Instagram και Facebook. Το ίδιο γίνεται και για reels που ανεβάζετε εσείς από την εφαρμογή (10′–3 ώρες μετά), εκτός αν έχουν μουσική από τη βιβλιοθήκη του Instagram (το API δεν δίνει το βίντεο) ή είναι πάνω από 60″ (όριο story)· τότε έρχεται email να το κάνετε με το χέρι. Το API δεν βάζει την «κάρτα» του reel (sticker), μόνο το βίντεο. `REEL_STORY=false` / `MANUAL_REEL_STORY=false` στις Ιδιότητες σεναρίου τα σταματούν· `"story": false` σε ένα reel της ουράς το εξαιρεί.
- **Tags του crew στα stories:** στις Ιδιότητες σεναρίου `CREW_TAGS_NDT` / `CREW_TAGS_AMAZE` = usernames με κόμμα (χωρίς @). Μπαίνουν σε κάθε story στο Instagram (όχι στο Facebook, δεν υποστηρίζεται) για να έρχεται ειδοποίηση και να κάνουν repost. `checkCrewTags` τα ελέγχει χωρίς να δημοσιεύσει. Αν το Instagram δεν δεχτεί τα tags, το story βγαίνει χωρίς αυτά και έρχεται email μία φορά. Τα usernames μένουν μόνο στις Ιδιότητες σεναρίου, όχι στο δημόσιο repo.
- **Tags σε posts μόνο σε όσους φαίνονται:** στο post της ουράς `"people": [{"name": "Κώστας", "slide": 0, "x": 0.6, "y": 0.3}]` (μόνο μικρά ονόματα· στο captions.json ως `<BRAND>|<ημ/νία>|people`). Τα usernames είναι στις Ιδιότητες σεναρίου: `CREW_MAP` = `Κώστας=kostas.ndt, Ιγνάτης=ignatis`. Στις φωτογραφίες τα ονόματα δεν φαίνονται πάνω στην εικόνα (μόνο ένα μικρό εικονίδιο κάτω αριστερά, εμφανίζονται με πάτημα). Στα reels το username φαίνεται κάτω αριστερά, γι’ αυτό εκεί δεν μπαίνουν. Αν το Instagram δεν δεχτεί τα tags, το post βγαίνει χωρίς αυτά και έρχεται email μία φορά.
- **Reels για YouTube Shorts / TikTok:** κάθε reel της ουράς αντιγράφεται μόνο του στο Drive, φάκελος «ΥΛΙΚΟ SOCIAL MEDIA/REELS», ως `2026-12-01 Τρι 20.00 – NDT – Τίτλος.mp4` μαζί με `.txt` (τίτλος, περιγραφή και ετικέτες YouTube, λεζάντα TikTok· οι ετικέτες πάνε στο πεδίο «Ετικέτες» του YouTube Studio, όχι στην περιγραφή, έως 500 χαρακτήρες). Από εκεί τα προγραμματίζεις με το χέρι. `syncReelsNow` το κάνει αμέσως. Αν ένα reel ξαναφτιαχτεί, η παλιά έκδοση πάει στον κάδο. Θέλει την άδεια Drive του manifest (`https://www.googleapis.com/auth/drive`).
- **Εξαγωγές Instagram (`publisher/Tidy.gs`):** `tidyIgExports` ενώνει τους φακέλους media, media1, media2… μέσα σε κάθε «IG …» του «ΥΛΙΚΟ SOCIAL MEDIA» σε μία δομή (posts / stories / reels / … ανά μήνα) και στέλνει στον κάδο τα ακριβή διπλότυπα (MD5). Περιμένει μόνο του να τελειώσουν τα ανεβάσματα, συνεχίζει κάθε 10 λεπτά και στέλνει email όταν τελειώσει.
- **Ανέβασμα από iPhone (`publisher/Upload.gs`):** εφαρμογή ιστού που δίνει στη συντόμευση «Στείλε στο ΥΛΙΚΟ» διεύθυνση ανεβάσματος του Drive· το αρχείο πάει κατευθείαν στο «ΥΛΙΚΟ SOCIAL MEDIA» σε πρωτότυπη ποιότητα. Ανάπτυξη ως Εφαρμογή ιστού (Εκτέλεση ως: Εγώ, Πρόσβαση: Οποιοσδήποτε) και μετά `sendUploadLink` για το email με τον σύνδεσμο (περιέχει κρυφό κλειδί, UPLOAD_KEY).
- **LinkedIn (προσωπικό προφίλ του Πέτρου, μόνο NDT):** τα posts είναι στο `linkedin.json` (ΟΧΙ στο `queue.json`), με δικά τους κείμενα για εταιρικό κοινό και τις ίδιες εικόνες/βίντεο με το Instagram. Τρίτη–Πέμπτη 08:45. Φτιάχνονται με `studio/linkedin_queue.py`. Σύνδεση: token από το Token Generator του LinkedIn Developer Portal (openid, profile, w_member_social) → Sheet «IG Publisher» → μενού **⚙️ Publisher → LinkedIn: νέο token…** (ελέγχεται πριν αποθηκευτεί, ως `LI_TOKEN`). `linkedinSetup` δείχνει τα επόμενα posts. Το προφίλ, η ημερομηνία έναρξης (`LI_SINCE`, ό,τι ήταν πριν αγνοείται χωρίς email) και η ηλικία του token βρίσκονται μόνα τους. Το token λήγει στις 60 ημέρες: email στις 50, 57 και 59 ημέρες με τα βήματα· αλλάζεις μόνο το `LI_TOKEN`. `LI_ENABLED=false` σταματάει μόνο το LinkedIn. Στη σελίδα της NDT θα χρειαζόταν το Community Management API (αίτηση/έλεγχος από το LinkedIn)· ο κώδικας θα έμενε ίδιος, αλλάζει μόνο ο author.
- **Ρυθμίσεις από το Sheet:** όταν οι Ιδιότητες σεναρίου ξεπεράσουν τις 50 (μία σημείωση done_/fail_ ανά δημοσίευση), η οθόνη του Apps Script τις δείχνει μόνο για ανάγνωση. Γι' αυτό το Sheet έχει μενού **⚙️ Publisher**: «LinkedIn: νέο token…», «Αλλαγή ρύθμισης…» (π.χ. CREW_TAGS_NDT, CREW_MAP, LI_ENABLED, FB_ENABLED, PAUSED· κενό = διαγραφή, με επιβεβαίωση) και «Δες τις ρυθμίσεις» (τα tokens φαίνονται κρυμμένα). Θέλει το scope `script.container.ui` του appsscript.json.
- `pause()` σταματάει τα πάντα, `resume()` συνεχίζει. Για να σταματήσει μόνο το Facebook: Ιδιότητα σεναρίου `FB_ENABLED` = `false`.

## Αυτόματη ενημέρωση του Apps Script (χωρίς επικόλληση)
Workflow `.github/workflows/deploy-publisher.yml` (όπως στην NDT OPS): κάθε push στο `main` που αλλάζει τον φάκελο `publisher/` ανεβάζει τον κώδικα στο Apps Script του Sheet «IG Publisher» με clasp, ενημερώνει τη web app της συντόμευσης (Upload.gs) στο ίδιο link και επαληθεύει. Αν κάποιος άλλαξε κώδικα απευθείας στον editor, σταματά χωρίς να ανεβάσει τίποτα. Οι Ιδιότητες σεναρίου και οι triggers δεν αγγίζονται.
- Μία φορά: secrets `CLASPRC_JSON` (περιεχόμενο του `~/.clasprc.json`, ίδιο με της OPS) και `IG_SCRIPT_ID` (Apps Script → Ρυθμίσεις έργου → Script ID). Μετά Actions → Deploy publisher → Run workflow με `check`, και αν οι διαφορές είναι οι αναμενόμενες, με `force`.
- Αν ένα νέο Code.gs ζητά νέα δικαιώματα, ο κώδικας ανεβαίνει, το workflow βγαίνει «αποτυχία» (έρχεται email) και θέλει μία έγκριση από το μενού ⚙️ Publisher.

## Ώρες κοινού (από 26/11)
Κάθε μέρα στις 04:00 το `updateAudienceHours` διαβάζει από το Instagram πόσοι ακόλουθοι κάθε brand είναι online ανά ώρα (τελευταίες 30 μέρες) και γράφει στο Sheet την καρτέλα **Ώρες κοινού**: καλύτερη ώρα ανά μέρα της εβδομάδας (μέσος όρος 4 εβδομάδων, 08:00–23:00). Το μηνιαίο πακέτο βάζει εκεί τα posts και τα stories (5′ μετά). Χωρίς δεδομένα ή με λιγότερες από 2 μετρήσεις για μια μέρα → σταθερή ώρα (NDT 20:00, AMAZE 21:00). Τα reels του SMM μένουν Παρασκευή 15:00, το LinkedIn 08:45.
- Θέλει το δικαίωμα `instagram_manage_insights` στα `TOKEN_NDT` / `TOKEN_AMAZE` (Τρόπος Α με 7 δικαιώματα· το `checkSetup` γράφει «ΛΕΙΠΟΥΝ» αν δεν υπάρχει).
- Πρώτη φορά: μενού ⚙️ Publisher → «Ώρες κοινού: ενημέρωση τώρα» (βάζει και τον καθημερινό έλεγχο).
- Η καρτέλα `_online` κρατάει τα ακατέργαστα στοιχεία 8 εβδομάδων. Σφάλμα → ένα email (όχι κάθε μέρα)· οι δημοσιεύσεις δεν επηρεάζονται.
