"""Posts LinkedIn (προσωπικό προφίλ του Πέτρου) στο queue.json.

Χρήση:  python3 linkedin_queue.py <posts.json> <repo_dir>

posts.json = λίστα από:
  {"date": "2026-11-24", "time": "08:45", "from": "NDT-2026-11-16-post", "text": "…"}
  - from: id ενός post της ουράς (Instagram) από όπου παίρνει τις ΙΔΙΕΣ εικόνες / το ίδιο βίντεο.
          Χωρίς from → post μόνο με κείμενο (TEXT).
  - slides: προαιρετικό, π.χ. [0, 1, 2] για μόνο κάποιες εικόνες του carousel.
  - title: προαιρετικό, τίτλος βίντεο.
Κάθε post γίνεται item  <BRAND>-<date>-li  στο linkedin.json του repo (ΧΩΡΙΣΤΑ από το queue.json, ώστε μια
παλιά έκδοση του Apps Script να μην τα δει ποτέ ως posts Instagram). Πάνε ΜΟΝΟ στο LinkedIn (όχι Instagram/
Facebook, ούτε story, ούτε Drive). Το Apps Script τα δημοσιεύει όταν υπάρχει LI_TOKEN.

Κανόνες κειμένου LinkedIn: ≤ 3000 χαρακτήρες (καλύτερα < 1300), οι 2 πρώτες γραμμές είναι το «άγκιστρο»
(μετά κόβεται σε «…περισσότερα»), 3–5 hashtags στο τέλος, χωρίς @mentions και χωρίς links στο κείμενο.
CTA πάντα με email, ΟΧΙ μηνύματα στο LinkedIn (ο Πέτρος δεν παρακολουθεί τα εισερχόμενα του LinkedIn, 21/11).
Η υπογραφή (email + σελίδα NDT στο LinkedIn) μπαίνει ΑΥΤΟΜΑΤΑ πριν τα hashtags· "footer": false για εξαίρεση.
"""
import json, re, sys
from datetime import datetime
from zoneinfo import ZoneInfo

ATH = ZoneInfo('Europe/Athens')
MAX_CHARS = 3000
MAX_TAGS = 5
CONTACT_EMAIL = 'info@newdjsteam.gr'
PAGE_URL = 'https://www.linkedin.com/company/newdjsteam'
FOOTER = f'📩 Για προσφορά ή ερωτήσεις: {CONTACT_EMAIL}\n🔗 Η σελίδα της NDT στο LinkedIn: {PAGE_URL}'


def with_footer(text):
    """Υπογραφή πριν την τελευταία παράγραφο αν είναι hashtags, αλλιώς στο τέλος."""
    parts = text.rstrip().split('\n\n')
    if len(parts) > 1 and parts[-1].lstrip().startswith('#'):
        return '\n\n'.join(parts[:-1] + [FOOTER, parts[-1]])
    return text.rstrip() + '\n\n' + FOOTER


def at(d, hm):
    return datetime.fromisoformat(f'{d}T{hm}:00').replace(tzinfo=ATH).isoformat()


def build(posts, queue_items):
    src = {i['id']: i for i in queue_items}
    out = []
    for p in posts:
        where = f"{p.get('date')} {p.get('from', 'TEXT')}"
        text = p['text'].strip()
        assert len(text) <= MAX_CHARS, f'{where}: {len(text)} χαρακτήρες (όριο {MAX_CHARS})'
        tags = re.findall(r'#\w+', text)
        assert len(tags) <= MAX_TAGS, f'{where}: {len(tags)} hashtags (το πολύ {MAX_TAGS})'
        assert '@' not in text, f'{where}: χωρίς @ (τα mentions δεν γίνονται από εδώ· το email μπαίνει με την υπογραφή)'
        assert 'http' not in text, f'{where}: χωρίς links στο κείμενο (η σελίδα της NDT μπαίνει με την υπογραφή)'
        assert 'μήνυμα' not in text, f'{where}: CTA με email, όχι «μήνυμα» στο LinkedIn'
        if p.get('footer', True):
            text = with_footer(text)
        assert len(text) <= MAX_CHARS, f'{where}: {len(text)} χαρακτήρες με την υπογραφή (όριο {MAX_CHARS})'
        it = {'account': p.get('account', 'NDT'), 'platforms': ['linkedin'],
              'publish_at': at(p['date'], p.get('time', '08:45')), 'caption': text}
        if p.get('from'):
            s = src.get(p['from'])
            assert s, f"{where}: δεν υπάρχει στην ουρά το {p['from']}"
            it['account'] = s['account']
            it['li_from'] = s['id']
            if s['type'] == 'REEL':
                it['type'], it['video'] = 'REEL', s['video']
                if p.get('title'):
                    it['title'] = p['title']
            else:
                imgs = s.get('images') or []
                if p.get('slides') is not None:
                    imgs = [imgs[k] for k in p['slides']]
                assert 1 <= len(imgs) <= 20, f'{where}: {len(imgs)} εικόνες (1–20)'
                it['type'] = 'CAROUSEL' if len(imgs) > 1 else 'IMAGE'
                it['images'] = imgs
        else:
            it['type'] = 'TEXT'
        it['id'] = f"{it['account']}-{p['date']}-li"
        out.append(it)
    ids = [i['id'] for i in out]
    assert len(ids) == len(set(ids)), 'δύο posts LinkedIn την ίδια μέρα για το ίδιο brand'
    return out


if __name__ == '__main__':
    posts_path, repo_dir = sys.argv[1], sys.argv[2]
    src = json.load(open(f'{repo_dir}/queue.json'))['items']
    qpath = f'{repo_dir}/linkedin.json'
    try:
        q = json.load(open(qpath))
    except FileNotFoundError:
        q = {'version': 1, 'timezone': 'Europe/Athens', 'items': []}
    new = build(json.load(open(posts_path)), src)
    ids = {i['id'] for i in new}
    q['items'] = [i for i in q['items'] if i['id'] not in ids] + [
        {k: i[k] for k in ('id', 'account', 'type', 'platforms', 'publish_at', 'images', 'video', 'title', 'caption', 'li_from') if k in i}
        for i in new]
    q['items'].sort(key=lambda i: i['publish_at'])
    with open(qpath, 'w') as f:
        json.dump(q, f, ensure_ascii=False, indent=1)
        f.write('\n')
    for i in new:
        first = i['caption'].split('\n')[0][:70]
        print(f"{i['publish_at'][:16]}  {i['type']:8} {len(i['caption']):5} χαρ.  {first}")
    print(len(new), 'posts LinkedIn·', len(q['items']), 'συνολικά στο linkedin.json')
