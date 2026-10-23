/* Záložka 6: nastavení targetů a Sales
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

function renderTgt(){
  const el=document.getElementById('tgtBody');if(!el)return;
  const ks=Object.keys(TGTM).sort();
  el.innerHTML='<table class="tbl"><thead><tr><th>Měsíc</th><th class="num">Target %</th>'+
    '<th class="num">Target + CI %</th><th class="num">Sales EUR</th>'+
    '<th class="num">Cíl v EUR</th><th>Sales jen ke snímku</th><th></th></tr></thead><tbody>'+
    ks.map(function(k){const o=TGTM[k],mm=+k.slice(5,7);
      const eur=(o.t&&o.sales)?Math.round(o.t/100*o.sales):null;
      const eurCi=(o.ci&&o.sales)?Math.round(o.ci/100*o.sales):null;
      return '<tr id="tgr_'+k+'"'+(o.part?' style="background:#FEF9E7"':'')+
      '><td><b>'+MN[mm-1]+' '+k.slice(0,4)+'</b></td>'+
      '<td class="num"><input class="inp" style="width:88px" type="number" step="0.01" value="'+
        (o.t!=null?o.t:'')+'" onchange="setTgt(\''+k+'\',\'t\',this.value)"></td>'+
      '<td class="num"><input class="inp" style="width:88px" type="number" step="0.01" value="'+
        (o.ci!=null?o.ci:'')+'" onchange="setTgt(\''+k+'\',\'ci\',this.value)"></td>'+
      '<td class="num"><input class="inp" style="width:120px" type="number" value="'+
        (o.sales!=null?o.sales:'')+'" onchange="setTgt(\''+k+'\',\'sales\',this.value)"></td>'+
      '<td class="num"><b>'+(eur!=null?fE(eur):'—')+'</b>'+
        (eurCi!=null?'<div style="font-size:11px;color:var(--muted)">s CI '+fE(eurCi)+'</div>':'')+
        '</td>'+
      '<td><label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer">'+
        '<input type="checkbox"'+(o.part?' checked':'')+
        ' onchange="setPart(\''+k+'\',this.checked)">'+
        (o.part?'<b>probíhá</b>':'<span style="color:var(--muted)">celý měsíc</span>')+
        '</label></td>'+
      '<td style="text-align:right"><button class="btn dngr" onclick="delTgt(\''+k+'\')">×</button></td></tr>'}).join('')+
    '</tbody></table>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.7">'+
    '<b>Sales jen ke snímku</b> zaškrtněte, dokud jsou Sales za rozdělaný měsíc — '+
    'aplikace pak scrap a Sales porovnává ke stejnému datu a nepočítá prognózu '+
    'proti celoměsíčnímu cíli. Po uzávěrce doplňte Sales za celý měsíc a odškrtněte.'+
    '</div>'+
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
    'Pro měsíc bez vlastních hodnot se použije poslední dřívější měsíc.</div>';
  renderPSal()}

/* Sales po projektech (`PSAL`). Chodí z listu `Pivot` při importu, ale vidět
   nebyly nikde — přitom se z nich počítá „% ze Sales projektu" v Detailu
   projektu i volba metriky u trendu projektu (p.b. vs. EUR). Bez nich dlaždice
   mlčky přepne na EUR a není poznat proč.

   Součet přes projekty **musí sednout na Sales závodu** z tabulky výš —
   na reálných datech to vychází na euro (červen i červenec přesně, srpen
   o 2 € kvůli zaokrouhlení). Když nesedí, chybí projekt nebo je číslo špatně,
   a napíše se to do řádku `Celkem`. */
function renderPSal(){
  const el=document.getElementById('psalBody');if(!el)return;
  /* měsíce z obojího — ať se dá doplnit i měsíc, který Sales projektů nemá */
  const mks=[...new Set(Object.keys(PSAL).concat(Object.keys(TGTM)))].sort();
  const names=[...new Set(Object.keys(PSAL).flatMap(k=>Object.keys(PSAL[k]))
    .concat(Object.keys(PTGTM).flatMap(k=>Object.keys(PTGTM[k]))))].sort();
  if(!mks.length||!names.length){
    el.innerHTML='<div class="empty">Zatím nejsou žádné projekty ani měsíce.</div>';return}
  const mLab=k=>MO3[+k.slice(5,7)-1]+' '+k.slice(2,4);
  el.innerHTML='<table class="tbl"><thead><tr><th>Projekt</th>'+
    mks.map(k=>'<th class="num">'+mLab(k)+'</th>').join('')+'</tr></thead><tbody>'+
    names.map(n=>'<tr><td><b>'+escH(n)+'</b></td>'+mks.map(k=>
      '<td class="num"><input class="inp" style="width:116px" type="number" value="'+
      ((PSAL[k]||{})[n]!=null?PSAL[k][n]:'')+
      '" onchange="setPS(\''+k+'\',\''+esc(n)+'\',this.value)"></td>').join('')+'</tr>').join('')+
    '<tr style="background:#EEF4FB"><td><b>Celkem</b></td>'+mks.map(function(k){
      const vals=Object.values(PSAL[k]||{});
      if(!vals.length)return '<td class="num" style="color:var(--muted)">—</td>';
      const sum=vals.reduce((a,b)=>a+b,0),tot=(TGTM[k]||{}).sales;
      /* pár eur je zaokrouhlení, víc znamená chybějící projekt */
      const d=tot?sum-tot:null,zle=d!=null&&Math.abs(d)>Math.max(10,tot*0.001);
      return '<td class="num"><b>'+fE(sum)+'</b>'+
        (tot==null?'<div style="font-size:11px;color:var(--muted)">Sales závodu nezadané</div>'
         :zle?'<div style="font-size:11px;color:var(--red)">'+(d>0?'+':'−')+fE(Math.abs(d))+
              ' proti závodu</div>'
         :'<div style="font-size:11px;color:var(--green)">sedí na závod</div>')+'</td>'}).join('')+
    '</tr></tbody></table>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.7">'+
    'Načítá se při importu z listu <b>Pivot</b>, sloupec <code>Sales EUR</code>. '+
    'Počítá se z nich <b>% ze Sales projektu</b> v Detailu projektu a podle toho, '+
    'jestli je aplikace zná, se u <b>trendu projektu</b> volí srovnání v p.b. '+
    'místo v EUR — bez nich vypadá projekt, kterému klesla výroba, jako zlepšený. '+
    'Řádek <b>Celkem</b> hlídá, že součet sedí na Sales závodu z tabulky výš.</div>'}
window.setPS=(k,n,v)=>{PSAL[k]=PSAL[k]||{};
  if(v==='')delete PSAL[k][n];else PSAL[k][n]=Math.round(+v);
  saveP();renderPSal();if(curTab===3)renderProj();toast('✓ Uloženo.','#27AE60')};
window.setPT=(k,n,i,v)=>{PTGTM[k]=PTGTM[k]||{};PTGTM[k][n]=PTGTM[k][n]||[null,null];
  PTGTM[k][n][i]=v===''?null:+v;
  saveP();
  if(qSub===0)renderTop();toast('✓ Uloženo.','#27AE60')};
window.setTgt=(k,f,v)=>{TGTM[k]=TGTM[k]||{};
  TGTM[k][f]=v===''?null:(f==='sales'?Math.round(+v):+v);saveT();
  renderTgt();renderDash();if(qSub===0)renderTop();toast('✓ Uloženo.','#27AE60')};
/* `part` říká, že Sales jsou jen ke snímku z průběhu měsíce, ne za celý měsíc.
   Dřív šel zapsat jen v kódu, takže ručně přidaný měsíc se počítal jako uzavřený. */
window.setPart=(k,v)=>{TGTM[k]=TGTM[k]||{};
  if(v)TGTM[k].part=1;else delete TGTM[k].part;
  saveT();renderTgt();renderBar();renderDash();if(qSub===0)renderTop();
  toast('✓ Uloženo.','#27AE60')};
window.delTgt=k=>{if(!confirm('Smazat '+k+'?'))return;delete TGTM[k];saveT();renderTgt();renderDash()};
window.addTgt=()=>{const v=(document.getElementById('ntM').value||'').trim();
  if(!/^\d{4}-\d{2}$/.test(v)){toast('Zadej ve tvaru 2026-09','#C0392B');return}
  TGTM[v]=TGTM[v]||{t:null,sales:null};saveT();renderTgt();toast('✓ Měsíc přidán.','#27AE60')};
window.setPTgt=(n,f,v)=>{PTGT[n]=PTGT[n]||{};PTGT[n][f]=v===''?null:+v;
  try{localStorage.setItem('yf_ptgt',JSON.stringify(PTGT))}catch(e){}
  if(qSub===0)renderTop();toast('✓ Uloženo.','#27AE60')};

/* Proklik z výstražného pruhu „Chybí target" v Přehledu scrapu.
   Otevře Nastavení a nachystá přesně ten měsíc, který chybí — buď doskočí
   na jeho řádek, nebo předvyplní pole pro přidání měsíce. */
window.openTgt=k=>{
  curTab=7;
  document.querySelectorAll('.view').forEach((v,j)=>v.classList.toggle('on',j===7));
  document.querySelectorAll('.tab').forEach((x,j)=>x.classList.toggle('on',j===7));
  renderBar();renderTgt();
  const row=document.getElementById('tgr_'+k);
  if(row){row.classList.add('hi');
    row.scrollIntoView({behavior:'smooth',block:'center'});
    const inp=row.querySelector('input');if(inp){inp.focus();inp.select()}
    return}
  const nm=document.getElementById('ntM');
  if(nm){nm.value=k;nm.scrollIntoView({behavior:'smooth',block:'center'});nm.focus()}
  toast('Měsíc '+k+' v tabulce ještě není — dej „+ přidat".','#E8A020')};
