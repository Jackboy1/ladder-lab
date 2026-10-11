// Ladder Lab — IPv4 access control lists (standard + extended, numbered + named) shared by the IOS engine and the bench.
// A device keeps one store: { lists: { "<name or number>": {name, kind:"standard"|"extended", named, entries:[...]} } }.
// Entries are checked top-down by sequence number; the first match decides; no match = the implicit "deny any" at the end.
// An ACL that is applied but doesn't exist (or is empty) permits everything — that is how IOS treats it.
(function(){
const ACL = {};
const ipRe = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const toInt = ip => ip.split(".").reduce((a,o)=>(a*256)+(+o),0);
const toIp = n => [24,16,8,0].map(s=>Math.floor(n/2**s)%256).join(".");
const ALL = 0xFFFFFFFF;
// zero the bits the wildcard says "don't care" — IOS stores and shows the address that way (192.168.1.5 0.0.0.255 → 192.168.1.0)
const norm = (a, w) => (toInt(a) & (ALL - toInt(w))) >>> 0;

ACL.TCP = { bgp:179, chargen:19, cmd:514, daytime:13, discard:9, domain:53, echo:7, exec:512, finger:79, ftp:21, "ftp-data":20,
  gopher:70, hostname:101, ident:113, irc:194, klogin:543, kshell:544, login:513, lpd:515, nntp:119, "pim-auto-rp":496, pop2:109,
  pop3:110, smtp:25, sunrpc:111, tacacs:49, talk:517, telnet:23, time:37, uucp:540, whois:43, www:80, drip:3949 };
ACL.UDP = { biff:512, bootpc:68, bootps:67, discard:9, dnsix:195, domain:53, echo:7, isakmp:500, "mobile-ip":434, nameserver:42,
  "netbios-dgm":138, "netbios-ns":137, "netbios-ss":139, "non500-isakmp":4500, ntp:123, "pim-auto-rp":496, rip:520, snmp:161,
  snmptrap:162, sunrpc:111, syslog:514, tacacs:49, talk:517, tftp:69, time:37, who:513, xdmcp:177 };
ACL.ICMP = { "echo-reply":0, unreachable:3, "source-quench":4, redirect:5, echo:8, "router-advertisement":9, "router-solicitation":10,
  "time-exceeded":11, "parameter-problem":12, "timestamp-request":13, "timestamp-reply":14, traceroute:30 };
// keywords that name a type AND a code
ACL.ICMPC = { "net-unreachable":[3,0], "host-unreachable":[3,1], "protocol-unreachable":[3,2], "port-unreachable":[3,3], "packet-too-big":[3,4],
  "administratively-prohibited":[3,13], "ttl-exceeded":[11,0] };
ACL.PROTO = { ip:0, icmp:1, igmp:2, tcp:6, udp:17, gre:47, esp:50, ahp:51, eigrp:88, ospf:89, pim:103 };
const protoName = n => Object.keys(ACL.PROTO).find(k=>ACL.PROTO[k]===n && k!=="ip");
const portName = (proto, n) => { const t = proto==="tcp" ? ACL.TCP : ACL.UDP; return Object.keys(t).find(k=>t[k]===n) || String(n); };

// which kind a number belongs to (null = not an IP ACL number)
ACL.numKind = n => { n = +n; if (!Number.isInteger(n)) return null; if ((n>=1&&n<=99)||(n>=1300&&n<=1999)) return "standard"; if ((n>=100&&n<=199)||(n>=2000&&n<=2699)) return "extended"; return null; };

const BAD = { err: "% Invalid input detected at '^' marker." }, INC = { err: "% Incomplete command." };
// address spec: any | host A | A W   (standard ACLs also allow a bare A = host)
const addr = (t, i, std) => {
  if (t[i]==="any") return { a:0, w:ALL, n:i+1 };
  if (t[i]==="host"){ if (!t[i+1]) return INC; if (!ipRe.test(t[i+1])) return BAD; return { a:toInt(t[i+1]), w:0, n:i+2 }; }
  if (!t[i]) return INC; if (!ipRe.test(t[i])) return BAD;
  if (t[i+1] && ipRe.test(t[i+1])) return { a:norm(t[i], t[i+1]), w:toInt(t[i+1]), n:i+2 };
  if (std) return { a:toInt(t[i]), w:0, n:i+1 };
  return t[i+1] ? BAD : INC;
};
const port = (proto, s) => { if (/^\d+$/.test(s) && +s <= 65535) return +s; const t = proto==="tcp" ? ACL.TCP : ACL.UDP; return t[s]!=null ? t[s] : null; };
const portOp = (proto, t, i) => {
  const op = t[i]; if (!["eq","neq","lt","gt","range"].includes(op)) return { n:i };
  if (op==="range"){ const a = port(proto, t[i+1]||""), b = port(proto, t[i+2]||""); if (!t[i+1] || !t[i+2]) return INC; if (a==null||b==null) return BAD; return { op, p:[a,b], n:i+3 }; }
  if (!t[i+1]) return INC; const p = port(proto, t[i+1]); if (p==null) return BAD; return { op, p:[p], n:i+2 };
};

// parse the part after the sequence number: "permit|deny ..." or "remark ..." → entry or {err}
ACL.parse = (kind, text) => {
  const t = String(text||"").trim().split(/\s+/).filter(Boolean);
  if (!t.length) return INC;
  if (t[0]==="remark") return t.length > 1 ? { remark: String(text).trim().replace(/^remark\s+/, "") } : INC;
  if (t[0]!=="permit" && t[0]!=="deny") return BAD;
  const e = { action:t[0], hits:0 };
  if (kind==="standard"){
    const s = addr(t, 1, true); if (s.err) return s; e.src = { a:s.a, w:s.w };
    let i = s.n; if (t[i]==="log"){ e.log = true; i++; } return i < t.length ? BAD : e;
  }
  if (!t[1]) return INC;
  const pr = t[1]; let pn = ACL.PROTO[pr]; if (pn==null && /^\d+$/.test(pr) && +pr<=255) pn = +pr; if (pn==null) return BAD;
  e.proto = pr in ACL.PROTO ? pr : (protoName(pn) || String(pn)); if (e.proto==="ip" && pr!=="ip") e.proto = String(pn);
  const L4 = e.proto==="tcp" || e.proto==="udp";
  const s = addr(t, 2, false); if (s.err) return s; e.src = { a:s.a, w:s.w }; let i = s.n;
  if (L4){ const p = portOp(e.proto, t, i); if (p.err) return p; if (p.op){ e.sop = p.op; e.sp = p.p; } i = p.n; }
  const d = addr(t, i, false); if (d.err) return d; e.dst = { a:d.a, w:d.w }; i = d.n;
  if (L4){ const p = portOp(e.proto, t, i); if (p.err) return p; if (p.op){ e.dop = p.op; e.dp = p.p; } i = p.n; }
  if (e.proto==="icmp" && t[i] && t[i]!=="log"){
    if (ACL.ICMPC[t[i]]){ [e.icmp, e.icode] = ACL.ICMPC[t[i]]; i++; }
    else { const named = ACL.ICMP[t[i]] != null, v = named ? ACL.ICMP[t[i]] : (/^\d+$/.test(t[i]) && +t[i]<=255 ? +t[i] : null); if (v==null) return BAD; e.icmp = v; i++;
      if (!named && /^\d+$/.test(t[i]||"")){ if (+t[i] > 255) return BAD; e.icode = +t[i]; i++; } } }
  if (e.proto==="tcp" && t[i]==="established"){ e.est = true; i++; }
  if (t[i]==="log"){ e.log = true; i++; }
  return i < t.length ? BAD : e;
};

ACL.store = () => ({ lists: {} });
const getList = (st, name, kind, named) => st.lists[name] || (st.lists[name] = { name, kind, named, entries: [] });
const aces = l => l.entries.filter(e=>!e.remark);
const nextSeq = l => { const a = aces(l); return (a.length ? Math.max(...a.map(e=>e.seq)) : 0) + 10; };
// a remark has no sequence number of its own: it carries the number of the line after it (e.before); a trailing one stays last
const sortKey = e => e.remark ? (e.before==null ? Infinity : e.before - 0.5) : e.seq;
const order = l => { l.entries.sort((x,y)=>sortKey(x)-sortKey(y)); };
ACL.seqOf = (l, e) => e.remark ? (e.before!=null ? e.before : nextSeq(l)) : e.seq;
const same = (a, b) => JSON.stringify({...a, hits:0, seq:0}) === JSON.stringify({...b, hits:0, seq:0});
const covers = (x, a) => ((a & (ALL - x.w)) >>> 0) === x.a;
const insert = (l, e, seq) => {
  if (e.remark){ e.before = seq!=null ? seq : null; l.entries.push(e); order(l); return null; }
  if (seq==null){ if (l.entries.some(x=>!x.remark && same(x, e))) return null; seq = nextSeq(l); }   // an identical line is not added twice
  else if (l.entries.some(x=>!x.remark && x.seq===seq)) return { err: "% Duplicate sequence number\n%Failed to add ace to access-list" };
  // standard lists: a host line that an earlier line already matches could never be reached — IOS refuses it
  if (l.kind==="standard" && e.src.w===0){ const c = aces(l).find(x=>x.seq < seq && covers(x.src, e.src.a));
    if (c) return { err: "% Access rule can't be configured at higher sequence num as it is part of the existing rule at sequence num " + c.seq }; }
  e.seq = seq; for (const r of l.entries) if (r.remark && r.before==null) r.before = seq;
  l.entries.push(e); order(l); return null;
};

// global config: "access-list N ..." / "no access-list N ..." (any "no access-list N" form deletes the WHOLE list, like IOS)
ACL.globalCmd = (st, line) => {
  const t = line.trim().split(/\s+/);
  const neg = t[0]==="no"; if (neg) t.shift();
  if (t[0]!=="access-list") return { err: BAD.err };
  if (!t[1]) return INC;
  const kind = ACL.numKind(t[1]); if (!kind) return BAD;
  if (neg){ delete st.lists[t[1]]; return {}; }
  const e = ACL.parse(kind, t.slice(2).join(" ")); if (e.err) return e;
  return insert(getList(st, t[1], kind, false), e) || {};
};
// "ip access-list standard|extended NAME" → {ctx} to pass to namedCmd (numbers are allowed and must match the kind)
ACL.enterNamed = (st, kind, name) => {
  if (kind!=="standard" && kind!=="extended") return BAD; if (!name) return INC;
  const nk = ACL.numKind(name); if (/^\d+$/.test(name) && nk!==kind) return { err: "% Invalid access list name." };
  const ex = st.lists[name]; if (ex && ex.kind!==kind) return { err: `% A named ${ex.kind} IP access list with this name already exists` };
  getList(st, name, kind, !nk); return { ctx: name, mode: kind==="standard" ? "config-std-nacl" : "config-ext-nacl" };
};
// a line inside (config-std-nacl)# / (config-ext-nacl)#: "[seq] permit|deny|remark …", "no seq", "no permit …"
ACL.namedCmd = (st, ctx, line) => {
  const l = st.lists[ctx]; if (!l) return BAD;
  let s = line.trim(); const neg = /^no\s+/.test(s); if (neg) s = s.replace(/^no\s+/, "");
  let seq = null; const m = s.match(/^(\d+)(?:\s+(.*))?$/); if (m){ seq = +m[1]; s = m[2]||""; if (seq < 1 || seq > 2147483647) return BAD; }
  if (neg){
    if (seq!=null && !s){ l.entries = l.entries.filter(x=>!(x.remark ? x.before===seq : x.seq===seq)); return {}; }
    const e = ACL.parse(l.kind, s); if (e.err) return e; l.entries = l.entries.filter(x=>e.remark ? !(x.remark && x.remark===e.remark) : !(!x.remark && same(x, e))); return {};
  }
  if (!s) return INC;
  const e = ACL.parse(l.kind, s); if (e.err) return e;
  return insert(l, e, seq) || {};
};
ACL.resequence = (st, name, start, step) => { const l = st.lists[name]; if (!l) return { err: "% Access list " + name + " not found" }; start = +start || 10; step = +step || 10;
  const map = {}; aces(l).forEach((e,i)=>{ map[e.seq] = start + i*step; }); for (const e of l.entries){ if (e.remark){ if (e.before!=null) e.before = map[e.before]; } else e.seq = map[e.seq]; } return {}; };

// ---- text: what show access-lists and show running-config print ----
const stdAddr = (x, show) => x.w===ALL ? "any" : x.w===0 ? toIp(x.a) : show ? `${toIp(x.a)}, wildcard bits ${toIp(x.w)}` : `${toIp(x.a)} ${toIp(x.w)}`;
const extAddr = x => x.w===ALL ? "any" : x.w===0 ? `host ${toIp(x.a)}` : `${toIp(x.a)} ${toIp(x.w)}`;
const ports = (proto, op, p) => op ? ` ${op} ${p.map(n=>portName(proto, n)).join(" ")}` : "";
ACL.entryText = (l, e, show) => {
  if (e.remark) return "remark " + e.remark;
  if (l.kind==="standard") return `${e.action==="deny" ? "deny  " : "permit"} ${stdAddr(e.src, show)}${e.log?" log":""}`;
  const icmp = e.icmp==null ? "" : e.icode!=null ? " " + (Object.keys(ACL.ICMPC).find(k=>ACL.ICMPC[k][0]===e.icmp && ACL.ICMPC[k][1]===e.icode) || (e.icmp + " " + e.icode)) : " " + (Object.keys(ACL.ICMP).find(k=>ACL.ICMP[k]===e.icmp) || e.icmp);
  return `${e.action} ${e.proto} ${extAddr(e.src)}${ports(e.proto, e.sop, e.sp||[])} ${extAddr(e.dst)}${ports(e.proto, e.dop, e.dp||[])}${icmp}${e.est?" established":""}${e.log?" log":""}`;
};
const hits = n => n ? ` (${n} match${n===1?"":"es"})` : "";
ACL.show = (st, only) => {
  const names = Object.keys(st.lists).filter(n=>only==null || n===String(only));
  return names.map(n=>{ const l = st.lists[n];
    const head = `${l.kind==="standard" ? "Standard" : "Extended"} IP access list ${n}`;
    return [head, ...aces(l).map(e=>`    ${e.seq} ${ACL.entryText(l, e, true)}${hits(e.hits)}`)].join("\n"); }).join("\n");
};
// IOS XE (the version the lab shows) writes every IP ACL as an "ip access-list" block with sequence numbers
ACL.running = st => Object.keys(st.lists).flatMap(n=>{ const l = st.lists[n];
  return [`ip access-list ${l.kind} ${n}`, ...l.entries.map(e=>` ${ACL.seqOf(l, e)} ${ACL.entryText(l, e, false)}`)]; });

// ---- matching ----
// pkt: { src, dst, proto: "icmp"|"tcp"|"udp"|"ospf"|<number>, sport, dport, icmp:<type>, ack:bool }
const inAddr = (x, ip) => ((toInt(ip) & (ALL - x.w)) >>> 0) === x.a;
const portOk = (op, p, v) => { if (!op) return true; if (v==null) return false;
  return op==="eq" ? v===p[0] : op==="neq" ? v!==p[0] : op==="lt" ? v<p[0] : op==="gt" ? v>p[0] : v>=p[0] && v<=p[1]; };
const protoNum = p => typeof p==="number" ? p : ACL.PROTO[p]!=null ? ACL.PROTO[p] : +p;
ACL.entryMatches = (l, e, pkt) => {
  if (e.remark) return false;
  if (!inAddr(e.src, pkt.src)) return false;
  if (l.kind==="standard") return true;
  if (!inAddr(e.dst, pkt.dst)) return false;
  if (e.proto!=="ip" && protoNum(e.proto)!==protoNum(pkt.proto)) return false;
  if (e.proto==="tcp" || e.proto==="udp"){ if (!portOk(e.sop, e.sp, pkt.sport) || !portOk(e.dop, e.dp, pkt.dport)) return false; }
  if (e.icmp!=null && e.icmp!==pkt.icmp) return false;
  if (e.icode!=null && e.icode!==pkt.icode) return false;
  if (e.est && !pkt.ack) return false;
  return true;
};
// → { permit, entry|null, implicit, missing }   (count:false = test without touching the match counters)
ACL.check = (st, name, pkt, count) => {
  const l = st && st.lists[name];
  if (!l || !l.entries.some(e=>!e.remark)) return { permit:true, entry:null, implicit:false, missing:!l };
  for (const e of l.entries) if (ACL.entryMatches(l, e, pkt)){ if (count!==false) e.hits++; return { permit:e.action==="permit", entry:e, implicit:false }; }
  return { permit:false, entry:null, implicit:true };
};
ACL.clear = (st, name) => { for (const n of Object.keys(st.lists)) if (name==null || n===String(name)) st.lists[n].entries.forEach(e=>e.hits=0); };

window.ACL = ACL;
})();
