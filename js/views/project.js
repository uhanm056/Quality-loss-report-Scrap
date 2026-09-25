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
/* Tabulka příčin. S denními daty je každý řádek proklik na denní vývoj té vady
   (`klik` = kurzor a hover, `sel` = zrovna vybraná). Bez denních dat se neklikat
   nedá — měsíční MDET drží jen součty za celý měsíc, žádné dny v něm nejsou. */
function tblRsn(rows,tot,klik){if(!rows.length)return '<div class="empty" style="padding:18px">Bez detailu</div>';
  const mx=rows[0][1].e;
  return '<table class="tbl"><thead><tr><th>Příčina</th><th>Kód</th><th class="num">Kusů</th>'+
    '<th class="num">EUR</th><th class="num">% projektu</th>'+(klik?'<th style="width:96px"></th>':'')+
    '</tr></thead><tbody>'+
    rows.map((r,i)=>{const p=r[0].split('§'),vyb=klik&&curRsn===r[0];
      return '<tr class="'+(vyb?'sel':(i===0?'hi':''))+(klik?' clik':'')+'"'+
      (klik?' onclick="pickRsn(\''+esc(r[0])+'\')" title="denní vývoj téhle vady"':'')+'>'+
      '<td><b>'+p[1]+'</b>'+bar(r[1].e,mx,i===0)+'</td>'+
      '<td>'+(p[0]?'<span class="code">'+p[0]+'</span>':'<span style="color:var(--muted)">—</span>')+'</td>'+
      '<td class="num">'+fN(r[1].q)+'</td><td class="num">'+fE(r[1].e)+'</td>'+
      '<td class="num" style="color:var(--muted)">'+Math.round(r[1].e/tot*100)+' %</td>'+
      (klik?'<td class="num"><span class="tag '+(vyb?'b':'n')+'" style="font-size:11px">'+
        (vyb?'✓ v grafu':'📈 den po dni')+'</span></td>':'')+
      '</tr>'}).join('')+
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

/* ── Denní vývoj vybrané vady ─────────────────────────────────────────
   Na co se TL ptá u konkrétní vady: kolik dnů se vůbec objevila, kdy byl
   nejhorší den a jestli to poslední dny roste. Trend klasifikuje `rsnTrend()`
   z js/core/defects.js — stejná pravidla jako v Trendu vad (poslední třetina
   období proti předchozí, ±25 %), jen tady jsou obdobím dny, ne měsíce. */
function rsnPanel(ks,ser,key,projEur){
  const nm=key.split('§')[1]||key.split('§')[0],kod=key.split('§')[0];
  const tot=ser.reduce((a,v)=>a+v.e,0),q=ser.reduce((a,v)=>a+v.q,0);
  const dny=ser.filter(v=>v.e!==0).length;
  let wi=-1;ser.forEach((v,i)=>{if(wi<0||v.e>ser[wi].e)wi=i});
  const tr=rsnTrend({m:Object.fromEntries(ks.map((k,i)=>[k,ser[i].e]))},ks.map(k=>({key:k})));
  const posl=(function(){for(let i=ser.length-1;i>=0;i--)if(ser[i].e!==0)return ks[i];return null})();
  return '<div class="grid4" style="margin-top:2px">'+
  '<div class="kpi r"><div class="kpi-l">'+escH(nm)+(kod?' · '+escH(kod):'')+'</div>'+
    '<div class="kpi-v">'+fE(tot)+'</div>'+
    '<div class="kpi-s">'+fN(q)+' ks · '+(projEur?Math.round(tot/projEur*100):0)+' % scrapu projektu</div></div>'+
  '<div class="kpi b"><div class="kpi-l">V kolika dnech</div>'+
    '<div class="kpi-v">'+dny+' z '+ks.length+'</div>'+
    '<div class="kpi-s">'+(posl?'naposledy '+denLabel(posl):'v tomhle měsíci vůbec')+'</div></div>'+
  '<div class="kpi r"><div class="kpi-l">Nejhorší den</div>'+
    '<div class="kpi-v" style="font-size:19px">'+(wi>=0&&ser[wi].e?fE(ser[wi].e):'—')+'</div>'+
    '<div class="kpi-s">'+(wi>=0&&ser[wi].e?denLabel(ks[wi])+' · '+fN(ser[wi].q)+' ks':'bez výskytu')+'</div></div>'+
  '<div class="kpi '+(tr.cls==='r'?'r':(tr.cls==='g'?'g':'b'))+'"><div class="kpi-l">Trend v měsíci</div>'+
    '<div class="kpi-v" style="font-size:22px">'+tr.lab+'</div>'+
    '<div class="kpi-s">'+(tr.pct!=null&&tr.a?'poslední dny '+fE(tr.b)+' proti '+fE(tr.a)+
      ' ('+(tr.pct>0?'+':'')+tr.pct.toFixed(0)+' %)':'na zařazení trendu je málo dnů')+'</div></div></div>'}

/* ── Dlaždice s trendem ───────────────────────────────────────────────
   Hlavní číslo je **vybraný měsíc proti předchozímu** — to je, co TL zajímá
   hned. Kvartál je pod tím jako druhý, klidnější horizont; měsíc sám o sobě
   skáče, kvartál ukáže, kam to jde.

   Obojí počítá js/core/month.js (`projMoM`, `projQuarter`) a obojí volí
   metriku stejně: **procento ze Sales**, když je aplikace zná u obou období,
   jinak EUR. Scrap po projektech je v `MDET` za každý měsíc, ale Sales po
   projektech (`PSAL`) ne vždy.

   **Probíhající měsíc je jen k dnešku**, takže v EUR vypadá vždycky jako
   velké zlepšení — proto se to u něj napíše. V procentech ze Sales to problém
   není: scrap i Sales jsou ke stejnému snímku. */
const mList=ms=>ms.map(m=>MO3[m-1].toLowerCase()).join('+');

/* změna jako text — v p.b., když ji známe v procentech ze Sales, jinak v % */
const trDelta=(pb,rel)=>pb!=null?fPB(pb)
  :(rel!=null?(rel>0?'+':'−')+Math.abs(rel).toFixed(0)+' %':'—');

function trendKpi(M,Q,mm){
  if(!M&&!Q)return '<div class="kpi b"><div class="kpi-l">Trend</div>'+
    '<div class="kpi-v" style="font-size:19px">—</div>'+
    '<div class="kpi-s">'+(mm===1?'leden nemá předchozí měsíc ani kvartál'
      :'předchozí období v datech nemám')+'</div></div>';
  /* barva podle měsíce, protože to je hlavní číslo dlaždice */
  const hor=M?(M.dPb!=null?M.dPb>0:M.dEur>0):(Q.dPb!=null?Q.dPb>0:Q.dPer>0);
  const hl=M?MO3[M.m-1]+' proti '+MO3[M.prev-1]:QLBL[Q.cur.q]+' proti '+QLBL[Q.prev.q];
  return '<div class="kpi '+(hor?'r':'g')+'"><div class="kpi-l">'+hl+'</div>'+
    '<div class="kpi-v">'+(M?trDelta(M.dPb,M.dRel):trDelta(Q.dPb,Q.pctPer))+'</div>'+
    (M?'<div class="kpi-s">'+(M.dPb!=null
        ? M.pct.toFixed(2)+' % ze Sales proti '+M.prevPct.toFixed(2)+' %'
        : fE(M.eur)+' proti '+fE(M.prevEur))+
      (M.part&&M.dPb==null?' · '+MN[M.m-1].toLowerCase()+' je jen k dnešku':'')+
      '</div>':'')+
    (Q?'<div class="kpi-s" style="margin-top:3px;opacity:.85">'+
      QLBL[Q.cur.q]+' proti '+QLBL[Q.prev.q]+' <b>'+trDelta(Q.dPb,Q.pctPer)+'</b>'+
      ' · '+mList(Q.cur.ms)+' proti '+mList(Q.prev.ms)+'</div>'
     :'<div class="kpi-s" style="margin-top:3px;opacity:.85">kvartál porovnat nejde — '+
      'předchozí je loňský</div>')+
    '</div>'}

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
  /* Vybraná vada se drží i po přepnutí měsíce — je užitečné vidět tu samou
     vadu v jiném měsíci, i kdyby tam vůbec nebyla (to je taky odpověď).
     Denní řada existuje jen u denních dat; měsíční MDET dny nemá. */
  const rsnSel=(SRC==='day'&&curRsn)?curRsn:null;
  const rsnSer=rsnSel?projRsnDays(curMonth,curProj,rsnSel):null;
  const rsnRow=rsnSel?R.find(r=>r[0]===rsnSel):null;

  const wL=L[0],wR=R[0];
  const pt=mm?pTgt(mm,curProj):null,ps=mm?pSales(mm,curProj):null;
  const act=ps?me.e/ps*100:null;
  const QT=mm?projQuarter(mm,curProj):null,MT=mm?projMoM(mm,curProj):null;

  const srcNote=SRC==='day'
    ? 'Zdroj: denní reporty · '+ks.length+' dnů · průměr '+fE(per)+' / den'
    : 'Zdroj: měsíční QAD export'+(L.length?'':' · rozpad na pracoviště pro tenhle měsíc zatím nemám');

  box.innerHTML=
  '<div style="display:flex;gap:8px;flex-wrap:wrap">'+projs.map(p=>
    '<button class="chip b '+(p[0]===curProj?'on':'')+'" onclick="pickProj(\''+esc(p[0])+'\')">'+p[0]+'</button>').join('')+'</div>'+
  '<div class="grid5">'+
  '<div class="kpi b"><div class="kpi-l">'+curProj+' · '+MN[mm-1]+'</div><div class="kpi-v">'+fE(me.e)+'</div>'+
    '<div class="kpi-s">'+Math.round(me.e/tot*100)+' % scrapu závodu</div></div>'+
  '<div class="kpi '+(act&&pt&&pt[0]!=null&&act>pt[0]?'r':'g')+'"><div class="kpi-l">% ze Sales projektu</div>'+
    '<div class="kpi-v">'+(act!=null?act.toFixed(2)+' %':'—')+'</div>'+
    '<div class="kpi-s">'+(pt&&pt[0]!=null?'target '+pt[0].toFixed(2)+' %'+
      /* přísnější cíl s CI taskem — u projektu ho taky nemá každý měsíc */
      (pt[1]!=null?' · s CI taskem '+pt[1].toFixed(2)+' %':''):'target neznámý')+'</div></div>'+
  '<div class="kpi r"><div class="kpi-l">Nejdražší pracoviště</div>'+
    '<div class="kpi-v" style="font-size:19px">'+(wL?locName(wL[0]):'—')+'</div>'+
    '<div class="kpi-s">'+(wL?fE(wL[1].e)+' · '+Math.round(wL[1].e/me.e*100)+' % projektu':'bez rozpadu')+'</div></div>'+
  '<div class="kpi r"><div class="kpi-l">Hlavní příčina</div>'+
    '<div class="kpi-v" style="font-size:19px">'+(wR?wR[0].split('§')[1]:'—')+'</div>'+
    '<div class="kpi-s">'+(wR?fE(wR[1].e)+' · '+fN(wR[1].q)+' ks':'bez rozpadu')+'</div></div>'+
  trendKpi(MT,QT,mm)+'</div>'+
  '<div style="font-size:12px;color:var(--muted);padding:2px">'+srcNote+'</div>'+
  (SRC==='day'?'<div class="panel"><div class="ph">'+
    '<span>Denní vývoj — '+curProj+
      (rsnSel?' <span style="font-weight:600;opacity:.85">· '+escH(rsnSel.split('§')[1]||rsnSel)+'</span>':'')+
    '</span>'+
    (rsnSel?'<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+
      '<div class="legend" style="color:rgba(255,255,255,.85)">'+
      '<span><span class="sw" style="background:#9CC5E8"></span>celý projekt</span>'+
      '<span><span class="sw" style="background:#C0392B"></span>'+
        escH(rsnSel.split('§')[1]||rsnSel)+'</span></div>'+
      '<button class="btn" onclick="pickRsn(null)">✕ zrušit vadu</button></div>'
     :'<span style="font-weight:600;opacity:.85">klikni na vadu v tabulce Příčiny →</span>')+
    '</div>'+
    '<div class="pb"><div class="chw" style="height:190px"><canvas id="cProj"></canvas></div>'+
    (rsnSel&&!rsnRow?'<div class="warnbox" style="margin:12px 0 0"><span style="font-size:26px">🔍</span>'+
      '<div><b>'+escH(rsnSel.split('§')[1]||rsnSel)+'</b> se u '+curProj+' v '+MN[mm-1]+
      ' vůbec nevyskytla.</div></div>':'')+
    '</div></div>'+
    (rsnSer?rsnPanel(ks,rsnSer,rsnSel,me.e):''):'')+
  '<div style="font-size:12px;color:var(--muted);padding:2px 2px 0"><b>% projektu</b> = podíl na scrapu '+
    curProj+' za '+MN[mm-1]+' ('+fE(me.e)+').</div>'+
  '<div class="two"><div class="panel"><div class="ph"><span>Pracoviště</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+tblLoc(L,me.e)+'</div></div>'+
    '<div class="panel"><div class="ph"><span>Příčiny (reason code)</span>'+
    (SRC==='day'?'<span style="font-weight:600;opacity:.85">klikni na vadu → denní vývoj</span>':'')+
    '</div>'+
    '<div class="pb" style="overflow-x:auto">'+tblRsn(R,me.e,SRC==='day')+
    (SRC==='day'?'':'<div style="font-size:12px;color:var(--muted);margin-top:9px">'+
      'Denní vývoj jednotlivé vady jde ukázat jen z denních reportů — '+
      'měsíční QAD export drží za celý měsíc jen součty.</div>')+
    '</div></div></div>'+
  '<div class="panel"><div class="ph"><span>Top scrap — pracoviště × příčina</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+tblPairs(P,me.e)+'</div></div>'+
  (I.length?'<div class="panel"><div class="ph"><span>Nejdražší díly</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+tblItems(I)+'</div></div>':'');

  if(SRC==='day'){
    /* Při vybrané vadě jdou sloupce projektu do světlé modré a vada se kreslí
       přes ně čárou — jde o to vidět, jakou část dne ta vada udělala. */
    const ds=[{type:'bar',label:curProj,data:projDaily(curMonth,curProj),
      backgroundColor:rsnSel?'#9CC5E8':'#2E6DA4',borderRadius:5,order:3}];
    if(rsnSer)ds.push({type:'line',label:rsnSel.split('§')[1]||rsnSel,
      data:rsnSer.map(v=>v.e),borderColor:'#C0392B',backgroundColor:'rgba(192,57,43,.10)',
      fill:true,borderWidth:2,pointRadius:3,pointBackgroundColor:'#C0392B',tension:.25,order:1});
    mk('cProj',{data:{labels:ks.map(k=>k.slice(8)+'.'+k.slice(5,7)+'.'),datasets:ds},
     options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},datalabels:{display:false},
        tooltip:{mode:'index',intersect:false,
          callbacks:{title:c=>denLabel(ks[c[0].dataIndex]),
            label:c=>' '+c.dataset.label+': '+fE(c.raw)}}},
      scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
        /* u projektu bývají denní částky ve stovkách — pevné dělení tisíci
           dělalo z celé osy samé „0k" */
        y:{ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),
          font:{size:10},color:'#7F8C8D'},
          grid:grd,border:{display:false},beginAtZero:true}}}})}}

/* výběr vady je přepínač — druhý klik na tutéž ji zase zruší */
window.pickRsn=k=>{curRsn=(k&&curRsn!==k)?k:null;renderProj()};
