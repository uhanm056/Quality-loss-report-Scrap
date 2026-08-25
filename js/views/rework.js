/* Záložka 5: rework — přehled z nahraných reportů
   Rework se sleduje vedle scrapu, do QLR % se nezapočítává.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const fH=v=>(Math.round((v||0)*10)/10).toLocaleString('cs-CZ')+' h';

/* tabulka rozpadu; typ: loc | rsn | item */
function rwTbl(rows,tot,type){
  if(!rows.length)return '<div class="empty" style="padding:18px">Bez detailu</div>';
  const mx=rows[0][1].e;
  const c1=type==='loc'?'Pracoviště':(type==='rsn'?'Příčina':'Díl'),kod=type!=='item';
  return '<table class="tbl"><thead><tr><th>'+c1+'</th>'+(kod?'<th></th>':'')+
    '<th class="num">Hodin</th><th class="num">EUR</th><th class="num">% z reworku</th></tr></thead><tbody>'+
    rows.slice(0,12).map((r,i)=>{const v=r[1];
      let nm,code='';
      if(type==='loc'){nm=locName(r[0]);code=r[0]}
      else if(type==='rsn'){const p=r[0].split('§');code=p[0];nm=p[1]||'—'}
      else nm=r[0];
      return '<tr class="'+(i===0?'hi':'')+'"><td><b>'+nm+'</b>'+
        '<div class="minib"><div class="minif '+(i===0?'top':'')+'" style="width:'+
        Math.round(v.e/mx*100)+'%"></div></div></td>'+
        (kod?'<td>'+(code?'<span class="code">'+code+'</span>':'')+'</td>':'')+
        '<td class="num" style="color:var(--muted)">'+fH(v.h)+'</td>'+
        '<td class="num">'+fE(v.e)+'</td>'+
        '<td class="num" style="color:var(--muted)">'+Math.round(v.e/tot*100)+' %</td></tr>'}).join('')+
    '</tbody></table>'}

function renderRework(){
  const box=document.getElementById('rwBody'),bar3=document.getElementById('hb3');
  const ms=rwMonths();
  if(!curRwMonth||!ms.includes(curRwMonth))curRwMonth=ms.length?ms[ms.length-1]:null;
  const m=curRwMonth;
  renderRwDays();
  if(!m||!rwDays(m).length){
    bar3.style.display='none';
    box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
      '<div style="font-size:44px;margin-bottom:10px">🔧</div>'+
      '<b>Zatím žádná data o reworku.</b><br>Přetáhněte report níž — čte se stejně jako scrap, '+
      'sloupce se hledají podle názvu.<br><span style="font-size:13px">Potřebuje datum a k tomu '+
      'hodiny nebo EUR. Rozpad podle projektů, pracovišť a příčin se doplní, pokud je v souboru.</span>'+
      '</div></div></div>';return}
  const ks=rwDays(m),n=ks.length,tot=rwEur(m),hrs=rwHrs(m),qty=rwQty(m);
  const per=tot/n,wd=SET.workdays||21,fc=per*wd,tgt=+SET.rwTarget||0;
  const yy=m.slice(0,4),mm=+m.slice(5,7),mLab=MN[mm-1]+' '+yy;
  const dw=n===1?'den':(n<5?'dny':'dnů');
  const scrap=daysOf(m).length?sumM(m):0;
  bar3.style.display='';
  bar3.textContent='Rework '+MO3[mm-1]+' '+yy.slice(2)+': '+fE(tot)+' · '+fH(hrs);

  /* stav proti cíli — jen když je cíl zadaný, jinak se nic nevymýšlí */
  let head='';
  if(tgt){const allow=tgt/wd*n;let cls,ic,hd,tx;
    if(fc>tgt*1.02){cls='bad';ic='⛔';hd='Rework míří nad cíl';
      tx='Tempem '+fE(per)+' za den skončíme na <b>'+fE(fc)+'</b> — o '+fE(fc-tgt)+' nad cílem.'}
    else if(fc>tgt*.92){cls='warn';ic='⚠️';hd='Cíl reworku je na hraně';
      tx='Prognóza konce měsíce <b>'+fE(fc)+'</b> proti cíli '+fE(tgt)+'. Rezerva je malá.'}
    else{cls='ok';ic='✅';hd='Rework drží tempo';
      tx='Tempem '+fE(per)+' za den skončíme kolem <b>'+fE(fc)+'</b>, tedy '+fE(tgt-fc)+' pod cílem.'}
    tx+=' Zatím '+n+' '+dw+' z '+wd+'. K dnešku povoleno '+fE(allow)+'.';
    head='<div class="status '+cls+'"><div class="st-i">'+ic+'</div>'+
      '<div class="st-t"><h2>'+hd+'</h2><p>'+tx+'</p></div>'+
      '<div class="st-n"><div class="big">'+fE(tot)+'</div>'+
      '<div class="l">'+mLab+' · kumulativně</div></div></div>'}
  else head='<div class="warnbox"><span style="font-size:26px">🎯</span><div>'+
    '<b>Cíl reworku není nastavený.</b> Zadejte měsíční cíl v EUR v záložce '+
    '<b>Nastavení</b> a doplní se tempo, prognóza a porovnání s cílem.</div></div>';

  const calcWarn=rwCalc(m)?'<div class="warnbox"><span style="font-size:26px">🧮</span><div>'+
    '<b>EUR jsou dopočítané ze sazby '+fE(SET.rwRate)+' / hod.</b> '+
    'Nahraný report neměl sloupec s částkou, jen hodiny. Sazbu upravíte v Nastavení.</div></div>':'';

  box.innerHTML=calcWarn+head+
  '<div class="grid4">'+
  '<div class="kpi '+(tgt?(tot>tgt?'r':'g'):'b')+'"><div class="kpi-l">Rework EUR — '+mLab+'</div>'+
    '<div class="kpi-v">'+fE(tot)+'</div><div class="kpi-s">'+n+' '+dw+' · průměr '+fE(per)+' / den</div></div>'+
  '<div class="kpi a"><div class="kpi-l">Hodiny reworku</div><div class="kpi-v">'+fH(hrs)+'</div>'+
    '<div class="kpi-s">'+fH(hrs/n)+' na den'+(hrs?' · '+fE(tot/hrs)+' / hod':'')+'</div></div>'+
  '<div class="kpi b"><div class="kpi-l">Opravených kusů</div><div class="kpi-v">'+fN(qty)+'</div>'+
    '<div class="kpi-s">'+(qty?fE(tot/qty)+' na kus':'počet kusů report neuvádí')+'</div></div>'+
  '<div class="kpi '+(tgt?(fc>tgt?'r':'g'):'b')+'"><div class="kpi-l">Prognóza konce měsíce</div>'+
    '<div class="kpi-v">'+fk(fc)+'</div><div class="kpi-s">'+
    (tgt?'cíl '+fk(tgt):'bez cíle · '+fH(hrs/n*wd)+' za měsíc')+'</div></div></div>'+
  '<div class="panel"><div class="ph"><span>Denní vývoj reworku — '+mLab+'</span>'+
    '<div class="legend" style="color:rgba(255,255,255,.85)">'+
    '<span><span class="sw" style="background:#9CC5E8"></span>EUR</span>'+
    '<span><span class="dsh" style="background:#E8A020"></span>hodiny</span></div></div>'+
    '<div class="pb"><div class="chw" style="height:250px"><canvas id="cRw"></canvas></div>'+
    (scrap?'<div style="font-size:12px;color:var(--muted);margin-top:10px">Scrap za '+mLab+
      ' je '+fE(scrap)+' — rework je proti němu <b>'+Math.round(tot/scrap*100)+' %</b>. '+
      'Do QLR % se rework nezapočítává, sleduje se vedle scrapu.</div>':
      '<div style="font-size:12px;color:var(--muted);margin-top:10px">'+
      'Za '+mLab+' nejsou nahraná denní data o scrapu, takže rework není s čím porovnat.</div>')+
    '</div></div>'+
  '<div class="panel"><div class="ph"><span>Projekty — '+mLab+'</span></div>'+
    '<div class="pb"><div style="display:flex;flex-direction:column;gap:9px" id="rwProj"></div></div></div>'+
  '<div class="two">'+
    '<div class="panel"><div class="ph"><span>Pracoviště</span></div>'+
      '<div class="pb" style="overflow-x:auto" id="rwLoc"></div></div>'+
    '<div class="panel"><div class="ph"><span>Příčiny</span></div>'+
      '<div class="pb" style="overflow-x:auto" id="rwRsn"></div></div></div>'+
  '<div class="panel"><div class="ph"><span>Nejdražší díly</span></div>'+
    '<div class="pb" style="overflow-x:auto" id="rwItem"></div></div>';

  mk('cRw',{data:{labels:ks.map(k=>k.slice(8)+'.'+k.slice(5,7)+'.'),datasets:[
    {type:'bar',label:'EUR',data:ks.map(k=>RW[k].eur),backgroundColor:'#9CC5E8',
     borderRadius:5,maxBarThickness:60,yAxisID:'y',order:2},
    {type:'line',label:'Hodiny',data:ks.map(k=>RW[k].hrs||0),borderColor:'#E8A020',
     backgroundColor:'rgba(232,160,32,.10)',fill:true,borderWidth:3,pointRadius:3,
     tension:.25,yAxisID:'y1',order:1}]},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{display:false},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>' '+c.dataset.label+': '+
        (c.datasetIndex===0?fE(c.raw):fH(c.raw))}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),font:{size:10},color:'#7F8C8D'},
        grid:grd,border:{display:false}},
      y1:{position:'right',ticks:{callback:v=>Math.round(v)+' h',font:{size:10},color:'#E8A020'},
        grid:{display:false},border:{display:false}}}}});

  const ps=rwProjects(m),el=document.getElementById('rwProj');
  if(!ps.length)el.innerHTML='<div class="empty" style="padding:20px">Bez rozpadu na projekty.</div>';
  else{const max=ps[0][1].e;
    el.innerHTML=ps.map(function(p,i){const nm=p[0],v=p[1];
      return '<div class="prow rw '+(i===0?'hot':'')+'" style="cursor:default">'+
      '<div class="prank '+(i===0?'top':'')+'">'+(i+1)+'</div><span class="n">'+nm+'</span>'+
      '<div class="bb"><div class="bf" style="width:'+Math.round(v.e/max*100)+'%;background:'+
        (i===0?'#E8A020':'#2E6DA4')+'"></div></div>'+
      '<span class="v">'+fE(v.e)+'</span>'+
      '<span class="pc">'+Math.round(v.e/tot*100)+' %'+(v.h?' · '+fH(v.h):'')+
        (v.q?' · '+fN(v.q)+' ks':'')+'</span><span class="ar"></span></div>'}).join('')}
  document.getElementById('rwLoc').innerHTML=rwTbl(rwBreak(m,'l'),tot,'loc');
  document.getElementById('rwRsn').innerHTML=rwTbl(rwBreak(m,'r'),tot,'rsn');
  document.getElementById('rwItem').innerHTML=rwTbl(rwBreak(m,'it'),tot,'item')}

function renderRwDays(){
  const ks=Object.keys(RW).sort().reverse(),b=document.getElementById('rwDays');
  if(!ks.length){b.innerHTML='<div class="empty">Zatím nejsou načtené žádné reporty o reworku.</div>';return}
  b.innerHTML='<table class="tbl"><thead><tr><th>Datum</th><th>Soubor</th><th class="num">EUR</th>'+
    '<th class="num">Hodin</th><th class="num">Kusů</th><th class="num">Projektů</th><th></th></tr></thead><tbody>'+
    ks.map(k=>{const d=RW[k];
      return '<tr><td><b>'+k.split('-').reverse().join('.')+'</b></td>'+
      '<td style="color:var(--muted);font-size:12px">'+(d.src||'—')+(d.calc?' <span class="tag n">EUR ze sazby</span>':'')+'</td>'+
      '<td class="num">'+fE(d.eur)+'</td><td class="num">'+fH(d.hrs)+'</td>'+
      '<td class="num">'+fN(d.qty)+'</td>'+
      '<td class="num">'+Object.keys(d.p||{}).length+'</td>'+
      '<td style="text-align:right"><button class="btn dngr" onclick="delRwDay(\''+k+'\')">smazat</button></td></tr>'}).join('')+
    '</tbody></table>'}

window.setRwM=m=>{curRwMonth=m;renderBar();renderRework()};
window.delRwDay=k=>{if(!confirm('Smazat rework za '+k.split('-').reverse().join('.')+'?'))return;
  delete RW[k];saveR();renderBar();renderRework();toast('Den smazán.','#7F8C8D')};
window.wipeRw=()=>{if(!confirm('Opravdu vymazat všechna data o reworku? Tohle nejde vrátit.'))return;
  RW={};saveR();curRwMonth=null;renderBar();renderRework();toast('Rework vymazán.','#7F8C8D')};
