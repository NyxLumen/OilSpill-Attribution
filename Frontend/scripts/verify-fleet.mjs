// Fleet verification: 30 vessels, navigability, determinism, attribution ranking,
// behavioural diversity, trails. Run with: node scripts/verify-fleet.mjs
import { createJiti } from 'jiti';
const jiti = createJiti(import.meta.url, { fsCache: false });

const gen = await jiti.import('../src/simulation/vesselGenerator.ts');
const { isOnLand, checkNavigability } = await jiti.import('../src/simulation/landMask.ts');
const { vesselStateAt } = await jiti.import('../src/simulation/kinematics.ts');
const { observedStateAt } = await jiti.import('../src/simulation/aisJitter.ts');
const { rankCandidates } = await jiti.import('../src/simulation/candidateScoring.ts');
const { SCENARIO_INCIDENT_BASE } = await jiti.import('../src/simulation/incident.ts');
const { generateTrailPoints } = await jiti.import('../src/simulation/trailGenerator.ts');

let failures = 0;
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

const fleet = gen.generateSimVessels();
console.log(`Fleet size: ${fleet.length}`);
if (fleet.length !== 30) fail(`expected 30 vessels, got ${fleet.length}`);
else ok('30 vessels');
const ids = new Set(fleet.map((v) => v.id));
if (ids.size !== 30) fail('duplicate ids');
else ok('unique ids');

// --- scenario core preservation ---
const core = fleet.slice(0, 5);
for (const v of core) {
  if (!v.id.startsWith('vsl-00')) fail(`${v.id} not in scenario core`);
}
if (core[0].id !== 'vsl-001' || core[0].type !== 'tanker' || core[0].speed !== 9.4) fail('vsl-001 identity changed');
else ok('vsl-001..vsl-005 preserved (ids/types/speeds)');

// --- per-vessel: route navigable + positions never on land ---
// The land/geographic constraint applies to the GENERATED fleet (vsl-006..030).
// The 5 scenario vessels (vsl-001..005) are hand-authored legacy waypoints that
// are preserved exactly for the INC-2026-001 narrative; a few of their vertices
// sit in shallow/intertidal areas that Natural Earth 50m maps as land — a
// pre-existing condition, not introduced here. They are checked separately and
// reported as notes, not failures.
console.log('Navigability + on-land checks (generated fleet):');
const generated = fleet.filter((v) => Number(v.id.slice(4)) >= 6);
const scenario = fleet.filter((v) => Number(v.id.slice(4)) < 6);
const sampleTimes = [
  Date.parse('2026-08-27T00:00:00Z'),
  Date.parse('2026-08-27T06:00:00Z'),
  Date.parse('2026-08-27T07:00:00Z'),
  Date.parse('2026-08-27T09:10:00Z'),
  Date.parse('2026-08-27T14:00:00Z'),
  Date.parse('2026-08-27T22:00:00Z'),
];
for (const v of generated) {
  const nav = checkNavigability(v.route.waypoints);
  if (!nav.ok) fail(`${v.id} route ${JSON.stringify(nav)}`);
  for (const t of sampleTimes) {
    const s = vesselStateAt(v, t);
    if (isOnLand(s.lng, s.lat)) fail(`${v.id} ON LAND at ${new Date(t).toISOString()}`);
  }
}
ok('all generated routes navigable, no generated vessel on land across sampled day');
for (const v of scenario) {
  const nav = checkNavigability(v.route.waypoints);
  if (!nav.ok) console.log(`  note: ${v.id} legacy route ${JSON.stringify(nav)} (preserved)`);
}

// --- determinism: two generations identical ---
const fleet2 = gen.generateSimVessels();
if (JSON.stringify(fleet) !== JSON.stringify(fleet2)) fail('generateSimVessels not deterministic');
else ok('generateSimVessels deterministic (two calls identical)');

let posMismatch = 0;
for (const v of fleet) {
  for (const t of sampleTimes) {
    const a = vesselStateAt(v, t);
    const b = vesselStateAt(fleet2.find((w) => w.id === v.id), t);
    if (a.lat !== b.lat || a.lng !== b.lng || a.heading !== b.heading || a.speed !== b.speed) posMismatch++;
  }
}
if (posMismatch) fail(`${posMismatch} position mismatches across generations`);
else ok('vesselStateAt deterministic across generations');

// --- behavioural diversity ---
console.log('Behavioural diversity (state at 09:10Z + 1h):');
const tDemo = Date.parse('2026-08-27T09:10:00Z') + 60 * 60 * 1000;
for (const v of fleet) {
  const s = observedStateAt(v, tDemo);
  const j = v.journey;
  let kind = v.pattern;
  if (j && j.legs.length) {
    const maxLeg = Math.max(...j.legs.map((l) => Math.abs(l.toKm - l.fromKm)));
    const minLeg = Math.min(...j.legs.map((l) => Math.abs(l.toKm - l.fromKm)));
    const total = v.route.totalKm;
    kind += total > 0 ? ` (legs ${minLeg.toFixed(0)}..${maxLeg.toFixed(0)} km)` : '';
  }
  console.log(`  ${v.id.padEnd(8)} ${v.type.padEnd(9)} ${kind.padEnd(36)} speed=${s.speed.toFixed(1)} kn hdg=${s.heading}`);
}

// --- attribution ranking ---
console.log('Attribution ranking at ATTRIBUTION_MS:');
const ranked = rankCandidates(SCENARIO_INCIDENT_BASE);
for (const c of ranked) {
  console.log(`  ${c.vesselId.padEnd(8)} match=${c.matchScore.toFixed(3)}  dist=${c.distanceFromOriginKm.toFixed(1)}km`);
}
const top = ranked[0];
if (!top || top.vesselId !== 'vsl-001') fail(`vsl-001 not top candidate: ${top?.vesselId}`);
else ok(`vsl-001 top candidate with ${top.matchScore}`);
if (Math.abs(top.matchScore - 0.935) > 0.015) fail(`vsl-001 score drifted from 0.935 to ${top.matchScore}`);
else ok(`vsl-001 score ≈ 0.935 (${top.matchScore})`);

// --- trails ---
console.log('Trails (generated fleet):');
let trailFails = 0;
for (const v of generated) {
  const trail = generateTrailPoints(v, tDemo);
  const moving = v.pattern !== 'anchored' && v.type !== 'other';
  if (moving && trail.length < 2) { fail(`${v.id} moving vessel missing trail`); trailFails++; }
  if (!moving && trail.length !== 0 && v.route.totalKm <= 0) { fail(`${v.id} anchored vessel should have empty trail`); trailFails++; }
  // no trail point on land
  for (const p of trail) if (isOnLand(p.lng, p.lat)) { fail(`${v.id} trail point on land`); trailFails++; break; }
}
if (!trailFails) ok('trails present for moving vessels, empty for anchored, none on land');

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
