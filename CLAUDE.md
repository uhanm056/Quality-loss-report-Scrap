# Quality Loss Report / Scrap — Yanfeng Plant 1032

Aplikace pro sledování scrapu a Quality Loss Rate. Jeden samostatný HTML soubor
(`index.html`), který se otevírá lokálně v prohlížeči. Bez buildu, bez serveru.

---

## Slovník

| Pojem | Význam |
|---|---|
| **QLR** | Quality Loss Rate = náklady na nekvalitu / Sales × 100 |
| **w/o tests** | Scrap bez testovacích a nájezdových dílů a bez dodavatelských. Ukazatel, který se porovnává s targetem. |
| **with tests** | Vše včetně testů, nájezdů a **zákaznických reklamací**. Z toho se počítá vykazovaný QLR %. Přichází až po uzávěrce měsíce. |
| **Saving EUR** | (Target % − Scrap w/o tests %) × Sales |
| **CI task** | Přísnější cíl včetně Continuous Improvement úkolů. Sloupec „Target includes additional CI task". |
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

**Report obsahuje jen 11 projektů.** QAD má navíc PO455, V530, YFA, W520.
Součty se proto mohou lišit — pro srovnání s reportem filtrovat na projekty z reportu.

---

## Struktura aplikace

`index.html` — jeden soubor, pět záložek:

1. **QLR měsíčně** — rolling 12M, year over year, scrap EUR. Historie 2024–2026
   je zapsaná přímo v kódu (pole `LBL`, `QW`, `QO`, `QT`, `EO`, `EW`, `SV`).
2. **Denní přehled** — z denních reportů, tempo a prognóza k cíli.
3. **Detail projektu** — pracoviště, reason kódy, kombinace. Bere denní data,
   při jejich absenci padá zpět na měsíční `MDET`.
4. **Data & import** — nahrávání denních reportů, seznam dnů, záloha.
5. **Zdrojová data** — vzorec, roční souhrn, měsíční tabulka.

Denní data se ukládají do `localStorage` prohlížeče (klíč `yf_scrap_daily_v2`).
Targety v `yf_tgtm` a `yf_ptgtm`.

Klíčové datové struktury:

- `MDET` — měsíc → projekt → `{wt, wo, L[], R[], P[]}` (lokace, reasony, kombinace)
- `TGTM` — měsíc → `{t, ci, sales, part}`
- `PTGTM` — měsíc → projekt → `[target, targetCI]`
- `PSAL` — měsíc → projekt → Sales

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

- [ ] Rozdělit `index.html` — 126 KB v jednom souboru se špatně upravuje
- [ ] Skript, který z QAD exportu vygeneruje datové bloky místo ručního přepisování
- [ ] Doplnit srpnový QAD export → rozpad pracovišť za srpen
- [ ] Ověřit červnovou tabulku, která nesedí s QAD (G463 M 6 269 € vs 51 538 €)
