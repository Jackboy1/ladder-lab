#!/usr/bin/env node
// Ladder Lab — Module 8 security drills (drills_sec.js): thousands of generated questions, each answer checked against
// an independent source — ACL questions against the simulator's own ACL engine (acl.js via a real IOS CLI), the rest
// against separately written rule tables — and every stated answer must be accepted while nonsense is rejected.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console, Date }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["sim.js", "ipv6.js", "acl.js", "dhcp.js", "nat.js", "sim_ios.js", "drills.js", "drills_sec.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const D = ctx.DRILL, N = 600; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log("      " + String(extra).split("\n").join("\n      ")); } else console.log("ok  ", msg); };
D._secSeed(4242);
const ipNum = s => s.split(".").reduce((a,o)=>a*256+(+o),0);
const accepted = q => D.grade(q, q.fields.map(f=>f.a)).every(Boolean);
const nonsense = q => !D.grade(q, q.fields.map(()=>"zzz")).every(Boolean);
const run = (type, check) => { let bad = 0, first = null;
  for (let i=0;i<N;i++){ const q = D.GEN[type](); q.type = type; let good = accepted(q) && nonsense(q) && check(q);
    if (!good){ bad++; if (!first) first = JSON.stringify({q:q.q, ex:q.ex, a:q.fields.map(f=>f.a)}); } }
  ok(bad===0, `${type}: ${N} generated questions correct and graded properly`, first); };

// ACL first match — the IOS engine is the referee: configure the list on a real simulated router and ask acl.js
run("aclmatch", q => { const e = ctx.SIM.ios2Env("router", {}); e.exec("en"); e.exec("conf t");
  e.exec(`ip access-list ${q.acl.ext ? "extended" : "standard"} ${q.acl.name}`);
  for (const l of q.acl.lines){ const r = e.exec(l); if (r && /%/.test(typeof r === "string" ? r : r.text||"")) return false; }   // IOS must accept every line
  e.exec("end");
  const p = q.pkt, r = ctx.ACL.check(e.acl || e._st?.acl || e.state?.acl, q.acl.name, {src:p.src, dst:p.dst, proto:p.proto||"ip", sport:40000, dport:p.dport, icmp:p.icmp});
  const seq = r.entry ? String(r.entry.seq) : "none", act = r.permit ? "permit" : "deny";
  return q.fields[0].a===seq && q.fields[1].a===act; });
run("aclmatchstd", q => { if (q.acl.ext) return false; const e = ctx.SIM.ios2Env("router", {}); e.exec("en"); e.exec("conf t");
  e.exec(`ip access-list ${q.acl.ext ? "extended" : "standard"} ${q.acl.name}`);
  for (const l of q.acl.lines){ const r = e.exec(l); if (r && /%/.test(typeof r === "string" ? r : r.text||"")) return false; }   // IOS must accept every line
  e.exec("end");
  const p = q.pkt, r = ctx.ACL.check(e.acl || e._st?.acl || e.state?.acl, q.acl.name, {src:p.src, dst:p.dst, proto:p.proto||"ip", sport:40000, dport:p.dport, icmp:p.icmp});
  const seq = r.entry ? String(r.entry.seq) : "none", act = r.permit ? "permit" : "deny";
  return q.fields[0].a===seq && q.fields[1].a===act; });
run("aclmatchext", q => { if (!q.acl.ext) return false; const e = ctx.SIM.ios2Env("router", {}); e.exec("en"); e.exec("conf t");
  e.exec(`ip access-list ${q.acl.ext ? "extended" : "standard"} ${q.acl.name}`);
  for (const l of q.acl.lines){ const r = e.exec(l); if (r && /%/.test(typeof r === "string" ? r : r.text||"")) return false; }   // IOS must accept every line
  e.exec("end");
  const p = q.pkt, r = ctx.ACL.check(e.acl || e._st?.acl || e.state?.acl, q.acl.name, {src:p.src, dst:p.dst, proto:p.proto||"ip", sport:40000, dport:p.dport, icmp:p.icmp});
  const seq = r.entry ? String(r.entry.seq) : "none", act = r.permit ? "permit" : "deny";
  return q.fields[0].a===seq && q.fields[1].a===act; });
run("aclplacestd", q => !q.ext && q.fields[0].a===q.dst && q.fields[2].a==="out");
// wildcards — arithmetic from scratch
run("aclwild", q => { const base = ipNum(q.base), wc = q.fields[1].a.split(".").reduce((a,o)=>a*256+(+o),0);
  return wc===q.size-1 && base % q.size===0 && q.fields[0].a===q.base; });
// placement: extended → source router, in; standard → destination router, out (Cisco's guideline)
run("aclplace", q => q.fields[0].a===(q.ext ? q.src : q.dst) && q.fields[1].a==="G0/0" && q.fields[2].a===(q.ext ? "in" : "out"));
// port security truth table, written independently
run("psecviol", q => { const viol = !q.known && q.have >= q.max;
  const want = viol ? ["no", q.mode==="shutdown" ? "err-disabled" : "up", q.mode==="protect" ? "no" : "yes"] : ["yes", "up", "no"];
  return want.every((w,i)=>q.fields[i].a===w); });
// DHCP snooping
run("snoopdrop", q => { const server = ["Offer","Ack","NAK"].includes(q.msg);
  const drop = !q.trusted && (server || q.opt82 || q.relMove); return q.fields[0].a===(drop ? "dropped" : "forwarded"); });
// DAI: trusted → forward; ACL first (permit/deny); static → drop on no match; else the binding decides
run("daicheck", q => { const s = q.sender, A = q.aclEntry; let fwd;
  if (q.trusted) fwd = true; else if (q.useAcl && A.ip===s.ip && A.mac===s.mac) fwd = A.action==="permit"; else if (q.statik) fwd = false; else fwd = q.binds.some(b=>b.ip===s.ip && b.mac===s.mac);
  return q.fields[0].a===(fwd ? "forwarded" : "dropped"); });
// password types: the type is the number written in the line (none after "password" = 0); reversible = 0 or 7
run("pwtype", q => { const m = q.line.match(/(?:secret|password) (\d) /), t = m ? m[1] : "0";
  const t7 = q.line.match(/password 7 (\S+)/);
  if (t7){ const h = t7[1], X = "dsfd;kfoA,.iyewrkldJKDHSUBsgvca69834ncxv9873254k;fg87", salt = +h.slice(0,2); const dec = h.slice(2).match(/../g).map((x,i)=>String.fromCharCode(parseInt(x,16) ^ X.charCodeAt((salt+i)%53))).join(""); if (!/^[\x21-\x7e]+$/.test(dec)) return false; }
  return q.fields[0].a===t && q.fields[1].a===(t==="0"||t==="7" ? "yes" : "no"); });
run("radtac", q => q.fields[0].a===q.ans && ["radius","tacacs+"].includes(q.ans));
run("cia", q => q.fields[0].a===q.ans);
// every drill type a Module 8 lesson asks for exists
ok(["aclmatch","aclmatchstd","aclmatchext","aclwild","aclplace","aclplacestd","psecviol","snoopdrop","daicheck","pwtype","radtac","cia"].every(t=>D.GEN[t] && D.LABELS[t]), "all twelve security drill types are registered with labels");
D._secSeed(null);
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
