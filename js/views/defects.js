/* Záložka 4: trend vad — Pareto a vývoj po měsících pro problem solving
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const RSNBARV=['#C0392B','#2E6DA4','#E8A020','#27AE60','#8E44AD','#16A085'];

/* mini sloupečky měsíc po měsíci přímo v řádku tabulky */
function rsnSpark(x,ms,mx){
  return '<div style="display:flex;gap:2px;align-items:flex-end;height:26px">'+
    ms.map(m=>{const v=x[m]||0,h=mx?Math.max(2,Math.round(v/mx*26)):2;
      return '<div title="'+MN[m-1]+': '+fE(v)+'" style="width:9px;height:'+h+'px;border-radius:2px;'+
        'background:'+(v?'#2E6DA4':'#DDE3EA')+'"></div>'}).join('')+'</div>'}

function renderDefects(){
  const box=document.getElementById('defBody');if(!box)return;
  const P=rsnPareto(dProj),ms=P.ms;
  if(!ms.length||!P.rows.length){
    box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
      '<div style="font-size:44px;margin-bottom:10px">🔬</div>'+
      '<b>Rozpad na vady zatím není k dispozici.</b><br>'+
      'Bere se z měsíčního QAD exportu — pole <b>R</b> v datech <code>MDET</code>.'+
      '</div></div></div>';return}
  const mv=rsnMovers(P);
  const top5=P.rows.slice(0,5);
  const chybi=Object.keys(MDET).map(Number).sort((a,b)=>a-b).filter(m=>!ms.includes(m));
  const k=Math.max(1,Math.floor(ms.length/3));
  const oknoA=ms.slice(-2*k,-k).map(m=>MN[m-1]).join(', ');
  const oknoB=ms.slice(-k).map(m=>MN[m-1]).join(', ');

  box.innerHTML=
  (chybi.length?'<div class="warnbox"><span style="font-size:26px">📄</span><div>'+
    '<b>'+chybi.map(m=>MN[m-1]).join(' a ')+' '+(chybi.length===1?'nemá':'nemají')+
    ' rozpad na vady.</b> V měsíčním exportu '+(chybi.length===1?'je':'jsou')+
    ' zatím jen projektové součty, takže '+(chybi.length===1?'se do trendu nepočítá':
    'se do trendu nepočítají')+' — jinak by každá vada vypadala jako vyřešená.'+
    '</div></div>':'')+
  '<div class="panel"><div class="ph"><span>Projekt</span></div><div class="pb">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="chip '+(dProj==='all'?'on':'')+'" onclick="setDProj(\'all\')">Celý závod</button>'+
    rsnProjects().map(p=>'<button class="chip '+(dProj===p?'on':'')+'" onclick="setDProj(\''+
      esc(p)+'\')">'+p+'</button>').join('')+'</div></div></div>'+
  '<div class="grid4">'+
    '<div class="kpi b"><div class="kpi-l">Sledovaných vad</div>'+
      '<div class="kpi-v">'+P.rows.length+'</div>'+
      '<div class="kpi-s">'+fE(P.cel)+' celkem · '+ms.length+' měsíců</div></div>'+
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
  '<div class="panel"><div class="ph"><span>Vývoj TOP 5 vad po měsících</span>'+
    '<div class="legend" style="color:rgba(255,255,255,.85)">'+
    top5.map((r,i)=>'<span><span class="sw" style="background:'+RSNBARV[i]+'"></span>'+
      r.nazev+'</span>').join('')+'</div></div>'+
    '<div class="pb"><div class="chw" style="height:280px"><canvas id="cRsn"></canvas></div></div></div>'+
  '<div class="panel"><div class="ph"><span>Pareto vad'+
    (dProj==='all'?' — celý závod':' — '+dProj)+
    ' &nbsp;<span style="font-weight:600;opacity:.8">· trend porovnává '+oknoB+
    ' proti '+(oknoA||'předchozím měsícům')+'</span></span></div>'+
    '<div class="pb" style="overflow-x:auto">'+
    '<table class="tbl"><thead><tr><th style="width:34px">#</th><th>Vada</th><th></th>'+
    '<th>Vývoj</th><th class="num">EUR</th><th class="num">Podíl</th>'+
    '<th class="num">Kumul.</th><th>Trend</th><th>Hlavní projekt</th>'+
    '<th style="width:110px"></th></tr></thead><tbody>'+
    P.rows.slice(0,15).map((r,i)=>{
      const mx=Math.max.apply(null,ms.map(m=>r.m[m]||0));
      const hp=Object.entries(r.proj).sort((a,b)=>b[1]-a[1])[0];
      const op=openRsn===r.key;
      let out='<tr class="'+(op||r.tr.kod==='roste'||r.tr.kod==='nova'?'hi':'')+'">'+
      '<td><b style="color:'+(i===0?'#C0392B':'#7F8C8D')+'">'+(i+1)+'</b></td>'+
      '<td><b>'+r.nazev+'</b></td>'+
      '<td>'+(r.kod?'<span class="code">'+r.kod+'</span>':'')+'</td>'+
      '<td>'+rsnSpark(r.m,ms,mx)+'</td>'+
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
      if(op)out+='<tr><td colspan="10" style="background:var(--bg)">'+rsnDetail(r,ms)+'</td></tr>';
      return out}).join('')+
    '</tbody></table>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:12px;line-height:1.7">'+
    'Počítá se <b>w/o tests</b> z měsíčního QAD exportu. Trend porovnává součet za '+oknoB+
    ' se součtem za '+(oknoA||'předchozí měsíce')+'; nad 25 % je to <b>roste</b>, '+
    'pod −25 % <b>klesá</b>, mezi tím <b>stabilní</b>. Řádky vad, které rostou nebo jsou '+
    'nové, jsou obarvené.</div></div></div>';

  const lb=ms.map(m=>MN[m-1]);
  mk('cRsn',{type:'line',data:{labels:lb,datasets:top5.map((r,i)=>({
    label:r.nazev,data:ms.map(m=>r.m[m]||0),borderColor:RSNBARV[i],
    backgroundColor:RSNBARV[i],borderWidth:3,pointRadius:4,tension:.25,fill:false}))},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{display:false},
      tooltip:{mode:'index',intersect:false,
        callbacks:{label:c=>' '+c.dataset.label+': '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),font:{size:10},
        color:'#7F8C8D'},grid:grd,min:0,border:{display:false}}}}})}

/* rozpad jedné vady — měsíce, projekty, pracoviště */
function rsnDetail(r,ms){
  const tab=(t,rows,fmt)=>'<div><div class="kpi-l" style="margin-bottom:6px">'+t+'</div>'+
    (rows.length?'<table class="tbl">'+rows.slice(0,6).map(x=>
      '<tr><td><b>'+(fmt?fmt(x[0]):x[0])+'</b></td><td class="num">'+fE(x[1])+'</td>'+
      '<td class="num" style="color:var(--muted)">'+Math.round(x[1]/r.tot*100)+' %</td></tr>').join('')+
    '</table>':'<div style="font-size:12px;color:var(--muted)">bez detailu</div>')+'</div>';
  const mes=ms.map(m=>[MN[m-1],r.m[m]||0]);
  return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:6px 2px">'+
    '<div><div class="kpi-l" style="margin-bottom:6px">Měsíc po měsíci</div>'+
      '<table class="tbl">'+mes.map((x,i)=>{
        const p=i>0?mes[i-1][1]:null,d=p!=null?x[1]-p:null;
        return '<tr><td><b>'+x[0]+'</b></td><td class="num">'+fE(x[1])+'</td>'+
        '<td class="num">'+(d==null?'':'<span class="tag '+(d>0?'r':(d<0?'g':'n'))+'">'+
          (d>0?'▲ +':(d<0?'▼ ':''))+(d?fE(Math.abs(d)):'—')+'</span>')+'</td></tr>'}).join('')+
      '</table></div>'+
    tab('Projekty',Object.entries(r.proj).sort((a,b)=>b[1]-a[1]))+
    tab('Pracoviště',Object.entries(r.loc).sort((a,b)=>b[1]-a[1]),locName)+
    '</div>'+
    '<div style="font-size:12px;color:var(--muted);padding:4px 2px 8px">'+
    'Celkem '+fE(r.tot)+' · '+fN(r.ks)+' ks · '+fEs(r.ks?r.tot/r.ks:0)+' na kus. '+
    'Pracoviště se k vadě přiřazuje přes kombinace v exportu, takže součet nemusí '+
    'přesně sedět s EUR vady.</div>'}

window.setDProj=p=>{dProj=p;openRsn=null;renderDefects()};
window.toggleRsn=k=>{openRsn=openRsn===k?null:k;renderDefects()};
