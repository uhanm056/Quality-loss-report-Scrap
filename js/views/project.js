/* Záložka 3: detail projektu — pracoviště, reason kódy, kombinace
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

function bar(v,mx,t){return '<div class="minib"><div class="minif '+(t?'top':'')+
  '" style="width:'+Math.round(v/mx*100)+'%"></div></div>'}
function tblLoc(rows,tot){if(!rows.length)return '<div class="empty" style="padding:18px">Bez detailu</div>';
  const mx=rows[0][1].e;
  return '<table class="tbl"><thead><tr><th>Pracoviště</th><th>Kód</th><th class="num">Kusů</th>'+
    '<th class="num">EUR</th><th class="num">% projektu</th></tr></thead><tbody>'+
    rows.map((r,i)=>'<tr class="'+(i===0?'hi':'')+'"><td><b>'+locName(r[0])+'</b>'+bar(r[1].e,mx,i===0)+'</td>'+
      '<td><span class="code">'+r[0]+'</span></td><td class="num">'+fN(r[1].q)+'</td>'+
      '<td class="num">'+fE(r[1].e)+'</td><td class="num" style="color:var(--muted)">'+
      Math.round(r[1].e/tot*100)+' %</td></tr>').join('')+'</tbody></table>'}
function tblRsn(rows,tot){if(!rows.length)return '<div class="empty" style="padding:18px">Bez detailu</div>';
  const mx=rows[0][1].e;
  return '<table class="tbl"><thead><tr><th>Příčina</th><th>Kód</th><th class="num">Kusů</th>'+
    '<th class="num">EUR</th><th class="num">% projektu</th></tr></thead><tbody>'+
    rows.map((r,i)=>{const p=r[0].split('§');
      return '<tr class="'+(i===0?'hi':'')+'"><td><b>'+p[1]+'</b>'+bar(r[1].e,mx,i===0)+'</td>'+
      '<td>'+(p[0]?'<span class="code">'+p[0]+'</span>':'<span style="color:var(--muted)">—</span>')+'</td>'+
      '<td class="num">'+fN(r[1].q)+'</td><td class="num">'+fE(r[1].e)+'</td>'+
      '<td class="num" style="color:var(--muted)">'+Math.round(r[1].e/tot*100)+' %</td></tr>'}).join('')+
    '</tbody></table>'}
function tblPairs(rows,tot){if(!rows.length)return '<div class="empty" style="padding:18px">Bez detailu</div>';
  const top=rows.slice(0,15),mx=top[0][1].e;
  return '<table class="tbl"><thead><tr><th style="width:34px">#</th><th>Pracoviště</th><th>Příčina</th>'+
    '<th>Kód</th><th class="num">Kusů</th><th class="num">EUR</th><th class="num">% projektu</th></tr></thead><tbody>'+
    top.map((r,i)=>{const s=r[0].split('¶'),p=(s[1]||'').split('§');
      return '<tr class="'+(i<3?'hi':'')+'"><td><b style="color:'+(i<3?'#C0392B':'#7F8C8D')+'">'+(i+1)+'</b></td>'+
      '<td><b>'+locName(s[0])+'</b> <span class="code">'+s[0]+'</span></td>'+
      '<td>'+(p[1]||'—')+bar(r[1].e,mx,i===0)+'</td>'+
      '<td>'+(p[0]?'<span class="code">'+p[0]+'</span>':'—')+'</td>'+
      '<td class="num">'+fN(r[1].q)+'</td><td class="num">'+fE(r[1].e)+'</td>'+
      '<td class="num" style="color:var(--muted)">'+Math.round(r[1].e/tot*100)+' %</td></tr>'}).join('')+
    '</tbody></table>'}
function tblItems(rows){
  return '<table class="tbl"><thead><tr><th>Číslo dílu</th><th class="num">Kusů</th>'+
    '<th class="num">EUR</th><th class="num">EUR / kus</th></tr></thead><tbody>'+
    rows.slice(0,10).map(r=>'<tr><td><span class="code">'+r[0]+'</span></td>'+
      '<td class="num">'+fN(r[1].q)+'</td><td class="num">'+fE(r[1].e)+'</td>'+
      '<td class="num" style="color:var(--muted)">'+(r[1].q?fE(r[1].e/r[1].q):'—')+'</td></tr>').join('')+
    '</tbody></table>'}

function renderProj(){
  const box=document.getElementById('projBody');
  const mm=curMonth?+curMonth.slice(5,7):null;
  const dayDet=curMonth&&hasDetail(curMonth);
  const monDet=mm&&MDET[mm]&&Object.keys(MDET[mm]).length;
  if(!dayDet&&!monDet){
    const has=curMonth&&daysOf(curMonth).length;
    box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
      '<div style="font-size:42px;margin-bottom:10px">🔍</div>'+
      (has?'<b>Dny za '+MN[mm-1]+' jsou načtené, ale bez rozpadu na projekty.</b><br>'+
        'Pocházejí ze starší verze, která ukládala jen celkové součty.<br><br>'+
        '<span style="font-size:13px">Přetáhněte tyto reporty znovu v záložce <b>Data &amp; import</b>.</span>'
       :'<b>Pro '+(mm?MN[mm-1]:'tento měsíc')+' nemám žádná data.</b><br>'+
        'Ani denní reporty, ani měsíční QAD export.<br><br>'+
        '<span style="font-size:13px">Nahrajte denní report v záložce <b>Data &amp; import</b>.</span>')+
      '</div></div></div>';return}

  /* zdroj dat: denní rozpad, jinak měsíční QAD */
  const SRC=dayDet?'day':'month';
  const projs=SRC==='day'?projTotals(curMonth)
    :Object.entries(MDET[mm]).map(([p,v])=>[p,{e:v.wo,q:0}]).sort((a,b)=>b[1].e-a[1].e);
  if(!projs.length){box.innerHTML='<div class="panel"><div class="pb"><div class="empty">Žádná data.</div></div></div>';return}
  if(!curProj||!projs.some(p=>p[0]===curProj))curProj=projs[0][0];
  const tot=projs.reduce((a,x)=>a+x[1].e,0);
  const me=projs.find(p=>p[0]===curProj)[1];

  let L=[],R=[],P=[],I=[],ks=[],per=null;
  if(SRC==='day'){
    ks=daysOf(curMonth);
    L=projBreak(curMonth,curProj,'l');R=projBreak(curMonth,curProj,'r');
    P=projBreak(curMonth,curProj,'lr');I=projBreak(curMonth,curProj,'it');
    per=me.e/ks.length;
  }else{
    const D=MDET[mm][curProj]||{L:[],R:[],P:[]};
    L=(D.L||[]).map(x=>[x[0],{e:x[2],q:x[3]}]).filter(x=>x[1].e>0);
    R=mergeBy((D.R||[]).map(x=>[x[0]+'§'+x[1],{e:x[3],q:x[4]||0}]).filter(x=>x[1].e>0),rsnKey);
    P=mergeBy((D.P||[]).map(x=>[x[0]+'¶§'+x[1],{e:x[3],q:x[4]||0}]).filter(x=>x[1].e>0));
  }
  const wL=L[0],wR=R[0];
  const pt=mm?pTgt(mm,curProj):null,ps=mm?pSales(mm,curProj):null;
  const act=ps?me.e/ps*100:null;

  const srcNote=SRC==='day'
    ? 'Zdroj: denní reporty · '+ks.length+' dnů · průměr '+fE(per)+' / den'
    : 'Zdroj: měsíční QAD export'+(L.length?'':' · rozpad na pracoviště pro tenhle měsíc zatím nemám');

  box.innerHTML=
  '<div style="display:flex;gap:8px;flex-wrap:wrap">'+projs.map(p=>
    '<button class="chip b '+(p[0]===curProj?'on':'')+'" onclick="pickProj(\''+esc(p[0])+'\')">'+p[0]+'</button>').join('')+'</div>'+
  '<div class="grid4">'+
  '<div class="kpi b"><div class="kpi-l">'+curProj+' · '+MN[mm-1]+'</div><div class="kpi-v">'+fE(me.e)+'</div>'+
    '<div class="kpi-s">'+Math.round(me.e/tot*100)+' % scrapu závodu</div></div>'+
  '<div class="kpi '+(act&&pt&&pt[0]!=null&&act>pt[0]?'r':'g')+'"><div class="kpi-l">% ze Sales projektu</div>'+
    '<div class="kpi-v">'+(act!=null?act.toFixed(2)+' %':'—')+'</div>'+
    '<div class="kpi-s">'+(pt&&pt[0]!=null?'target '+pt[0].toFixed(2)+' %':'target neznámý')+'</div></div>'+
  '<div class="kpi r"><div class="kpi-l">Nejdražší pracoviště</div>'+
    '<div class="kpi-v" style="font-size:19px">'+(wL?locName(wL[0]):'—')+'</div>'+
    '<div class="kpi-s">'+(wL?fE(wL[1].e)+' · '+Math.round(wL[1].e/me.e*100)+' % projektu':'bez rozpadu')+'</div></div>'+
  '<div class="kpi r"><div class="kpi-l">Hlavní příčina</div>'+
    '<div class="kpi-v" style="font-size:19px">'+(wR?wR[0].split('§')[1]:'—')+'</div>'+
    '<div class="kpi-s">'+(wR?fE(wR[1].e)+' · '+fN(wR[1].q)+' ks':'bez rozpadu')+'</div></div></div>'+
  '<div style="font-size:12px;color:var(--muted);padding:2px">'+srcNote+'</div>'+
  (SRC==='day'?'<div class="panel"><div class="ph"><span>Denní vývoj — '+curProj+'</span></div>'+
    '<div class="pb"><div class="chw" style="height:190px"><canvas id="cProj"></canvas></div></div></div>':'')+
  '<div style="font-size:12px;color:var(--muted);padding:2px 2px 0"><b>% projektu</b> = podíl na scrapu '+
    curProj+' za '+MN[mm-1]+' ('+fE(me.e)+').</div>'+
  '<div class="two"><div class="panel"><div class="ph"><span>Pracoviště</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+tblLoc(L,me.e)+'</div></div>'+
    '<div class="panel"><div class="ph"><span>Příčiny (reason code)</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+tblRsn(R,me.e)+'</div></div></div>'+
  '<div class="panel"><div class="ph"><span>Top scrap — pracoviště × příčina</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+tblPairs(P,me.e)+'</div></div>'+
  (I.length?'<div class="panel"><div class="ph"><span>Nejdražší díly</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+tblItems(I)+'</div></div>':'');

  if(SRC==='day')mk('cProj',{type:'bar',data:{labels:ks.map(k=>k.slice(8)+'.'+k.slice(5,7)+'.'),
    datasets:[{data:projDaily(curMonth,curProj),backgroundColor:'#2E6DA4',borderRadius:5}]},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{display:false},
      tooltip:{callbacks:{label:c=>' '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>Math.round(v/1000)+'k',font:{size:10},color:'#7F8C8D'},
        grid:grd,border:{display:false},beginAtZero:true}}}})}
