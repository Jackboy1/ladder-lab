// Ladder Lab — the wireless UI inside a bench: an AireOS-style WLC GUI (window.WLCGUI) and a Windows Wi-Fi panel (window.WIFIGUI).
// Labels follow Cisco's AireOS 8.10 configuration guide (verified fact sheet); every Apply goes through the bench's tested
// ["wlc", …] / ["wifi", …] actions, so the GUI and a solve can never disagree.
(function(){
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const W = () => window.WLAN;
const MENU = ["MONITOR","WLANs","CONTROLLER","WIRELESS","SECURITY","MANAGEMENT","COMMANDS","HELP","FEEDBACK"];
const L2 = sec => sec==="none" ? "None" : (sec==="wpa3-sae" || sec==="wpa2-wpa3") ? "WPA2+WPA3" : "WPA+WPA2";
const chk = (id, on, label, dis) => `<label class="wg-chk"><input type="checkbox" id="${id}" ${on?"checked":""} ${dis?"disabled":""}> ${esc(label)}</label>`;
const row = (label, ctl) => `<tr><th>${esc(label)}</th><td>${ctl}</td></tr>`;
const sel = (id, opts, v) => `<select class="txt" id="${id}">${opts.map(o=>{ const [val, txt] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val)===String(v)?"selected":""}>${esc(txt)}</option>`; }).join("")}</select>`;
const txt = (id, v, ph) => `<input class="txt mono" id="${id}" value="${esc(v==null?"":v)}" placeholder="${esc(ph||"")}" autocomplete="off" spellcheck="false">`;

const WLCGUI = {
  // state: {page, sub, wlan, iface}
  render(B, d, s){ const st = d.wlc, page = s.page || "WLANs";
    const top = `<div class="wg-top"><b>cisco</b><span class="wg-menu">${MENU.map(m=>`<button class="wg-m ${m===page?"on":""}" data-wg-page="${m}">${m}</button>`).join("")}</span><span class="wg-links">Save Configuration | Ping | Logout | Refresh</span></div>`;
    let body = "";
    if (page==="WLANs"){
      if (s.sub==="new") body = `<h4>WLANs &gt; New</h4><table class="wg-form">${row("Type", sel("wg-type", ["WLAN"], "WLAN"))}${row("Profile Name", txt("wg-prof", "", "e.g. STAFF"))}${row("SSID", txt("wg-ssid", "", "up to 32 characters"))}${row("ID", sel("wg-id", Array.from({length:16},(_,i)=>i+1).filter(i=>!st.wlans[i]), ""))}</table>
        <div class="btnrow"><button class="btn sm" data-wg="wlan-create">Apply</button><button class="btn sm ghost" data-wg-go="WLANs">&lt; Back</button></div>`;
      else if (s.sub==="edit" && st.wlans[s.wlan]){ const w = st.wlans[s.wlan], tab = s.tab || "General";
        const tabs = ["General","Security","QoS","Advanced"].map(t=>`<button class="wg-tab ${t===tab?"on":""}" data-wg-tab="${t}">${t}</button>`).join("");
        let tb = "";
        if (tab==="General") tb = `<table class="wg-form">${row("Profile Name", txt("wg-prof", w.profile))}${row("Type", "WLAN")}${row("SSID", txt("wg-ssid", w.ssid))}${row("Status", chk("wg-en", w.enabled, "Enabled"))}
          ${row("Security Policies", `<span class="mono">${esc(W().policyText(w))}</span><div class="small muted">(Modifications done under security tab will appear after applying the changes.)</div>`)}
          ${row("Interface/Interface Group(G)", sel("wg-if", ["management", ...Object.keys(st.ifaces)], w.iface))}${row("Broadcast SSID", chk("wg-bc", w.broadcast!==false, "Enabled"))}</table>`;
        if (tab==="Security"){ const l2 = L2(w.security), psk = w.security==="wpa2-psk" || w.security==="wpa2-wpa3", sae = w.security==="wpa3-sae" || w.security==="wpa2-wpa3", dot1x = w.security==="wpa2-ent";
          tb = `<div class="small muted">Layer 2 · <span class="muted">Layer 3 · AAA Servers</span></div><table class="wg-form">${row("Layer 2 Security", sel("wg-l2", ["None","WPA+WPA2","WPA2+WPA3"], l2))}</table>
          <div id="wg-wpa" ${l2==="None"?'style="display:none"':""}><h5>${l2==="WPA2+WPA3" ? "WPA2+WPA3 Parameters" : "WPA+WPA2 Parameters"}</h5><table class="wg-form">
            ${row("WPA2 Policy", chk("wg-p2", w.security!=="wpa3-sae", ""))}${row("WPA3 Policy", chk("wg-p3", sae, "", l2!=="WPA2+WPA3"))}${row("WPA2 Encryption", chk("wg-aes", true, "AES", true))}</table>
            <h5>Authentication Key Management</h5><table class="wg-form">${row("802.1X", chk("wg-k1", dot1x, "Enable"))}${row("PSK", chk("wg-kp", psk, "Enable"))}${row("SAE", chk("wg-ks", sae, "Enable", l2!=="WPA2+WPA3"))}
            ${row("PSK Format", sel("wg-pf", [["ascii","ascii"],["hex","hex"]], w.pskFormat||"ascii") + ` <input class="txt mono" id="wg-psk" type="password" placeholder="${w.psk ? "•••••••• (set — type to change)" : "8–63 characters"}" autocomplete="off">`)}</table></div>`; }
        if (tab==="QoS") tb = `<table class="wg-form">${row("Quality of Service (QoS)", sel("wg-qos", [["platinum","Platinum (voice)"],["gold","Gold (video)"],["silver","Silver (best effort)"],["bronze","Bronze (background)"]], w.qos||"silver"))}</table>`;
        if (tab==="Advanced") tb = `<h5>FlexConnect</h5><table class="wg-form">${row("FlexConnect Local Switching", chk("wg-flex", !!w.flexLocal, "Enabled"))}</table><div class="small muted">Local switching applies to APs in FlexConnect mode: client traffic leaves at the AP's own switch port instead of travelling to the controller.</div>`;
        body = `<h4>WLANs &gt; Edit '${esc(w.profile)}'</h4><div class="wg-tabs">${tabs}</div>${tb}<div class="btnrow"><button class="btn sm" data-wg="wlan-apply">Apply</button><button class="btn sm ghost" data-wg-go="WLANs">&lt; Back</button></div>`; }
      else { const R = Object.values(st.wlans).sort((a,b)=>a.id-b.id);
        body = `<h4>WLANs</h4><div class="small muted">Current Filter: None</div><div class="btnrow">${sel("wg-cn", ["Create New"], "Create New")} <button class="btn sm" data-wg="wlan-new">Go</button></div>
          <table class="bn-tab"><tr><th>WLAN ID</th><th>Type</th><th>Profile Name</th><th>WLAN SSID</th><th>Admin Status</th><th>Security Policies</th></tr>${R.map(w=>`<tr><td><a href="#" data-wg-wlan="${w.id}">${w.id}</a></td><td>WLAN</td><td>${esc(w.profile)}</td><td>${esc(w.ssid)}</td><td>${w.enabled?"Enabled":"Disabled"}</td><td class="mono">${esc(W().policyText(w))}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">No WLANs.</td></tr>`}</table>`; } }
    if (page==="CONTROLLER"){
      if (s.sub==="new") body = `<h4>Interfaces &gt; New</h4><table class="wg-form">${row("Interface Name", txt("wg-in", ""))}${row("VLAN Id", txt("wg-iv", "", "1–4094"))}</table><div class="btnrow"><button class="btn sm" data-wg="if-create">Apply</button><button class="btn sm ghost" data-wg-go="CONTROLLER">&lt; Back</button></div>`;
      else if (s.sub==="edit" && st.ifaces[s.iface]){ const i = st.ifaces[s.iface];
        body = `<h4>Interfaces &gt; Edit</h4><table class="wg-form">${row("Interface Name", esc(s.iface))}${row("Port Number", txt("wg-ip0", i.port||1))}${row("VLAN Identifier", esc(i.vlan))}${row("IP Address", txt("wg-ia", i.ip))}${row("Netmask", txt("wg-im", i.mask))}${row("Gateway", txt("wg-ig", i.gw))}${row("Primary DHCP Server", txt("wg-id", i.dhcp))}</table>
          <div class="btnrow"><button class="btn sm" data-wg="if-apply">Apply</button><button class="btn sm ghost" data-wg-go="CONTROLLER">&lt; Back</button></div>`; }
      else { const m = st.mgmt;
        body = `<h4>Interfaces</h4><div class="btnrow"><button class="btn sm" data-wg="if-new">New...</button></div><table class="bn-tab"><tr><th>Interface Name</th><th>VLAN Identifier</th><th>IP Address</th><th>Interface Type</th><th>Dynamic AP Management</th></tr>
          <tr><td>management</td><td>${m.vlan ? m.vlan : "untagged"}</td><td>${esc(m.ip||"")}</td><td>Static</td><td>Enabled</td></tr><tr><td>virtual</td><td>N/A</td><td>${esc(st.virtual||"192.0.2.1")}</td><td>Static</td><td>Not Supported</td></tr>
          ${Object.entries(st.ifaces).map(([n,i])=>`<tr><td><a href="#" data-wg-if="${esc(n)}">${esc(n)}</a></td><td>${i.vlan}</td><td>${esc(i.ip||"")}</td><td>Dynamic</td><td>Disabled</td></tr>`).join("")}</table>`; } }
    if (page==="WIRELESS"){ const aps = Object.entries(st.aps);
      body = `<h4>All APs</h4><div class="small muted">Number of APs: ${aps.length}</div><table class="bn-tab"><tr><th>AP Name</th><th>IP Address</th><th>AP Model</th><th>AP MAC</th><th>Operational Status</th><th>AP Mode</th></tr>
        ${aps.map(([n,a])=>{ const dev = Object.values(B.devs).find(v=>v.kind==="ap" && v.label===n); return `<tr><td>${esc(n)}</td><td>${esc(a.ip)}</td><td>${esc(a.model)}</td><td class="mono">${esc((a.mac||"").replace(/\./g,"").match(/../g).join(":"))}</td><td>REG</td><td>${sel("wg-apm-" + (dev ? dev.id : n), [["local","local"],["flexconnect","FlexConnect"],["monitor","monitor"],["sniffer","Sniffer"]], a.mode)} <button class="btn sm ghost" data-wg="ap-mode" data-ap="${esc(dev ? dev.id : n)}">Apply</button></td></tr>`; }).join("") || `<tr><td colspan="6" class="muted">No APs have joined this controller.</td></tr>`}</table>`; }
    if (page==="MANAGEMENT"){ const a = st.access;
      body = `<h4>HTTP-HTTPS Configuration</h4><table class="wg-form">${row("HTTP Access", sel("wg-http", [["0","Disabled"],["1","Enabled"]], a.http?1:0))}${row("HTTPS Access", sel("wg-https", [["0","Disabled"],["1","Enabled"]], a.https?1:0))}</table>
        <h4>Telnet-SSH Configuration</h4><table class="wg-form">${row("Allow New Telnet Sessions", sel("wg-tel", [["0","No"],["1","Yes"]], a.telnet?1:0))}${row("Allow New SSH Sessions", sel("wg-ssh", [["0","No"],["1","Yes"]], a.ssh?1:0))}</table>
        <div class="btnrow"><button class="btn sm" data-wg="mgmt-apply">Apply</button></div><div class="small muted">HTTPS and SSH are the secure choices — HTTP and Telnet send the admin password in clear text.</div>`; }
    if (page==="MONITOR"){ const c = Object.values(B.devs).filter(v=>v.wifiAt && v.wifiAt.wlc===d.id);
      body = `<h4>Summary</h4><table class="wg-form">${row("Management IP Address", esc(st.mgmt.ip||""))}${row("Access Points Supported / joined", Object.keys(st.aps).length)}${row("Clients", c.length)}${row("WLANs enabled", Object.values(st.wlans).filter(w=>w.enabled).length)}</table>
        <table class="bn-tab"><tr><th>Client MAC</th><th>AP Name</th><th>WLAN Profile</th><th>IP Address</th><th>VLAN</th></tr>${c.map(v=>`<tr><td class="mono">${esc(v.mac)}</td><td>${esc((B.devs[v.wifiAt.ap]||{}).label)}</td><td>${esc((st.wlans[v.wifiAt.wlan]||{}).profile)}</td><td>${esc(v.ip||"")}</td><td>${v.wifiAt.vlan||"untagged"}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">No clients.</td></tr>`}</table>`; }
    if (!body) body = `<p class="small muted">${esc(page)} — not used in this lab.</p>`;
    return `<div class="bn-panel wlcgui"><div class="mt-h">${esc(d.label)} · https://${esc(d.ip||"")}/ (Cisco WLC, AireOS)</div>${top}<div class="wg-body">${body}</div><div class="btnrow"><button class="btn sm ghost" data-tool="">Close</button></div></div>`; },
  wire(root, ctx){ if (!root) return; const s = ctx.state, d = ctx.dev, st = d.wlc, $ = q => root.querySelector(q), v = q => ($(q)||{}).value, on = q => !!($(q)||{}).checked;
    const go = o => { Object.assign(s, o); ctx.redraw(); };
    root.querySelectorAll("[data-wg-page]").forEach(b=>b.onclick=()=>go({page:b.dataset.wgPage, sub:null}));
    root.querySelectorAll("[data-wg-go]").forEach(b=>b.onclick=()=>go({page:b.dataset.wgGo, sub:null}));
    root.querySelectorAll("[data-wg-tab]").forEach(b=>b.onclick=()=>go({tab:b.dataset.wgTab}));
    root.querySelectorAll("[data-wg-wlan]").forEach(a=>a.onclick=e=>{ e.preventDefault(); go({sub:"edit", wlan:+a.dataset.wgWlan, tab:"General"}); });
    root.querySelectorAll("[data-wg-if]").forEach(a=>a.onclick=e=>{ e.preventDefault(); go({sub:"edit", iface:a.dataset.wgIf}); });
    const l2s = $("#wg-l2"); if (l2s) l2s.onchange = () => { const box = $("#wg-wpa"); if (box) box.style.display = l2s.value==="None" ? "none" : ""; const p3 = $("#wg-p3"), ks = $("#wg-ks"); if (p3) p3.disabled = l2s.value!=="WPA2+WPA3"; if (ks) ks.disabled = l2s.value!=="WPA2+WPA3"; };
    root.querySelectorAll("[data-wg]").forEach(b=>b.onclick=()=>{ const k = b.dataset.wg; let r;
      if (k==="wlan-new") return go({sub:"new"});
      if (k==="if-new") return go({sub:"new"});
      if (k==="wlan-create"){ r = ctx.act(["wlc", d.id, "wlan", +v("#wg-id"), v("#wg-prof").trim(), v("#wg-ssid")]); if (r.ok) go({sub:"edit", wlan:+v("#wg-id"), tab:"General"}); return; }
      if (k==="wlan-apply"){ const w = st.wlans[s.wlan], tab = s.tab || "General", f = {};
        if (tab==="General"){ f.profile = v("#wg-prof").trim(); f.ssid = v("#wg-ssid"); f.iface = v("#wg-if"); f.broadcast = on("#wg-bc"); f.enabled = on("#wg-en"); }
        if (tab==="Security"){ const l2 = v("#wg-l2"), p2 = on("#wg-p2"), p3 = on("#wg-p3"), k1 = on("#wg-k1"), kp = on("#wg-kp"), ks = on("#wg-ks");
          if (l2==="None") f.security = "none";
          else if (l2==="WPA+WPA2"){ if (k1 && kp) return ctx.say("Choose one Authentication Key Management method: 802.1X or PSK.", "bad"); if (!k1 && !kp) return ctx.say("Tick an Authentication Key Management method (802.1X or PSK).", "bad"); f.security = k1 ? "wpa2-ent" : "wpa2-psk"; }
          else { if (p2 && p3 && kp && ks) f.security = "wpa2-wpa3"; else if (p3 && ks && !p2) f.security = "wpa3-sae"; else if (p2 && kp && !p3) f.security = "wpa2-psk"; else return ctx.say("WPA2+WPA3: tick WPA2 Policy with PSK, WPA3 Policy with SAE, or both for transition mode.", "bad"); }
          f.pskFormat = v("#wg-pf"); const key = v("#wg-psk"); if (key) f.psk = key; }
        if (tab==="QoS") f.qos = v("#wg-qos");
        if (tab==="Advanced") f.flexLocal = on("#wg-flex");
        r = ctx.act(["wlc", d.id, "wlanset", w.id, f]); if (r.ok) ctx.redraw(); return; }
      if (k==="if-create"){ r = ctx.act(["wlc", d.id, "iface", v("#wg-in").trim(), +v("#wg-iv")]); if (r.ok) go({sub:"edit", iface:v("#wg-in").trim()}); return; }
      if (k==="if-apply"){ const f = {port:+v("#wg-ip0")||1, ip:v("#wg-ia").trim()||null, mask:v("#wg-im").trim()||null, gw:v("#wg-ig").trim()||null, dhcp:v("#wg-id").trim()||null};
        r = ctx.act(["wlc", d.id, "ifaceset", s.iface, f]); if (r.ok) ctx.redraw(); return; }
      if (k==="ap-mode"){ const id = b.dataset.ap; r = ctx.act(["wlc", d.id, "apmode", id, v("#wg-apm-" + id)]); if (r.ok) ctx.redraw(); return; }
      if (k==="mgmt-apply"){ r = ctx.act(["wlc", d.id, "access", {http:v("#wg-http")==="1", https:v("#wg-https")==="1", telnet:v("#wg-tel")==="1", ssh:v("#wg-ssh")==="1"}]); if (r.ok) ctx.redraw(); return; } }); },
};

// the laptop's Wi-Fi panel: the networks its AP is broadcasting, a security key box, Connect / Disconnect
const WIFIGUI = {
  visible(B, d){ const out = [], pin = d.wifi && d.wifi.ap;
    for (const ap of Object.values(B.devs).filter(v=>v.kind==="ap" && v.joinedTo && v.on!==false && !["monitor","sniffer"].includes(v.apMode) && (!pin || v.id===pin))){ const w = B.devs[ap.joinedTo];
      for (const wl of Object.values(w.wlc.wlans)) if (wl.enabled && wl.broadcast!==false && wl.id<=16 && !out.some(o=>o.ssid===wl.ssid)) out.push({ssid:wl.ssid, sec:wl.security, ap:ap.id, wlan:wl.id}); } return out; },
  render(B, d){ const nets = WIFIGUI.visible(B, d), cur = d.wifiAt, res = d.wifiRes;
    const lab = s => s==="none" ? "Open" : s==="wpa2-ent" ? "Secured (WPA2-Enterprise)" : s==="wpa3-sae" ? "Secured (WPA3-Personal)" : s==="wpa2-wpa3" ? "Secured (WPA2/WPA3-Personal)" : "Secured (WPA2-Personal)";
    return `<div class="bn-panel"><div class="mt-h">${esc(d.label)} · Wi-Fi</div>
      ${cur ? `<p class="small"><b>Connected</b> to <b>${esc(cur.ssid)}</b> · ${esc(cur.auth)}${d.ip ? " · IPv4 " + esc(d.ip) : " · no IP address yet"}</p><div class="btnrow"><button class="btn sm ghost" id="wf-off">Disconnect</button></div>`
           : res && res.reason && res.reason!=="none" ? `<p class="small" style="color:var(--bad)">${esc(res.win)}</p>` : ""}
      ${nets.length ? `<table class="bn-tab"><tr><th></th><th>Network (SSID)</th><th>Security</th></tr>${nets.map((n,i)=>`<tr><td><input type="radio" name="wf-n" value="${esc(n.ssid)}" ${cur && cur.ssid===n.ssid || (!cur && i===0) ? "checked" : ""}></td><td>${esc(n.ssid)}</td><td>${esc(lab(n.sec))}</td></tr>`).join("")}</table>
        <div class="bn-form"><label>Enter the network security key<input class="txt mono" id="wf-key" type="password" autocomplete="off"></label><label class="wg-chk"><input type="checkbox" id="wf-w3" ${d.wifi && d.wifi.wpa3 ? "checked" : ""} disabled> This adapter supports WPA3</label></div>
        <div class="btnrow"><button class="btn sm" id="wf-go">Connect</button><button class="btn sm ghost" data-tool="">Cancel</button></div>`
        : `<p class="small muted">No Wi-Fi networks found — no access point near this laptop is broadcasting an SSID (has the AP joined a controller, and is a WLAN enabled?).</p><div class="btnrow"><button class="btn sm ghost" data-tool="">Close</button></div>`}</div>`; },
  wire(root, ctx){ if (!root) return; const d = ctx.dev, go = root.querySelector("#wf-go"), off = root.querySelector("#wf-off");
    if (go) go.onclick = () => { const n = root.querySelector('input[name="wf-n"]:checked'); if (!n) return; const r = ctx.act(["wifi", d.id, n.value, root.querySelector("#wf-key").value]); ctx.redraw(); void r; };
    if (off) off.onclick = () => { ctx.act(["wifi", d.id, null, null]); ctx.redraw(); }; },
};
window.WLCGUI = WLCGUI; window.WIFIGUI = WIFIGUI;
})();
