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
  ok(/  1    <1 ms    <1 ms    <1 ms  192\.168\.10\.1\n  2    <1 ms    <1 ms    <1 ms  203\.0\.113\.1\n  3    <1 ms    <1 ms    <1 ms  198\.51\.100\.10\n/.test(trc), "tracert through PAT: every hop answers (its replies are translated back)", trc);
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

{ // NAT counts packets like IOS: a Windows ping is 4 echoes each way → first packet a miss, 7 hits
  const B = mkNat(NATX.pat); pc(B, "p1", "ping 198.51.100.10");
  ok(/Hits: 7  Misses: 1/.test(cli(B, "edge", "show ip nat statistics")), "show ip nat statistics after one Windows ping: Hits: 7  Misses: 1", cli(B, "edge", "show ip nat statistics")); }

{ // regression: a router DHCP client whose server has no free address must not loop (the retry marker lives outside the config)
  const B = Bench.create({ devices: [
    { id:"e", kind:"router", label:"EDGE", x:0, y:0, config: cfg(["int g0/1","ip address dhcp","no shut"]) },
    { id:"i", kind:"router", label:"ISP", x:300, y:0, config: cfg(["int g0/1","ip address 203.0.113.1 255.255.255.252","no shut","exit","ip dhcp excluded-address 203.0.113.1 203.0.113.2","ip dhcp pool C","network 203.0.113.0 255.255.255.252"]) } ],
    cables: [{type:"cat6",a:"e:g1",b:"i:g1"}] });
  for (let k = 0; k < 5; k++) cli(B, "e", "show ip interface brief");
  ok(B._l3.sig.length < 20000 && /GigabitEthernet0\/1\s+unassigned\s+YES DHCP/.test(cli(B, "e", "show ip interface brief")), "exhausted ISP pool: EDGE stays unassigned, no retry loop", B._l3.sig.length); }

// ---- Stage 3: NTP, syslog, DNS, TFTP, SNMP ----
// HQ: R1 (LAN 192.168.10.0/24, server LAN 192.168.50.0/24 with SRV = DNS + TFTP + syslog + SNMP manager), link to branch router R2 (LAN 192.168.20.0/24)
const mkSvc = (r1x, r2x) => Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0","ip address 192.168.10.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.1 255.255.255.252","no shut","int g0/2","ip address 192.168.50.1 255.255.255.0","no shut","exit",
      "ip route 192.168.20.0 255.255.255.0 10.0.12.2","ip dhcp excluded-address 192.168.10.1 192.168.10.9","ip dhcp pool HQ","network 192.168.10.0 255.255.255.0","default-router 192.168.10.1","dns-server 192.168.50.10","domain-name hq.example.com","exit", ...(r1x||[])]) },
    { id:"r2", kind:"router", label:"R2", x:300, y:0, config: cfg(["int g0/0","ip address 192.168.20.1 255.255.255.0","no shut","int g0/1","ip address 10.0.12.2 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 10.0.12.1", ...(r2x||[])]) },
    { id:"sw", kind:"switch", label:"SW1", x:0, y:200 }, { id:"sw2", kind:"switch", label:"SW-SRV", x:150, y:200 },
    { id:"srv", kind:"server", label:"SRV", x:150, y:350, ip:"192.168.50.10", mask:"255.255.255.0", gw:"192.168.50.1",
      services:{ dns:{ name:"srv.hq.example.com", records:{ "portal.hq.example.com":"192.168.50.20", "srv.hq.example.com":"192.168.50.10" } }, tftp:{ files:{} }, syslog:true, nms:true } },
    { id:"web", kind:"server", label:"PORTAL", x:250, y:350, ip:"192.168.50.20", mask:"255.255.255.0", gw:"192.168.50.1" },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:350, dhcp:true },
    { id:"p2", kind:"pc", label:"PC2", x:300, y:350, ip:"192.168.20.10", mask:"255.255.255.0", gw:"192.168.20.1", dns:"192.168.20.1" } ],
  cables: [{type:"cat6",a:"r1:g0",b:"sw:g1"},{type:"cat6",a:"p1:eth",b:"sw:g2"},{type:"cat6",a:"r1:g2",b:"sw2:g1"},{type:"cat6",a:"srv:eth",b:"sw2:g2"},{type:"cat6",a:"web:eth",b:"sw2:g3"},{type:"cat6",a:"r1:g1",b:"r2:g1"},{type:"cat6",a:"p2:eth",b:"r2:g0"}] });

{ // NTP and the clock
  const B = mkSvc();
  ok(cli(B, "r2", "show clock")==="*08:30:00.000 UTC Mon Oct 12 2026", "show clock before NTP: '*' = not authoritative", cli(B, "r2", "show clock"));
  ok(cli(B, "r2", "show ntp status")==="%NTP is not enabled." && cli(B, "r2", "show ntp associations")==="%NTP is not enabled.", "no NTP configured: %NTP is not enabled.");
  cfg(["ntp master 3"])(B.devs.r1.env); cfg(["ntp server 10.0.12.1", "clock timezone WAT 1"])(B.devs.r2.env);
  ok(/^Clock is synchronized, stratum 3, reference is 127\.127\.1\.1/.test(cli(B, "r1", "show ntp status")), "R1 ntp master 3: synchronized to its own clock, stratum 3", cli(B, "r1", "show ntp status"));
  ok(/reference time is EE771908\.3F5C28F6 /.test(cli(B, "r1", "show ntp status")) && /root delay is 0\.00 msec/.test(cli(B, "r1", "show ntp status")), "reference time is the real NTP timestamp (seconds since 1900, hex); a master has 0 root delay", cli(B, "r1", "show ntp status"));
  ok(/^Clock is synchronized, stratum 4, reference is 10\.0\.12\.1/.test(cli(B, "r2", "show ntp status")), "R2 ntp server 10.0.12.1: stratum 4 (one more than its server)", cli(B, "r2", "show ntp status"));
  ok(/\*~10\.0\.12\.1\s+127\.127\.1\.1\s+3 /.test(cli(B, "r2", "show ntp associations")) && / \* sys\.peer, # selected, \+ candidate, - outlyer, x falseticker, ~ configured$/.test(cli(B, "r2", "show ntp associations")), "show ntp associations: *~ = configured and the sys.peer", cli(B, "r2", "show ntp associations"));
  ok(cli(B, "r2", "show clock")==="09:30:00.000 WAT Mon Oct 12 2026", "synchronized: no '*', and clock timezone WAT 1 shifts the display", cli(B, "r2", "show clock"));
  ok(/clock timezone WAT 1 0/.test(cli(B, "r2", "show running-config")) && /ntp server 10\.0\.12\.1\n!\nend$/.test(cli(B, "r2", "show running-config")), "running-config: clock timezone near the top, ntp server at the end", cli(B, "r2", "show running-config"));
  ok(Bench.ntpSynced(B, "r2"), "task helper ntpSynced");
  cfg(["no ntp server 10.0.12.1", "ntp server 10.0.99.9"])(B.devs.r2.env);
  ok(/^Clock is unsynchronized/.test(cli(B, "r2", "show ntp status")) && /^ ~10\.0\.99\.9\s+\.INIT\.\s+16 /m.test(cli(B, "r2", "show ntp associations")), "an unreachable NTP server: unsynchronized, the peer stays .INIT. at stratum 16", cli(B, "r2", "show ntp associations"));
  ok(cli(B, "r2", "show clock").startsWith(".09:30") && /Time source is NTP/.test(cli(B, "r2", "show clock detail")), "sync lost after it had been synchronised: '.' prefix, time source still NTP", cli(B, "r2", "show clock"));
  cfg(["ntp master 3", "no ntp master 3"])(B.devs.r1.env); ok(!/ntp master/.test(cli(B, "r1", "show running-config")), "no ntp master 3 removes it"); }

{ // syslog: the router's console messages are logged; a syslog server receives those at or below the trap level
  const B = mkSvc(null, ["logging host 192.168.50.10", "logging trap warnings"]);
  cfg(["int g0/0", "shutdown"])(B.devs.r2.env); cfg(["int g0/0", "no shutdown"])(B.devs.r2.env);
  const sl = cli(B, "r2", "show logging");
  ok(/Trap logging: level warnings, \d+ message lines logged\n        Logging to 192\.168\.50\.10  \(udp port 514, audit disabled,/.test(sl) && /\*Oct 12 08:3\d:\d\d\.\d{3}: %SYS-5-CONFIG_I: Configured from console by console/.test(sl) && /%LINK-5-CHANGED: Interface GigabitEthernet0\/0, changed state to administratively down/.test(sl), "show logging: trap level, the syslog server, and the console messages in the buffer", sl);
  ok(Bench.syslogGot(B, "srv", /%LINK-3-UPDOWN: Interface GigabitEthernet0\/0, changed state to up/) && !Bench.syslogGot(B, "srv", /%SYS-5-CONFIG_I/) && !Bench.syslogGot(B, "srv", /LINEPROTO-5/), "the server gets severity 0–4 only (LINK-3 yes; CONFIG_I and LINEPROTO-5 are level 5)");
  ok(/logging trap warnings\nlogging host 192\.168\.50\.10/.test(cli(B, "r2", "show running-config")), "running-config: logging trap + logging host");
  const B2 = mkSvc(null, ["logging host 192.168.50.10", "no ip route 0.0.0.0 0.0.0.0 10.0.12.1"]); cfg(["int g0/0", "shutdown"])(B2.devs.r2.env);
  ok(!Bench.syslogGot(B2, "srv", /LINK/), "no route to the syslog server: nothing arrives (syslog is one-way UDP, no error on the router)"); }

{ // DNS: Windows (nslookup, ping/tracert by name), IOS (name-server, host table), a router as DNS server
  const B = mkSvc(["ip dns server", "ip host files 192.168.50.20", "ip name-server 192.168.50.10"]);
  ok(B.devs.p1.dns[0]==="192.168.50.10" && B.devs.p1.domain==="hq.example.com", "PC1 learns the DNS server and suffix from DHCP");
  const ns = pc(B, "p1", "nslookup portal");
  ok(ns==="Server:  srv.hq.example.com\nAddress:  192.168.50.10\n\nName:    portal.hq.example.com\nAddress:  192.168.50.20\n", "nslookup adds the DNS suffix; the authoritative server answers", ns);
  ok(/^\nPinging portal\.hq\.example\.com \[192\.168\.50\.20\] with 32 bytes of data:\nReply from 192\.168\.50\.20: bytes=32/.test(pc(B, "p1", "ping portal")), "ping by name", pc(B, "p1", "ping portal"));
  ok(/^\nTracing route to portal\.hq\.example\.com \[192\.168\.50\.20\]\nover a maximum of 30 hops:\n/.test(pc(B, "p1", "tracert portal")), "tracert by name: the two-line header", pc(B, "p1", "tracert portal"));
  ok(/\*\*\* srv\.hq\.example\.com can't find nothere: Non-existent domain/.test(pc(B, "p1", "nslookup nothere")), "unknown name: Non-existent domain (named as typed)", pc(B, "p1", "nslookup nothere"));
  ok((pc(B, "p1", "nslookup portal 10.9.9.9").match(/DNS request timed out\./g)||[]).length===5 && /\*\*\* Request to UnKnown timed-out$/.test(pc(B, "p1", "nslookup portal 10.9.9.9")), "a dead server: one timeout before the Server block and four after (A and AAAA lookups)", pc(B, "p1", "nslookup portal 10.9.9.9"));
  ok(/^Default Server:  srv\.hq\.example\.com\nAddress:  192\.168\.50\.10/.test(pc(B, "p1", "nslookup")), "interactive nslookup names the default server");
  ok(/^Ping request could not find host nothere\. Please check the name and try again\.$/.test(pc(B, "p1", "ping nothere")), "ping an unknown name");
  ok(/DNS request timed out\.\n    timeout was 2 seconds\./.test(pc(B, "p1", "nslookup portal 10.9.9.9")), "nslookup to a server that doesn't answer: timed out");
  // PC2 uses its branch router R2 as DNS server — R2 has no "ip dns server", so nothing answers
  ok(/could not find host portal\.hq\.example\.com/.test(pc(B, "p2", "ping portal.hq.example.com")), "a DNS server address that isn't running DNS: the name can't be resolved");
  cfg(["ip dns server", "ip name-server 192.168.50.10"])(B.devs.r2.env);
  const ns2 = pc(B, "p2", "nslookup portal.hq.example.com");
  ok(/^Server:  UnKnown\nAddress:  192\.168\.20\.1\n\nNon-authoritative answer:\nName:    portal\.hq\.example\.com\nAddress:  192\.168\.50\.20\n$/.test(ns2), "R2 as a DNS server forwards to SRV: Non-authoritative answer", ns2);
  // IOS resolving names
  cfg(["ip domain name hq.example.com", "ip name-server 192.168.50.10", "ip host printer 192.168.20.30"])(B.devs.r1.env);
  ok(/^Translating "portal"\.\.\.domain server \(192\.168\.50\.10\) \[OK\]\n\nType escape sequence to abort\.\nSending 5, 100-byte ICMP Echos to 192\.168\.50\.20/.test(cli(B, "r1", "ping portal")), "IOS ping by name: Translating … [OK], then the ping", cli(B, "r1", "ping portal"));
  ok(/Host                      Port  Flags      Age Type   Address\(es\)\nfiles\s+None  \(perm, OK\)  0   IP     192\.168\.50\.20\nprinter\s+None  \(perm, OK\)  0   IP     192\.168\.20\.30/.test(cli(B, "r1", "show hosts")) && /Name servers are 192\.168\.50\.10/.test(cli(B, "r1", "show hosts")), "show hosts: the static host table", cli(B, "r1", "show hosts"));
  ok(/^Translating "nothere"\.\.\.domain server \(192\.168\.50\.10\)\n% Unrecognized host or address, or protocol not running\.$/.test(cli(B, "r1", "ping nothere")), "IOS: an unknown name", cli(B, "r1", "ping nothere"));
  ok(/^Translating "portal"\.\.\.domain server \(192\.168\.50\.10\) \[OK\]\nType escape sequence to abort\.\nTracing the route to portal\.hq\.example\.com \(192\.168\.50\.20\)/.test(cli(B, "r1", "traceroute portal")), "IOS traceroute by name", cli(B, "r1", "traceroute portal"));
  ok(/portal\.hq\.example\.com\s+None  \(temp, OK\)  0   IP     192\.168\.50\.20/.test(cli(B, "r1", "show hosts")), "a name learned from DNS is cached in show hosts as temp", cli(B, "r1", "show hosts"));
  ok(/ip host files 192\.168\.50\.20\nip host printer 192\.168\.20\.30\nip name-server 192\.168\.50\.10/.test(cli(B, "r1", "show running-config")) && /ip dns server/.test(cli(B, "r1", "show running-config")), "running-config: ip host, ip name-server, ip dns server");
  ok(Bench.resolved(B, "p1", "portal"), "task helper resolved"); }

{ // TFTP backup and restore
  const B = mkSvc();
  let r = Bench.act(B, ["cli", "r2", "copy running-config tftp:"]); ok(/Address or name of remote host \[\]\? $/.test(out(r)), "copy running-config tftp: asks for the server", out(r));
  r = Bench.act(B, ["cli", "r2", "192.168.50.10"]); ok(/Destination filename \[r2-confg\]\? $/.test(out(r)), "… then suggests <hostname>-confg", out(r));
  r = Bench.act(B, ["cli", "r2", ""]); ok(/^!!\n\d+ bytes copied in 0\.512 secs \(\d+ bytes\/sec\)$/.test(out(r)) && Bench.tftpFile(B, "srv", "r2-confg"), "backup: !! and the byte count; the file is on the server", out(r));
  ok(/ip route 0\.0\.0\.0 0\.0\.0\.0 10\.0\.12\.1/.test(B.devs.srv.services.tftp.files["r2-confg"]), "the saved file is the running-config");
  cfg(["no ip route 0.0.0.0 0.0.0.0 10.0.12.1"])(B.devs.r2.env);
  Bench.act(B, ["cli", "r2", "copy running-config tftp:"]); Bench.act(B, ["cli", "r2", "192.168.50.10"]); r = Bench.act(B, ["cli", "r2", "r2-new"]);
  ok(/%Error opening tftp:\/\/192\.168\.50\.10\/r2-new \(Timed out\)/.test(out(r)), "no route to the TFTP server: Timed out", out(r));
  cfg(["ip route 192.168.50.0 255.255.255.0 10.0.12.1"])(B.devs.r2.env);
  Bench.act(B, ["cli", "r2", "copy tftp: running-config"]); Bench.act(B, ["cli", "r2", "192.168.50.10"]); Bench.act(B, ["cli", "r2", "r2-confg"]); r = Bench.act(B, ["cli", "r2", ""]);
  ok(/^Accessing tftp:\/\/192\.168\.50\.10\/r2-confg\.\.\.\nLoading r2-confg from 192\.168\.50\.10 \(via GigabitEthernet0\/1\): !\n\[OK - \d+ bytes\]\n\n\d+ bytes copied in/.test(out(r)) && /S\*\s+0\.0\.0\.0\/0 \[1\/0\] via 10\.0\.12\.1/.test(cli(B, "r2", "show ip route")), "restore: copy tftp: running-config merges the saved file — the default route is back", out(r) + "\n" + cli(B, "r2", "show ip route"));
  Bench.act(B, ["cli", "r2", "copy tftp: running-config"]); Bench.act(B, ["cli", "r2", "192.168.50.10"]); Bench.act(B, ["cli", "r2", "nosuch"]); r = Bench.act(B, ["cli", "r2", ""]);
  ok(/%Error opening tftp:\/\/192\.168\.50\.10\/nosuch \(No such file or directory\)/.test(out(r)), "a file the server doesn't have", out(r)); }

{ // SNMP: polling from the management server, communities, ACL, write access, traps
  const B = mkSvc(null, ["snmp-server community LabRO RO", "snmp-server community LabRW RW", "snmp-server location Kano branch, comms room", "snmp-server contact noc@example.com",
    "access-list 5 permit host 192.168.50.99", "snmp-server community Locked RO 5", "snmp-server host 192.168.50.10 version 2c LabRO", "snmp-server enable traps"]);
  const g = pc(B, "srv", "snmpget -v2c -c LabRO 10.0.12.2 sysName.0 sysLocation.0");
  ok(g==="SNMPv2-MIB::sysName.0 = STRING: R2\nSNMPv2-MIB::sysLocation.0 = STRING: Kano branch, comms room", "snmpget sysName.0 sysLocation.0", g);
  ok(/^IF-MIB::ifDescr\.1 = STRING: GigabitEthernet0\/0\nIF-MIB::ifDescr\.2 = STRING: GigabitEthernet0\/1/.test(pc(B, "srv", "snmpwalk -v2c -c LabRO 10.0.12.2 ifDescr")), "snmpwalk ifDescr", pc(B, "srv", "snmpwalk -v2c -c LabRO 10.0.12.2 ifDescr"));
  ok(/IF-MIB::ifOperStatus\.3 = INTEGER: down\(2\)/.test(pc(B, "srv", "snmpwalk -v2c -c LabRO 10.0.12.2 ifOperStatus")), "ifOperStatus of an unused port: down(2)");
  ok(pc(B, "srv", "snmpget -v2c -c wrong 10.0.12.2 sysName.0")==="Timeout: No Response from 10.0.12.2.", "a wrong community: the agent stays silent → Timeout");
  ok(pc(B, "srv", "snmpget -v2c -c Locked 10.0.12.2 sysName.0")==="Timeout: No Response from 10.0.12.2.", "a community limited by ACL 5 to another host: Timeout");
  ok(/^Error in packet\.\nReason: noAccess/.test(pc(B, "srv", 'snmpset -v2c -c LabRO 10.0.12.2 sysLocation.0 s "Kano rack 3"')), "snmpset with a read-only community: noAccess");
  ok(/sysLocation\.0 = STRING: Kano rack 3/.test(pc(B, "srv", 'snmpset -v2c -c LabRW 10.0.12.2 sysLocation.0 s "Kano rack 3"')) && /snmp-server location Kano rack 3/.test(cli(B, "r2", "show running-config")), "snmpset with RW changes the router's location");
  ok(/not recognized as an internal or external command/.test(pc(B, "p1", "snmpget -v2c -c LabRO 10.0.12.2 sysName.0")), "an ordinary PC has no SNMP tools");
  ok(pc(B, "srv", "snmpwalk -v2c -c wrong 10.0.12.2 ifDescr")==="Timeout: No Response from 10.0.12.2", "snmpwalk timeout has no full stop (Net-SNMP)");
  ok(/IF-MIB::ifDescr\.\d+ = STRING: Null0$/.test(pc(B, "srv", "snmpwalk -v2c -c LabRO 10.0.12.2 ifDescr")), "the ifTable ends with Null0");
  ok(/^Chassis: \S+\nContact: noc@example\.com\nLocation: Kano rack 3\n\d+ SNMP packets input\n    0 Bad SNMP version errors\n    \d+ Unknown community name/.test(cli(B, "r2", "show snmp")) && cli(B, "r1", "show snmp")==="%SNMP agent not enabled", "show snmp (counters) / %SNMP agent not enabled", cli(B, "r2", "show snmp"));
  cfg(["int g0/0", "shutdown"])(B.devs.r2.env);
  ok(Bench.trapGot(B, "srv", /GigabitEthernet0\/0, changed state to down/) || Bench.trapGot(B, "srv", /administratively down/) || Bench.trapGot(B, "srv", /LINEPROTO.*down/), "traps: the interface going down reaches the manager", JSON.stringify(B.syslog.r2.map(x=>x.msg)));
  ok(/snmp-server community LabRO RO\nsnmp-server community LabRW RW\nsnmp-server community Locked RO 5\nsnmp-server location Kano rack 3\nsnmp-server contact noc@example\.com\nsnmp-server enable traps snmp authentication linkdown linkup coldstart warmstart\nsnmp-server enable traps config\nsnmp-server host 192\.168\.50\.10 version 2c LabRO/.test(cli(B, "r2", "show running-config")), "running-config: snmp-server lines", cli(B, "r2", "show running-config")); }

// ---- fixes from the Module 7 writers and fact-checks ----
{ // (dhcp-config)# is a config sub-mode: do, a second pool, any global command
  const e = SIM.ios2Env({kind:"router"}); for (const c of ["en","conf t","int g0/0","ip address 10.1.1.1 255.255.255.0","no shut","exit","ip dhcp pool A","network 10.1.1.0 255.255.255.0"]) e.exec(c);
  ok(/Pool A :/.test(e.exec("do show ip dhcp pool")), "do show … works inside (dhcp-config)#");
  e.exec("ip dhcp pool B"); ok(e.prompt()==="Router(dhcp-config)#", "a second ip dhcp pool typed inside the first switches pools", e.prompt());
  e.exec("network 10.2.2.0 255.255.255.0"); e.exec("interface g0/1"); ok(e.prompt()==="Router(config-if)#", "a global command typed in (dhcp-config)# drops to global config and runs", e.prompt());
  e.exec("end"); ok(/ip dhcp pool B\n network 10\.2\.2\.0 255\.255\.255\.0/.test(e.exec("show running-config")), "pool B got its network");
  // hashed secrets restored from a backup still log in
  for (const c of ["conf t","enable secret Lagos#Core1","username netops secret N0c!pass","end"]) e.exec(c);
  const run = e.exec("show running-config"), sec = run.match(/enable secret 9 (\S+)/)[1], us = run.match(/username netops secret 9 (\S+)/)[1];
  const e2 = SIM.ios2Env({kind:"router"}); for (const c of ["en","conf t","enable secret 9 " + sec,"username netops secret 9 " + us,"end","disable"]) e2.exec(c);
  const a = e2.exec("enable"); ok(a && a.ask && /Password/.test(a.ask) && (e2.exec("Lagos#Core1"), e2.prompt()==="Router#"), "enable secret 9 <hash> merged from a backup: the original secret works", e2.prompt());
  ok(/^\*?\.?\d\d:\d\d:\d\d\.\d{3} UTC /.test((e2.exec("disable"), e2.exec("show clock"))), "show clock at the user prompt shows the real clock", e2.exec("show clock")); }
{ const B = mk();
  ok(/  Helper address is 10\.0\.12\.1\n/.test(cli(B, "r2", "show ip interface g0/0")), "show ip interface: Helper address is 10.0.12.1", cli(B, "r2", "show ip interface g0/0"));
  ok(/^Building configuration\.\.\.\n\nCurrent configuration : \d+ bytes\n!\ninterface GigabitEthernet0\/0\n ip address 192\.168\.20\.1 255\.255\.255\.0\n ip helper-address 10\.0\.12\.1\nend$/.test(cli(B, "r2", "show running-config interface g0/0")), "show running-config interface g0/0", cli(B, "r2", "show running-config interface g0/0"));
  cfg(["no ip domain-lookup", "ip domain lookup"])(B.devs.r1.env); ok(!/no ip domain lookup/.test(cli(B, "r1", "show running-config")), "ip domain lookup (with a space) turns lookups back on");
  ok(/Packet sent with a source address of 192\.168\.20\.1/.test(cli(B, "r2", "ping 192.168.10.1 source gigabitethernet 0/0")), "ping … source <type> <number> (with a space)", cli(B, "r2", "ping 192.168.10.1 source gigabitethernet 0/0"));
  pc(B, "p1", "ipconfig /release"); Bench.act(B, ["dhcp", "p3"]); const r = pc(B, "p3", "ipconfig /renew");
  ok(!/PC1/.test(log(B)), "/renew logs only its own attempt (not the previous action's frames)", log(B)); }
{ // NAT: reply source after a static translation, traceroute's last hop, PAT keeps a socket's port, alias without ip nat outside, interface port forward
  const srv = { id:"cam", kind:"server", label:"NVR", x:200, y:350, ip:"192.168.10.80", mask:"255.255.255.0", gw:"192.168.10.1" };
  const B = mkNat(["ip nat inside source static 192.168.10.80 203.0.113.5", ...NATX.pat, "ip nat inside source static tcp 192.168.10.80 443 interface g0/1 8443"], [srv]);
  pc(B, "web", "ping 203.0.113.5");
  ok(!/isn't matched by any NAT rule/.test(log(B)) && /source 192\.168\.10\.80:\d+ → 203\.0\.113\.5/.test(log(B)), "an outside ping of a static global: the reply is translated back on the way out (frame log)", log(B));
  ok(/\s203\.0\.113\.5\n\nTrace complete\./.test(pc(B, "web", "tracert 203.0.113.5")), "tracert from outside to a static global ends at the global address", pc(B, "web", "tracert 203.0.113.5"));
  pc(B, "p1", "ping 198.51.100.10"); pc(B, "p1", "ping 198.51.100.1");
  const t = cli(B, "edge", "show ip nat translations");
  ok(/icmp 203\.0\.113\.2:1\s+192\.168\.10\.10:1\s+198\.51\.100\.1:1/.test(t) && !/:1026/.test(t), "PAT: the same PC socket to a second destination keeps its global port", t);
  ok(/tcp  203\.0\.113\.2:8443\s+192\.168\.10\.80:443\s+---\s+---/.test(t) && /ip nat inside source static tcp 192\.168\.10\.80 443 interface GigabitEthernet0\/1 8443/.test(cli(B, "edge", "show running-config")), "port forward to the interface address", t);
  ok(!/\(\d+ match/.test(cli(B, "edge", "show access-lists")), "NAT lookups don't count as ACL matches (IOS XE)", cli(B, "edge", "show access-lists"));
  ok(/Dynamic\s+203\.0\.113\.5/.test(cli(B, "edge", "show ip aliases")), "show ip aliases lists the static global", cli(B, "edge", "show ip aliases"));
  const B2 = mkNat(["ip nat inside source static 192.168.10.80 203.0.113.5", "int g0/0", "ip nat inside", "exit"], [srv]);
  ok(/Request timed out/.test(pc(B2, "web", "ping 203.0.113.5")) && /ARP reply[^\n]*EDGE/.test(log(B2)), "the alias answers ARP even before ip nat outside (the ping still fails until it is set)", log(B2)); }
{ // DNS server details, Windows resolver cache
  const B = mkSvc(["ip dns server", "ip host files 192.168.50.20", "ip name-server 192.168.50.10", "ip domain name hq.example.com", "ip host kano-prn.hq.example.com 192.168.20.30"]);
  ok(/Translating "kano-prn"|Sending 5, 100-byte ICMP Echos to 192\.168\.20\.30/.test(cli(B, "r1", "ping kano-prn")) && !/Unrecognized/.test(cli(B, "r1", "ping kano-prn")), "a short name matches a dotted ip host entry with the default domain", cli(B, "r1", "ping kano-prn"));
  cfg(["ip dns server", "ip name-server 192.168.50.10"])(B.devs.r2.env);
  ok(/Non-authoritative answer:/.test(pc(B, "p2", "nslookup portal.hq.example.com")), "forwarded answer: non-authoritative");
  cfg(["ip host branch-prn 192.168.20.30"])(B.devs.r2.env);
  ok(/Non-authoritative answer:\nName:    branch-prn/.test(pc(B, "p2", "nslookup branch-prn")), "host-table answer from an IOS DNS server: also non-authoritative", pc(B, "p2", "nslookup branch-prn"));
  cfg(["no ip domain-lookup"])(B.devs.r2.env);
  ok(/Non-existent domain|can't find/.test(pc(B, "p2", "nslookup portal.hq.example.com")), "with no ip domain lookup the IOS DNS server stops forwarding", pc(B, "p2", "nslookup portal.hq.example.com"));
  pc(B, "p1", "ping portal"); ok(/Record Name . . . . . : portal\.hq\.example\.com\n[\s\S]*A \(Host\) Record . . . : 192\.168\.50\.20/.test(pc(B, "p1", "ipconfig /displaydns")), "ipconfig /displaydns lists the cached answer", pc(B, "p1", "ipconfig /displaydns"));
  pc(B, "p1", "ipconfig /flushdns"); ok(/Could not display the DNS Resolver Cache\./.test(pc(B, "p1", "ipconfig /displaydns")), "/flushdns empties it"); }
{ // link changes are logged on both ends; SNMP details
  const B = mkSvc(null, ["snmp-server community LabRO RO", "snmp-server host 192.168.50.10 version 2c LabRO", "snmp-server enable traps"]);
  cfg(["int g0/1", "shutdown"])(B.devs.r1.env); cli(B, "r2", "show clock");
  ok(Bench.logged(B, "r2", /%LINK-3-UPDOWN: Interface GigabitEthernet0\/1, changed state to down/) && Bench.logged(B, "r2", /%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0\/1, changed state to down/), "R1 shuts its side: R2 logs its own link going down");
  Bench.act(B, ["unplug", "p2:eth"]);
  ok(Bench.logged(B, "r2", /Interface GigabitEthernet0\/0, changed state to down/), "pulling a cable: the router logs the link down");
  cfg(["int g0/1", "no shutdown"])(B.devs.r1.env); Bench.act(B, ["plug", "cat6", "p2:eth", "r2:g0"]);
  ok(Bench.trapGot(B, "srv", /GigabitEthernet0\/0, changed state to down/), "… and the manager gets the linkDown trap");
  ok(/^DISMAN-EVENT-MIB::sysUpTimeInstance = Timeticks:/.test(pc(B, "srv", "snmpget -v2c -c LabRO 10.0.12.2 sysUpTime.0")), "sysUpTimeInstance has no .0", pc(B, "srv", "snmpget -v2c -c LabRO 10.0.12.2 sysUpTime.0"));
  const w = pc(B, "srv", "snmpwalk -v2c -c LabRO 10.0.12.2");
  ok(/sysName\.0 = STRING: R2/.test(w) && /IF-MIB::ifOperStatus/.test(w), "snmpwalk with no object walks mib-2 (system and interfaces)", w); }
{ // last format review: verbose NAT, aliases for pool addresses in use, NAK for a now-excluded address, "No response from server"
  const B = mkNat(NATX.pat); pc(B, "p1", "ping 198.51.100.10");
  ok(/icmp 203\.0\.113\.2:1[^\n]*\n  create: [^\n]*timeout: 00:01:00\n  Map-Id\(In\): 1\n  Mac-Address: 0000\.0000\.0000    Input-IDB: GigabitEthernet0\/0\n  entry-id: 0x0, use_count:0/.test(cli(B, "edge", "show ip nat translations verbose")), "show ip nat translations verbose (IOS XE layout)", cli(B, "edge", "show ip nat translations verbose"));
  const B2 = mkNat(["access-list 1 permit 192.168.10.0 0.0.0.255", "ip nat pool PUB 203.0.113.3 203.0.113.4 netmask 255.255.255.248", "ip nat inside source list 1 pool PUB", "int g0/0", "ip nat inside", "int g0/1", "ip nat outside", "exit"]);
  ok(!/203\.0\.113\.3/.test(cli(B2, "edge", "show ip aliases")), "an unused pool address isn't listed in show ip aliases");
  pc(B2, "p1", "ping 198.51.100.10"); ok(/Dynamic\s+203\.0\.113\.3/.test(cli(B2, "edge", "show ip aliases")), "… it is once a translation uses it", cli(B2, "edge", "show ip aliases"));
  const B3 = mk(); cfg(["ip dhcp excluded-address 192.168.10.12"])(B3.devs.r1.env); pc(B3, "p1", "ipconfig /renew");
  ok(/DHCP NAK/.test(log(B3)) && B3.devs.p1.ip && B3.devs.p1.ip!=="192.168.10.12", "renewing an address that is now excluded: NAK, then a new lease", log(B3));
  const B4 = mkSvc(); ok(/^Server:  UnKnown\nAddress:  192\.168\.20\.1\n\n\*\*\* UnKnown can't find portal\.hq\.example\.com: No response from server$/.test(pc(B4, "p2", "nslookup portal.hq.example.com")), "nslookup to a router that runs no DNS server: No response from server", pc(B4, "p2", "nslookup portal.hq.example.com")); }

{ const B = Bench.create({ devices: [
    { id:"r1", kind:"router", label:"R1", x:0, y:0, config: cfg(["int g0/0","ip address 10.5.5.1 255.255.255.252","no shut","exit","ip dhcp pool T","network 10.5.5.0 255.255.255.252"]) },
    { id:"p1", kind:"pc", label:"PC1", x:0, y:300, dhcp:true } ], cables: [{type:"cat6",a:"r1:g0",b:"p1:eth"}] });
  ok(/^ 0\.0\.0\.0\s+10\.5\.5\.1/m.test(cli(B, "r1", "show ip dhcp pool")), "a full pool shows Current index 0.0.0.0", cli(B, "r1", "show ip dhcp pool")); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
