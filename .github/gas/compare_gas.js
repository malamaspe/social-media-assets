// Συγκρίνει δύο φακέλους με κώδικα Apps Script (π.χ. το live με το repo).
//   node tools/compare_gas.js <live> <repo> [--github-output changed]
// Το «Κώδικας.gs» του editor λογίζεται ίδιο με το «Code.gs» του repo. Αγνοούνται διαφορές
// σε αλλαγές γραμμής (CRLF/LF), κενά στο τέλος του αρχείου και μορφοποίηση του appsscript.json.
// Exit 0 = ίδια, 1 = διαφορετικά (με λίστα). Με --github-output <όνομα> γράφει <όνομα>=true|false
// στο GITHUB_OUTPUT και τελειώνει πάντα με 0.
const fs = require('fs'), path = require('path');
const [a, b] = process.argv.slice(2, 4);
const outIdx = process.argv.indexOf('--github-output');
const outName = outIdx > 0 ? process.argv[outIdx + 1] : null;
const ALIAS = { 'Κώδικας': 'Code' };
const key = f => { const ext = path.extname(f); let base = path.basename(f, ext);
  base = ALIAS[base] || base; return base + (ext === '.js' ? '.gs' : ext); };
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : (v && typeof v === 'object')
  ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {}) : v;
const norm = (f, s) => {
  s = s.replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
  if (path.basename(f) === 'appsscript.json') { try { s = JSON.stringify(sortKeys(JSON.parse(s)), null, 2); } catch (e) {} }
  return s;
};
const read = d => {
  const m = {};
  fs.readdirSync(d).filter(f => /\.(gs|js|html|json)$/.test(f) && !f.startsWith('.')).forEach(f => {
    m[key(f)] = norm(f, fs.readFileSync(path.join(d, f), 'utf8'));
  });
  return m;
};
const A = read(a), B = read(b);
const diffs = [];
new Set([...Object.keys(A), ...Object.keys(B)]).forEach(k => {
  if (!(k in A)) diffs.push('+ ' + k + '  (υπάρχει μόνο στο ' + b + ')');
  else if (!(k in B)) diffs.push('− ' + k + '  (υπάρχει μόνο στο ' + a + ')');
  else if (A[k] !== B[k]) {
    const la = A[k].split('\n'), lb = B[k].split('\n');
    let i = 0; while (i < la.length && la[i] === lb[i]) i++;
    diffs.push('≠ ' + k + '  (πρώτη διαφορά στη γραμμή ' + (i + 1) + ')');
  }
});
if (outName) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT || '/dev/stdout', outName + '=' + (diffs.length ? 'true' : 'false') + '\n');
  console.log(diffs.length ? 'Διαφορές:\n' + diffs.join('\n') : 'Καμία διαφορά.');
  process.exit(0);
}
if (diffs.length) { console.log('✗ Διαφορές (' + a + ' ↔ ' + b + '):\n' + diffs.join('\n')); process.exit(1); }
console.log('✓ Ίδια: ' + Object.keys(A).sort().join(', '));
