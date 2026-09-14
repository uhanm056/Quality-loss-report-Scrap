/* Jádro: rozpad jednoho dne a porovnání dnů mezi sebou
   Odpovídá na „zlepšili jsme se, nebo zhoršili" a „co za vady a na čem".
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

/* Den v týdnu se píše k datu všude, kde se den ukazuje. Bez toho není poznat,
   že „13.09.2026 371 €" je neděle, kdy se skoro nevyrábí, a porovnání s pátkem
   nedává smysl. Navíc se v pondělí dělá součet pátek + sobota + neděle, takže
   pondělní řádek v Excelu odpovídá třem dnům v aplikaci. */
const DOW=['ne','po','út','st','čt','pá','so'];
const DOWL=['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
const dowNum=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]).getDay()};
const dowOf=k=>DOW[dowNum(k)];
/* V KPI kartách je popisek velkými písmeny a zkratka „NE" se čte jako „ne",
   proto se tam píše celý název dne. V tabulce stačí zkratka. */
const denLabel=k=>k.split('-').reverse().join('.')+' · '+DOWL[dowNum(k)];
const jeVikend=k=>{const d=dowNum(k);return d===0||d===6};

/* v čem se dny porovnávají: 'e' = EUR za den, 'q' = EUR na kus */
let dayU='e',openDay=null;
const dayEur=k=>(DB[k]||{}).eur||0;
const dayQty=k=>(DB[k]||{}).qty||0;
/* EUR na kus — u dne bez kusů nemá smysl, vrací null */
const dayPer=k=>dayQty(k)?dayEur(k)/dayQty(k):null;
const dayVal=k=>dayU==='e'?dayEur(k):dayPer(k);
const dayFmt=v=>v==null?'—':(dayU==='e'?fE(v):fEs(v)+' / ks');

/* rozpad dne přes všechny projekty — f: 'r' vady, 'l' pracoviště, 'it' díly.
   U každé položky se drží i to, na kterém projektu vznikla. */
function dayBreak(k,f){
  const d=DB[k];if(!d||!d.p)return [];
  const o={};
  Object.entries(d.p).forEach(([pn,P])=>Object.entries(P[f]||{}).forEach(([n,v])=>{
    const key=f==='r'?rsnKey(n):(f==='lr'?lrKey(n):n);
    const x=o[key]=o[key]||{e:0,q:0,proj:{}};
    x.e+=v.e;x.q+=v.q;x.proj[pn]=(x.proj[pn]||0)+v.e}));
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)}

/* projekty dne, sestupně podle EUR */
function dayProjects(k){
  const d=DB[k];if(!d||!d.p)return [];
  return Object.entries(d.p).map(([n,v])=>[n,{e:v.e,q:v.q}]).sort((a,b)=>b[1].e-a[1].e)}

/* název vady z klíče 'kód§popis' */
const rsnName=key=>{const p=String(key).split('§');return p[1]&&p[1]!=='—'?p[1]:(p[0]||'—')};
const rsnCode=key=>String(key).split('§')[0]||'';
/* projekt, který se na položce podílí nejvíc */
const topProj=x=>{const e=Object.entries(x.proj||{}).sort((a,b)=>b[1]-a[1]);
  return e.length?e[0][0]:null};

/* nejdražší vada dne — {name, code, proj, e, share} */
function dayTopDefect(k){
  const r=dayBreak(k,'r');if(!r.length)return null;
  const tot=dayEur(k),x=r[0][1];
  return{name:rsnName(r[0][0]),code:rsnCode(r[0][0]),proj:topProj(x),e:x.e,q:x.q,
    share:tot?x.e/tot:0}}

/* průměr předchozích dnů (bez toho dnešního) — základ pro „lepší / horší" */
function prevAvg(ks,i,n){
  const a=ks.slice(Math.max(0,i-(n||7)),i).map(dayVal).filter(v=>v!=null);
  return a.length?a.reduce((s,v)=>s+v,0)/a.length:null}

/* klouzavý průměr včetně aktuálního dne — do grafu */
function movAvg(ks,i,n){
  const a=ks.slice(Math.max(0,i-(n||7)+1),i+1).map(k=>dayEur(k));
  return a.reduce((s,v)=>s+v,0)/a.length}

/* srovnání dne s předchozím průměrem — kladné delta = zhoršení */
function dayCompare(ks,i,n){
  const v=dayVal(ks[i]),avg=prevAvg(ks,i,n);
  if(v==null||avg==null||!avg)return{v:v,avg:null,d:null,pct:null,worse:null};
  const d=v-avg;
  return{v:v,avg:avg,d:d,pct:d/avg*100,worse:d>0}}

window.setDayU=v=>{dayU=v;openDay=null;renderDash()};
window.toggleDay=k=>{openDay=openDay===k?null:k;renderDash()};
