/* Import: targety a Sales z QAD exportu
   ────────────────────────────────────────────────────────────────────────
   Dva zdroje v jednom souboru, oba ověřené na reálném exportu:

   List `Target` — workplan. Dva bloky nad sebou, oba mají řádek na projekt
   a dole souhrn „Target 2026". Blok účtu `641250` je běžný target, blok
   `641250+641260` je přísnější target s CI tasky. Hodnoty jsou desetinné
   (0.008936 = 0,8936 %), takže se násobí stem — v aplikaci jsou targety
   v procentech.

   List `overview mng` — Sales. Přímo tam nejsou, ale v sekcích
   `without tests` a `with tests` je u každého projektu EUR i procento
   ze Sales, takže Sales = EUR / procento. Obě sekce dávají stejný výsledek;
   `with tests` má víc projektů (obsahuje i ty s nulovým scrapem w/o tests).
   Jde o **snímek k datu exportu**, ne o celý měsíc — proto se zapisuje jen
   k měsíci, který v souboru probíhá, a nikdy nepřepíše uzavřený měsíc.

   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

/* název projektu v listu Target → název v aplikaci */
const TPROJ={'G463M':'G463 M','OV51_52':'OV51/52','SK336_1':'SK336/1'};
const tProj=s=>{const n=String(s||'').split(' - ')[0].trim();
  return TPROJ[n]||n.replace(/_/g,'/')};

const TMON=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
/* desetinný podíl → procento na čtyři místa; nula znamená „projekt ještě neběží" */
const tPct=v=>(typeof v==='number'&&isFinite(v)&&v!==0)?Math.round(v*1000000)/10000:null;

const shOf=(wb,re)=>{const n=wb.SheetNames.find(x=>re.test(String(x)));
  return n?XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,raw:true}):null};

/* ── list Target ───────────────────────────────────────────────────────── */

/* řádek s názvy měsíců → {sloupec: index měsíce 0–11}; null, když to není hlavička */
function tHeader(row){
  const map={};
  (row||[]).forEach((c,i)=>{if(i===0||c==null)return;
    const t=norm(c).slice(0,3);const m=TMON.indexOf(t);
    if(m>=0&&!Object.values(map).includes(m))map[i]=m});
  return Object.keys(map).length>=6?map:null}

/* rok bloku — hledá se v pár řádcích nad hlavičkou, ať se nepředpokládá 2026 */
function tYear(rows,hr){
  for(let i=Math.max(0,hr-4);i<hr;i++)
    for(const c of rows[i]||[]){const y=+String(c).trim();
      if(y>=2000&&y<=2100)return y}
  return new Date().getFullYear()}

/* má blok v hlavičce účet se sčítáním (641250+641260)? → je to target s CI */
function tHasCI(rows,hr){
  for(let i=Math.max(0,hr-4);i<hr;i++)
    if((rows[i]||[]).some(c=>/^\s*\d{4,}\s*\+\s*\d{4,}\s*$/.test(String(c))))return true;
  return false}

/* {months:{'2026-09':{t,ci}}, proj:{'2026-09':{'G463 M':[t,ci]}}} */
function parseTgtSheet(wb){
  const rows=shOf(wb,/^\s*target\s*$/i);
  if(!rows)return null;
  const out={months:{},proj:{}},blocks=[];

  for(let r=0;r<rows.length;r++){
    const map=tHeader(rows[r]);if(!map)continue;
    const year=tYear(rows,r),ci=tHasCI(rows,r);
    const proj={},tot={};
    for(let i=r+1;i<rows.length;i++){
      const row=rows[i]||[],lbl=String(row[0]==null?'':row[0]).trim();
      if(!lbl){if(Object.keys(proj).length)break;continue}
      if(tHeader(row))break;                       /* začal další blok */
      const isTot=/^total|^target\b/i.test(lbl);
      const dst=isTot?tot:(proj[tProj(lbl)]=proj[tProj(lbl)]||{});
      Object.entries(map).forEach(([col,m])=>{const v=tPct(row[+col]);
        if(v!=null)dst[year+'-'+String(m+1).padStart(2,'0')]=v});
      if(isTot)break;                              /* souhrn blok uzavírá */
    }
    blocks.push({ci:ci,proj:proj,tot:tot});
    if(blocks.length>=2)break}

  if(!blocks.length)return null;
  /* když se účet s CI nerozpozná, je druhý blok ten s CI — tak je list stavěný */
  const base=blocks.find(b=>!b.ci)||blocks[0];
  const cib=blocks.find(b=>b.ci)||(blocks.length>1?blocks[1]:null);

  Object.entries(base.tot).forEach(([k,v])=>{out.months[k]={t:v}});
  if(cib)Object.entries(cib.tot).forEach(([k,v])=>{
    out.months[k]=out.months[k]||{};out.months[k].ci=v});

  Object.entries(base.proj).forEach(([p,ms])=>Object.entries(ms).forEach(([k,v])=>{
    (out.proj[k]=out.proj[k]||{})[p]=[v,null]}));
  if(cib)Object.entries(cib.proj).forEach(([p,ms])=>Object.entries(ms).forEach(([k,v])=>{
    const o=out.proj[k]=out.proj[k]||{};o[p]=o[p]||[null,null];o[p][1]=v}));
  return out}

/* ── list overview mng → Sales ─────────────────────────────────────────── */

/* {total, proj:{'G463 M':1629743}} — Sales = EUR / procento ze Sales */
function parseSalesSheet(wb){
  const rows=shOf(wb,/overview\s*mng/i);
  if(!rows)return null;
  const proj={};let total=null;
  for(let r=0;r<rows.length;r++){
    if(!/scrap\s*vs\s*sales/i.test(String((rows[r]||[])[0]||'')))continue;
    for(let i=r+1;i<rows.length;i++){
      const row=rows[i]||[],lbl=String(row[0]==null?'':row[0]).trim();
      if(!lbl)break;
      const eur=row[1],pct=row[2];
      const s=(typeof eur==='number'&&typeof pct==='number'&&eur>0&&pct>0)
        ?Math.round(eur/pct):null;
      if(/^total$/i.test(lbl)){if(s&&total==null)total=s;break}
      if(s&&proj[lbl]==null)proj[lbl]=s}}
  return (total||Object.keys(proj).length)?{total:total,proj:proj}:null}

/* ── zápis do aplikace ─────────────────────────────────────────────────── */

/* Workplan je autoritativní, takže targety se přepisují vždy. Sales jsou
   jen snímek k datu exportu — zapíšou se pouze k měsíci, který v souboru
   probíhá, a uzavřený měsíc se jimi nikdy nepřepíše. */
function applyTgt(wb,days){
  const t=parseTgtSheet(wb),sal=parseSalesSheet(wb);
  const res={months:0,proj:0,sales:null,snap:null,stale:[]};
  if(!t&&!sal)return res;

  if(t){
    Object.entries(t.months).forEach(([k,v])=>{
      const o=TGTM[k]=TGTM[k]||{};
      if(v.t!=null)o.t=v.t;
      if(v.ci!=null)o.ci=v.ci;
      res.months++});
    Object.entries(t.proj).forEach(([k,ps])=>{
      const o=PTGTM[k]=PTGTM[k]||{};
      Object.entries(ps).forEach(([p,v])=>{
        const cur=o[p]||[null,null];
        o[p]=[v[0]!=null?v[0]:cur[0],v[1]!=null?v[1]:cur[1]];res.proj++})})}

  /* měsíc snímku = poslední měsíc, ke kterému jsou v souboru data */
  const ks=Object.keys(days||{}).sort();
  const snap=ks.length?ks[ks.length-1].slice(0,7):null;
  if(sal&&snap){
    const last=+ks[ks.length-1].slice(8),dim=daysInMonth(snap);
    const part=last<dim;
    const o=TGTM[snap]=TGTM[snap]||{};
    /* uzavřený měsíc má Sales za celý měsíc — snímkem by se pokazily */
    if(sal.total&&(o.sales==null||o.part||!part)){
      o.sales=sal.total;res.sales=sal.total;res.snap=snap;
      if(part)o.part=1;else delete o.part}
    if(Object.keys(sal.proj).length&&(!PSAL[snap]||o.part||!part))
      PSAL[snap]=Object.assign({},sal.proj)}

  /* Sales dá overview jen k probíhajícímu měsíci. Když je nějaký dřívější
     měsíc v datech už kompletní, ale v Nastavení má pořád snímkové Sales,
     počítal by se cíl v EUR z menšího obratu — na to je potřeba upozornit. */
  Object.keys(TGTM).forEach(k=>{
    if(!TGTM[k].part||k===snap)return;
    const dd=ks.filter(x=>x.startsWith(k));
    if(dd.length&&+dd[dd.length-1].slice(8)>=daysInMonth(k))res.stale.push(k)});

  saveT();saveP();
  return res}
