# Quality-loss-report-Scrap

Scrap collection and Quality loss report — Yanfeng Plant 1032.

Aplikace se otevírá poklepáním na `index.html` přímo z disku.
Žádný build ani server, jen prohlížeč (Chrome / Edge / Firefox).

Ke stažení celé složky: **Code → Download ZIP**, rozbalit a otevřít `index.html`.
Soubory `css/` a `js/` musí zůstat vedle `index.html`.

| Složka | Obsah |
|---|---|
| `index.html` | kostra stránky a pořadí načítání skriptů |
| `css/` | styly |
| `js/data/` | data zapsaná v aplikaci — historie QLR, targety, názvy pracovišť |
| `js/core/` | jádro — formátování, úložiště, agregace, navigace |
| `js/views/` | jednotlivé záložky |
| `js/import/` | čtení denních `.xlsx` reportů |
| `js/main.js` | start aplikace |

Podrobnosti k výpočtům a datům jsou v [CLAUDE.md](CLAUDE.md).
