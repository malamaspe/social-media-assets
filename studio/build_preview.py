"""Build a mobile-friendly approval page for one week of content.
Usage: python3 build_preview.py <week_dir> <out_dir> "<title>" "<subtitle>" <notes_html_file>
"""
import sys, os, json, glob, html, re
from datetime import date
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_queue import load_times, times_for, SMM_TIME

week_dir, out_dir, title, subtitle, notes_file = sys.argv[1:6]
css = re.search(r'<style>(.*?)</style>', open('preview/index.html').read(), re.S).group(1)
caps = json.load(open(os.path.join(week_dir, 'captions.json')))
notes = open(notes_file).read() if os.path.exists(notes_file) else ''
times = load_times(week_dir)
DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή']
os.makedirs(os.path.join(out_dir, 'img'), exist_ok=True)

def thumb(path):
    name = os.path.basename(os.path.dirname(path)) + '_' + os.path.basename(path)
    im = Image.open(path); im.thumbnail((720, 1280)); im.save(os.path.join(out_dir, 'img', name), quality=82)
    return 'img/' + name

parts = []
for brand, label, color in [('NDT', 'NDT', '#FF6A00'), ('AMAZE', 'Amaze DJs', '#C8A97E')]:
    hdr = 'ώρες ανά μέρα (ώρες κοινού)' if times.get(brand) else ('post 20:00, story 20:05' if brand == 'NDT' else 'post 21:00, story 21:05')
    parts.append(f"<section id='{brand.lower()}'><h2 style='border-color:{color}'>{label} <span>· {hdr}</span></h2>")
    dates = sorted({os.path.basename(f)[:10] for f in glob.glob(f'{week_dir}/{brand}/*.jpg') + glob.glob(f'{week_dir}/{brand}/*.mp4')})
    for d in dates:
        posts = sorted(glob.glob(f'{week_dir}/{brand}/{d}_post_*.jpg'))
        story = sorted(glob.glob(f'{week_dir}/{brand}/{d}_story_*.jpg'))
        dt = date.fromisoformat(d)
        reel = f'{week_dir}/{brand}/{d}_reel.mp4'
        if os.path.exists(reel):
            import subprocess
            vname = f'{brand}_{d}_reel.mp4'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', reel, '-vf', 'scale=540:960', '-c:v', 'libx264', '-preset', 'veryfast',
                            '-crf', '26', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', os.path.join(out_dir, 'img', vname)], check=True)
            cov = f'{week_dir}/{brand}/{d}_reel_cover.jpg'
            poster = thumb(cov) if os.path.exists(cov) else ''
            kind = 'Reel'
            imgs = f"<video src='img/{vname}' poster='{poster}' controls playsinline preload='none' style='height:420px;aspect-ratio:9/16;border-radius:8px;background:#000'></video>"
        else:
            kind = f'Carousel · {len(posts)} slides' if len(posts) > 1 else 'Single'
            imgs = ''.join(f"<img src='{thumb(p)}' loading='lazy'>" for p in posts)
        st = ''.join(f"<div class='stw'><div class='lbl'>Story</div><img class='st' src='{thumb(s)}' loading='lazy'></div>" for s in story)
        cap = html.escape(caps.get(f'{brand}|{d}', ''))
        tp, ts = times_for(times, brand, d)
        if (caps.get(f'{brand}|{d}|reel') or {}).get('source') == 'smm':
            tp = SMM_TIME
        parts.append(f"<article><div class='day'>{DAYS[dt.weekday()]} {dt.day}/{dt.month} <em>{kind} · {tp} · story {ts}</em></div>"
                     f"<div class='row'><div class='car'>{imgs}</div>{st}</div>"
                     f"<details><summary>Λεζάντα</summary><pre>{cap}</pre></details></article>")
    parts.append('</section>')

page = f"""<!DOCTYPE html><html lang='el'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>{html.escape(title)}</title><style>{css}</style></head><body>
<header><h1>{html.escape(title)}</h1><p>{html.escape(subtitle)}</p></header>
<nav><a href='#ndt'>NDT</a><a href='#amaze'>Amaze DJs</a></nav>
{notes}
{''.join(parts)}
</body></html>"""
open(os.path.join(out_dir, 'index.html'), 'w').write(page)
print('ok', len(glob.glob(out_dir + '/img/*')))
