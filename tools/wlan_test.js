#!/usr/bin/env node
// Ladder Lab — wlan.js unit tests: WLC configuration rules, AP join (CAPWAP discovery), client association, RF arithmetic.
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "wlan.js"), "utf8"), ctx, { filename: "wlan.js" });
const W = ctx.WLAN; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log("      " + JSON.stringify(extra)); } else console.log("ok  ", msg); };

// configuration rules
const st = W.store({mgmt:{ip:"10.10.99.5", mask:"255.255.255.0", gw:"10.10.99.1", vlan:99, port:1}});
ok(W.createIface(st, {name:"staff", vlan:20}).ok && /already used/.test(W.createIface(st, {name:"x", vlan:20}).err) && /1–4094/.test(W.createIface(st, {name:"y", vlan:5000}).err), "dynamic interfaces: unique name and VLAN, 1–4094");
ok(/gateway must be in/.test(W.setIface(st, "staff", {ip:"10.10.20.5", mask:"255.255.255.0", gw:"10.10.21.1"}).err) && W.setIface(st, "staff", {ip:"10.10.20.5", mask:"255.255.255.0", gw:"10.10.20.1", dhcp:"10.10.99.10"}).ok, "interface addressing validated");
ok(W.createWlan(st, {id:1, profile:"STAFF", ssid:"Staff-WiFi"}).ok && /already in use/.test(W.createWlan(st, {id:1, profile:"B", ssid:"b"}).err) && /1–512/.test(W.createWlan(st, {id:0, profile:"C", ssid:"c"}).err) && /at most 32/.test(W.createWlan(st, {id:2, profile:"D", ssid:"x".repeat(33)}).err), "WLAN ID 1–512 unique, SSID ≤ 32");
ok(st.wlans[1].enabled===false, "a new WLAN starts disabled");
ok(/8–63/.test(W.setWlan(st, 1, {psk:"short"}).err) && /64 hex/.test(W.setWlan(st, 1, {pskFormat:"hex", psk:"abc"}).err), "PSK: 8–63 ASCII or 64 hex");
ok(/pre-shared key before enabling/.test(W.setWlan(st, 1, {enabled:true}).err) && st.wlans[1].enabled===false, "a PSK WLAN can't be enabled without a key");
ok(W.setWlan(st, 1, {psk:"Staff-Lagos-2026", iface:"staff", enabled:true}).ok && /doesn't exist/.test(W.setWlan(st, 1, {iface:"guest"}).err), "WLAN mapped to an existing interface and enabled");
ok(W.policyText(st.wlans[1])==="[WPA2][Auth(PSK)]", "security policy summary [WPA2][Auth(PSK)]");

// AP join
const reach = ip => ip==="10.10.99.5";
ok(W.discover({ap:{ip:null}, wlcMgmt:"10.10.99.5"}).reason==="no-ip", "AP without a lease can't discover");
ok(W.discover({ap:{ip:"10.10.99.21", mask:"255.255.255.0"}, wlcMgmt:"10.10.99.5", reach}).via==="local subnet broadcast", "same subnet: broadcast discovery joins");
ok(W.discover({ap:{ip:"10.10.30.21", mask:"255.255.255.0"}, wlcMgmt:"10.10.99.5", reach}).reason==="no-wlc", "other subnet, no option 43/DNS: no controller found");
ok(W.discover({ap:{ip:"10.10.30.21", mask:"255.255.255.0"}, dhcpOpt43:["10.10.99.5"], wlcMgmt:"10.10.99.5", reach}).via==="DHCP option 43", "option 43 points at the WLC: joins");
ok(W.discover({ap:{ip:"10.10.30.21", mask:"255.255.255.0"}, dhcpOpt43:["10.10.99.50"], wlcMgmt:"10.10.99.5", reach}).reason==="wrong-wlc", "option 43 with the wrong address: no join");
ok(W.discover({ap:{ip:"10.10.30.21", mask:"255.255.255.0"}, dhcpOpt43:["10.10.99.5"], wlcMgmt:"10.10.99.5", reach:()=>false}).reason==="unreachable", "right address but no route: no join");

// association
ok(W.associate(st, false, {ssid:"Staff-WiFi", key:"x"}).reason==="no-ap", "no joined AP → network not listed");
ok(W.associate(st, true, {ssid:"Staff-WiFi", key:"wrong-key-1"}).win==="The network security key isn't correct. Please try again.", "wrong passphrase → Windows message");
ok(W.associate(st, true, {ssid:"Staff-WiFi", key:"Staff-Lagos-2026"}).ok, "right passphrase → associated (WPA2-Personal, CCMP)");
W.setWlan(st, 1, {security:"wpa3-sae"});
ok(W.associate(st, true, {ssid:"Staff-WiFi", key:"Staff-Lagos-2026", wpa3:false}).reason==="needs-wpa3" && W.associate(st, true, {ssid:"Staff-WiFi", key:"Staff-Lagos-2026", wpa3:true}).auth==="WPA3-Personal", "WPA3-only: old clients can't join, WPA3 clients can");
W.setWlan(st, 1, {security:"wpa2-wpa3"});
ok(W.associate(st, true, {ssid:"Staff-WiFi", key:"Staff-Lagos-2026"}).auth==="WPA2-Personal" && W.associate(st, true, {ssid:"Staff-WiFi", key:"Staff-Lagos-2026", wpa3:true}).auth==="WPA3-Personal", "transition mode: each client uses what it supports");
W.setWlan(st, 1, {enabled:false}); ok(W.associate(st, true, {ssid:"Staff-WiFi", key:"Staff-Lagos-2026"}).reason==="disabled", "disabled WLAN isn't offered");

// RF
ok(W.rf.freq(1)===2412 && W.rf.freq(6)===2437 && W.rf.freq(11)===2462 && W.rf.freq(14)===2484 && W.rf.freq(36, 5)===5180 && W.rf.freq(149, 5)===5745, "channel centre frequencies (2.4 and 5 GHz)");
ok(W.rf.nonOverlapping24([1,6,11]) && !W.rf.nonOverlapping24([1,5,11]) && W.rf.overlap24(1,4) && !W.rf.overlap24(1,6), "1/6/11 don't overlap; channels < 5 apart do");
ok(Math.abs(W.rf.mwToDbm(1)) < 1e-9 && Math.abs(W.rf.mwToDbm(100) - 20) < 1e-9 && Math.abs(W.rf.dbmToMw(3) - 1.995) < 0.01 && W.rf.snr(-65, -92)===27, "dBm/mW and SNR arithmetic");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
