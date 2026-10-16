// Ladder Lab — security drills (Module 8), added to window.DRILL: ACL first match, ACL wildcards, ACL placement,
// port-security outcomes, DHCP snooping drops, DAI decisions, password types, RADIUS vs TACACS+, CIA.
// Every generated question carries its answer and a worked explanation; tools/security_test.js cross-checks the
// ACL answers against the simulator's own ACL engine and the rest against independent rule tables.
(function(){
const D = window.DRILL; if (!D) return;
let seedState = null;
const rnd = n => { if (seedState==null) return Math.floor(Math.random()*n); seedState = (seedState*1103515245 + 12345) % 2147483648; return seedState % n; };
const pick = a => a[rnd(a.length)];
const ipStr = n => [24,16,8,0].map(s=>(n>>>s)&255).join("."), ipNum = s => s.split(".").reduce((a,o)=>a*256+(+o),0);
const norm = s => String(s==null?"":s).trim().toLowerCase().replace(/\s+/g,"");
const yn = (v, want) => { const x = norm(v); return want ? (x==="yes"||x==="y") : (x==="no"||x==="n"); };
const oneOf = (v, list) => list.includes(norm(v));

/* ---------- ACL helpers ---------- */
// an address spec: {kind:"any"} | {kind:"host", ip} | {kind:"net", ip, wc}
const specText = s => s.kind==="any" ? "any" : s.kind==="host" ? `host ${ipStr(s.ip)}` : `${ipStr(s.ip)} ${ipStr(s.wc)}`;
const specHit = (s, a) => s.kind==="any" || (s.kind==="host" ? a===s.ip : ((a & ~s.wc)>>>0)===s.ip);
const specRange = s => s.kind==="any" ? "every address" : s.kind==="host" ? `only ${ipStr(s.ip)}` : `${ipStr(s.ip)} – ${ipStr((s.ip | s.wc)>>>0)}`;
const inSpec = s => s.kind==="host" ? s.ip : s.kind==="any" ? null : (s.ip + rnd(s.wc+1))>>>0;
const netOf = (base, p) => ({kind:"net", ip:base>>>0, wc:(2**(32-p)-1)>>>0});
const PORTS = {tcp:[[22,"SSH"],[23,"Telnet"],[80,"HTTP"],[443,"HTTPS"],[25,"SMTP"]], udp:[[53,"DNS"],[69,"TFTP"],[161,"SNMP"],[123,"NTP"]]};
const portName = (pr, p) => (PORTS[pr]||[]).find(x=>x[0]===p)?.[1] || "";
function aceText(e, ext){ const act = e.action==="deny" ? "deny  " : "permit";
  return ext ? ` ${e.seq} ${act} ${e.proto} ${specText(e.src)} ${specText(e.dst)}${e.port ? " eq " + e.port : ""}` : ` ${e.seq} ${act} ${specText(e.src)}`; }
function aceHit(e, ext, pk){ if (!specHit(e.src, pk.src)) return "source";
  if (!ext) return null;
  if (e.proto!=="ip" && e.proto!==pk.proto) return "protocol"; if (!specHit(e.dst, pk.dst)) return "destination";
  if (e.port && pk.dport!==e.port) return "port"; return null; }
function pktText(pk, ext){ if (!ext) return `a packet from ${ipStr(pk.src)}`;
  if (pk.proto==="icmp") return `a ping (ICMP echo) from ${ipStr(pk.src)} to ${ipStr(pk.dst)}`;
  const nm = portName(pk.proto, pk.dport); return `a ${pk.proto.toUpperCase()} packet from ${ipStr(pk.src)} to ${ipStr(pk.dst)}, destination port ${pk.dport}${nm ? " (" + nm + ")" : ""}`; }
function whyAcl(L, ext, pk){ const rows = []; for (const e of L){ const miss = aceHit(e, ext, pk);
    const what = ext ? `${e.proto}, source ${specRange(e.src)}, destination ${specRange(e.dst)}${e.port ? ", port " + e.port : ""}` : `source ${specRange(e.src)}`;
    if (!miss){ rows.push(`Line ${e.seq} (${what}): every part matches → the packet is ${e.action==="permit" ? "PERMITTED" : "DENIED"} and IOS stops reading.`); return rows.join(" "); }
    rows.push(`Line ${e.seq} (${what}): the ${miss} doesn't match → next line.`); }
  rows.push("No line matched, so the invisible last line — deny any — drops it (implicit deny)."); return rows.join(" "); }

/* ---------- the generators ---------- */
const GEN = {
  // which line matches first, and permit or deny?
  aclmatch(){ const ext = rnd(2)===0, A = 1 + rnd(200), site = ipNum(`10.${A}.0.0`);
    const lan = k => (site + (k<<8))>>>0, n = 3 + rnd(2), L = [];
    const rndSpec = (allowAny) => { const r = rnd(allowAny ? 6 : 5);
      if (r===0) return {kind:"host", ip:(lan(20 + rnd(10)) + 1 + rnd(250))>>>0};
      if (r===1) return netOf(lan(20 + rnd(10)), 24);
      if (r===2){ const p = pick([25,26,27,28]), sz = 2**(32-p); return netOf(lan(20 + rnd(10)) + sz*rnd(256/sz), p); }
      if (r===3) return netOf(site, 16);
      if (r===4) return netOf(lan(16 + 4*rnd(4)), 22);
      return {kind:"any"}; };
    for (let i=0;i<n;i++){ const e = {seq:(i+1)*10, action: rnd(2) ? "permit" : "deny", src: rndSpec(i===n-1)};
      if (ext){ e.proto = pick(["tcp","tcp","udp","icmp","ip"]); e.dst = rnd(3) ? {kind:"host", ip:(lan(50) + 10 + rnd(20))>>>0} : rnd(2) ? netOf(lan(50), 24) : {kind:"any"};
        if (e.proto==="tcp"||e.proto==="udp") e.port = rnd(4) ? pick(PORTS[e.proto])[0] : null; }
      L.push(e); }
    if (!L.some(e=>e.action==="permit")) L[L.length-1].action = "permit";   // real lists permit something — an all-deny list blocks everything
    if (!ext){ // IOS refuses a host line that an earlier line already covers — real lists put host lines first
      L.sort((a,b)=>(a.src.kind==="host" ? 0 : 1) - (b.src.kind==="host" ? 0 : 1)); L.forEach((e,i)=>e.seq = (i+1)*10);
      if (L.some((e,i)=>e.src.kind==="host" && L.slice(0,i).some(f=>f.src.kind==="host" && f.src.ip===e.src.ip))) return GEN.aclmatch(); }
    if (new Set(L.map(e=>aceText(e, ext).slice(4))).size < L.length) return GEN.aclmatch();
    // a packet aimed at one line (it may still be caught by an earlier one — that's the point)
    const t = rnd(L.length + 1), pk = {};
    if (t < L.length){ const e = L[t]; pk.src = inSpec(e.src) ?? (site + rnd(65536))>>>0;
      if (ext){ pk.proto = e.proto==="ip" ? pick(["tcp","udp","icmp"]) : e.proto; pk.dst = inSpec(e.dst) ?? (lan(50) + 10 + rnd(20))>>>0;
        if (pk.proto!=="icmp") pk.dport = e.port && e.proto===pk.proto ? e.port : pick(PORTS[pk.proto])[0]; } }
    else { pk.src = (ipNum(`172.${16 + rnd(16)}.${rnd(256)}.0`) + 1 + rnd(250))>>>0; if (ext){ pk.proto = pick(["tcp","udp","icmp"]); pk.dst = (lan(50) + 10 + rnd(20))>>>0; if (pk.proto!=="icmp") pk.dport = pick(PORTS[pk.proto])[0]; } }
    if (pk.proto==="icmp") pk.icmp = 8;
    const hit = L.find(e=>!aceHit(e, ext, pk)), name = ext ? pick(["WEB-IN","SRV-PROTECT","BRANCH-IN","EDGE-FILTER"]) : pick(["STAFF-OUT","HR-ONLY","VTY-ADMINS","LAB-BLOCK"]);
    const seqA = hit ? String(hit.seq) : "none", actA = hit ? hit.action : "deny";
    return { q:`On this router, ${pktText(pk, ext)} meets the list below. Which line matches first, and what happens to the packet?`,
      ex:`ip access-list ${ext ? "extended" : "standard"} ${name}\n${L.map(e=>aceText(e, ext)).join("\n")}`, acl:{ext, name, lines:L.map(e=>aceText(e, ext).trim())}, pkt:Object.assign({}, pk, {src:ipStr(pk.src), dst:pk.dst!=null ? ipStr(pk.dst) : undefined}),
      fields:[{label:"First matching line (10, 20 … or none)", a:seqA, check:v=>hit ? norm(v).replace(/^line/,"")===seqA : oneOf(v, ["none","implicit","implicitdeny","no","0","-"])},
              {label:"permit / deny", a:actA, check:v=>norm(v).startsWith(actA)}],
      why:whyAcl(L, ext, pk) + (ext ? "" : " (A standard ACL looks only at the source address.)") }; },
  // one ACE for a range: address + wildcard
  aclwild(){ const k = 2 + rnd(11), size = 2**k, A = 1 + rnd(200), site = ipNum(`10.${A}.0.0`), base = (site + size*rnd(65536/size))>>>0, end = (base + size - 1)>>>0, wc = ipStr(size-1);
    return { q:`Write the address and wildcard mask for one ACE that matches exactly ${ipStr(base)} – ${ipStr(end)} (${size} addresses).`, base:ipStr(base), size,
      fields:[{label:"Address", a:ipStr(base), check:v=>{ const x = v.trim(); if (!/^\d+\.\d+\.\d+\.\d+$/.test(x)) return false; return ((ipNum(x) & ~(size-1))>>>0)===base && ipNum(x) <= end; }},
              {label:"Wildcard", a:wc, check:v=>v.trim()===wc}],
      why:`The range holds ${size} = 2^${k} addresses, so the wildcard is ${size} − 1 = ${size-1}, written across the octets as ${wc} (0 = must match, 255 = any). It works only because ${ipStr(base)} is a multiple of ${size} — the block starts on a boundary. Write the first address: ${ipStr(base)} ${wc}.` }; },
  // standard near the destination, extended near the source
  aclplace(){ const city = [["R-LOS","R-IBD","R-ABJ"],["R-KAN","R-KAD","R-JOS"],["R-PHC","R-OWR","R-ENU"]][rnd(3)], ext = rnd(2)===0, fwd = rnd(2)===0;
    const [a, , c] = city, src = fwd ? a : c, dst = fwd ? c : a, srcLan = fwd ? "LAN-A" : "LAN-C", dstLan = fwd ? "LAN-C" : "LAN-A";
    const router = ext ? src : dst, dir = ext ? "in" : "out";
    return { q:`Three routers in a line: ${city[0]} — ${city[1]} — ${city[2]}. LAN-A sits on ${city[0]} G0/0; LAN-C sits on ${city[2]} G0/0; the links between routers use G0/1 and G0/2. A ${ext ? "named extended" : "standard"} ACL must stop ${srcLan} hosts reaching ${ext ? "the web server on " + dstLan : dstLan}, and everything else must keep working. Following Cisco's placement guideline, where does it go?`,
      ext, src, dst,
      fields:[{label:"Router", a:router, check:v=>norm(v)===router.toLowerCase()}, {label:"Interface", a:"G0/0", check:v=>oneOf(v, ["g0/0","gi0/0","gigabitethernet0/0"])}, {label:"in / out", a:dir, check:v=>norm(v)===dir}],
      why: ext ? `An extended ACL can name the source AND the destination, so it can go close to the source without blocking anything else: on ${src}, inbound on G0/0 (${srcLan}'s gateway interface). The unwanted traffic is dropped before it crosses any WAN link.`
               : `A standard ACL matches only the source. Put it near the source and it would block ${srcLan} from everywhere, so it goes close to the destination: on ${dst}, outbound on G0/0 — the interface that leads into ${dstLan}.` }; },
  // port security: what happens to this frame?
  psecviol(){ const max = 1 + rnd(3), have = rnd(max + 1), mode = pick(["shutdown","restrict","protect"]), known = have > 0 && rnd(3)===0;
    let fwd, state = "up", counter = false, story;
    if (known){ fwd = true; story = "The frame's source MAC is already one of the port's secure addresses, so it's simply forwarded — no violation."; }
    else if (have < max){ fwd = true; story = `The port has ${have} of ${max} secure address${max>1?"es":""}, so the new MAC is learned as a secure address and the frame is forwarded — no violation.`; }
    else { fwd = false; counter = mode!=="protect"; state = mode==="shutdown" ? "err-disabled" : "up";
      story = `The port already has its maximum of ${max} secure address${max>1?"es":""}, so a new MAC is a violation. ${mode==="shutdown" ? "Shutdown mode (the default): the frame is dropped, the port goes err-disabled, the violation counter goes up and %PORT_SECURITY-2-PSECURE_VIOLATION is logged." : mode==="restrict" ? "Restrict mode: the frame is dropped, the port stays up, the violation counter goes up and the violation is logged." : "Protect mode: the frame is dropped silently — the port stays up, nothing is counted and nothing is logged."}`; }
    return { q:`An access port has port security with maximum ${max} and violation ${mode}. It currently holds ${have} secure MAC address${have===1?"":"es"}. A frame arrives from ${known ? "a MAC that is one of them" : "a MAC that is NOT one of them"}. What happens?`, max, have, mode, known,
      fields:[{label:"Frame forwarded? (yes/no)", a:fwd ? "yes" : "no", check:v=>yn(v, fwd)}, {label:"Port state afterwards (up / err-disabled)", a:state, check:v=>norm(v).replace(/[^a-z-]/g,"").replace(/^errdisabled$/,"err-disabled")===state || (state==="up" && oneOf(v, ["secure-up","connected"]))},
              {label:"Violation counter goes up? (yes/no)", a:counter ? "yes" : "no", check:v=>yn(v, counter)}], why:story }; },
  // DHCP snooping: forwarded or dropped?
  snoopdrop(){ const msg = pick(["Discover","Offer","Request","Ack","NAK","Release","Decline","Inform"]), trusted = rnd(3)===0, server = ["Offer","Ack","NAK"].includes(msg);
    const opt82 = !trusted && ["Discover","Request"].includes(msg) && rnd(4)===0, relMove = !trusted && ["Release","Decline"].includes(msg) && rnd(2)===0;
    let drop = false, why;
    if (trusted){ why = `Trusted ports are not checked — the uplink towards the real DHCP server is trusted, so the ${msg} is forwarded.`; }
    else if (server){ drop = true; why = `A ${msg} is a SERVER message. Only trusted ports may carry server messages, so on an untrusted port it's dropped — that's what stops a rogue DHCP server.`; }
    else if (opt82){ drop = true; why = `A client message arriving on an untrusted port that already carries option 82 (inserted by some other device) is dropped by default — the switch won't accept relay information from an untrusted port.`; }
    else if (relMove){ drop = true; why = `A ${msg} is only accepted on the port where the binding table says that client lives; arriving on a different untrusted port, it's dropped (someone else trying to release the client's address).`; }
    else why = `A ${msg} is a CLIENT message, so it's allowed on an untrusted port (the switch checks it — e.g. the source MAC must match the client hardware address by default — and forwards it).`;
    return { q:`DHCP snooping is on for the VLAN. A DHCP ${msg} arrives on ${trusted ? "a TRUSTED port (the uplink)" : "an UNTRUSTED access port"}${opt82 ? ", already carrying option 82 from another device" : ""}${relMove ? ", but the binding table lists that client on a different port" : ""}. Forwarded or dropped?`, msg, trusted, opt82, relMove,
      fields:[{label:"forwarded / dropped", a:drop ? "dropped" : "forwarded", check:v=>norm(v).startsWith(drop ? "drop" : "forward")}], why }; },
  // DAI: forward or drop this ARP?
  daicheck(){ const A = 1 + rnd(200), mac = () => [rnd(65536),rnd(65536),rnd(65536)].map(x=>x.toString(16).padStart(4,"0")).join(".");
    const binds = [0,1].map(i=>({mac:mac(), ip:`10.${A}.20.${10 + i*7 + rnd(5)}`, port:`Gi0/${3+i}`}));
    const trusted = rnd(5)===0, useAcl = rnd(2)===0, statik = useAcl && rnd(2)===0, aclDeny = useAcl && rnd(3)===0;
    const aclEntry = {action: aclDeny ? "deny" : "permit", ip:`10.${A}.20.5`, mac:mac()};
    const kind = rnd(4);   // 0 bound host, 1 bound IP with the wrong MAC, 2 the ACL's host, 3 an unknown host
    let s = kind===0 ? {ip:binds[0].ip, mac:binds[0].mac} : kind===1 ? {ip:binds[1].ip, mac:mac()} : kind===2 && useAcl ? {ip:aclEntry.ip, mac:aclEntry.mac} : {ip:`10.${A}.20.${100 + rnd(100)}`, mac:mac()};
    if (aclDeny && kind===0 && rnd(2)===0){ aclEntry.ip = binds[0].ip; aclEntry.mac = binds[0].mac; }   // a deny for a host that also has a binding
    const aclHit = useAcl && aclEntry.ip===s.ip && aclEntry.mac===s.mac, bindHit = binds.some(b=>b.ip===s.ip && b.mac===s.mac);
    let fwd, why;
    if (trusted){ fwd = true; why = "The ARP arrives on a trusted port, so DAI doesn't inspect it."; }
    else if (aclHit && aclEntry.action==="permit"){ fwd = true; why = "DAI checks the ARP ACL first: a permit line matches this IP + MAC, so it's forwarded."; }
    else if (aclHit){ fwd = false; why = "DAI checks the ARP ACL first: an explicit deny line matches this IP + MAC, so it's dropped — even though a binding might have allowed it."; }
    else if (statik){ fwd = false; why = "The ARP ACL is applied with static, so the ACL alone decides — nothing matched, so it's dropped (the DHCP snooping bindings are not consulted)."; }
    else if (bindHit){ fwd = true; why = `No ARP ACL line decides it, so DAI looks in the DHCP snooping binding table: ${s.ip} is bound to ${s.mac} — the sender is telling the truth, so it's forwarded.`; }
    else { fwd = false; why = `No ARP ACL line decides it, and the binding table has no entry pairing ${s.ip} with ${s.mac}${binds.some(b=>b.ip===s.ip) ? " (that IP belongs to a different MAC)" : ""} — the ARP is dropped and %SW_DAI-4-DHCP_SNOOPING_DENY is logged.`; }
    return { q:`DAI is on for VLAN 20. Binding table: ${binds.map(b=>`${b.ip} ↔ ${b.mac} (${b.port})`).join("; ")}.${useAcl ? ` ARP ACL STATIC-HOSTS has: ${aclEntry.action} ip host ${aclEntry.ip} mac host ${aclEntry.mac}, applied with ip arp inspection filter STATIC-HOSTS vlan 20${statik ? " static" : ""}.` : " No ARP ACL is applied."} An ARP arrives on ${trusted ? "a TRUSTED uplink" : "an untrusted access port"} saying "${s.ip} is at ${s.mac}". Forwarded or dropped?`,
      binds, trusted, useAcl, statik, aclEntry, sender:s,
      fields:[{label:"forwarded / dropped", a:fwd ? "forwarded" : "dropped", check:v=>norm(v).startsWith(fwd ? "forward" : "drop")}], why }; },
  // which password type is this, and can it be reversed?
  pwtype(){ const salt = n => Array.from({length:n}, ()=>"./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"[rnd(64)]).join("");
    const plain = pick(["Lagos-Ofc26","Netops!2026","Bank-Sw1tch","Kano#Lab42"]), user = pick(["netops","tobi","amaka","admin2"]);
    const X = "dsfd;kfoA,.iyewrkldJKDHSUBsgvca69834ncxv9873254k;fg87", s7 = rnd(16);
    const t7 = String(s7).padStart(2,"0") + [...plain].map((c,i)=>(c.charCodeAt(0) ^ X.charCodeAt((s7+i)%53)).toString(16).toUpperCase().padStart(2,"0")).join("");
    const opts = [[`enable secret 9 $9$${salt(14)}$${salt(43)}`, "9"], [`enable secret 5 $1$${salt(4)}$${salt(22)}`, "5"], [`username ${user} secret 8 $8$${salt(14)}$${salt(43)}`, "8"],
      [`username ${user} secret 9 $9$${salt(14)}$${salt(43)}`, "9"], [`enable password 7 ${t7}`, "7"], [`username ${user} password 7 ${t7}`, "7"], [`username ${user} password 0 ${plain}`, "0"], [` password 7 ${t7}   (under line vty 0 4)`, "7"], [`enable password ${plain}`, "0"]];
    const [line, type] = pick(opts), rev = type==="0" || type==="7";
    const W = {"0":"Type 0 is plain text — anyone who sees the config reads it.", "7":"Type 7 is Cisco's old reversible encoding (service password-encryption): free tools turn it back into the password in a second — it only stops shoulder-surfing.",
      "5":"Type 5 is a salted MD5-crypt hash ($1$): one-way, but old and fast to guess — prefer 8 or 9.", "8":"Type 8 is PBKDF2-SHA-256 ($8$): a salted, slow one-way hash.", "9":"Type 9 is scrypt ($9$): a salted one-way hash that is deliberately slow and memory-hungry — the strongest choice."};
    return { q:`In a running-config you read:  ${line}  — which password type is it, and can someone who copies the config turn it back into the password?`, line, type,
      fields:[{label:"Type (0, 5, 7, 8 or 9)", a:type, check:v=>norm(v).replace(/^type/,"")===type}, {label:"Reversible? (yes/no)", a:rev ? "yes" : "no", check:v=>yn(v, rev)}],
      why:W[type] + (type==="0" && !/ 0 /.test(line) ? " (No number after 'password' also means type 0.)" : "") }; },
  // RADIUS or TACACS+?
  radtac(){ const S = [["uses UDP (ports 1812 and 1813)", "radius"], ["uses TCP port 49", "tacacs+"], ["hides only the user's password in the request", "radius"], ["protects the whole body of every packet", "tacacs+"],
      ["combines authentication and authorization in one exchange", "radius"], ["keeps authentication, authorization and accounting separate", "tacacs+"], ["can authorize each command an admin types on a router", "tacacs+"],
      ["is what 802.1X port authentication and enterprise Wi-Fi normally talk to", "radius"], ["was created by Cisco and is mainly used for device administration", "tacacs+"], ["is the open standard in RFC 2865", "radius"],
      ["defaults to ports 1645/1646 on older Cisco configs when no ports are given", "radius"], ["is the usual choice for logging which admin ran which command", "tacacs+"]];
    const [stmt, ans] = pick(S);
    return { q:`Which AAA protocol ${stmt}?`, stmt, ans, fields:[{label:"radius / tacacs+", a:ans, check:v=>{ const x = norm(v).replace(/plus$/,"+"); return ans==="radius" ? x==="radius" : (x==="tacacs+"||x==="tacacs"); }}],
      why: ans==="radius" ? "RADIUS: UDP 1812 authentication / 1813 accounting (legacy 1645/1646), hides only the password, combines authN + authZ, open standard — the protocol of network access (802.1X, Wi-Fi, VPN users)."
                          : "TACACS+: TCP 49, protects the whole packet body, keeps the three A's separate, and can authorize and account every command — the protocol of device administration." }; },
  // which part of the CIA triad does the incident hit?
  cia(){ const S = [["A laptop with unencrypted payroll files is stolen from a car.", "confidentiality"], ["A flood of traffic takes the bank's website offline for two hours.", "availability"],
      ["Someone changes the account number on an invoice before it is paid.", "integrity"], ["An engineer's password is read over the shoulder in a café.", "confidentiality"],
      ["A ransomware attack encrypts the file server so nobody can open anything.", "availability"], ["A tampered firmware image is loaded onto a core switch.", "integrity"],
      ["A misconfigured share lets every guest read the HR folder.", "confidentiality"], ["A single unprotected power supply fails and the only router goes down.", "availability"],
      ["An attacker alters log entries to hide what they did.", "integrity"], ["Customer records are emailed to the wrong company.", "confidentiality"],
      ["A routing change by mistake black-holes traffic to the branch.", "availability"], ["A DNS record is changed so staff are sent to a fake login page.", "integrity"]];
    const [stmt, ans] = pick(S);
    return { q:`Which part of the CIA triad does this incident hit most directly? "${stmt}"`, stmt, ans, fields:[{label:"confidentiality / integrity / availability", a:ans, check:v=>{ const x = norm(v); return x===ans || x===ans[0]; }}],
      why: ans==="confidentiality" ? "Confidentiality = only the right people can READ the data. Here data was exposed to people who shouldn't see it." : ans==="integrity" ? "Integrity = data and systems are not CHANGED without authority. Here something was altered." : "Availability = the service is THERE when people need it. Here users lost access." }; },
};
const LABELS = { aclmatch:"ACL — first match", aclwild:"ACL — range to wildcard", aclplace:"ACL — placement", psecviol:"Port security — what happens", snoopdrop:"DHCP snooping — forwarded or dropped", daicheck:"DAI — forwarded or dropped", pwtype:"Password types", radtac:"RADIUS or TACACS+", cia:"CIA triad" };
Object.assign(D.GEN, GEN); Object.assign(D.LABELS, LABELS); for (const k of Object.keys(GEN)) if (!D.types.includes(k)) D.types.push(k);
D._secSeed = s => { seedState = s; }; D.SEC = { types:Object.keys(GEN), ipNum, ipStr };
})();
