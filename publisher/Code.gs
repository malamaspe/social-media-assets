/**
 * IG Publisher — NDT & Amaze DJs
 *
 * Δημοσιεύει στο Instagram (post, carousel, story, reel) μέσω του Instagram Graph API,
 * σύμφωνα με το queue.json του repo malamaspe/social-media-assets.
 * Ανεξάρτητο από το NDT OPS: δικό του project, δικό του Sheet, δικά του Script Properties.
 *
 * Script Properties (Project Settings → Script Properties):
 *   IG_TOKEN        access token με instagram_basic + instagram_content_publish (+ pages_show_list, pages_read_engagement)
 *   IG_USER_NDT     Instagram Business Account ID του newdjsteam
 *   IG_USER_AMAZE   Instagram Business Account ID του amaze.djs
 *   GRAPH_VERSION   προαιρετικό, π.χ. v23.0 (κενό = η έκδοση του Meta app)
 *   PAUSED          true για παύση όλων των δημοσιεύσεων
 *
 * Συναρτήσεις που τρέχεις με το χέρι:
 *   findInstagramIds()  βρίσκει τα IDs των λογαριασμών Instagram
 *   checkSetup()        ελέγχει token, λογαριασμούς, ουρά και εικόνες
 *   dryRun()            φτιάχνει container για το επόμενο post ΧΩΡΙΣ να δημοσιεύσει
 *   setup()             βάζει τον αυτόματο έλεγχο κάθε 10 λεπτά
 *   pause() / resume()  παύση / συνέχεια
 */

const CFG = {
  QUEUE_URL: 'https://raw.githubusercontent.com/malamaspe/social-media-assets/main/queue.json',
  GRAPH: 'https://graph.facebook.com',
  LATE_LIMIT_MIN: 180,   // αν κάτι καθυστερήσει πάνω από 3 ώρες, δεν δημοσιεύεται (έρχεται email)
  MAX_FAILS: 3,          // μετά από 3 αποτυχίες σταματάει να ξαναδοκιμάζει (έρχεται email)
  EVERY_MIN: 10,
};

// ------------------------------------------------------------------ helpers
function P_() { return PropertiesService.getScriptProperties(); }
function prop_(k, d) { const v = P_().getProperty(k); return v === null || v === '' ? d : v; }

function token_() {
  const t = prop_('IG_TOKEN', '');
  if (!t) throw new Error('Λείπει το Script Property IG_TOKEN');
  return t;
}

function igUserId_(account) {
  const id = prop_('IG_USER_' + account, '');
  if (!id) throw new Error('Λείπει το Script Property IG_USER_' + account);
  return id;
}

function base_() {
  const v = prop_('GRAPH_VERSION', '');
  return v ? CFG.GRAPH + '/' + v : CFG.GRAPH;
}

function api_(method, path, params) {
  const p = Object.assign({}, params || {}, { access_token: token_() });
  let url = base_() + '/' + path;
  const opt = { method: method, muteHttpExceptions: true };
  if (method === 'get') {
    url += '?' + Object.keys(p).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&');
  } else {
    opt.payload = p;
  }
  const res = UrlFetchApp.fetch(url, opt);
  let body = {};
  try { body = JSON.parse(res.getContentText() || '{}'); } catch (e) { body = { raw: res.getContentText() }; }
  if (res.getResponseCode() >= 400 || body.error) {
    const er = body.error || {};
    throw new Error('Graph API ' + res.getResponseCode() + ': ' + (er.message || res.getContentText()) +
      ' [code ' + (er.code || '') + ', subcode ' + (er.error_subcode || '') + ']');
  }
  return body;
}

function notify_(subject, text) {
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '[IG Publisher] ' + subject, text);
  } catch (e) { console.error('email failed: ' + e.message); }
}

function fetchQueue_() {
  const res = UrlFetchApp.fetch(CFG.QUEUE_URL + '?nocache=' + Date.now(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Δεν διαβάστηκε το queue.json (' + res.getResponseCode() + ')');
  const q = JSON.parse(res.getContentText());
  (q.items || []).sort(function (a, b) { return new Date(a.publish_at) - new Date(b.publish_at); });
  return q;
}

// ------------------------------------------------------------------ publishing
function createContainer_(igId, params) {
  return api_('post', igId + '/media', params).id;
}

function waitReady_(containerId, tries, sleepMs) {
  tries = tries || 20; sleepMs = sleepMs || 3000;
  for (let i = 0; i < tries; i++) {
    const s = api_('get', containerId, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') {
      throw new Error('Container ' + containerId + ': ' + s.status_code + ' ' + (s.status || ''));
    }
    Utilities.sleep(sleepMs);
  }
  throw new Error('Το container ' + containerId + ' δεν ετοιμάστηκε εγκαίρως');
}

function buildContainer_(item) {
  const ig = igUserId_(item.account);
  const cap = item.caption || '';
  switch (item.type) {
    case 'IMAGE':
      return createContainer_(ig, { image_url: item.images[0], caption: cap });
    case 'STORY':
      return item.video
        ? createContainer_(ig, { video_url: item.video, media_type: 'STORIES' })
        : createContainer_(ig, { image_url: item.images[0], media_type: 'STORIES' });
    case 'CAROUSEL': {
      const kids = item.images.map(function (u) { return createContainer_(ig, { image_url: u, is_carousel_item: 'true' }); });
      kids.forEach(function (k) { waitReady_(k); });
      return createContainer_(ig, { media_type: 'CAROUSEL', children: kids.join(','), caption: cap });
    }
    case 'REEL': {
      const p = { media_type: 'REELS', video_url: item.video, caption: cap, share_to_feed: 'true' };
      if (item.cover) p.cover_url = item.cover;
      return createContainer_(ig, p);
    }
    default:
      throw new Error('Άγνωστος τύπος: ' + item.type);
  }
}

function publishItem_(item) {
  const ig = igUserId_(item.account);
  const c = buildContainer_(item);
  const isVideo = item.type === 'REEL' || !!item.video;
  waitReady_(c, isVideo ? 50 : 20, isVideo ? 5000 : 3000);
  const r = api_('post', ig + '/media_publish', { creation_id: c });
  let link = '';
  try { link = api_('get', r.id, { fields: 'permalink' }).permalink || ''; } catch (e) { /* stories δεν έχουν πάντα permalink */ }
  return { mediaId: r.id, permalink: link };
}

// ------------------------------------------------------------------ main loop (trigger)
function run() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const q = fetchQueue_();
    if (prop_('PAUSED', 'false') === 'true') { syncSheet_(q); return; }
    const S = P_();
    const now = new Date();
    q.items.forEach(function (item) {
      if (S.getProperty('done_' + item.id) || S.getProperty('skip_' + item.id)) return;
      const when = new Date(item.publish_at);
      if (when > now) return;
      const late = (now - when) / 60000;
      if (late > CFG.LATE_LIMIT_MIN) {
        S.setProperty('skip_' + item.id, now.toISOString());
        log_(item, 'ΠΑΡΑΛΕΙΦΘΗΚΕ', 'Καθυστέρηση ' + Math.round(late) + ' λεπτά');
        notify_('Παραλείφθηκε ' + item.id, 'Το ' + item.id + ' δεν δημοσιεύτηκε γιατί πέρασαν ' + Math.round(late) + ' λεπτά από την ώρα του.');
        return;
      }
      try {
        const r = publishItem_(item);
        S.setProperty('done_' + item.id, JSON.stringify({ at: new Date().toISOString(), media: r.mediaId, link: r.permalink }));
        S.deleteProperty('fail_' + item.id);
        log_(item, 'ΔΗΜΟΣΙΕΥΤΗΚΕ', r.permalink || r.mediaId);
      } catch (e) {
        const n = Number(S.getProperty('fail_' + item.id) || 0) + 1;
        S.setProperty('fail_' + item.id, String(n));
        log_(item, 'ΣΦΑΛΜΑ ' + n + '/' + CFG.MAX_FAILS, e.message);
        if (n >= CFG.MAX_FAILS) {
          S.setProperty('skip_' + item.id, now.toISOString());
          notify_('Απέτυχε ' + item.id, 'Το ' + item.id + ' απέτυχε ' + n + ' φορές και δεν θα ξαναδοκιμαστεί.\n\n' + e.message);
        }
      }
    });
    syncSheet_(q);
  } catch (e) {
    notify_('Σφάλμα εκτέλεσης', e.message);
    throw e;
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------------ sheet view
function sheet_(name, header) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function log_(item, status, detail) {
  const sh = sheet_('Ιστορικό', ['Χρόνος', 'ID', 'Λογαριασμός', 'Τύπος', 'Κατάσταση', 'Λεπτομέρειες']);
  sh.appendRow([new Date(), item.id, item.account, item.type, status, String(detail || '').slice(0, 500)]);
}

function syncSheet_(q) {
  const sh = sheet_('Ουρά', ['Ώρα δημοσίευσης', 'Λογαριασμός', 'Τύπος', 'Λεζάντα', 'Αρχεία', 'Κατάσταση', 'Link', 'ID']);
  const S = P_();
  const rows = q.items.map(function (it) {
    const done = S.getProperty('done_' + it.id), skip = S.getProperty('skip_' + it.id), fail = S.getProperty('fail_' + it.id);
    let status = 'Σε αναμονή', link = '';
    if (done) { status = 'Δημοσιεύτηκε'; try { link = JSON.parse(done).link || ''; } catch (e) {} }
    else if (skip) status = 'Δεν δημοσιεύτηκε';
    else if (fail) status = 'Σφάλμα (' + fail + ')';
    const files = (it.images || []).length + (it.video ? 1 : 0);
    return [new Date(it.publish_at), it.account, it.type, String(it.caption || '').slice(0, 120), files, status, link, it.id];
  });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 8).clearContent();
  if (rows.length) {
    sh.getRange(2, 1, rows.length, 8).setValues(rows);
    sh.getRange(2, 1, rows.length, 1).setNumberFormat('ddd dd/MM HH:mm');
  }
}

// ------------------------------------------------------------------ manual helpers
function findInstagramIds() {
  try {
    const r = api_('get', 'me/accounts', { fields: 'name,instagram_business_account{id,username}' });
    (r.data || []).forEach(function (p) {
      const ig = p.instagram_business_account;
      console.log(p.name + ' → ' + (ig ? ig.username + '  ID: ' + ig.id : '(χωρίς Instagram)'));
    });
  } catch (e) {
    console.log('me/accounts: ' + e.message);
    const r = api_('get', 'me', { fields: 'name,instagram_business_account{id,username}' });
    const ig = r.instagram_business_account;
    console.log(r.name + ' → ' + (ig ? ig.username + '  ID: ' + ig.id : '(χωρίς Instagram)'));
  }
}

function checkSetup() {
  ['NDT', 'AMAZE'].forEach(function (acc) {
    const id = igUserId_(acc);
    const u = api_('get', id, { fields: 'username,followers_count' });
    let lim = '';
    try {
      const l = api_('get', id + '/content_publishing_limit', { fields: 'quota_usage,config' });
      lim = JSON.stringify(l.data || l);
    } catch (e) { lim = '(όριο: ' + e.message + ')'; }
    console.log(acc + ': @' + u.username + ' (' + u.followers_count + ' ακόλουθοι) ' + lim);
  });
  const q = fetchQueue_();
  let bad = 0;
  q.items.forEach(function (it) {
    (it.images || []).concat(it.video ? [it.video] : []).forEach(function (url) {
      const r = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true, followRedirects: true });
      const ok = r.getResponseCode() === 200;
      if (!ok) { bad++; console.log('ΛΑΘΟΣ ' + r.getResponseCode() + ': ' + url); }
    });
  });
  console.log('Ουρά: ' + q.items.length + ' δημοσιεύσεις, προβληματικά αρχεία: ' + bad);
  syncSheet_(q);
}

function dryRun() {
  const q = fetchQueue_();
  const S = P_();
  const now = new Date();
  const next = q.items.filter(function (it) { return !S.getProperty('done_' + it.id) && new Date(it.publish_at) > now; })[0];
  if (!next) { console.log('Δεν υπάρχει επόμενη δημοσίευση στην ουρά.'); return; }
  const ig = igUserId_(next.account);
  const c = next.type === 'STORY'
    ? createContainer_(ig, { image_url: next.images[0], media_type: 'STORIES' })
    : createContainer_(ig, { image_url: next.images[0], caption: 'dry run' });
  waitReady_(c);
  console.log('OK: το Instagram δέχτηκε την εικόνα του ' + next.id + ' (container ' + c + '). ΔΕΝ δημοσιεύτηκε τίποτα.');
}

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'run') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('run').timeBased().everyMinutes(CFG.EVERY_MIN).create();
  sheet_('Ιστορικό', ['Χρόνος', 'ID', 'Λογαριασμός', 'Τύπος', 'Κατάσταση', 'Λεπτομέρειες']);
  syncSheet_(fetchQueue_());
  console.log('Έτοιμο: ο έλεγχος τρέχει κάθε ' + CFG.EVERY_MIN + ' λεπτά.');
}

function pause() { P_().setProperty('PAUSED', 'true'); console.log('Παύση: δεν θα δημοσιευτεί τίποτα μέχρι resume().'); }
function resume() { P_().setProperty('PAUSED', 'false'); console.log('Συνέχεια δημοσιεύσεων.'); }
