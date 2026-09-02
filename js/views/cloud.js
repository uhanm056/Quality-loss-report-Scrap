/* Záložka 5: panel sdílení dat (Data & import)
   Ukazuje, jestli se data sdílí s ostatními, nebo zůstávají jen v tomhle
   prohlížeči — a proč. Logika je v js/core/cloud.js.
   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const cloudTime=d=>d?String(d.getHours()).padStart(2,'0')+':'+
  String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0'):'—';

const box=(cls,ic,txt)=>'<div class="cbox '+cls+'"><span style="font-size:26px">'+ic+
  '</span><div>'+txt+'</div></div>';

function renderCloud(){
  const b=document.getElementById('cloudBody');if(!b)return;
  const jen='<b>Data zůstávají jen v tomhle prohlížeči.</b> Kdo si stránku otevře '+
    'jinde, uvidí jen to, co si sám nahraje. Přenést je jde přes <b>Zálohu</b> a '+
    '<b>Obnovit</b> níž na této stránce.';

  if(CLOUD.busy){b.innerHTML=box('n','⏳','<b>Připojuji ke sdíleným datům…</b>');return}

  if(CLOUD.sts==='err'){
    b.innerHTML=box('r','⚠','<b>Sdílení dat se nepodařilo.</b><br>'+
      '<span style="font-size:13px">'+escH(CLOUD.err)+'</span><br>'+jen)+
      '<div style="margin-top:12px"><button class="btn" onclick="cloudStart()">Zkusit znovu</button></div>';
    return}

  if(CLOUD.sts==='off'){
    if(CLOUD.why==='file')
      b.innerHTML=box('n','💾','<b>Aplikace je otevřená přímo z disku.</b> Sdílení dat '+
        'v tomhle režimu nefunguje — prohlížeč ho u souborů z disku nepovolí. '+
        'Pro sdílení otevři webovou verzi (GitHub Pages).<br>'+jen);
    else
      b.innerHTML=box('n','🔌','<b>Sdílení dat není nastavené.</b> '+jen+
        '<br><span style="font-size:13px">Zapíná se vyplněním souboru '+
        '<b>js/data/firebase-config.js</b> — postup je v <b>FIREBASE.md</b> v repozitáři.</span>');
    return}

  if(CLOUD.sts==='out'){
    const jak=FBCFG.login||'password';
    let form='';
    if(jak!=='google')
      form+='<form onsubmit="return cloudLoginPwd(event)" style="display:flex;'+
        'flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px">'+
        '<input class="cinp" type="email" id="cEmail" autocomplete="username" '+
        'placeholder="jmeno.prijmeni@'+escH(FBCFG.domain||'firma.com')+'" '+
        'value="'+escH(loginMail)+'">'+
        '<input class="cinp" type="password" id="cPass" autocomplete="current-password" '+
        'placeholder="heslo" style="width:170px">'+
        '<button class="btn" type="submit">🔑 Přihlásit se</button>'+
        '<button class="btn" type="button" onclick="cloudReset()" '+
        'style="border:0;background:none;color:var(--mid);font-weight:600">'+
        'Zapomenuté heslo?</button></form>';
    if(jak!=='password')
      form+='<div style="margin-top:12px"><button class="btn" onclick="cloudLogin()">'+
        '🔑 Přihlásit se Google účtem</button></div>';
    b.innerHTML=box('n','🔒','<b>Sdílená data jsou zamčená.</b> Přihlaš se účtem, '+
      'který ti založil správce'+(FBCFG.domain?' (<b>@'+escH(FBCFG.domain)+'</b>)':'')+
      ', a uvidíš dny, které nahráli ostatní.<br>'+jen)+form+
      (CLOUD.loginErr?'<div style="margin-top:10px;font-size:13px;font-weight:700;'+
        'color:var(--red)">⚠ '+escH(CLOUD.loginErr)+'</div>':'');
    const el=document.getElementById(loginMail?'cPass':'cEmail');if(el)el.focus();
    return}

  /* přihlášeno */
  const nd=Object.keys(DB).length,nr=Object.keys(RW).length;
  b.innerHTML=box('g','☁','<b>Data se sdílí.</b> Co nahraješ, uvidí ostatní přihlášení — '+
    'a co nahrají oni, se sem doplní samo, bez načítání stránky.')+
    '<div style="display:flex;flex-wrap:wrap;gap:10px 26px;align-items:center;'+
    'margin-top:14px;font-size:13px">'+
    '<span>přihlášen <b>'+escH(CLOUD.user||'—')+'</b></span>'+
    '<span>sdílených dnů scrapu <b>'+nd+'</b></span>'+
    '<span>dnů reworku <b>'+nr+'</b></span>'+
    '<span style="color:var(--muted)">poslední synchronizace '+cloudTime(CLOUD.last)+'</span>'+
    '<button class="btn" onclick="cloudLogout()">Odhlásit</button></div>'+
    '<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.7">'+
    'Slučuje se po dnech: stejný den nahraný později přepíše ten dřívější, '+
    'různé dny se sečtou. Smazání dne tady ho smaže i ostatním.</div>'}

/* stav ve stavovém pruhu v hlavičce */
function cloudBadge(){
  const el=document.getElementById('hb4');if(!el)return;
  if(CLOUD.sts==='on'){el.style.display='';el.textContent='☁ sdíleno · '+CLOUD.user}
  else if(CLOUD.sts==='out'){el.style.display='';el.textContent='☁ nepřihlášen'}
  else if(CLOUD.sts==='err'){el.style.display='';el.textContent='☁ chyba sdílení'}
  else el.style.display='none'}
