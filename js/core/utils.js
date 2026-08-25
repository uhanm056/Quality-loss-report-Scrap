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
const f3=v=>v==null?'—':v.toFixed(3)+'%';
const esc=s=>String(s).replace(/'/g,"\\'");
const grd={color:'rgba(27,58,92,.07)'};
/* hodnota bodu pro plugin datalabels — jeho kontext má jen
   {active,chart,dataIndex,dataset,datasetIndex}, žádné c.raw */
const dlVal=c=>c.dataset.data[c.dataIndex];
const mk=(id,cfg)=>{const el=document.getElementById(id);if(!el)return;
  if(CH[id])CH[id].destroy();CH[id]=new Chart(el,cfg)};
function toast(m,c){const t=document.getElementById('toast');t.textContent=m;
  t.style.background=c||'#27AE60';t.style.display='block';setTimeout(()=>t.style.display='none',5200)}
