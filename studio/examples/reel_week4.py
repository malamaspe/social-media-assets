"""Reels εβδομάδας 4 (8/12): NDT «Συνέδριο. Πάρτι. Φεστιβάλ.» και Amaze «Party highlights». 9:16, ~20s."""
import subprocess, os, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from engine import FONTS, NDT_CSS, AM_CSS, img, e

W, H, FPS = 1080, 1920, 30
A = Path('/home/claude/ig/assets'); V = Path('/home/claude/dl/vid2')
TMP = Path('/home/claude/ig/out/reel_tmp4'); TMP.mkdir(parents=True, exist_ok=True)
OUTD = Path('/home/claude/ig/out/week4')
SHADOW = "text-shadow:0 4px 24px rgba(0,0,0,.55)"

def page(css, inner, transparent=True):
    css = css % dict(w=W, h=H, pos='center')
    if transparent:
        css += 'body{background:transparent!important}'
    return f"<!doctype html><html lang='el'><head><meta charset='utf-8'><style>{FONTS}{css}</style></head><body>{inner}</body></html>"

# ---------------- NDT
def n_ov(tag, title):
    return page(NDT_CSS, f"""
    <div style='position:absolute;left:0;right:0;bottom:0;height:820px;background:linear-gradient(180deg,rgba(13,13,15,0),rgba(13,13,15,.75))'></div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='top:150px;left:64px;height:130px'>
    <div style='position:absolute;left:72px;right:200px;bottom:470px'>
      <div class='tag' style='font-size:40px;margin-bottom:18px;{SHADOW}'>{e(tag)}</div>
      <div class='h' style='font-size:160px;{SHADOW}'>{e(title)}</div>
      <div class='bar' style='margin-top:34px'></div>
    </div>""")

N_END = page(NDT_CSS, f"""<div style='position:absolute;inset:0;background:#FF6A00'></div>
  <div style='position:absolute;left:72px;right:120px;top:520px;color:#0D0D0F'>
    <div class='h' style='font-size:150px'>Συνέδριο. Πάρτι. Φεστιβάλ.</div>
    <div style='width:90px;height:12px;background:#0D0D0F;margin:50px 0'></div>
    <div style='font-size:62px;font-weight:600'>Μία ομάδα για ήχο, φως και DJ.</div>
    <div style='font-size:50px;font-weight:500;margin-top:24px'>Ζήτα προσφορά με DM</div>
  </div>
  <img class='logo' src='{img('ndt_logo_black.png')}' style='bottom:400px;left:72px;height:220px'>""", transparent=False)

N_COVER = page(NDT_CSS, f"""<div class='bg' style="background-image:url('{img('ndt_mixer_tablet_party.jpg')}');background-position:center 60%"></div>
  <div style='position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,13,15,.2),rgba(13,13,15,.6) 40%,rgba(13,13,15,.6) 70%,rgba(13,13,15,.2))'></div>
  <img class='logo' src='{img('ndt_logo_dark.png')}' style='top:150px;left:64px;height:150px'>
  <div style='position:absolute;left:72px;right:72px;top:640px'>
    <div class='tag' style='font-size:40px;margin-bottom:22px'>Ένα event για κάθε περίσταση</div>
    <div class='h' style='font-size:170px;{SHADOW}'>Συνέδριο. Πάρτι. Φεστιβάλ.</div>
    <div class='bar' style='margin-top:40px'></div>
  </div>""", transparent=False)

# ---------------- AMAZE
def a_ov(gr, en, kicker=None):
    return page(AM_CSS, f"""
    <div style='position:absolute;left:0;right:0;bottom:0;height:900px;background:linear-gradient(180deg,rgba(20,26,46,0),rgba(20,26,46,.8))'></div>
    <img src='{img('amaze_ls_white.png')}' style='position:absolute;left:50%;transform:translateX(-50%);top:200px;height:80px'>
    <div style='position:absolute;left:90px;right:90px;bottom:440px;text-align:center'>
      {f"<div class='k' style='margin-bottom:26px;font-size:30px;{SHADOW}'>{e(kicker)}</div>" if kicker else ''}
      <div class='gr' style='font-size:118px;{SHADOW}'>{e(gr)}</div>
      <div class='en' style='font-size:64px;margin-top:14px;{SHADOW}'>{e(en)}</div>
    </div>""")

A_END = page(AM_CSS, f"""<div class='frame'></div>
  <div style='position:absolute;left:96px;right:96px;top:560px;text-align:center'>
    <div class='gr' style='font-size:112px'>Το πάρτι σας, όπως το ονειρευτήκατε</div>
    <div class='en' style='font-size:60px;margin-top:20px'>Your party, just as you imagined it</div>
    <div class='line' style='margin:50px auto'></div>
    <div class='body' style='font-size:50px'>Στείλτε μας μήνυμα</div>
    <div class='body' style='font-size:42px;color:#AFB4C6;font-style:italic;margin-top:10px'>Send us a message</div>
  </div>
  <img src='{img('amaze_sq_white.png')}' style='position:absolute;left:50%;transform:translateX(-50%);bottom:330px;height:220px'>""", transparent=False)

A_COVER = page(AM_CSS, f"""<div class='bg' style="background-image:url('{img('amaze_champagne_tower.jpg')}');background-position:center 40%"></div>
  <div class='shade'></div><div class='frame'></div>
  <img src='{img('amaze_ls_white.png')}' style='position:absolute;left:50%;transform:translateX(-50%);top:240px;height:80px'>
  <div style='position:absolute;left:90px;right:90px;bottom:420px;text-align:center'>
    <div class='k' style='margin-bottom:26px;font-size:30px'>Party highlights</div>
    <div class='gr' style='font-size:124px'>Οι στιγμές που θα θυμάστε</div>
    <div class='en' style='font-size:64px;margin-top:16px'>The moments you’ll remember</div>
  </div>""", transparent=False)

def render(docs):
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': W, 'height': H})
        for name, doc, transparent in docs:
            hp = TMP / (name + '.html'); hp.write_text(doc, encoding='utf-8')
            pg.goto(f'file://{hp}'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(200)
            pg.screenshot(path=str(TMP / name), omit_background=transparent, type='png' if name.endswith('.png') else 'jpeg',
                          **({} if name.endswith('.png') else {'quality': 93}))
        b.close()

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr[-2000:])

ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', str(FPS)]

def photo_seg(name, photo, dur, ov, focus_y=0.5):
    n = int(dur * FPS)
    vf = (f"scale={2*W}:{2*H}:force_original_aspect_ratio=increase,crop={2*W}:{2*H}:(iw-{2*W})/2:(ih-{2*H})*{focus_y},"
          f"zoompan=z='1+0.07*on/{n}':x='iw/2-(iw/zoom/2)':y='ih*{focus_y}-(ih/zoom*{focus_y})':d={n}:s={W}x{H}:fps={FPS},setsar=1[v];"
          f"[1]format=rgba,fade=in:st=0.1:d=0.35:alpha=1[o];[v][o]overlay=0:0:shortest=1")
    run(['ffmpeg', '-y', '-v', 'error', '-loop', '1', '-i', str(A / photo), '-loop', '1', '-i', str(TMP / ov),
         '-filter_complex', vf, '-t', str(dur), *ENC, '-an', str(TMP / name)])

def video_seg(name, src, start, dur, ov=None):
    base = f"[0]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},eq=saturation=1.08:contrast=1.04"
    if ov:
        fc = base + "[v];[1]format=rgba,fade=in:st=0.1:d=0.35:alpha=1[o];[v][o]overlay=0:0:shortest=1"
        ins = ['-ss', str(start), '-t', str(dur), '-i', str(V / src), '-loop', '1', '-t', str(dur), '-i', str(TMP / ov)]
    else:
        fc, ins = base, ['-ss', str(start), '-t', str(dur), '-i', str(V / src)]
    run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', fc, '-t', str(dur), *ENC, '-an', str(TMP / name)])

def still_seg(name, image, dur):
    run(['ffmpeg', '-y', '-v', 'error', '-loop', '1', '-i', str(TMP / image), '-vf', f'scale={W}:{H},setsar=1,fade=in:st=0:d=0.25',
         '-t', str(dur), *ENC, '-an', str(TMP / name)])

def assemble(prefix, segs, bed, bed_start, out):
    total = sum(d for _, d in segs)
    lst = TMP / f'{prefix}_list.txt'
    lst.write_text(''.join(f"file '{TMP / n}'\n" for n, _ in segs))
    vid = TMP / f'{prefix}_video.mp4'
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(vid)])
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(vid), '-i', str(V / bed),
         '-filter_complex', f"[1:a]atrim={bed_start}:{bed_start+total},asetpts=PTS-STARTPTS,apad=whole_dur={total},afade=t=in:st=0:d=0.4,afade=t=out:st={total-1.8}:d=1.8,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]",
         '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-t', str(total),
         '-movflags', '+faststart', str(out)])
    return total

def ndt():
    out = OUTD / 'NDT'; out.mkdir(parents=True, exist_ok=True)
    render([('n1.png', n_ov('01', 'Συνέδριο'), True), ('n2.png', n_ov('02', 'Πάρτι'), True),
            ('n3.png', n_ov('03', 'Υπαίθριο'), True), ('n4.png', n_ov('04', 'Live'), True),
            ('n5.png', n_ov('05', 'Φεστιβάλ'), True), ('n_end.jpg', N_END, False), ('n_cover.jpg', N_COVER, False)])
    segs = []
    photo_seg('ns1.mp4', 'ndt_conf_hall.jpg', 2.4, 'n1.png', 0.45); segs.append(('ns1.mp4', 2.4))
    video_seg('ns2.mp4', 'N_IMG_1701.MOV', 2.2, 3.0, 'n2.png'); segs.append(('ns2.mp4', 3.0))
    video_seg('ns3.mp4', 'N_IMG_0885.MOV', 2.0, 2.6, 'n3.png'); segs.append(('ns3.mp4', 2.6))
    video_seg('ns4.mp4', 'N_IMG_0894.MOV', 4.0, 2.6, 'n4.png'); segs.append(('ns4.mp4', 2.6))
    video_seg('ns5.mp4', 'N_IMG_1845.MOV', 8.0, 3.0, 'n5.png'); segs.append(('ns5.mp4', 3.0))
    t6 = sum(d for _, d in segs)  # ο τραγουδιστής σε συγχρονισμό με τον ήχο (bed από το 0)
    video_seg('ns6.mp4', 'N_IMG_1857.MOV', t6, 3.0); segs.append(('ns6.mp4', 3.0))
    still_seg('ns7.mp4', 'n_end.jpg', 2.8); segs.append(('ns7.mp4', 2.8))
    total = assemble('n', segs, 'N_IMG_1857.MOV', 0, out / '2026-12-08_reel.mp4')
    os.replace(TMP / 'n_cover.jpg', out / '2026-12-08_reel_cover.jpg')
    print('NDT reel', round(total, 1), 's')

def amaze():
    out = OUTD / 'AMAZE'; out.mkdir(parents=True, exist_ok=True)
    render([('a1.png', a_ov('Οι στιγμές που θα θυμάστε', 'The moments you’ll remember', 'Party highlights'), True),
            ('a_end.jpg', A_END, False), ('a_cover.jpg', A_COVER, False)])
    segs = []
    video_seg('as1.mp4', 'A_IMG_1997.MOV', 0.6, 3.0, 'a1.png'); segs.append(('as1.mp4', 3.0))
    video_seg('as2.mp4', 'A_IMG_1913.MOV', 2.0, 3.0); segs.append(('as2.mp4', 3.0))
    video_seg('as3.mp4', 'A_IMG_1998.MOV', 3.0, 2.5); segs.append(('as3.mp4', 2.5))
    video_seg('as4.mp4', 'A_IMG_1918.MOV', 0.5, 2.5); segs.append(('as4.mp4', 2.5))
    video_seg('as5.mp4', 'A_IMG_1666.MOV', 1.0, 2.5); segs.append(('as5.mp4', 2.5))
    video_seg('as6.mp4', 'A_IMG_1695.MOV', 1.0, 2.5); segs.append(('as6.mp4', 2.5))
    video_seg('as7.mp4', 'A_IMG_1663.MOV', 0.2, 2.2); segs.append(('as7.mp4', 2.2))
    still_seg('as8.mp4', 'a_end.jpg', 2.8); segs.append(('as8.mp4', 2.8))
    total = assemble('a', segs, 'A_EF8D882C.mp4', 0, out / '2026-12-08_reel.mp4')
    os.replace(TMP / 'a_cover.jpg', out / '2026-12-08_reel_cover.jpg')
    print('Amaze reel', round(total, 1), 's')

if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'both'
    if which in ('ndt', 'both'): ndt()
    if which in ('amaze', 'both'): amaze()
