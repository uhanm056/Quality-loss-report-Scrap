/* Import: měsíční historie QLR z listu `overview mng`
   ────────────────────────────────────────────────────────────────────────
   Doteď se `LBL`, `QW`, `QO`, `QT`, `EO` a `EW` dopisovaly ručně do
   `js/data/qlr-history.js` a historie proto končila srpnem — záložka QLR
   byla jediná, která na import vůbec nesahala, takže září v grafu nebylo,
   i když všechno ostatní ho už z exportu mělo.

   Čte se **jen list `overview mng`**, ne dopočet z řádků. Pro uzavřený měsíc
   je autoritativní on: QAD data proti reportu postupně driftují (červen
   o 3 078 €) a `overview mng` drží to, co se vykázalo. Bloky jsou tři —
   `without tests`, `with tests` a `Total` — a všechny dělí na stejné Sales,
   takže jsou za jeden měsíc, ne kumulativně.

   Do historie jde `with tests` (= w/o tests + testy a nájezdy), což je
   vykazovaný QLR, a `without tests`. Dodavatelský scrap (kód 20) stojí až
   v bloku `Total` a do QLR nevstupuje.

   `SV` (saving) tady nevzniká — počítá se až po uzávěrce ve scrap reportu.

   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

/* Řádky bloku čte stejně jako `salesFromOverview`: popisek, EUR, podíl ze
   Sales. Vrací bloky v pořadí, v jakém v listu stojí, i s textem hlavičky —
   zařazení pak rozhoduje text, a když nic neříká, pořadí a velikost. */
function overviewBlocks(wb){
  const rows=shOf(wb,/overview\s*mng/i);
  if(!rows)return null;
  const out=[];
  for(let r=0;r<rows.length;r++){
    const head=(rows[r]||[]).map(c=>String(c==null?'':c)).join(' ').toLowerCase();
    if(!/scrap\s*vs\s*sales|with\s*tests|without\s*tests/.test(head))continue;
    for(let i=r+1;i<rows.length;i++){
      const x=rows[i]||[],lbl=String(x[0]==null?'':x[0]).trim();
      if(!lbl)break;
      if(!isTot(lbl))continue;
      const eur=x[1],pct=x[2];
      if(typeof eur==='number'&&typeof pct==='number'&&pct>0)
        out.push({head:head,eur:eur,pct:pct,row:r});
      break}}
  return out.length?out:null}

/* Zařazení bloků na `wo` / `wt` / `tot`.
   Text má přednost — `without tests` vs `with tests`; pozor, `/with\s*tests/`
   na „without tests" nesedí (po `with` následuje `out`), takže se nepletou.
   Když hlavička nic neříká (bývá jen „Scrap vs Sales"), rozhodne velikost:
   w/o tests ≤ with tests ≤ Total. */
function overviewRoles(bl){
  const r={};
  bl.forEach(b=>{
    const k=/without/.test(b.head)?'wo':(/with\s*tests/.test(b.head)?'wt':null);
    if(k&&!r[k])r[k]=b});
  const rest=bl.filter(b=>b!==r.wo&&b!==r.wt).sort((a,b)=>a.eur-b.eur);
  ['wo','wt','tot'].forEach(k=>{if(!r[k]&&rest.length)r[k]=rest.shift()});
  return r}

/* Podíl ze Sales je v listu desetinný zlomek (0,018333 = 1,8333 %), takže se
   násobí stem — v aplikaci jsou procenta. Spoléhat na to naslepo ale nejde:
   kdyby soubor jednou držel přímo procento, vynásobením stem by graf skočil
   na 183 % a splynul s nulovou čárou, přesně jako kdysi u targetů.

   Měřítko se proto **ověří proti Sales z Pivotu**: `EUR / podíl` musí dát
   obrat. Když Pivot chybí, zbývá jen rozsah — zlomek je pod 0,5. */
function pctScale(eur,pct,sales){
  if(sales>0){
    const off=x=>Math.abs(eur/x-sales)/sales;
    if(off(pct)<0.02)return 100;
    if(off(pct/100)<0.02)return 1;
    return null}
  return pct<0.5?100:(pct<50?1:null)}

/* Je ten měsíc v souboru celý?
   `overview mng` je snímek k datu exportu, takže z neuzavřeného měsíce by do
   grafu spadlo půl měsíce — a rolling 12M by to zkreslilo.

   Nestačí ale ptát se jen „jdou data do posledního dne": na posledních dnech
   měsíce se nemusí vyrábět (víkend), takže by se korektní export odmítl.
   Proto se bere i kalendář — když měsíc podle kalendáře skončil a data
   dojdou na jeho poslední dny, je uzavřený. */
function monthDone(k,days){
  const dd=Object.keys(days||{}).filter(x=>x.startsWith(k)).sort();
  if(!dd.length)return false;
  const last=+dd[dd.length-1].slice(8),dim=daysInMonth(k);
  if(last>=dim)return true;
  return k<curKey()&&last>=dim-3}

/* Kontrola, že se list přečetl správně — ne zdroj čísel.
   Z řádků exportu jdou obě metriky spočítat přesně: `with tests` je w/o tests
   plus testy a nájezdy (`Excluded? = YES`), ověřeno na reálných datech na euro
   (červenec 100 474 + 145 686 = 246 160 €, srpen 94 527 + 140 789 = 235 316 €).

   Jako zdroj se dopočet **nepoužívá** — QAD data proti reportu driftují
   (červen o 3 078 €), takže u uzavřeného měsíce platí `overview mng`.
   Ale jako kontrola je nezaplatitelný: když se bloky listu zařadí špatně,
   čísla se rozejdou o desítky procent a je to hned vidět. */
function histFromRaw(wb,k){
  const sh=pickSheet(wb),rows=sh.rows,hdr=sh.hdr;
  const iE=findCol(hdr,['EUR','Cost Total','Hodnota','Value']);
  const iD=findCol(hdr,['Effective Date','Date','Datum']);
  const iC=findCol(hdr,['Reason']);
  const iX=findCol(hdr,['Excluded?','Excluded','Vyloučeno']);
  if(iE<0||iD<0||iX<0)return null;   /* bez Excluded? se testy oddělit nedají */
  let eo=0,ew=0,n=0;
  for(let i=sh.hr+1;i<rows.length;i++){
    const r=rows[i];if(!r)continue;
    const eur=Number(r[iE]);if(!isFinite(eur))continue;
    const d=toDate(r[iD]);if(!d)continue;
    if(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')!==k)continue;
    n++;
    if(norm(r[iX])==='yes'){ew+=eur;continue}            /* testy a nájezdy */
    if(iC>=0&&String(r[iC]||'').trim()==='20')continue;   /* dodavatel */
    eo+=eur;ew+=eur}
  return n?{eo:Math.round(eo),ew:Math.round(ew)}:null}

/* Kolik se smí lišit. Pro měsíc, za který soubor je, vycházel dopočet na euro;
   pět procent je proto s přehledem nad šumem a přitom hluboko pod tím, co by
   udělala záměna bloků. */
const hNear=(a,b)=>a&&b&&Math.abs(a-b)<=Math.max(Math.abs(b)*0.05,50);

/* Důvody, proč se měsíc nezapsal, které má smysl říct uživateli. Co tady
   není, je normální stav a mlčí se o tom: `nolist` (denní report list
   `overview mng` nemá), `fixed` (měsíc je v ověřeném základu), `run`
   (probíhající měsíc) a `nomonth` (soubor bez použitelného data). */
const HSKIP={
  noblocks:'v listu overview mng nejsou bloky without tests / with tests',
  order:'bloky without a with tests vyšly obráceně — list má jinou stavbu, '+
    'než se čeká, a čísla by šla do grafu naopak',
  scale:'podíl ze Sales nesedí na obrat z Pivotu — nepoznám, jestli je v listu '+
    'zlomek (0,018) nebo procento (1,83), a radši nezapíšu nic',
  gap:'mezi posledním měsícem historie a tímhle měsícem chybí měsíce — '+
    'pole historie musí být spojitá, nahrajte nejdřív ty mezi',
  check:'čísla z listu overview mng nesedí na součet řádků exportu — '+
    'list má jinou stavbu, než se čeká, a nezapsal jsem nic'};

/* Zapíše měsíc do HISTI a překlopí do polí historie. Vrací, co se stalo —
   do hlášky po importu; ta je zároveň jediná kontrola, že se list přečetl
   správně, tak v ní stojí rovnou čísla. */
function applyHist(wb,days){
  const res={month:null,wrote:null,skip:null};
  let bl=null;
  try{bl=overviewBlocks(wb)}catch(e){bl=null}
  if(!bl){res.skip='nolist';return res}

  const sal=parseSalesSheet(wb);
  const k=snapMonth(days,sal);
  if(!k){res.skip='nomonth';return res}
  res.month=k;

  const R=overviewRoles(bl);
  if(!R.wo||!R.wt){res.skip='noblocks';return res}
  /* w/o tests nemůže být větší než with tests — kdyby bylo, zařazení bloků
     je špatně a čísla by šla do grafu obráceně */
  if(R.wo.eur>R.wt.eur+1){res.skip='order';return res}

  const sc=pctScale(R.wt.eur,R.wt.pct,(sal&&sal.total)||0);
  if(sc==null){res.skip='scale';return res}
  const qw=Math.round(R.wt.pct*sc*10000)/10000,qo=Math.round(R.wo.pct*sc*10000)/10000;
  if(!(qw>0&&qw<50&&qo>0&&qo<50)){res.skip='scale';return res}

  const i=hIdx(k);
  if(i<hFixed){res.skip='fixed';return res}      /* ověřený základ se nepřepisuje */
  if(i>LBL.length){res.skip='gap';return res}    /* díra v řadě měsíců */
  /* Probíhající měsíc je normální stav (tak chodí denní reporty), takže se
     o něm mlčí; měsíc, který už podle kalendáře skončil a přesto nemá data
     do konce, je naopak potřeba říct — z něj by do grafu šel půlměsíc. */
  if(!monthDone(k,days)){res.skip=k>=curKey()?'run':'part';return res}

  /* Ověření proti řádkům exportu. Když dopočet nejde (soubor bez `Excluded?`),
     kontrola se vynechá — zdroj je pořád `overview mng`. */
  const calc=histFromRaw(wb,k);
  if(calc&&!(hNear(Math.round(R.wo.eur),calc.eo)&&hNear(Math.round(R.wt.eur),calc.ew))){
    res.skip='check';res.calc=calc;res.read={eo:Math.round(R.wo.eur),ew:Math.round(R.wt.eur)};
    return res}

  const h={at:new Date().toISOString(),src:'mng',
    qw:qw,qo:qo,eo:Math.round(R.wo.eur),ew:Math.round(R.wt.eur),
    qt:(TGTM[k]||{}).t!=null?TGTM[k].t:null};
  HISTI[k]=h;histApply();saveH();
  res.wrote=h;
  return res}
