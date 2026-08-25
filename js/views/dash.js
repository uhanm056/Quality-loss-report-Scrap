/* Záložka 1: přehled scrapu — měsíční výsledek proti targetu, tempo a prognóza
   Cíl v EUR vychází z tabulky „Měsíční targety a Sales" v Nastavení.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const fPB=v=>(v>0?'+':'−')+Math.abs(v).toFixed(2)+' p.b.';

/* měsíční výsledek — cíl, skutečnost, rezerva, trend, odhad celého měsíce */
function dashMonth(R){
  const over=R.pb!=null&&R.pb>0;
  const near=R.pb!=null&&!over&&R.pb>-0.05;
  let cls,ic,hd,tx;
  if(R.pct==null||R.target==null){cls='warn';ic='📋';hd='Chybí target nebo Sales';
    tx='Pro '+R.label+' není v Nastavení zadaný target v % nebo Sales za měsíc. '+
      'Doplňte je a dopočítá se cíl v EUR i porovnání.'}
  else if(over){cls='bad';ic='⛔';hd='Jsme nad cílem';
    tx='Skutečnost <b>'+R.pct.toFixed(3)+' %</b> ze Sales proti cíli <b>'+R.target.toFixed(2)+' %</b> — '+
      '<b>'+R.pb.toFixed(2)+' p.b. nad</b>. Do cíle chybí ušetřit <b>'+fE(-R.rez)+'</b>.'}
  else if(near){cls='warn';ic='⚠️';hd='Cíl je na hraně';
    tx='Skutečnost <b>'+R.pct.toFixed(3)+' %</b> proti cíli <b>'+R.target.toFixed(2)+' %</b> — '+
      'rezerva už je jen <b>'+fE(R.rez)+'</b>.'}
  else{cls='ok';ic='✅';hd=R.partial?'Držíme tempo':'Skončili jsme pod cílem';
    tx='Skutečnost <b>'+R.pct.toFixed(3)+' %</b> ze Sales proti cíli <b>'+R.target.toFixed(2)+' %</b> — '+
      '<b>'+Math.abs(R.pb).toFixed(2)+' p.b. pod</b>. Rezerva <b>'+fE(R.rez)+'</b>.'}
  if(R.partial&&R.pct!=null)tx+=' Měsíc probíhá — scrap i Sales jsou ke stejnému snímku dat.';

  /* trend proti předchozímu měsíci */
  let trend='—',tsub='předchozí měsíc neznám',tcls='b';
  if(R.prevPct!=null&&R.pct!=null){const d=R.pct-R.prevPct;
    trend=fPB(d);tcls=d>0?'r':'g';
    tsub=R.prevLabel+' '+R.prevPct.toFixed(3)+' % → '+R.pct.toFixed(3)+' %'}

  /* odhad celého měsíce — jen u probíhajícího měsíce a s výslovným předpokladem */
  let est='';
  if(R.partial&&R.pct!=null&&R.prevKey&&TGTM[R.prevKey].sales){
    const ps=TGTM[R.prevKey].sales,fEur=R.pct/100*ps,fCil=R.target/100*ps;
    est='<div class="panel"><div class="ph"><span>Odhad celého měsíce</span>'+
      '<span style="font-weight:600;opacity:.85">předpoklad: Sales jako '+R.prevLabel+
      ' ('+fE(ps)+')</span></div><div class="pb" style="font-size:14px;line-height:1.8">'+
      'Kdyby srpnové tempo <b>'+R.pct.toFixed(3)+' %</b> vydrželo do konce měsíce a Sales '+
      'dosáhly úrovně '+R.prevLabel+', skončil by '+R.label+' zhruba na <b>'+fE(fEur)+'</b> '+
      'proti cíli <b>'+fE(fCil)+'</b> — rezerva kolem <b>'+fE(fCil-fEur)+'</b>.'+
      '<div style="font-size:12px;color:var(--muted);margin-top:10px">'+
      'Tohle je jediné číslo na stránce, které je odhad. Skutečné Sales za '+R.label+
      ' zatím neznáme — jakmile je doplníte v Nastavení, cíl v EUR i rezerva se přepočítají samy.'+
      '</div></div></div>'}

  return '<div class="status '+cls+'"><div class="st-i">'+ic+'</div>'+
    '<div class="st-t"><h2>'+hd+' — '+R.label+'</h2><p>'+tx+'</p></div>'+
    (R.eur!=null?'<div class="st-n"><div class="big">'+fE(R.eur)+'</div>'+
      '<div class="l">scrap w/o tests</div></div>':'')+'</div>'+
  '<div class="grid4">'+
    '<div class="kpi b"><div class="kpi-l">Cíl v EUR — '+R.label+'</div>'+
      '<div class="kpi-v">'+(R.cil!=null?fE(R.cil):'—')+'</div>'+
      '<div class="kpi-s">'+(R.cil!=null?R.target.toFixed(2)+' % ze Sales '+fE(R.sales):
        'chybí target nebo Sales')+'</div></div>'+
    '<div class="kpi a"><div class="kpi-l">Skutečnost</div>'+
      '<div class="kpi-v">'+(R.eur!=null?fE(R.eur):'—')+'</div>'+
      '<div class="kpi-s">'+(R.pct!=null?R.pct.toFixed(3)+' % ze Sales · ':'')+
      'zdroj: '+(R.src||'—')+'</div></div>'+
    '<div class="kpi '+(R.rez==null?'b':(R.rez<0?'r':'g'))+'">'+
      '<div class="kpi-l">'+(R.rez!=null&&R.rez<0?'Chybí do cíle':'Rezerva do cíle')+'</div>'+
      '<div class="kpi-v">'+(R.rez!=null?fE(Math.abs(R.rez)):'—')+'</div>'+
      '<div class="kpi-s">'+(R.rez!=null?(R.rez<0?'o tolik jsme nad cílem':
        'tolik ještě zbývá do cíle'):'—')+'</div></div>'+
    '<div class="kpi '+tcls+'"><div class="kpi-l">Trend proti minulému měsíci</div>'+
      '<div class="kpi-v">'+trend+'</div><div class="kpi-s">'+tsub+'</div></div></div>'+est}

/* kumulativ roku — kolik chybí nebo zbývá do součtu měsíčních cílů */
function dashYear(curKey){
  const Y=yearSum();if(!Y.rows.length)return '';
  return '<div class="panel"><div class="ph"><span>Kumulativ 2026 — cíl vs skutečnost</span>'+
    '<span style="font-weight:600;opacity:.85">cíl v EUR = target % × Sales</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+
    '<table class="tbl"><thead><tr><th>Měsíc</th><th class="num">Target %</th>'+
    '<th class="num">Skutečnost %</th><th class="num">Cíl EUR</th>'+
    '<th class="num">Skutečnost EUR</th><th class="num">Rezerva</th></tr></thead><tbody>'+
    Y.rows.map(r=>'<tr class="'+(r.key===curKey?'hi':'')+'">'+
      '<td><b>'+r.label+'</b>'+(r.partial?' <span class="tag n">probíhá</span>':'')+'</td>'+
      '<td class="num" style="color:var(--muted)">'+r.target.toFixed(2)+' %</td>'+
      '<td class="num"><b>'+r.pct.toFixed(3)+' %</b></td>'+
      '<td class="num" style="color:var(--muted)">'+fE(r.cil)+'</td>'+
      '<td class="num">'+fE(r.eur)+'</td>'+
      '<td class="num"><span class="tag '+(r.rez<0?'r':'g')+'">'+(r.rez<0?'▲ ':'▼ ')+
        fE(Math.abs(r.rez))+'</span></td></tr>').join('')+
    '<tr style="border-top:2px solid var(--border)"><td><b>Celkem</b></td>'+
      '<td class="num" style="color:var(--muted)">'+Y.tgt.toFixed(3)+' %</td>'+
      '<td class="num"><b>'+Y.pct.toFixed(3)+' %</b></td>'+
      '<td class="num" style="color:var(--muted)"><b>'+fE(Y.cil)+'</b></td>'+
      '<td class="num"><b>'+fE(Y.eur)+'</b></td>'+
      '<td class="num"><span class="tag '+(Y.rez<0?'r':'g')+'"><b>'+(Y.rez<0?'▲ ':'▼ ')+
        fE(Math.abs(Y.rez))+'</b></span></td></tr>'+
    '</tbody></table>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:12px;line-height:1.7">'+
    (Y.rez>=0?'Proti součtu měsíčních cílů jsme <b>'+fE(Y.rez)+'</b> pod. ':
      'Proti součtu měsíčních cílů nám chybí <b>'+fE(-Y.rez)+'</b>. ')+
    'Rezerva je rozdíl cíle a skutečnosti — saving ve scrap reportu se může o pár set EUR lišit, '+
    'protože ho počítá až po uzávěrce.</div></div></div>'}

/* denní tempo — jen z nahraných denních reportů */
function dashDaily(m,R){
  const ks=daysOf(m);
  if(!ks.length)return '<div class="panel"><div class="ph"><span>Denní tempo</span></div>'+
    '<div class="pb"><div class="empty" style="padding:26px">'+
    '<b>Pro '+R.label+' nejsou nahrané denní reporty.</b><br>'+
    'Měsíční výsledek nahoře je z jiného zdroje ('+(R.src||'měsíční data')+'). Denní tempo, průběh po dnech '+
    'a rozpad na projekty se doplní, jakmile nahrajete denní reporty v záložce '+
    '<b>Data &amp; import</b>.</div></div></div>';
  const n=ks.length,tot=sumM(m),qty=qtyM(m),per=tot/n;
  const wd=SET.workdays||21,fc=per*wd;
  const cil=R.cil,allow=cil!=null?cil/wd*n:null;
  const last=DB[ks[n-1]],prev=n>1?DB[ks[n-2]]:null,dL=prev?last.eur-prev.eur:0;
  const dw=n===1?'den':(n<5?'dny':'dnů');
  const nd=daysNoDetail(m);
  const warn=nd.length?'<div class="warnbox"><span style="font-size:26px">⚠️</span><div><b>'+
    nd.length+' '+(nd.length===1?'den nemá':'dnů nemá')+' uložený detail.</b> Byly načtené starší verzí. '+
    'Přetáhněte je znovu v záložce Data — rozpad na pracoviště a příčiny se doplní.<br>'+
    '<span style="font-size:12px;opacity:.85">'+nd.map(k=>k.split('-').reverse().join('.')).join(', ')+
    '</span></div></div>':'';
  return warn+
  '<div class="grid4">'+
  '<div class="kpi '+(cil!=null&&last.eur>cil/wd?'r':'g')+'"><div class="kpi-l">Poslední den · '+
    ks[n-1].split('-').reverse().join('.')+'</div><div class="kpi-v">'+fE(last.eur)+'</div>'+
    '<div class="kpi-s">'+(prev?'<span class="tag '+(dL>0?'r':'g')+'">'+(dL>0?'▲':'▼')+' '+fE(Math.abs(dL))+
    '</span> proti předchozímu':'první den')+'</div></div>'+
  '<div class="kpi '+(allow!=null&&tot>allow?'r':'g')+'"><div class="kpi-l">Kumulace vs povolené tempo</div>'+
    '<div class="kpi-v">'+(allow!=null?(tot>allow?'+':'')+fE(tot-allow):fE(tot))+'</div>'+
    '<div class="kpi-s">'+(allow!=null?'povoleno k dnešku '+fE(allow):'bez cíle v EUR')+'</div></div>'+
  '<div class="kpi b"><div class="kpi-l">Průměr na den</div><div class="kpi-v">'+fE(per)+'</div>'+
    '<div class="kpi-s">'+(cil!=null?'denní limit '+fE(cil/wd):n+' '+dw+' · '+fN(qty)+' ks')+'</div></div>'+
  '<div class="kpi '+(cil!=null&&fc>cil?'r':'b')+'"><div class="kpi-l">Prognóza z denního tempa</div>'+
    '<div class="kpi-v">'+fk(fc)+'</div><div class="kpi-s">'+n+' '+dw+' z '+wd+
    (cil!=null&&!R.partial?' · cíl '+fk(cil):'')+'</div></div></div>'+
  (R.partial&&cil!=null?'<div class="warnbox"><span style="font-size:26px">📐</span><div>'+
    '<b>Prognózu z denního tempa neporovnávám s cílem v EUR.</b> Cíl '+fE(cil)+
    ' platí ke Sales '+fE(R.sales)+', což je snímek k probíhajícímu měsíci — '+
    'prognóza je za celý měsíc. Držte se porovnání v % ze Sales nahoře.</div></div>':'')+
  '<div class="panel"><div class="ph"><span>Denní vývoj a kumulace k cíli</span>'+
    '<div class="legend" style="color:rgba(255,255,255,.85)">'+
    '<span><span class="sw" style="background:#5DADE2"></span>den</span>'+
    '<span><span class="dsh" style="background:#E8A020"></span>kumulace</span>'+
    (cil!=null?'<span><span class="dsh" style="background:#C0392B"></span>povolené tempo</span>':'')+
    '</div></div>'+
    '<div class="pb"><div class="chw" style="height:250px"><canvas id="cDay"></canvas></div></div></div>'+
  '<div class="panel"><div class="ph"><span>Projekty — '+R.label+'</span>'+
    '<span style="font-weight:600;opacity:.85">klikni na projekt pro detailní rozpad →</span></div>'+
    '<div class="pb"><div style="display:flex;flex-direction:column;gap:9px" id="lProj"></div></div></div>'}

function renderDash(){
  const box=document.getElementById('dashBody'),m=curMonth;
  if(!m){
    box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
      '<div style="font-size:44px;margin-bottom:10px">📊</div>'+
      '<b>Zatím není co ukázat.</b><br>Nahrajte denní report v záložce '+
      '<b>Data &amp; import</b> nebo zadejte target a Sales v <b>Nastavení</b>.'+
      '</div></div></div>';return}
  const R=monthResult(m);
  if(!R){box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
    '<b>Pro '+mLabel(m)+' nemám ani target, ani scrap.</b><br>'+
    'Doplňte měsíc v <b>Nastavení</b> nebo nahrajte denní report.</div></div></div>';return}
  box.innerHTML=dashMonth(R)+dashYear(m)+dashDaily(m,R);

  const ks=daysOf(m);if(!ks.length)return;
  const wd=SET.workdays||21,cil=R.cil;
  let run=0;const cum=ks.map(k=>run+=DB[k].eur);
  const ds=[
    {type:'bar',label:'Den',data:ks.map(k=>DB[k].eur),
     backgroundColor:ks.map(k=>cil!=null&&DB[k].eur>cil/wd?'#E59A94':'#9CC5E8'),
     borderRadius:5,maxBarThickness:60,yAxisID:'y',order:3},
    {type:'line',label:'Kumulace',data:cum,borderColor:'#E8A020',backgroundColor:'rgba(232,160,32,.10)',
     fill:true,borderWidth:3,pointRadius:3,tension:.25,yAxisID:'y1',order:1}];
  if(cil!=null)ds.push({type:'line',label:'Povolené tempo',data:ks.map((_,i)=>cil/wd*(i+1)),
    borderColor:'#C0392B',borderWidth:2,borderDash:[6,4],pointRadius:0,yAxisID:'y1',order:2});
  mk('cDay',{data:{labels:ks.map(k=>k.slice(8)+'.'+k.slice(5,7)+'.'),datasets:ds},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{display:false},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>' '+c.dataset.label+': '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),font:{size:10},color:'#7F8C8D'},
        grid:grd,border:{display:false}},
      y1:{position:'right',ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),
        font:{size:10},color:'#E8A020'},grid:{display:false},border:{display:false}}}}});

  const projs=projTotals(m),el=document.getElementById('lProj');if(!el)return;
  if(!projs.length){el.innerHTML='<div class="empty" style="padding:20px">Bez rozpadu na projekty.</div>';return}
  const det=hasDetail(m),max=projs[0][1].e,tot=sumM(m);
  el.innerHTML=projs.map(function(p,i){const nm=p[0],v=p[1];
    return '<div class="prow '+(i===0?'hot':'')+'"'+(det?' onclick="openProj(\''+esc(nm)+'\')"':' style="cursor:default"')+'>'+
    '<div class="prank '+(i===0?'top':'')+'">'+(i+1)+'</div><span class="n">'+nm+'</span>'+
    '<div class="bb"><div class="bf" style="width:'+Math.round(v.e/max*100)+'%;background:'+
      (i===0?'#C0392B':'#2E6DA4')+'"></div></div>'+
    '<span class="v">'+fE(v.e)+'</span>'+
    '<span class="pc">'+Math.round(v.e/tot*100)+' %'+(v.q?' · '+fN(v.q)+' ks':'')+'</span>'+
    '<span class="ar">'+(det?'›':'')+'</span></div>'}).join('')}
