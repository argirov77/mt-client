# -*- coding: utf-8 -*-
"""Generator for Maximov Tours Google Ads Editor bulk-import CSVs.
Validates every Google Ads length limit and fails loudly on any violation.
Character count = Unicode code points (== what Google Ads counts for these strings)."""
import csv, io, os, sys

OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else "google-ads-bulk"

CAMPAIGN = "Search — Маршруты — Exact — UA/BG"

# Fixed headlines 4..12 (shared across all groups)
FIXED_HEADLINES = [
    "Быстро проходим границу",   # 4
    "На линии с 1992 года",      # 5
    "Лицензионная линия",        # 6
    "Остановки в пути",          # 7
    "Современный автопарк",      # 8
    "Купи билет за 2 минуты",    # 9
    "Бронь билета онлайн",       # 10
    "Wi-Fi, кондиционер, USB",   # 11
    "Максимов Турс",             # 12
]

# Fixed descriptions 2..4 (shared)
DESC_2 = "Купи или забронируй билет онлайн за 2 минуты. Wi-Fi, кондиционер, USB."
DESC_3 = "Лицензионная регулярная линия. Быстро проходим границу."
DESC_4 = "Современный автопарк, салоны регулярно проходят химчистку."

# Per-group data.
# h1 built as f"Автобус {A}–{B}" (en dash U+2013)
# h2 = directional/destination variation, h3 = route-unique.
# desc1 = full description string (route detail baked in).
groups = [
    dict(n=2, name="Одесса — Бургас", A="Одесса", B="Бургас",
         A_gen="одессы", B_acc="бургас",
         url="https://maximovtours.com/odessa-burgas", path1="odessa-burgas",
         h2="Прямой рейс в Бургас", h3="Отправление от Привоза",
         desc1="Прямой автобус Одесса – Бургас через Варну. Опыт с 1992 года."),
    dict(n=3, name="Варна — Одесса", A="Варна", B="Одесса",
         A_gen="варны", B_acc="одессу",
         url="https://maximovtours.com/varna-odessa", path1="varna-odessa",
         h2="Прямой рейс в Одессу", h3="От автостанции Варны",
         desc1="Прямой автобус Варна – Одесса без пересадок. Опыт с 1992 года."),
    dict(n=4, name="Одесса — Солнечный берег", A="Одесса", B="Солнечный берег",
         A_gen="одессы", B_acc="солнечный берег",
         url="https://maximovtours.com/odessa-solnechniy-bereg", path1="odessa-sb",
         h2="Прямой рейс на Солн. берег", h3="Отправление от Привоза",
         desc1="Прямой автобус Одесса – Солнечный берег через Варну. Опыт с 1992 года."),
    dict(n=5, name="Бургас — Одесса", A="Бургас", B="Одесса",
         A_gen="бургаса", B_acc="одессу",
         url="https://maximovtours.com/burgas-odessa", path1="burgas-odessa",
         h2="Прямой рейс в Одессу", h3="Через Варну и Солн. берег",
         desc1="Прямой автобус Бургас – Одесса через Варну. Опыт с 1992 года."),
    dict(n=6, name="Солнечный берег — Одесса", A="Солнечный берег", B="Одесса",
         A_gen="солнечного берега", B_acc="одессу",
         url="https://maximovtours.com/solnechniy-bereg-odessa", path1="sb-odessa",
         h2="Прямой рейс в Одессу", h3="От Солнечного берега",
         desc1="Прямой автобус Солнечный берег – Одесса без пересадок. Опыт с 1992 года."),
    dict(n=7, name="Одесса — Констанца", A="Одесса", B="Констанца",
         A_gen="одессы", B_acc="констанцу",
         url="https://maximovtours.com/odessa-constanta", path1="odessa-const",
         h2="Прямой рейс в Констанцу", h3="Отправление от Привоза",
         desc1="Прямой автобус Одесса – Констанца без пересадок. Опыт с 1992 года."),
    dict(n=8, name="Констанца — Одесса", A="Констанца", B="Одесса",
         A_gen="констанцы", B_acc="одессу",
         url="https://maximovtours.com/constanta-odessa", path1="const-odessa",
         h2="Прямой рейс в Одессу", h3="От автовокзала Констанцы",
         desc1="Прямой автобус Констанца – Одесса без пересадок. Опыт с 1992 года."),
]

DASH = "–"  # en dash

errors = []

def check(cond, msg):
    if not cond:
        errors.append(msg)

def headlines_for(g):
    return [
        f"Автобус {g['A']}{DASH}{g['B']}",  # 1
        g["h2"],                              # 2
        g["h3"],                              # 3
    ] + FIXED_HEADLINES                       # 4..12

def descriptions_for(g):
    return [g["desc1"], DESC_2, DESC_3, DESC_4]

def keywords_for(g):
    A, B = g["A"].lower(), g["B"].lower()
    return [
        f"автобус {A} {B}",
        f"{A} {B} автобус",
        f"билеты {A} {B}",
        f"{A} {B} билеты",
        f"автобус из {g['A_gen']} в {g['B_acc']}",
    ]

# ---- validation ----
for g in groups:
    hs = headlines_for(g)
    check(len(hs) == 12, f"G{g['n']}: expected 12 headlines, got {len(hs)}")
    check(len(set(hs)) == 12, f"G{g['n']}: duplicate headline within group")
    for i, h in enumerate(hs, 1):
        check(len(h) <= 30, f"G{g['n']} H{i} len {len(h)}>30: {h!r}")
    ds = descriptions_for(g)
    check(len(ds) == 4, f"G{g['n']}: expected 4 descriptions")
    for i, d in enumerate(ds, 1):
        check(len(d) <= 90, f"G{g['n']} D{i} len {len(d)}>90: {d!r}")
    for kw in keywords_for(g):
        check(len(kw) <= 80, f"G{g['n']} keyword len {len(kw)}>80: {kw!r}")
        check(len(kw.split()) <= 10, f"G{g['n']} keyword >10 words: {kw!r}")
    check(len(g["path1"]) <= 15, f"G{g['n']} path1 len {len(g['path1'])}>15: {g['path1']!r}")

if errors:
    print("VALIDATION FAILED:")
    for e in errors:
        print("  -", e)
    sys.exit(1)

# ---- write files (UTF-8 with BOM) ----
os.makedirs(OUT_DIR, exist_ok=True)

def write_csv(fname, header, rows):
    path = os.path.join(OUT_DIR, fname)
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\r\n")
    w.writerow(header)
    for r in rows:
        w.writerow(r)
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        f.write(buf.getvalue())
    return path

# adgroups.csv
ag_rows = [[CAMPAIGN, g["name"], "Paused"] for g in groups]
write_csv("adgroups.csv", ["Campaign", "Ad Group", "Status"], ag_rows)

# keywords.csv
kw_rows = []
for g in groups:
    for kw in keywords_for(g):
        kw_rows.append([CAMPAIGN, g["name"], kw, "Exact", "Enabled"])
write_csv("keywords.csv",
          ["Campaign", "Ad Group", "Keyword", "Criterion Type", "Status"], kw_rows)

# ads.csv
ad_header = (["Campaign", "Ad Group", "Ad type"]
             + [f"Headline {i}" for i in range(1, 13)]
             + [f"Description {i}" for i in range(1, 5)]
             + ["Final URL", "Path 1", "Path 2", "Status"])
ad_rows = []
for g in groups:
    ad_rows.append([CAMPAIGN, g["name"], "Responsive search ad"]
                   + headlines_for(g) + descriptions_for(g)
                   + [g["url"], g["path1"], "", "Enabled"])
write_csv("ads.csv", ad_header, ad_rows)

# ---- length report ----
print("OK — all limits pass.\n")
print(f"Campaign: {CAMPAIGN}")
print(f"Groups: {len(groups)}  Keywords: {len(kw_rows)}  Ads: {len(ad_rows)}\n")
for g in groups:
    print(f"=== Ad group {g['n']}: {g['name']}  ({g['url']})  path1={g['path1']}({len(g['path1'])})")
    for i, h in enumerate(headlines_for(g), 1):
        print(f"  H{i:<2} [{len(h):>2}] {h}")
    for i, d in enumerate(descriptions_for(g), 1):
        print(f"  D{i}  [{len(d):>2}] {d}")
    for kw in keywords_for(g):
        print(f"  KW  [{len(kw):>2}/{len(kw.split())}w] {kw}")
    print()
