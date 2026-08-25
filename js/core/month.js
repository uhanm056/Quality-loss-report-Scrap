/* Jádro: měsíční výsledek proti targetu
   Cíl v EUR = target % × Sales — obojí z tabulky „Měsíční targety a Sales"
   v Nastavení (objekt TGTM). Skutečnost se bere z nejspolehlivějšího
   dostupného zdroje a ten se vždy napíše do UI.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

/* '2026-08' → '8' pro MDET; MDET má jen rok 2026 */
const mdKey=k=>k.slice(0,4)==='2026'?String(+k.slice(5,7)):null;
/* '2026-08' → index v LBL / EO / QO; historie začíná lednem 2024 */
function histIdx(k){const i=(+k.slice(0,4)-2024)*12+(+k.slice(5,7))-1;
  return i>=0&&i<EO.length?i:null}
const mLabel=k=>MN[+k.slice(5,7)-1]+' '+k.slice(0,4);
/* předchozí měsíc, který má v TGTM target i Sales */
function prevKey(k){const ks=Object.keys(TGTM).filter(x=>TGTM[x].t!=null&&TGTM[x].sales).sort();
  const i=ks.indexOf(k);return i>0?ks[i-1]:null}

/* cíl v EUR pro měsíc — null, když měsíc v tabulce chybí */
function cilEur(k){const o=TGTM[k]||{};
  return o.t!=null&&o.sales?o.t/100*o.sales:null}

/* skutečný scrap w/o tests za měsíc + odkud je
   pořadí zdrojů: ověřený scrap report → měsíční QAD export → denní reporty */
function actEur(k){
  const i=histIdx(k);
  if(i!=null&&EO[i]!=null)return{eur:EO[i],src:'scrap report'};
  const md=mdKey(k);
  if(md&&MDET[md]){const s=Object.values(MDET[md]).reduce((a,v)=>a+(v.wo||0),0);
    if(s)return{eur:s,src:'měsíční QAD export'}}
  if(daysOf(k).length)return{eur:sumM(k),src:'denní reporty'};
  return null}

/* kompletní výsledek měsíce — vše, co jde spočítat ze stejného snímku dat */
function monthResult(k){
  const o=TGTM[k]||{},cil=cilEur(k),act=actEur(k);
  if(!cil&&!act)return null;
  const eur=act?act.eur:null;
  const pct=eur!=null&&o.sales?eur/o.sales*100:null;
  const prev=prevKey(k),pAct=prev?actEur(prev):null;
  const pPct=prev&&pAct&&TGTM[prev].sales?pAct.eur/TGTM[prev].sales*100:null;
  return{key:k,label:mLabel(k),target:o.t!=null?o.t:null,targetCI:o.ci!=null?o.ci:null,
    sales:o.sales||null,partial:!!o.part,cil:cil,eur:eur,src:act?act.src:null,pct:pct,
    /* kladná rezerva = pod cílem, záporná = nad cílem */
    rez:cil!=null&&eur!=null?cil-eur:null,
    pb:pct!=null&&o.t!=null?pct-o.t:null,
    prevKey:prev,prevLabel:prev?mLabel(prev):null,prevPct:pPct,
    prevEur:pAct?pAct.eur:null}}

/* všechny měsíce z tabulky targetů, od nejstaršího — pro kumulativ */
function yearRows(){
  return Object.keys(TGTM).filter(k=>TGTM[k].t!=null&&TGTM[k].sales).sort()
    .map(monthResult).filter(r=>r&&r.eur!=null)}

/* součet cílů a skutečnosti přes měsíce, kde známe obojí */
function yearSum(){
  const rows=yearRows();
  const cil=rows.reduce((a,r)=>a+r.cil,0),eur=rows.reduce((a,r)=>a+r.eur,0);
  const sales=rows.reduce((a,r)=>a+r.sales,0);
  return{rows:rows,cil:cil,eur:eur,sales:sales,rez:cil-eur,
    pct:sales?eur/sales*100:null,tgt:sales?cil/sales*100:null}}
