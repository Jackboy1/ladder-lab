#!/usr/bin/env node
// Ladder Lab content validator. Loads every script from index.html in order (except app.js),
// then checks tracks, lessons, quick checks, quizzes, cards, labs and in-lesson terminals.
// Usage: node tools/validate.js [--words]   (exit code 1 on any error)
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(m=>m[1]).filter(f=>f!=="app.js");
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);

const ctx = { console, setTimeout, clearTimeout };
ctx.window = ctx; vm.createContext(ctx);
for (const f of files){
  const p = path.join(root, f);
  if (!fs.existsSync(p)){ err(`index.html loads missing file ${f}`); continue; }
  try { vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f }); }
  catch(e){ err(`${f}: ${e.message}`); }
}
const LL = ctx.LL, K = ctx.K, SIM = ctx.SIM;
if (!LL){ console.error("LL registry did not load"); process.exit(1); }
// --lesson <fragment.js> --track <id>: test a lesson fragment (a file of L.push({...}) calls) on its own
const ai = process.argv.indexOf("--lesson");
if (ai>-1){
  const frag = process.argv[ai+1], ti = process.argv.indexOf("--track"), tid = ti>-1 ? process.argv[ti+1] : "ccna";
  try { vm.runInContext(`(function(){ const L=[];\n${fs.readFileSync(frag,"utf8")}\nK.module(${JSON.stringify(tid)},{id:"_fragment",t:"fragment under test"},L);})();`, ctx, { filename: frag, lineOffset:-1 }); }
  catch(e){ console.log("ERROR: fragment did not run:", e.message); process.exit(1); }
}

const HTMLTAG = /<\/?(b|i|u|em|strong|code|br|p|span|div|ul|ol|li|a|kbd|sub|sup|small|pre)(\s[^>]*)?\/?>/i;
const strip = h => h.replace(/<svg[\s\S]*?<\/svg>/g," ").replace(/<[^>]+>/g," ").replace(/&[a-z]+;/g," ");
const words = h => strip(h).split(/\s+/).filter(Boolean).length;
function balance(h, where){
  const body = h.replace(/<svg[\s\S]*?<\/svg>/g,"");
  for (const tag of ["div","details","ol","ul","table","pre","figure","p","li","span","h2","h3","b","code"]){
    const open = (body.match(new RegExp(`<${tag}(\\s[^>]*)?>`,"g"))||[]).length;
    const close = (body.match(new RegExp(`</${tag}>`,"g"))||[]).length;
    if (tag==="p"||tag==="li"){ if (close>open) err(`${where}: more </${tag}> than <${tag}>`); continue; }
    if (open!==close) err(`${where}: <${tag}> opened ${open}× but closed ${close}×`);
  }
  const svgs = (h.match(/<svg/g)||[]).length, svge = (h.match(/<\/svg>/g)||[]).length;
  if (svgs!==svge) err(`${where}: unbalanced <svg>`);
}
function checkQuiz(q, where){
  if (!q) return err(`${where}: empty quiz item`);
  const p = ctx.QT ? ctx.QT.problem(q) : null;
  if (p) return err(`${where}: ${p} — "${String(q.q||"").slice(0,50)}"`);
  if (q.o && new Set(q.o).size!==q.o.length) warn(`${where}: duplicate options in "${q.q.slice(0,50)}"`);
  const texts = [q.q, q.why||"", q.ex||"", ...(q.o||[]), ...(q.items||[]), ...((q.pairs||[]).flat()), ...((q.fields||[]).flatMap(f=>[f.label||"", ...f.a]))];
  if (texts.some(s=>HTMLTAG.test(String(s)))) err(`${where}: quiz text is shown as plain text — remove HTML tags from "${q.q.slice(0,50)}"`);
  if (!q.why) warn(`${where}: no explanation (why) for "${q.q.slice(0,50)}"`);
}

const report = [];
for (const t of LL.tracks){
  const ids = new Set();
  t.lessons.forEach((l,i)=>{
    const where = `${t.id} lesson ${i+1} "${(l.t||"").slice(0,50)}"`;
    if (!l.t || !l.html) return err(`${where}: missing title or html`);
    if (l.id){ if (ids.has(l.id)) err(`${where}: duplicate lesson id ${l.id}`); ids.add(l.id); }
    if (l.html.includes("undefined")) warn(`${where}: html contains "undefined"`);
    balance(l.html, where);
    for (const m of l.html.matchAll(/<div class="kc" data-a="(\d+)">([\s\S]*?)<div class="kc-why"/g)){
      const n = (m[2].match(/class="opt kc-o"/g)||[]).length;
      if (+m[1] >= n) err(`${where}: quick check answer ${m[1]} but only ${n} options`);
    }
    if (l.mod && !(t.modules||[]).some(m=>m.id===l.mod)) err(`${where}: module ${l.mod} not registered`);
    const w = words(l.html);
    if (l.mod && w < 2000) warn(`${where}: only ${w} words (rebuilt lessons should be 2,500+)`);
    if (l.mod){
      const qz = l.quiz||[], types = new Set(qz.map(q=>q.type||"mcq"));
      for (const ty of ["multi","order","match","fill"]) if (!types.has(ty)) warn(`${where}: quiz has no "${ty}" question`);
      if (!qz.some(q=>q.ex)) warn(`${where}: quiz has no exhibit (ex) question`);
      if (qz.length < 12) warn(`${where}: only ${qz.length} quiz questions (aim for 12–15)`);
      if (!/class="mt[" ]|class="kreveal"/.test(l.html)) warn(`${where}: no hands-on (bench, terminal or exercise)`);
      if (!/class="kc kq"/.test(l.html)) warn(`${where}: no inline K.q practice question`);
    }
    report.push({ track:t.id, mod:l.mod||"-", t:l.t, w, kc:(l.html.match(/class="kc"/g)||[]).length, mt:(l.html.match(/class="mt"|class="mt bench"/g)||[]).length, fig:(l.html.match(/<svg/g)||[]).length });
  });
  (t.quiz||[]).forEach((q,i)=>checkQuiz(q, `${t.id} quiz #${i+1}`));
  (t.cards||[]).forEach((c,i)=>{ if (!c.f || !c.b) err(`${t.id} card #${i+1}: needs f and b`);
    else if (HTMLTAG.test(c.f+c.b)) err(`${t.id} card #${i+1}: card text is shown as plain text — remove HTML tags ("${c.f.slice(0,40)}")`); });
  (t.labs||[]).forEach(id=>{ if (!LL.labs[id]) err(`${t.id}: lab ${id} not defined`); });
}
// code labs: every check must be a valid regex, the model solution must pass all of them, the empty starter must not
for (const t of LL.tracks) for (const c of (t.codelabs||[])){
  const where = `codelab ${c.id}`;
  if (!c.t || !c.brief || !Array.isArray(c.checks) || !c.checks.length) { err(`${where}: needs t, brief and checks`); continue; }
  for (const ch of c.checks){
    let re; try { re = new RegExp(ch.re, "im"); } catch(e){ err(`${where}: bad regex ${ch.re}`); continue; }
    if (c.model && !re.test(c.model)) err(`${where}: model solution fails check /${ch.re}/ (${ch.hint})`);
  }
  if (c.starter && c.checks.every(ch=>{ try { return new RegExp(ch.re,"im").test(c.starter); } catch(e){ return false; } })) err(`${where}: the starter code already passes every check`);
  if (!c.model) warn(`${where}: no model solution`);
}
// tickets and interview questions
const tids = new Set();
for (const tk of LL.tickets){
  const where = `ticket ${tk.id}`;
  if (tids.has(tk.id)) err(`${where}: duplicate id`); tids.add(tk.id);
  for (const k of ["title","body","model","sev"]) if (!tk[k]) err(`${where}: missing ${k}`);
  if (!Array.isArray(tk.asks) || !tk.asks.length) err(`${where}: needs asks[]`);
  else balance(tk.model, where+" model");
}
LL.interview.forEach((iv,i)=>{ const where = `interview #${i+1}`;
  for (const k of ["topic","q","a"]) if (!iv[k]) err(`${where}: missing ${k}`);
  if (iv.a && iv.a.split(/\s+/).length < 25) warn(`${where}: model answer is very short (${iv.a.split(/\s+/).length} words) — "${iv.q.slice(0,50)}"`);
});
// exams: each track's question pool must be big enough for a meaningful exam
for (const t of LL.tracks){ if ((t.quiz||[]).length < 10) warn(`${t.id}: only ${t.quiz.length} quiz questions — exam pool is thin`); }
const qtext = new Map();
for (const t of LL.tracks) for (const q of (t.quiz||[])){ const k = q.q.trim().toLowerCase(); if (qtext.has(k)) warn(`duplicate quiz question in ${t.id} and ${qtext.get(k)}: "${q.q.slice(0,60)}"`); else qtext.set(k, t.id); }

for (const [id,lab] of Object.entries(LL.labs)){
  if (!SIM || !SIM[lab.env+"Env"]){ err(`lab ${id}: unknown env ${lab.env}`); continue; }
  try { const env = SIM[lab.env+"Env"](lab.opts||{}); if (lab.setup) lab.setup(env); lab.objectives.forEach(o=>o.done(env)); }
  catch(e){ err(`lab ${id}: ${e.message}`); }
}
// in-lesson terminals: build each one and make sure the tasks can be evaluated on a fresh box
if (K && K._terms){
  for (const [id,cfg] of Object.entries(K._terms())){
    const where = `terminal "${cfg.title||id}"`;
    if (!SIM[cfg.env+"Env"]){ err(`${where}: unknown env ${cfg.env}`); continue; }
    try { const env = SIM[cfg.env+"Env"](K._fresh(cfg.opts)); if (cfg.setup) cfg.setup(env);
      (cfg.tasks||[]).forEach(tk=>{ if (typeof tk.done!=="function") throw new Error("task without done()"); tk.done(env); });
      if ((cfg.tasks||[]).some(tk=>tk.done(env))) warn(`${where}: a task is already complete before the learner types anything`);
      if (cfg.solve){ cfg.solve.forEach(c=>env.exec(c)); (cfg.tasks||[]).forEach(tk=>{ if (!tk.done(env)) err(`${where}: solution does not complete "${tk.text.replace(/<[^>]+>/g,"")}"`); }); }
    } catch(e){ err(`${where}: ${e.message}`); }
  }
}

// in-lesson practice questions
if (K && K._qs) for (const [id,q] of Object.entries(K._qs())){ const p = ctx.QT.problem(q); if (p) err(`practice question "${String(q.q||id).slice(0,50)}": ${p}`); }
// hands-on benches: tasks must start incomplete and the solve actions must complete all of them
if (K && K._benches && ctx.Bench){
  for (const [id,cfg] of Object.entries(K._benches())){
    const where = `bench "${cfg.title||id}"`;
    try { const B = ctx.Bench.create(cfg); const tasks = cfg.tasks||[];
      if (tasks.some(t=>t.done(B))) warn(`${where}: a task is already complete before the learner does anything`);
      if (!cfg.solve) warn(`${where}: no solve[] — can't prove it is completable`);
      else { for (const a of cfg.solve){ const r = ctx.Bench.act(B, a); if (r.ok===false) err(`${where}: solve step ${JSON.stringify(a)} failed: ${r.msg}`); }
        tasks.forEach(t=>{ if (!t.done(B)) err(`${where}: solution does not complete "${t.text.replace(/<[^>]+>/g,"")}"`); }); }
    } catch(e){ err(`${where}: ${e.message}`); }
  }
}

if (process.argv.includes("--words")){
  for (const r of report) console.log(`${r.track.padEnd(10)} ${String(r.mod).padEnd(9)} ${String(r.w).padStart(5)}w  kc=${r.kc} term=${r.mt} fig=${r.fig}  ${r.t}`);
}
const tot = report.reduce((a,r)=>a+r.w,0);
console.log(`\n${LL.tracks.length} tracks · ${report.length} lessons · ${tot.toLocaleString()} words · ${Object.keys(LL.labs).length} labs · ${LL.tracks.reduce((a,t)=>a+t.quiz.length,0)} quiz questions · ${LL.tracks.reduce((a,t)=>a+t.cards.length,0)} cards`);
warns.forEach(w=>console.log("warn:", w));
errors.forEach(e=>console.log("ERROR:", e));
console.log(errors.length ? `\n${errors.length} error(s)` : "\nOK — no errors");
process.exit(errors.length ? 1 : 0);
