/* Nastavení sdílení dat přes Firebase
   ────────────────────────────────────────────────────────────────────────
   Dokud je `apiKey` prázdný, sdílení je vypnuté a aplikace se chová přesně
   jako dřív — data zůstávají jen v prohlížeči na tomhle počítači.

   Vyplněno pro projekt „Quality loss report" (webová aplikace QLR).
   Postup a pravidla přístupu jsou v souboru FIREBASE.md. Hodnoty jsou
   ve Firebase konzoli: Project settings → Your apps → SDK setup and configuration.

   `apiKey` není heslo — u Firebase je normální, že je ve stránce vidět.
   Kdo se dostane k datům, rozhodují Security Rules ve Firestore.

   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const FBCFG={
  apiKey:'AIzaSyDwCRQKW3YfwTl5c8APZkTEqL7-kxLJH74',
  authDomain:'quality-loss-report.firebaseapp.com',
  projectId:'quality-loss-report',
  appId:'1:566629674743:web:79aacf147df46d5592edf2',

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
