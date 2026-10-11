#!/usr/bin/env node
// Ladder Lab beginner-continuity check: flags acronyms and technical terms a learner meets before the course has taught them.
// A term counts as taught once a lesson defines it — a K.g glossary pop-up, or an expansion such as "Wide Area Network (WAN)",
// "WAN (wide area network)", "WAN — Wide Area Network", "WAN, short for…" — in that lesson (at, or within a sentence or two of,
// first use) or in any earlier lesson of the same track.
// Usage: node tools/terms.js [--track ccna] [--mod ccna-m1,ccna-m2] [--lesson <fragment.js>...] [--jargon]
//   --lesson can repeat (fragments are appended in order, like an assembled module); --jargon also checks multi-word glossary terms.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(m=>m[1]).filter(f=>f!=="app.js");
const ctx = { console, setTimeout, clearTimeout }; ctx.window = ctx; vm.createContext(ctx);
for (const f of files) try { vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }); } catch(e){ console.error(f, e.message); }
const argv = process.argv;
const arg = k => { const i = argv.indexOf(k); return i>-1 ? argv[i+1] : null; };
const trackId = arg("--track") || "ccna", mods = (arg("--mod")||"").split(",").filter(Boolean), jargon = argv.includes("--jargon");
const frags = argv.map((a,i)=>a==="--lesson"?argv[i+1]:null).filter(Boolean);
if (frags.length) vm.runInContext(`(function(){ const L=[];\n${frags.map(f=>fs.readFileSync(f,"utf8")).join("\n")}\nK.module(${JSON.stringify(trackId)},{id:"_fragment",t:"fragments under test"},L);})();`, ctx);
const T = ctx.LL.tracks.find(t=>t.id===trackId); if (!T){ console.error("no track", trackId); process.exit(1); }

// plain English, units and everyday tech a beginner already knows
const COMMON = new Set(`I A OK PC IT TV CEO CV FAQ HR UK US USA EU UN AM PM GB MB KB TB GHZ MHZ HD SSD HDD CPU RAM USB HDMI PDF ID
  ATM SMS ASAP FYI VIP CTO CFO CIO PHD AI UI OS QA IOS XE CLI LED NIC N NA TBD ETA DIY Q PS`.split(/\s+/).filter(Boolean));
// brands, organisations, places, products and cert names — named, not taught
const NAMES = new Set(`MTN GLO AIRTEL NEPA PHCN UCLA SRI ARPANET IBM HP HPE DELL ISR ASA ASR JUNIPER GTB GTBANK UBA FCMB NIBSS CBN NCC
  UNILAG FUTA OAU ABU NHS NASA BBC CNN IEEE IETF IANA ICANN RIPE ARIN APNIC AFRINIC LACNIC ISO ANSI TIA EIA IEC NIST CIS SANS
  CCNA CCNP CCIE CCENT CCT CCST COMPTIA ITIL ISACA PMP RHCSA RHCE LPI LPIC MCSA II III IV PuTTY VMware SecureCRT TeraTerm MobaXterm`.split(/\s+/).filter(Boolean));

const strip = s => String(s||"")
  .replace(/<span class="gl-tip"[^>]*>[\s\S]*?<\/span>/g, " ")            // tooltip text is the definition itself
  .replace(/<div class="kbox goals">[\s\S]*?<\/ul><\/div>/g, " ")          // goals name what the lesson is about to teach
  .replace(/<svg[\s\S]*?<\/svg>/g, " ")                                    // diagram labels (the prose explains them)
  .replace(/<(code|pre|kbd)[^>]*>[\s\S]*?<\/\1>/g, " ")                    // commands and output
  .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
const norm = t => t.replace(/<[^>]+>/g, "").trim().toLowerCase().replace(/s$/, "");

// does a phrase look like an acronym's expansion? ("Wide Area Network" ~ WAN, "Power over Ethernet" ~ PoE)
function initialsFit(acr, phrase){
  const a = acr.replace(/[^A-Za-z]/g, "").toUpperCase(); const w = phrase.replace(/[^A-Za-z\s-]/g, " ").split(/[\s-]+/).filter(Boolean);
  if (a.length<2 || !w.length || w[0][0].toUpperCase()!==a[0]) return false;
  let k = 0; for (const x of w){ const X = x.toUpperCase(); if (k<a.length && X[0]===a[k]){ k++; while (k<a.length && X.length>1 && X.slice(1).includes(a[k]) && false) k++; } }
  return k >= Math.min(a.length, 3) || k===a.length;
}
function glossaryDefs(h){
  return [...h.matchAll(/<span class="gl" tabindex="0">([\s\S]*?)<span class="gl-tip"/g)].map(m=>({ term: norm(m[1]), at: m.index }));
}
function expansions(text){
  const out = [];
  for (const m of text.matchAll(/((?:[A-Za-z][\w'’-]*\s+){0,6}[A-Za-z][\w'’-]*)\s*\(\s*([A-Z][A-Za-z0-9.\/+-]{1,9}?)s?\s*\)/g)){   // Wide Area Network (WAN)
    const ws = m[1].split(/\s+/); for (let k=1; k<=ws.length; k++) if (initialsFit(m[2], ws.slice(-k).join(" "))){ out.push({ term: norm(m[2]), pos: m.index }); break; } }
  for (const m of text.matchAll(/\b([A-Z][A-Za-z0-9.\/+-]{1,9}?)s?\s*(\(\s*(?:the |a |an )?|[—–:]\s*|,?\s*(?:short for|stands for|meaning)\s+(?:the |a |an )?)([A-Za-z][\w'’-]*(?:\s+[\w'’-]+){0,6})/g))
    if (initialsFit(m[1], m[3]) || /short for|stands for/.test(m[2])) out.push({ term: norm(m[1]), pos: m.index });
  return out;
}
const lessonHtml = l => [l.html,
  ...(l.quiz||[]).map(q=>`<p>${q.q||""} ${(q.o||q.items||[]).join(" ")} ${(q.pairs||[]).flat().join(" ")} ${q.why||q.e||""}</p>`),
  ...(l.cards||[]).map(c=>`<p>${Array.isArray(c)?c.join(" "):`${c.f||c.q||""} ${c.b||c.a||""}`}</p>`)].join("\n");

// lowercase words used anywhere in the courses — an all-caps token whose lowercase form is a normal word is emphasis (TRUE, SWITCH)
const WORDS = new Set(); for (const t of ctx.LL.tracks) for (const l of t.lessons) for (const w of strip(l.html).match(/\b[a-z]{3,}\b/g)||[]) WORDS.add(w);
const vocab = new Set(); if (jargon) for (const l of T.lessons) for (const d of glossaryDefs(l.html||"")) if (/\s/.test(d.term) && d.term.length>=6) vocab.add(d.term);

const known = new Set(); const report = []; let total = 0;
T.lessons.forEach((l, li) => {
  const h = lessonHtml(l), text = strip(h);
  const defs = glossaryDefs(h).map(d=>({ term: d.term, pos: strip(h.slice(0, d.at)).length })).concat(expansions(text));
  const firstDef = t => defs.reduce((p, d) => (d.term===t || d.term.split(/[\s\/,()-]+/).includes(t)) ? Math.min(p, d.pos) : p, Infinity);
  const hits = [], seen = new Set();
  const flag = (t, pos, shown) => { if (seen.has(t) || known.has(t)) return; seen.add(t);
    const dp = firstDef(t); if (dp <= pos + 250) return;
    hits.push({ term: shown, later: dp<Infinity, ctx: text.slice(Math.max(0,pos-80), pos+80).replace(/\s+/g," ").trim() }); };
  for (const m of text.matchAll(/\b(?:\d{3}\.\d+[A-Za-z]{1,2}|[A-Z][A-Z0-9]{1,7}|[A-Z][a-z]?[A-Z][A-Za-z]{0,4})s?\b/g)){
    const raw = m[0].replace(/(?<=[A-Z0-9])s$/, ""), t = raw.toLowerCase();
    if (COMMON.has(raw) || NAMES.has(raw) || /^\d+$/.test(raw) || /^[A-Z]$/.test(raw)) continue;
    if (/^[A-Z]{1,5}\d{1,3}[A-Z]?$/.test(raw)) continue;                                                  // hostnames: PC1, SW2, R1
    const after = text.slice(m.index+m[0].length, m.index+m[0].length+2), before = text.slice(Math.max(0,m.index-2), m.index);
    if (/^[-\/_][A-Za-z0-9]/.test(after) || /[A-Za-z0-9][-\/_]$/.test(before) || /%$/.test(before)) continue;           // hostnames and log names: SW-3F, ACC-1, CHG-2291, %SPANTREE-2-…
    if (/^VLAN\d{4}$/.test(raw)) continue;                                                                                  // IOS output labels
    if (raw.length>=3 && WORDS.has(t)) continue;                                                          // an English word in capitals
    if (/(^|\s)[A-Z] $/.test(text.slice(Math.max(0,m.index-3), m.index))) continue;                        // mnemonic letter splits: "D HCP"
    if (/^[A-Z][a-z]/.test(raw) && !/[A-Z].*[A-Z]/.test(raw.slice(1))) continue;                          // Capitalised words
    flag(t, m.index, raw);
  }
  if (jargon){ const low = text.toLowerCase(); for (const v of vocab){ const i = low.search(new RegExp("\\b" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "s?\\b")); if (i>-1) flag(v, i, v); } }
  for (const d of defs) known.add(d.term);
  for (const d of defs) for (const w of d.term.split(/[\s\/,()-]+/)) if (/^[a-z0-9.]{2,9}$/.test(w) && d.term.split(/\s+/).length<=3) known.add(w);  // "PoE (Power over Ethernet)" teaches poe
  if (hits.length && (!mods.length || mods.includes(l.mod)) && (!frags.length || l.mod==="_fragment" || mods.includes(l.mod))) { report.push({ lesson: `${li+1}. ${l.t}`, mod: l.mod||"", hits }); total += hits.length; }
});
for (const r of report){ console.log(`\n== ${r.lesson}${r.mod?`  [${r.mod}]`:""}`);
  for (const h of r.hits) console.log(`  ${h.term.padEnd(16)} ${h.later?"defined later":"never defined"}  …${h.ctx}…`); }
console.log(`\n${total} term(s) used before they were taught.`);
process.exitCode = total ? 1 : 0;
