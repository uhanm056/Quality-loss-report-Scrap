/* Data: názvy pracovišť (LOCNAMES)
   Lokace se klíčují kódem, ne popisem z QAD — ASY005 není GVBX.
   Tady uprav název, když QAD popis nesedí.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

let LOCNAMES={ASY001:'IP 177 montáž',ASY002:'IP 247 montáž',ASY003:'IP 177&247 RHD montáž',
ASY004:'GVBX 177 montáž',ASY005:'Montáž X540 / W520',ASY006:'DP 463 montáž',
ASY007:'IP 206 montáž',ASY008:'Opel Astra montáž',PCO001:'Prefix G463/G465',
IMM:'IMM oblast (vstřikovna)',SLH:'Slush linky',SCOR:'Scoring',FOA001:'Pěnování FOA001',
VLA001:'Lakovna VLA001',FG:'Sklad hotových dílů','FX-19':'Sklad WRH',
'PROD-DIF':'Inventurní rozdíl','INT-HOLD':'QH interní díly','SUP-HOLD':'QH dodavatelské díly',
S011032:'Flaming Opel Astra','SUP-06-6':'Sklad dodavatele 06-6','SUP-HOLD':'QH dodavatelské díly'};
const locName=c=>LOCNAMES[c]||c;
