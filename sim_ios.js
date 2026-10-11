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
const fakeHash = (s, t) => t==="7" ? [...String(s)].map((c,i)=>((c.charCodeAt(0)^(0x1F+i))&255).toString(16).toUpperCase().padStart(2,"0")).join("").slice(0,22).padEnd(14,"0")
  : "$9$" + [...String(s)+"salt"].map((c,i)=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./"[(c.charCodeAt(0)*7+i*13)%64]).join("").slice(0,14) + "$" + [...String(s)].map((c,i)=>"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[(c.charCodeAt(0)*31+i*17)%62]).join("").padEnd(43,"x").slice(0,43);

const HELP = {
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
      stpMode:"rapid-pvst", stpPrio:{}, stpOff:{}, pfDefault:false, bpduDefault:false, ipRouting:false, vtpMode:"server", vtpDomain:"", lbMethod:null,
      vlans: kind==="switch" ? {1:"default", 1002:"fddi-default", 1003:"token-ring-default", 1004:"fddinet-default", 1005:"trnet-default"} : {}, intfs };
  };
  const st = Object.assign(factory(), { kind, mode:"user", cur:null, curList:null, curLine:null, curVlan:null, history:[], savedOnce:false, startup:null, pending:null, noEcho:false, motd: opts.motd!=null?opts.motd:"" });
  if (opts.setup) opts.setup(st);
  function defaultReach(ip){ for (const i of Object.values(st.intfs)) if (i.ip && !i.shut){ if (i.ip===ip) return true; if (sameNet(i.ip, ip, i.mask)){ const len = maskLen(i.mask); if (len>=31) return true; return ip!==netOf(i.ip, i.mask) && ip!==bcastOf(i.ip, i.mask); } } return false; }
  function bcastOf(ip, m){ const a = toInt(ip), b = toInt(m); const x = ((a & b) + (0xFFFFFFFF - b)) >>> 0; return [24,16,8,0].map(s=>Math.floor(x/2**s)%256).join("."); }
  const cfgKeys = Object.keys(factory());
  const snapshot = () => JSON.parse(JSON.stringify(cfgKeys.reduce((o,k)=>(o[k]=st[k],o),{})));
  const restore = snap => { for (const k of cfgKeys) st[k] = JSON.parse(JSON.stringify(snap[k])); };
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
  const pw = (p, type7) => p==null ? null : st.servicePwEnc ? `7 ${fakeHash(p,"7")}` : p;

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
    if (st.enableSecret) L.push(`enable secret 9 ${fakeHash(st.enableSecret)}`);
    if (st.enablePassword) L.push(`enable password ${pw(st.enablePassword)}`);
    if (st.enableSecret || st.enablePassword) L.push("!");
    for (const [u,v] of Object.entries(st.users)) L.push(`username ${u} ${v.secret?`secret 9 ${fakeHash(v.secret)}`:`password ${pw(v.password)}`}`);
    if (!st.domainLookup) L.push("no ip domain lookup");
    if (st.domain) L.push(`ip domain name ${st.domain}`);
    if (st.sshVer) L.push(`ip ssh version ${st.sshVer}`);
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
      if (i.ip) L.push(` ip address ${i.ip} ${i.mask}`); else if (i.mode==="svi"||i.mode==="routed") L.push(" no ip address");
      if (i.speed!=="auto" && i.speed) L.push(` speed ${i.speed}`);
      if (i.duplex!=="auto" && i.duplex) L.push(` duplex ${i.duplex}`);
      if (i.cdp===false && i.mode!=="svi" && !i.loop && !i.sub && !i.po) L.push(" no cdp enable");
      if (i.proxyArp===false) L.push(" no ip proxy-arp");
      if (i.shut) L.push(" shutdown");
      L.push("!");
    }
    if (st.defaultGw) L.push(`ip default-gateway ${st.defaultGw}`);
    for (const r of st.routes) L.push(`ip route ${r.net} ${r.mask} ${r.nh}`);
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
    L.push("!","end");
    return L.join("\n");
  }
  function ipIntBrief(){
    let o = "Interface              IP-Address      OK? Method Status                Protocol\n";
    for (const n of ifNames()){ const i = st.intfs[n]; const s = i.shut ? "administratively down" : (up(n) || (i.mode==="svi" && st.vlans[i.vlan])) ? "up" : "down";   // an SVI with no live port in its VLAN is up/down
      o += pad(n,23) + pad(i.ip||"unassigned",16) + (i.ip?"YES manual ":"YES unset  ") + pad(s,22) + (up(n)?"up":"down") + "\n"; }
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
    lines.push(`  MTU 1500 bytes, BW ${link?(c.speed||1000)*1000:1000000} Kbit/sec, DLY 10 usec,`, "     reliability 255/255, txload 1/255, rxload 1/255", "  Encapsulation ARPA, loopback not set");
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
  function routeTable(only){
    if (kind==="switch" && !st.ipRouting) return `Default gateway is ${st.defaultGw||"not set"}\n\nHost               Gateway           Last Use    Total Uses  Interface\nICMP redirect cache is empty`;   // a Layer 2 switch has no routing table until "ip routing"
    const L = ["Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP","       O - OSPF, IA - OSPF inter area, * - candidate default","",
      (st.routes.find(r=>r.net==="0.0.0.0") ? `Gateway of last resort is ${st.routes.find(r=>r.net==="0.0.0.0").nh} to network 0.0.0.0` : "Gateway of last resort is not set"), ""];
    const rows = [];
    for (const n of ifNames()){ const i = st.intfs[n]; if (i.ip && up(n)){ rows.push({net:netOf(i.ip,i.mask), len:maskLen(i.mask), text:`C        ${netOf(i.ip,i.mask)}/${maskLen(i.mask)} is directly connected, ${n}`}); rows.push({net:i.ip, len:32, text:`L        ${i.ip}/32 is directly connected, ${n}`}); } }
    for (const r of st.routes) rows.push({net:r.net, len:maskLen(r.mask), text:`S${r.net==="0.0.0.0"?"*":" "}       ${r.net}/${maskLen(r.mask)} [1/0] via ${r.nh}`});
    const keep = only==='connected' ? (r=>/^[CL]/.test(r.text)) : only==='static' ? (r=>/^S/.test(r.text)) : (()=>true);
    for (let k=rows.length-1;k>=0;k--) if (!keep(rows[k])) rows.splice(k,1);
    const classful = ip => { const f = +ip.split(".")[0]; const p = f<128 ? 8 : f<192 ? 16 : 24; return {major: netOf(ip, [0,0,0,0].map((_,k)=>k<p/8?255:0).join(".")), p}; };
    const groups = new Map();
    for (const r of rows){ if (r.net==="0.0.0.0"){ groups.set("0.0.0.0", {hdr:null, rows:[r]}); continue; } const c = classful(r.net); const key = c.major+"/"+c.p; if (!groups.has(key)) groups.set(key, {major:c.major, p:c.p, rows:[]}); groups.get(key).rows.push(r); }
    for (const [key,g] of [...groups].sort((x,y)=>x[0]==="0.0.0.0"?-1:y[0]==="0.0.0.0"?1:toInt(x[1].major)-toInt(y[1].major))){
      if (g.major){ const masks = [...new Set(g.rows.map(r=>r.len))]; const sub = g.rows.length;
        if (!(masks.length===1 && masks[0]===g.p)) L.push(masks.length>1 ? `      ${g.major}/${g.p} is variably subnetted, ${sub} subnets, ${masks.length} masks` : `      ${g.major}/${masks[0]} is subnetted, ${sub} subnets`); }
      g.rows.sort((x,y)=>toInt(x.net)-toInt(y.net) || x.len-y.len).forEach(r=>L.push(r.text));
    }
    return L.join("\n");
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
    X("show running-config", ()=>runningCfg()), X("show startup-config", ()=>st.startup ? runningCfgFrom(st.startup) : "startup-config is not present"),
    X("show version", ()=>version()), X("show ip interface brief", ()=>ipIntBrief()), X("show interfaces status", ()=>kind==="switch"?intStatus():inv()),
    X("show interfaces", ()=>ifNames().filter(n=>!st.intfs[n].loop||true).map(showInt).join("\n")),
    X("show ip interface A:IF", a=>{ const n = parseIf(a[0]); if (!n) return "% Invalid input detected at '^' marker."; const i = st.intfs[n], l = up(n);
      const L = [`${n} is ${i.shut?"administratively down":(l||(i.mode==="svi"&&st.vlans[i.vlan]))?"up":"down"}, line protocol is ${l?"up":"down"}`];
      if (!i.ip) L.push("  Internet protocol processing disabled");
      else L.push(`  Internet address is ${i.ip}/${maskLen(i.mask)}`, "  Broadcast address is 255.255.255.255", "  Address determined by setup command", "  MTU is 1500 bytes", "  Helper address is not set",
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
    X("show logging", ()=>{ const L = hooks.logs ? hooks.logs(st) : []; return "Syslog logging: enabled (0 messages dropped, 0 flushes, 0 overruns)\n    Console logging: level debugging\n    Buffer logging:  level debugging\n\nLog Buffer (8192 bytes):\n" + (L.length ? L.map(l=>"*Oct 11 10:"+l).join("\n") : ""); }),
    X("show mac address-table", ()=>macTable()||inv()), X("show mac address-table dynamic", ()=>macTable({type:"dynamic"})||inv()),
    X("show mac address-table address A:WORD", a=>macTable({addr:a[0].toLowerCase()})||inv()), X("show mac address-table interface A:IF", a=>{ const n = parseIf(a[0]); return n ? macTable({intf:n}) : "% Invalid interface"; }),
    X("show mac address-table vlan A:NUM", a=>macTable({vlan:a[0]})||inv()),
    X("show cdp neighbors", ()=>cdpNeighbors(false)), X("show cdp neighbors detail", ()=>cdpNeighbors(true)),
    X("show lldp neighbors", ()=>lldpNeighbors()),
    X("show arp", ()=>arpTable()), X("show ip arp", ()=>arpTable()), X("show ip arp A:IP", a=>arpTable(a[0])), X("show arp A:IP", a=>arpTable(a[0])), X("show ip route", ()=>routeTable()), X("show ip route connected", ()=>routeTable("connected")), X("show ip route static", ()=>routeTable("static")),
    X("show history", ()=>st.history.slice(-20).map(h=>"  "+h).join("\n")), X("show users", ()=>{ const ss = (hooks.sessions && hooks.sessions()) || [];
      let o = "    Line       User       Host(s)              Idle       Location\n" + `${ss.some(s=>s.me)?" ":"*"}  0 con 0                idle                 00:00:00`;
      ss.forEach((s,i)=>{ o += `\n${s.me?"*":" "}  ${String(i+1).padEnd(2)}vty ${i}     ${pad(s.user||"",11)}idle                 00:00:0${i}  ${s.from}`; });
      return o; }),
    X("show ip ssh", ()=> st.rsa ? `SSH Enabled - version ${st.sshVer==="2"?"2.0":"1.99"}\nAuthentication timeout: 120 secs; Authentication retries: 3` : "SSH Disabled - version 1.99\n%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2)."),
    X("show clock", ()=>"*10:14:07.312 WAT Sun Oct 11 2026"),
  ];
  const execCommon = [
    X("ping A:WORD", a=>doPing(a[0])), X("traceroute A:WORD", a=>doTrace(a[0])), X("exit", ()=>{ st.mode="user"; return {logout:true}; }), X("logout", ()=>({logout:true})),
    X("terminal length A:NUM", ()=>""), X("terminal no monitor", ()=>""),
  ];
  const T = {
    user: [ X("enable", ()=>goEnable()), ...execCommon, X("show version", ()=>version()), X("show ip interface brief", ()=>ipIntBrief()), X("show interfaces status", ()=>kind==="switch"?intStatus():inv()), X("show history", ()=>st.history.slice(-20).map(h=>"  "+h).join("\n")), X("show clock", ()=>"*10:14:07.312 WAT Sun Oct 11 2026") ],
    priv: [ X("disable", ()=>{ st.mode="user"; return ""; }), X("configure terminal", ()=>{ st.mode="config"; return "Enter configuration commands, one per line.  End with CNTL/Z."; }),
      ...execShow, ...execCommon,
      X("copy running-config startup-config", ()=>ask("Destination filename [startup-config]? ", ()=>save())),
      X("write memory", ()=>save()), X("write", ()=>save()),
      X("erase startup-config", ()=>ask("Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]", l=> /^n/i.test(l) ? "" : (st.startup=null, st.savedOnce=false, "[OK]\nErase of nvram: complete"))),
      X("write erase", ()=>ask("Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]", l=> /^n/i.test(l) ? "" : (st.startup=null, st.savedOnce=false, "[OK]\nErase of nvram: complete"))),
      X("reload", ()=>{ const unsaved = !st.startup || JSON.stringify(snapshot())!==JSON.stringify(st.startup);
          const go = () => ask("Proceed with reload? [confirm]", l=> /^n/i.test(l) ? "" : doReload());
          return unsaved ? ask("\nSystem configuration has been modified. Save? [yes/no]: ", l=>{ if (/^y/i.test(l)){ save(); } else if (!/^n/i.test(l)) return "% Please answer 'yes' or 'no'."; return go(); }) : go(); }),
      X("reload in A:NUM", a=>{ const m = +a[0]; return ask(`Reload scheduled in ${m} minutes by console\nReload reason: Reload Command\nProceed with reload? [confirm]`, l=>{ if (/^n/i.test(l)) return ""; st.reloadIn = m; return ""; }); }),
      X("reload cancel", ()=>{ if (!st.reloadIn) return "%No reload is scheduled."; st.reloadIn = null; return "\n\n***\n*** --- SHUTDOWN ABORTED ---\n***\n"; }),
      X("show reload", ()=>st.reloadIn ? `Reload scheduled in ${st.reloadIn} minutes by console\nReload reason: Reload Command` : "No reload is scheduled."),
      X("clear mac address-table dynamic", ()=>{ if (kind!=="switch") return inv(); hooks.clearMac(); return ""; }),
      X("clear arp-cache", ()=>""), X("clear counters", ()=>ask("Clear \"show interface\" counters on all interfaces [confirm]", ()=>"")),
    ],
    config: [
      X("hostname A:WORD", a=>{ if (!/^[A-Za-z][\w-]{0,62}$/.test(a[0])) return "% Hostname contains one or more illegal characters."; st.host = a[0]; return ""; }),
      X("enable secret A:LINE", a=>{ const p = a[0].replace(/^[05789] /,""); st.enableSecret = p; return ""; }),
      X("enable password A:LINE", a=>{ st.enablePassword = a[0].replace(/^[07] /,""); return st.enableSecret ? "% The enable password you have chosen is the same as your enable secret.\n% This is not recommended.  Re-enter the enable password.".replace(/.*/s, m=> a[0]===st.enableSecret?m:"") : ""; }),
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
      X("username A:WORD secret A:LINE", a=>{ st.users[a[0]] = {secret:a[1].replace(/^[05789] /,"")}; return ""; }),
      X("username A:WORD password A:LINE", a=>{ st.users[a[0]] = {password:a[1].replace(/^[07] /,"")}; return ""; }),
      X("username A:WORD privilege A:NUM secret A:LINE", a=>{ st.users[a[0]] = {secret:a[2], priv:+a[1]}; return ""; }),
      X("no username A:WORD", a=>{ delete st.users[a[0]]; return ""; }),
      X("ip domain-name A:WORD", a=>{ st.domain=a[0]; return ""; }), X("ip domain name A:WORD", a=>{ st.domain=a[0]; return ""; }),
      X("no ip domain-lookup", ()=>{ st.domainLookup=false; return ""; }), X("no ip domain lookup", ()=>{ st.domainLookup=false; return ""; }), X("ip domain-lookup", ()=>{ st.domainLookup=true; return ""; }),
      X("crypto key generate rsa", ()=>{ if (st.host==="Switch"||st.host==="Router") return "% Please define a hostname other than "+st.host+"."; if (!st.domain) return "% Please define a domain-name first."; return ask(`The name for the keys will be: ${st.host}.${st.domain}\nChoose the size of the key modulus in the range of 512 to 4096 for your\n  General Purpose Keys. Choosing a key modulus greater than 512 may take\n  a few minutes.\n\nHow many bits in the modulus [2048]: `, l=>{ const b = +(l.trim()||2048); if (!(b>=512&&b<=4096)) return "% Invalid modulus"; st.rsa=b; return `% The key modulus size is ${b} bits\n% Generating ${b} bit RSA keys, keys will be non-exportable...\n[OK] (elapsed time was 1 seconds)\n%SSH-5-ENABLED: SSH 1.99 has been enabled`; }); }),
      X("crypto key generate rsa modulus A:NUM", a=>{ if (st.host==="Switch"||st.host==="Router") return "% Please define a hostname other than "+st.host+"."; if (!st.domain) return "% Please define a domain-name first."; const b=+a[0]; if (!(b>=512&&b<=4096)) return "% Invalid modulus"; st.rsa=b; return `The name for the keys will be: ${st.host}.${st.domain}\n% The key modulus size is ${b} bits\n% Generating ${b} bit RSA keys, keys will be non-exportable...\n[OK] (elapsed time was 1 seconds)\n%SSH-5-ENABLED: SSH 1.99 has been enabled`; }),
      X("crypto key zeroize rsa", ()=>{ st.rsa=0; return "% All keys will be removed.\n%SSH-5-DISABLED: SSH 1.99 has been disabled"; }),
      X("ip ssh version A:NUM", a=>{ if (!/^[12]$/.test(a[0])) return "% Invalid input"; if (!st.rsa && a[0]==="2") return "Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2)."; st.sshVer=a[0]; return ""; }),
      X("config-register A:WORD", a=>{ if (!/^0x[0-9a-f]{1,4}$/i.test(a[0])) return "% Invalid input detected at '^' marker."; st.confregNext = "0x" + a[0].slice(2).toUpperCase().padStart(4,"0"); return ""; }),
      X("ip default-gateway A:IP", a=>{ if (!ipRe.test(a[0])) return "% Invalid input detected at '^' marker."; st.defaultGw=a[0]; return ""; }), X("no ip default-gateway", ()=>{ st.defaultGw=null; return ""; }),
      X("ip route A:IP A:MASK A:WORD", a=>{ const mOk = a[1]==="0.0.0.0" || maskOk(a[1]); if (!ipRe.test(a[0]) || !mOk || netOf(a[0], a[1])!==a[0]) return "%Inconsistent address and mask"; if (!st.routes.some(r=>r.net===a[0]&&r.mask===a[1]&&r.nh===a[2])) st.routes.push({net:a[0], mask:a[1], nh:a[2]}); return ""; }),
      X("no ip route A:IP A:MASK A:WORD", a=>{ st.routes = st.routes.filter(r=>!(r.net===a[0]&&r.mask===a[1]&&r.nh===a[2])); return ""; }),
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
        i.ip=a[0]; i.mask=a[1];
        return len===31 && !i.loop ? "% Warning: use /31 mask on non point-to-point interface cautiously" : ""; }),
      X("no ip address", ()=>{ forCur(i=>{ i.ip=null; i.mask=null; }); return ""; }),
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
      X("ip proxy-arp", ()=>{ forCur(i=>i.proxyArp=true); return ""; }), X("no ip proxy-arp", ()=>{ forCur(i=>i.proxyArp=false); return ""; }),
      X("cdp enable", ()=>{ forCur(i=>i.cdp=true); return ""; }), X("no cdp enable", ()=>{ forCur(i=>i.cdp=false); return ""; }),
      X("interface A:IF", a=>{ const n = parseIf(a[0], true); if (!n) return "% Invalid input detected at '^' marker."; st.cur=n; st.curList=[n]; return ""; }),
    ],
    "config-line": [
      X("password A:LINE", a=>{ st.lines[st.curLine].password=a[0].replace(/^[07] /,""); return ""; }), X("no password", ()=>{ st.lines[st.curLine].password=null; return ""; }),
      X("login", ()=>{ const L = st.lines[st.curLine]; L.login=true; L.loginLocal=false; return L.password ? "" : "% Login disabled on line "+(st.curLine==="con"?0:1)+", until 'password' is set"; }),
      X("login local", ()=>{ const L = st.lines[st.curLine]; L.loginLocal=true; L.login=true; return ""; }), X("no login", ()=>{ const L = st.lines[st.curLine]; L.login=false; L.loginLocal=false; return ""; }),
      X("transport input A:LINE", a=>{ if (st.curLine!=="vty") return inv(); const v = a[0].trim().toLowerCase(); if (!/^(ssh|telnet|all|none|telnet ssh|ssh telnet)$/.test(v)) return "% Invalid input detected at '^' marker."; st.lines.vty.transport = /telnet ssh|ssh telnet/.test(v) ? "telnet ssh" : v; return ""; }),
      X("exec-timeout A:NUM A:NUM", a=>{ st.lines[st.curLine].timeout=`${a[0]} ${a[1]}`; return ""; }), X("exec-timeout A:NUM", a=>{ st.lines[st.curLine].timeout=`${a[0]} 0`; return ""; }),
      X("logging synchronous", ()=>{ st.lines[st.curLine].sync=true; return ""; }),
    ],
    "config-vlan": [ X("name A:WORD", a=>{ for (const v of (st.curVlans||[st.curVlan])) st.vlans[v]=a[0].slice(0,32); return ""; }), X("no name", ()=>{ for (const v of (st.curVlans||[st.curVlan])) st.vlans[v]=`VLAN${String(v).padStart(4,"0")}`; return ""; }) ],
  };
  const cfgDone = () => `%SYS-5-CONFIG_I: Configured from console by ${opts.via||"console"}`;
  const cfgCommon = [ X("end", ()=>{ st.mode="priv"; return cfgDone(); }), X("exit", ()=>{ if (st.mode==="config"){ st.mode="priv"; return cfgDone(); } st.mode="config"; return ""; }) ];
  for (const m of ["config","config-if","config-line","config-vlan"]) T[m].push(...cfgCommon);

  function inv(){ return "% Invalid input detected at '^' marker."; }
  function forCur(fn){ for (const n of (st.curList||[st.cur])) fn(st.intfs[n], n); }
  function l2(fn){ const bad = (st.curList||[st.cur]).find(n=>st.intfs[n].mode==="routed"||st.intfs[n].mode==="svi"); if (bad || kind!=="switch") return inv(); forCur(fn);
    for (const n of (st.curList||[st.cur])) if (n.startsWith("Port-channel")){ const g = +n.slice(12); for (const m of physical){ const i = st.intfs[m]; if (i.channel && i.channel.group===g){ const keep = i.channel; fn(i, m); i.channel = keep; } } }
    return ""; }
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
  function doReload(){ if (st.startup) restore(st.startup); else restore(factory()); st.mode="user"; st.pending=null; if (st.confregNext) st.confreg = st.confregNext;
    if (hooks.clearMac) hooks.clearMac(); return {reload:true, text:"\n%SYS-5-RELOAD: Reload requested by console. Reload Reason: Reload Command.\n\n...System restarting...\n\n" + (st.startup ? `${st.host} con0 is now available\n\nPress RETURN to get started.` : "         --- System Configuration Dialog ---\n\nWould you like to enter the initial configuration dialog? [yes/no]: no\n\nPress RETURN to get started.") + (st.banner?`\n\n${st.banner}`:"")}; }
  function ask(prompt, handle){ st.pending = {prompt, handle}; return {ask:prompt}; }
  function goEnable(){
    const need = st.enableSecret || st.enablePassword;
    if (!need){ st.mode="priv"; return ""; }
    let tries = 0;
    const tryPw = l => { if (l===(st.enableSecret||st.enablePassword)){ st.noEcho=false; st.mode="priv"; return ""; } if (++tries>=3){ st.noEcho=false; return "% Bad secrets"; } st.noEcho=true; return ask("Password: ", tryPw); };
    st.noEcho=true; return ask("Password: ", tryPw);
  }
  function doPing(ip){
    if (!ipRe.test(ip)) return st.domainLookup ? `Translating "${ip}"...domain server (255.255.255.255)\n% Unrecognized host or address, or protocol not running.` : `% Unrecognized host or address, or protocol not running.`;
    const r = hooks.ping(ip) || {};
    const bar = r.ok ? (r.firstMiss ? ".!!!!" : "!!!!!") : ".....";
    const n = (bar.match(/!/g)||[]).length;
    return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${ip}, timeout is 2 seconds:\n${bar}\nSuccess rate is ${n*20} percent (${n}/5)${n?", round-trip min/avg/max = 1/1/3 ms":""}`;
  }
  function doTrace(ip){ const r = hooks.ping(ip) || {}; return `Type escape sequence to abort.\nTracing the route to ${ip}\nVRF info: (vrf in name/id, vrf out name/id)\n  1 ${r.ok?ip+" 1 msec 1 msec 1 msec":"*  *  *"}`; }

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
    return { user:h+">", priv:h+"#", config:h+"(config)#", "config-if": h+(st.curList&&st.curList.length>1?"(config-if-range)#":(st.intfs[st.cur]&&st.intfs[st.cur].sub)?"(config-subif)#":"(config-if)#"), "config-line":h+"(config-line)#", "config-vlan":h+"(config-vlan)#" }[st.mode] || h+"#";
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
  st.baseline = () => { st.startup = snapshot(); };
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
    const before = st.mode, r = execInner(line);
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
