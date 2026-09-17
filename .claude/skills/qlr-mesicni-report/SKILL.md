---
name: qlr-mesicni-report
description: "Zpracuje měsíční QAD scrap export (ISS-SCRP) a vygeneruje Quality Loss Rate report — načtení dat, výpočet scrap w/o tests a with tests, rozpad po platformách a reason codes, validace. Použij při \"QLR za [měsíc]\", \"nový QAD export\", \"spočítej quality loss rate\", \"aktualizuj QLR šablonu\"."
---

# Měsíční QLR report (Yanfeng Planá, site 1032)

## Vstupy
- QAD export ISS-SCRP (XLSX, list `Data QAD`), kumulativní YTD
- Net Sales za daný měsíc — v listu `Data QAD` **nejsou**, ale bývají v listu
  `Pivot` ve sloupci `Sales EUR`. Když tam nejsou, vyžádej si je; bez nich QLR % nepočítej.
- Zdrojový Quality Loss Report pro validaci, je-li k dispozici

## Kroky

### 1. Načtení
- openpyxl, `read_only=True, data_only=True` **současně** (`data_only` samo spadne na velkých souborech, `read_only` samo vrátí vzorce jako text)
- `ws.iter_rows(values_only=True)`, list `Data QAD`
- Vše běží synchronně v jednom volání (`timeout 580`); `nohup ... &` mezi voláními nepřežije
- U datumů ověř `hasattr(d, 'strftime')` před `.strftime()`

### 2. Mapování sloupců — VŽDY podle názvu hlavičky
Nikdy ne podle písmene sloupce. Rozložení se mezi exporty liší.
Postav si `idx = {hlavicka: poradi}` z prvního řádku a hledej tyto názvy:
`Transaction Number`, `Reason`, `Reason Code Description`, `Description reason`,
`Group 2`, `Excluded?`, `EUR`, `Month`, `Effective Date`, `Date`, `Location`,
`Quantity Change`, `Item Number`, `Transaction Type`
Chybějící hlavičku nahlas jako chybu, nedomýšlej.

**Datum ber z `Effective Date`, ne z `Date`.** Export má obojí a **liší se**
(v srpnovém exportu na 206 řádcích z 38 755). `Effective Date` je datum zaúčtování
a podle něj se skládají měsíce.

(Referenční rozložení k 9/2026: Reason = AR, Group 2 = BA, Excluded? = BD, EUR = BF, Month = AY. Slouží jen ke kontrole, ne jako natvrdo zadané pořadí.)

### 3. Čištění
- Deduplikace přes `Transaction Number` jako **string** — má smysl jen když
  skládáš víc exportů dohromady. **Uvnitř jednoho exportu duplicity nejsou**
  (ověřeno na srpnovém: 0 z 38 755 řádků). Když jich najdeš hodně v jednom
  souboru, něco je špatně — nahlas to, nemaž potichu.
- **Záporné EUR se NEFILTRUJÍ.** Jsou to opravy a do součtu patří.
- Filtr `EUR > 0` použij **jen při počítání kusů**, nikdy při sčítání EUR —
  storno transakce mají kladné Qty a rozbíjejí počty, `abs(Qty)` je past.
- Vypiš do reportu: počet řádků, počet duplicit, počet řádků se záporným EUR

> **Ověřeno, proč:** červenec 2026 se zápornými řádky dá **100 474 €** — přesně
> jako zdrojový report. S filtrem `EUR > 0` vyjde **102 925 €**, tedy o 2 451 €
> víc (32 záporných řádků). Plošný filtr řádků součet rozbije.

### 4. Určení měsíce
- Export bývá useknutý uprostřed rozdělaného měsíce. Spočítej řádky na měsíc a poslední měsíc porovnej s předchozími.
- Když má výrazně méně řádků nebo data nedosahují konce měsíce, je **neuzavřený** — nikdy ho nevykazuj jako hotový měsíc. Report dělej za poslední uzavřený měsíc a neuzavřený zmiň jednou větou.
- Net Sales z listu `Pivot` jsou taky **jen k datu exportu**. U rozdělaného
  měsíce se s nimi smí porovnávat jedině scrap ke stejnému dni — celoměsíční
  scrap dělený snímkovými Sales dá nesmyslně vysoké procento.

### 5. Výpočet
Tři disjunktní skupiny řádků — každý řádek patří právě do jedné:

| skupina | filtr |
|---|---|
| **w/o tests** | `Excluded? = NO` AND `Reason ≠ "20"` |
| **testy a nájezdy** | `Excluded? = YES` |
| **dodavatel** | `Excluded? = NO` AND `Reason = "20"` |

Z nich se skládají vykazovaná čísla:

```
with tests = w/o tests + testy a nájezdy      ← z tohohle je QLR %
Total      = with tests + dodavatel
```

- **`with tests` NENÍ `Excluded? = NO`.** To je w/o tests + dodavatel a jako
  vykazované číslo je to **špatně** — za srpen dá 170 813 € místo 235 316 €.
  Dodavatelský scrap (kód 20) do with tests **nepatří**, je až v `Total`.
- **QLR % = with tests ÷ Net Sales × 100**.
- Bez Net Sales napiš „nelze spočítat — chybí Net Sales", nikdy nedosazuj odhad.

> **Nejdřív hledej hotové číslo.** List `overview mng` má sekce `without tests`,
> `with tests` i `Total` a u každé řádek `Total` s EUR i procentem — pro uzavřený
> měsíc ber odtud, ne z dopočtu. Ověř, že všechny tři sekce dělí na stejné Sales
> (`EUR ÷ %`); když ano, jsou za jeden měsíc, ne kumulativně.

> **Dopočet ze `Data QAD` je kontrola, ne primární zdroj.** Červenec sedí na euro
> (100 474 + 145 686 = 246 160 €), srpen taky (94 527 + 140 789 = 235 316 €), ale
> u starších měsíců se QAD proti reportu posouvá o 0,3–1,6 % (červen +3 078 €),
> protože se do něj doúčtovává zpětně. Odchylku v tomhle řádu nehlas jako chybu.

- **Kontrola test kódů:** list `tests and start up` má ve sloupci A kódy
  `TST, ND, 90, PPAP, ART, LAB, OBS, TSTE, 50, E-lvl, 17, 45, 36, SCS, SCIMM…`
  Po filtru `Excluded? = NO` nesmí zbýt **ani jeden z nich** — jinak jsou
  v exportu špatně označené řádky, nahlas to.
  Pozor: **kód „20" v tom seznamu není**, je jen v poznámce ve vedlejším sloupci
  („dodavatel - nezapočítává se"). Řeší se zvlášť filtrem `Reason ≠ "20"`.

### 6. Rozpady
- Platformy: podle `Group 2`, w/o tests, sestupně, s podílem na celku a poměrem k předchozímu měsíci
- Reason codes: top 8–10, w/o tests, s popisem z `Description reason` (fallback `Reason Code Description`) a počtem transakcí
- **Kód vady sjednoť na velká písmena** — QAD zapisuje `PVZD` i `pvzd` a je to
  táž vada. Popis nech, jak přišel. Bez toho je jedna vada ve dvou řádcích.
- Report uvádí jen **11 platforem**; QAD má navíc `PO455`, `V530`, `YFA`, `W520`.
  Součty se proto o pár set EUR liší — při validaci filtruj na platformy z reportu.

### 7. Validace — povinná
Porovnej proti zdrojovému Quality Loss Report. Odchylka v rámci zaokrouhlení = OK, cokoliv většího nahlas a měsíc neuzavírej.

Ověřené hodnoty 2026 (site 1032), na které musí výpočet sednout:

| měsíc | w/o tests | w/o % | with tests (oficiální) | Net Sales | target |
|---|---|---|---|---|---|
| červen | 102 357 € | 0,571 % | 197 232 € | 17 927 513 € | 0,8985 % |
| červenec | 100 474 € | 0,603 % | 246 160 € | 16 660 896 € | 0,8029 % |
| srpen | 94 527 € | 0,736 % | 235 316 € | 12 835 650 € | 0,8604 % |
| září (k 13. 9.) | 39 935 € | 0,532 % | — | 7 512 959 € | 0,8716 % |

Když červenec nevyjde na 100 474 €, je chyba ve filtru — dřív hledej tam než v datech.

## Formát výstupu

**QLR [měsíc rok]** — rozsah dat, počet transakcí, site

Tabulka: Scrap w/o tests | Scrap with tests | z toho dodavatel (kód 20) | Ks (w/o tests) | QLR % — vždy sloupce aktuální měsíc / předchozí měsíc / změna

Tabulka platforem: Group 2 | EUR | podíl | vs. předchozí měsíc (násobek)

Tabulka reason codes: Kód | Popis | EUR | podíl | počet transakcí

**Validace:** shoda / odchylka X EUR proti zdrojovému reportu, plus výsledek kontroly test kódů

**Komentář:** 3–5 vět. Co se hnulo a o kolik. Kde je růst z nízké základny, tam to napiš. Žádné příčiny, které z dat neplynou.

## Pravidla
- Sloupce hledej podle hlavičky, nikdy podle písmene. Datum z `Effective Date`.
- Reason "20" se vylučuje **pouze** u varianty w/o tests. Rozdíl obou variant je dodavatel, ne testy.
- Záporné EUR nikdy nefiltruj. `EUR > 0` jen u počtu kusů.
- Neuzavřený měsíc nikdy neprezentuj jako finální. Neověřený měsíc taky ne.
- Scrap a Net Sales musí být ke stejnému dni, jinak procento nepočítej.
- EUR: `toLocaleString('cs-CZ')` + " EUR", bez znaku %. Poměry jako násobek (2,28×), ne v procentech.
- Chybějící vstup = zeptej se. Žádné dopočítávání Net Sales ani doplňování chybějících kódů.
- Výstupní soubory do `/mnt/user-data/outputs/`, pracovní kopie v `/home/claude/`.
- Do šablony nezaváděj nové listy ani metriky bez odsouhlasení.
- Bez úvodních frází — výstup začíná rovnou nadpisem měsíce.
