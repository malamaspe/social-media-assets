"""Reel του social media manager → έτοιμο για την ουρά (απόφαση Πέτρου 21/11).

Ο SMM ανεβάζει τελικά mp4 στο Drive «ΥΛΙΚΟ SOCIAL MEDIA/ΝΕΑ REELS SMM/<NDT|AMAZE>».
Κάθε Παρασκευή είναι ενός brand, εναλλάξ: NDT 18/12/2026, AMAZE 25/12, NDT 1/1/2027 κ.ο.κ.
Το reel του SMM παίρνει τη θέση του post της ημέρας για το brand του και βγαίνει ΠΑΝΤΑ στις 15:00
(και στα δύο brands, απόφαση Πέτρου 21/11· η ώρα μπαίνει από το make_queue.py, SMM_TIME).

Χρήση:  python3 smm_reel.py <video.mp4> <NDT|AMAZE> <repo_root> <out_dir> [--from YYYY-MM-DD] [--date YYYY-MM-DD]
  - Διαλέγει την επόμενη Παρασκευή του brand (από --from, προεπιλογή σήμερα) που δεν έχει ήδη reel SMM στην ουρά,
    ή την --date (πρέπει να είναι Παρασκευή του brand).
  - Γράφει <out_dir>/<BRAND>/<ημ/νία>_reel.mp4 (+ _reel_cover.jpg). Ξανακωδικοποιεί ΜΟΝΟ αν χρειάζεται:
    όχι H.264/AAC, όχι 1080×1920, πάνω από 45 MB (όριο Apps Script 50 MB για Drive/LinkedIn) ή ένταση
    εκτός -17…-11 LUFS (στόχος -14).
  - Τυπώνει JSON με ημερομηνία, διάρκεια και "story": false αν είναι πάνω από 60″ (όριο story).
Μετά: captions.json στο <out_dir> με '<BRAND>|<ημ/νία>' (λεζάντα) και '<BRAND>|<ημ/νία>|reel'
({"source": "smm", "title", "yt_title", "yt_description", "tiktok_caption", "yt_tags"}) και
`python3 make_queue.py <out_dir> <repo_root> auto` → αντικαθιστά το post <BRAND>-<ημ/νία>-post.
"""
import argparse, json, os, re, subprocess, sys
from datetime import date, timedelta

ANCHOR = date(2026, 12, 18)          # Παρασκευή NDT· μετά εναλλάξ ανά εβδομάδα
MAX_MB = 45
STORY_MAX_S = 60


def brand_of(friday):
    assert friday.weekday() == 4, f'{friday} δεν είναι Παρασκευή'
    return 'NDT' if ((friday - ANCHOR).days // 7) % 2 == 0 else 'AMAZE'


def smm_fridays(repo):
    q = json.load(open(f'{repo}/queue.json'))
    return {i['publish_at'][:10] for i in q['items'] if i.get('type') == 'REEL' and i.get('source') == 'smm'}


def next_friday(brand, start, taken):
    d = start + timedelta(days=(4 - start.weekday()) % 7)
    while d < ANCHOR or brand_of(d) != brand or d.isoformat() in taken:
        d += timedelta(days=7)
    return d


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
    rot = 0
    for sd in v.get('side_data_list', []):
        rot = int(sd.get('rotation', 0) or 0)
    w, h = int(v['width']), int(v['height'])
    if abs(rot) in (90, 270):
        w, h = h, w
    return {'w': w, 'h': h, 'vcodec': v['codec_name'], 'acodec': a['codec_name'] if a else None,
            'dur': float(j['format']['duration']), 'mb': os.path.getsize(path) / 1e6}


def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return float(m[-1]) if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('brand', choices=['NDT', 'AMAZE'])
    ap.add_argument('repo'); ap.add_argument('out')
    ap.add_argument('--from', dest='start'); ap.add_argument('--date')
    a = ap.parse_args()
    taken = smm_fridays(a.repo)
    if a.date:
        d = date.fromisoformat(a.date)
        assert brand_of(d) == a.brand, f'{d} είναι Παρασκευή {brand_of(d)}, όχι {a.brand}'
    else:
        d = next_friday(a.brand, date.fromisoformat(a.start) if a.start else date.today(), taken)
    info = probe(a.video)
    loud = lufs(a.video) if info['acodec'] else None
    notes = []
    if info['w'] * 16 != info['h'] * 9:
        notes.append(f"όχι 9:16 ({info['w']}×{info['h']}): μπαίνει σε 1080×1920 με μαύρες λωρίδες")
    if not info['acodec']:
        notes.append('ΧΩΡΙΣ ήχο')
    need = (info['vcodec'] != 'h264' or info['acodec'] not in (None, 'aac') or (info['w'], info['h']) != (1080, 1920)
            or info['mb'] > MAX_MB or (loud is not None and not -17 <= loud <= -11))
    dst_dir = f'{a.out}/{a.brand}'
    os.makedirs(dst_dir, exist_ok=True)
    dst = f'{dst_dir}/{d.isoformat()}_reel.mp4'
    if need:
        # bitrate ώστε να χωράει στα 45 MB (με περιθώριο), αλλιώς ποιότητα crf 20
        kbps = int((MAX_MB * 8000 * 0.92) / max(info['dur'], 1)) - 128
        vf = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30'
        cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', a.video, '-vf', vf,
               '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-maxrate', f'{min(kbps, 12000)}k',
               '-bufsize', f'{2 * min(kbps, 12000)}k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
        if info['acodec']:
            cmd += ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000']
        subprocess.run(cmd + [dst], check=True)
        notes.append('ξανακωδικοποιήθηκε (1080×1920, H.264/AAC, -14 LUFS, ≤45 MB)')
    else:
        subprocess.run(['cp', a.video, dst], check=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', str(min(1.0, info['dur'] / 2)),
                    '-i', dst, '-frames:v', '1', '-q:v', '3', dst.replace('_reel.mp4', '_reel_cover.jpg')], check=True)
    out = probe(dst)
    res = {'date': d.isoformat(), 'brand': a.brand, 'file': dst, 'duration_s': round(out['dur'], 1),
           'mb': round(out['mb'], 1), 'source_lufs': loud, 'notes': notes}
    if out['dur'] > STORY_MAX_S:
        res['story'] = False
        notes.append(f'πάνω από {STORY_MAX_S}″: ΔΕΝ μπαίνει σε story (βάλε "story": false στο item)')
    if out['dur'] < 3:
        sys.exit('Κάτω από 3″: το Instagram δεν το δέχεται ως reel.')
    print(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
