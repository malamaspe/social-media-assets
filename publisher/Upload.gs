/**
 * Ανέβασμα από iPhone στο Drive «ΥΛΙΚΟ SOCIAL MEDIA» (IG Publisher, ξεχωριστό αρχείο στο ίδιο project).
 *
 * Η συντόμευση iPhone «Στείλε στο ΥΛΙΚΟ» ζητάει εδώ, για κάθε φωτογραφία/βίντεο, μια διεύθυνση ανεβάσματος
 * του Drive (resumable upload) και στέλνει εκεί το αρχείο απευθείας, σε πρωτότυπη ποιότητα. Το αρχείο δεν
 * περνάει από το Apps Script, οπότε δεν υπάρχει όριο μεγέθους από εδώ.
 *
 * Ρύθμιση μία φορά:
 *   1. Ανάπτυξη → Νέα ανάπτυξη → Εφαρμογή ιστού · Εκτέλεση ως: Εγώ · Πρόσβαση: Οποιοσδήποτε → Ανάπτυξη.
 *   2. Ανάπτυξη → Διαχείριση αναπτύξεων → αντιγραφή «URL εφαρμογής ιστού» (/exec) → Ιδιότητα σεναρίου UPLOAD_URL.
 *   3. Εκτέλεση sendUploadLink() → σου έρχεται email με τον σύνδεσμο (με κρυφό κλειδί) για τη συντόμευση.
 * Script Properties: UPLOAD_URL (εσύ), UPLOAD_KEY και UPLOAD_FOLDER_ID (τα φτιάχνει μόνο του).
 * Για να ακυρώσεις τον σύνδεσμο: σβήσε το UPLOAD_KEY και ξανατρέξε sendUploadLink().
 */

function uploadKey_() {
  let k = prop_('UPLOAD_KEY', '');
  if (!k) {
    k = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
    P_().setProperty('UPLOAD_KEY', k);
  }
  return k;
}

function uploadFolder_() {
  const id = prop_('UPLOAD_FOLDER_ID', '');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  const it = DriveApp.getFoldersByName('ΥΛΙΚΟ SOCIAL MEDIA');
  if (!it.hasNext()) throw new Error('Δεν βρέθηκε ο φάκελος «ΥΛΙΚΟ SOCIAL MEDIA».');
  const f = it.next();
  P_().setProperty('UPLOAD_FOLDER_ID', f.getId());
  return f;
}

function uploadOut_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Η συντόμευση στέλνει POST στη διεύθυνση ?key=… με JSON { "name": "IMG_1234.HEIC" }.
// Απάντηση: { "upload_url": "https://www.googleapis.com/upload/drive/v3/files?…" } → εκεί γίνεται PUT το αρχείο.
function doPost(e) {
  let p = {};
  try { p = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (x) { p = {}; }
  const q = (e && e.parameter) || {};
  const key = q.key || p.key || '';
  if (!key || key !== prop_('UPLOAD_KEY', '')) return uploadOut_({ error: 'Λάθος κλειδί' });
  const name = String(p.name || q.name || ('iPhone ' + Utilities.formatDate(new Date(), 'Europe/Athens', 'yyyy-MM-dd HH.mm.ss')))
    .replace(/[\\/]/g, '_').slice(0, 200);
  const headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  if (p.mime) headers['X-Upload-Content-Type'] = String(p.mime);
  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    payload: JSON.stringify({ name: name, parents: [uploadFolder_().getId()] }),
    headers: headers,
    muteHttpExceptions: true,
  });
  const h = res.getAllHeaders();
  const loc = h.Location || h.location;
  if (res.getResponseCode() >= 300 || !loc) {
    return uploadOut_({ error: 'Drive ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 200) });
  }
  return uploadOut_({ upload_url: loc, name: name });
}

// Άνοιγμα της διεύθυνσης σε browser: απλός έλεγχος ότι η εφαρμογή ιστού δουλεύει.
function doGet(e) {
  const ok = e && e.parameter && e.parameter.key === prop_('UPLOAD_KEY', '');
  return uploadOut_(ok ? { ok: true, folder: 'ΥΛΙΚΟ SOCIAL MEDIA' } : { error: 'Λάθος κλειδί' });
}

// Στέλνει στο email σου τον σύνδεσμο για τη συντόμευση (αντιγραφή από το κινητό).
// Το Apps Script, όταν τρέχει από τον επεξεργαστή, δίνει μόνο τη διεύθυνση δοκιμής (/dev). Τη σωστή (/exec) την
// παίρνει από την Ιδιότητα σεναρίου UPLOAD_URL: Ανάπτυξη → Διαχείριση αναπτύξεων → αντιγραφή «URL εφαρμογής ιστού».
function sendUploadLink() {
  const key = uploadKey_();
  uploadFolder_();
  let url = String(prop_('UPLOAD_URL', '') || ScriptApp.getService().getUrl() || '').trim().replace(/\?.*$/, '');
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
    console.log('Χρειάζομαι τη διεύθυνση της εφαρμογής ιστού που τελειώνει σε /exec:\n' +
      '1. Ανάπτυξη → Διαχείριση αναπτύξεων → αντέγραψε το «URL εφαρμογής ιστού» (αν δεν υπάρχει: Ανάπτυξη → Νέα ανάπτυξη → ' +
      'Εφαρμογή ιστού, Εκτέλεση ως: Εγώ, Πρόσβαση: Οποιοσδήποτε).\n' +
      '2. Ρυθμίσεις έργου (γρανάζι) → Ιδιότητες σεναρίου → Προσθήκη: UPLOAD_URL = αυτή η διεύθυνση.\n' +
      '3. Ξανατρέξε sendUploadLink().  (τώρα βρέθηκε: ' + url + ')');
    return;
  }
  const link = url + '?key=' + key;
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '[IG Publisher] Σύνδεσμος για τη συντόμευση «Στείλε στο ΥΛΙΚΟ»',
    'Αντέγραψε από το κινητό αυτόν τον σύνδεσμο και επικόλλησέ τον στη συντόμευση (στην πρώτη «Λήψη περιεχομένων URL»):\n\n' +
    link + '\n\nΜην τον μοιράζεσαι εκτός ομάδας: όποιος τον έχει μπορεί να ανεβάσει αρχεία στον φάκελο. ' +
    'Για να τον ακυρώσεις: σβήσε το UPLOAD_KEY από τις Ιδιότητες σεναρίου και ξανατρέξε sendUploadLink().');
  console.log('Στάλθηκε email με τον σύνδεσμο. Δοκιμή σε browser: ' + link + ' → πρέπει να γράφει "ok": true');
}
