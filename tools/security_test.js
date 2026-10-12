#!/usr/bin/env node
// Ladder Lab — security in the full engine (Module 8+): ACLs applied to interfaces and VTY lines, what they block (pings,
// web, SSH, DHCP, OSPF), logging and counters, unreachables; later: port security, DHCP snooping, DAI.
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

// Staff LAN 192.168.10.0/24 — R1 ==OSPF== R2 — server LAN 192.168.50.0/24 (WEB 192.168.50.20 runs a web server; R2 takes SSH)
const SSH = ["hostname R2", "ip domain name corp.example.com", "username netops secret Adm1n!", "line vty 0 4", "login local", "transport input ssh", "exit"];
const mk = (r1x, r2x) => { const B = Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0","ip address 192.168.10.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.1 255.255.255.252","no shut","exit","router ospf 1","network 192.168.10.0 0.0.0.255 area 0","network 10.0.12.0 0.0.0.3 area 0","exit", ...(r1x||[])]) },
    { id:"r2", kind:"router", label:"R2", x:300, y:0, config: e => { cfg(["int g0/0","ip address 192.168.50.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.2 255.255.255.252","no shut","exit","router ospf 1","network 192.168.50.0 0.0.0.255 area 0","network 10.0.12.0 0.0.0.3 area 0","exit", ...SSH])(e);
        e.exec("en"); e.exec("conf t"); e.exec("crypto key generate rsa"); e.exec(""); e.exec("end"); cfg(r2x||[])(e); } },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 }, { id:"sw2", kind:"switch", label:"SW2", x:300, y:200 },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:350, ip:"192.168.10.10", mask:"255.255.255.0", gw:"192.168.10.1" },
    { id:"p2", kind:"pc", label:"PC2", x:100, y:350, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1" },
    { id:"web", kind:"server", label:"WEB", x:300, y:350, ip:"192.168.50.20", mask:"255.255.255.0", gw:"192.168.50.1", services:{ web:{ title:"Payroll portal" } } } ],
  cables: [{type:"cat6",a:"r1:g0",b:"sw:g1"},{type:"cat6",a:"p1:eth",b:"sw:g2"},{type:"cat6",a:"p2:eth",b:"sw:g3"},{type:"cat6",a:"r1:g1",b:"r2:g1"},{type:"cat6",a:"r2:g0",b:"sw2:g1"},{type:"cat6",a:"web:eth",b:"sw2:g2"}] });
  return B; };

{ // baseline: everything works without ACLs
  const B = mk();
  ok(/Reply from 192\.168\.50\.20: bytes=32/.test(pc(B, "p1", "ping 192.168.50.20")), "baseline: PC1 pings WEB");
  ok(/<title>Payroll portal<\/title>/.test(pc(B, "p1", "curl http://192.168.50.20")), "baseline: curl gets the web page", pc(B, "p1", "curl http://192.168.50.20"));
  ok(/curl: \(7\) Failed to connect to 192\.168\.50\.20 port 8080 after \d+ ms: Couldn't connect to server/.test(pc(B, "p1", "curl http://192.168.50.20:8080")), "nothing listens on 8080: connection refused (curl 7)");
  ok(/password: $/.test(pc(B, "p1", "ssh -l netops 192.168.50.1")), "baseline: SSH to R2 asks for the password", pc(B, "p1", "ssh -l netops 192.168.50.1")); }

{ // a standard ACL near the destination: block one host, allow the rest
  const B = mk(null, ["access-list 10 deny host 192.168.10.11", "access-list 10 permit any", "int g0/0", "ip access-group 10 out", "end"]);
  ok(/Reply from 192\.168\.50\.20: bytes=32/.test(pc(B, "p1", "ping 192.168.50.20")), "standard ACL 10 out on R2 G0/0: PC1 still gets through");
  const r = pc(B, "p2", "ping 192.168.50.20");
  ok(/Reply from 10\.0\.12\.2: Communication administratively prohibited\./.test(r) && /Received = 4/.test(r), "PC2 is denied: R2 answers 'administratively prohibited' from the interface the packet came in on", r);
  ok(/ACL 10 out on R2 Gi0\/0 denies ICMP echo 192\.168\.10\.11 → 192\.168\.50\.20 — line 10 \(deny   192\.168\.10\.11\) drops it/.test(log(B)), "the frame log names the ACL, the direction and the line", log(B));
  const sh = cli(B, "r2", "show access-lists");
  ok(/10 deny   192\.168\.10\.11 \(4 matches\)/.test(sh) && /20 permit any \(4 matches\)/.test(sh), "counters: 4 echoes each", sh);
  ok(/  Outgoing access list is 10\n/.test(cli(B, "r2", "show ip interface g0/0")) && /interface GigabitEthernet0\/0\n ip address 192\.168\.50\.1 255\.255\.255\.0\n ip access-group 10 out/.test(cli(B, "r2", "show running-config")), "show ip interface + running-config show the ACL", cli(B, "r2", "show ip interface g0/0"));
  ok(/  1    <1 ms    <1 ms    <1 ms  192\.168\.10\.1\n  2  10\.0\.12\.2  reports: Communication administratively prohibited\./.test(pc(B, "p2", "tracert 192.168.50.20")), "tracert: the blocking router reports it", pc(B, "p2", "tracert 192.168.50.20")); }

{ // an extended ACL near the source: web yes, ping no (logged), and the implicit deny
  const B = mk(["access-list 110 permit tcp 192.168.10.0 0.0.0.255 host 192.168.50.20 eq www", "access-list 110 deny icmp any any echo log", "int g0/0", "ip access-group 110 in", "end"]);
  ok(/Payroll portal/.test(pc(B, "p1", "curl 192.168.50.20")), "extended ACL 110 in on R1 G0/0: web to WEB is permitted");
  ok(/Communication administratively prohibited/.test(pc(B, "p1", "ping 192.168.50.20")) && /%SEC-6-IPACCESSLOGDP: list 110 denied icmp 192\.168\.10\.10 -> 192\.168\.50\.20 \(8\/0\), 1 packet/.test(cli(B, "r1", "show logging")), "ping denied by the 'log' line → %SEC-6-IPACCESSLOGDP", cli(B, "r1", "show logging"));
  ok(/Communication administratively prohibited|timed out/.test(pc(B, "p1", "ping 10.0.12.2")), "anything not permitted (ping to R2's link) — implicit deny");
  ok(/curl: \(7\) Failed to connect to 192\.168\.50\.20 port 443/.test(pc(B, "p1", "curl https://192.168.50.20")), "https (443) isn't permitted: refused at R1");
  cfg(["int g0/0", "no ip unreachables"])(B.devs.r1.env);
  ok(/Request timed out\./.test(pc(B, "p1", "ping 192.168.50.20")), "no ip unreachables: the denied ping just times out"); }

{ // the implicit deny kills OSPF; established lets only replies in
  const B = mk(["access-list 120 permit tcp any 192.168.10.0 0.0.0.255 established", "int g0/1", "ip access-group 120 in", "end"]);
  cli(B, "r1", "show ip route");
  ok(!/O\s+192\.168\.50\.0/.test(cli(B, "r1", "show ip route")) && !/FULL/.test(cli(B, "r1", "show ip ospf neighbor")), "an inbound ACL without 'permit ospf' drops the hellos: the adjacency and the routes are gone", cli(B, "r1", "show ip ospf neighbor"));
  cfg(["access-list 120 permit ospf any any"])(B.devs.r1.env);
  ok(/FULL/.test(cli(B, "r1", "show ip ospf neighbor")) && /O\s+192\.168\.50\.0\/24/.test(cli(B, "r1", "show ip route")), "permit ospf any any: the neighbour and the routes come back");
  ok(/Payroll portal/.test(pc(B, "p1", "curl 192.168.50.20")), "established: the web server's SYN-ACK (ACK set) gets back in");
  ok(/Request timed out\./.test(pc(B, "p1", "ping 192.168.50.20")), "… but the echo reply isn't permitted (the reply is dropped, so PC1 just times out)"); }

{ // VTY access-class
  const B = mk(null, ["access-list 15 permit host 192.168.10.10", "line vty 0 4", "access-class 15 in", "end"]);
  ok(/line vty 0 4\n access-class 15 in/.test(cli(B, "r2", "show running-config")), "running-config: access-class under line vty", cli(B, "r2", "show running-config"));
  ok(/password: $/.test(pc(B, "p1", "ssh -l netops 192.168.50.1")), "access-class 15: PC1 (permitted) gets the password prompt");
  ok(/^kex_exchange_identification: read: Connection reset$/.test(pc(B, "p2", "ssh -l netops 192.168.50.1")) && /access-class 15 in/.test(log(B)), "PC2 is refused by the VTY access-class", pc(B, "p2", "ssh -l netops 192.168.50.1"));
  ok(/Reply from 192\.168\.50\.1/.test(pc(B, "p2", "ping 192.168.50.1")), "access-class only guards the VTY lines — pings still work"); }

{ // IOS-originated traffic, DHCP through an ACL, an undefined ACL, sequence-numbered edits take effect at once
  const B = mk(null, ["ip access-list extended NO-ICMP", "deny icmp any any", "permit ip any any", "exit", "int g0/1", "ip access-group NO-ICMP in", "end"]);
  ok(/U\.U\.U/.test(cli(B, "r1", "ping 192.168.50.20")) && /Success rate is 0 percent/.test(cli(B, "r1", "ping 192.168.50.20")), "IOS ping blocked by an ACL: U.U.U", cli(B, "r1", "ping 192.168.50.20"));
  ok(/  2 192\.168\.50\.20 \d msec/.test(cli(B, "r1", "traceroute 192.168.50.20")), "IOS traceroute probes with UDP, which NO-ICMP permits — so it still completes while ping fails", cli(B, "r1", "traceroute 192.168.50.20"));
  cfg(["ip access-list extended NO-UDP", "deny udp any any", "permit ip any any", "exit", "int g0/1", "ip access-group NO-UDP in", "end"])(B.devs.r2.env);
  ok(/  1 10\.0\.12\.2 !A  !A  !A/.test(cli(B, "r1", "traceroute 192.168.50.20")), "an ACL that drops the UDP probes: traceroute shows !A at the blocking router", cli(B, "r1", "traceroute 192.168.50.20"));
  cfg(["int g0/1", "ip access-group NO-ICMP in", "end"])(B.devs.r2.env);
  cfg(["ip access-list extended NO-ICMP", "5 permit icmp host 10.0.12.1 any", "end"])(B.devs.r2.env);
  ok(/!!!!!/.test(cli(B, "r1", "ping 192.168.50.20")), "a numbered line inserted at 5 takes effect immediately");
  const B2 = mk(["ip dhcp pool LAN", "network 192.168.10.0 255.255.255.0", "default-router 192.168.10.1", "exit", "ip dhcp excluded-address 192.168.10.1 192.168.10.20", "access-list 130 deny ip any any", "int g0/0", "ip access-group 130 in", "end"]);
  Bench.act(B2, ["dhcp", "p2"]);
  ok(B2.devs.p2.ip===null && /ACL 130 in on R1 Gi0\/0 denies UDP 0\.0\.0\.0:68 → 255\.255\.255\.255:67/.test(log(B2)), "an inbound 'deny ip any any' also drops the DHCP Discover → APIPA", log(B2));
  const B3 = mk(["int g0/0", "ip access-group NOT-DEFINED in", "end"]);
  ok(/Reply from 192\.168\.50\.20/.test(pc(B3, "p1", "ping 192.168.50.20")), "an ACL that doesn't exist permits everything"); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
