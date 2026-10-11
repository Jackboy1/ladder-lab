#!/usr/bin/env node
// Ladder Lab — ACL helper tests (acl.js): parsing, wildcard matching, first-match + implicit deny, named/numbered editing,
// sequence numbers, counters and the show / running-config text.
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "acl.js"), "utf8"), ctx, { filename: "acl.js" });
const { ACL } = ctx; let fails = 0;
const ok = (c, msg, extra) => { if (!c){ fails++; console.log("FAIL:", msg); if (extra!=null) console.log(String(extra).split("\n").map(l=>"      "+l).join("\n")); } else console.log("ok  ", msg); };

{ const st = ACL.store();
  ok(!ACL.globalCmd(st, "access-list 10 permit 192.168.1.5 0.0.0.255").err, "standard numbered entry accepted");
  ACL.globalCmd(st, "access-list 10 deny any");
  ok(/^% Access rule can't be configured at higher sequence num as it is part of the existing rule at sequence num 20$/.test(ACL.globalCmd(st, "access-list 10 permit 10.1.1.1").err), "a host line after 'deny any' could never match — IOS refuses it and names the covering line");
  ok(/sequence num 10$/.test(ACL.globalCmd(st, "access-list 10 deny 192.168.1.44").err), "… same for a host inside an earlier network line");
  const sh = ACL.show(st);
  ok(sh === "Standard IP access list 10\n    10 permit 192.168.1.0, wildcard bits 0.0.0.255\n    20 deny   any", "show access-lists: address normalised by the wildcard, deny padded", sh);
  ok(ACL.check(st, "10", {src:"192.168.1.77"}).permit, "192.168.1.77 matches line 10");
  ok(!ACL.check(st, "10", {src:"10.1.1.1"}).permit, "10.1.1.1 hits 'deny any'");
  ok(/\(1 match\)/.test(ACL.show(st)) && /20 deny   any \(1 match\)/.test(ACL.show(st)), "counters: '(1 match)' singular", ACL.show(st));
  ACL.check(st, "10", {src:"192.168.1.9"});
  ok(/10 permit 192\.168\.1\.0, wildcard bits 0\.0\.0\.255 \(2 matches\)/.test(ACL.show(st)), "counters: '(2 matches)'", ACL.show(st));
  ACL.clear(st); ok(!/match/.test(ACL.show(st)), "clear access-list counters");
  ok(ACL.running(st).join("\n") === "ip access-list standard 10\n 10 permit 192.168.1.0 0.0.0.255\n 20 deny   any", "running-config (IOS XE 16.12+ form)", ACL.running(st).join("\n"));
  { const s3 = ACL.store(); ACL.globalCmd(s3, "access-list 3 permit 10.1.1.1"); ACL.globalCmd(s3, "access-list 3 permit 10.1.1.0 0.0.0.255");
    ok(/10 permit 10\.1\.1\.1\n    20 permit 10\.1\.1\.0, wildcard bits 0\.0\.0\.255/.test(ACL.show(s3)), "a host line BEFORE a wider line is fine", ACL.show(s3)); }
  ACL.globalCmd(st, "no access-list 10 deny any");
  ok(!st.lists["10"], "'no access-list 10 <anything>' deletes the whole list (the classic gotcha)"); }

{ const st = ACL.store();
  ok(ACL.check(st, "NOPE", {src:"1.2.3.4"}).permit && ACL.check(st, "NOPE", {src:"1.2.3.4"}).missing, "an ACL that doesn't exist permits everything");
  ACL.globalCmd(st, "access-list 5 permit 172.16.0.0 0.0.255.255");
  ok(!ACL.check(st, "5", {src:"10.0.0.1"}).permit && ACL.check(st, "5", {src:"10.0.0.1"}).implicit, "no match → implicit deny");
  ok(ACL.globalCmd(st, "access-list 5 permit tcp any any").err, "extended syntax in a standard-numbered list is refused");
  ok(ACL.globalCmd(st, "access-list 100 permit 10.0.0.0 0.0.0.255").err, "standard syntax in an extended list is refused");
  ok(ACL.globalCmd(st, "access-list 200 permit any").err, "200 is not an IP ACL number");
  ok(!ACL.globalCmd(st, "access-list 1300 permit any").err && st.lists["1300"].kind==="standard", "1300-1999 = expanded standard range");
  ok(!ACL.globalCmd(st, "access-list 2000 permit ip any any").err && st.lists["2000"].kind==="extended", "2000-2699 = expanded extended range"); }

{ const st = ACL.store();
  ACL.globalCmd(st, "access-list 101 permit tcp 192.168.10.0 0.0.0.255 host 10.1.1.10 eq 80");
  ACL.globalCmd(st, "access-list 101 deny tcp any host 10.1.1.10 eq telnet");
  ACL.globalCmd(st, "access-list 101 permit udp any any eq 53");
  ACL.globalCmd(st, "access-list 101 permit icmp any any echo-reply");
  ACL.globalCmd(st, "access-list 101 permit tcp any any range 20 21");
  ACL.globalCmd(st, "access-list 101 permit tcp any host 10.1.1.10 eq 443 log");
  ACL.globalCmd(st, "access-list 101 permit tcp any 10.0.0.0 0.255.255.255 established");
  const sh = ACL.show(st);
  ok(/10 permit tcp 192\.168\.10\.0 0\.0\.0\.255 host 10\.1\.1\.10 eq www\n/.test(sh), "port 80 shown as 'www'", sh);
  ok(/20 deny tcp any host 10\.1\.1\.10 eq telnet\n/.test(sh) && /30 permit udp any any eq domain\n/.test(sh) && /40 permit icmp any any echo-reply\n/.test(sh) && /50 permit tcp any any range ftp-data ftp\n/.test(sh) && /60 permit tcp any host 10\.1\.1\.10 eq 443 log\n/.test(sh) && /70 permit tcp any 10\.0\.0\.0 0\.255\.255\.255 established$/.test(sh), "extended show lines", sh);
  ok(ACL.check(st, "101", {src:"192.168.10.4", dst:"10.1.1.10", proto:"tcp", sport:51000, dport:80}).entry.seq===10, "web from the LAN matches 10");
  ok(!ACL.check(st, "101", {src:"192.168.10.4", dst:"10.1.1.10", proto:"tcp", sport:51000, dport:23}).permit, "telnet denied by 20");
  ok(!ACL.check(st, "101", {src:"192.168.10.4", dst:"10.1.1.10", proto:"icmp", icmp:8}).permit, "an echo request is not an echo-reply → implicit deny");
  ok(ACL.check(st, "101", {src:"8.8.8.8", dst:"10.1.1.9", proto:"icmp", icmp:0}).permit, "echo-reply permitted");
  ok(ACL.check(st, "101", {src:"1.1.1.1", dst:"10.1.1.9", proto:"udp", sport:53, dport:53}).permit, "udp 53 permitted (protocol checked)");
  ok(!ACL.check(st, "101", {src:"1.1.1.1", dst:"10.1.1.9", proto:"tcp", sport:4000, dport:53}).permit, "tcp 53 is not udp 53");
  ok(ACL.check(st, "101", {src:"1.1.1.1", dst:"10.9.9.9", proto:"tcp", sport:80, dport:50000, ack:true}).entry.seq===70, "established matches a reply segment (ACK set)");
  ok(!ACL.check(st, "101", {src:"1.1.1.1", dst:"10.9.9.9", proto:"tcp", sport:80, dport:50000, ack:false}).permit, "… but not a new connection (no ACK)");
  ok(ACL.globalCmd(st, "access-list 101 permit tcp 10.0.0.0 any").err, "extended needs a wildcard after an address");
  ok(ACL.globalCmd(st, "access-list 101 permit tcp any any eq").err==="% Incomplete command.", "missing port → Incomplete command");
  ok(ACL.globalCmd(st, "access-list 101 permit tcp any any eq notaport").err, "unknown port name refused");
  ok(ACL.globalCmd(st, "access-list 101 permit icmp any any echo-reply") && st.lists["101"].entries.length===7, "an identical line is not added twice"); }

{ const st = ACL.store();
  const n = ACL.enterNamed(st, "extended", "WEB-ONLY"); ok(n.mode==="config-ext-nacl", "ip access-list extended NAME → config-ext-nacl");
  ACL.namedCmd(st, n.ctx, "remark only the portal from the branch");
  ACL.namedCmd(st, n.ctx, "permit tcp 10.20.0.0 0.0.255.255 host 10.1.1.10 eq www");
  ACL.namedCmd(st, n.ctx, "deny ip any any log");
  ACL.namedCmd(st, n.ctx, "15 permit icmp any any echo");
  const sh = ACL.show(st);
  ok(/^Extended IP access list WEB-ONLY\n    10 permit tcp 10\.20\.0\.0 0\.0\.255\.255 host 10\.1\.1\.10 eq www\n    15 permit icmp any any echo\n    20 deny ip any any log$/.test(sh), "a remark takes no number: lines are 10, 20; line 15 is inserted between them", sh);
  ok(ACL.namedCmd(st, n.ctx, "20 permit ip any any").err==="% Duplicate sequence number\n%Failed to add ace to access-list", "a used sequence number is refused (two-line message)");
  ACL.namedCmd(st, n.ctx, "no 15"); ok(!/ 15 /.test(ACL.show(st)), "no 15 removes one line (named lists can be edited line by line)");
  ok(ACL.running(st).join("\n") === "ip access-list extended WEB-ONLY\n 10 remark only the portal from the branch\n 10 permit tcp 10.20.0.0 0.0.255.255 host 10.1.1.10 eq www\n 20 deny ip any any log", "running-config: the remark shows the number of the line after it", ACL.running(st).join("\n"));
  ACL.resequence(st, "WEB-ONLY", 100, 5); ok(ACL.running(st).join("\n") === "ip access-list extended WEB-ONLY\n 100 remark only the portal from the branch\n 100 permit tcp 10.20.0.0 0.0.255.255 host 10.1.1.10 eq www\n 105 deny ip any any log", "ip access-list resequence (the remark moves with its line)", ACL.running(st).join("\n"));
  ACL.namedCmd(st, n.ctx, "remark trailing note"); ok(/ 115 remark trailing note$/.test(ACL.running(st).join("\n")), "a trailing remark shows the next free number", ACL.running(st).join("\n"));
  ACL.namedCmd(st, n.ctx, "permit udp any any eq tftp"); ok(/ 115 remark trailing note\n 115 permit udp any any eq tftp$/.test(ACL.running(st).join("\n")), "… and attaches to the next line added", ACL.running(st).join("\n"));
  ok(ACL.enterNamed(st, "standard", "WEB-ONLY").err, "same name as a different kind is refused");
  ok(ACL.enterNamed(st, "standard", "150").err, "standard with an extended number is refused");
  const s2 = ACL.enterNamed(st, "standard", "7"); ACL.namedCmd(st, s2.ctx, "permit host 192.168.1.1");
  ok(/Standard IP access list 7\n    10 permit 192\.168\.1\.1/.test(ACL.show(st, "7")), "numbered list edited in named mode; show for one list", ACL.show(st, "7")); }

{ const st = ACL.store();
  ACL.globalCmd(st, "access-list 120 deny icmp any any port-unreachable"); ACL.globalCmd(st, "access-list 120 permit icmp any any 3 1"); ACL.globalCmd(st, "access-list 120 permit icmp any any ttl-exceeded");
  const sh = ACL.show(st);
  ok(/10 deny icmp any any port-unreachable\n    20 permit icmp any any host-unreachable\n    30 permit icmp any any ttl-exceeded/.test(sh), "type+code keywords (3 1 shown as host-unreachable)", sh);
  ok(!ACL.check(st, "120", {src:"1.1.1.1", dst:"2.2.2.2", proto:"icmp", icmp:3, icode:3}).permit && ACL.check(st, "120", {src:"1.1.1.1", dst:"2.2.2.2", proto:"icmp", icmp:3, icode:1}).permit, "ICMP code is matched");
  ok(!ACL.check(st, "120", {src:"1.1.1.1", dst:"2.2.2.2", proto:"icmp", icmp:11, icode:1}).permit, "ttl-exceeded = type 11 code 0 only");
  ok(!ACL.globalCmd(st, "access-list 120 permit tcp any any eq drip").err, "drip port name"); }

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
