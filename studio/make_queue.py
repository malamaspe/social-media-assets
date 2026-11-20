"""Build queue.json entries for a rendered week and copy media into the repo working tree."""
import json, glob, os, shutil, sys
from datetime import datetime
from zoneinfo import ZoneInfo
ATH = ZoneInfo('Europe/Athens')
REPO_RAW = 'https://raw.githubusercontent.com/malamaspe/social-media-assets/main/'
TIMES = {'NDT': ('20:00', '20:05'), 'AMAZE': ('21:00', '21:05')}
# Προαιρετικά κείμενα για YouTube Shorts / TikTok ανά reel, στο captions.json με κλειδί '<BRAND>|<YYYY-MM-DD>|reel'.
# Το Apps Script τα γράφει σε .txt δίπλα στο mp4, στον φάκελο Drive «ΥΛΙΚΟ SOCIAL MEDIA/REELS».
REEL_META = ('title', 'yt_title', 'yt_description', 'tiktok_caption', 'yt_tags')
# yt_tags: ετικέτες για το πεδίο «Ετικέτες» (Tags) του YouTube Studio, ΟΧΙ για την περιγραφή
# (πολλές λέξεις-κλειδιά στην περιγραφή = spam κατά τους κανόνες του YouTube).
# Όριο YouTube: 500 χαρακτήρες συνολικά· μετράνε τα κόμματα και +2 για κάθε ετικέτα με κενό.
YT_TAGS_MAX = 500

def yt_tags_len(tags):
    return sum(len(t) + (2 if ' ' in t else 0) for t in tags) + max(len(tags) - 1, 0)

def clean_tags(v, where):
    tags = [t.strip() for t in (v if isinstance(v, list) else str(v).split(',')) if t.strip()]
    seen, out = set(), []
    for t in tags:
        if t.lower() not in seen:
            seen.add(t.lower()); out.append(t)
    n = yt_tags_len(out)
    assert n <= YT_TAGS_MAX, f'{where}: yt_tags {n} χαρακτήρες (όριο YouTube {YT_TAGS_MAX})'
    return ', '.join(out)

def at(d, hm):
    """Ώρα Αθήνας με τη σωστή μετατόπιση (χειμερινή/θερινή ώρα)."""
    return datetime.fromisoformat(f'{d}T{hm}:00').replace(tzinfo=ATH).isoformat()

def build(week_dir, repo_dir, month_folder, skip_reels=False):
    """month_folder: e.g. 2026-11, or 'auto' to use each day's own month."""
    caps = json.load(open(f'{week_dir}/captions.json'))
    items = []
    for brand in ['NDT', 'AMAZE']:
        files = glob.glob(f'{week_dir}/{brand}/*.jpg') + glob.glob(f'{week_dir}/{brand}/*.mp4')
        days = sorted({os.path.basename(f)[:10] for f in files})
        for d in days:
            month = d[:7] if month_folder == 'auto' else month_folder
            dst = f'{repo_dir}/media/{month}/{brand}'
            os.makedirs(dst, exist_ok=True)
            url = lambda f: f'{REPO_RAW}media/{month}/{brand}/{os.path.basename(f)}'
            tp, ts = TIMES[brand]
            reel = f'{week_dir}/{brand}/{d}_reel.mp4'
            posts = sorted(glob.glob(f'{week_dir}/{brand}/{d}_post_*.jpg'))
            stories = sorted(glob.glob(f'{week_dir}/{brand}/{d}_story_*.jpg'))
            if os.path.exists(reel) and skip_reels:
                pass  # το reel μπαίνει αργότερα (π.χ. περιμένει μουσική)
            elif os.path.exists(reel):
                shutil.copy(reel, dst)
                it = {'id': f'{brand}-{d}-post', 'account': brand, 'type': 'REEL', 'publish_at': at(d, tp),
                      'video': url(reel), 'caption': caps[f'{brand}|{d}']}
                meta = caps.get(f'{brand}|{d}|reel') or {}
                it.update({k: meta[k] for k in REEL_META if meta.get(k)})
                if it.get('yt_tags'):
                    it['yt_tags'] = clean_tags(it['yt_tags'], f'{brand}|{d}|reel')
                cover = f'{week_dir}/{brand}/{d}_reel_cover.jpg'
                if os.path.exists(cover):
                    shutil.copy(cover, dst); it['cover'] = url(cover)
                items.append(it)
            elif posts:
                for p in posts:
                    shutil.copy(p, dst)
                items.append({'id': f'{brand}-{d}-post', 'account': brand, 'type': 'CAROUSEL' if len(posts) > 1 else 'IMAGE',
                              'publish_at': at(d, tp), 'images': [url(p) for p in posts], 'caption': caps[f'{brand}|{d}']})
            for s in stories:
                shutil.copy(s, dst)
                items.append({'id': f'{brand}-{d}-story', 'account': brand, 'type': 'STORY',
                              'publish_at': at(d, ts), 'images': [url(s)]})
    return items

if __name__ == '__main__':
    week_dir, repo_dir, month = sys.argv[1], sys.argv[2], sys.argv[3]
    qpath = f'{repo_dir}/queue.json'
    q = json.load(open(qpath)) if os.path.exists(qpath) else {'version': 1, 'timezone': 'Europe/Athens', 'items': []}
    new = build(week_dir, repo_dir, month, skip_reels=len(sys.argv) > 4 and sys.argv[4] == 'noreels')
    ids = {i['id'] for i in new}
    q['items'] = [i for i in q['items'] if i['id'] not in ids] + new
    q['items'].sort(key=lambda i: i['publish_at'])
    json.dump(q, open(qpath, 'w'), ensure_ascii=False, indent=1)
    print(len(new), 'items added;', len(q['items']), 'total')
