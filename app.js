/* Ladder Lab — app shell, router, progress engine */
(function(){
const $ = sel => document.querySelector(sel);
const main = $("#main");
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ---------- progress ---------- */
const DEFAULT_P = { points:0, name:"Isire Akpevwe Daniel", lessonsDone:{}, quizBest:{}, labsDone:{}, codelabsDone:{}, ticketsDone:{}, mocks:0, cardsReviewed:0, drills:0, exams:0, examBest:0, srs:{}, days:[], badges:{}, certs:{} };
let LLTIMERS = [];
function clearLLTimers(){ LLTIMERS.forEach(t=>clearInterval(t)); LLTIMERS=[]; }
window.clearLLTimers = clearLLTimers;
let P = loadP();
function loadP(){
  try{ const raw = localStorage.getItem("ladderlab-v1"); if (raw) return Object.assign({}, DEFAULT_P, JSON.parse(raw)); }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_P));
}
function saveP(){ try{ localStorage.setItem("ladderlab-v1", JSON.stringify(P)); }catch(e){} }
function today(){ return new Date().toISOString().slice(0,10); }
function touchDay(){ const d=today(); if(!P.days.includes(d)){ P.days.push(d); P.days=P.days.slice(-400); } }
function streak(){
  let n=0; const d=new Date();
  for(;;){ const s=d.toISOString().slice(0,10); if(P.days.includes(s)){n++; d.setDate(d.getDate()-1);} else break; }
  return n;
}
function rank(){ let r=LL.ranks[0]; for(const x of LL.ranks) if(P.points>=x.points) r=x; return r; }
function nextRank(){ return LL.ranks.find(x=>x.points>P.points); }
function award(id){ if(!P.badges[id]){ P.badges[id]=today(); toast("Badge earned: "+LL.badges.find(b=>b.id===id).name); } }
function addPoints(n, why){
  P.points+=n; touchDay(); checkBadges(); saveP(); statline(); toast("+"+n+" pts · "+why);
}
function checkBadges(){
  if (Object.keys(P.lessonsDone).some(t=>Object.keys(P.lessonsDone[t]).length)) award("first-lesson");
  if (Object.values(P.quizBest).some(s=>s>=70)) award("first-quiz");
  if (Object.keys(P.labsDone).length) award("first-lab");
  if (Object.keys(P.ticketsDone).length>=5) award("five-tickets");
  if (P.mocks>=5) award("mock-5");
  if (streak()>=7) award("streak-7");
  if (Object.keys(P.certs).length) award("track-done");
  if (P.cardsReviewed>=100) award("cards-100");
}
let toastT;
function toast(msg){
  let el = $("#toast");
  if(!el){ el=document.createElement("div"); el.id="toast";
    el.style.cssText="position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--accent);color:var(--accent-ink);padding:9px 16px;border-radius:999px;font-family:var(--display);font-weight:600;font-size:.85rem;z-index:99;box-shadow:0 4px 18px rgba(0,0,0,.35)";
    document.body.appendChild(el); }
  el.textContent=msg; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>el.hidden=true, 2600);
}

/* ---------- track completion ---------- */
function trackProgress(t){
  const L = Object.keys(P.lessonsDone[t.id]||{}).length;
  const total = t.lessons.length + (t.quiz.length?1:0) + t.labs.length + t.codelabs.length;
  let done = L;
  if (t.quiz.length && (P.quizBest[t.id]||0)>=70) done++;
  done += t.labs.filter(id=>P.labsDone[id]).length;
  done += t.codelabs.filter(c=>P.codelabsDone[c.id]).length;
  return { done, total, pct: total? Math.round(done/total*100):0 };
}
function trackComplete(t){ const p=trackProgress(t); return p.total>0 && p.done>=p.total; }

/* ---------- shell ---------- */
const TABS = [["home","Dashboard"],["tracks","Courses"],["labs","Labs"],["tickets","Tickets"],["interview","Interview"],["career","Career"],["cards","Flashcards"],["settings","Settings"]];
let route = {view:"home"};
function go(view, params){ route = Object.assign({view}, params||{}); render(); window.scrollTo(0,0); try{ location.hash = view; }catch(e){} }
window.GO = go;

function statline(){
  const r = rank(), nx = nextRank();
  $("#statline").innerHTML =
    `<span class="pill"><span class="dot">◆</span> <span class="num">${P.points}</span> pts</span>`+
    `<span class="pill">${esc(r.title)}</span>`+
    `<span class="pill">🔥 <span class="num">${streak()}</span>-day</span>`;
}

function tabs(){
  $("#tabs").innerHTML = TABS.map(([id,label])=>`<button class="${route.view===id||route.group===id?"on":""}" onclick="GO('${id}')">${label}</button>`).join("");
}

function render(){ clearLLTimers(); tabs(); statline();
  const v = route.view;
  if (v==="home") return home();
  if (v==="tracks") return tracksView();
  if (v==="track") return trackView(route.id);
  if (v==="lesson") return lessonView(route.id, route.i);
  if (v==="quiz") return quizView(route.id);
  if (v==="cards") return cardsHome(route.id);
  if (v==="cardsession") return cardSession(route.id);
  if (v==="labs") return labsView();
  if (v==="lab") return labView(route.id);
  if (v==="play") return playView(route.env);
  if (v==="drill") return drillView();
  if (v==="exam") return examView();
  if (v==="career") return careerView();
  if (v==="codelab") return codelabView(route.tid, route.cid);
  if (v==="tickets") return ticketsView();
  if (v==="ticket") return ticketView(route.id);
  if (v==="interview") return interviewView();
  if (v==="mock") return mockView();
  if (v==="settings") return settingsView();
  if (v==="cert") return certView(route.id);
  home();
}

/* ---------- dashboard ---------- */
function home(){
  route.group="home";
  const r = rank(), nx = nextRank();
  const pctToNext = nx ? Math.min(100, Math.round((P.points - r.points)/(nx.points - r.points)*100)) : 100;
  // continue suggestion: first incomplete track in order
  const next = LL.tracks.find(t=>!trackComplete(t));
  let cont = "";
  if (next){
    const p = trackProgress(next);
    const li = next.lessons.findIndex((_,i)=>!(P.lessonsDone[next.id]||{})[i]);
    cont = `<div class="card">
      <div class="eyebrow">Continue where you left off</div>
      <h3>${esc(next.title)} <span class="tag acc">${esc(next.tag)}</span></h3>
      <div class="bar" style="margin:8px 0"><i style="width:${p.pct}%"></i></div>
      <div class="small muted">${p.done}/${p.total} items · ${p.pct}%</div>
      <div class="btnrow">
        ${li>-1?`<button class="btn" onclick="GO('lesson',{id:'${next.id}',i:${li}})">Resume: ${esc(next.lessons[li].t)}</button>`:""}
        <button class="btn ghost" onclick="GO('track',{id:'${next.id}'})">Open course</button>
      </div></div>`;
  }
  const ticketsLeft = LL.tickets.filter(t=>!P.ticketsDone[t.id]).length;
  const due = dueCards().length;
  main.innerHTML = `
  <div class="card">
    <div class="eyebrow">Current rank</div>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div><div class="bignum">${esc(r.title)}</div><div class="muted small num">${P.points} points${nx?` · ${nx.points-P.points} to ${esc(nx.title)}`:" · top of the ladder"}</div></div>
    </div>
    <div class="bar" style="margin-top:10px"><i style="width:${pctToNext}%"></i></div>
    <div class="eyebrow" style="margin-top:16px">Career progression</div>
    <div class="rankstrip">${LL.ranks.map(x=>`
      <div class="rk ${P.points>=x.points?"got":""}">
        <div class="medal">${P.points>=x.points?"✓":""}</div>
        <div class="nm">${esc(x.title)}</div><div class="pt num">${x.points}</div>
      </div>`).join("")}</div>
  </div>
  ${cont}
  <div class="grid3">
    <div class="card"><div class="eyebrow">Hands-on today</div>
      <p class="small">${due} flashcards due · ${ticketsLeft} tickets open</p>
      <div class="btnrow">
        ${due?`<button class="btn sm" onclick="GO('cardsession')">Review cards</button>`:""}
        <button class="btn sm ghost" onclick="GO('labs')">Open a lab</button>
      </div></div>
    <div class="card"><div class="eyebrow">Streak</div>
      <div class="bignum num">${streak()}<span style="font-size:1rem"> days</span></div>
      <p class="small muted">Practised ${P.days.length} day(s) total. Daily minimum: 1 lesson or 1 lab or 1 card session.</p></div>
    <div class="card"><div class="eyebrow">Badges</div>
      <p class="small">${LL.badges.map(b=>`<span class="tag ${P.badges[b.id]?"ok":""}" title="${esc(b.desc)}">${esc(b.name)}</span>`).join(" ")}</p></div>
  </div>
  <div class="card">
    <div class="eyebrow">Your path (from the Infrastructure Ladder)</div>
    ${LL.phases.map(ph=>{
      const ts = LL.tracks.filter(t=>t.phase===ph.id);
      return `<h3 style="margin-top:10px">${esc(ph.name)}</h3><p class="small muted" style="margin-top:-4px">${esc(ph.note)}</p>`+
      ts.map(t=>{ const p=trackProgress(t); return `
        <div class="listrow">
          <span class="check ${trackComplete(t)?"done":""}">✓</span>
          <div class="grow"><b>${esc(t.title)}</b> <span class="tag">${esc(t.tag)}</span><div class="bar" style="margin-top:5px;max-width:340px"><i style="width:${p.pct}%"></i></div></div>
          <button class="btn sm ghost" onclick="GO('track',{id:'${t.id}'})">Open</button>
        </div>`; }).join("");
    }).join("")}
  </div>`;
}

/* ---------- courses ---------- */
function tracksView(){
  route.group="tracks";
  main.innerHTML = `<h1>Courses</h1><p class="muted small">In career order. Each course: in-depth lessons → quiz → flashcards → hands-on labs. Finish everything to earn its certificate.</p>
  <div class="card"><h2>Exam simulator</h2>
    <p class="small muted">20 mixed questions under a 25-minute countdown, exam conditions: no feedback until the end. Best: <span class="num">${P.examBest||0}%</span> · sat: <span class="num">${P.exams||0}</span></p>
    <div class="btnrow">
      <select id="examtrack" class="txt" style="max-width:260px"><option value="">All courses (mixed)</option>${LL.tracks.filter(t=>t.quiz.length>=8).map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join("")}</select>
      <button class="btn" id="startexam">Start exam</button>
    </div></div>` +
  LL.phases.map(ph=>{
    const ts = LL.tracks.filter(t=>t.phase===ph.id);
    return `<h2 style="margin-top:18px">${esc(ph.name)}</h2><div class="grid2">`+ts.map(t=>{
      const p = trackProgress(t);
      return `<div class="card">
        <h3>${esc(t.title)} ${trackComplete(t)?'<span class="tag ok">CERTIFIED</span>':""}</h3>
        <div class="small muted">${esc(t.tag)} · ~${esc(t.hours)}</div>
        <p class="small">${esc(t.blurb)}</p>
        <div class="bar"><i style="width:${p.pct}%"></i></div>
        <div class="small muted" style="margin-top:4px">${t.lessons.length} lessons · ${t.quiz.length} quiz Qs · ${t.cards.length} cards · ${t.labs.length+t.codelabs.length} labs</div>
        <div class="btnrow"><button class="btn" onclick="GO('track',{id:'${t.id}'})">Open</button></div>
      </div>`;
    }).join("")+`</div>`;
  }).join("");
  const se=$("#startexam"); if(se) se.onclick=()=>{ EXAM=null; go("exam",{track:$("#examtrack").value}); };
}

function trackView(id){
  route.group="tracks";
  const t = LL.tracks.find(x=>x.id===id); if(!t) return go("tracks");
  const p = trackProgress(t);
  const quizDone = (P.quizBest[id]||0)>=70;
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('tracks');return false">Courses</a> / ${esc(t.title)}</div>
  <div class="card">
    <h1>${esc(t.title)} <span class="tag acc">${esc(t.tag)}</span></h1>
    <p class="small">${esc(t.blurb)}</p>
    <div class="bar"><i style="width:${p.pct}%"></i></div>
    <div class="small muted" style="margin-top:4px">${p.done}/${p.total} complete</div>
    ${trackComplete(t)?`<div class="btnrow"><button class="btn" onclick="GO('cert',{id:'${t.id}'})">View certificate</button></div>`:""}
  </div>
  <div class="card"><h2>Lessons</h2>
    ${t.lessons.map((l,i)=>`<div class="listrow">
      <span class="check ${(P.lessonsDone[id]||{})[i]?"done":""}">✓</span>
      <div class="grow">${i+1}. ${esc(l.t)}</div>
      <button class="btn sm ghost" onclick="GO('lesson',{id:'${id}',i:${i}})">${(P.lessonsDone[id]||{})[i]?"Review":"Study"}</button>
    </div>`).join("")}
  </div>
  <div class="grid2">
    ${t.quiz.length?`<div class="card"><h2>Quiz ${quizDone?'<span class="tag ok">PASSED</span>':""}</h2>
      <p class="small muted">${t.quiz.length} questions · pass at 70% · best: ${P.quizBest[id]!=null? P.quizBest[id]+"%":"—"}</p>
      <button class="btn" onclick="GO('quiz',{id:'${id}'})">${quizDone?"Retake":"Start quiz"}</button></div>`:""}
    ${t.drill?`<div class="card"><h2>Subnetting drills</h2>
      <p class="small muted">Endless generated questions, checked instantly. Sets completed: <span class="num">${P.drills||0}</span></p>
      <button class="btn" onclick="GO('drill')">Start drilling</button></div>`:""}
    ${t.cards.length?`<div class="card"><h2>Flashcards</h2>
      <p class="small muted">${t.cards.length} cards with spaced repetition.</p>
      <button class="btn" onclick="GO('cardsession',{id:'${id}'})">Review this deck</button></div>`:""}
  </div>
  ${(t.labs.length||t.codelabs.length)?`<div class="card"><h2>Hands-on</h2>
    ${t.labs.map(lid=>{const lab=LL.labs[lid]; return `<div class="listrow">
      <span class="check ${P.labsDone[lid]?"done":""}">✓</span>
      <div class="grow"><b>${esc(lab.title)}</b> <span class="tag">${lab.env.toUpperCase()} TERMINAL</span></div>
      <button class="btn sm" onclick="GO('lab',{id:'${lid}'})">Launch</button></div>`;}).join("")}
    ${t.codelabs.map(c=>`<div class="listrow">
      <span class="check ${P.codelabsDone[c.id]?"done":""}">✓</span>
      <div class="grow"><b>${esc(c.t)}</b> <span class="tag">CODE LAB</span></div>
      <button class="btn sm" onclick="GO('codelab',{tid:'${id}',cid:'${c.id}'})">Open</button></div>`).join("")}
  </div>`:""}
  ${t.videos && t.videos.length ? `<div class="card"><h2>Watch & practise elsewhere</h2>
    <p class="small muted">Curated free resources that pair with this track (open in a new tab):</p>
    <ul class="small">${t.videos.map(v=>`<li><a href="${esc(v.u)}" target="_blank" rel="noopener">${esc(v.t)}</a></li>`).join("")}</ul>
  </div>`:""}`;
}

function lessonView(id,i){
  route.group="tracks";
  const t = LL.tracks.find(x=>x.id===id); if(!t) return go("tracks");
  const l = t.lessons[i]; if(!l) return go("track",{id});
  const done = (P.lessonsDone[id]||{})[i];
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('tracks');return false">Courses</a> / <a href="#" onclick="GO('track',{id:'${id}'});return false">${esc(t.title)}</a> / Lesson ${i+1}</div>
  <div class="card">
    <div class="eyebrow">${esc(t.title)} · lesson ${i+1} of ${t.lessons.length}</div>
    <h1>${esc(l.t)}</h1>
    <div class="lesson-body">${l.html}</div>
    <hr>
    <div class="btnrow">
      ${i>0?`<button class="btn ghost" onclick="GO('lesson',{id:'${id}',i:${i-1}})">← Previous</button>`:""}
      ${done?`<span class="tag ok" style="align-self:center">COMPLETED</span>`:`<button class="btn" id="donebtn">Mark complete (+${LL.points.lesson} pts)</button>`}
      ${i<t.lessons.length-1?`<button class="btn ghost" onclick="GO('lesson',{id:'${id}',i:${i+1}})">Next →</button>`:`<button class="btn ghost" onclick="GO('track',{id:'${id}'})">Back to course</button>`}
    </div>
  </div>`;
  const b = $("#donebtn");
  if (b) b.onclick = ()=>{ P.lessonsDone[id]=P.lessonsDone[id]||{}; P.lessonsDone[id][i]=true; addPoints(LL.points.lesson,"lesson complete"); render(); };
}

/* ---------- quiz ---------- */
let QZ=null;
function quizView(id){
  route.group="tracks";
  const t = LL.tracks.find(x=>x.id===id); if(!t) return go("tracks");
  if (!QZ || QZ.id!==id){ QZ = {id, i:0, score:0, answered:false}; }
  const q = t.quiz[QZ.i];
  if (!q){ // finished
    const pct = Math.round(QZ.score/t.quiz.length*100);
    const best = P.quizBest[id]||0;
    const passed = pct>=70;
    if (pct>best) P.quizBest[id]=pct;
    if (passed && best<70) addPoints(LL.points.quiz,"quiz passed"); else { touchDay(); saveP(); }
    const res = QZ; QZ=null;
    main.innerHTML = `<div class="card" style="text-align:center">
      <div class="eyebrow">${esc(t.title)} quiz</div>
      <div class="bignum num">${pct}%</div>
      <p>${res.score}/${t.quiz.length} correct — ${passed?"<b>passed</b> ✔":"below the 70% pass mark"}</p>
      <p class="small muted">${passed?"Wrong answers are the syllabus for your next review — check the related flashcards.":"Re-read the lessons the misses came from, then retake. The review matters more than the attempt."}</p>
      <div class="btnrow" style="justify-content:center">
        <button class="btn" onclick="GO('quiz',{id:'${id}'})">Retake</button>
        <button class="btn ghost" onclick="GO('track',{id:'${id}'})">Back to course</button>
      </div></div>`;
    statline();
    return;
  }
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('track',{id:'${id}'});return false">${esc(t.title)}</a> / Quiz</div>
  <div class="card">
    <div class="eyebrow">Question ${QZ.i+1} of ${t.quiz.length} · score ${QZ.score}</div>
    <h2>${esc(q.q)}</h2>
    <div id="opts">${q.o.map((o,oi)=>`<button class="opt" data-i="${oi}">${esc(o)}</button>`).join("")}</div>
    <div id="why" hidden class="callout"></div>
    <div class="btnrow"><button class="btn" id="nextq" hidden>Next</button></div>
  </div>`;
  document.querySelectorAll(".opt").forEach(btn=>{
    btn.onclick = ()=>{
      if (QZ.answered) return; QZ.answered=true;
      const pick = +btn.dataset.i;
      document.querySelectorAll(".opt").forEach((b,bi)=>{
        b.disabled=true;
        if (bi===q.a) b.classList.add("right");
        else if (bi===pick) b.classList.add("wrong");
      });
      if (pick===q.a) QZ.score++;
      const why=$("#why"); why.hidden=false; why.innerHTML = `<b>${pick===q.a?"Correct.":"Not quite."}</b> ${esc(q.why)}`;
      $("#nextq").hidden=false;
    };
  });
  $("#nextq").onclick = ()=>{ QZ.i++; QZ.answered=false; quizView(id); };
}

/* ---------- exam simulator ---------- */
function examPool(trackId, n){
  let qs = [];
  for (const t of LL.tracks){
    if (trackId && t.id!==trackId) continue;
    t.quiz.forEach(q=>qs.push(Object.assign({track:t.title}, q)));
  }
  return qs.sort(()=>Math.random()-.5).slice(0, n||20);
}
window.examPool = examPool;
let EXAM=null;
function fmtTime(s){ return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function examView(){
  route.group="tracks";
  clearLLTimers();
  if (!EXAM){
    EXAM = { qs: examPool(route.track, 20), i:0, picks:{}, secs: 25*60, done:false, track:route.track };
  }
  if (!EXAM.done){
    const tm = setInterval(()=>{
      if (!EXAM || EXAM.done){ clearInterval(tm); return; }
      EXAM.secs--;
      const el = $("#examclock");
      if (el){ el.textContent = fmtTime(Math.max(0,EXAM.secs)); if (EXAM.secs<=120) el.style.color="var(--bad)"; }
      if (EXAM.secs<=0){ clearInterval(tm); finishExam(); }
    }, 1000);
    LLTIMERS.push(tm);
  }
  function finishExam(){
    EXAM.done = true;
    const qs = EXAM.qs;
    const score = qs.filter((q,i)=>EXAM.picks[i]===q.a).length;
    const pct = Math.round(score/qs.length*100);
    P.exams=(P.exams||0)+1; if (pct>(P.examBest||0)) P.examBest=pct;
    if (pct>=70) addPoints(40,"exam passed "+pct+"%"); else { touchDay(); saveP(); statline(); }
    const misses = qs.map((q,i)=>({q,i})).filter(x=>EXAM.picks[x.i]!==x.q.a);
    main.innerHTML = `<div class="card" style="text-align:center">
      <div class="eyebrow">Exam result${EXAM.secs<=0?" · time expired":""}</div>
      <div class="bignum num">${pct}%</div>
      <p class="num">${score}/${qs.length} correct · ${pct>=70?"<b>PASS</b>":"below the 70% line"} · ${fmtTime(Math.max(0,EXAM.secs))} remaining</p>
    </div>
    ${misses.length?`<div class="card"><h2>Review your ${misses.length} miss${misses.length>1?"es":""}</h2>
      ${misses.map(({q,i})=>`<div class="callout warn" style="margin:.8rem 0">
        <div class="small muted">${esc(q.track)}</div>
        <b>${esc(q.q)}</b><br>
        <span class="small" style="color:var(--bad)">Your answer: ${EXAM.picks[i]!=null?esc(q.o[EXAM.picks[i]]):"(unanswered)"}</span><br>
        <span class="small" style="color:var(--ok)">Correct: ${esc(q.o[q.a])}</span>
        <div class="small" style="margin-top:4px">${esc(q.why)}</div></div>`).join("")}
      <p class="small muted">The misses ARE the syllabus — hit the matching flashcard decks before retaking.</p></div>`
      :`<div class="card"><h2>Clean sheet.</h2><p class="small muted">Full marks under the clock — that's interview-day form.</p></div>`}
    <div class="btnrow"><button class="btn" onclick="(function(){EXAM=null;GO('exam',{track:'${EXAM.track||""}'})})()">Retake</button>
    <button class="btn ghost" onclick="GO('tracks')">Back to courses</button></div>`;
    const ex=EXAM; EXAM={done:true, qs:ex.qs, picks:ex.picks, secs:ex.secs, track:ex.track};
  }
  window.__finishExam = finishExam;
  if (EXAM.done) return finishExam();
  const q = EXAM.qs[EXAM.i];
  if (!q) return finishExam();
  const answered = Object.keys(EXAM.picks).length;
  main.innerHTML = `
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div class="eyebrow">Exam · question ${EXAM.i+1}/${EXAM.qs.length} · ${answered} answered</div>
      <div class="pill">⏱ <span class="num" id="examclock">${fmtTime(EXAM.secs)}</span></div>
    </div>
    <div class="small muted">${esc(q.track)}</div>
    <h2>${esc(q.q)}</h2>
    <div>${q.o.map((o,oi)=>`<button class="opt" data-i="${oi}" style="${EXAM.picks[EXAM.i]===oi?"border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--panel2))":""}">${esc(o)}</button>`).join("")}</div>
    <div class="btnrow">
      ${EXAM.i>0?`<button class="btn ghost" id="eprev">← Back</button>`:""}
      ${EXAM.i<EXAM.qs.length-1?`<button class="btn" id="enext">Next →</button>`:""}
      <button class="btn ${EXAM.i===EXAM.qs.length-1?"":"ghost"}" id="esubmit">Submit exam</button>
    </div>
    <p class="small muted">No feedback until the end — flag mentally and move on; the clock is part of the test.</p>
  </div>`;
  document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ EXAM.picks[EXAM.i]=+b.dataset.i; examView(); });
  if ($("#enext")) $("#enext").onclick=()=>{ EXAM.i++; examView(); };
  if ($("#eprev")) $("#eprev").onclick=()=>{ EXAM.i--; examView(); };
  $("#esubmit").onclick=()=>{ finishExam(); };
}

/* ---------- flashcards (Leitner-ish SRS) ---------- */
function allCards(filterId){
  const out=[];
  for (const t of LL.tracks){
    if (filterId && t.id!==filterId) continue;
    t.cards.forEach((c,i)=> out.push({key:t.id+"#"+i, track:t.title, f:c.f, b:c.b}));
  }
  return out;
}
function dueCards(filterId){
  const now = Date.now();
  return allCards(filterId).filter(c=>{ const s=P.srs[c.key]; return s ? s.due<=now : true; });
}
function cardsHome(){
  route.group="cards";
  const due = dueCards().length;
  main.innerHTML = `<h1>Flashcards</h1>
  <p class="muted small">Spaced repetition: cards you miss come back fast, cards you know drift out to weeks. This is the anti-forgetting engine you asked for.</p>
  <div class="card"><h2>${due} card(s) due now</h2>
    <div class="btnrow"><button class="btn" onclick="GO('cardsession')">Review all due</button></div></div>
  <div class="grid2">${LL.tracks.filter(t=>t.cards.length).map(t=>{
    const d = dueCards(t.id).length;
    return `<div class="card"><h3>${esc(t.title)}</h3><p class="small muted num">${t.cards.length} cards · ${d} due</p>
      <button class="btn sm" onclick="GO('cardsession',{id:'${t.id}'})">Review deck</button></div>`;
  }).join("")}</div>`;
}
let CS=null;
function cardSession(filterId){
  route.group="cards";
  if (!CS || CS.filter!==String(filterId)){
    let pool = dueCards(filterId);
    if (!pool.length) pool = allCards(filterId);
    pool = pool.slice().sort(()=>Math.random()-.5).slice(0,12);
    CS = { filter:String(filterId), pool, i:0, flipped:false, again:0, good:0 };
  }
  const c = CS.pool[CS.i];
  if (!c){
    P.cardsReviewed += CS.pool.length;
    addPoints(LL.points.cardsession, "card session");
    const done=CS; CS=null;
    main.innerHTML = `<div class="card" style="text-align:center"><h2>Session complete</h2>
      <p class="num">${done.pool.length} cards · ${done.good} known · ${done.again} to resurface soon</p>
      <div class="btnrow" style="justify-content:center">
        <button class="btn" onclick="GO('cardsession'${done.filter!=="undefined"?",{id:'"+done.filter+"'}":""})">Another round</button>
        <button class="btn ghost" onclick="GO('cards')">Decks</button></div></div>`;
    return;
  }
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('cards');return false">Flashcards</a> / ${CS.i+1} of ${CS.pool.length}</div>
  <div class="flash" id="flash"><div class="side">${CS.flipped?esc(c.b):"<b>"+esc(c.f)+"</b>"}</div></div>
  <p class="small muted" style="text-align:center">${esc(c.track)} · ${CS.flipped?"How did you do?":"Think it through, then tap the card to flip"}</p>
  <div class="btnrow" style="justify-content:center">
    ${CS.flipped?`
      <button class="btn ghost" id="b-again" style="border-color:var(--bad);color:var(--bad)">Again</button>
      <button class="btn ghost" id="b-good">Good</button>
      <button class="btn" id="b-easy">Easy</button>`:`
      <button class="btn" id="b-flip">Flip</button>`}
  </div>`;
  $("#flash").onclick = flip; if($("#b-flip")) $("#b-flip").onclick=flip;
  function flip(){ if(!CS.flipped){ CS.flipped=true; cardSession(filterId); } }
  function grade(kind){
    const s = P.srs[c.key] || {box:0};
    const DAY=864e5, MIN=6e4;
    if (kind==="again"){ s.box=1; s.due=Date.now()+10*MIN; CS.again++; }
    if (kind==="good"){ s.box=Math.min(5,(s.box||0)+1); s.due=Date.now()+[1,1,3,7,14,30][s.box]*DAY; CS.good++; }
    if (kind==="easy"){ s.box=Math.min(5,(s.box||0)+2); s.due=Date.now()+[1,3,7,14,30,45][s.box]*DAY; CS.good++; }
    P.srs[c.key]=s; saveP();
    CS.i++; CS.flipped=false; cardSession(filterId);
  }
  if ($("#b-again")) $("#b-again").onclick=()=>grade("again");
  if ($("#b-good"))  $("#b-good").onclick=()=>grade("good");
  if ($("#b-easy"))  $("#b-easy").onclick=()=>grade("easy");
}

/* ---------- labs ---------- */
function labsView(){
  route.group="labs";
  const envs = {linux:"Linux terminal", ios:"Cisco IOS console", git:"Git workstation", k8s:"Kubernetes bastion"};
  main.innerHTML = `<h1>Hands-on labs</h1>
  <p class="muted small">Real command practice in a simulated terminal — objectives tick off as your commands and device state prove them. Certificates here are earned by doing, not by guessing options.</p>
  <div class="grid2">${Object.entries(LL.labs).map(([id,lab])=>`
    <div class="card"><h3>${esc(lab.title)} ${P.labsDone[id]?'<span class="tag ok">DONE</span>':""}</h3>
      <div class="small muted">${envs[lab.env]} · ${lab.objectives.length} objectives · +${lab.points} pts</div>
      <p class="small">${esc(lab.scenario)}</p>
      <button class="btn sm" onclick="GO('lab',{id:'${id}'})">Launch</button></div>`).join("")}
  </div>
  <div class="card"><h3>Playground — free practice, no objectives</h3>
    <p class="small muted">Open any environment and just practise. Nothing is graded; state persists until you reset. This is your sandbox for repetition.</p>
    <div class="btnrow">
      <button class="btn sm" onclick="GO('play',{env:'linux'})">Linux VM</button>
      <button class="btn sm" onclick="GO('play',{env:'ios'})">Cisco switch</button>
      <button class="btn sm" onclick="GO('play',{env:'git'})">Git workstation</button>
      <button class="btn sm" onclick="GO('play',{env:'k8s'})">K8s bastion</button>
      <button class="btn sm ghost" onclick="GO('drill')">Subnetting drills</button>
    </div></div>
  <div class="card"><h3>Code labs</h3><p class="small muted">Write real Python / Dockerfile / Terraform / CI YAML and get it checked:</p>
    ${LL.tracks.flatMap(t=>t.codelabs.map(c=>`<div class="listrow"><span class="check ${P.codelabsDone[c.id]?"done":""}">✓</span><div class="grow">${esc(c.t)} <span class="tag">${esc(t.title)}</span></div><button class="btn sm ghost" onclick="GO('codelab',{tid:'${t.id}',cid:'${c.id}'})">Open</button></div>`)).join("")}
  </div>`;
}

let LAB=null;
function labView(id){
  route.group="labs";
  const lab = LL.labs[id]; if(!lab) return go("labs");
  if (!LAB || LAB.id!==id){
    const env = SIM[lab.env+"Env"]();
    if (lab.setup) lab.setup(env);
    LAB = { id, env, lines:[{t:env.motd,cls:""}] , completedShown:false };
  }
  const env = LAB.env;
  const objHtml = lab.objectives.map((o,i)=>{
    const ok = o.done(env);
    return `<div class="listrow"><span class="check ${ok?"done":""}">✓</span><div class="grow small">${o.text}</div></div>`;
  }).join("");
  const allDone = lab.objectives.every(o=>o.done(env));
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('labs');return false">Labs</a> / ${esc(lab.title)}</div>
  <div class="card">
    <h2>${esc(lab.title)} ${P.labsDone[id]?'<span class="tag ok">DONE</span>':""}</h2>
    <p class="small muted">${esc(lab.scenario)}</p>
    <div class="grid2" style="grid-template-columns:1.4fr 1fr">
      <div>
        <div class="term" id="term">${LAB.lines.map(l=>`<div class="ln ${l.cls}">${esc(l.t)}</div>`).join("")}</div>
        <div class="termbar">
          <input id="cmd" autocomplete="off" spellcheck="false" placeholder="${esc(env.prompt())}">
          <button class="btn" id="run">Run</button>
        </div>
        <p class="small muted" style="margin-top:6px">Tip: '?' or 'help' shows this box's commands · ↑ recalls your last command.</p>
      </div>
      <div>
        <div class="eyebrow">Objectives</div>
        ${objHtml}
        ${allDone?`<div class="callout"><b>All objectives met.</b> ${P.labsDone[id]?"Already credited.":`<button class="btn sm" id="claim">Collect +${lab.points} pts</button>`}</div>`:""}
        <div class="btnrow"><button class="btn sm ghost" id="resetlab">Reset lab</button></div>
      </div>
    </div>
  </div>`;
  const termEl = $("#term"); termEl.scrollTop = termEl.scrollHeight;
  const input = $("#cmd"); input.focus();
  let lastCmd = LAB.lines.filter(l=>l.cls==="in").slice(-1)[0];
  input.onkeydown = (e)=>{
    if (e.key==="Enter") run();
    if (e.key==="ArrowUp" && env.history.length){ input.value = env.history[env.history.length-1]; }
  };
  $("#run").onclick = run;
  function run(){
    const cmd = input.value; if(!cmd.trim()) return;
    LAB.lines.push({t: env.prompt()+cmd, cls:"in"});
    const out = env.exec(cmd);
    if (out && out.clear) LAB.lines = [];
    else if (out) LAB.lines.push({t: out, cls:""});
    if (LAB.lines.length>300) LAB.lines = LAB.lines.slice(-300);
    input.value="";
    labView(id);
  }
  if ($("#claim")) $("#claim").onclick = ()=>{ P.labsDone[id]=true; addPoints(lab.points,"lab complete"); labView(id); };
  $("#resetlab").onclick = ()=>{ LAB=null; labView(id); };
}

/* ---------- playground (free practice) ---------- */
const PG = {};
function playView(envName){
  route.group="labs";
  if (!SIM[envName+"Env"]) return go("labs");
  if (!PG[envName]){ const env = SIM[envName+"Env"](); PG[envName] = { env, lines:[{t:env.motd,cls:""}] }; }
  const pg = PG[envName], env = pg.env;
  const names = {linux:"Linux VM", ios:"Cisco switch", git:"Git workstation", k8s:"Kubernetes bastion"};
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('labs');return false">Labs</a> / Playground</div>
  <div class="card">
    <h2>Playground · ${names[envName]||envName}</h2>
    <p class="small muted">Free practice — nothing graded, state persists until reset. '?' or 'help' lists this box's commands.</p>
    <div class="term" id="term">${pg.lines.map(l=>`<div class="ln ${l.cls}">${esc(l.t)}</div>`).join("")}</div>
    <div class="termbar">
      <input id="cmd" autocomplete="off" spellcheck="false" placeholder="${esc(env.prompt())}">
      <button class="btn" id="run">Run</button>
    </div>
    <div class="btnrow">
      ${Object.keys(names).map(e=>`<button class="btn sm ghost ${e===envName?"":""}" onclick="GO('play',{env:'${e}'})" ${e===envName?"disabled":""}>${names[e]}</button>`).join("")}
      <button class="btn sm ghost" id="resetpg">Reset this box</button>
    </div>
  </div>`;
  const termEl=$("#term"); termEl.scrollTop=termEl.scrollHeight;
  const input=$("#cmd"); input.focus();
  input.onkeydown=(e)=>{ if(e.key==="Enter") run(); if(e.key==="ArrowUp"&&env.history.length){ input.value=env.history[env.history.length-1]; } };
  $("#run").onclick=run;
  function run(){
    const cmd=input.value; if(!cmd.trim()) return;
    pg.lines.push({t:env.prompt()+cmd, cls:"in"});
    const out=env.exec(cmd);
    if (out && out.clear) pg.lines=[]; else if (out) pg.lines.push({t:out,cls:""});
    if (pg.lines.length>300) pg.lines=pg.lines.slice(-300);
    input.value=""; touchDay(); saveP(); playView(envName);
  }
  $("#resetpg").onclick=()=>{ delete PG[envName]; playView(envName); };
}

/* ---------- code labs ---------- */
function codelabView(tid,cid){
  route.group="labs";
  const t = LL.tracks.find(x=>x.id===tid); if(!t) return go("labs");
  const c = t.codelabs.find(x=>x.id===cid); if(!c) return go("labs");
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('track',{id:'${tid}'});return false">${esc(t.title)}</a> / Code lab</div>
  <div class="card">
    <h2>${esc(c.t)} ${P.codelabsDone[cid]?'<span class="tag ok">DONE</span>':""}</h2>
    <p class="small">${esc(c.brief)}</p>
    <textarea class="codebox" id="code" spellcheck="false">${esc(c.starter||"")}</textarea>
    <div class="btnrow">
      <button class="btn" id="checkcode">Check my work</button>
      <button class="btn ghost" id="showmodel">Show model solution</button>
    </div>
    <div id="feedback"></div>
    <div id="model" hidden><hr><div class="eyebrow">Model solution</div><pre><code>${esc(c.model)}</code></pre></div>
  </div>`;
  $("#checkcode").onclick = ()=>{
    const code = $("#code").value;
    const results = c.checks.map(ch=>({ok:new RegExp(ch.re,"im").test(code), hint:ch.hint}));
    const passed = results.filter(r=>r.ok).length;
    const all = passed===results.length;
    $("#feedback").innerHTML = `<div class="callout ${all?"":"warn"}" style="margin-top:10px">
      <b>${passed}/${results.length} checks passed.</b>
      ${results.filter(r=>!r.ok).map(r=>`<div class="small">✗ ${esc(r.hint)}</div>`).join("")}
      ${all && !P.codelabsDone[cid] ? `<div style="margin-top:6px"><button class="btn sm" id="claimcl">Collect +${LL.points.codelab} pts</button></div>`:""}
      ${all?`<div class="small" style="margin-top:4px">All checks green — compare with the model for style.</div>`:""}
    </div>`;
    const cb=$("#claimcl"); if(cb) cb.onclick=()=>{ P.codelabsDone[cid]=true; addPoints(LL.points.codelab,"code lab"); codelabView(tid,cid); };
  };
  $("#showmodel").onclick = ()=>{ $("#model").hidden=false; };
}

/* ---------- tickets ---------- */
function ticketsView(){
  route.group="tickets";
  main.innerHTML = `<h1>Ticket queue</h1>
  <p class="muted small">Work each ticket like the job: write your approach first, then compare against the model resolution and grade yourself honestly. Rated tickets build the experience interviewers ask about.</p>
  ${LL.tickets.map(tk=>`<div class="card">
    <div class="listrow" style="border:0;padding:0">
      <span class="tag ${tk.sev==="P1"?"warn":""}">${tk.sev}</span>
      <div class="grow"><b>${esc(tk.title)}</b><div class="small muted">${esc(tk.system)} · from ${esc(tk.from)} ${P.ticketsDone[tk.id]?` · <span class="tag ok">RESOLVED (${esc(P.ticketsDone[tk.id])})</span>`:""}</div></div>
      <button class="btn sm" onclick="GO('ticket',{id:'${tk.id}'})">${P.ticketsDone[tk.id]?"Reopen":"Work it"}</button>
    </div></div>`).join("")}`;
}
function ticketView(id){
  route.group="tickets";
  const tk = LL.tickets.find(x=>x.id===id); if(!tk) return go("tickets");
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('tickets');return false">Tickets</a> / ${esc(tk.id)}</div>
  <div class="card">
    <div class="eyebrow">${esc(tk.system)} · ${tk.sev} · from ${esc(tk.from)}</div>
    <h2>${esc(tk.title)}</h2>
    <p>${esc(tk.body)}</p>
    <div class="callout"><b>Answer before revealing:</b><ul>${tk.asks.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></div>
    <div class="eyebrow">Your resolution notes</div>
    <textarea class="txt" id="notes" placeholder="Write your approach as if updating the ticket..."></textarea>
    <div class="btnrow"><button class="btn" id="reveal">Reveal model resolution</button></div>
    <div id="modelres" hidden>
      <hr><div class="eyebrow">Model resolution</div>${tk.model}
      <div class="callout" style="margin-top:10px"><b>Grade yourself honestly:</b>
        <div class="btnrow">
          <button class="btn sm" data-g="solid">Matched it (+${LL.points.ticket})</button>
          <button class="btn sm ghost" data-g="partial">Partly (+${Math.round(LL.points.ticket/2)})</button>
          <button class="btn sm ghost" data-g="missed">Missed it (+5, redo later)</button>
        </div></div>
    </div>
  </div>`;
  $("#reveal").onclick = ()=>{ $("#modelres").hidden=false; };
  document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{
    const g=b.dataset.g;
    const pts = g==="solid"?LL.points.ticket : g==="partial"?Math.round(LL.points.ticket/2):5;
    if (g!=="missed") P.ticketsDone[id]=g;
    addPoints(pts,"ticket "+g);
    go("tickets");
  });
}

/* ---------- interview ---------- */
function interviewView(){
  route.group="interview";
  const topics = Array.from(new Set(LL.interview.map(q=>q.topic)));
  main.innerHTML = `<h1>Interview prep</h1>
  <p class="muted small">Model answers written the way a strong candidate talks — study them, then run mocks: answer out loud before revealing, and grade yourself.</p>
  <div class="card"><h2>Mock session</h2>
    <p class="small muted">5 random questions. Speak your answer aloud (seriously — out loud), then reveal and self-grade.</p>
    <div class="btnrow">
      <select id="mocktopic" class="txt" style="max-width:260px">
        <option value="">All topics</option>${topics.map(t=>`<option>${esc(t)}</option>`).join("")}
      </select>
      <label class="small" style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="mocktimed"> Timed · 90s per answer (interview pressure)</label>
      <button class="btn" id="startmock">Start mock</button>
    </div>
    <p class="small muted num" style="margin-top:6px">Mocks completed: ${P.mocks}</p>
  </div>
  ${topics.map(tp=>`<div class="card"><h2>${esc(tp)}</h2>
    ${LL.interview.filter(q=>q.topic===tp).map((q,qi)=>`
      <details style="margin:.5rem 0"><summary style="cursor:pointer"><b>${esc(q.q)}</b> <span class="tag">${esc(q.level)}</span></summary>
      <div class="callout" style="margin-top:8px">${esc(q.a)}</div></details>`).join("")}
  </div>`).join("")}`;
  $("#startmock").onclick = ()=>{ MOCK=null; go("mock",{topic:$("#mocktopic").value, timed:$("#mocktimed").checked}); };
}
let MOCK=null;
function mockView(){
  route.group="interview";
  clearLLTimers();
  if (!MOCK){
    let pool = LL.interview.filter(q=>!route.topic || q.topic===route.topic);
    pool = pool.slice().sort(()=>Math.random()-.5).slice(0,5);
    MOCK = { pool, i:0, revealed:false, scores:[], timed:!!route.timed, secs:90 };
  }
  const q = MOCK.pool[MOCK.i];
  if (!q){
    P.mocks++; addPoints(LL.points.mock,"mock interview");
    const m=MOCK; MOCK=null;
    const solid=m.scores.filter(s=>s==="solid").length;
    main.innerHTML = `<div class="card" style="text-align:center"><h2>Mock complete</h2>
      <p class="num">${solid}/${m.pool.length} answered at hire level</p>
      <p class="small muted">Re-run weak topics tomorrow — spaced reps work on speech too.</p>
      <div class="btnrow" style="justify-content:center"><button class="btn" onclick="GO('interview')">Back to interview prep</button></div></div>`;
    return;
  }
  if (MOCK.timed && !MOCK.revealed){
    const tm = setInterval(()=>{
      if (!MOCK || MOCK.revealed){ clearInterval(tm); return; }
      MOCK.secs--;
      const el=$("#mockclock"); if (el){ el.textContent = MOCK.secs+"s"; if (MOCK.secs<=15) el.style.color="var(--bad)"; }
      if (MOCK.secs<=0){ clearInterval(tm); MOCK.revealed=true; mockView(); }
    },1000);
    LLTIMERS.push(tm);
  }
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('interview');return false">Interview</a> / Mock · Q${MOCK.i+1} of ${MOCK.pool.length}</div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div class="eyebrow">${esc(q.topic)} · ${esc(q.level)}</div>
      ${MOCK.timed && !MOCK.revealed ? `<div class="pill">⏱ <span class="num" id="mockclock">${MOCK.secs}s</span></div>`:""}
    </div>
    <h2>${esc(q.q)}</h2>
    <p class="small muted">Answer OUT LOUD first. Structure: direct answer → reasoning → example.${MOCK.timed?" The clock auto-reveals — real interviews don't wait either.":""}</p>
    ${MOCK.revealed?`<div class="callout">${esc(q.a)}</div>
      <div class="btnrow">
        <button class="btn sm" data-s="solid">I covered that</button>
        <button class="btn sm ghost" data-s="partial">Partly</button>
        <button class="btn sm ghost" data-s="missed">Missed it</button>
      </div>`:`<div class="btnrow"><button class="btn" id="rev">Reveal model answer</button></div>`}
  </div>`;
  if ($("#rev")) $("#rev").onclick=()=>{ MOCK.revealed=true; mockView(); };
  document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ MOCK.scores.push(b.dataset.s); MOCK.i++; MOCK.revealed=false; MOCK.secs=90; mockView(); });
}

/* ---------- subnetting drill engine ---------- */
const LLDRILL = {
  ipToInt: a => a.split(".").reduce((x,o)=>x*256+ +o, 0),
  intToIp: n => [n>>>24, n>>>16&255, n>>>8&255, n&255].join("."),
  solve(ip, p){
    const size = 2**(32-p);
    const net = Math.floor(LLDRILL.ipToInt(ip)/size)*size;
    const bcast = net + size - 1;
    return { network: LLDRILL.intToIp(net), broadcast: LLDRILL.intToIp(bcast),
             first: LLDRILL.intToIp(net+1), last: LLDRILL.intToIp(bcast-1), hosts: size-2 };
  },
  prefixForHosts(n){ let bits=2; while (2**bits - 2 < n) bits++; return 32-bits; },
  gen(){
    if (Math.random()<0.3){
      const need = [20,30,50,60,100,120,200,250,500,1000,2000][Math.floor(Math.random()*11)];
      return { kind:"hosts", need, answer:{prefix: LLDRILL.prefixForHosts(need)} };
    }
    const p = 22 + Math.floor(Math.random()*9); // /22../30
    const ip = [ [10,172,192,172,10][Math.floor(Math.random()*5)],
                 Math.floor(Math.random()*256), Math.floor(Math.random()*256), 1+Math.floor(Math.random()*253) ].join(".");
    return { kind:"full", ip, p, answer: LLDRILL.solve(ip,p) };
  },
};
window.LLDRILL = LLDRILL;
let DR=null;
function drillView(){
  route.group="labs";
  if (!DR) DR = { q: LLDRILL.gen(), n:0, correct:0, set:5, checked:false };
  const q = DR.q;
  const fields = q.kind==="full"
    ? [["network","Network address"],["broadcast","Broadcast address"],["first","First usable"],["last","Last usable"],["hosts","Usable hosts"]]
    : [["prefix","Smallest prefix (number only, e.g. 26)"]];
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('labs');return false">Labs</a> / Subnetting drills</div>
  <div class="card">
    <div class="eyebrow">Question ${DR.n+1} of ${DR.set} · ${DR.correct} fully correct · sets done: <span class="num">${P.drills||0}</span></div>
    <h2>${q.kind==="full" ? `Work out <span class="mono">${q.ip}/${q.p}</span>` : `A department needs <b class="num">${q.need}</b> usable hosts. Smallest prefix?`}</h2>
    <p class="small muted">${q.kind==="full" ? "Method: host bits → block size → find the block → broadcast = next block − 1." : "2^host-bits − 2 must cover the need."}</p>
    <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      ${fields.map(([k,label])=>`<div><div class="eyebrow">${label}</div><input class="txt mono" id="d-${k}" autocomplete="off" ${DR.checked?"disabled":""}><div class="small" id="r-${k}"></div></div>`).join("")}
    </div>
    <div class="btnrow">
      ${DR.checked
        ? `<button class="btn" id="dnext">${DR.n+1>=DR.set?"Finish set":"Next question"}</button>`
        : `<button class="btn" id="dcheck">Check</button>`}
      <button class="btn ghost" id="dskip">New question</button>
    </div>
    <div id="dexp"></div>
  </div>`;
  fields.forEach(([k])=>{ const el=$("#d-"+k); if (DR.vals && DR.vals[k]!=null) el.value=DR.vals[k]; });
  const first=$("#d-"+fields[0][0]); if(first&&!DR.checked) first.focus();
  if ($("#dcheck")) $("#dcheck").onclick = ()=>{
    DR.vals = {}; let allOk = true;
    for (const [k] of fields){
      const v = ($("#d-"+k).value||"").trim(); DR.vals[k]=v;
      const want = String(q.answer[k]);
      const ok = q.kind==="hosts" ? v.replace("/","")===want : v===want;
      if (!ok) allOk=false;
      $("#r-"+k).innerHTML = ok ? `<span style="color:var(--ok)">✓ correct</span>` : `<span style="color:var(--bad)">✗ ${esc(want)}</span>`;
    }
    DR.checked = true; if (allOk) DR.correct++;
    if (q.kind==="full"){
      const size = 2**(32-q.p);
      $("#dexp").innerHTML = `<div class="callout" style="margin-top:10px">${allOk?"<b>Clean sweep.</b>":"<b>Walkthrough:</b>"} /${q.p} → ${32-q.p} host bits → block size ${size}. ${esc(q.ip)} falls in the block starting ${esc(q.answer.network)}; broadcast = next block − 1 = ${esc(q.answer.broadcast)}; usable ${esc(q.answer.first)}–${esc(q.answer.last)} (${q.answer.hosts} hosts).</div>`;
    } else {
      $("#dexp").innerHTML = `<div class="callout" style="margin-top:10px">${q.need} + network + broadcast needs 2^${32-q.answer.prefix} = ${2**(32-q.answer.prefix)} addresses → /${q.answer.prefix} (${2**(32-q.answer.prefix)-2} usable).</div>`;
    }
    drillViewRestore();
  };
  if ($("#dnext")) $("#dnext").onclick = ()=>{
    DR.n++;
    if (DR.n>=DR.set){
      P.drills=(P.drills||0)+1; addPoints(LL.points.drill||15, `drill set ${DR.correct}/${DR.set}`);
      const res=DR; DR=null;
      main.innerHTML = `<div class="card" style="text-align:center"><h2>Set complete</h2>
        <div class="bignum num">${res.correct}/${res.set}</div>
        <p class="small muted">${res.correct===res.set?"Interview-whiteboard clean. Keep the streak.":"Misses are normal — the walkthroughs you just read ARE the method. Run another set."}</p>
        <div class="btnrow" style="justify-content:center"><button class="btn" onclick="GO('drill')">Another set</button><button class="btn ghost" onclick="GO('labs')">Back to labs</button></div></div>`;
      return;
    }
    DR.q = LLDRILL.gen(); DR.checked=false; DR.vals=null; drillView();
  };
  $("#dskip").onclick = ()=>{ DR.q=LLDRILL.gen(); DR.checked=false; DR.vals=null; drillView(); };
  function drillViewRestore(){ // re-render buttons without wiping entered values
    const keep = DR.vals; drillView(); DR.vals=keep;
  }
}

/* ---------- career ---------- */
function careerView(){
  route.group="career";
  const C = window.CAREER;
  main.innerHTML = `<h1>Career intelligence</h1>
  <p class="muted small">Your Infrastructure Ladder, live inside the platform — the market signal, the order, the projects, and what each stage unlocks.</p>
  <div class="card"><div class="eyebrow">The one finding everything hangs off</div><p>${esc(C.thesis)}</p>
    <div class="grid3">${C.market.map(m=>`<div class="card" style="margin:0"><div class="bignum num">${esc(m.n)}</div><b class="small">${esc(m.l)}</b><div class="small muted">${esc(m.s)}</div></div>`).join("")}</div>
  </div>
  <div class="card"><h2>What's in demand (and why it's specifically yours)</h2>
    <ul class="small">${C.indemand.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    <div class="callout">${esc(C.reframe)}</div></div>
  <div class="card"><h2>Three tracks, running at the same time</h2>
    ${C.tracks.map(t=>`<p><span class="tag acc">${esc(t.k)}</span> ${esc(t.d)}</p>`).join("")}</div>
  <div class="card"><h2>The 12 steps → your courses here</h2>
    ${C.steps.map(s=>`<div class="listrow">
      <span class="tag">${String(s.n).padStart(2,"0")}</span>
      <div class="grow"><b>${esc(s.t)}</b><div class="small muted">${esc(s.note)}</div></div>
      ${s.track?`<button class="btn sm ghost" onclick="GO('track',{id:'${s.track}'})">Open course</button>`:""}
    </div>`).join("")}</div>
  <div class="card"><h2>The seven projects — the actual point</h2>
    <p class="small muted">Certificates pass the screening filter; these get you hired. Two differentiate you:</p>
    ${C.projects.map(p=>`<div class="listrow"><span class="tag ${p.diff?"acc":""}">${p.n}</span><div class="grow"><b>${esc(p.t)}</b>${p.diff?' <span class="tag acc">DIFFERENTIATOR</span>':""}<div class="small muted">${esc(p.d)}</div></div></div>`).join("")}</div>
  <div class="card"><h2>What each stage opens</h2>
    ${C.stages.map(s=>`<p><b class="small">${esc(s.after)}</b><br><span class="small muted">${esc(s.roles)}</span></p>`).join("")}</div>
  <div class="grid2">
    <div class="card"><h2>Who hires in Nigeria</h2><ul class="small">${C.nigeria.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="card"><h2>Certification verdicts</h2>
      <div class="tablewrap"><table><tr><th>Cert</th><th>Verdict</th><th>Why</th></tr>
      ${C.certs.map(c=>`<tr><td>${esc(c.c)}</td><td><b>${esc(c.v)}</b></td><td class="small">${esc(c.n)}</td></tr>`).join("")}</table></div></div>
  </div>
  <div class="card"><h2>Best practices that compound</h2>
    <ul class="small">${C.bestpractices.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    <p class="small muted">Case studies in practice: the AWS "survive the promo" design lab, the ticket queue, and every lab scenario here are the applied versions of this page.</p></div>`;
}

/* ---------- certificate ---------- */
function certView(id){
  route.group="tracks";
  const t = LL.tracks.find(x=>x.id===id); if(!t || !trackComplete(t)) return go("track",{id});
  if (!P.certs[id]){ P.certs[id]=today(); checkBadges(); saveP(); }
  const certId = "LL-"+P.certs[id].replace(/-/g,"")+"-"+id.toUpperCase().slice(0,4);
  main.innerHTML = `
  <div class="crumbs"><a href="#" onclick="GO('track',{id:'${id}'});return false">${esc(t.title)}</a> / Certificate</div>
  <div class="cert">
    <div class="sealbox">&gt;_</div>
    <div class="eyebrow">Certificate of completion · verified by hands-on work</div>
    <p class="small muted" style="margin:6px 0 0">This certifies that</p>
    <div class="cname">${esc(P.name)}</div>
    <p class="small muted" style="margin:0">has completed the full track — lessons, quiz (70%+), and every hands-on lab — for</p>
    <div class="cred">${esc(t.title)}</div>
    <hr>
    <div class="grid3">
      <div><div class="eyebrow">Completed on</div><div class="num">${esc(P.certs[id])}</div></div>
      <div><div class="eyebrow">Certificate ID</div><div class="mono small">${esc(certId)}</div></div>
      <div><div class="eyebrow">Issued by</div><div>Ladder Lab · personal practice record</div></div>
    </div>
  </div>
  <p class="small muted" style="margin-top:10px">These certificates track <i>your</i> verified practice — the public proof employers see is the GitHub projects each track feeds (Ladder Projects 1–7).</p>`;
}

/* ---------- settings ---------- */
function settingsView(){
  route.group="settings";
  main.innerHTML = `<h1>Settings & backup</h1>
  <div class="card"><h2>Certificate name</h2>
    <input class="txt" id="nm" value="${esc(P.name)}" style="max-width:420px">
    <div class="btnrow"><button class="btn sm" id="savenm">Save name</button></div></div>
  <div class="card"><h2>Backup progress</h2>
    <p class="small muted">Progress lives in this browser only. Copy this backup somewhere safe (or to move devices), and paste it below on the other device.</p>
    <div class="btnrow"><button class="btn sm" id="copybk">Copy backup to clipboard</button></div>
    <textarea class="codebox" id="bk" style="min-height:90px" placeholder="...or paste a backup here"></textarea>
    <div class="btnrow"><button class="btn sm ghost" id="restore">Restore from pasted backup</button>
    <button class="btn sm ghost" id="wipe" style="border-color:var(--bad);color:var(--bad)">Reset all progress</button></div>
    <div id="bkmsg" class="small muted"></div></div>
  <div class="card"><h2>About</h2>
    <p class="small">Built from your main plan + the Infrastructure Ladder. Study order: Phase 0 refreshers in parallel with Phase 1 (Linux → Git → AWS → Python), then Phase 2 (Docker → Terraform → CI/CD → K8s → Observability/GitOps). Every course ends in hands-on work because — as the inspiration said — certificates should be earned by doing.</p></div>`;
  $("#savenm").onclick = ()=>{ P.name=$("#nm").value.trim()||P.name; saveP(); toast("Name saved"); };
  $("#copybk").onclick = ()=>{
    const data = JSON.stringify(P);
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(data).then(()=>{ $("#bkmsg").textContent="Copied. Paste it into Settings on the other device."; })
        .catch(()=>{ $("#bk").value=data; $("#bk").select(); $("#bkmsg").textContent="Clipboard blocked — the backup is in the box below; copy it manually."; });
    } else { $("#bk").value=data; $("#bk").select(); $("#bkmsg").textContent="Copy the text from the box below."; }
  };
  $("#restore").onclick = ()=>{
    try{ const obj=JSON.parse($("#bk").value); if(typeof obj.points!=="number") throw 0;
      P = Object.assign({}, DEFAULT_P, obj); saveP(); toast("Progress restored"); render();
    }catch(e){ $("#bkmsg").textContent="That didn't parse as a Ladder Lab backup."; }
  };
  $("#wipe").onclick = ()=>{
    if ($("#wipe").dataset.armed){ P=JSON.parse(JSON.stringify(DEFAULT_P)); saveP(); toast("Progress reset"); render(); }
    else { $("#wipe").dataset.armed="1"; $("#wipe").textContent="Click again to confirm reset"; }
  };
}

/* ---------- boot ---------- */
touchDay(); saveP();
const startHash = (location.hash||"").replace("#","");
if (TABS.some(([id])=>id===startHash)) route={view:startHash};
render();
})();
