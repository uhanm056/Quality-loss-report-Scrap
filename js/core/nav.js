/* Jádro: navigace mezi záložkami a horní lišta
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

window.go=(i,b)=>{curTab=i;
  document.querySelectorAll('.view').forEach((v,j)=>v.classList.toggle('on',j===i));
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  renderBar();
  if(i===0)renderQ();if(i===1)renderDash();if(i===2)renderRework();if(i===3)renderProj();
  if(i===4)renderDays();if(i===5)renderSrc();if(i===6)renderTgt()};
window.setQSub=i=>{qSub=i;
  document.querySelectorAll('#v0 .sub').forEach((s,j)=>s.classList.toggle('on',j===i));
  renderBar();renderQ()};
window.setM=m=>{curMonth=m;renderBar();renderDash();
  if(curTab===3)renderProj()};
window.pickProj=p=>{curProj=p;renderProj()};
window.openProj=p=>{curProj=p;curTab=3;
  document.querySelectorAll('.view').forEach((v,j)=>v.classList.toggle('on',j===3));
  document.querySelectorAll('.tab').forEach((x,j)=>x.classList.toggle('on',j===3));
  renderBar();renderProj();window.scrollTo({top:0,behavior:'smooth'})};

function renderBar(){
  const bar=document.getElementById('sbar');
  if(curTab===0){
    bar.innerHTML='<span class="slabel">pohled</span>'+
      ['Rolling 12M','Year over Year','Scrap EUR'].map((t,i)=>
      '<button class="chip '+(qSub===i?'on':'')+'" onclick="setQSub('+i+')">'+t+'</button>').join('')}
  else if(curTab===1||curTab===3){
    let ms=monthsAvail();
    const md=Object.keys(MDET).map(m=>mKey(+m));
    ms=[...new Set(ms.concat(md).concat(Object.keys(TGTM)))].sort();
    if(!ms.length){bar.innerHTML='<span class="slabel">měsíc</span>'+
      '<span style="font-size:13px;color:var(--muted)">zatím žádná data — nahraj denní report nebo zadej target v Nastavení</span>';return}
    if(!curMonth||!ms.includes(curMonth))curMonth=ms[ms.length-1];
    bar.innerHTML='<span class="slabel">měsíc</span>'+ms.map(m=>{
      const y=m.slice(0,4),mm=+m.slice(5,7);
      return '<button class="chip b '+(m===curMonth?'on':'')+'" onclick="setM(\''+m+'\')">'+
        MN[mm-1]+' '+y+'</button>'}).join('')}
  else if(curTab===2){
    const ms=rwMonths();
    if(!ms.length){bar.innerHTML='<span class="slabel">měsíc</span>'+
      '<span style="font-size:13px;color:var(--muted)">zatím žádná data o reworku — nahraj report níž</span>';return}
    if(!curRwMonth||!ms.includes(curRwMonth))curRwMonth=ms[ms.length-1];
    bar.innerHTML='<span class="slabel">měsíc</span>'+ms.map(m=>{
      const y=m.slice(0,4),mm=+m.slice(5,7);
      return '<button class="chip b '+(m===curRwMonth?'on':'')+'" onclick="setRwM(\''+m+'\')">'+
        MN[mm-1]+' '+y+'</button>'}).join('')}
  else bar.innerHTML='<span class="slabel" style="opacity:.6">Scrap &amp; QLR · Plant 1032</span>'}
