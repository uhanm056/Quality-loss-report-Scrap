/* Záložka 6: nastavení targetů a Sales
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

function renderTgt(){
  const el=document.getElementById('tgtBody');if(!el)return;
  const ks=Object.keys(TGTM).sort();
  el.innerHTML='<table class="tbl"><thead><tr><th>Měsíc</th><th class="num">Target %</th>'+
    '<th class="num">Target + CI %</th><th class="num">Sales EUR</th>'+
    '<th class="num">Cíl v EUR</th><th></th></tr></thead><tbody>'+
    ks.map(function(k){const o=TGTM[k],mm=+k.slice(5,7);
      const eur=(o.t&&o.sales)?Math.round(o.t/100*o.sales):null;
      return '<tr'+(o.part?' style="background:#FEF9E7"':'')+'><td><b>'+MN[mm-1]+' '+k.slice(0,4)+'</b>'+
      (o.part?' <span class="tag n">probíhá</span>':'')+'</td>'+
      '<td class="num"><input class="inp" style="width:88px" type="number" step="0.01" value="'+
        (o.t!=null?o.t:'')+'" onchange="setTgt(\''+k+'\',\'t\',this.value)"></td>'+
      '<td class="num"><input class="inp" style="width:88px" type="number" step="0.01" value="'+
        (o.ci!=null?o.ci:'')+'" onchange="setTgt(\''+k+'\',\'ci\',this.value)"></td>'+
      '<td class="num"><input class="inp" style="width:120px" type="number" value="'+
        (o.sales!=null?o.sales:'')+'" onchange="setTgt(\''+k+'\',\'sales\',this.value)"></td>'+
      '<td class="num"><b>'+(eur!=null?fE(eur):'—')+'</b></td>'+
      '<td style="text-align:right"><button class="btn dngr" onclick="delTgt(\''+k+'\')">×</button></td></tr>'}).join('')+
    '</tbody></table>'+
    '<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
    '<span class="slabel">přidat měsíc</span>'+
    '<input class="inp" id="ntM" style="width:110px" placeholder="2026-09">'+
    '<button class="btn" onclick="addTgt()">+ přidat</button></div>';
  const p=document.getElementById('ptgtBody');if(!p)return;
  const mks=Object.keys(PTGTM).sort();
  const names=[...new Set(mks.flatMap(k=>Object.keys(PTGTM[k])))].sort();
  p.innerHTML='<table class="tbl"><thead><tr><th rowspan="2">Projekt</th>'+
    mks.map(k=>'<th class="num" colspan="2" style="text-align:center">'+MN[+k.slice(5,7)-1]+' '+k.slice(0,4)+'</th>').join('')+
    '</tr><tr>'+mks.map(()=>'<th class="num" style="font-size:10px">Target</th>'+
    '<th class="num" style="font-size:10px">+ CI</th>').join('')+'</tr></thead><tbody>'+
    names.map(function(n){return '<tr><td><b>'+n+'</b></td>'+mks.map(function(k){
      const o=PTGTM[k][n]||[null,null];
      return '<td class="num"><input class="inp" style="width:72px" type="number" step="0.01" value="'+
        (o[0]!=null?o[0]:'')+'" onchange="setPT(\''+k+'\',\''+esc(n)+'\',0,this.value)"></td>'+
      '<td class="num"><input class="inp" style="width:72px" type="number" step="0.01" value="'+
        (o[1]!=null?o[1]:'')+'" onchange="setPT(\''+k+'\',\''+esc(n)+'\',1,this.value)"></td>'}).join('')+
      '</tr>'}).join('')+'</tbody></table>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.7">'+
    'Targety projektů se každý měsíc mění — X540 měl v červenci 0,37 %, v srpnu 0,63 %. '+
    'Pro měsíc bez vlastních hodnot se použije poslední dřívější měsíc.</div>'}
window.setPT=(k,n,i,v)=>{PTGTM[k]=PTGTM[k]||{};PTGTM[k][n]=PTGTM[k][n]||[null,null];
  PTGTM[k][n][i]=v===''?null:+v;
  try{localStorage.setItem('yf_ptgtm',JSON.stringify(PTGTM))}catch(e){}
  if(qSub===0)renderTop();toast('✓ Uloženo.','#27AE60')};
window.setTgt=(k,f,v)=>{TGTM[k]=TGTM[k]||{};
  TGTM[k][f]=v===''?null:(f==='sales'?Math.round(+v):+v);saveT();
  renderTgt();renderDash();if(qSub===0)renderTop();toast('✓ Uloženo.','#27AE60')};
window.delTgt=k=>{if(!confirm('Smazat '+k+'?'))return;delete TGTM[k];saveT();renderTgt();renderDash()};
window.addTgt=()=>{const v=(document.getElementById('ntM').value||'').trim();
  if(!/^\d{4}-\d{2}$/.test(v)){toast('Zadej ve tvaru 2026-09','#C0392B');return}
  TGTM[v]=TGTM[v]||{t:null,sales:null};saveT();renderTgt();toast('✓ Měsíc přidán.','#27AE60')};
window.setPTgt=(n,f,v)=>{PTGT[n]=PTGT[n]||{};PTGT[n][f]=v===''?null:+v;
  try{localStorage.setItem('yf_ptgt',JSON.stringify(PTGT))}catch(e){}
  if(qSub===0)renderTop();toast('✓ Uloženo.','#27AE60')};
