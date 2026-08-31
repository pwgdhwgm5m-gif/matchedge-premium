# MatchEdge Premium V4

Mobile-first football probability/value analysis app.

## What is included
- Daily fixtures in one quota-efficient request
- League filters
- Per-match deep analysis endpoint
- Current table / goals
- Recent form
- Home/away scoring
- H2H weighted model
- Common-opponent signal
- First/second-half probability model
- Optional shots, shots-on-target, xG and corners in `ANALYSIS_MODE=deep`
- Optional real odds / EV via The Odds API
- Early-season confidence cap when sample < 5
- No fabricated odds or missing data

## Environment variables
- `API_FOOTBALL_KEY` required
- `ODDS_API_KEY` optional
- `ANALYSIS_MODE=balanced` for free/low quota
- `ANALYSIS_MODE=deep` for paid provider plan
- `API_MIN_GAP_MS=6200` default, protects 10 requests/minute APIs

## Render
Build command: `npm install`
Start command: `npm start`

## Important
For a commercial product, verify that your data and odds provider plans permit your intended commercial use and attribution. Prediction probabilities are estimates, not guarantees.
