#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Slepí aplikaci do jednoho HTML souboru pro poslání e-mailem nebo na flashku.

   Aplikace sama žádný build nepotřebuje — `index.html` se otevře z disku tak,
   jak je. Tenhle skript je jen na případ, kdy se má poslat jeden soubor místo
   celé složky: vloží dovnitř všechno z `css/` a `js/` v pořadí, v jakém je
   `index.html` načítá.

   Co v jednosouborové verzi nefunguje:
     · sdílení dat — `file://` má origin `null` a Firestore tam nejede
       (panel Sdílení dat to napíše, aplikace jinak funguje normálně)
     · grafy a import bez internetu — Chart.js a SheetJS jdou z CDN

   Výsledek je zmražená kopie a `.gitignore` ho drží mimo repozitář, aby tam
   nezestaral. Po každé změně v `css/` nebo `js/` se musí vygenerovat znovu:

       python3 tools/bundle.py

   Součást aplikace Scrap & QLR — Yanfeng Plant 1032."""

import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = 'Scrap_QLR_Plant1032.html'

# odkazy na vlastní soubory; CDN skripty zůstávají, jak jsou
LINK = re.compile(r'<link rel="stylesheet" href="(css/[^"?]+)[^"]*">'
                  r'|<script src="(js/[^"?]+)[^"]*"></script>')


def build():
    src = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    parts, pos, n = [], 0, 0
    for m in LINK.finditer(src):
        parts.append(src[pos:m.start()])
        pos = m.end()
        rel = m.group(1) or m.group(2)
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            sys.exit('chybí soubor %s, na který se odkazuje index.html' % rel)
        # `</script>` uvnitř JS by ukončilo obalující značku
        body = io.open(path, encoding='utf-8').read().replace('</script', r'<\/script')
        tag = 'style' if m.group(1) else 'script'
        parts.append('<%s>\n/* === %s === */\n%s\n</%s>' % (tag, rel, body, tag))
        n += 1
    parts.append(src[pos:])
    html = ''.join(parts)
    if not n:
        sys.exit('v index.html nejsou žádné odkazy na css/ ani js/ — nic ke slepení')
    dst = os.path.join(ROOT, OUT)
    io.open(dst, 'w', encoding='utf-8').write(html)
    print('%s — %.0f kB, vloženo %d souborů'
          % (OUT, len(html.encode('utf-8')) / 1024.0, n))


if __name__ == '__main__':
    build()
