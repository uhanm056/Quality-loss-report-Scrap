/* Nastavení sdílení dat přes Firebase
   ────────────────────────────────────────────────────────────────────────
   Dokud je `apiKey` prázdný, sdílení je vypnuté a aplikace se chová přesně
   jako dřív — data zůstávají jen v prohlížeči na tomhle počítači.

   Jak to zapnout je krok za krokem popsané v souboru FIREBASE.md.
   Chybějící hodnoty jsou ve Firebase konzoli:
     Project settings → Your apps → Web app → SDK setup and configuration.

   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const FBCFG={
  apiKey:'',            /* DOPLNIT — Project settings → General → Web API Key */
  authDomain:'quality-loss-report.firebaseapp.com',
  projectId:'quality-loss-report',
  appId:'',             /* nepovinné — Auth i Firestore fungují i bez něj */

  /* jak se lidé přihlašují:
       'password' — e-mailem a heslem; účty zakládá správce v konzoli
       'google'   — firemním Google účtem
       'both'     — nabídne obojí                                            */
  login:'password',

  /* doména firemních e-mailů — jen do hlášky a do předvyplněného pole.
     Skutečné omezení, kdo se dostane k datům, je v Security Rules.          */
  domain:'yfai.com',

  /* kořen dat ve Firestore — měnit jen když jeden projekt slouží víc závodům */
  root:'plant1032'
};
