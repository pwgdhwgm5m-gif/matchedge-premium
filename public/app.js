const $=s=>document.querySelector(s);
const state={fixtures:[],league:"ALL",analyses:new Map()};
const names={H:"1",D:"X",A:"2",O25:"2.5 Ãœst",U25:"2.5 Alt",BTTS:"KG Var",NOBTTS:"KG Yok",H15:"Ev 1.5 Ãœst",A15:"Dep 1.5 Ãœst",FHO05:"Ä°Y 0.5 Ãœst",FHO15:"Ä°Y 1.5 Ãœst",SHO05:"2Y 0.5 Ãœst",SHO15:"2Y 1.5 Ãœst"};

const localDate=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
$("#date").value=localDate();

async function load(){
  $("#status").textContent="Veri yÃ¼kleniyorâ€¦";
  const r=await fetch(`/api/day?date=${$("#date").value}`), d=await r.json();
  state.fixtures=d.matches||[]; $("#matchCount").textContent=state.fixtures.length;
  $("#status").textContent=d.errors?.length?`Kaynak uyarÄ±sÄ±: ${d.errors[0]}`:`${state.fixtures.length} gerÃ§ek fikstÃ¼r`;
  renderFilters();renderMatches();
}
function renderFilters(){
  const leagues=[...new Set(state.fixtures.map(x=>x.leagueCode))];
  $("#filters").innerHTML=[["ALL","TÃ¼mÃ¼"],...leagues.map(c=>[c,c])].map(([c,n])=>`<button class="chip ${state.league===c?"active":""}" data-c="${c}">${n}</button>`).join("");
  document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{state.league=b.dataset.c;renderFilters();renderMatches()});
}
function renderMatches(){
  const rows=state.fixtures.filter(x=>state.league==="ALL"||x.leagueCode===state.league);
  $("#matches").innerHTML=rows.length?rows.map(f=>`<article class="match card">
    <div class="league">${f.leagueCode} Â· ${f.round||""}</div>
    <div class="teams"><div class="team"><img src="${f.home.logo}">${f.home.name}</div><div class="vs">${new Date(f.date).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</div><div class="team right">${f.away.name}<img src="${f.away.logo}"></div></div>
    <div class="match-bottom"><span class="muted">H2H + ortak rakip + form</span><button class="analyze" data-id="${f.id}">Analiz Et</button></div>
  </article>`).join(""):`<div class="card match">SeÃ§ili lig/tarihte maÃ§ bulunamadÄ±.</div>`;
  document.querySelectorAll(".analyze").forEach(b=>b.onclick=()=>analyze(Number(b.dataset.id)));
}
async function analyze(id){
  $("#sheet").classList.remove("hidden");$("#analysis").innerHTML="<div class='analysis-head'>Derin analiz hazÄ±rlanÄ±yorâ€¦</div>";
  const r=await fetch(`/api/analyze/${id}?date=${$("#date").value}`), d=await r.json();
  if(!r.ok){$("#analysis").innerHTML=`<div class="analysis-head">${d.error||"Analiz alÄ±namadÄ±"}</div>`;return}
  state.analyses.set(id,d);$("#analyzedCount").textContent=state.analyses.size;
  const f=d.fixture,m=d.model;
  const markets=Object.entries(m.markets).map(([k,v])=>`<div class="market"><small>${names[k]||k}</small><strong>${v.prob}%</strong><small>GÃ¼ven ${v.confidence}/100 ${v.odds?`Â· Oran ${v.odds}`:""} ${v.ev!=null?`Â· EV ${v.ev}%`:""}</small></div>`).join("");
  $("#analysis").innerHTML=`<div class="analysis-head"><div class="muted">${f.leagueCode}</div><h2>${f.home.name} â€” ${f.away.name}</h2></div>
  <div class="metrics"><div class="metric"><b>${m.dataQuality}/100</b><span>Veri kalitesi</span></div><div class="metric"><b>${m.h2h.sample}</b><span>H2H</span></div><div class="metric"><b>${m.commonOpponents.sample}</b><span>Ortak rakip</span></div></div>
  <div class="metrics"><div class="metric"><b>${m.lambdaHome}</b><span>Ev gol Î»</span></div><div class="metric"><b>${m.lambdaAway}</b><span>Dep gol Î»</span></div><div class="metric"><b>${m.advanced.projectedCorners??"â€”"}</b><span>Beklenen korner</span></div></div>
  <div class="market-grid">${markets}</div>
  ${d.errors?.length?`<p class="muted">Eksik kaynaklar: ${d.errors.join(" Â· ")}</p>`:""}`;
}
$("#closeSheet").onclick=()=>$("#sheet").classList.add("hidden");
$("#refresh").onclick=load;
$("#prev").onclick=()=>{const d=new Date($("#date").value+"T12:00:00");d.setDate(d.getDate()-1);$("#date").value=d.toISOString().slice(0,10);load()};
$("#next").onclick=()=>{const d=new Date($("#date").value+"T12:00:00");d.setDate(d.getDate()+1);$("#date").value=d.toISOString().slice(0,10);load()};
$("#date").onchange=load;
load();
