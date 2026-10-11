#!/usr/bin/env node
// Ladder Lab — IP services in the full engine (Module 7+): DHCP server, relay, Windows DHCP client, ACL config in IOS.
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

// R1 serves the Lagos LAN directly; the Kano LAN (behind R2) is relayed to R1 with ip helper-address
const POOLS = ["ip dhcp excluded-address 192.168.10.1 192.168.10.10", "ip dhcp pool LAGOS", "network 192.168.10.0 255.255.255.0", "default-router 192.168.10.1", "dns-server 192.168.10.53 8.8.8.8", "domain-name lagos.example.com", "exit",
  "ip dhcp excluded-address 192.168.20.1", "ip dhcp pool KANO", "network 192.168.20.0 255.255.255.0", "default-router 192.168.20.1", "lease 0 8", "exit"];
const mk = (r1x, r2x, extra) => Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0","ip address 192.168.10.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.1 255.255.255.252","no shut","exit","ip route 192.168.20.0 255.255.255.0 10.0.12.2", ...POOLS, ...(r1x||[])]) },
    { id:"r2", kind:"router", label:"R2", x:300, y:0, config: cfg(["int g0/0","ip address 192.168.20.1 255.255.255.0","ip helper-address 10.0.12.1","no shut","int g0/1","ip address 10.0.12.2 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 10.0.12.1", ...(r2x||[])]) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:350, dhcp:true },
    { id:"p3", kind:"pc", label:"PC3", x:150, y:350, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1" },
    { id:"p2", kind:"pc", label:"PC2", x:300, y:350, dhcp:true }, ...(extra||[]) ],
  cables: [{type:"cat6",a:"r1:g0",b:"sw:g1"},{type:"cat6",a:"p1:eth",b:"sw:g2"},{type:"cat6",a:"p3:eth",b:"sw:g3"},{type:"cat6",a:"r1:g1",b:"r2:g1"},{type:"cat6",a:"p2:eth",b:"r2:g0"}] });

{ const B = mk(); const d1 = B.devs.p1, d2 = B.devs.p2;
  ok(d1.ip==="192.168.10.12" && d1.gw==="192.168.10.1" && d1.dns.join()==="192.168.10.53,8.8.8.8" && d1.domain==="lagos.example.com", "PC1 (DHCP) leases from R1's LAGOS pool on its own — .11 is a static PC, so the ping check skips it and PC1 gets .12", JSON.stringify([d1.ip, d1.gw, d1.dns]));
  ok(/192\.168\.10\.11\s+Ping/.test(cli(B, "r1", "show ip dhcp conflict")), "… and R1 lists .11 in show ip dhcp conflict", cli(B, "r1", "show ip dhcp conflict"));
  ok(d2.ip==="192.168.20.2" && d2.gw==="192.168.20.1", "PC2 behind R2 leases from the KANO pool through the relay (giaddr 192.168.20.1 picks the pool)", JSON.stringify([d2.ip, d2.gw]));
  const bd = cli(B, "r1", "show ip dhcp binding");
  ok(/^Bindings from all pools not associated with VRF:\nIP address      Client-ID\/              Lease expiration        Type       State      Interface\n/.test(bd) && /192\.168\.10\.12\s+01[0-9a-f.]+\s+Oct 13 2026 08:30 AM\s+Automatic  Active     GigabitEthernet0\/0/.test(bd) && /192\.168\.20\.2\s+01[0-9a-f.]+\s+Oct 12 2026 04:30 PM\s+Automatic  Active     Unknown/.test(bd), "show ip dhcp binding: both leases (1 day and 8 hours), relayed one on 'Unknown'", bd);
  const all = pc(B, "p1", "ipconfig /all");
  ok(/Host Name . . . . . . . . . . . . : PC1\n/.test(all) && /DNS Suffix Search List. . . . . . : lagos\.example\.com/.test(all) && /DHCP Enabled. . . . . . . . . . . : Yes\n   Autoconfiguration Enabled . . . . : Yes/.test(all) && /IPv4 Address. . . . . . . . . . . : 192\.168\.10\.12\(Preferred\)\n   Subnet Mask . . . . . . . . . . . : 255\.255\.255\.0\n   Lease Obtained. . . . . . . . . . : Monday, October 12, 2026 8:30:00 AM\n   Lease Expires . . . . . . . . . . : Tuesday, October 13, 2026 8:30:00 AM\n   Default Gateway . . . . . . . . . : 192\.168\.10\.1\n   DHCP Server . . . . . . . . . . . : 192\.168\.10\.1\n   DHCPv6 IAID[^\n]*\n   DHCPv6 Client DUID[^\n]*\n   DNS Servers . . . . . . . . . . . : 192\.168\.10\.53\n                                       8\.8\.8\.8\n   NetBIOS over Tcpip/.test(all), "ipconfig /all on a DHCP client", all);
  ok(/DHCP Server . . . . . . . . . . . : 10\.0\.12\.1/.test(pc(B, "p2", "ipconfig /all")), "the relayed client's DHCP Server is R1's address facing the relay", pc(B, "p2", "ipconfig /all"));
  ok(/^\nWindows IP Configuration\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  \. : lagos\.example\.com\n/.test(pc(B, "p1", "ipconfig")), "plain ipconfig starts with the DNS suffix line", pc(B, "p1", "ipconfig"));
  ok(/Reply from 192\.168\.20\.2: bytes=32/.test(pc(B, "p1", "ping 192.168.20.2")), "the two DHCP clients can ping each other");
  const rel = pc(B, "p1", "ipconfig /release");
  ok(!/IPv4 Address/.test(rel) && !/Autoconfiguration IPv4/.test(rel) && !/192\.168\.10\.12 /.test(cli(B, "r1", "show ip dhcp binding")) && /DHCP Release/.test(log(B)), "ipconfig /release: the PC gives the address back; R1 drops the binding", rel);
  Bench.act(B, ["pc", "p1", "ipconfig"]); ok(B.devs.p1.ip===null, "a released PC does not quietly lease again");
  const ren = pc(B, "p1", "ipconfig /renew");
  ok(/IPv4 Address. . . . . . . . . . . : 192\.168\.10\.12\n/.test(ren) && /DHCP Discover[\s\S]*DHCP Offer[\s\S]*DHCP Request[\s\S]*DHCP Ack/.test(log(B)), "ipconfig /renew: Discover, Offer, Request, Ack in the frame log; it asks for (and gets) its old address", ren + "\n" + log(B));
  ok(/no adapter is in the state permissible/.test(pc(B, "p3", "ipconfig /release")), "/release on a static PC: Windows refuses");
  ok(Bench.leased(B, "p2")==="192.168.20.2" && Bench.dhcpBound(B, "r1", "192.168.20.2") && !Bench.leased(B, "p3"), "task helpers: leased / dhcpBound");
  const run = cli(B, "r1", "show running-config");
  ok(/ip dhcp excluded-address 192\.168\.10\.1 192\.168\.10\.10\nip dhcp excluded-address 192\.168\.20\.1\n!\nip dhcp pool LAGOS\n network 192\.168\.10\.0 255\.255\.255\.0\n default-router 192\.168\.10\.1\n dns-server 192\.168\.10\.53 8\.8\.8\.8\n domain-name lagos\.example\.com\n!\nip dhcp pool KANO\n network 192\.168\.20\.0 255\.255\.255\.0\n default-router 192\.168\.20\.1\n lease 0 8/.test(run), "R1 running-config: exclusions, then the pools", run);
  ok(/interface GigabitEthernet0\/0\n ip address 192\.168\.20\.1 255\.255\.255\.0\n ip helper-address 10\.0\.12\.1/.test(cli(B, "r2", "show running-config")), "R2 running-config: ip helper-address under the interface");
  // reload: leases are not configuration
  cli(B, "r1", "copy running-config startup-config"); cli(B, "r1", "");
  Bench.act(B, ["cli", "r1", "reload"]); Bench.act(B, ["cli", "r1", ""]); cli(B, "r1", "enable");
  ok(!/192\.168\./.test(cli(B, "r1", "show ip dhcp binding").split("\n").slice(4).join("\n")) && /ip dhcp pool LAGOS/.test(cli(B, "r1", "show running-config")), "after a reload the pools are still configured but the bindings are gone", cli(B, "r1", "show ip dhcp binding")); }

{ // no helper on R2 → PC2 gets APIPA; the frame log says why
  const B = mk(null, ["int g0/0", "no ip helper-address"]);
  ok(B.devs.p2.ip===null && /Autoconfiguration IPv4 Address/.test(pc(B, "p2", "ipconfig")), "no ip helper-address: PC2 gets no lease (APIPA)", pc(B, "p2", "ipconfig"));
  Bench.act(B, ["dhcp", "p2"]);
  ok(/no ip helper-address|no DHCP pool for 192\.168\.20\.0\/24 and no ip helper-address/.test(log(B)), "the frame log explains: R2 has no pool and no helper — routers don't forward broadcasts", log(B));
  ok(/unable to contact your DHCP server\. Request has timed out\./.test(pc(B, "p2", "ipconfig /renew")), "ipconfig /renew with no server: Windows' timeout error");
  cfg(["int g0/0", "ip helper-address 10.0.12.1"])(B.devs.r2.env); Bench.act(B, ["pc", "p2", "ipconfig"]);
  ok(B.devs.p2.ip==="192.168.20.2", "adding the helper back: the PC leases on its own at the next change (Windows keeps retrying)", B.devs.p2.ip); }

{ // R1 has no route back to the relay's subnet? (giaddr) — here: KANO pool missing on R1 → relayed Discover finds no pool
  const B = mk(["no ip dhcp pool KANO"]);
  Bench.act(B, ["dhcp", "p2"]);
  ok(B.devs.p2.ip===null && /none of its pools covers giaddr 192\.168\.20\.1/.test(log(B)), "relay works but the server has no pool for that subnet → no offer, and the log says so", log(B));
  const B2 = mk(null, ["int g0/0", "no ip helper-address", "ip helper-address 10.0.99.9"]); Bench.act(B2, ["dhcp", "p2"]);
  ok(B2.devs.p2.ip===null && /never reached 10\.0\.99\.9/.test(log(B2)), "a helper-address nobody can reach → no offer", log(B2)); }

{ // pool exhausted; excluded gateway; default-router missing; no service dhcp
  const B = Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0","ip address 10.5.5.1 255.255.255.248","no shut","exit","ip dhcp pool TINY","network 10.5.5.0 255.255.255.248"]) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 },
    ...[1,2,3,4,5,6,7].map(k=>({ id:"p"+k, kind:"pc", label:"PC"+k, x:k*60, y:350, dhcp:true })) ],
    cables: [{type:"cat6",a:"r1:g0",b:"sw:g1"}, ...[1,2,3,4,5,6,7].map(k=>({type:"cat6",a:"p"+k+":eth",b:"sw:g"+(k+1)}))] });
  const ips = [1,2,3,4,5,6,7].map(k=>B.devs["p"+k].ip);
  ok(ips.slice(0,5).every(Boolean) && !ips[5] && !ips[6] && !ips.includes("10.5.5.1"), "a /29 has 6 addresses; the router's own .1 is skipped automatically → 5 leases, then the pool is exhausted", JSON.stringify(ips));
  ok(B.devs.p1.gw===null && /Default Gateway . . . . . . . . . : *\n|Default Gateway . . . . . . . . . : *$/.test(pc(B, "p1", "ipconfig")), "a pool without default-router: the PC gets an address but no gateway", pc(B, "p1", "ipconfig"));
  Bench.act(B, ["dhcp", "p6"]); ok(/no free address left/.test(log(B)), "the frame log says the pool is exhausted", log(B));
  cfg(["no service dhcp"])(B.devs.r1.env); Bench.act(B, ["dhcp", "p1"]);
  ok(B.devs.p1.ip===null && /no service dhcp/.test(log(B)) && /no service dhcp/.test(cli(B, "r1", "show running-config")), "no service dhcp: the router stops answering", log(B)); }

{ // IOS side: ACL config through the CLI, named sub-mode, falling back to global config, show/clear
  const e = SIM.ios2Env({kind:"router"});
  for (const c of ["en","conf t","access-list 10 permit 192.168.10.0 0.0.0.255","access-list 10 remark LAN only","ip access-list extended WEB","permit tcp any host 10.1.1.10 eq 80","15 deny ip any any log"]) e.exec(c);
  ok(e.prompt()==="Router(config-ext-nacl)#", "ip access-list extended → (config-ext-nacl)# prompt", e.prompt());
  e.exec("interface g0/0"); ok(e.prompt()==="Router(config-if)#", "a global command typed in the ACL sub-mode drops back to global config (like IOS)", e.prompt());
  e.exec("ip access-list standard MGMT"); ok(e.prompt()==="Router(config-std-nacl)#", "(config-std-nacl)#");
  e.exec("permit host 10.9.9.9"); e.exec("end");
  const sh = e.exec("show access-lists");
  ok(/Standard IP access list 10\n    10 permit 192\.168\.10\.0, wildcard bits 0\.0\.0\.255/.test(sh) && /Extended IP access list WEB\n    10 permit tcp any host 10\.1\.1\.10 eq www\n    15 deny ip any any log/.test(sh) && /Standard IP access list MGMT\n    10 permit 10\.9\.9\.9/.test(sh), "show access-lists", sh);
  ok(/^Extended IP access list WEB/.test(e.exec("show ip access-lists WEB")), "show ip access-lists NAME");
  const run = e.exec("show running-config");
  ok(/ip access-list standard 10\n 10 permit 192\.168\.10\.0 0\.0\.0\.255\n 20 remark LAN only\nip access-list extended WEB\n 10 permit tcp any host 10\.1\.1\.10 eq www\n 15 deny ip any any log\nip access-list standard MGMT\n 10 permit 10\.9\.9\.9/.test(run), "running-config (IOS XE 16.12+ form)", run);
  ok(/% Invalid input/.test((e.exec("conf t"), e.exec("access-list 10 permit tcp any any"))), "extended syntax in a standard list is refused");
  e.exec("ip dhcp pool LAN"); ok(e.prompt()==="Router(dhcp-config)#", "ip dhcp pool → (dhcp-config)#"); e.exec("network 10.1.1.0 /24"); e.exec("end");
  ok(/ip dhcp pool LAN\n network 10\.1\.1\.0 255\.255\.255\.0/.test(e.exec("show running-config")), "network N /24 is stored with a mask"); }

{ // DHCP review fixes: unicast renewal, distinct APIPA addresses, user-mode shows, re-plug after release
  const B = mk();
  pc(B, "p1", "ipconfig /renew");
  ok(/DHCP Request[\s\S]*unicast renewal[\s\S]*DHCP Ack/.test(log(B)) && !/DHCP Discover/.test(log(B)), "ipconfig /renew with a lease: unicast Request + Ack only", log(B));
  const B2 = mk(null, ["int g0/0", "no ip helper-address"], [{ id:"p4", kind:"pc", label:"PC4", x:400, y:350, dhcp:true }]);
  Bench.act(B2, ["plug", "cat6", "p4:eth", "sw:g4"]);
  const a1 = (pc(B2, "p2", "ipconfig").match(/169\.254\.\d+\.\d+/)||[])[0];
  cfg(["no ip dhcp pool LAGOS"])(B2.devs.r1.env); Bench.act(B2, ["dhcp", "p4"]);
  const a2 = (pc(B2, "p4", "ipconfig").match(/169\.254\.\d+\.\d+/)||[])[0];
  ok(a1 && a2 && a1!==a2, "two APIPA PCs pick different 169.254 addresses", a1 + " / " + a2);
  ok(/Bindings from all pools/.test((Bench.act(B, ["cli", "r1", "disable"]), cli(B, "r1", "show ip dhcp binding"))), "show ip dhcp binding works at the user-mode prompt");
  pc(B, "p1", "ipconfig /release"); Bench.act(B, ["unplug", "p1:eth"]); Bench.act(B, ["plug", "cat6", "p1:eth", "sw:g2"]);
  ok(B.devs.p1.ip==="192.168.10.12", "re-plugging the cable after /release: Windows asks again and gets its address back", B.devs.p1.ip); }

// ---- Stage 2: NAT/PAT and the router as a DHCP client ----
// LAN 192.168.10.0/24 — EDGE (G0/0 inside; G0/1 outside, ip address dhcp from the ISP) — ISP — web server 198.51.100.10
const NATX = { pat: ["access-list 1 permit 192.168.10.0 0.0.0.255", "ip nat inside source list 1 interface g0/1 overload", "int g0/0", "ip nat inside", "int g0/1", "ip nat outside", "exit"] };
const mkNat = (edgeX, extraPcs) => Bench.create({ devices: [
    { id:"edge", kind:"router", label:"EDGE", x:0, y:0, config: cfg(["int g0/0","ip address 192.168.10.1 255.255.255.0","no shut","int g0/1","ip address dhcp","no shut","exit",
      "ip dhcp excluded-address 192.168.10.1 192.168.10.9","ip dhcp pool LAN","network 192.168.10.0 255.255.255.0","default-router 192.168.10.1","exit", ...(edgeX||[])]) },
    { id:"isp", kind:"router", label:"ISP", x:300, y:0, config: cfg(["int g0/1","ip address 203.0.113.1 255.255.255.248","no shut","int g0/0","ip address 198.51.100.1 255.255.255.0","no shut","exit",
      "ip dhcp excluded-address 203.0.113.1","ip dhcp pool CUSTOMER","network 203.0.113.0 255.255.255.248","default-router 203.0.113.1","exit"]) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 },
    { id:"web", kind:"server", label:"WEB", x:300, y:200, ip:"198.51.100.10", mask:"255.255.255.0", gw:"198.51.100.1" },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:350, dhcp:true }, { id:"p2", kind:"pc", label:"PC2", x:100, y:350, dhcp:true }, ...(extraPcs||[]) ],
  cables: [{type:"cat6",a:"edge:g0",b:"sw:g1"},{type:"cat6",a:"p1:eth",b:"sw:g2"},{type:"cat6",a:"p2:eth",b:"sw:g3"},{type:"cat6",a:"edge:g1",b:"isp:g1"},{type:"cat6",a:"web:eth",b:"isp:g0"},
    ...(extraPcs||[]).map((x,k)=>({type:"cat6", a:x.id+":eth", b:"sw:g"+(4+k)}))] });

{ const B = mkNat();
  ok(Bench.ifLeased(B, "edge", "GigabitEthernet0/1")==="203.0.113.2", "EDGE G0/1 (ip address dhcp) leases 203.0.113.2 from the ISP", Bench.ifLeased(B, "edge", "GigabitEthernet0/1"));
  ok(/GigabitEthernet0\/1\s+203\.0\.113\.2\s+YES DHCP   up\s+up/.test(cli(B, "edge", "show ip interface brief")), "show ip interface brief: Method DHCP", cli(B, "edge", "show ip interface brief"));
  ok(/S\*\s+0\.0\.0\.0\/0 \[254\/0\] via 203\.0\.113\.1/.test(cli(B, "edge", "show ip route")), "the DHCP default router becomes S* 0.0.0.0/0 [254/0]", cli(B, "edge", "show ip route"));
  ok(/%DHCP-6-ADDRESS_ASSIGN: Interface GigabitEthernet0\/1 assigned DHCP address 203\.0\.113\.2, mask 255\.255\.255\.248, hostname EDGE/.test(cli(B, "edge", "show logging")), "syslog %DHCP-6-ADDRESS_ASSIGN", cli(B, "edge", "show logging"));
  ok(/ip address dhcp/.test(cli(B, "edge", "show running-config")) && !/ip address 203\.0\.113\.2/.test(cli(B, "edge", "show running-config")), "running-config keeps 'ip address dhcp', not the learned address");
  const ib = cli(B, "isp", "show ip dhcp binding");
  ok(/203\.0\.113\.2\s+0063\.6973\.636f\.2d[0-9a-f.]+\s+Oct 13 2026 08:30 AM\s+Automatic  Active     GigabitEthernet0\/1\n {16}[0-9a-f.]+/.test(ib), "the ISP's binding shows IOS's long 'cisco-…' client ID, wrapped", ib);
  ok(B.devs.p1.ip==="192.168.10.10" && B.devs.p2.ip==="192.168.10.11", "the LAN PCs lease from EDGE", B.devs.p1.ip + " " + B.devs.p2.ip);
  ok(/Request timed out\./.test(pc(B, "p1", "ping 198.51.100.10")) && /ISP has no route to 192\.168\.10\.10/.test(log(B)), "no NAT yet: the request reaches WEB but the ISP has no route back to a private address", log(B));
  cfg(NATX.pat)(B.devs.edge.env);
  const g = pc(B, "p1", "ping 198.51.100.10");
  ok(/Reply from 198\.51\.100\.10: bytes=32 time<1ms TTL=126/.test(g) && /NAT on EDGE \(Gi0\/0 inside → Gi0\/1 outside\): source 192\.168\.10\.10:1 → 203\.0\.113\.2:1/.test(log(B)) && /NAT on EDGE \(arriving on outside Gi0\/1\): destination 203\.0\.113\.2:1 → 192\.168\.10\.10:1/.test(log(B)), "PAT: the ping works and the frame log shows both translations", g + "\n" + log(B));
  pc(B, "p2", "ping 198.51.100.10");
  const tr = cli(B, "edge", "show ip nat translations");
  ok(/icmp 203\.0\.113\.2:1\s+192\.168\.10\.10:1\s+198\.51\.100\.10:1\s+198\.51\.100\.10:1\n/.test(tr) && /icmp 203\.0\.113\.2:1024\s+192\.168\.10\.11:1\s+198\.51\.100\.10:1\s+198\.51\.100\.10:1024\n/.test(tr) && /Total number of translations: 2$/.test(tr), "show ip nat translations: PC2's id 1 is taken, so it becomes 1024", tr);
  const trc = pc(B, "p1", "tracert 198.51.100.10");
  ok(/   1    <1 ms    <1 ms    <1 ms  192\.168\.10\.1\n   2    <1 ms    <1 ms    <1 ms  203\.0\.113\.1\n   3    <1 ms    <1 ms    <1 ms  198\.51\.100\.10\n/.test(trc), "tracert through PAT: every hop answers (its replies are translated back)", trc);
  ok(/Outside interfaces:\n  GigabitEthernet0\/1\nInside interfaces: \n  GigabitEthernet0\/0\n/.test(cli(B, "edge", "show ip nat statistics")), "show ip nat statistics names the inside and outside interfaces", cli(B, "edge", "show ip nat statistics"));
  cli(B, "edge", "clear ip nat translation *"); ok(/^Pro[^\n]*\nTotal number of translations: 0$/.test(cli(B, "edge", "show ip nat translations")), "clear ip nat translation *", cli(B, "edge", "show ip nat translations"));
  ok(/ip nat inside source list 1 interface GigabitEthernet0\/1 overload/.test(cli(B, "edge", "show running-config")) && /interface GigabitEthernet0\/0\n ip address 192\.168\.10\.1 255\.255\.255\.0\n ip nat inside/.test(cli(B, "edge", "show running-config")), "running-config: interface name expanded, ip nat inside under the interface", cli(B, "edge", "show running-config"));
  ok(Bench.natHas(B, "edge", /Total number/) , "task helper natHas"); }

{ // the NAT access list doesn't cover the LAN → untranslated, and the log says why
  const B = mkNat(["access-list 1 permit 192.168.20.0 0.0.0.255", "ip nat inside source list 1 interface g0/1 overload", "int g0/0", "ip nat inside", "int g0/1", "ip nat outside", "exit"]);
  ok(/Request timed out/.test(pc(B, "p1", "ping 198.51.100.10")) && /isn't matched by any NAT rule's access list/.test(log(B)), "wrong NAT ACL: the packet leaves untranslated and the reply can't come back", log(B));
  const B2 = mkNat(["access-list 1 permit 192.168.10.0 0.0.0.255", "ip nat inside source list 1 interface g0/1 overload", "int g0/0", "ip nat outside", "int g0/1", "ip nat inside", "exit"]);
  ok(/Request timed out/.test(pc(B2, "p1", "ping 198.51.100.10")), "inside and outside swapped: no translation"); }

{ // static NAT for a server inside, reached from the internet; dynamic pool without overload runs out
  const srv = { id:"cam", kind:"server", label:"NVR", x:200, y:350, ip:"192.168.10.80", mask:"255.255.255.0", gw:"192.168.10.1" };
  const B = mkNat(["ip nat inside source static 192.168.10.80 203.0.113.5", "access-list 1 permit 192.168.10.0 0.0.0.255", "ip nat pool PUB 203.0.113.3 203.0.113.4 netmask 255.255.255.248", "ip nat inside source list 1 pool PUB", "int g0/0", "ip nat inside", "int g0/1", "ip nat outside", "exit"],
    [srv, { id:"p3", kind:"pc", label:"PC3", x:300, y:350, dhcp:true }]);
  ok(/Reply from 203\.0\.113\.5: bytes=32/.test(pc(B, "web", "ping 203.0.113.5")), "static NAT: WEB on the internet reaches the inside NVR at 203.0.113.5 (EDGE answers ARP for it)", pc(B, "web", "ping 203.0.113.5"));
  ok(/---  203\.0\.113\.5\s+192\.168\.10\.80\s+---\s+---/.test(cli(B, "edge", "show ip nat translations")), "the static entry is listed");
  const r = ["p1","p2","p3"].map(id=>pc(B, id, "ping 198.51.100.10"));
  ok(/Reply from/.test(r[0]) && /Reply from/.test(r[1]) && /Request timed out/.test(r[2]) && /%NAT-6-ADDR_ALLOC_FAILURE/.test(cli(B, "edge", "show logging")), "dynamic pool of 2 addresses: the third PC is dropped and EDGE logs ADDR_ALLOC_FAILURE", r.join("\n---\n") + cli(B, "edge", "show logging")); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
