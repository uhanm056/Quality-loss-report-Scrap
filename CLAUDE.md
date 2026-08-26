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
7. **Nastavení** — cíl a sazba reworku, měsíční a projektové targety.
   Cíl scrapu se tu **nezadává** — počítá se jako target % × Sales.

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
| `js/core/daily.js` | rozpad jednoho dne, porovnání dnů, přepínač EUR / € na kus |
| `js/core/month.js` | měsíční výsledek proti targetu — cíl v EUR, rezerva, trend, kumulativ, `pace()` |
| `js/core/rework.js` | `RW` agregace — měsíce, projekty, rozpady reworku |
| `js/core/nav.js` | přepínání záložek, horní lišta |
| `js/views/qlr.js` | záložka 0 — grafy rolling 12M, YoY, scrap EUR |
| `js/views/top.js` | záložka 0 — TOP kontributoři a jejich rozpad |
| `js/views/dash.js` | záložka 1 — přehled scrapu, měsíční výsledek a denní tempo |
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

### Měsíční výsledek proti targetu

Počítá `js/core/month.js`, ukazuje záložka **Přehled scrapu**.

```
cíl v EUR   = target % × Sales        (obojí z TGTM, tabulka v Nastavení)
skutečnost %= scrap EUR / Sales × 100
rezerva     = cíl v EUR − skutečnost  (kladná = pod cílem)
```

Skutečnost se bere z prvního dostupného zdroje v tomto pořadí a ten se **vždy
napíše do UI**:

1. `EO` — ověřený scrap report (uzavřené měsíce)
2. `MDET` — měsíční QAD export
3. denní reporty z `DB`

Pro červenec dá `EO` 100 474 € a `MDET` 100 475 € — přednost má report.

**U probíhajícího měsíce (`part`) jsou scrap i Sales ke stejnému snímku dat.**
Cíl v EUR je proto taky jen k tomu snímku. Prognóza z denního tempa je za celý
měsíc, takže se s tímhle cílem **neporovnává** — v UI je to napsané a porovnává
se v % ze Sales.

Jediný odhad v aplikaci je panel „Odhad celého měsíce": vezme dosavadní % a
Sales předchozího měsíce. Předpoklad je napsaný v hlavičce panelu. Jakmile se
do Nastavení doplní skutečné Sales, počítá se všechno znovu z reálných čísel.

Kumulativ 2026 sečte měsíční cíle a skutečnosti. Rezerva se může o pár set EUR
lišit od `SV` (saving ze scrap reportu) — `SV` se počítá až po uzávěrce.

### Den po dni

Počítá `js/core/daily.js`, ukazuje záložka **Přehled scrapu**.

Tři místa, kde je vidět, jestli se den zlepšil nebo zhoršil:

1. **Karta posledního dne** — hodnota, změna proti průměru předchozích 7 dnů
   a TOP 3 vady s projektem, na kterém vznikly.
2. **Křivka průměru 7 dnů** v denním grafu — vyhladí výkyvy.
3. **Tabulka den po dni** — změna proti předchozímu dni i proti průměru,
   hlavní vada a projekt; rozbalení ukáže vady, projekty a pracoviště dne.

Porovnává se v EUR, přepínačem i v **EUR na kus** (`dayU`) — ten očistí vliv
objemu výroby. Řádek dne, který je o čtvrtinu horší než průměr předchozích
dnů, se obarví. Jména projektů jsou proklik do Detailu projektu.

`prevAvg()` počítá průměr **bez aktuálního dne** — jinak by se den porovnával
sám se sebou a výkyv by se schoval. `movAvg()` do grafu aktuální den zahrnuje.

### Rework

Sleduje se **vedle scrapu, ne v QLR** — historie QLR zůstává ověřená proti scrap reportu.
Parser hledá sloupce podle názvu stejně jako u scrapu (seznam názvů je v `RWCOL`),
povinné je datum a k tomu hodiny nebo EUR. Řádky s `Excluded? = YES` se přeskakují;
filtr na reason 20 se **nepoužívá** — kód 20 je dodavatelský scrap, na rework se nevztahuje.

Když soubor nemá sloupec s částkou, EUR se dopočítá ze sazby v Nastavení
(`SET.rwRate`) a den se označí `calc:true` — v UI se to napíše do výstražného pruhu.
Cíl reworku (`SET.rwTarget`) je nepovinný; když je nula, neukazuje se tempo ani
prognóza proti cíli, jen skutečnost.

Ověřeno na reálném souboru `Rework_Master_IMM_2026.xlsx`: list `Rework`, hlavička
až na třetím řádku, sloupce `Datum`, `Projekt`, `Díl`, `Ks`, `Operátorů`,
`Doba (h)`, `Náklad (€)`, `Důvod`. Pracoviště v něm není a `Důvod` je prázdný —
prázdné sloupce se nezapisují a příslušné panely se neukazují.

**EUR i hodiny se ukládají na tři desetinná místa.** Sčítá se po dnech, takže
hrubší zaokrouhlení rozhodí měsíční součet: duben vychází 9418,502 € a při
zaokrouhlení na celé EUR po dnech spadl na 9418 místo 9419.

### Tempo a prognóza — počítá se z kalendáře

`pace()` v `js/core/month.js`. Počet nahraných dnů se na to použít **nedá** —
závod nejede každý den stejně a dnů s reportem bývá víc než plánovaných
pracovních dnů (červenec má 29 dnů s daty). Dřív z toho vycházelo „29 dnů z 21".

```
share = poslední den s daty / počet dnů v měsíci
fc    = skutečnost / share            (prognóza konce měsíce)
allow = cíl v EUR × share             (povoleno k dnešku)
exp   = odhad počtu dnů s výrobou za celý měsíc
```

Měsíc je uzavřený, když má data do posledního dne **nebo** už podle kalendáře
skončil. `cover` hlídá, jestli reporty pokrývají uplynulou část měsíce; pod 50 %
se prognóza ani povolené tempo nepočítají — chybějící dny nejsou nuly.

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
