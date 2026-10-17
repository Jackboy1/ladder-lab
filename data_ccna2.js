// CCNA expansion pack — OSPF deep-dive, VLSM design, IPv6, troubleshooting methodology; 3 router/switch labs; subnet drill flag
(function(){
const T = LL.tracks.find(t=>t.id==="ccna"); if(!T) return;
T.drill = true;
LL.points.drill = 15;

const topo = `<figure style="margin:14px 0"><svg viewBox="0 0 680 190" style="max-width:100%;display:block" role="img">
<defs><marker id="ccarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>
<rect x="40" y="60" width="130" height="60" rx="8" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.5"/>
<text x="105" y="85" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--display)">R1 (you)</text>
<text x="105" y="103" text-anchor="middle" fill="var(--muted)" font-size="10.5">RID 1.1.1.1</text>
<rect x="280" y="60" width="130" height="60" rx="8" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.4"/>
<text x="345" y="85" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--display)">R2</text>
<text x="345" y="103" text-anchor="middle" fill="var(--muted)" font-size="10.5">RID 2.2.2.2</text>
<rect x="520" y="60" width="130" height="60" rx="8" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.4"/>
<text x="585" y="85" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--display)">R3</text>
<text x="585" y="103" text-anchor="middle" fill="var(--muted)" font-size="10.5">LAN 192.168.2.0/24</text>
<line x1="170" y1="90" x2="280" y2="90" stroke="var(--muted)" stroke-width="1.5"/>
<line x1="410" y1="90" x2="520" y2="90" stroke="var(--muted)" stroke-width="1.5"/>
<text x="225" y="78" text-anchor="middle" fill="var(--muted)" font-size="10.5" font-family="var(--mono)">10.0.12.0/30</text>
<text x="182" y="108" fill="var(--muted)" font-size="10" font-family="var(--mono)">.1 g0/0</text>
<text x="252" y="108" text-anchor="end" fill="var(--muted)" font-size="10" font-family="var(--mono)">.2</text>
<text x="465" y="78" text-anchor="middle" fill="var(--muted)" font-size="10.5" font-family="var(--mono)">10.0.23.0/30</text>
<text x="345" y="160" text-anchor="middle" fill="var(--muted)" font-size="11">Area 0 everywhere · R1 must LEARN 10.0.23.0/30 and 192.168.2.0/24 via OSPF — never type them as statics</text>
</svg><figcaption class="small muted" style="margin-top:4px">The lab topology: you drive R1; R2 and R3 are already configured and waiting to peer.</figcaption></figure>`;

T.lessons.push(
{t:"OSPF deep-dive: adjacency, DR/BDR, cost, areas, troubleshooting", html: topo + `
<p>You met OSPF in the routing lesson; this is the working depth — what the network statement actually does, why neighbors refuse to form, and how to read the evidence.</p>
<h3>What the network statement really means</h3>
<p><code>network 10.0.12.0 0.0.0.3 area 0</code> does <b>not</b> advertise a network. It means: <i>“any of my interfaces whose address falls in this range runs OSPF in area 0.”</i> OSPF then advertises whatever those interfaces are connected to. The wildcard is the inverted mask (/30 → 0.0.0.3, /24 → 0.0.0.255); <code>network 0.0.0.0 255.255.255.255 area 0</code> = "all interfaces" — fine in labs, sloppy in production. The modern alternative skips wildcards entirely: <code>ip ospf 1 area 0</code> directly on the interface.</p>
<h3>Becoming neighbors — the checklist that answers every 'stuck adjacency' ticket</h3>
<p>Two routers on a link must agree on: <b>same subnet</b>, <b>same area</b>, <b>same hello/dead timers</b> (10/40 on ethernet), same authentication, same MTU (mismatch sticks you in Exstart), and have <b>unique router-IDs</b>. The states you'll see:</p>
<pre><code>Down → Init (heard a hello) → 2-Way (both heard each other)
     → Exstart/Exchange (DBD swap, MTU trap lives here)
     → Loading → FULL  ← the only acceptable final state with a DR/BDR
(stuck in 2-Way with a DROTHER on a LAN is NORMAL — DROTHERs only go Full with the DR/BDR)</code></pre>
<h3>DR/BDR on multi-access segments</h3>
<p>On a LAN, n routers forming n(n−1)/2 adjacencies would flood chaos, so one <b>Designated Router</b> (+ backup) is elected: highest interface priority (default 1; 0 = never), tie → highest router-ID. Everyone syncs with the DR; the election is <b>non-preemptive</b> — a "better" router joining later does not take over until the DR dies. Point-to-point links skip the whole circus.</p>
<h3>Cost — steering traffic</h3>
<pre><code>cost = reference bandwidth / interface bandwidth   (default ref: 100 Mbps)
→ FastEthernet = 1, Gig = 1, 10G = 1  ← everything fast looks identical!
fix once per network:  auto-cost reference-bandwidth 100000   (all routers, consistently)
or per link:           ip ospf cost 50</code></pre>
<p>Path cost = sum of outgoing interface costs to the destination; lowest wins, equal costs load-balance (ECMP). "Traffic takes the wrong path" tickets are usually an un-raised reference bandwidth.</p>
<h3>Multi-area in two paragraphs</h3>
<p>One area = one LSDB on every router = SPF reruns everywhere on any flap. Areas contain that: <b>area 0 is the backbone</b>, every other area must touch it, and <b>ABRs</b> (routers in two areas) summarise between them. Internal routes show as <code>O</code>, inter-area as <code>O IA</code>, redistributed externals as <code>O E2</code>. Stub flavours (stub/totally-stubby/NSSA) trade detail for a default route in branch areas.</p>
<p>For the exam depth you need: recognise the route codes, know ABR/ASBR roles, and know that an area not touching area 0 needs a virtual link (and that a design needing one is a design to fix).</p>
<h3>The verification ladder (run it in the lab)</h3>
<pre><code>show ip ospf neighbor        ← state FULL? with whom?
show ip ospf interface g0/0  ← timers, area, cost, DR/BDR on this link
show ip protocols            ← what networks am I actually running OSPF on?
show ip route ospf           ← did the routes arrive?</code></pre>
<div class="callout">Now run <b>Lab: OSPF — bring up the neighborship</b> on the topology above: address the link, enable OSPF correctly, watch the neighbor reach FULL, and ping a network you never configured — the moment dynamic routing clicks.</div>`},

{t:"VLSM: designing an addressing plan (and drilling it to reflex)", html:`
<p>Subnetting questions give you one block and many differently-sized needs. <b>VLSM</b> (variable-length subnet masking) is the design skill: carve one block into right-sized pieces with no overlaps and no waste.</p>
<h3>The method — largest first, always</h3>
<p>Given <code>192.168.10.0/24</code> for: Sales 100 hosts, Engineering 50, Guest 20, two router-to-router links.</p>
<pre><code>1. Sort by size, biggest first (prevents overlap/fragmentation):
   100 → needs 2^7=128  → /25
   50  → needs 2^6=64   → /26
   20  → needs 2^5=32   → /27
   2×links → /30 each (2 usable)
2. Allocate sequentially from the top of the block:
   Sales   192.168.10.0/25    (.0 – .127,  gw .1,  usable .1–.126)
   Eng     192.168.10.128/26  (.128 – .191)
   Guest   192.168.10.192/27  (.192 – .223)
   Link-A  192.168.10.224/30  (.224 – .227 → usable .225/.226)
   Link-B  192.168.10.228/30
   Spare   .232 – .255        ← growth room, label it as such
3. Sanity-check: each subnet starts on a multiple of its own block size.</code></pre>
<p>That last line is where exam traps live: a /26 can only start at .0, .64, .128, .192 — "put Engineering at 192.168.10.100/26" is invalid by definition.</p>
<h3>Reading any address instantly — the two reflexes</h3>
<ul>
<li><b>Block size</b> = 256 − interesting-octet-mask (mask .192 → block 64; .240 → 16; .252 → 4).</li>
<li><b>Magic octet</b>: /1–/8 first octet, /9–/16 second, /17–/24 third, /25–/32 fourth — the maths always happens in exactly one octet.</li>
</ul>
<pre><code>172.20.141.77/19 → /19 = 3rd octet, block 32 → subnets .0 .32 .64 .96 .128 .160…
141 falls in 128 → network 172.20.128.0/19 · broadcast 172.20.159.255 · usable .128.1 – .159.254 · 8190 hosts</code></pre>
<h3>Where this bites in real jobs</h3>
<ul>
<li><b>Overlaps</b>: two sites both numbered 192.168.1.0/24 can never be VPN'd together without NAT gymnastics — plan company-wide from 10.0.0.0/8 with per-site /16s from day one.</li>
<li><b>Cloud echoes</b>: Terraform's <code>cidrsubnet()</code> and AWS subnet sizing are this exact skill (AWS steals 5 addresses per subnet, not 2 — a /28 gives 11 usable there).</li>
<li><b>Summarisation</b>: contiguous allocation lets one route (172.20.0.0/14) represent a region — why "largest first, sequential" matters beyond neatness.</li>
</ul>
<div class="callout"><b>Drill it:</b> open the <b>Subnetting drills</b> (button on this course page / Labs tab). It generates endless randomised questions and checks you instantly. Target: 10 in a row, under 45 seconds each — that is interview whiteboard speed.</div>`},

{t:"IPv6: addressing, types, SLAAC and configuration", html:`
<p>IPv6 is 128 bits, written as 8 hextets: <code>2001:0db8:0000:0000:0000:ff00:0042:8329</code>. Two shortening rules: drop leading zeros in each hextet, and compress ONE run of all-zero hextets with <code>::</code> → <code>2001:db8::ff00:42:8329</code>. (Only one <code>::</code> allowed — two would be ambiguous.)</p>
<h3>Address types you must identify on sight</h3>
<div class="tablewrap"><table>
<tr><th>Prefix</th><th>Type</th><th>Meaning</th></tr>
<tr><td>2000::/3</td><td>Global unicast</td><td>Public, routable internet addresses (2xxx/3xxx)</td></tr>
<tr><td>fe80::/10</td><td><b>Link-local</b></td><td>Auto on EVERY IPv6 interface; valid only on that link; used by routing protocols & as next-hops</td></tr>
<tr><td>fc00::/7 (fd…)</td><td>Unique local</td><td>The RFC1918 of IPv6 — private internal</td></tr>
<tr><td>ff00::/8</td><td>Multicast</td><td>ff02::1 all-nodes, ff02::2 all-routers, ff02::5/6 OSPF</td></tr>
<tr><td>::1</td><td>Loopback</td><td>The 127.0.0.1 of IPv6</td></tr>
</table></div>
<p><b>No broadcast exists in IPv6</b> — multicast groups replace it, and <b>NDP</b> (Neighbor Discovery, ICMPv6) replaces ARP: Neighbor Solicitation/Advertisement for MAC resolution, Router Solicitation/Advertisement for finding gateways.</p>
<h3>How hosts get addresses</h3>
<ul>
<li><b>SLAAC</b>: the router's RA advertises the /64 prefix; the host invents its own host half (privacy extensions today; classically <b>EUI-64</b>: MAC split in two, ff:fe inserted, 7th bit flipped — still exam-tested). Serverless addressing — the headline IPv6 feature.</li>
<li><b>Stateless DHCPv6</b>: SLAAC for the address + DHCPv6 just for DNS and options.</li>
<li><b>Stateful DHCPv6</b>: full leases, when you need the inventory control.</li>
</ul>
<h3>Configuration</h3>
<pre><code>R1(config)# ipv6 unicast-routing            ! routers don't route v6 until you say so
R1(config)# interface g0/0
R1(config-if)# ipv6 address 2001:db8:12::1/64
R1(config-if)# ipv6 address fe80::1 link-local    ! optional: readable link-locals
R1(config-if)# ipv6 enable                         ! link-local only, if that's all you need
R1# show ipv6 interface brief
R1# ping 2001:db8:12::2
R1(config)# ipv6 route ::/0 2001:db8:12::2        ! default route, v6 spelling</code></pre>
<p>Standard interface plan: every LAN gets a <b>/64</b> (SLAAC requires it), point-to-points use /64 or /127, and your whole company fits in one /48 with 65k subnets. "Saving" addresses by subnetting a /64 smaller breaks SLAAC and buys you nothing — there are enough /64s for every grain of sand.</p>
<h3>Dual stack & the transition reality</h3>
<p>Networks run v4 and v6 side by side (<b>dual stack</b>); happy-eyeballs clients prefer v6 when it works. NAT64/DNS64 let v6-only clients reach v4-only servers; tunnels (6in4 etc.) cross v4-only transit. Interview soundbite: "IPv6 removes NAT as a necessity — end-to-end addressing returns, and firewall policy, not address exhaustion, becomes the security boundary."</p>`},

{t:"The troubleshooting methodology: one ticket, bottom-up, out loud", html:`
<p>Tools you have; this lesson is the <i>order</i>. Interviewers care less about the fix than about hearing a method. The frame: <b>define → gather → hypothesise by layer → test cheapest-first → fix → verify → document</b>. Here it is run on the most classic ticket in networking.</p>
<h3>Ticket: "I can't reach the file server" (one user, others fine)</h3>
<pre><code>Step 0 — define 'can't reach': name or IP? one service or all? since when? what changed?
         "Others fine" already localises: suspect the user's host/port/path, not the server.

L1  Physical    link lights both ends? cable reseated? switch port up/up?
                → show interfaces g1/0/14 : errors? err-disabled?
L2  Data link   right VLAN on the port? MAC learned?
                → show mac address-table int g1/0/14 · show vlan brief
L3  Network     ipconfig/ip a: real address or APIPA? correct mask & gateway?
                ping own IP → ping gateway → ping server IP
                (gateway ok, server IP fails → routing/ACL between them)
L4  Transport   server IP pings but service dead → port blocked/down:
                nc -zv server 445 · check ACLs/firewall rules · ss -tlnp on the server
L7  Application name fails but IP works → DNS: nslookup/dig; stale hosts file; wrong suffix
                creds/permissions → it was never a network ticket at all</code></pre>
<p>Each test is chosen to <b>split the remaining possibilities in half</b> — that's what makes it a method rather than flailing. Say the splits out loud in interviews: "ping by IP works, by name fails, so the entire physical-to-transport path is proven and I'm now only debugging DNS."</p>
<h3>The cheat table: symptom → first suspect</h3>
<div class="tablewrap"><table>
<tr><th>Evidence</th><th>Points at</th></tr>
<tr><td>169.254.x.x address</td><td>DHCP unreachable: cable, port VLAN, snooping trust, scope exhausted</td></tr>
<tr><td>Own subnet pings, nothing beyond</td><td>Default gateway wrong/missing, or SVI down</td></tr>
<tr><td>IP works, name doesn't</td><td>DNS (resolver setting, record, hosts file)</td></tr>
<tr><td>First ping lost, rest fine</td><td>ARP resolution — normal, not a fault</td></tr>
<tr><td>Intermittent, speed 'weird'</td><td>Duplex mismatch (late collisions), flapping link, wifi interference</td></tr>
<tr><td>One VLAN can't reach another</td><td>Trunk allowed-list, SVI state, inter-VLAN ACL</td></tr>
<tr><td>Everything dead after a change window</td><td>Roll back first, diagnose second</td></tr>
<tr><td>30s of darkness after plugging in</td><td>STP listening/learning — PortFast missing</td></tr>
<tr><td>Port err-disabled</td><td>Port-security/BPDU Guard tripped — fix cause, shut/no shut</td></tr>
</table></div>
<h3>Close like a professional</h3>
<p>Verify with the user (not just your ping), write cause + fix + evidence in the ticket, and ask the system question: <i>should monitoring have caught this before the user did?</i> That last sentence is what separates support from engineering — and it's the thinking the SRE track formalises as postmortems.</p>
<div class="callout">Practise the muscle: the <b>Tickets</b> tab scenarios are this lesson applied; grade yourself against the models honestly.</div>`}
);

T.quiz.push(
{q:"network 10.0.12.0 0.0.0.3 area 0 actually means:", o:["Advertise 10.0.12.0/30 to neighbors","Run OSPF (area 0) on any interface whose IP falls in that range","Create a static route","Summarise area 0"], a:1, why:"The statement activates OSPF on matching interfaces; OSPF then advertises those interfaces' networks."},
{q:"Two routers are stuck in Exstart/Exchange. Classic cause:", o:["Different router IDs","MTU mismatch on the link","Same priority","Passive interface"], a:1, why:"DBD exchange fails when MTUs differ — the textbook Exstart trap (timers/area/subnet problems prevent even Init/2-Way)."},
{q:"A LAN router shows a neighbor stuck in 2-Way. This is…", o:["Always a fault","Normal if both are DROTHERs — they only go FULL with the DR/BDR","An MTU issue","An area mismatch"], a:1, why:"On multi-access segments, non-DR routers maintain 2-Way with each other by design."},
{q:"The current DR fails and later returns. It…", o:["Resumes as DR immediately","Does not pre-empt — the promoted BDR/new DR keeps the role","Forces re-election of everything","Becomes a stub"], a:1, why:"DR election is non-preemptive; returning routers join as DROTHER."},
{q:"All your Gig and 10G links show OSPF cost 1. Correct fix:", o:["Static routes","Raise auto-cost reference-bandwidth consistently on all routers","Lower hello timers","More areas"], a:1, why:"Default 100 Mbps reference makes everything fast cost 1; raise the reference network-wide so faster links win."},
{q:"A route shown as 'O IA' is…", o:["External, type 2","Inter-area, learned via an ABR","An aged route","IPv6 OSPF"], a:1, why:"O = intra-area, O IA = inter-area (crossed area 0 via an ABR), O E2 = redistributed external."},
{q:"VLSM rule that prevents overlaps:", o:["Smallest subnets first","Allocate largest first, sequentially; each subnet starts on a multiple of its block size","Random allocation","Always /24s"], a:1, why:"Biggest-first keeps alignment; a /26 can only begin at .0/.64/.128/.192."},
{q:"Design: dept needs 50 hosts from 192.168.10.0/24. You assign:", o:["/27","/26 (64 addresses, 62 usable)","/25","/28"], a:1, why:"2^6=64 ≥ 52 needed; a /27 (30 usable) is too small, /25 wastes half the block."},
{q:"An AWS /28 subnet offers how many usable instance addresses?", o:["14","13","11","16"], a:2, why:"16 total − 5 AWS-reserved = 11. Cloud subnetting steals 5, not 2 — a favourite trick question."},
{q:"fe80::/10 addresses are…", o:["Public global unicast","Link-local: auto-created per interface, valid only on that link, used as routing next-hops","Multicast","Deprecated"], a:1, why:"Every IPv6 interface has one; OSPFv3/next-hops ride on them."},
{q:"IPv6 replaced ARP with…", o:["RARP","NDP: Neighbor Solicitation/Advertisement over ICMPv6 multicast","DHCPv6 only","Broadcast ping"], a:1, why:"No broadcast in v6; NDP's NS/NA (and RS/RA for routers) do discovery."},
{q:"SLAAC requires the LAN prefix to be a…", o:["/48","/56","/64","/127"], a:2, why:"Hosts build the 64-bit interface ID themselves — the prefix must leave exactly 64 bits."},
{q:"Before an IOS router forwards IPv6 you must enter:", o:["ipv6 enable on every interface","ipv6 unicast-routing globally","dual-stack mode","nat64"], a:1, why:"Addresses can exist, but v6 FORWARDING is off until ipv6 unicast-routing."},
{q:"User: name fails, ping by IP works. You now debug ONLY…", o:["Cables","The switchport","DNS resolution","The default gateway"], a:2, why:"The IP ping proves L1–L4 end to end; the remaining suspect set is name resolution. That 'split' is the method."},
{q:"After a change window 'everything is down'. First action:", o:["Packet capture","Roll back the change, then diagnose on your own time","Reboot the core","Open a vendor case"], a:1, why:"Restore service first; correlation with the change is overwhelming. Diagnosis happens off the critical path."}
);

T.cards.push(
{f:"OSPF network statement", b:"Matches INTERFACES (via wildcard) into an area; OSPF then advertises their networks. Modern: 'ip ospf 1 area 0' on the interface."},
{f:"Adjacency checklist", b:"Same subnet, area, hello/dead (10/40), auth, MTU; UNIQUE RIDs. Exstart-stuck = MTU."},
{f:"2-Way vs FULL", b:"DROTHER↔DROTHER stays 2-Way by design; FULL only with DR/BDR on LANs. P2P links: everyone FULL."},
{f:"DR election", b:"Highest priority (0 = never), tie → highest RID. Non-preemptive."},
{f:"OSPF cost fix", b:"auto-cost reference-bandwidth 100000 on ALL routers, or ip ospf cost per link. Default ref 100M makes all fast links '1'."},
{f:"Route codes", b:"O intra · O IA inter-area (via ABR) · O E2 external (via ASBR, default type)."},
{f:"Area rules", b:"Area 0 = backbone; every area must touch it; ABRs summarise between areas."},
{f:"VLSM method", b:"Sort needs largest-first → allocate sequentially → each subnet starts on a multiple of its block size."},
{f:"Block size trick", b:"256 − mask octet (.192→64, .240→16, .252→4). Magic octet: /17–/24 = 3rd."},
{f:"AWS subnet math", b:"Reserves 5 IPs per subnet: /28 → 11 usable, /24 → 251."},
{f:"IPv6 shortening", b:"Drop leading zeros per hextet; ONE :: for one zero-run."},
{f:"v6 types", b:"2000::/3 global · fe80::/10 link-local · fd00::/8 unique-local · ff00::/8 multicast · ::1 loopback. No broadcast."},
{f:"SLAAC", b:"RA advertises /64 → host invents its own 64-bit ID (privacy ext / EUI-64). Stateless DHCPv6 adds DNS only."},
{f:"EUI-64", b:"Split MAC, insert ff:fe, flip 7th bit of first byte."},
{f:"v6 router switches", b:"ipv6 unicast-routing (global) → ipv6 address X/64 (interface) → ipv6 route ::/0 <nh>."},
{f:"Troubleshooting frame", b:"Define → gather → layer-by-layer bottom-up → cheapest test that halves the suspects → fix → verify with the user → document."}
);

/* ---------------- labs ---------------- */
LL.labs["ios-ospf"] = {
  env:"ios", title:"OSPF: bring up the neighborship", points:70,
  scenario:"You drive R1 on the 3-router topology from the OSPF lesson. R2 (RID 2.2.2.2) is already configured on 10.0.12.2 and is advertising 10.0.23.0/30 and R3's LAN 192.168.2.0/24. Address your side, enable OSPF properly, reach FULL, and prove you can ping a network you never typed.",
  setup(st){
    st.host = "R1"; st.opts.kind = "router"; st.opts.strictPing = true;
    st.opts.neighbor = { ifname:"GigabitEthernet0/0", net:"10.0.12.0", area:0, rid:"2.2.2.2",
      peerIp:"10.0.12.2", remoteIp:"192.168.2.1",
      advertised:[ {prefix:"10.0.23.0/30", via:"10.0.12.2"}, {prefix:"192.168.2.0/24", via:"10.0.12.2"} ] };
    st.motd = "Console: R1. Link to R2 is on g0/0 (10.0.12.0/30, you are .1). R2 is up and waiting to peer in area 0.";
  },
  objectives:[
    { text:"Address the link: g0/0 → ip address 10.0.12.1 255.255.255.252, then no shutdown", done:st=>{const i=st.intfs["GigabitEthernet0/0"];return i.ip==="10.0.12.1"&&i.mask==="255.255.255.252"&&!i.shut;} },
    { text:"Confirm the direct link first: ping 10.0.12.2", done:st=>st.pinged&&st.pinged["10.0.12.2"]===true },
    { text:"Start the process: router ospf 1, and set router-id 1.1.1.1", done:st=>st.ospf&&st.ospf.rid==="1.1.1.1" },
    { text:"Activate the link in area 0: network 10.0.12.0 0.0.0.3 area 0", done:st=>st.ospf&&st.ospf.networks.some(n=>n.net==="10.0.12.0"&&n.wc==="0.0.0.3"&&n.area==="0") },
    { text:"Verify the adjacency reached FULL: show ip ospf neighbor", done:st=>st.neighborFull()&&(st.ranOspfNeigh||0)>0 },
    { text:"See the learned routes: show ip route (look for the O entries)", done:st=>st.neighborFull()&&(st.ranRoute||0)>0 },
    { text:"Ping R3's LAN gateway 192.168.2.1 — a network you never configured", done:st=>st.pinged&&st.pinged["192.168.2.1"]===true },
    { text:"Save the configuration", done:st=>st.savedOnce },
  ],
};

LL.labs["ios-static"] = {
  env:"ios", title:"Static & default routes", points:60,
  scenario:"R1's WAN link (g0/0 = 10.0.12.1/30) is already up; the ISP router is 10.0.12.2. The internet lives beyond it (test host 203.0.113.10), and the branch network 172.16.5.0/24 also sits behind that next hop. Right now R1 can reach nothing beyond the link — fix it with routes, not protocols.",
  setup(st){
    st.host = "R1"; st.opts.kind = "router"; st.opts.strictPing = true;
    const i = st.intfs["GigabitEthernet0/0"]; i.ip="10.0.12.1"; i.mask="255.255.255.252"; i.shut=false;
    st.opts.neighbor = { ifname:"GigabitEthernet0/0", net:"__none__", area:-1, rid:"-", peerIp:"10.0.12.2", remoteIp:"203.0.113.10", advertised:[] };
    st.motd = "Console: R1. g0/0 is up at 10.0.12.1/30; ISP next hop is 10.0.12.2. Try pinging 203.0.113.10 before and after your routes.";
  },
  objectives:[
    { text:"Prove the problem: ping 203.0.113.10 fails before any route exists", done:st=>st.pinged&&("203.0.113.10" in st.pinged) },
    { text:"Add the default route: ip route 0.0.0.0 0.0.0.0 10.0.12.2", done:st=>st.staticRoutes.some(r=>r.prefix==="0.0.0.0"&&r.nh==="10.0.12.2") },
    { text:"Add the branch route: ip route 172.16.5.0 255.255.255.0 10.0.12.2", done:st=>st.staticRoutes.some(r=>r.prefix==="172.16.5.0"&&r.mask==="255.255.255.0") },
    { text:"Read the table: show ip route (S* marks the gateway of last resort)", done:st=>(st.ranRoute||0)>0&&st.staticRoutes.length>=1 },
    { text:"Verify: ping 203.0.113.10 now succeeds", done:st=>st.pinged&&st.pinged["203.0.113.10"]===true },
    { text:"Verify the branch: ping 172.16.5.9", done:st=>st.pinged&&st.pinged["172.16.5.9"]===true },
    { text:"Save the configuration", done:st=>st.savedOnce },
  ],
};

LL.labs["ios-trunk"] = {
  env:"ios", title:"Trunking: carry VLANs 10 & 20 upstream", points:60,
  scenario:"This access switch already serves Finance (VLAN 10) and Engineering (VLAN 20) on its edge ports. Port g0/2 runs to the distribution switch — make it an 802.1Q trunk carrying exactly those VLANs, and verify like you'd be audited.",
  setup(st){
    st.host = "ASW1";
    st.vlans[10]="FINANCE"; st.vlans[20]="ENG";
    st.intfs["GigabitEthernet0/0"].vlan=10; st.intfs["GigabitEthernet0/0"].shut=false;
    st.intfs["GigabitEthernet0/1"].vlan=20; st.intfs["GigabitEthernet0/1"].shut=false;
    st.motd = "Console: ASW1. g0/0=Finance(10), g0/1=Eng(20) already up. g0/2 is the uplink to distribution — currently an access port, currently down.";
  },
  objectives:[
    { text:"Enter interface g0/2 and set switchport mode trunk", done:st=>st.intfs["GigabitEthernet0/2"].mode==="trunk" },
    { text:"Restrict it: switchport trunk allowed vlan 10,20", done:st=>{const a=st.intfs["GigabitEthernet0/2"].allowed;return !!a&&a.includes(10)&&a.includes(20)&&a.length===2;} },
    { text:"Bring the uplink up (no shutdown)", done:st=>st.intfs["GigabitEthernet0/2"].shut===false },
    { text:"Verify: show interfaces trunk", done:st=>(st.ranTrunk||0)>0 },
    { text:"Cross-check VLAN membership: show vlan brief", done:st=>st.history.some(h=>/sh(ow)?\s+vlan/i.test(h)) },
    { text:"Save the configuration", done:st=>st.savedOnce },
  ],
};

T.labs.push("ios-ospf","ios-static","ios-trunk");
})();
