// Ladder Lab — interactive lab bench (v2). Real-looking devices with ports you cable together, SFP optics, link lights
// that follow the physics and the config, and a frame-level network underneath: every NIC has a MAC address, switches
// learn and flood, hubs repeat, hosts and routers ARP, routers route between subnets, frames are animated on the
// cables and explained in a frame log. PCs have IP settings, ipconfig, ping, arp, ssh and telnet; a console cable +
// PuTTY-style terminal opens the device's IOS CLI (sim_ios.js).
// The model (Bench.create / act) is DOM-free so tools/validate.js can replay solutions; Bench.mount draws the UI.
(function(){
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const clone = o => JSON.parse(JSON.stringify(o));

const CABLES = {
  cat6:    { name:"Cat6 patch cable (straight-through)", short:"Cat6 straight", kind:"copper", color:"#3b82f6" },
  xover:   { name:"Cat6 crossover cable", short:"Crossover", kind:"copper", color:"#f97316", crossover:true },
  console: { name:"Console cable (USB to RJ45 rollover)", short:"Console", kind:"console", color:"#7dd3fc" },
  mmf:     { name:"Multimode fibre, LC–LC duplex (aqua)", short:"MM fibre", kind:"fibre", mode:"mm", color:"#2dd4bf" },
  smf:     { name:"Single-mode fibre, LC–LC duplex (yellow)", short:"SM fibre", kind:"fibre", mode:"sm", color:"#eab308" },
};
const SFPS = {
  "sfp-sx": { name:"1000BASE-SX SFP — multimode, 850 nm, short reach", short:"SX (MM)", mode:"mm", type:"1000BaseSX SFP" },
  "sfp-lx": { name:"1000BASE-LX SFP — single-mode, 1310 nm, up to ~10 km", short:"LX (SM)", mode:"sm", type:"1000BaseLX SFP" },
};
const PORTW = { rj45:[22,17], console:[22,17], sfp:[30,14], usb:[18,9] };
const BCAST = "ffff.ffff.ffff";

/* ---------------- helpers ---------------- */
function ipToInt(ip){ const p = String(ip||"").trim().split("."); if (p.length!==4 || p.some(x=>!/^\d{1,3}$/.test(x)||+x>255)) return null; return ((+p[0]<<24)>>>0)+(+p[1]<<16)+(+p[2]<<8)+(+p[3]); }
function sameNet(a,b,mask){ const A=ipToInt(a),B=ipToInt(b),M=ipToInt(mask); if (A==null||B==null||M==null) return false; return ((A&M)>>>0)===((B&M)>>>0); }
function validMask(m){ const M = ipToInt(m); if (M==null) return false; const inv = (~M)>>>0; return ((inv+1)&inv)===0 && M!==0; }
function netOf(ip, mask){ const A = ipToInt(ip), M = ipToInt(mask); const n = (A & M)>>>0; return [24,16,8,0].map(s=>(n>>>s)&255).join("."); }
function bcastOf(ip, mask){ const A = ipToInt(ip), M = ipToInt(mask); const b = ((A & M) | (~M>>>0))>>>0; return [24,16,8,0].map(s=>(b>>>s)&255).join("."); }
function macFor(seed){ let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)>>>0; const hex = ("0050" + h.toString(16).padStart(8,"0")).slice(0,12); return hex.replace(/(.{4})(.{4})(.{4})/, "$1.$2.$3"); }
const winMac = m => m.replace(/\./g,"").toUpperCase().replace(/(..)(?!$)/g,"$1-");
const shortIf = n => n.replace("GigabitEthernet","Gi").replace("FastEthernet","Fa");

/* ---------------- model ---------------- */
function create(cfg){
  const B = { cfg, devs:{}, order:[], cables:[], pinged:{}, console:null, events:[], mac:{}, arp:{}, nd:{}, frames:[], log:[], remote:{}, syslog:{}, now: cfg.now || Date.UTC(2026, 9, 12, 8, 30, 0) };
  for (const d0 of cfg.devices) addDevice(B, d0);
  for (const c of (cfg.cables||[])){ const r = plug(B, c.type, c.a, c.b, true); if (r.ok && c.swapped) r.cable.swapped = true; }
  if (B.order.some(id=>isSw(B.devs[id]))) try { l2State(B); } catch(e){}
  if (B.order.some(id=>B.devs[id].env)) try { computeL3(B); } catch(e){}
  try { linkLogs(B); } catch(e){}   // the starting link states (nothing logged)
  B._wifiReady = true; B._joinEvents = [];
  B._ready = true; for (const d of tunRouters(B)) d.env.tunCheck(); for (const id of B.order) if (B.devs[id].env) B.syslog[id] = B.syslog[id] || [];   // the starting tunnel states (nothing logged)
  return B;
}
function addDevice(B, d0){
  {
    const d = clone(Object.assign({}, d0, {setup:undefined, config:undefined, snap:undefined}));
    d.on = d0.on!==false;
    d.mdix = d0.mdix!==false;
    d.ports = (d0.ports || defaultPorts(d0.kind)).map(p=>Object.assign({sfp:null}, p));
    if (d0.sfp) for (const [pid,mod] of Object.entries(d0.sfp)){ const p = d.ports.find(x=>x.id===pid); if (p) p.sfp = mod; }
    if (d.kind==="switch" || d.kind==="router"){
      d.env = SIM.ios2Env({ host:d0.host || d0.label, kind:d.kind, ports:d.ports.filter(p=>p.ios).map(p=>p.ios), mac:d0.mac || macFor(d.id).slice(0,9), model:d0.platform, hooks:makeHooks(B, d) });
      if (d0.config) d0.config(d.env);              // pre-configure (e.g. a broken network to troubleshoot)
      B.syslog[d.id] = [];                          // the lab's own setup leaves nothing in the log (the learner starts with a clean buffer)
      if (!d0.fresh) d.env.baseline();              // the device's starting config is its saved startup-config (fresh:true = out of the box)
      B.mac[d.id] = {}; B.arp[d.id] = {};
    } else if (d.kind!=="hub"){
      d.mac = d0.mac || macFor(d.id); B.arp[d.id] = {};
      d.ip6 = Object.assign({auto:true}, d0.ip6 || {});
      if (d0.dhcp){ d.dhcp = true; d.ip = null; d.mask = null; d.gw = null; } d.dns = d0.dns ? [].concat(d0.dns) : [];
      if (d.kind==="wlc" && window.WLAN){ d.wlc = window.WLAN.store(clone(d0.wlc||{})); const m = d.wlc.mgmt; d.ip = m.ip; d.mask = m.mask; d.gw = m.gw; d.dhcp = false; d.model = d0.model || "Cisco 3504 WLC"; }
      if (d.kind==="ap"){ d.apMode = d0.mode || "local"; d.primary = d0.primary || null; d.model = d0.model || "Catalyst 9120 AP"; if (!d0.ip){ d.dhcp = true; d.ip = null; d.mask = null; d.gw = null; } }   // Windows default: "Obtain an IPv6 address automatically" (SLAAC from router advertisements)
    }
    if (d0.snap && d.env) d.env.importConfig(d0.snap);   // a saved topology: restore the device's config
    if (d0.setup) d0.setup(d);
    B.devs[d.id] = d; B.order.push(d.id);
    return d;
  }
}
function removeDevice(B, id){
  B.cables = B.cables.filter(c=>!c.a.startsWith(id+":") && !c.b.startsWith(id+":"));
  if (B.console && (B.console.laptop===id || B.console.target===id)) B.console = null;
  delete B.devs[id]; B.order = B.order.filter(x=>x!==id); delete B.mac[id]; delete B.arp[id]; delete B.remote[id];
}
function exportTopology(B){
  return { v:1, devices: B.order.map(id=>{ const d = B.devs[id]; const o = {id, kind:d.kind, label:d.label, x:Math.round(d.x), y:Math.round(d.y)};
      if (d.model) o.model = d.model; if (d.platform) o.platform = d.platform;
      if (d.env) o.snap = d.env.exportConfig(); else if (d.kind!=="hub"){ if (d.dhcp) o.dhcp = true; else { if (d.ip) o.ip = d.ip; if (d.mask) o.mask = d.mask; if (d.gw) o.gw = d.gw; if (d.dns && d.dns.length) o.dns = d.dns.slice(); } }
      const sf = d.ports.filter(p=>p.sfp); if (sf.length) o.sfp = Object.fromEntries(sf.map(p=>[p.id,p.sfp]));
      if (d.ports && JSON.stringify(d.ports.map(p=>p.id))!==JSON.stringify(defaultPorts(d.kind).map(p=>p.id))) o.ports = d.ports.map(p=>({id:p.id, type:p.type, label:p.label, ios:p.ios}));
      return o; }),
    cables: B.cables.map(c=>Object.assign({type:c.type, a:c.a, b:c.b}, c.swapped?{swapped:true}:{})) };
}
function defaultPorts(kind){
  if (kind==="switch") return [...Array(8)].map((_,i)=>({id:"g"+(i+1), type:"rj45", label:String(i+1), ios:"GigabitEthernet0/"+(i+1)}))
    .concat([{id:"g9", type:"sfp", label:"9", ios:"GigabitEthernet0/9"},{id:"g10", type:"sfp", label:"10", ios:"GigabitEthernet0/10"},{id:"con", type:"console", label:"CON"}]);
  if (kind==="router") return [{id:"g0", type:"rj45", label:"G0/0", ios:"GigabitEthernet0/0"},{id:"g1", type:"rj45", label:"G0/1", ios:"GigabitEthernet0/1"},{id:"g2", type:"rj45", label:"G0/2", ios:"GigabitEthernet0/2"},{id:"con", type:"console", label:"CON"}];
  if (kind==="hub") return [1,2,3,4].map(i=>({id:"p"+i, type:"rj45", label:String(i)}));
  if (kind==="laptop") return [{id:"eth", type:"rj45", label:"ETH"},{id:"usb", type:"usb", label:"USB"}];
  if (kind==="ap") return [{id:"eth", type:"rj45", label:"G0 · PoE"}];
  if (kind==="wlc") return [{id:"p1", type:"rj45", label:"1"},{id:"p2", type:"rj45", label:"2"}];
  return [{id:"eth", type:"rj45", label:"NIC"}];
}
const P = (B, ref) => { const [d,p] = String(ref).split(":"); const dev = B.devs[d]; const port = dev && dev.ports.find(x=>x.id===p); return port ? {dev, port, ref:d+":"+p} : null; };
const cableAt = (B, ref) => B.cables.find(c=>c.a===ref || c.b===ref);
const otherEnd = (c, ref) => c.a===ref ? c.b : c.a;
const refOfIos = (d, name) => { const p = d.ports.find(p=>p.ios===name); return p ? d.id+":"+p.id : null; };
function portName(x){ return `${x.dev.label} ${x.port.ios ? shortIf(x.port.ios) : x.port.label}`; }

function endFits(type, x){
  const k = CABLES[type].kind, pt = x.port.type;
  if (k==="copper") return pt==="rj45" ? null : pt==="sfp" ? "That's an RJ45 copper plug — it doesn't fit an SFP cage. Use a fibre cable with an SFP module (or a copper port)." : `An RJ45 patch cable doesn't go into the ${pt.toUpperCase()} port.`;
  if (k==="console") return (pt==="usb"||pt==="console") ? null : "The console cable goes from a laptop's USB port to the device's CONSOLE port — not a network port.";
  if (k==="fibre"){ if (pt!=="sfp") return "Fibre LC connectors only fit an SFP module, not an RJ45 port."; if (!x.port.sfp) return "The SFP cage is empty — insert a transceiver (SFP module) first, then plug the fibre into it."; return null; }
  return "That doesn't fit.";
}
function plug(B, type, a, b){
  if (!CABLES[type]) return {ok:false, msg:"Unknown cable."};
  const A = P(B,a), Bp = P(B,b);
  if (!A || !Bp) return {ok:false, msg:"Pick two ports."};
  if (A.ref===Bp.ref) return {ok:false, msg:"Both ends in the same port? Pick a port on another device."};
  if (A.dev===Bp.dev) return {ok:false, msg:"Plugging a device into itself creates a loop — connect it to another device."};
  for (const x of [A,Bp]){ if (cableAt(B,x.ref)) return {ok:false, msg:`${portName(x)} already has a cable in it — unplug it first.`}; const why = endFits(type,x); if (why) return {ok:false, msg:why}; }
  if (CABLES[type].kind==="console"){ const types = [A.port.type, Bp.port.type].sort().join(); if (types!=="console,usb") return {ok:false, msg:"One end of a console cable goes in the laptop's USB port, the other in the device's CONSOLE port."}; }
  const cable = { type, a:A.ref, b:Bp.ref, swapped:false };
  B.cables.push(cable);
  return {ok:true, cable, msg:`Connected ${portName(A)} ↔ ${portName(Bp)} with a ${CABLES[type].short} cable.`};
}
const intfOf = x => x.dev.env && x.port.ios ? x.dev.env.intfs[x.port.ios] : null;
function adminUp(x){ const i = intfOf(x); return !(i && (i.shut || i.errdis)); }
// speed/duplex negotiation between the two ends of a copper or fibre link
function negotiate(A, Bp){
  const ia = intfOf(A) || {speed:"auto", duplex:"auto"}, ib = intfOf(Bp) || {speed:"auto", duplex:"auto"};
  const sa = ia.speed||"auto", sb = ib.speed||"auto", da = ia.duplex||"auto", db = ib.duplex||"auto";
  if (sa!=="auto" && sb!=="auto" && sa!==sb) return {up:false, why:`Speed mismatch: ${sa} Mb/s at one end, ${sb} Mb/s at the other — the link can't come up.`};
  const speed = sa!=="auto" ? +sa : sb!=="auto" ? +sb : 1000;
  const fixedA = sa!=="auto" || da!=="auto", fixedB = sb!=="auto" || db!=="auto";
  let dA = da!=="auto" ? da : "full", dB = db!=="auto" ? db : "full";
  // autonegotiation off on one side: the auto side can sense speed, not duplex → falls back to half (at 10/100)
  if (fixedA && !fixedB && da==="auto") dA = speed>=1000 ? "full" : "half";
  if (fixedA && !fixedB) dB = speed>=1000 ? "full" : "half";
  if (fixedB && !fixedA) dA = speed>=1000 ? "full" : "half";
  return {up:true, speed, dA, dB, mismatch: dA!==dB};
}
function linkState(B, c){
  const A = P(B,c.a), Bp = P(B,c.b), k = CABLES[c.type].kind;
  if (k==="console") return {up:true, console:true};
  if (!A.dev.on || !Bp.dev.on) return {up:false, why:`${!A.dev.on?A.dev.label:Bp.dev.label} is powered off.`};
  if (k==="copper" && !A.dev.mdix && !Bp.dev.mdix){
    const mdiX = d => d.kind==="switch" || d.kind==="hub";
    const needCross = mdiX(A.dev)===mdiX(Bp.dev);
    if (needCross && !CABLES[c.type].crossover) return {up:false, why:"Neither device supports Auto MDI-X, and two devices of the same type need a crossover cable."};
    if (!needCross && CABLES[c.type].crossover) return {up:false, why:"A switch-to-host link needs a straight-through cable when neither side does Auto MDI-X."};
  }
  if (k==="fibre"){
    const ma = SFPS[A.port.sfp].mode, mb = SFPS[Bp.port.sfp].mode, mc = CABLES[c.type].mode;
    if (ma!==mb) return {up:false, why:`The optics don't match: ${SFPS[A.port.sfp].short} at one end, ${SFPS[Bp.port.sfp].short} at the other. Both ends must use the same type.`};
    if (ma!==mc) return {up:false, why:`${mc==="mm"?"Multimode":"Single-mode"} fibre with ${ma==="mm"?"multimode (SX)":"single-mode (LX)"} optics — the fibre type must match the transceivers.`};
    if (c.swapped) return {up:false, why:"No light received: Tx and Rx are swapped at one end. Flip the LC connector polarity on one end."};
  }
  for (const x of [A,Bp]){ const i = intfOf(x); if (i && i.errdis) return {up:false, why:`${portName(x)} is err-disabled (${i.errdis}) — fix the cause, then shutdown / no shutdown.`}; if (!adminUp(x)) return {up:false, why:`${portName(x)} is administratively down — it needs 'no shutdown'.`}; }
  const n = negotiate(A, Bp);
  if (!n.up) return n;
  return Object.assign({up:true}, n, n.mismatch ? {why:`Link is up but there is a DUPLEX MISMATCH: ${portName(A)} is ${n.dA}-duplex, ${portName(Bp)} is ${n.dB}-duplex. Expect CRC errors and late collisions, and very slow transfers.`} : {});
}
function linkUpAt(B, ref){ const c = cableAt(B,ref); return !!(c && CABLES[c.type].kind!=="console" && linkState(B,c).up); }

/* ---- Layer 2 core: 802.1Q tagging, DTP, EtherChannel, Spanning Tree (PVST+/Rapid PVST+), BPDU guard, storms ---- */
const isSw = d => d && d.kind==="switch";
const isRouterDev = d => d && (d.kind==="router" || (d.kind==="switch" && d.env.ipRouting));
const LMON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function syslog(B, d, msg, force){ const L = B.syslog[d.id] = B.syslog[d.id] || []; if (!force && L.some(x=>x.msg===msg)) return; B.clock = (B.clock||0) + 1;
  const tm = new Date((B.now || Date.UTC(2026, 9, 12, 8, 30)) + B.clock*7000 + (B.clock*137)%1000), two = x=>String(x).padStart(2,"0");
  const t = `${LMON[tm.getUTCMonth()]} ${String(tm.getUTCDate()).padStart(2, " ")} ${two(tm.getUTCHours())}:${two(tm.getUTCMinutes())}:${two(tm.getUTCSeconds())}.${String(tm.getUTCMilliseconds()).padStart(3,"0")}`;
  const sv = (msg.match(/^%[A-Z0-9_]+-([0-7])-/)||[])[1], sev = sv==null ? 6 : +sv, E = d.env;
  const to = E && E.logHosts && sev <= (E.logTrap==null ? 6 : E.logTrap) ? E.logHosts.slice() : [];
  const trap = E && E.snmp && E.snmp.traps && /%LINK-3-UPDOWN|%LINEPROTO-5-UPDOWN/.test(msg) ? E.snmp.hosts.map(h=>h.ip) : [];
  const e = {t, msg, sev, to, trap, trapped: !E || sev <= (E.logTrap==null ? 6 : E.logTrap)}; L.push(e); if (L.length>60) L.shift(); return e; }
const portNum = (d, pid) => d.ports.findIndex(p=>p.id===pid) + 1;
// physical link usable for frames: cable present and link up (speed/optics/admin/err-disabled)
const physUp = (B, ref) => linkUpAt(B, ref);
function farOf(B, ref){ const c = cableAt(B, ref); return c && CABLES[c.type].kind!=="console" ? P(B, otherEnd(c, ref)) : null; }

// EtherChannel: which member ports bundle into which port-channel, per switch
function computeBundles(B){
  const res = {};   // devId -> { group -> {group, proto, up, members:[{pid, ios, flag}], peer} }, plus res.memberOf[ref] = "po<g>"
  res.memberOf = {};
  const proto = m => ["active","passive"].includes(m) ? "LACP" : ["desirable","auto"].includes(m) ? "PAgP" : "-";
  const compatible = (a, b) => (a==="on"&&b==="on") || (a==="active"&&(b==="active"||b==="passive")) || (a==="passive"&&b==="active") || (a==="desirable"&&(b==="desirable"||b==="auto")) || (a==="auto"&&b==="desirable");
  for (const id of B.order){ const d = B.devs[id]; if (!isSw(d)) continue;
    const groups = {};
    for (const p of d.ports){ if (!p.ios) continue; const i = d.env.intfs[p.ios]; if (!i.channel) continue; (groups[i.channel.group] = groups[i.channel.group] || []).push({pid:p.id, ios:p.ios, mode:i.channel.mode}); }
    res[id] = {};
    for (const [g, mem] of Object.entries(groups)){
      const G = res[id][g] = { group:+g, proto: proto(mem[0].mode), up:false, members:[], peer:null };
      const ups = mem.filter(m=>physUp(B, id+":"+m.pid));
      const farSet = new Set(ups.map(m=>{ const f = farOf(B, id+":"+m.pid); return f && isSw(f.dev) && f.dev.env.intfs[f.port.ios].channel ? f.dev.id+"|"+f.dev.env.intfs[f.port.ios].channel.group : "x"; }));
      for (const m of mem){
        const ref = id+":"+m.pid; let flag = "D";
        if (physUp(B, ref)){
          const f = farOf(B, ref), fi = f && isSw(f.dev) && f.dev.env.intfs[f.port.ios];
          const fc = fi && fi.channel;
          const sameCfg = i2 => { const a = d.env.intfs[m.ios]; return a.mode===i2.mode && a.vlan===i2.vlan && a.native===i2.native && JSON.stringify(a.allowed)===JSON.stringify(i2.allowed); };
          const po = d.env.intfs["Port-channel"+g];
          const memCfgOk = po ? sameCfg(po) : mem.every(o=>sameCfg(d.env.intfs[o.ios]));
          if (!fc) flag = m.mode==="on" ? "P" : "I";                         // nothing to negotiate with: LACP/PAgP ports stay stand-alone
          else if (!compatible(m.mode, fc.mode)) flag = m.mode==="on" ? "P" : "I";
          else if (!memCfgOk) flag = "s";                                   // members must have identical switchport settings
          else if (farSet.size>1) flag = "s";                               // members lead to different switches/groups
          else flag = "P";
        }
        G.members.push({pid:m.pid, ios:m.ios, name:m.ios, flag});
        if (flag==="P") res.memberOf[ref] = "po"+g;
      }
      G.up = G.members.some(x=>x.flag==="P");
      const firstUp = G.members.find(x=>x.flag==="P");
      if (firstUp){ const f = farOf(B, id+":"+firstUp.pid); if (f) G.peer = {dev:f.dev.id, group: (f.dev.env.intfs[f.port.ios].channel||{}).group}; }
    }
  }
  for (let pass = 0; pass < 2; pass++) for (const id of B.order){ const d = B.devs[id]; if (!res[id]) continue;
    for (const G of Object.values(res[id])){ if (G.proto==="-") continue;          // mode on doesn't negotiate: it keeps sending (a real black hole)
      for (const m of G.members){ if (m.flag!=="P") continue; const f = farOf(B, id+":"+m.pid);
        const fG = f && res[f.dev.id] && Object.values(res[f.dev.id]).find(x=>x.members.some(y=>y.pid===f.port.id));
        const fm = fG && fG.members.find(y=>y.pid===f.port.id);
        if (fm && fm.flag!=="P"){ m.flag = "s"; delete res.memberOf[id+":"+m.pid]; } }
      G.up = G.members.some(x=>x.flag==="P"); } }
  return res;
}
// logical ports of a switch: physical L2 ports that aren't bundled, plus one "po<g>" per up bundle
function logicalPorts(B, d, S){
  const out = [];
  for (const p of d.ports){ if (!p.ios) continue; const i = d.env.intfs[p.ios]; if (i.mode==="routed") continue; const ref = d.id+":"+p.id;
    if (S.bundles.memberOf[ref]) continue; if (i.channel){ const G = S.bundles[d.id][i.channel.group]; const m = G && G.members.find(x=>x.pid===p.id); if (m && (m.flag==="s" || m.flag==="I")) { if (m.flag==="s") continue; } }
    out.push({lp:p.id, ios:p.ios, refs:[ref], name:shortIf(p.ios), num:portNum(d,p.id)}); }
  for (const G of Object.values(S.bundles[d.id]||{})){ if (!G.up) continue; const refs = G.members.filter(m=>m.flag==="P").map(m=>d.id+":"+m.pid);
    out.push({lp:"po"+G.group, ios:"Port-channel"+G.group, refs, name:"Po"+G.group, num:64+G.group, po:true}); }
  return out;
}
// a bundle's switchport settings are its members' (they must match to bundle at all)
const memberOfGroup = (d, g) => d.ports.find(p=>{ const i = p.ios && d.env.intfs[p.ios]; return i && i.channel && i.channel.group===g; });
const poMember = (d, g) => { const po = d.env.intfs["Port-channel"+g]; const same = p => { const a = d.env.intfs[p.ios], b = po; return a.mode===b.mode && a.vlan===b.vlan && a.native===b.native && JSON.stringify(a.allowed)===JSON.stringify(b.allowed); };
  return (po && d.ports.find(p=>{ const i = p.ios && d.env.intfs[p.ios]; return i && i.channel && i.channel.group===g && same(p); })) || memberOfGroup(d, g); };
function lpIntf(d, lp){ return lp.startsWith("po") ? (d.env.intfs["Port-channel"+lp.slice(2)] || d.env.intfs[memberOfGroup(d, +lp.slice(2)).ios]) : d.env.intfs[d.ports.find(p=>p.id===lp).ios]; }
function lpIosName(d, lp){ return lp.startsWith("po") ? "Port-channel"+lp.slice(2) : d.ports.find(p=>p.id===lp).ios; }
function lpOp(d, lp){ if (lp.startsWith("po")){ const m = poMember(d, +lp.slice(2)); return m ? d.env.opMode(m.ios) : "access"; } const p = d.ports.find(x=>x.id===lp); return d.env.opMode(p.ios); }
function carries(d, lp, v){ const i = lpIntf(d, lp), op = lpOp(d, lp); if (op==="trunk") return !i.allowed || i.allowed.includes(v); return op==="access" && (i.vlan===v || i.voiceVlan===v); }
function lpUp(B, lpo){ return lpo.refs.some(r=>physUp(B, r)); }
// the far end of a logical port (another switch's logical port), or a host/router
function lpFar(B, S, d, lpo){ const f = farOf(B, lpo.refs[0]); if (!f) return null; if (isSw(f.dev)){ const fl = S.bundles.memberOf[f.ref] || f.port.id; return {dev:f.dev, lp:fl}; } return {dev:f.dev, host:true}; }
const speedCost = s => s>=10000 ? 2 : s>=1000 ? 4 : s>=100 ? 19 : 100;

function evaluateGuards(B, S){
  // BPDU guard: a port that should only face hosts receives BPDUs from another STP switch → err-disabled
  for (const id of B.order){ const d = B.devs[id]; if (!isSw(d)) continue;
    for (const p of d.ports){ if (!p.ios) continue; const i = d.env.intfs[p.ios]; if (i.errdis || i.shut || i.mode==="routed") continue;
      const guard = i.stp && (i.stp.bpduguard===true || (i.stp.bpduguard!==false && (i.stp.portfast==="trunk" || (i.stp.portfast && lpOp(d, p.id)!=="trunk")) && d.env.bpduDefault) || (i.stp.bpduguard!==false && d.env.pfDefault && d.env.bpduDefault && lpOp(d, p.id)==="access"));
      if (!guard) continue; const ref = id+":"+p.id; const c = cableAt(B, ref); if (!c || CABLES[c.type].kind==="console") continue;
      const st = linkState(B, c); if (!st.up) continue;
      const f = farOf(B, ref); if (!f || !isSw(f.dev)) continue;
      const fi = f.dev.env.intfs[f.port.ios]; if (!fi || fi.mode==="routed") continue;
      const sendsBpdu = Object.keys(f.dev.env.vlans).some(v=>(+v<1002||+v>1005) && !f.dev.env.stpOff[v]);
      if (!sendsBpdu) continue;
      i.errdis = "bpduguard"; i.errdisAt = B.now;
      syslog(B, d, `%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port ${p.ios} with BPDU Guard enabled. Disabling port.`);
      syslog(B, d, `%PM-4-ERR_DISABLE: bpduguard error detected on ${shortIf(p.ios)}, putting ${shortIf(p.ios)} in err-disable state`);
    } }
  // native VLAN mismatch on trunks (reported by CDP)
  for (const id of B.order){ const d = B.devs[id]; if (!isSw(d)) continue;
    for (const p of d.ports){ if (!p.ios) continue; const ref = id+":"+p.id; if (!physUp(B, ref) || d.env.opMode(p.ios)!=="trunk") continue; const f = farOf(B, ref); if (!f || !isSw(f.dev) || f.dev.env.opMode(f.port.ios)!=="trunk") continue;
      const a = d.env.intfs[p.ios].native, b = f.dev.env.intfs[f.port.ios].native;
      if (a!==b && d.env.cdpRun) syslog(B, d, `%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on ${p.ios} (${a}), with ${f.dev.env.host} ${f.port.ios} (${b}).`); } }
}

function computeStp(B, S){
  const vlans = new Set(); for (const id of B.order){ const d = B.devs[id]; if (isSw(d)) Object.keys(d.env.vlans).map(Number).filter(v=>v<1002||v>1005).forEach(v=>vlans.add(v)); }
  const out = {}, storms = new Set();
  for (const v of vlans){
    const sws = B.order.map(id=>B.devs[id]).filter(d=>isSw(d) && d.env.vlans[v]);
    const bid = d => ({prio: (d.env.stpPrio[v]!=null ? d.env.stpPrio[v] : 32768) + v, mac: d.env.baseMac});
    const cmpB = (a, b) => a.prio!==b.prio ? a.prio-b.prio : (a.mac<b.mac?-1:a.mac>b.mac?1:0);
    // edges between STP-running switches on logical ports that carry v and are up
    const lpsOf = {}; for (const d of sws) lpsOf[d.id] = logicalPorts(B, d, S).filter(l=>carries(d, l.lp, v) && lpUp(B, l));
    const stpOn = d => !d.env.stpOff[v];
    const portCost = (d, l) => { const i = lpIntf(d, l.lp); if (i && i.stp && i.stp.cost) return i.stp.cost; if (l.po){ const n = l.refs.filter(r=>physUp(B,r)).length; return n>=2 ? 3 : 4; } const c = cableAt(B, l.refs[0]); const s = c && linkState(B, c); return speedCost((s && s.speed) || 1000); };
    const pid = (d, l) => { const i = lpIntf(d, l.lp); return {prio: (i && i.stp && i.stp.prio!=null) ? i.stp.prio : 128, num: l.num}; };
    const edges = [];   // {a:{d,l}, b:{d,l}}
    for (const d of sws) for (const l of lpsOf[d.id]){ const f = lpFar(B, S, d, l); if (!f || f.host || !f.dev.env.vlans[v]) continue; const fl = (lpsOf[f.dev.id]||[]).find(x=>x.lp===f.lp); if (!fl) continue; if (d.id < f.dev.id || (d.id===f.dev.id && l.lp<f.lp)) edges.push({a:{d,l}, b:{d:f.dev, l:fl}}); }
    // connected components of STP-running switches
    const comp = {}; const find = x => comp[x]===x ? x : (comp[x] = find(comp[x])); for (const d of sws) comp[d.id] = d.id;
    for (const e of edges) if (stpOn(e.a.d) && stpOn(e.b.d)) comp[find(e.a.d.id)] = find(e.b.d.id);
    const root = {}; for (const d of sws){ if (!stpOn(d)) continue; const c = find(d.id); if (!root[c] || cmpB(bid(d), bid(root[c]))<0) root[c] = d; }
    // root path cost (Dijkstra on small graphs) — cost charged at the receiving port
    const rpc = {}; for (const d of sws) rpc[d.id] = Infinity; for (const r of Object.values(root)) rpc[r.id] = 0;
    for (let k=0;k<sws.length+1;k++) for (const e of edges){ if (!stpOn(e.a.d)||!stpOn(e.b.d)) continue;
      const ca = rpc[e.b.d.id] + portCost(e.a.d, e.a.l), cb = rpc[e.a.d.id] + portCost(e.b.d, e.b.l);
      if (ca < rpc[e.a.d.id]) rpc[e.a.d.id] = ca; if (cb < rpc[e.b.d.id]) rpc[e.b.d.id] = cb; }
    const roles = {};   // devId -> lp -> {role,state}
    for (const d of sws){ roles[d.id] = {}; for (const l of lpsOf[d.id]) roles[d.id][l.lp] = {role:"Desg", state:"FWD"}; }
    const cmpVec = (x, y) => { for (let k=0;k<x.length;k++){ const a = x[k], b = y[k]; if (typeof a==="object"){ const c = cmpB(a,b); if (c) return c; } else if (a!==b) return a<b?-1:1; } return 0; };
    // root port: best (root cost via port, neighbour BID, neighbour port id, own port id)
    const rootPort = {};
    for (const d of sws){ if (!stpOn(d) || root[find(d.id)]===d) continue;
      let best = null;
      for (const e of edges){ const me = e.a.d===d ? e.a : e.b.d===d ? e.b : null; if (!me) continue; const nb = me===e.a ? e.b : e.a; if (!stpOn(nb.d)) continue;
        const np = pid(nb.d, nb.l), op = pid(d, me.l);
        const vec = [rpc[nb.d.id] + portCost(d, me.l), bid(nb.d), np.prio, np.num, op.prio, op.num];
        if (!best || cmpVec(vec, best.vec)<0) best = {vec, lp:me.l.lp}; }
      if (best){ const g = lpIntf(d, best.lp).stp || {};
        if (g.guard==="root"){ roles[d.id][best.lp] = {role:"Desg", state:"BKN*", inc:"ROOT"}; syslog(B, d, `%SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port ${lpIosName(d, best.lp)} on VLAN${String(v).padStart(4,"0")}.`); }
        else { roles[d.id][best.lp] = {role:"Root", state:"FWD"}; rootPort[d.id] = best.lp; } } }
    // designated port per segment: the end with the better (root cost, BID, port id); the other end blocks unless it's the root port
    for (const e of edges){ if (!stpOn(e.a.d) || !stpOn(e.b.d)) continue;
      const pa = pid(e.a.d, e.a.l), pb = pid(e.b.d, e.b.l);
      const va = [rpc[e.a.d.id], bid(e.a.d), pa.prio, pa.num], vb = [rpc[e.b.d.id], bid(e.b.d), pb.prio, pb.num];
      const loser = cmpVec(va, vb) <= 0 ? e.b : e.a, winner = loser===e.a ? e.b : e.a;
      if (roles[winner.d.id][winner.l.lp].role!=="Root" || roles[winner.d.id][winner.l.lp].inc) roles[winner.d.id][winner.l.lp] = roles[winner.d.id][winner.l.lp].inc ? roles[winner.d.id][winner.l.lp] : {role:"Desg", state:"FWD"};
      if (rootPort[loser.d.id]!==loser.l.lp && !roles[loser.d.id][loser.l.lp].inc) roles[loser.d.id][loser.l.lp] = {role:"Altn", state:"BLK"}; }
    const nowInc = new Set();
    for (const e of edges){ if (!stpOn(e.a.d) || !stpOn(e.b.d) || lpOp(e.a.d, e.a.l.lp)!=="trunk" || lpOp(e.b.d, e.b.l.lp)!=="trunk") continue;
      const na = lpIntf(e.a.d, e.a.l.lp).native || 1, nb = lpIntf(e.b.d, e.b.l.lp).native || 1; if (na===nb || (v!==na && v!==nb)) continue;
      for (const [x, mine] of [[e.a, na], [e.b, nb]]){ roles[x.d.id][x.l.lp] = {role:"Desg", state:"BKN*", inc:"PVID"}; nowInc.add(x.d.id+"|"+x.l.lp+"|"+v);
        B._pvid = B._pvid || {}; B._pvid[x.d.id+"|"+x.l.lp+"|"+v] = 1;
        syslog(B, x.d, v===mine ? `%SPANTREE-2-BLOCK_PVID_LOCAL: Blocking ${lpIosName(x.d, x.l.lp)} on VLAN${String(v).padStart(4,"0")}. Inconsistent local vlan.`
                                : `%SPANTREE-2-BLOCK_PVID_PEER: Blocking ${lpIosName(x.d, x.l.lp)} on VLAN${String(v).padStart(4,"0")}. Inconsistent peer vlan.`); } }
    for (const k of Object.keys(B._pvid||{})){ const [did, lp, vv] = k.split("|"); if (+vv!==v || nowInc.has(k)) continue; delete B._pvid[k];
      const d = B.devs[did]; if (!d) continue; const L = B.syslog[did] || []; for (let i=L.length-1;i>=0;i--) if (/BLOCK_PVID_(LOCAL|PEER): Blocking /.test(L[i].msg) && L[i].msg.includes(`${lpIosName(d, lp)} on VLAN${String(v).padStart(4,"0")}`)) L[i].msg += " ";   // allow a later re-block to log again
      syslog(B, d, `%SPANTREE-2-UNBLOCK_CONSIST_PORT: Unblocking ${lpIosName(d, lp)} on VLAN${String(v).padStart(4,"0")}. Port consistency restored.`); }
    // forwarding graph → loop (broadcast storm) detection: union-find over forwarding links between switches
    const uf = {}; const f2 = x => uf[x]===undefined||uf[x]===x ? (uf[x]=x) : (uf[x]=f2(uf[x]));
    let loop = false;
    for (const e of edges){ const fa = roles[e.a.d.id][e.a.l.lp].state==="FWD" || !stpOn(e.a.d), fb = roles[e.b.d.id][e.b.l.lp].state==="FWD" || !stpOn(e.b.d); if (!fa || !fb) continue; const x = f2(e.a.d.id), y = f2(e.b.d.id); if (x===y) loop = true; else uf[x] = y; }
    if (loop) storms.add(v);
    for (const d of sws){ const r = root[find(d.id)]; out[d.id] = out[d.id] || {};
      out[d.id][v] = { on: stpOn(d), isRoot: r===d, root: r ? bid(r) : bid(d), bridge: bid(d), rootCost: rpc[d.id]===Infinity?0:rpc[d.id], rootLp: rootPort[d.id]||null, roles: roles[d.id], lps: lpsOf[d.id],
        info: Object.fromEntries(lpsOf[d.id].map(l=>{ const f = lpFar(B, S, d, l); return [l.lp, {cost: portCost(d, l), pid: pid(d, l), edge: !f || f.host || !f.dev.env.vlans[v]}]; })) }; }
  }
  return {byDev: out, storms};
}
function l2State(B){ const S = {}; S.bundles = computeBundles(B); evaluateGuards(B, S); const t = computeStp(B, S); S.stp = t.byDev; S.storms = t.storms;
  // a Spanning Tree topology change makes real switches flush their learned MACs (RSTP TC / 802.1D short aging) so traffic follows the new tree
  const sig = JSON.stringify(Object.entries(S.stp).map(([id,vs])=>[id, Object.entries(vs||{}).map(([v,x])=>[v, x && x.on ? Object.entries(x.roles||{}).map(([lp,r])=>lp+":"+r.role+":"+r.state).sort() : 0])]));
  if (B._stpSig != null && B._stpSig !== sig) for (const id of B.order) if (B.mac[id] && isSw(B.devs[id])) B.mac[id] = {};
  B._stpSig = sig; return S; }
function stpStateOf(S, d, lp, v){ const x = S.stp[d.id] && S.stp[d.id][v]; if (!x || !x.on) return "FWD"; const r = x.roles[lp]; return r ? r.state : "FWD"; }

/* ---- frame delivery on the wire: tags, DTP trunks, STP blocking, bundles, hubs, routers, hosts ---- */
// from: a port ref string (untagged), {ref, tag} (e.g. a router subinterface), or {svi:devId, vlan} (a switch's own SVI)
// port security: a port accepts frames only from its secure MAC addresses (learned up to the maximum, or configured);
// one more source MAC is a violation — shutdown (err-disable), restrict (drop + log + count) or protect (drop silently)
// Dynamic ARP Inspection: an ARP on an untrusted port must match a DHCP snooping binding (or the VLAN's ARP ACL)
function daiCheck(B, sw, ios, f, vlan, note){
  const E = sw.env, S = E.daiStats = E.daiStats || {}, st = S[vlan] = S[vlan] || {fwd:0, drop:0, dhcpDrop:0, aclDrop:0, dhcpPermit:0, aclPermit:0};
  const bind = Object.values(E.snoopBind || {}).find(b=>b.mac===f.src && b.vlan===vlan);
  const aclName = E.dai.filters[vlan], acl = aclName && E.arpAcls[aclName], ae = acl && acl.find(e=>e.ip===f.arpIp && e.mac===f.src);
  if (ae && ae.action==="permit"){ st.fwd++; st.aclPermit++; return true; }
  const statik = aclName && (E.dai.statics||{})[vlan];   // "filter … static": the ARP ACL alone decides
  const aclDeny = !!(ae && ae.action==="deny") || !!statik;   // an explicit deny, or no match under "static"
  if (!aclDeny && bind && bind.ip===f.arpIp){ st.fwd++; st.dhcpPermit++; return true; }
  st.drop++; if (aclDeny) st.aclDrop++; else st.dhcpDrop++;
  const c1 = (B.clock||0) + 1, tm = new Date((B.now || Date.UTC(2026,9,12,8,30)) + c1*7000 + (c1*137)%1000), two = x=>String(x).padStart(2,"0");
  const when = `${two(tm.getUTCHours())}:${two(tm.getUTCMinutes())}:${two(tm.getUTCSeconds())} UTC ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][tm.getUTCDay()]} ${LMON[tm.getUTCMonth()]} ${tm.getUTCDate()} ${tm.getUTCFullYear()}`;
  syslog(B, sw, `%SW_DAI-4-${aclDeny ? "ACL_DENY" : "DHCP_SNOOPING_DENY"}: 1 Invalid ARPs (${f.arpOp==="req" ? "Req" : "Res"}) on ${shortIf(ios)}, vlan ${vlan}.([${f.src}/${f.arpIp}/${f.arpOp==="req" ? "0000.0000.0000" : f.dst}/${f.arpTarget||"0.0.0.0"}/${when}])`, true);
  note(aclDeny ? `${sw.label} ${shortIf(ios)} — <b>Dynamic ARP Inspection</b>: "${f.arpIp} is at ${f.src}" is ${ae && ae.action==="deny" ? "denied by" : "not permitted by"} ARP ACL ${aclName}${statik ? " (applied with static, so bindings aren't consulted)" : ""} → dropped`
    : `${sw.label} ${shortIf(ios)} — <b>Dynamic ARP Inspection</b>: "${f.arpIp} is at ${f.src}" doesn't match any DHCP snooping binding${aclName ? " or ARP ACL " + aclName : ""} → dropped`);
  return false;
}
function psecCheck(B, sw, ios, i, mac, vlan, note){
  i.psecMacs = i.psecMacs || []; const max = i.psecMax || 1, sh = shortIf(ios);
  if (i.psecMacs.some(m=>m.mac===mac)){ i.psecLast = {mac, vlan}; return true; }
  if (i.psecMacs.length < max){ const type = i.psecSticky ? "sticky" : "dynamic"; i.psecMacs.push({mac, type, vlan}); i.psecLast = {mac, vlan};
    note(`${sw.label} ${sh} port security: learned ${mac} as a secure ${type} address (${i.psecMacs.length} of ${max})${type==="sticky" ? " — written into the running-config" : ""}`); return true; }
  const mode = i.psecViol || "shutdown"; if (mode!=="protect") i.psecViolCount = (i.psecViolCount||0) + 1; i.psecLast = {mac, vlan};   // protect mode doesn't count
  if (mode==="shutdown" && !i.errdis){ i.errdis = "psecure-violation"; i.errdisAt = B.now;
    syslog(B, sw, `%PM-4-ERR_DISABLE: psecure-violation error detected on ${sh}, putting ${sh} in err-disable state`, true);
    syslog(B, sw, `%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address ${mac} on port ${ios}.`, true); }
  else if (mode==="restrict") syslog(B, sw, `%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address ${mac} on port ${ios}.`, true);
  note(`${sw.label} ${sh} port security: ${mac} is not one of its ${max} secure address${max>1?"es":""} → violation (${mode}): ${mode==="shutdown" ? "the port is err-disabled — shutdown / no shutdown brings it back once the cause is gone" : mode==="restrict" ? "the frame is dropped, logged and counted" : "the frame is dropped silently"}`);
  return false;
}
function deliver(B, from, frame, step0){
  const S = l2State(B);
  const hops = [], recv = [], notes = [];
  const seen = new Set(); let storm = null;
  const pushNote = s => { if (!notes.includes(s)) notes.push(s); };
  const sendPhys = (ref, tag, step) => {
    const c = cableAt(B, ref); if (!c || CABLES[c.type].kind==="console" || !linkState(B,c).up) return;
    const farRef = otherEnd(c, ref); hops.push({a:ref, b:farRef, step, kind: frame.dst===BCAST ? "bcast" : "ucast", label:frame.label, tag, gre: !!frame.gre});
    arrive(farRef, tag, step+1);
  };
  const switchIn = (sw, inLp, vlan, step) => {
    const key = sw.id+"|"+vlan; if (seen.has(key)){ storm = storm || {sw, vlan}; return; } seen.add(key);
    const T = B.mac[sw.id];
    for (const [m,e] of Object.entries(T)){ const lpo = logicalPorts(B, sw, S).find(l=>l.lp===e.port); if (!lpo || !lpUp(B, lpo)) delete T[m]; }
    const sk = vlan+"|"+frame.src, dk = vlan+"|"+frame.dst;
    const had = inLp && T[sk] && T[sk].port===inLp;
    const moved = inLp && T[sk] && !had;
    const lpName = lp => lp.startsWith("po") ? "Po"+lp.slice(2) : shortIf(sw.ports.find(p=>p.id===lp).ios);
    if (inLp) T[sk] = { port: inLp, vlan, mac: frame.src };
    if (inLp) pushNote(had ? `${sw.label} already knew ${frame.src} on ${lpName(inLp)} — refreshed its aging timer` : moved ? `${sw.label} saw ${frame.src} move to ${lpName(inLp)} — updated the table` : `${sw.label} learned ${frame.src} on ${lpName(inLp)} (VLAN ${vlan})`);
    const svi = sw.env.intfs["Vlan"+vlan];
    if (svi && !svi.shut && svi.ip && (frame.dst===BCAST || frame.dst===svi.mac || hsrpOwnsMac(B, sw, "Vlan"+vlan, frame.dst))) recv.push({dev:sw, svi:"Vlan"+vlan, vlan});
    if (svi && (frame.dst===svi.mac || hsrpOwnsMac(B, sw, "Vlan"+vlan, frame.dst))) return;
    const known = frame.dst!==BCAST && T[dk] ? T[dk] : null;
    const outs = [];
    for (const l of logicalPorts(B, sw, S)){
      if (l.lp===inLp) continue;
      if (!carries(sw, l.lp, vlan) || !lpUp(B, l)) continue;
      if (stpStateOf(S, sw, l.lp, vlan)!=="FWD") continue;
      if (known && known.port!==l.lp) continue;
      outs.push(l);
    }
    if (known) pushNote(`${sw.label} knows ${frame.dst} is on ${outs.length?outs[0].name:"the port it came in on"} → forwarded out that port only`);
    else pushNote(`${sw.label} ${frame.dst===BCAST?"received a broadcast":isV6Mc(frame.dst)?"received an IPv6 multicast frame (to "+frame.dst+")":"doesn't know "+frame.dst+" (unknown unicast)"} → flooded out ${outs.length?outs.map(l=>l.name).join(", "):"no other ports"} in VLAN ${vlan}`);
    for (const l of outs){
      const i = lpIntf(sw, l.lp), op = lpOp(sw, l.lp);
      const tag = op==="trunk" ? (vlan===i.native ? null : vlan) : (i.voiceVlan===vlan ? vlan : null);
      if (op==="trunk") pushNote(`${sw.label} sends it out trunk ${l.name} ${tag==null?`untagged (VLAN ${vlan} is the native VLAN)`:`with an 802.1Q tag for VLAN ${vlan}`}`);
      const ref = l.refs.find(r=>physUp(B, r));     // an EtherChannel sends each frame down one member link
      if (l.po) pushNote(`${sw.label} picks one member link of ${l.name} (${shortIf(sw.ports.find(p=>p.id===ref.split(":")[1]).ios)}) for this frame`);
      sendPhys(ref, tag, step);
    }
  };
  const arrive = (ref, tag, step) => {
    const x = P(B, ref); const d = x.dev;
    if (d.kind==="switch"){
      const i = d.env.intfs[x.port.ios]; if (!i || i.shut || i.errdis) return;
      if (i.mode==="routed"){ if (tag!=null) return; if (frame.dst===BCAST || frame.dst===i.mac) recv.push({dev:d, ref, ios:x.port.ios}); return; }
      const lp = S.bundles.memberOf[ref] || x.port.id;
      if (i.channel && !S.bundles.memberOf[ref]){ const G = S.bundles[d.id][i.channel.group]; const m = G && G.members.find(y=>y.pid===x.port.id); if (m && m.flag==="s") { pushNote(`${d.label} ${shortIf(x.port.ios)} is suspended from Port-channel${i.channel.group} (settings don't match) — frame dropped`); return; } }
      const li = lpIntf(d, lp), op = lpOp(d, lp);
      let v;
      if (op==="trunk"){ v = tag==null ? li.native : tag; if (li.allowed && !li.allowed.includes(v)){ pushNote(`${d.label} drops it: VLAN ${v} isn't allowed on trunk ${lp.startsWith("po")?"Po"+lp.slice(2):shortIf(x.port.ios)}`); return; } }
      else { if (tag!=null && tag!==li.voiceVlan){ pushNote(`${d.label} ${shortIf(x.port.ios)} is an access port and dropped a frame tagged for VLAN ${tag} — is the other end a trunk while this one isn't?`); return; } v = tag!=null ? tag : li.vlan; }
      if (!d.env.vlans[v]){ pushNote(`${d.label} has no VLAN ${v} — frame dropped`); return; }
      if (stpStateOf(S, d, lp, v)!=="FWD"){ pushNote(`${d.label} ${lp.startsWith("po")?"Po"+lp.slice(2):shortIf(x.port.ios)} is blocking for VLAN ${v} (Spanning Tree) — frame discarded, no loop`); return; }
      if (i.psec && !lp.startsWith("po")){ const ok = psecCheck(B, d, x.port.ios, i, frame.src, v, pushNote); if (!ok) return; }
      const pi = lpIntf(d, lp) || i, sh = lp.startsWith("po") ? "Po"+lp.slice(2) : shortIf(x.port.ios);
      const dl = frame.kind==="dhcp" ? frame.label : frame.kind==="ip" && /^DHCP (Offer|Ack|NAK|Request)\b/.test(frame.label||"") ? frame.label.split(" ")[1] : null;
      if (dl && frame.kind==="ip" && d.env.snoop && d.env.snoop.on && d.env.snoop.vlans.includes(v)){
        if (!pi.snoopTrust && /^(Offer|Ack|NAK)$/.test(dl)){ pushNote(`${d.label} ${sh} — <b>DHCP snooping</b>: a DHCP ${dl} is a SERVER message and this port is untrusted → dropped (only trusted ports may carry them)`); frame.snoopDropped = d.label; B._snoopDrop = d.label; return; }
        if (!pi.snoopTrust && dl==="Request") B._snoopRenew = {sw:d, ios:x.port.ios, vlan:v, mac:frame.src}; }
      if (frame.kind==="dhcp" && d.env.snoop && d.env.snoop.on && d.env.snoop.vlans.includes(v) && !pi.snoopTrust){
        if (/^(Offer|Ack|NAK)$/.test(frame.label)){ pushNote(`${d.label} ${sh} — <b>DHCP snooping</b>: a DHCP ${frame.label} is a SERVER message and this port is untrusted → dropped (only trusted ports may carry them)`); frame.snoopDropped = d.label; return; }
        if (!frame.snoopClient) frame.snoopClient = {sw:d, ios:x.port.ios, vlan:v};
        if (d.env.snoop.opt82 && !frame.opt82){ frame.opt82 = d.label; pushNote(`${d.label} ${sh} — DHCP snooping inserts <b>option 82</b> (relay agent information, giaddr 0.0.0.0) into the client's message`); } }
      if (frame.kind==="arp" && d.env.dai && d.env.dai.vlans.includes(v) && !pi.daiTrust){ if (!daiCheck(B, d, x.port.ios, frame, v, pushNote)) return; }
      switchIn(d, lp, v, step); return;
    }
    if (d.kind==="hub"){ const key = d.id+"|"+tag; if (seen.has(key)){ storm = storm || {sw:d, vlan:tag}; return; } seen.add(key); pushNote(`${d.label} (hub) repeated the frame out every other port — every device on it sees it`); for (const p of d.ports) if (p.id!==x.port.id) sendPhys(d.id+":"+p.id, tag, step); return; }
    if (d.kind==="router"){
      const i = d.env.intfs[x.port.ios]; if (!i || i.shut) return;
      let ln = null;
      const subs = Object.entries(d.env.intfs).filter(([n,s])=>s.sub && s.parent===x.port.ios && !s.shut);
      if (tag==null){ ln = (i.ip || i.ip6 || i.ll || i.ip6en || i.ip6auto || i.dhcpClient) ? x.port.ios : ((subs.find(([n,s])=>s.encapNative)||[])[0] || null); }
      else ln = (subs.find(([n,s])=>s.encap===tag && !s.encapNative)||[])[0] || null;
      if (!ln){ if (tag!=null) pushNote(`${d.label} has no subinterface for VLAN ${tag} on ${shortIf(x.port.ios)} — frame dropped`); return; }
      const li = d.env.intfs[ln];
      if (frame.dst===BCAST || frame.dst===li.mac || isV6Mc(frame.dst) || hsrpOwnsMac(B, d, ln, frame.dst)) recv.push({dev:d, ref, ios:ln, tag});
      return;
    }
    if (d.kind==="wlc" || d.kind==="ap"){
      const own = d.kind==="wlc" ? (d.wlc && d.wlc.mgmt.vlan ? d.wlc.mgmt.vlan : null) : null;
      if ((tag==null ? null : tag)===own && (frame.dst===BCAST || frame.dst===d.mac || isV6Mc(frame.dst))) recv.push({dev:d, ref, tag});
      for (const id2 of B.order){ const c = B.devs[id2]; if (!c.wifiAt || c.on===false || c.wifiAt.ref!==ref || (c.wifiAt.tag==null ? null : c.wifiAt.tag)!==(tag==null ? null : tag)) continue;
        if (frame.dst===BCAST || frame.dst===c.mac || isV6Mc(frame.dst)) recv.push({dev:c, ref, tag}); }
      return;
    }
    if (tag!=null){ pushNote(`${d.label} received a frame with an 802.1Q tag and ignored it (a normal NIC expects untagged frames)`); return; }
    if (frame.dst===BCAST || frame.dst===d.mac || isV6Mc(frame.dst)) recv.push({dev:d, ref}); else if (frame.kind!=="arp") pushNote(`${d.label} saw a frame for ${frame.dst} and ignored it (not its MAC)`);
  };
  { const fr = from && from.ref ? from.ref : (typeof from==="string" ? from : null), fx = fr && P(B, fr), ftag = from && from.ref ? (from.tag==null ? null : from.tag) : null;
    if (fx && (fx.dev.kind==="wlc" || fx.dev.kind==="ap")) for (const id2 of B.order){ const c = B.devs[id2];
      if (!c.wifiAt || c.on===false || c.mac===frame.src || c.wifiAt.ref!==fr || (c.wifiAt.tag==null ? null : c.wifiAt.tag)!==ftag) continue;
      if (frame.dst===BCAST || frame.dst===c.mac || isV6Mc(frame.dst)){ recv.push({dev:c, ref:fr, tag:ftag}); pushNote(`${fx.dev.label} bridges the frame straight to ${c.label} (both are its Wi-Fi clients on the same VLAN)`); } } }
  if (from && from.svi){ const sw = B.devs[from.svi]; switchIn(sw, null, from.vlan, step0||0); }
  else if (from && from.ref) sendPhys(from.ref, from.tag==null?null:from.tag, step0||0);
  else sendPhys(from, null, step0||0);
  if (storm){
    // a loop with nothing blocking: the broadcast never dies — show it circling and flood the switches' logs
    const loopHops = hops.filter(h=>h.kind==="bcast");
    const maxStep = Math.max(0, ...hops.map(h=>h.step));
    for (let r=1; r<=3; r++) for (const h of loopHops) hops.push(Object.assign({}, h, {step: h.step + r*(maxStep+1)}));
    notes.push(`⚠ <b>Broadcast storm in VLAN ${storm.vlan}</b>: the frame came back to ${storm.sw.label}. With no Spanning Tree port blocking, every switch floods it again — it circles forever, copies multiply, MAC tables flap and the network grinds to a halt.`);
    for (const id of B.order){ const d = B.devs[id]; if (!isSw(d)) continue; const lps = logicalPorts(B, d, S).filter(l=>carries(d, l.lp, storm.vlan) && lpUp(B, l) && !lpFar(B, S, d, l)?.host);
      if (lps.length>=2) syslog(B, d, `%SW_MATM-4-MACFLAP_NOTIF: Host ${frame.src} in vlan ${storm.vlan} is flapping between port ${lps[0].name} and port ${lps[1].name}`); }
    B.stormSeen = (B.stormSeen||0) + 1;
    return {hops, recv: [], notes, storm:true};
  }
  return {hops, recv, notes};
}

/* ---- IP layer ---- */
// a "node" is something that sends IP: {dev, ref?, svi?, ios?, ip, mask, gw, mac, vlan?}
function hostNode(d){
  if (d.wifiAt) return {dev:d, ref:d.wifiAt.ref, tag:d.wifiAt.tag, ip:d.ip, mask:d.mask, gw:d.gw, mac:d.mac, wifi:true};
  if (d.kind==="wlc"){ const B = B_ctx.B, up = B && d.ports.find(p=>cableAt(B, d.id+":"+p.id)), v = d.wlc && d.wlc.mgmt.vlan;
    return {dev:d, ref: d.id+":"+(up || d.ports[0]).id, tag: v ? v : undefined, ip:d.ip, mask:d.mask, gw:d.gw, mac:d.mac}; }
  return {dev:d, ref: d.id+":"+d.ports.find(p=>p.type==="rj45").id, ip:d.ip, mask:d.mask, gw:d.gw, mac:d.mac}; }
function ipOwner(B, ip){
  for (const id of B.order){ const d = B.devs[id];
    if (d.env){ for (const [n,i] of Object.entries(d.env.intfs)) if (i.ip===ip) return {dev:d, ios:n, i}; }
    else if (d.ip===ip) return {dev:d}; }
  return null;
}
function routerNodeFor(r, ios){ const i = r.env.intfs[ios], vrf = i.vrf || null;
  if (i.mode==="svi") return {dev:r, svi:ios, vlan:i.vlan, ios, ip:i.ip, mask:i.mask, mac:i.mac, vrf};
  if (i.sub) return {dev:r, ref:refOfIos(r, i.parent), ios, tag: i.encapNative ? null : i.encap, ip:i.ip, mask:i.mask, mac:i.mac, vrf};
  return {dev:r, ref:refOfIos(r, ios), ios, ip:i.ip, mask:i.mask, mac:i.mac, vrf}; }
function routeLookup(r, dst, vrf){ const x = r.env.lookup ? r.env.lookup(dst, vrf || null) : null; return x ? {ios:x.ios, nh:x.nh} : null; }
const vrfAt = (d, ios) => (d && d.env && ios && d.env.intfs[ios] && d.env.intfs[ios].vrf) || null;
// a router keeps one ARP table per VRF: entries learned in a VRF are keyed "ip%VRF" (hosts and the global table: plain ip)
const arpKey = (vrf, ip) => vrf ? ip + "%" + vrf : ip;
function ifaceUp(d, ios){ return !!d.env.isUp(ios); }
const B_ctx = {B:null};
// IOS answers ARP on a NAT outside interface for its static and pool global addresses in that subnet (so replies can come back)
function natAlias(r, ios, ip){ if (r.kind!=="router" || !r.env.nat) return false; const i = r.env.intfs[ios]; if (!i || !i.ip || !sameNet(i.ip, ip, i.mask)) return false; const N = r.env.nat, n = ipToInt(ip);
  return N.statics.some(x=>x.global===ip) || Object.values(N.pools).some(pl=>n>=pl.start && n<=pl.end); }
// ARP + one IP hop from `node` towards `nh`; returns {ok, toNode (receiving endpoint), arped}
function hop(B, node, nhIp, label, ttl){
  const cache = B.arp[node.dev.id] || (B.arp[node.dev.id] = {});
  let arped = false, out = {frames:[], log:[]};
  const fromSpec = node.svi ? {svi:node.dev.id, vlan:node.vlan} : (node.tag!=null ? {ref:node.ref, tag:node.tag} : node.ref);
  const myKey = arpKey(node.vrf, nhIp);
  let entry = cache[myKey];
  if (!entry){
    arped = true;
    const req = deliver(B, fromSpec, {src:node.mac, dst:BCAST, kind:"arp", label:"ARP?", arpIp:node.ip, arpOp:"req", arpTarget:nhIp}, B.step);
    if (req.storm){ out.frames.push(...req.hops); out.log.push(`<b>ARP request</b> (broadcast) from ${node.dev.label}: "Who has ${nhIp}?"`, ...req.notes.map(n=>"&nbsp;&nbsp;· "+n)); B.step += 1; return Object.assign(out, {ok:false, arped:true, storm:true, arpFail:true}); }
    out.frames.push(...req.hops); out.log.push(`<b>ARP request</b> (broadcast to ${BCAST}) from ${node.dev.label}: "Who has ${nhIp}? Tell ${node.ip}"`, ...req.notes.map(n=>"&nbsp;&nbsp;· "+n));
    B.step += Math.max(1, ...req.hops.map(h=>h.step+1-B.step));
    let owner = req.recv.find(r=>{ if (r.svi) return r.dev.env.intfs[r.svi].ip===nhIp || hsrpOwnsIp(B, r.dev, r.svi, nhIp); if (r.ios) return r.dev.env.intfs[r.ios].ip===nhIp || hsrpOwnsIp(B, r.dev, r.ios, nhIp) || natAlias(r.dev, r.ios, nhIp); return r.dev.ip===nhIp; });
    let viaProxy = false;
    if (!owner){
      // proxy ARP (on by default in IOS): a router answers for an address it can route to out of a DIFFERENT interface
      owner = req.recv.find(r=>{ if (!r.ios) return false; const i = r.dev.env.intfs[r.ios]; if (!i.ip || i.proxyArp===false || sameNet(i.ip, nhIp, i.mask)) return false; const rt = routeLookup(r.dev, nhIp, vrfAt(r.dev, r.ios)); return !!(rt && rt.ios!==r.ios); });
      viaProxy = !!owner;
    }
    if (!owner){ out.log.push(`&nbsp;&nbsp;· No device answered — nothing on this network has ${nhIp} (or it can't be reached at Layer 2)`); return Object.assign(out, {ok:false, arped, arpFail:true}); }
    const vOwn = (owner.svi || owner.ios) && hsrpFor(B, owner.dev, owner.svi || owner.ios).find(v=>v.vip===nhIp);
    const ownerMac = vOwn ? vOwn.vmac : owner.svi ? owner.dev.env.intfs[owner.svi].mac : owner.ios ? owner.dev.env.intfs[owner.ios].mac : owner.dev.mac;
    const ownerFrom = owner.svi ? {svi:owner.dev.id, vlan:owner.vlan} : (owner.tag!=null ? {ref:owner.ref, tag:owner.tag} : owner.ref);   // a router subinterface answers with its 802.1Q tag
    const ownerCache = B.arp[owner.dev.id] || (B.arp[owner.dev.id] = {});
    const ownKey = arpKey(vrfAt(owner.dev, owner.svi || owner.ios), node.ip);
    ownerCache[ownKey] = {mac:node.mac, intf: owner.svi || owner.ios || "eth"};
    const rep = deliver(B, ownerFrom, {src:ownerMac, dst:node.mac, kind:"arp", label:"ARP", arpIp:nhIp, arpOp:"res", arpTarget:node.ip}, B.step);
    if (!rep.recv.some(r=>r.dev===node.dev)){ delete ownerCache[ownKey]; }
    out.frames.push(...rep.hops); out.log.push(viaProxy ? `<b>Proxy ARP reply</b> (unicast) from ${owner.dev.label} ${shortIf(owner.ios)}: "${nhIp} is at ${ownerMac}" — the router answers with ITS OWN MAC because it has a route to ${nhIp} out of another interface` : `<b>ARP reply</b> (unicast) from ${owner.dev.label}: "${nhIp} is at ${ownerMac}"`, ...rep.notes.map(n=>"&nbsp;&nbsp;· "+n));
    if (viaProxy) B.proxied = (B.proxied||0) + 1;
    B.step += Math.max(1, ...rep.hops.map(h=>h.step+1-B.step));
    if (!rep.recv.some(r=>r.dev===node.dev)) return Object.assign(out, {ok:false, arped, arpFail:true});
    entry = cache[myKey] = {mac:ownerMac, intf: node.svi || node.ios || "eth"};
  }
  const f = deliver(B, fromSpec, {src:node.mac, dst:entry.mac, kind:"ip", label, gre:/^GRE\b/.test(label)}, B.step);
  out.frames.push(...f.hops); out.log.push(`<b>${label}</b> ${node.ip} → ${nhIp==="?"?"":""}frame to ${entry.mac} (TTL ${ttl})`, ...f.notes.map(n=>"&nbsp;&nbsp;· "+n));
  B.step += Math.max(1, ...f.hops.map(h=>h.step+1-B.step));
  const rcv = f.recv.find(r=>{ const m = r.svi ? r.dev.env.intfs[r.svi].mac : r.ios ? r.dev.env.intfs[r.ios].mac : r.dev.mac; return m===entry.mac || ((r.svi || r.ios) && hsrpOwnsMac(B, r.dev, r.svi || r.ios, entry.mac)); });
  return Object.assign(out, {ok:!!rcv, to:rcv, arped});
}
// one direction: node → dstIp, hop by hop. returns {ok, kind, arpedFirst, frames, log, finalNode}
const ICMPN = {0:"echo-reply", 3:"unreachable", 8:"echo", 11:"time-exceeded"};
const pktText = (p, dst) => p.proto==="icmp" ? `ICMP ${ICMPN[p.icmp]||""} ${p.src} → ${dst}`.replace("  ", " ") : (p.proto==="tcp"||p.proto==="udp") ? `${p.proto.toUpperCase()} ${p.src}:${p.sport} → ${dst}:${p.dport}` : `${String(p.proto).toUpperCase()} ${p.src} → ${dst}`;
// IOS access-list log lines (%SEC-6-IPACCESSLOG…)
function aclLogLine(name, l, action, p, dst){ const v = action==="permit" ? "permitted" : "denied";
  if (l.kind==="standard") return `%SEC-6-IPACCESSLOGS: list ${name} ${v} ${p.src} 1 packet`;
  if (p.proto==="icmp") return `%SEC-6-IPACCESSLOGDP: list ${name} ${v} icmp ${p.src} -> ${dst} (${p.icmp||0}/${p.icode||0}), 1 packet`;
  if (p.proto==="tcp" || p.proto==="udp") return `%SEC-6-IPACCESSLOGP: list ${name} ${v} ${p.proto} ${p.src}(${p.sport}) -> ${dst}(${p.dport}), 1 packet`;
  const num = {ospf:89, eigrp:88, gre:47, esp:50}[p.proto] || p.proto; return `%SEC-6-IPACCESSLOGNP: list ${name} ${v} ${num} ${p.src} -> ${dst}, 1 packet`; }
// → null (carry on) or res (dropped: kind "prohib", or "timeout" when the router has no ip unreachables)
function aclGate(B, res, dev, ifn, dir, pkt, dst, arrIf){
  const E = dev.env, i = E && E.intfs[ifn], name = i && (dir==="in" ? i.aclIn : i.aclOut); if (!name || !window.ACL) return null;
  const r = window.ACL.check(E.acl, name, {src:pkt.src, dst, proto:pkt.proto, sport:pkt.sport, dport:pkt.dport, icmp:pkt.icmp, icode:pkt.icode, ack:pkt.ack}, B._probe ? false : undefined);
  if (r.missing) return null;   // an ACL that doesn't exist permits everything
  const L = E.acl.lists[name];
  if (r.entry && !B._probe){ (res.aclHits = res.aclHits || []).push(r.entry); if (r.entry.log) syslog(B, dev, aclLogLine(name, L, r.entry.action, pkt, dst), true); }
  const lineTxt = r.entry ? `line ${r.entry.seq} (${window.ACL.entryText(L, r.entry, false)})` : "";
  if (r.permit){ res.log.push(`&nbsp;&nbsp;· ACL <b>${name}</b> ${dir} on ${dev.label} ${shortIf(ifn)}: ${pktText(pkt, dst)} matches ${lineTxt} → permitted`); return null; }
  const ai = E.intfs[arrIf || ifn], from = ai && ai.ip, bcastNo = dst==="255.255.255.255" || pkt.src==="0.0.0.0", quiet = (ai && ai.noUnreach) || bcastNo;
  res.kind = quiet ? "timeout" : "prohib"; res.unreachFrom = from; res.prohibBy = dev;
  if (!quiet && from && dir==="in") res.path.push(from), res.srcAt.push(pkt.src), res.portAt.push(pkt.sport), (res.ownAt||[]).push({dev, ios: arrIf || ifn});   // (an outbound deny: the router is already the last hop)
  res.log.push(`<b>ACL ${name} ${dir}</b> on ${dev.label} ${shortIf(ifn)} denies ${pktText(pkt, dst)} — ${r.implicit ? "no line matched, so the implicit <b>deny any</b> at the end drops it" : lineTxt + " drops it"}; ${quiet ? (bcastNo ? "IOS never sends an ICMP error about a broadcast or a packet from 0.0.0.0, so the sender hears nothing" : "<b>no ip unreachables</b> on that interface, so the sender hears nothing") : "the router sends ICMP Destination Unreachable (type 3, code 13 'administratively prohibited') back from " + from}`);
  return res;
}
const natPort = (p, x) => p && p.proto!=null && x!=null ? ":" + x : "";
function sendIp(B, node, dstIp, label, pkt0){
  const res = {frames:[], log:[], ok:false, kind:"timeout", path:[], srcAt:[], portAt:[], ownAt:[], dst:dstIp, greDepth: node.greDepth || 0};
  const pkt = pkt0 ? Object.assign({}, pkt0) : null; res.pkt = pkt;
  const seen = (x, own) => { res.path.push(x); res.srcAt.push(pkt ? pkt.src : null); res.portAt.push(pkt ? pkt.sport : null); res.ownAt.push(own || null); };
  const sameVrf = (d, nm, v) => ((d.env.intfs[nm] && d.env.intfs[nm].vrf) || null)===(v || null);
  let cur = node, ttl = node.dev && node.dev.env ? 255 : 128;
  for (let n=0; n<300; n++){   // a loop ends when the TTL runs out (Time Exceeded), not after a fixed number of hops
    let nh;
    if (isRouterDev(cur.dev) && (cur.dev.kind==="router" || !cur.svi || cur.dev.env.ipRouting)){
      const vrf = cur.inIf ? vrfAt(cur.dev, cur.inIf) : (cur.vrf || null);   // the packet is routed in the table of the VRF it arrived in
      // a router: own address (in this VRF)?
      for (const [nm,i] of Object.entries(cur.dev.env.intfs)) if ((i.ip===dstIp || hsrpOwnsIp(B, cur.dev, nm, dstIp)) && !i.shut && sameVrf(cur.dev, nm, vrf)){ res.ok = true; res.final = {dev:cur.dev, ios:nm}; if (n>0) seen(dstIp, {dev:cur.dev, ios:nm}); return res; }
      const r = routeLookup(cur.dev, dstIp, vrf);
      if (!r){ if (n===0){ res.kind = "noroute"; res.log.push(`${cur.dev.label} has no route to ${dstIp}${vrf ? " in VRF " + vrf : ""}`); return res; }
        res.kind = "netunreach"; res.unreachFrom = cur.inIp; res.log.push(`${cur.dev.label} has no route to ${dstIp}${vrf ? " in VRF <b>" + vrf + "</b> (the routing table of the interface it arrived on)" : ""} (no connected, static or default route) — it drops the packet and sends an ICMP <b>Destination Unreachable</b> (type 3, code 1 "host unreachable" — what Cisco routers send when they have no route) back to the sender from ${cur.inIp}`); return res; }
      if (pkt && cur.inIf && cur.dev.kind==="router" && window.NAT){ const E = cur.dev.env, ii = E.intfs[cur.inIf], oi = E.intfs[r.ios];
        if (ii && ii.natIn && oi && oi.natOut){
          const t = window.NAT.outbound(E.nat, {src:pkt.src, dst:dstIp, proto:pkt.proto, sport:pkt.sport, dport:pkt.dport}, {acl:E.acl, ACL:window.ACL, ifAddr: n => (E.intfs[n]||{}).ip || null, noCount:true});
          if (t.drop) (res.natDrops = res.natDrops || new Set()).add(cur.dev);
          for (const m of (t.logs||[])) syslog(B, cur.dev, m, true);
          if (t.drop){ res.kind = "timeout"; res.log.push(`<b>NAT</b> on ${cur.dev.label}: ${pkt.src} is covered by the NAT rule but can't be translated (${t.drop==="pool-exhausted" ? "the NAT pool has no free address" : t.drop}) — the packet is dropped`); return res; }
          if (t.untranslated) res.log.push(`<b>NAT</b> on ${cur.dev.label}: ${pkt.src} isn't matched by any NAT rule's access list — it leaves untranslated, with a private source address nobody on the internet can reply to`);
          else res.log.push(`<b>NAT</b> on ${cur.dev.label} (${shortIf(cur.inIf)} inside → ${shortIf(r.ios)} outside): source ${pkt.src}${natPort(pkt, pkt.sport)} → ${t.pkt.src}${natPort(pkt, t.pkt.sport)} (inside local → inside global)`);
          if (!t.untranslated) (res.natDevs = res.natDevs || new Set()).add(cur.dev); pkt.src = t.pkt.src; pkt.sport = t.pkt.sport; } }
      if (pkt && cur.inIf){ const g = aclGate(B, res, cur.dev, r.ios, "out", pkt, dstIp, cur.inIf); if (g) return g; }
      // a GRE tunnel: wrap the packet in a new IP header (protocol 47) and send THAT across the underlay to the tunnel destination
      const oif = cur.dev.env.intfs[r.ios];
      if (oif && oif.tun){ const g = greCarry(B, res, cur.dev, r.ios, pkt, dstIp, label);
        if (!g){ res.kind = "timeout"; return res; }
        const F = g.dev, T = g.ios, ti = F.env.intfs[T];
        if (pkt){ const ga = aclGate(B, res, F, T, "in", pkt, dstIp); if (ga) return ga; }
        const own = Object.entries(F.env.intfs).find(([nm,i])=>i.ip===dstIp && !i.shut && sameVrf(F, nm, ti.vrf || null));
        if (own){ res.ok = true; res.final = {dev:F, ios:own[0]}; seen(dstIp, {dev:F, ios:own[0]}); res.log.push(`${F.label} received it on ${T} — it's addressed to the router itself`); return res; }
        cur = {dev:F, inIp: ti.ip, inIf: T}; seen(ti.ip, {dev:F, ios:T}); ttl--; res.routers = (res.routers||0)+1;
        if (ttl<=0){ res.kind = "ttlexpired"; res.unreachFrom = cur.inIp; res.log.push(`${F.label} decremented the TTL to 0 — it drops the packet and sends ICMP <b>Time Exceeded</b> back to the sender.`); return res; }
        res.log.push(`${F.label} received it on ${T}, decrements TTL to ${ttl} and routes it${ti.vrf ? " in VRF " + ti.vrf : ""} — the whole tunnel counted as ONE hop`); continue; }
      cur = routerNodeFor(cur.dev, r.ios); nh = r.nh;
    } else {
      if (cur.ip===dstIp){ res.ok = true; res.final = cur; return res; }
      if (sameNet(cur.ip, dstIp, cur.mask)) nh = dstIp;
      else if (cur.gw && sameNet(cur.ip, cur.gw, cur.mask)) nh = cur.gw;
      else if (cur.svi && !cur.gw) nh = dstIp;   // an IOS switch with no default gateway ARPs for every destination (works only if a router answers with proxy ARP)
      else { res.kind = n===0 ? "general" : "timeout"; res.log.push(`${cur.dev.label} has no default gateway for ${dstIp}`); return res; }
    }
    const h = hop(B, cur, nh, label, ttl);
    if (n < 12){ res.frames.push(...h.frames); res.log.push(...h.log); } else if (n===12) res.log.push("&nbsp;&nbsp;· … the same hops repeat: the packet keeps circling between these routers, losing 1 TTL per router …");
    if (n===0) res.arpedFirst = h.arped;
    if (!h.ok){ res.kind = n===0 && h.arpFail ? "unreach" : "timeout";
      if (n===0 && !h.arpFail) res.log.push(`&nbsp;&nbsp;· ${cur.dev.label} already knew the MAC for ${nh} (ARP worked), so it just sent the frame — nothing answered, so it reports a timeout, not "Destination host unreachable"`);
      return res; }
    const to = h.to;
    if (to.svi && pkt && isRouterDev(to.dev)){ const g = aclGate(B, res, to.dev, to.svi, "in", pkt, dstIp); if (g) return g; }
    if (to.svi){ if (to.dev.env.intfs[to.svi].ip===dstIp || hsrpOwnsIp(B, to.dev, to.svi, dstIp)){ res.ok=true; res.final={dev:to.dev, svi:to.svi, vlan:+to.svi.slice(4)}; seen(dstIp, {dev:to.dev, ios:to.svi}); return res; }
      if (isRouterDev(to.dev)){ cur = {dev:to.dev, inIp: to.dev.env.intfs[to.svi].ip, inIf: to.svi}; seen(to.dev.env.intfs[to.svi].ip, {dev:to.dev, ios:to.svi}); ttl--; res.routers = (res.routers||0)+1; if (ttl<=0){ res.kind = "ttlexpired"; res.unreachFrom = cur.inIp; res.log.push(`${to.dev.label} decremented the TTL to 0 — it drops the packet and sends ICMP <b>Time Exceeded</b> ("TTL expired in transit") back to the sender. A packet that circles like this is a <b>routing loop</b>.`); return res; } res.log.push(`${to.dev.label} (Layer 3 switch) received it on ${to.svi}, decrements TTL to ${ttl} and routes it between VLANs`); continue; }
      res.log.push(`${to.dev.label} isn't routing (no ip routing) — dropped`); return res; }
    if (to.ios && isRouterDev(to.dev)){
      if (pkt){ const g = aclGate(B, res, to.dev, to.ios, "in", pkt, dstIp); if (g) return g; }
      if (pkt && to.dev.kind==="router" && window.NAT && to.dev.env.intfs[to.ios].natOut){
        const t = window.NAT.inbound(to.dev.env.nat, {src:pkt.src, dst:dstIp, proto:pkt.proto, sport:pkt.sport, dport:pkt.dport, err:pkt.err}, to.dev.env.natCtx ? to.dev.env.natCtx() : null);
        if (t){ if (res.preNat==null) res.preNat = dstIp; (res.natDevs = res.natDevs || new Set()).add(to.dev); res.log.push(`<b>NAT</b> on ${to.dev.label} (arriving on outside ${shortIf(to.ios)}): destination ${dstIp}${natPort(pkt, pkt.dport)} → ${t.pkt.dst}${natPort(pkt, t.pkt.dport)} (inside global → inside local)`); dstIp = t.pkt.dst; pkt.dport = t.pkt.dport; } }
      const iv = vrfAt(to.dev, to.ios);
      const own = Object.entries(to.dev.env.intfs).find(([nm,i])=>(i.ip===dstIp || hsrpOwnsIp(B, to.dev, nm, dstIp)) && !i.shut && sameVrf(to.dev, nm, iv));
      if (own){ res.ok = true; res.final = {dev:to.dev, ios:own[0]}; seen(dstIp, {dev:to.dev, ios:own[0]}); res.log.push(`${to.dev.label} received it on ${shortIf(to.ios)} — it's addressed to the router itself`); return res; }
      cur = {dev:to.dev, inIp: to.dev.env.intfs[to.ios].ip, inIf: to.ios}; seen(to.dev.env.intfs[to.ios].ip, {dev:to.dev, ios:to.ios}); ttl--; res.routers = (res.routers||0)+1; if (ttl<=0){ res.kind = "ttlexpired"; res.unreachFrom = cur.inIp; res.log.push(`${to.dev.label} decremented the TTL to 0 — it drops the packet and sends ICMP <b>Time Exceeded</b> ("TTL expired in transit") back to the sender. A packet that circles like this is a <b>routing loop</b>.`); return res; } res.log.push(`${to.dev.label} received it on ${shortIf(to.ios)}, decrements TTL to ${ttl} and routes it${iv ? " — in VRF <b>" + iv + "</b>'s routing table (the VRF of " + shortIf(to.ios) + ")" : ""}`); continue; }
    if (to.dev.ip===dstIp){ res.ok = true; res.final = hostNode(to.dev); seen(dstIp, {dev:to.dev}); res.dst = dstIp; return res; }
    return res;
  }
  return res;
}
// GRE: router R sends the packet out tunnel T — the outer packet (tunnel source → tunnel destination, protocol 47) crosses the
// underlay like any other packet (routes, ARP, ACLs see protocol 47); the far router unwraps it only if one of ITS tunnels has the
// mirror-image source/destination. Returns {dev, ios} of the far tunnel, or null (the inner packet is lost — the sender times out).
function greFar(B, ti, outerDev, outerIos){ const F = outerDev; if (!F || !F.env || !F.env.tunInfo) return null; const uv = vrfAt(F, outerIos);
  const t = F.env.tunInfo().find(x=>x.srcIp===ti.dst && x.dst===ti.srcIp && (x.uvrf||null)===uv && x.up); return t ? {dev:F, ios:t.ios} : null; }
function greCarry(B, res, R, T, pkt, dstIp, label){
  const ti = R.env.tunInfo().find(x=>x.ios===T);
  if (!ti || !ti.up){ res.log.push(`${R.label} ${T} is down — the packet is dropped`); return null; }
  if ((res.greDepth||0) >= 3){ res.log.push(`${R.label}: tunnel inside a tunnel inside a tunnel — the lab stops here`); return null; }
  if (!B._probe) B._greLast = (B._greLast||0) + 1;
  res.log.push(`<b>GRE encapsulation</b> on ${R.label} ${T}: the original packet ${pkt ? pkt.src + " → " : ""}${dstIp} goes inside a NEW IP header <b>${ti.srcIp} → ${ti.dst}, protocol 47 (GRE)</b> — +24 bytes (20 outer IP + 4 GRE). The routers in between see only the outer header.`);
  const outer = sendIp(B, {dev:R, ip:ti.srcIp, vrf:ti.uvrf, greDepth:(res.greDepth||0)+1}, ti.dst, `GRE ${ti.srcIp} → ${ti.dst} (protocol 47) carrying ${label}`, {src:ti.srcIp, proto:"gre", sport:0, dport:0});
  res.frames.push(...outer.frames); res.log.push(...outer.log.map(l=>/^<b>GRE /.test(l) ? "&nbsp;&nbsp;" + l : l));
  if (outer.aclHits) (res.aclHits = res.aclHits || []).push(...outer.aclHits);
  if (!outer.ok){ res.log.push(`The outer GRE packet ${ti.srcIp} → ${ti.dst} never reached the tunnel's far end (${outer.kind==="prohib" ? "an access list dropped protocol 47" : "no path across the underlay"}) — the original packet is lost with it`); return null; }
  const far = greFar(B, ti, outer.final.dev, outer.final.ios);
  if (!far){ res.log.push(`${outer.final.dev.label} received the GRE packet for ${ti.dst} but has no tunnel with source ${ti.dst} and destination ${ti.srcIp} that is up — it can't unwrap it and drops it (IOS answers the tunnel source with ICMP protocol unreachable; the original sender just times out)`); return null; }
  res.log.push(`<b>GRE decapsulation</b> on ${far.dev.label}: the outer header ${ti.srcIp} → ${ti.dst} matches ${far.ios} (its source ${ti.dst}, destination ${ti.srcIp}) — the outer header is removed and the original packet arrives on ${far.ios}`);
  res.greHops = (res.greHops||0) + 1; return far; }
function nodeFromFinal(B, f){
  if (f.svi) return sviNode(f.dev, f.svi);
  if (f.ios) return {dev:f.dev, vrf:vrfAt(f.dev, f.ios)};
  return hostNode(f.dev);
}
function sviNode(sw, name){ const i = sw.env.intfs[name]; return {dev:sw, svi:name, vlan:+name.slice(4), ip:i.ip, mask:i.mask, gw:sw.env.defaultGw, mac:i.mac, vrf:i.vrf||null}; }
// full ping: request + reply. returns {ok, kind, firstMiss}
function ping(B, node, dstIp){
  B_ctx.B = B; B.step = 0; computeL3(B);
  if (isRouterDev(node.dev) && !node.ip && !node.svi){ const r = routeLookup(node.dev, dstIp, node.vrf); if (r) node = {dev:node.dev, ip:node.dev.env.intfs[r.ios].ip, vrf:node.vrf||null}; }
  const id = node.dev.env ? 0 : 1, go = sendIp(B, node, dstIp, "ICMP echo request", {src:node.ip, proto:"icmp", icmp:8, icode:0, sport:id, dport:id});
  let frames = go.frames, log = go.log.slice(), ok = false, kind = go.kind;
  if (go.ok){
    const rq = go.pkt, back = sendIp(B, nodeFromFinal(B, go.final), rq.src, "ICMP echo reply", {src:go.dst || dstIp, proto:"icmp", icmp:0, icode:0, sport:rq.sport, dport:rq.sport});
    frames = frames.concat(back.frames); log = log.concat(back.log);
    ok = back.ok && !!back.final && back.final.dev===node.dev; if (!ok){ kind = "timeout"; log.push(`The reply couldn't get back to ${node.ip} — check the far end's default gateway and the return path`); }
    var replyTtl = (go.final.dev.env ? 255 : 128) - (back.routers||0);
    var natBack = back.natDevs; var backHits = back.aclHits;
  }
  // a Windows ping sends 4 echoes and an IOS ping 5: the extra packets are NAT hits
  { const n = node.dev.env ? 5 : 4; for (const r of new Set([...(go.natDevs||[]), ...(natBack||[])])) if (r.env && r.env.nat) r.env.nat.hits += (n-1) * (ok ? 2 : 1);
    for (const e of [...(go.aclHits||[]), ...((typeof backHits!=="undefined" && backHits) || [])]) e.hits += n-1;   // each echo is matched again
    for (const r of (go.natDrops||[])) if (r.env && r.env.nat){ r.env.nat.misses += n-1; for (const pl of Object.values(r.env.nat.pools)) if (pl.misses) pl.misses += n-1; } }
  B.frames = frames; B.log = log;
  if (kind==="prohib") log.push("The ping is answered with <b>Destination Unreachable — administratively prohibited</b>: an access list dropped it, not a missing route.");
  return {ok, kind, ttl: replyTtl, unreachFrom: go.unreachFrom, firstMiss: go.arpedFirst && node.dev.kind!=="pc" && node.dev.kind!=="server" && node.dev.kind!=="laptop"};
}


/* ---- Layer 3 control plane: OSPF (neighbours, DR/BDR, SPF per area, inter-area, default) and HSRP, from the real topology ---- */
const ipInt = ip => ip.split(".").reduce((a,o)=>a*256 + +o, 0);
const netStr = (ip, len) => { const v = len ? Math.floor(ipInt(ip) / 2**(32-len)) * 2**(32-len) : 0; return [24,16,8,0].map(k=>Math.floor(v/2**k)%256).join("."); };
const routersOf = B => B.order.map(id=>B.devs[id]).filter(d=>d.env && d.on!==false && (d.kind==="router" || (isSw(d) && d.env.ipRouting)));
// router interfaces that receive a broadcast sent out of d's interface (same Layer 2 domain: cables, switches, VLANs, trunks, STP)
// a silent trial run (keepalive, hello over a tunnel): no frames, no log, no ACL counters
function probe(B, fn){ const keep = [B.frames, B.log, B.step]; B._probe = (B._probe||0) + 1; try { return fn(); } finally { B._probe--; [B.frames, B.log, B.step] = keep; } }
function greOuter(B, d, ti, label){ return sendIp(B, {dev:d, ip:ti.srcIp, vrf:ti.uvrf}, ti.dst, label, {src:ti.srcIp, proto:"gre", sport:0, dport:0}); }
function greHear(B, d, ios){ const ti = d.env.tunInfo().find(x=>x.ios===ios); if (!ti || !ti.up || !ti.ip) return [];
  return probe(B, ()=>{ const o = greOuter(B, d, ti, "GRE · hello"); if (!o.ok || !o.final) return []; const far = greFar(B, ti, o.final.dev, o.final.ios); return far ? [far] : []; }); }
// GRE keepalive: the far end must unwrap our packet (a tunnel with the mirror-image source/destination) and route the reply back
function greKeepalive(B, d, ti){ return probe(B, ()=>{ const o = greOuter(B, d, ti, "GRE keepalive"); if (!o.ok || !o.final) return false; const F = o.final.dev;
  const t = F.env && F.env.tunInfo && F.env.tunInfo().find(x=>x.srcIp===ti.dst && x.dst===ti.srcIp && !x.shut && (x.uvrf||null)===vrfAt(F, o.final.ios)); if (!t) return false;
  const back = sendIp(B, {dev:F, ip:ti.dst, vrf:t.uvrf}, ti.srcIp, "GRE keepalive reply", {src:ti.dst, proto:"gre", sport:0, dport:0}); return !!(back.ok && back.final && back.final.dev===d); }); }
const tunRouters = B => B.order.map(id=>B.devs[id]).filter(d=>d.env && d.on!==false && d.env.tunInfo && Object.values(d.env.intfs).some(i=>i.tun));
// after OSPF: keepalives, and recursive routing (the best route to the tunnel destination points out of the tunnel itself)
function tunnelChecks(B){ let changed = false;
  for (const d of tunRouters(B)){ const E = d.env; E.tunKa = E.tunKa || {}; E.tunRec = E.tunRec || {};
    for (const ti of E.tunInfo()){
      if (ti.ka && (!ti.why || ti.why==="keepalive")){ const ok = greKeepalive(B, d, ti); if (E.tunKa[ti.ios]!==ok){ E.tunKa[ti.ios] = ok; changed = true; } }
      else if (E.tunKa[ti.ios]!=null && !ti.ka){ delete E.tunKa[ti.ios]; changed = true; }
      if (ti.up && !E.tunRec[ti.ios]){ const x = E.lookup(ti.dst, ti.uvrf); if (x && x.ios===ti.ios){ E.tunRec[ti.ios] = true; changed = true;
        // logged now (before OSPF notices the neighbour is gone), and shown on the console after the command that caused it
        const st = /^[*.]/.test(E.clockText()) ? "*" : "", lines = [`%TUN-5-RECURDOWN: ${ti.ios} temporarily disabled due to recursive routing`];
        if ((E.tunWas||{})[ti.ios]) lines.push(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${ti.ios}, changed state to down`);
        E.tunWas = Object.assign({}, E.tunWas, {[ti.ios]: false});
        for (const m of lines){ const e = syslog(B, d, m, true); E.tunMsgs = (E.tunMsgs||[]).concat([st + e.t + ": " + m]); } } } } }
  return changed; }
// tunnel line-protocol changes, logged in the order they happen (before OSPF reacts); the console of the router shows them after the command
function tunDiff(B){ for (const d of tunRouters(B)){ const E = d.env; E.tunWas = E.tunWas || {};
  for (const n of Object.keys(E.intfs).filter(x=>E.intfs[x].tun)){ const u = E.isUp(n), w = E.tunWas[n]; if (w===undefined){ E.tunWas[n] = u; continue; } if (u===w) continue; E.tunWas[n] = u;
    if (E.intfs[n].shut) continue; const m = `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to ${u ? "up" : "down"}`, e = syslog(B, d, m, true);
    E.tunMsgs = (E.tunMsgs||[]).concat([(/^[*.]/.test(E.clockText()) ? "*" : "") + e.t + ": " + m]); } } }
// a configuration or cabling change anywhere re-arms recursively-disabled tunnels (real IOS retries by itself and flaps while the fault lasts)
function tunBase(B){ const base = JSON.stringify([B.order.map(id=>{ const d = B.devs[id]; return d.env ? [id, d.on!==false, d.env.exportConfig()] : [id, d.on!==false, d.ip, d.mask]; }), B.cables.map(c=>[c.a, c.b, c.type])]);
  if (B._tunBase!==base){ B._tunBase = base; for (const d of tunRouters(B)) d.env.tunRec = {}; } }
function l3Hear(B, d, ios){
  const i = d.env.intfs[ios]; if (i && i.tun) return greHear(B, d, ios);
  if (!i || i.loop || !i.mac) return [];
  const node = routerNodeFor(d, ios); if (!node.svi && !node.ref) return [];
  const from = node.svi ? {svi:d.id, vlan:node.vlan} : (node.tag!=null ? {ref:node.ref, tag:node.tag} : node.ref);
  const r = deliver(B, from, {src:i.mac, dst:BCAST, kind:"ctl", label:"hello"}, 0);
  return (r.recv||[]).filter(x=>x.dev!==d && x.dev.env).map(x=>({dev:x.dev, ios: x.svi || x.ios}));
}
function markPing(B, key, ok){ B.pinged[key] = ok; (B.pingSig = B.pingSig || {})[key] = l3Sig(B); }
function l3Sig(B){
  return JSON.stringify([B.order.map(id=>{ const d = B.devs[id]; return d.env ? [id, d.on!==false, d.env.exportConfig(), d.env.liveSig ? d.env.liveSig() : "", d.env.ospfResets||0, Object.keys(d.env.intfs).map(n=>d.env.isUp(n)?1:0).join("")] : [id, d.on!==false, d.ip, d.mask, d.ip6, !!d.dhcp, !!d.released, d.wlc ? JSON.stringify([d.wlc.mgmt, d.wlc.ifaces, d.wlc.wlans]) : "", d.wifi ? JSON.stringify(d.wifi) : "", d.apMode||"", d.primary||"", d._wifiKey||""]; }),
    B.cables.map(c=>[c.a, c.b, c.type])]);
}
function computeL3(B){
  if (B._l3busy) return B._l3 || {ospf:{}, hsrp:{}};
  const hasTun = tunRouters(B).length > 0;
  let sig; if (hasTun){ B._l3busy = true; try { tunBase(B); sig = l3Sig(B); } finally { B._l3busy = false; } } else sig = l3Sig(B);   // a tunnel's state reads the routing table: nested lookups use the last result
  if (B._l3 && B._l3.sig===sig) return B._l3;
  B._l3busy = true; const keepStorm = B.stormSeen;
  try { let res, prevRt = null;
    // tunnels make routing and interface state depend on each other: repeat until nothing moves (tunnel up → OSPF over it → routes → tunnel state …)
    for (let pass = 0; pass < 6; pass++){ if (hasTun) tunDiff(B); const hears = new Map(); const hs = computeHsrp(B, hears); /* HSRP first: its 10 s hold time expires before OSPF's 40 s dead timer, so its log lines come first */ res = {sig, ospf: computeOspf(B, hears), hsrp: hs}; B._l3 = res;
      if (!hasTun) break;
      const changed = tunnelChecks(B), sig2 = l3Sig(B), rt = JSON.stringify(Object.entries(res.ospf).map(([k, v])=>[k, v.routes, v.nbrs.map(x=>x.rid+x.ios)]));
      if (!changed && sig2===sig && rt===prevRt) break; sig = sig2; res.sig = sig; prevRt = rt; }
    if (hasTun) tunDiff(B);
    res.ra = computeRa(B); autoDhcp(B); try { computeWifi(B); } catch(e){ console.log("wifi", e); } autoDhcp(B); try { linkLogs(B); } catch(e){} return res; }
  finally { B._l3busy = false; B.stormSeen = keepStorm; }
}
// a hello is heard only if the receiving interface's inbound ACL lets it in (a forgotten "permit ospf" kills the adjacency)
function helloAcl(B, set, pkt, dst){ if (!window.ACL) return set; const out = new Set();
  for (const k of set){ const [id, ios] = k.split("|"), d = B.devs[id], i = d && d.env && d.env.intfs[ios];
    if (i && i.aclIn && d.env.acl.lists[i.aclIn] && !window.ACL.check(d.env.acl, i.aclIn, Object.assign({dst}, pkt), false).permit) continue; out.add(k); }
  return out; }
function computeOspf(B, hears){
  const key = (d, ios) => d.id+"|"+ios, info = {}, out = {};
  const pdev = {};   // a VRF process is a separate OSPF router on the same box: key d.id for the global process, d.id#VRF for a VRF one
  for (const d of routersOf(B)) for (const x of (d.env.ospfInfoAll ? d.env.ospfInfoAll() : [d.env.ospfInfo()])) if (x && x.rid){ const pk = x.vrf ? d.id+"#"+x.vrf : d.id; info[pk] = x; pdev[pk] = d; }
  const ifs = []; for (const id in info) for (const f of info[id].ifaces) if (f.up) ifs.push({d:pdev[id], p:id, f, x:info[id], k:key(pdev[id], f.ios)});
  const byKey = new Map(ifs.map(e=>[e.k, e]));
  const heard0 = e => { if (!hears.has(e.k)) hears.set(e.k, new Set(l3Hear(B, e.d, e.f.ios).map(h=>key(h.dev, h.ios)))); return hears.get(e.k); };
  const heard = e => helloAcl(B, heard0(e), {src:e.f.ip, proto:"ospf"}, "224.0.0.5");
  // neighbours: both ends hear each other's hellos and every hello check passes
  const nbrOf = new Map(ifs.map(e=>[e.k, []]));
  for (const e of ifs){ if (e.f.passive || e.f.loop) continue;
    for (const k2 of heard(e)){ const e2 = byKey.get(k2); if (!e2 || e2.f.passive || e2.f.loop || !heard(e2).has(e.k)) continue;
      if (e2.f.area!==e.f.area){ syslog(B, e.d, e2.f.area===0 && e.f.area!==0 ? `%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID, from backbone area must be virtual-link but not found from ${e2.f.ip}, ${e.f.ios}` : `%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID from ${e2.f.ip}, ${e.f.ios}`); continue; }
      if (e2.x.rid===e.x.rid){ syslog(B, e.d, `%OSPF-4-DUP_RTRID_NBR: OSPF detected duplicate router-id ${e.x.rid} from ${e2.f.ip} on interface ${e.f.ios}`); continue; }
      if (netStr(e.f.ip, e.f.len)!==netStr(e2.f.ip, e.f.len) || (e.f.len!==e2.f.len && !(e.f.net==="POINT_TO_POINT" && e2.f.net==="POINT_TO_POINT"))) continue;   // different subnet or mask: hellos ignored
      if (e.f.hello!==e2.f.hello || e.f.dead!==e2.f.dead) continue;                                                                                            // timer mismatch: hellos ignored
      nbrOf.get(e.k).push(e2); } }
  // segments = groups of neighbouring interfaces; DR/BDR election (non-preemptive: a sitting DR keeps the job)
  B._ospfSeg = B._ospfSeg || {}; const segOf = new Map(), segs = [];
  for (const e of ifs){ if (segOf.has(e.k)) continue; const mem = [], q = [e]; segOf.set(e.k, null);
    while (q.length){ const m = q.shift(); mem.push(m); for (const n of nbrOf.get(m.k)) if (!segOf.has(n.k)){ segOf.set(n.k, null); q.push(n); } }
    const sg = {id: netStr(e.f.ip, e.f.len)+"/"+e.f.len+"@"+mem.map(m=>m.k).sort()[0], mem, area:e.f.area, p2p: mem.every(m=>m.f.net==="POINT_TO_POINT"), mixed: mem.some(m=>m.f.net==="POINT_TO_POINT") && !mem.every(m=>m.f.net==="POINT_TO_POINT"), net: netStr(e.f.ip, e.f.len), len: e.f.len};
    mem.forEach(m=>segOf.set(m.k, sg)); segs.push(sg); }
  const rank = (a,b) => b.f.prio - a.f.prio || ipInt(b.x.rid) - ipInt(a.x.rid);
  for (const sg of segs){ if (sg.p2p || sg.mem.some(m=>m.f.loop || m.f.passive) && sg.mem.length===1){ sg.dr = sg.bdr = null; if (!sg.p2p && !sg.mem[0].f.loop){ sg.dr = sg.mem[0].k; } continue; }
    const sk = sg.mem.map(m=>m.k).sort().join(","), prevs = Object.values(B._ospfSeg).filter(v=>v.members && v.members.some(k=>sg.mem.some(m=>m.k===k)));
    const resetsOf = Object.assign({}, ...prevs.map(v=>v.resets||{}));
    const elig = sg.mem.filter(m=>m.f.prio>0 && m.f.net!=="POINT_TO_POINT"), valid = k => k && elig.some(m=>m.k===k) && resetsOf[k]===byKey.get(k).x.resets;
    const ranked = ks => [...new Set(ks)].filter(valid).map(k=>byKey.get(k)).sort(rank).map(m=>m.k);
    const oldDrs = ranked(prevs.map(v=>v.dr));
    let dr = oldDrs[0] || null, bdr = ranked([...prevs.map(v=>v.bdr), ...oldDrs.slice(1)]).filter(k=>k!==dr)[0] || null;
    if (!dr && bdr){ dr = bdr; bdr = null; }
    if (!dr){ const c = elig.slice().sort(rank)[0]; dr = c ? c.k : null; }
    if (!bdr){ const c = elig.filter(m=>m.k!==dr).sort(rank)[0]; bdr = c ? c.k : null; }
    sg.dr = dr; sg.bdr = bdr;
    for (const k of Object.keys(B._ospfSeg)) if ((B._ospfSeg[k].members||[]).some(x=>sg.mem.some(m=>m.k===x))) delete B._ospfSeg[k];
    B._ospfSeg[sk] = {members: sg.mem.map(m=>m.k), dr, bdr, resets: Object.fromEntries(sg.mem.map(m=>[m.k, m.x.resets]))}; }
  // neighbour states and adjacency logging
  const prevAdj = B._ospfAdj || {}, nowAdj = {};
  const roleOf = (sg, k) => sg.p2p ? "-" : k===sg.dr ? "DR" : k===sg.bdr ? "BDR" : "DROTHER";
  for (const id in info) out[id] = {nbrs:[], ifs:{}, routes:[], abr:false, lsdb:{areas:{}, ext:[]}, spfRuns:3};
  for (const e of ifs){ const sg = segOf.get(e.k); const me = roleOf(sg, e.k); const nb = [];
    const meP2p = sg.p2p || (sg.mixed && e.f.net==="POINT_TO_POINT");
    for (const n of nbrOf.get(e.k)){ const them = roleOf(sg, n.k); const full = meP2p || sg.mixed || me==="DR" || me==="BDR" || them==="DR" || them==="BDR";
      const state = meP2p ? "FULL/  -" : `${full?"FULL":"2WAY"}/${them}`; nb.push({rid:n.x.rid, prio: meP2p ? 0 : n.f.prio, state, dead:e.f.dead, ip:n.f.ip, ios:e.f.ios, full});
      if (full) nowAdj[e.k+"|"+n.x.rid] = {d:e.d, p:e.p, ios:e.f.ios, rid:n.x.rid, pid:e.x.pid}; }
    const dre = sg.dr && byKey.get(sg.dr), bdre = sg.bdr && byKey.get(sg.bdr);
    out[e.p].ifs[e.f.ios] = {state: e.f.loop && e.f.net==="LOOPBACK" ? "LOOP" : meP2p ? "P2P" : (sg.dr ? me : "DROTHER"), dr: dre ? {rid:dre.x.rid, ip:dre.f.ip} : null, bdr: bdre ? {rid:bdre.x.rid, ip:bdre.f.ip} : null, nbrs:nb, adj: nb.filter(x=>x.full).length};
    out[e.p].nbrs.push(...nb); }
  for (const [k, a] of Object.entries(nowAdj)) if (!prevAdj[k]) syslog(B, a.d, `%OSPF-5-ADJCHG: Process ${a.pid}, Nbr ${a.rid} on ${a.ios} from LOADING to FULL, Loading Done`, true);
  for (const [k, a] of Object.entries(prevAdj)) if (!nowAdj[k] && B.devs[a.d.id]) syslog(B, B.devs[a.d.id], `%OSPF-5-ADJCHG: Process ${a.pid}, Nbr ${a.rid} on ${a.ios} from FULL to DOWN, Neighbor Down: ${(()=>{ const me = byKey.get(a.d.id+"|"+a.ios); return me && !me.f.passive ? "Dead timer expired" : "Interface down or detached"; })()}`, true);
  B._ospfResetSeen = B._ospfResetSeen || {};
  for (const id in info){ const was = B._ospfResetSeen[id]; if (was!=null && was!==info[id].resets)
    for (const [k, a] of Object.entries(nowAdj)) if ((a.p||a.d.id)===id && prevAdj[k]){ syslog(B, a.d, `%OSPF-5-ADJCHG: Process ${a.pid}, Nbr ${a.rid} on ${a.ios} from FULL to DOWN, Neighbor Down: Interface down or detached`, true); syslog(B, a.d, `%OSPF-5-ADJCHG: Process ${a.pid}, Nbr ${a.rid} on ${a.ios} from LOADING to FULL, Loading Done`, true); }
    B._ospfResetSeen[id] = info[id].resets; }
  B._ospfAdj = nowAdj;
  // the link-state database of each area: router nodes, transit networks (with a DR) and stub networks
  const areas = [...new Set(ifs.map(e=>e.f.area))];
  const graph = {}, stubs = {};   // per area
  for (const A of areas){ const G = graph[A] = new Map(), add = (u, v, c, via) => { if (!G.has(u)) G.set(u, []); G.get(u).push({v, c, via}); }; stubs[A] = [];
    for (const sg of segs.filter(x=>x.area===A)){
      const fullToDr = sg.dr && sg.mem.length>1 && !sg.p2p && !sg.mixed;
      if (sg.p2p && sg.mem.length===2){ const [a, b] = sg.mem; add(a.p, b.p, a.f.cost, {ios:a.f.ios, nh:b.f.ip}); add(b.p, a.p, b.f.cost, {ios:b.f.ios, nh:a.f.ip}); sg.mem.forEach(m=>stubs[A].push({rt:m.p, net:sg.net, len:sg.len, cost:m.f.cost})); }
      else if (fullToDr){ const N = "N:"+sg.id; for (const m of sg.mem){ add(m.p, N, m.f.cost, {ios:m.f.ios, net:true}); add(N, m.p, 0, {nh:m.f.ip}); } stubs[A].push({transit:N, net:sg.net, len:sg.len, dr:byKey.get(sg.dr)}); }
      else for (const m of sg.mem) stubs[A].push({rt:m.p, net: m.f.loop && m.f.net==="LOOPBACK" ? m.f.ip : sg.net, len: m.f.loop && m.f.net==="LOOPBACK" ? 32 : sg.len, cost:m.f.cost}); }
    out.__db = out.__db || {}; out.__db[A] = {routers:[...new Set(ifs.filter(e=>e.f.area===A).map(e=>e.p))].map(id=>({rid:info[id].rid, links: ifs.filter(e=>e.p===id && e.f.area===A).length + segs.filter(x=>x.area===A && x.p2p && x.mem.some(m=>m.p===id)).length})),
      nets: segs.filter(x=>x.area===A && x.dr && x.mem.length>1 && !x.p2p).map(x=>({ip:byKey.get(x.dr).f.ip, rid:byKey.get(x.dr).x.rid})), sums:[]}; }
  // Dijkstra with equal-cost first hops
  function spf(A, src){ const G = graph[A], dist = new Map([[src, 0]]), fh = new Map([[src, []]]), done = new Set();
    while (true){ let u = null; for (const [n, dd] of dist) if (!done.has(n) && (u===null || dd < dist.get(u))) u = n; if (u===null) break; done.add(u);
      for (const ed of (G.get(u)||[])){ const nd = dist.get(u) + ed.c;
        let hops = u===src ? [ed.via.net ? {ios:ed.via.ios, pend:true} : {ios:ed.via.ios, nh:ed.via.nh}] : fh.get(u).map(h=>h.pend ? {ios:h.ios, nh:ed.via.nh} : h);
        if (!dist.has(ed.v) || nd < dist.get(ed.v)){ dist.set(ed.v, nd); fh.set(ed.v, hops); }
        else if (nd===dist.get(ed.v) && !done.has(ed.v)){ const cur = fh.get(ed.v); for (const h of hops) if (!cur.some(x=>x.ios===h.ios && x.nh===h.nh)) cur.push(h); } } }
    return {dist, fh}; }
  const inArea = (id, A) => ifs.some(e=>e.p===id && e.f.area===A);
  const intra = {};   // id -> area -> prefix -> {cost, nhs, from}
  const sp = {};      // id -> area -> spf result
  for (const id in info){ intra[id] = {}; sp[id] = {};
    for (const A of areas){ if (!inArea(id, A)) continue; const r = sp[id][A] = spf(A, id), T = intra[id][A] = {};
      const offer = (pfx, cost, nhs, from) => { const c = T[pfx]; if (!c || cost < c.cost) T[pfx] = {cost, nhs:nhs.map(h=>Object.assign({}, h, {from})), from}; else if (cost===c.cost) for (const h of nhs) if (!c.nhs.some(x=>x.ios===h.ios && x.nh===h.nh)) c.nhs.push(Object.assign({}, h, {from})); };
      for (const st of stubs[A]){
        if (st.transit){ if (!r.dist.has(st.transit) || st.dr && st.dr.p===id) continue; const nhs = r.fh.get(st.transit).filter(h=>!h.pend); if (!nhs.length) continue; offer(st.net+"/"+st.len, r.dist.get(st.transit), nhs, st.dr.x.rid); continue; }
        if (st.rt===id || !r.dist.has(st.rt)) continue; offer(st.net+"/"+st.len, r.dist.get(st.rt) + st.cost, r.fh.get(st.rt), info[st.rt].rid); } } }
  // own transit networks are connected; drop prefixes the router has as connected
  // inter-area: ABRs (an interface in area 0 and in another area) summarise into the areas they touch
  const abrs = Object.keys(info).filter(id=>inArea(id, 0) && areas.some(A=>A!==0 && inArea(id, A)));
  for (const id of abrs) out[id].abr = true;
  const ia = {};   // id -> prefix -> {cost, nhs}
  const ownPfx = id => new Set(ifs.filter(e=>e.p===id).map(e=>netStr(e.f.ip, e.f.len)+"/"+e.f.len).concat(ifs.filter(e=>e.p===id && e.f.loop).map(e=>e.f.ip+"/32")));
  const abrKnows = (z, exceptArea) => { const m = {}; for (const A of Object.keys(intra[z])) if (+A!==exceptArea) for (const [pfx, v] of Object.entries(intra[z][A])) if (!m[pfx] || v.cost < m[pfx]) m[pfx] = v.cost;
    for (const e of ifs.filter(e=>e.p===z && e.f.area!==exceptArea)) { const pfx = e.f.loop && e.f.net==="LOOPBACK" ? e.f.ip+"/32" : netStr(e.f.ip, e.f.len)+"/"+e.f.len; if (m[pfx]==null || e.f.cost < m[pfx]) m[pfx] = e.f.cost; } return m; };
  // backbone first: ABRs inject their non-backbone networks into area 0; then every area gets what its ABRs know beyond it
  const sums = {};   // area -> [{z, pfx, cost}]
  for (const A of areas) sums[A] = [];
  for (const z of abrs){ const k0 = {}; for (const A of Object.keys(intra[z])) if (+A!==0) Object.assign(k0, Object.fromEntries(Object.entries(intra[z][A]).map(([p,v])=>[p, v.cost])));
    for (const e of ifs.filter(e=>e.p===z && e.f.area!==0)) k0[e.f.loop && e.f.net==="LOOPBACK" ? e.f.ip+"/32" : netStr(e.f.ip,e.f.len)+"/"+e.f.len] = Math.min(k0[netStr(e.f.ip,e.f.len)+"/"+e.f.len] ?? Infinity, e.f.cost);
    for (const [pfx, c] of Object.entries(k0)) sums[0].push({z, pfx, cost:c}); }
  for (const z of abrs) for (const A of areas){ if (A===0 || !inArea(z, A)) continue;
    const k = abrKnows(z, A); for (const sm of sums[0]) if (sm.z!==z){ const c = (sp[z][0] && sp[z][0].dist.get(sm.z)); if (c!=null && (k[sm.pfx]==null || c + sm.cost < k[sm.pfx])) k[sm.pfx] = c + sm.cost; }
    for (const [pfx, c] of Object.entries(k)) sums[A].push({z, pfx, cost:c}); }
  for (const A of areas){ const seen = new Set(); for (const sm of sums[A]) if (!seen.has(sm.pfx+"|"+sm.z)){ seen.add(sm.pfx+"|"+sm.z); out.__db[A].sums.push({net:sm.pfx.split("/")[0], rid:info[sm.z].rid}); } }
  for (const id in info){ ia[id] = {}; const own = ownPfx(id);
    for (const A of Object.keys(sp[id])){ const r = sp[id][A]; if (abrs.includes(id) && +A!==0) continue;
      for (const sm of sums[+A]){ if (sm.z===id || own.has(sm.pfx) || !r.dist.has(sm.z)) continue; if (Object.values(intra[id]).some(T=>T[sm.pfx])) continue;   // intra-area always wins
        const cost = r.dist.get(sm.z) + sm.cost, c = ia[id][sm.pfx], nhs = r.fh.get(sm.z).map(h=>Object.assign({}, h, {from:info[sm.z].rid}));
        if (!c || cost < c.cost) ia[id][sm.pfx] = {cost, nhs}; else if (cost===c.cost) for (const h of nhs) if (!c.nhs.some(x=>x.ios===h.ios && x.nh===h.nh)) c.nhs.push(h); } } }
  // external default route (default-information originate): an E2 route with metric 1, forwarded towards the nearest ASBR
  const asbrs = Object.keys(info).filter(id=>info[id].defOrig && (info[id].defAlways || info[id].hasDefault));
  for (const z of asbrs) out.__ext = (out.__ext||[]).concat([{net:"0.0.0.0", rid:info[z].rid}]);
  for (const id in info){ const own = ownPfx(id); const rt = [];
    const pick = {}; for (const A of Object.keys(intra[id])) for (const [pfx, v] of Object.entries(intra[id][A])){ if (own.has(pfx)) continue; const c = pick[pfx]; if (!c || v.cost < c.cost) pick[pfx] = {cost:v.cost, nhs:v.nhs, type:"O"}; }
    for (const [pfx, v] of Object.entries(ia[id])) if (!pick[pfx] && !own.has(pfx)) pick[pfx] = {cost:v.cost, nhs:v.nhs, type:"O IA"};
    if (!asbrs.includes(id)){ let best = null;
      for (const z of asbrs){ let fwd = null, nhs = null;
        for (const A of Object.keys(sp[id])){ const r = sp[id][A]; if (r.dist.has(z)){ const c = r.dist.get(z); if (fwd==null || c < fwd){ fwd = c; nhs = r.fh.get(z); } } }
        if (fwd==null) for (const zb of abrs){ for (const A of Object.keys(sp[id])){ const r = sp[id][A]; if (!r.dist.has(zb) || !sp[zb]) continue; for (const B0 of Object.keys(sp[zb])){ const r2 = sp[zb][B0]; if (r2.dist.has(z)){ const c = r.dist.get(zb) + r2.dist.get(z); if (fwd==null || c < fwd){ fwd = c; nhs = r.fh.get(zb); } } } } }
        if (fwd!=null && (!best || fwd < best.fwd)) best = {fwd, nhs: nhs.map(h=>Object.assign({}, h, {from:info[z].rid}))}; }
      if (best) pick["0.0.0.0/0"] = {cost:1, nhs:best.nhs, type:"O*E2", fwd:best.fwd}; }
    for (const [pfx, v] of Object.entries(pick)){ const [net, len] = pfx.split("/"); const nhs = v.nhs.filter(h=>h.nh && !h.pend); if (nhs.length) rt.push({net, len:+len, cost:v.cost, type:v.type, fwd:v.fwd, nhs:nhs.map(h=>({ios:h.ios, nh:h.nh, from:h.from}))}); }
    const seenR = new Set(); for (const A of Object.keys(sp[id])) for (const nd of sp[id][A].dist.keys()) if (info[nd]) seenR.add(info[nd].rid);
    const db = {}; for (const [A, v] of Object.entries(out.__db || {})) if (sp[id][A]) db[A] = {routers:v.routers.filter(x=>seenR.has(x.rid)), nets:v.nets.filter(x=>seenR.has(x.rid)), sums:v.sums.filter(x=>seenR.has(x.rid))};
    out[id].routes = rt; out[id].lsdb = {areas: db, ext: (out.__ext || []).filter(x=>seenR.has(x.rid))}; }
  delete out.__db; delete out.__ext;
  return out;
}
const hsrpVmacOf = (g, ver) => ver===2 ? `0000.0c9f.f${g.toString(16).padStart(3,"0")}` : `0000.0c07.ac${g.toString(16).padStart(2,"0")}`;
function computeHsrp(B, hears){
  const key = (d, ios) => d.id+"|"+ios, mem = [];
  for (const d of routersOf(B)) for (const g of d.env.hsrpGroups()) if (g.up) mem.push(Object.assign({d, k:key(d, g.ios)}, g));
  const heard0 = m => { if (!hears.has(m.k)) hears.set(m.k, new Set(l3Hear(B, m.d, m.ios).map(h=>key(h.dev, h.ios)))); return hears.get(m.k); };
  const heard = m => helloAcl(B, heard0(m), {src:(m.d.env.intfs[m.ios]||{}).ip, proto:"udp", sport:1985, dport:1985}, (m.d.env.intfs[m.ios]||{}).hsrpVer===2 ? "224.0.0.102" : "224.0.0.2");
  const out = {}, seen = new Set(); B._hsrpSeg = B._hsrpSeg || {}; B._hsrpSt = B._hsrpSt || {};
  for (const m of mem){ if (seen.has(m.k+"#"+m.grp)) continue;
    const grp = mem.filter(o=>o.grp===m.grp && (o===m || (heard(m).has(o.k) && heard(o).has(m.k)))); grp.forEach(o=>seen.add(o.k+"#"+o.grp));
    const better = (a, b) => a.prio!==b.prio ? a.prio > b.prio : ipInt(a.ip) > ipInt(b.ip);
    const sk = m.grp + "@" + grp.map(o=>o.k).sort().join(","), prev = Object.entries(B._hsrpSeg).find(([k,v])=>v.grp===m.grp && grp.some(o=>o.k===v.active || o.k===v.standby));
    let act = prev && grp.find(o=>o.k===prev[1].active) || null;
    if (act){ const ch = grp.filter(o=>o!==act && o.preempt && o.prio > act.prio).sort((a,b)=>better(a,b)?-1:1)[0]; if (ch) act = ch; }
    if (!act) act = grp.slice().sort((a,b)=>better(a,b)?-1:1)[0];
    const sby = grp.filter(o=>o!==act).sort((a,b)=>better(a,b)?-1:1)[0] || null;
    if (prev) delete B._hsrpSeg[prev[0]]; B._hsrpSeg[sk] = {grp:m.grp, active:act.k, standby: sby ? sby.k : null};
    if (prev && prev[1].active!==act.k){ const vm = hsrpVmacOf(m.grp, act.ver); for (const id of B.order) if (B.mac[id]) for (const [mk, e] of Object.entries(B.mac[id])) if (e.mac===vm) delete B.mac[id][mk]; }   // the new active router's gratuitous ARP moves the virtual MAC
    for (const o of grp){ const state = o===act ? "Active" : o===sby ? "Standby" : "Listen", was = B._hsrpSt[o.k+"#"+o.grp];
      if (was!==state){   // the real HSRP state sequence: from Init a router goes Listen → Speak → Standby (→ Active); a pre-empted Active steps back through Speak
        const steps = (!was || was==="Init") ? (state==="Active" ? [["Speak","Standby"],["Standby","Active"]] : state==="Standby" ? [["Speak","Standby"]] : [])
          : (was==="Active" && state==="Standby") ? [["Active","Speak"],["Speak","Standby"]] : (was==="Listen" && state==="Standby") ? [["Listen","Speak"],["Speak","Standby"]] : [[was, state]];
        for (const [f, t] of steps) syslog(B, o.d, `%HSRP-5-STATECHANGE: ${o.ios} Grp ${o.grp} state ${f} -> ${t}`, true); B._hsrpSt[o.k+"#"+o.grp] = state; }
      out[o.k+"#"+o.grp] = {state, active: o===act ? "local" : act.ip, standby: o===sby ? "local" : sby ? sby.ip : "unknown", activePrio: act.prio, standbyPrio: sby ? sby.prio : null, vmac: hsrpVmacOf(o.grp, o.ver), vip:o.vip, changes: 2}; } }
  for (const k of Object.keys(B._hsrpSt)) if (!out[k]){ const [dk] = k.split("#"); const [did, ios] = dk.split("|"); const d = B.devs[did]; if (d && B._hsrpSt[k]!=="Init"){ syslog(B, d, `%HSRP-5-STATECHANGE: ${ios} Grp ${k.split("#")[1]} state ${B._hsrpSt[k]} -> Init`, true); } B._hsrpSt[k] = "Init"; }
  return out;
}
// is this router interface the active HSRP gateway for ip / the owner of a virtual MAC?
function hsrpFor(B, d, ios){ const H = (B._l3 && B._l3.hsrp) || {}; return Object.entries(H).filter(([k,v])=>k.startsWith(d.id+"|"+ios+"#") && v.state==="Active").map(([,v])=>v); }
const hsrpOwnsIp = (B, d, ios, ip) => hsrpFor(B, d, ios).some(v=>v.vip===ip);
const hsrpOwnsMac = (B, d, ios, mac) => hsrpFor(B, d, ios).some(v=>v.vmac===mac);
// traceroute: the routers a probe passes, by the address of the interface it arrived on
function trace(B, node, dstIp){
  B_ctx.B = B; B.step = 0; computeL3(B);
  if (isRouterDev(node.dev) && !node.ip && !node.svi){ const r = routeLookup(node.dev, dstIp, node.vrf); if (r) node = {dev:node.dev, ip:node.dev.env.intfs[r.ios].ip, vrf:node.vrf||null}; }
  const probe = node.dev.env ? {src:node.ip, proto:"udp", sport:49200, dport:33434} : {src:node.ip, proto:"icmp", icmp:8, icode:0, sport:1, dport:1};   // IOS probes with UDP, Windows with ICMP echo
  const go = sendIp(B, node, dstIp, "Traceroute probe", probe);
  const hops = go.path || [];
  // each hop answers (ICMP time exceeded, or the final reply) only if IT can route back to the sender — a missing return route shows as * * *
  const silent = new Set();
  hops.forEach((ip, k) => { if (k >= 30) return; const o = (go.ownAt && go.ownAt[k]) || ipOwner(B, ip); if (!o) return;   // the device that really answered (overlapping VRF addresses make "who owns this IP" ambiguous)
    const from = o.ios && o.dev.env ? (isRouterDev(o.dev) ? {dev:o.dev, vrf:vrfAt(o.dev, o.ios)} : (o.ios.startsWith("Vlan") ? sviNode(o.dev, o.ios) : {dev:o.dev})) : hostNode(o.dev);
    const back = sendIp(B, from, go.srcAt[k] || node.ip, "ICMP reply to the traceroute", {src:ip, proto:"icmp", icmp: k===hops.length-1 && go.ok ? (node.dev.env ? 3 : 0) : k===hops.length-1 && go.kind!=="timeout" ? 3 : 11, icode: k===hops.length-1 && go.ok && node.dev.env ? 3 : 0, sport:go.portAt[k], dport:go.portAt[k], err:true});
    if (!back.ok || !back.final || back.final.dev!==node.dev) silent.add(k); });
  B.frames = go.frames; B.log = go.log.concat(silent.size ? [`Hop${silent.size>1?"s":""} ${[...silent].map(k=>k+1).join(", ")} received the probe but had no way back to ${node.ip} — their replies never arrive (* * *): check the return route`] : []);
  const ok = go.ok && !silent.has(hops.length-1);
  if (go.ok && go.preNat && hops.length) hops[hops.length-1] = go.preNat;   // the inside host's replies leave translated: the tracer sees the global address
  return {hops, silent, ok, kind: go.kind, unreachFrom: go.unreachFrom};
}
function iosTraceText(t, dst){
  const L = ["Type escape sequence to abort.", `Tracing the route to ${dst}`, "VRF info: (vrf in name/id, vrf out name/id)"], sil = t.silent || new Set();
  t.hops.slice(0, 30).forEach((h,k)=>{ if (sil.has(k)) L.push(`  ${k+1}  *  *  *`); else if (k===t.hops.length-1 && t.kind==="prohib") L.push(`  ${k+1} ${h} !A  *  !A`); else if (k===t.hops.length-1 && t.kind==="netunreach") L.push(t.v6 ? `  ${k+1} ${h} !N  !N  !N` : `  ${k+1} ${h} !H  !H  !H`); else L.push(`  ${k+1} ${h} ${1+k%2} msec ${1+(k+1)%2} msec ${1+k%3} msec`); });
  if (!t.ok && !((t.kind==="netunreach" || t.kind==="prohib") && !sil.has(t.hops.length-1)) && t.hops.length < 30) for (let k=t.hops.length+1; k<=30; k++) L.push(`  ${k}  *  *  *`);
  return L.join("\n");
}
function winTraceText(t, dst){
  const L = ["", `Tracing route to ${dst} over a maximum of 30 hops`, ""], sil = t.silent || new Set();
  t.hops.slice(0, 30).forEach((h,k)=>{ if (sil.has(k)) L.push(`${String(k+1).padStart(3)}     *        *        *     Request timed out.`); else if (k===t.hops.length-1 && t.kind==="prohib") L.push(`${String(k+1).padStart(3)}  ${h}  reports: Destination protocol unreachable.`); else if (k===t.hops.length-1 && t.kind==="netunreach") L.push(`${String(k+1).padStart(3)}  ${h}  reports: Destination ${t.v6 ? "net" : "host"} unreachable.`); else L.push(`${String(k+1).padStart(3)}    <1 ms    <1 ms    <1 ms  ${h}`); });
  if (!t.ok && !((t.kind==="netunreach" || t.kind==="prohib") && !sil.has(t.hops.length-1)) && t.hops.length < 30) for (let k=t.hops.length+1; k<=30; k++) L.push(`${String(k).padStart(3)}     *        *        *     Request timed out.`);
  L.push("", "Trace complete."); return L.join("\n");
}

/* ---- IPv6: router advertisements (SLAAC), Neighbor Discovery, forwarding, ping and traceroute ---- */
const v6InPlay = (B, cfg) => !!(cfg && (cfg.builder || cfg.ipv6)) || B.order.some(id=>{ const d = B.devs[id]; if (d.env) return d.env.v6info().ifaces.length > 0 || !!d.env.v6info().routing; return !!(d.ip6 && !d.ip6.auto); });
const isV6Mc = mac => typeof mac==="string" && mac.startsWith("3333.");
const I6 = () => window.IP6;
// who answers a Router Solicitation on this segment: any router with ipv6 unicast-routing whose interface here has IPv6 on.
// The RA always offers the router (its link-local) as default gateway; it carries a usable SLAAC prefix only if that interface has a /64.
function raFrom(B, from, srcMac){
  const r = deliver(B, from, {src:srcMac, dst:"3333.0000.0002", kind:"nd", label:"RS"}, 0);
  for (const x of (r.recv||[])){ const d = x.dev; if (!d.env || !d.env.v6info || d.kind!=="router") continue; const v = d.env.v6info(); if (!v.routing) continue;
    const f = v.ifaces.find(i=>i.ios===x.ios && i.up); if (!f) continue; const own = f.globals.filter(gg=>!gg.auto), g = own.find(gg=>gg.len===64);
    return {prefix: g ? I6().str(I6().mask(I6().parse(g.addr), 64)) : null, len: g ? 64 : null, rtrLL:f.ll, dev:d.id, ios:f.ios,
      advertised: own.map(gg=>I6().str(I6().mask(I6().parse(gg.addr), gg.len)) + "/" + gg.len)}; }
  return null;
}
function showRsRa(B, d){
  B_ctx.B = B; B.step = 0; const I = I6(), ref = hostNode(d).ref; if (!ref || !linkUpAt(B, ref)){ B.frames = []; B.log = []; return; }
  const rs = deliver(B, ref, {src:d.mac, dst:"3333.0000.0002", kind:"nd", label:"RS"}, 0), frames = [...rs.hops];
  const log = [`<b>Router Solicitation</b> (ICMPv6 type 133) from ${d.label} to ff02::2, all routers: "any IPv6 routers on this link?"`, ...rs.notes.map(x=>"&nbsp;&nbsp;· "+x)];
  B.step += Math.max(1, ...rs.hops.map(h=>h.step+1-B.step));
  let ra = null;
  for (const x of (rs.recv||[])){ const r = x.dev; if (!r.env || r.kind!=="router" || !r.env.v6info().routing) continue; const f = r.env.v6info().ifaces.find(i=>i.ios===x.ios && i.up); if (f){ ra = {r, f}; break; } }
  if (!ra){ log.push("&nbsp;&nbsp;· No Router Advertisement comes back — no router with <b>ipv6 unicast-routing</b> on this link. The PC keeps only its link-local address."); B.frames = frames; B.log = log; return; }
  const node = routerNodeFor(ra.r, ra.f.ios), own = ra.f.globals.filter(g=>!g.auto), g64 = own.find(g=>g.len===64);
  const adv = deliver(B, node.tag!=null ? {ref:node.ref, tag:node.tag} : node.ref, {src:ra.r.env.intfs[ra.f.ios].mac, dst:"3333.0000.0001", kind:"nd", label:"RA"}, B.step);
  frames.push(...adv.hops);
  log.push(`<b>Router Advertisement</b> (ICMPv6 type 134) from ${ra.r.label} (${ra.f.ll}) to ff02::1, all nodes: default router ${ra.f.ll}` +
    (own.length ? ", prefix " + own.map(g=>I.str(I.mask(I.parse(g.addr), g.len)) + "/" + g.len).join(", ") : ", no prefix"), ...adv.notes.map(x=>"&nbsp;&nbsp;· "+x),
    g64 ? `&nbsp;&nbsp;· ${d.label} builds its address from the /64 prefix plus an interface ID (the lab uses EUI-64; Windows really uses a random one)`
        : `&nbsp;&nbsp;· ${own.length ? "The prefix isn't a /64, so SLAAC can't use it — " : ""}${d.label} gets a default gateway but no global address`);
  B.frames = frames; B.log = log;
}
function computeRa(B){
  const out = {};
  // only matters when some router advertises IPv6; and working it out must not teach the switches any MACs (lessons rely on empty tables)
  if (!B.order.some(id=>{ const d = B.devs[id]; return d.env && d.kind==="router" && d.env.v6info && d.env.v6info().routing; })) return out;
  const savedMac = JSON.stringify(B.mac);
  try { computeRaInner(B, out); } finally { B.mac = JSON.parse(savedMac); }
  return out;
}
function computeRaInner(B, out){
  for (const id of B.order){ const d = B.devs[id]; if (d.on===false) continue;
    if (!d.env && d.kind!=="hub" && d.ip6 && d.ip6.auto){ const ref = hostNode(d).ref; if (ref && linkUpAt(B, ref)) out[id] = raFrom(B, ref, d.mac); }
    if (d.env && d.kind==="router") for (const [n,i] of Object.entries(d.env.intfs)) if (i.ip6auto && d.env.isUp(n)){ const node = routerNodeFor(d, n); out[id+"|"+n] = raFrom(B, node.tag!=null ? {ref:node.ref, tag:node.tag} : node.ref, i.mac); } }
  return out;
}
// a host's IPv6 identity: link-local always; global from static settings or SLAAC (prefix from the RA + EUI-64 — real Windows uses a random interface ID)
function host6(B, d){
  const I = I6(), ll = I.str(I.linkLocal(d.mac)), ra = (B._l3 && B._l3.ra || {})[d.id];
  const globals = d.ip6 && !d.ip6.auto ? (d.ip6.addr ? [{addr:I.str(I.parse(d.ip6.addr)), len:d.ip6.len||64}] : []) : ra && ra.prefix ? [{addr: I.str(I.withIid(I.parse(ra.prefix), I.eui64(d.mac))), len:64, slaac:true}] : [];
  const gw = d.ip6 && !d.ip6.auto ? (d.ip6.gw ? I.str(I.parse(d.ip6.gw)) : null) : ra ? ra.rtrLL : null;
  return {dev:d, ref: hostNode(d).ref, mac:d.mac, ll, globals, gw, host:true};
}
function router6(r, ios){ const v = r.env.v6info(), f = v.ifaces.find(i=>i.ios===ios) || {}; const base = routerNodeFor(r, ios); return Object.assign({}, base, {ll:f.ll, globals:f.globals||[], v6:true}); }
const addrs6 = n => [n.ll, ...(n.globals||[]).map(g=>g.addr)].filter(Boolean);
function owner6(B, addr){ const I = I6();
  for (const id of B.order){ const d = B.devs[id]; if (d.on===false) continue;
    if (d.env && d.env.v6info){ const f = d.env.v6info().ifaces.find(i=>i.up && addrs6(i).some(a=>I.eq(a, addr))); if (f) return {dev:d, ios:f.ios, mac:d.env.intfs[f.ios].mac}; }
    else if (!d.env && d.kind!=="hub" && d.mac){ const h = host6(B, d); if (addrs6(h).some(a=>I.eq(a, addr))) return h; } }
  return null; }
const routerSrc6 = (d, dst) => { const r = d.env.lookup6(dst); const f = r && d.env.v6info().ifaces.find(x=>x.ios===r.ios); return f && f.globals[0] ? f.globals[0].addr : null; };
// ND: one hop. Neighbor Solicitation to the solicited-node multicast group, Neighbor Advertisement back, then the packet
function hop6(B, node, nh, label){
  const I = I6(), cache = B.nd[node.dev.id] || (B.nd[node.dev.id] = {}), out = {frames:[], log:[]};
  const fromSpec = node.svi ? {svi:node.dev.id, vlan:node.vlan} : (node.tag!=null ? {ref:node.ref, tag:node.tag} : node.ref);
  let entry = cache[nh];
  if (entry){ const o = owner6(B, nh); if (!o || o.mac!==entry.mac){ delete cache[nh]; entry = null;
    out.log.push(`&nbsp;&nbsp;· ${node.dev.label}'s cached neighbour for ${nh} no longer answers for that address — Neighbor Unreachability Detection drops the entry and it asks again`); } }
  if (!entry){
    const ns = deliver(B, fromSpec, {src:node.mac, dst:I.solicitedMac(nh), kind:"nd", label:"NS?"}, B.step);
    out.frames.push(...ns.hops); out.log.push(`<b>Neighbor Solicitation</b> (to the solicited-node group ${I.str(I.solicited(nh))}) from ${node.dev.label}: "Who has ${nh}?"`, ...ns.notes.map(x=>"&nbsp;&nbsp;· "+x));
    B.step += Math.max(1, ...ns.hops.map(h=>h.step+1-B.step));
    const owner = ns.recv.find(r=>{ if (r.dev===node.dev) return false; if (r.dev.env){ if (!r.ios || !r.dev.env.v6info) return false; const f = r.dev.env.v6info().ifaces.find(i=>i.ios===r.ios && i.up); return !!f && addrs6({ll:f.ll, globals:f.globals}).some(a=>I.eq(a, nh)); }
      const h = host6(B, r.dev); return addrs6(h).some(a=>I.eq(a, nh)); });
    if (!owner){ out.log.push(`&nbsp;&nbsp;· No Neighbor Advertisement came back — nothing on this link has ${nh}`); return Object.assign(out, {ok:false}); }
    const omac = owner.ios ? owner.dev.env.intfs[owner.ios].mac : owner.dev.mac;
    (B.nd[owner.dev.id] || (B.nd[owner.dev.id] = {}))[addrs6(node)[0]] = {mac:node.mac, ios: owner.ios || "eth"};
    const na = deliver(B, owner.tag!=null ? {ref:owner.ref, tag:owner.tag} : owner.ref, {src:omac, dst:node.mac, kind:"nd", label:"NA"}, B.step);
    out.frames.push(...na.hops); out.log.push(`<b>Neighbor Advertisement</b> (unicast) from ${owner.dev.label}: "${nh} is at ${omac}"`, ...na.notes.map(x=>"&nbsp;&nbsp;· "+x));
    B.step += Math.max(1, ...na.hops.map(h=>h.step+1-B.step));
    if (!na.recv.some(r=>r.dev===node.dev)) return Object.assign(out, {ok:false});
    entry = cache[nh] = {mac:omac, ios: node.ios || "eth"};
  }
  const f = deliver(B, fromSpec, {src:node.mac, dst:entry.mac, kind:"ip", label}, B.step);
  out.frames.push(...f.hops); out.log.push(`<b>${label}</b> (IPv6) ${node.dev.label} → frame to ${entry.mac}`, ...f.notes.map(x=>"&nbsp;&nbsp;· "+x));
  B.step += Math.max(1, ...f.hops.map(h=>h.step+1-B.step));
  const rcv = f.recv.find(r=>{ const m = r.ios ? r.dev.env.intfs[r.ios].mac : r.dev.mac; return m===entry.mac; });
  return Object.assign(out, {ok:!!rcv, to:rcv});
}
const pick6 = (n, dst) => { const I = I6(); if (I.isLL(dst)) return n.ll; const g = (n.globals||[])[0]; return g ? g.addr : n.ll; };
function sendIp6(B, node, dst, label, outIf){
  const I = I6(), res = {frames:[], log:[], ok:false, kind:"timeout", path:[]};
  let cur = node, hl = node.dev.env ? 64 : 128;
  for (let n=0; n<300; n++){
    let nh;
    if (cur.dev.env && cur.dev.kind==="router"){
      const v = cur.dev.env.v6info();
      if (v.ifaces.some(f=>f.up && addrs6(f).some(a=>I.eq(a, dst)))){ res.ok = true; res.final = {dev:cur.dev}; if (n>0) res.path.push(dst); return res; }
      if (n>0 && !v.routing){ res.log.push(`${cur.dev.label} isn't routing IPv6 (no <b>ipv6 unicast-routing</b>) — it drops the packet`); res.kind = "timeout"; return res; }
      if (I.isLL(dst)){ if (n>0) return res; const ios = outIf || cur.ios; if (!ios) { res.kind = "noroute"; return res; } cur = Object.assign(router6(cur.dev, ios), {inAddr: cur.inAddr}); nh = dst; }
      else { const r = cur.dev.env.lookup6(dst) || (n===0 ? (()=>{ for (const f of v.ifaces) if (f.up) for (const g of f.globals) if (I.inPrefix(dst, g.addr, g.len)) return {ios:f.ios, nh:dst}; return null; })() : null);
        if (!r){ if (n===0){ res.kind = "noroute"; res.log.push(`${cur.dev.label} has no IPv6 route to ${dst}`); return res; }
          res.kind = "unreach"; res.unreachFrom = cur.inAddr; res.log.push(`${cur.dev.label} has no IPv6 route to ${dst} — it drops the packet and sends ICMPv6 <b>Destination Unreachable</b> (no route to destination) back from ${cur.inAddr}`); return res; }
        cur = Object.assign(router6(cur.dev, r.ios), {inAddr: cur.inAddr}); nh = r.nh; }
    } else {
      if (addrs6(cur).some(a=>I.eq(a, dst))){ res.ok = true; res.final = cur; return res; }
      if (I.isLL(dst) || (cur.globals||[]).some(g=>I.inPrefix(dst, g.addr, g.len))) nh = dst;
      else if (cur.gw && n===0 && !(cur.globals||[]).length){ res.kind = "general"; res.log.push(`${cur.dev.label} has a default router (${cur.gw}) but only a link-local address — no source address of the right scope for ${dst}`); return res; }
      else if (cur.gw) nh = cur.gw;
      else { res.kind = n===0 ? "general" : "timeout"; res.log.push(`${cur.dev.label} has no IPv6 default gateway for ${dst}`); return res; }
    }
    const h = hop6(B, cur, nh, label);
    if (n < 12){ res.frames.push(...h.frames); res.log.push(...h.log); }
    if (!h.ok){ if (n===0){ res.kind = "addrunreach"; res.unreachFrom = pick6(cur, dst); } else { res.kind = "addrunreach"; res.unreachFrom = cur.inAddr; } return res; }
    const to = h.to;
    if (to.ios && to.dev.env){ const rn = router6(to.dev, to.ios); const inAddr = pick6(rn, dst);
      if (to.dev.env.v6info().ifaces.some(f=>f.up && addrs6(f).some(a=>I.eq(a, dst)))){ res.ok = true; res.final = {dev:to.dev, ios:to.ios}; res.path.push(dst); return res; }
      hl--; res.path.push(inAddr);
      if (hl<=0){ res.kind = "ttlexpired"; res.unreachFrom = inAddr; return res; }
      cur = {dev:to.dev, inAddr}; res.log.push(`${to.dev.label} received it on ${shortIf(to.ios)}, decrements the hop limit to ${hl} and routes it`); continue; }
    const hn = host6(B, to.dev); if (addrs6(hn).some(a=>I.eq(a, dst))){ res.ok = true; res.final = hn; res.path.push(dst); return res; }
    return res;
  }
  return res;
}
function node6For(B, d, dst, outIf){ if (d.env){ return {dev:d, ios: outIf || null}; } return host6(B, d); }
function ping6(B, d, dst, outIf, srcOverride){
  B_ctx.B = B; B.step = 0; computeL3(B); const I = I6(); dst = I.str(I.parse(dst));
  const node = node6For(B, d, dst, outIf), go = sendIp6(B, node, dst, "ICMPv6 echo request", outIf);
  let frames = go.frames, log = go.log.slice(), ok = false, kind = go.kind;
  if (go.ok){ const fin = go.final.dev.env ? {dev:go.final.dev, ios:go.final.ios} : go.final;   // a link-local reply leaves by the interface the request came in on
    const src = srcOverride || (d.env ? (I.isLL(dst) ? d.env.v6info().ifaces.find(f=>f.ios===outIf)?.ll : routerSrc6(d, dst)) : pick6(node, dst));
    const back = src ? sendIp6(B, fin, src, "ICMPv6 echo reply", go.final.dev.env ? go.final.ios : null) : {ok:false, frames:[], log:[]};
    frames = frames.concat(back.frames); log = log.concat(back.log); ok = back.ok; if (!ok) kind = "timeout"; }
  B.frames = frames; B.log = log;
  return {ok, kind, unreachFrom: go.unreachFrom};
}
function trace6(B, d, dst){
  B_ctx.B = B; B.step = 0; computeL3(B); const I = I6(); dst = I.str(I.parse(dst));
  const node = node6For(B, d, dst), go = sendIp6(B, node, dst, "Traceroute probe (IPv6)");
  const hops = go.path || [], silent = new Set(), src = d.env ? routerSrc6(d, dst) : pick6(node, dst);
  // each hop's answer (Time Exceeded, Destination Unreachable or the final reply) only arrives if THAT device can route back to us
  if (src) hops.forEach((a, k) => { if (k >= 30) return; const o = owner6(B, a); if (!o) return;
    const back = sendIp6(B, o.host ? o : {dev:o.dev}, src, "ICMPv6 reply to the traceroute"); if (!back.ok) silent.add(k); });
  B.frames = go.frames; B.log = go.log.concat(silent.size ? [`Hop${silent.size>1?"s":""} ${[...silent].map(k=>k+1).join(", ")} received the probe but had no way back to ${src} — their replies never arrive (* * *): check the return route`] : []);
  return {hops, ok: go.ok && !silent.has(hops.length-1), kind: go.kind === "unreach" ? "netunreach" : go.kind, silent, v6:true};
}

/* ---- DHCP (IPv4): Discover → Offer → Request → Ack; the relay hop (ip helper-address); the server's ping check; APIPA ---- */
const apipaOf = d => { let h = 0; for (const ch of d.mac) h = (h*131 + ch.charCodeAt(0)) >>> 0; return `169.254.${1 + h % 254}.${1 + (h >>> 8) % 254}`; };
const mbits = m => (ipToInt(m)>>>0).toString(2).split("1").length - 1;
const leaseText = ms => ms==null ? "infinite" : ms % 86400000===0 ? `${ms/86400000} day${ms===86400000?"":"s"}` : ms % 3600000===0 ? `${ms/3600000} hour${ms===3600000?"":"s"}` : `${ms/60000} minutes`;
function dlog(B, frames, log, r, text){ frames.push(...r.hops); log.push(text, ...r.notes.map(n=>"&nbsp;&nbsp;· "+n)); B.step += Math.max(1, ...r.hops.map(h=>h.step+1-B.step)); }
const fromOf = n => n.svi ? {svi:n.dev.id, vlan:n.vlan} : (n.tag!=null ? {ref:n.ref, tag:n.tag} : n.ref);
function dora(B, d){
  if (d.wifiAt && !d.wifiAt.flex && !d.wifiAt.dhcpServer) return {ok:false, frames:[], why:"proxy", log:[`<b>DHCP Discover</b> from ${d.label} reaches the controller over CAPWAP, but interface <b>${d.wifiAt.ifaceName}</b> has no Primary DHCP Server — with DHCP proxy on (the AireOS default) the WLC has nowhere to relay it, so the client never gets an address`]};
  const hn = hostNode(d), proxy = d.wifiAt && !d.wifiAt.flex && B.devs[d.wifiAt.wlc] && B.devs[d.wifiAt.wlc].wlc;
  const res0 = doraCore(B, {self:d, label:d.label, mac:d.mac, from: hn.tag!=null ? {ref:hn.ref, tag:hn.tag} : hn.ref, link:hn.ref, want:d.lastIp, who:"Windows"},
  (o, f) => { d.ip = o.ip; d.mask = o.mask; d.gw = o.routers[0] || null; d.dns = o.dns.slice(); d.domain = o.domain || null; d.lastIp = o.ip;
    d.lease = {server:f.srvIp, srvId:f.srv.id, obtained:B.now, expires: o.leaseMs==null ? null : B.now + o.leaseMs}; B.arp[d.id] = {}; });
  if (res0 && res0.ok && proxy && d.lease){ d.lease.shown = proxy.virtual || "192.0.2.1"; (res0.log = res0.log || []).push(`&nbsp;&nbsp;· the controller is a DHCP proxy: it relayed the client's request to ${d.wifiAt.dhcpServer} with giaddr = its ${d.wifiAt.ifaceName} interface, and answered the client from its virtual interface ${d.lease.shown} — that's the DHCP Server ipconfig /all shows`); }
  return res0; }
function routerDora(B, r, ifn){ const i = r.env.intfs[ifn], node = routerNodeFor(r, ifn), sh = shortIf(ifn);
  return doraCore(B, {self:r, label:r.label + " " + sh, mac:i.mac, from:fromOf(node), link:node.ref, want:i.dhcpLast, cid:window.DHCP.ciscoCid(i.mac, sh), who:"IOS"},
  (o, f) => { i.ip = o.ip; i.mask = o.mask; i.dhcpGw = o.routers[0] || null; i.dhcpLast = o.ip; i.dhcpLease = {server:f.srvIp, obtained:B.now, secs: o.leaseMs==null ? 4294967295 : Math.round(o.leaseMs/1000)};
    syslog(B, r, `%DHCP-6-ADDRESS_ASSIGN: Interface ${ifn} assigned DHCP address ${o.ip}, mask ${o.mask}, hostname ${r.env.host}`, true); }); }
function doraCore(B, c, apply){
  B_ctx.B = B; B.step = 0; const frames = [], log = [], D = window.DHCP, d = c.self, ref = c.from;
  if (!ref || !linkUpAt(B, c.link)) return {ok:false, frames, log:[`No link — ${c.who} can't send a DHCP Discover`], why:"media"};
  const df = {src:c.mac, dst:BCAST, kind:"dhcp", label:"Discover"}, disc = deliver(B, ref, df, B.step);
  dlog(B, frames, log, disc, `<b>DHCP Discover</b> (broadcast: 0.0.0.0 → 255.255.255.255, UDP 68 → 67) from ${c.label} (${c.mac}): "is there a DHCP server?"`);
  const skip = new Set();
  const search = () => { let found = null;
  for (const x of (disc.recv||[])){
    const rd = x.dev, ifn = x.svi || x.ios; if (!rd.env || !rd.env.dhcp || !ifn || rd===d || skip.has(rd.id)) continue;
    const i = rd.env.intfs[ifn]; if (!i || !i.ip || i.shut) continue;
    if (df.opt82 && !(rd.env.relayTrustAll || i.relayTrusted)){ log.push(`&nbsp;&nbsp;· ${rd.label} ${shortIf(ifn)} drops it: it carries option 82 from the DHCP-snooping switch ${df.opt82} with giaddr 0.0.0.0, which an IOS DHCP server/relay doesn't trust — fix: <b>no ip dhcp snooping information option</b> on the switch, or <b>ip dhcp relay information trust-all</b> on the router`); continue; }
    { const tmp = {path:[], srcAt:[], portAt:[], log:[]}; if (aclGate(B, tmp, rd, ifn, "in", {src:"0.0.0.0", proto:"udp", sport:68, dport:67}, "255.255.255.255")){ log.push(...tmp.log.map(x=>"&nbsp;&nbsp;· " + x.replace(/^&nbsp;&nbsp;· /,""))); continue; } }
    if (rd.env.serviceDhcp===false){ log.push(`&nbsp;&nbsp;· ${rd.label} heard it, but <b>no service dhcp</b> switches off both its DHCP server and its relay`); continue; }
    if (D.poolFor(rd.env.dhcp, i.ip)){ found = {srv:rd, srvIp:i.ip, via:i.ip, relay:null, iface:ifn, near:routerNodeFor(rd, ifn)}; break; }
    if (!i.helpers || !i.helpers.length){ log.push(`&nbsp;&nbsp;· ${rd.label} ${shortIf(ifn)} heard the broadcast, but it has no DHCP pool for ${netOf(i.ip, i.mask)}/${mbits(i.mask)} and no <b>ip helper-address</b> — routers don't forward broadcasts, so the Discover stops here`); continue; }
    for (const h of i.helpers){
      const go = sendIp(B, {dev:rd, ip:i.ip}, h, "DHCP Discover (relayed)", {src:i.ip, proto:"udp", sport:67, dport:67}); frames.push(...go.frames);
      log.push(`<b>Relay:</b> ${rd.label} ${shortIf(ifn)} has <b>ip helper-address ${h}</b> — it turns the broadcast into a unicast to ${h} (sent from its interface towards the server) and writes giaddr = ${i.ip}, so the server knows which subnet the client is on`, ...go.log);
      if (!go.ok){ log.push(`&nbsp;&nbsp;· the relayed Discover never reached ${h} — check the route from ${rd.label} to the server`); continue; }
      const sv = go.final.dev, sIf = go.final.ios || go.final.svi;
      if (!sv.env || !sv.env.dhcp || !sIf){ log.push(`&nbsp;&nbsp;· ${h} answered, but it isn't running a DHCP server`); continue; }
      if (sv.env.serviceDhcp===false){ log.push(`&nbsp;&nbsp;· ${sv.label} has <b>no service dhcp</b> — it ignores the request`); continue; }
      if (!D.poolFor(sv.env.dhcp, i.ip)){ log.push(`&nbsp;&nbsp;· ${sv.label} got the relayed Discover, but none of its pools covers giaddr ${i.ip} — no Offer`); continue; }
      const back = sendIp(B, nodeFromFinal(B, go.final), i.ip, "DHCP Offer (to the relay)", {src:h, proto:"udp", sport:67, dport:67}); frames.push(...back.frames); log.push(...back.log);
      if (!back.ok){ log.push(`&nbsp;&nbsp;· ${sv.label} has no route back to the relay address ${i.ip} — its Offer never arrives`); continue; }
      found = {srv:sv, srvIp:sv.env.intfs[sIf].ip, via:i.ip, relay:rd, iface:"Unknown", near:routerNodeFor(rd, ifn), key:rd.id}; break; }
    if (found) break;
  }
  return found; };
  let found = search(), o = null, pool = null, st = null, q = null, nf = null, nm = null, by = null;
  for (let tries = 0; found && tries < 5; tries++){
    st = found.srv.env.dhcp; pool = window.DHCP.poolFor(st, found.via);
    q = {mac:c.mac, cid:c.cid, via:found.via, iface:found.iface, now:B.now, want:c.want || null,
      own: ip => Object.values(found.srv.env.intfs).some(x=>x.ip===ip),
      inUse: ip => { const ow = ipOwner(B, ip); return !!ow && ow.dev!==d; }};
    o = D.offer(st, q);
    for (const m of (o.logs||[])){ syslog(B, found.srv, m, true); log.push(`&nbsp;&nbsp;· ${found.srv.label} pings each address before offering it — this one answered, so it logs <code>${m}</code>, sets it aside as a conflict and tries the next`); }
    if (o.err) break;
    nf = fromOf(found.near); nm = found.near.mac; by = found.relay ? `${found.relay.label} (relaying for ${found.srv.label})` : found.srv.label;
    const ofr = {src:nm, dst:c.mac, kind:"dhcp", label:"Offer"}, of = deliver(B, nf, ofr, B.step);
    dlog(B, frames, log, of, `<b>DHCP Offer</b> from ${by}: "you can have ${o.ip} ${o.mask}${o.routers[0] ? ", gateway " + o.routers[0] : ", no default gateway"}${o.dns.length ? ", DNS " + o.dns.join(", ") : ""}, lease ${leaseText(o.leaseMs)}" (pool ${pool.name})`);
    if (of.recv.some(r=>r.dev===d)) break;
    log.push(`&nbsp;&nbsp;· the Offer from ${found.srv.label} never reaches ${c.label}${ofr.snoopDropped ? " (DHCP snooping on " + ofr.snoopDropped + " dropped it)" : ""}`); skip.add(found.key || found.srv.id); found = search(); o = null; }
  if (!found){ log.push(c.who==="IOS" ? "No DHCP Offer came back — the interface stays unassigned and IOS keeps asking" : "No DHCP Offer came back. Windows keeps trying and meanwhile gives itself an <b>APIPA</b> address (169.254.x.x, mask 255.255.0.0) — usable only with other APIPA hosts on the same link"); return {ok:false, frames, log, why:"nooffer"}; }
  if (o.err){ log.push(o.err==="exhausted" ? `${found.srv.label}: pool <b>${pool.name}</b> has no free address left (every one is leased, excluded or in conflict) — no Offer` : "No Offer"); return {ok:false, frames, log, why:o.err}; }
  if (false) dlog(B, frames, log, deliver(B, nf, {src:nm, dst:c.mac, kind:"dhcp", label:"Offer"}, B.step), `<b>DHCP Offer</b> from ${by}: "you can have ${o.ip} ${o.mask}${o.routers[0] ? ", gateway " + o.routers[0] : ", no default gateway"}${o.dns.length ? ", DNS " + o.dns.join(", ") : ""}, lease ${leaseText(o.leaseMs)}" (pool ${pool.name})`);
  const rqf = {src:c.mac, dst:BCAST, kind:"dhcp", label:"Request"};
  dlog(B, frames, log, deliver(B, ref, rqf, B.step), `<b>DHCP Request</b> (broadcast again) from ${c.label}: "I'll take ${o.ip} from server ${found.srvIp}" — broadcast, so any other server that made an offer knows it wasn't chosen`);
  if (found.relay) log.push(`&nbsp;&nbsp;· ${found.relay.label} relays the Request to the server too`);
  D.bind(st, q, o);
  dlog(B, frames, log, deliver(B, nf, {src:nm, dst:c.mac, kind:"dhcp", label:"Ack"}, B.step), `<b>DHCP Ack</b> from ${by}: lease confirmed — ${c.label} now uses ${o.ip}`);
  apply(o, found);
  // DHCP snooping records who got which address on which port — DAI checks ARP against this table
  const sc = rqf.snoopClient || df.snoopClient; if (sc){ const E = sc.sw.env; E.snoopBind = E.snoopBind || {}; E.snoopBind[c.mac] = {mac:c.mac, ip:o.ip, vlan:sc.vlan, iface:sc.ios, lease: o.leaseMs==null ? 4294967295 : Math.round(o.leaseMs/1000) - 98}; log.push(`&nbsp;&nbsp;· ${sc.sw.label} adds a DHCP snooping binding: ${c.mac} = ${o.ip} on ${shortIf(sc.ios)}, VLAN ${sc.vlan}`); }
  return {ok:true, frames, log, ip:o.ip, server:found.srvIp};
}
function dhcpRenew(B, d){
  B_ctx.B = B; B.step = 0; const frames = [], log = [], sv = B.devs[d.lease.srvId], D = window.DHCP;
  B._snoopRenew = null; B._snoopDrop = null;
  const go = sendIp(B, hostNode(d), d.lease.server, "DHCP Request (renew)", {src:d.ip, proto:"udp", sport:68, dport:67}); frames.push(...go.frames);
  log.push(`<b>DHCP Request</b> (unicast renewal) from ${d.label} to ${d.lease.server}: "may I keep ${d.ip}?" — with a lease in hand there's no Discover or Offer`, ...go.log);
  if (!go.ok || !sv || !sv.env || !sv.env.dhcp || sv.env.serviceDhcp===false){ log.push("&nbsp;&nbsp;· no answer from the server — the PC keeps its address until the lease runs out"); return {ok:false, frames, log}; }
  const st = sv.env.dhcp, pool = D.poolFor(st, d.ip);
  const taken = st.bindings.find(b=>b.ip===d.ip && b.mac!==d.mac) || (st.excluded||[]).some(x=>{ const n = ipToInt(d.ip); return n>=x[0] && n<=x[1]; });
  const other = st.bindings.find(b=>b.ip===d.ip && b.mac!==d.mac);
  if (!pool || taken){ log.push(`<b>DHCP NAK</b> from ${sv.label}: ${d.ip} ${!pool ? "isn't in any of its pools any more" : other ? "belongs to another client now" : "is now an excluded address"} — the PC drops it and starts again with a Discover`);
    st.bindings = st.bindings.filter(b=>!(b.mac===d.mac && b.ip===d.ip)); d.lastIp = null;   // the server forgets the refused lease
    d.ip = null; d.mask = null; d.gw = null; return {ok:false, nak:true, frames, log}; }
  const o = { ip:d.ip, mask:d.mask, routers:pool.routers.slice(), dns:pool.dns.slice(), domain:pool.domain, leaseMs: pool.lease==="infinite" ? null : ((pool.lease[0]*24 + pool.lease[1])*60 + pool.lease[2]) * 60000, pool:pool.name };
  D.bind(st, {mac:d.mac, iface: (st.bindings.find(b=>b.mac===d.mac)||{}).iface || "Unknown", now:B.now}, o);
  const back = sendIp(B, nodeFromFinal(B, go.final), d.ip, "DHCP Ack", {src:d.lease.server, proto:"udp", sport:67, dport:68}); frames.push(...back.frames);
  if (!back.ok){ log.push(`<b>DHCP Ack</b> from ${sv.label} never reaches ${d.label}${B._snoopDrop ? " (" + B._snoopDrop + "'s DHCP snooping dropped it)" : ""} — the PC keeps its address and tries again later`, ...back.log); return {ok:false, frames, log}; }
  log.push(`<b>DHCP Ack</b> from ${sv.label}: lease renewed for ${leaseText(o.leaseMs)}`, ...back.log);
  { const r0 = B._snoopRenew; if (r0 && r0.mac===d.mac){ const E = r0.sw.env; E.snoopBind = E.snoopBind || {}; E.snoopBind[d.mac] = {mac:d.mac, ip:d.ip, vlan:r0.vlan, iface:r0.ios, lease: o.leaseMs==null ? 4294967295 : Math.round(o.leaseMs/1000) - 98};
      log.push(`&nbsp;&nbsp;· ${r0.sw.label} DHCP snooping refreshes its binding: ${d.ip} ↔ ${d.mac} on ${shortIf(r0.ios)}`); } }
  d.gw = o.routers[0] || null; d.dns = o.dns.slice(); d.domain = o.domain || null;
  d.lease = Object.assign({}, d.lease, {obtained:B.now, expires: o.leaseMs==null ? null : B.now + o.leaseMs});
  return {ok:true, frames, log};
}
function dhcpRelease(B, d){
  const frames = [], log = [];
  if (d.lease && d.ip){ B_ctx.B = B; B.step = 0; const go = sendIp(B, hostNode(d), d.lease.server, "DHCP Release"); frames.push(...go.frames);
    log.push(`<b>DHCP Release</b> (unicast) from ${d.label} to ${d.lease.server}: "I'm giving back ${d.ip}"`, ...go.log);
    const sv = B.devs[d.lease.srvId]; if (go.ok && sv && sv.env && sv.env.dhcp) window.DHCP.release(sv.env.dhcp, d.mac); }
  d.ip = null; d.mask = null; d.gw = null; d.dns = []; d.domain = null; d.lease = null; B.arp[d.id] = {};
  return {frames, log};
}
// a PC set to "obtain automatically" asks again whenever the network changes (real Windows retries every few minutes)
// Wi-Fi: which APs have joined a controller (CAPWAP discovery), and which clients are associated, on which VLAN
// a radio's BSSID: derived from the AP's MAC (real APs use a base radio MAC, one BSSID per WLAN), not its Ethernet MAC
function radioMac(ap, wlanId){ const h = (ap.mac||"").replace(/\./g,""); if (h.length!==12) return ""; const b = h.match(/../g).map(x=>parseInt(x, 16));
  b[0] = (b[0] & 0xfe); b[4] = (b[4] + 0x30) & 255; b[5] = ((b[5] & 0xf0) + ((wlanId||1) - 1)) & 255; return b.map(x=>x.toString(16).padStart(2, "0")).join(":"); }
function computeWifi(B){
  if (!window.WLAN) return;
  const devs = B.order.map(i=>B.devs[i]), wlcs = devs.filter(d=>d.kind==="wlc" && d.on!==false), aps = devs.filter(d=>d.kind==="ap");
  B._joinEvents = B._joinEvents || [];
  for (const ap of aps){ const was = ap.joinedTo || null; ap.joinedTo = null; ap.joinLog = [];
    if (ap.on===false || !linkUpAt(B, hostNode(ap).ref)){ ap.joinLog = ["The AP has no link or no power — it takes PoE from its switch port (or a power injector)."]; continue; }
    let opt43 = [];
    if (ap.lease && B.devs[ap.lease.srvId] && B.devs[ap.lease.srvId].env){ const pool = window.DHCP.poolFor(B.devs[ap.lease.srvId].env.dhcp, ap.ip); if (pool && pool.opt43) opt43 = window.DHCP.capwapWlcs(pool.opt43); }
    for (const w of wlcs){ const keep = [B.frames, B.log, B.step]; let r;
      try { r = window.WLAN.discover({ap:{ip:ap.ip, mask:ap.mask, gw:ap.gw, primary:ap.primary}, dhcpOpt43:opt43, wlcMgmt:w.ip, reach: ip => sendIp(B, hostNode(ap), ip, "CAPWAP discovery", {src:ap.ip, proto:"udp", sport:5246, dport:5246}).ok}); }
      finally { [B.frames, B.log, B.step] = keep; }
      ap.joinLog = r.steps; if (r.joined){ ap.joinedTo = w.id; ap.joinVia = r.via; break; } }
    for (const w of wlcs){ if (ap.joinedTo===w.id) w.wlc.aps[ap.label] = {mode:ap.apMode, ip:ap.ip, mac:ap.mac, model:ap.model}; else delete w.wlc.aps[ap.label]; }
    if (B._wifiReady && was!==(ap.joinedTo||null)) B._joinEvents.push(`<b>${ap.label} — CAPWAP</b>: ${ap.joinedTo ? "joined " + B.devs[ap.joinedTo].label + " (" + ap.joinVia + ")" : was ? "lost its controller" : "can't join a controller"}`, ...ap.joinLog.map(l=>"&nbsp;&nbsp;· " + l)); }
  for (const c of devs){ if (!c.wifi || c.on===false){ if (c.wifiAt){ c.wifiAt = null; c._wifiKey = ""; } continue; }
    const wired = c.ports.some(p=>p.type==="rj45" && cableAt(B, c.id+":"+p.id));
    const ap = c.wifi.ap ? B.devs[c.wifi.ap] : (aps.find(a=>a.joinedTo) || aps[0]), wlc = ap && ap.joinedTo ? B.devs[ap.joinedTo] : null;
    const serving = ap && !["monitor","sniffer"].includes(ap.apMode);
    const res = !c.wifi.ssid ? {ok:false, reason:"none", win:"Not connected", why:"No Wi-Fi network chosen."} : ap && !serving ? {ok:false, reason:"ap-mode", win:"The network isn't listed.", why:`${ap.label} is in ${ap.apMode} mode — its radios ${ap.apMode==="monitor" ? "scan every channel" : "capture frames on one channel"} instead of serving clients.`} : window.WLAN.associate(wlc ? wlc.wlc : window.WLAN.store(), !!wlc, {ssid:c.wifi.ssid, key:c.wifi.key, wpa3:c.wifi.wpa3, wpa2:c.wifi.wpa2});
    c.wifiRes = Object.assign({}, res, {ap: ap && ap.id}); let at = null;
    if (res.ok && !wired){ const iface = window.WLAN.ifaceOf(wlc.wlc, res.wlan), flex = ap.apMode==="flexconnect" && !!res.wlan.flexLocal;
      const up = wlc.ports.find(p=>cableAt(B, wlc.id+":"+p.id)) || wlc.ports[0];
      at = {ref: flex ? hostNode(ap).ref : wlc.id+":"+up.id, tag: iface.vlan ? iface.vlan : null, ap:ap.id, wlc:wlc.id, wlan:res.wlan.id, ssid:res.wlan.ssid, vlan:iface.vlan||0, dhcpServer:iface.dhcp||null, flex, ifaceName:iface.name, auth:res.auth, cipher:res.cipher}; }
    const key = at ? [at.ref, at.tag, at.wlan, at.dhcpServer||"", at.ifaceName].join("|") : "";
    if (key!==(c._wifiKey||"")){ c._wifiKey = key; if (c.dhcp){ c.ip = null; c.mask = null; c.gw = null; c.lease = null; } c._dhcpTried = null; B.arp[c.id] = {}; }
    c.wifiAt = at; }
}
function autoDhcp(B){
  if (!window.DHCP) return;
  for (const id of B.order){ const d = B.devs[id]; if (d.env || d.kind==="hub" || !d.dhcp || d.ip || d.released || d.on===false) continue;
    if (d._dhcpTried===B._l3.sig) continue; d._dhcpTried = B._l3.sig;
    const keep = [B.frames, B.log, B.step]; try { dora(B, d); } finally { [B.frames, B.log, B.step] = keep; } }
  for (const id of B.order){ const r = B.devs[id]; if (!r.env || r.kind!=="router" || r.on===false) continue;
    for (const [n, i] of Object.entries(r.env.intfs)){ if (!i.dhcpClient || i.ip || i.shut || !r.env.isUp(n)) continue;
      // remember the attempt OUTSIDE the router config: a marker in the config would change the network signature and retry forever
      const T = B._rtrDhcpTried = B._rtrDhcpTried || {}, k = id + "|" + n; if (T[k]===B._l3.sig) continue; T[k] = B._l3.sig;
      const keep = [B.frames, B.log, B.step]; try { routerDora(B, r, n); } finally { [B.frames, B.log, B.step] = keep; } } }
}
const WDAY = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], WMON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const winTime = ms => { const t = new Date(ms); let h = t.getUTCHours(); const ap = h<12 ? "AM" : "PM"; h = h%12 || 12;
  return `${WDAY[t.getUTCDay()]}, ${WMON[t.getUTCMonth()]} ${t.getUTCDate()}, ${t.getUTCFullYear()} ${h}:${String(t.getUTCMinutes()).padStart(2,"0")}:${String(t.getUTCSeconds()).padStart(2,"0")} ${ap}`; };

/* ---- IP services: NTP, DNS, TFTP, syslog servers, SNMP ---- */
const routerFrom = d => d.kind==="router" || (d.env && d.env.ipRouting) ? {dev:d} : (()=>{ const svi = Object.keys(d.env.intfs).find(n=>n.startsWith("Vlan") && d.env.intfs[n].ip && !d.env.intfs[n].shut); return svi ? sviNode(d, svi) : {dev:d}; })();
// a UDP request/reply between two devices (no frames or log kept): both directions must route
function udpTwoWay(B, fromNode, ip, port){
  const keep = [B.frames, B.log, B.step]; try {
    const rt = !fromNode.ip && fromNode.dev.env && fromNode.dev.env.lookup ? fromNode.dev.env.lookup(ip) : null, srcIp = fromNode.ip || (rt ? fromNode.dev.env.intfs[rt.ios].ip : null);   // a router sends from the interface towards the target
    if (!srcIp) return {ok:false};
    const sp = port===123 ? 123 : 49152;
    const go = sendIp(B, fromNode, ip, "UDP request", {src:srcIp, proto:"udp", sport:sp, dport:port||0}); if (!go.ok) return {ok:false, kind:go.kind};
    const back = sendIp(B, nodeFromFinal(B, go.final), go.pkt ? go.pkt.src : srcIp, "UDP reply", {src:go.dst || ip, proto:"udp", sport:port||0, dport:go.pkt ? go.pkt.sport : sp});
    const via = fromNode.dev.env && fromNode.dev.env.lookup && fromNode.dev.env.lookup(ip) ? fromNode.dev.env.lookup(ip).ios : null;
    return {ok: back.ok && !!back.final && back.final.dev===fromNode.dev, final: go.final, srcIp, via};
  } finally { [B.frames, B.log, B.step] = keep; }
}
// NTP: a router is synchronised if it is a master, or one of its servers answers and is itself synchronised (stratum + 1)
function ntpOf(B, d, depth){
  const E = d.env, key = (B._l3 ? B._l3.sig : "") + "|" + d.id; B._ntp = B._ntp || {}; if (B._ntp[key] && depth===0) return B._ntp[key];
  const res = {synced:false, stratum:16, ref:null, peers:[]};
  if (E.ntpMaster!=null){ res.synced = true; res.stratum = E.ntpMaster; res.ref = "127.127.1.1"; }
  if (depth < 4) for (const ip of (E.ntpServers||[])){
    const pe = {ip, reach:false, stratum:16, ref:".INIT."}; res.peers.push(pe);
    const o = ipOwner(B, ip); if (!o) continue;
    const w = udpTwoWay(B, routerFrom(d), ip, 123); if (!w.ok) continue;
    let up = null; if (o.dev.env) up = ntpOf(B, o.dev, depth+1); else if (o.dev.services && o.dev.services.ntp) up = {synced:true, stratum: o.dev.services.ntp.stratum || 1, ref: o.dev.services.ntp.ref || ".GPS."};
    if (!up || !up.synced) { pe.reach = true; pe.stratum = 16; pe.ref = ".INIT."; continue; }
    pe.reach = true; pe.stratum = up.stratum; pe.ref = up.ref;
    if (up.stratum + 1 < res.stratum){ res.synced = true; res.stratum = up.stratum + 1; res.ref = ip; for (const q of res.peers) q.sys = false; pe.sys = true; } }
  if (res.ref==="127.127.1.1") res.peers.forEach(q=>q.sys = false);
  if (depth===0) B._ntp[key] = res; return res;
}
// DNS: who answers a query for <name> sent to <ip>: a server with DNS records, or a router with "ip dns server" (host table, then its own name servers)
function dnsAnswer(B, dev, name, depth){
  const nm = name.toLowerCase();
  if (!dev.env){ const z = dev.services && dev.services.dns; if (!z) return {refused:true}; const recs = z.records || {}; const ip = recs[nm];
    return ip ? {ip, auth: z.authoritative!==false} : {nx:true}; }
  if (!dev.env.dnsServer) return {refused:true};
  const h = dev.env.iosHosts && (dev.env.iosHosts[nm] || dev.env.iosHosts[nm.split(".")[0]]); if (h) return {ip:h, auth:false};
  if (depth < 2 && dev.env.domainLookup!==false) for (const ip of (dev.env.nameServers||[])){ const r = dnsAsk(B, routerFrom(dev), ip, nm, depth+1); if (r.reach) return r.ip ? {ip:r.ip, auth:false} : {nx:true}; }
  return {nx:true};
}
function dnsAsk(B, fromNode, ip, name, depth){
  const o = ipOwner(B, ip); if (!o) return {reach:false};
  const w = udpTwoWay(B, fromNode, ip, 53); if (!w.ok) return {reach:false};
  const a = dnsAnswer(B, o.dev, name, depth); if (a.refused) return {reach:false, refused:true, server:ip};
  return {reach:true, ip:a.ip||null, auth:!!a.auth, nx:!!a.nx, server:ip, srvName: o.dev.services && o.dev.services.dns && o.dev.services.dns.name};
}
// Windows: add the connection's DNS suffix to a single-label name, ask the DNS servers in order
function resolveWin(B, d, name){
  const fq = !name.includes(".") && d.domain ? (name + "." + d.domain).toLowerCase() : name.toLowerCase();
  if (!d.ip || !(d.dns||[]).length) return {ip:null, fq, why:"noserver"};
  for (const ip of d.dns){ const r = dnsAsk(B, hostNode(d), ip, fq, 0); if (r.reach){ if (r.ip){ d.dnsCache = d.dnsCache || {}; d.dnsCache[fq] = r.ip; } return Object.assign(r, {fq}); } }
  return {ip:null, fq, why:"timeout", server:d.dns[0]};
}
function nslookupText(B, d, name, server){
  const srv = server || (d.dns||[])[0];
  if (!srv) return "*** Default servers are not available\nServer:  UnKnown\nAddress:  ::1\n\n*** UnKnown can't find " + name + ": No response from server";
  const fq = !name.includes(".") && d.domain ? (name + "." + d.domain).toLowerCase() : name.toLowerCase();
  const r = d.ip ? dnsAsk(B, hostNode(d), srv, fq, 0) : {reach:false};
  const head = `Server:  ${r.srvName || "UnKnown"}\nAddress:  ${srv}\n\n`;
  const to = "DNS request timed out.\n    timeout was 2 seconds.\n";
  if (!r.reach && r.refused) return head + `*** UnKnown can't find ${name}: No response from server`;
  if (!r.reach) return to + "Server:  UnKnown\nAddress:  " + srv + "\n\n" + to.repeat(4) + "*** Request to UnKnown timed-out";
  if (!r.ip) return head + `*** ${r.srvName || "UnKnown"} can't find ${name}: Non-existent domain`;
  return head + (r.auth ? "" : "Non-authoritative answer:\n") + `Name:    ${fq}\nAddress:  ${r.ip}\n`;
}
// TFTP: the router copies to/from a server running a TFTP service, if both directions route
function tftpTarget(B, d, host){
  let ip = host; if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)){ const r = d.env.resolveName ? d.env.resolveName(host) : {}; ip = r.ip; } if (!ip) return {ok:false};
  const o = ipOwner(B, ip); if (!o || o.dev.env || !o.dev.services || !o.dev.services.tftp) { const w0 = o ? udpTwoWay(B, routerFrom(d), ip, 69) : null; return {ok:false, why: w0 && w0.ok ? "refused" : "timeout"}; }
  const w = udpTwoWay(B, routerFrom(d), ip, 69); if (!w.ok) return {ok:false, why:"timeout"};
  return {ok:true, srv:o.dev, via:w.via};
}
// what a syslog server / SNMP manager has received: messages addressed to it, from routers that can reach it (UDP, one way)
function oneWay(B, d, ip, port){ const keep = [B.frames, B.log, B.step]; try { const n = routerFrom(d), rt = d.env.lookup ? d.env.lookup(ip) : null, src = rt && d.env.intfs[rt.ios] ? d.env.intfs[rt.ios].ip : null;
  const go = sendIp(B, n, ip, "UDP", src ? {src, proto:"udp", sport:port, dport:port} : null); return go.ok; } finally { [B.frames, B.log, B.step] = keep; } }
function received(B, srv, kind){
  const out = []; if (!srv.ip) return out;
  for (const id of B.order){ const d = B.devs[id]; if (!d.env) continue; const L = (B.syslog[id]||[]).filter(x=>(kind==="trap" ? x.trap : x.to||[]).includes(srv.ip)); if (!L.length) continue;
    if (!oneWay(B, d, srv.ip, kind==="trap" ? 162 : 514)) continue; const r = d.env.lookup ? d.env.lookup(srv.ip) : null; const src = r && d.env.intfs[r.ios] ? d.env.intfs[r.ios].ip : "?";
    for (const x of L) out.push({from:d.label, src, t:x.t, msg:x.msg, sev:x.sev}); }
  return out;
}
// SNMP tools on a management server (Net-SNMP): snmpget / snmpwalk / snmpset -v2c -c <community> <agent> <object>
const SNMPOBJ = { sysDescr:"SNMPv2-MIB::sysDescr", sysUpTime:"DISMAN-EVENT-MIB::sysUpTimeInstance", sysContact:"SNMPv2-MIB::sysContact", sysName:"SNMPv2-MIB::sysName", sysLocation:"SNMPv2-MIB::sysLocation", ifDescr:"IF-MIB::ifDescr", ifOperStatus:"IF-MIB::ifOperStatus", ifAdminStatus:"IF-MIB::ifAdminStatus" };
function snmpTool(B, d, raw){
  const t = raw.trim().split(/\s+/), cmd = t[0].toLowerCase(); let ver = null, comm = null; const rest = [];
  for (let k = 1; k < t.length; k++){ if (t[k]==="-v"){ ver = t[++k]; continue; } if (/^-v/.test(t[k])){ ver = t[k].slice(2); continue; } if (t[k]==="-c"){ comm = t[++k]; continue; } rest.push(t[k]); }
  const agent = rest[0], objs = rest.slice(1);
  if (!agent || !comm) return `USAGE: ${cmd} [OPTIONS] AGENT OID [OID]...\n  -v 1|2c|3\t\tspecifies SNMP version to use\n  -c COMMUNITY\t\tset the community string`;
  if (ver!=="2c" && ver!=="1") return "snmp: this lab supports -v2c (and -v1)";
  const timeout = `Timeout: No Response from ${agent}${cmd==="snmpget" ? "." : ""}`;
  const o = ipOwner(B, agent); if (!o || !o.dev.env || !d.ip) return timeout;
  const R = o.dev, E = R.env, c = E.snmp && E.snmp.communities[comm];
  if (!udpTwoWay(B, hostNode(d), agent, 161).ok || !Object.keys(E.snmp.communities).length) return timeout;
  const S = E.snmpStats = E.snmpStats || {}; S.inp = (S.inp||0) + 1;
  if (!c){ S.badComm = (S.badComm||0) + 1; return timeout; }
  if (c.acl && window.ACL && E.acl.lists[c.acl] && !window.ACL.check(E.acl, c.acl, {src:d.ip}, false).permit) return timeout;
  const nIf = Object.keys(E.intfs).filter(n=>!n.startsWith("Port-channel")).length + 1, walkN = !objs[0] || objs[0]==="mib-2" ? 5 + 3*nIf + 1 : /system/.test(objs[0]) ? 6 : nIf + 1;   // a walk is one GetNext per object, plus the one that runs past the end
  const pdus = cmd==="snmpwalk" ? walkN : 1; S.inp += pdus - 1; S.out = (S.out||0) + pdus; S.resp = (S.resp||0) + pdus; S.vars = (S.vars||0) + (cmd==="snmpget" ? Math.max(1, objs.length) : pdus);
  if (cmd==="snmpget") S.get = (S.get||0) + 1; else if (cmd==="snmpwalk") S.next = (S.next||0) + pdus; else { S.set = (S.set||0) + 1; if (c.mode==="rw") S.altered = (S.altered||0) + 1; }
  const ifs = Object.keys(E.intfs).filter(n=>!n.startsWith("Port-channel")).concat(["Null0"]), val = (base, idx) => {
    if (base==="sysDescr") return "STRING: Cisco IOS Software [Cupertino], ISR Software (X86_64_LINUX_IOSD-UNIVERSALK9-M), Version 17.9.4a, RELEASE SOFTWARE (fc3)";
    if (base==="sysUpTime") return "Timeticks: (1234567) 3:25:45.67";
    if (base==="sysContact") return "STRING: " + (E.snmp.contact||""); if (base==="sysLocation") return "STRING: " + (E.snmp.location||"");
    if (base==="sysName") return "STRING: " + E.host + (E.domain ? "." + E.domain : "");
    const n = ifs[idx-1]; if (!n) return null;
    if (base==="ifDescr") return "STRING: " + n;
    if (n==="Null0") return base==="ifDescr" ? "STRING: Null0" : "INTEGER: up(1)";
    if (base==="ifAdminStatus") return E.intfs[n].shut ? "INTEGER: down(2)" : "INTEGER: up(1)";
    if (base==="ifOperStatus") return E.isUp(n) ? "INTEGER: up(1)" : "INTEGER: down(2)"; return null; };
  const parse = s => { const m = String(s).replace(/^[A-Za-z0-9-]+::/, "").match(/^(\w+)(?:\.(\d+))?$/); return m && SNMPOBJ[m[1]] ? {base:m[1], idx: m[2]==null ? null : +m[2]} : null; };
  const line = (base, idx) => { const v = val(base, idx); const nm = base==="sysUpTime" ? SNMPOBJ[base] : `${SNMPOBJ[base]}.${idx}`; return v==null ? `${nm} = No Such Instance currently exists at this OID` : `${nm} = ${v}`; };
  if (cmd==="snmpwalk"){ const w = objs[0] ? objs[0].replace(/^[A-Za-z0-9-]+::/, "") : "mib-2";
    const bases = w==="system" ? ["sysDescr","sysUpTime","sysContact","sysName","sysLocation"] : w==="mib-2" ? ["sysDescr","sysUpTime","sysContact","sysName","sysLocation","ifDescr","ifAdminStatus","ifOperStatus"] : SNMPOBJ[w] ? [w] : null; if (!bases) return `${objs[0]}: Unknown Object Identifier`;
    return bases.flatMap(b=> b.startsWith("if") ? ifs.map((_,k)=>line(b, k+1)) : [line(b, 0)]).join("\n"); }
  if (cmd==="snmpget"){ if (!objs.length) return "snmpget: Missing object name"; return objs.map(x=>{ const q = parse(x); if (!q) return `${x}: Unknown Object Identifier`; return line(q.base, q.idx==null ? 0 : q.idx); }).join("\n"); }
  if (cmd==="snmpset"){ const q = parse(objs[0]||""), ty = objs[1], v = objs.slice(2).join(" ").replace(/^"|"$/g, "");
    if (!q || ty!=="s" || !v) return "snmpset: usage: snmpset ... AGENT OID TYPE VALUE   (e.g. sysLocation.0 s \"Lagos HQ, rack 2\")";
    if (c.mode!=="rw"){ S.illegal = (S.illegal||0) + 1; } if (c.mode!=="rw") return `Error in packet.\nReason: noAccess\nFailed object: ${SNMPOBJ[q.base]}.${q.idx||0}`;
    if (q.base==="sysLocation") E.snmp.location = v; else if (q.base==="sysContact") E.snmp.contact = v; else if (q.base==="sysName") E.host = v.split(".")[0];
    else return `Error in packet.\nReason: notWritable (That object does not support modification)\nFailed object: ${SNMPOBJ[q.base]}.${q.idx||0}`;
    return `${SNMPOBJ[q.base]}.${q.idx||0} = STRING: ${v}`; }
  return null;
}

// a TCP handshake: SYN out, SYN-ACK back (both must pass every ACL and route); NAT and port forwards apply
function tcpConnect(B, from, ip, port){ B_ctx.B = B; B.step = 0; computeL3(B);
  const go = sendIp(B, from, ip, `TCP SYN to port ${port}`, {src:from.ip, proto:"tcp", sport:51000, dport:port});
  if (!go.ok) return {ok:false, kind:go.kind, frames:go.frames, log:go.log};
  const back = sendIp(B, nodeFromFinal(B, go.final), go.pkt.src, "TCP SYN-ACK", {src:go.dst || ip, proto:"tcp", sport:go.pkt.dport, dport:go.pkt.sport, ack:true});
  const ok = back.ok && !!back.final && back.final.dev===from.dev;
  const final = go.final, owner = final.dev.env ? {dev:final.dev, ios:final.ios||final.svi} : {dev:final.dev};
  return {ok, kind: ok ? "ok" : back.kind, frames:go.frames.concat(back.frames), log:go.log.concat(back.log), owner, port: go.pkt.dport, src: go.pkt.src};
}
// Windows curl.exe against a web server (services:{web:{title, port}}) — HTTP over TCP, through ACLs and NAT
function curlCmd(B, d, raw){
  const m = raw.trim().match(/^curl(?:\.exe)?\s+(?:-\S+\s+)*(?:(https?):\/\/)?([^\/\s:]+)(?::(\d+))?(\/\S*)?$/i);
  if (!m) return "curl: try 'curl --help' for more information";
  const scheme = (m[1]||"http").toLowerCase(), host = m[2], port = +(m[3] || (scheme==="https" ? 443 : 80));
  let ip = host; if (ipToInt(host)==null){ const r = resolveWin(B, d, host); if (!r.ip) return `curl: (6) Could not resolve host: ${host}`; ip = r.ip; }
  if (!d.ip) return `curl: (7) Failed to connect to ${host}:${port} after 0 ms: Could not connect to server`;
  const t = tcpConnect(B, hostNode(d), ip, port); B.frames = t.frames; B.log = t.log;
  if (!t.ok) return t.kind==="prohib" ? `curl: (28) Failed to connect to ${host}:${port} after 21045 ms: Could not connect to server` : `curl: (28) Failed to connect to ${host}:${port} after 21037 ms: Could not connect to server`;
  const w = t.owner && t.owner.dev.services && t.owner.dev.services.web, wport = w ? (w.port || 80) : null;
  if (!w || wport!==t.port) return `curl: (7) Failed to connect to ${host}:${port} after 2049 ms: Could not connect to server`;
  if (scheme==="https") return `curl: (35) schannel: next InitializeSecurityContext failed: SEC_E_INTERNAL_ERROR (0x80090304) - The Local Security Authority cannot be contacted`;
  B.log.push(`<b>HTTP</b> GET ${m[4]||"/"} → ${t.owner.dev.label} answers 200 OK`); (B.fetched = B.fetched || {})[d.id+">"+host] = true; if (host!==ip) B.fetched[d.id+">"+ip] = true;
  return `<!DOCTYPE html>\n<html><head><title>${w.title||t.owner.dev.label}</title></head>\n<body><h1>${w.title||t.owner.dev.label}</h1><p>${w.body||"It works."}</p></body></html>`;
}

/* ---- hooks the IOS engine calls ---- */
function makeHooks(B, d){
  const l3 = () => computeL3(B), os = v => l3().ospf[v ? d.id+"#"+v : d.id] || null, allOs = () => Object.entries(l3().ospf).filter(([k])=>k===d.id || k.startsWith(d.id+"#")).map(([,v])=>v);
  return {
    settle: () => { if (B._ready) computeL3(B); }, ready: () => !!B._ready,
    ospfRoutes: v => (os(v) || {}).routes || [],
    ra: ios => (l3().ra || {})[d.id+"|"+ios] || null,
    nd6: () => Object.entries(B.nd[d.id]||{}).map(([addr, e])=>({addr, mac:e.mac, ios:e.ios})),
    ping6: (ip, outIf, src) => ping6(B, d, ip, outIf, src),
    trace6: ip => { const t = trace6(B, d, ip); const U = a => I6().str(I6().parse(a), true);
      return iosTraceText({hops:t.hops.map(U), ok:t.ok, kind:t.kind, silent:t.silent, v6:true}, U(ip)).replace("VRF info: (vrf in name/id, vrf out name/id)\n", "\n"); },
    ospfNbrs: () => allOs().flatMap(o=>o.nbrs || []),
    ospfIf: ios => { for (const o of allOs()) if ((o.ifs || {})[ios]) return o.ifs[ios]; return null; },
    ospfSelf: v => { const o = os(v); return o ? {abr:o.abr, spfRuns:o.spfRuns} : null; },
    ospfLsdb: v => (os(v) || {}).lsdb || null,
    hsrp: (ios, g) => l3().hsrp[d.id+"|"+ios+"#"+g] || null,
    trace: (ip, src, vrf) => { const node = (d.kind==="router" || d.env.ipRouting) ? (src ? {dev:d, ip:src, vrf:vrf||null} : {dev:d, vrf:vrf||null}) : (()=>{ const svi = Object.keys(d.env.intfs).find(n=>n.startsWith("Vlan") && d.env.intfs[n].ip && !d.env.intfs[n].shut); return svi ? sviNode(d, svi) : null; })();
      if (!node) return iosTraceText({hops:[], ok:false, kind:"timeout"}, ip); const t = trace(B, node, ip); B.traced = Object.assign(B.traced||{}, {[d.id+">"+(vrf ? vrf+":" : "")+ip]: t.ok}); return iosTraceText(t, ip); },
    linkUp: name => { if (name.startsWith("Port-channel")){ const S = l2State(B); const G = (S.bundles[d.id]||{})[+name.slice(12)]; return !!(G && G.up); } const ref = refOfIos(d, name); return !!(ref && linkUpAt(B, ref)); },
    ping: (ip, src, vrf) => {
      if (d.kind==="router" || d.env.ipRouting){ const res = ping(B, src ? {dev:d, ip:src, vrf:vrf||null} : {dev:d, vrf:vrf||null}, ip); markPing(B, d.id+">"+(vrf ? vrf+":" : "")+ip, res.ok); return res; }
      const svi = Object.keys(d.env.intfs).find(n=>n.startsWith("Vlan") && d.env.intfs[n].ip && !d.env.intfs[n].shut);
      if (!svi) return {ok:false};
      const res = ping(B, sviNode(d, svi), ip); markPing(B, d.id+">"+ip, res.ok); return res;
    },
    mac: () => Object.values(B.mac[d.id]||{}).filter(e=>e.port.startsWith("po") || linkUpAt(B, d.id+":"+e.port)).map(e=>({vlan:e.vlan, mac:e.mac, type: (()=>{ const pp = !e.port.startsWith("po") && d.ports.find(q=>q.id===e.port), ii = pp && d.env.intfs[pp.ios]; return ii && ii.psec && (ii.psecMacs||[]).some(m=>m.mac===e.mac) ? "STATIC" : "DYNAMIC"; })(), port: e.port.startsWith("po") ? "Po"+e.port.slice(2) : shortIf(d.ports.find(p=>p.id===e.port).ios)})).sort((a,b)=>a.vlan-b.vlan||a.port.localeCompare(b.port)),
    clearMac: () => { B.mac[d.id] = {}; },
    arp: () => Object.entries(B.arp[d.id]||{}).map(([k,e])=>{ const [ip, vrf] = k.split("%"); return {ip, vrf: vrf || null, mac:e.mac, intf:e.intf, age:"0"}; }),
    cdp: () => {
      const out = [];
      for (const p of d.ports){ if (!p.ios) continue; const c = cableAt(B, d.id+":"+p.id); if (!c || !linkState(B,c).up) continue;
        const far = P(B, otherEnd(c, d.id+":"+p.id)); if (!far.dev.env || !far.dev.env.cdpRun) continue; const fi = far.dev.env.intfs[far.port.ios]; if (fi && fi.cdp===false) continue;
        const mg = Object.values(far.dev.env.intfs).find(i=>i.ip && !i.shut);
        out.push({ id: far.dev.env.host + (far.dev.env.domain ? "."+far.dev.env.domain : ""), local:p.ios, remote:far.port.ios, platform: far.dev.platform || (far.dev.kind==="router"?"C1111-4P":"C9200L"), cap: far.dev.kind==="router" ? "R I" : "S I", ip: mg && mg.ip });
      }
      return out;
    },
    sessions: () => Object.entries(B.remote).filter(([,r])=>r.env===d.env && !r.pendingAuth).map(([pc,r])=>({user:r.user||"", from:r.from, proto:r.proto, me: !!(d.env.viaVty && d.env.viaVty.ip===r.from && (d.env.viaVty.user||"")===(r.user||""))})),
    peer: name => { const ref = refOfIos(d, name); if (!ref) return null; const c = cableAt(B, ref); if (!c || CABLES[c.type].kind==="console") return null; const st = linkState(B, c); if (!st.up) return null;
      const f = P(B, otherEnd(c, ref)); if (!f.dev.env) return {kind:f.dev.kind}; const fi = f.dev.env.intfs[f.port.ios]; return {kind:f.dev.kind, mode: fi.mode, dtp: fi.dtp, nonegotiate: fi.nonegotiate}; },
    stp: v => { const S = l2State(B), x = S.stp[d.id] && S.stp[d.id][+v]; if (!x || !x.on) return null;
      const name = lp => lpIosName(d, lp);
      const ports = x.lps.map(l=>{ const r = x.roles[l.lp] || {role:"Desg", state:"FWD"}, inf = x.info[l.lp]; const i = lpIntf(d, l.lp);
        const edge = inf.edge && ((i.stp && (i.stp.portfast==="trunk" || (i.stp.portfast && lpOp(d, l.lp)!=="trunk"))) || (d.env.pfDefault && lpOp(d, l.lp)==="access"));
        return {name: name(l.lp), role: r.role, state: r.state, cost: inf.cost, prio: `${inf.pid.prio}.${inf.pid.num}`, type: r.inc ? `P2p *${r.inc===true ? "ROOT" : r.inc}_Inc` : edge ? "P2p Edge" : "P2p"}; })
        .sort((a,b)=>a.name.localeCompare(b.name, undefined, {numeric:true}));
      return { isRoot: x.isRoot, root: x.root, bridge: x.bridge, rootCost: x.rootCost, rootPort: x.rootLp ? name(x.rootLp) : null, rootPortNum: x.rootLp ? x.info[x.rootLp].pid.num : 0, ports }; },
    stpState: (name, v) => { const S = l2State(B); const p = d.ports.find(q=>q.ios===name); const lp = name.startsWith("Port-channel") ? "po"+name.slice(12) : p ? (S.bundles.memberOf[d.id+":"+p.id] || p.id) : null; return lp ? stpStateOf(S, d, lp, +v) : "FWD"; },
    ether: () => { const S = l2State(B); return Object.values(S.bundles[d.id]||{}).map(G=>({group:G.group, proto:G.proto, up:G.up, members:G.members.map(m=>({name:m.ios, flag:m.flag}))})); },
    logs: () => (B.syslog[d.id]||[]).slice(),
    emit: msg => syslog(B, d, msg, true),
    logNow: () => { const c1 = (B.clock||0) + 1; return (B.now || Date.UTC(2026, 9, 12, 8, 30)) + c1*7000 + (c1*137)%1000; },   // the time syslog() will stamp the next message with
    now: () => B.now || Date.UTC(2026, 9, 12, 8, 30),
    ntp: st => { computeL3(B); return ntpOf(B, d, 0); },   // refresh first: the cached answer is keyed to the network state
    dns: (name, servers) => { const fromNode = routerFrom(d); for (const ip of servers){ const r = dnsAsk(B, fromNode, ip, name, 0); if (r.reach) return {ip:r.ip, server:ip}; } return {ip:null, server:servers[0]}; },
    tftpPut: (host, file, body) => { const t = tftpTarget(B, d, host); if (!t.ok) return t; t.srv.services.tftp.files = t.srv.services.tftp.files || {}; t.srv.services.tftp.files[file] = body; return {ok:true, via:t.via}; },
    tftpGet: (host, file) => { const t = tftpTarget(B, d, host); if (!t.ok) return t; const f = (t.srv.services.tftp.files||{})[file]; return f==null ? {ok:false, why:"nofile"} : {ok:true, text:f, via:t.via}; },
    lldp: () => {
      const out = [];
      for (const p of d.ports){ if (!p.ios) continue; const c = cableAt(B, d.id+":"+p.id); if (!c || !linkState(B,c).up) continue;
        const far = P(B, otherEnd(c, d.id+":"+p.id)); if (!far.dev.env || !far.dev.env.lldpRun) continue;
        out.push({ id: far.dev.env.host, local:p.ios, remote:far.port.ios, cap: far.dev.kind==="router" ? "R" : "B" });
      }
      return out;
    },
    counters: name => {
      const ref = refOfIos(d, name); const c = ref && cableAt(B, ref); if (!c) return {};
      const s = linkState(B, c); if (!s.up) return {};
      const mine = c.a===ref ? s.dA : s.dB;
      const p = d.ports.find(p=>p.ios===name);
      const base = {speed:s.speed, duplex:mine, sfp: p && p.sfp ? SFPS[p.sfp].type : undefined};
      if (s.mismatch) return Object.assign(base, mine==="full" ? {crc:2871, runts:312, frame:41} : {late:1946, collisions:5810});
      return base;
    },
  };
}

/* ---- PC command prompt (and remote ssh/telnet sessions) ---- */
// one device CLI, several sessions: the console uses the device's own fields; a remote session keeps its context in r.ctx
const CTXK = env => [...new Set(["mode", "pending", "noEcho", "cur", "curList", "curLine", "curVlan", ...Object.keys(env).filter(k=>/^cur[A-Z]/.test(k))])];
const ctxSave = env => { const o = {}; for (const k of CTXK(env)) o[k] = env[k]; return o; };
const ctxLoad = (env, o) => { for (const k of CTXK(env)) env[k] = o && k in o ? o[k] : k==="mode" ? "user" : k==="noEcho" ? false : null; };
function inSession(B, id, fn){ const r = B.remote[id]; if (!r) return fn(null); const env = r.env, con = ctxSave(env); ctxLoad(env, r.ctx);
  try { return fn(env); } finally { if (B.remote[id]===r) r.ctx = ctxSave(env); ctxLoad(env, con); } }
// start a session: run its opening steps in a fresh context, keep that context for the session, give the console its own back
function openSession(B, id, fn){ const r = B.remote[id], env = r.env, con = ctxSave(env); ctxLoad(env, {mode:"user"});
  try { return fn(env); } finally { if (B.remote[id]===r) r.ctx = ctxSave(env); ctxLoad(env, con); } }
function pcPrompt(B, d){ const r = B.remote[d.id]; if (r) return inSession(B, d.id, env => env.pending ? "" : env.prompt()); return `C:\\Users\\${d.label}>`; }
function pcExec(B, d, line){
  const r = B.remote[d.id];
  if (r){
    let out = inSession(B, d.id, env => { env.viaVty = {user: r.user || "", ip: d.ip}; try { return env.exec(line); } finally { env.viaVty = null; } });
    if (out && out.logout){ delete B.remote[d.id]; return (out.text ? out.text + "\n" : "") + `\n[Connection to ${r.host} closed by foreign host]`; }
    if (out && out.reload){ delete B.remote[d.id]; return (out.text||"") + `\n[Connection to ${r.host} closed by foreign host]`; }
    return out;
  }
  const raw0 = line.trim(), raw = /^(ping|tracert)\s/i.test(raw0) ? raw0.split(/\s+/).filter((w,k)=>!(k>0 && /^-[46]$/.test(w))).join(" ") : raw0;   // -4 / -6 just force the IP version
  const l = raw.toLowerCase(), t = raw.split(/\s+/);
  const media = linkUpAt(B, hostNode(d).ref);
  if (!raw) return "";
  if (l==="help" || l==="?") return "Commands: ipconfig · ipconfig /all · ipconfig /release · ipconfig /renew · ipconfig /flushdns · ping <ip|name> · tracert <ip|name> · nslookup <name> [server] · curl http://<ip|name>[:port] · arp -a · arp -d · ssh -l <user> <ip> · telnet <ip> · cls";
  if (l==="cls") return {clear:true};
  if (/^netsh\s+wlan\s+show\s+interfaces?$/.test(l)){ computeL3(B); const w = d.wifiAt, ap = w && B.devs[w.ap], ch = ap && ap.channel || 36, band = ch > 14 ? "5 GHz" : "2.4 GHz", mc = m => (m||"").replace(/\./g,"").match(/../g).join(":"),
      radio = ch > 14 ? "802.11ac" : "802.11n", rate = ch > 14 ? "866.7" : "144.4", bssid = ap ? radioMac(ap, w.wlan) : "";
    if (d.kind!=="laptop") return "There is no wireless interface on the system.";
    const head = "There is 1 interface on the system: \n\n    Name                   : Wi-Fi\n    Description            : Intel(R) Wi-Fi 6E AX211 160MHz\n    GUID                   : 3f2a9c4e-1b7d-4e21-9a55-" + d.mac.replace(/\./g,"") + "\n    Physical address       : " + mc(d.mac) + "\n    Interface type         : Primary\n";
    if (!w) return head + "    State                  : disconnected\n    Radio status           : Hardware On\n                             Software On";
    const akm = w.auth==="WPA3-Personal" ? "00-0f-ac:08" : w.auth==="Open" ? "00-00-00:00" : "00-0f-ac:02", cipher = w.auth==="Open" ? "None" : "CCMP";
    return head + `    State                  : connected\n    SSID                   : ${w.ssid}\n    AP BSSID               : ${bssid}\n    Band                   : ${band}\n    Channel                : ${ch}\n    Connected Akm-cipher   : [ akm = ${akm}, cipher =  ${w.auth==="Open" ? "00-00-00:00" : "00-0f-ac:04"} ]\n    Network type           : Infrastructure\n    Radio type             : ${radio}\n    Authentication         : ${w.auth}\n    Cipher                 : ${cipher}\n    Connection mode        : Auto Connect\n    Receive rate (Mbps)    : ${rate}\n    Transmit rate (Mbps)   : ${rate}\n    Signal                 : 91% \n    Rssi                   : -44\n    Profile                : ${w.ssid} `; }
  if (/^netsh\s+wlan\s+show\s+networks(\s+mode=bssid)?$/.test(l)){ computeL3(B); if (d.kind!=="laptop") return "There is no wireless interface on the system.";
    const nets = window.WIFIGUI ? window.WIFIGUI.visible(B, d) : [], auth = s0 => s0==="none" ? "Open" : s0==="wpa2-ent" ? "WPA2-Enterprise" : s0==="wpa3-sae" ? "WPA3-Personal" : "WPA2-Personal";
    if (/mode=bssid/.test(l)) return `Interface name : Wi-Fi \nThere are ${nets.length} networks currently visible. \n\n` + nets.map((n,i)=>{ const ap = B.devs[n.ap], ch = ap && ap.channel || 36, b5 = ch > 14; return `SSID ${i+1} : ${n.ssid}\n    Network type            : Infrastructure\n    Authentication          : ${auth(n.sec)}\n    Encryption              : ${n.sec==="none" ? "None" : "CCMP"} \n    BSSID 1                 : ${ap ? radioMac(ap, n.wlan) : ""}\n         Signal             : 91%  \n         Radio type         : ${b5 ? "802.11ac" : "802.11n"}\n         Band               : ${b5 ? "5 GHz" : "2.4 GHz"}\n         Channel            : ${ch} \n         Basic rates (Mbps) : ${b5 ? "6 12 24" : "1 2 5.5 11"}\n         Other rates (Mbps) : ${b5 ? "9 18 36 48 54" : "6 9 12 18 24 36 48 54"}`; }).join("\n\n");
    return `Interface name : Wi-Fi \nThere are ${nets.length} networks currently visible. \n\n` + nets.map((n,i)=>`SSID ${i+1} : ${n.ssid}\n    Network type            : Infrastructure\n    Authentication          : ${auth(n.sec)}\n    Encryption              : ${n.sec==="none" ? "None" : "CCMP"} `).join("\n\n"); }
  if (l==="ipconfig /release" || l==="ipconfig /renew"){
    const head = "\nWindows IP Configuration\n\n";
    if (!d.dhcp) return head + "The operation failed as no adapter is in the state permissible for this operation.";
    if (!media) return head + "No operation can be performed on Ethernet while it has its media disconnected.";
    if (l.endsWith("release")){ const r = dhcpRelease(B, d); d.released = true; B.frames = r.frames; B.log = r.log; return pcExec(B, d, "ipconfig").replace(/^\nWindows IP Configuration\n\n/, head); }
    let pre = {frames:[], log:[]};
    if (d.ip && d.lease){ const rn = dhcpRenew(B, d); pre = rn; B.frames = rn.frames; B.log = rn.log;
      if (rn.ok) return pcExec(B, d, "ipconfig").replace(/^\nWindows IP Configuration\n\n/, head);
      if (!rn.nak) return head + "An error occurred while renewing interface Ethernet : unable to contact your DHCP server. Request has timed out."; }
    d.released = false; const r = dora(B, d); B.frames = pre.frames.concat(r.frames); B.log = pre.log.concat(r.log);
    if (!r.ok) return head + "An error occurred while renewing interface Ethernet : unable to contact your DHCP server. Request has timed out.";
    return pcExec(B, d, "ipconfig").replace(/^\nWindows IP Configuration\n\n/, head);
  }
  if (l==="ipconfig" || l==="ipconfig /all"){
    const all = l.endsWith("/all"), sfx = `   Connection-specific DNS Suffix  . : ${d.domain||""}`.trimEnd() + "\n";
    let o = `\nWindows IP Configuration\n\n` + (all ? `   Host Name . . . . . . . . . . . . : ${d.label.replace(/\s+/g, "-")}\n   Primary Dns Suffix  . . . . . . . :\n   Node Type . . . . . . . . . . . . : Hybrid\n   IP Routing Enabled. . . . . . . . : No\n   WINS Proxy Enabled. . . . . . . . : No\n${d.domain ? "   DNS Suffix Search List. . . . . . : " + d.domain + "\n" : ""}\n` : "") + `Ethernet adapter Ethernet:\n\n`;
    const pref = all ? "(Preferred)" : "";
    const nic = all ? `   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-LM\n   Physical Address. . . . . . . . . : ${winMac(d.mac)}\n   DHCP Enabled. . . . . . . . . . . : ${d.dhcp ? "Yes" : "No"}\n   Autoconfiguration Enabled . . . . : Yes\n` : "";
    if (!media) return o + "   Media State . . . . . . . . . . . : Media disconnected\n" + sfx + nic.trimEnd();
    computeL3(B); const h6 = host6(B, d), v6 = [...h6.globals.map(g=>`   IPv6 Address. . . . . . . . . . . : ${g.addr}${pref}`), `   Link-local IPv6 Address . . . . . : ${h6.ll}%4${pref}`].join("\n") + "\n";
    const gw6 = h6.gw ? h6.gw + (I6().isLL(h6.gw) ? "%4" : "") : null, gws = [gw6, d.gw].filter(Boolean);
    const gwLine = gl => `   Default Gateway . . . . . . . . . : ${gl[0]||""}${gl.slice(1).map(g=>"\n                                       "+g).join("")}`;
    const dl = (d.dns||[]).length ? d.dns : ["fec0:0:0:ffff::1%1", "fec0:0:0:ffff::2%1", "fec0:0:0:ffff::3%1"];
    const hx = d.mac.replace(/\./g, "").toUpperCase().match(/../g), iaid = 50000000 + (parseInt(d.mac.replace(/\./g, "").slice(-6), 16) % 9000000);
    const dnsLines = `\n   DHCPv6 IAID . . . . . . . . . . . : ${iaid}\n   DHCPv6 Client DUID. . . . . . . . : 00-01-00-01-2E-6B-1F-40-${hx.join("-")}\n   DNS Servers . . . . . . . . . . . : ${dl[0]}${dl.slice(1).map(x=>"\n                                       "+x).join("")}`;
    const tail = all ? (d.dhcp && d.ip && d.lease ? `\n   DHCP Server . . . . . . . . . . . : ${d.lease.shown || d.lease.server}` : "") + dnsLines + "\n   NetBIOS over Tcpip. . . . . . . . : Enabled" : "";
    if (!d.ip && d.dhcp && d.released) return o + sfx + nic + v6 + gwLine(gw6 ? [gw6] : []) + tail;   // after ipconfig /release: no IPv4 address at all
    if (!d.ip) return o + sfx + nic + v6 + `   Autoconfiguration IPv4 Address. . : ${apipaOf(d)}${pref}\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n` + gwLine(gw6 ? [gw6] : []) + tail;
    const lease = all && d.dhcp && d.lease ? `   Lease Obtained. . . . . . . . . . : ${winTime(d.lease.obtained)}\n   Lease Expires . . . . . . . . . . : ${d.lease.expires==null ? "Never" : winTime(d.lease.expires)}\n` : "";
    return o + sfx + nic + v6 + `   IPv4 Address. . . . . . . . . . . : ${d.ip}${pref}\n   Subnet Mask . . . . . . . . . . . : ${d.mask}\n` + lease + gwLine(gws) + tail;
  }
  if (/^arp\s+-a$/.test(l) || l==="arp -g"){
    if (!d.ip || !media) return "No ARP Entries Found.";
    const rows = Object.entries(B.arp[d.id]||{}).map(([ip,e])=>`  ${ip.padEnd(22)}${winMac(e.mac).toLowerCase().padEnd(22)}dynamic`);
    rows.push(`  ${bcastOf(d.ip,d.mask).padEnd(22)}ff-ff-ff-ff-ff-ff     static`, `  224.0.0.22            01-00-5e-00-00-16     static`);
    return `\nInterface: ${d.ip} --- 0x4\n  Internet Address      Physical Address      Type\n` + rows.join("\n");
  }
  if (/^arp\s+-d/.test(l)){ B.arp[d.id] = {}; return ""; }
  const RTT = "\nApproximate round trip times in milli-seconds:\n    Minimum = 0ms, Maximum = 0ms, Average = 0ms";
  if (/^curl(\.exe)?$/i.test(t[0])) return media ? curlCmd(B, d, raw) : "curl: (7) Failed to connect: Network is unreachable";
  if (t[0].toLowerCase()==="nslookup"){ if (!t[1]){ const s0 = (d.dns||[])[0], o0 = s0 && ipOwner(B, s0), nm0 = o0 && o0.dev.services && o0.dev.services.dns && o0.dev.services.dns.name;
      return "Default Server:  " + (nm0 || "UnKnown") + "\nAddress:  " + (s0||"::1") + "\n\n> (interactive mode isn't available in this lab — use nslookup <name> [server])"; }
    const r = nslookupText(B, d, t[1], t[2]); return r; }
  if (l==="ipconfig /flushdns"){ d.dnsCache = {}; return "\nWindows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache."; }
  if (l==="ipconfig /displaydns"){ const C = Object.entries(d.dnsCache||{}); if (!C.length) return "\nWindows IP Configuration\n\nCould not display the DNS Resolver Cache.";
    return "\nWindows IP Configuration\n\n" + C.map(([n, ip])=>`    ${n}\n    ----------------------------------------\n    Record Name . . . . . : ${n}\n    Record Type . . . . . : 1\n    Time To Live  . . . . : 3600\n    Data Length . . . . . : 4\n    Section . . . . . . . : Answer\n    A (Host) Record . . . : ${ip}\n`).join("\n"); }
  if (/^snmp(get|walk|set)$/i.test(t[0])){ if (!(d.services && d.services.nms)) return `'${t[0]}' is not recognized as an internal or external command,\noperable program or batch file.`; return snmpTool(B, d, raw); }
  if (/^(ping|tracert)$/i.test(t[0]) && t.length>=2){ const tgt = t[t.length-1];
    if (ipToInt(tgt)==null && !(window.IP6 && window.IP6.valid(tgt.replace(/%\d+$/,""))) && /^[a-z0-9][a-z0-9.-]*$/i.test(tgt) && /[a-z]/i.test(tgt)){
      const r = media ? resolveWin(B, d, tgt) : {ip:null};
      if (!r.ip) return t[0].toLowerCase()==="ping" ? `Ping request could not find host ${tgt}. Please check the name and try again.` : `Unable to resolve target system name ${tgt}.`;
      const o = pcExec(B, d, t.slice(0, -1).concat(r.ip).join(" "));
      if (typeof o!=="string") return o;
      return o.replace(`Pinging ${r.ip} with`, `Pinging ${r.fq} [${r.ip}] with`).replace(`Tracing route to ${r.ip} over a maximum of 30 hops`, `Tracing route to ${r.fq} [${r.ip}]\nover a maximum of 30 hops:`); } }
  const v6arg = t.slice(1).find(x=>window.IP6 && window.IP6.valid(x.replace(/%\d+$/,"")));
  if ((t[0].toLowerCase()==="ping" || t[0].toLowerCase()==="tracert") && v6arg){
    const ip = window.IP6.str(window.IP6.parse(v6arg.replace(/%\d+$/,"")));
    const noRoute6 = `\nTracing route to ${ip} over a maximum of 30 hops\n\n  1  Transmit error: code 1231.\n\nTrace complete.`;
    if (!media) return t[0].toLowerCase()==="ping" ? `\nPinging ${ip} with 32 bytes of data:\n` + [...Array(4)].map(()=>"PING: transmit failed. General failure.").join("\n") : noRoute6;
    if (t[0].toLowerCase()==="tracert"){ const r = trace6(B, d, ip); B.traced = Object.assign(B.traced||{}, {[d.id+">"+ip]: r.ok}); if (r.kind==="general") return noRoute6; return winTraceText(r, ip); }
    const res = ping6(B, d, ip); markPing(B, d.id+">"+ip, res.ok);
    const shown = window.IP6.isLL(ip) ? ip + "%4" : ip;   // Windows names the zone (interface index) of a link-local target
    const head = `\nPinging ${shown} with 32 bytes of data:\n`, stat = n => `\n\nPing statistics for ${shown}:\n    Packets: Sent = 4, Received = ${n}, Lost = ${4-n} (${(4-n)*25}% loss),`;
    if (res.ok) return head + [...Array(4)].map(()=>`Reply from ${shown}: time<1ms`).join("\n") + stat(4) + RTT;
    if (res.kind==="unreach") return head + [...Array(4)].map(()=>`Reply from ${res.unreachFrom}: Destination net unreachable.`).join("\n") + stat(4);
    if (res.kind==="addrunreach") return head + [...Array(4)].map(()=>`Reply from ${res.unreachFrom}: Destination host unreachable.`).join("\n") + stat(4);
    if (res.kind==="ttlexpired") return head + [...Array(4)].map(()=>`Reply from ${res.unreachFrom}: TTL expired in transit.`).join("\n") + stat(4);
    if (res.kind==="general" || res.kind==="noroute") return head + [...Array(4)].map(()=>"PING: transmit failed. General failure.").join("\n") + stat(0);
    return head + [...Array(4)].map(()=>"Request timed out.").join("\n") + stat(0);
  }
  if (t[0].toLowerCase()==="tracert"){
    const ip = t[t.length-1]; if (t.length<2 || ipToInt(ip)==null) return `Unable to resolve target system name ${t[1]||""}.`;
    if (!media || !d.ip) return "\nTransmit error: code 1231.";   // no link / no address
    const r = trace(B, hostNode(d), ip); markPing(B, d.id+">"+ip, r.ok); B.traced = Object.assign(B.traced||{}, {[d.id+">"+ip]: r.ok});
    if (r.kind==="unreach" && !r.hops.length) return `\nTracing route to ${ip} over a maximum of 30 hops\n\n  1  ${d.ip}  reports: Destination host unreachable.\n\nTrace complete.`;
    return winTraceText(r, ip);
  }
  if (t[0].toLowerCase()==="ping"){
    const ip = t[1]; if (!ip || ipToInt(ip)==null) return "Ping request could not find host "+(ip||"")+". Please check the name and try again.";
    let res;
    if (!media || !d.ip) res = {ok:false, kind:"general"}; else res = ping(B, hostNode(d), ip);
    markPing(B, d.id+">"+ip, res.ok);
    const head = `\nPinging ${ip} with 32 bytes of data:\n`;
    const stat = n => `\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = ${n}, Lost = ${4-n} (${(4-n)*25}% loss),`;
    const ttl = res.ttl || 128;
    if (res.ok) return head + [...Array(4)].map(()=>`Reply from ${ip}: bytes=32 time<1ms TTL=${ttl}`).join("\n") + stat(4) + RTT;
    if (res.kind==="ttlexpired") return head + [...Array(4)].map(()=>`Reply from ${res.unreachFrom}: TTL expired in transit.`).join("\n") + `\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`;
    if (res.kind==="prohib") return head + [...Array(4)].map(()=>`Reply from ${res.unreachFrom}: Destination protocol unreachable.`).join("\n") + `\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`;
    if (res.kind==="netunreach") return head + [...Array(4)].map(()=>`Reply from ${res.unreachFrom}: Destination host unreachable.`).join("\n") + `\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`;
    if (res.kind==="general" || res.kind==="noroute") return head + [...Array(4)].map(()=>"PING: transmit failed. General failure.").join("\n") + stat(0);
    if (res.kind==="unreach") return head + [...Array(4)].map(()=>`Reply from ${d.ip}: Destination host unreachable.`).join("\n") + `\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`;
    return head + [...Array(4)].map(()=>"Request timed out.").join("\n") + stat(0);
  }
  const ssh = raw.match(/^ssh\s+(?:-l\s+(\S+)\s+(\S+)|(\S+)@(\S+))$/i), tel = raw.match(/^telnet\s+(\S+)$/i);
  if (ssh || tel){
    const user = ssh ? (ssh[1]||ssh[3]) : null, ip = ssh ? (ssh[2]||ssh[4]) : tel[1];
    if (!media || !d.ip) return `Connecting To ${ip}...Could not open connection to the host: Connect failed`;
    const port = ssh ? 22 : 23, tcp = tcpConnect(B, hostNode(d), ip, port); B.frames = tcp.frames; B.log = tcp.log;
    const o = tcp.owner || ipOwner(B, ip), p = {ok: tcp.ok};
    if (o && o.dev.env && tcp.ok){ const acl = o.dev.env.lines.vty.acl;   // access-class: only these sources may open a VTY session
      if (acl && o.dev.env.acl.lists[acl] && !window.ACL.check(o.dev.env.acl, acl, {src:tcp.src}).permit){ B.log.push(`<b>access-class ${acl} in</b> on ${o.dev.label}'s VTY lines doesn't permit ${tcp.src} — the router refuses the session`);
        return ssh ? `ssh: connect to host ${ip} port 22: Connection refused` : `Connecting To ${ip}...Could not open connection to the host, on port 23: Connect failed`; }
      if (o.dev.env.loginAllowed && !o.dev.env.loginAllowed(tcp.src)){ B.log.push(`<b>${o.dev.label} is in quiet mode</b> (login block-for): too many failed logins, so it refuses every new VTY session${o.dev.env.loginQuietAcl ? " except from sources access-list " + o.dev.env.loginQuietAcl + " permits" : ""} until the block period ends`);
        return ssh ? `ssh: connect to host ${ip} port 22: Connection refused` : `Connecting To ${ip}...Could not open connection to the host, on port 23: Connect failed`; } }
    if (!p.ok || !o || !o.dev.env) return ssh ? `ssh: connect to host ${ip} port 22: Connection timed out` : `Connecting To ${ip}...Could not open connection to the host, on port 23: Connect failed`;
    const env = o.dev.env, vty = env.lines.vty;
    if (ssh){
      if (!env.rsa) return `ssh: connect to host ${ip} port 22: Connection refused`;
      if (!/ssh|all/.test(vty.transport)) return `ssh: connect to host ${ip} port 22: Connection refused`;
      if (!(env.aaa && env.aaa.on) && !vty.loginLocal) return `${user}@${ip}: Permission denied (publickey,keyboard-interactive,password).\n(the switch's VTY lines aren't using local usernames — 'login local' is missing)`;
      B.remote[d.id] = {env, host:ip, proto:"ssh", user, from:d.ip, pendingAuth:true}; env.loginCtx = {src:tcp.src || d.ip, port:22};
      let tries = 0; const prompt = `(${user}@${ip}) Password: `;
      const handle = pw => { env.noEcho = false;
        if (env.loginCheck("vty", user, pw, env.loginCtx)){ env.mode = !(env.aaa && env.aaa.on) && (env.users[user]||{}).priv===15 ? "priv" : "user"; if (B.remote[d.id]) B.remote[d.id].pendingAuth = false; return env.banner!=null ? env.banner : ""; }
        if (++tries < 3){ env.noEcho = true; env.pending = {prompt, handle}; return {text:"", ask:prompt}; }
        delete B.remote[d.id]; return `${user}@${ip}: Permission denied (publickey,keyboard-interactive,password).`; };
      openSession(B, d.id, e => { e.pending = {prompt, handle}; e.noEcho = true; });
      return {ask:prompt, text: env.bannerLogin!=null ? env.bannerLogin + "\n" : ""};
    }
    if (!/telnet|all/.test(vty.transport)) return `Connecting To ${ip}...Could not open connection to the host, on port 23: Connect failed`;
    const aaaOn = env.aaa && env.aaa.on; env.loginCtx = {src:tcp.src || d.ip, port:23};
    if (!aaaOn && vty.login && !vty.loginLocal && !vty.password) return `\nPassword required, but none set\n\n[Connection to ${ip} closed by foreign host]`;
    if (aaaOn ? env.loginMethods("vty")[0]==="none" : !vty.login) { B.remote[d.id] = {env, host:ip, proto:"telnet", from:d.ip}; openSession(B, d.id, ()=>{}); return `Trying ${ip} ... Open\n\n` + (env.banner!=null?env.banner+"\n":""); }
    B.remote[d.id] = {env, host:ip, proto:"telnet", from:d.ip};
    const c = openSession(B, d.id, e => e.connect("vty"));
    return {ask: c.ask, text: `Trying ${ip} ... Open\n\n${c.text}`};
  }
  return `'${t[0]}' is not recognized as an internal or external command,\noperable program or batch file.`;
}

function act(B, a){
  const [op, ...x] = a; let r = {ok:true, msg:""};
  B_ctx.B = B; B._greLast = 0;
  if (op==="plug"){ r = plug(B, x[0], x[1], x[2]); if (r.ok) for (const ref of [x[1], x[2]]){ const pd = P(B, ref); if (pd && !pd.dev.env && pd.dev.dhcp) pd.dev.released = false; } }
  else if (op==="unplug"){ const c = cableAt(B, x[0]); if (!c) r = {ok:false, msg:"Nothing plugged in there."}; else { B.cables = B.cables.filter(y=>y!==c); if (CABLES[c.type].kind==="console" && B.console) B.console = null;
      if (CABLES[c.type].kind!=="console") for (const end of [c.a, c.b]){ const hd = P(B, end).dev; if (hd && !hd.env){ B.arp[hd.id] = {}; if (B.nd) B.nd[hd.id] = {}; } }
      r = {ok:true, msg:"Cable unplugged."}; } }
  else if (op==="insert"){ const p = P(B, x[0]); if (!p || p.port.type!=="sfp") r = {ok:false, msg:"Transceivers go into an SFP cage."}; else if (p.port.sfp) r = {ok:false, msg:"There's already a module in that cage — remove it first."}; else { p.port.sfp = x[1]; r = {ok:true, msg:`Inserted ${SFPS[x[1]].short} into ${portName(p)}.`}; } }
  else if (op==="remove"){ const p = P(B, x[0]); if (!p || !p.port.sfp) r = {ok:false, msg:"No module there."}; else if (cableAt(B, x[0])) r = {ok:false, msg:"Unplug the fibre before pulling the transceiver."}; else { p.port.sfp = null; r = {ok:true, msg:"Module removed."}; } }
  else if (op==="flip"){ const c = cableAt(B, x[0]); if (!c || CABLES[c.type].kind!=="fibre") r = {ok:false, msg:"Only duplex fibre connectors have a Tx/Rx polarity to flip."}; else { c.swapped = !c.swapped; r = {ok:true, msg:"Flipped the LC duplex connector (Tx↔Rx) at this end."}; } }
  else if (op==="ip6"){ const d = B.devs[x[0]], I = window.IP6;   // ["ip6", dev, "auto"|"static", address, prefix length, gateway]
    if (x[1]==="auto"){ d.ip6 = {auto:true}; B.nd[d.id] = {}; r = {ok:true, msg:`${d.label}: IPv6 set to obtain an address automatically (SLAAC).`}; showRsRa(B, d); }
    else if (x[2] && !I.valid(x[2])) r = {ok:false, msg:"That IPv6 address isn't valid (e.g. 2001:db8:acad:1::10)."};
    else if (x[3] && !(+x[3]>=1 && +x[3]<=128)) r = {ok:false, msg:"The subnet prefix length must be 1–128 (usually 64)."};
    else if (x[4] && !I.valid(x[4])) r = {ok:false, msg:"The default gateway isn't a valid IPv6 address."};
    else if (x[2] && ["multicast","unspecified","loopback"].includes(I.type(x[2]))) r = {ok:false, msg:`${x[2]} can't be a host address (it's ${I.type(x[2])}).`};
    else { d.ip6 = {auto:false, addr: x[2] ? I.str(I.parse(x[2])) : null, len: +(x[3]||64), gw: x[4] ? I.str(I.parse(x[4])) : null}; B.nd[d.id] = {}; r = {ok:true, msg:`${d.label}: IPv6 settings saved.`}; } }
  else if (op==="ip"){ const d = B.devs[x[0]];
    if (x[1] && ipToInt(x[1])==null) r = {ok:false, msg:"That IP address isn't valid — four numbers 0–255 separated by dots."};
    else if (x[2] && !validMask(x[2])) r = {ok:false, msg:"That subnet mask isn't valid (e.g. 255.255.255.0)."};
    else if (x[3] && ipToInt(x[3])==null) r = {ok:false, msg:"The default gateway isn't a valid IP address."};
    else if (x[1] && x[2] && ipToInt(x[2]) < 0xFFFFFFFE && (x[1]===netOf(x[1],x[2]) || x[1]===bcastOf(x[1],x[2]))) r = {ok:false, msg:`Windows won't accept ${x[1]} with mask ${x[2]}: it is the subnet's ${x[1]===netOf(x[1],x[2])?"network address (all host bits are 0)":"broadcast address (all host bits are 1)"}. Pick an address between them.`};
    else if (x[4] && ipToInt(x[4])==null) r = {ok:false, msg:"The preferred DNS server isn't a valid IP address."};
    else { d.dhcp = false; d.released = false; d.lease = null; d.domain = null; d.ip = x[1]||null; d.mask = x[2]||null; d.gw = x[3]||null; d.dns = x[4] ? [x[4]] : []; B.arp[d.id] = {};
      const off = d.ip && d.mask && d.gw && !sameNet(d.ip, d.gw, d.mask);
      r = {ok:true, msg: off ? `${d.label}: saved — but Windows warns: the default gateway ${d.gw} is not on the same network segment (subnet) as ${d.ip}/${d.mask}. (In this lab that gateway can't be used.)` : `${d.label}: IP settings saved.`}; } }
  else if (op==="wifi"){ const d = B.devs[x[0]];
    if (!d || d.kind!=="laptop") r = {ok:false, msg:"Only a laptop has a Wi-Fi adapter here."};
    else { d.wifi = Object.assign({}, d.wifi||{}, {ssid:x[1]||null, key:x[2]==null ? null : String(x[2])}, x[3]||{}); if (d.wifi.ssid && !d.dhcp && !d.ip) d.dhcp = true; computeL3(B); const res = d.wifiRes || {};
      r = {ok: !!res.ok, msg: !x[1] ? `${d.label}: disconnected from Wi-Fi.` : res.ok ? `${d.label}: connected to ${x[1]} (${res.auth})${d.ip ? " — got " + d.ip : " — but no IP address yet (open the frame log)"}.` : `${d.label}: ${res.win || "Can't connect to this network"} ${res.why ? "— " + res.why : ""}`}; } }
  else if (op==="wlc"){ const d = B.devs[x[0]], W = window.WLAN, st = d && d.wlc;
    if (!st) r = {ok:false, msg:"That isn't a wireless LAN controller."};
    else { const sub = x[1]; let o;
      if (sub==="iface"){ o = W.createIface(st, {name:x[2], vlan:x[3]}); if (o.ok && x[4]) o = W.setIface(st, x[2], x[4]); }
      else if (sub==="ifaceset") o = W.setIface(st, x[2], x[3]||{});
      else if (sub==="wlan") o = W.createWlan(st, {id:x[2], profile:x[3], ssid:x[4]});
      else if (sub==="wlanset") o = W.setWlan(st, +x[2], x[3]||{});
      else if (sub==="wlandel"){ if (st.wlans[+x[2]]){ delete st.wlans[+x[2]]; o = {ok:true}; } else o = {err:"No such WLAN."}; }
      else if (sub==="access"){ Object.assign(st.access, x[2]||{}); o = {ok:true}; }
      else if (sub==="apmode"){ const ap = B.devs[x[2]] || Object.values(B.devs).find(v=>v.kind==="ap" && v.label===x[2]);
        if (!ap || ap.kind!=="ap") o = {err:"No such AP."}; else { const from0 = ap.apMode; ap.apMode = x[3]; o = {ok:true, note: from0==="local" && x[3]==="flexconnect" ? ` — ${ap.label} switches to FlexConnect without a reboot` : ` — ${ap.label} reboots and rejoins in ${x[3]} mode`}; } }
      else o = {err:"Unknown controller setting."};
      computeL3(B); r = {ok:!!o.ok, msg: o.ok ? `${d.label}: applied${o.note||""}.` : `${d.label}: ${o.err}`}; } }
  else if (op==="dhcp"){ const d = B.devs[x[0]];
    d.dhcp = true; d.released = false; d.ip = null; d.mask = null; d.gw = null; d.dns = []; d.domain = null; d.lease = null; B.arp[d.id] = {};
    const res = dora(B, d); B.frames = res.frames; B.log = res.log;
    r = {ok:true, msg: res.ok ? `${d.label}: set to obtain an IP address automatically — got ${res.ip} from the DHCP server ${res.server}.` : `${d.label}: set to obtain an IP address automatically — but no DHCP server answered, so Windows uses an APIPA 169.254.x.x address. Open the frame log to see why.`}; }
  else if (op==="pc"){ B.frames = []; const dv = B.devs[x[0]], o0 = pcExec(B, dv, x[1]);
    const wifiNic = dv && dv.kind==="laptop" && (dv.wifiAt || (dv.wifi && !cableAt(B, dv.id + ":eth")));
    r = {ok:true, out: wifiNic && typeof o0==="string" ? o0.replace("Ethernet adapter Ethernet:", "Wireless LAN adapter Wi-Fi:").replace("Intel(R) Ethernet Connection I219-LM", "Intel(R) Wi-Fi 6E AX211 160MHz").split("renewing interface Ethernet").join("renewing interface Wi-Fi").split("releasing interface Ethernet").join("releasing interface Wi-Fi") : o0}; }
  else if (op==="power"){ const d = B.devs[x[0]]; d.on = x[1]!==false; if (!d.on && B.mac[d.id]) B.mac[d.id] = {}; if (!d.on){ B.arp[d.id] = {}; if (B.nd) B.nd[d.id] = {}; } r = {ok:true, msg:`${d.label} powered ${d.on?"on":"off"}.`}; }
  else if (op==="console"){ r = openConsole(B, x[0], x[1]||{}); }
  else if (op==="term"){ B.frames = []; r = {ok:true, out: termExec(B, x[0])}; }
  else if (op==="cli"){ B.frames = []; const d = B.devs[x[0]]; r = {ok:true, out: d && d.env ? d.env.exec(x[1]) : "(no CLI on this device)"}; }
  else r = {ok:false, msg:"Unknown action "+op};
  B.events.push({a, ok:r.ok});
  if (B.order.some(id=>isSw(B.devs[id]))) try { l2State(B); } catch(e){}   // link-up events log when they happen, like real switches
  if (B.order.some(id=>B.devs[id].env)) try { computeL3(B); } catch(e){}
  for (const d of tunRouters(B)){ for (const m of d.env.tunCheck()) syslog(B, d, m, true); d.env.tunMsgs = []; }   // e.g. a cable pulled elsewhere took the tunnel's underlay route away
  try { linkLogs(B); } catch(e){}
  if (B._joinEvents && B._joinEvents.length){ B.log = (B.log||[]).concat(B._joinEvents); B._joinEvents = []; }
  return r;
}
// IOS logs its own interfaces going up/down; the device whose port was administratively shut already printed its own lines
function linkLogs(B){
  for (const id of B.order){ const d = B.devs[id]; if (!d.env || d.kind!=="switch") continue; const on = d.env.errRecovery || [], iv = (d.env.errRecoveryInt || 300)*1000;
    for (const [n, i] of Object.entries(d.env.intfs)) if (i.errdis && on.includes(i.errdis) && i.errdisAt!=null && B.now >= i.errdisAt + iv){
      syslog(B, d, `%PM-4-ERR_RECOVER: Attempting to recover from ${i.errdis} err-disable state on ${shortIf(n)}`, true); i.errdis = null; i.errdisAt = null; } }
  const prev = B._linkPrev, now = {};
  for (const id of B.order){ const d = B.devs[id]; if (!d.env || d.on===false) continue;
    for (const p of d.ports){ if (!p.ios || !d.env.intfs[p.ios]) continue; const i = d.env.intfs[p.ios]; now[id+"|"+p.ios] = {up: !i.shut && linkUpAt(B, id+":"+p.id), shut: !!i.shut}; } }
  if (prev) for (const [k, v] of Object.entries(now)){ const o = prev[k]; if (!o || o.up===v.up) continue; if (v.shut || o.shut) continue;   // admin changes: the CLI printed them
    const [id, ios] = k.split("|"), d = B.devs[id], st = v.up ? "up" : "down";
    if (!v.up){ const ii = d.env.intfs[ios]; if (ii && ii.psecMacs) ii.psecMacs = ii.psecMacs.filter(m=>m.type!=="dynamic"); }   // dynamic secure addresses age out with the link
    const lk = `%LINK-3-UPDOWN: Interface ${ios}, changed state to ${st}`, lp = `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${ios}, changed state to ${st}`;
    for (const m of (v.up || d.kind!=="switch" ? [lk, lp] : [lp, lk])) syslog(B, d, m, true); }   // going down, a Catalyst logs line protocol first
  B._linkPrev = now;
}
function openConsole(B, laptopId, s){
  const lap = B.devs[laptopId]; const usb = lap && lap.ports.find(p=>p.type==="usb");
  const c = usb && cableAt(B, laptopId+":"+usb.id);
  if (!c || CABLES[c.type].kind!=="console") return {ok:false, msg:"Unable to open connection to COM3: the port does not exist. (Is the console cable plugged into the laptop's USB port?)"};
  const far = P(B, otherEnd(c, laptopId+":"+usb.id));
  const good = +s.speed===9600 && +s.data===8 && (s.parity||"None")==="None" && +s.stop===1 && (s.flow||"None")==="None";
  B.console = { laptop:laptopId, target:far.dev.id, good, lines:[] };
  if (!far.dev.on) B.console.lines.push({t:"(the session is open, but the device is powered off — nothing appears)", cls:""});
  else if (!good) B.console.lines.push({t:garble(48), cls:""});
  else { const g = far.dev.env.connect("con"); if (g.text) B.console.lines.push({t:g.text, cls:""}); if (g.ask) B.console.lines.push({t:g.ask, cls:"ask"}); else B.console.lines.push({t:"", cls:""}); }
  return {ok:true, good, msg: good ? `Connected to ${far.dev.label} — press Enter or type a command.` : "Connected, but the text is garbled — the serial settings don't match the device."};
}
function garble(n){ const ch = "ÿ�x€þ¤ßæø§¿Ã±"; let s = ""; for (let i=0;i<n;i++) s += ch[(i*7+3)%ch.length]; return s; }
function termExec(B, line){
  const s = B.console; if (!s) return "(no terminal session open)";
  const d = B.devs[s.target];
  if (!d.on) return "";
  if (!s.good) return garble(Math.max(6, line.length*2));
  const out = d.env.exec(line);
  if (out && out.logout){ const g = d.env.connect("con"); return {text:`\n${d.env.host} con0 is now available\n\nPress RETURN to get started.\n`, ask:g.ask||""}; }
  return out;
}

/* ---------------- view ---------------- */
function layout(d){
  const ports = {}, pts = d.ports;
  if (d.kind==="switch" || d.kind==="router" || d.kind==="hub" || d.kind==="wlc"){
    let x = 52; const h = 78;
    pts.forEach(p=>{ const [w,hh] = PORTW[p.type]; if (p.type==="console"){ x += 14; } ports[p.id] = {x, y:44, w, h:hh}; x += w + (p.type==="sfp"?10:7); });
    return {w:Math.max(x+14, d.kind==="hub"?170:200), h, ports};
  }
  const w = 108, h = 96; let x = 16;
  pts.forEach(p=>{ const [pw,ph] = PORTW[p.type]; ports[p.id] = {x, y:h-26, w:pw, h:ph}; x += pw + 16; });
  return {w, h, ports};
}
function drawDevice(B, d, sel){
  const L = layout(d), x0 = d.x, y0 = d.y;
  let g = "";
  const stroke = d.on ? "var(--line)" : "var(--bad)";
  if (d.kind==="switch" || d.kind==="router" || d.kind==="hub" || d.kind==="wlc"){
    const name = d.env ? d.env.host : d.label;
    g += `<rect x="${x0}" y="${y0}" width="${L.w}" height="${L.h}" rx="6" fill="var(--panel2)" stroke="${stroke}" stroke-width="1.4"/>`;
    g += `<text x="${x0+10}" y="${y0+18}" fill="var(--fg)" font-size="12" font-weight="700" font-family="var(--display)">${esc(name)}</text>`;
    g += `<text x="${x0+10}" y="${y0+30}" fill="var(--muted)" font-size="9" font-family="var(--mono)">${esc(d.model||(d.kind==="switch"?"Catalyst switch":d.kind==="hub"?"Ethernet hub (repeater)":d.kind==="wlc"?"Wireless LAN controller":"ISR router"))}</text>`;
    g += `<circle cx="${x0+16}" cy="${y0+52}" r="4" fill="${d.on?"var(--ok)":"var(--bad)"}"/><text x="${x0+10}" y="${y0+68}" fill="var(--muted)" font-size="8" font-family="var(--mono)">PWR</text>`;
  } else {
    const cx = x0+L.w/2;
    g += `<rect x="${x0}" y="${y0}" width="${L.w}" height="${L.h}" rx="8" fill="var(--panel2)" stroke="${stroke}" stroke-width="1.2"/>`;
    if (d.kind==="ap"){ const on = d.joinedTo ? "var(--ok)" : "var(--muted)"; g += `<ellipse cx="${cx}" cy="${y0+26}" rx="20" ry="9" fill="var(--chip)" stroke="var(--accent)"/><circle cx="${cx}" cy="${y0+26}" r="2.6" fill="${on}"/>${[13,19].map(r=>`<path d="M${cx-r},${y0+14} q${r},-${r*0.55} ${2*r},0" fill="none" stroke="${on}" stroke-width="1.4"/>`).join("")}`; }
    else if (d.kind==="laptop") g += `<rect x="${cx-17}" y="${y0+10}" width="34" height="22" rx="2" fill="var(--chip)" stroke="var(--accent)"/><path d="M${cx-23},${y0+33} h46 l-4,6 h-38 z" fill="var(--chip)" stroke="var(--accent)"/>`;
    else if (d.kind==="printer") g += `<rect x="${cx-20}" y="${y0+17}" width="40" height="18" rx="3" fill="var(--chip)" stroke="var(--accent)"/><rect x="${cx-13}" y="${y0+7}" width="26" height="11" fill="var(--panel)" stroke="var(--accent)"/><rect x="${cx-13}" y="${y0+31}" width="26" height="9" fill="var(--panel)" stroke="var(--accent)"/>`;
    else if (d.kind==="server") g += `<rect x="${cx-14}" y="${y0+8}" width="28" height="34" rx="2" fill="var(--chip)" stroke="var(--accent)"/>${[0,1,2].map(i=>`<line x1="${cx-9}" y1="${y0+16+i*9}" x2="${cx+4}" y2="${y0+16+i*9}" stroke="var(--muted)"/>`).join("")}`;
    else g += `<rect x="${cx-18}" y="${y0+9}" width="36" height="24" rx="2" fill="var(--chip)" stroke="var(--accent)"/><line x1="${cx}" y1="${y0+33}" x2="${cx}" y2="${y0+38}" stroke="var(--accent)" stroke-width="1.5"/><line x1="${cx-9}" y1="${y0+39}" x2="${cx+9}" y2="${y0+39}" stroke="var(--accent)" stroke-width="2"/>`;
    g += `<text x="${cx}" y="${y0+54}" text-anchor="middle" fill="var(--fg)" font-size="11.5" font-weight="700" font-family="var(--display)">${esc(d.label)}</text>`;
  }
  for (const p of d.ports){
    const q = L.ports[p.id], px = x0+q.x, py = y0+q.y, ref = d.id+":"+p.id;
    const c = cableAt(B, ref), isSel = sel===ref;
    let fill = "var(--bg)", st = isSel ? "var(--accent)" : "var(--muted)";
    if (p.type==="console") fill = "#38bdf8";
    if (p.type==="sfp" && p.sfp) fill = SFPS[p.sfp].mode==="mm" ? "#0f766e" : "#a16207";
    g += `<g class="bp" data-port="${ref}" style="cursor:pointer"><rect x="${px-4}" y="${py-14}" width="${q.w+8}" height="${q.h+30}" fill="transparent"/>`;
    g += `<rect x="${px}" y="${py}" width="${q.w}" height="${q.h}" rx="${p.type==="usb"?1:2}" fill="${fill}" stroke="${st}" stroke-width="${isSel?2.4:1.2}"/>`;
    if (p.type==="rj45") g += `<rect x="${px+q.w/2-4}" y="${py+q.h-4}" width="8" height="4" fill="${st}"/>`;
    if (p.type!=="console" && p.type!=="usb"){
      let led = "none";
      // real Catalyst LEDs: off = no link · green = link up and forwarding · amber = err-disabled or blocked by Spanning Tree
      if (c){ const s = linkState(B,c); const ii = d.env && p.ios && d.env.intfs[p.ios];
        if (ii && ii.errdis) led = "var(--warn)";
        else if (!s.up) led = "none";
        else if (d.kind==="switch" && B._S && p.ios){ const lp = B._S.bundles.memberOf[ref] || p.id; const vls = Object.keys(d.env.vlans).map(Number).filter(v=>(v<1002||v>1005) && carries(d, lp, v));
          led = vls.length && vls.every(v=>stpStateOf(B._S, d, lp, v)!=="FWD") ? "var(--warn)" : "var(--ok)"; }
        else led = "var(--ok)"; }
      g += `<circle cx="${px+q.w/2}" cy="${py-6}" r="3" fill="${led==="none"?"var(--chip)":led}" stroke="var(--line)" stroke-width=".6"/>`;
    }
    g += `<text x="${px+q.w/2}" y="${py+q.h+10}" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="var(--mono)">${esc(p.label)}</text></g>`;
  }
  return g;
}
function portCenter(B, ref){ const x = P(B, ref), L = layout(x.dev), q = L.ports[x.port.id]; return [x.dev.x+q.x+q.w/2, x.dev.y+q.y+q.h/2]; }
function cablePath(B, a, b){ const [x1,y1] = portCenter(B,a), [x2,y2] = portCenter(B,b); const sag = Math.max(40, Math.abs(x2-x1)*0.25);
  if (Math.abs(y2-y1) > 60){ const d = Math.sign(y2-y1), s2 = Math.min(sag, Math.abs(y2-y1)/2); return `M${x1},${y1} C${x1},${y1+d*s2} ${x2},${y2-d*s2} ${x2},${y2}`; }
  return `M${x1},${y1} C${x1},${y1+sag} ${x2},${y2+sag} ${x2},${y2}`; }
function drawCables(B){
  return B.cables.map(c=>{
    const s = linkState(B,c), col = CABLES[c.type].color;
    return `<path d="${cablePath(B,c.a,c.b)}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round" opacity="${s.up?1:.75}" ${CABLES[c.type].kind==="console"?'stroke-dasharray="7 4"':""}/>`;
  }).join("") + B.order.map(id=>B.devs[id]).filter(c=>c.wifiAt && B.devs[c.wifiAt.ap]).map(c=>{   // a Wi-Fi association: a dashed radio link to the AP
    const ap = B.devs[c.wifiAt.ap], La = layout(ap), Lc = layout(c), x1 = ap.x + La.w/2, y1 = ap.y + 14, x2 = c.x + Lc.w/2, y2 = c.y + 12;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ok)" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/><text x="${(x1+x2)/2 + 8}" y="${(y1+y2)/2}" font-size="9" font-family="var(--mono)" fill="var(--muted)">${esc(c.wifiAt.ssid)}</text>`; }).join("");
}
// animated frames: one dot per hop, staggered by step; broadcasts amber, unicasts accent
function drawFrames(B){
  if (!B.frames || !B.frames.length) return "";
  const per = 0.42;
  return B.frames.slice(0,220).map(h=>{
    const d = cablePath(B, h.a, h.b), col = h.gre ? "#a855f7" : h.kind==="bcast" ? "#f59e0b" : "var(--accent)";
    const begin = (h.step*per).toFixed(2), end = (h.step*per+per+0.15).toFixed(2);
    // tagged frames on a trunk carry their 802.1Q VLAN number with them
    const tag = h.gre ? `<rect x="6" y="-15" width="26" height="12" rx="3" fill="var(--panel)" stroke="${col}"/><text x="9" y="-6" font-size="9" font-family="var(--mono)" fill="var(--fg)">GRE</text>` : h.tag!=null ? `<rect x="6" y="-15" width="${String(h.tag).length*6+8}" height="12" rx="3" fill="var(--panel)" stroke="${col}"/><text x="${10}" y="-6" font-size="9" font-family="var(--mono)" fill="var(--fg)">${h.tag}</text>` : "";
    return `<g opacity="0"><animateMotion dur="${per}s" begin="${begin}s" fill="freeze" path="${d}"/><set attributeName="opacity" to="1" begin="${begin}s"/><set attributeName="opacity" to="0" begin="${end}s"/><circle r="5.5" fill="${col}" stroke="var(--bg)" stroke-width="1.5"/>${tag}</g>`;
  }).join("");
}

const PALETTE = [
  {k:"router", label:"Router", pre:"R", spec:{kind:"router", model:"ISR router"}},
  {k:"switch", label:"Switch", pre:"SW", spec:{kind:"switch", model:"Catalyst 9200 · Layer 2"}},
  {k:"l3switch", label:"Multilayer switch", pre:"L3SW", spec:{kind:"switch", model:"Catalyst 9300 · Layer 3", l3:true}},
  {k:"hub", label:"Hub", pre:"HUB", spec:{kind:"hub"}},
  {k:"pc", label:"PC", pre:"PC", spec:{kind:"pc"}},
  {k:"laptop", label:"Laptop", pre:"LAPTOP", spec:{kind:"laptop"}},
  {k:"server", label:"Server", pre:"SRV", spec:{kind:"server"}},
  {k:"printer", label:"Printer", pre:"PRN", spec:{kind:"printer"}},
  {k:"isp", label:"Internet (ISP)", pre:"ISP", spec:{kind:"router", model:"Internet / ISP edge", isp:true}},
];
const ISP_CONFIG = e => { for (const c of ["en","conf t","hostname ISP","int g0/0","description to customer edge","ip address 203.0.113.1 255.255.255.252","no shutdown","int lo0","description a server on the internet","ip address 8.8.8.8 255.255.255.255",
  "ip route 10.0.0.0 255.0.0.0 203.0.113.2","ip route 172.16.0.0 255.240.0.0 203.0.113.2","ip route 192.168.0.0 255.255.0.0 203.0.113.2","end"]) e.exec(c); };
function freeSpot(B, w, h){
  const boxes = B.order.map(id=>{ const d = B.devs[id], L = layout(d); return {x:d.x, y:d.y, w:L.w, h:L.h}; });
  for (let row=0; row<20; row++) for (let col=0; col<6; col++){ const x = 20 + col*230, y = 20 + row*150;
    if (!boxes.some(b=>x < b.x+b.w+20 && b.x < x+w+20 && y < b.y+b.h+30 && b.y < y+h+30)) return {x, y}; }
  return {x:20, y:20 + B.order.length*20};
}
function newDevice(B, k){
  const P0 = PALETTE.find(x=>x.k===k); if (!P0) return null;
  let n = 1; const used = new Set(B.order.map(id=>B.devs[id].label));
  while (used.has(P0.pre+n) || B.devs[(P0.pre+n).toLowerCase()]) n++;
  const label = P0.spec.isp && !used.has("ISP") ? "ISP" : P0.pre+n, id = label.toLowerCase().replace(/[^a-z0-9]/g,"") + (B.devs[label.toLowerCase()] ? "x"+Date.now()%1000 : "");
  const tmp = {kind:P0.spec.kind, ports: defaultPorts(P0.spec.kind)}; const L = layout(tmp); const spot = freeSpot(B, L.w, L.h);
  const d0 = Object.assign({id, label, x:spot.x, y:spot.y}, P0.spec);
  if (P0.spec.l3) d0.config = e => { e.exec("en"); e.exec("conf t"); e.exec("ip routing"); e.exec("end"); };
  if (P0.spec.isp) d0.config = ISP_CONFIG;
  return addDevice(B, d0);
}

function mount(el, cfg, tasks, onWin){
  let B = create(cfg);
  let zoom = 1, sel = null, hand = null, tool = null, msg = cfg.start || "Pick a cable or a module from the tray, then tap the two ports you want to connect.", msgKind = "", showFrames = true, animKey = 0;
  const cons = { speed:"115200", data:"8", parity:"None", stop:"1", flow:"XON/XOFF" };
  const pcLines = {};
  const hintsShown = {};
  let won = false, showSol = false, play = null, watched = false;
  // finished steps stay ticked (later steps may change the network on purpose); a challenge is judged live — every fault must stay fixed
  let sticky = new Set();
  const isDone = (t, ti) => { if (!cfg.challenge && sticky.has(ti)) return true; let ok = false; try { ok = !!t.done(B); } catch(e){} if (ok && !cfg.challenge) sticky.add(ti); return ok; };
  const cliLines = {};
  const changed = () => { if (cfg.onChange) try { cfg.onChange(B); } catch(e){} };
  // plain-English description of one solution step
  function describe(a){
    const [op, ...x] = a, pn = ref => { const p = P(B, ref); return p ? portName(p) : ref; }, lab = id => (B.devs[id]||{}).label || id;
    if (op==="plug") return `Take a <b>${esc(CABLES[x[0]].name)}</b> from the tray and plug it from <b>${esc(pn(x[1]))}</b> to <b>${esc(pn(x[2]))}</b>`;
    if (op==="unplug") return `Unplug the cable from <b>${esc(pn(x[0]))}</b>`;
    if (op==="insert") return `Insert a <b>${esc(SFPS[x[1]].name)}</b> into <b>${esc(pn(x[0]))}</b>`;
    if (op==="remove") return `Remove the transceiver from <b>${esc(pn(x[0]))}</b>`;
    if (op==="flip") return `Click <b>${esc(pn(x[0]))}</b> → <b>Flip Tx/Rx</b> (swap the LC connector polarity)`;
    if (op==="ip6") return x[1]==="auto" ? `<b>${esc(lab(x[0]))} → IPv6 settings</b>: Obtain an IPv6 address automatically → OK` : `<b>${esc(lab(x[0]))} → IPv6 settings</b>: address <code>${esc(x[2]||"(blank)")}</code>/<code>${esc(x[3]||"64")}</code>, gateway <code>${esc(x[4]||"(blank)")}</code> → OK`;
    if (op==="dhcp") return `<b>${esc(lab(x[0]))} → IP settings</b>: Obtain an IP address automatically → OK`;
    if (op==="wifi") return x[1] ? `<b>${esc(lab(x[0]))} → Wi-Fi</b>: connect to <code>${esc(x[1])}</code>${x[2] ? " with the network security key" : ""}` : `<b>${esc(lab(x[0]))} → Wi-Fi</b>: disconnect`;
    if (op==="wlc"){ const sub = x[1], o = x[3]||{};
      if (sub==="iface") return `<b>${esc(lab(x[0]))} GUI → CONTROLLER → Interfaces → New</b>: ${esc(x[2])}, VLAN ${x[3]}${x[4] ? ", " + Object.entries(x[4]).map(([k,v])=>k + " " + v).join(", ") : ""} → Apply`;
      if (sub==="ifaceset") return `<b>${esc(lab(x[0]))} GUI → CONTROLLER → Interfaces → ${esc(x[2])}</b>: ${Object.entries(o).map(([k,v])=>k + " " + v).join(", ")} → Apply`;
      if (sub==="wlan") return `<b>${esc(lab(x[0]))} GUI → WLANs → Create New</b>: ID ${x[2]}, profile ${esc(x[3])}, SSID ${esc(x[4])} → Apply`;
      if (sub==="wlanset") return `<b>${esc(lab(x[0]))} GUI → WLANs → ${x[2]}</b>: ${Object.entries(x[3]||{}).map(([k,v])=>k==="psk" ? "PSK ********" : k + " " + v).join(", ")} → Apply`;
      if (sub==="apmode") return `<b>${esc(lab(x[0]))} GUI → WIRELESS → All APs → ${esc(lab(x[2]))}</b>: AP Mode ${esc(x[3])} → Apply`;
      if (sub==="access") return `<b>${esc(lab(x[0]))} GUI → MANAGEMENT</b>: ${Object.entries(x[2]||{}).map(([k,v])=>k + " " + (v ? "enabled" : "disabled")).join(", ")} → Apply`;
      return `<b>${esc(lab(x[0]))} GUI</b>: ${esc(sub)}`; }
    if (op==="ip") return `<b>${esc(lab(x[0]))} → IP settings</b>: IP <code>${esc(x[1]||"(blank)")}</code>, mask <code>${esc(x[2]||"(blank)")}</code>, gateway <code>${esc(x[3]||"(blank)")}</code>${x[4] ? ", DNS <code>" + esc(x[4]) + "</code>" : ""} → OK`;
    if (op==="pc") return `<b>${esc(lab(x[0]))} → Command Prompt</b>: <code>${esc(x[1]||"(press Enter)")}</code>`;
    if (op==="console"){ const s = x[1]||{}; return `<b>${esc(lab(x[0]))} → Terminal app (PuTTY)</b>: Serial, COM3, speed <code>${esc(s.speed)}</code>, data bits <code>${esc(s.data)}</code>, parity <code>${esc(s.parity)}</code>, stop bits <code>${esc(s.stop)}</code>, flow control <code>${esc(s.flow)}</code> → Open`; }
    if (op==="term") return x[0] ? `Console: <code>${esc(x[0])}</code>` : `Console: press <b>Enter</b> (answers the prompt with its default)`;
    if (op==="power") return `Power ${x[1]===false?"off":"on"} <b>${esc(lab(x[0]))}</b>`;
    return esc(op);
  }
  const say = (m, kind) => { msg = m; msgKind = kind||""; };
  function draw(){
    const vb = cfg.builder ? (()=>{ let w = 900, h = 420; for (const id of B.order){ const d = B.devs[id], L = layout(d); w = Math.max(w, d.x+L.w+40); h = Math.max(h, d.y+L.h+60); } return `0 0 ${w} ${h}`; })() : (cfg.viewBox || "0 0 900 360");
    const doneN = tasks.filter((t,ti)=>isDone(t,ti)).length;
    if (!won && tasks.length && doneN===tasks.length){ won = true; if (onWin && !watched) onWin(); }   // watching the solution earns no points
    const selX = sel && P(B, sel), selC = sel && cableAt(B, sel);
    const frames = showFrames ? drawFrames(B) : "";
    B._S = l2State(B);   // Spanning Tree / EtherChannel state for the port lights
    el.innerHTML = `
      ${tasks.length?(()=>{ const nx = tasks.find((t,ti)=>!isDone(t,ti)); return `<div class="bn-prog"><span class="tag ${doneN===tasks.length?"ok":"acc"}">${doneN}/${tasks.length} ${cfg.challenge?"fixed":"tasks"}</span>${cfg.challenge?` <span class="qt-lvl l3">Challenge</span>`:""} ${nx?(cfg.challenge?`<span class="small">Find and fix every fault. Users' complaints are in the list below — the bench won't tell you what's wrong.</span>`:`<span class="small"><b>Next:</b> ${nx.text}</span>`):`<span class="small"><b>Lab complete.</b> ${cfg.win||"Everything is cabled, configured and verified."}</span>`}</div>`; })():""}
      ${cfg.builder?`<div class="bn-tray bn-palette"><span class="small muted">Add device:</span>${PALETTE.map(x=>`<button class="bn-item" data-add="${x.k}">＋ ${esc(x.label)}</button>`).join("")}</div>`:""}
      <div class="bn-tray"><span class="small muted">Tray:</span>
        ${(cfg.tray||["cat6","console"]).map(k=>CABLES[k]?`<button class="bn-item ${hand&&hand.cable===k?"on":""}" data-cable="${k}" title="${esc(CABLES[k].name)}"><i style="background:${CABLES[k].color}"></i>${esc(CABLES[k].short)}</button>`:SFPS[k]?`<button class="bn-item ${hand&&hand.sfp===k?"on":""}" data-sfp="${k}" title="${esc(SFPS[k].name)}"><i class="sfp"></i>${esc(SFPS[k].short)} SFP</button>`:"").join("")}
        ${hand?`<button class="bn-item ghost" data-drop="1">✕ put it back</button>`:""}
        <label class="small muted bn-anim"><input type="checkbox" data-anim ${showFrames?"checked":""}> show frames on the wire</label><span class="bn-zoom"><button class="btn sm ghost" data-zoom="-1" aria-label="zoom out">−</button><button class="btn sm ghost" data-zoom="1" aria-label="zoom in">+</button></span>
      </div>
      <div class="bn-msg ${msgKind}">${hand&&hand.cable&&hand.from?`Holding one end of the ${esc(CABLES[hand.cable].short)} cable in ${esc(portName(P(B,hand.from)))} — tap the port for the other end.`:esc(msg)}</div>
      <div class="bn-scene"><svg viewBox="${vb}" role="img" aria-label="lab bench" data-k="${animKey}" style="min-width:${Math.round(680*zoom)}px">${drawCables(B)}${B.order.map(id=>cfg.builder ? `<g data-devg="${id}" style="cursor:move">${drawDevice(B, B.devs[id], sel)}</g>` : drawDevice(B, B.devs[id], sel)).join("")}${frames}</svg></div>
      ${B.log && B.log.length ? `<details class="bn-log" ${cfg.openLog?"open":""}><summary>What just happened on the wire (${B.frames.length} frame hops)</summary><div class="bn-loglist">${(()=>{ let n = 0; return B.log.map(l=>{ const sub = l.startsWith("&nbsp;&nbsp;· "); return sub ? `<div class="bn-logsub">${l.replace("&nbsp;&nbsp;· ","")}</div>` : `<div class="bn-logmain"><span class="num">${++n}.</span> ${l}</div>`; }).join(""); })()}</div><button class="btn sm ghost" data-replay>Replay animation</button></details>`:""}
      ${selX?`<div class="bn-sel"><b>${esc(portName(selX))}</b> <span class="small muted">· ${selX.port.type.toUpperCase()} port</span>
          ${selC?`<span class="small"> · ${esc(CABLES[selC.type].short)} cable to ${esc(portName(P(B,otherEnd(selC,sel))))} · ${(()=>{const s=linkState(B,selC); return s.console?"console connection":s.up?`<b style="color:${s.mismatch?"var(--bad)":"var(--ok)"}">link up</b>${s.speed?` · ${s.speed} Mb/s`:""}${s.why?` — ${esc(s.why)}`:""}`:`<b style="color:var(--warn)">link down</b> — ${esc(s.why)}`;})()}</span>`:""}
          ${(()=>{ if (selX.dev.kind!=="switch" || !selX.port.ios) return ""; const ii = selX.dev.env.intfs[selX.port.ios]; if (ii.errdis) return `<div class="small" style="color:var(--warn)">err-disabled (${esc(ii.errdis)}) — fix the cause, then <code>shutdown</code> and <code>no shutdown</code></div>`;
            const lp = B._S.bundles.memberOf[sel] || selX.port.id; const vls = Object.keys(selX.dev.env.vlans).map(Number).filter(v=>(v<1002||v>1005) && carries(selX.dev, lp, v)); const x = B._S.stp[selX.dev.id] || {};
            const parts = vls.map(v=>{ const r = x[v] && x[v].on ? (x[v].roles[lp]||{role:"Desg",state:"FWD"}) : null; return r ? `VLAN ${v}: ${r.role} ${r.state}` : `VLAN ${v}: STP off`; });
            const mode = selX.dev.env.opMode(selX.port.ios);
            return `<div class="small muted">${lp.startsWith("po")?`member of Port-channel${lp.slice(2)} · `:""}${mode==="trunk"?"trunk":mode==="access"?`access VLAN ${ii.vlan}`:mode}${parts.length?` · Spanning Tree — ${parts.join(" · ")}`:""}</div>`; })()}
          <div class="btnrow">${selC?`<button class="btn sm ghost" data-unplug="${sel}">Unplug</button>`:""}${selC&&CABLES[selC.type].kind==="fibre"?`<button class="btn sm ghost" data-flip="${sel}">Flip Tx/Rx at this end</button>`:""}${selX.port.type==="sfp"&&selX.port.sfp&&!selC?`<button class="btn sm ghost" data-remove="${sel}">Remove ${esc(SFPS[selX.port.sfp].short)} module</button>`:""}<button class="btn sm ghost" data-desel="1">Close</button></div></div>`:""}
      <div class="bn-devs">${B.order.map(id=>{ const d = B.devs[id];
        const btns = [];
        if (d.kind==="pc"||d.kind==="server"||d.kind==="laptop"){ btns.push(`<button class="btn sm ghost" data-tool="ip:${id}">IP settings</button>`); if (v6InPlay(B, cfg)) btns.push(`<button class="btn sm ghost" data-tool="ip6:${id}">IPv6 settings</button>`); btns.push(`<button class="btn sm ghost" data-tool="cmd:${id}">Command Prompt</button>`); }
        if (d.kind==="server" && d.services) btns.push(`<button class="btn sm ghost" data-tool="svc:${id}">Server services</button>`);
        if (d.kind==="laptop") btns.push(`<button class="btn sm ghost" data-tool="putty:${id}">Terminal app (PuTTY)</button>`);
        if (d.kind==="laptop" && window.WIFIGUI) btns.push(`<button class="btn sm ghost" data-tool="wifi:${id}">Wi-Fi</button>`);
        if (d.kind==="wlc" && window.WLCGUI) btns.push(`<button class="btn sm ghost" data-tool="wlcgui:${id}">Controller GUI (https://${esc(d.ip||"")})</button>`);
        if (cfg.builder && d.env) btns.push(`<button class="btn sm ghost" data-tool="cli:${id}">CLI</button>`);
        if (cfg.builder) btns.push(`<button class="btn sm ghost" data-rename="${id}">Rename</button>`, `<button class="btn sm ghost" data-del="${id}">Delete</button>`);
        if (cfg.power) btns.push(`<button class="btn sm ghost" data-power="${id}">${d.on?"Power off":"Power on"}</button>`);
        return btns.length?`<div class="bn-dev"><b>${esc(d.label)}</b> ${btns.join("")}</div>`:""; }).join("")}</div>
      <div class="bn-tool">${toolHtml()}</div>
      <p class="small muted bn-labnote">Lab note: interface names are shortened to Gi0/x. Real kit numbers them by slot: a Catalyst 9200 uses Gi1/0/1, an ISR 1000/4000 router uses Gi0/0/0 — the commands are identical.</p>
      ${cfg.solve && cfg.solve.length ? `<div class="bn-solbox">${showSol ? `<div class="kbox"><div class="kbox-h">Worked solution${cfg.challenge?" — spoilers":""}</div>
          <ol class="small sol-list">${cfg.solve.map((a,k)=>`<li class="${play && k<play.i?"done":""}${play && k===play.i-1?" cur":""}">${describe(a)}</li>`).join("")}</ol>
          <div class="btnrow">${play?`<button class="btn sm" data-solstop>Stop</button>`:`<button class="btn sm" data-solplay>Watch it step by step</button>`}<button class="btn sm ghost" data-solhide>Hide solution</button></div>
          <p class="small muted">"Watch it" resets the bench and performs every step for you — the PC windows, the console and the frames on the wire — so you can see what right looks like. Then press <b>Reset bench</b> and do it yourself.</p></div>`
        : `<button class="btn sm ghost" data-solshow>${cfg.challenge?"Give up? Show the full solution (spoilers)":"Stuck? Show the solution"}</button>`}</div>` : ""}
      ${tasks.length?`<details class="bn-tasks" ${doneN<tasks.length?"open":""}><summary>${cfg.challenge?"Complaints to resolve":"All tasks"} (${doneN}/${tasks.length})</summary><div class="mt-tasks">${tasks.map((t,ti)=>{ const ok = isDone(t,ti); return `<div class="mt-task ${ok?"ok":""}"><span class="check ${ok?"done":""}">✓</span><span>${t.text}${cfg.challenge&&t.hint&&!ok?` <button class="btn sm ghost bn-hint" data-hint="${ti}">${hintsShown[ti]?"Hide hint":"Hint"}</button>${hintsShown[ti]?`<div class="small bn-hinttext">💡 ${t.hint}</div>`:""}`:""}</span></div>`; }).join("")}</div></details>`:""}`;
    wire();
  }
  function termBox(lines, inputId, runId, placeholder, extra){
    return `<div class="term bn-term">${lines.map(l=>`<div class="ln ${l.cls}">${esc(l.t)}</div>`).join("")}</div>
      <div class="termbar"><input id="${inputId}" autocomplete="off" spellcheck="false" placeholder="${esc(placeholder)}" aria-label="command"><button class="btn" id="${runId}">Send</button>${extra||""}</div>
      <p class="small muted" style="margin:4px 0 0">Enter runs the line · Tab completes a keyword · ↑ recalls the last command · end a line with <code>?</code> for help</p>`;
  }
  function toolHtml(){
    if (!tool) return "";
    const [kind, id] = tool.split(":"), d = B.devs[id];
    if (kind==="wlcgui" && window.WLCGUI && d && d.wlc) return window.WLCGUI.render(B, d, (B._wg = B._wg || {}));
    if (kind==="wifi" && window.WIFIGUI && d) return window.WIFIGUI.render(B, d);
    if (kind==="svc"){ const S = d.services || {}, part = [];
      if (S.dns){ const R = Object.entries(S.dns.records||{}); part.push(`<h4>DNS server${S.dns.authoritative===false ? " (public resolver)" : ""}</h4>` + (R.length ? `<table class="bn-tab"><tr><th>Name</th><th>Type</th><th>Address</th></tr>${R.map(([n,ip])=>`<tr><td>${esc(n)}</td><td>A</td><td>${esc(ip)}</td></tr>`).join("")}</table>` : "<p>No records.</p>")); }
      if (S.tftp){ const F = Object.entries(S.tftp.files||{}); part.push("<h4>TFTP server — files</h4>" + (F.length ? F.map(([n,b])=>`<details><summary><code>${esc(n)}</code> · ${b.length} bytes</summary><pre class="bn-pre">${esc(b)}</pre></details>`).join("") : "<p>No files yet.</p>")); }
      if (S.syslog){ const M = received(B, d, "log"); part.push("<h4>Syslog server — messages received (UDP 514)</h4>" + (M.length ? `<table class="bn-tab"><tr><th>Time</th><th>From</th><th>Sev</th><th>Message</th></tr>${M.map(m=>`<tr><td>${esc(m.t)}</td><td>${esc(m.src)} (${esc(m.from)})</td><td>${m.sev}</td><td><code>${esc(m.msg)}</code></td></tr>`).join("")}</table>` : "<p>Nothing received yet.</p>")); }
      if (S.ntp) part.push(`<h4>NTP server</h4><p>Stratum ${S.ntp.stratum||1} (reference ${esc(S.ntp.ref||".GPS.")}) — routers can use <code>ntp server ${esc(d.ip||"")}</code></p>`);
      if (S.nms){ const M = received(B, d, "trap"); part.push("<h4>SNMP manager — traps received (UDP 162)</h4>" + (M.length ? `<table class="bn-tab"><tr><th>Time</th><th>From</th><th>Trap</th></tr>${M.map(m=>`<tr><td>${esc(m.t)}</td><td>${esc(m.src)} (${esc(m.from)})</td><td>${/changed state to down/.test(m.msg) ? "IF-MIB::linkDown" : "IF-MIB::linkUp"} — ${esc((m.msg.match(/Interface (\S+?),/)||[])[1]||"")}</td></tr>`).join("")}</table>` : "<p>No traps yet.</p>") + "<p class=\"muted\">This server has the Net-SNMP tools: open its Command Prompt and use snmpget / snmpwalk / snmpset.</p>"); }
      return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · Server services</div>${part.join("")}<div class="btnrow"><button class="btn sm ghost" data-tool="">Close</button></div></div>`; }
    if (kind==="ip6"){ const v = d.ip6 || {auto:true};
      return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · Internet Protocol Version 6 (TCP/IPv6) Properties</div>
      <div class="bn-form"><label><input type="radio" name="bn6m" value="auto" ${v.auto?"checked":""}> Obtain an IPv6 address automatically</label><label><input type="radio" name="bn6m" value="static" ${v.auto?"":"checked"}> Use the following IPv6 address:</label>
      <label>IPv6 address<input class="txt" id="bn-ip6" value="${esc(v.addr||"")}" placeholder="e.g. 2001:db8:acad:1::10"></label>
      <label>Subnet prefix length<input class="txt" id="bn-len6" value="${esc(String(v.len||64))}" placeholder="64"></label>
      <label>Default gateway<input class="txt" id="bn-gw6" value="${esc(v.gw||"")}" placeholder="e.g. fe80::1"></label></div>
      <div class="btnrow"><button class="btn sm" id="bn-ip6save">OK</button><button class="btn sm ghost" data-tool="">Cancel</button></div></div>`; }
    if (kind==="ip") return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · Internet Protocol Version 4 (TCP/IPv4) Properties</div>
      <div class="bn-form"><label><input type="radio" name="bn4m" value="auto" ${d.dhcp?"checked":""}> Obtain an IP address automatically</label><label><input type="radio" name="bn4m" value="static" ${d.dhcp?"":"checked"}> Use the following IP address:</label>
      <label>IP address<input class="txt" id="bn-ip" value="${esc(d.ip||"")}" placeholder="e.g. 192.168.10.11"></label>
      <label>Subnet mask<input class="txt" id="bn-mask" value="${esc(d.mask||"")}" placeholder="e.g. 255.255.255.0"></label>
      <label>Default gateway<input class="txt" id="bn-gw" value="${esc(d.gw||"")}" placeholder="e.g. 192.168.10.1"></label>
      <label>Preferred DNS server<input class="txt" id="bn-dns" value="${esc(d.dhcp ? "" : (d.dns||[])[0]||"")}" placeholder="optional, e.g. 192.168.10.53"></label></div>
      <div class="btnrow"><button class="btn sm" id="bn-ipsave">OK</button><button class="btn sm ghost" data-tool="">Cancel</button></div></div>`;
    if (kind==="cmd"){ const L = pcLines[id] = pcLines[id] || [{t:"Microsoft Windows [Version 10.0.22631]\n(c) Microsoft Corporation. All rights reserved.", cls:""}];
      return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · ${B.remote[id]?`remote session to ${esc(B.remote[id].host)}`:"Command Prompt"}</div>${termBox(L, "bn-cmd", "bn-run", pcPrompt(B,d)||"(answer the prompt)", `<button class="btn sm ghost" data-tool="">Close</button>`)}</div>`; }
    if (kind==="cli"){ const L = cliLines[id] = cliLines[id] || [{t:`${d.env.host} — direct CLI (in a real network you'd use the console cable or SSH)`, cls:""}];
      return `<div class="bn-panel"><div class="mt-h">${esc(d.env.host)} · CLI</div>${termBox(L, "bn-cli", "bn-clirun", d.env.prompt()||"(answer the prompt)", `<button class="btn sm ghost" data-tool="">Close</button>`)}</div>`; }
    if (kind==="putty"){
      if (B.console && B.console.laptop===id){
        const s = B.console, t = B.devs[s.target];
        return `<div class="bn-panel"><div class="mt-h">COM3 — PuTTY · ${esc(t.env.host)} console ${s.good?"":"<span style='color:var(--warn)'>(settings mismatch)</span>"}</div>${termBox(s.lines, "bn-tin", "bn-trun", s.good&&t.on?(t.env.prompt()||"(answer the prompt)"):"", `<button class="btn sm ghost" id="bn-tclose">Close session</button>`)}</div>`;
      }
      const sel = (id2, opts, v) => `<select class="txt" id="${id2}">${opts.map(o=>`<option ${String(o)===String(v)?"selected":""}>${o}</option>`).join("")}</select>`;
      const usb = d.ports.find(p=>p.type==="usb"), c = usb && cableAt(B, id+":"+usb.id);
      return `<div class="bn-panel"><div class="mt-h">PuTTY Configuration · Serial</div>
        <p class="small muted">${c?"Device Manager shows <b>USB Serial Port (COM3)</b> — the console cable's adapter.":"No serial port found — nothing is plugged into the laptop's USB port."}</p>
        <div class="bn-form"><label>Serial line<input class="txt" value="COM3" disabled></label>
        <label>Speed (baud)${sel("bn-sp",[1200,2400,4800,9600,19200,38400,57600,115200],cons.speed)}</label>
        <label>Data bits${sel("bn-db",[5,6,7,8],cons.data)}</label><label>Parity${sel("bn-pa",["None","Odd","Even","Mark","Space"],cons.parity)}</label>
        <label>Stop bits${sel("bn-sb",[1,1.5,2],cons.stop)}</label><label>Flow control${sel("bn-fc",["None","XON/XOFF","RTS/CTS","DSR/DTR"],cons.flow)}</label></div>
        <div class="btnrow"><button class="btn sm" id="bn-open">Open</button><button class="btn sm ghost" data-tool="">Cancel</button></div></div>`;
    }
    return "";
  }
  function after(r){ if (r && r.msg) say(r.msg, r.ok?"":"bad"); animKey++; changed(); draw(); }
  function runPc(id, v){
    const d = B.devs[id], rem = B.remote[id], env = rem && inSession(B, id, e => ({pending: e.pending, noEcho: e.noEcho}));
    const L = pcLines[id] = pcLines[id] || [{t:"Microsoft Windows [Version 10.0.22631]\n(c) Microsoft Corporation. All rights reserved.", cls:""}];
    if (!v.trim() && !(env && env.pending)) { if (rem) L.push({t:pcPrompt(B,d), cls:"in"}); return; }
    K.termEcho(L, env, v, pcPrompt(B,d));
    K.termOut(L, act(B,["pc",id,v]).out);
    if (L.length>300) pcLines[id] = L.slice(-300);
  }
  function runTerm(v){
    const s = B.console; if (!s) return; const t = B.devs[s.target];
    if (s.good && t.on) K.termEcho(s.lines, t.env, v, t.env.prompt()); else s.lines.push({t:v, cls:"in"});
    K.termOut(s.lines, act(B,["term",v]).out);
    if (s.lines.length>300) s.lines = s.lines.slice(-300);
  }
  function stopPlay(){ if (play && play.t) clearInterval(play.t); play = null; }
  function startPlay(){
    stopPlay(); B = create(cfg); sel=null; hand=null; tool=null; won=false; watched = true; sticky = new Set(); for (const k in pcLines) delete pcLines[k];
    play = { i:0 }; const steps = cfg.solve;
    play.t = setInterval(() => {
      if (!el.isConnected || !play){ stopPlay(); return; }
      if (play.i >= steps.length){ stopPlay(); say("Solution complete — every task is done. Points are only awarded when you do it yourself: press Reset bench and try it."); draw(); return; }
      const a = steps[play.i]; play.i++;
      if (a[0]==="pc"){ tool = "cmd:"+a[1]; runPc(a[1], a[2]); }
      else if (a[0]==="console"){ tool = "putty:"+a[1]; Object.assign(cons, a[2]||{}); act(B, a); }
      else if (a[0]==="term"){ if (B.console) tool = "putty:"+B.console.laptop; runTerm(a[1]); }
      else { const r = act(B, a); if (a[0]==="ip") tool = null; if (r && r.ok===false) say(r.msg, "bad"); }
      say(`Step ${play.i} of ${steps.length}: ` + describe(a).replace(/<[^>]+>/g,""));
      animKey++; draw(); const tm = el.querySelector(".bn-term"); if (tm) tm.scrollTop = tm.scrollHeight;
    }, 1300);
    draw();
  }
  function focusSel(s){ const n = el.querySelector(s); if (n) n.focus(); const tm = el.querySelector(".bn-term"); if (tm) tm.scrollTop = tm.scrollHeight; }
  function wireTerm(inputSel, runSel, run, env){
    const inp = el.querySelector(inputSel), btn = el.querySelector(runSel); if (!inp) return;
    btn.onclick = () => run(inp.value);
    inp.onkeydown = e => {
      if (e.key==="Enter"){ run(inp.value); }
      else if (e.key==="Tab" && env && env.complete && !env.pending){ e.preventDefault(); inp.value = env.complete(inp.value); }
      else if (e.key==="ArrowUp" && env && env.history && env.history.length){ inp.value = env.history[env.history.length-1]; e.preventDefault(); }
    };
    const tm = el.querySelector(".bn-term"); if (tm) tm.scrollTop = tm.scrollHeight;
  }
  function wire(){
    el.querySelectorAll("[data-cable]").forEach(b=>b.onclick=()=>{ hand = {cable:b.dataset.cable, from:null}; sel=null; say(`Holding a ${CABLES[hand.cable].name}. Tap the first port.`); draw(); });
    el.querySelectorAll("[data-sfp]").forEach(b=>b.onclick=()=>{ hand = {sfp:b.dataset.sfp}; sel=null; say(`Holding a ${SFPS[hand.sfp].name}. Tap an empty SFP cage.`); draw(); });
    el.querySelectorAll("[data-drop]").forEach(b=>b.onclick=()=>{ hand=null; say("Put it back in the tray."); draw(); });
    el.querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>{ zoom = Math.max(1, Math.min(2.2, zoom + (+b.dataset.zoom)*0.4)); draw(); });
    el.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{ const d = newDevice(B, b.dataset.add); if (d){ say(`Added ${d.label}. Drag it where you want it, then cable it from the tray.`); changed(); } draw(); });
    el.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ const d = B.devs[b.dataset.del]; if (!d || !confirm(`Delete ${d.label} and its cables?`)) return; removeDevice(B, d.id); if (tool && tool.split(":")[1]===d.id) tool = null; sel = null; say(`Deleted ${d.label}.`); changed(); draw(); });
    el.querySelectorAll("[data-rename]").forEach(b=>b.onclick=()=>{ const d = B.devs[b.dataset.rename]; const n = prompt("New name (letters, digits, - and _):", d.label); if (!n) return; const clean = n.trim().replace(/[^\w-]/g,"").slice(0,24); if (!clean) return; d.label = clean; if (d.env) d.env.host = clean; changed(); draw(); });
    if (el.querySelector("#bn-cli")){ const id = tool.split(":")[1], d = B.devs[id];
      wireTerm("#bn-cli", "#bn-clirun", v => { const L = cliLines[id]; K.termEcho(L, d.env, v, d.env.prompt()); const o = act(B,["cli",id,v]).out;
        if (o && o.logout) L.push({t:"(session ended — press Enter to log in again)", cls:""}); else K.termOut(L, o);
        if (L.length>300) cliLines[id] = L.slice(-300); changed(); animKey++; draw(); focusSel("#bn-cli"); }, d.env); }
    if (cfg.builder){ const svg = el.querySelector(".bn-scene svg");
      el.querySelectorAll("[data-devg]").forEach(g=>g.onpointerdown = ev => {
        if (ev.target.closest(".bp") || hand) return;
        const d = B.devs[g.dataset.devg]; if (!d) return; ev.preventDefault();
        const ctm = svg.getScreenCTM().inverse(); const pt = svg.createSVGPoint();
        const toSvg = e => { pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(ctm); };
        const start = toSvg(ev), ox = d.x, oy = d.y; let moved = false, raf = 0;
        const move = e => { const q = toSvg(e); d.x = Math.max(0, Math.round(ox + q.x - start.x)); d.y = Math.max(0, Math.round(oy + q.y - start.y)); moved = true;
          if (!raf) raf = requestAnimationFrame(()=>{ raf = 0; const gg = el.querySelector(`[data-devg="${d.id}"]`); if (gg) gg.setAttribute("transform", `translate(${d.x-ox},${d.y-oy})`); }); };
        const upH = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", upH); if (moved){ changed(); draw(); } };
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", upH);
      }); }
    const ss = el.querySelector("[data-solshow]"); if (ss) ss.onclick = () => { if (cfg.challenge && !confirm("This shows how to fix every fault. Try the hints first — show the full solution anyway?")) return; showSol = true; draw(); };
    const sh = el.querySelector("[data-solhide]"); if (sh) sh.onclick = () => { stopPlay(); showSol = false; draw(); };
    const sp = el.querySelector("[data-solplay]"); if (sp) sp.onclick = () => startPlay();
    const st = el.querySelector("[data-solstop]"); if (st) st.onclick = () => { stopPlay(); say("Stopped. Press Reset bench to start again yourself."); draw(); };
    el.querySelectorAll("[data-hint]").forEach(b=>b.onclick=()=>{ const i = +b.dataset.hint; hintsShown[i] = !hintsShown[i]; draw(); });
    const an = el.querySelector("[data-anim]"); if (an) an.onchange = () => { showFrames = an.checked; draw(); };
    const rp = el.querySelector("[data-replay]"); if (rp) rp.onclick = () => { animKey++; draw(); const lg = el.querySelector(".bn-log"); if (lg) lg.open = true; };
    el.querySelectorAll(".bp").forEach(g=>g.onclick=()=>{
      const ref = g.dataset.port;
      if (hand && hand.sfp){ const r = act(B, ["insert", ref, hand.sfp]); if (r.ok) hand=null; return after(r); }
      if (hand && hand.cable){
        if (!hand.from){ const x = P(B, ref); if (cableAt(B, ref)) return after({ok:false, msg:`${portName(x)} already has a cable in it.`}); const why = endFits(hand.cable, x); if (why) return after({ok:false, msg:why}); hand.from = ref; return draw(); }
        const r = act(B, ["plug", hand.cable, hand.from, ref]); if (r.ok) hand=null; else hand.from = null; return after(r);
      }
      sel = sel===ref ? null : ref; draw();
    });
    el.querySelectorAll("[data-unplug]").forEach(b=>b.onclick=()=>{ const r = act(B,["unplug",b.dataset.unplug]); sel=null; after(r); });
    el.querySelectorAll("[data-flip]").forEach(b=>b.onclick=()=>after(act(B,["flip",b.dataset.flip])));
    el.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{ const r = act(B,["remove",b.dataset.remove]); sel=null; after(r); });
    el.querySelectorAll("[data-desel]").forEach(b=>b.onclick=()=>{ sel=null; draw(); });
    el.querySelectorAll("[data-power]").forEach(b=>b.onclick=()=>{ const d = B.devs[b.dataset.power]; after(act(B,["power", d.id, !d.on])); });
    el.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{ tool = b.dataset.tool || null; draw(); focusSel("#bn-cmd,#bn-ip,#bn-tin"); });
    const ip6s = el.querySelector("#bn-ip6save");
    if (ip6s) ip6s.onclick = () => { const id = tool.split(":")[1]; const m = (el.querySelector('input[name="bn6m"]:checked')||{}).value || "auto"; const r = act(B, ["ip6", id, m, el.querySelector("#bn-ip6").value.trim(), el.querySelector("#bn-len6").value.trim(), el.querySelector("#bn-gw6").value.trim()]); if (r.ok) tool=null; after(r); };
    const ips = el.querySelector("#bn-ipsave");
    if (tool && /^(wlcgui|wifi):/.test(tool)){ const [k2, i2] = tool.split(":"), d2 = B.devs[i2], ctx2 = {dev:d2, state:(B._wg = B._wg || {}), act:a=>{ const r = act(B, a); after(r); return r; }, redraw:()=>draw(), say:(m,c)=>say(m,c)};
      if (k2==="wlcgui" && window.WLCGUI) window.WLCGUI.wire(el.querySelector(".wlcgui"), ctx2); else if (window.WIFIGUI) window.WIFIGUI.wire(el.querySelector(".bn-panel"), ctx2); }
    if (ips) ips.onclick = () => { const id = tool.split(":")[1], m = (el.querySelector('input[name="bn4m"]:checked')||{}).value;
      const r = m==="auto" ? act(B, ["dhcp", id]) : act(B, ["ip", id, el.querySelector("#bn-ip").value.trim(), el.querySelector("#bn-mask").value.trim(), el.querySelector("#bn-gw").value.trim(), el.querySelector("#bn-dns").value.trim()]); if (r.ok) tool=null; after(r); };
    if (el.querySelector("#bn-cmd")){ const id = tool.split(":")[1], d = B.devs[id];
      wireTerm("#bn-cmd", "#bn-run", v => { runPc(id, v); animKey++; draw(); focusSel("#bn-cmd"); }, B.remote[id] && B.remote[id].env); void d; }
    const op = el.querySelector("#bn-open");
    if (op) op.onclick = () => { Object.assign(cons, { speed:el.querySelector("#bn-sp").value, data:el.querySelector("#bn-db").value, parity:el.querySelector("#bn-pa").value, stop:el.querySelector("#bn-sb").value, flow:el.querySelector("#bn-fc").value });
      const r = act(B, ["console", tool.split(":")[1], cons]); after(r); focusSel("#bn-tin"); };
    if (el.querySelector("#bn-tin")){ const s = B.console, t = B.devs[s.target];
      wireTerm("#bn-tin", "#bn-trun", v => { runTerm(v); animKey++; draw(); focusSel("#bn-tin"); }, s.good ? t.env : null);
      el.querySelector("#bn-tclose").onclick = () => { B.console = null; draw(); }; }
  }
  el.reset = () => { stopPlay(); watched = false; sticky = new Set(); B = create(cfg); sel=null; hand=null; tool=null; won=false; for (const k in pcLines) delete pcLines[k]; say("Bench reset — everything is back as it started."); draw(); };
  el.load = (newCfg) => { stopPlay(); sticky = new Set(); cfg = Object.assign({}, cfg, newCfg); B = create(cfg); sel=null; hand=null; tool=null; for (const k in pcLines) delete pcLines[k]; for (const k in cliLines) delete cliLines[k]; say(newCfg.start || "Loaded."); draw(); };
  draw();
  return { get bench(){ return B; } };
}

window.Bench = { create, act, mount, addDevice, removeDevice, exportTopology, defaultPorts, linkState, linkUpAt, cableAt, CABLES, SFPS,
  linked: (B, a, b) => B.cables.some(c=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a)),
  up: (B, a, b) => B.cables.some(c=>((c.a===a&&c.b===b)||(c.a===b&&c.b===a)) && linkState(B,c).up),
  upAt: (B, ref) => linkUpAt(B, ref),
  cableType: (B, ref) => { const c = cableAt(B, ref); return c ? c.type : null; },
  consoleOk: (B, dev) => !!(B.console && B.console.good && (!dev || B.console.target===dev)),
  pinged: (B, from, ip) => B.pinged[from+">"+ip]===true,
  pingedNow: (B, from, ip, vrf) => { const k = from+">"+(vrf ? vrf+":" : "")+ip; return B.pinged[k]===true && !!B.pingSig && B.pingSig[k]===l3Sig(B); },
  // IP services (Module 7+)
  leased: (B, pc) => { const d = B.devs[pc]; return d && d.dhcp && d.ip && d.lease ? d.ip : null; },
  snoopBound: (B, sw, mac) => { const d = B.devs[sw]; return !!(d && d.env && d.env.snoopBind && Object.values(d.env.snoopBind).some(b=>!mac || b.mac===mac)); },
  daiDrops: (B, sw, vlan) => { const d = B.devs[sw]; const x = d && d.env && d.env.daiStats && d.env.daiStats[vlan]; return x ? x.drop : 0; },
  sessionMode: (B, pc) => B.remote[pc] ? inSession(B, pc, e => e.mode) : null,
  sessionPrompt: (B, pc) => B.remote[pc] ? inSession(B, pc, e => e.prompt()) : null,
  apJoined: (B, ap) => { computeL3(B); return !!(B.devs[ap] && B.devs[ap].joinedTo); },
  wifiAssoc: (B, pc) => { computeL3(B); return !!(B.devs[pc] && B.devs[pc].wifiAt); },
  wifiVlan: (B, pc) => { computeL3(B); const w = B.devs[pc] && B.devs[pc].wifiAt; return w ? w.vlan : null; },
  wlanUp: (B, wlc, ssid) => { const d = B.devs[wlc]; return !!(d && d.wlc && Object.values(d.wlc.wlans).some(w=>w.ssid===ssid && w.enabled)); },
  quietMode: (B, dev) => { const e = B.devs[dev] && B.devs[dev].env; return !!(e && e.quietUntil && B.now < e.quietUntil); },
  loginFailures: (B, dev) => { const e = B.devs[dev] && B.devs[dev].env; return e ? (e.loginTotalFails||0) : 0; },
  psecViolations: (B, sw, port) => { const d = B.devs[sw]; const pp = d && d.ports.find(q=>q.id===port); const i = pp && d.env.intfs[pp.ios]; return i ? (i.psecViolCount||0) : 0; },
  secureMacs: (B, sw, port) => { const d = B.devs[sw]; const pp = d && d.ports.find(q=>q.id===port); const i = pp && d.env.intfs[pp.ios]; return i && i.psecMacs ? i.psecMacs.map(m=>m.mac + ":" + m.type) : []; },
  aclHits: (B, r, name, seq) => { const d = B.devs[r]; const l = d && d.env && d.env.acl.lists[name]; const e = l && l.entries.find(x=>!x.remark && x.seq===seq); return e ? e.hits : 0; },
  blocked: (B, pc, ip) => B.events.some(e=>e.a[0]==="pc" && e.a[1]===pc && new RegExp("^(ping|tracert|curl)\\b.*" + ip.replace(/\./g, "\\.")).test(e.a[2]||"")) && !B.pinged[pc+">"+ip],
  fetched: (B, pc, host) => !!(B.fetched && B.fetched[pc+">"+host]),
  syslogGot: (B, srv, re) => received(B, B.devs[srv], "log").some(m=>re.test(m.msg)),
  trapGot: (B, srv, re) => received(B, B.devs[srv], "trap").some(m=>re.test(m.msg)),
  tftpFile: (B, srv, name) => { const S = B.devs[srv] && B.devs[srv].services; const f = S && S.tftp && S.tftp.files; return f ? (name ? f[name]!=null : Object.keys(f).length > 0) : false; },
  ntpSynced: (B, r) => { const d = B.devs[r]; computeL3(B); return !!(d && d.env && ntpOf(B, d, 0).synced); },
  resolved: (B, pc, name) => { const d = B.devs[pc]; return !!(d && resolveWin(B, d, name).ip); },
  natHas: (B, r, re) => { const d = B.devs[r]; return !!(d && d.env && d.env.nat && re.test(window.NAT.show(d.env.nat))); },
  ifLeased: (B, r, ios) => { const d = B.devs[r]; const i = d && d.env && d.env.intfs[ios]; return i && i.dhcpClient && i.ip ? i.ip : null; },
  dhcpBound: (B, r, ip) => { const d = B.devs[r]; return !!(d && d.env && d.env.dhcp && d.env.dhcp.bindings.some(b=>!ip || b.ip===ip)); },
  // Layer 3 (Module 5+): OSPF adjacency, routes in the RIB, HSRP role, a completed traceroute
  ospfNbr: (B, r, rid, state) => { const o = computeL3(B).ospf[r]; return !!(o && o.nbrs.some(n=>n.rid===rid && (state ? n.state.startsWith(state) : /^FULL/.test(n.state)))); },
  ospfNbrCount: (B, r) => { const o = computeL3(B).ospf[r]; return o ? o.nbrs.filter(n=>/^FULL/.test(n.state)).length : 0; },
  ospfDr: (B, r, ios) => { const o = computeL3(B).ospf[r]; const x = o && o.ifs[ios]; return x && x.dr ? x.dr.rid : null; },
  route: (B, r, prefix, code, vrf) => { const d = B.devs[r]; if (!d || !d.env || !d.env.rib) return null; computeL3(B); const [net, len] = prefix.split("/"); const e = d.env.rib(vrf||null).find(x=>x.net===net && x.len===+len);
    if (!e || (code && e.code!==code && !(code==="O" && /^O/.test(e.code)))) return null; return {code:e.code, ad:e.ad, metric:e.metric, via: e.nhs.map(h=>h.cfgNh || h.nh || h.ios)}; },
  routeVia: (B, r, dst, vrf) => { const d = B.devs[r]; if (!d || !d.env || !d.env.lookup) return null; computeL3(B); const x = d.env.lookup(dst, vrf||null); return x ? x.nh : null; },
  traced: (B, from, ip) => !!(B.traced && B.traced[from+">"+ip]),
  hsrpState: (B, r, ios, grp) => { const x = computeL3(B).hsrp[r+"|"+ios+"#"+(grp||0)]; return x ? x.state : null; },
  macKnown: (B, sw, mac, vlan) => Object.values(B.mac[sw]||{}).some(e=>e.mac===mac && (vlan==null || e.vlan===+vlan)),
  macPort: (B, sw, mac, vlan) => { const e = Object.values(B.mac[sw]||{}).find(e=>e.mac===mac && (vlan==null || e.vlan===+vlan)); if (!e) return null; const d = B.devs[sw]; return e.port.startsWith("po") ? "Po"+e.port.slice(2) : shortIf(d.ports.find(p=>p.id===e.port).ios); },
  macCount: (B, sw) => Object.keys(B.mac[sw]||{}).length,
  arpHas: (B, dev, ip) => !!(B.arp[dev] && B.arp[dev][ip]),
  remoteTo: (B, pc) => B.remote[pc] && !B.remote[pc].pendingAuth ? B.remote[pc].host : null,
  session: (B, pc) => { const r = B.remote[pc]; return r && !r.pendingAuth ? {host:r.host, proto:r.proto, user:r.user||null} : null; },
  tried: (B, pc, re) => B.events.some(e=>e.a[0]==="pc" && e.a[1]===pc && re.test(e.a[2]||"")),
  proxied: B => (B.proxied||0) > 0,
  stormed: B => (B.stormSeen||0) > 0,
  stp: (B, sw, vlan) => { const S = l2State(B); return S.stp[sw] && S.stp[sw][vlan] ? S.stp[sw][vlan] : null; },
  stpRole: (B, sw, port, vlan) => { const S = l2State(B); const d = B.devs[sw]; const lp = port.startsWith("po") ? port : (S.bundles.memberOf[sw+":"+port] || port); const x = S.stp[sw] && S.stp[sw][vlan]; const r = x && x.roles[lp]; return r ? r.role+" "+r.state : null; },
  stpRoot: (B, vlan) => { const S = l2State(B); for (const id of B.order){ const x = S.stp[id] && S.stp[id][vlan]; if (x && x.on && x.isRoot) return id; } return null; },
  bundled: (B, sw, group) => { const S = l2State(B); const G = (S.bundles[sw]||{})[group]; return !!(G && G.up && G.members.filter(m=>m.flag==="P").length>=2); },
  trunking: (B, sw, port) => { const d = B.devs[sw]; const p = d.ports.find(q=>q.id===port); return d.env.opMode(p.ios)==="trunk"; },
  errdis: (B, sw, port) => { const d = B.devs[sw]; const p = d.ports.find(q=>q.id===port); return d.env.intfs[p.ios].errdis || null; },
  logged: (B, sw, re) => { try { computeL3(B); } catch(e){} return (B.syslog[sw]||[]).some(x=>re.test(x.msg)); },
  loggedRaw: (B, sw, re) => (B.syslog[sw]||[]).some(x=>re.test(x.msg)),
  // WAN, VRFs and tunnels (Module 10+)
  vrfOf: (B, r, ios) => { const d = B.devs[r]; const i = d && d.env && d.env.intfs[ios]; return i ? (i.vrf || null) : null; },
  vrfRoute: (B, r, vrf, prefix, code) => { const d = B.devs[r]; if (!d || !d.env || !d.env.rib) return null; computeL3(B); const [net, len] = prefix.split("/"); const e = d.env.rib(vrf||null).find(x=>x.net===net && x.len===+len);
    if (!e || (code && e.code!==code && !(code==="O" && /^O/.test(e.code)))) return null; return {code:e.code, ad:e.ad, metric:e.metric, via: e.nhs.map(h=>h.cfgNh || h.nh || h.ios)}; },
  vrfRouteVia: (B, r, vrf, dst) => { const d = B.devs[r]; if (!d || !d.env || !d.env.lookup) return null; computeL3(B); const x = d.env.lookup(dst, vrf||null); return x ? x.nh : null; },
  vrfPinged: (B, r, vrf, ip) => B.pinged[r+">"+(vrf ? vrf+":" : "")+ip]===true,
  vrfOspfNbr: (B, r, vrf, rid, state) => { const o = computeL3(B).ospf[vrf ? r+"#"+vrf : r]; return !!(o && o.nbrs.some(n=>n.rid===rid && (state ? n.state.startsWith(state) : /^FULL/.test(n.state)))); },
  tunnelUp: (B, r, n) => { const d = B.devs[r]; if (!d || !d.env || !d.env.tunInfo) return false; computeL3(B); const ios = typeof n==="number" || /^\d+$/.test(String(n)) ? "Tunnel" + n : n; const t = d.env.tunInfo().find(x=>x.ios===ios); return !!(t && t.up); },
  tunnelWhy: (B, r, n) => { const d = B.devs[r]; if (!d || !d.env || !d.env.tunInfo) return null; computeL3(B); const ios = typeof n==="number" || /^\d+$/.test(String(n)) ? "Tunnel" + n : n; const t = d.env.tunInfo().find(x=>x.ios===ios); return t ? (t.why || "up") : null; },
  recursive: (B, r, n) => { const d = B.devs[r]; computeL3(B); const ios = typeof n==="number" || /^\d+$/.test(String(n)) ? "Tunnel" + n : n; return !!(d && d.env && (d.env.tunRec||{})[ios]); },
  greSeen: B => (B._greLast||0) > 0,
  mismatch: (B, a, b) => B.cables.some(c=>((c.a===a&&c.b===b)||(c.a===b&&c.b===a)) && linkState(B,c).mismatch),
};
})();
