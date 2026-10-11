// Ladder Lab — question types for quizzes, exams and in-lesson practice (window.QT).
// Shapes (all may carry `ex`: an exhibit such as CLI output, shown above the options):
//   mcq   {q, o:[...], a:index, why}                       — default when no type is given
//   multi {type:"multi", q, o:[...], a:[indexes], why}      — "choose two/three"; all and only the right ones
//   order {type:"order", q, items:[...in the correct order], why}
//   match {type:"match", q, pairs:[[left,right],...], why}
//   fill  {type:"fill", q, fields:[{label, a:[accepted answers], ios:true?}], why}   (or a:[...] for one blank;
//         ios:true also accepts Cisco abbreviations such as "conf t" for "configure terminal")
(function(){
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const type = q => q.type || "mcq";
const norm = s => String(s==null?"":s).trim().toLowerCase().replace(/\s+/g," ");
function seeded(n, seed){ const a = [...Array(n).keys()]; let x = seed||7; for (let i=n-1;i>0;i--){ x = (x*9301+49297)%233280; const j = Math.floor(x/233280*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const hash = s => { let h = 0; for (const c of String(s)) h = (h*31 + c.charCodeAt(0))|0; return Math.abs(h)+1; };
const fields = q => q.fields || [{label:"", a:q.a}];

function initial(q){
  const t = type(q);
  if (t==="multi") return [];
  if (t==="order"){ let idx = seeded(q.items.length, hash(q.q)); if (idx.every((v,i)=>v===i)) idx = idx.slice(1).concat(idx[0]); return idx.map(i=>q.items[i]); }
  if (t==="match") return q.pairs.map(()=>"");
  if (t==="fill") return fields(q).map(()=>"");
  return null;
}
function prompt(q){
  const t = type(q);
  const lead = t==="multi" ? `Choose ${q.a.length}.` : t==="order" ? "Put these in the correct order (use the arrows)." : t==="match" ? "Match each item on the left with the right answer." : t==="fill" ? "Type your answer." : "";
  return `${q.ex?`<pre class="qt-ex"><code>${esc(q.ex)}</code></pre>`:""}<h2>${esc(q.q)}</h2>${lead?`<p class="small muted">${lead}</p>`:""}`;
}
// render the answer area. resp = current response; reveal = show right/wrong marking
function body(q, resp, reveal){
  const t = type(q);
  if (t==="mcq") return q.o.map((o,i)=>{ const cls = reveal ? (i===q.a?"right":i===resp?"wrong":"") : (resp===i?"picked":""); return `<button class="opt ${cls}" data-qi="${i}" ${reveal?"disabled":""}>${esc(o)}</button>`; }).join("");
  if (t==="multi") return q.o.map((o,i)=>{ const on = (resp||[]).includes(i), good = q.a.includes(i); const cls = reveal ? (good?"right":on?"wrong":"") : (on?"picked":""); return `<button class="opt ${cls}" data-qm="${i}" ${reveal?"disabled":""}><span class="qt-box">${on?"☑":"☐"}</span> ${esc(o)}</button>`; }).join("");
  if (t==="order") return `<ol class="qt-order">${resp.map((it,i)=>{ const ok = reveal && q.items[i]===it; return `<li class="${reveal?(ok?"right":"wrong"):""}"><span>${esc(it)}</span>${reveal?"":`<span class="qt-mv"><button class="btn sm ghost" data-up="${i}" ${i===0?"disabled":""} aria-label="move up">▲</button><button class="btn sm ghost" data-dn="${i}" ${i===resp.length-1?"disabled":""} aria-label="move down">▼</button></span>`}</li>`; }).join("")}</ol>${reveal && !grade(q,resp)?`<p class="small"><b>Correct order:</b> ${q.items.map((x,i)=>`${i+1}. ${esc(x)}`).join(" · ")}</p>`:""}`;
  if (t==="match"){ const rights = seeded(q.pairs.length, hash(q.q)+3).map(i=>q.pairs[i][1]);
    return `<div class="qt-match">${q.pairs.map(([l,r],i)=>{ const ok = reveal && norm(resp[i])===norm(r);
      return `<div class="qt-row ${reveal?(ok?"right":"wrong"):""}"><span>${esc(l)}</span><select class="txt" data-mt="${i}" ${reveal?"disabled":""}><option value="">— choose —</option>${rights.map(x=>`<option ${x===resp[i]?"selected":""}>${esc(x)}</option>`).join("")}</select>${reveal&&!ok?`<span class="small qt-fix">→ ${esc(r)}</span>`:""}</div>`; }).join("")}</div>`; }
  if (t==="fill") return `<div class="qt-fill">${fields(q).map((f,i)=>{ const ok = reveal && fieldOk(f, resp[i]);
    return `<label class="${reveal?(ok?"right":"wrong"):""}">${f.label?`<span>${esc(f.label)}</span>`:""}<input class="txt" data-fl="${i}" value="${esc(resp[i]||"")}" autocomplete="off" spellcheck="false" ${reveal?"disabled":""}>${reveal&&!ok?`<span class="small qt-fix">→ ${esc(f.a[0])}</span>`:""}</label>`; }).join("")}</div>`;
  return "";
}
function wire(root, q, get, set){
  const t = type(q);
  root.querySelectorAll("[data-qi]").forEach(b=>b.onclick=()=>set(+b.dataset.qi));
  root.querySelectorAll("[data-qm]").forEach(b=>b.onclick=()=>{ const i = +b.dataset.qm, cur = (get()||[]).slice(); const k = cur.indexOf(i); if (k>-1) cur.splice(k,1); else cur.push(i); set(cur); });
  root.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>{ const i = +b.dataset.up, c = get().slice(); [c[i-1],c[i]]=[c[i],c[i-1]]; set(c); });
  root.querySelectorAll("[data-dn]").forEach(b=>b.onclick=()=>{ const i = +b.dataset.dn, c = get().slice(); [c[i+1],c[i]]=[c[i],c[i+1]]; set(c); });
  root.querySelectorAll("[data-mt]").forEach(s=>s.onchange=()=>{ const c = get().slice(); c[+s.dataset.mt] = s.value; set(c, true); });
  root.querySelectorAll("[data-fl]").forEach(inp=>{ inp.oninput=()=>{ const c = get().slice(); c[+inp.dataset.fl] = inp.value; set(c, true); }; });
  void t;
}
function answered(q, resp){
  const t = type(q);
  if (t==="mcq") return resp!=null;
  if (t==="multi") return (resp||[]).length>0;
  if (t==="order") return true;
  if (t==="match") return resp.every(x=>x);
  if (t==="fill") return resp.every(x=>String(x).trim());
  return false;
}
function grade(q, resp){
  const t = type(q);
  if (resp==null) return false;
  if (t==="mcq") return resp===q.a;
  if (t==="multi"){ const r = [...resp].sort(), a = [...q.a].sort(); return r.length===a.length && r.every((x,i)=>x===a[i]); }
  if (t==="order") return resp.every((x,i)=>x===q.items[i]);
  if (t==="match") return q.pairs.every(([,r],i)=>norm(resp[i])===norm(r));
  if (t==="fill") return fields(q).every((f,i)=>fieldOk(f, resp[i]));
  return false;
}
// a field with ios:true also accepts Cisco-style abbreviations: every typed word must start the matching word
function fieldOk(f, v){
  if (f.a.some(a=>norm(a)===norm(v))) return true;
  if (!f.ios) return false;
  const typed = norm(v).split(" ");
  return f.a.some(a=>{ const words = norm(a).split(" "); return words.length===typed.length && words.every((w,i)=>/\d/.test(w) ? typed[i]===w : typed[i].length>=Math.min(2,w.length) && w.startsWith(typed[i])); });
}
function answerText(q){
  const t = type(q);
  if (t==="mcq") return q.o[q.a];
  if (t==="multi") return q.a.map(i=>q.o[i]).join(" + ");
  if (t==="order") return q.items.map((x,i)=>`${i+1}. ${x}`).join("  ");
  if (t==="match") return q.pairs.map(([l,r])=>`${l} → ${r}`).join(" · ");
  if (t==="fill") return fields(q).map(f=>(f.label?f.label+": ":"")+f.a[0]).join(" · ");
  return "";
}
function respText(q, resp){
  const t = type(q);
  if (resp==null || (Array.isArray(resp)&&!resp.length)) return "(unanswered)";
  if (t==="mcq") return q.o[resp];
  if (t==="multi") return resp.map(i=>q.o[i]).join(" + ");
  if (t==="order") return resp.map((x,i)=>`${i+1}. ${x}`).join("  ");
  if (t==="match") return q.pairs.map(([l],i)=>`${l} → ${resp[i]||"?"}`).join(" · ");
  if (t==="fill") return resp.join(" · ");
  return "";
}
// structural check used by tools/validate.js — returns an error string or null
function problem(q){
  const t = type(q);
  if (typeof q.q!=="string" || !q.q.trim()) return "missing question text";
  if (t==="mcq"){ if (!Array.isArray(q.o)||q.o.length<2) return "needs 2+ options"; if (!(Number.isInteger(q.a)&&q.a>=0&&q.a<q.o.length)) return `answer index ${q.a} out of range`; return null; }
  if (t==="multi"){ if (!Array.isArray(q.o)||q.o.length<3) return "multi needs 3+ options"; if (!Array.isArray(q.a)||q.a.length<2) return "multi needs 2+ correct answers in a[]"; if (q.a.some(i=>!(Number.isInteger(i)&&i>=0&&i<q.o.length))) return "multi answer index out of range"; if (new Set(q.a).size!==q.a.length) return "multi has a repeated answer"; if (q.a.length>=q.o.length) return "multi: not every option can be correct"; return null; }
  if (t==="order"){ if (!Array.isArray(q.items)||q.items.length<3) return "order needs 3+ items"; if (new Set(q.items).size!==q.items.length) return "order items must be unique"; return null; }
  if (t==="match"){ if (!Array.isArray(q.pairs)||q.pairs.length<3) return "match needs 3+ pairs"; if (new Set(q.pairs.map(p=>p[1])).size!==q.pairs.length) return "match right-hand answers must be unique"; return null; }
  if (t==="fill"){ const f = fields(q); if (!f.length || f.some(x=>!Array.isArray(x.a)||!x.a.length)) return "fill needs accepted answers a:[...]"; return null; }
  return "unknown question type "+t;
}
window.QT = { type, initial, prompt, body, wire, answered, grade, answerText, respText, problem };
})();
