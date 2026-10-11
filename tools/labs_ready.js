#!/usr/bin/env node
// Ladder Lab lab-readiness check: every command a hands-on lab or "Try it yourself" terminal needs (its solve list) must
// have been taught before the learner reaches that lab — shown in a <code>/command-output block earlier in the same
// lesson, or anywhere in an earlier lesson of the track. Commands are compared in canonical IOS form, so abbreviations
// match ("no shut" = "no shutdown", "sh ip int br" = "show ip interface brief"); arguments are ignored.
// Usage: node tools/labs_ready.js [--track ccna] [--mod ccna-m4] [--lesson <fragment.js>...]   (exit 1 if anything is untaught)
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(m=>m[1]).filter(f=>f!=="app.js");
const ctx = { console, setTimeout, clearTimeout }; ctx.window = ctx; vm.createContext(ctx);
for (const f of files) try { vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }); } catch(e){ console.error(f, e.message); }
const argv = process.argv, arg = k => { const i = argv.indexOf(k); return i>-1 ? argv[i+1] : null; };
const trackId = arg("--track") || "ccna", mods = (arg("--mod")||"").split(",").filter(Boolean);
const frags = argv.map((a,i)=>a==="--lesson"?argv[i+1]:null).filter(Boolean);
if (frags.length) vm.runInContext(`(function(){ const L=[];\n${frags.map(f=>fs.readFileSync(f,"utf8")).join("\n")}\nK.module(${JSON.stringify(trackId)},{id:"_fragment",t:"fragments under test"},L);})();`, ctx);
const T = ctx.LL.tracks.find(t=>t.id===trackId); if (!T){ console.error("no track", trackId); process.exit(1); }
const K = ctx.K, ios = ctx.SIM.ios2Env({kind:"router"});
const terms = K._terms(), benches = K._benches();

const decode = s => s.replace(/<[^>]+>/g, "").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").replace(/&rarr;|→/g," ");
const stripPrompt = l => l.replace(/^\s*[\w.\-]+(\([\w\-]+\))?[#>]\s?/, "").replace(/^\s*C:\\[^>]*>\s?/, "").replace(/^\s*\$\s/, "");
const PCCMD = /^(ipconfig|ping|tracert|arp|ssh|telnet|nslookup|netstat|cls|ip|ifconfig|traceroute)\b/i;
// what a snippet of taught text counts as: canonical IOS forms of each line, plus PC commands by name
function formsOf(line){
  const l = stripPrompt(decode(line)).trim(); if (!l || l.length > 120) return [];
  const out = ios.canonAll(l);
  const pcm = l.match(PCCMD); if (pcm) out.push("pc:" + pcm[1].toLowerCase());
  return out;
}
function taughtIn(htmlChunk, set){
  for (const m of htmlChunk.matchAll(/<(code|pre)[^>]*>([\s\S]*?)<\/\1>/g)){
    const body = m[2];
    for (const piece of body.split(/\n|<br\s*\/?>|\s+→\s+|\s+then\s+/)) for (const part of piece.split(/\s*;\s*|\s+\+\s+/)) for (const f of formsOf(part)) set.add(f);
  }
}
// the commands a lab's solution types, with where they're typed
function labCommands(cfg, isBench){
  const out = [];
  for (const a of (cfg.solve||[])){
    if (!isBench){ if (typeof a==="string") out.push({line:a, where:"terminal"}); continue; }
    if (!Array.isArray(a)) continue;
    if (a[0]==="cli" || a[0]==="term") out.push({line:a[2], where:a[1]});
    else if (a[0]==="pc") out.push({line:a[2], where:a[1], pc:true});
  }
  return out;
}
const known = new Set(), report = []; let missing = 0, soft = 0;
const formsOfCmd = c => c.pc ? (()=>{ const m = String(c.line).trim().match(PCCMD); return m ? ["pc:"+m[1].toLowerCase()] : []; })() : ios.canonAll(String(c.line));
T.lessons.forEach((l, li) => {
  const h = l.html || "";
  const marks = [...h.matchAll(/data-(mt|bench)="([tb]\d+)"/g)].map(m=>({kind:m[1], id:m[2], at:m.index}));
  let last = 0; const local = new Set(known);
  const issues = [];
  for (const mk of marks){
    taughtIn(h.slice(last, mk.at), local); last = mk.at;
    const cfg = mk.kind==="bench" ? benches[mk.id] : terms[mk.id]; if (!cfg) continue;
    const seen = new Set(), inLab = new Set();   // commands the lab's own intro/tasks/hints name (introduced inside the lab)
    const labText = [cfg.intro, ...(cfg.tasks||cfg.objectives||[]).flatMap(t=>[t.text, t.hint])].filter(Boolean).join("\n");
    taughtIn(labText, inLab);   // <code>…</code> inside task text
    for (const part of decode(labText).split(/\n|[,;—–:]\s*|\s+then\s+|\s*\(|\)\s*|\.\s+/)){   // plain "Type enable to get to privileged mode"
      const words = part.replace(/^\s*(type|run|use|enter|with|start with|save with|bring it up with|verify with|and|then)\s+/i, "").trim().split(/\s+/);
      for (let n = Math.min(8, words.length); n >= 1; n--){ const fs = formsOf(words.slice(0, n).join(" ")); if (fs.length){ fs.forEach(f=>inLab.add(f)); break; } } }
    for (const c of labCommands(cfg, mk.kind==="bench")){
      const fs = formsOfCmd(c); if (!fs.length) continue;            // a reply to a prompt, a password, "yes"…
      if (fs.some(f=>local.has(f))) continue;
      const k = fs[0]; if (seen.has(k)) continue; seen.add(k);
      issues.push({lab: cfg.title || cfg.id || mk.id, cmd: String(c.line).trim(), form: k, soft: fs.some(f=>inLab.has(f))});
    }
  }
  taughtIn(h, known);
  if (issues.length && (!mods.length || mods.includes(l.mod)) && (!frags.length || l.mod==="_fragment" || mods.includes(l.mod))){ report.push({lesson:`${li+1}. ${l.t}`, mod:l.mod||"", issues}); missing += issues.filter(x=>!x.soft).length; soft += issues.filter(x=>x.soft).length; }
});
for (const r of report){ console.log(`\n== ${r.lesson}${r.mod?`  [${r.mod}]`:""}`);
  for (const x of r.issues) console.log(`  ${x.soft ? "lab-only  " : "NOT TAUGHT"} [${x.lab.slice(0,40)}] ${x.cmd.padEnd(40)} (${x.form})`); }
console.log(`\n${missing} lab command(s) never taught before or inside the lab; ${soft} introduced only inside the lab (check each task says what the command does).`);
process.exitCode = missing ? 1 : 0;
