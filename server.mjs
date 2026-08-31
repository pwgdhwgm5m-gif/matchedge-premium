import express from "express";
import { apiFootball, LEAGUES } from "./src/providers/apiFootball.mjs";
import { oddsApi } from "./src/providers/oddsApi.mjs";
import { buildPrediction, ev } from "./src/model/engine.mjs";

const app = express();
const PORT = process.env.PORT || 3000;

const seasonFor = date => {
  const d = new Date(`${date}T12:00:00Z`);
  return d.getUTCMonth()+1 >= 7 ? d.getUTCFullYear() : d.getUTCFullYear()-1;
};

const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/[^a-z0-9]/g,"");

app.use(express.json());

app.get("/api/health", (req,res)=>res.json({
  ok:true, version:"4.0.0",
  providers:{football:Boolean(process.env.API_FOOTBALL_KEY),odds:Boolean(process.env.ODDS_API_KEY)},
  mode:process.env.ANALYSIS_MODE || "balanced"
}));

app.get("/api/leagues",(req,res)=>res.json(
  Object.entries(LEAGUES).map(([code,v])=>({code,...v}))
));

app.get("/api/day", async (req,res)=>{
  const date=req.query.date || new Date().toISOString().slice(0,10);
  const errors=[];
  try {
    const fixtures=await apiFootball.fixturesByDate(date);
    res.json({date,count:fixtures.length,matches:fixtures,errors});
  } catch(e) {
    res.json({date,count:0,matches:[],errors:[e.message]});
  }
});

app.get("/api/analyze/:fixtureId", async (req,res)=>{
  const fixtureId=Number(req.params.fixtureId);
  const date=req.query.date || new Date().toISOString().slice(0,10);
  const errors=[];
  try {
    const day=await apiFootball.fixturesByDate(date);
    const fixture=day.find(x=>x.id===fixtureId);
    if(!fixture) return res.status(404).json({error:"Fixture not found for selected date"});
    const season=seasonFor(date);

    const standings=await apiFootball.standings(fixture.leagueCode,season).catch(e=>{errors.push(`standings: ${e.message}`);return[]});
    const homeFixtures=await apiFootball.recentTeamFixtures(fixture.leagueCode,season,fixture.home.id,10).catch(e=>{errors.push(`home form: ${e.message}`);return[]});
    const awayFixtures=await apiFootball.recentTeamFixtures(fixture.leagueCode,season,fixture.away.id,10).catch(e=>{errors.push(`away form: ${e.message}`);return[]});
    const h2h=await apiFootball.h2h(fixture.home.id,fixture.away.id,10).catch(e=>{errors.push(`h2h: ${e.message}`);return[]});

    // Advanced fixture statistics are deliberately optional because they are request-heavy.
    // Turn on with ANALYSIS_MODE=deep when a paid provider plan is available.
    let homeStats=[], awayStats=[];
    if((process.env.ANALYSIS_MODE||"balanced")==="deep") {
      const gather=async(rows,teamId)=>{
        const out=[];
        for(const f of rows.slice(0,5)) {
          try { out.push(await apiFootball.fixtureStatistics(f.id)); } catch(e) { errors.push(`stats ${f.id}: ${e.message}`); }
        }
        return out;
      };
      homeStats=await gather(homeFixtures,fixture.home.id);
      awayStats=await gather(awayFixtures,fixture.away.id);
    }

    const model=buildPrediction({
      homeId:fixture.home.id, awayId:fixture.away.id,
      homeFixtures, awayFixtures, standings, h2h, homeStats, awayStats
    });

    let odds={};
    if(process.env.ODDS_API_KEY){
      const pack=await oddsApi.leagueOdds(fixture.leagueCode).catch(e=>{errors.push(`odds: ${e.message}`);return[]});
      const found=pack.find(e=>norm(e.home)===norm(fixture.home.name)&&norm(e.away)===norm(fixture.away.name));
      odds=found?.odds||{};
    }

    for(const [k,m] of Object.entries(model.markets)) {
      const o=odds[k]||null; m.odds=o; m.ev=o?ev(m.prob,o):null;
    }

    res.json({fixture,model,errors});
  } catch(e) {
    res.status(500).json({error:e.message,errors});
  }
});

app.use(express.static("public"));
app.get("*",(req,res)=>res.sendFile(process.cwd()+"/public/index.html"));
app.listen(PORT,()=>console.log(`MatchEdge Premium V4 listening on ${PORT}`));
