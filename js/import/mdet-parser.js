/* Import: měsíční rozpad podle projektů (MDET) z QAD exportu
   ────────────────────────────────────────────────────────────────────────
   Doteď se `MDET` přepisoval ručně do `js/data/monthly-detail.js` a končil
   červencem — srpen měl jen projektové součty a do trendu vad vůbec
   nevstupoval. Tenhle soubor ho staví přímo z nahraného exportu.

   Proč vlastní průchod daty a ne ten z `parser.js`: denní parser řádky
   s kódem 20 (dodavatel) vůbec nenačítá, protože denní přehled je w/o tests.
   MDET ale drží obě metriky vedle sebe — `wt` s dodavatelem, `wo` bez něj —
   takže potřebuje i ty řádky.

   Ukládá se odděleně od zapsaného základu (`MDETI`, klíč `yf_mdet`), aby se
   dalo poznat, co je z importu, a sdílet jen to. Zapsaná data 1–7 zůstávají
   jako záloha pro toho, kdo si nic nenahrál.

   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

/* Kolik položek se u projektu drží. Zapsaný základ měl jen 6 na seznam, což
   je na Pareto málo; víc než tohle už ale nafukuje localStorage i sdílený
   dokument, aniž by to něco přineslo — konec seznamu jsou drobné. */
const MDLIM={L:15,R:25,P:30};

/* měsíc → {projekt:{wt,wo,L,R,P}} ze všech řádků exportu.
   Rok se bere z nejnovějšího řádku a starší roky se přeskočí — `MDET` je
   klíčovaný jen číslem měsíce, takže dva roky v jednom souboru by se sečetly. */
function parseMdet(wb){
  const sh=pickSheet(wb),rows=sh.rows,hdr=sh.hdr;
  const iE=findCol(hdr,['EUR','Cost Total','Hodnota','Value']);
  const iD=findCol(hdr,['Effective Date','Date','Datum']);
  const iP=findCol(hdr,['Group 2','Projekt','Project','Group']);
  const iL=findCol(hdr,['Location']);
  const iS=findCol(hdr,['Description reason','Reason Code Description','Popis']);
  const iC=findCol(hdr,['Reason']);
  const iQ=findCol(hdr,['Quantity Change','Qty','Množství','Mnozstvi']);
  const iX=findCol(hdr,['Excluded?','Excluded','Vyloučeno']);
  if(iE<0||iD<0||iP<0)return null;

  /* první průchod jen kvůli roku */
  let yr=0;
  for(let i=sh.hr+1;i<rows.length;i++){const r=rows[i];if(!r)continue;
    const d=toDate(r[iD]);if(d&&d.getFullYear()>yr)yr=d.getFullYear()}
  if(!yr)return null;

  const out={},dny={};
  const bump=(m,k,wt,wo,q)=>{if(!k)return;const x=m[k]=m[k]||{wt:0,wo:0,q:0};
    x.wt+=wt;x.wo+=wo;x.q+=q};

  for(let i=sh.hr+1;i<rows.length;i++){
    const r=rows[i];if(!r)continue;
    const eur=Number(r[iE]);if(!isFinite(eur))continue;
    if(iX>=0&&norm(r[iX])==='yes')continue;
    const d=toDate(r[iD]);if(!d||d.getFullYear()!==yr)continue;
    const mo=String(d.getMonth()+1);
    (dny[mo]=dny[mo]||{})[d.getDate()]=1;   /* kolik dnů měsíce soubor pokrývá */
    const sup=iC>=0&&String(r[iC]||'').trim()==='20';   /* 20 = dodavatel */
    const wo=sup?0:eur,q=Math.abs(Number(r[iQ])||0),qo=sup?0:q;
    const pn=(String(r[iP]||'').trim())||'Neurčeno';
    const M=out[mo]=out[mo]||{};
    const P=M[pn]=M[pn]||{wt:0,wo:0,l:{},r:{},p:{}};
    P.wt+=eur;P.wo+=wo;
    const lc=(iL>=0?String(r[iL]||'').trim().toUpperCase():'')||'—';
    const cd=(iC>=0&&iC!==iS)?String(r[iC]||'').trim():'';
    const ds=(iS>=0?String(r[iS]||'').trim():'')||'—';
    bump(P.l,lc,eur,wo,qo);
    bump(P.r,cd+'§'+ds,eur,wo,qo);
    bump(P.p,lc+'¶'+ds,eur,wo,qo)}

  if(!Object.keys(out).length)return null;

  /* do tvaru, ve kterém MDET žije: pole seřazená sestupně podle wt */
  const top=(m,n)=>Object.entries(m).sort((a,b)=>b[1].wt-a[1].wt).slice(0,n);
  const res={},cover={};
  Object.entries(out).forEach(([mo,ps])=>{
    cover[mo]=Object.keys(dny[mo]||{}).length;
    const M=res[mo]={};
    Object.entries(ps).forEach(([pn,P])=>{
      M[pn]={wt:Math.round(P.wt),wo:Math.round(P.wo),
        L:top(P.l,MDLIM.L).map(([k,v])=>[k,Math.round(v.wt),Math.round(v.wo),Math.round(v.q)]),
        R:top(P.r,MDLIM.R).map(([k,v])=>{const j=k.indexOf('§');
          return[k.slice(0,j),k.slice(j+1),Math.round(v.wt),Math.round(v.wo),Math.round(v.q)]}),
        P:top(P.p,MDLIM.P).map(([k,v])=>{const j=k.indexOf('¶');
          return[k.slice(0,j),k.slice(j+1),Math.round(v.wt),Math.round(v.wo),Math.round(v.q)]})}})});
  return{year:yr,months:res,dn:cover}}

/* Zapíše rozpad do MDETI a překlopí ho do MDET. Vrací seznam měsíců, které
   se změnily — do hlášky po importu.

   Přepisuje se jen tehdy, když nový soubor pokrývá **aspoň tolik dnů** měsíce
   jako ten, co je uložený. Bez toho by běžný denní report za jeden den přepsal
   rozpad celého měsíce z měsíčního exportu. */
function applyMdet(wb){
  let r=null;
  try{r=parseMdet(wb)}catch(e){return[]}
  if(!r)return[];
  const at=new Date().toISOString(),ch=[];
  Object.entries(r.months).forEach(([mo,d])=>{
    const dn=(r.dn||{})[mo]||0,cur=MDETI[mo];
    if(cur&&dn<(cur.dn||0))return;
    MDETI[mo]={at:at,year:r.year,dn:dn,d:d};ch.push(mo)});
  if(!ch.length)return[];
  mdetApply();saveM();
  return ch}
