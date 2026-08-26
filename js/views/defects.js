/* Záložka 4: trend vad — Pareto a vývoj po měsících nebo týdnech
   pro problem solving
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const RSNBARV=['#C0392B','#2E6DA4','#E8A020','#27AE60','#8E44AD','#16A085'];

/* přepínač granularity — měsíce z QAD exportu, týdny z denních reportů */
function granToggle(){
  return '<div class="seg">'+
    [['m','Měsíce'],['w','Týdny']].map(x=>'<button class="sbtn '+(dGran===x[0]?'on':'')+
      '" onclick="setDGran(\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</div>'}

/* mini sloupečky období po období přímo v řádku tabulky */
function rsnSpark(x,per,mx){
  const w=per.length>14?5:9;
  return '<div style="display:flex;gap:2px;align-items:flex-end;height:26px">'+
    per.map(q=>{const v=x[q.key]||0,h=mx?Math.max(2,Math.round(v/mx*26)):2;
      return '<div title="'+q.label+' ('+q.sub+')'+(q.part?' — nedokončené':'')+': '+fE(v)+
        '" style="width:'+w+'px;height:'+h+'px;border-radius:2px;background:'+
        (v?(q.part?'#9CC5E8':'#2E6DA4'):'#DDE3EA')+'"></div>'}).join('')+'</div>'}

function renderDefects(){
  const box=document.getElementById('defBody');if(!box)return;
  const P=rsnPareto(dProj),per=P.per;
  if(!per.length||!P.rows.length){
    box.innerHTML='<div class="panel"><div class="ph"><span>Trend vad</span>'+granToggle()+
      '</div><div class="pb"><div class="empty">'+
      '<div style="font-size:44px;margin-bottom:10px">🔬</div>'+
      (dGran==='w'?'<b>Pro týdny nejsou nahrané denní reporty.</b><br>'+
        'Týdenní trend se počítá z denních reportů, které nahrajete v záložce '+
        '<b>Data &amp; import</b> — měsíční pohled jede z QAD exportu i bez nich.':
        '<b>Rozpad na vady zatím není k dispozici.</b><br>'+
        'Bere se z měsíčního QAD exportu — pole <b>R</b> v datech <code>MDET</code>.')+
      '</div></div></div>';return}
  const mv=rsnMovers(P);
  const top5=P.rows.slice(0,5);
  const msOk=rsnMonths();
  const chybi=dGran==='m'?Object.keys(MDET).map(Number).sort((a,b)=>a-b)
    .filter(m=>!msOk.includes(m)):[];
  const hot=per.filter(q=>!q.part);
  const k=Math.max(1,Math.floor(hot.length/3));
  const oknoA=hot.slice(-2*k,-k).map(q=>q.label).join(', ');
  const oknoB=hot.slice(-k).map(q=>q.label).join(', ');
  const nedok=per.filter(q=>q.part).map(q=>q.label);
  const jed=dGran==='w'?(per.length===1?'týden':(per.length<5?'týdny':'týdnů')):
    (per.length===1?'měsíc':(per.length<5?'měsíce':'měsíců'));

  box.innerHTML=
  (chybi.length?'<div class="warnbox"><span style="font-size:26px">📄</span><div>'+
    '<b>'+chybi.map(m=>MN[m-1]).join(' a ')+' '+(chybi.length===1?'nemá':'nemají')+
    ' rozpad na vady.</b> V měsíčním exportu '+(chybi.length===1?'je':'jsou')+
    ' zatím jen projektové součty, takže '+(chybi.length===1?'se do trendu nepočítá':
    'se do trendu nepočítají')+' — jinak by každá vada vypadala jako vyřešená.'+
    '</div></div>':'')+
  (dGran==='w'?'<div class="warnbox"><span style="font-size:26px">📅</span><div>'+
    '<b>Týdny se počítají z denních reportů</b>, ne z měsíčního QAD exportu. '+
    'Vidíte tedy jen týdny, ze kterých jsou nahrané dny — chybějící dny nejsou nuly. '+
    'Týden je kalendářní podle ISO, od pondělí do neděle.'+
    (nedok.length?' <b>'+nedok.join(' a ')+' ještě '+(nedok.length===1?'není':'nejsou')+
      ' celý'+(nedok.length===1?'':'ch')+'</b> — v grafu '+(nedok.length===1?'je':'jsou')+
      ', ale do trendu se '+(nedok.length===1?'nepočítá':'nepočítají')+'.':'')+
    '</div></div>':'')+
  '<div class="panel"><div class="ph"><span>Projekt</span>'+granToggle()+'</div><div class="pb">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="chip '+(dProj==='all'?'on':'')+'" onclick="setDProj(\'all\')">Celý závod</button>'+
    rsnProjects().map(p=>'<button class="chip '+(dProj===p?'on':'')+'" onclick="setDProj(\''+
      esc(p)+'\')">'+p+'</button>').join('')+'</div></div></div>'+
  '<div class="grid4">'+
    '<div class="kpi b"><div class="kpi-l">Sledovaných vad</div>'+
      '<div class="kpi-v">'+P.rows.length+'</div>'+
      '<div class="kpi-s">'+fE(P.cel)+' celkem · '+per.length+' '+jed+'</div></div>'+
    '<div class="kpi a"><div class="kpi-l">TOP 5 drží</div>'+
      '<div class="kpi-v">'+Math.round(top5.reduce((s,r)=>s+r.podil,0)*100)+' %</div>'+
      '<div class="kpi-s">'+fE(top5.reduce((s,r)=>s+r.tot,0))+' z '+fE(P.cel)+'</div></div>'+
    '<div class="kpi r"><div class="kpi-l">Největší nárůst</div>'+
      '<div class="kpi-v" style="font-size:20px">'+(mv.up?mv.up.nazev:'—')+'</div>'+
      '<div class="kpi-s">'+(mv.up?'▲ '+fE(mv.up.tr.b-mv.up.tr.a)+' proti předchozímu období':
        'žádná vada nevyrostla')+'</div></div>'+
    '<div class="kpi g"><div class="kpi-l">Největší zlepšení</div>'+
      '<div class="kpi-v" style="font-size:20px">'+(mv.dn?mv.dn.nazev:'—')+'</div>'+
      '<div class="kpi-s">'+(mv.dn?'▼ '+fE(mv.dn.tr.a-mv.dn.tr.b)+' proti předchozímu období':
        'žádná vada neklesla')+'</div></div></div>'+
  '<div class="panel"><div class="ph"><span>Vývoj TOP 5 vad '+
    (dGran==='w'?'po týdnech':'po měsících')+'</span>'+
    '<div class="legend" style="color:rgba(255,255,255,.85)">'+
    top5.map((r,i)=>'<span><span class="sw" style="background:'+RSNBARV[i]+'"></span>'+
      r.nazev+'</span>').join('')+'</div></div>'+
    '<div class="pb"><div class="chw" style="height:280px"><canvas id="cRsn"></canvas></div></div></div>'+
  '<div class="panel"><div class="ph"><span>Pareto vad'+
    (dProj==='all'?' — celý závod':' — '+dProj)+
    ' &nbsp;<span style="font-weight:600;opacity:.8">· trend porovnává '+oknoB+
    ' proti '+(oknoA||'předchozím obdobím')+'</span></span></div>'+
    '<div class="pb" style="overflow-x:auto">'+
    '<table class="tbl"><thead><tr><th style="width:34px">#</th><th>Vada</th><th></th>'+
    '<th>Vývoj</th><th class="num">EUR</th><th class="num">Podíl</th>'+
    '<th class="num">Kumul.</th><th>Trend</th><th>Hlavní projekt</th>'+
    '<th style="width:110px"></th></tr></thead><tbody>'+
    P.rows.slice(0,15).map((r,i)=>{
      const mx=Math.max.apply(null,per.map(q=>r.m[q.key]||0));
      const hp=Object.entries(r.proj).sort((a,b)=>b[1]-a[1])[0];
      const op=openRsn===r.key;
      let out='<tr class="'+(op||r.tr.kod==='roste'||r.tr.kod==='nova'?'hi':'')+'">'+
      '<td><b style="color:'+(i===0?'#C0392B':'#7F8C8D')+'">'+(i+1)+'</b></td>'+
      '<td><b>'+r.nazev+'</b></td>'+
      '<td>'+(r.kod?'<span class="code">'+r.kod+'</span>':'')+'</td>'+
      '<td>'+rsnSpark(r.m,per,mx)+'</td>'+
      '<td class="num"><b>'+fE(r.tot)+'</b></td>'+
      '<td class="num" style="color:var(--muted)">'+(r.podil*100).toFixed(1)+' %</td>'+
      '<td class="num" style="color:var(--muted)">'+Math.round(r.kumul*100)+' %</td>'+
      '<td><span class="tag '+r.tr.cls+'">'+
        (r.tr.kod==='roste'?'▲ ':(r.tr.kod==='klesa'?'▼ ':''))+r.tr.lab+
        (r.tr.pct!=null&&r.tr.kod!=='pryc'?' '+(r.tr.pct>0?'+':'')+Math.round(r.tr.pct)+' %':'')+
        '</span></td>'+
      '<td>'+(hp?projLink(hp[0])+'<span style="color:var(--muted);font-size:11px"> · '+
        Math.round(hp[1]/r.tot*100)+' %</span>':'—')+'</td>'+
      '<td style="text-align:right"><button class="btn" onclick="toggleRsn(\''+esc(r.key)+'\')">'+
        (op?'▲ skrýt':'▼ rozpad')+'</button></td></tr>';
      if(op)out+='<tr><td colspan="10" style="background:var(--bg)">'+rsnDetail(r,per)+'</td></tr>';
      return out}).join('')+
    '</tbody></table>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:12px;line-height:1.7">'+
    'Počítá se <b>w/o tests</b> '+(dGran==='w'?'z denních reportů':'z měsíčního QAD exportu')+
    '. Trend porovnává součet za '+oknoB+
    ' se součtem za '+(oknoA||'předchozí období')+'; nad 25 % je to <b>roste</b>, '+
    'pod −25 % <b>klesá</b>, mezi tím <b>stabilní</b>. Řádky vad, které rostou nebo jsou '+
    'nové, jsou obarvené.</div></div></div>';

  mk('cRsn',{type:'line',data:{labels:per.map(q=>q.label),datasets:top5.map((r,i)=>({
    label:r.nazev,data:per.map(q=>r.m[q.key]||0),borderColor:RSNBARV[i],
    backgroundColor:RSNBARV[i],borderWidth:3,tension:.25,fill:false,
    /* nedokončené období má dutý bod, ať se nečte jako hotový výsledek */
    pointRadius:per.map(q=>q.part?6:4),
    pointStyle:per.map(q=>q.part?'circle':'circle'),
    pointBackgroundColor:per.map(q=>q.part?'#fff':RSNBARV[i]),
    pointBorderColor:RSNBARV[i],pointBorderWidth:2}))},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{display:false},
      tooltip:{mode:'index',intersect:false,
        callbacks:{title:c=>{const q=per[c[0].dataIndex];
            return q.label+' · '+q.sub+(q.part?' · zatím nedokončené':'')},
          label:c=>' '+c.dataset.label+': '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),font:{size:10},
        color:'#7F8C8D'},grid:grd,min:0,border:{display:false}}}}})}

/* rozpad jedné vady — období, projekty, pracoviště */
function rsnDetail(r,per){
  const tab=(t,rows,fmt)=>'<div><div class="kpi-l" style="margin-bottom:6px">'+t+'</div>'+
    (rows.length?'<table class="tbl">'+rows.slice(0,6).map(x=>
      '<tr><td><b>'+(fmt?fmt(x[0]):x[0])+'</b></td><td class="num">'+fE(x[1])+'</td>'+
      '<td class="num" style="color:var(--muted)">'+Math.round(x[1]/r.tot*100)+' %</td></tr>').join('')+
    '</table>':'<div style="font-size:12px;color:var(--muted)">bez detailu</div>')+'</div>';
  const mes=per.map(q=>[q.label+(dGran==='w'?' · '+q.sub:''),r.m[q.key]||0]);
  return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:6px 2px">'+
    '<div><div class="kpi-l" style="margin-bottom:6px">'+
      (dGran==='w'?'Týden po týdnu':'Měsíc po měsíci')+'</div>'+
      '<table class="tbl">'+mes.map((x,i)=>{
        const p=i>0?mes[i-1][1]:null,d=p!=null?x[1]-p:null;
        return '<tr><td><b>'+x[0]+'</b>'+(per[i].part?
          ' <span class="tag n">nedokončené</span>':'')+'</td><td class="num">'+fE(x[1])+'</td>'+
        '<td class="num">'+(d==null?'':'<span class="tag '+(d>0?'r':(d<0?'g':'n'))+'">'+
          (d>0?'▲ +':(d<0?'▼ ':''))+(d?fE(Math.abs(d)):'—')+'</span>')+'</td></tr>'}).join('')+
      '</table></div>'+
    tab('Projekty',Object.entries(r.proj).sort((a,b)=>b[1]-a[1]))+
    tab('Pracoviště',Object.entries(r.loc).sort((a,b)=>b[1]-a[1]),locName)+
    '</div>'+
    '<div style="font-size:12px;color:var(--muted);padding:4px 2px 8px">'+
    'Celkem '+fE(r.tot)+' · '+fN(r.ks)+' ks · '+fEs(r.ks?r.tot/r.ks:0)+' na kus. '+
    (dGran==='w'?'Pracoviště je z denních reportů, přiřazené přímo ke kódu vady.':
      'Pracoviště se k vadě přiřazuje přes kombinace v exportu, takže součet nemusí '+
      'přesně sedět s EUR vady.')+'</div>'}

window.setDProj=p=>{dProj=p;openRsn=null;renderDefects()};
window.setDGran=g=>{dGran=g;openRsn=null;
  /* projekt se mezi zdroji nemusí jmenovat stejně */
  if(dProj!=='all'&&!rsnProjects().includes(dProj))dProj='all';
  renderDefects()};
window.toggleRsn=k=>{openRsn=openRsn===k?null:k;renderDefects()};
