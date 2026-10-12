// Ladder Lab — IPv4 NAT/PAT (inside source: static, static port forward, dynamic pool, pool overload, interface overload).
// The IOS engine marks interfaces "ip nat inside"/"ip nat outside"; the bench calls NAT.outbound for a packet routed from an
// inside interface out of an outside one (translate AFTER routing) and NAT.inbound for a packet arriving on an outside
// interface (translate BEFORE routing). Uses ACL.check (acl.js) to decide which inside sources a dynamic rule covers.
(function(){
const NAT = {};
const ipRe = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const toInt = ip => ip.split(".").reduce((a,o)=>(a*256)+(+o),0);
const toIp = n => [24,16,8,0].map(s=>Math.floor(n/2**s)%256).join(".");
const maskOk = m => { if (!ipRe.test(m)) return false; const n = toInt(m); const inv = 0xFFFFFFFF - n; return n!==0 && ((inv+1) & inv)===0; };
const BAD = { err: "% Invalid input detected at '^' marker." }, INC = { err: "% Incomplete command." };
const L4 = p => p==="tcp" || p==="udp" || p==="icmp";

NAT.store = () => ({ pools: {}, statics: [], rules: [], table: [], hits: 0, misses: 0, expired: 0 });

// ip nat pool NAME START END {netmask M | prefix-length N}
// ip nat inside source static [tcp|udp] LOCAL [LPORT] GLOBAL [GPORT]
// ip nat inside source list ACL {pool NAME | interface IF} [overload]     (interface form requires overload)
NAT.globalCmd = (st, line, opt) => {
  const t = line.trim().split(/\s+/); const neg = t[0]==="no"; if (neg) t.shift();
  if (t[0]!=="ip" || t[1]!=="nat") return BAD;
  if (t[2]==="pool"){
    const [name, a, b, kw, m] = t.slice(3);
    if (neg){ if (!name) return INC; const pl = st.pools[name]; if (pl && st.table.some(e=>!e.static && (e.pool===name || e.ig===toIp(pl.start)))) return { err: `%Pool ${name} in use, cannot destroy` }; delete st.pools[name]; return {}; }
    if (!m) return INC; if (!ipRe.test(a) || !ipRe.test(b) || toInt(b) < toInt(a)) return BAD;
    let len; if (kw==="netmask"){ if (!maskOk(m)) return BAD; len = toInt(m).toString(2).split("1").length - 1; } else if (kw==="prefix-length"){ len = +m; if (!(len>=1 && len<=32)) return BAD; } else return BAD;
    const mk = len ? (0xFFFFFFFF << (32-len)) >>> 0 : 0;
    if (((toInt(a) & mk) >>> 0) !== ((toInt(b) & mk) >>> 0)) return { err: "%End address not on same subnet as start address" };
    const old = st.pools[name]; st.pools[name] = { name, id: old ? old.id : Object.keys(st.pools).length + 1, start: toInt(a), end: toInt(b), len, asPrefix: kw==="prefix-length", used: old ? old.used : {}, misses: 0 }; return {};
  }
  if (t[2]!=="inside" || t[3]!=="source") return BAD;
  const r = t.slice(4);
  if (r[0]==="static"){
    let s;
    if ((r[1]==="tcp" || r[1]==="udp") && r[4]==="interface"){ if (r.length < 7) return INC; const ifn = opt && opt.ifName ? opt.ifName(r[5]) : r[5]; if (!ipRe.test(r[2]) || !/^\d+$/.test(r[3]) || !ifn || !/^\d+$/.test(r[6])) return BAD;
      s = { proto: r[1], local: r[2], lport: +r[3], intf: ifn, global: (opt && opt.ifAddr && opt.ifAddr(ifn)) || "0.0.0.0", gport: +r[6] }; }
    else if (r[1]==="tcp" || r[1]==="udp"){ if (r.length < 6) return INC; if (!ipRe.test(r[2]) || !ipRe.test(r[4]) || !/^\d+$/.test(r[3]) || !/^\d+$/.test(r[5])) return BAD; s = { proto: r[1], local: r[2], lport: +r[3], global: r[4], gport: +r[5] }; }
    else { if (r.length < 3) return INC; if (!ipRe.test(r[1]) || !ipRe.test(r[2]) || r[3]) return BAD; s = { local: r[1], global: r[2] }; }
    const key = x => [x.proto||"", x.local, x.lport||"", x.intf || x.global, x.gport||""].join("|");
    if (neg){ st.statics = st.statics.filter(x=>key(x)!==key(s)); st.table = st.table.filter(e=>!(e.static && e.il===s.local)); return {}; }
    if (st.statics.some(x=>key(x)===key(s))) return {};
    const ex = !s.proto && st.statics.find(x=>!x.proto && (x.local===s.local || x.global===s.global));
    if (ex) return { err: `% ${s.local} already mapped (${ex.local} -> ${ex.global})` };
    st.statics.push(s); return {};
  }
  if (r[0]==="list"){
    const acl = r[1]; if (!acl) return INC;
    let rule;
    if (r[2]==="pool"){ if (!r[3]) return INC; rule = { acl, pool: r[3], overload: r[4]==="overload" }; if (r[4] && r[4]!=="overload") return BAD; }
    else if (r[2]==="interface"){ if (!r[3]) return INC; const ifn = opt && opt.ifName ? opt.ifName(r[3]) : r[3]; if (!ifn) return BAD; rule = { acl, intf: ifn, overload: true }; if (r[4] && r[4]!=="overload") return BAD; }
    else return r[2] ? BAD : INC;
    if (neg){ if (st.table.some(e=>!e.static && e.rule===acl)) return { err: "%Dynamic mapping in use, cannot remove" }; st.rules = st.rules.filter(x=>!(x.acl===acl)); return {}; }
    st.rules = st.rules.filter(x=>x.acl!==acl); st.rules.push(rule); return {};
  }
  return BAD;
};
NAT.running = (st, opt) => {
  const out = [];
  for (const p of Object.values(st.pools)) out.push(`ip nat pool ${p.name} ${toIp(p.start)} ${toIp(p.end)} ${p.asPrefix ? "prefix-length " + p.len : "netmask " + toIp(p.len ? (0xFFFFFFFF << (32-p.len)) >>> 0 : 0)}`);
  for (const r of st.rules) out.push(`ip nat inside source list ${r.acl} ${r.pool ? "pool " + r.pool : "interface " + r.intf}${r.overload ? " overload" : ""}`);
  for (const s of st.statics) out.push(s.proto ? (s.intf ? `ip nat inside source static ${s.proto} ${s.local} ${s.lport} interface ${s.intf} ${s.gport}` : `ip nat inside source static ${s.proto} ${s.local} ${s.lport} ${s.global} ${s.gport}`) : `ip nat inside source static ${s.local} ${s.global}`);
  return out;
};

// ---- translating ----
// pkt: { src, dst, proto, sport, dport }   (ICMP: sport = dport = the echo identifier, which is what IOS shows as the "port")
const portsInUse = (st, gip, proto) => new Set(st.table.filter(e=>e.ig===gip && e.proto===proto).map(e=>e.igp));
const findFlow = (st, proto, il, ilp, ol, olp) => st.table.find(e=>e.proto===proto && e.il===il && e.ilp===ilp && e.ol===ol && e.olp===olp);
const simple = (st, il) => st.table.find(e=>!e.proto && e.il===il);
// ctx: { acl: <ACL store>, ACL: window.ACL, ifAddr: name → primary IPv4 }
NAT.outbound = (st, pkt, ctx) => { bindIf(st, ctx);
  const proto = pkt.proto, flowKey = L4(proto);
  // an existing extended entry for this exact flow
  if (flowKey){ const f = findFlow(st, proto, pkt.src, pkt.sport, pkt.dst, pkt.dport); if (f){ st.hits++; return { pkt: {...pkt, src: f.ig, sport: f.igp}, entry: f }; } }
  // static port forward (the inside server answering, or starting a flow, from its forwarded port)
  const sp = st.statics.find(s=>s.proto && s.proto===proto && s.local===pkt.src && s.lport===pkt.sport);
  if (sp){ st.misses++; const e = { proto, ig: sp.global, igp: sp.gport, il: pkt.src, ilp: pkt.sport, ol: pkt.dst, olp: pkt.dport, og: pkt.dst, ogp: pkt.dport, static: true };
    st.table.push(e); return { pkt: {...pkt, src: sp.global, sport: sp.gport}, entry: e }; }
  // static one-to-one
  const s1 = st.statics.find(s=>!s.proto && s.local===pkt.src);
  // ICMP has one identifier, not two ports: IOS shows the translated id on the outside columns too
  const addFlow = (ig, igp, isStatic, extra) => { const e = Object.assign({ proto, ig, igp, il: pkt.src, ilp: pkt.sport, ol: pkt.dst, olp: pkt.dport, og: pkt.dst, ogp: proto==="icmp" ? igp : pkt.dport, static: isStatic }, extra||{});
    if (flowKey){ st.table.push(e); st.misses++; } else st.hits++; return { pkt: {...pkt, src: ig, sport: flowKey ? igp : pkt.sport}, entry: e }; };
  if (s1){ if (!simple(st, pkt.src)) st.table.push({ ig: s1.global, il: pkt.src, static: true }); return addFlow(s1.global, pkt.sport, true); }
  // dynamic rules, in configured order; the first whose ACL permits the inside source
  for (const r of st.rules){
    const acl = ctx && ctx.acl && ctx.acl.lists[r.acl];
    if (!acl || !ctx.ACL.check(ctx.acl, r.acl, { src: pkt.src, dst: pkt.dst, proto, sport: pkt.sport, dport: pkt.dport }, ctx.noCount ? false : undefined).permit) continue;
    if (!r.overload){
      const p = st.pools[r.pool]; if (!p){ st.misses++; return { drop: "no-pool" }; }
      let sm = simple(st, pkt.src);
      if (!sm){ let g = null; for (let n = p.start; n <= p.end; n++) if (!p.used[n]){ g = n; break; }
        if (g==null){ st.misses++; p.misses++; return { drop: "pool-exhausted", logs: [`%NAT-6-ADDR_ALLOC_FAILURE: Address allocation failed; pool ${p.id} may be exhausted [2]`] }; }
        p.used[g] = pkt.src; sm = { ig: toIp(g), il: pkt.src, pool: p.name, rule: r.acl }; st.table.push(sm); }
      return addFlow(sm.ig, pkt.sport, false, { pool: p.name, rule: r.acl });
    }
    // PAT: one global address (the pool's first, or the outside interface's), ports kept if free, else the next free from 1024
    const gip = r.pool ? (st.pools[r.pool] ? toIp(st.pools[r.pool].start) : null) : (ctx.ifAddr && ctx.ifAddr(r.intf));
    if (!gip){ st.misses++; return { drop: "no-address" }; }
    if (!flowKey){ st.misses++; return { drop: "not-translatable" }; }
    const mine = st.table.find(e=>e.proto===proto && e.ig===gip && e.il===pkt.src && e.ilp===pkt.sport);
    const used = new Set(st.table.filter(e=>e.ig===gip && e.proto===proto && !(e.il===pkt.src && e.ilp===pkt.sport)).map(e=>e.igp)); let port = mine ? mine.igp : pkt.sport;
    if (!mine && used.has(port)){ port = 1024; while (used.has(port)) port++; }   // IOS XE keeps the port if free, else allocates from 1024 up
    return addFlow(gip, port, false, { pool: r.pool || null, rule: r.acl });
  }
  return { pkt, entry: null, untranslated: true };    // not covered by NAT: leaves with its private source (and won't come back)
};
// a packet arriving on an outside interface: rewrite the destination if it matches an inside global we own
const bindIf = (st, ctx) => { for (const s of st.statics) if (s.intf) s.global = (ctx && ctx.ifAddr && ctx.ifAddr(s.intf)) || "0.0.0.0"; };
NAT.inbound = (st, pkt, ctx) => { bindIf(st, ctx);
  const proto = pkt.proto;
  // an ICMP error (Time Exceeded, Unreachable) from any router on the way: IOS finds the flow from the packet quoted inside it
  if (pkt.err){ const f = st.table.find(e=>e.proto===proto && e.ig===pkt.dst && e.igp===pkt.dport); if (f){ st.hits++; return { pkt: {...pkt, dst: f.il, dport: f.ilp}, entry: f }; } }
  const f = L4(proto) && st.table.find(e=>e.proto===proto && e.ig===pkt.dst && e.igp===pkt.dport && e.og===pkt.src && e.ogp===pkt.sport);
  if (f){ st.hits++; return { pkt: {...pkt, dst: f.il, dport: f.ilp}, entry: f }; }
  const sp = st.statics.find(s=>s.proto && s.proto===proto && s.global===pkt.dst && s.gport===pkt.dport);
  if (sp){ st.misses++; const e = { proto, ig: sp.global, igp: sp.gport, il: sp.local, ilp: sp.lport, ol: pkt.src, olp: pkt.sport, og: pkt.src, ogp: pkt.sport, static: true };
    st.table.push(e); return { pkt: {...pkt, dst: sp.local, dport: sp.lport}, entry: e }; }
  const sm = st.table.find(e=>!e.proto && e.ig===pkt.dst) || (()=>{ const s = st.statics.find(x=>!x.proto && x.global===pkt.dst); if (!s) return null; const e = { ig: s.global, il: s.local, static: true }; st.table.push(e); return e; })();
  if (sm){ if (L4(proto)){ st.misses++; } else st.hits++; if (L4(proto)) st.table.push({ proto, ig: sm.ig, igp: pkt.dport, il: sm.il, ilp: pkt.dport, ol: pkt.src, olp: pkt.sport, og: pkt.src, ogp: pkt.sport, static: !!sm.static });
    return { pkt: {...pkt, dst: sm.il}, entry: sm }; }
  return null;   // no translation: the packet is for the router itself (or is dropped)
};
// static simple entries exist from the moment they are configured
const syncStatics = st => { for (const s of st.statics) if (!s.proto && !simple(st, s.local)) st.table.push({ ig: s.global, il: s.local, static: true });
  for (const s of st.statics) if (s.proto && !st.table.some(e=>e.static && e.proto===s.proto && e.il===s.local && e.ilp===s.lport && e.og==null)) st.table.push({ proto: s.proto, ig: s.global, igp: s.gport, il: s.local, ilp: s.lport, static: true, fwd: true }); };
NAT.clear = st => { st.table = st.table.filter(e=>e.static && (!e.proto || e.fwd)); for (const p of Object.values(st.pools)) p.used = {}; };

const pad = (s, n) => String(s).padEnd(n);
const ep = (ip, port) => ip==null ? "---" : port==null ? ip : `${ip}:${port}`;
NAT.show = (st, ctx) => { bindIf(st, ctx);
  syncStatics(st);
  const rows = st.table.slice().sort((a,b)=>(!!b.proto - !!a.proto) || (toInt(a.il)-toInt(b.il)));
  return ["Pro  Inside global         Inside local          Outside local         Outside global",
    ...rows.map((e, k)=> (e.proto ? `${pad(e.proto,5)}${pad(ep(e.ig,e.igp),22)}${pad(ep(e.il,e.ilp),22)}${pad(ep(e.ol,e.olp),22)}${ep(e.og,e.ogp)}`
                            : `${pad("---",5)}${pad(e.ig,22)}${pad(e.il,22)}${pad("---",22)}---`)
      + (ctx && ctx.verbose ? `\n  create: 10/12/26 08:30:07, use: 10/12/26 08:30:07, timeout: ${e.static && !e.proto ? "00:00:00" : e.proto==="icmp" ? "00:01:00" : e.proto ? "24:00:00" : "24:00:00"}\n  Map-Id(In): ${e.static ? 0 : 1}\n  Mac-Address: 0000.0000.0000    Input-IDB: GigabitEthernet0/0\n  entry-id: 0x${k.toString(16)}, use_count:${e.proto ? 0 : 1}` : "")), `Total number of translations: ${rows.length}`].join("\n");
};
NAT.stats = (st, ins, outs) => {
  syncStatics(st);
  const stat = st.table.filter(e=>e.static && !e.proto).length + st.table.filter(e=>e.fwd).length;
  const dyn = st.table.length - stat, ext = st.table.filter(e=>e.proto).length;
  const lines = [`Total active translations: ${st.table.length} (${stat} static, ${dyn} dynamic; ${ext} extended)`,
    "Outside interfaces:", ...(outs.length ? ["  " + outs.join(", ")] : []), "Inside interfaces: ", ...(ins.length ? ["  " + ins.join(", ")] : []),
    `Hits: ${st.hits}  Misses: ${st.misses}`, `Expired translations: ${st.expired}`, "Dynamic mappings:"];
  if (st.rules.length) lines.push("-- Inside Source");
  st.rules.forEach((r, i)=>{
    const refs = st.table.filter(e=>!e.static && e.rule===r.acl).length;
    lines.push(`[Id: ${i+1}] access-list ${r.acl} ${r.pool ? "pool " + r.pool : "interface " + r.intf} refcount ${refs}`);
    const p = r.pool && st.pools[r.pool];
    if (p){ const tot = p.end - p.start + 1, alloc = r.overload ? (st.table.some(e=>e.ig===toIp(p.start)) ? 1 : 0) : Object.keys(p.used).length;
      lines.push(` pool ${p.name}: id ${p.id}, netmask ${toIp(p.len ? (0xFFFFFFFF << (32-p.len)) >>> 0 : 0)}`, `\tstart ${toIp(p.start)} end ${toIp(p.end)}`,
        `\ttype generic, total addresses ${tot}, allocated ${alloc} (${Math.floor(alloc*100/tot)}%), misses ${p.misses}`); }
  });
  lines.push("nat-limit statistics:", " max entry: max allowed 0, used 0, missed 0", "In-to-out drops: 0  Out-to-in drops: 0", "Pool stats drop: 0  Mapping stats drop: 0",
    "Port block alloc fail: 0", "IP alias add fail: 0", "Limit entry add fail: 0");
  return lines.join("\n");
};

window.NAT = NAT;
})();
