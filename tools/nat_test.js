#!/usr/bin/env node
// Ladder Lab — NAT/PAT helper tests (nat.js + acl.js): static, port forward, dynamic pool (and exhaustion), PAT on a pool and
// on the outside interface (port preservation, conflicts), return traffic, show ip nat translations / statistics, clear.
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["acl.js", "nat.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ctx, { filename: f });
const { ACL, NAT } = ctx; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log(String(extra).split("\n").map(l=>"      "+l).join("\n")); } else console.log("ok  ", msg); };
const icmp = (src, dst, id) => ({ src, dst, proto: "icmp", sport: id, dport: id });
const tcp = (src, sp, dst, dp) => ({ src, dst, proto: "tcp", sport: sp, dport: dp });

{ // PAT on the outside interface — the home/branch router case
  const acl = ACL.store(); ACL.globalCmd(acl, "access-list 1 permit 192.168.1.0 0.0.0.255");
  const st = NAT.store(); const C = { acl, ACL, ifAddr: n => n==="GigabitEthernet0/1" ? "203.0.113.2" : null };
  { const t2 = NAT.store(); ok(!NAT.globalCmd(t2, "ip nat inside source list 1 interface GigabitEthernet0/1").err && / overload$/.test(NAT.running(t2)[0]), "interface form without 'overload' is accepted and stored with overload (IOS adds it)", NAT.running(t2).join()); }
  ok(!NAT.globalCmd(st, "ip nat inside source list 1 interface GigabitEthernet0/1 overload").err, "PAT rule accepted");
  const a = NAT.outbound(st, icmp("192.168.1.10", "8.8.8.8", 1), C);
  ok(a.pkt.src==="203.0.113.2" && a.pkt.sport===1, "first ping: source → 203.0.113.2, ICMP id 1 kept (port preservation)", JSON.stringify(a.pkt));
  const b = NAT.outbound(st, icmp("192.168.1.11", "8.8.8.8", 1), C);
  ok(b.pkt.src==="203.0.113.2" && b.pkt.sport===1024, "second PC with the same id 1 → gets 1024 (port already taken)", JSON.stringify(b.pkt));
  const r1 = NAT.inbound(st, { src: "8.8.8.8", dst: "203.0.113.2", proto: "icmp", sport: 1024, dport: 1024 });
  ok(r1 && r1.pkt.dst==="192.168.1.11" && r1.pkt.dport===1, "the reply to 1024 goes back to .11 with its own id", JSON.stringify(r1 && r1.pkt));
  ok(!NAT.inbound(st, tcp("198.51.100.9", 4444, "203.0.113.2", 3389)), "unsolicited inbound to the PAT address: no entry → not translated");
  const c = NAT.outbound(st, tcp("192.168.1.10", 50000, "93.184.216.34", 80), C);
  ok(c.pkt.sport===50000, "TCP source port kept when free");
  const sh = NAT.show(st);
  ok(/^Pro  Inside global         Inside local          Outside local         Outside global\nicmp 203\.0\.113\.2:1\s+192\.168\.1\.10:1\s+8\.8\.8\.8:1\s+8\.8\.8\.8:1\n/.test(sh) && /icmp 203\.0\.113\.2:1024\s+192\.168\.1\.11:1\s+8\.8\.8\.8:1\s+8\.8\.8\.8:1024\n/.test(sh) && /tcp  203\.0\.113\.2:50000\s+192\.168\.1\.10:50000\s+93\.184\.216\.34:80/.test(sh) && /\nTotal number of translations: 3$/.test(sh), "show ip nat translations (ICMP: outside local keeps id 1, outside global shows 1024; XE total line)", sh);
  const u = NAT.outbound(st, icmp("10.9.9.9", "8.8.8.8", 7), C);
  ok(u.untranslated && u.pkt.src==="10.9.9.9", "a source the ACL doesn't permit is not translated");
  NAT.clear(st); ok(!/icmp|tcp/.test(NAT.show(st)), "clear ip nat translation * empties the dynamic table"); }

{ // static NAT + a static port forward
  const st = NAT.store();
  NAT.globalCmd(st, "ip nat inside source static 192.168.1.50 203.0.113.50");
  NAT.globalCmd(st, "ip nat inside source static tcp 192.168.1.80 80 203.0.113.2 8080");
  ok(NAT.globalCmd(st, "ip nat inside source static 192.168.1.50 203.0.113.51").err==="% 192.168.1.50 already mapped (192.168.1.50 -> 203.0.113.50)", "the same inside local can't be mapped twice (message names the existing mapping)");
  const sh0 = NAT.show(st);
  ok(/---  203\.0\.113\.50\s+192\.168\.1\.50\s+---\s+---/.test(sh0) && /tcp  203\.0\.113\.2:8080\s+192\.168\.1\.80:80\s+---\s+---/.test(sh0), "static entries are in the table before any traffic", sh0);
  const i = NAT.inbound(st, tcp("198.51.100.7", 40000, "203.0.113.50", 443));
  ok(i && i.pkt.dst==="192.168.1.50", "inbound to a static global reaches the inside host (static works both ways)");
  const f = NAT.inbound(st, tcp("198.51.100.7", 40001, "203.0.113.2", 8080));
  ok(f && f.pkt.dst==="192.168.1.80" && f.pkt.dport===80, "port forward: 203.0.113.2:8080 → 192.168.1.80:80");
  const back = NAT.outbound(st, tcp("192.168.1.80", 80, "198.51.100.7", 40001), {});
  ok(back.pkt.src==="203.0.113.2" && back.pkt.sport===8080, "… and the server's reply leaves as 203.0.113.2:8080");
  NAT.clear(st); ok(/---  203\.0\.113\.50/.test(NAT.show(st)) && /tcp  203\.0\.113\.2:8080\s+192\.168\.1\.80:80\s+---/.test(NAT.show(st)), "clear keeps the static entries", NAT.show(st));
  ok(NAT.running(st).join("\n")==="ip nat inside source static 192.168.1.50 203.0.113.50\nip nat inside source static tcp 192.168.1.80 80 203.0.113.2 8080", "running-config", NAT.running(st).join("\n")); }

{ // dynamic NAT from a pool, then exhaustion
  const acl = ACL.store(); ACL.globalCmd(acl, "access-list 10 permit 10.1.1.0 0.0.0.255");
  const st = NAT.store(); const C = { acl, ACL };
  ok(NAT.globalCmd(st, "ip nat pool PUB 203.0.113.10 203.0.113.20 netmask 255.255.255.240").err, "pool start/end in different subnets is refused");
  ok(!NAT.globalCmd(st, "ip nat pool PUB 203.0.113.10 203.0.113.11 netmask 255.255.255.248").err, "pool of 2 addresses");
  NAT.globalCmd(st, "ip nat inside source list 10 pool PUB");
  const g = ["10.1.1.5","10.1.1.6","10.1.1.7"].map(s=>NAT.outbound(st, icmp(s, "8.8.8.8", 1), C));
  ok(g[0].pkt.src==="203.0.113.10" && g[1].pkt.src==="203.0.113.11" && g[2].drop==="pool-exhausted" && /%NAT-6-ADDR_ALLOC_FAILURE: Address allocation failed; pool 1 may be exhausted \[2\]/.test(g[2].logs.join()), "one public address per inside host; the third host finds the pool empty (logged)", JSON.stringify(g.map(x=>x.pkt ? x.pkt.src : x.drop)));
  const again = NAT.outbound(st, tcp("10.1.1.5", 51000, "8.8.8.8", 53), C);
  ok(again.pkt.src==="203.0.113.10", "the same host keeps its pool address for new flows");
  const s = NAT.stats(st, ["GigabitEthernet0/0"], ["GigabitEthernet0/1"]);
  ok(/Total active translations: 5 \(0 static, 5 dynamic; 3 extended\)/.test(s) && /Outside interfaces:\n  GigabitEthernet0\/1\n/.test(s) && /Hits: 0  Misses: 4/.test(s) && /\[Id: 1\] access-list 10 pool PUB refcount \d+\n pool PUB: id 1, netmask 255\.255\.255\.248/.test(s) && /total addresses 2, allocated 2 \(100%\), misses 1/.test(s) && /In-to-out drops: 0  Out-to-in drops: 0/.test(s), "show ip nat statistics (XE layout; Misses = packets that created an entry; pool misses = failed allocations)", s);
  ok(NAT.running(st).join("\n")==="ip nat pool PUB 203.0.113.10 203.0.113.11 netmask 255.255.255.248\nip nat inside source list 10 pool PUB", "running-config (pool + rule)", NAT.running(st).join("\n"));
  ok(NAT.globalCmd(st, "no ip nat pool PUB").err==="%Pool PUB in use, cannot destroy" && NAT.globalCmd(st, "no ip nat inside source list 10 pool PUB").err==="%Dynamic mapping in use, cannot remove", "pool / rule with active translations can't be removed");
  NAT.clear(st); ok(!NAT.globalCmd(st, "no ip nat inside source list 10 pool PUB").err && !NAT.globalCmd(st, "no ip nat pool PUB").err, "… after clear ip nat translation * they can"); }

{ // PAT from a pool's first address; an ACL that doesn't exist translates nothing
  const acl = ACL.store(); ACL.globalCmd(acl, "access-list 2 permit any");
  const st = NAT.store(); const C = { acl, ACL };
  NAT.globalCmd(st, "ip nat pool ONE 198.51.100.1 198.51.100.1 prefix-length 30"); NAT.globalCmd(st, "ip nat inside source list 2 pool ONE overload");
  ok(NAT.running(st).includes("ip nat pool ONE 198.51.100.1 198.51.100.1 prefix-length 30"), "running-config keeps prefix-length as typed", NAT.running(st).join("\n"));
  ok(NAT.outbound(st, icmp("172.16.0.9", "8.8.8.8", 3), C).pkt.src==="198.51.100.1", "pool overload uses the pool address");
  const st2 = NAT.store(); NAT.globalCmd(st2, "ip nat inside source list 99 interface g0/1 overload");
  ok(NAT.outbound(st2, icmp("172.16.0.9", "8.8.8.8", 3), { acl, ACL, ifAddr: ()=>"1.1.1.1" }).untranslated, "rule pointing at a missing ACL translates nothing (unlike an interface ACL, which permits all)"); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
