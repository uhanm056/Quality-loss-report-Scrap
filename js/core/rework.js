/* Jádro: agregace dat o reworku
   Stejná struktura jako denní scrap (RW místo DB), navíc hodiny.
   Rework se do QLR nezapočítává — sleduje se vedle scrapu.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

let curRwMonth=null;
const rwMonths=()=>[...new Set(Object.keys(RW).map(k=>k.slice(0,7)))].sort();
const rwDays=m=>Object.keys(RW).filter(k=>k.startsWith(m)).sort();
const rwEur=m=>rwDays(m).reduce((a,k)=>a+RW[k].eur,0);
const rwHrs=m=>rwDays(m).reduce((a,k)=>a+(RW[k].hrs||0),0);
const rwQty=m=>rwDays(m).reduce((a,k)=>a+(RW[k].qty||0),0);
/* má některý den v měsíci dopočítané EUR ze sazby místo ze souboru? */
const rwCalc=m=>rwDays(m).some(k=>RW[k].calc);

/* projekty za měsíc — [[nazev,{e,h,q}], …] sestupně podle EUR */
function rwProjects(m){const o={};
  rwDays(m).forEach(k=>Object.entries(RW[k].p||{}).forEach(([n,v])=>{
    o[n]=o[n]||{e:0,h:0,q:0};o[n].e+=v.e;o[n].h+=v.h||0;o[n].q+=v.q||0}));
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)}

/* rozpad přes všechny projekty — f je 'l' (pracoviště), 'r' (příčiny) nebo 'it' (díly) */
function rwBreak(m,f){const o={};
  rwDays(m).forEach(k=>Object.values(RW[k].p||{}).forEach(P=>
    Object.entries(P[f]||{}).forEach(([n,v])=>{
      o[n]=o[n]||{e:0,h:0,q:0};o[n].e+=v.e;o[n].h+=v.h||0;o[n].q+=v.q||0})));
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)}
