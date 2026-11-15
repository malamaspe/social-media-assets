"""Build queue.json entries for a rendered week and copy media into the repo working tree."""
import json, glob, os, shutil, sys
REPO_RAW = 'https://raw.githubusercontent.com/malamaspe/social-media-assets/main/'
TIMES = {'NDT': ('20:00', '20:05'), 'AMAZE': ('21:00', '21:05')}

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
                it = {'id': f'{brand}-{d}-post', 'account': brand, 'type': 'REEL', 'publish_at': f'{d}T{tp}:00+02:00',
                      'video': url(reel), 'caption': caps[f'{brand}|{d}']}
                cover = f'{week_dir}/{brand}/{d}_reel_cover.jpg'
                if os.path.exists(cover):
                    shutil.copy(cover, dst); it['cover'] = url(cover)
                items.append(it)
            elif posts:
                for p in posts:
                    shutil.copy(p, dst)
                items.append({'id': f'{brand}-{d}-post', 'account': brand, 'type': 'CAROUSEL' if len(posts) > 1 else 'IMAGE',
                              'publish_at': f'{d}T{tp}:00+02:00', 'images': [url(p) for p in posts], 'caption': caps[f'{brand}|{d}']})
            for s in stories:
                shutil.copy(s, dst)
                items.append({'id': f'{brand}-{d}-story', 'account': brand, 'type': 'STORY',
                              'publish_at': f'{d}T{ts}:00+02:00', 'images': [url(s)]})
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
