/* Jádro: agregace denních dat
   Součty přes dny v měsíci, rozpady podle projektů.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const monthsAvail=()=>[...new Set(Object.keys(DB).map(k=>k.slice(0,7)))].sort();
const daysOf=m=>Object.keys(DB).filter(k=>k.startsWith(m)).sort();
const sumM=m=>daysOf(m).reduce((a,k)=>a+DB[k].eur,0);
const qtyM=m=>daysOf(m).reduce((a,k)=>a+DB[k].qty,0);
function projTotals(m){const o={};
  daysOf(m).forEach(k=>{const d=DB[k];
    if(d.p&&Object.keys(d.p).length)Object.entries(d.p).forEach(([n,v])=>{
      o[n]=o[n]||{e:0,q:0};o[n].e+=v.e;o[n].q+=v.q});
    else if(d.proj)Object.entries(d.proj).forEach(([n,v])=>{
      o[n]=o[n]||{e:0,q:0};o[n].e+=(typeof v==='number'?v:(v.e||0))})});
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)}
function projBreak(m,p,f){const o={};
  daysOf(m).forEach(k=>{const P=(DB[k].p||{})[p];if(!P)return;
    Object.entries(P[f]||{}).forEach(([n,v])=>{
      const key=f==='r'?rsnKey(n):(f==='lr'?lrKey(n):n);
      o[key]=o[key]||{e:0,q:0};o[key].e+=v.e;o[key].q+=v.q})});
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)}
const projDaily=(m,p)=>daysOf(m).map(k=>((DB[k].p||{})[p]||{e:0}).e);
/* Denní řada jedné vady u projektu — den po dni {e,q}.
   Klíč je 'kód§popis' už protažený přes rsnKey(), takže se sečte PVZD i pvzd;
   proto se nedá sáhnout přímo do r[key] a musí se projít celá mapa dne. */
const projRsnDays=(m,p,key)=>daysOf(m).map(k=>{
  const R=((DB[k].p||{})[p]||{}).r||{},o={e:0,q:0};
  Object.entries(R).forEach(([n,v])=>{if(rsnKey(n)===key){o.e+=v.e;o.q+=v.q}});
  return o});
const hasDetail=m=>daysOf(m).some(k=>DB[k].p&&Object.keys(DB[k].p).length);
const daysNoDetail=m=>daysOf(m).filter(k=>!(DB[k].p&&Object.keys(DB[k].p).length));
