#!/usr/bin/env node
// Ladder Lab — IPv6 engine tests: addresses (EUI-64, link-local), router RIB, SLAAC from router advertisements, Neighbor
// Discovery, IPv6 ping/traceroute on IOS and Windows, static (incl. link-local next hop and floating) routes.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["sim.js", "ipv6.js", "sim_ios.js", "bench.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
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
  ok(/S   ::\/0 \[1\/0\]\n     via GigabitEthernet0\/1, FE80::12:1/.test(rt), "R2's default route via interface + link-local next hop", rt); }
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
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
