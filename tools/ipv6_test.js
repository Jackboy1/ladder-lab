#!/usr/bin/env node
// Ladder Lab — IPv6 engine tests: addresses (EUI-64, link-local), router RIB, SLAAC from router advertisements, Neighbor
// Discovery, IPv6 ping/traceroute on IOS and Windows, static (incl. link-local next hop and floating) routes.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["sim.js", "ipv6.js", "acl.js", "dhcp.js", "nat.js", "sim_ios.js", "bench.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const { Bench, SIM } = ctx; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra) console.log(String(extra).split("\n").map(l=>"      "+l).join("\n")); } else console.log("ok  ", msg); };
const cfg = cmds => e => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); };
const out = r => typeof r.out === "string" ? r.out : (r.out && ((r.out.text||"") + (r.out.ask||""))) || r.msg || "";
const cli = (B, id, c) => out(Bench.act(B, ["cli", id, c]));
const pc = (B, id, c) => out(Bench.act(B, ["pc", id, c]));
const mk = (r1x, r2x, pcs) => Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["ipv6 unicast-routing","int g0/0","ipv6 address 2001:db8:acad:1::1/64","ipv6 address fe80::1 link-local","no shut","int g0/1","ipv6 address 2001:db8:acad:12::1/64","ipv6 address fe80::12:1 link-local","no shut","int g0/2","ipv6 enable","no shut","ipv6 route 2001:db8:acad:2::/64 2001:db8:acad:12::2", ...(r1x||[])]) },
    { id:"r2", kind:"router", label:"R2", x:300, y:0, config: cfg(["ipv6 unicast-routing","int g0/0","ipv6 address 2001:db8:acad:2::1/64","ipv6 address fe80::2 link-local","no shut","int g0/1","ipv6 address 2001:db8:acad:12::2/64","no shut","ipv6 route ::/0 g0/1 fe80::12:1", ...(r2x||[])]) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:350, ip:"192.168.1.10", mask:"255.255.255.0", gw:"192.168.1.1" },
    { id:"p2", kind:"pc", label:"PC2", x:300, y:350, ip6:{auto:false, addr:"2001:db8:acad:2::10", len:64, gw:"fe80::2"} } ],
  cables: [{type:"cat6",a:"r1:g0",b:"sw:g1"},{type:"cat6",a:"p1:eth",b:"sw:g2"},{type:"cat6",a:"r1:g1",b:"r2:g1"},{type:"cat6",a:"p2:eth",b:"r2:g0"}] });
{ const B = mk();
  const ll2 = (cli(B, "r1", "show ipv6 interface brief").match(/GigabitEthernet0\/2[^\n]*\n\s+(FE80::\S+)/)||[])[1];
  ok(ll2===ctx.IP6.str(ctx.IP6.linkLocal(B.devs.r1.env.intfs["GigabitEthernet0/2"].mac), true), "R1 G0/2 (ipv6 enable) link-local is EUI-64 from its MAC", cli(B, "r1", "show ipv6 interface brief"));
  const ip = pc(B, "p1", "ipconfig");
  ok(/IPv6 Address\. \. \. \. \. \. \. \. \. \. \. : 2001:db8:acad:1:[0-9a-f:]+\n/.test(ip) && /Link-local IPv6 Address \. \. \. \. \. : fe80::[0-9a-f:]+%4/.test(ip) && /Default Gateway \. \. \. \. \. \. \. \. \. : fe80::1%4\n\s+192\.168\.1\.1/.test(ip), "PC1 gets a SLAAC address from R1's RA; gateway = R1's link-local fe80::1", ip);
  const pg = pc(B, "p1", "ping 2001:db8:acad:2::10");
  ok(/Reply from 2001:db8:acad:2::10: time<1ms/.test(pg), "PC1 pings PC2 over IPv6 across two routers", pg);
  const tr = pc(B, "p1", "tracert 2001:db8:acad:2::10");
  ok(/1\s+<1 ms\s+<1 ms\s+<1 ms\s+2001:db8:acad:1::1\n\s+2\s+<1 ms\s+<1 ms\s+<1 ms\s+2001:db8:acad:12::2\n\s+3\s+<1 ms\s+<1 ms\s+<1 ms\s+2001:db8:acad:2::10/.test(tr), "tracert shows R1, R2, PC2", tr);
  ok(/2001:DB8:ACAD:1:[0-9A-F:]+\s+0 [0-9a-f.]{14}\s+REACH Gi0\/0|FE80::[0-9A-F:]+\s+0 [0-9a-f.]{14}\s+REACH Gi0\/0/.test(cli(B, "r1", "show ipv6 neighbors")), "R1's show ipv6 neighbors lists PC1 (learned by ND)", cli(B, "r1", "show ipv6 neighbors"));
  ok(/!!!!!/.test(cli(B, "r1", "ping 2001:db8:acad:2::10")), "IOS ping to a global address across R2", cli(B, "r1", "ping 2001:db8:acad:2::10"));
  const r2ll = ctx.IP6.str(ctx.IP6.linkLocal(B.devs.r2.env.intfs["GigabitEthernet0/1"].mac));
  const llp = Bench.act(B, ["cli", "r1", "ping " + r2ll]);
  ok(/Output Interface:/.test(out(llp)), "pinging a link-local address asks for the output interface, like IOS", out(llp));
  ok(/!!!!!/.test(cli(B, "r1", "g0/1")) , "… and succeeds out of G0/1 (R2's link-local)");
  ok(/Reply from 2001:db8:acad:1::1: Destination net unreachable\./.test(pc(B, "p1", "ping 2001:db8:acad:99::1")), "no route on R1 → ICMPv6 destination unreachable (no route) back to PC1", pc(B, "p1", "ping 2001:db8:acad:99::1"));
  const rt = cli(B, "r2", "show ipv6 route");
  ok(/S   ::\/0 \[1\/0\]\n     via FE80::12:1, GigabitEthernet0\/1\n/.test(rt), "R2's default route: next hop first, then the interface (real IOS order)", rt);
  ok(/S   2001:DB8:ACAD:2::\/64 \[1\/0\]\n     via 2001:DB8:ACAD:12::2($|\n)/.test(cli(B, "r1", "show ipv6 route static")), "a next-hop-only static prints just the next hop");
  const con = cli(B, "r1", "show ipv6 route connected"), loc = cli(B, "r1", "show ipv6 route local");
  ok(/C   2001:DB8:ACAD:1::\/64/.test(con) && !/\nL   /.test(con) && /L   2001:DB8:ACAD:1::1\/128/.test(loc) && /L   FF00::\/8/.test(loc) && !/\nC   /.test(loc), "show ipv6 route connected = C lines only; local = L lines (and FF00::/8)", con + "\n----\n" + loc);
  const re = cli(B, "r1", "show ipv6 route 2001:db8:acad:2::10");
  ok(/^Routing entry for 2001:DB8:ACAD:2::\/64\n  Known via "static", distance 1, metric 0\n  Route count is 1\/1, share count 0\n  Routing paths:\n    2001:DB8:ACAD:12::2\n      Last updated \d\d:\d\d:\d\d ago$/.test(re), "show ipv6 route <address> — the longest-match entry", re);
  ok(/Known via "connected", distance 0, metric 0, type connected[\s\S]*directly connected via GigabitEthernet0\/0/.test(cli(B, "r1", "show ipv6 route 2001:db8:acad:1::/64")), "show ipv6 route <prefix>");
  ok(cli(B, "r1", "show ipv6 route 2001:db8:ffff::1")==="% Route not found", "no match → % Route not found");
  const sp = Bench.act(B, ["cli", "r1", "ping 2001:db8:acad:2::10 source g0/0"]);
  ok(/Packet sent with a source address of 2001:DB8:ACAD:1::1\n!!!!!/.test(out(sp)), "ping … source g0/0 sends FROM G0/0's address (R2 has a way back to it)", out(sp));
  ok(/% No valid route for destination\nSuccess rate is 0 percent \(0\/1\)/.test(cli(B, "r1", "ping 2001:db8:acad:99::1")), "router ping with no IPv6 route: % No valid route for destination");
  ok(/Reply from 2001:db8:acad:2::10: time/.test(pc(B, "p1", "ping -6 2001:db8:acad:2::10")) && /Reply from 192\.168\.1\.1|Pinging 192\.168\.1\.1/.test(pc(B, "p1", "ping -4 192.168.1.1")), "Windows ping -6 / -4 accepted", pc(B, "p1", "ping -4 192.168.1.1"));
  const wp = pc(B, "p1", "ping 2001:db8:acad:2::10");
  ok(/time<1ms\n\nPing statistics for 2001:db8:acad:2::10:\n    Packets: Sent = 4, Received = 4, Lost = 0 \(0% loss\),\nApproximate round trip times in milli-seconds:\n    Minimum = 0ms, Maximum = 0ms, Average = 0ms$/.test(wp), "Windows ping output: blank line, statistics and round-trip summary", wp);
  const llp4 = pc(B, "p1", "ping fe80::1%4");
  ok(/Pinging fe80::1%4 with 32 bytes of data:\nReply from fe80::1%4: time<1ms/.test(llp4), "Windows ping to a link-local address shows the %zone", llp4); }
{ // RAs from an interface with only a link-local address: gateway yes, global address no; same for a non-/64 prefix
  const B = mk(["int g0/0","no ipv6 address","ipv6 enable"]);
  const ip = pc(B, "p1", "ipconfig");
  ok(!/   IPv6 Address\./.test(ip) && /Default Gateway \. \. \. \. \. \. \. \. \. : fe80::[0-9a-f:]+%4/.test(ip), "LAN with only 'ipv6 enable': the RA gives PC1 a gateway but no global address", ip);
  const B2 = mk(["int g0/0","no ipv6 address","ipv6 address 2001:db8:acad:1::1/120"]);
  const ip2 = pc(B2, "p1", "ipconfig");
  ok(!/   IPv6 Address\./.test(ip2) && /Default Gateway \. \. \. \. \. \. \. \. \. : fe80::[0-9a-f:]+%4/.test(ip2), "a /120 is advertised but SLAAC can't use it: gateway only", ip2);
  Bench.act(B2, ["ip6", "p1", "auto"]);
  ok(/Router Solicitation[\s\S]*Router Advertisement[\s\S]*prefix 2001:db8:acad:1::\/120[\s\S]*isn't a \/64/.test(B2.log.join("\n")), "choosing automatic IPv6 shows the RS and RA in the frame log", B2.log.join("\n")); }
{ // the "Reply from undefined" bug: R1's next hop is in a connected /64 but nobody answers ND
  const B3 = mk(["no ipv6 route 2001:db8:acad:2::/64 2001:db8:acad:12::2", "ipv6 route 2001:db8:acad:2::/64 2001:db8:acad:12::77"]);
  const r = pc(B3, "p1", "ping 2001:db8:acad:2::10");
  ok(/Reply from 2001:db8:acad:1::1: Destination host unreachable\./.test(r) && !/undefined/.test(r), "a next hop that doesn't answer ND → R1 reports Destination host unreachable (no 'undefined')", r); }
{ // recursive statics don't resolve through ::/0 by default
  const B = mk(["ipv6 route ::/0 2001:db8:acad:12::2", "ipv6 route 2001:db8:acad:50::/64 2001:db8:acad:60::1"]);
  ok(!/2001:DB8:ACAD:50::/.test(cli(B, "r1", "show ipv6 route static")), "a static whose next hop is only reachable via ::/0 is NOT installed", cli(B, "r1", "show ipv6 route static"));
  cfg(["ipv6 route static resolve default"])(B.devs.r1.env);
  ok(/S   2001:DB8:ACAD:50::\/64 \[1\/0\]\n     via 2001:DB8:ACAD:60::1/.test(cli(B, "r1", "show ipv6 route static")) && /ipv6 route static resolve default/.test(cli(B, "r1", "show running-config")), "… until 'ipv6 route static resolve default'", cli(B, "r1", "show ipv6 route static")); }
{ // IPv6 traceroute needs a return path (R2 loses its default route back to R1's side)
  const B = mk(null, ["no ipv6 route ::/0 g0/1 fe80::12:1"]);
  const tr = pc(B, "p1", "tracert 2001:db8:acad:2::10");
  ok(/  1    <1 ms    <1 ms    <1 ms  2001:db8:acad:1::1\n  2     \*        \*        \*     Request timed out\./.test(tr), "tracert -6: R2 and PC2 can't route back → * * * from hop 2", tr);
  const ntr = pc(B, "p1", "tracert 2001:db8:acad:99::1");
  ok(/  1  2001:db8:acad:1::1  reports: Destination net unreachable\./.test(ntr), "tracert -6 to a prefix R1 has no route for: 'Destination net unreachable.'", ntr); }
{ const e = SIM.ios2Env({kind:"router"}); for (const c of ["en","conf t","int g0/0","ipv6 address 2001:db8:5::1/64","no shut","int g0/1","no shut","ipv6 address 2001:db8:5::2/64","end"]) e.exec(c);
  ok(/^%GigabitEthernet0\/1: Error: 2001:DB8:5::\/64 is overlapping with 2001:DB8:5::\/64 on GigabitEthernet0\/0$/.test((e.exec("conf t"), e.exec("int g0/1"), e.exec("ipv6 address 2001:db8:5::2/64"))), "overlap error names the interface being configured, like IOS");
  e.exec("int lo0"); e.exec("ipv6 address 2001:db8:ff::1/128"); e.exec("int g0/0"); e.exec("ipv6 address 2001:db8:abc::/64 eui-64"); e.exec("no ipv6 address 2001:db8:abc::/64 eui-64");
  e.exec("int g0/2"); e.exec("no shut"); e.exec("ipv6 address 2001:db8:77::/64 anycast"); e.exec("end");
  const rt = e.exec("show ipv6 route");
  ok(/LC  2001:DB8:FF::1\/128 \[0\/0\]\n     via Loopback0, receive/.test(rt), "a /128 on a loopback is LC", rt);
  ok(!/2001:DB8:ABC:/.test(e.exec("show ipv6 interface brief")), "no ipv6 address … eui-64 removes it");
  ok(/2001:DB8:77::, subnet is 2001:DB8:77::\/64 \[ANY\]/.test(e.exec("show ipv6 interface g0/2")) && / ipv6 address 2001:DB8:77::\/64 anycast/.test(e.exec("show running-config")), "anycast address", e.exec("show ipv6 interface g0/2"));
  e.exec("conf t"); e.exec("int g0/1"); e.exec("ipv6 enable"); e.exec("end");
  const ll = Bench.create({ devices: [ { id:"r", kind:"router", label:"R", x:0, y:0, config: cfg(["int g0/0","ipv6 enable","no shut"]) } ], cables: [] });
  ok(/No global unicast address is configured/.test(cli(ll, "r", "show ipv6 interface g0/0")), "an interface with only a link-local says 'No global unicast address is configured'", cli(ll, "r", "show ipv6 interface g0/0")); }
{ const B = mk(); cli(B, "r1", "ping 2001:db8:acad:1::" + "1"); pc(B, "p1", "ping 2001:db8:acad:2::10");
  const nb = cli(B, "r1", "show ipv6 neighbors");
  ok(/^IPv6 Address                              Age Link-layer Addr State Interface\n\S+\s+0 [0-9a-f.]{14}  REACH Gi0\/0/.test(nb), "show ipv6 neighbors: columns line up under the header", nb);
  const l1 = Bench.act(B, ["cli", "r1", "ping fe80::2"]); const l2 = out(Bench.act(B, ["cli", "r1", "Gi 0/1"]));
  ok(/Invalid interface\. Use full interface name without spaces/.test(l2), "Output Interface: a name with a space is refused, like IOS", l2); }

{ // no ipv6 unicast-routing on R1: no RA (PC1 has only a link-local address) and no forwarding
  const B = mk(["no ipv6 unicast-routing"]);
  const ip = pc(B, "p1", "ipconfig");
  ok(!/   IPv6 Address\./.test(ip) && /Link-local IPv6 Address/.test(ip), "R1 without ipv6 unicast-routing sends no RAs: PC1 has only a link-local address", ip);
  ok(/General failure/.test(pc(B, "p1", "ping 2001:db8:acad:2::10")), "… and PC1 has no IPv6 gateway (General failure)"); }
{ // a floating IPv6 static
  const B = mk(["int g0/2","ipv6 address 2001:db8:acad:13::1/64","no shut","ipv6 route 2001:db8:acad:2::/64 2001:db8:acad:13::3 200"]);
  ok(/S   2001:DB8:ACAD:2::\/64 \[1\/0\]\n     via 2001:DB8:ACAD:12::2/.test(cli(B, "r1", "show ipv6 route static")) && !/\[200\/0\]/.test(cli(B, "r1", "show ipv6 route static")), "floating IPv6 static stays hidden behind the AD-1 route", cli(B, "r1", "show ipv6 route static")); }
{ // static addressing on PC1 and a wrong gateway
  const B = mk(); Bench.act(B, ["ip6", "p1", "static", "2001:db8:acad:1::50", "64", "fe80::99"]);
  ok(/Reply from 2001:db8:acad:1::50: Destination host unreachable\./.test(pc(B, "p1", "ping 2001:db8:acad:2::10")), "a wrong IPv6 gateway: ND for it fails → Destination host unreachable from the PC itself", pc(B, "p1", "ping 2001:db8:acad:2::10"));
  Bench.act(B, ["ip6", "p1", "static", "2001:db8:acad:1::50", "64", "fe80::1"]);
  ok(/Reply from 2001:db8:acad:2::10/.test(pc(B, "p1", "ping 2001:db8:acad:2::10")), "corrected gateway: it works"); }
{ const e = SIM.ios2Env({kind:"router"}); for (const c of ["en","conf t","int g0/0","ipv6 address 2001:db8:acad:10::/64 eui-64","no shut","end"]) e.exec(c);
  ok(/2001:DB8:ACAD:10:E1A:2BFF:FE00:1, subnet is 2001:DB8:ACAD:10::\/64 \[EUI\]/.test(e.exec("show ipv6 interface g0/0")), "eui-64 address shows [EUI] in show ipv6 interface", e.exec("show ipv6 interface g0/0"));
  ok(/% Interface has to be specified for a link-local nexthop/.test((e.exec("conf t"), e.exec("ipv6 route ::/0 fe80::5"))), "link-local next hop without an interface is refused"); }
{ const B = mk();
  const t3 = cli(B, "r2", "traceroute 2001:db8:acad:77::1"); ok(/!N  !N  !N/.test(t3), "ICMPv6 no-route on a router-run traceroute shows !N", t3);
  const B4 = mk(["no ipv6 unicast-routing"]); const w = pc(B4, "p1", "tracert 2001:db8:acad:2::10");
  ok(w === "\nTracing route to 2001:db8:acad:2::10 over a maximum of 30 hops\n\n  1  Transmit error: code 1231.\n\nTrace complete.", "Windows tracert -6 with no IPv6 gateway: the trace frame around 'Transmit error: code 1231.'", w);
  ok(/NDr - Redirect, RL - RPL, O - OSPF Intra[\s\S]*lp - LISP publications, a - Application, m - OMP/.test(cli(B, "r1", "show ipv6 route")), "IOS XE 17 legend"); }
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
