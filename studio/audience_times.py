"""Ώρες κοινού → times.json για το make_queue.py (απόφαση Πέτρου 26/11).

Το Apps Script (updateAudienceHours, κάθε μέρα 04:00) γράφει στο Sheet «IG Publisher» την καρτέλα «Ώρες κοινού»:
Λογαριασμός | Μέρα (Δευ…Κυρ) | Καλύτερη ώρα | Online (μ.ό.) | 2η καλύτερη | Μέρες δεδομένων | Ενημέρωση
Το μηνιαίο πακέτο τη διαβάζει με τον Google Sheets connector («Ώρες κοινού»!A1:G15), σώζει τις τιμές ως JSON
(λίστα γραμμών, με την κεφαλίδα) και τρέχει:
    python3 audience_times.py <values.json> <out_dir>/times.json
Κρατάει μόνο μέρες με ≥2 μετρήσεις και ώρα 08:00–23:00· ό,τι λείπει ή είναι παλιό (>8 ημέρες) → σταθερές ώρες.
"""
import json, sys
from datetime import date, datetime

DAYS = {'Δευ': 1, 'Τρι': 2, 'Τρί': 2, 'Τετ': 3, 'Πεμ': 4, 'Πέμ': 4, 'Παρ': 5, 'Σαβ': 6, 'Σάβ': 6, 'Κυρ': 7}
MIN_DAYS, MAX_AGE_DAYS = 2, 8


def convert(rows, today=None):
    today = today or date.today()
    out, notes = {}, []
    for r in rows[1:]:
        r = (list(r) + [''] * 7)[:7]
        acc, day, best, _, _, n, upd = [str(x).strip() for x in r]
        if acc not in ('NDT', 'AMAZE') or day not in DAYS:
            continue
        try:
            age = (today - datetime.strptime(upd[:10], '%Y-%m-%d').date()).days
        except ValueError:
            age = 0
        if age > MAX_AGE_DAYS:
            notes.append(f'{acc} {day}: παλιά δεδομένα ({upd}) → σταθερή ώρα'); continue
        if not best or not n.isdigit() or int(n) < MIN_DAYS:
            notes.append(f'{acc} {day}: λίγα δεδομένα ({n or 0} μέρες) → σταθερή ώρα'); continue
        h, m = map(int, best.split(':'))
        if not 8 <= h <= 23:
            notes.append(f'{acc} {day}: {best} εκτός 08–23 → σταθερή ώρα'); continue
        out.setdefault(acc, {})[str(DAYS[day])] = f'{h:02d}:{m:02d}'
    return out, notes


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    rows = json.load(open(src))
    rows = rows.get('values', rows) if isinstance(rows, dict) else rows
    times, notes = convert(rows)
    json.dump(times, open(dst, 'w'), ensure_ascii=False, indent=1)
    for acc in ('NDT', 'AMAZE'):
        t = times.get(acc, {})
        print(acc + ': ' + ' · '.join(f"{k}={t.get(str(v), 'σταθερή')}" for k, v in DAYS.items() if k in ('Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ')))
    for n in notes:
        print('  ' + n)
