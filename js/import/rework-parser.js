/* Import: parser reportů o reworku (.xlsx / .xls)
   Sloupce se hledají podle názvu, nikdy podle pozice — stejně jako u scrapu.
   Pomocníky norm() / findCol() / toDate() / iso() sdílí s js/import/parser.js,
   proto se tenhle soubor musí načítat až za ním.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

/* názvy sloupců, které v exportu hledáme — první shoda vyhrává */
const RWCOL={
  eur:['EUR','Cost Total','Total Cost','Rework Cost','Náklady','Hodnota','Value','Cost'],
  hrs:['Rework Hours','Total Hours','Labor Hours','Hours','Hrs','Hodiny','Čas','Time'],
  date:['Effective Date','Posting Date','Date','Datum','Den'],
  proj:['Group 2','Projekt','Project','Group'],
  loc:['Location','Work Center','Pracoviště','Pracoviste','WC'],
  rsn:['Reason'],
  desc:['Description reason','Reason Code Description','Popis','Defect','Vada'],
  qty:['Quantity Change','Quantity','Qty','Množství','Mnozstvi','Ks','Pieces'],
  item:['Item Number','Part Number','Díl','Dil','Part'],
  excl:['Excluded?','Excluded','Vyloučeno']};

function parseRW(wb){
  let best=null,bn=0;
  for(const nm of wb.SheetNames){const r=XLSX.utils.sheet_to_json(wb.Sheets[nm],{header:1,defval:null,raw:true});
    if(r.length>bn){bn=r.length;best=r}}
  if(!best||best.length<2)throw new Error('Soubor je prázdný.');
  let hr=0,hdr=best[0];
  for(let i=0;i<Math.min(15,best.length);i++){const row=best[i]||[];
    const fl=row.filter(c=>c!=null&&String(c).trim()!=='').length;
    if(fl>=3&&(findCol(row,RWCOL.eur)>=0||findCol(row,RWCOL.hrs)>=0)){hr=i;hdr=row;break}
    if(fl>(hdr||[]).filter(c=>c!=null).length){hr=i;hdr=row}}
  const iE=findCol(hdr,RWCOL.eur),iH=findCol(hdr,RWCOL.hrs),iD=findCol(hdr,RWCOL.date);
  const iP=findCol(hdr,RWCOL.proj),iL=findCol(hdr,RWCOL.loc);
  const iC=findCol(hdr,RWCOL.rsn),iS=findCol(hdr,RWCOL.desc);
  const iQ=findCol(hdr,RWCOL.qty),iI=findCol(hdr,RWCOL.item),iX=findCol(hdr,RWCOL.excl);
  if(iE<0&&iH<0)throw new Error('Nenašel jsem ani částku (EUR), ani hodiny.');
  if(iD<0)throw new Error('Nenašel jsem sloupec s datem (Date / Effective Date / Datum).');
  /* bez sloupce s částkou se EUR dopočítá ze sazby v Nastavení */
  const rate=+SET.rwRate||0,calc=iE<0;
  if(calc&&!rate)throw new Error('Soubor nemá EUR a sazba reworku v Nastavení je nula.');
  const days={};let used=0,skip=0;
  const bump=(m,k,e,h,q)=>{if(!k)return;(m[k]=m[k]||{e:0,h:0,q:0});m[k].e+=e;m[k].h+=h;m[k].q+=q};
  for(let i=hr+1;i<best.length;i++){const r=best[i];if(!r)continue;
    const hrs=iH>=0?Math.abs(Number(r[iH])||0):0;
    const eur=calc?hrs*rate:Number(r[iE]);
    if(!isFinite(eur))continue;
    if(!eur&&!hrs)continue;
    if(iX>=0&&norm(r[iX])==='yes'){skip++;continue}
    const d=toDate(r[iD]);if(!d){skip++;continue}
    const k=iso(d),q=Math.abs(Number(r[iQ])||0);
    const day=days[k]=days[k]||{eur:0,hrs:0,qty:0,p:{},calc:calc};
    day.eur+=eur;day.hrs+=hrs;day.qty+=q;
    const pn=(iP>=0?String(r[iP]||'').trim():'')||'Neurčeno';
    const lc=(iL>=0?String(r[iL]||'').trim().toUpperCase():'')||'—';
    const cd=(iC>=0&&iC!==iS)?String(r[iC]||'').trim():'';
    const ds=iS>=0?String(r[iS]||'').trim():'';
    const rk=cd+'§'+(ds||'—');
    const it=iI>=0?String(r[iI]||'').trim():'';
    const P=day.p[pn]=day.p[pn]||{e:0,h:0,q:0,l:{},r:{},it:{}};
    P.e+=eur;P.h+=hrs;P.q+=q;
    bump(P.l,lc,eur,hrs,q);bump(P.r,rk,eur,hrs,q);
    if(it)bump(P.it,it,eur,hrs,q);used++}
  if(!used)throw new Error('Nenašel jsem žádné použitelné řádky s reworkem.');
  const r1=v=>Math.round(v*10)/10;
  const trim=(m,n)=>{const o={};Object.entries(m).filter(([k,v])=>v.e>0.5||v.h>0.05)
    .sort((a,b)=>b[1].e-a[1].e).slice(0,n).forEach(([k,v])=>o[k]={e:Math.round(v.e),h:r1(v.h),q:Math.round(v.q)});return o};
  Object.values(days).forEach(d=>{d.eur=Math.round(d.eur);d.hrs=r1(d.hrs);d.qty=Math.round(d.qty);
    Object.values(d.p).forEach(P=>{P.e=Math.round(P.e);P.h=r1(P.h);P.q=Math.round(P.q);
      P.l=trim(P.l,30);P.r=trim(P.r,40);P.it=trim(P.it,20)})});
  return{days,used,skip,calc}}

function handleRwFiles(list){
  const files=[...list];if(!files.length)return;
  let done=0,add=0,rep=0,calc=false;const errs=[];
  files.forEach(f=>{const rd=new FileReader();
    rd.onload=e=>{
      try{const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
        const res=parseRW(wb);if(res.calc)calc=true;
        Object.entries(res.days).forEach(([k,v])=>{if(RW[k])rep++;else add++;
          RW[k]=Object.assign(v,{src:f.name,at:new Date().toISOString()})})}
      catch(err){errs.push(f.name+': '+err.message)}
      if(++done===files.length){saveR();
        const ks=Object.keys(RW).sort();if(ks.length)curRwMonth=ks[ks.length-1].slice(0,7);
        renderBar();renderRework();
        if(errs.length)toast('⚠ '+errs.join(' | '),'#C0392B');
        else toast('✓ Rework: načteno '+add+' nových dnů'+(rep?', '+rep+' přepsáno':'')+
          (calc?' · EUR dopočítané sazbou '+fE(SET.rwRate)+'/hod':''),'#27AE60')}};
    rd.readAsArrayBuffer(f)})}

const rdz=document.getElementById('rwDrop'),rfi=document.getElementById('rwFile');
rdz.onclick=()=>rfi.click();rfi.onchange=()=>{handleRwFiles(rfi.files);rfi.value=''};
['dragenter','dragover'].forEach(ev=>rdz.addEventListener(ev,e=>{e.preventDefault();rdz.classList.add('over')}));
['dragleave','drop'].forEach(ev=>rdz.addEventListener(ev,e=>{e.preventDefault();rdz.classList.remove('over')}));
rdz.addEventListener('drop',e=>handleRwFiles(e.dataTransfer.files));
