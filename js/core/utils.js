/* Jádro: formátování, stav UI a pomocníci pro grafy
   Registrace Chart.js pluginů, formátovače čísel, mk() pro grafy, toast().
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

Chart.register(ChartDataLabels);Chart.defaults.plugins.datalabels.display=false;

const MN=['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
let curTab=0,qSub=0,curMonth=null,curProj=null,rFrom=19,rTo=30,yrView='all',ytdU='%';
const CH={};
const fE=v=>Math.round(v||0).toLocaleString('cs-CZ')+' €';
const fk=v=>Math.round((v||0)/1000).toLocaleString('cs-CZ')+' k€';
const fN=v=>Math.round(v||0).toLocaleString('cs-CZ');
/* drobné částky s haléři — u ceny na kus je 0 € k ničemu */
const fEs=v=>Math.abs(v||0)<10?(v||0).toFixed(2).replace('.',',')+' €':fE(v);
const f3=v=>v==null?'—':v.toFixed(3)+'%';
const esc=s=>String(s).replace(/'/g,"\\'");
/* Kód vady se v QAD zapisuje jednou velkými, jednou malými písmeny — PVZD
   i pvzd je „Vzduch". Pro sčítání se kód sjednotí na velká písmena, popis
   zůstane, jak přišel. Klíč vady je 'kód§popis', u kombinací 'pracoviště¶kód§popis'. */
const rsnKey=k=>{const t=String(k),i=t.indexOf('§');
  return i<0?t:t.slice(0,i).toUpperCase()+t.slice(i)};
const lrKey=k=>{const t=String(k),i=t.indexOf('¶');
  return i<0?rsnKey(t):t.slice(0,i+1)+rsnKey(t.slice(i+1))};
/* sloučí dvojice [klíč,{e,…}] podle klíče a seřadí sestupně podle EUR */
const mergeBy=(pairs,fn)=>{const o={};
  pairs.forEach(([k,v])=>{const key=fn?fn(k):k,x=o[key]=o[key]||{e:0,q:0};
    x.e+=v.e||0;x.q+=v.q||0});
  return Object.entries(o).sort((a,b)=>b[1].e-a[1].e)};
const grd={color:'rgba(27,58,92,.07)'};
/* hodnota bodu pro plugin datalabels — jeho kontext má jen
   {active,chart,dataIndex,dataset,datasetIndex}, žádné c.raw */
const dlVal=c=>c.dataset.data[c.dataIndex];
const mk=(id,cfg)=>{const el=document.getElementById(id);if(!el)return;
  if(CH[id])CH[id].destroy();CH[id]=new Chart(el,cfg)};
function toast(m,c){const t=document.getElementById('toast');t.textContent=m;
  t.style.background=c||'#27AE60';t.style.display='block';setTimeout(()=>t.style.display='none',5200)}
