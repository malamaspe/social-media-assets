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
Χρειάζεσαι token με δικαιώματα `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` (και `business_management` αν είναι System User).

- **Αν το token του Ops τα έχει ήδη:** το αντιγράφεις όπως είναι. Μην το ξαναδημιουργήσεις.
- **Αλλιώς, προτεινόμενο:** ξεχωριστό token που δεν λήγει, μέσω System User.
  1. business.facebook.com → Ρυθμίσεις επιχείρησης → Χρήστες → Χρήστες συστήματος → Προσθήκη (ρόλος Admin).
  2. «Ανάθεση στοιχείων»: οι σελίδες NDT Event Production και Amaze Djs, και τα δύο Instagram (πλήρης έλεγχος).
  3. «Δημιουργία νέου διακριτικού»: διαλέγεις το Meta app σου, λήξη «Ποτέ», και τσεκάρεις τα δικαιώματα παραπάνω.
  4. Αντιγράφεις το token. Το token του Ops μένει ανέγγιχτο.

### 2. Google Sheet + Apps Script
1. Νέο Google Sheet με όνομα **IG Publisher**.
2. Επεκτάσεις → Apps Script.
3. Σβήνεις ό,τι υπάρχει στο `Code.gs` και επικολλάς το `publisher/Code.gs`.
4. Ρυθμίσεις έργου (γρανάζι) → «Εμφάνιση αρχείου manifest appsscript.json» → επικολλάς το `publisher/appsscript.json`. Ζώνη ώρας: Athens.
5. Ρυθμίσεις έργου → Ιδιότητες σεναρίου → προσθέτεις `IG_TOKEN` = το token.

### 3. IDs λογαριασμών
1. Στον επεξεργαστή επιλέγεις `findInstagramIds` → Εκτέλεση. Την πρώτη φορά ζητάει άδειες: τις δίνεις.
2. Στο αρχείο καταγραφής βλέπεις τα IDs. Προσθέτεις στις Ιδιότητες σεναρίου:
   - `IG_USER_NDT` = το Instagram ID του newdjsteam
   - `IG_USER_AMAZE` = το Instagram ID του amaze.djs
   - `FB_PAGE_NDT` = το Facebook Page ID της NDT
   - `FB_PAGE_AMAZE` = το Facebook Page ID της Amaze
   Αν δεν βάλεις `FB_PAGE_…`, εκείνο το brand ανεβαίνει μόνο στο Instagram.

### 4. Έλεγχος χωρίς δημοσίευση
1. `checkSetup` → πρέπει να δείξει «Δικαιώματα token: όλα εντάξει», @newdjsteam, @amaze.djs, τις δύο σελίδες Facebook και «προβληματικά αρχεία: 0».
2. `dryRun` → πρέπει να γράψει «Instagram OK» και «Facebook OK … ΔΕΝ δημοσιεύτηκε τίποτα».

### 5. Ενεργοποίηση
`setup` → από εδώ και πέρα ελέγχει κάθε 10 λεπτά και δημοσιεύει ό,τι έφτασε η ώρα του.

## Καθημερινά
- Καρτέλα **Ουρά** στο Sheet: όλο το πρόγραμμα με την κατάσταση κάθε δημοσίευσης και link.
- Καρτέλα **Ιστορικό**: κάθε δημοσίευση ή σφάλμα με την ώρα του.
- Σε σφάλμα έρχεται email. Μετά από 3 αποτυχίες ή καθυστέρηση πάνω από 3 ώρες, η δημοσίευση παραλείπεται, ώστε να μη βγει ποτέ διπλή.
- Instagram και Facebook παρακολουθούνται χωριστά: αν αποτύχει το ένα, το άλλο δεν ξαναδημοσιεύεται.
- `pause()` σταματάει τα πάντα, `resume()` συνεχίζει. Για να σταματήσει μόνο το Facebook: Ιδιότητα σεναρίου `FB_ENABLED` = `false`.
