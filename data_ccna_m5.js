// CCNA · Module 5 — IP routing: the routing table, static routes, OSPFv2 and first-hop redundancy (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lessons "Routing fundamentals: static routes, dynamic protocols, OSPF" and "OSPF deep-dive: adjacency, DR/BDR, cost, areas, troubleshooting".
(function(){
const L = [];

// ---------- Module 5 · Lesson 1 ----------
L.push({
id:"route-table", mins:85, level:"Intermediate · builds on Modules 1–4",
t:"How a router decides: the routing table, longest match, administrative distance and metrics",
html:`
${K.goals([
  "Read every part of <code>show ip route</code>: codes, gateway of last resort, classful headings, C and L routes, <code>[AD/metric]</code>, next hop, age and interface.",
  "Predict which route wins for any destination — longest match, then administrative distance, then metric — and say why each step exists.",
  "Ask the router with <code>show ip route &lt;address&gt;</code> and prove the real path with <code>traceroute</code> / <code>tracert</code>.",
  "Explain what happens to a packet that matches no route.",
  "Diagnose the classic faults behind &ldquo;only one subnet is broken&rdquo; and &ldquo;the traffic takes the long way&rdquo;.",
])}
${K.pre(["Module 3: prefixes, masks and subnetting (which subnet an address is in), the default gateway, and your first look at connected and local routes.","Module 4 lesson 3: inter-VLAN routing.","Module 1: ping and what traceroute is for."])}

<h2>Why this matters at work</h2>
<p>10:15 at a bank's network operations centre in Abuja. The Kaduna branch can open email, but core banking times out. A colleague has been reading firewall rules for forty minutes. You log into the branch router, type <code>show ip route 10.80.40.25</code>, and the answer is on the screen: a route for that one subnet, left over from an old change, pointing at a firewall that was unplugged at midnight. One line fixes it.</p>
<p>Every router, Layer 3 switch, firewall and cloud ${K.g("VPC","Virtual Private Cloud: a private network inside a cloud provider such as AWS. Its route tables follow the same longest-match rule.")} makes the same three decisions for every packet, in the same order. Understand the rule and the reason behind it, and you can read any routing table and say where a packet will go — the skill behind most &ldquo;I can reach X but not Y&rdquo; tickets.</p>

<h2>What a route is — and where routes come from</h2>
<p>A PC sends anything off its subnet to its default gateway (Module 3). The router must then choose a direction for each packet, using its ${K.g("routing table","The router's list of known destination networks and where to send packets for each. Cisco IOS: show ip route.")}, also called the ${K.g("RIB","Routing Information Base: the routing table the router forwards with — one best route per prefix, chosen from all sources (connected, static, OSPF…).")} (Routing Information Base).</p>
<p>Plain version: <b>a route is one line of directions — &ldquo;to reach these addresses, send the packet that way&rdquo;.</b> Precisely, it has three parts:</p>
<ul>
<li><b>The ${K.g("prefix","A network address plus a length, such as 10.30.1.0/24: the block of addresses a route covers. The length says how many leading bits must match.")}</b> — <i>what</i> it reaches. <code>10.30.1.0/24</code> covers 10.30.1.0–10.30.1.255.</li>
<li><b>Where to send it</b> — the ${K.g("next hop","The IP address of the next router on the path, on a subnet this router is connected to.")} (the next router's IP) and/or the ${K.g("exit interface","This router's own interface the packet leaves through, e.g. GigabitEthernet0/2.")} (the port the packet leaves through).</li>
<li><b>The source</b> — <i>who</i> said so: connected, typed by an engineer, or learned by a routing protocol. Sources can disagree (administrative distance settles it, later).</li>
</ul>
<div class="tablewrap"><table>
<tr><th>Code</th><th>Source</th><th>How it gets there</th></tr>
<tr><td><code>C</code></td><td>Connected</td><td>Automatically, when an interface has an IP address and is up/up: the router is <i>on</i> that subnet.</td></tr>
<tr><td><code>L</code></td><td>${K.g("Local","A /32 route for the router's own interface address, added with each connected route (IOS 15 and later): 'this address is me'.")}</td><td>Automatically, with every connected route: a <code>/32</code> for the interface's own address.</td></tr>
<tr><td><code>S</code></td><td>Static</td><td>An engineer types network, mask, next hop: <code>ip route 172.16.0.0 255.255.0.0 10.0.12.2</code>. Lesson 2 covers every form.</td></tr>
<tr><td><code>O</code>, <code>D</code>, <code>R</code></td><td>Dynamic</td><td>A ${K.g("routing protocol","Software on routers that tells neighbours which networks it can reach, so routes are learned automatically and change when links fail.")} learns it from neighbours: <code>O</code> OSPF (lessons 3–6), <code>D</code> EIGRP, <code>R</code> ${K.g("RIP","Routing Information Protocol: an old, simple protocol whose metric is the hop count (max 15).")}.</td></tr>
</table></div>
<p>One special static: the ${K.g("default route","A route for 0.0.0.0/0 — it matches every destination, so it's used when nothing more specific does. Usually points towards the internet.")}, <code>ip route 0.0.0.0 0.0.0.0 &lt;next hop&gt;</code>. A <code>/0</code> needs zero matching bits, so it matches everything; it shows as <code>S*</code>. To remove any static, repeat it with <code>no</code> in front: <code>no ip route 172.16.0.0 255.255.0.0 10.0.12.2</code>. You'll use both in this lesson's labs.</p>
${K.svg("0 0 720 230",
  K.txt(30,50,"O",{c:"fg",s:14,b:true})+K.txt(70,50,"10.30.1.0/24",{c:"fg",s:14})+K.txt(200,50,"[110/2]",{c:"fg",s:14})+K.txt(280,50,"via 10.0.13.2,",{c:"fg",s:14})+K.txt(430,50,"00:31:47,",{c:"fg",s:14})+K.txt(530,50,"GigabitEthernet0/2",{c:"fg",s:14})+
  K.box(10,112,108,58,"Source","O = OSPF",true)+K.box(126,112,108,58,"Prefix","what it reaches")+K.box(242,112,108,58,"[AD/metric]","trust · cost",true)+
  K.box(358,112,108,58,"Next hop","next router")+K.box(474,112,108,58,"Age","since learned")+K.box(590,112,120,58,"Exit interface","leaves from here")+
  K.arrow(64,110,36,60)+K.arrow(180,110,116,60)+K.arrow(296,110,228,60)+K.arrow(412,110,336,60)+K.arrow(528,110,466,60)+K.arrow(650,110,600,60)+
  K.txt(360,205,"prefix = WHAT it reaches · next hop + interface = WHERE to send it · code + AD = WHO said so, and how far to trust it",{c:"muted",s:11,mid:true,f:"body"}),
  "Anatomy of one routing-table line: what it reaches (prefix), where to send the packet (next hop and exit interface), and who said so (the code), with the administrative distance and metric used when sources or paths compete.")}
${K.analogy(`<p>A route is a road sign: <b>&ldquo;Kano 230 km →&rdquo;</b>. A destination (prefix), a direction (next hop) and, in the small print, who put it up — the federal roads authority or someone with a marker pen (the source). The router reads the signs again for every packet.</p>`)}
${K.check({q:"Gi0/1 is configured as 10.0.12.1/30 and is up/up. Which two routes does IOS add by itself?", o:["C 10.0.12.0/30 and S 10.0.12.0/30","C 10.0.12.0/30 and L 10.0.12.1/32","L 10.0.12.0/30 and C 10.0.12.1/32","Only C 10.0.12.0/30"], a:1, why:"An up/up interface with an address gives a connected route for its subnet and a local /32 for its own address. Both vanish if the interface goes down."})}
<h3>Same logic, new situation</h3>
<p>A hospital's Layer 3 switch has <code>interface vlan 30</code> with <code>ip address 10.44.30.1 255.255.255.0</code>, but nothing in VLAN 30 is plugged in yet, so the SVI is up/down (Module 4 autostate). Should <code>show ip route</code> list 10.44.30.0/24?</p>
${K.hint(`Connected routes have a condition besides the address.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Whether an up/down interface gives a connected route. <b>2. Rule:</b> C and L routes exist only while the interface has an address <i>and</i> is up/up. <b>3. Apply it:</b> no C or L route yet — correctly, because the switch mustn't attract traffic for a subnet it can't deliver to. Plug a device into VLAN 30 and both appear.</p>`)}

<h2>Reading every part of show ip route</h2>
<p>A distribution company's router at its Kano depot: a LAN, two links to head office running OSPF, two statics and a default.</p>
${K.out(`KANO-R1#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
       E1 - OSPF external type 1, E2 - OSPF external type 2
       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2
       ia - IS-IS inter area, * - candidate default, U - per-user static route
       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP
       a - application route
       + - replicated route, % - next hop override, p - overrides from PfR

Gateway of last resort is 10.0.0.2 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 10.0.0.2
      10.0.0.0/8 is variably subnetted, 7 subnets, 3 masks
C        10.0.0.0/30 is directly connected, GigabitEthernet0/1
L        10.0.0.1/32 is directly connected, GigabitEthernet0/1
C        10.0.0.4/30 is directly connected, GigabitEthernet0/2
L        10.0.0.5/32 is directly connected, GigabitEthernet0/2
O        10.0.0.8/30 [110/2] via 10.0.0.2, 00:07:00, GigabitEthernet0/1
O        10.0.0.12/30 [110/2] via 10.0.0.6, 00:30:43, GigabitEthernet0/2
O        10.40.0.0/24 [110/3] via 10.0.0.2, 00:23:17, GigabitEthernet0/1
                      [110/3] via 10.0.0.6, 00:23:17, GigabitEthernet0/2
      172.31.0.0/24 is subnetted, 2 subnets
S        172.31.5.0 [1/0] via 10.0.0.2
S        172.31.6.0 [1/0] via 10.0.0.6
      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0`, "KANO-R1's full routing table. The notes below take it top to bottom.")}
<p><b>The codes.</b> The first lines are the ${K.g("legend","The key at the top of an output explaining its symbols — here, what each route code letter means.")}. For the CCNA you need <code>L C S O D R</code>, <code>B</code> (${K.g("BGP","Border Gateway Protocol: the protocol that joins ISPs and large organisations across the internet. CCNA needs only its AD values.")}), <code>E2</code> and <code>IA</code> (OSPF, lessons 4 and 6) and <code>*</code> (candidate default). Filtered views skip the rest: <code>show ip route connected</code>, <code>show ip route static</code>, <code>show ip route ospf</code>.</p>
<p><b>Gateway of last resort.</b> <code>Gateway of last resort is 10.0.0.2 to network 0.0.0.0</code> means a default route exists and points at 10.0.0.2 — ${K.g("gateway of last resort","IOS's name for the next hop of the default route: where packets go when no more specific route matches.")} is IOS's name for it. Without one the line says <code>Gateway of last resort is not set</code>. The default itself is listed first: <code>S* 0.0.0.0/0 [1/0] via 10.0.0.2</code>.</p>
<p><b>The classful headings.</b> IOS groups routes under the old ${K.g("classful","The pre-1993 scheme that sized a network by its first octet: class A /8, class B /16, class C /24 (Module 3).")} network they belong to and prints an indented heading for each group. A heading is bookkeeping, never a route.</p>
<ul>
<li><code>10.0.0.0/8 is variably subnetted, 7 subnets, 3 masks</code> — seven routes inside class A 10.0.0.0, using three lengths (/30, /32, /24). <b>Variably subnetted</b> = more than one mask, so every row keeps its <code>/length</code>.</li>
<li><code>172.31.0.0/24 is subnetted, 2 subnets</code> — both routes share one mask, so IOS prints the <code>/24</code> in the heading and <b>leaves it off the rows</b>: <code>S 172.31.5.0</code> means 172.31.5.0/24.</li>
<li><code>192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks</code> — a C /24 plus an L /32 are two masks, so even a plain LAN shows like this.</li>
</ul>
<p><b>C and L.</b> <code>C 10.0.0.0/30</code>: &ldquo;I'm on this subnet; deliver with ARP&rdquo;. <code>L 10.0.0.1/32</code>: &ldquo;this address is me&rdquo; — how a ping or SSH to the router is answered. No brackets: facts, not opinions.</p>
<p><b>[AD/metric], via, age, interface.</b> In <code>O 10.0.0.12/30 [110/2] via 10.0.0.6, 00:30:43, GigabitEthernet0/2</code>:</p>
<ul>
<li><code>[110/2]</code> — ${K.g("administrative distance","AD: how much the router trusts a route's source, 0–255, lower = more trusted. Chooses between sources offering the same prefix.")} (AD) 110 = OSPF; ${K.g("metric","A routing protocol's cost for a path; lower is better. Each protocol measures differently (OSPF: cost from bandwidth; RIP: hops).")} 2 = the OSPF cost. Statics show <code>[1/0]</code>.</li>
<li><code>via 10.0.0.6</code> — next hop. <code>00:30:43</code> — age since learned or changed (days show as <code>2d04h</code>; seconds-old in a stable network means something just changed). <code>GigabitEthernet0/2</code> — exit interface. A next-hop-only static prints none; the router finds it by looking the next hop up again (a ${K.g("recursive lookup","Looking up a route's next hop in the routing table to find which interface leads to it. Lesson 2.")}, lesson 2).</li>
<li>The indented second line under <code>10.40.0.0/24</code> is a <b>second equally good path</b> for the same prefix — both are used (ECMP, section 6).</li>
</ul>
${K.exam(`A row with no <code>/length</code>? Look up to its heading: <code>is subnetted</code> carries the one mask every row in that group uses. &ldquo;What is the mask of 172.31.5.0?&rdquo; is answered from the heading.`)}
${K.q({type:"fill", q:"Read this EIGRP route: D 10.4.0.0/16 [90/30720] via 10.9.0.2, 2d03h, GigabitEthernet0/1.", fields:[{label:"Administrative distance", a:["90"]},{label:"Metric", a:["30720"]},{label:"Next hop", a:["10.9.0.2"]},{label:"Exit interface", a:["GigabitEthernet0/1","Gi0/1","G0/1"]}], why:"Same layout as OSPF: D = EIGRP, [90/30720] = AD 90 and metric 30720, via = next hop, 2d03h = age, then the exit interface. EIGRP metrics are large because they combine bandwidth and delay — and you only compare them within EIGRP."})}
<h3>Try it: read a table as it changes</h3>
<p><code>APAPA-R1</code>, in a shipping office near the port, has Gi0/0 towards a firewall (<code>10.1.1.2</code>), Gi0/1 towards head office (<code>10.2.2.2</code>) and three statics. Read its table, then add two routes and watch the heading and the gateway of last resort change. In config mode, <code>do show ip route</code> looks without leaving.</p>
${K.term({env:"ios2", title:"read and change the routing table on APAPA-R1", opts:{kind:"router", host:"APAPA-R1", model:"C1111-4P", motd:"APAPA-R1 — console session (lab router, no enable secret)."},
  setup:env=>{ ["enable","configure terminal","interface g0/0","ip address 10.1.1.1 255.255.255.0","no shutdown","interface g0/1","ip address 10.2.2.1 255.255.255.0","no shutdown","exit",
    "ip route 172.20.10.0 255.255.255.0 10.1.1.2","ip route 172.20.20.0 255.255.255.0 10.1.1.2","ip route 172.20.30.0 255.255.255.0 10.2.2.2","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"Start with <code>enable</code>. Predict each output before you press Enter.",
  tasks:[
    {text:"<code>show ip route</code> — find <code>172.20.0.0/24 is subnetted, 3 subnets</code> and notice the three S rows carry no <code>/24</code>", done:e=>e.log.some(l=>/172\.20\.0\.0\/24 is subnetted, 3 subnets/.test(l.out||""))},
    {text:"<code>show ip route connected</code> — only the C and L pairs for Gi0/0 and Gi0/1", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+con/i.test(l.cmd||"") && /L\s+10\.2\.2\.1\/32/.test(l.out||""))},
    {text:"Head office wants one summary for its block: in <code>configure terminal</code> add <code>ip route 172.20.0.0 255.255.0.0 10.2.2.2</code> (network, /16 mask, next hop), then <code>do show ip route</code>. The heading becomes <code>variably subnetted, 4 subnets, 2 masks</code> and every row shows its length", done:e=>e.log.some(l=>/172\.20\.0\.0\/16 is variably subnetted, 4 subnets, 2 masks/.test(l.out||""))},
    {text:"Add a default route, <code>ip route 0.0.0.0 0.0.0.0 10.2.2.254</code>, and look again: an <code>S*</code> line and <code>Gateway of last resort is 10.2.2.254 to network 0.0.0.0</code>", done:e=>e.log.some(l=>/Gateway of last resort is 10\.2\.2\.254 to network 0\.0\.0\.0/.test(l.out||""))},
    {text:"<code>end</code>, then <code>show ip route static</code> — the default and the four statics, nothing else", done:e=>e.log.some(l=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+st/i.test(l.cmd||"") && /S\*\s+0\.0\.0\.0\/0/.test(l.out||""))},
  ],
  win:"You read the headings, saw why rows lose their length under 'is subnetted', and watched a summary make the group 'variably subnetted' and a default route set the gateway of last resort.",
  solve:["enable","show ip route","show ip route connected","configure terminal","ip route 172.20.0.0 255.255.0.0 10.2.2.2","do show ip route","ip route 0.0.0.0 0.0.0.0 10.2.2.254","do show ip route","end","show ip route static"]})}
${K.check({q:"A heading reads '10.0.0.0/8 is variably subnetted, 6 subnets, 3 masks'. What does it tell you?", o:["There is a route for 10.0.0.0/8 with three next hops","Six routes inside classful 10.0.0.0 are listed below it, using three different prefix lengths","Six interfaces are in 10.0.0.0/8","Three routing protocols are running"], a:1, why:"Headings group routes by classful network and are not routes. 'Variably subnetted, 6 subnets, 3 masks' counts the routes under it and how many different masks they use."})}
<h3>Same logic, new situation</h3>
<p>A colleague pastes this from a customer's router: what mask does the S route use, and is there a default route?</p>
${K.out(`Gateway of last resort is not set

      192.168.50.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.50.0/24 is directly connected, GigabitEthernet0/0
L        192.168.50.1/32 is directly connected, GigabitEthernet0/0
      198.51.100.0/27 is subnetted, 1 subnets
S        198.51.100.64 [1/0] via 192.168.50.254`, "198.51.100.0 is a documentation range standing in for a partner's public block.")}
${K.hint(`The row has no length — where is its mask printed? Then read the line above the routes.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> A hidden mask, and whether a default exists. <b>2. Rule:</b> under <code>is subnetted</code> every row uses the heading's mask; a default shows as <code>S* 0.0.0.0/0</code> and in the gateway line. <b>3. Apply it:</b> the route is 198.51.100.64/27 (.64–.95). <code>Gateway of last resort is not set</code> and no <code>S*</code>: no default, so a packet to 8.8.8.8 would be dropped.</p>`)}

<h2>Rule 1: the longest match wins</h2>
<p>A packet arrives for <code>10.64.8.20</code>, and several routes contain that address. Which is used?</p>
${K.remember(`<b>The forwarding rule:</b> use the route with the <b>longest matching prefix</b> — the most specific route that contains the destination. /24 beats /16 beats /8 beats the /0 default. <b>Longest wins, whatever the source.</b>`)}
<p>This is ${K.g("longest prefix match","The forwarding rule: of all routes whose prefix contains the destination, use the one with the longest prefix length.")}. A route &ldquo;contains&rdquo; an address when the address's first <i>n</i> bits equal the route's first <i>n</i> bits, <i>n</i> being the prefix length.</p>
<p><b>Why?</b> A longer prefix is a more precise claim, made on purpose. It allows one ${K.g("summary route","One route covering several smaller networks, e.g. a /16 for all of a site's /24s (Module 3).")} for a whole site plus one specific route for the subnet that must go another way, and a default that loses to everything — used only when nothing else fits, exactly &ldquo;last resort&rdquo;. The answer depends only on the destination and the table, never on the order routes arrived.</p>
${K.svg("0 0 720 270",
  K.txt(20,24,"Packet for 10.64.8.20 = 00001010.01000000.00001000.00010100",{c:"fg",s:12.5,b:true})+
  K.txt(20,62,"0.0.0.0/0  via ISP",{c:"fg",s:11.5})+K.txt(200,62,"0 bits must match — always matches",{c:"muted",s:11})+
  K.txt(20,102,"10.64.0.0/16  via R2",{c:"fg",s:11.5})+K.band(200,86,192,24,"16 bits match","var(--chip)")+
  K.txt(20,142,"10.64.8.0/24  via R3",{c:"fg",s:11.5,b:true})+K.band(200,126,288,24,"24 bits match","var(--chip)")+K.txt(500,143,"← longest match: used",{c:"ok",s:11.5,b:true})+
  K.txt(20,182,"10.64.8.128/25  via R5",{c:"fg",s:11.5})+K.txt(200,182,"no match: bit 25 is 1 in the route, 0 in the packet (.20 < .128)",{c:"bad",s:11})+
  K.txt(20,222,"172.16.0.0/12  via R4",{c:"fg",s:11.5})+K.txt(200,222,"no match: first octet 172 ≠ 10",{c:"bad",s:11})+
  K.txt(360,258,"Only routes that contain the address compete; among them the longest prefix wins.",{c:"muted",s:11,mid:true,f:"body"}),
  "Longest match to scale (12 px per bit). The /0, /16 and /24 contain 10.64.8.20; the /24 matches most bits and wins. The /25 is longer but covers .128–.255, so it never competes.")}
<h3>Worked example: which route for each packet?</h3>
<p>A Lagos insurance broker's router has these routes (sources left off — they don't matter for this rule):</p>
${K.out(`S*    0.0.0.0/0          via 10.0.0.1     (internet firewall)
S     10.64.0.0/16       via 10.0.12.2    (head office, main WAN)
S     10.64.8.0/24       via 10.0.13.2    (claims servers, via the DR site)
S     10.64.8.128/25     via 10.0.15.2    (test lab)`, "A simplified table in the shape of show ip route.")}
${K.steps([
  ["10.64.8.20", "Contained by the /0, /16 and /24; the /25 covers .128–.255 only. Longest: /24 → <b>via 10.0.13.2</b>."],
  ["10.64.8.200", "Now the /25 contains it too, and it's the longest → <b>via 10.0.15.2</b>."],
  ["10.64.99.5", "Third octet 99, so neither /24 nor /25. Left: /16 and /0 → <b>via 10.0.12.2</b>."],
  ["41.58.10.3", "Only the /0 contains it → <b>via 10.0.0.1</b>, the default."],
  ["The method", "List every route that contains the address (check bits when the length isn't /8, /16 or /24), pick the longest. Nothing else counts at this step."],
])}
${K.mistake(`Comparing AD or metric before prefix length. A RIP <code>/24</code> (AD 120) beats a static <code>/16</code> (AD 1) for an address inside the /24. AD only compares routes for <i>exactly the same prefix</i>.`)}
<h3>Ask the router: show ip route &lt;address&gt;</h3>
<p>On a live router, give <code>show ip route</code> an address and IOS does the longest-match lookup for you:</p>
${K.out(`KANO-R1#show ip route 10.40.0.10
Routing entry for 10.40.0.0/24
  Known via "ospf 1", distance 110, metric 3, type intra area
  Last update from 10.0.0.2 on GigabitEthernet0/1, 00:23:17 ago
  Routing Descriptor Blocks:
  * 10.0.0.2, from 4.4.4.4, 00:23:17 ago, via GigabitEthernet0/1
      Route metric is 3, traffic share count is 1
    10.0.0.6, from 4.4.4.4, 00:23:17 ago, via GigabitEthernet0/2
      Route metric is 3, traffic share count is 1`, "Which route wins for 10.40.0.10 on KANO-R1.")}
<ul>
<li><code>Routing entry for 10.40.0.0/24</code> — <b>the winning prefix</b>: the answer to &ldquo;which route is used?&rdquo;</li>
<li><code>Known via "ospf 1", distance 110, metric 3</code> — source, AD, metric. A static shows <code>Known via "static", distance 1, metric 0</code>.</li>
<li><code>Routing Descriptor Blocks</code> — the next hops; two blocks = two equal paths. <code>from 4.4.4.4</code> = the advertising OSPF router (lesson 3).</li>
</ul>
<p>Trap: if <i>only</i> the default matches, IOS prints <code>% Network not in table</code> (or <code>% Subnet not in table</code> when other subnets of the address's classful network are listed — the lab does the same) — yet packets are still forwarded by the default. Read the gateway-of-last-resort line before calling an address unreachable.</p>
<h3>When nothing matches</h3>
<p>No route contains the destination and there's no default? The router <b>drops the packet</b> and sends the sender an ${K.g("ICMP","Internet Control Message Protocol: IP's helper for test and error messages — echo (ping), time exceeded (traceroute), destination unreachable.")} ${K.g("Destination Unreachable","An ICMP error a router sends back when it can't deliver a packet. Its code says why: 0 'net unreachable', 1 'host unreachable', 13 'administratively prohibited'…")}. Real Cisco routers use code 1, &ldquo;host unreachable&rdquo;, even when the problem is a missing route, so Windows shows <code>Reply from 192.168.50.1: Destination host unreachable.</code> (the lab's routers do the same). The reply comes from the router that gave up, which tells you where to look. When the unreachable comes back from another router, IOS ping shows <code>U</code> and IOS traceroute shows <code>!H</code> (<code>!N</code> if a router does send code 0).</p>
<p>Why drop instead of guessing? Guessing would cause loops and leaks. A default route means nothing is dropped for lack of a route — right at an internet edge, risky inside a network, where it hides missing routes.</p>
${K.q({type:"match", q:"A router has 0.0.0.0/0 via A, 10.0.0.0/8 via B, 10.50.0.0/16 via C and 10.50.4.0/22 via D. Match each destination with the next hop used.", pairs:[["10.50.6.9","D"],["10.50.9.9","C"],["10.7.1.1","B"],["196.6.103.1","A"]], why:"10.50.4.0/22 covers 10.50.4.0–10.50.7.255 (block of 4 in the third octet), so 10.50.6.9 → D. 10.50.9.9 is outside the /22 but in the /16 → C. 10.7.1.1 is only in the /8 → B. 196.6.103.1 matches only the default → A."})}
<h3>Hands-on: one /24 moves the payroll traffic</h3>
<p>The ticket: <i>&ldquo;Ikeja branch — the new MainOne fibre through NEW-R3 is live. Payroll (<code>172.16.20.0/24</code>) must use it from today; everything else at head office stays on the old link through OLD-R2.&rdquo;</i> Today one static, <code>172.16.0.0/16</code>, sends all of head office over the old link. Move payroll — and only payroll — and prove it.</p>
${K.hint(`Each <code>tracert</code> line is a router replying from the interface the probe <i>arrived on</i>: hop 2 is <code>10.0.12.2</code> via OLD-R2 and <code>10.0.13.2</code> via NEW-R3. You don't need to remove anything — think about what a longer prefix does.`)}
${K.bench({id:"m5-longest-match", points:90, from:"CCNA · Module 5 · lesson 1", title:"one /24 moves the payroll traffic — longest match on the wire", viewBox:"0 0 960 460",
  intro:"Your console cable is already on <code>IKJ-R1</code>: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control). Use PC1's Command Prompt for <code>tracert</code> and <code>ping</code>. The head-office routers are pre-configured and need no changes.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"pc1", kind:"pc", label:"PC1 Ikeja", x:20, y:260, ip:"192.168.50.10", mask:"255.255.255.0", gw:"192.168.50.1"},
    {id:"r1", kind:"router", label:"IKJ-R1", model:"ISR 1100 · Ikeja branch", x:150, y:180, config:e=>{ ["en","conf t","hostname IKJ-R1","no ip domain-lookup","interface g0/0","description BRANCH LAN","ip address 192.168.50.1 255.255.255.0","no shutdown","interface g0/1","description OLD WAN to OLD-R2","ip address 10.0.12.1 255.255.255.252","no shutdown","interface g0/2","description MAINONE FIBRE to NEW-R3","ip address 10.0.13.1 255.255.255.252","no shutdown","exit","ip route 172.16.0.0 255.255.0.0 10.0.12.2","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"r2", kind:"router", label:"OLD-R2", model:"old WAN link", x:380, y:40, config:e=>{ ["en","conf t","hostname OLD-R2","interface g0/1","ip address 10.0.12.2 255.255.255.252","no shutdown","interface g0/2","ip address 10.0.24.1 255.255.255.252","no shutdown","exit","ip route 172.16.0.0 255.255.0.0 10.0.24.2","ip route 192.168.50.0 255.255.255.0 10.0.12.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"r3", kind:"router", label:"NEW-R3", model:"MainOne fibre", x:380, y:340, config:e=>{ ["en","conf t","hostname NEW-R3","interface g0/1","ip address 10.0.13.2 255.255.255.252","no shutdown","interface g0/2","ip address 10.0.34.1 255.255.255.252","no shutdown","exit","ip route 172.16.0.0 255.255.0.0 10.0.34.2","ip route 192.168.50.0 255.255.255.0 10.0.13.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"r4", kind:"router", label:"HQ-R4", model:"head office · Lo0 intranet 172.16.30.1", x:610, y:180, config:e=>{ ["en","conf t","hostname HQ-R4","interface g0/0","ip address 172.16.20.1 255.255.255.0","no shutdown","interface g0/1","ip address 10.0.24.2 255.255.255.252","no shutdown","interface g0/2","ip address 10.0.34.2 255.255.255.252","no shutdown","interface lo0","ip address 172.16.30.1 255.255.255.0","exit","ip route 192.168.50.0 255.255.255.0 10.0.24.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"HQ-SW", model:"payroll switch", x:610, y:350, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"pay1", kind:"server", label:"PAY-APP", x:840, y:220, ip:"172.16.20.10", mask:"255.255.255.0", gw:"172.16.20.1"},
    {id:"pay2", kind:"server", label:"PAY-DB", x:840, y:350, ip:"172.16.20.11", mask:"255.255.255.0", gw:"172.16.20.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r1:con"}, {type:"cat6", a:"pc1:eth", b:"r1:g0"}, {type:"cat6", a:"r1:g1", b:"r2:g1"}, {type:"cat6", a:"r1:g2", b:"r3:g1"}, {type:"cat6", a:"r2:g2", b:"r4:g1"}, {type:"cat6", a:"r3:g2", b:"r4:g2"},
    {type:"cat6", a:"r4:g0", b:"sw:g1"}, {type:"cat6", a:"pay1:eth", b:"sw:g2"}, {type:"cat6", a:"pay2:eth", b:"sw:g3"} ],
  tray:["cat6"],
  tasks:[
    {text:"Before changing anything: from PC1, <code>tracert 172.16.20.10</code> (PAY-APP). Which router is hop 2 today?", done:B=>Bench.traced(B,"pc1","172.16.20.10")},
    {text:"Console into IKJ-R1, <code>enable</code>, <code>show ip route</code>. Find the static that sends all of head office over the old link", done:B=>B.devs.r1.env.log.some(l=>/S\s+172\.16\.0\.0\/16 \[1\/0\] via 10\.0\.12\.2/.test(l.out||""))},
    {text:"Ask the router which route wins for payroll today: <code>show ip route 172.16.20.10</code>", done:B=>B.devs.r1.env.log.some(l=>/Routing entry for 172\.16\.0\.0\/16/.test(l.out||""))},
    {text:"Move payroll only: add a static route for the payroll /24 with next hop NEW-R3 (<code>ip route NETWORK MASK NEXT-HOP</code> in <code>configure terminal</code>)", done:B=>{ const r = Bench.route(B,"r1","172.16.20.0/24","S"); return !!r && r.via.includes("10.0.13.2"); }},
    {text:"<code>show ip route</code> again: both statics are there under a new heading, <code>172.16.0.0/16 is variably subnetted, 2 subnets, 2 masks</code>", done:B=>B.devs.r1.env.log.some(l=>/172\.16\.0\.0\/16 is variably subnetted, 2 subnets, 2 masks/.test(l.out||""))},
    {text:"<code>show ip route 172.16.20.10</code> — which prefix wins now, and via which next hop?", done:B=>B.devs.r1.env.log.some(l=>/Routing entry for 172\.16\.20\.0\/24/.test(l.out||""))},
    {text:"Prove it on the wire with the other payroll server: <code>tracert 172.16.20.11</code> (PAY-DB). Hop 2 should be NEW-R3's 10.0.13.2", done:B=>Bench.traced(B,"pc1","172.16.20.11") && Bench.routeVia(B,"r1","172.16.20.11")==="10.0.13.2"},
    {text:"Prove nothing else moved: <code>tracert 172.16.30.1</code> (the head-office intranet) still goes via OLD-R2", done:B=>Bench.traced(B,"pc1","172.16.30.1") && Bench.routeVia(B,"r1","172.16.30.1")==="10.0.12.2"},
    {text:"An address no route contains: from PC1, <code>ping 8.8.8.8</code>. Who sends <code>Destination host unreachable</code>, and why? (Check IKJ-R1's gateway-of-last-resort line.)", done:B=>Bench.tried(B,"pc1",/^\s*ping\s+8\.8\.8\.8\s*$/i)},
  ],
  win:"You moved exactly one subnet onto the new link by adding a more specific route, proved it with traceroute, and showed the /16 still carries everything else. With no route and no default, IKJ-R1 dropped the 8.8.8.8 packet and told PC1 so.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["pc","pc1","tracert 172.16.20.10"],["term","enable"],["term","show ip route"],["term","show ip route 172.16.20.10"],
    ["term","configure terminal"],["term","ip route 172.16.20.0 255.255.255.0 10.0.13.2"],["term","end"],["term","show ip route"],["term","show ip route 172.16.20.10"],
    ["pc","pc1","tracert 172.16.20.11"],["pc","pc1","tracert 172.16.30.1"],["pc","pc1","ping 8.8.8.8"]]})}
<p>What you saw: payroll moved from <code>10.0.12.2 → 10.0.24.2</code> to <code>10.0.13.2 → 10.0.34.2</code> without touching the /16 — the longer /24 wins for payroll addresses only. The 8.8.8.8 ping got <code>Reply from 192.168.50.1: Destination host unreachable.</code> (ICMP code 1, what Cisco routers send for a missing route): no route contained it and <code>Gateway of last resort is not set</code>.</p>
${K.check({q:"A router has S 10.0.0.0/8 [1/0] via 10.255.0.1 and O 10.20.0.0/16 [110/30] via 10.255.0.5. Which next hop is used for 10.20.7.7?", o:["10.255.0.1, because AD 1 beats 110","10.255.0.5, because the /16 is the longest prefix containing 10.20.7.7","Both, shared equally","Neither — conflicting routes are dropped"], a:1, why:"Different prefixes, so AD never comes into it. Longest match picks the /16."})}
<h3>Same logic, new situation</h3>
<p>An AWS route table: <code>10.8.0.0/16 → local</code>, <code>10.8.3.0/26 → firewall appliance</code>, <code>0.0.0.0/0 → internet gateway</code>. Where does traffic to <code>10.8.3.40</code> go?</p>
${K.hint(`Does a /26 starting at .0 reach .40? A /26 is a block of 64.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Which route wins for one address. <b>2. Rule:</b> longest match — cloud route tables use it too. <b>3. Apply it:</b> 10.8.3.0/26 covers .0–.63, so the /0, /16 and /26 all contain .40; the /26 is longest → <b>the firewall appliance</b>. For 10.8.3.70 the /26 no longer contains it and the /16 (local) wins.</p>`)}

<h2>Rule 2: administrative distance decides between sources</h2>
<p>Longest match chooses between <i>different</i> prefixes. What if a static and OSPF both offer <b>exactly</b> <code>10.30.1.0/24</code>? The table holds one route per prefix, so one must lose.</p>
${K.remember(`<b>The table-building rule:</b> for the <b>same prefix</b> from different sources, the route from the source with the <b>lower administrative distance</b> goes into the table. The loser stays in its own source's database, unused.`)}
<p><b>Why AD exists.</b> Protocols measure in incompatible units — OSPF cost, RIP hops, EIGRP's bandwidth-and-delay composite. &ldquo;Cost 20&rdquo; against &ldquo;2 hops&rdquo; can't be compared, so the router ranks the <i>sources</i> by trust instead: AD 0–255, <b>lower is more trusted</b>, 255 = never use. First-hand knowledge beats an engineer's instruction, which beats what protocols heard from other routers.</p>
<div class="tablewrap"><table>
<tr><th>Source</th><th>AD</th><th>Source</th><th>AD</th></tr>
<tr><td>Connected</td><td><b>0</b></td><td>OSPF</td><td><b>110</b></td></tr>
<tr><td>Static</td><td><b>1</b></td><td>${K.g("IS-IS","Intermediate System to Intermediate System: a link-state protocol like OSPF, popular with ISPs. CCNA needs only its AD.")}</td><td><b>115</b></td></tr>
<tr><td>${K.g("eBGP","External BGP: BGP between different organisations, e.g. you and your ISP.")}</td><td><b>20</b></td><td>RIP</td><td><b>120</b></td></tr>
<tr><td>EIGRP (internal)</td><td><b>90</b></td><td>EIGRP external</td><td><b>170</b></td></tr>
<tr><td>${K.g("iBGP","Internal BGP: BGP between routers inside one organisation.")}</td><td><b>200</b></td><td>Unknown / never trust</td><td><b>255</b></td></tr>
</table></div>
${K.remember(`Lowest first: <b>C</b>onnected 0, <b>S</b>tatic 1, <b>e</b>BGP 20, <b>E</b>IGRP 90, <b>O</b>SPF 110, <b>I</b>S-IS 115, <b>R</b>IP 120, <b>i</b>BGP 200 — &ldquo;<b>C</b>an <b>S</b>mall <b>E</b>lephants <b>E</b>at <b>O</b>ranges <b>I</b>n <b>R</b>ome? <b>I</b> Bet.&rdquo;`)}
<p><b>The loser waits.</b> If a static and OSPF both offer 10.30.1.0/24, <code>show ip route</code> shows <b>only</b> <code>S 10.30.1.0/24 [1/0]</code>; the OSPF route isn't listed at all. If the static goes, OSPF's route is installed within moments. So a static given a <i>higher</i> AD than the protocol makes a hidden backup — a floating static, lesson 2.</p>
${K.mistake(`Assuming that because OSPF is up, OSPF routes are in use. A forgotten static for the same prefix (AD 1) silently wins. Fingerprint: <code>S</code> where you expected <code>O</code>, and <code>Known via "static"</code> in <code>show ip route &lt;ip&gt;</code>.`)}
${K.q({type:"order", q:"Five sources all offer 10.60.0.0/24. Order them from the one installed (first) to the least trusted (last).", items:["Connected (an interface in 10.60.0.0/24)","Static route","EIGRP","OSPF","RIP"], why:"Connected 0, static 1, EIGRP 90, OSPF 110, RIP 120. Only the first is installed; the others wait in case it disappears."})}
<h3>Hands-on: a static hides OSPF</h3>
<p>Three Abuja offices of an engineering firm run OSPF — the ${K.g("dynamic routing protocol","A protocol routers use to tell each other which networks they can reach, so routes are learned and updated automatically. OSPF is configured in lessons 3–6.")} you'll study from lesson 3; for now, it learns routes and shows them as <code>O</code>. The ticket: <i>&ldquo;Since a contractor visited last night, copies from Wuse to the Garki file server are slow; the graphs show the traffic crossing Maitama, which should only carry its own office.&rdquo;</i></p>
${K.bench({id:"m5-ad-decides", points:90, from:"CCNA · Module 5 · lesson 1", title:"static versus OSPF: administrative distance picks the path", viewBox:"0 0 960 460",
  intro:"Your console cable is on <code>WUSE-R1</code>: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP (9600 8N1, no flow control). OSPF is already running on all three routers. Use PC1's Command Prompt for <code>tracert</code>.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"pc1", kind:"pc", label:"PC1 Wuse", x:20, y:270, ip:"10.10.1.10", mask:"255.255.255.0", gw:"10.10.1.1"},
    {id:"r1", kind:"router", label:"WUSE-R1", model:"ISR 1100 · Wuse", x:150, y:190, config:e=>{ ["en","conf t","hostname WUSE-R1","no ip domain-lookup","interface g0/0","description WUSE LAN","ip address 10.10.1.1 255.255.255.0","no shutdown","interface g0/1","description to MAITAMA-R2","ip address 10.0.12.1 255.255.255.252","no shutdown","interface g0/2","description to GARKI-R3","ip address 10.0.13.1 255.255.255.252","no shutdown","router ospf 1","router-id 1.1.1.1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","exit","ip route 10.30.1.0 255.255.255.0 10.0.12.2","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"r2", kind:"router", label:"MAITAMA-R2", model:"Maitama office", x:400, y:30, config:e=>{ ["en","conf t","hostname MAITAMA-R2","interface g0/0","ip address 10.20.1.1 255.255.255.0","no shutdown","interface g0/1","ip address 10.0.12.2 255.255.255.252","no shutdown","interface g0/2","ip address 10.0.23.1 255.255.255.252","no shutdown","router ospf 1","router-id 2.2.2.2","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"r3", kind:"router", label:"GARKI-R3", model:"Garki office", x:610, y:190, config:e=>{ ["en","conf t","hostname GARKI-R3","interface g0/0","ip address 10.30.1.1 255.255.255.0","no shutdown","interface g0/1","ip address 10.0.13.2 255.255.255.252","no shutdown","interface g0/2","ip address 10.0.23.2 255.255.255.252","no shutdown","router ospf 1","router-id 3.3.3.3","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"GARKI-SW", model:"server switch", x:610, y:350, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"fs1", kind:"server", label:"FILES-01", x:840, y:220, ip:"10.30.1.10", mask:"255.255.255.0", gw:"10.30.1.1"},
    {id:"fs2", kind:"server", label:"BACKUP-01", x:840, y:350, ip:"10.30.1.20", mask:"255.255.255.0", gw:"10.30.1.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"r1:con"}, {type:"cat6", a:"pc1:eth", b:"r1:g0"}, {type:"cat6", a:"r1:g1", b:"r2:g1"}, {type:"cat6", a:"r1:g2", b:"r3:g1"}, {type:"cat6", a:"r2:g2", b:"r3:g2"},
    {type:"cat6", a:"r3:g0", b:"sw:g1"}, {type:"cat6", a:"fs1:eth", b:"sw:g2"}, {type:"cat6", a:"fs2:eth", b:"sw:g3"} ],
  tray:["cat6"],
  tasks:[
    {text:"Reproduce the complaint: from PC1, <code>tracert 10.30.1.10</code> (FILES-01). Is MAITAMA-R2 (10.0.12.2) in the path?", done:B=>Bench.traced(B,"pc1","10.30.1.10")},
    {text:"Console into WUSE-R1, <code>enable</code>, <code>show ip route</code>. How does Garki's LAN, 10.30.1.0/24, appear — and from which source?", done:B=>B.devs.r1.env.log.some(l=>/S\s+10\.30\.1\.0\/24 \[1\/0\] via 10\.0\.12\.2/.test(l.out||""))},
    {text:"<code>show ip route 10.30.1.10</code> — read the source and distance. OSPF knows this /24 too: why isn't it used?", done:B=>B.devs.r1.env.log.some(l=>/Routing entry for 10\.30\.1\.0\/24\n\s+Known via "static", distance 1/.test(l.out||""))},
    {text:"Remove the contractor's route: in <code>configure terminal</code>, <code>no ip route 10.30.1.0 255.255.255.0 10.0.12.2</code> (deletes that static; lesson 2 covers it)", done:B=>!!Bench.route(B,"r1","10.30.1.0/24","O")},
    {text:"<code>show ip route 10.30.1.10</code> again — which source, distance, metric and next hop now?", done:B=>B.devs.r1.env.log.some(l=>/Routing entry for 10\.30\.1\.0\/24\n\s+Known via "ospf 1", distance 110/.test(l.out||""))},
    {text:"Prove it with the other Garki server: <code>tracert 10.30.1.20</code> (BACKUP-01). One router fewer, no 10.0.12.2", done:B=>Bench.traced(B,"pc1","10.30.1.20") && Bench.routeVia(B,"r1","10.30.1.20")==="10.0.13.2"},
    {text:"The contractor meant it as a <i>backup</i>. Put it back with a distance of 130 on the end: <code>ip route 10.30.1.0 255.255.255.0 10.0.12.2 130</code> (the last number sets this route's AD). <code>show ip route</code>: is it O or S now, and why?", done:B=>B.devs.r1.env.routes.some(r=>r.net==="10.30.1.0" && r.nh==="10.0.12.2" && +r.ad===130) && !!Bench.route(B,"r1","10.30.1.0/24","O")},
    {text:"Rule 3 preview: <code>show ip route ospf</code> — find the one prefix with two next hops on two lines, both <code>[110/2]</code>", done:B=>B.devs.r1.env.log.some(l=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+os/i.test(l.cmd||"") && /10\.0\.23\.0\/30 \[110\/2\] via 10\.0\.12\.2[^\n]*\n\s+\[110\/2\] via 10\.0\.13\.2/.test(l.out||""))},
    {text:"Save the configuration (<code>write memory</code>)", done:B=>B.devs.r1.env.savedOnce},
  ],
  win:"You found a static (AD 1) overriding a healthy OSPF route for the same prefix, removed it and watched OSPF take over, proved the shorter path, and put the static back as a hidden backup (AD 130 loses to 110). You also saw OSPF install two equal-cost paths.",
  solve:[["pc","pc1","tracert 10.30.1.10"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],["term","show ip route 10.30.1.10"],
    ["term","configure terminal"],["term","no ip route 10.30.1.0 255.255.255.0 10.0.12.2"],["term","end"],["term","show ip route 10.30.1.10"],["pc","pc1","tracert 10.30.1.20"],
    ["term","configure terminal"],["term","ip route 10.30.1.0 255.255.255.0 10.0.12.2 130"],["term","end"],["term","show ip route"],["term","show ip route ospf"],["term","write memory"]]})}
${K.hint(`The <code>no ip route</code> line must match the original: network, mask and next hop. <code>show running-config | include ip route</code> shows what's configured.`)}
<p>What happened: same prefix from two sources, so AD decided — 1 beat 110 and Garki traffic went through Maitama. Deleting the static let OSPF's <code>[110/2] via 10.0.13.2</code> in; re-adding it at 130 reversed the ranking.</p>
${K.check({q:"For 192.168.80.0/24 a router has a static with distance 150 and an OSPF route [110/45]. Which is in show ip route?", o:["The static — statics always beat dynamic routes","The OSPF route — 110 is lower than 150","Both, as equal-cost paths","Neither"], a:1, why:"Same prefix, so AD decides, and this static's AD was set to 150. OSPF's 110 wins; the static waits as a backup."})}
<h3>Same logic, new situation</h3>
<p>Mid-migration, a router runs RIP and OSPF. RIP offers <code>10.5.5.0/24</code> and <code>10.5.5.128/25</code>; OSPF offers only <code>10.5.5.0/24</code>. Which source carries traffic to <code>10.5.5.10</code>, and to <code>10.5.5.200</code>?</p>
${K.hint(`Build the table first (AD for any prefix offered twice), then apply longest match per address.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The source used for two addresses. <b>2. Rules:</b> 10.5.5.0/24 is offered twice, so AD decides (OSPF 110 beats RIP 120); the /25 comes only from RIP. The table holds <code>O 10.5.5.0/24</code> and <code>R 10.5.5.128/25</code>. Then longest match. <b>3. Apply it:</b> .10 is only in the /24 → <b>OSPF</b>. .200 is in both, and the /25 is longer → <b>RIP</b>, the less-trusted protocol. AD never compares different prefixes.</p>`)}

<h2>Rule 3: the metric decides within one source — and ties share the load</h2>
<p>One protocol can find several paths to one prefix — OSPF sees Garki's LAN directly and via Maitama. Same AD, so the protocol's own measure decides.</p>
${K.remember(`<b>Within one protocol:</b> for the same prefix, the <b>lowest metric</b> wins. Paths that tie on the lowest metric are all installed — <b>equal-cost multi-path</b> — and share the traffic.`)}
<ul>
<li><b>OSPF</b> — cost: reference bandwidth (100 Mb/s by default) ÷ interface bandwidth, minimum 1, summed along the path; a gigabit link costs 1. Lesson 6 tunes it.</li>
<li><b>RIP</b> — hop count (16 = unreachable): one slow hop beats two fast ones, so RIP is rare now.</li>
<li><b>EIGRP</b> — a composite of slowest bandwidth and total delay (numbers like 30720).</li>
<li><b>Static and connected</b> — metric 0: nothing to compare.</li>
</ul>
<p>In the bench, WUSE-R1's direct path to Garki's LAN costs 1 + 1 = <b>2</b>, via Maitama <b>3</b>: only the direct one was installed.</p>
<h3>ECMP: when paths tie</h3>
<p>The Maitama–Garki link, <code>10.0.23.0/30</code>, costs 2 from Wuse either way round. A tie, so OSPF installs both, the second on a continuation line:</p>
${K.out(`WUSE-R1#show ip route ospf
...
      10.0.0.0/8 is variably subnetted, 8 subnets, 3 masks
O        10.0.23.0/30 [110/2] via 10.0.12.2, 00:40:15, GigabitEthernet0/1
                      [110/2] via 10.0.13.2, 00:40:15, GigabitEthernet0/2
O        10.30.1.0/24 [110/2] via 10.0.13.2, 00:31:47, GigabitEthernet0/2`, "Two next hops for one prefix: same AD, same metric, both installed.")}
<p>This is ${K.g("ECMP","Equal-Cost Multi-Path: installing several equally good paths for one prefix and sharing traffic across them.")}. OSPF installs up to <b>4</b> equal paths by default (<code>show ip protocols</code>: <code>Maximum path: 4</code>). Statics do it too: two statics for one prefix with the same AD and different next hops are both installed.</p>
<p>Sharing isn't packet by packet. Cisco's forwarding engine, ${K.g("CEF","Cisco Express Forwarding: the fast forwarding engine IOS builds from the routing table. By default it load-shares per flow, by hashing source and destination addresses.")}, picks a path per <b>flow</b> (a hash of source and destination), so a conversation stays on one path and in order — and one huge transfer uses one link, however many are installed.</p>
${K.check({q:"OSPF finds three paths to 10.70.0.0/24 with costs 20, 20 and 35. What is installed?", o:["Only the cost-35 path, as a backup","The two cost-20 paths, sharing traffic","All three, shared in proportion to cost","One cost-20 path only"], a:1, why:"Lowest metric wins; two tie at 20, so both are installed as ECMP. The cost-35 path is used only if the better ones disappear."})}
<h3>Same logic, new situation</h3>
<p>A data-centre router has <code>ip route 10.90.0.0 255.255.0.0 10.0.1.2</code> and <code>ip route 10.90.0.0 255.255.0.0 10.0.2.2</code>. A developer says the nightly 400 GB copy between two servers only ever uses the link to 10.0.1.2. Broken?</p>
${K.hint(`Same prefix, same source, same AD, metric 0 — then how does CEF share a tie?`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> Why one transfer uses one of two installed paths. <b>2. Rules:</b> a tie at AD 1 / metric 0, so both statics are installed (ECMP); CEF shares per flow. <b>3. Apply it:</b> one copy between the same two servers is one flow, always hashed onto the same path. Correct behaviour — other server pairs will use the other link. A faster single transfer needs a faster link, or an application that opens several flows.</p>`)}

<h2>Putting it together: the router's decision, step by step</h2>
<p>AD and metric act <b>when routes arrive</b>, leaving one route per prefix in the table; longest match acts <b>for every packet</b>, among those prefixes. To answer a question about a packet, check them in this order:</p>
${K.svg("0 0 720 300",
  K.band(20,10,330,26,"FORWARDING — for every packet","var(--chip)")+
  K.box(20,46,330,50,"1 · Longest match","which installed prefixes contain the destination? keep the longest",true)+
  K.box(20,110,330,50,"No route contains it?","default route if one exists — else drop + ICMP unreachable")+
  K.box(20,174,330,50,"Forward","to the winning route's next hop / exit interface")+
  K.arrow(185,96,185,108)+K.arrow(185,160,185,172)+
  K.band(380,10,320,26,"BUILDING THE TABLE — when routes arrive","var(--chip)")+
  K.box(380,46,320,50,"2 · Same prefix, two sources?","lowest administrative distance wins",true)+
  K.box(380,110,320,50,"3 · Same prefix, same source?","lowest metric wins",true)+
  K.box(380,174,320,50,"Still a tie?","install all equal paths (ECMP), share per flow")+
  K.arrow(540,96,540,108)+K.arrow(540,160,540,172)+
  K.arrow(378,140,352,72,"",true)+
  K.txt(360,262,"AD and metric only ever compare routes for exactly the same prefix. Longest match compares different prefixes.",{c:"fg",s:11.5,mid:true,f:"body"})+
  K.txt(360,284,"So: check prefix length first. Only when candidates share a prefix do AD, then metric, matter.",{c:"muted",s:11,mid:true,f:"body"}),
  "Right: as routes arrive, AD then metric choose the one route per prefix that enters the table. Left: per packet, longest match picks among the prefixes in the table. In a question, check longest match first, because AD and metric never compare different prefixes.")}
${K.remember(`<b>Longest, Lowest, Least:</b> longest prefix, then lowest AD, then least metric — then share any tie.`)}
${K.exam(`Reading any &ldquo;which route is used?&rdquo; question: <b>1. What is asked?</b> Underline the destination. <b>2. Which rule?</b> List the routes that contain it. Different lengths → longest match ends it. Same prefix, different sources → AD. Same prefix, same source → metric. <b>3. Work it through</b>, watching for traps: &ldquo;lowest AD&rdquo; options when the prefixes differ; a mask hidden in an <code>is subnetted</code> heading; a <code>/25</code> or <code>/27</code> that only looks as if it contains the address; a static with a raised AD.`)}
${K.when([
  ["<code>show ip route</code>","You want every installed route, source, AD/metric and next hop","It's what the router forwards with","You care about one address — look it up instead"],
  ["<code>show ip route static | ospf | connected</code>","Checking one source: did my static install?","Hides the other sources","You need to know which source won"],
  ["<code>show ip route &lt;ip&gt;</code>","&ldquo;Which route wins for this address?&rdquo; — the first check on a reachability ticket","Does the longest-match lookup; names source, AD, metric, next hops","Only the default matches — it says <code>% Network not in table</code> (or <code>% Subnet not in table</code>)"],
  ["<code>traceroute</code> / <code>tracert</code>","You need the path actually taken across several routers","Shows what each router decided","A firewall drops the probes — walk the tables hop by hop"],
], "Which command answers which routing question")}
${K.q({type:"order", q:"A router must forward a packet to 10.4.4.4. Candidates: S 10.4.0.0/16, O 10.4.4.0/24 [110/20], O 10.4.4.0/24 [110/30] (another path), R 10.4.4.0/24 [120/2]. Put the reasoning in the order the router effectively applies it.", items:["For 10.4.4.0/24, OSPF (AD 110) beats RIP (AD 120)","Within OSPF, the [110/20] path beats [110/30]","The table now holds S 10.4.0.0/16 and O 10.4.4.0/24 [110/20]","For 10.4.4.4 the /24 is the longest match, so the OSPF route is used"], why:"AD and metric act as routes arrive, leaving one route per prefix. Then, per packet, longest match picks the /24 over the /16. The static's AD of 1 never competes with the /24 — different prefixes."})}
${K.myth([
  ["A static route always beats a dynamic route.","Only for the same prefix, and only while its AD is lower. A more specific OSPF route wins by longest match; a static at AD 130 loses to OSPF."],
  ["The router uses the lowest metric in the whole table.","Metrics compare only within one protocol, for one prefix — after prefix length and AD."],
  ["The default route is checked first because it matches everything.","It's the shortest possible match, so it loses to every other matching route."],
  ["If OSPF has learned a network, it's in show ip route.","Only if OSPF's route won. A static or connected route for the same prefix hides it."],
])}
${K.check({q:"Which statement about administrative distance is correct?", o:["AD is compared before prefix length","AD chooses only between routes to the same prefix from different sources","Higher AD means more trusted","AD is the OSPF cost"], a:1, why:"AD ranks sources, and only matters when two sources offer exactly the same prefix. Lower is more trusted; OSPF cost is a metric."})}
<h3>Same logic, new situation</h3>
<p>A Lagos edge router has <code>B 0.0.0.0/0 [20/0] via 203.0.113.1</code> from its MTN link, a static default with AD 250 towards a backup 4G router, and <code>O 41.203.64.0/19</code> from OSPF. Where do packets to <code>41.203.70.1</code> and to <code>8.8.8.8</code> go?</p>
${K.hint(`Two sources offer the default; two different prefixes contain 41.203.70.1.`)}
${K.reveal("Show the reasoning",`<p><b>1. What is asked?</b> The route for two destinations. <b>2. Rules:</b> for 0.0.0.0/0, AD decides — eBGP 20 beats 250, so the static waits. Then longest match. <b>3. Apply it:</b> 41.203.64.0/19 covers 41.203.64.0–41.203.95.255 (block of 32), so 41.203.70.1 → <b>the OSPF /19</b>. 8.8.8.8 matches only the default, and the installed default is BGP's → <b>the MTN link</b>. If BGP fails, the AD-250 static installs and traffic falls back to 4G.</p>`)}

${K.job("“Kaduna can reach email but not core banking”",`
<p><b>The ticket.</b> &ldquo;Kaduna branch: since 08:30, tellers can open email and the intranet but core banking (10.80.40.25) times out. Other branches fine.&rdquo; Priority high — customers are queueing.</p>
<p><b>Questions first.</b> &ldquo;What changed?&rdquo; — the Kaduna firewall was replaced at midnight. &ldquo;Everyone or one PC?&rdquo; — everyone. One destination broken after a change: suspect routing for <i>one</i> prefix.</p>
<p><b>Checks.</b> On the branch router, compare the broken destination with a working one:</p>
${K.out(`KAD-R1#show ip route 10.80.40.25
Routing entry for 10.80.40.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 10.0.99.2
      Route metric is 0, traffic share count is 1
KAD-R1#show ip route 10.80.1.10
Routing entry for 10.80.0.0/16
  Known via "ospf 1", distance 110, metric 3, type intra area
KAD-R1#ping 10.0.99.2
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.0.99.2, timeout is 2 seconds:
.....
Success rate is 0 percent (0/5)`, "Core banking matches a static /24 via 10.0.99.2; email matches the OSPF /16. The static's next hop — the old firewall — is silent.")}
<p>Longest match explains it: the /24 static, added years ago to steer core banking through the old firewall, beats the OSPF /16. The firewall is gone, but Gi0/2 still connects to the comms-room switch, so 10.0.99.2 still sits on an up, connected subnet and the static stays installed — pointing at nothing.</p>
<p><b>The fix.</b> Head office confirms core banking should follow OSPF now (the new firewall is in-line on that path). <code>no ip route 10.80.40.0 255.255.255.0 10.0.99.2</code>; <code>show ip route 10.80.40.25</code> now shows the OSPF /16; <code>traceroute 10.80.40.25</code> reaches the server through head office; <code>show ip route static</code> shows nothing else pointing at 10.0.99.2; <code>write memory</code>. A teller logs in.</p>
<p><b>What you say.</b> &ldquo;An old routing entry was still sending core-banking traffic to the firewall removed last night. I've taken it out, so that traffic follows the same path as everything else, and tellers are working. I've asked head office to check for routes like this in future firewall swaps.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Kaduna core banking 10.80.40.25 unreachable from 08:30. KAD-R1: static 10.80.40.0/24 via 10.0.99.2 (old firewall, removed in change 4471), next hop dead; longer than OSPF 10.80.0.0/16, so only that subnet hit. Removed with head-office approval, saved. Now via OSPF /16, traceroute OK, teller login 09:21. Suggested a 'review statics to old device' step for firewall swaps. 29 min.&rdquo;</i></p>`)}
${K.case("A bank's statics outlive its move to OSPF",`
<p>A bank with twenty branches moved from statics to OSPF: enable OSPF, check, delete the statics. OSPF came up cleanly, but the tables barely changed — every branch LAN still showed as <code>S … [1/0]</code> at head office, because AD 1 beats 110 for the same prefix. &ldquo;The routes are there&rdquo;, so the clean-up slipped.</p>
<p>Five months later a fibre cut took out the primary link to the Kano branch. OSPF rerouted over the backup within seconds — but head office's static for Kano's LAN still pointed at the head-office router on the primary link — still up and reachable in the same building, but with its link to Kano cut it had nowhere useful to send the traffic. Kano could send but not receive for three hours, until someone ran <code>show ip route 10.120.0.0</code> and saw <code>Known via "static"</code>.</p>
<p><b>Afterwards.</b> They deleted the leftover statics in one evening, checking each prefix became <code>O</code> as its <code>S</code> went, and re-added the deliberate backups with an AD above 110. New standards: <b>verify routes are <code>O</code>, not just present</b>; <b>document why every static exists</b>. A table can look healthy while the wrong source is in charge.</p>`)}
${K.dodont([
  "Start every &ldquo;can't reach X&rdquo; ticket on a router with <code>show ip route &lt;X&gt;</code>.",
  "Check the code letter, not just that a route exists: <code>S</code> where you expect <code>O</code> is a finding.",
  "Write down why each more-specific route exists — it overrides everything broader for as long as it lives.",
  "Prove a change with <code>traceroute</code> from the user's side.",
],[
  "Don't compare AD or metric between different prefix lengths, or metrics between protocols.",
  "Don't leave migration statics behind once a routing protocol takes over.",
  "Don't add a default route inside a private network &ldquo;to make it work&rdquo; — it can hide a missing route.",
  "Don't expect ECMP to speed up one big transfer.",
])}
${K.dyk(`The internet's routing table holds more than a million IPv4 prefixes, and core routers do the longest-match lookup for every packet in hardware, in nanoseconds — the rule you just applied by hand.`)}

<h2>Interview corner</h2>
${K.hint(`Three steps in order, what each compares, plus the no-match case.`)}
${K.reveal("“Walk me through how a router decides where to send a packet.”",`<p>"It looks up the destination in its routing table and uses the longest prefix that contains it — the most specific route wins, whatever its source. The table is built by two other rules: when two sources offer exactly the same prefix, the lower administrative distance wins — connected 0, static 1, EIGRP 90, OSPF 110, RIP 120 — and within one protocol the lowest metric wins, with ties installed as equal-cost paths that CEF shares per flow. No match and no default: drop and ICMP destination unreachable. I check with <code>show ip route</code> plus the address and prove the path with traceroute."</p>`)}
${K.hint(`Why it's needed (incompatible metrics), the values, and where it does and doesn't apply.`)}
${K.reveal("“What is administrative distance, and why does it exist?”",`<p>"AD is how much a router trusts a source of routes, 0 to 255, lower being more trusted. Protocols measure paths in different units — OSPF cost, RIP hops, EIGRP's composite — so when two offer the same prefix the router can't compare metrics; it ranks sources instead: connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120, iBGP 200. It only applies to identical prefixes — a more specific route from a less-trusted protocol still wins by longest match. Raising a static's distance above OSPF's makes it a backup."</p>`)}
${K.hint(`The lookup command and the forwarding engine treat the default route differently.`)}
${K.reveal("“show ip route 8.8.8.8 says '% Network not in table', but ping 8.8.8.8 from that router works. How?”",`<p>"The router has a default route. <code>show ip route</code> with an address reports the most specific match but doesn't count 0.0.0.0/0, so it says the network isn't in the table. Forwarding still uses the default, so the ping goes to the gateway of last resort. I'd confirm with the <code>Gateway of last resort</code> line, or on real kit <code>show ip cef 8.8.8.8</code> (not in the lab), which shows the forwarding entry including the default."</p>`)}

${K.recap([
  "A route = prefix (what), next hop and/or exit interface (where), source (who). Connected and local appear automatically; statics are typed; OSPF and others are learned.",
  "show ip route: legend, gateway of last resort, classful headings ('is subnetted' = one mask in the heading, rows without length; 'variably subnetted' = rows keep their length), [AD/metric], via, age, interface; indented lines are equal-cost paths.",
  "Rule 1, per packet: the longest matching prefix wins, whatever the source. The /0 default is used only when nothing else matches.",
  "Rule 2, same prefix from different sources: lowest AD is installed — connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, IS-IS 115, RIP 120, iBGP 200. The loser waits.",
  "Rule 3, same prefix within one protocol: lowest metric wins; ties are installed together (ECMP, 4 for OSPF by default) and CEF shares them per flow.",
  "No match, no default: drop and ICMP Destination Unreachable (Cisco: 'host unreachable'), sent by the router with the missing route.",
  "show ip route <address> asks which route wins ('% Network not in table' or '% Subnet not in table' if only the default matches); traceroute proves the real path.",
])}
${K.next(`<b>Lesson 2 — Static routes.</b> You've added and removed a few. Next, build them properly: next-hop, exit-interface and fully specified statics, default, host and floating routes, and the recursive lookup that turns a next hop into an exit interface — with the faults each form can hide.`)}
`,
quiz:[
  {lvl:1, q:"In show ip route, what does a route with the code L represent?", o:["A route learned from a neighbour over a LAN","A /32 route for the router's own interface address, added automatically with each connected route","A static route configured with a local exit interface","A route learned by RIP"], a:1, why:"L means local: the router's own interface address as a /32, so traffic addressed to the router itself is delivered to its CPU. Every up/up interface with an address gets a C route for its subnet and an L route for its own address."},
  {lvl:1, type:"match", q:"Match each route source with its default administrative distance on Cisco IOS.", pairs:[["Connected interface","0"],["Static route","1"],["eBGP","20"],["EIGRP (internal)","90"],["OSPF","110"],["RIP","120"]], why:"Lower AD is more trusted: connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, (IS-IS 115), RIP 120, (iBGP 200)."},
  {lvl:2, q:"Based on the exhibit, which next hop does R1 use for a packet to 10.20.30.40?", ex:"R1#show ip route\n...\nGateway of last resort is 10.255.0.9 to network 0.0.0.0\n\nS*    0.0.0.0/0 [1/0] via 10.255.0.9\n      10.0.0.0/8 is variably subnetted, 5 subnets, 4 masks\nS        10.0.0.0/8 [1/0] via 10.255.0.1\nO        10.20.0.0/16 [110/12] via 10.255.0.5, 00:12:44, GigabitEthernet0/0\nR        10.20.30.0/24 [120/3] via 10.255.0.13, 00:00:21, GigabitEthernet0/0\nC        10.255.0.0/24 is directly connected, GigabitEthernet0/0\nL        10.255.0.2/32 is directly connected, GigabitEthernet0/0", o:["10.255.0.1, because static routes have the lowest AD","10.255.0.5, because OSPF is more trusted than RIP","10.255.0.13, because 10.20.30.0/24 is the longest prefix that contains the address","10.255.0.9, the gateway of last resort"], a:2, why:"Four routes contain 10.20.30.40: the /0, the /8, the /16 and the /24. They are all different prefixes, so AD never applies; the longest, the RIP /24, wins."},
  {lvl:2, q:"A router learns 192.168.5.0/24 from OSPF with metric 20 and from EIGRP with metric 3072. Which route is installed, and why?", o:["OSPF, because 20 is a lower metric than 3072","EIGRP, because its administrative distance (90) is lower than OSPF's (110)","Both, as equal-cost paths","OSPF, because link-state protocols are always preferred"], a:1, why:"Same prefix from two sources, so AD decides; metrics from different protocols can't be compared. EIGRP's 90 beats OSPF's 110."},
  {lvl:2, type:"multi", q:"A router's table contains the heading '172.31.0.0/24 is subnetted, 2 subnets' with the rows 'S 172.31.5.0 [1/0] via 10.0.0.2' and 'S 172.31.6.0 [1/0] via 10.0.0.6'. Which two statements are true? (Choose two.)", o:["Both routes are /24s — the mask is printed once in the heading","The router has a route for 172.31.0.0/24 that it forwards with","Both routes have an administrative distance of 1 and a metric of 0","The two routes are equal-cost paths to the same network","The routes have no mask, so they match any 172.31 address"], a:[0,2], why:"Under an 'is subnetted' heading every row uses the heading's mask, so these are 172.31.5.0/24 and 172.31.6.0/24. [1/0] means AD 1 (static) and metric 0. The heading isn't a route, and they are two different prefixes, not ECMP."},
  {lvl:1, type:"order", q:"Put the questions in the order you apply them to decide which route a packet will follow.", items:["Which routes contain the destination? Keep the longest prefix","If two sources offered that same prefix, which has the lower AD?","If one source has several paths for it, which has the lowest metric?","If paths still tie, install them all and share the traffic (ECMP)"], why:"Longest match always comes first, because AD and metric only compare routes for exactly the same prefix. AD ranks sources; the metric ranks paths within one source; ties become ECMP."},
  {lvl:1, type:"fill", q:"Which privileged EXEC command asks the router which route it will use for the address 10.9.9.9?", fields:[{label:"Command", a:["show ip route 10.9.9.9"], ios:true}], why:"show ip route followed by an address runs the longest-match lookup and prints 'Routing entry for <prefix>', the source, AD, metric and next hops. If only the default route matches, it prints '% Network not in table' ('% Subnet not in table' if it knows other subnets of that classful network)."},
  {lvl:2, type:"fill", q:"Read this line: R 10.6.0.0/16 [120/4] via 10.1.1.2, 00:00:17, GigabitEthernet0/3. Fill in the values.", fields:[{label:"Administrative distance", a:["120"]},{label:"Metric (hop count)", a:["4"]},{label:"Next hop", a:["10.1.1.2"]}], why:"[AD/metric] is [120/4]: RIP's AD is 120 and its metric is the hop count, 4. 'via' gives the next hop, 10.1.1.2; 00:00:17 is the age and Gi0/3 the exit interface."},
  {lvl:2, q:"A router has no route that contains 203.0.113.50 and its table says 'Gateway of last resort is not set'. A PC behind it pings 203.0.113.50. What happens?", o:["The router floods the packet out of every interface","The router sends it out of the interface with the lowest metric","The router drops the packet and sends the PC an ICMP Destination Unreachable, so the PC shows 'Reply from <router>: Destination host unreachable.' (or 'net unreachable', depending on the code the router uses)","The router queues the packet until a route appears"], a:2, why:"No matching route and no default means drop and report. The reply comes from the router that gave up, which tells you where the route is missing."},
  {lvl:3, q:"Port Harcourt branch: since a change last night, staff reach every head-office server except the CCTV recorders in 10.60.12.0/24. Based on the exhibit from the branch router, what is the most likely cause?", ex:"PH-R1#show ip route 10.60.12.40\nRouting entry for 10.60.12.0/24\n  Known via \"static\", distance 1, metric 0\n  Routing Descriptor Blocks:\n  * 10.0.50.2\n      Route metric is 0, traffic share count is 1\nPH-R1#show ip route 10.60.1.10\nRouting entry for 10.60.0.0/16\n  Known via \"ospf 1\", distance 110, metric 4, type intra area\nPH-R1#traceroute 10.60.12.40\nType escape sequence to abort.\nTracing the route to 10.60.12.40\nVRF info: (vrf in name/id, vrf out name/id)\n  1 10.0.50.2 !H  !H  !H", o:["OSPF has failed, so the branch has no route to head office","A static /24 for the CCTV subnet is the longest match and sends that traffic to 10.0.50.2, which answers but has no route onward (!H)","10.0.50.2 is powered off","The CCTV recorders have the wrong default gateway"], a:1, why:"OSPF is healthy: 10.60.1.10 matches the OSPF /16. For 10.60.12.x the static /24 is longer, so it wins and sends the traffic to 10.0.50.2. That device is alive — it replies to the traceroute — but with !H, the unreachable a Cisco router sends when it has no route: it has no route to 10.60.12.0/24. Fix or remove the static and the /16 carries that subnet too."},
  {lvl:3, q:"Two servers copy 400 GB every night. The router has 'O 10.90.0.0/16 [110/3] via 10.0.1.2' and '[110/3] via 10.0.2.2' on a continuation line. Monitoring shows the copy uses only the link to 10.0.1.2. What is the best explanation?", o:["The second path is a backup and will only be used if the first fails","OSPF only installs one path; the second line is cosmetic","Both paths are installed (ECMP), but CEF shares per flow, so one conversation between the same two hosts always hashes onto one path","The link to 10.0.2.2 must be down"], a:2, why:"Equal metric, so both paths are installed. CEF's default per-flow sharing (hash of source and destination) keeps one conversation on one path to avoid reordering. Many flows spread across both links; one big flow does not."},
  {lvl:3, type:"multi", q:"R1 has S 10.1.0.0/16 [1/0] via 10.0.0.1 (towards router A) and O 10.1.1.0/24 [110/20] via 10.0.0.5 (towards router B). Which two destinations are forwarded towards router B? (Choose two.)", o:["10.1.1.1","10.1.2.1","10.1.1.254","10.1.0.1","10.2.1.1"], a:[0,2], why:"Only addresses inside 10.1.1.0/24 match the longer OSPF route, so 10.1.1.1 and 10.1.1.254 go to B despite the static's lower AD. 10.1.2.1 and 10.1.0.1 match only the /16 (router A). 10.2.1.1 matches neither."},
  {lvl:2, q:"On a router, 'show ip route 8.8.8.8' returns '% Network not in table', yet 'ping 8.8.8.8' from the router succeeds. Why?", o:["The ping uses the routing table of the next router","The router has a default route; the lookup command doesn't report 0.0.0.0/0 as a match, but forwarding uses it","8.8.8.8 is a local route","show ip route only lists static routes"], a:1, why:"IOS's show ip route <address> reports the most specific matching route and ignores the default. Packets still follow the gateway of last resort. Check the 'Gateway of last resort' line, or show ip cef 8.8.8.8 on real kit."},
  {lvl:3, q:"A static 'ip route 192.168.40.0 255.255.255.0 10.1.1.6' was added so a slow MPLS link could back up the OSPF-learned path to 192.168.40.0/24. Since then, all traffic to that subnet crosses the MPLS link even though OSPF is healthy. Which change keeps the static as a backup and lets OSPF carry the traffic?", o:["Re-enter the static with a distance of 100","Re-enter the static with a distance of 120","Change the static to 192.168.40.0/23 so it is more specific","Lower the OSPF cost on the primary path"], a:1, why:"Same prefix, so AD decides, and a static's default AD of 1 beats OSPF's 110. The backup's AD must be higher than 110, so 120 works and 100 does not. A /23 is less specific, not more, and would change which addresses it covers; OSPF cost never competes with a static."},
  {lvl:1, q:"In the route 'O 10.30.1.0/24 [110/2] via 10.0.13.2, 00:31:47, GigabitEthernet0/2', what does 00:31:47 tell you?", o:["The round-trip time to the next hop","How long ago the route was learned or last changed","The OSPF hello timer","When the route will expire"], a:1, why:"The timestamp is the route's age: 31 minutes 47 seconds since OSPF learned or last updated it. A very young route in a stable network suggests something just changed."},
  {lvl:2, q:"show ip route shows the heading '10.0.0.0/8 is variably subnetted, 6 subnets, 3 masks'. What does it mean?", o:["There is a route for 10.0.0.0/8 with six next hops","Six routes inside the classful network 10.0.0.0 are listed below, using three different prefix lengths, so each row shows its own length","The router has six interfaces in 10.0.0.0/8","Three routing protocols have learned 10.0.0.0/8"], a:1, why:"Headings group routes by their classful network and are not routes themselves. 'Variably subnetted' means more than one mask, so each row prints its own /length; 'is subnetted' would mean one mask, printed in the heading."},
],
cards:[
  {f:"The three parts of a route", b:"Prefix (what it reaches, e.g. 10.30.1.0/24), where to send it (next hop and/or exit interface), and the source (connected, static, OSPF…)."},
  {f:"C and L routes", b:"Added automatically for every up/up interface with an IP: C = the connected subnet, L = the router's own address as a /32 (deliver to me). They vanish if the interface goes down."},
  {f:"Gateway of last resort", b:"The next hop of the default route 0.0.0.0/0. 'Gateway of last resort is not set' means no default route: unmatched packets are dropped."},
  {f:"'is subnetted' vs 'variably subnetted'", b:"Classful headings. 'is subnetted, N subnets' = one mask, shown in the heading, rows print no length. 'variably subnetted, N subnets, M masks' = several masks, each row shows its length."},
  {f:"Reading [110/2]", b:"[administrative distance / metric]. 110 = OSPF's AD; 2 = OSPF cost. Statics show [1/0]."},
  {f:"Rule 1: longest match", b:"For each packet, of all routes that contain the destination, the longest prefix wins — whatever its source. /0 (default) is the shortest match."},
  {f:"Rule 2: administrative distance", b:"Same prefix from different sources: lowest AD goes into the table. AD never compares different prefixes."},
  {f:"Default ADs", b:"Connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, IS-IS 115, RIP 120, EIGRP external 170, iBGP 200. 255 = never used. 'Can Small Elephants Eat Oranges In Rome? I Bet.'"},
  {f:"Rule 3: metric and ECMP", b:"Same prefix, same protocol: lowest metric wins. Ties are all installed (ECMP; OSPF 4 paths by default) and CEF shares them per flow."},
  {f:"Why AD exists", b:"Protocols use incompatible metrics (OSPF cost, RIP hops, EIGRP composite), so the router ranks sources by trust instead of comparing metrics."},
  {f:"show ip route <address>", b:"Runs the longest-match lookup: 'Routing entry for <winning prefix>', Known via <source>, distance, metric, next hops. Says '% Network not in table' (or '% Subnet not in table' when other subnets of that classful network are listed) if only the default matches."},
  {f:"No matching route, no default", b:"The router drops the packet and sends ICMP Destination Unreachable — Cisco (and the lab) use code 1, host unreachable. Windows: 'Reply from <router>: Destination host unreachable.' IOS ping: U. IOS traceroute: !H (!N if a router sends code 0, net unreachable)."},
  {f:"Static hides OSPF — fingerprint", b:"S where you expected O, and show ip route <ip> says Known via \"static\", distance 1. Remove it, or give it an AD above 110 so it floats behind OSPF."},
],
});
// ---------- Module 5 · Lesson 2 ----------
L.push({
id:"static-routes", mins:85, level:"Beginner+ · builds on Modules 2–4 and lesson 1",
t:"Static routes: next hop, exit interface, default, host and floating routes — and recursive lookups",
html:`
${K.goals([
  "Decide when a static route is the right tool and when a dynamic routing protocol is.",
  "Write network, host, default and floating static routes, and say why a next hop matters on Ethernet.",
  "Follow a recursive lookup and predict when IOS installs a static route and when it quietly withdraws it.",
  "Find and fix a missing return route or a mistyped mask or next hop, and read IOS's static-route errors.",
  "Build a primary link with a floating static backup and prove the failover with <code>show ip route</code> and traceroute.",
])}
${K.pre(["Lesson 1 of this module: reading <code>show ip route</code>, longest match and administrative distance. Module 3: subnets, masks, the default gateway and &ldquo;Destination host unreachable&rdquo;. Module 2: ARP and proxy ARP. Global configuration mode and <code>copy running-config startup-config</code> should feel routine."])}

<h2>Why this matters at work</h2>
<p>A microfinance bank has its head office in Abuja and twelve branches across the north. Each branch has one router, one LAN and one link back to head office, where the core banking servers and the internet connection live. Nobody runs a routing protocol at the branches, and nobody needs to. Each branch router has one line that says &ldquo;anything that isn't local, send it to head office&rdquo;; head office has one line per branch that says how to get back.</p>
<p>Those lines are ${K.g("static routes","Routes typed into a router by hand. The router never changes them; it only installs or withdraws them as its interfaces and routes come and go.")}. They are the first routes you'll configure and a steady source of tickets: a new branch that &ldquo;can't reach anything&rdquo; because head office has no route back, a mask one bit wrong, a backup that never takes over. You'll learn to write them, predict when they're used, and troubleshoot them from the symptoms.</p>

<h2>Static or dynamic? When a static route is the right tool</h2>
<p>Connected and local routes appear in the routing table (the ${K.g("RIB","Routing Information Base: the router's routing table.")}, lesson 1) by themselves. For any other network, either <b>you type the route</b> (static) or <b>routers tell each other</b> with a ${K.g("dynamic routing protocol","Routers exchange the networks they know and calculate best paths themselves, recalculating on failures. CCNA tests OSPF (lessons 3–6).")} such as OSPF.</p>
${K.remember(`<b>The decision rule.</b> Use a <b>static route</b> when there is only one sensible way out, when you want a fixed path that never changes on its own, or as a backup. Use a <b>dynamic protocol</b> when there are several paths that can fail, or more networks than you can keep correct by hand.`)}
<p><b>Why that rule?</b> A static route costs nothing — no CPU, no bandwidth, no protocol to attack — and does exactly what you wrote. But it is blind: it knows only whether <i>this router's</i> interface is up and its next hop reachable. It can't learn that a link three routers away has failed, and every new network means a new line on every router that needs it, in both directions.</p>
${K.analogy(`<p>A static route is a note on the dashboard: &ldquo;To Kano: take the A2 north.&rdquo; Perfect while there is one road. A dynamic protocol is a sat-nav hearing traffic reports: it reroutes you around the crash. A commuter doesn't need the sat-nav; a courier criss-crossing Lagos does.</p>`)}
${K.when([
  ["Static network route","A few networks reached one way, e.g. HQ back to each branch","Zero overhead, predictable","Paths should reroute by themselves"],
  ["Static default route","A "+K.g("stub network","A network with only one way in and out, such as a branch with a single link to head office.")+" branch, or the edge towards the "+K.g("ISP","Internet Service Provider — MainOne, MTN, Airtel or a local fibre company."),"One line covers every destination","The router has several exits to choose between"],
  ["Floating static route","A backup link behind a static or OSPF route","Hidden until the primary disappears","The failure leaves your interface up (case study)"],
  ["Dynamic routing (OSPF)","Alternative paths; networks added often","Reroutes by itself","A single stub link"],
])}
${K.check({q:"A branch has one router, one LAN and a single link to head office. Everything it uses is at head office or on the internet beyond. What is the simplest correct design for the branch router?", o:["Run OSPF so it learns every head-office network","One static default route pointing at head office's end of the link","A static route for every head-office subnet plus one for the internet","No routes — connected routes are enough"], a:1, why:"A stub: every non-local destination leaves by the same link, so one default covers them all. OSPF adds nothing without a second path."})}
${K.hint(`Ask of each router: how many ways out does it have?`)}
${K.reveal("Same logic, new situation — a pharmacy chain in Port Harcourt",`<p>40 shops each have one router and one 4G link to head office. Head office has three core routers in a triangle and two ISPs. Which routers get statics, which run OSPF?</p>
<p><b>1. Asked:</b> static or dynamic, per router. <b>2. Rule:</b> one way out → static; several paths that can fail → dynamic. <b>3. Apply:</b> each shop has one way out → a static default. The core triangle gives every pair two paths → OSPF. The core still needs routes back to the shop LANs. Each ISP edge gets a static default — one of them floating, as you'll build later.</p>`)}

<h2>Writing a static route: next hop, exit interface or both</h2>
<p>You typed simple statics in lesson 1 (network, mask, next hop). Here is the whole command — one global configuration command in three forms:</p>
${K.out(`ip route <network> <mask> <next-hop-address>
ip route <network> <mask> <exit-interface>
ip route <network> <mask> <exit-interface> <next-hop-address>
                                     ... optionally followed by [distance]`, "The network and mask say which destinations the route is for; the rest says where to send them. A number at the end is the administrative distance — used for floating routes.")}
<p>The worked example for this lesson: HQ-RTR has the HQ LAN, <code>10.1.10.0/24</code>, on G0/0 and a /30 link to BR-RTR on G0/1. The branch LAN, <code>10.1.50.0/24</code>, is behind BR-RTR.</p>
${K.svg("0 0 760 290",
  K.dev("pc",60,70,"HQ LAN","10.1.10.0/24")+K.link(84,70,192,70,"G0/0 .1")+
  K.dev("router",220,70,"HQ-RTR","")+K.link(246,70,514,70,"10.1.255.0/30")+K.txt(262,58,"G0/1 .1",{c:"accent"})+K.txt(498,58,"G0/1 .2",{c:"accent",end:true})+
  K.dev("router",540,70,"BR-RTR","")+K.link(566,70,676,70,"G0/0 .1")+K.dev("pc",700,70,"BRANCH LAN","10.1.50.0/24")+
  K.band(20,148,720,24,"On HQ-RTR, three ways to say &quot;10.1.50.0/24 is that way&quot;")+
  K.txt(30,196,"ip route 10.1.50.0 255.255.255.0 10.1.255.2",{c:"fg",s:11.5})+K.txt(400,196,"next hop — HQ-RTR must look up 10.1.255.2 to find G0/1",{s:10.5})+
  K.txt(30,226,"ip route 10.1.50.0 255.255.255.0 g0/1",{c:"fg",s:11.5})+K.txt(400,226,"exit interface — HQ-RTR ARPs for every destination",{c:"warn",s:10.5})+
  K.txt(30,256,"ip route 10.1.50.0 255.255.255.0 g0/1 10.1.255.2",{c:"fg",s:11.5})+K.txt(400,256,"fully specified — out G0/1, to 10.1.255.2",{c:"ok",s:10.5}),
  "HQ-RTR and BR-RTR joined by a /30. All three commands send branch traffic out of G0/1 — but they make HQ-RTR do different work.")}
<p>Each form appears differently in <code>show ip route static</code>, which lists only the static routes (you would configure only one form):</p>
${K.out(`S        10.1.50.0/24 [1/0] via 10.1.255.2
S        10.1.50.0/24 is directly connected, GigabitEthernet0/1
S        10.1.50.0/24 [1/0] via 10.1.255.2, GigabitEthernet0/1`, "Next hop, exit interface, fully specified. S = static; [1/0] = administrative distance 1, metric 0, for all three.")}
<h3>Form 1 — next hop, and the recursive lookup</h3>
<p>The ${K.g("next hop","The IP address of the next router on the path — the neighbour you hand the packet to, normally on a directly connected network.")} is the neighbour's address, BR-RTR's <code>10.1.255.2</code>. It's the most common form, and it hides a piece of logic: the route says <i>who</i> to send to, not <i>which interface</i>. So the router looks again — a ${K.g("recursive lookup","Looking up a route's next hop in the routing table again to find how to reach it, repeating until a connected route gives the exit interface.")}.</p>
${K.steps([
  ["First lookup: the destination", "A packet for <code>10.1.50.21</code> matches <code>S 10.1.50.0/24 via 10.1.255.2</code>. That's an address, not an interface — keep going."],
  ["Second lookup: the next hop", "<code>10.1.255.2</code> matches <code>C 10.1.255.0/30 … GigabitEthernet0/1</code>. Connected: now there is an exit interface."],
  ["Forward", "ARP for <code>10.1.255.2</code> on G0/1 (once, then cached) and send the frame to BR-RTR's MAC."],
])}
<p>Recursion can go deeper. A branch firewall at <code>10.1.50.254</code> hides a lab, <code>172.20.0.0/16</code>. With <code>ip route 172.20.0.0 255.255.0.0 10.1.50.254</code> on HQ-RTR, a packet for <code>172.20.4.4</code> takes three lookups: the /16 → <code>10.1.50.254</code> → the static <code>10.1.50.0/24</code> via <code>10.1.255.2</code> → connected G0/1.</p>
${K.dyk(`Old textbooks call recursive lookups &ldquo;slow&rdquo;. Modern routers' ${K.g("CEF","Cisco Express Forwarding: the IOS forwarding engine, which pre-builds a forwarding table with each route's exit interface and next-hop MAC resolved.")} works the recursion out once, in advance. What still matters is <b>dependency</b>: a recursive route lives only as long as every route it leans on.`)}
<h3>Form 2 — exit interface only, and why it leans on proxy ARP</h3>
<p>Naming only the ${K.g("exit interface","The router's own interface that the packet is sent out of.")} is fine on a point-to-point serial link: one device at the other end, no ARP. On <b>Ethernet</b> the router now believes the whole destination network is directly connected to G0/1, so it ARPs for each final destination. In the bench simulator, a PC at HQ pings <code>10.1.50.21</code>:</p>
${K.out(`ARP request (broadcast to ffff.ffff.ffff) from HQ-RTR: "Who has 10.1.50.21? Tell 10.1.255.1"
Proxy ARP reply (unicast) from BR-RTR Gi0/1: "10.1.50.21 is at 0050.4f2b.0002"

HQ-RTR#show ip arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  10.1.10.1        -          0050.503a.0001  ARPA   GigabitEthernet0/0
Internet  10.1.255.1       -          0050.503a.0002  ARPA   GigabitEthernet0/1
Internet  10.1.10.11       0          0050.e40c.292c  ARPA   GigabitEthernet0/0
Internet  10.1.50.21       0          0050.4f2b.0002  ARPA   GigabitEthernet0/1`, "Two lines from the frame log (shortened), then the ARP table. HQ-RTR ARPs for the branch PC itself, and BR-RTR answers with its own MAC. Note the ARP entry for a host that isn't on any of HQ-RTR's subnets.")}
<p>${K.g("Proxy ARP","A router answering ARP for an address it can route out of another interface, with its own MAC. On by default on Cisco routers (Module 2).")} is rescuing a weak configuration. The costs: an ARP entry per destination (a default route would ARP for the whole internet), unpredictable results when several routers share the segment, and total failure where proxy ARP is off — common in security baselines and at ISPs. With <code>no ip proxy-arp</code> on BR-RTR the log ends <i>&ldquo;No device answered&rdquo;</i>, and the PC times out with the route in the table.</p>
<h3>Form 3 — fully specified</h3>
<p>A ${K.g("fully specified static route","A static route naming both the exit interface and the next hop, e.g. ip route 10.1.50.0 255.255.255.0 g0/1 10.1.255.2.")} names both: no recursive lookup for the exit, ARP only for the next hop, and the route is tied to that interface — if G0/1 goes down, the route goes with it.</p>
${K.remember(`<b>On Ethernet, always give the next hop.</b> Next hop alone is fine and common; make it fully specified when the route must follow one particular link. Exit interface alone belongs on point-to-point serial links.`)}
${K.mistake(`<code>ip route 0.0.0.0 0.0.0.0 g0/2</code> towards the ISP. The router ARPs for every internet address, the ISP has proxy ARP off, and &ldquo;the internet is down&rdquo; with the route sitting in the table. Write <code>ip route 0.0.0.0 0.0.0.0 198.51.100.1</code> — the ISP's address.`)}
<h3>What IOS refuses</h3>
${K.out(`HQ-RTR(config)#ip route 10.1.50.1 255.255.255.0 10.1.255.2
%Inconsistent address and mask
HQ-RTR(config)#ip route 10.1.50.0 255.255.255.0 10.1.255.1
%Invalid next hop address (it's this router)
HQ-RTR(config)#ip route 10.1.50.0 255.255.255.0
% Incomplete command.
HQ-RTR(config)#ip route 10.1.50.0 255.255.255.0 10.1.255.2
HQ-RTR(config)#`, "Three refusals, then the correct command, accepted silently.")}
<p><b><code>%Inconsistent address and mask</code></b>: the address has host bits set — <code>10.1.50.1/24</code> is a host, not a network. Work out the network address (Module 3), <code>10.1.50.0</code>, and retype. <b><code>%Invalid next hop address (it's this router)</code></b>: the next hop is one of HQ-RTR's own addresses; it must be the <i>other</i> router's address on the shared link. What IOS does <i>not</i> check is whether you meant that network, mask or neighbour: <code>ip route 10.1.5.0 255.255.255.0 10.1.255.2</code> is accepted happily.</p>
<h3>Try it yourself: the Abuja edge router</h3>
<p>A different router: ABJ-EDGE, an Abuja office's internet edge. G0/0 (<code>10.20.0.1/24</code>) faces CORE-SW (<code>.2</code>) and a monitoring router (<code>.3</code>); G0/1 (<code>203.0.113.2/30</code>) the ISP (<code>.1</code>); G0/2 (<code>10.20.9.1/30</code>) an ${K.g("LTE","Long Term Evolution: 4G mobile data. An LTE router is a small router with a SIM card, often used as a backup link.")} backup router (<code>.2</code>). Two tasks come from a contractor's notes with mistakes: read IOS's reply and correct them.</p>
${K.hint(`For the /20 task: a /20 mask is 255.255.240.0, so the third octet moves in blocks of 16 (0, 16, 32 …). Which block does 18 fall in? For the next-hop task: who owns 10.20.0.1? For the backup, the distance goes at the very end of the line.`)}
${K.term({env:"ios2", title:"static routes on ABJ-EDGE", opts:{kind:"router", host:"ABJ-EDGE", model:"ISR 4331", motd:"ABJ-EDGE — Abuja office internet edge. G0/0 core LAN 10.20.0.0/24 · G0/1 ISP 203.0.113.0/30 · G0/2 LTE backup 10.20.9.0/30."},
  setup:e=>{ ["enable","configure terminal","hostname ABJ-EDGE","interface g0/0","ip address 10.20.0.1 255.255.255.0","no shutdown","interface g0/1","ip address 203.0.113.2 255.255.255.252","no shutdown","interface g0/2","ip address 10.20.9.1 255.255.255.252","no shutdown","end","disable"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; },
  intro:"Start with <code>enable</code> and <code>configure terminal</code>. You can check your work at any time with <code>do show ip route static</code>.",
  tasks:[
    {text:"Default route to the ISP: everything unknown goes to next hop <code>203.0.113.1</code>", done:e=>e.routes.some(r=>r.net==="0.0.0.0" && r.mask==="0.0.0.0" && r.nh==="203.0.113.1" && !r.ios && (!r.ad || r.ad===1))},
    {text:"The staff networks 10.20.16.0 – 10.20.31.255 are behind CORE-SW. The contractor's note says <code>ip route 10.20.18.0 255.255.240.0 10.20.0.2</code>: type it, read the error, then enter the route with the correct network address", done:e=>e.log.some(l=>/%Inconsistent address and mask/.test(l.out)) && e.routes.some(r=>r.net==="10.20.16.0" && r.mask==="255.255.240.0" && r.nh==="10.20.0.2")},
    {text:"The monitoring server <code>10.30.5.10</code> (one address only) is reached through the monitoring router <code>10.20.0.3</code>: add a host route", done:e=>e.routes.some(r=>r.net==="10.30.5.10" && r.mask==="255.255.255.255" && r.nh==="10.20.0.3")},
    {text:"The partner extranet <code>192.168.200.0/24</code> is behind CORE-SW: add it <b>fully specified</b> (exit interface G0/0 and next hop 10.20.0.2)", done:e=>e.routes.some(r=>r.net==="192.168.200.0" && r.mask==="255.255.255.0" && r.ios==="GigabitEthernet0/0" && r.nh==="10.20.0.2")},
    {text:"A colleague wrote <code>ip route 10.40.0.0 255.255.0.0 10.20.0.1</code> for the lab network behind CORE-SW. Type it, read IOS's answer, then enter it correctly", done:e=>e.log.some(l=>/it's this router/.test(l.out)) && e.routes.some(r=>r.net==="10.40.0.0" && r.mask==="255.255.0.0" && r.nh==="10.20.0.2")},
    {text:"Backup internet through the LTE router <code>10.20.9.2</code>: add a second default route with administrative distance <code>250</code>, so it waits in reserve", done:e=>e.routes.some(r=>r.net==="0.0.0.0" && r.nh==="10.20.9.2" && r.ad===250)},
    {text:"<code>show ip route static</code>: the gateway of last resort is the ISP, and the LTE default is <i>not</i> listed — it is floating", done:e=>e.routes.some(r=>r.nh==="10.20.9.2" && r.ad===250) && e.log.some(l=>/Gateway of last resort is 203\.0\.113\.1/.test(l.out) && !/\[250\/0\]/.test(l.out))},
    {text:"Save the configuration", done:e=>e.savedOnce},
  ],
  win:"You wrote every kind of static route — default, network (a /20 summary), host, fully specified and floating — and let IOS catch two classic typos: a network address with host bits set, and a next hop that was the router itself.",
  solve:["enable","configure terminal","ip route 0.0.0.0 0.0.0.0 203.0.113.1","ip route 10.20.18.0 255.255.240.0 10.20.0.2","ip route 10.20.16.0 255.255.240.0 10.20.0.2","ip route 10.30.5.10 255.255.255.255 10.20.0.3","ip route 192.168.200.0 255.255.255.0 GigabitEthernet0/0 10.20.0.2","ip route 10.40.0.0 255.255.0.0 10.20.0.1","ip route 10.40.0.0 255.255.0.0 10.20.0.2","ip route 0.0.0.0 0.0.0.0 10.20.9.2 250","end","show ip route static","copy running-config startup-config",""]})}
${K.check({q:"On a router whose G0/1 (10.8.1.1/30) connects over Ethernet to a neighbour at 10.8.1.2, which static route to 10.60.0.0/16 is the best choice?", o:["ip route 10.60.0.0 255.255.0.0 GigabitEthernet0/1","ip route 10.60.0.0 255.255.0.0 GigabitEthernet0/1 10.8.1.2","ip route 10.60.0.0 255.255.0.0 10.8.1.1","ip route 10.60.1.0 255.255.0.0 10.8.1.2"], a:1, why:"Fully specified: ARP only for 10.8.1.2. Exit-interface-only relies on proxy ARP; 10.8.1.1 is the router itself; 10.60.1.0 /16 has host bits set."})}
${K.q({type:"fill", q:"Same logic, new situation: router CHI-R2's G0/2 (10.8.4.1/29) connects to a firewall at 10.8.4.6, which hides 192.168.77.0/24. Write the fully specified static route on CHI-R2.", fields:[{label:"Command", a:["ip route 192.168.77.0 255.255.255.0 GigabitEthernet0/2 10.8.4.6","ip route 192.168.77.0 255.255.255.0 g0/2 10.8.4.6","ip route 192.168.77.0 255.255.255.0 gi0/2 10.8.4.6","ip route 192.168.77.0 255.255.255.0 gig0/2 10.8.4.6","ip route 192.168.77.0 255.255.255.0 gi 0/2 10.8.4.6","ip route 192.168.77.0 255.255.255.0 GigabitEthernet 0/2 10.8.4.6"]}], why:"1. Asked: a fully specified route. 2. Rule: network, mask, exit interface, next hop. 3. Apply: 192.168.77.0 255.255.255.0, out of G0/2, to the firewall 10.8.4.6 — the other end of the /29, never CHI-R2's own 10.8.4.1."})}

<h2>Network, host and default routes</h2>
<p>The mask decides how many destinations a route covers. Three sizes have names:</p>
<ul>
<li>A <b>network route</b> covers a subnet or a block of them, e.g. <code>10.1.50.0 255.255.255.0</code>.</li>
<li>A ${K.g("host route","A route to exactly one IP address: mask 255.255.255.255, a /32.")} covers one address: mask <code>255.255.255.255</code>.</li>
<li>A ${K.g("default route","The route to 0.0.0.0/0 (mask 0.0.0.0). It matches every destination, so it is used whenever nothing more specific matches. Often called quad zero.")} covers every address: <code>0.0.0.0 0.0.0.0</code>.</li>
</ul>
${K.svg("0 0 720 270",
  `<rect x="20" y="20" width="680" height="230" rx="10" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.4"/>`+
  K.txt(36,44,"0.0.0.0/0 — default route: every IPv4 address",{c:"fg",s:12,f:"display",b:true})+K.txt(36,62,"matches everything, so it is used only when nothing more specific does",{s:10.5})+
  `<rect x="150" y="82" width="420" height="150" rx="10" fill="var(--chip)" stroke="var(--accent)" stroke-width="1.4"/>`+
  K.txt(166,106,"10.1.50.0/24 — network route: 256 addresses",{c:"fg",s:12,f:"display",b:true})+K.txt(166,124,"the whole branch LAN",{s:10.5})+
  `<rect x="260" y="148" width="210" height="64" rx="10" fill="var(--panel2)" stroke="var(--ok)" stroke-width="1.6"/>`+
  K.txt(365,174,"10.1.50.10/32 — host route",{c:"fg",s:12,f:"display",b:true,mid:true})+K.txt(365,194,"one address: the CCTV recorder",{s:10.5,mid:true}),
  "Routes nest. A packet for 10.1.50.10 matches all three and longest match picks the /32; 10.1.50.77 matches the /24 and the default, and the /24 wins; 8.8.8.8 matches only the default.")}
<p>Why does a /0 match everything? A mask says how many leading bits must agree (Module 3); a /0 compares <b>none</b>, so every address agrees. That also makes it the least specific route: it loses to anything else that matches.</p>
<p>HQ-RTR has grown. G0/2 connects to the ISP (<code>198.51.100.2/30</code>, ISP router <code>.1</code>), and security wants all traffic to the branch CCTV recorder, <code>10.1.50.10</code>, to pass through the HQ firewall at <code>10.1.10.254</code>:</p>
${K.out(`HQ-RTR(config)#ip route 0.0.0.0 0.0.0.0 198.51.100.1
HQ-RTR(config)#ip route 10.1.50.0 255.255.255.0 10.1.255.2
HQ-RTR(config)#ip route 10.1.50.10 255.255.255.255 10.1.10.254
HQ-RTR(config)#end
HQ-RTR#show ip route
Codes: L - local, C - connected, S - static, * - candidate default (legend shortened)

Gateway of last resort is 198.51.100.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 198.51.100.1
      10.0.0.0/8 is variably subnetted, 6 subnets, 3 masks
C        10.1.10.0/24 is directly connected, GigabitEthernet0/0
L        10.1.10.1/32 is directly connected, GigabitEthernet0/0
S        10.1.50.0/24 [1/0] via 10.1.255.2
S        10.1.50.10/32 [1/0] via 10.1.10.254
C        10.1.255.0/30 is directly connected, GigabitEthernet0/1
L        10.1.255.1/32 is directly connected, GigabitEthernet0/1
      198.51.100.0/24 is variably subnetted, 2 subnets, 2 masks
C        198.51.100.0/30 is directly connected, GigabitEthernet0/2
L        198.51.100.2/32 is directly connected, GigabitEthernet0/2`, "A default, a network and a host route on HQ-RTR.")}
<p><code>Gateway of last resort is 198.51.100.1</code> names the ${K.g("gateway of last resort","IOS's name for the next hop of the default route. 'not set' means there is no default, so packets matching no route are dropped.")}; without a default it reads <code>not set</code> and unmatched packets are dropped. <code>S*</code> is a static marked as the candidate default. The <code>/32</code> sits inside the /24 and wins for that one address.</p>
${K.steps([
  ["10.1.50.10", "Matches the /0, the /24 and the /32 → /32 → firewall 10.1.10.254."],
  ["10.1.50.77", "Matches the /0 and the /24 → /24 → BR-RTR 10.1.255.2."],
  ["10.1.60.5 (a branch not built yet)", "Also only the /0 — so it leaks out to the ISP instead of failing at HQ-RTR. A default route can hide a missing route."],
])}
${K.tip(`<code>show ip route 10.1.50.10</code> prints the one entry a destination uses. If only the default matches, IOS answers <code>% Network not in table</code> (or <code>% Subnet not in table</code> when it knows other subnets of that classful network, as HQ-RTR does for any 10.x address) — the packet isn't dropped; only the default would carry it. To see the default route itself, ask for it: <code>show ip route 0.0.0.0</code> prints <code>Routing entry for 0.0.0.0/0, supernet</code> and <code>Known via "static", distance 1, metric 0, candidate default path</code>.`)}
${K.check({q:"A router has S* 0.0.0.0/0 via 203.0.113.1, S 10.50.0.0/16 via 10.0.0.2 and S 10.50.8.20/32 via 10.0.0.6. Where does a packet for 10.50.8.21 go?", o:["203.0.113.1 — the default is checked first","10.0.0.6 — it's next to the host route","10.0.0.2 — 10.50.0.0/16 is the longest prefix that contains 10.50.8.21","Dropped — there's no /32 for it"], a:2, why:"The /32 covers only .20. Of the routes containing .21 — the /16 and the /0 — the /16 is longer."})}
${K.q({type:"match", q:"Same logic, new situation: router LAG-CORE has S* 0.0.0.0/0, S 172.16.0.0/16, S 172.16.40.0/24 and S 172.16.40.9/32. Match each destination with the route it uses.", pairs:[["172.16.40.9","172.16.40.9/32"],["172.16.40.200","172.16.40.0/24"],["172.16.99.1","172.16.0.0/16"],["8.8.8.8","0.0.0.0/0"]], why:"1. Asked: which route each packet uses. 2. Rule: of the routes that contain the address, the longest wins. 3. Apply: .40.9 is in all four → /32. .40.200 is in the /24, /16 and /0 → /24. .99.1 is outside 172.16.40.0/24 → /16. 8.8.8.8 is in no 172.16 route → the default."})}

<h2>Routing is one-way: the return path</h2>
<p>The idea that catches more new engineers than any other: <b>each router decides only where to send <i>this</i> packet next, using only its own table.</b> No router knows the whole path or remembers where a request came from. A reply is a new packet with source and destination swapped, and every router it passes makes a new decision about it.</p>
${K.svg("0 0 760 300",
  K.dev("pc",60,90,"BR-PC","10.1.50.21")+K.dev("router",250,90,"BR-RTR","S* 0.0.0.0/0 → HQ")+K.dev("router",500,90,"HQ-RTR","no route to 10.1.50.0/24")+K.dev("server",690,90,"SRV1","10.1.10.50")+
  K.link(84,90,224,90)+K.link(276,90,474,90)+K.link(526,90,672,90)+
  K.arrow(90,40,670,40,"request to 10.1.10.50: each router has a route — delivered",true)+
  K.arrow(670,200,530,200,"reply to 10.1.50.21")+
  K.txt(500,206,"✗",{c:"bad",s:22,mid:true,b:true})+K.txt(500,232,"HQ-RTR: no matching route → drop,",{c:"bad",s:10.5,mid:true})+K.txt(500,246,"ICMP Destination host unreachable to SRV1",{c:"bad",s:10.5,mid:true})+
  K.txt(60,270,"BR-PC only sees: Request timed out.",{c:"warn",s:11}),
  "The request travels because each router on the way has a route to the server. The reply needs a route to 10.1.50.0/24 on every router on the way back — and HQ-RTR has none.")}
${K.remember(`<b>Routing is one-way.</b> Every router on the way <b>there</b> needs a route to the destination; every router on the way <b>back</b> needs a route to the source. After every static route, ask: &ldquo;and how does the reply get home?&rdquo;`)}
<p><b>Why?</b> Remembering every conversation would cost routers huge memory and break whenever a path changed, so each answers one question per packet — &ldquo;where next?&rdquo;. The two directions needn't even match: ${K.g("asymmetric routing","Traffic from A to B taking a different path from traffic from B to A. Normal for routers; it only troubles devices that track conversations, such as stateful firewalls.")} is normal, and you'll see it in the second bench.</p>
<h3>The fingerprint of a missing return route</h3>
${K.steps([
  ["Branch PC → server", "<code>Request timed out.</code> No error: the ICMP error goes to the server, not to the PC. <code>tracert</code> from the PC shows hop 1 (its own gateway), then only <code>* * *</code>: HQ-RTR receives each probe, but its &ldquo;time exceeded&rdquo; reply to 10.1.50.21 has no route home either."],
  ["Server → branch PC", "<code>Reply from 10.1.10.1: Destination host unreachable.</code> The reply comes from the server's gateway, HQ-RTR, not from the server's own address — so it is a router saying &ldquo;no route&rdquo; (Cisco routers send ICMP host unreachable for that). From the PC's own address, the same words would mean a failed ARP."],
  ["BR-RTR itself → server", "It <b>succeeds</b>. A router's ping is sourced from its exit interface — <code>10.1.255.2</code>, which HQ-RTR knows as connected. The router passes while every user fails. An <b>extended ping</b> sourced from its LAN interface, <code>ping 10.1.10.50 source g0/0</code>, prints <code>Packet sent with a source address of 10.1.50.1</code> — and fails exactly like the users."],
  ["HQ-RTR: <code>show ip route 10.1.50.21</code>", "<code>% Subnet not in table</code> — HQ-RTR knows other 10.x subnets, just not this one. Fix on HQ-RTR: <code>ip route 10.1.50.0 255.255.255.0 10.1.255.2</code>."],
])}
${K.mistake(`Closing the ticket after a ping from the router — it proves only that the link subnet is routable. Test from a host on the user's LAN, or make the router test like a user with an extended ping from its LAN interface: <code>ping 10.1.10.50 source g0/0</code> (or <code>source 10.1.50.1</code>, its own LAN address). The benches take it too.`)}
<p>To remove a wrong route, repeat the line with <code>no</code> in front, next hop included: <code>no ip route 10.1.5.0 255.255.255.0 10.1.255.2</code>. On IOS, <code>no ip route &lt;network&gt; &lt;mask&gt;</code> without a next hop removes <b>every</b> static for that network and mask, whatever its next hop or distance — handy, and dangerous when a backup shares the prefix.</p>
<h3>Hands-on: the Kano branch that &ldquo;can't reach anything&rdquo;</h3>
<p>A different network. Ticket from the Kano branch, Monday 09:10: <i>&ldquo;New branch went live this morning. None of us can open the file server at HQ (FS1, 172.16.10.20). The installer says the router passes all its tests.&rdquo;</i> Find out why, fix it on the right router and prove it from a user's PC. The frame log is open.</p>
${K.bench({id:"m5-return-path", points:90, from:"CCNA · Module 5 · lesson 2", title:"the Kano branch: find the missing way home", viewBox:"0 0 760 400", openLog:true,
  intro:"LAPTOP-KANO is on KANO-R1's console and LAPTOP-HQ on HQ-R1's (9600 baud, 8 data bits, no parity, 1 stop bit, no flow control). After you switch laptops, press Enter and type <code>enable</code> again. Kano LAN 172.16.50.0/24 · HQ LAN 172.16.10.0/24 · link 10.0.0.0/30 (HQ-R1 .1, KANO-R1 .2). Click a PC or the server to open its Command Prompt.",
  devices:[
    {id:"lapk", kind:"laptop", label:"LAPTOP-KANO", x:20, y:20},
    {id:"kano", kind:"router", label:"KANO-R1", model:"ISR 1100 · Kano branch", x:40, y:150,
      config:e=>{ ["en","conf t","hostname KANO-R1","interface g0/0","description KANO LAN","ip address 172.16.50.1 255.255.255.0","no shutdown","interface g0/1","description WAN to HQ-R1","ip address 10.0.0.2 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 10.0.0.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pck", kind:"pc", label:"KANO-PC1", x:60, y:285, ip:"172.16.50.11", mask:"255.255.255.0", gw:"172.16.50.1"},
    {id:"laph", kind:"laptop", label:"LAPTOP-HQ", x:612, y:20},
    {id:"hq", kind:"router", label:"HQ-R1", model:"ISR 4331 · head office", x:520, y:150,
      config:e=>{ ["en","conf t","hostname HQ-R1","interface g0/0","description HQ LAN","ip address 172.16.10.1 255.255.255.0","no shutdown","interface g0/1","description WAN to KANO-R1","ip address 10.0.0.1 255.255.255.252","no shutdown","exit","ip route 172.16.5.0 255.255.255.0 10.0.0.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"fs1", kind:"server", label:"FS1", x:600, y:285, ip:"172.16.10.20", mask:"255.255.255.0", gw:"172.16.10.1"},
  ],
  cables:[ {type:"cat6", a:"kano:g1", b:"hq:g1"}, {type:"cat6", a:"pck:eth", b:"kano:g0"}, {type:"cat6", a:"fs1:eth", b:"hq:g0"},
           {type:"console", a:"lapk:usb", b:"kano:con"}, {type:"console", a:"laph:usb", b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the ticket from KANO-PC1. First <code>tracert 172.16.10.20</code>: hop 1 (KANO-R1) answers, then only <code>* * *</code> — the log says which hops got the probe but had no way back. Then <code>ping 172.16.10.20</code>: it times out. In the log, follow the request all the way to FS1 — then follow FS1's reply and find where it dies", done:B=>Bench.tried(B,"pck",/^\s*tracert\s+172\.16\.10\.20\s*$/i) && Bench.tried(B,"pck",/^\s*ping\s+172\.16\.10\.20\s*$/i)},
    {text:"Now the other direction: from FS1, <code>ping 172.16.50.11</code>. Read who answers, and what that router is telling you", done:B=>Bench.tried(B,"fs1",/^\s*ping\s+172\.16\.50\.11\s*$/i)},
    {text:"On LAPTOP-KANO: console into KANO-R1, <code>enable</code>, <code>show ip route</code>. Find the line that says where KANO-R1 sends everything that isn't local", done:B=>B.devs.kano.env.log.some(l=>/Gateway of last resort is 10\.0\.0\.1/.test(l.out))},
    {text:"Still on KANO-R1: <code>ping 172.16.10.20</code>. It succeeds — the installer's &ldquo;test&rdquo;. Work out which source address the router used and why HQ-R1 can answer it", done:B=>B.devs.kano.env.log.some(l=>/^\s*ping\s+172\.16\.10\.20\s*$/i.test(l.cmd) && /Success rate is 100 percent/.test(l.out))},
    {text:"Now make the router test like a user: an extended ping from its LAN interface, <code>ping 172.16.10.20 source g0/0</code>. IOS prints <code>Packet sent with a source address of 172.16.50.1</code> — and it fails. The installer's test only proved the link address can get home", done:B=>B.devs.kano.env.log.some(l=>/^\s*ping\s+172\.16\.10\.20\s+source\s/i.test(l.cmd) && /source address of 172\.16\.50\.1/.test(l.out) && /Success rate is 0 percent/.test(l.out))},
    {text:"On LAPTOP-HQ: console into HQ-R1, <code>enable</code>, <code>show ip route</code>. Is there any route that contains 172.16.50.11? Look closely at the static that <i>is</i> there", done:B=>B.devs.hq.env.log.some(l=>/S\s+172\.16\.5\.0\/24 \[1\/0\] via 10\.0\.0\.2/.test(l.out))},
    {text:"Remove the mistyped route: <code>no</code> followed by the exact <code>ip route</code> line that created it", done:B=>!B.devs.hq.env.routes.some(r=>r.net==="172.16.5.0")},
    {text:"Add the return route on HQ-R1: Kano's LAN, through KANO-R1's address on the link", done:B=>{ const r = Bench.route(B,"hq","172.16.50.0/24","S"); return !!(r && r.via[0]==="10.0.0.2"); }},
    {text:"Prove it from the user's side: from KANO-PC1, <code>ping 172.16.10.20</code> (replies with TTL=126) and <code>tracert 172.16.10.20</code> (three lines: KANO-R1, HQ-R1, FS1)", done:B=>Bench.pinged(B,"pck","172.16.10.20") && Bench.traced(B,"pck","172.16.10.20")},
    {text:"Save HQ-R1's configuration", done:B=>B.devs.hq.env.savedOnce},
  ],
  win:"You diagnosed a missing return route from its fingerprint — the user's ping timing out and tracert going silent after hop 1, FS1 getting Destination host unreachable from its own gateway, and the branch router's ping passing because it was sourced from the link (and failing once sourced from the LAN) — then removed a typo'd route and added the real one where the gap was: on the router the reply passes through.",
  solve:[["pc","pck","tracert 172.16.10.20"],["pc","pck","ping 172.16.10.20"],["pc","fs1","ping 172.16.50.11"],
    ["console","lapk",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],["term","ping 172.16.10.20"],["term","ping 172.16.10.20 source g0/0"],
    ["console","laph",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],
    ["term","configure terminal"],["term","no ip route 172.16.5.0 255.255.255.0 10.0.0.2"],["term","ip route 172.16.50.0 255.255.255.0 10.0.0.2"],["term","end"],
    ["pc","pck","ping 172.16.10.20"],["pc","pck","tracert 172.16.10.20"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Stuck on where the reply dies? In the log after the first ping, find the line that begins <i>&ldquo;HQ-R1 has no route to 172.16.50.11&rdquo;</i>. Then on HQ-R1 compare the static route's network with Kano's real LAN, digit by digit.`)}
${K.reveal("Walkthrough — what the evidence said",`<p>The reply died at HQ-R1, which had no route to <code>172.16.50.11</code>; FS1 got <code>Destination host unreachable</code> from <code>172.16.10.1</code>, the PC only silence. The PC's tracert went silent after hop 1 for the same reason: HQ-R1 and FS1 got the probes, but their replies to 172.16.50.11 had no way home. KANO-R1 was fine, and its own ping passed because it was sourced from <code>10.0.0.2</code>, connected at HQ; sourced from <code>172.16.50.1</code> it failed like the users. HQ-R1's <code>S 172.16.5.0/24</code> was a typo for 50 that IOS had no reason to refuse. TTL=126 after the fix is FS1's 128 minus two routers.</p>`)}
${K.check({q:"In the bench, KANO-R1 could ping FS1 before the fix while KANO-PC1 couldn't. Why?", o:["Routers ignore missing routes for their own traffic","KANO-R1's ping was sourced from 10.0.0.2, and HQ-R1 has a connected route to 10.0.0.0/30, so its replies had a way back","FS1 allows routers but blocks PCs","A router's ping uses TCP, which needs no return route"], a:1, why:"A router's ping is sourced from its exit interface. HQ-R1 knew 10.0.0.0/30 as connected, but not 172.16.50.0/24."})}
${K.hint(`Follow the reply from the server back to the user, and ask each router on the way: &ldquo;do I have a route containing the user's address?&rdquo;`)}
${K.reveal("Same logic, new situation — the Enugu printer",`<p>ENU-R1 (Enugu, LAN 10.70.1.0/24) — CORE-R (Lagos, LAN 10.10.0.0/24) — PRN-R (print services, 10.90.4.0/24). ENU-R1 has a default to CORE-R; CORE-R has statics to 10.70.1.0/24 and 10.90.4.0/24; PRN-R has <i>only</i> a static to 10.70.1.0/24 via CORE-R. Enugu prints fine; Lagos staff can't. Why?</p>
<p><b>1. Asked:</b> why one site fails with the same printer. <b>2. Rule:</b> routers on the way back need a route to the <i>source</i>. <b>3. Apply:</b> Lagos requests arrive; replies to 10.10.0.x reach PRN-R, which has no route containing them and no default → dropped. Enugu works only because PRN-R has 10.70.1.0/24. Fix on PRN-R: a route to 10.10.0.0/24 — or, since CORE-R is its only way out, one default route.</p>`)}

<h2>When a static route appears and disappears — and floating statics</h2>
<p>A static isn't &ldquo;on&rdquo; because you typed it. IOS keeps every <code>ip route</code> line in the running-config, but puts a route in the table only while it is usable — and withdraws it by itself when it isn't.</p>
${K.remember(`<b>When IOS installs a static route.</b> Exit-interface form (alone or fully specified): while that <b>interface is up/up</b>. Next-hop form: while the <b>next hop resolves</b> through some other route, recursively. Otherwise the route leaves the table but stays in the config, and returns by itself when the condition is met again.`)}
<p><b>Why?</b> An unusable route would send packets to a dead interface. Withdrawing it lets something else — a less specific route or a backup — take over, and that is what makes floating statics work. HQ-RTR, with four statics configured and two installed:</p>
${K.out(`HQ-RTR#show running-config | include ip route
ip route 10.1.50.0 255.255.255.0 10.1.255.2
ip route 10.1.60.0 255.255.255.0 10.1.255.6
ip route 10.1.70.0 255.255.255.0 GigabitEthernet0/2
ip route 172.20.0.0 255.255.0.0 10.1.50.254

HQ-RTR#show ip route static
Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 5 subnets, 3 masks
S        10.1.50.0/24 [1/0] via 10.1.255.2
S     172.20.0.0/16 [1/0] via 10.1.50.254`, "Four configured, two installed (legend omitted). | include shows only the config lines containing 'ip route'.")}
<p><code>10.1.60.0/24 via 10.1.255.6</code> is <b>missing</b>: <code>10.1.255.0/30</code> holds only .0–.3, so .6 is on no network HQ-RTR knows — the next hop doesn't resolve (a typo for .2). That's only because HQ-RTR has no default route yet: IOS resolves a next hop through <i>any</i> route that contains it, the default included, so with a default the typo'd route would install and quietly send 10.1.60.x towards the ISP.<code>10.1.70.0/24 GigabitEthernet0/2</code> is <b>missing</b> because G0/2 is shut down. <code>172.20.0.0/16</code> is installed recursively through <code>10.1.50.0/24</code>. Now shut BR-RTR's G0/1: HQ-RTR's G0/1 goes down/down, <code>10.1.255.0/30</code> leaves the table, and the chain collapses — <code>10.1.50.0/24</code> no longer resolves, so neither does <code>172.20.0.0/16</code>. <code>show ip route static</code> is empty; the config still has all four lines.</p>
${K.exam(`&ldquo;In the running-config but not the routing table?&rdquo; One of three: the exit interface is down, the next hop doesn't resolve, or another route for the <i>same prefix</i> has a lower AD — a floating static waiting its turn, coming up next.`)}
<p><b>The catch: &ldquo;up&rdquo; means <i>your</i> interface.</b> WAN links usually plug into a provider's box that keeps your port up even when the path behind it is dead. Your interface stays up/up, the next hop resolves, the static stays — and traffic goes into a black hole. The cures are a protocol whose hellos notice a silent neighbour (OSPF, lesson 3) or ${K.g("IP SLA","An IOS feature that sends test probes and can withdraw a tracked static route when they fail. Beyond CCNA, common in branch designs.")} tracking.</p>
<h3>Floating static routes</h3>
<p>Lesson 1's rule: for the <b>same prefix</b>, the lower ${K.g("administrative distance (AD)","How much the router trusts a source of routes, 0–255, lower is better (connected 0, static 1, OSPF 110). Compared only between identical prefixes.")} wins. A static's AD is 1 unless you add a number (1–255) at the end. A ${K.g("floating static route","A static route with a higher AD than the main route for the same prefix, so it stays out of the table until the main route disappears.")} is given a higher AD than the main route, so it loses and waits in the config until the main route is withdrawn.</p>
${K.svg("0 0 760 280",
  K.dev("pc",60,130,"BRANCH LAN","10.1.50.0/24")+K.link(84,130,224,130)+K.dev("router",250,130,"BR-RTR","")+
  K.link(276,122,474,72,"primary · G0/1 · 10.1.255.0/30")+K.dev("router",500,64,"HQ-RTR","")+
  K.link(276,140,474,196,"backup · G0/2 · 10.1.254.0/30",true)+K.dev("router",500,206,"BR-LTE","LTE → VPN → HQ")+
  K.box(560,24,190,58,"ip route 0.0.0.0 0.0.0.0 10.1.255.1","AD 1 → in the table",true)+
  K.box(560,168,190,58,"ip route 0.0.0.0 0.0.0.0 10.1.254.1 200","AD 200 → waits")+
  K.txt(20,262,"G0/1 down → AD-1 route withdrawn → AD-200 route installs.",{c:"fg",s:10.5}),
  "BR-RTR's backup default through an LTE router waits behind the primary default with AD 200.")}
${K.out(`BR-RTR(config)#ip route 0.0.0.0 0.0.0.0 10.1.255.1
BR-RTR(config)#ip route 0.0.0.0 0.0.0.0 10.1.254.1 200
BR-RTR(config)#end
BR-RTR#show ip route static
Gateway of last resort is 10.1.255.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 10.1.255.1

        (the primary link fails: G0/1 goes down/down)

BR-RTR#show ip route static
Gateway of last resort is 10.1.254.1 to network 0.0.0.0

S*    0.0.0.0/0 [200/0] via 10.1.254.1`, "Before and after (legend omitted). When G0/1 returns, the AD-1 route comes back and the backup hides again — no human needed.")}
${K.remember(`<b>Floating static rule:</b> same prefix, <b>higher AD than the route it backs up</b>. Behind a static (AD 1): 2 or more. Behind OSPF (110): above 110 — teams pick a house value like 200 or 250. AD 255 means &ldquo;never trust&rdquo;: never installed.`)}
${K.mistake(`A &ldquo;backup&rdquo; that wins. With OSPF (AD 110) to head office, <code>ip route 10.1.0.0 255.255.0.0 10.1.254.1 100</code> beats OSPF, and all traffic rides the LTE link. Leave the number off and it's AD 1 — worse. The backup's AD must be higher than the main route's.`)}
<p>Two more pieces of logic: <b>AD only compares identical prefixes</b> — if the primary is <code>10.1.0.0/16</code> via OSPF and the &ldquo;backup&rdquo; is <code>10.1.50.0/24</code> with AD 250, the /24 is a different prefix, goes straight into the table and wins for 10.1.50.x by longest match, whatever its AD. And <b>the return path needs a backup too</b>: if only the branch fails over, replies from head office still head for the dead link.</p>
${K.q({type:"multi", q:"Same logic, new situation: ABA-R1 learns 10.30.0.0/16 from OSPF (AD 110) over MPLS. You want a static backup over a VPN, next hop 172.31.0.2, used ONLY if the OSPF route disappears. Which two commands do that? (Choose two.)", o:["ip route 10.30.0.0 255.255.0.0 172.31.0.2","ip route 10.30.0.0 255.255.0.0 172.31.0.2 100","ip route 10.30.0.0 255.255.0.0 172.31.0.2 130","ip route 10.30.0.0 255.255.255.0 172.31.0.2 250","ip route 10.30.0.0 255.255.0.0 172.31.0.2 250"], a:[2,4], why:"1. Asked: a backup that loses to OSPF. 2. Rule: identical prefix and length, AD above 110. 3. Apply: 130 and 250 qualify. AD 1 (no number) and 100 would beat OSPF. The /24 is a longer, different prefix, so longest match makes it win for 10.30.0.x regardless of AD."})}
<h3>Hands-on: the backup link that's never idle</h3>
<p>Ticket from the Ibadan branch: <i>&ldquo;Our MTN LTE backup bill has tripled, but the MainOne fibre has been up all month.&rdquo;</i> LOS-R1 and IBD-R1 are joined by fibre (G0/1) and LTE (G0/2). Find out why LTE carries traffic, make it a true backup in <b>both</b> directions, then cut the fibre and watch. IOS's own <code>traceroute 192.168.20.21</code> works like Windows <code>tracert</code>: it lists the interface address each probe arrived on, so it shows which link a path uses.</p>
${K.bench({id:"m5-floating", points:100, from:"CCNA · Module 5 · lesson 2", title:"Lagos–Ibadan: make the LTE link a real backup", viewBox:"0 0 760 400", openLog:true,
  intro:"LAPTOP-LOS is on LOS-R1's console, LAPTOP-IBD on IBD-R1's (9600 8N1, no flow control). After switching laptops press Enter and type <code>enable</code>. Lagos LAN 192.168.10.0/24 (APP1 .50) · Ibadan LAN 192.168.20.0/24 (IBD-PC1 .21) · fibre G0/1 ⇄ G0/1 10.255.1.0/30 (LOS-R1 .1, IBD-R1 .2) · LTE G0/2 ⇄ G0/2 10.255.2.0/30 (LOS-R1 .1, IBD-R1 .2). To cut the fibre, click the G0/1–G0/1 cable to unplug it; a Cat6 from the tray repairs it.",
  devices:[
    {id:"lapl", kind:"laptop", label:"LAPTOP-LOS", x:20, y:20},
    {id:"los", kind:"router", label:"LOS-R1", model:"ISR 4331 · Lagos HQ", x:40, y:150,
      config:e=>{ ["en","conf t","hostname LOS-R1","interface g0/0","description LAGOS LAN","ip address 192.168.10.1 255.255.255.0","no shutdown","interface g0/1","description PRIMARY MainOne fibre to IBD-R1","ip address 10.255.1.1 255.255.255.252","no shutdown","interface g0/2","description BACKUP MTN LTE to IBD-R1","ip address 10.255.2.1 255.255.255.252","no shutdown","exit","ip route 192.168.20.0 255.255.255.0 10.255.1.2","ip route 192.168.20.0 255.255.255.0 10.255.2.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"app1", kind:"server", label:"APP1", x:60, y:285, ip:"192.168.10.50", mask:"255.255.255.0", gw:"192.168.10.1"},
    {id:"lapi", kind:"laptop", label:"LAPTOP-IBD", x:612, y:20},
    {id:"ibd", kind:"router", label:"IBD-R1", model:"ISR 1100 · Ibadan branch", x:520, y:150,
      config:e=>{ ["en","conf t","hostname IBD-R1","interface g0/0","description IBADAN LAN","ip address 192.168.20.1 255.255.255.0","no shutdown","interface g0/1","description PRIMARY MainOne fibre to LOS-R1","ip address 10.255.1.2 255.255.255.252","no shutdown","interface g0/2","description BACKUP MTN LTE to LOS-R1","ip address 10.255.2.2 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 10.255.1.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"ipc", kind:"pc", label:"IBD-PC1", x:600, y:285, ip:"192.168.20.21", mask:"255.255.255.0", gw:"192.168.20.1"},
  ],
  cables:[ {type:"cat6", a:"los:g1", b:"ibd:g1"}, {type:"cat6", a:"los:g2", b:"ibd:g2"}, {type:"cat6", a:"app1:eth", b:"los:g0"}, {type:"cat6", a:"ipc:eth", b:"ibd:g0"},
           {type:"console", a:"lapl:usb", b:"los:con"}, {type:"console", a:"lapi:usb", b:"ibd:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"The evidence first: from APP1, <code>tracert 192.168.20.21</code>. Which link does hop 2 belong to?", done:B=>Bench.tried(B,"app1",/^\s*tracert\s+192\.168\.20\.21\s*$/i)},
    {text:"On LAPTOP-LOS: console into LOS-R1, <code>enable</code>, <code>show ip route static</code>. One prefix, two next hops, both <code>[1/0]</code> — IOS is sharing the branch's traffic across both links", done:B=>B.devs.los.env.log.some(l=>/192\.168\.20\.0\/24 \[1\/0\] via 10\.255\.1\.2\n\s+\[1\/0\] via 10\.255\.2\.2/.test(l.out))},
    {text:"Make LOS-R1's LTE route a floating static: remove it with <code>no ip route …</code>, then enter it again with administrative distance <code>200</code>", done:B=>{ const rs = B.devs.los.env.routes; return rs.some(r=>r.net==="192.168.20.0" && r.nh==="10.255.2.2" && r.ad===200) && !rs.some(r=>r.nh==="10.255.2.2" && !r.ad); }},
    {text:"Check both views on LOS-R1: <code>show ip route static</code> now lists only the fibre next hop, while <code>show running-config | include ip route</code> still shows the backup line ending in 200", done:B=>{ const L = B.devs.los.env.log; return L.some(l=>/192\.168\.20\.0\/24 \[1\/0\] via 10\.255\.1\.2/.test(l.out) && !/via 10\.255\.2\.2/.test(l.out)) && L.some(l=>/ip route 192\.168\.20\.0 255\.255\.255\.0 10\.255\.2\.2 200/.test(l.out)); }},
    {text:"On LOS-R1, <code>traceroute 192.168.20.21</code>: the first hop is now 10.255.1.2 — the fibre", done:B=>B.devs.los.env.log.some(l=>/^\s*tr\w*\s+192\.168\.20\.21/i.test(l.cmd) && /1 10\.255\.1\.2 /.test(l.out))},
    {text:"On LAPTOP-IBD: console into IBD-R1, <code>enable</code>, <code>show ip route</code>. IBD-R1's only way out is the fibre. Add a floating <b>default</b> route through the LTE link (next hop 10.255.2.1, distance 200) so the branch can still get out — and replies can still get home", done:B=>B.devs.ibd.env.routes.some(r=>r.net==="0.0.0.0" && r.mask==="0.0.0.0" && r.nh==="10.255.2.1" && r.ad===200)},
    {text:"Cut the fibre: unplug the cable between LOS-R1 G0/1 and IBD-R1 G0/1", done:B=>!Bench.linked(B,"los:g1","ibd:g1")},
    {text:"On IBD-R1, <code>show ip route</code>: the floating default has installed itself as <code>S* 0.0.0.0/0 [200/0] via 10.255.2.1</code>", done:B=>B.devs.ibd.env.log.some(l=>/S\*\s+0\.0\.0\.0\/0 \[200\/0\] via 10\.255\.2\.1/.test(l.out))},
    {text:"From IBD-PC1, <code>tracert 192.168.10.50</code> (APP1): hop 2 is now 10.255.2.1 — the users are on the backup and still working", done:B=>Bench.traced(B,"ipc","192.168.10.50") && Bench.routeVia(B,"ibd","192.168.10.50")==="10.255.2.1" && Bench.routeVia(B,"los","192.168.20.21")==="10.255.2.2"},
    {text:"Repair the fibre (Cat6 from the tray between the two G0/1 ports), then <code>show ip route</code> on IBD-R1 again: <code>[1/0] via 10.255.1.1</code> is back and the backup has stepped aside by itself", done:B=>{ if (!Bench.linked(B,"los:g1","ibd:g1")) return false; const L = B.devs.ibd.env.log; let k = -1; L.forEach((l,i)=>{ if (/\[200\/0\] via 10\.255\.2\.1/.test(l.out)) k = i; }); return k>=0 && L.slice(k+1).some(l=>/S\*\s+0\.0\.0\.0\/0 \[1\/0\] via 10\.255\.1\.1/.test(l.out)); }},
    {text:"Save both routers' configurations", done:B=>B.devs.los.env.savedOnce && B.devs.ibd.env.savedOnce},
  ],
  win:"You found a &ldquo;backup&rdquo; that was really a second primary (two equal AD-1 routes share the load), turned it into a floating static, gave the branch its own floating default for the return trip, and watched both routers swap to the LTE link when the fibre was cut — and swap back on their own when it was repaired.",
  solve:[["pc","app1","tracert 192.168.20.21"],
    ["console","lapl",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route static"],
    ["term","configure terminal"],["term","no ip route 192.168.20.0 255.255.255.0 10.255.2.2"],["term","ip route 192.168.20.0 255.255.255.0 10.255.2.2 200"],["term","end"],
    ["term","show ip route static"],["term","show running-config | include ip route"],["term","traceroute 192.168.20.21"],["term","copy running-config startup-config"],["term",""],
    ["console","lapi",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],
    ["term","configure terminal"],["term","ip route 0.0.0.0 0.0.0.0 10.255.2.1 200"],["term","end"],
    ["unplug","los:g1"],["term","show ip route"],["pc","ipc","tracert 192.168.10.50"],
    ["plug","cat6","los:g1","ibd:g1"],["term","show ip route"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Why did APP1's traffic to IBD-PC1 ride LTE while the fibre was fine? Two routes with equal AD for one prefix are both installed, and IOS spreads destinations across them. A backup must <i>lose</i>, so it needs a higher number.`)}
${K.reveal("Walkthrough — what you just saw",`<p>Both AD-1 statics were installed, so destinations were shared and IBD-PC1 landed on LTE; IBD-R1 had no backup. With AD 200 on both, unplugging the fibre took both G0/1s down, the AD-1 routes lost their next hops and the floating routes installed. That's the easy case — the case study shows the hard one.</p>`)}
${K.check({q:"A router has ip route 10.9.0.0 255.255.0.0 10.0.12.2 and ip route 10.9.0.0 255.255.0.0 10.0.13.2 210. Both next hops are on up/up interfaces. What does show ip route show for 10.9.0.0/16?", o:["Both routes, sharing the load","Only S 10.9.0.0/16 [1/0] via 10.0.12.2; the AD-210 route waits","Only S 10.9.0.0/16 [210/0] via 10.0.13.2 — the higher number wins","Neither: two routes for one prefix conflict"], a:1, why:"Same prefix: the lower AD is installed; the AD-210 route floats until the first is withdrawn."})}

<h2>Troubleshooting static routes</h2>
<p>The symptoms usually tell you which kind of fault it is before you open a config.</p>
${K.steps([
  ["Test from a host, both directions, and read the message", "Timed out (often the return path), or <code>Destination host unreachable</code> from a router's address (that router has no route)."],
  ["Find where it stops", "<code>tracert</code> / <code>traceroute</code>: start at the last hop that answers. The next router either has no route onward (you may see an unreachable from it) or no route back to you — it gets the probe, but its reply never arrives, so you see <code>* * *</code>."],
  ["Ask that router", "<code>show ip route &lt;destination&gt;</code>: missing, or the wrong one?"],
  ["Config versus table", "<code>show running-config | include ip route</code> against <code>show ip route static</code>: configured but missing, or present but mistyped?"],
  ["Fix, prove, save", "Remove the wrong line, add the right one, ping from hosts both ways, save."],
])}
<div class="tablewrap"><table>
<tr><th>Typo (meant 10.1.50.0/24 via 10.1.255.2)</th><th>What happens</th></tr>
<tr><td><code>ip route 10.1.5.0 255.255.255.0 10.1.255.2</code></td><td>Installed — for the wrong network. 10.1.50.x has no route.</td></tr>
<tr><td><code>ip route 10.1.50.0 255.255.255.128 10.1.255.2</code></td><td>Covers .0–.127 only: half the branch works.</td></tr>
<tr><td><code>ip route 10.1.0.0 255.255.0.0 10.1.255.2</code></td><td>Works, and also drags every other 10.1.x network without a more specific route towards the branch.</td></tr>
<tr><td><code>ip route 10.1.50.0 255.255.255.0 10.1.255.6</code></td><td>Accepted, never installed: the next hop doesn't resolve — unless a default route contains it, and then it installs and points the wrong way.</td></tr>
</table></div>
${K.job("“Half of Onitsha can reach core banking, half can't”",`
<p><b>The ticket.</b> 08:25, the Onitsha branch manager: &ldquo;Some tellers can't open core banking since this morning. Others can. Same room.&rdquo; The change log: last night the MSP enlarged the branch LAN from <code>10.60.8.0/24</code> to <code>/23</code>, updating the branch router and DHCP.</p>
<p><b>Questions.</b> &ldquo;Which tellers work?&rdquo; — <i>&ldquo;The old desks, not the new ones by the window.&rdquo;</i> &ldquo;An IP from each?&rdquo; — <i>&ldquo;10.60.8.34 works, 10.60.9.15 doesn't.&rdquo;</i> One is in the old /24, one in the new half: suspect a route that still says /24. <b>Checks</b> on HQ-CORE, the first router the replies pass:</p>
${K.out(`HQ-CORE#show ip route 10.60.9.15
% Subnet not in table

HQ-CORE#show running-config | include 10.60
ip route 10.60.8.0 255.255.255.0 10.255.60.2`, "HQ-CORE still has the old /24; 10.60.9.x matches only its default, towards the internet.")}
<p>Requests from 10.60.9.15 arrive, but the replies leak out of the default. <b>The fix:</b></p>
${K.out(`HQ-CORE(config)#no ip route 10.60.8.0 255.255.255.0 10.255.60.2
HQ-CORE(config)#ip route 10.60.8.0 255.255.254.0 10.255.60.2 name ONITSHA-LAN
HQ-CORE(config)#end
HQ-CORE#show ip route 10.60.9.15
Routing entry for 10.60.8.0/23
  Known via "static", distance 1, metric 0`, "The /23 covers 10.60.8.0–10.60.9.255. The name keyword stores a label with the route.")}
<p>Verify: a window-desk teller logs in, an old desk still works; save.</p>
<p><b>What you say.</b> &ldquo;Last night's change made more room at your branch, but one head-office router was still only sending replies to the old addresses. I've updated it — please ask the window desks to log in again.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Onitsha 10.60.9.x no core banking after LAN resize CHG-2231 (/24 → /23). HQ-CORE return route still /24; replaced with 10.60.8.0 255.255.254.0 10.255.60.2 name ONITSHA-LAN, old line removed, saved. Verified from 10.60.9.15 and 10.60.8.34. Added 'update HQ return routes' to the resize checklist. 20 min.&rdquo;</i></p>`)}
${K.case("A retail chain's backup that never floated",`
<p>A supermarket chain ran 60 stores on provider fibre with an LTE backup: a primary default to the provider, a floating default (AD 250) via LTE, and matching floating routes at head office. Rollout testing unplugged the fibre at each store router; failover worked every time.</p>
<p><b>The outage.</b> A digger cut the provider's fibre between two exchanges. Thirty stores lost head office, none failed over, and card payments ran offline for six hours.</p>
<p><b>Why.</b> Each store router plugged into the provider's box in the store, which stayed powered and kept the link up. G0/1 stayed up/up, the next hop resolved, the primary never left the table, so the floating route never installed. The test had only proved the easy case.</p>
<p><b>The fix and the lesson.</b> Each primary is now tied to IP SLA probes towards head office, and failover is tested by breaking the path <i>beyond</i> the store. A floating static protects you only against failures that withdraw the primary — know which those are, and test the others.</p>`)}
${K.myth([
  ["An exit-interface static is 'directly connected', so its AD is 0.","It's listed as directly connected, but its AD is 1: <code>show ip route &lt;prefix&gt;</code> says <code>Known via &quot;static&quot;, distance 1</code>."],
  ["A static route on one router lets two networks talk.","Routing is one-way: the reply needs a route back on every router it crosses."],
  ["A floating static always uses AD 200.","Any value above the route it backs up works. 255 means never installed."],
  ["If the next-hop router dies, the static disappears.","Only if your own exit interface goes down or the next hop stops resolving. Behind a switch or provider box, the route stays."],
])}
${K.dodont([
  "Give a next hop on Ethernet.",
  "Configure the return route in the same change.",
  "Verify with <code>show ip route static</code> and host pings in both directions.",
  "Test failover by breaking the far side of the path, not only your own cable.",
],[
  "Don't point a default route out of an Ethernet interface with no next hop.",
  "Don't give a floating static an AD at or below the route it backs up.",
  "Don't accept a router-sourced ping as proof users can connect.",
  "Don't type <code>no ip route &lt;network&gt; &lt;mask&gt;</code> without the next hop unless you mean every static for that prefix.",
])}
${K.exam(`<b>How to read a routing question.</b> (1) What exactly is asked — which router, which packet, which direction? Underline the destination. (2) Which rule — longest match among routes that contain the address; AD only between identical prefixes; a static counts only if its interface is up and its next hop resolves. (3) Work it through on <i>that router's</i> table, then do the same for the reply. Distractors tempt you to compare ADs across different prefixes or forget the way back.`)}
${K.check({q:"Branch users get 'Reply from 10.1.50.1: Destination host unreachable' when reaching 10.1.10.50. 10.1.50.1 is the branch router. Where do you look first?", o:["The HQ router's route back to the branch","The branch router's own table — it has no route matching 10.1.10.50 (check its default route and next hop)","The server's power","The users' default gateway setting"], a:1, why:"Destination host unreachable comes from the router without a route — it names itself, 10.1.50.1. A missing return route at HQ would show as Request timed out."})}
${K.reveal("Same logic, new situation — the loop in Jos",`<p>JOS-R1 has <code>ip route 0.0.0.0 0.0.0.0 10.0.7.2</code> (to JOS-R2). JOS-R2 has <code>ip route 10.80.0.0 255.255.0.0 10.0.7.1</code> — back to JOS-R1 — but 10.80.0.0/16 isn't behind JOS-R1 either — the recipe for a ${K.g("routing loop","Packets bouncing between routers that each point at the other until the TTL runs out.")}. A PC behind JOS-R1 runs <code>tracert 10.80.3.3</code>. What do you see?</p>
<p><b>1. Asked:</b> the path of one packet. <b>2. Rule:</b> each router uses only its own table, hop by hop. <b>3. Apply:</b> JOS-R1 → default → JOS-R2 → 10.80.0.0/16 → JOS-R1 → default → JOS-R2 … until the TTL hits zero. Tracert shows the two routers alternating; ping shows <code>TTL expired in transit</code>. Fix JOS-R2's next hop to where 10.80.0.0/16 really lives, or remove the route.</p>`)}

<h2>Interview corner</h2>
${K.hint(`The decision rule, two or three uses, one honest limitation.`)}
${K.reveal("“When would you use a static route rather than a dynamic routing protocol?”",`<p>&ldquo;When there's one sensible way out, when I want a fixed path, or as a backup: a default at a single-link branch with a route back at head office, the default to the ISP, floating statics behind OSPF. They cost nothing and are predictable, but only react to their own interface going down or their next hop becoming unreachable. With several paths or many networks I'd run OSPF.&rdquo;</p>`)}
${K.hint(`AD, the identical-prefix rule, both directions, and the failure it doesn't catch.`)}
${K.reveal("“What is a floating static route, and how would you make sure it works?”",`<p>&ldquo;A static with a higher AD than the main route for the same prefix — say 200 behind OSPF's 110 — so it stays out of the table until the main route is withdrawn. I check the prefix and length match the primary exactly, the far end has a backup route for return traffic, and the failures I care about really withdraw the primary; behind a provider box my interface may stay up, so I'd add IP SLA tracking. Then I fail the path and watch <code>show ip route</code> and a traceroute change.&rdquo;</p>`)}
${K.hint(`The source address of a router's ping, the return path, and how you'd prove it.`)}
${K.reveal("“A new branch can't reach a server at head office, but the branch router can ping it. What's going on?”",`<p>&ldquo;Most likely a missing return route. The router's ping is sourced from its WAN interface, which head office knows as connected; the users' LAN isn't known there. A ping from the server towards a PC would show Destination host unreachable from the head-office router, and <code>show ip route</code> there confirms it; an extended ping from the branch router's LAN interface, <code>ping … source g0/0</code>, fails just like the users. Fix: a route for the branch LAN via the branch's WAN address, then test from a user's PC both ways.&rdquo;</p>`)}

${K.recap([
  "Statics suit stub sites, ISP edges, backups and exceptions; dynamic protocols suit many paths or many networks.",
  "ip route NETWORK MASK + next hop, exit interface, or both (fully specified), + optional AD. On Ethernet, always give the next hop.",
  "A next-hop route is resolved by a recursive lookup and lives only as long as the routes it leans on.",
  "Host routes are /32, the default 0.0.0.0/0 matches everything; longest match chooses between them.",
  "Routing is one-way: routers on the way back need a route to the source. A router's own ping can pass while users fail.",
  "A static is installed only while its interface is up and its next hop resolves.",
  "A floating static has a higher AD than the route it backs up, for the identical prefix — at both ends.",
])}
${K.next(`<b>Lesson 3 — Why dynamic routing, and how OSPF thinks.</b> Statics can't notice a silent neighbour or a failure three routers away. Next: how OSPF routers find each other with hellos, share a map of the network and each calculate the best paths — so the network reroutes itself.`)}
`,
quiz:[
  {lvl:1, q:"Which command creates a default route that sends all unknown traffic to the ISP router at 203.0.113.1?", o:["ip default-gateway 203.0.113.1","ip route 0.0.0.0 255.255.255.255 203.0.113.1","ip route 0.0.0.0 0.0.0.0 203.0.113.1","ip route 203.0.113.1 0.0.0.0 0.0.0.0"], a:2, why:"A default route is network 0.0.0.0 with mask 0.0.0.0, followed by the next hop. ip default-gateway is for devices that aren't routing (such as a switch's management). Mask 255.255.255.255 would make it a host route to 0.0.0.0."},
  {lvl:1, q:"What is the administrative distance of a static route when no distance is typed?", o:["0","1","110","200"], a:1, why:"Statics default to AD 1, second only to connected routes (0). That's why a floating static must be given a higher number explicitly."},
  {lvl:1, type:"match", q:"Match each ip route command with the kind of route it creates.", pairs:[["ip route 0.0.0.0 0.0.0.0 10.0.0.1","Default route"],["ip route 10.5.5.9 255.255.255.255 10.0.0.1","Host route"],["ip route 10.5.0.0 255.255.0.0 10.0.0.1","Network route"],["ip route 10.5.0.0 255.255.0.0 10.0.0.9 200","Floating static route"]], why:"Mask 0.0.0.0 matches everything (default); 255.255.255.255 matches one address (host); a normal mask covers a network; a distance at the end higher than the primary's makes it a floating backup."},
  {lvl:1, type:"fill", q:"Which privileged EXEC command shows only the static routes that are currently installed in the routing table?", fields:[{label:"Command", a:["show ip route static"], ios:true}], why:"show ip route static filters the routing table to S entries. Compare it with show running-config | include ip route, which shows every configured static, installed or not."},
  {lvl:2, q:"Based on the exhibit, where does BR-R2 send a packet for 10.77.3.3?", ex:"BR-R2#show ip route\nCodes: L - local, C - connected, S - static, * - candidate default\n\nGateway of last resort is 10.0.9.1 to network 0.0.0.0\n\nS*    0.0.0.0/0 [1/0] via 10.0.9.1\n      10.0.0.0/8 is variably subnetted, 5 subnets, 3 masks\nC        10.0.9.0/30 is directly connected, GigabitEthernet0/1\nL        10.0.9.2/32 is directly connected, GigabitEthernet0/1\nS        10.77.0.0/24 [1/0] via 10.0.9.1\nC        10.88.1.0/24 is directly connected, GigabitEthernet0/0\nL        10.88.1.1/32 is directly connected, GigabitEthernet0/0", o:["It drops it: there is no route for 10.77.3.0/24","To 10.0.9.1, using the default route, because 10.77.0.0/24 covers only 10.77.0.0–10.77.0.255","To 10.0.9.1, using the 10.77.0.0/24 route","Out of GigabitEthernet0/0"], a:1, why:"10.77.0.0/24 contains 10.77.0.x only, so it does not match 10.77.3.3. The only matching route is the default, which also points at 10.0.9.1. The next hop happens to be the same — but if the /24 were meant to be a /16, this is the kind of mask typo that bites when the default points elsewhere."},
  {lvl:2, q:"R1 has ip route 10.40.0.0 255.255.0.0 GigabitEthernet0/1 on an Ethernet link to R2. R2's G0/1 has no ip proxy-arp. A PC behind R1 pings 10.40.1.1, which is behind R2. What happens?", o:["It works: R1 ARPs for R2's address","It fails: R1 treats 10.40.0.0/16 as directly connected and ARPs for 10.40.1.1 itself; with proxy ARP off, R2 doesn't answer","It works because static routes don't use ARP","IOS rejects the route because a next hop is mandatory"], a:1, why:"An exit-interface-only static makes the router ARP for each final destination. Only proxy ARP on the neighbour would answer with its own MAC. With it disabled, ARP fails and the packets go nowhere. A next hop (or a fully specified route) avoids this."},
  {lvl:2, type:"multi", q:"R5 has ip route 172.18.0.0 255.255.0.0 10.5.5.2, and 10.5.5.2 is on R5's connected network 10.5.5.0/30 on G0/2. Which two events would remove this route from R5's routing table? (Choose two.)", o:["R5's G0/2 goes down","The 10.5.5.0/30 connected route disappears because G0/2's IP address is removed","A server in 172.18.0.0/16 is switched off","The router at 10.5.5.2 reloads while a switch between them keeps R5's G0/2 up","Someone runs copy running-config startup-config"], a:[0,1], why:"A next-hop static stays installed while the next hop resolves. If G0/2 goes down or loses its address, 10.5.5.0/30 leaves the table, 10.5.5.2 no longer resolves, and the static is withdrawn. A dead host beyond doesn't matter, and with a switch keeping G0/2 up, the route stays even though the neighbour is gone."},
  {lvl:2, q:"A branch learns 10.0.0.0/8 from OSPF (AD 110) over the MPLS link. An engineer adds ip route 10.0.0.0 255.0.0.0 172.16.99.1 100 as a 'backup' over a VPN. What happens while MPLS is healthy?", o:["Nothing changes: the OSPF route stays because it was there first","The static (AD 100) beats OSPF (110), so all traffic for 10.0.0.0/8 uses the VPN","Both routes are installed and share the load","The static is rejected because OSPF already has the prefix"], a:1, why:"For an identical prefix, the lower AD wins. 100 < 110, so the static becomes the active route and OSPF's is hidden. To float behind OSPF the static needs an AD above 110, e.g. 200."},
  {lvl:2, type:"fill", q:"Write the command for a backup route to 10.5.0.0/16 through next hop 172.31.0.6 that is used only if the main route (a normal static) disappears. Use administrative distance 210.", fields:[{label:"Command", a:["ip route 10.5.0.0 255.255.0.0 172.31.0.6 210"], ios:true}], why:"Network, mask, next hop, then the distance. 210 is higher than the main static's 1, so this route floats until the main one is withdrawn."},
  {lvl:2, type:"order", q:"R9 has S 172.20.0.0/16 via 10.1.50.254, S 10.1.50.0/24 via 10.1.255.2 and C 10.1.255.0/30 on G0/1. Put R9's steps for a packet to 172.20.4.4 in order.", items:["Longest match for 172.20.4.4: 172.20.0.0/16, next hop 10.1.50.254","Look up 10.1.50.254: it matches 10.1.50.0/24, next hop 10.1.255.2","Look up 10.1.255.2: it matches connected 10.1.255.0/30 on G0/1","ARP for 10.1.255.2 on G0/1 if it isn't cached","Send the frame out G0/1 to 10.1.255.2's MAC address"], why:"A recursive lookup: each answer that is an address is looked up again until a connected route gives an exit interface. The router ARPs only for the immediate next hop, 10.1.255.2, never for 10.1.50.254 or the destination."},
  {lvl:2, q:"An engineer types ip route 192.168.40.70 255.255.255.192 10.0.0.2 and IOS replies %Inconsistent address and mask. What should they type?", o:["ip route 192.168.40.0 255.255.255.192 10.0.0.2","ip route 192.168.40.64 255.255.255.192 10.0.0.2","ip route 192.168.40.70 255.255.255.255 10.0.0.2 only","ip route 192.168.40.128 255.255.255.192 10.0.0.2"], a:1, why:"A /26 mask makes blocks of 64 in the last octet: 0, 64, 128, 192. 192.168.40.70 falls in the block starting at 64, so the network address is 192.168.40.64. IOS refused because .70 has host bits set."},
  {lvl:3, q:"Users can't reach 10.8.0.0/16. Based on the exhibit, why is the route missing from the table?", ex:"R4#show running-config | include ip route\nip route 10.8.0.0 255.255.0.0 10.0.0.6\nip route 10.9.0.0 255.255.0.0 10.0.0.2\n\nR4#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     10.0.0.1        YES manual up                    up\nGigabitEthernet0/1     203.0.113.10    YES manual up                    up\n\nR4#show ip route static\nGateway of last resort is not set\n\n      10.0.0.0/8 is variably subnetted, 3 subnets, 3 masks\nS        10.9.0.0/16 [1/0] via 10.0.0.2", o:["G0/0 is down","The next hop 10.0.0.6 doesn't resolve: if G0/0 is a /30 (10.0.0.0–10.0.0.3), .6 is on no network R4 knows, so the route is never installed — likely a typo for 10.0.0.2","Two static routes can't share one interface","The 10.9.0.0/16 route hides it because it was configured first"], a:1, why:"Both 10.x routes leave by G0/0, which is up/up, and the 10.9 route via 10.0.0.2 is installed — so the interface is fine. The difference is the next hop. 10.0.0.6 isn't on R4's connected 10.0.0.0/30 and R4 has no other route containing it, so it doesn't resolve, and IOS keeps the line in the config but out of the table. 10.8.0.0/16 and 10.9.0.0/16 are different prefixes, so neither hides the other. (Had R4 a default route, IOS would resolve 10.0.0.6 through it and install the route — pointing the wrong way.)"},
  {lvl:3, q:"Ticket: 'Since the new branch went live, staff at 10.44.5.0/24 can't reach the HQ intranet server. The installer's ping from the branch router works.' From the server, a ping to a branch PC returns 'Reply from 10.60.1.1: Destination host unreachable' (10.60.1.1 is the HQ router). What is the cause and the fix?", o:["The branch router has no default route; add one","The HQ router has no route back to 10.44.5.0/24; add a static route for it via the branch router's WAN address","The server's default gateway is wrong; change it","Proxy ARP is disabled at HQ; enable it"], a:1, why:"The HQ router names itself as having no route to the branch PC — the return path is missing. The branch router's ping worked only because it was sourced from its WAN address, which HQ knows as connected. Add the branch LAN route at HQ and test from a branch PC."},
  {lvl:3, q:"A store router has a primary default via its fibre provider's box (G0/1) and a floating default (AD 250) via an LTE router. The provider's network fails beyond the box; the box stays powered. Store users are offline and the floating route never installs. Why, and what is the best fix?", o:["The AD of 250 is too high; lower it to 5","G0/1 stays up and the next hop still resolves, so the primary static is never withdrawn; tie the primary to a reachability test (IP SLA tracking) or use a routing protocol that detects the silent neighbour","Floating statics only work with OSPF","The LTE router needs proxy ARP enabled"], a:1, why:"A static is withdrawn only when its interface goes down or its next hop stops resolving. Neither happens when an intermediate box keeps the link up, so the primary stays and traffic is black-holed. Tracking the primary with probes, or a protocol with hellos, makes the failure visible. Lowering the floating AD to 5 changes nothing — it still loses to AD 1 while the primary is installed."},
  {lvl:3, type:"multi", q:"During a fibre outage, a branch router shows its floating default installed: S* 0.0.0.0/0 [200/0] via the LTE router. Branch users still can't use head-office applications. Which two problems could each explain this? (Choose two.)", o:["Head office has no backup route back to the branch LAN through the LTE/VPN path","Head office's backup route back to the branch is a /25 for half the LAN, so the other half has no way back","The branch's floating route should have AD 1","The branch users' default gateway is the branch router","The branch router's floating default is a next-hop route rather than an exit-interface route"], a:[0,1], why:"Requests now leave over LTE, but replies need a route at head office back to the branch LAN through the backup path. With none, or one that covers only part of the LAN, replies are dropped. AD 1 would make the backup the primary; the gateway being the branch router is normal; and a next-hop route is the right form on Ethernet."},
],
cards:[
  {f:"Static route — what and when", b:"A route typed by hand. Use for stub sites, the default to an ISP, backups (floating) and deliberate exceptions. Zero overhead and predictable, but it doesn't adapt beyond its own interface and next hop."},
  {f:"The three ip route forms", b:"ip route NET MASK NEXT-HOP · ip route NET MASK EXIT-IF · ip route NET MASK EXIT-IF NEXT-HOP (fully specified). Optional distance at the end."},
  {f:"Why not exit-interface-only on Ethernet?", b:"The router treats the network as directly connected and ARPs for every destination. It works only via the neighbour's proxy ARP, fills the ARP table, and fails where proxy ARP is off. Give a next hop."},
  {f:"Recursive lookup", b:"A next-hop route gives an address, not an interface, so the router looks the next hop up again (and again) until a connected route gives the exit interface. The route lives only while every route it relies on does."},
  {f:"Default route", b:"ip route 0.0.0.0 0.0.0.0 NEXT-HOP. Matches every address (a /0 compares no bits), so it's used only when nothing more specific matches. Shown as S* and as Gateway of last resort."},
  {f:"Host route", b:"Mask 255.255.255.255 (/32): one address. Longest match makes it beat any network or default route for that address."},
  {f:"Routing is one-way", b:"Every router on the way there needs a route to the destination; every router on the way back needs a route to the source. Configure both directions."},
  {f:"Missing return route fingerprint", b:"User ping: Request timed out. Server ping back: Destination host unreachable from the router with the gap. User tracert: hop 1, then * * *. Router-sourced ping from the branch: works (it uses the link address); ping … source g0/0 from its LAN: fails."},
  {f:"When is a static installed?", b:"Exit-interface form: while the interface is up/up. Next-hop form: while the next hop resolves through another route. Otherwise it stays in the config but leaves the table, and returns by itself."},
  {f:"Floating static route", b:"Same prefix as the primary, higher AD (e.g. 200 behind OSPF's 110). Hidden until the primary is withdrawn, then installs as S [200/0]. Needs a matching backup route for the return path."},
  {f:"Floating static traps", b:"AD lower than the primary (or left at 1) → it becomes the primary or shares the load. Different prefix length → longest match ignores AD. AD 255 → never installed."},
  {f:"%Inconsistent address and mask", b:"The network address has host bits set for that mask (e.g. 10.1.50.1 255.255.255.0). Work out the real network address (10.1.50.0) and retype."},
  {f:"%Invalid next hop address (it's this router)", b:"The next hop is one of this router's own addresses. Use the neighbour's address on the shared link."},
],
});
// ---------- Module 5 · Lesson 3 ----------
L.push({
id:"ospf-concepts", mins:90, level:"Intermediate · builds on Modules 1–4 and lessons 1–2",
t:"Why dynamic routing — and how OSPF thinks: link state, router IDs, hellos, neighbour states, LSAs, SPF, areas",
html:`
${K.goals([
  "Explain why static routes stop scaling, and what a routing protocol does when a link fails.",
  "Tell distance vector from link state and an IGP from an EGP, and place RIP, EIGRP, OSPF, IS-IS and BGP.",
  "Predict a router's OSPF router ID and list what neighbours' hellos must agree on.",
  "Tell the story of an adjacency from Down to Full, and read the OSPF neighbour, route and database outputs.",
  "Run SPF by hand to find the cost and first hop OSPF will choose, and explain why area 0 is the backbone.",
])}
${K.pre(["Module 5 lessons 1–2: the routing table, administrative distance, longest match and static routes (including floating statics). Module 3: subnets and masks. Comfort with the IOS CLI and <code>show ip route</code>."])}

<h2>Why this matters at work</h2>
<p>An MSP in Lagos runs a microfinance bank's fourteen branches on ${K.g("static routes","Routes typed by hand with ip route (lesson 2).")}. At 02:10 road works cut a fibre and five branches lose head office. The on-call engineer edits statics on six routers to use the backup radio links, mistypes one mask, and knocks a sixth branch offline. Later, every route goes back by hand.</p>
<p>With a ${K.g("dynamic routing protocol","Software that finds neighbouring routers, swaps routes with them and recalculates by itself when things change.")} such as OSPF, the routers notice the cut themselves, move traffic within seconds to a minute, and move it back when the fibre returns. OSPF is the most common routing protocol in company networks, and &ldquo;how do two OSPF routers become neighbours?&rdquo; is a favourite interview question. This lesson is how OSPF thinks; lesson 4 is how you configure it.</p>

<h2>Why dynamic routing — and the two ways routers learn routes</h2>
<p>Static routes (lesson 2) suit a small site or a single default route. They break down in two ways as a network grows.</p>
<p><b>Scale.</b> Every router needs a route to every network it isn't connected to. Ten routers with four networks each: 9 × 4 = <b>36</b> statics per router, <b>360</b> in total. One new subnet means logging in to nine routers.</p>
<p><b>Failure.</b> A static stays while its exit interface is up or its next hop resolves — neither proves the <i>far side</i> works. If a branch reaches head office through an ISP's switch and head office's router dies, the branch's port stays up, the static stays, and traffic vanishes into a ${K.g("black hole","A path that silently drops traffic while the route looks fine.")}.</p>
<p>A routing protocol runs on every router and repeats one loop:</p>
${K.remember(`<b>Find</b> neighbours → <b>share</b> what you know → <b>compute</b> the best paths → <b>install</b> the winners (if their ${K.g("AD","Administrative distance: trust in a route source; for the same prefix, lower wins (lesson 1).")} beats other sources for the same prefix) → on any change, <b>repeat</b>. Forwarding still follows lesson 1: <b>longest match first; same prefix, lower AD wins; same protocol, lower metric wins.</b>`)}
<p>The time routers take to agree on new paths after a change is ${K.g("convergence","All routers agreeing on the new best paths after a change, and the time it takes.")}: shorter means a smaller outage. The price: CPU, memory, protocol traffic, and something to secure (a rogue OSPF router can inject routes).</p>
${K.when([
  ["Static routes", "A small site, a stub with one exit, a default to an ISP", "Predictable; nothing to secure", "Many networks or paths: every change needs a human"],
  ["OSPF", "Many routers and subnets, redundant links that must fail over alone", "Finds neighbours and reroutes by itself; scales well", "A tiny site, where it only adds moving parts"],
  ["Both", "OSPF inside, a static default at the edge, a floating static as last resort", "Each where it's strongest; AD decides (static 1 beats OSPF 110)", "You can't say which source wins for each prefix"],
])}
<h3>IGP or EGP</h3>
<p>An autonomous system (${K.g("AS","Autonomous system: a network under one organisation's routing policy, such as a company or ISP.")}) is a network under one organisation's control. An ${K.g("IGP","Interior Gateway Protocol: routes inside one autonomous system — OSPF, EIGRP, RIP, IS-IS.")} routes <b>inside</b> an AS and hunts for the best path — OSPF, EIGRP, ${K.g("RIP","Routing Information Protocol: an old, simple distance-vector IGP that counts hops (maximum 15).")} and IS-IS are IGPs. An ${K.g("EGP","Exterior Gateway Protocol: routes between autonomous systems. Today that means BGP.")} routes <b>between</b> autonomous systems, by policy. The one EGP in use is ${K.g("BGP","Border Gateway Protocol: exchanges routes between autonomous systems — the protocol of the internet. Later in the course.")}, which holds the internet together; ISPs such as MainOne and MTN run it, and you'll meet it later in the course.</p>
<div class="tablewrap"><table>
<tr><th>Protocol</th><th>Kind</th><th>Family</th><th>Metric</th><th>Cisco AD</th></tr>
<tr><td>RIP v2</td><td>IGP</td><td>Distance vector</td><td>Hop count (max 15)</td><td>120</td></tr>
<tr><td>EIGRP</td><td>IGP</td><td>Advanced distance vector (Cisco)</td><td>Bandwidth and delay</td><td>90 internal, 170 external</td></tr>
<tr><td>OSPF</td><td>IGP</td><td>Link state</td><td>Cost</td><td>110</td></tr>
<tr><td>IS-IS</td><td>IGP</td><td>Link state</td><td>Cost</td><td>115</td></tr>
<tr><td>BGP</td><td>EGP</td><td>Path vector</td><td>Policy attributes</td><td>20 external, 200 internal</td></tr>
</table></div>
<h3>Rumours or a map: distance vector vs link state</h3>
<p><b>Distance vector</b> (RIP; EIGRP in an advanced form): each router tells its neighbours &ldquo;these networks, this far&rdquo;; they add their own distance and pass it on. Nobody sees the whole network. Classic RIP sends its whole table every 30 seconds, so bad news travels one router per update, and meanwhile packets can circle in a ${K.g("routing loop","Packets passed round between routers that each think the other is the way, until their TTL runs out.")}; split horizon, route poisoning and hold-down timers keep that in check.</p>
<p><b>Link state</b> (OSPF, IS-IS): each router describes only <i>its own links</i>, and that description is copied unchanged to <b>every</b> router in the area. Everyone holds the same map — the ${K.g("LSDB","Link-State Database: every router's copy of the area's map.")} — and calculates paths personally with the ${K.g("SPF","Shortest Path First: Dijkstra's algorithm, run on the LSDB to find the lowest-cost path to every network.")} algorithm. When a link fails, the routers beside it flood new descriptions at once and everyone recalculates.</p>
${K.analogy(`<p><b>Distance vector is directions by word of mouth:</b> &ldquo;go through Kaduna — Musa told me&rdquo;. If that road closed yesterday, you find out when you get there. <b>Link state is everyone carrying the same live map:</b> each town reports its own roads, every driver gets every report, and each plans the route personally.</p>`)}
${K.svg("0 0 740 290",
  K.band(10,8,350,26,"DISTANCE VECTOR — routing by rumour")+
  K.dev("router",60,110,"R1","")+K.dev("router",185,110,"R2","")+K.dev("router",310,110,"R3","LAN 10.3.0.0/24")+
  K.link(84,110,161,110)+K.link(209,110,286,110)+
  K.arrow(290,84,212,84,"“10.3 is 0 away”",true)+K.arrow(165,84,88,84,"“10.3 is 1 away”",true)+
  K.txt(185,205,"R1 only knows: “10.3.0.0 → via R2, 2 hops”",{mid:true,c:"fg",s:11})+
  K.txt(185,225,"it never sees R3's links — it trusts R2",{mid:true,s:10.5})+
  K.band(390,8,340,26,"LINK STATE — everyone holds the same map")+
  K.dev("router",440,110,"R1","")+K.dev("router",560,80,"R2","")+K.dev("router",680,110,"R3","")+
  K.link(464,106,536,84)+K.link(584,84,656,106)+K.link(464,114,656,114)+
  K.box(410,190,90,46,"LSDB","same map")+K.box(515,190,90,46,"LSDB","same map")+K.box(620,190,90,46,"LSDB","same map")+
  K.arrow(440,150,455,186,"",true)+K.arrow(560,124,560,186,"",true)+K.arrow(680,150,665,186,"",true)+
  K.txt(560,268,"each router floods its own links; each runs SPF itself",{mid:true,s:10.5}),
  "Left: R1 knows 10.3.0.0 only from R2's report. Right: every router receives every router's links, builds the same map (the LSDB) and computes paths itself.")}
${K.check({q:"Six routers each have 5 networks of their own, all routed with statics. How many static routes does each router need?", o:["5","25","30","150"], a:1, why:"5 other routers × 5 networks = 25 each, 150 in all — and every new subnet touches five routers."})}
<p><b>Same logic, new situation.</b></p>
${K.hint(`What keeps a next-hop static in the table (lesson 2)? Does a router two boxes away losing power change that?`)}
${K.reveal("BR-9 has ip route 10.20.0.0 255.255.0.0 10.0.9.1 towards head office, across an ISP's switch. Head office's router (10.0.9.1) loses power. What happens — and what would OSPF do?",`<ol>
<li><b>What is asked?</b> Is the static withdrawn when its next-hop router dies?</li>
<li><b>Which rule?</b> A next-hop static stays while the next hop resolves — here via BR-9's connected 10.0.9.0 route, alive while BR-9's own port is up.</li>
<li><b>Apply it.</b> The port is still plugged into the ISP's switch, so both routes stay. ARP for 10.0.9.1 gets no answer; packets drop. A black hole behind a healthy table.</li>
<li><b>OSPF:</b> hellos stop; after 40 seconds the neighbour is dead, its routes are removed and SPF finds another path — or leaves room for a floating static.</li>
</ol>`)}

<h2>How OSPF meets its neighbours: router IDs, hellos and the rules that must match</h2>
<p>OSPF in five steps; the rest of the lesson takes them one at a time:</p>
${K.steps([
  ["Pick a router ID", "A 32-bit name, written like an IPv4 address."],
  ["Say hello", "Hellos on every OSPF interface find other routers and check their settings."],
  ["Synchronise the map", "Swap databases with each suitable neighbour until identical: fully adjacent."],
  ["Run SPF", "Find the cheapest path to every network, with itself at the root."],
  ["Install and watch", "Winners go in the table as <code>O</code> routes; changes are flooded and everyone recalculates."],
])}
<h3>Step 1 — the router ID</h3>
<p>The ${K.g("router ID (RID)","A 32-bit number written like an IPv4 address that names an OSPF router. Must be unique.")} looks like an IP address, but nothing is sent <i>to</i> it: it labels every OSPF packet and piece of the map, and <code>show ip ospf neighbor</code> lists neighbours by it. <b>It must be unique.</b> IOS picks it when the process starts:</p>
${K.steps([
  ["1. The <code>router-id</code> command", "If configured under <code>router ospf</code>, it always wins."],
  ["2. Highest IP on an up loopback", "Otherwise the highest address on any up "+K.g("loopback interface","A virtual interface (interface loopback 0) with no cable, so it never goes down by itself.")+"."],
  ["3. Highest IP on an up physical interface", "Otherwise the highest address on any up interface. A shut interface doesn't count."],
])}
${K.remember(`<b>Configured → Loopback → Physical</b> — &ldquo;<b>C</b>isco <b>L</b>ikes <b>P</b>redictability.&rdquo; And the half people forget: <b>chosen at process start, then fixed</b>. A new loopback or a late <code>router-id</code> changes nothing until <code>clear ip ospf process</code> or a reload.`)}
<p>Why so stubborn? Changing the RID tears down every adjacency, so IOS makes you ask:</p>
${K.out(`PH-R3(config)#router ospf 1
PH-R3(config-router)#router-id 10.255.0.31
% OSPF: Reload or use "clear ip ospf process" command, for this to take effect
PH-R3(config-router)#end
PH-R3#clear ip ospf process
Reset ALL OSPF processes? [no]: yes
PH-R3#show ip protocols | include Router ID
  Router ID 10.255.0.31`, "A RID was already in use, so router-id waits for clear ip ospf process — which rebuilds every adjacency: maintenance-window work on a live network.")}
<p>The <b>1</b> in <code>router ospf 1</code> is a ${K.g("process ID","The N in router ospf N: a local label. Neighbours don't need the same number.")}: local, so neighbours needn't match. Good practice: a loopback on every router, and <code>router-id</code> set to its address explicitly.</p>
${K.mistake(`Expecting a new loopback to change the RID. Someone adds <code>interface loopback 0</code> to &ldquo;get a proper RID&rdquo;; <code>show ip protocols</code> still shows the old address. Nothing is broken — it changes at the next restart or reload, possibly months later, at a bad moment.`)}
<h3>Try it: watch a router choose its RID</h3>
<p>A new branch router in Kano. Predict its RID from <code>show ip interface brief</code>, then prove the rules.</p>
${K.hint(`Only <b>up</b> interfaces count: read the Status column first. <code>do</code> runs a show command inside configuration mode.`)}
${K.term({env:"ios2", title:"KAN-R5 — predict, then pin, the router ID", opts:{kind:"router", host:"KAN-R5", model:"ISR 1111", motd:"KAN-R5 — Kano branch router. Gi0/0 branch LAN, Gi0/1 WAN to Abuja, Gi0/2 old guest network (shut). No OSPF yet."},
  setup:env=>{ ["en","conf t","int g0/0","ip address 10.50.0.1 255.255.255.0","no shut","int g0/1","ip address 172.16.56.1 255.255.255.252","no shut","int g0/2","ip address 192.168.99.1 255.255.255.0","shutdown","end","disable"].forEach(c=>env.exec(c)); env.history.length = 0; env.log.length = 0; },
  intro:"Start with <code>enable</code>. Predict the RID before task 2 shows it to you.",
  tasks:[
    {text:"<code>enable</code>, then <code>show ip interface brief</code>. Which interfaces are up, and which address is the highest of those?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+int\S*\s+br/i.test(h))},
    {text:"Start OSPF: <code>configure terminal</code>, then <code>router ospf 1</code>. Run <code>do show ip protocols</code> and find <code>Router ID 172.16.56.1</code> — the highest <i>up</i> address. Gi0/2's 192.168.99.1 is higher, but it's shut", done:e=>e.log.some(l=>/Router ID 172\.16\.56\.1/.test(l.out))},
    {text:"Add the planned loopback: <code>interface loopback 0</code>, <code>ip address 10.255.0.5 255.255.255.255</code>, then <code>do show ip protocols</code> again. The RID is <b>still</b> 172.16.56.1 — OSPF is already running", done:e=>{ const i = e.log.findIndex(l=>/^\s*ip\s+add\S*\s+10\.255\.0\.5\s/i.test(l.cmd||"")); return i>-1 && e.log.slice(i+1).some(l=>/Router ID 172\.16\.56\.1/.test(l.out)); }},
    {text:"Pin it the professional way: back under <code>router ospf 1</code>, type <code>router-id 10.255.0.5</code> and read the message IOS prints", done:e=>e.log.some(l=>/Reload or use "clear ip ospf process"/.test(l.out))},
    {text:"<code>end</code>, then <code>clear ip ospf process</code> and answer <code>yes</code> (it restarts OSPF). Check <code>show ip protocols</code>: <code>Router ID 10.255.0.5</code>", done:e=>e.ospf && e.ospf.rid==="10.255.0.5" && e.log.some(l=>/Router ID 10\.255\.0\.5/.test(l.out))},
    {text:"Turn OSPF on for the WAN link: under <code>interface g0/1</code> type <code>ip ospf 1 area 0</code> (it adds this interface to OSPF process 1 in area 0 — lesson 4 explains this and the other way, the <code>network</code> command). Then <code>do show ip ospf interface g0/1</code> (it shows OSPF's view of that interface: area, cost, timers, neighbours — explained in the next section) and find <code>Area 0</code>, <code>Cost: 1</code> and <code>Hello 10, Dead 40</code>", done:e=>e.intfs["GigabitEthernet0/1"].ospfArea && e.log.some(l=>/Hello 10, Dead 40/.test(l.out) && /10\.255\.0\.5/.test(l.out))},
    {text:"Save the configuration", done:e=>e.savedOnce},
  ],
  win:"You predicted a router ID from the interface table, proved that a shut interface doesn't count and that a new loopback changes nothing while OSPF runs, then pinned the RID with router-id and a process restart — exactly how it's done on a live network.",
  solve:["enable","show ip interface brief","configure terminal","router ospf 1","do show ip protocols","interface loopback 0","ip address 10.255.0.5 255.255.255.255","do show ip protocols","router ospf 1","router-id 10.255.0.5","end","clear ip ospf process","yes","show ip protocols","configure terminal","interface g0/1","ip ospf 1 area 0","do show ip ospf interface g0/1","end","copy running-config startup-config",""]})}
<h3>Step 2 — hellos</h3>
<p>Every OSPF interface sends a ${K.g("hello","A small OSPF packet sent regularly to find neighbours, check their settings and prove they're alive.")} every <b>10 seconds</b> (Ethernet and point-to-point) to the ${K.g("multicast","One packet to a group of receivers that asked for it, using an address in 224.0.0.0–239.255.255.255.")} address <b>224.0.0.5</b>, &ldquo;all OSPF routers on this link&rdquo;. OSPF rides directly in IP as protocol 89. (224.0.0.6 reaches only a LAN's designated router and its backup — lesson 5.) The hello is also a heartbeat: silence for the <b>dead interval</b> — 40 seconds, four hellos — and the neighbour is declared dead. If your own interface goes down, OSPF knows at once.</p>
<div class="tablewrap"><table>
<tr><th>In the hello</th><th>Must it match?</th></tr>
<tr><td>Router ID</td><td>Must be <b>different</b></td></tr>
<tr><td>Area ID</td><td><b>Yes</b></td></tr>
<tr><td>Hello and dead intervals</td><td><b>Yes</b>, both</td></tr>
<tr><td>Network mask (and same subnet)</td><td><b>Yes</b> on Ethernet links</td></tr>
<tr><td>Authentication</td><td><b>Yes</b>, type and key</td></tr>
<tr><td>Stub area flag</td><td><b>Yes</b> (stub areas are beyond the CCNA)</td></tr>
<tr><td>Priority, designated router (DR), backup DR (BDR)</td><td>No — election details (lesson 5)</td></tr>
<tr><td>List of neighbours heard</td><td>No — but it proves the other side hears you</td></tr>
</table></div>
<p>Each check protects the shared map (different areas are different maps; different timers disagree on when a router is dead). Fail one and the hello is <b>ignored</b>, usually without a log message (an area mismatch is an exception — see the areas section) — often the only symptom is an empty neighbour table. Process ID, cost and priority needn't match. The ${K.g("MTU","Maximum Transmission Unit: the largest packet an interface sends without fragmenting — normally 1500 bytes on Ethernet.")} is checked later, in the database exchange.</p>
${K.remember(`<b>&ldquo;Happy Dogs Always Accept Small Snacks&rdquo;</b> — <b>H</b>ello, <b>D</b>ead, <b>A</b>rea, <b>A</b>uthentication, <b>S</b>ubnet/mask, <b>S</b>tub flag. Plus: RIDs unique, MTU equal.`)}
${K.out(`ABJ-CORE#show ip ospf interface g0/1
GigabitEthernet0/1 is up, line protocol is up
  Internet Address 172.16.12.1/30, Interface ID 2, Area 0
  Attached via Network Statement
  Process ID 1, Router ID 10.0.0.1, Network Type BROADCAST, Cost: 1
  ...
  Transmit Delay is 1 sec, State BDR, Priority 1
  Designated Router (ID) 10.0.0.2, Interface address 172.16.12.2
  Backup Designated router (ID) 10.0.0.1, Interface address 172.16.12.1
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
  ...
  Neighbor Count is 1, Adjacent neighbor count is 1
    Adjacent with neighbor 10.0.0.2  (Designated Router)`, "On ABJ-CORE, the Abuja head-office router (some lines trimmed): subnet, mask, area, RID, cost, timers and the neighbour count.")}
<p>Ethernet defaults to the <code>BROADCAST</code> network type, so even a two-router /30 elects a DR and BDR (lesson 5) — job titles, for now. <code>Neighbor Count is 0</code> on an up link is your cue to compare both ends' lines.</p>
${K.mistake(`Changing timers on one end only. <code>ip ospf hello-interval 5</code> on one side &ldquo;for faster failover&rdquo; also moves its dead interval to 20; the far end still says 10/40, and the adjacency drops. Timers change on <b>both</b> ends together (lesson 6).`)}
${K.q({type:"multi", q:"RTR-A and RTR-B share a /30 Ethernet link. Which four settings must agree for them to become OSPF neighbours? (Choose four.)", o:["Area ID","Hello and dead intervals","OSPF process ID","Subnet and mask on the link","Router ID","Authentication settings","Interface cost"], a:[0,1,3,5], why:"Area, timers, subnet/mask and authentication are checked in every hello. The process ID is local, router IDs must differ, and each side uses its own cost."})}
<p><b>Same logic, new situation.</b></p>
${K.hint(`Run the hello checks, then the uniqueness rule. Which listed difference never matters?`)}
${K.reveal("A second data-centre router, DC-CORE2, was built by pasting DC-CORE1's configuration and changing only the IP addresses, then cabled to DC-CORE1. They never become neighbours. DC-CORE2 runs router ospf 10, DC-CORE1 router ospf 1; timers, area and masks match. Why?",`<ol>
<li><b>What is asked?</b> Why the neighbour is missing when the obvious settings agree.</li>
<li><b>Which rules?</b> The hello checks and unique RIDs. Process IDs never matter.</li>
<li><b>Apply it.</b> Ignore 10 vs 1. A pasted config copies the <code>router-id</code> line: each router hears a hello carrying its <i>own</i> RID, logs <code>%OSPF-4-DUP_RTRID_NBR</code> and refuses the adjacency.</li>
<li><b>Fix:</b> a unique <code>router-id</code> on DC-CORE2, then <code>clear ip ospf process</code> there.</li>
</ol><p>(If the twins weren't neighbours — two branches copied from each other, both cabled only to a hub — the adjacencies would form, but the two would keep re-flooding &ldquo;their&rdquo; piece of the shared map over each other; IOS typically logs <code>%OSPF-4-FLOOD_WAR</code> on the twins and routes flap. Same cause, same fix.)</p>`)}
${K.check({q:"No router-id is configured. Interfaces: Loopback0 10.1.1.1 (up), Loopback1 172.16.0.9 (up), Gi0/0 192.168.200.1 (up), Gi0/1 203.0.113.9 (administratively down). OSPF starts now. What is the RID?", o:["203.0.113.9","192.168.200.1","172.16.0.9","10.1.1.1"], a:2, why:"The highest up loopback wins, even over higher physical addresses — which count only if no loopback is up. Gi0/1 is shut anyway."})}

<h2>From strangers to FULL: the neighbour states as a story</h2>
<p>Two routers pass through a series of ${K.g("neighbour states","The stages from first hello to identical maps: Down, Init, 2-Way, ExStart, Exchange, Loading, Full.")} on the way to sharing a map; a neighbour stuck in one tells you which part failed. The five packets they use:</p>
<div class="tablewrap"><table>
<tr><th>Type</th><th>Packet</th><th>In plain words</th></tr>
<tr><td>1</td><td>Hello</td><td>&ldquo;I'm here; my settings; the routers I hear.&rdquo;</td></tr>
<tr><td>2</td><td>${K.g("DBD","Database Description: the headers of the LSAs a router holds — a table of contents.")}</td><td>&ldquo;The table of contents of my map.&rdquo;</td></tr>
<tr><td>3</td><td>${K.g("LSR","Link-State Request: asks for LSAs you lack or hold an older copy of.")}</td><td>&ldquo;Send me these pages.&rdquo;</td></tr>
<tr><td>4</td><td>${K.g("LSU","Link-State Update: carries complete LSAs.")}</td><td>&ldquo;Here they are.&rdquo; (Also floods later changes.)</td></tr>
<tr><td>5</td><td>${K.g("LSAck","Link-State Acknowledgement: confirms LSAs arrived, making flooding reliable.")}</td><td>&ldquo;Got them.&rdquo;</td></tr>
</table></div>
<p><code>GARKI</code> (RID 10.0.0.2) is cabled to <code>ABJ-CORE</code> (RID 10.0.0.1). From ABJ-CORE's side:</p>
${K.steps([
  ["Down", "Nothing heard yet (or silence for the dead interval)."],
  ["Init — &ldquo;I hear you&rdquo;", "A matching hello arrives, but its neighbour list doesn't include 10.0.0.1 yet."],
  ["2-Way — &ldquo;we hear each other&rdquo;", "<code>GARKI</code>'s next hello lists 10.0.0.1: <b>neighbours</b>. On Ethernet the DR and BDR are chosen now; on a busy LAN, routers that are neither stop here on purpose (lesson 5)."],
  ["ExStart — &ldquo;who leads?&rdquo;", "The higher RID (10.0.0.2) becomes <i>master</i> and sets the sequence numbers."],
  ["Exchange", "DBDs list every "+K.g("LSA","Link-State Advertisement: one piece of the OSPF map (next section).")+" each side holds, headers only; each notes what it lacks."],
  ["Loading", "LSRs ask, LSUs deliver, acknowledgements confirm — both ways."],
  ["Full", "Identical databases: <b>fully adjacent</b>. IOS logs <code>%OSPF-5-ADJCHG ... from LOADING to FULL, Loading Done</code>; both run SPF."],
])}
${K.svg("0 0 720 400",
  K.dev("router",110,36,"ABJ-CORE","RID 10.0.0.1")+K.dev("router",610,36,"GARKI","RID 10.0.0.2")+
  K.link(110,90,110,390,"",true)+K.link(610,90,610,390,"",true)+
  K.arrow(112,112,606,112,"Hello (neighbours seen: none)",true)+
  K.arrow(606,142,114,142,"Hello (neighbours seen: 10.0.0.1)",true)+
  K.arrow(112,180,606,180,"DBD — I'll lead? (RID 10.0.0.1)")+K.arrow(606,206,114,206,"DBD — no, I lead (10.0.0.2 is higher)")+
  K.arrow(112,240,606,240,"DBD — my table of contents",true)+K.arrow(606,266,114,266,"DBD — mine",true)+
  K.arrow(112,300,606,300,"LSR — send me these")+K.arrow(606,326,114,326,"LSU — here they are")+K.arrow(112,352,606,352,"LSAck — got them")+
  K.txt(10,116,"Init",{c:"accent",b:true})+K.txt(10,146,"2-Way",{c:"accent",b:true})+K.txt(10,196,"ExStart",{c:"accent",b:true})+K.txt(10,256,"Exchange",{c:"accent",b:true})+K.txt(10,326,"Loading",{c:"accent",b:true})+K.txt(10,388,"Full",{c:"ok",b:true})+
  K.txt(360,388,"identical LSDBs → both run SPF → O routes appear",{mid:true,c:"ok",s:11}),
  "The adjacency from ABJ-CORE's side. Seeing its own RID in the neighbour's hello means 2-Way; the higher RID leads the exchange. (Requests in the other direction are left out.)")}
${K.remember(`&ldquo;<b>D</b>id <b>I</b> <b>T</b>ell <b>E</b>veryone <b>E</b>verything? <b>L</b>oading… <b>F</b>ull.&rdquo; The first three states are <b>finding</b> each other; the last four are <b>copying the map</b>. 2-Way = <b>neighbours</b>; Full = <b>adjacent</b>.`)}
${K.out(`ABJ-CORE#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
10.0.0.2          1   FULL/DR         00:00:37    172.16.12.2     GigabitEthernet0/1
10.0.0.3          1   FULL/DR         00:00:33    172.16.13.2     GigabitEthernet0/2`, "Two fully adjacent neighbours, one per WAN link.")}
<ul>
<li><b>Neighbor ID</b> — the neighbour's router ID, not an interface address. <b>Pri</b> — its priority on the link (lesson 5).</li>
<li><b>State</b> — adjacency state / neighbour's role: <code>FULL/DR</code> is &ldquo;fully adjacent with the designated router&rdquo;; <code>-</code> on point-to-point links.</li>
<li><b>Dead Time</b> — counts down from 40, resets with each hello; at zero the neighbour is dead.</li>
<li><b>Address</b>, <b>Interface</b> — the neighbour's IP (your next hop in <code>show ip route</code>) and your interface towards it.</li>
</ul>
<div class="tablewrap"><table>
<tr><th>Stuck in…</th><th>Meaning</th><th>Usual cause</th></tr>
<tr><td>(not listed)</td><td>No acceptable hello</td><td>A hello check fails, interface passive or not in OSPF, Layer 1/2 fault</td></tr>
<tr><td><code>INIT</code></td><td>I hear you; you don't hear me</td><td>Hellos pass one way only</td></tr>
<tr><td><code>2WAY</code></td><td>Neighbours, not adjacent</td><td>Normal between two ${K.g("DROTHERs","Routers on a LAN that are neither the DR nor the BDR (lesson 5).")} on a LAN (lesson 5)</td></tr>
<tr><td><code>EXSTART</code> / <code>EXCHANGE</code></td><td>Can't copy the map</td><td><b>MTU mismatch</b></td></tr>
<tr><td>FULL → DOWN</td><td>Adjacency lost</td><td>Log reason: <code>Interface down or detached</code> (my link) or <code>Dead timer expired</code> (hellos stopped)</td></tr>
</table></div>
<p><b>In this course's lab</b> OSPF converges instantly and MTU isn't modelled, so <code>show ip ospf neighbor</code> only ever shows <code>FULL</code> (or <code>2WAY</code> between DROTHERs, lesson 5); a neighbour that fails a check simply isn't listed. On real routers the other states flash past in seconds — and one that sticks points straight at the fault, which is why this table is worth knowing.</p>
${K.q({type:"order", q:"Put the OSPF neighbour states in order.", items:["Down","Init","2-Way","ExStart","Exchange","Loading","Full"], why:"Down → Init (heard, not listed) → 2-Way (listed: neighbours) → ExStart (master by higher RID) → Exchange (DBDs) → Loading (LSR/LSU/LSAck) → Full (identical LSDBs)."})}
<p><b>Same logic, new situation.</b></p>
${K.hint(`Which half of the story did they finish? What gets bigger between hellos and DBDs?`)}
${K.reveal("A new VPN link has ip mtu 1400 on one router and 1500 on the other. One side shows 10.255.0.9 EXSTART/DR for many minutes, the other EXCHANGE. Pings across the link work. What's going on?",`<ol>
<li><b>What is asked?</b> Why the adjacency stalls when connectivity works.</li>
<li><b>Which rule?</b> Reaching ExStart proves the hellos matched; ExStart/Exchange is where DBDs flow and MTU is checked.</li>
<li><b>Apply it.</b> The MTUs disagree, so the exchange never completes. Small pings fit either MTU. Textbook MTU fingerprint.</li>
<li><b>Fix:</b> the same MTU on both ends (lesson 6).</li>
</ol>`)}
${K.check({q:"R1 shows R2 in INIT, and it never moves on. What does that tell you?", o:["An MTU mismatch","R1 hears R2's hellos, but R2's hellos don't list R1 — R2 isn't hearing R1","Both are DROTHERs on a LAN, which is normal","The adjacency is complete but no routes are exchanged"], a:1, why:"Init means hellos pass one way only. MTU problems show as ExStart/Exchange; DROTHERs sit at 2-Way."})}

<h2>LSAs, the LSDB and SPF: building the map and finding the best path</h2>
<p>An ${K.g("LSA","Link-State Advertisement: one piece of the OSPF map, labelled with its creator's RID and a sequence number.")} is one piece of the map: each router writes its own and floods it. An area's LSAs together form the LSDB.</p>
${K.remember(`<b>Same map, different &ldquo;you are here&rdquo;:</b> every router in an area holds an <b>identical</b> LSDB, but runs SPF with <b>itself at the root</b>, so each gets its own routing table.`)}
<div class="tablewrap"><table>
<tr><th>Type</th><th>Name</th><th>Created by</th><th>Says</th></tr>
<tr><td>1</td><td>Router LSA</td><td>Every router</td><td>&ldquo;I am RID X; my links in this area and their costs.&rdquo;</td></tr>
<tr><td>2</td><td>Network LSA</td><td>The DR of each shared segment</td><td>&ldquo;This segment exists; these routers are on it.&rdquo;</td></tr>
<tr><td>3</td><td>Summary LSA</td><td>An area border router</td><td>Other areas' networks → <code>O IA</code> (lesson 6)</td></tr>
<tr><td>5</td><td>External LSA</td><td>A router injecting outside routes</td><td>E.g. a default → <code>O*E2</code> (lesson 4)</td></tr>
</table></div>
<p>On a change, the owner floods a new copy with a <b>higher sequence number</b>; newer replaces older, and every copy is acknowledged. Unchanged LSAs are refreshed every 30 minutes and removed at an hour old. Unlike RIP's table every 30 seconds, OSPF's routine chatter is only small hellos.</p>
${K.out(`ABJ-CORE#show ip ospf database

            OSPF Router with ID (10.0.0.1) (Process ID 1)

                Router Link States (Area 0)

Link ID         ADV Router      Age         Seq#       Checksum Link count
10.0.0.1        10.0.0.1        261         0x80000003 0x000002 4
10.0.0.2        10.0.0.2        262         0x80000004 0x000004 4
10.0.0.3        10.0.0.3        263         0x80000005 0x000006 4

                Net Link States (Area 0)

Link ID         ADV Router      Age         Seq#       Checksum
172.16.12.2     10.0.0.2        902         0x80000004 0x000C04
172.16.13.2     10.0.0.3        1158        0x80000005 0x000D05
172.16.23.2     10.0.0.3        718         0x80000005 0x001705`, "The LSDB in a three-router triangle (<code>ABJ-CORE</code>, <code>GARKI</code>, <code>WUSE</code>). The other two hold exactly the same list.")}
<ul>
<li><b>Router Link States</b> — type 1, one per router: three routers. <code>Link ID</code> and <code>ADV Router</code> are the RID; <b>Link count 4</b> = two WAN links, a LAN, a loopback. <b>Seq#</b> rises with each new version.</li>
<li><b>Net Link States</b> — type 2, one per Ethernet segment with a DR: <code>Link ID</code> is the DR's interface address, <code>ADV Router</code> its RID.</li>
</ul>
<h3>Cost</h3>
<p>OSPF's metric is ${K.g("cost","OSPF's metric: reference bandwidth ÷ interface bandwidth, minimum 1, summed along the path.")}, set per interface:</p>
${K.remember(`<b>Cost = 100 Mb/s ÷ interface bandwidth</b>, rounded down, <b>never below 1</b>. A route's metric = the <b>sum of the outgoing interface costs</b> to the network, including the last router's interface onto it.`)}
<div class="tablewrap"><table>
<tr><th>Bandwidth</th><th>10 Mb/s</th><th>T1 1.544 Mb/s</th><th>100 Mb/s</th><th>1 Gb/s</th><th>10 Gb/s</th></tr>
<tr><td>Default cost</td><td>10</td><td>64</td><td>1</td><td>1</td><td>1</td></tr>
</table></div>
<p>FastEthernet, Gigabit and 10-Gigabit all cost 1 — OSPF can't tell them apart until lesson 6's <code>auto-cost reference-bandwidth</code>. In the triangle, ABJ-CORE reaches <code>GARKI</code>'s LAN at <code>[110/2]</code>: 1 out of its Gi0/1 plus 1 out of <code>GARKI</code>'s LAN interface; 110 is OSPF's AD.</p>
${K.out(`ABJ-CORE#show ip route ospf
...
      10.0.0.0/32 is subnetted, 3 subnets
O        10.0.0.2 [110/2] via 172.16.12.2, 00:40:58, GigabitEthernet0/1
O        10.0.0.3 [110/2] via 172.16.13.2, 00:40:59, GigabitEthernet0/2
      172.16.0.0/16 is variably subnetted, 5 subnets, 2 masks
O        172.16.23.0/30 [110/2] via 172.16.12.2, 00:20:37, GigabitEthernet0/1
                        [110/2] via 172.16.13.2, 00:20:37, GigabitEthernet0/2
O     192.168.20.0/24 [110/2] via 172.16.12.2, 00:35:35, GigabitEthernet0/1
O     192.168.30.0/24 [110/2] via 172.16.13.2, 00:43:36, GigabitEthernet0/2`, "Legend trimmed. Loopbacks arrive as /32 host routes. The two /24 LANs are whole classful networks, so they print without a heading.")}
<p>Each <code>O</code> line: prefix, <code>[AD/cost]</code>, next hop (the neighbour's address), exit interface. 172.16.23.0/30 has two equal-cost next hops: ${K.g("ECMP","Equal-Cost Multi-Path: tied best paths are all installed and share traffic.")}, lesson 6.</p>
<h3>SPF by hand: Dijkstra's algorithm</h3>
<p>SPF is just &ldquo;always extend the cheapest path you know so far&rdquo;. R1's map (each link has one cost; R5's LAN costs 1):</p>
${K.svg("0 0 700 300",
  K.link(80,150,250,60,"10")+K.link(80,150,250,240,"2")+K.link(250,240,250,60,"5")+K.link(250,240,430,150,"3")+K.link(250,60,430,150,"1")+K.link(430,150,600,60,"4")+K.link(250,60,600,60,"2")+K.link(600,60,690,60,"")+
  K.dev("router",80,150,"R1","root (you)")+K.dev("router",250,60,"R2","")+K.dev("router",250,240,"R3","")+K.dev("router",430,150,"R4","")+K.dev("router",600,60,"R5","LAN · cost 1")+
  K.txt(690,30,"10.5.0.0/24",{c:"accent",s:10.5,end:true}),
  "R1's LSDB as a graph; numbers are link costs. R1–R2 is direct but costs 10.")}
${K.steps([
  ["Start", "R1 = 0, done. Tentative: R2 = 10, R3 = 2."],
  ["Cheapest: R3 (2) — done", "Through R3: R4 = 5; R2 = 2 + 5 = <b>7</b>, beats 10."],
  ["Cheapest: R4 (5) — done", "Through R4: R2 = 5 + 1 = <b>6</b>, beats 7; R5 = 9."],
  ["Cheapest: R2 (6) — done", "Through R2: R5 = 6 + 2 = <b>8</b>, beats 9."],
  ["Cheapest: R5 (8) — done", "Nothing left. R5's LAN = 8 + 1 = <b>9</b>."],
  ["Install", "Every best path leaves via R3: R2's networks at 6, R5's LAN <code>[110/9]</code>."],
])}
<p>R1 has a <b>direct</b> link to R2 yet takes a three-router detour, because 2 + 3 + 1 = 6 beats 10. <b>OSPF chooses the lowest total cost, not the fewest hops.</b> The table keeps only the first hop; every router on the way runs SPF on the same map, so their choices agree.</p>
${K.dyk(`Edsger Dijkstra worked out the algorithm in 1956 in about twenty minutes at a café in Amsterdam, without pencil or paper, and published it in 1959 — decades before OSPF.`)}
${K.q({type:"fill", q:"Same logic, new map. Links and costs: RA–RB 4, RA–RC 1, RC–RB 2, RB–RD 1, RC–RD 6. Run SPF from RA, then again after the RA–RC link fails.", fields:[{label:"Best cost from RA to RD", a:["4"]},{label:"First hop RA uses for RD", a:["RC","rc"]},{label:"Cost to RD after RA–RC fails", a:["5"]}], why:"RC is done at 1; through RC, RB = 3 (beats 4), RD = 7. RB is done at 3; through RB, RD = 4. So RD costs 4, first hop RC. Without RA–RC: RB = 4 direct, RD = 5, first hop RB."})}
${K.check({q:"R1 has two paths to network X: out Gi0/1 (1), R2 (10), R5's LAN interface (1); or out Gi0/2 (1), R3 (1), R4 (1), R6's LAN interface (1). What does R1 install?", o:["The R2 path: fewer routers","The R3 path, metric 4, because 4 beats 12","Both, because OSPF always load-balances","The R2 path, metric 3, because OSPF counts hops"], a:1, why:"12 versus 4: lowest total cost wins, whatever the hop count. Both would install only on a tie."})}

<h2>Areas: why OSPF splits big networks, and why area 0 is the backbone</h2>
<p>Every router reruns SPF when any link in its area changes. With hundreds of routers, one flapping link keeps everyone recalculating. The answer is the ${K.g("area","A group of OSPF routers and links sharing one LSDB; each interface belongs to one area.")}:</p>
<ul>
<li>Type 1 and 2 LSAs <b>stay inside their area</b>.</li>
<li>An ${K.g("ABR","Area Border Router: in area 0 and another area, keeping an LSDB for each.")} keeps one LSDB per area and passes summaries between them (<code>O IA</code>), so a change inside area 2 means a full SPF only in area 2.</li>
<li>Areas are set <b>per interface</b>; both ends of a link must agree — the hello's area check.</li>
</ul>
<p><b>Every other area must connect to area 0</b>, the ${K.g("backbone area","Area 0: every other area must connect to it, and inter-area traffic crosses it.")}, and inter-area traffic crosses it. Why? Between areas, routers share only &ldquo;network N, cost C, via this ABR&rdquo; — rumour-style information with rumour-style loop risks. A hub-and-spoke design around area 0 makes loops between areas impossible. (The patch for an area that can't reach area 0, a virtual link, is beyond the CCNA.)</p>
${K.svg("0 0 720 300",
  K.box(230,20,260,120,"","",true)+K.txt(360,40,"AREA 0 — backbone",{mid:true,c:"accent",b:true,s:12,f:"display"})+
  K.dev("router",300,90,"CORE-1","")+K.dev("router",420,90,"CORE-2","")+K.link(324,90,396,90)+
  K.box(20,170,250,110,"","")+K.txt(118,190,"AREA 1 — Lagos branches",{mid:true,c:"fg",b:true,s:11,f:"display"})+
  K.box(450,170,250,110,"","")+K.txt(612,190,"AREA 2 — Abuja branches",{mid:true,c:"fg",b:true,s:11,f:"display"})+
  K.dev("router",230,160,"ABR-1","area 0 + area 1")+K.dev("router",490,160,"ABR-2","area 0 + area 2")+
  K.link(300,106,240,146)+K.link(420,106,480,146)+
  K.dev("router",70,240,"BR-11","")+K.dev("router",160,240,"BR-12","")+K.dev("router",560,240,"BR-21","")+K.dev("router",650,240,"BR-22","")+
  K.link(206,170,94,232)+K.link(212,174,166,226)+K.link(514,170,556,226)+K.link(514,166,626,232)+
  K.arrow(150,214,316,108,"",true)+K.arrow(420,108,570,214,"",true)+
  K.txt(360,160,"area 1 ↔ area 2 always via area 0",{mid:true,c:"accent",s:10.5}),
  "Each ABR has interfaces in area 0 and one other area, so it keeps two LSDBs. Branches hold only their own area's detailed map.")}
<p>Roles: <b>internal</b> (one area), <b>backbone</b> (an interface in area 0), <b>ABR</b>, and ${K.g("ASBR","Autonomous System Boundary Router: injects routes from outside OSPF, such as a default route (lesson 4).")}. <b>The CCNA focuses on single-area OSPF</b> — everything in area 0, as most small and medium networks run. Lesson 6 takes a first look at a second area.</p>
${K.when([
  ["Single area (area 0)", "Small and medium networks — dozens of routers, often far more on modern hardware — or anywhere simplicity matters", "One map, one SPF; easiest to troubleshoot", "LSDB size or SPF churn becomes a real problem"],
  ["Multiple areas", "Large networks, many regions, unstable links to isolate", "Smaller maps; changes contained", "&ldquo;Big networks have areas&rdquo; is the only reason"],
], "Single area or multi-area?")}
${K.exam(`Expect concepts: every area connects to area 0; a router in area 0 and area 3 is an ABR; the area ID must match between neighbours. <code>area 0</code> and <code>area 0.0.0.0</code> are the same number.`)}
<p><b>Same logic, new situation.</b></p>
${K.hint(`Areas belong to interfaces. Which hello field would the two ends disagree on?`)}
${K.reveal("A new branch router's WAN interface goes in area 1 because 'branches go in area 1'. The hub's interface on that link is in area 0. Do they become neighbours?",`<ol>
<li><b>What is asked?</b> Does an adjacency form with different areas at each end of one link?</li>
<li><b>Which rule?</b> The area ID is in every hello and must match, per link.</li>
<li><b>Apply it.</b> 0 versus 1: both reject the other's hellos. No neighbour, no routes; IOS logs <code>%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID</code>.</li>
<li><b>Fix:</b> both ends in one area. If the branch belongs in area 1, the hub's interface joins area 1 — making the hub an ABR (lesson 6).</li>
</ol>`)}
${K.check({q:"Why must every OSPF area connect to area 0?", o:["Only area 0 routers can run SPF","Inter-area routes are rumour-style summaries; forcing inter-area traffic through one backbone prevents loops between areas","Only area 0 carries type 1 LSAs","The router ID must be in area 0"], a:1, why:"Inside an area everyone has the full map; between areas only summaries, which could loop. Hub-and-spoke around area 0 keeps it loop-free."})}

<h2>Hands-on: watch OSPF build the map — and heal around a cut</h2>
<p>A Lagos company has four routers in a ring. Head office (<code>HQ-R1</code>) reaches the data centre (<code>DC-R3</code>, with the file server) over fibre through Ikeja (<code>IKJ-R2</code>) or over a 10 Mb/s radio backup through Lekki (<code>LEK-R4</code>). OSPF runs everywhere in area 0, but two fibre leads were never connected and the backup has never been tested.</p>
<div class="tablewrap"><table>
<tr><th>Router</th><th>RID</th><th>Links (cost)</th></tr>
<tr><td><code>HQ-R1</code></td><td>router-id 1.1.1.1 (Lo0 10.255.0.1)</td><td>Gi0/0 LAN 10.10.0.1/24 · Gi0/1 fibre 10.0.12.1/30 (1) · Gi0/2 radio 10.0.14.1/30 (10)</td></tr>
<tr><td><code>IKJ-R2</code></td><td>Lo0 10.255.0.2</td><td>Gi0/1 10.0.12.2 (1) · Gi0/2 10.0.23.1 (1)</td></tr>
<tr><td><code>DC-R3</code></td><td>Lo0 10.255.0.3</td><td>Gi0/0 server LAN 10.20.0.1/24 (1) · Gi0/1 10.0.23.2 (1) · Gi0/2 radio 10.0.34.1 (10)</td></tr>
<tr><td><code>LEK-R4</code></td><td>Lo0 10.255.0.4</td><td>Gi0/1 radio 10.0.34.2 (10) · Gi0/2 radio 10.0.14.2 (10)</td></tr>
</table></div>
<p>On the radio interfaces, <code>bandwidth 10000</code> tells OSPF the link runs at 10,000 kb/s, so cost = 100 ÷ 10 = 10 (it doesn't change the real speed — lesson 6). Predict HQ-R1's cost to the server LAN both ways first.</p>
${K.bench({id:"m5-ospf-ring", points:100, from:"CCNA · Module 5 · lesson 3", title:"bring up a four-router OSPF ring, fix the backup, then cut the fibre", viewBox:"0 0 760 460", openLog:true,
  intro:"The console cable is on HQ-R1: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. No enable secret on these lab routers. To work on another router, unplug the console cable from HQ-R1's CON port and plug it into the other router's CON port, then open PuTTY again.",
  devices:[
    {id:"hq", kind:"router", label:"HQ-R1", model:"ISR 4331 · head office", x:20, y:40, config:e=>{ ["en","conf t","hostname HQ-R1","no ip domain-lookup","interface loopback 0","ip address 10.255.0.1 255.255.255.255","interface g0/0","description HQ LAN","ip address 10.10.0.1 255.255.255.0","no shutdown","interface g0/1","description FIBRE to IKJ-R2","ip address 10.0.12.1 255.255.255.252","no shutdown","interface g0/2","description RADIO to LEK-R4","bandwidth 10000","ip address 10.0.14.1 255.255.255.252","no shutdown",
      "router ospf 1","router-id 1.1.1.1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length = 0; e.log.length = 0; }},
    {id:"ikj", kind:"router", label:"IKJ-R2", model:"ISR 1111 · Ikeja", x:540, y:40, config:e=>{ ["en","conf t","hostname IKJ-R2","no ip domain-lookup","interface loopback 0","ip address 10.255.0.2 255.255.255.255","interface g0/1","description FIBRE to HQ-R1","ip address 10.0.12.2 255.255.255.252","no shutdown","interface g0/2","description FIBRE to DC-R3","ip address 10.0.23.1 255.255.255.252","no shutdown",
      "router ospf 1","network 10.0.0.0 0.255.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length = 0; e.log.length = 0; }},
    {id:"dc", kind:"router", label:"DC-R3", model:"ISR 4331 · data centre", x:540, y:300, config:e=>{ ["en","conf t","hostname DC-R3","no ip domain-lookup","interface loopback 0","ip address 10.255.0.3 255.255.255.255","interface g0/0","description SERVER LAN","ip address 10.20.0.1 255.255.255.0","no shutdown","interface g0/1","description FIBRE to IKJ-R2","ip address 10.0.23.2 255.255.255.252","no shutdown","interface g0/2","description RADIO to LEK-R4","bandwidth 10000","ip address 10.0.34.1 255.255.255.252","no shutdown",
      "router ospf 1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length = 0; e.log.length = 0; }},
    {id:"lek", kind:"router", label:"LEK-R4", model:"ISR 1111 · Lekki radio hub", x:20, y:300, config:e=>{ ["en","conf t","hostname LEK-R4","no ip domain-lookup","interface loopback 0","ip address 10.255.0.4 255.255.255.255","interface g0/1","description RADIO to DC-R3","bandwidth 10000","ip address 10.0.34.2 255.255.255.252","no shutdown","interface g0/2","description RADIO to HQ-R1","bandwidth 10000","ip address 10.0.14.2 255.255.255.252","ip ospf hello-interval 5","no shutdown",
      "router ospf 1","network 10.0.0.0 0.255.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length = 0; e.log.length = 0; }},
    {id:"pchq", kind:"pc", label:"PC-HQ", x:290, y:10, ip:"10.10.0.10", mask:"255.255.255.0", gw:"10.10.0.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:300, y:170},
    {id:"srv", kind:"server", label:"FILE-SRV", x:330, y:340, ip:"10.20.0.10", mask:"255.255.255.0", gw:"10.20.0.1"},
  ],
  cables:[ {type:"cat6", a:"pchq:eth", b:"hq:g0"}, {type:"cat6", a:"srv:eth", b:"dc:g0"}, {type:"cat6", a:"dc:g2", b:"lek:g1"}, {type:"cat6", a:"lek:g2", b:"hq:g2"}, {type:"console", a:"lap:usb", b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Console into HQ-R1, <code>enable</code>, and run <code>show ip protocols</code>. The Router ID is 1.1.1.1, not the loopback's 10.255.0.1 — which rule from the RID order decided that?", done:B=>B.devs.hq.env.log.some(l=>/Router ID 1\.1\.1\.1/.test(l.out))},
    {text:"Run <code>show ip ospf neighbor</code> and <code>show ip route ospf</code> on HQ-R1. No neighbours and no <code>O</code> routes — even though Gi0/2 (the radio) is cabled and up. Keep that in mind", done:B=>{ const h = B.devs.hq.env.history; return h.some(x=>/ospf\s+nei/i.test(x)) && h.some(x=>/ro\S*\s+ospf/i.test(x)); }},
    {text:"Take a Cat6 from the tray and connect HQ-R1 G0/1 to IKJ-R2 G0/1 (the first fibre lead). Run <code>show ip ospf neighbor</code> again, then <code>show logging</code> and find the <code>%OSPF-5-ADJCHG ... LOADING to FULL</code> line", done:B=>Bench.ospfNbr(B,"hq","10.255.0.2") && B.devs.hq.env.log.some(l=>/Nbr 10\.255\.0\.2 on GigabitEthernet0\/1 from LOADING to FULL/.test(l.out))},
    {text:"Connect IKJ-R2 G0/2 to DC-R3 G0/1. On HQ-R1, <code>show ip route ospf</code>: the server LAN 10.20.0.0/24 appears with cost 3 via 10.0.12.2. Nobody typed a route for it — check the 3 against your prediction", done:B=>{ const r = Bench.route(B,"hq","10.20.0.0/24","O"); return !!(r && r.metric===3 && B.devs.hq.env.log.some(l=>/10\.20\.0\.0\/24 \[110\/3\]/.test(l.out))); }},
    {text:"Now the radio. On HQ-R1, <code>show ip ospf interface g0/2</code>: up, area 0, <code>Hello 10, Dead 40</code>, but <code>Neighbor Count is 0</code>. Move the console cable to LEK-R4, <code>enable</code>, and run the same command there. Compare the timer line", done:B=>B.devs.hq.env.log.some(l=>/GigabitEthernet0\/2 is up/.test(l.out) && /Hello 10, Dead 40/.test(l.out)) && B.devs.lek.env.log.some(l=>/Hello 5, Dead 20/.test(l.out))},
    {text:"Fix LEK-R4: <code>configure terminal</code>, <code>interface g0/2</code>, then <code>no ip ospf hello-interval</code> (removes the custom hello timer, so the interface goes back to the default 10-second hello and 40-second dead — lesson 6 covers timers). Done when LEK-R4 is FULL with 1.1.1.1", done:B=>Bench.ospfNbr(B,"lek","1.1.1.1")},
    {text:"On LEK-R4: <code>show ip ospf neighbor</code> (two neighbours now), then <code>show ip ospf database</code>. Count the Router Link States — one per router — and the Net Link States, then save with <code>write memory</code>", done:B=>{ const h = B.devs.lek.env.history; return h.some(x=>/ospf\s+nei/i.test(x)) && B.devs.lek.env.log.some(l=>/Router Link States \(Area 0\)/.test(l.out) && /^1\.1\.1\.1\s/m.test(l.out)) && B.devs.lek.env.savedOnce; }},
    {text:"From PC-HQ's Command Prompt, <code>tracert 10.20.0.10</code>. The backup is up now, yet the trace still goes via 10.0.12.2 (IKJ) — fibre costs 3, radio costs 10 + 10 + 1 = 21", done:B=>Bench.traced(B,"pchq","10.20.0.10") && Bench.ospfNbr(B,"hq","10.255.0.4")},
    {text:"Road works cut the fibre: unplug the cable from HQ-R1 G0/1. From PC-HQ, <code>tracert 10.20.0.10</code> again: the second hop is now 10.0.14.2 (LEK-R4)", done:B=>{ const r = Bench.route(B,"hq","10.20.0.0/24","O"); return !!(r && r.metric===21 && r.via[0]==="10.0.14.2" && !Bench.cableAt(B,"hq:g1") && Bench.traced(B,"pchq","10.20.0.10")); }},
    {text:"Move the console back to HQ-R1. <code>show logging</code>: find <code>from FULL to DOWN, Neighbor Down: Interface down or detached</code>. Then <code>show ip route ospf</code>: 10.20.0.0/24 is now <code>[110/21] via 10.0.14.2</code>", done:B=>B.devs.hq.env.log.some(l=>/Nbr 10\.255\.0\.2 on GigabitEthernet0\/1 from FULL to DOWN/.test(l.out)) && B.devs.hq.env.log.some(l=>/10\.20\.0\.0\/24 \[110\/21\] via 10\.0\.14\.2/.test(l.out))},
  ],
  win:"You watched adjacencies come up one cable at a time and routes appear with no route typed, found a backup link that had silently never worked (a one-sided hello timer), fixed it, and proved the failover: when the fibre was cut, OSPF logged the adjacency down and moved the traffic to the radio path at cost 21.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip protocols"],["term","show ip ospf neighbor"],["term","show ip route ospf"],
    ["plug","cat6","hq:g1","ikj:g1"],["term","show ip ospf neighbor"],["term","show logging"],
    ["plug","cat6","ikj:g2","dc:g1"],["term","show ip route ospf"],["term","show ip ospf interface g0/2"],
    ["unplug","hq:con"],["plug","console","lap:usb","lek:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf interface g0/2"],
    ["term","configure terminal"],["term","interface g0/2"],["term","no ip ospf hello-interval"],["term","end"],["term","show ip ospf neighbor"],["term","show ip ospf database"],["term","write memory"],
    ["pc","pchq","tracert 10.20.0.10"],
    ["unplug","hq:g1"],["pc","pchq","tracert 10.20.0.10"],
    ["unplug","lek:con"],["plug","console","lap:usb","hq:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show logging"],["term","show ip route ospf"]]})}
${K.hint(`On the radio link both ends are up, in area 0, in one subnet. That leaves the timers: read <code>Timer intervals configured</code> on <b>both</b> routers.`)}
<p>Read what you saw. The radio link was up yet silent: hello 5/dead 20 against 10/40, both sides ignoring each other, nothing logged. Each fibre lead produced <code>ADJCHG ... LOADING to FULL</code> and the server LAN appeared at 1 + 1 + 1 = 3. Pulling the fibre at HQ-R1 downed its interface, so the adjacency dropped at once, SPF reran, and the route moved to 21 via 10.0.14.2. The real lesson: a backup &ldquo;up&rdquo; for months had never carried anything.</p>
<p><b>Same logic, new situation.</b></p>
${K.hint(`Add up both paths with the new costs. What does OSPF do with an exact tie?`)}
${K.reveal("Both radio hops are upgraded to 1 Gb/s and the bandwidth 10000 lines removed, so every link costs 1. With the fibre back, what does HQ-R1 install for 10.20.0.0/24?",`<ol>
<li><b>What is asked?</b> Which path wins with the new costs.</li>
<li><b>Which rule?</b> Lowest total cost; on a tie, all equal paths install (ECMP).</li>
<li><b>Apply it.</b> Fibre 1 + 1 + 1 = 3; radio 1 + 1 + 1 = 3. A tie: <code>[110/3]</code> via 10.0.12.2 <i>and</i> 10.0.14.2.</li>
<li><b>So:</b> to keep the radio a backup, set its cost on purpose (<code>ip ospf cost</code>, lesson 6).</li>
</ol>`)}
${K.check({q:"In the bench, why was nothing logged about LEK-R4's hello-interval 5, and how did you find it?", o:["It was logged as %OSPF-4-ERRRCV on LEK-R4 only","Hellos failing the timer check are silently ignored; comparing show ip ospf interface on both ends shows it","The radio link was down at Layer 1","Timer mismatches are logged only after the dead interval"], a:1, why:"A timer mismatch leaves no log message by default — just a missing neighbour on an up interface. The timer line at each end gives it away."})}
${K.job("“Lekki branch is slow since 7:40” — and the log says Dead timer expired",`
<p><b>The alert.</b> 07:42, from bank branch router <code>LEK-BR1</code>: <code>%OSPF-5-ADJCHG: Process 1, Nbr 10.255.0.1 on GigabitEthernet0/1 from FULL to DOWN, Neighbor Down: Dead timer expired</code>. At 08:15 the branch manager calls: &ldquo;the banking app is very slow, but it works.&rdquo;</p>
<p><b>Questions.</b> &ldquo;Anything change at the branch?&rdquo; — <i>&ldquo;NEPA took light at 7:30; the generator and UPS kicked in.&rdquo;</i> Slow-but-working suggests traffic is on the 4G backup, as designed. Why did the fibre neighbour go?</p>
${K.out(`LEK-BR1#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
10.255.0.2        1   FULL/DR         00:00:36    10.0.72.1       GigabitEthernet0/2

LEK-BR1#show interfaces g0/1 | include line protocol
GigabitEthernet0/1 is up, line protocol is up

LEK-BR1#show ip route ospf | include 10.1.0.0
O        10.1.0.0/16 [110/52] via 10.0.72.1, 00:34:07, GigabitEthernet0/2

LEK-BR1#ping 10.0.71.1
.....
Success rate is 0 percent (0/5)`, "Only the 4G neighbour is left; head office's routes use it. Gi0/1 is up/up, but the hub's end of the fibre (10.0.71.1) doesn't answer.")}
<p><b>Read it.</b> <i>Dead timer expired</i>, not <i>Interface down</i>: the provider's equipment still gives Gi0/1 link, but hellos stopped, so after 40 seconds OSPF declared the hub dead and moved routes to 4G (cost 52). The router did its job; the fault is the provider's.</p>
<p><b>Fix.</b> Open a fault with the provider: circuit ID, times from both routers' logs, &ldquo;link up at the handoff, no traffic passing&rdquo;. They find a street cabinet's battery flat after the power cut. At 10:05 the log shows <code>from LOADING to FULL</code> and the routes return to Gi0/1.</p>
<p><b>What you say.</b> &ldquo;Your main line dropped at 7:42 — a power problem at the provider. The branch switched to its backup automatically, hence the slowness. Fixed at 10:05; nothing to do your end.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;07:42 LEK-BR1 nbr 10.255.0.1 (HUB) Gi0/1 FULL→DOWN, dead timer expired. Gi0/1 up/up; ping hub fibre IP fails → carrier fault. Failed over to 4G (metric 52) as designed. Provider ref 55821: cabinet battery flat. Restored 10:05, FULL, routes back on Gi0/1. Carrier Ethernet hides far-end failures (40 s detection) — raise faster detection at design review.&rdquo;</i></p>`)}
${K.case("Fourteen branches, 560 static routes — and the move to single-area OSPF",`
<p>A microfinance bank's fourteen branches ran on about 560 static routes, with floating statics for backups (radio, or ${K.g("VSAT","Very Small Aperture Terminal: a satellite link with a small dish, for sites without fibre.")} in the north). A fibre &ldquo;up&rdquo; at the provider's handoff but passing nothing never failed over, and typos cut branches off. The team moved to one OSPF area — fifteen routers is small — with a loopback-based <code>router-id</code> everywhere and high costs on backups, removing statics one branch per Saturday night.</p>
<p>Two surprises: a backup router built from a copy of its neighbour's configuration brought a duplicate RID (<code>DUP_RTRID_NBR</code>), and a VSAT interface's smaller MTU left a neighbour stuck in ExStart. Now silent failures fail over in about 40 seconds instead of never. Lessons: <b>unique router IDs</b>; <b>an untested backup isn't a backup</b>; <b>one area until there's a reason for more</b>.</p>`)}
${K.myth([
  ["OSPF picks the path with the fewest routers.","It picks the lowest total cost; three Gigabit hops beat one slow link."],
  ["Neighbours need the same OSPF process ID.","The process ID is local."],
  ["Typing router-id changes the RID at once.","If one is in use, nothing changes until <code>clear ip ospf process</code> or a reload."],
  ["OSPF sends its whole table every 30 seconds, like RIP.","It sends hellos every 10 seconds and floods LSAs only on change (plus a 30-minute refresh)."],
  ["Two routers at 2-WAY are always broken.","Between two DROTHERs on a LAN it's normal (lesson 5)."],
])}
${K.dodont([
  "Give every router a loopback and set <code>router-id</code> to it; record RIDs.",
  "Compare <b>both</b> ends when a neighbour is missing.",
  "Read the reason in every <code>ADJCHG</code> line.",
  "Test backups by failing the primary in a maintenance window.",
],[
  "Copy a configuration without changing <code>router-id</code>.",
  "Change hello or dead timers on one end only.",
  "Run <code>clear ip ospf process</code> on a live router mid-day.",
  "Assume an up/up link carries OSPF — check the neighbour table.",
])}
${K.tip(`Before any OSPF change, save <code>show ip ospf neighbor</code> and <code>show ip route ospf</code> to the ticket; afterwards, run them again and compare.`)}
${K.exam(`<b>How to read a routing question.</b> 1) <b>What is asked?</b> Which path? Neighbours or not? Which RID? 2) <b>Which rule?</b> Path: longest match → AD → metric (OSPF: lowest total cost). Neighbours: hello checks plus unique RIDs. RID: configured → loopback → physical, fixed at process start. 3) <b>Work it through</b> on paper: add the costs, compare the fields, list the up interfaces. Traps: &ldquo;fewest hops&rdquo;, &ldquo;same process ID&rdquo;, &ldquo;the loopback was added yesterday&rdquo;.`)}

<h2>Interview corner</h2>
${K.hint(`What is shared and who calculates; an example each; convergence and loops versus memory and CPU.`)}
${K.reveal("“What's the difference between distance-vector and link-state routing?”",`<p>"Distance vector shares routes: each router tells its neighbours which networks it reaches and how far, so it only knows a next hop and a distance it was told. Classic RIP sends its table periodically, so changes spread slowly and it needs loop-prevention rules. Link state shares topology: each router floods LSAs describing its own links, every router builds the same database and runs SPF itself. Changes flood immediately, so OSPF converges fast and resists loops, at the cost of more memory, CPU and design work such as areas."</p>`)}
${K.hint(`The states in order, what happens in each, and what must match.`)}
${K.reveal("“Walk me through how two OSPF routers become fully adjacent.”",`<p>"Both send hellos every 10 seconds to 224.0.0.5 with router ID, area, mask, timers, authentication and the neighbours they've heard. If those match and the router IDs are unique, they go to Init, then 2-Way when each sees its own ID in the other's hello; on Ethernet the DR and BDR are elected then. In ExStart the higher router ID becomes master; in Exchange they swap Database Description packets; in Loading they request missing LSAs, receive them in updates and acknowledge them. With identical databases they're Full, IOS logs an adjacency-change message and both run SPF. Stuck in ExStart or Exchange, I check MTU first."</p>`)}
${K.hint(`The order, 'chosen once', how to apply a change — and why you set it deliberately.`)}
${K.reveal("“How does a Cisco router choose its OSPF router ID, and how would you set it in production?”",`<p>"The router-id command first; otherwise the highest address on an up loopback; otherwise the highest on an up physical interface. It's chosen when the process starts, and a change needs clear ip ospf process or a reload, which resets adjacencies. In production every router gets a loopback from a dedicated block, router-id is set to it explicitly and recorded in the IP plan, so IDs are unique, readable in neighbour tables, and can't silently change at the next reload."</p>`)}

${K.recap([
  "Statics don't scale or notice far-side failures; a routing protocol finds neighbours, shares, computes and reconverges by itself.",
  "IGPs route inside an AS; BGP, the one EGP in use, routes between them and runs the internet.",
  "Distance vector shares routes like rumours; link state floods each router's links so all hold one LSDB and each runs SPF.",
  "RID: router-id, else highest up loopback, else highest up physical — fixed at process start.",
  "Hellos: 224.0.0.5, every 10 s, dead 40 s. Area, timers, subnet/mask, authentication, stub flag must match; RIDs unique; MTU equal.",
  "Down, Init, 2-Way (neighbours), ExStart, Exchange, Loading, Full (adjacent); stuck in ExStart/Exchange usually means MTU.",
  "Type 1 and 2 LSAs form the LSDB; cost = 100 Mb/s ÷ bandwidth (min 1); SPF picks the lowest total cost.",
  "Every area touches area 0, the backbone; the CCNA focuses on single-area OSPF.",
])}
${K.next(`<b>Lesson 4 — Configuring single-area OSPF.</b> <code>network</code> statements and wildcard masks, the interface method you used on KAN-R5, router IDs, passive interfaces, and a default route that appears everywhere as <code>O*E2</code>.`)}
`,
quiz:[
  {lvl:1, q:"Which statement best describes a link-state routing protocol such as OSPF?", o:["Each router sends its full routing table to its neighbours every 30 seconds","Each router floods a description of its own links to every router in the area, and every router calculates best paths from the same database","Routers exchange only the single best path to each network, chosen by the neighbour","Routes are entered by an administrator and never change automatically"], a:1, why:"Link-state routers share topology, not finished routes: every router's LSAs reach every router in the area, all hold the same LSDB, and each runs SPF itself. Periodic full tables describe classic distance vector (RIP); manual routes are statics."},
  {lvl:1, q:"What are the default OSPF hello and dead intervals on an Ethernet interface?", o:["5 and 20 seconds","10 and 40 seconds","30 and 120 seconds","3 and 10 seconds"], a:1, why:"On broadcast (Ethernet) and point-to-point networks OSPF sends a hello every 10 seconds and declares a silent neighbour dead after 40 seconds. 3/10 are HSRP's hello and hold timers (lesson 7)."},
  {lvl:1, type:"fill", q:"Which multicast address do OSPF routers send hellos to, meaning 'all OSPF routers on this link'?", fields:[{label:"Address", a:["224.0.0.5"]}], why:"224.0.0.5 is AllSPFRouters. 224.0.0.6 (AllDRouters) is used to reach the DR and BDR on a shared segment (lesson 5)."},
  {lvl:1, q:"Which routing protocol is an Exterior Gateway Protocol, used between autonomous systems on the internet?", o:["OSPF","EIGRP","BGP","RIP"], a:2, why:"BGP is the EGP that ISPs and large networks use to exchange routes between autonomous systems. OSPF, EIGRP and RIP are IGPs, used inside one AS."},
  {lvl:1, type:"match", q:"Match each OSPF packet type with its job.", pairs:[["Hello","Discovers neighbours, checks settings and acts as a keepalive"],["DBD","Lists the headers of the LSAs a router holds (a table of contents)"],["LSR","Asks the neighbour for specific LSAs that are missing or newer"],["LSU","Carries complete LSAs"],["LSAck","Confirms that LSAs were received"]], why:"Hellos find and keep neighbours; DBDs summarise the database during Exchange; LSRs request what's missing in Loading; LSUs carry the LSAs (and later floods); acknowledgements make flooding reliable."},
  {lvl:2, q:"A router has no router-id configured. Interfaces: Loopback0 10.255.1.1 (up), Loopback1 10.255.1.9 (administratively down), Gi0/0 192.168.1.1 (up), Gi0/1 203.0.113.5 (up). OSPF is started now. What is the router ID?", o:["203.0.113.5","10.255.1.9","10.255.1.1","192.168.1.1"], a:2, why:"With no router-id command, the highest IP on an up loopback wins. Loopback1 is shut, so it doesn't count; Loopback0 (10.255.1.1) is the only up loopback, so it beats every physical address, however high."},
  {lvl:2, type:"order", q:"Put the OSPF neighbour states in order, from first contact to synchronised databases.", items:["Down","Init","2-Way","ExStart","Exchange","Loading","Full"], why:"Down → Init (hello received, my RID not in it) → 2-Way (my RID seen: neighbours) → ExStart (master/slave by higher RID) → Exchange (DBDs) → Loading (LSR/LSU/LSAck) → Full (identical LSDBs)."},
  {lvl:2, type:"multi", q:"R1 and R2 are connected by a /30 Ethernet link and never become OSPF neighbours. Which two differences on that link would cause this? (Choose two.)", o:["R1 has ip ospf hello-interval 5; R2 uses the default","R1 runs router ospf 1; R2 runs router ospf 20","R1's interface cost is 10; R2's is 1","R1's interface is in area 0; R2's is in area 1","R1's OSPF priority is 0; R2's is 1"], a:[0,3], why:"Hello/dead timers and the area ID are checked in every hello, so mismatches stop the neighbourship. Process IDs are local, costs may differ per side, and priority only affects the DR election."},
  {lvl:2, q:"Based on the exhibit, what is the most likely cause?", ex:"BR-07#show ip ospf neighbor\n\nNeighbor ID     Pri   State           Dead Time   Address         Interface\n10.255.0.1        1   EXSTART/DR      00:00:35    10.0.70.1       GigabitEthernet0/1\n\n(The state has not changed for 20 minutes. Pings to 10.0.70.1 succeed.)", o:["A hello timer mismatch","An MTU mismatch between the two interfaces","An area ID mismatch","A duplicate router ID"], a:1, why:"Reaching ExStart proves the hellos passed every check, so timers and area match and the RIDs are unique. Getting stuck in ExStart/Exchange is the classic sign that the interfaces disagree on MTU and the DBD exchange can't complete."},
  {lvl:2, q:"In the exhibit, what do 110 and 21 mean, and which device does R1 send packets for 10.40.0.0/24 to?", ex:"R1#show ip route ospf | include 10.40\nO        10.40.0.0/24 [110/21] via 10.0.14.2, 00:12:44, GigabitEthernet0/2", o:["110 is the cost, 21 the hop count; packets go out Gi0/2 to any router","110 is OSPF's administrative distance, 21 is the total OSPF cost; packets go to the neighbour at 10.0.14.2 out Gi0/2","110 is the router ID, 21 the area; packets go to 10.40.0.1","110 is the metric, 21 the AD; packets go to 10.0.14.2"], a:1, why:"In [AD/metric], 110 is OSPF's administrative distance and 21 the cost: the sum of outgoing interface costs to that network. The next hop is the neighbour's address on the shared link, 10.0.14.2, reached out Gi0/2."},
  {lvl:2, type:"fill", q:"You configured router-id 10.255.0.7 and IOS replied: Reload or use the ... command, for this to take effect. Which privileged EXEC command applies the new router ID without a reload?", fields:[{label:"Command", a:["clear ip ospf process","clear ip ospf 1 process"], ios:true}], why:"clear ip ospf process (answer yes) restarts OSPF so it picks its RID again. It drops and rebuilds every adjacency on the router, so on a live network it belongs in a maintenance window."},
  {lvl:2, q:"With the default reference bandwidth, what OSPF cost does IOS give a FastEthernet (100 Mb/s) interface and a 10 Gb/s interface?", o:["1 and 1","10 and 1","1 and 0.01","100 and 1"], a:0, why:"Cost = 100 Mb/s ÷ bandwidth, never below 1. 100 ÷ 100 = 1; 100 ÷ 10,000 = 0.01, which is raised to the minimum of 1. OSPF can't tell them apart until the reference bandwidth is raised (lesson 6)."},
  {lvl:3, q:"OSPF map, both directions equal: R1–R2 cost 20, R1–R3 cost 5, R3–R2 cost 5, R3–R4 cost 12, R2–R4 cost 1. Network N sits behind R4 (R4's LAN interface cost 1). Which path does R1 use to N, and what metric appears in R1's routing table?", o:["R1 → R2 → R4, metric 22","R1 → R3 → R4, metric 18","R1 → R3 → R2 → R4, metric 12","R1 → R3 → R2 → R4, metric 11"], a:2, why:"Run SPF: R3 is done at 5; through R3, R2 = 10 (beats the direct 20) and R4 = 17. R2 is done at 10; through R2, R4 = 11, beating 17. Then N = 11 + R4's LAN cost 1 = 12, via R1 → R3 → R2 → R4. The path with the fewest routers is not the cheapest."},
  {lvl:3, q:"A branch gets a second router for its backup line: BR-12B was built by copying BR-12A's configuration and editing the IP addresses, and the two share the branch LAN. BR-12B never appears in BR-12A's neighbour table, and BR-12A logs: %OSPF-4-DUP_RTRID_NBR: OSPF detected duplicate router-id 10.255.0.12 from 10.12.0.3 on interface GigabitEthernet0/0. What do you do?", o:["Change BR-12B's OSPF process ID so it differs from BR-12A's","Set a unique router-id on BR-12B (its own loopback address), then run clear ip ospf process on BR-12B","Raise BR-12A's OSPF priority so it wins the DR election","Shut down BR-12A so BR-12B can use the router ID"], a:1, why:"The copied router-id line gave BR-12B the same RID as BR-12A; BR-12A hears its own RID in a neighbour's hello and refuses the adjacency. Configure BR-12B's own RID, then restart its OSPF process so it takes effect. Process IDs are local and have nothing to do with it; shutting BR-12A down only moves the outage."},
  {lvl:3, q:"A branch reaches head office over a provider's Ethernet service: the branch port connects to the provider's switch, not directly to the hub. The hub router loses power. Users at the branch lose head-office access for about 40 seconds before traffic moves to the 4G backup, and the branch log says 'Neighbor Down: Dead timer expired'. Which explanation is right?", o:["OSPF is misconfigured: it should always detect failures instantly","The branch's interface stayed up because the provider's switch still gave it link, so OSPF only learned of the failure when no hellos arrived for the 40-second dead interval","The 4G backup has a higher administrative distance, so it waited 40 seconds","SPF takes 40 seconds to run on a branch router"], a:1, why:"When the local interface goes down, OSPF reacts at once (Interface down or detached). Here the branch's link stayed up at the provider's switch, so the only evidence was missing hellos; after the 40-second dead interval the neighbour was declared down, SPF ran in milliseconds, and the backup path took over. Faster detection needs shorter timers on both ends or a dedicated failure-detection mechanism."},
  {lvl:3, type:"fill", q:"Read the exhibit from a router in a single-area network. How many routers are in area 0, and how many Ethernet segments have a DR with neighbours on them?", ex:"R3#show ip ospf database\n\n            OSPF Router with ID (10.255.0.3) (Process ID 1)\n\n                Router Link States (Area 0)\n\nLink ID         ADV Router      Age         Seq#       Checksum Link count\n10.255.0.1      10.255.0.1      412         0x80000006 0x00A1C3 3\n10.255.0.2      10.255.0.2      390         0x80000004 0x00B2D4 4\n10.255.0.3      10.255.0.3      388         0x80000005 0x00C3E5 3\n10.255.0.4      10.255.0.4      401         0x80000003 0x00D4F6 2\n10.255.0.5      10.255.0.5      377         0x80000002 0x00E507 2\n\n                Net Link States (Area 0)\n\nLink ID         ADV Router      Age         Seq#       Checksum\n10.0.12.2       10.255.0.2      390         0x80000001 0x001A2B\n10.0.24.2       10.255.0.4      401         0x80000001 0x002B3C", fields:[{label:"Routers", a:["5","five"]},{label:"Segments with a DR", a:["2","two"]}], why:"There is one type 1 Router LSA per router in the area, so five Router Link States means five routers. Each type 2 Network LSA is created by the DR of one multi-access segment that has neighbours, so two Net Link States means two such segments. Every router in area 0 shows the same list."},
],
cards:[
  {f:"Why move from static routes to a dynamic routing protocol?", b:"Scale (every router needs every remote network typed in; every change touches many routers) and failure recovery (statics don't know the far side has failed). A protocol finds neighbours, shares, computes and reconverges by itself."},
  {f:"IGP vs EGP", b:"IGP: routes inside one autonomous system — OSPF, EIGRP, RIP, IS-IS. EGP: routes between autonomous systems — BGP, the protocol of the internet."},
  {f:"Distance vector vs link state", b:"Distance vector shares routes and distances heard from neighbours (rumours) — RIP, EIGRP. Link state floods each router's own links to all routers; everyone holds the same LSDB and runs SPF — OSPF, IS-IS."},
  {f:"OSPF router ID selection order", b:"1) router-id command; 2) highest IP on an up loopback; 3) highest IP on an up physical interface. Chosen when the process starts; a change needs clear ip ospf process or a reload."},
  {f:"OSPF hellos: where, how often", b:"To 224.0.0.5 (all OSPF routers), IP protocol 89, every 10 s on Ethernet and point-to-point; dead interval 40 s (4 × hello)."},
  {f:"What must match for two OSPF neighbours?", b:"Area ID, hello and dead intervals, subnet and mask (on Ethernet), authentication, stub flag. Router IDs must be unique; MTU must match for the database exchange. Process ID and cost don't need to match."},
  {f:"OSPF neighbour states in order", b:"Down, Init, 2-Way, ExStart, Exchange, Loading, Full. 'Did I Tell Everyone Everything? Loading… Full.' 2-Way = neighbours; Full = adjacent."},
  {f:"Neighbour stuck in ExStart or Exchange", b:"Hellos matched but the database exchange can't finish — the classic cause is an MTU mismatch between the two interfaces."},
  {f:"Five OSPF packet types", b:"1 Hello (find, check, keepalive); 2 DBD (table of contents); 3 LSR (request); 4 LSU (the LSAs); 5 LSAck (acknowledge)."},
  {f:"Type 1 and type 2 LSAs", b:"Type 1 Router LSA: every router, describing its links in the area (Link ID = its RID). Type 2 Network LSA: the DR of each multi-access segment with neighbours, listing attached routers (Link ID = DR's interface IP)."},
  {f:"OSPF cost", b:"Reference bandwidth (default 100 Mb/s) ÷ interface bandwidth, minimum 1: 10 Mb/s = 10, 100 Mb/s = 1, 1 Gb/s = 1. A route's metric is the sum of outgoing interface costs along the path."},
  {f:"What does SPF choose?", b:"The lowest total cost path to each network, not the fewest hops. Each router runs Dijkstra with itself as the root on the shared LSDB and installs only the first hop."},
  {f:"Why is area 0 the backbone?", b:"Every area must connect to area 0, and inter-area traffic crosses it. Between areas only summaries are shared (distance-vector style); a hub-and-spoke backbone prevents loops. ABRs join area 0 to other areas."},
  {f:"Adjacency-down log reasons: Interface down vs Dead timer expired", b:"Interface down or detached: my own interface went down — detected at once. Dead timer expired: the link stayed up but no hellos arrived for the dead interval (40 s) — the far side or the path failed."},
],
});
// ---------- Module 5 · Lesson 4 ----------
L.push({
id:"ospf-config", mins:95, level:"Intermediate · builds on Module 5 lessons 1–3",
t:"Configuring single-area OSPF: network statements and wildcards, the interface method, router IDs, passive interfaces, default routes",
html:`
${K.goals([
  "Enable OSPF on exactly the interfaces you mean — <code>network</code> statements or <code>ip ospf 1 area 0</code> — and predict what a statement catches.",
  "Give each router a stable router ID from a loopback, and know when <code>clear ip ospf process</code> is needed.",
  "Silence OSPF on user LANs with <code>passive-interface</code> while still advertising them.",
  "Share an internet default with <code>default-information originate</code> and read the <code>O*E2</code> route it creates.",
  "Verify a build inside out: protocols → interfaces → neighbours → routes → ping and traceroute.",
])}
${K.pre(["Module 3: masks and prefixes (/24, /30, /32) in binary. Module 5 lessons 1–3: reading <code>show ip route</code> and <code>[AD/metric]</code>, static and default routes (<code>ip route 0.0.0.0 0.0.0.0</code>), and what OSPF does — router IDs, hellos, neighbours, link-state advertisements (LSAs), the shortest path first (SPF) calculation, areas."])}

<h2>Why this matters at work</h2>
<p>A Lagos managed-service provider takes over a logistics firm: head office in Apapa, five depots, every router held together by about 40 static routes. Adding the sixth depot meant touching every router, and one mistyped next hop took the Onitsha depot offline for a day. The new contract: move everything to OSPF.</p>
<p>Each router's OSPF config is eight or nine lines, and they decide everything. A wildcard too wide and OSPF sends hellos at the ISP. No <code>passive-interface</code> and anyone on a user LAN can inject routes. Random router IDs make neighbour tables unreadable at 2 a.m. Forget <code>default-information originate</code> and every depot loses the internet. This lesson is those lines: what each does, how the router decides, how to prove it.</p>

<h2>Turning OSPF on: the process, and what enabling an interface means</h2>
<p>Lesson 3 showed what OSPF does. Configuring it takes two decisions: <b>start a process</b>, and <b>choose which interfaces take part</b>.</p>
${K.out(`R-HQ(config)#router ospf 1
R-HQ(config-router)#`, "router ospf 1 starts OSPF process 1 (or opens it) and enters router configuration mode.")}
<p>The number is the ${K.g("process ID","A number from 1 to 65535 naming an OSPF process inside one router. Local meaning only: never sent to neighbours, doesn't have to match.")}, 1–65535. Plain words: <b>a label for OSPF inside this one router</b>. It never goes into a hello, so neighbours never see it: <code>router ospf 1</code> on one side and <code>router ospf 99</code> on the other work fine. It exists because one router can, in unusual designs, run several OSPF processes; most companies use 1 everywhere so configs look alike.</p>
<p>The <b>area</b> number is the opposite: it travels in every hello and must match on both ends of a link. This lesson is single-area OSPF, everything in the ${K.g("backbone area","Area 0, the central OSPF area. A single-area design puts every link in area 0.")}, area 0 (written <code>0</code> or <code>0.0.0.0</code> — the same thing).</p>
${K.remember(`<b>Process ID = a private name tag, doesn't have to match. Area ID = public, in every hello, must match.</b> &ldquo;Process is private, area is public.&rdquo;`)}
<p>On its own, <code>router ospf 1</code> runs on no interfaces. When OSPF is enabled on an interface, <b>two separate things</b> happen — keep them apart, the rest of the lesson depends on it:</p>
<ol>
<li><b>It talks.</b> Hellos go out every 10 seconds to ${K.g("224.0.0.5","The AllSPFRouters multicast address that every OSPF router listens to.")}, and the router forms neighbours with any OSPF router that answers.</li>
<li><b>It advertises.</b> The interface's real subnet and mask go into the router's ${K.g("LSA","Link-State Advertisement: the description of links and subnets OSPF routers flood to each other (lesson 3).")}, so every router in the area learns a route to it.</li>
</ol>
<p><b>The decision rule:</b> an interface takes part only if your config claims it — a <code>network</code> statement matching its IP address, or <code>ip ospf 1 area 0</code> on the interface. A claimed interface talks <i>and</i> is advertised. Later, <code>passive-interface</code> keeps the advertising and stops the talking.</p>
${K.check({q:"R7 runs router ospf 25 and R8 runs router ospf 100. Their linked interfaces are in the same /30, both in area 0. What happens?", o:["No adjacency, because the process IDs differ","They become neighbours: the process ID is local and never sent in hellos","They become neighbours only after clear ip ospf process","They become neighbours but exchange no routes"], a:1, why:"Hellos carry the router ID, area, mask and timers — not the process ID — so 25 and 100 work together."})}
${K.hint(`For each number, ask: is it carried between routers, or used only inside one?`)}
${K.reveal("Same logic, new situation: the contractor's numbering", `<p>R-A: <code>router ospf 10</code> / <code>network 10.5.5.0 0.0.0.3 area 10</code>. R-B, on the same link: <code>router ospf 10</code> / <code>network 10.5.5.0 0.0.0.3 area 20</code>. The contractor says he &ldquo;numbered them differently to tell them apart&rdquo;. Neighbours?</p>
<ol><li><b>Asked:</b> does an adjacency form?</li><li><b>Rule:</b> process ID is local; area ID is in every hello and must match.</li>
<li><b>Apply:</b> equal process IDs are irrelevant; areas 10 and 20 differ, so each rejects the other's hellos (lesson 6). No neighbour. Routers are told apart by <b>router ID</b>.</li></ol>`)}

<h2>Network statements and wildcard masks</h2>
${K.out(`R-HQ(config-router)#network 10.1.10.0 0.0.0.255 area 0`, "network <address> <wildcard> area <area-id>")}
<p>The most misunderstood fact in OSPF configuration: <b>the <code>network</code> command does not advertise the network you type.</b> It is a <i>filter</i>: &ldquo;any interface whose IP address matches this pattern — run OSPF on it, in this area.&rdquo; OSPF then advertises those interfaces' real subnets. What you type is only a pattern for picking interfaces.</p>
<h3>Wildcards: 0 = must match, 1 = don't care</h3>
<p>The pattern is an address plus a ${K.g("wildcard mask","A 32-bit pattern: 0 bit = this bit must match, 1 bit = ignore it. For a subnet it is 255.255.255.255 minus the mask.")} (Module 3). For a normal subnet it's the mask upside down: <b>subtract each octet from 255</b>. /24 = <code>255.255.255.0</code> → <code>0.0.0.255</code>: first three octets must match, the last can be anything.</p>
<div class="tablewrap"><table>
<tr><th>Prefix</th><th>Mask</th><th>Wildcard</th><th>A statement with it catches</th></tr>
<tr><td>/32</td><td><code>255.255.255.255</code></td><td><code>0.0.0.0</code></td><td>One exact address — one interface</td></tr>
<tr><td>/30</td><td><code>255.255.255.252</code></td><td><code>0.0.0.3</code></td><td>4 addresses — a point-to-point link</td></tr>
<tr><td>/24</td><td><code>255.255.255.0</code></td><td><code>0.0.0.255</code></td><td>256 addresses — a typical LAN</td></tr>
<tr><td>/8</td><td><code>255.0.0.0</code></td><td><code>0.255.255.255</code></td><td>Everything with the same first octet</td></tr>
<tr><td>all</td><td>—</td><td><code>255.255.255.255</code></td><td>Every interface (<code>network 0.0.0.0 255.255.255.255</code>)</td></tr>
</table></div>
${K.drill({title:"masks to wildcards until it's automatic", types:["wildcard"], count:5})}
<h3>Worked example: four ways to write a statement on R-HQ</h3>
<p>R-HQ, a distributor's head-office router: G0/0 <code>10.1.10.1/24</code> (staff LAN), G0/1 <code>10.1.0.1/30</code> (to R-BR1), G0/2 <code>10.1.0.5/30</code> (to R-BR2), Lo0 <code>10.1.255.1/32</code>, and G0/3 <code>192.0.2.2/30</code> to the ISP, which must stay out of OSPF.</p>
${K.steps([
  ["Exact interface: 0.0.0.0", "<code>network 10.1.10.1 0.0.0.0 area 0</code> — every bit must match, so only the interface addressed exactly <code>10.1.10.1</code> (G0/0). OSPF still advertises G0/0's whole subnet, <code>10.1.10.0/24</code>."],
  ["A /24: 0.0.0.255", "<code>network 10.1.10.0 0.0.0.255 area 0</code> — any interface in <code>10.1.10.0</code>–<code>.255</code>: G0/0 again. The usual way to write it: the subnet and its wildcard."],
  ["A /30: 0.0.0.3", "<code>network 10.1.0.0 0.0.0.3 area 0</code> — <code>10.1.0.0</code>–<code>.3</code>: G0/1 yes, G0/2 (<code>.5</code>) no. G0/2 needs <code>network 10.1.0.4 0.0.0.3 area 0</code>."],
  ["Everything in 10.0.0.0/8", "<code>network 10.0.0.0 0.255.255.255 area 0</code> — first octet must be 10: catches G0/0, G0/1, G0/2 and Lo0, not G0/3 (<code>192.0.2.2</code>). Quick, keeps the ISP out — but any 10.x interface added later (guest Wi-Fi, a test VLAN) joins OSPF automatically."],
])}
<p>Why does <code>10.1.0.5</code> miss <code>10.1.0.0 0.0.0.3</code>? Compare only the bits where the wildcard is 0:</p>
${K.out(`wildcard  .3   = 0000 0011   -> first 6 bits must match, last 2 don't care
pattern   .0   = 0000 00|xx
G0/1      .1   = 0000 00|01   000000 = 000000  -> MATCH
G0/2      .5   = 0000 01|01   000001 ≠ 000000  -> no match`, "The two 'don't care' bits are exactly the host bits of a /30.")}
${K.svg("0 0 740 300",
  K.dev("router",90,140,"R-HQ","")+
  K.box(170,20,170,40,"G0/0 · 10.1.10.1/24","staff LAN")+
  K.box(170,80,170,40,"G0/1 · 10.1.0.1/30","to R-BR1")+
  K.box(170,140,170,40,"G0/2 · 10.1.0.5/30","to R-BR2")+
  K.box(170,200,170,40,"Lo0 · 10.1.255.1/32","loopback")+
  K.box(170,250,170,40,"G0/3 · 192.0.2.2/30","ISP — keep out",true)+
  K.link(114,134,170,40)+K.link(114,138,170,100)+K.link(114,142,170,160)+K.link(114,146,170,220)+K.link(114,150,170,270)+
  K.band(370,8,170,24,"10.1.10.0 0.0.0.255")+K.band(552,8,180,24,"10.0.0.0 0.255.255.255")+
  K.txt(455,46,"✓ match",{c:"ok",s:12,mid:true,b:true})+K.txt(642,46,"✓ match",{c:"ok",s:12,mid:true,b:true})+
  K.txt(455,106,"✗",{c:"bad",s:13,mid:true,b:true})+K.txt(642,106,"✓ match",{c:"ok",s:12,mid:true,b:true})+
  K.txt(455,166,"✗",{c:"bad",s:13,mid:true,b:true})+K.txt(642,166,"✓ match",{c:"ok",s:12,mid:true,b:true})+
  K.txt(455,226,"✗",{c:"bad",s:13,mid:true,b:true})+K.txt(642,226,"✓ match",{c:"ok",s:12,mid:true,b:true})+
  K.txt(455,276,"✗",{c:"bad",s:13,mid:true,b:true})+K.txt(642,276,"✗ (192 ≠ 10)",{c:"bad",s:12,mid:true,b:true}),
  "A network statement filters interface addresses. The /24 statement catches only G0/0; the 10.0.0.0/8 statement catches every 10.x interface — never the ISP link at 192.0.2.2.")}
${K.mistake(`Typing the subnet mask as the wildcard: <code>network 10.1.10.0 255.255.255.0 area 0</code>. Current IOS spots a mask in the network command and quietly stores it inverted — <code>show running-config</code> then shows <code>0.0.0.255</code> — but don't rely on it: older releases took it literally, and as a wildcard it means &ldquo;ignore the first three octets, the last must be exactly 0&rdquo;; no interface ends in <code>.0</code>, so OSPF runs on nothing. The exam, and the other wildcard commands you'll meet later, expect a real wildcard. Empty <code>show ip ospf interface brief</code>? Read your wildcards first.`)}
<h3>Two statements match one interface: the most specific wins</h3>
<p>If an interface matches several statements, <b>IOS uses the most specific</b> — the wildcard with the most 0 bits — whatever order you typed them. Current IOS even re-sorts overlapping statements so the running-config lists the most specific first. (Old Cisco documentation still says &ldquo;the first statement in the list wins&rdquo; — on today's IOS the first one listed <i>is</i> the most specific, so both readings give the same answer.) Same instinct as longest match in the routing table (lesson 1). It lets you write a broad rule plus a precise exception; more often you meet it as a leftover line overriding yours:</p>
${K.out(`router ospf 1
 network 10.1.10.0 0.0.0.255 area 1
 network 10.0.0.0 0.255.255.255 area 0`, "Both match G0/0 (10.1.10.1). The /24 statement has 24 must-match bits versus 8, so G0/0 runs in area 1.")}
<p>The <b>Area</b> column of <code>show ip ospf interface brief</code> shows which statement won. To remove a stale line, type it again with <code>no</code>: <code>no network 10.1.10.0 0.0.0.255 area 1</code>. (Other areas are lesson 6; here the area is just the fingerprint.)</p>
${K.remember(`<b>A network statement picks interfaces; it doesn't advertise prefixes.</b> Wildcard = 255.255.255.255 − mask; 0 must match, 1 don't care. Two match? <b>Most specific wins</b>.`)}
${K.q({type:"fill", q:"Work out the wildcard for each subnet (none was in the table).", fields:[{label:"172.20.64.0/22", a:["0.0.3.255"]},{label:"192.168.7.40/29", a:["0.0.0.7"]},{label:"10.8.0.0/12", a:["0.15.255.255"]}], why:"255 minus each mask octet: /22 = 255.255.252.0 → 0.0.3.255; /29 = 255.255.255.248 → 0.0.0.7; /12 = 255.240.0.0 → 0.15.255.255."})}
${K.hint(`Turn the statement into a range first: <code>0.0.1.255</code> lets the lowest bit of the third octet vary. Starting from 4, which third-octet values does that cover?`)}
${K.q({type:"multi", q:"Same logic, new situation. R-YAB has G0/0 172.20.4.1/24, G0/1 172.20.5.1/24, G0/2 172.20.6.1/24, G0/3 172.20.8.9/30 and Lo0 172.21.4.1/32. Which interfaces does network 172.20.4.0 0.0.1.255 area 0 put into OSPF? (Choose two.)", o:["G0/0 172.20.4.1","G0/1 172.20.5.1","G0/2 172.20.6.1","G0/3 172.20.8.9","Lo0 172.21.4.1"], a:[0,1], why:"1. Asked: which addresses match. 2. Rule: compare only the bits where the wildcard is 0. 3. Apply: 172.20 must match exactly; in the third octet only the lowest bit may differ, and the fourth is ignored. 4 = 00000100, so 4 and 5 (00000101) match; 6 (00000110) changes a must-match bit. Range 172.20.4.0–172.20.5.255: G0/0 and G0/1. G0/3 is 172.20.8.x and Lo0 starts 172.21."})}
${K.check({q:"Which single statement puts only R-HQ's G0/2 (10.1.0.5/30) into OSPF area 0?", o:["network 10.1.0.0 0.0.0.3 area 0","network 10.1.0.4 0.0.0.3 area 0","network 10.1.0.4 0.0.0.7 area 0","network 10.1.0.0 0.0.0.255 area 0"], a:1, why:"10.1.0.4 0.0.0.3 covers .4–.7, containing .5 and no other R-HQ interface. .0 0.0.0.3 is G0/1's block; 0.0.0.7 ignores the last three bits, so it covers .0–.7 and catches G0/1 (.1) too; 0.0.0.255 would also catch G0/1."})}

<h2>The interface method, router IDs and loopbacks</h2>
<h3>The interface method: <code>ip ospf 1 area 0</code></h3>
${K.out(`R-BR1(config)#interface g0/1
R-BR1(config-if)#ip ospf 1 area 0
R-BR1(config-if)#interface g0/0
R-BR1(config-if)#ip ospf 1 area 0
R-BR1(config-if)#interface loopback 0
R-BR1(config-if)#ip ospf 1 area 0`, "ip ospf <process-id> area <area-id> claims exactly the interface you're on (and creates router ospf 1 if it doesn't exist).")}
<p>Same effect as a matching statement, but <b>exact</b> (no wildcard maths), it <b>beats any network statement</b> that also matches, and outputs say so: <code>Attached via Interface Enable</code> in <code>show ip ospf interface</code>, <code>Routing on Interfaces Configured Explicitly</code> in <code>show ip protocols</code>. Teams like it because each interface's OSPF role sits in its own config, templates are simpler, nothing joins by accident, and OSPFv3 for IPv6 (later) works only this way. Older configs and the exam use statements, so learn both.</p>
${K.when([
  ["Broad network statement","Small network, clean plan, every 10.x interface should run OSPF","One line, nothing to forget","New subnets (guest, test) would join OSPF automatically"],
  ["Exact network statements","Only listed subnets in OSPF, in configs already using statements","Precise; readable in show ip protocols","Many interfaces — long lists invite wildcard typos"],
  ["ip ospf 1 area 0","Modern builds, templates, automation","No maths; beats statements; same as OSPFv3","An old router whose design uses statements — don't mix styles without reason"],
], "Which way to enable OSPF on interfaces")}
<h3>Router IDs: chosen once, at start-up</h3>
<p>The ${K.g("router ID","RID: a 32-bit number written like an IPv4 address that names an OSPF router. Must be unique; every LSA carries it.")} is the router's name in OSPF (lesson 3). When the process starts, IOS picks it in this order:</p>
<ol><li>the <code>router-id</code> command;</li><li>otherwise the <b>highest IP on an up loopback</b>;</li><li>otherwise the <b>highest IP on an up physical interface</b> (it needn't be running OSPF).</li></ol>
<p>The catch: <b>it's chosen once and then kept</b>, even if you add a higher loopback or the source interface goes down. Why so stubborn? A new name means all its LSAs come from a &ldquo;different router&rdquo;: adjacencies rebuild and everything re-floods. IOS won't do that behind your back — so if the process already has an ID, <code>router-id</code> is stored but not used:</p>
${K.out(`R-HQ(config)#router ospf 1
R-HQ(config-router)#router-id 10.1.255.1
% OSPF: Reload or use "clear ip ospf process" command, for this to take effect
R-HQ(config-router)#end
R-HQ#clear ip ospf process
Reset ALL OSPF processes? [no]: yes
R-HQ#show ip protocols | include Router ID
  Router ID 10.1.255.1`, "Saved, not yet in use. clear ip ospf process restarts OSPF, which picks the ID again — now from router-id.")}
<p>The restart drops every adjacency on that router for a few seconds: use a change window, or better, set the ID before any neighbour forms.</p>
${K.mistake(`Seeing the message and moving on. The running-config shows the new ID, so it <i>looks</i> done — but <code>show ip protocols</code> and every neighbour still show the old one. Always check <code>show ip protocols</code>.`)}
<h3>Why loopbacks</h3>
<p>A ${K.g("loopback interface","A virtual interface (interface loopback 0) with no cable: up as long as the router is up. Usually a /32, the router's stable identity.")} is up whenever the router is. <b>Stable:</b> no cable to pull. <b>Predictable:</b> with &ldquo;Lo0 = <code>10.1.255.&lt;site&gt;</code>&rdquo;, neighbour tables read like a site list. <b>Reachable:</b> advertised, it's an address you can ping and SSH to over any working path. The habit: create Lo0, set <code>router-id</code> to match, advertise Lo0.</p>
<p>Claim it like any interface (<code>network 10.1.255.3 0.0.0.0 area 0</code> or <code>ip ospf 1 area 0</code>). Others learn it as a ${K.g("host route","A route to one single address: a /32.")} — <b>always /32, even if you configured /24</b>, because a loopback is one address with nothing behind it:</p>
${K.out(`R-BR2#show ip ospf interface lo0
Loopback0 is up, line protocol is up
  Internet Address 10.1.255.3/32, Interface ID 4, Area 0
  Attached via Network Statement
  Process ID 1, Router ID 10.1.255.3, Network Type LOOPBACK, Cost: 1
  Loopback interface is treated as a stub Host`, "Elsewhere this appears as O 10.1.255.3/32. (ip ospf network point-to-point on a loopback advertises its configured mask instead — rarely needed.)")}
${K.dyk(`A router ID only <i>looks</i> like an IP address; it needn't exist on any interface or be reachable. Labs use <code>1.1.1.1</code>, <code>2.2.2.2</code>… even though 1.1.1.1 is a real public DNS service — router IDs are never routed, so nothing clashes. In production, an ID that matches an advertised loopback is kinder to the next engineer.`)}
<h3>Practise: clean up the Kano branch router</h3>
<p>A contractor left R-KANO half-done: a process with one leftover statement and no loopback. Finish it — the tasks guide you; <code>passive-interface</code> is explained in full later. G0/0 <code>10.20.30.1/24</code> (staff LAN), G0/1 <code>10.20.0.1/30</code> (to HQ), G0/2 <code>10.20.0.5/30</code> (to Kaduna).</p>
${K.hint(`Each /30 block starts at a multiple of 4. <code>do show ip ospf interface brief</code> works in <code>(config-router)#</code>. Remove a statement by typing it again with <code>no</code> in front.`)}
${K.term({env:"ios2", title:"OSPF on R-KANO: statements, router ID, most-specific match", opts:{kind:"router", host:"R-KANO", model:"ISR 1100"},
  setup:env=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description KANO-STAFF-LAN","ip address 10.20.30.1 255.255.255.0","no shutdown","interface g0/1","description WAN-TO-HQ","ip address 10.20.0.1 255.255.255.252","no shutdown","interface g0/2","description WAN-TO-KADUNA","ip address 10.20.0.5 255.255.255.252","no shutdown","router ospf 1","network 10.20.30.0 0.0.0.255 area 1","end","disable"].forEach(c=>env.exec(c)); },
  intro:"Start with <code>enable</code> and <code>show ip protocols</code>: read the router ID OSPF picked and the contractor's leftover statement before you change anything.",
  tasks:[
    {text:"<code>show ip protocols</code> — note the router ID OSPF chose by itself (with no loopback, the highest up interface address) and the leftover <code>area 1</code> statement", done:e=>e.log.some(l=>/Router ID 10\.20\.30\.1/.test(l.out||"") && /10\.20\.30\.0 0\.0\.0\.255 area 1/.test(l.out||""))},
    {text:"Add one network statement per WAN link that matches exactly that /30, in area 0 (work out each subnet and wildcard yourself)", done:e=>{ const n = (e.ospf&&e.ospf.networks)||[]; const hit = b => n.some(w=>w.wild==="0.0.0.3" && w.area===0 && /^10\.20\.0\.\d+$/.test(w.net) && ((+w.net.split(".")[3]) & 252)===b); return hit(0) && hit(4); }},
    {text:"Create <code>interface loopback 0</code> with <code>10.20.255.7 255.255.255.255</code> and advertise it with an exact-match (<code>0.0.0.0</code>) statement in area 0", done:e=>{ const l = e.intfs["Loopback0"]; return !!(l && l.ip==="10.20.255.7" && e.ospf && e.ospf.networks.some(w=>w.net==="10.20.255.7" && w.wild==="0.0.0.0" && w.area===0)); }},
    {text:"Make the router ID <code>10.20.255.7</code> — set it, read what IOS says, restart the process with <code>clear ip ospf process</code> and confirm with <code>show ip protocols</code>", done:e=>{ const i = e.ospfInfo && e.ospfInfo(); return !!(i && i.rid==="10.20.255.7" && e.log.some(l=>/Reload or use "clear ip ospf process"/.test(l.out||""))); }},
    {text:"Add the catch-all <code>network 10.0.0.0 0.255.255.255 area 0</code>, then <code>show ip ospf interface brief</code>: Gi0/0 is <i>still</i> in area 1. Remove the leftover statement so Gi0/0 moves to area 0", done:e=>{ const i = e.ospfInfo && e.ospfInfo(); const g = i && i.ifaces.find(f=>f.ios==="GigabitEthernet0/0"); return !!(g && g.area===0 && !e.ospf.networks.some(w=>w.area===1) && e.log.some(l=>/Gi0\/0\s+1\s+1\s+10\.20\.30\.1\/24/.test(l.out||""))); }},
    {text:"Gi0/0 has only staff PCs on it: <code>passive-interface g0/0</code> under <code>router ospf 1</code> (stop sending hellos there but keep advertising the LAN)", done:e=>!!(e.ospf && (e.ospf.passiveDefault ? !(e.ospf.noPassive||[]).includes("GigabitEthernet0/0") : (e.ospf.passive||[]).includes("GigabitEthernet0/0")))},
    {text:"Save the configuration", done:e=>e.savedOnce},
  ],
  win:"You enabled OSPF with exact /30 and /32 statements, gave R-KANO a stable router ID that matches its loopback (and saw why IOS needs the process restarted), proved that the most specific statement beats a catch-all whatever order you type them, and made the user LAN passive.",
  solve:["enable","show ip protocols","configure terminal","router ospf 1","network 10.20.0.0 0.0.0.3 area 0","network 10.20.0.4 0.0.0.3 area 0","exit","interface loopback 0","ip address 10.20.255.7 255.255.255.255","exit","router ospf 1","network 10.20.255.7 0.0.0.0 area 0","router-id 10.20.255.7","network 10.0.0.0 0.255.255.255 area 0","do show ip ospf interface brief","no network 10.20.30.0 0.0.0.255 area 1","do show ip ospf interface brief","passive-interface g0/0","end","clear ip ospf process","yes","show ip protocols","copy running-config startup-config",""]})}
<p>Notice: the loopback didn't change the ID — only the restart did. And the catch-all didn't rescue Gi0/0: the more specific leftover kept winning.</p>
${K.hint(`Walk the order: a <code>router-id</code> already <i>in use</i>? Then: which loopbacks are up? Physical interfaces count only if there are none.`)}
${K.q({type:"fill", q:"Same logic, new situation. R-JOS boots with Lo0 192.168.100.1/32 (up), Lo1 10.255.255.9/32 (up), G0/0 203.0.113.250/30 (up), router ospf 1 and no router-id. Later someone adds router-id 0.0.0.9 and nothing else. What RID does show ip protocols show now — and after clear ip ospf process?", fields:[{label:"Now", a:["192.168.100.1"]},{label:"After clear ip ospf process", a:["0.0.0.9"]}], why:"1. Asked: the RID in use at two moments. 2. Rule: router-id, else highest up loopback, else highest up physical — chosen at process start. 3. Apply: at boot, no router-id, so the highest loopback, 192.168.100.1, wins (loopbacks beat the higher physical 203.0.113.250). Adding router-id prints the Reload or clear message and changes nothing yet. After the clear, router-id is first in the order: 0.0.0.9."})}
${K.check({q:"A router has an up Loopback0 at 10.0.0.1 and an up G0/1 at 172.31.9.1, no router-id. What is its router ID?", o:["172.31.9.1, the highest address","10.0.0.1, because an up loopback is preferred over physical interfaces","0.0.0.0 until router-id is set","Whichever interface was configured first"], a:1, why:"Without router-id, the highest up loopback address is used before any physical interface is considered, even a higher one."})}

<h2>Verifying OSPF — then build it on a triangle</h2>
<p><b>The rule: verify inside out.</b> Is OSPF running on the right interfaces? → has it found its neighbours? → has it learned routes? → does traffic flow? Each step depends on the one before; starting at the routing table shows you a symptom, not a cause.</p>
${K.steps([
  ["Process", "<code>show ip protocols</code> — router ID, statements (or explicit interfaces), passive interfaces, route sources."],
  ["Interfaces", "<code>show ip ospf interface brief</code> — the right interfaces, the right area, and no ISP link."],
  ["Neighbours", "<code>show ip ospf neighbor</code> — one line per neighbour, <code>FULL</code>."],
  ["Routes", "<code>show ip route ospf</code> — other routers' subnets as <code>O</code>, sensible costs."],
  ["Traffic", "<code>ping</code> and <code>traceroute</code> (<code>tracert</code> on Windows) from a host."],
])}
<h3>Reading the outputs</h3>
<p>From R-HQ, with both branches configured:</p>
${K.out(`R-HQ#show ip protocols
Routing Protocol is "ospf 1"
  Outgoing update filter list for all interfaces is not set
  Incoming update filter list for all interfaces is not set
  Router ID 10.1.255.1
  It is an autonomous system boundary router
 Redistributing External Routes from,
  Number of areas in this router is 1. 1 normal 0 stub 0 nssa
  Maximum path: 4
  Routing for Networks:
    10.1.10.0 0.0.0.255 area 0
    10.1.0.0 0.0.0.3 area 0
    10.1.0.4 0.0.0.3 area 0
    10.1.255.1 0.0.0.0 area 0
  Passive Interface(s):
    GigabitEthernet0/0
  Routing Information Sources:
    Gateway         Distance      Last Update
    10.1.255.2           110      00:29:17
    10.1.255.3           110      00:29:18
  Distance: (default is 110)`, "How OSPF is set up on R-HQ.")}
<ul>
<li><code>Router ID</code> — the ID <i>in use</i>. <code>autonomous system boundary router</code> — R-HQ injects a default route (last section).</li>
<li><code>Maximum path: 4</code> — up to four equal-cost paths at once (ECMP, lesson 6).</li>
<li><code>Routing for Networks</code> — your statements as typed. <code>Routing Information Sources</code> — router IDs it learns routes from, at OSPF's administrative distance (AD), 110.</li>
</ul>
${K.out(`R-HQ#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0               10.1.10.1/24       1     DR    0/0
Gi0/1        1     0               10.1.0.1/30        1     BDR   1/1
Gi0/2        1     0               10.1.0.5/30        1     BDR   1/1
Lo0          1     0               10.1.255.1/32      1     LOOP  0/0`, "G0/3, the ISP link, is absent — as intended.")}
<ul>
<li><b>Interface / PID (process ID) / Area</b> — a wrong statement shows here as a missing interface or wrong area.</li>
<li><b>Cost</b> — 100 Mb/s reference ÷ bandwidth, minimum 1, so gigabit = 1 (lesson 6 tunes it).</li>
<li><b>State</b> — the role on the segment: <code>DR</code>, <code>BDR</code>, <code>DROTH</code> (a DROTHER), <code>P2P</code>, <code>LOOP</code> (lesson 5). A LAN with no other router shows <code>DR</code>: it's the only candidate.</li>
<li><b>Nbrs F/C</b> — <b>F</b>ull / <b>C</b>ounted neighbours: <code>1/1</code> on a router link is healthy, <code>0/0</code> on a user LAN is right.</li>
</ul>
${K.out(`R-HQ#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
10.1.255.2        1   FULL/DR         00:00:39    10.1.0.2        GigabitEthernet0/1
10.1.255.3        1   FULL/DR         00:00:35    10.1.0.6        GigabitEthernet0/2`, "Two neighbours, both FULL.")}
<p><b>Neighbor ID</b> is the neighbour's <i>router ID</i>. <code>FULL</code> means the databases are in sync (the role after the slash, and <b>Pri</b>, are lesson 5). <b>Dead Time</b> counts down from 40 and resets with each hello; at zero the neighbour is declared down. <b>Address</b> is its IP on the link; <b>Interface</b> is yours.</p>
${K.out(`R-HQ#show ip route ospf

Gateway of last resort is 192.0.2.1 to network 0.0.0.0

      10.0.0.0/8 is variably subnetted, 11 subnets, 3 masks
O        10.1.20.0/24 [110/2] via 10.1.0.2, 00:06:16, GigabitEthernet0/1
O        10.1.30.0/24 [110/2] via 10.1.0.6, 00:14:17, GigabitEthernet0/2
O        10.1.255.2/32 [110/2] via 10.1.0.2, 00:09:45, GigabitEthernet0/1
O        10.1.255.3/32 [110/2] via 10.1.0.6, 00:26:16, GigabitEthernet0/2`, "Only OSPF-learned routes; the loopbacks arrive as /32s.")}
<p><code>[110/2]</code> is AD 110 and cost 2: R-HQ's G0/1 (1) plus R-BR1's LAN interface (1). A router never learns its own subnets from OSPF — connected (AD 0) beats OSPF (110).</p>
${K.exam(`How to read a routing question: <b>1. What is asked</b> — which route, whether a neighbour forms, which interfaces run OSPF? <b>2. Which rule</b> — wildcard match, most specific statement, router-ID order, longest match, AD, passive? <b>3. Work it through</b> on the exhibit, one interface or line at a time. Most wrong answers apply the right rule to the wrong question — e.g. comparing AD when the prefix lengths differ (longest match decides first).`)}
<h3>Hands-on: build OSPF on a three-site triangle</h3>
<p>Lagos (R-LOS), Abuja (R-ABJ) and Port Harcourt (R-PHC) are cabled in a triangle, each with a LAN and a PC. Interface addresses are done; <b>no OSPF exists anywhere</b>. Enable it three different ways — exact statements on R-LOS, one broad statement on R-ABJ, the interface method on R-PHC — prove it, then break a link and watch OSPF reroute.</p>
<div class="tablewrap"><table>
<tr><th>Router</th><th>G0/0 (LAN)</th><th>G0/1</th><th>G0/2</th></tr>
<tr><td>R-LOS</td><td><code>172.16.10.1/24</code></td><td><code>172.16.0.1/30</code> → R-ABJ</td><td><code>172.16.0.5/30</code> → R-PHC</td></tr>
<tr><td>R-ABJ</td><td><code>172.16.20.1/24</code></td><td><code>172.16.0.2/30</code> → R-LOS</td><td><code>172.16.0.9/30</code> → R-PHC</td></tr>
<tr><td>R-PHC</td><td><code>172.16.30.1/24</code></td><td><code>172.16.0.6/30</code> → R-LOS</td><td><code>172.16.0.10/30</code> → R-ABJ</td></tr>
</table></div>
${K.bench({id:"m5-ospf-triangle", points:120, from:"CCNA · Module 5 · lesson 4", title:"three sites, one area — build OSPF and watch the routes arrive", viewBox:"0 0 900 490",
  intro:"Move the console cable from the laptop to each router in turn (9600 8N1, no flow control). PCs: PC-LOS 172.16.10.10, PC-ABJ 172.16.20.10, PC-PHC 172.16.30.10 — use their Command Prompts for ping and tracert. When IOS asks <code>Reset ALL OSPF processes? [no]:</code>, answer <code>yes</code>.",
  devices:[
    {id:"lap", kind:"laptop", label:"LAPTOP", x:30, y:20},
    {id:"los", kind:"router", label:"R-LOS", host:"R-LOS", model:"ISR 1100 · Lagos HQ", x:350, y:20, config:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","ip address 172.16.10.1 255.255.255.0","no shutdown","interface g0/1","ip address 172.16.0.1 255.255.255.252","no shutdown","interface g0/2","ip address 172.16.0.5 255.255.255.252","no shutdown","end"].forEach(c=>e.exec(c)); }},
    {id:"abj", kind:"router", label:"R-ABJ", host:"R-ABJ", model:"ISR 1100 · Abuja", x:60, y:220, config:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","ip address 172.16.20.1 255.255.255.0","no shutdown","interface g0/1","ip address 172.16.0.2 255.255.255.252","no shutdown","interface g0/2","ip address 172.16.0.9 255.255.255.252","no shutdown","end"].forEach(c=>e.exec(c)); }},
    {id:"phc", kind:"router", label:"R-PHC", host:"R-PHC", model:"ISR 1100 · Port Harcourt", x:640, y:220, config:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","ip address 172.16.30.1 255.255.255.0","no shutdown","interface g0/1","ip address 172.16.0.6 255.255.255.252","no shutdown","interface g0/2","ip address 172.16.0.10 255.255.255.252","no shutdown","end"].forEach(c=>e.exec(c)); }},
    {id:"pc1", kind:"pc", label:"PC-LOS", x:620, y:20, ip:"172.16.10.10", mask:"255.255.255.0", gw:"172.16.10.1"},
    {id:"pc2", kind:"pc", label:"PC-ABJ", x:60, y:380, ip:"172.16.20.10", mask:"255.255.255.0", gw:"172.16.20.1"},
    {id:"pc3", kind:"pc", label:"PC-PHC", x:760, y:380, ip:"172.16.30.10", mask:"255.255.255.0", gw:"172.16.30.1"},
  ],
  cables:[ {type:"cat6", a:"los:g1", b:"abj:g1"}, {type:"cat6", a:"los:g2", b:"phc:g1"}, {type:"cat6", a:"abj:g2", b:"phc:g2"},
           {type:"cat6", a:"pc1:eth", b:"los:g0"}, {type:"cat6", a:"pc2:eth", b:"abj:g0"}, {type:"cat6", a:"pc3:eth", b:"phc:g0"} ],
  tray:["console"],
  tasks:[
    {text:"Console into R-LOS from the laptop", done:B=>Bench.consoleOk(B,"los")},
    {text:"R-LOS: start <code>router ospf 1</code> and set <code>router-id 1.1.1.1</code>. IOS has already picked an ID from an interface, so read its message and restart the process until <code>show ip protocols</code> says <code>Router ID 1.1.1.1</code>", done:B=>{ const i = B.devs.los.env.ospfInfo(); return !!(i && i.rid==="1.1.1.1"); }},
    {text:"R-LOS: one network statement per interface, each matching only that interface's subnet (the /24 LAN and the two /30 links), all area 0", done:B=>{ const e = B.devs.los.env, i = e.ospfInfo(); if (!i) return false; const ok = ["GigabitEthernet0/0","GigabitEthernet0/1","GigabitEthernet0/2"].every(n=>i.ifaces.some(f=>f.ios===n && f.area===0 && f.via==="Network Statement")); return ok && e.ospf.networks.length>=3 && e.ospf.networks.every(w=>["0.0.0.255","0.0.0.3","0.0.0.0"].includes(w.wild)); }},
    {text:"R-ABJ: predict the router ID it will choose (no loopback, no <code>router-id</code>), then enable OSPF on every 172.16 interface with the single statement <code>network 172.16.0.0 0.0.255.255 area 0</code> and check your prediction in <code>show ip protocols</code>. R-LOS should now list R-ABJ as a FULL neighbour", done:B=>{ const e = B.devs.abj.env; return !!(e.ospf && e.ospf.networks.some(w=>w.net==="172.16.0.0" && w.wild==="0.0.255.255" && w.area===0) && e.log.some(l=>/Router ID 172\.16\.20\.1/.test(l.out||"")) && Bench.ospfNbr(B,"los","172.16.20.1")); }},
    {text:"R-PHC: use the interface method only — <code>ip ospf 1 area 0</code> on G0/0, G0/1 and G0/2, no network statements — and give it router ID <code>3.3.3.3</code> (restart the process when IOS asks)", done:B=>{ const e = B.devs.phc.env, i = e.ospfInfo(); return !!(i && i.rid==="3.3.3.3" && e.ospf.networks.length===0 && ["GigabitEthernet0/0","GigabitEthernet0/1","GigabitEthernet0/2"].every(n=>i.ifaces.some(f=>f.ios===n && f.area===0 && f.via==="Interface Configuration"))); }},
    {text:"Every router has two FULL neighbours (check <code>show ip ospf neighbor</code> on the router you're on)", done:B=>["los","abj","phc"].every(r=>Bench.ospfNbrCount(B,r)===2)},
    {text:"R-PHC: <code>show ip route ospf</code> lists the Lagos and Abuja LANs as <code>O</code> routes with cost 2", done:B=>{ const a = Bench.route(B,"phc","172.16.10.0/24","O"), b = Bench.route(B,"phc","172.16.20.0/24","O"); return !!(a && b && a.metric===2 && b.metric===2 && B.devs.phc.env.log.some(l=>/O\s+172\.16\.10\.0\/24 \[110\/2\]/.test(l.out||""))); }},
    {text:"From PC-LOS, ping PC-PHC (<code>172.16.30.10</code>) and PC-ABJ (<code>172.16.20.10</code>)", done:B=>Bench.pinged(B,"pc1","172.16.30.10") && Bench.pinged(B,"pc1","172.16.20.10")},
    {text:"Break the direct Lagos–Port Harcourt link: on R-LOS, <code>shutdown</code> G0/2. R-LOS's route to <code>172.16.30.0/24</code> should change to cost 3 via R-ABJ — check <code>show ip route ospf</code>, then <code>tracert 172.16.30.10</code> from PC-LOS and count the hops", done:B=>{ const r = Bench.route(B,"los","172.16.30.0/24","O"); return !!(B.devs.los.env.intfs["GigabitEthernet0/2"].shut && r && r.metric===3 && r.via[0]==="172.16.0.2" && Bench.traced(B,"pc1","172.16.30.10")); }},
    {text:"Bring G0/2 back (<code>no shutdown</code>) so the route returns to cost 2 direct, and make sure all three routers' configs are saved", done:B=>{ const r = Bench.route(B,"los","172.16.30.0/24","O"); return !!(!B.devs.los.env.intfs["GigabitEthernet0/2"].shut && r && r.metric===2 && ["los","abj","phc"].every(x=>B.devs[x].env.savedOnce)); }},
  ],
  win:"You built a three-router OSPF area three different ways — exact statements, one broad statement, the interface method — set router IDs (and saw R-ABJ pick 172.16.20.1 by itself), proved it inside out with protocols, interfaces, neighbours, routes and pings, and watched OSPF reroute around a failed link in one step, with no static route touched.",
  solve:[["plug","console","lap:usb","los:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","router ospf 1"],["term","router-id 1.1.1.1"],["term","network 172.16.10.0 0.0.0.255 area 0"],["term","network 172.16.0.0 0.0.0.3 area 0"],["term","network 172.16.0.4 0.0.0.3 area 0"],["term","end"],
    ["term","clear ip ospf process"],["term","yes"],["term","show ip protocols"],["term","copy running-config startup-config"],["term",""],
    ["unplug","lap:usb"],["plug","console","lap:usb","abj:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","router ospf 1"],["term","network 172.16.0.0 0.0.255.255 area 0"],["term","end"],["term","show ip protocols"],["term","show ip ospf neighbor"],["term","copy running-config startup-config"],["term",""],
    ["unplug","lap:usb"],["plug","console","lap:usb","phc:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/0"],["term","ip ospf 1 area 0"],["term","interface g0/1"],["term","ip ospf 1 area 0"],["term","interface g0/2"],["term","ip ospf 1 area 0"],["term","exit"],["term","router ospf 1"],["term","router-id 3.3.3.3"],["term","end"],
    ["term","clear ip ospf process"],["term","yes"],["term","show ip ospf neighbor"],["term","show ip route ospf"],["term","copy running-config startup-config"],["term",""],
    ["pc","pc1","ping 172.16.30.10"],["pc","pc1","ping 172.16.20.10"],
    ["unplug","lap:usb"],["plug","console","lap:usb","los:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/2"],["term","shutdown"],["term","end"],["term","show ip route ospf"],["pc","pc1","tracert 172.16.30.10"],
    ["term","configure terminal"],["term","interface g0/2"],["term","no shutdown"],["term","end"],["term","show ip route ospf"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`No neighbour? Go back a rung: does <code>show ip ospf interface brief</code> on <i>both</i> routers list the link? If one side is missing, its statement doesn't match that address.`)}
<p>What you saw: R-ABJ, left alone, picked <code>172.16.20.1</code>, its highest up interface. Three configuration styles gave identical routing tables, because OSPF advertises the interfaces' real subnets, never the statements. With R-LOS G0/2 down, SPF re-ran and the Port Harcourt LAN moved to cost 3 via Abuja: the four-hop <code>tracert</code>.</p>
${K.hint(`Start at the lowest rung: which interfaces is R5 running OSPF on, and does Gi0/2's address fall inside either statement's range?`)}
${K.reveal("Same logic, new situation: one neighbour missing on R5", `<p>R5 should see R4 (G0/1) and R6 (G0/2); <code>show ip ospf neighbor</code> lists only R4, and <code>show ip ospf interface brief</code> lists Gi0/0 and Gi0/1 only. R5 has <code>network 10.4.0.0 0.0.0.3 area 0</code> and <code>network 10.4.10.0 0.0.0.255 area 0</code>; Gi0/2 is <code>10.4.0.6/30</code>.</p>
<ol><li><b>Asked:</b> why one adjacency is missing.</li><li><b>Rule:</b> inside out — before neighbours, OSPF must run on the interface, which needs a statement or <code>ip ospf</code> to claim it.</li>
<li><b>Apply:</b> Gi0/2 isn't listed, so look at the statements, not R6. <code>10.4.0.0 0.0.0.3</code> covers .0–.3; <code>.6</code> is in the next block (.4–.7). Add <code>network 10.4.0.4 0.0.0.3 area 0</code> (or <code>ip ospf 1 area 0</code> on Gi0/2), then check Gi0/2 appears and R6 reaches FULL.</li></ol>`)}
${K.check({q:"show ip ospf neighbor shows 'Neighbor ID 10.9.255.4 ... Address 10.9.0.14 ... GigabitEthernet0/2'. What is 10.9.255.4?", o:["The neighbour's IP on the shared link","The neighbour's router ID","This router's own router ID","The default route's next hop"], a:1, why:"Neighbor ID is always the neighbour's router ID. Its link address is in Address (10.9.0.14); your interface is in Interface."})}

<h2>Passive interfaces: advertise the LAN, don't talk on it</h2>
<p>In the triangle, every router sent hellos onto its user LAN, to PCs that never answer. The risk is <b>who might answer</b>. Anything on that LAN that speaks OSPF — a contractor's test router, a virtual router on a laptop, an attacker with free software — can become a neighbour, and its LSAs are trusted. It could advertise a more specific route to the payroll server and, by longest match, pull that traffic to itself, or advertise a default that black-holes the branch. User LANs must be <i>advertised</i>; nobody needs to <i>talk</i> OSPF on them.</p>
<p><b>The decision rule:</b> <code>passive-interface</code> stops hellos on an interface — so no neighbour can form there — but its subnet is still advertised. Talking off, advertising on.</p>
${K.svg("0 0 740 270",
  K.dev("router",370,120,"R-BR1","")+
  K.dev("router",640,120,"R-HQ","neighbour")+
  K.dev("switch",110,120,"LAN switch","")+
  K.dev("pc",40,220,"PC","")+K.dev("pc",180,220,"PC","")+
  K.link(346,120,136,120,"G0/0 · 10.1.20.0/24")+K.link(394,120,616,120,"G0/1 · 10.1.0.0/30")+
  K.link(100,131,48,198)+K.link(120,131,176,198)+
  K.arrow(420,92,600,92,"hellos every 10 s",true)+
  K.txt(240,92,"passive: no hellos",{c:"bad",s:11.5,mid:true,b:true})+
  K.band(250,175,240,24,"R-BR1's LSA: 10.1.20.0/24 ✓ + 10.1.0.0/30 ✓","var(--chip)")+
  K.arrow(490,187,600,150,"flooded",false)+
  K.txt(370,250,"passive-interface default · no passive-interface g0/1",{c:"fg",s:11,mid:true}),
  "The passive LAN sends no hellos, so nothing on it can become a neighbour — but its subnet is still in R-BR1's LSA, so every router keeps a route to it. The link to R-HQ stays active.")}
${K.out(`! one interface at a time
R-HQ(config)#router ospf 1
R-HQ(config-router)#passive-interface g0/0

! or: everything passive, then name the exceptions
R-BR1(config)#router ospf 1
R-BR1(config-router)#passive-interface default
R-BR1(config-router)#no passive-interface g0/1`, "passive-interface <if> silences one interface. passive-interface default silences all; no passive-interface <if> re-activates the ones that need neighbours.")}
<p>Pick the shorter list, and think ahead: on a branch router with one uplink and several LANs, <code>passive-interface default</code> means any interface added later starts silent.</p>
${K.when([
  ["passive-interface &lt;if&gt;","Few interfaces should be passive (core routers, mostly router links)","Short; every passive interface visible","You keep adding LANs — each talks OSPF until someone remembers"],
  ["passive-interface default + exceptions","Most interfaces face users (branch routers, L3 switches with many SVIs)","Secure by default: new interfaces are silent","Nearly every interface needs a neighbour"],
], "Passive one by one, or by default")}
${K.out(`R-BR1#show ip ospf interface g0/0 | include Passive
    No Hellos (Passive interface)

R-BR1#show ip protocols | begin Passive
  Passive Interface(s):
    GigabitEthernet0/0
    Loopback0`, "With passive-interface default even Loopback0 is listed — harmless; OSPF never sends hellos on a loopback anyway.")}
<p>The other half of the proof: R-HQ still has <code>O 10.1.20.0/24</code>, and head office still reaches branch 1's PCs. Passive hides the LAN from OSPF <i>conversations</i>, not from routing tables.</p>
${K.mistake(`Making the neighbour link passive — usually <code>passive-interface default</code> without the <code>no passive-interface</code> line. Hellos stop and the adjacency drops: at once on this router (<code>%OSPF-5-ADJCHG: ... from FULL to DOWN, Neighbor Down: Interface down or detached</code>), and on the neighbour when its 40-second dead time runs out (<code>Dead timer expired</code>) — and every route through that link vanishes. Type the exception in the same change.`)}
${K.q({type:"multi", q:"Same logic, new situation. Warehouse router R-WH has G0/0 to the core router (must be a neighbour), G0/1 the barcode-scanner LAN, G0/2 to a second router in the building (must be a neighbour) and Lo0. After passive-interface default, which no passive-interface lines do you need? (Choose two.)", o:["no passive-interface g0/0","no passive-interface g0/1","no passive-interface g0/2","no passive-interface loopback 0"], a:[0,2], why:"1. Asked: which interfaces must still send hellos. 2. Rule: passive stops hellos but keeps advertising. 3. Apply: only interfaces needing a neighbour — G0/0 and G0/2. The scanner LAN has no routers; the loopback never has neighbours. Both stay advertised."})}
${K.check({q:"A branch's LAN interface is made passive. What changes?", o:["The LAN subnet disappears from other routers' tables","No hellos go out on the LAN, so no neighbour can form there, but the subnet is still advertised","PCs on the LAN lose their gateway","The router stops forwarding to the LAN"], a:1, why:"Passive only suppresses hellos (and so adjacencies) on that interface; the subnet stays in the LSA and forwarding is unaffected."})}

<h2>Sharing the internet: <code>default-information originate</code></h2>
<p>R-HQ has a static default to the ISP (lesson 2); the branches don't. Static defaults on every branch would bring back the 40-statics problem. Let OSPF carry it:</p>
${K.out(`R-HQ(config)#ip route 0.0.0.0 0.0.0.0 192.0.2.1
R-HQ(config)#router ospf 1
R-HQ(config-router)#default-information originate`, "If this router has a default route, advertise 0.0.0.0/0 into OSPF with this router as the way out.")}
<p><b>The decision rule:</b> <code>default-information originate</code> means &ldquo;if <i>I</i> have a default route in my table — static or any other source — advertise <code>0.0.0.0/0</code> to everyone in OSPF, pointing at me.&rdquo; No default in the table → nothing advertised. Add <code>always</code> and it advertises regardless.</p>
<p>Why conditional? If the ISP link dies, the static is withdrawn (lesson 2), R-HQ stops advertising, and routers stop sending internet traffic to an edge with no way out — or move to a second edge. <code>always</code> keeps advertising while the internet is gone, black-holing traffic at the edge; use it only when something beyond the router guarantees the path.</p>
${K.out(`R-BR1#show ip route | include Gateway|0.0.0.0/0|10.1.30.0
Gateway of last resort is 10.1.0.1 to network 0.0.0.0
O*E2  0.0.0.0/0 [110/1] via 10.1.0.1, 00:12:12, GigabitEthernet0/1
O        10.1.30.0/24 [110/3] via 10.1.0.1, 00:14:17, GigabitEthernet0/1`, "Branch 1 now has an OSPF-learned default and a gateway of last resort. Compare the default's metric with branch 2's LAN.")}
<ul>
<li><code>O</code> OSPF; <code>*</code> candidate default.</li>
<li><code>E2</code> — ${K.g("external type 2","An OSPF route injected from outside OSPF (here a static default). Its metric stays at the value the injecting router set; it doesn't grow with distance.")}: it came from <i>outside</i> OSPF, R-HQ's static. That makes R-HQ an ${K.g("ASBR","Autonomous System Boundary Router: an OSPF router that injects routes from outside OSPF.")} — hence <code>It is an autonomous system boundary router</code> in its <code>show ip protocols</code>.</li>
<li><code>[110/1]</code> — AD 110, metric 1. An E2 metric stays at the ASBR's value (1 by default) on every router, however far; internal routes such as <code>10.1.30.0/24 [110/3]</code> grow with each link. (E1, which adds internal cost, is rare at CCNA level.)</li>
<li><code>Gateway of last resort is 10.1.0.1</code> — anything matching nothing more specific goes to R-HQ.</li>
</ul>
${K.svg("0 0 740 250",
  K.dev("cloud",70,70,"ISP","192.0.2.1")+
  K.dev("router",270,70,"R-HQ","ASBR")+
  K.dev("router",520,40,"R-BR1","")+
  K.dev("router",520,190,"R-BR2","")+
  K.link(94,70,246,70,"G0/3")+K.link(294,66,496,44,"10.1.0.0/30")+K.link(294,78,496,184,"")+K.txt(468,198,"10.1.0.4/30",{end:true,s:10})+
  K.band(160,128,220,24,"S* 0.0.0.0/0 [1/0] via 192.0.2.1")+
  K.band(560,80,175,24,"O*E2 0.0.0.0/0 [110/1]","var(--chip)")+
  K.band(560,225,175,24,"O*E2 0.0.0.0/0 [110/1]","var(--chip)")+
  K.txt(270,174,"default-information originate",{c:"accent",s:11,mid:true,b:true})+
  K.arrow(330,150,480,100,"0.0.0.0/0 in OSPF",true),
  "R-HQ has a static default and default-information originate, so it floods 0.0.0.0/0 into OSPF as an external route. Every other router installs O*E2 with metric 1, pointing towards R-HQ.")}
<p>And <b>don't run OSPF towards the ISP</b>: the provider won't form an adjacency (they use statics or ${K.g("BGP","Border Gateway Protocol: the routing protocol between ISPs and large networks on the internet. Beyond CCNA.")}), and hellos out of the internet link announce your network. That's why R-HQ's statements never matched G0/3.</p>
<h3>Hands-on: the Ikeja branch edge goes live</h3>
<p>The ticket: <i>&ldquo;Since this morning's ISP cut-over, Ikeja staff can reach the file server but not the internet. The security audit also flagged OSPF hellos on the staff LAN — please fix both.&rdquo;</i> IKJ-EDGE has the ISP on G0/0 and a front-office LAN on G0/2; IKJ-CORE has the staff (G0/0) and server (G0/2) LANs; OSPF already runs between them. The ISP router is the provider's — hands off. Its end of the link is <code>198.51.100.1</code>; <code>203.0.113.10</code> is a test address beyond it.</p>
${K.bench({id:"m5-ospf-edge", points:110, from:"CCNA · Module 5 · lesson 4", title:"edge router: originate the default, silence the LANs", viewBox:"0 0 900 480", openLog:true,
  intro:"Console in from the laptop (9600 8N1, no flow control) and move the cable between IKJ-EDGE and IKJ-CORE as needed. STAFF is 10.40.10.21, SRV 10.40.20.5, FRONT 10.40.1.30.",
  devices:[
    {id:"isp", kind:"router", label:"ISP", host:"ISP-PE", model:"provider router · hands off", x:30, y:20, config:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","ip address 198.51.100.1 255.255.255.252","no shutdown","interface loopback 0","ip address 203.0.113.10 255.255.255.255","exit","ip route 10.40.0.0 255.255.0.0 198.51.100.2","end"].forEach(c=>e.exec(c)); }},
    {id:"edge", kind:"router", label:"IKJ-EDGE", host:"IKJ-EDGE", model:"ISR 1100 · branch edge", x:340, y:20, config:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description ISP","ip address 198.51.100.2 255.255.255.252","no shutdown","interface g0/1","description TO-IKJ-CORE","ip address 10.40.0.1 255.255.255.252","no shutdown","interface g0/2","description FRONT-OFFICE-LAN","ip address 10.40.1.1 255.255.255.0","no shutdown","interface loopback 0","ip address 10.40.255.1 255.255.255.255","router ospf 1","router-id 10.40.255.1","network 10.40.0.0 0.0.255.255 area 0","end"].forEach(c=>e.exec(c)); }},
    {id:"core", kind:"router", label:"IKJ-CORE", host:"IKJ-CORE", model:"ISR 1100 · branch core", x:340, y:230, config:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description STAFF-LAN","ip address 10.40.10.1 255.255.255.0","no shutdown","interface g0/1","description TO-IKJ-EDGE","ip address 10.40.0.2 255.255.255.252","no shutdown","interface g0/2","description SERVER-LAN","ip address 10.40.20.1 255.255.255.0","no shutdown","interface loopback 0","ip address 10.40.255.2 255.255.255.255","router ospf 1","router-id 10.40.255.2","network 10.40.0.0 0.0.255.255 area 0","end"].forEach(c=>e.exec(c)); }},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:700, y:230},
    {id:"pc2", kind:"pc", label:"FRONT", x:690, y:20, ip:"10.40.1.30", mask:"255.255.255.0", gw:"10.40.1.1"},
    {id:"pc1", kind:"pc", label:"STAFF", x:200, y:375, ip:"10.40.10.21", mask:"255.255.255.0", gw:"10.40.10.1"},
    {id:"srv", kind:"server", label:"SRV", x:540, y:375, ip:"10.40.20.5", mask:"255.255.255.0", gw:"10.40.20.1"},
  ],
  cables:[ {type:"cat6", a:"isp:g0", b:"edge:g0"}, {type:"cat6", a:"edge:g1", b:"core:g1"}, {type:"cat6", a:"edge:g2", b:"pc2:eth"},
           {type:"cat6", a:"core:g0", b:"pc1:eth"}, {type:"cat6", a:"core:g2", b:"srv:eth"} ],
  tray:["console"],
  tasks:[
    {text:"Reproduce the complaint: on IKJ-CORE, <code>show ip route</code> has no gateway of last resort, and from STAFF <code>ping 203.0.113.10</code> fails", done:B=>B.devs.core.env.log.some(l=>/Gateway of last resort is not set/.test(l.out||"")) && Bench.tried(B,"pc1",/^\s*ping\s+203\.0\.113\.10\s*$/i)},
    {text:"On IKJ-EDGE, add <code>default-information originate</code> under <code>router ospf 1</code> — then <code>show ip route</code> on IKJ-EDGE. Still no default anywhere: why? (Read the rule above — what must the edge have first?)", done:B=>{ const L = B.devs.edge.env.log; const i = L.findIndex(l=>/^default-information originate/i.test((l.cmd||"").trim())); return i>-1 && L.slice(i+1).some(l=>/^(do )?sh(ow)? ip route\s*$/i.test((l.cmd||"").trim()) && /Gateway of last resort is not set/.test(l.out||"")); }},
    {text:"Give IKJ-EDGE its default route to the ISP: <code>ip route 0.0.0.0 0.0.0.0 198.51.100.1</code> (a static default, lesson 2)", done:B=>{ const r = Bench.route(B,"edge","0.0.0.0/0"); return !!(r && r.ad===1); }},
    {text:"Back on IKJ-CORE: <code>show ip route</code> now shows <code>O*E2 0.0.0.0/0 [110/1]</code> and a gateway of last resort", done:B=>!!Bench.route(B,"core","0.0.0.0/0","O") && B.devs.core.env.log.some(l=>/O\*E2\s+0\.0\.0\.0\/0 \[110\/1\]/.test(l.out||""))},
    {text:"From STAFF, <code>ping 203.0.113.10</code> and <code>tracert 203.0.113.10</code> — the path goes CORE → EDGE → internet", done:B=>Bench.pinged(B,"pc1","203.0.113.10") && Bench.traced(B,"pc1","203.0.113.10")},
    {text:"The audit: on IKJ-CORE (two LANs, one router link), make every interface passive by default and re-activate only the link to IKJ-EDGE. Watch the log: the neighbour drops (<code>FULL to DOWN</code>) as soon as hellos stop; after the exception, <code>show ip ospf neighbor</code> shows it FULL again", done:B=>{ const o = B.devs.core.env.ospf; return !!(o && o.passiveDefault && (o.noPassive||[]).includes("GigabitEthernet0/1") && Bench.ospfNbr(B,"core","10.40.255.1") && Bench.logged(B,"core",/Nbr 10\.40\.255\.1 on GigabitEthernet0\/1 from FULL to DOWN/)); }},
    {text:"On IKJ-EDGE, make only the front-office LAN (G0/2) passive, then <code>show ip ospf interface brief</code>: G0/0, the ISP link, isn't listed at all — the <code>10.40.0.0 0.0.255.255</code> statement never matched <code>198.51.100.2</code>", done:B=>{ const o = B.devs.edge.env.ospf; const pas = o && (o.passiveDefault ? !(o.noPassive||[]).includes("GigabitEthernet0/2") : (o.passive||[]).includes("GigabitEthernet0/2")); return !!(pas && Bench.ospfNbr(B,"edge","10.40.255.2") && B.devs.edge.env.log.some(l=>/Interface\s+PID\s+Area/.test(l.out||"") && /Gi0\/1\s/.test(l.out||"") && !/Gi0\/0\s/.test(l.out||""))); }},
    {text:"Prove passive LANs are still advertised: <code>show ip route ospf</code> on IKJ-EDGE still lists both IKJ-CORE LANs, and FRONT can <code>ping 10.40.20.5</code> (the server)", done:B=>!!(Bench.route(B,"edge","10.40.10.0/24","O") && Bench.route(B,"edge","10.40.20.0/24","O") && Bench.pinged(B,"pc2","10.40.20.5") && B.devs.core.env.ospf.passiveDefault)},
    {text:"Save both routers", done:B=>B.devs.edge.env.savedOnce && B.devs.core.env.savedOnce},
  ],
  win:"Ticket closed on both counts. You saw default-information originate do nothing until the edge itself had a default, then watched O*E2 0.0.0.0/0 [110/1] appear on the core and the internet start working. You silenced OSPF on every LAN without losing a single route, saw for yourself that a passive router link kills the adjacency, and confirmed the ISP link was never in OSPF.",
  solve:[["plug","console","lap:usb","core:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],
    ["pc","pc1","ping 203.0.113.10"],
    ["unplug","lap:usb"],["plug","console","lap:usb","edge:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","router ospf 1"],["term","default-information originate"],["term","end"],["term","show ip route"],
    ["term","configure terminal"],["term","ip route 0.0.0.0 0.0.0.0 198.51.100.1"],["term","end"],["term","show ip route"],
    ["unplug","lap:usb"],["plug","console","lap:usb","core:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],
    ["pc","pc1","ping 203.0.113.10"],["pc","pc1","tracert 203.0.113.10"],
    ["term","configure terminal"],["term","router ospf 1"],["term","passive-interface default"],["term","do show ip ospf neighbor"],["term","no passive-interface g0/1"],["term","end"],["term","show ip ospf neighbor"],["term","show ip protocols"],["term","copy running-config startup-config"],["term",""],
    ["unplug","lap:usb"],["plug","console","lap:usb","edge:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","router ospf 1"],["term","passive-interface g0/2"],["term","end"],["term","show ip ospf interface brief"],["term","show ip route ospf"],["term","copy running-config startup-config"],["term",""],
    ["pc","pc2","ping 10.40.20.5"]]})}
${K.hint(`No <code>O*E2</code> on IKJ-CORE? IKJ-EDGE's <code>show ip route</code> must show <code>S* 0.0.0.0/0</code> first. Neighbour gone for good after <code>passive-interface default</code>? Re-activate the router link: <code>no passive-interface g0/1</code>.`)}
<p>Remember task 2: <code>default-information originate</code> did nothing until the edge had a default of its own. Then <code>O*E2</code> appeared on the core at once.</p>
${K.hint(`Two questions: what happens to a static route whose exit interface goes down (lesson 2), and what must the edge have before originate advertises anything?`)}
${K.reveal("Same logic, new situation: the ISP cable is cut", `<p>R-EDGE has <code>ip route 0.0.0.0 0.0.0.0 g0/0 203.0.113.1</code> and <code>default-information originate</code>. The ISP cable is cut; G0/0 goes down. What do the other routers have for 0.0.0.0/0 — and what if it had been <code>default-information originate always</code>?</p>
<ol><li><b>Asked:</b> does the O*E2 default survive, in two configs?</li><li><b>Rules:</b> a static with an exit interface is withdrawn when the interface goes down (lesson 2); originate advertises only while the router has a default; <code>always</code> advertises regardless.</li>
<li><b>Apply:</b> G0/0 down → static gone → no originate → O*E2 disappears everywhere (another edge's default takes over, if any). With <code>always</code>, O*E2 stays and R-EDGE drops the traffic — a black hole that looks fine in every routing table.</li></ol>`)}
${K.check({q:"R-EDGE has default-information originate, but no router has an O*E2 route, and R-EDGE's show ip route says 'Gateway of last resort is not set'. Most likely cause?", o:["The branches also need default-information originate","R-EDGE has no default of its own, so there is nothing to originate","OSPF can't carry defaults in a single area","The process IDs don't match"], a:1, why:"Without always, originate advertises a default only while the router has one. 'Gateway of last resort is not set' says it doesn't — fix its static default."})}

${K.myth([
  ["The network command advertises the network you type.","It selects interfaces; OSPF advertises their real subnets."],
  ["Process IDs must match on neighbours.","They're local and never sent. The area must match."],
  ["A new router-id takes effect immediately.","A running process keeps its ID until reload or clear ip ospf process."],
  ["A passive interface's subnet is hidden.","Passive stops hellos only; the subnet is still advertised."],
  ["default-information originate always advertises a default.","Only while the router has one — unless you add always, which risks a black hole."],
])}
${K.dodont([
  "Plan router IDs from loopbacks and set <code>router-id</code> before neighbours form.",
  "Use exact statements or the interface method.",
  "Use <code>passive-interface default</code> on branch and access routers.",
  "Verify inside out, ending with ping and traceroute.",
],[
  "Don't use <code>network 0.0.0.0 255.255.255.255 area 0</code> on a router with an internet link.",
  "Don't put a subnet mask where the wildcard goes.",
  "Don't <code>clear ip ospf process</code> on production outside a change window.",
  "Don't use <code>originate always</code> unless the internet path is guaranteed beyond the router.",
])}

${K.job("“Abuja branch has no internet since last night's router swap”",`
<p><b>The ticket.</b> &ldquo;Since this morning nobody at the Abuja branch can open a website. The shared drive at HQ works. IT replaced the edge router last night.&rdquo; — Mrs Bello, branch admin, 08:05. Priority 2.</p>
<p><b>Questions.</b> &ldquo;Does <i>anything</i> outside work?&rdquo; — <i>&ldquo;No.&rdquo;</i> Internal routing works, only the way out is broken. The swap is the suspect: an ${K.g("RMA","Return Merchandise Authorisation: the vendor's replacement process. The new unit arrives blank and is configured from a template.")} unit is configured from a template.</p>
<p><b>Checks, inside out.</b></p>
${K.out(`ABJ-DIST#show ip route | include Gateway|203.0.113
Gateway of last resort is not set
      203.0.113.0/30 is subnetted, 1 subnets
O        203.0.113.244 [110/2] via 10.60.0.1, 00:26:45, GigabitEthernet0/1

ABJ-EDGE#show ip route static | include 0.0.0.0/0
S*    0.0.0.0/0 [1/0] via 203.0.113.245

ABJ-EDGE#show ip protocols | include Router ID|area 0
  Router ID 10.60.255.1
    0.0.0.0 255.255.255.255 area 0

ABJ-EDGE#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0               203.0.113.246/30   1     DR    0/0
Gi0/1        1     0               10.60.0.1/30       1     BDR   1/1
Lo0          1     0               10.60.255.1/32     1     LOOP  0/0`, "The branch has no default but has learned the ISP link's /30. The edge has its S* default, no ASBR line, and a catch-all statement that put Gi0/0 (the ISP) into OSPF.")}
<p>The template had <code>network 0.0.0.0 255.255.255.255 area 0</code> and no <code>default-information originate</code>. The default exists but OSPF was never told to share it — and the edge has sent hellos to the ISP all night.</p>
<p><b>Fix</b> (emergency change, on the console):</p>
${K.out(`ABJ-EDGE(config)#router ospf 1
ABJ-EDGE(config-router)#network 10.60.0.0 0.0.0.3 area 0
ABJ-EDGE(config-router)#network 10.60.255.1 0.0.0.0 area 0
ABJ-EDGE(config-router)#no network 0.0.0.0 255.255.255.255 area 0
ABJ-EDGE(config-router)#default-information originate
ABJ-EDGE(config-router)#end
ABJ-EDGE#copy running-config startup-config`, "Exact statements first, then remove the catch-all, so the link to ABJ-DIST never loses OSPF.")}
<p><b>Verify.</b> The edge's interface brief lists only Gi0/1 and Lo0; <code>show ip protocols</code> says <code>It is an autonomous system boundary router</code>. On ABJ-DIST the neighbour is FULL, <code>O*E2 0.0.0.0/0 [110/1] via 10.60.0.1</code> is in, the ISP /30 is gone, and a branch PC's <code>tracert</code> exits via <code>10.60.0.1</code>.</p>
<p><b>What you say.</b> &ldquo;The replacement router was missing the setting that shares the internet route with the branch network. It's added and the internet is back — please try a website. I also removed a setting that pointed internal routing traffic at the provider.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Abuja no internet after edge RMA. Template lacked default-information originate and used network 0.0.0.0 255.255.255.255 area 0 (OSPF on ISP Gi0/0). Replaced with exact statements, added originate, saved. Verified O*E2 on ABJ-DIST and tracert via edge. Template change raised. 35 min.&rdquo;</i></p>`)}

${K.case("A bank moves 14 branches from statics to OSPF",`
<p>An Abuja bank ran head office and 14 branches on about 400 static routes. The MSP's OSPF design: area 0; <b>Lo0 = 10.255.0.&lt;site&gt;</b> with matching <code>router-id</code>; the <b>interface method</b> in the branch template; <b><code>passive-interface default</code></b> with a WAN exception; and two head-office edges originating the default — the backup with <code>metric 20</code>, so branches prefer the primary's E2 metric of 1 until it withdraws.</p>
<p><b>The pilot went wrong.</b> One branch went live before the passive template was finished. A vendor engineer testing a cash-handling system plugged a small router with an old lab config into the branch LAN — still holding a default route and <code>default-information originate</code>. It became a neighbour over the LAN and its default arrived as a second <code>O*E2</code>, metric 1. With equal E2 metrics a router prefers the one it reaches more cheaply — the box one hop away — so the branch's internet traffic vanished into it. <code>show ip route</code> looked normal: there <i>was</i> a default, to the wrong place. <code>show ip ospf neighbor</code> gave it away: a neighbour on Gi0/0, the user LAN.</p>
<p><b>The result.</b> With passive-by-default, nothing on a user LAN can become a neighbour. The bank ended with about 30 statics, and the 15th branch was one template plus two lines at head office. Lessons: <b>plan router IDs first</b>, <b>passive by default wherever users plug in</b>, <b>originate defaults only where the internet is</b>, and when the table looks fine but traffic vanishes, <b>read the neighbour table</b>.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Plan (router ID, interfaces) → configure → passive → default if it's the edge → verify inside out. Name commands.`)}
${K.reveal("“Walk me through configuring OSPF on a new branch router.”",`<p>"I take the router ID from the plan — say Lo0 10.255.0.15/32 — and set <code>router-id</code> first under <code>router ospf 1</code>, before any neighbour forms. I enable OSPF on exactly the WAN link, LANs and loopback, with <code>ip ospf 1 area 0</code> or exact statements like <code>0.0.0.3</code> for a /30, then <code>passive-interface default</code> with <code>no passive-interface</code> on the WAN link. I verify inside out: protocols, interface brief, neighbours FULL, <code>show ip route ospf</code> for head-office routes and the O*E2 default, then ping and traceroute from a branch PC."</p>`)}
${K.hint(`What it stops (hellos, adjacencies), what it doesn't (advertising), and why (rogue neighbours injecting routes).`)}
${K.reveal("“What does passive-interface do, and why use it?”",`<p>"It stops OSPF hellos on an interface, so no neighbour can form there, but the subnet is still advertised. I use it on everything facing users or servers: otherwise anyone who plugs in something that speaks OSPF can become a neighbour and inject a more specific route or a default. On branch routers I use <code>passive-interface default</code> plus <code>no passive-interface</code> on the uplinks. The classic slip is making the uplink passive — the adjacency drops at once on that router, and on the far end when its dead timer expires."</p>`)}
${K.hint(`The three-step order, "chosen once at start-up", then why loopbacks.`)}
${K.reveal("“How does a router choose its OSPF router ID, and why loopbacks?”",`<p>"The <code>router-id</code> command if set; otherwise the highest IP on an up loopback; otherwise the highest IP on an up physical interface. It's chosen when the process starts; change <code>router-id</code> later and IOS says to reload or <code>clear ip ospf process</code>. Loopbacks never go down, a plan like 10.255.0.&lt;site&gt; makes neighbour tables readable, and the advertised /32 is reachable over any path. I set <code>router-id</code> to the loopback address too."</p>`)}

${K.recap([
  "router ospf &lt;id&gt;: the process ID is local and needn't match; the area ID must match on both ends of a link.",
  "An OSPF interface talks (hellos, neighbours) and is advertised (its real subnet).",
  "network &lt;address&gt; &lt;wildcard&gt; area &lt;id&gt; picks interfaces by address; wildcard = 255.255.255.255 − mask, 0 must match; the most specific statement wins.",
  "ip ospf 1 area 0 enables exactly that interface and beats network statements. Verify inside out: protocols → interfaces → neighbours → routes → ping.",
  "Router ID: router-id, else highest up loopback, else highest up physical — chosen once; changing it needs clear ip ospf process. Loopbacks are advertised as /32.",
  "passive-interface stops hellos but keeps advertising; passive-interface default + no passive-interface on router links is the safe branch pattern.",
  "default-information originate advertises 0.0.0.0/0 only if the router has a default (unless always); others see O*E2 0.0.0.0/0 [110/1].",
])}
${K.next(`<b>Lesson 5 — OSPF on shared segments.</b> You've been reading <code>FULL/DR</code> and <code>FULL/BDR</code> without asking why. Next: network types, how the designated router (DR) and backup designated router (BDR) are elected, why a sitting DR keeps the job until the process restarts, and when a point-to-point link avoids the election altogether.`)}
`,
quiz:[
  {lvl:1, q:"What does the 1 in the command router ospf 1 identify?", o:["The OSPF area the router belongs to","A process ID that is meaningful only inside this router and does not have to match neighbours","The router ID","The priority used in the DR election"], a:1, why:"router ospf 1 starts OSPF process 1. The process ID (1–65535) is a local label that is never sent in hellos. Areas are set per interface or per network statement."},
  {lvl:1, type:"fill", q:"What wildcard mask does a network statement need to match exactly one /26 subnet?", fields:[{label:"Wildcard", a:["0.0.0.63"]}], why:"A /26 mask is 255.255.255.192. 255 − 192 = 63, so the wildcard is 0.0.0.63."},
  {lvl:2, type:"multi", q:"A router has interfaces 192.168.15.1/24, 192.168.17.1/24, 192.168.19.254/24, 192.168.20.1/24 and 192.168.160.1/24. Which two are put into OSPF by network 192.168.16.0 0.0.3.255 area 0? (Choose two.)", o:["192.168.15.1","192.168.17.1","192.168.19.254","192.168.20.1","192.168.160.1"], a:[1,2], why:"0.0.3.255 lets the lowest two bits of the third octet vary, so the statement covers 192.168.16.0–192.168.19.255. Only .17.1 and .19.254 are in that range; 15 and 20 are outside it, and 160 differs in bits that must match."},
  {lvl:2, q:"Based on the exhibit, in which area does GigabitEthernet0/0 (10.3.7.1/24) run OSPF?", ex:"Change record: lines typed on R9, in this order\nrouter ospf 1\n network 10.0.0.0 0.255.255.255 area 0\n network 10.3.7.0 0.0.0.255 area 2\n network 10.3.0.0 0.0.255.255 area 0", o:["Area 0, because the first statement typed wins","Area 2, because the most specific matching statement wins","Area 0, because two of the three statements say area 0","It doesn't run OSPF, because the statements conflict"], a:1, why:"All three statements match 10.3.7.1, but IOS uses the most specific one — the wildcard with the most 0 bits, 0.0.0.255 — regardless of order or how many others disagree. So Gi0/0 runs OSPF in area 2. (show running-config would list them most specific first: 10.3.7.0, then 10.3.0.0, then 10.0.0.0.)"},
  {lvl:1, type:"order", q:"Put the OSPF router ID selection order in sequence, from first choice to last.", items:["The router-id command under router ospf","The highest IP address on an up loopback interface","The highest IP address on an up physical interface"], why:"An explicit router-id always wins. Without one, loopbacks are preferred because they never go down; only if there is no up loopback does IOS use the highest physical interface address."},
  {lvl:2, q:"An engineer types router-id 10.255.0.4 under router ospf 1 on a router that has been running OSPF for a month. IOS prints a message, and show ip protocols still shows Router ID 192.168.4.1. What should the engineer do?", o:["Nothing — the new ID takes effect at the next hello","Remove and re-add the network statements","Run clear ip ospf process (or reload), ideally in a change window, then check show ip protocols","Configure the same router-id on every neighbour"], a:2, why:"The message is Reload or use clear ip ospf process command, for this to take effect. The process keeps its old ID until it restarts. Restarting drops this router's adjacencies briefly, so do it in a change window."},
  {lvl:1, type:"match", q:"Match each command with what it does.", pairs:[["passive-interface default","Makes every interface passive"],["no passive-interface g0/1","Lets G0/1 send hellos and form neighbours again"],["default-information originate","Advertises this router's default route into OSPF"],["ip ospf 1 area 0","Enables OSPF on the interface you are configuring"],["router-id 10.255.0.9","Sets the router ID (used after the process restarts)"]], why:"These are the five lines that turn a basic OSPF config into a production one: passive by default with exceptions, the default route, explicit interfaces and a planned router ID."},
  {lvl:2, q:"A branch router's LAN interface G0/0 (10.70.10.1/24) is made passive. What is the effect on the head-office router?", o:["It loses its route to 10.70.10.0/24","It keeps its route to 10.70.10.0/24, because passive stops hellos on G0/0 but the subnet is still advertised","It now learns 10.70.10.0/24 as an external route","Its adjacency with the branch router drops"], a:1, why:"passive-interface suppresses hellos on that interface only, so no neighbour can form on the LAN. The branch router still includes 10.70.10.0/24 in its LSA, and its adjacency over the WAN link is unaffected."},
  {lvl:2, q:"Based on the exhibit, which statement is true?", ex:"R-BR4#show ip route | include 0.0.0.0\nGateway of last resort is 10.2.0.1 to network 0.0.0.0\nO*E2  0.0.0.0/0 [110/1] via 10.2.0.1, 00:41:12, GigabitEthernet0/1", o:["R-BR4 has a static default route configured","R-BR4 learned a default route through OSPF; another router injected it from outside OSPF, typically with default-information originate","The default route is an internal OSPF route with cost 1 to the internet","The * means the route is unusable"], a:1, why:"O = OSPF, E2 = external type 2 (injected into OSPF by an ASBR, usually from a static default via default-information originate), * = candidate default. [110/1] is AD 110 and the E2 metric, 1 by default, which doesn't grow with distance."},
  {lvl:3, q:"After a change last night, a branch router has no OSPF neighbours and has lost every head-office route. Based on the exhibit, what is the cause?", ex:"BR-12#show running-config | section router ospf\nrouter ospf 1\n router-id 10.255.0.12\n passive-interface default\n network 10.12.0.0 0.0.255.255 area 0\n\nBR-12#show ip ospf interface brief\nInterface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C\nGi0/0        1     0               10.12.10.1/24      1     DR    0/0\nGi0/1        1     0               10.12.0.2/30       1     DR    0/0\nLo0          1     0               10.12.255.1/32     1     LOOP  0/0", o:["The network statement doesn't match the WAN link","The router ID clashes with head office","passive-interface default made the WAN link Gi0/1 passive too, so no hellos go to head office; add no passive-interface g0/1","The LAN interface should not be in area 0"], a:2, why:"Gi0/1 is listed, in area 0, so the statement matches. But with passive-interface default and no exception, every interface — including the WAN link — sends no hellos: BR-12 dropped the adjacency at once and head office when its dead timer expired. no passive-interface g0/1 brings it back."},
  {lvl:3, type:"multi", q:"The internet edge router EDGE1 has default-information originate configured, but none of the branch routers has an O*E2 route. Which two are possible causes? (Choose two.)", o:["EDGE1 has no default route in its own routing table (its static is missing or was withdrawn)","EDGE1 has no FULL OSPF adjacency, so its LSAs never reach the other routers","The branch routers also need default-information originate","The branch routers use a different OSPF process ID","OSPF can only carry a default route between different areas"], a:[0,1], why:"Without always, EDGE1 originates the default only while it has one itself. And nothing EDGE1 originates reaches anyone without an adjacency. Branches don't need the command; process IDs are local; single-area OSPF carries O*E2 defaults fine."},
  {lvl:2, type:"fill", q:"Which router configuration command makes an edge router advertise a default route into OSPF even when it has no default route of its own?", fields:[{label:"Command", a:["default-information originate always"], ios:true}], why:"The always keyword removes the condition. Use it with care: if the internet path fails, other routers keep sending traffic to this router, which can't forward it."},
  {lvl:3, q:"A router uses network 10.0.0.0 0.255.255.255 area 0. Facilities add a guest Wi-Fi VLAN on a new subinterface, 10.99.0.1/24, on the same router. What happens, and what is the best fix?", o:["Nothing — guest subnets are never advertised","OSPF automatically starts on the guest interface (hellos to guests and the guest subnet advertised); make it passive at least, or better, replace the catch-all with exact statements or the interface method so the guest network isn't in OSPF unless intended","The router rejects the new address because it overlaps the network statement","Guest clients get OSPF routes and lose internet access"], a:1, why:"The catch-all matches any 10.x interface, so the guest interface joins OSPF the moment it gets an address. Passive stops hellos to guests; whether the guest subnet should be routed internally at all is a design decision — which is exactly why exact statements or the interface method are safer."},
  {lvl:2, q:"A router's Loopback0 is configured as 10.5.5.1 255.255.255.0 and is advertised into OSPF with default settings. How do the other routers see it?", o:["As 10.5.5.0/24","As 10.5.5.1/32, because OSPF advertises a loopback as a single host route","As an external E2 route","They don't — loopbacks are never advertised"], a:1, why:"OSPF's loopback network type treats the interface as a stub host and advertises it as a /32, whatever mask is configured. ip ospf network point-to-point on the loopback would advertise the /24."},
  {lvl:3, q:"Based on the exhibit, R6 should be neighbours with R5 (on Gi0/1) and R7 (on Gi0/2), but only R5 appears in show ip ospf neighbor. What is the fix?", ex:"R6#show ip interface brief | include up\nGigabitEthernet0/0     10.6.10.1       YES manual up                    up\nGigabitEthernet0/1     10.6.0.1        YES manual up                    up\nGigabitEthernet0/2     10.6.0.6        YES manual up                    up\n\nR6#show ip protocols | begin Networks\n  Routing for Networks:\n    10.6.10.0 0.0.0.255 area 0\n    10.6.0.0 0.0.0.3 area 0\n  Routing Information Sources:", o:["Change the process ID to match R7","Add network 10.6.0.4 0.0.0.3 area 0, because 10.6.0.6 is outside 10.6.0.0–10.6.0.3 so Gi0/2 isn't running OSPF","Make Gi0/2 passive","Run clear ip ospf process on R7"], a:1, why:"10.6.0.0 0.0.0.3 covers .0–.3 only; Gi0/2's 10.6.0.6 is in the next /30 block (.4–.7), so no statement claims it and R6 sends no hellos there. Adding a statement for 10.6.0.4/30 (or ip ospf 1 area 0 on Gi0/2) fixes it. Passive would make it worse."},
  {lvl:1, type:"fill", q:"Which interface configuration command enables OSPF process 1 in area 0 on the interface you are configuring?", fields:[{label:"Command", a:["ip ospf 1 area 0","ip ospf 1 area 0.0.0.0"], ios:true}], why:"ip ospf <process-id> area <area-id> is the interface method. It claims exactly this interface and takes precedence over any network statement that also matches it."},
],
cards:[
  {f:"OSPF process ID", b:"The number in router ospf N (1–65535). Local to the router, never sent in hellos, doesn't have to match neighbours. Area IDs must match."},
  {f:"What enabling OSPF on an interface does", b:"Two things: it sends hellos (to 224.0.0.5) and forms neighbours on it, and it advertises the interface's real subnet in the router's LSA."},
  {f:"What the network command really does", b:"It's a filter on interface IP addresses: any interface that matches the address + wildcard runs OSPF in that area. It does not advertise the address you typed."},
  {f:"Wildcard mask rules", b:"0 bit = must match, 1 bit = don't care. For a subnet: 255.255.255.255 minus the mask. /32 → 0.0.0.0, /30 → 0.0.0.3, /24 → 0.0.0.255, /8 → 0.255.255.255."},
  {f:"Two network statements match one interface", b:"The most specific one wins (the wildcard with the most 0 bits), whatever order they were typed in."},
  {f:"Interface method", b:"ip ospf 1 area 0 under the interface. Enables OSPF on exactly that interface, beats network statements; shows as Attached via Interface Enable in show ip ospf interface."},
  {f:"Router ID selection order", b:"1. router-id command. 2. Highest IP on an up loopback. 3. Highest IP on an up physical interface. Chosen once when the process starts."},
  {f:"Reload or use clear ip ospf process", b:"IOS's reply when you set a router-id on a running process. The new ID is saved but not used until clear ip ospf process (which drops this router's adjacencies briefly) or a reload."},
  {f:"Why loopbacks for router IDs", b:"Always up (no cable), predictable from a numbering plan, readable in neighbour tables, and reachable as a /32 over any working path."},
  {f:"How OSPF advertises a loopback", b:"As a /32 host route, whatever mask is configured (network type LOOPBACK, treated as a stub host)."},
  {f:"passive-interface", b:"Stops OSPF hellos on an interface, so no neighbour can form there — but its subnet is still advertised. Use on user and server LANs."},
  {f:"passive-interface default", b:"Makes every interface passive; then no passive-interface <if> on each router-to-router link. Safe pattern for branch routers. Forgetting the exception kills the adjacency."},
  {f:"default-information originate", b:"Advertises 0.0.0.0/0 into OSPF only if this router has a default route of its own (add always to advertise regardless — risky). The router becomes an ASBR."},
  {f:"O*E2 0.0.0.0/0 [110/1]", b:"A default route learned through OSPF: O = OSPF, * = candidate default, E2 = external type 2 (injected from outside OSPF, metric stays 1), AD 110."},
],
});
// ---------- Module 5 · Lesson 5 ----------
L.push({
id:"ospf-dr", mins:90, level:"Intermediate · builds on Module 5 lessons 3–4",
t:"OSPF on shared segments: network types, the DR/BDR election, priorities and point-to-point links",
html:`
${K.goals([
  "Explain why OSPF elects a DR on a shared segment, using the n(n−1)/2 adjacency count and 224.0.0.5 / 224.0.0.6 flooding.",
  "Predict the DR and BDR from priorities, router IDs and start-up order — and say why a newcomer never takes over.",
  "Read <code>show ip ospf neighbor</code> and <code>show ip ospf interface</code> and tell a normal <code>2WAY/DROTHER</code> from a fault.",
  "Move the DR on purpose with <code>ip ospf priority</code> and the right <code>clear ip ospf process</code> sequence.",
  "Decide when a router-to-router Ethernet link should be point-to-point, configure both ends and verify <code>FULL/  -</code>.",
])}
${K.pre(["Module 5 lessons 3 and 4: link state, router IDs, hellos, neighbour states, link-state advertisements (LSAs); configuring single-area OSPF, <code>router-id</code>, passive interfaces.","Module 4: VLANs — a &ldquo;shared segment&rdquo; here is one VLAN that several routers plug into."])}

<h2>Why this matters at work</h2>
<p>An Abuja bank's head office has five routers on one server VLAN. After weekend generator works they came back one at a time as power returned, and Monday's monitoring report shows the VPN router — a small box with one power supply, on a wall socket rather than the UPS — is now the &ldquo;designated router&rdquo; for that VLAN. Nothing is broken yet, but if that box fails every router on the segment must re-synchronise, and the change board wants to know why the network &ldquo;chose&rdquo; the weakest router.</p>
<p>The answer: OSPF elects a ${K.g("designated router (DR)","On a shared (broadcast) segment, the router every other OSPF router synchronises with, which re-floods updates for the segment. Elected by priority, then router ID.")} on every shared segment, and the winner keeps the job until it stops. This lesson teaches you to predict that election, read it, move it on purpose — and switch it off where it does nothing useful.</p>

<h2>The problem a DR solves: too many adjacencies on one VLAN</h2>
<p>In lesson 3 an ${K.g("OSPF","Open Shortest Path First: a link-state routing protocol. Each router learns the full map of its area and runs the SPF calculation on it.")} ${K.g("adjacency","A neighbour relationship that has reached FULL: the two routers have synchronised their link-state databases and keep each other updated.")} was two neighbours that have swapped their whole ${K.g("LSDB","Link-state database: the router's copy of every LSA in the area — its map of the network.")} and keep each other up to date. Every adjacency costs database exchange, retransmissions, acknowledgements, memory and CPU.</p>
<p>A link between two routers has one possible adjacency. Now put many routers on one switch, in one VLAN and subnet — a ${K.g("broadcast multi-access segment","Many routers sharing one Layer 2 domain, so one frame can reach them all — an Ethernet VLAN. OSPF calls this network type BROADCAST.")}. If every router formed an adjacency with every other one:</p>
${K.remember(`<b>Full mesh: n(n−1)/2 adjacencies</b> (each router pairs with the n−1 others, each pair counted once). <b>With a DR and a backup DR (BDR): 2n−3</b> (everyone to the DR and BDR, plus DR–BDR).`)}
<div class="tablewrap"><table>
<tr><th>Routers on the VLAN (n)</th><th>Full mesh: n(n−1)/2</th><th>With DR and BDR: 2n−3</th></tr>
<tr><td>4</td><td>6</td><td>5</td></tr>
<tr><td>6</td><td>15</td><td>9</td></tr>
<tr><td>10</td><td>45</td><td>17</td></tr>
<tr><td>20</td><td>190</td><td>37</td></tr>
</table></div>
<p>The full mesh grows with the square of the router count; the DR design grows in a straight line. Worse is the <b>flooding</b>: in a full mesh, a changed ${K.g("LSA","Link-state advertisement: one piece of the OSPF map, such as 'router X has these links at these costs'.")} goes to every neighbour, each passes it on again, and every copy needs acknowledging.</p>
${K.svg("0 0 720 310",
  K.band(20,6,320,24,"FULL MESH — 5 routers, 10 adjacencies")+
  K.link(180,65,270,131)+K.link(180,65,236,237)+K.link(180,65,124,237)+K.link(180,65,90,131)+K.link(270,131,236,237)+K.link(270,131,124,237)+K.link(270,131,90,131)+K.link(236,237,124,237)+K.link(236,237,90,131)+K.link(124,237,90,131)+
  K.dev("router",180,65,"R1","")+K.dev("router",270,131,"R2","")+K.dev("router",236,237,"R3","")+K.dev("router",124,237,"R4","")+K.dev("router",90,131,"R5","")+
  K.band(380,6,320,24,"WITH A DR AND BDR — 7 adjacencies")+
  K.link(540,65,630,131)+K.link(540,65,596,237)+K.link(540,65,484,237)+K.link(540,65,450,131)+
  K.link(630,131,596,237,"",true)+K.link(630,131,484,237,"",true)+K.link(630,131,450,131,"",true)+
  K.dev("router",540,65,"R1","DR")+K.dev("router",630,131,"R2","BDR")+K.dev("router",596,237,"R3","DROTHER")+K.dev("router",484,237,"R4","DROTHER")+K.dev("router",450,131,"R5","DROTHER")+
  K.txt(180,302,"every update crosses the VLAN many times",{c:"warn",s:11,mid:true})+
  K.txt(540,302,"solid = adjacency with the DR · dashed = with the BDR",{c:"ok",s:11,mid:true}),
  "Five routers on one VLAN. Left: everyone adjacent to everyone (10). Right: everyone adjacent only to the DR (solid) and BDR (dashed) — 7. The lines are OSPF relationships, not cables: all five plug into one switch.")}
<h3>How flooding works once there is a DR</h3>
<p>OSPF fixes both problems with two elected roles and two ${K.g("multicast","A packet sent to a group address that only interested devices listen to. OSPF uses 224.0.0.5 and 224.0.0.6.")} addresses:</p>
<ul>
<li>The <b>DR</b> is the router everyone synchronises with. It also creates the ${K.g("network LSA (Type 2)","An LSA created only by the DR of a broadcast segment, listing every router on it. Shown as 'Net Link States' in show ip ospf database.")} that describes the segment.</li>
<li>The ${K.g("BDR","Backup designated router: hears everything the DR hears and keeps a full copy, so it can take over at once.")} is the understudy: adjacent to everyone, quiet unless the DR dies. Every other router is a ${K.g("DROTHER","A router on a broadcast segment that is neither DR nor BDR ('DR other').")}.</li>
<li><code>224.0.0.5</code>, ${K.g("AllSPFRouters","Multicast group 224.0.0.5: every OSPF router listens. Hellos and the DR's re-floods go here.")}: every OSPF router listens; hellos go here. <code>224.0.0.6</code>, ${K.g("AllDRouters","Multicast group 224.0.0.6: only the DR and BDR listen. DROTHERs send their updates here.")}: only the DR and BDR listen.</li>
</ul>
${K.svg("0 0 720 300",
  K.box(40,14,140,44,"R-A","DROTHER · its link changed")+K.box(220,14,140,44,"DR","listens on .5 and .6",true)+K.box(400,14,140,44,"BDR","listens on .5 and .6")+K.box(560,14,140,44,"R-D","DROTHER · listens on .5")+
  K.link(110,58,110,280,"",true)+K.link(290,58,290,280,"",true)+K.link(470,58,470,280,"",true)+K.link(630,58,630,280,"",true)+
  K.arrow(110,100,286,100,"① update (LSU) → 224.0.0.6",true)+K.arrow(110,122,466,122,"",true)+
  K.txt(300,142,"one multicast packet: the DR and the BDR both receive it",{s:10})+
  K.arrow(290,190,626,190,"② the DR re-floods → 224.0.0.5",true)+K.arrow(290,190,114,190,"",true)+
  K.txt(470,210,"the BDR keeps its copy, stays quiet",{s:10,mid:true})+
  K.arrow(630,245,294,245,"③ acknowledgements go back")+
  K.txt(360,293,"If the DR fails, the BDR already holds everything and takes over.",{c:"fg",s:11,mid:true}),
  "One change, two packets on the VLAN, however many routers there are: R-A to 224.0.0.6, then the DR to 224.0.0.5.")}
<p>The update in the picture is a ${K.g("link-state update (LSU)","The OSPF packet that carries LSAs between routers.")}. The BDR hears every packet the DR hears, so its database stays identical and it can take over without starting again.</p>
${K.analogy(`<p>A class of 40 students elects a rep (the DR) and a deputy (the BDR). You tell the rep your news; the rep announces it once to everyone; the deputy notes it all in case the rep is absent. Everyone still greets everyone each morning (hellos), so they all know who is in the room.</p>`)}
${K.dyk(`The DR is a control-plane job only. If R3 and R4 are DROTHERs on one VLAN and SPF (shortest path first) says R4 is R3's next hop, R3 sends packets straight to R4's MAC address. The DR never sees them.`)}
${K.q({type:"fill", q:"A data-centre VLAN has 8 OSPF routers on it. How many adjacencies would a full mesh need, and how many are needed with a DR and BDR?", fields:[{label:"Full mesh", a:["28"]},{label:"With DR and BDR", a:["13"]}], why:"Same logic, new situation. 1. What is asked: two counts. 2. Rules: full mesh = n(n−1)/2; DR design = 2n−3. 3. Apply with n = 8: 8 × 7 ÷ 2 = 28. With a DR: the DR is adjacent to the other 7, the BDR to the other 6 (not counting the DR again) = 13, which is 2 × 8 − 3."})}
${K.check({q:"On a VLAN with a DR and a BDR, a DROTHER's interface goes down. Where does it send the LSU that announces the change?", o:["To 224.0.0.5, so every router hears it directly","To 224.0.0.6, which only the DR and BDR listen to; the DR then re-floods it to 224.0.0.5","Unicast to every neighbour in turn","To 255.255.255.255"], a:1, why:"DROTHERs send updates to AllDRouters (224.0.0.6); the DR re-floods to AllSPFRouters (224.0.0.5). Two packets instead of a storm."})}

<h2>The election: priority first, router ID second — and nobody takes over</h2>
<p>Every OSPF interface on a broadcast network has a ${K.g("priority","An interface setting from 0 to 255 (default 1) compared in the DR/BDR election. Higher wins; 0 means 'never DR or BDR'.")} (0–255, default 1), carried in every hello next to the sender's ${K.g("router ID (RID)","The 32-bit number, written like an IPv4 address, that names an OSPF router (lesson 4).")}.</p>
${K.remember(`<b>The election rule, in plain words:</b> on each shared segment, among the routers with priority 1 or more, the <b>highest priority</b> becomes DR and the second-highest becomes BDR. If priorities tie, the <b>highest router ID</b> wins. <b>Priority 0 never becomes DR or BDR.</b> And the election is <b>non-preemptive</b>: once a DR exists, a better router that arrives later does not take over. <i>&ldquo;Zero never; highest priority, then highest ID; no stealing the chair.&rdquo;</i>`)}
<h3>Why it works that way</h3>
<p><b>Priority first</b> because it is the knob <i>you</i> control; the RID is an accident of addressing, but unique, so it breaks ties cleanly. <b>Priority 0</b> is for routers that should never carry the job (a small branch box, a firewall, a test router). <b>Non-preemptive</b> because changing the DR is expensive — every router must re-sync with the new DR and BDR — so if a better router could grab the job on boot, every reboot would ripple across the VLAN.</p>
<p>The election is <b>per segment</b>: a router can be DR on one VLAN and DROTHER on another.</p>
<h3>Why boot order matters: the wait timer</h3>
<p>A broadcast interface that comes up listens before electing, for a ${K.g("wait timer","The time a newly-up broadcast interface listens before electing — the dead interval, 40 s by default. If hellos name an existing DR and BDR, it accepts them.")} equal to the dead interval (<code>Wait 40</code> in <code>show ip ospf interface</code>). If the hellos already name a DR and BDR, it accepts them and becomes a DROTHER, whatever its priority. So &ldquo;highest priority wins&rdquo; is the whole truth only when routers start <b>together</b> (a site-wide power cut, a lab). Otherwise the first eligible router up is often DR — exactly what happened in Abuja.</p>
<h3>What happens when the DR fails</h3>
<p>Its hellos stop; after the dead interval (40 s by default) the <b>BDR is promoted</b> — it already has the database. A <b>new BDR</b> is elected from the rest by priority, then RID. When the old DR returns, it hears the new DR and BDR and becomes a <b>DROTHER</b>; it does not take its job back.</p>
<h3>Moving the DR on purpose</h3>
<p>Raising a priority changes nothing on its own. You set the priority, then make the current role-holders give the job up with <code>clear ip ospf process</code>, which restarts OSPF on the router you type it on:</p>
${K.out(`HQ-VPN#clear ip ospf process
Reset ALL OSPF processes? [no]: yes
HQ-VPN#
%OSPF-5-ADJCHG: Process 1, Nbr 10.1.255.11 on GigabitEthernet0/0 from FULL to DOWN, Neighbor Down: Interface down or detached
%OSPF-5-ADJCHG: Process 1, Nbr 10.1.255.11 on GigabitEthernet0/0 from LOADING to FULL, Loading Done`, "The prompt defaults to [no]: type yes. Every adjacency on this router (one shown) drops and re-forms, on all its interfaces. The bench shows the end result at once.")}
${K.remember(`<b>The clear rule:</b> an election only fills an <i>empty</i> role, so clear the <b>role-holders</b>, never the candidate. Clearing the DR promotes the BDR and elects a new BDR (your router, if its priority is highest). <b>Candidate already BDR → one clear (the DR). Candidate a DROTHER → two clears</b> (DR and BDR, either order once priorities are set).`)}
<p>Worked example, at a Lagos head office. Four routers share the services VLAN <code>10.1.100.0/24</code>, all priority 1, all started together: HQ-CORE1 (RID <code>10.1.255.1</code>), HQ-CORE2 (<code>.2</code>), HQ-WAN1 (<code>.11</code>), HQ-VPN (<code>.12</code>), configured the lesson-4 way:</p>
${K.out(`HQ-CORE1(config)#router ospf 1
HQ-CORE1(config-router)#router-id 10.1.255.1
HQ-CORE1(config-router)#network 10.1.100.0 0.0.0.255 area 0
HQ-CORE1(config-router)#end
HQ-CORE1#show ip ospf neighbor`, "The same lines on each router, with its own router ID. The neighbour table is read in the next section.")}
${K.steps([
  ["Predict", "All priority 1, so the highest RIDs win: <b>HQ-VPN (.12) DR</b>, <b>HQ-WAN1 (.11) BDR</b>. The team wants HQ-CORE1 as DR."],
  ["Set the priority", "HQ-CORE1: <code>interface g0/0</code>, <code>ip ospf priority 200</code>. <code>show ip ospf neighbor</code>: nothing changes — non-preemption."],
  ["Clear the DR", "HQ-VPN: <code>clear ip ospf process</code>, <code>yes</code>. HQ-WAN1 (BDR) becomes DR; the new BDR is HQ-CORE1 (200)."],
  ["Clear the new DR", "HQ-WAN1: <code>clear ip ospf process</code>, <code>yes</code>. HQ-CORE1 is promoted to DR; the new BDR is the best of the rest — all priority 1, so the highest RID, HQ-VPN."],
  ["Verify and save", "HQ-CORE1: <code>show ip ospf interface g0/0</code> shows <code>State DR, Priority 200</code>; <code>copy running-config startup-config</code>."],
])}
${K.tip(`<code>clear ip ospf process</code> resets <b>every</b> adjacency on that router. On a DR with WAN links, some engineers bounce only the segment's interface instead. Either way, use a maintenance window.`)}
${K.mistake(`Raising the candidate's priority, seeing no change, and clearing OSPF on <i>the candidate</i>. It restarts, hears the existing DR and BDR, and returns as a DROTHER.`)}
${K.exam(`<b>How to read a routing question:</b> (1) what is asked — who is DR, BDR, what changes after an event? (2) which rule — eligibility, priority, RID, and is there already a DR? (3) work it through in order, on paper. The trap is usually <i>&ldquo;added&rdquo;</i>, <i>&ldquo;later&rdquo;</i> or <i>&ldquo;then rebooted&rdquo;</i>: a router joining an existing segment never takes over. And drop priority-0 routers before comparing anything.`)}
${K.q({type:"order", q:"Five routers on one VLAN start at the same moment. Rank the eligible ones from DR (first) to last. R-E has priority 0 and is left out.", items:["R-B (priority 10, RID 10.0.0.2)","R-D (priority 10, RID 10.0.0.1)","R-A (priority 1, RID 10.0.0.9)","R-C (priority 1, RID 10.0.0.4)"], why:"1. Asked: the election order. 2. Rules: drop priority 0; highest priority first; RID breaks ties. 3. Apply: R-B and R-D tie on 10 and R-B's RID is higher, so R-B is DR, R-D BDR. R-A beats R-C on RID (.9 vs .4)."})}
${K.hint(`Who is already up when each router arrives? A router that hears an existing DR in the first 40 seconds accepts it.`)}
${K.reveal("Same logic, new situation: the routers do not start together",`<p>A Port Harcourt branch VLAN. RTR-1 (priority 1, RID 10.9.0.1) boots at 08:00. RTR-2 (priority 50, RID 10.9.0.2) boots at 08:05. RTR-3 (priority 1, RID 10.9.0.3) boots at 08:06. RTR-4 (priority 0, RID 10.9.0.4) at 08:07. Who is DR and BDR at 08:10?</p>
<ol><li><b>What is asked:</b> the roles after staggered starts.</li>
<li><b>Which rules:</b> the wait timer (a newcomer accepts an existing DR/BDR), non-preemption, and priority/RID only when an election actually runs.</li>
<li><b>Apply it:</b> at 08:00 RTR-1 is alone; after its 40-second wait it becomes <b>DR</b>, with no BDR. At 08:05 RTR-2 hears a DR but no BDR, so only the BDR is elected: RTR-2 (priority 50) becomes <b>BDR</b> — it can't unseat the DR. RTR-3 finds both roles taken: DROTHER. RTR-4 (priority 0): DROTHER for ever.</li></ol>
<p><b>Answer:</b> DR RTR-1, BDR RTR-2. If RTR-1 then reloads, RTR-2 is promoted and RTR-3 becomes BDR.</p>`)}
${K.check({q:"A segment has a DR (priority 1) and a BDR (priority 1). You add a new router with priority 255 and the highest router ID on the site. What is its role after it has been up for five minutes?", o:["DR — highest priority always wins","BDR — it replaces the old BDR but not the DR","DROTHER — the DR and BDR already exist and OSPF does not preempt","It cannot join until the election is re-run"], a:2, why:"Its wait timer hears hellos naming a DR and BDR, so it accepts them. It moves up only when a role is vacated."})}

<h2>Neighbour states on a shared segment — and why 2WAY is normal</h2>
<p>Lesson 3 walked the neighbour states, from Down through ${K.g("2WAY","Each router has seen its own RID in the other's hellos. On a broadcast segment, two DROTHERs stop here by design.")} to ${K.g("FULL","The two routers have fully synchronised their databases. Only FULL neighbours are adjacencies.")}. On a shared segment, how far a pair goes depends on roles:</p>
${K.remember(`<b>Who goes FULL on a broadcast segment?</b> Any pair that includes the DR or the BDR goes to FULL. Two DROTHERs stop at <b>2WAY</b> and stay there — they already sync through the DR, so a database exchange between them would be wasted. <i>&ldquo;DR or BDR in the pair → FULL. Two DROTHERs → 2WAY.&rdquo;</i>`)}
<p>Here is HQ-CORE1's view of the Lagos services VLAN, before anyone touched priorities:</p>
${K.out(`HQ-CORE1#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
10.1.255.2        1   2WAY/DROTHER    00:00:38    10.1.100.2      GigabitEthernet0/0
10.1.255.11       1   FULL/BDR        00:00:36    10.1.100.11     GigabitEthernet0/0
10.1.255.12       1   FULL/DR         00:00:35    10.1.100.12     GigabitEthernet0/0`, "HQ-CORE1 is a DROTHER: FULL with the DR and BDR, 2WAY with the other DROTHER. All normal.")}
<ul>
<li><b>Neighbor ID</b> — the neighbour's router ID. <b>Pri</b> — the <i>neighbour's</i> priority, from its hellos.</li>
<li><b>State</b> — before the slash, how far <i>this</i> relationship has got (<code>FULL</code>, <code>2WAY</code>); after it, the <i>neighbour's</i> role. The line never shows your own role.</li>
<li><b>Dead Time</b> counts down from 40, reset by each hello. <b>Address</b> and <b>Interface</b>: the neighbour's IP, and your interface that hears it.</li>
</ul>
<p>On the DR, HQ-VPN, the same command shows every line FULL — <code>FULL/BDR</code> and two <code>FULL/DROTHER</code> — because the DR is adjacent to everyone.</p>
${K.tip(`Your own role from the neighbour table: if every line is FULL and one says <code>/DR</code>, you are the BDR; if none says <code>/DR</code> and all are FULL, you are the DR.`)}
<h3>Reading show ip ospf interface</h3>
<p>This answers what the neighbour table can't: <i>my</i> role and priority, the DR and BDR by address, and neighbours versus adjacencies.</p>
${K.out(`HQ-CORE1#show ip ospf interface g0/0
GigabitEthernet0/0 is up, line protocol is up
  Internet Address 10.1.100.1/24, Interface ID 1, Area 0
  Attached via Network Statement
  Process ID 1, Router ID 10.1.255.1, Network Type BROADCAST, Cost: 1
  Topology-MTID    Cost    Disabled    Shutdown      Topology Name
        0           1         no          no            Base
  Transmit Delay is 1 sec, State DROTHER, Priority 1
  Designated Router (ID) 10.1.255.12, Interface address 10.1.100.12
  Backup Designated router (ID) 10.1.255.11, Interface address 10.1.100.11
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
    oob-resync timeout 40
    Hello due in 00:00:04
  Supports Link-local Signaling (LLS)
  Cisco NSF helper support enabled
  IETF NSF helper support enabled
  Neighbor Count is 3, Adjacent neighbor count is 2
    Adjacent with neighbor 10.1.255.11  (Backup Designated Router)
    Adjacent with neighbor 10.1.255.12  (Designated Router)
  Suppress hello for 0 neighbor(s)`, "HQ-CORE1's view of its own interface on the services VLAN.")}
<ul>
<li><code>Network Type BROADCAST</code> — Ethernet's default, the type that elects. (Point-to-point comes later.)</li>
<li><code>State DROTHER, Priority 1</code> — <b>this</b> router's role and priority here (the DR says <code>State DR</code>).</li>
<li><code>Designated Router (ID) … Interface address …</code> and the Backup line — who holds the roles. With no eligible router you see <code>No designated router on this network</code>: remember that line.</li>
<li><code>Hello 10, Dead 40, Wait 40</code> — Wait equals Dead.</li>
<li><code>Neighbor Count is 3, Adjacent neighbor count is 2</code> — three heard, two FULL: exactly right for a DROTHER (DR + BDR adjacent, the other DROTHER at 2WAY).</li>
</ul>
${K.mistake(`Opening a ticket for <code>2WAY/DROTHER</code> between two DROTHERs — that <i>is</i> the finished state. Real faults look different: 2WAY <b>with the DR</b>, no DR at all, or a neighbour missing from the table.`)}
${K.q({type:"match", q:"You are on router R7 on a shared VLAN. Match each line of R7's show ip ospf neighbor output with what it tells you.", pairs:[["FULL/DR","Adjacent; that neighbour is the segment's DR"],["FULL/BDR","Adjacent; that neighbour is the BDR"],["2WAY/DROTHER","Two-way only: both R7 and that neighbour are DROTHERs — normal"],["FULL/DROTHER","Adjacent with a DROTHER, so R7 itself must be the DR or the BDR"],["FULL/  -","Adjacent on a point-to-point link: no DR or BDR exists there"]], why:"The part after the slash is always the neighbour's role, never yours. FULL/DROTHER can only appear on the DR or BDR, because two DROTHERs stop at 2WAY. The dash means the link has no election at all."})}
${K.hint(`Count how many routers each DROTHER must be adjacent to, then how many it only greets.`)}
${K.reveal("Same logic, new situation: a six-router segment",`<p>Six routers share a VLAN: R6 DR, R5 BDR, R1–R4 DROTHERs. (a) What does R2's <code>show ip ospf neighbor</code> list? (b) The DR's? (c) R2's neighbour counts in <code>show ip ospf interface</code>?</p>
<ol><li><b>What is asked:</b> neighbour lines and counts from two viewpoints.</li>
<li><b>Which rule:</b> every router lists every other router it hears; pairs with the DR or BDR go FULL; DROTHER pairs stay 2WAY.</li>
<li><b>Apply it:</b> (a) R2 hears 5 routers: <code>FULL/DR</code> (R6), <code>FULL/BDR</code> (R5), and three <code>2WAY/DROTHER</code> lines (R1, R3, R4). (b) The DR hears 5: <code>FULL/BDR</code> plus four <code>FULL/DROTHER</code>. (c) R2: <code>Neighbor Count is 5, Adjacent neighbor count is 2</code>.</li></ol>`)}
${K.check({q:"On a shared VLAN, R3's show ip ospf interface says: State DROTHER, Priority 1 · Neighbor Count is 4, Adjacent neighbor count is 2. What does this tell you?", o:["Two neighbours are broken and need fixing","R3 is a DROTHER that is FULL with the DR and BDR and 2WAY with two other DROTHERs — normal","R3 has priority problems and should be set to 0","The segment has no DR"], a:1, why:"A DROTHER is adjacent only to the DR and BDR; the other two DROTHERs stay at 2WAY by design."})}

<h2>Hands-on: predict the election, then move the DR</h2>
<p>Now do it on four routers. This is the Abuja campus backbone VLAN, <code>172.16.50.0/24</code>, with a twist the worked example didn't have: one router has already been set to priority 0. Make your prediction <i>before</i> you run a command, then check it.</p>
${K.bench({id:"m5-dr-election", points:90, from:"CCNA · Module 5 · lesson 5", title:"four routers, one VLAN — predict the DR, then move it", viewBox:"0 0 940 470",
  intro:"Build sheet (172.16.50.0/24, OSPF area 0): R-CORE .1, RID 10.255.0.1 · R-WAN .2, RID 10.255.0.2 · R-DC (the data-centre router) .3, RID 10.255.0.3 · R-LAB .4, RID 10.255.0.4, <code>ip ospf priority 0</code> (a parked test box). All four restarted together after a power cut. Console cable on R-CORE (9600 8N1, no flow control); move it as needed. Write down your prediction first.",
  devices:[
    {id:"core", kind:"router", label:"R-CORE", model:"ISR 4331 · campus core", x:10, y:20, config:e=>{ ["en","conf t","hostname R-CORE","interface g0/0","description CAMPUS BACKBONE VLAN","ip address 172.16.50.1 255.255.255.0","no shutdown","router ospf 1","router-id 10.255.0.1","network 172.16.50.0 0.0.0.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"wan", kind:"router", label:"R-WAN", model:"ISR 4331 · WAN edge", x:240, y:20, config:e=>{ ["en","conf t","hostname R-WAN","interface g0/0","description CAMPUS BACKBONE VLAN","ip address 172.16.50.2 255.255.255.0","no shutdown","router ospf 1","router-id 10.255.0.2","network 172.16.50.0 0.0.0.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"dc", kind:"router", label:"R-DC", model:"ISR 1100 · data-centre", x:470, y:20, config:e=>{ ["en","conf t","hostname R-DC","interface g0/0","description CAMPUS BACKBONE VLAN","ip address 172.16.50.3 255.255.255.0","no shutdown","router ospf 1","router-id 10.255.0.3","network 172.16.50.0 0.0.0.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"lab", kind:"router", label:"R-LAB", model:"ISR 1100 · test box", x:700, y:20, config:e=>{ ["en","conf t","hostname R-LAB","interface g0/0","description CAMPUS BACKBONE VLAN","ip address 172.16.50.4 255.255.255.0","ip ospf priority 0","no shutdown","router ospf 1","router-id 10.255.0.4","network 172.16.50.0 0.0.0.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"SW-BB", model:"Catalyst 9200 · backbone VLAN", x:300, y:250},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:40, y:340},
  ],
  cables:[ {type:"cat6", a:"core:g0", b:"sw:g1"}, {type:"cat6", a:"wan:g0", b:"sw:g2"}, {type:"cat6", a:"dc:g0", b:"sw:g3"}, {type:"cat6", a:"lab:g0", b:"sw:g4"}, {type:"console", a:"lap:usb", b:"core:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Check your prediction: console into R-CORE, <code>enable</code>, <code>show ip ospf neighbor</code>. Who is <code>FULL/DR</code> and who is <code>FULL/BDR</code>? (R-LAB has the highest RID — why isn't it DR?)", done:B=>B.devs.core.env.log.some(l=>/10\.255\.0\.3\s+1\s+FULL\/DR/.test(l.out) && /10\.255\.0\.2\s+1\s+FULL\/BDR/.test(l.out))},
    {text:"Still on R-CORE, <code>show ip ospf interface g0/0</code>: find R-CORE's own state, and <code>Neighbor Count is 3, Adjacent neighbor count is 2</code>. Which neighbour is the non-adjacent one, and is that a fault?", done:B=>B.devs.core.env.log.some(l=>/State DROTHER, Priority 1/.test(l.out) && /Neighbor Count is 3, Adjacent neighbor count is 2/.test(l.out))},
    {text:"The design says <b>R-CORE must be DR and R-WAN the BDR</b>. Work out the priorities that guarantee that order at any future election, and set them on each router's G0/0 with <code>ip ospf priority</code> — R-CORE 100 and R-WAN 50 are the values on the design sheet", done:B=>B.devs.core.env.intfs["GigabitEthernet0/0"].ospfPrio===100 && B.devs.wan.env.intfs["GigabitEthernet0/0"].ospfPrio===50},
    {text:"On R-WAN, <code>show ip ospf neighbor</code> once both priorities are set: R-CORE now shows <code>Pri 100</code> — and who is still DR?", done:B=>B.devs.wan.env.log.some(l=>/10\.255\.0\.1\s+100\s+\S+/.test(l.out) && /10\.255\.0\.3\s+1\s+FULL\/DR/.test(l.out))},
    {text:"Force the election with <code>clear ip ospf process</code> (answer <code>yes</code>). Think first: which routers must you clear, and does clearing R-CORE help? Done when R-CORE is the DR", done:B=>Bench.ospfDr(B,"lab","GigabitEthernet0/0")==="10.255.0.1"},
    {text:"Prove the whole design from R-CORE: <code>show ip ospf interface g0/0</code> shows <code>State DR, Priority 100</code>, the BDR is <code>10.255.0.2</code>, and <code>Adjacent neighbor count is 3</code>", done:B=>B.devs.core.env.log.some(l=>/State DR, Priority 100/.test(l.out) && /Backup Designated router \(ID\) 10\.255\.0\.2/.test(l.out) && /Adjacent neighbor count is 3/.test(l.out))},
    {text:"On R-DC, <code>show ip ospf neighbor</code>: R-DC has gone from DR to DROTHER. Which neighbour is it now only 2WAY with, and why?", done:B=>B.devs.dc.env.log.some(l=>/10\.255\.0\.1\s+100\s+FULL\/DR/.test(l.out) && /10\.255\.0\.4\s+0\s+2WAY\/DROTHER/.test(l.out))},
    {text:"Save the configuration on R-CORE and R-WAN (the priorities live in the running-config)", done:B=>B.devs.core.env.savedOnce && B.devs.wan.env.savedOnce},
  ],
  win:"You predicted an election by applying the rules — priority 0 out first, then priority, then router ID — and confirmed it from the CLI. Then you set priorities, watched non-preemption keep the old DR in place, and cleared only the role-holders, so R-CORE became DR and R-WAN BDR without clearing R-CORE at all. That is the exact change-window procedure.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf neighbor"],["term","show ip ospf interface g0/0"],
    ["term","configure terminal"],["term","interface g0/0"],["term","ip ospf priority 100"],["term","end"],["term","copy running-config startup-config"],["term",""],
    ["unplug","lap:usb"],["plug","console","lap:usb","wan:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/0"],["term","ip ospf priority 50"],["term","end"],["term","show ip ospf neighbor"],
    ["term","clear ip ospf process"],["term","yes"],["term","copy running-config startup-config"],["term",""],
    ["unplug","lap:usb"],["plug","console","lap:usb","dc:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","clear ip ospf process"],["term","yes"],["term","show ip ospf neighbor"],
    ["unplug","lap:usb"],["plug","console","lap:usb","core:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf interface g0/0"]]})}
${K.hint(`Prediction: R-LAB drops out first (priority 0). The other three tie on priority 1, so the highest RIDs win. For the move: R-CORE is a DROTHER, so two routers hold roles above it. Clearing R-WAN (the BDR) makes R-CORE, priority 100, the new BDR; clearing R-DC (the DR) then promotes R-CORE, and the BDR election picks R-WAN (50) over R-DC (1). Clearing them in the other order gets the same result.`)}
<p>Read what happened: R-LAB (priority 0) was out first, RIDs ranked the rest, raising priorities changed only the <code>Pri</code> column, and each clear emptied one role for an election that used the new priorities.</p>
${K.check({q:"In the bench, why was it enough to clear R-WAN and R-DC, and pointless to clear R-CORE?", o:["Because clear ip ospf process only works on DRs","Because an election only fills an empty role: clearing a role-holder empties its role, while a cleared R-CORE would rejoin, hear the existing DR and BDR, and stay a DROTHER","Because R-CORE had the lowest router ID","Because R-CORE's priority change needs a reload instead"], a:1, why:"Non-preemption means a router never takes a role that is occupied. You move roles by vacating them. R-CORE was the candidate, not a role-holder."})}

<h2>Network types: broadcast or point-to-point?</h2>
<p>OSPF decides how to behave on an interface from its ${K.g("network type","What kind of link OSPF thinks an interface is on — BROADCAST (elect a DR/BDR) or POINT_TO_POINT (one neighbour, no election), among others. Ethernet defaults to BROADCAST.")}. The CCNA needs two:</p>
<ul>
<li><b>BROADCAST</b> — the default on Ethernet (including SVIs and subinterfaces): elect a DR and BDR, use the wait timer, the DR creates a network LSA.</li>
<li>${K.g("POINT_TO_POINT","Network type for a link with exactly one neighbour: no election, no wait timer, no network LSA; neighbours show FULL/  -. Default on serial links.")} — the default on serial links (${K.g("HDLC","High-Level Data Link Control: the default Layer 2 encapsulation on Cisco serial links.")}, PPP), which have one router at each end. One possible neighbour, nothing to elect.</li>
</ul>
<p>The catch: many router-to-router links are Ethernet — a cross-connect, fibre between buildings, a metro Ethernet circuit from MainOne or MTN. Two routers, yet OSPF runs a BROADCAST election for a &ldquo;segment&rdquo; of two: cost, no benefit.</p>
${K.svg("0 0 720 270",
  K.band(20,6,330,24,"BROADCAST — the Ethernet default")+K.band(370,6,330,24,"POINT-TO-POINT — configured")+
  K.link(360,40,360,262,"",true)+
  K.link(70,122,172,182)+K.link(185,122,185,178)+K.link(300,122,198,182)+
  K.dev("router",70,70,"R1","DR")+K.dev("router",185,70,"R2","BDR")+K.dev("router",300,70,"R3","DROTHER")+
  K.dev("switch",185,192,"one VLAN","")+
  K.txt(185,246,"elects DR + BDR · wait timer · network LSA",{s:10.5,mid:true})+
  K.txt(185,262,"neighbours: FULL/DR · FULL/BDR · 2WAY/DROTHER",{s:10.5,mid:true})+
  K.link(476,118,614,118,"10.0.12.0/30")+
  K.dev("router",450,120,"ABJ-R1","")+K.dev("router",640,120,"ABJ-R2","")+
  K.txt(545,206,"ip ospf network point-to-point (both ends)",{s:10.5,mid:true})+
  K.txt(545,226,"no election · no DR · no BDR · no wait",{s:10.5,mid:true})+
  K.txt(545,246,"neighbour state: FULL/  -",{s:10.5,mid:true}),
  "Left: a shared segment, where the election earns its keep. Right: a two-router link set to point-to-point — no election at all.")}
<h3>Why engineers set point-to-point on router-to-router Ethernet</h3>
<ul>
<li><b>Faster adjacency</b> after a link flap: no 40-second wait timer.</li>
<li><b>No election to manage</b> — no priorities, no non-preemption surprises where roles mean nothing.</li>
<li><b>A smaller database.</b> No network LSA per link; the link is described in the two routers' own LSAs.</li>
<li><b>Clearer output:</b> <code>FULL/  -</code> says &ldquo;point-to-point&rdquo; at a glance.</li>
</ul>
<p>The command goes on the interface, at <b>both ends</b>:</p>
${K.out(`ABJ-R1(config)#interface g0/1
ABJ-R1(config-if)#ip ospf network point-to-point
ABJ-R1(config-if)#end

ABJ-R2(config)#interface g0/1
ABJ-R2(config-if)#ip ospf network point-to-point
ABJ-R2(config-if)#end`, "The same command on both routers' interfaces for the link. To undo it: no ip ospf network (back to the default, BROADCAST on Ethernet).")}
<h3>Before and after, in the outputs</h3>
<p>On the Abuja link <code>10.0.12.0/30</code> between ABJ-R1 (RID <code>10.2.255.1</code>) and ABJ-R2 (RID <code>10.2.255.2</code>), ABJ-R1 showed its neighbour as <code>FULL/DR</code> before the change — a DR and a BDR on a link that can only ever hold two routers. After:</p>
${K.out(`ABJ-R1#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
10.2.255.2        0   FULL/  -        00:00:35    10.0.12.2       GigabitEthernet0/1

ABJ-R1#show ip ospf interface g0/1 | include Type|State|Timer|Count
  Attached via Network Statement
  Process ID 1, Router ID 10.2.255.1, Network Type POINT_TO_POINT, Cost: 1
  Transmit Delay is 1 sec, State POINT_TO_POINT
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
  Neighbor Count is 1, Adjacent neighbor count is 1

ABJ-R1#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/1        1     0               10.0.12.1/30       1     P2P   1/1`, "After: FULL/  -, Network Type POINT_TO_POINT, State POINT_TO_POINT, no Designated Router lines; the brief view shows P2P, 1 full of 1.")}
<ul>
<li><code>FULL/  -</code> — a dash where the role would be: no roles exist here. The <code>Pri</code> column means nothing on point-to-point: IOS (and the lab) prints 0 there. The extra <code>Attached via Network Statement</code> line is there because <code>include</code> matches text anywhere in a line, and &ldquo;Statement&rdquo; contains &ldquo;State&rdquo;.</li>
<li><b>The timers stay the same</b> (hello 10, dead 40 on Ethernet), so changing the type doesn't break the hello match.</li>
<li>In <code>show ip ospf database</code>, the <code>Net Link States</code> entry for <code>10.0.12.2</code> (the old DR) disappears.</li>
</ul>
${K.mistake(`Configuring point-to-point at one end only. The timers still match, so the routers may reach FULL — but they describe the link differently in their LSAs, SPF can't join the two descriptions, and routes across the link go missing — in both directions — behind a healthy-looking adjacency. The point-to-point end shows <code>FULL/  -</code>; the broadcast end runs its own election and shows the neighbour with a role after the slash (DR, BDR or DROTHER) instead of a dash. The lab behaves the same way. Configure both ends, then check <code>FULL/  -</code> at both and the routes in <code>show ip route ospf</code>. Lesson 6 troubleshoots this.`)}
${K.when([
  ["BROADCAST (default)","Three or more routers share a VLAN","The DR keeps adjacencies at 2n−3","Only two routers will ever be on the link"],
  ["ip ospf network point-to-point","Exactly two routers on an Ethernet link","No election, no wait, no network LSA","A third router might join later"],
  ["ip ospf priority 0","A router that must never be DR/BDR","Out of the election for good","Every router on the segment (no DR at all)"],
  ["A high priority","The router you want as DR","Wins every future election","You expect it to take over at once"],
], "Choosing a network type and priorities")}
${K.term({env:"ios2", title:"pre-stage a branch router for Calabar", opts:{kind:"router", host:"R-CAL-1", model:"ISR 1100-4G",
  motd:"R-CAL-1 — Calabar branch. Gi0/0 branch LAN (shared with R-CAL-2, the voice gateway, arriving next month) · Gi0/1 link to R-UYO (Uyo) · Gi0/2 ISP Ethernet circuit to R-ABJ (Abuja)."},
  setup:env=>{ ["en","conf t","hostname R-CAL-1","interface g0/0","description BRANCH LAN - shared with R-CAL-2","ip address 10.40.0.1 255.255.255.0","no shutdown","interface g0/1","description Link to R-UYO Uyo","ip address 10.0.41.1 255.255.255.252","no shutdown","interface g0/2","description ISP Ethernet to R-ABJ Abuja","ip address 10.0.42.1 255.255.255.252","no shutdown","router ospf 1","network 10.0.0.0 0.255.255.255 area 0","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; env.log.length=0; },
  intro:"The router is on your desk before it ships, OSPF running, design sheet not yet applied: router ID 10.255.40.1; Gi0/1 and Gi0/2 are router-to-router links; on Gi0/0, R-CAL-1 must win the DR election even if both branch routers restart together.",
  tasks:[
    {text:"<code>enable</code>, then <code>show ip ospf interface brief</code>: all three interfaces are BROADCAST, so each one — alone for now — shows itself as DR", done:e=>e.log.some(l=>/Gi0\/1\s+1\s+0\s+10\.0\.41\.1\/30\s+1\s+DR/.test(l.out))},
    {text:"Make both router-to-router links OSPF point-to-point (one <code>interface range</code> can do both)", done:e=>e.intfs["GigabitEthernet0/1"].ospfNet==="point-to-point" && e.intfs["GigabitEthernet0/2"].ospfNet==="point-to-point"},
    {text:"Make sure R-CAL-1 beats R-CAL-2 (which will have the default priority) at any election on the LAN: priority 255 on Gi0/0", done:e=>e.intfs["GigabitEthernet0/0"].ospfPrio===255},
    {text:"Set the router ID to 10.255.40.1 and make it take effect — read what IOS tells you", done:e=>e.ospfRidActive==="10.255.40.1"},
    {text:"Verify with <code>show ip ospf interface brief</code>: Gi0/1 and Gi0/2 now show <code>P2P</code>, Gi0/0 still <code>DR</code>", done:e=>e.log.some(l=>/Gi0\/1\s+1\s+0\s+10\.0\.41\.1\/30\s+1\s+P2P/.test(l.out) && /Gi0\/2\s+1\s+0\s+10\.0\.42\.1\/30\s+1\s+P2P/.test(l.out))},
    {text:"Save the configuration", done:e=>e.savedOnce},
  ],
  win:"The Calabar router will ship with its design applied: point-to-point on both inter-site links (no elections, no wait timer when the circuits come up), priority 255 on the shared LAN so it wins every election there, and the planned router ID in use. When R-CAL-2 arrives with priority 1, it becomes BDR — and if both ever restart together, R-CAL-1 still wins.",
  solve:["enable","show ip ospf interface brief","configure terminal","interface range g0/1 - 2","ip ospf network point-to-point","interface g0/0","ip ospf priority 255","router ospf 1","router-id 10.255.40.1","end","clear ip ospf process","yes","show ip ospf interface brief","copy running-config startup-config",""]})}
${K.hint(`<code>router-id</code> on a running OSPF process prints a message telling you to reload or restart the process. Here nothing depends on the router yet, so restarting is harmless.`)}
${K.hint(`List each interface and ask: how many OSPF routers can ever be on it?`)}
${K.reveal("Same logic, new situation: which interfaces get point-to-point?",`<p>A new Ibadan router has: Gi0/0/0, a server VLAN shared with two firewalls and another router; Gi0/0/1, dark fibre to the Lagos core router; Gi0/0/2, a user VLAN with no other routers; Serial0/1/0, a PPP link to an old site. Which get <code>ip ospf network point-to-point</code>?</p>
<ol><li><b>What is asked:</b> where point-to-point fits.</li>
<li><b>Which rule:</b> point-to-point is for links with exactly one OSPF neighbour, ever; serial already defaults to it.</li>
<li><b>Apply it:</b> Gi0/0/0 has several routers — BROADCAST, with deliberate priorities. Gi0/0/1 has two — point-to-point at both ends. Gi0/0/2 has no OSPF neighbours: make it <b>passive</b> (lesson 4). Serial0/1/0 is already POINT_TO_POINT.</li></ol>
<p><b>Answer:</b> only Gi0/0/1 (and its partner in Lagos).</p>`)}
${K.check({q:"An engineer configures ip ospf network point-to-point on both ends of a router-to-router Ethernet link. Which output confirms it worked?", o:["show ip ospf neighbor shows FULL/DR for the neighbour","show ip ospf neighbor shows FULL/  - and show ip ospf interface shows Network Type POINT_TO_POINT","show ip ospf interface shows Hello 30, Dead 120","The neighbour shows 2WAY/DROTHER"], a:1, why:"No election runs on a point-to-point link, so no role is shown: FULL/  -. The interface says POINT_TO_POINT. The Ethernet timers stay at 10/40."})}

<h2>The priority-0 trap — and putting it all to work</h2>
<p>Priority 0 is meant for <i>some</i> routers. Put it on <b>every</b> router of a broadcast segment and the rules predict the result: nobody is eligible, so no DR and no BDR; every router is a DROTHER, DROTHER pairs stop at 2WAY, and <b>no routes are learned across the segment</b>. The neighbours are all visible and the hellos are fine, which is why people stare at it for an hour.</p>
${K.out(`PH-R1#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
10.5.255.2        0   2WAY/DROTHER    00:00:35    10.5.20.2       GigabitEthernet0/0
10.5.255.3        0   2WAY/DROTHER    00:00:34    10.5.20.3       GigabitEthernet0/0

PH-R1#show ip ospf interface g0/0 | include State|designated|Count
  Attached via Network Statement
  Transmit Delay is 1 sec, State DROTHER, Priority 0
  No designated router on this network
  No backup designated router on this network
  Neighbor Count is 2, Adjacent neighbor count is 0`, "A Port Harcourt segment where all three routers have priority 0. Every neighbour has Pri 0 and 2WAY/DROTHER; there is no DR; adjacent neighbours: 0.")}
${K.remember(`<b>The trap's fingerprint:</b> every neighbour <code>2WAY/DROTHER</code> with <code>Pri</code> 0, <code>No designated router on this network</code>, <code>Adjacent neighbor count is 0</code>. <b>Fix:</b> make one router eligible (<code>no ip ospf priority</code> returns it to the default, 1) — or, with only two routers, point-to-point at both ends.`)}
<p>The routers may elect as soon as they see the new priority in hellos (OSPF's rules make a router re-check the election when a neighbour's hello shows a changed priority; the lab elects at once); to be certain, <code>clear ip ospf process</code> on the router you made eligible — ideally one with no other neighbours, so the restart disturbs nothing else. The second bench hides this trap inside a ticket, alongside a point-to-point change.</p>
${K.bench({id:"m5-p2p-trap", points:100, from:"CCNA · Module 5 · lesson 5", title:"the email outage after the 'hardening' change — and an Ethernet link goes point-to-point", viewBox:"0 0 940 520",
  intro:"Ticket: &ldquo;Since last night's change, HQ and Ikeja staff can reach each other but not email (MAIL, 10.30.0.25).&rdquo; Last night a &lsquo;hardening template&rsquo; was applied to the HQ–EDGE segment (10.0.99.0/29, via SW-EDGE). RIDs: R-HQ 10.255.1.1 · R-IKJ 10.255.2.1 · R-EDGE 10.255.9.1 (routes to the mail LAN 10.30.0.0/24). The HQ–Ikeja metro Ethernet circuit (10.0.0.0/30) should, by the design standard, be OSPF point-to-point. Console cable on R-HQ (9600 8N1, no flow control).",
  devices:[
    {id:"hq", kind:"router", label:"R-HQ", model:"ISR 4331 · Lagos HQ", x:250, y:20, config:e=>{ ["en","conf t","hostname R-HQ","interface g0/0","description HQ STAFF LAN","ip address 10.10.0.1 255.255.255.0","no shutdown","interface g0/1","description METRO-E to R-IKJ Gi0/1","ip address 10.0.0.1 255.255.255.252","no shutdown","interface g0/2","description HQ-EDGE segment via SW-EDGE","ip address 10.0.99.1 255.255.255.248","ip ospf priority 0","no shutdown","router ospf 1","router-id 10.255.1.1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"ikj", kind:"router", label:"R-IKJ", model:"ISR 1100 · Ikeja branch", x:10, y:200, config:e=>{ ["en","conf t","hostname R-IKJ","interface g0/0","description IKEJA STAFF LAN","ip address 10.20.0.1 255.255.255.0","no shutdown","interface g0/1","description METRO-E to R-HQ Gi0/1","ip address 10.0.0.2 255.255.255.252","no shutdown","router ospf 1","router-id 10.255.2.1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"edge", kind:"router", label:"R-EDGE", model:"ISR 4321 · services edge", x:700, y:200, config:e=>{ ["en","conf t","hostname R-EDGE","interface g0/0","description MAIL LAN","ip address 10.30.0.1 255.255.255.0","no shutdown","interface g0/1","description HQ-EDGE segment via SW-EDGE","ip address 10.0.99.2 255.255.255.248","ip ospf priority 0","no shutdown","router ospf 1","router-id 10.255.9.1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"sw", kind:"switch", label:"SW-EDGE", model:"Catalyst 9200 · HQ-EDGE VLAN", x:260, y:200},
    {id:"p1", kind:"pc", label:"PC-HQ", x:560, y:20, ip:"10.10.0.10", mask:"255.255.255.0", gw:"10.10.0.1"},
    {id:"p2", kind:"pc", label:"PC-IKJ", x:40, y:390, ip:"10.20.0.10", mask:"255.255.255.0", gw:"10.20.0.1"},
    {id:"srv", kind:"server", label:"MAIL", x:760, y:390, ip:"10.30.0.25", mask:"255.255.255.0", gw:"10.30.0.1"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:40, y:20},
  ],
  cables:[ {type:"cat6", a:"hq:g1", b:"ikj:g1"}, {type:"cat6", a:"hq:g2", b:"sw:g1"}, {type:"cat6", a:"edge:g1", b:"sw:g2"}, {type:"cat6", a:"p1:eth", b:"hq:g0"}, {type:"cat6", a:"p2:eth", b:"ikj:g0"}, {type:"cat6", a:"srv:eth", b:"edge:g0"}, {type:"console", a:"lap:usb", b:"hq:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Reproduce the complaint: from PC-IKJ's Command Prompt, <code>ping 10.30.0.25</code>. Who answers, and what does that tell you about R-IKJ's routing table?", done:B=>Bench.tried(B,"p2",/^\s*ping\s+10\.30\.0\.25\s*$/i)},
    {text:"Console into R-HQ, <code>enable</code>, <code>show ip ospf neighbor</code>. Find two odd lines: a DR on a two-router circuit (the Ikeja link) and R-EDGE stuck at <code>2WAY/DROTHER</code> with <code>Pri 0</code>", done:B=>B.devs.hq.env.log.some(l=>/10\.255\.2\.1\s+1\s+FULL\/DR/.test(l.out) && /10\.255\.9\.1\s+0\s+2WAY\/DROTHER/.test(l.out))},
    {text:"Confirm the diagnosis: <code>show ip ospf interface g0/2</code> on R-HQ — find <code>Priority 0</code>, <code>No designated router on this network</code> and the adjacent neighbour count", done:B=>B.devs.hq.env.log.some(l=>/State DROTHER, Priority 0/.test(l.out) && /No designated router on this network/.test(l.out))},
    {text:"Fix the segment: make R-EDGE's G0/1 eligible again (<code>no ip ospf priority</code>), then restart OSPF on R-EDGE with <code>clear ip ospf process</code> — it has no other OSPF neighbours, so nothing else is disturbed. Done when R-HQ is FULL with R-EDGE", done:B=>B.devs.edge.env.intfs["GigabitEthernet0/1"].ospfPrio==null && Bench.ospfNbr(B,"hq","10.255.9.1","FULL")},
    {text:"Prove the user-facing fix: PC-IKJ can <code>ping 10.30.0.25</code>, and <code>tracert 10.30.0.25</code> shows the path R-IKJ → R-HQ → R-EDGE → MAIL", done:B=>Bench.pinged(B,"p2","10.30.0.25") && Bench.traced(B,"p2","10.30.0.25")},
    {text:"Now the design-standard change: set <code>ip ospf network point-to-point</code> on G0/1 of <b>both</b> R-IKJ and R-HQ. Done when both ends are point-to-point and the adjacency is FULL", done:B=>B.devs.hq.env.intfs["GigabitEthernet0/1"].ospfNet==="point-to-point" && B.devs.ikj.env.intfs["GigabitEthernet0/1"].ospfNet==="point-to-point" && Bench.ospfNbr(B,"hq","10.255.2.1","FULL")},
    {text:"Verify on R-HQ: <code>show ip ospf neighbor</code> shows <code>FULL/  -</code> for 10.255.2.1 (and R-EDGE in its new role), and <code>show ip ospf interface g0/1</code> says <code>Network Type POINT_TO_POINT</code> with no DR lines", done:B=>B.devs.hq.env.log.some(l=>/10\.255\.2\.1\s+\d+\s+FULL\/  -/.test(l.out)) && B.devs.hq.env.log.some(l=>/Network Type POINT_TO_POINT/.test(l.out) && !/Designated Router/.test(l.out))},
    {text:"Email still works from Ikeja after the change (ping MAIL again), and R-HQ, R-IKJ and R-EDGE are saved", done:B=>B.devs.hq.env.intfs["GigabitEthernet0/1"].ospfNet==="point-to-point" && Bench.pinged(B,"p2","10.30.0.25") && B.devs.hq.env.savedOnce && B.devs.ikj.env.savedOnce && B.devs.edge.env.savedOnce},
  ],
  win:"You worked a real ticket from the user's symptom to the cause: a template that set priority 0 on both routers of a segment, leaving no DR, so the pair could never go past 2WAY and the mail LAN was never learned. One eligible router fixed it. Then you moved the HQ–Ikeja circuit to point-to-point at both ends and watched the DR disappear and FULL/  - appear — with email still working.",
  solve:[["pc","p2","ping 10.30.0.25"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf neighbor"],["term","show ip ospf interface g0/2"],
    ["unplug","lap:usb"],["plug","console","lap:usb","edge:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/1"],["term","no ip ospf priority"],["term","end"],["term","clear ip ospf process"],["term","yes"],["term","copy running-config startup-config"],["term",""],
    ["pc","p2","ping 10.30.0.25"],["pc","p2","tracert 10.30.0.25"],
    ["unplug","lap:usb"],["plug","console","lap:usb","ikj:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ip ospf network point-to-point"],["term","end"],["term","copy running-config startup-config"],["term",""],
    ["unplug","lap:usb"],["plug","console","lap:usb","hq:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ip ospf network point-to-point"],["term","end"],
    ["term","show ip ospf neighbor"],["term","show ip ospf interface g0/1"],["term","copy running-config startup-config"],["term",""],
    ["pc","p2","ping 10.30.0.25"]]})}
${K.hint(`PC-IKJ's own gateway answers &ldquo;Destination host unreachable&rdquo;: R-IKJ has no route to 10.30.0.0/24. It learns it only if R-HQ is FULL with R-EDGE — so on that segment, who is eligible to be DR? On the Ikeja link, judge the result only once both ends are changed.`)}
<p>Notice where the cause was: two hops from the user, on a segment whose neighbours all looked alive. One eligible router (R-EDGE, now DR) was enough to fix it.</p>
${K.hint(`Use the rules in order: who is eligible, and what does each pair's state become?`)}
${K.reveal("Same logic, new situation: priority 0 on three of four routers",`<p>A four-router VLAN. To &ldquo;make sure the core is always DR&rdquo;, someone sets priority 0 on R1, R2 and R3, and leaves R-CORE on the default 1. (a) What are the roles and states? (b) Does routing work? (c) What happens the day R-CORE reloads?</p>
<ol><li><b>What is asked:</b> roles, states, and the effect of a failure.</li>
<li><b>Which rules:</b> priority 0 never DR or BDR; pairs that include the DR or BDR go FULL, DROTHER pairs stop at 2WAY.</li>
<li><b>Apply it:</b> (a) Only R-CORE is eligible: DR, and <b>no BDR</b>. R1–R3 are FULL with it and 2WAY with each other. (b) Yes, everything syncs through the DR. (c) While R-CORE is down nobody is eligible: no DR, everyone 2WAY, routing across the VLAN stops. There was never a backup.</li></ol>
<p><b>Lesson:</b> prefer a router with a <i>higher</i> priority, and keep at least two eligible so a BDR exists.</p>`)}
${K.check({q:"Two routers share a VLAN. Both interfaces have ip ospf priority 0. Hellos match. What do they show, and what is the least-effort permanent fix if no other router will ever join that VLAN?", o:["FULL/DROTHER; nothing needs fixing","2WAY/DROTHER with no DR, and no routes exchanged; configure ip ospf network point-to-point on both ends (or make one router eligible)","Init; fix the hello timers","FULL/DR on both; remove one router"], a:1, why:"No eligible router, no DR, so the pair never passes 2WAY. With two routers, point-to-point removes the election; a non-zero priority on one also works."})}

${K.job("“The legacy router is DR on the data-centre VLAN again” — boot order after a power cut",`
<p><b>The alert.</b> Monday 07:50 at an MSP (managed-service provider) in Wuse, Abuja, that runs a bank's data centre (DC). Monitoring flags a policy breach: <i>&ldquo;DC-TRANSIT VLAN: DR is DC-LEGACY (10.60.255.9). Standard: DR/BDR must be DC-CORE1 or DC-CORE2.&rdquo;</i> The standard exists because DC-LEGACY has one power supply and one uplink, and a DR failure makes every router on the VLAN re-synchronise.</p>
<p><b>Questions first.</b> &ldquo;What changed?&rdquo; — a generator changeover on Saturday cut rack power for four minutes. &ldquo;What came back first?&rdquo; — DC-LEGACY, on its own small UPS; the cores take four minutes to boot. That fits the wait-timer rule.</p>
<p><b>Checks</b>, on DC-CORE1:</p>
${K.out(`DC-CORE1#show ip ospf interface g0/0/1 | include State|Designated|Backup|Count
  Attached via Network Statement
  Transmit Delay is 1 sec, State DROTHER, Priority 1
  Designated Router (ID) 10.60.255.9, Interface address 10.60.10.9
  Backup Designated router (ID) 10.60.255.2, Interface address 10.60.10.2
  Neighbor Count is 4, Adjacent neighbor count is 2
    Adjacent with neighbor 10.60.255.2  (Backup Designated Router)
    Adjacent with neighbor 10.60.255.9  (Designated Router)`, "DC-LEGACY is DR, DC-CORE2 (10.60.255.2) BDR, DC-CORE1 a DROTHER — all on the default priority, 1.")}
<p>The adjacencies are healthy. The fault is in the configuration: <b>every priority is 1</b>, so the standard was never enforced and boot order chose the DR.</p>
<p><b>The fix</b>, in the approved 22:00 window: priority <code>110</code> on DC-CORE1, <code>100</code> on DC-CORE2, <code>0</code> on DC-LEGACY. Then <b>one</b> clear, on DC-LEGACY — the BDR is already a core, so vacating the DR role is enough: DC-CORE2 is promoted, DC-CORE1 (110) becomes BDR. A second clear would only cause more re-synchronisation for nothing the standard asks for. Verify (<code>State BDR, Priority 110</code> on DC-CORE1), check a server traceroute still takes the same path, save all three.</p>
<p><b>What you say</b> to the bank's IT manager: &ldquo;Nothing failed. After the power cut the old router booted first and took the coordinator role on the data-centre network, because the settings that prevent that were never configured. I've set them and moved the role back to the core routers, with no change to traffic paths. It won't recur.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;DC-TRANSIT DR = DC-LEGACY. Cause: all priorities default; DC-LEGACY (separate UPS) booted first after Sat power cut; election non-preemptive. Change 22:00: priority 110 DC-CORE1, 100 DC-CORE2, 0 DC-LEGACY; clear ip ospf process on DC-LEGACY only. Now DR DC-CORE2, BDR DC-CORE1. Traceroutes unchanged. Saved; priorities added to build template. 35 min.&rdquo;</i></p>`)}

${K.case("An MSP moves 30 metro Ethernet links to point-to-point",`
<p>A Lagos MSP runs OSPF for a retail chain: a Victoria Island hub and 30 stores, each on a router-to-router metro Ethernet circuit left on the default network type. After a provider flap, stores waited through the broadcast wait timer; the hub's database carried 30 network LSAs for two-router &ldquo;segments&rdquo;; and the NOC (network operations centre) saw <code>FULL/DR</code> everywhere — one engineer spent an evening &ldquo;fixing&rdquo; DR placement that made no difference.</p>
<p><b>The decision:</b> every circuit point-to-point at both ends; the hub's two shared VLANs stay BROADCAST with planned priorities (hub routers 100 and 90, the rest 0). <b>The rollout:</b> five stores a night — hub end, store end, verify both (<code>FULL/  -</code>, store LAN in <code>show ip route ospf</code>, a ping to the payment servers). On night two a store's routes vanished: only the hub end had been changed. The adjacency looked fine; the route check caught it in two minutes.</p>
<p><b>The result:</b> stores recover within seconds, and the runbook gained a line — &ldquo;a store link that isn't <code>FULL/  -</code> isn't finished.&rdquo;</p>`)}
${K.dyk(`OSPF has more network types than these two — non-broadcast ones were built for old shared WANs such as Frame Relay. That's why the command is <code>ip ospf network</code> (&ldquo;what kind of network is this?&rdquo;), not &ldquo;disable DR&rdquo;.`)}
${K.myth([
  ["Traffic on a shared VLAN flows through the DR.","The DR only coordinates flooding. Packets go straight to the next hop SPF chooses."],
  ["The highest router ID is always the DR.","Only with equal priorities and a simultaneous start. Priority comes first, 0 is never elected, and a sitting DR stays."],
  ["Priority 255 makes a router DR straight away.","It counts only at the next election, which you force by clearing the current role-holders."],
  ["2WAY means the adjacency is stuck.","Between two DROTHERs, 2WAY is the correct, finished state."],
  ["Priority 0 on every router makes a segment more stable.","It leaves no DR: everyone stops at 2WAY and no routes cross the segment."],
])}
${K.dodont([
  "Set priorities on purpose on every shared VLAN: high for the DR, lower non-zero for the BDR, 0 for routers that must never hold the role.",
  "Use point-to-point on two-router Ethernet links, at both ends.",
  "Clear the role-holders in a maintenance window — never the candidate.",
  "Verify with <code>show ip ospf interface</code> and with the routes themselves.",
  "Put priorities and network types in the build template.",
],[
  "Don't expect a priority change to act at once.",
  "Don't set priority 0 on every router of a segment.",
  "Don't change a network type at one end only.",
  "Don't run <code>clear ip ospf process</code> in business hours on a router with WAN neighbours.",
  "Don't open a ticket for 2WAY between two DROTHERs.",
])}

<h2>Interview corner</h2>
${K.hint(`The problem (adjacency count, flooding), the roles, the two multicast addresses.`)}
${K.reveal("“What is the DR in OSPF, and why does OSPF elect one?”",`<p>"On a broadcast segment like an Ethernet VLAN, a full mesh would need n(n−1)/2 adjacencies and updates would be flooded over and over. So OSPF elects a designated router and a backup, and everyone else forms full adjacencies only with those two. DROTHERs send updates to 224.0.0.6, which only the DR and BDR hear; the DR re-floods to 224.0.0.5. The BDR keeps a full copy to take over at once. Two DROTHERs stay at 2WAY, which is normal."</p>`)}
${K.hint(`Non-preemption, then the safe procedure.`)}
${K.reveal("“You set priority 255 on a router, but it still isn't the DR. Why, and how would you fix it?”",`<p>"The election isn't preemptive: priority matters only when an election runs, and an election only fills an empty role. In a maintenance window I'd restart OSPF on the routers holding the roles, not the one I want to promote. If it's already BDR, clearing the DR is enough; if it's a DROTHER, I clear the DR and the BDR and it wins each election on priority. Then I verify with show ip ospf interface and save."</p>`)}
${K.hint(`What the default type does on a two-router link, what that costs, and the one thing not to forget.`)}
${K.reveal("“Why would you configure ip ospf network point-to-point on an Ethernet interface?”",`<p>"Ethernet defaults to broadcast, so OSPF elects a DR and BDR even on a link that can only ever have two routers, like a metro Ethernet circuit. That adds a wait of up to 40 seconds when the link comes up, a network LSA per link, and roles that mean nothing. Point-to-point skips all that — neighbours show FULL with a dash — and the timers don't change. I configure both ends, because a mismatch can leave the adjacency up but routes missing."</p>`)}

${K.recap([
  "Full mesh = n(n−1)/2 adjacencies; with a DR and BDR, 2n−3. DROTHERs send updates to 224.0.0.6; the DR re-floods to 224.0.0.5.",
  "Election per segment: priority 0 out; highest priority wins; ties to the highest RID. Default 1, range 0–255.",
  "Non-preemptive: a later, better router never takes an occupied role; boot order often decides the DR. DR fails → BDR promoted, new BDR elected.",
  "To move the DR: set priorities, then clear the role-holders — one clear if your router is BDR, two if it's a DROTHER. Never the candidate.",
  "DR or BDR in the pair → FULL; two DROTHERs → 2WAY (normal). show ip ospf interface: State, Priority, DR/BDR, neighbour vs adjacent counts.",
  "Priority 0 everywhere: no DR, everyone 2WAY, no routes. Fix with no ip ospf priority on one router, or point-to-point if only two.",
  "ip ospf network point-to-point, both ends of a two-router Ethernet link: no election, no wait, no network LSA, FULL/  -.",
])}
${K.next(`<b>Lesson 6 — OSPF cost, path choice and troubleshooting adjacencies.</b> You now control <i>who coordinates</i> a segment; next, <i>which way traffic goes</i>: bandwidth into cost, <code>ip ospf cost</code> and the reference bandwidth, a first look at multi-area OSPF and <code>O IA</code> — and a method for every &ldquo;the neighbour won't come up&rdquo; ticket, including today's network-type mismatch.`)}
`,
quiz:[
  {lvl:1, q:"What is the default OSPF priority on a Cisco router interface?", o:["0","1","100","255"], a:1, why:"Every OSPF interface starts at priority 1. The range is 0–255; 0 makes the interface ineligible to be DR or BDR."},
  {lvl:1, q:"On a broadcast segment, which multicast address do DROTHERs send their link-state updates to?", o:["224.0.0.1","224.0.0.5","224.0.0.6","224.0.0.10"], a:2, why:"224.0.0.6 (AllDRouters) is heard only by the DR and BDR. The DR then re-floods to 224.0.0.5 (AllSPFRouters), which every OSPF router listens to. 224.0.0.10 is EIGRP's address."},
  {lvl:1, type:"fill", q:"Which interface command stops a router from ever becoming DR or BDR on that segment?", fields:[{label:"Command", a:["ip ospf priority 0"], ios:true}], why:"Priority 0 makes the interface ineligible in the election. The router still forms adjacencies with the DR and BDR as a DROTHER."},
  {lvl:1, type:"match", q:"Match each neighbour state, as shown in show ip ospf neighbor, with its meaning.", pairs:[["FULL/DR","Adjacent; the neighbour is the segment's DR"],["FULL/BDR","Adjacent; the neighbour is the backup DR"],["2WAY/DROTHER","Two-way only, between two DROTHERs — normal"],["FULL/  -","Adjacent on a point-to-point link with no DR or BDR"]], why:"The text after the slash is the neighbour's role. Two DROTHERs stop at 2WAY by design, and a point-to-point link has no roles at all."},
  {lvl:2, type:"order", q:"HQ-R3 is a DROTHER. Put these steps in order to make it the DR on its VLAN with the least guesswork.", items:["Set ip ospf priority 200 on HQ-R3's interface on that VLAN","Run show ip ospf neighbor and confirm nothing has changed yet (non-preemptive)","In a maintenance window, clear ip ospf process on the current DR — the BDR is promoted and HQ-R3 becomes BDR","Clear ip ospf process on the new DR (the old BDR) — HQ-R3 is promoted to DR","Verify with show ip ospf interface (State DR, Priority 200) and save the configuration"], why:"Priority first, because each election uses the current priorities. Then vacate the roles above HQ-R3 one at a time; each election for the empty role picks HQ-R3 because its priority is highest. Never clear HQ-R3 itself."},
  {lvl:2, q:"Based on the exhibit from router RTR-B, what is RTR-B's own role on GigabitEthernet0/0?", ex:"RTR-B#show ip ospf neighbor\n\nNeighbor ID     Pri   State           Dead Time   Address         Interface\n192.168.255.1     1   FULL/DROTHER    00:00:36    10.8.0.1        GigabitEthernet0/0\n192.168.255.3     1   FULL/DR         00:00:33    10.8.0.3        GigabitEthernet0/0\n192.168.255.4     1   FULL/DROTHER    00:00:39    10.8.0.4        GigabitEthernet0/0", o:["DR","BDR","DROTHER","It cannot be told from this output"], a:1, why:"Someone else is DR, so RTR-B isn't. RTR-B is FULL with two DROTHERs — a DROTHER would only be 2WAY with them — so RTR-B must be the BDR."},
  {lvl:2, q:"Four routers on one VLAN start at the same moment. R1: priority 1, RID 10.1.1.1. R2: priority 0, RID 10.9.9.9. R3: priority 5, RID 10.2.2.2. R4: priority 5, RID 10.3.3.3. Which are the DR and BDR?", o:["DR R2, BDR R4","DR R4, BDR R3","DR R3, BDR R4","DR R4, BDR R1"], a:1, why:"R2 is out (priority 0) despite the highest RID. R3 and R4 tie on priority 5, so the higher RID wins: R4 DR, R3 BDR. R1's priority of 1 loses to both."},
  {lvl:2, q:"A segment's DR is R1 and its BDR is R2. A new router, R5, with priority 255 is connected and OSPF comes up. Ten minutes later R1 reloads. What are the roles once R1 is back?", o:["R1 DR, R5 BDR","R5 DR, R2 BDR","R2 DR, R5 BDR, R1 DROTHER","R5 DR, R1 BDR"], a:2, why:"R5 joined as a DROTHER (non-preemptive). When R1 failed, the BDR (R2) was promoted to DR and a new BDR was elected — R5, with the highest priority. R1 returns and finds both roles taken, so it is a DROTHER. R5 would become DR only if R2 failed or restarted."},
  {lvl:2, type:"multi", q:"Which two statements about the OSPF point-to-point network type are true? (Choose two.)", o:["No DR or BDR is elected, and neighbours show FULL/  -","It is configured on Ethernet with ip ospf network point-to-point, and should be set at both ends","It changes the hello and dead timers to 30 and 120 seconds","It only works on serial interfaces","Point-to-point routers send their updates to 224.0.0.6"], a:[0,1], why:"Point-to-point skips the election, so neighbours show FULL with a dash. On Ethernet it's configured per interface, and both ends should match. Timers stay 10/40 on Ethernet; serial links default to it but Ethernet can use it too; there's no DR, so 224.0.0.6 has no role."},
  {lvl:2, type:"fill", q:"Seven OSPF routers share one VLAN. How many adjacencies would a full mesh need, and how many exist with a DR and BDR?", fields:[{label:"Full mesh", a:["21"]},{label:"With DR and BDR", a:["11"]}], why:"Full mesh: n(n−1)/2 = 7 × 6 ÷ 2 = 21. With a DR and BDR: the DR is adjacent to the other 6, the BDR to the other 5 apart from the DR = 11, which is 2n − 3."},
  {lvl:2, q:"Based on the exhibit, what should the engineer do?", ex:"R-HUB2#show ip ospf interface g0/0 | include State|Designated|Backup|Count\n  Attached via Network Statement\n  Transmit Delay is 1 sec, State DROTHER, Priority 1\n  Designated Router (ID) 10.0.255.7, Interface address 10.0.50.7\n  Backup Designated router (ID) 10.0.255.6, Interface address 10.0.50.6\n  Neighbor Count is 4, Adjacent neighbor count is 2\n    Adjacent with neighbor 10.0.255.6  (Backup Designated Router)\n    Adjacent with neighbor 10.0.255.7  (Designated Router)", o:["Nothing: a DROTHER is adjacent to the DR and BDR only, so 2 of 4 is correct","Restart OSPF — two neighbours are stuck","Set priority 0 so the counts match","Change the network type to point-to-point"], a:0, why:"With four neighbours, a DROTHER is FULL with the DR and BDR and 2WAY with the other two DROTHERs. Neighbor Count 4, Adjacent 2 is the healthy picture. Point-to-point would break a five-router segment, which needs a DR."},
  {lvl:3, q:"After a change last night, branch users can reach HQ servers but not the payment gateway behind R-PAY. R-HQ and R-PAY share VLAN 99 through a switch. On R-HQ, show ip ospf neighbor lists R-PAY as Pri 0, 2WAY/DROTHER, and show ip ospf interface for VLAN 99 says 'No designated router on this network'. What is the most likely cause?", o:["A hello/dead timer mismatch on VLAN 99","Both routers' VLAN 99 interfaces were set to priority 0, so no DR exists and they can never go past 2WAY","R-PAY's interface is passive","An area mismatch on VLAN 99"], a:1, why:"They see each other (so timers, area and passive are fine — those faults stop the neighbour from appearing at all). With no eligible router there is no DR, and two DROTHERs stop at 2WAY, so no databases are exchanged and R-PAY's networks are never learned. Restore a non-zero priority on one, or make the two-router VLAN point-to-point at both ends."},
  {lvl:3, q:"The bank's standard says the DR on the DC VLAN must be DC-CORE1. Today DC-CORE1 is the BDR and an old router, DC-OLD, is DR. You've set DC-CORE1 to priority 150 and DC-OLD to priority 0. What is the least disruptive way to finish?", o:["clear ip ospf process on DC-CORE1","clear ip ospf process on DC-OLD only, in a maintenance window","Reload every router on the VLAN at once","clear ip ospf process on DC-OLD, then on DC-CORE1"], a:1, why:"DC-CORE1 is already BDR, so vacating the DR role is enough: DC-CORE1 is promoted and a new BDR is elected. Clearing DC-CORE1 would throw away its BDR role; clearing both or reloading everything causes more re-synchronisation than needed."},
  {lvl:3, type:"multi", q:"You are asked why the network team wants ip ospf network point-to-point on the 40 router-to-router metro Ethernet links between a hub and its branches. Which two reasons are correct? (Choose two.)", o:["Adjacencies come up without the broadcast wait timer, so branches recover faster after a circuit flap","No network LSA is created for each link, so the database is smaller","It doubles the usable bandwidth of each circuit","It lets the hello timers differ at the two ends","It makes the hub router the DR on every link"], a:[0,1], why:"Point-to-point removes the election and its wait, and the link is described in the router LSAs instead of a Type 2 network LSA. It does nothing to bandwidth, timers must still match, and there is no DR on a point-to-point link."},
  {lvl:3, q:"Based on the exhibits, an engineer changed only one end of the HQ–BR7 link. What do you expect, and what is the fix?", ex:"R-HQ#show ip ospf neighbor | include Gi0/1\n10.255.7.1        0   FULL/  -        00:00:36    10.0.7.2        GigabitEthernet0/1\n\nR-BR7#show ip ospf neighbor | include Gi0/1\n10.255.0.1        1   FULL/BDR        00:00:31    10.0.7.1        GigabitEthernet0/1\n\nR-BR7#show ip route ospf | include 10.10.0.0\nR-BR7#", o:["Everything is fine because both sides show FULL","The network types don't match (point-to-point on R-HQ, broadcast on R-BR7); the adjacency is up but the routers describe the link differently, so routes are missing. Configure ip ospf network point-to-point on R-BR7 Gi0/1 too","The hello timers differ; set them to 10/40","R-BR7 needs priority 0"], a:1, why:"R-HQ shows FULL with a dash (point-to-point) while R-BR7 shows a BDR role (broadcast). The adjacency can come up because the timers still match, but SPF can't join the two descriptions of the link, and R-BR7 has no route to HQ's LAN. Make both ends point-to-point and verify the routes."},
],
cards:[
  {f:"Why does OSPF elect a DR on a broadcast segment?", b:"To avoid a full mesh of n(n−1)/2 adjacencies and repeated flooding. Everyone syncs with the DR and BDR only: 2n−3 adjacencies, one update = two packets on the segment."},
  {f:"224.0.0.5 vs 224.0.0.6", b:"224.0.0.5 AllSPFRouters: every OSPF router (hellos, the DR's re-floods). 224.0.0.6 AllDRouters: only the DR and BDR (DROTHERs send their updates here)."},
  {f:"DR/BDR election rules", b:"Per segment. Priority 0 is never DR/BDR. Highest priority wins; tie → highest router ID. Highest = DR, next = BDR. Default priority 1, range 0–255."},
  {f:"Non-preemption", b:"A sitting DR keeps the job. A better router joining later becomes DROTHER (or BDR if that role is empty). Raising a priority changes nothing until the next election."},
  {f:"The wait timer", b:"A broadcast interface that comes up listens for the dead interval (40 s, shown as Wait 40) before electing. If hellos name a DR/BDR, it accepts them. So boot order often decides the DR."},
  {f:"The DR fails — what happens?", b:"Once the DR is declared dead (dead interval, 40 s by default), the BDR is promoted to DR at once (it already has the database), a new BDR is elected, and the old DR returns as a DROTHER."},
  {f:"How to move the DR to a chosen router", b:"Set its priority highest. Then clear ip ospf process on the current role-holders: one clear (the DR) if it is BDR, two (DR and BDR) if it is a DROTHER. Never clear the candidate. Maintenance window; save."},
  {f:"FULL or 2WAY on a shared segment?", b:"Any pair that includes the DR or BDR goes FULL. Two DROTHERs stay 2WAY — the normal, finished state."},
  {f:"Key lines of show ip ospf interface", b:"Network Type (BROADCAST/POINT_TO_POINT), State and Priority (your role), Designated Router and Backup lines, Hello/Dead/Wait timers, Neighbor Count vs Adjacent neighbor count."},
  {f:"The priority-0-everywhere trap", b:"No eligible router: 'No designated router on this network', all neighbours 2WAY/DROTHER, Adjacent count 0, no routes across the segment. Fix: no ip ospf priority on one router, or point-to-point if only two routers."},
  {f:"ip ospf network point-to-point", b:"For Ethernet links with exactly two routers. Both ends. No election, no wait timer, no network LSA; neighbours FULL/  -; State POINT_TO_POINT; timers stay 10/40."},
  {f:"Network type mismatch (one end changed)", b:"Timers still match, so the adjacency can come up, but the routers describe the link differently and routes go missing. Configure both ends the same and check the routes."},
  {f:"Does traffic go through the DR?", b:"No. The DR only coordinates database flooding. Packets go straight to the next-hop router SPF chooses, even between two DROTHERs."},
],
});
// ---------- Module 5 · Lesson 6 ----------
L.push({
id:"ospf-tshoot", mins:95, level:"Beginner+ · builds on Module 5 lessons 1–5",
t:"OSPF cost, path choice and troubleshooting adjacencies (incl. a first look at multi-area)",
html:`
${K.goals([
  "Calculate OSPF interface and path costs by hand and predict where traffic goes.",
  "Fix &ldquo;every fast link costs 1&rdquo; with <code>auto-cost reference-bandwidth</code>, steer traffic with <code>bandwidth</code> and <code>ip ospf cost</code>, and prove it with traceroute.",
  "Recognise ECMP in <code>show ip route</code> and explain what the router does with it.",
  "Diagnose a missing OSPF neighbour from the log or show line that proves the fault, and fix the right end.",
  "Explain why OSPF uses areas, what an ABR does, and what <code>O IA</code> and a Summary LSA are.",
])}
${K.pre(["Module 5 lessons 1–5: the routing table (AD, metric, longest match), static routes, how OSPF thinks, configuring single-area OSPF (network statements, router IDs, passive interfaces) and DR/BDR.","Module 4 lesson 7: <code>show logging</code> and comparing both ends of a link."])}

<h2>Why this matters at work</h2>
<p>An MSP in Wuse, Abuja, supports a microfinance bank that bought 1 Gb/s MainOne fibre and kept its old 100 Mb/s links as backup — yet tellers in two branches say core banking &ldquo;freezes&rdquo; every afternoon. The routing table shows why: OSPF thinks both links are equally good and shares traffic between them.</p>
<p>The same week a contractor swaps the Kano router: it pings HQ but never appears in <code>show ip ospf neighbor</code>. Both are everyday OSPF work — <b>why traffic takes its path</b> and <b>why routers refuse to become neighbours</b>. This lesson gives the rule for each, the evidence for each fault, and a first look at multi-area OSPF.</p>

<h2>How OSPF prices a link: cost and the reference bandwidth</h2>
<p>Within one protocol the lower metric wins (lesson 1). ${K.g("OSPF","Open Shortest Path First, the link-state protocol from lessons 3–5.")}'s metric is ${K.g("cost","OSPF's metric: every OSPF interface has one; a path's cost is the sum along it. Lower is better.")}.</p>
${K.remember(`<b>The cost rule.</b> Interface cost = <b>reference bandwidth ÷ interface bandwidth</b>, fraction dropped, never below 1. Path cost = the sum of the interfaces the packet <b>leaves</b> through, including the last router's interface onto the destination subnet. Lowest total wins; a tie installs both paths.`)}
<p><b>Why bandwidth?</b> Hop-count protocols such as RIP prefer two slow hops to three fast ones. Every router knows its interfaces' bandwidth, so OSPF uses it: faster link, smaller number.</p>
${K.analogy(`<p>A van driver crossing Lagos gives each road a &ldquo;minutes&rdquo; value and takes the smallest total, not the fewest turns. OSPF does the same with cost.</p>`)}
<h3>The formula with real numbers</h3>
<p>The ${K.g("reference bandwidth","A value in the OSPF process (default 100 Mb/s) divided by each interface's bandwidth to get its cost.")} defaults to <b>100 Mb/s</b>. The interface bandwidth is the <code>BW</code> value in <code>show interfaces</code> (the line speed, unless changed).</p>
<div class="tablewrap"><table>
<tr><th>Interface</th><th>Reference 100 (default)</th><th>Reference 10,000</th><th>Reference 100,000</th></tr>
<tr><td>10 Mb/s</td><td><b>10</b></td><td><b>1000</b></td><td><b>10000</b></td></tr>
<tr><td>100 Mb/s</td><td><b>1</b></td><td><b>100</b></td><td><b>1000</b></td></tr>
<tr><td>1 Gb/s</td><td>0.1 → <b>1</b></td><td><b>10</b></td><td><b>100</b></td></tr>
<tr><td>10 Gb/s</td><td>0.01 → <b>1</b></td><td><b>1</b></td><td><b>10</b></td></tr>
<tr><td>40 Gb/s</td><td><b>1</b></td><td>0.25 → <b>1</b></td><td>2.5 → <b>2</b></td></tr>
</table></div>
<p>Look at the default column: <b>every link of 100 Mb/s or faster costs 1</b>. A 100 Mb/s copper link, a gigabit fibre and a 10 Gb/s core link look identical, so OSPF is effectively counting hops — exactly the bank's problem.</p>
${K.dyk(`IOS drops the fraction instead of rounding. A T1 line (1.544 Mb/s) gives 100 ÷ 1.544 = 64.77, so its cost is <b>64</b> — a number you'll still see in old exam questions.`)}
<h3>The fix: a bigger reference, on every router</h3>
${K.out(`HQ(config)#router ospf 1
HQ(config-router)#auto-cost reference-bandwidth 10000
% OSPF: Reference bandwidth is changed.
        Please ensure reference bandwidth is consistent across all routers.
HQ(config-router)#end
HQ#show ip ospf | include Reference
 Reference bandwidth unit is 10000 mbps`, "The value is in Mb/s: 10000 = 10 Gb/s. IOS warns at once that every router must match.")}
<p>Choose at least your fastest link speed (10000 or 100000 are common). Why the same everywhere? Each router costs <b>its own</b> interfaces and advertises them. If HQ uses 10000 and a branch still uses 100, HQ's gigabit links say 10 and the branch's say 1, so paths through the forgotten routers look ten times cheaper and attract traffic. Nothing loops; routing is simply wrong.</p>
${K.mistake(`Changing the reference bandwidth on the router you're logged into and stopping there. Change it on every router in one window, and check each with <code>show ip ospf | include Reference</code>.`)}
<h3>Two per-interface levers</h3>
<ul>
<li><code>bandwidth 100000</code> tells IOS the interface's bandwidth is 100,000 <b>Kbit/s</b>. It doesn't change the port's real speed — only the number OSPF (and other features) divide by. Use it when the port lies about the circuit: a radio or ISP handoff on a gigabit port that carries only 100 Mb/s.</li>
<li><code>ip ospf cost 50</code> sets the cost to exactly 50 and ignores the formula. Use it for policy (&ldquo;this is the backup&rdquo;) or a design document's fixed costs.</li>
</ul>
${K.out(`LEKKI(config)#interface g0/2
LEKKI(config-if)#bandwidth 100000
LEKKI(config-if)#interface g0/1
LEKKI(config-if)#ip ospf cost 50
LEKKI(config-if)#end
LEKKI#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/1        1     0               10.0.13.2/30       50    DR    1/1
Gi0/2        1     0               10.0.34.1/30       100   BDR   1/1`, "Reference 10000. Gi0/2: 10,000 ÷ 100 Mb/s = 100 from the formula. Gi0/1: fixed at 50 by ip ospf cost.")}
<p>The brief shows every cost at once: interface, process ID, area, address/prefix, <b>Cost</b>, DR/BDR state, and <b>Nbrs F/C</b> (FULL / all neighbours). <code>show ip ospf interface g0/2</code> gives one interface in detail.</p>
${K.when([
  ["<code>auto-cost reference-bandwidth</code>","Links faster than 100 Mb/s (nearly always)","Puts every link on one sensible scale","You can't change every router in one window"],
  ["<code>bandwidth</code> (Kbit/s)","Port speed isn't circuit speed (sub-rate circuit, radio)","The formula uses the truth","You only want policy steering"],
  ["<code>ip ospf cost</code>","Backup paths, maintenance steering, fixed design costs","Exact and obvious","The scale is still wrong — fix that first"],
], "Changing OSPF cost — which lever")}
${K.exam(`Cost traps: the default reference is <b>100 Mb/s</b> (so gigabit = 1); <code>bandwidth</code> is in <b>Kbit/s</b> but the reference is in <b>Mb/s</b>; fractions are dropped, minimum 1.`)}
<h3>Practise: set the scale on ABJ-EDGE</h3>
<p>G0/0 is a 1 Gb/s LAN, G0/1 a gigabit ISP handoff carrying a 200 Mb/s circuit, G0/2 a 100 Mb/s link. The company's new standard reference is 40,000 Mb/s (a 40 Gb/s core). Predict each cost before you look.</p>
${K.hint(`40,000 ÷ 1,000 = 40; 40,000 ÷ 100 = 400; <code>bandwidth 200000</code> = 200 Mb/s, so 40,000 ÷ 200 = 200 — until <code>ip ospf cost</code> overrides it. Reference bandwidth goes under <code>router ospf 1</code>, the others under <code>interface g0/1</code>.`)}
${K.term({env:"ios2", title:"OSPF costs on ABJ-EDGE", opts:{kind:"router", host:"ABJ-EDGE", model:"ISR 1100"},
  setup:env=>{ ["enable","configure terminal","interface g0/0","description LAN 1G","ip address 10.20.0.1 255.255.255.0","no shutdown","interface g0/1","description ISP handoff 1G - 200M circuit","ip address 10.0.50.1 255.255.255.252","no shutdown","interface g0/2","description Link to ABJ-CORE 100M","ip address 10.0.60.1 255.255.255.252","speed 100","no shutdown","router ospf 1","router-id 10.255.20.1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end","disable"].forEach(c=>env.exec(c)); env.history.length = 0; env.log.length = 0; },
  intro:"Start with <code>enable</code>, then <code>show ip ospf interface brief</code> to see the costs before you change anything.",
  tasks:[
    {text:"<code>enable</code>, then <code>show ip ospf interface brief</code>: every cost is 1 — even G0/2, which runs at 100 Mb/s while the others run at 1 Gb/s. That's the default reference bandwidth (100 Mb/s) at work", done:e=>e.log.some(l=>/Gi0\/2\s+1\s+0\s+10\.0\.60\.1\/30\s+1\s/.test(l.out))},
    {text:"Set the new company standard: reference bandwidth 40000 (Mb/s) in OSPF process 1, and read the warning IOS prints", done:e=>!!e.ospf && e.ospf.refBw===40000},
    {text:"Check your prediction with <code>show ip ospf interface brief</code>: G0/0 (1 Gb/s) should be 40 and G0/2 (100 Mb/s) should be 400", done:e=>e.log.some(l=>/Gi0\/0\s+1\s+0\s+10\.20\.0\.1\/24\s+40\s/.test(l.out) && /Gi0\/2\s+1\s+0\s+10\.0\.60\.1\/30\s+400\s/.test(l.out))},
    {text:"G0/1 is a gigabit port, but the ISP circuit behind it is only 200 Mb/s: tell IOS the truth with <code>bandwidth 200000</code> (Kbit/s) on G0/1", done:e=>e.intfs["GigabitEthernet0/1"].bw===200000},
    {text:"The design document fixes the ISP link at cost 250 whatever its bandwidth: add <code>ip ospf cost 250</code> on G0/1, then show that the brief now says 250 for G0/1 (the fixed cost beats the formula)", done:e=>e.intfs["GigabitEthernet0/1"].ospfCost===250 && e.log.some(l=>/Gi0\/1\s+1\s+0\s+10\.0\.50\.1\/30\s+250\s/.test(l.out))},
    {text:"Prove the process setting with <code>show ip ospf | include Reference</code> (it should say 40000 mbps)", done:e=>e.log.some(l=>/Reference bandwidth unit is 40000 mbps/.test(l.out))},
    {text:"Save the configuration", done:e=>e.savedOnce},
  ],
  win:"You fixed OSPF's scale (40 Gb/s reference: 1 Gb/s = 40, 100 Mb/s = 400), described a sub-rate circuit with bandwidth, and overrode the formula with ip ospf cost — the three cost levers, each used for its proper job.",
  solve:["enable","show ip ospf interface brief","configure terminal","router ospf 1","auto-cost reference-bandwidth 40000","end","show ip ospf interface brief","configure terminal","interface g0/1","bandwidth 200000","ip ospf cost 250","end","show ip ospf interface brief","show ip ospf | include Reference","write memory"]})}
${K.check({q:"With the default reference bandwidth, what cost do a 100 Mb/s and a 10 Gb/s interface get?", o:["100 and 1","1 and 0.01","1 and 1","10 and 1"], a:2, why:"100 ÷ 100 = 1, and 100 ÷ 10,000 = 0.01, which can't go below 1. OSPF can't tell them apart."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A data-centre team uses auto-cost reference-bandwidth 100000. Work out each interface cost.", fields:[{label:"A 25 Gb/s interface", a:["4"]},{label:"A 1 Gb/s interface", a:["100"]},{label:"A 1 Gb/s port with bandwidth 50000", a:["2000"]},{label:"A 400 Gb/s interface", a:["1"]}], why:"1. Asked: four costs. 2. Rule: reference ÷ bandwidth, same units, fraction dropped, minimum 1. 3. Apply: 100,000 ÷ 25,000 = 4; ÷ 1,000 = 100; bandwidth 50000 Kbit/s = 50 Mb/s, so 2000; ÷ 400,000 = 0.25 → 1."})}

<h2>Adding up a path: costs by hand, ECMP and steering traffic</h2>
${K.remember(`<b>Count only the way out.</b> From the router you're asking about, add each outgoing interface along the path, ending with the last router's interface <b>onto the destination subnet</b>. Never add an arrival interface — so A→B can cost differently from B→A.`)}
<p>Why? Each router's LSAs describe its own links with its own cost for leaving through each; ${K.g("SPF","Shortest Path First (Dijkstra's algorithm), run by each OSPF router on its database.")} builds the map from those, and the destination subnet is described by the router attached to it — so the last interface counts.</p>
<h3>Worked example: two paths across an Abuja campus</h3>
<p>ABJ-A wants the server LAN <code>172.30.5.0/24</code> on ABJ-D: via ABJ-B, whose link to A is an old 100 Mb/s run, or via ABJ-C, all gigabit.</p>
${K.svg("0 0 720 300",
  K.dev("router",90,150,"ABJ-A","10.255.30.1")+K.dev("router",340,60,"ABJ-B","")+K.dev("router",340,245,"ABJ-C","")+K.dev("router",560,150,"ABJ-D","")+
  K.dev("server",670,150,"server LAN","172.30.5.0/24")+
  K.link(110,138,320,70,"100 Mb/s")+K.link(360,70,540,138,"1 Gb/s")+K.link(110,162,320,236,"1 Gb/s")+K.link(360,236,540,162,"1 Gb/s")+K.link(584,150,652,150,"1 Gb/s")+
  K.box(220,120,240,62,"ref 100: 1+1+1 = 3 on both paths (tie)","ref 10000: via B 100+10+10 = 120 · via C 30",true)+
  K.txt(360,295,"only outgoing interfaces count — A → D",{c:"accent",s:10.5,mid:true}),
  "Default reference: both paths cost 3 and traffic is shared, slow link included. Reference 10000: the path via ABJ-C (30) wins.")}
${K.steps([
  ["List the paths", "A → B → D → LAN, and A → C → D → LAN."],
  ["List the outgoing interfaces", "Path 1: A→B (100 Mb/s), B→D, D onto the LAN. Path 2: A→C, C→D, D onto the LAN. Arrival interfaces don't count."],
  ["Cost them at reference 100", "Everything is ≥100 Mb/s, so 1 each. Both paths = 3: a tie, so OSPF installs both (ECMP)."],
  ["Recost at reference 10000 (all four routers)", "A's 100 Mb/s interface = 100, gigabit = 10. Path 1 = 100 + 10 + 10 = 120; path 2 = 10 + 10 + 10 = 30."],
  ["Predict, then verify", "Expect <code>[110/30] via</code> ABJ-C's address, and a traceroute whose first hop is ABJ-C."],
])}
${K.out(`ABJ-A#show ip route ospf
...
      172.30.0.0/16 is variably subnetted, 7 subnets, 3 masks
O        172.30.0.8/30 [110/2] via 172.30.0.2, 00:43:18, GigabitEthernet0/1
O        172.30.0.12/30 [110/2] via 172.30.0.6, 00:36:01, GigabitEthernet0/2
O        172.30.5.0/24 [110/3] via 172.30.0.2, 00:33:18, GigabitEthernet0/1
                       [110/3] via 172.30.0.6, 00:33:18, GigabitEthernet0/2
ABJ-A#show ip route 172.30.5.0 | include from|share
  Last update from 172.30.0.2 on GigabitEthernet0/1, 00:33:18 ago
  * 172.30.0.2, from 10.255.30.4, 00:33:18 ago, via GigabitEthernet0/1
      Route metric is 3, traffic share count is 1
    172.30.0.6, from 10.255.30.4, 00:33:18 ago, via GigabitEthernet0/2
      Route metric is 3, traffic share count is 1`, "Before: two next hops at [110/3] — the indented line is the second equal path. Equal 'traffic share count' means share equally; 'from 10.255.30.4' is ABJ-D, which advertised the LAN.")}
${K.out(`ABJ-A#show ip route ospf | include 172.30.5
O        172.30.5.0/24 [110/30] via 172.30.0.6, 00:33:18, GigabitEthernet0/2
ABJ-A#traceroute 172.30.5.10
Type escape sequence to abort.
Tracing the route to 172.30.5.10
VRF info: (vrf in name/id, vrf out name/id)
  1 172.30.0.6 1 msec 2 msec 1 msec
  2 172.30.0.14 2 msec 1 msec 2 msec
  3 172.30.5.10 1 msec 2 msec 3 msec`, "After reference 10000 on all four routers: one path, metric 30, via ABJ-C — and the traceroute's first hop proves it.")}
<h3>ECMP: what the router does with a tie</h3>
<p>Equal lowest costs give ${K.g("ECMP","Equal-Cost Multi-Path: several next hops installed for one prefix because they tie on cost.")}: IOS OSPF installs up to four by default (<code>Maximum path: 4</code> in <code>show ip protocols</code>). ${K.g("CEF","Cisco Express Forwarding, IOS's forwarding engine; by default it load-shares per flow, choosing the path from a hash of the source and destination addresses.")} shares traffic <b>per flow</b>, so one conversation stays on one path. That's why one traceroute shows one path — and why ECMP over unequal links hurts: flows that land on the slow link are slow every time.</p>
${K.tip(`ECMP over two identical 10 Gb/s uplinks is great: double capacity, instant failover. ECMP over links that only <i>look</i> equal is a fault. When you see two next hops, ask whether the links really are the same.`)}
<h3>Steering traffic — one end moves one direction</h3>
<p>To move traffic off a path, raise an outgoing cost on it above the alternative. Raise HQ's cost towards a branch and HQ's traffic moves, but the replies leave through the branch's unchanged interface and return the old way: ${K.g("asymmetric routing","Traffic going one way and returning another. Legal, but confusing to troubleshoot, and stateful firewalls in the path drop the half-conversations they see.")}.</p>
${K.mistake(`Steering with <code>ip ospf cost</code> on one router and testing only from that side. Traceroute from <b>both</b> ends, and change both ends if both directions must move.`)}
${K.exam(`<b>How to read any routing question.</b> 1. What exactly is asked — which router, which destination, which direction? 2. Which rule decides — longest match, then AD between sources, then metric within a protocol? 3. Work it through: list the paths, list the <i>outgoing</i> interfaces, cost each at the stated reference, add up. Distractors are usually the hop-count answer, the answer that adds an arrival interface, or the one that forgets the 100 Mb/s default.`)}
<h3>Hands-on: engineer the Ikeja path</h3>
<p>A different network: Ikeja reaches the HQ payroll server via Yaba (1 Gb/s fibre) or via Lekki, whose hop to Ikeja is a radio with a gigabit port and a 100 Mb/s licence. Payroll uploads are &ldquo;sometimes fine, sometimes slow&rdquo;. Find out why, fix the scale, then move traffic off the fibre for tonight's maintenance — both directions, nothing shut down.</p>
${K.bench({id:"m5-ospf-cost", points:90, from:"CCNA · Module 5 · lesson 6", title:"cost engineering — make the radio a backup, then steer around the fibre", viewBox:"0 0 900 440",
  intro:"Console cable starts on HQ (9600 8N1, no flow control). To reach another router, unplug it at the laptop USB and plug a console cable into that router's CON port. No passwords. Links: HQ–Yaba 10.0.12.0/30 · Yaba–Ikeja 10.0.24.0/30 (fibre) · HQ–Lekki 10.0.13.0/30 · Lekki G0/2–Ikeja G0/2 10.0.34.0/30 (the radio). All area 0, default reference bandwidth.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"srv", kind:"server", label:"SRV-PAY", x:20, y:200, ip:"10.10.0.20", mask:"255.255.255.0", gw:"10.10.0.1"},
    {id:"hq", kind:"router", label:"HQ", model:"ISR 4331 · HQ", x:160, y:200, config:e=>{ ["en","conf t","hostname HQ","interface g0/0","description LAN - payroll servers","ip address 10.10.0.1 255.255.255.0","no shutdown","interface g0/1","description Fibre to YABA","ip address 10.0.12.1 255.255.255.252","no shutdown","interface g0/2","description Fibre to LEKKI","ip address 10.0.13.1 255.255.255.252","no shutdown","router ospf 1","router-id 10.255.0.1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"yb", kind:"router", label:"YABA", model:"ISR 1100 · fibre PoP", x:400, y:40, config:e=>{ ["en","conf t","hostname YABA","interface g0/1","description Fibre to HQ","ip address 10.0.12.2 255.255.255.252","no shutdown","interface g0/2","description Fibre to IKEJA","ip address 10.0.24.1 255.255.255.252","no shutdown","router ospf 1","router-id 10.255.0.2","network 10.0.0.0 0.255.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lk", kind:"router", label:"LEKKI", model:"ISR 1100 · radio PoP", x:400, y:340, config:e=>{ ["en","conf t","hostname LEKKI","interface g0/1","description Fibre to HQ","ip address 10.0.13.2 255.255.255.252","no shutdown","interface g0/2","description Microwave to IKEJA - 100M licence","ip address 10.0.34.1 255.255.255.252","no shutdown","router ospf 1","router-id 10.255.0.3","network 10.0.0.0 0.255.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"ik", kind:"router", label:"IKEJA", model:"ISR 1100 · branch", x:640, y:200, config:e=>{ ["en","conf t","hostname IKEJA","interface g0/0","description Branch LAN","ip address 10.40.0.1 255.255.255.0","no shutdown","interface g0/1","description Fibre to YABA","ip address 10.0.24.2 255.255.255.252","no shutdown","interface g0/2","description Microwave to LEKKI - 100M licence","ip address 10.0.34.2 255.255.255.252","no shutdown","router ospf 1","router-id 10.255.0.4","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pc", kind:"pc", label:"IKJ-PC", x:760, y:320, ip:"10.40.0.10", mask:"255.255.255.0", gw:"10.40.0.1"},
  ],
  cables:[ {type:"cat6", a:"hq:g1", b:"yb:g1"}, {type:"cat6", a:"yb:g2", b:"ik:g1"}, {type:"cat6", a:"hq:g2", b:"lk:g1"}, {type:"cat6", a:"lk:g2", b:"ik:g2"},
           {type:"cat6", a:"srv:eth", b:"hq:g0"}, {type:"cat6", a:"pc:eth", b:"ik:g0"}, {type:"console", a:"lap:usb", b:"hq:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"<b>Find the evidence.</b> On HQ, <code>show ip route ospf</code>: the Ikeja LAN <code>10.40.0.0/24</code> has <b>two</b> next hops at the same cost — ECMP over the fibre <i>and</i> the radio. Work out on paper why both cost 3", done:B=>B.devs.hq.env.log.some(l=>/10\.40\.0\.0\/24 \[110\/3\] via 10\.0\.12\.2[^\n]*\n\s+\[110\/3\] via 10\.0\.13\.2/.test(l.out))},
    {text:"From IKJ-PC, <code>tracert 10.10.0.20</code>. You see only one of the two paths: ECMP shares per flow, so one conversation stays on one path", done:B=>Bench.traced(B,"pc","10.10.0.20")},
    {text:"<b>Tell OSPF the radio's real speed.</b> On Lekki G0/2 and on Ikeja G0/2 (both ends of the radio), set <code>bandwidth 100000</code> (100 Mb/s in Kbit/s). Then on Lekki run <code>show ip ospf interface brief</code>: G0/2 still costs 1. That's the 100 Mb/s problem — the default reference can't go lower", done:B=>B.devs.lk.env.intfs["GigabitEthernet0/2"].bw===100000 && B.devs.ik.env.intfs["GigabitEthernet0/2"].bw===100000 && B.devs.lk.env.log.some(l=>/10\.0\.34\.1\/30\s+1\s/.test(l.out))},
    {text:"<b>Fix the scale everywhere.</b> Set <code>auto-cost reference-bandwidth 10000</code> on all four routers (HQ, Yaba, Lekki, Ikeja)", done:B=>["hq","yb","lk","ik"].every(r=>B.devs[r].env.ospf && B.devs[r].env.ospf.refBw===10000)},
    {text:"<b>Prove it.</b> On HQ, <code>show ip route ospf</code> now shows 10.40.0.0/24 with <b>one</b> next hop, via Yaba (10.0.12.2), at <code>[110/30]</code>. Check the 30 by hand: which three outgoing interfaces?", done:B=>{ const r = Bench.route(B,"hq","10.40.0.0/24","O"); return !!r && r.metric===30 && r.via.length===1 && r.via[0]==="10.0.12.2" && B.devs.hq.env.log.some(l=>/10\.40\.0\.0\/24 \[110\/30\] via 10\.0\.12\.2/.test(l.out)); }},
    {text:"<b>Maintenance tonight on the Yaba fibre.</b> First change HQ only: on HQ G0/1 set <code>ip ospf cost</code> to the <b>smallest whole number</b> that makes HQ→Ikeja via Yaba cost more than via Lekki (equal would give ECMP again). Then <code>tracert 10.40.0.10</code> from SRV-PAY and <code>tracert 10.10.0.20</code> from IKJ-PC: the two directions now take different paths", done:B=>{ const h = B.devs.hq.env.intfs["GigabitEthernet0/1"].ospfCost, k = B.devs.ik.env.intfs["GigabitEthernet0/1"].ospfCost; return h>100 && !(k>100) && Bench.routeVia(B,"hq","10.40.0.10")==="10.0.13.2" && Bench.routeVia(B,"ik","10.10.0.20")==="10.0.24.1" && Bench.traced(B,"srv","10.40.0.10") && Bench.traced(B,"pc","10.10.0.20"); }},
    {text:"<b>Finish the job.</b> Do the same on Ikeja G0/1 so the branch's traffic to HQ also avoids Yaba, then <code>tracert 10.10.0.20</code> from IKJ-PC again: the second hop is now Lekki (10.0.34.1). Nothing may be shut down", done:B=>{ const ok = ["hq","yb","lk","ik"].every(r=>["GigabitEthernet0/1","GigabitEthernet0/2"].every(n=>!B.devs[r].env.intfs[n].shut)); return ok && B.devs.ik.env.intfs["GigabitEthernet0/1"].ospfCost>100 && B.devs.hq.env.intfs["GigabitEthernet0/1"].ospfCost>100 && Bench.routeVia(B,"ik","10.10.0.20")==="10.0.34.1" && Bench.routeVia(B,"hq","10.40.0.10")==="10.0.13.2" && Bench.traced(B,"pc","10.10.0.20"); }},
    {text:"Save the configuration on all four routers", done:B=>["hq","yb","lk","ik"].every(r=>B.devs[r].env.savedOnce)},
  ],
  win:"You found ECMP hiding a slow radio link, proved the default reference bandwidth was the cause, fixed the scale on every router, described the sub-rate radio with bandwidth, then used ip ospf cost to move traffic — and saw for yourself that cost only steers the direction you change.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route ospf"],
    ["pc","pc","tracert 10.10.0.20"],
    ["unplug","lap:usb"],["plug","console","lap:usb","lk:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/2"],["term","bandwidth 100000"],["term","end"],["term","show ip ospf interface brief"],
    ["term","configure terminal"],["term","router ospf 1"],["term","auto-cost reference-bandwidth 10000"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","ik:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/2"],["term","bandwidth 100000"],["term","router ospf 1"],["term","auto-cost reference-bandwidth 10000"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","yb:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","router ospf 1"],["term","auto-cost reference-bandwidth 10000"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","hq:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","router ospf 1"],["term","auto-cost reference-bandwidth 10000"],["term","end"],["term","show ip route ospf"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ip ospf cost 101"],["term","end"],["term","write memory"],
    ["pc","srv","tracert 10.40.0.10"],["pc","pc","tracert 10.10.0.20"],
    ["unplug","lap:usb"],["plug","console","lap:usb","ik:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/1"],["term","ip ospf cost 101"],["term","end"],["term","write memory"],
    ["pc","pc","tracert 10.10.0.20"]]})}
${K.hint(`At reference 10000, HQ → Ikeja LAN via Lekki = HQ G0/2 (10) + Lekki G0/2 (100) + Ikeja G0/0 (10) = 120. Via Yaba = X + 10 + 10. You need X + 20 &gt; 120, so X = 101. Check the other direction the same way from Ikeja.`, "Hint: working out the cost")}
<p>What you saw: <code>bandwidth</code> alone changed nothing; the new reference made the radio cost 100 and dropped it from the table; cost 101 on HQ alone moved only HQ's direction (asymmetric routing) until Ikeja changed too.</p>
${K.check({q:"R1 reaches a LAN through R2 and R3. R1's outgoing interface costs 10, R2's interface facing R1 costs 50, R2's interface towards R3 costs 10, and R3's LAN interface costs 1. What is R1's metric?", o:["71","21","61","11"], a:1, why:"Outgoing only: 10 + 10 + 1 = 21. R2's interface facing R1 is where packets arrive; its 50 only counts for traffic going the other way."})}
<h3>Same logic, new situation</h3>
${K.hint(`Reference 100000: 10 Gb/s = 10, 1 Gb/s = 100. Outgoing interfaces only.`)}
${K.reveal(`Port Harcourt plant: PH-W reaches the ${K.g("SCADA","Supervisory Control and Data Acquisition: the systems that monitor and control industrial plant.")} LAN on PH-Z via PH-X (two 10 Gb/s hops) or PH-Y (1 Gb/s then 10 Gb/s). Z's LAN port is 10 Gb/s; reference 100000 everywhere. Which path wins, at what metric — and what if W's interface towards X gets ip ospf cost 5?`,`<p><b>1. Asked:</b> best path, its metric, the effect of one change. <b>2. Rule:</b> lowest sum of outgoing costs. <b>3. Apply:</b> via X = 10 + 10 + 10 = <b>30</b>; via Y = 100 + 10 + 10 = 120. Via X wins at 30.</p>
<p><b>4. The change:</b> via X becomes 5 + 10 + 10 = 25. The route stays; only the metric changes — lowering a cost on the best path never pushes traffic away (you'd need more than 100 there). Z-to-W traffic is untouched: W's interface only counts for packets leaving W.</p>`)}

<h2>Why neighbours won't form: the adjacency checklist and its evidence</h2>
<p>Cost only chooses between neighbours. Routers find each other with ${K.g("hellos","Small OSPF packets sent every hello interval to 224.0.0.5, carrying the settings both ends must agree on.")} to <code>224.0.0.5</code> (lesson 3); an ${K.g("adjacency","A neighbour relationship that reached FULL: the two databases are synchronised.")} is a neighbour that reached FULL.</p>
${K.remember(`<b>The adjacency rule.</b> Two routers become neighbours only if each <b>receives</b> the other's hellos and the hellos <b>agree</b>: same <b>area</b>, same <b>subnet and mask</b>, same <b>hello and dead timers</b>, and <b>different router IDs</b>. A <b>passive</b> interface sends no hellos. Real networks add <b>network type</b>, <b>authentication</b> and <b>MTU</b>.<br><b>&ldquo;A Smart Hello Really Pays&rdquo;</b> — Area, Subnet, Hello/dead, Router ID, Passive — then the real-world three: Network type, Authentication, MTU (&ldquo;Never Assume the MTU&rdquo;).`)}
<p><b>Why each check exists:</b> an area is one shared map, so a link can't belong to two; neighbours must share a link, and on Ethernet the masks must match exactly; the ${K.g("dead interval","Time without a hello before a neighbour is declared down: 40 s by default (4 × the 10 s hello).")} is a promise both ends must agree on; the ${K.g("router ID","The unique 32-bit name of an OSPF router in every LSA, written like an IPv4 address.")} names the router in every LSA, so duplicates overwrite each other; a ${K.g("passive interface","An OSPF interface that sends no hellos but whose subnet is still advertised (lesson 4).")} is silent on purpose — right on a user LAN, a fault on a router link.</p>
${K.svg("0 0 720 300",
  K.dev("router",70,150,"WAN-A","Gi0/0 .1/30")+K.dev("router",650,150,"WAN-B","Gi0/0 .2/30")+
  K.link(94,150,196,150,"")+K.link(524,150,626,150,"")+
  K.box(200,18,320,264,"","",true)+
  K.txt(360,40,"OSPF hello (to 224.0.0.5)",{c:"fg",s:12.5,mid:true,f:"display",b:true})+
  K.band(216,54,288,24,"Router ID — must be DIFFERENT")+
  K.band(216,84,288,24,"Area ID — must match")+
  K.band(216,114,288,24,"Subnet mask — must match (broadcast)")+
  K.band(216,144,288,24,"Hello interval — must match")+
  K.band(216,174,288,24,"Dead interval — must match")+
  K.band(216,204,288,24,"Authentication — must match")+
  K.band(216,234,288,24,"Priority, DR, BDR — may differ")+
  K.txt(360,276,"Passive: no hello is sent at all · MTU is checked later",{c:"warn",s:10.5,mid:true}),
  "The hello's fields and which must agree. A passive interface never sends it; MTU only matters later, in the database exchange.")}
<h3>The evidence for each check</h3>
<p>Each fault leaves a fingerprint: two are <b>logged</b>, the rest are <b>silent</b> and show only when you compare both ends.</p>
<div class="tablewrap"><table>
<tr><th>Check</th><th>Logged?</th><th>Evidence</th><th>Fix</th></tr>
<tr><td>Up, OSPF on it</td><td>—</td><td>up/up in <code>show ip interface brief</code>; listed in <code>show ip ospf interface brief</code></td><td>Fix the <code>network</code> statement</td></tr>
<tr><td>Same area</td><td><b>Yes</b></td><td><code>%OSPF-4-ERRRCV ... mismatched area ID</code>; Area column differs</td><td>Fix the wrong end</td></tr>
<tr><td>Same subnet/mask</td><td>No</td><td>Prefix lengths differ (/30 vs /29)</td><td>Correct the mask</td></tr>
<tr><td>Hello/dead match</td><td>No</td><td>The <code>Timer intervals ... Hello 10, Dead 40</code> line of <code>show ip ospf interface</code> differs</td><td><code>no ip ospf hello-interval</code> on the odd end</td></tr>
<tr><td>Unique router IDs</td><td><b>Yes</b></td><td><code>%OSPF-4-DUP_RTRID_NBR</code></td><td><code>router-id</code>, then <code>clear ip ospf process</code></td></tr>
<tr><td>Not passive</td><td>No</td><td><code>Passive Interface(s):</code> in <code>show ip protocols</code></td><td><code>no passive-interface &lt;if&gt;</code></td></tr>
<tr><td>Up/down events</td><td><b>Yes</b></td><td>${K.g("ADJCHG","Adjacency change: the log message OSPF writes when a neighbour reaches FULL or goes down, with the reason.")}: <code>%OSPF-5-ADJCHG ... to FULL</code> or <code>... to DOWN</code> with the reason</td><td>—</td></tr>
</table></div>
<h3>Area mismatch (logged)</h3>
${K.out(`WAN-A#show logging | include OSPF
*Oct 11 10:14:07.137: %OSPF-4-ERRRCV: Received invalid packet: mismatched area ID from 172.16.9.2, GigabitEthernet0/0
WAN-B#show logging | include OSPF
*Oct 11 10:14:09.512: %OSPF-4-ERRRCV: Received invalid packet: mismatched area ID, from backbone area must be virtual-link but not found from 172.16.9.1, GigabitEthernet0/0
WAN-B#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     10              172.16.9.2/30      1     DR    0/0`, "WAN-A's end is area 0, WAN-B's end of the same /30 is area 10. Each log names the sender and the receiving interface. Nbrs F/C 0/0: no neighbour.")}
<p>Read it in parts: OSPF, severity 4, ERRRCV (error received), <code>mismatched area ID</code> (the fault), <code>from 172.16.9.2, GigabitEthernet0/0</code> (who, where). The longer line appears on the end whose interface is <b>not</b> in area 0 when the rejected hello came <b>from</b> area 0: the only legal way an area-0 packet can arrive on a non-backbone interface is over a ${K.g("virtual link","An OSPF tunnel that joins a distant area to area 0 through another area. An advanced feature, not CCNA.")}, so IOS reports that it looked for one and found none. Treat it as a clue to which end is area 0, not as advice to build a virtual link. The labs print the two wordings the same way. Fix the wrong end:</p>
${K.out(`WAN-B(config)#router ospf 1
WAN-B(config-router)#no network 172.16.9.0 0.0.0.3 area 10
WAN-B(config-router)#network 172.16.9.0 0.0.0.3 area 0`, "Remove the statement with the wrong area and add it back with the right one.")}
<h3>Hello or dead mismatch (silent)</h3>
${K.out(`WAN-A#show ip ospf interface g0/0 | include Timer
  Timer intervals configured, Hello 5, Dead 20, Wait 20, Retransmit 5
WAN-B#show ip ospf interface g0/0 | include Timer
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
WAN-A#show logging | include OSPF
WAN-A#`, "ip ospf hello-interval 5 on WAN-A; the dead interval followed (4 × 5). The lines differ; the log is empty.")}
<p>The mismatch can be in either number: <code>Hello 10, Dead 30</code> against <code>Hello 10, Dead 40</code> fails too. Fix it with <code>no ip ospf hello-interval</code> (and <code>no ip ospf dead-interval</code> if set), or matching values.</p>
${K.dyk(`Break the timers on a FULL link and nothing happens for up to 40 seconds: the far end ignores the new hellos, waits out its dead timer, then logs <code>%OSPF-5-ADJCHG: ... from FULL to DOWN, Neighbor Down: Dead timer expired</code>. Hence the ticket &ldquo;it broke 40 seconds after I touched it&rdquo;.`)}
<h3>Duplicate router ID (logged)</h3>
${K.out(`WAN-A#show logging | include OSPF
*Oct 11 10:14:07.137: %OSPF-4-DUP_RTRID_NBR: OSPF detected duplicate router-id 5.5.5.5 from 172.16.9.2 on interface GigabitEthernet0/0
WAN-B(config)#router ospf 1
WAN-B(config-router)#router-id 5.5.5.6
% OSPF: Reload or use "clear ip ospf process" command, for this to take effect
WAN-B(config-router)#end
WAN-B#clear ip ospf process
Reset ALL OSPF processes? [no]: yes`, "Both were built from one template. Fix the newcomer, and restart OSPF so the new ID takes effect (lesson 4) — every adjacency on that router drops and re-forms, so use a change window.")}
<h3>Passive interface and mask mismatch (both silent)</h3>
${K.out(`WAN-A#show ip protocols | include ID|Passive|Gigabit
  Router ID 1.1.1.1
  Passive Interface(s):
    GigabitEthernet0/0
WAN-A#show ip ospf interface g0/0 | include Hello
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
    No Hellos (Passive interface)`, "Gi0/0, the link to WAN-B, is passive: no hellos, no log. Fix: no passive-interface g0/0.")}
${K.out(`WAN-A#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0               172.16.9.1/30      1     DR    0/0
WAN-B#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0               172.16.9.2/29      1     DR    0/0`, "/30 against /29: they even ping, but the hello masks differ — no neighbour, no log.")}
${K.mistake(`Fixing <code>passive-interface default</code> with <code>no passive-interface default</code>: now user LANs send hellos too, and any laptop can talk OSPF to your router. Un-passive only router links: <code>no passive-interface g0/0</code>.`)}
<h3>The real-world three (only network type is simulated in these labs)</h3>
<ul>
<li><b>Network type</b> — point-to-point at one end, broadcast at the other: they can even reach FULL, but routes go missing, because one end describes the link in its LSA as point-to-point and the other as a DR segment, and SPF only uses a link both ends describe the same way. Compare the <code>Network Type</code> lines.</li>
<li><b>Authentication</b> — different keys or types and hellos are rejected.</li>
<li><b>${K.g("MTU","Maximum Transmission Unit: the largest packet an interface sends, normally 1500 bytes on Ethernet.")}</b> — not in the hello, so neighbours appear, then stick in the ${K.g("EXSTART","An early neighbour state where two routers start exchanging database descriptions. Stuck there (or in EXCHANGE) usually means MTU.")} or <code>EXCHANGE</code> state. Match the MTUs (workaround: <code>ip ospf mtu-ignore</code>).</li>
</ul>
<p>(Hellos also carry a stub-area flag that must match at both ends; stub areas come after the CCNA.)</p>
<p>The state is a clue too: no entry = hellos not received or rejected; <code>INIT</code> = one-way (often an ${K.g("ACL","Access Control List: an interface packet filter (later module); one dropping 224.0.0.5 blocks OSPF.")}); <code>2WAY/DROTHER</code> = normal between DROTHERs (lesson 5); <code>EXSTART</code> for minutes = MTU.</p>
${K.check({q:"Two routers on a /30 won't become neighbours and show logging is empty on both. Which fault does the empty log rule OUT?", o:["Hello interval mismatch","Passive interface","Duplicate router ID","Mask mismatch"], a:2, why:"Duplicate router IDs (and area mismatches) are logged. Timer, passive and mask faults are silent, so compare both ends next."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A colleague pastes one piece of evidence per broken link. Match each to the fault it proves.", pairs:[["Hello 10, Dead 30 on one end; Hello 10, Dead 40 on the other","Timer mismatch"],["%OSPF-4-ERRRCV ... mismatched area ID from 10.9.9.2, GigabitEthernet0/1","Area mismatch"],["%OSPF-4-DUP_RTRID_NBR ... duplicate router-id 10.255.9.9","Two routers share one router ID"],["The branch's Passive Interface(s) list includes its uplink","The uplink sends no hellos"],["Neighbour stuck in EXSTART after a new firewall went in","MTU mismatch"]], why:"1. Asked: which check each fingerprint proves. 2. Rule: area and router-ID faults are logged; timers and passive show when you compare both ends; EXSTART means the hellos passed but the database exchange failed. 3. Apply: different dead intervals fail even with equal hellos; ERRRCV = area; DUP_RTRID = router ID; passive uplink = silent; EXSTART = MTU."})}

<h2>A troubleshooting ladder — then fix four branches</h2>
<p>Under pressure people jump to the most interesting idea. A ladder starts at the bottom: stop at the first rung that fails, fix it, then climb again from rung 1.</p>
${K.svg("0 0 720 400",
  K.box(150,10,420,44,"1 · Is the neighbour there? In what state?","show ip ospf neighbor",true)+K.arrow(360,54,360,64)+
  K.box(150,64,420,44,"2 · Layers 1–3: up/up, same subnet, ping the far end","show ip interface brief · ping")+K.arrow(360,108,360,118)+
  K.box(150,118,420,44,"3 · Is OSPF running on the interface, in which area?","show ip ospf interface brief")+K.arrow(360,162,360,172)+
  K.box(150,172,420,44,"4 · Compare both ends: mask, area, timers, type, passive","show ip ospf interface <if>")+K.arrow(360,216,360,226)+
  K.box(150,226,420,44,"5 · What did the router complain about?","show logging | include OSPF")+K.arrow(360,270,360,280)+
  K.box(150,280,420,44,"6 · Process level: router ID, networks, passive list","show ip protocols")+K.arrow(360,324,360,334)+
  K.box(150,334,420,44,"7 · FULL? Then are the routes there, and the path right?","show ip route ospf · traceroute",true)+
  K.txt(40,40,"start",{c:"accent",s:11,b:true})+K.txt(40,360,"prove",{c:"accent",s:11,b:true}),
  "The adjacency ladder. A failed ping at rung 2 isn't an OSPF problem yet; an interface missing at rung 3 has no matching network statement.")}
${K.remember(`<b>Neighbour → Link → Listed → Compare → Log → Process → Prove.</b> &ldquo;<b>N</b>ever <b>L</b>et <b>L</b>ogs <b>C</b>onfuse — <b>L</b>ook, <b>P</b>robe, <b>P</b>rove.&rdquo;`)}
${K.myth([
  ["If two routers ping each other, OSPF will form.","Ping proves Layers 1–3 only. A /30 vs /29 pair pings fine and never becomes neighbours."],
  ["The OSPF process ID must match.","It's local: <code>router ospf 1</code> and <code>router ospf 99</code> neighbour happily. The <b>area</b> must match."],
  ["Every OSPF problem shows up in the log.","Of the faults in this lesson's labs, only area and router-ID faults are logged (plus up/down events). Timers, masks and passive are silent."],
  ["2WAY means the adjacency is broken.","Two DROTHERs on a LAN stay 2WAY by design (lesson 5). On a point-to-point link it would be a problem."],
])}
<h3>Hands-on: four branches, four broken adjacencies</h3>
<p>Monday at the NOC: four new branch routers, each on a /30 to HQ-RTR, and HQ has <b>no OSPF neighbours</b>. Each link has a different fault — one isn't on the branch. Collect evidence, name the fault, fix the right end, prove it with a ping. Standard: all area 0, hello 10 / dead 40, router IDs <code>10.255.0.x</code> (HQ .1, branches .11–.14), branch LAN ports passive.</p>
${K.bench({id:"m5-ospf-faults", points:120, from:"CCNA · Module 5 · lesson 6", title:"four branches, no neighbours — diagnose from evidence, fix, prove", viewBox:"0 0 980 480",
  intro:"Console cable starts on HQ-RTR (9600 8N1, no flow control); move it to a branch router's CON port when you need to. No passwords. HQ-RTR G0/1–G0/4 go to Ikeja, Abuja, Kano and PH on 10.0.1.0/30 to 10.0.4.0/30 (HQ .1, branch .2). Branch LANs 10.41–10.44.0.0/24; SRV-PAY is 10.10.0.20.",
  devices:[
    {id:"srv", kind:"server", label:"SRV-PAY", x:20, y:20, ip:"10.10.0.20", mask:"255.255.255.0", gw:"10.10.0.1"},
    {id:"hq", kind:"router", label:"HQ-RTR", model:"ISR 4331 · HQ WAN hub", x:300, y:20, ports:[0,1,2,3,4].map(i=>({id:"g"+i, type:"rj45", label:"G0/"+i, ios:"GigabitEthernet0/"+i})).concat([{id:"con", type:"console", label:"CON"}]),
      config:e=>{ ["en","conf t","hostname HQ-RTR","interface g0/0","description LAN - SRV-PAY","ip address 10.10.0.1 255.255.255.0","no shutdown",
        "interface g0/1","description WAN to IKEJA","ip address 10.0.1.1 255.255.255.252","no shutdown","interface g0/2","description WAN to ABUJA","ip address 10.0.2.1 255.255.255.252","ip ospf hello-interval 5","no shutdown",
        "interface g0/3","description WAN to KANO","ip address 10.0.3.1 255.255.255.252","no shutdown","interface g0/4","description WAN to PH","ip address 10.0.4.1 255.255.255.252","no shutdown",
        "router ospf 1","router-id 10.255.0.1","network 10.0.0.0 0.0.255.255 area 0","network 10.10.0.0 0.0.0.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:700, y:20},
    {id:"b1", kind:"router", label:"IKEJA", model:"ISR 1100 · branch", x:10, y:200, config:e=>{ ["en","conf t","hostname IKEJA","interface g0/0","description WAN to HQ","ip address 10.0.1.2 255.255.255.252","no shutdown","interface g0/1","description Branch LAN","ip address 10.41.0.1 255.255.255.0","no shutdown","router ospf 1","router-id 10.255.0.11","network 10.0.1.0 0.0.0.3 area 1","network 10.41.0.0 0.0.0.255 area 0","passive-interface g0/1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"b2", kind:"router", label:"ABUJA", model:"ISR 1100 · branch", x:250, y:200, config:e=>{ ["en","conf t","hostname ABUJA","interface g0/0","description WAN to HQ","ip address 10.0.2.2 255.255.255.252","no shutdown","interface g0/1","description Branch LAN","ip address 10.42.0.1 255.255.255.0","no shutdown","router ospf 1","router-id 10.255.0.12","network 10.0.2.0 0.0.0.3 area 0","network 10.42.0.0 0.0.0.255 area 0","passive-interface g0/1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"b3", kind:"router", label:"KANO", model:"ISR 1100 · branch", x:490, y:200, config:e=>{ ["en","conf t","hostname KANO","interface g0/0","description WAN to HQ","ip address 10.0.3.2 255.255.255.252","no shutdown","interface g0/1","description Branch LAN","ip address 10.43.0.1 255.255.255.0","no shutdown","router ospf 1","router-id 10.255.0.1","network 10.0.3.0 0.0.0.3 area 0","network 10.43.0.0 0.0.0.255 area 0","passive-interface g0/1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"b4", kind:"router", label:"PH", model:"ISR 1100 · branch", x:730, y:200, config:e=>{ ["en","conf t","hostname PH","interface g0/0","description WAN to HQ","ip address 10.0.4.2 255.255.255.252","no shutdown","interface g0/1","description Branch LAN","ip address 10.44.0.1 255.255.255.0","no shutdown","router ospf 1","router-id 10.255.0.14","passive-interface default","network 10.0.4.0 0.0.0.3 area 0","network 10.44.0.0 0.0.0.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"p1", kind:"pc", label:"IKEJA-PC", x:50, y:360, ip:"10.41.0.10", mask:"255.255.255.0", gw:"10.41.0.1"},
    {id:"p2", kind:"pc", label:"ABUJA-PC", x:290, y:360, ip:"10.42.0.10", mask:"255.255.255.0", gw:"10.42.0.1"},
    {id:"p3", kind:"pc", label:"KANO-PC", x:530, y:360, ip:"10.43.0.10", mask:"255.255.255.0", gw:"10.43.0.1"},
    {id:"p4", kind:"pc", label:"PH-PC", x:770, y:360, ip:"10.44.0.10", mask:"255.255.255.0", gw:"10.44.0.1"},
  ],
  cables:[ {type:"cat6", a:"hq:g1", b:"b1:g0"}, {type:"cat6", a:"hq:g2", b:"b2:g0"}, {type:"cat6", a:"hq:g3", b:"b3:g0"}, {type:"cat6", a:"hq:g4", b:"b4:g0"}, {type:"cat6", a:"srv:eth", b:"hq:g0"},
           {type:"cat6", a:"p1:eth", b:"b1:g1"}, {type:"cat6", a:"p2:eth", b:"b2:g1"}, {type:"cat6", a:"p3:eth", b:"b3:g1"}, {type:"cat6", a:"p4:eth", b:"b4:g1"}, {type:"console", a:"lap:usb", b:"hq:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"<b>Survey before you touch anything.</b> On HQ-RTR run <code>show ip ospf neighbor</code> (empty) and <code>show logging</code>. Two branches made HQ complain — note which, and which two are silent", done:B=>{ const L = B.devs.hq.env.log; return L.some(l=>/Neighbor ID\s+Pri\s+State/.test(l.out)) && L.some(l=>/Log Buffer/.test(l.out)); }},
    {text:"<b>Ikeja (branch manager):</b> &ldquo;Since the new router went in we can't open payroll.&rdquo; Find the evidence, fix the wrong end, and make IKEJA-PC ping SRV-PAY (10.10.0.20). <i>Done when HQ has Ikeja (10.255.0.11) FULL and learns 10.41.0.0/24 as a plain O route.</i>", done:B=>Bench.ospfNbr(B,"hq","10.255.0.11") && !!Bench.route(B,"hq","10.41.0.0/24","O") && Bench.pinged(B,"p1","10.10.0.20")},
    {text:"<b>Abuja (NOC note):</b> &ldquo;Abuja's router config was checked twice and matches the template.&rdquo; Compare both ends of the link anyway, fix whichever end breaks the company standard, and make ABUJA-PC ping SRV-PAY. <i>Done when HQ has Abuja (10.255.0.12) FULL with hello 10 / dead 40 at both ends.</i>", done:B=>{ const h = B.devs.hq.env.intfs["GigabitEthernet0/2"], a = B.devs.b2.env.intfs["GigabitEthernet0/0"]; return Bench.ospfNbr(B,"hq","10.255.0.12") && (h.ospfHello||10)===10 && (h.ospfDead||40)===40 && (a.ospfHello||10)===10 && (a.ospfDead||40)===40 && Bench.pinged(B,"p2","10.10.0.20"); }},
    {text:"<b>Kano (contractor):</b> &ldquo;I built it from the HQ template to save time.&rdquo; Prove what that broke, fix it without changing HQ's documented router ID (Kano's should be 10.255.0.13), and make KANO-PC ping SRV-PAY. <i>The fix needs an OSPF restart on Kano: <code>clear ip ospf process</code>, answer <code>yes</code>.</i>", done:B=>Bench.ospfNbr(B,"hq","10.255.0.13") && B.devs.hq.env.ospfInfo().rid==="10.255.0.1" && Bench.pinged(B,"p3","10.10.0.20")},
    {text:"<b>Port Harcourt:</b> &ldquo;The router is up and pings HQ, but no routes.&rdquo; Nothing is logged anywhere — climb the ladder. Fix it so PH-PC pings SRV-PAY while the branch LAN port (G0/1) stays passive", done:B=>{ const o = B.devs.b4.env.ospf; const lanPassive = o && (o.passiveDefault ? !(o.noPassive||[]).includes("GigabitEthernet0/1") : (o.passive||[]).includes("GigabitEthernet0/1")); return Bench.ospfNbr(B,"hq","10.255.0.14") && lanPassive && Bench.pinged(B,"p4","10.10.0.20"); }},
    {text:"<b>Prove it for the change record.</b> On HQ-RTR: <code>show ip ospf neighbor</code> lists four FULL neighbours and <code>show ip route ospf</code> lists all four branch LANs", done:B=>{ const L = B.devs.hq.env.log; return Bench.ospfNbrCount(B,"hq")===4 && L.some(l=>/10\.41\.0\.0\/24/.test(l.out) && /10\.42\.0\.0\/24/.test(l.out) && /10\.43\.0\.0\/24/.test(l.out) && /10\.44\.0\.0\/24/.test(l.out)); }},
    {text:"Save the configuration on every router you changed", done:B=>["hq","b1","b3","b4"].every(r=>B.devs[r].env.savedOnce)},
  ],
  win:"Four branches, four different fingerprints: an area mismatch (logged), a hello mismatch on HQ's own side (silent — found by comparing Timer lines), a duplicate router ID (logged, fixed with router-id plus clear ip ospf process) and a passive uplink (silent — found in show ip protocols). Each one fixed at the right end and proved with a ping.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf neighbor"],["term","show logging"],
    ["term","show ip ospf interface g0/2"],["term","configure terminal"],["term","interface g0/2"],["term","no ip ospf hello-interval"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","b1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf interface brief"],
    ["term","configure terminal"],["term","router ospf 1"],["term","no network 10.0.1.0 0.0.0.3 area 1"],["term","network 10.0.1.0 0.0.0.3 area 0"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","b3:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show logging"],
    ["term","configure terminal"],["term","router ospf 1"],["term","router-id 10.255.0.13"],["term","end"],["term","clear ip ospf process"],["term","yes"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","b4:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip protocols"],
    ["term","configure terminal"],["term","router ospf 1"],["term","no passive-interface g0/0"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","hq:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf neighbor"],["term","show ip route ospf"],
    ["pc","p1","ping 10.10.0.20"],["pc","p2","ping 10.10.0.20"],["pc","p3","ping 10.10.0.20"],["pc","p4","ping 10.10.0.20"]]})}
${K.hint(`HQ's log names two branches by WAN address — read what each line complains about. For the two silent ones, compare <code>show ip ospf interface g0/2</code> and <code>g0/4</code> on HQ with the same command at the branch end: the Timer line, and any <code>No Hellos</code>. The NOC says Abuja matches the template — so where else can a timer be wrong?`, "Hint: where to start")}
${K.hint(`Ikeja's WAN statement and LAN statement are in different areas — which disagrees with HQ? If you move HQ's G0/1 into area 1 instead, the neighbour forms but HQ still gets no route to the branch LAN, and the task stays unticked: Ikeja's LAN is a piece of area 0 cut off from the rest of area 0, and an ABR ignores summary routes that arrive through a non-backbone area — in the lab as on real routers. The standard is single-area anyway.`, "Hint: Ikeja")}
${K.reveal("Instructor walkthrough — open after you've tried",`<p><b>Survey.</b> HQ logs <code>mismatched area ID ... from 10.0.1.2</code> (Ikeja) and <code>duplicate router-id 10.255.0.1 from 10.0.3.2</code> (Kano is using HQ's ID). Abuja and PH are silent.</p>
<p><b>Abuja.</b> HQ's G0/2 says <code>Hello 5, Dead 20</code>, Abuja <code>10, 40</code>: the odd end is <b>HQ</b>. <code>no ip ospf hello-interval</code> on HQ G0/2 (setting Abuja to 5 would form the neighbour but break the standard). <b>Ikeja.</b> WAN statement in area 1: move it to area 0. <b>Kano.</b> <code>router-id 10.255.0.13</code>, then <code>clear ip ospf process</code>. <b>PH.</b> <code>show ip protocols</code> lists G0/0 and G0/1 as passive: add <code>no passive-interface g0/0</code>.</p>
<p><b>Prove.</b> Four <code>ADJCHG ... LOADING to FULL</code> lines and four FULL neighbours on HQ; every PC pings SRV-PAY.</p>`)}
${K.job(`“Jos can browse the internet but can't reach the ${K.g("ERP","Enterprise Resource Planning: the company's main business system — accounts, stock, HR.")} since last night”`,`
<p><b>The ticket.</b> 07:55, Mr Danladi, Jos branch supervisor: &ldquo;Since the router was replaced yesterday we can open websites but not the ERP at head office.&rdquo; Jos has local internet breakout, so the LAN, gateway and internet side are fine — only the path to HQ is broken.</p>
<p><b>Questions.</b> &ldquo;Who replaced it, from what config?&rdquo; — <i>&ldquo;Grace, our field engineer, typed it from a printout.&rdquo;</i> &ldquo;Anything changed at HQ?&rdquo; — <i>&ldquo;No.&rdquo;</i> Suspect a typo.</p>
<p><b>Checks — up the ladder from HQ, which you can reach.</b></p>
${K.out(`HQ-WAN#show ip ospf neighbor | include GigabitEthernet0/6
HQ-WAN#ping 10.0.6.2
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.0.6.2, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms
HQ-WAN#show logging | include OSPF
HQ-WAN#show ip ospf interface brief | include Gi0/6
Gi0/6        1     0               10.0.6.1/30        1     DR    0/0`, "No neighbour; Layers 1–3 fine; nothing logged (so not area or router ID); OSPF runs on Gi0/6 in area 0.")}
<p>Silent with a working ping: timers, mask or passive. Grace reads out the branch side:</p>
${K.out(`JOS-RTR#show ip ospf interface brief | include Gi0/0
Gi0/0        1     0               10.0.6.2/29        1     DR    0/0
JOS-RTR#show ip ospf interface g0/0 | include Timer
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5`, "Timers match — but /29 at Jos against /30 at HQ.")}
<p><b>The fix.</b> JOS-RTR Gi0/0: <code>ip address 10.0.6.2 255.255.255.252</code>. HQ logs <code>%OSPF-5-ADJCHG: ... from LOADING to FULL, Loading Done</code>, <code>10.46.0.0/24</code> appears in <code>show ip route ospf</code>, a branch PC's <code>tracert</code> to the ERP goes via HQ, and Grace saves with <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;Mr Danladi, the new router had one wrong number on its link to head office. It's fixed — please ask someone to try the ERP.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Jos ERP down after router swap, internet OK. HQ Gi0/6 up/up, ping OK, no neighbour, no OSPF logs. JOS-RTR Gi0/0 /29 vs HQ /30 — silent mask mismatch. Corrected; FULL 08:21; route and tracert OK; saved. Cause: hand-typed config — paste from the template repo in future. 30 min.&rdquo;</i></p>`)}
${K.dodont([
  "Check both ends first — the fault may be on the &ldquo;good&rdquo; side.",
  "Read <code>show logging | include OSPF</code> early.",
  "Fix towards the documented standard, not the other end's values.",
  "After every fix, climb back to rung 1 and prove routes and path.",
],[
  "Don't change a working router's ID to dodge a clash; fix the newcomer.",
  "Don't run <code>clear ip ospf process</code> on a busy core in working hours.",
  "Don't read 2WAY/DROTHER on a LAN as a fault, or an empty log as &ldquo;all fine&rdquo;.",
  "Don't change several things at once; change one, then check.",
])}
${K.check({q:"R1 and R2 ping each other on their /30, show ip ospf neighbor is empty, the log is empty, and both show Hello 10, Dead 40. What next?", o:["clear ip ospf process on both","show ip protocols on each for the Passive Interface(s) list, and compare prefix lengths in show ip ospf interface brief","debug all","Raise the reference bandwidth"], a:1, why:"Ping clears Layers 1–3, the empty log clears area and router ID, the timers match. Passive and mask remain. Restarting OSPF without a reason fixes nothing and drops other adjacencies."})}
<h3>Same logic, new situation</h3>
${K.hint(`FULL means rungs 1–6 pass. Rung 7: is the route there — and what decides whether an interface is advertised at all?`)}
${K.reveal("Enugu is FULL with HQ, but HQ has no route to Enugu's new LAN 10.47.20.0/24 on Gi0/2, added yesterday; the first LAN, 10.47.10.0/24, works. Why?",`<p><b>1. Asked:</b> why one LAN is missing with a healthy adjacency. <b>2. Rule:</b> a router advertises a subnet only if a <code>network</code> statement (or <code>ip ospf</code>) enables OSPF on that interface. <b>3. Apply:</b> on Enugu, <code>show ip ospf interface brief</code> won't list Gi0/2; <code>show ip protocols</code> probably shows only <code>network 10.47.10.0 0.0.0.255 area 0</code>. Add <code>network 10.47.20.0 0.0.0.255 area 0</code> (passive — it's a user LAN). Nothing was broken; the subnet was never offered.</p>`)}
${K.case("A microfinance bank where every link cost 1",`
<p><b>The situation.</b> An Abuja MSP took over a bank WAN: HQ in Garki, a Lagos DR site, 40 branches, each with 1 Gb/s fibre plus a backup over ${K.g("VSAT","A satellite link: works anywhere, but slow and high-delay (around 600 ms round trip).")} or 20 Mb/s radio — all on gigabit ports, all at the default reference. Every link cost 1, so where a backup had as few hops as the fibre, the bank had ECMP across fibre and satellite, and tellers whose sessions hashed onto the VSAT saw screens hang.</p>
<p><b>Discovery.</b> <code>show ip ospf interface brief</code> everywhere: a column of 1s; eleven branch LANs with two next hops at HQ; a teller's traceroute crossing the satellite gateway.</p>
<p><b>The decision.</b> Scale, then describe, then decide: <code>auto-cost reference-bandwidth 100000</code> on every router; <code>bandwidth</code> on every sub-rate circuit (a 20 Mb/s radio became cost 5000); <code>ip ospf cost 60000</code> on VSAT interfaces so they never win while fibre exists. One change window, with route tables and traceroutes from five branches saved before and after.</p>
<p><b>The result.</b> Wrong ECMP disappeared; the right ECMP (twin 10 Gb/s HQ–DR links) stayed. &ldquo;Slow core banking&rdquo; tickets fell from about 30 a week to two. Lessons: <b>fix the scale before fine-tuning</b>; <b>bandwidth describes, ip ospf cost decides</b>; <b>change every router at once</b>; <b>keep before-and-after evidence</b>.</p>`)}

<h2>A first look at multi-area OSPF</h2>
<p>The CCNA asks you to configure <b>single-area</b> OSPF; larger networks use several areas, so here is enough to read them.</p>
${K.remember(`<b>The multi-area rule.</b> Inside an area every router has the <b>same detailed map</b>. Between areas, an ${K.g("ABR","Area Border Router: interfaces in area 0 and at least one other area, one database per area.")} passes on only <b>prefixes and costs</b> (Type 3 Summary LSAs), which other routers install as <code>O IA</code> routes (${K.g("IA","Inter-area: the destination is in another OSPF area.")}). Every area must touch <b>area 0</b>, the ${K.g("backbone","Area 0: every other area attaches to it, and traffic between areas crosses it.")}.`)}
<p><b>Why areas?</b> In one area every router stores every LSA and reruns SPF on every change. With hundreds of routers the ${K.g("LSDB","Link-state database: a router's set of LSAs for an area — its map.")} grows and one flapping link makes everyone recalculate. Areas give smaller databases, churn contained inside an area, and a place to summarise later.</p>
${K.svg("0 0 720 280",
  K.band(20,14,380,24,"AREA 0 — backbone")+K.band(400,14,300,24,"AREA 1")+
  `<rect x="20" y="44" width="380" height="200" rx="8" fill="none" stroke="var(--line)" stroke-dasharray="5 4"/><rect x="400" y="44" width="300" height="200" rx="8" fill="none" stroke="var(--line)" stroke-dasharray="5 4"/>`+
  K.dev("pc",70,120,"LAN","172.20.10.0/24")+K.dev("router",180,120,"CORE1","1.1.1.1")+K.dev("router",400,120,"ABR1","2.2.2.2 · both areas")+K.dev("router",560,120,"BR1","3.3.3.3")+K.dev("pc",660,120,"LAN","172.20.30.0/24")+
  K.link(88,120,156,120)+K.link(204,120,376,120,"172.20.0.0/30")+K.link(424,120,536,120,"172.20.1.0/30")+K.link(584,120,642,120)+
  K.arrow(370,200,210,200,"Type 3: 172.20.30.0/24, 172.20.1.0/30",true)+K.arrow(430,225,590,225,"Type 3: 172.20.10.0/24, 172.20.0.0/30",true)+
  K.txt(110,265,"CORE1 sees area 1 as O IA",{c:"muted",s:10.5})+K.txt(470,265,"BR1 sees area 0 as O IA",{c:"muted",s:10.5}),
  "ABR1 advertises each area's prefixes into the other as Type 3 Summary LSAs.")}
${K.out(`ABR1#show ip protocols | include ID|border|areas
  Router ID 2.2.2.2
  It is an area border router
  Number of areas in this router is 2. 2 normal 0 stub 0 nssa
CORE1#show ip route ospf
...
      172.20.0.0/16 is variably subnetted, 6 subnets, 3 masks
O IA     172.20.1.0/30 [110/2] via 172.20.0.2, 00:39:40, GigabitEthernet0/1
O IA     172.20.30.0/24 [110/3] via 172.20.0.2, 00:11:03, GigabitEthernet0/1
CORE1#show ip route 172.20.30.0 | include Known|from
  Known via "ospf 1", distance 110, metric 3, type inter area
  Last update from 172.20.0.2 on GigabitEthernet0/1, 00:11:03 ago
  * 172.20.0.2, from 2.2.2.2, 00:11:03 ago, via GigabitEthernet0/1`, "ABR1 says it outright. CORE1 learns area 1 as O IA, 'type inter area', from 2.2.2.2 — the ABR, not BR1. Metric = cost to the ABR + the ABR's advertised cost (1 + 2 = 3).")}
<p>An ABR doesn't break the &ldquo;same area&rdquo; rule: each <b>link</b> is in one area at both ends. One link with a different area at each end — the Ikeja fault — is a misconfiguration, not a design.</p>
${K.out(`CORE1#show ip ospf database

            OSPF Router with ID (1.1.1.1) (Process ID 1)

                Router Link States (Area 0)

Link ID         ADV Router      Age         Seq#       Checksum Link count
1.1.1.1         1.1.1.1         1109        0x80000005 0x000202 2
2.2.2.2         2.2.2.2         618         0x80000009 0x000404 1

                Net Link States (Area 0)

Link ID         ADV Router      Age         Seq#       Checksum
172.20.0.2      2.2.2.2         474         0x80000009 0x000204

                Summary Net Link States (Area 0)

Link ID         ADV Router      Age         Seq#       Checksum
172.20.30.0     2.2.2.2         652         0x80000009 0x002002
172.20.1.0      2.2.2.2         728         0x80000009 0x000302`, "CORE1's map of area 0, in three sections.")}
<ul>
<li><b>Router Link States</b> (Type 1): one per router <i>in this area</i> — BR1 is missing; its detail stays in area 1.</li>
<li><b>Net Link States</b> (Type 2): one per DR segment (lesson 5).</li>
<li><b>Summary Net Link States</b> (Type 3): one per prefix from another area, advertised by the ABR. &ldquo;Summary&rdquo; means &ldquo;of another area&rdquo;; each prefix still has its own LSA.</li>
</ul>
<div class="tablewrap"><table>
<tr><th>Code</th><th>Means</th><th>Comes from</th></tr>
<tr><td><code>O</code></td><td>Intra-area: inside one of this router's areas</td><td>Type 1 and 2 LSAs</td></tr>
<tr><td><code>O IA</code></td><td>Inter-area: from another area</td><td>Type 3 Summary LSAs from an ABR</td></tr>
<tr><td><code>O E2</code> / <code>O*E2</code></td><td>External: from outside OSPF, e.g. lesson 4's <code>default-information originate</code></td><td>Type 5 LSAs from an ${K.g("ASBR","Autonomous System Boundary Router: an OSPF router injecting routes from outside OSPF, such as a default route.")}</td></tr>
</table></div>
${K.exam(`Multi-area is recognition only: ABR, <code>O IA</code>, why areas exist, every area touches area 0. <code>O IA</code> in an exhibit = the route crossed an ABR; <code>mismatched area ID</code> in a log = one misconfigured link.`)}
${K.check({q:"A router shows 'O IA 10.70.0.0/16 [110/45] via 10.0.0.2'. What does it tell you?", o:["An ASBR redistributed it","10.70.0.0/16 is in another area, and an ABR advertised it in a Type 3 Summary LSA","10.0.0.2 has an area mismatch","It's a backup path inside this router's own area"], a:1, why:"IA = inter-area: an ABR summarised the prefix into this area. Externals show as O E1/E2, and an area mismatch prevents a neighbour entirely."})}
<h3>Same logic, new situation</h3>
${K.hint(`An O IA metric = the cost to reach the ABR + the cost the ABR advertises. Areas only connect through area 0.`)}
${K.reveal("A retailer runs area 0 at HQ, area 10 for Lagos stores, area 20 for Abuja stores. A Lagos store router sees O IA 10.20.5.0/24 [110/40]; its area-10 ABR is 30 away. What cost does that ABR advertise, and what path did the prefix's advertisement take?",`<p><b>1. Asked:</b> the ABR's advertised cost and the advertisement's journey. <b>2. Rule:</b> metric = cost to the ABR + the ABR's Summary LSA cost; areas join only through area 0. <b>3. Apply:</b> 40 − 30 = <b>10</b>. The prefix is in area 20, so the area-20 ABR summarised it into area 0, then the area-10 ABR summarised it again into area 10. The store sees only the last ABR's LSA — no detail of areas 0 or 20, which is the point.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Formula, default, the problem, the fix, the two interface levers, the proof.`)}
${K.reveal("“How does OSPF choose a path, and why would you change the reference bandwidth?”",`<p>"By cost: reference bandwidth divided by interface bandwidth, minimum 1, summed over the outgoing interfaces; SPF picks the lowest and installs ties side by side. The default reference is 100 Mb/s, so everything from 100 Mb/s up costs 1 and a backup looks as good as a 10 Gb/s core link. I set <code>auto-cost reference-bandwidth</code> to at least the fastest link on every router in one change, since each router advertises its own costs; then <code>bandwidth</code> for sub-rate circuits and <code>ip ospf cost</code> for policy, proved with <code>show ip route</code> and traceroutes from both ends."</p>`)}
${K.hint(`Bottom up, both ends, logged versus silent, and how you prove the fix.`)}
${K.reveal("“Two routers won't become OSPF neighbours. How do you troubleshoot?”",`<p>"Bottom up. <code>show ip ospf neighbor</code> on both; then up/up and a ping to the far end; then <code>show ip ospf interface brief</code> to confirm OSPF runs there and in which area. I compare both ends in <code>show ip ospf interface</code> — area, mask, timers, network type, passive. <code>show logging</code> settles area and duplicate-router-ID faults, which are logged; timers, masks and passive are silent. <code>show ip protocols</code> shows the router ID and passive list. In production I also check authentication and MTU — EXSTART usually means MTU. Then I wait for ADJCHG to FULL and check routes and a traceroute."</p>`)}
${K.hint(`ABR, what crosses between areas, and how it shows in the routing table.`)}
${K.reveal("“What is an ABR, and what does O IA mean?”",`<p>"An ABR has interfaces in area 0 and at least one other area, with a database per area. Inside an area routers share full Router and Network LSAs; across the boundary the ABR advertises only prefixes and costs as Type 3 Summary LSAs, installed elsewhere as <code>O IA</code> — 'type inter area' in <code>show ip route</code>, learned from the ABR's router ID. Areas keep databases small and contain SPF churn, and every area attaches to area 0. I'd recognise an ABR in <code>show ip protocols</code> and Summary LSAs in <code>show ip ospf database</code>."</p>`)}

${K.recap([
  "Cost = reference ÷ bandwidth, fraction dropped, minimum 1; path cost = sum of outgoing interface costs.",
  "Default reference 100 Mb/s makes every link ≥100 Mb/s cost 1. Fix: auto-cost reference-bandwidth (Mb/s) on every router, in one change.",
  "bandwidth (Kbit/s) describes the real speed; ip ospf cost sets the cost outright. Each moves only traffic leaving that interface.",
  "Equal lowest costs give ECMP (up to 4 next hops, shared per flow) — good on equal links, a fault on unequal ones.",
  "Neighbours need matching area, subnet/mask and hello/dead, unique router IDs, non-passive interfaces (plus network type, authentication, MTU).",
  "Logged: ERRRCV mismatched area, DUP_RTRID_NBR, ADJCHG. Silent: timers (Timer line), mask (prefix length), passive (Passive Interface(s)).",
  "Ladder: neighbour → Layers 1–3 → OSPF on the interface → compare both ends → log → show ip protocols → routes and traceroute.",
  "Areas keep databases small; ABRs pass Type 3 Summary LSAs between areas, seen as O IA.",
])}
${K.next(`<b>Lesson 7 — First-hop redundancy.</b> OSPF reroutes around a dead link, but a PC still has one gateway. Next: HSRP's virtual IP and MAC, priority, preempt and failover while a PC keeps pinging — with ${K.g("VRRP","Virtual Router Redundancy Protocol: the open-standard first-hop redundancy protocol (lesson 7).")} and ${K.g("GLBP","Gateway Load Balancing Protocol: a Cisco first-hop protocol that also shares load (lesson 7).")} compared.`)}
`,
quiz:[
  {lvl:1, q:"What is the default OSPF reference bandwidth on Cisco IOS?", o:["10 Mb/s","100 Mb/s","1 Gb/s","10 Gb/s"], a:1, why:"The default is 100 Mb/s. Cost = 100 Mb/s ÷ interface bandwidth, minimum 1, which is why every link of 100 Mb/s or faster costs 1 unless you change it."},
  {lvl:1, type:"fill", q:"Which router configuration command sets the OSPF reference bandwidth to 10 Gb/s?", fields:[{label:"Command (under router ospf)", a:["auto-cost reference-bandwidth 10000"], ios:true}], why:"auto-cost reference-bandwidth takes a value in Mb/s, so 10 Gb/s is 10000. IOS warns that it must be consistent on all routers."},
  {lvl:2, q:"A network runs OSPF with the default reference bandwidth. R1 can reach a server LAN over a path of two 10 Gb/s links or over a path of two 1 Gb/s links. What does R1 do?", o:["Uses the 10 Gb/s path because it has the lower cost","Uses the 1 Gb/s path because it was learned first","Installs both paths as equal-cost, because every link of 100 Mb/s or faster costs 1","Uses neither until the reference bandwidth is changed"], a:2, why:"With a 100 Mb/s reference, both 1 Gb/s and 10 Gb/s interfaces cost 1, so both paths total the same and OSPF installs both (ECMP). Raising the reference bandwidth on all routers lets OSPF tell them apart."},
  {lvl:2, q:"Based on the exhibit, what will R1 do with traffic to 10.88.0.0/24?", ex:"R1#show ip route ospf\n...\n      10.0.0.0/8 is variably subnetted, 8 subnets, 2 masks\nO        10.88.0.0/24 [110/20] via 10.0.1.2, 00:12:41, GigabitEthernet0/1\n                      [110/20] via 10.0.2.2, 00:12:41, GigabitEthernet0/2", o:["Send all of it via 10.0.1.2 and keep 10.0.2.2 as a backup","Share it between both next hops, keeping each flow on one path","Alternate every packet between the two next hops","Drop it, because the route is ambiguous"], a:1, why:"Two next hops with the same metric (20) is ECMP. IOS CEF load-shares per flow by default (hashing source and destination), so each conversation stays on one path and different conversations use both."},
  {lvl:2, type:"multi", q:"Which two parameters must match for two routers on an Ethernet link to become OSPF neighbours? (Choose two.)", o:["Area ID","OSPF process ID","Hello and dead intervals","Interface cost","Router priority","Router ID"], a:[0,2], why:"The area ID and hello/dead timers are checked in every hello and must match (so must the subnet mask on broadcast networks). The process ID is local to each router, costs and priorities may differ, and router IDs must be different, not equal."},
  {lvl:2, q:"Based on the exhibit, what is the fix?", ex:"BR-7#show logging | include OSPF\n*Oct 11 10:14:07.137: %OSPF-4-ERRRCV: Received invalid packet: mismatched area ID, from backbone area must be virtual-link but not found from 10.0.7.1, GigabitEthernet0/0\nBR-7#show ip ospf interface brief\nInterface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C\nGi0/0        1     7               10.0.7.2/30        1     DR    0/0\nGi0/1        1     0               10.57.0.1/24       1     DR    0/0", o:["Configure a virtual link between BR-7 and HQ","Put BR-7's Gi0/0 in area 0, to match the router at 10.0.7.1, which is sending area 0 hellos","Change BR-7's router ID","Make Gi0/0 passive"], a:1, why:"The log says mismatched area ID; BR-7's WAN interface is in area 7 while the neighbour sends area 0 hellos — that is exactly when IOS adds 'from backbone area must be virtual-link but not found' (an area-0 hello arrived on a non-backbone interface). The virtual-link wording is a clue, not the fix. Move Gi0/0 to area 0 (no network ... area 7, network ... area 0)."},
  {lvl:2, q:"Based on the exhibit, why is there no OSPF neighbour between R5 and R6?", ex:"R5#show ip ospf interface g0/1 | include Timer\n  Timer intervals configured, Hello 10, Dead 30, Wait 30, Retransmit 5\nR6#show ip ospf interface g0/1 | include Timer\n  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5", o:["The hello intervals don't match","The dead intervals don't match, so each router ignores the other's hellos","R5's interface is passive","Nothing is wrong; the dead interval doesn't need to match"], a:1, why:"Both the hello and dead intervals are in every hello and must match. Here the hellos are both 10, but R5's dead interval is 30 (someone set ip ospf dead-interval 30). Remove it, or set 40, and the neighbour forms. This fault isn't logged."},
  {lvl:1, type:"match", q:"Match each piece of evidence with what it tells you.", pairs:[["%OSPF-4-DUP_RTRID_NBR","Two routers are using the same router ID"],["%OSPF-4-ERRRCV ... mismatched area ID","The two ends of a link are in different areas"],["No Hellos (Passive interface)","The interface sends no hellos, so no neighbour can form on it"],["%OSPF-5-ADJCHG ... from FULL to DOWN, Neighbor Down: Dead timer expired","A neighbour stopped being heard for the whole dead interval"]], why:"Area and router-ID faults are logged; the passive line comes from show ip ospf interface; ADJCHG lines record adjacencies going up and down, with the reason."},
  {lvl:1, type:"order", q:"Put the steps of the OSPF adjacency troubleshooting ladder in order.", items:["show ip ospf neighbor — is the neighbour there, and in what state?","Check Layers 1–3: interfaces up/up, same subnet, ping the far end","show ip ospf interface brief — is OSPF running on the interface, in which area?","Compare both ends in show ip ospf interface: mask, area, timers, network type, passive","Read show logging for ERRRCV, DUP_RTRID_NBR and ADJCHG","Check show ip protocols: router ID, networks, passive list","Prove it: show ip route ospf and traceroute"], why:"Climb from the bottom: no point comparing timers on a link that doesn't ping. Logs settle area and router-ID faults quickly; the last rung proves the routes and the path, not just the neighbour."},
  {lvl:2, type:"fill", q:"R1 reaches 10.8.8.0/24 via R2 and R3. R1's interface towards R2 costs 10. R2's interface facing R1 costs 50. R2's interface towards R3 costs 100. R3's interface facing R2 costs 10, and R3's interface on 10.8.8.0/24 costs 1. What metric does R1 show for 10.8.8.0/24?", fields:[{label:"Metric", a:["111"]}], why:"Add only outgoing interfaces: R1 → R2 (10) + R2 → R3 (100) + R3 onto the LAN (1) = 111. The 50 and the 10 are interfaces where the packet arrives; they'd only count for traffic going the other way."},
  {lvl:3, q:"An engineer set auto-cost reference-bandwidth 10000 on the HQ routers last week but not yet on the branch routers. Since then, some HQ-to-HQ traffic takes a long path through a branch. Why?", o:["Mixed reference bandwidths cause routing loops","The branch routers still advertise their gigabit links at cost 1 while HQ advertises its gigabit links at 10, so paths through branches look ten times cheaper","The branch routers can't form adjacencies with HQ any more","OSPF ignores costs from routers with a different reference bandwidth"], a:1, why:"Each router advertises the cost of its own interfaces. With mixed reference bandwidths the costs are on different scales, so links on un-updated routers look artificially cheap and attract traffic. Adjacencies are unaffected and OSPF doesn't loop; the fix is the same reference bandwidth on every router, in one change."},
  {lvl:3, q:"To move traffic off a fibre link for maintenance, you set ip ospf cost 500 on HQ's interface towards the branch. A traceroute from HQ to the branch now uses the backup path, but a traceroute from the branch to HQ still uses the fibre. What is the explanation and the fix?", o:["The change hasn't propagated yet; wait for the dead interval","Cost only counts on outgoing interfaces, so HQ's change only affects HQ's traffic; also raise the cost on the branch's interface towards the fibre","The branch has a static route that overrides OSPF","ip ospf cost only works on point-to-point links"], a:1, why:"OSPF path cost is the sum of outgoing interface costs. The branch's traffic leaves through the branch's own interface, whose cost is unchanged, so its best path is still the fibre. Raise the cost at the branch end too (or both ends of every link on the path) to move both directions."},
  {lvl:3, q:"After a firewall was inserted between two OSPF routers, show ip ospf neighbor on each shows the other stuck in EXSTART for several minutes. Pings work and the hello parameters match. What is the most likely cause?", o:["Duplicate router IDs","An MTU mismatch, so the database description exchange fails","A passive interface","An area mismatch"], a:1, why:"The routers hear each other's hellos (otherwise there'd be no entry), so area, timers and passive are fine, and a duplicate router ID would be logged and stop them earlier. Stuck in EXSTART/EXCHANGE is the fingerprint of an MTU mismatch: the database descriptions from the larger-MTU side are too big. Match the MTUs (or use ip ospf mtu-ignore as a workaround)."},
  {lvl:2, q:"Which router generates the Summary Net Link States (Type 3 LSAs) that appear as O IA routes?", o:["The DR of each segment","An ABR — a router with interfaces in area 0 and another area","An ASBR injecting external routes","Every router in the area, for its own interfaces"], a:1, why:"ABRs advertise each area's prefixes into the other areas as Type 3 Summary LSAs; routers that learn them show O IA. DRs create Type 2 Network LSAs, every router creates its own Type 1 Router LSA, and ASBRs create Type 5 External LSAs (O E2)."},
  {lvl:3, type:"multi", q:"A new branch router shows no OSPF neighbour. HQ's log is empty. On the branch, show ip protocols lists GigabitEthernet0/0 (the WAN uplink) and GigabitEthernet0/1 (the user LAN) under Passive Interface(s), and the running-config contains passive-interface default. Which two statements are true? (Choose two.)", o:["The uplink sends no hellos, which is why no neighbour forms","The right fix is no passive-interface GigabitEthernet0/0 under router ospf","The right fix is no passive-interface default","The branch LAN is no longer advertised because it is passive","HQ should log a passive-interface error"], a:[0,1], why:"Passive interfaces send no hellos, so the uplink can't form a neighbour, and nothing is logged anywhere. Un-passive only the uplink; removing passive-interface default would make the user LAN send hellos too. A passive interface's subnet is still advertised."},
],
cards:[
  {f:"OSPF interface cost formula", b:"Reference bandwidth ÷ interface bandwidth, fraction dropped, minimum 1. Default reference 100 Mb/s."},
  {f:"Why is every fast link cost 1 by default?", b:"The default reference bandwidth is 100 Mb/s and cost can't go below 1, so 100 Mb/s, 1 Gb/s and 10 Gb/s links all cost 1 and OSPF can't tell them apart."},
  {f:"auto-cost reference-bandwidth", b:"Under router ospf, in Mb/s (10000 = 10 Gb/s). Set it to at least the fastest link speed, the same on every router, in one change."},
  {f:"bandwidth vs ip ospf cost", b:"bandwidth (Kbit/s) tells IOS a link's real speed so the formula uses it; it doesn't change the port speed. ip ospf cost sets the cost directly and ignores the formula."},
  {f:"Computing an OSPF path cost", b:"Add the costs of the interfaces the packet leaves through, from the source router to the last router's interface onto the destination subnet. Incoming interfaces don't count."},
  {f:"ECMP in OSPF", b:"Equal lowest-cost paths are all installed (up to 4 by default, Maximum path: 4). CEF shares traffic per flow. Shown as extra [110/x] via lines under one route."},
  {f:"OSPF neighbour checklist", b:"Same area, same subnet and mask, matching hello/dead, unique router IDs, not passive. Real-world: network type, authentication, MTU. 'A Smart Hello Really Pays', then Never Assume the MTU."},
  {f:"Logged OSPF faults", b:"%OSPF-4-ERRRCV mismatched area ID; %OSPF-4-DUP_RTRID_NBR duplicate router ID; %OSPF-5-ADJCHG adjacency up (LOADING to FULL) or down (with reason)."},
  {f:"Silent OSPF faults and their evidence", b:"Hello/dead mismatch: Timer intervals line in show ip ospf interface. Mask mismatch: prefix lengths differ. Passive: show ip protocols Passive Interface(s) / No Hellos (Passive interface)."},
  {f:"Neighbour stuck in EXSTART or EXCHANGE", b:"Usually an MTU mismatch: hellos pass (MTU isn't in them) but database descriptions don't. Match the MTUs, or ip ospf mtu-ignore as a workaround."},
  {f:"Fixing a duplicate router ID", b:"On the wrong router: router ospf 1 → router-id <unique> → clear ip ospf process (answer yes). Drops that router's adjacencies briefly."},
  {f:"ABR", b:"Area Border Router: interfaces in area 0 and another area, one LSDB per area. Sends each area's prefixes into the others as Type 3 Summary LSAs. show ip protocols says 'It is an area border router'."},
  {f:"O vs O IA vs O E2", b:"O: intra-area (Types 1 and 2). O IA: inter-area, from an ABR's Type 3 Summary LSA. O E2: external, from an ASBR's Type 5 LSA (e.g. default-information originate)."},
],
});
// ---------- Module 5 · Lesson 7 ----------
L.push({
id:"fhrp", mins:85, level:"Beginner+ · builds on Module 5 lessons 1–6",
t:"First-hop redundancy: HSRP (with VRRP and GLBP compared) — virtual IP and MAC, priority, preempt, failover",
html:`
${K.goals([
  `Explain to a manager why a second router on a LAN does nothing for users until a ${K.g("first-hop redundancy protocol (FHRP)","A protocol that lets routers share one default-gateway address, so hosts keep working when one router fails. HSRP, VRRP and GLBP are the CCNA three.")} is configured.`,
  `Predict which ${K.g("HSRP","Hot Standby Router Protocol: Cisco's FHRP. One router is Active for a shared virtual IP; another is Standby, ready to take over.")} router becomes Active — and whether it hands the job back — from priorities, addresses, preempt and timing.`,
  "Configure and verify an HSRP group, and prove a failover: the PC's gateway IP and MAC never change while a different router forwards.",
  `Compare HSRP, ${K.g("VRRP","Virtual Router Redundancy Protocol: the open-standard (IETF) FHRP; roles are master and backup.")} and ${K.g("GLBP","Gateway Load Balancing Protocol: a Cisco FHRP that shares one gateway address but spreads hosts across several routers.")} and choose one for a site.`,
])}
${K.pre(["Module 2: ARP and MAC learning. Module 3: the default gateway and hex. Module 4: SVIs (lesson 3) and the STP root (lesson 5). Module 5 lessons 1–4: the routing table and OSPF (the bench's OSPF is pre-built)."])}

<h2>Why this matters at work</h2>
<p>A microfinance bank branch in Wuse 2, Abuja, must never go offline, so it has two routers: ABJ-R1 on MainOne fibre and ABJ-R2 on an MTN backup link, both on the same branch switch. On paper it survives the loss of either.</p>
<p>At 10:20 on a Tuesday a power surge kills ABJ-R1's power supply and every teller screen freezes. ABJ-R2 is up, its link is fine — and no PC uses it, because DHCP told every PC &ldquo;your default gateway is 192.168.10.2&rdquo;: ABJ-R1's address. The fix is a ${K.g("first-hop redundancy protocol","A protocol that keeps the default gateway (the first hop out of a subnet) working when a router fails, by making the gateway address shared and movable.")}: both routers share one gateway address that belongs to neither, and when one dies the other takes it over within seconds. You'll meet one on almost every network with two gateways — branch routers, core switch pairs, data centres — and &ldquo;which router is active, and why?&rdquo; is a favourite exam and interview question.</p>

<h2>The single-gateway problem: why a second router isn't enough</h2>
<p>Recall Module 3. A PC compares each destination with its own subnet. Same subnet: it ARPs for the destination and sends straight to it. Different subnet: it sends to its <b>default gateway</b> — it ARPs for the gateway's IP once, caches the MAC, and addresses every off-subnet frame to that MAC.</p>
<p>Notice what the host does <i>not</i> do. It doesn't ask which routers exist, run a routing protocol, or check that its gateway is alive. It has one gateway address, typed in or from DHCP, and uses it until someone changes it. (Windows has a limited &ldquo;dead gateway detection&rdquo;, but it's slow and partial — and printers, cameras and card terminals have exactly one gateway.)</p>
${K.remember(`<b>The host rule:</b> a host sends every off-subnet packet to <b>one gateway IP</b>, using the <b>one MAC</b> that ARP returned for it, and never checks whether that router is alive or whether a better one exists. So gateway redundancy must be <b>invisible to the host</b>: keep the gateway's IP and MAC the same, and change which router is behind them.`)}
<p>So the router behind the gateway address is a ${K.g("single point of failure","A part whose failure alone stops the whole service.")}, and the obvious workarounds are poor: re-pointing hosts by hand or DHCP takes minutes to hours, and giving half the PCs R1 and half R2 still leaves half the office down when R1 dies.</p>
${K.svg("0 0 720 345",
  K.dev("cloud",300,40,"","")+K.txt(268,30,"head office / internet",{end:true,s:10.5})+
  K.dev("router",150,110,"ABJ-R1","192.168.10.2 · dead")+K.dev("router",450,110,"ABJ-R2","192.168.10.3 · healthy")+
  K.txt(150,86,"✗",{c:"bad",s:30,mid:true,f:"body",b:true})+
  K.link(172,100,278,54)+K.link(428,100,322,54)+
  K.dev("switch",300,200,"SW1","")+
  K.link(285,189,174,114)+K.link(315,189,426,114)+
  K.dev("pc",160,285,"TELLER-01","gw .2")+K.dev("pc",300,285,"TELLER-02","gw .2")+K.dev("pc",440,285,"PRINTER","gw .2")+
  K.link(290,211,165,265)+K.link(300,211,300,265)+K.link(310,211,435,265)+
  K.txt(545,120,"1  R1's power supply fails",{f:"body",s:11.5,c:"fg"})+
  K.txt(545,145,"2  every host still sends to .2",{f:"body",s:11.5,c:"fg"})+
  K.txt(545,170,"3  ARP for .2 gets no answer",{f:"body",s:11.5,c:"fg"})+
  K.txt(545,195,"4  R2 is up — nobody asks it",{f:"body",s:11.5,c:"warn"})+
  K.txt(545,220,"5  branch offline",{f:"body",s:11.5,c:"bad",b:true}),
  "The single-gateway problem: when the router that owns 192.168.10.2 dies, every host keeps ARPing for it and the healthy router is never used.")}
${K.check({q:"R1 (10.4.4.1) and R2 (10.4.4.2) share a LAN with no FHRP; every PC's gateway is 10.4.4.1. R1's LAN cable is unplugged. What happens to the PCs' traffic to head office?", o:["It moves to R2 automatically, because R2 is on the same subnet","It stops: the PCs keep sending to 10.4.4.1, ARP for it fails, and nothing tells them R2 exists","It moves to R2 after OSPF reconverges","Half of it moves to R2, because the switch load-balances"], a:1, why:"Hosts have one gateway IP and don't run routing protocols. OSPF reconverging between the routers changes nothing for PCs that still point at 10.4.4.1."})}
<p><b>Same logic, new situation.</b></p>
${K.hint(`Ask what each host has been told its gateway is. A router only helps a host if the host sends to it.`)}
${K.reveal("An Apapa warehouse has two internet routers, ISP-1 (172.20.0.1) and ISP-2 (172.20.0.254). DHCP hands out .1; the forklift scanners have .254 typed in. ISP-1's router hangs. Who keeps working?",`<ol>
<li><b>What is being asked?</b> Which hosts survive one router failing.</li>
<li><b>Which rule applies?</b> The host rule: each host uses only the gateway it was given and never looks for another.</li>
<li><b>Apply it.</b> Every DHCP client points at the dead 172.20.0.1, so all of them are cut off although ISP-2 is fine. The scanners point at .254 and carry on. Two routers, no redundancy: each group of hosts depends on exactly one of them.</li></ol>`)}

<h2>The FHRP idea: one virtual gateway, shared by a group</h2>
<p>If the host can't move, move the gateway. An FHRP makes a group of routers on a subnet act as one imaginary ${K.g("virtual router","The gateway an FHRP group presents to hosts: a virtual IP and virtual MAC that whichever router is in charge answers for.")}, defined by two things:</p>
<ul>
<li>A ${K.g("virtual IP address (VIP)","The shared gateway address of an FHRP group; it belongs to no single router.")} — an unused address in the subnet that hosts use as their gateway. In Abuja: <code>192.168.10.1</code>.</li>
<li>A ${K.g("virtual MAC address","A MAC the FHRP group generates from its group number; the router in charge answers ARP for the VIP with it.")} — generated from the group number. ARP for the VIP returns this MAC.</li>
</ul>
<p>The routers keep their real addresses (<code>.2</code> and <code>.3</code>) for management and routing. On top, HSRP elects an ${K.g("Active router","The HSRP router that owns the virtual IP and MAC: it answers ARP for the VIP and forwards frames sent to the virtual MAC.")}, which answers ARP for the VIP with the virtual MAC and forwards every frame sent to it, and a ${K.g("Standby router","The HSRP router next in line: it listens to the Active's hellos and takes over if they stop.")}, which forwards nothing for the group but listens.</p>
<p>They exchange ${K.g("hellos","Small periodic 'I'm alive, here is my priority and state' messages between FHRP routers.")} every few seconds, sent to a ${K.g("multicast","Traffic sent to a group address, received by every device listening for that group.")} address. If the Standby stops hearing the Active for long enough, it takes over the VIP and virtual MAC and starts forwarding. It also sends a ${K.g("gratuitous ARP","An ARP reply nobody asked for, announcing 'this IP is at this MAC'.")} — &ldquo;192.168.10.1 is at 0000.0c07.ac0a&rdquo; — from its own port, so every switch relearns the virtual MAC there (Module 2: switches learn from the source MAC).</p>
${K.svg("0 0 720 380",
  K.dev("router",170,70,"ABJ-R1 · Active","192.168.10.2 · pri 110")+
  K.dev("router",550,70,"ABJ-R2 · Standby","192.168.10.3 · pri 100")+
  K.arrow(250,56,470,56,"hello every 3 s",true)+K.arrow(470,72,250,72,"")+
  K.txt(360,92,"to 224.0.0.2 · UDP 1985 · hold time 10 s",{mid:true,s:10})+
  K.box(270,132,180,52,"virtual router","192.168.10.1 · 0000.0c07.ac0a",true)+
  K.link(205,80,275,132,"",true)+K.link(515,80,445,132,"",true)+
  K.txt(160,178,"owns it now",{c:"ok",s:10.5,end:true,f:"body"})+K.txt(560,178,"takes it if R1 goes quiet",{s:10.5,f:"body"})+
  K.txt(360,204,"what every host uses as its gateway",{mid:true,s:10.5,c:"accent",f:"body"})+
  K.link(170,125,170,245)+K.link(170,245,333,245)+K.link(550,125,550,245)+K.link(550,245,387,245)+
  K.dev("switch",360,245,"SW1","")+
  K.dev("pc",280,322,"TELLER-04","gw 192.168.10.1")+K.dev("pc",440,322,"TELLER-05","gw 192.168.10.1")+
  K.link(350,256,285,302)+K.link(370,256,435,302),
  "An HSRP group. Both routers keep their real addresses; the virtual router (192.168.10.1 and its virtual MAC) belongs to whichever router is Active.")}
${K.analogy(`<p>A bank's helpline has one number printed on every card. One agent is on duty; a second sits beside them. If the first collapses, the second picks up the next call — and customers dial the same number. The number is the virtual IP; the agent on duty is the Active router.</p>`)}
<h3>What the PC sees — and what it never sees</h3>
<p>From the PC, HSRP is invisible:</p>
${K.out(`C:\\>ipconfig

Windows IP Configuration

Ethernet adapter Ethernet:

   IPv4 Address. . . . . . . . . . . : 192.168.10.54
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.1

C:\\>arp -a

Interface: 192.168.10.54 --- 0x4
  Internet Address      Physical Address      Type
  192.168.10.1          00-00-0c-07-ac-0a     dynamic
  192.168.10.255        ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static`, "TELLER-04: the gateway is the VIP, and its ARP entry is the virtual MAC, not either router's own MAC.")}
<ul>
<li><b>Default Gateway 192.168.10.1</b> — the VIP. DHCP must hand out this, not a router's real address.</li>
<li><b>00-00-0c-07-ac-0a</b> — <code>0000.0c07.ac0a</code> in Cisco notation; the next section shows where it comes from.</li>
<li><b>After a failover this line is identical</b>; the switch simply delivers frames for <code>0000.0c07.ac0a</code> to ABJ-R2's port now.</li>
</ul>
${K.dyk(`<code>tracert</code> gives the game away. Its first hop is the <b>real</b> address of whichever router is Active — <code>192.168.10.2</code> while ABJ-R1 is in charge, <code>.3</code> after a failover — because the reply comes from the router's own interface, not the VIP.`)}
${K.remember(`<b>The VIP and virtual MAC are the gateway's identity; the routers just take turns wearing it.</b>`)}
${K.check({q:"In an HSRP group, which device answers a PC's ARP request for the virtual IP address?", o:["Both routers, so the PC can pick one","The Active router, with the group's virtual MAC address","The Standby router, so the Active router is not overloaded","The switch, from its MAC address table"], a:1, why:"Only the Active router owns the virtual IP and MAC, so only it answers. The Standby stays silent until it takes over."})}
<p><b>Same logic, new situation</b> — Layer 3 switches this time.</p>
${K.q({type:"multi", q:"DSW1 and DSW2 run HSRP on their Vlan20 SVIs, virtual IP 10.2.20.1. A laptop in VLAN 20 works through DSW1 (Active). DSW1 loses power and DSW2 takes over. Which two things are exactly the same for the laptop afterwards? (Choose two.)", o:["Its default gateway address, 10.2.20.1","The MAC address in its ARP entry for 10.2.20.1","The first hop listed by tracert","The switch port where the access switch has learned the virtual MAC","The device that actually forwards its packets"], a:[0,1], why:"The laptop only knows the gateway IP and its ARP-learned MAC; the FHRP keeps both. Behind them, DSW2 forwards now, the access switch relearns the virtual MAC towards DSW2 (gratuitous ARP), and tracert's first hop becomes DSW2's real Vlan20 address."})}

<h2>HSRP's rules: versions, timers, priority, preempt and states</h2>
<p>HSRP is Cisco-proprietary (described in an informational RFC, 2281) and the FHRP the CCNA tests in detail. Everything it does follows from a handful of rules.</p>
<h3>Versions, and where the virtual MAC comes from</h3>
<div class="tablewrap"><table>
<tr><th></th><th>HSRP version 1 (default)</th><th>HSRP version 2</th></tr>
<tr><td>Group numbers</td><td>0–255</td><td>0–4095 (so groups can match VLAN numbers)</td></tr>
<tr><td>Hellos sent to</td><td>224.0.0.2 (all routers), UDP 1985</td><td>224.0.0.102, UDP 1985</td></tr>
<tr><td>Virtual MAC</td><td><code>0000.0c07.acxx</code> — xx = group in hex (2 digits)</td><td><code>0000.0c9f.fxxx</code> — xxx = group in hex (3 digits)</td></tr>
<tr><td>IPv6</td><td>No</td><td>Yes</td></tr>
</table></div>
<p>The versions don't interoperate (different multicast addresses and formats), so <b>every router in a group must run the same version</b>; the interface command is <code>standby version 2</code>. On real kit a mismatch leaves both routers Active (dual active, below); the lab doesn't model it — its routers still form one group.</p>
${K.steps([
  ["Take the group number", "Abuja uses group <b>10</b>."],
  ["Convert it to hex (Module 3)", "10 = <b>0a</b>. (30 = 16 + 14 = <b>1e</b>.)"],
  ["Version 1: two hex digits after 0000.0c07.ac", "Group 10 → <code>0000.0c07.ac0a</code>."],
  ["Version 2: three hex digits after 0000.0c9f.f", "Group 10 → <code>0000.0c9f.f00a</code>; group 4095 → <code>0000.0c9f.ffff</code>."],
])}
${K.mistake(`Writing the group number in decimal: group 10 is <code>0000.0c07.ac0a</code>, not <code>ac10</code>. <code>ac10</code> is group 16. Exams love this one.`)}
<h3>Hellos, the hold time, and three kinds of message</h3>
<p>The Active and Standby each send a hello every <b>3 seconds</b>. The ${K.g("hold time","How long an HSRP router waits without a hello before declaring the sender dead (default 10 s).")} is <b>10 seconds</b>. That explains failover times at work:</p>
<ul>
<li><b>Sudden failure</b> (power cut, crash, cable pulled): the Standby waits out the hold time — up to about <b>10 seconds</b> of lost packets.</li>
<li><b>Graceful exit</b> (interface shut, HSRP removed): the Active sends a ${K.g("Resign","An HSRP message the Active sends when giving up the role, so the Standby takes over at once.")} message and the Standby takes over almost at once.</li>
<li><b>A better router arrives</b>: with a higher priority and preempt, it sends a ${K.g("Coup","An HSRP message a higher-priority, preempting router sends to take the Active role.")} message; the Active resigns.</li>
</ul>
<h3>Priority and the election</h3>
<p>Each router has a ${K.g("priority","0–255 per HSRP group, default 100; highest wins the election.")} from 0 to 255, default <b>100</b>. When the group needs an Active router, the highest priority wins; a tie goes to the <b>highest IP address</b> on that interface. The runner-up becomes Standby; any others wait in Listen.</p>
<h3>Preempt: the rule that surprises everyone</h3>
<p>Here is the part people get wrong. <b>An election only happens when there is no Active router.</b> A sitting Active router keeps the job, even against a higher priority, unless the challenger has ${K.g("preempt","standby N preempt: lets a higher-priority router take the Active role from a lower-priority one. Off by default in HSRP.")} configured — and preempt is <b>off by default</b>.</p>
${K.remember(`<b>The HSRP election rule:</b> (1) No Active router? The highest priority wins; tie → highest interface IP. (2) Already an Active router? It keeps the job — unless a router with a <b>higher priority</b> and <b>preempt</b> configured is present; that router takes over. Priority decides <i>who should</i> be Active; preempt decides whether a better router <i>takes</i> the job.`)}
<p>Why that default? Every change of Active costs a few packets: a faulty router that keeps rebooting would grab the gateway each time it returns, and a freshly booted router may not have learned its routes yet. Without preempt, a returning router joins quietly as Standby.</p>
<p>Why you usually turn it on anyway: designs have a primary — the one with the fibre, or the STP root for that VLAN. Without preempt, after any failure the backup stays Active <b>for ever</b>. So the normal practice is a higher priority (say 110) <b>and</b> <code>standby N preempt</code> on the primary. (Real IOS can also delay preemption — <code>standby 10 preempt delay minimum 60</code> — so the router learns its routes first; the lab doesn't model it.)</p>
${K.steps([
  ["08:00 — both routers boot together", "No Active yet, so an election: ABJ-R1 (110) beats ABJ-R2 (100)."],
  ["10:20 — R1's power supply dies", "R2 hears no hello for 10 s and becomes Active; its gratuitous ARP moves 0000.0c07.ac0a to its port on SW1. Tellers lose a few seconds."],
  ["11:05 — R1 is repaired and boots", "R2 is already Active. <b>Without preempt</b>, R1 joins as Standby and R2 keeps forwarding over the backup link indefinitely."],
  ["…with preempt on R1", "R1 outranks R2 (110 &gt; 100) and sends a Coup; R2 resigns and traffic returns to the fibre."],
])}
<h3>The states, and the log line that proves a change</h3>
<p>An HSRP router climbs through six states; you'll mostly see the last three, but all six appear in logs and exams.</p>
${K.svg("0 0 760 160",
  [["Initial","just started"],["Learn","no VIP heard yet"],["Listen","knows VIP, waits"],["Speak","sends hellos, elects"],["Standby","next in line"],["Active","owns VIP + vMAC"]]
  .map((s,i)=>K.box(10+i*125,20,110,56,s[0],s[1],i===5)+(i<5?K.arrow(120+i*125,48,135+i*125,48):"")).join("")+
  K.txt(10,108,"Only the Active and Standby routers keep sending hellos; a third or fourth router waits in Listen.",{f:"body",s:11.5,c:"fg"})+
  K.txt(10,132,"Interface shut, or 10 s with no hello from the Active: the Standby becomes Active, and a Listen router moves up to Standby.",{f:"body",s:11.5}),
  "HSRP states: the election in Speak makes a router Standby or Active, or sends it back to Listen.")}
${K.remember(`<b>&ldquo;I Learn, Listen, Speak, Stand by — then Act.&rdquo;</b> Initial, Learn, Listen, Speak, Standby, Active.`)}
<p>Every role change is logged as <code>%HSRP-5-STATECHANGE</code>. If someone shuts ABJ-R1's LAN interface, the routers log:</p>
${K.out(`ABJ-R1#show logging
...
*Oct 11 10:20:14.203: %HSRP-5-STATECHANGE: GigabitEthernet0/0 Grp 10 state Active -> Init

ABJ-R2#show logging
...
*Oct 11 08:02:41.118: %HSRP-5-STATECHANGE: GigabitEthernet0/0 Grp 10 state Speak -> Standby
*Oct 11 10:20:14.221: %HSRP-5-STATECHANGE: GigabitEthernet0/0 Grp 10 state Standby -> Active`, "Which interface, which group, from which state to which. R2 took over within milliseconds because R1 resigned as its interface went down.")}
<ul>
<li><b>%HSRP-5-STATECHANGE</b> — severity 5 (notification), logged per interface and group (a router can be Active for one group, Standby for another).</li>
<li><b>Active -&gt; Init</b> on R1 — its interface went down, so it left the group.</li>
<li><b>Standby -&gt; Active</b> on R2 — the moment of failover. &ldquo;When did it fail over?&rdquo; — this timestamp.</li>
</ul>
${K.check({q:"R1 (priority 120, no preempt) and R2 (priority 100) share an HSRP group. R2 was configured and became Active first; R1 joined an hour later. Which router is Active now?", o:["R1, because 120 is higher than 100","R2, because there was already an Active router and R1 has no preempt","R1, because it has the higher IP address","Both, until the hold time expires"], a:1, why:"The election only runs when there is no Active router. R2 was already Active, so without preempt R1's higher priority only makes it Standby."})}
<p><b>Same logic, new situation</b> — four routers, nobody Active yet.</p>
${K.hint(`A straight election: priority first, then highest IP. Pick Active, then apply the same rules to the rest for Standby.`)}
${K.q({type:"fill", q:"Four routers boot at the same moment and form HSRP group 5 on 10.8.0.0/24: RA 10.8.0.11 priority 100, RB 10.8.0.12 priority 150, RC 10.8.0.13 priority 150, RD 10.8.0.14 priority 90. Which router becomes Active, and which becomes Standby?", fields:[{label:"Active", a:["RC","rc"]},{label:"Standby", a:["RB","rb"]}], why:"1. Asked: a fresh election. 2. Rule: highest priority, tie → highest IP. 3. Apply: RB and RC tie on 150; RC's .13 beats .12, so RC is Active. Of the rest, RB (150) is highest, so RB is Standby; RA and RD sit in Listen."})}
${K.hint(`This time someone is already Active. Ask: is there a router with a higher priority <i>and</i> preempt?`)}
${K.reveal("Same group, a week later. RC is Active and RB is Standby. RC reboots; while it is down, RB takes over. RC comes back with priority 150 and no preempt. Then an engineer raises RA to priority 200 and adds preempt. Who ends up Active?",`<ol>
<li><b>What is being asked?</b> The Active router after two events, not a fresh election.</li>
<li><b>Which rule applies?</b> An Active router keeps the job unless a router with a higher priority <i>and</i> preempt is present.</li>
<li><b>Apply it.</b> RC reboots, so RB (Standby) becomes Active. RC returns with 150 — not higher than RB's 150, and with no preempt anyway — so RB stays Active. Then RA gets 200 + preempt: higher than RB's 150, so RA sends a Coup and becomes <b>Active</b>. Note that RC never got the job back, despite winning the original election.</li></ol>`)}
${K.exam(`Reading an FHRP question: <b>1. What is asked</b> — who is Active <i>now</i>, which MAC the host holds, how long failover takes? <b>2. Which rule</b> — fresh election (priority, then IP), sitting Active (preempt decides), timers, or virtual MAC (group in hex)? <b>3. Work it through</b> in time order. Classic trap: &ldquo;R1 has the highest priority&rdquo; but no <code>P</code> flag, or R1 joined late.`)}

<h2>Configuring and verifying HSRP</h2>
<p>HSRP is configured on the LAN-facing interface (router port, subinterface or SVI) of every router in the group. Abuja, with ABJ-R1 as primary because it has the fibre:</p>
${K.out(`ABJ-R1(config)#interface g0/0
ABJ-R1(config-if)#ip address 192.168.10.2 255.255.255.0
ABJ-R1(config-if)#standby 10 ip 192.168.10.1
ABJ-R1(config-if)#standby 10 priority 110
ABJ-R1(config-if)#standby 10 preempt
ABJ-R1(config-if)#no shutdown
ABJ-R1(config-if)#end

ABJ-R2(config)#interface g0/0
ABJ-R2(config-if)#ip address 192.168.10.3 255.255.255.0
ABJ-R2(config-if)#standby 10 ip 192.168.10.1
ABJ-R2(config-if)#no shutdown
ABJ-R2(config-if)#end`, "Group 10 on both routers, the same virtual IP, a higher priority and preempt on the primary. ABJ-R2 keeps the default priority of 100.")}
<ul>
<li><b><code>standby 10 ip 192.168.10.1</code></b> — join group 10 with this virtual IP. It must be in the interface's subnet (IOS only warns <code>% Warning: address is not within a subnet on this interface</code> and accepts it, but the group then sits in Init and never sends a hello — the lab does the same), must not be a router's real address, and must match on every member, as must the group number.</li>
<li><b><code>standby 10 priority 110</code></b> — make ABJ-R1 preferred; anything above 100 works.</li>
<li><b><code>standby 10 preempt</code></b> — let ABJ-R1 take the job back after a failure. (Many engineers add it to both routers; on the lower-priority one it changes nothing.)</li>
<li><b>Optional <code>standby version 2</code></b> — on every member together, for groups above 255 or IPv6.</li>
</ul>
${K.mistake(`Leaving the DHCP scope (or a printer's static setting) pointing at a router's <i>real</i> address. Everything looks fine until that router fails and those hosts go down exactly as before. Check <code>ipconfig</code> on a few hosts: the gateway must be the VIP.`)}
<h3>Reading show standby brief</h3>
${K.out(`ABJ-R1#show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       10   110 P Active  local           192.168.10.3    192.168.10.1

ABJ-R2#show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       10   100   Standby 192.168.10.2    local           192.168.10.1`, "One line per group per interface. Run it on both routers: each describes the group from its own point of view.")}
<ul>
<li><b>Pri</b> — this router's priority; <b>P</b> — preempt configured here (blank on ABJ-R2).</li>
<li><b>State</b> — this router's role: <code>Active</code>, <code>Standby</code>, <code>Listen</code>, or <code>Init</code> if the interface is down or the group can't start (a virtual IP outside the interface's subnet).</li>
<li><b>Active / Standby</b> — <code>local</code> means &ldquo;me&rdquo;; otherwise the peer's <i>real</i> address. <code>unknown</code> means this router hears nobody in that role.</li>
</ul>
<p>A healthy pair reads like a mirror. If <b>both</b> say <code>Active</code> with <code>Standby unknown</code>, they can't hear each other's hellos — a ${K.g("dual active","Two routers both Active because neither hears the other's hellos.")} fault. Look between them: a port in the wrong VLAN, a trunk not carrying it, a different group number, or one router on version 2.</p>
<h3>Reading show standby</h3>
${K.out(`ABJ-R2#show standby
GigabitEthernet0/0 - Group 10
  State is Standby
    2 state changes, last state change 00:03:14
  Virtual IP address is 192.168.10.1
  Active virtual MAC address is 0000.0c07.ac0a
    Local virtual MAC address is 0000.0c07.ac0a (v1 default)
  Hello time 3 sec, hold time 10 sec
    Next hello sent in 1.264 secs
  Preemption disabled
  Active router is 192.168.10.2, priority 110 (expires in 8.912 sec)
  Standby router is local
  Priority 100 (default 100)
  Group name is "hsrp-Gi0/0-10" (default)`, "The detailed view from the Standby router.")}
<ul>
<li><b>State changes, last state change</b> — a recent change you didn't expect means something flapped.</li>
<li><b>Virtual MAC 0000.0c07.ac0a (v1 default)</b> — group 10 in hex. <b>Hello 3, hold 10</b> — the defaults.</li>
<li><b>Active router is 192.168.10.2 … (expires in 8.912 sec)</b> — the countdown restarts at every hello; if it reaches zero, this router takes over.</li>
</ul>
<h3>Try it: pre-stage a gateway before it ships to Kaduna</h3>
<p>KAD-GW2, a new gateway for the Kaduna office, is on your bench before it ships; its LAN port Gi0/1 is <code>172.16.8.3/24</code>. The change request: HSRP group 15, version 2, priority 120 with preempt (it will be the new primary), virtual IP &ldquo;172.16.9.1&rdquo;. The Kaduna PCs' gateway is <code>172.16.8.1</code> — the virtual IP of the office's existing group 15, where the old gateway is Active at priority 100. Spot the problem before it reaches site.</p>
${K.hint(`A virtual IP must belong to the interface's subnet. Which subnet is 172.16.8.3/24 in? Then work out the version 2 virtual MAC for group 15: 15 = f in hex, padded to three digits.`)}
${K.term({env:"ios2", title:"KAD-GW2 — HSRP group 15, version 2, on the bench", opts:{kind:"router", host:"KAD-GW2", motd:"KAD-GW2 — bench pre-staging for the Kaduna office. Gi0/1 = office LAN. (Alone on the bench, this router has no HSRP peer to hear.)"},
  setup:e=>{ ["enable","configure terminal","interface g0/1","description KADUNA OFFICE LAN","ip address 172.16.8.3 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.log.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code> and <code>show ip interface brief</code>.",
  tasks:[
    {text:"<code>show ip interface brief</code> — Gi0/1 is <code>172.16.8.3</code>, up/up", done:e=>e.log.some(l=>/GigabitEthernet0\/1\s+172\.16\.8\.3\s+YES\s+\S+\s+up\s+up/.test(l.out))},
    {text:"On Gi0/1, try the change request as written: <code>standby 15 ip 172.16.9.1</code>. IOS accepts it, but read the warning it prints — why is the address wrong?", done:e=>e.log.some(l=>/standby\s+15\s+ip\s+172\.16\.9\.1/i.test(l.cmd||"") && /% Warning: address is not within a subnet on this interface/.test(l.out||""))},
    {text:"<code>do show standby brief</code>: group 15 sits in <code>Init</code>, with Active and Standby <code>unknown</code>. A group whose virtual IP isn't on the subnet never starts — on site it would never send a hello", done:e=>e.log.some(l=>/Gi0\/1\s+15\s+\d+\s+P?\s*Init\s+unknown\s+unknown\s+172\.16\.9\.1/.test(l.out||""))},
    {text:"Correct it to what the site actually needs: <code>standby version 2</code> and <code>standby 15 ip 172.16.8.1</code> (typing the group's <code>ip</code> again replaces the address)", done:e=>{ const i = e.intfs["GigabitEthernet0/1"]; return i.hsrpVer===2 && !!(i.hsrp && i.hsrp[15] && i.hsrp[15].ip==="172.16.8.1"); }},
    {text:"Make it the primary: priority 120, and preempt so it takes over from the old gateway once it's in place", done:e=>{ const h = (e.intfs["GigabitEthernet0/1"].hsrp||{})[15]; return !!(h && h.prio===120 && h.preempt); }},
    {text:"<code>show standby</code> — find the line with the version 2 virtual MAC (<code>0000.0c9f.f00f</code>: group 15 = hex f)", done:e=>e.log.some(l=>/Active virtual MAC address is 0000\.0c9f\.f00f/.test(l.out))},
    {text:"<code>show standby brief</code> — notice <code>Standby unknown</code>: alone on the bench there is no one to hear", done:e=>e.log.some(l=>/Gi0\/1\s+15\s+120\s+P\s+Active\s+local\s+unknown\s+172\.16\.8\.1/.test(l.out))},
    {text:"Save the configuration", done:e=>!!e.savedOnce},
  ],
  win:"You caught a typo before it reached site — IOS accepted the out-of-subnet VIP with only a warning and the group sat in Init, so the VIP has to be in the interface's subnet — then configured a version 2 group with priority and preempt, and read the version 2 virtual MAC straight off the router. In Kaduna, this router will hear the old gateway's hellos, see its own 120 + preempt, and take over with a Coup.",
  solve:["enable","show ip interface brief","configure terminal","interface g0/1","standby 15 ip 172.16.9.1","do show standby brief","standby version 2","standby 15 ip 172.16.8.1","standby 15 priority 120","standby 15 preempt","end","show standby","show standby brief","copy running-config startup-config",""]})}
<p>Alone on the bench, KAD-GW2 heard no hellos and elected itself. At Kaduna, next to the old gateway (Active, priority 100), it would join as Standby and then, because 120 &gt; 100 with preempt, take over. Without preempt it would stay Standby however high its priority.</p>
${K.check({q:"On both R1 and R2, show standby brief says Active, local, Standby unknown for group 20 (VIP 10.20.0.1). Users report intermittent problems. What is the most likely cause?", o:["Normal operation: both routers forward to share the load","R1 is missing preempt","R1 and R2 can't hear each other's hellos — a Layer 2 fault between them, or an HSRP version mismatch — so both are Active","The hold time is too long"], a:2, why:"Both Active with 'Standby unknown' is the dual-active fingerprint: each thinks it's alone. Both name group 20, so check the Layer 2 path between them and the HSRP version."})}
<p><b>Same logic, new situation</b> — a bigger group number.</p>
${K.q({type:"fill", q:"A data centre uses HSRP group 200 on VLAN 200. What is the virtual MAC with version 1, and what would it be with version 2?", fields:[{label:"Version 1", a:["0000.0c07.acc8","0000.0C07.ACC8","00-00-0c-07-ac-c8"]},{label:"Version 2", a:["0000.0c9f.f0c8","0000.0C9F.F0C8","00-00-0c-9f-f0-c8"]}], why:"1. Asked: one group's MAC in both versions. 2. Rule: v1 = 0000.0c07.ac + two hex digits; v2 = 0000.0c9f.f + three. 3. Apply: 200 = 12×16 + 8 = c8, so 0000.0c07.acc8 and 0000.0c9f.f0c8."})}

<h2>Hands-on: fail the gateway while a PC keeps pinging</h2>
<p>A Lagos managed-service provider looks after a clinic in Yaba with two gateways, GW-A and GW-B, on its staff LAN (<code>10.20.30.0/24</code>), both linked to a CORE router in front of the patient-records server (<code>172.16.40.10</code>). OSPF already runs between the three, so CORE always knows a way back to the LAN. The client wants HSRP group 30 with the gateway at the top of the subnet, <code>10.20.30.254</code>. Today PC1 uses GW-A's own address, <code>.252</code>.</p>
<p>Prove the single-gateway problem, build HSRP, fail the Active router while PC1 pings, bring it back and watch what preempt does — and doesn't do. The frame log is open: watch which router answers ARP for the gateway.</p>
${K.bench({id:"m5-hsrp-failover", points:100, from:"CCNA · Module 5 · lesson 7", title:"two gateways, one virtual IP — fail one and keep pinging", viewBox:"0 0 900 360", openLog:true,
  intro:"Each laptop is already cabled to a router's console port (LAPTOP-A → GW-A, LAPTOP-B → GW-B): open its terminal app at 9600 8N1, no flow control. Reconnecting a console starts a fresh session at the <code>&gt;</code> prompt, so type <code>enable</code> again each time. Use PC1's Command Prompt for ping, tracert and arp -a, and its IP settings to change the gateway. CORE is configured and needs no changes.",
  devices:[
    {id:"lapa", kind:"laptop", label:"LAPTOP-A", x:0, y:10},
    {id:"gwa", kind:"router", label:"GW-A", x:120, y:10,
      config:e=>{ ["en","conf t","hostname GW-A","interface g0/0","description CLINIC STAFF LAN","ip address 10.20.30.252 255.255.255.0","no shutdown","interface g0/1","description UPLINK to CORE","ip address 10.0.0.1 255.255.255.252","no shutdown","router ospf 1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"core", kind:"router", label:"CORE", x:340, y:10,
      config:e=>{ ["en","conf t","hostname CORE","interface g0/1","ip address 10.0.0.2 255.255.255.252","no shutdown","interface g0/2","ip address 10.0.0.6 255.255.255.252","no shutdown","interface g0/0","description RECORDS SERVER","ip address 172.16.40.1 255.255.255.0","no shutdown","router ospf 1","network 10.0.0.0 0.255.255.255 area 0","network 172.16.40.0 0.0.0.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"gwb", kind:"router", label:"GW-B", x:560, y:10,
      config:e=>{ ["en","conf t","hostname GW-B","interface g0/0","description CLINIC STAFF LAN","ip address 10.20.30.253 255.255.255.0","no shutdown","interface g0/1","description UPLINK to CORE","ip address 10.0.0.5 255.255.255.252","no shutdown","router ospf 1","network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lapb", kind:"laptop", label:"LAPTOP-B", x:780, y:10},
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · clinic LAN", x:60, y:140},
    {id:"srv", kind:"server", label:"RECORDS", x:560, y:140, ip:"172.16.40.10", mask:"255.255.255.0", gw:"172.16.40.1"},
    {id:"pc1", kind:"pc", label:"PC1", x:200, y:250, ip:"10.20.30.50", mask:"255.255.255.0", gw:"10.20.30.252", mac:"a4bb.6d30.0050"},
  ],
  cables:[ {type:"cat6", a:"gwa:g0", b:"sw1:g1"}, {type:"cat6", a:"gwb:g0", b:"sw1:g2"}, {type:"cat6", a:"pc1:eth", b:"sw1:g3"},
           {type:"cat6", a:"gwa:g1", b:"core:g1"}, {type:"cat6", a:"gwb:g1", b:"core:g2"}, {type:"cat6", a:"srv:eth", b:"core:g0"},
           {type:"console", a:"lapa:usb", b:"gwa:con"}, {type:"console", a:"lapb:usb", b:"gwb:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Console into GW-A from LAPTOP-A (9600 8N1, no flow control) and <code>enable</code>", done:B=>Bench.consoleOk(B,"gwa")},
    {text:"Before HSRP: PC1's gateway is GW-A's own address, 10.20.30.252. From PC1, <code>ping 172.16.40.10</code> — it works", done:B=>B.devs.pc1.gw==="10.20.30.252" && Bench.pinged(B,"pc1","172.16.40.10")},
    {text:"The single-gateway problem: on GW-A, <code>interface g0/0</code> → <code>shutdown</code>. Ping the server from PC1 again — it fails, although GW-B is up", done:B=>B.devs.gwa.env.intfs["GigabitEthernet0/0"].shut && B.devs.pc1.gw==="10.20.30.252" && Bench.tried(B,"pc1",/^\s*ping\s+172\.16\.40\.10\s*$/i) && !Bench.pinged(B,"pc1","172.16.40.10")},
    {text:"Bring GW-A's Gi0/0 back (<code>no shutdown</code>), then on it: <code>standby 30 ip 10.20.30.254</code> and <code>standby 30 priority 110</code> — <b>no preempt yet</b>", done:B=>{ const i = B.devs.gwa.env.intfs["GigabitEthernet0/0"], h = (i.hsrp||{})[30]; return !i.shut && !!(h && h.ip==="10.20.30.254" && h.prio===110); }},
    {text:"Console into GW-B from LAPTOP-B; on its Gi0/0, <code>standby 30 ip 10.20.30.254</code> (leave the priority at the default)", done:B=>{ const h = (B.devs.gwb.env.intfs["GigabitEthernet0/0"].hsrp||{})[30]; return !!(h && h.ip==="10.20.30.254"); }},
    {text:"On GW-B, <code>show standby brief</code> — it is <code>Standby</code>, with Active <code>10.20.30.252</code>", done:B=>B.devs.gwb.env.log.some(l=>/Gi0\/0\s+30\s+100\s+Standby\s+10\.20\.30\.252\s+local\s+10\.20\.30\.254/.test(l.out))},
    {text:"Point PC1 at the virtual gateway (IP settings: gateway <code>10.20.30.254</code>), ping the server, then <code>arp -a</code>: the gateway's MAC is <code>00-00-0c-07-ac-1e</code> (group 30 = hex 1e)", done:B=>B.devs.pc1.gw==="10.20.30.254" && Bench.pinged(B,"pc1","172.16.40.10") && Bench.tried(B,"pc1",/^\s*arp\s+-a\s*$/i)},
    {text:"Failover: back on GW-A (LAPTOP-A), <code>shutdown</code> Gi0/0. From PC1, ping the server — replies keep coming — then <code>tracert 172.16.40.10</code>: the first hop is now <code>10.20.30.253</code>. (Run <code>arp -a</code> again too: the gateway's MAC hasn't changed.)", done:B=>B.devs.gwa.env.intfs["GigabitEthernet0/0"].shut && Bench.hsrpState(B,"gwb","GigabitEthernet0/0",30)==="Active" && B.devs.pc1.gw==="10.20.30.254" && Bench.pinged(B,"pc1","172.16.40.10") && Bench.traced(B,"pc1","172.16.40.10")},
    {text:"On GW-B: <code>show standby brief</code> (Active, local) and <code>show logging</code> — find <code>%HSRP-5-STATECHANGE … Grp 30 state Standby -&gt; Active</code>", done:B=>{ const L = B.devs.gwb.env.log; return L.some(l=>/Gi0\/0\s+30\s+100\s+Active\s+local/.test(l.out)) && L.some(l=>/Grp 30 state Standby -> Active/.test(l.out)); }},
    {text:"Bring GW-A's Gi0/0 back up and run <code>show standby brief</code> on GW-A: priority 110, yet only <code>Standby</code> — GW-B (100) keeps the job", done:B=>!B.devs.gwa.env.intfs["GigabitEthernet0/0"].shut && B.devs.gwa.env.log.some(l=>/Gi0\/0\s+30\s+110\s+Standby\s+10\.20\.30\.253\s+local/.test(l.out))},
    {text:"Add <code>standby 30 preempt</code> on GW-A's Gi0/0, then <code>show standby brief</code>: <code>110 P Active</code>", done:B=>{ const e = B.devs.gwa.env, h = (e.intfs["GigabitEthernet0/0"].hsrp||{})[30]; return !!(h && h.preempt) && Bench.hsrpState(B,"gwa","GigabitEthernet0/0",30)==="Active" && e.log.some(l=>/Gi0\/0\s+30\s+110\s+P\s+Active\s+local/.test(l.out)); }},
    {text:"Save the configuration on both gateways", done:B=>!!B.devs.gwa.env.savedOnce && !!B.devs.gwb.env.savedOnce},
  ],
  win:"You watched the whole story: one gateway address and a healthy second router that nobody could use; then a virtual gateway that survived its Active router going away, with PC1's gateway IP and MAC never changing; then a higher-priority router that stayed Standby until preempt let it take the job back.",
  solve:[["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["pc","pc1","ping 172.16.40.10"],
    ["term","configure terminal"],["term","interface g0/0"],["term","shutdown"],["term","end"],
    ["pc","pc1","ping 172.16.40.10"],
    ["term","configure terminal"],["term","interface g0/0"],["term","no shutdown"],["term","standby 30 ip 10.20.30.254"],["term","standby 30 priority 110"],["term","end"],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/0"],["term","standby 30 ip 10.20.30.254"],["term","end"],["term","show standby brief"],
    ["ip","pc1","10.20.30.50","255.255.255.0","10.20.30.254"],["pc","pc1","ping 172.16.40.10"],["pc","pc1","arp -a"],
    ["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/0"],["term","shutdown"],["term","end"],
    ["pc","pc1","ping 172.16.40.10"],["pc","pc1","tracert 172.16.40.10"],["pc","pc1","arp -a"],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show standby brief"],["term","show logging"],
    ["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/0"],["term","no shutdown"],["term","end"],["term","show standby brief"],
    ["term","configure terminal"],["term","interface g0/0"],["term","standby 30 preempt"],["term","end"],["term","show standby brief"],
    ["term","copy running-config startup-config"],["term",""],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Ping failing after moving PC1 to 10.20.30.254? <code>show standby brief</code> on both gateways: group and VIP must match. GW-A in <code>Init</code>? Its Gi0/0 is still shut.`)}
<p>Read what you saw. With the gateway at <code>.252</code>, shutting GW-A's port cut PC1 off (<code>Request timed out.</code>: PC1 still had .252's MAC cached and kept sending frames nobody received; a real PC re-checks that entry after a while and then reports <code>Destination host unreachable</code>) while GW-B sat there healthy. With HSRP, the log showed <b>GW-A</b> answering <i>&ldquo;10.20.30.254 is at 0000.0c07.ac1e&rdquo;</i>; after the failover the echo requests went to that same MAC but <b>GW-B</b> routed them, and <code>tracert</code>'s first hop was <code>.253</code> — GW-B's own address, where before the failover it would have been GW-A's <code>.252</code>. Three things the bench simplifies:</p>
<ul>
<li><b>Timing.</b> The bench converges instantly. On real kit, run <code>ping -t</code> (Windows' non-stop ping): a shut interface sends a Resign, so you lose perhaps one reply; a power cut means waiting out the 10-second hold time — several <code>Request timed out</code> lines.</li>
<li><b>The MAC table.</b> SW1 flooded the first frame to the virtual MAC because the lab clears the old entry; real kit moves it at once on the new Active's gratuitous ARP.</li>
<li><b>The way back.</b> HSRP protects only the first hop <i>out</i>. Replies return because OSPF tells CORE the LAN is reachable via both gateways, and GW-A stopped advertising it when its LAN port went down. Without that, return traffic would keep going to the router that could no longer deliver it.</li>
</ul>
${K.check({q:"In the bench, GW-A (priority 110, no preempt) came back after the failover and showed Standby. Why didn't it take over again?", o:["Its priority was too low","GW-B was already Active, and without preempt a higher-priority router doesn't take the role from a sitting Active router","OSPF had not converged","The PC still had GW-B's real MAC cached"], a:1, why:"GW-B was Active, so GW-A joined as Standby despite 110 > 100. Preempt let it send a Coup and take over."})}
<p><b>Same logic, new situation.</b></p>
${K.hint(`Which HSRP message gets sent when an interface is shut down cleanly — and can a router with no power send anything?`)}
${K.reveal("Next month you repeat the test at the clinic on the real routers, but this time you pull GW-A's power cord instead of shutting its port, with ping -t running on PC1. What do you expect to see, and why is it different?",`<ol>
<li><b>What is being asked?</b> Failover time after a sudden failure versus a clean shutdown.</li>
<li><b>Which rule applies?</b> The Standby takes over at once on a Resign, or after the hold time (10 s) when hellos just stop.</li>
<li><b>Apply it.</b> A dead router sends no Resign, so GW-B waits out the hold time from GW-A's last hello, then becomes Active. PC1 shows several <code>Request timed out</code> lines — up to about ten seconds — then replies resume, with the same gateway IP and MAC. When GW-A boots, it takes the job back (110 + preempt), costing another brief blip.</li></ol>`)}
${K.job("“Internet banking has been slow since the weekend” — and the backup router is still in charge",`
<p><b>The ticket.</b> &ldquo;Wuse 2 branch, Abuja. Since Monday, internet banking and core-banking screens are very slow. Head office says our link is fine.&rdquo; — Mrs Bello, operations manager, Tuesday 09:15.</p>
<p><b>Questions first.</b> &ldquo;Did anything happen over the weekend?&rdquo; — <i>&ldquo;The generator was serviced on Saturday; power was on and off for an hour.&rdquo;</i> &ldquo;Everyone, or some desks?&rdquo; — <i>&ldquo;Everyone.&rdquo;</i> Everyone, since a power event, with head office fine: suspect a gateway or path change.</p>
<p><b>Checks.</b> <code>tracert</code> from a teller PC to head office: the first hop is <code>192.168.10.3</code> — ABJ-R2, on the slower MTN backup. On the routers:</p>
${K.out(`ABJ-R1#show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       10   110   Standby 192.168.10.3    local           192.168.10.1

ABJ-R1#show logging | include HSRP
*Oct 10 09:37:55.912: %HSRP-5-STATECHANGE: GigabitEthernet0/0 Grp 10 state Speak -> Standby

ABJ-R2#show logging | include HSRP
*Oct 10 08:41:22.407: %HSRP-5-STATECHANGE: GigabitEthernet0/0 Grp 10 state Standby -> Active`, "ABJ-R1 has the higher priority (110) but no P flag. R2 took over at 08:41 on Saturday when R1 lost power; R1 rebooted (its log buffer starts afresh) and came back only as Standby.")}
<p>Saturday's power cut took ABJ-R1 down, ABJ-R2 took over, and R1 came back as Standby because <code>standby 10 preempt</code> was never configured. Everything since has used the backup link.</p>
<p><b>The fix</b>, in an agreed quiet moment (the takeover costs a second or two):</p>
${K.out(`ABJ-R1(config)#interface g0/0
ABJ-R1(config-if)#standby 10 preempt
ABJ-R1(config-if)#end
ABJ-R1#show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       10   110 P Active  local           192.168.10.3    192.168.10.1
ABJ-R1#copy running-config startup-config`, "With preempt, ABJ-R1 sees it outranks the Active router and takes over (Coup). The brief now shows 110 P Active.")}
<p>Verify: <code>tracert</code> now shows <code>192.168.10.2</code> first, and head office sees traffic back on the fibre. Then check the other branches built from the same template.</p>
<p><b>What you say.</b> &ldquo;After Saturday's power cut the branch stayed on its backup line, because the main router wasn't set to take back over when it recovered. That's fixed; it will now switch back by itself after any outage.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Slow apps since Sat generator works. tracert first hop .3 (ABJ-R2, MTN backup). ABJ-R1 pri 110, no preempt, Standby since Sat 09:37 (log). Added standby 10 preempt Tue 12:30 (approved, ~2 s blip); ABJ-R1 Active, first hop .2, head office confirms MainOne. Saved. Change request raised to audit preempt on all template branches. 35 min.&rdquo;</i></p>`)}

<h2>VRRP and GLBP: the other two FHRPs</h2>
<p>The CCNA also expects you to recognise two other FHRPs and what makes each different. They aren't in the lab — learn the ideas.</p>
<h3>VRRP: the open standard</h3>
<p>VRRP comes from the ${K.g("IETF","Internet Engineering Task Force: publishes open internet standards (RFCs) that any vendor can implement.")} (v2: RFC 3768; v3, adding IPv6: RFC 5798), so Cisco, Juniper, MikroTik and most firewalls speak it. Same idea as HSRP, different details:</p>
<ul>
<li><b>Roles:</b> one ${K.g("master","VRRP's forwarding router — HSRP's Active.")} forwards; every other router is a ${K.g("backup","A VRRP router waiting to take over from the master.")}.</li>
<li><b>Virtual MAC</b> <code>0000.5e00.01xx</code> (xx = group in hex); <b>adverts</b> from the master only, every <b>1 s</b>, to <code>224.0.0.18</code>.</li>
<li><b>Preempt is on by default</b> — the opposite of HSRP. Default priority 100.</li>
<li><b>The VIP may be a router's real address</b>; that &ldquo;owner&rdquo; has priority 255 and is master whenever it's up. HSRP forbids this. (Classic IOS: <code>vrrp 10 ip 192.168.10.1</code> — recognition only.)</li>
</ul>
<h3>GLBP: one address, several forwarding routers</h3>
<p>In HSRP and VRRP one router per group forwards while the other idles. GLBP (Cisco) uses them all behind one gateway address:</p>
<ul>
<li>The group elects an ${K.g("AVG","Active Virtual Gateway: the GLBP router that answers ARP for the VIP and decides which virtual MAC each host gets.")} (priority, then IP), which answers every ARP for the VIP.</li>
<li>Each router — up to four — gets its own virtual MAC, <code>0007.b400.xxyy</code> (xx = group in hex, yy = forwarder number 01–04), and becomes an ${K.g("AVF","Active Virtual Forwarder: a GLBP router that forwards traffic sent to its assigned virtual MAC.")}.</li>
<li>The AVG hands out those MACs in turn (round-robin by default): PC1 gets R1's, PC2 gets R2's. One gateway IP, traffic spread over every router. If an AVF fails, another takes over its MAC.</li>
<li>Hellos 3 s, hold 10 s, to <code>224.0.0.102</code>, UDP 3222. (Classic IOS: <code>glbp 10 ip 192.168.10.1</code>.)</li>
</ul>
<h3>Load sharing without GLBP</h3>
<p>With HSRP or VRRP, run <b>one group per VLAN and split the Active roles</b>: R1 Active (110 + preempt) for VLAN 10, R2 for VLAN 20. On core switches, make each the STP root for the VLANs it is Active for (Module 4 lesson 5), so frames don't detour across the inter-switch link.</p>
<div class="tablewrap"><table>
<tr><th></th><th>HSRP</th><th>VRRP</th><th>GLBP</th></tr>
<tr><td>Standard</td><td>Cisco</td><td>Open (IETF)</td><td>Cisco</td></tr>
<tr><td>Roles</td><td>Active, Standby (others Listen)</td><td>Master, Backup</td><td>AVG; up to 4 AVFs</td></tr>
<tr><td>Virtual MAC</td><td>v1 <code>0000.0c07.acxx</code> · v2 <code>0000.0c9f.fxxx</code></td><td><code>0000.5e00.01xx</code></td><td><code>0007.b400.xxyy</code> (one per AVF)</td></tr>
<tr><td>Hellos / adverts</td><td>3 s, hold 10 s · 224.0.0.2 (v1)</td><td>1 s · 224.0.0.18</td><td>3 s, hold 10 s · 224.0.0.102</td></tr>
<tr><td>Preempt by default</td><td>Off</td><td>On</td><td>Off for the AVG (on for AVFs)</td></tr>
<tr><td>Load balancing in one group</td><td>No (use several groups)</td><td>No (use several groups)</td><td>Yes</td></tr>
</table></div>
${K.when([
  ["HSRP","An all-Cisco site — the common enterprise choice","Mature and well understood; v2 adds big group numbers and IPv6; fits per-VLAN groups aligned with STP roots","Another vendor's router or firewall must share the gateway"],
  ["VRRP","Mixed vendors, e.g. a Cisco router paired with a firewall","Open standard every vendor implements; preempt on by default","An all-Cisco estate whose templates and monitoring are built on HSRP"],
  ["GLBP","All-Cisco, one gateway address, traffic spread over two to four routers in one subnet","Uses every router with no per-VLAN tricks","Non-Cisco kit, or platforms that don't support it — check first"],
  ["No FHRP","A tiny site that can tolerate an outage, or a gateway that is itself a redundant cluster or stack","Nothing to configure","Any site with a second router and an availability requirement"],
], "Which first-hop redundancy — and when")}
${K.myth([
  ["Two routers on a LAN give you redundancy automatically.","Hosts use one gateway address; without an FHRP they never use the second router."],
  ["During a failover, PCs re-ARP or renew DHCP.","They do nothing: the VIP and virtual MAC stay the same. The gratuitous ARP moves the MAC in the switches' tables; hosts already hold that MAC, so nothing changes for them."],
  ["The highest HSRP priority is always Active.","Only in a fresh election or with preempt. A sitting Active keeps the job otherwise."],

  ["HSRP protects the whole path to the internet.","It watches only LAN hellos. An Active router with a dead uplink but a live LAN port stays Active — see the case study."],
])}
${K.dodont([
  "Give the primary a higher priority <b>and</b> preempt, and document which router should be Active per group.",
  "Match group number and VIP on every member; number groups after their VLANs.",
  "Point DHCP's default router at the VIP and check hosts with <code>ipconfig</code>.",
  "Test real failures — power and uplinks, not only <code>shutdown</code> — with <code>ping -t</code> running.",
],[
  "Don't use a router's real address as the HSRP VIP.",
  "Don't mix HSRP versions in one group.",
  "Don't assume priority alone moves the Active role back.",
  "Don't ignore an unexpected <code>%HSRP-5-STATECHANGE</code> — something failed or flapped.",
])}
${K.case("An MSP's branch template that failed the first real outage",`
<p>A Lagos managed-service provider rolled one design out to 30 retail branches: R1 on fibre, R2 on 4G, HSRP group 10, R1 at priority 110 with preempt. Lab tests passed: shut R1's LAN port, R2 took over.</p>
<p><b>The first real outage didn't look like the test.</b> A road crew in Ikorodu cut the fibre. R1's LAN port stayed up, so R1 kept sending hellos and stayed Active, with no way out. Users saw <code>Reply from 10.31.0.2: Destination host unreachable</code> (R1 had lost its routes) while the 4G router idled as Standby for three hours.</p>
<p><b>Why.</b> HSRP decides only from LAN hellos; it knows nothing about the uplink. The fix (beyond the CCNA) was ${K.g("object tracking","An IOS feature that lowers a router's HSRP priority when a watched interface or route fails.")}: if R1's WAN goes down, its priority drops by 20 to 90, below R2's 100, and R2 (now also given preempt) takes over — <code>track 1 interface GigabitEthernet0/1 line-protocol</code> plus <code>standby 10 track 1 decrement 20</code>. (Concept only: the lab doesn't model tracking.)</p>
<p><b>What changed.</b> Failover tests now cover R1's LAN port, power, WAN and return, with <code>ping -t</code> running and the <code>STATECHANGE</code> lines kept as evidence; the audit found two branches without preempt and one dual active (R2 on version 2). The lessons: <b>HSRP protects the gateway, not the path</b>; <b>preempt belongs on the router that should win</b>; <b>test the failures you'll actually get</b>.</p>`)}
${K.check({q:"A site has a Cisco router and a third-party firewall that must share the LAN's default gateway address. Which FHRP fits?", o:["HSRP, because it is the CCNA default","GLBP, because it load-balances","VRRP, because it is an open standard both vendors implement","None — two vendors can't share a gateway"], a:2, why:"HSRP and GLBP are Cisco-only; VRRP is an IETF standard every vendor implements."})}
<p><b>Same logic, new situation.</b></p>
${K.q({type:"match", q:"A host ARPs for its gateway and caches each MAC address below. Match each one with what it tells you about the gateway.", pairs:[["0000.0c07.ac14","HSRP version 1, group 20"],["0000.0c9f.f014","HSRP version 2, group 20"],["0000.5e00.0114","VRRP, group 20"],["0007.b400.1402","GLBP group 20, the second forwarder"]], why:"1. Asked: protocol and group from a MAC. 2. Rule: 0000.0c07.ac = HSRP v1; 0000.0c9f.f = HSRP v2; 0000.5e00.01 = VRRP; 0007.b400 = GLBP; group in hex. 3. Apply: 14 hex = group 20; in GLBP the last byte (02) is the forwarder."})}

<h2>Interview corner</h2>
${K.hint(`Problem, idea, roles, and one detail that shows experience.`)}
${K.reveal("“What is HSRP and why would you use it?”",`<p>"Hosts have one default gateway, so if that router fails the subnet is cut off even with another router beside it. HSRP is Cisco's first-hop redundancy protocol: routers share a virtual IP and MAC that hosts use as their gateway. The Active answers for it; the Standby listens to its hellos — 3 seconds, 10-second hold — and takes over the same IP and MAC if they stop. I give the primary a higher priority and preempt, and point DHCP at the virtual IP."</p>`)}
${K.hint(`Time order: hellos stop → takeover → switches → hosts → return path.`)}
${K.reveal("“Walk me through what happens when the Active HSRP router fails.”",`<p>"After a sudden failure the Standby waits out the hold time, 10 seconds by default; after a clean shutdown the Active sends a Resign and the Standby takes over at once. It answers ARP for the virtual IP with the same virtual MAC and sends a gratuitous ARP so switches relearn that MAC on its port; hosts change nothing. Upstream, the routing protocol must stop sending return traffic to the failed router. The old router takes over again on return only with a higher priority and preempt, and every step appears as an %HSRP-5-STATECHANGE log line."</p>`)}
${K.hint(`Standard vs Cisco, roles, preempt defaults, load balancing — then a recommendation.`)}
${K.reveal("“HSRP, VRRP or GLBP — how do you choose?”",`<p>"HSRP and GLBP are Cisco; VRRP is an IETF standard, so if a firewall or another vendor's router shares the gateway, it's VRRP — master and backup, adverts every second, preempt on by default. Neither HSRP nor VRRP balances traffic within one group, so on an all-Cisco campus I'd run HSRP with one group per VLAN, splitting the Active roles between the core switches and aligning each with the STP root. GLBP is the choice for one gateway address with traffic spread over several routers: its AVG hands different virtual MACs to different hosts. I'd check platform support first."</p>`)}

${K.recap([
  "Hosts use one gateway IP and its ARP-learned MAC and never look for another router, so a second router alone gives no redundancy.",
  "An FHRP shares a virtual IP and virtual MAC across routers; one answers for them, another takes over if it fails, and hosts change nothing.",
  "HSRP: Active and Standby, hello 3 s, hold 10 s, priority 100 by default; highest priority wins, tie → highest IP.",
  "Elections happen only when there's no Active router; preempt (off by default) lets a higher-priority router take over.",
  "Virtual MAC = group in hex: v1 0000.0c07.acxx (0–255), v2 0000.0c9f.fxxx (0–4095, IPv6). Versions don't interoperate.",
  "Verify with show standby brief (a mirror image on both routers), show standby and %HSRP-5-STATECHANGE; tracert's first hop reveals the Active router.",
  "VRRP: open standard, master/backup, 0000.5e00.01xx, preempt on. GLBP: Cisco, an AVG handing out up to four AVF virtual MACs — real load balancing.",
])}
${K.next(`<b>Lesson 8 — Troubleshooting routing end to end.</b> You now have every piece of Module 5. Next you'll combine <code>ping</code>, <code>traceroute</code> and <code>show ip route &lt;address&gt;</code> into one method, take on the Module 5 challenge, and get a portfolio project brief — a multi-site network with OSPF, a floating static backup and HSRP at HQ — to show employers.`)}
`,
quiz:[
  {lvl:1, q:"What problem does a first-hop redundancy protocol solve?", o:["Routers on different sites can't exchange routes","Hosts have a single default gateway, so if that router fails the subnet loses access even when another router is available","Switches create loops when there are redundant links","Two hosts end up with the same IP address"], a:1, why:"Hosts send every off-subnet packet to one gateway address and never look for another router. An FHRP gives a group of routers a shared virtual IP and MAC so the gateway survives the loss of one router."},
  {lvl:1, q:"Which virtual MAC address does HSRP version 1 use for group 1?", o:["0000.0c07.ac01","0000.5e00.0101","0007.b400.0101","0000.0c9f.f001"], a:0, why:"HSRP v1 uses 0000.0c07.acxx with the group number in hex. 0000.5e00.01xx is VRRP, 0007.b400.xxyy is GLBP and 0000.0c9f.fxxx is HSRP version 2."},
  {lvl:1, type:"fill", q:"What is the default HSRP priority on a Cisco router?", fields:[{label:"Priority", a:["100"]}], why:"HSRP priorities run from 0 to 255 with a default of 100. The highest priority wins an election; a tie goes to the highest interface IP address."},
  {lvl:1, type:"order", q:"Put the HSRP states in the order a router normally passes through them on its way to becoming Active.", items:["Initial","Learn","Listen","Speak","Standby","Active"], why:"A router starts in Initial, learns the virtual IP (Learn), waits knowing it (Listen), joins the election sending hellos (Speak), and ends as Standby or Active. Memory hook: I Learn, Listen, Speak, Stand by — then Act."},
  {lvl:1, q:"What are HSRP's default hello and hold timers?", o:["Hello 1 s, hold 3 s","Hello 3 s, hold 10 s","Hello 10 s, hold 40 s","Hello 5 s, hold 15 s"], a:1, why:"HSRP sends hellos every 3 seconds and declares the Active router dead after 10 seconds of silence. (10 and 40 seconds are OSPF's hello and dead timers on broadcast links; VRRP advertises every 1 second.)"},
  {lvl:2, q:"R1 (10.6.0.2) and R2 (10.6.0.3) are configured with HSRP group 6, both with the default priority, and boot at the same moment. Which router becomes Active?", o:["R1, because it has the lower IP address","R2, because priorities tie and it has the higher IP address","Whichever router's hello arrives first","Neither, until a priority is configured"], a:1, why:"No Active router exists, so it's a fresh election: highest priority first (a tie at 100), then the highest IP address on the interface. 10.6.0.3 beats 10.6.0.2, so R2 is Active and R1 Standby."},
  {lvl:2, q:"Based on the exhibit from R1, why is R1 not the Active router even though it has the highest priority?", ex:"R1#show standby brief\n                     P indicates configured to preempt.\n                     |\nInterface   Grp  Pri P State   Active          Standby         Virtual IP\nGi0/0       10   120   Standby 10.1.1.3        local           10.1.1.1", o:["Its priority must be at least 200 to become Active","R2 became Active before R1 joined, and R1 is not configured to preempt (no P flag)","R1's interface is down","R1 and R2 are in different groups"], a:1, why:"The P column is blank, so preempt is off on R1. An Active router keeps the job until it fails or a router with a higher priority and preempt takes over. R1 is clearly in the group (it names R2 as Active), and its interface is up (it's Standby, not Init)."},
  {lvl:2, type:"fill", q:"Which interface command lets R1 take the Active role in HSRP group 10 whenever it has the higher priority?", fields:[{label:"Command", a:["standby 10 preempt"], ios:true}], why:"standby 10 preempt allows R1 to take over (with a Coup) from a lower-priority Active router. Without it, a higher priority only matters in a fresh election."},
  {lvl:2, q:"An HSRP failover moves the Active role from R1 to R2. What does a PC's ARP cache show for its default gateway afterwards?", o:["R2's real interface MAC address","The same virtual MAC address as before the failover","No entry until the PC renews its DHCP lease","Both routers' real MAC addresses"], a:1, why:"The virtual IP and virtual MAC move to R2 together, so the PC's cached entry is still correct and it changes nothing. R2's gratuitous ARP updates the switches' MAC tables, not the hosts."},
  {lvl:2, type:"multi", q:"Which two statements correctly compare VRRP with HSRP? (Choose two.)", o:["VRRP is an open standard defined by the IETF","VRRP has preemption enabled by default","VRRP uses the virtual MAC 0000.0c07.acxx","VRRP calls its forwarding router the Active router","VRRP sends hellos every 3 seconds with a 10-second hold time by default"], a:[0,1], why:"VRRP is an IETF standard (RFC 3768/5798) with preempt on by default, and it calls its roles master and backup. Its virtual MAC is 0000.5e00.01xx and it advertises every second; 0000.0c07.acxx and 3 s/10 s are HSRP."},
  {lvl:2, type:"match", q:"Match each first-hop redundancy term with the protocol it belongs to.", pairs:[["Active and Standby routers","HSRP"],["Master and backup routers","VRRP"],["Active Virtual Gateway and Active Virtual Forwarders","GLBP"]], why:"HSRP names its roles Active and Standby; VRRP uses master and backup; GLBP has one AVG that answers ARP and up to four AVFs that forward, each with its own virtual MAC."},
  {lvl:2, type:"fill", q:"HSRP version 2 is configured for group 100. What is the virtual MAC address?", fields:[{label:"Virtual MAC", a:["0000.0c9f.f064","0000.0C9F.F064","00-00-0c-9f-f0-64"]}], why:"Version 2 uses 0000.0c9f.fxxx with the group in three hex digits. 100 = 6×16 + 4 = 64 hex, so the MAC is 0000.0c9f.f064."},
  {lvl:3, q:"Users in a branch lose all access to head office. The exhibit is from R1 and from a user PC. R2 (on a backup link) is healthy. What is the cause and the right long-term fix?", ex:"R1#show standby brief\nInterface   Grp  Pri P State   Active          Standby         Virtual IP\nGi0/0       10   110 P Active  local           10.31.0.3       10.31.0.1\n\nC:\\>ping 10.200.0.20\nReply from 10.31.0.2: Destination host unreachable.\nReply from 10.31.0.2: Destination host unreachable.", o:["R2 is missing preempt; add standby 10 preempt on R2","R1's WAN uplink has failed but its LAN port is up, so it is still Active with no route out; make HSRP track the uplink (lower R1's priority below R2's when it fails) with preempt on R2","The PC has the wrong default gateway; set it to 10.31.0.2","The HSRP hold time is too long; reduce it to 1 second"], a:1, why:"R1 is still Active and replies 'Destination host unreachable' from its real address: it has lost its routes out. HSRP only watches LAN hellos, so it never failed over. Object tracking that drops R1's priority below 100 when the uplink fails, plus preempt on R2, moves the gateway automatically. The PC's gateway (the VIP) is correct, and timers can't help: R1's hellos never stopped."},
  {lvl:3, q:"Both core switches show the exhibit output for VLAN 30's group (each with its own priority). Users in VLAN 30 report intermittent drops. What is the most likely cause?", ex:"DSW1#show standby brief\nInterface   Grp  Pri P State   Active          Standby         Virtual IP\nVl30        30   110 P Active  local           unknown         10.3.30.1\n\nDSW2#show standby brief\nInterface   Grp  Pri P State   Active          Standby         Virtual IP\nVl30        30   100   Active  local           unknown         10.3.30.1", o:["Normal load sharing: both switches forward for VLAN 30","DSW2 needs preempt","The switches can't hear each other's hellos in VLAN 30 — for example VLAN 30 missing from the trunk between them — so both are Active","Priority 110 is too close to 100"], a:2, why:"Both Active with Standby unknown means each thinks it is alone: dual active. Hellos aren't crossing between them, typically because VLAN 30 isn't allowed or doesn't exist on a link between them (or an HSRP version mismatch; both show group 30, so it isn't the group number). Fix the Layer 2 path and one becomes Standby."},
  {lvl:3, type:"multi", q:"An all-Cisco campus has two core Layer 3 switches and VLANs 10 and 20. The team wants both switches forwarding user traffic while keeping gateway redundancy, using HSRP. Which two design choices achieve this? (Choose two.)", o:["Make DSW1 Active (higher priority + preempt) for VLAN 10's group and DSW2 Active for VLAN 20's group","Make each switch the Spanning Tree root for the VLANs it is HSRP-Active for","Give both switches equal priority so they share each group","Configure the same real IP address on both SVIs","Turn preempt off on both switches so they alternate"], a:[0,1], why:"HSRP has one Active router per group, so load sharing means one group per VLAN with the Active roles split. Aligning the STP root with the Active gateway keeps frames from crossing the inter-switch link to reach it. Equal priorities just elect one by IP, duplicate real IPs are a conflict, and turning preempt off makes the roles drift."},
],
cards:[
  {f:"Why doesn't a second router alone give hosts redundancy?", b:"Hosts send all off-subnet traffic to one gateway IP (and its ARP-learned MAC) and never look for another router. If that router dies, they're cut off."},
  {f:"What is an FHRP?", b:"A first-hop redundancy protocol: routers share a virtual IP and virtual MAC used as the hosts' gateway; one forwards, another takes over if it fails. HSRP, VRRP, GLBP."},
  {f:"HSRP roles and timers", b:"Active (owns the VIP and virtual MAC, forwards) and Standby (listens, takes over); others Listen. Hello 3 s, hold 10 s."},
  {f:"HSRP election rule", b:"No Active router: highest priority wins (default 100, range 0-255), tie goes to highest interface IP. A sitting Active keeps the job unless a higher-priority router with preempt is present."},
  {f:"HSRP preempt", b:"Off by default. standby N preempt lets a higher-priority router take over (Coup) from a lower-priority Active. Put it on the primary, with a higher priority."},
  {f:"HSRP version 1 vs version 2", b:"v1: groups 0-255, 224.0.0.2, MAC 0000.0c07.acxx. v2: groups 0-4095, 224.0.0.102, MAC 0000.0c9f.fxxx, IPv6. Both UDP 1985. They don't interoperate."},
  {f:"Work out an HSRP virtual MAC", b:"Group in hex. v1 group 10 = 0000.0c07.ac0a; group 30 = ac1e. v2 group 200 = 0000.0c9f.f0c8."},
  {f:"HSRP states in order", b:"Initial, Learn, Listen, Speak, Standby, Active. 'I Learn, Listen, Speak, Stand by - then Act.'"},
  {f:"Configure HSRP on the primary router", b:"interface g0/0, then standby 10 ip 192.168.10.1, standby 10 priority 110, standby 10 preempt. Same group and VIP on the other router. DHCP gateway = VIP."},
  {f:"Reading show standby brief", b:"Pri, P (preempt), State, Active and Standby (local = me, otherwise the peer's real IP), Virtual IP. Both routers Active with Standby unknown = dual active: they can't hear each other."},
  {f:"What changes for the PC after an HSRP failover?", b:"Nothing in its settings or ARP cache: same gateway IP, same virtual MAC. The new Active's gratuitous ARP updates the switches. tracert's first hop shows the new router's real IP."},
  {f:"Failover time: shutdown vs power cut", b:"Interface shut: the Active sends a Resign, near-instant takeover. Power cut or crash: the Standby waits out the hold time (10 s by default)."},
  {f:"VRRP in one card", b:"IETF open standard. Master and backup. MAC 0000.5e00.01xx. Adverts every 1 s to 224.0.0.18. Preempt ON by default. The VIP may be a real interface address (owner, priority 255)."},
  {f:"GLBP in one card", b:"Cisco. One AVG answers ARP for the VIP and hands out different virtual MACs (0007.b400.xxyy) to up to four AVFs, so hosts are spread across routers: load balancing in one group."},
],
});
L.push({
id:"l3-verify", mins:100, level:"Beginner+ · builds on Module 5 lessons 1–7",
t:"Troubleshooting routing end to end — and the Module 5 challenge",
html:`
${K.goals([
  "Work any &ldquo;can't reach it&rdquo; routing ticket with one method: find the router where the packet stops — on the way there <i>and</i> on the way back.",
  "Read ping by hops, traceroute lines (<code>!H</code>, <code>*</code>, repeats), <code>show ip route &lt;address&gt;</code>, next-hop resolution, OSPF and HSRP evidence.",
  "Recognise nine fingerprints: missing return route, wrong mask in a static, floating static with the wrong AD, passive on a transit link, area mismatch, duplicate router ID, missing network statement, default not originated, HSRP without preempt.",
  "Find and fix seven faults across a three-site network in the Module 5 challenge.",
  "Build, break and document a portfolio project that proves these skills to an employer.",
])}
${K.pre(["Module 5 lessons 1–7: the routing table, static and floating routes, OSPF (concepts, configuration, DR/BDR, cost and adjacency troubleshooting) and HSRP.","Module 4 lesson 7: a complaint from one desk can still be a VLAN or trunk fault.","Module 3: masks and prefix lengths — you will check them by hand."])}

<h2>Why this matters at work</h2>
<p>Monday, 07:50, at a managed-service provider in Lekki, Lagos. Three tickets in ten minutes: a Kano branch &ldquo;can't open the HR system, but email works&rdquo;; a clinic's new phones can call head office but not the warehouse; and a customer's backup internet link has been busy all weekend although the main fibre never went down.</p>
<p>Every link is green. These are <b>routing</b> faults — a missing route, a wrong route, or one nobody meant to be used — and each leaves a <b>fingerprint</b> in a <code>show</code> command or a traceroute line. This lesson ties Module 5 into one method and nine fingerprints, then hands you a broken three-site network as the Module 5 challenge and a portfolio project for GitHub and LinkedIn.</p>

<h2>The method: find where the packet stops — in both directions</h2>
${K.remember(`<p><b>A conversation works only if every router on the way there has a route to the destination, AND every router on the way back has a route to the source.</b> Each router decides alone, from its own table: longest match, then the lowest administrative distance, then the lowest metric (lesson 1). Your job is to find the <b>first router that can't answer</b> — forwards or backwards.</p>`)}
<p>Why? A router doesn't know the whole path: it looks up one destination, picks one next hop and forgets the packet. The reply is a brand-new packet to the <i>source</i>, looked up afresh by every router it meets — so a request can arrive while its reply dies two hops later.</p>
${K.analogy(`<p>A parcel goes from Lagos to Kano through bus parks. Each park's board only says which bay goes <i>towards</i> Kano; if one board has no line for Kano, the parcel stops there. The receipt coming back is a separate parcel: every park on the way back needs a line for &ldquo;Lagos&rdquo;.</p>`)}
<h3>The method, step by step</h3>
${K.svg("0 0 720 432",
  [["1 · Scope it","who, what, since when, what changed?","one user? one subnet? one site? everyone?","picks where you start"],
   ["2 · Ping by hops","from the user's subnet","gateway → next router → far router → far LAN","the first hop that fails"],
   ["3 · Trace it","tracert (Windows) · traceroute (IOS)","last line that answered; !H; * ; repeats","the router to log in to"],
   ["4 · Read the table","on that router","show ip route &lt;destination&gt;","route? which next hop? AD?"],
   ["5 · Does the next hop resolve?","recursive lookup, exit interface up","show ip route &lt;next hop&gt; · show ip interface brief","next hop is connected and up"],
   ["6 · The way back","on every router back to the user","show ip route &lt;source&gt;","a route home on each one"],
   ["7 · Why is a route missing?","static config, OSPF evidence","show ip ospf neighbor · interface · protocols · logging","FULL neighbours, right networks"],
   ["8 · The gateway itself","HSRP: who is active?","show standby brief","the router the design says"]]
  .map((r,i)=>{ const y = 8+i*53; return K.box(16,y,206,42,r[0],r[1],i===0)+K.txt(240,y+17,r[2],{c:"fg",s:11.5})+K.txt(240,y+34,"good: "+r[3],{c:"ok",s:10.5,f:"body"})+(i<7?K.arrow(119,y+42,119,y+53):""); }).join(""),
  "The routing troubleshooting method. Steps 2–4 find WHERE the packet stops; steps 5–8 find WHY. Stop at the first answer that isn't 'good', fix it, and test again from the user's subnet.")}
${K.remember(`<p><b>&ldquo;Smart People Trace The Network's Return Path Slowly&rdquo;</b> — <b>S</b>cope, <b>P</b>ing by hops, <b>T</b>race, <b>T</b>able (<code>show ip route &lt;ip&gt;</code>), <b>N</b>ext hop resolves, <b>R</b>eturn path, <b>P</b>rotocol evidence (OSPF), <b>S</b>tandby (HSRP).</p>`)}
<p><b>Scope</b> says where to begin. One user: Layer 2 or the PC (Module 4 lesson 7). One subnet: its gateway, or routes <i>to</i> and <i>from</i> it. One site: its router, WAN link and adjacency. Everyone to one destination: the router nearest it, or a shared route such as the default. Always ask &ldquo;what changed?&rdquo;</p>
<p><b>Ping by hops</b> from the user's machine, address by address along the path: each success proves the route there <i>and</i> back for that hop, and the first failure marks the spot.</p>
${K.svg("0 0 760 300",
  K.dev("pc",50,90,"USER PC","10.40.20.15")+K.dev("router",210,90,"R-A","gateway")+K.dev("router",400,90,"R-B","")+K.dev("router",590,90,"R-C","")+K.dev("server",710,90,"SERVER","")+
  K.link(70,92,186,92)+K.link(234,92,376,92)+K.link(424,92,566,92)+K.link(614,92,694,92)+
  K.arrow(70,40,690,40,"request: every router needs a route to the SERVER's subnet",true)+
  K.arrow(690,170,70,170,"reply: every router needs a route to the USER's subnet",false)+
  K.txt(210,215,"ping 1 · gateway",{mid:true,c:"fg"})+K.txt(400,215,"ping 2 · R-B",{mid:true,c:"fg"})+K.txt(590,215,"ping 3 · R-C",{mid:true,c:"fg"})+K.txt(710,215,"ping 4 · server",{mid:true,c:"fg"})+
  K.txt(380,255,"Each ping that succeeds proves the route there AND back for that hop. The first one that fails is where you log in.",{mid:true,f:"body",s:11.5})+
  K.txt(380,275,"The reply is a new packet: R-C can know the server and still not know the user.",{mid:true,f:"body",s:11.5}),
  "Ping by hops. Forward and return lookups are separate, so a path can work one way and fail the other.")}
${K.tip(`Test from the <b>user's</b> subnet. A router's ping uses its <i>exit interface</i> as the source, and the far end may know that link while having no route to the users. The extended ping <code>ping 10.40.50.20 source g0/0</code> sends from the router's LAN address instead — the next best thing to a user's PC.`)}
${K.when([
  ["ping (from the user's subnet)","Can this source reach that address and back?","Tests both directions; the error type is a clue","You need WHERE — go hop by hop, or trace"],
  ["tracert / traceroute","You need the path and the last router that answered","Lists each router by its arrival interface","A firewall drops probes — stars then prove nothing"],
  ["show ip route &lt;address&gt;","You want one router's decision for one destination","Shows the longest-match entry, AD, metric, next hop","You need the whole table"],
  ["show ip ospf neighbor / interface / protocols","An expected OSPF route is missing","Adjacency state and which interfaces run OSPF","The missing route is a static"],
  ["show standby brief","An odd first hop, or the gateway moved after an outage","Active router, priorities, the P (preempt) flag","There's only one gateway"],
], "Which tool answers which question")}
${K.dyk(`Traceroute sets the IP <b>TTL</b> (time to live) deliberately low: TTL 1, so the first router drops the probe and returns an ICMP &ldquo;time exceeded&rdquo;, revealing its address; then TTL 2, 3… (Windows probes with ICMP echo, IOS with UDP.) Every line needs a reply to come <b>back</b>, so a missing return route breaks traceroute too.`)}
${K.check({q:"One branch subnet reaches the far side of the WAN link but nothing at head office. A second subnet at the same branch reaches head office fine. What does scope tell you?", o:["The WAN link is down","Something specific to the first subnet: a route to it, or back to it, is missing somewhere (or a filter matches it)","Every head-office server is down","The branch router has no default route"], a:1, why:"The second subnet proves the link, the branch router's forward routes and the servers work. What differs is the source subnet: a head-office router may have no route back to it."})}
<h3>Same logic, new situation</h3>
<p>Kaduna's PCs (10.92.4.0/24) ping their gateway KD-R1 and its WAN address 10.92.250.1, but <code>ping 10.92.250.2</code> — hub router HUB-R's end of that link — and everything beyond time out. Logged in to KD-R1, an engineer pings 10.92.250.2 fine.</p>
${K.hint(`Which source address does KD-R1's own ping use, and does HUB-R know that address?`)}
${K.reveal("Walk through the reasoning",`<p><b>1. What is asked?</b> Which router to fix. <b>2. Which rule?</b> The reply needs a route back to the source. <b>3. Apply it.</b> KD-R1 answers for both its addresses, so it's fine. HUB-R gets the users' ping but must reply to 10.92.4.x; KD-R1's own ping works only because its source, 10.92.250.1, is on HUB-R's connected /30. So <code>show ip route 10.92.4.15</code> on HUB-R will say <code>% Network not in table</code>: fix that route (or Kaduna's advertisement) and re-test from a Kaduna PC.</p>`)}

<h2>Reading the evidence: traceroute lines, show ip route &lt;address&gt; and the way back</h2>
<h3>A traceroute, line by line</h3>
<p>Each line is one router, listed by the interface the probe <b>arrived on</b>. Every line that answers is a router with a route forward and back; watch where that changes.</p>
${K.out(`IB-GW1#traceroute 172.31.9.9
Type escape sequence to abort.
Tracing the route to 172.31.9.9
VRF info: (vrf in name/id, vrf out name/id)
  1 192.0.2.1 !H  !H  !H`, "IOS traceroute: the ISP router (192.0.2.1) answered all three probes with !H — unreachable: it has no route to 172.31.9.9.")}
<ul>
<li><b><code>!H</code></b> — that router sent back an ICMP &ldquo;unreachable&rdquo;: it has <b>no route</b> (or, as the very last hop, couldn't ARP the destination host). Windows prints <code>reports: Destination host unreachable.</code>; an IOS ping through it shows <code>U.U.U</code>. Fix that router, or whoever should have told it about the network.</li>
<li><b><code>*  *  *</code></b> (Windows <code>Request timed out.</code>) — no answer: no reply, a reply that couldn't get back, or a filter. Stars from hop N onwards point at hop N or the way back from it.</li>
<li><b>Two addresses repeating</b> — a <b>routing loop</b>, usually a default on one router and a broader route back on the other.</li>
<li><b>An unexpected hop</b> — the <i>path</i> is wrong (backup link, standby gateway first): check an AD, a cost or an HSRP priority.</li>
</ul>
${K.out(`C:\\Users\\IB-PC>tracert 10.40.50.20

Tracing route to 10.40.50.20 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  10.40.10.2
  2    <1 ms    <1 ms    <1 ms  192.0.2.1
  3    <1 ms    <1 ms    <1 ms  192.0.2.2
  4    <1 ms    <1 ms    <1 ms  192.0.2.1
  5    <1 ms    <1 ms    <1 ms  192.0.2.2
   ...`, "A loop. IB-GW1 has no route for Kano's LAN (10.40.50.0/24), so it uses its default to the ISP (192.0.2.1); the ISP's route for the company's whole 10.40.0.0/16 sends it back — until the TTL runs out. The cure is the missing specific route (you'll see below why Kano never advertised it).")}
<h3>Three failure messages, three different places to look</h3>
<div class="tablewrap"><table>
<tr><th>The user sees</th><th>What happened</th><th>Look at</th></tr>
<tr><td><code>Reply from &lt;own IP&gt;: Destination host unreachable</code></td><td>The PC couldn't ARP for its gateway (or a local host)</td><td>Layer 2 and addressing (Modules 3–4)</td></tr>
<tr><td><code>Reply from &lt;a router's IP&gt;: Destination host unreachable</code></td><td>That router had no route forward and said so (or, if it's the destination's own gateway, couldn't ARP the host)</td><td>That router: <code>show ip route &lt;destination&gt;</code></td></tr>
<tr><td><code>Request timed out.</code></td><td>Silence: the request or the reply died without a message</td><td>The return path first, then loops (TTL), then filters</td></tr>
</table></div>
<p>Rows 1 and 2 use the <b>same words</b>; read the address after &ldquo;Reply from&rdquo;. Your own address: your PC never left its subnet. A router's address: that router gave up.</p>
${K.exam(`How to read a routing question: <b>1. What is asked?</b> (where it fails, which route is used, the fix?) <b>2. Which rule?</b> Longest match picks the entry; AD decides between sources for the <i>same</i> prefix; metric inside one protocol; the reply needs its own route. <b>3. Work it through</b> router by router, for destination <i>and</i> source. Trap: &ldquo;times out&rdquo; and &ldquo;unreachable&rdquo; point at different routers — and &ldquo;unreachable&rdquo; from your own IP is a different fault again.`)}
<h3>show ip route &lt;address&gt;: one router's decision, in its own words</h3>
${K.out(`IB-GW1#show ip route 10.40.50.20
Routing entry for 10.40.50.0/24
  Known via "ospf 1", distance 110, metric 2, type intra area
  Last update from 10.40.255.2 on GigabitEthernet0/1, 00:21:10 ago
  Routing Descriptor Blocks:
  * 10.40.255.2, from 10.40.0.21, 00:21:10 ago, via GigabitEthernet0/1
      Route metric is 2, traffic share count is 1`, "After the fix: the single entry IB-GW1 uses for 10.40.50.20.")}
<ul>
<li><b>Routing entry for 10.40.50.0/24</b> — the prefix longest match picked. Shorter than expected? The specific route is missing.</li>
<li><b>Known via &ldquo;ospf 1&rdquo;, distance 110, metric 2</b> — source, AD, cost. <code>"static"</code> where you expected OSPF: a static is overriding it.</li>
<li><b>* 10.40.255.2, from 10.40.0.21 … via GigabitEthernet0/1</b> — next hop, advertising router ID, exit interface. Two such lines = equal-cost load sharing.</li>
<li><b><code>% Network not in table</code></b> or <b><code>% Subnet not in table</code></b> — no specific match (IOS says &ldquo;Subnet&rdquo; when it knows other subnets of the address's classful network, &ldquo;Network&rdquo; when it knows none — lesson 1; the lab does the same). The default isn't shown here, so check <code>Gateway of last resort</code>: if set, the packet follows it (maybe to the internet); if not, it's dropped with an unreachable (<code>!H</code>).</li>
</ul>
<h3>Does the next hop resolve?</h3>
<p>A next-hop static installs only if the next hop is found in the table (a <b>recursive lookup</b>, lesson 2); an exit-interface static only while that interface is up. So a route can be in the config but not the table:</p>
${K.steps([
  ["Compare config with table","<code>show running-config | include ip route</code> lists what you typed; <code>show ip route static</code> lists what's installed. In the first but not the second = didn't resolve."],
  ["Look up the next hop","<code>show ip route &lt;next hop&gt;</code>: a <code>C</code> entry is fine; <code>% Network not in table</code> means a typo or a dead link. One catch: if the router has a default route, IOS (and the lab) resolves the next hop through the default and installs the static anyway — so a wrong next hop can sit in the table pointing the wrong way."],
  ["Check the exit interface","<code>show ip interface brief</code>: the interface towards the next hop must be up/up."],
])}
<h3>The way back — a worked example</h3>
<p>The Ibadan clinic's new phone subnet, 10.40.20.0/24 (gateway IB-CORE, 10.40.20.1), can call head office but not the Oyo warehouse server 10.40.60.20. The warehouse router, OY-R1, uses static routes; the clinic's PCs (10.40.10.0/24) reach it fine.</p>
${K.steps([
  ["Scope","Only the new subnet fails, and it was added last week. Suspect a route <i>for</i> or <i>back to</i> 10.40.20.0/24."],
  ["Ping by hops from a phone-subnet PC","IB-CORE's WAN side 10.40.255.5 replies; OY-R1's WAN side 10.40.255.6 gives <code>Request timed out</code>. Timed out, not unreachable: suspect OY-R1's way back."],
  ["Prove it from the router, with the right source","On IB-CORE, <code>ping 10.40.60.20</code> works (<code>!!!!!</code>) — but <code>ping 10.40.60.20 source g0/2</code> prints <code>Packet sent with a source address of 10.40.20.1</code> and then <code>.....</code>. Same router, different source, different answer."],
  ["Read OY-R1's table for the SOURCE","<code>show ip route 10.40.20.15</code>: <code>% Network not in table</code>, no gateway of last resort; <code>show running-config | include ip route</code> lists only 10.40.10.0/24."],
  ["Fix and prove","<code>ip route 10.40.20.0 255.255.255.0 10.40.255.5</code> on OY-R1 (or one summary for the clinic). Re-test from a phone-subnet PC."],
])}
<p>The traceroute before the fix: hop 1 answers, then OY-R1 can't send its &ldquo;time exceeded&rdquo; home, so it — and everything after it — stays silent.</p>
${K.out(`C:\\Users\\PHONE-ADMIN>tracert 10.40.60.20

Tracing route to 10.40.60.20 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  10.40.20.1
   2     *        *        *     Request timed out.
   3     *        *        *     Request timed out.
   ...`, "The first router that goes silent and stays silent is the first one with no route back to you.")}
${K.mistake(`Testing from the router and closing the ticket. A plain <code>ping 10.40.60.20</code> on IB-CORE succeeds because its source is the WAN address, which OY-R1 has as a connected route. Use <code>ping … source &lt;LAN interface&gt;</code>, or better, a PC in the users' subnet.`)}
<h3>Try it: two static routes that look right</h3>
<p>EN-R1 in Enugu reaches a data-centre router, EN-DC (10.20.0.2), over Gi0/1. Last night someone added statics for the DC servers (10.44.8.0–10.44.15.255) and the backup network 10.50.0.0/16. Users reach some servers but not 10.44.12.7, and nothing in 10.50.x.x. To change a static, remove it with the same line prefixed by <code>no</code> (for example <code>no ip route 10.44.8.0 255.255.255.0 10.20.0.2</code>), then add the corrected one.</p>
${K.hint(`10.44.8.0–10.44.15.255 is eight /24 blocks: which prefix length covers exactly eight? For the second route, ask the router whether it can find the next hop at all.`)}
${K.term({env:"ios2", title:"EN-R1 — a mask that's too long, a next hop that doesn't exist", opts:{kind:"router", host:"EN-R1", model:"ISR4331", motd:"EN-R1 — console session (lab router, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description ENUGU LAN","ip address 10.30.1.1 255.255.255.0","no shutdown","interface g0/1","description TO EN-DC data centre router","ip address 10.20.0.1 255.255.255.252","no shutdown","exit",
    "ip route 10.44.8.0 255.255.255.0 10.20.0.2","ip route 10.50.0.0 255.255.0.0 10.20.0.6","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code>. Both interfaces are up.",
  tasks:[
    {text:"Compare <code>show running-config | include ip route</code> with <code>show ip route static</code>. Which configured static is missing from the table?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+run/i.test(h)) && e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+st/i.test(h))},
    {text:"Ask about one user's destination, <code>show ip route 10.44.12.7</code>, then look up the missing route's next hop, <code>show ip route 10.20.0.6</code>", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+10\.44\.12\.7/i.test(h)) && e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+10\.20\.0\.6/i.test(h))},
    {text:"Replace the 10.44.8.0 static with one whose mask covers 10.44.8.0–10.44.15.255 (remove the old one with <code>no ip route …</code> first)", done:e=>e.routes.some(r=>r.net==="10.44.8.0" && r.mask==="255.255.248.0" && r.nh==="10.20.0.2") && !e.routes.some(r=>r.net==="10.44.8.0" && r.mask==="255.255.255.0")},
    {text:"Point 10.50.0.0/16 at the real next hop, EN-DC 10.20.0.2, and remove the broken one", done:e=>e.routes.some(r=>r.net==="10.50.0.0" && r.mask==="255.255.0.0" && r.nh==="10.20.0.2") && !e.routes.some(r=>r.nh==="10.20.0.6")},
    {text:"Prove it: <code>show ip route 10.44.12.7</code> now names a /21; then save with <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.routes.some(r=>r.mask==="255.255.248.0") && e.history.filter(h=>/^\s*(do\s+)?sh\S*\s+ip\s+ro\S*\s+10\.44\.12\.7/i.test(h)).length>=2},
  ],
  win:"Two statics that &lsquo;were configured&rsquo; and still failed: one too narrow for the servers, one pointing at a next hop that doesn't exist, so it was never installed. Config isn't proof — the routing table is.",
  solve:["enable","show running-config | include ip route","show ip route static","show ip route 10.44.12.7","show ip route 10.20.0.6","configure terminal","no ip route 10.44.8.0 255.255.255.0 10.20.0.2","ip route 10.44.8.0 255.255.248.0 10.20.0.2","no ip route 10.50.0.0 255.255.0.0 10.20.0.6","ip route 10.50.0.0 255.255.0.0 10.20.0.2","end","show ip route static","show ip route 10.44.12.7","copy running-config startup-config",""]})}
${K.check({q:"A user gets 'Reply from 10.81.0.1: Destination host unreachable.' when pinging a server at head office. 10.81.0.1 is the user's own gateway, a router. Where do you look first?", o:["The server's default gateway","The gateway's routing table for the server's address — it has no route forward","The user's VLAN","The return path at head office"], a:1, why:"The reply comes from a router's address, not the PC's own, so it's the router saying it had no route for a remote destination — here the user's own gateway. Run show ip route <server address> on it, then find out why it never learned the route."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A static route meant for the partner range 10.88.0.0 to 10.88.1.255 was typed as ip route 10.88.0.0 255.255.255.0 172.30.0.2. Users reach 10.88.0.x but not 10.88.1.40. Type the mask that covers exactly the intended range.", fields:[{label:"Mask", a:["255.255.254.0","/23"]}], why:"1. What is asked? The mask for 10.88.0.0–10.88.1.255. 2. Which rule? A prefix covers a power-of-two block. 3. Apply it: two /24s = 512 addresses = 2 to the 9th, so 32 − 9 = /23, mask 255.255.254.0. With /24, only 10.88.0.x matched; 10.88.1.40 fell through to the default, or to nothing."})}
${K.job("Ilorin branch: email works, payroll doesn't",`
<h3>Ticket 7318 · 09:12 · Retail chain, Ilorin branch — &ldquo;since 9am we can reach email but not the payroll server&rdquo;</h3>
<p><b>Symptom and questions.</b> Every PC: email works, payroll at head office (10.15.40.25) doesn't. &ldquo;Anything change?&rdquo; — <i>&ldquo;Our router was replaced on Saturday; the engineer copied the Ilorin-2 shop's config.&rdquo;</i> Whole site after a swap: start at the branch router.</p>
<p><b>Checks.</b> <code>tracert 10.15.40.25</code>: the gateway, the <i>local ISP's</i> router, then stars — payroll leaves by the branch's internet breakout (its static default), as email does. <code>show ip route 10.15.40.25</code>: <code>% Network not in table</code>. <code>show ip ospf neighbor</code>: empty. <code>show logging</code>: <code>%OSPF-4-DUP_RTRID_NBR … duplicate router-id 10.15.0.31</code> — the cloned config gave it the same router ID as Ilorin-2's router, its only OSPF neighbour on the way to head office, so each discards the other's hellos.</p>
<p><b>Fix.</b> <code>router-id 10.15.0.32</code> under <code>router ospf 1</code>, then <code>clear ip ospf process</code>, <code>yes</code> (the restart drops adjacencies for a few seconds — warn the branch). Neighbour FULL, OSPF route present, <code>write memory</code>.</p>
<p><b>What you say.</b> &ldquo;Your new router copied a setting that clashed with another shop's, so payroll traffic went to the internet. It's corrected — please open payroll and confirm.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Cloned config duplicated Ilorin-2's OSPF RID; no adjacency, payroll used local default. RID set to .32, OSPF cleared (branch warned), FULL, user confirmed, saved. Follow-up: RID on cloning checklist.&rdquo;</i></p>
`)}

<h2>Fingerprints: nine classic faults and the line that gives each away</h2>
<p>Each fault answers &ldquo;why is this router's route missing, or wrong?&rdquo; Learn the symptom and the line that proves the cause.</p>
<div class="tablewrap"><table>
<tr><th>Fault</th><th>What users see</th><th>Fingerprint</th><th>Fix</th></tr>
<tr><td><b>Missing return route</b></td><td>Timed out; works one way</td><td><code>show ip route &lt;source&gt;</code> on a far router: <code>% Network not in table</code>; <code>ping … source &lt;LAN&gt;</code> gives <code>.....</code> while a plain ping works</td><td>Add the route back (or advertise the source)</td></tr>
<tr><td><b>Wrong mask in a static</b></td><td>Some hosts in a range work, others don't</td><td><code>show ip route &lt;failing host&gt;</code> misses the static; its prefix is too long</td><td>Remove it, re-add with the right mask</td></tr>
<tr><td><b>Floating static, wrong AD</b></td><td>Traffic on the backup while the primary is fine</td><td><code>S</code> where you expected <code>O</code>; or two <code>[1/0]</code> lines for one prefix</td><td>Re-enter it with a distance above the primary's</td></tr>
<tr><td><b>Passive on a transit link</b></td><td>A whole site loses its OSPF routes</td><td><code>No Hellos (Passive interface)</code> on the WAN; no neighbours</td><td><code>no passive-interface</code> there; passive on the LAN</td></tr>
<tr><td><b>Area mismatch</b></td><td>No adjacency on one link</td><td><code>%OSPF-4-ERRRCV … mismatched area ID</code></td><td>Same area at both ends</td></tr>
<tr><td><b>Duplicate router ID</b></td><td>No adjacency after a cloned config</td><td><code>%OSPF-4-DUP_RTRID_NBR</code> (the neighbour uses your ID)</td><td><code>router-id</code> + <code>clear ip ospf process</code></td></tr>
<tr><td><b>Missing network statement</b></td><td>One subnet unreachable from everywhere else</td><td>Absent from <i>Routing for Networks</i> in <code>show ip protocols</code></td><td>Add the <code>network</code> (or <code>ip ospf 1 area 0</code>)</td></tr>
<tr><td><b>Default not originated</b></td><td>Sites reach each other, not the internet</td><td><code>Gateway of last resort is not set</code>; no <code>O*E2</code></td><td><code>default-information originate</code> on the edge</td></tr>
<tr><td><b>HSRP without preempt</b></td><td>After an outage the &ldquo;wrong&rdquo; router stays gateway</td><td><code>show standby brief</code>: higher priority, no <code>P</code>, Standby</td><td><code>standby N preempt</code></td></tr>
</table></div>
<h3>The static faults</h3>
<p>A floating static hides only if its AD is <i>higher</i> than the route it backs up. Two slips: no distance, so the backup gets AD 1 and ties with the primary; or 100 behind OSPF's 110, so the backup beats OSPF all day.</p>
${K.out(`WR-EDGE#show ip route static
...
Gateway of last resort is 192.0.2.5 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 192.0.2.5
                [1/0] via 192.0.2.9`, "Two equal statics for one prefix: both installed, traffic shared. If 192.0.2.9 is the metered backup, it carries real traffic every day.")}
<p>Re-enter it with a distance — <code>ip route 0.0.0.0 0.0.0.0 192.0.2.9 5</code> — and IOS replaces the old entry; only the primary stays in the table (behind OSPF it would need more than 110).</p>
${K.dyk(`Equal routes share the load: ${K.g("CEF","Cisco Express Forwarding: the fast forwarding table IOS builds from the routing table. With equal-cost paths its default (&lsquo;per-destination&rsquo;) mode hashes each packet's source and destination addresses, so one flow sticks to one path.")} hashes each source–destination pair onto one path (the lab simplifies: it picks by destination only), so a &ldquo;backup&rdquo; that ties with the primary never sits idle — and nobody notices until the bill arrives.`)}
<h3>The OSPF faults: the adjacency, then the advertisement</h3>
<p>An OSPF route is missing because the routers aren't neighbours, or because the network was never put into OSPF. <b>Neighbours first</b>: <code>show ip ospf neighbor</code> should list FULL (or 2WAY/DROTHER between DROTHERs, lesson 5). Nothing? The interface and log say why:</p>
${K.out(`WR-R1#show ip ospf interface g0/1
GigabitEthernet0/1 is up, line protocol is up
  Internet Address 10.77.0.1/30, Interface ID 2, Area 0
...
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
    oob-resync timeout 40
    No Hellos (Passive interface)
...
  Neighbor Count is 0, Adjacent neighbor count is 0`, "Passive on a transit link: the link is advertised, but no hellos go out, so no neighbour can form across it.")}
${K.out(`WR-R2#show logging
...
*Oct 11 10:14:14.274: %OSPF-4-ERRRCV: Received invalid packet: mismatched area ID, from backbone area must be virtual-link but not found from 10.77.0.1, GigabitEthernet0/1`, "Area mismatch: WR-R2 put the link in area 2, WR-R1 in area 0 (compare the Area column of show ip ospf interface brief at each end). Hellos are rejected; the log names the sender. This longer wording appears on the non-backbone end that hears area-0 hellos; WR-R1, the area-0 end, logs the plain line: mismatched area ID from 10.77.0.2, GigabitEthernet0/1.")}
<p>A duplicate router ID logs <code>%OSPF-4-DUP_RTRID_NBR</code> (you'll see it on the bench). <b>Then the advertisement</b>: neighbour FULL but one network missing everywhere? Its owner isn't running OSPF on it:</p>
${K.out(`KN-R1#show ip protocols
Routing Protocol is "ospf 1"
  Outgoing update filter list for all interfaces is not set
  Incoming update filter list for all interfaces is not set
  Router ID 10.40.0.21
  Number of areas in this router is 1. 1 normal 0 stub 0 nssa
  Maximum path: 4
  Routing for Networks:
    10.40.255.0 0.0.0.3 area 0
  Passive Interface(s):
    GigabitEthernet0/0
...`, "Kano (trimmed): the WAN /30 is in OSPF, the LAN 10.40.50.0/24 isn't. Passive does NOT advertise anything — it only silences an interface already in OSPF. This caused the loop earlier.")}
<p><b>The default.</b> <code>Gateway of last resort is not set</code> and no <code>O*E2</code> on a branch: nobody sent one. <code>default-information originate</code> on the edge advertises it while the edge has a default itself (<code>always</code> advertises regardless, attracting traffic it can't deliver). Fixed, the branch shows <code>O*E2 0.0.0.0/0 [110/1] via 10.40.255.1</code>.</p>
<h3>HSRP without preempt</h3>
${K.out(`IB-GW1#show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       1    110   Standby 10.40.10.3      local           10.40.10.1`, "IB-GW1 has the higher priority but no P: after a reboot it stays Standby while IB-GW2 keeps the job.")}
<p>Preempt is off by default (lesson 7): priority counts only at the first election; then the Active router keeps the role until it fails. Nothing &ldquo;breaks&rdquo; — traffic takes the second-choice path (an extra first hop in tracert). Fix: <code>standby 1 preempt</code>.</p>
${K.myth([
  ["If the router can ping it, the users can reach it.","The router's ping is sourced from its exit interface. The users' subnet needs its own route back on every router."],
  ["Any distance makes a static a safe backup.","It floats only behind routes with a LOWER AD: 100 floats behind a static but beats OSPF's 110."],
  ["passive-interface advertises a network into OSPF.","It only stops hellos. The network statement (or ip ospf area) puts the interface into OSPF."],
])}
${K.q({type:"match", q:"A new branch router WR-R9 won't exchange routes with the hub. Match each line you might find on it with the fault it proves.", pairs:[["%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID","The two ends of the link are in different areas"],["%OSPF-4-DUP_RTRID_NBR: OSPF detected duplicate router-id","Two routers use the same router ID"],["No Hellos (Passive interface) on the WAN link","Passive on a transit link"],["Routing for Networks lists the WAN /30 but not the LAN","Missing network statement"],["Gateway of last resort is not set, no O*E2","Default not originated"]], why:"1. What is asked? Which fault each line proves. 2. Which rule? A neighbour needs matching hellos (same area, unique IDs, hellos actually sent); a network needs a network statement; a default needs origination. 3. Apply it: ERRRCV names the area check, DUP_RTRID the ID check, No Hellos the passive setting; the last two are about advertisements, not the adjacency."})}
<h3>Hands-on: watch four fingerprints happen</h3>
<p>Port Harcourt port operations: PH-CORE serves the operations LAN and reaches the wharf office over a primary link running OSPF; a radio path through PH-MAST is the static backup. Ops says the wharf PCs &ldquo;stopped answering after Friday's router replacement&rdquo;.</p>
${K.bench({id:"m5-fingerprints", points:100, from:"CCNA · Module 5 · lesson 8", title:"one-way pings, a cloned router ID, a backup that won't float", viewBox:"0 0 780 380", openLog:true,
  intro:"Console cable on PH-WHARF: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control; no enable secrets. Design: OSPF area 0 on the primary link (router IDs 172.16.0.1 PH-CORE, 172.16.0.2 PH-WHARF); the radio path via PH-MAST is backup only (floating statics, distance 250). Tip: <code>ping … source &lt;interface&gt;</code> on a router tests the way back for that interface's subnet.",
  devices:[
    {id:"core", kind:"router", label:"PH-CORE", x:10, y:140, config:e=>{ ["en","conf t","hostname PH-CORE","no ip domain-lookup","int g0/0","description OPS LAN","ip address 192.168.50.1 255.255.255.0","no shut","int g0/1","description PRIMARY to PH-WHARF Gi0/1","ip address 172.16.12.1 255.255.255.252","no shut","int g0/2","description RADIO to PH-MAST Gi0/1","ip address 172.16.13.1 255.255.255.252","no shut","exit",
      "ip route 192.168.60.0 255.255.255.0 172.16.13.2 100","router ospf 1","router-id 172.16.0.1","network 172.16.12.0 0.0.0.3 area 0","network 192.168.50.0 0.0.0.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"mast", kind:"router", label:"PH-MAST", x:290, y:20, config:e=>{ ["en","conf t","hostname PH-MAST","no ip domain-lookup","int g0/1","description RADIO to PH-CORE","ip address 172.16.13.2 255.255.255.252","no shut","int g0/2","description RADIO to PH-WHARF","ip address 172.16.23.1 255.255.255.252","no shut","exit",
      "ip route 192.168.60.0 255.255.255.0 172.16.23.2","ip route 192.168.50.0 255.255.255.0 172.16.13.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"wharf", kind:"router", label:"PH-WHARF", x:570, y:140, config:e=>{ ["en","conf t","hostname PH-WHARF","no ip domain-lookup","int g0/0","description WHARF LAN","ip address 192.168.60.1 255.255.255.0","no shut","int g0/1","description PRIMARY to PH-CORE Gi0/1","ip address 172.16.12.2 255.255.255.252","no shut","int g0/2","description RADIO to PH-MAST Gi0/2","ip address 172.16.23.2 255.255.255.252","no shut","exit",
      "router ospf 1","router-id 172.16.0.1","network 172.16.12.0 0.0.0.3 area 0","network 192.168.60.0 0.0.0.255 area 0","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pco", kind:"pc", label:"PC-OPS", x:40, y:270, ip:"192.168.50.10", mask:"255.255.255.0", gw:"192.168.50.1"},
    {id:"pcw", kind:"pc", label:"PC-WHARF", x:640, y:270, ip:"192.168.60.10", mask:"255.255.255.0", gw:"192.168.60.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:340, y:270},
  ],
  cables:[ {type:"cat6", a:"core:g1", b:"wharf:g1"}, {type:"cat6", a:"core:g2", b:"mast:g1"}, {type:"cat6", a:"mast:g2", b:"wharf:g2"}, {type:"cat6", a:"pco:eth", b:"core:g0"}, {type:"cat6", a:"pcw:eth", b:"wharf:g0"}, {type:"console", a:"lap:usb", b:"wharf:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"From PC-OPS's Command Prompt, <code>ping 192.168.60.10</code> (PC-WHARF). Timed out, or unreachable? Then ping by hops along the radio path: <code>ping 172.16.13.2</code> (PH-MAST) and <code>ping 192.168.60.1</code> (PH-WHARF's LAN address — PH-CORE has a route for the wharf LAN, but none for the radio /30 beyond PH-MAST). Which is the first that fails, and how?", done:B=>Bench.tried(B,"pco",/ping\s+192\.168\.60\.10/) && Bench.tried(B,"pco",/ping\s+(192\.168\.60\.1|172\.16\.23\.2)\b/)},
    {text:"On PH-WHARF's console, <code>enable</code>, then ask how it would send the reply home: <code>show ip route 192.168.50.10</code>. Then <code>show ip ospf neighbor</code> and <code>show logging</code> — find the line that explains why PH-WHARF never learned the ops LAN", done:B=>{ const h = B.devs.wharf.env.history; return h.some(x=>/sh\S*\s+ip\s+ro\S*\s+192\.168\.50\./i.test(x)) && h.some(x=>/sh\S*\s+log/i.test(x)); }},
    {text:"Set PH-WHARF's router ID to the design's 172.16.0.2 (<code>router ospf 1</code>, <code>router-id …</code>); it takes effect only after <code>clear ip ospf process</code> — answer <code>yes</code>. Done when the routers are FULL neighbours and PC-OPS's ping to PC-WHARF works", done:B=>Bench.ospfNbr(B,"core","172.16.0.2") && Bench.ospfNbr(B,"wharf","172.16.0.1") && Bench.pinged(B,"pco","192.168.60.10")},
    {text:"OSPF is up, so why does <code>tracert 192.168.60.10</code> from PC-OPS still cross 172.16.13.2, the radio? Move the console cable to PH-CORE and read <code>show ip route 192.168.60.10</code> (Known via? distance?). Re-enter the radio static with distance 250 so OSPF's route wins", done:B=>!!Bench.route(B,"core","192.168.60.0/24","O") && B.devs.core.env.routes.some(r=>r.net==="192.168.60.0" && r.ad>110)},
    {text:"Primary-link cut drill: click the cable on PH-CORE's G0/1 and <b>Unplug</b> it. Check that PH-CORE's floating static took over (<code>show ip route 192.168.60.10</code>), then ping PC-WHARF from PC-OPS again. What happens?", done:B=>!Bench.linked(B,"core:g1","wharf:g1") && !!Bench.route(B,"core","192.168.60.0/24","S") && Bench.tried(B,"pco",/ping\s+192\.168\.60\.10/)},
    {text:"Find the router with no backup way home (<code>show ip route 192.168.50.10</code>) and give it the missing floating static via PH-MAST (172.16.23.1, distance 250). Done when PC-OPS pings PC-WHARF with the primary link still unplugged", done:B=>!Bench.linked(B,"core:g1","wharf:g1") && Bench.pinged(B,"pco","192.168.60.10") && B.devs.wharf.env.routes.some(r=>r.net==="192.168.50.0" && r.nh==="172.16.23.1" && r.ad>110)},
    {text:"Restore the primary link with a Cat6 from the tray (PH-CORE G0/1 to PH-WHARF G0/1). Done when OSPF routes are back at both ends and <code>tracert 192.168.60.10</code> from PC-OPS completes — via 172.16.12.2 again", done:B=>Bench.linked(B,"core:g1","wharf:g1") && !!Bench.route(B,"core","192.168.60.0/24","O") && !!Bench.route(B,"wharf","192.168.50.0/24","O") && Bench.traced(B,"pco","192.168.60.10")},
  ],
  win:"'Timed out' sent you to the return path, the return path to a missing adjacency, the log to a cloned router ID; an S where you expected an O exposed a backup with the wrong distance; and the cut drill proved a backup must exist in both directions.",
  solve:[["pc","pco","ping 192.168.60.10"],["pc","pco","ping 172.16.13.2"],["pc","pco","ping 192.168.60.1"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route 192.168.50.10"],["term","show ip ospf neighbor"],["term","show logging"],
    ["term","configure terminal"],["term","router ospf 1"],["term","router-id 172.16.0.2"],["term","end"],["term","clear ip ospf process"],["term","yes"],["term","show ip ospf neighbor"],
    ["pc","pco","ping 192.168.60.10"],["pc","pco","tracert 192.168.60.10"],
    ["unplug","lap:usb"],["plug","console","lap:usb","core:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route 192.168.60.10"],
    ["term","configure terminal"],["term","ip route 192.168.60.0 255.255.255.0 172.16.13.2 250"],["term","end"],["term","show ip route 192.168.60.10"],["pc","pco","tracert 192.168.60.10"],
    ["unplug","core:g1"],["term","show ip route 192.168.60.10"],["pc","pco","ping 192.168.60.10"],
    ["unplug","lap:usb"],["plug","console","lap:usb","wharf:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route 192.168.50.10"],
    ["term","configure terminal"],["term","ip route 192.168.50.0 255.255.255.0 172.16.23.1 250"],["term","end"],["pc","pco","ping 192.168.60.10"],
    ["plug","cat6","core:g1","wharf:g1"],["pc","pco","tracert 192.168.60.10"],["term","write memory"]]})}
${K.hint(`Task 1: with no OSPF yet, the radio path is the only one in use, so follow it. Task 4: <code>distance 100</code> beats OSPF's 110 — what number would lose? Re-typing the same <code>ip route</code> with a new distance replaces the old one. Task 6: PH-MAST routes both ways; check the far end.`)}
${K.check({q:"On a branch router, show ip ospf neighbor is empty and show ip ospf interface g0/1 (the WAN link) shows 'Hello 10, Dead 40' and 'No Hellos (Passive interface)'. What is the fix?", o:["Change the hello timer to match the hub","no passive-interface g0/1 under router ospf, and make the LAN interface passive instead","Add a network statement for the WAN link","clear ip ospf process"], a:1, why:"No Hellos (Passive interface) on the WAN link means OSPF runs there but stays silent, so no adjacency can form. Remove passive from the transit link; the LAN, where no other router lives, should be passive."})}
<h3>Same logic, new situation</h3>
<p>Two routers on a new /30 in Jos never become neighbours: same area, unique router IDs, nothing passive, a quiet log. <code>show ip ospf interface g0/0</code> shows <code>Hello 10, Dead 40</code> on JS-R1 and <code>Hello 5, Dead 20</code> on JS-R2.</p>
${K.hint(`None of the nine fingerprints matches exactly. Which hello fields must agree for a neighbour to form (lesson 6)?`)}
${K.reveal("Walk through the reasoning",`<p><b>1. What is asked?</b> Why no adjacency. <b>2. Which rule?</b> Hellos must agree on area, subnet and mask, hello and dead timers (and authentication), with different router IDs. <b>3. Apply it.</b> Everything else is ruled out; the timers differ, so each router discards the other's hellos. Fix: <code>no ip ospf hello-interval</code> on JS-R2 (its derived dead interval resets too). Proof: FULL, and <code>%OSPF-5-ADJCHG … LOADING to FULL</code>.</p>`)}
${K.case("The ATMs that could talk but never hear",`
<p>A bank in Abuja moved its ATMs onto new subnets and tested by pinging each ATM gateway <i>from the head-office core router</i>. All worked. On Monday, 40 ATMs showed &ldquo;host unavailable&rdquo;.</p>
<p>Requests arrived; replies never came back. A data-centre router in between, run by another team with statics, had nothing for the new ranges, so replies followed its default to the internet firewall and died. The test had used the core's own address as source — one that router <i>did</i> know.</p>
<p>The fix was one summary static. The lessons: test from the new subnet, and list every router that must route <i>to</i> and <i>back from</i> it. The change template now says: <b>&ldquo;Return path checked on: …&rdquo;</b></p>`)}
${K.dodont([
  "Test from the user's subnet before and after every fix, and paste the output into the ticket.",
  "Check the return path: <code>show ip route &lt;source&gt;</code> on each far router.",
  "Read show logging on every router you touch — OSPF says why it refused a neighbour.",
  "Give each floating static a distance above the route it backs up, then test the failover.",
],[
  "Close a ticket because the router's own ping works.",
  "Paper over a broken OSPF adjacency with static routes.",
  "Make a WAN or transit interface passive.",
  "Assume the highest HSRP priority is Active — look for the P.",
])}
${K.mistake(`Fixing the symptom one hop from the cause. A static for Kano's LAN on the edge router &ldquo;fixes&rdquo; the loop, but Kano is still missing from OSPF for every other router. Fix the router whose <i>own</i> config is wrong.`)}

<h2>The Module 5 challenge</h2>
<p>Kestrel Freight (Ikeja head office, branches at Apapa and Abuja) had its routers replaced over the weekend by a contractor who no longer answers his phone. On Monday the NOC has seven complaints, all from this module.</p>
${K.svg("0 0 780 430",
  K.dev("router",390,40,"ISP-EDGE","not yours · no login")+K.dev("server",640,40,"SUPPLIER-WEB","203.0.113.11")+
  K.dev("router",250,150,"HQ-R1","internet edge · .2")+K.dev("router",530,150,"HQ-R2","WAN hub · .3")+
  K.dev("switch",390,250,"HQ-SW","HQ LAN 10.60.10.0/24 · VIP .1")+K.dev("pc",170,250,"HQ-PC",".50")+K.dev("server",250,330,"HQ-FILES",".20")+K.dev("router",530,330,"BANK-GW",".254 · 172.20.4.0/22")+
  K.dev("router",90,370,"BR-APAPA","LAN 10.60.20.0/24")+K.dev("router",660,370,"BR-ABUJA","LAN .30.0/24 · CCTV .31.0/24")+
  K.link(370,48,262,140,"")+K.link(410,48,282,140,"",true)+K.txt(278,122,"fibre",{end:true,s:10})+K.txt(318,122,"LTE (metered)",{s:10})+K.link(414,40,624,40,"")+
  K.link(250,160,370,245)+K.link(530,160,410,245)+K.link(194,252,364,252)+K.link(262,322,378,262)+K.link(510,322,404,262)+
  K.link(518,162,110,360,"10.60.255.0/30")+K.link(548,162,650,360,"10.60.255.4/30"),
  "The challenge network: OSPF area 0; HQ-R1 holds the internet defaults and bank route; HQ-R1 and HQ-R2 share the HSRP gateway 10.60.10.1. PC settings are correct.")}
<p>Each complaint is an outcome, not an instruction. Some faults hide others: start with what affects the most people, and re-test after each fix.</p>
${K.tip(`Give each complaint ten honest minutes before its <b>Hint</b>. Keep a scratch list — complaint, first failing hop, fingerprint, fix, proof: it becomes your ticket notes and your portfolio's break/fix log.`)}
${K.bench({id:"m5-challenge", points:200, challenge:true, power:true, from:"CCNA · Module 5 · lesson 8", title:"Module 5 challenge — the Monday after the router swap", viewBox:"0 0 960 600",
  intro:"Console cable on HQ-R1 (9600 8N1, no flow control); move it as needed. Enable secret on Kestrel's routers: <code>Kestrel26</code>. ISP-EDGE and BANK-GW belong to other companies (no login; configs correct). <b>Design:</b> OSPF 1, area 0, router IDs 10.60.0.1 / .2 / .11 / .12 (HQ-R1, HQ-R2, Apapa, Abuja); branch LANs passive (the HQ LAN carries the HQ-R1–HQ-R2 adjacency, so it stays active). HQ-R1: fibre to 198.51.100.1, metered LTE to 198.51.100.5 as backup only, default advertised into OSPF; bank 172.20.4.0/22 via 10.60.10.254. HSRP group 1, VIP 10.60.10.1: HQ-R1 Active (110, preempt), HQ-R2 100. <b>Lab notes:</b> the ISP routes 10.60.0.0/16 back (real life: NAT, Module 7); Power buttons test failover.",
  devices:[
    {id:"isp", kind:"router", label:"ISP-EDGE", x:150, y:12, config:e=>{ ["en","conf t","hostname ISP-EDGE","enable secret Isp0nly-26","no ip domain-lookup","int g0/0","description KESTREL HQ-R1 fibre","ip address 198.51.100.1 255.255.255.252","no shut","int g0/1","description KESTREL HQ-R1 LTE","ip address 198.51.100.5 255.255.255.252","no shut","int g0/2","description HOSTING","ip address 203.0.113.1 255.255.255.0","no shut","exit",
      "ip route 10.60.0.0 255.255.0.0 198.51.100.2","ip route 10.60.0.0 255.255.0.0 198.51.100.6 200","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"web", kind:"server", label:"SUPPLIER-WEB", x:10, y:10, ip:"203.0.113.11", mask:"255.255.255.0", gw:"203.0.113.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:840, y:10},
    {id:"hq1", kind:"router", label:"HQ-R1", x:10, y:130, config:e=>{ ["en","conf t","hostname HQ-R1","enable secret Kestrel26","no ip domain-lookup","int g0/0","description HQ LAN","ip address 10.60.10.2 255.255.255.0","standby 1 ip 10.60.10.1","no shut",
      "int g0/1","description PRIMARY fibre to ISP-EDGE","ip address 198.51.100.2 255.255.255.252","no shut","int g0/2","description BACKUP metered LTE to ISP-EDGE","ip address 198.51.100.6 255.255.255.252","no shut","exit",
      "ip route 0.0.0.0 0.0.0.0 198.51.100.1","ip route 0.0.0.0 0.0.0.0 198.51.100.5","ip route 172.20.4.0 255.255.255.0 10.60.10.254",
      "router ospf 1","router-id 10.60.0.1","network 10.60.0.0 0.0.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"hq2", kind:"router", label:"HQ-R2", x:250, y:130, config:e=>{ ["en","conf t","hostname HQ-R2","enable secret Kestrel26","no ip domain-lookup","int g0/0","description HQ LAN","ip address 10.60.10.3 255.255.255.0","standby 1 ip 10.60.10.1","standby 1 priority 110","standby 1 preempt","no shut",
      "int g0/1","description WAN to BR-APAPA","ip address 10.60.255.1 255.255.255.252","no shut","int g0/2","description WAN to BR-ABUJA","ip address 10.60.255.5 255.255.255.252","no shut","exit",
      "router ospf 1","router-id 10.60.0.2","network 10.60.0.0 0.0.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"bank", kind:"router", label:"BANK-GW", x:720, y:130, config:e=>{ ["en","conf t","hostname BANK-GW","enable secret B4nk-0nly","no ip domain-lookup","int g0/0","description KESTREL HQ LAN","ip address 10.60.10.254 255.255.255.0","no shut","int lo0","description SETTLEMENT GATEWAY","ip address 172.20.6.10 255.255.255.255","exit","ip route 10.60.0.0 255.255.0.0 10.60.10.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"hqsw", kind:"switch", label:"HQ-SW", x:10, y:250, model:"Catalyst 9200 · HQ LAN", platform:"C9200L"},
    {id:"hqpc", kind:"pc", label:"HQ-PC", x:470, y:240, ip:"10.60.10.50", mask:"255.255.255.0", gw:"10.60.10.1"},
    {id:"hqsrv", kind:"server", label:"HQ-FILES", x:600, y:240, ip:"10.60.10.20", mask:"255.255.255.0", gw:"10.60.10.1"},
    {id:"br1", kind:"router", label:"BR-APAPA", x:10, y:380, config:e=>{ ["en","conf t","hostname BR-APAPA","enable secret Kestrel26","no ip domain-lookup","int g0/0","description APAPA LAN","ip address 10.60.20.1 255.255.255.0","no shut","int g0/1","description WAN to HQ-R2","ip address 10.60.255.2 255.255.255.252","no shut","exit",
      "router ospf 1","router-id 10.60.0.11","network 10.60.0.0 0.0.255.255 area 0","passive-interface g0/1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"br2", kind:"router", label:"BR-ABUJA", x:480, y:380, config:e=>{ ["en","conf t","hostname BR-ABUJA","enable secret Kestrel26","no ip domain-lookup","int g0/0","description ABUJA LAN","ip address 10.60.30.1 255.255.255.0","no shut","int g0/1","description WAN to HQ-R2","ip address 10.60.255.6 255.255.255.252","no shut","int g0/2","description ABUJA CCTV","ip address 10.60.31.1 255.255.255.0","no shut","exit",
      "router ospf 1","router-id 10.60.0.12","network 10.60.30.0 0.0.0.255 area 1","network 10.60.255.4 0.0.0.3 area 1","passive-interface g0/0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pca", kind:"pc", label:"PC-APAPA", x:40, y:490, ip:"10.60.20.50", mask:"255.255.255.0", gw:"10.60.20.1"},
    {id:"pcb", kind:"pc", label:"PC-ABUJA", x:420, y:490, ip:"10.60.30.50", mask:"255.255.255.0", gw:"10.60.30.1"},
    {id:"nvr", kind:"server", label:"NVR-ABUJA", x:560, y:490, ip:"10.60.31.20", mask:"255.255.255.0", gw:"10.60.31.1"},
  ],
  cables:[ {type:"cat6", a:"isp:g0", b:"hq1:g1"}, {type:"cat6", a:"isp:g1", b:"hq1:g2"}, {type:"cat6", a:"isp:g2", b:"web:eth"},
    {type:"cat6", a:"hq1:g0", b:"hqsw:g1"}, {type:"cat6", a:"hq2:g0", b:"hqsw:g2"}, {type:"cat6", a:"hqpc:eth", b:"hqsw:g3"}, {type:"cat6", a:"hqsrv:eth", b:"hqsw:g4"}, {type:"cat6", a:"bank:g0", b:"hqsw:g5"},
    {type:"cat6", a:"hq2:g1", b:"br1:g1"}, {type:"cat6", a:"hq2:g2", b:"br2:g1"}, {type:"cat6", a:"pca:eth", b:"br1:g0"}, {type:"cat6", a:"pcb:eth", b:"br2:g0"}, {type:"cat6", a:"nvr:eth", b:"br2:g2"},
    {type:"console", a:"lap:usb", b:"hq1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Apapa branch (Funke):</b> &ldquo;Since the router swap nobody here can open anything at HQ — not even the file server.&rdquo; <i>Done when PC-APAPA can ping HQ-FILES (10.60.10.20) and BR-APAPA has an OSPF neighbour.</i>", hint:"PC-APAPA gets 'Destination host unreachable' from 10.60.20.1 — its gateway, not its own address — so BR-APAPA has no route to HQ. Does it have an OSPF neighbour? Read show ip ospf interface for its WAN link, Gi0/1: what is OSPF NOT sending there? Which interface should have that setting instead?", done:B=>Bench.ospfNbr(B,"br1","10.60.0.2") && Bench.pinged(B,"pca","10.60.10.20")},
    {text:"<b>Abuja branch (Musa):</b> &ldquo;Same here — HQ has been unreachable from Abuja since Saturday.&rdquo; <i>Done when PC-ABUJA can ping HQ-FILES and BR-ABUJA has an OSPF neighbour.</i>", hint:"Same symptom as Apapa, different fingerprint. show logging on BR-ABUJA or HQ-R2 names it, and show ip ospf interface brief at each end of 10.60.255.4/30 shows it in one column. The design says area 0: remove each wrong network statement with no network … and re-add it.", done:B=>Bench.ospfNbr(B,"br2","10.60.0.2") && Bench.pinged(B,"pcb","10.60.10.20")},
    {text:"<b>Both branches:</b> &ldquo;HQ works for us now, but the supplier portal (203.0.113.11) doesn't load at Apapa or Abuja.&rdquo; <i>Done when PC-APAPA and PC-ABUJA can both ping 203.0.113.11.</i>", hint:"Fix the two branch outages first. Then read a branch routing table: is there a Gateway of last resort, an O*E2 line? Where does the internet default live, and what must happen for OSPF to carry it to everyone else?", done:B=>!!Bench.route(B,"br1","0.0.0.0/0","O*E2") && !!Bench.route(B,"br2","0.0.0.0/0","O*E2") && Bench.pinged(B,"pca","203.0.113.11") && Bench.pinged(B,"pcb","203.0.113.11")},
    {text:"<b>Finance (Ada):</b> &ldquo;The LTE bill is huge again. That link is for emergencies — the fibre hasn't been down once this month.&rdquo; <i>Done when HQ-R1's default uses only the fibre (198.51.100.1) and the LTE route (198.51.100.5) is still configured as a backup that would take over if the fibre failed.</i>", hint:"traceroute 203.0.113.11 from HQ-R1: which ISP address is hop 1? Then show ip route static: how many lines does the default have, with what [AD/metric]? Typing an existing ip route again with a distance on the end replaces the old one.", done:B=>{ const r = Bench.route(B,"hq1","0.0.0.0/0"); return !!r && r.ad===1 && r.via.length===1 && r.via[0]==="198.51.100.1" && B.devs.hq1.env.routes.some(x=>x.net==="0.0.0.0" && x.mask==="0.0.0.0" && x.nh==="198.51.100.5" && x.ad>1 && x.ad<255); }},
    {text:"<b>Treasury (Kunle, at HQ):</b> &ldquo;The bank's settlement gateway, 172.20.6.10, doesn't answer. The bank says their side is fine and their network is 172.20.4.0/22.&rdquo; <i>Done when HQ-R1 routes 172.20.6.10 via BANK-GW (10.60.10.254) and HQ-PC can ping it.</i>", hint:"If HQ-R2 is the active gateway and has no default yet, HQ-PC's ping dies there — fix the branches' internet complaint first. Then tracert 172.20.6.10 from HQ-PC: towards the bank, or out to the ISP? On HQ-R1, show ip route 172.20.6.10, and compare the bank static's prefix length with /22.", done:B=>Bench.routeVia(B,"hq1","172.20.6.10")==="10.60.10.254" && Bench.pinged(B,"hqpc","172.20.6.10")},
    {text:"<b>Security desk (HQ):</b> &ldquo;We can't view the Abuja cameras on NVR-ABUJA (10.60.31.20), though Abuja says it's recording.&rdquo; <i>Done when HQ-PC can ping 10.60.31.20.</i>", hint:"Abuja must be back on OSPF first. Then tracert 10.60.31.20 from HQ-PC: a pair of addresses repeating is a loop — whose default is catching traffic that should have a specific route? Which router owns 10.60.31.0/24, and does its show ip protocols list that network?", done:B=>!!Bench.route(B,"hq2","10.60.31.0/24","O") && Bench.pinged(B,"hqpc","10.60.31.20")},
    {text:"<b>Design audit:</b> &ldquo;HQ users must use HQ-R1, the internet edge, as their gateway, and HQ-R1 must take the role back automatically after any outage. Today HQ's internet traffic goes through HQ-R2 first.&rdquo; <i>Done when HQ-R1 is HSRP Active for group 1 with preempt configured, and HQ-R2 is Standby.</i>", hint:"show standby brief on both: which is Active, at what priority, and which has the P? Raising a priority alone doesn't move the Active role — what else is needed? Set HQ-R2 back to the design with standby 1 priority 100 (or no standby 1 priority, which resets it to the default 100). Then use HQ-R1's Power button to prove it takes the role back.", done:B=>Bench.hsrpState(B,"hq1","GigabitEthernet0/0",1)==="Active" && Bench.hsrpState(B,"hq2","GigabitEthernet0/0",1)==="Standby" && !!((B.devs.hq1.env.intfs["GigabitEthernet0/0"].hsrp||{})[1]||{}).preempt},
  ],
  win:"Seven faults, one method — a passive WAN link, an area typo, a default nobody advertised, a 'backup' sharing the load, a mask one size too small, a subnet missing from OSPF, and an HSRP pair the wrong way round without preempt. You found each by asking where the packet stops, both ways, and reading the line that proves why.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Kestrel26"],
    ["term","show ip route"],["term","show standby brief"],["term","configure terminal"],["term","router ospf 1"],["term","default-information originate"],["term","exit"],
    ["term","ip route 0.0.0.0 0.0.0.0 198.51.100.5 250"],["term","no ip route 172.20.4.0 255.255.255.0 10.60.10.254"],["term","ip route 172.20.4.0 255.255.252.0 10.60.10.254"],
    ["term","interface g0/0"],["term","standby 1 priority 110"],["term","standby 1 preempt"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","hq2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Kestrel26"],
    ["term","configure terminal"],["term","interface g0/0"],["term","standby 1 priority 100"],["term","end"],["term","show standby brief"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","br1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Kestrel26"],
    ["term","configure terminal"],["term","router ospf 1"],["term","no passive-interface g0/1"],["term","passive-interface g0/0"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","br2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Kestrel26"],
    ["term","configure terminal"],["term","router ospf 1"],["term","no network 10.60.30.0 0.0.0.255 area 1"],["term","no network 10.60.255.4 0.0.0.3 area 1"],
    ["term","network 10.60.30.0 0.0.0.255 area 0"],["term","network 10.60.255.4 0.0.0.3 area 0"],["term","network 10.60.31.0 0.0.0.255 area 0"],["term","passive-interface g0/2"],["term","end"],["term","write memory"],
    ["pc","pca","ping 10.60.10.20"],["pc","pcb","ping 10.60.10.20"],["pc","pca","ping 203.0.113.11"],["pc","pcb","ping 203.0.113.11"],
    ["pc","hqpc","ping 172.20.6.10"],["pc","hqpc","ping 10.60.31.20"],["pc","hqpc","tracert 203.0.113.11"]]})}
${K.hint(`Stuck? The two branch outages hide most of the rest: until a branch has a neighbour, nothing else about it can be tested. Then the internet default (it also decides whether HQ-R2 reaches anything outside), then the bank, the cameras, the bill and the gateway design. Re-run every earlier ping after each fix.`)}
<h3>Instructor walkthrough</h3>
<p>Open these only after you've tried.</p>
${K.reveal("Fault 1 — Apapa: passive on the WAN link",`<p><b>Found:</b> <code>Reply from 10.60.20.1: Destination host unreachable</code> — the gateway has no route; no neighbours; <code>show ip ospf interface g0/1</code>: <code>No Hellos (Passive interface)</code> — the WAN made passive instead of the LAN. <b>Fix:</b> <code>no passive-interface g0/1</code>, <code>passive-interface g0/0</code>. <b>Proof:</b> FULL to 10.60.0.2; PC-APAPA pings HQ-FILES.</p>`)}
${K.reveal("Fault 2 — Abuja: the whole branch in area 1",`<p><b>Found:</b> same symptom, different fingerprint: <code>%OSPF-4-ERRRCV … mismatched area ID</code>; BR-ABUJA's interfaces show Area 1 (another customer's template). <b>Fix:</b> <code>no network … area 1</code> for both statements, re-added with <code>area 0</code>. <b>Proof:</b> FULL; PC-ABUJA pings HQ-FILES. This uncovers fault 6.</p>`)}
${K.reveal("Fault 3 — the default was never advertised",`<p><b>Found:</b> branches reach HQ, not the portal; <code>Gateway of last resort is not set</code>. HQ-R1 has defaults but no <code>default-information originate</code>, so HQ-R2 had none either — which also broke HQ-PC's internet while HQ-R2 was its gateway. <b>Fix:</b> <code>default-information originate</code> on HQ-R1 (not <code>always</code>). <b>Proof:</b> <code>O*E2 0.0.0.0/0 [110/1]</code> everywhere.</p>`)}
${K.reveal("Fault 4 — the 'backup' LTE default had AD 1",`<p><b>Found:</b> <code>S* 0.0.0.0/0 [1/0] via 198.51.100.1</code> and <code>[1/0] via 198.51.100.5</code>: load sharing; HQ-R1's traceroute to the portal leaves by 198.51.100.5. <b>Fix:</b> <code>ip route 0.0.0.0 0.0.0.0 198.51.100.5 250</code>. <b>Proof:</b> one default line, via the fibre; shut Gi0/1 and <code>S* [250/0] via 198.51.100.5</code> appears.</p>`)}
${K.reveal("Fault 5 — the bank static was a /24, not a /22",`<p><b>Found:</b> HQ-PC's tracert: HQ-R1 (after HQ-R2's 10.60.10.3 while HQ-R2 is still Active), then <code>198.51.100.1 reports: Destination host unreachable</code> — out to the ISP. On HQ-R1, <code>show ip route 172.20.6.10</code>: <code>% Network not in table</code>; the /24 covers only 172.20.4.x, so the default took it. <b>Fix:</b> remove it; <code>ip route 172.20.4.0 255.255.252.0 10.60.10.254</code>. <b>Proof:</b> <code>Routing entry for 172.20.4.0/22</code>; the ping works.</p>`)}
${K.reveal("Fault 6 — Abuja's CCTV subnet was never put into OSPF",`<p><b>Found:</b> HQ-PC's tracert to 10.60.31.20 loops 198.51.100.1, 198.51.100.2, 198.51.100.1…: no router knows 10.60.31.0/24, HQ-R1's default sends it to the ISP, the ISP's 10.60.0.0/16 sends it back. BR-ABUJA's <code>show ip protocols</code> lacks it. <b>Fix:</b> <code>network 10.60.31.0 0.0.0.255 area 0</code>, <code>passive-interface g0/2</code>. <b>Proof:</b> <code>O 10.60.31.0/24</code> on HQ-R2; the NVR answers.</p>`)}
${K.reveal("Fault 7 — HSRP the wrong way round, no preempt on HQ-R1",`<p><b>Found:</b> HQ-R2 <code>110 P Active</code>, HQ-R1 <code>100 Standby</code>, no P; HQ-PC's tracert starts at 10.60.10.3 then 10.60.10.2 — an extra hop. <b>Fix:</b> HQ-R1 <code>standby 1 priority 110</code> and <code>standby 1 preempt</code>; HQ-R2 <code>standby 1 priority 100</code> (or <code>no standby 1 priority</code> — same result, the default). (Priority without preempt moves nothing; and while both sit at 110, the tie goes to the higher IP, HQ-R2's .3 — so HQ-R1 takes over only once HQ-R2 drops to 100.) <b>Proof:</b> HQ-R1 <code>110 P Active</code>; power it off and on — HQ-R2 takes over, then HQ-R1 takes the role back.</p>
<p><b>Finally</b> <code>write memory</code> on all four, and a ticket note per complaint: fault, fingerprint, fix, proof.</p>`)}

<h2>Portfolio project: build it, break it, prove it</h2>
<p>An employer can't see inside your head, but they can read a GitHub repository with a design, real configs, real verification output and an honest break/fix log. That beats &ldquo;knowledge of OSPF&rdquo; on a CV.</p>
<h3>The brief</h3>
<p>Build a <b>three-site network</b> — a head office with two routers and two branches — in the Ladder Lab topology builder, Cisco Packet Tracer, or ${K.g("GNS3 / CML","GNS3 and Cisco Modeling Labs (CML): emulators that run real router software on your PC or a server — closer to production than Packet Tracer, heavier to set up.")}. It must have:</p>
<ul>
<li>A VLSM <b>addressing plan</b> from one private block (say 10.120.0.0/16), written <i>before</i> you configure.</li>
<li><b>OSPF</b> area 0: explicit router IDs, passive LANs, every subnet advertised.</li>
<li>An <b>internet edge</b>: primary static default, floating backup (distance 250) on a second link, <code>default-information originate</code>, and a small &ldquo;ISP&rdquo; router with a test host. Give the ISP a static route back to your private block — a stand-in for NAT (Module 7), as in the challenge — and say so in your write-up.</li>
<li><b>HSRP</b> at head office: the internet-edge router Active, with <code>preempt</code>.</li>
<li>One <b>partner static route</b> outside OSPF, correctly masked.</li>
</ul>
${K.steps([
  ["Design","Diagram and addressing table; router IDs, priorities and backup distance, each with a <i>why</i>."],
  ["Build","Hostnames, descriptions, addresses; ping every connected link before any routing."],
  ["Route and verify","OSPF, internet edge, HSRP — saving show outputs and tracerts as you go."],
  ["Fail it","Shut the primary internet link (capture the table and a tracert); power off the Active HSRP router (or shut its LAN interface) while a PC pings the far site — continuously with <code>ping -t</code> in Packet Tracer or on a real PC; the Ladder Lab PC has no <code>-t</code>, so ping before, during and after."],
  ["Break it on purpose","At least three faults from this lesson's nine, one at a time: symptom, fingerprint line, fix, proof."],
  ["Publish","README, configs and evidence folders, diagram — with passwords and anything real removed."],
])}
<h3>A write-up template you can copy</h3>
<p>Save this as <code>README.md</code> (${K.g("README","README.md: the file GitHub displays on a repository's front page, written in Markdown: # for headings, | for tables, ~~~ lines around a block of output.")}) and fill in each angle bracket.</p>
${K.out(`# Three-site OSPF network with HSRP and a floating internet backup
Author: <name> · Built with: <Packet Tracer / GNS3 / CML / Ladder Lab> · <month year>

## 1. Problem
<2-4 sentences: what the business needs and what must survive a failure>

## 2. Design (and why)
- OSPF process 1, area 0, router IDs <...>; LANs passive
- Default via <primary>; floating static via <backup> AD 250; originated into OSPF
- HSRP group <n>, VIP <address>: <router> 110 + preempt, <router> 100
- Partner network <prefix/length> via <next hop>

## 3. Addressing plan
| Subnet | Purpose | Gateway / VIP | Devices |
|--------|---------|---------------|---------|

## 4. Verification evidence (configs in /configs, outputs in /evidence)
~~~
<paste show ip ospf neighbor, a branch show ip route, tracerts>
~~~
| Failover test | Expected | Observed |
|---------------|----------|----------|
| Primary internet down | S* [250/0] via backup; tracert via backup | |
| Active HSRP router off, then on | Standby takes over; original preempts back | |

## 5. What broke and how I fixed it
| # | Fault | Symptom | Fingerprint (command + line) | Fix | Proof |
|---|-------|---------|------------------------------|-----|-------|

## 6. How to check my work
- Environment: simulated in <tool + version>, not production hardware
- Simplifications: <e.g. ISP routes my block back instead of NAT>
- Load the files in /configs into <tool> and run the commands in /evidence;
  outputs are pasted unedited, prompts and timestamps included

## 7. What I'd do next
<e.g. OSPF authentication, IPv6, NAT at the edge, syslog monitoring>`, "Copy the whole block; keep each evidence file as plain text pasted from the CLI. An employer can only trust what they can check: say what was simulated, and never tidy an output.")}
<h3>What &ldquo;done&rdquo; evidence looks like</h3>
<ul>
<li>A diagram matching the addressing table; <code>show ip ospf neighbor</code> from <b>every</b> router.</li>
<li>A branch <code>show ip route</code> with <code>O</code> routes and <code>O*E2 0.0.0.0/0</code>; tracerts between sites, normally and during the internet failure.</li>
<li><code>show standby brief</code> before, during and after the HSRP failover, with the continuous ping result.</li>
<li>Three or more break/fix entries with real fingerprint lines.</li>
<li>No passwords or real addresses; documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) for anything &ldquo;public&rdquo;.</li>
</ul>
${K.tip(`Post it: 150 words on LinkedIn — problem, diagram, one fix you proved, the link. In interviews, walk through a break/fix entry: your &ldquo;tell me about a time you troubleshot something&rdquo; answer, with evidence.`)}
${K.check({q:"Which evidence best proves a floating static route works as designed?", o:["The ip route lines from the running-config","show ip route static and a tracert, captured before AND during a primary-link failure","The topology diagram","show ip interface brief"], a:1, why:"Config only shows what was typed. A floating static's job is behaviour during a failure: the table and a traceroute before and during it prove the backup stays hidden, then takes over and carries traffic."})}

<h2>Interview corner</h2>
${K.hint(`Scope, then where it stops (both ways), then why — a command for each step, and proof at the end.`)}
${K.reveal("&ldquo;A remote site can't reach a server at head office. How do you troubleshoot it?&rdquo;",`<p>&ldquo;I scope it — whole site or one user, what changed — and test from a PC at the site; ping by hops or tracert finds the last router that answers. <code>Destination host unreachable</code> from a router's address: that router has no route forward, so <code>show ip route &lt;server&gt;</code> there. <code>Request timed out</code>: the return path, <code>show ip route &lt;source&gt;</code> on the far routers. Then why: config versus table for statics; neighbours, <code>show ip protocols</code> and the log for OSPF. I fix the router whose own config is wrong and prove it from the user's PC.&rdquo;</p>`)}
${K.hint(`The rule that makes it possible, the symptom, the evidence, and how it usually happens.`)}
${K.reveal("&ldquo;What is asymmetric routing, and how can it cause a one-way failure?&rdquo;",`<p>&ldquo;Each router uses only its own table, and a reply is a new packet to the source, so it can take a different path. That's normal; it fails when a router on the way back has no route to the source: the request arrives, the reply dies, users see <code>Request timed out</code> and traceroute goes silent there. I prove it with <code>show ip route &lt;source&gt;</code> on the far routers, or <code>ping … source</code>. Stateful firewalls add a twist: a reply returning through a different firewall is dropped.&rdquo;</p>`)}
${K.hint(`Two different ways a backup goes wrong, and how each shows up in output.`)}
${K.reveal("&ldquo;How do you know a floating static backup is correct?&rdquo;",`<p>&ldquo;Its distance must be above the primary's AD — above 1 behind a static, above 110 behind OSPF. Normally <code>show ip route</code> shows only the primary: an <code>S</code> where I expected <code>O</code> means the distance is too low; two <code>[1/0]</code> lines mean it was forgotten and the links share the load. Then I test: shut the primary, see the static appear at, say, <code>[250/0]</code>, and tracert from a user subnet across the backup — and check the far end has its own backup route home.&rdquo;</p>`)}

${K.recap([
  "A conversation needs a route to the destination on every router there AND to the source on every router back; each router decides alone.",
  "Method: scope, ping by hops, trace, <code>show ip route &lt;ip&gt;</code>, next hop, return path, OSPF evidence, HSRP state.",
  "Host unreachable from a router's IP = that router has no route forward; from your own IP = your PC couldn't ARP. Timed out = silence: return path first, then loops, then filters.",
  "Traceroute: !H (Windows: reports: Destination host unreachable) names the router with no route; endless stars start at the router that can't reply; repeating hops = loop; an odd hop = path choice.",
  "Statics: config versus table, masks by hand, next hops resolve, backups float above what they protect.",
  "OSPF: neighbours first (passive, area, duplicate RID, timers), then advertisements (show ip protocols), then the default.",
  "HSRP: higher priority wins only at election or with preempt — look for the P.",
  "Prove every fix from the user's side, and write the fingerprint in the ticket — and in your portfolio.",
])}
${K.next(`<b>Module 6 — IPv6.</b> Longest match, administrative distance, static and floating routes and next hops all carry straight over. Next: IPv6 addresses and how to shorten them, how hosts configure themselves with ${K.g("SLAAC","Stateless Address Autoconfiguration: an IPv6 host builds its own address from the router's advertised prefix — no DHCP server needed (Module 6).")}, and static IPv6 routing.`)}
`,
quiz:[
  {q:"A PC in 10.90.4.0/24 pings a server and gets 'Request timed out.' A tracert from the same PC lists its gateway and then only stars. Which check comes first?", o:["Replace the PC's network cable","On the router after the gateway, check for a route back to 10.90.4.0/24 with show ip route 10.90.4.x","Restart the server","Change the PC's default gateway"], a:1, why:"Timed out (not unreachable) and a trace that goes silent after hop 1 mean the next router can't forward or can't reply. The reply needs a route to the source, so check that router's table for the PC's address first.", lvl:1},
  {q:"Which output tells you a router has no specific route for an address and will rely on its default route, if it has one?", o:["Gateway of last resort is not set","% Network not in table (from show ip route <address>)","Routing entry for 10.0.0.0/8","Known via \"connected\", distance 0"], a:1, why:"show ip route <address> prints the longest-match entry but doesn't show the default. % Network not in table means no specific route matches; whether the packet is then forwarded depends on the Gateway of last resort.", lvl:1},
  {type:"order", q:"Put the routing troubleshooting method in order.", items:["Scope it: who, what, since when, what changed","Ping by hops from the user's subnet","Trace the path and note the last router that answered","On that router, show ip route <destination>","Check the next hop resolves and the exit interface is up","Check the return path: show ip route <source> on the far routers","Find why a route is missing: static config or OSPF evidence","Check HSRP state: which router is Active"], why:"Scope picks the starting point; pings and tracert find WHERE the packet stops; the table, next-hop resolution and the return path show what each router does; OSPF evidence and HSRP state explain WHY.", lvl:1},
  {q:"WAR-R1 should back up its OSPF route to 10.66.0.0/16 with a static over a second link. Based on the output, what is wrong?", ex:"WAR-R1#show ip route 10.66.4.9\nRouting entry for 10.66.0.0/16\n  Known via \"static\", distance 90, metric 0\n  Routing Descriptor Blocks:\n  * 172.29.0.6\n      Route metric is 0, traffic share count is 1\n\nWAR-R1#show ip ospf neighbor\nNeighbor ID     Pri   State           Dead Time   Address         Interface\n10.66.255.1       1   FULL/DR         00:00:35    172.29.0.1      GigabitEthernet0/1", o:["The OSPF neighbour is down, so the static is correctly in use","The static's distance (90) is lower than OSPF's 110, so the backup is used all the time; re-enter it with a distance above 110","The static's mask is wrong","OSPF's metric is too high"], a:1, why:"The adjacency is FULL, so OSPF offers the route with AD 110, and the static at 90 wins because lower AD wins for the same prefix. A floating static needs a distance above the route it backs up, such as 250.", lvl:2},
  {type:"multi", q:"A branch router has no OSPF neighbour on its WAN link. Which two outputs would each, on their own, explain it? (Choose two.)", o:["show ip ospf interface g0/1 shows 'No Hellos (Passive interface)'","%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID in show logging","show ip route shows Gateway of last resort is not set","show standby brief shows the router as Standby","show ip protocols lists the LAN under Passive Interface(s)"], a:[0,1], why:"A passive WAN interface sends no hellos, and an area mismatch makes each side reject the other's hellos. A missing default, HSRP state and a passive LAN don't stop a neighbour forming on the WAN.", lvl:2},
  {q:"Two routers that should be OSPF neighbours never form an adjacency, and this appears in the log. What is the fix?", ex:"%OSPF-4-DUP_RTRID_NBR: OSPF detected duplicate router-id 10.88.0.5 from 10.88.255.10 on interface GigabitEthernet0/2", o:["Change the area on one router","Set a unique router-id on one router, then run clear ip ospf process on it","Make Gi0/2 passive","Change the hello interval"], a:1, why:"Both routers use 10.88.0.5, so each ignores the other. Configure a unique router-id on one; it takes effect only when the OSPF process restarts, so run clear ip ospf process (or reload).", lvl:2},
  {type:"match", q:"Match each traceroute or ping result with what it most likely means.", pairs:[["!H  !H  !H on a middle hop","That router has no route to the destination"],["Two addresses alternating hop after hop","A routing loop between two routers"],["Stars from hop 3 onwards that never stop","Hop 3 can't forward or can't reply (often no route back)"],["Reply from own IP: Destination host unreachable","The PC couldn't ARP for its gateway or the host"],["An unexpected backup-link address in the path","A path-choice fault such as a floating static's AD"]], why:"!H on a router before the destination is an explicit 'no route'; alternating hops are a loop; endless stars mean silence from that hop on; host unreachable from your own address is a local ARP failure; a surprising hop means the chosen path isn't the designed one.", lvl:2},
  {type:"fill", q:"Type the command (without the address) you run on a router to see the single routing entry it would use for one destination address.", fields:[{label:"Command", a:["show ip route"], ios:true}], why:"show ip route followed by an address (show ip route 10.66.4.9) prints the longest-match entry for it, with source, distance, metric and next hop.", lvl:1},
  {type:"fill", q:"An edge router has a working static default to its ISP, but no other OSPF router has a default. Type the command, under router ospf, that advertises the edge router's default into OSPF only while the edge router has one.", fields:[{label:"Command", a:["default-information originate"], ios:true}], why:"default-information originate advertises a default (O*E2 on the other routers) as long as this router has one itself. Adding always would advertise it even with no default, which can blackhole traffic.", lvl:2},
  {q:"After a reboot, GW-A (priority 120) is back on the LAN, but GW-B (priority 100) is still the Active HSRP router and users' traffic takes GW-B's slower uplink. What is missing?", ex:"GW-A#show standby brief\n                     P indicates configured to preempt.\n                     |\nInterface   Grp  Pri P State   Active          Standby         Virtual IP\nGi0/0       5    120   Standby 10.91.0.3       local           10.91.0.1", o:["A higher priority on GW-A","standby 5 preempt on GW-A","standby version 2","A new virtual IP"], a:1, why:"Without preempt, priority matters only at the first election and the current Active router keeps the role. GW-A has the higher priority but no P flag; standby 5 preempt lets it take over.", lvl:2},
  {q:"A static reads ip route 172.25.16.0 255.255.255.0 10.9.0.2, meant for a partner network running from 172.25.16.0 to 172.25.31.255. Users reach 172.25.16.20 but not 172.25.20.5. What is the fix?", o:["Change the next hop","Replace it with ip route 172.25.16.0 255.255.240.0 10.9.0.2","Add ip route 172.25.20.0 255.255.255.0 10.9.0.2 250","Lower the AD of the default route"], a:1, why:"172.25.16.0–172.25.31.255 is sixteen /24s = a /20, mask 255.255.240.0. The /24 covers only 172.25.16.x. Replacing it fixes the whole range; adding single /24s leaves the design wrong.", lvl:2},
  {q:"A new branch reaches head office but not the internet: 'Gateway of last resort is not set', no O*E2. The edge router has default-information originate under router ospf, and show ip route on it shows no static default, because its ISP link is down. What is happening?", o:["The branch router is in the wrong area","default-information originate advertises a default only while the edge router has one; with the ISP link down there is nothing to advertise","The branch needs default-information originate too","OSPF can't carry default routes"], a:1, why:"Without always, the edge advertises a default only if one is in its own table. Its static default vanished with the ISP link, so nothing is advertised. Restore the link or give the edge a working backup default, such as a floating static over another link.", lvl:3},
  {type:"multi", q:"A help-desk engineer pings a branch PC from the head-office core router, it works, and he closes a ticket saying 'head-office users can't reach the branch PC'. Which two statements explain why that test is weak? (Choose two.)", o:["The core's ping is sourced from its exit interface, which the branch may have a route back to even when it has none for the users' subnet","It doesn't test the return path to the users' subnet","Routers can't ping PCs","It proves the users' VLAN is wrong","Branch firewalls always block ICMP from routers"], a:[0,1], why:"A router's ping uses its exit interface as the source, so it proves the route back to that link, not to the users' subnet. The fix must be proved from the users' subnet, or with an extended ping sourced from the LAN interface.", lvl:3},
  {q:"From an HQ PC, tracert to 10.71.9.20 (a new subnet at a branch) shows the HQ gateway, then 192.0.2.13, 192.0.2.14, 192.0.2.13, 192.0.2.14 repeating. 192.0.2.13 is the ISP; 192.0.2.14 is the HQ edge router. The branch router is a FULL OSPF neighbour of HQ. What is the most likely root cause?", o:["The ISP's router is faulty","The branch router doesn't run OSPF on the new subnet, so HQ follows its default to the ISP, whose route for the company block sends it back","The HQ PC's gateway is wrong","HSRP has no preempt"], a:1, why:"A loop between the edge and the ISP means no router has a specific route for 10.71.9.0/24: the default catches it and the ISP's broader route returns it. With the adjacency up, the likely cause is a missing network statement on the branch router — fix it there, not with a static at HQ.", lvl:3},
  {q:"HQ-EDGE has a fibre default (static, AD 1). A branch has its own internet link and advertises a default into OSPF, which HQ-EDGE learns as O*E2. Design: if the fibre fails, use the branch's internet; use the expensive satellite link (next hop 192.0.2.29) only if both are gone. Which satellite route meets the design?", o:["ip route 0.0.0.0 0.0.0.0 192.0.2.29","ip route 0.0.0.0 0.0.0.0 192.0.2.29 5","ip route 0.0.0.0 0.0.0.0 192.0.2.29 100","ip route 0.0.0.0 0.0.0.0 192.0.2.29 250"], a:3, why:"For the same prefix the lowest AD wins. The satellite must lose to the fibre static (1) AND the OSPF default (110), so its distance must be above 110: 250. With no distance it ties with the fibre and shares the load; 5 and 100 would beat the branch's OSPF default.", lvl:3},
],
cards:[
  {f:"The routing rule behind every fault", b:"A conversation works only if every router on the way has a route to the destination AND every router on the way back has a route to the source. Each router decides alone: longest match, then lowest AD, then lowest metric."},
  {f:"The routing troubleshooting method", b:"Scope, Ping by hops (from the user's subnet), Trace, Table (show ip route <ip>), Next hop resolves, Return path, Protocol evidence (OSPF), Standby (HSRP). Mnemonic: Smart People Trace The Network's Return Path Slowly."},
  {f:"Destination host unreachable vs Request timed out", b:"Host unreachable from a router's IP: that router has no route forward (as the last hop: couldn't ARP the host). Timed out: silence — check the return path first (show ip route <source> on far routers), then loops, then filters. Host unreachable from your own IP: local ARP failed."},
  {f:"Reading traceroute", b:"Each line = a router, by the interface the probe arrived on. !H (Windows: reports: Destination host unreachable) = that router has no route. Stars that never stop = that hop can't forward or reply. Repeating pair = loop. Unexpected hop = path choice (AD, cost, HSRP)."},
  {f:"show ip route <address>", b:"Shows the single longest-match entry: prefix, Known via, distance, metric, next hop, exit interface. % Network not in table = no specific match (the default isn't shown — check Gateway of last resort)."},
  {f:"Static configured but not installed?", b:"Compare show running-config | include ip route with show ip route static. A next-hop static installs only if the next hop resolves; an exit-interface static only while the interface is up."},
  {f:"Fingerprint: missing return route", b:"Request timed out; works one way; tracert goes silent (* * *) at the router with no way back. show ip route <source> there: % Network (or Subnet) not in table. Fix: a route back, or advertise the source subnet."},
  {f:"Fingerprint: floating static with the wrong AD", b:"S where you expected O (distance below the protocol's, e.g. 100 behind OSPF's 110), or two [1/0] lines for one prefix (distance forgotten: load sharing). Fix: re-enter with a distance above the primary's, e.g. 250."},
  {f:"Fingerprint: passive on a transit link", b:"No neighbours; show ip ospf interface on the WAN: No Hellos (Passive interface). Fix: no passive-interface on the link; make the LAN passive instead."},
  {f:"Fingerprints: area mismatch and duplicate router ID", b:"Area: %OSPF-4-ERRRCV mismatched area ID; different Area at each end in show ip ospf interface brief. Duplicate RID: %OSPF-4-DUP_RTRID_NBR; fix with router-id, then clear ip ospf process."},
  {f:"Fingerprints: missing network statement and default not originated", b:"Missing network: the subnet is absent from Routing for Networks in show ip protocols and from other routers' tables (traffic may loop via a default). No default: Gateway of last resort is not set, no O*E2; fix with default-information originate on the edge."},
  {f:"Fingerprint: HSRP without preempt", b:"show standby brief: the router with the higher priority shows no P and state Standby. Priority wins only at the first election unless preempt is on. Fix: standby N preempt."},
  {f:"Portfolio evidence that proves a routing design", b:"Diagram + addressing table; show ip ospf neighbor from every router; a branch show ip route with O and O*E2; tracerts between sites; before/during-failure outputs for the floating static and HSRP; three break/fix entries with real fingerprint lines."},
],
});

const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>/^ccna-m[1234]$/.test(l.mod||"")).length;
K.module("ccna", {
  id:"ccna-m5", t:"IP routing: the routing table, static routes, OSPF and first-hop redundancy",
  blurb:"Read a routing table like a router does, build static and floating routes, run OSPF from neighbours to DR elections and costs, keep the gateway alive with HSRP — and troubleshoot it all in the Module 5 challenge.",
}, L, { at, modAt:4, replace:["Routing fundamentals: static routes, dynamic protocols, OSPF","OSPF deep-dive: adjacency, DR/BDR, cost, areas, troubleshooting"] });
})();
