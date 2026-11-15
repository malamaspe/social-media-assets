from engine import *
import json, os
P = (1080, 1350); S = (1080, 1920)
OUT = 'out/week4'
J = []
CAP = {}

NDT_TAGS = '#NDT #eventproduction #avproduction #τεχνικήκάλυψη #εταιρικάevents #corporateevents #ήχος #θεσσαλονίκη #thessaloniki #eventprofs'
AM_TAGS = '#amazedjs #weddingdj #weddinggreece #greekwedding #destinationweddinggreece #γάμος #γάμος2027 #thessalonikiwedding #weddingentertainment #weddingplanning'

def add(brand, date, kind, slides):
    for i, (doc, size) in enumerate(slides, 1):
        J.append((f'{brand}/{date}_{kind}_{i:02d}', doc, size))

# =============================== NDT ===============================
# 7/12 Δευ — ρεύμα & ασφάλεια
add('NDT', '2026-12-07', 'post', [
    (ndt_cover('ndt_amphi_sunset.jpg', 'Τεχνική οργάνωση', 'Ρεύμα & ασφάλεια: τι ρωτάμε τον χώρο πριν έρθουμε', 'Οι ερωτήσεις που γλιτώνουν ένα event από εκπλήξεις.', pos='center 70%', title_px=100), P),
    (ndt_point(1, 5, 'Πόση παροχή υπάρχει', 'Ήχος, φως και οθόνες θέλουν ρεύμα. Ρωτάμε από πριν τι παροχή έχει ο χώρος και πού βρίσκεται ο πίνακας.'), P),
    (ndt_point(2, 5, 'Χωριστή γραμμή για τον ήχο', 'Όχι στην ίδια γραμμή με κουζίνα, ψυγεία ή θερμάστρες. Έτσι αποφεύγουμε βόμβους και ασφάλειες που «πέφτουν».'), P),
    (ndt_point(3, 5, 'Καλώδια που δεν σκοντάφτουν', 'Περνάνε από τις άκρες ή καλύπτονται με ράμπες, για να κινούνται άνετα καλεσμένοι και σερβιτόροι.', photo='ndt_amphi_cables.jpg', pos='center 88%'), P),
    (ndt_point(4, 5, 'Εξωτερικός χώρος', 'Στεγνή βάση για τον εξοπλισμό, προστασία από την υγρασία και πάντα ένα σχέδιο για αέρα ή βροχή.', photo='ndt_outdoor_wide_setup.jpg', pos='center 70%'), P),
    (ndt_point(5, 5, 'Ένας άνθρωπος του χώρου', 'Ζητάμε από πριν ποιος ξέρει τον πίνακα του χώρου. Τον χρειαζόμαστε πριν το event, όχι όταν πέσει μια ασφάλεια.'), P),
    (ndt_cta('Event σε νέο χώρο;', 'Στείλε μας πού θα γίνει. Τις ερωτήσεις για ρεύμα και στήσιμο τις κάνουμε εμείς.'), P),
])
CAP[('NDT', '2026-12-07')] = f"""Ο καλύτερος ήχος του κόσμου δεν παίζει χωρίς σωστό ρεύμα. ⚡

Πριν από κάθε event ρωτάμε τον χώρο:
1. Πόση παροχή υπάρχει και πού είναι ο πίνακας
2. Αν ο ήχος μπορεί να πάρει δική του γραμμή
3. Από πού θα περάσουν τα καλώδια
4. Τι γίνεται με υγρασία, αέρα ή βροχή, αν είμαστε έξω
5. Ποιος από τον χώρο ξέρει τον πίνακα

Αποθήκευσέ το για το επόμενο event σε νέο χώρο 📌

#ασφάλεια #eventplanning {NDT_TAGS}"""
add('NDT', '2026-12-07', 'story', [(ndt_text('Ρώτα τον χώρο για το ρεύμα', '[o]1.[/o] Πόση παροχή υπάρχει[br][o]2.[/o] Πού είναι ο πίνακας[br][o]3.[/o] Ποιος τον ξέρει[br][br]Τρεις ερωτήσεις που σώζουν μια βραδιά.', tag='Tip', size=S, title_px=110), S)])

# 8/12 Τρι — REEL (βλ. reel_week4.py) + story
CAP[('NDT', '2026-12-08')] = f"""Συνέδρια, πάρτι, υπαίθρια, live, φεστιβάλ. 🎛️

Κάθε event θέλει άλλο στήσιμο. Η ομάδα όμως είναι η ίδια: ήχος, φως και DJ, από το πρώτο καλώδιο μέχρι το τελευταίο τραγούδι.

Τι ετοιμάζεις εσύ; Στείλε μας μήνυμα.

#συνέδριο #festival #liveevent {NDT_TAGS}"""
add('NDT', '2026-12-08', 'story', [(ndt_story_photo('ndt_garden_stage.jpg', 'Μέσα ή έξω;', 'Αίθουσες, αυλές, πλατείες, αμφιθέατρα. Πες μας πού είναι το δικό σου event.', tag='Behind the scenes', pos='center 60%'), S)])

# 9/12 Τετ — LED ή projector
add('NDT', '2026-12-09', 'post', [
    (ndt_cover('ndt_conf_hall.jpg', 'Εικόνα · Οδηγός', 'LED οθόνη ή projector;', 'Πότε ταιριάζει το καθένα.', pos='center 42%'), P),
    (ndt_point(1, 5, 'Πόσο φως έχει ο χώρος', 'Σε φωτεινή αίθουσα ή σε εξωτερικό χώρο, η LED οθόνη μένει καθαρή. Ο projector θέλει σκοτεινό χώρο για να δείχνει σωστά.'), P),
    (ndt_point(2, 5, 'Το μέγεθος της αίθουσας', 'Σε μικρή αίθουσα, ένας καλός projector αρκεί. Σε μεγάλη, με μακρινές σειρές, η LED στήνεται στο μέγεθος που χρειάζεται.'), P),
    (ndt_point(3, 5, 'Πού θα στηθεί', 'Ο projector θέλει απόσταση από την οθόνη και ελεύθερη «διαδρομή». Η LED μπαίνει πίσω από τη σκηνή και δεν την κόβει όποιος περνάει μπροστά.'), P),
    (ndt_point(4, 5, 'Ο προϋπολογισμός', 'Ο projector είναι συνήθως η πιο οικονομική λύση. Η LED αξίζει όταν η εικόνα είναι πρωταγωνίστρια: παρουσίαση προϊόντος, show, μεγάλο κοινό.'), P),
    (ndt_point(5, 5, 'Το υλικό των ομιλητών', 'Ζητάμε από πριν παρουσιάσεις και βίντεο, για να ελέγξουμε διαστάσεις (16:9) και ήχο. Όχι σε ένα USB λίγο πριν ανέβει ο ομιλητής.'), P),
    (ndt_cta('Δεν ξέρεις τι ταιριάζει στον χώρο σου;', 'Στείλε μας τον χώρο και πόσα άτομα περιμένεις. Σου προτείνουμε τη λύση που ταιριάζει.'), P),
])
CAP[('NDT', '2026-12-09')] = f"""LED οθόνη ή projector; Η απάντηση εξαρτάται από τον χώρο, όχι από τη «μόδα». 🖥️

1. Φωτεινός χώρος ή εξωτερικός → LED
2. Μικρή αίθουσα → ένας καλός projector αρκεί
3. Χώρος μπροστά από την οθόνη → η LED δεν «κόβεται»
4. Προϋπολογισμός → ο projector είναι συνήθως πιο οικονομικός
5. Σε κάθε περίπτωση: το υλικό των ομιλητών ελέγχεται από πριν

Εσύ τι χρησιμοποίησες στο τελευταίο σου συνέδριο;

#ledscreen #projector #συνέδριο {NDT_TAGS}"""
add('NDT', '2026-12-09', 'story', [(ndt_text('LED ή projector;', 'Εσύ τι θα διάλεγες για την επόμενη παρουσίαση της εταιρείας σου;[br][br][o]Απάντησέ μας με DM[/o]', tag='Ερώτηση', size=S, title_px=130), S)])

# 10/12 Πεμ — 3 τρόποι να δουλέψουμε μαζί (αντί για case study #3)
add('NDT', '2026-12-10', 'post', [
    (ndt_cover('ndt_warehouse_linearrays.jpg', 'Ενοικίαση · Τεχνικός · Παραγωγή', '3 τρόποι να δουλέψουμε μαζί', 'Από τον εξοπλισμό μόνο μέχρι ολόκληρη την παραγωγή.', pos='center 55%'), P),
    (ndt_point(1, 3, 'Ενοικίαση εξοπλισμού', 'Παραλαμβάνεις, στήνεις, επιστρέφεις. Για όσους ξέρουν ακριβώς τι χρειάζονται. Ρώτα μας τι υπάρχει διαθέσιμο για την ημερομηνία σου.'), P),
    (ndt_point(2, 3, 'Ενοικίαση με τεχνικό', 'Ο εξοπλισμός έρχεται μαζί με τεχνικό μας: στήνει, ρυθμίζει, μένει όλη τη βραδιά και μαζεύει στο τέλος. Εσύ ασχολείσαι μόνο με το event.', photo='ndt_outdoor_tech_setup.jpg', pos='center 78%'), P),
    (ndt_point(3, 3, 'Πλήρης παραγωγή', 'Από τον σχεδιασμό μέχρι το τελευταίο τραγούδι: ήχος, φως, DJ και ομάδα στον χώρο. Μας λες τι θέλεις να συμβεί και το στήνουμε.', photo='ndt_mixer_tablet_party.jpg', pos='center 62%'), P),
    (ndt_list('Ποιο σου ταιριάζει;', ['Ξέρεις τον εξοπλισμό και θες μόνο να τον πάρεις: [o]ενοικίαση[/o]', 'Θες τον εξοπλισμό χωρίς το άγχος του στησίματος: [o]με τεχνικό[/o]', 'Θες να το αναλάβει κάποιος από την αρχή ως το τέλος: [o]παραγωγή[/o]']), P),
    (ndt_quote('Άψογη συνεργασία, γρήγορη και άμεση εξυπηρέτηση. Η καλύτερη ομάδα για την εκδήλωσή σας.', 'Nikos'), P),
    (ndt_cta('Ρώτα μας για ενοικίαση εξοπλισμού', 'Στείλε μας ημερομηνία και τι χρειάζεσαι. Σου λέμε τι υπάρχει διαθέσιμο, με ή χωρίς τεχνικό.'), P),
])
CAP[('NDT', '2026-12-10')] = f"""Δεν χρειάζεται κάθε event πλήρη παραγωγή. Γι' αυτό δουλεύουμε με τρεις τρόπους: 👇

1. Ενοικίαση εξοπλισμού: παραλαμβάνεις, στήνεις, επιστρέφεις
2. Ενοικίαση με τεχνικό: ο εξοπλισμός έρχεται με άνθρωπό μας, που μένει μέχρι το τέλος
3. Πλήρης παραγωγή: ήχος, φως, DJ και ομάδα, από τον σχεδιασμό μέχρι το τελευταίο τραγούδι

Στείλε μας ημερομηνία και τι χρειάζεσαι, και σου λέμε τι υπάρχει διαθέσιμο.

#ενοικίασηεξοπλισμού #ενοικίασηήχου #dryhire #rental {NDT_TAGS}"""
add('NDT', '2026-12-10', 'story', [(ndt_story_photo('ndt_warehouse_linearrays.jpg', 'Χρειάζεσαι μόνο εξοπλισμό;', 'Ρώτα μας για ενοικίαση, με ή χωρίς τεχνικό.', tag='Ενοικίαση', pos='center 40%'), S)])

# 11/12 Παρ — Party mode
add('NDT', '2026-12-11', 'post', [(ndt_cover('ndt_ballroom_party.jpg', 'Παρασκευή', 'Party mode: on', 'Καλό Σαββατοκύριακο από την NDT.', pos='center 45%', swipe=False, title_px=150), P)])
CAP[('NDT', '2026-12-11')] = f"""Παρασκευή βράδυ. Τα φώτα αλλάζουν χρώμα και η πίστα γεμίζει. 💡🎶

Καλό Σαββατοκύριακο από όλη την ομάδα της NDT!

#fridaynight #party #weekend {NDT_TAGS}"""
add('NDT', '2026-12-11', 'story', [(ndt_story_photo('ndt_street_night_green.jpg', 'Καλό Σαββατοκύριακο', 'Εσύ πού θα χορέψεις απόψε;', tag='Weekend', pos='center 50%'), S)])

# 12/12 Σαβ — ο τεχνικός ήχου σε συνέδριο
add('NDT', '2026-12-12', 'post', [
    (ndt_cover('ndt_mixer_m32.jpg', 'Συνέδρια · Ήχος', 'Τι κάνει ο τεχνικός ήχου σε ένα συνέδριο', 'Δεν τον βλέπεις. Τον ακούς.', pos='center 40%', title_px=110), P),
    (ndt_point(1, 5, 'Πριν ανοίξουν οι πόρτες', 'Δοκιμάζει κάθε μικρόφωνο, κάθε laptop και κάθε βίντεο με ήχο. Αν υπάρχει χρόνος, κάνει και μια σύντομη δοκιμή με κάθε ομιλητή.'), P),
    (ndt_point(2, 5, 'Ανοιχτό μόνο όποιο μιλάει', 'Τα μικρόφωνα όσων δεν μιλάνε μένουν κλειστά. Έτσι δεν ακούγονται ψίθυροι, θόρυβοι και σφυρίγματα.'), P),
    (ndt_point(3, 5, 'Ένταση που προσαρμόζεται', 'Μια γεμάτη αίθουσα «τρώει» ήχο. Ο τεχνικός ανεβάζει ή κατεβάζει την ένταση όσο γεμίζει ή αδειάζει ο χώρος.'), P),
    (ndt_point(4, 5, 'Ερωτήσεις από το κοινό', 'Ασύρματο μικρόφωνο έτοιμο για το κοινό, ώστε η ερώτηση να ακουστεί και στις πίσω σειρές και στην καταγραφή.'), P),
    (ndt_point(5, 5, 'Μουσική στα διαλείμματα', 'Χαμηλή μουσική στο coffee break και στην είσοδο κάθε ομιλητή. Η αίθουσα δεν μένει ποτέ σε αμήχανη σιωπή.'), P),
    (ndt_cta('Συνέδριο στο πρόγραμμα;', 'Ο εξοπλισμός έρχεται με τεχνικό που μένει μέχρι το τέλος. Στείλε μας ημερομηνία και χώρο.'), P),
])
CAP[('NDT', '2026-12-12')] = f"""Σε ένα πετυχημένο συνέδριο κανείς δεν θυμάται τον τεχνικό ήχου. Και αυτό είναι το καλύτερο κομπλιμέντο. 🎚️

Τι κάνει όλη τη μέρα:
1. Δοκιμάζει τα πάντα πριν ανοίξουν οι πόρτες
2. Κρατάει ανοιχτό μόνο το μικρόφωνο που μιλάει
3. Προσαρμόζει την ένταση όσο γεμίζει η αίθουσα
4. Έχει έτοιμο μικρόφωνο για τις ερωτήσεις του κοινού
5. Βάζει μουσική στα διαλείμματα

#συνέδρια #τεχνικόςήχου #soundengineer {NDT_TAGS}"""
add('NDT', '2026-12-12', 'story', [(ndt_text('Ο καλός τεχνικός ήχου', 'Δεν τον βλέπεις.[br][o]Τον ακούς.[/o]', tag='Behind the scenes', size=S, title_px=130), S)])

# 13/12 Κυρ — φώτα πριν φτάσουμε
add('NDT', '2026-12-13', 'post', [
    (ndt_cover('ndt_magicq_laptop.jpg', 'Φωτισμός · Behind the scenes', 'Πώς προγραμματίζουμε τα φώτα πριν φτάσουμε στον χώρο', None, pos='center 35%', title_px=100), P),
    (ndt_point(1, 4, 'Ξεκινάμε από τον χώρο', 'Κάτοψη, φωτογραφίες, πού θα είναι η σκηνή και η πίστα. Από εκεί αποφασίζουμε πού μπαίνει κάθε φωτιστικό.'), P),
    (ndt_point(2, 4, 'Μία «σκηνή» για κάθε στιγμή', 'Υποδοχή, ομιλίες, δείπνο, πάρτι: κάθε στιγμή έχει τα δικά της χρώματα και τη δική της ένταση, έτοιμα σε ένα πάτημα.'), P),
    (ndt_point(3, 4, 'Όλα έτοιμα στην κονσόλα', 'Το πρόγραμμα γράφεται στο software της κονσόλας φωτισμού πριν φορτωθεί ο εξοπλισμός. Στον χώρο μένουν μόνο οι τελικές ρυθμίσεις.', photo='ndt_corporate_dj_lighting_control.jpg', pos='center 45%'), P),
    (ndt_point(4, 4, 'Λιγότερο στήσιμο, καμία έκπληξη', 'Λιγότερες ώρες στον χώρο, τίποτα στην τύχη, και φως που ακολουθεί τη ροή της βραδιάς.', photo='ndt_ballroom_party2.jpg', pos='center 45%'), P),
    (ndt_cta('Θες φως που ακολουθεί τη βραδιά;', 'Στείλε μας κάτοψη ή φωτογραφίες του χώρου και ξεκινάμε τον σχεδιασμό.'), P),
])
CAP[('NDT', '2026-12-13')] = f"""Τα φώτα ενός event δεν «στήνονται» την ώρα που ανοίγουν οι πόρτες. Προγραμματίζονται μέρες πριν. 💡

1. Ξεκινάμε από την κάτοψη και τις φωτογραφίες του χώρου
2. Φτιάχνουμε μία «σκηνή» για κάθε στιγμή της βραδιάς
3. Γράφουμε το πρόγραμμα στην κονσόλα πριν φορτώσουμε
4. Στον χώρο κάνουμε μόνο τις τελικές ρυθμίσεις

Αποτέλεσμα: λιγότερο στήσιμο και φως που ακολουθεί τη βραδιά.

#lightingdesign #φωτισμός #lighting {NDT_TAGS}"""
add('NDT', '2026-12-13', 'story', [(ndt_story_photo('ndt_street_dj_yellow.jpg', 'Φως που ακολουθεί τη μουσική', 'Προγραμματισμένο από πριν, για κάθε στιγμή της βραδιάς.', tag='Behind the scenes', pos='center 40%'), S)])

# =============================== AMAZE ===============================
# 7/12 Δευ — ομιλίες
add('AMAZE', '2026-12-07', 'post', [
    (am_cover('amaze_speech_backlit.jpg', 'Wedding speeches', 'Ομιλίες στον γάμο: πότε, πόσες και πόσο', 'Wedding speeches: when, how many, how long', pos='center 50%', gr_px=80), P),
    (am_point(1, 4, 'Πότε', 'When', 'Αμέσως μετά την είσοδό σας ή πριν το κυρίως πιάτο, όσο όλοι κάθονται. Όχι αφού ανοίξει η πίστα.', 'Right after your entrance or before the main course, while everyone is seated. Not once the dance floor is open.'), P),
    (am_point(2, 4, 'Πόσες', 'How many', '2–3 ομιλίες αρκούν. Οι υπόλοιπες ευχές χωράνε άνετα σε ένα βίντεο ή στο βιβλίο ευχών.', '2–3 speeches are plenty. Other wishes fit nicely in a video or the guest book.'), P),
    (am_point(3, 4, 'Πόσο', 'How long', 'Έως 3–4 λεπτά η καθεμία. Μια σύντομη ομιλία συγκινεί, μια μεγάλη κουράζει.', 'Up to 3–4 minutes each. A short speech moves people, a long one loses them.'), P),
    (am_point(4, 4, 'Μικρόφωνο και μουσική', 'Mic and music', 'Ασύρματο μικρόφωνο, δοκιμασμένο από πριν, και λίγη μουσική όταν ανεβαίνει και κατεβαίνει κάθε ομιλητής.', 'A wireless mic tested in advance, and a little music as each speaker walks up and back.'), P),
    (am_review('Ο τρόπος που συντόνιζε τα κομμάτια, τα περάσματα και τις ανακοινώσεις έδωσε έναν μοναδικό ρυθμό στη γιορτή μας.', 'Alexandros', lang_note='The way he blended songs, transitions and announcements gave our celebration a unique rhythm.'), P),
    (am_cta('Ομιλίες στο πρόγραμμα;', 'Speeches on the schedule?', 'Πείτε μας ποιοι θα μιλήσουν και πότε, και τα ετοιμάζουμε όλα.', 'Tell us who’s speaking and when, and we’ll have everything ready.'), P),
])
CAP[('AMAZE', '2026-12-07')] = f"""Οι ομιλίες είναι από τις πιο συγκινητικές στιγμές του γάμου. Αρκεί να γίνουν τη σωστή ώρα. 🎤🤍
1. Πότε: μετά την είσοδο ή πριν το κυρίως πιάτο
2. Πόσες: 2–3 αρκούν
3. Πόσο: έως 3–4 λεπτά η καθεμία
4. Ασύρματο μικρόφωνο και λίγη μουσική για κάθε ομιλητή

—

Speeches are some of the most moving moments of a wedding, as long as they happen at the right time. 🎤🤍
1. When: after your entrance or before the main course
2. How many: 2–3 is plenty
3. How long: up to 3–4 minutes each
4. A wireless mic and a little music for each speaker

#weddingspeech #weddingtoast {AM_TAGS}"""
add('AMAZE', '2026-12-07', 'story', [(am_cta('Πόσο να κρατάει μια ομιλία;', 'How long should a speech be?', 'Έως 3–4 λεπτά.', 'Up to 3–4 minutes.', size=S), S)])

# 8/12 Τρι — REEL party highlights (βλ. reel_week4.py) + story
CAP[('AMAZE', '2026-12-08')] = f"""Σαμπάνια που ρέει, μια νύφη στη μέση της πίστας και καλεσμένοι που δεν κάθονται ούτε λεπτό. 🥂✨
Αυτές είναι οι στιγμές για τις οποίες δουλεύουμε.

—

Champagne flowing, a bride in the middle of the dance floor and guests who never sit down. 🥂✨
These are the moments we work for.

#partyhighlights #weddingparty #weddingreels {AM_TAGS}"""
add('AMAZE', '2026-12-08', 'story', [(am_story_photo('amaze_bride_dancefloor.jpg', 'Οι μικρές στιγμές', 'The little moments', kicker='Party highlights', pos='center 45%', extra_gr='Αυτές που θα θυμάστε για πάντα.', extra_en='The ones you’ll remember forever.'), S)])

# 9/12 Τετ — προγλέντι & γάμος (ο Πέτρος: brunch/pool party υπερσπάνια, το προγλέντι γίνεται συχνά)
add('AMAZE', '2026-12-09', 'post', [
    (am_cover('amaze_setup_sea_flag.jpg', 'Προγλέντι & γάμος', 'Δύο βραδιές, ένας DJ', 'Two nights, one DJ', pos='center 50%', gr_px=96), P),
    (am_point(1, 3, 'Το προγλέντι', 'The pre-wedding party', 'Η πρώτη βραδιά με οικογένεια και φίλους. Πιο χαλαρό ύφος, ίδια διάθεση για χορό.', 'The first night with family and friends. A relaxed vibe, the same urge to dance.', photo='amaze_rooftop_sunset_speakers.jpg', pos='center 40%'), P),
    (am_point(2, 3, 'Η μεγάλη μέρα', 'The big day', 'Τελετή, δεξίωση, πρώτος χορός και πάρτι μέχρι αργά.', 'Ceremony, reception, first dance and a party until late.', photo='amaze_couple_entrance_lights.jpg', pos='center 35%'), P),
    (am_point(3, 3, 'Ο ίδιος DJ και τις δύο βραδιές', 'The same DJ both nights', 'Από το προγλέντι ξέρει ήδη τους καλεσμένους σας και τι τους σηκώνει στην πίστα. Στον γάμο ξεκινάει έτοιμος.', 'From the pre-wedding party he already knows your guests and what gets them dancing. On the wedding night, he starts ready.'), P),
    (am_review('Εξαιρετικοί DJs!! Μας συντρόφευσαν και σε προγλέντι και σε γάμο!!', 'Anestis', lang_note='They were with us at both the pre-wedding party and the wedding!'), P),
    (am_cta('Κάνετε και προγλέντι;', 'Having a pre-wedding party too?', 'Στείλτε μας τις ημερομηνίες και σχεδιάζουμε τη μουσική και για τις δύο βραδιές.', 'Send us both dates and we’ll plan the music for both nights.'), P),
])
CAP[('AMAZE', '2026-12-09')] = f"""Πολλά ζευγάρια γιορτάζουν τον γάμο τους σε δύο βραδιές: προγλέντι και γάμος. 🥂💍
1. Το προγλέντι: πιο χαλαρό ύφος, ίδια διάθεση για χορό
2. Η μεγάλη μέρα: τελετή, δεξίωση, πάρτι
3. Ο ίδιος DJ και τις δύο βραδιές: ξέρει ήδη τους καλεσμένους σας

—

Many couples celebrate over two nights: a pre-wedding party and the wedding. 🥂💍
1. The pre-wedding party: a relaxed vibe, the same urge to dance
2. The big day: ceremony, reception, party
3. The same DJ both nights: he already knows your guests

#prewedding #welcomeparty #προγλέντι {AM_TAGS}"""
add('AMAZE', '2026-12-09', 'story', [(am_cta('Κάνετε και προγλέντι;', 'Having a pre-wedding party?', 'Ο ίδιος DJ μπορεί να είναι και στις δύο βραδιές.', 'The same DJ can be there on both nights.', size=S), S)])

# 10/12 Πεμ — promo: μία ομάδα για όλη τη μέρα
add('AMAZE', '2026-12-10', 'post', [(am_cover('amaze_entrance_sparklers.jpg', 'Τελετή · Δεξίωση · Πάρτι', 'Μία ομάδα για όλη τη μέρα σας', 'One team for your whole day', pos='center 50%', swipe=False, gr_px=92), P)])
CAP[('AMAZE', '2026-12-10')] = f"""Από το «ναι» στην τελετή μέχρι το τελευταίο τραγούδι. ✨
Ήχος για την τελετή, μουσική για το cocktail, DJ για το πάρτι, φως και εφέ για τον πρώτο χορό: όλα από μία ομάδα, που ξέρει το πρόγραμμά σας από την αρχή.
Στείλτε μας ημερομηνία και χώρο για να δούμε τη διαθεσιμότητά μας.

—

From the “I do” to the very last song. ✨
Ceremony sound, cocktail music, a DJ for the party, lighting and effects for your first dance: all from one team that knows your plan from the start.
Send us your date and venue to check our availability.

#weddingday #weddingmusic {AM_TAGS}"""
add('AMAZE', '2026-12-10', 'story', [(am_review('Ήταν δίπλα μας σε ό,τι χρειαστήκαμε.', 'Χριστίνα', lang_note='They were by our side for everything we needed.', size=S), S)])

# 11/12 Παρ — behind the decks
add('AMAZE', '2026-12-11', 'post', [
    (am_cover('amaze_dj_smile.jpg', 'Behind the decks', 'Πίσω από τα decks, σε μια μέρα γάμου', 'Behind the decks on a wedding day', pos='center 30%', gr_px=84), P),
    (am_point(1, 4, 'Στον δρόμο', 'On the road', 'Ο εξοπλισμός φορτώνεται από νωρίς, με όλα τα εφεδρικά μαζί.', 'The gear is loaded early, with every backup on board.', photo='amaze_van.jpg', pos='center 55%'), P),
    (am_point(2, 4, 'Στήσιμο', 'Set-up', 'Ώρες πριν έρθουν οι καλεσμένοι: ηχεία, φώτα, booth και καλώδια τακτοποιημένα.', 'Hours before guests arrive: speakers, lights, booth and tidy cables.', photo='amaze_booth_terrace.jpg', pos='center 55%'), P),
    (am_point(3, 4, 'Soundcheck', 'Soundcheck', 'Μικρόφωνα για τις ομιλίες, μουσική για την είσοδο και τον πρώτο χορό: όλα δοκιμασμένα.', 'Mics for the speeches, music for the entrance and first dance: all tested.'), P),
    (am_point(4, 4, 'Η βραδιά', 'The night', 'Από το booth βλέπουμε όλη την πίστα και προσαρμόζουμε τη μουσική στον κόσμο σας.', 'From the booth we see the whole floor and adapt the music to your crowd.', photo='amaze_booth_view.jpg', pos='center 50%'), P),
    (am_review('Εξαιρετικός DJ και υπέροχος επαγγελματίας! Κατάλαβε ακριβώς το στυλ και την ατμόσφαιρα που θέλαμε.', 'Ελπίδα', lang_note='An excellent DJ and a true professional! He understood exactly the style and atmosphere we wanted.'), P),
    (am_cta('Θέλετε να γνωριστούμε;', 'Want to meet us?', 'Στείλτε μας μήνυμα και κλείνουμε ένα πρώτο ραντεβού.', 'Send us a message and we’ll set up a first meeting.'), P),
])
CAP[('AMAZE', '2026-12-11')] = f"""Το πάρτι κρατάει μερικές ώρες. Η δουλειά για να γίνει ξεκινάει πολύ νωρίτερα. 🎧
1. Φόρτωση με όλα τα εφεδρικά
2. Στήσιμο ώρες πριν έρθουν οι καλεσμένοι
3. Soundcheck για ομιλίες, είσοδο και πρώτο χορό
4. Και μετά, από το booth, όλη η βραδιά

—

The party lasts a few hours. The work behind it starts much earlier. 🎧
1. Loading up, backups included
2. Set-up hours before guests arrive
3. Soundcheck for speeches, entrance and first dance
4. And then, from the booth, the whole night

#behindthescenes #djlife #weddingday {AM_TAGS}"""
add('AMAZE', '2026-12-11', 'story', [(am_story_photo('amaze_speaker_flowers.jpg', 'Λίγες ώρες πριν', 'A few hours before', kicker='Behind the decks', pos='center 45%'), S)])

# 12/12 Σαβ — τι να στείλετε στον DJ
add('AMAZE', '2026-12-12', 'post', [
    (am_cover('amaze_first_dance_white.jpg', 'Music planning', 'Τι να στείλετε στον DJ σας πριν τον γάμο', 'What to send your DJ before the wedding', pos='center 50%', gr_px=82), P),
    (am_qlist('Η λίστα σας', 'Your checklist', [('Το πρόγραμμα της βραδιάς, με ώρες', 'Your timeline, with times'), ('Τα τραγούδια για είσοδο, τούρτα και πρώτο χορό', 'Songs for the entrance, cake and first dance'), ('Τη λίστα «οπωσδήποτε» και τη λίστα «ποτέ»', 'Your must-play and do-not-play lists')], count='01 / 02'), P),
    (am_qlist('Η λίστα σας', 'Your checklist', [('Ονόματα για ανακοινώσεις, με τη σωστή προφορά', 'Names for announcements, with pronunciation'), ('Ποιοι θα μιλήσουν και πότε', 'Who’s giving a speech, and when'), ('Ένα τηλέφωνο επικοινωνίας για την ημέρα', 'A contact number for the day')], start=4, count='02 / 02'), P),
    (am_review('Τα τραγούδια που του έδωσα τα ακολούθησε πιστά, τα χώρεσε εκεί που έπρεπε και φάνηκε η εμπειρία του.', 'Michael', lang_note='He followed the songs I gave him faithfully and fit them in exactly where they belonged.'), P),
    (am_cta('Η φόρμα μουσικής μας', 'Our music form', 'Τα ζητάμε όλα σε μία φόρμα, για να μη σας ξεφύγει τίποτα.', 'We collect it all in one form, so nothing slips through.'), P),
])
CAP[('AMAZE', '2026-12-12')] = f"""Τι χρειάζεται ο DJ σας πριν τον γάμο; 📝
1. Το πρόγραμμα της βραδιάς, με ώρες
2. Τα τραγούδια για είσοδο, τούρτα και πρώτο χορό
3. Τη λίστα «οπωσδήποτε» και τη λίστα «ποτέ»
4. Ονόματα για ανακοινώσεις, με τη σωστή προφορά
5. Ποιοι θα μιλήσουν και πότε
6. Ένα τηλέφωνο επικοινωνίας για την ημέρα
Αποθηκεύστε το για αργότερα 📌

—

What does your DJ need before the wedding? 📝
1. Your timeline, with times
2. Songs for the entrance, cake and first dance
3. Your must-play and do-not-play lists
4. Names for announcements, with pronunciation
5. Who’s giving a speech, and when
6. A contact number for the day
Save this for later 📌

#weddingchecklist #weddingmusic {AM_TAGS}"""
add('AMAZE', '2026-12-12', 'story', [(am_cta('Ένα όνομα με δύσκολη προφορά;', 'A tricky name to pronounce?', 'Στείλτε μας ένα ηχητικό!', 'Send us a voice note!', size=S), S)])

# 13/12 Κυρ — last dance
add('AMAZE', '2026-12-13', 'post', [
    (am_cover('amaze_party_selfie.jpg', 'Last dance', 'Ο τελευταίος χορός: πώς κλείνει σωστά μια βραδιά', 'The last dance: ending the night right', pos='center 40%', gr_px=78), P),
    (am_point(1, 4, 'Ένα τραγούδι για όλους', 'A song for everyone', 'Ένα τραγούδι που ξέρουν όλοι, για να βρεθούν όλοι μαζί στην πίστα μια τελευταία φορά.', 'A song everyone knows, so the whole crowd ends up on the floor together one last time.'), P),
    (am_point(2, 4, 'Ή κάτι μόνο για εσάς', 'Or something just for you', 'Ένας ήσυχος τελευταίος χορός για τους δυο σας, με τους καλεσμένους γύρω σας.', 'A quiet final dance for the two of you, with your guests all around.', photo='amaze_first_dance_white.jpg', pos='center 55%'), P),
    (am_point(3, 4, 'Μάθετε την ώρα λήξης', 'Know the end time', 'Ρωτάμε από πριν μέχρι τι ώρα επιτρέπει μουσική ο χώρος, ώστε η βραδιά να μην κοπεί απότομα.', 'We check the venue’s music curfew in advance, so the night never ends abruptly.'), P),
    (am_point(4, 4, 'Ένα τελευταίο «wow»', 'One last wow', 'Σπίθες ή φώτα στο τελευταίο ρεφρέν, και η βραδιά κλείνει με όλους στην πίστα.', 'Sparks or lights on the final chorus, and the night ends with everyone dancing.'), P),
    (am_review('Όλα έγιναν όπως τα είπαμε και ακόμα καλύτερα, οι καλεσμένοι μας δεν σταμάτησαν να χορεύουν ούτε λεπτό!', 'Αθανασία', lang_note='Everything went as planned and even better, our guests didn’t stop dancing for a minute!'), P),
    (am_cta('Ποιο θα είναι το δικό σας τελευταίο τραγούδι;', 'What will your last song be?', 'Πείτε μας στα σχόλια!', 'Tell us in the comments!'), P),
])
CAP[('AMAZE', '2026-12-13')] = f"""Ο πρώτος χορός ανοίγει τη βραδιά. Ο τελευταίος είναι αυτός που θα θυμούνται όλοι φεύγοντας. 🌙
1. Ένα τραγούδι που ξέρουν όλοι
2. Ή ένας ήσυχος χορός μόνο για τους δυο σας
3. Μάθετε από πριν την ώρα λήξης του χώρου
4. Ένα τελευταίο «wow» στο τελευταίο ρεφρέν

Εσείς ποιο τραγούδι θα διαλέγατε;

—

The first dance opens the night. The last one is what everyone remembers on the way home. 🌙
1. A song everyone knows
2. Or a quiet dance just for the two of you
3. Know your venue’s end time in advance
4. One last wow on the final chorus

Which song would you pick?

#lastdance #weddingparty {AM_TAGS}"""
add('AMAZE', '2026-12-13', 'story', [(am_story_photo('amaze_outdoor_dance_night.jpg', 'Μέχρι το τελευταίο τραγούδι', 'Until the very last song', kicker='Last dance', pos='center 50%'), S)])

if __name__ == '__main__':
    import sys
    os.makedirs(OUT + '/NDT', exist_ok=True); os.makedirs(OUT + '/AMAZE', exist_ok=True)
    only = sys.argv[1] if len(sys.argv) > 1 else None
    jobs = [j for j in J if not only or only in j[0]]
    render_all(jobs, OUT)
    json.dump({f'{b}|{d}': c for (b, d), c in CAP.items()}, open(OUT + '/captions.json', 'w'), ensure_ascii=False, indent=1)
    print(len(jobs), 'rendered')
