#!/usr/bin/env node
// Ladder Lab — VRF-Lite in the full engine (Module 10+): vrf definition / ip vrf, vrf forwarding (removes the address), overlapping
// subnets in different VRFs, per-VRF connected/static/OSPF tables, ping/traceroute vrf, per-VRF ARP, subinterfaces and SVIs in VRFs,
// show vrf / show ip vrf / show ip route vrf, running-config order, save + reload.
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
const PC = (id, ip, gw, x) => ({ id, kind:"pc", label:id.toUpperCase(), x:x||0, y:300, ip, mask:"255.255.255.0", gw });

// ---------- 1. the CLI on its own: modes, the address-removal message, refusals ----------
{ const e = SIM.ios2Env({kind:"router", host:"PE1"}), x = c => { const r = e.exec(c); return typeof r==="string" ? r : (r.text||"") + (r.ask||""); };
  x("en"); x("conf t"); x("int g0/0"); x("ip address 10.1.1.1 255.255.255.0"); x("exit");
  x("vrf definition CUST_A"); ok(e.prompt()==="PE1(config-vrf)#", "vrf definition → (config-vrf)#", e.prompt());
  x("address-family ipv4"); ok(e.prompt()==="PE1(config-vrf-af)#", "address-family ipv4 → (config-vrf-af)#", e.prompt());
  x("exit-address-family"); ok(e.prompt()==="PE1(config-vrf)#", "exit-address-family → back to (config-vrf)#");
  x("exit"); ok(e.prompt()==="PE1(config)#", "exit → global config");
  x("int g0/0"); const m = x("vrf forwarding CUST_A");
  ok(m==="% Interface GigabitEthernet0/0 IPv4 disabled and address(es) removed due to enabling VRF CUST_A" && e.intfs["GigabitEthernet0/0"].ip===null && e.intfs["GigabitEthernet0/0"].vrf==="CUST_A", "vrf forwarding removes the IPv4 address and says so", m);
  ok(x("vrf forwarding CUST_A")==="", "the same VRF again: nothing to remove, no message");
  ok(x("vrf forwarding NOPE")==="% VRF NOPE not configured.", "an undefined VRF is refused");
  x("ip address 10.1.1.1 255.255.255.0"); const m2 = x("no vrf forwarding");
  ok(m2==="% Interface GigabitEthernet0/0 IPv4 disabled and address(es) removed due to disabling VRF CUST_A" && !e.intfs["GigabitEthernet0/0"].vrf && !e.intfs["GigabitEthernet0/0"].ip, "no vrf forwarding: back to the global table, address removed again", m2);
  x("exit"); x("vrf definition NOAF"); x("exit"); x("int g0/1"); x("vrf forwarding NOAF");
  ok(/no IPv4 address family/.test(x("ip address 10.5.5.1 255.255.255.0")) && !e.intfs["GigabitEthernet0/1"].ip, "a vrf definition without address-family ipv4 can't take an IPv4 address");
  x("exit"); x("ip vrf LEGACY"); ok(e.prompt()==="PE1(config-vrf)#" && x("rd 65000:7")==="", "ip vrf NAME (single-protocol form) + rd");
  ok(/% Invalid input/.test(x("address-family ipv4")), "ip vrf has no address-family sub-mode"); x("exit");
  x("int g0/2"); ok(x("ip vrf forwarding LEGACY")==="" && e.intfs["GigabitEthernet0/2"].vrf==="LEGACY", "ip vrf forwarding joins an ip vrf");
  ok(/IP routing table NOPE does not exist/.test(x("ip route vrf NOPE 0.0.0.0 0.0.0.0 1.1.1.1")), "ip route vrf for a VRF that doesn't exist is refused");
  x("end"); ok(/^ {2}Name {29}Default RD {12}Protocols {3}Interfaces\n {2}CUST_A {27}<not set> {13}ipv4\n {2}LEGACY {27}65000:7 {15}ipv4 {8}Gi0\/2\n {2}NOAF {29}<not set> {13} {12}Gi0\/1$/.test(x("show vrf")), "show vrf: Name / Default RD / Protocols / Interfaces", x("show vrf"));
  ok(/^ {2}Name {29}Default RD {12}Interfaces\n {2}CUST_A {27}<not set>\n {2}LEGACY {27}65000:7 {15}Gi0\/2$/.test(x("show ip vrf")), "show ip vrf: no Protocols column, IPv4 VRFs only", x("show ip vrf"));
  ok(x("show ip route vrf NOPE")==="% IP routing table NOPE does not exist", "show ip route vrf for an unknown VRF");
  ok(x("ping vrf NOPE 10.1.1.10")==="% Unrecognized host or address, or protocol not running.", "ping vrf for an unknown VRF");
  x("conf t"); ok(x("no vrf definition NOAF")==="" && !e.vrfs.NOAF && !e.intfs["GigabitEthernet0/1"].vrf, "no vrf definition removes the VRF and takes its interfaces out of it"); x("end"); }

// ---------- 2. one router, two tenants with the SAME subnets: 10.1.1.0/24 (G0/0 vs G0/1) and 10.2.2.0/24 (G0/2.10 vs G0/2.20) ----------
const PE = ["hostname PE1", "vrf definition CUST_A", "rd 65000:1", "address-family ipv4", "exit-address-family", "exit", "vrf definition CUST_B", "address-family ipv4", "exit-address-family", "exit",
  "int g0/0", "description Tenant A LAN", "vrf forwarding CUST_A", "ip address 10.1.1.1 255.255.255.0", "no shut",
  "int g0/1", "vrf forwarding CUST_B", "ip address 10.1.1.1 255.255.255.0", "no shut",
  "int g0/2", "no shut", "int g0/2.10", "encapsulation dot1Q 10", "vrf forwarding CUST_A", "ip address 10.2.2.1 255.255.255.0", "int g0/2.20", "encapsulation dot1Q 20", "vrf forwarding CUST_B", "ip address 10.2.2.1 255.255.255.0",
  "int lo0", "vrf forwarding CUST_B", "ip address 10.9.9.9 255.255.255.255"];
const SW = ["vlan 10", "vlan 20", "exit", "int g0/1", "switchport mode trunk", "int g0/2", "switchport mode access", "switchport access vlan 10", "int g0/3", "switchport mode access", "switchport access vlan 20"];
const mk = extra => Bench.create({ devices: [
    { id:"pe", kind:"router", label:"PE1", x:300, y:0, config: cfg([...PE, ...(extra||[])]) }, { id:"sw", kind:"switch", label:"SW1", x:500, y:150, config: cfg(SW) },
    PC("a1", "10.1.1.10", "10.1.1.1", 0), PC("b1", "10.1.1.10", "10.1.1.1", 150), PC("a2", "10.2.2.10", "10.2.2.1", 450), PC("b2", "10.2.2.10", "10.2.2.1", 600) ],
  cables: [{type:"cat6",a:"a1:eth",b:"pe:g0"},{type:"cat6",a:"b1:eth",b:"pe:g1"},{type:"cat6",a:"pe:g2",b:"sw:g1"},{type:"cat6",a:"a2:eth",b:"sw:g2"},{type:"cat6",a:"b2:eth",b:"sw:g3"}] });
{ const B = mk();
  ok(!/overlaps/.test(cli(B, "pe", "show logging")) && B.devs.pe.env.intfs["GigabitEthernet0/1"].ip==="10.1.1.1", "the same subnet in two VRFs is accepted (overlap is checked per routing table)");
  ok(/overlaps with GigabitEthernet0\/0/.test(conf(B, "pe", ["int g0/0.99", "encapsulation dot1Q 99", "vrf forwarding CUST_A", "ip address 10.1.1.5 255.255.255.0"])), "… but inside ONE VRF the overlap is still refused");
  conf(B, "pe", ["no interface g0/0.99"]);
  const g = cli(B, "pe", "show ip route");
  ok(/Gateway of last resort is not set\n$/.test(g + "\n") && !/10\.1\.1/.test(g), "the global table sees none of the VRF routes", g);
  const ra = cli(B, "pe", "show ip route vrf CUST_A");
  ok(/^\nRouting Table: CUST_A\nCodes: L - local, C - connected, S - static/.test(ra) && /C        10\.1\.1\.0\/24 is directly connected, GigabitEthernet0\/0\nL        10\.1\.1\.1\/32 is directly connected, GigabitEthernet0\/0\nC        10\.2\.2\.0\/24 is directly connected, GigabitEthernet0\/2\.10\nL        10\.2\.2\.1\/32 is directly connected, GigabitEthernet0\/2\.10/.test(ra) && !/10\.9\.9\.9/.test(ra), "show ip route vrf CUST_A: blank line, Routing Table header, only A's routes", ra);
  ok(/C        10\.9\.9\.9\/32 is directly connected, Loopback0/.test(cli(B, "pe", "show ip route vrf CUST_B")) || /C\s+10\.9\.9\.9 is directly connected, Loopback0/.test(cli(B, "pe", "show ip route vrf CUST_B")), "CUST_B has its loopback", cli(B, "pe", "show ip route vrf CUST_B"));
  ok(/Reply from 10\.2\.2\.10: bytes=32 time<1ms TTL=127/.test(pc(B, "a1", "ping 10.2.2.10")), "tenant A: A1 → A2 through PE1 (TTL 127)", pc(B, "a1", "ping 10.2.2.10"));
  ok(/routes it — in VRF CUST_A's routing table/.test(log(B)), "the frame log says which VRF table routed it", log(B));
  ok(/Reply from 10\.2\.2\.10: bytes=32 time<1ms TTL=127/.test(pc(B, "b1", "ping 10.2.2.10")), "tenant B: B1 → B2 — same addresses, different devices");
  ok(B.arp.b1["10.1.1.1"] && B.arp.a1["10.1.1.1"] && B.arp.b1["10.1.1.1"].mac!==B.arp.a1["10.1.1.1"].mac, "each tenant's gateway 10.1.1.1 is a different router interface (different MAC)");
  const pa = B.arp.pe; ok(pa["10.2.2.10%CUST_A"] && pa["10.2.2.10%CUST_B"] && pa["10.2.2.10%CUST_A"].mac===B.devs.a2.mac && pa["10.2.2.10%CUST_B"].mac===B.devs.b2.mac, "PE1 keeps one ARP table per VRF: 10.2.2.10 is A2 in CUST_A and B2 in CUST_B", JSON.stringify(pa));
  const aa = cli(B, "pe", "show ip arp vrf CUST_A");
  ok(aa.includes(B.devs.a2.mac) && !aa.includes(B.devs.b2.mac) && /GigabitEthernet0\/2\.10/.test(aa), "show ip arp vrf CUST_A lists only A's neighbours", aa);
  ok(!/10\.2\.2\.10/.test(cli(B, "pe", "show ip arp")), "show ip arp (global) has none of them");
  const u = pc(B, "a1", "ping 10.9.9.9");
  ok(/Reply from 10\.1\.1\.1: Destination host unreachable\./.test(u), "A1 → 10.9.9.9 (exists only in CUST_B): PE1 has no route in CUST_A", u);
  ok(/Reply from 10\.9\.9\.9/.test(pc(B, "b1", "ping 10.9.9.9")), "B1 → 10.9.9.9 works (it's in B's table)");
  const pv = cli(B, "pe", "ping vrf CUST_B 10.2.2.10");
  ok(/!!!!!/.test(pv) && Bench.vrfPinged(B, "pe", "CUST_B", "10.2.2.10"), "ping vrf CUST_B 10.2.2.10 from the router", pv);
  ok(/Success rate is 0 percent/.test(cli(B, "pe", "ping 10.2.2.10")), "a plain ping from PE1 uses the global table — fails (the classic mistake)");
  ok(/!!!!!/.test(cli(B, "pe", "ping vrf CUST_A 10.1.1.10 source g0/0")) && /Invalid source address/.test(cli(B, "pe", "ping vrf CUST_A 10.1.1.10 source g0/1")), "ping vrf … source must be an interface of that VRF");
  const tr = cli(B, "pe", "traceroute vrf CUST_A 10.2.2.10");
  ok(/VRF info: \(vrf in name\/id, vrf out name\/id\)\n  1 10\.2\.2\.10 \d msec/.test(tr), "traceroute vrf", tr);
  const t = pc(B, "a1", "tracert 10.2.2.10");
  ok(/1\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.1\.1\.1\n\s+2\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.2\.2\.10/.test(t), "tracert from A1 lists the right hops although B uses the same addresses", t);
  ok(Bench.vrfOf(B, "pe", "GigabitEthernet0/2.10")==="CUST_A" && Bench.vrfRoute(B, "pe", "CUST_A", "10.2.2.0/24", "C") && !Bench.route(B, "pe", "10.2.2.0/24"), "helpers: vrfOf, vrfRoute (and the global route helper sees nothing)");
  const vi = cli(B, "pe", "show ip vrf interfaces");
  ok(/^Interface {14}IP-Address {6}VRF {30}Protocol\nGi0\/0 {18}10\.1\.1\.1 {8}CUST_A {27}up\nGi0\/1 {18}10\.1\.1\.1 {8}CUST_B {27}up\nGi0\/2\.10 {15}10\.2\.2\.1 {8}CUST_A {27}up\nGi0\/2\.20 {15}10\.2\.2\.1 {8}CUST_B {27}up\nLo0 {20}10\.9\.9\.9 {8}CUST_B {27}up$/.test(vi), "show ip vrf interfaces", vi);
  const rc = cli(B, "pe", "show running-config");
  ok(/hostname PE1\n!\nvrf definition CUST_A\n rd 65000:1\n !\n address-family ipv4\n exit-address-family\n!\nvrf definition CUST_B\n !\n address-family ipv4\n exit-address-family\n!/.test(rc), "running-config: vrf definition blocks after the hostname", rc);
  ok(/interface GigabitEthernet0\/0\n description Tenant A LAN\n vrf forwarding CUST_A\n ip address 10\.1\.1\.1 255\.255\.255\.0\n/.test(rc) && /interface GigabitEthernet0\/2\.10\n encapsulation dot1Q 10\n vrf forwarding CUST_A\n ip address 10\.2\.2\.1/.test(rc), "interface: description, (encapsulation,) vrf forwarding, then ip address", rc);
  cli(B, "pe", "write memory"); cli(B, "pe", "reload"); cli(B, "pe", "");
  ok(B.devs.pe.env.intfs["GigabitEthernet0/1"].vrf==="CUST_B" && B.devs.pe.env.intfs["GigabitEthernet0/1"].ip==="10.1.1.1" && /Reply from 10\.2\.2\.10/.test(pc(B, "a1", "ping 10.2.2.10")), "write + reload keeps the VRFs, memberships and addresses"); }

// ---------- 3. static routes per VRF, a ticket: the static went into the global table ----------
{ const B = Bench.create({ devices: [
    { id:"pe", kind:"router", label:"PE1", x:0, y:0, config: cfg(["vrf definition GUEST", "address-family ipv4", "exit-address-family", "exit", "int g0/0", "vrf forwarding GUEST", "ip address 192.168.50.1 255.255.255.0", "no shut",
      "int g0/1", "vrf forwarding GUEST", "ip address 10.255.0.1 255.255.255.252", "no shut", "exit", "ip route 0.0.0.0 0.0.0.0 10.255.0.2"]) },
    { id:"fw", kind:"router", label:"FW", x:300, y:0, config: cfg(["int g0/1", "ip address 10.255.0.2 255.255.255.252", "no shut", "int lo0", "ip address 8.8.8.8 255.255.255.255", "exit", "ip route 192.168.50.0 255.255.255.0 10.255.0.1"]) },
    PC("g1", "192.168.50.10", "192.168.50.1") ],
  cables: [{type:"cat6",a:"g1:eth",b:"pe:g0"},{type:"cat6",a:"pe:g1",b:"fw:g1"}] });
  ok(!Bench.vrfRoute(B, "pe", "GUEST", "0.0.0.0/0") && !Bench.route(B, "pe", "0.0.0.0/0"), "ip route (global) with a next hop that is only reachable in GUEST: not installed anywhere");
  ok(/Reply from 192\.168\.50\.1: Destination host unreachable\./.test(pc(B, "g1", "ping 8.8.8.8")), "the guest can't reach 8.8.8.8 (no default in GUEST)");
  conf(B, "pe", ["no ip route 0.0.0.0 0.0.0.0 10.255.0.2", "ip route vrf GUEST 0.0.0.0 0.0.0.0 10.255.0.2"]);
  const d = Bench.vrfRoute(B, "pe", "GUEST", "0.0.0.0/0", "S*");
  ok(d && d.via[0]==="10.255.0.2" && Bench.vrfRouteVia(B, "pe", "GUEST", "8.8.8.8")==="10.255.0.2", "ip route vrf GUEST 0.0.0.0 0.0.0.0 10.255.0.2: S* in GUEST", JSON.stringify(d));
  ok(/S\*    0\.0\.0\.0\/0 \[1\/0\] via 10\.255\.0\.2/.test(cli(B, "pe", "show ip route vrf GUEST static")) && /Gateway of last resort is 10\.255\.0\.2 to network 0\.0\.0\.0/.test(cli(B, "pe", "show ip route vrf GUEST")), "show ip route vrf GUEST static");
  ok(/Reply from 8\.8\.8\.8: bytes=32 time<1ms TTL=254/.test(pc(B, "g1", "ping 8.8.8.8")), "now the guest reaches 8.8.8.8", pc(B, "g1", "ping 8.8.8.8"));
  ok(/\nip route vrf GUEST 0\.0\.0\.0 0\.0\.0\.0 10\.255\.0\.2\n/.test(cli(B, "pe", "show running-config")) && !/\nip route 0\.0\.0\.0/.test(cli(B, "pe", "show running-config")), "running-config: ip route vrf GUEST …");
  ok(/Routing Table: GUEST\nRouting entry for 0\.0\.0\.0\/0, supernet\n  Known via "static", distance 1/.test(cli(B, "pe", "show ip route vrf GUEST 0.0.0.0")), "show ip route vrf GUEST 0.0.0.0", cli(B, "pe", "show ip route vrf GUEST 0.0.0.0"));
  conf(B, "pe", ["no ip route vrf GUEST 0.0.0.0 0.0.0.0"]); ok(!Bench.vrfRoute(B, "pe", "GUEST", "0.0.0.0/0"), "no ip route vrf GUEST … removes it"); }

// ---------- 4. OSPF per VRF: a global process and a VRF process on one router, each with its own neighbour ----------
{ const B = Bench.create({ devices: [
    { id:"pe", kind:"router", label:"PE1", x:300, y:0, config: cfg(["vrf definition CUST_A", "address-family ipv4", "exit-address-family", "exit",
      "int lo0", "ip address 1.1.1.1 255.255.255.255", "int lo1", "vrf forwarding CUST_A", "ip address 11.11.11.11 255.255.255.255",
      "int g0/0", "ip address 10.0.0.1 255.255.255.252", "no shut", "int g0/1", "vrf forwarding CUST_A", "ip address 10.0.0.1 255.255.255.252", "no shut", "exit",
      "router ospf 1", "network 0.0.0.0 255.255.255.255 area 0", "exit", "router ospf 11 vrf CUST_A", "network 10.0.0.0 0.0.0.3 area 0", "network 11.11.11.11 0.0.0.0 area 0"]) },
    { id:"core", kind:"router", label:"CORE", x:0, y:0, config: cfg(["int lo0", "ip address 2.2.2.2 255.255.255.255", "int g0/0", "ip address 10.0.0.2 255.255.255.252", "no shut", "int g0/1", "ip address 172.16.9.1 255.255.255.0", "no shut", "exit", "router ospf 1", "network 0.0.0.0 255.255.255.255 area 0"]) },
    { id:"ce", kind:"router", label:"CE-A", x:600, y:0, config: cfg(["int lo0", "ip address 3.3.3.3 255.255.255.255", "int g0/0", "ip address 10.0.0.2 255.255.255.252", "no shut", "int g0/1", "ip address 192.168.1.1 255.255.255.0", "no shut", "exit", "router ospf 5", "network 0.0.0.0 255.255.255.255 area 0"]) },
    { id:"sw", kind:"switch", label:"SW", x:0, y:200 }, PC("h", "192.168.1.10", "192.168.1.1", 600) ],
  cables: [{type:"cat6",a:"pe:g0",b:"core:g0"},{type:"cat6",a:"pe:g1",b:"ce:g0"},{type:"cat6",a:"core:g1",b:"sw:g1"},{type:"cat6",a:"h:eth",b:"ce:g1"}] });
  const nb = cli(B, "pe", "show ip ospf neighbor");
  ok(/2\.2\.2\.2\s+1\s+FULL\/(DR|BDR)\s+00:00:\d\d\s+10\.0\.0\.2\s+GigabitEthernet0\/0/.test(nb) && /3\.3\.3\.3\s+1\s+FULL\/(DR|BDR)\s+00:00:\d\d\s+10\.0\.0\.2\s+GigabitEthernet0\/1/.test(nb), "show ip ospf neighbor lists both processes' neighbours (same neighbour address 10.0.0.2, different VRFs)", nb);
  ok(Bench.ospfNbr(B, "pe", "2.2.2.2") && !Bench.ospfNbr(B, "pe", "3.3.3.3") && Bench.vrfOspfNbr(B, "pe", "CUST_A", "3.3.3.3"), "helpers: the global process has CORE, the VRF process has CE-A");
  const br = cli(B, "pe", "show ip ospf interface brief");
  ok(/Gi0\/0\s+1\s+0\s+10\.0\.0\.1\/30/.test(br) && /Gi0\/1\s+11\s+0\s+10\.0\.0\.1\/30/.test(br) && /Lo1\s+11\s+0\s+11\.11\.11\.11\/32/.test(br) && !/Lo1\s+1\s/.test(br), "network 0.0.0.0 255.255.255.255 in the global process doesn't grab VRF interfaces", br);
  ok(/O        172\.16\.9\.0 \[110\/2\] via 10\.0\.0\.2, \d\d:\d\d:\d\d, GigabitEthernet0\/0/.test(cli(B, "pe", "show ip route ospf")) && !/192\.168\.1/.test(cli(B, "pe", "show ip route")), "global table: CORE's LAN only", cli(B, "pe", "show ip route ospf"));
  const va = cli(B, "pe", "show ip route vrf CUST_A ospf");
  ok(/Routing Table: CUST_A/.test(va) && /O     192\.168\.1\.0\/24 \[110\/2\] via 10\.0\.0\.2, \d\d:\d\d:\d\d, GigabitEthernet0\/1/.test(va) && !/172\.16\.9/.test(va), "CUST_A table: CE-A's LAN only", va);
  ok(/O        11\.11\.11\.11 \[110\/2\] via 10\.0\.0\.1/.test(cli(B, "ce", "show ip route ospf")) && !/1\.1\.1\.1 /.test(cli(B, "ce", "show ip route ospf")), "CE-A learns the VRF loopback, not the global one", cli(B, "ce", "show ip route ospf"));
  ok(/!!!!/.test(cli(B, "pe", "ping vrf CUST_A 192.168.1.10")) && /Reply from 11\.11\.11\.11/.test(pc(B, "h", "ping 11.11.11.11")), "end to end inside CUST_A");
  ok(/Routing Process "ospf 1" with ID 1\.1\.1\.1/.test(cli(B, "pe", "show ip ospf")) && /Routing Process "ospf 11" with ID 11\.11\.11\.11/.test(cli(B, "pe", "show ip ospf")), "show ip ospf: one block per process; the VRF process takes its router ID from its own VRF's interfaces", cli(B, "pe", "show ip ospf"));
  ok(/Routing Protocol is "ospf 11"/.test(cli(B, "pe", "show ip protocols vrf CUST_A")) && /Routing Protocol is "ospf 1"/.test(cli(B, "pe", "show ip protocols")), "show ip protocols [vrf]");
  ok(/\nrouter ospf 1\n network 0\.0\.0\.0 255\.255\.255\.255 area 0\n!\nrouter ospf 11 vrf CUST_A\n network 11\.11\.11\.11 0\.0\.0\.0 area 0\n network 10\.0\.0\.0 0\.0\.0\.3 area 0\n!/.test(cli(B, "pe", "show running-config")), "running-config: router ospf 11 vrf CUST_A after router ospf 1", cli(B, "pe", "show running-config"));
  ok(/already runs in the global table/.test(conf(B, "pe", ["router ospf 1 vrf CUST_A"])), "a VRF needs its own OSPF process ID");
  ok(/Process ID 11, Router ID 11\.11\.11\.11, Network Type BROADCAST/.test(cli(B, "pe", "show ip ospf interface g0/1")), "show ip ospf interface on a VRF interface names the VRF process");
  conf(B, "pe", ["router ospf 11", "passive-interface g0/1"]);
  ok(!Bench.vrfOspfNbr(B, "pe", "CUST_A", "3.3.3.3") && Bench.ospfNbr(B, "pe", "2.2.2.2"), "router ospf 11 (without vrf) re-enters the VRF process: passive-interface there drops only CE-A");
  conf(B, "pe", ["int g0/1", "ip ospf 11 area 0"]); conf(B, "pe", ["router ospf 11", "no passive-interface g0/1"]);
  ok(/Interface GigabitEthernet0\/0 is in the global table, but OSPF process 11 is in VRF CUST_A/.test(conf(B, "pe", ["int g0/0", "ip ospf 11 area 0"])), "ip ospf N area on an interface of another VRF is refused"); }

// ---------- 5. an L3 switch with SVIs in a VRF (guest VLAN) ----------
{ const B = Bench.create({ devices: [
    { id:"l3", kind:"switch", label:"DSW1", x:0, y:0, config: cfg(["ip routing", "vrf definition GUEST", "address-family ipv4", "exit-address-family", "exit", "vlan 10", "vlan 20", "vlan 30", "exit",
      "int vlan 10", "ip address 10.10.10.1 255.255.255.0", "no shut", "int vlan 20", "vrf forwarding GUEST", "ip address 10.10.20.1 255.255.255.0", "no shut", "int vlan 30", "vrf forwarding GUEST", "ip address 10.10.30.1 255.255.255.0", "no shut",
      "int g0/1", "switchport mode access", "switchport access vlan 10", "int g0/2", "switchport mode access", "switchport access vlan 20", "int g0/3", "switchport mode access", "switchport access vlan 30"]) },
    PC("s", "10.10.10.10", "10.10.10.1", 0), PC("g", "10.10.20.10", "10.10.20.1", 150), PC("g2", "10.10.30.10", "10.10.30.1", 300) ],
  cables: [{type:"cat6",a:"s:eth",b:"l3:g1"},{type:"cat6",a:"g:eth",b:"l3:g2"},{type:"cat6",a:"g2:eth",b:"l3:g3"}] });
  ok(/Reply from 10\.10\.30\.10: bytes=32 time<1ms TTL=127/.test(pc(B, "g", "ping 10.10.30.10")), "guest VLAN 20 ↔ guest VLAN 30 routed inside VRF GUEST on the L3 switch", pc(B, "g", "ping 10.10.30.10"));
  ok(/Destination host unreachable/.test(pc(B, "g", "ping 10.10.10.10")), "guest → staff VLAN 10: no route in GUEST", pc(B, "g", "ping 10.10.10.10"));
  ok(/Destination host unreachable|Request timed out/.test(pc(B, "s", "ping 10.10.20.10")), "staff → guest: no route in the global table");
  ok(/Routing Table: GUEST/.test(cli(B, "l3", "show ip route vrf GUEST")) && /Vlan20/.test(cli(B, "l3", "show ip route vrf GUEST")), "show ip route vrf GUEST on the switch"); }

// ---------- 6. two PE routers, both tenants with identical addressing end to end (802.1Q link with one subinterface per VRF) ----------
{ const side = (lan, link) => ["vrf definition A", "address-family ipv4", "exit-address-family", "exit", "vrf definition B", "address-family ipv4", "exit-address-family", "exit",
    "int g0/0", "vrf forwarding A", `ip address ${lan} 255.255.255.0`, "no shut", "int g0/1", "vrf forwarding B", `ip address ${lan} 255.255.255.0`, "no shut",
    "int g0/2", "no shut", "int g0/2.10", "encapsulation dot1Q 10", "vrf forwarding A", `ip address ${link} 255.255.255.252`, "int g0/2.20", "encapsulation dot1Q 20", "vrf forwarding B", `ip address ${link} 255.255.255.252`, "exit"];
  const B = Bench.create({ devices: [
    { id:"pe1", kind:"router", label:"PE1", x:200, y:0, config: cfg([...side("10.1.1.1", "10.0.12.1"), "ip route vrf A 10.3.3.0 255.255.255.0 10.0.12.2", "ip route vrf B 10.3.3.0 255.255.255.0 10.0.12.2"]) },
    { id:"pe2", kind:"router", label:"PE2", x:500, y:0, config: cfg([...side("10.3.3.1", "10.0.12.2"), "ip route vrf A 10.1.1.0 255.255.255.0 10.0.12.1", "ip route vrf B 10.1.1.0 255.255.255.0 10.0.12.1"]) },
    PC("a1", "10.1.1.10", "10.1.1.1", 0), PC("b1", "10.1.1.10", "10.1.1.1", 150), PC("a3", "10.3.3.10", "10.3.3.1", 500), PC("b3", "10.3.3.10", "10.3.3.1", 650) ],
  cables: [{type:"cat6",a:"a1:eth",b:"pe1:g0"},{type:"cat6",a:"b1:eth",b:"pe1:g1"},{type:"cat6",a:"pe1:g2",b:"pe2:g2"},{type:"cat6",a:"a3:eth",b:"pe2:g0"},{type:"cat6",a:"b3:eth",b:"pe2:g1"}] });
  ok(/Reply from 10\.3\.3\.10: bytes=32 time<1ms TTL=126/.test(pc(B, "a1", "ping 10.3.3.10")) && B.arp.pe2["10.3.3.10%A"].mac===B.devs.a3.mac, "A1 → A3 across two PEs (TTL 126), delivered to A3", pc(B, "a1", "ping 10.3.3.10"));
  ok(/Reply from 10\.3\.3\.10: bytes=32 time<1ms TTL=126/.test(pc(B, "b1", "ping 10.3.3.10")) && B.arp.pe2["10.3.3.10%B"].mac===B.devs.b3.mac, "B1 → B3: same addresses, the other tenant's PC");
  const t = pc(B, "b1", "tracert 10.3.3.10");
  ok(/1\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.1\.1\.1\n\s+2\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.0\.12\.2\n\s+3\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.3\.3\.10\n/.test(t), "tracert B1 → B3: every hop answers from the right VRF (identical hop addresses exist in A)", t);
  conf(B, "pe2", ["no ip route vrf B 10.1.1.0 255.255.255.0"]);
  const t2 = pc(B, "b1", "tracert 10.3.3.10");
  ok(/2\s+\*\s+\*\s+\*\s+Request timed out\./.test(t2) && /Reply from 10\.3\.3\.10/.test(pc(B, "a1", "ping 10.3.3.10")) && /Request timed out\./.test(pc(B, "b1", "ping 10.3.3.10")), "remove B's return route on PE2: B's hops go silent, A is unaffected", t2); }

// ---------- 7. help and abbreviations ----------
{ const e = SIM.ios2Env({kind:"router", host:"R1"}), x = c => { const r = e.exec(c); return typeof r==="string" ? r : (r.text||"") + (r.ask||""); };
  x("en"); x("conf t");
  ok(/vrf\s+VPN Routing\/Forwarding instance/.test(x("vrf ?")) || /definition/.test(x("vrf ?")), "vrf ? lists definition", x("vrf ?"));
  x("vrf def X"); ok(e.prompt()==="R1(config-vrf)#", "vrf def X (abbreviated)"); x("address-family ipv4"); x("exit"); x("exit");
  x("int g0/0"); ok(/IPv4 disabled/.test(x("ip address 10.0.0.1 255.255.255.0") + x("vrf forw X")) && e.intfs["GigabitEthernet0/0"].vrf==="X", "vrf forw X (abbreviated)");
  x("end"); ok(/Routing Table: X/.test(x("sh ip ro vrf X")), "sh ip ro vrf X"); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
