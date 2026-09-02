# Sdílení dat mezi lidmi — nastavení Firebase

Aplikace ukládá denní reporty do paměti prohlížeče (`localStorage`). To znamená,
že **kdo report nahraje, vidí ho jen on**. Kolega, kterému se stránka pošle,
u sebe uvidí prázdno, dokud si nenahraje vlastní soubory.

Tenhle návod zapne společné úložiště: kdo je přihlášený, vidí totéž, a co jeden
nahraje, objeví se ostatním **samo, bez načítání stránky**.

Nastavení je jednorázové, zvládne se za dvacet minut a je zdarma
(Firebase Spark plan; objem těchhle dat se do bezplatných limitů vejde
s velkou rezervou).

---

## Než začneš — co je potřeba vědět

**Data budou uložená u Googlu, mimo firemní síť.** Jde o scrap v EUR, kódy vad,
pracoviště, čísla dílů, targety a Sales. Přístup bude mít jen ten, kdo se
přihlásí firemním účtem — ale samotné uložení je mimo závod.

**Otevření souboru z disku sdílení nepodporuje.** Prohlížeč u adres `file://`
připojení k databázi nepovolí. Aplikace se z disku dál otevře a bude fungovat,
jen bez sdílení — napíše to v panelu **Sdílení dat**. Pro sdílenou práci se
používá webová verze (GitHub Pages).

**Bez tohohle nastavení se nic nemění.** Dokud je `js/data/firebase-config.js`
prázdný, aplikace se chová přesně jako dosud.

---

## 1 · Založit projekt

1. <https://console.firebase.google.com> → **Add project**
2. Název např. `yf-scrap-1032`. Google Analytics není potřeba — vypnout.

## 2 · Zapnout databázi

1. V levém menu **Build → Firestore Database → Create database**
2. Režim **Production mode** (pravidla se nastaví v kroku 4)
3. Umístění **eur3 (europe-west)** — data zůstanou v EU

## 3 · Zapnout přihlašování

1. **Build → Authentication → Get started**
2. Záložka **Sign-in method → Google → Enable**, uložit
3. Záložka **Settings → Authorized domains → Add domain**
   a přidat doménu, na které stránka běží — u GitHub Pages je to
   `<uživatel>.github.io`

## 4 · Pravidla přístupu

**Firestore Database → Rules**, vložit a dát **Publish**.
Místo `yfai.com` napsat skutečnou doménu firemních e-mailů:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plant1032/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email.matches('.*@yfai[.]com$');
    }
  }
}
```

Tohle je jediná skutečná ochrana dat. Stránka je veřejná, takže konfigurace
níž (včetně `apiKey`) je v ní vidět — tak to u Firebase má být, `apiKey` není
heslo. **Bez těchto pravidel by data mohl číst i přepsat kdokoliv, kdo zná
adresu stránky.**

Když se má dovnitř dostat víc domén, dá se podmínka rozšířit:

```
&& request.auth.token.email.matches('.*@(yfai[.]com|yanfeng[.]com)$')
```

## 5 · Získat konfiguraci

1. **Project settings** (ozubené kolo) → dole **Your apps** → ikona `</>` (Web)
2. Přezdívka např. `scrap`, **Firebase Hosting nezaškrtávat**
3. Firebase ukáže blok `const firebaseConfig = { … }` — z něj se opíšou hodnoty

## 6 · Vyplnit `js/data/firebase-config.js`

```js
const FBCFG={
  apiKey:'AIzaSy…',
  authDomain:'yf-scrap-1032.firebaseapp.com',
  projectId:'yf-scrap-1032',
  appId:'1:123…:web:abc…',
  domain:'yfai.com',
  root:'plant1032'
};
```

`domain` je jen pro nabídku účtu při přihlášení a pro hlášku uživateli —
skutečné omezení je v pravidlech z kroku 4.

Po změně souboru **zvednout `?v=` u všech odkazů v `index.html`**
(jinak si prohlížeč nechá starou verzi) a změnu nahrát do repozitáře.

## 7 · Vyzkoušet

Otevřít stránku → záložka **Data & import** → panel **Sdílení dat**
→ **Přihlásit se Google účtem**. Po přihlášení je v hlavičce štítek
`☁ sdíleno · e-mail`.

Zkouška ve dvou: jeden nahraje denní report, druhý ho musí do pár vteřin
vidět, aniž by cokoliv načítal.

---

## Jak se data slučují

| | |
|---|---|
| **jednotka** | jeden den = jeden záznam (zvlášť scrap, zvlášť rework) |
| **různé dny** | sečtou se, každý přidá své |
| **stejný den dvakrát** | vyhraje ten nahraný později (podle času nahrání `at`) |
| **smazání dne** | smaže ho i ostatním — v aplikaci je na to upozornění |
| **targety a Sales** | jedna společná sada, vyhrává poslední úprava |
| **sazba a cíl reworku** | také společné |

Historie QLR (2024–2026), měsíční rozpad z QAD a názvy pracovišť se **nesdílí** —
jsou zapsané přímo v kódu a stejné pro všechny.

## Kde jsou data uložená

```
plant1032/scrap/dny/2026-08-14     jeden den scrapu
plant1032/rework/dny/2026-08-14    jeden den reworku
plant1032/konfig                   targety, Sales, nastavení
```

Obsah dne je uložený jako text v poli `json`. Je to schválně: klíče vad
(`PVZD§Vzduch`) a popisy s tečkou by jako názvy polí ve Firestore neprošly.

## Když něco nefunguje

| hláška v panelu | co s tím |
|---|---|
| *Aplikace je otevřená přímo z disku* | otevřít webovou verzi, ne soubor z disku |
| *Sdílení dat není nastavené* | `js/data/firebase-config.js` je prázdný — krok 6 |
| *nepodařilo se stáhnout … gstatic.com* | firemní síť blokuje Google — řešit s IT |
| *Missing or insufficient permissions* | e-mail nesedí na pravidla z kroku 4 |
| *auth/unauthorized-domain* | doména stránky chybí v kroku 3, bod 3 |

## Vypnutí

Vymazat hodnoty v `js/data/firebase-config.js` (nechat prázdné řetězce)
a zvednout `?v=`. Aplikace se vrátí k ukládání jen v prohlížeči; data ve
Firestore zůstanou, dokud se projekt nesmaže v konzoli.
