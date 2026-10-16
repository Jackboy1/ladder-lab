// Ladder Lab — wireless LAN helper (window.WLAN): a Cisco WLC's configuration (interfaces, WLANs, APs, management
// access), AP join (CAPWAP discovery), client association (security compatibility + passphrase), and RF arithmetic.
// Pure logic — bench.js draws and wires it; tools/wlan_test.js checks it.
(function(){
const ipNum = s => String(s).split(".").reduce((a,o)=>a*256+(+o),0) >>> 0;
const ipOk = s => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(String(s)) && String(s).split(".").every(o=>+o<=255);
const sameNet = (a, b, m) => ipOk(a) && ipOk(b) && ipOk(m) && ((ipNum(a) & ipNum(m))>>>0)===((ipNum(b) & ipNum(m))>>>0);
const W = {};

/* ---------- the controller's configuration ---------- */
W.store = (o) => Object.assign({
  mgmt: {ip:null, mask:null, gw:null, vlan:0, port:1},          // the management interface (APs join to this address)
  virtual: "192.0.2.1",                                          // the virtual interface (DHCP relay identity, web auth) — RFC 5737 space, never routed
  ifaces: {},                                                     // dynamic interfaces: name → {vlan, ip, mask, gw, port, dhcp}
  wlans: {},                                                      // id → WLAN
  aps: {},                                                        // AP name → {mode, joined, …} (filled by the bench)
  access: {http:false, https:true, telnet:false, ssh:true},       // MANAGEMENT page toggles
  lag: false,
}, o||{});
W.LIMITS = { wlanId:[1, 512], ssid:32, profile:32, pskAscii:[8, 63], pskHex:64 };
W.SECURITY = { "none":"None (open)", "wpa2-psk":"WPA2 Personal (PSK)", "wpa2-ent":"WPA2 Enterprise (802.1X)", "wpa3-sae":"WPA3 Personal (SAE)", "wpa2-wpa3":"WPA2 + WPA3 transition" };
W.QOS = { platinum:"voice", gold:"video", silver:"best effort", bronze:"background" };

W.createIface = (st, f) => { const name = String(f.name||"").trim(), vlan = +f.vlan;
  if (!name) return {err:"Interface Name is required."}; if (st.ifaces[name] || name==="management" || name==="virtual") return {err:`Interface ${name} already exists.`};
  if (!(vlan>=1 && vlan<=4094)) return {err:"VLAN Id must be 1–4094."}; if (Object.values(st.ifaces).some(i=>i.vlan===vlan) || st.mgmt.vlan===vlan && vlan) return {err:`VLAN ${vlan} is already used by another interface.`};
  st.ifaces[name] = {vlan, ip:null, mask:null, gw:null, port:1, dhcp:null}; return {ok:true}; };
W.setIface = (st, name, f) => { const i = st.ifaces[name]; if (!i) return {err:`No interface ${name}.`};
  for (const k of ["ip","mask","gw","dhcp"]) if (f[k]!=null && f[k]!=="" && !ipOk(f[k])) return {err:`${k==="gw"?"Gateway":k==="dhcp"?"Primary DHCP Server":k==="ip"?"IP Address":"Netmask"} is not a valid address.`};
  if (f.ip && f.mask && f.gw && !sameNet(f.ip, f.gw, f.mask)) return {err:"The gateway must be in the interface's subnet."};
  Object.assign(i, Object.fromEntries(Object.entries(f).filter(([,v])=>v!==undefined))); return {ok:true}; };

W.createWlan = (st, f) => { const id = +f.id, ssid = String(f.ssid||""), profile = String(f.profile||"").trim();
  if (!(id>=W.LIMITS.wlanId[0] && id<=W.LIMITS.wlanId[1])) return {err:`WLAN ID must be ${W.LIMITS.wlanId[0]}–${W.LIMITS.wlanId[1]}.`};
  if (st.wlans[id]) return {err:`WLAN ID ${id} is already in use.`};
  if (!profile) return {err:"Profile Name is required."}; if (!ssid) return {err:"SSID is required."};
  if (ssid.length > W.LIMITS.ssid) return {err:`SSID can be at most ${W.LIMITS.ssid} characters.`};
  if (Object.values(st.wlans).some(w=>w.profile===profile)) return {err:`Profile Name ${profile} is already in use.`};
  // AireOS: a new WLAN is created disabled, on the management interface, WPA2 + AES with 802.1X key management, QoS Silver, SSID broadcast on
  st.wlans[id] = {id, profile, ssid, enabled:false, iface:"management", security:"wpa2-ent", cipher:"aes", psk:null, pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false};
  return {ok:true}; };
W.setWlan = (st, id, f) => { const w = st.wlans[id]; if (!w) return {err:`No WLAN ${id}.`};
  if (w.enabled && f.enabled!==false && ((f.ssid!=null && f.ssid!==w.ssid) || (f.profile!=null && f.profile!==w.profile))) return {err:"Disable the WLAN before changing its Profile Name or SSID."};
  if (f.ssid!=null && String(f.ssid).length > W.LIMITS.ssid) return {err:`SSID can be at most ${W.LIMITS.ssid} characters.`};
  if (f.iface!=null && f.iface!=="management" && !st.ifaces[f.iface]) return {err:`Interface ${f.iface} doesn't exist.`};
  if (f.security!=null && !W.SECURITY[f.security]) return {err:"Unknown security type."};
  if (f.psk!=null && f.psk!==""){ const fmt = f.pskFormat || w.pskFormat || "ascii", k = String(f.psk);
    if (fmt==="ascii" && !(k.length>=W.LIMITS.pskAscii[0] && k.length<=W.LIMITS.pskAscii[1])) return {err:`An ASCII pre-shared key must be ${W.LIMITS.pskAscii[0]}–${W.LIMITS.pskAscii[1]} characters.`};
    if (fmt==="hex" && !new RegExp(`^[0-9a-fA-F]{${W.LIMITS.pskHex}}$`).test(k)) return {err:`A hex pre-shared key must be exactly ${W.LIMITS.pskHex} hex digits.`}; }
  if (f.qos!=null && !W.QOS[f.qos]) return {err:"Unknown QoS profile."};
  Object.assign(w, Object.fromEntries(Object.entries(f).filter(([,v])=>v!==undefined)));
  if (w.enabled && (w.security==="wpa2-psk" || w.security==="wpa3-sae" || w.security==="wpa2-wpa3") && !w.psk) { w.enabled = false; return {err:"Set a pre-shared key before enabling a PSK/SAE WLAN.", disabled:true}; }
  return {ok:true}; };
W.policyText = w => w.security==="none" ? "None" : w.security==="wpa2-psk" ? "[WPA2][Auth(PSK)]" : w.security==="wpa2-ent" ? "[WPA2][Auth(802.1X)]" : w.security==="wpa3-sae" ? "[WPA3][Auth(SAE)]" : "[WPA2][Auth(PSK)], [WPA3][Auth(SAE)]";
W.ifaceOf = (st, w) => w.iface==="management" ? Object.assign({name:"management"}, st.mgmt) : Object.assign({name:w.iface}, st.ifaces[w.iface]);

/* ---------- AP join: how does a lightweight AP find its controller? ---------- */
// ctx: {ap:{ip, mask, gw, primary}, dhcpOpt43:[WLC IPs], dnsWlc:IP|null, wlcMgmt:IP, reach:fn(ip)→bool}
W.discover = ctx => { const steps = [], a = ctx.ap, cands = [];
  if (!a.ip) return {joined:false, reason:"no-ip", steps:["The AP has no IP address yet (no DHCP lease on its switch port's VLAN) — it can't start CAPWAP discovery."]};
  if (a.primary) { cands.push({ip:a.primary, how:"configured primary controller"}); }
  for (const ip of (ctx.dhcpOpt43||[])) cands.push({ip, how:"DHCP option 43"});
  if (ctx.dnsWlc) cands.push({ip:ctx.dnsWlc, how:"DNS (CISCO-CAPWAP-CONTROLLER)"});
  if (ctx.wlcMgmt && a.mask && sameNet(a.ip, ctx.wlcMgmt, a.mask)) cands.push({ip:ctx.wlcMgmt, how:"local subnet broadcast"});
  if (!cands.length){ steps.push("CAPWAP discovery: no configured controller, no DHCP option 43, no DNS entry, and no controller on the AP's own subnet — nothing answers the discovery."); return {joined:false, reason:"no-wlc", steps}; }
  for (const c of cands){ const ok = c.ip===ctx.wlcMgmt && (!ctx.reach || ctx.reach(c.ip));
    steps.push(`CAPWAP discovery request (UDP 5246) to ${c.ip} via ${c.how} → ${ok ? "discovery response from the controller" : c.ip===ctx.wlcMgmt ? "no route to the controller" : "nothing answers at that address"}`);
    if (ok){ steps.push("CAPWAP join request → join response; DTLS-protected control channel up (UDP 5246), data channel UDP 5247; the AP downloads its configuration and starts broadcasting the WLANs"); return {joined:true, via:c.how, steps}; } }
  return {joined:false, reason: cands.some(c=>c.ip===ctx.wlcMgmt) ? "unreachable" : "wrong-wlc", steps}; };

/* ---------- client association ---------- */
// client: {ssid, key, wpa3:bool (radio/driver supports WPA3), wpa2:bool default true}
W.associate = (st, apJoined, client) => {
  if (!apJoined) return {ok:false, reason:"no-ap", win:"The network isn't listed — no access point is broadcasting it.", why:"The AP hasn't joined the controller, so it has no WLANs to broadcast."};
  const w = Object.values(st.wlans).find(x=>x.ssid===client.ssid);
  if (!w) return {ok:false, reason:"no-ssid", win:"The network isn't listed.", why:`No WLAN on the controller has the SSID "${client.ssid}".`};
  if (!w.enabled) return {ok:false, reason:"disabled", win:"The network isn't listed.", why:`WLAN ${w.id} (${w.profile}) exists but its Status isn't Enabled.`};
  if (w.id > 16) return {ok:false, reason:"apgroup", win:"The network isn't listed.", why:`APs in the default AP group advertise only WLAN IDs 1–16; WLAN ${w.id} needs an AP group (not modelled in this lab).`};
  const wpa2 = client.wpa2!==false, wpa3 = !!client.wpa3;
  if (w.security==="wpa3-sae" && !wpa3) return {ok:false, reason:"needs-wpa3", win:"Can't connect to this network", why:"The WLAN is WPA3-only (SAE) and this client's Wi-Fi adapter or driver only supports WPA2."};
  if (w.security==="wpa2-psk" && !wpa2) return {ok:false, reason:"needs-wpa2", win:"Can't connect to this network", why:"The WLAN is WPA2-only and the client only speaks WPA3."};
  if (w.security==="wpa2-ent") return {ok:false, reason:"needs-radius", win:"Can't connect to this network", why:"WPA2 Enterprise needs 802.1X: the controller must reach a RADIUS server that checks the user's credentials — this lab has none."};
  if (w.security!=="none" && client.key!==w.psk) return {ok:false, reason:"bad-key", win:"The network security key isn't correct", why:"The passphrase doesn't match the WLAN's pre-shared key, so the 4-way handshake (WPA2) or SAE exchange (WPA3) fails."};
  const mode = w.security==="none" ? "Open" : w.security==="wpa2-wpa3" ? (wpa3 ? "WPA3-Personal" : "WPA2-Personal") : w.security==="wpa3-sae" ? "WPA3-Personal" : "WPA2-Personal";
  return {ok:true, wlan:w, auth:mode, cipher: w.security==="none" ? "None" : "CCMP", why: w.security==="none" ? "An open WLAN: no key, no encryption — anyone in range can join and read the traffic." : `${mode}: the keys match, the handshake completes and traffic is encrypted with AES-CCMP.`}; };

/* ---------- RF arithmetic ---------- */
W.rf = {
  freq: (ch, band) => band===5 || ch>14 ? 5000 + 5*ch : ch===14 ? 2484 : 2407 + 5*ch,          // centre frequency in MHz
  overlap24: (a, b) => a!==b && Math.abs(W.rf.freq(a, 2.4) - W.rf.freq(b, 2.4)) < 25,       // 22 MHz-wide DSSS channels → need ≥ 25 MHz spacing
  nonOverlapping24: list => list.every((a,i)=>list.every((b,j)=>i===j || (a!==b && !W.rf.overlap24(a,b)))),
  mwToDbm: mw => 10*Math.log10(mw), dbmToMw: dbm => 10**(dbm/10), snr: (rssi, noise) => rssi - noise,
};
window.WLAN = W;
})();
