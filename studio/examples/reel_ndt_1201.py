"""NDT reel 1/12: από το στήσιμο στο showtime (street party). 9:16, ~20s, H.264/AAC."""
import subprocess, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from engine import FONTS, NDT_CSS, img, e

W, H, FPS = 1080, 1920, 30
A = Path('/home/claude/ig/assets'); V = Path('/home/claude/dl/vid')
TMP = Path('/home/claude/ig/out/reel_tmp'); TMP.mkdir(parents=True, exist_ok=True)
OUT = Path('/home/claude/ig/out/week3/NDT'); OUT.mkdir(parents=True, exist_ok=True)

def page(inner, transparent=True):
    css = NDT_CSS % dict(w=W, h=H, pos='center')
    if transparent:
        css += 'body{background:transparent!important}'
    return f"<!doctype html><html lang='el'><head><meta charset='utf-8'><style>{FONTS}{css}</style></head><body>{inner}</body></html>"

SHADOW = "text-shadow:0 4px 24px rgba(0,0,0,.55)"
def overlay(tag, title):
    return page(f"""
    <div style='position:absolute;left:0;right:0;bottom:0;height:820px;background:linear-gradient(180deg,rgba(13,13,15,0),rgba(13,13,15,.75))'></div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='top:150px;left:64px;height:130px'>
    <div style='position:absolute;left:72px;right:200px;bottom:470px'>
      <div class='tag' style='font-size:40px;margin-bottom:18px;{SHADOW}'>{e(tag)}</div>
      <div class='h' style='font-size:150px;{SHADOW}'>{e(title)}</div>
      <div class='bar' style='margin-top:34px'></div>
    </div>""")

END = page(f"""<div style='position:absolute;inset:0;background:#FF6A00'></div>
  <div style='position:absolute;left:72px;right:120px;top:560px;color:#0D0D0F'>
    <div class='h' style='font-size:150px'>Ο Δεκέμβρης είναι ο μήνας των events</div>
    <div style='width:90px;height:12px;background:#0D0D0F;margin:50px 0'></div>
    <div style='font-size:62px;font-weight:500'>Καλό μήνα από την NDT</div>
  </div>
  <img class='logo' src='{img('ndt_logo_black.png')}' style='bottom:420px;left:72px;height:220px'>""", transparent=False)

COVER = page(f"""<div class='bg' style="background-image:url('{img('ndt_street_djs_lights.jpg')}');background-position:center 40%"></div>
  <div style='position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,13,15,.2),rgba(13,13,15,.55) 45%,rgba(13,13,15,.55) 70%,rgba(13,13,15,.2))'></div>
  <img class='logo' src='{img('ndt_logo_dark.png')}' style='top:150px;left:64px;height:150px'>
  <div style='position:absolute;left:72px;right:72px;top:700px'>
    <div class='tag' style='font-size:40px;margin-bottom:22px'>Behind the scenes</div>
    <div class='h' style='font-size:156px;{SHADOW}'>Από το στήσιμο στο showtime</div>
    <div class='bar' style='margin-top:40px'></div>
  </div>""", transparent=False)

def render(docs):
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': W, 'height': H})
        for name, doc, transparent in docs:
            hp = TMP / (name + '.html'); hp.write_text(doc, encoding='utf-8')
            pg.goto(f'file://{hp}'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(150)
            pg.screenshot(path=str(TMP / name), omit_background=transparent, type='png' if name.endswith('.png') else 'jpeg',
                          **({} if name.endswith('.png') else {'quality': 93}))
        b.close()

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr[-2000:])

ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', str(FPS)]

def photo_seg(name, photo, dur, ov, focus_y=0.5):
    n = int(dur * FPS)
    # cover-crop to 9:16 at 2x, then slow zoom-in towards the focus point
    vf = (f"scale={2*W}:{2*H}:force_original_aspect_ratio=increase,crop={2*W}:{2*H}:(iw-{2*W})/2:(ih-{2*H})*{focus_y},"
          f"zoompan=z='1+0.07*on/{n}':x='iw/2-(iw/zoom/2)':y='ih*{focus_y}-(ih/zoom*{focus_y})':d={n}:s={W}x{H}:fps={FPS},setsar=1[v];"
          f"[1]format=rgba,fade=in:st=0.1:d=0.35:alpha=1[o];[v][o]overlay=0:0:shortest=1")
    run(['ffmpeg', '-y', '-v', 'error', '-loop', '1', '-i', str(A / photo), '-loop', '1', '-i', str(TMP / ov),
         '-filter_complex', vf, '-t', str(dur), *ENC, '-an', str(TMP / name)])

def video_seg(name, src, start, dur, ov=None):
    base = f"[0]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},eq=saturation=1.08:contrast=1.04"
    if ov:
        fc = base + f"[v];[1]format=rgba,fade=in:st=0.1:d=0.35:alpha=1[o];[v][o]overlay=0:0:shortest=1"
        ins = ['-ss', str(start), '-t', str(dur), '-i', str(V / src), '-loop', '1', '-t', str(dur), '-i', str(TMP / ov)]
    else:
        fc = base
        ins = ['-ss', str(start), '-t', str(dur), '-i', str(V / src)]
    run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', fc, '-t', str(dur), *ENC, '-an', str(TMP / name)])

def still_seg(name, image, dur):
    run(['ffmpeg', '-y', '-v', 'error', '-loop', '1', '-i', str(TMP / image), '-vf', f'scale={W}:{H},setsar=1,fade=in:st=0:d=0.25',
         '-t', str(dur), *ENC, '-an', str(TMP / name)])

if __name__ == '__main__':
    render([('ov1.png', overlay('Πρωί', 'Στήσιμο'), True), ('ov2.png', overlay('01', 'Ήχος'), True),
            ('ov3.png', overlay('02', 'Φως'), True), ('ov4.png', overlay('Βράδυ', 'Showtime'), True),
            ('end.jpg', END, False), ('cover.jpg', COVER, False)])
    segs = []
    photo_seg('s1.mp4', 'ndt_crew_ladder.jpg', 2.2, 'ov1.png', 0.25); segs.append(('s1.mp4', 2.2))
    photo_seg('s2.mp4', 'ndt_street_array_sub_day.jpg', 2.2, 'ov2.png', 0.4); segs.append(('s2.mp4', 2.2))
    photo_seg('s3.mp4', 'ndt_street_ledbars_day.jpg', 2.2, 'ov3.png', 0.3); segs.append(('s3.mp4', 2.2))
    video_seg('s4.mp4', 'IMG_1786.MOV', 6.6, 4.0, 'ov4.png'); segs.append(('s4.mp4', 4.0))
    video_seg('s5.mp4', 'IMG_1795.MOV', 1.5, 4.0); segs.append(('s5.mp4', 4.0))
    video_seg('s6.mp4', 'IMG_1796.MOV', 9.0, 3.0); segs.append(('s6.mp4', 3.0))
    still_seg('s7.mp4', 'end.jpg', 2.6); segs.append(('s7.mp4', 2.6))
    total = sum(d for _, d in segs)
    (TMP / 'list.txt').write_text(''.join(f"file '{TMP / n}'\n" for n, _ in segs))
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(TMP / 'list.txt'), '-c', 'copy', str(TMP / 'video.mp4')])
    # ήχος: ο αρχικός ήχος του DJ clip (IMG_1786) σε όλο το reel, από το 0 — έτσι το κομμάτι 4 είναι σε συγχρονισμό
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(TMP / 'video.mp4'), '-i', str(V / 'IMG_1786.MOV'),
         '-filter_complex', f"[1:a]atrim=0:{total},asetpts=PTS-STARTPTS,apad=whole_dur={total},afade=t=in:st=0:d=0.4,afade=t=out:st={total-1.6}:d=1.6,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]",
         '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-t', str(total),
         '-movflags', '+faststart', str(OUT / '2026-12-01_reel.mp4')])
    os.replace(TMP / 'cover.jpg', OUT / '2026-12-01_reel_cover.jpg')
    print('reel', round(total, 1), 's')
