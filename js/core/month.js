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

/* kolik dnů má měsíc '2026-08' */
const daysInMonth=k=>new Date(+k.slice(0,4),+k.slice(5,7),0).getDate();

/* jak daleko je měsíc podle posledního dne, ke kterému máme data.
   Počet nahraných dnů se na to použít nedá — závod nejede každý den stejně
   a dnů s reportem bývá víc než plánovaných pracovních dnů. */
function pace(keys,k){
  if(!keys.length)return null;
  const dim=daysInMonth(k),last=+keys[keys.length-1].slice(8);
  const now=new Date(),cur=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  /* měsíc je uzavřený, když má data do konce nebo už dávno skončil */
  const done=last>=dim||k<cur;
  const share=done?1:Math.min(1,last/dim);
  /* jakou část uplynulých dnů reporty pokrývají — když jich je nahraná jen
     hrstka, chybějící dny nejsou nuly a prognóza by lhala směrem dolů */
  const cover=keys.length/last;
  return{n:keys.length,dim:dim,last:last,share:share,done:done,cover:cover,
    ok:cover>=0.5,
    /* kolik dnů s výrobou měsíc nejspíš bude mít, když tempo vydrží */
    exp:Math.max(keys.length,Math.round(keys.length/share))}}

/* cíl v EUR pro měsíc — null, když měsíc v tabulce chybí */
function cilEur(k){const o=TGTM[k]||{};
  return o.t!=null&&o.sales?o.t/100*o.sales:null}
/* Přísnější cíl včetně CI tasků. Není u každého měsíce — červen 2026 ho nemá
   vůbec — takže všude, kde se ukazuje, musí umět chybět. */
function cilCiEur(k){const o=TGTM[k]||{};
  return o.ci!=null&&o.sales?o.ci/100*o.sales:null}

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

/* aktuální kalendářní měsíc — období, které ještě neskončilo */
const curKey=()=>{const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};

/* Sales jsou snímek, ale měsíc už podle kalendáře skončil.
   Scrap se pak sčítá za celý měsíc a Sales jsou jen k datu exportu — procento
   z toho vyjde nesmyslně vysoké a s cílem se porovnávat nedá. */
const salesStale=k=>!!((TGTM[k]||{}).part)&&k<curKey();

/* Nejbližší dřívější měsíc, jehož Sales jsou za celý měsíc — tedy ani snímek
   z průběhu (`part`), ani nesourodý (`salesStale`). Z něj se bere předpoklad
   pro odhad rozdělaného měsíce; snímkové Sales by odhad podstřelily. */
function soundSales(k){
  const ks=Object.keys(TGTM).filter(x=>x<k&&TGTM[x].sales&&!TGTM[x].part).sort();
  const b=ks[ks.length-1];
  return b?{key:b,label:mLabel(b),sales:TGTM[b].sales}:null}

/* kompletní výsledek měsíce — vše, co jde spočítat ze stejného snímku dat */
function monthResult(k){
  const o=TGTM[k]||{},cil=cilEur(k),cilCi=cilCiEur(k),act=actEur(k);
  if(!cil&&!act)return null;
  const eur=act?act.eur:null;
  const pct=eur!=null&&o.sales?eur/o.sales*100:null;
  const prev=prevKey(k),pAct=prev?actEur(prev):null;
  const pPct=prev&&pAct&&TGTM[prev].sales?pAct.eur/TGTM[prev].sales*100:null;
  return{key:k,label:mLabel(k),target:o.t!=null?o.t:null,targetCI:o.ci!=null?o.ci:null,
    sales:o.sales||null,partial:!!o.part,stale:salesStale(k),
    cil:cil,eur:eur,src:act?act.src:null,pct:pct,
    /* kladná rezerva = pod cílem, záporná = nad cílem */
    rez:cil!=null&&eur!=null?cil-eur:null,
    pb:pct!=null&&o.t!=null?pct-o.t:null,
    /* totéž proti přísnějšímu cíli s CI tasky */
    cilCi:cilCi,
    rezCi:cilCi!=null&&eur!=null?cilCi-eur:null,
    pbCi:pct!=null&&o.ci!=null?pct-o.ci:null,
    prevKey:prev,prevLabel:prev?mLabel(prev):null,prevPct:pPct,
    /* u nesourodého předchozího měsíce nemá porovnání smysl — jeho procento
       je scrap za celý měsíc dělený snímkovými Sales */
    prevStale:!!(prev&&salesStale(prev)),
    prevEur:pAct?pAct.eur:null,base:soundSales(k)}}

/* ── Kvartální trend projektu ──────────────────────────────────────────
   Scrap po projektech je v `MDET` za každý měsíc, ale Sales po projektech
   (`PSAL`) jen za některé — po importu workplanu ne vždy za celý rok.
   Proto se porovnává primárně v **EUR** a procento ze Sales se přidá jen
   tehdy, když ho znají oba kvartály za všechny počítané měsíce.

   **Probíhající kalendářní měsíc se vynechá** — stejné pravidlo jako
   u trendu vad: useknutý měsíc by vypadal jako zlepšení. Kvartály tím
   ale můžou mít různý počet měsíců (Q3 za čvc+srp proti celému Q2),
   takže se v EUR porovnává **průměr na měsíc**, ne holý součet. */
const qOf=m=>Math.floor((+m-1)/3)+1;
const qMonths=q=>[q*3-2,q*3-1,q*3];
const QLBL=['','Q1','Q2','Q3','Q4'];
/* `MDET` drží jen rok 2026 (viz mdKey) — proto se probíhající měsíc
   vynechává jen tehdy, když zrovna ten rok běží. */
const mdRunning=()=>{const d=new Date();
  return d.getFullYear()===2026?d.getMonth()+1:0};

function projQuarter(mSel,p){
  const cur=qOf(mSel),prev=cur-1;
  if(prev<1)return null;                    /* Q4 loňska v MDET není */
  const run=mdRunning();
  const part=function(q){
    const ms=qMonths(q).filter(m=>m!==run&&MDET[m]&&MDET[m][p]);
    if(!ms.length)return null;
    const eur=ms.reduce((a,m)=>a+(MDET[m][p].wo||0),0);
    const sal=ms.map(m=>pSales(m,p));
    const full=sal.every(x=>x);
    const stot=full?sal.reduce((a,x)=>a+x,0):null;
    return{q:q,ms:ms,eur:eur,per:eur/ms.length,
      sales:stot,pct:stot?eur/stot*100:null}};
  const a=part(prev),b=part(cur);
  if(!a||!b)return null;
  return{cur:b,prev:a,
    /* v EUR na měsíc — kvartály můžou mít různý počet měsíců */
    dPer:b.per-a.per,
    pctPer:a.per?(b.per-a.per)/a.per*100:null,
    /* v procentech ze Sales — jen když je zná obojí */
    dPb:(b.pct!=null&&a.pct!=null)?b.pct-a.pct:null,
    /* kvartál je neúplný, když mu chybí měsíc kvůli běžícímu měsíci */
    curPart:b.ms.length<3,prevPart:a.ms.length<3}}

/* všechny měsíce z tabulky targetů, od nejstaršího — pro kumulativ */
function yearRows(){
  return Object.keys(TGTM).filter(k=>TGTM[k].t!=null&&TGTM[k].sales).sort()
    .map(monthResult).filter(r=>r&&r.eur!=null&&!r.stale)}

/* součet cílů a skutečnosti přes měsíce, kde známe obojí */
function yearSum(){
  const rows=yearRows();
  const cil=rows.reduce((a,r)=>a+r.cil,0),eur=rows.reduce((a,r)=>a+r.eur,0);
  const sales=rows.reduce((a,r)=>a+r.sales,0);
  /* Cíl s CI tasky se sčítá jen přes měsíce, které ho mají — jinak by součet
     míchal přísný cíl s chybějícím a vyšel by nesmyslně nízký. Proto se vedle
     součtu drží i to, kolika měsíců se týká. */
  const ciR=rows.filter(r=>r.cilCi!=null);
  const cilCi=ciR.reduce((a,r)=>a+r.cilCi,0);
  const ciSales=ciR.reduce((a,r)=>a+r.sales,0),ciEur=ciR.reduce((a,r)=>a+r.eur,0);
  return{rows:rows,cil:cil,eur:eur,sales:sales,rez:cil-eur,
    pct:sales?eur/sales*100:null,tgt:sales?cil/sales*100:null,
    ciN:ciR.length,cilCi:ciR.length?cilCi:null,
    rezCi:ciR.length?cilCi-ciEur:null,
    ciTgt:ciSales?cilCi/ciSales*100:null,ciEur:ciR.length?ciEur:null}}
