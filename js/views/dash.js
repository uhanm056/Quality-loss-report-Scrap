/* Záložka 1: přehled scrapu — měsíční výsledek proti targetu, tempo a prognóza
   Cíl v EUR vychází z tabulky „Měsíční targety a Sales" v Nastavení.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const fPB=v=>(v>0?'+':'−')+Math.abs(v).toFixed(2)+' p.b.';
/* jméno projektu jako proklik do Detailu projektu */
const projLink=p=>!p?'<span style="color:var(--muted)">—</span>':
  '<b style="color:var(--mid);cursor:pointer;text-decoration:underline dotted" '+
  'title="otevřít detail projektu" onclick="openProj(\''+esc(p)+'\')">'+p+'</b>';

/* měsíční výsledek — cíl, skutečnost, rezerva, trend, odhad celého měsíce */
function dashMonth(R){
  const over=R.pb!=null&&R.pb>0;
  const near=R.pb!=null&&!over&&R.pb>-0.05;
  let cls,ic,hd,tx;
  if(R.pct==null||R.target==null){cls='warn';ic='📋';hd='Chybí target nebo Sales';
    tx='Pro '+R.label+' není v Nastavení zadaný target v % nebo Sales za měsíc. '+
      'Doplňte je a dopočítá se cíl v EUR i porovnání.'}
  else if(over){cls='bad';ic='⛔';hd='Jsme nad cílem';
    tx='Skutečnost <b>'+R.pct.toFixed(3)+' %</b> ze Sales proti cíli <b>'+R.target.toFixed(2)+' %</b> — '+
      '<b>'+R.pb.toFixed(2)+' p.b. nad</b>. Do cíle chybí ušetřit <b>'+fE(-R.rez)+'</b>.'}
  else if(near){cls='warn';ic='⚠️';hd='Cíl je na hraně';
    tx='Skutečnost <b>'+R.pct.toFixed(3)+' %</b> proti cíli <b>'+R.target.toFixed(2)+' %</b> — '+
      'rezerva už je jen <b>'+fE(R.rez)+'</b>.'}
  else{cls='ok';ic='✅';hd=R.partial?'Držíme tempo':'Skončili jsme pod cílem';
    tx='Skutečnost <b>'+R.pct.toFixed(3)+' %</b> ze Sales proti cíli <b>'+R.target.toFixed(2)+' %</b> — '+
      '<b>'+Math.abs(R.pb).toFixed(2)+' p.b. pod</b>. Rezerva <b>'+fE(R.rez)+'</b>.'}
  if(R.partial&&R.pct!=null)tx+=' Měsíc probíhá — scrap i Sales jsou ke stejnému snímku dat.';

  /* trend proti předchozímu měsíci */
  let trend='—',tsub='předchozí měsíc neznám',tcls='b';
  if(R.prevPct!=null&&R.pct!=null){const d=R.pct-R.prevPct;
    trend=fPB(d);tcls=d>0?'r':'g';
    tsub=R.prevLabel+' '+R.prevPct.toFixed(3)+' % → '+R.pct.toFixed(3)+' %'}

  return '<div class="status '+cls+'"><div class="st-i">'+ic+'</div>'+
    '<div class="st-t"><h2>'+hd+' — '+R.label+'</h2><p>'+tx+'</p></div>'+
    (R.eur!=null?'<div class="st-n"><div class="big">'+fE(R.eur)+'</div>'+
      '<div class="l">scrap w/o tests</div></div>':'')+'</div>'+
  '<div class="grid4">'+
    '<div class="kpi b"><div class="kpi-l">Cíl v EUR — '+R.label+'</div>'+
      '<div class="kpi-v">'+(R.cil!=null?fE(R.cil):'—')+'</div>'+
      '<div class="kpi-s">'+(R.cil!=null?R.target.toFixed(2)+' % ze Sales '+fE(R.sales):
        'chybí target nebo Sales')+'</div></div>'+
    '<div class="kpi a"><div class="kpi-l">Skutečnost</div>'+
      '<div class="kpi-v">'+(R.eur!=null?fE(R.eur):'—')+'</div>'+
      '<div class="kpi-s">'+(R.pct!=null?R.pct.toFixed(3)+' % ze Sales · ':'')+
      'zdroj: '+(R.src||'—')+'</div></div>'+
    '<div class="kpi '+(R.rez==null?'b':(R.rez<0?'r':'g'))+'">'+
      '<div class="kpi-l">'+(R.rez!=null&&R.rez<0?'Chybí do cíle':'Rezerva do cíle')+'</div>'+
      '<div class="kpi-v">'+(R.rez!=null?fE(Math.abs(R.rez)):'—')+'</div>'+
      '<div class="kpi-s">'+(R.rez!=null?(R.rez<0?'o tolik jsme nad cílem':
        'tolik ještě zbývá do cíle'):'—')+'</div></div>'+
    '<div class="kpi '+tcls+'"><div class="kpi-l">Trend proti minulému měsíci</div>'+
      '<div class="kpi-v">'+trend+'</div><div class="kpi-s">'+tsub+'</div></div></div>'}

/* odhad celého měsíce — jen u probíhajícího měsíce a s výslovným předpokladem */
function dashEstimate(R){
  let est='';
  if(R.partial&&R.pct!=null&&R.prevKey&&TGTM[R.prevKey].sales){
    const ps=TGTM[R.prevKey].sales,fEur=R.pct/100*ps,fCil=R.target/100*ps;
    est='<div class="panel"><div class="ph"><span>Odhad celého měsíce</span>'+
      '<span style="font-weight:600;opacity:.85">předpoklad: Sales jako '+R.prevLabel+
      ' ('+fE(ps)+')</span></div><div class="pb" style="font-size:14px;line-height:1.8">'+
      'Kdyby srpnové tempo <b>'+R.pct.toFixed(3)+' %</b> vydrželo do konce měsíce a Sales '+
      'dosáhly úrovně '+R.prevLabel+', skončil by '+R.label+' zhruba na <b>'+fE(fEur)+'</b> '+
      'proti cíli <b>'+fE(fCil)+'</b> — rezerva kolem <b>'+fE(fCil-fEur)+'</b>.'+
      '<div style="font-size:12px;color:var(--muted);margin-top:10px">'+
      'Tohle je jediné číslo na stránce, které je odhad. Skutečné Sales za '+R.label+
      ' zatím neznáme — jakmile je doplníte v Nastavení, cíl v EUR i rezerva se přepočítají samy.'+
      '</div></div></div>'}
  return est}

/* kumulativ roku — kolik chybí nebo zbývá do součtu měsíčních cílů */
function dashYear(curKey){
  const Y=yearSum();if(!Y.rows.length)return '';
  return '<div class="panel"><div class="ph"><span>Kumulativ 2026 — cíl vs skutečnost</span>'+
    '<span style="font-weight:600;opacity:.85">cíl v EUR = target % × Sales</span></div>'+
    '<div class="pb" style="overflow-x:auto">'+
    '<table class="tbl"><thead><tr><th>Měsíc</th><th class="num">Target %</th>'+
    '<th class="num">Skutečnost %</th><th class="num">Cíl EUR</th>'+
    '<th class="num">Skutečnost EUR</th><th class="num">Rezerva</th></tr></thead><tbody>'+
    Y.rows.map(r=>'<tr class="'+(r.key===curKey?'hi':'')+'">'+
      '<td><b>'+r.label+'</b>'+(r.partial?' <span class="tag n">probíhá</span>':'')+'</td>'+
      '<td class="num" style="color:var(--muted)">'+r.target.toFixed(2)+' %</td>'+
      '<td class="num"><b>'+r.pct.toFixed(3)+' %</b></td>'+
      '<td class="num" style="color:var(--muted)">'+fE(r.cil)+'</td>'+
      '<td class="num">'+fE(r.eur)+'</td>'+
      '<td class="num"><span class="tag '+(r.rez<0?'r':'g')+'">'+(r.rez<0?'▲ ':'▼ ')+
        fE(Math.abs(r.rez))+'</span></td></tr>').join('')+
    '<tr style="border-top:2px solid var(--border)"><td><b>Celkem</b></td>'+
      '<td class="num" style="color:var(--muted)">'+Y.tgt.toFixed(3)+' %</td>'+
      '<td class="num"><b>'+Y.pct.toFixed(3)+' %</b></td>'+
      '<td class="num" style="color:var(--muted)"><b>'+fE(Y.cil)+'</b></td>'+
      '<td class="num"><b>'+fE(Y.eur)+'</b></td>'+
      '<td class="num"><span class="tag '+(Y.rez<0?'r':'g')+'"><b>'+(Y.rez<0?'▲ ':'▼ ')+
        fE(Math.abs(Y.rez))+'</b></span></td></tr>'+
    '</tbody></table>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:12px;line-height:1.7">'+
    (Y.rez>=0?'Proti součtu měsíčních cílů jsme <b>'+fE(Y.rez)+'</b> pod. ':
      'Proti součtu měsíčních cílů nám chybí <b>'+fE(-Y.rez)+'</b>. ')+
    'Rezerva je rozdíl cíle a skutečnosti — saving ve scrap reportu se může o pár set EUR lišit, '+
    'protože ho počítá až po uzávěrce.</div></div></div>'}

/* ── Poslední den: zlepšili jsme se, nebo zhoršili, a na čem ──────────── */
function dayToggle(){
  return '<div class="seg">'+
    ['e','q'].map((v,i)=>'<button class="sbtn '+(dayU===v?'on':'')+'" onclick="setDayU(\''+v+'\')">'+
      (v==='e'?'EUR':'€ na kus')+'</button>').join('')+'</div>'}

/* pruh se změnou proti průměru předchozích dnů */
function dayDelta(C,n){
  if(C.d==null)return '<span class="tag n">první den s daty</span>';
  const lep=!C.worse;
  return '<span class="tag '+(lep?'g':'r')+'" style="font-size:13px;padding:5px 12px">'+
    (lep?'▼ lepší o ':'▲ horší o ')+dayFmt(Math.abs(C.d))+
    ' ('+(C.pct>0?'+':'−')+Math.abs(C.pct).toFixed(0)+' %)</span>'+
    '<div class="kpi-s" style="margin-top:6px">proti průměru předchozích '+n+' dnů '+
    dayFmt(C.avg)+'</div>'}

function dashToday(m){
  const ks=daysOf(m);if(!ks.length)return '';
  const i=ks.length-1,k=ks[i],C=dayCompare(ks,i,7),n=Math.min(7,i);
  const tot=dayEur(k),qty=dayQty(k),per=dayPer(k);
  const top=dayBreak(k,'r').slice(0,3),mx=top.length?top[0][1].e:0;
  const projs=dayProjects(k);
  const cls=C.d==null?'b':(C.worse?'r':'g');
  const den=k.split('-').reverse().join('.');
  return '<div class="panel"><div class="ph"><span>Poslední den · '+den+
    ' &nbsp;<span style="font-weight:600;opacity:.8">· proti průměru předchozích dnů</span></span>'+
    dayToggle()+'</div><div class="pb"><div class="two" style="gap:20px">'+
    '<div class="kpi '+cls+'" style="min-height:150px">'+
      '<div class="kpi-l">Scrap '+den+'</div>'+
      '<div class="kpi-v" style="font-size:38px">'+dayFmt(dayVal(k))+'</div>'+
      '<div style="margin-top:10px">'+dayDelta(C,n)+'</div>'+
      '<div class="kpi-s" style="margin-top:8px">'+fE(tot)+' · '+fN(qty)+' ks'+
        (per!=null?' · '+fEs(per)+' na kus':'')+
        (projs.length?' · '+projs.length+' '+(projs.length===1?'projekt':
          (projs.length<5?'projekty':'projektů')):'')+'</div></div>'+
    '<div><div class="kpi-l" style="margin-bottom:10px">Nejdražší vady toho dne</div>'+
      (top.length?'<table class="tbl"><tbody>'+top.map((r,j)=>{
        const v=r[1],pr=topProj(v),cd=rsnCode(r[0]);
        return '<tr'+(j===0?' class="hi"':'')+'>'+
        '<td style="width:26px"><b style="color:'+(j===0?'#C0392B':'#7F8C8D')+'">'+(j+1)+'</b></td>'+
        '<td><b>'+rsnName(r[0])+'</b>'+(cd?' <span class="code">'+cd+'</span>':'')+
          '<div class="minib"><div class="minif '+(j===0?'top':'')+'" style="width:'+
          Math.round(v.e/mx*100)+'%"></div></div></td>'+
        '<td style="white-space:nowrap">'+projLink(pr)+'</td>'+
        '<td class="num">'+fE(v.e)+'</td>'+
        '<td class="num" style="color:var(--muted)">'+(tot?Math.round(v.e/tot*100):0)+' %</td>'+
        '</tr>'}).join('')+'</tbody></table>':
        '<div class="empty" style="padding:18px">Report za tenhle den nemá rozpad na vady.</div>')+
      '</div></div></div></div>'}

/* ── Den po dni: tabulka s rozbalením ────────────────────────────────── */
function dayMini(rows,tot,titul,typ){
  if(!rows.length)return '<div><div class="kpi-l" style="margin-bottom:6px">'+titul+
    '</div><div style="font-size:12px;color:var(--muted)">bez detailu</div></div>';
  return '<div><div class="kpi-l" style="margin-bottom:6px">'+titul+'</div>'+
    '<table class="tbl">'+rows.slice(0,5).map(r=>{const v=r[1];
      const nm=typ==='r'?rsnName(r[0]):(typ==='l'?locName(r[0]):r[0]);
      const pr=typ!=='p'?topProj(v):null;
      return '<tr><td><b>'+nm+'</b>'+(pr?' <span style="color:var(--muted);font-size:11px">'+
        pr+'</span>':'')+'</td><td class="num">'+fE(v.e)+'</td>'+
        '<td class="num" style="color:var(--muted)">'+(tot?Math.round(v.e/tot*100):0)+' %</td></tr>'}).join('')+
    '</table></div>'}

function dashDays(m){
  const ks=daysOf(m);if(ks.length<2)return '';
  const rows=ks.map((k,i)=>({k:k,i:i,v:dayVal(k),C:dayCompare(ks,i,7),
    prev:i>0?dayVal(ks[i-1]):null,top:dayTopDefect(k)}));
  return '<div class="panel"><div class="ph">'+
    '<span>Den po dni — '+MN[+m.slice(5,7)-1]+' '+m.slice(0,4)+
    ' &nbsp;<span style="font-weight:600;opacity:.8">· červeně dny o čtvrtinu horší '+
    'než průměr · klikni na projekt pro detail</span></span>'+
    dayToggle()+'</div><div class="pb" style="overflow-x:auto">'+
    '<table class="tbl"><thead><tr><th>Datum</th>'+
      '<th class="num">'+(dayU==='e'?'Scrap':'EUR / ks')+'</th>'+
      '<th class="num">Proti předchozímu dni</th>'+
      '<th class="num">Proti průměru 7 dnů</th>'+
      '<th class="num">Kusů</th><th>Hlavní vada</th><th>Projekt</th>'+
      '<th style="width:110px"></th></tr></thead><tbody>'+
    rows.slice().reverse().map(r=>{
      const dP=r.prev!=null&&r.v!=null?r.v-r.prev:null;
      const op=openDay===r.k;
      /* den o čtvrtinu horší než průměr posledních dnů se obarví */
      const spatny=r.C.pct!=null&&r.C.pct>25;
      let out='<tr class="'+(op||spatny?'hi':'')+'">'+
      '<td><b>'+r.k.split('-').reverse().join('.')+'</b></td>'+
      '<td class="num"><b>'+dayFmt(r.v)+'</b></td>'+
      '<td class="num">'+(dP==null?'<span class="tag n">—</span>':
        '<span class="tag '+(dP>0?'r':(dP<0?'g':'n'))+'">'+(dP>0?'▲ +':(dP<0?'▼ ':''))+
        dayFmt(Math.abs(dP))+'</span>')+'</td>'+
      '<td class="num">'+(r.C.d==null?'<span class="tag n">—</span>':
        '<span class="tag '+(r.C.worse?'r':'g')+'">'+(r.C.worse?'▲ +':'▼ ')+
        Math.abs(r.C.pct).toFixed(0)+' %</span>')+'</td>'+
      '<td class="num" style="color:var(--muted)">'+fN(dayQty(r.k))+'</td>'+
      '<td>'+(r.top?'<b>'+r.top.name+'</b>'+(r.top.code?' <span class="code">'+r.top.code+
        '</span>':''):'<span style="color:var(--muted)">—</span>')+'</td>'+
      '<td>'+(r.top&&r.top.proj?projLink(r.top.proj)+
        '<span style="color:var(--muted);font-size:11px"> · '+Math.round(r.top.share*100)+
        ' % dne</span>':'<span style="color:var(--muted)">—</span>')+'</td>'+
      '<td style="text-align:right"><button class="btn" onclick="toggleDay(\''+r.k+'\')">'+
        (op?'▲ skrýt':'▼ rozpad')+'</button></td></tr>';
      if(op){const t=dayEur(r.k);
        out+='<tr><td colspan="8" style="background:var(--bg)">'+
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:6px 2px">'+
          dayMini(dayBreak(r.k,'r'),t,'Vady','r')+
          dayMini(dayProjects(r.k),t,'Projekty','p')+
          dayMini(dayBreak(r.k,'l'),t,'Pracoviště','l')+
          '</div></td></tr>'}
      return out}).join('')+
    '</tbody></table></div></div>'}

/* denní tempo — jen z nahraných denních reportů */
function dashDaily(m,R){
  const ks=daysOf(m);
  if(!ks.length)return '<div class="panel"><div class="ph"><span>Denní tempo</span></div>'+
    '<div class="pb"><div class="empty" style="padding:26px">'+
    '<b>Pro '+R.label+' nejsou nahrané denní reporty.</b><br>'+
    'Měsíční výsledek nahoře je z jiného zdroje ('+(R.src||'měsíční data')+'). Denní tempo, průběh po dnech '+
    'a rozpad na projekty se doplní, jakmile nahrajete denní reporty v záložce '+
    '<b>Data &amp; import</b>.</div></div></div>';
  const n=ks.length,tot=sumM(m),qty=qtyM(m),per=tot/n;
  const P=pace(ks,m),fc=P.ok?tot/P.share:null;
  const cil=R.cil,allow=cil!=null&&P.ok?cil*P.share:null;
  const limit=cil!=null&&P.ok?cil/P.exp:null;
  const last=DB[ks[n-1]],prev=n>1?DB[ks[n-2]]:null,dL=prev?last.eur-prev.eur:0;
  const dw=n===1?'den':(n<5?'dny':'dnů');
  const kdy=P.done?'měsíc je kompletní · '+P.dim+' dnů':
    'k '+P.last+'. dni z '+P.dim+' · měsíc z '+Math.round(P.share*100)+' %';
  const rid=P.ok?'':'<div class="warnbox"><span style="font-size:26px">🕳️</span><div>'+
    '<b>Nahrané dny nepokrývají celý měsíc.</b> Máte '+P.n+' '+dw+' k '+P.last+'. dni, '+
    'takže chybějící dny nejsou nuly — prognózu ani povolené tempo z toho nepočítám. '+
    'Doplňte zbylé denní reporty v záložce <b>Data &amp; import</b>.</div></div>';
  const nd=daysNoDetail(m);
  const warn=nd.length?'<div class="warnbox"><span style="font-size:26px">⚠️</span><div><b>'+
    nd.length+' '+(nd.length===1?'den nemá':'dnů nemá')+' uložený detail.</b> Byly načtené starší verzí. '+
    'Přetáhněte je znovu v záložce Data — rozpad na pracoviště a příčiny se doplní.<br>'+
    '<span style="font-size:12px;opacity:.85">'+nd.map(k=>k.split('-').reverse().join('.')).join(', ')+
    '</span></div></div>':'';
  return warn+rid+
  '<div class="grid4">'+
  '<div class="kpi '+(limit!=null&&last.eur>limit?'r':'g')+'"><div class="kpi-l">Poslední den · '+
    ks[n-1].split('-').reverse().join('.')+'</div><div class="kpi-v">'+fE(last.eur)+'</div>'+
    '<div class="kpi-s">'+(prev?'<span class="tag '+(dL>0?'r':'g')+'">'+(dL>0?'▲':'▼')+' '+fE(Math.abs(dL))+
    '</span> proti předchozímu':'první den')+'</div></div>'+
  '<div class="kpi '+(allow!=null&&tot>allow?'r':'g')+'"><div class="kpi-l">'+
    (allow!=null?'Kumulace vs povolené tempo':'Kumulace za nahrané dny')+'</div>'+
    '<div class="kpi-v">'+(allow!=null?(tot>allow?'+':'')+fE(tot-allow):fE(tot))+'</div>'+
    '<div class="kpi-s">'+(allow!=null?'povoleno k dnešku '+fE(allow):
      (cil==null?'bez cíle v EUR':'dny nepokrývají celý měsíc'))+'</div></div>'+
  '<div class="kpi b"><div class="kpi-l">Průměr na den s výrobou</div><div class="kpi-v">'+fE(per)+'</div>'+
    '<div class="kpi-s">'+n+' '+dw+' s daty'+(limit!=null?' · limit '+fE(limit)+' / den':'')+
    ' · '+fN(qty)+' ks</div></div>'+
  '<div class="kpi '+(cil!=null&&!R.partial&&fc!=null&&fc>cil?'r':'b')+'">'+
    '<div class="kpi-l">'+(P.done?'Skutečnost za měsíc':'Prognóza konce měsíce')+'</div>'+
    '<div class="kpi-v">'+(fc!=null?fk(fc):'—')+'</div><div class="kpi-s">'+
    (fc!=null?kdy+(cil!=null&&!R.partial?' · cíl '+fk(cil):''):
      'chybí dny — '+P.n+' '+dw+' k '+P.last+'. dni z '+P.dim)+'</div></div></div>'+
  (R.partial&&cil!=null&&fc!=null?'<div class="warnbox"><span style="font-size:26px">📐</span><div>'+
    '<b>Prognózu z denního tempa neporovnávám s cílem v EUR.</b> Cíl '+fE(cil)+
    ' platí ke Sales '+fE(R.sales)+', což je snímek k probíhajícímu měsíci — '+
    'prognóza je za celý měsíc. Držte se porovnání v % ze Sales nahoře.</div></div>':'')+
  '<div class="panel"><div class="ph"><span>Denní vývoj a kumulace k cíli</span>'+
    '<div class="legend" style="color:rgba(255,255,255,.85)">'+
    '<span><span class="sw" style="background:#5DADE2"></span>den</span>'+
    '<span><span class="dsh" style="background:#1B3A5C"></span>průměr 7 dnů</span>'+
    '<span><span class="dsh" style="background:#E8A020"></span>kumulace</span>'+
    (cil!=null?'<span><span class="dsh" style="background:#C0392B"></span>povolené tempo</span>':'')+
    '</div></div>'+
    '<div class="pb"><div class="chw" style="height:250px"><canvas id="cDay"></canvas></div></div></div>'+
  '<div class="panel"><div class="ph"><span>Projekty — '+R.label+'</span>'+
    '<span style="font-weight:600;opacity:.85">klikni na projekt pro detailní rozpad →</span></div>'+
    '<div class="pb"><div style="display:flex;flex-direction:column;gap:9px" id="lProj"></div></div></div>'}

function renderDash(){
  const box=document.getElementById('dashBody'),m=curMonth;
  if(!m){
    box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
      '<div style="font-size:44px;margin-bottom:10px">📊</div>'+
      '<b>Zatím není co ukázat.</b><br>Nahrajte denní report v záložce '+
      '<b>Data &amp; import</b> nebo zadejte target a Sales v <b>Nastavení</b>.'+
      '</div></div></div>';return}
  const R=monthResult(m);
  if(!R){box.innerHTML='<div class="panel"><div class="pb"><div class="empty">'+
    '<b>Pro '+mLabel(m)+' nemám ani target, ani scrap.</b><br>'+
    'Doplňte měsíc v <b>Nastavení</b> nebo nahrajte denní report.</div></div></div>';return}
  box.innerHTML=dashMonth(R)+dashToday(m)+dashEstimate(R)+dashYear(m)+dashDaily(m,R)+dashDays(m);

  const ks=daysOf(m);if(!ks.length)return;
  const P=pace(ks,m),cil=R.cil,limit=cil!=null&&P.ok?cil/P.exp:null;
  let run=0;const cum=ks.map(k=>run+=DB[k].eur);
  const ds=[
    {type:'bar',label:'Den',data:ks.map(k=>DB[k].eur),
     backgroundColor:ks.map(k=>limit!=null&&DB[k].eur>limit?'#E59A94':'#9CC5E8'),
     borderRadius:5,maxBarThickness:60,yAxisID:'y',order:3},
    {type:'line',label:'Kumulace',data:cum,borderColor:'#E8A020',backgroundColor:'rgba(232,160,32,.10)',
     fill:true,borderWidth:3,pointRadius:3,tension:.25,yAxisID:'y1',order:1}];
  if(limit!=null)ds.push({type:'line',label:'Povolené tempo',data:ks.map((_,i)=>limit*(i+1)),
    borderColor:'#C0392B',borderWidth:2,borderDash:[6,4],pointRadius:0,yAxisID:'y1',order:2});
  if(ks.length>=4)ds.push({type:'line',label:'Průměr 7 dnů',data:ks.map((_,i)=>movAvg(ks,i,7)),
    borderColor:'#1B3A5C',borderWidth:2,borderDash:[3,3],pointRadius:0,tension:.3,
    yAxisID:'y',order:2});
  mk('cDay',{data:{labels:ks.map(k=>k.slice(8)+'.'+k.slice(5,7)+'.'),datasets:ds},
   options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},datalabels:{display:false},
      tooltip:{mode:'index',intersect:false,callbacks:{label:c=>' '+c.dataset.label+': '+fE(c.raw)}}},
    scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
      y:{ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),font:{size:10},color:'#7F8C8D'},
        grid:grd,border:{display:false}},
      y1:{position:'right',ticks:{callback:v=>v>=1000?Math.round(v/1000)+'k':Math.round(v),
        font:{size:10},color:'#E8A020'},grid:{display:false},border:{display:false}}}}});

  const projs=projTotals(m),el=document.getElementById('lProj');if(!el)return;
  if(!projs.length){el.innerHTML='<div class="empty" style="padding:20px">Bez rozpadu na projekty.</div>';return}
  const det=hasDetail(m),max=projs[0][1].e,tot=sumM(m);
  el.innerHTML=projs.map(function(p,i){const nm=p[0],v=p[1];
    return '<div class="prow '+(i===0?'hot':'')+'"'+(det?' onclick="openProj(\''+esc(nm)+'\')"':' style="cursor:default"')+'>'+
    '<div class="prank '+(i===0?'top':'')+'">'+(i+1)+'</div><span class="n">'+nm+'</span>'+
    '<div class="bb"><div class="bf" style="width:'+Math.round(v.e/max*100)+'%;background:'+
      (i===0?'#C0392B':'#2E6DA4')+'"></div></div>'+
    '<span class="v">'+fE(v.e)+'</span>'+
    '<span class="pc">'+Math.round(v.e/tot*100)+' %'+(v.q?' · '+fN(v.q)+' ks':'')+'</span>'+
    '<span class="ar">'+(det?'›':'')+'</span></div>'}).join('')}
