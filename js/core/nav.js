/* Jádro: navigace mezi záložkami a horní lišta
   
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

window.go=(i,b)=>{curTab=i;
  document.querySelectorAll('.view').forEach((v,j)=>v.classList.toggle('on',j===i));
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  renderBar();
  if(i===0)renderQ();if(i===1)renderDash();if(i===2)renderProj();if(i===3)renderDays();if(i===4)renderSrc();if(i===5)renderTgt()};
window.setQSub=i=>{qSub=i;
  document.querySelectorAll('#v0 .sub').forEach((s,j)=>s.classList.toggle('on',j===i));
  renderBar();renderQ()};
window.setM=m=>{curMonth=m;renderBar();renderDash();
  if(curTab===2)renderProj()};
window.pickProj=p=>{curProj=p;renderProj()};
window.openProj=p=>{curProj=p;curTab=2;
  document.querySelectorAll('.view').forEach((v,j)=>v.classList.toggle('on',j===2));
  document.querySelectorAll('.tab').forEach((x,j)=>x.classList.toggle('on',j===2));
  renderBar();renderProj();window.scrollTo({top:0,behavior:'smooth'})};

function renderBar(){
  const bar=document.getElementById('sbar');
  if(curTab===0){
    bar.innerHTML='<span class="slabel">pohled</span>'+
      ['Rolling 12M','Year over Year','Scrap EUR'].map((t,i)=>
      '<button class="chip '+(qSub===i?'on':'')+'" onclick="setQSub('+i+')">'+t+'</button>').join('')}
  else if(curTab===1||curTab===2){
    let ms=monthsAvail();
    if(curTab===2){const md=Object.keys(MDET).map(m=>mKey(+m));
      ms=[...new Set(ms.concat(md))].sort()}
    if(!ms.length){bar.innerHTML='<span class="slabel">měsíc</span>'+
      '<span style="font-size:13px;color:var(--muted)">zatím žádná denní data — nahraj je v záložce Data</span>';return}
    if(!curMonth||!ms.includes(curMonth))curMonth=ms[ms.length-1];
    bar.innerHTML='<span class="slabel">měsíc</span>'+ms.map(m=>{
      const y=m.slice(0,4),mm=+m.slice(5,7);
      return '<button class="chip b '+(m===curMonth?'on':'')+'" onclick="setM(\''+m+'\')">'+
        MN[mm-1]+' '+y+'</button>'}).join('')}
  else bar.innerHTML='<span class="slabel" style="opacity:.6">Scrap &amp; QLR · Plant 1032</span>'}
