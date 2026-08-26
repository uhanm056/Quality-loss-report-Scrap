/* Jádro: trend vad přes měsíce — podklad pro problem solving
   Zdrojem je měsíční QAD export (MDET): pole R drží vady po projektech,
   pole P kombinaci pracoviště × vada. Počítá se w/o tests, stejně jako
   všude jinde — kód 20 (dodavatel) má ve `wo` nulu, takže vypadne sám.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

let dProj='all',openRsn=null;

/* měsíce, které rozpad na vady opravdu mají — srpen zatím jen projektové součty,
   bez téhle kontroly by každá vada vypadala jako vyřešená */
function rsnMonths(){
  return Object.keys(MDET).map(Number).sort((a,b)=>a-b).filter(m=>
    Object.values(MDET[String(m)]).some(D=>(D.R||[]).some(r=>(r[3]||0)>0)))}

/* projekty, které se v rozpadu vad vyskytují */
function rsnProjects(){
  const s=new Set();
  rsnMonths().forEach(m=>Object.entries(MDET[String(m)]).forEach(([p,D])=>{
    if((D.R||[]).some(r=>(r[3]||0)>0))s.add(p)}));
  return [...s].sort()}

/* všechny vady: klíč 'kód§popis' → {tot, ks, m:{měsíc:eur}, proj:{}, loc:{}} */
function rsnAll(proj){
  const o={},ms=rsnMonths();
  ms.forEach(m=>Object.entries(MDET[String(m)]).forEach(([p,D])=>{
    if(proj&&proj!=='all'&&p!==proj)return;
    (D.R||[]).forEach(r=>{const eur=r[3]||0;if(eur<=0)return;
      const key=r[0]+'§'+r[1];
      const x=o[key]=o[key]||{tot:0,ks:0,m:{},proj:{},loc:{}};
      x.tot+=eur;x.ks+=r[4]||0;x.m[m]=(x.m[m]||0)+eur;
      x.proj[p]=(x.proj[p]||0)+eur});
    /* pracoviště se dá k vadě přiřadit jen přes kombinace v P, a ty se
       klíčují popisem vady, ne kódem */
    (D.P||[]).forEach(r=>{const eur=r[3]||0;if(eur<=0)return;
      const popis=r[1];
      Object.keys(o).forEach(key=>{if(key.split('§')[1]!==popis)return;
        o[key].loc[r[0]]=(o[key].loc[r[0]]||0)+eur})})}));
  return o}

/* zařazení trendu — poslední třetina měsíců proti té předchozí */
function rsnTrend(x,ms){
  const n=ms.length;
  if(n<2)return{kod:'malo',lab:'málo dat',cls:'n',pct:null,a:null,b:null};
  const k=Math.max(1,Math.floor(n/3));          /* velikost okna */
  const late=ms.slice(-k),early=ms.slice(-2*k,-k);
  const b=late.reduce((s,m)=>s+(x.m[m]||0),0);
  const a=early.reduce((s,m)=>s+(x.m[m]||0),0);
  if(!a&&!b)return{kod:'malo',lab:'málo dat',cls:'n',pct:null,a:a,b:b};
  if(!a)return{kod:'nova',lab:'nová',cls:'r',pct:null,a:a,b:b};
  if(!b)return{kod:'pryc',lab:'vyřešená',cls:'g',pct:-100,a:a,b:b};
  const pct=(b-a)/a*100;
  if(pct>25)return{kod:'roste',lab:'roste',cls:'r',pct:pct,a:a,b:b};
  if(pct<-25)return{kod:'klesa',lab:'klesá',cls:'g',pct:pct,a:a,b:b};
  return{kod:'stabil',lab:'stabilní',cls:'n',pct:pct,a:a,b:b}}

/* seřazené vady s trendem a kumulativním podílem — Pareto */
function rsnPareto(proj){
  const ms=rsnMonths(),all=rsnAll(proj);
  const rows=Object.entries(all).sort((a,b)=>b[1].tot-a[1].tot);
  const cel=rows.reduce((s,r)=>s+r[1].tot,0);
  let run=0;
  return{ms:ms,cel:cel,rows:rows.map(([key,x])=>{run+=x.tot;
    return{key:key,kod:key.split('§')[0],nazev:key.split('§')[1]||key,
      tot:x.tot,ks:x.ks,m:x.m,proj:x.proj,loc:x.loc,
      podil:cel?x.tot/cel:0,kumul:cel?run/cel:0,tr:rsnTrend(x,ms)}})}}

/* nejvýraznější pohyb v obou směrech — na KPI karty */
function rsnMovers(P){
  const s=P.rows.filter(r=>r.tr.a!=null&&r.tr.b!=null&&(r.tr.a||r.tr.b));
  const up=s.filter(r=>r.tr.b>r.tr.a).sort((a,b)=>(b.tr.b-b.tr.a)-(a.tr.b-a.tr.a))[0];
  const dn=s.filter(r=>r.tr.b<r.tr.a).sort((a,b)=>(a.tr.b-a.tr.a)-(b.tr.b-b.tr.a))[0];
  return{up:up||null,dn:dn||null}}
