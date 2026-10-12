// Ladder Lab — Cisco IOS engine v2 (SIM.ios2Env). Behaves like a real Catalyst switch / ISR router CLI:
// abbreviations, ambiguity, `?` help, Tab completion, real error messages with the ^ marker, the
// "Translating..." typo trap, [confirm] prompts, line passwords and login, SSH prerequisites, VLANs,
// access/trunk ports, SVIs, speed/duplex, accurate running-config, reload that loses unsaved work.
// Physical facts (is a cable plugged in? what did the switch learn? can that IP be reached?) come from
// `hooks`, which the hands-on bench (bench.js) provides; without a bench sensible defaults are used.
(function(){
const tokens = s => s.trim().split(/\s+/).filter(Boolean);
const ipRe = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const toInt = ip => ip.split(".").reduce((a,o)=>(a*256)+(+o),0);
const maskOk = m => { if (!ipRe.test(m)) return false; const n = toInt(m); const inv = 0xFFFFFFFF - n; return n!==0 && ((inv+1) & inv)===0; };
const maskLen = m => m.split(".").reduce((a,o)=>a+((+o).toString(2).match(/1/g)||[]).length,0);
const netOf = (ip,m) => { const a = toInt(ip), b = toInt(m); return [24,16,8,0].map(s=>Math.floor(((a & b)>>>0)/2**s)%256).join("."); };
const sameNet = (a,b,m) => netOf(a,m)===netOf(b,m);
const pad = (s,n) => String(s).padEnd(n);
const HASHREV = {};   // every hash this engine prints → the secret it came from (so a restored backup still logs in)
const fakeHash = (s, t) => t==="7" ? [...String(s)].map((c,i)=>((c.charCodeAt(0)^(0x1F+i))&255).toString(16).toUpperCase().padStart(2,"0")).join("").slice(0,22).padEnd(14,"0")
  : "$9$" + [...String(s)+"salt"].map((c,i)=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./"[(c.charCodeAt(0)*7+i*13)%64]).join("").slice(0,14) + "$" + [...String(s)].map((c,i)=>"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[(c.charCodeAt(0)*31+i*17)%62]).join("").padEnd(43,"x").slice(0,43);

const HELP = {
  ospf:"OSPF information", protocols:"IP routing protocol process parameters and statistics", standby:"HSRP information", router:"Enable a routing process", network:"Enable routing on an IP network",
  "passive-interface":"Suppress routing updates on an interface", "router-id":"router-id for this OSPF process", "default-information":"Control distribution of default information",
  "auto-cost":"Calculate OSPF interface cost according to bandwidth", bandwidth:"Set bandwidth informational parameter", neighbor:"Neighbor list", database:"Database summary",
  enable:"Turn on privileged commands", disable:"Turn off privileged commands", exit:"Exit from the EXEC", logout:"Exit from the EXEC", ping:"Send echo messages",
  show:"Show running system information", configure:"Enter configuration mode", copy:"Copy from one file to another", write:"Write running configuration to memory, network, or terminal",
  reload:"Halt and perform a cold restart", erase:"Erase a filesystem", clear:"Reset functions", traceroute:"Trace route to destination", terminal:"Set terminal line parameters",
  hostname:"Set system's network name", interface:"Select an interface to configure", vlan:"Vlan commands", line:"Configure a terminal line", username:"Establish User Name Authentication",
  banner:"Define a login banner", service:"Modify use of network based services", "no":"Negate a command or set its defaults", ip:"Global IP configuration subcommands", crypto:"Encryption module",
  end:"Exit from configure mode", do:"To run exec commands in config mode", cdp:"Global CDP configuration subcommands",
  description:"Interface specific description", shutdown:"Shutdown the selected interface", speed:"Configure speed operation.", duplex:"Configure duplex operation.", switchport:"Set switching mode characteristics",
  password:"Set a password", login:"Enable password checking", transport:"Define transport protocols for line", "exec-timeout":"Set the EXEC timeout", "logging":"Modify message logging facilities", name:"Ascii name of the VLAN",
  "running-config":"Current operating configuration", "startup-config":"Contents of startup configuration", version:"System hardware and software status", interfaces:"Interface status and configuration",
  "mac":"MAC configuration", "mac-address-table":"MAC forwarding table", arp:"ARP table", cdp_s:"CDP information", history:"Display the session command history", users:"Display information about terminal lines",
  route:"IP routing table", "default-gateway":"Specify default gateway (if not routing IP)", "domain-name":"Define the default domain name", "domain-lookup":"Enable IP Domain Name System hostname translation", ssh:"Configure ssh options",
};

function ios2Env(opts){
  opts = opts || {};
  const kind = opts.kind==="router" ? "router" : "switch";
  const hooks = Object.assign({
    linkUp: name => !st.intfs[name].shut,                 // no bench: pretend every port is cabled
    ping: ip => ({ ok: defaultReach(ip), firstMiss:false }),
    mac: () => [], clearMac: () => {}, arp: () => [], cdp: () => [], lldp: () => [], counters: () => ({}),
    now: () => Date.UTC(2026, 9, 12, 8, 30, 0), emit: () => {}, ntp: () => null, dns: () => null, tftpPut: () => ({ok:false}), tftpGet: () => ({ok:false}),
  }, opts.hooks||{});
  const physical = opts.ports || (kind==="router" ? ["GigabitEthernet0/0","GigabitEthernet0/1","GigabitEthernet0/2"]
                                                  : [...Array(8)].map((_,i)=>"GigabitEthernet0/"+(i+1)).concat(["GigabitEthernet0/9","GigabitEthernet0/10"]));
  const baseMac = opts.mac || (kind==="router" ? "0c1a.2b00" : "00aa.bb00");
  const factory = () => {
    const intfs = {};
    // Catalyst access ports default to "switchport mode dynamic auto" (DTP); router ports are routed and start shut
    physical.forEach((n,i)=>{ intfs[n] = { ip:null, mask:null, shut: kind==="router", desc:"", mode: kind==="router"?"routed":"dynamic", dtp:"auto", nonegotiate:false, vlan:1, allowed:null, native:1, voiceVlan:null, speed:"auto", duplex:"auto", cdp:true, stp:{}, channel:null, errdis:null, mac: `${baseMac}.${String(i+1).padStart(4,"0")}` }; });
    if (kind==="switch") intfs["Vlan1"] = { ip:null, mask:null, shut:true, desc:"", mode:"svi", vlan:1, cdp:false, mac:`${baseMac}.00ff` };
    return { host: opts.host || (kind==="router"?"Router":"Switch"), enableSecret:null, enablePassword:null, servicePwEnc:false, banner:null,
      lines:{ con:{password:null, login:false, loginLocal:false, timeout:null, sync:false}, vty:{password:null, login:false, loginLocal:false, transport:"all", timeout:null, sync:false} },
      users:{}, domain:null, domainLookup:true, rsa:0, sshVer:null, defaultGw:null, routes:[], cdpRun:true, lldpRun:false,
      stpMode:"rapid-pvst", stpPrio:{}, stpOff:{}, pfDefault:false, bpduDefault:false, ipRouting:false, vtpMode:"server", vtpDomain:"", lbMethod:null, ospf:null, v6routing:false, routes6:[], serviceDhcp:true,
      logHosts:[], logTrap:6, logBuffered:null, logConsole:null, ntpServers:[], ntpMaster:null, tz:null, iosHosts:{}, nameServers:[], dnsServer:false,
      snmp:{communities:{}, location:null, contact:null, hosts:[], traps:false},
      acl: window.ACL ? window.ACL.store() : {lists:{}}, dhcp: window.DHCP ? window.DHCP.store() : {excluded:[], pools:{}, bindings:[], conflicts:[]}, nat: window.NAT ? window.NAT.store() : {pools:{}, statics:[], rules:[], table:[], hits:0, misses:0, expired:0},
      vlans: kind==="switch" ? {1:"default", 1002:"fddi-default", 1003:"token-ring-default", 1004:"fddinet-default", 1005:"trnet-default"} : {}, intfs };
  };
  const st = Object.assign(factory(), { kind, mode:"user", cur:null, curList:null, curLine:null, curVlan:null, history:[], savedOnce:false, startup:null, pending:null, noEcho:false, motd: opts.motd!=null?opts.motd:"" });
  if (opts.setup) opts.setup(st);
  function defaultReach(ip){ for (const i of Object.values(st.intfs)) if (i.ip && !i.shut){ if (i.ip===ip) return true; if (sameNet(i.ip, ip, i.mask)){ const len = maskLen(i.mask); if (len>=31) return true; return ip!==netOf(i.ip, i.mask) && ip!==bcastOf(i.ip, i.mask); } } return false; }
  function bcastOf(ip, m){ const a = toInt(ip), b = toInt(m); const x = ((a & b) + (0xFFFFFFFF - b)) >>> 0; return [24,16,8,0].map(s=>Math.floor(x/2**s)%256).join("."); }
  const cfgKeys = Object.keys(factory());
  // live state (DHCP leases, NAT translations, ACL match counters) is not configuration: a saved config and a reload never carry it
  const stripLive = o => { if (o.dhcp){ o.dhcp.bindings = []; o.dhcp.conflicts = []; for (const p of Object.values(o.dhcp.pools||{})) delete p.index; }
    if (o.nat){ o.nat.table = []; o.nat.hits = 0; o.nat.misses = 0; o.nat.expired = 0; for (const p of Object.values(o.nat.pools||{})){ p.used = {}; p.misses = 0; } }
    if (o.acl) for (const l of Object.values(o.acl.lists||{})) for (const e of l.entries) if (e.hits) e.hits = 0;
    for (const i of Object.values(o.intfs||{})) if (i.dhcpClient){ i.ip = null; i.mask = null; delete i.dhcpGw; delete i.dhcpLease; }
    return o; };
  st.resolveName = n => resolveName(n); st.sevOf = w => sevOf(w); st.clockText = () => clockText();
  // IOS DHCP client identifier "cisco-<mac>-<short interface>"; show dhcp lease dumps it as upper-case hex, 16 bytes a line
  const cidText = n => "cisco-" + st.intfs[n].mac + "-" + short(n);
  const cidHex = n => [...cidText(n)].map(c=>c.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")).join("").match(/.{1,32}/g).join("\n" + " ".repeat(23));
  const ownIps = () => ifNames().map(n=>st.intfs[n].ip).filter(Boolean);
  const natCtx = () => ({ ifAddr: n => (st.intfs[n]||{}).ip || null });
  st.natCtx = natCtx;
  st.liveSig = () => JSON.stringify(Object.entries(st.intfs).filter(([,i])=>i.dhcpClient).map(([n,i])=>[n, i.ip, i.mask, i.dhcpGw||null]));
  st.natIfs = () => ({ ins: ifNames().filter(n=>st.intfs[n].natIn), outs: ifNames().filter(n=>st.intfs[n].natOut) });
  const snapshot = () => stripLive(JSON.parse(JSON.stringify(cfgKeys.reduce((o,k)=>(o[k]=st[k],o),{}))));
  // a key missing from an older save (a setting added since) falls back to the factory default
  const restore = snap => { const f = factory(); for (const k of cfgKeys) st[k] = JSON.parse(JSON.stringify(snap[k] !== undefined ? snap[k] : f[k] !== undefined ? f[k] : null)); };
  if (opts.config) Object.assign(st, opts.config);

  /* ---------- names ---------- */
  function parseIf(raw, create){
    const m = String(raw||"").toLowerCase().match(/^([a-z][a-z-]*)\s*([\d\/.]+)$/); if (!m) return null;
    const [_, p, num] = m; let base = null;
    if ("gigabitethernet".startsWith(p) && p.length>=1) base = "GigabitEthernet";
    else if ("fastethernet".startsWith(p) && p.length>=2) base = "FastEthernet";
    else if ("vlan".startsWith(p) && p.length>=2) base = "Vlan";
    else if ("loopback".startsWith(p) && p.length>=2) base = "Loopback";
    else if ("port-channel".startsWith(p) && p.length>=2) base = "Port-channel";
    if (!base) return null;
    const name = base + num;
    if (st.intfs[name]) return name;
    const dot = num.indexOf(".");
    if (create && base==="GigabitEthernet" && dot>0 && kind==="router"){ const parent = base + num.slice(0,dot), sid = +num.slice(dot+1);
      if (!st.intfs[parent] || !(sid>=1 && sid<=4094)) return null;
      st.intfs[name] = { ip:null, mask:null, shut:false, desc:"", mode:"routed", sub:true, parent, encap:null, encapNative:false, vlan:1, cdp:false, mac: st.intfs[parent].mac }; return name; }
    if (create && base==="Vlan" && kind==="switch" && /^\d+$/.test(num) && +num>=1 && +num<=4094){ st.intfs[name] = { ip:null, mask:null, shut:false, desc:"", mode:"svi", vlan:+num, cdp:false, mac:`${baseMac}.0${num.padStart(3,"0")}` }; return name; }
    if (create && base==="Loopback" && /^\d+$/.test(num)){ st.intfs[name] = { ip:null, mask:null, shut:false, desc:"", mode:"routed", vlan:1, cdp:false, mac:null, loop:true }; return name; }
    return null;
  }
  const short = n => n.replace("GigabitEthernet","Gi").replace("FastEthernet","Fa").replace("Loopback","Lo").replace("Port-channel","Po");
  const sortIf = (a,b) => { const na = a.match(/\d+/g).map(Number), nb = b.match(/\d+/g).map(Number); const ta = a.replace(/[\d\/.]+/g,""), tb = b.replace(/[\d\/.]+/g,""); if (ta!==tb) return ta==="Vlan"?1:tb==="Vlan"?-1:ta<tb?-1:1; for (let i=0;i<Math.max(na.length,nb.length);i++) if ((na[i]||0)!==(nb[i]||0)) return (na[i]||0)-(nb[i]||0); return 0; };
  const ifNames = () => Object.keys(st.intfs).sort(sortIf);

  /* ---------- state helpers ---------- */
  const up = n => { const i = st.intfs[n]; if (!i || i.shut || i.errdis) return false; if (i.mode==="svi") return svIUp(i.vlan); if (i.loop) return true;
    if (i.sub) return up(i.parent); if (n.startsWith("Port-channel")) return !!hooks.linkUp(n); return !!hooks.linkUp(n); };
  // DTP: what a port is actually doing, given its own mode and its neighbour's (no bench ⇒ dynamic ports stay access)
  st.opMode = n => { const i = st.intfs[n]; if (!i) return null; if (i.mode==="routed"||i.mode==="svi"||i.sub||i.loop) return "routed";
    if (i.mode==="trunk") return "trunk"; if (i.mode==="access") return "access";
    const pr = hooks.peer ? hooks.peer(n) : null; if (!pr || pr.kind!=="switch" || pr.mode==="routed") return "access";
    if (pr.mode==="trunk") return pr.nonegotiate ? "access" : "trunk";
    if (pr.mode==="dynamic") return (i.dtp==="desirable" || pr.dtp==="desirable") ? "trunk" : "access";
    return "access"; };
  const isTrunk = n => st.opMode(n)==="trunk";
  function svIUp(v){ if (!st.vlans[v]) return false; return physical.some(n=>{ const i = st.intfs[n]; return !i.shut && !i.errdis && hooks.linkUp(n) && (isTrunk(n) ? (!i.allowed || i.allowed.includes(v)) : st.opMode(n)==="access" && (i.vlan===v || i.voiceVlan===v)); }); }
  const hasVlan = v => kind==="switch" && !!st.vlans[v];
  const hashOf = (p, t) => { const h = fakeHash(p, t); HASHREV[h] = p; return h; };
  const unhash = v => { const m = String(v).match(/^([05789]) (\S+)$/); return m ? (HASHREV[m[2]]!=null ? HASHREV[m[2]] : m[2]) : v; };
  const pw = (p, type7) => p==null ? null : st.servicePwEnc ? `7 ${hashOf(p,"7")}` : p;

  const compactList = arr => { const a = [...arr].sort((x,y)=>x-y), out = []; for (let k=0;k<a.length;k++){ let j = k; while (j+1<a.length && a[j+1]===a[j]+1) j++; out.push(j>k ? `${a[k]}-${a[j]}` : `${a[k]}`); k = j; } return out.join(","); };
  const activeVlans = () => Object.keys(st.vlans).map(Number).filter(v=>v<1002||v>1005).sort((a,b)=>a-b);
  function trunkTable(){
    const tr = Object.keys(st.intfs).filter(n=>!st.intfs[n].channel && (physical.includes(n)||n.startsWith("Port-channel")) && isTrunk(n) && up(n)).sort(sortIf);
    if (!tr.length) return "";
    const modeOf = n => { const i = st.intfs[n]; return i.mode==="trunk" ? "on" : i.dtp==="desirable" ? "desirable" : "auto"; };
    const allowed = n => st.intfs[n].allowed || [...Array(4094)].map((_,k)=>k+1);
    const fwd = (n, v) => { const s = hooks.stpState ? hooks.stpState(n, v) : "FWD"; return s==="FWD"; };
    let o = "Port        Mode             Encapsulation  Status        Native vlan\n";
    for (const n of tr) o += pad(short(n),12) + pad(modeOf(n),17) + pad("802.1q",15) + pad("trunking",14) + st.intfs[n].native + "\n";
    o += "\nPort        Vlans allowed on trunk\n"; for (const n of tr) o += pad(short(n),12) + (compactList(allowed(n))||"none") + "\n";
    o += "\nPort        Vlans allowed and active in management domain\n"; for (const n of tr) o += pad(short(n),12) + (compactList(allowed(n).filter(v=>activeVlans().includes(v)))||"none") + "\n";
    o += "\nPort        Vlans in spanning tree forwarding state and not pruned\n"; for (const n of tr) o += pad(short(n),12) + (compactList(allowed(n).filter(v=>activeVlans().includes(v) && fwd(n,v)))||"none") + "\n";
    return o.trimEnd();
  }
  function switchportInfo(n){
    const i = st.intfs[n]; if (kind!=="switch" || !i || i.mode==="svi" || i.loop) return "% Invalid interface";
    if (i.mode==="routed") return `Name: ${short(n)}\nSwitchport: Disabled`;
    const adm = i.mode==="trunk" ? "trunk" : i.mode==="access" ? "static access" : `dynamic ${i.dtp}`, op = st.opMode(n)==="trunk" ? "trunk" : up(n) ? "static access" : "down";
    return [`Name: ${short(n)}`, "Switchport: Enabled", `Administrative Mode: ${adm}`, `Operational Mode: ${op}`, "Administrative Trunking Encapsulation: dot1q", `Operational Trunking Encapsulation: ${op==="trunk"?"dot1q":"native"}`,
      `Negotiation of Trunking: ${i.nonegotiate||i.mode==="access"?"Off":"On"}`, `Access Mode VLAN: ${i.vlan} (${st.vlans[i.vlan]||"Inactive"})`, `Trunking Native Mode VLAN: ${i.native} (${st.vlans[i.native]||"Inactive"})`,
      `Voice VLAN: ${i.voiceVlan?`${i.voiceVlan} (${st.vlans[i.voiceVlan]||"Inactive"})`:"none"}`, "Administrative private-vlan host-association: none", `Trunking VLANs Enabled: ${i.allowed?compactList(i.allowed):"ALL"}`, "Pruning VLANs Enabled: 2-1001", "Capture Mode Disabled"].join("\n");
  }
  function stpShow(onlyVlan){
    if (kind!=="switch") return "% Invalid input detected at '^' marker.";
    const vls = activeVlans().filter(v=>onlyVlan==null || v===+onlyVlan);
    const blocks = [];
    for (const v of vls){
      if (st.stpOff[v]){ if (onlyVlan!=null) blocks.push(`Spanning tree instance(s) for vlan ${v} does not exist.`); continue; }
      const d = hooks.stp ? hooks.stp(v) : null; if (!d || !d.ports.length){ if (onlyVlan!=null) blocks.push(`Spanning tree instance(s) for vlan ${v} does not exist.`); continue; }
      const proto = st.stpMode==="rapid-pvst" ? "rstp" : "ieee";
      const L = [`VLAN${String(v).padStart(4,"0")}`, `  Spanning tree enabled protocol ${proto}`, `  Root ID    Priority    ${d.root.prio}`, `             Address     ${d.root.mac}`];
      if (d.isRoot) L.push("             This bridge is the root"); else L.push(`             Cost        ${d.rootCost}`, `             Port        ${d.rootPortNum} (${d.rootPort})`);
      L.push("             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec", "", `  Bridge ID  Priority    ${d.bridge.prio}  (priority ${d.bridge.prio - v} sys-id-ext ${v})`, `             Address     ${d.bridge.mac}`,
        "             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec", "             Aging Time  300 sec", "", "Interface           Role Sts Cost      Prio.Nbr Type", "------------------- ---- --- --------- -------- --------------------------------");
      for (const r of d.ports) L.push(pad(short(r.name),20) + pad(r.role,5) + pad(r.state,4) + pad(r.cost,10) + pad(r.prio,9) + r.type);
      blocks.push(L.join("\n"));
    }
    return blocks.join("\n\n") || "No spanning tree instance exists.";
  }
  function etherSummary(){
    const groups = hooks.ether ? hooks.ether() : (()=>{ const g = {}; for (const n of ifNames()){ const i = st.intfs[n]; if (!i.channel) continue; const x = g[i.channel.group] = g[i.channel.group] || {group:i.channel.group, proto:["active","passive"].includes(i.channel.mode)?"LACP":["desirable","auto"].includes(i.channel.mode)?"PAgP":"-", up:false, members:[]}; x.members.push({name:n, flag: up(n) ? "I" : "D"}); } return Object.values(g); })();
    let o = "Flags:  D - down        P - bundled in port-channel\n        I - stand-alone s - suspended\n        H - Hot-standby (LACP only)\n        R - Layer3      S - Layer2\n        U - in use      f - failed to allocate aggregator\n\n        M - not in use, minimum links not met\n        u - unsuitable for bundling\n        w - waiting to be aggregated\n        d - default port\n\n";
    o += `Number of channel-groups in use: ${groups.length}\nNumber of aggregators:           ${groups.length}\n\nGroup  Port-channel  Protocol    Ports\n------+-------------+-----------+-----------------------------------------------\n`;
    for (const g of groups) o += pad(g.group,7) + pad(`Po${g.group}(${g.up?"SU":"SD"})`,14) + pad(g.proto,12) + g.members.map(m=>`${short(m.name)}(${m.flag})`).join("  ") + "\n";
    return o.trimEnd();
  }

  /* ---------- output builders ---------- */
  function runningCfg(){
    const L = ["Building configuration...","","Current configuration : 2104 bytes","!","version 17.9", st.servicePwEnc?"service password-encryption":"no service password-encryption","!",`hostname ${st.host}`,"!"];
    if (st.enableSecret) L.push(`enable secret 9 ${hashOf(st.enableSecret)}`);
    if (st.enablePassword) L.push(`enable password ${pw(st.enablePassword)}`);
    if (st.enableSecret || st.enablePassword) L.push("!");
    for (const [u,v] of Object.entries(st.users)) L.push(`username ${u} ${v.secret?`secret 9 ${hashOf(v.secret)}`:`password ${pw(v.password)}`}`);
    if (st.tz) L.push(`clock timezone ${st.tz.name} ${st.tz.h} ${st.tz.m}`);
    if (!st.domainLookup) L.push("no ip domain lookup");
    if (st.domain) L.push(`ip domain name ${st.domain}`);
    for (const [n, ip] of Object.entries(st.iosHosts)) L.push(`ip host ${n} ${ip}`);
    if (st.nameServers.length) L.push(`ip name-server ${st.nameServers.join(" ")}`);
    if (st.sshVer) L.push(`ip ssh version ${st.sshVer}`);
    if (st.serviceDhcp===false) L.push("no service dhcp");
    { const D = window.DHCP ? window.DHCP.running(st.dhcp) : []; if (D.length) L.push("!", ...D, "!"); }
    if (st.v6routing) L.push("ipv6 unicast-routing"); if (st.v6resolveDefault) L.push("ipv6 route static resolve default");
    if (!st.cdpRun) L.push("no cdp run");
    if (st.lldpRun) L.push("lldp run");
    if (kind==="switch"){ L.push(`spanning-tree mode ${st.stpMode}`); if (st.pfDefault) L.push("spanning-tree portfast default"); if (st.bpduDefault) L.push("spanning-tree portfast bpduguard default"); L.push("spanning-tree extend system-id");
      for (const v of Object.keys(st.stpPrio).map(Number).sort((a,b)=>a-b)) L.push(`spanning-tree vlan ${v} priority ${st.stpPrio[v]}`);
      for (const v of Object.keys(st.stpOff).map(Number).sort((a,b)=>a-b)) if (st.stpOff[v]) L.push(`no spanning-tree vlan ${v}`);
      if (st.vtpMode!=="server") L.push(`vtp mode ${st.vtpMode}`); if (st.ipRouting) L.push("ip routing"); if (st.lbMethod) L.push(`port-channel load-balance ${st.lbMethod}`); }
    L.push("!");
    if (kind==="switch"){ for (const v of Object.keys(st.vlans).map(Number).sort((a,b)=>a-b)) if (v!==1 && (v<1002||v>1005)){ L.push(`vlan ${v}`); if (st.vlans[v]!==`VLAN${String(v).padStart(4,"0")}`) L.push(` name ${st.vlans[v]}`); L.push("!"); } }
    for (const n of ifNames()){
      const i = st.intfs[n]; L.push(`interface ${n}`);
      if (i.desc) L.push(` description ${i.desc}`);
      if (i.sub && i.encap) L.push(` encapsulation dot1Q ${i.encap}${i.encapNative?" native":""}`);
      if (kind==="switch" && !i.sub && i.mode!=="svi" && !i.loop){
        if (i.mode==="routed") L.push(" no switchport");
        else {
          if (i.vlan!==1) L.push(` switchport access vlan ${i.vlan}`);
          if (i.native!==1) L.push(` switchport trunk native vlan ${i.native}`);
          if (i.allowed) L.push(` switchport trunk allowed vlan ${compactList(i.allowed)}`);
          if (i.mode==="access") L.push(" switchport mode access"); else if (i.mode==="trunk") L.push(" switchport mode trunk"); else if (i.dtp==="desirable") L.push(" switchport mode dynamic desirable");
          if (i.nonegotiate) L.push(" switchport nonegotiate");
          if (i.voiceVlan) L.push(` switchport voice vlan ${i.voiceVlan}`);
          if (i.channel) L.push(` channel-group ${i.channel.group} mode ${i.channel.mode}`);
          const t = i.stp||{};
          if (t.portfast) L.push(" spanning-tree portfast"); if (t.bpduguard===true) L.push(" spanning-tree bpduguard enable"); if (t.bpduguard===false) L.push(" spanning-tree bpduguard disable");
          if (t.guard) L.push(` spanning-tree guard ${t.guard}`); if (t.cost) L.push(` spanning-tree cost ${t.cost}`); if (t.prio!=null) L.push(` spanning-tree port-priority ${t.prio}`);
        }
      }
      if (i.bw) L.push(` bandwidth ${i.bw}`);
      if (i.dhcpClient) L.push(" ip address dhcp"); else if (i.ip) L.push(` ip address ${i.ip} ${i.mask}`); else if (i.mode==="svi"||i.mode==="routed") L.push(" no ip address");
      if (i.natIn) L.push(" ip nat inside"); if (i.natOut) L.push(" ip nat outside");
      for (const h of (i.helpers||[])) L.push(` ip helper-address ${h}`);
      if (i.ll) L.push(` ipv6 address ${U(i.ll)} link-local`);
      for (const a of (i.ip6||[])) L.push(a.eui ? ` ipv6 address ${U(I6.mask(I6.parse(a.addr), 64))}/${a.len} eui-64` : ` ipv6 address ${U(a.addr)}/${a.len}${a.any ? " anycast" : ""}`);
      if (i.ip6auto) L.push(" ipv6 address autoconfig"); if (i.ip6en) L.push(" ipv6 enable");
      if (i.hsrpVer===2) L.push(" standby version 2");
      if (i.hsrp) for (const [g,h] of Object.entries(i.hsrp)){ if (h.ip) L.push(` standby ${g} ip ${h.ip}`); if (h.prio!=null && h.prio!==100) L.push(` standby ${g} priority ${h.prio}`); if (h.preempt) L.push(` standby ${g} preempt`); }
      if (i.ospfNet==="point-to-point") L.push(" ip ospf network point-to-point");
      if (i.ospfPrio!=null) L.push(` ip ospf priority ${i.ospfPrio}`);
      if (i.ospfHello) L.push(` ip ospf hello-interval ${i.ospfHello}`); if (i.ospfDead && i.ospfDead!==(i.ospfHello||10)*4) L.push(` ip ospf dead-interval ${i.ospfDead}`);
      if (i.ospfArea) L.push(` ip ospf ${i.ospfArea.pid} area ${i.ospfArea.area}`);
      if (i.ospfCost) L.push(` ip ospf cost ${i.ospfCost}`);
      if (i.speed!=="auto" && i.speed) L.push(` speed ${i.speed}`);
      if (i.duplex!=="auto" && i.duplex) L.push(` duplex ${i.duplex}`);
      if (i.cdp===false && i.mode!=="svi" && !i.loop && !i.sub && !i.po) L.push(" no cdp enable");
      if (i.proxyArp===false) L.push(" no ip proxy-arp");
      if (i.shut) L.push(" shutdown");
      L.push("!");
    }
    if (st.ospf){ const o = st.ospf; L.push(`router ospf ${o.pid}`); if (o.rid) L.push(` router-id ${o.rid}`); if (o.refBw && o.refBw!==100) L.push(` auto-cost reference-bandwidth ${o.refBw}`);
      if (o.passiveDefault){ L.push(" passive-interface default"); for (const n of (o.noPassive||[])) L.push(` no passive-interface ${n}`); } else for (const n of (o.passive||[])) L.push(` passive-interface ${n}`);
      for (const w of o.networks) L.push(` network ${w.net} ${w.wild} area ${w.area}`); if (o.defOrig) L.push(` default-information originate${o.defAlways?" always":""}`); L.push("!"); }
    if (st.defaultGw) L.push(`ip default-gateway ${st.defaultGw}`);
    { const N = window.NAT ? window.NAT.running(st.nat) : []; if (N.length) L.push(...N); }
    for (const r of (st.routes6||[])) L.push(`ipv6 route ${U(r.net)}/${r.len}${r.ios?" "+r.ios:""}${r.nh?" "+U(r.nh):""}${r.ad?" "+r.ad:""}`);
    for (const r of st.routes.slice().sort((x,y)=>toInt(x.net)-toInt(y.net) || maskLen(x.mask)-maskLen(y.mask))) L.push(`ip route ${r.net} ${r.mask}${r.ios?" "+r.ios:""}${r.nh?" "+r.nh:""}${r.ad?" "+r.ad:""}`);
    { const A = window.ACL ? window.ACL.running(st.acl) : []; if (A.length) L.push("!", ...A); }
    if (st.dnsServer) L.push("ip dns server");
    if (st.logBuffered) L.push(`logging buffered ${st.logBuffered}`); if (st.logConsole!=null) L.push(`logging console ${SEV[st.logConsole]}`);
    if (st.logTrap!==6) L.push(`logging trap ${SEV[st.logTrap]}`); for (const h of st.logHosts) L.push(`logging host ${h}`);
    for (const [c, v] of Object.entries(st.snmp.communities)) L.push(`snmp-server community ${c} ${v.mode.toUpperCase()}${v.acl ? " " + v.acl : ""}`);
    if (st.snmp.location) L.push(`snmp-server location ${st.snmp.location}`); if (st.snmp.contact) L.push(`snmp-server contact ${st.snmp.contact}`);
    if (st.snmp.traps) L.push("snmp-server enable traps snmp authentication linkdown linkup coldstart warmstart", "snmp-server enable traps config");   // IOS expands the bare command
    for (const h of st.snmp.hosts) L.push(`snmp-server host ${h.ip}${h.ver!=="1" ? " version " + h.ver : ""} ${h.community}`);
    L.push("!");
    if (st.banner!=null) L.push(`banner motd ^C${st.banner}^C`);
    L.push("!", "line con 0"); const c = st.lines.con;
    if (c.timeout && c.timeout!=="10 0") L.push(` exec-timeout ${c.timeout}`);   // 10 0 is the default, which IOS hides
    if (c.password) L.push(` password ${pw(c.password)}`); if (c.sync) L.push(" logging synchronous"); if (c.loginLocal) L.push(" login local"); else if (c.login) L.push(" login");
    const v = st.lines.vty;
    // Catalyst switches show the 16 VTY lines as two blocks (0 4 and 5 15); routers have 0 4
    for (const blk of (kind==="switch" ? ["0 4","5 15"] : ["0 4"])){
      L.push(`line vty ${blk}`);
      if (v.timeout && v.timeout!=="10 0") L.push(` exec-timeout ${v.timeout}`); if (v.password) L.push(` password ${pw(v.password)}`); if (v.loginLocal) L.push(" login local"); else if (v.login) L.push(" login"); if (v.transport!=="all") L.push(` transport input ${v.transport}`);
    }
    if (st.ntpMaster!=null) L.push(st.ntpMaster===8 ? "ntp master" : `ntp master ${st.ntpMaster}`); for (const h of st.ntpServers) L.push(`ntp server ${h}`);
    L.push("!","end");
    return L.join("\n");
  }
  function ipIntBrief(){
    let o = "Interface              IP-Address      OK? Method Status                Protocol\n";
    for (const n of ifNames()){ const i = st.intfs[n]; const s = i.shut ? "administratively down" : (up(n) || (i.mode==="svi" && st.vlans[i.vlan])) ? "up" : "down";   // an SVI with no live port in its VLAN is up/down
      o += pad(n,23) + pad(i.ip||"unassigned",16) + (i.dhcpClient?"YES DHCP   ":i.ip?"YES manual ":"YES unset  ") + pad(s,22) + (up(n)?"up":"down") + "\n"; }
    return o.trimEnd();
  }
  function intStatus(){
    let o = "Port      Name               Status       Vlan       Duplex  Speed Type\n";
    for (const n of physical){ const i = st.intfs[n], link = up(n);
      const status = i.errdis ? "err-disabled" : i.shut ? "disabled" : link ? "connected" : "notconnect";
      const vl = i.mode==="routed" ? "routed" : isTrunk(n) ? "trunk" : String(i.vlan);
      const sfp = /0\/(9|10)$/.test(n) && kind==="switch";
      const c = hooks.counters(n) || {};
      const dup = i.duplex==="auto" ? (link ? "a-"+(c.duplex||"full") : "auto") : i.duplex;
      const spd = i.speed==="auto" ? (link ? "a-"+(c.speed||1000) : "auto") : String(i.speed);
      o += pad(short(n),10) + pad((i.desc||"").slice(0,18),19) + pad(status,13) + pad(vl,11) + pad(dup,8).replace(/^/,"").padStart(6) + " " + pad(spd,6).padStart(6) + " " + (sfp ? (c.sfp||"Not Present") : "10/100/1000BaseTX") + "\n"; }
    return o.trimEnd();
  }
  function showInt(n){
    const i = st.intfs[n], link = up(n), c = hooks.counters(n) || {};
    const l1 = i.shut ? "administratively down" : (link || (i.mode==="svi" && st.vlans[i.vlan])) ? "up" : "down";
    if (i.errdis) return `${n} is down, line protocol is down (err-disabled)\n  Hardware is Gigabit Ethernet, address is ${i.mac} (bia ${i.mac})${i.desc?`\n  Description: ${i.desc}`:""}\n  (err-disabled by ${i.errdis}: shutdown then no shutdown to recover, after fixing the cause)`;
    const hw = i.mode==="svi" ? "Ethernet SVI" : i.loop ? "Loopback" : "Gigabit Ethernet";
    const lines = [`${n} is ${l1}, line protocol is ${link?"up":"down"}${i.mode!=="svi"&&!i.loop&&kind==="switch"?` (${i.shut?"disabled":link?"connected":"notconnect"})`:""}`,
      `  Hardware is ${hw}${i.mac?`, address is ${i.mac} (bia ${i.mac})`:""}`];
    if (i.desc) lines.push(`  Description: ${i.desc}`);
    if (i.ip) lines.push(`  Internet address is ${i.ip}/${maskLen(i.mask)}`);
    lines.push(`  MTU 1500 bytes, BW ${i.bw || (link?(c.speed||1000)*1000:1000000)} Kbit/sec, DLY 10 usec,`, "     reliability 255/255, txload 1/255, rxload 1/255", "  Encapsulation ARPA, loopback not set");
    if (i.sub){ const p = st.intfs[i.parent];
      return [`${n} is ${p.shut||i.shut ? "administratively down" : up(i.parent) ? "up" : "down"}, line protocol is ${!p.shut && !i.shut && up(i.parent) ? "up" : "down"}`,
        `  Hardware is ISR4331-3x1GE, address is ${p.mac} (bia ${p.mac})`, ...(i.desc?[`  Description: ${i.desc}`]:[]), ...(i.ip?[`  Internet address is ${i.ip}/${maskLen(i.mask)}`]:[]),
        "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,", "     reliability 255/255, txload 1/255, rxload 1/255",
        i.encap ? `  Encapsulation 802.1Q Virtual LAN, Vlan ID  ${i.encap}.` : "  Encapsulation 802.1Q Virtual LAN, Vlan ID  (not set).",
        "  ARP type: ARPA, ARP Timeout 04:00:00", "  Keepalive not supported", '  Last clearing of "show interface" counters never'].join("\n"); }
    if (i.mode!=="svi" && !i.loop){
      const d = i.duplex==="auto" ? (c.duplex||"Full") : (i.duplex||"Full"); const sp = i.speed==="auto" ? (c.speed||1000) : i.speed;
      lines.push(link ? `  ${d[0].toUpperCase()+d.slice(1).toLowerCase()}-duplex, ${sp}Mb/s, media type is 10/100/1000BaseTX` : "  Auto-duplex, Auto-speed, media type is 10/100/1000BaseTX");
      lines.push(`  input flow-control is off, output flow-control is unsupported`, `  ARP type: ARPA, ARP Timeout 04:00:00`, `  Last input ${link?"00:00:01":"never"}, output ${link?"00:00:00":"never"}, output hang never`,
        `  5 minute input rate ${link?c.inRate||2000:0} bits/sec, ${link?3:0} packets/sec`, `  5 minute output rate ${link?c.outRate||4000:0} bits/sec, ${link?5:0} packets/sec`,
        `     ${c.inPkts||(link?18342:0)} packets input, ${c.inBytes||(link?2311954:0)} bytes, 0 no buffer`, `     Received ${c.bcast||(link?1203:0)} broadcasts (${c.mcast||(link?644:0)} multicasts)`,
        `     ${c.runts||0} runts, ${c.giants||0} giants, 0 throttles`, `     ${(c.crc||0)+(c.frame||0)} input errors, ${c.crc||0} CRC, ${c.frame||0} frame, 0 overrun, 0 ignored`,
        `     ${c.outPkts||(link?26511:0)} packets output, ${c.outBytes||(link?3950112:0)} bytes, 0 underruns`, `     ${c.outErr||0} output errors, ${c.collisions||0} collisions, 0 interface resets`, `     ${c.late||0} late collision, 0 deferred`);
    }
    return lines.join("\n");
  }
  function vlanBrief(){
    if (kind!=="switch") return null;
    let o = "VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n";
    for (const v of Object.keys(st.vlans).map(Number).sort((a,b)=>a-b)){
      const ports = physical.filter(n=>{ const i = st.intfs[n]; return st.opMode(n)==="access" && !i.channel && (i.vlan===v || i.voiceVlan===v); }).map(short)
        .concat(Object.keys(st.intfs).filter(n=>n.startsWith("Port-channel") && st.opMode(n)==="access" && st.intfs[n].vlan===v).map(short));
      const chunks = []; for (let k=0;k<ports.length;k+=4) chunks.push(ports.slice(k,k+4).join(", "));
      o += pad(v,5) + pad(st.vlans[v],33) + pad(v>=1002&&v<=1005?"act/unsup":"active",10) + (chunks[0]||"") + "\n";
      for (const ch of chunks.slice(1)) o += " ".repeat(48) + ch + "\n";
    }
    return o.trimEnd();
  }
  function macTable(filter){
    if (kind!=="switch") return null;
    let rows = (hooks.mac()||[]).slice();
    if (filter && filter.type==="dynamic") rows = rows.filter(r=>r.type!=="STATIC");
    if (filter && filter.addr) rows = rows.filter(r=>r.mac===filter.addr);
    if (filter && filter.intf) rows = rows.filter(r=>r.port===short(filter.intf));
    if (filter && filter.vlan) rows = rows.filter(r=>+r.vlan===+filter.vlan);
    let o = "          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n";
    const showCpu = !filter;
    o += showCpu ? " All    0100.0ccc.cccc    STATIC      CPU\n All    ffff.ffff.ffff    STATIC      CPU\n" : "";
    for (const r of rows) o += pad(" "+r.vlan,8) + pad(r.mac,18) + pad(r.type||"DYNAMIC",12) + r.port + "\n";
    o += `Total Mac Addresses for this criterion: ${rows.length + (showCpu?2:0)}`;
    return o;
  }
  function cdpNeighbors(detail){
    if (!st.cdpRun) return "% CDP is not enabled";
    const rows = (hooks.cdp()||[]).filter(r=>st.intfs[r.local] && st.intfs[r.local].cdp!==false && up(r.local));
    if (detail) return rows.length ? rows.map(r=>`-------------------------\nDevice ID: ${r.id}\nEntry address(es):\n  IP address: ${r.ip||"(none)"}\nPlatform: ${r.platform},  Capabilities: ${r.cap.replace(/R/,"Router ").replace(/S/,"Switch ").replace(/I/,"IGMP ").replace(/H/,"Host ").trim()}\nInterface: ${r.local},  Port ID (outgoing port): ${r.remote}\nHoldtime : 151 sec\n\nVersion :\nCisco IOS Software, Version 17.9.4\n`).join("\n") : "";
    let o = "Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge\n                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone\n\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\n";
    for (const r of rows) o += pad(r.id,17) + pad(short(r.local),18) + pad("151",11) + pad(r.cap,12) + pad(r.platform,10) + short(r.remote) + "\n";
    return (o + `\nTotal cdp entries displayed : ${rows.length}`);
  }
  function lldpNeighbors(){
    if (!st.lldpRun) return "% LLDP is not enabled";
    const rows = (hooks.lldp()||[]).filter(r=>st.intfs[r.local] && up(r.local));
    let o = "Capability codes:\n    (R) Router, (B) Bridge, (T) Telephone, (C) DOCSIS Cable Device\n    (W) WLAN Access Point, (P) Repeater, (S) Station, (O) Other\n\nDevice ID           Local Intf     Hold-time  Capability      Port ID\n";
    for (const r of rows) o += pad(r.id,20) + pad(short(r.local),15) + pad("120",11) + pad(r.cap.includes("R")?"R":"B",16) + short(r.remote) + "\n";
    return o + `\nTotal entries displayed: ${rows.length}`;
  }
  function arpTable(only){
    const rows = (hooks.arp() || []).filter(r=>!only || r.ip===only);
    let o = "Protocol  Address          Age (min)  Hardware Addr   Type   Interface\n";
    for (const n of ifNames()){ const i = st.intfs[n]; if (i.ip && up(n) && (!only || i.ip===only)) o += `Internet  ${pad(i.ip,17)}${pad("-",11)}${pad(i.mac||"-",16)}ARPA   ${n}\n`; }
    for (const r of rows) o += `Internet  ${pad(r.ip,17)}${pad(r.age||"0",11)}${pad(r.mac,16)}ARPA   ${r.intf}\n`;
    return o.trimEnd();
  }

  /* ---------- routing: one RIB (connected, local, static, OSPF) chosen by administrative distance, then longest-prefix match ---------- */
  const routingOn = () => kind==="router" || !!st.ipRouting;
  const inNet = (ip, net, len) => len===0 || (toInt(ip) >>> (32-len)) === (toInt(net) >>> (32-len));
  const ones32 = x => (x>>>0).toString(2).replace(/0/g,"").length;
  const ageOf = s => { let h = 7; for (const ch of String(s)) h = (h*31 + ch.charCodeAt(0)) % 2400; h += 300; return `00:${String(Math.floor(h/60)).padStart(2,"0")}:${String(h%60).padStart(2,"0")}`; };
  // OSPF, this router's side: which interfaces run it, in which area, at what cost, with which timers
  function ospfAreaOf(n){ const i = st.intfs[n]; if (!i || !i.ip) return null;
    if (i.ospfArea) return i.ospfArea.area;                       // interface method: ip ospf 1 area 0
    if (!st.ospf) return null; let best = null;
    for (const w of st.ospf.networks){ const care = (0xFFFFFFFF - toInt(w.wild))>>>0;   // network statements: the most specific match wins
      if (((toInt(i.ip) & care)>>>0) === ((toInt(w.net) & care)>>>0)){ const b = ones32(care); if (!best || b > best.b) best = {area:w.area, b}; } }
    return best ? best.area : null; }
  const ospfPassive = n => { const o = st.ospf; if (!o) return false; return o.passiveDefault ? !(o.noPassive||[]).includes(n) : (o.passive||[]).includes(n); };
  const bwKbit = n => { const i = st.intfs[n]; if (i.bw) return i.bw; if (i.loop) return 8000000; if (i.sub) return bwKbit(i.parent); if (i.mode==="svi"||n.startsWith("Port-channel")) return 1000000;
    const c = hooks.counters(n) || {}; const sp = i.speed && i.speed!=="auto" ? i.speed : (c.speed || 1000); return sp*1000; };
  const ospfCost = n => { const i = st.intfs[n]; if (i.ospfCost) return i.ospfCost; const ref = (st.ospf && st.ospf.refBw) || 100; return Math.max(1, Math.floor(ref*1000 / bwKbit(n))); };
  const ospfNetType = n => { const i = st.intfs[n]; if (i.ospfNet==="point-to-point") return "POINT_TO_POINT"; return i.loop ? "LOOPBACK" : "BROADCAST"; };
  function ospfRidPick(){ const o = st.ospf; if (!o) return null; if (o.rid) return o.rid;
    const hi = arr => arr.sort((a,b)=>toInt(b)-toInt(a))[0] || null;   // highest loopback IP, else highest active interface IP
    return hi(ifNames().filter(n=>st.intfs[n].loop && st.intfs[n].ip && up(n)).map(n=>st.intfs[n].ip)) || hi(ifNames().filter(n=>!st.intfs[n].loop && st.intfs[n].ip && up(n)).map(n=>st.intfs[n].ip)); }
  function ospfRid(){ if (!st.ospf || !routingOn()) return null; if (!st.ospfRidActive) st.ospfRidActive = ospfRidPick(); return st.ospfRidActive; }   // chosen when the process starts; changes only on reload / clear ip ospf process
  function ospfIfaces(){ if (!st.ospf || !routingOn()) return [];
    return ifNames().map(n=>{ const i = st.intfs[n]; const area = ospfAreaOf(n); if (area==null) return null; const hello = i.ospfHello || 10;
      return {ios:n, ip:i.ip, mask:i.mask, len:maskLen(i.mask), area, cost:ospfCost(n), prio: i.ospfPrio!=null ? i.ospfPrio : 1, hello, dead: i.ospfDead || hello*4,
        net: ospfNetType(n), passive: ospfPassive(n), loop: !!i.loop, up: up(n), mac:i.mac, via: i.ospfArea ? "Interface Configuration" : "Network Statement"}; }).filter(Boolean); }
  const areaStr = a => String(a);
  // static routes are installed only when they resolve: exit interface up, or the next hop reachable through another route
  function resolveStatic(r, cand){
    const len = maskLen(r.mask), base = {code: len===0 ? "S*" : "S", net:r.net, len, ad: r.ad || 1, metric:0};
    if (r.ios){ if (!st.intfs[r.ios] || !up(r.ios)) return null; return Object.assign(base, {nhs:[{ios:r.ios, nh:r.nh||null, cfgNh:r.nh||null, direct:!r.nh, full:!!r.nh}]}); }
    const m = bestMatch(cand, r.nh, r.net+"/"+len); if (!m || m.code==="L") return null;
    const via = m.nhs[0]; return Object.assign(base, {nhs:[{ios:via.ios, nh: via.nh || r.nh, cfgNh:r.nh}]});
  }
  function bestMatch(entries, ip, skipKey){ let b = null; for (const e of entries){ if (skipKey && e.net+"/"+e.len===skipKey) continue; if (inNet(ip, e.net, e.len) && (!b || e.len > b.len || (e.len===b.len && e.ad < b.ad))) b = e; } return b; }
  function ribAll(){
    const cand = [];
    for (const n of ifNames()){ const i = st.intfs[n]; if (!i.ip || !up(n)) continue; const len = maskLen(i.mask);
      cand.push({code:"C", net:netOf(i.ip,i.mask), len, ad:0, metric:0, nhs:[{ios:n, nh:null}]});
      if (len<32) cand.push({code:"L", net:i.ip, len:32, ad:0, metric:0, nhs:[{ios:n, nh:null}]}); }
    if (routingOn()) for (const r of ((hooks.ospfRoutes && hooks.ospfRoutes()) || [])) cand.push({code:r.type, net:r.net, len:r.len, ad:110, metric:r.cost, fwd:r.fwd, nhs:r.nhs.map(x=>({ios:x.ios, nh:x.nh, from:x.from}))});
    if (routingOn()){ let pend = st.routes.concat(ifNames().filter(n=>{ const i = st.intfs[n]; return i.dhcpClient && i.ip && i.dhcpGw && up(n); }).map(n=>({net:"0.0.0.0", mask:"0.0.0.0", nh:st.intfs[n].dhcpGw, ad:254, dhcp:true})));
      for (let pass=0; pass<4 && pend.length; pass++){ const left = []; for (const r of pend){ const e = resolveStatic(r, cand); if (e) cand.push(e); else left.push(r); } if (left.length===pend.length) break; pend = left; } }
    const best = new Map();   // per prefix: the lowest administrative distance wins; equal-distance statics share the load
    for (const c of cand){ const k = c.net+"/"+c.len, b = best.get(k);
      if (!b || c.ad < b.ad) best.set(k, Object.assign({}, c, {nhs:[...c.nhs]}));
      else if (c.ad===b.ad && c.code[0]==="S" && b.code[0]==="S") b.nhs.push(...c.nhs); }
    return [...best.values()];
  }
  // forwarding decision: longest match, then (equal-cost) one path per destination like CEF
  st.lookup = dst => { if (!routingOn()) return null; const e = bestMatch(ribAll(), dst); if (!e) return null;
    const x = e.nhs[e.nhs.length>1 ? toInt(dst) % e.nhs.length : 0]; return {ios:x.ios, nh: x.nh || dst, code:e.code, net:e.net, len:e.len}; };
  st.rib = () => ribAll();
  st.ospfInfo = () => st.ospf && routingOn() ? {pid:st.ospf.pid, rid:ospfRid(), ifaces:ospfIfaces(), defOrig:st.ospf.defOrig, defAlways:st.ospf.defAlways, resets:st.ospfResets||0,
    hasDefault: ribAll().some(e=>e.len===0 && e.code!=="O*E2")} : null;
  st.hsrpGroups = () => { const out = []; for (const n of ifNames()){ const i = st.intfs[n]; if (i.hsrp) for (const [g, h] of Object.entries(i.hsrp)) if (h.ip) out.push({ios:n, grp:+g, vip:h.ip, prio: h.prio!=null ? h.prio : 100, preempt:!!h.preempt, ver: i.hsrpVer||1, ip:i.ip, up: up(n) && !!i.ip && sameNet(i.ip, h.ip, i.mask), badVip: !!i.ip && !sameNet(i.ip, h.ip, i.mask)}); } return out; };
  /* ---------- IPv6: link-local + global addresses, a separate RIB (C, L, S), longest match, ND neighbours from the bench ---------- */
  const I6 = window.IP6;
  const v6on = n => { const i = st.intfs[n]; return !!(i && (i.ip6en || (i.ip6 && i.ip6.length) || i.ll || i.ip6auto)); };
  const macOf = n => { const i = st.intfs[n]; return (i && i.mac) || (i && i.sub && st.intfs[i.parent] && st.intfs[i.parent].mac) || (st.intfs[physical[0]]||{}).mac || baseMac + ".0001"; };
  const llOf = n => v6on(n) ? (st.intfs[n].ll || I6.str(I6.linkLocal(macOf(n)))) : null;
  function globals6(n){ const i = st.intfs[n]; if (!i) return [];
    const out = (i.ip6||[]).map(a=>({addr: a.eui ? I6.str(I6.withIid(I6.mask(I6.parse(a.addr), 64), I6.eui64(macOf(n)))) : a.addr, len:a.len, eui:!!a.eui, any:!!a.any}));
    if (i.ip6auto && hooks.ra){ const ra = hooks.ra(n); if (ra && ra.prefix) out.push({addr: I6.str(I6.withIid(I6.parse(ra.prefix), I6.eui64(macOf(n)))), len: ra.len, auto:true}); }
    return out; }
  const v6Routing = () => kind==="router" && !!st.v6routing;
  const U = a => I6.str(a, true);
  function rib6(){
    const cand = [];
    for (const n of ifNames()){ if (!up(n) || !v6on(n)) continue;
      for (const g of globals6(n)){ if (g.len===128){ cand.push({code:"LC", net:g.addr, len:128, ad:0, metric:0, nhs:[{ios:n}]}); continue; }
        cand.push({code:"C", net:I6.str(I6.mask(I6.parse(g.addr), g.len)), len:g.len, ad:0, metric:0, nhs:[{ios:n}]}); cand.push({code:"L", net:g.addr, len:128, ad:0, metric:0, nhs:[{ios:n}]}); } }
    const best6 = (ip, skip) => { let b = null; for (const e of cand){ if (skip && e.net+"/"+e.len===skip) continue; if (e.len===0 && !st.v6resolveDefault) continue; if (I6.inPrefix(ip, e.net, e.len) && (!b || e.len > b.len)) b = e; } return b; };
    let pend = (st.routes6||[]).slice();
    for (let pass=0; pass<4 && pend.length; pass++){ const left = [];
      for (const r of pend){ const base = {code:"S", net:r.net, len:r.len, ad:r.ad||1, metric:0};
        if (r.ios){ if (st.intfs[r.ios] && up(r.ios) && v6on(r.ios)) cand.push(Object.assign(base, {nhs:[{ios:r.ios, nh:r.nh||null, cfgNh:r.nh||null, direct:!r.nh, full:!!r.nh}]})); else left.push(r); continue; }
        const m = best6(r.nh, r.net+"/"+r.len); if (!m || m.code==="L" || m.code==="LC"){ left.push(r); continue; }
        cand.push(Object.assign(base, {nhs:[{ios:m.nhs[0].ios, nh: m.nhs[0].nh || r.nh, cfgNh:r.nh}]})); }
      if (left.length===pend.length) break; pend = left; }
    const best = new Map();
    for (const c of cand){ const k = c.net+"/"+c.len, b = best.get(k); if (!b || c.ad < b.ad) best.set(k, Object.assign({}, c, {nhs:[...c.nhs]})); else if (c.ad===b.ad && c.code==="S" && b.code==="S") b.nhs.push(...c.nhs); }
    return [...best.values()];
  }
  st.rib6 = () => rib6();
  st.lookup6 = dst => { if (!v6Routing()) return null; let b = null; for (const e of rib6()) if (I6.inPrefix(dst, e.net, e.len) && (!b || e.len > b.len)) b = e; if (!b) return null;
    const x = b.nhs[0]; return {ios:x.ios, nh: x.nh || dst, code:b.code, net:b.net, len:b.len}; };
  st.v6info = () => ({routing: v6Routing(), ifaces: ifNames().filter(n=>v6on(n)).map(n=>({ios:n, up:up(n), ll:llOf(n), globals:globals6(n), mac:macOf(n)}))});
  function ipv6IntBrief(){
    return ifNames().filter(n=>!n.startsWith("Port-channel")).map(n=>{ const i = st.intfs[n], s = i.shut ? "administratively down/down" : up(n) ? "up/up" : "down/down";
      const addrs = v6on(n) ? [llOf(n), ...globals6(n).map(g=>g.addr)].map(U) : ["unassigned"];
      return pad(n, 23) + "[" + s + "]\n" + addrs.map(a=>"    " + a).join("\n"); }).join("\n");
  }
  function ipv6IntDetail(only){
    const list = ifNames().filter(n=>v6on(n) && (!only || n===only));
    if (only && !list.length){ const i = st.intfs[only]; return `${only} is ${i.shut?"administratively down":up(only)?"up":"down"}, line protocol is ${up(only)?"up":"down"}\n  IPv6 is disabled`; }
    return list.map(n=>{ const i = st.intfs[n], g = globals6(n), ll = llOf(n);
      const groups = ["FF02::1", ...(v6Routing() ? ["FF02::2"] : []), ...[ll, ...g.map(x=>x.addr)].map(a=>U(I6.solicited(a)))];
      const L = [`${n} is ${i.shut?"administratively down":up(n)?"up":"down"}, line protocol is ${up(n)?"up":"down"}`, `  IPv6 is enabled, link-local address is ${U(ll)} `, "  No Virtual link-local address(es):"];
      if (g.length){ L.push("  Global unicast address(es):"); for (const x of g) L.push(`    ${U(x.addr)}, subnet is ${U(I6.mask(I6.parse(x.addr), x.len))}/${x.len} ${x.eui?"[EUI]":x.auto?"[EUI/CAL/PRE]":x.any?"[ANY]":""}`.replace(/ $/,"")); }
      else L.push("  No global unicast address is configured");
      L.push("  Joined group address(es):", ...[...new Set(groups)].map(x=>"    " + x), "  MTU is 1500 bytes", "  ICMP error messages limited to one every 100 milliseconds", "  ICMP redirects are enabled", "  ICMP unreachables are sent",
        "  ND DAD is enabled, number of DAD attempts: 1", "  ND reachable time is 30000 milliseconds (using 30000)");
      if (v6Routing()) L.push("  ND advertised reachable time is 0 (unspecified)", "  ND advertised retransmit interval is 0 (unspecified)", "  ND router advertisements are sent every 200 seconds", "  ND router advertisements live for 1800 seconds", "  ND advertised default router preference is Medium", "  Hosts use stateless autoconfig for addresses.");
      else L.push("  ND NS retransmit interval is 1000 milliseconds");
      return L.join("\n"); }).join("\n");
  }
  function ipv6Route(only){
    const r = rib6(), keep = only==="static" ? (e=>e.code==="S") : only==="connected" ? (e=>e.code==="C"||e.code==="LC") : only==="local" ? (e=>e.code==="L"||e.code==="LC") : (()=>true);
    const rows = r.filter(keep).sort((a,b)=>{ const x = I6.parse(a.net), y = I6.parse(b.net); for (let k=0;k<8;k++) if (x[k]!==y[k]) return x[k]-y[k]; return a.len-b.len; });
    const total = r.length + 1;
    const L = [`IPv6 Routing Table - default - ${total} entries`, "Codes: C - Connected, L - Local, S - Static, U - Per-user Static route", "       B - BGP, R - RIP, H - NHRP, I1 - ISIS L1",
      "       I2 - ISIS L2, IA - ISIS interarea, IS - ISIS summary, D - EIGRP", "       EX - EIGRP external, ND - ND Default, NDp - ND Prefix, DCE - Destination",
      "       NDr - Redirect, RL - RPL, O - OSPF Intra, OI - OSPF Inter", "       OE1 - OSPF ext 1, OE2 - OSPF ext 2, ON1 - OSPF NSSA ext 1", "       ON2 - OSPF NSSA ext 2, la - LISP alt, lr - LISP site-registrations",
      "       ld - LISP dyn-eid, lA - LISP away, le - LISP extranet-policy", "       lp - LISP publications, a - Application, m - OMP"];   // the IOS XE 17 legend
    for (const e of rows){ L.push(`${pad(e.code, 4)}${U(e.net)}/${e.len} [${e.ad}/0]`);
      for (const h of e.nhs) L.push(e.code==="C" ? `     via ${h.ios}, directly connected` : (e.code==="L" || e.code==="LC") ? `     via ${h.ios}, receive` : h.direct ? `     via ${h.ios}, directly connected` : h.full ? `     via ${U(h.cfgNh)}, ${h.ios}` : `     via ${U(h.cfgNh || h.nh)}`); }
    if (!only || only==="local") L.push("L   FF00::/8 [0/0]", "     via Null0, receive");
    return L.join("\n");
  }
  function ipv6RouteEntry(q){
    const r = rib6(), pp = I6.parsePrefix(q); let e = null;
    if (pp) e = r.find(x=>x.len===pp.len && I6.eq(x.net, I6.mask(pp.w, pp.len))) || null;
    else if (I6.valid(q)){ for (const x of r) if (I6.inPrefix(q, x.net, x.len) && (!e || x.len > e.len)) e = x; }
    else return "% Invalid input detected at '^' marker.";
    if (!e) return "% Route not found";
    const pfx = `${U(e.net)}/${e.len}`, how = e.code==="S" ? `"static", distance ${e.ad}, metric 0` : `"connected", distance 0, metric 0, type ${e.code==="C" ? "connected" : "receive"}`;
    const paths = e.nhs.map(h=>"    " + (e.code==="C" ? "directly connected via " + h.ios : (e.code==="L"||e.code==="LC") ? "receive via " + h.ios : h.direct ? "directly connected via " + h.ios : h.full ? U(h.cfgNh) + ", " + h.ios : U(h.cfgNh || h.nh)) + `\n      Last updated ${ageOf(pfx)} ago`);
    return [`Routing entry for ${pfx}`, `  Known via ${how}`, `  Route count is ${e.nhs.length}/${e.nhs.length}, share count 0`, "  Routing paths:", ...paths].join("\n");
  }
  function ipv6Neighbors(){
    const rows = (hooks.nd6 ? hooks.nd6() : []) || [];
    return "IPv6 Address                              Age Link-layer Addr State Interface\n" + rows.map(x=>pad(U(x.addr), 42) + String(0).padStart(3) + " " + pad(x.mac, 16) + pad("REACH", 6) + short(x.ios)).join("\n");
  }
  function doPing6(ip, outIf, src){
    const ask6 = run => I6.isLL(ip) && !outIf ? ask("Output Interface: ", l=>{ const n = /\s/.test(l.trim()) ? null : parseIf(l.trim()); if (!n) return "% Invalid interface. Use full interface name without spaces (e.g. Serial0/1)"; return run(n); }) : run(outIf);
    return ask6(o=>{ const r = (hooks.ping6 ? hooks.ping6(ip, o, src) : {ok:false}) || {};
      if (r.kind==="noroute") return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${U(I6.parse(ip))}, timeout is 2 seconds:\n% No valid route for destination\nSuccess rate is 0 percent (0/1)`;
      const bar = r.ok ? "!!!!!" : r.kind==="unreach" ? "UUUUU" : r.kind==="ttlexpired" ? "&&&&&" : ".....";
      const n = (bar.match(/!/g)||[]).length;
      return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${U(I6.parse(ip))}, timeout is 2 seconds:\n${o && I6.isLL(ip) ? "Packet sent with a source address of " + U(llOf(o)) + "%" + o + "\n" : src ? "Packet sent with a source address of " + U(src) + "\n" : ""}${bar}\nSuccess rate is ${n*20} percent (${n}/5)${n?", round-trip min/avg/max = 0/1/3 ms":""}`; });
  }
  function doTrace6(ip){ if (hooks.trace6) return hooks.trace6(ip); return `Type escape sequence to abort.\nTracing the route to ${U(I6.parse(ip))}\n\n  1  *  *  *`; }
  const hsrpVmac = (g, ver) => ver===2 ? `0000.0c9f.f${g.toString(16).padStart(3,"0")}` : `0000.0c07.ac${g.toString(16).padStart(2,"0")}`;

  function ribLine(e, noLen, top){   // noLen: under an "is subnetted" heading IOS prints the prefix without its length; top: a route with no heading above it uses a 6-wide code column
    const w = top ? 6 : 9, code = pad(e.code, w), pfx = noLen ? e.net : `${e.net}/${e.len}`, ind = " ".repeat(w + pfx.length + 1);
    if (e.code==="C" || e.code==="L") return `${code}${pfx} is directly connected, ${e.nhs[0].ios}`;
    if (e.code[0]==="S") return e.nhs.map((h,k)=>{ const body = h.direct ? `is directly connected, ${h.ios}` : `[${e.ad}/0] via ${h.cfgNh||h.nh}${h.full ? ", "+h.ios : ""}`; return (k ? ind : `${code}${pfx} `) + body; }).join("\n");
    return e.nhs.map((h,k)=>(k ? ind : `${code}${pfx} `) + `[110/${e.metric}] via ${h.nh}, ${ageOf(pfx)}, ${h.ios}`).join("\n");
  }
  function routeEntryFor(ip){
    if (ip==="0.0.0.0"){ const d = ribAll().find(x=>x.len===0); if (!d) return "% Network not in table";   // asking for the default route itself
      const blk = d.nhs.map((h,k)=>`  ${k?" ":"*"} ` + (d.code[0]==="S" ? (h.direct ? `directly connected, via ${h.ios}` : (h.cfgNh||h.nh) + (h.full ? `, via ${h.ios}` : "")) + "\n      Route metric is 0, traffic share count is 1"
        : `${h.nh}, from ${h.from||h.nh}, ${ageOf("0.0.0.0/0")} ago, via ${h.ios}\n      Route metric is ${d.metric}, traffic share count is 1\n      Route tag 1`)).join("\n");
      if (d.code[0]==="S") return `Routing entry for 0.0.0.0/0, supernet\n  Known via "static", distance ${d.ad}, metric 0, candidate default path\n  Routing Descriptor Blocks:\n` + blk;
      return `Routing entry for 0.0.0.0/0, supernet\n  Known via "ospf ${st.ospf?st.ospf.pid:1}", distance 110, metric ${d.metric}, candidate default path\n  Tag 1, type extern 2, forward metric ${d.fwd||1}\n  Last update from ${d.nhs[0].nh} on ${d.nhs[0].ios}, ${ageOf("0.0.0.0/0")} ago\n  Routing Descriptor Blocks:\n` + blk; }
    const e = bestMatch(ribAll().filter(x=>x.len>0), ip);   // like IOS: a host lookup that only the default matches is "not in table"
    if (!e){ const f = +ip.split(".")[0], p = f<128 ? 8 : f<192 ? 16 : 24, major = netOf(ip, [0,0,0,0].map((_,k)=>k<p/8?255:0).join("."));
      return ribAll().some(x=>x.len>=p && netOf(x.net, [0,0,0,0].map((_,k)=>k<p/8?255:0).join("."))===major) ? "% Subnet not in table" : "% Network not in table"; }
    const pfx = `${e.net}/${e.len}`, tail = "\n      Route metric is ";
    if (e.code==="C"||e.code==="L") return `Routing entry for ${pfx}\n  Known via "connected", distance 0, metric 0 (connected, via interface)\n  Routing Descriptor Blocks:\n  * directly connected, via ${e.nhs[0].ios}${tail}0, traffic share count is 1`;
    if (e.code[0]==="S") return `Routing entry for ${pfx}\n  Known via "static", distance ${e.ad}, metric 0${e.nhs.some(h=>h.direct)?" (connected)":""}\n  Routing Descriptor Blocks:\n` +
      e.nhs.map((h,k)=>`  ${k?" ":"*"} ${h.direct ? `directly connected, via ${h.ios}` : (h.cfgNh||h.nh) + (h.full ? `, via ${h.ios}` : "")}${tail}0, traffic share count is 1`).join("\n");
    const type = e.code==="O IA" ? "inter area" : /E2/.test(e.code) ? `extern 2, forward metric ${e.fwd||1}` : "intra area";
    return `Routing entry for ${pfx}\n  Known via "ospf ${st.ospf?st.ospf.pid:1}", distance 110, metric ${e.metric}, type ${type}\n  Last update from ${e.nhs[0].nh} on ${e.nhs[0].ios}, ${ageOf(pfx)} ago\n  Routing Descriptor Blocks:\n` +
      e.nhs.map((h,k)=>`  ${k?" ":"*"} ${h.nh}, from ${h.from||h.nh}, ${ageOf(pfx)} ago, via ${h.ios}${tail}${e.metric}, traffic share count is 1`).join("\n");
  }

  /* ---------- OSPF show commands (neighbours, DR/BDR and routes come from the bench through hooks) ---------- */
  const ospfIfState = (n, f) => { const x = hooks.ospfIf ? hooks.ospfIf(n) : null; if (x) return x;
    return f.loop && f.net==="LOOPBACK" ? {state:"LOOP", nbrs:[], adj:0} : f.net==="POINT_TO_POINT" ? {state:"P2P", nbrs:[], adj:0} : {state:"DR", dr:{rid:ospfRid(), ip:f.ip}, bdr:null, nbrs:[], adj:0}; };
  function ospfNeighbors(){
    if (!st.ospf) return "";
    const rows = (hooks.ospfNbrs ? hooks.ospfNbrs() : []) || [];
    let o = "\nNeighbor ID     Pri   State           Dead Time   Address         Interface\n";
    for (const r of rows) o += pad(r.rid,16) + String(r.prio).padStart(3) + "   " + pad(r.state,16) + pad(`00:00:${String(Math.max(1, r.dead - 1 - (toInt(r.ip)%7))).padStart(2,"0")}`,12) + pad(r.ip,16) + r.ios + "\n";
    return o.replace(/\n$/,"");
  }
  function ospfIntBrief(){
    const fs = ospfIfaces(); if (!fs.length) return "";
    let o = "Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C\n";
    for (const f of fs){ const x = ospfIfState(f.ios, f); const st8 = !f.up ? "DOWN" : x.state==="DROTHER" ? "DROTH" : x.state;   // the brief view's State column is 5 wide
      o += pad(short(f.ios),13) + pad(st.ospf.pid,6) + pad(areaStr(f.area),16) + pad(`${f.ip}/${f.loop && f.net==="LOOPBACK" ? 32 : f.len}`,19) + pad(f.cost,6) + pad(st8,6) + `${x.adj||0}/${(x.nbrs||[]).length}\n`; }
    return o.replace(/\n$/,"");
  }
  function ospfIntDetail(only){
    const fs = ospfIfaces().filter(f=>!only || f.ios===only);
    if (only && !fs.length){ const i = st.intfs[only]; return `${only} is ${i.shut?"administratively down":up(only)?"up":"down"}, line protocol is ${up(only)?"up":"down"}\n  OSPF not enabled on this interface`; }
    return fs.map(f=>{ const i = st.intfs[f.ios], x = ospfIfState(f.ios, f), rid = ospfRid();
      const L = [`${f.ios} is ${i.shut?"administratively down":f.up?"up":"down"}, line protocol is ${f.up?"up":"down"}`,
        `  Internet Address ${f.ip}/${f.len}, Interface ID ${ifNames().indexOf(f.ios)+1}, Area ${areaStr(f.area)}`, `  Attached via ${f.via==="Interface Configuration" ? "Interface Enable" : f.via}`,
        `  Process ID ${st.ospf.pid}, Router ID ${rid}, Network Type ${f.net}, Cost: ${f.cost}`,
        "  Topology-MTID    Cost    Disabled    Shutdown      Topology Name", `        0           ${pad(f.cost,10)}no          no            Base`];
      if (f.via==="Interface Configuration") L.push("  Enabled by interface config, including secondary ip addresses");
      if (f.net==="LOOPBACK"){ L.push("  Loopback interface is treated as a stub Host"); return L.join("\n"); }
      if (!f.up){ L.push("  Transmit Delay is 1 sec, State DOWN" + (f.net==="BROADCAST" ? `, Priority ${f.prio}` : "")); return L.join("\n"); }
      if (f.net==="POINT_TO_POINT") L.push("  Transmit Delay is 1 sec, State POINT_TO_POINT");
      else { L.push(`  Transmit Delay is 1 sec, State ${x.state}, Priority ${f.prio}`);
        if (x.dr) L.push(`  Designated Router (ID) ${x.dr.rid}, Interface address ${x.dr.ip}`); else L.push("  No designated router on this network");
        if (x.bdr) L.push(`  Backup Designated router (ID) ${x.bdr.rid}, Interface address ${x.bdr.ip}`); else L.push("  No backup designated router on this network"); }
      L.push(`  Timer intervals configured, Hello ${f.hello}, Dead ${f.dead}, Wait ${f.dead}, Retransmit 5`, `    oob-resync timeout ${f.dead}`);
      if (f.passive) L.push("    No Hellos (Passive interface)"); else L.push(`    Hello due in 00:00:0${Math.max(1, f.hello%10 || 4)}`);
      L.push("  Supports Link-local Signaling (LLS)", "  Cisco NSF helper support enabled", "  IETF NSF helper support enabled",
        `  Neighbor Count is ${(x.nbrs||[]).length}, Adjacent neighbor count is ${x.adj||0}`);
      for (const nb of (x.nbrs||[]).filter(nb=>/^FULL/.test(nb.state))) L.push(`    Adjacent with neighbor ${nb.rid}${/\/DR$/.test(nb.state)?"  (Designated Router)":/\/BDR$/.test(nb.state)?"  (Backup Designated Router)":""}`);
      L.push("  Suppress hello for 0 neighbor(s)");
      return L.join("\n"); }).join("\n");
  }
  function ospfAreas(){ return [...new Set(ospfIfaces().map(f=>f.area))].sort((a,b)=>a-b); }
  function ipProtocols(){
    if (!st.ospf || !routingOn()) return "";
    const o = st.ospf, fs = ospfIfaces(), areas = ospfAreas(), info = hooks.ospfSelf ? hooks.ospfSelf() || {} : {};
    const L = [`Routing Protocol is "ospf ${o.pid}"`, "  Outgoing update filter list for all interfaces is not set", "  Incoming update filter list for all interfaces is not set", `  Router ID ${ospfRid()}`];
    if (info.abr) L.push("  It is an area border router"); if (o.defOrig) L.push("  It is an autonomous system boundary router", " Redistributing External Routes from,");
    L.push(`  Number of areas in this router is ${areas.length}. ${areas.length} normal 0 stub 0 nssa`, "  Maximum path: 4", "  Routing for Networks:");
    for (const w of o.networks) L.push(`    ${w.net} ${w.wild} area ${areaStr(w.area)}`);
    const expl = fs.filter(f=>f.via==="Interface Configuration"); if (expl.length){ for (const a of [...new Set(expl.map(f=>f.area))]){ L.push(`  Routing on Interfaces Configured Explicitly (Area ${areaStr(a)}):`); expl.filter(f=>f.area===a).forEach(f=>L.push(`    ${f.ios}`)); } }
    const pas = ifNames().filter(n=>ospfPassive(n) && st.intfs[n].ip); if (pas.length){ L.push("  Passive Interface(s):"); pas.forEach(n=>L.push(`    ${n}`)); }
    L.push("  Routing Information Sources:", "    Gateway         Distance      Last Update");
    const srcs = [...new Set(((hooks.ospfRoutes && hooks.ospfRoutes()) || []).flatMap(r=>r.nhs.map(x=>x.from)).filter(Boolean))].sort((a,b)=>toInt(a)-toInt(b));
    for (const g of srcs) L.push(`    ${pad(g,16)}${String(110).padStart(8)}      ${ageOf(g)}`);
    L.push(`  Distance: (default is 110)`);
    return L.join("\n");
  }
  function ospfProcess(){
    if (!st.ospf || !routingOn()) return "";
    const o = st.ospf, rid = ospfRid(), info = hooks.ospfSelf ? hooks.ospfSelf() || {} : {}, fs = ospfIfaces();
    const L = [` Routing Process "ospf ${o.pid}" with ID ${rid}`, " Start time: 00:00:41.112, Time elapsed: 01:12:07.418", " Supports only single TOS(TOS0) routes", " Supports opaque LSA", " Supports Link-local Signaling (LLS)", " Supports area transit capability"];
    if (info.abr) L.push(" It is an area border router"); if (o.defOrig) L.push(" It is an autonomous system boundary router");
    L.push(" Router is not originating router-LSAs with maximum metric", " Initial SPF schedule delay 50 msecs", " Minimum hold time between two consecutive SPFs 200 msecs", " Maximum wait time between two consecutive SPFs 5000 msecs",
      ` Number of areas in this router is ${ospfAreas().length}. ${ospfAreas().length} normal 0 stub 0 nssa`, ` Reference bandwidth unit is ${o.refBw||100} mbps`);
    for (const a of ospfAreas()){ const inA = fs.filter(f=>f.area===a); L.push(`    Area ${a===0?"BACKBONE(0)":a}`, `        Number of interfaces in this area is ${inA.length}${inA.some(f=>f.loop)?` (${inA.filter(f=>f.loop).length} loopback)`:""}`, "        Area has no authentication", `        SPF algorithm last executed 00:0${(toInt(rid||"0.0.0.1")%8)+1}:12.448 ago`, `        SPF algorithm executed ${(info.spfRuns||3)} times`); }
    return L.join("\n");
  }
  function ospfDatabase(){
    if (!st.ospf || !routingOn()) return "";
    const rid = ospfRid(), db = (hooks.ospfLsdb && hooks.ospfLsdb()) || {areas:{}, ext:[]};
    const hdr = "Link ID         ADV Router      Age         Seq#       Checksum", row = (id, adv, extra) => pad(id,16) + pad(adv,16) + pad(String(100 + toInt(id)%1500),12) + "0x80000" + String(1 + toInt(adv)%9).padStart(3,"0") + " 0x00" + ((toInt(id)+toInt(adv))%65536).toString(16).toUpperCase().padStart(4,"0") + (extra!=null ? " " + extra : "");
    const L = ["", `            OSPF Router with ID (${rid}) (Process ID ${st.ospf.pid})`];
    for (const a of ospfAreas()){ const A = db.areas[a] || {routers:[], nets:[], sums:[]};
      L.push("", `                Router Link States (Area ${a})`, "", hdr + " Link count"); for (const r of A.routers) L.push(row(r.rid, r.rid, r.links));
      if (A.nets.length){ L.push("", `                Net Link States (Area ${a})`, "", hdr); for (const nn of A.nets) L.push(row(nn.ip, nn.rid)); }
      if (A.sums.length){ L.push("", `                Summary Net Link States (Area ${a})`, "", hdr); for (const sm of A.sums) L.push(row(sm.net, sm.rid)); } }
    if (db.ext.length){ L.push("", "                Type-5 AS External Link States", "", hdr + " Tag"); for (const x of db.ext) L.push(row(x.net, x.rid, 1)); }
    return L.join("\n");
  }
  function standbyBrief(){
    const gs = st.hsrpGroups(); if (!gs.length) return "";
    let o = "                     P indicates configured to preempt.\n                     |\nInterface   Grp  Pri P State   Active          Standby         Virtual IP\n";
    for (const g of gs){ const x = (hooks.hsrp && hooks.hsrp(g.ios, g.grp)) || {state: g.up ? "Active" : "Init", active: g.up ? "local" : "unknown", standby:"unknown"};
      o += pad(short(g.ios),12) + pad(g.grp,5) + pad(g.prio,4) + pad(g.preempt?"P":" ",2) + pad(x.state,8) + pad(x.active,16) + pad(x.standby,16) + g.vip + "\n"; }
    return o.replace(/\n$/,"");
  }
  function standbyDetail(){
    return st.hsrpGroups().map(g=>{ const x = (hooks.hsrp && hooks.hsrp(g.ios, g.grp)) || {state: g.up ? "Active" : "Init", active: g.up ? "local" : "unknown", standby:"unknown"}; const vm = hsrpVmac(g.grp, g.ver);
      return [`${g.ios} - Group ${g.grp}${g.ver===2?" (version 2)":""}`, `  State is ${x.state}`, `    ${x.changes||1} state change${(x.changes||1)>1?"s":""}, last state change 00:0${(g.grp%8)+1}:14`, `  Virtual IP address is ${g.vip}`,
        `  Active virtual MAC address is ${x.active==="unknown" ? "unknown" : vm}${x.state==="Active"?" (MAC In Use)":""}`, `    Local virtual MAC address is ${vm} (v${g.ver} default)`, "  Hello time 3 sec, hold time 10 sec", "    Next hello sent in 1.264 secs",
        `  Preemption ${g.preempt?"enabled":"disabled"}`, `  Active router is ${x.active}${x.activePrio!=null && x.active!=="local" ? `, priority ${x.activePrio} (expires in 8.912 sec)` : ""}`,
        `  Standby router is ${x.standby}${x.standbyPrio!=null && x.standby!=="local" ? `, priority ${x.standbyPrio} (expires in 9.360 sec)` : ""}`, `  Priority ${g.prio} (${g.prio===100?"default 100":"configured "+g.prio})`, `  Group name is "hsrp-${short(g.ios)}-${g.grp}" (default)`].join("\n"); }).join("\n");
  }
  function routeTable(only){
    if (kind==="switch" && !st.ipRouting) return `Default gateway is ${st.defaultGw||"not set"}\n\nHost               Gateway           Last Use    Total Uses  Interface\nICMP redirect cache is empty`;   // a Layer 2 switch has no routing table until "ip routing"
    const rib = ribAll(), def = rib.find(e=>e.len===0);
    const L = ["Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP", "       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area",
      "       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2", "       E1 - OSPF external type 1, E2 - OSPF external type 2",
      "       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2", "       ia - IS-IS inter area, * - candidate default, U - per-user static route",
      "       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP", "       a - application route", "       + - replicated route, % - next hop override, p - overrides from PfR", "",
      def ? `Gateway of last resort is ${def.nhs[0].direct ? "0.0.0.0" : (def.nhs[0].cfgNh || def.nhs[0].nh)} to network 0.0.0.0` : "Gateway of last resort is not set", ""];
    const keep = only==="connected" ? (e=>/^[CL]/.test(e.code)) : only==="static" ? (e=>/^S/.test(e.code)) : only==="ospf" ? (e=>/^O/.test(e.code)) : (()=>true);
    const rows = rib.map(e=>({net:e.net, len:e.len, e, show:keep(e), text:ribLine(e)}));   // headings count the whole table, even in a filtered view
    const classful = ip => { const f = +ip.split(".")[0]; const p = f<128 ? 8 : f<192 ? 16 : 24; return {major: netOf(ip, [0,0,0,0].map((_,k)=>k<p/8?255:0).join(".")), p}; };
    const groups = new Map();
    for (const r of rows){ if (r.len===0){ groups.set("0.0.0.0", {hdr:null, rows:[r]}); continue; } const c = classful(r.net); const key = c.major+"/"+c.p; if (!groups.has(key)) groups.set(key, {major:c.major, p:c.p, rows:[]}); groups.get(key).rows.push(r); }
    for (const [key,g] of [...groups].sort((x,y)=>x[0]==="0.0.0.0"?-1:y[0]==="0.0.0.0"?1:toInt(x[1].major)-toInt(y[1].major))){
      if (g.major){ const masks = [...new Set(g.rows.map(r=>r.len))]; const sub = g.rows.length;
        if (!(masks.length===1 && masks[0]===g.p)) L.push(masks.length>1 ? `      ${g.major}/${g.p} is variably subnetted, ${sub} subnets, ${masks.length} masks` : `      ${g.major}/${masks[0]} is subnetted, ${sub} subnets`);
        if (masks.length===1 && masks[0]!==g.p) g.rows.forEach(r=>{ r.text = ribLine(r.e, true); });
        if (masks.length===1 && masks[0]===g.p) g.rows.forEach(r=>{ r.text = ribLine(r.e, false, true); }); }
      else g.rows.forEach(r=>{ r.text = ribLine(r.e, false, true); });   // the default route
      const hdr = L.length; g.rows.sort((x,y)=>toInt(x.net)-toInt(y.net) || x.len-y.len).forEach(r=>{ if (r.show) L.push(r.text); });
      if (g.major && L.length===hdr && /^ {6}\S/.test(L[hdr-1]||"")) L.pop();   // nothing shown under this heading: drop it
    }
    return L.join("\n").replace(/\n$/,"");
  }
  function version(){
    const sw = kind==="switch";
    return [`Cisco IOS XE Software, Version 17.09.04a`, `Cisco IOS Software [Cupertino], ${sw?"Catalyst L3 Switch":"ISR"} Software, Version 17.9.4a, RELEASE SOFTWARE (fc3)`, "Technical Support: http://www.cisco.com/techsupport", "",
      `ROM: IOS-XE ROMMON`, `${st.host} uptime is ${opts.uptime||"2 hours, 14 minutes"}`, `System returned to ROM by ${opts.lastReload||"power-on"}`, `System image file is "flash:${sw?"cat9k_lite_iosxe":"c1100-universalk9"}.17.09.04a.SPA.bin"`, "",
      `cisco ${opts.model||(sw?"C9200L-24P-4G":"C1111-4P")} (${sw?"ARM":"1RU"}) processor with 1395406K/6147K bytes of memory.`, `${physical.length} Gigabit Ethernet interfaces`,
      // switches print a base MAC and model/serial block; ISR routers show the processor board ID instead
      ...(sw ? [`Base Ethernet MAC Address          : ${baseMac}.0000`, `Model Number                       : ${opts.model||"C9200L-24P-4G"}`, `System Serial Number               : ${opts.serial||"FOC2741X0AB"}`]
             : [`Processor board ID ${opts.serial||"FGL2741X0AB"}`]),
      "", `Configuration register is ${st.confreg||"0x2102"}${st.confregNext && st.confregNext!==(st.confreg||"0x2102") ? ` (will be ${st.confregNext} at next reload)` : ""}`].join("\n");
  }

  /* ---------- command tables ---------- */
  // pattern tokens: keywords (lowercase) or A:WORD A:IP A:MASK A:NUM A:IF A:LINE (rest of line)
  const X = (p, run, help) => ({ p: p.split(" ").map(t=>t.startsWith("A:")?t:t.toLowerCase()), run, help });   // keywords match case-insensitively (dot1Q = dot1q)
  const execShow = [
    X("show running-config", ()=>runningCfg()),
    X("show running-config interface A:IF", a=>{ const n = parseIf(a[0]); if (!n || !st.intfs[n]) return "% Invalid input detected at '^' marker.";
      const L = runningCfg().split("\n"), k = L.indexOf("interface " + n); if (k < 0) return "% Invalid input detected at '^' marker.";
      let e = k + 1; while (e < L.length && L[e].startsWith(" ")) e++; const blk = L.slice(k, e);
      return `Building configuration...\n\nCurrent configuration : ${blk.join("\n").length + 6} bytes\n!\n${blk.join("\n")}\nend`; }), X("show startup-config", ()=>st.startup ? runningCfgFrom(st.startup) : "startup-config is not present"),
    X("show version", ()=>version()), X("show ip interface brief", ()=>ipIntBrief()), X("show interfaces status", ()=>kind==="switch"?intStatus():inv()),
    X("show interfaces", ()=>ifNames().filter(n=>!st.intfs[n].loop||true).map(showInt).join("\n")),
    X("show ip interface A:IF", a=>{ const n = parseIf(a[0]); if (!n) return "% Invalid input detected at '^' marker."; const i = st.intfs[n], l = up(n);
      const L = [`${n} is ${i.shut?"administratively down":(l||(i.mode==="svi"&&st.vlans[i.vlan]))?"up":"down"}, line protocol is ${l?"up":"down"}`];
      if (!i.ip) L.push("  Internet protocol processing disabled");
      else L.push(`  Internet address is ${i.ip}/${maskLen(i.mask)}`, "  Broadcast address is 255.255.255.255", "  Address determined by setup command", "  MTU is 1500 bytes", ...(i.helpers && i.helpers.length ? (i.helpers.length===1 ? ["  Helper address is " + i.helpers[0]] : ["  Helper addresses are " + i.helpers[0], ...i.helpers.slice(1).map(h=>"                       " + h)]) : ["  Helper address is not set"]),
        "  Directed broadcast forwarding is disabled", "  Outgoing Common access list is not set", "  Outgoing access list is not set", "  Inbound Common access list is not set", "  Inbound  access list is not set",
        `  Proxy ARP is ${i.proxyArp===false?"disabled":"enabled"}`, "  Local Proxy ARP is disabled", "  Security level is default", "  Split horizon is enabled", "  ICMP redirects are always sent", "  ICMP unreachables are always sent", "  ICMP mask replies are never sent");
      return L.join("\n"); }),
    X("show interfaces A:IF", a=>{ const n = parseIf(a[0]); return n ? showInt(n) : "% Invalid interface type and number"; }),
    X("show vlan brief", ()=>vlanBrief()||inv()), X("show vlan", ()=>vlanBrief()||inv()),
    X("show interfaces trunk", ()=>kind==="switch"?trunkTable():inv()),
    X("show interfaces A:IF switchport", a=>{ const n = parseIf(a[0]); return n ? switchportInfo(n) : "% Invalid interface type and number"; }),
    X("show spanning-tree", ()=>stpShow(null)), X("show spanning-tree vlan A:NUM", a=>stpShow(a[0])),
    X("show spanning-tree summary", ()=>kind!=="switch"?inv():`Switch is in ${st.stpMode} mode\nRoot bridge for: ${activeVlans().filter(v=>!st.stpOff[v] && hooks.stp && (hooks.stp(v)||{}).isRoot).map(v=>"VLAN"+String(v).padStart(4,"0")).join(", ")||"none"}\nPortFast Default                        is ${st.pfDefault?"enabled":"disabled"}\nPortFast BPDU Guard Default             is ${st.bpduDefault?"enabled":"disabled"}`),
    X("show etherchannel summary", ()=>kind==="switch"?etherSummary():inv()),
    X("show vlans", ()=>{ if (kind!=="router") return inv(); const subs = ifNames().filter(n=>st.intfs[n].sub && st.intfs[n].encap);
      if (!subs.length) return "No Virtual LANs configured.";
      return subs.map(n=>{ const i = st.intfs[n]; return `Virtual LAN ID:  ${i.encap} (IEEE 802.1Q Encapsulation)\n\n   vLAN Trunk Interface:   ${n}${i.encapNative?"\n\n This is configured as native Vlan for the following interface(s) :\n"+i.parent:""}\n\n   Protocols Configured:   Address:              Received:        Transmitted:\n${i.ip?`           IP              ${pad(i.ip,21)}${pad("0",17)}0`:""}`; }).join("\n\n"); }),
    X("show etherchannel load-balance", ()=>{ if (kind!=="switch") return inv(); const m = st.lbMethod||"src-mac";
      const mac = {"src-mac":"Source MAC address","dst-mac":"Destination MAC address","src-dst-mac":"Source XOR Destination MAC address","src-ip":"Source MAC address","dst-ip":"Destination MAC address","src-dst-ip":"Source XOR Destination MAC address"}[m];
      const ip = {"src-mac":"Source MAC address","dst-mac":"Destination MAC address","src-dst-mac":"Source XOR Destination MAC address","src-ip":"Source IP address","dst-ip":"Destination IP address","src-dst-ip":"Source XOR Destination IP address"}[m];
      return `EtherChannel Load-Balancing Configuration:\n        ${m}\n\nEtherChannel Load-Balancing Addresses Used Per-Protocol:\nNon-IP: ${mac}\n  IPv4: ${ip}\n  IPv6: ${ip}`; }),
    X("show vtp status", ()=>kind!=="switch"?inv():`VTP Version capable             : 1 to 3\nVTP version running             : 1\nVTP Domain Name                 : ${st.vtpDomain}\nVTP Pruning Mode                : Disabled\nVTP Traps Generation            : Disabled\nDevice ID                       : ${baseMac}.0000\nVTP Operating Mode              : ${st.vtpMode[0].toUpperCase()+st.vtpMode.slice(1)}\nMaximum VLANs supported locally : 1005\nNumber of existing VLANs        : ${Object.keys(st.vlans).length}`),
    X("show logging", ()=>{ const L = hooks.logs ? hooks.logs(st) : [], n = L.length, sync = ntpState().synced;
      const hostsTxt = st.logHosts.map(h=>`        Logging to ${h}  (udp port 514, audit disabled,\n              link up),\n              ${L.filter(x=>x.sev<=st.logTrap && (x.to||[]).includes(h)).length} message lines logged,\n              0 message lines rate-limited,\n              0 message lines dropped-by-MD,\n              xml disabled, sequence number disabled\n              filtering disabled`).join("\n");
      return `Syslog logging: enabled (0 messages dropped, 0 messages rate-limited, 0 flushes, 0 overruns, xml disabled, filtering disabled)\n\nNo Active Message Discriminator.\n\n\nNo Inactive Message Discriminator.\n\n\n    Console logging: level ${SEV[st.logConsole!=null ? st.logConsole : 7]}, ${n} messages logged, xml disabled,\n                     filtering disabled\n    Monitor logging: level debugging, 0 messages logged, xml disabled,\n                     filtering disabled\n    Buffer logging:  level debugging, ${n} messages logged, xml disabled,\n                    filtering disabled\n    Exception Logging: size (4096 bytes)\n    Count and timestamp logging messages: disabled\n    Persistent logging: disabled\n\nNo active filter modules.\n\n    Trap logging: level ${SEV[st.logTrap]}, ${L.filter(x=>x.trapped!=null ? x.trapped : x.sev<=st.logTrap).length} message lines logged\n${hostsTxt}${hostsTxt ? "\n" : ""}        Logging Source-Interface:       VRF Name:\n\nLog Buffer (8192 bytes):\n\n` + L.map(x=>(sync ? "" : "*") + x.t + ": " + x.msg).join("\n"); }),
    X("show mac address-table", ()=>macTable()||inv()), X("show mac address-table dynamic", ()=>macTable({type:"dynamic"})||inv()),
    X("show mac address-table address A:WORD", a=>macTable({addr:a[0].toLowerCase()})||inv()), X("show mac address-table interface A:IF", a=>{ const n = parseIf(a[0]); return n ? macTable({intf:n}) : "% Invalid interface"; }),
    X("show mac address-table vlan A:NUM", a=>macTable({vlan:a[0]})||inv()),
    X("show cdp neighbors", ()=>cdpNeighbors(false)), X("show cdp neighbors detail", ()=>cdpNeighbors(true)),
    X("show lldp neighbors", ()=>lldpNeighbors()),
    X("show access-lists", ()=>window.ACL.show(st.acl)), X("show access-lists A:WORD", a=>window.ACL.show(st.acl, a[0])),
    X("show ip access-lists", ()=>window.ACL.show(st.acl)), X("show ip access-lists A:WORD", a=>window.ACL.show(st.acl, a[0])),
    X("show ip nat translations", ()=>window.NAT.show(st.nat, natCtx())), X("show ip nat translations verbose", ()=>window.NAT.show(st.nat, Object.assign(natCtx(), {verbose:true}))),
    X("show ip aliases", ()=>{ const rows = [];
      for (const n of ifNames()){ const i = st.intfs[n]; if (i.ip && !i.shut) rows.push(["Interface", i.ip]); }
      for (const x of st.nat.statics) if (x.global && ifNames().some(n=>{ const i = st.intfs[n]; return i.ip && sameNet(i.ip, x.global, i.mask); })) rows.push(["Dynamic", x.global]);
      for (const pl of Object.values(st.nat.pools)) for (let a = pl.start; a <= pl.end; a++){ if (!(pl.used||{})[a]) continue; const ip = [24,16,8,0].map(k=>Math.floor(a/2**k)%256).join("."); if (ifNames().some(n=>{ const i = st.intfs[n]; return i.ip && sameNet(i.ip, ip, i.mask); })) rows.push(["Dynamic", ip]); }
      return "Address Type             IP Address      Port\n" + rows.map(r=>pad(r[0], 25) + r[1]).join("\n"); }), X("show ip nat statistics", ()=>{ const f = st.natIfs(); return window.NAT.stats(st.nat, f.ins, f.outs); }),
    X("show dhcp lease", ()=>{ const L = ifNames().filter(n=>st.intfs[n].dhcpClient); if (!L.length) return "";
      return L.map(n=>{ const i = st.intfs[n], z = i.dhcpLease; if (!i.ip || !z) return `Temp IP addr: 0.0.0.0  for peer on Interface: ${n}\n   State is Selecting`;
        return `Temp IP addr: ${i.ip}  for peer on Interface: ${n}\nTemp  sub net mask: ${i.mask}\n   DHCP Lease server: ${z.server}, state: 3 Bound\n   DHCP transaction id: 1A2B\n   Lease: ${z.secs} secs,  Renewal: ${Math.floor(z.secs/2)} secs,  Rebind: ${Math.floor(z.secs*7/8)} secs\nTemp default-gateway addr: ${i.dhcpGw||"0.0.0.0"}\n   Next timer fires after: 11:59:38\n   Retry count: 0   Client-ID: ${cidText(n)}\n   Client-ID hex dump: ${cidHex(n)}\n   Hostname: ${st.host}`; }).join("\n"); }),
    X("show arp", ()=>arpTable()), X("show ip arp", ()=>arpTable()), X("show ip arp A:IP", a=>arpTable(a[0])), X("show arp A:IP", a=>arpTable(a[0])), X("show ip route", ()=>routeTable()), X("show ip route connected", ()=>routeTable("connected")), X("show ip route static", ()=>routeTable("static")), X("show ip route ospf", ()=>routeTable("ospf")),
    X("show ip route A:IP", a=>{ if (kind==="switch" && !st.ipRouting) return routeTable(); return routeEntryFor(a[0]); }),
    X("show ip ospf neighbor", ()=>ospfNeighbors()), X("show ip ospf interface brief", ()=>ospfIntBrief()), X("show ip ospf interface", ()=>ospfIntDetail(null)),
    X("show ip ospf interface A:IF", a=>{ const n = parseIf(a[0]); return n ? ospfIntDetail(n) : inv(); }), X("show ip ospf database", ()=>ospfDatabase()), X("show ip ospf", ()=>ospfProcess()),
    X("show ip protocols", ()=>ipProtocols()), X("show standby brief", ()=>standbyBrief()), X("show standby", ()=>standbyDetail()),
    X("show ipv6 interface brief", ()=>ipv6IntBrief()), X("show ipv6 interface", ()=>ipv6IntDetail(null)), X("show ipv6 interface A:IF", a=>{ const n = parseIf(a[0]); return n ? ipv6IntDetail(n) : inv(); }),
    X("show ipv6 route", ()=>ipv6Route()), X("show ipv6 route static", ()=>ipv6Route("static")), X("show ipv6 route connected", ()=>ipv6Route("connected")), X("show ipv6 route local", ()=>ipv6Route("local")), X("show ipv6 route A:WORD", a=>ipv6RouteEntry(a[0])), X("show ipv6 neighbors", ()=>ipv6Neighbors()),
    X("show history", ()=>st.history.slice(-20).map(h=>"  "+h).join("\n")), X("show users", ()=>{ const ss = (hooks.sessions && hooks.sessions()) || [];
      let o = "    Line       User       Host(s)              Idle       Location\n" + `${ss.some(s=>s.me)?" ":"*"}  0 con 0                idle                 00:00:00`;
      ss.forEach((s,i)=>{ o += `\n${s.me?"*":" "}  ${String(i+1).padEnd(2)}vty ${i}     ${pad(s.user||"",11)}idle                 00:00:0${i}  ${s.from}`; });
      return o; }),
    X("show ip ssh", ()=> st.rsa ? `SSH Enabled - version ${st.sshVer==="2"?"2.0":"1.99"}\nAuthentication timeout: 120 secs; Authentication retries: 3` : "SSH Disabled - version 1.99\n%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2)."),
    X("show clock", ()=>clockText()), X("show clock detail", ()=>clockText(true)),
    X("show ntp status", ()=>ntpStatus()), X("show ntp associations", ()=>ntpAssoc()),
    X("show hosts", ()=>{ const H = Object.entries(st.iosHosts);
      return `Name lookup view: Global\nDefault domain is ${st.domain||"not set"}\nName/address lookup uses ${st.domainLookup ? "domain service" : "static mappings"}\nName servers are ${st.nameServers.length ? st.nameServers.join(", ") : "255.255.255.255"}\n\nCodes: UN - unknown, EX - expired, OK - OK, ?? - revalidate\n       temp - temporary, perm - permanent\n       NA - Not Applicable None - Not defined\n\nHost                      Port  Flags      Age Type   Address(es)\n` + H.map(([n,ip])=>`${pad(n,26)}None  (perm, OK)  0   IP     ${ip}`).concat(Object.entries(st.dnsCache||{}).map(([n,ip])=>`${pad(n,26)}None  (temp, OK)  0   IP     ${ip}`)).join("\n"); }),
    X("show snmp community", ()=>Object.entries(st.snmp.communities).map(([c,v])=>`\nCommunity name: ${c}\nCommunity Index: ${c}\nCommunity SecurityName: ${c}\nstorage-type: nonvolatile\t active ${v.acl ? "access-list: " + v.acl : ""}`.trimEnd()).join("\n")),
    X("show snmp", ()=>{ if (!Object.keys(st.snmp.communities).length) return "%SNMP agent not enabled"; const c = st.snmpStats || {};
      return `Chassis: FGL2331A0BC\n${st.snmp.contact ? "Contact: " + st.snmp.contact + "\n" : ""}${st.snmp.location ? "Location: " + st.snmp.location + "\n" : ""}${c.inp||0} SNMP packets input\n    0 Bad SNMP version errors\n    ${c.badComm||0} Unknown community name\n    ${c.illegal||0} Illegal operation for community name supplied\n    0 Encoding errors\n    ${c.vars||0} Number of requested variables\n    ${c.altered||0} Number of altered variables\n    ${c.get||0} Get-request PDUs\n    ${c.next||0} Get-next PDUs\n    ${c.set||0} Set-request PDUs\n    0 Input queue packet drops (Maximum queue size 1000)\n${c.out||0} SNMP packets output\n    0 Too big errors (Maximum packet size 1500)\n    0 No such name errors\n    0 Bad values errors\n    0 General errors\n    ${c.resp||0} Response PDUs\n    0 Trap PDUs\nSNMP global trap: ${st.snmp.traps ? "enabled" : "disabled"}`; }),
    X("show snmp location", ()=>st.snmp.location || ""), X("show snmp contact", ()=>st.snmp.contact || ""),
  ];
  const execCommon = [
    X("show ip dhcp binding", ()=>window.DHCP.showBinding(st.dhcp)), X("show ip dhcp pool", ()=>window.DHCP.showPool(st.dhcp, null, ownIps())), X("show ip dhcp pool A:WORD", a=>window.DHCP.showPool(st.dhcp, a[0], ownIps())),
    X("show ip dhcp conflict", ()=>window.DHCP.showConflict(st.dhcp)),
    X("ping A:WORD", a=>doPing(a[0])), X("ping ipv6 A:WORD", a=>I6.valid(a[0]) ? doPing6(a[0], null) : inv()), X("traceroute ipv6 A:WORD", a=>I6.valid(a[0]) ? doTrace6(a[0]) : inv()), X("ping A:WORD source A:WORD", a=>doPing(a[0], a[1])), X("ping A:WORD source A:WORD A:WORD", a=>doPing(a[0], a[1] + a[2])), X("traceroute A:WORD", a=>doTrace(a[0])), X("traceroute A:WORD source A:WORD", a=>doTrace(a[0], a[1])), X("traceroute A:WORD source A:WORD A:WORD", a=>doTrace(a[0], a[1] + a[2])), X("exit", ()=>{ st.mode="user"; return {logout:true}; }), X("logout", ()=>({logout:true})),
    X("terminal length A:NUM", ()=>""), X("terminal no monitor", ()=>""),
  ];
  const T = {
    user: [ X("enable", ()=>goEnable()), ...execCommon, X("show version", ()=>version()), X("show ip interface brief", ()=>ipIntBrief()), X("show interfaces status", ()=>kind==="switch"?intStatus():inv()), X("show history", ()=>st.history.slice(-20).map(h=>"  "+h).join("\n")), X("show clock", ()=>clockText()) ],
    priv: [ X("disable", ()=>{ st.mode="user"; return ""; }), X("configure terminal", ()=>{ st.mode="config"; return "Enter configuration commands, one per line.  End with CNTL/Z."; }),
      ...execShow, ...execCommon,
      X("copy running-config startup-config", ()=>ask("Destination filename [startup-config]? ", ()=>save())),
      X("write memory", ()=>save()), X("write", ()=>save()),
      X("copy running-config tftp:", ()=>tftpUp(()=>runningCfg(), "confg")), X("copy startup-config tftp:", ()=>st.startup ? tftpUp(()=>runningCfgFrom(st.startup), "confg") : "%Error opening nvram:/startup-config (No such file or directory)"),
      X("copy running-config tftp", ()=>tftpUp(()=>runningCfg(), "confg")),
      X("copy tftp: running-config", ()=>tftpDown()), X("copy tftp running-config", ()=>tftpDown()),
      X("erase startup-config", ()=>ask("Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]", l=> /^n/i.test(l) ? "" : (st.startup=null, st.savedOnce=false, "[OK]\nErase of nvram: complete"))),
      X("write erase", ()=>ask("Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]", l=> /^n/i.test(l) ? "" : (st.startup=null, st.savedOnce=false, "[OK]\nErase of nvram: complete"))),
      X("reload", ()=>{ const unsaved = !st.startup || JSON.stringify(snapshot())!==JSON.stringify(st.startup);
          const go = () => ask("Proceed with reload? [confirm]", l=> /^n/i.test(l) ? "" : doReload());
          return unsaved ? ask("\nSystem configuration has been modified. Save? [yes/no]: ", l=>{ if (/^y/i.test(l)){ save(); } else if (!/^n/i.test(l)) return "% Please answer 'yes' or 'no'."; return go(); }) : go(); }),
      X("reload in A:NUM", a=>{ const m = +a[0]; return ask(`Reload scheduled in ${m} minutes by console\nReload reason: Reload Command\nProceed with reload? [confirm]`, l=>{ if (/^n/i.test(l)) return ""; st.reloadIn = m; return ""; }); }),
      X("reload cancel", ()=>{ if (!st.reloadIn) return "%No reload is scheduled."; st.reloadIn = null; return "\n\n***\n*** --- SHUTDOWN ABORTED ---\n***\n"; }),
      X("show reload", ()=>st.reloadIn ? `Reload scheduled in ${st.reloadIn} minutes by console\nReload reason: Reload Command` : "No reload is scheduled."),
      X("clear mac address-table dynamic", ()=>{ if (kind!=="switch") return inv(); hooks.clearMac(); return ""; }),
      X("clear ip nat translation A:WORD", a=>{ if (a[0]!=="*") return inv(); window.NAT.clear(st.nat); return ""; }),
      X("clear ip nat statistics", ()=>{ st.nat.hits = 0; st.nat.misses = 0; st.nat.expired = 0; for (const p of Object.values(st.nat.pools)) p.misses = 0; return ""; }),
      X("clear ip dhcp binding A:WORD", a=>{ if (a[0]==="*") window.DHCP.clear(st.dhcp); else st.dhcp.bindings = st.dhcp.bindings.filter(b=>b.ip!==a[0]); return ""; }),
      X("clear ip dhcp conflict A:WORD", a=>{ if (a[0]==="*") window.DHCP.clear(st.dhcp, "conflict"); else st.dhcp.conflicts = st.dhcp.conflicts.filter(c=>c.ip!==a[0]); return ""; }),
      X("clear access-list counters", ()=>{ window.ACL.clear(st.acl); return ""; }), X("clear access-list counters A:WORD", a=>{ window.ACL.clear(st.acl, a[0]); return ""; }),
      X("clear ip access-list counters", ()=>{ window.ACL.clear(st.acl); return ""; }), X("clear ip access-list counters A:WORD", a=>{ window.ACL.clear(st.acl, a[0]); return ""; }),
      X("clear arp-cache", ()=>""), X("clear ip route *", ()=>""),
      X("clear ip ospf process", ()=>{ if (!st.ospf) return ""; return ask("Reset ALL OSPF processes? [no]: ", l=>{ if (!/^y/i.test(l.trim())) return ""; st.ospfRidActive = null; st.ospfResets = (st.ospfResets||0) + 1; ospfRid(); return ""; }); }), X("clear counters", ()=>ask("Clear \"show interface\" counters on all interfaces [confirm]", ()=>"")),
    ],
    config: [
      X("hostname A:WORD", a=>{ if (!/^[A-Za-z][\w-]{0,62}$/.test(a[0])) return "% Hostname contains one or more illegal characters."; st.host = a[0]; return ""; }),
      X("enable secret A:LINE", a=>{ st.enableSecret = unhash(a[0]); return ""; }),
      X("enable password A:LINE", a=>{ st.enablePassword = unhash(a[0]); return st.enableSecret ? "% The enable password you have chosen is the same as your enable secret.\n% This is not recommended.  Re-enter the enable password.".replace(/.*/s, m=> a[0]===st.enableSecret?m:"") : ""; }),
      X("no enable secret", ()=>{ st.enableSecret=null; return ""; }), X("no enable password", ()=>{ st.enablePassword=null; return ""; }),
      X("service password-encryption", ()=>{ st.servicePwEnc=true; return ""; }), X("no service password-encryption", ()=>{ st.servicePwEnc=false; return ""; }),
      X("banner motd A:LINE", a=>{ const s = a[0]; const d = s[0]; const end = s.indexOf(d,1); if (end<0) return ask(`Enter TEXT message.  End with the character '${d}'.`, l=>{ st.banner = (s.slice(1)+"\n"+l).replace(new RegExp("\\"+d+".*$"),""); return ""; }); st.banner = s.slice(1,end); return ""; }),
      X("no banner motd", ()=>{ st.banner=null; return ""; }),
      X("interface range A:LINE", a=>{ const list = parseRange(a[0]); if (!list) return "% Invalid input detected — try: interface range g0/1 - 4"; st.mode="config-if"; st.cur=list[0]; st.curList=list; return ""; }),
      X("interface A:IF", a=>{ const n = parseIf(a[0], true); if (!n) return "% Invalid input detected at '^' marker."; st.mode="config-if"; st.cur=n; st.curList=[n]; return ""; }),
      X("no interface A:IF", a=>{ const n = parseIf(a[0]); if (n && (n.startsWith("Vlan")||n.startsWith("Loopback")) && n!=="Vlan1"){ delete st.intfs[n]; return ""; } return "% Cannot remove a physical interface"; }),
      X("vlan A:WORD", a=>{ if (kind!=="switch") return inv(); if (!/^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(a[0])) return inv(); const vs = vlist(a[0]); if (!vs.length || vs.length !== vlistRaw(a[0]).length) return "% Bad VLAN list - a VLAN number is out of the range 1..4094.";
        const def = vs.find(v=>v>=1002&&v<=1005); if (def && vs.length===1) return "Default VLAN "+def+" may not have its name changed.";
        const ext = vs.filter(v=>v>1005); if (ext.length && /^(server|client)$/.test(st.vtpMode)) return "Extended VLAN(s) not allowed in current VTP mode.\n%Failed to commit extended VLAN(s) changes.\n(VTP version 1 or 2 only allows VLANs 1006-4094 in VTP transparent or off mode: vtp mode transparent)";
        for (const v of vs) if (!st.vlans[v] && !(v>=1002&&v<=1005)) st.vlans[v] = `VLAN${String(v).padStart(4,"0")}`;
        st.mode="config-vlan"; st.curVlans = vs.filter(v=>v<1002||v>1005); st.curVlan = st.curVlans[0]; return ""; }),
      X("no vlan A:WORD", a=>{ if (!/^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(a[0])) return inv(); const vs = vlist(a[0]); const bad = vs.find(v=>v===1 || (v>=1002&&v<=1005)); if (bad) return `%Default VLAN ${bad} may not be deleted.`; for (const v of vs) delete st.vlans[v]; return ""; }),
      X("line console A:NUM", a=>{ if (a[0]!=="0") return "% Invalid input detected at '^' marker."; st.mode="config-line"; st.curLine="con"; return ""; }),
      X("line vty A:NUM A:NUM", a=>{ st.mode="config-line"; st.curLine="vty"; return ""; }),
      X("username A:WORD secret A:LINE", a=>{ st.users[a[0]] = {secret:unhash(a[1])}; return ""; }),
      X("username A:WORD password A:LINE", a=>{ st.users[a[0]] = {password:unhash(a[1])}; return ""; }),
      X("username A:WORD privilege A:NUM secret A:LINE", a=>{ st.users[a[0]] = {secret:unhash(a[2]), priv:+a[1]}; return ""; }),
      X("no username A:WORD", a=>{ delete st.users[a[0]]; return ""; }),
      X("ip domain-name A:WORD", a=>{ st.domain=a[0]; return ""; }), X("ip domain name A:WORD", a=>{ st.domain=a[0]; return ""; }),
      X("no ip domain-lookup", ()=>{ st.domainLookup=false; return ""; }), X("ip domain lookup", ()=>{ st.domainLookup=true; return ""; }), X("no ip domain lookup", ()=>{ st.domainLookup=false; return ""; }), X("ip domain-lookup", ()=>{ st.domainLookup=true; return ""; }),
      X("crypto key generate rsa", ()=>{ if (st.host==="Switch"||st.host==="Router") return "% Please define a hostname other than "+st.host+"."; if (!st.domain) return "% Please define a domain-name first."; return ask(`The name for the keys will be: ${st.host}.${st.domain}\nChoose the size of the key modulus in the range of 512 to 4096 for your\n  General Purpose Keys. Choosing a key modulus greater than 512 may take\n  a few minutes.\n\nHow many bits in the modulus [2048]: `, l=>{ const b = +(l.trim()||2048); if (!(b>=512&&b<=4096)) return "% Invalid modulus"; st.rsa=b; return `% The key modulus size is ${b} bits\n% Generating ${b} bit RSA keys, keys will be non-exportable...\n[OK] (elapsed time was 1 seconds)\n%SSH-5-ENABLED: SSH 1.99 has been enabled`; }); }),
      X("crypto key generate rsa modulus A:NUM", a=>{ if (st.host==="Switch"||st.host==="Router") return "% Please define a hostname other than "+st.host+"."; if (!st.domain) return "% Please define a domain-name first."; const b=+a[0]; if (!(b>=512&&b<=4096)) return "% Invalid modulus"; st.rsa=b; return `The name for the keys will be: ${st.host}.${st.domain}\n% The key modulus size is ${b} bits\n% Generating ${b} bit RSA keys, keys will be non-exportable...\n[OK] (elapsed time was 1 seconds)\n%SSH-5-ENABLED: SSH 1.99 has been enabled`; }),
      X("crypto key zeroize rsa", ()=>{ st.rsa=0; return "% All keys will be removed.\n%SSH-5-DISABLED: SSH 1.99 has been disabled"; }),
      X("ip ssh version A:NUM", a=>{ if (!/^[12]$/.test(a[0])) return "% Invalid input"; if (!st.rsa && a[0]==="2") return "Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2)."; st.sshVer=a[0]; return ""; }),
      X("config-register A:WORD", a=>{ if (!/^0x[0-9a-f]{1,4}$/i.test(a[0])) return "% Invalid input detected at '^' marker."; st.confregNext = "0x" + a[0].slice(2).toUpperCase().padStart(4,"0"); return ""; }),
      X("ip default-gateway A:IP", a=>{ if (!ipRe.test(a[0])) return "% Invalid input detected at '^' marker."; st.defaultGw=a[0]; return ""; }), X("no ip default-gateway", ()=>{ st.defaultGw=null; return ""; }),
      X("ip route A:IP A:MASK A:LINE", a=>{ const mOk = a[1]==="0.0.0.0" || maskOk(a[1]); if (!ipRe.test(a[0]) || !mOk || netOf(a[0], a[1])!==a[0]) return "%Inconsistent address and mask";
        const r = parseRouteArgs(a[2]); if (r.err) return r.err;
        if (r.nh && Object.values(st.intfs).some(i=>i.ip===r.nh)) return "%Invalid next hop address (it's this router)";
        const same = x => x.net===a[0] && x.mask===a[1] && (x.ios||null)===(r.ios||null) && (x.nh||null)===(r.nh||null);
        const ex = st.routes.find(same); if (ex){ if (r.ad) ex.ad = r.ad; else delete ex.ad; return ""; }
        const e = {net:a[0], mask:a[1]}; if (r.ios) e.ios = r.ios; if (r.nh) e.nh = r.nh; if (r.ad) e.ad = r.ad; st.routes.push(e); return ""; }),
      X("no ip route A:IP A:MASK", a=>{ st.routes = st.routes.filter(r=>!(r.net===a[0]&&r.mask===a[1])); return ""; }),
      X("no ip route A:IP A:MASK A:LINE", a=>{ const r = parseRouteArgs(a[2]); if (r.err) return r.err; st.routes = st.routes.filter(x=>!(x.net===a[0]&&x.mask===a[1]&&(!r.ios||x.ios===r.ios)&&(!r.nh||x.nh===r.nh))); return ""; }),
      X("router ospf A:NUM", a=>{ const pid = +a[0]; if (!(pid>=1 && pid<=65535)) return inv(); if (kind==="switch" && !st.ipRouting) return "% IP routing not enabled";
        if (st.ospf && st.ospf.pid!==pid) return `% This lab runs one OSPF process — this router already has "router ospf ${st.ospf.pid}"`;
        if (!st.ospf) st.ospf = {pid, rid:null, networks:[], passive:[], noPassive:[], passiveDefault:false, defOrig:false, defAlways:false, refBw:100};
        st.mode = "config-router"; const rid = ospfRid(); return rid ? "" : `%OSPF-4-NORTRID: OSPF process ${pid} failed to allocate unique router-id and cannot start`; }),
      X("no router ospf A:NUM", a=>{ if (!st.ospf || st.ospf.pid!==+a[0]) return ""; st.ospf = null; st.ospfRidActive = null; for (const i of Object.values(st.intfs)) if (i.ospfArea) delete i.ospfArea; return ""; }),
      X("cdp run", ()=>{ st.cdpRun=true; return ""; }), X("no cdp run", ()=>{ st.cdpRun=false; return ""; }),
      X("spanning-tree mode A:WORD", a=>{ const m = a[0].toLowerCase(); if (!["pvst","rapid-pvst","mst"].includes(m)) return inv(); if (kind!=="switch") return inv(); st.stpMode = m==="mst" ? "rapid-pvst" : m; return m==="mst" ? "(MST isn't modelled in this lab — staying in rapid-pvst)" : ""; }),
      X("spanning-tree vlan A:WORD priority A:NUM", a=>{ if (kind!=="switch") return inv(); const p = +a[1]; if (p%4096 || p<0 || p>61440) return "% Bridge Priority must be in increments of 4096.\n% Allowed values are:\n  0     4096  8192  12288 16384 20480 24576 28672\n  32768 36864 40960 45056 49152 53248 57344 61440"; for (const v of vlist(a[0])) st.stpPrio[v] = p; return ""; }),   // stored as typed; the bridge ID adds the VLAN (sys-id-ext)
      X("spanning-tree vlan A:WORD root A:WORD", a=>{ if (kind!=="switch") return inv(); const k = a[1].toLowerCase(); if (!/^(primary|secondary)$/.test(k)) return inv(); for (const v of vlist(a[0])){ let p = k==="primary" ? 24576 : 28672; const d = hooks.stp ? hooks.stp(v) : null; if (k==="primary" && d && !d.isRoot && d.root.prio - v <= 24576) p = Math.max(0, d.root.prio - v - 4096); st.stpPrio[v] = p; } return ""; }),
      X("no spanning-tree vlan A:WORD priority", a=>{ for (const v of vlist(a[0])) delete st.stpPrio[v]; return ""; }),
      X("no spanning-tree vlan A:WORD", a=>{ if (kind!=="switch") return inv(); for (const v of vlist(a[0])) st.stpOff[v] = true; return ""; }),
      X("spanning-tree vlan A:WORD", a=>{ for (const v of vlist(a[0])) delete st.stpOff[v]; return ""; }),
      X("spanning-tree portfast default", ()=>{ st.pfDefault = true; return "%Warning: this command enables portfast by default on all interfaces. You\n should now disable portfast explicitly on switched ports leading to hubs,\n switches and bridges as they may create temporary bridging loops."; }),
      X("no spanning-tree portfast default", ()=>{ st.pfDefault = false; return ""; }),
      X("spanning-tree portfast bpduguard default", ()=>{ st.bpduDefault = true; return ""; }), X("no spanning-tree portfast bpduguard default", ()=>{ st.bpduDefault = false; return ""; }),
      X("port-channel load-balance A:WORD", a=>{ if (kind!=="switch") return inv(); const m = ["src-mac","dst-mac","src-dst-mac","src-ip","dst-ip","src-dst-ip"].find(x=>x===a[0].toLowerCase()); if (!m) return inv(); st.lbMethod = m; return ""; }),
      X("no port-channel load-balance", ()=>{ st.lbMethod = null; return ""; }),
      // ---- access lists (numbered: access-list N …; named: ip access-list standard|extended NAME → sub-mode) ----
      X("access-list A:LINE", a=>{ const r = window.ACL.globalCmd(st.acl, "access-list " + a[0]); return r.err || ""; }),
      X("no access-list A:LINE", a=>{ const r = window.ACL.globalCmd(st.acl, "no access-list " + a[0]); return r.err || ""; }),
      X("ip access-list standard A:WORD", a=>{ const r = window.ACL.enterNamed(st.acl, "standard", a[0]); if (r.err) return r.err; st.mode = r.mode; st.curAcl = r.ctx; return ""; }),
      X("ip access-list extended A:WORD", a=>{ const r = window.ACL.enterNamed(st.acl, "extended", a[0]); if (r.err) return r.err; st.mode = r.mode; st.curAcl = r.ctx; return ""; }),
      X("no ip access-list standard A:WORD", a=>{ const l = st.acl.lists[a[0]]; if (l && l.kind==="standard") delete st.acl.lists[a[0]]; return ""; }),
      X("no ip access-list extended A:WORD", a=>{ const l = st.acl.lists[a[0]]; if (l && l.kind==="extended") delete st.acl.lists[a[0]]; return ""; }),
      X("ip access-list resequence A:WORD A:NUM A:NUM", a=>{ const r = window.ACL.resequence(st.acl, a[0], a[1], a[2]); return r.err || ""; }),
      // ---- DHCP server ----
      X("ip dhcp excluded-address A:LINE", a=>{ const r = window.DHCP.globalCmd(st.dhcp, "ip dhcp excluded-address " + a[0]); return r.err || ""; }),
      X("no ip dhcp excluded-address A:LINE", a=>{ const r = window.DHCP.globalCmd(st.dhcp, "no ip dhcp excluded-address " + a[0]); return r.err || ""; }),
      X("ip dhcp pool A:WORD", a=>{ const r = window.DHCP.globalCmd(st.dhcp, "ip dhcp pool " + a[0]); if (r.err) return r.err; st.mode = "config-dhcp"; st.curPool = r.ctx; return ""; }),
      X("no ip dhcp pool A:WORD", a=>{ const r = window.DHCP.globalCmd(st.dhcp, "no ip dhcp pool " + a[0]); return r.err || ""; }),
      // ---- syslog ----
      X("logging host A:IP", a=>{ if (!st.logHosts.includes(a[0])) st.logHosts.push(a[0]); return ""; }), X("logging A:IP", a=>{ if (!st.logHosts.includes(a[0])) st.logHosts.push(a[0]); return ""; }),
      X("no logging host A:IP", a=>{ st.logHosts = st.logHosts.filter(h=>h!==a[0]); return ""; }), X("no logging A:IP", a=>{ st.logHosts = st.logHosts.filter(h=>h!==a[0]); return ""; }),
      X("logging trap A:WORD", a=>{ const k = sevOf(a[0]); if (k<0) return inv(); st.logTrap = k; return ""; }), X("logging trap", ()=>{ st.logTrap = 6; return ""; }), X("no logging trap", ()=>{ st.logTrap = 6; return ""; }),
      X("logging buffered A:LINE", a=>{ st.logBuffered = a[0]; return ""; }), X("no logging buffered", ()=>{ st.logBuffered = null; return ""; }),
      X("logging console A:WORD", a=>{ const k = sevOf(a[0]); if (k<0) return inv(); st.logConsole = k; return ""; }), X("no logging console", ()=>{ st.logConsole = null; return ""; }),
      X("service timestamps A:LINE", ()=>""), X("no service timestamps A:LINE", ()=>""),
      // ---- NTP and the clock ----
      X("ntp server A:IP", a=>{ if (!st.ntpServers.includes(a[0])) st.ntpServers.push(a[0]); return ""; }), X("ntp server A:IP prefer", a=>{ if (!st.ntpServers.includes(a[0])) st.ntpServers.unshift(a[0]); return ""; }),
      X("no ntp server A:IP", a=>{ st.ntpServers = st.ntpServers.filter(h=>h!==a[0]); return ""; }),
      X("ntp master", ()=>{ st.ntpMaster = 8; return ""; }), X("ntp master A:NUM", a=>{ const n = +a[0]; if (!(n>=1 && n<=15)) return inv(); st.ntpMaster = n; return ""; }), X("no ntp master", ()=>{ st.ntpMaster = null; return ""; }), X("no ntp master A:NUM", ()=>{ st.ntpMaster = null; return ""; }),
      X("ntp update-calendar", ()=>""),
      X("clock timezone A:WORD A:LINE", a=>{ const t = a[1].trim().split(/\s+/); const h = +t[0], m = +(t[1]||0); if (!Number.isInteger(h) || h<-23 || h>23 || !(m>=0 && m<60) || t.length>2) return inv(); st.tz = {name:a[0], h, m}; return ""; }),
      X("no clock timezone", ()=>{ st.tz = null; return ""; }),
      // ---- SNMP ----
      X("snmp-server community A:WORD A:LINE", a=>{ const t = a[1].trim().split(/\s+/), mode = t[0].toLowerCase(); if (mode!=="ro" && mode!=="rw") return inv(); st.snmp.communities[a[0]] = {mode, acl: t[1] || null}; return ""; }),
      X("snmp-server community A:WORD", a=>{ st.snmp.communities[a[0]] = {mode:"ro", acl:null}; return ""; }),
      X("no snmp-server community A:WORD", a=>{ delete st.snmp.communities[a[0]]; return ""; }), X("no snmp-server community A:WORD A:LINE", a=>{ delete st.snmp.communities[a[0]]; return ""; }),
      X("snmp-server location A:LINE", a=>{ st.snmp.location = a[0]; return ""; }), X("no snmp-server location", ()=>{ st.snmp.location = null; return ""; }),
      X("snmp-server contact A:LINE", a=>{ st.snmp.contact = a[0]; return ""; }), X("no snmp-server contact", ()=>{ st.snmp.contact = null; return ""; }),
      X("snmp-server host A:IP A:LINE", a=>{ const t = a[1].trim().split(/\s+/); let v = "1", k = 0; if (t[0]==="version"){ v = t[1]; k = 2; } if (!t[k]) return "% Incomplete command."; st.snmp.hosts = st.snmp.hosts.filter(h=>h.ip!==a[0]); st.snmp.hosts.push({ip:a[0], ver:v, community:t[k]}); return ""; }),
      X("no snmp-server host A:IP A:LINE", a=>{ st.snmp.hosts = st.snmp.hosts.filter(h=>h.ip!==a[0]); return ""; }),
      X("snmp-server enable traps", ()=>{ st.snmp.traps = true; return ""; }), X("snmp-server enable traps A:LINE", ()=>{ st.snmp.traps = true; return ""; }), X("no snmp-server enable traps", ()=>{ st.snmp.traps = false; return ""; }),
      // ---- DNS ----
      X("ip host A:WORD A:IP", a=>{ st.iosHosts[a[0].toLowerCase()] = a[1]; return ""; }), X("no ip host A:WORD", a=>{ delete st.iosHosts[a[0].toLowerCase()]; return ""; }), X("no ip host A:WORD A:IP", a=>{ delete st.iosHosts[a[0].toLowerCase()]; return ""; }),
      X("ip name-server A:LINE", a=>{ const t = a[0].trim().split(/\s+/); if (t.some(x=>!ipRe.test(x))) return inv(); for (const x of t) if (!st.nameServers.includes(x)) st.nameServers.push(x); if (st.nameServers.length > 6) st.nameServers = st.nameServers.slice(0, 6); return ""; }),
      X("no ip name-server", ()=>{ st.nameServers = []; return ""; }), X("no ip name-server A:LINE", a=>{ const t = a[0].trim().split(/\s+/); st.nameServers = st.nameServers.filter(x=>!t.includes(x)); return ""; }),
      X("ip dns server", ()=>{ st.dnsServer = true; return ""; }), X("no ip dns server", ()=>{ st.dnsServer = false; return ""; }),
      // ---- NAT/PAT ----
      X("ip nat A:LINE", a=>{ const r = window.NAT.globalCmd(st.nat, "ip nat " + a[0], {ifName: n=>parseIf(n), ifAddr: n => (st.intfs[n]||{}).ip || null}); return r.err || ""; }),
      X("no ip nat A:LINE", a=>{ const r = window.NAT.globalCmd(st.nat, "no ip nat " + a[0], {ifName: n=>parseIf(n)}); return r.err || ""; }),
      X("service dhcp", ()=>{ st.serviceDhcp = true; return ""; }), X("no service dhcp", ()=>{ st.serviceDhcp = false; return ""; }),
      X("ipv6 unicast-routing", ()=>{ st.v6routing = true; return ""; }), X("ipv6 route static resolve default", ()=>{ st.v6resolveDefault = true; return ""; }), X("no ipv6 route static resolve default", ()=>{ st.v6resolveDefault = false; return ""; }), X("no ipv6 unicast-routing", ()=>{ st.v6routing = false; return ""; }),
      X("ipv6 route A:WORD A:LINE", a=>{ const p = I6.parsePrefix(a[0]); if (!p) return "% Invalid input detected at '^' marker.";
        const net = I6.str(I6.mask(p.w, p.len)); if (!I6.eq(net, p.w)) return "% Invalid input detected at '^' marker.";   // IOS wants the prefix itself
        const tk = tokens(a[1]); let ios = null, nh = null, ad = null, k = 0;
        if (tk[k] && !I6.valid(tk[k]) && !/^\d+$/.test(tk[k])){ let n = parseIf(tk[k]); if (!n && tk[k+1]){ n = parseIf(tk[k]+tk[k+1]); if (n) k++; } if (!n) return "% Invalid input detected at '^' marker."; ios = n; k++; }
        if (tk[k] && I6.valid(tk[k])){ nh = I6.str(I6.parse(tk[k])); k++; }
        if (tk[k] && /^\d+$/.test(tk[k])){ ad = +tk[k]; if (!(ad>=1&&ad<=254)) return "% Invalid input detected at '^' marker."; k++; }
        if (k < tk.length || (!ios && !nh)) return "% Incomplete command.";
        if (nh && I6.isLL(nh) && !ios) return "% Interface has to be specified for a link-local nexthop";
        st.routes6 = st.routes6 || []; const same = x => x.net===net && x.len===p.len && (x.ios||null)===(ios||null) && (x.nh||null)===(nh||null);
        const ex = st.routes6.find(same); if (ex){ if (ad) ex.ad = ad; else delete ex.ad; return ""; }
        const e = {net, len:p.len}; if (ios) e.ios = ios; if (nh) e.nh = nh; if (ad) e.ad = ad; st.routes6.push(e); return ""; }),
      X("no ipv6 route A:WORD", a=>{ const p = I6.parsePrefix(a[0]); if (!p) return inv(); st.routes6 = (st.routes6||[]).filter(r=>!(I6.eq(r.net, I6.mask(p.w,p.len)) && r.len===p.len)); return ""; }),
      X("no ipv6 route A:WORD A:LINE", a=>{ const p = I6.parsePrefix(a[0]); if (!p) return inv(); const tk = tokens(a[1]); st.routes6 = (st.routes6||[]).filter(r=>!(I6.eq(r.net, I6.mask(p.w,p.len)) && r.len===p.len && tk.every(x=> (r.nh && I6.valid(x) && I6.eq(r.nh, x)) || (r.ios && parseIf(x)===r.ios) || /^\d+$/.test(x)))); return ""; }),
      X("ip routing", ()=>{ if (kind==="switch") st.ipRouting = true; return ""; }), X("no ip routing", ()=>{ if (kind==="switch") st.ipRouting = false; return ""; }),
      X("vtp mode A:WORD", a=>{ const m = a[0].toLowerCase(); if (!/^(server|client|transparent|off)$/.test(m)) return inv(); st.vtpMode = m; return `Setting device to VTP ${m.toUpperCase()} mode for VLANS.`; }),
      X("vtp domain A:WORD", a=>{ st.vtpDomain = a[0]; return `Changing VTP domain name from ${st.vtpDomain||"NULL"} to ${a[0]}`; }),
      X("lldp run", ()=>{ st.lldpRun=true; return ""; }), X("no lldp run", ()=>{ st.lldpRun=false; return ""; }),
    ],
    "config-if": [
      X("description A:LINE", a=>{ forCur(i=>i.desc=a[0].slice(0,240)); return ""; }), X("no description", ()=>{ forCur(i=>i.desc=""); return ""; }),
      X("shutdown", ()=>{ const out=[]; forCur((i,n)=>{ i.errdis = null; if (!i.shut){ i.shut=true; out.push(`%LINK-5-CHANGED: Interface ${n}, changed state to administratively down`, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to down`); } }); return out.join("\n"); }),
      X("no shutdown", ()=>{ const out=[]; forCur((i,n)=>{ if (i.shut){ i.shut=false; if (up(n)) out.push(`%LINK-3-UPDOWN: Interface ${n}, changed state to up`, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to up`); else if (i.mode!=="svi") out.push(`%LINK-3-UPDOWN: Interface ${n}, changed state to down`); } }); return out.join("\n"); }),
      X("ip address A:IP A:MASK", a=>{ const i = st.intfs[st.cur]; if (i.sub && !i.encap) return "% Configuring IP routing on a LAN subinterface is only allowed if that\nsubinterface is already configured as part of an IEEE 802.10, IEEE 802.1Q,\nor ISL vLAN."; if (kind==="switch" && i.mode!=="svi" && i.mode!=="routed" && !i.loop) return "                                   ^\n% Invalid input detected at '^' marker.\n(a Layer 2 switch port has no IP address — configure the management IP on interface vlan 1)"; if (!ipRe.test(a[0])) return "% Invalid input detected at '^' marker."; if (!maskOk(a[1])) return ipRe.test(a[1]) ? `% Bad mask 0x${toInt(a[1]).toString(16).toUpperCase().padStart(8,"0")} for address ${a[0]}` : "% Invalid input detected at '^' marker.";
        const len = maskLen(a[1]);
        if (len<31 && (a[0]===netOf(a[0],a[1]) || a[0]===bcastOf(a[0],a[1]))) return `% Bad mask /${len} for address ${a[0]}`;
        for (const [n,o] of Object.entries(st.intfs)) if (n!==st.cur && o.ip){ const shorter = maskLen(o.mask) <= len ? o.mask : a[1]; if (sameNet(o.ip, a[0], shorter)) return `% ${netOf(a[0],a[1])} overlaps with ${n}`; }
        i.ip=a[0]; i.mask=a[1]; delete i.dhcpClient; delete i.dhcpGw; delete i.dhcpLease;
        return len===31 && !i.loop ? "% Warning: use /31 mask on non point-to-point interface cautiously" : ""; }),
      X("no ip address", ()=>{ forCur(i=>{ i.ip=null; i.mask=null; delete i.dhcpClient; delete i.dhcpGw; delete i.dhcpLease; }); return ""; }),
      X("ip address dhcp", ()=>{ const i = st.intfs[st.cur]; if (kind==="switch" && i.mode!=="svi" && i.mode!=="routed") return inv(); forCur(x=>{ x.ip = null; x.mask = null; x.dhcpClient = true; }); return ""; }),
      X("no ip address dhcp", ()=>{ forCur(i=>{ if (i.dhcpClient){ i.ip = null; i.mask = null; delete i.dhcpClient; delete i.dhcpGw; delete i.dhcpLease; } }); return ""; }),
      X("ip nat inside", ()=>{ forCur(i=>{ i.natIn = true; delete i.natOut; }); return ""; }), X("ip nat outside", ()=>{ forCur(i=>{ i.natOut = true; delete i.natIn; }); return ""; }),
      X("no ip nat inside", ()=>{ forCur(i=>{ delete i.natIn; }); return ""; }), X("no ip nat outside", ()=>{ forCur(i=>{ delete i.natOut; }); return ""; }),
      X("speed A:WORD", a=>{ if (!/^(10|100|1000|auto)$/.test(a[0])) return "% Invalid input detected at '^' marker."; if (st.intfs[st.cur].mode==="svi") return inv(); forCur(i=>i.speed=a[0]==="auto"?"auto":+a[0]); return ""; }),
      X("duplex A:WORD", a=>{ const d = ["full","half","auto"].find(x=>x.startsWith(a[0].toLowerCase())); if (!d) return "% Invalid input detected at '^' marker."; if (st.intfs[st.cur].mode==="svi") return inv(); forCur(i=>i.duplex=d); return ""; }),
      X("switchport mode access", ()=>l2(i=>{ i.mode="access"; })), X("switchport mode trunk", ()=>l2(i=>{ i.mode="trunk"; })),
      X("switchport mode dynamic A:WORD", a=>{ const d = ["auto","desirable"].find(x=>x.startsWith(a[0].toLowerCase())); if (!d) return inv(); if ((st.curList||[st.cur]).some(n=>st.intfs[n].nonegotiate)) return "Command rejected: Conflict between 'nonegotiate' and 'dynamic' status."; return l2(i=>{ i.mode="dynamic"; i.dtp=d; }); }),
      X("no switchport nonegotiate", ()=>l2(i=>{ i.nonegotiate=false; })),
      X("switchport voice vlan A:NUM", a=>{ const v = +a[0]; const r = l2(i=>{ i.voiceVlan=v; }); if (r) return r; if (!st.vlans[v]){ st.vlans[v] = `VLAN${String(v).padStart(4,"0")}`; return `% Voice VLAN does not exist. Creating vlan ${v}`; } return ""; }),
      X("no switchport voice vlan", ()=>l2(i=>{ i.voiceVlan=null; })),
      X("no switchport", ()=>{ if (kind!=="switch" || (st.curList||[st.cur]).some(n=>!physical.includes(n))) return inv(); forCur(i=>{ i.mode="routed"; }); return ""; }),
      X("switchport", ()=>{ if (kind!=="switch" || (st.curList||[st.cur]).some(n=>!physical.includes(n))) return inv(); forCur(i=>{ if (i.mode==="routed"){ i.mode="dynamic"; i.ip=null; i.mask=null; } }); return ""; }),
      X("encapsulation dot1Q A:NUM", a=>{ const i = st.intfs[st.cur]; if (!i.sub) return "% Invalid input detected at '^' marker.\n(encapsulation dot1Q goes on a router subinterface, e.g. interface g0/0.10)"; const v = +a[0]; if (!(v>=1&&v<=4094)) return inv(); i.encap = v; i.encapNative = false; return ""; }),
      X("encapsulation dot1Q A:NUM native", a=>{ const i = st.intfs[st.cur]; if (!i.sub) return inv(); i.encap = +a[0]; i.encapNative = true; return ""; }),
      X("spanning-tree portfast", ()=>{ const r = l2(i=>{ i.stp = Object.assign({}, i.stp, {portfast:true}); }); return r || ((st.curList && st.curList.length>1) ? `%Portfast will be configured in ${st.curList.length} interfaces due to the range command\n but will only have effect when the interfaces are in a non-trunking mode.\n` : "") + "%Warning: portfast should only be enabled on ports connected to a single\n host. Connecting hubs, concentrators, switches, bridges, etc... to this\n interface  when portfast is enabled, can cause temporary bridging loops.\n Use with CAUTION"; }),
      X("spanning-tree portfast edge", ()=>l2(i=>{ i.stp = Object.assign({}, i.stp, {portfast:true}); })),
      X("no spanning-tree portfast", ()=>l2(i=>{ i.stp = Object.assign({}, i.stp, {portfast:false}); })),
      X("spanning-tree bpduguard enable", ()=>l2(i=>{ i.stp = Object.assign({}, i.stp, {bpduguard:true}); })),
      X("spanning-tree bpduguard disable", ()=>l2(i=>{ i.stp = Object.assign({}, i.stp, {bpduguard:false}); })),
      X("no spanning-tree bpduguard", ()=>l2(i=>{ const t = Object.assign({}, i.stp); delete t.bpduguard; i.stp = t; })),
      X("spanning-tree guard A:WORD", a=>{ const g = a[0].toLowerCase(); if (!/^(root|loop|none)$/.test(g)) return inv(); return l2(i=>{ i.stp = Object.assign({}, i.stp, {guard: g==="none"?null:g}); }); }),
      X("spanning-tree cost A:NUM", a=>l2(i=>{ i.stp = Object.assign({}, i.stp, {cost:+a[0]}); })),
      X("spanning-tree port-priority A:NUM", a=>{ const p = +a[0]; if (p%16 || p>240) return "% Port Priority in increments of 16 is required"; return l2(i=>{ i.stp = Object.assign({}, i.stp, {prio:p}); }); }),
      X("channel-group A:NUM mode A:WORD", a=>{ const g = +a[0], m = ["active","passive","on","desirable","auto"].find(x=>x.startsWith(a[1].toLowerCase())); if (!m || !(g>=1&&g<=48)) return inv();
        const msg = []; const po = "Port-channel"+g;
        const other = Object.values(st.intfs).find(i=>i.channel && i.channel.group===g);
        if (other && ((["active","passive"].includes(other.channel.mode)) !== (["active","passive"].includes(m)) || (["desirable","auto"].includes(other.channel.mode)) !== (["desirable","auto"].includes(m)))) return `Command rejected (Channel protocol mismatch for interface ${short(st.cur)} in group ${g}): the interface can not be added to the channel group`;
        if (!st.intfs[po]){ st.intfs[po] = { ip:null, mask:null, shut:false, desc:"", mode:st.intfs[st.cur].mode, dtp:st.intfs[st.cur].dtp, nonegotiate:false, vlan:st.intfs[st.cur].vlan, allowed:st.intfs[st.cur].allowed, native:st.intfs[st.cur].native, voiceVlan:null, speed:"auto", duplex:"auto", cdp:false, stp:{}, channel:null, errdis:null, mac:st.intfs[st.cur].mac, po:true }; msg.push(`Creating a port-channel interface Port-channel ${g}`); }
        const r = l2(i=>{ i.channel = {group:g, mode:m}; }); return r || msg.join("\n"); }),
      X("no channel-group", ()=>l2(i=>{ i.channel = null; })),
      X("switchport access vlan A:NUM", a=>{ const v=+a[0]; if (!(v>=1&&v<=4094)) return "% Bad VLAN"; const r = l2(i=>{ i.vlan=v; }); if (r) return r; if (!st.vlans[v]){ st.vlans[v]=`VLAN${String(v).padStart(4,"0")}`; return `% Access VLAN does not exist. Creating vlan ${v}`; } return ""; }),
      X("switchport trunk allowed vlan A:LINE", a=>{ const s=a[0].trim(); let cur = st.intfs[st.cur].allowed;
        const parse = t=>t.split(",").flatMap(x=>{ const m=x.match(/^(\d+)-(\d+)$/); return m?[...Array(+m[2]-+m[1]+1)].map((_,k)=>+m[1]+k):[+x]; }).filter(n=>n>=1&&n<=4094);
        let list; const m = s.match(/^(add|remove|except)\s+(.+)$/); if (s==="all") list=null; else if (s==="none") list=[]; else if (m){ const set = parse(m[2]); const base = cur || [...Array(4094)].map((_,k)=>k+1); list = m[1]==="add" ? (cur ? [...new Set([...cur, ...set])].sort((x,y)=>x-y) : null) : m[1]==="remove" ? base.filter(x=>!set.includes(x)) : [...Array(4094)].map((_,k)=>k+1).filter(x=>!set.includes(x)); if (list && list.length===4094) list=null; } else list = parse(s);
        return l2(i=>{ i.allowed = list; }); }),
      X("switchport trunk native vlan A:NUM", a=>l2(i=>{ i.native=+a[0]; })),
      X("switchport nonegotiate", ()=>{ if ((st.curList||[st.cur]).some(n=>st.intfs[n].mode==="dynamic")) return "Command rejected: Conflict between 'nonegotiate' and 'dynamic' status."; return l2(i=>{ i.nonegotiate=true; }); }), X("switchport trunk encapsulation dot1q", ()=>""),
      X("ip helper-address A:IP", a=>{ forCur(i=>{ i.helpers = i.helpers || []; if (!i.helpers.includes(a[0])) i.helpers.push(a[0]); }); return ""; }),
      X("no ip helper-address", ()=>{ forCur(i=>{ delete i.helpers; }); return ""; }),
      X("no ip helper-address A:IP", a=>{ forCur(i=>{ if (i.helpers){ i.helpers = i.helpers.filter(h=>h!==a[0]); if (!i.helpers.length) delete i.helpers; } }); return ""; }),
      X("ip proxy-arp", ()=>{ forCur(i=>i.proxyArp=true); return ""; }), X("no ip proxy-arp", ()=>{ forCur(i=>i.proxyArp=false); return ""; }),
      X("cdp enable", ()=>{ forCur(i=>i.cdp=true); return ""; }), X("no cdp enable", ()=>{ forCur(i=>i.cdp=false); return ""; }),
      X("bandwidth A:NUM", a=>{ const b = +a[0]; if (!(b>=1 && b<=100000000)) return inv(); forCur(i=>i.bw=b); return ""; }), X("no bandwidth", ()=>{ forCur(i=>{ delete i.bw; }); return ""; }),
      X("ip ospf cost A:NUM", a=>{ const c = +a[0]; if (!(c>=1 && c<=65535)) return inv(); forCur(i=>i.ospfCost=c); return ""; }), X("no ip ospf cost", ()=>{ forCur(i=>{ delete i.ospfCost; }); return ""; }),
      X("ip ospf priority A:NUM", a=>{ const p = +a[0]; if (!(p>=0 && p<=255)) return inv(); forCur(i=>i.ospfPrio=p); return ""; }), X("no ip ospf priority", ()=>{ forCur(i=>{ delete i.ospfPrio; }); return ""; }),
      X("ip ospf hello-interval A:NUM", a=>{ const h = +a[0]; if (!(h>=1 && h<=65535)) return inv(); forCur(i=>{ const autoDead = !i.ospfDead || i.ospfDead===(i.ospfHello||10)*4; i.ospfHello=h; if (autoDead) i.ospfDead = h*4; }); return ""; }),
      X("no ip ospf hello-interval", ()=>{ forCur(i=>{ const autoDead = !i.ospfDead || i.ospfDead===(i.ospfHello||10)*4; delete i.ospfHello; if (autoDead) delete i.ospfDead; }); return ""; }),
      X("ip ospf dead-interval A:NUM", a=>{ const d = +a[0]; if (!(d>=1 && d<=65535)) return inv(); forCur(i=>i.ospfDead=d); return ""; }), X("no ip ospf dead-interval", ()=>{ forCur(i=>{ delete i.ospfDead; }); return ""; }),
      X("ip ospf network point-to-point", ()=>{ forCur(i=>i.ospfNet="point-to-point"); return ""; }), X("ip ospf network broadcast", ()=>{ forCur(i=>{ delete i.ospfNet; }); return ""; }), X("no ip ospf network", ()=>{ forCur(i=>{ delete i.ospfNet; }); return ""; }),
      X("ip ospf A:NUM area A:WORD", a=>{ const pid = +a[0], area = areaParse(a[1]); if (area==null || !(pid>=1&&pid<=65535)) return inv(); if (kind==="switch" && !st.ipRouting) return "% IP routing not enabled";
        if (st.ospf && st.ospf.pid!==pid) return `% This lab runs one OSPF process — this router already has "router ospf ${st.ospf.pid}"`;
        if (!st.ospf) st.ospf = {pid, rid:null, networks:[], passive:[], noPassive:[], passiveDefault:false, defOrig:false, defAlways:false, refBw:100};
        forCur(i=>i.ospfArea = {pid, area}); return ""; }),
      X("no ip ospf A:NUM area A:WORD", ()=>{ forCur(i=>{ delete i.ospfArea; }); return ""; }),
      X("standby A:NUM ip A:IP", a=>{ const g = +a[0]; if (!(g>=0 && g<=4095)) return inv(); const i = st.intfs[st.cur]; if (!i.ip) return "% Address must be configured on the interface first";
        i.hsrp = i.hsrp || {}; i.hsrp[g] = Object.assign(i.hsrp[g]||{}, {ip:a[1]});
        // real IOS only warns about a virtual IP outside the interface's subnet — the group then sits in Init and never sends hellos
        return sameNet(i.ip, a[1], i.mask) ? "" : "% Warning: address is not within a subnet on this interface"; }),
      X("standby A:NUM priority A:NUM", a=>{ const g = +a[0], p = +a[1]; if (!(p>=0 && p<=255)) return inv(); const i = st.intfs[st.cur]; i.hsrp = i.hsrp || {}; i.hsrp[g] = Object.assign(i.hsrp[g]||{}, {prio:p}); return ""; }),
      X("standby A:NUM preempt", a=>{ const g = +a[0], i = st.intfs[st.cur]; i.hsrp = i.hsrp || {}; i.hsrp[g] = Object.assign(i.hsrp[g]||{}, {preempt:true}); return ""; }),
      X("no standby A:NUM priority", a=>{ const i = st.intfs[st.cur]; if (i.hsrp && i.hsrp[+a[0]]) delete i.hsrp[+a[0]].prio; return ""; }),
      X("no standby A:NUM preempt", a=>{ const i = st.intfs[st.cur]; if (i.hsrp && i.hsrp[+a[0]]) i.hsrp[+a[0]].preempt = false; return ""; }),
      X("no standby A:NUM", a=>{ const i = st.intfs[st.cur]; if (i.hsrp) delete i.hsrp[+a[0]]; return ""; }),
      X("ipv6 address A:WORD", a=>{ const i = st.intfs[st.cur]; if (kind==="switch" && i.mode!=="routed" && i.mode!=="svi" && !i.loop) return inv(); const p = I6.parsePrefix(a[0]); if (!p) return "% Invalid input detected at '^' marker.";
        const addr = I6.str(p.w), ty = I6.type(addr); if (ty==="multicast" || ty==="unspecified" || ty==="loopback") return `% ${U(p.w)}/${p.len} is not a valid unicast address`;
        const net = I6.str(I6.mask(p.w, p.len)); if (p.len < 128 && I6.eq(net, p.w) && p.len!==127) { /* the subnet-router anycast address: IOS accepts it with a warning on some releases */ }
        for (const [n,o] of Object.entries(st.intfs)) if (n!==st.cur) for (const x of (o.ip6||[])) if (!x.eui && !x.any && I6.eq(I6.mask(I6.parse(x.addr), Math.min(x.len,p.len)), I6.mask(p.w, Math.min(x.len,p.len)))) return `%${st.cur}: Error: ${U(I6.mask(p.w, p.len))}/${p.len} is overlapping with ${U(I6.mask(I6.parse(x.addr), x.len))}/${x.len} on ${n}`;
        i.ip6 = i.ip6 || []; if (!i.ip6.some(x=>!x.eui && I6.eq(x.addr, addr))) i.ip6.push({addr, len:p.len}); return ""; }),
      X("ipv6 address A:WORD anycast", a=>{ const i = st.intfs[st.cur]; const p = I6.parsePrefix(a[0]); if (!p) return "% Invalid input detected at '^' marker."; const addr = I6.str(p.w);
        i.ip6 = i.ip6 || []; if (!i.ip6.some(x=>!x.eui && I6.eq(x.addr, addr))) i.ip6.push({addr, len:p.len, any:true}); return ""; }),
      X("no ipv6 address A:WORD eui-64", a=>{ const p = I6.parsePrefix(a[0]); const i = st.intfs[st.cur]; if (p) i.ip6 = (i.ip6||[]).filter(x=>!(x.eui && I6.eq(x.addr, I6.mask(p.w,64)))); return ""; }),
      X("no ipv6 address A:WORD anycast", a=>{ const p = I6.parsePrefix(a[0]); const i = st.intfs[st.cur]; if (p) i.ip6 = (i.ip6||[]).filter(x=>!(x.any && I6.eq(x.addr, p.w))); return ""; }),
      X("ipv6 address A:WORD eui-64", a=>{ const i = st.intfs[st.cur]; const p = I6.parsePrefix(a[0]); if (!p || p.len > 64) return "% Invalid input detected at '^' marker."; i.ip6 = i.ip6 || [];
        const net = I6.str(I6.mask(p.w, 64)); if (!i.ip6.some(x=>x.eui && I6.eq(x.addr, net))) i.ip6.push({addr:net, len:p.len, eui:true}); return ""; }),
      X("ipv6 address A:WORD link-local", a=>{ if (!I6.valid(a[0]) || !I6.isLL(a[0])) return "% Invalid link-local address"; st.intfs[st.cur].ll = I6.str(I6.parse(a[0])); return ""; }),
      X("ipv6 address autoconfig", ()=>{ st.intfs[st.cur].ip6auto = true; return ""; }), X("ipv6 address autoconfig default", ()=>{ st.intfs[st.cur].ip6auto = true; return ""; }),
      X("no ipv6 address", ()=>{ forCur(i=>{ delete i.ip6; delete i.ll; delete i.ip6auto; }); return ""; }),
      X("no ipv6 address A:WORD", a=>{ const p = I6.parsePrefix(a[0]); const i = st.intfs[st.cur]; if (p) i.ip6 = (i.ip6||[]).filter(x=>!I6.eq(x.addr, x.eui ? I6.mask(p.w,64) : p.w)); return ""; }),
      X("no ipv6 address A:WORD link-local", ()=>{ delete st.intfs[st.cur].ll; return ""; }), X("no ipv6 address autoconfig", ()=>{ delete st.intfs[st.cur].ip6auto; return ""; }),
      X("ipv6 enable", ()=>{ forCur(i=>i.ip6en = true); return ""; }), X("no ipv6 enable", ()=>{ forCur(i=>{ delete i.ip6en; }); return ""; }),
      X("standby version A:NUM", a=>{ if (!/^[12]$/.test(a[0])) return inv(); forCur(i=>i.hsrpVer = +a[0]); return ""; }),
      X("interface A:IF", a=>{ const n = parseIf(a[0], true); if (!n) return "% Invalid input detected at '^' marker."; st.cur=n; st.curList=[n]; return ""; }),
    ],
    "config-line": [
      X("password A:LINE", a=>{ st.lines[st.curLine].password=unhash(a[0]); return ""; }), X("no password", ()=>{ st.lines[st.curLine].password=null; return ""; }),
      X("login", ()=>{ const L = st.lines[st.curLine]; L.login=true; L.loginLocal=false; return L.password ? "" : "% Login disabled on line "+(st.curLine==="con"?0:1)+", until 'password' is set"; }),
      X("login local", ()=>{ const L = st.lines[st.curLine]; L.loginLocal=true; L.login=true; return ""; }), X("no login", ()=>{ const L = st.lines[st.curLine]; L.login=false; L.loginLocal=false; return ""; }),
      X("transport input A:LINE", a=>{ if (st.curLine!=="vty") return inv(); const v = a[0].trim().toLowerCase(); if (!/^(ssh|telnet|all|none|telnet ssh|ssh telnet)$/.test(v)) return "% Invalid input detected at '^' marker."; st.lines.vty.transport = /telnet ssh|ssh telnet/.test(v) ? "telnet ssh" : v; return ""; }),
      X("exec-timeout A:NUM A:NUM", a=>{ st.lines[st.curLine].timeout=`${a[0]} ${a[1]}`; return ""; }), X("exec-timeout A:NUM", a=>{ st.lines[st.curLine].timeout=`${a[0]} 0`; return ""; }),
      X("logging synchronous", ()=>{ st.lines[st.curLine].sync=true; return ""; }),
    ],
    "config-std-nacl": aclMode(), "config-ext-nacl": aclMode(),
    "config-dhcp": ["network","default-router","dns-server","domain-name","lease"].flatMap(k=>[
      X(k + " A:LINE", a=>{ const r = window.DHCP.poolCmd(st.dhcp, st.curPool, k + " " + a[0]); return r.err || ""; }),
      X("no " + k, ()=>{ const r = window.DHCP.poolCmd(st.dhcp, st.curPool, "no " + k); return r.err || ""; }),
      X("no " + k + " A:LINE", ()=>{ const r = window.DHCP.poolCmd(st.dhcp, st.curPool, "no " + k); return r.err || ""; }) ]),
    "config-router": [
      X("network A:IP A:IP area A:WORD", a=>{ const area = areaParse(a[2]); if (area==null || !ipRe.test(a[0]) || !ipRe.test(a[1])) return inv();
        // current IOS converts a subnet mask typed in place of a wildcard (255.255.255.0 → 0.0.0.255); all-ones stays "match everything"
        const wild = maskOk(a[1]) && a[1]!=="255.255.255.255" ? a[1].split(".").map(o=>255-(+o)).join(".") : a[1];
        const o = st.ospf; if (!o.networks.some(w=>w.net===a[0] && w.wild===wild)) o.networks.push({net:a[0], wild, area}); else o.networks.find(w=>w.net===a[0] && w.wild===wild).area = area;
        // IOS lists overlapping statements most specific first (fewest wildcard bits), keeping typed order otherwise
        const bits = w => ones32(toInt(w.wild)); o.networks = o.networks.map((w,k)=>({w,k})).sort((x,y)=>bits(x.w)-bits(y.w) || x.k-y.k).map(x=>x.w); return ""; }),
      X("no network A:IP A:IP area A:WORD", a=>{ st.ospf.networks = st.ospf.networks.filter(w=>!(w.net===a[0] && w.wild===a[1])); return ""; }),
      X("router-id A:IP", a=>{ if (!ipRe.test(a[0])) return inv(); st.ospf.rid = a[0]; if (st.ospfRidActive && st.ospfRidActive!==a[0]) return '% OSPF: Reload or use "clear ip ospf process" command, for this to take effect'; st.ospfRidActive = a[0]; return ""; }),
      X("no router-id", ()=>{ st.ospf.rid = null; return '% OSPF: Reload or use "clear ip ospf process" command, for this to take effect'; }),
      X("passive-interface default", ()=>{ st.ospf.passiveDefault = true; st.ospf.noPassive = []; return ""; }), X("no passive-interface default", ()=>{ st.ospf.passiveDefault = false; st.ospf.passive = []; return ""; }),
      X("passive-interface A:IF", a=>{ const n = parseIf(a[0]); if (!n) return inv(); const o = st.ospf; if (o.passiveDefault) o.noPassive = o.noPassive.filter(x=>x!==n); else if (!o.passive.includes(n)) o.passive.push(n); return ""; }),
      X("no passive-interface A:IF", a=>{ const n = parseIf(a[0]); if (!n) return inv(); const o = st.ospf; if (o.passiveDefault){ if (!o.noPassive.includes(n)) o.noPassive.push(n); } else o.passive = o.passive.filter(x=>x!==n); return ""; }),
      X("default-information originate", ()=>{ st.ospf.defOrig = true; st.ospf.defAlways = false; return ""; }), X("default-information originate always", ()=>{ st.ospf.defOrig = true; st.ospf.defAlways = true; return ""; }),
      X("no default-information originate", ()=>{ st.ospf.defOrig = false; st.ospf.defAlways = false; return ""; }),
      X("auto-cost reference-bandwidth A:NUM", a=>{ const b = +a[0]; if (!(b>=1 && b<=4294967)) return inv(); st.ospf.refBw = b; return "% OSPF: Reference bandwidth is changed.\n        Please ensure reference bandwidth is consistent across all routers."; }),
      X("no auto-cost reference-bandwidth", ()=>{ st.ospf.refBw = 100; return "% OSPF: Reference bandwidth is changed.\n        Please ensure reference bandwidth is consistent across all routers."; }),
    ],
    "config-vlan": [ X("name A:WORD", a=>{ for (const v of (st.curVlans||[st.curVlan])) st.vlans[v]=a[0].slice(0,32); return ""; }), X("no name", ()=>{ for (const v of (st.curVlans||[st.curVlan])) st.vlans[v]=`VLAN${String(v).padStart(4,"0")}`; return ""; }) ],
  };
  const cfgDone = () => st.viaVty ? `%SYS-5-CONFIG_I: Configured from console by ${st.viaVty.user} on vty0 (${st.viaVty.ip})` : `%SYS-5-CONFIG_I: Configured from console by ${opts.via||"console"}`;
  const cfgCommon = [ X("end", ()=>{ st.mode="priv"; return cfgDone(); }), X("exit", ()=>{ if (st.mode==="config"){ st.mode="priv"; return cfgDone(); } st.mode="config"; return ""; }) ];
  for (const m of ["config","config-if","config-line","config-vlan","config-router","config-std-nacl","config-ext-nacl","config-dhcp"]) T[m].push(...cfgCommon);

  function inv(){ return "% Invalid input detected at '^' marker."; }
  const SEV = ["emergencies","alerts","critical","errors","warnings","notifications","informational","debugging"];
  const sevOf = w => { if (/^[0-7]$/.test(w)) return +w; const k = SEV.findIndex(x=>x.startsWith(String(w).toLowerCase()) && String(w).length>=2); return k; };
  const MON3 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], DAY3 = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  // the router's clock: the lab's time (or what "clock set" said), shifted by "clock timezone"; "*" = not authoritative (no NTP sync)
  const clockMs = () => (st.clockSetAt!=null ? st.clockSetAt : hooks.now()) + (st.tz ? (st.tz.h*60 + Math.sign(st.tz.h||1)*st.tz.m)*60000 : 0);
  const ntpOn = () => st.ntpMaster!=null || st.ntpServers.length > 0;
  const ntpState = () => { const n = ntpRaw(); if (n.synced) st.ntpWas = true; return n; };
  const ntpRaw = () => (hooks.ntp && hooks.ntp(st)) || {synced: st.ntpMaster!=null, stratum: st.ntpMaster!=null ? st.ntpMaster : 16, ref: st.ntpMaster!=null ? "127.127.1.1" : null, peers: []};
  function clockText(detail){ const t = new Date(clockMs()), n = ntpState(), two = x=>String(x).padStart(2,"0");
    const line = `${n.synced?"":st.ntpWas?".":"*"}${two(t.getUTCHours())}:${two(t.getUTCMinutes())}:${two(t.getUTCSeconds())}.${String(t.getUTCMilliseconds()).padStart(3,"0")} ${st.tz?st.tz.name:"UTC"} ${DAY3[t.getUTCDay()]} ${MON3[t.getUTCMonth()]} ${t.getUTCDate()} ${t.getUTCFullYear()}`;
    return detail ? line + "\nTime source is " + (n.synced || st.ntpWas ? "NTP" : st.clockSetAt!=null ? "user configuration" : "hardware calendar") : line; }
  const ntpHex = () => (Math.floor((st.clockSetAt!=null ? st.clockSetAt : hooks.now())/1000) + 2208988800).toString(16).toUpperCase().padStart(8, "0") + ".3F5C28F6";   // NTP time = seconds since 1900
  function ntpStatus(){ if (!ntpOn()) return "%NTP is not enabled."; const n = ntpState();
    if (!n.synced) return "Clock is unsynchronized, stratum 16, no reference clock\nnominal freq is 250.0000 Hz, actual freq is 250.0000 Hz, precision is 2**10\nntp uptime is 0 (1/100 of seconds), resolution is 4000\nreference time is 00000000.00000000 (00:00:00.000 UTC Mon Jan 1 1900)\nclock offset is 0.0000 msec, root delay is 0.00 msec\nroot dispersion is 0.00 msec, peer dispersion is 0.00 msec\nloopfilter state is 'FSET' (Drift set from file), drift is 0.000000000 s/s\nsystem poll interval is 8, never updated.";
    return `Clock is synchronized, stratum ${n.stratum}, reference is ${n.ref}\nnominal freq is 250.0000 Hz, actual freq is 250.0000 Hz, precision is 2**10\nntp uptime is 1500 (1/100 of seconds), resolution is 4000\nreference time is ${ntpHex()} (${clockText().replace(/^[*.]/,"")})\nclock offset is 0.0000 msec, root delay is ${n.ref==="127.127.1.1" ? "0.00" : "1.00"} msec\nroot dispersion is 7.55 msec, peer dispersion is 0.12 msec\nloopfilter state is 'CTRL' (Normal Controlled Loop), drift is 0.000000000 s/s\nsystem poll interval is 64, last update was 10 sec ago.`; }
  function ntpAssoc(){ if (!ntpOn()) return "%NTP is not enabled."; const n = ntpState(), rows = [];
    if (st.ntpMaster!=null) rows.push({mark: n.ref==="127.127.1.1" ? "*" : " ", addr:"127.127.1.1", ref:".LOCL.", st: st.ntpMaster - 1, reach: 377, delay:"0.000"});
    for (const pe of (n.peers||[])) rows.push({mark: pe.sys ? "*" : pe.reach && pe.stratum < 16 ? "+" : " ", addr: pe.ip, ref: pe.ref || ".INIT.", st: pe.reach ? pe.stratum : 16, reach: pe.reach ? 377 : 0, delay: pe.reach ? "1.000" : "0.000"});
    return "  address         ref clock       st   when   poll reach  delay  offset   disp\n" + rows.map(r=>`${r.mark}~${pad(r.addr,16)}${pad(r.ref,16)}${String(r.st).padStart(2)}  ${String(r.reach ? 14 : "-").padStart(5)}  ${String(64).padStart(5)}  ${String(r.reach).padStart(4)}  ${r.delay.padStart(5)}   0.000  ${r.reach ? "0.123" : "15937."}`).join("\n") + (rows.length ? "\n" : "") + " * sys.peer, # selected, + candidate, - outlyer, x falseticker, ~ configured"; }
  // name → address: the host table first, then the configured name servers (the default domain is added to a name without a dot)
  function resolveName(name){ const nm = name.toLowerCase(), fq = !nm.includes(".") && st.domain ? nm + "." + st.domain : nm;
    if (st.iosHosts[nm] || st.iosHosts[fq]) return {ip: st.iosHosts[nm] || st.iosHosts[fq], how:"table"};
    if (!st.domainLookup) return {ip:null, how:"nolookup"};
    if (!st.nameServers.length) return {ip:null, how:"broadcast", tried: fq};
    const r = hooks.dns ? hooks.dns(fq, st.nameServers) : null;
    if (r && r.ip){ st.dnsCache = st.dnsCache || {}; st.dnsCache[fq] = r.ip; }
    return r && r.ip ? {ip:r.ip, how:"dns", server:r.server, tried:fq} : {ip:null, how:"dns", server: (r && r.server) || st.nameServers[0], tried:fq}; }
  function aclMode(){ const run = (pre, a) => { const r = window.ACL.namedCmd(st.acl, st.curAcl, pre + a.join(" ")); return r.err || ""; };
    return [ ...["permit","deny","remark"].flatMap(k=>[ X(k + " A:LINE", a=>run(k + " ", a)), X("A:NUM " + k + " A:LINE", a=>run(a[0] + " " + k + " ", [a[1]])) ]),
      X("no A:NUM", a=>run("no " + a[0], [])), X("no permit A:LINE", a=>run("no permit ", a)), X("no deny A:LINE", a=>run("no deny ", a)), X("no remark A:LINE", a=>run("no remark ", a)) ]; }
  function forCur(fn){ for (const n of (st.curList||[st.cur])) fn(st.intfs[n], n); }
  function l2(fn){ const bad = (st.curList||[st.cur]).find(n=>st.intfs[n].mode==="routed"||st.intfs[n].mode==="svi"); if (bad || kind!=="switch") return inv(); forCur(fn);
    for (const n of (st.curList||[st.cur])) if (n.startsWith("Port-channel")){ const g = +n.slice(12); for (const m of physical){ const i = st.intfs[m]; if (i.channel && i.channel.group===g){ const keep = i.channel; fn(i, m); i.channel = keep; } } }
    return ""; }
  function areaParse(x){ if (/^\d+$/.test(x)){ const n = +x; return n<=4294967295 ? n : null; } if (ipRe.test(x)) return toInt(x); return null; }
  function parseRouteArgs(line){   // what follows "ip route NET MASK": [interface] [next hop] [distance] [permanent|name ...]
    const t = tokens(line); let ios = null, nh = null, ad = null, k = 0;
    if (t[k] && !ipRe.test(t[k]) && !/^\d+$/.test(t[k])){ let n = parseIf(t[k]); if (!n && t[k+1]){ n = parseIf(t[k]+t[k+1]); if (n) k++; } if (!n) return {err:"% Invalid input detected at '^' marker."}; ios = n; k++; }
    if (t[k] && ipRe.test(t[k])){ nh = t[k]; k++; }
    if (t[k] && /^\d+$/.test(t[k])){ ad = +t[k]; if (!(ad>=1 && ad<=255)) return {err:"% Invalid input detected at '^' marker."}; k++; }
    if (t[k] && /^(permanent|name|tag|track)$/i.test(t[k])) k = t.length;
    if (k < t.length) return {err:"% Invalid input detected at '^' marker."};
    if (!ios && !nh) return {err:"% Incomplete command."};
    return {ios, nh, ad}; }
  function vlistRaw(s){ return String(s).split(",").flatMap(x=>{ const m = x.match(/^(\d+)-(\d+)$/); return m ? [...Array(Math.max(0,+m[2]-+m[1]+1))].map((_,k)=>+m[1]+k) : [+x]; }); }
  function vlist(s){ return String(s).split(",").flatMap(x=>{ const m = x.match(/^(\d+)-(\d+)$/); return m ? [...Array(+m[2]-+m[1]+1)].map((_,k)=>+m[1]+k) : [+x]; }).filter(v=>v>=1&&v<=4094); }
  // interface range: "g0/1 - 4", "g0/8", "g0/1 - 2 , g0/5 , g0/7 - 8" (like IOS)
  function parseRange(s){ const out = [];
    for (const part of s.replace(/\s+/g,"").split(",")){ if (!part) continue;
      let m = part.match(/^([a-z]+)(\d+\/)(\d+)-(\d+)$/i);
      if (m){ for (let k=+m[3]; k<=+m[4]; k++){ const n = parseIf(m[1]+m[2]+k); if (!n) return null; out.push(n); } continue; }
      m = part.match(/^([a-z]+)(\d+\/)(\d+)$/i); if (!m) return null; const n = parseIf(part); if (!n) return null; out.push(n); }
    return out.length ? out : null; }
  function save(){ st.startup = snapshot(); st.savedOnce = true; return "Building configuration...\n[OK]"; }
  function runningCfgFrom(snap){ const cur = snapshot(); restore(snap); const out = runningCfg().replace("Current configuration","Using 2104 out of 524288 bytes\n!\n! Last configuration change"); restore(cur); return out; }
  function doReload(){ if (st.startup) restore(st.startup); else restore(factory()); st.mode="user"; st.pending=null; st.ospfRidActive = null; st.ospfResets = (st.ospfResets||0) + 1; if (st.confregNext) st.confreg = st.confregNext;
    if (hooks.clearMac) hooks.clearMac(); return {reload:true, text:"\n%SYS-5-RELOAD: Reload requested by console. Reload Reason: Reload Command.\n\n...System restarting...\n\n" + (st.startup ? `${st.host} con0 is now available\n\nPress RETURN to get started.` : "         --- System Configuration Dialog ---\n\nWould you like to enter the initial configuration dialog? [yes/no]: no\n\nPress RETURN to get started.") + (st.banner?`\n\n${st.banner}`:"")}; }
  function ask(prompt, handle){ st.pending = {prompt, handle}; return {ask:prompt}; }
  // TFTP: back the configuration up to a server, or merge a saved file into the running-config
  function tftpUp(text, sfx){ return ask("Address or name of remote host []? ", h=>{ const host = h.trim(); if (!host) return "%Error parsing filename (Bad IP address or host name)";
    const def = `${st.host.toLowerCase()}-${sfx}`; return ask(`Destination filename [${def}]? `, f=>{ const file = f.trim() || def, body = text();
      const r = hooks.tftpPut ? hooks.tftpPut(host, file, body) : {ok:false};
      if (!r.ok) return `%Error opening tftp://${host}/${file} (Timed out)`;
      const n = body.length; return `!!\n${n} bytes copied in 0.512 secs (${Math.round(n/0.512)} bytes/sec)`; }); }); }
  function tftpDown(){ return ask("Address or name of remote host []? ", h=>{ const host = h.trim(); if (!host) return "%Error parsing filename (Bad IP address or host name)";
    return ask("Source filename []? ", f=>{ const file = f.trim(); if (!file) return "%Error parsing filename (Bad IP address or host name)";
      return ask("Destination filename [running-config]? ", ()=>{ const r = hooks.tftpGet ? hooks.tftpGet(host, file) : {ok:false};
        if (!r.ok) return `Accessing tftp://${host}/${file}...\n%Error opening tftp://${host}/${file} (${r.why==="nofile" ? "No such file or directory" : "Timed out"})`;
        const lines = r.text.split("\n").filter(l=>l.trim() && !/^(!|Building configuration|Current configuration|version |end$)/.test(l.trim()));
        const saved = st.mode; st.mode = "config"; for (const l of lines) execInner(l.replace(/\s+$/, "")); st.mode = saved; st.cur = null; st.curList = null;
        const n = r.text.length;
        return `Accessing tftp://${host}/${file}...\nLoading ${file} from ${host} (via ${r.via||"GigabitEthernet0/0"}): !\n[OK - ${n} bytes]\n\n${n} bytes copied in 0.312 secs (${Math.round(n/0.312)} bytes/sec)\n%SYS-5-CONFIG_I: Configured from tftp://${host}/${file} by console`; }); }); }); }
  function goEnable(){
    const need = st.enableSecret || st.enablePassword;
    if (!need){ st.mode="priv"; return ""; }
    let tries = 0;
    const tryPw = l => { if (l===(st.enableSecret||st.enablePassword)){ st.noEcho=false; st.mode="priv"; return ""; } if (++tries>=3){ st.noEcho=false; return "% Bad secrets"; } st.noEcho=true; return ask("Password: ", tryPw); };
    st.noEcho=true; return ask("Password: ", tryPw);
  }
  function doPing(ip, srcArg){
    if (!ipRe.test(ip) && !I6.valid(ip) && /^[a-z0-9][a-z0-9.-]*$/i.test(ip)){ const r = resolveName(ip);
      if (r.ip){ const head = r.how==="dns" ? `Translating "${ip}"...domain server (${r.server}) [OK]\n\n` : "";
        const res = doPing(r.ip, srcArg); return typeof res==="string" ? head + res : res; }
      if (r.how==="dns") return `Translating "${ip}"...domain server (${r.server})\n% Unrecognized host or address, or protocol not running.`; }
    if (I6.valid(ip)){ if (!srcArg) return doPing6(ip, null, null);
      // extended ping: "source" names an interface or one of our own addresses — it sets the source, not the way out
      const n = parseIf(srcArg), mine = ifNames().filter(x=>up(x) && v6on(x));
      let sa = null, sIf = null;
      if (n){ if (mine.includes(n)){ sIf = n; sa = I6.isLL(ip) ? llOf(n) : ((globals6(n)[0]||{}).addr || llOf(n)); } }
      else if (I6.valid(srcArg)){ const hit = mine.find(x=>[llOf(x), ...globals6(x).map(g=>g.addr)].some(a=>I6.eq(a, srcArg))); if (hit){ sIf = hit; sa = I6.str(I6.parse(srcArg)); } }
      if (!sa) return "% Invalid source address- IPv6 address not on any of our up interfaces";
      return doPing6(ip, I6.isLL(ip) ? sIf : null, I6.isLL(ip) ? null : sa); }
    if (!ipRe.test(ip)) return st.domainLookup ? `Translating "${ip}"...domain server (255.255.255.255)\n% Unrecognized host or address, or protocol not running.` : `% Unrecognized host or address, or protocol not running.`;
    let src = null;   // extended ping: ping <ip> source <interface|own address> — tests the return path to that address
    if (srcArg){ const n = parseIf(srcArg); const i = n ? st.intfs[n] : Object.values(st.intfs).find(x=>x.ip===srcArg);
      if (!i || !i.ip || !(n ? up(n) : true)) return "% Invalid source address- IP address not on any of our up interfaces"; src = i.ip; }
    const r = hooks.ping(ip, src) || {};
    const bar = r.ok ? (r.firstMiss ? ".!!!!" : "!!!!!") : r.kind==="netunreach" ? "U.U.U" : r.kind==="ttlexpired" ? "&&&&&" : ".....";   // U = an ICMP unreachable came back (IOS rate-limits them, hence U.U.U)
    const n = (bar.match(/!/g)||[]).length;
    return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${ip}, timeout is 2 seconds:\n${src ? `Packet sent with a source address of ${src} \n` : ""}${bar}\nSuccess rate is ${n*20} percent (${n}/5)${n?", round-trip min/avg/max = 1/1/3 ms":""}`;
  }
  function doTrace(ip, srcArg){
    if (!ipRe.test(ip) && !I6.valid(ip) && /^[a-z0-9][a-z0-9.-]*$/i.test(ip) && /[a-z]/i.test(ip)){ const r = resolveName(ip);
      if (!r.ip) return r.how==="dns" ? `Translating "${ip}"...domain server (${r.server})\n% Unrecognized host or address, or protocol not running.` : "% Unrecognized host or address, or protocol not running.";
      const res = doTrace(r.ip, srcArg); if (typeof res!=="string") return res;
      const nm = r.how==="dns" ? r.tried : ip.toLowerCase();
      return (r.how==="dns" ? `Translating "${ip}"...domain server (${r.server}) [OK]\n` : "") + res.replace(`Tracing the route to ${r.ip}`, `Tracing the route to ${nm} (${r.ip})`); }
    if (I6.valid(ip)) return doTrace6(ip);
    let src = null; if (srcArg){ const n = parseIf(srcArg); const i = n ? st.intfs[n] : Object.values(st.intfs).find(x=>x.ip===srcArg);
      if (!i || !i.ip || !(n ? up(n) : true)) return "% Invalid source address- IP address not on any of our up interfaces"; src = i.ip; }
    if (hooks.trace) return hooks.trace(ip, src); const r = hooks.ping(ip) || {}; return `Type escape sequence to abort.\nTracing the route to ${ip}\nVRF info: (vrf in name/id, vrf out name/id)\n  1 ${r.ok?ip+" 1 msec 1 msec 1 msec":"*  *  *"}`; }

  /* ---------- parser ---------- */
  const isArg = p => p.startsWith("A:");
  function joinIfTokens(t){
    const out = [];
    for (let i=0;i<t.length;i++){
      const prev = (out[out.length-1]||"").toLowerCase();
      if ((("interfaces".startsWith(prev)&&prev.length>=2) || prev==="range") && /^[a-z][a-z-]*$/i.test(t[i]) && t[i+1] && /^\d/.test(t[i+1]) && !/^(status|brief|trunk|counters)$/i.test(t[i])) { out.push(t[i]+t[i+1]); i++; }
      else out.push(t[i]);
    }
    return out;
  }
  function match(defs, toks){
    let cs = defs.map(d=>({d, args:[], done:false}));
    for (let i=0;i<toks.length;i++){
      const tok = toks[i], low = tok.toLowerCase();
      const next = [];
      const kwHits = new Set();
      for (const c of cs){
        if (c.done) continue;
        const p = c.d.p[i];
        if (p===undefined) continue;
        if (p==="A:LINE"){ next.push({d:c.d, args:c.args.concat([toks.slice(i).join(" ")]), done:true, at:i}); continue; }
        if (isArg(p)){ next.push({d:c.d, args:c.args.concat([tok]), done:false}); continue; }
        if (p.startsWith(low)){ kwHits.add(p); next.push({d:c.d, args:c.args, done:false, kw:p}); }
      }
      const doneOnes = next.filter(c=>c.done);
      if (doneOnes.length && !next.some(c=>!c.done && c.kw===low)) { cs = doneOnes.concat(next.filter(c=>!c.done)); return finish(cs, toks); }
      if (!next.length) return {err:"invalid", at:i};
      if (kwHits.size>1 && !kwHits.has(low)){
        const argPaths = next.filter(c=>!c.kw);
        if (!argPaths.length) return {err:"ambiguous", tok, opts:[...kwHits]};
      }
      cs = kwHits.has(low) ? next.filter(c=>!c.kw || c.kw===low) : next;
      // prefer keyword matches over generic args at the same position
      if (cs.some(c=>c.kw) && cs.some(c=>!c.kw)) cs = cs.filter(c=>c.kw);
    }
    return finish(cs, toks);
  }
  function finish(cs, toks){
    const full = cs.filter(c=>c.done || c.d.p.length===toks.length);
    if (full.length) return {def: full[0].d, args: full[0].args};
    if (cs.length) return {err:"incomplete"};
    return {err:"invalid", at:toks.length-1};
  }
  function caret(line, at){ const t = tokens(line); let pos = 0, s = line.replace(/^\s+/,""); for (let i=0;i<at && i<t.length;i++){ const k = s.indexOf(t[i]); pos += k + t[i].length; s = s.slice(k + t[i].length); } pos += (s.length - s.replace(/^\s+/,"").length); return " ".repeat(st.prompt().length + pos + (line.length - line.replace(/^\s+/,"").length)) + "^\n% Invalid input detected at '^' marker."; }

  function helpFor(line){
    const raw = line.slice(0,-1), endsSpace = /\s$/.test(raw) || raw==="";
    let mode = st.mode, t = joinIfTokens(tokens(raw));
    if (t[0] && "do".startsWith(t[0].toLowerCase()) && t[0].length>=2 && mode.startsWith("config")){ mode="priv"; t=t.slice(1); }
    const defs = T[mode];
    const fixed = endsSpace ? t : t.slice(0,-1), partial = endsSpace ? "" : (t[t.length-1]||"").toLowerCase();
    const opts = new Map(); let cr = false;
    for (const d of defs){
      let ok = true;
      for (let i=0;i<fixed.length;i++){ const p = d.p[i]; if (p===undefined){ ok=false; break; } if (p==="A:LINE"){ break; } if (isArg(p)) continue; if (!p.startsWith(fixed[i].toLowerCase())){ ok=false; break; } }
      if (!ok) continue;
      const p = d.p[fixed.length];
      if (p===undefined){ if (endsSpace) cr = true; continue; }
      if (isArg(p)){ const lab = {"A:WORD":"WORD","A:IP":"A.B.C.D","A:MASK":"A.B.C.D","A:NUM":"<number>","A:IF":"<interface>","A:LINE":"LINE"}[p]; if (!partial) opts.set(lab, {"A:IP":"IP address","A:MASK":"Subnet mask","A:IF":"Interface type and number e.g. g0/1, vlan 1","A:LINE":"Text"}[p]||""); continue; }
      if (p.startsWith(partial)) opts.set(p, HELP[p]||"");
    }
    if (!endsSpace) return [...opts.keys()].filter(k=>!/^[<A-Z]/.test(k)).join("  ") || "% Unrecognized command";
    const rows = [...opts.entries()].map(([k,v])=>"  "+pad(k,22)+v);
    if (cr) rows.push("  <cr>");
    return rows.length ? rows.join("\n") : "% Unrecognized command";
  }

  st.prompt = () => {
    if (st.pending) return "";
    const h = st.host;
    return { user:h+">", priv:h+"#", config:h+"(config)#", "config-if": h+(st.curList&&st.curList.length>1?"(config-if-range)#":(st.intfs[st.cur]&&st.intfs[st.cur].sub)?"(config-subif)#":"(config-if)#"), "config-line":h+"(config-line)#", "config-vlan":h+"(config-vlan)#", "config-router":h+"(config-router)#", "config-std-nacl":h+"(config-std-nacl)#", "config-ext-nacl":h+"(config-ext-nacl)#", "config-dhcp":h+"(dhcp-config)#" }[st.mode] || h+"#";
  };
  st.complete = line => {
    const t = tokens(line); if (!t.length || /\s$/.test(line)) return line;
    let mode = st.mode, off = 0;
    if ("do".startsWith(t[0].toLowerCase()) && t[0].length>=2 && mode.startsWith("config")){ mode="priv"; off=1; }
    const partial = t[t.length-1].toLowerCase(), pos = t.length-1-off, prev = t.slice(off,-1);
    const hits = new Set();
    for (const d of T[mode]){ let ok = true; for (let i=0;i<prev.length;i++){ const p = d.p[i]; if (!p || (!isArg(p) && !p.startsWith(prev[i].toLowerCase()))){ ok=false; break; } } const p = d.p[pos]; if (ok && p && !isArg(p) && p.startsWith(partial)) hits.add(p); }
    if (hits.size===1){ t[t.length-1] = [...hits][0]; return t.join(" ")+" "; }
    return line;
  };
  // console/SSH session start: banner + login prompt when the line asks for it
  st.connect = (lineName) => {
    const L = st.lines[lineName||"con"]; st.mode = "user";
    const ban = st.banner!=null ? st.banner+"\n\n" : "";
    if (L.login && (L.loginLocal ? Object.keys(st.users).length : L.password)){
      if (L.loginLocal){ let user = null; const askUser = () => ask("Username: ", u=>{ user=u.trim(); st.noEcho=true; return ask("Password: ", p=>{ st.noEcho=false; const rec = st.users[user]; if (rec && (rec.secret===p || rec.password===p)) return ""; askUser(); return {text:"% Login invalid\n", ask:"Username: "}; }); });
        askUser(); return {text: ban+"User Access Verification\n", ask: "Username: "}; }
      st.noEcho = true;
      const tryPw = p => { if (p===L.password){ st.noEcho=false; return ""; } st.noEcho=true; return ask("Password: ", tryPw); };
      ask("Password: ", tryPw); return {text: ban+"User Access Verification\n", ask:"Password: "};
    }
    return {text: ban + "Press RETURN to get started."};
  };
  // for tools/labs_ready.js: the canonical keyword form(s) of a command line in any mode — "no shut" → "no shutdown",
  // "sh ip int br" → "show ip interface brief", "ip add 10.1.1.1 255.255.255.0" → "ip address * *"
  st.canonAll = line => { let t = joinIfTokens(tokens(String(line||""))); if (!t.length) return [];
    if (t[0] && "do".startsWith(t[0].toLowerCase()) && t[0].length>=2 && t.length>1) t = t.slice(1);
    const out = new Set(); for (const mode of Object.keys(T)){ const m = match(T[mode], t); if (!m.err) out.add(m.def.p.map(p=>isArg(p) ? "*" : p).join(" ")); }
    return [...out]; };
  st.baseline = () => { st.startup = snapshot(); st.ospfRidActive = null; };   // a pre-built device behaves as if it booted from this config (its router-id applies)
  st.exportConfig = () => snapshot();                                   // the whole config, for saving a topology
  st.importConfig = snap => { restore(snap); st.startup = snapshot(); };   // load it back as the saved startup-config
  st.isUp = n => up(n);        // for the bench: is this interface (incl. SVIs, subinterfaces, port-channels) up/up?
  st.baseMac = baseMac + ".0000";   // treat the current config as already saved (without counting as the learner saving)
  st.sshReady = () => !!(st.rsa && st.domain && st.lines.vty.loginLocal && Object.keys(st.users).length && /ssh|all/.test(st.lines.vty.transport));

  st.exec = function(line){
    // pending question (confirm, password, modulus...)
    if (st.pending){ const p = st.pending; st.pending = null; const r = p.handle(line); return normalize(r); }
    st.history.push(line);
    const raw = line; if (!raw.trim()) return "";
    if (/\?$/.test(raw.trim())) { st.history.pop(); return helpFor(raw.trim().replace(/\s*\?$/, m=>m.includes(" ")||raw.trim()==="?"?" ?":"?")); }
    let mode = st.mode, t = joinIfTokens(tokens(raw)), isDo = false;
    if (mode.startsWith("config") && t[0] && "do".startsWith(t[0].toLowerCase()) && t[0].length>=2){ mode = "priv"; t = t.slice(1); isDo = true; }
    if (mode.startsWith("config") && /^\^z$/i.test(raw.trim())){ st.mode="priv"; return ""; }
    const m = match(T[mode], t);
    if (m.err==="ambiguous") return `% Ambiguous command:  "${raw.trim()}"`;
    if (m.err==="incomplete") return "% Incomplete command.";
    if (m.err){
      // exec-mode typo on a single word: IOS tries to telnet to it as a hostname
      if ((mode==="user"||mode==="priv") && !isDo && t.length===1 && st.domainLookup) return `Translating "${t[0]}"...domain server (255.255.255.255)\n (255.255.255.255)\nTranslating "${t[0]}"...domain server (255.255.255.255)\n\n% Bad IP address or host name\n% Unknown command or computer name, or unable to find computer address`;
      if ((mode==="user"||mode==="priv") && !isDo && t.length===1) return "% Unknown command or computer name, or unable to find computer address";
      return isDo ? "% Invalid input detected at '^' marker." : caret(raw, m.at);
    }
    // config sub-mode command typed one level up — IOS falls back to the parent mode
    const r = m.def.run(m.args);
    return normalize(r);
  };
  // modes below config: if a command isn't valid in the sub-mode but is valid in global config, IOS exits to global and runs it
  const subExec0 = st.exec;
  // output modifiers: show ... | include|exclude|begin|section <regex>
  const subExec = function(line){
    const m = !st.pending && line.match(/^(.*?)\s+\|\s*(i|in|inc|incl|inclu|includ|include|e|ex|exc|excl|exclu|exclud|exclude|b|be|beg|begi|begin|s|se|sec|sect|secti|sectio|section|c|co|cou|coun|count)\s+(.+)$/i);
    if (!m) return subExec0(line);
    const out = subExec0(m[1]);
    if (st.history.length && st.history[st.history.length-1]===m[1]) st.history[st.history.length-1] = line;   // history keeps what was typed, "| include …" and all
    if (typeof out!=="string") return out;
    let re; try { re = new RegExp(m[3].trim()); } catch(e){ return "% Invalid regular expression"; }
    const L = out.split("\n"), k = m[2][0].toLowerCase();
    if (k==="c") return `Number of lines which match regexp = ${L.filter(l=>re.test(l)).length}`;
    if (k==="i") return L.filter(l=>re.test(l)).join("\n");
    if (k==="e") return L.filter(l=>!re.test(l)).join("\n");
    if (k==="b"){ const i = L.findIndex(l=>re.test(l)); return i<0 ? "" : L.slice(i).join("\n"); }
    const res = []; let on = false;   // section: a matching top-level line plus its indented children
    for (const l of L){ if (/^\S/.test(l)) on = re.test(l); if (on) res.push(l); }
    return res.join("\n");
  };
  st.log = [];          // [{cmd, out, mode}] — what the learner typed and saw (text output only), newest last
  st.exec = function(line){
    const before = st.mode; let r = execInner(line);
    // console messages are logged; on the console they carry the same timestamp as in the log buffer ("*" = clock not synchronised)
    const stamp = txt => txt.split("\n").map(l=>{ if (!/^%[A-Z0-9_]+-[0-7]-[A-Z0-9_]+:/.test(l.trim())) return l; const e = hooks.emit(l.trim()); return e && e.t ? (ntpRaw().synced ? "" : "*") + e.t + ": " + l.trim() : l; }).join("\n");
    if (typeof r==="string") r = stamp(r); else if (r && r.text) r.text = stamp(r.text);
    if (typeof r==="string" || (r && r.text)) { st.log.push({cmd:line, out: typeof r==="string" ? r : r.text, mode:before}); if (st.log.length>200) st.log.shift(); }
    return r;
  };
  const execInner = function(line){
    if (!st.pending && /^config-/.test(st.mode) && line.trim() && !/\?$/.test(line.trim())){
      const t = joinIfTokens(tokens(line));
      const inSub = match(T[st.mode], t), inGlobal = match(T.config, t);
      if (inSub.err && !inGlobal.err && !(t[0] && "do".startsWith(t[0].toLowerCase()) && t[0].length>=2)){ st.history.push(line); const saved = st.mode; st.mode = "config"; const r = inGlobal.def.run(inGlobal.args); if (st.mode==="config" && saved==="config") {} return normalize(r); }
    }
    return subExec(line);
  };
  function normalize(r){
    if (r==null) return "";
    if (typeof r==="string") return r;
    if (r.ask) return {ask:r.ask, text:r.text||""};
    if (r.reload) return {reload:true, text:r.text};
    if (r.logout) return {logout:true};
    return String(r);
  }
  // compatibility with tasks written for the v1 engine
  Object.defineProperty(st, "enable", { get(){ return st.mode!=="user"; } });
  return st;
}

window.SIM = window.SIM || {};
window.SIM.ios2Env = ios2Env;
})();
