#!/usr/bin/env node
// Ladder Lab — Module 10 engine fixes: PortFast on trunks, Windows ping wording (timeout vs host unreachable), MAC-table / standby brief /
// CDP column formats, interface type + number with a space, show spanning-tree without a bench, show ip route in user EXEC,
// HSRP logged before OSPF when an active router dies, B.pinged from IOS pings.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console, Date }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["sim.js", "ipv6.js", "acl.js", "dhcp.js", "nat.js", "sim_ios.js", "bench.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const { Bench, SIM } = ctx; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log(String(extra).split("\n").map(l=>"      "+l).join("\n")); } else console.log("ok  ", msg); };
const cfg = cmds => e => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); };
const out = r => typeof r.out === "string" ? r.out : (r.out && ((r.out.text||"") + (r.out.ask||""))) || r.msg || "";
const cli = (B, id, c) => out(Bench.act(B, ["cli", id, c]));
const pc = (B, id, c) => out(Bench.act(B, ["pc", id, c]));
const log = B => B.log.join("\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
const conf = (B, id, cmds) => { cli(B, id, "conf t"); const o = cmds.map(c=>cli(B, id, c)); cli(B, id, "end"); return o.join("\n"); };
const ios = o => { const e = SIM.ios2Env(o); e.exec("en"); return e; };
const WARN = "%Warning: portfast should only be enabled on ports connected to a single\n host. Connecting hubs, concentrators, switches, bridges, etc... to this\n interface  when portfast is enabled, can cause temporary bridging loops.\n Use with CAUTION";
const stpRow = (txt, port) => (txt.split("\n").find(l=>l.startsWith(port + " ")) || "");

// ---------- (a) spanning-tree portfast edge trunk / portfast trunk ----------
{ const B = Bench.create({ devices: [
    { id:"sw1", kind:"switch", label:"SW1", x:0, y:0, config: cfg(["hostname SW1", "int g0/1", "switchport mode trunk", "int g0/2", "switchport mode trunk", "int g0/4", "switchport mode trunk", "int g0/5", "switchport mode trunk"]) },
    { id:"sw2", kind:"switch", label:"SW2", x:500, y:0, config: cfg(["hostname SW2", "int g0/5", "switchport mode trunk"]) },
    { id:"s1", kind:"server", label:"HV1", x:0, y:200, ip:"10.0.0.11", mask:"255.255.255.0" },
    { id:"s2", kind:"server", label:"HV2", x:120, y:200, ip:"10.0.0.12", mask:"255.255.255.0" },
    { id:"p3", kind:"pc", label:"PC3", x:240, y:200, ip:"10.0.0.13", mask:"255.255.255.0" },
    { id:"s4", kind:"server", label:"HV4", x:360, y:200, ip:"10.0.0.14", mask:"255.255.255.0" } ],
  cables: [{type:"cat6",a:"s1:eth",b:"sw1:g1"},{type:"cat6",a:"s2:eth",b:"sw1:g2"},{type:"cat6",a:"p3:eth",b:"sw1:g3"},{type:"cat6",a:"s4:eth",b:"sw1:g4"},{type:"cat6",a:"sw1:g5",b:"sw2:g5"}] });
  cli(B, "sw1", "conf t"); cli(B, "sw1", "int g0/1");
  const w1 = cli(B, "sw1", "spanning-tree portfast edge trunk");
  ok(w1===WARN, "portfast edge trunk is accepted with the PortFast warning", w1);
  cli(B, "sw1", "int g0/2"); const w2 = cli(B, "sw1", "span portf tr");
  ok(w2===WARN && B.devs.sw1.env.intfs["GigabitEthernet0/2"].stp.portfast==="trunk", "the older portfast trunk (abbreviated) is accepted and stored as a trunk PortFast", w2);
  cli(B, "sw1", "int g0/3"); const w3 = cli(B, "sw1", "spanning-tree portfast");
  ok(w3===WARN, "plain portfast on an access port: the warning only (unchanged)", w3);
  cli(B, "sw1", "int g0/4"); const w4 = cli(B, "sw1", "spanning-tree portfast");
  ok(w4.startsWith(WARN) && /\n\n%Portfast has been configured on GigabitEthernet0\/4 but will only\n have effect when the interface is in a non-trunking mode\.$/.test(w4), "plain portfast on a trunk port adds the non-trunking-mode note", w4);
  cli(B, "sw1", "end");
  const rc = cli(B, "sw1", "show running-config");
  ok(/interface GigabitEthernet0\/1\n switchport mode trunk\n spanning-tree portfast edge trunk\n/.test(rc), "running-config: spanning-tree portfast edge trunk", rc);
  ok(/interface GigabitEthernet0\/2\n switchport mode trunk\n spanning-tree portfast edge trunk\n/.test(rc) && !/ spanning-tree portfast trunk\n/.test(rc), "running-config: the older portfast trunk is saved as spanning-tree portfast edge trunk (IOS 15.2(4)E+)", rc);
  ok(/interface GigabitEthernet0\/3\n spanning-tree portfast\n/.test(rc) && /interface GigabitEthernet0\/4\n switchport mode trunk\n spanning-tree portfast\n/.test(rc), "running-config: plain portfast unchanged");
  const s = cli(B, "sw1", "show spanning-tree vlan 1");
  ok(/P2p Edge$/.test(stpRow(s, "Gi0/1")) && /P2p Edge$/.test(stpRow(s, "Gi0/2")), "show spanning-tree: the PortFast trunks to the hosts are P2p Edge", s);
  ok(/P2p Edge$/.test(stpRow(s, "Gi0/3")), "an access PortFast port is P2p Edge");
  ok(/ P2p$/.test(stpRow(s, "Gi0/4")), "plain portfast on a trunk is not operational: P2p");
  conf(B, "sw1", ["int g0/5", "spanning-tree portfast edge trunk"]);
  ok(/ P2p$/.test(stpRow(cli(B, "sw1", "show spanning-tree vlan 1"), "Gi0/5")), "a PortFast trunk that hears BPDUs (another switch) loses edge status: P2p");
  conf(B, "sw1", ["int g0/5", "no spanning-tree portfast edge trunk"]);
  ok(!B.devs.sw1.env.intfs["GigabitEthernet0/5"].stp.portfast && !/interface GigabitEthernet0\/5\n switchport mode trunk\n spanning-tree portfast/.test(cli(B, "sw1", "show running-config")), "no spanning-tree portfast edge trunk removes it");
  // BPDU guard by default applies to operational PortFast ports only
  conf(B, "sw1", ["spanning-tree portfast bpduguard default", "int g0/5", "spanning-tree portfast"]);
  ok(!Bench.errdis(B, "sw1", "g5"), "portfast bpduguard default + plain portfast on a trunk to a switch: not err-disabled (PortFast isn't operational on a trunk)");
  conf(B, "sw1", ["int g0/5", "spanning-tree portfast trunk"]);
  ok(Bench.errdis(B, "sw1", "g5"), "… with portfast trunk it is operational, so the BPDU from SW2 err-disables the port");
  conf(B, "sw1", ["int g0/1", "no spanning-tree portfast trunk"]);
  ok(/ P2p$/.test(stpRow(cli(B, "sw1", "show spanning-tree vlan 1"), "Gi0/1")), "no spanning-tree portfast trunk also removes the edge trunk form");
  const e = ios({kind:"switch"}); e.exec("conf t"); e.exec("int g0/1"); e.exec("switchport mode trunk"); e.exec("spanning-tree portfast edge trunk"); e.exec("end");
  ok(/P2p Edge$/.test(stpRow(e.exec("show spanning-tree vlan 1"), "Gi0/1")), "standalone switch: a portfast edge trunk port is P2p Edge");
}

// ---------- (b) Windows ping: timeout vs Destination host unreachable ----------
{ const mk = () => Bench.create({ devices: [
    { id:"sw1", kind:"switch", label:"SW1", x:0, y:0, config: cfg(["hostname SW1", "int vlan 1", "ip address 10.1.0.2 255.255.255.0", "no shut"]) },
    { id:"r1", kind:"router", label:"R1", x:300, y:0, config: cfg(["hostname R1", "int g0/0", "ip address 10.1.0.1 255.255.255.0", "no shut", "int g0/1", "ip address 10.2.0.1 255.255.255.0", "no shut"]) },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:200, ip:"10.1.0.10", mask:"255.255.255.0", gw:"10.1.0.1" },
    { id:"p3", kind:"pc", label:"PC3", x:150, y:200, ip:"10.1.0.11", mask:"255.255.255.0", gw:"10.1.0.1" },
    { id:"p4", kind:"pc", label:"PC4", x:200, y:200, ip:"10.1.0.12", mask:"255.255.255.0", gw:"10.1.0.254" },
    { id:"p2", kind:"pc", label:"PC2", x:300, y:200, ip:"10.2.0.10", mask:"255.255.255.0", gw:"10.2.0.1" } ],
  cables: [{type:"cat6",a:"p1:eth",b:"sw1:g1"},{type:"cat6",a:"r1:g0",b:"sw1:g2"},{type:"cat6",a:"p3:eth",b:"sw1:g3"},{type:"cat6",a:"p4:eth",b:"sw1:g4"},{type:"cat6",a:"p2:eth",b:"r1:g1"}] });
  const B = mk();
  ok(/Reply from 10\.1\.0\.1: bytes=32/.test(pc(B, "p1", "ping 10.1.0.1")) && Bench.arpHas(B, "p1", "10.1.0.1"), "PC1 pings its gateway (ARP now cached)");
  conf(B, "r1", ["int g0/0", "shutdown"]);
  const t1 = pc(B, "p1", "ping 10.1.0.1");
  ok((t1.match(/^Request timed out\.$/mg)||[]).length===4 && /Received = 0, Lost = 4 \(100% loss\)/.test(t1) && !/unreachable/.test(t1), "gateway's port shut, ARP cached: 4 × Request timed out., Lost = 4", t1);
  ok(/already knew the MAC for 10\.1\.0\.1 \(ARP worked\)/.test(log(B)), "frame log explains why it is a timeout", log(B));
  const t1b = pc(B, "p1", "tracert 10.1.0.1");
  ok(!/reports: Destination host unreachable/.test(t1b) && /Request timed out/.test(t1b), "tracert with a cached ARP entry: timeouts, not 'reports: Destination host unreachable'", t1b);
  const t2 = pc(B, "p1", "ping 10.1.0.99");
  ok((t2.match(/^Reply from 10\.1\.0\.10: Destination host unreachable\.$/mg)||[]).length===4 && /Received = 4, Lost = 0/.test(t2), "a same-subnet address nobody has: ARP fails → Reply from <own IP>: Destination host unreachable.", t2);
  const t2b = pc(B, "p4", "ping 10.2.0.10");
  ok(/^Reply from 10\.1\.0\.12: Destination host unreachable\.$/m.test(t2b), "a wrong (absent) default gateway: ARP for it fails → Destination host unreachable from the PC itself", t2b);
  ok(/reports: Destination host unreachable/.test(pc(B, "p4", "tracert 10.2.0.10")), "… and tracert: '<own IP> reports: Destination host unreachable.'");
  conf(B, "r1", ["int g0/0", "no shutdown"]);
  const t3 = pc(B, "p1", "ping 172.16.9.9");
  ok((t3.match(/^Reply from 10\.1\.0\.1: Destination host unreachable\.$/mg)||[]).length===4, "the router has no route: Reply from <router>: Destination host unreachable. (unchanged)", t3);
  ok(/Reply from 10\.1\.0\.11: bytes=32/.test(pc(B, "p1", "ping 10.1.0.11")), "PC1 pings PC3 (ARP cached)");
  Bench.act(B, ["power", "p3", false]);
  const t4 = pc(B, "p1", "ping 10.1.0.11");
  ok((t4.match(/^Request timed out\.$/mg)||[]).length===4, "PC3 powered off after a successful ping: Request timed out.", t4);
  ok(/Reply from 10\.2\.0\.10: bytes=32/.test(pc(B, "p1", "ping 10.2.0.10")), "routed ping still works");
  // moving the PC (cable unplugged → Windows flushes its ARP cache) to a port in another VLAN: ARP fails → unreachable from its own IP
  conf(B, "sw1", ["vlan 30", "int g0/6", "switchport mode access", "switchport access vlan 30"]);
  Bench.act(B, ["unplug", "p1:eth"]);
  ok(!Bench.arpHas(B, "p1", "10.1.0.1"), "unplugging the PC's cable empties its ARP cache");
  Bench.act(B, ["plug", "cat6", "p1:eth", "sw1:g6"]);
  const t5 = pc(B, "p1", "ping 10.1.0.1");
  ok((t5.match(/^Reply from 10\.1\.0\.10: Destination host unreachable\.$/mg)||[]).length===4, "PC moved to a VLAN 30 port: it ARPs again, nobody answers → Reply from 10.1.0.10: Destination host unreachable.", t5);
  Bench.act(B, ["unplug", "p1:eth"]); Bench.act(B, ["plug", "cat6", "p1:eth", "sw1:g1"]);
  ok(/Reply from 10\.1\.0\.1: bytes=32/.test(pc(B, "p1", "ping 10.1.0.1")), "back on its own port: works again");
  Bench.act(B, ["power", "p3", true]); ok(!Bench.arpHas(B, "p3", "10.1.0.10") && /Reply from 10\.1\.0\.1: bytes=32/.test(pc(B, "p3", "ping 10.1.0.1")), "a powered-off PC comes back with an empty ARP cache and ARPs again");
  // B.pinged from IOS pings
  ok(/!!!!!|\.!!!!/.test(cli(B, "r1", "ping 10.1.0.10")) && Bench.pinged(B, "r1", "10.1.0.10"), "a router's IOS ping sets Bench.pinged(B, r, ip)");
  ok(/!!!!!|\.!!!!/.test(cli(B, "sw1", "ping 10.1.0.10")) && Bench.pinged(B, "sw1", "10.1.0.10"), "a Layer 2 switch's SVI ping sets Bench.pinged too");
  ok(!/!/.test(cli(B, "sw1", "ping 10.1.0.77").split("\n")[2]) && B.pinged["sw1>10.1.0.77"]===false && !Bench.pinged(B, "sw1", "10.1.0.77"), "… a failed one is recorded as false");
  // (c) MAC table VLAN column
  const mt = cli(B, "sw1", "show mac address-table");
  ok(/^Vlan    Mac Address       Type        Ports$/m.test(mt) && /^ All    0100\.0ccc\.cccc    STATIC      CPU$/m.test(mt) && /^   1    [0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}    DYNAMIC     Gi0\/1$/m.test(mt), "show mac address-table: VLAN right-aligned in 4 ('   1    …')", mt);
}

// ---------- (c, d, f) L3 switch with VLAN 10: MAC table, standby brief Vl10, passive-interface vlan 10 ----------
{ const B = Bench.create({ devices: [
    { id:"d1", kind:"switch", label:"DSW1", x:0, y:0, config: cfg(["hostname DSW1", "ip routing", "vlan 10", "int g0/1", "switchport mode access", "switchport access vlan 10", "int vlan 10", "ip address 10.10.0.2 255.255.255.0", "standby 1 ip 10.10.0.1", "standby 1 priority 110", "standby 1 preempt", "no shut", "router ospf 1", "network 10.10.0.0 0.0.0.255 area 0"]) },
    { id:"r1", kind:"router", label:"R1", x:300, y:0, config: cfg(["hostname R1", "int g0/0", "no shut", "int g0/0.20", "encapsulation dot1Q 20", "ip address 10.20.0.2 255.255.255.0", "standby 2 ip 10.20.0.1", "int g0/1", "ip address 10.30.0.1 255.255.255.0", "no shut", "router ospf 1", "network 10.0.0.0 0.255.255.255 area 0"]) },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:200, ip:"10.10.0.10", mask:"255.255.255.0", gw:"10.10.0.1" } ],
  cables: [{type:"cat6",a:"p1:eth",b:"d1:g1"},{type:"cat6",a:"r1:g0",b:"d1:g2"}] });
  conf(B, "d1", ["vlan 20", "int g0/2", "switchport mode trunk"]);
  ok(/Reply from 10\.10\.0\.1: bytes=32/.test(pc(B, "p1", "ping 10.10.0.1")), "PC1 pings the HSRP virtual IP");
  const mt = cli(B, "d1", "show mac address-table");
  ok(/^  10    [0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}    DYNAMIC     Gi0\/1$/m.test(mt), "show mac address-table: '  10    …    DYNAMIC     Gi0/1'", mt);
  ok(/^  10    /m.test(cli(B, "d1", "show mac address-table vlan 10")) && /^  10    /m.test(cli(B, "d1", "show mac address-table dynamic")), "same column in the filtered forms");
  const sb = cli(B, "d1", "show standby brief");
  ok(/^Vl10        1    110 P Active  local           unknown         10\.10\.0\.1$/m.test(sb) && !/Vlan10/.test(sb), "show standby brief: Vl10 (short name like IOS)", sb);
  const sb2 = cli(B, "r1", "show standby brief");
  ok(/^Gi0\/0\.20    2    100   Active/m.test(sb2), "show standby brief on a subinterface: Gi0/0.20", sb2);
  const sd = cli(B, "d1", "show standby");
  ok(/^GigabitEthernet0\/0\.20 - Group 2$/m.test(cli(B, "r1", "show standby")) && /^Vlan10 - Group 1$/m.test(sd) && /Group name is "hsrp-Vl10-1" \(default\)/.test(sd), "show standby (detail) keeps the full name; the default group name uses the short one (hsrp-Vl10-1)", sd);
  const ob = cli(B, "d1", "show ip ospf interface brief");
  ok(/^Vl10 +1 +0 +10\.10\.0\.2\/24/m.test(ob) && !/Vlan10/.test(ob), "show ip ospf interface brief: Vl10 (short name like the other rows)", ob);
  // (f) passive-interface with a space
  cli(B, "d1", "conf t"); cli(B, "d1", "router ospf 1"); const p0 = cli(B, "d1", "passive-interface vlan 10"); cli(B, "d1", "end");
  ok(p0==="" &&/ passive-interface Vlan10\n/.test(cli(B, "d1", "show running-config")), "passive-interface vlan 10 (with a space) is accepted and stored as Vlan10", p0);
  ok(/No Hellos \(Passive interface\)/.test(cli(B, "d1", "show ip ospf interface vlan 10")), "Vlan10 really is passive");
  conf(B, "d1", ["router ospf 1", "no passive-interface vlan 10"]);
  ok(!/passive-interface Vlan10/.test(cli(B, "d1", "show running-config")), "no passive-interface vlan 10 removes it");
  conf(B, "r1", ["router ospf 1", "passive gi 0/1"]);
  ok(/ passive-interface GigabitEthernet0\/1\n/.test(cli(B, "r1", "show running-config")), "passive gi 0/1 (abbreviated, with a space) on a router");
  conf(B, "r1", ["router ospf 1", "passive-interface default"]);
  ok(/ passive-interface default\n/.test(cli(B, "r1", "show running-config")), "passive-interface default still works");
  const e = ios({kind:"router"}); e.exec("conf t"); e.exec("router ospf 1");
  ok(/Invalid input/.test(e.exec("passive-interface loopback 0")) && /Invalid input/.test(e.exec("passive-interface status 1")), "passive-interface for a missing interface / a non-interface word is refused");
}

// ---------- (e) show cdp neighbors: long Device IDs ----------
{ const B = Bench.create({ devices: [
    { id:"sw1", kind:"switch", label:"SW1", x:0, y:0, config: cfg(["hostname SW1"]) },
    { id:"r1", kind:"router", label:"R1", x:300, y:0, config: cfg(["hostname BRANCH-EDGE-RTR-01", "int g0/0", "no shut"]) },
    { id:"r2", kind:"router", label:"R2", x:300, y:200, config: cfg(["hostname ABCDEFGHIJKLMNOP", "int g0/0", "no shut"]) },
    { id:"r3", kind:"router", label:"R3", x:500, y:200, config: cfg(["hostname R3", "ip domain name lab.example.com", "int g0/0", "no shut"]) },
    { id:"r4", kind:"router", label:"R4", x:600, y:200, config: cfg(["hostname R4", "int g0/0", "no shut"]) } ],
  cables: [{type:"cat6",a:"r1:g0",b:"sw1:g2"},{type:"cat6",a:"r2:g0",b:"sw1:g3"},{type:"cat6",a:"r3:g0",b:"sw1:g4"},{type:"cat6",a:"r4:g0",b:"sw1:g5"}] });
  const c = cli(B, "sw1", "show cdp neighbors"), L = c.split("\n");
  const i1 = L.indexOf("BRANCH-EDGE-RTR-01");
  ok(i1>0 && /^ {17}Gi0\/2             151        R I         C1111-4P  Gi0\/0$/.test(L[i1+1]), "an 18-character Device ID gets its own line; the row continues below, indented 17", c);
  ok(L.some(l=>/^ABCDEFGHIJKLMNOP Gi0\/3/.test(l)), "exactly 16 characters still fits on the row");
  const i3 = L.indexOf("R3.lab.example.com");
  ok(i3>0 && /^ {17}Gi0\/4 /.test(L[i3+1]), "hostname + domain (18 characters) wraps too");
  ok(L.some(l=>/^R4 {15}Gi0\/5 /.test(l)) && /Total cdp entries displayed : 4$/.test(c), "short IDs unchanged; total 4");
}

// ---------- (g) show spanning-tree vlan N: VLAN with / without an up port ----------
{ const e = ios({kind:"switch"}); e.exec("conf t"); e.exec("vlan 10"); e.exec("end");
  ok(e.exec("show spanning-tree vlan 10")==="Spanning tree instance(s) for vlan 10 does not exist.", "standalone: VLAN 10 exists but has no port → does not exist");
  ok(e.exec("show spanning-tree vlan 99")==="Spanning tree instance(s) for vlan 99 does not exist.", "a VLAN that doesn't exist → the same message (IOS)");
  const s1 = e.exec("show spanning-tree vlan 1");
  ok(/^VLAN0001\n  Spanning tree enabled protocol rstp\n  Root ID    Priority    32769\n             Address     00aa\.bb00\.0000\n             This bridge is the root/.test(s1) && /^Gi0\/1               Desg FWD 4         128\.1    P2p$/m.test(s1) && /^Gi0\/10              Desg FWD 4         128\.10   P2p$/m.test(s1), "standalone: VLAN 1 (every port counts as cabled, like show interfaces status) → this bridge is the root, Desg FWD", s1);
  e.exec("conf t"); e.exec("int g0/3"); e.exec("switchport access vlan 10"); e.exec("spanning-tree portfast"); e.exec("end");
  const s10 = e.exec("show spanning-tree vlan 10");
  ok(/^VLAN0010/.test(s10) && /Priority    32778/.test(s10) && /^Gi0\/3               Desg FWD 4         128\.3    P2p Edge$/m.test(s10) && !/^Gi0\/1 /m.test(s10), "a port in VLAN 10 → the instance appears with just that port (PortFast = P2p Edge)", s10);
  ok(!/^Gi0\/3 /m.test(e.exec("show spanning-tree vlan 1")), "… and it left VLAN 1");
  ok(/Root bridge for: VLAN0001, VLAN0010/.test(e.exec("show spanning-tree summary")), "show spanning-tree summary agrees (root for VLAN0001, VLAN0010)");
  e.exec("conf t"); e.exec("spanning-tree vlan 10 priority 4096"); e.exec("int g0/3"); e.exec("shutdown"); e.exec("end");
  ok(e.exec("show spanning-tree vlan 10")==="Spanning tree instance(s) for vlan 10 does not exist.", "its only port shut → does not exist again");
  e.exec("conf t"); e.exec("int g0/3"); e.exec("no shutdown"); e.exec("end");
  ok(/Priority    4106/.test(e.exec("show spanning-tree vlan 10")), "the configured priority + sys-id-ext");
  e.exec("conf t"); e.exec("no spanning-tree vlan 10"); e.exec("end");
  ok(e.exec("show spanning-tree vlan 10")==="Spanning tree instance(s) for vlan 10 does not exist.", "no spanning-tree vlan 10 → does not exist");
  // on a bench: the real cables decide
  const B = Bench.create({ devices: [ { id:"sw1", kind:"switch", label:"SW1", x:0, y:0, config: cfg(["hostname SW1", "vlan 20", "int g0/4", "switchport mode access", "switchport access vlan 20"]) },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:200, ip:"10.0.0.10", mask:"255.255.255.0" } ], cables: [] });
  ok(cli(B, "sw1", "show spanning-tree vlan 20")==="Spanning tree instance(s) for vlan 20 does not exist." && cli(B, "sw1", "show spanning-tree")==="No spanning tree instance exists.", "bench, nothing cabled: VLAN 20 does not exist; show spanning-tree → No spanning tree instance exists.");
  Bench.act(B, ["plug", "cat6", "p1:eth", "sw1:g4"]);
  const sb = cli(B, "sw1", "show spanning-tree vlan 20");
  ok(/^VLAN0020/.test(sb) && /^Gi0\/4 +Desg FWD/m.test(sb), "bench: a PC cabled to an access port in VLAN 20 → the instance exists", sb);
}

// ---------- (h) show ip route … in user EXEC ----------
{ const e = SIM.ios2Env({kind:"router", host:"R1"}); e.exec("en"); e.exec("conf t");
  for (const c of ["vrf definition CUST", "address-family ipv4", "exit", "int g0/0", "ip address 10.1.0.1 255.255.255.0", "no shut", "int g0/1", "vrf forwarding CUST", "ip address 10.9.0.1 255.255.255.0", "no shut", "exit", "ip route 0.0.0.0 0.0.0.0 10.1.0.254", "router ospf 1", "network 10.1.0.0 0.0.0.255 area 0", "end"]) e.exec(c);
  e.exec("disable");
  ok(e.prompt()==="R1>", "user EXEC prompt");
  const r = e.exec("show ip route");
  ok(/^Codes: L - local, C - connected, S - static/.test(r) && /^C        10\.1\.0\.0\/24 is directly connected, GigabitEthernet0\/0$/m.test(r) && /^S\* +0\.0\.0\.0\/0 \[1\/0\] via 10\.1\.0\.254$/m.test(r), "show ip route works at R1>", r);
  ok(/directly connected/.test(e.exec("sh ip ro conn")) && /0\.0\.0\.0\/0/.test(e.exec("show ip route static")), "show ip route connected / static (abbreviated too)");
  ok(!/Invalid input/.test(e.exec("show ip route ospf")), "show ip route ospf");
  ok(/Routing entry for 10\.1\.0\.0\/24/.test(e.exec("show ip route 10.1.0.5")), "show ip route <ip>");
  ok(/Routing Table: CUST/.test(e.exec("show ip route vrf CUST")) && /10\.9\.0\.0\/24 is directly connected/.test(e.exec("show ip route vrf CUST connected")), "show ip route vrf CUST [connected]");
  ok(/% IP routing table NOPE does not exist/.test(e.exec("show ip route vrf NOPE")), "unknown VRF at > too");
  ok(/Invalid input detected/.test(e.exec("show running-config")) && e.prompt()==="R1>", "show running-config is still privileged");
}

// ---------- (i) HSRP takeover logged before the OSPF neighbour-down ----------
{ const R = (id, ip, prio, x) => ({ id, kind:"router", label:id.toUpperCase(), x, y:0, config: cfg([`hostname ${id.toUpperCase()}`, "int g0/0", `ip address ${ip} 255.255.255.0`, "standby 1 ip 10.1.0.1", `standby 1 priority ${prio}`, "standby 1 preempt", "no shut", "router ospf 1", "network 10.1.0.0 0.0.0.255 area 0"]) });
  const B = Bench.create({ devices: [ R("r1", "10.1.0.2", 110, 0), R("r2", "10.1.0.3", 100, 300), { id:"sw1", kind:"switch", label:"SW1", x:150, y:200 } ],
    cables: [{type:"cat6",a:"r1:g0",b:"sw1:g1"},{type:"cat6",a:"r2:g0",b:"sw1:g2"}] });
  ok(Bench.hsrpState(B, "r1", "GigabitEthernet0/0", 1)==="Active" && Bench.ospfNbrCount(B, "r2")===1, "R1 active, OSPF neighbours");
  Bench.act(B, ["power", "r1", false]);
  ok(Bench.hsrpState(B, "r2", "GigabitEthernet0/0", 1)==="Active", "R1 powered off: R2 takes over");
  const L = cli(B, "r2", "show logging").split("\n");
  const ih = L.findIndex(l=>/%HSRP-5-STATECHANGE: GigabitEthernet0\/0 Grp 1 state Standby -> Active/.test(l)), io = L.findIndex(l=>/%OSPF-5-ADJCHG: Process 1, Nbr \S+ on GigabitEthernet0\/0 from FULL to DOWN/.test(l));
  ok(ih>=0 && io>=0 && ih < io, "R2's log: HSRP Standby -> Active comes before the OSPF FULL to DOWN (hold 10 s < dead 40 s)", L.join("\n"));
}

// ---------- (f) other interface arguments with a space (already handled by the shared joiner / their parsers) ----------
{ const r = ios({kind:"router"}), bad = [];
  for (const c of ["conf t", "int gi 0/0", "ip address 10.1.0.1 255.255.255.0", "no shut", "exit", "int loopback 0", "ip address 1.1.1.1 255.255.255.255", "exit", "ip route 0.0.0.0 0.0.0.0 gi 0/0", "access-list 1 permit 10.0.0.0 0.255.255.255", "ip nat inside source list 1 interface gi 0/0 overload", "int tunnel 0", "tunnel source gi 0/0", "end", "show ip interface gi 0/0", "show interfaces gi 0/0", "show running-config interface gi 0/0", "ping 10.1.0.5 source loopback 0"]){
    const o = r.exec(c), t = typeof o==="string" ? o : (o && o.text) || ""; if (/Invalid|Incomplete|Ambiguous/.test(t)) bad.push(c); }
  const rc = r.exec("show running-config");
  ok(!bad.length && /ip route 0\.0\.0\.0 0\.0\.0\.0 GigabitEthernet0\/0/.test(rc) && /ip nat inside source list 1 interface GigabitEthernet0\/0 overload/.test(rc) && /tunnel source GigabitEthernet0\/0/.test(rc), "gi 0/0, loopback 0, tunnel 0 with a space: interface, ip route, ip nat, tunnel source, show, ping source", bad.join("\n"));
  const s = ios({kind:"switch"}), bad2 = [];
  for (const c of ["conf t", "vlan 10", "int gi 0/1", "switchport access vlan 10", "end", "show ip interface vlan 1", "show mac address-table interface gi 0/1", "show port-security interface gi 0/1", "show interfaces gi 0/1 switchport"]){
    const o = s.exec(c), t = typeof o==="string" ? o : (o && o.text) || ""; if (/Invalid|Incomplete|Ambiguous/.test(t)) bad2.push(c); }
  ok(!bad2.length, "switch: show … interface gi 0/1 / vlan 1 forms", bad2.join("\n"));
}

// ---------- (k) standalone ping honours the table / VRF ----------
{ const e = ios({kind:"router", host:"R1"}); e.exec("conf t");
  for (const c of ["vrf definition CUST", "address-family ipv4", "exit", "int g0/0", "ip address 10.1.0.1 255.255.255.0", "no shut", "int g0/1", "vrf forwarding CUST", "ip address 10.9.0.1 255.255.255.0", "no shut", "int g0/2", "ip address 10.5.0.1 255.255.255.0", "exit", "ip route 172.16.0.0 255.255.0.0 10.1.0.254", "end"]) e.exec(c);
  const P = ip => e.exec("ping " + ip);
  ok(/!!!!!/.test(P("10.1.0.1")) && /!!!!!/.test(P("10.1.0.50")), "standalone: own address and a host on a connected subnet answer");
  ok(/\.\.\.\.\./.test(P("10.1.0.255")) && /\.\.\.\.\./.test(P("10.1.0.0")), "… not the broadcast / subnet address (unchanged)");
  ok(/\.\.\.\.\./.test(P("10.9.0.1")) && /\.\.\.\.\./.test(P("10.9.0.20")), "a plain ping to a VRF-only address (own or connected) fails — the global table doesn't have it");
  ok(/!!!!!/.test(e.exec("ping vrf CUST 10.9.0.20")) && /!!!!!/.test(e.exec("ping vrf CUST 10.9.0.1")) && /\.\.\.\.\./.test(e.exec("ping vrf CUST 10.1.0.50")), "ping vrf CUST: the VRF's table only");
  ok(/\.\.\.\.\./.test(P("10.5.0.9")) && /\.\.\.\.\./.test(P("10.5.0.1")), "a shut interface's subnet and address don't answer");
  ok(/\.\.\.\.\./.test(P("172.16.1.1")) && /\.\.\.\.\./.test(P("8.8.8.8")), "beyond a next hop (route or not) nothing is cabled: .....");
  const s = ios({kind:"switch"}); s.exec("conf t"); s.exec("int vlan 1"); s.exec("ip address 10.0.0.2 255.255.255.0"); s.exec("no shut"); s.exec("end");
  ok(/!!!!!/.test(s.exec("ping 10.0.0.9")), "standalone switch SVI: a host on its subnet answers");
}

// ---------- (l) Bench.pingedNow: a ping from before the fix doesn't count ----------
{ const B = Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["hostname R1", "int g0/0", "ip address 10.1.0.1 255.255.255.0", "no shut", "int g0/1", "ip address 10.2.0.1 255.255.255.0", "no shut"]) },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:200, ip:"10.1.0.10", mask:"255.255.255.0", gw:"10.1.0.1" },
    { id:"p2", kind:"pc", label:"PC2", x:300, y:200, ip:"10.2.0.10", mask:"255.255.255.0", gw:"10.2.0.1" } ],
  cables: [{type:"cat6",a:"p1:eth",b:"r1:g0"},{type:"cat6",a:"p2:eth",b:"r1:g1"}] });
  pc(B, "p1", "ping 10.2.0.10");
  ok(Bench.pinged(B, "p1", "10.2.0.10") && Bench.pingedNow(B, "p1", "10.2.0.10"), "a successful ping: pinged and pingedNow");
  cli(B, "r1", "show ip interface brief");
  ok(Bench.pingedNow(B, "p1", "10.2.0.10"), "a show command changes nothing: still pingedNow");
  conf(B, "r1", ["int g0/1", "description to PC2"]);
  ok(Bench.pinged(B, "p1", "10.2.0.10") && !Bench.pingedNow(B, "p1", "10.2.0.10"), "after any change: pinged still true (unchanged), pingedNow false until the next ping");
  pc(B, "p1", "ping 10.2.0.10"); ok(Bench.pingedNow(B, "p1", "10.2.0.10"), "ping again → pingedNow");
  Bench.act(B, ["unplug", "p2:eth"]); ok(!Bench.pingedNow(B, "p1", "10.2.0.10"), "a cable change also resets it");
  Bench.act(B, ["plug", "cat6", "p2:eth", "r1:g1"]); pc(B, "p1", "ping 10.2.0.10");
  cli(B, "r1", "ping 10.2.0.10"); ok(Bench.pingedNow(B, "r1", "10.2.0.10") && Bench.pingedNow(B, "p1", "10.2.0.10"), "router pings too (global table)");
  pc(B, "p1", "tracert 10.2.0.10"); ok(Bench.pingedNow(B, "p1", "10.2.0.10"), "a successful tracert counts like a ping (as Bench.pinged)");
  conf(B, "r1", ["int g0/1", "shutdown"]); pc(B, "p1", "ping 10.2.0.10");
  ok(!Bench.pinged(B, "p1", "10.2.0.10") && !Bench.pingedNow(B, "p1", "10.2.0.10"), "a failed latest ping: both false");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
