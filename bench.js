// Ladder Lab — interactive lab bench. Real-looking devices with ports you cable together, SFP optics you insert,
// link lights that follow the physics and the config, PCs you address and ping from, and a console cable + terminal
// app that drops you into the device's Cisco IOS CLI.
// Model (Bench.create / act) is DOM-free so tools/validate.js can replay solutions; Bench.mount draws the UI.
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
  "sfp-sx": { name:"1000BASE-SX SFP — multimode, 850 nm, short reach", short:"SX (MM)", mode:"mm" },
  "sfp-lx": { name:"1000BASE-LX SFP — single-mode, 1310 nm, up to ~10 km", short:"LX (SM)", mode:"sm" },
};
const PORTW = { rj45:[22,17], console:[22,17], sfp:[30,14], usb:[18,9] };

/* ---------------- model ---------------- */
function ipToInt(ip){ const p = String(ip||"").trim().split("."); if (p.length!==4 || p.some(x=>!/^\d{1,3}$/.test(x)||+x>255)) return null; return ((+p[0]<<24)>>>0)+(+p[1]<<16)+(+p[2]<<8)+(+p[3]); }
function sameNet(a,b,mask){ const A=ipToInt(a),B=ipToInt(b),M=ipToInt(mask); if (A==null||B==null||M==null) return false; return ((A&M)>>>0)===((B&M)>>>0); }
function validMask(m){ const M = ipToInt(m); if (M==null) return false; const inv = (~M)>>>0; return ((inv+1)&inv)===0 && M!==0; }

function create(cfg){
  const B = { cfg, devs:{}, order:[], cables:[], pinged:{}, console:null, events:[], hand:null, msg:"" };
  for (const d0 of cfg.devices){
    const d = clone(Object.assign({}, d0, {setup:undefined}));
    d.on = d0.on!==false;
    d.mdix = d0.mdix!==false;
    d.ports = (d0.ports || defaultPorts(d0.kind)).map(p=>Object.assign({sfp:null}, p));
    if (d0.sfp) for (const [pid,mod] of Object.entries(d0.sfp)){ const p = d.ports.find(x=>x.id===pid); if (p) p.sfp = mod; }   // pre-fitted optics, e.g. {g9:"sfp-sx"}
    if (d.kind==="switch" || d.kind==="router"){
      const intfs = {};
      d.ports.filter(p=>p.ios).forEach(p=>{ intfs[p.ios] = { ip:null, mask:null, shut: d.kind==="router", vlan:1, mode:"access", allowed:null }; });
      Object.assign(intfs, clone(d0.intfs||{}));
      d.env = SIM.iosEnv({ host:d0.host || d0.label, kind:d.kind, intfs, motd:"" });
      wrapIos(B, d);
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
  if (kind==="laptop") return [{id:"eth", type:"rj45", label:"ETH"},{id:"usb", type:"usb", label:"USB"}];
  return [{id:"eth", type:"rj45", label:"NIC"}];
}
const P = (B, ref) => { const [d,p] = String(ref).split(":"); const dev = B.devs[d]; const port = dev && dev.ports.find(x=>x.id===p); return port ? {dev, port, ref:d+":"+p} : null; };
const cableAt = (B, ref) => B.cables.find(c=>c.a===ref || c.b===ref);
const otherEnd = (c, ref) => c.a===ref ? c.b : c.a;
function portName(x){ return `${x.dev.label} ${x.port.ios ? x.port.ios.replace("GigabitEthernet","Gi") : x.port.label}`; }

function endFits(type, x){
  const k = CABLES[type].kind, pt = x.port.type;
  if (k==="copper") return pt==="rj45" ? null : pt==="sfp" ? "That's an RJ45 copper plug — it doesn't fit an SFP cage. Use a fibre cable with an SFP module (or a copper port)." : `An RJ45 patch cable doesn't go into the ${pt.toUpperCase()} port.`;
  if (k==="console") return (pt==="usb"||pt==="console") ? null : "The console cable goes from a laptop's USB port to the device's CONSOLE port — not a network port.";
  if (k==="fibre"){ if (pt!=="sfp") return "Fibre LC connectors only fit an SFP module, not an RJ45 port."; if (!x.port.sfp) return "The SFP cage is empty — insert a transceiver (SFP module) first, then plug the fibre into it."; return null; }
  return "That doesn't fit.";
}
function plug(B, type, a, b, silent){
  if (!CABLES[type]) return {ok:false, msg:"Unknown cable."};
  const A = P(B,a), Bp = P(B,b);
  if (!A || !Bp) return {ok:false, msg:"Pick two ports."};
  if (A.ref===Bp.ref) return {ok:false, msg:"Both ends in the same port? Pick a port on another device."};
  if (A.dev===Bp.dev) return {ok:false, msg:"Plugging a device into itself creates a loop — connect it to another device."};
  for (const x of [A,Bp]){ if (cableAt(B,x.ref)) return {ok:false, msg:`${portName(x)} already has a cable in it — unplug it first.`}; const why = endFits(type,x); if (why) return {ok:false, msg:why}; }
  if (CABLES[type].kind==="console"){ const types = [A.port.type, Bp.port.type].sort().join(); if (types!=="console,usb") return {ok:false, msg:"One end of a console cable goes in the laptop's USB port, the other in the device's CONSOLE port."}; }
  const cable = { type, a:A.ref, b:Bp.ref, swapped:false };
  B.cables.push(cable);
  if (!silent) iosLinkEvents(B, cable, true);
  return {ok:true, cable, msg:`Connected ${portName(A)} ↔ ${portName(Bp)} with a ${CABLES[type].short} cable.`};
}
function adminUp(x){ if (!x.dev.env || !x.port.ios) return true; const i = x.dev.env.intfs[x.port.ios]; return !(i && i.shut); }
function linkState(B, c){
  const A = P(B,c.a), Bp = P(B,c.b), k = CABLES[c.type].kind;
  if (k==="console") return {up:true, console:true};
  if (!A.dev.on || !Bp.dev.on) return {up:false, why:`${!A.dev.on?A.dev.label:Bp.dev.label} is powered off.`};
  if (k==="copper" && !A.dev.mdix && !Bp.dev.mdix){
    const mdiX = d => d.kind==="switch";
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
  return {up:true};
}
function linkUpAt(B, ref){ const c = cableAt(B,ref); return !!(c && CABLES[c.type].kind!=="console" && linkState(B,c).up); }

// layer-2 flood from a port: returns endpoints reached [{dev, port, ref}] (hosts and router interfaces)
function l2From(B, startRef){
  const seen = new Set(), out = [];
  const visit = (ref, vlan) => {
    const key = ref+"|"+vlan; if (seen.has(key)) return; seen.add(key);
    const c = cableAt(B, ref); if (!c || CABLES[c.type].kind==="console" || !linkState(B,c).up) return;
    const far = P(B, otherEnd(c, ref));
    if (far.dev.kind==="switch"){
      const fi = far.dev.env.intfs[far.port.ios] || {};
      const v = fi.mode==="trunk" ? vlan : (fi.vlan||1);
      if (fi.mode!=="trunk" && vlan!==null && vlan!==(fi.vlan||1)) return;
      for (const p of far.dev.ports){
        if (!p.ios || p.id===far.port.id) continue;
        const pi = far.dev.env.intfs[p.ios] || {};
        if (pi.mode==="trunk" || (pi.vlan||1)===v) visit(far.dev.id+":"+p.id, v);
      }
    } else if (!out.some(e=>e.ref===far.ref)) out.push(far);
  };
  visit(startRef, null);
  return out;
}
function epIp(e){ if (e.dev.env){ const i = e.dev.env.intfs[e.port.ios]; return i && !i.shut ? {ip:i.ip, mask:i.mask} : {}; } return {ip:e.dev.ip, mask:e.dev.mask, gw:e.dev.gw}; }
function nicRef(d){ const p = d.ports.find(p=>p.type==="rj45"); return d.id+":"+p.id; }

// can traffic from (srcDev, srcRef, srcIp, mask, gw) reach ip? returns {ok, kind:'reply'|'timeout'|'unreach'|'general', ttl}
function reach(B, src, ip){
  if (src.ip===ip) return {ok:true, ttl:128};
  const dom = l2From(B, src.ref);
  const findIn = (list, ip2) => list.find(e=>epIp(e).ip===ip2);
  const replyBack = (e, fromIp) => { if (e.dev.env) return true; const t = epIp(e); return sameNet(t.ip, fromIp, t.mask) || !!t.gw; };
  if (sameNet(src.ip, ip, src.mask)){
    const e = findIn(dom, ip); if (!e) return {ok:false, kind:"unreach"};
    return {ok:true, ttl: e.dev.env ? 255 : 128};
  }
  if (!src.gw) return {ok:false, kind:"general"};
  const gwEp = findIn(dom, src.gw);
  if (!gwEp || !gwEp.dev.env || !sameNet(src.gw, src.ip, src.mask)) return {ok:false, kind:"timeout"};
  const R = gwEp.dev;
  for (const p of R.ports){ const i = p.ios && R.env.intfs[p.ios]; if (i && i.ip===ip && !i.shut) return {ok:true, ttl:255}; }
  for (const p of R.ports){
    const i = p.ios && R.env.intfs[p.ios]; if (!i || i.shut || !i.ip || !sameNet(i.ip, ip, i.mask)) continue;
    const ref = R.id+":"+p.id; if (!linkUpAt(B, ref)) return {ok:false, kind:"timeout"};
    const e = findIn(l2From(B, ref), ip); if (!e) return {ok:false, kind:"timeout"};
    const t = epIp(e); if (!e.dev.env && t.gw!==i.ip) return {ok:false, kind:"timeout", why:"the far host has no route back (check its default gateway)"};
    return {ok:true, ttl:127};
  }
  return {ok:false, kind:"timeout"};
}

function pcExec(B, d, line){
  const raw = line.trim(), l = raw.toLowerCase(), t = raw.split(/\s+/);
  const ref = nicRef(d), media = linkUpAt(B, ref);
  if (!raw) return "";
  if (l==="help" || l==="?") return "Commands: ipconfig · ipconfig /all · ping <ip address> · cls";
  if (l==="cls") return {clear:true};
  if (l==="ipconfig" || l==="ipconfig /all"){
    const all = l.endsWith("/all");
    let o = `\nEthernet adapter Ethernet:\n\n`;
    if (!media) return o + `   Media State . . . . . . . . . . . : Media disconnected\n   Connection-specific DNS Suffix  . :`+(all?`\n   Physical Address. . . . . . . . . : ${d.mac||"00-1A-2B-3C-4D-5E"}`:"");
    if (all) o += `   Physical Address. . . . . . . . . : ${d.mac||"00-1A-2B-3C-4D-5E"}\n   DHCP Enabled. . . . . . . . . . . : No\n`;
    if (!d.ip) return o + `   Autoconfiguration IPv4 Address. . : 169.254.${(d.id.length*37)%250+1}.${(d.id.length*91)%250+2}\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n   Default Gateway . . . . . . . . . :`;
    return o + `   IPv4 Address. . . . . . . . . . . : ${d.ip}\n   Subnet Mask . . . . . . . . . . . : ${d.mask}\n   Default Gateway . . . . . . . . . : ${d.gw||""}`;
  }
  if (t[0].toLowerCase()==="ping"){
    const ip = t[1]; if (!ip || ipToInt(ip)==null) return "Ping request could not find host "+(ip||"")+". Please check the name and try again.";
    let r;
    if (!media || !d.ip) r = {ok:false, kind:"general"};
    else r = reach(B, {ref, ip:d.ip, mask:d.mask, gw:d.gw}, ip);
    B.pinged[d.id+">"+ip] = r.ok;
    const head = `\nPinging ${ip} with 32 bytes of data:\n`;
    const stat = n => `\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = ${n}, Lost = ${4-n} (${(4-n)*25}% loss),`;
    if (r.ok) return head + [...Array(4)].map(()=>`Reply from ${ip}: bytes=32 time<1ms TTL=${r.ttl}`).join("\n") + stat(4);
    if (r.kind==="general") return head + [...Array(4)].map(()=>"PING: transmit failed. General failure.").join("\n") + stat(0);
    if (r.kind==="unreach") return head + [...Array(4)].map(()=>`Reply from ${d.ip}: Destination host unreachable.`).join("\n") + `\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`;
    return head + [...Array(4)].map(()=>"Request timed out.").join("\n") + stat(0);
  }
  return `'${t[0]}' is not recognized as an internal or external command,\noperable program or batch file.`;
}

// make the IOS simulator aware of the bench: real link status, pings that follow the cabling
function wrapIos(B, d){
  const env = d.env, base = env.exec;
  env.reachable = ip => {
    for (const p of d.ports){ const i = p.ios && env.intfs[p.ios]; if (i && i.ip===ip && !i.shut) return true; }
    for (const p of d.ports){
      const i = p.ios && env.intfs[p.ios]; if (!i || i.shut || !i.ip || !sameNet(i.ip, ip, i.mask)) continue;
      const ref = d.id+":"+p.id; if (!linkUpAt(B, ref)) return false;
      return !!l2From(B, ref).find(e=>epIp(e).ip===ip);
    }
    return false;
  };
  env.exec = line => {
    const before = {}; for (const [n,i] of Object.entries(env.intfs)) before[n] = i.shut;
    const isBrief = /^\s*(do\s+)?sh(o(w)?)?\s+ip\s+int(e(r(f(a(c(e)?)?)?)?)?)?\s+br/i.test(line) && (env.mode!=="user");
    let out = base(line);
    if (isBrief && typeof out==="string" && out.startsWith("Interface")){
      let o = "Interface              IP-Address      OK? Method Status                Protocol\n";
      for (const p of d.ports.filter(p=>p.ios)){
        const i = env.intfs[p.ios] || {}; const up = linkUpAt(B, d.id+":"+p.id);
        const st = i.shut ? "administratively down" : up ? "up" : "down";
        o += p.ios.padEnd(23) + String(i.ip||"unassigned").padEnd(16) + (i.ip?"YES manual ":"YES unset  ") + st.padEnd(22) + (up && !i.shut ? "up" : "down") + "\n";
      }
      out = o.trimEnd();
    }
    // interface state changes: only claim "up" when there's really a working link
    for (const [n,i] of Object.entries(env.intfs)){
      if (before[n]===true && i.shut===false){
        const p = d.ports.find(p=>p.ios===n), up = p && linkUpAt(B, d.id+":"+p.id);
        out = up ? `%LINK-3-UPDOWN: Interface ${n}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to up` : "";
      }
    }
    return out;
  };
}
function iosLinkEvents(){ /* reserved: log messages on plug/unplug could go here */ }

function act(B, a){
  const [op, ...x] = a; let r = {ok:true, msg:""};
  if (op==="plug") r = plug(B, x[0], x[1], x[2]);
  else if (op==="unplug"){ const c = cableAt(B, x[0]); if (!c) r = {ok:false, msg:"Nothing plugged in there."}; else { B.cables = B.cables.filter(y=>y!==c); if (CABLES[c.type].kind==="console" && B.console) B.console = null; r = {ok:true, msg:"Cable unplugged."}; } }
  else if (op==="insert"){ const p = P(B, x[0]); if (!p || p.port.type!=="sfp") r = {ok:false, msg:"Transceivers go into an SFP cage."}; else if (p.port.sfp) r = {ok:false, msg:"There's already a module in that cage — remove it first."}; else { p.port.sfp = x[1]; r = {ok:true, msg:`Inserted ${SFPS[x[1]].short} into ${portName(p)}.`}; } }
  else if (op==="remove"){ const p = P(B, x[0]); if (!p || !p.port.sfp) r = {ok:false, msg:"No module there."}; else if (cableAt(B, x[0])) r = {ok:false, msg:"Unplug the fibre before pulling the transceiver."}; else { p.port.sfp = null; r = {ok:true, msg:"Module removed."}; } }
  else if (op==="flip"){ const c = cableAt(B, x[0]); if (!c || CABLES[c.type].kind!=="fibre") r = {ok:false, msg:"Only duplex fibre connectors have a Tx/Rx polarity to flip."}; else { c.swapped = !c.swapped; r = {ok:true, msg:"Flipped the LC duplex connector (Tx↔Rx) at this end."}; } }
  else if (op==="ip"){ const d = B.devs[x[0]];
    if (x[1] && ipToInt(x[1])==null) r = {ok:false, msg:"That IP address isn't valid — four numbers 0–255 separated by dots."};
    else if (x[2] && !validMask(x[2])) r = {ok:false, msg:"That subnet mask isn't valid (e.g. 255.255.255.0)."};
    else if (x[3] && ipToInt(x[3])==null) r = {ok:false, msg:"The default gateway isn't a valid IP address."};
    else { d.ip = x[1]||null; d.mask = x[2]||null; d.gw = x[3]||null; r = {ok:true, msg:`${d.label}: IP settings saved.`}; } }
  else if (op==="pc"){ r = {ok:true, out: pcExec(B, B.devs[x[0]], x[1])}; }
  else if (op==="power"){ const d = B.devs[x[0]]; d.on = x[1]!==false; r = {ok:true, msg:`${d.label} powered ${d.on?"on":"off"}.`}; }
  else if (op==="console"){ r = openConsole(B, x[0], x[1]||{}); }
  else if (op==="term"){ r = {ok:true, out: termExec(B, x[0])}; }
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
  else B.console.lines.push({t:`\n${far.dev.env.prompt().trim()}`, cls:""});
  return {ok:true, good, msg: good ? `Connected to ${far.dev.label} — press Enter or type a command.` : "Connected, but the text is garbled — the serial settings don't match the device."};
}
function garble(n){ const ch = "ÿ�x€þ¤ßæø§¿Ã±"; let s = ""; for (let i=0;i<n;i++) s += ch[(i*7+3)%ch.length]; return s; }
function termExec(B, line){
  const s = B.console; if (!s) return "(no terminal session open)";
  const d = B.devs[s.target];
  if (!d.on) return "";
  if (!s.good) return garble(Math.max(6, line.length*2));
  return d.env.exec(line);
}

/* ---------------- view ---------------- */
function layout(d){
  // returns {w,h, ports:{id:{x,y,w,h}}} relative to the device's top-left
  const ports = {}, pts = d.ports;
  if (d.kind==="switch" || d.kind==="router"){
    let x = 52;
    const h = 78;
    pts.forEach(p=>{ const [w,hh] = PORTW[p.type]; if (p.type==="console"){ x += 14; } ports[p.id] = {x, y:44, w, h:hh}; x += w + (p.type==="sfp"?10:7); });
    return {w:Math.max(x+14, 200), h, ports};
  }
  // hosts: icon on top, ports along the bottom
  const w = 108, h = 96; let x = 16;
  pts.forEach(p=>{ const [pw,ph] = PORTW[p.type]; ports[p.id] = {x, y:h-26, w:pw, h:ph}; x += pw + 16; });
  return {w, h, ports};
}
function drawDevice(B, d, sel){
  const L = layout(d), x0 = d.x, y0 = d.y;
  let g = "";
  const stroke = d.on ? "var(--line)" : "var(--bad)";
  if (d.kind==="switch" || d.kind==="router"){
    g += `<rect x="${x0}" y="${y0}" width="${L.w}" height="${L.h}" rx="6" fill="var(--panel2)" stroke="${stroke}" stroke-width="1.4"/>`;
    g += `<text x="${x0+10}" y="${y0+18}" fill="var(--fg)" font-size="12" font-weight="700" font-family="var(--display)">${esc(d.label)}</text>`;
    g += `<text x="${x0+10}" y="${y0+30}" fill="var(--muted)" font-size="9" font-family="var(--mono)">${esc(d.model||(d.kind==="switch"?"Catalyst switch":"ISR router"))}</text>`;
    g += `<circle cx="${x0+16}" cy="${y0+52}" r="4" fill="${d.on?"var(--ok)":"var(--bad)"}"/><text x="${x0+10}" y="${y0+68}" fill="var(--muted)" font-size="8" font-family="var(--mono)">PWR</text>`;
  } else {
    const cx = x0+L.w/2;
    g += `<rect x="${x0}" y="${y0}" width="${L.w}" height="${L.h}" rx="8" fill="var(--panel2)" stroke="${stroke}" stroke-width="1.2"/>`;
    if (d.kind==="laptop") g += `<rect x="${cx-17}" y="${y0+10}" width="34" height="22" rx="2" fill="var(--chip)" stroke="var(--accent)"/><path d="M${cx-23},${y0+33} h46 l-4,6 h-38 z" fill="var(--chip)" stroke="var(--accent)"/>`;
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
    g += `<g class="bp" data-port="${ref}" style="cursor:pointer"><rect x="${px-3}" y="${py-12}" width="${q.w+6}" height="${q.h+26}" fill="transparent"/>`;
    g += `<rect x="${px}" y="${py}" width="${q.w}" height="${q.h}" rx="${p.type==="usb"?1:2}" fill="${fill}" stroke="${st}" stroke-width="${isSel?2.4:1.2}"/>`;
    if (p.type==="rj45") g += `<rect x="${px+q.w/2-4}" y="${py+q.h-4}" width="8" height="4" fill="${st}"/>`;
    // link LED
    if (p.type!=="console" && p.type!=="usb"){
      let led = "none";
      if (c){ const s = linkState(B,c); led = s.up ? "var(--ok)" : "var(--warn)"; }
      g += `<circle cx="${px+q.w/2}" cy="${py-6}" r="3" fill="${led==="none"?"var(--chip)":led}" stroke="var(--line)" stroke-width=".6"/>`;
    }
    g += `<text x="${px+q.w/2}" y="${py+q.h+10}" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="var(--mono)">${esc(p.label)}</text></g>`;
  }
  return g;
}
function portCenter(B, ref){ const x = P(B, ref), L = layout(x.dev), q = L.ports[x.port.id]; return [x.dev.x+q.x+q.w/2, x.dev.y+q.y+q.h/2]; }
function drawCables(B){
  return B.cables.map(c=>{
    const [x1,y1] = portCenter(B,c.a), [x2,y2] = portCenter(B,c.b);
    const sag = Math.max(40, Math.abs(x2-x1)*0.25);
    const s = linkState(B,c), col = CABLES[c.type].color;
    return `<path d="M${x1},${y1} C${x1},${y1+sag} ${x2},${y2+sag} ${x2},${y2}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round" opacity="${s.up?1:.75}" ${CABLES[c.type].kind==="console"?'stroke-dasharray="7 4"':""}/>`;
  }).join("");
}

function mount(el, cfg, tasks, onWin){
  let B = create(cfg);
  let sel = null, hand = null, tool = null, msg = cfg.start || "Pick a cable or a module from the tray, then click the ports you want to connect.", msgKind = "";
  const cons = { speed:"115200", data:"8", parity:"None", stop:"1", flow:"XON/XOFF" };
  const pcLines = {};
  let won = false;
  const say = (m, kind) => { msg = m; msgKind = kind||""; };
  function draw(){
    const vb = cfg.viewBox || "0 0 900 360";
    const doneN = tasks.filter(t=>{ try{ return t.done(B); }catch(e){ return false; } }).length;
    if (!won && tasks.length && doneN===tasks.length){ won = true; if (onWin) onWin(); }
    const selX = sel && P(B, sel), selC = sel && cableAt(B, sel);
    el.innerHTML = `
      ${tasks.length?(()=>{ const nx = tasks.find(t=>{ try{ return !t.done(B); }catch(e){ return true; } }); return `<div class="bn-prog"><span class="tag ${doneN===tasks.length?"ok":"acc"}">${doneN}/${tasks.length} tasks</span> ${nx?`<span class="small"><b>Next:</b> ${nx.text}</span>`:`<span class="small"><b>Lab complete.</b> ${cfg.win||"Everything is cabled, configured and verified."}</span>`}</div>`; })():""}
      <div class="bn-tray"><span class="small muted">Tray:</span>
        ${(cfg.tray||["cat6","console"]).map(k=>CABLES[k]?`<button class="bn-item ${hand&&hand.cable===k?"on":""}" data-cable="${k}" title="${esc(CABLES[k].name)}"><i style="background:${CABLES[k].color}"></i>${esc(CABLES[k].short)}</button>`:SFPS[k]?`<button class="bn-item ${hand&&hand.sfp===k?"on":""}" data-sfp="${k}" title="${esc(SFPS[k].name)}"><i class="sfp"></i>${esc(SFPS[k].short)} SFP</button>`:"").join("")}
        ${hand?`<button class="bn-item ghost" data-drop="1">✕ put it back</button>`:""}
      </div>
      <div class="bn-msg ${msgKind}">${hand&&hand.cable&&hand.from?`Holding one end of the ${esc(CABLES[hand.cable].short)} cable in ${esc(portName(P(B,hand.from)))} — click the port for the other end.`:esc(msg)}</div>
      <div class="bn-scene"><svg viewBox="${vb}" role="img" aria-label="lab bench">${drawCables(B)}${B.order.map(id=>drawDevice(B, B.devs[id], sel)).join("")}</svg></div>
      ${selX?`<div class="bn-sel"><b>${esc(portName(selX))}</b> <span class="small muted">· ${selX.port.type.toUpperCase()} port</span>
          ${selC?`<span class="small"> · ${esc(CABLES[selC.type].short)} cable to ${esc(portName(P(B,otherEnd(selC,sel))))} · ${(()=>{const s=linkState(B,selC); return s.console?"console connection":s.up?'<b style="color:var(--ok)">link up</b>':`<b style="color:var(--warn)">link down</b> — ${esc(s.why)}`;})()}</span>`:""}
          <div class="btnrow">${selC?`<button class="btn sm ghost" data-unplug="${sel}">Unplug</button>`:""}${selC&&CABLES[selC.type].kind==="fibre"?`<button class="btn sm ghost" data-flip="${sel}">Flip Tx/Rx at this end</button>`:""}${selX.port.type==="sfp"&&selX.port.sfp&&!selC?`<button class="btn sm ghost" data-remove="${sel}">Remove ${esc(SFPS[selX.port.sfp].short)} module</button>`:""}<button class="btn sm ghost" data-desel="1">Close</button></div></div>`:""}
      <div class="bn-devs">${B.order.map(id=>{ const d = B.devs[id];
        const btns = [];
        if (d.kind==="pc"||d.kind==="server"||d.kind==="laptop"){ btns.push(`<button class="btn sm ghost" data-tool="ip:${id}">IP settings</button>`, `<button class="btn sm ghost" data-tool="cmd:${id}">Command Prompt</button>`); }
        if (d.kind==="laptop") btns.push(`<button class="btn sm ghost" data-tool="putty:${id}">Terminal app (PuTTY)</button>`);
        if (cfg.power) btns.push(`<button class="btn sm ghost" data-power="${id}">${d.on?"Power off":"Power on"}</button>`);
        return btns.length?`<div class="bn-dev"><b>${esc(d.label)}</b> ${btns.join("")}</div>`:""; }).join("")}</div>
      <div class="bn-tool">${toolHtml()}</div>
      ${tasks.length?`<details class="bn-tasks" ${doneN<tasks.length?"open":""}><summary>All tasks (${doneN}/${tasks.length})</summary><div class="mt-tasks">${tasks.map(t=>{ let ok=false; try{ ok=t.done(B); }catch(e){} return `<div class="mt-task ${ok?"ok":""}"><span class="check ${ok?"done":""}">✓</span><span>${t.text}</span></div>`; }).join("")}</div></details>`:""}`;
    wire();
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
      return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · Command Prompt</div><div class="term bn-term">${L.map(l=>`<div class="ln ${l.cls}">${esc(l.t)}</div>`).join("")}</div>
      <div class="termbar"><input id="bn-cmd" autocomplete="off" spellcheck="false" placeholder="C:\\Users\\${esc(d.label)}> ipconfig · ping 192.168.10.1"><button class="btn" id="bn-run">Run</button><button class="btn sm ghost" data-tool="">Close</button></div></div>`; }
    if (kind==="putty"){
      if (B.console && B.console.laptop===id){
        const s = B.console, t = B.devs[s.target];
        return `<div class="bn-panel"><div class="mt-h">COM3 — PuTTY · ${esc(t.label)} console ${s.good?"":"<span style='color:var(--warn)'>(settings mismatch)</span>"}</div><div class="term bn-term">${s.lines.map(l=>`<div class="ln ${l.cls}">${esc(l.t)}</div>`).join("")}</div>
        <div class="termbar"><input id="bn-tin" autocomplete="off" spellcheck="false" placeholder="${s.good&&t.on?esc(t.env.prompt()):""}"><button class="btn" id="bn-trun">Send</button><button class="btn sm ghost" id="bn-tclose">Close session</button></div></div>`;
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
  function after(r){ if (r && r.msg) say(r.msg, r.ok?"":"bad"); draw(); }
  function wire(){
    el.querySelectorAll("[data-cable]").forEach(b=>b.onclick=()=>{ hand = {cable:b.dataset.cable, from:null}; sel=null; say(`Holding a ${CABLES[hand.cable].name}. Click the first port.`); draw(); });
    el.querySelectorAll("[data-sfp]").forEach(b=>b.onclick=()=>{ hand = {sfp:b.dataset.sfp}; sel=null; say(`Holding a ${SFPS[hand.sfp].name}. Click an empty SFP cage.`); draw(); });
    el.querySelectorAll("[data-drop]").forEach(b=>b.onclick=()=>{ hand=null; say("Put it back in the tray."); draw(); });
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
    el.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{ tool = b.dataset.tool || null; draw(); const f = el.querySelector("#bn-cmd,#bn-ip,#bn-tin"); if (f) f.focus(); });
    const ips = el.querySelector("#bn-ipsave");
    if (ips) ips.onclick = () => { const id = tool.split(":")[1]; const r = act(B, ["ip", id, el.querySelector("#bn-ip").value.trim(), el.querySelector("#bn-mask").value.trim(), el.querySelector("#bn-gw").value.trim()]); if (r.ok) tool=null; after(r); };
    const run = el.querySelector("#bn-run"), cin = el.querySelector("#bn-cmd");
    if (run){ const id = tool.split(":")[1]; const go = () => { const v = cin.value; if (!v.trim()) return; const L = pcLines[id]; L.push({t:`C:\\Users\\${B.devs[id].label}>${v}`, cls:"in"}); const o = act(B,["pc",id,v]).out; if (o && o.clear) pcLines[id] = []; else if (o) L.push({t:o, cls:""}); draw(); const n = el.querySelector("#bn-cmd"); if (n) n.focus(); const tm = el.querySelector(".bn-term"); if (tm) tm.scrollTop = tm.scrollHeight; };
      run.onclick = go; cin.onkeydown = e => { if (e.key==="Enter") go(); }; const tm = el.querySelector(".bn-term"); if (tm) tm.scrollTop = tm.scrollHeight; }
    const op = el.querySelector("#bn-open");
    if (op) op.onclick = () => { Object.assign(cons, { speed:el.querySelector("#bn-sp").value, data:el.querySelector("#bn-db").value, parity:el.querySelector("#bn-pa").value, stop:el.querySelector("#bn-sb").value, flow:el.querySelector("#bn-fc").value });
      const r = act(B, ["console", tool.split(":")[1], cons]); after(r); const n = el.querySelector("#bn-tin"); if (n) n.focus(); };
    const tr = el.querySelector("#bn-trun"), tin = el.querySelector("#bn-tin");
    if (tr){ const go = () => { const v = tin.value; const s = B.console; const t = B.devs[s.target];
        s.lines.push({t:(s.good&&t.on?t.env.prompt():"")+v, cls:"in"}); const o = act(B,["term",v]).out; if (o && o.clear) s.lines=[]; else if (o) s.lines.push({t:o, cls:""}); if (s.lines.length>200) s.lines = s.lines.slice(-200); draw(); const n = el.querySelector("#bn-tin"); if (n) n.focus(); const tm = el.querySelector(".bn-term"); if (tm) tm.scrollTop = tm.scrollHeight; };
      tr.onclick = go; tin.onkeydown = e => { if (e.key==="Enter") go(); if (e.key==="ArrowUp"){ const t = B.devs[B.console.target]; if (t.env.history.length){ tin.value = t.env.history[t.env.history.length-1]; e.preventDefault(); } } };
      const tm = el.querySelector(".bn-term"); if (tm) tm.scrollTop = tm.scrollHeight;
      el.querySelector("#bn-tclose").onclick = () => { B.console = null; draw(); }; }
  }
  el.reset = () => { B = create(cfg); sel=null; hand=null; tool=null; won=false; for (const k in pcLines) delete pcLines[k]; say("Bench reset — everything is back as it started."); draw(); };
  draw();
  return { get bench(){ return B; } };
}

window.Bench = { create, act, mount, linkState, linkUpAt, cableAt, l2From, reach, CABLES, SFPS,
  // helpers for task checks
  linked: (B, a, b) => B.cables.some(c=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a)),
  up: (B, a, b) => B.cables.some(c=>((c.a===a&&c.b===b)||(c.a===b&&c.b===a)) && linkState(B,c).up),
  upAt: (B, ref) => linkUpAt(B, ref),
  cableType: (B, ref) => { const c = cableAt(B, ref); return c ? c.type : null; },
  consoleOk: (B, dev) => !!(B.console && B.console.good && (!dev || B.console.target===dev)),
  pinged: (B, from, ip) => B.pinged[from+">"+ip]===true,
};
})();
