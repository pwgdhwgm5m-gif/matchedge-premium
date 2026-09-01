import express from "express";

const app = express();
const PORT = Number(process.env.PORT || 10000);
const API_KEY = process.env.API_FOOTBALL_KEY || "";
const API_BASE = "https://v3.football.api-sports.io";
const MIN_GAP = Number(process.env.API_MIN_GAP_MS || 6200);
const MODE = process.env.ANALYSIS_MODE || "professional";
const APP_TIME_ZONE = "Europe/Istanbul";
app.use(express.json());

/* =========================================================
   MATCHEDGE PREMIUM V7.9.14
   Fixtures: DÜN / BUGÜN / YARIN
   Providers: API-Football + Football-Data.co.uk fallback
   Timezone: Europe/Istanbul
   Analysis: 2026/27 weighted strongest + 2025/26 support
   ========================================================= */

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
  SCL2:{name:"League Two",country:"İskoçya",apiId:184,csv:"SC3",emoji:"🏴"},
  T1L:{name:"1. Lig",country:"Türkiye",apiId:204,csv:null,emoji:"🇹🇷"},
  UCL:{name:"UEFA Champions League",country:"Avrupa",apiId:2,csv:null,emoji:"🏆"},
  UEL:{name:"UEFA Europa League",country:"Avrupa",apiId:3,csv:null,emoji:"🏆"},
  UECL:{name:"UEFA Conference League",country:"Avrupa",apiId:848,csv:null,emoji:"🏆"},
  FAC:{name:"FA Cup",country:"İngiltere",apiId:45,csv:null,emoji:"🏆"},
  CDR:{name:"Copa del Rey",country:"İspanya",apiId:143,csv:null,emoji:"🏆"},
  CIT:{name:"Coppa Italia",country:"İtalya",apiId:137,csv:null,emoji:"🏆"},
  DFB:{name:"DFB Pokal",country:"Almanya",apiId:81,csv:null,emoji:"🏆"},
  CDF:{name:"Coupe de France",country:"Fransa",apiId:66,csv:null,emoji:"🏆"},
  KNVB:{name:"KNVB Beker",country:"Hollanda",apiId:90,csv:null,emoji:"🏆"},
  TKC:{name:"Türkiye Kupası",country:"Türkiye",apiId:206,csv:null,emoji:"🏆"},
  RPL:{name:"Premier League",country:"Rusya",apiId:235,csv:null,emoji:"🇷🇺"},
  UPL:{name:"Premier League",country:"Ukrayna",apiId:333,csv:null,emoji:"🇺🇦"},
  FIN:{name:"Veikkausliiga",country:"Finlandiya",apiId:244,csv:null,emoji:"🇫🇮"},
  NOR:{name:"Eliteserien",country:"Norveç",apiId:103,csv:null,emoji:"🇳🇴"},
  SWE:{name:"Allsvenskan",country:"İsveç",apiId:113,csv:null,emoji:"🇸🇪"},
  DEN:{name:"Superliga",country:"Danimarka",apiId:119,csv:null,emoji:"🇩🇰"},
  SUI:{name:"Super League",country:"İsviçre",apiId:207,csv:null,emoji:"🇨🇭"},
  AUT:{name:"Bundesliga",country:"Avusturya",apiId:218,csv:null,emoji:"🇦🇹"},
  POL:{name:"Ekstraklasa",country:"Polonya",apiId:106,csv:null,emoji:"🇵🇱"},
  CZE:{name:"Czech Liga",country:"Çekya",apiId:345,csv:null,emoji:"🇨🇿"},
  ROU:{name:"Liga I",country:"Romanya",apiId:283,csv:null,emoji:"🇷🇴"},
  CRO:{name:"HNL",country:"Hırvatistan",apiId:210,csv:null,emoji:"🇭🇷"},
  SRB:{name:"Super Liga",country:"Sırbistan",apiId:286,csv:null,emoji:"🇷🇸"},
  CYP:{name:"1. Division",country:"Kıbrıs",apiId:318,csv:null,emoji:"🇨🇾"},
  SVK:{name:"Super Liga",country:"Slovakya",apiId:332,csv:null,emoji:"🇸🇰"},
  SVN:{name:"1. SNL",country:"Slovenya",apiId:373,csv:null,emoji:"🇸🇮"},
  ISR:{name:"Ligat Ha'al",country:"İsrail",apiId:383,csv:null,emoji:"🇮🇱"},
  IRL:{name:"Premier Division",country:"İrlanda",apiId:357,csv:null,emoji:"🇮🇪"}
};

const LEAGUE_BY_API = {};
for (const [code,l] of Object.entries(LEAGUES)) LEAGUE_BY_API[l.apiId] = {code,...l};
const LEAGUE_BY_CSV = {};
for (const [code,l] of Object.entries(LEAGUES)) if(l.csv) LEAGUE_BY_CSV[l.csv] = {code,...l};

const ESPN_SLUGS = {
  TSL:"tur.1", PL:"eng.1", CH:"eng.2", L1:"eng.3", L2:"eng.4", NL:"eng.5",
  PD:"esp.1", SD:"esp.2", SA:"ita.1", SB:"ita.2", BL1:"ger.1", BL2:"ger.2",
  FL1:"fra.1", FL2:"fra.2", DED:"ned.1", BEL:"bel.1", PPL:"por.1", GRE:"gre.1",
  SCP:"sco.1", SCC:"sco.2", SCL1:"sco.3", SCL2:"sco.4",
  T1L:"tur.2", UCL:"uefa.champions", UEL:"uefa.europa", UECL:"uefa.europa.conf",
  FAC:"eng.fa", CDR:"esp.copa_del_rey", CIT:"ita.coppa_italia", DFB:"ger.dfb_pokal",
  CDF:"fra.coupe_de_france", KNVB:"ned.knvb_beker", TKC:"tur.turkish_cup",
  RPL:"rus.1", UPL:"ukr.1",
  NOR:"nor.1", SWE:"swe.1", DEN:"den.1", SUI:"sui.1", AUT:"aut.1",
  POL:"pol.1", ROU:"rou.1", IRL:"irl.1"
};

const cache = new Map();
function getCache(k){ const x=cache.get(k); if(!x) return null; if(Date.now()>x.expires){cache.delete(k);return null;} return x.value; }
function setCache(k,v,ttl=600000){ cache.set(k,{value:v,expires:Date.now()+ttl}); }
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pct=v=>Math.round(v*1000)/10;
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const safe=(v,d=0)=>Number.isFinite(v)?v:d;

function shiftYmd(date,amount){
  const d=new Date(date+"T12:00:00Z");
  d.setUTCDate(d.getUTCDate()+amount);
  return d.toISOString().slice(0,10);
}
function localYmdFromDate(value){
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime())) return null;
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:APP_TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
  const o=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return `${o.year}-${o.month}-${o.day}`;
}
function localTimeFromDate(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR",{timeZone:APP_TIME_ZONE,hour:"2-digit",minute:"2-digit",hour12:false}).format(d);
}

/* ---------------- API-Football ---------------- */
let lastApiCall=0, apiChain=Promise.resolve();
async function rateLimitedFetch(url,options={}){
  const run=async()=>{
    const wait=Math.max(0,MIN_GAP-(Date.now()-lastApiCall));
    if(wait) await new Promise(r=>setTimeout(r,wait));
    lastApiCall=Date.now();
    const c=new AbortController(); const t=setTimeout(()=>c.abort(),25000);
    try{return await fetch(url,{...options,signal:c.signal});}finally{clearTimeout(t);}
  };
  apiChain=apiChain.then(run,run); return apiChain;
}
async function apiFootball(path,ttl=240000){
  if(!API_KEY) throw new Error("API_FOOTBALL_KEY bulunamadı.");
  const k=`api:${path}`, c=getCache(k); if(c) return c;
  const r=await rateLimitedFetch(API_BASE+path,{headers:{"x-apisports-key":API_KEY}});
  if(!r.ok) throw new Error(`API-Football HTTP ${r.status}`);
  const b=await r.json();
  if(b.errors&&Object.keys(b.errors).length) throw new Error(typeof b.errors==="string"?b.errors:JSON.stringify(b.errors));
  const data=b.response||[]; setCache(k,data,ttl); return data;
}

/* ---------------- Football-Data CSV ---------------- */
function parseCSV(text){
  text=text.replace(/^\uFEFF/,""); const rows=[]; let row=[],v="",q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], nx=text[i+1];
    if(ch==='"'&&q&&nx==='"'){v+='"';i++;continue;}
    if(ch==='"'){q=!q;continue;}
    if(ch===','&&!q){row.push(v);v="";continue;}
    if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&nx==='\n')i++;row.push(v);v="";if(row.some(x=>String(x).trim()))rows.push(row);row=[];continue;}
    v+=ch;
  }
  if(v||row.length){row.push(v);rows.push(row);} if(rows.length<2)return [];
  const h=rows[0].map(x=>x.trim());
  return rows.slice(1).map(vals=>Object.fromEntries(h.map((x,i)=>[x,vals[i]??""])));
}
function num(v){if(v==null||v==="")return null;const x=Number(String(v).replace(",","."));return Number.isFinite(x)?x:null;}
function parseDate(v){
  if(!v)return null; const p=String(v).trim().split("/");
  if(p.length===3){let[d,m,y]=p;if(y.length===2)y=Number(y)>70?`19${y}`:`20${y}`;const z=new Date(+y,+m-1,+d,12);return Number.isNaN(z.getTime())?null:z;}
  const z=new Date(v); return Number.isNaN(z.getTime())?null:z;
}
const fdUrl=(season,div)=>`https://www.football-data.co.uk/mmz4281/${season}/${div}.csv`;
async function loadCSV(season,div){
  const k=`csv:${season}:${div}`,c=getCache(k);if(c)return c;
  try{const r=await fetch(fdUrl(season,div),{headers:{"User-Agent":"MatchEdge/7.3"}});if(!r.ok)return[];const text=await r.text();if(text.toLowerCase().includes("<html")||text.length<20)return[];const rows=parseCSV(text);setCache(k,rows,1800000);return rows;}catch{return[];}
}
function completed(r,season){
  const hg=num(r.FTHG),ag=num(r.FTAG),date=parseDate(r.Date); if(hg==null||ag==null||!date)return null;
  return {season,date,home:r.HomeTeam||"",away:r.AwayTeam||"",homeGoals:hg,awayGoals:ag,htHome:num(r.HTHG),htAway:num(r.HTAG),
    homeShots:num(r.HS),awayShots:num(r.AS),homeSOT:num(r.HST),awaySOT:num(r.AST),homeCorners:num(r.HC),awayCorners:num(r.AC),
    homeYellow:num(r.HY),awayYellow:num(r.AY),homeRed:num(r.HR),awayRed:num(r.AR)};
}
async function leagueHistory(code){
  const l=LEAGUES[code]; if(!l||!l.csv)return[]; const k=`history:${code}`,c=getCache(k);if(c)return c;
  const [cur,prev]=await Promise.all([loadCSV("2627",l.csv),loadCSV("2526",l.csv)]);
  const all=[...prev.map(x=>completed(x,"2025/26")),...cur.map(x=>completed(x,"2026/27"))].filter(Boolean).sort((a,b)=>a.date-b.date);
  setCache(k,all,1800000); return all;
}

function norm(s=""){return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/\b(fc|cf|afc|fk|sk|as|ac|ssc|calcio|football|club)\b/g,"").replace(/[^a-z0-9]/g,"");}
const ALIASES={"manchesterunited":["manunited"],"manchestercity":["mancity"],"tottenhamhotspur":["tottenham"],"wolverhamptonwanderers":["wolves"],"nottinghamforest":["nottmforest"],"newcastleunited":["newcastle"],"westhamunited":["westham"],"sheffieldwednesday":["sheffwed"],"sheffieldunited":["sheffunited"],"queensparkrangers":["qpr"],"intermilano":["inter"],"internazionale":["inter"],"acmilan":["milan"],"atleticomadrid":["athmadrid"],"athleticclub":["athbilbao"],"borussiamonchengladbach":["mgladbach"],"sportingcp":["sportinglisbon","sporting"]};
function aliasSet(name){const base=norm(name),s=new Set([base]);for(const[k,vals]of Object.entries(ALIASES)){const all=[norm(k),...vals.map(norm)];if(all.includes(base))all.forEach(x=>s.add(x));}return s;}
function similarity(a,b){const A=aliasSet(a),B=aliasSet(b);let best=0;for(const x of A)for(const y of B){if(x===y)return 1;if(x&&y&&(x.includes(y)||y.includes(x))){const mn=Math.min(x.length,y.length),mx=Math.max(x.length,y.length);if(mn>=5)return .92;best=Math.max(best,mn/mx);}}return best;}
function findTeam(name,h){const teams=[...new Set(h.flatMap(m=>[m.home,m.away]))];let best=null,score=0;for(const t of teams){const s=similarity(name,t);if(s>score){score=s;best=t;}}return score>=.55?best:null;}

/* ---------------- Derived stats ---------------- */
function perspective(m,t){
  const home=m.home===t,gf=home?m.homeGoals:m.awayGoals,ga=home?m.awayGoals:m.homeGoals;
  const htGF=m.htHome==null||m.htAway==null?null:(home?m.htHome:m.htAway), htGA=m.htHome==null||m.htAway==null?null:(home?m.htAway:m.htHome);
  return {date:m.date,season:m.season,home,opponent:home?m.away:m.home,gf,ga,points:gf>ga?3:gf===ga?1:0,btts:gf>0&&ga>0?1:0,htGF,htGA,shGF:htGF==null?null:gf-htGF,shGA:htGA==null?null:ga-htGA,
    shots:home?m.homeShots:m.awayShots,shotsAgainst:home?m.awayShots:m.homeShots,sot:home?m.homeSOT:m.awaySOT,sotAgainst:home?m.awaySOT:m.homeSOT,corners:home?m.homeCorners:m.awayCorners,cornersAgainst:home?m.awayCorners:m.homeCorners};
}
function weightedAvg(rows,key){let s=0,w=0;rows.forEach((x,i)=>{const v=x[key];if(v==null||!Number.isFinite(v))return;const sw=x.season==="2026/27"?1.75:.55;const rw=.65+.35*((i+1)/rows.length);const ww=sw*rw;s+=v*ww;w+=ww;});return w?s/w:null;}
function teamStats(h,t,venue=null,n=10){let r=h.filter(m=>m.home===t||m.away===t).map(m=>perspective(m,t));if(venue==="home")r=r.filter(x=>x.home);if(venue==="away")r=r.filter(x=>!x.home);r=r.slice(-n);if(!r.length)return null;return{matches:r.length,current:r.filter(x=>x.season==="2026/27").length,points:weightedAvg(r,"points"),gf:weightedAvg(r,"gf"),ga:weightedAvg(r,"ga"),htGF:weightedAvg(r,"htGF"),htGA:weightedAvg(r,"htGA"),shGF:weightedAvg(r,"shGF"),shGA:weightedAvg(r,"shGA"),shots:weightedAvg(r,"shots"),shotsAgainst:weightedAvg(r,"shotsAgainst"),sot:weightedAvg(r,"sot"),sotAgainst:weightedAvg(r,"sotAgainst"),corners:weightedAvg(r,"corners"),cornersAgainst:weightedAvg(r,"cornersAgainst"),btts:weightedAvg(r,"btts"),rows:r};}
function currentSeason(h){return h.filter(m=>m.season==="2026/27");}
function buildTable(h){
  const rows=currentSeason(h),map=new Map();
  const get=t=>{if(!map.has(t))map.set(t,{team:t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,hp:0,hpts:0,ap:0,apts:0});return map.get(t);};
  for(const m of rows){const H=get(m.home),A=get(m.away);H.p++;A.p++;H.gf+=m.homeGoals;H.ga+=m.awayGoals;A.gf+=m.awayGoals;A.ga+=m.homeGoals;H.hp++;A.ap++;if(m.homeGoals>m.awayGoals){H.w++;A.l++;H.pts+=3;H.hpts+=3;}else if(m.homeGoals<m.awayGoals){A.w++;H.l++;A.pts+=3;A.apts+=3;}else{H.d++;A.d++;H.pts++;A.pts++;H.hpts++;A.apts++;}}
  const arr=[...map.values()].map(x=>({...x,gd:x.gf-x.ga,ppg:x.p?x.pts/x.p:0,homePPG:x.hp?x.hpts/x.hp:0,awayPPG:x.ap?x.apts/x.ap:0})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  arr.forEach((x,i)=>x.pos=i+1);
  [...arr].sort((a,b)=>b.homePPG-a.homePPG||b.hpts-a.hpts||(b.gf-b.ga)-(a.gf-a.ga)).forEach((x,i)=>x.homePos=i+1);
  [...arr].sort((a,b)=>b.awayPPG-a.awayPPG||b.apts-a.apts||(b.gf-b.ga)-(a.gf-a.ga)).forEach((x,i)=>x.awayPos=i+1);
  return arr;
}
function eloRatings(h){const r={};const rows=h.slice(-500);for(const m of rows){r[m.home]??=1500;r[m.away]??=1500;const eh=1/(1+10**((r[m.away]-r[m.home]-65)/400)),ea=1-eh;const sh=m.homeGoals>m.awayGoals?1:m.homeGoals===m.awayGoals?.5:0,sa=1-sh;const K=m.season==="2026/27"?28:16;r[m.home]+=K*(sh-eh);r[m.away]+=K*(sa-ea);}return r;}
function h2h(h,a,b){const r=h.filter(m=>(m.home===a&&m.away===b)||(m.home===b&&m.away===a)).slice(-6);if(!r.length)return{matches:0,homeGF:null,awayGF:null};let hg=0,ag=0;for(const m of r){if(m.home===a){hg+=m.homeGoals;ag+=m.awayGoals;}else{hg+=m.awayGoals;ag+=m.homeGoals;}}return{matches:r.length,homeGF:hg/r.length,awayGF:ag/r.length};}
function commonOpp(h,a,b){const A=h.filter(m=>m.home===a||m.away===a).slice(-14).map(m=>perspective(m,a));const B=h.filter(m=>m.home===b||m.away===b).slice(-14).map(m=>perspective(m,b));const xs=[];for(const x of A)for(const y of B)if(x.opponent===y.opponent)xs.push((x.gf-x.ga)-(y.gf-y.ga));return{count:xs.length,adj:xs.length?clamp(mean(xs)*.07,-.28,.28):0};}
function leagueAvg(h){const r=h.slice(-220);return{homeGoals:mean(r.map(x=>x.homeGoals))||1.45,awayGoals:mean(r.map(x=>x.awayGoals))||1.15,htGoals:mean(r.filter(x=>x.htHome!=null).map(x=>x.htHome+x.htAway))||1.08,corners:mean(r.filter(x=>x.homeCorners!=null).map(x=>x.homeCorners+x.awayCorners))};}

/* ---------------- Distributions ---------------- */
function factorial(n){let x=1;for(let i=2;i<=n;i++)x*=i;return x;}
const poisson=(k,l)=>Math.exp(-l)*Math.pow(l,k)/factorial(k);
function scoreMatrix(hl,al,max=8){const a=[];for(let h=0;h<=max;h++)for(let z=0;z<=max;z++)a.push({h,a:z,p:poisson(h,hl)*poisson(z,al)});const s=a.reduce((q,x)=>q+x.p,0);return a.map(x=>({...x,p:x.p/s}));}
const probability=(m,f)=>m.filter(f).reduce((s,x)=>s+x.p,0);
function overPoisson(lambda,line){const k=Math.floor(line)+1;let p=0;for(let i=k;i<30;i++)p+=poisson(i,lambda);return clamp(p,0,1);}
function empiricalOver(values,line){const xs=values.filter(Number.isFinite);return xs.length?xs.filter(x=>x>line).length/xs.length:null;}

/* ---------------- Model ---------------- */
function confidence({p,current,total,dataQuality,market}){
  let c=38+Math.abs(p-.5)*42+Math.min(12,current*1.6)+(dataQuality-60)*.18;
  if(total<5)c=Math.min(c,42);if(current<5)c=Math.min(c,48);if(current<=2)c=Math.min(c,40);
  if(market==="corners"&&dataQuality<70)c-=6;
  return Math.round(clamp(c,25,84));
}
function buildModel(h,home,away,leagueH=h){
  const la=leagueAvg(leagueH),ha=teamStats(h,home),aa=teamStats(h,away),hv=teamStats(h,home,"home")||ha,av=teamStats(h,away,"away")||aa;
  if(!ha||!aa)throw new Error("No data");
  const table=buildTable(leagueH),ht=table.find(x=>x.team===home)||null,at=table.find(x=>x.team===away)||null,elo=eloRatings(h),eh=elo[home]||1500,ea=elo[away]||1500;
  const H2H=h2h(h,home,away),co=commonOpp(h,home,away);
  const tableAdj=ht&&at&&ht.p>=3&&at.p>=3?clamp((ht.ppg-at.ppg)*.10,-.22,.22):0;
  const eloAdj=clamp((eh-ea)/900,-.28,.28);
  let hl=(safe(hv.gf,la.homeGoals)*.39+safe(av.ga,la.homeGoals)*.28+la.homeGoals*.18+safe(ha.gf,la.homeGoals)*.08+safe(aa.ga,la.homeGoals)*.07)+tableAdj+eloAdj+co.adj;
  let al=(safe(av.gf,la.awayGoals)*.39+safe(hv.ga,la.awayGoals)*.28+la.awayGoals*.18+safe(aa.gf,la.awayGoals)*.08+safe(ha.ga,la.awayGoals)*.07)-tableAdj-eloAdj-co.adj;
  if(H2H.matches>=2){hl=hl*.9+H2H.homeGF*.1;al=al*.9+H2H.awayGF*.1;}
  const shotEdge=(safe(hv.sot,0)-safe(av.sotAgainst,0)-safe(av.sot,0)+safe(hv.sotAgainst,0))*.015;hl+=clamp(shotEdge,-.12,.12);al-=clamp(shotEdge,-.12,.12);
  hl=clamp(hl,.25,3.6);al=clamp(al,.2,3.3);
  const m=scoreMatrix(hl,al,8),pHome=probability(m,x=>x.h>x.a),pDraw=probability(m,x=>x.h===x.a),pAway=probability(m,x=>x.h<x.a),pOver25=probability(m,x=>x.h+x.a>=3),pBTTS=probability(m,x=>x.h>0&&x.a>0);

  const fhHL=clamp(safe(hv.htGF,hl*.43)*.45+safe(av.htGA,hl*.43)*.35+la.htGoals*.52*.20,.06,1.8),fhAL=clamp(safe(av.htGF,al*.43)*.45+safe(hv.htGA,al*.43)*.35+la.htGoals*.48*.20,.05,1.6);
  const fm=scoreMatrix(fhHL,fhAL,5),pFH05=probability(fm,x=>x.h+x.a>=1),pFH15=probability(fm,x=>x.h+x.a>=2),pFHBTTS=probability(fm,x=>x.h>0&&x.a>0);
  const shHL=clamp(safe(hv.shGF,hl-fhHL)*.45+safe(av.shGA,hl-fhHL)*.35+(hl-fhHL)*.20,.08,2),shAL=clamp(safe(av.shGF,al-fhAL)*.45+safe(hv.shGA,al-fhAL)*.35+(al-fhAL)*.20,.08,1.9);
  const sm=scoreMatrix(shHL,shAL,5),pSH05=probability(sm,x=>x.h+x.a>=1),pSH15=probability(sm,x=>x.h+x.a>=2);
  const halfTotal=fhHL+fhAL+shHL+shAL,firstShare=(fhHL+fhAL)/halfTotal,secondShare=1-firstShare,equal=clamp(.32-Math.abs(firstShare-secondShare)*.4,.12,.32),first=firstShare*(1-equal),second=secondShare*(1-equal);

  const cur=Math.min(ha.current,aa.current),tot=Math.min(ha.matches,aa.matches);
  let dq=55;dq+=Math.min(15,cur*2);if(hv.shots!=null&&av.shots!=null)dq+=8;if(hv.sot!=null&&av.sot!=null)dq+=8;if(hv.corners!=null&&av.corners!=null)dq+=8;if(ht&&at)dq+=6;dq=Math.round(clamp(dq,35,100));
  const mk=(name,p,group,market="goals")=>({name,group,probability:pct(p),confidence:confidence({p,current:cur,total:tot,dataQuality:dq,market})});
  const pOver15=probability(m,x=>x.h+x.a>=2),pUnder35=probability(m,x=>x.h+x.a<=3);
  const markets=[mk("1",pHome,"1X2"),mk("X",pDraw,"1X2"),mk("2",pAway,"1X2"),
    mk("1X",pHome+pDraw,"Çifte Şans"),mk("X2",pAway+pDraw,"Çifte Şans"),mk("12",pHome+pAway,"Çifte Şans"),
    mk("1.5 Üst",pOver15,"Gol"),mk("2.5 Üst",pOver25,"Gol"),mk("2.5 Alt",1-pOver25,"Gol"),mk("3.5 Alt",pUnder35,"Gol"),
    mk("KG Var",pBTTS,"KG"),mk("KG Yok",1-pBTTS,"KG"),
    mk("Ev 1.5 Üst",probability(m,x=>x.h>=2),"Takım Gol"),mk("Dep 1.5 Üst",probability(m,x=>x.a>=2),"Takım Gol"),
    mk("İY 0.5 Üst",pFH05,"İlk Yarı"),mk("İY 1.5 Üst",pFH15,"İlk Yarı"),mk("İY KG Var",pFHBTTS,"İlk Yarı"),
    mk("2Y 0.5 Üst",pSH05,"İkinci Yarı"),mk("2Y 1.5 Üst",pSH15,"İkinci Yarı"),
    mk("Daha Çok Gol: İlk Yarı",first,"Yarı"),mk("Daha Çok Gol: İkinci Yarı",second,"Yarı"),mk("Yarılar Eşit",equal,"Yarı")];

  const cornerRows=h.filter(x=>[home,away].includes(x.home)||[home,away].includes(x.away)).slice(-40);
  const teamCornerTotals=[];for(const x of cornerRows){if(x.homeCorners!=null&&x.awayCorners!=null)teamCornerTotals.push(x.homeCorners+x.awayCorners);}
  let cornerLambda=null;if(hv.corners!=null&&av.corners!=null){cornerLambda=safe(hv.corners,0)*.36+safe(av.corners,0)*.36+safe(av.cornersAgainst,0)*.14+safe(hv.cornersAgainst,0)*.14;}else if(la.corners!=null)cornerLambda=la.corners;
  const cornerMarkets=[];if(cornerLambda!=null){for(const line of [9.5,10.5]){const pp=overPoisson(cornerLambda,line),ep=empiricalOver(teamCornerTotals,line),blend=ep==null?pp:pp*.65+ep*.35;cornerMarkets.push(mk(`Korner ${line} Üst`,blend,"Korner","corners"));}}

  const allMarkets=[...markets,...cornerMarkets];
  const pref={["Çifte Şans"]:8,["Gol"]:7,["1X2"]:6,["KG"]:5,["Takım Gol"]:4,["Korner"]:3,["İlk Yarı"]:2,["İkinci Yarı"]:1,["Yarı"]:0};
  const candidates=allMarkets.filter(x=>x.probability>=54&&x.confidence>=40)
    .filter(x=>x.group!=="İkinci Yarı"||(x.probability>=66&&x.confidence>=48))
    .sort((a,b)=>((b.probability*.56+b.confidence*.34+(pref[b.group]||0))-(a.probability*.56+a.confidence*.34+(pref[a.group]||0))));
  const rec=[];const groupCount={};
  for(const x of candidates){
    const cap=(x.group==="Gol"||x.group==="Çifte Şans")?2:1;
    if((groupCount[x.group]||0)>=cap)continue;
    if(x.group==="İkinci Yarı"&&rec.some(y=>y.group==="İlk Yarı"||y.group==="Yarı"))continue;
    rec.push(x);groupCount[x.group]=(groupCount[x.group]||0)+1;
    if(rec.length>=7)break;
  }
  const strongest=rec[0]||null,noBet=!strongest||strongest.probability<57||strongest.confidence<45;
  const top=m.slice().sort((a,b)=>b.p-a.p)[0];
  const reasons=[];
  if(ht&&at){reasons.push(`${home} ligde ${ht.pos}. (${ht.pts} puan), ${away} ${at.pos}. (${at.pts} puan).`);reasons.push(`İç/dış saha gücü: ${home} evde ${ht.homePos}. (${ht.homePPG.toFixed(2)} PPM), ${away} deplasmanda ${at.awayPos}. (${at.awayPPG.toFixed(2)} PPM).`);}
  reasons.push(`2026/27 güncel örneklem: ${ha.current} / ${aa.current} maç.`);
  if(Number.isFinite(eh)&&Number.isFinite(ea))reasons.push(`Elo güç farkı: ${Math.round(eh-ea)} puan.`);
  if(co.count)reasons.push(`${co.count} ortak rakip karşılaştırması modele dahil edildi.`);
  if(H2H.matches)reasons.push(`Son ${H2H.matches} H2H düşük ağırlıkla kullanıldı.`);
  if(hv.sot!=null&&av.sot!=null)reasons.push(`İsabetli şut profili: ${hv.sot.toFixed(1)} / ${av.sot.toFixed(1)}.`);
  if(cornerLambda!=null)reasons.push(`Beklenen toplam korner: ${cornerLambda.toFixed(1)}.`);

  return {expectedGoals:{home:+hl.toFixed(2),away:+al.toFixed(2),total:+(hl+al).toFixed(2)},likelyScore:`${top.h}-${top.a}`,dataQuality:dq,noBet,markets:allMarkets,recommendations:rec,reasons,
    standings:{home:ht,away:at},strength:{homeElo:Math.round(eh),awayElo:Math.round(ea)},stats:{homeCurrentMatches:ha.current,awayCurrentMatches:aa.current,homeFormPPG:ha.points==null?null:+ha.points.toFixed(2),awayFormPPG:aa.points==null?null:+aa.points.toFixed(2),homeShots:hv.shots==null?null:+hv.shots.toFixed(1),awayShots:av.shots==null?null:+av.shots.toFixed(1),homeSOT:hv.sot==null?null:+hv.sot.toFixed(1),awaySOT:av.sot==null?null:+av.sot.toFixed(1),expectedCorners:cornerLambda==null?null:+cornerLambda.toFixed(1),h2h:H2H.matches,commonOpponents:co.count},
    sampleWarning:cur<5?"2026/27 örneklemi 5 maçın altında. 2025/26 destek verisi kullanıldı ve güven otomatik sınırlandı.":null};
}

/* ---------------- Upcoming fixtures fallback: Football-Data.co.uk ---------------- */
const FD_FIXTURES_URL="https://www.football-data.co.uk/fixtures.csv";
function stableFixtureId(parts){let h=2166136261;for(const ch of parts.join("|")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return 1000000000+(Math.abs(h>>>0)%900000000);}
function ymd(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}

async function footballDataUpcoming(date){
  const k=`fd-upcoming-v73:${date}`,c=getCache(k);if(c)return c;
  try{
    const r=await fetch(FD_FIXTURES_URL,{headers:{"User-Agent":"MatchEdge/7.3"}});
    if(!r.ok)throw new Error(`Football-Data fixtures HTTP ${r.status}`);
    const text=await r.text();
    if(text.toLowerCase().includes("<html")||text.length<20)throw new Error("Football-Data fixtures yanıtı geçersiz.");
    const rows=parseCSV(text),out=[];
    for(const row of rows){
      const l=LEAGUE_BY_CSV[String(row.Div||row.div||"").trim()];if(!l)continue;
      const d=parseDate(row.Date||row.date);if(!d||ymd(d)!==date)continue;
      const home=String(row.HomeTeam||row.Home||"").trim(),away=String(row.AwayTeam||row.Away||"").trim();if(!home||!away)continue;
      let tm=String(row.Time||row.time||"12:00").trim();if(!/^\d{1,2}:\d{2}$/.test(tm))tm="12:00";if(tm.length===4)tm="0"+tm;
      const dt=`${date}T${tm}:00`,id=stableFixtureId([l.csv,date,home,away]);
      const hasFT=row.FTHG!==""&&row.FTHG!=null&&row.FTAG!==""&&row.FTAG!=null;
      const f={id,date:dt,localDate:date,displayTime:tm,timestamp:Math.floor(new Date(dt).getTime()/1000),status:hasFT?"FT":"NS",leagueCode:l.code,league:l.name,country:l.country,emoji:l.emoji,round:"",home:{name:home,logo:""},away:{name:away,logo:""},
        score:{home:hasFT?Number(row.FTHG):null,away:hasFT?Number(row.FTAG):null,htHome:row.HTHG!==""&&row.HTHG!=null?Number(row.HTHG):null,htAway:row.HTAG!==""&&row.HTAG!=null?Number(row.HTAG):null},
        elapsed:null,fixtureSource:"football-data.co.uk"};
      out.push(f);setCache(`fixture:${id}`,f,21600000);
    }
    out.sort((a,b)=>a.timestamp-b.timestamp);setCache(k,out,1800000);return out;
  }catch(e){console.warn("Football-Data fixture warning:",e.message);return[];}
}


/* ---------------- ESPN public fixture fallback ---------------- */
function espnStatusToShort(x){
  const n=String(x?.type?.name||"").toUpperCase();
  const d=String(x?.type?.description||"").toUpperCase();
  if(n.includes("STATUS_FINAL")||d.includes("FINAL")) return "FT";
  if(n.includes("STATUS_HALFTIME")||d.includes("HALF")) return "HT";
  if(n.includes("STATUS_IN_PROGRESS")||x?.type?.state==="in") return "LIVE";
  if(n.includes("STATUS_POSTPONED")||d.includes("POSTPON")) return "PST";
  if(n.includes("STATUS_CANCELED")||n.includes("STATUS_CANCELLED")||d.includes("CANCEL")) return "CANC";
  return "NS";
}
async function espnFixturesForDate(date){
  const k=`espn-fixtures:${date}`,c=getCache(k); if(c) return c;
  const compact=date.replaceAll("-","");
  const jobs=Object.entries(ESPN_SLUGS).map(async([code,slug])=>{
    const l=LEAGUES[code];
    try{
      const url=`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${compact}`;
      const r=await fetch(url,{headers:{"User-Agent":"MatchEdge/7.3.2"}});
      if(!r.ok) return [];
      const b=await r.json(), out=[];
      for(const ev of b.events||[]){
        const comp=ev.competitions?.[0]; if(!comp) continue;
        const competitors=comp.competitors||[];
        const hc=competitors.find(x=>x.homeAway==="home"), ac=competitors.find(x=>x.homeAway==="away");
        if(!hc||!ac) continue;
        const dt=ev.date||comp.date; if(!dt) continue;
        const localDate=localYmdFromDate(dt); if(localDate!==date) continue;
        const home=hc.team?.displayName||hc.team?.shortDisplayName||hc.team?.name||"";
        const away=ac.team?.displayName||ac.team?.shortDisplayName||ac.team?.name||"";
        if(!home||!away) continue;
        const id=stableFixtureId(["espn",code,date,home,away]);
        const f={id,date:dt,localDate,displayTime:localTimeFromDate(dt),timestamp:Math.floor(new Date(dt).getTime()/1000),
          status:espnStatusToShort(ev.status||comp.status),leagueCode:code,league:l.name,country:l.country,emoji:l.emoji,
          round:ev.season?.slug||"",home:{name:home,logo:hc.team?.logo||""},away:{name:away,logo:ac.team?.logo||""},
          score:{home:hc.score!==undefined&&hc.score!==null&&hc.score!==""?Number(hc.score):null,away:ac.score!==undefined&&ac.score!==null&&ac.score!==""?Number(ac.score):null,
            htHome:hc.linescores?.[0]?.value!==undefined?Number(hc.linescores[0].value):null,
            htAway:ac.linescores?.[0]?.value!==undefined?Number(ac.linescores[0].value):null},
          elapsed:ev.status?.displayClock||comp.status?.displayClock||null,
          espnEventId:ev.id||null,espnSlug:slug,fixtureSource:"espn-fallback"};
        out.push(f); setCache(`fixture:${id}`,f,21600000);
      }
      return out;
    }catch{return[];}
  });
  const out=(await Promise.all(jobs)).flat().sort((a,b)=>a.timestamp-b.timestamp);
  setCache(k,out,300000);
  return out;
}

/* ---------------- Fixtures ---------------- */
function mapFixture(x){
  const l=LEAGUE_BY_API[x?.league?.id];if(!l)return null;
  return {id:x.fixture.id,date:x.fixture.date,localDate:localYmdFromDate(x.fixture.date),displayTime:localTimeFromDate(x.fixture.date),timestamp:x.fixture.timestamp,status:x.fixture.status?.short||"",leagueCode:l.code,league:l.name,country:l.country,emoji:l.emoji,round:x.league.round||"",home:{name:x.teams.home.name,logo:x.teams.home.logo||""},away:{name:x.teams.away.name,logo:x.teams.away.logo||""},
    score:{home:x.goals?.home??null,away:x.goals?.away??null,htHome:x.score?.halftime?.home??null,htAway:x.score?.halftime?.away??null},
    elapsed:x.fixture.status?.elapsed??null,fixtureSource:"api-football"};
}
function fixtureMergeKey(f){return [f.leagueCode||"",f.localDate||"",norm(f.home?.name||""),norm(f.away?.name||"")].join("|");}
function mergeFixtures(apiRows,fdRows){
  const map=new Map();
  for(const f of fdRows||[]) map.set(fixtureMergeKey(f),f);
  for(const f of apiRows||[]){
    const k=fixtureMergeKey(f),old=map.get(k);
    map.set(k,old?{...old,...f,home:{...old.home,...f.home},away:{...old.away,...f.away},score:{
      home:f.score?.home??old.score?.home??null,
      away:f.score?.away??old.score?.away??null,
      htHome:f.score?.htHome??old.score?.htHome??null,
      htAway:f.score?.htAway??old.score?.htAway??null
    },fixtureSource:"merged"}:{...f,fixtureSource:"api-football"});
  }
  const out=[...map.values()].sort((a,b)=>a.timestamp-b.timestamp);
  out.forEach(f=>setCache(`fixture:${f.id}`,f,3600000));
  return out;
}




async function fetchHistoryHalftime(f){
  if(!f||!LEAGUES[f.leagueCode]?.csv)return null;
  try{
    const hist=await leagueHistory(f.leagueCode);
    const target=hist.find(m=>{
      if(ymd(m.date)!==f.localDate)return false;
      return similarity(f.home?.name,m.home)>=.72&&similarity(f.away?.name,m.away)>=.72;
    });
    if(!target)return null;
    return {
      home:target.homeGoals??null,away:target.awayGoals??null,
      htHome:target.htHome??null,htAway:target.htAway??null,status:"FT"
    };
  }catch{return null}
}

async function fetchFixtureHalftime(f){
  if(!API_KEY||!f?.id)return null;
  // Only API-Football numeric fixture ids are suitable here.
  if(!/^\d+$/.test(String(f.id)))return null;
  try{
    const rows=await apiFootball(`/fixtures?id=${encodeURIComponent(f.id)}&timezone=${encodeURIComponent(APP_TIME_ZONE)}`,120000);
    const x=rows?.[0];
    if(!x)return null;
    return {
      home:x.goals?.home??null,
      away:x.goals?.away??null,
      htHome:x.score?.halftime?.home??null,
      htAway:x.score?.halftime?.away??null,
      status:x.fixture?.status?.short||f.status,
      elapsed:x.fixture?.status?.elapsed??f.elapsed??null
    };
  }catch{return null}
}


async function fetchEspnHalftime(f){
  if(!f?.espnEventId||!f?.espnSlug)return null;
  try{
    const url=`https://site.api.espn.com/apis/site/v2/sports/soccer/${f.espnSlug}/summary?event=${encodeURIComponent(f.espnEventId)}`;
    const r=await fetch(url,{headers:{"User-Agent":"MatchEdge/7.9.12"}});
    if(!r.ok)return null;
    const b=await r.json();
    const comp=b.header?.competitions?.[0]||b.boxscore?.teams?.[0]?.competition||null;
    const competitors=comp?.competitors||b.header?.competitions?.[0]?.competitors||[];
    const hc=competitors.find(x=>x.homeAway==="home"),ac=competitors.find(x=>x.homeAway==="away");
    let htHome=hc?.linescores?.[0]?.value,htAway=ac?.linescores?.[0]?.value;

    // Some ESPN soccer summaries expose periods in header/plays rather than competitor linescores.
    if(htHome==null||htAway==null){
      const periods=b.header?.competitions?.[0]?.details||[];
      const half=periods.find(x=>String(x?.type?.text||x?.type?.name||"").toLowerCase().includes("half"));
      if(half?.competitors){
        const hh=half.competitors.find(x=>x.homeAway==="home"),aa=half.competitors.find(x=>x.homeAway==="away");
        htHome=hh?.score?.value??hh?.score??htHome;
        htAway=aa?.score?.value??aa?.score??htAway;
      }
    }
    return {
      htHome:htHome!=null?Number(htHome):null,
      htAway:htAway!=null?Number(htAway):null
    };
  }catch{return null}
}

async function enrichHalftimeScores(fixtures){
  const byLeague=new Map();
  for(const f of fixtures){
    if(f?.score?.htHome!=null&&f?.score?.htAway!=null)continue;
    if(!LEAGUES[f.leagueCode]?.csv)continue;
    if(!byLeague.has(f.leagueCode))byLeague.set(f.leagueCode,[]);
    byLeague.get(f.leagueCode).push(f);
  }
  for(const [code,list] of byLeague){
    let hist=[];try{hist=await leagueHistory(code)}catch{}
    if(!hist.length)continue;
    for(const f of list){
      const target=hist.find(m=>{
        const d=ymd(m.date);
        if(d!==f.localDate)return false;
        return similarity(f.home?.name,m.home)>=.72&&similarity(f.away?.name,m.away)>=.72;
      });
      if(!target)continue;
      f.score=f.score||{};
      if(f.score.home==null)f.score.home=target.homeGoals;
      if(f.score.away==null)f.score.away=target.awayGoals;
      if(f.score.htHome==null)f.score.htHome=target.htHome;
      if(f.score.htAway==null)f.score.htAway=target.htAway;
      if(f.status==="NS"&&f.score.home!=null&&f.score.away!=null)f.status="FT";
    }
  }
  // Final pass: for finished/live API-Football fixtures still missing HT,
  // request fixture detail directly. This fills cups/leagues that have no CSV history.
  const missing=fixtures.filter(f=>{
    const htMissing=f?.score?.htHome==null||f?.score?.htAway==null;
    const oldScored=scoreKnownServer(f)&&Number(f.timestamp||0)>0&&Number(f.timestamp)<Math.floor(Date.now()/1000)-5400;
    return htMissing&&(statusFinishedServer(f.status)||oldScored||["1H","HT","2H","ET","BT","P","INT","LIVE"].includes(String(f.status||"").toUpperCase()));
  });
  let cursor=0;
  const workers=Array.from({length:Math.min(4,missing.length||1)},async()=>{
    while(true){
      const i=cursor++;if(i>=missing.length)break;
      const f=missing[i];
      let d=await fetchFixtureHalftime(f);
      f.score=f.score||{};
      if(d){
        if(d.home!=null)f.score.home=d.home;
        if(d.away!=null)f.score.away=d.away;
        if(d.htHome!=null)f.score.htHome=d.htHome;
        if(d.htAway!=null)f.score.htAway=d.htAway;
        if(d.status)f.status=d.status;
        if(d.elapsed!=null)f.elapsed=d.elapsed;
      }
      if(f.score.htHome==null||f.score.htAway==null){
        const e=await fetchEspnHalftime(f);
        if(e){
          if(e.htHome!=null)f.score.htHome=e.htHome;
          if(e.htAway!=null)f.score.htAway=e.htAway;
        }
      }
    }
  });
  await Promise.all(workers);
  return fixtures;
}

async function fixturesForThreeDays(centerDate){
  const k=`three-days-v7914:${centerDate}`,cached=getCache(k); if(cached) return cached;
  const dates=[shiftYmd(centerDate,-1),centerDate,shiftYmd(centerDate,1)];
  let apiRows=[],fdRows=[],espnRows=[];

  for(const date of dates){
    try{
      const rows=await apiFootball(`/fixtures?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(APP_TIME_ZONE)}`,300000);
      apiRows.push(...rows.map(mapFixture).filter(Boolean));
    }catch(e){console.warn(`API-Football ${date}:`,e.message);}
  }

  for(const date of dates){
    try{fdRows.push(...await footballDataUpcoming(date));}
    catch(e){console.warn(`Football-Data ${date}:`,e.message);}
  }

  for(const date of dates){
    try{espnRows.push(...await espnFixturesForDate(date));}
    catch(e){console.warn(`ESPN fallback ${date}:`,e.message);}
  }

  let merged=mergeFixtures(apiRows,[...fdRows,...espnRows]).filter(f=>dates.includes(f.localDate));
  const dedupe=new Map();
  for(const f of merged){
    const key=fixtureMergeKey(f);
    if(!dedupe.has(key)) dedupe.set(key,f);
    else if(f.fixtureSource==="api-football"||f.fixtureSource==="merged"){
      const old=dedupe.get(key);
      dedupe.set(key,{...old,...f,home:{...old.home,...f.home},away:{...old.away,...f.away},
        score:{
          home:f.score?.home??old.score?.home??null,away:f.score?.away??old.score?.away??null,
          htHome:f.score?.htHome??old.score?.htHome??null,htAway:f.score?.htAway??old.score?.htAway??null
        },
        espnEventId:f.espnEventId??old.espnEventId??null,espnSlug:f.espnSlug??old.espnSlug??null});
    }
  }
  const fixtures=[...dedupe.values()].sort((a,b)=>a.timestamp-b.timestamp);
  // Keep fixture loading fast. Halftime enrichment must never block the whole page.
  fixtures.forEach(f=>setCache(`fixture:${f.id}`,f,3600000));
  const result={center:centerDate,dates:{yesterday:dates[0],today:dates[1],tomorrow:dates[2]},fixtures};
  setCache(k,result,300000);
  // Enrich scores asynchronously; cached fixture objects are updated in place.
  Promise.resolve().then(()=>enrichHalftimeScores(fixtures)).then(()=>{
    fixtures.forEach(f=>setCache(`fixture:${f.id}`,f,3600000));
  }).catch(e=>console.warn("Halftime background enrichment:",e.message));
  return result;
}
async function fixturesForDate(date){
  const result=await fixturesForThreeDays(date);
  return result.fixtures.filter(f=>f.localDate===date);
}

function siblingLeagueCodes(code){const base=LEAGUES[code];if(!base)return[];return Object.entries(LEAGUES).filter(([c,l])=>c!==code&&l.country===base.country).map(([c])=>c);}
async function resolveTeams(f,leagueH){
  let home=findTeam(f.home.name,leagueH),away=findTeam(f.away.name,leagueH),extra=[];
  if(!home||!away){
    let sib=siblingLeagueCodes(f.leagueCode);
    if(!LEAGUES[f.leagueCode]?.csv) sib=Object.keys(LEAGUES).filter(c=>LEAGUES[c].csv);
    const hs=await Promise.all(sib.map(leagueHistory));extra=hs.flat();
    if(!home)home=findTeam(f.home.name,extra);if(!away)away=findTeam(f.away.name,extra);
  }
  const merged=[...leagueH,...extra].sort((a,b)=>a.date-b.date);
  return {home,away,history:merged};
}

/* ---------------- Routes ---------------- */
app.get("/api/health",(req,res)=>res.json({ok:true,version:"7.9.14-halftime-reliable",timezone:APP_TIME_ZONE,mode:MODE,providers:{apiFootball:!!API_KEY,footballData:true,fixtureFallback:true},features:{yesterdayTodayTomorrow:true,timezoneNormalization:true,fixtureMerge:true,analysisToggle:true}}));

app.get("/api/three-days",async(req,res)=>{
  try{
    const date=String(req.query.date||"");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({ok:false,error:"Geçerli merkez tarih gerekli."});
    const result=await fixturesForThreeDays(date);
    const days={
      [result.dates.yesterday]:result.fixtures.filter(f=>f.localDate===result.dates.yesterday),
      [result.dates.today]:result.fixtures.filter(f=>f.localDate===result.dates.today),
      [result.dates.tomorrow]:result.fixtures.filter(f=>f.localDate===result.dates.tomorrow)
    };
    res.json({ok:true,center:date,dates:result.dates,count:result.fixtures.length,days,fixtures:result.fixtures});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

app.get("/api/day",async(req,res)=>{
  try{
    const date=String(req.query.date||"");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({ok:false,error:"Geçerli tarih gerekli."});
    const fixtures=await fixturesForDate(date);
    res.json({ok:true,date,count:fixtures.length,fixtures});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});



app.get("/api/halftime/:id",async(req,res)=>{
  try{
    const id=String(req.params.id||"");
    const cached=getCache(`fixture:${id}`);
    if(!cached)return res.status(404).json({ok:false,error:"Fixture not found"});
    const f={...cached,score:{...(cached.score||{})}};
    if(f.score.htHome!=null&&f.score.htAway!=null)return res.json({ok:true,score:f.score});
    let d=await fetchHistoryHalftime(f);
    if(!d||d.htHome==null||d.htAway==null)d=await fetchFixtureHalftime(f);
    if(d){
      if(d.home!=null)f.score.home=d.home;
      if(d.away!=null)f.score.away=d.away;
      if(d.htHome!=null)f.score.htHome=d.htHome;
      if(d.htAway!=null)f.score.htAway=d.htAway;
      if(d.status)f.status=d.status;
    }
    if(f.score.htHome==null||f.score.htAway==null){
      const e=await fetchEspnHalftime(f);
      if(e){
        if(e.htHome!=null)f.score.htHome=e.htHome;
        if(e.htAway!=null)f.score.htAway=e.htAway;
      }
    }
    setCache(`fixture:${id}`,f,3600000);
    res.json({ok:true,score:f.score,status:f.status});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

app.get("/api/live",async(req,res)=>{
  try{
    if(!API_KEY)return res.json({ok:true,fixtures:[],liveAvailable:false});
    const body=await apiFootball(`/fixtures?live=all&timezone=${encodeURIComponent(APP_TIME_ZONE)}`,25000);
    const fixtures=(body||[]).map(mapFixture).filter(Boolean);
    res.json({ok:true,fixtures,liveAvailable:true,updatedAt:new Date().toISOString()});
  }catch(e){
    res.status(502).json({ok:false,error:e.message,fixtures:[]});
  }
});

app.get("/api/analyze/:id",async(req,res)=>{
  try{
    const date=String(req.query.date||""),id=+req.params.id;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({ok:false,error:"Geçerli tarih gerekli."});
    let f=getCache(`fixture:${id}`);
    if(!f){const result=await fixturesForThreeDays(date);f=result.fixtures.find(x=>x.id===id);}
    if(!f)return res.status(404).json({ok:false,error:"Maç bulunamadı."});
    const model=await analyzeFixtureModel(f,date);
    res.json({ok:true,fixture:f,data:{provider:"Football-Data.co.uk",seasons:["2026/27","2025/26"],h2hRequired:false},model});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});


function scoreKnownServer(f){return f?.score?.home!=null&&f?.score?.away!=null}
function statusFinishedServer(s){return["FT","AET","PEN","CANC","ABD","AWD","WO"].includes(String(s||"").toUpperCase())}

async function analyzeFixtureModel(f,date){
  const allLeague=await leagueHistory(f.leagueCode),limit=new Date(date+"T00:00:00"),leagueH=allLeague.filter(x=>x.date<limit),resolved=await resolveTeams(f,leagueH),home=resolved.home,away=resolved.away;
  if(!home||!away)throw new Error("No data");
  const h=resolved.history.filter(x=>x.date<limit);
  return buildModel(h,home,away,leagueH);
}


/* ---------------- Frontend ---------------- */
const leagueMeta=JSON.stringify(Object.entries(LEAGUES).map(([code,l])=>({code,name:l.name,emoji:l.emoji,country:l.country})));
const serverToday=localYmdFromDate(new Date());

const HTML=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#07111f"><title>MatchEdge Premium</title><style>
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#12233a,#07111f 46%);color:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button{font-family:inherit}.app{max-width:760px;margin:auto;padding:16px 13px 70px}.top{display:flex;justify-content:space-between;align-items:center}.brand{font-weight:850;font-size:19px}.gold{color:#d9b56f}.live{font-size:10px;color:#48d89b;background:#48d89b18;padding:7px 10px;border-radius:99px}.hero{margin-top:16px;padding:19px;border:1px solid #d9b56f33;border-radius:23px;background:linear-gradient(145deg,#d9b56f18,#122239bb)}.hero h1{margin:0 0 5px;font-size:27px}.hero p{margin:0;color:#91a0b3;font-size:12px;line-height:1.45}.days{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:15px 0 0}.day{border:1px solid #ffffff14;background:#ffffff07;color:#aeb9c8;border-radius:15px;padding:11px 5px;text-align:center}.day b{display:block;font-size:10px;letter-spacing:.4px}.day span{display:block;font-size:17px;color:white;margin-top:4px}.day small{display:block;font-size:9px;color:#8492a6;margin-top:2px}.day.active{background:#d9b56f;color:#07111f;border-color:#d9b56f}.day.active span,.day.active small{color:#07111f}.leagues{display:flex;gap:8px;overflow:auto;padding:14px 0 10px}.chip{white-space:nowrap;border:1px solid #ffffff14;background:#ffffff08;color:#aeb9c8;padding:9px 12px;border-radius:99px}.chip.active{background:#d9b56f;color:#07111f}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 18px}.stat{text-align:center;padding:12px 6px;border:1px solid #ffffff14;border-radius:15px}.stat strong{display:block;font-size:17px}.stat span{font-size:9px;color:#8492a6}.head{display:flex;justify-content:space-between;align-items:end;gap:10px}.head h2{font-size:17px;margin:8px 0}.head span{font-size:10px;color:#8492a6}.leagueGroup{margin:14px 0 20px}.leagueTitle{font-size:12px;font-weight:850;color:#d9b56f;margin:8px 3px}.fixture{padding:15px;margin:9px 0;border:1px solid #ffffff14;border-radius:19px;background:#0d1a2bea}.fxhead{display:flex;justify-content:space-between;color:#8492a6;font-size:9px}.teams{display:grid;grid-template-columns:1fr 52px 1fr;align-items:center;margin-top:13px}.team{text-align:center;font-size:12px;font-weight:750}.team img{width:38px;height:38px;object-fit:contain;display:block;margin:0 auto 6px}.time{text-align:center;color:#d9b56f;font-weight:850}.analyze{width:100%;height:43px;margin-top:13px;border:0;border-radius:13px;background:linear-gradient(135deg,#d9b56f,#f2d18f);font-weight:900;color:#07111f}.analyze:disabled{opacity:.65}.analysis{border-top:1px solid #ffffff14;margin-top:13px;padding-top:13px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.mini{padding:11px;border-radius:12px;background:#ffffff08}.mini span{display:block;color:#8492a6;font-size:8px}.mini strong{font-size:14px}.teamstate{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.state{background:#ffffff06;border:1px solid #ffffff0d;border-radius:13px;padding:11px}.state b{font-size:11px;display:block;margin-bottom:5px}.state span{display:block;color:#9ba8b8;font-size:9px;line-height:1.55}.section{margin-top:15px;color:#d9b56f;font-size:10px;font-weight:850;letter-spacing:.35px}.market{display:grid;grid-template-columns:1fr 64px;padding:10px 0;border-bottom:1px solid #ffffff0d;font-size:12px}.prob{color:#48d89b;font-weight:850;text-align:right}.cornerBox{margin-top:14px;border:1px solid #d9b56f2e;border-radius:14px;overflow:hidden}.cornerBox summary{cursor:pointer;list-style:none;padding:14px 12px;font-size:11px;font-weight:900;color:#d9b56f;background:#d9b56f0a}.cornerBox summary::-webkit-details-marker{display:none}.cornerBox summary:after{content:'＋';float:right;color:#d9b56f}.cornerBox[open] summary:after{content:'−'}.cornerBody{padding:0 12px 7px}.toggleBox{margin-top:12px;border:1px solid #ffffff18;border-radius:14px;overflow:hidden}.toggleBox summary{cursor:pointer;list-style:none;padding:14px 12px;font-size:11px;font-weight:900;color:#d9b56f;background:#ffffff05}.toggleBox summary::-webkit-details-marker{display:none}.toggleBox summary:after{content:'＋';float:right;color:#d9b56f}.toggleBox[open] summary:after{content:'−'}.toggleBody{padding:10px 12px 12px}.reason{font-size:10px;color:#aeb9c8;padding:5px 0;line-height:1.45}
.countryGroup{margin:12px 0;border:1px solid #ffffff18;border-radius:16px;overflow:hidden;background:#ffffff03}
.countryGroup>summary,.leagueFold>summary{cursor:pointer;list-style:none}
.countryGroup>summary::-webkit-details-marker,.leagueFold>summary::-webkit-details-marker{display:none}
.countryTitle{padding:15px 14px;font-size:13px;font-weight:900;display:flex;justify-content:space-between;align-items:center;background:#ffffff06}
.countryTitle:after,.leagueFold>summary:after{content:"＋";color:#d9b56f;font-weight:900}
.countryGroup[open]>.countryTitle:after,.leagueFold[open]>summary:after{content:"−"}
.countryBody{padding:4px 10px 10px}
.leagueFold{margin:8px 0;border:1px solid #ffffff12;border-radius:13px;overflow:hidden}
.leagueFold>summary{padding:12px;font-size:11px;font-weight:900;color:#d9b56f;display:flex;justify-content:space-between;align-items:center;background:#00000018}
.leagueMatches{padding:0 8px 8px}.warn,.error,.empty,.nobet{margin-top:10px;padding:13px;border-radius:13px;font-size:10px;line-height:1.45}.warn{color:#efc987;background:#d9b56f12}.error{color:#ff9aa5;background:#ff708014}.empty{text-align:center;color:#8492a6;border:1px dashed #ffffff1f}.nobet{color:#ffc66d;background:#ffc66d12;border:1px solid #ffc66d22;font-weight:850}.loader{text-align:center;color:#8492a6;padding:24px}@media(max-width:420px){.app{padding-left:10px;padding-right:10px}.hero{padding:16px}.hero h1{font-size:24px}.teamstate{grid-template-columns:1fr}}

.langSwitch{display:flex;gap:6px;align-items:center}
.langBtn{border:1px solid #ffffff22;background:#ffffff08;color:#fff;border-radius:10px;padding:7px 9px;cursor:pointer;font-size:16px;line-height:1}
.langBtn.active{border-color:#d9b56f;background:#d9b56f22}

.dailyPicks>summary{cursor:pointer;list-style:none;padding:14px 15px;font-size:12px;font-weight:900;color:#d9b56f}
.dailyPicks>summary::-webkit-details-marker{display:none}.dailyPicks>summary:after{content:"＋";float:right}.dailyPicks[open]>summary:after{content:"−"}
.dailyPicksBody{padding:0 12px 12px}

.pickCard b{display:block;font-size:11px}.pickCard span{font-size:9px;color:#9ba8b8}
.couponBox b{font-size:11px;color:#d9b56f}
.scoreBtn{margin-top:8px;border:1px solid #ffffff18;background:#ffffff06;color:#d9b56f;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:900;cursor:pointer;width:100%}
.scoreReveal{margin-top:8px;padding:10px;border:1px solid #ffffff12;border-radius:10px;background:#00000020;text-align:center}
.scoreReveal strong{font-size:22px;display:block}.scoreReveal span{font-size:9px;color:#9ba8b8}
.liveScore{font-size:17px;font-weight:900;color:#fff}.liveTag{font-size:9px;color:#43d68a;font-weight:900}

.goalToast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9999;background:#10253e;border:1px solid #d9b56f66;border-radius:14px;padding:12px 16px;color:#fff;font-weight:900;box-shadow:0 10px 30px #0008;display:none;max-width:90%;text-align:center}
.scoreboard{margin:14px 0 18px;border:1px solid #ffffff16;border-radius:16px;background:#0b1422;overflow:hidden}
.scoreboard summary{cursor:pointer;list-style:none;padding:14px 16px;font-size:12px;font-weight:950;letter-spacing:.7px;color:#d9b56f;display:flex;justify-content:space-between;align-items:center}
.scoreboard summary::-webkit-details-marker{display:none}.scoreboardBody{padding:0 12px 12px}
.scoreLeague{margin-top:10px;font-size:10px;font-weight:900;color:#91a0b2;border-bottom:1px solid #ffffff10;padding:7px 2px}
.scoreRow{display:grid;grid-template-columns:48px 1fr auto 1fr;gap:8px;align-items:center;padding:10px 2px;border-bottom:1px solid #ffffff0c;font-size:10px}
.scoreRow .sh{text-align:right}.scoreRow .sa{text-align:left}.scoreNum{min-width:52px;text-align:center;font-size:15px;font-weight:950;color:#fff}
.scoreStatus{font-size:8px;color:#43d68a;font-weight:900;text-align:center;margin-top:2px}
.scoreDetail{display:flex;justify-content:center;gap:8px;margin-top:4px;flex-wrap:wrap}
.scorePill{font-size:8px;color:#9ba8b8;border:1px solid #ffffff12;background:#ffffff05;border-radius:999px;padding:3px 6px;white-space:nowrap}
.scoreEmpty{padding:14px;text-align:center;color:#77879a;font-size:10px}
.creatorCredit{margin:18px 0 8px;text-align:center;color:#77879a;font-size:9px;line-height:1.7;letter-spacing:.2px}
.creatorCredit b{color:#d9b56f;font-weight:900}
.footerNote{margin:22px 0 10px;padding:14px 16px;border:1px solid #ffffff12;border-radius:14px;background:#ffffff04;color:#8f99a8;font-size:10px;line-height:1.6;text-align:center}
</style></head><body><div class="goalToast" id="goalToast"></div><div class="app"><div class="top"><div class="brand">MatchEdge <span class="gold">Premium</span></div><div style="display:flex;gap:8px;align-items:center"><div class="live">● LIVE DATA</div><div class="langSwitch"><button class="langBtn active" id="trBtn" onclick="setLang('tr')" aria-label="Türkçe">🇹🇷</button><button class="langBtn" id="enBtn" onclick="setLang('en')" aria-label="English">🇬🇧</button></div></div></div><div class="hero"><div class="days" id="days"></div></div><div class="leagues" id="leagues"></div><div class="summary"><div class="stat"><strong id="mc">—</strong><span id="sumMatches">SEÇİLİ GÜN MAÇI</span></div><div class="stat"><strong id="ac">0</strong><span id="sumAnalysis">AÇIK ANALİZ</span></div><div class="stat"><strong id="threeDayStrong">3 GÜN</strong><span id="sumDays">DÜN · BUGÜN · YARIN</span></div></div><div class="head"><h2 id="dayHeading">Maçlar</h2><span id="fc"></span></div><details class="scoreboard" id="scoreboard"><summary><span id="scoreboardTitle">⚽ SKOR PANOSU</span><span>⌄</span></summary><div class="scoreboardBody" id="scoreboardBody"></div></details><div id="fixtures"><div class="loader">Fikstür yükleniyor…</div></div><div class="footerNote" id="footerNote"></div><div class="creatorCredit" id="creatorCredit"></div></div><script>
const meta=${leagueMeta};const SERVER_TODAY=${JSON.stringify(serverToday)};let selectedDate=SERVER_TODAY,selected="ALL",allFixtures=[],loadSeq=0,openAnalysisId=null,lang="tr";
const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const I18N={
 tr:{y:"DÜN",t:"BUGÜN",tm:"YARIN",all:"Tümü",fixture:"fikstür",match:"maç",matches:"maç",games:"Maçlar",noGame:"Bugün maç yok",pro:"PRO ANALİZ",closeAnalysis:"ANALİZİ KAPAT",close:"KAPAT",calc:"HESAPLANIYOR…",loading:"Takım performansı ve lig gücü modelleniyor…",fixturesLoading:"Dün, bugün ve yarının fikstürleri yükleniyor…",fixtureFail:"Fikstür alınamadı",retry:"TEKRAR DENE",selected:"SEÇİLİ GÜN MAÇI",open:"AÇIK ANALİZ",three:"3 GÜN",dayLine:"DÜN · BUGÜN · YARIN",expectedGoals:"BEKLENEN GOL",likelyScore:"OLASI SKOR",quality:"VERİ KALİTESİ",corners:"BEKLENEN KORNER",strong:"EN GÜÇLÜ SEÇİMLER",basis:"MODEL DAYANAKLARI",allMarkets:"TÜM ANA MARKETLER",cornerMarkets:"KORNER MARKETLERİ · 9.5 ÜST / 10.5 ÜST",teamStats:"TAKIM İSTATİSTİKLERİ",league:"Lig",position:"sıra",points:"puan",homePos:"Ev sırası",awayPos:"Dep. sırası",homePPM:"Ev PPM",awayPPM:"Dep. PPM",form:"Form PPM",noBet:"NO BET · Model yeterli avantaj görmüyor.",dailyTitle:"GÜNÜN SEÇİMLERİ · RİSK BAZLI",lowRisk:"DÜŞÜK RİSK",mediumRisk:"ORTA RİSK",highRisk:"YÜKSEK RİSK",possibleCoupon:"OLASI KUPON",lowCoupon:"DÜŞÜK RİSK KUPONU",mediumCoupon:"ORTA RİSK KUPONU",highCoupon:"YÜKSEK RİSK KUPONU",modelView:"Model görünümü",loadingPicks:"Günün seçimleri modelleniyor…",noPicks:"Bugün risk filtresini geçen seçim yok.",prob:"Olasılık",conf:"Güven",qualityShort:"Veri",fairOdd:"Model Oranı",combinedOdd:"Tahmini Birleşik Oran",scoreboard:"SKOR PANOSU",notStarted:"BAŞLAMADI",finished:"BİTTİ",htShort:"İY",ftShort:"MS",noScores:"Bu gün için henüz skor yok.",result:"SONUÇ",hideResult:"SONUCU KAPAT",final:"Maç Sonucu",halftime:"İlk Yarı",liveNow:"CANLI",goalAlert:"GOL",creator:"01.09.2026 tarihinde Eddas tarafından geliştirilmiştir. © 2026 Eddas. Tüm hakları saklıdır.",footer:"MatchEdge yalnızca istatistiksel ve model tabanlı analiz sunar; bahis tavsiyesi, kesin sonuç veya kazanç garantisi değildir. Kullanıcı kendi kararlarından ve olası kayıplardan sorumludur. MatchEdge, yürürlükteki hukukun izin verdiği ölçüde, kullanıcı kararlarından doğan kayıp veya zararlardan sorumluluk kabul etmez."},
 en:{y:"YESTERDAY",t:"TODAY",tm:"TOMORROW",all:"All",fixture:"fixtures",match:"match",matches:"matches",games:"Matches",noGame:"No matches today",pro:"PRO ANALYSIS",closeAnalysis:"CLOSE ANALYSIS",close:"CLOSE",calc:"CALCULATING…",loading:"Modelling team performance and league strength…",fixturesLoading:"Loading yesterday, today and tomorrow fixtures…",fixtureFail:"Could not load fixtures",retry:"TRY AGAIN",selected:"SELECTED DAY MATCHES",open:"OPEN ANALYSIS",three:"3 DAYS",dayLine:"YESTERDAY · TODAY · TOMORROW",expectedGoals:"EXPECTED GOALS",likelyScore:"LIKELY SCORE",quality:"DATA QUALITY",corners:"EXPECTED CORNERS",strong:"STRONGEST PICKS",basis:"MODEL BASIS",allMarkets:"ALL MAIN MARKETS",cornerMarkets:"CORNER MARKETS · OVER 9.5 / OVER 10.5",teamStats:"TEAM STATISTICS",league:"League",position:"position",points:"pts",homePos:"Home position",awayPos:"Away position",homePPM:"Home PPM",awayPPM:"Away PPM",form:"Form PPM",noBet:"NO BET · The model does not identify sufficient edge.",dailyTitle:"DAILY PICKS · BY RISK",lowRisk:"LOW RISK",mediumRisk:"MEDIUM RISK",highRisk:"HIGH RISK",possibleCoupon:"POSSIBLE COUPON",lowCoupon:"LOW-RISK COUPON",mediumCoupon:"MEDIUM-RISK COUPON",highCoupon:"HIGH-RISK COUPON",modelView:"Model view",loadingPicks:"Modelling today’s picks…",noPicks:"No picks passed today’s risk filters.",prob:"Probability",conf:"Confidence",qualityShort:"Data",fairOdd:"Model Fair Odds",combinedOdd:"Estimated Combined Odds",scoreboard:"SCOREBOARD",notStarted:"NOT STARTED",finished:"FULL TIME",htShort:"HT",ftShort:"FT",noScores:"No scores yet for this day.",result:"RESULT",hideResult:"HIDE RESULT",final:"Full Time",halftime:"Half Time",liveNow:"LIVE",goalAlert:"GOAL",creator:"Developed by Eddas on 01.09.2026. © 2026 Eddas. All rights reserved.",footer:"MatchEdge provides statistical and model-based analysis only. It is not betting advice and does not guarantee any result or profit. Users are responsible for their own decisions and any resulting losses. To the extent permitted by applicable law, MatchEdge accepts no liability for loss or damage arising from user decisions."}
};
const COUNTRY_EN={"Türkiye":"Turkey","İngiltere":"England","İspanya":"Spain","İtalya":"Italy","Almanya":"Germany","Fransa":"France","Hollanda":"Netherlands","Belçika":"Belgium","Portekiz":"Portugal","Yunanistan":"Greece","İskoçya":"Scotland","Rusya":"Russia","Ukrayna":"Ukraine","Finlandiya":"Finland","Norveç":"Norway","İsveç":"Sweden","Danimarka":"Denmark","İsviçre":"Switzerland","Avusturya":"Austria","Polonya":"Poland","Çekya":"Czechia","Romanya":"Romania","Hırvatistan":"Croatia","Sırbistan":"Serbia","Kıbrıs":"Cyprus","Slovakya":"Slovakia","Slovenya":"Slovenia","İsrail":"Israel","İrlanda":"Ireland","Avrupa":"Europe","Diğer":"Other"};
const LEAGUE_EN={TSL:"Süper Lig",T1L:"1. Lig",TKC:"Turkish Cup",GRE:"Super League Greece",SCL1:"League One",SCL2:"League Two"};
function t(k){return I18N[lang][k]||k}
function locale(){return lang==="en"?"en-GB":"tr-TR"}
function countryName(x){return lang==="en"?(COUNTRY_EN[x]||x):x}
function leagueName(x){return lang==="en"?(LEAGUE_EN[x.code]||x.name):x.name}
function iso(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")}
function shiftYmdClient(v,n){const d=new Date(v+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function statusFinished(s){return["FT","AET","PEN","CANC","ABD","AWD","WO"].includes(s)}
function translateMarketName(name){
 if(lang==="tr")return name;
 const map={"1X":"1X","X2":"X2","12":"12","1.5 Üst":"Over 1.5","3.5 Alt":"Under 3.5","2.5 Üst":"Over 2.5","2.5 Alt":"Under 2.5","KG Var":"BTTS Yes","KG Yok":"BTTS No","Ev 1.5 Üst":"Home Over 1.5","Dep 1.5 Üst":"Away Over 1.5","İY 0.5 Üst":"1H Over 0.5","İY 1.5 Üst":"1H Over 1.5","İY KG Var":"1H BTTS Yes","2Y 0.5 Üst":"2H Over 0.5","2Y 1.5 Üst":"2H Over 1.5","Daha Çok Gol: İlk Yarı":"More Goals: First Half","Daha Çok Gol: İkinci Yarı":"More Goals: Second Half","Yarılar Eşit":"Halves Equal","9.5 Üst":"Over 9.5","10.5 Üst":"Over 10.5","Korner 9.5 Üst":"Corners Over 9.5","Korner 10.5 Üst":"Corners Over 10.5","Korner 11.5 Alt":"Corners Under 11.5"};
 if(map[name])return map[name];
 let v=String(name);
 v=v.replace(/Korner\s*/gi,"Corners ");
 v=v.replace(/\bÜst\b/gi,"Over").replace(/\bAlt\b/gi,"Under");
 return v;
}
function translateReason(x){
 if(lang==="tr")return x;
 return String(x)
  .replace(" ligde "," is ").replace(". sıra", "th in the league")
  .replace(" puan", " pts").replace("İç/dış saha gücü:", "Home/away strength:")
  .replace(" evde ", " home ").replace(" deplasmanda ", " away ")
  .replace("2026/27 güncel örneklem:", "2026/27 current sample:")
  .replace(" maç.", " matches.").replace("Elo güç farkı:", "Elo strength difference:")
  .replace(" ortak rakip karşılaştırması modele dahil edildi.", " common-opponent comparisons included in the model.")
  .replace(" düşük ağırlıkla kullanıldı.", " used at low weight.")
  .replace("İsabetli şut profili:", "Shots-on-target profile:")
  .replace("Beklenen toplam korner:", "Expected total corners:");
}
function applyStatic(){
 trBtn.classList.toggle("active",lang==="tr");enBtn.classList.toggle("active",lang==="en");
 sumMatches.textContent=t("selected");sumAnalysis.textContent=t("open");threeDayStrong.textContent=t("three");sumDays.textContent=t("dayLine");footerNote.textContent=t("footer");creatorCredit.textContent=t("creator");
 document.documentElement.lang=lang
}
function setLang(v){lang=v;localStorage.setItem("matchedge_lang",v);closeOpenAnalysis();applyStatic();chips();renderDays();render();}
function renderDays(){
 const defs=[
  {label:t("y"),date:new Date(shiftYmdClient(SERVER_TODAY,-1)+"T12:00:00Z")},
  {label:t("t"),date:new Date(SERVER_TODAY+"T12:00:00Z")},
  {label:t("tm"),date:new Date(shiftYmdClient(SERVER_TODAY,1)+"T12:00:00Z")}
 ];
 days.innerHTML=defs.map(x=>{
  const id=iso(x.date);
  return '<button class="day '+(id===selectedDate?'active':'')+'" data-date="'+id+'"><b>'+x.label+'</b><span>'+x.date.getUTCDate()+'</span><small>'+esc(x.date.toLocaleDateString(locale(),{month:"short",timeZone:"UTC"}))+'</small></button>';
 }).join("");
 days.querySelectorAll("button").forEach(b=>b.onclick=()=>{
  selectedDate=b.dataset.date;
  closeOpenAnalysis();
  renderDays();
  render();
 });
}
function chips(){const arr=[{code:"ALL",name:t("all"),emoji:"🌍"},...meta];leagues.innerHTML=arr.map(x=>'<button class="chip '+(selected===x.code?'active':'')+'" data-c="'+x.code+'">'+x.emoji+' '+esc(x.code==="ALL"?x.name:leagueName(x))+'</button>').join("");leagues.querySelectorAll("button").forEach(b=>b.onclick=()=>{selected=b.dataset.c;closeOpenAnalysis();chips();render();});}
function filtered(){return allFixtures.filter(f=>{if(f.localDate!==selectedDate)return false;if(selected!=="ALL"&&f.leagueCode!==selected)return false;if(selectedDate>SERVER_TODAY&&statusFinished(f.status))return false;return true;});}
function closeOpenAnalysis(){
  if(openAnalysisId!==null){const old=document.getElementById("a"+openAnalysisId);if(old)old.innerHTML="";const btn=document.querySelector('.analyze[data-id="'+openAnalysisId+'"]');if(btn){btn.textContent=t("pro");btn.disabled=false;}}
  openAnalysisId=null;ac.textContent="0";
}

function scoreKnown(f){return f?.score?.home!==null&&f?.score?.home!==undefined&&f?.score?.away!==null&&f?.score?.away!==undefined}
function isLiveStatus(s){return["1H","HT","2H","ET","BT","P","INT","LIVE"].includes(String(s||"").toUpperCase())}
function resultBlock(f){
  if(!scoreKnown(f))return"";
  const ht=(f.score.htHome!==null&&f.score.htHome!==undefined&&f.score.htAway!==null&&f.score.htAway!==undefined)?'<span>'+t("halftime")+': '+f.score.htHome+' - '+f.score.htAway+'</span>':"";
  return '<div class="scoreReveal"><span>'+t("final")+'</span><strong>'+f.score.home+' - '+f.score.away+'</strong>'+ht+'</div>';
}
function toggleResult(id,b){
  const x=document.getElementById("r"+id);if(!x)return;
  const open=x.dataset.open==="1";
  x.dataset.open=open?"0":"1";
  x.innerHTML=open?"":resultBlock(allFixtures.find(f=>String(f.id)===String(id)));
  b.textContent=open?t("result"):t("hideResult");
}
let liveBaseline=new Map(),livePollTimer=null;
function showGoalToast(text){goalToast.textContent=text;goalToast.style.display="block";clearTimeout(showGoalToast._t);showGoalToast._t=setTimeout(()=>goalToast.style.display="none",7000)}
function liveKey(f){return [f.leagueCode,normClient(f.home?.name),normClient(f.away?.name)].join("|")}
function normClient(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function applyLiveFixtures(live){
  let changed=false;
  for(const lf of live){
    const k=liveKey(lf),newTotal=scoreKnown(lf)?Number(lf.score.home)+Number(lf.score.away):null,old=liveBaseline.get(k);
    if(old!==undefined&&newTotal!==null&&newTotal>old){
      showGoalToast("⚽ "+t("goalAlert")+" · "+lf.home.name+" "+lf.score.home+" - "+lf.score.away+" "+lf.away.name);
    }
    if(newTotal!==null)liveBaseline.set(k,newTotal);
    const idx=allFixtures.findIndex(f=>liveKey(f)===k);
    if(idx>=0){
      const oldF=allFixtures[idx],os=oldF.score||{},ns=lf.score||{};
      allFixtures[idx]={...oldF,...lf,home:{...oldF.home,...lf.home},away:{...oldF.away,...lf.away},
        score:{
          home:ns.home??os.home??null,away:ns.away??os.away??null,
          htHome:ns.htHome??os.htHome??null,htAway:ns.htAway??os.htAway??null
        }};
      changed=true;
    }
  }
  if(changed)render();
}
async function pollLive(){
  try{const r=await fetch("/api/live",{cache:"no-store"}),j=await r.json();if(j.ok)applyLiveFixtures(j.fixtures||[]);}catch{}
}
function startLivePolling(){if(livePollTimer)clearInterval(livePollTimer);pollLive();livePollTimer=setInterval(pollLive,30000)}
if(window.scoreboard)scoreboard.addEventListener("toggle",()=>{if(scoreboard.open)loadMissingHalftimes()});

function liveMinuteValue(f){
  const e=f?.elapsed;
  if(typeof e==="number"&&Number.isFinite(e))return e;
  const m=String(e||"").match(/\d+/);return m?Number(m[0]):0;
}
function fixtureStateRank(f){
  if(isLiveStatus(f.status))return 0;
  const oldEnough=Number(f.timestamp||0)>0&&Number(f.timestamp)<Math.floor(Date.now()/1000)-7200;
  if(statusFinished(f.status)||(scoreKnown(f)&&oldEnough))return 2;
  return 1;
}
function sortScoreFixtures(a,b){
  const ra=fixtureStateRank(a),rb=fixtureStateRank(b);
  if(ra!==rb)return ra-rb;
  if(ra===0){
    const ma=liveMinuteValue(a),mb=liveMinuteValue(b);
    if(ma!==mb)return mb-ma; // live: later minute first
  }
  const ta=Number(a.timestamp||new Date(a.date||0).getTime()/1000||0);
  const tb=Number(b.timestamp||new Date(b.date||0).getTime()/1000||0);
  if(ra===1&&ta!==tb)return ta-tb; // upcoming: nearest kickoff first
  if(ra===2&&ta!==tb)return tb-ta; // finished: most recent first
  return String(a.home?.name||"").localeCompare(String(b.home?.name||""),lang==="tr"?"tr":"en");
}

let halftimeLoading=false;
async function loadMissingHalftimes(){
  if(halftimeLoading)return;
  const missing=(allFixtures||[]).filter(f=>f.localDate===selectedDate&&(statusFinished(f.status)||isLiveStatus(f.status))&&(f?.score?.htHome==null||f?.score?.htAway==null));
  if(!missing.length)return;
  halftimeLoading=true;
  try{
    await Promise.all(missing.slice(0,12).map(async f=>{
      try{
        const r=await fetch("/api/halftime/"+encodeURIComponent(f.id),{cache:"no-store"});
        const j=await r.json();
        if(j.ok&&j.score){
          f.score={
            home:j.score.home??f.score?.home??null,away:j.score.away??f.score?.away??null,
            htHome:j.score.htHome??f.score?.htHome??null,htAway:j.score.htAway??f.score?.htAway??null
          };
          if(j.status)f.status=j.status;
          renderScoreboard();
        }
      }catch{}
    }));
  }finally{halftimeLoading=false}
}
function renderScoreboard(){
  if(!window.scoreboardBody)return;
  scoreboardTitle.textContent="⚽ "+t("scoreboard");
  const scored=(allFixtures||[]).filter(f=>f.localDate===selectedDate);
  if(!scored.length){scoreboardBody.innerHTML='<div class="scoreEmpty">'+t("noScores")+'</div>';return;}

  const by={};
  for(const f of scored){
    const country=(f.emoji||"")+" "+(f.country||"");
    const league=(f.league||f.leagueCode||"");
    const k=country+"|||"+league;
    (by[k]||(by[k]=[])).push(f);
  }

  const groups=Object.entries(by).map(([k,arr])=>{
    const [country,league]=k.split("|||");
    arr.sort(sortScoreFixtures);
    const liveCount=arr.filter(f=>isLiveStatus(f.status)).length;
    const nextLiveMinute=liveCount?Math.max(...arr.filter(f=>isLiveStatus(f.status)).map(liveMinuteValue)): -1;
    const nextKick=Math.min(...arr.filter(f=>fixtureStateRank(f)===1).map(f=>Number(f.timestamp||9e15)),9e15);
    return {country,league,arr,liveCount,nextLiveMinute,nextKick};
  });

  groups.sort((a,b)=>{
    if((a.liveCount>0)!==(b.liveCount>0))return a.liveCount>0?-1:1; // leagues with live matches first
    if(a.liveCount&&b.liveCount&&a.nextLiveMinute!==b.nextLiveMinute)return b.nextLiveMinute-a.nextLiveMinute;
    if(a.nextKick!==b.nextKick)return a.nextKick-b.nextKick;
    const c=a.country.localeCompare(b.country,lang==="tr"?"tr":"en");if(c)return c;
    return a.league.localeCompare(b.league,lang==="tr"?"tr":"en");
  });

  scoreboardBody.innerHTML=groups.map(g=>{
    const head=(g.country?esc(g.country)+" · ":"")+esc(g.league);
    return '<div class="scoreLeague">'+head+'</div>'+g.arr.map(f=>{
      const live=isLiveStatus(f.status),finished=statusFinished(f.status)||(!live&&scoreKnown(f)&&Number(f.timestamp||0)<Math.floor(Date.now()/1000)-7200);
      const st=live?t("liveNow")+(f.elapsed?' · '+esc(f.elapsed)+"'":""):finished?t("finished"):t("notStarted");
      const sc=live||finished?(scoreKnown(f)?f.score.home+' - '+f.score.away:'–'):'– : –';
      const htKnown=f?.score?.htHome!==null&&f?.score?.htHome!==undefined&&f?.score?.htAway!==null&&f?.score?.htAway!==undefined;
      const detail=(live||finished)&&htKnown?'<div class="scoreDetail"><span class="scorePill">'+t("htShort")+' '+f.score.htHome+'-'+f.score.htAway+'</span></div>':"";
      return '<div class="scoreRow"><div>'+esc(f.displayTime||"")+'</div><div class="sh">'+esc(f.home.name)+'</div><div><div class="scoreNum">'+sc+'</div><div class="scoreStatus">'+st+'</div>'+detail+'</div><div class="sa">'+esc(f.away.name)+'</div></div>';
    }).join("");
  }).join("");
}
function render(){
  renderScoreboard();
  if(window.scoreboard&&scoreboard.open)setTimeout(loadMissingHalftimes,0);
  const a=filtered().slice().sort(sortScoreFixtures);mc.textContent=a.length;fc.textContent=a.length+" "+t("fixture");
  const dd=new Date(selectedDate+"T12:00:00Z");dayHeading.textContent=dd.toLocaleDateString(locale(),{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"})+(lang==="tr"?" maçları":" matches");
  const countries={};
  meta.forEach(l=>{
    const info=allFixtures.find(f=>f.leagueCode===l.code);
    const country=l.country||info?.country||"Diğer";
    if(!countries[country])countries[country]={emoji:l.emoji||"⚽",leagues:{}};
    countries[country].leagues[l.code]={meta:l,matches:[]};
  });
  a.forEach(f=>{const country=f.country||"Diğer";if(!countries[country])countries[country]={emoji:f.emoji||"⚽",leagues:{}};if(!countries[country].leagues[f.leagueCode])countries[country].leagues[f.leagueCode]={meta:{code:f.leagueCode,name:f.league,emoji:f.emoji},matches:[]};countries[country].leagues[f.leagueCode].matches.push(f);});
  const matchHtml=f=>{
    const live=isLiveStatus(f.status);
    const center=live&&scoreKnown(f)?'<div class="time"><div class="liveScore">'+f.score.home+'-'+f.score.away+'</div><div class="liveTag">'+t("liveNow")+(f.elapsed?' · '+esc(f.elapsed)+"'":"")+'</div></div>':'<div class="time">'+(statusFinished(f.status)?'FT':'VS')+'</div>';
    const resultBtn=!live&&scoreKnown(f)&&statusFinished(f.status)?'<button class="scoreBtn" onclick="toggleResult('+JSON.stringify(f.id)+',this)">'+t("result")+'</button><div id="r'+f.id+'" data-open="0"></div>':"";
    return '<div class="fixture"><div class="fxhead"><span>'+esc(f.round||f.status||"")+'</span><span>'+esc(f.displayTime||"")+'</span></div><div class="teams"><div class="team">'+(f.home.logo?'<img src="'+esc(f.home.logo)+'" alt="">':'')+esc(f.home.name)+'</div>'+center+'<div class="team">'+(f.away.logo?'<img src="'+esc(f.away.logo)+'" alt="">':'')+esc(f.away.name)+'</div></div>'+resultBtn+'<button class="analyze" data-id="'+f.id+'" onclick="analyze('+f.id+',this)">'+t("pro")+'</button><div id="a'+f.id+'"></div></div>';
  };
  const countryEntries=Object.entries(countries).map(([country,c])=>{const count=Object.values(c.leagues).reduce((n,g)=>n+g.matches.length,0);return[country,c,count];}).sort((a,b)=>{if((b[2]>0)!==(a[2]>0))return b[2]>0?1:-1;if(b[2]!==a[2])return b[2]-a[2];return countryName(a[0]).localeCompare(countryName(b[0]),locale());});
  fixtures.innerHTML=countryEntries.map(([country,c,count])=>{const groups=Object.values(c.leagues).sort((a,b)=>{const ah=a.matches.length>0,bh=b.matches.length>0;if(ah!==bh)return bh-ah;if(b.matches.length!==a.matches.length)return b.matches.length-a.matches.length;return leagueName(a.meta).localeCompare(leagueName(b.meta),locale());});const leaguesHtml=groups.map(g=>{const n=g.matches.length;return'<details class="leagueFold"><summary>'+esc(leagueName(g.meta))+' <span>'+n+' '+(n===1?t("match"):t("matches"))+'</span></summary><div class="leagueMatches">'+(n?g.matches.map(matchHtml).join(""):'<div class="empty">'+t("noGame")+'</div>')+'</div></details>';}).join("");return'<details class="countryGroup"><summary class="countryTitle"><span>'+esc(c.emoji+" "+countryName(country))+'</span><span>'+count+' '+(count===1?t("match"):t("matches"))+'</span></summary><div class="countryBody">'+leaguesHtml+'</div></details>';}).join("");
}

async function loadThreeDays(){const seq=++loadSeq;closeOpenAnalysis();mc.textContent="—";fc.textContent="";fixtures.innerHTML='<div class="loader">'+t("fixturesLoading")+'</div>';try{const r=await fetch("/api/three-days?date="+encodeURIComponent(SERVER_TODAY)),j=await r.json();if(!j.ok)throw Error(j.error||t("fixtureFail"));if(seq!==loadSeq)return;allFixtures=j.fixtures||[];renderDays();render();}catch(e){if(seq!==loadSeq)return;allFixtures=[];mc.textContent="—";fixtures.innerHTML='<div class="error">'+t("fixtureFail")+': '+esc(e.message)+'<br><br><button class="analyze" onclick="loadThreeDays()">'+t("retry")+'</button></div>';}}
function marketRows(xs){return(xs||[]).map(x=>'<div class="market"><b>'+esc(translateMarketName(x.name))+'</b><span class="prob">'+x.probability+'%</span></div>').join("")}
function splitMarkets(xs){const a=xs||[];return{main:a.filter(x=>x.group!=="Korner"),corners:a.filter(x=>x.group==="Korner")}}
function allMarketsBlock(xs){const z=splitMarkets(xs);return marketRows(z.main)+(z.corners.length?'<details class="cornerBox"><summary>'+t("cornerMarkets")+'</summary><div class="cornerBody">'+marketRows(z.corners)+'</div></details>':"")}
async function analyze(id,b){
 const box=document.getElementById("a"+id);if(openAnalysisId===id){closeOpenAnalysis();return;}if(openAnalysisId!==null&&openAnalysisId!==id)closeOpenAnalysis();openAnalysisId=id;ac.textContent="1";b.disabled=true;b.textContent=t("calc");box.innerHTML='<div class="loader">'+t("loading")+'</div>';
 try{
  const r=await fetch("/api/analyze/"+id+"?date="+encodeURIComponent(selectedDate)),j=await r.json();if(!j.ok)throw Error(j.error||"No data");
  const m=j.model,s=m.stats||{},st=m.standings||{},fx=j.fixture;
  const teamStats='<details class="toggleBox"><summary>'+t("teamStats")+'</summary><div class="toggleBody"><div class="teamstate"><div class="state"><b>'+esc(fx.home.name)+'</b><span>'+t("league")+': '+(st.home?.pos??"—")+'. '+t("position")+' · '+(st.home?.pts??"—")+' '+t("points")+'</span><span>'+t("homePos")+': '+(st.home?.homePos??"—")+' · '+t("homePPM")+': '+(st.home?.homePPG?.toFixed?.(2)??"—")+'</span><span>'+t("form")+': '+(s.homeFormPPG??"—")+' · SOT: '+(s.homeSOT??"—")+'</span></div><div class="state"><b>'+esc(fx.away.name)+'</b><span>'+t("league")+': '+(st.away?.pos??"—")+'. '+t("position")+' · '+(st.away?.pts??"—")+' '+t("points")+'</span><span>'+t("awayPos")+': '+(st.away?.awayPos??"—")+' · '+t("awayPPM")+': '+(st.away?.awayPPG?.toFixed?.(2)??"—")+'</span><span>'+t("form")+': '+(s.awayFormPPG??"—")+' · SOT: '+(s.awaySOT??"—")+'</span></div></div></div></details>';
  box.innerHTML='<div class="analysis">'+(m.noBet?'<div class="nobet">'+t("noBet")+'</div>':'')+'<div class="grid"><div class="mini"><span>'+t("expectedGoals")+'</span><strong>'+m.expectedGoals.home+' – '+m.expectedGoals.away+'</strong></div><div class="mini"><span>'+t("likelyScore")+'</span><strong>'+m.likelyScore+'</strong></div><div class="mini"><span>'+t("quality")+'</span><strong>'+m.dataQuality+'/100</strong></div><div class="mini"><span>'+t("corners")+'</span><strong>'+(s.expectedCorners??"—")+'</strong></div></div>'+teamStats+'<div class="section">'+t("strong")+'</div>'+marketRows(m.recommendations)+'<details class="toggleBox"><summary>'+t("basis")+'</summary><div class="toggleBody">'+(m.reasons||[]).map(x=>'<div class="reason">• '+esc(translateReason(x))+'</div>').join("")+'</div></details><div class="section">'+t("allMarkets")+'</div>'+allMarketsBlock(m.markets)+'</div>';
  b.textContent=t("closeAnalysis");
 }catch(e){box.innerHTML='<div class="error">'+esc(e.message||"No data")+'</div>';b.textContent=t("close");}finally{b.disabled=false}
}
lang=localStorage.getItem("matchedge_lang")==="en"?"en":"tr";applyStatic();
chips();renderDays();loadThreeDays();startLivePolling();
</script></body></html>`;

app.get("/",(req,res)=>res.status(200).type("html").send(HTML));
app.use((req,res)=>res.status(404).json({ok:false,error:"Not found"}));
app.listen(PORT,"0.0.0.0",()=>console.log(`MatchEdge Premium V7.9.14 running on port ${PORT}`));
