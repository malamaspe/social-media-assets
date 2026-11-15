"""Render Instagram posts/stories for NDT and Amaze DJs from HTML templates via Playwright."""
import os, html
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(os.environ.get('IG_ROOT', Path(__file__).resolve().parent))
A = ROOT / 'assets'
F = ROOT / 'fonts/node_modules/@fontsource'

def ff(family, folder, weight, style='normal', subsets=('greek', 'latin', 'latin-ext')):
    out = []
    for s in subsets:
        p = F / folder / 'files' / f'{folder}-{s}-{weight}-{style}.woff2'
        if p.exists():
            out.append(f"@font-face{{font-family:'{family}';src:url('file://{p}') format('woff2');font-weight:{weight};font-style:{style};}}")
    return '\n'.join(out)

FONTS = '\n'.join([
    ff('FSXC', 'fira-sans-extra-condensed', 600), ff('FSXC', 'fira-sans-extra-condensed', 700),
    ff('FSXC', 'fira-sans-extra-condensed', 800), ff('FSXC', 'fira-sans-extra-condensed', 900),
    ff('FS', 'fira-sans', 400), ff('FS', 'fira-sans', 500),
    ff('EBG', 'eb-garamond', 400), ff('EBG', 'eb-garamond', 500), ff('EBG', 'eb-garamond', 600),
    ff('EBG', 'eb-garamond', 400, 'italic'), ff('EBG', 'eb-garamond', 500, 'italic'),
    ff('MR', 'manrope', 400), ff('MR', 'manrope', 600), ff('MR', 'manrope', 700),
])

def e(t):
    """escape, keep <br> and <b>/<i> written as [br] [b]..[/b] [i]..[/i] markers"""
    t = html.escape(t)
    for a, b in [('[br]', '<br>'), ('[b]', '<b>'), ('[/b]', '</b>'), ('[i]', '<i>'), ('[/i]', '</i>'),
                 ('[o]', '<span class="o">'), ('[/o]', '</span>')]:
        t = t.replace(a, b)
    return t

def img(name):
    return f"file://{A / name}"

# ---------------------------------------------------------------- NDT
NDT_CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{width:%(w)dpx;height:%(h)dpx;background:#0D0D0F;color:#fff;font-family:'FS';overflow:hidden;position:relative}
.o{color:#FF6A00}
.bg{position:absolute;inset:0;background-size:cover;background-position:%(pos)s}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,13,15,.15) 0%%,rgba(13,13,15,.35) 40%%,rgba(13,13,15,.92) 78%%,#0D0D0F 100%%)}
.shade.top{background:linear-gradient(0deg,rgba(13,13,15,.1) 0%%,rgba(13,13,15,.4) 45%%,rgba(13,13,15,.93) 80%%,#0D0D0F 100%%)}
.h{font-family:'FSXC';font-weight:800;text-transform:uppercase;line-height:.95;letter-spacing:.5px}
.tag{font-family:'FSXC';font-weight:700;font-size:30px;letter-spacing:4px;text-transform:uppercase;color:#FF6A00}
.bar{width:90px;height:10px;background:#FF6A00}
.logo{position:absolute;height:120px}
.count{position:absolute;top:64px;right:72px;font-family:'FSXC';font-weight:700;font-size:30px;letter-spacing:3px;color:#8a8a92}
.body{font-size:40px;line-height:1.38;color:#D9D9DE}
.swipe{font-family:'FSXC';font-weight:700;font-size:30px;letter-spacing:3px;text-transform:uppercase;color:#fff;opacity:.85}
"""

def ndt_page(w, h, inner, pos='center'):
    return f"<!doctype html><html lang='el'><head><meta charset='utf-8'><style>{FONTS}{NDT_CSS % dict(w=w, h=h, pos=pos)}</style></head><body>{inner}</body></html>"

def ndt_cover(photo, tag, title, sub=None, pos='center', swipe=True, size=(1080, 1350), title_px=120):
    w, h = size
    inner = f"""<div class='bg' style="background-image:url('{img(photo)}')"></div><div class='shade'></div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='top:56px;left:60px;height:190px'>
    <div style='position:absolute;left:72px;right:72px;bottom:{110 if h==1350 else 360}px'>
      <div class='tag' style='margin-bottom:26px'>{e(tag)}</div>
      <div class='h' style='font-size:{title_px}px'>{e(title)}</div>
      {f"<div class='body' style='margin-top:30px;font-size:44px;color:#fff'>{e(sub)}</div>" if sub else ''}
      <div style='display:flex;align-items:center;gap:24px;margin-top:44px'><div class='bar'></div>{"<div class='swipe'>Σύρε για περισσότερα →</div>" if swipe else ''}</div>
    </div>"""
    return ndt_page(w, h, inner, pos)

def ndt_point(num, total, title, body, photo=None, pos='center', size=(1080, 1350)):
    w, h = size
    if photo:
        top = f"<div class='bg' style=\"background-image:url('{img(photo)}');height:560px;bottom:auto\"></div><div style='position:absolute;left:0;right:0;top:300px;height:262px;background:linear-gradient(180deg,rgba(13,13,15,0),#0D0D0F)'></div>"
        y = 600
    else:
        top = ''
        y = 330
    inner = f"""{top}
    <div class='count'>{num:02d} / {total:02d}</div>
    <div style='position:absolute;left:72px;right:72px;top:{y}px'>
      <div class='h o' style='font-size:{200 if not photo else 150}px;line-height:.8'>{num:02d}</div>
      <div class='bar' style='margin:34px 0 34px'></div>
      <div class='h' style='font-size:92px'>{e(title)}</div>
      <div class='body' style='margin-top:34px;font-size:44px'>{e(body)}</div>
    </div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='bottom:56px;right:64px;height:96px'>"""
    return ndt_page(w, h, inner, pos)

def ndt_text(title, body, tag=None, size=(1080, 1350), title_px=84, photo=None, pos='center', y=None):
    w, h = size
    bg = f"<div class='bg' style=\"background-image:url('{img(photo)}');opacity:.28\"></div>" if photo else ''
    yy = y if y is not None else (230 if h == 1350 else 600)
    inner = f"""{bg}
    <div style='position:absolute;left:72px;right:72px;top:{yy}px'>
      {f"<div class='tag' style='margin-bottom:28px'>{e(tag)}</div>" if tag else ''}
      <div class='h' style='font-size:{title_px}px'>{e(title)}</div>
      <div class='bar' style='margin:40px 0'></div>
      <div class='body' style='font-size:{58 if h==1920 else 48}px'>{e(body)}</div>
    </div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='bottom:{56 if h==1350 else 300}px;right:64px;height:{96 if h==1350 else 120}px'>"""
    return ndt_page(w, h, inner, pos)

def ndt_list(title, items, start=1, tag=None, count=None, size=(1080, 1350)):
    w, h = size
    rows = ''.join(f"<div style='display:flex;gap:30px;margin-bottom:52px;align-items:flex-start'><div class='h o' style='font-size:84px;min-width:100px;line-height:.9'>{i:02d}</div><div class='body' style='font-size:50px;line-height:1.25;color:#fff;padding-top:4px'>{e(t)}</div></div>" for i, t in enumerate(items, start))
    inner = f"""{f"<div class='count'>{e(count)}</div>" if count else ''}
    <div style='position:absolute;left:72px;right:72px;top:290px'>
      {f"<div class='tag' style='margin-bottom:22px'>{e(tag)}</div>" if tag else ''}
      <div class='h' style='font-size:100px;margin-bottom:70px'>{e(title)}</div>
      {rows}
    </div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='bottom:56px;right:64px;height:96px'>"""
    return ndt_page(w, h, inner)

def ndt_quote(quote, who, label='Google review', title=None, size=(1080, 1350), photo=None, pos='center'):
    w, h = size
    bg = f"<div class='bg' style=\"background-image:url('{img(photo)}');opacity:.22\"></div>" if photo else ''
    stars = "<div style='color:#FF6A00;font-size:46px;letter-spacing:8px'>★★★★★</div>"
    yy = 220 if h == 1350 else 560
    big = h == 1920
    inner = f"""{bg}
    <div style='position:absolute;left:72px;right:72px;top:{yy}px'>
      {f"<div class='tag' style='margin-bottom:30px'>{e(title)}</div>" if title else ''}
      <div class='h o' style='font-size:220px;line-height:.6;height:110px'>“</div>
      <div style='font-family:FS;font-weight:500;font-size:{72 if big else (52 if len(quote)>110 else 62)}px;line-height:1.3'>{e(quote)}</div>
      <div class='bar' style='margin:46px 0 30px'></div>
      {stars}
      <div style='font-family:FSXC;font-weight:700;font-size:38px;letter-spacing:2px;margin-top:16px;text-transform:uppercase'>{e(who)} · <span style='color:#8a8a92'>{e(label)}</span></div>
    </div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='bottom:{56 if h==1350 else 300}px;right:64px;height:{96 if h==1350 else 120}px'>"""
    return ndt_page(w, h, inner, pos)

def ndt_cta(title, body, size=(1080, 1350)):
    w, h = size
    inner = f"""<div style='position:absolute;inset:0;background:#FF6A00'></div>
    <div style='position:absolute;left:72px;right:72px;top:{240 if h==1350 else 560}px;color:#0D0D0F'>
      <div class='h' style='font-size:{104 if h==1350 else 150}px'>{e(title)}</div>
      <div style='width:90px;height:10px;background:#0D0D0F;margin:44px 0'></div>
      <div style='font-size:{44 if h==1350 else 60}px;line-height:1.35;font-weight:500'>{e(body)}</div>
    </div>
    <img class='logo' src='{img('ndt_logo_black.png')}' style='bottom:{70 if h==1350 else 320}px;left:72px;height:190px'>"""
    return ndt_page(w, h, inner)

def ndt_story_photo(photo, title, body=None, tag=None, pos='center'):
    inner = f"""<div class='bg' style="background-image:url('{img(photo)}')"></div><div class='shade'></div>
    <img class='logo' src='{img('ndt_logo_dark.png')}' style='top:230px;left:64px;height:140px'>
    <div style='position:absolute;left:72px;right:72px;bottom:330px'>
      {f"<div class='tag' style='margin-bottom:24px'>{e(tag)}</div>" if tag else ''}
      <div class='h' style='font-size:128px'>{e(title)}</div>
      {f"<div class='body' style='margin-top:30px;color:#fff;font-size:54px'>{e(body)}</div>" if body else ''}
      <div class='bar' style='margin-top:40px'></div>
    </div>"""
    return ndt_page(1080, 1920, inner, pos)

# ---------------------------------------------------------------- AMAZE
AM_CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{width:%(w)dpx;height:%(h)dpx;background:#212B49;color:#F7F3EC;font-family:'MR';overflow:hidden;position:relative}
.bg{position:absolute;inset:0;background-size:cover;background-position:%(pos)s}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,26,46,.25) 0%%,rgba(20,26,46,.25) 45%%,rgba(20,26,46,.9) 80%%,rgba(20,26,46,.97) 100%%)}
.gr{font-family:'EBG';font-weight:500;line-height:1.08}
.en{font-family:'EBG';font-style:italic;font-weight:400;color:#C8A97E}
.k{font-family:'MR';font-weight:600;font-size:24px;letter-spacing:6px;text-transform:uppercase;color:#C8A97E}
.line{width:80px;height:2px;background:#C8A97E}
.body{font-size:36px;line-height:1.45;color:#E9E3D8}
.count{position:absolute;top:64px;right:72px;font-family:'MR';font-weight:600;font-size:24px;letter-spacing:5px;color:#C8A97E}
.frame{position:absolute;inset:36px;border:1.5px solid rgba(200,169,126,.45);pointer-events:none}
"""

def am_page(w, h, inner, pos='center'):
    return f"<!doctype html><html lang='el'><head><meta charset='utf-8'><style>{FONTS}{AM_CSS % dict(w=w, h=h, pos=pos)}</style></head><body>{inner}</body></html>"

def am_logo(h, bottom, height=74):
    return f"<img src='{img('amaze_ls_white.png')}' style='position:absolute;left:50%;transform:translateX(-50%);bottom:{bottom}px;height:{height}px'>"

def am_cover(photo, kicker, gr, en, pos='center', swipe=True, size=(1080, 1350), gr_px=96):
    w, h = size
    inner = f"""<div class='bg' style="background-image:url('{img(photo)}')"></div><div class='shade'></div><div class='frame'></div>
    <div style='position:absolute;left:84px;right:84px;bottom:{220 if h==1350 else 470}px;text-align:center'>
      <div class='k' style='margin-bottom:30px'>{e(kicker)}</div>
      <div class='gr' style='font-size:{gr_px}px'>{e(gr)}</div>
      <div class='en' style='font-size:{int(gr_px*0.52)}px;margin-top:22px'>{e(en)}</div>
      {"<div class='k' style='margin-top:40px;color:#F7F3EC;opacity:.8;letter-spacing:4px;font-size:22px'>Σύρετε · Swipe →</div>" if swipe else ''}
    </div>
    {am_logo(h, 92 if h==1350 else 330, 70)}"""
    return am_page(w, h, inner, pos)

def am_point(num, total, gr, en, body_gr, body_en, photo=None, pos='center', size=(1080, 1350)):
    w, h = size
    if photo:
        top = f"<div class='bg' style=\"background-image:url('{img(photo)}');height:460px;bottom:auto\"></div><div style='position:absolute;left:0;right:0;top:260px;height:202px;background:linear-gradient(180deg,rgba(33,43,73,0),#212B49)'></div>"
        y = 480
    else:
        top, y = '', 360
    inner = f"""{top}<div class='frame'></div>
    <div class='count'>{num:02d} / {total:02d}</div>
    <div style='position:absolute;left:96px;right:96px;top:{y}px;text-align:center'>
      <div class='en' style='font-size:64px;line-height:1'>{num:02d}</div>
      <div class='gr' style='font-size:78px;margin-top:20px'>{e(gr)}</div>
      <div class='en' style='font-size:44px;margin-top:10px'>{e(en)}</div>
      <div class='line' style='margin:34px auto'></div>
      <div class='body' style='font-size:44px'>{e(body_gr)}</div>
      <div class='body' style='font-size:35px;color:#AFB4C6;margin-top:22px;font-style:italic'>{e(body_en)}</div>
    </div>
    {am_logo(h, 80, 56)}"""
    return am_page(w, h, inner, pos)

def am_qlist(title_gr, title_en, items, start=1, count=None, size=(1080, 1350)):
    w, h = size
    rows = ''.join(f"<div style='display:flex;gap:28px;margin-bottom:46px;text-align:left'><div class='en' style='font-size:60px;min-width:80px;line-height:1'>{i:02d}</div><div><div style='font-size:42px;line-height:1.28;color:#F7F3EC'>{e(g)}</div><div style='font-size:32px;line-height:1.3;color:#AFB4C6;font-style:italic;margin-top:6px'>{e(en)}</div></div></div>" for i, (g, en) in enumerate(items, start))
    inner = f"""<div class='frame'></div>{f"<div class='count'>{e(count)}</div>" if count else ''}
    <div style='position:absolute;left:96px;right:96px;top:150px'>
      <div class='gr' style='font-size:72px;text-align:center'>{e(title_gr)}</div>
      <div class='en' style='font-size:40px;text-align:center;margin-top:8px'>{e(title_en)}</div>
      <div class='line' style='margin:34px auto 50px'></div>
      {rows}
    </div>
    {am_logo(h, 80, 56)}"""
    return am_page(w, h, inner)

def am_review(quote, who, lang_note=None, size=(1080, 1350), photo=None, pos='center', kicker='Google review'):
    w, h = size
    bg = f"<div class='bg' style=\"background-image:url('{img(photo)}');opacity:.2\"></div>" if photo else ''
    inner = f"""{bg}<div class='frame'></div>
    <div style='position:absolute;left:100px;right:100px;top:{200 if h==1350 else 520}px;text-align:center'>
      <div class='k'>{e(kicker)}</div>
      <div style='color:#C8A97E;font-size:40px;letter-spacing:10px;margin-top:24px'>★★★★★</div>
      <div class='en' style='font-size:200px;line-height:.55;height:90px;margin-top:40px'>“</div>
      <div class='gr' style='font-size:{80 if h==1920 else (54 if len(quote)>110 else 66)}px;line-height:1.28;font-weight:400'>{e(quote)}</div>
      <div class='line' style='margin:46px auto 26px'></div>
      <div style='font-weight:600;font-size:28px;letter-spacing:5px;text-transform:uppercase'>{e(who)}</div>
      {f"<div class='en' style='font-size:30px;margin-top:10px'>{e(lang_note)}</div>" if lang_note else ''}
    </div>
    {am_logo(h, 92 if h==1350 else 330, 64)}"""
    return am_page(w, h, inner, pos)

def am_cta(gr, en, body_gr, body_en, photo=None, pos='center', size=(1080, 1350)):
    w, h = size
    bg = f"<div class='bg' style=\"background-image:url('{img(photo)}')\"></div><div class='shade' style='background:rgba(20,26,46,.72)'></div>" if photo else ''
    inner = f"""{bg}<div class='frame'></div>
    <div style='position:absolute;left:96px;right:96px;top:{330 if h==1350 else 600}px;text-align:center'>
      <div class='gr' style='font-size:{80 if h==1350 else 110}px'>{e(gr)}</div>
      <div class='en' style='font-size:{44 if h==1350 else 60}px;margin-top:16px'>{e(en)}</div>
      <div class='line' style='margin:44px auto'></div>
      <div class='body' style='font-size:{44 if h==1350 else 54}px'>{e(body_gr)}</div>
      <div class='body' style='font-size:{35 if h==1350 else 42}px;color:#AFB4C6;font-style:italic;margin-top:16px'>{e(body_en)}</div>
    </div>
    <img src='{img('amaze_sq_white.png')}' style='position:absolute;left:50%;transform:translateX(-50%);bottom:{90 if h==1350 else 330}px;height:200px'>"""
    return am_page(w, h, inner, pos)

def am_story_photo(photo, gr, en, kicker=None, pos='center', extra_gr=None, extra_en=None):
    inner = f"""<div class='bg' style="background-image:url('{img(photo)}')"></div><div class='shade'></div><div class='frame'></div>
    <img src='{img('amaze_ls_white.png')}' style='position:absolute;left:50%;transform:translateX(-50%);top:240px;height:76px'>
    <div style='position:absolute;left:90px;right:90px;bottom:360px;text-align:center'>
      {f"<div class='k' style='margin-bottom:26px;font-size:28px'>{e(kicker)}</div>" if kicker else ''}
      <div class='gr' style='font-size:104px'>{e(gr)}</div>
      <div class='en' style='font-size:58px;margin-top:18px'>{e(en)}</div>
      {f"<div class='line' style='margin:40px auto'></div><div class='body' style='font-size:46px'>{e(extra_gr)}</div>" if extra_gr else ''}
      {f"<div class='body' style='font-size:38px;color:#C9CCD8;font-style:italic;margin-top:12px'>{e(extra_en)}</div>" if extra_en else ''}
    </div>"""
    return am_page(1080, 1920, inner, pos)

# ---------------------------------------------------------------- render
def render_all(jobs, outdir):
    """jobs: list of (filename, html, (w,h))"""
    os.makedirs(outdir, exist_ok=True)
    with sync_playwright() as p:
        try:
            b = p.chromium.launch()
        except Exception:
            b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page(device_scale_factor=1)
        for name, doc, (w, h) in jobs:
            hp = (Path(outdir) / (name + '.html')).resolve()
            hp.parent.mkdir(parents=True, exist_ok=True)
            hp.write_text(doc, encoding='utf-8')
            pg.set_viewport_size({'width': w, 'height': h})
            pg.goto(f'file://{hp}')
            pg.evaluate('document.fonts.ready')
            pg.wait_for_timeout(150)
            out = Path(outdir) / (name + '.jpg')
            pg.screenshot(path=str(out), type='jpeg', quality=93, clip={'x': 0, 'y': 0, 'width': w, 'height': h})
            hp.unlink()
        b.close()
