import express from "express";

const app = express();
const PORT = Number(process.env.PORT || 10000);
const API_KEY = process.env.API_FOOTBALL_KEY || "";
const API_BASE = "https://v3.football.api-sports.io";
const MIN_GAP = Number(process.env.API_MIN_GAP_MS || 6200);
const MODE = process.env.ANALYSIS_MODE || "balanced";

app.use(express.json());

const LEAGUES = {
  TSL:{name:"Süper Lig",country:"Türkiye",apiId:203,csv:"T1",emoji:"🇹🇷"},
  PL:{name:"Premier League",country:"İngiltere",apiId:39,csv:"E0",emoji:"🏴"},
  CH:{name:"Championship",country:"İngiltere",apiId:40,csv:"E1",emoji:"🏴"},
  L1:{name:"League One",country:"İngiltere",apiId:41,csv:"E2",emoji:"🏴"},
  L2:{name:"League Two",country:"İngiltere",apiId:42,csv:"E3",emoji:"🏴"},
  NL:{name:"National League",country:"İngiltere",apiId:43,csv:"EC",emoji:"🏴"},
  PD:{name:"La Liga",country:"İspanya",apiId:140,csv:"SP1",emoji:"🇪🇸"},
  SD:{name:"La Liga 2",country:"İspanya",apiId:141,csv:"SP2",emoji:"🇪🇸"},
  SA:{name:"Serie A",country:"İtalya",apiId:135,csv:"I1",emoji:"🇮🇹"},
  SB:{name:"Serie B",country:"İtalya",apiId:136,csv:"I2",emoji:"🇮🇹"},
  BL1:{name:"Bundesliga",country:"Almanya",apiId:78,csv:"D1",emoji:"🇩🇪"},
  BL2:{name:"2. Bundesliga",country:"Almanya",apiId:79,csv:"D2",emoji:"🇩🇪"},
  FL1:{name:"Ligue 1",country:"Fransa",apiId:61,csv:"F1",emoji:"🇫🇷"},
  FL2:{name:"Ligue 2",country:"Fransa",apiId:62,csv:"F2",emoji:"🇫🇷"},
  DED:{name:"Eredivisie",country:"Hollanda",apiId:88,csv:"N1",emoji:"🇳🇱"},
  BEL:{name:"Pro League",country:"Belçika",apiId:144,csv:"B1",emoji:"🇧🇪"},
  PPL:{name:"Primeira Liga",country:"Portekiz",apiId:94,csv:"P1",emoji:"🇵🇹"},
  GRE:{name:"Super League",country:"Yunanistan",apiId:197,csv:"G1",emoji:"🇬🇷"},
  SCP:{name:"Premiership",country:"İskoçya",apiId:179,csv:"SC0",emoji:"🏴"},
  SCC:{name:"Championship",country:"İskoçya",apiId:180,csv:"SC1",emoji:"🏴"},
  SCL1:{name:"League One",country:"İskoçya",apiId:183,csv:"SC2",emoji:"🏴"},
  SCL2:{name:"League Two",country:"İskoçya",apiId:184,csv:"SC3",emoji:"🏴"}
};

const LEAGUE_BY_API = {};
for (const [code,l] of Object.entries(LEAGUES)) LEAGUE_BY_API[l.apiId] = {code,...l};

const cache = new Map();
function getCache(k){const x=cache.get(k);if(!x)return null;if(Date.now()>x.expires){cache.delete(k);return null}return x.value}
function setCache(k,v,ttl=600000){cache.set(k,{value:v,expires:Date.now()+ttl})}

let lastApiCall = 0;
let apiChain = Promise.resolve();
async function rateLimitedFetch(url, options={}){
  const run = async()=>{
    const wait = Math.max(0, MIN_GAP - (Date.now()-lastApiCall));
    if(wait) await new Promise(r=>setTimeout(r,wait));
    lastApiCall = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),25000);
    try{return await fetch(url,{...options,signal:controller.signal})}
    finally{clearTimeout(timer)}
  };
  apiChain = apiChain.then(run,run);
  return apiChain;
}

async function apiFootball(path, ttl=240000){
  if(!API_KEY) throw new Error("API_FOOTBALL_KEY bulunamadı.");
  const key=`api:${path}`;
  const cached=getCache(key);
  if(cached)return cached;
  const r=await rateLimitedFetch(API_BASE+path,{headers:{"x-apisports-key":API_KEY}});
  if(!r.ok) throw new Error(`API-Football HTTP ${r.status}`);
  const body=await r.json();
  if(body.errors && Object.keys(body.errors).length){
    throw new Error(typeof body.errors==="string"?body.errors:JSON.stringify(body.errors));
  }
  const data=body.response||[];
  setCache(key,data,ttl);
  return data;
}

function parseCSV(text){
  text=text.replace(/^\uFEFF/,"");
  const rows=[]; let row=[], value="", quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){value+='"';i++;continue}
    if(ch==='"'){quoted=!quoted;continue}
    if(ch===','&&!quoted){row.push(value);value="";continue}
    if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&next==='\n')i++;
      row.push(value);value="";
      if(row.some(x=>String(x).trim()!==""))rows.push(row);
      row=[];continue;
    }
    value+=ch;
  }
  if(value||row.length){row.push(value);rows.push(row)}
  if(rows.length<2)return [];
  const headers=rows[0].map(x=>x.trim());
  return rows.slice(1).map(vals=>Object.fromEntries(headers.map((h,i)=>[h,vals[i]??""])));
}

function n(v){if(v===null||v===undefined||v==="")return null;const x=Number(String(v).replace(",","."));return Number.isFinite(x)?x:null}
function fdUrl(season,div){return `https://www.football-data.co.uk/mmz4281/${season}/${div}.csv`}

async function loadCSV(season,div){
  const key=`csv:${season}:${div}`;
  const cached=getCache(key); if(cached)return cached;
  try{
    const r=await fetch(fdUrl(season,div),{headers:{"User-Agent":"MatchEdge/6.0"}});
    if(!r.ok)return [];
    const text=await r.text();
    if(text.toLowerCase().includes("<html")||text.length<20)return [];
    const rows=parseCSV(text);
    setCache(key,rows,1800000);
    return rows;
  }catch{return []}
}

function parseDate(v){
  if(!v)return null;
  const p=String(v).trim().split("/");
  if(p.length===3){let[d,m,y]=p;if(y.length===2)y=Number(y)>70?`19${y}`:`20${y}`;const z=new Date(+y,+m-1,+d,12);return Number.isNaN(z.getTime())?null:z}
  const z=new Date(v); return Number.isNaN(z.getTime())?null:z;
}

function completedMatch(r,season){
  const hg=n(r.FTHG), ag=n(r.FTAG), date=parseDate(r.Date);
  if(hg===null||ag===null||!date)return null;
  return {
    season,date,home:r.HomeTeam||"",away:r.AwayTeam||"",homeGoals:hg,awayGoals:ag,
    htHome:n(r.HTHG),htAway:n(r.HTAG),homeShots:n(r.HS),awayShots:n(r.AS),homeSOT:n(r.HST),awaySOT:n(r.AST),homeCorners:n(r.HC),awayCorners:n(r.AC)
  };
}

async function leagueHistory(code){
  const league=LEAGUES[code]; if(!league)return [];
  const key=`history:${code}`;
  const cached=getCache(key); if(cached)return cached;
  const [cur,prev]=await Promise.all([loadCSV("2627",league.csv),loadCSV("2526",league.csv)]);
  const all=[...prev.map(r=>completedMatch(r,"2025/26")),...cur.map(r=>completedMatch(r,"2026/27"))].filter(Boolean).sort((a,b)=>a.date-b.date);
  setCache(key,all,1800000);
  return all;
}

function norm(s=""){
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/\b(fc|cf|afc|fk|sk|as|ac|ssc)\b/g,"").replace(/[^a-z0-9]/g,"");
}

function findTeam(apiName,history){
  const target=norm(apiName);
  const teams=[...new Set(history.flatMap(m=>[m.home,m.away]))];
  let best=null,bestScore=0;
  for(const team of teams){
    const t=norm(team);
    let s=t===target?1:0;
    if(!s && (t.includes(target)||target.includes(t))) s=Math.min(t.length,target.length)/Math.max(t.length,target.length);
    if(s>bestScore){bestScore=s;best=team}
  }
  return bestScore>=0.55?best:null;
}

function perspective(m,team){
  const isHome=m.home===team;
  const gf=isHome?m.homeGoals:m.awayGoals;
  const ga=isHome?m.awayGoals:m.homeGoals;
  const htGF=(m.htHome===null||m.htAway===null)?null:(isHome?m.htHome:m.htAway);
  const htGA=(m.htHome===null||m.htAway===null)?null:(isHome?m.htAway:m.htHome);
  return {date:m.date,season:m.season,home:isHome,gf,ga,htGF,htGA,shGF:htGF===null?null:gf-htGF,shGA:htGA===null?null:ga-htGA,corners:isHome?m.homeCorners:m.awayCorners,shots:isHome?m.homeShots:m.awayShots,sot:isHome?m.homeSOT:m.awaySOT};
}

function weightedAverage(rows,key){
  let total=0,weights=0;
  for(const row of rows){
    const value=row[key]; if(value===null||value===undefined||!Number.isFinite(value))continue;
    const seasonWeight=row.season==="2026/27"?1.7:0.65;
    total+=value*seasonWeight; weights+=seasonWeight;
  }
  return weights?total/weights:null;
}

function teamStats(history,team,venue=null){
  let rows=history.filter(m=>m.home===team||m.away===team).map(m=>perspective(m,team));
  if(venue==="home")rows=rows.filter(x=>x.home);
  if(venue==="away")rows=rows.filter(x=>!x.home);
  rows=rows.slice(-10);
  if(!rows.length)return null;
  return {
    matches:rows.length,currentSeasonCount:rows.filter(x=>x.season==="2026/27").length,
    gf:weightedAverage(rows,"gf"),ga:weightedAverage(rows,"ga"),htGF:weightedAverage(rows,"htGF"),htGA:weightedAverage(rows,"htGA"),shGF:weightedAverage(rows,"shGF"),shGA:weightedAverage(rows,"shGA"),corners:weightedAverage(rows,"corners"),shots:weightedAverage(rows,"shots"),sot:weightedAverage(rows,"sot")
  };
}

function factorial(n){if(n<=1)return 1;let x=1;for(let i=2;i<=n;i++)x*=i;return x}
function poisson(k,l){return Math.exp(-l)*Math.pow(l,k)/factorial(k)}
function scoreMatrix(hl,al,max=8){const m=[];for(let h=0;h<=max;h++)for(let a=0;a<=max;a++)m.push({h,a,p:poisson(h,hl)*poisson(a,al)});const s=m.reduce((z,x)=>z+x.p,0);return m.map(x=>({...x,p:x.p/s}))}
function probability(m,test){return m.filter(test).reduce((s,x)=>s+x.p,0)}
function pct(v){return Math.round(v*1000)/10}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function confidenceFor(p,current,total){let c=40+Math.abs(p-.5)*40+Math.min(12,current*1.5);if(total<5)c=Math.min(c,42);if(current<5)c=Math.min(c,48);if(current<=2)c=Math.min(c,40);return Math.round(clamp(c,25,82))}

function buildModel(history,home,away){
  const homeAll=teamStats(history,home),awayAll=teamStats(history,away),homeVenue=teamStats(history,home,"home")||homeAll,awayVenue=teamStats(history,away,"away")||awayAll;
  if(!homeAll||!awayAll)throw new Error("Yeterli 2025/26–2026/27 verisi bulunamadı.");
  let homeLambda=clamp((homeVenue.gf??1.4)*0.5+(awayVenue.ga??1.4)*0.35+1.45*0.15,0.25,3.6);
  let awayLambda=clamp((awayVenue.gf??1.1)*0.5+(homeVenue.ga??1.1)*0.35+1.15*0.15,0.2,3.3);
  const matrix=scoreMatrix(homeLambda,awayLambda);
  const pHome=probability(matrix,x=>x.h>x.a),pDraw=probability(matrix,x=>x.h===x.a),pAway=probability(matrix,x=>x.h<x.a),pOver25=probability(matrix,x=>x.h+x.a>=3),pBTTS=probability(matrix,x=>x.h>0&&x.a>0),pHome15=probability(matrix,x=>x.h>=2),pAway15=probability(matrix,x=>x.a>=2);
  const current=Math.min(homeAll.currentSeasonCount,awayAll.currentSeasonCount),total=Math.min(homeAll.matches,awayAll.matches);
  const mk=(name,p,group)=>({name,group,probability:pct(p),confidence:confidenceFor(p,current,total)});
  const markets=[mk("1",pHome,"1X2"),mk("X",pDraw,"1X2"),mk("2",pAway,"1X2"),mk("2.5 Üst",pOver25,"Gol"),mk("2.5 Alt",1-pOver25,"Gol"),mk("KG Var",pBTTS,"KG"),mk("KG Yok",1-pBTTS,"KG"),mk("Ev 1.5 Üst",pHome15,"Takım Gol"),mk("Dep 1.5 Üst",pAway15,"Takım Gol")];
  const top=matrix.slice().sort((a,b)=>b.p-a.p)[0];
  const recommendations=markets.filter(x=>x.group==="1X2"||x.probability>=50).sort((a,b)=>(b.probability*0.65+b.confidence*0.35)-(a.probability*0.65+a.confidence*0.35)).slice(0,6);
  return {
    expectedGoals:{home:+homeLambda.toFixed(2),away:+awayLambda.toFixed(2),total:+(homeLambda+awayLambda).toFixed(2)},
    likelyScore:`${top.h}-${top.a}`,markets,recommendations,
    stats:{homeCurrentMatches:homeAll.currentSeasonCount,awayCurrentMatches:awayAll.currentSeasonCount,expectedCorners:(homeVenue.corners!=null&&awayVenue.corners!=null)?+(homeVenue.corners+awayVenue.corners).toFixed(2):null},
    sampleWarning:current<5?"2026/27 sezon örneklemi 5 maçın altında. Güven puanı otomatik düşürüldü.":null
  };
}

async function fixturesForDate(date){
  const rows=await apiFootball(`/fixtures?date=${encodeURIComponent(date)}`);
  return rows.filter(x=>LEAGUE_BY_API[x?.league?.id]).map(x=>{const l=LEAGUE_BY_API[x.league.id];return {id:x.fixture.id,date:x.fixture.date,timestamp:x.fixture.timestamp,leagueCode:l.code,league:l.name,country:l.country,emoji:l.emoji,round:x.league.round||"",home:{name:x.teams.home.name,logo:x.teams.home.logo||""},away:{name:x.teams.away.name,logo:x.teams.away.logo||""}}}).sort((a,b)=>a.timestamp-b.timestamp);
}

app.get("/api/health",(req,res)=>res.json({ok:true,version:"6.0.0",mode:MODE,providers:{fixtures:Boolean(API_KEY),footballData:true,odds:false},seasons:["2026/27","2025/26"],leagues:Object.keys(LEAGUES).length}));
app.get("/api/day",async(req,res)=>{try{const date=String(req.query.date||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({ok:false,error:"Geçerli tarih gerekli: YYYY-MM-DD"});const fixtures=await fixturesForDate(date);res.json({ok:true,date,count:fixtures.length,fixtures})}catch(e){res.status(500).json({ok:false,error:e?.message||"Fikstür alınamadı."})}});
app.get("/api/analyze/:fixtureId",async(req,res)=>{try{const fixtureId=Number(req.params.fixtureId),date=String(req.query.date||"");if(!fixtureId||!date)return res.status(400).json({ok:false,error:"fixtureId ve date gerekli."});const fixtures=await fixturesForDate(date),fixture=fixtures.find(x=>x.id===fixtureId);if(!fixture)return res.status(404).json({ok:false,error:"Bu maç desteklenen liglerde bulunamadı."});const all=await leagueHistory(fixture.leagueCode),limit=new Date(`${date}T23:59:59`),history=all.filter(m=>m.date<=limit);if(!history.length)return res.status(422).json({ok:false,error:"Bu lig için 2025/26–2026/27 tamamlanmış maç verisi bulunamadı."});const home=findTeam(fixture.home.name,history),away=findTeam(fixture.away.name,history);if(!home||!away)return res.status(422).json({ok:false,error:`Takım eşleştirmesi yapılamadı. ${fixture.home.name} / ${fixture.away.name}`});res.json({ok:true,fixture,data:{provider:"Football-Data.co.uk",seasons:["2026/27","2025/26"],homeMatchedAs:home,awayMatchedAs:away},model:buildModel(history,home,away)})}catch(e){res.status(500).json({ok:false,error:e?.message||"Analiz oluşturulamadı."})}});

const leagueMeta = JSON.stringify(Object.entries(LEAGUES).map(([code,l])=>({code,name:l.name,country:l.country,emoji:l.emoji})));
const HTML = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#07111f"><title>MatchEdge Premium</title><style>
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#12233a 0,#07111f 46%);color:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.app{width:min(760px,100%);margin:auto;padding:18px 14px 60px}.top{display:flex;align-items:center;justify-content:space-between}.brand{font-size:19px;font-weight:800}.premium{color:#d9b56f}.live{font-size:10px;padding:7px 10px;border-radius:999px;background:#48d89b1f;color:#48d89b;font-weight:800}.hero{margin-top:18px;padding:22px;border-radius:24px;border:1px solid #d9b56f33;background:linear-gradient(145deg,#d9b56f18,#122239bb)}.hero small{color:#d9b56f;font-weight:800}.hero h1{margin:7px 0 4px;font-size:29px}.hero p{margin:0;color:#8492a6;font-size:13px}.datebar{display:grid;grid-template-columns:44px 1fr 44px;gap:8px;margin-top:18px}.datebar button,.datebox{height:46px;border:1px solid #ffffff14;background:#ffffff08;color:white;border-radius:14px}.datebox{display:flex;align-items:center;justify-content:center;font-weight:750}.leagues{display:flex;gap:8px;overflow:auto;padding:15px 0 7px}.chip{white-space:nowrap;padding:10px 13px;border-radius:999px;border:1px solid #ffffff14;background:#ffffff08;color:#aeb9c8;font-size:12px;font-weight:700}.chip.active{color:#091421;background:#d9b56f}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0 22px}.stat{padding:14px 9px;border-radius:16px;border:1px solid #ffffff14;background:#ffffff08;text-align:center}.stat strong{display:block;font-size:18px}.stat span{display:block;margin-top:3px;color:#8492a6;font-size:10px}.sectionhead{display:flex;justify-content:space-between;align-items:end}.sectionhead h2{font-size:17px}.sectionhead span{color:#8492a6;font-size:11px}.fixture{margin-bottom:10px;padding:16px;border-radius:20px;background:#0d1a2bea;border:1px solid #ffffff14}.fixturetop{display:flex;justify-content:space-between;color:#8492a6;font-size:10px}.teams{display:grid;grid-template-columns:1fr 54px 1fr;align-items:center;gap:8px;margin-top:14px}.team{text-align:center;font-size:12px;font-weight:750}.team img{width:38px;height:38px;object-fit:contain;display:block;margin:0 auto 7px}.time{text-align:center;color:#d9b56f;font-size:14px;font-weight:800}.analyze{width:100%;height:43px;border:0;border-radius:13px;margin-top:14px;background:linear-gradient(135deg,#d9b56f,#f2d18f);color:#09131e;font-weight:850}.analysis{margin-top:13px;border-top:1px solid #ffffff14;padding-top:14px}.minirow{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.mini{padding:12px;border-radius:13px;background:#ffffff08}.mini span{font-size:9px;color:#8492a6;display:block}.market{display:grid;grid-template-columns:1fr 55px 58px;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #ffffff0d}.marketName{font-size:12px;font-weight:700}.prob{font-size:13px;font-weight:850;color:#48d89b;text-align:right}.conf{font-size:9px;color:#8492a6;text-align:right}.warning,.error,.empty{margin-top:10px;padding:12px;border-radius:12px;font-size:11px}.warning{color:#efc987;background:#d9b56f12}.error{color:#ff9aa5;background:#ff708014}.empty{text-align:center;color:#8492a6;border:1px dashed #ffffff1f}.loader{text-align:center;color:#8492a6;padding:25px}
</style></head><body><div class="app"><div class="top"><div class="brand">MatchEdge <span class="premium">Premium</span></div><div class="live">● LIVE DATA</div></div><div class="hero"><small>GÜNÜN ANALİZ MERKEZİ</small><h1>Olasılık. Güven. Value.</h1><p>2026/27 güncel form öncelikli · 2025/26 destekli model</p><div class="datebar"><button id="prev">‹</button><div class="datebox" id="dateLabel"></div><button id="next">›</button></div></div><div class="leagues" id="leagues"></div><div class="summary"><div class="stat"><strong id="matchCount">—</strong><span>Maç</span></div><div class="stat"><strong id="analysisCount">0</strong><span>Analiz</span></div><div class="stat"><strong>2026</strong><span>Ana Sezon</span></div></div><div class="sectionhead"><h2>Günün Lig Maçları</h2><span id="fixtureLabel">yükleniyor</span></div><div id="fixtures"><div class="loader">Maçlar yükleniyor…</div></div></div><script>
const leagueMeta=${leagueMeta};let currentDate=new Date(),selectedLeague="ALL",fixtures=[],analyzed=0;
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function renderLeagues(){const all=[{code:"ALL",name:"Tümü",emoji:"🌍"},...leagueMeta];document.getElementById("leagues").innerHTML=all.map(l=>'<button class="chip '+(selectedLeague===l.code?'active':'')+'" data-code="'+l.code+'">'+l.emoji+' '+esc(l.name)+'</button>').join('');document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{selectedLeague=b.dataset.code;renderLeagues();renderFixtures()})}
function renderFixtures(){const rows=selectedLeague==='ALL'?fixtures:fixtures.filter(x=>x.leagueCode===selectedLeague);document.getElementById('matchCount').textContent=rows.length;document.getElementById('fixtureLabel').textContent=rows.length+' gerçek fikstür';const box=document.getElementById('fixtures');if(!rows.length){box.innerHTML='<div class="empty">Seçili liglerde bu tarihte maç bulunamadı.</div>';return}box.innerHTML=rows.map(f=>'<div class="fixture"><div class="fixturetop"><span>'+esc(f.emoji+' '+f.country+' · '+f.league)+'</span><span>'+esc(f.round)+'</span></div><div class="teams"><div class="team">'+(f.home.logo?'<img src="'+esc(f.home.logo)+'">':'')+'<div>'+esc(f.home.name)+'</div></div><div class="time">'+new Date(f.date).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})+'</div><div class="team">'+(f.away.logo?'<img src="'+esc(f.away.logo)+'">':'')+'<div>'+esc(f.away.name)+'</div></div></div><button class="analyze" onclick="analyzeMatch('+f.id+',this)">ANALİZ ET</button><div id="analysis-'+f.id+'"></div></div>').join('')}
async function loadDay(){document.getElementById('dateLabel').textContent=currentDate.toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'});document.getElementById('fixtures').innerHTML='<div class="loader">Maçlar yükleniyor…</div>';try{const r=await fetch('/api/day?date='+iso(currentDate)),data=await r.json();if(!data.ok)throw new Error(data.error||'Maçlar alınamadı');fixtures=data.fixtures||[];renderFixtures()}catch(e){document.getElementById('fixtures').innerHTML='<div class="error">'+esc(e.message)+'</div>'}}
async function analyzeMatch(id,button){const target=document.getElementById('analysis-'+id);button.disabled=true;button.textContent='ANALİZ EDİLİYOR…';target.innerHTML='<div class="loader">2026/27 + 2025/26 verileri hesaplanıyor…</div>';try{const r=await fetch('/api/analyze/'+id+'?date='+iso(currentDate)),data=await r.json();if(!data.ok)throw new Error(data.error||'Analiz oluşturulamadı');analyzed++;document.getElementById('analysisCount').textContent=analyzed;const m=data.model,st=m.stats||{};target.innerHTML='<div class="analysis"><div class="minirow"><div class="mini"><span>BEKLENEN GOL</span><strong>'+m.expectedGoals.home+' – '+m.expectedGoals.away+'</strong></div><div class="mini"><span>OLASI SKOR</span><strong>'+esc(m.likelyScore)+'</strong></div><div class="mini"><span>2026/27 MAÇ</span><strong>'+st.homeCurrentMatches+' / '+st.awayCurrentMatches+'</strong></div><div class="mini"><span>ORT. KORNER</span><strong>'+(st.expectedCorners==null?'—':st.expectedCorners)+'</strong></div></div>'+m.recommendations.map(x=>'<div class="market"><div class="marketName">'+esc(x.name)+'</div><div class="prob">'+x.probability+'%</div><div class="conf">Güven '+x.confidence+'</div></div>').join('')+(m.sampleWarning?'<div class="warning">'+esc(m.sampleWarning)+'</div>':'')+'</div>';button.textContent='ANALİZ YENİLE'}catch(e){target.innerHTML='<div class="error">'+esc(e.message)+'</div>';button.textContent='TEKRAR DENE'}finally{button.disabled=false}}
document.getElementById('prev').onclick=()=>{currentDate.setDate(currentDate.getDate()-1);loadDay()};document.getElementById('next').onclick=()=>{currentDate.setDate(currentDate.getDate()+1);loadDay()};renderLeagues();loadDay();
</script></body></html>`;

app.get("/",(req,res)=>res.status(200).type("html").send(HTML));
app.use((req,res)=>res.status(404).json({ok:false,error:"Not found"}));
app.listen(PORT,"0.0.0.0",()=>console.log(`MatchEdge Premium V6 running on port ${PORT}`));
