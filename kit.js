// Ladder Lab — lesson kit (K). Building blocks for rich lessons: goals, steps, inline checks,
// in-lesson terminals, on-the-job scenarios, glossary pop-ups and theme-aware SVG diagrams.
// Content files call K.* while building lesson HTML; app.js calls K.hydrate() after a lesson renders.
// Authoring guide: CONTENT_GUIDE.md
(function(){
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const list = items => items.map(x=>`<li>${x}</li>`).join("");
let uid = 0;
const terms = {};   // id -> {env, opts, setup, title, intro, tasks}
const benches = {}; // id -> bench config (see bench.js)
const qs = {};      // id -> practice question (see qtypes.js)
const drills = {};  // id -> drill config (see drills.js)
const live = {};    // id -> {env, lines}  (survives re-renders during the session)
// simulators mutate opts (e.g. opts.intfs), so each box gets its own deep copy (functions such as setup/hooks are kept)
const fresh = o => { const c = JSON.parse(JSON.stringify(o||{}));
  for (const [k,v] of Object.entries(o||{})){
    if (typeof v==="function") c[k] = v;
    else if (v && typeof v==="object" && !Array.isArray(v) && Object.values(v).some(x=>typeof x==="function")) c[k] = Object.assign({}, c[k], Object.fromEntries(Object.entries(v).filter(([,x])=>typeof x==="function")));
  }
  return c; };

const K = {
  esc,
  /* ---------- lesson structure ---------- */
  goals: items => `<div class="kbox goals"><div class="kbox-h">By the end of this lesson you can</div><ul>${list(items)}</ul></div>`,
  pre: items => `<div class="kbox pre"><div class="kbox-h">Before you start</div><ul>${list(items)}</ul></div>`,
  steps: arr => `<ol class="ksteps">${arr.map(([t,body])=>`<li><div class="ks-t">${t}</div><div class="ks-b">${body}</div></li>`).join("")}</ol>`,
  analogy: html => `<div class="kbox analogy"><div class="kbox-h">Think of it like this</div>${html}</div>`,
  tip: html => `<div class="callout"><b>Pro tip:</b> ${html}</div>`,
  mistake: html => `<div class="callout warn"><b>Common mistake:</b> ${html}</div>`,
  job: (title, html) => `<div class="kbox job"><div class="kbox-h">On the job · ${title}</div>${html}</div>`,
  case: (title, html) => `<div class="kbox case"><div class="kbox-h">Case study · ${title}</div>${html}</div>`,
  reveal: (summary, html) => `<details class="kreveal"><summary>${summary}</summary><div>${html}</div></details>`,
  recap: items => `<div class="kbox recap"><div class="kbox-h">Recap — say these out loud</div><ul>${list(items)}</ul></div>`,
  next: html => `<div class="kbox nextup"><div class="kbox-h">Next up</div>${html}</div>`,
  hint: (html, label) => `<details class="khint"><summary>💡 ${label||"Hint"}</summary><div>${html}</div></details>`,
  dyk: html => `<div class="kbox dyk"><div class="kbox-h">Did you know?</div>${html}</div>`,
  remember: html => `<div class="kbox remember"><div class="kbox-h">Memory aid</div>${html}</div>`,
  exam: html => `<div class="callout exam"><b>Exam tip:</b> ${html}</div>`,
  // myths: [[the false belief, the truth], ...]
  myth: pairs => `<div class="kbox myth"><div class="kbox-h">Myth vs fact — what is NOT true</div>${pairs.map(([m,f])=>`<div class="km"><div class="km-m"><span class="km-x">✗</span> ${m}</div><div class="km-f"><span class="km-ok">✓</span> ${f}</div></div>`).join("")}</div>`,
  dodont: (dos, donts) => `<div class="kdd"><div class="kdd-do"><div class="kbox-h">Do</div><ul>${list(dos)}</ul></div><div class="kdd-dont"><div class="kbox-h">Don't</div><ul>${list(donts)}</ul></div></div>`,
  // when-to-use table: rows [[option, use it when…, why, avoid when…], ...]
  when: (rows, title) => `<div class="kbox when"><div class="kbox-h">${title||"When to use what — and why"}</div><div class="tablewrap"><table><tr><th>Option</th><th>Use it when…</th><th>Why</th><th>Avoid when…</th></tr>${rows.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]||"—"}</td></tr>`).join("")}</table></div></div>`,
  // video pick (opens in a new tab): {t, u, by, mins, why}
  video: v => `<a class="kvid" href="${esc(v.u)}" target="_blank" rel="noopener"><span class="kvid-play">▶</span><span><b>${v.t}</b><span class="small muted">${[v.by, v.mins?v.mins+" min":""].filter(Boolean).join(" · ")}</span>${v.why?`<span class="small">${v.why}</span>`:""}</span></a>`,
  // image: {src, alt, caption, credit} — src is a local file under assets/ or a verified URL
  img: o => `<figure class="kimg"><img src="${esc(o.src)}" alt="${esc(o.alt||"")}" loading="lazy">${o.caption||o.credit?`<figcaption class="small muted">${o.caption||""}${o.credit?` <span class="kcredit">${o.credit}</span>`:""}</figcaption>`:""}</figure>`,
  g: (term, def) => `<span class="gl" tabindex="0">${term}<span class="gl-tip" role="tooltip">${def}</span></span>`,
  kbd: k => `<kbd>${k}</kbd>`,
  out: (text, caption) => `<figure class="kout"><pre><code>${esc(text)}</code></pre>${caption?`<figcaption class="small muted">${caption}</figcaption>`:""}</figure>`,

  /* inline knowledge check — {q, o:[...], a:index, why} */
  check: ({q, o, a, why}) => `<div class="kc" data-a="${a}"><div class="kc-h">Quick check</div><div class="kc-q">${q}</div>${o.map((x,i)=>`<button class="opt kc-o" data-i="${i}">${x}</button>`).join("")}<div class="kc-why" hidden>${why||""}</div></div>`,

  /* in-lesson practice question of any QT type (multi, order, match, fill, mcq) */
  q: q => { const id = "q"+(++uid); qs[id] = q; return `<div class="kc kq" data-kq="${id}"><div class="kc-h">Practice</div><div class="kq-body"></div></div>`; },

  /* endless practice drill (drills.js) — {title, types:["subnet","dec2bin",...], count:5} */
  drill: cfg => { const id = "d"+(++uid); drills[id] = cfg; return `<div class="kc kd" data-kd="${id}"><div class="kc-h">Drill · ${cfg.title||"practice until it's automatic"}</div><div class="kd-body"></div></div>`; },

  /* in-lesson terminal — {env:'ios'|'linux'|'git'|'k8s', title, intro, opts, setup(env), tasks:[{text, done(env)}]} */
  term: cfg => { const id = "t"+(++uid); terms[id] = cfg;
    return `<div class="mt" data-mt="${id}"><div class="mt-h">Try it yourself · ${cfg.title||"terminal"}</div>${cfg.intro?`<p class="small">${cfg.intro}</p>`:""}<div class="mt-body"></div></div>`; },

  /* hands-on lab bench — {title, intro, devices:[...], cables:[...], tray:[...], tasks:[{text, done(B)}], win, solve:[actions], viewBox} */
  bench: cfg => { const id = "b"+(++uid); benches[id] = cfg; if (cfg.id && window.LL) LL.benches[cfg.id] = cfg;
    return `<div class="mt bench" data-bench="${id}"><div class="mt-h">Hands-on bench · ${cfg.title||"cable it, configure it, test it"}</div>${cfg.intro?`<p class="small">${cfg.intro}</p>`:""}<div class="bn-body"></div><div class="btnrow"><button class="btn sm ghost bn-reset">Reset bench</button></div></div>`; },

  /* ---------- SVG diagrams (theme-aware) ---------- */
  svg: (vb, inner, caption) => `<figure class="kfig"><svg viewBox="${vb}" role="img" aria-label="${esc(caption||"diagram")}"><defs><marker id="karr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker><marker id="karra" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker></defs>${inner}</svg>${caption?`<figcaption class="small muted">${caption}</figcaption>`:""}</figure>`,
  box: (x,y,w,h,label,sub,accent) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="var(--panel2)" stroke="${accent?"var(--accent)":"var(--line)"}" stroke-width="1.4"/><text x="${x+w/2}" y="${y+(sub?h/2-3:h/2+4)}" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--display)">${label}</text>${sub?`<text x="${x+w/2}" y="${y+h/2+13}" text-anchor="middle" fill="var(--muted)" font-size="10.5">${sub}</text>`:""}</g>`,
  band: (x,y,w,h,label,color) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${color||"var(--chip)"}" stroke="var(--line)"/><text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" fill="var(--fg)" font-size="11.5" font-family="var(--mono)">${label}</text></g>`,
  arrow: (x1,y1,x2,y2,label,accent) => `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent?"var(--accent)":"var(--muted)"}" stroke-width="1.5" marker-end="url(#${accent?"karra":"karr"})"/>${label?`<text x="${(x1+x2)/2}" y="${(y1+y2)/2-6}" text-anchor="middle" fill="${accent?"var(--accent)":"var(--muted)"}" font-size="10.5">${label}</text>`:""}</g>`,
  link: (x1,y1,x2,y2,label,dashed) => `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-width="1.6" ${dashed?'stroke-dasharray="5 4"':""}/>${label?`<text x="${(x1+x2)/2}" y="${(y1+y2)/2-6}" text-anchor="middle" fill="var(--muted)" font-size="10" font-family="var(--mono)">${label}</text>`:""}</g>`,
  txt: (x,y,t,o) => { o=o||{}; return `<text x="${x}" y="${y}" fill="var(--${o.c||"muted"})" font-size="${o.s||11}" ${o.mid?'text-anchor="middle"':o.end?'text-anchor="end"':""} font-family="var(--${o.f||"mono"})" ${o.b?'font-weight="700"':""}>${t}</text>`; },
  // device icons — (cx, cy) is the icon centre; label sits underneath
  dev: (kind, cx, cy, label, sub) => {
    const L = label?`<text x="${cx}" y="${cy+34}" text-anchor="middle" fill="var(--fg)" font-size="11.5" font-weight="600" font-family="var(--display)">${label}</text>`:"";
    const S = sub?`<text x="${cx}" y="${cy+47}" text-anchor="middle" fill="var(--muted)" font-size="10" font-family="var(--mono)">${sub}</text>`:"";
    const st = `fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.5"`;
    let g = "";
    if (kind==="pc") g = `<rect x="${cx-18}" y="${cy-18}" width="36" height="25" rx="3" ${st}/><rect x="${cx-13}" y="${cy-13}" width="26" height="15" rx="1" fill="var(--chip)"/><line x1="${cx}" y1="${cy+7}" x2="${cx}" y2="${cy+13}" stroke="var(--accent)" stroke-width="1.5"/><line x1="${cx-10}" y1="${cy+14}" x2="${cx+10}" y2="${cy+14}" stroke="var(--accent)" stroke-width="2"/>`;
    else if (kind==="laptop") g = `<rect x="${cx-15}" y="${cy-16}" width="30" height="20" rx="2" ${st}/><rect x="${cx-11}" y="${cy-12}" width="22" height="12" fill="var(--chip)"/><path d="M${cx-21},${cy+5} h42 l-4,7 h-34 z" ${st}/>`;
    else if (kind==="phone") g = `<rect x="${cx-9}" y="${cy-18}" width="18" height="32" rx="4" ${st}/><rect x="${cx-6}" y="${cy-13}" width="12" height="20" fill="var(--chip)"/>`;
    else if (kind==="server") g = `<rect x="${cx-15}" y="${cy-20}" width="30" height="38" rx="3" ${st}/>${[0,1,2].map(i=>`<line x1="${cx-10}" y1="${cy-12+i*11}" x2="${cx+4}" y2="${cy-12+i*11}" stroke="var(--muted)" stroke-width="1.5"/><circle cx="${cx+9}" cy="${cy-12+i*11}" r="1.8" fill="var(--ok)"/>`).join("")}`;
    else if (kind==="switch") g = `<rect x="${cx-26}" y="${cy-11}" width="52" height="22" rx="3" ${st}/>${[0,1,2,3,4,5].map(i=>`<rect x="${cx-21+i*7.4}" y="${cy+1}" width="5" height="5" fill="var(--muted)"/>`).join("")}<path d="M${cx-14},${cy-5} h10 m-3,-3 l3,3 l-3,3 M${cx+14},${cy-5} h-10 m3,-3 l-3,3 l3,3" stroke="var(--accent)" stroke-width="1.3" fill="none"/>`;
    else if (kind==="router") g = `<ellipse cx="${cx}" cy="${cy+6}" rx="24" ry="8" ${st}/><rect x="${cx-24}" y="${cy-8}" width="48" height="14" fill="var(--panel2)" stroke="none"/><line x1="${cx-24}" y1="${cy-8}" x2="${cx-24}" y2="${cy+6}" stroke="var(--accent)" stroke-width="1.5"/><line x1="${cx+24}" y1="${cy-8}" x2="${cx+24}" y2="${cy+6}" stroke="var(--accent)" stroke-width="1.5"/><ellipse cx="${cx}" cy="${cy-8}" rx="24" ry="8" ${st}/><path d="M${cx-10},${cy-8} h20 M${cx-6},${cy-12} l-4,4 l4,4 M${cx+6},${cy-12} l4,4 l-4,4" stroke="var(--accent)" stroke-width="1.2" fill="none"/>`;
    else if (kind==="firewall") g = `<rect x="${cx-22}" y="${cy-16}" width="44" height="30" rx="2" fill="var(--panel2)" stroke="var(--bad)" stroke-width="1.5"/>${[0,1,2].map(r=>`<line x1="${cx-22}" y1="${cy-16+r*10+10}" x2="${cx+22}" y2="${cy-16+r*10+10}" stroke="var(--bad)" stroke-width="1"/>`).join("")}${[0,1,2].map(r=>[0,1].map(c=>`<line x1="${cx-11+c*22-(r%2?11:0)}" y1="${cy-16+r*10}" x2="${cx-11+c*22-(r%2?11:0)}" y2="${cy-6+r*10}" stroke="var(--bad)" stroke-width="1"/>`).join("")).join("")}`;
    else if (kind==="ap") g = `<rect x="${cx-16}" y="${cy-2}" width="32" height="12" rx="6" ${st}/><path d="M${cx-9},${cy-8} a12,12 0 0,1 18,0 M${cx-14},${cy-13} a19,19 0 0,1 28,0" stroke="var(--accent)" stroke-width="1.5" fill="none"/>`;
    else if (kind==="cloud") g = `<path d="M${cx-24},${cy+10} a11,11 0 0,1 2,-21 a15,15 0 0,1 27,-4 a11,11 0 0,1 19,9 a9,9 0 0,1 -2,16 z" ${st}/>`;
    else if (kind==="printer") g = `<rect x="${cx-18}" y="${cy-6}" width="36" height="16" rx="3" ${st}/><rect x="${cx-11}" y="${cy-17}" width="22" height="11" fill="var(--chip)" stroke="var(--accent)"/><rect x="${cx-11}" y="${cy+6}" width="22" height="9" fill="var(--panel)" stroke="var(--accent)"/>`;
    else if (kind==="hub") g = `<rect x="${cx-24}" y="${cy-9}" width="48" height="18" rx="3" ${st}/>${[0,1,2,3,4].map(i=>`<rect x="${cx-18+i*8}" y="${cy-2}" width="5" height="5" fill="var(--muted)"/>`).join("")}`;
    else if (kind==="camera") g = `<rect x="${cx-16}" y="${cy-9}" width="26" height="16" rx="3" ${st}/><path d="M${cx+10},${cy-4} l8,-4 v16 l-8,-4 z" ${st}/><circle cx="${cx-3}" cy="${cy-1}" r="4" fill="var(--chip)" stroke="var(--accent)"/>`;
    else g = `<circle cx="${cx}" cy="${cy}" r="16" ${st}/>`;
    return `<g>${g}${L}${S}</g>`;
  },

  /* ---------- registration helpers ---------- */
  // K.module(trackId, {id, t, blurb}, lessons[, {at, replace}]) — adds a module and its lessons to a track.
  // Lesson: {id, t, mins, level, html, quiz:[{q,o,a,why}], cards:[{f,b}]}
  module: (trackId, mod, lessons, where) => {
    const t = LL.tracks.find(x=>x.id===trackId); if (!t) throw new Error("K.module: no track "+trackId);
    t.lessons.forEach((l,i)=>{ if (l._i==null) l._i = i; });
    t.modules = t.modules || [];
    if (where && where.replace) t.lessons = t.lessons.filter(l=>!where.replace.includes(l.t));
    const ls = lessons.map(l=>Object.assign({}, l, {mod: mod.id}));
    const at = where && where.at!=null ? where.at : t.lessons.length;
    t.lessons.splice(at, 0, ...ls);
    const mi = where && where.modAt!=null ? where.modAt : t.modules.length;
    t.modules.splice(mi, 0, mod);
    for (const l of ls){ if (l.quiz) t.quiz.push(...l.quiz.map(q=>Object.assign({lesson:l.id}, q))); if (l.cards) t.cards.push(...l.cards); }
    return t;
  },
  // terminal line handling shared by in-lesson terminals and the bench: echo the typed line (hidden for passwords,
  // appended to the question when answering a prompt such as [confirm]) and print any kind of engine output
  termEcho: (L, env, v, prompt) => { if (env && env.pending){ if (!env.noEcho && L.length) L[L.length-1].t += v; } else L.push({t:(prompt||"")+v, cls:"in"}); },
  termOut: (L, o) => { if (o==null || o==="") return; if (o.clear){ L.length = 0; return; } if (typeof o==="string"){ L.push({t:o, cls:""}); return; } if (o.text) L.push({t:o.text, cls:""}); if (o.ask) L.push({t:o.ask, cls:"ask"}); },
  _terms: () => terms,   // for tools/validate.js
  _benches: () => benches,
  _qs: () => qs,
  _drills: () => drills,
  _fresh: fresh,
  slug: s => String(s).toLowerCase().replace(/<[^>]+>/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60),

  /* ---------- runtime: wire up a rendered lesson ---------- */
  hydrate: (root) => {
    root.querySelectorAll(".kc").forEach(kc=>{
      const a = +kc.dataset.a, why = kc.querySelector(".kc-why");
      kc.querySelectorAll(".kc-o").forEach(b=>b.onclick=()=>{
        kc.querySelectorAll(".kc-o").forEach(x=>{ x.disabled=true; if(+x.dataset.i===a) x.classList.add("right"); });
        if (+b.dataset.i!==a) b.classList.add("wrong");
        if (why && why.innerHTML.trim()){ why.hidden=false; why.insertAdjacentHTML("afterbegin", +b.dataset.i===a?"<b>Correct.</b> ":"<b>Not quite.</b> "); }
      });
    });
    root.querySelectorAll(".kd").forEach(box=>{
      const cfg = drills[box.dataset.kd]; if (!cfg || !window.DRILL) return;
      const body = box.querySelector(".kd-body"), types = (cfg.types||["subnet"]).filter(t=>DRILL.GEN[t]), set = cfg.count||5;
      let q = DRILL.gen(types), n = 0, right = 0, checked = false, vals = [], marks = [];
      const draw = () => {
        if (n>=set){ body.innerHTML = `<p><b>${right}/${set}</b> fully correct${right===set?" — clean sweep.":". Misses are the method you still need: read their walkthroughs and go again."}</p><button class="btn sm kd-again">Another ${set}</button>`; body.querySelector(".kd-again").onclick = () => { n=0; right=0; q=DRILL.gen(types); checked=false; vals=[]; draw(); }; return; }
        body.innerHTML = `<div class="small muted">Question ${n+1} of ${set} · ${right} right · ${esc(DRILL.LABELS[q.type]||q.type)}</div><div class="kc-q">${esc(q.q)}</div>${q.ex?`<figure class="kout"><pre><code>${esc(q.ex)}</code></pre></figure>`:""}
          <div class="kd-fields">${q.fields.map((f,i)=>`<label><span>${esc(f.label)}</span><input class="txt mono" data-i="${i}" value="${esc(vals[i]||"")}" autocomplete="off" spellcheck="false" ${checked?"disabled":""}>${checked?(marks[i]?`<span class="small" style="color:var(--ok)">✓</span>`:`<span class="small" style="color:var(--bad)">✗ ${esc(f.a)}</span>`):""}</label>`).join("")}</div>
          ${checked?`<div class="kc-why"><b>${marks.every(Boolean)?"Correct.":"Worked answer:"}</b> ${esc(q.why)}</div><button class="btn sm kd-next">${n+1>=set?"Finish":"Next question"}</button>`:`<button class="btn sm kd-check">Check</button> <button class="btn sm ghost kd-skip">Different question</button>`}`;
        const ins = [...body.querySelectorAll("input")]; if (!checked && ins[0]) ins[0].focus();
        ins.forEach(inp=>{ inp.oninput = () => { vals[+inp.dataset.i] = inp.value; }; inp.onkeydown = e => { if (e.key==="Enter"){ const c = body.querySelector(".kd-check"); if (c) c.click(); } }; });
        const c = body.querySelector(".kd-check"); if (c) c.onclick = () => { marks = DRILL.grade(q, vals); checked = true; if (marks.every(Boolean)) right++; draw(); };
        const sk = body.querySelector(".kd-skip"); if (sk) sk.onclick = () => { q = DRILL.gen(types); vals=[]; draw(); };
        const nx = body.querySelector(".kd-next"); if (nx) nx.onclick = () => { n++; q = DRILL.gen(types); checked=false; vals=[]; marks=[]; draw(); };
      };
      draw();
    });
    root.querySelectorAll(".kq").forEach(box=>{
      const q = qs[box.dataset.kq]; if (!q || !window.QT) return;
      const body = box.querySelector(".kq-body"); let resp = QT.initial(q), done = false;
      const draw = () => {
        body.innerHTML = `${QT.prompt(q).replace("<h2>",'<div class="kc-q">').replace("</h2>","</div>")}<div class="kq-a">${QT.body(q, resp, done)}</div>
          ${done?`<div class="kc-why"><b>${QT.grade(q,resp)?"Correct.":"Not quite."}</b> ${q.why||""}</div><button class="btn sm ghost kq-again">Try again</button>`:`<button class="btn sm kq-check" ${QT.answered(q,resp)?"":"disabled"}>Check</button>`}`;
        if (!done) QT.wire(body.querySelector(".kq-a"), q, ()=>resp, (v, soft)=>{ resp=v; if (QT.type(q)==="mcq"){ done=true; return draw(); } if (soft){ body.querySelector(".kq-check").disabled = !QT.answered(q,resp); return; } draw(); });
        const c = body.querySelector(".kq-check"); if (c) c.onclick = () => { done = true; draw(); };
        const ag = body.querySelector(".kq-again"); if (ag) ag.onclick = () => { done = false; resp = QT.initial(q); draw(); };
      };
      draw();
    });
    root.querySelectorAll(".bench").forEach(box=>{
      const cfg = benches[box.dataset.bench]; if (!cfg || !window.Bench) return;
      const body = box.querySelector(".bn-body");
      Bench.mount(body, cfg, cfg.tasks||[], () => { if (cfg.id && window.LLBenchWin) LLBenchWin(cfg.id); });
      box.querySelector(".bn-reset").onclick = () => body.reset();
    });
    root.querySelectorAll(".mt[data-mt]").forEach(box=>{
      const id = box.dataset.mt, cfg = terms[id]; if (!cfg || !window.SIM) return;
      const mk = SIM[cfg.env+"Env"]; if (!mk) return;
      if (!live[id]){ const env = mk(fresh(cfg.opts)); if (cfg.setup) cfg.setup(env); live[id] = {env, lines:[{t:env.motd||"", cls:""}]}; }
      const body = box.querySelector(".mt-body");
      const draw = () => {
        const L = live[id], env = L.env, tasks = cfg.tasks||[];
        const done = tasks.filter(t=>{ try{ return t.done(env); }catch(e){ return false; } });
        body.innerHTML = `${cfg.env==="ios2"?`<p class="small muted" style="margin:0 0 6px">Lab note: interface names are shortened to Gi0/x. Real kit numbers them by slot: a Catalyst 9200 uses Gi1/0/1, an ISR 1000/4000 router uses Gi0/0/0 — the commands are identical.</p>`:""}${tasks.length?`<div class="mt-tasks">${tasks.map(t=>{ let ok=false; try{ ok=t.done(env); }catch(e){} return `<div class="mt-task ${ok?"ok":""}"><span class="check ${ok?"done":""}">✓</span><span>${t.text}</span></div>`; }).join("")}</div>`:""}
          ${tasks.length && done.length===tasks.length?`<div class="callout"><b>Nice — every task done.</b> ${cfg.win||"You just did the real thing."}</div>`:""}
          <div class="term mt-term">${L.lines.map(l=>`<div class="ln ${l.cls}">${esc(l.t)}</div>`).join("")}</div>
          <div class="termbar"><input autocomplete="off" spellcheck="false" placeholder="${esc(env.prompt())}" aria-label="command"><button class="btn">Run</button><button class="btn ghost sm mt-reset" title="Start this terminal again">Reset</button></div>
          ${cfg.solve && cfg.solve.length ? (L.showSol ? `<div class="kbox"><div class="kbox-h">Worked solution</div><ol class="small sol-list">${cfg.solve.map((c,k)=>`<li class="${L.play&&k<L.play.i?"done":""}${L.play&&k===L.play.i-1?" cur":""}"><code>${esc(c===""?"(press Enter)":c)}</code></li>`).join("")}</ol><div class="btnrow">${L.play?`<button class="btn sm mt-solstop">Stop</button>`:`<button class="btn sm mt-solplay">Type it for me, step by step</button>`}<button class="btn sm ghost mt-solhide">Hide</button></div><p class="small muted">It types each command so you can watch the output; then press Reset and do it yourself.</p></div>` : `<button class="btn sm ghost mt-solshow">Stuck? Show the solution</button>`) : ""}`;
        const term = body.querySelector(".mt-term"); term.scrollTop = term.scrollHeight;
        const input = body.querySelector("input");
        const run = () => { const cmd = input.value; if (!cmd.trim() && !env.pending && !env.connect) return;
          K.termEcho(L.lines, env, cmd, env.prompt());
          const out = env.exec(cmd);
          if (out && out.logout) L.lines.push({t:"\n"+(env.host||"")+" con0 is now available\n\nPress RETURN to get started.", cls:""});
          else K.termOut(L.lines, out);
          if (L.lines.length>200) L.lines = L.lines.slice(-200);
          draw(); const ni = body.querySelector("input"); if (ni) ni.focus(); };
        input.onkeydown = e => { if (e.key==="Enter") run();
          else if (e.key==="Tab" && env.complete && !env.pending){ e.preventDefault(); input.value = env.complete(input.value); }
          else if (e.key==="ArrowUp" && env.history.length){ input.value = env.history[env.history.length-1]; e.preventDefault(); } };
        body.querySelector(".btn").onclick = run;
        const q = s => body.querySelector(s);
        if (q(".mt-solshow")) q(".mt-solshow").onclick = () => { L.showSol = true; draw(); };
        if (q(".mt-solhide")) q(".mt-solhide").onclick = () => { if (L.play) clearInterval(L.play.t); L.play = null; L.showSol = false; draw(); };
        if (q(".mt-solstop")) q(".mt-solstop").onclick = () => { clearInterval(L.play.t); L.play = null; draw(); };
        if (q(".mt-solplay")) q(".mt-solplay").onclick = () => {
          const env2 = mk(fresh(cfg.opts)); if (cfg.setup) cfg.setup(env2);
          const L2 = live[id] = {env:env2, lines:[{t:env2.motd||"", cls:""}], showSol:true, play:{i:0}};
          L2.play.t = setInterval(() => {
            if (!box.isConnected || live[id]!==L2){ clearInterval(L2.play.t); return; }
            if (L2.play.i >= cfg.solve.length){ clearInterval(L2.play.t); L2.play = null; draw(); return; }
            const c = cfg.solve[L2.play.i++]; K.termEcho(L2.lines, env2, c, env2.prompt()); const out = env2.exec(c);
            if (out && out.logout) L2.lines.push({t:"\n"+(env2.host||"")+" con0 is now available\n\nPress RETURN to get started.", cls:""}); else K.termOut(L2.lines, out);
            draw();
          }, 900);
          draw();
        };
        body.querySelector(".mt-reset").onclick = () => { if (live[id] && live[id].play) clearInterval(live[id].play.t); delete live[id]; const env2 = mk(fresh(cfg.opts)); if (cfg.setup) cfg.setup(env2); live[id] = {env:env2, lines:[{t:env2.motd||"", cls:""}]}; draw(); };
      };
      draw();
    });
  },
};
window.K = K;
})();
