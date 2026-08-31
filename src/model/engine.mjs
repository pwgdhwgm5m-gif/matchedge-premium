const clamp = (x,a,b) => Math.max(a, Math.min(b,x));
const pct = x => Number((100*x).toFixed(1));

function poisson(k, l) {
  let f = 1;
  for (let i=2;i<=k;i++) f*=i;
  return Math.exp(-l) * Math.pow(l,k) / f;
}

function scoreGrid(lh, la) {
  let H=0,D=0,A=0,O25=0,BTTS=0,H15=0,A15=0;
  for (let h=0; h<=10; h++) for (let a=0; a<=10; a++) {
    const p=poisson(h,lh)*poisson(a,la);
    if(h>a)H+=p; else if(h===a)D+=p; else A+=p;
    if(h+a>=3)O25+=p;
    if(h>0&&a>0)BTTS+=p;
    if(h>=2)H15+=p;
    if(a>=2)A15+=p;
  }
  return {H,D,A,O25,U25:1-O25,BTTS,NOBTTS:1-BTTS,H15,A15};
}

function teamSummary(fixtures, teamId) {
  let gf=0,ga=0,fhf=0,fha=0, homeN=0, awayN=0, homeGF=0,awayGF=0;
  const valid=[];
  for(const f of fixtures||[]) {
    const isHome=f.home?.id===teamId;
    const gfor=isHome?f.goals?.home:f.goals?.away;
    const gagainst=isHome?f.goals?.away:f.goals?.home;
    if(gfor==null||gagainst==null) continue;
    valid.push(f); gf+=gfor; ga+=gagainst;
    const hf=isHome?f.halftime?.home:f.halftime?.away;
    const ha=isHome?f.halftime?.away:f.halftime?.home;
    if(hf!=null) fhf+=hf; if(ha!=null) fha+=ha;
    if(isHome){homeN++;homeGF+=gfor}else{awayN++;awayGF+=gfor}
  }
  const n=valid.length||1;
  return {
    n:valid.length, gf:gf/n, ga:ga/n, fhf:fhf/n, fha:fha/n,
    homeGF:homeN?homeGF/homeN:null, awayGF:awayN?awayGF/awayN:null
  };
}

function h2hSignal(fixtures, homeId, awayId) {
  if(!fixtures?.length) return {n:0, homeWin:.33,draw:.34,awayWin:.33,o25:.5,btts:.5};
  let hw=0,d=0,aw=0,o=0,b=0,n=0;
  for(const f of fixtures) {
    const hg=f.goals?.home, ag=f.goals?.away;
    if(hg==null||ag==null) continue;
    n++;
    const homeIsTarget=f.home?.id===homeId;
    if(hg===ag)d++;
    else {
      const targetHomeWon=(hg>ag&&homeIsTarget)||(ag>hg&&!homeIsTarget);
      if(targetHomeWon)hw++; else aw++;
    }
    if(hg+ag>=3)o++;
    if(hg>0&&ag>0)b++;
  }
  return n?{n,homeWin:hw/n,draw:d/n,awayWin:aw/n,o25:o/n,btts:b/n}:{n:0,homeWin:.33,draw:.34,awayWin:.33,o25:.5,btts:.5};
}

function commonOpponentSignal(homeFixtures, awayFixtures, homeId, awayId) {
  const map = new Map();
  for(const f of homeFixtures||[]) {
    const opp=f.home?.id===homeId?f.away?.id:f.home?.id;
    if(!opp)continue;
    const gf=f.home?.id===homeId?f.goals?.home:f.goals?.away;
    const ga=f.home?.id===homeId?f.goals?.away:f.goals?.home;
    if(gf==null||ga==null)continue;
    map.set(opp,{gf,ga});
  }
  const diffs=[];
  for(const f of awayFixtures||[]) {
    const opp=f.home?.id===awayId?f.away?.id:f.home?.id;
    if(!opp||!map.has(opp))continue;
    const gf=f.home?.id===awayId?f.goals?.home:f.goals?.away;
    const ga=f.home?.id===awayId?f.goals?.away:f.goals?.home;
    if(gf==null||ga==null)continue;
    const h=map.get(opp);
    diffs.push((h.gf-h.ga)-(gf-ga));
  }
  const n=diffs.length;
  const avg=n?diffs.reduce((a,b)=>a+b,0)/n:0;
  return {n, edge:clamp(avg/3,-0.18,0.18)};
}

function averageStats(statsList, teamId) {
  const vals=[];
  for(const s of statsList||[]) if(s?.[teamId]) vals.push(s[teamId]);
  const avg=k=>vals.length?vals.reduce((a,v)=>a+Number(v[k]||0),0)/vals.length:null;
  return {n:vals.length,corners:avg("corners"),shots:avg("shots"),shotsOnTarget:avg("shotsOnTarget"),xg:avg("xg")};
}

function confidence(prob, sample, quality, capEarly=true) {
  let c=35 + Math.abs(prob-.5)*55 + Math.min(sample,10)*2 + quality*0.08;
  if(capEarly && sample<5) c=Math.min(c,44);
  return Math.round(clamp(c,20,92));
}

export function buildPrediction({
  homeId, awayId, homeFixtures=[], awayFixtures=[], standings=[],
  h2h=[], homeStats=[], awayStats=[]
}) {
  const hs=teamSummary(homeFixtures,homeId), as=teamSummary(awayFixtures,awayId);
  const sample=Math.min(hs.n,as.n);
  const leagueGF=standings.length
    ? standings.reduce((a,r)=>a+(r.gf||0),0) / Math.max(1, standings.reduce((a,r)=>a+(r.played||0),0))
    : 1.35;

  const shrink=n=>clamp(n/8,0,0.82);
  const bh=shrink(hs.n), ba=shrink(as.n);
  let lh=((hs.gf*bh)+(leagueGF*(1-bh))) * .57 + ((as.ga*ba)+(leagueGF*(1-ba))) * .43;
  let la=((as.gf*ba)+(leagueGF*(1-ba))) * .57 + ((hs.ga*bh)+(leagueGF*(1-bh))) * .43;
  lh*=1.08; la*=.92;

  const common=commonOpponentSignal(homeFixtures,awayFixtures,homeId,awayId);
  lh*=1+common.edge*.35; la*=1-common.edge*.35;

  let probs=scoreGrid(clamp(lh,.25,3.6),clamp(la,.20,3.3));
  const h2=h2hSignal(h2h,homeId,awayId);
  const hw=clamp(h2.n/10,0,.22);
  probs.H=probs.H*(1-hw)+h2.homeWin*hw;
  probs.D=probs.D*(1-hw)+h2.draw*hw;
  probs.A=probs.A*(1-hw)+h2.awayWin*hw;
  probs.O25=probs.O25*(1-hw)+h2.o25*hw;
  probs.U25=1-probs.O25;
  probs.BTTS=probs.BTTS*(1-hw)+h2.btts*hw;
  probs.NOBTTS=1-probs.BTTS;

  const homeAdv=averageStats(homeStats,homeId), awayAdv=averageStats(awayStats,awayId);
  const cornersTotal =
    homeAdv.corners!=null && awayAdv.corners!=null
      ? homeAdv.corners + awayAdv.corners
      : null;
  const quality=clamp(30+sample*6+h2.n*2+common.n*3+(cornersTotal!=null?8:0),25,100);

  const fhRate = clamp(((hs.fhf+as.fha)/2 + (as.fhf+hs.fha)/2) / 1.25, .15, 1.8);
  const shRate = clamp((lh+la)-fhRate, .15, 3.5);
  probs.FHO05=1-Math.exp(-fhRate);
  probs.FHO15=1-(Math.exp(-fhRate)*(1+fhRate));
  probs.SHO05=1-Math.exp(-shRate);
  probs.SHO15=1-(Math.exp(-shRate)*(1+shRate));

  const markets={};
  for(const [k,p] of Object.entries(probs)) {
    markets[k]={prob:pct(p), confidence:confidence(p,sample,quality)};
  }

  return {
    sample, dataQuality:Math.round(quality),
    lambdaHome:Number(lh.toFixed(2)), lambdaAway:Number(la.toFixed(2)),
    h2h:{sample:h2.n,weightPct:Math.round(hw*100)},
    commonOpponents:{sample:common.n,edgePct:Number((common.edge*100).toFixed(1))},
    advanced:{
      home:homeAdv, away:awayAdv,
      projectedCorners: cornersTotal!=null ? Number(cornersTotal.toFixed(1)) : null
    },
    markets
  };
}

export function ev(probPct, odds) {
  if(!odds || odds<=1) return null;
  return Number((((probPct/100)*odds)-1)*100).toFixed(1);
}
