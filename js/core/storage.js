/* Jádro: úložiště denních dat a nastavení (localStorage)
   Klíče yf_scrap_daily_v2, yf_rework_daily_v1, yf_scrap_set_v1, yf_tgtm, yf_ptgtm.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const KEY='yf_scrap_daily_v2',RKEY='yf_rework_daily_v1',SKEY='yf_scrap_set_v1';
let DB={},RW={},SET={rwTarget:0,rwRate:30};
try{DB=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){DB={}}
try{RW=JSON.parse(localStorage.getItem(RKEY)||'{}')}catch(e){RW={}}
if(!Object.keys(DB).length){try{const o=JSON.parse(localStorage.getItem('yf_scrap_daily_v1')||'{}');
  if(Object.keys(o).length)DB=o}catch(e){}}
try{SET=Object.assign(SET,JSON.parse(localStorage.getItem(SKEY)||'{}'))}catch(e){}
try{const t=JSON.parse(localStorage.getItem('yf_tgtm')||'null');if(t)TGTM=Object.assign(TGTM,t)}catch(e){}
/* Sdílení dat (js/core/cloud.js) se přihlašuje k ukládání tady, aby se změna
   dostala k ostatním bez ohledu na to, odkud přišla. Když sdílení běží
   vypnuté, jsou tyhle háčky nedefinované a nic se neděje. */
const cloudSync=()=>{if(window.cloudBump)cloudBump()};
const cloudCfg=()=>{if(window.cfgPush)cfgPush()};
const saveT=()=>{try{localStorage.setItem('yf_tgtm',JSON.stringify(TGTM))}catch(e){}
  cloudCfg()};
try{const p=JSON.parse(localStorage.getItem('yf_ptgtm')||'null');if(p)PTGTM=Object.assign(PTGTM,p)}catch(e){}
try{const p=JSON.parse(localStorage.getItem('yf_psal')||'null');if(p)Object.assign(PSAL,p)}catch(e){}
/* targety a Sales projektů — ukládají se spolu, chodí ze stejného zdroje */
const saveP=()=>{try{localStorage.setItem('yf_ptgtm',JSON.stringify(PTGTM));
  localStorage.setItem('yf_psal',JSON.stringify(PSAL))}catch(e){}cloudCfg()};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}
  catch(e){toast('Nepodařilo se uložit: '+e.message,'#C0392B')}cloudSync()};
const saveS=()=>{try{localStorage.setItem(SKEY,JSON.stringify(SET))}catch(e){}cloudCfg()};
const saveR=()=>{try{localStorage.setItem(RKEY,JSON.stringify(RW))}
  catch(e){toast('Nepodařilo se uložit rework: '+e.message,'#C0392B')}cloudSync()};

/* Měsíční rozpad z importu. Leží nad tím, co je zapsané v kódu
   (js/data/monthly-detail.js), aby se dalo poznat, co odkud je — a aby
   ten, kdo si nic nenahrál, pořád viděl aspoň zapsaný základ. */
let MDETI={};
try{MDETI=JSON.parse(localStorage.getItem('yf_mdet')||'{}')}catch(e){MDETI={}}
/* nedotčený základ — bez něj by po smazání měsíce ze sdílených dat zůstal
   v paměti překlopený rozpad a nešlo by se vrátit k tomu, co je v kódu */
const MDET0=JSON.parse(JSON.stringify(MDET));
const mdetApply=()=>{
  Object.keys(MDET).forEach(m=>{delete MDET[m]});
  Object.assign(MDET,JSON.parse(JSON.stringify(MDET0)));
  Object.keys(MDETI).forEach(m=>{if(MDETI[m]&&MDETI[m].d)MDET[m]=MDETI[m].d})};
const saveM=()=>{try{localStorage.setItem('yf_mdet',JSON.stringify(MDETI))}
  catch(e){toast('Nepodařilo se uložit měsíční rozpad: '+e.message,'#C0392B')}cloudSync()};
/* ── překlep v názvu projektu ve starších uložených datech ──────────────
   Import sjednocuje názvy přes `projKey()`, ale dny nahrané dřív si nesou
   starý klíč — `G463` by zůstal viset vedle `G463 M` v datech, která se
   znovu nenahrají. Projde se proto jednou při načtení. Je to idempotentní:
   po doběhnutí už žádný klíč z `PALIAS` neexistuje.

   Součty se nemění, jen se přesypou mezi projekty. */
const addInto=(a,b)=>{Object.entries(b).forEach(([k,v])=>{
  if(typeof v==='number')a[k]=(a[k]||0)+v;
  else if(v&&typeof v==='object'&&!Array.isArray(v)){a[k]=a[k]||{};addInto(a[k],v)}})};
/* řádky MDET jsou pole [klíč…, wt, wo, q] — `n` je, kolik vedoucích polí
   tvoří klíč (L má jedno, R i P dvě); řadí se podle absolutní hodnoty wt,
   protože opravné řádky jsou záporné */
const addRows=(a,b,n)=>{const m={};
  a.concat(b).forEach(r=>{const k=r.slice(0,n).join('\u00b6');
    if(!m[k])m[k]=r.slice();
    else for(let i=n;i<r.length;i++)m[k][i]+=r[i]});
  return Object.values(m).sort((x,y)=>Math.abs(y[n])-Math.abs(x[n]))};
function aliasFix(){
  let n=0;
  const mv=(map,fn)=>Object.entries(PALIAS).forEach(([src,dst])=>{
    if(!map[src])return;
    if(map[dst])fn(map[dst],map[src]);else map[dst]=map[src];
    delete map[src];n++});
  Object.values(DB).forEach(d=>{if(d&&d.p)mv(d.p,addInto)});
  Object.values(RW).forEach(d=>{if(d&&d.p)mv(d.p,addInto)});
  Object.values(MDETI).forEach(x=>{if(x&&x.d)mv(x.d,(a,b)=>{
    a.wt+=b.wt;a.wo+=b.wo;
    a.L=addRows(a.L||[],b.L||[],1);
    a.R=addRows(a.R||[],b.R||[],2);
    a.P=addRows(a.P||[],b.P||[],2)})});
  return n}
if(aliasFix()){save();saveR();saveM()}
mdetApply();

/* Měsíční historie QLR z importu (klíč `yf_hist`). Leží nad tím, co je
   zapsané v kódu (js/data/qlr-history.js), stejně jako MDETI nad MDET.

   Zapsaná čísla jsou ověřená proti scrap reportu v době uzávěrky a QAD data
   proti nim postupně driftují (červen o 3 078 €), takže **import je nikdy
   nepřepisuje** — jen dopisuje měsíce, které v základu ještě nejsou. */
let HISTI={};
try{HISTI=JSON.parse(localStorage.getItem('yf_hist')||'{}')}catch(e){HISTI={}}
const HIST0={LBL:LBL.slice(),QW:QW.slice(),QO:QO.slice(),QT:QT.slice(),
             EO:EO.slice(),EW:EW.slice(),SV:SV.slice()};
const HARR=[['LBL',LBL],['QW',QW],['QO',QO],['QT',QT],['EO',EO],['EW',EW],['SV',SV]];
/* '2026-09' ↔ 'Zář 26' */
const hLbl=k=>MO3[+k.slice(5,7)-1]+' '+k.slice(2,4);
const hKey=l=>{const m=MO3.indexOf(String(l).slice(0,3));
  return m<0?null:'20'+String(l).slice(-2)+'-'+String(m+1).padStart(2,'0')};
const HBASE=hKey(HIST0.LBL[0]);
const hIdx=k=>(+k.slice(0,4)-+HBASE.slice(0,4))*12+(+k.slice(5,7)-+HBASE.slice(5,7));
/* index posledního zapsaného měsíce — co je pod ním, je ověřený základ */
const hFixed=HIST0.LBL.length;

/* Pole jsou pozičně svázaná s LBL a **musí zůstat spojitá** — jedna díra by
   znamenala `QW[i].toFixed()` nad null, tedy prázdnou záložku QLR. Měsíc,
   který by za posledním udělal mezeru, se proto přeskočí; stejně tak měsíc
   bez kompletní čtveřice qw/qo/eo/ew. */
function histApply(){
  const n0=LBL.length;
  HARR.forEach(([n,a])=>{a.length=0;HIST0[n].forEach(v=>a.push(v))});
  Object.keys(HISTI).sort().forEach(k=>{
    const h=HISTI[k];if(!h)return;
    if(h.qw==null||h.qo==null||h.eo==null||h.ew==null)return;
    const i=hIdx(k);if(i<hFixed||i>LBL.length)return;
    if(i===LBL.length){LBL.push(hLbl(k));
      QW.push(null);QO.push(null);QT.push(null);EO.push(null);EW.push(null);SV.push(null)}
    QW[i]=h.qw;QO[i]=h.qo;EO[i]=h.eo;EW[i]=h.ew;
    if(h.qt!=null)QT[i]=h.qt;
    if(h.sv!=null)SV[i]=h.sv});
  R12.length=0;
  QW.forEach((_,i)=>R12.push(i<11?null
    :+(QW.slice(i-11,i+1).reduce((a,b)=>a+b,0)/12).toFixed(4)));
  /* Okno grafu rolling 12M se po přírůstku měsíce musí posunout. `qRoll()`
     `rTo` jen shora ořezává (`if(rTo>QW.length-1)`), nikdy neposouvá nahoru,
     takže by zůstalo na starém konci a nový měsíc by nebyl vidět — přesně to
     se stávalo, když se měsíc dopisoval ručně. */
  if(LBL.length!==n0&&typeof rTo!=='undefined'){
    rTo=LBL.length-1;rFrom=Math.max(0,LBL.length-12)}}
const saveH=()=>{try{localStorage.setItem('yf_hist',JSON.stringify(HISTI))}
  catch(e){toast('Nepodařilo se uložit historii QLR: '+e.message,'#C0392B')}cloudCfg()};
histApply();
