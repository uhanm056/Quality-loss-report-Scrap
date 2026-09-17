/* Záložka 5: zdrojová data — vzorec, roční souhrn, měsíční tabulka
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

/* ── Roční souhrn ─────────────────────────────────────────────────────
   Uzavřené roky drží YRSUM — ověřená čísla ze scrap reportu i se skutečnými
   Net Sales. Probíhající rok se dopočítá z měsíčních polí, aby nezůstal
   viset tam, kde ho někdo naposled ručně přepsal.
   Ověřeno, že dopočet dá pro 2024 i 2025 přesně to, co v YRSUM stojí
   (scrap with tests i w/o tests na euro, QLR na dvě desetinná místa);
   Sales se liší o 589 € ze 172 mil., protože se odvozují ze zaokrouhlených
   procent — proto se pro uzavřené roky berou ta zapsaná. */
const yrOf=l=>2000+(+String(l).slice(-2));
const salesOf=i=>EW[i]/(QW[i]/100);
function yrSum(a,b){let wo=0,wt=0,s=0;
  for(let i=a;i<b;i++){wo+=EO[i];wt+=EW[i];s+=salesOf(i)}
  return{wo:Math.round(wo),wt:Math.round(wt),sales:Math.round(s),qlr:wt/s*100}}

/* Řádky tabulky. `base` je scrap w/o tests předchozího roku za **stejný počet
   měsíců** — osm měsíců 2026 proti celému 2025 by ukázalo „ušetřeno 270 020 €",
   i když proti stejným osmi měsícům je to 28 277 €. */
function yrRows(){
  const ix={};LBL.forEach((l,i)=>{const y=yrOf(l);if(ix[y]==null)ix[y]=i});
  return Object.keys(ix).map(Number).sort().map(function(y){
    const a=ix[y],b=(ix[y+1]!=null?ix[y+1]:LBL.length),n=b-a;
    const rec=YRSUM.find(r=>r.y===y),v=rec||yrSum(a,b);
    let base=null,baseLab=null;
    const pa=ix[y-1];
    if(pa!=null){const pn=a-pa;
      if(n<pn){base=yrSum(pa,pa+n).wo;baseLab=LBL[pa]+'–'+LBL[pa+n-1]}
      else{base=yrSum(pa,a).wo;baseLab=String(y-1)}}
    return{y:y,n:n,od:LBL[a],do:LBL[b-1],cely:n>=12,zapsany:!!rec,
      sales:v.sales,wt:v.wt,wo:v.wo,qlr:v.qlr,base:base,baseLab:baseLab}})}

function renderSrc(){
  const y=document.getElementById('yrBody');if(!y)return;
  const YR=yrRows(),cast=YR.filter(r=>!r.cely);
  y.innerHTML='<table class="tbl"><thead><tr><th>Rok</th><th class="num">Sales</th>'+
    '<th class="num">Scrap with tests</th><th class="num">QLR %</th>'+
    '<th class="num">Scrap w/o tests</th><th class="num">Saving vs předch.</th></tr></thead><tbody>'+
    YR.map(function(r){const sav=r.base!=null?r.base-r.wo:null;
      return '<tr><td><b style="font-size:15px">'+r.y+'</b>'+
      (r.cely?'':'<div style="font-size:11px;color:var(--muted)">'+r.od+' – '+r.do+
        ' · '+r.n+' '+(r.n===1?'měsíc':(r.n<5?'měsíce':'měsíců'))+'</div>')+'</td>'+
      '<td class="num">'+fE(r.sales)+'</td><td class="num">'+fE(r.wt)+'</td>'+
      '<td class="num"><b>'+r.qlr.toFixed(2)+' %</b></td>'+
      '<td class="num">'+fE(r.wo)+'</td>'+
      '<td class="num">'+(sav!==null?'<span class="tag '+(sav>0?'g':'r')+'">'+
        (sav>0?'▼ ':'▲ ')+fE(Math.abs(sav))+'</span>'+
        '<div style="font-size:11px;color:var(--muted)">proti '+r.baseLab+'</div>':
        '—')+'</td></tr>'}).join('')+
    '</tbody></table><div style="font-size:12px;color:var(--muted);margin-top:9px">'+
    (cast.length?cast.map(r=>'<b>'+r.y+'</b> je částečný rok — '+r.od+' – '+r.do+
      ', tedy '+r.n+' z 12 měsíců. Saving se proto porovnává se stejným obdobím '+
      'předchozího roku, ne s celým rokem.').join(' '):
      'Všechny roky jsou kompletní.')+
    ' Uzavřené roky jsou ze scrap reportu, probíhající se dopočítá z měsíční tabulky níž.</div>';
  const pt=(id,arr)=>{const e=document.getElementById(id);if(!e)return;const mx=arr[0][1];
    e.innerHTML='<table class="tbl"><thead><tr><th>Díl</th><th class="num">Scrap EUR</th></tr></thead><tbody>'+
      arr.map((r,i)=>'<tr class="'+(i===0?'hi':'')+'"><td style="font-size:12px"><b>'+r[0]+'</b>'+
        '<div class="minib"><div class="minif '+(i===0?'top':'')+'" style="width:'+
        Math.round(r[1]/mx*100)+'%"></div></div></td>'+
        '<td class="num">'+fE(r[1])+'</td></tr>').join('')+'</tbody></table>'};
  pt('tp25',TOPPARTS25);pt('tp26',TOPPARTS26);
  const s=document.getElementById('srcBody');
  s.innerHTML='<table class="tbl"><thead><tr><th>Měsíc</th><th class="num">Scrap w/o tests</th>'+
    '<th class="num">Target</th><th class="num">Saving EUR</th><th class="num">Sales</th>'+
    '<th class="num">Scrap EUR w/o</th><th class="num">Scrap EUR with tests</th>'+
    '<th class="num">QLR %</th></tr></thead><tbody>'+
    LBL.map(function(l,i){
      const sales=Math.round(EW[i]/(QW[i]/100));
      const yr=l.slice(-2),bg=yr==='26'?'background:#EEF4FB':(yr==='25'?'background:#FBF7F2':'');
      const over=QT[i]!=null&&QO[i]>QT[i];
      return '<tr style="'+bg+'"><td><b>'+l+'</b></td>'+
      '<td class="num"'+(over?' style="color:#C0392B"':'')+'>'+QO[i].toFixed(2)+' %</td>'+
      '<td class="num" style="color:var(--muted)">'+(QT[i]!=null?QT[i].toFixed(2)+' %':'—')+'</td>'+
      '<td class="num">'+(SV[i]!=null?fE(SV[i]):'—')+'</td>'+
      '<td class="num" style="color:var(--muted)">'+fE(sales)+'</td>'+
      '<td class="num">'+fE(EO[i])+'</td><td class="num">'+fE(EW[i])+'</td>'+
      '<td class="num"><b>'+QW[i].toFixed(2)+' %</b></td></tr>'}).join('')+
    '</tbody></table>'}
