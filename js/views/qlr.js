/* Záložka 0: QLR měsíčně — rolling 12M, year over year, scrap EUR
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

function renderQ(){
  const N=QW.length-1,tgt=QT[N],over=QW[N]>tgt;
  const sav=SV.slice(24).filter(Boolean).reduce((a,b)=>a+b,0);
  document.getElementById('hb1').textContent=LBL[N]+' · QLR '+QW[N].toFixed(2)+'%';
  document.getElementById('hb2').textContent='Saving 2026: '+fE(sav);
  document.getElementById('qKpi').innerHTML=
  '<div class="kpi '+(over?'r':'g')+'"><div class="kpi-l">QLR % — '+LBL[N]+'</div>'+
    '<div class="kpi-v">'+f3(QW[N])+'</div><div class="kpi-s"><span class="tag '+(over?'r':'g')+'">'+
    (over?'+'+(QW[N]-tgt).toFixed(3)+'% nad':'▼ pod')+' targetem</span></div></div>'+
  '<div class="kpi b"><div class="kpi-l">Rolling 12M průměr</div><div class="kpi-v">'+f3(R12[N])+'</div>'+
    '<div class="kpi-s">'+LBL[N-11]+' – '+LBL[N]+'</div></div>'+
  '<div class="kpi a"><div class="kpi-l">Scrap EUR w/o tests</div><div class="kpi-v">'+fk(EO[N])+'</div>'+
    '<div class="kpi-s">předchozí '+fk(EO[N-1])+'</div></div>'+
  '<div class="kpi g"><div class="kpi-l">Saving 2026 kumulativ</div><div class="kpi-v">'+fE(sav)+'</div>'+
    '<div class="kpi-s">leden – '+LBL[N]+'</div></div>';
  if(qSub===0){qRoll();renderTop()}if(qSub===1)qYoY();if(qSub===2)qEur()}

function qRoll(){
  const f=document.getElementById('rFrom'),t=document.getElementById('rTo');
  f.min=0;f.max=QW.length-12;t.min=11;t.max=QW.length-1;
  if(rTo>QW.length-1)rTo=QW.length-1;if(rFrom>rTo-2)rFrom=Math.max(0,rTo-11);
  f.value=rFrom;t.value=rTo;
  document.getElementById('rLab').textContent=LBL[rFrom]+' → '+LBL[rTo];
  f.oninput=function(){rFrom=Math.min(+this.value,rTo-2);this.value=rFrom;qRoll()};
  t.oninput=function(){rTo=Math.max(+this.value,rFrom+2);this.value=rTo;qRoll()};
  const sl=a=>a.slice(rFrom,rTo+1);
  const tg=sl(QT);
  mk('cRoll',{data:{labels:sl(LBL),datasets:[
    {type:'bar',label:'QLR with tests',data:sl(QW),order:3,borderRadius:4,
     backgroundColor:sl(QW).map((v,i)=>tg[i]!=null&&v>tg[i]?'#C0392B':'#E59A94')},
    {type:'bar',label:'W/O tests',data:sl(QO),order:3,borderRadius:4,backgroundColor:'#9CC5E8'},
    {type:'line',label:'Rolling 12M',data:sl(R12),borderColor:'#27AE60',tension:.4,
     pointRadius:0,borderWidth:3,borderDash:[6,3],order:1},
    {type:'line',label:'Target',data:tg,borderColor:'#1B3A5C',tension:0,pointRadius:0,
     borderWidth:2,borderDash:[4,4],order:2}]},
   options:{responsive:true,maintainAspectRatio:false,
    onClick:(e,el)=>{if(el.length)pickFromChart(el[0].index,el[0].datasetIndex)},
    onHover:(e,el)=>{e.native.target.style.cursor=el.length?'pointer':'default'},
    plugins:{legend:{display:false},
      datalabels:{display:c=>c.datasetIndex<2&&c.raw!=null&&(rTo-rFrom)<=17,
        color:c=>c.datasetIndex===0?'#fff':'#1B3A5C',anchor:'center',align:'center',
        rotation:-90,font:{size:8,weight:'700'},formatter:v=>v.toFixed(2)+'%'},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>c.raw==null?null:' '+c.dataset.label+': '+c.raw.toFixed(3)+'%'}}},
    scales:{x:{ticks:{font:{size:9},maxRotation:45,maxTicksLimit:16},grid:{display:false}},
      y:{ticks:{callback:v=>v.toFixed(1)+'%',font:{size:10},color:'#7F8C8D'},grid:grd,min:0,border:{display:false}}}}});
  mk('cSav',{type:'bar',data:{labels:LBL.slice(24).map(s=>MN[MO3.indexOf(s.slice(0,3))]+' 26'),
    datasets:[{data:SV.slice(24),backgroundColor:'#27AE60',borderRadius:4}]},
   options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
    plugins:{legend:{display:false},datalabels:{display:true,color:'#fff',anchor:'center',align:'center',
      font:{size:10,weight:'700'},formatter:v=>v?Math.round(v/1000)+'k':''},
      tooltip:{callbacks:{label:c=>' '+fE(c.raw)}}},
    scales:{x:{ticks:{callback:v=>Math.round(v/1000)+'k €',font:{size:9},color:'#7F8C8D'},grid:grd,border:{display:false}},
      y:{ticks:{font:{size:11}},grid:{display:false},border:{display:false}}}}})}

function qYoY(){
  const y24=QW.slice(0,12),y25=QW.slice(12,24),y26=QW.slice(24).concat(Array(12-(QW.length-24)).fill(null));
  mk('cYoY',{type:'bar',data:{labels:MO3,datasets:[
    {label:'2024',data:y24,backgroundColor:'#CBD5E1',borderRadius:3},
    {label:'2025',data:y25,backgroundColor:'#5F80A9',borderRadius:3},
    {label:'2026',data:y26,backgroundColor:'#C0392B',borderRadius:3}]},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},
      datalabels:{display:c=>c.raw!=null,color:c=>c.dataset.backgroundColor==='#CBD5E1'?'#475569':'#fff',
        anchor:'end',align:'end',offset:-3,rotation:-90,font:{size:8,weight:'700'},
        formatter:v=>v.toFixed(2)+'%'},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>c.raw==null?null:' '+c.dataset.label+': '+c.raw.toFixed(3)+'%'}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>v.toFixed(1)+'%',font:{size:10},color:'#7F8C8D'},grid:grd,min:0,border:{display:false}}}}});
  const e24=EO.slice(0,12),e25=EO.slice(12,24),e26=EO.slice(24).concat(Array(12-(EO.length-24)).fill(null));
  mk('cYoYE',{type:'bar',data:{labels:MO3,datasets:[
    {label:'2024',data:e24,backgroundColor:'#CBD5E1',borderRadius:3},
    {label:'2025',data:e25,backgroundColor:'#5F80A9',borderRadius:3},
    {label:'2026',data:e26,backgroundColor:'#C0392B',borderRadius:3}]},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},
      datalabels:{display:c=>c.raw!=null,color:c=>c.dataset.backgroundColor==='#CBD5E1'?'#475569':'#fff',
        anchor:'end',align:'end',offset:-3,rotation:-90,font:{size:8,weight:'700'},
        formatter:v=>Math.round(v/1000)+'k'},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>c.raw==null?null:' '+c.dataset.label+': '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>Math.round(v/1000)+'k',font:{size:9},color:'#7F8C8D'},grid:grd,border:{display:false}}}}})}

function qEur(){
  const R={all:[0,QW.length,300],'2024':[0,12,240],'2025':[12,24,240],'2026':[24,QW.length,190]}[yrView];
  const a=R[0],b=R[1];
  document.getElementById('wEur').style.height=R[2]+'px';
  const lb=LBL.slice(a,b),wt=EW.slice(a,b),wo=EO.slice(a,b),df=wt.map((v,i)=>v-wo[i]);
  const lbl=yrView!=='all';
  mk('cEur',{type:'bar',data:{labels:lb,datasets:[
    {label:'With tests',data:wt,backgroundColor:'rgba(192,57,43,.75)',borderRadius:3,order:2},
    {label:'W/O tests',data:wo,backgroundColor:'rgba(46,109,164,.7)',borderRadius:3,order:2},
    {label:'Rozdíl',data:df,type:'line',borderColor:'#27AE60',borderWidth:2,borderDash:[4,3],
     pointRadius:2,tension:.3,order:1}]},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},
      datalabels:{display:c=>lbl&&c.datasetIndex<2,color:'#fff',anchor:'center',align:'center',
        font:{size:8,weight:'700'},formatter:v=>Math.round(v/1000)+'k'},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>' '+c.dataset.label+': '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:yrView==='all'?9:11},maxRotation:yrView==='all'?45:0,maxTicksLimit:14},grid:{display:false}},
      y:{ticks:{callback:v=>Math.round(v/1000)+'k €',font:{size:9},color:'#7F8C8D'},grid:grd,border:{display:false}}}}});
  const n26=QW.length-24,pct=ytdU==='%';
  const lb2=LBL.slice(24).map(s=>s.replace(' 26',' 2026'));
  const d1=pct?QW.slice(24):EW.slice(24),d2=pct?QO.slice(24):EO.slice(24);
  const ds=[{label:'With tests',data:d1,backgroundColor:'rgba(192,57,43,.7)',borderRadius:3},
            {label:'W/O tests',data:d2,backgroundColor:'rgba(46,109,164,.6)',borderRadius:3}];
  if(pct)ds.push({label:'Target 1 %',data:Array(n26).fill(1),type:'line',borderColor:'#27AE60',
    borderWidth:2,pointRadius:0,tension:0});
  const f=pct?(v=>v.toFixed(2)+'%'):(v=>Math.round(v/1000)+'k €');
  mk('cYtd',{type:'bar',data:{labels:lb2,datasets:ds},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},
      datalabels:{display:c=>c.datasetIndex<2,color:'#fff',anchor:'center',align:'center',
        font:{size:9,weight:'700'},formatter:v=>pct?v.toFixed(2)+'%':Math.round(v/1000)+'k'},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>' '+c.dataset.label+': '+f(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:f,font:{size:9},color:'#7F8C8D'},grid:grd,min:0,border:{display:false}}}}})}
window.setYr=(v,b)=>{yrView=v;document.querySelectorAll('#segYr .sbtn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');qEur()};
window.setU=(v,b)=>{ytdU=v;document.querySelectorAll('#segU .sbtn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');qEur()};
