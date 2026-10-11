// Ladder Lab — IOS DHCP server state (excluded addresses, pools, bindings, conflicts) shared by the IOS engine and the bench.
// The bench does the frames (Discover → Offer → Request → Ack, and the relay hop); this file decides WHAT is offered.
// Pool choice follows IOS: the pool whose network contains the address of the interface the request arrived on — or, for a
// relayed request, the relay's giaddr (the address of the interface the client is on). No such pool → no offer.
(function(){
const DHCP = {};
const ipRe = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const toInt = ip => ip.split(".").reduce((a,o)=>(a*256)+(+o),0);
const toIp = n => [24,16,8,0].map(s=>Math.floor(n/2**s)%256).join(".");
const lenMask = n => toIp(n ? (0xFFFFFFFF << (32-n)) >>> 0 : 0);
const maskOk = m => { if (!ipRe.test(m)) return false; const n = toInt(m); const inv = 0xFFFFFFFF - n; return n!==0 && ((inv+1) & inv)===0; };
const BAD = { err: "% Invalid input detected at '^' marker." }, INC = { err: "% Incomplete command." };

DHCP.store = () => ({ excluded: [], pools: {}, bindings: [], conflicts: [] });

// global config: ip dhcp excluded-address A [B] · no ip dhcp excluded-address A [B] · ip dhcp pool NAME · no ip dhcp pool NAME
DHCP.globalCmd = (st, line) => {
  const t = line.trim().split(/\s+/); const neg = t[0]==="no"; if (neg) t.shift();
  if (t[0]!=="ip" || t[1]!=="dhcp") return BAD;
  if (t[2]==="excluded-address"){
    if (!t[3]) return INC; if (!ipRe.test(t[3]) || (t[4] && !ipRe.test(t[4])) || t[5]) return BAD;
    const lo = toInt(t[3]), hi = t[4] ? toInt(t[4]) : lo; if (hi < lo) return BAD;
    if (neg){ st.excluded = st.excluded.filter(r=>!(r[0]===lo && r[1]===hi)); return {}; }
    if (!st.excluded.some(r=>r[0]===lo && r[1]===hi)) st.excluded.push([lo, hi]); return {};
  }
  if (t[2]==="pool"){
    if (!t[3]) return INC; if (t[4]) return BAD;
    if (neg){ delete st.pools[t[3]]; st.bindings = st.bindings.filter(b=>b.pool!==t[3]); return {}; }
    if (!st.pools[t[3]]) st.pools[t[3]] = { name: t[3], net: null, len: null, routers: [], dns: [], domain: null, lease: [1,0,0] };
    return { ctx: t[3], mode: "dhcp-config" };
  }
  return BAD;
};
// (dhcp-config)# lines
DHCP.poolCmd = (st, ctx, line) => {
  const p = st.pools[ctx]; if (!p) return BAD;
  const t = line.trim().split(/\s+/); const neg = t[0]==="no"; if (neg) t.shift();
  const c = t[0], a = t.slice(1);
  if (c==="network"){
    if (neg){ p.net = null; p.len = null; return {}; }
    if (!a[0]) return INC; if (!ipRe.test(a[0])) return BAD;
    let len; if (/^\/\d+$/.test(a[1]||"")) len = +a[1].slice(1); else if (a[1] && maskOk(a[1])) len = toInt(a[1]).toString(2).split("1").length - 1; else if (!a[1]) return INC; else return BAD;
    if (len < 1 || len > 30) return BAD;
    const net = (toInt(a[0]) & toInt(lenMask(len))) >>> 0;   // (real IOS's reaction to host bits is unverified: the lab stores the network address)
    p.net = net; p.len = len; p.index = net + 1; return {};
  }
  if (c==="default-router" || c==="dns-server"){
    const k = c==="default-router" ? "routers" : "dns";
    if (neg){ p[k] = []; return {}; }
    if (!a.length) return INC; if (a.length > 8 || a.some(x=>!ipRe.test(x))) return BAD; p[k] = a.slice(); return {};
  }
  if (c==="domain-name"){ if (neg){ p.domain = null; return {}; } if (!a[0]) return INC; if (a[1]) return BAD; p.domain = a[0]; return {}; }
  if (c==="lease"){
    if (neg){ p.lease = [1,0,0]; return {}; }
    if (a[0]==="infinite" && !a[1]){ p.lease = "infinite"; return {}; }
    if (!a.length) return INC; const v = a.map(Number);
    if (a.length > 3 || v.some(x=>!Number.isInteger(x)) || v[0]>365 || (v[1]||0)>23 || (v[2]||0)>59) return BAD;
    if (!v.some(x=>x>0)) return BAD;
    p.lease = [v[0]||0, v[1]||0, v[2]||0]; return {};
  }
  return BAD;
};
DHCP.running = st => {
  const out = st.excluded.map(r=>`ip dhcp excluded-address ${toIp(r[0])}${r[1]!==r[0] ? " " + toIp(r[1]) : ""}`);
  for (const p of Object.values(st.pools)){
    if (out.length) out.push("!");
    out.push(`ip dhcp pool ${p.name}`);
    if (p.net!=null) out.push(` network ${toIp(p.net)} ${lenMask(p.len)}`);
    if (p.routers.length) out.push(` default-router ${p.routers.join(" ")} `.trimEnd());
    if (p.dns.length) out.push(` dns-server ${p.dns.join(" ")}`);
    if (p.domain) out.push(` domain-name ${p.domain}`);
    if (p.lease==="infinite") out.push(" lease infinite");
    else if (p.lease.join()!=="1,0,0") out.push(" lease " + (p.lease[2] ? p.lease.join(" ") : p.lease[1] ? p.lease.slice(0,2).join(" ") : p.lease[0]));
  }
  return out;
};

const inPool = (p, ip) => p.net!=null && ((toInt(ip) & toInt(lenMask(p.len))) >>> 0) === p.net;
const excluded = (st, n) => st.excluded.some(r=>n>=r[0] && n<=r[1]);
DHCP.poolFor = (st, ip) => ip ? Object.values(st.pools).filter(p=>inPool(p, ip)).sort((a,b)=>b.len-a.len)[0] || null : null;
const clientId = mac => { const h = "01" + mac.replace(/[^0-9a-f]/gi, "").toLowerCase(); return h.match(/.{1,4}/g).join("."); };
const leaseMs = p => p.lease==="infinite" ? null : ((p.lease[0]*24 + p.lease[1])*60 + p.lease[2]) * 60000;

// a client asks for an address. q: { mac, via (receiving interface IP or giaddr), iface, now (ms), inUse(ip)→bool, own(ip)→bool }
// → { ip, mask, routers, dns, domain, leaseMs, pool } or { err: "no-pool" | "exhausted" | "no-network" }
DHCP.offer = (st, q) => {
  const p = DHCP.poolFor(st, q.via); if (!p) return { err: "no-pool" };
  if (q.now!=null) st.bindings = st.bindings.filter(b=>b.expires==null || b.expires > q.now);
  const mine = st.bindings.find(b=>b.mac===q.mac && b.pool===p.name);
  const pack = ip => ({ ip, mask: lenMask(p.len), routers: p.routers.slice(), dns: p.dns.slice(), domain: p.domain, leaseMs: leaseMs(p), pool: p.name });
  if (mine) return pack(mine.ip);                                         // a returning client keeps its address
  const first = p.net + 1, last = p.net + 2**(32-p.len) - 2, size = last - first + 1;
  const free = n => { const ip = toIp(n); return n>=first && n<=last && !excluded(st, n) && !st.bindings.some(b=>b.ip===ip) && !st.conflicts.some(c=>c.ip===ip) && !(q.own && q.own(ip)); };
  const logs = [];
  const tryAddr = n => { const ip = toIp(n);
    if (q.inUse && q.inUse(ip)){ st.conflicts.push({ ip, method: "Ping", at: q.now||0 }); logs.push(`%DHCPD-4-PING_CONFLICT: DHCP address conflict:  server pinged ${ip}.`); return false; }   // IOS pings before offering
    return true; };
  const done = n => { p.index = n + 1 > last ? first : n + 1; return Object.assign(pack(toIp(n)), { logs }); };
  if (q.want && free(toInt(q.want)) && tryAddr(toInt(q.want))) return done(toInt(q.want));   // a returning Windows client asks for its last address
  if (p.index==null || p.index < first || p.index > last) p.index = first;
  for (let k = 0, n = p.index; k < size; k++, n = n + 1 > last ? first : n + 1){   // the router never hands out its own address
    if (!free(n)) continue; if (!tryAddr(n)) continue; return done(n); }
  return { err: "exhausted", logs };
};
DHCP.bind = (st, q, o) => {
  st.bindings = st.bindings.filter(b=>b.mac!==q.mac || b.pool!==o.pool);
  st.bindings.push({ ip: o.ip, mac: q.mac, cid: clientId(q.mac), pool: o.pool, iface: q.iface || "Unknown", expires: o.leaseMs==null ? null : (q.now||0) + o.leaseMs });
};
DHCP.release = (st, mac) => { st.bindings = st.bindings.filter(b=>b.mac!==mac); };
DHCP.clear = (st, what) => { if (what==="conflict") st.conflicts = []; else st.bindings = []; };

const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const when = ms => { const d = new Date(ms); let h = d.getUTCHours(); const ap = h < 12 ? "AM" : "PM"; h = h % 12 || 12;
  return `${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2,"0")} ${d.getUTCFullYear()} ${String(h).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")} ${ap}`; };
const pad = (s, n) => String(s).padEnd(n);
DHCP.showBinding = st => ["Bindings from all pools not associated with VRF:",
  "IP address      Client-ID/              Lease expiration        Type       State      Interface",
  "                Hardware address/",
  "                User name",
  ...st.bindings.slice().sort((a,b)=>toInt(a.ip)-toInt(b.ip)).map(b=>
    `${pad(b.ip,16)}${pad(b.cid,24)}${pad(b.expires==null ? "Infinite" : when(b.expires),24)}${pad("Automatic",11)}${pad("Active",11)}${b.iface}`)].join("\n");
DHCP.showConflict = st => ["IP address        Detection method   Detection time          VRF",
  ...st.conflicts.map(c=>`${pad(c.ip,18)}${pad(c.method,19)}${when(c.at)}`)].join("\n");
DHCP.showPool = (st, only) => Object.values(st.pools).filter(p=>!only || p.name===only).map(p=>{
  if (p.net==null) return `\nPool ${p.name} :\n Utilization mark (high/low)    : 100 / 0\n Subnet size (first/next)       : 0 / 0\n Total addresses                : 0\n Leased addresses               : 0\n Pending event                  : none\n 0 subnet is currently in the pool :`;
  const first = p.net + 1, last = p.net + 2**(32-p.len) - 2, total = last - first + 1;
  let ex = 0; for (let n = first; n <= last; n++) if (excluded(st, n) || st.conflicts.some(c=>c.ip===toIp(n))) ex++;   // ping conflicts count as excluded
  const leased = st.bindings.filter(b=>b.pool===p.name).length;
  const idx = p.index==null ? first : p.index;   // the next-allocation pointer, not "the lowest free address"
  return [``, `Pool ${p.name} :`, ` Utilization mark (high/low)    : 100 / 0`, ` Subnet size (first/next)       : 0 / 0`,
    ` Total addresses                : ${total}`, ` Leased addresses               : ${leased}`, ` Excluded addresses             : ${ex}`,
    ` Pending event                  : none`, ` 1 subnet is currently in the pool :`,
    ` Current index        IP address range                    Leased/Excluded/Total`,
    ` ${pad(idx > last ? "0.0.0.0" : toIp(idx), 21)}${pad(toIp(first),17)}- ${pad(toIp(last),18)}${pad(leased,6)}/ ${pad(ex,6)}/ ${total}`].join("\n"); }).join("\n");

window.DHCP = DHCP;
})();
