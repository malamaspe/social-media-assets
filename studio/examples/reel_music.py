"""Reels με μουσική χωρίς πνευματικά δικαιώματα (Pixabay), κοψίματα στον ρυθμό.
Ξαναφτιάχνει: NDT 1/12 (street party), NDT 8/12 (Συνέδριο. Πάρτι. Φεστιβάλ.), Amaze 8/12 (Party highlights)."""
import json, os, sys, subprocess, warnings
from pathlib import Path
import numpy as np, librosa
import reel_week4 as rw

warnings.filterwarnings('ignore')
MUSIC = Path('/home/claude/music')
LIB = {x['id']: x for x in json.load(open(MUSIC / 'library.json'))}

def track_path(tid):
    return MUSIC / 'cand' / f"{LIB[tid]['slug']}.mp3"

def music_start_and_beats(tid, length):
    """Αρχή πάνω σε beat κοντά στο πιο δυνατό κομμάτι του track, και τα beats από εκεί (σε δευτερόλεπτα από την αρχή)."""
    x = LIB[tid]
    st = max(0.0, min(x['best_start'] - 4, x['dur'] - length - 6))
    y, sr = librosa.load(track_path(tid), sr=22050, offset=st, duration=length + 8)
    _, bt = librosa.beat.beat_track(y=y, sr=sr, units='time')
    bt = bt[bt >= 2.0] if (bt >= 2.0).sum() > 8 else bt
    t0 = st + float(bt[0])
    rel = [float(b - bt[0]) for b in bt]
    return t0, rel

def snap(durs, beats, min_len=1.2):
    out, prev = [], 0.0
    for d in durs:
        target = prev + d
        cands = [b for b in beats if b >= prev + min_len]
        cut = min(cands, key=lambda b: abs(b - target)) if cands else target
        out.append(round(cut - prev, 3)); prev = cut
    return out

def assemble(prefix, segs, tid, t0, out):
    total = sum(d for _, d in segs)
    lst = rw.TMP / f'{prefix}_list.txt'
    lst.write_text(''.join(f"file '{rw.TMP / n}'\n" for n, _ in segs))
    vid = rw.TMP / f'{prefix}_video.mp4'
    rw.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(vid)])
    rw.run(['ffmpeg', '-y', '-v', 'error', '-i', str(vid), '-ss', str(t0), '-i', str(track_path(tid)),
            '-filter_complex', f"[1:a]atrim=0:{total},asetpts=PTS-STARTPTS,apad=whole_dur={total},afade=t=in:st=0:d=0.25,afade=t=out:st={total-2.0}:d=2.0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]",
            '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-t', str(total),
            '-movflags', '+faststart', str(out)])
    return total

def ndt_1201(tid):
    rw.V = Path('/home/claude/dl/vid'); rw.TMP = Path('/home/claude/ig/out/reel_tmp')
    plan = [('s1.mp4', 2.2), ('s2.mp4', 2.2), ('s3.mp4', 2.2), ('s4.mp4', 4.0), ('s5.mp4', 4.0), ('s6.mp4', 3.0), ('s7.mp4', 2.6)]
    t0, beats = music_start_and_beats(tid, 24)
    d = snap([p[1] for p in plan], beats)
    rw.photo_seg('s1.mp4', 'ndt_crew_ladder.jpg', d[0], 'ov1.png', 0.25)
    rw.photo_seg('s2.mp4', 'ndt_street_array_sub_day.jpg', d[1], 'ov2.png', 0.4)
    rw.photo_seg('s3.mp4', 'ndt_street_ledbars_day.jpg', d[2], 'ov3.png', 0.3)
    rw.video_seg('s4.mp4', 'IMG_1786.MOV', 6.6, d[3], 'ov4.png')
    rw.video_seg('s5.mp4', 'IMG_1795.MOV', 1.5, d[4])
    rw.video_seg('s6.mp4', 'IMG_1796.MOV', 9.0, d[5])
    rw.still_seg('s7.mp4', 'end.jpg', d[6])
    out = Path('/home/claude/ig/out/week3/NDT/2026-12-01_reel.mp4')
    total = assemble('m1201', list(zip([p[0] for p in plan], d)), tid, t0, out)
    print('NDT 1/12', round(total, 2), 's', LIB[tid]['title'], 'from', round(t0, 1), d)

def ndt_1208(tid):
    rw.V = Path('/home/claude/dl/vid2'); rw.TMP = Path('/home/claude/ig/out/reel_tmp4')
    plan = [('ns1.mp4', 2.4), ('ns2.mp4', 3.0), ('ns3.mp4', 2.6), ('ns4.mp4', 2.6), ('ns5.mp4', 3.0), ('ns6.mp4', 3.0), ('ns7.mp4', 2.8)]
    t0, beats = music_start_and_beats(tid, 24)
    d = snap([p[1] for p in plan], beats)
    rw.photo_seg('ns1.mp4', 'ndt_conf_hall.jpg', d[0], 'n1.png', 0.45)
    rw.video_seg('ns2.mp4', 'N_IMG_1701.MOV', 2.2, d[1], 'n2.png')
    rw.video_seg('ns3.mp4', 'N_IMG_0885.MOV', 2.0, d[2], 'n3.png')
    rw.video_seg('ns4.mp4', 'N_IMG_0894.MOV', 4.0, d[3], 'n4.png')
    rw.video_seg('ns5.mp4', 'N_IMG_1845.MOV', 8.0, d[4], 'n5.png')
    rw.video_seg('ns6.mp4', 'N_IMG_1857.MOV', 13.6, d[5])
    rw.still_seg('ns7.mp4', 'n_end.jpg', d[6])
    out = Path('/home/claude/ig/out/week4/NDT/2026-12-08_reel.mp4')
    total = assemble('m1208n', list(zip([p[0] for p in plan], d)), tid, t0, out)
    print('NDT 8/12', round(total, 2), 's', LIB[tid]['title'], 'from', round(t0, 1), d)

OUTRO_AMAZE = Path('/home/claude/ig/assets/amaze_outro_1080x1920.mp4')  # το κλιπ κλεισίματος της Amaze (A_LOGO_CLOSURE), 5.47″

def outro_seg(name, src=OUTRO_AMAZE):
    rw.run(['ffmpeg', '-y', '-v', 'error', '-i', str(src), '-vf', f'scale={rw.W}:{rw.H},setsar=1,fps={rw.FPS}', *rw.ENC, '-an', str(rw.TMP / name)])
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(rw.TMP / name)], capture_output=True, text=True).stdout)

def amaze_1208(tid):
    rw.V = Path('/home/claude/dl/vid2'); rw.TMP = Path('/home/claude/ig/out/reel_tmp4')
    plan = [('as1.mp4', 3.0), ('as2.mp4', 3.0), ('as3.mp4', 2.5), ('as4.mp4', 2.5), ('as5.mp4', 2.5), ('as6.mp4', 2.5), ('as7.mp4', 2.2)]
    t0, beats = music_start_and_beats(tid, 28)
    d = snap([p[1] for p in plan], beats)
    rw.video_seg('as1.mp4', 'A_IMG_1997.MOV', 0.6, d[0], 'a1.png')
    rw.video_seg('as2.mp4', 'A_IMG_1913.MOV', 2.0, d[1])
    rw.video_seg('as3.mp4', 'A_IMG_1998.MOV', 3.0, d[2])
    rw.video_seg('as4.mp4', 'A_IMG_1918.MOV', 0.5, d[3])
    rw.video_seg('as5.mp4', 'A_IMG_1666.MOV', 1.0, d[4])
    rw.video_seg('as6.mp4', 'A_IMG_1695.MOV', 1.0, d[5])
    rw.video_seg('as7.mp4', 'A_IMG_1663.MOV', 0.2, d[6])
    od = outro_seg('as8o.mp4')  # κλείσιμο με το outro της Amaze αντί για κάρτα
    out = Path('/home/claude/ig/out/week4/AMAZE/2026-12-08_reel.mp4')
    total = assemble('m1208a', list(zip([p[0] for p in plan], d)) + [('as8o.mp4', od)], tid, t0, out)
    print('Amaze 8/12', round(total, 2), 's', LIB[tid]['title'], 'from', round(t0, 1), d)

if __name__ == '__main__':
    picks = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    if 'ndt_1201' in picks: ndt_1201(picks['ndt_1201'])
    if 'ndt_1208' in picks: ndt_1208(picks['ndt_1208'])
    if 'amaze_1208' in picks: amaze_1208(picks['amaze_1208'])
