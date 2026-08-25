# Quality Loss Report / Scrap — Yanfeng Plant 1032

Aplikace pro sledování scrapu a Quality Loss Rate. Otevírá se lokálně v prohlížeči
poklepáním na `index.html`. Bez buildu, bez serveru, bez instalace.

Kód je rozdělený do souborů (`css/`, `js/`), které `index.html` načítá jako
**klasické `<script>` tagy — ne ES moduly**. Moduly by přes `file://` neprošly
CORS a aplikace by se neotevřela z disku. Proto se skripty spoléhají na společný
globální scope a **na pořadí načtení v `index.html`**.

---

## Slovník

| Pojem | Význam |
|---|---|
| **QLR** | Quality Loss Rate = náklady na nekvalitu / Sales × 100 |
| **w/o tests** | Scrap bez testovacích a nájezdových dílů a bez dodavatelských. Ukazatel, který se porovnává s targetem. |
| **with tests** | Vše včetně testů, nájezdů a **zákaznických reklamací**. Z toho se počítá vykazovaný QLR %. Přichází až po uzávěrce měsíce. |
| **Saving EUR** | (Target % − Scrap w/o tests %) × Sales |
| **CI task** | Přísnější cíl včetně Continuous Improvement úkolů. Sloupec „Target includes additional CI task". |
| **Rework** | Oprava vadného dílu místo jeho vyhození. Sleduje se v hodinách i EUR, ale **do QLR % se nezapočítává** — je vedle scrapu. |
| **QAD** | ERP, ze kterého chodí měsíční scrap exporty |
| **TL** | Team Leader — hlavní uživatel denního přehledu |

---

## Výpočty — NEMĚNIT bez ověření

Filtr scrapu z QAD:

```
w/o tests   = Excluded? == "NO"  AND  Reason != "20"
with tests  = Excluded? == "NO"              (vše, včetně dodavatele)
```

Kód **20 = dodavatel**. Nepočítá se do w/o tests, ale je ve with tests.
U G463 M dělá dodavatelský scrap zhruba 100 tis. € měsíčně — je to celý rozdíl
mezi oběma ukazateli, takže záměna metodiky změní číslo několikanásobně.

### Mapování sloupců v QAD exportu

Ověřeno na reálných datech. Sloupce se v exportech posouvají,
proto se hledají **podle názvu, ne podle pozice**:

| Sloupec | Použití |
|---|---|
| `Reason` | kód důvodu — filtr `!= "20"` |
| `Description reason` | textový popis důvodu |
| `Month` | číslo měsíce 1–12 |
| `Group 2` | projekt / platforma |
| `Location` | kód pracoviště |
| `Excluded?` | YES / NO |
| `EUR` | částka |
| `Quantity Change` | počet kusů (brát absolutní hodnotu) |
| `Item Number` | číslo dílu |

> Pozor: v květnovém exportu měl soubor 59 sloupců místo obvyklých ~30.
> Pozice se posunuly, názvy zůstaly. Nikdy nepoužívat pevné indexy.

---

## Odkud se berou targety

**Autoritativní zdroj je list `Target` v QAD exportu** — obsahuje workplan
s cíli pro každý projekt a každý měsíc. Hodnoty jsou desetinné (0.008936 = 0,8936 %).

Ostatní zdroje NEPOUŽÍVAT jako primární:

- List `overview mng` má řádek „scrap target : 0,90%" — zaokrouhlené, jen ke kontrole.
- Sloupec „Target" v pivotu scrap reportu může být **odchylka od cíle**, ne cíl.
  V červnovém reportu byly hodnoty záporné (−0,68 %) — to nejsou targety.

Targety se mění **každý měsíc** a **pro každý projekt zvlášť**:
X540 měl v červenci 0,37 %, v srpnu 0,63 %. W206 z 1,06 % na 0,58 %.

Srpen 2026 má nový workplan, který v listu `Target` (červnový export) ještě není —
hodnoty pocházejí ze screenshotu scrap reportu.

---

## Oficiální měsíční souhrny

List `overview mng` v QAD exportu obsahuje sekce `without tests` a `with tests`.
Řádek `Total` má EUR i procento — ze **Sales = EUR / procento** se zpětně dopočítá obrat.

Takto ověřeno:

| měsíc | w/o EUR | w/o % | with EUR | Sales | target |
|---|---|---|---|---|---|
| červen 26 | 102 357 | 0,571 % | 197 232 | 17 927 513 | 0,8985 % |
| červenec 26 | 100 474 | 0,603 % | 246 160 | 16 660 896 | 0,8029 % |
| srpen 26 (k 23. 8.) | 59 678 | 0,774 % | — | 7 711 715 | 0,86 % |

**Nepočítat „with tests" jen z QAD** — zákaznické reklamace tam nejsou.
Červenec z QAD dá 198 043 €, oficiálně je to 246 160 €.

---

## Známé pasti

**Target je v procentech, ne v setinách.** Pole `QT` drží 0.904 = 0,904 %.
Nikdy nenásobit stem. Chyba způsobila, že se osa grafu roztáhla na 100 %
a všechny sloupce splynuly s nulovou čárou.

**ASY005 není GVBX.** QAD master data mají u kódu ASY005 popis „GVBX Assembly",
ale reálně tam běží X540 a W520 — potvrzeno čísly dílů (`ASM IP LHD BASE X540`).
Popisky pracovišť proto pocházejí z mapy `LOCNAMES` v kódu, ne z QAD.
Lokace se klíčují **kódem**, ne popisem.

**Neuzavřený měsíc nemá with tests.** Nepočítat pro něj rolling 12M —
zkreslil by trend. Sledováno v objektu `PART`.

**Plugin datalabels nemá v kontextu `c.raw`.** Dostane jen
`{active, chart, dataIndex, dataset, datasetIndex}` — `c.raw` má tooltip, ne datalabels.
Podmínka `display: c => c.raw != null` je proto vždy nepravdivá a čísla ve sloupcích
zmizí. Hodnota se bere přes `dlVal(c)` z `js/core/utils.js`. Popisky nad sloupcem
(`anchor:'end'`) navíc nesmí být bílé — sedí na bílém pozadí, ne v grafu.

**Report obsahuje jen 11 projektů.** QAD má navíc PO455, V530, YFA, W520.
Součty se proto mohou lišit — pro srovnání s reportem filtrovat na projekty z reportu.

---

## Struktura aplikace

Šest záložek:

Pořadí dlaždic drží tři přehledy vepředu, detaily a správu vzadu:

1. **QLR měsíčně** — rolling 12M, year over year, scrap EUR. Historie 2024–2026
   je zapsaná přímo v kódu (pole `LBL`, `QW`, `QO`, `QT`, `EO`, `EW`, `SV`).
2. **Přehled scrapu** — z denních reportů, tempo a prognóza k cíli.
3. **Přehled reworku** — z reportů o reworku, hodiny i EUR, rozpad podle projektů,
   pracovišť, příčin a dílů. Vlastní import.
4. **Detail projektu** — pracoviště, reason kódy, kombinace. Bere denní data,
   při jejich absenci padá zpět na měsíční `MDET`.
5. **Data & import** — nahrávání denních reportů, seznam dnů, záloha.
6. **Zdrojová data** — vzorec, roční souhrn, měsíční tabulka.
7. **Nastavení** — cíl v EUR, pracovní dny, cíl a sazba reworku, měsíční
   a projektové targety.

Záložky se přepínají podle **pořadí v DOM**, ne podle `id` — `go(i)` sahá na
`querySelectorAll('.view')[i]`. Když se dlaždice přeskládají, musí se spolu s nimi
posunout i bloky `<div class="view">` a indexy v `js/core/nav.js`
(`go`, `renderBar`, `openProj`, `setM`).

### Soubory

| Soubor | Co v něm je |
|---|---|
| `index.html` | jen HTML kostra záložek + seznam skriptů v pořadí načtení |
| `css/styles.css` | všechny styly, Yanfeng paleta |
| `js/data/qlr-history.js` | měsíční historie — `LBL`, `QW`, `QO`, `QT`, `EO`, `EW`, `SV`, `MONTHLY`, `YRSUM`, `TOPPARTS25/26` |
| `js/data/monthly-detail.js` | `MDET` — měsíční rozpad podle projektů |
| `js/data/targets.js` | `TGTM`, `PTGTM`, `PSAL`, `AUG` + `mKey`/`mTgt`/`mSales`/`pTgt`/`pSales` |
| `js/data/locations.js` | `LOCNAMES` — názvy pracovišť |
| `js/core/utils.js` | registrace Chart.js, formátovače, `mk()`, `toast()`, stav UI |
| `js/core/storage.js` | `localStorage` — načtení a ukládání |
| `js/core/aggregate.js` | součty a rozpady denních dat |
| `js/core/rework.js` | `RW` agregace — měsíce, projekty, rozpady reworku |
| `js/core/nav.js` | přepínání záložek, horní lišta |
| `js/views/qlr.js` | záložka 0 — grafy rolling 12M, YoY, scrap EUR |
| `js/views/top.js` | záložka 0 — TOP kontributoři a jejich rozpad |
| `js/views/dash.js` | záložka 1 — přehled scrapu |
| `js/views/rework.js` | záložka 2 — přehled reworku |
| `js/views/project.js` | záložka 3 — detail projektu |
| `js/views/data.js` | záložka 4 — seznam dnů, záloha, obnova |
| `js/views/source.js` | záložka 5 — zdrojová data |
| `js/views/targets.js` | záložka 6 — targety a Sales |
| `js/import/parser.js` | čtení denních `.xlsx` reportů |
| `js/import/rework-parser.js` | čtení reportů o reworku — sdílí pomocníky s `parser.js`, musí se načítat až za ním |
| `js/main.js` | start aplikace |

**Pořadí skriptů v `index.html` je závazné:** data → jádro → záložky → import →
start. `js/main.js` musí zůstat poslední — spouští první vykreslení. Nové soubory
zařazovat podle toho, co používají při načtení, ne až při volání funkce.

Funkce volané z HTML atributů (`onclick`, `onchange`) se přiřazují jako
`window.nazev = ...`, aby zůstaly dostupné bez ohledu na to, ve kterém souboru jsou.

Denní data se ukládají do `localStorage` prohlížeče (klíč `yf_scrap_daily_v2`),
rework v `yf_rework_daily_v1`. Targety v `yf_tgtm` a `yf_ptgtm`, nastavení
v `yf_scrap_set_v1`. Záloha v záložce Data & import bere scrap i rework.

Chart.js, plugin datalabels a SheetJS se stahují z CDN — bez internetu se
aplikace otevře, ale grafy a import nefungují.

Klíčové datové struktury:

- `MDET` — měsíc → projekt → `{wt, wo, L[], R[], P[]}` (lokace, reasony, kombinace)
- `TGTM` — měsíc → `{t, ci, sales, part}`
- `PTGTM` — měsíc → projekt → `[target, targetCI]`
- `PSAL` — měsíc → projekt → Sales
- `RW` — den → `{eur, hrs, qty, calc, src, p:{projekt:{e,h,q, l{}, r{}, it{}}}}`

### Rework

Sleduje se **vedle scrapu, ne v QLR** — historie QLR zůstává ověřená proti scrap reportu.
Parser hledá sloupce podle názvu stejně jako u scrapu (seznam názvů je v `RWCOL`),
povinné je datum a k tomu hodiny nebo EUR. Řádky s `Excluded? = YES` se přeskakují;
filtr na reason 20 se **nepoužívá** — kód 20 je dodavatelský scrap, na rework se nevztahuje.

Když soubor nemá sloupec s částkou, EUR se dopočítá ze sazby v Nastavení
(`SET.rwRate`) a den se označí `calc:true` — v UI se to napíše do výstražného pruhu.
Cíl reworku (`SET.rwTarget`) je nepovinný; když je nula, neukazuje se tempo ani
prognóza proti cíli, jen skutečnost.

---

## Jak pracovat s tímhle projektem

**Ověřovat proti reportu.** Každou změnu ve výpočtu porovnat s číslem
ze scrap reportu. Červenec musí vyjít na 100 474 € — když ne, je chyba ve filtru.

**Neměnit historická data bez zdroje.** Pokud číslo nesedí, najít ho v QAD
souboru nebo se zeptat. Nedopočítávat odhadem — červnová data byla jednou
takto odhadnutá špatně.

**Uvádět zdroj v UI.** Když se data berou z jiného místa než obvykle
(měsíční místo denních, odhad místo reportu), napsat to uživateli přímo do rozhraní.

**Čeština.** Veškeré texty v UI i komunikace česky.

**Yanfeng styl.** Barvy: `--dark:#1B3A5C`, `--mid:#2E6DA4`, `--accent:#E8A020`,
`--green:#27AE60`, `--red:#C0392B`. Font Inter / Segoe UI.
Tmavě modré hlavičky panelů, KPI karty s barevným levým pruhem.

---

## Co je potřeba udělat

- [x] Rozdělit `index.html` — hotovo, kód je v `css/` a `js/`
- [ ] Skript, který z QAD exportu vygeneruje datové bloky místo ručního přepisování
- [ ] Doplnit srpnový QAD export → rozpad pracovišť za srpen
- [ ] Ověřit červnovou tabulku, která nesedí s QAD (G463 M 6 269 € vs 51 538 €)
