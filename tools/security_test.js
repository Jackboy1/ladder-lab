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
  ok(/curl: \(7\) Failed to connect to 192\.168\.50\.20:8080 after \d+ ms: Could not connect to server/.test(pc(B, "p1", "curl http://192.168.50.20:8080")), "nothing listens on 8080: connection refused (curl 7)");
  ok(/Password: $/.test(pc(B, "p1", "ssh -l netops 192.168.50.1")), "baseline: SSH to R2 asks for the password", pc(B, "p1", "ssh -l netops 192.168.50.1")); }

{ // a standard ACL near the destination: block one host, allow the rest
  const B = mk(null, ["access-list 10 deny host 192.168.10.11", "access-list 10 permit any", "int g0/0", "ip access-group 10 out", "end"]);
  ok(/Reply from 192\.168\.50\.20: bytes=32/.test(pc(B, "p1", "ping 192.168.50.20")), "standard ACL 10 out on R2 G0/0: PC1 still gets through");
  const r = pc(B, "p2", "ping 192.168.50.20");
  ok(/Reply from 10\.0\.12\.2: Destination protocol unreachable\./.test(r) && /Received = 4/.test(r), "PC2 is denied: R2 answers 'administratively prohibited' from the interface the packet came in on", r);
  ok(/ACL 10 out on R2 Gi0\/0 denies ICMP echo 192\.168\.10\.11 → 192\.168\.50\.20 — line 10 \(deny   192\.168\.10\.11\) drops it/.test(log(B)), "the frame log names the ACL, the direction and the line", log(B));
  const sh = cli(B, "r2", "show access-lists");
  ok(/10 deny   192\.168\.10\.11 \(4 matches\)/.test(sh) && /20 permit any \(4 matches\)/.test(sh), "counters: 4 echoes each", sh);
  ok(/  Outgoing access list is 10\n/.test(cli(B, "r2", "show ip interface g0/0")) && /interface GigabitEthernet0\/0\n ip address 192\.168\.50\.1 255\.255\.255\.0\n ip access-group 10 out/.test(cli(B, "r2", "show running-config")), "show ip interface + running-config show the ACL", cli(B, "r2", "show ip interface g0/0"));
  ok(/  1    <1 ms    <1 ms    <1 ms  192\.168\.10\.1\n  2  10\.0\.12\.2  reports: Destination protocol unreachable\./.test(pc(B, "p2", "tracert 192.168.50.20")), "tracert: the blocking router reports it", pc(B, "p2", "tracert 192.168.50.20")); }

{ // an extended ACL near the source: web yes, ping no (logged), and the implicit deny
  const B = mk(["access-list 110 permit tcp 192.168.10.0 0.0.0.255 host 192.168.50.20 eq www", "access-list 110 deny icmp any any echo log", "int g0/0", "ip access-group 110 in", "end"]);
  ok(/Payroll portal/.test(pc(B, "p1", "curl 192.168.50.20")), "extended ACL 110 in on R1 G0/0: web to WEB is permitted");
  ok(/Destination protocol unreachable/.test(pc(B, "p1", "ping 192.168.50.20")) && /%SEC-6-IPACCESSLOGDP: list 110 denied icmp 192\.168\.10\.10 -> 192\.168\.50\.20 \(8\/0\), 1 packet/.test(cli(B, "r1", "show logging")), "ping denied by the 'log' line → %SEC-6-IPACCESSLOGDP", cli(B, "r1", "show logging"));
  ok(/Destination protocol unreachable|timed out/.test(pc(B, "p1", "ping 10.0.12.2")), "anything not permitted (ping to R2's link) — implicit deny");
  ok(/curl: \(28\) Failed to connect to 192\.168\.50\.20:443/.test(pc(B, "p1", "curl https://192.168.50.20")), "https (443) isn't permitted: refused at R1");
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
  ok(/Password: $/.test(pc(B, "p1", "ssh -l netops 192.168.50.1")), "access-class 15: PC1 (permitted) gets the password prompt");
  ok(/^ssh: connect to host 192\.168\.50\.1 port 22: Connection refused$/.test(pc(B, "p2", "ssh -l netops 192.168.50.1")) && /access-class 15 in/.test(log(B)), "PC2 is refused by the VTY access-class", pc(B, "p2", "ssh -l netops 192.168.50.1"));
  ok(/Reply from 192\.168\.50\.1/.test(pc(B, "p2", "ping 192.168.50.1")), "access-class only guards the VTY lines — pings still work"); }

{ // IOS-originated traffic, DHCP through an ACL, an undefined ACL, sequence-numbered edits take effect at once
  const B = mk(null, ["ip access-list extended NO-ICMP", "deny icmp any any", "permit ip any any", "exit", "int g0/1", "ip access-group NO-ICMP in", "end"]);
  ok(/U\.U\.U/.test(cli(B, "r1", "ping 192.168.50.20")) && /Success rate is 0 percent/.test(cli(B, "r1", "ping 192.168.50.20")), "IOS ping blocked by an ACL: U.U.U", cli(B, "r1", "ping 192.168.50.20"));
  ok(/  2 192\.168\.50\.20 \d msec/.test(cli(B, "r1", "traceroute 192.168.50.20")), "IOS traceroute probes with UDP, which NO-ICMP permits — so it still completes while ping fails", cli(B, "r1", "traceroute 192.168.50.20"));
  cfg(["ip access-list extended NO-UDP", "deny udp any any", "permit ip any any", "exit", "int g0/1", "ip access-group NO-UDP in", "end"])(B.devs.r2.env);
  ok(/  1 10\.0\.12\.2 !A  \*  !A/.test(cli(B, "r1", "traceroute 192.168.50.20")), "an ACL that drops the UDP probes: traceroute shows !A at the blocking router", cli(B, "r1", "traceroute 192.168.50.20"));
  cfg(["int g0/1", "ip access-group NO-ICMP in", "end"])(B.devs.r2.env);
  cfg(["ip access-list extended NO-ICMP", "5 permit icmp host 10.0.12.1 any", "end"])(B.devs.r2.env);
  ok(/!!!!!/.test(cli(B, "r1", "ping 192.168.50.20")), "a numbered line inserted at 5 takes effect immediately");
  const B2 = mk(["ip dhcp pool LAN", "network 192.168.10.0 255.255.255.0", "default-router 192.168.10.1", "exit", "ip dhcp excluded-address 192.168.10.1 192.168.10.20", "access-list 130 deny ip any any", "int g0/0", "ip access-group 130 in", "end"]);
  Bench.act(B2, ["dhcp", "p2"]);
  ok(B2.devs.p2.ip===null && /ACL 130 in on R1 Gi0\/0 denies UDP 0\.0\.0\.0:68 → 255\.255\.255\.255:67/.test(log(B2)), "an inbound 'deny ip any any' also drops the DHCP Discover → APIPA", log(B2));
  const B3 = mk(["int g0/0", "ip access-group NOT-DEFINED in", "end"]);
  ok(/Reply from 192\.168\.50\.20/.test(pc(B3, "p1", "ping 192.168.50.20")), "an ACL that doesn't exist permits everything"); }

// ---- Stage B: port security ----
const mkSw = (swx, extra, cables) => Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0","ip address 192.168.10.1 255.255.255.0","no shut"]) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200, config: cfg(swx||[]) },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:350, ip:"192.168.10.10", mask:"255.255.255.0", gw:"192.168.10.1" },
    { id:"lap", kind:"laptop", label:"VISITOR", x:150, y:350, ip:"192.168.10.66", mask:"255.255.255.0", gw:"192.168.10.1" }, ...(extra||[]) ],
  cables: [{type:"cat6",a:"r1:g0",b:"sw:g1"},{type:"cat6",a:"p1:eth",b:"sw:g2"}, ...(cables||[])] });
{ const B = mkSw();
  ok(/^Command rejected: GigabitEthernet0\/2 is a dynamic port\.$/.test((cfg(["int g0/2"])(B.devs.sw.env), B.devs.sw.env.exec("conf t"), B.devs.sw.env.exec("int g0/2"), B.devs.sw.env.exec("switchport port-security"))), "port security on a dynamic (DTP) port is refused");
  cfg(["int g0/2", "switchport mode access", "switchport port-security", "switchport port-security mac-address sticky"])(B.devs.sw.env);
  ok(/Reply from 192\.168\.10\.1/.test(pc(B, "p1", "ping 192.168.10.1")), "sticky port security: PC1 still works");
  const mac1 = B.devs.p1.mac;
  ok(new RegExp("switchport port-security mac-address sticky " + mac1.replace(/\./g, "\\.")).test(cli(B, "sw", "show running-config")), "PC1's MAC is written into the running-config as a sticky address", cli(B, "sw", "show running-config"));
  const pi = cli(B, "sw", "show port-security interface g0/2");
  ok(/Port Security              : Enabled\nPort Status                : Secure-up\nViolation Mode             : Shutdown/.test(pi) && /Maximum MAC Addresses      : 1\nTotal MAC Addresses        : 1\nConfigured MAC Addresses   : 0\nSticky MAC Addresses       : 1/.test(pi) && /Security Violation Count   : 0/.test(pi), "show port-security interface", pi);
  ok(new RegExp("1\\s+" + mac1.replace(/\./g, "\\.") + "\\s+STATIC\\s+Gi0/2").test(cli(B, "sw", "show mac address-table")), "a secure address shows as STATIC in the MAC table", cli(B, "sw", "show mac address-table"));
  // a visitor unplugs PC1 and plugs a laptop into the same socket
  Bench.act(B, ["unplug", "p1:eth"]); Bench.act(B, ["plug", "cat6", "lap:eth", "sw:g2"]);
  const r = pc(B, "lap", "ping 192.168.10.1");
  ok(!/Reply from 192\.168\.10\.1/.test(r) && Bench.errdis(B, "sw", "g2")==="psecure-violation", "the laptop's MAC is a violation: the port is err-disabled", r);
  const lg = cli(B, "sw", "show logging");
  ok(/%PM-4-ERR_DISABLE: psecure-violation error detected on Gi0\/2, putting Gi0\/2 in err-disable state/.test(lg) && new RegExp("%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address " + B.devs.lap.mac.replace(/\./g, "\\.") + " on port GigabitEthernet0/2\\.").test(lg), "syslog: ERR_DISABLE and PSECURE_VIOLATION", lg);
  ok(/Gi0\/2\s+\S*\s*err-disabled/.test(cli(B, "sw", "show interfaces status")), "show interfaces status: err-disabled", cli(B, "sw", "show interfaces status"));
  ok(/      Gi0\/2              1            1                  1         Shutdown/.test(cli(B, "sw", "show port-security")), "show port-security: one violation, action Shutdown", cli(B, "sw", "show port-security"));
  ok(/Port Status                : Secure-shutdown/.test(cli(B, "sw", "show port-security interface g0/2")), "Port Status: Secure-shutdown");
  // put PC1 back and recover the port
  Bench.act(B, ["unplug", "lap:eth"]); Bench.act(B, ["plug", "cat6", "p1:eth", "sw:g2"]); cfg(["int g0/2", "shutdown", "no shutdown"])(B.devs.sw.env);
  ok(/Reply from 192\.168\.10\.1/.test(pc(B, "p1", "ping 192.168.10.1")) && !Bench.errdis(B, "sw", "g2"), "PC1 back + shutdown/no shutdown: the port recovers (the sticky address is still PC1's)"); }
{ // restrict and protect with two devices behind a hub; maximum 2
  const hub = [{ id:"hub", kind:"hub", label:"HUB", x:200, y:300 }, { id:"p2", kind:"pc", label:"PC2", x:300, y:350, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1" }];
  const cab = [{type:"cat6",a:"hub:p1",b:"sw:g3"},{type:"cat6",a:"lap:eth",b:"hub:p2"},{type:"cat6",a:"p2:eth",b:"hub:p3"}];
  const B = mkSw(["int g0/3", "switchport mode access", "switchport port-security", "switchport port-security violation restrict"], hub, cab);
  pc(B, "p2", "ping 192.168.10.1"); const r = pc(B, "lap", "ping 192.168.10.1");
  ok(/Reply from 192\.168\.10\.1/.test(pc(B, "p2", "ping 192.168.10.1")) && !/Reply from 192\.168\.10\.1/.test(r) && !Bench.errdis(B, "sw", "g3") && Bench.psecViolations(B, "sw", "g3") > 0, "restrict: the second MAC is dropped and counted, the port stays up for the first", Bench.psecViolations(B, "sw", "g3"));
  ok(/%PORT_SECURITY-2-PSECURE_VIOLATION/.test(cli(B, "sw", "show logging")), "restrict logs the violation");
  const B2 = mkSw(["int g0/3", "switchport mode access", "switchport port-security", "switchport port-security violation protect"], hub, cab);
  pc(B2, "p2", "ping 192.168.10.1"); pc(B2, "lap", "ping 192.168.10.1");
  ok(Bench.psecViolations(B2, "sw", "g3")===0 && !/PSECURE_VIOLATION/.test(cli(B2, "sw", "show logging")) && !Bench.errdis(B2, "sw", "g3"), "protect: dropped silently — no log, no count");
  const B3 = mkSw(["int g0/3", "switchport mode access", "switchport port-security", "switchport port-security maximum 2"], hub, cab);
  ok(/Reply from 192\.168\.10\.1/.test(pc(B3, "p2", "ping 192.168.10.1")) && /Reply from 192\.168\.10\.1/.test(pc(B3, "lap", "ping 192.168.10.1")), "maximum 2: both devices behind the hub work");
  ok(/SecureDynamic/.test(cli(B3, "sw", "show port-security address")) && / switchport port-security maximum 2\n switchport port-security\n/.test(cli(B3, "sw", "show running-config")), "show port-security address; running-config maximum 2", cli(B3, "sw", "show port-security address")); }
{ // a static secure MAC that doesn't match the PC
  const B = mkSw(["int g0/2", "switchport mode access", "switchport port-security", "switchport port-security mac-address 0050.0000.beef"]);
  ok(!/Reply from 192\.168\.10\.1:/.test(pc(B, "p1", "ping 192.168.10.1")) && Bench.errdis(B, "sw", "g2")==="psecure-violation", "a configured (static) secure MAC that isn't PC1's: PC1 is a violation");
  ok(/0050\.0000\.beef\s+SecureConfigured\s+Gi0\/2/.test(cli(B, "sw", "show port-security address")), "show port-security address: SecureConfigured", cli(B, "sw", "show port-security address")); }

// ---- Stage C: DHCP snooping and Dynamic ARP Inspection ----
// R1 (the real DHCP server) on SW1 G0/1; staff PCs on G0/3 and G0/4; someone has plugged a home Wi-Fi router into G0/2
const mkSnoop = (swx, r1x, extra) => Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0","ip address 192.168.10.1 255.255.255.0","no shut","exit","ip dhcp excluded-address 192.168.10.1 192.168.10.9","ip dhcp pool STAFF","network 192.168.10.0 255.255.255.0","default-router 192.168.10.1","exit", ...(r1x||[])]) },
    { id:"home", kind:"router", label:"HOME-WIFI", x:300, y:0, config: cfg(["int g0/0","ip address 10.99.99.1 255.255.255.0","no shut","exit","ip dhcp pool HOME","network 10.99.99.0 255.255.255.0","default-router 10.99.99.1","exit","ip dhcp relay information trust-all"]) },   // a consumer router ignores option 82
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200, config: cfg(swx||[]) },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:350, dhcp:true }, { id:"p2", kind:"pc", label:"PC2", x:100, y:350, dhcp:true }, ...(extra||[]) ],
  cables: [{type:"cat6",a:"r1:g0",b:"sw:g8"},{type:"cat6",a:"home:g0",b:"sw:g2"},{type:"cat6",a:"p1:eth",b:"sw:g3"},{type:"cat6",a:"p2:eth",b:"sw:g4"}, ...((extra||[]).map((x,k)=>({type:"cat6",a:x.id+":eth",b:"sw:g"+(5+k)})))] });
{ const B = mkSnoop();
  const got = [B.devs.p1.ip, B.devs.p2.ip];
  ok(got.some(ip=>/^10\.99\.99\./.test(ip||"")), "no snooping: at least one PC takes an address from the home Wi-Fi router (the rogue answers first)", JSON.stringify(got));
  // turn on snooping (trust the uplink to R1); with the default option 82 insertion, R1 refuses the requests
  const B2 = mkSnoop(["ip dhcp snooping", "ip dhcp snooping vlan 1", "int g0/8", "ip dhcp snooping trust"]);
  Bench.act(B2, ["dhcp", "p1"]);
  ok(B2.devs.p1.ip===null && /DHCP snooping: a DHCP Offer is a SERVER message and this port is untrusted → dropped/.test(log(B2)) && /carries option 82 from the DHCP-snooping switch SW1 with giaddr 0\.0\.0\.0/.test(log(B2)), "snooping on: the home router's Offer is dropped, and R1 refuses the option-82 Discover → no address", log(B2));
  cfg(["no ip dhcp snooping information option"])(B2.devs.sw.env); Bench.act(B2, ["dhcp", "p1"]); Bench.act(B2, ["dhcp", "p2"]);
  ok(/^192\.168\.10\./.test(B2.devs.p1.ip||"") && /^192\.168\.10\./.test(B2.devs.p2.ip||""), "no ip dhcp snooping information option: both PCs lease from R1 only", JSON.stringify([B2.devs.p1.ip, B2.devs.p2.ip]));
  const sb = cli(B2, "sw", "show ip dhcp snooping binding");
  ok(/^MacAddress          IpAddress        Lease\(sec\)  Type           VLAN  Interface\n------------------  ---------------  ----------  -------------  ----  --------------------\n/.test(sb) && new RegExp(B2.devs.p1.mac.replace(/\./g,"").match(/../g).join(":").toUpperCase() + "\\s+" + B2.devs.p1.ip.replace(/\./g,"\\.") + "\\s+\\d+\\s+dhcp-snooping\\s+1\\s+GigabitEthernet0/3").test(sb) && /Total number of bindings: 2/.test(sb), "show ip dhcp snooping binding", sb);
  const ss = cli(B2, "sw", "show ip dhcp snooping");
  ok(/^Switch DHCP snooping is enabled/.test(ss) && /DHCP snooping is operational on following VLANs:\n1\n/.test(ss) && /Insertion of option 82 is disabled/.test(ss) && /GigabitEthernet0\/8\s+yes\s+yes\s+unlimited/.test(ss), "show ip dhcp snooping", ss);
  ok(/ip dhcp snooping vlan 1\nno ip dhcp snooping information option\nip dhcp snooping/.test(cli(B2, "sw", "show running-config")) && /interface GigabitEthernet0\/8\n ip dhcp snooping trust/.test(cli(B2, "sw", "show running-config")), "running-config", cli(B2, "sw", "show running-config"));
  ok(Bench.snoopBound(B2, "sw", B2.devs.p2.mac), "task helper snoopBound");
  const B3 = mkSnoop(["ip dhcp snooping", "ip dhcp snooping vlan 1", "int g0/8", "ip dhcp snooping trust"], ["ip dhcp relay information trust-all"]);
  Bench.act(B3, ["dhcp", "p1"]); ok(/^192\.168\.10\./.test(B3.devs.p1.ip||""), "the other fix: ip dhcp relay information trust-all on R1"); }
{ // DAI: DHCP clients pass (they have bindings); a static-IP printer is dropped until an ARP ACL allows it
  const prn = [{ id:"prn", kind:"server", label:"PRINTER", x:200, y:350, ip:"192.168.10.5", mask:"255.255.255.0", gw:"192.168.10.1" }];
  const B = mkSnoop(["ip dhcp snooping", "ip dhcp snooping vlan 1", "no ip dhcp snooping information option", "ip arp inspection vlan 1", "int g0/8", "ip dhcp snooping trust", "ip arp inspection trust"], null, prn);
  Bench.act(B, ["dhcp", "p1"]);
  ok(/Reply from 192\.168\.10\.1: bytes=32/.test(pc(B, "p1", "ping 192.168.10.1")), "DAI on: PC1's ARP matches its DHCP snooping binding — it works");
  const r = pc(B, "prn", "ping 192.168.10.1");
  ok(!/Reply from 192\.168\.10\.1:/.test(r) && Bench.daiDrops(B, "sw", 1) > 0 && /Dynamic ARP Inspection/.test(log(B)), "the static-IP printer has no binding: its ARP is dropped", log(B));
  ok(/%SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs \(Req\) on Gi0\/5, vlan 1\.\(\[[0-9a-f.]+\/192\.168\.10\.5\/0000\.0000\.0000\/192\.168\.10\.1\/\d\d:\d\d:\d\d UTC Mon Oct 12 2026\]\)/.test(cli(B, "sw", "show logging")), "syslog %SW_DAI-4-DHCP_SNOOPING_DENY", cli(B, "sw", "show logging"));
  ok(/    1     Enabled          Active/.test(cli(B, "sw", "show ip arp inspection")) && /    1\s+\d+\s+[1-9]\d*\s+[1-9]\d*\s+0/.test(cli(B, "sw", "show ip arp inspection")), "show ip arp inspection: VLAN 1 active, drops counted", cli(B, "sw", "show ip arp inspection"));
  cfg(["arp access-list STATIC-HOSTS", "permit ip host 192.168.10.5 mac host " + B.devs.prn.mac, "exit", "ip arp inspection filter STATIC-HOSTS vlan 1"])(B.devs.sw.env);
  ok(/Reply from 192\.168\.10\.1: bytes=32/.test(pc(B, "prn", "ping 192.168.10.1")), "an ARP ACL entry for the printer (ip arp inspection filter): it works again");
  ok(/ip arp inspection vlan 1\nip arp inspection filter STATIC-HOSTS vlan 1/.test(cli(B, "sw", "show running-config")) && /arp access-list STATIC-HOSTS\n permit ip host 192\.168\.10\.5 mac host /.test(cli(B, "sw", "show running-config")) && / ip arp inspection trust/.test(cli(B, "sw", "show running-config")), "running-config: DAI lines and the ARP ACL", cli(B, "sw", "show running-config"));
  const dl = cli(B, "sw", "show logging").split("\n").find(l=>/%SW_DAI-4-DHCP_SNOOPING_DENY/.test(l)) || "", hm = dl.match(/^\*?\w{3} \d+ (\d\d:\d\d:\d\d)\.\d{3}: .*\/(\d\d:\d\d:\d\d) UTC/);
  ok(hm && hm[1]===hm[2], "the time inside the DAI message is the log line's own time", dl);
  const stt = cli(B, "sw", "show ip arp inspection statistics");
  ok(/ Vlan   DHCP Permits    ACL Permits  Probe Permits   Source MAC Failures/.test(stt) && /    1\s+[1-9]\d*\s+[1-9]\d*\s+0\s+0/.test(stt.split("Source MAC Failures")[1]) && /IP Validation Failures/.test(stt), "show ip arp inspection statistics: DHCP and ACL permits counted", stt);
  // "static": only the ARP ACL counts — PC1's DHCP binding no longer lets it through
  cfg(["ip arp inspection filter STATIC-HOSTS vlan 1 static"])(B.devs.sw.env); pc(B, "p1", "arp -d");
  ok(!/Reply from 192\.168\.10\.1: bytes=32/.test(pc(B, "p1", "ping 192.168.10.1")) && /Reply from 192\.168\.10\.1: bytes=32/.test((pc(B, "prn", "arp -d"), pc(B, "prn", "ping 192.168.10.1"))) && /STATIC-HOSTS\s+Yes/.test(cli(B, "sw", "show ip arp inspection")) && /ip arp inspection filter STATIC-HOSTS vlan 1 static/.test(cli(B, "sw", "show running-config")), "filter … static: the DHCP binding is ignored — PC1 dropped, the printer (in the ACL) still works", cli(B, "sw", "show ip arp inspection")); }
{ // port-security running-config order and the switch's link-down log order
  const B = mkSw(["int g0/2", "switchport mode access", "switchport port-security maximum 2", "switchport port-security", "switchport port-security violation restrict", "switchport port-security mac-address sticky"]);
  pc(B, "p1", "ping 192.168.10.1");
  ok(/ switchport mode access\n switchport port-security maximum 2\n switchport port-security\n switchport port-security violation restrict\n switchport port-security mac-address sticky\n switchport port-security mac-address sticky [0-9a-f.]+\n/.test(cli(B, "sw", "show running-config")), "running-config: maximum, enable, violation, sticky, sticky MACs (IOS order)", cli(B, "sw", "show running-config"));
  Bench.act(B, ["unplug", "p1:eth"]); const lg = cli(B, "sw", "show logging");
  ok(/%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0\/2, changed state to down\n.*%LINK-3-UPDOWN: Interface GigabitEthernet0\/2, changed state to down/.test(lg), "unplugged: the switch logs line protocol down, then link down", lg); }

{ // stage D — device access hardening
  const B = mk(null, ["security passwords min-length 10"]);
  ok(/% Password too short - must be at least 10 characters\. Password configuration failed/.test(cli(B, "r2", "conf t") + cli(B, "r2", "username guest secret short1")) && !B.devs.r2.env.users.guest, "security passwords min-length 10: a 6-character secret is refused");
  cli(B, "r2", "username guest algorithm-type scrypt secret L0ngEnough!"); cli(B, "r2", "end");
  ok(B.devs.r2.env.users.guest && /username guest secret 9 \$9\$/.test(cli(B, "r2", "show running-config")) && /security passwords min-length 10/.test(cli(B, "r2", "show running-config")), "username … algorithm-type scrypt secret → stored as type 9", cli(B, "r2", "show running-config"));
  const B2 = mk(null, ["login block-for 120 attempts 3 within 60", "login on-failure log", "login on-success log", "ip access-list standard ADMINS", "permit host 192.168.10.10", "exit", "login quiet-mode access-class ADMINS"]);
  ok(/Router enabled to watch for login Attacks\.\n     If more than 3 login failures occur in 60 seconds or less,\n     logins will be disabled for 120 seconds\./.test(cli(B2, "r2", "show login")) && /Router presently in Normal-Mode\./.test(cli(B2, "r2", "show login")), "show login: watching, normal mode", cli(B2, "r2", "show login"));
  pc(B2, "p2", "ssh -l netops 192.168.50.1"); pc(B2, "p2", "bad1"); ok(/^\(netops@192\.168\.50\.1\) Password: $/.test(pc(B2, "p2", "bad2")), "a wrong SSH password asks again");
  const third = pc(B2, "p2", "bad3");
  ok(/netops@192\.168\.50\.1: Permission denied \(publickey,keyboard-interactive,password\)\./.test(third) && Bench.loginFailures(B2, "r2")===3 && Bench.quietMode(B2, "r2"), "three wrong SSH passwords → quiet mode", third + "\nfails=" + Bench.loginFailures(B2, "r2"));
  const lg = cli(B2, "r2", "show logging");
  ok(/%SEC_LOGIN-4-LOGIN_FAILED: Login failed \[user: netops\] \[Source: 192\.168\.10\.11\] \[localport: 22\] \[Reason: Login Authentication Failed\] at \d\d:\d\d:\d\d UTC Mon Oct 12 2026/.test(lg) && /%SEC_LOGIN-1-QUIET_MODE_ON: Still timeleft for watching failures is \d+ secs, \[user: netops\] \[Source: 192\.168\.10\.11\] \[localport: 22\] \[Reason: Login Authentication Failed\] \[ACL: ADMINS\] at /.test(lg), "syslog: LOGIN_FAILED ×3 then QUIET_MODE_ON", lg);
  ok(/ssh: connect to host 192\.168\.50\.1 port 22: Connection refused/.test(pc(B2, "p2", "ssh -l netops 192.168.50.1")), "quiet mode: PC2 is refused");
  ok(/Password: $/.test(pc(B2, "p1", "ssh -l netops 192.168.50.1")), "quiet mode: PC1 is permitted by the quiet-mode access-class ADMINS");
  pc(B2, "p1", "Adm1n!"); cli(B2, "r2", "en"); ok(Bench.remoteTo(B2, "p1")==="192.168.50.1" && /%SEC_LOGIN-5-LOGIN_SUCCESS: Login Success \[user: netops\] \[Source: 192\.168\.10\.10\] \[localport: 22\] at /.test(cli(B2, "r2", "show logging")), "PC1 logs in; LOGIN_SUCCESS logged");
  pc(B2, "p1", "exit"); cli(B2, "r2", "en");
  ok(/Router presently in Quiet-Mode\./.test(cli(B2, "r2", "show login")) && /Restricted logins filtered by applied ACL ADMINS\./.test(cli(B2, "r2", "show login")), "show login: quiet mode", cli(B2, "r2", "show login"));
  ok(/login block-for 120 attempts 3 within 60\nlogin quiet-mode access-class ADMINS\nlogin on-failure log\nlogin on-success log/.test(cli(B2, "r2", "show running-config")), "running-config: login lines", cli(B2, "r2", "show running-config"));
  B2.now += 121000; ok(!Bench.quietMode(B2, "r2") && /Password: $/.test(pc(B2, "p2", "ssh -l netops 192.168.50.1")), "after the block period: PC2 may try again"); pc(B2, "p2", "Adm1n!"); pc(B2, "p2", "exit"); }
{ // AAA: method list with RADIUS first, local as the fallback when no server answers
  const B = mk(null, ["aaa new-model", "radius server RAD1", "address ipv4 192.168.50.30 auth-port 1812 acct-port 1813", "key R4diusK3y", "exit", "aaa authentication login VTY-AUTH group radius local", "line vty 0 4", "login authentication VTY-AUTH", "exit"]);
  const rc = cli(B, "r2", "show running-config");
  ok(/hostname R2\n!\naaa new-model\n!\n!\naaa authentication login VTY-AUTH group radius local\n!\n!\n!\naaa session-id common/.test(rc) && /radius server RAD1\n address ipv4 192\.168\.50\.30 auth-port 1812 acct-port 1813\n key R4diusK3y\n!/.test(rc) && /line vty 0 4\n login authentication VTY-AUTH\n transport input ssh/.test(rc) && rc.indexOf("radius server") > rc.indexOf("router ospf"), "running-config: aaa new-model, method list, radius server, line login authentication", rc);
  pc(B, "p1", "ssh -l netops 192.168.50.1"); pc(B, "p1", "Adm1n!");
  ok(Bench.remoteTo(B, "p1")==="192.168.50.1", "RADIUS server doesn't answer → falls back to the local user list → SSH works"); pc(B, "p1", "exit");
  ok(/Invalid input/.test(cli(mk(), "r2", "conf t") + cli(mk(), "r2", "aaa authentication login default local")), "aaa authentication needs aaa new-model first");
  const C = mk(null, ["aaa new-model"]), c0 = C.devs.r2.env.connect("con");
  ok(/Press RETURN to get started/.test(c0.text) && !c0.ask, "aaa new-model, no default list: the console asks for nothing", JSON.stringify(c0));
  const D = mk(null, ["aaa new-model", "aaa authentication login default local", "banner login #Authorised staff only#"]), c1 = D.devs.r2.env.connect("con");
  ok(c1.ask==="Username: " && /^Authorised staff only\n\nUser Access Verification\n\n$/.test(c1.text), "aaa authentication login default local: the console asks Username/Password, banner login shown first", JSON.stringify(c1));
  ok(/% Authentication failed/.test(JSON.stringify(D.devs.r2.env.exec("netops") && D.devs.r2.env.exec("nope"))), "wrong console password: % Authentication failed");
  ok(/banner login \^CAuthorised staff only\^C/.test((D.devs.r2.env.exec("netops"), D.devs.r2.env.exec("Adm1n!"), D.devs.r2.env.exec("en"), out({out:D.devs.r2.env.exec("show running-config")}))), "running-config: banner login"); }

{ // port security: dynamic addresses age out with the link; no … sticky → dynamic; clear port-security; err-disabled views; recovery
  const B = mkSw(["int g0/2", "switchport mode access", "switchport port-security", "switchport port-security maximum 2"]);
  pc(B, "p1", "ping 192.168.10.1"); ok(Bench.secureMacs(B, "sw", "g2").length===1, "dynamic secure MAC learned");
  Bench.act(B, ["unplug", "p1:eth"]); pc(B, "lap", "ipconfig"); ok(Bench.secureMacs(B, "sw", "g2").length===0, "link down: the dynamic secure address is forgotten", JSON.stringify(Bench.secureMacs(B, "sw", "g2")));
  Bench.act(B, ["plug", "cat6", "p1:eth", "sw:g2"]); cfg(["int g0/2", "switchport port-security mac-address sticky"])(B.devs.sw.env); pc(B, "p1", "ping 192.168.10.1");
  cfg(["int g0/2", "no switchport port-security mac-address sticky"])(B.devs.sw.env);
  ok(Bench.secureMacs(B, "sw", "g2").join()===B.devs.p1.mac + ":dynamic" && !/mac-address sticky/.test(cli(B, "sw", "show running-config")), "no switchport port-security mac-address sticky: sticky addresses become dynamic", JSON.stringify(Bench.secureMacs(B, "sw", "g2")));
  cli(B, "sw", "clear port-security dynamic interface g0/2"); ok(Bench.secureMacs(B, "sw", "g2").length===0, "clear port-security dynamic interface g0/2");
  const C = mkSw(["errdisable recovery cause psecure-violation", "errdisable recovery interval 120", "int g0/2", "switchport mode access", "switchport port-security", "switchport port-security mac-address sticky"]);
  pc(C, "p1", "ping 192.168.10.1"); Bench.act(C, ["unplug", "p1:eth"]); Bench.act(C, ["plug", "cat6", "lap:eth", "sw:g2"]); pc(C, "lap", "ping 192.168.10.1");
  const se = cli(C, "sw", "show interfaces status err-disabled");
  ok(/^\nPort      Name               Status       Reason               Err-disabled Vlans\nGi0\/2\s+err-disabled psecure-violation$/.test(se), "show interfaces status err-disabled", se);
  const er = cli(C, "sw", "show errdisable recovery");
  ok(/psecure-violation            Enabled/.test(er) && /bpduguard                    Disabled/.test(er) && /Timer interval: 120 seconds/.test(er) && /Gi0\/2           psecure-violation\s+120/.test(er), "show errdisable recovery: timer enabled, Gi0/2 waiting", er);
  C.now += 121000; pc(C, "lap", "ipconfig");
  ok(!Bench.errdis(C, "sw", "g2") && /%PM-4-ERR_RECOVER: Attempting to recover from psecure-violation err-disable state on Gi0\/2/.test(cli(C, "sw", "show logging")), "after the interval the switch re-enables the port (%PM-4-ERR_RECOVER)", cli(C, "sw", "show logging"));
  pc(C, "lap", "ping 192.168.10.1"); ok(Bench.errdis(C, "sw", "g2")==="psecure-violation", "…and the visitor's MAC err-disables it again (the cause is still there)"); }
{ // DHCP snooping also checks renewals; DAI explicit deny / static
  const B = mkSnoop([]); Bench.act(B, ["dhcp", "p1"]); const rogueIp = B.devs.p1.ip;
  if (/^10\.99\.99\./.test(rogueIp||"")){ cfg(["ip dhcp snooping", "ip dhcp snooping vlan 1", "no ip dhcp snooping information option", "int g0/8", "ip dhcp snooping trust"])(B.devs.sw.env);
    pc(B, "p1", "ipconfig /renew");
    ok(B.devs.p1.ip===rogueIp && /DHCP snooping<\/b>: a DHCP Ack is a SERVER message and this port is untrusted → dropped/.test(B.log.join("\n")), "snooping on: the rogue's unicast renewal Ack is dropped too", B.log.join("\n")); }
  else ok(false, "test setup: PC1 should start on the home router's address", rogueIp);
  const B2 = mkSnoop(["ip dhcp snooping", "ip dhcp snooping vlan 1", "no ip dhcp snooping information option", "int g0/8", "ip dhcp snooping trust"]); Bench.act(B2, ["dhcp", "p1"]);
  cli(B2, "sw", "clear ip dhcp snooping binding *"); ok(!Bench.snoopBound(B2, "sw", B2.devs.p1.mac), "binding cleared");
  pc(B2, "p1", "ipconfig /renew"); ok(Bench.snoopBound(B2, "sw", B2.devs.p1.mac), "a renewal through the trusted uplink re-creates the binding", log(B2));
  cfg(["ip arp inspection vlan 1", "int g0/8", "ip arp inspection trust", "exit", "arp access-list BLOCK", "deny ip host " + B2.devs.p1.ip + " mac host " + B2.devs.p1.mac, "exit", "ip arp inspection filter BLOCK vlan 1"])(B2.devs.sw.env);
  pc(B2, "p1", "arp -d");
  ok(!/Reply from 192\.168\.10\.1: bytes/.test(pc(B2, "p1", "ping 192.168.10.1")) && /%SW_DAI-4-ACL_DENY: 1 Invalid ARPs \(Req\) on Gi0\/3/.test(cli(B2, "sw", "show logging")), "an explicit deny in the ARP ACL drops PC1 although it has a binding (ACL_DENY)", cli(B2, "sw", "show logging"));
  Bench.act(B2, ["dhcp", "p2"]); cfg(["ip arp inspection filter BLOCK vlan 1 static"])(B2.devs.sw.env); pc(B2, "p2", "arp -d");
  ok(!/Reply from 192\.168\.10\.1: bytes/.test(pc(B2, "p2", "ping 192.168.10.1")) && /%SW_DAI-4-ACL_DENY: 1 Invalid ARPs \(Req\) on Gi0\/4/.test(cli(B2, "sw", "show logging")), "filter … static: no ACL match → ACL_DENY (bindings not consulted)"); }
{ // stage D review fixes
  const B = mk(null, ["security passwords min-length 8", "username ops privilege 15 algorithm-type sha256 secret L0ngPassw0rd", "username old algorithm-type md5 secret L0ngPassw0rd", "enable algorithm-type sha256 secret En4bleSecret"]);
  const rc = cli(B, "r2", "show running-config");
  ok(/enable secret 8 \$8\$\S{14}\$\S{43}\n/.test(rc) && /username ops privilege 15 secret 8 \$8\$/.test(rc) && /username old secret 5 \$1\$\S{4}\$\S{22}\n/.test(rc) && rc.indexOf("ip domain name") < rc.indexOf("username netops"), "algorithm-type md5/sha256 → types 5/8, privilege shown, usernames after ip domain name", rc);
  cli(B, "r2", "conf t");
  ok(/Password too short/.test(cli(B, "r2", "enable password abc")) && /Password too short/.test(cli(B, "r2", "username x password abc")) && /Password too short/.test(cli(B, "r2", "username y privilege 5 secret abc")), "min-length also covers enable password, username password, username privilege secret");
  cli(B, "r2", "end");
  // the console keeps its own mode while a PC is in an SSH session (and its pending prompt can't eat console input)
  const C = mk(); C.devs.r2.env.exec("en"); pc(C, "p1", "ssh -l netops 192.168.50.1");
  ok(/^Building configuration/.test(cli(C, "r2", "show running-config")) && C.devs.r2.env.mode==="priv", "a PC at R2's SSH password prompt doesn't capture the console's commands");
  pc(C, "p1", "Adm1n!"); ok(Bench.sessionMode(C, "p1")==="user" && C.devs.r2.env.mode==="priv" && Bench.sessionPrompt(C, "p1")==="R2>", "SSH session in user EXEC, console still privileged");
  ok(/% No password set/.test(pc(C, "p1", "enable")), "enable from a VTY with no enable secret: % No password set");
  pc(C, "p1", "exit");
  // Telnet: three wrong line passwords close the connection
  const T = mk(null, ["line vty 0 4", "no login local", "login", "password Vty-Pa55", "transport input telnet ssh", "exit"]);
  pc(T, "p1", "telnet 192.168.50.1"); pc(T, "p1", "nope1"); pc(T, "p1", "nope2");
  ok(/% Bad passwords\n\n\[Connection to 192\.168\.50\.1 closed by foreign host\]/.test(pc(T, "p1", "nope3")) && !Bench.remoteTo(T, "p1"), "Telnet: three wrong passwords → % Bad passwords, connection closed");
  // AAA: no login local shown once aaa new-model is on; keys shown as type 7 with service password-encryption; tacacs block before radius
  const A = mk(null, ["service password-encryption", "aaa new-model", "tacacs server TAC1", "address ipv4 192.168.50.31", "key T4cK3y", "exit", "radius server RAD1", "address ipv4 192.168.50.30", "key R4diusK3y", "exit", "banner motd #Authorised use only#", "banner login #Staff only#"]);
  const ar = cli(A, "r2", "show running-config");
  ok(!/ login local/.test(ar) && /tacacs server TAC1\n address ipv4 192\.168\.50\.31\n key 7 [0-9A-F]+\nradius server RAD1\n address ipv4 192\.168\.50\.30\n key 7 [0-9A-F]+\n/.test(ar) && /banner login \^CStaff only\^C\nbanner motd \^CAuthorised use only\^C/.test(ar), "aaa new-model hides login local; key 7 …; tacacs before radius; banner login before motd", ar);
  // show login wording, login delay, every N
  const L2 = mk(null, ["login block-for 90 attempts 4 within 30", "login on-failure log every 2"]);
  const sl = cli(L2, "r2", "show login");
  ok(/^     A default login delay of 1 seconds is applied\.\n     No Quiet-Mode access list has been configured\.\n     Every 2 failed login is logged and generate SNMP traps\.\n\n     Router enabled to watch for login Attacks\.\n     If more than 4 login failures occur in 30 seconds or less,\n     logins will be disabled for 90 seconds\.\n\n     Router presently in Normal-Mode\.\n     Current Watch Window remaining time 30 seconds\.\n     Present login failure count 0\.$/.test(sl), "show login (normal mode) — real wording", sl);
  cli(L2, "r2", "conf t"); cli(L2, "r2", "login delay 3"); cli(L2, "r2", "end");
  ok(/A login delay of 3 seconds is applied\./.test(cli(L2, "r2", "show login")) && /login delay 3\nlogin on-failure log every 2/.test(cli(L2, "r2", "show running-config")), "login delay N; on-failure log every N in the running-config");
  for (let k = 0; k < 4; k++){ pc(L2, "p2", "ssh -l netops 192.168.50.1"); pc(L2, "p2", "x"); pc(L2, "p2", "y"); pc(L2, "p2", "z"); if (Bench.quietMode(L2, "r2")) break; }
  ok(Bench.quietMode(L2, "r2") && /Denying logins from all sources\./.test(cli(L2, "r2", "show login")) && (cli(L2, "r2", "show logging").match(/LOGIN_FAILED/g)||[]).length===Math.floor(Bench.loginFailures(L2, "r2")/2), "quiet mode with no access-class: Denying logins from all sources; every 2nd failure logged", cli(L2, "r2", "show login")); }

{ // small fixes: real type 7, password 0, enc7 kept, groups, console failures, privilege 15, show users *, banner line break
  const B = mk(null, ["line vty 0 4", "password 7 0822455D0A16", "exit", "username tech password Tech-Pa55", "username boss privilege 15 secret Boss-Secret1", "banner login #Staff only#"]);
  ok(B.devs.r2.env.lines.vty.password==="cisco", "a pasted type 7 (0822455D0A16) decodes to cisco like on a real router");
  ok(/ password 7 0822455D0A16/.test(cli(B, "r2", "show running-config")), "…and stays exactly 7 0822455D0A16 in the running-config (service password-encryption off)", cli(B, "r2", "show running-config"));
  let rc = cli(B, "r2", "show running-config");
  ok(/username tech password 0 Tech-Pa55/.test(rc), "username … password 0 … for a clear-text user password", rc);
  cfg(["service password-encryption"])(B.devs.r2.env); rc = cli(B, "r2", "show running-config");
  const t7 = (rc.match(/username tech password 7 (\S+)/)||[])[1] || "";
  ok(/^\d\d[0-9A-F]+$/.test(t7) && t7.length===2 + 2*"Tech-Pa55".length, "type 7 has the real shape: 2-digit salt + 2 hex digits per character", t7);
  cfg(["no service password-encryption"])(B.devs.r2.env);
  ok(/username tech password 7 /.test(cli(B, "r2", "show running-config")), "no service password-encryption leaves existing type 7 strings encrypted");
  { const G = mk(); cli(G, "r2", "conf t"); ok(/Invalid input/.test(cli(G, "r2", "aaa new-model") + cli(G, "r2", "aaa authentication login X group foo local")), "aaa authentication login … group foo is rejected (radius / tacacs+ only)"); }
  const r = pc(B, "p1", "ssh -l boss 192.168.50.1");
  ok(/^Staff only\n\(boss@192\.168\.50\.1\) Password: $/.test(r), "SSH: the login banner ends with a line break before the password prompt", JSON.stringify(r));
  pc(B, "p1", "Boss-Secret1"); ok(Bench.sessionPrompt(B, "p1")==="R2#", "a privilege 15 user (login local, no AAA) lands at #", Bench.sessionPrompt(B, "p1"));
  const su = pc(B, "p1", "show users");
  ok(/^\s+0 con 0 /m.test(su) && /^\*\s+1\s+vty 0\s+boss/m.test(su), "show users: the * marks the VTY line you're on", su); pc(B, "p1", "exit");
  const C = mk(null, ["login block-for 60 attempts 2 within 60", "line con 0", "login local", "exit"]), e = C.devs.r2.env; e.connect("con"); e.exec("netops"); e.exec("bad"); e.exec("netops"); e.exec("bad");
  ok(!Bench.quietMode(C, "r2"), "console failures don't trigger quiet mode"); }
{ // a denied broadcast gets no ICMP reply — and the log says why
  const B = mkSnoop([], ["access-list 5 permit host 192.168.10.200", "int g0/0", "ip access-group 5 in"]); Bench.act(B, ["dhcp", "p1"]);
  ok(!B.devs.p1.ip || /^169.254./.test(B.devs.p1.ip) ? /IOS never sends an ICMP error about a broadcast or a packet from 0.0.0.0/.test(log(B)) : true, "a Discover denied by an inbound ACL: no reply, and the frame log gives the real reason", log(B)); }
{ // show ip arp inspection vlan N = configuration tables only; enable at # is accepted silently
  const B = mkSnoop(["ip arp inspection vlan 1"]); const v = cli(B, "sw", "show ip arp inspection vlan 1");
  ok(/ Vlan     Configuration    Operation/.test(v) && !/Forwarded/.test(v) && /Forwarded/.test(cli(B, "sw", "show ip arp inspection")), "show ip arp inspection vlan 1: no statistics tables", v);
  ok(cli(B, "sw", "enable")==="" && B.devs.sw.env.mode==="priv", "enable typed at # does nothing (no error)"); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
