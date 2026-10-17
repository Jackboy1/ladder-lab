#!/usr/bin/env node
// Ladder Lab — GRE tunnels in the full engine (Module 10+): interface TunnelN, tunnel source/destination, line-protocol rules,
// encapsulation across an "internet" underlay (frame log: outer header, protocol 47), statics and OSPF over the tunnel,
// recursive routing (%TUN-5-RECURDOWN), keepalives, ACLs that must permit GRE, ip mtu / adjust-mss, shows, save + reload.
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
const logs = (B, id, re) => cli(B, id, "show logging").split("\n").filter(l=>re.test(l));
const R = (id, cmds, x) => ({ id, kind:"router", label:id.toUpperCase(), x:x||0, y:0, config: cfg(cmds) });

// HQ (LAN 10.1.0.0/24) — ISP1 — ISP2 — BR (LAN 10.2.0.0/24). The ISPs know only the public /30s: private traffic needs the tunnel.
const TUN = (ip, dst) => ["interface Tunnel0", `ip address ${ip} 255.255.255.252`, "tunnel source g0/1", `tunnel destination ${dst}`];
const mk = o => { o = o || {}; return Bench.create({ devices: [
    R("hq", ["hostname HQ", "int g0/0", "ip address 10.1.0.1 255.255.255.0", "no shut", "int g0/1", "ip address 203.0.113.2 255.255.255.252", "no shut", "exit", "ip route 0.0.0.0 0.0.0.0 203.0.113.1", ...(o.hq||[])]),
    R("isp1", ["hostname ISP1", "int g0/1", "ip address 203.0.113.1 255.255.255.252", "no shut", "int g0/0", "ip address 192.0.2.1 255.255.255.252", "no shut", "exit", "ip route 198.51.100.0 255.255.255.252 192.0.2.2", ...(o.isp1||[])], 200),
    R("isp2", ["hostname ISP2", "int g0/0", "ip address 192.0.2.2 255.255.255.252", "no shut", "int g0/1", "ip address 198.51.100.1 255.255.255.252", "no shut", "exit", "ip route 203.0.113.0 255.255.255.252 192.0.2.1"], 400),
    R("br", ["hostname BR", "int g0/0", "ip address 10.2.0.1 255.255.255.0", "no shut", "int g0/1", "ip address 198.51.100.2 255.255.255.252", "no shut", "exit", "ip route 0.0.0.0 0.0.0.0 198.51.100.1", ...(o.br||[])], 600),
    { id:"p1", kind:"pc", label:"PC1", x:0, y:300, ip:"10.1.0.10", mask:"255.255.255.0", gw:"10.1.0.1" },
    { id:"p2", kind:"pc", label:"PC2", x:600, y:300, ip:"10.2.0.10", mask:"255.255.255.0", gw:"10.2.0.1" } ],
  cables: [{type:"cat6",a:"hq:g1",b:"isp1:g1"},{type:"cat6",a:"isp1:g0",b:"isp2:g0"},{type:"cat6",a:"isp2:g1",b:"br:g1"},{type:"cat6",a:"p1:eth",b:"hq:g0"},{type:"cat6",a:"p2:eth",b:"br:g0"}] }); };
const BOTH = { hq: [...TUN("172.16.0.1", "198.51.100.2"), "exit", "ip route 10.2.0.0 255.255.255.0 Tunnel0"], br: [...TUN("172.16.0.2", "203.0.113.2"), "exit", "ip route 10.1.0.0 255.255.255.0 Tunnel0"] };

// ---------- 1. the line protocol, step by step (console messages included) ----------
{ const B = mk();
  ok(/Destination host unreachable/.test(pc(B, "p1", "ping 10.2.0.10")), "without a tunnel PC1 can't reach the branch (the ISPs have no route to 10.x)");
  cli(B, "hq", "conf t");
  const c0 = cli(B, "hq", "interface Tunnel0");
  ok(/%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down$/.test(c0) && B.devs.hq.env.prompt()==="HQ(config-if)#", "interface Tunnel0 creates it: line protocol down is logged", c0);
  cli(B, "hq", "ip address 172.16.0.1 255.255.255.252");
  ok(/^Tunnel0 is up, line protocol is down/.test(cli(B, "hq", "do show interfaces tunnel 0")), "an address alone: Tunnel0 is up, line protocol is down");
  ok(/Tunnel0\s+172\.16\.0\.1\s+YES manual up\s+down/.test(cli(B, "hq", "do show ip interface brief")), "show ip interface brief: up / down");
  ok(cli(B, "hq", "tunnel source g0/1")==="" && Bench.tunnelWhy(B, "hq", 0)==="no destination", "a source but no destination: still down");
  const c1 = cli(B, "hq", "tunnel destination 198.51.100.2");
  ok(/%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to up$/.test(c1) && Bench.tunnelUp(B, "hq", 0), "source + a ROUTABLE destination (the default route counts) → up/up, logged on the console", c1);
  ok(Bench.tunnelUp(B, "hq", "Tunnel0") && !Bench.tunnelUp(B, "br", 0), "the far end isn't configured yet — without keepalives HQ's tunnel is up/up anyway");
  ok(/Success rate is 0 percent/.test(cli(B, "hq", "do ping 172.16.0.2")), "… but nothing answers across it (the far end has no tunnel)");
  ok(/can't unwrap it and drops it/.test(log(B)), "frame log: the GRE packet arrives at BR, which has no matching tunnel", log(B));
  cli(B, "hq", "end");
  const si = cli(B, "hq", "show interfaces tunnel 0");
  ok(si.split("\n").slice(0, 8).join("\n")===["Tunnel0 is up, line protocol is up", "  Hardware is Tunnel", "  Internet address is 172.16.0.1/30", "  MTU 9976 bytes, BW 100 Kbit/sec, DLY 50000 usec,", "     reliability 255/255, txload 1/255, rxload 1/255", "  Encapsulation TUNNEL, loopback not set", "  Keepalive not set", "  Tunnel source 203.0.113.2 (GigabitEthernet0/1), destination 198.51.100.2"].join("\n")
    && /\n  Tunnel protocol\/transport GRE\/IP\n/.test(si) && /\n  Tunnel transport MTU 1476 bytes\n/.test(si), "show interfaces tunnel 0: the key lines", si);
  ok(/  MTU is 1476 bytes/.test(cli(B, "hq", "show ip interface tunnel0")), "show ip interface Tunnel0: MTU is 1476 bytes (1500 − 24)");
  // what takes it down
  conf(B, "hq", ["no ip route 0.0.0.0 0.0.0.0 203.0.113.1"]);
  ok(!Bench.tunnelUp(B, "hq", 0) && Bench.tunnelWhy(B, "hq", 0)==="no route" && /Tunnel0, changed state to down/.test(logs(B, "hq", /LINEPROTO.*Tunnel0/).pop()), "no route to the destination → line protocol down (logged)");
  conf(B, "hq", ["ip route 198.51.100.2 255.255.255.255 203.0.113.1"]); ok(Bench.tunnelUp(B, "hq", 0), "a host route to the destination is enough"); conf(B, "hq", ["no ip route 198.51.100.2 255.255.255.255 203.0.113.1", "ip route 0.0.0.0 0.0.0.0 203.0.113.1"]);
  const sh = conf(B, "hq", ["int g0/1", "shutdown"]);
  ok(!Bench.tunnelUp(B, "hq", 0) && Bench.tunnelWhy(B, "hq", 0)==="source down" && /Line protocol on Interface Tunnel0, changed state to down/.test(sh), "the source interface shut → tunnel down (printed after the command)", sh);
  conf(B, "hq", ["int g0/1", "no shutdown"]); ok(Bench.tunnelUp(B, "hq", 0), "source back up → tunnel up");
  const ts = conf(B, "hq", ["int tunnel0", "shutdown"]);
  ok(/%LINK-5-CHANGED: Interface Tunnel0, changed state to administratively down\n.*%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down/.test(ts) && /Tunnel0\s+172\.16\.0\.1\s+YES manual administratively down down/.test(cli(B, "hq", "show ip interface brief")), "shutdown on the tunnel: administratively down/down", ts);
  ok(/%LINK-3-UPDOWN: Interface Tunnel0, changed state to up\n.*%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to up/.test(conf(B, "hq", ["int tunnel0", "no shutdown"])), "no shutdown → up/up again");
  conf(B, "hq", ["int tunnel0", "tunnel source 10.1.0.1"]); ok(Bench.tunnelUp(B, "hq", 0) && /Tunnel source 10\.1\.0\.1 \(GigabitEthernet0\/0\)/.test(cli(B, "hq", "show interfaces tunnel0")), "tunnel source can be one of the router's IP addresses");
  conf(B, "hq", ["int tunnel0", "tunnel source 10.99.0.1"]); ok(!Bench.tunnelUp(B, "hq", 0) && /Tunnel source 10\.99\.0\.1, destination/.test(cli(B, "hq", "show interfaces tunnel0")), "an address the router doesn't own: down");
  conf(B, "hq", ["int tunnel0", "tunnel source GigabitEthernet0/1"]);
  ok(/only point-to-point GRE/i.test(conf(B, "hq", ["int tunnel0", "tunnel mode gre multipoint"])) && conf(B, "hq", ["int tunnel0", "tunnel mode gre ip"]).trim()==="", "tunnel mode gre ip (the default) accepted; other modes are concepts here");
  ok(/% Invalid input/.test(conf(B, "hq", ["int g0/0", "tunnel source g0/1"])), "tunnel commands only on a tunnel interface"); }

// ---------- 2. both ends + static routes: the encapsulation in the frame log, TTL, traceroute ----------
{ const B = mk(BOTH);
  ok(Bench.tunnelUp(B, "hq", 0) && Bench.tunnelUp(B, "br", 0), "both tunnels up/up");
  const p = pc(B, "p1", "ping 10.2.0.10");
  ok(/Reply from 10\.2\.0\.10: bytes=32 time<1ms TTL=126/.test(p) && Bench.greSeen(B), "PC1 → PC2 through the tunnel: TTL 126 (the tunnel is one hop; the ISP routers don't count)", p);
  const L = log(B);
  ok(/GRE encapsulation on HQ Tunnel0: the original packet 10\.1\.0\.10 → 10\.2\.0\.10 goes inside a NEW IP header 203\.0\.113\.2 → 198\.51\.100\.2, protocol 47 \(GRE\) — \+24 bytes/.test(L), "frame log: the outer header (tunnel source → destination, protocol 47)", L);
  ok(/GRE 203\.0\.113\.2 → 198\.51\.100\.2 \(protocol 47\) carrying ICMP echo request/.test(L) && /ISP1 received it on Gi0\/1, decrements TTL to 254/.test(L), "frame log: the ISP routers forward the OUTER packet", L);
  ok(/GRE decapsulation on BR: the outer header 203\.0\.113\.2 → 198\.51\.100\.2 matches Tunnel0/.test(L) && /GRE encapsulation on BR Tunnel0: the original packet 10\.2\.0\.10 → 10\.1\.0\.10/.test(L), "frame log: unwrapped at BR, and the reply is wrapped the other way", L);
  ok(B.frames.some(h=>h.gre) && B.frames.some(h=>!h.gre), "the animation marks the GRE frames (violet, GRE badge) apart from the LAN frames");
  const t = pc(B, "p1", "tracert 10.2.0.10");
  ok(/1\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.1\.0\.1\n\s+2\s+<1 ms\s+<1 ms\s+<1 ms\s+172\.16\.0\.2\n\s+3\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.2\.0\.10/.test(t), "tracert: HQ, BR's tunnel address, PC2 — the underlay is invisible", t);
  ok(/  1 172\.16\.0\.2 \d msec \d msec \d msec\n  2 10\.2\.0\.10/.test(cli(B, "hq", "traceroute 10.2.0.10")), "IOS traceroute from HQ: 172.16.0.2 then PC2");
  ok(/S        10\.2\.0\.0 is directly connected, Tunnel0|S        10\.2\.0\.0\/24 is directly connected, Tunnel0/.test(cli(B, "hq", "show ip route static")), "the static points out Tunnel0", cli(B, "hq", "show ip route static"));
  ok(/!!!!!|\.!!!!/.test(cli(B, "hq", "ping 172.16.0.2")), "HQ pings BR's tunnel address");
  // an edge ACL that forgets GRE
  conf(B, "isp1", ["access-list 101 deny gre any any log", "access-list 101 permit ip any any", "int g0/1", "ip access-group 101 in"]);
  ok(/Request timed out\./.test(pc(B, "p1", "ping 10.2.0.10")) && Bench.aclHits(B, "isp1", "101", 10)===4, "ISP1 denies protocol 47: the tunnelled ping times out; 4 matches on the gre line", Bench.aclHits(B, "isp1", "101", 10));
  ok(/%SEC-6-IPACCESSLOGNP: list 101 denied 47 203\.0\.113\.2 -> 198\.51\.100\.2, 1 packet/.test(cli(B, "isp1", "show logging")) && /an access list dropped protocol 47/.test(log(B)), "logged as protocol 47 between the tunnel endpoints", log(B));
  ok(Bench.tunnelUp(B, "hq", 0), "no keepalives: HQ's tunnel stays up/up although nothing gets through");
  conf(B, "isp1", ["int g0/1", "no ip access-group 101 in"]);
  // ip mtu / adjust-mss
  conf(B, "hq", ["int tunnel0", "ip mtu 1400", "ip tcp adjust-mss 1360"]);
  ok(/  MTU is 1400 bytes/.test(cli(B, "hq", "show ip interface tunnel0")) && /Tunnel transport MTU 1476 bytes/.test(cli(B, "hq", "show interfaces tunnel0")), "ip mtu 1400 → show ip interface says 1400; the transport MTU stays 1476");
  ok(/% Invalid input/.test(conf(B, "hq", ["int tunnel0", "ip tcp adjust-mss 200"])), "ip tcp adjust-mss accepts 500–1460");
  const rc = cli(B, "hq", "show running-config interface Tunnel0");
  ok(/interface Tunnel0\n ip address 172\.16\.0\.1 255\.255\.255\.252\n ip mtu 1400\n ip tcp adjust-mss 1360\n tunnel source GigabitEthernet0\/1\n tunnel destination 198\.51\.100\.2\nend/.test(rc) && !/tunnel mode/.test(rc), "running-config: ip lines, then tunnel source/destination; tunnel mode gre ip (default) not shown", rc);
  cli(B, "hq", "write memory"); cli(B, "hq", "reload"); cli(B, "hq", "");
  ok(Bench.tunnelUp(B, "hq", 0) && /Reply from 10\.2\.0\.10/.test(pc(B, "p1", "ping 10.2.0.10")), "write + reload: the tunnel comes back and works"); }

// ---------- 3. OSPF over the tunnel ----------
const OSPF = lan => ["router ospf 1", `network ${lan} 0.0.0.255 area 0`, "network 172.16.0.0 0.0.0.3 area 0"];
{ const B = mk({ hq: [...TUN("172.16.0.1", "198.51.100.2"), "exit", ...OSPF("10.1.0.0")], br: [...TUN("172.16.0.2", "203.0.113.2"), "exit", ...OSPF("10.2.0.0")] });
  const nb = cli(B, "hq", "show ip ospf neighbor");
  ok(/198\.51\.100\.2\s+0\s+FULL\/  -\s+00:00:\d\d\s+172\.16\.0\.2\s+Tunnel0/.test(nb) && Bench.ospfNbr(B, "hq", "198.51.100.2"), "the neighbour forms across the tunnel: FULL/  - on Tunnel0", nb);
  ok(/O        10\.2\.0\.0\/24 \[110\/1001\] via 172\.16\.0\.2, \d\d:\d\d:\d\d, Tunnel0/.test(cli(B, "hq", "show ip route ospf")), "O 10.2.0.0/24 [110/1001] via the tunnel (tunnel cost 1000 + LAN 1)", cli(B, "hq", "show ip route ospf"));
  const oi = cli(B, "hq", "show ip ospf interface tunnel0");
  ok(/Process ID 1, Router ID 203\.0\.113\.2, Network Type POINT_TO_POINT, Cost: 1000/.test(oi), "show ip ospf interface Tunnel0: POINT_TO_POINT, cost 1000 (BW 100 Kbit/s)", oi);
  ok(/Reply from 10\.2\.0\.10: bytes=32 time<1ms TTL=126/.test(pc(B, "p1", "ping 10.2.0.10")), "PC1 → PC2 over the OSPF route");
  ok(/%OSPF-5-ADJCHG: Process 1, Nbr 198\.51\.100\.2 on Tunnel0 from LOADING to FULL, Loading Done/.test(cli(B, "hq", "show logging")), "ADJCHG logged");
  conf(B, "hq", ["int tunnel0", "bandwidth 10000"]); conf(B, "br", ["int tunnel0", "bandwidth 10000"]);
  ok(Bench.route(B, "hq", "10.2.0.0/24", "O").metric===11, "bandwidth 10000 on both tunnels → cost 10 (route metric 11)");
  // keepalive: the far end changes its destination by mistake
  conf(B, "br", ["int tunnel0", "tunnel destination 203.0.113.99"]);
  ok(Bench.tunnelUp(B, "hq", 0) && !Bench.ospfNbr(B, "hq", "198.51.100.2"), "BR's destination typo: HQ's tunnel still up/up (no keepalives) but the neighbour is gone");
  const ka = conf(B, "hq", ["int tunnel0", "keepalive 10 3"]);
  ok(!Bench.tunnelUp(B, "hq", 0) && Bench.tunnelWhy(B, "hq", 0)==="keepalive" && /changed state to down/.test(ka) && /Keepalive set \(10 sec\), retries 3/.test(cli(B, "hq", "show interfaces tunnel0")), "keepalive 10 3 on HQ: no replies → up/down", ka);
  ok(/ keepalive 10 3\n tunnel source/.test(cli(B, "hq", "show running-config")), "running-config: keepalive before the tunnel lines");
  conf(B, "br", ["int tunnel0", "tunnel destination 203.0.113.2"]);
  ok(Bench.tunnelUp(B, "hq", 0) && Bench.ospfNbr(B, "hq", "198.51.100.2"), "destination fixed: keepalives answered, up/up, neighbour back");
  const L = cli(B, "hq", "show logging").split("\n").filter(l=>/Tunnel0/.test(l)).slice(-2);
  ok(/LINEPROTO.*Tunnel0, changed state to up/.test(L[0]) && /ADJCHG.*Tunnel0 from LOADING to FULL/.test(L[1]), "logged in order: line protocol up, then the adjacency", L.join("\n")); }

// ---------- 4. recursive routing ----------
{ const B = mk({ hq: [...TUN("172.16.0.1", "198.51.100.2"), "exit", ...OSPF("10.1.0.0")], br: [...TUN("172.16.0.2", "203.0.113.2"), "exit", ...OSPF("10.2.0.0")] });
  ok(Bench.ospfNbr(B, "hq", "198.51.100.2"), "start: the adjacency is up");
  conf(B, "br", ["router ospf 1", "network 0.0.0.0 255.255.255.255 area 0"]);   // BR now advertises its WAN subnet 198.51.100.0/30 — the tunnel destination — INTO the tunnel
  ok(!Bench.tunnelUp(B, "hq", 0) && Bench.recursive(B, "hq", 0) && Bench.tunnelWhy(B, "hq", 0)==="recursive", "HQ learned its tunnel destination through the tunnel → disabled");
  const L = cli(B, "hq", "show logging").split("\n").filter(l=>/Tunnel0/.test(l)).slice(-3);
  ok(/%TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing/.test(L[0]) && /%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down/.test(L[1]) && /%OSPF-5-ADJCHG: Process 1, Nbr 198\.51\.100\.2 on Tunnel0 from FULL to DOWN/.test(L[2]), "log: RECURDOWN, line protocol down, then the neighbour goes", L.join("\n"));
  ok(Bench.logged(B, "hq", /TUN-5-RECURDOWN/) && !Bench.recursive(B, "br", 0), "BR's tunnel isn't recursive (HQ advertises only its LAN)");
  ok(/S\*    0\.0\.0\.0\/0 \[1\/0\] via 203\.0\.113\.1/.test(cli(B, "hq", "show ip route")) && !/198\.51\.100\.0/.test(cli(B, "hq", "show ip route")), "with the tunnel down HQ is back on its default route (real IOS: it comes back up, relearns the route and flaps)");
  conf(B, "br", ["router ospf 1", "no network 0.0.0.0 255.255.255.255 area 0"]);
  ok(Bench.tunnelUp(B, "hq", 0) && !Bench.recursive(B, "hq", 0) && Bench.ospfNbr(B, "hq", "198.51.100.2"), "fix BR's network statements → up/up, adjacency back");
  // the same fault seen from the console of the router that learns the bad route
  const B2 = mk({ hq: [...TUN("172.16.0.1", "198.51.100.2"), "exit", ...OSPF("10.1.0.0")], br: [...TUN("172.16.0.2", "203.0.113.2"), "exit", ...OSPF("10.2.0.0")] });
  const c = conf(B2, "hq", ["router ospf 1", "network 203.0.113.0 0.0.0.3 area 0"]);   // now BR learns HQ's WAN subnet (BR's destination) over the tunnel
  ok(Bench.recursive(B2, "br", 0) && !Bench.recursive(B2, "hq", 0) && !/RECURDOWN/.test(c), "HQ advertising its WAN subnet makes BR recursive (HQ's console shows nothing)");
  ok(/%TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing/.test(cli(B2, "br", "show logging")), "BR logs it");
  const c2 = conf(B2, "br", ["ip route 203.0.113.2 255.255.255.255 198.51.100.1"]);   // the classic fix: a host route to the destination via the underlay
  ok(Bench.tunnelUp(B2, "br", 0) && Bench.ospfNbr(B2, "br", "203.0.113.2") && /Tunnel0, changed state to up/.test(c2), "a /32 static to the destination via the ISP beats the OSPF /30 → up again (printed on BR's console)", c2); }

// ---------- 4b. tunnels and VRFs: the tunnel (overlay) in a tenant VRF; the WAN (underlay) in a front-door VRF with "tunnel vrf" ----------
{ const V = (lan, wan, gw, tip, dst, far) => ["vrf definition CORP", "address-family ipv4", "exit-address-family", "exit", "vrf definition INET", "address-family ipv4", "exit-address-family", "exit",
    "int g0/0", "vrf forwarding CORP", `ip address ${lan} 255.255.255.0`, "int g0/1", "vrf forwarding INET", `ip address ${wan} 255.255.255.252`, "exit", "no ip route 0.0.0.0 0.0.0.0 " + gw, `ip route vrf INET 0.0.0.0 0.0.0.0 ${gw}`,
    "interface Tunnel0", "vrf forwarding CORP", `ip address ${tip} 255.255.255.252`, "tunnel source g0/1", `tunnel destination ${dst}`, "exit", `ip route vrf CORP ${far} 255.255.255.0 Tunnel0`];
  const B = mk({ hq: V("10.1.0.1", "203.0.113.2", "203.0.113.1", "172.16.0.1", "198.51.100.2", "10.2.0.0"), br: V("10.2.0.1", "198.51.100.2", "198.51.100.1", "172.16.0.2", "203.0.113.2", "10.1.0.0") });
  ok(!Bench.tunnelUp(B, "hq", 0) && Bench.tunnelWhy(B, "hq", 0)==="source down", "the source is in VRF INET but the tunnel looks in the global table → down");
  conf(B, "hq", ["int tunnel0", "tunnel vrf INET"]); conf(B, "br", ["int tunnel0", "tunnel vrf INET"]);
  ok(Bench.tunnelUp(B, "hq", 0) && Bench.tunnelUp(B, "br", 0) && / tunnel destination 198\.51\.100\.2\n tunnel vrf INET\n/.test(cli(B, "hq", "show running-config")), "tunnel vrf INET: the underlay lookup uses INET's default route → up/up");
  ok(/Reply from 10\.2\.0\.10: bytes=32 time<1ms TTL=126/.test(pc(B, "p1", "ping 10.2.0.10")) && /routes it in VRF CORP/.test(log(B)), "CORP LAN → tunnel (in CORP) → CORP LAN", log(B));
  ok(Bench.vrfRoute(B, "hq", "CORP", "172.16.0.0/30", "C") && !Bench.route(B, "hq", "172.16.0.0/30"), "the tunnel's connected route is in CORP, not global"); }

// ---------- 5. without a bench: the CLI alone ----------
{ const e = SIM.ios2Env({kind:"router", host:"R9"}), x = c => { const r = e.exec(c); return typeof r==="string" ? r : (r.text||"") + (r.ask||""); };
  ["en", "conf t", "int g0/1", "ip address 198.51.100.2 255.255.255.252", "no shut", "exit", "ip route 0.0.0.0 0.0.0.0 198.51.100.1", "int tu1", "ip address 10.255.255.1 255.255.255.0", "tunnel source GigabitEthernet0/1"].forEach(x);
  ok(/changed state to up/.test(x("tunnel destination 203.0.113.50")) && e.prompt()==="R9(config-if)#", "abbreviation tu1, standalone env: up once routable");
  ok(/^Tunnel1\s+10\.255\.255\.1\s+YES manual up\s+up$/m.test(x("do show ip interface brief")), "show ip interface brief row");
  ok(/% Invalid input/.test(x("ip mtu 20")), "ip mtu range"); x("exit");
  ok(x("no interface tunnel1")==="" && !e.intfs.Tunnel1, "no interface Tunnel1 deletes it"); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
