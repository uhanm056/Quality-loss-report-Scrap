/* Nastavení sdílení dat přes Firebase
   ────────────────────────────────────────────────────────────────────────
   Dokud je `apiKey` prázdný, sdílení je vypnuté a aplikace se chová přesně
   jako dřív — data zůstávají jen v prohlížeči na tomhle počítači.

   Jak to zapnout je krok za krokem popsané v souboru FIREBASE.md.
   Hodnoty níž se vyplní z Firebase konzole:
     Project settings → Your apps → Web app → SDK setup and configuration.

   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const FBCFG={
  apiKey:'',            /* např. 'AIzaSy…' */
  authDomain:'',        /* např. 'yf-scrap-1032.firebaseapp.com' */
  projectId:'',         /* např. 'yf-scrap-1032' */
  appId:'',             /* nepovinné */

  /* jen do koho pustí přihlášení — samotná ochrana je v Security Rules,
     tohle je pro hlášku uživateli, aby věděl, jakým účtem se má přihlásit */
  domain:'',            /* např. 'yfai.com'; prázdné = bez omezení */

  /* kořen dat ve Firestore — měnit jen když jeden projekt slouží víc závodům */
  root:'plant1032'
};
