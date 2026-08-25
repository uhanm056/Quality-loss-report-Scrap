/* Záložka 1: denní přehled — tempo a prognóza k cíli
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

function renderDash(){
  const box=document.getElementById('dashBody');
  if(!curMonth||!daysOf(curMonth).length){
    box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
      '<div style="font-size:44px;margin-bottom:10px">📊</div>'+
      '<b>Zatím žádná denní data.</b><br>Nahrajte denní report v záložce '+
      '<b>Data &amp; import</b>.</div></div></div>';return}
  const ks=daysOf(curMonth),n=ks.length,tot=sumM(curMonth),qty=qtyM(curMonth);
  const per=tot/n,tgt=SET.target,wd=SET.workdays||21;
  const allow=tgt/wd*n,fc=per*wd;
  const last=DB[ks[n-1]],prev=n>1?DB[ks[n-2]]:null,dL=prev?last.eur-prev.eur:0;
  const yy=curMonth.slice(0,4),mm=+curMonth.slice(5,7);
  const dw=n===1?'den':(n<5?'dny':'dnů');
  const nd=daysNoDetail(curMonth);
  let cls,ic,hd,tx;
  if(fc>tgt*1.02){cls='bad';ic='⛔';hd='Míříme nad cíl';
    tx='Tempem '+fE(per)+' za den skončíme na <b>'+fE(fc)+'</b> — o '+fE(fc-tgt)+' nad cílem.'}
  else if(fc>tgt*.92){cls='warn';ic='⚠️';hd='Cíl je na hraně';
    tx='Prognóza konce měsíce <b>'+fE(fc)+'</b> proti cíli '+fE(tgt)+'. Rezerva je malá.'}
  else{cls='ok';ic='✅';hd='Držíme tempo';
    tx='Tempem '+fE(per)+' za den skončíme kolem <b>'+fE(fc)+'</b>, tedy '+fE(tgt-fc)+' pod cílem.'}
  tx+=' Zatím '+n+' '+dw+' z '+wd+'.';
  const warn=nd.length?'<div class="warnbox"><span style="font-size:26px">⚠️</span><div><b>'+
    nd.length+' '+(nd.length===1?'den nemá':'dnů nemá')+' uložený detail.</b> Byly načtené starší verzí. '+
    'Přetáhněte je znovu v záložce Data — rozpad na pracoviště a příčiny se doplní.<br>'+
    '<span style="font-size:12px;opacity:.85">'+nd.map(k=>k.split('-').reverse().join('.')).join(', ')+
    '</span></div></div>':'';
  const projs=projTotals(curMonth);
  box.innerHTML=warn+
  '<div class="status '+cls+'"><div class="st-i">'+ic+'</div>'+
  '<div class="st-t"><h2>'+hd+'</h2><p>'+tx+'</p></div>'+
  '<div class="st-n"><div class="big">'+fE(tot)+'</div>'+
  '<div class="l">'+MN[mm-1]+' '+yy+' · kumulativně</div></div></div>'+
  '<div class="grid4">'+
  '<div class="kpi '+(last.eur>tgt/wd?'r':'g')+'"><div class="kpi-l">Poslední den · '+
    ks[n-1].split('-').reverse().join('.')+'</div><div class="kpi-v">'+fE(last.eur)+'</div>'+
    '<div class="kpi-s">'+(prev?'<span class="tag '+(dL>0?'r':'g')+'">'+(dL>0?'▲':'▼')+' '+fE(Math.abs(dL))+
    '</span> proti předchozímu':'první den')+'</div></div>'+
  '<div class="kpi '+(tot>allow?'r':'g')+'"><div class="kpi-l">Kumulace vs povolené tempo</div>'+
    '<div class="kpi-v">'+(tot>allow?'+':'')+fE(tot-allow)+'</div>'+
    '<div class="kpi-s">povoleno k dnešku '+fE(allow)+'</div></div>'+
  '<div class="kpi b"><div class="kpi-l">Průměr na den</div><div class="kpi-v">'+fE(per)+'</div>'+
    '<div class="kpi-s">denní limit '+fE(tgt/wd)+'</div></div>'+
  '<div class="kpi '+(fc>tgt?'r':'g')+'"><div class="kpi-l">Prognóza konce měsíce</div>'+
    '<div class="kpi-v">'+fk(fc)+'</div><div class="kpi-s">cíl '+fk(tgt)+' · '+fN(qty)+' ks</div></div></div>'+
  '<div class="panel"><div class="ph"><span>Denní vývoj a kumulace k cíli</span>'+
    '<div class="legend" style="color:rgba(255,255,255,.85)">'+
    '<span><span class="sw" style="background:#5DADE2"></span>den</span>'+
    '<span><span class="dsh" style="background:#E8A020"></span>kumulace</span>'+
    '<span><span class="dsh" style="background:#C0392B"></span>povolené tempo</span></div></div>'+
    '<div class="pb"><div class="chw" style="height:250px"><canvas id="cDay"></canvas></div></div></div>'+
  '<div class="panel"><div class="ph"><span>Projekty — '+MN[mm-1]+'</span>'+
    '<span style="font-weight:600;opacity:.85">klikni na projekt pro detailní rozpad →</span></div>'+
    '<div class="pb"><div style="display:flex;flex-direction:column;gap:9px" id="lProj"></div></div></div>';
  let run=0;const cum=ks.map(k=>run+=DB[k].eur);
  mk('cDay',{data:{labels:ks.map(k=>k.slice(8)+'.'+k.slice(5,7)+'.'),datasets:[
    {type:'bar',label:'Den',data:ks.map(k=>DB[k].eur),
     backgroundColor:ks.map(k=>DB[k].eur>tgt/wd?'#E59A94':'#9CC5E8'),borderRadius:5,yAxisID:'y',order:3},
    {type:'line',label:'Kumulace',data:cum,borderColor:'#E8A020',backgroundColor:'rgba(232,160,32,.10)',
     fill:true,borderWidth:3,pointRadius:3,tension:.25,yAxisID:'y1',order:1},
    {type:'line',label:'Povolené tempo',data:ks.map((_,i)=>tgt/wd*(i+1)),borderColor:'#C0392B',
     borderWidth:2,borderDash:[6,4],pointRadius:0,yAxisID:'y1',order:2}]},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{display:false},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>' '+c.dataset.label+': '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>Math.round(v/1000)+'k',font:{size:10},color:'#7F8C8D'},grid:grd,border:{display:false}},
      y1:{position:'right',ticks:{callback:v=>Math.round(v/1000)+'k',font:{size:10},color:'#E8A020'},
        grid:{display:false},border:{display:false}}}}});
  const el=document.getElementById('lProj');
  if(!projs.length){el.innerHTML='<div class="empty" style="padding:20px">Bez rozpadu na projekty.</div>';return}
  const det=hasDetail(curMonth),max=projs[0][1].e;
  el.innerHTML=projs.map(function(p,i){const nm=p[0],v=p[1];
    return '<div class="prow '+(i===0?'hot':'')+'"'+(det?' onclick="openProj(\''+esc(nm)+'\')"':' style="cursor:default"')+'>'+
    '<div class="prank '+(i===0?'top':'')+'">'+(i+1)+'</div><span class="n">'+nm+'</span>'+
    '<div class="bb"><div class="bf" style="width:'+Math.round(v.e/max*100)+'%;background:'+
      (i===0?'#C0392B':'#2E6DA4')+'"></div></div>'+
    '<span class="v">'+fE(v.e)+'</span>'+
    '<span class="pc">'+Math.round(v.e/tot*100)+' %'+(v.q?' · '+fN(v.q)+' ks':'')+'</span>'+
    '<span class="ar">'+(det?'›':'')+'</span></div>'}).join('')}
