/* Import: parser denních scrap reportů (.xlsx / .xls)
   Sloupce se hledají podle názvu, nikdy podle pozice — v exportech se posouvají.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const norm=s=>String(s==null?'':s).trim().toLowerCase().replace(/\s+/g,' ');
function findCol(h,names){
  for(const n of names){const i=h.findIndex(x=>norm(x)===norm(n));if(i>=0)return i}
  for(const n of names){const i=h.findIndex(x=>norm(x).includes(norm(n)));if(i>=0)return i}
  return -1}
function toDate(v){
  if(v instanceof Date&&!isNaN(v))return v;
  if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Math.round((v-25569)*86400000));return isNaN(d)?null:d}
  const s=String(v||'').trim();
  let m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  const d=new Date(s);return isNaN(d)?null:d}
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

function parseWB(wb){
  let best=null,bn=0;
  for(const nm of wb.SheetNames){const r=XLSX.utils.sheet_to_json(wb.Sheets[nm],{header:1,defval:null,raw:true});
    if(r.length>bn){bn=r.length;best=r}}
  if(!best||best.length<2)throw new Error('Soubor je prázdný.');
  let hr=0,hdr=best[0];
  for(let i=0;i<Math.min(15,best.length);i++){const row=best[i]||[];
    const fl=row.filter(c=>c!=null&&String(c).trim()!=='').length;
    if(fl>=4&&findCol(row,['EUR','Cost Total','Hodnota'])>=0){hr=i;hdr=row;break}
    if(fl>(hdr||[]).filter(c=>c!=null).length){hr=i;hdr=row}}
  const iE=findCol(hdr,['EUR','Cost Total','Hodnota','Value']);
  const iD=findCol(hdr,['Effective Date','Date','Datum']);
  const iP=findCol(hdr,['Group 2','Projekt','Project','Group']);
  const iL=findCol(hdr,['Location']);
  const iS=findCol(hdr,['Description reason','Reason Code Description','Popis']);
  const iC=findCol(hdr,['Reason']);
  const iQ=findCol(hdr,['Quantity Change','Qty','Množství','Mnozstvi']);
  const iX=findCol(hdr,['Excluded?','Excluded','Vyloučeno']);
  const iI=findCol(hdr,['Item Number','Díl','Dil','Part']);
  if(iE<0)throw new Error('Nenašel jsem sloupec s částkou (EUR / Cost Total).');
  if(iD<0)throw new Error('Nenašel jsem sloupec s datem (Date / Effective Date / Datum).');
  const days={};let used=0,skip=0;
  const bump=(m,k,e,q)=>{if(!k)return;(m[k]=m[k]||{e:0,q:0});m[k].e+=e;m[k].q+=q};
  for(let i=hr+1;i<best.length;i++){const r=best[i];if(!r)continue;
    const eur=Number(r[iE]);if(!isFinite(eur))continue;
    if(iX>=0&&norm(r[iX])==='yes'){skip++;continue}
    if(iC>=0&&String(r[iC]||'').trim()==='20'){skip++;continue}
    const d=toDate(r[iD]);if(!d){skip++;continue}
    const k=iso(d),q=Math.abs(Number(r[iQ])||0);
    const day=days[k]=days[k]||{eur:0,qty:0,p:{}};
    day.eur+=eur;day.qty+=q;
    const pn=(iP>=0?String(r[iP]||'').trim():'')||'Neurčeno';
    const lc=(iL>=0?String(r[iL]||'').trim().toUpperCase():'')||'—';
    const cd=(iC>=0&&iC!==iS)?String(r[iC]||'').trim():'';
    const ds=iS>=0?String(r[iS]||'').trim():'';
    const rk=cd+'§'+(ds||'—');
    const it=iI>=0?String(r[iI]||'').trim():'';
    const P=day.p[pn]=day.p[pn]||{e:0,q:0,l:{},r:{},lr:{},it:{}};
    P.e+=eur;P.q+=q;
    bump(P.l,lc,eur,q);bump(P.r,rk,eur,q);bump(P.lr,lc+'¶'+rk,eur,q);
    if(it)bump(P.it,it,eur,q);used++}
  if(!used)throw new Error('Nenašel jsem žádné použitelné řádky se scrapem.');
  const trim=(m,n)=>{const o={};Object.entries(m).filter(([k,v])=>v.e>0.5)
    .sort((a,b)=>b[1].e-a[1].e).slice(0,n).forEach(([k,v])=>o[k]={e:Math.round(v.e),q:Math.round(v.q)});return o};
  Object.values(days).forEach(d=>{d.eur=Math.round(d.eur);d.qty=Math.round(d.qty);
    Object.values(d.p).forEach(P=>{P.e=Math.round(P.e);P.q=Math.round(P.q);
      P.l=trim(P.l,30);P.r=trim(P.r,40);P.lr=trim(P.lr,60);P.it=trim(P.it,20)})});
  return{days,used,skip}}

function handleFiles(list){
  const files=[...list];if(!files.length)return;
  let done=0,add=0,rep=0;const errs=[];
  files.forEach(f=>{const rd=new FileReader();
    rd.onload=e=>{
      try{const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
        const res=parseWB(wb);
        Object.entries(res.days).forEach(([k,v])=>{if(DB[k])rep++;else add++;
          DB[k]=Object.assign(v,{src:f.name,at:new Date().toISOString()})})}
      catch(err){errs.push(f.name+': '+err.message)}
      if(++done===files.length){save();
        const ks=Object.keys(DB).sort();if(ks.length)curMonth=ks[ks.length-1].slice(0,7);
        renderBar();renderDash();renderDays();
        if(errs.length)toast('⚠ '+errs.join(' | '),'#C0392B');
        else toast('✓ Načteno '+add+' nových dnů'+(rep?', '+rep+' přepsáno':''),'#27AE60')}};
    rd.readAsArrayBuffer(f)})}
const dz=document.getElementById('dropZone'),fi=document.getElementById('fileIn');
dz.onclick=()=>fi.click();fi.onchange=()=>{handleFiles(fi.files);fi.value=''};
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over')}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('over')}));
dz.addEventListener('drop',e=>handleFiles(e.dataTransfer.files));
