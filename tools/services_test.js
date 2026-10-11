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
  ok(/Host Name . . . . . . . . . . . . : PC1\n/.test(all) && /DNS Suffix Search List. . . . . . : lagos\.example\.com/.test(all) && /DHCP Enabled. . . . . . . . . . . : Yes\n   Autoconfiguration Enabled . . . . : Yes/.test(all) && /IPv4 Address. . . . . . . . . . . : 192\.168\.10\.12\(Preferred\)\n   Subnet Mask . . . . . . . . . . . : 255\.255\.255\.0\n   Lease Obtained. . . . . . . . . . : Monday, October 12, 2026 8:30:00 AM\n   Lease Expires . . . . . . . . . . : Tuesday, October 13, 2026 8:30:00 AM\n   Default Gateway . . . . . . . . . : 192\.168\.10\.1\n   DHCP Server . . . . . . . . . . . : 192\.168\.10\.1\n   DNS Servers . . . . . . . . . . . : 192\.168\.10\.53\n                                       8\.8\.8\.8\n   NetBIOS over Tcpip/.test(all), "ipconfig /all on a DHCP client", all);
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

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
