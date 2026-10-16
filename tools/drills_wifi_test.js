#!/usr/bin/env node
// Ladder Lab — Module 9 wireless drills (drills_wifi.js): every generated answer re-derived independently, stated answers
// accepted, nonsense rejected.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["drills.js", "drills_wifi.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const D = ctx.DRILL, N = 600; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log("      " + extra); } else console.log("ok  ", msg); };
D._wifiSeed(777);
const run = (type, check) => { let bad = 0, first = null;
  for (let i=0;i<N;i++){ const q = D.GEN[type](); q.type = type;
    const good = D.grade(q, q.fields.map(f=>f.a)).every(Boolean) && !D.grade(q, q.fields.map(()=>"zzz")).every(Boolean) && check(q);
    if (!good){ bad++; if (!first) first = JSON.stringify({q:q.q, a:q.fields.map(f=>f.a)}); } }
  ok(bad===0, `${type}: ${N} generated questions correct and graded properly`, first); };
// IEEE 802.11 channelisation, independently: 2.4 GHz ch n → 2412 + 5(n−1), ch 14 → 2484; 5 GHz ch n → 5000 + 5n
const freq = (band, ch) => band===5 ? 5000 + 5*ch : ch===14 ? 2484 : 2412 + 5*(ch-1);
run("wifichan", q => +q.f===freq(q.band, q.ch) && (q.fields[0].label.startsWith("Freq") ? q.fields[0].a===String(freq(q.band, q.ch)) : q.fields[0].a===String(q.ch)));
// overlap: 22 MHz-wide channels whose centres are less than 25 MHz apart
run("wifioverlap", q => q.fields[0].a===(Math.abs(freq(2.4, q.a) - freq(2.4, q.b)) < 25 ? "yes" : "no"));
run("wifiplan", q => { const fs2 = q.plan.map(c=>freq(2.4, c)); const clean = fs2.every((x,i)=>fs2.every((y,j)=>i===j || Math.abs(x-y) >= 25)); return q.fields[0].a===(clean ? "yes" : "no"); });
// dBm = 10·log10(mW): the rule-of-3s answer must be within 0.5 dB / 6 % of the exact value
run("wifidbm", q => Math.abs(10*Math.log10(q.mw) - q.db) <= 0.5);
run("wifisnr", q => +q.fields[0].a===q.rssi - q.noise && q.rssi > q.noise);
D._wifiSeed(null);
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
