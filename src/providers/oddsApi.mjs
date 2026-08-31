import { fetchJson, cachedJson } from "../lib/http.mjs";

const BASE = "https://api.the-odds-api.com/v4/sports";

const SPORT = {
  PL:"soccer_epl",
  PD:"soccer_spain_la_liga",
  SA:"soccer_italy_serie_a",
  BL1:"soccer_germany_bundesliga",
  FL1:"soccer_france_ligue_one",
  DED:"soccer_netherlands_eredivisie",
  PPL:"soccer_portugal_primeira_liga",
  TSL:"soccer_turkey_super_league",
  BSA:"soccer_brazil_campeonato"
};

function best(rows, marketKey, outcomeName, point = null) {
  let v = null;
  for (const b of rows?.bookmakers || []) {
    const m = b.markets?.find(x => x.key === marketKey);
    for (const o of m?.outcomes || []) {
      const pointOk = point == null || Number(o.point) === Number(point);
      if (o.name === outcomeName && pointOk && (!v || o.price > v)) v = o.price;
    }
  }
  return v;
}

export const oddsApi = {
  async leagueOdds(leagueCode) {
    const key = process.env.ODDS_API_KEY;
    const sport = SPORT[leagueCode];
    if (!key || !sport) return [];
    return cachedJson(`odds:${leagueCode}`, 180000, async () => {
      const qs = new URLSearchParams({
        apiKey:key, regions:"eu,uk", markets:"h2h,totals", oddsFormat:"decimal"
      });
      const { data } = await fetchJson(`${BASE}/${sport}/odds?${qs}`);
      return (Array.isArray(data) ? data : []).map(e => ({
        home:e.home_team, away:e.away_team,
        odds:{
          H:best(e,"h2h",e.home_team),
          D:best(e,"h2h","Draw"),
          A:best(e,"h2h",e.away_team),
          O25:best(e,"totals","Over",2.5),
          U25:best(e,"totals","Under",2.5)
        }
      }));
    });
  }
};
