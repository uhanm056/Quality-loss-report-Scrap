/* Záložka 5: zdrojová data — vzorec, roční souhrn, měsíční tabulka
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

function renderSrc(){
  const y=document.getElementById('yrBody');if(!y)return;
  y.innerHTML='<table class="tbl"><thead><tr><th>Rok</th><th class="num">Sales</th>'+
    '<th class="num">Scrap with tests</th><th class="num">QLR %</th>'+
    '<th class="num">Scrap w/o tests</th><th class="num">Saving vs předch.</th></tr></thead><tbody>'+
    YRSUM.map(function(r,i){const pw=i>0?YRSUM[i-1].wo:null;const sav=pw?pw-r.wo:null;
      return '<tr><td><b style="font-size:15px">'+r.y+'</b></td>'+
      '<td class="num">'+fE(r.sales)+'</td><td class="num">'+fE(r.wt)+'</td>'+
      '<td class="num"><b>'+r.qlr.toFixed(2)+' %</b></td>'+
      '<td class="num">'+fE(r.wo)+'</td>'+
      '<td class="num">'+(sav!==null?'<span class="tag '+(sav>0?'g':'r')+'">'+
        (sav>0?'▼ ':'▲ ')+fE(Math.abs(sav))+'</span>':'—')+'</td></tr>'}).join('')+
    '</tbody></table><div style="font-size:12px;color:var(--muted);margin-top:9px">'+
    '2026 je částečný rok — jen uzavřené měsíce.</div>';
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
