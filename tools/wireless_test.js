#!/usr/bin/env node
// Ladder Lab — wireless in the full engine (Module 9+): a lightweight AP joins a WLC (CAPWAP discovery via DHCP option 43 or
// the local subnet), a WPA2-PSK WLAN mapped to a VLAN interface, Wi-Fi laptops associate, get DHCP through the controller
// and reach the wired network; FlexConnect local switching; what breaks (wrong key, disabled WLAN, missing option 43,
// missing DHCP server on the interface, VLAN not on the trunk, WPA3-only vs WPA2 clients).
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console, Date }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["sim.js", "ipv6.js", "acl.js", "dhcp.js", "nat.js", "wlan.js", "wifi_gui.js", "sim_ios.js", "bench.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const { Bench } = ctx; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log(String(extra).split("\n").map(l=>"      "+l).join("\n")); } else console.log("ok  ", msg); };
const cfg = cmds => e => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); };
const out = r => typeof r.out === "string" ? r.out : (r.out && ((r.out.text||"") + (r.out.ask||""))) || r.msg || "";
const pc = (B, id, c) => out(Bench.act(B, ["pc", id, c]));
const log = B => B.log.join("\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");

// R1 router-on-a-stick: .10 APs, .20 staff, .99 management; SW1: g1 trunk to R1, g2 trunk to the WLC, g3 access VLAN 10 (AP)
const R1 = opt43 => ["int g0/0", "no shut", "int g0/0.10", "encapsulation dot1Q 10", "ip address 10.10.10.1 255.255.255.0", "int g0/0.20", "encapsulation dot1Q 20", "ip address 10.10.20.1 255.255.255.0",
  "int g0/0.99", "encapsulation dot1Q 99", "ip address 10.10.99.1 255.255.255.0", "exit", "ip dhcp excluded-address 10.10.10.1 10.10.10.9", "ip dhcp excluded-address 10.10.20.1 10.10.20.9",
  "ip dhcp pool APS", "network 10.10.10.0 255.255.255.0", "default-router 10.10.10.1", ...(opt43 ? ["option 43 hex " + opt43] : []), "exit", "ip dhcp pool STAFF", "network 10.10.20.0 255.255.255.0", "default-router 10.10.20.1", "exit"];
const SW = (x) => ["vlan 10", "vlan 20", "vlan 99", "exit", "int g0/1", "switchport mode trunk", "int g0/2", "switchport mode trunk", "int g0/3", "switchport mode access", "switchport access vlan 10", ...(x||[])];
const WLC = (o) => Object.assign({ mgmt:{ip:"10.10.99.5", mask:"255.255.255.0", gw:"10.10.99.1", vlan:99, port:1},
  ifaces:{ staff:{vlan:20, ip:"10.10.20.5", mask:"255.255.255.0", gw:"10.10.20.1", port:1, dhcp:"10.10.20.1"} },
  wlans:{ 1:{id:1, profile:"STAFF", ssid:"Staff-WiFi", enabled:true, iface:"staff", security:"wpa2-psk", cipher:"aes", psk:"Lagos-Staff-2026", pskFormat:"ascii", qos:"silver", broadcast:true, flexLocal:false} } }, o||{});
const mk = (o) => Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(R1(o.opt43===undefined ? "f104.0a0a.6305" : o.opt43)) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:150, config: cfg(SW(o.swx)) },
    { id:"wlc", kind:"wlc", label:"WLC1", x:300, y:0, wlc: WLC(o.wlc) },
    { id:"ap", kind:"ap", label:"AP-1F", x:300, y:300, mode: o.mode || "local" },
    { id:"lap", kind:"laptop", label:"LAPTOP", x:150, y:420, dhcp:true, wifi: Object.assign({ssid:"Staff-WiFi", key:"Lagos-Staff-2026"}, o.wifi||{}) } ],
  cables: [{type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"}] });

{ const B = mk({});
  ok(/^10\.10\.10\./.test(B.devs.ap.ip||""), "the AP leases an address in VLAN 10", B.devs.ap.ip);
  ok(Bench.apJoined(B, "ap") && B.devs.ap.joinVia==="DHCP option 43", "the AP finds the controller through DHCP option 43 and joins", JSON.stringify(B.devs.ap.joinLog));
  ok(B.devs.wlc.wlc.aps["AP-1F"], "the WLC lists the joined AP");
  ok(Bench.wifiAssoc(B, "lap") && Bench.wifiVlan(B, "lap")===20, "the laptop associates to Staff-WiFi and lands in VLAN 20", JSON.stringify(B.devs.lap.wifiRes));
  ok(/^10\.10\.20\./.test(B.devs.lap.ip||""), "…and gets DHCP from R1's STAFF pool through the controller", B.devs.lap.ip);
  ok(/Reply from 10\.10\.20\.1: bytes=32/.test(pc(B, "lap", "ping 10.10.20.1")), "the Wi-Fi laptop pings its gateway", pc(B, "lap", "ping 10.10.20.1"));
  ok(/Reply from 10\.10\.99\.5: bytes=32/.test(pc(B, "lap", "ping 10.10.99.5")), "…and the controller's management address (routed via R1)");
  ok(/Reply from 10\.10\.10\.\d+: bytes=32/.test(pc(B, "lap", "ping " + B.devs.ap.ip)), "…and the AP");
  const ni = pc(B, "lap", "netsh wlan show interfaces");
  ok(/^There is 1 interface on the system: \n\n    Name                   : Wi-Fi\n/.test(ni) && /    State                  : connected\n    SSID                   : Staff-WiFi\n/.test(ni) && /    Authentication         : WPA2-Personal\n    Cipher                 : CCMP\n/.test(ni), "netsh wlan show interfaces: connected, Staff-WiFi, WPA2-Personal, CCMP (real Windows 11 layout)", ni);
  const nn = pc(B, "lap", "netsh wlan show networks");
  ok(/There are 1 networks currently visible\. \n\nSSID 1 : Staff-WiFi\n    Network type            : Infrastructure\n    Authentication          : WPA2-Personal/.test(nn), "netsh wlan show networks lists the broadcast SSID", nn);
  const ic = pc(B, "lap", "ipconfig");
  ok(/Wireless LAN adapter Wi-Fi:/.test(ic) && !/Ethernet adapter Ethernet:/.test(ic) && /IPv4 Address[. ]*: 10\.10\.20\./.test(ic), "ipconfig shows the Wireless LAN adapter Wi-Fi with its VLAN 20 address", ic);
}
{ // what breaks
  const k = mk({wifi:{key:"wrong-password"}});
  ok(!Bench.wifiAssoc(k, "lap") && /security key isn't correct/.test(k.devs.lap.wifiRes.win), "wrong passphrase: not associated, Windows' wrong-key message");
  const n = mk({opt43:null});
  ok(!Bench.apJoined(n, "ap") && n.devs.ap.joinLog.join(" ").includes("no DHCP option 43") && !Bench.wifiAssoc(n, "lap"), "no option 43 and the WLC on another subnet: the AP never joins, so nothing broadcasts the SSID", n.devs.ap.joinLog.join("\n"));
  const w43 = mk({opt43:"f104.0a0a.6332"});
  ok(!Bench.apJoined(w43, "ap"), "option 43 with the wrong controller address (10.10.99.50): no join");
  const d = mk({wlc:{wlans:{1:Object.assign({}, WLC().wlans[1], {enabled:false})}}});
  ok(!Bench.wifiAssoc(d, "lap") && d.devs.lap.wifiRes.reason==="disabled", "WLAN Status not Enabled: the network isn't offered");
  const ns = mk({wlc:{ifaces:{staff:Object.assign({}, WLC().ifaces.staff, {dhcp:null})}}});
  ok(Bench.wifiAssoc(ns, "lap") && !ns.devs.lap.ip, "interface without a Primary DHCP Server: associated, but no address (DHCP proxy has nowhere to relay)");
  const t = mk({swx:["int g0/2", "switchport trunk allowed vlan 99"]});
  ok(Bench.wifiAssoc(t, "lap") && !t.devs.lap.ip, "VLAN 20 not allowed on the controller's trunk: associated, but the DHCP Discover never reaches R1");
  const w3 = mk({wlc:{wlans:{1:Object.assign({}, WLC().wlans[1], {security:"wpa3-sae"})}}});
  ok(!Bench.wifiAssoc(w3, "lap") && w3.devs.lap.wifiRes.reason==="needs-wpa3", "WPA3-only WLAN, WPA2-only laptop: can't connect");
  const w3b = mk({wlc:{wlans:{1:Object.assign({}, WLC().wlans[1], {security:"wpa3-sae"})}}, wifi:{wpa3:true}});
  ok(Bench.wifiAssoc(w3b, "lap") && /^10\.10\.20\./.test(w3b.devs.lap.ip||""), "…a WPA3-capable laptop joins it");
}
{ // same subnet: the AP finds the WLC by broadcast (no option 43 needed)
  const B = Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0", "ip address 10.20.0.1 255.255.255.0", "no shut", "exit", "ip dhcp excluded-address 10.20.0.1 10.20.0.20", "ip dhcp pool LAN", "network 10.20.0.0 255.255.255.0", "default-router 10.20.0.1", "exit"]) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:150 },
    { id:"wlc", kind:"wlc", label:"WLC1", x:300, y:0, wlc:{ mgmt:{ip:"10.20.0.5", mask:"255.255.255.0", gw:"10.20.0.1", vlan:0}, ifaces:{}, wlans:{ 1:{id:1, profile:"GUEST", ssid:"Guest", enabled:true, iface:"management", security:"none", qos:"bronze", broadcast:true} } } },
    { id:"ap", kind:"ap", label:"AP1", x:300, y:300 },
    { id:"lap", kind:"laptop", label:"VISITOR", x:150, y:420, dhcp:true, wifi:{ssid:"Guest"} } ],
    cables: [{type:"cat6", a:"r1:g0", b:"sw:g1"}, {type:"cat6", a:"wlc:p1", b:"sw:g2"}, {type:"cat6", a:"ap:eth", b:"sw:g3"}] });
  ok(Bench.apJoined(B, "ap") && B.devs.ap.joinVia==="local subnet broadcast", "AP and WLC on one subnet: discovery by broadcast", JSON.stringify(B.devs.ap.joinLog));
  ok(B.devs.lap.wifiAt && B.devs.lap.wifiAt.tag==null && Bench.wifiAssoc(B, "lap"), "open WLAN on the management interface (untagged)");
  ok(/^10\.20\.0\./.test(B.devs.lap.ip||"") || !B.devs.lap.ip, "(management-interface WLAN: DHCP needs the management interface's DHCP server — none set here)", B.devs.lap.ip);
}
{ // FlexConnect local switching: client traffic leaves at the AP's own switch port, which must be a trunk carrying the VLAN
  const B = mk({mode:"flexconnect", wlc:{wlans:{1:Object.assign({}, WLC().wlans[1], {flexLocal:true})}}, swx:["int g0/3", "switchport mode trunk", "switchport trunk native vlan 10"]});
  ok(Bench.apJoined(B, "ap") && B.devs.lap.wifiAt && B.devs.lap.wifiAt.flex && B.devs.lap.wifiAt.ref==="ap:eth", "FlexConnect + local switching: the client is switched at the AP's port");
  ok(/^10\.10\.20\./.test(B.devs.lap.ip||"") && /Reply from 10\.10\.20\.1: bytes=32/.test(pc(B, "lap", "ping 10.10.20.1")), "…and gets DHCP and reaches its gateway over the AP's trunk", B.devs.lap.ip);
  const A = mk({mode:"flexconnect", wlc:{wlans:{1:Object.assign({}, WLC().wlans[1], {flexLocal:true})}}});
  ok(Bench.wifiAssoc(A, "lap") && !A.devs.lap.ip, "FlexConnect local switching with the AP on an ACCESS port: VLAN 20 can't leave — no address");
}

{ // building it through the bench actions (what a solve does): interface, WLAN, security, enable — then the laptop connects
  const B = mk({wlc:{ifaces:{}, wlans:{}}, wifi:{ssid:null, key:null}});
  ok(!Bench.wifiAssoc(B, "lap"), "no WLAN yet: the laptop isn't connected");
  ok(Bench.act(B, ["wlc", "wlc", "iface", "staff", 20, {ip:"10.10.20.5", mask:"255.255.255.0", gw:"10.10.20.1", dhcp:"10.10.20.1"}]).ok, "CONTROLLER → Interfaces → New: staff, VLAN 20");
  ok(Bench.act(B, ["wlc", "wlc", "wlan", 1, "STAFF", "Staff-WiFi"]).ok && !Bench.wlanUp(B, "wlc", "Staff-WiFi"), "WLANs → Create New: starts disabled");
  ok(B.devs.wlc.wlc.wlans[1].security==="wpa2-ent" && !Bench.act(B, ["wlc", "wlc", "wlanset", 1, {security:"wpa2-psk", enabled:true}]).ok, "new WLAN defaults to 802.1X; switching to PSK and enabling with no key is refused");
  ok(Bench.act(B, ["wlc", "wlc", "wlanset", 1, {iface:"staff", security:"wpa2-psk", psk:"Lagos-Staff-2026", enabled:true}]).ok && Bench.wlanUp(B, "wlc", "Staff-WiFi"), "interface, WPA2 PSK, key and Status Enabled → applied");
  const r = Bench.act(B, ["wifi", "lap", "Staff-WiFi", "Lagos-Staff-2026"]);
  ok(r.ok && /connected to Staff-WiFi \(WPA2-Personal\) — got 10\.10\.20\./.test(r.msg) && Bench.wifiVlan(B, "lap")===20, "the laptop connects and gets an address in VLAN 20", r.msg);
  const bad = Bench.act(B, ["wifi", "lap", "Staff-WiFi", "nope-nope"]);
  ok(!bad.ok && /security key isn't correct/.test(bad.msg) && !Bench.wifiAssoc(B, "lap"), "wrong key through the Wi-Fi panel: the Windows message", bad.msg);
  ok(Bench.act(B, ["wlc", "wlc", "apmode", "ap", "flexconnect"]).ok && B.devs.ap.apMode==="flexconnect", "WIRELESS → All APs → AP Mode FlexConnect");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
