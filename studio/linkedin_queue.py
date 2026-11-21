"""Posts LinkedIn (προσωπικό προφίλ του Πέτρου) στο queue.json.

Χρήση:  python3 linkedin_queue.py <posts.json> <repo_dir>

posts.json = λίστα από:
  {"date": "2026-11-24", "time": "08:45", "from": "NDT-2026-11-16-post", "text": "…"}
  - from: id ενός post της ουράς (Instagram) από όπου παίρνει τις ΙΔΙΕΣ εικόνες / το ίδιο βίντεο.
          Χωρίς from → post μόνο με κείμενο (TEXT).
  - slides: προαιρετικό, π.χ. [0, 1, 2] για μόνο κάποιες εικόνες του carousel.
  - title: προαιρετικό, τίτλος βίντεο.
Κάθε post γίνεται item  <BRAND>-<date>-li  με "platforms": ["linkedin"]: πάει ΜΟΝΟ στο LinkedIn
(όχι Instagram/Facebook, ούτε story, ούτε Drive). Το Apps Script το δημοσιεύει όταν υπάρχει LI_TOKEN.

Κανόνες κειμένου LinkedIn: ≤ 3000 χαρακτήρες (καλύτερα < 1300), οι 2 πρώτες γραμμές είναι το «άγκιστρο»
(μετά κόβεται σε «…περισσότερα»), 3–5 hashtags στο τέλος, χωρίς @mentions και χωρίς links στο κείμενο.
"""
import json, re, sys
from datetime import datetime
from zoneinfo import ZoneInfo

ATH = ZoneInfo('Europe/Athens')
MAX_CHARS = 3000
MAX_TAGS = 5


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
        assert '@' not in text, f'{where}: χωρίς @ (τα mentions δεν γίνονται από εδώ)'
        assert 'http' not in text, f'{where}: χωρίς links στο κείμενο'
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
    qpath = f'{repo_dir}/queue.json'
    q = json.load(open(qpath))
    new = build(json.load(open(posts_path)), q['items'])
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
    print(len(new), 'posts LinkedIn·', len(q['items']), 'συνολικά στην ουρά')
