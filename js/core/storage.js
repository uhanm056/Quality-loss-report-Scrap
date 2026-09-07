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
mdetApply();
