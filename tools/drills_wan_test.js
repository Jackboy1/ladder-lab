#!/usr/bin/env node
// Ladder Lab — Module 10 drills (drills_wan.js): answers re-derived independently, stated answers accepted, nonsense rejected.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["drills.js", "drills_wan.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const D = ctx.DRILL, N = 500; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log("      " + extra); } else console.log("ok  ", msg); };
D._wanSeed(99);
const run = (type, check) => { let bad = 0, first = null;
  for (let i=0;i<N;i++){ const q = D.GEN[type](); q.type = type;
    const good = D.grade(q, q.fields.map(f=>f.a)).every(Boolean) && !D.grade(q, q.fields.map(()=>"zzz")).every(Boolean) && check(q);
    if (!good){ bad++; if (!first) first = JSON.stringify({q:q.q, a:q.fields.map(f=>f.a)}); } }
  ok(bad===0, `${type}: ${N} generated questions correct and graded properly`, first); };
// GRE over IPv4: outer IPv4 header 20 + GRE base header 4 = 24 bytes; MSS = MTU − 20 − 20
run("gremtu", q => +q.fields[0].a===q.mtu - 20 - 4 && +q.fields[1].a===q.mtu - 24 - 20 - 20 && (q.mtu!==1500 || q.fields[0].a==="1476"));
const IAAS = /virtual machines|virtual networks|firewall VM/i, SAAS = /email|accounting package|video-conferencing/i, PAAS = /application code|functions/i;
run("cloudsvc", q => q.a===(IAAS.test(q.s) ? "iaas" : SAAS.test(q.s) ? "saas" : PAAS.test(q.s) ? "paas" : "?"));
run("clouddeploy", q => q.a===(/several hospitals/i.test(q.s) ? "community" : /bursts|two connected|with the two/i.test(q.s) ? "hybrid" : /any customer|start-up/i.test(q.s) ? "public" : "private"));
run("hypervisor", q => q.a===(/VirtualBox|Workstation|Parallels/.test(q.s) ? "2" : "1"));
run("vmcontainer", q => q.a===(/own full guest|different operating system|hypervisor creates/i.test(q.s) ? "vm" : "container"));
run("mplsrole", q => q.a===(/customer's own router|customer's side/i.test(q.s) ? "ce" : /core router/i.test(q.s) ? "p" : "pe"));
D._wanSeed(null);
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
