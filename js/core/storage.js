/* Jádro: úložiště denních dat a nastavení (localStorage)
   Klíče yf_scrap_daily_v2, yf_scrap_set_v1, yf_tgtm, yf_ptgtm.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const KEY='yf_scrap_daily_v2',SKEY='yf_scrap_set_v1';
let DB={},SET={target:95000,workdays:21};
try{DB=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){DB={}}
if(!Object.keys(DB).length){try{const o=JSON.parse(localStorage.getItem('yf_scrap_daily_v1')||'{}');
  if(Object.keys(o).length)DB=o}catch(e){}}
try{SET=Object.assign(SET,JSON.parse(localStorage.getItem(SKEY)||'{}'))}catch(e){}
try{const t=JSON.parse(localStorage.getItem('yf_tgtm')||'null');if(t)TGTM=Object.assign(TGTM,t)}catch(e){}
const saveT=()=>{try{localStorage.setItem('yf_tgtm',JSON.stringify(TGTM))}catch(e){}};
try{const p=JSON.parse(localStorage.getItem('yf_ptgtm')||'null');if(p)PTGTM=Object.assign(PTGTM,p)}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}
  catch(e){toast('Nepodařilo se uložit: '+e.message,'#C0392B')}};
const saveS=()=>{try{localStorage.setItem(SKEY,JSON.stringify(SET))}catch(e){}};
