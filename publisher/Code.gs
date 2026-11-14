/**
 * IG Publisher — NDT & Amaze DJs
 *
 * Δημοσιεύει στο Instagram (post, carousel, story, reel) μέσω του Instagram Graph API
 * και, αν έχει οριστεί σελίδα, τα ίδια και στη σελίδα Facebook (post, πολλαπλές φωτογραφίες, story, reel),
 * σύμφωνα με το queue.json του repo malamaspe/social-media-assets.
 * Ανεξάρτητο από το NDT OPS: δικό του project, δικό του Sheet, δικά του Script Properties.
 *
 * Script Properties (Project Settings → Script Properties):
 *   Token, ένας από τους δύο τρόπους:
 *   TOKEN_NDT       Page access token της σελίδας NDT (μόνιμο, από long-lived user token)
 *   TOKEN_AMAZE     Page access token της σελίδας Amaze
 *   IG_TOKEN        ή ένα token (π.χ. System User) για όλα, με instagram_basic, instagram_content_publish,
 *                   pages_show_list, pages_read_engagement, pages_manage_posts, business_management
 *                   (αν υπάρχει TOKEN_<brand>, προτιμάται εκείνο)
 *   IG_USER_NDT     Instagram Business Account ID του newdjsteam
 *   IG_USER_AMAZE   Instagram Business Account ID του amaze.djs
 *   FB_PAGE_NDT     Facebook Page ID της NDT   (κενό = όχι Facebook για την NDT)
 *   FB_PAGE_AMAZE   Facebook Page ID της Amaze (κενό = όχι Facebook για την Amaze)
 *   FB_ENABLED      false για να σταματήσει μόνο το Facebook
 *   GRAPH_VERSION   προαιρετικό, π.χ. v23.0 (κενό = η έκδοση του Meta app)
 *   PAUSED          true για παύση όλων των δημοσιεύσεων
 *
 * Συναρτήσεις που τρέχεις με το χέρι:
 *   findInstagramIds()  βρίσκει και αποθηκεύει μόνο του τα IDs Instagram και σελίδων Facebook
 *   checkSetup()        ελέγχει token, δικαιώματα, λογαριασμούς, ουρά και αρχεία
 *   dryRun()            δοκιμή στο επόμενο post ΧΩΡΙΣ να δημοσιεύσει τίποτα
 *   dryRunReel()        δοκιμή στο επόμενο reel (Instagram) ΧΩΡΙΣ να δημοσιεύσει τίποτα
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

function token_(account) {
  const t = (account && prop_('TOKEN_' + account, '')) || prop_('IG_TOKEN', '');
  if (!t) throw new Error('Λείπει token: βάλε TOKEN_' + (account || 'NDT / TOKEN_AMAZE') + ' ή IG_TOKEN στις Ιδιότητες σεναρίου');
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

function api_(method, path, params, tok) {
  const p = Object.assign({}, params || {}, { access_token: tok || token_() });
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

// ------------------------------------------------------------------ Instagram
function createContainer_(igId, params, tok) {
  return api_('post', igId + '/media', params, tok).id;
}

function waitReady_(containerId, tries, sleepMs, tok) {
  tries = tries || 20; sleepMs = sleepMs || 3000;
  for (let i = 0; i < tries; i++) {
    const s = api_('get', containerId, { fields: 'status_code,status' }, tok);
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
  const tok = token_(item.account);
  const cap = item.caption || '';
  switch (item.type) {
    case 'IMAGE':
      return createContainer_(ig, { image_url: item.images[0], caption: cap }, tok);
    case 'STORY':
      return item.video
        ? createContainer_(ig, { video_url: item.video, media_type: 'STORIES' }, tok)
        : createContainer_(ig, { image_url: item.images[0], media_type: 'STORIES' }, tok);
    case 'CAROUSEL': {
      const kids = item.images.map(function (u) { return createContainer_(ig, { image_url: u, is_carousel_item: 'true' }, tok); });
      kids.forEach(function (k) { waitReady_(k, 0, 0, tok); });
      return createContainer_(ig, { media_type: 'CAROUSEL', children: kids.join(','), caption: cap }, tok);
    }
    case 'REEL': {
      const p = { media_type: 'REELS', video_url: item.video, caption: cap, share_to_feed: 'true' };
      if (item.cover) p.cover_url = item.cover;
      return createContainer_(ig, p, tok);
    }
    default:
      throw new Error('Άγνωστος τύπος: ' + item.type);
  }
}

function publishItem_(item) {
  const ig = igUserId_(item.account);
  const tok = token_(item.account);
  const c = buildContainer_(item);
  const isVideo = item.type === 'REEL' || !!item.video;
  waitReady_(c, isVideo ? 50 : 20, isVideo ? 5000 : 3000, tok);
  const r = api_('post', ig + '/media_publish', { creation_id: c }, tok);
  let link = '';
  try { link = api_('get', r.id, { fields: 'permalink' }, tok).permalink || ''; } catch (e) { /* stories δεν έχουν πάντα permalink */ }
  return { mediaId: r.id, permalink: link };
}

// ------------------------------------------------------------------ Facebook
function fbPageId_(account) { return prop_('FB_PAGE_' + account, ''); }

function fbEnabled_(item) {
  if (prop_('FB_ENABLED', 'true') === 'false') return false;
  if (!fbPageId_(item.account)) return false;
  return !item.platforms || item.platforms.indexOf('facebook') >= 0;
}

function pageToken_(pageId, account) {
  const own = account ? prop_('TOKEN_' + account, '') : '';
  if (own) return own;   // TOKEN_<brand> είναι ήδη token της σελίδας
  const cache = CacheService.getScriptCache();
  const k = 'pt_' + pageId;
  const c = cache.get(k);
  if (c) return c;
  let t = '';
  try { t = api_('get', pageId, { fields: 'access_token' }).access_token || ''; } catch (e) { console.log('page token: ' + e.message); }
  if (!t) t = token_();
  cache.put(k, t, 21600);
  return t;
}

// Βίντεο στο Facebook (reel ή video story): start → upload από URL → finish
function fbVideo_(pid, pt, edge, videoUrl, desc) {
  const st = api_('post', pid + '/' + edge, { upload_phase: 'start' }, pt);
  const up = UrlFetchApp.fetch(st.upload_url, {
    method: 'post', muteHttpExceptions: true,
    headers: { Authorization: 'OAuth ' + pt, file_url: videoUrl },
  });
  if (up.getResponseCode() >= 400) throw new Error('FB upload ' + up.getResponseCode() + ': ' + up.getContentText());
  const fin = { upload_phase: 'finish', video_id: st.video_id };
  if (edge === 'video_reels') { fin.video_state = 'PUBLISHED'; fin.description = desc || ''; }
  const r = api_('post', pid + '/' + edge, fin, pt);
  return { id: r.post_id || st.video_id, link: '' };
}

function publishFb_(item) {
  const pid = fbPageId_(item.account);
  const pt = pageToken_(pid, item.account);
  const cap = item.fb_caption || item.caption || '';
  switch (item.type) {
    case 'IMAGE': {
      const r = api_('post', pid + '/photos', { url: item.images[0], message: cap, published: 'true' }, pt);
      return { id: r.post_id || r.id, link: 'https://www.facebook.com/' + (r.post_id || r.id) };
    }
    case 'CAROUSEL': {
      const p = { message: cap };
      item.images.forEach(function (u, i) {
        const ph = api_('post', pid + '/photos', { url: u, published: 'false' }, pt);
        p['attached_media[' + i + ']'] = JSON.stringify({ media_fbid: ph.id });
      });
      const r = api_('post', pid + '/feed', p, pt);
      return { id: r.id, link: 'https://www.facebook.com/' + r.id };
    }
    case 'STORY': {
      if (item.video) return fbVideo_(pid, pt, 'video_stories', item.video, '');
      const ph = api_('post', pid + '/photos', { url: item.images[0], published: 'false' }, pt);
      const r = api_('post', pid + '/photo_stories', { photo_id: ph.id }, pt);
      return { id: r.post_id || ph.id, link: '' };
    }
    case 'REEL':
      return fbVideo_(pid, pt, 'video_reels', item.video, cap);
    default:
      throw new Error('Άγνωστος τύπος: ' + item.type);
  }
}

// ------------------------------------------------------------------ main loop (trigger)
// Instagram και Facebook παρακολουθούνται χωριστά: αν αποτύχει το ένα, το άλλο δεν ξαναδημοσιεύεται.
// Κλειδιά: Instagram done_/fail_/skip_<id>, Facebook fbdone_/fbfail_/fbskip_<id>
function targets_(item) {
  const t = [{ pre: '', label: 'Instagram', fn: publishItem_, link: function (r) { return r.permalink || r.mediaId; } }];
  if (fbEnabled_(item)) t.push({ pre: 'fb', label: 'Facebook', fn: publishFb_, link: function (r) { return r.link || r.id; } });
  return t;
}

function run() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const q = fetchQueue_();
    if (prop_('PAUSED', 'false') === 'true') { syncSheet_(q); return; }
    const S = P_();
    const now = new Date();
    q.items.forEach(function (item) {
      const when = new Date(item.publish_at);
      if (when > now) return;
      const late = (now - when) / 60000;
      targets_(item).forEach(function (t) {
        const kd = t.pre + 'done_' + item.id, ks = t.pre + 'skip_' + item.id, kf = t.pre + 'fail_' + item.id;
        if (S.getProperty(kd) || S.getProperty(ks)) return;
        if (late > CFG.LATE_LIMIT_MIN) {
          S.setProperty(ks, now.toISOString());
          log_(item, t.label + ': ΠΑΡΑΛΕΙΦΘΗΚΕ', 'Καθυστέρηση ' + Math.round(late) + ' λεπτά');
          notify_('Παραλείφθηκε ' + item.id + ' (' + t.label + ')', 'Το ' + item.id + ' δεν δημοσιεύτηκε στο ' + t.label + ' γιατί πέρασαν ' + Math.round(late) + ' λεπτά από την ώρα του.');
          return;
        }
        try {
          const r = t.fn(item);
          const link = t.link(r);
          S.setProperty(kd, JSON.stringify({ at: new Date().toISOString(), link: link }));
          S.deleteProperty(kf);
          log_(item, t.label + ': ΔΗΜΟΣΙΕΥΤΗΚΕ', link);
        } catch (e) {
          const n = Number(S.getProperty(kf) || 0) + 1;
          S.setProperty(kf, String(n));
          log_(item, t.label + ': ΣΦΑΛΜΑ ' + n + '/' + CFG.MAX_FAILS, e.message);
          if (n >= CFG.MAX_FAILS) {
            S.setProperty(ks, now.toISOString());
            notify_('Απέτυχε ' + item.id + ' (' + t.label + ')', 'Το ' + item.id + ' απέτυχε ' + n + ' φορές στο ' + t.label + ' και δεν θα ξαναδοκιμαστεί.\n\n' + e.message);
          }
        }
      });
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

function status_(S, pre, id) {
  const done = S.getProperty(pre + 'done_' + id), skip = S.getProperty(pre + 'skip_' + id), fail = S.getProperty(pre + 'fail_' + id);
  if (done) { let l = ''; try { l = JSON.parse(done).link || ''; } catch (e) {} return ['Δημοσιεύτηκε', l]; }
  if (skip) return ['Δεν δημοσιεύτηκε', ''];
  if (fail) return ['Σφάλμα (' + fail + ')', ''];
  return ['Σε αναμονή', ''];
}

function syncSheet_(q) {
  const H = ['Ώρα δημοσίευσης', 'Λογαριασμός', 'Τύπος', 'Λεζάντα', 'Αρχεία', 'Instagram', 'Link Instagram', 'Facebook', 'Link Facebook', 'ID'];
  const sh = sheet_('Ουρά', H);
  sh.getRange(1, 1, 1, H.length).setValues([H]).setFontWeight('bold');
  const S = P_();
  const rows = q.items.map(function (it) {
    const ig = status_(S, '', it.id);
    const fb = fbEnabled_(it) ? status_(S, 'fb', it.id) : ['—', ''];
    const files = (it.images || []).length + (it.video ? 1 : 0);
    return [new Date(it.publish_at), it.account, it.type, String(it.caption || '').slice(0, 120), files, ig[0], ig[1], fb[0], fb[1], it.id];
  });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, H.length).clearContent();
  if (rows.length) {
    sh.getRange(2, 1, rows.length, H.length).setValues(rows);
    sh.getRange(2, 1, rows.length, 1).setNumberFormat('ddd dd/MM HH:mm');
  }
}

// ------------------------------------------------------------------ manual helpers
const IG_NAMES_ = { newdjsteam: 'NDT', 'amaze.djs': 'AMAZE' };

function saveIds_(acc, pageId, ig) {
  P_().setProperty('FB_PAGE_' + acc, String(pageId));
  if (ig) P_().setProperty('IG_USER_' + acc, String(ig.id));
  console.log(acc + ': αποθηκεύτηκαν FB_PAGE_' + acc + ' = ' + pageId + (ig ? ' και IG_USER_' + acc + ' = ' + ig.id + ' (@' + ig.username + ')' : ' (η σελίδα δεν έχει συνδεδεμένο Instagram!)'));
}

function findInstagramIds() {
  let found = 0;
  ['NDT', 'AMAZE'].forEach(function (acc) {
    const t = prop_('TOKEN_' + acc, '');
    if (!t) return;
    const r = api_('get', 'me', { fields: 'id,name,instagram_business_account{id,username}' }, t);
    console.log('TOKEN_' + acc + ' → σελίδα «' + r.name + '»');
    saveIds_(acc, r.id, r.instagram_business_account); found++;
  });
  if (prop_('IG_TOKEN', '')) {
    const r = api_('get', 'me/accounts', { fields: 'name,id,instagram_business_account{id,username}' });
    (r.data || []).forEach(function (p) {
      const ig = p.instagram_business_account;
      const acc = ig ? IG_NAMES_[ig.username] : null;
      console.log(p.name + ' (Page ID ' + p.id + ') → ' + (ig ? '@' + ig.username : 'χωρίς Instagram'));
      if (acc && !prop_('TOKEN_' + acc, '')) { saveIds_(acc, p.id, ig); found++; }
    });
  }
  console.log(found ? 'Έτοιμο. Τρέξε τώρα το checkSetup.' : 'Δεν βρέθηκε token: βάλε TOKEN_NDT / TOKEN_AMAZE (ή IG_TOKEN) στις Ιδιότητες σεναρίου.');
}

function tokenInfo_(label, t) {
  try {
    const d = api_('get', 'debug_token', { input_token: t }, t).data || {};
    const need = ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement', 'pages_manage_posts'];
    const miss = need.filter(function (n) { return (d.scopes || []).indexOf(n) < 0; });
    const exp = !d.expires_at ? 'δεν λήγει' : 'λήγει ' + new Date(d.expires_at * 1000).toLocaleDateString('el-GR');
    console.log(label + ': ' + (d.type || '?') + ', ' + exp + ', ' + (miss.length ? 'ΛΕΙΠΟΥΝ ' + miss.join(', ') : 'δικαιώματα εντάξει') + (d.is_valid === false ? ', ΜΗ ΕΓΚΥΡΟ' : ''));
  } catch (e) { console.log(label + ': δεν ελέγχθηκε (' + e.message + ')'); }
}

function checkSetup() {
  ['NDT', 'AMAZE'].forEach(function (acc) { const t = prop_('TOKEN_' + acc, ''); if (t) tokenInfo_('TOKEN_' + acc, t); });
  if (prop_('IG_TOKEN', '')) tokenInfo_('IG_TOKEN', prop_('IG_TOKEN', ''));

  ['NDT', 'AMAZE'].forEach(function (acc) {
    const id = igUserId_(acc);
    const tok = token_(acc);
    const u = api_('get', id, { fields: 'username,followers_count' }, tok);
    let lim = '';
    try {
      const l = api_('get', id + '/content_publishing_limit', { fields: 'quota_usage,config' }, tok);
      lim = JSON.stringify(l.data || l);
    } catch (e) { lim = '(όριο: ' + e.message + ')'; }
    console.log(acc + ' Instagram: @' + u.username + ' (' + u.followers_count + ' ακόλουθοι) ' + lim);
    const pid = fbPageId_(acc);
    if (!pid) { console.log(acc + ' Facebook: δεν έχει οριστεί FB_PAGE_' + acc + ' (μόνο Instagram)'); return; }
    try {
      const pg = api_('get', pid, { fields: 'name,followers_count' }, pageToken_(pid, acc));
      console.log(acc + ' Facebook: ' + pg.name + ' (' + (pg.followers_count || 0) + ' ακόλουθοι)');
    } catch (e) { console.log(acc + ' Facebook: ΣΦΑΛΜΑ ' + e.message); }
  });

  const q = fetchQueue_();
  let bad = 0;
  q.items.forEach(function (it) {
    (it.images || []).concat(it.video ? [it.video] : []).forEach(function (url) {
      const r = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true, followRedirects: true });
      if (r.getResponseCode() !== 200) { bad++; console.log('ΛΑΘΟΣ ' + r.getResponseCode() + ': ' + url); }
    });
  });
  console.log('Ουρά: ' + q.items.length + ' δημοσιεύσεις, προβληματικά αρχεία: ' + bad);
  syncSheet_(q);
}

function dryRun() {
  const q = fetchQueue_();
  const S = P_();
  const now = new Date();
  ['NDT', 'AMAZE'].forEach(function (acc) {
    const next = q.items.filter(function (it) {
      return it.account === acc && !S.getProperty('done_' + it.id) && new Date(it.publish_at) > now && it.images && it.images.length;
    })[0];
    if (!next) { console.log(acc + ': δεν υπάρχει επόμενη δημοσίευση με εικόνα.'); return; }
    const ig = igUserId_(acc), tok = token_(acc);
    const c = next.type === 'STORY'
      ? createContainer_(ig, { image_url: next.images[0], media_type: 'STORIES' }, tok)
      : createContainer_(ig, { image_url: next.images[0], caption: 'dry run' }, tok);
    waitReady_(c, 0, 0, tok);
    console.log(acc + ' Instagram OK: δέχτηκε την εικόνα του ' + next.id + '. ΔΕΝ δημοσιεύτηκε τίποτα.');
    if (fbEnabled_(next)) {
      const pid = fbPageId_(acc), pt = pageToken_(pid, acc);
      const ph = api_('post', pid + '/photos', { url: next.images[0], published: 'false' }, pt);
      try { api_('post', ph.id, { method: 'delete' }, pt); } catch (e) { /* μένει αδημοσίευτη, δεν φαίνεται πουθενά */ }
      console.log(acc + ' Facebook OK: η σελίδα δέχτηκε την εικόνα (αδημοσίευτη, σβήστηκε). ΔΕΝ δημοσιεύτηκε τίποτα.');
    }
  });
}

function dryRunReel() {
  const q = fetchQueue_();
  const now = new Date();
  const next = q.items.filter(function (it) { return it.type === 'REEL' && new Date(it.publish_at) > now; })[0];
  if (!next) { console.log('Δεν υπάρχει επόμενο reel στην ουρά.'); return; }
  const ig = igUserId_(next.account), tok = token_(next.account);
  const p = { media_type: 'REELS', video_url: next.video, caption: 'dry run', share_to_feed: 'true' };
  if (next.cover) p.cover_url = next.cover;
  const c = createContainer_(ig, p, tok);
  waitReady_(c, 50, 5000, tok);
  console.log(next.account + ' Instagram OK: το reel ' + next.id + ' επεξεργάστηκε σωστά. ΔΕΝ δημοσιεύτηκε τίποτα.');
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
