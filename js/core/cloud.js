/* Jádro: sdílení dat mezi lidmi přes Firebase (Firestore)
   ────────────────────────────────────────────────────────────────────────
   Proč vůbec: denní data se ukládají do localStorage, takže je vidí jen ten
   prohlížeč, ve kterém se report nahrál. Kolega, kterému se stránka pošle,
   nahraje report u sebe a druhému se nic neobjeví. Tenhle soubor přidává
   společné úložiště — kdo je přihlášený, vidí totéž.

   Bez konfigurace (js/data/firebase-config.js) a při otevření z disku
   (file://) je celá vrstva vypnutá a aplikace se chová přesně jako dřív.
   Firebase SDK se stahuje až ve chvíli, kdy je sdílení opravdu zapnuté.

   Uloženo je vždy: kolekce root/scrap/dny/{den} a root/rework/dny/{den},
   den je jeden dokument s celým obsahem v poli `json` (řetězec). Tím se
   obejdou omezení Firestore na názvy polí — klíče vad jako `PVZD§Vzduch`
   nebo popisy s tečkou by jako názvy polí neprošly.

   Slučuje se po dnech podle času nahrání (`at`): novější vyhrává.
   Kdo nahraje jiné dny, přidá je; kdo nahraje stejný den znovu, přepíše ho.

   Součást aplikace Scrap & QLR — Yanfeng Plant 1032.
   Klasický skript (bez modulů), aby index.html fungoval otevřený přímo z disku. */

const FBSDK='https://www.gstatic.com/firebasejs/10.12.5/';

/* sts: 'off' nedostupné · 'out' odhlášen · 'on' přihlášen · 'err' chyba */
const CLOUD={sts:'off',why:'',user:null,err:'',loginErr:'',last:null,busy:false,
  synced:{scrap:false,rework:false},rem:{scrap:{},rework:{}},applying:false};

let fbAuth=null,fbDb=null,cloudSubs=[],bumpT=null;

/* proč je sdílení vypnuté — '' znamená, že jde zapnout */
function cloudWhy(){
  if(location.protocol==='file:')return 'file';
  if(typeof FBCFG!=='object'||!FBCFG.apiKey||!FBCFG.projectId)return 'nocfg';
  return ''}

/* ── cesty ve Firestore ────────────────────────────────────────────────── */
const cRoot=()=>fbDb.collection(FBCFG.root||'plant1032');
const cDays=kind=>cRoot().doc(kind==='rework'?'rework':'scrap').collection('dny');
const cKonf=()=>cRoot().doc('konfig');
const mapOf=kind=>kind==='rework'?RW:DB;
const saveOf=kind=>kind==='rework'?saveR:save;

/* ── načtení SDK až ve chvíli potřeby ──────────────────────────────────── */
function loadJS(u){return new Promise((res,rej)=>{
  const s=document.createElement('script');s.src=u;s.async=false;
  s.onload=res;s.onerror=()=>rej(new Error('nepodařilo se stáhnout '+u));
  document.head.appendChild(s)})}

async function cloudStart(){
  const w=cloudWhy();
  if(w){CLOUD.sts='off';CLOUD.why=w;renderCloud();return}
  CLOUD.busy=true;renderCloud();
  try{
    await loadJS(FBSDK+'firebase-app-compat.js');
    await loadJS(FBSDK+'firebase-auth-compat.js');
    await loadJS(FBSDK+'firebase-firestore-compat.js');
    /* prázdné hodnoty se nepředávají — appId je nepovinné a prázdný řetězec
       některé části SDK mate; Auth a Firestore si vystačí s apiKey,
       authDomain a projectId */
    const cfg={};Object.keys(FBCFG).forEach(k=>{if(FBCFG[k])cfg[k]=FBCFG[k]});
    firebase.initializeApp(cfg);
    fbAuth=firebase.auth();fbDb=firebase.firestore();
    fbAuth.onAuthStateChanged(u=>{
      if(u){CLOUD.user=u.email||u.uid;CLOUD.sts='on';CLOUD.err='';cloudAttach()}
      else{CLOUD.user=null;CLOUD.sts='out';cloudDetach()}
      renderCloud();cloudBadge()});
  }catch(e){cloudErr(e)}
  CLOUD.busy=false;renderCloud()}

function cloudErr(e){
  CLOUD.sts='err';CLOUD.err=(e&&e.message)||String(e);CLOUD.busy=false;
  renderCloud();cloudBadge()}

/* ── přihlášení ────────────────────────────────────────────────────────── */
/* Účty zakládá správce v konzoli Firebase, sám se nikdo nezaregistruje.
   Přihlášení e-mailem a heslem (`FBCFG.login`='password') nepotřebuje firemní
   Google účet — proto je výchozí. */

/* hlášky z Firebase jsou anglicky a technicky; tohle je přeloží */
const AUTHMSG={
  'auth/invalid-email':'E-mail není ve správném tvaru.',
  'auth/invalid-credential':'Nesprávný e-mail nebo heslo.',
  'auth/wrong-password':'Nesprávné heslo.',
  'auth/user-not-found':'Takový účet neexistuje — účet zakládá správce.',
  'auth/user-disabled':'Účet je zablokovaný.',
  'auth/missing-password':'Vyplň heslo.',
  'auth/too-many-requests':'Moc pokusů za sebou. Zkus to za chvíli znovu.',
  'auth/network-request-failed':'Nepodařilo se spojit se serverem.',
  'auth/operation-not-allowed':'Tenhle způsob přihlášení není ve Firebase zapnutý.',
  'auth/unauthorized-domain':'Doména téhle stránky není ve Firebase povolená.'};
const authMsg=e=>AUTHMSG[e&&e.code]||(e&&e.message)||String(e);

/* e-mail se drží mimo panel, aby se po chybné hlášce nemusel psát znovu */
let loginMail='';

function loginFail(e){CLOUD.busy=false;CLOUD.loginErr=authMsg(e);renderCloud()}

window.cloudLoginPwd=ev=>{
  if(ev&&ev.preventDefault)ev.preventDefault();
  if(!fbAuth)return false;
  const m=(document.getElementById('cEmail')||{}).value||'';
  const h=(document.getElementById('cPass')||{}).value||'';
  loginMail=m.trim();
  CLOUD.busy=true;CLOUD.loginErr='';renderCloud();
  fbAuth.signInWithEmailAndPassword(loginMail,h)
    .then(()=>{CLOUD.busy=false;CLOUD.loginErr='';toast('✓ Přihlášeno.','#27AE60')})
    .catch(loginFail);
  return false};

window.cloudLogin=()=>{
  if(!fbAuth)return;
  const p=new firebase.auth.GoogleAuthProvider();
  if(FBCFG.domain)p.setCustomParameters({hd:FBCFG.domain});
  CLOUD.busy=true;CLOUD.loginErr='';renderCloud();
  fbAuth.signInWithPopup(p)
    .then(()=>{CLOUD.busy=false;toast('✓ Přihlášeno.','#27AE60')})
    .catch(e=>{CLOUD.busy=false;
      if(e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request')renderCloud();
      else loginFail(e)})};

/* heslo si uživatel přenastaví sám, správce ho nemusí posílat */
window.cloudReset=()=>{
  if(!fbAuth)return;
  const m=((document.getElementById('cEmail')||{}).value||'').trim();
  if(!m){CLOUD.loginErr='Nejdřív vyplň e-mail, na který se má odkaz poslat.';renderCloud();return}
  loginMail=m;
  fbAuth.sendPasswordResetEmail(m)
    .then(()=>toast('✓ Odkaz na změnu hesla je na cestě do schránky '+m+'.','#27AE60'))
    .catch(loginFail)};

window.cloudLogout=()=>{if(fbAuth){loginMail='';CLOUD.loginErr='';fbAuth.signOut()}};

/* ── odběr změn ────────────────────────────────────────────────────────── */
function cloudDetach(){cloudSubs.forEach(f=>{try{f()}catch(e){}});cloudSubs=[];
  CLOUD.synced={scrap:false,rework:false};CLOUD.rem={scrap:{},rework:{}}}

function cloudAttach(){
  cloudDetach();
  ['scrap','rework'].forEach(kind=>{
    cloudSubs.push(cDays(kind).onSnapshot(
      snap=>applySnap(kind,snap),cloudErr))});
  cloudSubs.push(cKonf().onSnapshot(d=>cfgPull(d),cloudErr))}

/* obsah dokumentu → objekt dne; poškozený záznam se přeskočí */
function docDay(d){try{return JSON.parse(d.get('json')||'null')}catch(e){return null}}

function applySnap(kind,snap){
  const map=mapOf(kind),rem=CLOUD.rem[kind];let ch=0;
  snap.docChanges().forEach(c=>{
    const k=c.doc.id;
    if(c.type==='removed'){delete rem[k];
      if(map[k]){delete map[k];ch++}return}
    const at=String(c.doc.get('at')||'');rem[k]=at;
    const v=docDay(c.doc);if(!v)return;
    /* novější vyhrává; při shodě zůstává, co je v prohlížeči */
    if(map[k]&&!(at>String(map[k].at||'')))return;
    map[k]=v;ch++});
  CLOUD.synced[kind]=true;CLOUD.last=new Date();
  if(ch){CLOUD.applying=true;saveOf(kind)();CLOUD.applying=false;cloudRefresh(kind,ch)}
  renderCloud();cloudBadge();
  if(CLOUD.synced.scrap&&CLOUD.synced.rework)cloudBump()}

/* překreslení po změně, která přišla od kolegy */
function cloudRefresh(kind,ch){
  if(kind==='rework'){const ms=rwMonths();
    if(!curRwMonth||!ms.includes(curRwMonth))curRwMonth=ms[ms.length-1]||null;
    renderBar();renderRework()}
  else{const ms=monthsAvail();
    if(!curMonth||!ms.includes(curMonth))curMonth=ms[ms.length-1]||curMonth;
    renderBar();renderDash();renderDays();renderDefects();
    if(curTab===3)renderProj()}
  toast('☁ Ze sdílených dat přišlo '+ch+'× změna '+
    (kind==='rework'?'reworku':'scrapu')+'.','#2E6DA4')}

/* ── odesílání ─────────────────────────────────────────────────────────── */
const cloudRec=(k,v)=>({den:k,at:String(v.at||''),by:CLOUD.user||'',
  src:String(v.src||''),eur:Math.round(v.eur||0),json:JSON.stringify(v)});

/* zapíše dny, které jsou lokálně novější než ve sdíleném úložišti */
async function cloudPushKind(kind){
  const map=mapOf(kind),rem=CLOUD.rem[kind],col=cDays(kind);
  const todo=Object.keys(map).filter(k=>String(map[k].at||'')>(rem[k]||''));
  for(let i=0;i<todo.length;i+=400){
    const b=fbDb.batch();
    todo.slice(i,i+400).forEach(k=>{b.set(col.doc(k),cloudRec(k,map[k]));
      rem[k]=String(map[k].at||'')});
    await b.commit()}
  return todo.length}

async function cloudPush(){
  if(CLOUD.sts!=='on'||!CLOUD.synced.scrap||!CLOUD.synced.rework)return;
  try{const a=await cloudPushKind('scrap'),b=await cloudPushKind('rework');
    if(a+b){CLOUD.last=new Date();renderCloud()}}
  catch(e){cloudErr(e)}}

/* volá se z save() a saveR() — sloučí rychlé změny po importu do jednoho zápisu */
window.cloudBump=()=>{
  if(CLOUD.sts!=='on'||CLOUD.applying)return;
  clearTimeout(bumpT);bumpT=setTimeout(cloudPush,600)};

/* smazání dne i ve sdíleném úložišti — jinak by se při další synchronizaci vrátil */
window.cloudDel=(kind,keys)=>{
  if(CLOUD.sts!=='on')return;
  const col=cDays(kind);
  [].concat(keys).forEach(k=>{delete CLOUD.rem[kind][k];
    col.doc(k).delete().catch(cloudErr)})};

/* ── targety a nastavení ───────────────────────────────────────────────── */
let CFGAT='';try{CFGAT=localStorage.getItem('yf_cfg_at')||''}catch(e){}

window.cfgPush=()=>{
  if(CLOUD.applying)return;
  try{CFGAT=new Date().toISOString();localStorage.setItem('yf_cfg_at',CFGAT)}catch(e){}
  if(CLOUD.sts!=='on')return;
  cKonf().set({at:CFGAT,by:CLOUD.user||'',
    json:JSON.stringify({TGTM:TGTM,PTGTM:PTGTM,SET:SET})}).catch(cloudErr)};

function cfgPull(d){
  if(!d.exists){if(CLOUD.sts==='on'&&CFGAT)cfgPush();return}
  const at=String(d.get('at')||'');if(!at||!(at>CFGAT))return;
  let j=null;try{j=JSON.parse(d.get('json')||'null')}catch(e){}
  if(!j)return;
  if(j.TGTM)Object.assign(TGTM,j.TGTM);
  if(j.PTGTM)Object.assign(PTGTM,j.PTGTM);
  if(j.SET)Object.assign(SET,j.SET);
  CFGAT=at;try{localStorage.setItem('yf_cfg_at',CFGAT)}catch(e){}
  CLOUD.applying=true;
  saveT();try{localStorage.setItem('yf_ptgtm',JSON.stringify(PTGTM))}catch(e){}
  saveS();
  CLOUD.applying=false;
  document.getElementById('sRwTgt').value=SET.rwTarget;
  document.getElementById('sRwRate').value=SET.rwRate;
  renderBar();renderTgt();renderDash();renderRework();
  toast('☁ Targety a nastavení přišly ze sdílených dat.','#2E6DA4')}
