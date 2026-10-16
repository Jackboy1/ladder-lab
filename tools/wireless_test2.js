#!/usr/bin/env node
// Ladder Lab — wireless engine gaps found while writing Module 9 (join lines in the frame log, client↔client bridging, monitor mode,
// DHCP proxy's virtual-address server, DHCP retry after a fix, 2.4 GHz netsh values, PSK length default).
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
const R1 = o43 => ["int g0/0","no shut","int g0/0.10","encapsulation dot1Q 10","ip address 10.10.10.1 255.255.255.0","int g0/0.20","encapsulation dot1Q 20","ip address 10.10.20.1 255.255.255.0","int g0/0.99","encapsulation dot1Q 99","ip address 10.10.99.1 255.255.255.0","exit","ip dhcp excluded-address 10.10.20.1 10.10.20.9","ip dhcp pool APS","network 10.10.10.0 255.255.255.0","default-router 10.10.10.1", ...(o43 ? ["option 43 hex " + o43] : []),"exit","ip dhcp pool STAFF","network 10.10.20.0 255.255.255.0","default-router 10.10.20.1","exit"];
const SW = ["vlan 10","vlan 20","vlan 99","exit","int g0/1","switchport mode trunk","int g0/2","switchport mode trunk","int g0/3","switchport mode access","switchport access vlan 10"];
const mk = o => Bench.create({ devices:[
  {id:"r1", kind:"router", label:"R1", x:0, y:0, config:cfg(R1(o.o43===undefined ? "f104.0a0a.6305" : o.o43))}, {id:"sw", kind:"switch", label:"SW1", x:0, y:150, config:cfg(SW)},
  {id:"wlc", kind:"wlc", label:"WLC1", x:300, y:0, wlc:{mgmt:{ip:"10.10.99.5", mask:"255.255.255.0", gw:"10.10.99.1", vlan:99}, ifaces:{staff:{vlan:20, ip:"10.10.20.5", mask:"255.255.255.0", gw:"10.10.20.1", dhcp: o.dhcp===undefined ? "10.10.20.1" : o.dhcp}},
    wlans:{1:{id:1, profile:"STAFF", ssid:"Staff-WiFi", enabled:true, iface:"staff", security:"wpa2-psk", psk:"Lagos-Staff-2026", qos:"silver", broadcast:true}}}},
  {id:"ap", kind:"ap", label:"AP-1F", x:300, y:300, channel: o.ch || 36},
  {id:"a", kind:"laptop", label:"LAP-A", x:100, y:420, dhcp:true, wifi:{ssid:"Staff-WiFi", key:"Lagos-Staff-2026"}},
  {id:"b", kind:"laptop", label:"LAP-B", x:250, y:420, dhcp:true, wifi:{ssid:"Staff-WiFi", key:"Lagos-Staff-2026"}} ],
  cables:[{type:"cat6",a:"r1:g0",b:"sw:g1"},{type:"cat6",a:"wlc:p1",b:"sw:g2"},{type:"cat6",a:"ap:eth",b:"sw:g3"}] });

{ const B = mk({o43:null});
  ok(!Bench.apJoined(B, "ap"), "setup: no option 43, the AP can't join");
  const e = B.devs.r1.env; e.exec("en"); e.exec("conf t"); e.exec("ip dhcp pool APS"); e.exec("option 43 hex f104.0a0a.6305"); e.exec("end");
  Bench.act(B, ["pc", "a", "ipconfig"]);
  ok(Bench.apJoined(B, "ap") && /AP-1F — CAPWAP: joined WLC1 \(DHCP option 43\)/.test(log(B)) && /CAPWAP discovery request \(UDP 5246\) to 10\.10\.99\.5 via DHCP option 43/.test(log(B)), "after the option 43 fix, the next action's frame log shows the CAPWAP join", log(B)); }
{ const B = mk({});
  ok(Bench.wifiAssoc(B, "a") && Bench.wifiAssoc(B, "b"), "two laptops on Staff-WiFi");
  const r = pc(B, "a", "ping " + B.devs.b.ip);
  ok(/Reply from 10\.10\.20\.\d+: bytes=32/.test(r) && /WLC1 bridges the frame straight to LAP-B/.test(log(B)), "Wi-Fi client pings Wi-Fi client: the controller bridges them", r + "\n" + log(B));
  ok(/DHCP Server . . . . . . . . . . . : 192\.0\.2\.1/.test(pc(B, "a", "ipconfig /all")), "DHCP proxy: ipconfig /all shows the controller's virtual address as DHCP Server");
  Bench.act(B, ["wlc", "wlc", "apmode", "ap", "monitor"]);
  ok(!Bench.wifiAssoc(B, "a") && B.devs.a.wifiRes.reason==="ap-mode", "AP in monitor mode: no clients", JSON.stringify(B.devs.a.wifiRes));
  ok(/switches to FlexConnect without a reboot/.test(Bench.act(mk({}), ["wlc", "wlc", "apmode", "ap", "flexconnect"]).msg), "local → FlexConnect: no reboot (AireOS 8.10)"); }
{ const B = mk({dhcp:null});
  ok(Bench.wifiAssoc(B, "a") && !B.devs.a.ip, "setup: no Primary DHCP Server → no address");
  Bench.act(B, ["wlc", "wlc", "ifaceset", "staff", {dhcp:"10.10.20.1"}]);
  ok(/^10\.10\.20\./.test(B.devs.a.ip||""), "after setting the Primary DHCP Server the client retries by itself and gets an address", B.devs.a.ip); }
{ const B = mk({ch:6}); const n = pc(B, "a", "netsh wlan show interfaces");
  ok(/Band                   : 2\.4 GHz\n    Channel                : 6\n/.test(n) && /Radio type             : 802\.11n\n/.test(n) && /Receive rate \(Mbps\)    : 144\.4/.test(n) && !new RegExp(B.devs.ap.mac.replace(/\./g,"").match(/../g).join(":")).test(n), "AP on channel 6: netsh shows 2.4 GHz, 802.11n, 144.4 Mbps and a radio BSSID (not the Ethernet MAC)", n);
  ok(/BSSID 1                 : [0-9a-f:]{17}\n         Signal             : 91%  \n         Radio type         : 802\.11n\n         Band               : 2\.4 GHz\n         Channel            : 6 /.test(pc(B, "a", "netsh wlan show networks mode=bssid")), "netsh wlan show networks mode=bssid prints the BSSID block");
  ok(/Wireless LAN adapter Wi-Fi:/.test(pc(B, "a", "ipconfig /renew")) || /Wi-Fi/.test(pc(B, "a", "ipconfig /renew")), "ipconfig /renew names the Wi-Fi adapter");
  ok(/8–63/.test(Bench.act(B, ["wlc", "wlc", "wlanset", 1, {psk:"short"}]).msg), "a bench-defined WLAN still enforces the 8–63 PSK length"); }
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
