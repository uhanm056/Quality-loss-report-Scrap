/* Záložka 4: seznam načtených dnů, záloha a obnova
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

function renderDays(){
  const ks=Object.keys(DB).sort().reverse(),b=document.getElementById('daysBody');
  if(!ks.length){b.innerHTML='<div class="empty">Zatím nejsou načtené žádné dny.</div>';return}
  b.innerHTML='<table class="tbl"><thead><tr><th>Datum</th><th>Soubor</th><th class="num">Scrap EUR</th>'+
    '<th class="num">Kusů</th><th class="num">Projektů</th><th>Detail</th><th></th></tr></thead><tbody>'+
    ks.map(k=>{const h=DB[k].p&&Object.keys(DB[k].p).length;
      return '<tr><td><b>'+k.split('-').reverse().join('.')+'</b></td>'+
      '<td style="color:var(--muted);font-size:12px">'+(DB[k].src||'—')+'</td>'+
      '<td class="num">'+fE(DB[k].eur)+'</td><td class="num">'+fN(DB[k].qty)+'</td>'+
      '<td class="num">'+(h?Object.keys(DB[k].p).length:'—')+'</td>'+
      '<td>'+(h?'<span class="tag g">ano</span>':'<span class="tag n">jen souhrn</span>')+'</td>'+
      '<td style="text-align:right"><button class="btn dngr" onclick="delDay(\''+k+'\')">smazat</button></td></tr>'}).join('')+
    '</tbody></table>'}
window.delDay=k=>{if(!confirm('Smazat den '+k.split('-').reverse().join('.')+'?'))return;
  delete DB[k];save();renderBar();renderDash();renderDays();toast('Den smazán.','#7F8C8D')};
window.wipe=()=>{if(!confirm('Opravdu vymazat všechna denní data? Tohle nejde vrátit.'))return;
  DB={};save();curMonth=null;curProj=null;renderBar();renderDash();renderDays();toast('Vymazáno.','#7F8C8D')};
window.backup=()=>{const b=new Blob([JSON.stringify({db:DB,rw:RW,set:SET},null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download='scrap_zaloha_'+iso(new Date())+'.json';a.click();toast('✓ Záloha stažena.','#27AE60')};
window.restore=inp=>{const f=inp.files[0];if(!f)return;const r=new FileReader();
  r.onload=e=>{try{const j=JSON.parse(e.target.result);if(!j.db)throw new Error('Neplatná záloha');
    DB=j.db;if(j.rw)RW=j.rw;if(j.set)SET=Object.assign(SET,j.set);save();saveR();saveS();
    curMonth=null;curProj=null;curRwMonth=null;
    renderBar();renderDash();renderDays();renderRework();
    toast('✓ Obnoveno '+Object.keys(DB).length+' dnů scrapu'+
      (j.rw?' a '+Object.keys(RW).length+' dnů reworku':'')+'.','#27AE60')}
  catch(err){toast('Chyba: '+err.message,'#C0392B')}inp.value=''};r.readAsText(f)};
window.saveSet=()=>{SET.target=+document.getElementById('sTgt').value||95000;
  SET.workdays=+document.getElementById('sDays').value||21;
  SET.rwTarget=+document.getElementById('sRwTgt').value||0;
  SET.rwRate=+document.getElementById('sRwRate').value||0;
  saveS();renderDash();renderRework();toast('✓ Nastavení uloženo.','#27AE60')};
