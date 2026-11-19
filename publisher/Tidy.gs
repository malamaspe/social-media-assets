/**
 * Τακτοποίηση των εξαγωγών Instagram στο Drive (IG Publisher, ξεχωριστό αρχείο στο ίδιο project).
 *
 * tidyIgExports(): για κάθε φάκελο «IG …» μέσα στο «ΥΛΙΚΟ SOCIAL MEDIA» (π.χ. «IG newdjsteam», «IG amaze.djs»):
 *   1. ενώνει τους υποφακέλους media, media1, media2 … σε μία δομή:  IG …/posts|stories|reels|…/ΕΕΕΕΜΜ/αρχεία
 *   2. στέλνει στον κάδο τα ακριβή διπλότυπα (ίδιο περιεχόμενο, έλεγχος MD5 του Drive)
 *   3. στέλνει στον κάδο τους άδειους πλέον φακέλους media*
 * Αν ανεβαίνουν ακόμα αρχεία (κάτι νέο τα τελευταία 45 λεπτά), περιμένει: ξαναδοκιμάζει μόνο του κάθε 10 λεπτά
 * και σταματάει μόλις τελειώσει, με email. Τίποτα δεν σβήνεται οριστικά (ο κάδος κρατάει 30 ημέρες).
 * Μπορεί να ξανατρέξει όποτε μπει νέα εξαγωγή: ό,τι είναι ήδη τακτοποιημένο μένει ως έχει.
 *
 * dedupeMaterial(): ψάχνει ακριβή διπλότυπα (ίδιο περιεχόμενο, MD5 + μέγεθος) σε ΟΛΟ το «ΥΛΙΚΟ SOCIAL MEDIA»,
 *   εκτός από τον φάκελο REELS. Κρατάει ένα αντίγραφο (πρώτα όσα ανήκουν σε σένα, μετά το παλιότερο) και τα άλλα:
 *   δικά σου → κάδος (30 ημέρες) · του crew → βγαίνουν μόνο από τον φάκελο (μένουν στο Drive τους).
 *   Email μόνο όταν βρει κάτι, με τη λίστα.
 * setupDailyDedupe(): τρέχει τον έλεγχο τώρα και μετά κάθε βράδυ (~04:00), αυτόματα.
 */
const TIDY_ = {
  ROOT: 'ΥΛΙΚΟ SOCIAL MEDIA',
  PREFIX: 'IG ',
  QUIET_MIN: 45,                 // λεπτά χωρίς νέο αρχείο = τα ανεβάσματα τελείωσαν
  BUDGET_MS: 4.5 * 60 * 1000,    // ασφαλώς κάτω από το όριο των 6 λεπτών του Apps Script
  GIVE_UP_H: 48,
  API: 'https://www.googleapis.com/drive/v3/files',
  FOLDER: 'application/vnd.google-apps.folder',
  PART: /^media\d*$/i,
};

function tidyIgExports() {
  const S = PropertiesService.getScriptProperties();
  const t0 = Date.now(), deadline = t0 + TIDY_.BUDGET_MS;
  const busy = Number(S.getProperty('TIDY_BUSY') || 0);
  if (busy && t0 - busy < 6 * 60 * 1000) { console.log('Τρέχει ήδη.'); return; }
  S.setProperty('TIDY_BUSY', String(t0));
  try {
    if (!S.getProperty('TIDY_STARTED')) S.setProperty('TIDY_STARTED', String(t0));
    tidyEnsureTrigger_();
    const roots = tidyRoots_();
    if (!roots.length) throw new Error('Δεν βρέθηκε φάκελος «' + TIDY_.PREFIX + '…» μέσα στο «' + TIDY_.ROOT + '».');
    let pending = false;
    const busyRoots = tidyBusyRoots_(roots.map(function (r) { return r.getId(); }));
    roots.forEach(function (r) {
      const name = r.getName(), id = r.getId();
      if (Date.now() > deadline) { pending = true; return; }
      if (busyRoots[id]) { console.log(name + ': ανεβαίνουν ακόμα αρχεία, ξαναδοκιμάζω σε 10 λεπτά.'); pending = true; return; }
      for (let pass = 0; pass < 5; pass++) {
        const w = tidyWalk_(id);
        const newest = w.files.reduce(function (m, f) { return Math.max(m, new Date(f.created).getTime()); }, 0);
        if (Date.now() - newest < TIDY_.QUIET_MIN * 60000) {
          console.log(name + ': ανεβαίνουν ακόμα αρχεία, ξαναδοκιμάζω σε 10 λεπτά.');
          pending = true; return;
        }
        const plan = tidyPlan_(w.root);
        if (plan.ops.length) {                                   // 1. ένωση των media*
          const x = tidyExec_(plan.ops, deadline);
          tidyCount_(S, 'TIDY_MOVED', x.ok);
          console.log(name + ': μετακινήθηκαν ' + x.ok + '/' + plan.ops.length);
          if (x.ok < plan.ops.length) { pending = true; return; }
          continue;                                             // ξανά ανάγνωση, μετά διπλότυπα
        }
        const dups = tidyDups_(w.files);                        // 2. διπλότυπα → κάδος
        if (dups.length) {
          const x = tidyExec_(dups.map(function (f) { return { type: 'trash', id: f.id }; }), deadline);
          tidyCount_(S, 'TIDY_DUPS', x.ok);
          console.log(name + ': διπλότυπα στον κάδο ' + x.ok + '/' + dups.length);
          if (x.ok < dups.length) { pending = true; return; }
        }
        const empty = plan.parts;   // 3. χωρίς σχέδιο μετακινήσεων, οι media* έχουν μόνο άδειους φακέλους → κάδος
        if (empty.length) {
          const x = tidyExec_(empty.map(function (p) { return { type: 'trash', id: p.id }; }), deadline);
          tidyCount_(S, 'TIDY_FOLDERS', x.ok);
          if (x.ok < empty.length) { pending = true; return; }
        }
        S.setProperty('TIDY_FILES_' + name, String(w.files.length - dups.length));
        console.log(name + ': τακτοποιήθηκε (' + (w.files.length - dups.length) + ' αρχεία).');
        return;
      }
      pending = true;
    });

    if (!pending) {
      tidyStopTrigger_();
      const lines = roots.map(function (r) { return '• ' + r.getName() + ': ' + (S.getProperty('TIDY_FILES_' + r.getName()) || '?') + ' αρχεία'; });
      notify_('Τακτοποίηση φακέλων IG: έτοιμη',
        'Οι φάκελοι media ενώθηκαν σε έναν ανά brand (posts / stories / reels / … ανά μήνα).\n\n' + lines.join('\n') +
        '\n\nΜετακινήσεις: ' + (S.getProperty('TIDY_MOVED') || 0) +
        '\nΔιπλότυπα στον κάδο: ' + (S.getProperty('TIDY_DUPS') || 0) +
        '\nΆδειοι φάκελοι media στον κάδο: ' + (S.getProperty('TIDY_FOLDERS') || 0) +
        '\n\nΤίποτα δεν σβήστηκε οριστικά· ο κάδος του Drive τα κρατάει 30 ημέρες.');
      ['TIDY_STARTED', 'TIDY_MOVED', 'TIDY_DUPS', 'TIDY_FOLDERS'].forEach(function (k) { S.deleteProperty(k); });
      roots.forEach(function (r) { S.deleteProperty('TIDY_FILES_' + r.getName()); });
      console.log('Έτοιμο.');
    } else if (Date.now() - Number(S.getProperty('TIDY_STARTED')) > TIDY_.GIVE_UP_H * 3600 * 1000) {
      tidyStopTrigger_();
      S.deleteProperty('TIDY_STARTED');
      notify_('Τακτοποίηση φακέλων IG: σταμάτησε', 'Δεν ολοκληρώθηκε μέσα σε ' + TIDY_.GIVE_UP_H + ' ώρες. Δες το αρχείο καταγραφής εκτελέσεων του Apps Script. Ό,τι έγινε μέχρι τώρα μένει.');
    }
  } finally {
    S.deleteProperty('TIDY_BUSY');
  }
}

// ------------------------------------------------------------------ helpers
function tidyRoots_() {
  const it = DriveApp.getFoldersByName(TIDY_.ROOT);
  if (!it.hasNext()) return [];
  const out = [], sub = it.next().getFolders();
  while (sub.hasNext()) { const f = sub.next(); if (f.getName().indexOf(TIDY_.PREFIX) === 0) out.push(f); }
  return out;
}

// Φθηνός έλεγχος (χωρίς να διαβαστεί όλο το δέντρο): ποιοι φάκελοι IG έχουν αρχεία που ανέβηκαν πρόσφατα.
function tidyBusyRoots_(rootIds) {
  const since = new Date(Date.now() - TIDY_.QUIET_MIN * 60000).toISOString();
  const url = TIDY_.API + '?pageSize=50&orderBy=createdTime%20desc&q=' +
    encodeURIComponent("createdTime > '" + since + "' and trashed = false and 'me' in owners and mimeType != '" + TIDY_.FOLDER + "'") +
    '&fields=' + encodeURIComponent('files(id,parents)');
  const recent = tidyJson_(tidyGet_(url)).files || [];
  const busy = {}, parentOf = {};
  recent.slice(0, 15).forEach(function (f) {
    let p = (f.parents || [])[0];
    for (let d = 0; p && d < 8; d++) {
      if (rootIds.indexOf(p) >= 0) { busy[p] = true; return; }
      if (!(p in parentOf)) {
        const u = TIDY_.API + '/' + p + '?fields=parents';
        parentOf[p] = ((tidyJson_(tidyGet_(u)).parents) || [])[0] || '';
      }
      p = parentOf[p];
    }
  });
  return busy;
}

function tidyGet_(url) {
  return UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
}

function tidyReq_(method, url, body) {
  const r = { url: url, method: method, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
  if (body) { r.contentType = 'application/json'; r.payload = JSON.stringify(body); }
  return r;
}

function tidyJson_(res) {
  if (res.getResponseCode() >= 300) throw new Error('Drive API ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText() || '{}');
}

function tidyListUrl_(folderId, pageToken) {
  return TIDY_.API + '?pageSize=1000&q=' + encodeURIComponent("'" + folderId + "' in parents and trashed = false") +
    '&fields=' + encodeURIComponent('nextPageToken,files(id,name,mimeType,md5Checksum,size,createdTime,ownedByMe)') +
    (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
}

// Διαβάζει όλο το δέντρο (ανά επίπεδο, 20 φάκελοι παράλληλα).
function tidyWalk_(rootId) {
  const root = { id: rootId, name: '', folder: true, children: [], path: [] };
  const files = [];
  let level = [root];
  while (level.length) {
    const next = [];
    for (let i = 0; i < level.length; i += 20) {
      let todo = level.slice(i, i + 20).map(function (n) { return { node: n, tok: '' }; });
      while (todo.length) {
        const res = UrlFetchApp.fetchAll(todo.map(function (t) { return tidyReq_('get', tidyListUrl_(t.node.id, t.tok)); }));
        const again = [];
        res.forEach(function (r, k) {
          const t = todo[k], j = tidyJson_(r);
          (j.files || []).forEach(function (x) {
            const c = { id: x.id, name: x.name, folder: x.mimeType === TIDY_.FOLDER, children: [], parent: t.node.id, mine: !!x.ownedByMe,
              md5: x.md5Checksum || '', size: x.size || '', created: x.createdTime, path: t.node.path.concat([x.name]) };
            t.node.children.push(c);
            (c.folder ? next : files).push(c);
          });
          if (j.nextPageToken) again.push({ node: t.node, tok: j.nextPageToken });
        });
        todo = again;
      }
    }
    level = next;
  }
  return { root: root, files: files };
}

// Σχέδιο ένωσης: ό,τι είναι μέσα σε media* πάει στη ρίζα· φάκελος που υπάρχει ήδη ενώνεται, αλλιώς μετακινείται ολόκληρος.
function tidyPlan_(root) {
  const ops = [];
  const parts = root.children.filter(function (c) { return c.folder && TIDY_.PART.test(c.name); })
    .sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  function merge(src, dst) {
    src.children.slice().forEach(function (c) {
      if (c.folder) {
        const ex = dst.children.filter(function (d) {
          return d.folder && d !== c && d.name === c.name && !(dst === root && TIDY_.PART.test(d.name));
        })[0];
        if (ex) { merge(c, ex); return; }
      }
      ops.push({ type: 'move', id: c.id, from: src.id, to: dst.id });
      dst.children.push(c);
    });
    src.children = [];
  }
  parts.forEach(function (p) { merge(p, root); });
  return { ops: ops, parts: parts };
}

// Ακριβή διπλότυπα: ίδιο MD5 (ή, αν λείπει, ίδιο όνομα και μέγεθος). Κρατιέται το αντίγραφο στον πιο «χρήσιμο»
// φάκελο (posts → reels → stories → igtv → other → archived_posts), μετά κατά διαδρομή.
const TIDY_RANK_ = ['posts', 'reels', 'stories', 'igtv', 'other', 'archived_posts'];
function tidyRank_(f) { const i = TIDY_RANK_.indexOf(f.path[0]); return i < 0 ? 99 : i; }

function tidyDups_(files) {
  const groups = {};
  files.forEach(function (f) {
    const k = f.md5 ? 'm:' + f.md5 : 'n:' + f.name + '|' + f.size;
    (groups[k] = groups[k] || []).push(f);
  });
  let out = [];
  Object.keys(groups).forEach(function (k) {
    const g = groups[k];
    if (g.length < 2) return;
    g.sort(function (a, b) {
      const ra = tidyRank_(a), rb = tidyRank_(b);
      if (ra !== rb) return ra - rb;
      const x = a.path.join('/'), y = b.path.join('/'); return x < y ? -1 : x > y ? 1 : 0;
    });
    out = out.concat(g.slice(1));
  });
  return out;
}

function tidyExec_(ops, deadline) {
  let ok = 0;
  for (let i = 0; i < ops.length; i += 20) {
    if (Date.now() > deadline) break;
    const chunk = ops.slice(i, i + 20);
    const res = UrlFetchApp.fetchAll(chunk.map(function (o) {
      if (o.type === 'move') return tidyReq_('patch', TIDY_.API + '/' + o.id + '?addParents=' + o.to + '&removeParents=' + o.from + '&fields=id', {});
      if (o.type === 'unlink') return tidyReq_('patch', TIDY_.API + '/' + o.id + '?removeParents=' + o.from + '&fields=id', {});
      return tidyReq_('patch', TIDY_.API + '/' + o.id + '?fields=id', { trashed: true });
    }));
    res.forEach(function (r) {
      if (r.getResponseCode() < 300) ok++;
      else console.log('Drive API ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
    });
  }
  return { ok: ok };
}

function tidyCount_(S, key, n) { if (n) S.setProperty(key, String(Number(S.getProperty(key) || 0) + n)); }

function tidyEnsureTrigger_() {
  const has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'tidyIgExports'; });
  if (!has) ScriptApp.newTrigger('tidyIgExports').timeBased().everyMinutes(10).create();
}

function tidyStopTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'tidyIgExports') ScriptApp.deleteTrigger(t);
  });
}

// ------------------------------------------------------------------ διπλότυπα σε όλο το «ΥΛΙΚΟ SOCIAL MEDIA»
const DEDUPE_SKIP_ = ['REELS'];   // αρχεία που φτιάχνει το ίδιο το σύστημα· δεν πειράζονται

function setupDailyDedupe() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dedupeMaterial') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dedupeMaterial').timeBased().everyDays(1).atHour(4).create();
  console.log('Έτοιμο: ο έλεγχος διπλοτύπων θα τρέχει κάθε βράδυ. Τρέχει και τώρα μία φορά…');
  dedupeMaterial();
}

function dedupeMaterial() {
  const it = DriveApp.getFoldersByName(TIDY_.ROOT);
  if (!it.hasNext()) throw new Error('Δεν βρέθηκε ο φάκελος «' + TIDY_.ROOT + '».');
  const deadline = Date.now() + TIDY_.BUDGET_MS;
  const files = tidyWalk_(it.next().getId()).files.filter(function (f) {
    return f.md5 && DEDUPE_SKIP_.indexOf(f.path[0]) < 0;
  });
  const groups = {};
  files.forEach(function (f) { const k = f.md5 + '|' + f.size; (groups[k] = groups[k] || []).push(f); });
  const ops = [], lines = [];
  Object.keys(groups).forEach(function (k) {
    const g = groups[k];
    if (g.length < 2) return;
    g.sort(function (a, b) {
      if (a.mine !== b.mine) return a.mine ? -1 : 1;
      return new Date(a.created) - new Date(b.created);
    });
    const keep = g[0];
    g.slice(1).forEach(function (f) {
      ops.push(f.mine ? { type: 'trash', id: f.id } : { type: 'unlink', id: f.id, from: f.parent });
      lines.push('• ' + f.path.join(' / ') + '  (ίδιο με: ' + keep.path.join(' / ') + ')');
    });
  });
  if (!ops.length) { console.log('Κανένα διπλότυπο σε ' + files.length + ' αρχεία.'); return 0; }
  const x = tidyExec_(ops, deadline);
  console.log('Διπλότυπα: ' + x.ok + '/' + ops.length + ' αφαιρέθηκαν (σε ' + files.length + ' αρχεία).');
  notify_('Διπλότυπα στο ΥΛΙΚΟ SOCIAL MEDIA: ' + x.ok,
    'Βρέθηκαν και αφαιρέθηκαν ' + x.ok + ' αρχεία που υπήρχαν ήδη (ίδιο ακριβώς περιεχόμενο):\n\n' +
    lines.slice(0, 60).join('\n') + (lines.length > 60 ? '\n… και άλλα ' + (lines.length - 60) : '') +
    '\n\nΤα δικά σου πήγαν στον κάδο του Drive (30 ημέρες). Όσα είχε ανεβάσει άλλος βγήκαν μόνο από τον φάκελο.' +
    (x.ok < ops.length ? '\n\nΚάποια δεν αφαιρέθηκαν (' + (ops.length - x.ok) + '), θα ξαναδοκιμάσει αύριο.' : ''));
  return x.ok;
}
