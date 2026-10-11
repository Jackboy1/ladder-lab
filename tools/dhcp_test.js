#!/usr/bin/env node
// Ladder Lab — DHCP server helper tests (dhcp.js): pool config, excluded addresses, pool choice (local and relayed),
// allocation order, conflicts, leases and the show / running-config text.
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = { console, Date }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "dhcp.js"), "utf8"), ctx, { filename: "dhcp.js" });
const { DHCP } = ctx; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log(String(extra).split("\n").map(l=>"      "+l).join("\n")); } else console.log("ok  ", msg); };
const NOW = Date.UTC(2026, 9, 11, 9, 30);

{ const st = DHCP.store();
  DHCP.globalCmd(st, "ip dhcp excluded-address 192.168.10.1 192.168.10.10");
  const e = DHCP.globalCmd(st, "ip dhcp pool LAGOS-LAN"); ok(e.mode==="dhcp-config" && e.ctx==="LAGOS-LAN", "ip dhcp pool NAME → (dhcp-config)#");
  DHCP.poolCmd(st, e.ctx, "network 192.168.10.5 255.255.255.0"); ok(/ network 192\.168\.10\.0 255\.255\.255\.0/.test(DHCP.running(st).join("\n")), "a network typed with host bits is stored as the network address (lab choice; real reaction unverified)");
  ok(!DHCP.poolCmd(st, e.ctx, "network 192.168.10.0 /24").err, "network N /len accepted");
  DHCP.poolCmd(st, e.ctx, "default-router 192.168.10.1"); DHCP.poolCmd(st, e.ctx, "dns-server 8.8.8.8 1.1.1.1");
  DHCP.poolCmd(st, e.ctx, "domain-name lagos.example.com"); DHCP.poolCmd(st, e.ctx, "lease 0 8");
  ok(DHCP.running(st).join("\n") === "ip dhcp excluded-address 192.168.10.1 192.168.10.10\n!\nip dhcp pool LAGOS-LAN\n network 192.168.10.0 255.255.255.0\n default-router 192.168.10.1\n dns-server 8.8.8.8 1.1.1.1\n domain-name lagos.example.com\n lease 0 8", "running-config", DHCP.running(st).join("\n"));
  const q = { mac: "0050.7966.6800", via: "192.168.10.1", iface: "GigabitEthernet0/0", now: NOW, own: ip=>ip==="192.168.10.1" };
  const o = DHCP.offer(st, q);
  ok(o.ip==="192.168.10.11" && o.mask==="255.255.255.0" && o.routers[0]==="192.168.10.1" && o.dns.join()==="8.8.8.8,1.1.1.1" && o.leaseMs===8*3600000, "first offer = lowest address after the excluded range, with the pool options", JSON.stringify(o));
  DHCP.bind(st, q, o);
  ok(DHCP.offer(st, q).ip==="192.168.10.11", "the same client asking again keeps its address");
  const q2 = { mac: "0050.7966.6801", via: "192.168.10.1", iface: "GigabitEthernet0/0", now: NOW, inUse: ip=>ip==="192.168.10.12" };
  const o2 = DHCP.offer(st, q2);
  ok(o2.ip==="192.168.10.13" && /192\.168\.10\.12\s+Ping/.test(DHCP.showConflict(st)), "an address already in use (answers the ping check) is skipped and logged as a conflict", DHCP.showConflict(st));
  DHCP.bind(st, q2, o2);
  const b = DHCP.showBinding(st);
  ok(/192\.168\.10\.11\s+0100\.5079\.6668\.00\s+Oct 11 2026 05:30 PM\s+Automatic  Active     GigabitEthernet0\/0/.test(b), "show ip dhcp binding: client-ID 01+MAC, lease expiry 8 h later", b);
  const pl = DHCP.showPool(st, "LAGOS-LAN");
  ok(/Total addresses\s+: 254/.test(pl) && /Leased addresses\s+: 2/.test(pl) && /Excluded addresses\s+: 11/.test(pl) && /192\.168\.10\.14\s+192\.168\.10\.1\s+- 192\.168\.10\.254\s+2\s+\/ 11\s+\/ 254/.test(pl), "show ip dhcp pool: current index = next-allocation pointer (.14); the ping conflict counts as excluded", pl);
  ok(DHCP.offer(st, { mac: "aaaa.bbbb.cccc", via: "10.9.9.1" }).err==="no-pool", "a request from a subnet with no pool gets no offer");
  DHCP.release(st, "0050.7966.6800"); ok(!/192\.168\.10\.11 /.test(DHCP.showBinding(st)), "ipconfig /release removes the binding"); }

{ const st = DHCP.store();
  for (const c of ["ip dhcp excluded-address 10.20.0.1", "ip dhcp pool KANO"]) DHCP.globalCmd(st, c);
  DHCP.poolCmd(st, "KANO", "network 10.20.0.0 255.255.255.248"); DHCP.poolCmd(st, "KANO", "default-router 10.20.0.1");
  DHCP.globalCmd(st, "ip dhcp pool HQ"); DHCP.poolCmd(st, "HQ", "network 10.10.0.0 255.255.255.0");
  const got = []; for (let i = 0; i < 7; i++){ const q = { mac: "0000.0000.000" + i, via: "10.20.0.1" }; const o = DHCP.offer(st, q); got.push(o.ip || o.err); if (o.ip) DHCP.bind(st, q, o); }
  ok(got.join() === "10.20.0.2,10.20.0.3,10.20.0.4,10.20.0.5,10.20.0.6,exhausted,exhausted", "a /29 with the gateway excluded has 5 leases, then the pool is exhausted", got.join());
  { const o = DHCP.offer(st, { mac: "1111.1111.1111", via: "10.10.0.1", inUse: ip=>ip==="10.10.0.1" });
    ok(o.ip==="10.10.0.2" && /%DHCPD-4-PING_CONFLICT: DHCP address conflict:  server pinged 10\.10\.0\.1\./.test(o.logs.join()) && /10\.10\.0\.1\s+Ping/.test(DHCP.showConflict(st)), "relayed request: giaddr 10.10.0.1 picks pool HQ; the relay's own .1 answers the ping check → conflict, offer .2", JSON.stringify(o)); }
  ok(DHCP.running(st).join("\n").includes("ip dhcp excluded-address 10.20.0.1\n!"), "single excluded address");
  DHCP.globalCmd(st, "no ip dhcp pool KANO"); ok(!DHCP.poolFor(st, "10.20.0.1") && !/10\.20\.0\./.test(DHCP.showBinding(st)), "no ip dhcp pool removes the pool and its bindings");
  ok(DHCP.poolCmd(st, "HQ", "lease infinite") && DHCP.running(st).includes(" lease infinite"), "lease infinite");
  ok(DHCP.poolCmd(st, "HQ", "lease 0 0 0").err, "a zero lease is refused"); }

{ const st = DHCP.store(); DHCP.globalCmd(st, "ip dhcp pool T"); DHCP.poolCmd(st, "T", "network 10.0.0.0 255.255.255.252"); DHCP.poolCmd(st, "T", "lease 0 1");
  const q = { mac: "aaaa.0000.0001", via: "10.0.0.1", now: 0 }; const o = DHCP.offer(st, q); DHCP.bind(st, q, o);
  ok(DHCP.offer(st, { mac: "aaaa.0000.0002", via: "10.0.0.1", now: 1000 }).ip==="10.0.0.2", "/30: second client gets .2 (index wraps past nothing)");
  ok(DHCP.offer(st, { mac: "aaaa.0000.0003", via: "10.0.0.1", now: 2*3600000 }).ip==="10.0.0.1", "an expired lease frees its address");
  ok(DHCP.offer(st, { mac: "2222.2222.2222", via: "10.0.0.1", want: "10.0.0.2", now: 3*3600000 }).ip==="10.0.0.2", "a client asking for a free address it had before (option 50) gets it"); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
