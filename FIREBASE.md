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

**Build → Authentication → Get started**, pak **Sign-in method**. Na výběr jsou
dvě cesty — v `js/data/firebase-config.js` se pak nastaví `login` podle toho,
která se použila:

| ve Firebase zapnout | `login` v konfiguraci | pro koho |
|---|---|---|
| **Email/Password** | `'password'` | nepotřebuje firemní Google účet; účty zakládá správce |
| **Google** | `'google'` | jen když má firma Google Workspace |

### Když je to Email/Password

1. **Sign-in method → Email/Password → Enable** (druhý přepínač *Email link*
   nechat vypnutý), uložit.
2. Záložka **Users → Add user** — zadat e-mail a heslo pro každého člověka.
   **Nikdo se nezaregistruje sám**, účty vznikají jen tady.
3. **Settings → User actions** → vypnout **Enable create (sign-up)**.
   Tím se zavře jediná díra: `apiKey` je ve veřejné stránce vidět, takže bez
   tohohle by si kdokoliv mohl založit účet na vymyšlenou adresu z firemní
   domény a projít pravidly z kroku 4.
4. Heslo si každý může sám přenastavit odkazem **Zapomenuté heslo?** v aplikaci.

### V obou případech

**Settings → Authorized domains → Add domain** a přidat doménu, na které
stránka běží — u GitHub Pages je to `<uživatel>.github.io`. Bez toho skončí
přihlášení hláškou *auth/unauthorized-domain*.

## 4 · Pravidla přístupu

**Firestore Database → Rules**, vložit a dát **Publish**.

**U přihlašování e-mailem a heslem** se vyjmenují konkrétní lidé. Je to
nejtěsnější varianta — účet na vymyšlenou adresu z firemní domény se k datům
nedostane, i kdyby vznikl:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plant1032/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email in [
          'milan.hanus@yfai.com',
          'roma.zubek@yfai.com',
          'martin.slaby@yfai.com'
        ];
    }
  }
}
```

Přidat člověka = založit mu účet v kroku 3 **a doplnit řádek sem**.

**U přihlašování Google účtem** stačí doména — vlastnictví schránky ověřuje
Google sám:

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

> **Pozor na `email_verified` u hesel.** Účet založený ručně v konzoli má
> `email_verified == false`. Když se tahle podmínka nechá u přihlašování
> heslem, neprojde **nikdo** — všechno skončí na *Missing or insufficient
> permissions*.

Pravidla jsou jediná skutečná ochrana dat. Stránka je veřejná, takže
konfigurace níž (včetně `apiKey`) je v ní vidět — tak to u Firebase má být,
`apiKey` není heslo. **Bez pravidel by data mohl číst i přepsat kdokoliv, kdo
zná adresu stránky.**

## 5 · Získat konfiguraci

1. **Project settings** (ozubené kolo) → dole **Your apps** → ikona `</>` (Web)
2. Přezdívka např. `scrap`, **Firebase Hosting nezaškrtávat**
3. Firebase ukáže blok `const firebaseConfig = { … }` — z něj se opíšou hodnoty

## 6 · Vyplnit `js/data/firebase-config.js`

```js
const FBCFG={
  apiKey:'AIzaSy…',
  authDomain:'quality-loss-report.firebaseapp.com',
  projectId:'quality-loss-report',
  appId:'1:123…:web:abc…',
  login:'password',
  domain:'yfai.com',
  root:'plant1032'
};
```

`login` musí sedět s tím, co je zapnuté v kroku 3 (`'password'`, `'google'`
nebo `'both'`). `domain` je jen do hlášky a do předvyplněného pole —
skutečné omezení je v pravidlech z kroku 4.

Po změně souboru **zvednout `?v=` u všech odkazů v `index.html`**
(jinak si prohlížeč nechá starou verzi) a změnu nahrát do repozitáře.

## 7 · Vyzkoušet

Otevřít stránku → záložka **Data & import** → panel **Sdílení dat**
→ vyplnit e-mail a heslo (nebo **Přihlásit se Google účtem**). Po přihlášení
je v hlavičce štítek `☁ sdíleno · e-mail`.

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
| *Firestore odmítl přístup … Security Rules* | e-mail nesedí na pravidla z kroku 4 — u hesel bývá na vině `email_verified` |
| *Nesprávný e-mail nebo heslo* | účet ještě není v **Authentication → Users** |
| *Tenhle způsob přihlášení není zapnutý* | `login` v konfiguraci nesedí s krokem 3 |
| *Doména téhle stránky není povolená* | chybí **Authorized domains**, krok 3 |

Z každé chyby vede v panelu tlačítko **← Pokračovat bez sdílení**: aplikace
pak jede jen s daty v prohlížeči a volba se pamatuje. Zpátky se sdílení zapne
tlačítkem **☁ Zapnout sdílení** ve stejném panelu.

## Vypnutí

Vymazat hodnoty v `js/data/firebase-config.js` (nechat prázdné řetězce)
a zvednout `?v=`. Aplikace se vrátí k ukládání jen v prohlížeči; data ve
Firestore zůstanou, dokud se projekt nesmaže v konzoli.
