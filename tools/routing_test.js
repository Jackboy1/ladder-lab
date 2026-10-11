#!/usr/bin/env node
// Ladder Lab — routing engine tests: RIB (administrative distance, longest match, static resolution), OSPF (neighbours, DR/BDR,
// SPF, costs, passive, mismatches, inter-area, default route), HSRP failover and traceroute — all on the real bench topology.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["sim.js", "sim_ios.js", "bench.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const { Bench, SIM } = ctx; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra) console.log(String(extra).split("\n").map(l=>"      "+l).join("\n")); } else console.log("ok  ", msg); };
const cfg = cmds => e => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); };
const cli = (B, id, c) => { const r = Bench.act(B, ["cli", id, c]); return typeof r.out === "string" ? r.out : (r.out && r.out.text) || ""; };
const pc = (B, id, c) => { const r = Bench.act(B, ["pc", id, c]); return typeof r.out === "string" ? r.out : JSON.stringify(r); };
const R = (id, label, cmds, x) => ({ id, kind:"router", label, x: x||0, y:0, config: cfg(cmds) });
const PC = (id, ip, gw) => ({ id, kind:"pc", label:id.toUpperCase(), x:0, y:300, ip, mask:"255.255.255.0", gw });

// ---------- 1. a triangle of routers, each with a LAN, OSPF area 0 ----------
const tri = (extra) => Bench.create({ devices: [
    R("r1", "R1", ["int lo0","ip address 1.1.1.1 255.255.255.255","int g0/0","ip address 10.1.0.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.1 255.255.255.252","no shut","int g0/2","ip address 10.0.13.1 255.255.255.252","no shut",
      "router ospf 1","network 10.0.0.0 0.255.255.255 area 0","network 1.1.1.1 0.0.0.0 area 0","passive-interface g0/0", ...(extra && extra.r1 || [])]),
    R("r2", "R2", ["int lo0","ip address 2.2.2.2 255.255.255.255","int g0/0","ip address 10.2.0.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.2 255.255.255.252","no shut","int g0/2","ip address 10.0.23.1 255.255.255.252","no shut",
      "router ospf 1","network 10.0.0.0 0.255.255.255 area 0","network 2.2.2.2 0.0.0.0 area 0","passive-interface g0/0", ...(extra && extra.r2 || [])]),
    R("r3", "R3", ["int lo0","ip address 3.3.3.3 255.255.255.255","int g0/0","ip address 10.3.0.1 255.255.255.0","no shut","int g0/1","ip address 10.0.13.2 255.255.255.252","no shut","int g0/2","ip address 10.0.23.2 255.255.255.252","no shut",
      "router ospf 1","network 10.0.0.0 0.255.255.255 area 0","network 3.3.3.3 0.0.0.0 area 0","passive-interface g0/0", ...(extra && extra.r3 || [])]),
    PC("pc1", "10.1.0.10", "10.1.0.1"), PC("pc2", "10.2.0.10", "10.2.0.1"), PC("pc3", "10.3.0.10", "10.3.0.1") ],
  cables: [{type:"cat6",a:"r1:g1",b:"r2:g1"},{type:"cat6",a:"r1:g2",b:"r3:g1"},{type:"cat6",a:"r2:g2",b:"r3:g2"},{type:"cat6",a:"pc1:eth",b:"r1:g0"},{type:"cat6",a:"pc2:eth",b:"r2:g0"},{type:"cat6",a:"pc3:eth",b:"r3:g0"}] });
{ const B = tri();
  const nb = cli(B, "r1", "show ip ospf neighbor");
  ok(/2\.2\.2\.2\s+1\s+FULL\/(DR|BDR)\s+00:00:\d\d\s+10\.0\.12\.2\s+GigabitEthernet0\/1/.test(nb) && /3\.3\.3\.3\s+1\s+FULL\/(DR|BDR)\s+00:00:\d\d\s+10\.0\.13\.2\s+GigabitEthernet0\/2/.test(nb), "triangle: R1 has FULL adjacencies with R2 and R3", nb);
  ok(/2\.2\.2\.2\s+1\s+FULL\/DR/.test(nb), "on the R1–R2 link the higher router ID (2.2.2.2) is DR", nb);
  const rt = cli(B, "r1", "show ip route");
  ok(/O\s+10\.3\.0\.0\/24 \[110\/2\] via 10\.0\.13\.2, \d\d:\d\d:\d\d, GigabitEthernet0\/2/.test(rt), "R1 learns R3's LAN as O [110/2] via R3", rt);
  ok(/2\.0\.0\.0\/32 is subnetted, 1 subnets\nO\s+2\.2\.2\.2 \[110\/2\] via 10\.0\.12\.2/.test(rt), "loopbacks are advertised as /32 host routes", rt);
  ok(/O\s+10\.0\.23\.0\/30 \[110\/2\] via 10\.0\.12\.2[^\n]*\n\s+\[110\/2\] via 10\.0\.13\.2/.test(rt), "the R2–R3 link has two equal-cost paths (ECMP, both listed)", rt);
  ok(!/O\s+10\.1\.0\.0/.test(rt), "R1 doesn't learn its own LAN from OSPF");
  ok(/Reply from 10\.3\.0\.10: bytes=32 time<1ms TTL=126/.test(pc(B, "pc1", "ping 10.3.0.10")), "PC1 → PC3 across OSPF routes (two routers: TTL 126 = 128 − 2)", pc(B, "pc1", "ping 10.3.0.10"));
  const tr = pc(B, "pc1", "tracert 10.3.0.10");
  ok(/1\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.1\.0\.1\n\s+2\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.0\.13\.2\n\s+3\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.3\.0\.10/.test(tr) && /Trace complete\./.test(tr), "tracert shows gateway → R3 (ingress 10.0.13.2) → PC3", tr);
  const itr = cli(B, "r1", "traceroute 10.3.0.10");
  ok(/1 10\.0\.13\.2 \d msec/.test(itr) && /2 10\.3\.0\.10/.test(itr), "IOS traceroute from R1 lists the hops", itr);
  const br = cli(B, "r1", "show ip ospf interface brief");
  ok(/Gi0\/0\s+1\s+0\s+10\.1\.0\.1\/24\s+1\s+DR\s+0\/0/.test(br) && /Lo0\s+1\s+0\s+1\.1\.1\.1\/32\s+1\s+LOOP\s+0\/0/.test(br) && /Gi0\/1\s+1\s+0\s+10\.0\.12\.1\/30\s+1\s+BDR\s+1\/1/.test(br), "show ip ospf interface brief: passive LAN is DR 0/0, loopback LOOP, link BDR 1/1", br);
  const det = cli(B, "r1", "show ip ospf interface g0/0");
  ok(/No Hellos \(Passive interface\)/.test(det) && /Network Type BROADCAST, Cost: 1/.test(det), "passive interface: no hellos", det);
  const pr = cli(B, "r1", "show ip protocols");
  ok(/Routing Protocol is "ospf 1"/.test(pr) && /Router ID 1\.1\.1\.1/.test(pr) && /10\.0\.0\.0 0\.255\.255\.255 area 0/.test(pr) && /Passive Interface\(s\):\n\s+GigabitEthernet0\/0/.test(pr) && /2\.2\.2\.2\s+110/.test(pr), "show ip protocols: RID, networks, passive, sources", pr);
  ok(Bench.logged(B, "r1", /%OSPF-5-ADJCHG: Process 1, Nbr 2\.2\.2\.2 on GigabitEthernet0\/1 from LOADING to FULL, Loading Done/), "adjacency up is logged (ADJCHG LOADING to FULL)");
  // cost change moves traffic: make the direct R1–R3 link expensive
  cli(B, "r1", "conf t"); cli(B, "r1", "int g0/2"); cli(B, "r1", "ip ospf cost 50"); cli(B, "r1", "end");
  const rt2 = cli(B, "r1", "show ip route ospf");
  ok(/O\s+10\.3\.0\.0\/24 \[110\/3\] via 10\.0\.12\.2/.test(rt2), "ip ospf cost 50 on R1's direct link: R3's LAN now via R2, cost 3", rt2);
  // a link failure: R1–R2 down → adjacency down is logged and R1 reroutes
  cli(B, "r2", "conf t"); cli(B, "r2", "int g0/1"); cli(B, "r2", "shutdown"); cli(B, "r2", "end");
  const rt3 = cli(B, "r1", "show ip route ospf");
  ok(/O\s+10\.2\.0\.0\/24 \[110\/52\] via 10\.0\.13\.2/.test(rt3) && Bench.logged(B, "r1", /Nbr 2\.2\.2\.2 on GigabitEthernet0\/1 from FULL to DOWN, Neighbor Down: (Dead timer expired|Interface down or detached)/), "R1–R2 down: R2's LAN via R3 (50 + 1 + 1), ADJCHG down logged", rt3);
}
// ---------- 2. DR/BDR election on a shared segment (three routers on one switch) ----------
const lan = (p1, p2, p3) => Bench.create({ devices: [
    R("ra", "RA", ["int g0/0","ip address 10.9.0.1 255.255.255.0","no shut",...(p1||[]),"router ospf 1","router-id 1.1.1.1","network 10.9.0.0 0.0.0.255 area 0"]),
    R("rb", "RB", ["int g0/0","ip address 10.9.0.2 255.255.255.0","no shut",...(p2||[]),"router ospf 1","router-id 2.2.2.2","network 10.9.0.0 0.0.0.255 area 0"]),
    R("rc", "RC", ["int g0/0","ip address 10.9.0.3 255.255.255.0","no shut",...(p3||[]),"router ospf 1","router-id 3.3.3.3","network 10.9.0.0 0.0.0.255 area 0"]),
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 } ],
  cables: [{type:"cat6",a:"ra:g0",b:"sw:g1"},{type:"cat6",a:"rb:g0",b:"sw:g2"},{type:"cat6",a:"rc:g0",b:"sw:g3"}] });
{ let B = lan();
  const n = cli(B, "ra", "show ip ospf neighbor");
  ok(/3\.3\.3\.3\s+1\s+FULL\/DR/.test(n) && /2\.2\.2\.2\s+1\s+FULL\/BDR/.test(n), "equal priorities: highest RID (3.3.3.3) DR, next (2.2.2.2) BDR", n);
  const nb2 = cli(B, "rb", "show ip ospf neighbor");
  ok(/1\.1\.1\.1\s+1\s+FULL\/DROTHER/.test(nb2), "the BDR is FULL with the DROTHER", nb2);
  ok(/Designated Router \(ID\) 3\.3\.3\.3, Interface address 10\.9\.0\.3/.test(cli(B, "ra", "show ip ospf interface g0/0")) && /State DROTHER, Priority 1/.test(cli(B, "ra", "show ip ospf interface g0/0")), "show ip ospf interface: DR/BDR addresses and own state", cli(B, "ra", "show ip ospf interface g0/0"));
  // priority 255 on RA: no preemption until the DR and BDR restart OSPF
  cli(B, "ra", "conf t"); cli(B, "ra", "int g0/0"); cli(B, "ra", "ip ospf priority 255"); cli(B, "ra", "end");
  ok(/3\.3\.3\.3\s+1\s+FULL\/DR/.test(cli(B, "ra", "show ip ospf neighbor")), "raising RA's priority doesn't preempt the sitting DR");
  for (const r of ["rc", "rb"]){ cli(B, r, "clear ip ospf process"); cli(B, r, "yes"); }
  const n3 = cli(B, "rb", "show ip ospf neighbor");
  ok(/1\.1\.1\.1\s+255\s+FULL\/DR/.test(n3), "after clear ip ospf process on DR and BDR, RA (priority 255) becomes DR", n3);
  // a DROTHER pair sits at 2WAY
  B = lan(null, null, null); const B4 = Bench.create({ devices: [
    R("ra", "RA", ["int g0/0","ip address 10.9.0.1 255.255.255.0","no shut","router ospf 1","router-id 1.1.1.1","network 10.9.0.0 0.0.0.255 area 0"]),
    R("rb", "RB", ["int g0/0","ip address 10.9.0.2 255.255.255.0","no shut","router ospf 1","router-id 2.2.2.2","network 10.9.0.0 0.0.0.255 area 0"]),
    R("rc", "RC", ["int g0/0","ip address 10.9.0.3 255.255.255.0","no shut","router ospf 1","router-id 3.3.3.3","network 10.9.0.0 0.0.0.255 area 0"]),
    R("rd", "RD", ["int g0/0","ip address 10.9.0.4 255.255.255.0","no shut","router ospf 1","router-id 4.4.4.4","network 10.9.0.0 0.0.0.255 area 0"]),
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 } ], cables: [{type:"cat6",a:"ra:g0",b:"sw:g1"},{type:"cat6",a:"rb:g0",b:"sw:g2"},{type:"cat6",a:"rc:g0",b:"sw:g3"},{type:"cat6",a:"rd:g0",b:"sw:g4"}] });
  ok(/2\.2\.2\.2\s+1\s+2WAY\/DROTHER/.test(cli(B4, "ra", "show ip ospf neighbor")), "two DROTHERs stay at 2WAY/DROTHER", cli(B4, "ra", "show ip ospf neighbor"));
  // priority 0 never becomes DR/BDR
  const B5 = lan(null, null, ["ip ospf priority 0"]);
  ok(/2\.2\.2\.2\s+1\s+FULL\/DR/.test(cli(B5, "ra", "show ip ospf neighbor")) && /3\.3\.3\.3\s+0\s+FULL\/DROTHER/.test(cli(B5, "ra", "show ip ospf neighbor")), "priority 0: never DR/BDR", cli(B5, "ra", "show ip ospf neighbor"));
}
// ---------- 3. hello checks: mismatches that stop an adjacency ----------
const pair = (a, b) => Bench.create({ devices: [ R("x", "RX", ["int g0/0","ip address 10.5.0.1 255.255.255.252","no shut",...a]), R("y", "RY", ["int g0/0","ip address 10.5.0.2 255.255.255.252","no shut",...b]) ],
  cables: [{type:"cat6",a:"x:g0",b:"y:g0"}] });
{ const base = rid => ["router ospf 1",`router-id ${rid}`];
  let B = pair([...base("1.1.1.1"),"network 10.5.0.0 0.0.0.3 area 0"], [...base("2.2.2.2"),"network 10.5.0.0 0.0.0.3 area 1"]);
  ok(!/FULL/.test(cli(B, "x", "show ip ospf neighbor")) && Bench.logged(B, "x", /%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID/), "area mismatch: no neighbour, ERRRCV logged");
  B = pair(["int g0/0","ip ospf hello-interval 5",...base("1.1.1.1"),"network 10.5.0.0 0.0.0.3 area 0"], [...base("2.2.2.2"),"network 10.5.0.0 0.0.0.3 area 0"]);
  ok(!/FULL/.test(cli(B, "x", "show ip ospf neighbor")) && /Hello 5, Dead 20/.test(cli(B, "x", "show ip ospf interface g0/0")), "hello 5 vs 10: no neighbour; dead follows hello ×4");
  B = pair([...base("9.9.9.9"),"network 10.5.0.0 0.0.0.3 area 0"], [...base("9.9.9.9"),"network 10.5.0.0 0.0.0.3 area 0"]);
  ok(!/FULL/.test(cli(B, "x", "show ip ospf neighbor")) && Bench.logged(B, "x", /DUP_RTRID_NBR: OSPF detected duplicate router-id 9\.9\.9\.9/), "duplicate router ID: no neighbour, DUP_RTRID logged");
  B = pair([...base("1.1.1.1"),"network 10.5.0.0 0.0.0.3 area 0","passive-interface g0/0"], [...base("2.2.2.2"),"network 10.5.0.0 0.0.0.3 area 0"]);
  ok(!/FULL/.test(cli(B, "y", "show ip ospf neighbor")), "passive interface: no neighbour");
  B = pair(["int g0/0","ip ospf network point-to-point",...base("1.1.1.1"),"network 10.5.0.0 0.0.0.3 area 0"], ["int g0/0","ip ospf network point-to-point",...base("2.2.2.2"),"network 10.5.0.0 0.0.0.3 area 0"]);
  ok(/2\.2\.2\.2\s+0\s+FULL\/  -/.test(cli(B, "x", "show ip ospf neighbor")) || /2\.2\.2\.2\s+1\s+FULL\/  -/.test(cli(B, "x", "show ip ospf neighbor")), "point-to-point network type: FULL/  - (no DR)", cli(B, "x", "show ip ospf neighbor"));
  B = pair(["int g0/0","ip ospf 1 area 0","router ospf 1","router-id 1.1.1.1"], ["int g0/0","ip ospf 1 area 0","router ospf 1","router-id 2.2.2.2"]);
  ok(/FULL/.test(cli(B, "x", "show ip ospf neighbor")) && /Attached via Interface Enable/.test(cli(B, "x", "show ip ospf interface g0/0")), "interface method (ip ospf 1 area 0) forms an adjacency");
  // router-id change needs a restart
  B = pair(["router ospf 1","network 10.5.0.0 0.0.0.3 area 0"], ["router ospf 1","network 10.5.0.0 0.0.0.3 area 0"]);
  const rid0 = (cli(B, "x", "show ip protocols").match(/Router ID (\S+)/)||[])[1];
  cli(B, "x", "conf t"); const msg = cli(B, "x", "router ospf 1") + cli(B, "x", "router-id 7.7.7.7"); cli(B, "x", "end");
  ok(rid0==="10.5.0.1" && /Reload or use "clear ip ospf process"/.test(msg) && /Router ID 10\.5\.0\.1/.test(cli(B, "x", "show ip protocols")), "RID = highest interface IP; router-id needs clear ip ospf process", msg);
  cli(B, "x", "clear ip ospf process"); cli(B, "x", "yes");
  ok(/Router ID 7\.7\.7\.7/.test(cli(B, "x", "show ip protocols")), "after clear ip ospf process the new router ID is used");
}
// ---------- 4. default route into OSPF, floating static backup, administrative distance ----------
{ const B = tri({ r1: ["ip route 0.0.0.0 0.0.0.0 10.1.0.254","router ospf 1","default-information originate"], r3: ["ip route 10.2.0.0 255.255.255.0 10.0.13.1 200"] });
  const rt = cli(B, "r3", "show ip route");
  ok(/O\*E2\s+0\.0\.0\.0\/0 \[110\/1\] via 10\.0\.13\.1, \d\d:\d\d:\d\d, GigabitEthernet0\/1/.test(rt) && /Gateway of last resort is 10\.0\.13\.1 to network 0\.0\.0\.0/.test(rt), "default-information originate: R3 gets O*E2 0.0.0.0/0 [110/1]", rt);
  ok(/O\s+10\.2\.0\.0\/24 \[110\/2\] via 10\.0\.23\.1/.test(rt) && !/S\s+10\.2\.0\.0/.test(rt), "floating static (AD 200) stays hidden while OSPF (110) has the route", rt);
  cli(B, "r2", "conf t"); cli(B, "r2", "int g0/2"); cli(B, "r2", "shutdown"); cli(B, "r2", "int g0/1"); cli(B, "r2", "shutdown"); cli(B, "r2", "end");
  ok(/S\s+10\.2\.0\.0\/24 \[200\/0\] via 10\.0\.13\.1/.test(cli(B, "r3", "show ip route")), "R2 isolated: the floating static installs [200/0]", cli(B, "r3", "show ip route"));
  ok(/Routing entry for 0\.0\.0\.0\/0, supernet\n  Known via "ospf 1", distance 110, metric 1, candidate default path\n  Tag 1, type extern 2, forward metric 1/.test(cli(B, "r3", "show ip route 0.0.0.0")), "show ip route 0.0.0.0 shows the O*E2 default (candidate default, extern 2)", cli(B, "r3", "show ip route 0.0.0.0"));
}
// ---------- 5. multi-area: R1 (area 0) — R2 (ABR) — R3 (area 1) ----------
{ const B = Bench.create({ devices: [
    R("r1", "R1", ["int g0/1","ip address 10.0.12.1 255.255.255.252","no shut","int lo0","ip address 1.1.1.1 255.255.255.255","router ospf 1","network 10.0.12.0 0.0.0.3 area 0","network 1.1.1.1 0.0.0.0 area 0"]),
    R("r2", "R2", ["int g0/1","ip address 10.0.12.2 255.255.255.252","no shut","int g0/2","ip address 10.0.23.1 255.255.255.252","no shut","router ospf 1","router-id 2.2.2.2","network 10.0.12.0 0.0.0.3 area 0","network 10.0.23.0 0.0.0.3 area 1"]),
    R("r3", "R3", ["int g0/2","ip address 10.0.23.2 255.255.255.252","no shut","int g0/0","ip address 10.30.0.1 255.255.255.0","no shut","router ospf 1","router-id 3.3.3.3","network 10.0.0.0 0.255.255.255 area 1"]), PC("p3", "10.30.0.10", "10.30.0.1") ],
  cables: [{type:"cat6",a:"r1:g1",b:"r2:g1"},{type:"cat6",a:"r2:g2",b:"r3:g2"},{type:"cat6",a:"p3:eth",b:"r3:g0"}] });
  const rt = cli(B, "r1", "show ip route ospf");
  ok(/O IA\s+10\.30\.0\.0\/24 \[110\/3\] via 10\.0\.12\.2/.test(rt) && /O IA\s+10\.0\.23\.0\/30 \[110\/2\] via 10\.0\.12\.2/.test(rt), "R1 learns area 1 networks as O IA through the ABR", rt);
  ok(/O IA\s+1\.1\.1\.1 \[110\/3\] via 10\.0\.23\.1/.test(cli(B, "r3", "show ip route")), "R3 learns R1's loopback as O IA", cli(B, "r3", "show ip route"));
  ok(/It is an area border router/.test(cli(B, "r2", "show ip protocols")) && /Number of areas in this router is 2/.test(cli(B, "r2", "show ip protocols")), "R2 says it is an ABR with 2 areas");
  ok(/Router Link States \(Area 0\)/.test(cli(B, "r2", "show ip ospf database")) && /Summary Net Link States/.test(cli(B, "r2", "show ip ospf database")), "show ip ospf database lists router and summary LSAs", cli(B, "r2", "show ip ospf database"));
}
// ---------- 6. HSRP: two gateways, one virtual IP, failover ----------
{ const B = Bench.create({ devices: [
    R("g1", "GW1", ["int g0/0","ip address 10.50.0.2 255.255.255.0","standby 1 ip 10.50.0.1","standby 1 priority 110","standby 1 preempt","no shut","int g0/1","ip address 10.0.99.1 255.255.255.252","no shut","int lo0","ip address 9.9.9.9 255.255.255.255",
      "router ospf 1","network 10.0.0.0 0.255.255.255 area 0","network 9.9.9.9 0.0.0.0 area 0"]),
    R("g2", "GW2", ["int g0/0","ip address 10.50.0.3 255.255.255.0","standby 1 ip 10.50.0.1","no shut","int g0/1","ip address 10.0.99.2 255.255.255.252","no shut","router ospf 1","network 10.0.0.0 0.255.255.255 area 0"]),
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 }, PC("h", "10.50.0.20", "10.50.0.1") ],
  cables: [{type:"cat6",a:"g1:g0",b:"sw:g1"},{type:"cat6",a:"g2:g0",b:"sw:g2"},{type:"cat6",a:"h:eth",b:"sw:g3"},{type:"cat6",a:"g1:g1",b:"g2:g1"}] });
  const sb = cli(B, "g1", "show standby brief");
  ok(/Gi0\/0\s+1\s+110 P Active\s+local\s+10\.50\.0\.3\s+10\.50\.0\.1/.test(sb), "GW1 (priority 110) is Active, GW2 standby", sb);
  ok(/Gi0\/0\s+1\s+100   Standby 10\.50\.0\.2\s+local\s+10\.50\.0\.1/.test(cli(B, "g2", "show standby brief")), "GW2 sees itself as Standby", cli(B, "g2", "show standby brief"));
  ok(/Reply from 10\.50\.0\.1/.test(pc(B, "h", "ping 10.50.0.1")) && /00-00-0c-07-ac-01/.test(pc(B, "h", "arp -a")), "the PC pings the virtual IP and learns the virtual MAC 0000.0c07.ac01", pc(B, "h", "arp -a"));
  ok(/Reply from 9\.9\.9\.9/.test(pc(B, "h", "ping 9.9.9.9")), "traffic through the virtual gateway works");
  cli(B, "g1", "conf t"); cli(B, "g1", "int g0/0"); cli(B, "g1", "shutdown"); cli(B, "g1", "end");
  ok(/Active\s+local/.test(cli(B, "g2", "show standby brief")) && Bench.logged(B, "g2", /%HSRP-5-STATECHANGE: GigabitEthernet0\/0 Grp 1 state Standby -> Active/), "GW1's LAN link down: GW2 becomes Active (logged)");
  ok(/Reply from 9\.9\.9\.9/.test(pc(B, "h", "ping 9.9.9.9")), "the PC keeps working through the same gateway IP/MAC (now on GW2)", pc(B, "h", "ping 9.9.9.9"));
  cli(B, "g1", "conf t"); cli(B, "g1", "int g0/0"); cli(B, "g1", "no shutdown"); cli(B, "g1", "end");
  ok(/110 P Active/.test(cli(B, "g1", "show standby brief")), "GW1 returns and preempts (priority 110 + preempt)", cli(B, "g1", "show standby brief"));
  ok(/standby 1 ip 10\.50\.0\.1\n standby 1 priority 110\n standby 1 preempt/.test(cli(B, "g1", "show running-config")), "running-config shows the standby lines");
}
// ---------- 7. save and reload keeps OSPF ----------
{ const B = tri(); const e = B.devs.r1.env; const snap = e.exportConfig();
  const e2 = SIM.ios2Env({kind:"router"}); e2.importConfig(snap); e2.exec("en");
  ok(/router ospf 1\n network 1\.1\.1\.1 0\.0\.0\.0 area 0\n network 10\.0\.0\.0 0\.255\.255\.255 area 0|router ospf 1\n passive-interface GigabitEthernet0\/0\n network/.test(e2.exec("show running-config")), "OSPF config survives export/import", e2.exec("show running-config | section ospf"));
}
// ---------- 7b. the return path: extended ping with a source, traceroute hops that can't reply ----------
{ const B = Bench.create({ devices: [
    R("a", "RA", ["int g0/0","ip address 10.1.0.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.1 255.255.255.252","no shut","ip route 10.2.0.0 255.255.255.0 10.0.12.2"]),
    R("b", "RB", ["int g0/0","ip address 10.2.0.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.2 255.255.255.252","no shut"]),
    PC("p1", "10.1.0.10", "10.1.0.1"), PC("p2", "10.2.0.10", "10.2.0.1") ],
  cables: [{type:"cat6",a:"a:g1",b:"b:g1"},{type:"cat6",a:"p1:eth",b:"a:g0"},{type:"cat6",a:"p2:eth",b:"b:g0"}] });
  ok(/!!!!/.test(cli(B, "a", "ping 10.2.0.10")), "RA pings PC2 from its link address (RB has that subnet connected)");
  const ps = cli(B, "a", "ping 10.2.0.10 source g0/0");
  ok(/Packet sent with a source address of 10\.1\.0\.1/.test(ps) && /\.\.\.\.\./.test(ps) && /Success rate is 0 percent/.test(ps), "ping … source g0/0 fails: RB has no route back to 10.1.0.0/24", ps);
  ok(/Invalid source address/.test(cli(B, "a", "ping 10.2.0.10 source 9.9.9.9")), "ping source with an address that isn't ours is refused");
  const tr = pc(B, "p1", "tracert 10.2.0.10");
  ok(/1\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.1\.0\.1/.test(tr) && /2\s+\*\s+\*\s+\*\s+Request timed out\./.test(tr), "tracert: the hop with no return route shows * * * (its time-exceeded can't get back)", tr);
  cli(B, "b", "conf t"); cli(B, "b", "ip route 10.1.0.0 255.255.255.0 10.0.12.1"); cli(B, "b", "end");
  ok(/!!!!!/.test(cli(B, "a", "ping 10.2.0.10 source g0/0")) && /2\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.0\.12\.2\n\s+3\s+<1 ms\s+<1 ms\s+<1 ms\s+10\.2\.0\.10/.test(pc(B, "p1", "tracert 10.2.0.10")), "add the return route: sourced ping and tracert both complete");
  ok(/BW 10000 Kbit/.test((cli(B, "a", "conf t"), cli(B, "a", "int g0/1"), cli(B, "a", "bandwidth 10000"), cli(B, "a", "end"), cli(B, "a", "show interfaces g0/1"))), "show interfaces reports the configured bandwidth"); }
// ---------- 7c. real-IOS details found by the Module 5 fact-checks ----------
{ const base = rid => ["router ospf 1",`router-id ${rid}`];
  let B = pair([...base("1.1.1.1"),"network 10.5.0.0 0.0.0.3 area 0"], [...base("2.2.2.2"),"network 10.5.0.0 0.0.0.3 area 1"]);
  ok(Bench.logged(B, "x", /mismatched area ID from 10\.5\.0\.2, GigabitEthernet0\/0/) && !Bench.logged(B, "x", /virtual-link/) && Bench.logged(B, "y", /mismatched area ID, from backbone area must be virtual-link but not found from 10\.5\.0\.1/), "ERRRCV: plain on the backbone end, 'must be virtual-link' on the non-backbone end");
  B = pair(["int g0/0","ip ospf network point-to-point",...base("1.1.1.1"),"network 10.5.0.0 0.0.0.3 area 0"], [...base("2.2.2.2"),"network 10.5.0.0 0.0.0.3 area 0","int lo0","ip address 2.2.2.2 255.255.255.255","router ospf 1","network 2.2.2.2 0.0.0.0 area 0"]);
  ok(/2\.2\.2\.2\s+0\s+FULL\/  -/.test(cli(B, "x", "show ip ospf neighbor")) && /FULL\/(DR|BDR)/.test(cli(B, "y", "show ip ospf neighbor")) && !/2\.2\.2\.2/.test(cli(B, "x", "show ip route ospf").split("\n").slice(10).join("\n")), "p2p on one end only: FULL both sides (p2p end FULL/  -, Pri 0) but routes across it go missing");
  B = pair([...base("1.1.1.1"),"network 10.5.0.0 0.0.0.3 area 0"], [...base("2.2.2.2"),"network 10.5.0.0 0.0.0.3 area 0"]);
  cli(B, "x", "clear ip ospf process"); cli(B, "x", "yes");
  ok(Bench.logged(B, "x", /Nbr 2\.2\.2\.2 on GigabitEthernet0\/0 from FULL to DOWN, Neighbor Down: Interface down or detached/), "clear ip ospf process logs the adjacency going down and coming back");
  ok(/No backup designated router on this network/.test(cli(B, "x", "show ip ospf interface g0/0")) || /Backup Designated router/.test(cli(B, "x", "show ip ospf interface g0/0")), "DR/BDR lines present in show ip ospf interface");
  const e = SIM.ios2Env({kind:"router"}); for (const c of ["en","conf t","int g0/0","ip address 10.1.1.1 255.255.255.0","no shut","router ospf 1","network 10.0.0.0 0.255.255.255 area 0","network 10.1.1.0 255.255.255.0 area 1","end"]) e.exec(c);
  ok(/ network 10\.1\.1\.0 0\.0\.0\.255 area 1\n network 10\.0\.0\.0 0\.255\.255\.255 area 0/.test(e.exec("show running-config")), "a mask typed as the wildcard is converted, and the most specific statement is listed first", e.exec("show running-config | section ospf"));
  e.exec("conf t"); e.exec("int g0/1"); e.exec("ip address 10.2.2.1 255.255.255.0"); e.exec("standby 1 ip 10.9.9.1"); e.exec("end");
  ok(/Init/.test(e.exec("show standby brief")), "HSRP: a virtual IP outside the subnet is accepted with a warning and the group stays in Init", e.exec("show standby brief")); }
{ const B = tri(); const t = cli(B, "r1", "traceroute 10.3.0.10 source g0/0");
  ok(/1 10\.0\.13\.2/.test(t) && /2 10\.3\.0\.10/.test(t), "traceroute … source g0/0 works", t);
  ok(/Attached via Interface Enable/.test((cli(B,"r1","conf t"), cli(B,"r1","int g0/0"), cli(B,"r1","ip ospf 1 area 0"), cli(B,"r1","end"), cli(B,"r1","show ip ospf interface g0/0"))), "interface method prints 'Attached via Interface Enable'"); }
// ---------- 8. task helpers for lesson benches ----------
{ const B = tri(); pc(B, "pc1", "tracert 10.3.0.10"); cli(B, "r1", "traceroute 10.2.0.10");
  ok(Bench.ospfNbr(B, "r1", "2.2.2.2") && Bench.ospfNbr(B, "r1", "3.3.3.3", "FULL") && Bench.ospfNbrCount(B, "r1")===2, "helpers: ospfNbr / ospfNbrCount");
  ok(Bench.ospfDr(B, "r1", "GigabitEthernet0/1")==="2.2.2.2", "helper: ospfDr");
  const rt = Bench.route(B, "r1", "10.3.0.0/24", "O"); ok(rt && rt.metric===2 && rt.ad===110 && rt.via[0]==="10.0.13.2", "helper: route (code, AD, metric, next hop)", JSON.stringify(rt));
  ok(Bench.routeVia(B, "r1", "10.3.0.99")==="10.0.13.2", "helper: routeVia (longest-match next hop)");
  ok(Bench.traced(B, "pc1", "10.3.0.10") && Bench.traced(B, "r1", "10.2.0.10"), "helper: traced (tracert and traceroute)"); }
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
