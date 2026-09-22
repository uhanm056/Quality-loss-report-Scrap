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
const dmy=k=>k.split('-').reverse().join('.');
const jeVikend=k=>{const d=dowNum(k);return d===0||d===6};

/* ── Pohled: po kalendářních dnech, nebo tak, jak chodí reporty z QAD ──
   V pondělí se dělá jeden report za pátek, sobotu a neděli — jeden řádek
   pivotu tedy odpovídá třem dnům v aplikaci. Pohled „po reportech" je slepí
   do jedné jednotky, aby šlo číslo porovnat s Excelem jedna ku jedné.
   DB zůstává klíčovaná kalendářními dny — ta jsou přesnější a na problem
   solving se hodí. Slepuje se až při vykreslení.

   Klíč jednotky jsou její dny spojené '+' ('2026-09-11+2026-09-12+…').
   Kalendářní klíč '+' nikdy neobsahuje, takže se ty dva nedají zaměnit
   a `dayEur('2026-09-11')` pořád vrací jen ten jeden den. */
let dayG='d';
/* kolik dnů zpátky leží pátek, do jehož reportu den spadá: pá 0, so 1, ne 2 */
const REPB={5:0,6:1,0:2};
function repAnchor(k){
  const b=REPB[dowNum(k)];if(b==null)return k;
  const p=k.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()-b);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+
    String(d.getDate()).padStart(2,'0')}
/* kalendářní dny, které jednotka pokrývá */
const dDays=k=>String(k).split('+');

/* jednotky pohledu za měsíc, vzestupně. Do klíče jdou jen dny, které v měsíci
   opravdu jsou — víkend přes přelom měsíce tak nepřetáhne jednotku jinam. */
function viewDays(m){
  const ks=daysOf(m);
  if(dayG!=='r')return ks;
  const g={},o=[];
  ks.forEach(k=>{const a=repAnchor(k);
    if(!g[a]){g[a]=[];o.push(a)}
    g[a].push(k)});
  return o.map(a=>g[a].join('+'))}

/* popisky jednotky — jeden den, nebo rozsah „11.9.2026 – 13.9.2026 · pátek–neděle" */
const dowOf=k=>{const d=dDays(k);return d.length<2?DOW[dowNum(d[0])]:
  DOW[dowNum(d[0])]+'–'+DOW[dowNum(d[d.length-1])]};
/* V KPI kartách je popisek velkými písmeny a zkratka „NE" se čte jako „ne",
   proto se tam píše celý název dne. V tabulce stačí zkratka. */
const denLabel=k=>{const d=dDays(k);
  return d.length<2?dmy(d[0])+' · '+DOWL[dowNum(d[0])]:
    dmy(d[0])+' – '+dmy(d[d.length-1])+' · '+
    DOWL[dowNum(d[0])]+'–'+DOWL[dowNum(d[d.length-1])]};
const denKratce=k=>{const d=dDays(k);
  return d.length<2?dmy(d[0]):dmy(d[0])+' – '+dmy(d[d.length-1])};

/* v čem se dny porovnávají: 'e' = EUR za den, 'q' = EUR na kus */
let dayU='e',openDay=null;
const dayEur=k=>dDays(k).reduce((s,d)=>s+((DB[d]||{}).eur||0),0);
const dayQty=k=>dDays(k).reduce((s,d)=>s+((DB[d]||{}).qty||0),0);
/* EUR na kus — u dne bez kusů nemá smysl, vrací null */
const dayPer=k=>dayQty(k)?dayEur(k)/dayQty(k):null;
const dayVal=k=>dayU==='e'?dayEur(k):dayPer(k);
const dayFmt=v=>v==null?'—':(dayU==='e'?fE(v):fEs(v)+' / ks');

/* rozpad jednotky přes všechny projekty — f: 'r' vady, 'l' pracoviště, 'it' díly.
   U každé položky se drží i to, na kterém projektu vznikla. */
function dayBreak(k,f){
  const o={};
  dDays(k).forEach(dk=>{const d=DB[dk];if(!d||!d.p)return;
    Object.entries(d.p).forEach(([pn,P])=>Object.entries(P[f]||{}).forEach(([n,v])=>{
      const key=f==='r'?rsnKey(n):(f==='lr'?lrKey(n):n);
      const x=o[key]=o[key]||{e:0,q:0,proj:{}};
      x.e+=v.e;x.q+=v.q;x.proj[pn]=(x.proj[pn]||0)+v.e}))});
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)}

/* projekty jednotky, sestupně podle EUR */
function dayProjects(k){
  const o={};
  dDays(k).forEach(dk=>{const d=DB[dk];if(!d||!d.p)return;
    Object.entries(d.p).forEach(([n,v])=>{
      const x=o[n]=o[n]||{e:0,q:0};x.e+=v.e;x.q+=v.q})});
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)}

/* Co je pod jedním pracovištěm v ten den — vady (s projektem, na kterém
   vznikly) a projekty. `lr` je klíčované 'pracoviště¶kód§popis' a drží se
   po projektech, takže se prochází celá mapa a filtruje se podle pracoviště.
   Díly se takhle vzít nedají — `it` se klíčuje jen číslem dílu, bez lokace. */
function dayLocDetail(k,loc){
  const rs={},ps={};let e=0,q=0;
  dDays(k).forEach(dk=>{const d=DB[dk];if(!d||!d.p)return;
    Object.entries(d.p).forEach(([pn,P])=>{
      const L=(P.l||{})[loc];
      if(L){const y=ps[pn]=ps[pn]||{e:0,q:0};y.e+=L.e;y.q+=L.q;e+=L.e;q+=L.q}
      Object.entries(P.lr||{}).forEach(([n,v])=>{
        const t=String(n),i=t.indexOf('¶');if(i<0)return;
        if(t.slice(0,i)!==loc)return;
        const key=rsnKey(t.slice(i+1));
        const x=rs[key]=rs[key]||{e:0,q:0,proj:{}};
        x.e+=v.e;x.q+=v.q;x.proj[pn]=(x.proj[pn]||0)+v.e})})});
  return{loc:loc,e:e,q:q,
    r:Object.entries(rs).sort((a,b)=>b[1].e-a[1].e),
    p:Object.entries(ps).sort((a,b)=>b[1].e-a[1].e)}}

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

/* rozbalené pracoviště v rozpadu dne — přepínač, druhý klik zavře */
let openLoc=null;
window.pickLoc=c=>{openLoc=(c&&openLoc!==c)?c:null;renderDash()};

window.setDayU=v=>{dayU=v;openDay=null;renderDash()};
/* přepnutí pohledu mění klíče jednotek, takže rozbalený řádek už neplatí */
window.setDayG=v=>{dayG=v;openDay=null;openLoc=null;renderDash()};
window.toggleDay=k=>{openDay=openDay===k?null:k;renderDash()};
