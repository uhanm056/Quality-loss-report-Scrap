/* Záložka 0: TOP kontributoři scrapu a jejich rozpad
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

let topMode='wo',qMonth=null,openProjRow=null;
const mdMonths=()=>Object.keys(MDET).map(Number).sort((a,b)=>a-b);
window.setTop=(v,b)=>{topMode=v;document.querySelectorAll('#segTop .sbtn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');renderTop()};
window.toggleRow=p=>{openProjRow=openProjRow===p?null:p;renderTop()};
/* klik na sloupec v grafu QLR → vybere měsíc */
function pickFromChart(idx,dsi){
  const lab=LBL[rFrom+idx];if(!lab)return;
  if(dsi===0||dsi===1){topMode=dsi===0?'wt':'wo';
    document.querySelectorAll('#segTop .sbtn').forEach((b,j)=>b.classList.toggle('on',j===(dsi===0?1:0)))}
  if(!lab.endsWith('26')){toast('Rozpad na projekty mám jen pro rok 2026.','#7F8C8D');return}
  const mn=MO3.indexOf(lab.slice(0,3))+1;
  if(!MDET[mn]){toast(MN[mn-1]+' zatím není v QAD datech.','#7F8C8D');return}
  qMonth=mn;renderTop();
  document.getElementById('topBody').scrollIntoView({behavior:'smooth',block:'center'})}

function renderTop(){
  const el=document.getElementById('topBody');if(!el)return;
  const ms=mdMonths();
  if(!qMonth||!MDET[qMonth])qMonth=ms[ms.length-1];
  const cur=qMonth,prv=ms[ms.indexOf(cur)-1];
  const K=topMode==='wo'?'wo':'wt';
  const lbl=topMode==='wo'?'W/O tests':'With tests';
  const get=m=>!m?[]:Object.entries(MDET[m]||{}).map(([p,v])=>[p,v[K]])
    .filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  const c=get(cur),p=get(prv),pm=Object.fromEntries(p);
  const totC=c.reduce((a,x)=>a+x[1],0),totP=p.reduce((a,x)=>a+x[1],0);
  const dT=totP?totC-totP:null;
  const top3=c.slice(0,3);
  const tt=document.getElementById('topTitle');
  const tpc=mTgt(cur),spc=mSales(cur);
  if(tt)tt.innerHTML='TOP 3 kontributoři scrapu — '+MN[cur-1]+' 2026'+
    (tpc?' <span style="font-weight:600;opacity:.85">· target '+tpc.toFixed(2)+' % ze Sales'+
    (mPartial(cur)?' · měsíc probíhá':'')+'</span>':'');
  el.innerHTML=
  '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center">'+
    '<span class="slabel">měsíc</span>'+ms.map(m=>
    '<button class="chip '+(m===cur?'on':'')+'" onclick="qMonth='+m+';renderTop()">'+MN[m-1]+'</button>').join('')+
    '<span style="margin-left:auto;font-size:12px;color:var(--muted);font-weight:700">'+
    'nebo klikni na sloupec v grafu ↑</span></div>'+
  '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:14px;'+
    'padding:12px 16px;background:var(--bg);border-radius:10px;font-size:14px">'+
    (prv?'<b>'+MN[prv-1]+'</b> <span style="color:var(--muted)">'+fE(totP)+'</span>'+
    '<span style="font-size:18px;color:var(--muted)">→</span>':'')+
    '<b>'+MN[cur-1]+'</b> <span style="color:var(--muted)">'+fE(totC)+'</span>'+
    (dT!==null?'<span class="tag '+(dT>0?'r':'g')+'" style="font-size:12px">'+(dT>0?'▲ +':'▼ ')+
    fE(Math.abs(dT))+'</span>':'')+
    '<span style="margin-left:auto;font-size:12px;color:var(--muted);font-weight:700">'+lbl+'</span>'+
    (tpc&&spc?'<div style="width:100%;font-size:13px;margin-top:8px;padding-top:9px;'+
    'border-top:1px solid var(--border)">Skutečnost <b>'+(totC/spc*100).toFixed(2)+' %</b> ze Sales '+
    fE(spc)+' &nbsp;·&nbsp; target <b>'+tpc.toFixed(2)+' %</b> &nbsp;'+
    '<span class="tag '+((totC/spc*100)>tpc?'r':'g')+'">'+
    ((totC/spc*100)>tpc?'▲ +'+((totC/spc*100)-tpc).toFixed(2)+' p.b. nad':
     '▼ '+(tpc-(totC/spc*100)).toFixed(2)+' p.b. pod')+' targetem</span></div>':'')+'</div>'+
  '<table class="tbl"><thead><tr><th style="width:36px">#</th><th>Projekt</th>'+
    (prv?'<th class="num">'+MN[prv-1]+'</th>':'')+'<th class="num">'+MN[cur-1]+'</th>'+
    (prv?'<th class="num">Změna</th>':'')+'<th class="num">% závodu</th><th class="num">% projektu</th><th class="num">Target</th><th style="width:130px"></th></tr></thead><tbody>'+
  top3.map(function(r,i){const nm=r[0],v=r[1],pv=pm[nm]||0,d=v-pv;
    const dp=pv?Math.round(d/pv*100):null,op=openProjRow===nm;
    const D=MDET[cur][nm];
    let row='<tr class="'+(i===0?'hi':'')+'">'+
    '<td><b style="color:'+(i===0?'#C0392B':'#7F8C8D')+'">'+(i+1)+'</b></td>'+
    '<td><b style="font-size:14px">'+nm+'</b></td>'+
    (prv?'<td class="num" style="color:var(--muted)">'+(pv?fE(pv):'—')+'</td>':'')+
    '<td class="num">'+fE(v)+'</td>'+
    (prv?'<td class="num"><span class="tag '+(d>0?'r':(d<0?'g':'n'))+'">'+
      (d>0?'▲ +':(d<0?'▼ ':''))+fE(Math.abs(d))+(dp!==null?' ('+(dp>0?'+':'')+dp+'\u00a0%)':'')+'</span></td>':'')+
    '<td class="num" style="color:var(--muted)">'+Math.round(v/totC*100)+' %</td>'+
    (function(){const pt=pTgt(cur,nm),ps=pSales(cur,nm),act=ps?v/ps*100:null;
      return '<td class="num">'+(act!=null?'<b>'+act.toFixed(2)+' %</b>':'—')+'</td>'+
        '<td class="num">'+(pt&&pt[0]!=null?(act!=null?'<span class="tag '+(act>pt[0]?'r':'g')+'">'+
        pt[0].toFixed(2)+' %</span>':'<span style="color:var(--muted)">'+pt[0].toFixed(2)+' %</span>'):'—')+'</td>'})()+
    '<td style="text-align:right"><button class="btn" onclick="toggleRow(\''+esc(nm)+'\')">'+
      (op?'▲ skrýt':'▼ rozpad')+'</button></td></tr>';
    if(op){
      const cs=(prv?3:1)+(prv?1:0)+3;
      row+='<tr><td colspan="'+(prv?9:7)+'" style="background:#F8FAFC;padding:14px 16px">'+
        '<div class="two" style="gap:14px">'+
        '<div><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;'+
          'color:var(--muted);margin-bottom:8px">Pracoviště</div>'+miniTbl(D.L,v,'loc')+'</div>'+
        '<div><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;'+
          'color:var(--muted);margin-bottom:8px">Příčiny</div>'+miniTbl(D.R,v,'rsn')+'</div></div>'+
        '<div style="margin-top:14px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;'+
          'letter-spacing:.5px;color:var(--muted);margin-bottom:8px">Co přesně a kde</div>'+
          miniTbl(D.P,v,'pair')+'</div></td></tr>'}
    return row}).join('')+
  '</tbody></table>'+
  '<div style="font-size:12px;color:var(--muted);margin-top:10px">Top 3 tvoří '+
    Math.round(top3.reduce((a,x)=>a+x[1],0)/totC*100)+' % scrapu závodu za '+MN[cur-1]+
    ' ('+lbl+'). Tlačítkem <b>▼ rozpad</b> zobrazíš pracoviště a příčiny.</div>'}

/* mini tabulka uvnitř rozpadu; typ: loc | rsn | pair */
function miniTbl(rows,ptot,type){
  if(!rows||!rows.length)return '<div style="color:var(--muted);font-size:13px">Bez detailu</div>';
  const ix=topMode==='wo'?1:0;                       // posun na wo/wt hodnotu
  const val=r=>type==='loc'?(ix?r[2]:r[1]):(ix?r[3]:r[2]);
  const qty=r=>type==='loc'?r[3]:r[4];
  const list=rows.map(r=>({r:r,v:val(r),q:qty(r)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,5);
  if(!list.length)return '<div style="color:var(--muted);font-size:13px">V této kategorii nic</div>';
  const mx=list[0].v;
  return '<table class="tbl" style="font-size:12px"><thead><tr>'+
    (type==='loc'?'<th>Pracoviště</th><th>Kód</th>':
     type==='rsn'?'<th>Příčina</th><th>Kód</th>':'<th>Pracoviště</th><th>Příčina</th>')+
    '<th class="num">Ks</th><th class="num">EUR</th><th class="num">% projektu</th></tr></thead><tbody>'+
    list.map(function(x,i){const r=x.r;
      const c1=type==='loc'?'<b>'+locName(r[0])+'</b>':(type==='rsn'?'<b>'+r[1]+'</b>':'<b>'+locName(r[0])+'</b>');
      const c2=type==='loc'?'<span class="code">'+r[0]+'</span>':
               (type==='rsn'?(r[0]?'<span class="code">'+r[0]+'</span>':'—'):r[1]);
      return '<tr'+(i===0?' class="hi"':'')+'><td>'+c1+
        '<div class="minib"><div class="minif '+(i===0?'top':'')+'" style="width:'+
        Math.round(x.v/mx*100)+'%"></div></div></td><td>'+c2+'</td>'+
        '<td class="num">'+fN(x.q)+'</td><td class="num">'+fE(x.v)+'</td>'+
        '<td class="num" style="color:var(--muted)">'+Math.round(x.v/ptot*100)+' %</td></tr>'}).join('')+
    '</tbody></table>'}
