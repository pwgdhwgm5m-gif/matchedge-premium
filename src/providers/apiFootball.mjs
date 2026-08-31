import { fetchJson, cachedJson, rateLimited } from "../lib/http.mjs";

const BASE = "https://v3.football.api-sports.io";

export const LEAGUES = {
  TSL: { id: 203, name: "SÃ¼per Lig", country: "TÃ¼rkiye", flag: "ðŸ‡¹ðŸ‡·" },
  PL:  { id: 39,  name: "Premier League", country: "England", flag: "ðŸ‡¬ðŸ‡§" },
  PD:  { id: 140, name: "La Liga", country: "Spain", flag: "ðŸ‡ªðŸ‡¸" },
  SA:  { id: 135, name: "Serie A", country: "Italy", flag: "ðŸ‡®ðŸ‡¹" },
  BL1: { id: 78,  name: "Bundesliga", country: "Germany", flag: "ðŸ‡©ðŸ‡ª" },
  FL1: { id: 61,  name: "Ligue 1", country: "France", flag: "ðŸ‡«ðŸ‡·" },
  DED: { id: 88,  name: "Eredivisie", country: "Netherlands", flag: "ðŸ‡³ðŸ‡±" },
  PPL: { id: 94,  name: "Primeira Liga", country: "Portugal", flag: "ðŸ‡µðŸ‡¹" },
  BSA: { id: 71,  name: "BrasileirÃ£o", country: "Brazil", flag: "ðŸ‡§ðŸ‡·" }
};

const idToCode = new Map(Object.entries(LEAGUES).map(([c, v]) => [v.id, c]));

function headers() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY missing");
  return { "x-apisports-key": key };
}

async function get(path, params, ttlMs = 300000) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([,v]) => v !== undefined && v !== null)
      .map(([k,v]) => [k, String(v)])
  ).toString();
  const key = `${path}?${qs}`;
  return cachedJson(key, ttlMs, () =>
    rateLimited(async () => {
      const { data } = await fetchJson(`${BASE}/${path}?${qs}`, { headers: headers() });
      if (data?.errors && Object.keys(data.errors).length) {
        throw new Error(JSON.stringify(data.errors));
      }
      return data?.response || [];
    }, Number(process.env.API_MIN_GAP_MS || 6200))
  );
}

function mapFixture(x) {
  const leagueCode = idToCode.get(x?.league?.id);
  return {
    id: x?.fixture?.id,
    date: x?.fixture?.date,
    status: x?.fixture?.status?.short || "",
    leagueCode,
    leagueId: x?.league?.id,
    leagueName: x?.league?.name,
    round: x?.league?.round || "",
    home: { id: x?.teams?.home?.id, name: x?.teams?.home?.name || "", logo: x?.teams?.home?.logo || "" },
    away: { id: x?.teams?.away?.id, name: x?.teams?.away?.name || "", logo: x?.teams?.away?.logo || "" },
    goals: { home: x?.goals?.home ?? null, away: x?.goals?.away ?? null },
    halftime: { home: x?.score?.halftime?.home ?? null, away: x?.score?.halftime?.away ?? null }
  };
}

export const apiFootball = {
  async fixturesByDate(date) {
    const rows = await get("fixtures", { date }, 120000);
    return rows.map(mapFixture).filter(x => x.leagueCode);
  },

  async standings(leagueCode, season) {
    const league = LEAGUES[leagueCode];
    if (!league) return [];
    const rows = await get("standings", { league: league.id, season }, 600000);
    const table = rows?.[0]?.league?.standings?.[0] || [];
    return table.map(r => ({
      rank: r?.rank ?? 0,
      teamId: r?.team?.id,
      team: r?.team?.name || "",
      played: r?.all?.played ?? 0,
      win: r?.all?.win ?? 0,
      draw: r?.all?.draw ?? 0,
      lose: r?.all?.lose ?? 0,
      gf: r?.all?.goals?.for ?? 0,
      ga: r?.all?.goals?.against ?? 0,
      gd: r?.goalsDiff ?? 0,
      points: r?.points ?? 0,
      form: r?.form || ""
    }));
  },

  async recentTeamFixtures(leagueCode, season, teamId, last = 10) {
    const league = LEAGUES[leagueCode];
    if (!league) return [];
    const rows = await get("fixtures", {
      league: league.id, season, team: teamId, last, status: "FT"
    }, 600000);
    return rows.map(mapFixture);
  },

  async h2h(homeId, awayId, last = 10) {
    const rows = await get("fixtures/headtohead", { h2h: `${homeId}-${awayId}`, last }, 900000);
    return rows.map(mapFixture);
  },

  async fixtureStatistics(fixtureId) {
    const rows = await get("fixtures/statistics", { fixture: fixtureId }, 1800000);
    const out = {};
    for (const team of rows || []) {
      const map = {};
      for (const s of team?.statistics || []) map[s.type] = s.value;
      out[team?.team?.id] = {
        corners: Number(map["Corner Kicks"] ?? 0),
        shots: Number(map["Total Shots"] ?? 0),
        shotsOnTarget: Number(map["Shots on Goal"] ?? 0),
        xg: Number(map["expected_goals"] ?? map["Expected Goals"] ?? 0)
      };
    }
    return out;
  }
};
