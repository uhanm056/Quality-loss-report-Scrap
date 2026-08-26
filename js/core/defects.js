/* Jádro: trend vad — podklad pro problem solving
   Dvě granularity, každá z jiného zdroje:
     měsíce — měsíční QAD export (MDET.R vady, MDET.P kombinace pracoviště × vada)
     týdny  — denní reporty (DB[den].p[projekt].r a .lr), tedy jen dny, které jsou nahrané
   Metrika je w/o tests: v MDET má kód 20 ve `wo` nulu, denní parser dodavatele
   a vyloučené řádky vůbec nenačte.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

let dProj='all',openRsn=null,dGran='m';

/* ── kalendářní týden podle ISO 8601 (pondělí – neděle) ────────────────── */
function isoWeek(den){
  const p=den.split('-'),d=new Date(Date.UTC(+p[0],+p[1]-1,+p[2]));
  const dn=d.getUTCDay()||7;
  d.setUTCDate(d.getUTCDate()+4-dn);            /* čtvrtek téhož týdne určuje rok */
  const y=d.getUTCFullYear(),jan1=Date.UTC(y,0,1);
  const w=Math.ceil(((d-jan1)/86400000+1)/7);
  return y+'-W'+String(w).padStart(2,'0')}

/* pondělí daného týdne — pro popisek s rozsahem dat */
function weekStart(key){
  const y=+key.slice(0,4),w=+key.slice(6);
  const jan4=new Date(Date.UTC(y,0,4)),dn=jan4.getUTCDay()||7;
  const mon=new Date(jan4);mon.setUTCDate(jan4.getUTCDate()-dn+1);
  mon.setUTCDate(mon.getUTCDate()+(w-1)*7);return mon}
function weekRange(key){
  const a=weekStart(key),b=new Date(a);b.setUTCDate(a.getUTCDate()+6);
  const f=d=>d.getUTCDate()+'. '+(d.getUTCMonth()+1)+'.';
  return f(a)+' – '+f(b)}

/* ── která období mají rozpad na vady ──────────────────────────────────── */

/* měsíce, které rozpad opravdu mají — srpen zatím jen projektové součty,
   bez téhle kontroly by každá vada vypadala jako vyřešená */
function rsnMonths(){
  return Object.keys(MDET).map(Number).sort((a,b)=>a-b).filter(m=>
    Object.values(MDET[String(m)]).some(D=>(D.R||[]).some(r=>(r[3]||0)>0)))}

/* týdny, ve kterých je nahraný aspoň jeden den s rozpadem na vady */
function rsnWeeks(){
  const s=new Set();
  Object.keys(DB).forEach(k=>{const d=DB[k];
    if(d.p&&Object.values(d.p).some(P=>P.r&&Object.keys(P.r).length))s.add(isoWeek(k))});
  return [...s].sort()}

/* poslední den, ke kterému jsou nahraná denní data */
function lastDay(){const ks=Object.keys(DB).sort();return ks.length?ks[ks.length-1]:null}

/* období pro aktuální granularitu — [{key, label, sub, part}].
   `part` = období ještě neskončilo nebo nemá nahrané všechny dny; do trendu
   nevstupuje, jinak by useknutý týden vypadal jako zlepšení. */
function rsnPeriods(){
  if(dGran==='w'){
    const ld=lastDay();
    return rsnWeeks().map(k=>{
      const kon=new Date(weekStart(k));kon.setUTCDate(kon.getUTCDate()+6);
      const konIso=kon.toISOString().slice(0,10);
      return{key:k,label:'T'+k.slice(6),sub:weekRange(k),part:!!(ld&&ld<konIso)}})}
  return rsnMonths().map(m=>({key:String(m),label:MN[m-1],sub:'2026',part:false}))}

/* projekty, které se v rozpadu vyskytují */
function rsnProjects(){
  const s=new Set();
  if(dGran==='w')Object.keys(DB).forEach(k=>Object.entries((DB[k].p)||{}).forEach(([p,P])=>{
    if(P.r&&Object.keys(P.r).length)s.add(p)}));
  else rsnMonths().forEach(m=>Object.entries(MDET[String(m)]).forEach(([p,D])=>{
    if((D.R||[]).some(r=>(r[3]||0)>0))s.add(p)}));
  return [...s].sort()}

/* ── agregace vad ──────────────────────────────────────────────────────── */

/* klíč 'kód§popis' → {tot, ks, m:{období:eur}, proj:{}, loc:{}} */
function rsnAll(proj){
  const o={},pick=p=>!proj||proj==='all'||p===proj;
  const put=(key,per,eur,ks,p)=>{
    const x=o[key]=o[key]||{tot:0,ks:0,m:{},proj:{},loc:{}};
    x.tot+=eur;x.ks+=ks;x.m[per]=(x.m[per]||0)+eur;x.proj[p]=(x.proj[p]||0)+eur;return x};

  if(dGran==='w'){
    /* denní reporty — pracoviště se dá k vadě přiřadit přesně přes `lr` */
    Object.keys(DB).sort().forEach(k=>{const per=isoWeek(k);
      Object.entries(DB[k].p||{}).forEach(([p,P])=>{if(!pick(p))return;
        Object.entries(P.r||{}).forEach(([key,v])=>{if(v.e<=0)return;
          put(key,per,v.e,v.q||0,p)});
        Object.entries(P.lr||{}).forEach(([lk,v])=>{if(v.e<=0)return;
          const i=lk.indexOf('¶');if(i<0)return;
          const loc=lk.slice(0,i),key=lk.slice(i+1);
          if(!o[key])return;o[key].loc[loc]=(o[key].loc[loc]||0)+v.e})})});
    return o}

  /* měsíční QAD export */
  rsnMonths().forEach(m=>Object.entries(MDET[String(m)]).forEach(([p,D])=>{
    if(!pick(p))return;
    (D.R||[]).forEach(r=>{const eur=r[3]||0;if(eur<=0)return;
      put(r[0]+'§'+r[1],String(m),eur,r[4]||0,p)});
    /* kombinace v P se klíčují popisem vady, ne kódem — proto shoda přes popis */
    (D.P||[]).forEach(r=>{const eur=r[3]||0;if(eur<=0)return;
      Object.keys(o).forEach(key=>{if(key.split('§')[1]!==r[1])return;
        o[key].loc[r[0]]=(o[key].loc[r[0]]||0)+eur})})}));
  return o}

/* ── trend ─────────────────────────────────────────────────────────────── */

/* poslední třetina období proti té předchozí */
function rsnTrend(x,perAll){
  const per=perAll.filter(q=>!q.part);
  const n=per.length;
  if(n<2)return{kod:'malo',lab:'málo dat',cls:'n',pct:null,a:null,b:null};
  const k=Math.max(1,Math.floor(n/3));
  const late=per.slice(-k),early=per.slice(-2*k,-k);
  const b=late.reduce((s,q)=>s+(x.m[q.key]||0),0);
  const a=early.reduce((s,q)=>s+(x.m[q.key]||0),0);
  if(!a&&!b)return{kod:'malo',lab:'málo dat',cls:'n',pct:null,a:a,b:b};
  if(!a)return{kod:'nova',lab:'nová',cls:'r',pct:null,a:a,b:b};
  if(!b)return{kod:'pryc',lab:'vyřešená',cls:'g',pct:-100,a:a,b:b};
  const pct=(b-a)/a*100;
  if(pct>25)return{kod:'roste',lab:'roste',cls:'r',pct:pct,a:a,b:b};
  if(pct<-25)return{kod:'klesa',lab:'klesá',cls:'g',pct:pct,a:a,b:b};
  return{kod:'stabil',lab:'stabilní',cls:'n',pct:pct,a:a,b:b}}

/* seřazené vady s trendem a kumulativním podílem — Pareto */
function rsnPareto(proj){
  const per=rsnPeriods(),all=rsnAll(proj);
  const rows=Object.entries(all).sort((a,b)=>b[1].tot-a[1].tot);
  const cel=rows.reduce((s,r)=>s+r[1].tot,0);
  let run=0;
  return{per:per,cel:cel,rows:rows.map(([key,x])=>{run+=x.tot;
    return{key:key,kod:key.split('§')[0],nazev:key.split('§')[1]||key,
      tot:x.tot,ks:x.ks,m:x.m,proj:x.proj,loc:x.loc,
      podil:cel?x.tot/cel:0,kumul:cel?run/cel:0,tr:rsnTrend(x,per)}})}}

/* nejvýraznější pohyb v obou směrech — na KPI karty */
function rsnMovers(P){
  const s=P.rows.filter(r=>r.tr.a!=null&&r.tr.b!=null&&(r.tr.a||r.tr.b));
  const up=s.filter(r=>r.tr.b>r.tr.a).sort((a,b)=>(b.tr.b-b.tr.a)-(a.tr.b-a.tr.a))[0];
  const dn=s.filter(r=>r.tr.b<r.tr.a).sort((a,b)=>(a.tr.b-a.tr.a)-(b.tr.b-b.tr.a))[0];
  return{up:up||null,dn:dn||null}}
