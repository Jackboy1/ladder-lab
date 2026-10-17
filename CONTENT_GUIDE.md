# Ladder Lab — content standard

The bar: someone with **zero experience** can start at lesson 1 and keep going, and someone
experienced still learns from it. Depth of a top paid course, explained more patiently, with
hands-on practice inside the lesson and the "what this looks like at work" layer most courses skip.

**Every lesson, every module, no exceptions** (the owner approved the CCNA Module 1 format and checks for it):
depth with patient step-by-step explanation · diagrams and visual representations · worked examples ·
"Try it yourself" terminals and hands-on benches · on-the-job scenarios and case studies · interview corner ·
hints, did-you-know, myth vs fact, do/don't, when-to-use-what, exam tips, memory aids · mixed-type quizzes at
Core / Exam / Stretch difficulty · flashcards. If a lesson is missing any of these, it isn't finished.

## Where content lives

- `kit.js` — the building blocks (`K.*`) used inside lesson HTML.
- `data_<track>_m<N>.js` — one file per rebuilt module. Load it in `index.html` **after
  `data_visuals.js`** (that file injects diagrams into the classic lessons by index).
- A module file builds its lessons and registers them:

```js
(function(){
const L = [];
L.push({ id:"net-what", t:"Lesson title", mins:45, level:"Beginner", html:`...`, quiz:[...], cards:[...] });
// ...more lessons
K.module("ccna", { id:"ccna-m1", t:"How networks work", blurb:"One sentence." }, L,
         { at:0, modAt:0, replace:["Title of the classic lesson this module replaces"] });
})();
```

`id` is permanent: progress is saved under it, so never rename an id after it ships.

## Lesson anatomy (in this order)

1. `K.goals([...])` — 3–5 concrete things the learner can *do* afterwards ("calculate…", "configure…", "explain to a user…").
2. `K.pre([...])` — what they need first (name earlier lessons). First lesson: "Nothing — start here."
3. **Why this matters at work** — a short, real-feeling opening scenario (2 short paragraphs).
4. **3–7 `<h2>` sections.** Each section:
   - plain-language explanation from zero, then the precise technical version;
   - `K.analogy(...)` when an idea is abstract;
   - a diagram (`K.svg`) whenever something connects, moves, or is layered;
   - a worked example with `K.steps([...])` when there is a procedure or a calculation;
   - real command output with `K.out(text, caption)` and what each part means;
   - a `K.check({...})` at the end of the section.
5. **Hands-on** — the learner must *do* something in every lesson, not only read:
   - `K.bench({...})` when there is anything physical or end-to-end (cabling, optics, console access, addressing
     hosts, proving connectivity with ping) — see "Hands-on benches" below;
   - `K.term({...})` for command-line practice on one device (IOS, Linux, Git, K8s);
   - otherwise a pen-and-paper exercise with `K.hint` then answers in `K.reveal(...)`.
6. `K.mistake(...)` (at least two per lesson) and `K.tip(...)` where they help.
7. `K.job(title, html)` — an in-job scenario walked through: the ticket/call/alert as it arrives,
   what you check and in what order, what you say to the user/manager, the fix, what you write in the ticket.
8. `K.case(title, html)` — a longer real-world case (a company, a design decision, an outage) where it fits.
9. **Learning aids, spread through the lesson** (not bunched at the end):
   - `K.dyk(...)` "Did you know?" — 1–2 per lesson: a surprising, true fact that makes the idea stick.
   - `K.myth([[false belief, truth], ...])` — what is NOT true: the misconceptions beginners (and some
     "experienced" people) hold, each corrected.
   - `K.dodont([...dos], [...donts])` — practical rules for doing this at work.
   - `K.when([[option, use when, why, avoid when], ...])` — whenever there is a choice (TCP vs UDP,
     single-mode vs multimode, 2-tier vs 3-tier): when and why to use each.
   - `K.exam(...)` — how the certification exam tests this, and the trick wording to watch for.
   - `K.remember(...)` — a mnemonic or memory hook when there is a list or an order to remember.
   - `K.hint(...)` — inside every exercise, a nudge before the full answer in `K.reveal`.
   - `K.video({...})` — optional; only verified links or a YouTube *search* URL
     (`https://www.youtube.com/results?search_query=...`). Never invent video IDs.
   - `K.img({...})` — optional; local files under `assets/` or verified, properly licensed URLs with credit.
10. `<h2>Interview corner</h2>` — 2–3 real interview questions, model answers inside `K.reveal`.
11. `K.recap([...])` — 5–8 bullets the learner should be able to say out loud.
12. `K.next(...)` — one or two sentences linking to the next lesson.

Plus on the lesson object: `quiz` (12–15 questions) and `cards` (8–12 flashcards). The quiz must mix types like the
real exam (see `qtypes.js`): mostly `mcq`, plus at least one each of `multi` (choose two/three), `order`, `match`,
`fill`, and one scenario question with an `ex` exhibit (real CLI/command output to read). Add 2 inline
`K.q({...})` practice questions of the non-MCQ types in the lesson body. Quiz and card text is plain text (no HTML).
They merge into the course quiz, exam pool and flashcard deck.

### Difficulty — every question carries a level
`lvl:1` **Core** (understand it) · `lvl:2` **Exam** (CCNA/AWS exam standard: scenario, two-step reasoning,
trap options, exhibits) · `lvl:3` **Stretch** (on-the-job: diagnose from symptoms and output, choose between
designs, explain trade-offs). Untagged = Core. Each lesson quiz: at least **40% Exam or Stretch, and 2+ Stretch**.
Hard-mode exams draw only Exam/Stretch questions. Don't make questions hard with trick wording — make them hard
the way the job is hard: more realistic detail, plausible wrong answers, one more step of reasoning.

### Module challenge
The last lesson of every module ends with a **challenge bench** (`challenge:true`): a pre-broken network with
several faults, tasks written as user complaints/outcomes ("Finance can't reach the file server"), each with an
optional `hint`. No step-by-step instructions — the learner diagnoses with real commands.

## Writing rules

- **Length:** 3,000–6,000 words of lesson prose (validator count). Space it out: short paragraphs, one idea each.
  Never cut good material (scenarios, worked examples, case studies) to hit a number; trim only repetition.
- **Never assume.** First use of any jargon → `K.g("term", "plain definition")`. Never write "simply",
  "obviously", "just", "as you know".
- **Explain the why**, not only the what: why the design exists, what breaks without it.
- **Concrete numbers and real outputs** (real IOS/Linux output formats, real port numbers, real MAC formats).
- **Accurate and current**: CCNA = 200-301 v1.1; AWS = current exam guides. If unsure of a detail, leave it out.
- **Context:** mostly global, with occasional Nigerian/African workplace colour (a Lagos office,
  an ISP like MTN/Airtel/MainOne, power cuts and UPSs, a bank branch in Abuja) — it should feel like real jobs.
- **Original writing only.** Course outlines (Udemy etc.) are a benchmark for *coverage*, never a source to copy.
- HTML only: `<p> <h2> <h3> <ul> <ol> <li> <b> <i> <code> <pre> <table>` (wrap tables in
  `<div class="tablewrap">`), `<div class="callout">`. No inline styles except inside SVG.
- Lesson HTML is a JS template literal: no stray backticks, and `${...}` only for `K.*` calls.
  Escape backslashes in CLI output (`\\`).

## Kit reference

| Call | Renders |
|---|---|
| `K.goals(arr)` / `K.pre(arr)` / `K.recap(arr)` | labelled boxes with bullet lists |
| `K.steps([[title, html], ...])` | numbered step-by-step timeline |
| `K.analogy(html)` / `K.tip(html)` / `K.mistake(html)` | callouts |
| `K.job(title, html)` / `K.case(title, html)` | on-the-job scenario / case study boxes |
| `K.reveal(summary, html)` | click-to-open (answers, deep dives) |
| `K.next(html)` | "next up" box |
| `K.hint(html, label?)` | collapsible hint |
| `K.dyk(html)` | "Did you know?" box |
| `K.myth([[myth, fact], ...])` | myth vs fact — what is NOT true |
| `K.dodont(dos, donts)` | two-column do / don't |
| `K.when([[option, when, why, avoid], ...], title?)` | when-to-use-what table |
| `K.exam(html)` | exam tip callout |
| `K.remember(html)` | memory aid box |
| `K.video({t, u, by, mins, why})` | video pick card (opens new tab) |
| `K.img({src, alt, caption, credit})` | image with caption and credit |
| `K.g(term, def)` | glossary term with tap/hover definition |
| `K.kbd("Ctrl")` | keyboard key |
| `K.out(text, caption)` | CLI output block (text is escaped for you) |
| `K.check({q, o:[...], a, why})` | inline quick-check question, `a` = index of the right option |
| `K.q({...})` | inline practice question of any type in `qtypes.js` |
| `K.drill({title, types:[...], count})` | endless generated practice with worked explanations (`drills.js`): `dec2bin bin2dec dec2hex hex2dec bin2hex prefix2mask mask2prefix wildcard subnet hosts2prefix subnets2prefix samesub nth` |
| `K.bench({...})` | hands-on bench: cable devices, fit optics, console in, address PCs, ping (see above) |
| `K.term({env, title, intro, opts, setup(env), tasks:[{text, done(env)}], win, solve:[cmds]})` | live terminal inside the lesson with ticking tasks. `solve` = the commands that complete every task; the validator replays them to prove the tasks are achievable |
| `K.svg(viewBox, inner, caption)` | diagram frame (theme-aware) |
| `K.dev(kind, cx, cy, label, sub)` | device icon: `pc laptop phone server switch router firewall ap cloud printer` |
| `K.box(x,y,w,h,label,sub,accent)` / `K.band(x,y,w,h,label,color)` | labelled box / header band |
| `K.link(x1,y1,x2,y2,label,dashed)` / `K.arrow(x1,y1,x2,y2,label,accent)` | cable / arrow |
| `K.txt(x,y,text,{c,s,mid,end,f,b})` | text (c = colour var name, s = size, f = font var) |

Diagram colours come from CSS variables only (`var(--accent)`, `var(--fg)`, `var(--muted)`, `var(--line)`,
`var(--panel2)`, `var(--chip)`, `var(--ok)`, `var(--warn)`, `var(--bad)`, `var(--link)`), so they work in light and dark.
Typical viewBox width 640–760.

## Question types (`qtypes.js`)

```js
{q, o:[...], a:1, why}                                   // mcq (default)
{type:"multi", q, o:[...], a:[0,3], why}                 // choose two/three — all and only these
{type:"order", q, items:["first","second","third"], why} // shown shuffled; learner reorders
{type:"match", q, pairs:[["22","SSH"],["53","DNS"],["443","HTTPS"]], why}
{type:"fill",  q, fields:[{label:"Mask", a:["255.255.255.0"]}], why}   // or a:[...] for one blank
// any type may add  ex:"show ip interface brief output…"  — an exhibit shown above the question
```

## Hands-on benches (`bench.js`)

```js
K.bench({ id:"m1-office-lan", points:60, from:"CCNA M1 · lesson 1",   // id ⇒ also listed in the Labs tab
  title, intro, viewBox:"0 0 760 360",
  devices:[ {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200", x, y, sfp:{g9:"sfp-sx"}},
            {id:"r1",  kind:"router", label:"R1", x, y},                 // router ports start shut, like real IOS
            {id:"pc1", kind:"pc", label:"PC1", x, y, ip, mask, gw},      // kinds: pc laptop server switch router
            {id:"lap", kind:"laptop", label:"LAPTOP", x, y} ],          // laptops have a USB port for the console cable
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"smf", a:"sw1:g10", b:"core:g10", swapped:true} ],  // pre-cabled
  tray:["cat6","xover","console","mmf","smf","sfp-sx","sfp-lx"],
  tasks:[ {text, done:B=>Bench.upAt(B,"pc1:eth")} ],
  win:"what they just achieved",
  solve:[ ["plug","cat6","pc1:eth","sw1:g1"], ["insert","sw1:g9","sfp-sx"], ["flip","sw1:g10"],
          ["ip","pc1","10.0.0.5","255.255.255.0","10.0.0.1"], ["pc","pc1","ping 10.0.0.1"],
          ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}], ["term","enable"] ] })
```
Ports: switch `g1`–`g8` (RJ45, IOS `GigabitEthernet0/1`–`0/8`), `g9`–`g10` (SFP), `con`; router `g0`, `g1`, `con`;
hub `p1`–`p4`; hosts `eth` (+ `usb` on laptops). Device kinds: `pc laptop server printer switch router hub`.
MAC override `mac:` — a host takes a full MAC (`"0050.56a1.0001"`); a **switch or router takes a 9-character prefix** (`"0050.56a1"`) and the
engine appends one `.000N` per port (and the SVIs/base MAC from it) — a full MAC on a switch or router gives broken addresses.

**Proxy ARP is modelled and ON by default on router interfaces (like real IOS).** A router answers ARP for an address it
can route out of a different interface, and an IOS switch with no `ip default-gateway` ARPs for every destination — so
a proxy-ARP router can hide a missing gateway or a too-wide mask. When a lesson's point is that such a fault breaks
things, configure the router with `no ip proxy-arp` (and say so on the build sheet). `Bench.proxied(B)` tells you it happened.

**What the bench simulates (v2):** every NIC and interface has a MAC address; switches learn source MACs per port and
VLAN, flood broadcasts/unknown unicasts and forward known unicasts; hubs repeat everything out every port; hosts,
routers and switch SVIs ARP for the next hop and keep ARP caches; routers route between connected subnets and static
routes; frames are animated on the cables (amber = broadcast, teal = unicast) and explained step by step in a
"What just happened on the wire" log. Links follow real rules: fibre needs matching optics, fibre type and Tx/Rx
polarity; interfaces must be `no shutdown`; consoles need 9600 8N1 with no flow control; fixed speed/duplex on one
end and auto on the other gives a **duplex mismatch** (link up, CRC/runts on the full side, late collisions on the half side);
different fixed speeds keep the link down.

**Layer 2 (Module 4+):** frames carry real 802.1Q tags on trunks (shown as a number on the moving dot); ports default
to `switchport mode dynamic auto` and DTP negotiates trunks (auto+auto = access; trunk/desirable + auto = trunk;
`nonegotiate` silences DTP; routers never speak DTP, so a switch port to a router-on-a-stick must be `switchport mode trunk`);
native VLAN (untagged) and `switchport trunk allowed vlan` are enforced, mismatches are logged by CDP; voice VLAN tags voice
frames on an access port. Router subinterfaces (`interface g0/0.10`, `encapsulation dot1Q 10 [native]`) and Layer 3
switches (`ip routing`, SVIs, `no switchport` routed ports) route between VLANs. **Spanning Tree (PVST+/Rapid PVST+,
per VLAN)** elects the root (priority + VLAN sys-id-ext, then MAC), computes costs (1G=4, 100M=19, 10G=2, 2×1G bundle=3),
picks root/designated/alternate ports and really blocks; `no spanning-tree vlan N` with a loop gives a **broadcast storm**
(frames circle, MAC flapping in `show logging`, nothing works). PortFast (`spanning-tree portfast` / `portfast edge` works only while the port is an access port — on a trunk IOS adds "will only have effect
when the interface is in a non-trunking mode"; `spanning-tree portfast edge trunk` or the older `spanning-tree portfast trunk` makes a
trunk port an edge port too, e.g. a trunk to a server or hypervisor — running-config saves both trunk forms as `spanning-tree portfast edge trunk`, as IOS 15.2(4)E / IOS XE 3.8.0E and later do; `show spanning-tree` `P2p Edge`; plain `spanning-tree portfast` stays as typed in the lab — those newer releases save it as `spanning-tree portfast edge`, say so where a lesson shows the config), BPDU guard (err-disables the port; recover with
`shutdown` / `no shutdown` after removing the cause), root guard (root-inconsistent). **EtherChannel** bundles with
LACP (active/passive), PAgP (desirable/auto) or `on`; incompatible modes or mismatched member settings don't bundle
(stand-alone or suspended), and STP treats a bundle as one port (Po). Port LEDs behave like a Catalyst: off = no link,
green = forwarding, amber = STP blocking or err-disabled. Helpers: `Bench.trunking(B,sw,port)`, `Bench.stpRoot(B,vlan)`,
`Bench.stpRole(B,sw,port,vlan)` ("Root FWD", "Desg FWD", "Altn BLK", "Root BKN"), `Bench.stp(B,sw,vlan)`,
`Bench.bundled(B,sw,group)`, `Bench.errdis(B,sw,port)`, `Bench.stormed(B)`, `Bench.logged(B,sw,/regex/)`.
IOS show commands: `show interfaces trunk`, `show interfaces <if> switchport`, `show spanning-tree [vlan N|summary]`,
`show etherchannel summary`, `show vtp status`, `show logging`. Cisco 9000 default STP mode here is rapid-pvst (say so;
older 2960s default to pvst). (Root guard shows as `Desg BKN*` / `*ROOT_Inc`, a native-VLAN mismatch as `BKN*` / `*PVID_Inc`.)

**Layer 3 (Module 5+):** every router (and `ip routing` switch) keeps one RIB: connected (AD 0), local /32s, static (AD 1,
or the distance you give — floating statics), OSPF (110). Per prefix the lowest AD wins; forwarding is **longest match**.
Statics: `ip route NET MASK <next-hop>`, `<exit-if>`, `<exit-if> <next-hop>`, plus `[distance]`; a next-hop static is
installed only if the next hop resolves (recursively) and an exit-interface static only if the interface is up.
`show ip route [connected|static|ospf|<ip>]` prints the full IOS code legend, classful headings ("is subnetted" rows
drop the length, "variably subnetted" rows keep it), `[AD/metric]`, ECMP paths on continuation lines.
**OSPF (single process):** `router ospf N`, `network A W area X` (most specific match wins) or `ip ospf N area X`,
`router-id` (needs `clear ip ospf process` once a RID is in use — IOS prints the message), `passive-interface [default]`,
`default-information originate [always]`, `auto-cost reference-bandwidth`, interface `ip ospf cost|priority|hello-interval|
dead-interval|network point-to-point`, `bandwidth`. Neighbours form over the real Layer 2 path (switches, VLANs, trunks
all matter) only when area, subnet/mask, hello/dead and unique RIDs match — area mismatch and duplicate RID are logged
(`%OSPF-4-ERRRCV`, `%OSPF-4-DUP_RTRID_NBR`); adjacency changes log `%OSPF-5-ADJCHG`. DR/BDR on broadcast segments:
priority then RID, **non-preemptive** (a sitting DR keeps the job until `clear ip ospf process`/reload); DROTHER pairs
stay `2WAY/DROTHER`; priority 0 never DR; point-to-point = `FULL/  -`. Cost = ref-bw (100 Mb/s) ÷ bandwidth, min 1.
SPF per area with ECMP; loopbacks advertised as /32; ABRs give `O IA`; `default-information originate` gives `O*E2
0.0.0.0/0 [110/1]`. Shows: `show ip ospf neighbor`, `show ip ospf interface [brief|<if>]`, `show ip protocols`,
`show ip ospf`, `show ip ospf database`. **HSRP:** `standby G ip VIP`, `standby G priority P`, `standby G preempt`,
`standby version 2`; Active = highest priority then IP (preempt needed to take over), hosts ARP the virtual MAC
(`0000.0c07.acXX` v1), failover logs `%HSRP-5-STATECHANGE` (when an active router dies, the HSRP takeover is logged before the
OSPF neighbour-down — hold 10 s < dead 40 s), `show standby [brief]` (brief uses short names like IOS: `Vl10`, `Gi0/1.10`; SVIs are `Vl10` in every short-name output — `show ip ospf interface brief`, `show vrf`, `show ip vrf interfaces`, `show ipv6 neighbors`, the HSRP default group name `hsrp-Vl10-10`). **Traceroute:** IOS `traceroute`
and Windows `tracert` list each router by the interface the probe arrived on (`!N` / "Destination net unreachable"
where routing stops). Helpers: `Bench.ospfNbr(B,r,rid[,state])`, `Bench.ospfNbrCount(B,r)`, `Bench.ospfDr(B,r,ios)`,
`Bench.route(B,r,"10.1.0.0/24"[,code])` → {code, ad, metric, via}, `Bench.routeVia(B,r,dstIp)`, `Bench.traced(B,from,ip)`,
`Bench.hsrpState(B,r,ios,grp)`. No route = ICMP host unreachable ("Destination host unreachable" from the router, IOS `U.U.U`, traceroute `!H`); **Windows ping wording**: `Reply from <the PC's own IP>: Destination host unreachable.` only when the PC's own ARP for the target (same subnet) or its gateway fails; `Reply from <router>: Destination host unreachable.` when a router has no route; when ARP worked (or was cached) and the echo is simply lost further on (a dead link behind the switch, a missing return route, a host that went away) it is `Request timed out.` (Lost = 4) — the lab's ARP caches never age (real Windows re-ARPs after ~30 s and then switches to "Destination host unreachable"), but a host's cache is emptied when its cable is unplugged (Windows flushes it on a link loss) and any device's when it is powered off, so a PC moved to a wrong-VLAN port gets the unreachable form;`passive-interface` (and the other interface arguments) accept the type and number with a space (`passive-interface vlan 10`, `gi 0/1`) like IOS; `show ip route …` (all forms, `vrf` too) also works in user EXEC (`>`); a routing loop ends in TTL expired in transit (`&&&&&`, alternating traceroute hops); traceroute hops with no return route print `* * *`; `ping|traceroute <ip> source <if|ip>`; `show ip route <ip>` says Subnet/Network not in table. Routers have three ports by default (G0/0–G0/2). Tests: `node tools/routing_test.js`.

**IPv6 (Module 6+):** `ipv6.js` does the address maths (RFC 5952 text, EUI-64, solicited-node, types). Routers: `ipv6 unicast-routing`, interface `ipv6 address X/len`, `… eui-64`, `… link-local`, `… anycast`, `ipv6 address autoconfig`, `ipv6 enable`; `ipv6 route PREFIX/len <next-hop|exit-if [link-local-nh]> [AD]` (a link-local next hop needs the exit interface — IOS says so; a recursive next hop is NOT resolved through ::/0 unless `ipv6 route static resolve default`); shows `show ipv6 interface [brief|<if>]`, `show ipv6 route [static|connected|local|<address>|<prefix/len>]` (C/L/LC/S, FF00::/8 via Null0, via lines next hop first: `via FE80::2, GigabitEthernet0/1`), `show ipv6 neighbors`; `ping`/`traceroute` take IPv6 addresses (a link-local ping asks for the output interface; `ping <v6> source <if|addr>` is an extended ping that sets the source; no route = `% No valid route for destination`). Traceroute (IOS and Windows) needs a return path from every hop, as in IPv4; ICMPv6 no-route shows `!N` on IOS. Hosts default to SLAAC ("Obtain an IPv6 address automatically"): a router with `ipv6 unicast-routing` sends RAs on every IPv6-enabled interface (even link-local only); the host always takes the router link-local as gateway, but builds a global address (prefix + EUI-64; real Windows uses a random interface ID — say so) only from a /64 prefix — so a LAN with only `ipv6 enable` or a /120 gives "gateway, no address" and a global ping fails with General failure; choosing automatic shows the RS/RA in the frame log; static IPv6 via the IPv6 settings dialog (bench action `["ip6", pc, "static", addr, len, gw]` or `"auto"`; or `ip6:{auto:false, addr, len, gw}` on a device). Neighbor Discovery (NS to the solicited-node group, NA back) replaces ARP and shows in the frame log. Windows: ipconfig shows IPv6 Address, Link-local IPv6 Address (%4) and IPv6 gateway; IPv6 ping replies show no TTL (link-local targets show the %zone; `ping -6`/`-4` and `tracert -6`/`-4` work); no route = "Destination net unreachable" (ICMPv6 code 0), ND failure = "Destination host unreachable". The IPv6 settings button appears when IPv6 is in play (or `ipv6:true` on the bench). Tests: `node tools/ipv6_test.js`.

**IP services (Module 7+):** helpers `acl.js`, `dhcp.js`, `nat.js` (unit tests `tools/acl_test.js`, `dhcp_test.js`, `nat_test.js`; full-engine tests `tools/services_test.js` — every behaviour below has a working example there). **DHCP**: IOS `ip dhcp excluded-address`, `ip dhcp pool` → (dhcp-config)# `network`/`default-router`/`dns-server`/`domain-name`/`lease`, `no service dhcp`, interface `ip helper-address`, `show ip dhcp binding|pool|conflict`, `clear ip dhcp binding|conflict *`; the router never offers its own address and pings before offering (a used address → `show ip dhcp conflict` + %DHCPD-4-PING_CONFLICT); pool chosen by the receiving interface or the relay giaddr. PCs: `dhcp:true` on a device or the IP-settings radio "Obtain an IP address automatically" (bench action `["dhcp", pc]`; static = `["ip", pc, ip, mask, gw, dns]`); Discover/Offer/Request/Ack (and the relay hop) show in the frame log; no server → APIPA 169.254.x.x; Windows `ipconfig /all` (lease times, DHCP Server, DNS Servers), `/release`, `/renew` (a renewal with a lease is a unicast Request + Ack). A DHCP PC retries by itself whenever the network changes. Router as client: `ip address dhcp` (Method DHCP, `S* 0.0.0.0/0 [254/0]`, %DHCP-6-ADDRESS_ASSIGN, `show dhcp lease`). **NAT/PAT**: `ip nat inside|outside`, `ip nat pool`, `ip nat inside source static [tcp|udp …]|list N pool P [overload]|list N interface IF overload`, a standard ACL (`access-list N permit …`, named lists too) as the match list, `show ip nat translations [verbose]|statistics`, `show ip aliases`, `clear ip nat translation *`, port forwards incl. `static tcp L P interface IF P`; inside→outside is translated after routing, outside→inside before; the frame log shows each rewrite; IOS answers ARP for static/pool globals on the outside subnet; traceroute works through PAT; an ISP router with no route to private space makes un-NATed pings time out. ACLs exist as definitions (show access-lists, named/numbered, sequence numbers, remarks — IOS XE 16.12+ running-config form) but **do not filter traffic until Module 8**. **DNS**: server devices with `services:{dns:{name, records:{fqdn:ip}, authoritative}}`; IOS `ip host`, `ip name-server`, `ip domain name`, `ip dns server` (answers from its host table, forwards to its name servers = non-authoritative), `show hosts`, `ping`/`traceroute NAME` ("Translating …[OK]"); an IOS DNS server answers non-authoritatively and forwards only with `ip domain lookup`; Windows `nslookup name [server]` ("No response from server" when the address runs no DNS), `ping`/`tracert NAME` (connection suffix appended), `ipconfig /displaydns` and `/flushdns` (a resolver cache). **NTP/clock**: `ntp master [n]`, `ntp server` (a server device can be a time source: `services:{ntp:{stratum, ref}}`), `clock timezone`, `show clock` (`*` = not synchronised), `show ntp status|associations` — sync is instant in the lab (real: minutes; say so). **Syslog**: every console `%FAC-SEV-MNEMONIC` line is logged (timestamped like the buffer), and link up/down is logged on both ends of a link when a cable or the far port changes; `logging host`, `logging trap <level>`, `show logging`; a server with `services:{syslog:true}` receives messages at or below the trap level from routers that can reach it (Server services panel; helper `Bench.syslogGot`). **SNMP**: `snmp-server community X RO|RW [acl]`, `location`, `contact`, `host … version 2c X`, `enable traps`; a server with `services:{nms:true}` has Net-SNMP `snmpget`/`snmpwalk`/`snmpset -v2c -c X agent object` (sysName.0, sysLocation.0, sysContact.0, sysDescr.0, sysUpTime.0, ifDescr, ifOperStatus, ifAdminStatus) and lists linkUp/linkDown traps. **TFTP**: `services:{tftp:{files:{}}}`; `copy running-config tftp:` / `copy tftp: running-config` (merges). QoS is concept-only (no engine). Task helpers: `Bench.leased(B, pc)`, `Bench.dhcpBound(B, r, ip)`, `Bench.ifLeased(B, r, ios)`, `Bench.natHas(B, r, /regex on show ip nat translations/)`, `Bench.syslogGot(B, srv, re)`, `Bench.trapGot(B, srv, re)`, `Bench.tftpFile(B, srv, name)`, `Bench.ntpSynced(B, r)`, `Bench.resolved(B, pc, name)`. Lab simplifications to state where relied on: one ping command = one echo exchange in the frame log (NAT counters are scaled to 4/5 packets); leases and translations never expire (NAT entries never time out in the lab — real IOS ages them out: ICMP 60 s, UDP 300 s, TCP 24 h or 60 s after FIN/RST; say so where a lesson shows the table); DNS has A records only; no FTP, no DHCPv6, no SNMPv3, no QoS engine.
**Security (Module 8+):** full-engine tests `tools/security_test.js` (every behaviour below has a working example there). **ACL filtering**: interface/SVI `ip access-group N|NAME in|out`; inbound is checked before NAT, outbound after routing and NAT; outbound ACLs filter transit traffic only (the router's own pings/hellos are not filtered outbound), inbound ACLs also see OSPF/HSRP hellos (a forgotten `permit ospf any any` drops the neighbour); a denied packet earns an ICMP administratively-prohibited reply unless the interface has `no ip unreachables` (Windows ping: `Reply from R: Destination protocol unreachable.`; tracert: `reports: Destination protocol unreachable.`; IOS ping `U.U.U`, traceroute `!A  *  !A`; with `no ip unreachables`: timeouts); `log` keyword → %SEC-6-IPACCESSLOGP/DP/S/NP lines; per-entry match counters in `show access-lists` (a Windows ping adds 4 matches, an IOS ping 5); `show ip interface` shows the applied lists and "ICMP unreachables are always/never sent". Real ports: DHCP 67/68, DNS 53, NTP 123, SNMP 161/162, syslog 514, TFTP 69, SSH 22, Telnet 23, HTTP 80 — a UDP service blocked by an ACL just stops working (the task helper shows it). TCP: `ssh`/`telnet`/`curl http://IP[:port]` do a real handshake (curl 7 = refused, curl 28 = timed out; server devices with `services:{web:{title}}` serve a page). VTY `access-class N in` refuses SSH from other sources (`Connection refused`). **Port security** (switch access ports): `switchport port-security` (+ `maximum N`, `mac-address H.H.H` | `mac-address sticky`, `violation shutdown|restrict|protect`), secure MACs show as STATIC in the MAC table, shutdown → err-disabled (%PM-4-ERR_DISABLE, %PORT_SECURITY-2-PSECURE_VIOLATION; recover with shutdown / no shutdown, or `errdisable recovery cause psecure-violation` [+ `interval N`, default 300 s] which re-enables the port with %PM-4-ERR_RECOVER once the bench clock passes the interval), restrict drops + logs + counts, protect drops silently; dynamic secure MACs are forgotten when the link goes down or the port is shut (sticky/configured stay); `no switchport port-security mac-address sticky` turns sticky addresses into dynamic ones; `clear port-security all|configured|dynamic|sticky [interface X]`; `show port-security [interface X | address]`, `show interfaces status err-disabled`, `show errdisable recovery`. **DHCP snooping**: `ip dhcp snooping`, `ip dhcp snooping vlan N`, interface `ip dhcp snooping trust` / `limit rate N`; server messages (Offer/Ack/NAK) arriving on untrusted ports are dropped — renewals too (a renewal Ack through a trusted port refreshes the binding); option 82 is inserted by default with giaddr 0.0.0.0, which an IOS DHCP server refuses — fix with `no ip dhcp snooping information option` on the switch or `ip dhcp relay information trust-all` (or interface `ip dhcp relay information trusted`) on the router; binding table `show ip dhcp snooping binding`, status `show ip dhcp snooping`. **DAI**: `ip arp inspection vlan N`, interface `ip arp inspection trust`, `ip arp inspection validate …`; ARPs on untrusted ports must match a snooping binding or an `arp access-list` applied with `ip arp inspection filter NAME vlan N [static]` (static-IP hosts need one; an explicit `deny` line drops even a host with a binding; `static` = the ACL alone decides, bindings ignored → %SW_DAI-4-ACL_DENY) — else dropped with %SW_DAI-4-DHCP_SNOOPING_DENY; `show ip arp inspection [statistics]`. **Device access**: `security passwords min-length N`, `username X [privilege N] algorithm-type scrypt secret P` (type 9), `login block-for S attempts N within W` → quiet mode refuses VTY sessions except from `login quiet-mode access-class ACL`; `login on-failure log` / `on-success log` (%SEC_LOGIN-4-LOGIN_FAILED, -5-LOGIN_SUCCESS, -1-QUIET_MODE_ON); `show login`; `banner login`; AAA: `aaa new-model`, `aaa authentication login default|NAME group radius|tacacs+ … local`, line `login authentication NAME`, `radius server NAME` / `tacacs server NAME` blocks (address, key) — there is no RADIUS/TACACS+ server device in the lab, so a method list always falls back to the next method (say so: real servers decide when they answer, and fallback happens only when they don't). SSH gives three password tries. Task helpers: `Bench.aclHits(B, r, name, seq)`, `Bench.blocked(B, pc, ip)` (the PC tried and it failed), `Bench.fetched(B, pc, host)` (curl got the page), `Bench.psecViolations(B, sw, port)`, `Bench.secureMacs(B, sw, port)`, `Bench.snoopBound(B, sw, mac)`, `Bench.daiDrops(B, sw, vlan)`, `Bench.quietMode(B, dev)`, `Bench.loginFailures(B, dev)`. Drills (`drills_sec.js`, checked by `tools/drills_sec_test.js` — ACL answers against the real ACL engine): `K.drill({title, types:[…], count})` with types `aclmatch` / `aclmatchstd` / `aclmatchext`, `aclwild`, `aclplace` / `aclplacestd`, `psecviol`, `snoopdrop`, `daicheck`, `pwtype`, `radtac`, `cia` (a generator may return `ex`, an exhibit shown under the question). Lab simplifications to state where relied on: the clock only moves when a task moves it (a login block period and an errdisable recovery interval end only when a task advances the bench clock — in a normal bench recover a port with shutdown / no shutdown and say real switches retry after the interval, 300 s by default); `ip dhcp snooping limit rate`, DAI's 15 pps limit and `ip arp inspection validate` are configured and shown but not enforced; no attack tools are simulated — threats are described in lessons and their effect is shown with ordinary devices (a rogue DHCP server is just a second DHCP server; a static-IP host shows what DAI drops); no 802.1X, no IPsec/VPN engine, no wireless security (Module 9).
**Wireless (Module 9+):** helpers `wlan.js` (controller model, CAPWAP discovery, association rules, RF arithmetic — `tools/wlan_test.js`), `wifi_gui.js` (the WLC GUI and the laptop Wi-Fi panel), full-engine tests `tools/wireless_test.js` (every behaviour below has a working example there), drills `drills_wifi.js` (`wifichan`, `wifioverlap`, `wifiplan`, `wifidbm`, `wifisnr` — `tools/drills_wifi_test.js`); verified labels and facts: scratchpad `M9_FACTS.md`. **Devices:** `{kind:"wlc", wlc:{mgmt:{ip, mask, gw, vlan}, ifaces:{name:{vlan, ip, mask, gw, dhcp}}, wlans:{id:{id, profile, ssid, enabled, iface, security, psk, qos, broadcast, flexLocal}}}}` (ports p1/p2 — connect p1 to a switch **trunk**; management VLAN 0 = untagged), `{kind:"ap", mode:"local"|"flexconnect"|"monitor"|"sniffer", primary:IP, channel:N}` (gets DHCP on its switch port's VLAN; drawn with green radio arcs once joined; monitor/sniffer APs serve no clients; `channel` ≤ 14 = 2.4 GHz / 802.11n, else 5 GHz / 802.11ac — netsh follows it), and laptops with `wifi:{ssid, key, wpa3:true|false, ap:"<ap id>"}` (dhcp:true; `ap` pins the laptop to one AP — it hears only that AP). **AP join (CAPWAP UDP 5246 control / 5247 data):** the AP needs an IP, then finds the controller by local-subnet broadcast, DHCP **option 43** (IOS pool `option 43 hex f104.0a0a.6305` = type f1, length 4 × controllers, then each management IP in hex — `DHCP.capwapWlcs` decodes it), a configured primary controller, or (concept) DNS CISCO-CAPWAP-CONTROLLER; when an AP joins or loses its controller, the frame log of the action that caused it shows "<AP> — CAPWAP: joined …" and each discovery line. **WLANs** (AireOS 8.10 rules): IDs 1–512 but the default AP group only broadcasts IDs 1–16; profile/SSID ≤ 32 characters; a new WLAN is created **Disabled**, on the **management** interface, **WPA2 + AES with 802.1X** key management, QoS **Silver** — a PSK lab must untick 802.1X and tick PSK (8–63 ASCII or 64 hex), then tick Status Enabled; security `none` / `wpa2-psk` / `wpa2-ent` (needs RADIUS — none in the lab, so clients can't join) / `wpa3-sae` / `wpa2-wpa3` (transition); policy strings `[WPA2][Auth(PSK)]`, `[WPA2][Auth(802.1X)]`. **Clients:** associated only if an AP has joined, the WLAN is enabled, the security type suits the adapter (WPA2-only adapter can't join WPA3-only) and the key matches ("The network security key isn't correct" / "Can't connect to this network"); then DHCP on the WLAN's VLAN: **local mode** = tunnelled to the WLC, which puts the frames on its trunk tagged with the interface's VLAN (the VLAN must be allowed on that trunk) and proxies DHCP to the interface's **Primary DHCP Server** (blank → no address; fixing it makes waiting clients retry by themselves; the client's ipconfig /all shows the controller's **virtual** interface 192.0.2.1 as DHCP Server, as on real AireOS); the WLC bridges its own clients to each other on the same VLAN; **FlexConnect + local switching** = the frames leave at the AP's own switch port, which must be a **trunk** carrying the VLAN. A connected laptop gets a dashed radio link to its AP. **Bench actions:** `["wifi", laptop, ssid, key]` (null ssid = disconnect), `["wlc", wlc, "iface", name, vlan, {ip, mask, gw, dhcp}]`, `["wlc", wlc, "ifaceset", name, {...}]`, `["wlc", wlc, "wlan", id, profile, ssid]`, `["wlc", wlc, "wlanset", id, {security, psk, iface, enabled, qos, broadcast, flexLocal}]`, `["wlc", wlc, "apmode", ap, "local"|"flexconnect"|"monitor"|"sniffer"]`, `["wlc", wlc, "access", {http, https, telnet, ssh}]` (defaults: HTTPS + SSH on, HTTP + Telnet off). Windows: `netsh wlan show interfaces` / `show networks` (Windows 11 layout), `ipconfig` shows "Wireless LAN adapter Wi-Fi". Task helpers: `Bench.apJoined(B, ap)`, `Bench.wifiAssoc(B, pc)`, `Bench.wifiVlan(B, pc)`, `Bench.wlanUp(B, wlc, ssid)`. Lab simplifications to state where relied on: no RF propagation (every laptop is in range of the AP; channels, power and interference are taught with diagrams and drills), no RADIUS server (802.1X WLANs can't be joined), no AP groups (IDs > 16 aren't broadcast), the GUI covers WLANs / Interfaces / All APs / Management only, management access to the GUI is a button (real: browse to https://<management IP>), roaming, LAG on the WLC, autonomous APs and the Catalyst 9800 WebUI are concepts.

**WAN, VRFs and tunnels (Module 10+):** full-engine tests `tools/vrf_test.js` and `tools/gre_test.js` (every behaviour below has a working example there — copy their topologies and quote only strings they check); verified IOS facts: scratchpad `M10_FACTS.md`. **VRF-Lite** (routers and `ip routing` L3 switches): `vrf definition NAME` → `(config-vrf)#` with `rd ASN:nn|IP:nn`, `description`, `route-target export|import|both X` (stored/shown only), `address-family ipv4|ipv6 [unicast]` → `(config-vrf-af)#`, `exit-address-family` (or `exit`); the older single-protocol `ip vrf NAME` → `(config-vrf)#` (`rd`, no address families); `no vrf definition|ip vrf NAME` removes the VRF, takes its interfaces out of it (their addresses go — the lab prints nothing, IOS's note is unconfirmed), deletes its statics and OSPF process. Interface `vrf forwarding NAME` / `ip vrf forwarding NAME` (either form works with either VRF style; the running-config shows the one typed), on physical ports, subinterfaces (router-on-a-stick per tenant), SVIs, loopbacks and tunnels: moving an interface into or out of a VRF **removes its IPv4 (and IPv6) addresses** and prints `% Interface GigabitEthernet0/1 IPv4 disabled and address(es) removed due to enabling VRF NAME` (`… disabling VRF NAME` on `no vrf forwarding`; that variant is verbatim-confirmed, "enabling" is the same message with the verb flipped) — re-enter the address afterwards; an undefined VRF → `% VRF NAME not configured.` (UNCONFIRMED wording); a `vrf definition` without `address-family ipv4` refuses `ip address` with a lab message. Address overlap (`% x overlaps with IF`) is checked only within one routing table, so the same subnet can live in several VRFs. **One routing table per VRF**: connected/local from that VRF's interfaces, `ip route vrf NAME NET MASK {next-hop | exit-if [next-hop]} [AD] [global]` (`global` = the next hop is resolved in the global table — leaking, stretch only; an exit-interface static may point at an interface of another table), OSPF from the VRF's own process; the global table never sees VRF routes (a plain `ip route` whose next hop is only reachable in a VRF is simply not installed). Packets are routed in the table of the VRF of the interface they arrived on; a router's own addresses count only in their VRF; each VRF has its own ARP table (the bench keys VRF entries `ip%VRF`). **OSPF per VRF**: `router ospf N vrf NAME` (all router-mode commands; `router ospf N` without the keyword re-enters an existing VRF process), one process per VRF and one global process in the lab; each process is a separate OSPF router (its router ID comes from its own VRF's interfaces; a global `network 0.0.0.0 255.255.255.255 area 0` never enables OSPF on VRF interfaces); `ip ospf N area X` on a VRF interface creates `router ospf N vrf NAME` if needed and is refused (lab message) for a process of another table. Shows: `show vrf` / `show vrf brief` (Name, Default RD `<not set>`, Protocols `ipv4[,ipv6]`, Interfaces as `Gi0/1.10`), `show ip vrf [brief]` (no Protocols column, IPv4 VRFs only), `show ip vrf interfaces`, `show ip route vrf NAME [connected|static|ospf|<ip>]` (starts with a blank line and `Routing Table: NAME`; unknown → `% IP routing table NAME does not exist` [R]), `show ip arp vrf NAME`, `show ip protocols vrf NAME`, `show ip ospf neighbor` (all processes in one table), `show ip ospf [interface [brief]|database]` (one block per process, PID column); running-config: `vrf definition`/`ip vrf` blocks right after the hostname, ` vrf forwarding NAME` after description/encapsulation and before ` ip address`, `router ospf N vrf NAME` blocks in process-ID order, `ip route vrf …` lines after the global `ip route` lines. Exec: `ping vrf NAME IP [source IF|IP]`, `traceroute vrf NAME IP [source …]` (a plain ping from the router uses the global table — the classic mistake; source must be in that VRF; unknown VRF → `% Unrecognized host or address, or protocol not running.`). **GRE tunnels** (routers and `ip routing` switches): `interface TunnelN` (`tu0`) logs `%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down` on creation; `ip address`, `tunnel source <interface|own IP>`, `tunnel destination IP`, `tunnel mode gre ip` (the default, never shown; other modes are refused with a lab note — DMVPN/mGRE, IPsec VTI are concepts), `tunnel vrf NAME` (the underlay lookup — "front-door VRF"), `keepalive [period [retries]]` (default 10 3; shown as ` keepalive 10 3`), `bandwidth`, and on any routed interface `ip mtu 68-1500` (tunnels up to 9976) and `ip tcp adjust-mss 500-1460` (stored and shown only — MTU/fragmentation is not simulated; teach 1476/1400/1360 with drills); `no interface TunnelN`. **Line protocol** (TN118361): up/up when not shut, the source interface is up/up with an IP address (in the tunnel's underlay table), a destination is set and it is **routable** — any route, the default counts, but not through a tunnel; the far end does NOT have to answer (no keepalives = a dead or misconfigured far end leaves it up/up and traffic black-holes); with `keepalive` the far end must unwrap our GRE packet (a matching tunnel: its source = our destination, its destination = our source) and route the reply back, else up/down. Recursive routing: when the best route to the destination points out of the tunnel itself (e.g. the far side advertises its WAN subnet into OSPF over the tunnel), the router logs `%TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing` then the LINEPROTO down line and the neighbour drops (`%OSPF-5-ADJCHG … FULL to DOWN`); real IOS brings it back after a while and **flaps** for as long as the fault lasts — the lab keeps it **down** while the fault persists and re-checks after every configuration or cabling change (the fix: stop advertising the underlay into the tunnel, or a /32 static to the destination via the ISP). Tunnel line-protocol changes print on the console after the command that caused them and are logged in order (line protocol before the adjacency). **Data path**: a packet routed out of a tunnel is wrapped in a new IP header (tunnel source → destination, protocol 47, +24 bytes) and the outer packet crosses the underlay hop by hop (ARP, routes, inbound ACLs see protocol 47 — an edge ACL needs `permit gre host A host B`, a `deny gre … log` logs `%SEC-6-IPACCESSLOGNP: list N denied 47 A -> B, 1 packet`, counters ×4/×5 like other pings); the far router unwraps it only if one of its up tunnels has the mirror-image source/destination (none → dropped: "can't unwrap it", the inner sender times out); the inner packet then arrives on the far tunnel (inbound ACL on the tunnel applies, its TTL drops by one: the whole tunnel is ONE hop — tracert shows the far tunnel address; the ISP routers stay invisible). The frame log says "GRE encapsulation on R Tunnel0: … NEW IP header A → B, protocol 47 (GRE) — +24 bytes …", each underlay hop as "GRE A → B (protocol 47) carrying ICMP echo request …", and "GRE decapsulation on …"; the animation draws GRE frames violet with a GRE badge. **OSPF over a tunnel**: hellos cross the underlay inside GRE (ACLs included); network type POINT_TO_POINT (`FULL/  -`), tunnel BW 100 Kbit/s → cost 1000 (a far LAN = [110/1001]; `bandwidth 10000` → 10). Shows: `show interfaces tunnel 0` (Tunnel0 is up, line protocol is up/down · Hardware is Tunnel · Internet address · MTU 9976 bytes, BW 100 Kbit/sec, DLY 50000 usec · Encapsulation TUNNEL · Keepalive not set / Keepalive set (10 sec), retries 3 · Tunnel source A (Gi0/1), destination B · Tunnel protocol/transport GRE/IP · Key disabled, sequencing disabled · Checksumming of packets disabled · Tunnel TTL 255, Fast tunneling enabled · Tunnel transport MTU 1476 bytes · Tunnel transmit/receive bandwidth 8000 (kbps) — the lines after "transport GRE/IP" are [R]), `show ip interface Tunnel0` (MTU is 1476 bytes, or the `ip mtu`), `show ip interface brief` (`Tunnel0 172.16.0.1 YES manual up up|down`), `show ip ospf interface Tunnel0`; running-config: ` ip address`, ` ip mtu`, ` ip tcp adjust-mss`, OSPF lines, ` keepalive P R`, ` shutdown`, then ` tunnel source X` / ` tunnel destination Y` / ` tunnel vrf V`. Task helpers: `Bench.vrfOf(B, r, ios)`, `Bench.vrfRoute(B, r, vrf, "10.1.1.0/24"[, code])`, `Bench.vrfRouteVia(B, r, vrf, ip)`, `Bench.route(B, r, prefix, code, vrf)` / `Bench.routeVia(B, r, ip, vrf)` (extra argument), `Bench.vrfPinged(B, r, vrf, ip)` (an IOS `ping vrf` from that router succeeded; `vrf` null = a global IOS ping), `Bench.vrfOspfNbr(B, r, vrf, rid[, state])`, `Bench.tunnelUp(B, r, 0|"Tunnel0")`, `Bench.tunnelWhy(B, r, n)` ("up", "shutdown", "no source", "source down", "no destination", "destination is local", "no route", "recursive", "keepalive"), `Bench.recursive(B, r, n)`, `Bench.greSeen(B)` (the last action's traffic went through a tunnel), plus `Bench.ospfNbr`, `Bench.logged(B, r, /TUN-5-RECURDOWN/)`, `Bench.aclHits`. Lab simplifications to state where relied on: no MTU/fragmentation/PMTUD (ip mtu and adjust-mss are shown, not enforced), recursive routing is held down instead of flapping, NAT translations never time out, GRE through NAT/PAT isn't modelled (keep tunnel endpoints on public addresses), no GRE key/checksum, no IPsec/MPLS/BGP/DMVPN/serial engine (concepts and diagrams), one OSPF process per VRF, DHCP pools/relay are global-table only (don't put DHCP clients in overlapping VRF subnets), route targets and RDs are stored and shown only (VRF-Lite needs neither), NAT, SSH/Telnet, SNMP, syslog, NTP and DNS use the global table only.

**PC Command Prompt:** `ipconfig`, `ipconfig /all`, `ping`, `tracert`, `arp -a`, `arp -d`, `ssh -l <user> <ip>` / `ssh user@ip`,
`telnet <ip>`, `cls`. SSH/Telnet open a real session on the device (needs a reachable management IP and the right VTY,
user, domain-name and RSA key config); `exit` closes it.

**Pre-configured devices:** `{..., config: env => { env.exec("en"); env.exec("conf t"); ... }}` runs commands at
creation (that config counts as saved startup-config; add `fresh:true` for an out-of-the-box device).
`challenge:true` + tasks with `hint` = module challenge mode. `openLog:true` opens the frame log by default.

Task helpers: `Bench.upAt(B, ref)`, `Bench.up(B, a, b)`, `Bench.linked(B, a, b)`, `Bench.cableType(B, ref)`,
`Bench.consoleOk(B, devId)`, `Bench.pinged(B, fromId, ip)` (a PC/server ping or tracert, and also an IOS `ping` from a router or switch — global
table; a `ping vrf` is `Bench.vrfPinged`), `Bench.macKnown(B, swId, mac)`, `Bench.macCount(B, swId)`,
`Bench.arpHas(B, devId, ip)`, `Bench.pingedNow(B, fromId, ip[, vrf])` (the latest ping/tracert from that device to ip succeeded AND nothing — configs,
addresses, cables, power — has changed since: use it for "fix it, then prove it" tasks so a ping from before the fix doesn't count), `Bench.remoteTo(B, pcId)` (IP of a logged-in ssh/telnet session), `Bench.session(B, pcId)`
(`{host, proto:"ssh"|"telnet", user}` after login), `Bench.tried(B, pcId, /regex/)` (did the learner run that PC command), `Bench.mismatch(B, a, b)`,
never read `B.remote` / `B.events` directly,
plus `B.devs[id].ip / .mac` and `B.devs[id].env` (the IOS state — see below). Solve actions: `plug unplug insert remove
flip ip pc power console term` (`["term",""]` answers a `[confirm]` with Enter; `["pc","pc1","Str0ng!"]` answers an ssh password).

## Simulator commands available to `K.term`

**Cisco IOS v2 (`env:"ios2"`) — use this for all new CCNA content** (and it is what bench switches/routers run).
`opts: {kind:"switch"|"router", host, model}`. It behaves like real IOS: abbreviations (`sh ip int br`), `?` help,
Tab completion, `% Invalid input detected at '^' marker.` with the caret, `% Incomplete command.`, `% Ambiguous command`,
the `Translating "typo"...domain server` trap (and `no ip domain-lookup`), `[confirm]` prompts, `Password:` prompts with
no echo, `do` in config modes, global commands typed in a sub-mode drop back to global, reload loses unsaved changes.
State for `done(env)`: `env.mode` (`user|priv|config|config-if|config-line|config-vlan`), `env.host`, `env.enableSecret`,
`env.enablePassword`, `env.servicePwEnc`, `env.banner`, `env.lines.con/vty.{password,login,loginLocal,transport,timeout,sync}`,
`env.users[name].{secret,password}`, `env.domain`, `env.domainLookup`, `env.rsa` (bits), `env.sshVer`, `env.defaultGw`,
`env.routes`, `env.cdpRun`, `env.lldpRun`, `env.vlans[id]` (name), `env.intfs[name].{ip,mask,shut,desc,mode,vlan,allowed,native,speed,duplex,cdp,mac}`
(includes `Vlan1` SVI on switches), `env.savedOnce`, `env.startup`, `env.history`, `env.sshReady()`.
Exec: `enable disable exit logout ping traceroute show… copy running-config startup-config write [memory] erase startup-config
reload clear mac address-table dynamic clear counters terminal length`. Show: `running-config startup-config version
ip interface brief interfaces [status|<if>] vlan [brief] mac address-table [dynamic|address|interface|vlan] (VLAN right-aligned in 4, as IOS: `  10    0050.56a1.0001    DYNAMIC     Gi0/3`)
cdp neighbors [detail] (a Device ID longer than 16 characters gets its own line; the rest of the row follows on the next line, indented 17)
lldp neighbors arp ip arp ip route history users ip ssh clock spanning-tree [vlan N]`. Without a bench every port counts as cabled (as in
`show interfaces status`), so `show spanning-tree vlan N` shows an instance (this switch = root) only for a VLAN with a port in it (access or trunk);
a VLAN with no up port — or no such VLAN — gives `Spanning tree instance(s) for vlan N does not exist.` like a real switch.
A standalone `ping` succeeds only for the device's own addresses on up interfaces and for hosts on its up connected subnets (not the subnet
or broadcast address), in the table the ping uses — a plain `ping` the global table, `ping vrf X` that VRF (so a VRF-only address fails
from a plain ping, the classic mistake); anything beyond a next hop fails with `.....` even when a route exists, because nothing is cabled
there — use a bench when a lesson needs a remote ping to succeed.
Global config: `hostname enable secret|password service password-encryption banner motd #…# interface <if>|range|vlan N
vlan N (name) no vlan line console 0 line vty 0 4|0 15 username X secret|password Y ip domain-name ip domain-lookup
crypto key generate rsa [modulus N] ip ssh version 2 ip default-gateway ip route cdp run lldp run` (and `no` forms).
Interface: `description shutdown no shutdown ip address speed duplex switchport mode access|trunk switchport access vlan
switchport trunk allowed vlan [add|remove] list switchport trunk native vlan switchport nonegotiate cdp enable`.
Line: `password login login local no login transport input ssh|telnet|all|none exec-timeout logging synchronous`.
Also: output modifiers `show … | include|exclude|begin|section <regex>`, `reload in N` / `reload cancel` / `show reload`,
`show users` (lists live SSH/Telnet sessions on a bench), `%SYS-5-CONFIG_I` after leaving config mode, and switch
running-configs show `line vty 0 4` and `line vty 5 15` blocks like a real Catalyst.
Solve lists may include `""` to answer a `[confirm]` or default prompt.

**Cisco IOS v1 (`env:"ios"`)** — the older, simpler engine used by Module 1 and the classic labs. — `opts: {host, kind:"router"|"switch", intfs, strictPing, neighbor, motd}`.
State you can test in `done(env)`: `env.mode` (`user|priv|config|config-if|config-vlan|config-router`),
`env.host`, `env.enableSecret`, `env.savedOnce`, `env.intfs["GigabitEthernet0/1"].{ip,mask,shut,vlan,mode,desc}`,
`env.vlans`, `env.history` (every command typed), `env.pinged[ip]`, `env.staticRoutes`, `env.ospf`.
Commands: `enable`, `disable`, `exit`, `end`, `configure terminal`/`conf t`, `show ip interface brief`,
`show running-config`, `show startup-config`, `show vlan brief`, `show mac address-table`, `show version`,
`show interfaces trunk`, `show ip route`, `show ip ospf neighbor`, `copy running-config startup-config`/`write memory`/`wr`,
`ping <ip>`, `do <cmd>` in config modes; config: `hostname`, `enable secret`, `interface g0/0..g0/2`, `vlan <id>` → `name`,
`router ospf <pid>` → `router-id`, `network <net> <wc> area <n>`, `passive-interface`; `ip route <net> <mask> <nh>`;
interface: `ip address`, `shutdown`, `no shutdown`, `description`, `switchport mode access|trunk`,
`switchport access vlan`, `switchport trunk allowed vlan`.

## Checking your work

Run `node tools/validate.js` before every commit. It loads every data file the way the browser does
and fails on broken JS, bad quiz answers, broken quick checks, unbalanced HTML and terminal tasks that throw.
It also prints words per lesson so thin lessons are easy to spot.

**Beginner continuity (non-negotiable):** run `node tools/terms.js --track <id> --mod <module id>` (or `--lesson <fragment.js>`,
repeatable, for unassembled fragments in order). It lists every acronym or technical term a learner meets before the course
has taught it — "never defined" (no earlier lesson and this lesson never explains it) or "defined later" (explained only well
after first use). Fix each with a `K.g` at the first use (expansion + plain meaning; say which later module covers it if it's a
forward reference). Brands, places and formats everyone knows go in the `NAMES`/`COMMON` lists in tools/terms.js. A module
doesn't ship until this prints 0 for it. `--jargon` additionally checks multi-word glossary terms (noisier; review by hand).
Lab text (task lines, hints, win messages) is checked where the lab sits in the lesson.

**Lab readiness (non-negotiable):** `node tools/labs_ready.js --track <id> --mod <module id>` (or `--lesson` fragments) checks
every command in each lab's / terminal's `solve` against what was taught before the learner reaches it (code and command
output earlier in the lesson or in earlier lessons; abbreviations count, arguments don't). "NOT TAUGHT" must be 0. "lab-only"
means the lab's own task introduces the command: fine only if the task says what the command does, in plain words, with a
pointer to where it's covered properly. Aim for understanding, not memorising: teach the logic (how the device decides) so a
learner can reason through a scenario the lesson never showed — end each section with a "same logic, new situation" practice.
Labs, challenges and quiz scenarios are close cousins of the worked examples, never copies: change the addressing, names or
topology, add a twist, or state the problem as a real ticket/symptom, so the learner applies the logic rather than repeating steps.

When you release, bump the `?v=` stamp on the script tags in `index.html` (e.g. `?v=20261012a`) so browsers fetch the
new files instead of mixing cached old ones with new ones. Then open the site with `#selftest` on the end of the URL.
