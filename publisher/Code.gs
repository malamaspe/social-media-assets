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
 *                   και instagram_manage_insights (για τις «Ώρες κοινού»)
 *                   (αν υπάρχει TOKEN_<brand>, προτιμάται εκείνο)
 *   IG_USER_NDT     Instagram Business Account ID του newdjsteam
 *   IG_USER_AMAZE   Instagram Business Account ID του amaze.djs
 *   FB_PAGE_NDT     Facebook Page ID της NDT   (κενό = όχι Facebook για την NDT)
 *   FB_PAGE_AMAZE   Facebook Page ID της Amaze (κενό = όχι Facebook για την Amaze)
 *   FB_ENABLED      false για να σταματήσει μόνο το Facebook
 *   GRAPH_VERSION   προαιρετικό, π.χ. v23.0 (κενό = η έκδοση του Meta app)
 *   PAUSED          true για παύση όλων των δημοσιεύσεων
 *   TRIAL_REELS     false για να βγαίνουν τα reels κανονικά (προεπιλογή: δοκιμαστικά / trial reels)
 *   TRIAL_STRATEGY  SS_PERFORMANCE (προεπιλογή: πάει αυτόματα και στους followers αν πάει καλά) ή MANUAL
 *   REELS_FOLDER_ID το βρίσκει/φτιάχνει μόνο του (φάκελος «REELS» μέσα στο «ΥΛΙΚΟ SOCIAL MEDIA»)
 *   CREW_TAGS_NDT   usernames του crew (χωρίς @, με κόμμα) που μπαίνουν ως tags σε ΚΑΘΕ story της NDT στο Instagram,
 *   CREW_TAGS_AMAZE ώστε να τους έρχεται ειδοποίηση και να κάνουν repost. Κενό = χωρίς tags.
 *   CREW_MAP        όνομα=username για tags ΜΟΝΟ σε όσους φαίνονται σε post, π.χ. «Κώστας=kostas.ndt, Ιγνάτης=ignatis»
 *                   (η ουρά γράφει μόνο το μικρό όνομα στο "people" του post· τα usernames μένουν εδώ)
 *   REEL_STORY      false για να ΜΗΝ βγαίνει κάθε reel και ως story (προεπιλογή: βγαίνει, 15′ μετά το reel)
 *   MANUAL_REEL_STORY false για να ΜΗΝ μπαίνουν σε story τα reels που ανεβάζετε εσείς από την εφαρμογή
 *   LI_TOKEN        access token του LinkedIn (προσωπικό προφίλ· scopes openid, profile, w_member_social),
 *                   μπαίνει από το μενού «⚙️ Publisher → LinkedIn: νέο token…» του Sheet.
 *                   Λήγει στις 60 ημέρες: έρχεται email στις 50, 57 και 59 ημέρες. Αλλάζεις μόνο αυτό· τα υπόλοιπα
 *                   LI_* (LI_AUTHOR, LI_NAME, LI_SINCE, LI_TOKEN_AT) τα γράφει μόνο του το script.
 *   LI_ENABLED      false για να σταματήσει μόνο το LinkedIn
 *   LI_VERSION      προαιρετικό, έκδοση LinkedIn API (YYYYMM, προεπιλογή στο CFG)
 *                   Στο LinkedIn πάνε ΜΟΝΟ τα posts του linkedin.json (δικά τους κείμενα), ποτέ τα posts του queue.json.
 *
 * Συναρτήσεις που τρέχεις με το χέρι:
 *   findInstagramIds()  βρίσκει και αποθηκεύει μόνο του τα IDs Instagram και σελίδων Facebook
 *   checkSetup()        ελέγχει token, δικαιώματα, λογαριασμούς, ουρά και αρχεία
 *   dryRun()            δοκιμή στο επόμενο post ΧΩΡΙΣ να δημοσιεύσει τίποτα
 *   dryRunReel()        δοκιμή στο επόμενο reel κάθε brand (Instagram) ΧΩΡΙΣ να δημοσιεύσει τίποτα
 *   checkCrewTags()     ελέγχει τα usernames του CREW_TAGS_* και του CREW_MAP ΧΩΡΙΣ να δημοσιεύσει τίποτα
 *   syncReelsNow()      αντιγράφει τώρα τα reels της ουράς στο Drive (ΥΛΙΚΟ SOCIAL MEDIA/REELS), με .txt για
 *                       YouTube Shorts / TikTok. Γίνεται και αυτόματα σε κάθε εκτέλεση του run().
 *   linkedinSetup()     μετά το LI_TOKEN: βρίσκει το προφίλ σου και δείχνει τα επόμενα posts LinkedIn (δεν δημοσιεύει)
 *   updateAudienceHours() διαβάζει τώρα τις ώρες που το κοινό είναι online (και βάζει τον καθημερινό έλεγχο 04:00)
 *
 * Μενού «⚙️ Publisher» στο Sheet (onOpen): «LinkedIn: νέο token…», «Αλλαγή ρύθμισης…», «Δες τις ρυθμίσεις»,
 * «Ώρες κοινού: ενημέρωση τώρα».
 * Χρειάζεται επειδή, με πάνω από 50 Ιδιότητες σεναρίου, η οθόνη του Apps Script τις δείχνει μόνο για ανάγνωση.
 *   setup()             βάζει τον αυτόματο έλεγχο κάθε 10 λεπτά
 *   pause() / resume()  παύση / συνέχεια
 */

const CFG = {
  QUEUE_URL: 'https://raw.githubusercontent.com/malamaspe/social-media-assets/main/queue.json',
  GRAPH: 'https://graph.facebook.com',
  LATE_LIMIT_MIN: 180,   // αν κάτι καθυστερήσει πάνω από 3 ώρες, δεν δημοσιεύεται (έρχεται email)
  MAX_FAILS: 3,          // μετά από 3 αποτυχίες σταματάει να ξαναδοκιμάζει (έρχεται email)
  EVERY_MIN: 10,
  REEL_STORY_DELAY_MIN: 15,   // το story ενός reel βγαίνει τόσα λεπτά μετά το reel
  MANUAL_REEL_MIN_AGE: 10,    // reels που ανεβάσατε εσείς: story όταν περάσουν 10′ ...
  MANUAL_REEL_MAX_AGE: 180,   // ... και όχι αν έχουν περάσει πάνω από 3 ώρες
  LI_QUEUE_URL: 'https://raw.githubusercontent.com/malamaspe/social-media-assets/main/linkedin.json',
  LI_API: 'https://api.linkedin.com',
  LI_VERSION: '202611',       // οι εκδόσεις του LinkedIn ισχύουν περίπου 1 χρόνο· αλλάζει με LI_VERSION
  LI_TOKEN_DAYS: 60,
  LI_MAX_CHARS: 3000,
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
  q.items = withReelStories_((q.items || []).concat(liQueue_()));
  q.items.sort(function (a, b) { return new Date(a.publish_at) - new Date(b.publish_at); });
  return q;
}

// Κάθε reel της ουράς βγαίνει και ως story (το ίδιο βίντεο), REEL_STORY_DELAY_MIN λεπτά μετά.
// Όχι αν το reel έχει "story": false ή αν REEL_STORY = false. Μόνο για reels μετά την ενεργοποίηση (REEL_STORY_SINCE).
function withReelStories_(items) {
  if (prop_('REEL_STORY', 'true') === 'false') return items;
  let since = prop_('REEL_STORY_SINCE', '');
  if (!since) { since = new Date().toISOString(); P_().setProperty('REEL_STORY_SINCE', since); }
  const have = {};
  items.forEach(function (it) { have[it.id] = true; });
  const extra = [];
  items.forEach(function (it) {
    if (it.type !== 'REEL' || it.story === false || !it.video || !igEnabled_(it)) return;
    if (new Date(it.publish_at) < new Date(since)) return;
    const id = String(it.id).replace(/-post$/, '') + '-reelstory';
    if (have[id]) return;
    extra.push({
      id: id, account: it.account, type: 'STORY', video: it.video, platforms: it.platforms, from_reel: it.id,
      caption: '(story από το reel ' + it.id + ')',
      publish_at: new Date(new Date(it.publish_at).getTime() + CFG.REEL_STORY_DELAY_MIN * 60000).toISOString(),
    });
  });
  return items.concat(extra);
}

// ------------------------------------------------------------------ Instagram
// Tags του crew σε κάθε story: Script Property CREW_TAGS_<brand> = «user1, user2» (χωρίς @).
// Ένα item μπορεί να έχει δικά του "tags" ή "crew": false.
function crewTags_(item) {
  if (item.type !== 'STORY' || item.crew === false || item.noTags) return [];
  const raw = item.tags || prop_('CREW_TAGS_' + item.account, '');
  const seen = {};
  return String(raw).split(/[\s,;]+/)
    .map(function (u) { return u.replace(/^@/, '').trim(); })
    .filter(function (u) { if (!u || seen[u.toLowerCase()]) return false; seen[u.toLowerCase()] = true; return true; })
    .slice(0, 20);
}

function storyParams_(item, tags) {
  const p = item.video ? { video_url: item.video, media_type: 'STORIES' } : { image_url: item.images[0], media_type: 'STORIES' };
  if (tags && tags.length) p.user_tags = JSON.stringify(tags.map(function (u) { return { username: u }; }));
  return p;
}

// Tags σε posts ΜΟΝΟ σε όσους φαίνονται: στο item της ουράς
//   "people": [{ "name": "Κώστας", "slide": 0, "x": 0.6, "y": 0.3 }]
// slide = θέση στο carousel (0 = πρώτη), x/y = σημείο πάνω στο άτομο (0–1, από αριστερά/πάνω).
// Στις φωτογραφίες τα ονόματα ΔΕΝ φαίνονται πάνω στην εικόνα (μόνο ένα μικρό εικονίδιο, εμφανίζονται με πάτημα).
// Στα reels δεν υπάρχουν x/y. Τα ονόματα γίνονται usernames από το CREW_MAP.
function norm_(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }

function crewMap_() {
  const m = {};
  String(prop_('CREW_MAP', '')).split(/[,;\n]+/).forEach(function (pair) {
    const i = pair.indexOf('=');
    if (i < 0) return;
    const k = norm_(pair.slice(0, i)), v = pair.slice(i + 1).replace(/^\s*@/, '').trim();
    if (k && v) m[k] = v;
  });
  return m;
}

function peopleTags_(item, slide) {
  if (item.noTags || !item.people || !item.people.length || item.type === 'STORY') return [];
  const map = crewMap_();
  const cl = function (v, d) { v = Number(v); return isFinite(v) ? Math.min(1, Math.max(0, v)) : d; };
  const out = [], seen = {};
  item.people.forEach(function (p) {
    if (Number(p.slide || 0) !== slide) return;
    const u = map[norm_(p.name)];
    if (!u) { console.log('CREW_MAP: δεν υπάρχει username για «' + p.name + '» (' + item.id + ')'); return; }
    if (seen[u]) return;
    seen[u] = true;
    const t = { username: u };
    if (item.type !== 'REEL') { t.x = cl(p.x, 0.5); t.y = cl(p.y, 0.5); }
    out.push(t);
  });
  return out.slice(0, 20);
}

function withTags_(params, tags) {
  if (tags && tags.length) params.user_tags = JSON.stringify(tags);
  return params;
}

// Είδος σφάλματος από το μήνυμα του api_ («Graph API 400: … [code X, subcode Y]»)
function isTransient_(msg) {
  return /\[code -2,|subcode 2207003\]|\[code 2,|\[code 4,|Timeout|temporarily unavailable|unexpected error/i.test(String(msg));
}
function isTagError_(msg) {
  return /\[code 110,|\[code 210,|subcode 2207018\]|subcode 2207066\]|subcode 2207040\]|Invalid user id|User not visible/i.test(String(msg));
}

function hasTags_(item) {
  if (item.noTags) return false;
  if (crewTags_(item).length) return true;
  return !!(item.people && item.people.length && item.type !== 'STORY');
}

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
      return createContainer_(ig, withTags_({ image_url: item.images[0], caption: cap }, peopleTags_(item, 0)), tok);
    case 'STORY':
      return createContainer_(ig, storyParams_(item, crewTags_(item)), tok);
    case 'CAROUSEL': {
      const kids = item.images.map(function (u, i) {
        return createContainer_(ig, withTags_({ image_url: u, is_carousel_item: 'true' }, peopleTags_(item, i)), tok);
      });
      kids.forEach(function (k) { waitReady_(k, 0, 0, tok); });
      return createContainer_(ig, { media_type: 'CAROUSEL', children: kids.join(','), caption: cap }, tok);
    }
    case 'REEL':
      return createContainer_(ig, withTags_(reelParams_(item, cap, trialOn_(item)), peopleTags_(item, 0)), tok);
    default:
      throw new Error('Άγνωστος τύπος: ' + item.type);
  }
}

// Trial reels: πάνε πρώτα σε όσους ΔΕΝ ακολουθούν· με SS_PERFORMANCE περνάνε μόνα τους και στους followers αν πάνε καλά.
// Μόνο για reels (το Instagram δεν έχει trial για posts/carousels/stories). Αν το Instagram δεν δεχτεί trial
// (π.χ. λογαριασμός χωρίς δικαίωμα), το reel βγαίνει κανονικά και καταγράφεται στο Ιστορικό.
function trialOn_(item) {
  return item.type === 'REEL' && item.trial !== false && prop_('TRIAL_REELS', 'true') !== 'false';
}

function reelParams_(item, cap, trial) {
  const p = { media_type: 'REELS', video_url: item.video, caption: cap };
  if (item.cover) p.cover_url = item.cover;
  if (trial) p.trial_params = JSON.stringify({ graduation_strategy: prop_('TRIAL_STRATEGY', 'SS_PERFORMANCE') });
  else p.share_to_feed = 'true';
  return p;
}

function publishItem_(item) {
  if (hasTags_(item)) {
    try {
      return publishItemTrial_(item);
    } catch (e) {
      // Προσωρινό σφάλμα (π.χ. timeout στο κατέβασμα της εικόνας): όχι χωρίς tags, ξαναδοκιμάζει η επόμενη εκτέλεση.
      if (isTransient_(e.message) && !isTagError_(e.message)) throw e;
      // Ξαναδοκιμή χωρίς tags· αν πετύχει, το πρόβλημα ήταν τα tags (λάθος username ή δεν δέχεται αναφορές).
      let r;
      try { r = publishItemTrial_(Object.assign({}, item, { noTags: true })); } catch (e2) { throw e; }
      log_(item, 'Instagram: δημοσιεύτηκε ΧΩΡΙΣ tags (δεν έγιναν δεκτά)', e.message);
      const k = 'CREW_TAGS_REJECTED_' + item.account;
      if (!prop_(k, '')) {
        P_().setProperty(k, new Date().toISOString());
        notify_('Tags του crew δεν έγιναν δεκτά (' + item.account + ')',
          'Το ' + item.id + ' δημοσιεύτηκε, αλλά χωρίς tags.\n' +
          'Έλεγξε τα usernames στο CREW_TAGS_' + item.account + ' / CREW_MAP και ότι κάθε μέλος επιτρέπει αναφορές και ετικέτες. ' +
          'Τρέξε checkCrewTags για να δεις ποιο φταίει. Αφού το διορθώσεις, σβήσε το Script Property ' + k + '.\n\n' + e.message);
      }
      return r;
    }
  }
  return publishItemTrial_(item);
}

function publishItemTrial_(item) {
  if (!trialOn_(item)) return publishItemOnce_(item);
  try {
    return publishItemOnce_(item);
  } catch (e) {
    // Ξαναδοκιμή ως κανονικό reel· μόνο αν πετύχει, το πρόβλημα ήταν το trial.
    let r;
    try { r = publishItemOnce_(Object.assign({}, item, { trial: false })); } catch (e2) { throw e; }
    log_(item, 'Instagram: το trial δεν έγινε δεκτό, δημοσιεύτηκε ως κανονικό reel', e.message);
    const k = 'TRIAL_REJECTED_' + item.account;
    if (!prop_(k, '')) {
      P_().setProperty(k, new Date().toISOString());
      notify_('Trial reel δεν έγινε δεκτό (' + item.account + ')',
        'Το Instagram δεν δέχτηκε το ' + item.id + ' ως δοκιμαστικό reel, οπότε δημοσιεύτηκε ως κανονικό. ' +
        'Συνήθως σημαίνει ότι ο λογαριασμός δεν έχει ακόμα δικαίωμα για trial reels (π.χ. λιγότεροι από 1.000 followers).\n\n' + e.message);
    }
    return r;
  }
}

function publishItemOnce_(item) {
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

// ------------------------------------------------------------------ LinkedIn (προσωπικό προφίλ)
// Τα posts του LinkedIn είναι στο linkedin.json του repo (χωριστά από το queue.json), με δικό τους κείμενο
// και ώρα και τις ίδιες εικόνες/βίντεο με το Instagram. Παίρνουν "platforms": ["linkedin"], άρα ΜΟΝΟ LinkedIn.
// Τύποι: IMAGE (1 εικόνα), CAROUSEL (2–20 εικόνες), REEL (βίντεο mp4), TEXT (μόνο κείμενο).
function liQueue_() {
  try {
    const r = UrlFetchApp.fetch(CFG.LI_QUEUE_URL + '?nocache=' + Date.now(), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return [];
    return (JSON.parse(r.getContentText()).items || []).map(function (it) { it.platforms = ['linkedin']; return it; });
  } catch (e) { console.log('linkedin.json: ' + e.message); return []; }
}

function igEnabled_(item) { return !item.platforms || item.platforms.indexOf('instagram') >= 0; }

function liWanted_(item) { return !!item.platforms && item.platforms.indexOf('linkedin') >= 0; }

function liReady_() { return prop_('LI_ENABLED', 'true') !== 'false' && !!prop_('LI_TOKEN', '') && !!prop_('LI_AUTHOR', ''); }

// Posts με ώρα πριν συνδεθεί το LinkedIn (LI_SINCE) αγνοούνται σιωπηλά, χωρίς email «παραλείφθηκε».
function liEnabled_(item) {
  if (!liWanted_(item) || !liReady_()) return false;
  const since = prop_('LI_SINCE', '');
  return !since || new Date(item.publish_at) >= new Date(since);
}

function lowerHeaders_(h) {
  const o = {};
  Object.keys(h || {}).forEach(function (k) { o[k.toLowerCase()] = h[k]; });
  return o;
}

function liFetch_(method, path, body, versioned) {
  const tok = prop_('LI_TOKEN', '');
  if (!tok) throw new Error('Λείπει το LI_TOKEN στις Ιδιότητες σεναρίου');
  const headers = { Authorization: 'Bearer ' + tok };
  if (versioned !== false) {
    headers['Linkedin-Version'] = prop_('LI_VERSION', CFG.LI_VERSION);
    headers['X-Restli-Protocol-Version'] = '2.0.0';
  }
  const opt = { method: method, muteHttpExceptions: true, headers: headers };
  if (body) { opt.contentType = 'application/json'; opt.payload = JSON.stringify(body); }
  const res = UrlFetchApp.fetch(CFG.LI_API + path, opt);
  const code = res.getResponseCode(), text = res.getContentText();
  let b = {};
  try { b = JSON.parse(text || '{}'); } catch (e) { b = { raw: text }; }
  if (code >= 400) {
    let m = 'LinkedIn ' + code + ': ' + String(b.message || text).slice(0, 400) + (b.code ? ' [' + b.code + ']' : '');
    if (code === 401) m += ' — το LI_TOKEN έληξε ή ακυρώθηκε: βγάλε νέο (οδηγίες στο email υπενθύμισης / στο linkedinSetup).';
    throw new Error(m);
  }
  return { body: b, headers: lowerHeaders_(res.getAllHeaders()) };
}

// Ανέβασμα bytes σε URL του LinkedIn. Αν απορριφθεί (401/403), ξαναδοκιμάζει με/χωρίς token.
// Το token στέλνεται μόνο σε διευθύνσεις *.linkedin.com.
function liPut_(url, blob, withAuth) {
  const send = function (auth) {
    const o = { method: 'put', contentType: 'application/octet-stream', payload: blob, muteHttpExceptions: true };
    if (auth && /^https:\/\/([a-z0-9-]+\.)*linkedin\.com\//i.test(url)) o.headers = { Authorization: 'Bearer ' + prop_('LI_TOKEN', '') };
    return UrlFetchApp.fetch(url, o);
  };
  let r = send(withAuth);
  if (r.getResponseCode() === 401 || r.getResponseCode() === 403) r = send(!withAuth);
  if (r.getResponseCode() >= 400) throw new Error('LinkedIn upload ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
  return lowerHeaders_(r.getAllHeaders());
}

function fetchBlob_(url) {
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (r.getResponseCode() !== 200) throw new Error('HTTP ' + r.getResponseCode() + ' για ' + url);
  return r.getBlob();
}

function liUploadImage_(url, author) {
  const init = liFetch_('post', '/rest/images?action=initializeUpload', { initializeUploadRequest: { owner: author } }).body.value;
  liPut_(init.uploadUrl, fetchBlob_(url), true);
  return init.image;
}

function liUploadVideo_(url, author) {
  const bytes = fetchBlob_(url).getBytes();
  const init = liFetch_('post', '/rest/videos?action=initializeUpload', {
    initializeUploadRequest: { owner: author, fileSizeBytes: bytes.length, uploadCaptions: false, uploadThumbnail: false },
  }).body.value;
  const etags = (init.uploadInstructions || []).map(function (u) {
    const part = Utilities.newBlob(bytes.slice(u.firstByte, u.lastByte + 1), 'application/octet-stream');
    const h = liPut_(u.uploadUrl, part, false);
    if (!h.etag) throw new Error('LinkedIn upload: δεν ήρθε ETag για το κομμάτι ' + u.firstByte + '–' + u.lastByte);
    return String(h.etag).replace(/"/g, '');
  });
  liFetch_('post', '/rest/videos?action=finalizeUpload', {
    finalizeUploadRequest: { video: init.video, uploadToken: init.uploadToken || '', uploadedPartIds: etags },
  });
  return init.video;
}

// Κείμενο για το LinkedIn («little text format»): οι ειδικοί χαρακτήρες θέλουν \ μπροστά,
// τα #hashtags γίνονται {hashtag|\#|λέξη}.
function liText_(s) {
  const tags = [];
  let t = String(s || '').replace(/#([0-9A-Za-zÀ-ɏͰ-Ͽἀ-῿]+)/g, function (m, w) {
    tags.push(w);
    return '\u0000' + (tags.length - 1) + '\u0000';
  });
  t = t.replace(/[\\|{}@\[\]()<>#*_~]/g, '\\$&');
  return t.replace(/\u0000(\d+)\u0000/g, function (m, i) { return '{hashtag|\\#|' + tags[Number(i)] + '}'; });
}

function publishLi_(item) {
  const S = P_();
  const author = prop_('LI_AUTHOR', '');
  const text = String(item.caption || '');
  if (text.length > CFG.LI_MAX_CHARS) throw new Error('LinkedIn: το κείμενο έχει ' + text.length + ' χαρακτήρες (όριο ' + CFG.LI_MAX_CHARS + ')');
  // Τα αρχεία που ανέβηκαν κρατιούνται, ώστε μια νέα προσπάθεια να μην τα ξανανεβάζει.
  const mk = 'limedia_' + item.id;
  let media = null;
  try { media = JSON.parse(S.getProperty(mk) || 'null'); } catch (e) {}
  if (!media) {
    if (item.type === 'REEL') media = { video: liUploadVideo_(item.video, author) };
    else if (item.type === 'TEXT') media = {};
    else media = { images: (item.images || []).slice(0, 20).map(function (u) { return liUploadImage_(u, author); }) };
    S.setProperty(mk, JSON.stringify(media));
  }
  const body = {
    author: author,
    commentary: liText_(text),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };
  if (media.video) body.content = { media: item.title ? { id: media.video, title: item.title } : { id: media.video } };
  else if (media.images && media.images.length === 1) body.content = { media: { id: media.images[0] } };
  else if (media.images && media.images.length > 1) body.content = { multiImage: { images: media.images.map(function (id) { return { id: id }; }) } };
  // Το βίντεο θέλει λίγο χρόνο επεξεργασίας στο LinkedIn: έως 4 προσπάθειες ανά 20″ (και ξανά στο επόμενο run).
  const tries = media.video ? 4 : 1;
  for (let i = 0; i < tries; i++) {
    try {
      const r = liFetch_('post', '/rest/posts', body);
      const urn = r.headers['x-restli-id'] || r.body.id || '';
      S.deleteProperty(mk);
      return { id: urn, link: urn ? 'https://www.linkedin.com/feed/update/' + urn + '/' : '' };
    } catch (e) {
      if (/PROCESSING_FAILED/.test(e.message)) { S.deleteProperty(mk); throw e; }   // ξανανέβασμα στην επόμενη προσπάθεια
      const waiting = /WAITING_UPLOAD|PROCESSING|not ready|processing/i.test(e.message);
      if (!waiting || i === tries - 1) throw e;
      Utilities.sleep(20000);
    }
  }
}

function liTokenHash_(tok) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tok)).slice(0, 16);
}

function liRenewHelp_() {
  return 'Για νέο token (2 λεπτά):\n' +
    '1. https://www.linkedin.com/developers/tools/oauth/token-generator\n' +
    '2. Διάλεξε την εφαρμογή σου, τσέκαρε openid, profile, w_member_social → Request access token → Allow.\n' +
    '3. Copy token → άνοιξε το Sheet «IG Publisher» από υπολογιστή → μενού ⚙️ Publisher → «LinkedIn: νέο token…» → επικόλληση → OK.\n' +
    'Τίποτε άλλο: θα δεις αμέσως ότι συνδέθηκε.';
}

// Σε κάθε run: νέο token → ημερομηνία, προφίλ (LI_AUTHOR) και LI_SINCE· υπενθυμίσεις λήξης στις 50/57/59 ημέρες.
function liTokenCheck_(S, now, force) {
  const tok = prop_('LI_TOKEN', '');
  if (!tok || prop_('LI_ENABLED', 'true') === 'false') return;
  const h = liTokenHash_(tok);
  const fresh = S.getProperty('LI_TOKEN_HASH') !== h;
  if (fresh) {
    S.setProperty('LI_TOKEN_HASH', h);
    S.setProperty('LI_TOKEN_AT', now.toISOString());
    S.deleteProperty('LI_WARNED');
  }
  if (fresh || force || !S.getProperty('LI_AUTHOR')) {
    try {
      const me = liFetch_('get', '/v2/userinfo', null, false).body;
      if (!me.sub) throw new Error('το LinkedIn δεν έδωσε το ID του προφίλ (λείπει το scope openid;)');
      S.setProperty('LI_AUTHOR', 'urn:li:person:' + me.sub);
      S.setProperty('LI_NAME', me.name || '');
      if (!S.getProperty('LI_SINCE')) S.setProperty('LI_SINCE', now.toISOString());
      S.deleteProperty('LI_ERR');
    } catch (e) {
      if (S.getProperty('LI_ERR') !== h) {
        S.setProperty('LI_ERR', h);
        notify_('LinkedIn: το token δεν δουλεύει', 'Το LI_TOKEN δεν δέχτηκε (' + e.message + ').\n' +
          'Βεβαιώσου ότι στο token τσέκαρες openid, profile ΚΑΙ w_member_social.\n\n' + liRenewHelp_());
      }
      if (force) throw e;
      return;
    }
  }
  const days = (now - new Date(S.getProperty('LI_TOKEN_AT') || now)) / 864e5;
  const step = days >= 59 ? 3 : days >= 57 ? 2 : days >= 50 ? 1 : 0;
  if (step > Number(S.getProperty('LI_WARNED') || 0)) {
    S.setProperty('LI_WARNED', String(step));
    const left = Math.max(0, Math.round(CFG.LI_TOKEN_DAYS - days));
    notify_('LinkedIn: το token λήγει σε ' + left + (left === 1 ? ' ημέρα' : ' ημέρες'),
      'Το token του LinkedIn λήγει σε περίπου ' + left + ' ' + (left === 1 ? 'ημέρα' : 'ημέρες') + '. Μετά, τα posts του LinkedIn σταματούν (Instagram/Facebook συνεχίζουν κανονικά).\n\n' + liRenewHelp_());
  }
}

// ------------------------------------------------------------------ main loop (trigger)
// Instagram, Facebook και LinkedIn παρακολουθούνται χωριστά: αν αποτύχει το ένα, τα άλλα δεν ξαναδημοσιεύονται.
// Κλειδιά: Instagram done_/fail_/skip_<id>, Facebook fbdone_/fbfail_/fbskip_<id>, LinkedIn lidone_/lifail_/liskip_<id>
function targets_(item) {
  const t = [];
  if (igEnabled_(item)) t.push({ pre: '', label: 'Instagram', fn: publishItem_, link: function (r) { return r.permalink || r.mediaId; } });
  if (fbEnabled_(item)) t.push({ pre: 'fb', label: 'Facebook', fn: publishFb_, link: function (r) { return r.link || r.id; } });
  if (liEnabled_(item)) t.push({ pre: 'li', label: 'LinkedIn', fn: publishLi_, link: function (r) { return r.link || r.id; } });
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
    try { liTokenCheck_(S, now, false); } catch (e) { console.log('LinkedIn token: ' + e.message); }
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
          S.setProperty(kd, JSON.stringify({ at: new Date().toISOString(), link: link, media: r.mediaId || r.id || '' }));
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
    try { manualReelsToStories_(q, S, now); } catch (e) { console.log('Reels εφαρμογής → story: ' + e.message); }
    syncSheet_(q);
    try { syncReelsToDrive_(q, 2); } catch (e) { console.log('Reels → Drive: ' + e.message); }
  } catch (e) {
    notify_('Σφάλμα εκτέλεσης', e.message);
    throw e;
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------------ reels από την εφαρμογή → story
// Reels που ανεβάζετε εσείς από την εφαρμογή (όχι από την ουρά) μπαίνουν και σε story (Instagram + Facebook),
// 10′–3 ώρες μετά. Μία προσπάθεια ανά reel. Δεν γίνεται αν το reel έχει μουσική από τη βιβλιοθήκη του Instagram
// (το API δεν δίνει το βίντεο) ή αν είναι πάνω από 60″ (όριο story)· τότε έρχεται email μία φορά.
function manualReelsToStories_(q, S, now) {
  if (prop_('MANUAL_REEL_STORY', 'true') === 'false' || prop_('REEL_STORY', 'true') === 'false') return;
  let since = prop_('MANUAL_REEL_STORY_SINCE', '');
  if (!since) { since = now.toISOString(); S.setProperty('MANUAL_REEL_STORY_SINCE', since); }
  const ours = {};
  q.items.forEach(function (it) {
    if (it.type !== 'REEL') return;
    const d = S.getProperty('done_' + it.id);
    if (!d) return;
    try { const o = JSON.parse(d); if (o.link) ours[o.link] = true; if (o.media) ours[o.media] = true; } catch (e) {}
  });
  ['NDT', 'AMAZE'].forEach(function (acc) {
    if (!prop_('IG_USER_' + acc, '')) return;
    let list = [];
    try {
      list = api_('get', igUserId_(acc) + '/media',
        { fields: 'id,media_product_type,media_url,permalink,timestamp', limit: 10 }, token_(acc)).data || [];
    } catch (e) { console.log('Reels εφαρμογής ' + acc + ': ' + e.message); return; }
    list.forEach(function (m) {
      if (m.media_product_type !== 'REELS' || ours[m.id] || ours[m.permalink]) return;
      const t = new Date(m.timestamp), age = (now - t) / 60000;
      if (t < new Date(since) || age < CFG.MANUAL_REEL_MIN_AGE || age > CFG.MANUAL_REEL_MAX_AGE) return;
      const item = { id: acc + '-appreel-' + m.id, account: acc, type: 'STORY', video: m.media_url,
        publish_at: t.toISOString(), caption: '(story από reel της εφαρμογής ' + (m.permalink || m.id) + ')' };
      if (S.getProperty('done_' + item.id) || S.getProperty('skip_' + item.id)) return;
      if (!m.media_url) {
        S.setProperty('skip_' + item.id, now.toISOString());
        log_(item, 'Instagram: ΔΕΝ μπήκε σε story', 'Το API δεν δίνει το βίντεο (συνήθως μουσική από τη βιβλιοθήκη του Instagram)');
        notify_('Reel χωρίς αυτόματο story (' + acc + ')', 'Το reel ' + (m.permalink || m.id) + ' δεν μπήκε αυτόματα σε story: ' +
          'το Instagram δεν δίνει το βίντεο μέσω API (συνήθως όταν έχει μουσική από τη βιβλιοθήκη του Instagram).\n' +
          'Βάλ\' το με το χέρι: στο reel πάτα ✈️ → «Προσθήκη στην ιστορία».');
        return;
      }
      targets_(item).forEach(function (tg) {
        const kd = tg.pre + 'done_' + item.id, ks = tg.pre + 'skip_' + item.id;
        if (S.getProperty(kd) || S.getProperty(ks)) return;
        try {
          const r = tg.fn(item);
          S.setProperty(kd, JSON.stringify({ at: new Date().toISOString(), link: tg.link(r), media: r.mediaId || r.id || '' }));
          log_(item, tg.label + ': ΔΗΜΟΣΙΕΥΤΗΚΕ (story από reel της εφαρμογής)', tg.link(r));
        } catch (e) {
          S.setProperty(ks, now.toISOString());
          log_(item, tg.label + ': ΔΕΝ μπήκε σε story', e.message);
          if (!tg.pre) notify_('Reel χωρίς αυτόματο story (' + acc + ')', 'Το reel ' + (m.permalink || m.id) +
            ' δεν μπήκε αυτόματα σε story (πιθανότατα είναι πάνω από 60″, το όριο των stories).\n' +
            'Βάλ\' το με το χέρι: στο reel πάτα ✈️ → «Προσθήκη στην ιστορία».\n\n' + e.message);
        }
      });
    });
  });
}

function checkCrewTags() {
  const q = fetchQueue_();
  const now = new Date();
  ['NDT', 'AMAZE'].forEach(function (acc) {
    const users = crewTags_({ type: 'STORY', account: acc });
    const inStories = {};
    users.forEach(function (u) { inStories[u] = true; });
    const mapped = crewMap_();
    Object.keys(mapped).forEach(function (k) { if (users.indexOf(mapped[k]) < 0) users.push(mapped[k]); });
    if (!users.length) { console.log(acc + ': δεν έχει οριστεί CREW_TAGS_' + acc + ' ούτε CREW_MAP (χωρίς tags).'); return; }
    const why = function (u) { return inStories[u] ? ' [stories ' + acc + ']' : ' [μόνο σε posts όπου φαίνεται, από το CREW_MAP]'; };
    if (!prop_('IG_USER_' + acc, '')) return;
    const next = q.items.filter(function (it) {
      return it.account === acc && it.type === 'STORY' && it.images && it.images.length && new Date(it.publish_at) > now;
    })[0];
    if (!next) { console.log(acc + ': δεν υπάρχει επόμενο story με εικόνα για τη δοκιμή.'); return; }
    const ig = igUserId_(acc), tok = token_(acc);
    let me = acc;
    try { me = '@' + api_('get', ig, { fields: 'username' }, tok).username; } catch (e) {}
    // Μία δοκιμή ανά username· τα προσωρινά σφάλματα (timeout) ξαναδοκιμάζονται έως 3 φορές.
    const test = function (u) {
      let last;
      for (let a = 0; a < 3; a++) {
        try {
          const c = createContainer_(ig, storyParams_(next, [u]), tok);
          waitReady_(c, 0, 0, tok);
          return null;
        } catch (e) {
          last = e;
          if (!isTransient_(e.message) || isTagError_(e.message)) break;
          Utilities.sleep(5000);
        }
      }
      return last;
    };
    console.log(acc + ' (' + me + '): έλεγχος ' + users.length + ' usernames, ΧΩΡΙΣ να δημοσιευτεί τίποτα…');
    users.forEach(function (u) {
      const e = test(u);
      if (!e) { console.log('  ' + u + why(u) + ': OK'); return; }
      if (isTagError_(e.message)) {
        console.log('  ' + u + why(u) + ': ΔΕΝ γίνεται tag από ' + me + '. Το API κάνει tag μόνο σε ΔΗΜΟΣΙΟΥΣ λογαριασμούς: πιθανότατα ιδιωτικός λογαριασμός (ή λάθος username, ή επιτρέπει ετικέτες/αναφορές ' +
          'μόνο από όσους ακολουθεί (να ακολουθήσει το ' + me + ' και να ανοίξει «Ετικέτες και αναφορές» σε «Όλους»). Βγάλε τον από το CREW_TAGS_' + acc + ', αλλιώς τα stories βγαίνουν χωρίς κανένα tag. — ' + e.message);
      } else if (isTransient_(e.message)) {
        console.log('  ' + u + why(u) + ': ΑΓΝΩΣΤΟ — το Instagram άργησε (timeout), δεν φταίει το username. Ξανατρέξε το checkCrewTags. — ' + e.message);
      } else {
        console.log('  ' + u + why(u) + ': ΠΡΟΒΛΗΜΑ — ' + e.message);
      }
    });
  });
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
  const H = ['Ώρα δημοσίευσης', 'Λογαριασμός', 'Τύπος', 'Λεζάντα', 'Αρχεία', 'Instagram', 'Link Instagram', 'Facebook', 'Link Facebook', 'ID', 'LinkedIn', 'Link LinkedIn'];
  const sh = sheet_('Ουρά', H);
  sh.getRange(1, 1, 1, H.length).setValues([H]).setFontWeight('bold');
  const S = P_();
  const rows = q.items.map(function (it) {
    const ig = igEnabled_(it) ? status_(S, '', it.id) : ['—', ''];
    const fb = fbEnabled_(it) ? status_(S, 'fb', it.id) : ['—', ''];
    const li = !liWanted_(it) ? ['—', ''] : !liReady_() ? ['Δεν έχει συνδεθεί', ''] : liEnabled_(it) ? status_(S, 'li', it.id) : ['Πριν τη σύνδεση', ''];
    const files = (it.images || []).length + (it.video ? 1 : 0);
    return [new Date(it.publish_at), it.account + (liWanted_(it) && !igEnabled_(it) ? ' (LinkedIn)' : ''), it.type,
      String(it.caption || '').slice(0, 120), files, ig[0], ig[1], fb[0], fb[1], it.id, li[0], li[1]];
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
    const need = ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement', 'pages_manage_posts', 'instagram_manage_insights'];
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
      return it.account === acc && igEnabled_(it) && !S.getProperty('done_' + it.id) && new Date(it.publish_at) > now && it.images && it.images.length;
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
  ['NDT', 'AMAZE'].forEach(function (acc) {
    const next = q.items.filter(function (it) { return it.type === 'REEL' && igEnabled_(it) && it.account === acc && new Date(it.publish_at) > now; })[0];
    if (!next) { console.log(acc + ': δεν υπάρχει επόμενο reel στην ουρά.'); return; }
    const ig = igUserId_(acc), tok = token_(acc);
    const trial = trialOn_(next);
    let c;
    try {
      c = createContainer_(ig, reelParams_(next, 'dry run', trial), tok);
    } catch (e) {
      if (!trial) throw e;
      console.log(acc + ': το Instagram ΔΕΝ δέχτηκε trial reel (' + e.message + '). Θα βγαίνουν κανονικά. Δοκιμή χωρίς trial…');
      c = createContainer_(ig, reelParams_(next, 'dry run', false), tok);
    }
    waitReady_(c, 50, 5000, tok);
    console.log(acc + ' Instagram OK: το reel ' + next.id + ' επεξεργάστηκε σωστά' + (trial ? ' (ως trial reel)' : '') + '. ΔΕΝ δημοσιεύτηκε τίποτα.');
  });
}

// ------------------------------------------------------------------ reels → Drive (για YouTube Shorts / TikTok)
// Κάθε reel της ουράς αντιγράφεται στο Drive «ΥΛΙΚΟ SOCIAL MEDIA/REELS» ως
//   «2026-12-01 Τρι 20.00 – NDT – Τίτλος.mp4» + «… .txt» (τίτλος/περιγραφή YouTube, λεζάντα TikTok),
// ώστε να προγραμματίζονται με το χέρι στο YouTube Studio και στο TikTok.
const REELS_SRC_ = 'https://raw.githubusercontent.com/malamaspe/social-media-assets/main/media/';
const DAYS_SHORT_ = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
const DAYS_LONG_ = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

function reelsFolder_() {
  const id = prop_('REELS_FOLDER_ID', '');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  const roots = DriveApp.getFoldersByName('ΥΛΙΚΟ SOCIAL MEDIA');
  if (!roots.hasNext()) throw new Error('Δεν βρέθηκε ο φάκελος «ΥΛΙΚΟ SOCIAL MEDIA» στο Drive.');
  const root = roots.next();
  const it = root.getFoldersByName('REELS');
  const f = it.hasNext() ? it.next() : root.createFolder('REELS');
  P_().setProperty('REELS_FOLDER_ID', f.getId());
  return f;
}

function athens_(d, fmt) { return Utilities.formatDate(d, 'Europe/Athens', fmt); }
function dow_(d) { return Number(athens_(d, 'u')) % 7; }   // u: 1 = Δευτέρα … 7 = Κυριακή

function reelBaseName_(it) {
  const d = new Date(it.publish_at);
  const t = String(it.title || '').replace(/[\\/:*?"<>|]/g, '').trim();
  return athens_(d, 'yyyy-MM-dd') + ' ' + DAYS_SHORT_[dow_(d)] + ' ' + athens_(d, 'HH.mm') + ' – ' + it.account + (t ? ' – ' + t : '');
}

function reelTexts_(it, base) {
  const d = new Date(it.publish_at);
  const cap = String(it.caption || '');
  const ytTitle = it.yt_title || ((it.title || cap.split('\n')[0]).slice(0, 90) + ' #Shorts');
  return [
    'ΠΟΤΕ: ' + DAYS_LONG_[dow_(d)] + ' ' + athens_(d, 'd/M/yyyy') + ', ' + athens_(d, 'HH:mm') + ' (ίδια ώρα με το Instagram)',
    'BRAND: ' + it.account,
    'ΒΙΝΤΕΟ: ' + base + '.mp4',
    '',
    '━━━━━━━━ YOUTUBE SHORTS ━━━━━━━━',
    'Τίτλος:',
    ytTitle,
    '',
    'Περιγραφή:',
    it.yt_description || cap,
    '',
    'Ετικέτες (Tags) — στο πεδίο «Ετικέτες» του YouTube Studio (Εμφάνιση περισσότερων), ΟΧΙ στην περιγραφή:',
    it.yt_tags || '—',
    '',
    '━━━━━━━━ TIKTOK ━━━━━━━━',
    'Λεζάντα:',
    it.tiktok_caption || cap,
    ''
  ].join('\n');
}

function syncReelsToDrive_(q, maxPerRun) {
  const S = P_();
  const reels = q.items.filter(function (it) { return it.type === 'REEL' && igEnabled_(it); });
  const key = function (it) { return it.id + '|' + it.video; };
  let done = [];
  try { done = JSON.parse(S.getProperty('REELS_SYNCED') || '[]'); } catch (e) {}
  const since = Date.now() - 24 * 3600 * 1000;
  const todo = reels.filter(function (it) {
    return new Date(it.publish_at).getTime() > since && done.indexOf(key(it)) < 0 &&
      String(it.video || '').indexOf(REELS_SRC_) === 0 && !S.getProperty('rsskip_' + it.id);
  });
  let n = 0;
  if (todo.length) {
    const folder = reelsFolder_();
    todo.slice(0, maxPerRun).forEach(function (it) {
      const base = reelBaseName_(it);
      try {
        const res = UrlFetchApp.fetch(it.video, { muteHttpExceptions: true });
        if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode() + ' για ' + it.video);
        [base + '.mp4', base + '.txt'].forEach(function (name) {       // παλιά έκδοση του ίδιου reel → κάδος
          const old = folder.getFilesByName(name);
          while (old.hasNext()) old.next().setTrashed(true);
        });
        folder.createFile(res.getBlob().setName(base + '.mp4'));
        folder.createFile(base + '.txt', reelTexts_(it, base), MimeType.PLAIN_TEXT);
        done.push(key(it));
        S.deleteProperty('rsfail_' + it.id);
        n++;
        console.log('Reel στο Drive: ' + base);
      } catch (e) {
        const f = Number(S.getProperty('rsfail_' + it.id) || 0) + 1;
        S.setProperty('rsfail_' + it.id, String(f));
        console.log('Reel → Drive σφάλμα ' + f + '/' + CFG.MAX_FAILS + ' (' + it.id + '): ' + e.message);
        if (f >= CFG.MAX_FAILS) {
          S.setProperty('rsskip_' + it.id, new Date().toISOString());
          notify_('Το reel ' + it.id + ' δεν μπήκε στο Drive', 'Το reel ' + it.id + ' δεν αντιγράφηκε στον φάκελο REELS μετά από ' + f + ' προσπάθειες. Το Instagram/Facebook δεν επηρεάζεται.\n\n' + e.message);
        }
      }
    });
  }
  const live = reels.map(key);
  S.setProperty('REELS_SYNCED', JSON.stringify(done.filter(function (k) { return live.indexOf(k) >= 0; })));
  return n;
}

// ------------------------------------------------------------------ μενού «⚙️ Publisher» στο Sheet
// Οι Ιδιότητες σεναρίου είναι πάνω από 50 (done_/fail_/… ανά δημοσίευση), οπότε η οθόνη του Apps Script
// τις δείχνει μόνο για ανάγνωση. Οι ρυθμίσεις (token LinkedIn, CREW_TAGS_*, CREW_MAP, παύσεις) γίνονται από εδώ.
const STATUS_KEY_ = /^(li|fb)?(done|fail|skip)_|^limedia_|^rs(fail|skip)_/;
function secretKey_(k) { return /TOKEN|KEY|SECRET|HASH/.test(k) && !/_AT$/.test(k); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('⚙️ Publisher')
    .addItem('LinkedIn: νέο token…', 'menuLinkedInToken')
    .addItem('Αλλαγή ρύθμισης…', 'menuSetProperty')
    .addItem('Δες τις ρυθμίσεις', 'menuShowSettings')
    .addItem('Ώρες κοινού: ενημέρωση τώρα', 'menuAudienceHours')
    .addToUi();
}

function mask_(v) { v = String(v || ''); return v.length <= 10 ? '••••' : v.slice(0, 4) + '…' + v.slice(-4) + ' (' + v.length + ' χαρ.)'; }

function menuLinkedInToken() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('LinkedIn: νέο token', 'Επικόλλησε το token από το Token Generator του LinkedIn (openid, profile, w_member_social):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const t = r.getResponseText().replace(/\s+/g, '');
  if (!t) return;
  // Έλεγχος ΠΡΙΝ την αποθήκευση: ένα λάθος token δεν αντικαθιστά το σωστό.
  const chk = UrlFetchApp.fetch(CFG.LI_API + '/v2/userinfo', { headers: { Authorization: 'Bearer ' + t }, muteHttpExceptions: true });
  let me = {};
  try { me = JSON.parse(chk.getContentText() || '{}'); } catch (e) {}
  if (chk.getResponseCode() !== 200 || !me.sub) {
    ui.alert('LinkedIn: δεν συνδέθηκε', 'Το LinkedIn δεν δέχτηκε αυτό το token (' + chk.getResponseCode() + ': ' + String(me.message || chk.getContentText()).slice(0, 150) +
      ').\nΔεν άλλαξε τίποτα.\n\nΒγάλε νέο token και τσέκαρε και τα τρία: openid, profile, w_member_social.', ui.ButtonSet.OK);
    return;
  }
  P_().setProperty('LI_TOKEN', t);
  try {
    liTokenCheck_(P_(), new Date(), true);
    const at = new Date(prop_('LI_TOKEN_AT', new Date().toISOString()));
    ui.alert('LinkedIn OK', 'Συνδέθηκε το προφίλ: ' + (prop_('LI_NAME', '') || prop_('LI_AUTHOR', '')) +
      '\nΤο token λήγει γύρω στις ' + athens_(new Date(at.getTime() + CFG.LI_TOKEN_DAYS * 864e5), 'd/M/yyyy') +
      ' (θα έρθει email 10 ημέρες πριν).\nΤα posts του LinkedIn βγαίνουν πλέον αυτόματα.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('LinkedIn: δεν συνδέθηκε', e.message + '\n\nΒγάλε νέο token και τσέκαρε και τα τρία: openid, profile, w_member_social.', ui.ButtonSet.OK);
  }
  try { syncSheet_(fetchQueue_()); } catch (e) { console.log('Ουρά: ' + e.message); }
}

function menuSetProperty() {
  const ui = SpreadsheetApp.getUi();
  const k = ui.prompt('Αλλαγή ρύθμισης', 'Όνομα ρύθμισης, π.χ. CREW_TAGS_NDT, CREW_TAGS_AMAZE, CREW_MAP, LI_ENABLED, FB_ENABLED, PAUSED:', ui.ButtonSet.OK_CANCEL);
  if (k.getSelectedButton() !== ui.Button.OK) return;
  const key = k.getResponseText().trim();
  if (!/^[A-Za-z0-9_]+$/.test(key)) { ui.alert('Μη έγκυρο όνομα: «' + key + '»'); return; }
  if (STATUS_KEY_.test(key)) { ui.alert('Το ' + key + ' το κρατάει μόνο του το script (κατάσταση δημοσίευσης). Δεν αλλάζει από εδώ.'); return; }
  const secret = secretKey_(key);
  const cur = P_().getProperty(key);
  const v = ui.prompt(key, 'Τωρινή τιμή: ' + (cur === null ? '(δεν υπάρχει)' : secret ? mask_(cur) : cur) +
    '\n\nΝέα τιμή (άφησέ το κενό για διαγραφή):', ui.ButtonSet.OK_CANCEL);
  if (v.getSelectedButton() !== ui.Button.OK) return;
  const val = v.getResponseText().trim();
  if (!val) {
    if (cur === null) return;
    if (ui.alert('Διαγραφή του ' + key + ';', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    P_().deleteProperty(key);
    ui.alert('Διαγράφηκε: ' + key);
    return;
  }
  P_().setProperty(key, val);
  ui.alert('Αποθηκεύτηκε: ' + key + ' = ' + (secret ? mask_(val) : val));
}

function menuShowSettings() {
  const all = P_().getProperties();
  let status = 0;
  const lines = Object.keys(all).sort().filter(function (k) {
    if (STATUS_KEY_.test(k)) { status++; return false; }
    return true;
  }).map(function (k) {
    const v = secretKey_(k) ? mask_(all[k]) : String(all[k]);
    return k + ' = ' + (v.length > 90 ? v.slice(0, 90) + '…' : v);
  });
  SpreadsheetApp.getUi().alert('Ρυθμίσεις', lines.join('\n') + '\n\n(+ ' + status + ' σημειώσεις κατάστασης δημοσιεύσεων)', SpreadsheetApp.getUi().ButtonSet.OK);
}

// Τρέξ' το μία φορά αφού βάλεις το LI_TOKEN. Δεν δημοσιεύει τίποτα.
function linkedinSetup() {
  if (!prop_('LI_TOKEN', '')) {
    console.log('Βάλε πρώτα το token: Sheet → μενού ⚙️ Publisher → «LinkedIn: νέο token…».\n\n' + liRenewHelp_());
    return;
  }
  const S = P_(), now = new Date();
  liTokenCheck_(S, now, true);
  const at = new Date(S.getProperty('LI_TOKEN_AT') || now);
  const exp = new Date(at.getTime() + CFG.LI_TOKEN_DAYS * 864e5);
  console.log('LinkedIn OK: ' + (prop_('LI_NAME', '') || '(χωρίς όνομα)') + ' (' + prop_('LI_AUTHOR', '') + ')');
  console.log('Token: λήγει γύρω στις ' + athens_(exp, 'd/M/yyyy') + ' — θα έρθει email υπενθύμισης 10 ημέρες πριν.');
  console.log('Posts LinkedIn από ' + athens_(new Date(prop_('LI_SINCE', now.toISOString())), 'd/M/yyyy HH:mm') + ' και μετά.' +
    (prop_('LI_ENABLED', 'true') === 'false' ? ' ΠΡΟΣΟΧΗ: LI_ENABLED = false, το LinkedIn είναι σε παύση.' : ''));
  const q = fetchQueue_();
  const next = q.items.filter(function (it) { return liEnabled_(it) && !S.getProperty('lidone_' + it.id) && new Date(it.publish_at) > now; });
  if (!next.length) console.log('Δεν υπάρχουν επόμενα posts LinkedIn στην ουρά.');
  next.slice(0, 5).forEach(function (it) {
    const d = new Date(it.publish_at);
    console.log('  ' + DAYS_SHORT_[dow_(d)] + ' ' + athens_(d, 'd/M HH:mm') + ' · ' + it.type + ' · ' + String(it.caption || '').split('\n')[0].slice(0, 80));
  });
  syncSheet_(q);
  console.log('Τίποτα δεν δημοσιεύτηκε.');
}

function syncReelsNow() {
  const n = syncReelsToDrive_(fetchQueue_(), 20);
  console.log(n ? 'Έτοιμο: ' + n + ' reels στο Drive → ΥΛΙΚΟ SOCIAL MEDIA/REELS.' : 'Όλα τα reels της ουράς είναι ήδη στο Drive.');
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

// ------------------------------------------------------------------ ώρες κοινού (απόφαση Πέτρου 26/11)
// Κάθε μέρα στις ~04:00 το updateAudienceHours διαβάζει από το Instagram πόσοι ακόλουθοι είναι online ανά ώρα
// (online_followers· το Instagram κρατάει μόνο τις τελευταίες 30 μέρες) για NDT και AMAZE και γράφει:
//   «_online»       ακατέργαστα, ανά ημέρα και ώρα Αθήνας (κρατάει 8 εβδομάδες)
//   «Ώρες κοινού»   καλύτερη ώρα ανά μέρα της εβδομάδας (μέσος όρος 4 εβδομάδων, μόνο 08:00–23:00)
// Το μηνιαίο πακέτο διαβάζει την «Ώρες κοινού» και βάζει εκεί τα posts (story 5′ μετά). Χωρίς δεδομένα μένουν
// οι σταθερές ώρες (NDT 20:00, AMAZE 21:00). Θέλει δικαίωμα instagram_manage_insights στα tokens (checkSetup).
const AUD_ = { FETCH_DAYS: 29, KEEP_DAYS: 56, AVG_DAYS: 28, FROM_H: 8, TO_H: 23, MIN_DAYS: 2 };
const AUD_RAW_ = '_online';
const AUD_SUM_ = 'Ώρες κοινού';
const AUD_ORDER_ = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];

// Κάθε τιμή του online_followers αφορά τη μέρα που τελειώνει στο end_time· το κλειδί "0".."23" είναι η ώρα
// από την αρχή εκείνης της μέρας. Μετατρέπεται σε ημέρα και ώρα Αθήνας.
function audRows_(body, acc) {
  const out = [];
  const vals = (((body || {}).data || [])[0] || {}).values || [];
  vals.forEach(function (v) {
    const val = v.value || {};
    const end = new Date(String(v.end_time || '').replace(/([+-]\d\d)(\d\d)$/, '$1:$2')).getTime();
    if (!end) return;
    Object.keys(val).forEach(function (h) {
      const d = new Date(end - 86400000 + Number(h) * 3600000);
      out.push([acc, athens_(d, 'yyyy-MM-dd'), DAYS_SHORT_[dow_(d)], Number(athens_(d, 'H')), Number(val[h]) || 0]);
    });
  });
  return out;
}

function audFetch_(acc) {
  const now = Math.floor(Date.now() / 1000);
  return audRows_(api_('get', igUserId_(acc) + '/insights', {
    metric: 'online_followers', period: 'lifetime', since: now - AUD_.FETCH_DAYS * 86400, until: now,
  }, token_(acc)), acc);
}

function audSummary_(all, now) {
  const cut = athens_(new Date(now.getTime() - AUD_.AVG_DAYS * 86400000), 'yyyy-MM-dd');
  const agg = {}, days = {};
  all.forEach(function (r) {
    if (r[1] < cut) return;
    const k = r[0] + '|' + r[2];
    (days[k] = days[k] || {})[r[1]] = 1;
    if (r[3] < AUD_.FROM_H || r[3] > AUD_.TO_H) return;
    const kk = k + '|' + r[3];
    agg[kk] = agg[kk] || [0, 0];
    agg[kk][0] += r[4]; agg[kk][1]++;
  });
  const hh = function (h) { return ('0' + h).slice(-2) + ':00'; };
  const out = [];
  ['NDT', 'AMAZE'].forEach(function (acc) {
    AUD_ORDER_.forEach(function (dn) {
      const nd = Object.keys(days[acc + '|' + dn] || {}).length;
      const hs = [];
      for (let h = AUD_.FROM_H; h <= AUD_.TO_H; h++) {
        const a = agg[acc + '|' + dn + '|' + h];
        if (a) hs.push([h, a[0] / a[1]]);
      }
      hs.sort(function (a, b) { return b[1] - a[1] || a[0] - b[0]; });
      const ok = nd >= AUD_.MIN_DAYS && hs.length && hs[0][1] > 0;
      out.push([acc, dn, ok ? hh(hs[0][0]) : '', ok ? Math.round(hs[0][1]) : '', ok && hs[1] ? hh(hs[1][0]) : '', nd,
        athens_(now, 'yyyy-MM-dd HH:mm')]);
    });
  });
  return out;
}

function audEnsureTrigger_() {
  const has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'updateAudienceHours'; });
  if (!has) ScriptApp.newTrigger('updateAudienceHours').timeBased().atHour(4).everyDays(1).inTimezone('Europe/Athens').create();
}

function audNotify_(msg) {
  const h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, msg)).slice(0, 12);
  if (prop_('AUD_ERR', '') === h) return;
  P_().setProperty('AUD_ERR', h);
  const perm = /permission|\(#10\)|\(#200\)|instagram_manage_insights/i.test(msg);
  notify_('Ώρες κοινού: δεν διαβάστηκαν', msg +
    (perm ? '\n\nΛείπει το δικαίωμα instagram_manage_insights από τα tokens: README → Τρόπος Α (7 δικαιώματα).' : '') +
    '\n\nΟι δημοσιεύσεις συνεχίζουν κανονικά· το πρόγραμμα κρατάει τις σταθερές ώρες (NDT 20:00, AMAZE 21:00).');
}

function updateAudienceHours() {
  audEnsureTrigger_();
  const now = new Date();
  const rows = [], errs = [];
  ['NDT', 'AMAZE'].forEach(function (acc) {
    try { rows.push.apply(rows, audFetch_(acc)); } catch (e) { errs.push(acc + ': ' + e.message); }
  });
  const raw = sheet_(AUD_RAW_, ['Λογαριασμός', 'Ημέρα', 'Μέρα', 'Ώρα', 'Online']);
  const map = {};
  const last = raw.getLastRow();
  if (last > 1) raw.getRange(2, 1, last - 1, 5).getValues().forEach(function (r) {
    if (!r[0]) return;
    const day = r[1] instanceof Date ? athens_(r[1], 'yyyy-MM-dd') : String(r[1]);
    map[r[0] + '|' + day + '|' + Number(r[3])] = [String(r[0]), day, String(r[2]), Number(r[3]), Number(r[4]) || 0];
  });
  rows.forEach(function (r) { map[r[0] + '|' + r[1] + '|' + r[3]] = r; });
  const keep = athens_(new Date(now.getTime() - AUD_.KEEP_DAYS * 86400000), 'yyyy-MM-dd');
  const all = Object.keys(map).map(function (k) { return map[k]; })
    .filter(function (r) { return r[1] >= keep; })
    .sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[3] - b[3]; });
  if (last > 1) raw.getRange(2, 1, last - 1, 5).clearContent();
  if (all.length) {
    raw.getRange(2, 2, all.length, 1).setNumberFormat('@');
    raw.getRange(2, 1, all.length, 5).setValues(all);
  }
  const sum = audSummary_(all, now);
  const sh = sheet_(AUD_SUM_, ['Λογαριασμός', 'Μέρα', 'Καλύτερη ώρα', 'Online (μ.ό.)', '2η καλύτερη', 'Μέρες δεδομένων', 'Ενημέρωση']);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 7).clearContent();
  sh.getRange(2, 1, sum.length, 7).setNumberFormat('@');
  sh.getRange(2, 1, sum.length, 7).setValues(sum.map(function (r) { return r.map(String); }));
  if (errs.length) audNotify_(errs.join('\n')); else P_().deleteProperty('AUD_ERR');
  console.log('Ώρες κοινού: ' + rows.length + ' νέες μετρήσεις' + (errs.length ? ' · ΣΦΑΛΜΑ: ' + errs.join(' | ') : ''));
  return errs;
}

function menuAudienceHours() {
  const errs = updateAudienceHours();
  const sh = SpreadsheetApp.getActive().getSheetByName(AUD_SUM_);
  if (sh) sh.activate();
  if (errs.length) {
    SpreadsheetApp.getUi().alert('Ώρες κοινού', 'Δεν διαβάστηκαν:\n' + errs.join('\n') +
      (/permission|\(#10\)|\(#200\)/i.test(errs.join(' ')) ? '\n\nΛείπει το δικαίωμα instagram_manage_insights από τα tokens (README → Τρόπος Α).' : ''),
      SpreadsheetApp.getUi().ButtonSet.OK);
  } else {
    SpreadsheetApp.getActive().toast('Έτοιμο. Από εδώ και πέρα ενημερώνεται μόνο του κάθε μέρα στις 04:00.', 'Ώρες κοινού', 8);
  }
}
