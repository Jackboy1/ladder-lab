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
function bcastOf(ip, mask){ const A = ipToInt(ip), M = ipToInt(mask); const b = ((A & M) | (~M>>>0))>>>0; return [24,16,8,0].map(s=>(b>>>s)&255).join("."); }
function macFor(seed){ let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)>>>0; const hex = ("0050" + h.toString(16).padStart(8,"0")).slice(0,12); return hex.replace(/(.{4})(.{4})(.{4})/, "$1.$2.$3"); }
const winMac = m => m.replace(/\./g,"").toUpperCase().replace(/(..)(?!$)/g,"$1-");
const shortIf = n => n.replace("GigabitEthernet","Gi").replace("FastEthernet","Fa");

/* ---------------- model ---------------- */
function create(cfg){
  const B = { cfg, devs:{}, order:[], cables:[], pinged:{}, console:null, events:[], mac:{}, arp:{}, frames:[], log:[], remote:{} };
  for (const d0 of cfg.devices){
    const d = clone(Object.assign({}, d0, {setup:undefined, config:undefined}));
    d.on = d0.on!==false;
    d.mdix = d0.mdix!==false;
    d.ports = (d0.ports || defaultPorts(d0.kind)).map(p=>Object.assign({sfp:null}, p));
    if (d0.sfp) for (const [pid,mod] of Object.entries(d0.sfp)){ const p = d.ports.find(x=>x.id===pid); if (p) p.sfp = mod; }
    if (d.kind==="switch" || d.kind==="router"){
      d.env = SIM.ios2Env({ host:d0.host || d0.label, kind:d.kind, ports:d.ports.filter(p=>p.ios).map(p=>p.ios), mac:d0.mac || macFor(d.id).slice(0,9), model:d0.platform, hooks:makeHooks(B, d) });
      if (d0.config) d0.config(d.env);              // pre-configure (e.g. a broken network to troubleshoot)
      if (!d0.fresh) d.env.baseline();              // the device's starting config is its saved startup-config (fresh:true = out of the box)
      B.mac[d.id] = {}; B.arp[d.id] = {};
    } else if (d.kind!=="hub"){
      d.mac = d0.mac || macFor(d.id); B.arp[d.id] = {};
    }
    if (d0.setup) d0.setup(d);
    B.devs[d.id] = d; B.order.push(d.id);
  }
  for (const c of (cfg.cables||[])){ const r = plug(B, c.type, c.a, c.b, true); if (r.ok && c.swapped) r.cable.swapped = true; }
  return B;
}
function defaultPorts(kind){
  if (kind==="switch") return [...Array(8)].map((_,i)=>({id:"g"+(i+1), type:"rj45", label:String(i+1), ios:"GigabitEthernet0/"+(i+1)}))
    .concat([{id:"g9", type:"sfp", label:"9", ios:"GigabitEthernet0/9"},{id:"g10", type:"sfp", label:"10", ios:"GigabitEthernet0/10"},{id:"con", type:"console", label:"CON"}]);
  if (kind==="router") return [{id:"g0", type:"rj45", label:"G0/0", ios:"GigabitEthernet0/0"},{id:"g1", type:"rj45", label:"G0/1", ios:"GigabitEthernet0/1"},{id:"con", type:"console", label:"CON"}];
  if (kind==="hub") return [1,2,3,4].map(i=>({id:"p"+i, type:"rj45", label:String(i)}));
  if (kind==="laptop") return [{id:"eth", type:"rj45", label:"ETH"},{id:"usb", type:"usb", label:"USB"}];
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
function adminUp(x){ const i = intfOf(x); return !(i && i.shut); }
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
  for (const x of [A,Bp]) if (!adminUp(x)) return {up:false, why:`${portName(x)} is administratively down — it needs 'no shutdown'.`};
  const n = negotiate(A, Bp);
  if (!n.up) return n;
  return Object.assign({up:true}, n, n.mismatch ? {why:`Link is up but there is a DUPLEX MISMATCH: ${portName(A)} is ${n.dA}-duplex, ${portName(Bp)} is ${n.dB}-duplex. Expect CRC errors and late collisions, and very slow transfers.`} : {});
}
function linkUpAt(B, ref){ const c = cableAt(B,ref); return !!(c && CABLES[c.type].kind!=="console" && linkState(B,c).up); }

/* ---- frame delivery: switches learn + flood/forward, hubs repeat, endpoints accept ---- */
// ingress: a port ref the frame is transmitted OUT of (onto its cable), or {svi:devId, vlan} for frames sourced by a switch itself
function deliver(B, from, frame, step0){
  const hops = [], recv = [], notes = [];
  const seen = new Set();
  const pushNote = s => { if (!notes.includes(s)) notes.push(s); };
  const sendOut = (ref, vlan, step) => {
    const c = cableAt(B, ref); if (!c || CABLES[c.type].kind==="console" || !linkState(B,c).up) return;
    const farRef = otherEnd(c, ref); hops.push({a:ref, b:farRef, step, kind: frame.dst===BCAST ? "bcast" : "ucast", label:frame.label});
    arrive(farRef, vlan, step+1);
  };
  const switchIn = (sw, inPortId, vlan, step) => {
    const key = sw.id+"|"+vlan; if (seen.has(key)) return; seen.add(key);
    const T = B.mac[sw.id];
    for (const [m,e] of Object.entries(T)) if (!linkUpAt(B, sw.id+":"+e.port)) delete T[m];
    const had = inPortId && T[frame.src] && T[frame.src].port===inPortId && T[frame.src].vlan===vlan;
    const moved = inPortId && T[frame.src] && !had;
    if (inPortId) T[frame.src] = { port: inPortId, vlan };
    const inP = inPortId && sw.ports.find(p=>p.id===inPortId);
    // the switch's own SVI in this VLAN may be the receiver
    const svi = sw.env.intfs["Vlan"+vlan];
    if (svi && !svi.shut && svi.ip && (frame.dst===BCAST || frame.dst===svi.mac)) recv.push({dev:sw, svi:"Vlan"+vlan, vlan});
    if (frame.dst===(svi&&svi.mac)) return;
    const known = frame.dst!==BCAST && T[frame.dst] && T[frame.dst].vlan===vlan ? T[frame.dst] : null;
    const outs = [];
    for (const p of sw.ports){
      if (!p.ios || p.id===inPortId) continue;
      const i = sw.env.intfs[p.ios]; if (!i || i.shut) continue;
      const carries = i.mode==="trunk" ? (!i.allowed || i.allowed.includes(vlan)) : i.vlan===vlan;
      if (!carries) continue;
      if (known && known.port!==p.id) continue;
      if (!linkUpAt(B, sw.id+":"+p.id)) continue;
      outs.push(p);
    }
    const nm = shortIf, inName = inP ? nm(inP.ios) : "its own CPU";
    if (inPortId) pushNote(had ? `${sw.label} already knew ${frame.src} on ${inName} — refreshed its aging timer` : moved ? `${sw.label} saw ${frame.src} move to ${inName} — updated the table` : `${sw.label} learned ${frame.src} on ${inName} (VLAN ${vlan})`);
    if (known) pushNote(`${sw.label} knows ${frame.dst} is on ${outs.length?nm(outs[0].ios):"the port it came in on"} → forwarded out that port only`);
    else pushNote(`${sw.label} ${frame.dst===BCAST?"received a broadcast":"doesn't know "+frame.dst+" (unknown unicast)"} → flooded out ${outs.length?outs.map(p=>nm(p.ios)).join(", "):"no other ports"}`);
    for (const p of outs) sendOut(sw.id+":"+p.id, vlan, step);
  };
  const arrive = (ref, vlan, step) => {
    const x = P(B, ref); const d = x.dev;
    if (d.kind==="switch"){ const i = d.env.intfs[x.port.ios]; if (!i || i.shut) return; let v = i.mode==="trunk" ? vlan : i.vlan; if (i.mode==="trunk" && i.allowed && !i.allowed.includes(v)) return; if (v==null) v = i.vlan||1; switchIn(d, x.port.id, v, step); return; }
    if (d.kind==="hub"){ const key = d.id; if (seen.has(key)) return; seen.add(key); pushNote(`${d.label} (hub) repeated the frame out every other port — every device on it sees it`); for (const p of d.ports) if (p.id!==x.port.id) sendOut(d.id+":"+p.id, vlan, step); return; }
    if (d.kind==="router"){ const i = d.env.intfs[x.port.ios]; if (!i || i.shut) return; if (frame.dst===BCAST || frame.dst===i.mac) recv.push({dev:d, ref, ios:x.port.ios}); return; }
    if (frame.dst===BCAST || frame.dst===d.mac) recv.push({dev:d, ref}); else if (frame.kind!=="arp") pushNote(`${d.label} saw a frame for ${frame.dst} and ignored it (not its MAC)`);
  };
  if (from.svi){ const sw = B.devs[from.svi]; switchIn(sw, null, from.vlan, step0||0); }
  else sendOut(from, null, step0||0);
  return {hops, recv, notes};
}

/* ---- IP layer ---- */
// a "node" is something that sends IP: {dev, ref?, svi?, ios?, ip, mask, gw, mac, vlan?}
function hostNode(d){ return {dev:d, ref: d.id+":"+d.ports.find(p=>p.type==="rj45").id, ip:d.ip, mask:d.mask, gw:d.gw, mac:d.mac}; }
function ipOwner(B, ip){
  for (const id of B.order){ const d = B.devs[id];
    if (d.env){ for (const [n,i] of Object.entries(d.env.intfs)) if (i.ip===ip) return {dev:d, ios:n, i}; }
    else if (d.ip===ip) return {dev:d}; }
  return null;
}
function routerNodeFor(r, ios){ const i = r.env.intfs[ios]; return {dev:r, ref:refOfIos(r, ios), ios, ip:i.ip, mask:i.mask, mac:i.mac}; }
function routeLookup(r, dst){
  const env = r.env; let best = null;
  for (const [n,i] of Object.entries(env.intfs)) if (i.ip && !i.shut && sameNet(i.ip, dst, i.mask) && env.intfs[n] && ifaceUp(r, n)) { const len = i.mask.split(".").reduce((a,o)=>a+((+o).toString(2).match(/1/g)||[]).length,0); if (!best || len>best.len) best = {ios:n, nh:dst, len}; }
  if (best) return best;
  for (const rt of env.routes){ if (sameNet(rt.net, dst, rt.mask)){ for (const [n,i] of Object.entries(env.intfs)) if (i.ip && !i.shut && sameNet(i.ip, rt.nh, i.mask) && ifaceUp(r,n)) return {ios:n, nh:rt.nh}; } }
  return null;
}
function ifaceUp(d, ios){ const i = d.env.intfs[ios]; if (!i || i.shut) return false; if (i.mode==="svi") return true; const ref = refOfIos(d, ios); return !!(ref && linkUpAt(B_ctx.B, ref)); }
const B_ctx = {B:null};
// ARP + one IP hop from `node` towards `nh`; returns {ok, toNode (receiving endpoint), arped}
function hop(B, node, nhIp, label, ttl){
  const cache = B.arp[node.dev.id] || (B.arp[node.dev.id] = {});
  let arped = false, out = {frames:[], log:[]};
  const fromSpec = node.svi ? {svi:node.dev.id, vlan:node.vlan} : node.ref;
  let entry = cache[nhIp];
  if (!entry){
    arped = true;
    const req = deliver(B, fromSpec, {src:node.mac, dst:BCAST, kind:"arp", label:"ARP?"}, B.step);
    out.frames.push(...req.hops); out.log.push(`<b>ARP request</b> (broadcast to ${BCAST}) from ${node.dev.label}: "Who has ${nhIp}? Tell ${node.ip}"`, ...req.notes.map(n=>"&nbsp;&nbsp;· "+n));
    B.step += Math.max(1, ...req.hops.map(h=>h.step+1-B.step));
    let owner = req.recv.find(r=>{ if (r.svi) return r.dev.env.intfs[r.svi].ip===nhIp; if (r.ios) return r.dev.env.intfs[r.ios].ip===nhIp; return r.dev.ip===nhIp; });
    let viaProxy = false;
    if (!owner){
      // proxy ARP (on by default in IOS): a router answers for an address it can route to out of a DIFFERENT interface
      owner = req.recv.find(r=>{ if (!r.ios) return false; const i = r.dev.env.intfs[r.ios]; if (!i.ip || i.proxyArp===false || sameNet(i.ip, nhIp, i.mask)) return false; const rt = routeLookup(r.dev, nhIp); return !!(rt && rt.ios!==r.ios); });
      viaProxy = !!owner;
    }
    if (!owner){ out.log.push(`&nbsp;&nbsp;· No device answered — nothing on this network has ${nhIp} (or it can't be reached at Layer 2)`); return Object.assign(out, {ok:false, arped}); }
    const ownerMac = owner.svi ? owner.dev.env.intfs[owner.svi].mac : owner.ios ? owner.dev.env.intfs[owner.ios].mac : owner.dev.mac;
    const ownerFrom = owner.svi ? {svi:owner.dev.id, vlan:owner.vlan} : owner.ref;
    const ownerCache = B.arp[owner.dev.id] || (B.arp[owner.dev.id] = {});
    ownerCache[node.ip] = {mac:node.mac, intf: owner.svi || owner.ios || "eth"};
    const rep = deliver(B, ownerFrom, {src:ownerMac, dst:node.mac, kind:"arp", label:"ARP"}, B.step);
    out.frames.push(...rep.hops); out.log.push(viaProxy ? `<b>Proxy ARP reply</b> (unicast) from ${owner.dev.label} ${shortIf(owner.ios)}: "${nhIp} is at ${ownerMac}" — the router answers with ITS OWN MAC because it has a route to ${nhIp} out of another interface` : `<b>ARP reply</b> (unicast) from ${owner.dev.label}: "${nhIp} is at ${ownerMac}"`, ...rep.notes.map(n=>"&nbsp;&nbsp;· "+n));
    if (viaProxy) B.proxied = (B.proxied||0) + 1;
    B.step += Math.max(1, ...rep.hops.map(h=>h.step+1-B.step));
    if (!rep.recv.some(r=>r.dev===node.dev)) return Object.assign(out, {ok:false, arped});
    entry = cache[nhIp] = {mac:ownerMac, intf: node.svi || node.ios || "eth"};
  }
  const f = deliver(B, fromSpec, {src:node.mac, dst:entry.mac, kind:"ip", label}, B.step);
  out.frames.push(...f.hops); out.log.push(`<b>${label}</b> ${node.ip} → ${nhIp==="?"?"":""}frame to ${entry.mac} (TTL ${ttl})`, ...f.notes.map(n=>"&nbsp;&nbsp;· "+n));
  B.step += Math.max(1, ...f.hops.map(h=>h.step+1-B.step));
  const rcv = f.recv.find(r=>{ const m = r.svi ? r.dev.env.intfs[r.svi].mac : r.ios ? r.dev.env.intfs[r.ios].mac : r.dev.mac; return m===entry.mac; });
  return Object.assign(out, {ok:!!rcv, to:rcv, arped});
}
// one direction: node → dstIp, hop by hop. returns {ok, kind, arpedFirst, frames, log, finalNode}
function sendIp(B, node, dstIp, label){
  const res = {frames:[], log:[], ok:false, kind:"timeout"};
  let cur = node, ttl = 128;
  for (let n=0; n<8; n++){
    let nh;
    if (cur.dev.kind==="router"){
      // a router: own address?
      for (const [nm,i] of Object.entries(cur.dev.env.intfs)) if (i.ip===dstIp && !i.shut){ res.ok = true; res.final = {dev:cur.dev, ios:nm}; return res; }
      const r = routeLookup(cur.dev, dstIp); if (!r){ res.log.push(`${cur.dev.label} has no route to ${dstIp} — packet dropped`); res.kind = n===0 ? "noroute" : "timeout"; return res; }
      cur = routerNodeFor(cur.dev, r.ios); nh = r.nh;
    } else {
      if (cur.ip===dstIp){ res.ok = true; res.final = cur; return res; }
      if (sameNet(cur.ip, dstIp, cur.mask)) nh = dstIp;
      else if (cur.gw && sameNet(cur.ip, cur.gw, cur.mask)) nh = cur.gw;
      else if (cur.svi && !cur.gw) nh = dstIp;   // an IOS switch with no default gateway ARPs for every destination (works only if a router answers with proxy ARP)
      else { res.kind = n===0 ? "general" : "timeout"; res.log.push(`${cur.dev.label} has no default gateway for ${dstIp}`); return res; }
    }
    const h = hop(B, cur, nh, label, ttl);
    res.frames.push(...h.frames); res.log.push(...h.log);
    if (n===0) res.arpedFirst = h.arped;
    if (!h.ok){ res.kind = n===0 ? "unreach" : "timeout"; return res; }
    const to = h.to;
    if (to.svi){ if (to.dev.env.intfs[to.svi].ip===dstIp){ res.ok=true; res.final={dev:to.dev, svi:to.svi, vlan:+to.svi.slice(4)}; return res; } res.log.push(`${to.dev.label} isn't a router — dropped`); return res; }
    if (to.dev.kind==="router"){
      const own = Object.entries(to.dev.env.intfs).find(([nm,i])=>i.ip===dstIp && !i.shut);
      if (own){ res.ok = true; res.final = {dev:to.dev, ios:own[0]}; res.log.push(`${to.dev.label} received it on ${shortIf(to.ios)} — it's addressed to the router itself`); return res; }
      cur = {dev:to.dev}; ttl--; res.routers = (res.routers||0)+1; res.log.push(`${to.dev.label} received it on ${shortIf(to.ios)}, decrements TTL to ${ttl} and routes it`); continue; }
    if (to.dev.ip===dstIp){ res.ok = true; res.final = hostNode(to.dev); return res; }
    return res;
  }
  return res;
}
function nodeFromFinal(B, f){
  if (f.svi) return sviNode(f.dev, f.svi);
  if (f.ios) return {dev:f.dev};
  return hostNode(f.dev);
}
function sviNode(sw, name){ const i = sw.env.intfs[name]; return {dev:sw, svi:name, vlan:+name.slice(4), ip:i.ip, mask:i.mask, gw:sw.env.defaultGw, mac:i.mac}; }
// full ping: request + reply. returns {ok, kind, firstMiss}
function ping(B, node, dstIp){
  B_ctx.B = B; B.step = 0;
  if (node.dev.kind==="router" && !node.ip){ const r = routeLookup(node.dev, dstIp); if (r) node = {dev:node.dev, ip:node.dev.env.intfs[r.ios].ip}; }
  const go = sendIp(B, node, dstIp, "ICMP echo request");
  let frames = go.frames, log = go.log.slice(), ok = false, kind = go.kind;
  if (go.ok){
    const back = sendIp(B, nodeFromFinal(B, go.final), node.ip, "ICMP echo reply");
    frames = frames.concat(back.frames); log = log.concat(back.log);
    ok = back.ok; if (!ok){ kind = "timeout"; log.push(`The reply couldn't get back to ${node.ip} — check the far end's default gateway and the return path`); }
    var replyTtl = (go.final.dev.env ? 255 : 128) - (back.routers||0);
  }
  B.frames = frames; B.log = log;
  return {ok, kind, ttl: replyTtl, firstMiss: go.arpedFirst && node.dev.kind!=="pc" && node.dev.kind!=="server" && node.dev.kind!=="laptop"};
}

/* ---- hooks the IOS engine calls ---- */
function makeHooks(B, d){
  return {
    linkUp: name => { const ref = refOfIos(d, name); return !!(ref && linkUpAt(B, ref)); },
    ping: ip => {
      if (d.kind==="router") return ping(B, {dev:d}, ip);
      const svi = Object.keys(d.env.intfs).find(n=>n.startsWith("Vlan") && d.env.intfs[n].ip && !d.env.intfs[n].shut);
      if (!svi) return {ok:false};
      return ping(B, sviNode(d, svi), ip);
    },
    mac: () => Object.entries(B.mac[d.id]||{}).filter(([,e])=>linkUpAt(B, d.id+":"+e.port)).map(([mac,e])=>({vlan:e.vlan, mac, type:"DYNAMIC", port: shortIf(d.ports.find(p=>p.id===e.port).ios)})).sort((a,b)=>a.vlan-b.vlan||a.port.localeCompare(b.port)),
    clearMac: () => { B.mac[d.id] = {}; },
    arp: () => Object.entries(B.arp[d.id]||{}).map(([ip,e])=>({ip, mac:e.mac, intf:e.intf, age:"0"})),
    cdp: () => {
      const out = [];
      for (const p of d.ports){ if (!p.ios) continue; const c = cableAt(B, d.id+":"+p.id); if (!c || !linkState(B,c).up) continue;
        const far = P(B, otherEnd(c, d.id+":"+p.id)); if (!far.dev.env || !far.dev.env.cdpRun) continue; const fi = far.dev.env.intfs[far.port.ios]; if (fi && fi.cdp===false) continue;
        const mg = Object.values(far.dev.env.intfs).find(i=>i.ip && !i.shut);
        out.push({ id: far.dev.env.host + (far.dev.env.domain ? "."+far.dev.env.domain : ""), local:p.ios, remote:far.port.ios, platform: far.dev.platform || (far.dev.kind==="router"?"C1111-4P":"C9200L"), cap: far.dev.kind==="router" ? "R I" : "S I", ip: mg && mg.ip });
      }
      return out;
    },
    sessions: () => Object.entries(B.remote).filter(([,r])=>r.env===d.env && !r.pendingAuth).map(([pc,r])=>({user:r.user||"", from:r.from, proto:r.proto, me:false})),
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
function pcPrompt(B, d){ const r = B.remote[d.id]; if (r){ if (r.env.pending) return ""; return r.env.prompt(); } return `C:\\Users\\${d.label}>`; }
function pcExec(B, d, line){
  const r = B.remote[d.id];
  if (r){
    const out = r.env.exec(line);
    if (out && out.logout){ delete B.remote[d.id]; return `\n[Connection to ${r.host} closed by foreign host]`; }
    if (out && out.reload){ delete B.remote[d.id]; return (out.text||"") + `\n[Connection to ${r.host} closed by foreign host]`; }
    return out;
  }
  const raw = line.trim(), l = raw.toLowerCase(), t = raw.split(/\s+/);
  const media = linkUpAt(B, hostNode(d).ref);
  if (!raw) return "";
  if (l==="help" || l==="?") return "Commands: ipconfig · ipconfig /all · ping <ip> · arp -a · arp -d · ssh -l <user> <ip> · telnet <ip> · cls";
  if (l==="cls") return {clear:true};
  if (l==="ipconfig" || l==="ipconfig /all"){
    const all = l.endsWith("/all");
    let o = `\nWindows IP Configuration\n\nEthernet adapter Ethernet:\n\n`;
    if (!media) return o + `   Media State . . . . . . . . . . . : Media disconnected\n   Connection-specific DNS Suffix  . :`+(all?`\n   Physical Address. . . . . . . . . : ${winMac(d.mac)}`:"");
    if (all) o += `   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-LM\n   Physical Address. . . . . . . . . : ${winMac(d.mac)}\n   DHCP Enabled. . . . . . . . . . . : No\n`;
    if (!d.ip) return o + `   Autoconfiguration IPv4 Address. . : 169.254.${(d.id.length*37)%250+1}.${(d.id.length*91)%250+2}\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n   Default Gateway . . . . . . . . . :`;
    return o + `   IPv4 Address. . . . . . . . . . . : ${d.ip}\n   Subnet Mask . . . . . . . . . . . : ${d.mask}\n   Default Gateway . . . . . . . . . : ${d.gw||""}`;
  }
  if (/^arp\s+-a$/.test(l) || l==="arp -g"){
    if (!d.ip || !media) return "No ARP Entries Found.";
    const rows = Object.entries(B.arp[d.id]||{}).map(([ip,e])=>`  ${ip.padEnd(22)}${winMac(e.mac).toLowerCase().padEnd(22)}dynamic`);
    rows.push(`  ${bcastOf(d.ip,d.mask).padEnd(22)}ff-ff-ff-ff-ff-ff     static`, `  224.0.0.22            01-00-5e-00-00-16     static`);
    return `\nInterface: ${d.ip} --- 0x4\n  Internet Address      Physical Address      Type\n` + rows.join("\n");
  }
  if (/^arp\s+-d/.test(l)){ B.arp[d.id] = {}; return ""; }
  if (t[0].toLowerCase()==="ping"){
    const ip = t[1]; if (!ip || ipToInt(ip)==null) return "Ping request could not find host "+(ip||"")+". Please check the name and try again.";
    let res;
    if (!media || !d.ip) res = {ok:false, kind:"general"}; else res = ping(B, hostNode(d), ip);
    B.pinged[d.id+">"+ip] = res.ok;
    const head = `\nPinging ${ip} with 32 bytes of data:\n`;
    const stat = n => `\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = ${n}, Lost = ${4-n} (${(4-n)*25}% loss),`;
    const ttl = res.ttl || 128;
    if (res.ok) return head + [...Array(4)].map(()=>`Reply from ${ip}: bytes=32 time<1ms TTL=${ttl}`).join("\n") + stat(4);
    if (res.kind==="general" || res.kind==="noroute") return head + [...Array(4)].map(()=>"PING: transmit failed. General failure.").join("\n") + stat(0);
    if (res.kind==="unreach") return head + [...Array(4)].map(()=>`Reply from ${d.ip}: Destination host unreachable.`).join("\n") + `\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`;
    return head + [...Array(4)].map(()=>"Request timed out.").join("\n") + stat(0);
  }
  const ssh = raw.match(/^ssh\s+(?:-l\s+(\S+)\s+(\S+)|(\S+)@(\S+))$/i), tel = raw.match(/^telnet\s+(\S+)$/i);
  if (ssh || tel){
    const user = ssh ? (ssh[1]||ssh[3]) : null, ip = ssh ? (ssh[2]||ssh[4]) : tel[1];
    if (!media || !d.ip) return `Connecting to ${ip}...Could not open connection to the host: Connect failed`;
    const p = ping(B, hostNode(d), ip); B.frames = [];
    const o = ipOwner(B, ip);
    if (!p.ok || !o || !o.dev.env) return ssh ? `ssh: connect to host ${ip} port 22: Connection timed out` : `Connecting To ${ip}...Could not open connection to the host, on port 23: Connect failed`;
    const env = o.dev.env, vty = env.lines.vty;
    if (ssh){
      if (!env.rsa) return `ssh: connect to host ${ip} port 22: Connection refused`;
      if (!/ssh|all/.test(vty.transport)) return `ssh: connect to host ${ip} port 22: Connection refused`;
      if (!vty.loginLocal) return `${user}@${ip}: Permission denied (password).\n(the switch's VTY lines aren't using local usernames — 'login local' is missing)`;
      const rec = env.users[user];
      B.remote[d.id] = {env, host:ip, proto:"ssh", user, from:d.ip, pendingAuth:true};
      env.pending = {prompt:"Password: ", handle: pw => { env.noEcho = false; if (rec && (rec.secret===pw || rec.password===pw)){ env.mode = "user"; if (B.remote[d.id]) B.remote[d.id].pendingAuth = false; return env.banner!=null ? env.banner : ""; } delete B.remote[d.id]; return `${user}@${ip}: Permission denied (password).`; }};
      env.noEcho = true;
      return {ask:`${user}@${ip}'s password: `, text:""};
    }
    if (!/telnet|all/.test(vty.transport)) return `Connecting To ${ip}...Could not open connection to the host, on port 23: Connect failed`;
    if (vty.login && !vty.loginLocal && !vty.password) return `\nPassword required, but none set\n\n[Connection to ${ip} closed by foreign host]`;
    if (!vty.login) { B.remote[d.id] = {env, host:ip, proto:"telnet", from:d.ip}; env.mode="user"; return `Trying ${ip} ... Open\n\n` + (env.banner!=null?env.banner+"\n":""); }
    B.remote[d.id] = {env, host:ip, proto:"telnet", from:d.ip};
    const c = env.connect("vty");
    return {ask: c.ask, text: `Trying ${ip} ... Open\n\n${c.text}`};
  }
  return `'${t[0]}' is not recognized as an internal or external command,\noperable program or batch file.`;
}

function act(B, a){
  const [op, ...x] = a; let r = {ok:true, msg:""};
  B_ctx.B = B;
  if (op==="plug") r = plug(B, x[0], x[1], x[2]);
  else if (op==="unplug"){ const c = cableAt(B, x[0]); if (!c) r = {ok:false, msg:"Nothing plugged in there."}; else { B.cables = B.cables.filter(y=>y!==c); if (CABLES[c.type].kind==="console" && B.console) B.console = null; r = {ok:true, msg:"Cable unplugged."}; } }
  else if (op==="insert"){ const p = P(B, x[0]); if (!p || p.port.type!=="sfp") r = {ok:false, msg:"Transceivers go into an SFP cage."}; else if (p.port.sfp) r = {ok:false, msg:"There's already a module in that cage — remove it first."}; else { p.port.sfp = x[1]; r = {ok:true, msg:`Inserted ${SFPS[x[1]].short} into ${portName(p)}.`}; } }
  else if (op==="remove"){ const p = P(B, x[0]); if (!p || !p.port.sfp) r = {ok:false, msg:"No module there."}; else if (cableAt(B, x[0])) r = {ok:false, msg:"Unplug the fibre before pulling the transceiver."}; else { p.port.sfp = null; r = {ok:true, msg:"Module removed."}; } }
  else if (op==="flip"){ const c = cableAt(B, x[0]); if (!c || CABLES[c.type].kind!=="fibre") r = {ok:false, msg:"Only duplex fibre connectors have a Tx/Rx polarity to flip."}; else { c.swapped = !c.swapped; r = {ok:true, msg:"Flipped the LC duplex connector (Tx↔Rx) at this end."}; } }
  else if (op==="ip"){ const d = B.devs[x[0]];
    if (x[1] && ipToInt(x[1])==null) r = {ok:false, msg:"That IP address isn't valid — four numbers 0–255 separated by dots."};
    else if (x[2] && !validMask(x[2])) r = {ok:false, msg:"That subnet mask isn't valid (e.g. 255.255.255.0)."};
    else if (x[3] && ipToInt(x[3])==null) r = {ok:false, msg:"The default gateway isn't a valid IP address."};
    else { d.ip = x[1]||null; d.mask = x[2]||null; d.gw = x[3]||null; B.arp[d.id] = {}; r = {ok:true, msg:`${d.label}: IP settings saved.`}; } }
  else if (op==="pc"){ B.frames = []; r = {ok:true, out: pcExec(B, B.devs[x[0]], x[1])}; }
  else if (op==="power"){ const d = B.devs[x[0]]; d.on = x[1]!==false; if (!d.on && B.mac[d.id]) B.mac[d.id] = {}; r = {ok:true, msg:`${d.label} powered ${d.on?"on":"off"}.`}; }
  else if (op==="console"){ r = openConsole(B, x[0], x[1]||{}); }
  else if (op==="term"){ B.frames = []; r = {ok:true, out: termExec(B, x[0])}; }
  else r = {ok:false, msg:"Unknown action "+op};
  B.events.push({a, ok:r.ok});
  return r;
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
  if (d.kind==="switch" || d.kind==="router" || d.kind==="hub"){
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
  if (d.kind==="switch" || d.kind==="router" || d.kind==="hub"){
    const name = d.env ? d.env.host : d.label;
    g += `<rect x="${x0}" y="${y0}" width="${L.w}" height="${L.h}" rx="6" fill="var(--panel2)" stroke="${stroke}" stroke-width="1.4"/>`;
    g += `<text x="${x0+10}" y="${y0+18}" fill="var(--fg)" font-size="12" font-weight="700" font-family="var(--display)">${esc(name)}</text>`;
    g += `<text x="${x0+10}" y="${y0+30}" fill="var(--muted)" font-size="9" font-family="var(--mono)">${esc(d.model||(d.kind==="switch"?"Catalyst switch":d.kind==="hub"?"Ethernet hub (repeater)":"ISR router"))}</text>`;
    g += `<circle cx="${x0+16}" cy="${y0+52}" r="4" fill="${d.on?"var(--ok)":"var(--bad)"}"/><text x="${x0+10}" y="${y0+68}" fill="var(--muted)" font-size="8" font-family="var(--mono)">PWR</text>`;
  } else {
    const cx = x0+L.w/2;
    g += `<rect x="${x0}" y="${y0}" width="${L.w}" height="${L.h}" rx="8" fill="var(--panel2)" stroke="${stroke}" stroke-width="1.2"/>`;
    if (d.kind==="laptop") g += `<rect x="${cx-17}" y="${y0+10}" width="34" height="22" rx="2" fill="var(--chip)" stroke="var(--accent)"/><path d="M${cx-23},${y0+33} h46 l-4,6 h-38 z" fill="var(--chip)" stroke="var(--accent)"/>`;
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
      if (c){ const s = linkState(B,c); led = !s.up ? "var(--warn)" : s.mismatch ? "var(--bad)" : "var(--ok)"; }
      g += `<circle cx="${px+q.w/2}" cy="${py-6}" r="3" fill="${led==="none"?"var(--chip)":led}" stroke="var(--line)" stroke-width=".6"/>`;
    }
    g += `<text x="${px+q.w/2}" y="${py+q.h+10}" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="var(--mono)">${esc(p.label)}</text></g>`;
  }
  return g;
}
function portCenter(B, ref){ const x = P(B, ref), L = layout(x.dev), q = L.ports[x.port.id]; return [x.dev.x+q.x+q.w/2, x.dev.y+q.y+q.h/2]; }
function cablePath(B, a, b){ const [x1,y1] = portCenter(B,a), [x2,y2] = portCenter(B,b); const sag = Math.max(40, Math.abs(x2-x1)*0.25); return `M${x1},${y1} C${x1},${y1+sag} ${x2},${y2+sag} ${x2},${y2}`; }
function drawCables(B){
  return B.cables.map(c=>{
    const s = linkState(B,c), col = CABLES[c.type].color;
    return `<path d="${cablePath(B,c.a,c.b)}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round" opacity="${s.up?1:.75}" ${CABLES[c.type].kind==="console"?'stroke-dasharray="7 4"':""}/>`;
  }).join("");
}
// animated frames: one dot per hop, staggered by step; broadcasts amber, unicasts accent
function drawFrames(B){
  if (!B.frames || !B.frames.length) return "";
  const per = 0.42;
  return B.frames.slice(0,160).map(h=>{
    const d = cablePath(B, h.a, h.b), col = h.kind==="bcast" ? "#f59e0b" : "var(--accent)";
    const begin = (h.step*per).toFixed(2);
    return `<g><circle r="5.5" fill="${col}" stroke="var(--bg)" stroke-width="1.5" opacity="0"><animateMotion dur="${per}s" begin="${begin}s" fill="freeze" path="${d}"/><set attributeName="opacity" to="1" begin="${begin}s"/><set attributeName="opacity" to="0" begin="${(h.step*per+per+0.15).toFixed(2)}s"/></circle></g>`;
  }).join("");
}

function mount(el, cfg, tasks, onWin){
  let B = create(cfg);
  let zoom = 1, sel = null, hand = null, tool = null, msg = cfg.start || "Pick a cable or a module from the tray, then tap the two ports you want to connect.", msgKind = "", showFrames = true, animKey = 0;
  const cons = { speed:"115200", data:"8", parity:"None", stop:"1", flow:"XON/XOFF" };
  const pcLines = {};
  const hintsShown = {};
  let won = false;
  const say = (m, kind) => { msg = m; msgKind = kind||""; };
  function draw(){
    const vb = cfg.viewBox || "0 0 900 360";
    const doneN = tasks.filter(t=>{ try{ return t.done(B); }catch(e){ return false; } }).length;
    if (!won && tasks.length && doneN===tasks.length){ won = true; if (onWin) onWin(); }
    const selX = sel && P(B, sel), selC = sel && cableAt(B, sel);
    const frames = showFrames ? drawFrames(B) : "";
    el.innerHTML = `
      ${tasks.length?(()=>{ const nx = tasks.find(t=>{ try{ return !t.done(B); }catch(e){ return true; } }); return `<div class="bn-prog"><span class="tag ${doneN===tasks.length?"ok":"acc"}">${doneN}/${tasks.length} ${cfg.challenge?"fixed":"tasks"}</span>${cfg.challenge?` <span class="qt-lvl l3">Challenge</span>`:""} ${nx?(cfg.challenge?`<span class="small">Find and fix every fault. Users' complaints are in the list below — the bench won't tell you what's wrong.</span>`:`<span class="small"><b>Next:</b> ${nx.text}</span>`):`<span class="small"><b>Lab complete.</b> ${cfg.win||"Everything is cabled, configured and verified."}</span>`}</div>`; })():""}
      <div class="bn-tray"><span class="small muted">Tray:</span>
        ${(cfg.tray||["cat6","console"]).map(k=>CABLES[k]?`<button class="bn-item ${hand&&hand.cable===k?"on":""}" data-cable="${k}" title="${esc(CABLES[k].name)}"><i style="background:${CABLES[k].color}"></i>${esc(CABLES[k].short)}</button>`:SFPS[k]?`<button class="bn-item ${hand&&hand.sfp===k?"on":""}" data-sfp="${k}" title="${esc(SFPS[k].name)}"><i class="sfp"></i>${esc(SFPS[k].short)} SFP</button>`:"").join("")}
        ${hand?`<button class="bn-item ghost" data-drop="1">✕ put it back</button>`:""}
        <label class="small muted bn-anim"><input type="checkbox" data-anim ${showFrames?"checked":""}> show frames on the wire</label><span class="bn-zoom"><button class="btn sm ghost" data-zoom="-1" aria-label="zoom out">−</button><button class="btn sm ghost" data-zoom="1" aria-label="zoom in">+</button></span>
      </div>
      <div class="bn-msg ${msgKind}">${hand&&hand.cable&&hand.from?`Holding one end of the ${esc(CABLES[hand.cable].short)} cable in ${esc(portName(P(B,hand.from)))} — tap the port for the other end.`:esc(msg)}</div>
      <div class="bn-scene"><svg viewBox="${vb}" role="img" aria-label="lab bench" data-k="${animKey}" style="min-width:${Math.round(680*zoom)}px">${drawCables(B)}${B.order.map(id=>drawDevice(B, B.devs[id], sel)).join("")}${frames}</svg></div>
      ${B.log && B.log.length ? `<details class="bn-log" ${cfg.openLog?"open":""}><summary>What just happened on the wire (${B.frames.length} frame hops)</summary><div class="bn-loglist">${(()=>{ let n = 0; return B.log.map(l=>{ const sub = l.startsWith("&nbsp;&nbsp;· "); return sub ? `<div class="bn-logsub">${l.replace("&nbsp;&nbsp;· ","")}</div>` : `<div class="bn-logmain"><span class="num">${++n}.</span> ${l}</div>`; }).join(""); })()}</div><button class="btn sm ghost" data-replay>Replay animation</button></details>`:""}
      ${selX?`<div class="bn-sel"><b>${esc(portName(selX))}</b> <span class="small muted">· ${selX.port.type.toUpperCase()} port</span>
          ${selC?`<span class="small"> · ${esc(CABLES[selC.type].short)} cable to ${esc(portName(P(B,otherEnd(selC,sel))))} · ${(()=>{const s=linkState(B,selC); return s.console?"console connection":s.up?`<b style="color:${s.mismatch?"var(--bad)":"var(--ok)"}">link up</b>${s.speed?` · ${s.speed} Mb/s`:""}${s.why?` — ${esc(s.why)}`:""}`:`<b style="color:var(--warn)">link down</b> — ${esc(s.why)}`;})()}</span>`:""}
          <div class="btnrow">${selC?`<button class="btn sm ghost" data-unplug="${sel}">Unplug</button>`:""}${selC&&CABLES[selC.type].kind==="fibre"?`<button class="btn sm ghost" data-flip="${sel}">Flip Tx/Rx at this end</button>`:""}${selX.port.type==="sfp"&&selX.port.sfp&&!selC?`<button class="btn sm ghost" data-remove="${sel}">Remove ${esc(SFPS[selX.port.sfp].short)} module</button>`:""}<button class="btn sm ghost" data-desel="1">Close</button></div></div>`:""}
      <div class="bn-devs">${B.order.map(id=>{ const d = B.devs[id];
        const btns = [];
        if (d.kind==="pc"||d.kind==="server"||d.kind==="laptop"){ btns.push(`<button class="btn sm ghost" data-tool="ip:${id}">IP settings</button>`, `<button class="btn sm ghost" data-tool="cmd:${id}">Command Prompt</button>`); }
        if (d.kind==="laptop") btns.push(`<button class="btn sm ghost" data-tool="putty:${id}">Terminal app (PuTTY)</button>`);
        if (cfg.power) btns.push(`<button class="btn sm ghost" data-power="${id}">${d.on?"Power off":"Power on"}</button>`);
        return btns.length?`<div class="bn-dev"><b>${esc(d.label)}</b> ${btns.join("")}</div>`:""; }).join("")}</div>
      <div class="bn-tool">${toolHtml()}</div>
      ${tasks.length?`<details class="bn-tasks" ${doneN<tasks.length?"open":""}><summary>${cfg.challenge?"Complaints to resolve":"All tasks"} (${doneN}/${tasks.length})</summary><div class="mt-tasks">${tasks.map((t,ti)=>{ let ok=false; try{ ok=t.done(B); }catch(e){} return `<div class="mt-task ${ok?"ok":""}"><span class="check ${ok?"done":""}">✓</span><span>${t.text}${cfg.challenge&&t.hint&&!ok?` <button class="btn sm ghost bn-hint" data-hint="${ti}">${hintsShown[ti]?"Hide hint":"Hint"}</button>${hintsShown[ti]?`<div class="small bn-hinttext">💡 ${t.hint}</div>`:""}`:""}</span></div>`; }).join("")}</div></details>`:""}`;
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
    if (kind==="ip") return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · Internet Protocol Version 4 (TCP/IPv4) Properties</div>
      <div class="bn-form"><label>IP address<input class="txt" id="bn-ip" value="${esc(d.ip||"")}" placeholder="e.g. 192.168.10.11"></label>
      <label>Subnet mask<input class="txt" id="bn-mask" value="${esc(d.mask||"")}" placeholder="e.g. 255.255.255.0"></label>
      <label>Default gateway<input class="txt" id="bn-gw" value="${esc(d.gw||"")}" placeholder="e.g. 192.168.10.1"></label></div>
      <div class="btnrow"><button class="btn sm" id="bn-ipsave">OK</button><button class="btn sm ghost" data-tool="">Cancel</button></div></div>`;
    if (kind==="cmd"){ const L = pcLines[id] = pcLines[id] || [{t:"Microsoft Windows [Version 10.0.22631]\n(c) Microsoft Corporation. All rights reserved.", cls:""}];
      return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · ${B.remote[id]?`remote session to ${esc(B.remote[id].host)}`:"Command Prompt"}</div>${termBox(L, "bn-cmd", "bn-run", pcPrompt(B,d)||"(answer the prompt)", `<button class="btn sm ghost" data-tool="">Close</button>`)}</div>`; }
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
  function after(r){ if (r && r.msg) say(r.msg, r.ok?"":"bad"); animKey++; draw(); }
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
    const ips = el.querySelector("#bn-ipsave");
    if (ips) ips.onclick = () => { const id = tool.split(":")[1]; const r = act(B, ["ip", id, el.querySelector("#bn-ip").value.trim(), el.querySelector("#bn-mask").value.trim(), el.querySelector("#bn-gw").value.trim()]); if (r.ok) tool=null; after(r); };
    if (el.querySelector("#bn-cmd")){ const id = tool.split(":")[1], d = B.devs[id];
      wireTerm("#bn-cmd", "#bn-run", v => {
        const rem = B.remote[id], env = rem && rem.env;
        if (!v.trim() && !(env && env.pending)) { if (rem) pcLines[id].push({t:pcPrompt(B,d), cls:"in"}); draw(); return focusSel("#bn-cmd"); }
        const L = pcLines[id];
        K.termEcho(L, env, v, pcPrompt(B,d));
        const o = act(B,["pc",id,v]).out;
        K.termOut(L, o);
        if (L.length>300) pcLines[id] = L.slice(-300);
        animKey++; draw(); focusSel("#bn-cmd");
      }, B.remote[id] && B.remote[id].env); }
    const op = el.querySelector("#bn-open");
    if (op) op.onclick = () => { Object.assign(cons, { speed:el.querySelector("#bn-sp").value, data:el.querySelector("#bn-db").value, parity:el.querySelector("#bn-pa").value, stop:el.querySelector("#bn-sb").value, flow:el.querySelector("#bn-fc").value });
      const r = act(B, ["console", tool.split(":")[1], cons]); after(r); focusSel("#bn-tin"); };
    if (el.querySelector("#bn-tin")){ const s = B.console, t = B.devs[s.target];
      wireTerm("#bn-tin", "#bn-trun", v => {
        if (s.good && t.on) K.termEcho(s.lines, t.env, v, t.env.prompt()); else s.lines.push({t:v, cls:"in"});
        const o = act(B,["term",v]).out;
        K.termOut(s.lines, o);
        if (s.lines.length>300) s.lines = s.lines.slice(-300);
        animKey++; draw(); focusSel("#bn-tin");
      }, s.good ? t.env : null);
      el.querySelector("#bn-tclose").onclick = () => { B.console = null; draw(); }; }
  }
  el.reset = () => { B = create(cfg); sel=null; hand=null; tool=null; won=false; for (const k in pcLines) delete pcLines[k]; say("Bench reset — everything is back as it started."); draw(); };
  draw();
  return { get bench(){ return B; } };
}

window.Bench = { create, act, mount, linkState, linkUpAt, cableAt, CABLES, SFPS,
  linked: (B, a, b) => B.cables.some(c=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a)),
  up: (B, a, b) => B.cables.some(c=>((c.a===a&&c.b===b)||(c.a===b&&c.b===a)) && linkState(B,c).up),
  upAt: (B, ref) => linkUpAt(B, ref),
  cableType: (B, ref) => { const c = cableAt(B, ref); return c ? c.type : null; },
  consoleOk: (B, dev) => !!(B.console && B.console.good && (!dev || B.console.target===dev)),
  pinged: (B, from, ip) => B.pinged[from+">"+ip]===true,
  macKnown: (B, sw, mac) => !!(B.mac[sw] && B.mac[sw][mac]),
  macCount: (B, sw) => Object.keys(B.mac[sw]||{}).length,
  arpHas: (B, dev, ip) => !!(B.arp[dev] && B.arp[dev][ip]),
  remoteTo: (B, pc) => B.remote[pc] && !B.remote[pc].pendingAuth ? B.remote[pc].host : null,
  session: (B, pc) => { const r = B.remote[pc]; return r && !r.pendingAuth ? {host:r.host, proto:r.proto, user:r.user||null} : null; },
  tried: (B, pc, re) => B.events.some(e=>e.a[0]==="pc" && e.a[1]===pc && re.test(e.a[2]||"")),
  proxied: B => (B.proxied||0) > 0,
  mismatch: (B, a, b) => B.cables.some(c=>((c.a===a&&c.b===b)||(c.a===b&&c.b===a)) && linkState(B,c).mismatch),
};
})();
