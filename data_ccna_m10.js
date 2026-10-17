// CCNA · Module 10 — WAN, virtualization and cloud: topology architectures, WAN technologies, VPNs and GRE, SD-WAN, virtualization, VRFs, cloud (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lesson "Virtualization, cloud, containers & network automation (SDN)" (automation moves to Module 11).
(function(){
const L = [];

// ---------- Module 10 · Lesson 1 ----------
L.push({
id:"wan-arch", mins:110, level:"Intermediate · builds on Module 1 lesson 4 and Modules 4, 5 and 8",
t:"Network topology architectures — two-tier and three-tier campuses, spine-leaf, SOHO, on-premises and cloud, and how to read a design",
html:`
${K.goals([
  "Say what each campus layer does and which features you configure there: PortFast and port security at access; SVIs, HSRP and the STP root at distribution; routed links and OSPF at the core.",
  "Work out the oversubscription of an access uplink or a leaf, and how big a spine-leaf fabric can grow.",
  "Audit a two-tier collapsed core: which uplinks block, which core is the gateway, what is single-homed. Then fail a core and prove the office survives.",
  "Explain why spine-leaf puts every pair of servers the same distance apart, and see it in a routing table as ECMP.",
  "Place SOHO, on-premises, cloud and hybrid in a design, and choose an architecture from a list of requirements.",
])}
${K.pre([
  "Module 1 lesson 4: the shapes and names (SOHO, two-tier, three-tier, spine-leaf, on-premises and cloud). This lesson goes deeper.",
  "Module 4: VLANs, trunks, Rapid PVST+ (root and alternate ports, <code>root primary</code>), EtherChannel with LACP, Layer 3 switches (<code>ip routing</code>, SVIs, <code>no switchport</code>).",
  "Module 5: OSPF (point-to-point links, passive interfaces, ECMP) and HSRP (priority, preempt).",
  "Module 2 lesson 6 and Module 8 lesson 2: SSH with a local user. Both benches are run over SSH from a PC.",
])}

<h2>Why this matters at work</h2>
<p>A payments company in Lagos has three documents on the network manager's desk: an installer's handover for the new Port Harcourt office (&ldquo;two-tier collapsed core, every access switch dual-homed, either core can fail without users noticing&rdquo;), a quote for a &ldquo;spine-leaf fabric&rdquo; in the data centre, and a proposal to move HR and the backups to the cloud. Her question: &ldquo;Are these the right designs, and are they really built the way the paperwork says?&rdquo;</p>
<p>Module 1 gave you the names. Since then you have configured Spanning Tree, EtherChannel, OSPF and HSRP, so you can now check what each layer is <i>doing</i>: where Layer 2 ends, which links block, who the gateway is, and what happens when a box dies. This lesson is the map the rest of Module 10 hangs on, and you will audit the Port Harcourt office and the data-centre fabric on two benches.</p>

<h2>The campus layers, with the protocols you now know</h2>
${K.remember(`<b>The rule:</b> a layer is a <b>job</b>, not a box. <b>Access</b> attaches and protects endpoints. <b>Distribution</b> is where Layer 2 ends: gateways, STP root, policy. <b>Core</b> only moves packets between distribution blocks. Ask &ldquo;which job is this switch doing?&rdquo; and you know what belongs in its configuration.`)}
<p>In Module 1 the layers were boxes on a diagram. Now each maps onto configuration you have typed:</p>
<div class="tablewrap"><table>
<tr><th>Layer</th><th>Its job</th><th>What you configure there</th><th>What you keep out</th></tr>
<tr><td><b>Access</b></td><td>Connect users, phones, APs and printers; protect the edge</td><td>Access VLANs and the voice VLAN, PortFast and BPDU guard (Module 4); port security, DHCP snooping, DAI (Module 8); PoE; one trunk uplink to <i>each</i> distribution switch</td><td>Routing for users (in the classic design); the STP root</td></tr>
<tr><td><b>Distribution</b></td><td>Collect a building's access switches; be the Layer 2/Layer 3 boundary</td><td>SVIs and <code>ip routing</code> (Module 4); HSRP gateways (Module 5); the STP root for each VLAN, matched to the HSRP Active switch; ACLs (Module 8); routed uplinks to the core with OSPF</td><td>End devices plugged in directly</td></tr>
<tr><td><b>Core</b></td><td>Carry traffic between distribution blocks, fast and without interruption</td><td>Routed point-to-point links (<code>no switchport</code>), OSPF with equal-cost paths, a redundant pair</td><td>ACLs on user traffic, VLANs stretched between buildings, anything that slows forwarding</td></tr>
</table></div>
<h3>Why the boundary sits at distribution</h3>
<p>Below the distribution switches, traffic moves as <b>frames</b> (VLANs, trunks, Spanning Tree); above them, as <b>packets</b> (routing tables, OSPF). A user's frame reaches its SVI on the distribution switch and becomes a routed packet. The boundary sits there on purpose: it keeps each building's Layer 2 problems inside that building.</p>
<p>The idea is the ${K.g("failure domain","The part of a network that one fault can affect. A broadcast storm or STP problem is limited to its Layer 2 domain; routing stops it spreading further.")}. Module 4 showed that a loop with no Spanning Tree becomes a broadcast storm across the whole VLAN. If VLAN 10 stretched across four buildings, one bad patch cable in building A could stop building D. With the boundary at distribution, the storm dies at building A's SVIs, because routers never forward broadcasts. Between distribution and core there is no Layer 2 to loop and nothing for STP to block: OSPF sees two equal paths and uses both (Module 5's ECMP).</p>
${K.svg("0 0 800 360",
  K.link(376,55,424,55)+
  [230,310,490,570].map(x=>K.link(x,154,350,66)+K.link(x,154,450,66)).join("")+
  K.link(256,165,284,165)+K.link(516,165,544,165)+
  [[210,230,310],[330,230,310],[470,490,570],[590,490,570]].map(([a,d1,d2])=>K.link(a,274,d1,176)+K.link(a,274,d2,176)).join("")+
  K.dev("switch",350,55,"CORE1")+K.dev("switch",450,55,"CORE2")+
  K.dev("switch",230,165,"DIST-A1")+K.dev("switch",310,165,"DIST-A2")+K.dev("switch",490,165,"DIST-B1")+K.dev("switch",570,165,"DIST-B2")+
  K.dev("switch",210,285,"ACC-A1")+K.dev("switch",330,285,"ACC-A2")+K.dev("switch",470,285,"ACC-B1")+K.dev("switch",590,285,"ACC-B2")+
  '<line x1="20" y1="210" x2="625" y2="210" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="6 4"/>'+
  K.txt(20,112,"routed /30 links",{s:10})+K.txt(20,126,"no STP, OSPF ECMP",{s:10})+
  K.txt(20,203,"Layer 3 above: packets",{c:"accent",s:10})+K.txt(20,224,"Layer 2 below: frames",{c:"accent",s:10})+
  K.txt(20,248,"802.1Q trunks",{s:10})+K.txt(20,262,"STP blocks one per VLAN",{s:10})+
  K.txt(270,340,"Building A",{mid:true,c:"fg",f:"body"})+K.txt(530,340,"Building B",{mid:true,c:"fg",f:"body"})+
  K.txt(645,45,"CORE",{c:"fg",b:true,f:"display",s:12})+K.txt(645,62,"routed links, OSPF ECMP",{s:10})+K.txt(645,76,"fast, redundant, no policy",{s:10})+
  K.txt(645,152,"DISTRIBUTION",{c:"fg",b:true,f:"display",s:12})+K.txt(645,169,"SVIs + HSRP gateways",{s:10})+K.txt(645,183,"STP root, ACLs",{s:10})+
  K.txt(645,272,"ACCESS",{c:"fg",b:true,f:"display",s:12})+K.txt(645,289,"VLANs, PoE, PortFast",{s:10})+K.txt(645,303,"port security, snooping",{s:10}),
  "A three-tier campus with each layer's job and features. The dashed line is the Layer 2/Layer 3 boundary: SVIs on the distribution switches turn frames into routed packets.")}

<h3>Worked example: oversubscription, or how much can the uplinks carry?</h3>
<p>An access switch has far more bandwidth facing users than facing distribution. The ratio is its ${K.g("oversubscription","The ratio of the bandwidth that could arrive at a switch (all its downlink ports at full speed) to the bandwidth it can send onwards (its uplinks). 4:1 means users could, in theory, offer four times what the uplinks carry.")} ratio. That is normal, because 48 users never all download at full speed in the same second, but you need the number, and Spanning Tree changes it.</p>
${K.steps([
  ["Downlinks", "48 ports at 1 Gb/s: <b>48 Gb/s</b> that users could offer."],
  ["Uplinks that really forward", "Two 10 Gb/s uplinks, one to each distribution switch. Rapid PVST+ forwards each VLAN on <b>one</b> and blocks the other (Module 4), so one VLAN has <b>10 Gb/s</b>, not 20."],
  ["Divide", "One VLAN: 48 ÷ 10 = <b>4.8:1</b>. With VLANs split so half use each uplink (next section), the switch forwards on both: 48 ÷ 20 = <b>2.4:1</b>."],
  ["One layer up", "Twelve such switches offer 12 × 20 = 240 Gb/s to the distribution pair. Four 40 Gb/s links to the core carry 160 Gb/s: <b>1.5:1</b>."],
  ["Compare", "Rules of thumb often quoted from older Cisco campus guides are about 20:1 on access uplinks and 4:1 from distribution to core. Voice, video and daytime backups push real designs lower."],
])}
${K.mistake(`Counting both uplinks of a Layer 2 access switch as bandwidth for one VLAN. STP blocks one per VLAN. The blocked uplink is still valuable (it takes over within a second or two), but it is not extra capacity for that VLAN.`)}
${K.dyk(`Some campuses move the Layer 3 boundary down to the access switch. In <b>routed access</b>, each access switch routes for its own VLANs and its uplinks are routed OSPF links, so STP has nothing to block and both uplinks carry traffic. The price: a VLAN can no longer stretch across several access switches.`)}
<h3>When the third tier earns its place</h3>
<p>Module 1 counted the links: without a core, every distribution pair needs links to every other pair. Cisco's rule of thumb: add a separate core at three or more buildings, or four or more distribution pairs. Below that, two tiers are cheaper: the next section's design.</p>

<h3>Try it: give a distribution switch a new VLAN</h3>
<p>Abuja head office is three-tier. Building B's distribution pair, ABJ-B-DIST1 and ABJ-B-DIST2, has routed uplinks to the two cores and SVIs for the building's VLANs: DIST1 is gateway and STP root for VLAN 110, DIST2 for VLAN 120. New desk phones get VLAN 140 (10.60.140.0/24), assigned to DIST2. Do DIST2's half; DIST1 gets the mirror image (address .2, priority 100).</p>
${K.term({env:"ios2", title:"ABJ-B-DIST2 — a distribution switch's job, one VLAN at a time", opts:{kind:"switch", host:"ABJ-B-DIST2", model:"Catalyst 9300", motd:"ABJ-B-DIST2 — Abuja HQ, building B distribution (lab). Console session."},
  setup:env=>{ ["enable","configure terminal","ip routing","vlan 110","name STAFF-B","vlan 120","name PRINT-B","exit",
    "spanning-tree vlan 110 priority 28672","spanning-tree vlan 120 priority 24576",
    "interface g0/1","description TRUNK ABJ-B-ACC1","switchport mode trunk","interface g0/2","description TRUNK ABJ-B-ACC2","switchport mode trunk",
    "interface g0/6","description PO TO ABJ-B-DIST1","switchport mode trunk",
    "interface g0/7","description ROUTED TO ABJ-CORE1","no switchport","ip address 10.60.255.9 255.255.255.252","ip ospf network point-to-point",
    "interface g0/8","description ROUTED TO ABJ-CORE2","no switchport","ip address 10.60.255.13 255.255.255.252","ip ospf network point-to-point",
    "interface vlan 110","ip address 10.60.110.3 255.255.255.0","standby 110 ip 10.60.110.1","standby 110 preempt","no shutdown",
    "interface vlan 120","ip address 10.60.120.3 255.255.255.0","standby 120 ip 10.60.120.1","standby 120 priority 110","standby 120 preempt","no shutdown",
    "router ospf 1","router-id 10.60.0.12","network 10.60.0.0 0.0.255.255 area 0","passive-interface Vlan110","passive-interface Vlan120","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"This terminal is DIST2 on its own, so HSRP shows it Active with Standby &ldquo;unknown&rdquo;: no peer is connected here. On the benches later in this lesson the peer switch is present.",
  tasks:[
    {text:"Read the switch's job first: <code>enable</code>, then <code>show ip interface brief</code> and <code>show standby brief</code>. Which interfaces are routed uplinks to the core, and which are gateways for the building's VLANs?", done:e=>e.history.some(h=>/^\s*sh\S*\s+ip\s+int\S*\s+br/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+stan\S*\s+br/i.test(h))},
    {text:"<code>configure terminal</code>, then create the VLAN: <code>vlan 140</code>, <code>name VOICE-B</code>", done:e=>!!e.vlans[140] && /voice/i.test(String(e.vlans[140]))},
    {text:"Build the gateway: <code>interface vlan 140</code>, <code>ip address 10.60.140.3 255.255.255.0</code>, <code>standby 140 ip 10.60.140.1</code>, <code>standby 140 priority 110</code>, <code>standby 140 preempt</code>, <code>no shutdown</code>", done:e=>{ const i = e.intfs.Vlan140; const h = i && i.hsrp && i.hsrp[140]; return !!(i && i.ip==="10.60.140.3" && i.mask==="255.255.255.0" && !i.shut && h && h.ip==="10.60.140.1" && h.prio===110 && h.preempt); }},
    {text:"Make the Layer 2 root match the Layer 3 gateway: <code>exit</code>, then <code>spanning-tree vlan 140 root primary</code>", done:e=>!!e.stpPrio && e.stpPrio[140]!=null && e.stpPrio[140]<=24576},
    {text:"The phones' subnet must be advertised, but no OSPF hellos should go to the phones: <code>router ospf 1</code>, <code>passive-interface Vlan140</code>. (The existing <code>network 10.60.0.0 0.0.255.255 area 0</code> already covers 10.60.140.0/24.)", done:e=>!!(e.ospf && (e.ospf.passive||[]).includes("Vlan140"))},
    {text:"<code>end</code>, prove it with <code>show standby brief</code> and <code>show running-config | include spanning-tree</code>, then save with <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.history.filter(h=>/^\s*sh\S*\s+stan\S*\s+br/i.test(h)).length>=2 && e.history.some(h=>/^\s*sh\S*\s+run\S*\s*\|\s*i\S*\s+span/i.test(h))},
  ],
  win:"DIST2 now does the distribution job for VLAN 140: it is the HSRP Active gateway (10.60.140.1), the STP root (so phone frames take the shortest path to their gateway), and it advertises 10.60.140.0/24 to the core over its routed uplinks without sending hellos to the phones. The routed links to the core didn't change at all, which is the point of a core: new VLANs never touch it.",
  solve:["enable","show ip interface brief","show standby brief","configure terminal","vlan 140","name VOICE-B","interface vlan 140","ip address 10.60.140.3 255.255.255.0","standby 140 ip 10.60.140.1","standby 140 priority 110","standby 140 preempt","no shutdown","exit","spanning-tree vlan 140 root primary","router ospf 1","passive-interface Vlan140","end","show standby brief","show running-config | include spanning-tree","copy running-config startup-config",""]})}
${K.hint(`The pattern for every distribution change: VLAN, SVI with HSRP, STP root on the Active switch, subnet advertised. The core never changes.`)}
${K.check({q:"In a three-tier campus with Layer 2 access switches, where do the users' default gateways normally live?", o:["On the access switches, one SVI per port","On the distribution switches, as SVIs shared through HSRP","On the core switches, so every building uses one gateway","On the WAN edge router"], a:1, why:"Distribution is the Layer 2/Layer 3 boundary: SVIs there route each VLAN, and an FHRP such as HSRP shares one virtual gateway address between the pair. Core switches only route between distribution blocks; access switches only switch frames in the classic design."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"You inherit four switch configurations with no hostnames. Using what each one does, match it with its layer.", pairs:[["Forty-eight ports in VLAN 30 with PortFast, BPDU guard, port security and a voice VLAN; two trunk uplinks","Access"],["SVIs for VLANs 30 to 34, each with an HSRP group and a spanning-tree priority; two routed uplinks","Distribution"],["Only routed point-to-point links and OSPF; no VLANs except VLAN 1, no ACLs","Core"],["NAT overload, a DHCP pool, a four-port switch and a Wi-Fi radio in one box","SOHO router"]], why:"1. What is asked? Which job each box does. 2. Which rule? Access attaches and protects endpoints; distribution ends Layer 2 (gateways and the STP root); the core only routes between blocks; a SOHO router does every job in one box. 3. Apply it: user-port protection is access; SVIs with HSRP are distribution; pure routed links are core; NAT, DHCP and Wi-Fi together are a SOHO box (later in this lesson)."})}

<h2>Two-tier in practice: inside a collapsed core</h2>
${K.remember(`<b>The rule:</b> in a collapsed core, two switches do the distribution job for the whole building. Each access switch has an uplink to <b>each</b> core. For every VLAN, one core is <b>both</b> STP root and HSRP Active; the other backs up both. An EtherChannel joins the cores; routed links go up to the edge.`)}
<p>Why must root and Active be the same switch? Follow a frame. A VLAN 10 PC sends to its gateway's virtual MAC, and its access switch forwards it up its <b>root port</b>, towards the STP root. If the root is CORE1 but HSRP Active is CORE2, CORE1 must send every frame across the inter-core link to CORE2 before it is routed: an extra hop, and the inter-core link carries the building's traffic. Module 5 gave this as advice; here is the reason.</p>
<p>Split the VLANs (CORE1 root and Active for some, CORE2 for the others) and each access uplink forwards for half the VLANs, so both uplinks carry traffic.</p>
${K.svg("0 0 760 360",
  K.txt(185,20,"VLAN 10: ENU-CORE1 is root + HSRP Active",{mid:true,c:"fg",b:true,f:"display",s:12})+
  K.txt(575,20,"VLAN 20: ENU-CORE2 is root + HSRP Active",{mid:true,c:"fg",b:true,f:"display",s:12})+
  '<line x1="380" y1="10" x2="380" y2="350" stroke="var(--line)" stroke-dasharray="4 4"/>'+
  [0,390].map(o=>{ const v10 = o===0;
    return K.link(o+116,70,o+254,70,"Po1")+
      `<line x1="${o+90}" y1="189" x2="${o+90}" y2="81" stroke="${v10?"var(--accent)":"var(--muted)"}" stroke-width="${v10?3:1.6}" ${v10?"":'stroke-dasharray="5 4"'}/>`+
      `<line x1="${o+116}" y1="192" x2="${o+254}" y2="80" stroke="${v10?"var(--muted)":"var(--muted)"}" stroke-width="1.6" ${v10?'stroke-dasharray="5 4"':""}/>`+
      `<line x1="${o+254}" y1="192" x2="${o+116}" y2="80" stroke="var(--muted)" stroke-width="1.6" ${v10?"":'stroke-dasharray="5 4"'}/>`+
      `<line x1="${o+280}" y1="189" x2="${o+280}" y2="81" stroke="${v10?"var(--muted)":"var(--accent)"}" stroke-width="${v10?1.6:3}" ${v10?'stroke-dasharray="5 4"':""}/>`+
      K.txt(o+(v10?144:90),v10?170:150,"✗",{mid:true,c:"bad",s:14,b:true})+K.txt(o+(v10?280:226),v10?150:170,"✗",{mid:true,c:"bad",s:14,b:true})+
      `<line x1="${o+(v10?90:280)}" y1="268" x2="${o+(v10?90:280)}" y2="211" stroke="var(--accent)" stroke-width="3"/>`+
      K.dev("switch",o+90,70,"ENU-CORE1",v10?"root + Active":"backup")+K.dev("switch",o+280,70,"ENU-CORE2",v10?"backup":"root + Active")+
      K.dev("switch",o+90,200,"ENU-ACC1")+K.dev("switch",o+280,200,"ENU-ACC2")+
      K.dev("pc",o+(v10?90:280),288,v10?"STAFF PC":"SALES PC");
  }).join("")+
  K.txt(380,352,"accent = the path to the gateway · dashed with ✗ = blocked by STP for that VLAN · Po1 = 2-link LACP EtherChannel",{mid:true,s:10,f:"body"}),
  "Per-VLAN load sharing in a collapsed core. For each VLAN the STP root and the HSRP Active gateway are the same switch, so frames go straight up to the router that routes them. Each uplink forwards for one VLAN and blocks for the other.")}

<h3>Worked example: reading the Enugu office</h3>
<p>The Enugu office runs the design in the diagram: staff VLAN 10 (10.70.10.0/24), sales VLAN 20 (10.70.20.0/24), ENU-CORE1 at .2, ENU-CORE2 at .3, HSRP virtual gateway .1, and a routed /30 from each core to ENU-WAN1, the WAN edge. Read it from the devices, in the order traffic meets them.</p>
${K.out(`ENU-ACC1#show spanning-tree vlan 10
VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    24586
             Cost        4
             Port        1 (GigabitEthernet0/1)
...
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         128.1    P2p
Gi0/2               Altn BLK 4         128.2    P2p
Gi0/5               Desg FWD 4         128.5    P2p Edge`, "Trimmed. On the access switch, VLAN 10 forwards up Gi0/1 (to ENU-CORE1) and blocks Gi0/2 (to ENU-CORE2). Gi0/5 is the staff PC's PortFast port (Edge).")}
${K.out(`ENU-CORE1#show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl10        10   110 P Active  local           10.70.10.3      10.70.10.1
Vl20        20   100 P Standby 10.70.20.3      local           10.70.20.1`, "ENU-CORE1 is Active for VLAN 10 (priority 110) and Standby for VLAN 20, where ENU-CORE2 has the higher priority.")}
${K.out(`ENU-WAN1#show ip route ospf | begin Gateway
Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 8 subnets, 3 masks
O        10.70.10.0/24 [110/2] via 10.70.255.1, 00:22:39, GigabitEthernet0/0
                       [110/2] via 10.70.255.5, 00:22:39, GigabitEthernet0/1
O        10.70.20.0/24 [110/2] via 10.70.255.1, 00:30:40, GigabitEthernet0/0
                       [110/2] via 10.70.255.5, 00:30:40, GigabitEthernet0/1`, "From the WAN edge, both user subnets have two equal-cost paths, one through each core. Above the collapsed core everything is routed, and ECMP uses both links.")}
${K.steps([
  ["Layer 2: which way?", "VLAN 10 frames leave ENU-ACC1 on Gi0/1, its root port, towards ENU-CORE1. Gi0/2 is an <b>alternate</b> port: blocked, ready to take over."],
  ["Layer 3: who routes?", "ENU-CORE1 is HSRP Active for 10.70.10.1, so it owns the virtual MAC <code>0000.0c07.ac0a</code> (group 10 in hex) and routes. Root and gateway match: aligned."],
  ["Above the core", "ENU-CORE1 routes out of its /30 to ENU-WAN1. Tracert from a staff PC: hop 1 <b>10.70.10.2</b> (the Active core's own address), hop 2 10.70.255.2."],
  ["The way back", "ENU-WAN1 has two equal paths and may return a reply via ENU-CORE2, which delivers it as a VLAN 10 frame across Po1 to ENU-CORE1 and down (ENU-ACC1 blocks its CORE2 uplink for VLAN 10). Different paths each way are normal here."],
  ["If ENU-CORE1 dies", "ENU-ACC1's alternate port becomes root port (Rapid PVST+: usually a second or two); ENU-CORE2 becomes Active when the HSRP hold time expires (10 s by default); ENU-WAN1 keeps its other path. Users lose seconds, not the morning."],
])}
${K.tip(`Run <code>show spanning-tree vlan N</code> on an access switch and <code>show standby brief</code> on the cores <b>for the same VLAN</b>. Root port towards one core and Active on the other means misaligned: nothing broken yet, but the inter-core link carries traffic it shouldn't.`)}
${K.mistake(`Trusting &ldquo;fully redundant&rdquo; on a handover document. The classic hidden fault is an access switch with one uplink because the second cable was never patched. It works on day one; you find out the day its one core reboots. <code>show interfaces status</code> (a <i>notconnect</i> uplink) and <code>show spanning-tree</code> (no alternate port) find it in minutes.`)}

<h3>Hands-on: audit the Port Harcourt office, then fail a core</h3>
${K.bench((()=>{
  const SSH = h => ["hostname "+h,"ip domain name ph.example.com","username netadmin privilege 15 secret Ph-Lab-2026","line vty 0 4","login local","transport input ssh","exit"];
  const run = (e, cmds) => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); e.exec("conf t"); e.exec("crypto key generate rsa modulus 2048"); e.exec(""); e.exec("end"); e.history.length = 0; };
  const core = n => e => { const me = n===1, p = me?"2":"3"; run(e, [...SSH("PH-CORE"+n),"ip routing","vlan 10","name STAFF","vlan 20","name FINANCE","vlan 99","name MGMT","exit",
    "spanning-tree vlan 10,99 priority "+(me?"24576":"28672"),"spanning-tree vlan 20 priority "+(me?"28672":"24576"),
    "interface g0/1","description TO PH-ACC1 G0/"+n,"switchport mode trunk","interface g0/2","description TO PH-ACC2 G0/"+n,"switchport mode trunk",
    "interface g0/3","description PO1 TO PH-CORE"+(me?2:1),"switchport mode trunk","channel-group 1 mode active",
    "interface g0/4","description PO1 TO PH-CORE"+(me?2:1),"switchport mode trunk","channel-group 1 mode active",
    "interface g0/5","description TO PH-WAN1","no switchport","ip address 10.40.255."+(me?"1":"5")+" 255.255.255.252",
    "interface vlan 10","ip address 10.40.10."+p+" 255.255.255.0","standby 10 ip 10.40.10.1",...(me?["standby 10 priority 110"]:[]),"standby 10 preempt","no shutdown",
    "interface vlan 20","ip address 10.40.20."+p+" 255.255.255.0","standby 20 ip 10.40.20.1",...(me?[]:["standby 20 priority 110"]),"standby 20 preempt","no shutdown",
    "interface vlan 99","ip address 10.40.99."+p+" 255.255.255.0","standby 99 ip 10.40.99.1",...(me?["standby 99 priority 110"]:[]),"standby 99 preempt","no shutdown",
    "router ospf 1","router-id "+n+"."+n+"."+n+"."+n,"network 10.40.0.0 0.0.255.255 area 0","passive-interface Vlan10","passive-interface Vlan20","exit"]); };
  const acc = n => e => run(e, [...SSH("PH-ACC"+n),"vlan 10","name STAFF","vlan 20","name FINANCE","vlan 99","name MGMT","exit",
    "interface g0/1","description TO PH-CORE1 G0/"+n,"switchport mode trunk","interface g0/2","description TO PH-CORE2 G0/"+n,"switchport mode trunk",
    "interface g0/5","description USER PORT","switchport mode access","switchport access vlan "+(n===1?10:20),"spanning-tree portfast",
    "interface vlan 99","ip address 10.40.99.1"+n+" 255.255.255.0","no shutdown","exit","ip default-gateway 10.40.99.1"]);
  const H = (B, id, re) => ((B.devs[id].env||{}).history||[]).filter(h=>re.test(h)).length;
  const STP20 = /^\s*sh\S*\s+span\S*\s+vl\S*\s+20\b/i, APP = "10.10.50.10";
  return {id:"m10-twotier", points:120, from:"CCNA · Module 10 · lesson 1", title:"Port Harcourt: audit a collapsed core, then pull the plug on a core", viewBox:"0 0 960 590", openLog:true,
  intro:"<b>The handover note says:</b> &ldquo;(1) two-tier collapsed core, PH-CORE1 gateway and root for VLAN 10, PH-CORE2 for VLAN 20; (2) every access switch dual-homed; (3) either core can fail without users noticing.&rdquo; Check each claim. Work from <b>IT-PC</b> (VLAN 10): ping, tracert, and <code>ssh -l netadmin &lt;address&gt;</code> (password <code>Ph-Lab-2026</code>, a lab example; privilege 15, so you land at <code>#</code>; <code>exit</code> leaves). Management: PH-CORE1 10.40.99.2, PH-CORE2 10.40.99.3, PH-ACC1 10.40.99.11, PH-ACC2 10.40.99.12, PH-WAN1 10.40.255.2. LOS-APP1 (10.10.50.10) stands in for the Lagos payroll server: the WAN is replaced by that one server. Convergence is instant in the lab; real switches take a few seconds (STP) and up to 10 seconds (HSRP).",
  devices:[
    {id:"wan", kind:"router", label:"PH-WAN1", x:380, y:10, config:e=>run(e, [...SSH("PH-WAN1"),
      "interface g0/0","description TO PH-CORE1 G0/5","ip address 10.40.255.2 255.255.255.252","no shutdown",
      "interface g0/1","description TO PH-CORE2 G0/5","ip address 10.40.255.6 255.255.255.252","no shutdown",
      "interface g0/2","description LOS-APP1 STAND-IN FOR THE WAN","ip address 10.10.50.1 255.255.255.0","no shutdown",
      "router ospf 1","router-id 9.9.9.9","network 10.40.255.0 0.0.0.7 area 0","network 10.10.50.0 0.0.0.255 area 0","passive-interface g0/2","exit"])},
    {id:"app", kind:"server", label:"LOS-APP1", x:760, y:0, ip:APP, mask:"255.255.255.0", gw:"10.10.50.1"},
    {id:"core1", kind:"switch", label:"PH-CORE1", model:"Catalyst 9300", x:20, y:150, config:core(1)},
    {id:"core2", kind:"switch", label:"PH-CORE2", model:"Catalyst 9300", x:500, y:150, config:core(2)},
    {id:"acc1", kind:"switch", label:"PH-ACC1", model:"Catalyst 9200", x:20, y:320, config:acc(1)},
    {id:"acc2", kind:"switch", label:"PH-ACC2", model:"Catalyst 9200", x:500, y:320, config:acc(2)},
    {id:"pc1", kind:"pc", label:"IT-PC", x:160, y:470, ip:"10.40.10.21", mask:"255.255.255.0", gw:"10.40.10.1"},
    {id:"pc2", kind:"pc", label:"FIN-PC", x:640, y:470, ip:"10.40.20.31", mask:"255.255.255.0", gw:"10.40.20.1"} ],
  cables:[ {type:"cat6",a:"wan:g0",b:"core1:g5"},{type:"cat6",a:"wan:g1",b:"core2:g5"},{type:"cat6",a:"app:eth",b:"wan:g2"},
    {type:"cat6",a:"core1:g3",b:"core2:g3"},{type:"cat6",a:"core1:g4",b:"core2:g4"},
    {type:"cat6",a:"acc1:g1",b:"core1:g1"},{type:"cat6",a:"acc1:g2",b:"core2:g1"},{type:"cat6",a:"acc2:g1",b:"core1:g2"},
    {type:"cat6",a:"pc1:eth",b:"acc1:g5"},{type:"cat6",a:"pc2:eth",b:"acc2:g5"} ],
  tray:["cat6"],
  tasks:[
    {text:"Start where the users are. On IT-PC run <code>tracert 10.10.50.10</code>. Hop 1 is the router that really routes VLAN 10: which core owns that address?", done:B=>Bench.traced(B,"pc1",APP)},
    {text:"Claim 1, Layer 2. <code>ssh -l netadmin 10.40.99.11</code> to PH-ACC1, then <code>show spanning-tree vlan 10</code> and <code>show spanning-tree vlan 20</code>. Which uplink forwards and which blocks in each VLAN? Then <code>exit</code>.", done:B=>H(B,"acc1",/^\s*sh\S*\s+span\S*\s+vl\S*\s+10\b/i)>0 && H(B,"acc1",/^\s*sh\S*\s+span\S*\s+vl\S*\s+20\b/i)>0},
    {text:"Claim 1, Layer 3. SSH to PH-CORE1 (10.40.99.2): <code>show standby brief</code> and <code>show etherchannel summary</code>. Is CORE1 Active for the same VLAN it is root for? What joins the two cores?", done:B=>H(B,"core1",/^\s*sh\S*\s+stan\S*\s+br/i)>0 && H(B,"core1",/^\s*sh\S*\s+ether\S*\s+su/i)>0},
    {text:"Above the core. SSH to PH-WAN1 (10.40.255.2): <code>show ip route ospf</code>. How many paths does the WAN edge have to 10.40.10.0/24, and why are they equal?", done:B=>H(B,"wan",/^\s*sh\S*\s+ip\s+ro/i)>0},
    {text:"Claim 2. SSH to PH-ACC2 (10.40.99.12): <code>show interfaces status</code> and <code>show spanning-tree vlan 20</code>. One uplink is missing. Fix the cabling: take a Cat6 from the tray and patch PH-ACC2 Gi0/2 to PH-CORE2 Gi0/2 (both ends are already configured as trunks).", done:B=>H(B,"acc2",/^\s*sh\S*\s+int\S*\s+stat/i)>0 && Bench.up(B,"acc2:g2","core2:g2")},
    {text:"Prove PH-ACC2 is dual-homed now: on PH-ACC2 run <code>show spanning-tree vlan 20</code> again. Which port is the root port now, which is the alternate, and why did the root port move?", done:B=>Bench.up(B,"acc2:g2","core2:g2") && Bench.stpRole(B,"acc2","g2",20)==="Root FWD" && Bench.stpRole(B,"acc2","g1",20)==="Altn BLK" && H(B,"acc2",STP20)>=2},
    {text:"Claim 3, the failure drill. Power off <b>PH-CORE1</b> (its power button). Then <code>ping 10.10.50.10</code> from FIN-PC and from IT-PC, and run <code>tracert 10.10.50.10</code> on IT-PC again. What changed at hop 1?", done:B=>B.devs.core1.on===false && Bench.hsrpState(B,"core2","Vlan10",10)==="Active" && Bench.up(B,"acc2:g2","core2:g2") && Bench.pingedNow(B,"pc2",APP) && Bench.pingedNow(B,"pc1",APP)},
    {text:"Read the evidence, then restore. SSH to PH-CORE2 (10.40.99.3): <code>show standby brief</code> and <code>show logging</code> (find the HSRP state changes and the OSPF neighbour that went down). Power PH-CORE1 back on. Which core is Active for VLAN 10 now, and which command makes that happen?", done:B=>B.devs.core1.on!==false && Bench.logged(B,"core2",/Grp 10 state Standby -> Active/) && Bench.hsrpState(B,"core1","Vlan10",10)==="Active" && H(B,"core2",/^\s*sh\S*\s+stan\S*\s+br/i)>0 && H(B,"core2",/^\s*sh\S*\s+log/i)>0},
  ],
  win:"Signed off, with one finding. Claim 1 was true: each core is STP root and HSRP Active for its own VLAN, so frames climb straight to the switch that routes them, and the WAN edge sees two equal OSPF paths. Claim 2 was false until you patched PH-ACC2's second uplink. Without it, FIN-PC loses everything the moment PH-CORE1 stops; try it on a reset bench: ping from FIN-PC, power off PH-CORE1, ping again, and every reply is <code>Request timed out.</code> (FIN-PC still has its gateway's MAC cached, but its frames have nowhere to go; without that first ping it can't ARP for the gateway at all and reports &ldquo;Destination host unreachable&rdquo; from its own address). Claim 3 is now true: with PH-CORE1 off, PH-CORE2 took over as gateway for VLAN 10, the access switches' alternate ports took over, and when PH-CORE1 came back, <code>standby 10 preempt</code> handed VLAN 10 back to it.",
  solve:[["pc","pc1","tracert 10.10.50.10"],
    ["pc","pc1","ssh -l netadmin 10.40.99.11"],["pc","pc1","Ph-Lab-2026"],["pc","pc1","show spanning-tree vlan 10"],["pc","pc1","show spanning-tree vlan 20"],["pc","pc1","exit"],
    ["pc","pc1","ssh -l netadmin 10.40.99.2"],["pc","pc1","Ph-Lab-2026"],["pc","pc1","show standby brief"],["pc","pc1","show etherchannel summary"],["pc","pc1","exit"],
    ["pc","pc1","ssh -l netadmin 10.40.255.2"],["pc","pc1","Ph-Lab-2026"],["pc","pc1","show ip route ospf"],["pc","pc1","exit"],
    ["pc","pc1","ssh -l netadmin 10.40.99.12"],["pc","pc1","Ph-Lab-2026"],["pc","pc1","show interfaces status"],["pc","pc1","show spanning-tree vlan 20"],
    ["plug","cat6","acc2:g2","core2:g2"],["pc","pc1","show spanning-tree vlan 20"],["pc","pc1","exit"],
    ["power","core1",false],["pc","pc2","ping 10.10.50.10"],["pc","pc1","ping 10.10.50.10"],["pc","pc1","tracert 10.10.50.10"],
    ["pc","pc1","ssh -l netadmin 10.40.99.3"],["pc","pc1","Ph-Lab-2026"],["pc","pc1","show standby brief"],["pc","pc1","show logging"],["pc","pc1","exit"],
    ["power","core1",true]]}; })())}
${K.hint(`Task 1: hop 1 is a core's <i>real</i> SVI address, never the virtual .1. Task 5: Gi0/2 is <i>notconnect</i> and VLAN 20 has no alternate port. Task 6: the direct link to the root (cost 4) beats the path via PH-CORE1 and Po1 (4 + 3 = 7).`)}

${K.job("&ldquo;Since the weekend, the shared drive is slow for staff on floors 2 and 3&rdquo;", `
<p><b>The ticket</b> (Monday 09:20, an Ilorin office with a collapsed core): &ldquo;The shared drive is slow since the weekend. Finance on floor 4 says theirs is fine.&rdquo; Nobody changed anything, the requester says; the change calendar shows ILR-CORE1 was rebooted on Saturday for an upgrade.</p>
<p><b>Questions first.</b> Slow: staff, VLAN 10. Fine: finance, VLAN 40. Shared: the cores. What can a reboot change? Which core does which job.</p>
<ol>
<li><b>Path:</b> <code>tracert</code> from a slow PC: hop 1 is <b>10.80.10.3</b>, ILR-CORE2. The design says ILR-CORE1 (.2) is VLAN 10's gateway.</li>
<li><b>Gateway:</b> ILR-CORE1 <code>show standby brief</code>: Vlan10, priority 110, <b>Standby</b>, no <b>P</b>. ILR-CORE2 took over during the reboot, and without preempt ILR-CORE1 never took it back.</li>
<li><b>Layer 2:</b> an access switch's <code>show spanning-tree vlan 10</code>: the root port leads to ILR-CORE1, root again since it rebooted. Every VLAN 10 frame goes up to ILR-CORE1 and across Po1 to ILR-CORE2.</li>
<li><b>Cost:</b> <code>show interfaces port-channel 1</code> shows the inter-core bundle near its limit all morning.</li>
<li><b>Fix:</b> on ILR-CORE1, <code>interface vlan 10</code>, <code>standby 10 preempt</code>; it goes Active at once (%HSRP-5-STATECHANGE … Standby -&gt; Active). VLAN 20's group was missing preempt too.</li>
<li><b>Verify:</b> hop 1 is 10.80.10.2 again, Po1 load falls, users confirm.</li>
</ol>
<p><b>To the office manager:</b> &ldquo;During the upgrade the backup core took over, as designed. A missing setting stopped the main one taking its job back, so staff traffic detoured through both cores. Fixed, and the other groups checked.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;Cause: no preempt on HSRP 10/20 at ILR-CORE1; after Saturday's reload ILR-CORE2 stayed Active while ILR-CORE1 was STP root → hair-pin over Po1. Fix: standby 10/20 preempt. Verified: tracert hop 1 = .2, Po1 normal. Follow-up: add 'STP root = HSRP Active per VLAN' to the post-change checklist.&rdquo;</p>`)}
${K.check({q:"In a collapsed core, an access switch's root port for VLAN 30 leads to CORE-A, but show standby brief says CORE-B is Active for VLAN 30. What is the effect?", o:["VLAN 30 has no gateway until CORE-A becomes Active","VLAN 30 frames go up to CORE-A and then cross the inter-core link to CORE-B to be routed: an extra hop and extra load on that link","Spanning Tree blocks VLAN 30 on the inter-core link, so VLAN 30 can't be routed","Nothing changes, because HSRP and STP are unrelated"], a:1, why:"Frames follow STP towards the root; routing happens wherever HSRP is Active. If those are different switches, every frame detours across the inter-core link. Traffic still flows, which is why the misalignment can go unnoticed, but the path is longer and the inter-core link carries the whole VLAN. Align them: make the same switch root and Active, with preempt."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Kaduna office has a collapsed core, KAD-CORE-A and KAD-CORE-B, joined by Po1. KAD-CORE-A is the STP root for VLANs 10 and 30. After a power cut, show standby brief shows KAD-CORE-B Active for VLAN 10 with no preempt configured anywhere. A PC in VLAN 10 on KAD-ACC3 sends a packet to a server in another subnet. Fill in its path.", fields:[{label:"First core switch the frame reaches", a:["KAD-CORE-A","CORE-A","core-a","kad-core-a","A"]},{label:"Core switch that routes the packet", a:["KAD-CORE-B","CORE-B","core-b","kad-core-b","B"]},{label:"Link that joins those two steps", a:["Po1","port-channel 1","port-channel1","the EtherChannel","EtherChannel","inter-core link","the inter-core EtherChannel"]}], why:"1. What is asked? Where a VLAN 10 frame goes, and where it is routed. 2. Which rules? Frames follow Spanning Tree towards the root; routing happens on the HSRP Active switch. 3. Apply it: KAD-ACC3's root port for VLAN 10 leads to KAD-CORE-A (the root), but KAD-CORE-B owns the virtual MAC, so KAD-CORE-A switches the frame across Po1 to KAD-CORE-B, which routes it. Fix: preempt with the right priorities, so KAD-CORE-A takes VLAN 10 back."})}

<h2>Spine-leaf: the data-centre fabric</h2>
${K.remember(`<b>The rule:</b> every leaf connects to every spine, and no other switch-to-switch links exist. Any two leaves are <b>leaf → spine → leaf</b> apart through <i>any</i> spine, so routing sees one equal-cost path per spine and ECMP uses them all. Count the spines and you know the paths, and what one failure costs.`)}
<p>Module 1 gave you the rules and the reason: data-centre traffic is mostly <b>east-west</b>, server to server. A fabric engineer adds this: every leaf-to-spine link is a <b>routed point-to-point link</b> (a /30 or /31, <code>no switchport</code>, OSPF point-to-point or another routing protocol), and each leaf advertises its server subnets. There is no Layer 2 between the switches, so nothing for Spanning Tree to block.</p>
<p>From LEAF1 to LEAF4's subnet, SPF finds one path through each spine, each costing 1 + 1 + 1 = 3. The costs tie, so OSPF installs them all (ECMP) and shares flows between them. In a Layer 2 design, STP would block all but one spine per VLAN. In one sentence: <b>routing uses every link, Spanning Tree can't.</b></p>
${K.svg("0 0 760 330",
  [[130,250],[130,510],[380,250],[380,510],[630,250],[630,510]].map(([l,s])=>K.link(l,179,s,71)).join("")+
  '<line x1="130" y1="179" x2="250" y2="71" stroke="var(--accent)" stroke-width="3"/><line x1="250" y1="71" x2="630" y2="179" stroke="var(--accent)" stroke-width="3"/>'+
  '<line x1="130" y1="179" x2="510" y2="71" stroke="var(--accent)" stroke-width="3" stroke-dasharray="8 4"/><line x1="510" y1="71" x2="630" y2="179" stroke="var(--accent)" stroke-width="3" stroke-dasharray="8 4"/>'+
  '<path d="M156,196 Q255,236 354,196" fill="none" stroke="var(--bad)" stroke-width="1.8" stroke-dasharray="4 4"/>'+
  K.txt(255,228,"✗",{mid:true,c:"bad",s:15,b:true})+K.txt(255,250,"never leaf to leaf",{mid:true,c:"bad",s:10})+
  [130,380,630].map(x=>K.link(x,201,x,252)).join("")+
  K.dev("switch",250,60)+K.txt(250,36,"SPINE1",{mid:true,c:"fg",b:true,f:"display",s:11})+
  K.dev("switch",510,60)+K.txt(510,36,"SPINE2",{mid:true,c:"fg",b:true,f:"display",s:11})+
  K.dev("switch",130,190)+K.txt(70,194,"LEAF1",{end:true,c:"fg",b:true,f:"display",s:11})+
  K.dev("switch",380,190)+K.txt(420,180,"LEAF2",{c:"fg",b:true,f:"display",s:11})+
  K.dev("switch",630,190)+K.txt(690,194,"LEAF3",{c:"fg",b:true,f:"display",s:11})+
  K.dev("server",130,270,"server A")+K.dev("server",380,270,"server B")+K.dev("server",630,270,"server C")+
  K.txt(745,90,"two equal paths,",{end:true,c:"accent",s:10})+K.txt(745,104,"cost 3 each: ECMP",{end:true,c:"accent",s:10}),
  "A to C: solid accent through SPINE1, dashed accent through SPINE2, both cost 3, both used. A cable between two leaves would create a shorter, unequal path and break the fabric's main promise.")}
<h3>Worked example: what the leaf's routing table says</h3>
<p>A small fabric: FAB-SPINE1 and FAB-SPINE2, four leaves, servers on 10.30.<i>leaf</i>.0/24, links from 10.31.<i>spine</i><i>leaf</i>.0/30, all 1 Gb/s with OSPF cost 1. From FAB-LEAF1:</p>
${K.out(`FAB-LEAF1#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
10.31.0.1         0   FULL/  -        00:00:34    10.31.11.1      GigabitEthernet0/1
10.31.0.2         0   FULL/  -        00:00:36    10.31.21.1      GigabitEthernet0/2

FAB-LEAF1#show ip route ospf | begin Gateway
Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 15 subnets, 3 masks
O        10.30.2.0/24 [110/3] via 10.31.11.1, 00:24:18, GigabitEthernet0/1
                      [110/3] via 10.31.21.1, 00:24:18, GigabitEthernet0/2
O        10.30.3.0/24 [110/3] via 10.31.11.1, 00:16:49, GigabitEthernet0/1
                      [110/3] via 10.31.21.1, 00:16:49, GigabitEthernet0/2
O        10.30.4.0/24 [110/3] via 10.31.11.1, 00:09:20, GigabitEthernet0/1
                      [110/3] via 10.31.21.1, 00:09:20, GigabitEthernet0/2
...`, "Trimmed. Exactly one neighbour per spine, each FULL/ - (point-to-point: no DR). Every other leaf's subnet has the same cost, 3, through both spines.")}
${K.steps([
  ["Neighbours", "A leaf has exactly one OSPF neighbour per spine. A third neighbour here would be a link that shouldn't exist."],
  ["Equal costs", "Every remote server subnet is [110/3]: up (1), down (1), the far server interface (1). Module 1's &ldquo;predictable distance&rdquo;, written as a metric."],
  ["One path per spine", "Two <code>via</code> lines per prefix. IOS installs up to 4 equal OSPF paths by default (<code>Maximum path: 4</code> in <code>show ip protocols</code>); data-centre switches allow many more, which a fabric with more spines needs."],
  ["Tracert agrees", "Server on LEAF1 to server on LEAF4: gateway 10.30.1.1, a spine (10.31.11.1), LEAF4 (10.31.14.2), the server. Four lines for any pair on different leaves."],
])}
<h3>Worked example: how big can it grow?</h3>
${K.steps([
  ["The leaf", "48 server ports at 25 Gb/s (1,200 Gb/s) and 6 uplinks at 100 Gb/s (600 Gb/s): oversubscription <b>2:1</b>."],
  ["Spines are limited by leaf uplinks", "One uplink per spine, so at most <b>6 spines</b>."],
  ["Leaves are limited by spine ports", "One spine port per leaf: a 32-port spine allows <b>32 leaves</b>, 32 × 48 = <b>1,536 server ports</b>."],
  ["Losing a spine", "6 equal paths become 5: about <b>17%</b> less capacity, no server cut off. Size with that headroom."],
  ["Growing", "More servers: add a leaf, cable it once to every spine. More bandwidth: add a spine, cable it once to every leaf. Nothing in place is re-cabled."],
])}
${K.dyk(`Many fabrics run a second network on top of this one. An ${K.g("overlay","A virtual network built on top of another one by tunnelling it across. A data-centre overlay (VXLAN is the common one) carries Layer 2 frames inside UDP packets across a routed fabric.")} carries a virtual machine's Layer 2 segment across the fabric, so the VM keeps its address when it moves racks (Cisco ACI is one product built this way). The routed spine-leaf underneath is the ${K.g("underlay","The physical network and its routing that carry an overlay's tunnels. In a fabric, the routed spine-leaf links and OSPF (or BGP).")}. Lessons 3 and 4 meet the same pair on the WAN (GRE, SD-WAN), and Module 11 returns to them.`)}
${K.mistake(`Adding a leaf-to-leaf cable &ldquo;for extra redundancy&rdquo;. OSPF prefers its cost-2 path over the spines (cost 3), so that pair's traffic leaves the fabric and squeezes onto one link, and those two leaves are now a different distance apart from everyone else. Redundancy comes from more spines, never side links.`)}

<h3>Hands-on: the data-centre fabric that grew a shortcut</h3>
${K.bench((()=>{
  const SSH = h => ["hostname "+h,"ip domain name dc.example.com","username fabric privilege 15 secret Dc-Lab-2026","line vty 0 4","login local","transport input ssh","exit"];
  const run = (e, cmds) => { e.exec("en"); e.exec("conf t"); for (const c of cmds) e.exec(c); e.exec("end"); e.exec("conf t"); e.exec("crypto key generate rsa modulus 2048"); e.exec(""); e.exec("end"); e.history.length = 0; };
  const link = (ifn, desc, ip) => ["interface "+ifn,"description "+desc,"no switchport","ip address "+ip+" 255.255.255.252","ip ospf network point-to-point"];
  const spine = s => e => run(e, [...SSH("DC-SPINE"+s),"ip routing","interface loopback0","ip address 10.255.0."+s+" 255.255.255.255",
    ...[1,2,3].flatMap(l=>link("g0/"+l,"TO DC-LEAF"+l+" G0/"+s,"10.21."+s+l+".1")),
    "router ospf 1","router-id 10.255.0."+s,"network 10.0.0.0 0.255.255.255 area 0","exit"]);
  const leaf = (l, extra) => e => run(e, [...SSH("DC-LEAF"+l),"ip routing","interface loopback0","ip address 10.255.0.1"+l+" 255.255.255.255",
    ...[1,2].flatMap(s=>link("g0/"+s,"TO DC-SPINE"+s+" G0/"+l,"10.21."+s+l+".2")),
    "interface g0/5","description SERVERS","no switchport","ip address 10.20."+l+".1 255.255.255.0", ...(extra||[]),
    "router ospf 1","router-id 10.255.0.1"+l,"network 10.0.0.0 0.255.255.255 area 0","passive-interface g0/5","exit"]);
  const H = (B, id, re) => ((B.devs[id].env||{}).history||[]).filter(h=>re.test(h)).length;
  const RT = /^\s*sh\S*\s+ip\s+ro/i, NB = /^\s*sh\S*\s+ip\s+ospf\s+nei/i;
  const paths = (B, p) => { const r = Bench.route(B,"lf1",p); return r ? r.via.length : 0; };
  return {id:"m10-spineleaf", points:110, from:"CCNA · Module 10 · lesson 1", title:"Payments data centre: find the shortcut, restore ECMP, lose a spine", viewBox:"0 0 960 560", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Since the weekend works, payment API calls from API-1 to DB-1 are fast but those to RISK-1 vary, and the link monitor shows one DC-LEAF1 port much busier than the others.&rdquo; Two spines, three leaves, every link routed with OSPF point-to-point; each server's gateway is its leaf (10.20.<i>leaf</i>.1). Work from <b>API-1</b>: ping, tracert, and <code>ssh -l fabric &lt;loopback&gt;</code> (password <code>Dc-Lab-2026</code>, a lab example; privilege 15). Loopbacks: DC-SPINE1 10.255.0.1, DC-SPINE2 .2, DC-LEAF1 .11, DC-LEAF2 .12, DC-LEAF3 .13. Every lab link is 1 Gb/s (OSPF cost 1; real fabrics use 10–100 Gb/s), and the lab always forwards on the first equal path, where a real switch hashes each flow onto one of them.",
  devices:[
    {id:"sp1", kind:"switch", label:"DC-SPINE1", model:"Catalyst 9500", x:20, y:10, config:spine(1)},
    {id:"sp2", kind:"switch", label:"DC-SPINE2", model:"Catalyst 9500", x:520, y:10, config:spine(2)},
    {id:"lf1", kind:"switch", label:"DC-LEAF1", model:"Catalyst 9300", x:20, y:190, config:leaf(1, link("g0/3","LEAF2 BACKUP LINK","10.21.99.1"))},
    {id:"lf2", kind:"switch", label:"DC-LEAF2", model:"Catalyst 9300", x:520, y:190, config:leaf(2, link("g0/3","LEAF1 BACKUP LINK","10.21.99.2"))},
    {id:"lf3", kind:"switch", label:"DC-LEAF3", model:"Catalyst 9300", x:270, y:360, config:leaf(3)},
    {id:"sa", kind:"server", label:"API-1", x:60, y:440, ip:"10.20.1.10", mask:"255.255.255.0", gw:"10.20.1.1"},
    {id:"sb", kind:"server", label:"DB-1", x:800, y:330, ip:"10.20.2.10", mask:"255.255.255.0", gw:"10.20.2.1"},
    {id:"sc", kind:"server", label:"RISK-1", x:560, y:455, ip:"10.20.3.10", mask:"255.255.255.0", gw:"10.20.3.1"} ],
  cables:[ ...[1,2].flatMap(s=>[1,2,3].map(l=>({type:"cat6", a:"sp"+s+":g"+l, b:"lf"+l+":g"+s}))),
    {type:"cat6",a:"lf1:g3",b:"lf2:g3"},
    {type:"cat6",a:"sa:eth",b:"lf1:g5"},{type:"cat6",a:"sb:eth",b:"lf2:g5"},{type:"cat6",a:"sc:eth",b:"lf3:g5"} ],
  tray:["cat6"],
  tasks:[
    {text:"Measure first. On API-1, <code>tracert 10.20.2.10</code> (DB-1) and <code>tracert 10.20.3.10</code> (RISK-1). In a correct fabric both would look the same. Do they?", done:B=>Bench.traced(B,"sa","10.20.2.10") && Bench.traced(B,"sa","10.20.3.10")},
    {text:"<code>ssh -l fabric 10.255.0.11</code> to DC-LEAF1: <code>show ip ospf neighbor</code> and <code>show ip route ospf</code>. How many neighbours should a leaf have in a two-spine fabric? Which neighbour's router ID belongs to a <i>leaf</i>, and what does that do to the route to 10.20.2.0/24?", done:B=>H(B,"lf1",NB)>0 && H(B,"lf1",RT)>0},
    {text:"Find the cable: on DC-LEAF1 run <code>show interfaces status</code> and read the descriptions. Then remove the leaf-to-leaf cable between DC-LEAF1 Gi0/3 and DC-LEAF2 Gi0/3 (unplug it on the bench).", done:B=>H(B,"lf1",/^\s*sh\S*\s+int\S*\s+stat/i)>0 && !Bench.linked(B,"lf1:g3","lf2:g3")},
    {text:"Prove the fabric is a fabric again: on DC-LEAF1, <code>show ip route ospf</code> again (how many paths to 10.20.2.0/24 now, and at what cost?), then <code>exit</code> and <code>tracert 10.20.2.10</code> from API-1 once more.", done:B=>!Bench.linked(B,"lf1:g3","lf2:g3") && paths(B,"10.20.2.0/24")===2 && H(B,"lf1",RT)>=2},
    {text:"Lose a spine. Power off <b>DC-SPINE1</b>. From API-1, <code>ping 10.20.2.10</code> and <code>ping 10.20.3.10</code>, then SSH to DC-LEAF1 and <code>show ip route ospf</code>. What did the fabric lose: servers, or paths?", done:B=>B.devs.sp1.on===false && !Bench.linked(B,"lf1:g3","lf2:g3") && Bench.pingedNow(B,"sa","10.20.2.10") && Bench.pingedNow(B,"sa","10.20.3.10") && paths(B,"10.20.3.0/24")===1 && H(B,"lf1",RT)>=3},
    {text:"Restore: power DC-SPINE1 back on. On DC-LEAF1, <code>show ip ospf neighbor</code>: two neighbours, both spines, both <code>FULL/  -</code>, and ECMP back for every server subnet.", done:B=>B.devs.sp1.on!==false && !Bench.linked(B,"lf1:g3","lf2:g3") && Bench.ospfNbrCount(B,"lf1")===2 && paths(B,"10.20.3.0/24")===2 && Bench.logged(B,"lf1",/Nbr 10\.255\.0\.1 on \S+ from FULL to DOWN/) && H(B,"lf1",NB)>=2},
  ],
  win:"The &ldquo;backup link&rdquo; was the fault. OSPF preferred its cost-2 path, so DB-1's traffic left DC-LEAF1 on one side link instead of two spines, and API-1 reached DB-1 in fewer hops than it reached RISK-1. With the cable gone, every remote server subnet is [110/3] through both spines again: one neighbour per spine, equal paths, the same distance for every pair. Losing a whole spine cost half the paths and no servers. That is the redundancy spine-leaf is designed to give.",
  solve:[["pc","sa","tracert 10.20.2.10"],["pc","sa","tracert 10.20.3.10"],
    ["pc","sa","ssh -l fabric 10.255.0.11"],["pc","sa","Dc-Lab-2026"],["pc","sa","show ip ospf neighbor"],["pc","sa","show ip route ospf"],["pc","sa","show interfaces status"],
    ["unplug","lf1:g3"],["pc","sa","show ip route ospf"],["pc","sa","exit"],["pc","sa","tracert 10.20.2.10"],
    ["power","sp1",false],["pc","sa","ping 10.20.2.10"],["pc","sa","ping 10.20.3.10"],
    ["pc","sa","ssh -l fabric 10.255.0.11"],["pc","sa","Dc-Lab-2026"],["pc","sa","show ip route ospf"],["pc","sa","exit"],
    ["power","sp1",true],["pc","sa","ssh -l fabric 10.255.0.11"],["pc","sa","Dc-Lab-2026"],["pc","sa","show ip ospf neighbor"],["pc","sa","exit"]]}; })())}
${K.hint(`Task 1: DB-1 is three lines, RISK-1 four. Task 2: router ID 10.255.0.12 is DC-LEAF2, a leaf talking straight to a leaf; 10.20.2.0/24 is [110/2] with one path on Gi0/3.`)}
${K.check({q:"A fabric has 4 spines and 16 leaves, cabled correctly. How many equal-cost paths does a leaf have to a server subnet on another leaf, and how many cables join spines to leaves?", o:["4 paths; 64 cables","16 paths; 64 cables","4 paths; 120 cables","1 path; 20 cables"], a:0, why:"There is one path through each spine, so 4 paths. Cables are leaves × spines = 16 × 4 = 64. 120 is the full-mesh formula 16 × 15 ÷ 2, which doesn't apply: leaves never connect to each other."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Port Harcourt telco is building a fabric with 3 spines and 10 leaves. Each leaf has 48 server ports at 10 Gb/s and one 40 Gb/s uplink to each spine. Work out the design numbers.", fields:[{label:"Spine-to-leaf cables", a:["30"]},{label:"Leaf oversubscription (as N:1)", a:["4:1","4","4 : 1","4 to 1"]},{label:"Equal paths between two leaves after one spine fails", a:["2","two"]}], why:"1. What is asked? Cable count, the leaf ratio and the paths left after a failure. 2. Which rules? Cables = leaves × spines; oversubscription = downlink bandwidth ÷ uplink bandwidth; one path per surviving spine. 3. Apply it: 10 × 3 = 30 cables. Down 48 × 10 = 480 Gb/s, up 3 × 40 = 120 Gb/s, 480 ÷ 120 = 4:1. One spine down leaves 2 spines, so 2 equal paths, and the uplink capacity falls to 80 Gb/s (6:1) until the spine is replaced."})}

<h2>SOHO, on-premises and cloud: where your network ends</h2>
<h3>SOHO: a whole network in one box</h3>
${K.remember(`<b>The rule:</b> a SOHO router does every layer's job in one box: modem, router, NAT, DHCP, DNS forwarder, firewall, switch and Wi-Fi. It is cheap and simple, and every one of those jobs is a single point of failure.`)}
<p>A ${K.g("SOHO","Small office / home office: a network for a home or a few users, usually built around one all-in-one router.")} network is the smallest architecture on the list, and you have now configured every function inside the box separately:</p>
${K.svg("0 0 760 260",
  K.dev("cloud",60,120,"ISP","fibre · DSL · 4G")+
  K.box(150,26,460,206,"","")+K.band(150,26,460,26,"ONE SOHO ROUTER — SIX JOBS")+
  K.box(166,68,134,46,"Modem / ONT","the ISP's line")+K.box(313,68,134,46,"Router + NAT/PAT","Module 7")+K.box(460,68,134,46,"Firewall","stateful, basic")+
  K.box(166,150,134,46,"DHCP + DNS","pool, forwarder")+K.box(313,150,134,46,"4-port switch","one VLAN, usually")+K.box(460,150,134,46,"Wi-Fi AP","autonomous (M9)")+
  K.link(84,120,150,120)+K.arrow(300,91,313,91)+K.arrow(447,91,460,91)+
  K.link(610,96,660,70)+K.link(610,150,660,150)+K.link(610,200,660,222,"",true)+
  K.dev("laptop",690,62)+K.dev("pc",690,146)+K.dev("phone",690,222)+
  K.txt(380,252,"Cheap, one web page to manage — and every box inside is a single point of failure.",{mid:true,s:10,f:"body"}),
  "The jobs inside a typical SOHO router. Each was a separate device or configuration earlier in the course.")}
<p>For a home worker or a three-person office this is the right answer, within its limits: one box, one ISP line, few ports. A small branch (a bank agency, a pharmacy) sits one step up: a separate router or firewall, a small PoE switch with VLANs, an AP or two, and a 4G backup on a floating static route (Module 5). Lesson 2 compares the lines.</p>
<h3>On-premises, cloud and hybrid</h3>
${K.remember(`<b>The rule:</b> ask <b>where the workload runs</b> and <b>who owns the hardware under it</b>. Your building, your hardware: on-premises. A provider's data centre, rented and metered: cloud. Both, joined by a link you design: hybrid. The network team always owns the path.`)}
<p>${K.g("On-premises","The organisation owns and runs the servers and network in its own building or data centre. Often shortened to on-prem.")} means your racks, power, cooling, spares and staff, paid mostly as ${K.g("CapEx","Capital expenditure: buying equipment up front and owning it for years.")}. Cloud means renting computing, storage and networking from a provider's data centre, paid as ${K.g("OpEx","Operating expenditure: paying regularly, for example monthly, for what you use, with no equipment to own.")}. Lesson 7 defines cloud properly (NIST, and models such as ${K.g("SaaS","Software as a service: renting a finished application.")} and ${K.g("IaaS","Infrastructure as a service: renting virtual servers.")}); here the question is what each choice does to the <b>topology</b>.</p>
<div class="tablewrap"><table>
<tr><th></th><th>On-premises</th><th>Public cloud</th><th>Hybrid</th></tr>
<tr><td><b>Where it runs</b></td><td>Your server room or data centre (or your own racks in a colocation hall)</td><td>The provider's data centre, in a region you choose</td><td>Both</td></tr>
<tr><td><b>Cost model</b></td><td>CapEx</td><td>OpEx, often billed in US dollars</td><td>Both</td></tr>
<tr><td><b>How users reach it</b></td><td>Your LAN and WAN</td><td>The internet, a VPN, or a private connection</td><td>All of these, plus the link between the two sides</td></tr>
<tr><td><b>Network work that remains</b></td><td>Everything: campus, fabric, WAN, security</td><td>The path there, addressing that doesn't overlap, DNS, security policy</td><td>All of it, and the link in the middle becomes critical</td></tr>
</table></div>
${K.svg("0 0 760 290",
  K.box(16,30,270,160,"","")+K.band(16,30,270,24,"ON-PREMISES · HQ data centre")+
  K.dev("switch",90,96,"spine-leaf")+K.dev("server",200,100,"core banking")+K.txt(151,176,"you own it: CapEx, power, staff",{mid:true,s:10,f:"body"})+
  K.box(474,30,270,160,"","")+K.band(474,30,270,24,"PUBLIC CLOUD · provider region")+
  K.dev("cloud",560,98,"HR (SaaS)")+K.dev("server",670,100,"backups (IaaS)")+K.txt(609,176,"you rent it: OpEx, metered",{mid:true,s:10,f:"body"})+
  K.arrow(286,96,474,96,"VPN or private link",true)+K.arrow(474,124,286,124)+K.txt(380,142,"lessons 3 and 7",{mid:true,s:10})+
  K.dev("router",380,236,"KANO BRANCH","two-tier or SOHO")+
  K.link(356,226,200,190,"WAN (lesson 2)")+K.link(404,226,560,190,"internet",true)+
  K.txt(470,240,"SaaS traffic can go",{s:10})+K.txt(470,254,"straight to the internet",{s:10}),
  "A hybrid company. The cloud is one more site on the WAN diagram, with its own link to design. Once applications move to SaaS, branch traffic may skip head office entirely.")}
<p>Three topology effects catch teams out. The <b>link to the cloud</b> becomes as important as the link to head office: redundancy, monitoring, capacity. The <b>traffic changes direction</b>: once HR is SaaS, a Kano user's traffic belongs on the internet, and routing it via Lagos wastes WAN capacity (lesson 4's SD-WAN is built for this). And <b>addresses must not overlap</b>: a cloud network numbered 10.10.0.0/16, the same as head office, can't be joined by a simple route (lessons 6 and 7).</p>
${K.check({q:"A company keeps its own servers in racks it rents inside a third party's data-centre building, and its own staff run them. Which description fits best?", o:["Public cloud, because the building belongs to someone else","On-premises style (colocation): the company owns and runs the hardware, it is only renting the space, power and cooling","SaaS, because the company doesn't own the building","Hybrid, because two companies are involved"], a:1, why:"The deciding question is who owns and runs the hardware under the workload. In colocation the company still buys, configures and replaces its servers and switches, so it carries the CapEx and the work. What it rents is the floor space, power and cooling. Public cloud means renting the computing itself from a provider's pool."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"An Abuja hospital moves its patient-records application from its own server room to virtual machines in a public cloud. Which three jobs still belong to the hospital's network team? (Choose three.)", o:["Designing a redundant connection from the hospital to the cloud (VPN or private link)","Replacing failed disks in the provider's storage arrays","Choosing cloud network addressing that doesn't overlap the hospital's 10.0.0.0/8 plan","Cooling the provider's data hall","Making sure DNS names and security rules let clinicians reach the application","Buying the provider's spine switches"], a:[0,2,4], why:"1. What is asked? Which network work survives a move to the cloud. 2. Which rule? The provider owns the hardware under the workload; the customer still owns the path to it, its addressing, name resolution and access policy. 3. Apply it: the link, non-overlapping addresses and DNS and security stay with the hospital. Disks, cooling and the provider's fabric belong to the provider."})}

<h2>Reading a topology and choosing an architecture</h2>
<p>Exams ask you to name an architecture; jobs hand you a drawing, configurations or requirements and ask whether the design is right. The same five questions answer both.</p>
${K.steps([
  ["Where do things attach?", "Users and phones on access switches, servers on leaves, a whole office on one box. This tells you whether you are looking at a campus, a data centre or a SOHO."],
  ["How many switching layers between an endpoint and the exit?", "One pair above access: two-tier. Distribution and then core: three-tier. Leaf, then spine, then leaf: spine-leaf."],
  ["Where does Layer 2 end?", "Find the gateways: SVIs with HSRP (distribution or collapsed core), routed access, or every link routed (a fabric)."],
  ["What is redundant, and what isn't?", "Count uplinks, power supplies, providers and cores. Anything single is a SPOF, whatever the document claims."],
  ["Which way does the traffic flow?", "North-south to users and the internet, east-west between servers, or out to SaaS and the cloud. The traffic decides the shape."],
])}
${K.when([
  ["SOHO router","A home or a few users","Cheapest: one box does every job","Uptime matters, or more than a few ports or one floor"],
  ["Two-tier","One building; up to a few hundred users","Redundant gateways without a separate core","About three or more buildings"],
  ["Three-tier","Several buildings, a distribution pair each","Routed core: failure domain per building, predictable growth","One building: the core joins almost nothing"],
  ["Spine-leaf","A data centre with mostly server-to-server traffic","Equal paths, same distance between any two servers","A dozen servers, where one switch pair is enough"],
  ["On-premises","Data that must stay home, steady load, staff to run it","Full control, known cost","Load swings a lot, or nobody to run hardware"],
  ["Cloud / hybrid","Variable load, fast growth, SaaS users, disaster recovery","Capacity in minutes, paid as used","The cloud link can't be made reliable, or foreign-currency bills are a problem"],
], "Which architecture? Match it to the requirement, not the fashion")}
${K.case("One payments company, every architecture on the list", `
<p><b>The company:</b> a Lagos payments processor: an Ikeja head office (three buildings on one compound, 900 staff), a Port Harcourt office (one building, 140 staff), 60 market kiosks, a small data centre at head office, and cloud plans. Regulators expect transaction data to stay under the company's control.</p>
<p><b>Head office: three-tier.</b> A distribution pair per building; two cores in different buildings on separate fibre routes, routed links to every pair. A storm in the call centre ends at its SVIs. <i>Rejected:</i> one collapsed core for all three buildings, which would stretch VLANs and make the compound one failure domain.</p>
<p><b>Port Harcourt: two-tier.</b> One building: a collapsed core with per-VLAN STP/HSRP alignment and routed links to the WAN edge. The audit you ran on the bench caught the single-homed access switch.</p>
<p><b>Kiosks: SOHO-style.</b> One 4G router with Wi-Fi and a tablet each, a backup mobile line from a second network, everything to head office over a VPN (lesson 3). <i>Rejected:</i> a switch and an AP per market stall.</p>
<p><b>Data centre: small spine-leaf.</b> Two spines, four leaves: the payment API, fraud scoring and database talk constantly (east-west), and a fraud check must take the same time in any rack. <i>Rejected:</i> three-tier, where some server pairs were one switch apart and others five.</p>
<p><b>Cloud: hybrid.</b> HR and email to SaaS; backups and disaster-recovery copies to IaaS over a redundant VPN pair (lesson 7); transactions stay on-premises for the regulator. SaaS traffic from branches is one reason the next WAN refresh is SD-WAN (lesson 4).</p>
<p><b>The lesson:</b> no architecture is &ldquo;best&rdquo;; each part got the shape its traffic, size and risk called for.</p>`)}
${K.myth([
  ["Spine-leaf is just three-tier with new names.","Spine-leaf has two layers in total, every leaf linked to every spine, all links routed and in use, and the same distance between any two leaves."],
  ["Two uplinks on an access switch double its bandwidth.","Not for one VLAN in a Layer 2 design: STP blocks one per VLAN. Both carry traffic only if you split VLANs between the cores, route at access, or use cores that act as one switch (a stack or StackWise Virtual)."],
  ["A collapsed core has no distribution layer.","It does every distribution job; the jobs moved into the core switches."],
  ["Moving to the cloud means less network work.","The servers go; the path, addressing, DNS and security stay, and the cloud link becomes critical."],
])}
${K.dodont([
  "Decide where Layer 2 ends before you draw anything else.",
  "Make each VLAN's STP root and HSRP Active the same switch, with preempt, and split VLANs between the pair.",
  "Use routed point-to-point links above distribution and between leaves and spines.",
  "Audit every access switch for a second uplink and every leaf for one link per spine.",
  "Treat the cloud as a site: redundant link, capacity plan, non-overlapping addresses.",
],[
  "Don't stretch VLANs between buildings &ldquo;because it's easy&rdquo;: you are joining failure domains.",
  "Don't count a blocked uplink as bandwidth.",
  "Don't cable leaf to leaf, or spine to spine, for &ldquo;extra redundancy&rdquo;.",
  "Don't put ACLs and heavy features in the core.",
  "Don't let a handover document replace <code>show</code> commands.",
])}
${K.exam(`Underline the clue words before you read the options. &ldquo;Single building&rdquo;, &ldquo;combines core and distribution&rdquo; → two-tier / collapsed core. &ldquo;Several buildings&rdquo;, &ldquo;scalable backbone&rdquo; → three-tier. &ldquo;Data centre&rdquo;, &ldquo;east-west&rdquo;, &ldquo;predictable latency&rdquo;, &ldquo;every leaf to every spine&rdquo; → spine-leaf. &ldquo;One device&rdquo;, &ldquo;home or small office&rdquo; → SOHO. &ldquo;Provider's data centre&rdquo;, &ldquo;pay as you use&rdquo; → cloud. Traps: &ldquo;collapsed core merges access and distribution&rdquo;, &ldquo;leaves connect to each other&rdquo;, &ldquo;servers connect to spines&rdquo; (all false). These architectures are objective 1.2 of CCNA 200-301 v1.1 (until 2 February 2027); the v2.0 list no longer names them, but job interviews still do.`)}
${K.check({q:"A design description says: 'Servers connect to top-of-rack switches; each top-of-rack switch has one routed uplink to each of four aggregation switches; aggregation switches have no links to each other.' Which architecture is it, whatever the vendor calls the switches?", o:["Three-tier, because there are aggregation switches","Spine-leaf: the top-of-rack switches are leaves, the aggregation switches are spines","A collapsed core, because there are only two layers","A full mesh"], a:1, why:"Ignore the names and apply the rules: endpoints on the lower layer, every lower switch linked to every upper switch, no links within a layer. That is spine-leaf. Names such as top-of-rack, aggregation or fabric switch vary by vendor; the wiring rules don't."})}
<h3>Same logic, new situation</h3>
<p>A university in Ibadan plans a five-storey engineering block (one building, 350 users, PoE phones), a research cluster of 120 compute servers that swap huge data sets with each other during jobs, a student-union shop with two tills and a card reader, and a timetable system it would rather not run on its own servers. Name the architecture for each, with a one-line reason.</p>
${K.hint(`Ask the five questions for each part. For the research cluster, the traffic direction is the giveaway.`)}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> An architecture per part, with a reason. <b>2. Which rule?</b> Match the shape to size, traffic direction and risk. <b>3. Apply it:</b> <b>Engineering block → two-tier</b>: one building, a few hundred users; a redundant pair does the distribution job and uplinks to the campus core. <b>Research cluster → spine-leaf</b>: east-west traffic, and jobs need the same bandwidth and distance between any two nodes. <b>Shop → SOHO-style</b>: three devices, one small router with a backup line (or a separate VLAN on the nearest campus switch). <b>Timetable → cloud</b>: nobody wants to run the servers and load peaks twice a year, so the university becomes hybrid and its internet link becomes the path to a critical service.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Name the layers that were merged, then the protocols: dual uplinks, STP root and HSRP Active aligned per VLAN with preempt, EtherChannel between the cores, routed uplinks, and how you test it.`)}
${K.reveal("&ldquo;Walk me through a two-tier campus. How do you make it redundant, and how do you prove it?&rdquo;", `<p>"In a collapsed core the distribution and core jobs share one switch pair. Every access switch has an uplink to each core; the cores are joined by an LACP EtherChannel and have routed OSPF uplinks to the edge, which sees two equal paths. Per VLAN, one core is both STP root and HSRP Active with preempt, and I split the VLANs so both uplinks carry traffic. To prove it I check <code>show spanning-tree</code> on the access switches and <code>show standby brief</code> on the cores, then in a change window I take a core down and test from user PCs: alternate ports take over, the other core goes Active within the hold time, and traffic keeps flowing."</p>`)}
${K.hint(`Contrast STP blocking with routed links and ECMP; mention one path per spine, the same hop count, and what a spine failure costs.`)}
${K.reveal("&ldquo;How does spine-leaf use all its links when Spanning Tree would block some of them?&rdquo;", `<p>"Leaf-spine links are routed point-to-point links, not trunks, so there is no Layer 2 loop for Spanning Tree to break. Each leaf runs OSPF or BGP with every spine and advertises its server subnets. Because every leaf connects to every spine the same way, a remote leaf's subnet has one equal-cost path per spine, and ECMP spreads flows across them all. Any two servers on different leaves are leaf, spine, leaf apart; losing a spine costs one path in N, not connectivity. If VMs must keep their subnet across racks, an overlay runs on top of that routed underlay."</p>`)}
${K.hint(`Turn it into the two questions: where the workload runs and who owns the hardware. Then the things the network team still owns.`)}
${K.reveal("&ldquo;On-premises, cloud or hybrid: how would you decide for a new application, and what does the network team still own?&rdquo;", `<p>"I start with the requirements: where the data may live, how steady the load is, how fast it grows, and who would run the hardware. Steady load, strict data rules and an existing data centre point on-premises; spiky load, fast growth or no staff point to the cloud; most organisations end up hybrid. Either way the network team owns the path: a redundant VPN or private connection and its capacity, non-overlapping addressing, DNS and security policy. And I check the traffic flow, because branch SaaS traffic may be better sent straight to the internet than through head office."</p>`)}

${K.recap([
  "Each campus layer is a job: access attaches and protects; distribution ends Layer 2 (SVIs, HSRP, STP root, ACLs); the core only routes between blocks.",
  "The Layer 2/Layer 3 boundary at distribution keeps each building's failure domain inside that building.",
  "Oversubscription = downlink bandwidth ÷ uplink bandwidth that really forwards; STP blocks one uplink per VLAN.",
  "Collapsed core: dual-homed access switches; per VLAN the same core is STP root and HSRP Active with preempt; VLANs split; EtherChannel between cores; routed links up.",
  "Spine-leaf: every leaf to every spine, all routed; one equal path per spine (ECMP); never leaf to leaf.",
  "A SOHO router is a whole network in one box, and a single point of failure for every job.",
  "On-premises vs cloud = where the workload runs and who owns the hardware; the network team still owns the path, addressing, DNS and security.",
  "Read any design with five questions: attach, layers, where Layer 2 ends, redundancy, traffic flow.",
])}
${K.next(`<b>Lesson 2 — WAN technologies.</b> This lesson's architectures are islands; the WAN joins them: leased lines, Metro Ethernet, MPLS and the provider's routers, broadband, 4G/5G and satellite, and the WAN shapes (hub-and-spoke, mesh, dual-homed) you choose between.`)}
`,
quiz:[
  {lvl:1, q:"A single-building office has eight access switches. Each has one uplink to each of two switches that route between the VLANs, act as HSRP gateways and connect to the WAN edge router. Which architecture is this?", o:["Three-tier campus","Two-tier (collapsed core)","Spine-leaf","SOHO"], a:1, why:"Two switching layers in a single building, with the upper pair doing both the distribution job (gateways, routing between VLANs) and the core job (the connection upwards), is a collapsed core. Three-tier would have a separate core above distribution pairs; spine-leaf is a data-centre design; SOHO is one all-in-one box."},
  {lvl:1, q:"In a three-tier campus with Layer 2 access switches, where is the Layer 2/Layer 3 boundary normally placed?", o:["At the access layer","At the distribution layer","At the core layer","At the internet edge"], a:1, why:"The distribution switches hold the SVIs (the VLANs' gateways, usually shared with HSRP), so frames from the access layer become routed packets there. Keeping Layer 2 below distribution limits each broadcast domain and any STP problem to one building block."},
  {lvl:1, type:"match", q:"Match each set of features with the place in a design where it belongs.", pairs:[["PortFast, BPDU guard and port security on user ports","Access layer"],["SVIs with HSRP groups and the STP root for each VLAN","Distribution layer"],["Routed point-to-point links and OSPF only, minimal policy","Core layer"],["NAT/PAT, a DHCP pool, a small switch and Wi-Fi in one device","SOHO router"]], why:"Access attaches and protects endpoints; distribution ends Layer 2 and provides gateways and policy; the core only moves packets between distribution blocks; a SOHO router does all of these jobs in one box."},
  {lvl:1, q:"In a spine-leaf data centre, where do servers, storage and firewalls connect?", o:["To the spine switches","To the leaf switches","To both a spine and a leaf","Directly to each other"], a:1, why:"Endpoints attach only to leaves. Spines connect only to leaves, so any two leaves are one spine apart and every server-to-server path has the same length."},
  {lvl:1, type:"fill", q:"Fill in the two cost models.", fields:[{label:"Buying servers up front and owning them for years", a:["CapEx","capex","capital expenditure","capital expense","capital expenses"]},{label:"Paying monthly for the cloud resources you use", a:["OpEx","opex","operating expenditure","operational expenditure","operating expense","operating expenses"]}], why:"On-premises equipment is mostly capital expenditure (CapEx): a large purchase you own and depreciate. Cloud is mostly operating expenditure (OpEx): a regular, metered bill with no equipment to own."},
  {lvl:2, q:"Based on the exhibit from a collapsed-core office, what is the problem?", ex:"ACC2#show spanning-tree vlan 20 | begin Interface\nInterface           Role Sts Cost      Prio.Nbr Type\n------------------- ---- --- --------- -------- ----------------\nGi0/1               Altn BLK 4         128.1    P2p\nGi0/2               Root FWD 4         128.2    P2p\n\n(Gi0/1 goes to CORE1, Gi0/2 goes to CORE2)\n\nCORE1#show standby brief\nInterface   Grp  Pri P State   Active          Standby         Virtual IP\nVl20        20   110   Active  local           10.40.20.3      10.40.20.1", o:["VLAN 20 frames go up to CORE2 (the STP root), but CORE1 is the HSRP Active gateway, so every VLAN 20 frame crosses the inter-core link before it is routed","ACC2 has lost its uplink to CORE1","HSRP group 20 has no virtual IP","CORE2 cannot route because it is the STP root"], a:0, why:"ACC2's root port for VLAN 20 (Gi0/2) leads to CORE2, so CORE2 is the root, while CORE1 is Active for group 20. Root and gateway are on different switches, so frames detour over the inter-core link. Fix by aligning them: make CORE2 Active for group 20 (higher priority with preempt) or move the VLAN 20 root to CORE1. Gi0/1 is an alternate port: up and blocking, not lost."},
  {lvl:2, type:"fill", q:"An access switch has 24 user ports at 1 Gb/s and two 1 Gb/s uplinks, one to each core. Write each oversubscription ratio as N:1.", fields:[{label:"For one VLAN, with STP blocking one uplink", a:["24:1","24","24 : 1","24 to 1"]},{label:"For the whole switch, if VLANs are split so both uplinks forward", a:["12:1","12","12 : 1","12 to 1"]}], why:"Downlinks 24 × 1 = 24 Gb/s. For one VLAN only one 1 Gb/s uplink forwards: 24 ÷ 1 = 24:1. With per-VLAN load sharing both uplinks carry traffic for the switch as a whole: 24 ÷ 2 = 12:1. Either way this switch's uplinks are thin; 10 Gb/s uplinks would be the usual fix."},
  {lvl:2, type:"multi", q:"Which two statements about a correctly built spine-leaf fabric are true? (Choose two.)", o:["Traffic between servers on different leaves crosses exactly one spine","Adding a spine adds one more equal-cost path between every pair of leaves","Spines are linked to each other so that a spine failure can be bypassed","Spanning Tree blocks all but one spine for each VLAN","Each leaf links to one spine and to the neighbouring leaves"], a:[0,1], why:"Every leaf links to every spine and to nothing else, so leaf-to-leaf traffic always crosses one spine, and each spine is one more equal path that ECMP can use. There are no spine-to-spine or leaf-to-leaf links, and with routed links there is no Spanning Tree between the switches."},
  {lvl:2, type:"order", q:"In a collapsed core where CORE1 is STP root and HSRP Active for VLAN 10, put the path of a packet from a VLAN 10 PC to a server behind the WAN edge router in order.", items:["The PC sends the frame to the HSRP virtual MAC of its gateway","The access switch forwards it up its root port towards CORE1","CORE1's SVI for VLAN 10 receives it and routes the packet","CORE1 sends it out of its routed link to the WAN edge router","The WAN edge router forwards it towards the server"], why:"Layer 2 first: the PC's frame goes to the gateway's virtual MAC, and the access switch sends it along its STP root port. Root and Active are the same switch, so CORE1 routes it at once and sends it up its routed /30. Above the core everything is routed."},
  {lvl:2, q:"Based on the exhibit from a leaf in a two-spine fabric, what is wrong?", ex:"LEAF1#show ip route ospf | begin Gateway\nGateway of last resort is not set\n\n      10.0.0.0/8 is variably subnetted, 19 subnets, 3 masks\nO        10.20.2.0/24 [110/2] via 10.21.99.2, 00:40:17, GigabitEthernet0/3\nO        10.20.3.0/24 [110/3] via 10.21.11.1, 00:32:48, GigabitEthernet0/1\n                      [110/3] via 10.21.21.1, 00:32:48, GigabitEthernet0/2", o:["A direct link from LEAF1 to another leaf gives that leaf's subnet a shorter, single path, so its traffic no longer uses the spines","One spine is down, so 10.20.3.0/24 has fewer paths","ECMP is disabled, because 10.20.3.0/24 shows two lines","OSPF has failed on Gi0/1"], a:0, why:"In a correct fabric every remote server subnet has the same cost through every spine. 10.20.3.0/24 does: [110/3] via both spines. 10.20.2.0/24 is [110/2] via one link on Gi0/3, a path two hops long that can only be a leaf-to-leaf cable. It breaks the equal-distance design and squeezes that traffic onto one link. Remove it, and redundancy comes from the spines."},
  {lvl:2, q:"A home worker's ISP router reboots after a power cut. Wi-Fi, internet access and printing to the printer cabled to the same box all stop for three minutes. Which architectural fact explains it?", o:["SOHO routers block printing during NAT","In a SOHO design one device is the modem, router, switch, AP and DHCP server, so it is a single point of failure for every one of those jobs","The printer needed a static route","The ISP's spine-leaf fabric was reconverging"], a:1, why:"A SOHO router combines every function in one box. When it reboots, the Wi-Fi radio, the switch ports the printer uses, DHCP and the internet link all go at once. That is acceptable for a home office and the reason larger sites split the jobs across redundant devices."},
  {lvl:3, q:"A media company's three-tier data centre runs 400 render servers that copy large files between themselves all day. Some server pairs are one switch apart and others five, and engineers see some uplinks idle (blocked by STP) while others are full. What should the next design be, and why?", o:["Spine-leaf with routed links: every pair of servers on different leaves is leaf-spine-leaf apart, and ECMP uses every uplink","A bigger collapsed core, so all servers connect to two large switches","More VLANs, so Spanning Tree blocks fewer links","Move the render servers to SOHO routers"], a:0, why:"The traffic is east-west and the complaints are uneven distance and idle links. Spine-leaf fixes both: every leaf links to every spine, the links are routed so nothing blocks, and every inter-leaf path is the same length. A larger collapsed core can't scale to 400 servers' ports with predictable bandwidth, and extra VLANs only rearrange what STP blocks."},
  {lvl:3, type:"multi", q:"You are reviewing the handover notes in the exhibit for a collapsed-core office. Which three findings must be fixed before sign-off? (Choose three.)", ex:"Handover notes — Benin office (rev 3)\n- ACC1-ACC6: one uplink to CORE1 and one to CORE2\n- ACC7: one uplink to CORE1 (CORE2 port reserved for later)\n- VLAN 10/30: CORE1 STP root and HSRP Active, priority 110, preempt\n- VLAN 20/40: CORE2 STP root; HSRP Active CORE1 (priority 110 on CORE1 for all groups)\n- CORE1-CORE2: 2 x 10G LACP EtherChannel (Po1)\n- CORE1 and CORE2 both plugged into UPS-A; UPS-B not yet installed", o:["ACC7 is single-homed, so CORE1 is a single point of failure for its users","VLANs 20 and 40 have their STP root on CORE2 but their HSRP Active on CORE1, so their traffic detours over Po1","Both cores depend on one UPS","The cores are joined by an LACP EtherChannel","VLANs 10 and 30 use preempt","ACC1 to ACC6 have one uplink to each core"], a:[0,1,2], why:"A single uplink, misaligned root and gateway, and one shared power source are each a real fault: the first and third can take users offline when one thing fails, and the second wastes the inter-core link every day. An LACP bundle between the cores, preempt on the groups, and dual-homed access switches are exactly what the design should have."},
  {lvl:3, q:"After the HR system moved to a SaaS provider, staff at the Kano branch say it is slow. All branch internet traffic is sent over the WAN to Lagos head office and out through its firewall. Head office users say HR is fast. What is the most likely architectural cause?", o:["Kano's traffic to the SaaS provider hair-pins through Lagos, so it crosses the WAN twice and shares the head-office internet link","SaaS applications only work from head office","The Kano access switches are single-homed","Kano needs its own spine-leaf fabric"], a:0, why:"The cloud changed the traffic's direction: HR now lives on the internet, but Kano still reaches the internet through Lagos. Each request crosses the branch WAN link and the head-office internet link and comes back the same way. Sending SaaS traffic from the branch straight to the internet, with security applied locally or in the cloud, is the usual fix and one of the main reasons for SD-WAN (lesson 4)."},
  {lvl:3, type:"fill", q:"A spine model has 64 ports, and each leaf model has 8 uplink ports (one per spine) and 48 server ports. What are the limits of a fabric built from them?", fields:[{label:"Maximum number of leaves", a:["64"]},{label:"Maximum number of spines", a:["8"]},{label:"Maximum number of server ports", a:["3072","3,072","3 072"]}], why:"Each leaf uses one port on every spine, so 64 spine ports allow 64 leaves. Each spine uses one uplink on every leaf, so 8 uplinks allow 8 spines. Server ports = 64 leaves × 48 = 3,072. Beyond that you need bigger spines or another tier of spines, which is a design beyond this lesson."},
],
cards:[
  {f:"The three campus layers as jobs", b:"Access: attach and protect endpoints (VLANs, PoE, PortFast, port security, snooping, DAI). Distribution: end Layer 2 (SVIs, HSRP, STP root, ACLs). Core: route between distribution blocks fast, minimal policy."},
  {f:"Why the Layer 2/Layer 3 boundary sits at distribution", b:"It keeps each building's broadcast domains and STP problems inside that building (its failure domain). Above distribution everything is routed: no loops, no blocked links, OSPF ECMP."},
  {f:"Failure domain", b:"The part of the network one fault can affect. A broadcast storm is limited to its Layer 2 domain; routing stops it spreading further."},
  {f:"Oversubscription", b:"Downlink bandwidth ÷ uplink bandwidth that really forwards. 48 × 1G ports with 2 × 10G uplinks: 4.8:1 for one VLAN (STP blocks one uplink), 2.4:1 for the switch if VLANs are split between the uplinks."},
  {f:"Collapsed core (two-tier) done properly", b:"Each access switch has an uplink to each core; per VLAN, one core is both STP root and HSRP Active with preempt; VLANs split between the cores; LACP EtherChannel between the cores; routed links to the WAN or internet edge."},
  {f:"STP root and HSRP Active misaligned", b:"Frames go up to the root, then cross the inter-core link to the Active gateway before being routed: an extra hop and a busy inter-core link. Often appears after a reboot when preempt is missing."},
  {f:"When to add a third tier", b:"Cisco's rule of thumb: three or more buildings, or four or more distribution pairs. Below that, a separate core connects almost nothing; above it, the core keeps links few and growth predictable."},
  {f:"Spine-leaf in routing terms", b:"Every leaf-spine link is a routed point-to-point link. A remote leaf's subnet has one equal-cost path per spine (e.g. [110/3] via each), so ECMP uses them all. IOS OSPF installs 4 equal paths by default."},
  {f:"Spine-leaf sizing", b:"Max spines = uplinks per leaf; max leaves = ports per spine; server ports = leaves × server ports per leaf; losing one of N spines removes 1/N of the capacity, no servers."},
  {f:"Leaf-to-leaf link", b:"Never. It creates a shorter, unequal path that OSPF prefers (cost 2 vs 3), so that pair stops using the spines. Redundancy comes from more spines."},
  {f:"SOHO router", b:"One box doing modem/ONT, routing with NAT/PAT, DHCP and DNS forwarding, a basic firewall, a small switch and Wi-Fi. Cheap and simple; a single point of failure for every job."},
  {f:"On-premises vs cloud vs hybrid", b:"Where the workload runs and who owns the hardware. On-prem: your building, CapEx, your staff. Cloud: provider's data centre, OpEx, metered. Hybrid: both, joined by a link that becomes critical. The network team still owns the path, addressing, DNS and security."},
  {f:"Five questions to read any design", b:"1. Where do things attach? 2. How many switching layers to the exit? 3. Where does Layer 2 end? 4. What is redundant and what isn't? 5. Which way does the traffic flow?"},
],
});

// ---------- Module 10 · Lesson 2 ----------
L.push({
id:"wan-types", mins:110, level:"Intermediate · builds on Module 1 lesson 4, Module 5 and Module 10 lesson 1",
t:"WAN technologies — leased lines, Metro Ethernet, MPLS VPNs, broadband, 4G/5G and satellite, WAN topologies and how to choose",
html:`
${K.goals([
  "Say, for any WAN service, what the provider hands you (a wire, an Ethernet service or a routed network) and therefore who your routers talk to.",
  "Explain leased lines (E1/T1 arithmetic, serial, HDLC and PPP) as the history behind today's Ethernet private lines.",
  "Tell E-Line, E-LAN and E-Tree apart, and predict the OSPF neighbours each gives you.",
  "Name the CE, PE and P routers in an MPLS Layer 3 VPN and say what each one knows and does with labels.",
  "Compare DSL, cable, fibre (PON), 4G/5G and satellite, calculate why geostationary satellite is slow, and choose a WAN for a real brief.",
])}
${K.pre([
  "Module 1 lesson 4: WAN shapes and n(n − 1) ÷ 2; single-, dual- and multihomed; MPLS, internet VPN and SD-WAN in one sentence each.",
  "Module 5: static and floating static routes, OSPF neighbours, network types, cost and <code>bandwidth</code>, traceroute.",
  "Module 8 lesson 3: IPsec site-to-site and remote-access VPNs (concepts). Module 10 lesson 1: network architectures.",
])}

<h2>Why this matters at work</h2>
<p>A logistics company is opening depots in Kaduna, Benin City and Onne that must reach its Lagos data centre. The procurement team forwards five quotes: a 100 Mb/s E-Line, an MPLS VPN with three classes of service, &ldquo;business fibre broadband&rdquo;, a 4G router with a 200 GB bundle, and VSAT for the port yard. Your manager asks: &ldquo;Which one do we buy, and why is that one four times the price?&rdquo;</p>
<p>Every multi-site organisation faces this, from a Frankfurt bank to a desert mine. Each quote is a <b>different kind of service</b>: a private wire, an Ethernet network, a routed network run by the provider, or only the internet. This lesson takes them one at a time, builds them into topologies and ends with how to choose; two benches change a topology and give a branch a second carrier.</p>

<h2>What you rent: the provider's hand-off and the leased line</h2>
${K.remember(`<b>The rule:</b> ask <b>what the provider hands you</b> at your router's port. <b>A wire</b> (leased line, E-Line): your two routers are neighbours. <b>An Ethernet network</b> (E-LAN): your routers share one subnet. <b>A routed network</b> (MPLS Layer 3 VPN): you peer with the provider's router. <b>The internet</b> (broadband, 4G, satellite): privacy needs your own VPN (lesson 3). The answer decides addressing, neighbours and who you call when it breaks.`)}
<p>A ${K.g("WAN","Wide area network: links joining sites across cities or countries, usually rented.")} link crosses ground you don't own. Where your part ends:</p>
<ul>
<li>${K.g("CPE","Customer premises equipment: the devices at your site that connect to the provider's service.")}: your edge router, plus any modem or box the provider installs.</li>
<li>The ${K.g("demarcation point","Where the provider's responsibility ends and yours begins; often shortened to 'demarc'.")}: the socket or port where the provider's job ends. A fault beyond it is their ticket; before it, yours.</li>
<li>The ${K.g("access circuit","The link from your building to the provider's nearest point of presence. Also called the local loop or last mile.")}: the slowest part to install, and the part a digger cuts.</li>
</ul>
${K.svg("0 0 760 290",
  K.band(10,8,210,24,"YOUR SITE")+K.band(250,8,260,24,"PROVIDER")+K.band(540,8,210,24,"YOUR OTHER SITE")+
  K.dev("router",110,92,"EDGE ROUTER","CPE")+K.dev("router",650,92,"EDGE ROUTER","CPE")+
  K.dev("cloud",380,88,"","")+K.txt(380,140,"provider network",{mid:true,c:"fg",f:"body",s:11})+
  K.link(136,94,352,94)+K.link(408,94,624,94)+
  `<line x1="230" y1="44" x2="230" y2="160" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="530" y1="44" x2="530" y2="160" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="4 3"/>`+
  K.txt(230,176,"demarc",{mid:true,c:"warn",f:"body",s:10.5})+K.txt(530,176,"demarc",{mid:true,c:"warn",f:"body",s:10.5})+
  K.txt(290,116,"access circuit",{mid:true,s:10,f:"body"})+K.txt(470,116,"access circuit",{mid:true,s:10,f:"body"})+
  K.txt(20,208,"What arrives at your router's port decides who your router talks to:",{c:"fg",f:"body",s:11.5,b:true})+
  K.txt(20,230,"• a wire (leased line, E-Line) → the router at your other site is your neighbour",{f:"body",s:11})+
  K.txt(20,248,"• an Ethernet network (E-LAN) → every site's router shares one subnet",{f:"body",s:11})+
  K.txt(20,266,"• a routed network (MPLS L3 VPN) → your neighbour is the provider's edge router",{f:"body",s:11})+
  K.txt(20,284,"• the internet (broadband, 4G, satellite) → you add a VPN for privacy (lesson 3)",{f:"body",s:11}),
  "Every WAN service crosses provider ground. Your responsibility ends at the demarc; the hand-off type decides your routing design.")}
<h3>Leased lines: a private wire, and where serial came from</h3>
<p>A <b>leased line</b> (Module 1) is a private point-to-point circuit. For decades it was built from the telephone network's ${K.g("TDM","Time-division multiplexing: each channel gets a fixed, repeating time slot on one fast line.")} channels, so its speeds are telephone arithmetic. One call is a ${K.g("DS0","Digital signal 0: one 64 kb/s channel, one phone call.")} of 64 kb/s; lines are bundles of them:</p>
${K.steps([
  ["E1 (Europe, Africa, most of the world)", `32 time slots × 64 kb/s = <b>2.048 Mb/s</b>. Slot 0 carries framing, so 30 or 31 slots carry traffic. A Nigerian bank branch in 2005 could run on one ${K.g("E1","The 2.048 Mb/s leased-line rate used outside North America.")}.`],
  ["T1 (North America, Japan)", `24 slots × 64 kb/s = 1.536 Mb/s, plus 8 kb/s of framing = <b>1.544 Mb/s</b>. A ${K.g("T1","The 1.544 Mb/s North American leased-line rate.")} is why Cisco serial interfaces default to <code>BW 1544 Kbit/sec</code>.`],
  ["Fractional lines", "Need 512 kb/s? Rent 8 slots of an E1: 8 × 64 = 512."],
])}
<p>The router side was a ${K.g("serial interface","A router WAN port sending bits one after another over a clocked line; classic leased lines used them.")}, cabled to a ${K.g("CSU/DSU","Channel/data service unit: converts a router's serial signal to the provider's line format and supplies the clock.")}. On top ran one of two Layer 2 protocols. Module 5 met ${K.g("HDLC","High-Level Data Link Control: serial-link framing; Cisco's version, the Cisco serial default, adds a type field.")}, Cisco's default, a proprietary version meant for Cisco-to-Cisco links. ${K.g("PPP","Point-to-Point Protocol (RFC 1661): the open-standard Layer 2 protocol for point-to-point links, with optional authentication.")} is the open standard between any vendors and can authenticate the far end with ${K.g("PAP","Password Authentication Protocol: sends the password in clear text.")} or ${K.g("CHAP","Challenge Handshake Authentication Protocol: proves the password with a hash, never sending it.")}.</p>
${K.out(`R1#show interfaces serial0/0/0
Serial0/0/0 is up, line protocol is up
  Hardware is GT96K Serial
  Internet address is 10.255.1.1/30
  MTU 1500 bytes, BW 1544 Kbit/sec, DLY 20000 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation HDLC, loopback not set
  Keepalive set (10 sec)`, "A classic ISR router's serial interface, trimmed: Cisco HDLC, and the T1 default bandwidth. The lab has no serial ports; this is reference output.")}
<p>With <code>encapsulation ppp</code> on both ends it reads <code>Encapsulation PPP, LCP Open</code>. HDLC on one end and PPP on the other leaves the interface <b>up</b> but the line protocol <b>down</b>: bits arrive, frames aren't understood.</p>
<p>Today new private lines are Ethernet (an E-Line, next section): the same private wire at 100 Mb/s to 10 Gb/s on an Ethernet port. Serial survives in older networks; PPP lives on in broadband (later in this lesson).</p>
${K.dyk(`64 kb/s comes from sampling a phone call 8,000 times a second (twice its 4 kHz top frequency) at 8 bits a sample. Numbers fixed in the 1960s still set a serial interface's default bandwidth.`)}
${K.check({q:"A provider delivers a private point-to-point circuit between two of your offices and hands it off on an Ethernet port at each end. Which routers become OSPF neighbours across it?", o:["Your two edge routers, directly, as if a cable joined them","Your edge router and the provider's router at each end","Nothing: point-to-point circuits can't carry OSPF","Every router in the provider's network along the path"], a:0, why:"A leased line or E-Line hands you a wire. The provider's equipment in the middle is invisible to IP, so your two routers sit on one /30 (or /31) and peer directly."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A mining camp rents a fractional E1 of 12 time slots. What is its speed in kb/s, and the full E1 rate in Mb/s?", fields:[{label:"12-slot fractional E1 (kb/s)", a:["768","768 kb/s","768kbps","768 kbps"]},{label:"Full E1 (Mb/s)", a:["2.048","2.048 Mb/s","2.048mbps","2.048 mbps"]}], why:"1. What is asked? Two TDM rates. 2. Which rule? Every slot is one DS0 of 64 kb/s; an E1 has 32 slots. 3. Apply it: 12 × 64 = 768 kb/s for the fractional line; 32 × 64 = 2,048 kb/s = 2.048 Mb/s for the full E1."})}

<h2>Metro Ethernet: E-Line, E-LAN and E-Tree</h2>
${K.remember(`<b>The rule:</b> the provider builds you a <b>virtual Ethernet</b>, and the <b>service type decides who can send frames to whom</b>, so it decides your subnets and OSPF neighbours. E-Line: like a cable. E-LAN: like one switch. E-Tree: roots talk to leaves, leaves never to each other.`)}
<p>${K.g("Metro Ethernet","A provider service carrying your Ethernet frames between sites; your routers use ordinary Ethernet ports.")} (carrier Ethernet): your router plugs into the provider's ${K.g("UNI","User-network interface: the provider's Ethernet hand-off port, the demarc.")}; inside, the provider builds an ${K.g("EVC","Ethernet virtual connection: the provider's logical link between your UNIs.")} that joins your UNIs. The ${K.g("MEF","The industry body (formerly the Metro Ethernet Forum) that defines carrier Ethernet services.")} defines three EVC types:</p>
${K.svg("0 0 760 300",
  K.band(10,8,230,24,"E-LINE · point-to-point")+K.band(265,8,230,24,"E-LAN · multipoint")+K.band(520,8,230,24,"E-TREE · rooted multipoint")+
  K.link(250,40,250,262,"",true)+K.link(507,40,507,262,"",true)+
  K.dev("router",60,110,"R-A","")+K.dev("router",190,110,"R-B","")+
  `<path d="M86,112 H164" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 4" fill="none"/>`+K.txt(125,100,"EVC",{mid:true,c:"accent",s:10})+
  K.txt(125,196,"2 sites, 1 subnet (/30)",{mid:true,c:"fg",f:"body",s:11})+K.txt(125,214,"1 OSPF neighbour",{mid:true,f:"body",s:11})+
  `<ellipse cx="380" cy="128" rx="40" ry="22" fill="var(--chip)" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4"/>`+K.txt(380,132,"EVC",{mid:true,c:"accent",s:10})+
  K.dev("router",300,68,"R-A","")+K.dev("router",460,68,"R-B","")+K.dev("router",300,178,"R-C","")+K.dev("router",460,178,"R-D","")+
  K.link(324,76,344,114)+K.link(436,76,416,114)+K.link(324,172,344,142)+K.link(436,172,416,142)+
  K.txt(380,246,"any site to any site, 1 subnet",{mid:true,c:"fg",f:"body",s:11})+K.txt(380,264,"OSPF: DR/BDR election (Module 5)",{mid:true,f:"body",s:11})+
  K.dev("router",635,64,"ROOT","hub")+
  K.dev("router",560,172,"LEAF 1","")+K.dev("router",635,172,"LEAF 2","")+K.dev("router",710,172,"LEAF 3","")+
  K.link(622,118,568,158)+K.link(635,118,635,158)+K.link(648,118,702,158)+
  `<path d="M582,180 H613" stroke="var(--bad)" stroke-width="1.6" fill="none"/>`+K.txt(597,160,"✗",{mid:true,c:"bad",s:12})+
  K.txt(635,246,"root ↔ leaf only",{mid:true,c:"fg",f:"body",s:11})+K.txt(635,264,"leaves can't reach each other",{mid:true,f:"body",s:11}),
  "The three MEF service types. The routers are yours; everything in between is the provider's switching, invisible to your routers.")}
<ul>
<li><b>E-Line</b> (point-to-point): a cable between two sites to your routers: one small subnet, one neighbour. Sold as ${K.g("EPL","Ethernet private line: an E-Line using the whole port.")} or ${K.g("EVPL","Ethernet virtual private line: several E-Lines on one port, each with its own 802.1Q tag.")}, where a hub router uses one tagged subinterface per branch (router-on-a-stick, Module 4).</li>
<li><b>E-LAN</b> (multipoint-to-multipoint): one big virtual switch. Every router shares one subnet and reaches every other directly, with no extra circuits; OSPF elects a DR and BDR (Module 5).</li>
<li><b>E-Tree</b> (rooted multipoint): <b>roots</b> reach every <b>leaf</b>, leaves can't reach each other: hub-and-spoke enforced by the provider, e.g. franchise shops that share only a head office.</li>
</ul>
<h3>Port speed is not service speed: the CIR</h3>
<p>The access port is usually 1 Gb/s or 10 Gb/s, but you buy a rate such as 100 Mb/s: the ${K.g("CIR","Committed information rate: the rate you bought and the provider guarantees, e.g. 100 Mb/s on a 1 Gb/s port.")}. The provider ${K.g("polices","Policing: dropping (or marking down) traffic above the contracted rate.")} at the UNI. Your router sees only a 1 Gb/s port, so OSPF costs it as 1 Gb/s and graphs show &ldquo;10% full&rdquo; when the service is saturated. The fix is Module 5's <code>bandwidth</code> command, set to the contracted rate in kb/s.</p>
${K.steps([
  ["The facts", "KAD-R1: G0/1 carries a 100 Mb/s E-Line to Abuja on a 1 Gb/s port; G0/2 a second carrier's 20 Mb/s microwave backup. OSPF on both, reference bandwidth 100 Mb/s."],
  ["What OSPF sees", "Both ports are 1 Gb/s, so both cost the minimum, <b>1</b>. Equal cost means ECMP (Module 5): half the traffic squeezes into the 20 Mb/s backup."],
  ["The fix", "<code>bandwidth 100000</code> on G0/1 (100 Mb/s) and <code>bandwidth 20000</code> on G0/2. Costs 100 ÷ 100 = <b>1</b> and 100 ÷ 20 = <b>5</b>: the radio becomes a true backup."],
  ["What doesn't change", "<code>bandwidth</code> informs OSPF, QoS and monitoring; it never changes the port speed or limits traffic."],
])}
${K.term({env:"ios2", title:"KAD-R1 — make the router know what you bought", opts:{kind:"router", host:"KAD-R1", model:"ISR 1100", motd:"KAD-R1 — Kaduna depot WAN router (lab). Console session, no enable secret."},
  setup:env=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description KADUNA LAN","ip address 10.40.1.1 255.255.255.0","no shutdown","interface g0/1","description WAN to ABJ-R1","ip address 10.255.40.2 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/2","description WAN to ABJ-R1","ip address 10.255.41.2 255.255.255.252","ip ospf network point-to-point","no shutdown","exit","router ospf 1","router-id 4.4.4.4","passive-interface g0/0","network 10.40.1.0 0.0.0.255 area 0","network 10.255.40.0 0.0.1.255 area 0","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"Ticket: &ldquo;Kaduna's backup radio bill is high and the WAN feels slow, but the graphs show both links almost empty.&rdquo; G0/1: carrier A's 100 Mb/s E-Line, circuit KAD-EL-0042 (an example ID). G0/2: carrier B's 20 Mb/s microwave E-Line, circuit KAD-MW-0007. Both reach Abuja.",
  tasks:[
    {text:"<code>enable</code>, then <code>show interfaces g0/1</code>. Find the port speed (the <code>Full-duplex, …Mb/s</code> line) and the <code>BW</code> value. Do they describe the port or the contract?", done:e=>e.history.some(h=>/^\s*sh\S*\s+int\S*\s+g\S*0\/1\s*$/i.test(h))},
    {text:"<code>show ip ospf interface brief</code>: what cost does OSPF give each WAN link, and what does an equal cost mean for traffic to Abuja?", done:e=>e.history.some(h=>/^\s*sh\S*\s+ip\s+ospf\s+int\S*\s+br/i.test(h))},
    {text:"<code>configure terminal</code>. On G0/1: <code>bandwidth 100000</code> and a <code>description</code> that names carrier A, the circuit ID and the 100M CIR. On G0/2: <code>bandwidth 20000</code> and a description that names carrier B, its circuit ID and 20M", done:e=>{ const a=e.intfs["GigabitEthernet0/1"], b=e.intfs["GigabitEthernet0/2"]; return a.bw===100000 && b.bw===20000 && /0042/.test(a.desc||"") && /0007/.test(b.desc||""); }},
    {text:"<code>end</code>, then <code>show ip ospf interface brief</code> again: G0/1 cost 1, G0/2 cost 5. Then <code>show interfaces g0/1</code>: the port is still 1000Mb/s; only BW changed", done:e=>e.mode==="priv" && e.intfs["GigabitEthernet0/2"].bw===20000 && e.history.filter(h=>/^\s*sh\S*\s+ip\s+ospf\s+int\S*\s+br/i.test(h)).length>=2 && e.history.filter(h=>/^\s*sh\S*\s+int\S*\s+g\S*0\/1\s*$/i.test(h)).length>=2},
    {text:"Save: <code>copy running-config startup-config</code> (press Enter to accept the file name)", done:e=>!!e.savedOnce},
  ],
  win:"KAD-R1 now knows what was bought: OSPF prefers the 100 Mb/s E-Line (cost 1) and keeps the 20 Mb/s radio (cost 5) as a backup, and the next engineer can read both circuit IDs straight from the configuration when they phone a carrier. The port still runs at 1 Gb/s: <code>bandwidth</code> informs, it never limits.",
  solve:["enable","show interfaces g0/1","show ip ospf interface brief","configure terminal","interface g0/1","description CARRIER-A E-LINE KAD-EL-0042 CIR 100M to ABJ-R1","bandwidth 100000","interface g0/2","description CARRIER-B MICROWAVE KAD-MW-0007 20M BACKUP to ABJ-R1","bandwidth 20000","end","show ip ospf interface brief","show interfaces g0/1","copy running-config startup-config",""]})}
${K.tip(`Put the carrier, circuit ID and contracted rate in every WAN description. At 02:00 the provider's first question is &ldquo;what's the circuit ID?&rdquo;`)}
${K.check({q:"Eight branches join one E-LAN service and every router's E-LAN interface is in 10.255.8.0/24. With OSPF on that interface in the default network type, what happens?", o:["Each router forms a FULL adjacency with every other router, 28 in all","The routers elect a DR and BDR; the others go FULL with those two and stay 2WAY with each other","OSPF can't run on E-LAN; you need eight E-Lines","Only the router with the lowest router ID forms adjacencies"], a:1, why:"An E-LAN is one broadcast segment, like a big switch, so OSPF uses its broadcast network type: a DR and BDR are elected, DROTHERs go FULL with them and stay 2WAY/DROTHER with each other (Module 5)."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"A retail group asks for three Metro Ethernet designs. Match each requirement with the service type that fits.", pairs:[["A dedicated link between the head office and its disaster-recovery site, nothing else on it","E-Line"],["Twelve offices that all call and share files with each other directly","E-LAN"],["Forty franchise shops that may reach the head office but must never reach each other","E-Tree"]], why:"1. What is asked? A service type per traffic pattern. 2. Which rule? The service type decides who can send frames to whom. 3. Apply it: two sites only is point-to-point (E-Line); everyone to everyone is multipoint (E-LAN); a hub that reaches every spoke while spokes stay apart is rooted multipoint (E-Tree)."})}
${K.hint(`Twist: on that E-Tree, all 41 routers share one subnet and run OSPF with default settings. What could go wrong in the DR election, and how would you stop it?`)}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> Whether OSPF's election still works when leaves can't hear each other. <b>2. Which rule?</b> On a broadcast segment every router must reach the DR; on an E-Tree a leaf only reaches the root. <b>3. Apply it:</b> if a shop router became DR, the other shops couldn't hear it and their adjacencies would fail. Make the head-office router the only possible DR: give every shop router <code>ip ospf priority 0</code> (Module 5), so it can never be elected.</p>`)}

<h2>MPLS Layer 3 VPNs: the provider routes for you</h2>
${K.remember(`<b>The rule:</b> in an MPLS Layer 3 VPN your router's neighbour is <b>the provider's router</b>, not your other sites. Three roles: <b>CE</b> (customer edge, yours) routes normally and never sees a label. <b>PE</b> (provider edge) faces customers, keeps <b>one VRF per customer</b> and adds and removes labels. <b>P</b> (provider core) only swaps labels and knows no customer routes. Hook: the <b>C</b>E is the <b>C</b>ustomer's and Clueless about labels; the <b>PE</b> <b>P</b>ushes and <b>P</b>ops; the <b>P</b> only <b>P</b>asses them on.`)}
<p>Module 1 described MPLS as a provider's private WAN service. Here is how it works. ${K.g("MPLS","Multiprotocol Label Switching: providers forward packets on short labels instead of IP lookups at every hop.")} forwards on a short <b>label</b> in front of the IP header instead of an IP lookup at every hop. On top the provider builds an ${K.g("L3VPN","MPLS Layer 3 VPN (RFC 4364): a private routed WAN the provider builds for each customer.")}: a private routed WAN for each customer.</p>
${K.svg("0 0 760 340",
  K.band(10,8,140,24,"CUSTOMER")+K.band(160,8,440,24,"PROVIDER MPLS NETWORK")+K.band(610,8,140,24,"CUSTOMER")+
  K.dev("router",80,90,"BEN-CE1","CE · Benin")+K.dev("router",230,90,"PE1","PE · VRF BANK-A")+K.dev("router",380,90,"P1","P · core")+K.dev("router",530,90,"PE2","PE · VRF BANK-A")+K.dev("router",680,90,"LOS-CE1","CE · Lagos")+
  K.link(106,92,204,92)+K.link(256,92,354,92)+K.link(406,92,504,92)+K.link(556,92,654,92)+
  K.txt(230,154,"pushes 2 labels",{mid:true,c:"accent",f:"body",s:10.5})+K.txt(380,154,"swaps outer label",{mid:true,c:"accent",f:"body",s:10.5})+K.txt(530,154,"pops, VRF lookup",{mid:true,c:"accent",f:"body",s:10.5})+
  K.txt(20,190,"What is on the wire between each pair of routers:",{c:"fg",f:"body",s:11.5,b:true})+
  K.band(20,204,60,26,"Eth")+K.band(80,204,70,26,"IP pkt")+
  K.band(170,204,44,26,"Eth")+K.band(214,204,64,26,"L 2001","var(--panel2)")+K.band(278,204,56,26,"L 30","var(--panel2)")+K.band(334,204,56,26,"IP pkt")+
  K.band(410,204,44,26,"Eth")+K.band(454,204,64,26,"L 2007","var(--panel2)")+K.band(518,204,56,26,"L 30","var(--panel2)")+K.band(574,204,56,26,"IP pkt")+
  K.band(660,204,40,26,"Eth")+K.band(700,204,50,26,"IP")+
  K.txt(85,248,"CE → PE",{mid:true,f:"body",s:10.5})+K.txt(280,248,"PE1 → P1: transport + VPN label",{mid:true,f:"body",s:10.5})+K.txt(520,248,"P1 → PE2: outer label swapped",{mid:true,f:"body",s:10.5})+K.txt(705,248,"PE → CE",{mid:true,f:"body",s:10.5})+
  K.txt(380,286,"The CEs send and receive ordinary IP packets. Labels exist only inside the provider network.",{mid:true,c:"fg",f:"body",s:11.5})+
  K.txt(380,306,"P1 has no idea which customer the packet belongs to: it reads only the outer label.",{mid:true,f:"body",s:11})+
  K.txt(380,326,"(Example labels. With penultimate hop popping, the default, P1 pops 2001 instead.)",{mid:true,f:"body",s:10}),
  "One packet from Benin to Lagos across an MPLS L3VPN. The inner (VPN) label tells PE2 which customer's VRF to use; the outer (transport) label gets it to PE2.")}
<h3>The three roles</h3>
<ul>
<li>${K.g("CE","Customer edge router: your router at each site; routes normally with the PE and never sees labels.")} (customer edge): your router, running static, OSPF, EIGRP or BGP with the PE. To it, the provider network looks like one big router linked to each of your sites.</li>
<li>${K.g("PE","Provider edge router: faces customers, keeps a VRF per customer, adds and removes labels.")} (provider edge): keeps each customer's routes in that customer's own ${K.g("VRF","Virtual routing and forwarding: a separate routing table inside one router (named in Module 6; configured in lesson 6).")}, so two customers can both use 10.70.1.0/24 without clashing. PEs swap customer routes with each other using ${K.g("MP-BGP","Multiprotocol BGP: carries each VPN's routes between PE routers. Beyond CCNA.")}. The ingress PE pushes an inner <b>VPN label</b> (which VRF) and an outer <b>transport label</b> (which PE).</li>
<li>${K.g("P router","Provider core router: swaps outer labels only, holds no customer routes, has no customer ports.")} (provider): swaps the outer label and forwards. No customer routes, which is why the core scales to thousands of customers.</li>
</ul>
<p>The label itself is a 4-byte ${K.g("shim header","A small header inserted between the Layer 2 and Layer 3 headers.")}: a 20-bit label, 3 traffic-class bits (QoS), a bottom-of-stack bit and an 8-bit TTL, between the Ethernet and IP headers, hence &ldquo;Layer 2.5&rdquo;. &ldquo;Multiprotocol&rdquo; means the core carries any payload (IPv4, IPv6, even Ethernet frames, so the provider's E-LANs often share it); the access circuit can be Ethernet, serial, broadband or 4G.</p>
<h3>Worked example: one packet from Benin City to Lagos</h3>
${K.steps([
  ["At the branch", "BEN-PC1 (10.70.1.25) sends to LOS-APP1 (10.10.1.50). BEN-CE1's route, learned by OSPF from PE1, sends a plain IP packet to PE1."],
  ["Into the VPN", "It arrives on an interface in VRF BANK-A, so PE1 looks in BANK-A's table: 10.10.1.0/24 is behind PE2. It pushes BANK-A's VPN label (30) and a transport label towards PE2 (2001)."],
  ["Across the core", "P1 swaps outer label 2001 for 2007 and forwards, never reading the IP header. (By default the last P router, here P1, pops it instead: penultimate hop popping.)"],
  ["Out of the VPN", "PE2 removes the labels; label 30 means BANK-A, so it looks up 10.10.1.50 in that VRF and sends a plain IP packet to LOS-CE1."],
])}
<p>So MPLS is <b>any-to-any</b> with no extra circuits, and it is <b>private by separation, not encryption</b>. If encryption is required, add IPsec (Module 8 lesson 3).</p>
${K.mistake(`Saying the CE &ldquo;runs MPLS&rdquo; or &ldquo;adds labels&rdquo;. In an L3VPN the CE is an ordinary router; label work starts and ends at the PEs.`)}
${K.mistake(`Expecting P routers to know your subnets. They hold only the provider's own routes and labels.`)}
${K.check({q:"Which device in an MPLS Layer 3 VPN keeps a separate routing table for each customer?", o:["The CE router","The PE router","The P router","Every router in the provider core"], a:1, why:"The PE faces customers and keeps a VRF per customer, so overlapping customer addresses don't clash. The CE routes normally; the P routers only swap labels and hold no customer routes."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A provider shows you its new MPLS network diagram, with routers named XR-A to XR-F. XR-C connects only to other provider routers and has no customer ports. Using the role rules, which three statements about XR-C must be true? (Choose three.)", o:["It forwards your packets by looking at the outer label","It holds no routes for your 10.70.1.0/24 branch","It keeps a VRF for each customer","It never exchanges routes with your CE","It pushes the VPN label onto your packets","It is a CE router"], a:[0,1,3], why:"1. What is asked? What a core-only router does. 2. Which rule? A router with no customer ports is a P router: it swaps outer labels and knows no customer routes. 3. Apply it: it forwards on the outer label, holds none of your routes and never talks to your CE. VRFs and the VPN label are PE work; CEs are customer routers."})}
${K.drill({title:"CE, PE or P — name the role", types:["mplsrole"], count:5})}

<h2>Internet access: broadband, 4G/5G and satellite</h2>
${K.remember(`<b>The rule:</b> these services give you the <b>internet</b>, not a private network. Judge each by <b>shared or dedicated</b>, <b>symmetric or not</b>, <b>latency</b> (how far the signal travels) and <b>SLA</b>. Privacy you add yourself with a VPN (lesson 3).`)}
<p>Internet access is cheap and almost everywhere, so most enterprise WANs use it, as backup or (with VPNs and SD-WAN, lesson 4) main transport.</p>
${K.svg("0 0 760 330",
  K.txt(10,22,"Where your capacity becomes shared",{c:"fg",f:"body",s:12,b:true})+
  K.txt(10,56,"DSL",{c:"fg",b:true,s:12})+K.box(70,38,110,34,"DSL modem","your site")+K.box(300,38,110,34,"DSLAM","exchange")+K.box(560,38,150,34,"provider network","shared uplink")+
  K.link(180,55,300,55)+K.txt(240,82,"your own copper pair",{mid:true,f:"body",s:10})+K.link(410,55,560,55)+K.txt(485,82,"shared from here",{mid:true,c:"warn",f:"body",s:10})+
  K.txt(10,136,"Cable",{c:"fg",b:true,s:12})+K.box(70,118,110,34,"cable modem","your site")+K.box(300,118,110,34,"fibre node","street")+K.box(560,118,150,34,"CMTS","headend")+
  K.link(180,135,300,135)+K.txt(240,162,"coax shared by the street",{mid:true,c:"warn",f:"body",s:10})+K.link(410,135,560,135)+K.txt(485,162,"fibre",{mid:true,f:"body",s:10})+
  K.txt(10,216,"PON",{c:"fg",b:true,s:12})+K.box(70,198,110,34,"ONT","your site")+K.box(300,198,110,34,"splitter","passive, 1:32")+K.box(560,198,150,34,"OLT","exchange")+
  K.link(180,215,300,215)+K.txt(240,242,"your own fibre drop",{mid:true,f:"body",s:10})+K.link(410,215,560,215)+K.txt(485,242,"one fibre for 32 homes",{mid:true,c:"warn",f:"body",s:10})+
  K.txt(10,296,"4G / 5G",{c:"fg",b:true,s:12})+K.box(70,278,110,34,"4G/5G router","your site")+K.box(300,278,110,34,"cell tower","radio cell")+K.box(560,278,150,34,"mobile core","operator")+
  K.link(180,295,300,295,"",true)+K.txt(240,322,"radio shared by the cell",{mid:true,c:"warn",f:"body",s:10})+K.link(410,295,560,295),
  "Four access types, read left to right. Amber labels mark where your traffic starts sharing capacity with other customers.")}
<h3>DSL: broadband over the telephone line</h3>
<p>${K.g("DSL","Digital subscriber line: broadband over a telephone copper pair, above the voice frequencies.")} shares the phone line with calls (a ${K.g("splitter","A filter separating telephone frequencies from DSL's, so both share one copper pair.")} separates them). At the exchange, a ${K.g("DSLAM","DSL access multiplexer: the provider's exchange equipment that terminates many DSL lines.")} terminates the lines. Speed falls with distance from the exchange (the fastest VDSL2 rates reach only a few hundred metres), and ${K.g("ADSL","Asymmetric DSL: much more download than upload capacity.")} is <b>asymmetric</b>, which hurts a site that uploads backups or CCTV. Many providers log you in with ${K.g("PPPoE","PPP over Ethernet, used by many DSL providers; its 8-byte header cuts the IP MTU to 1492.")} (the 1492-byte MTU matters for tunnels in lesson 3).</p>
<h3>Cable: broadband over the TV network</h3>
<p>Cable broadband uses the TV operator's ${K.g("HFC","Hybrid fibre-coax: fibre to a street node, coaxial cable to each building.")} network and the ${K.g("DOCSIS","Data Over Cable Service Interface Specification: the internet-over-cable-TV standard.")} standard. Capacity is <b>shared by everyone on the node</b>, scheduled by the ${K.g("CMTS","Cable modem termination system: the cable operator's equipment the modems talk to.")}: when the street streams video at 21:00, your share drops.</p>
<h3>Fibre: PON and dedicated fibre</h3>
<p>Most fibre-to-the-home is a ${K.g("PON","Passive optical network: one provider fibre split by unpowered splitters to many homes. Capacity is shared.")}. From the provider's ${K.g("OLT","Optical line terminal: the provider's PON equipment at the exchange.")}, one fibre runs to an unpowered splitter that divides the light among up to 32 or 64 homes, each with an ${K.g("ONT","Optical network terminal: the customer's PON box with an Ethernet port. Also called ONU.")}. A ${K.g("GPON","Gigabit PON (ITU-T G.984), the most common PON standard.")} fibre's 2.488 Gb/s down and 1.244 Gb/s up is <b>shared</b> by every ONT on it. <b>Dedicated internet access</b> is different: a fibre for you alone, usually symmetric, with an SLA and a price to match. &ldquo;Business fibre&rdquo; can be either, so ask.</p>
<h3>4G and 5G</h3>
<p>A router with a ${K.g("LTE","Long Term Evolution: the 4G mobile standard.")} or 5G modem and a ${K.g("SIM","Subscriber identity module: the mobile operator's card that identifies your subscription.")} turns the mobile network into a WAN link: online the day it arrives, independent of buried cables, so the classic backup. But the cell is shared, throughput and latency (typically tens of milliseconds on 4G) vary, bundles run out, and the operator often puts you behind carrier-grade NAT (Module 7's PAT, at the operator), so nothing can connect in. Operators can also deliver a ${K.g("private APN","Private access point name: the mobile operator delivers a company's SIM traffic into its own network, not the internet.")}. 5G adds capacity and lower latency, and 5G ${K.g("fixed wireless access","FWA: broadband delivered over the mobile network to a fixed receiver instead of a cable.")} (FWA) replaces a cable.</p>
<h3>Satellite: anywhere, at the speed of light</h3>
<p>${K.g("VSAT","Very Small Aperture Terminal: a small-dish satellite link (Module 5 met it as a backup).")} reaches places nothing else does: an oil platform, a desert mine, a ship. Classic VSAT uses ${K.g("GEO","Geostationary orbit: 35,786 km above the equator; the satellite seems fixed in the sky.")} satellites. The cost is distance, and you can calculate it:</p>
${K.steps([
  ["One way, up and down", "Dish → satellite → ground station: 2 × 35,786 ≈ 71,600 km; at about 300,000 km/s, <b>239 ms</b>."],
  ["A round trip", "Request up and down, reply up and down: 4 × 35,786 ≈ 143,000 km ≈ <b>477 ms</b> before equipment delay."],
  ["What ping shows", "With modems, queues and ground paths, typically <b>550–700 ms</b>. No upgrade fixes physics."],
  ["The newer option", `${K.g("LEO","Low Earth orbit: under 2,000 km up; large constellations give continuous coverage with low latency.")} constellations bring the round trip down to a few tens of milliseconds.`],
])}
<p>Satellite also suffers ${K.g("rain fade","Satellite signal loss in heavy rain, which absorbs the high frequencies most VSAT uses.")}: a tropical storm can cut the link for minutes.</p>
${K.dyk(`An application needing 40 round trips per screen waits 24 seconds on 600 ms GEO, whatever the bandwidth, and 1.2 seconds on a 30 ms link. For chatty applications, latency beats megabits.`)}
${K.when([
  ["DSL","A small site near the exchange","Existing phone line; cheap","Far from the exchange, or heavy uploads"],
  ["Cable","Best effort is fine","Fast downloads, cheap","Evening performance matters (shared)"],
  ["Fibre broadband (PON)","Fibre has reached the site","High speed, broadband price","You need an SLA: buy dedicated access"],
  ["4G / 5G","Backup, new or temporary sites","Installed in a day, no cables","Heavy steady traffic: variable, capped"],
  ["GEO satellite (VSAT)","Nothing else reaches the site","Works almost anywhere","Voice and chatty apps: ~600 ms, rain fade"],
  ["LEO satellite","Remote and interactive","Tens of milliseconds","Not licensed or covered there"],
], "Which internet access?")}
${K.check({q:"A depot's GEO VSAT link has plenty of spare bandwidth, but staff say the stock system takes 20 seconds to open each screen. A ping to the data centre shows about 640 ms. What is the most likely cause, and which change helps most?", o:["The link is congested; buy more bandwidth","Latency: each screen needs many round trips of about 640 ms; a lower-latency path (LEO, 4G where available) helps far more than more bandwidth","DNS is misconfigured","The satellite dish is too large"], a:1, why:"Spare bandwidth plus a 640 ms ping points to latency, not capacity. A chatty application multiplies every round trip, so cutting the delay (LEO satellite or terrestrial) is the fix; more megabits on the same GEO path change nothing."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A medium Earth orbit (MEO) system orbits about 8,000 km up. Using the GEO method (satellite overhead, 300,000 km/s), what is the minimum round trip, to the nearest 10 ms?", fields:[{label:"Round trip (ms)", a:["110","107","110 ms","107 ms","about 110","~110"]}], why:"1. What is asked? A minimum round-trip delay. 2. Which rule? A round trip crosses the dish-satellite distance four times: up and down for the request, up and down for the reply. 3. Apply it: 4 × 8,000 = 32,000 km ÷ 300,000 km/s ≈ 0.107 s ≈ 110 ms. Real systems add equipment delay on top, but it's still about a fifth of GEO's 477 ms minimum."})}

<h2>WAN topologies and redundancy</h2>
${K.remember(`<b>The rule:</b> a topology is two choices. <b>Shape</b> (point-to-point, hub-and-spoke, partial or full mesh) decides where spoke-to-spoke traffic goes; pick it from the traffic pattern. <b>Homing</b> (single-homed, dual-homed, dual-carrier) decides which failures a site survives; pick it from the cost of an outage.`)}
<p>Module 1 taught the shapes and n(n − 1) ÷ 2. The technologies map onto them:</p>
<ul>
<li><b>Point-to-point</b>: a leased line or E-Line.</li>
<li><b>Hub-and-spoke</b>: an E-Line per branch, or an E-Tree. Spoke-to-spoke traffic crosses the hub twice.</li>
<li><b>Partial mesh</b>: hub-and-spoke plus direct circuits only between the sites that talk a lot.</li>
<li><b>Full mesh</b>: an E-LAN or MPLS VPN gives any-to-any <i>without</i> n(n − 1) ÷ 2 circuits, because the provider does the meshing. With internet VPNs you build every tunnel yourself (lesson 3).</li>
</ul>
<h3>Homing: which failures does a site survive?</h3>
${K.svg("0 0 760 300",
  K.band(10,8,235,24,"SINGLE-HOMED")+K.band(262,8,235,24,"DUAL-HOMED")+K.band(515,8,235,24,"DUAL-CARRIER")+
  K.link(253,40,253,282,"",true)+K.link(506,40,506,282,"",true)+
  K.dev("router",127,70,"BRANCH","")+K.dev("cloud",127,170,"CARRIER A","")+K.link(127,120,127,146)+
  K.txt(127,240,"one link, one provider",{mid:true,c:"fg",f:"body",s:11})+K.txt(127,258,"survives: nothing",{mid:true,c:"bad",f:"body",s:11})+
  K.dev("router",340,70,"BR-R1","")+K.dev("router",420,70,"BR-R2","")+K.dev("cloud",380,170,"CARRIER A","")+K.link(342,120,366,148)+K.link(418,120,394,148)+
  K.txt(380,240,"two links, same provider",{mid:true,c:"fg",f:"body",s:11})+K.txt(380,258,"survives: a cut cable, a dead router",{mid:true,c:"warn",f:"body",s:11})+K.txt(380,276,"not: a carrier-wide outage",{mid:true,f:"body",s:10.5})+
  K.dev("router",632,70,"BRANCH","")+K.dev("cloud",572,170,"CARRIER A","MPLS")+K.dev("cloud",692,170,"CARRIER B","4G")+K.link(620,120,584,148)+K.link(644,120,680,148,"",true)+
  K.txt(632,240,"links from two providers",{mid:true,c:"fg",f:"body",s:11})+K.txt(632,258,"survives: a whole carrier failing",{mid:true,c:"ok",f:"body",s:11})+K.txt(632,276,"ask: do the cables share a duct?",{mid:true,f:"body",s:10.5}),
  "Homing options for a branch. Dual-homed can also mean one router with two links; the point is one provider. Dual-carrier (multihomed) adds a second provider.")}
<p>The names match Module 1: <b>single-homed</b>, <b>dual-homed</b> (two links, one provider) and <b>multihomed</b> or <b>dual-carrier</b> (two or more providers). Two warnings. Two carriers can still share a duct under the same road, so ask for their access routes (<b>diversity</b>). And a backup helps only if routing uses it, in <b>both</b> directions (Module 5).</p>
${K.check({q:"A branch has an MPLS circuit from carrier A and a second MPLS circuit from carrier A on a separate router. Which failure will still take the branch offline?", o:["A digger cutting one of the two access cables","One branch router failing","A configuration error that takes carrier A's whole MPLS network down","A power supply failing in one router"], a:2, why:"Two links to the same provider is dual-homed: it survives a cut cable or a dead router, but both links depend on carrier A's network. Surviving a carrier-wide outage needs a second carrier (dual-carrier / multihomed)."})}

<h3>Hands-on: from hub-and-spoke to partial mesh</h3>
<p>Three branches hang off the Abuja hub on E-Lines (each lab cable stands for one E-Line, which is how your routers see it). Kano and Port Harcourt talk a lot, so a direct E-Line has been bought. Watch spoke-to-spoke traffic cross the hub, add the circuit, then see the partial mesh survive a failure.</p>
${K.bench({id:"m10-hub-mesh", points:110, from:"CCNA · Module 10 · lesson 2", title:"four sites on E-Lines: add a direct circuit and turn hub-and-spoke into a partial mesh", viewBox:"0 0 990 615", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Kano ↔ Port Harcourt file transfers are slow and load the Abuja hub; the new Kano–Port Harcourt E-Line (circuit KP-EL-0101, an example) was delivered this morning.&rdquo; OSPF area 0, point-to-point network type on the E-Lines. LAP-KAN is on KAN-R1's console, LAP-PHC on PHC-R1's (9600 8N1): press Enter, then <code>enable</code>. Addressing: Abuja LAN 10.20.0.0/24 (ABJ-SRV .10) · Kano 10.21.0.0/24 (KAN-PC1 .21) · Port Harcourt 10.22.0.0/24 (PHC-SRV .30) · Enugu 10.23.0.0/24 (ENU-PC1 .40) · hub E-Lines 10.255.20.0/30 (ABJ-R1 .1, KAN-R1 .2), 10.255.20.4/30 (ABJ-R1 .5, PHC-R1 .6), 10.255.20.8/30 (ABJ-R1 .9, ENU-R1 .10) · new E-Line <b>10.255.20.12/30 (KAN-R1 .13, PHC-R1 .14)</b>. To fail a circuit, unplug its cable.",
  devices:[
    {id:"lapk", kind:"laptop", label:"LAP-KAN", x:20, y:20},
    {id:"kan", kind:"router", label:"KAN-R1", model:"ISR 1100 · Kano branch", x:20, y:190, config:e=>{ ["en","conf t","hostname KAN-R1","no ip domain-lookup","interface g0/0","description KANO LAN","ip address 10.21.0.1 255.255.255.0","no shutdown","interface g0/1","description E-LINE to ABJ-R1","ip address 10.255.20.2 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/2","description SPARE","exit","router ospf 1","router-id 2.2.2.2","passive-interface g0/0","network 10.21.0.0 0.0.0.255 area 0","network 10.255.20.0 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"kpc", kind:"pc", label:"KAN-PC1", x:40, y:360, ip:"10.21.0.21", mask:"255.255.255.0", gw:"10.21.0.1"},
    {id:"srv", kind:"server", label:"ABJ-SRV", x:430, y:20, ip:"10.20.0.10", mask:"255.255.255.0", gw:"10.20.0.1"},
    {id:"abj", kind:"router", label:"ABJ-R1", model:"ISR 4331 · Abuja hub", x:380, y:190,
      ports:[{id:"g0", type:"rj45", label:"G0/0", ios:"GigabitEthernet0/0"},{id:"g1", type:"rj45", label:"G0/1", ios:"GigabitEthernet0/1"},{id:"g2", type:"rj45", label:"G0/2", ios:"GigabitEthernet0/2"},{id:"g3", type:"rj45", label:"G0/3", ios:"GigabitEthernet0/3"},{id:"con", type:"console", label:"CON"}],
      config:e=>{ ["en","conf t","hostname ABJ-R1","no ip domain-lookup","interface g0/0","description ABUJA DATA CENTRE LAN","ip address 10.20.0.1 255.255.255.0","no shutdown","interface g0/1","description E-LINE to KAN-R1","ip address 10.255.20.1 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/2","description E-LINE to PHC-R1","ip address 10.255.20.5 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/3","description E-LINE to ENU-R1","ip address 10.255.20.9 255.255.255.252","ip ospf network point-to-point","no shutdown","exit","router ospf 1","router-id 1.1.1.1","passive-interface g0/0","network 10.20.0.0 0.0.0.255 area 0","network 10.255.20.0 0.0.0.15 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"enu", kind:"router", label:"ENU-R1", model:"ISR 1100 · Enugu branch", x:400, y:400, config:e=>{ ["en","conf t","hostname ENU-R1","no ip domain-lookup","interface g0/0","description ENUGU LAN","ip address 10.23.0.1 255.255.255.0","no shutdown","interface g0/1","description E-LINE to ABJ-R1","ip address 10.255.20.10 255.255.255.252","ip ospf network point-to-point","no shutdown","exit","router ospf 1","router-id 4.4.4.4","passive-interface g0/0","network 10.23.0.0 0.0.0.255 area 0","network 10.255.20.8 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"epc", kind:"pc", label:"ENU-PC1", x:450, y:500, ip:"10.23.0.40", mask:"255.255.255.0", gw:"10.23.0.1"},
    {id:"lapp", kind:"laptop", label:"LAP-PHC", x:780, y:20},
    {id:"phc", kind:"router", label:"PHC-R1", model:"ISR 1100 · Port Harcourt branch", x:760, y:190, config:e=>{ ["en","conf t","hostname PHC-R1","no ip domain-lookup","interface g0/0","description PORT HARCOURT LAN","ip address 10.22.0.1 255.255.255.0","no shutdown","interface g0/1","description E-LINE to ABJ-R1","ip address 10.255.20.6 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/2","description SPARE","exit","router ospf 1","router-id 3.3.3.3","passive-interface g0/0","network 10.22.0.0 0.0.0.255 area 0","network 10.255.20.4 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"psrv", kind:"server", label:"PHC-SRV", x:800, y:360, ip:"10.22.0.30", mask:"255.255.255.0", gw:"10.22.0.1"},
  ],
  cables:[ {type:"cat6", a:"kan:g1", b:"abj:g1"}, {type:"cat6", a:"abj:g2", b:"phc:g1"}, {type:"cat6", a:"abj:g3", b:"enu:g1"},
    {type:"cat6", a:"kpc:eth", b:"kan:g0"}, {type:"cat6", a:"srv:eth", b:"abj:g0"}, {type:"cat6", a:"psrv:eth", b:"phc:g0"}, {type:"cat6", a:"epc:eth", b:"enu:g0"},
    {type:"console", a:"lapk:usb", b:"kan:con"}, {type:"console", a:"lapp:usb", b:"phc:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"See the hub-and-spoke path. KAN-PC1 → Command Prompt: <code>tracert 10.22.0.30</code> (PHC-SRV). Which hop is the Abuja hub, and how many WAN circuits does the traffic cross?", done:B=>Bench.traced(B,"kpc","10.22.0.30") && Bench.routeVia(B,"kan","10.22.0.30")==="10.255.20.1"},
    {text:"On LAP-KAN (KAN-R1's console): <code>enable</code>, <code>show ip ospf neighbor</code> (one neighbour, the hub, <code>FULL/  -</code>) and <code>show ip route ospf</code>. What is the cost to 10.22.0.0/24, and why that number?", done:B=>B.devs.kan.env.log.some(l=>/1\.1\.1\.1\s+0\s+FULL/.test(l.out||"")) && B.devs.kan.env.log.some(l=>/10\.22\.0\.0\/24 \[110\/3\]/.test(l.out||""))},
    {text:"The provider has handed over the new E-Line. Connect it: a Cat6 from the tray between KAN-R1 <b>G0/2</b> and PHC-R1 <b>G0/2</b>", done:B=>Bench.linked(B,"kan:g2","phc:g2")},
    {text:"KAN-R1: configure G0/2 as the Kano end of the circuit: a <code>description</code> with the circuit ID, <code>ip address 10.255.20.13 255.255.255.252</code>, <code>ip ospf network point-to-point</code>, <code>no shutdown</code>; then under <code>router ospf 1</code> add a <code>network</code> statement that matches only 10.255.20.12/30 in area 0", done:B=>{ const e=B.devs.kan.env, i=e.intfs["GigabitEthernet0/2"]; return i.ip==="10.255.20.13" && !i.shut && /KP-EL-0101/i.test(i.desc||"") && e.ospf && e.ospf.networks.some(w=>w.net==="10.255.20.12" && w.wild==="0.0.0.3" && w.area===0); }},
    {text:"Switch to LAP-PHC and do the same on PHC-R1 G0/2 with <code>10.255.20.14</code>. Then <code>show ip ospf neighbor</code> on PHC-R1: two FULL neighbours, 1.1.1.1 and 2.2.2.2", done:B=>Bench.ospfNbr(B,"phc","2.2.2.2") && Bench.ospfNbr(B,"phc","1.1.1.1") && Bench.ospfNbr(B,"kan","3.3.3.3") && /KP-EL-0101/i.test(B.devs.phc.env.intfs["GigabitEthernet0/2"].desc||"")},
    {text:"PHC-R1: <code>show ip route ospf</code>. The Kano LAN is now cost 2 via 10.255.20.13. Then prove it from PHC-SRV: <code>tracert 10.21.0.21</code> (KAN-PC1). Is the hub still in the path?", done:B=>{ const r = Bench.route(B,"phc","10.21.0.0/24","O"); return !!(r && r.metric===2 && Bench.traced(B,"psrv","10.21.0.21")); }},
    {text:"Partial mesh in action: the Kano–Abuja E-Line fails. Unplug the cable between KAN-R1 G0/1 and ABJ-R1 G0/1. Then from KAN-PC1, <code>tracert 10.20.0.10</code> (ABJ-SRV) and <code>ping 10.23.0.40</code> (ENU-PC1). Which way does Kano reach Abuja and Enugu now?", done:B=>!Bench.linked(B,"kan:g1","abj:g1") && Bench.traced(B,"kpc","10.20.0.10") && Bench.pingedNow(B,"kpc","10.20.0.10") && Bench.pingedNow(B,"kpc","10.23.0.40") && Bench.routeVia(B,"kan","10.20.0.10")==="10.255.20.14"},
    {text:"The carrier repairs the circuit: put the Cat6 back between KAN-R1 G0/1 and ABJ-R1 G0/1. Save KAN-R1 and PHC-R1 (<code>copy running-config startup-config</code> on each)", done:B=>Bench.linked(B,"kan:g1","abj:g1") && Bench.ospfNbr(B,"kan","1.1.1.1") && B.devs.kan.env.savedOnce && B.devs.phc.env.savedOnce},
  ],
  win:"Kano and Port Harcourt now use their own E-Line (one WAN crossing instead of two), making a partial mesh: four of six possible circuits. When Kano's hub circuit failed, OSPF rerouted through Port Harcourt by itself. One difference the lab hides: a real provider fault can leave your port up while frames stop, so OSPF notices only when its dead timer (40 s) expires.",
  solve:[["pc","kpc","tracert 10.22.0.30"],
    ["console","lapk",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf neighbor"],["term","show ip route ospf"],
    ["plug","cat6","kan:g2","phc:g2"],
    ["term","configure terminal"],["term","interface g0/2"],["term","description E-LINE KP-EL-0101 to PHC-R1"],["term","ip address 10.255.20.13 255.255.255.252"],["term","ip ospf network point-to-point"],["term","no shutdown"],["term","router ospf 1"],["term","network 10.255.20.12 0.0.0.3 area 0"],["term","end"],
    ["console","lapp",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/2"],["term","description E-LINE KP-EL-0101 to KAN-R1"],["term","ip address 10.255.20.14 255.255.255.252"],["term","ip ospf network point-to-point"],["term","no shutdown"],["term","router ospf 1"],["term","network 10.255.20.12 0.0.0.3 area 0"],["term","end"],
    ["term","show ip ospf neighbor"],["term","show ip route ospf"],["pc","psrv","tracert 10.21.0.21"],
    ["unplug","kan:g1"],["pc","kpc","tracert 10.20.0.10"],["pc","kpc","ping 10.23.0.40"],
    ["plug","cat6","kan:g1","abj:g1"],["term","copy running-config startup-config"],["term",""],
    ["console","lapk",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: each Gigabit hop costs 1: two E-Lines plus the far LAN = 3. Task 4: the existing statements match only their own /30s, so G0/2 needs its own (wildcard 0.0.0.3). Task 7: Kano's only circuit left is the new one.`)}
${K.reveal("Walkthrough — what you saw", `<p>First tracert: 10.21.0.1, <b>10.255.20.1</b> (the hub), 10.255.20.6, the server: two circuits. With the direct E-Line, cost 2 beat 3, and tracert from PHC-SRV showed 10.22.0.1, 10.255.20.13, KAN-PC1. With the hub circuit down, Kano reached Abuja via 10.255.20.14 → 10.255.20.5. A partial mesh buys extra circuits only where traffic or risk justifies them.</p>`)}

<h3>Hands-on: a second carrier for the Benin City branch</h3>
${K.bench({id:"m10-dual-carrier", points:110, from:"CCNA · Module 10 · lesson 2", title:"dual-carrier branch: MPLS from carrier A, a 4G backup from carrier B", viewBox:"0 0 990 530", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Benin City branch: our 4G bundle ran out in nine days although the MPLS circuit was up all month. And when roadworks cut the MPLS circuit last month, the branch was offline for six hours although the 4G router was working.&rdquo; BEN-CE1 and LOS-CE1 are your CEs. Carrier A's MPLS network is drawn as one router, <b>PE-A</b>, running OSPF with each CE (no login for you, as in real life). Carrier B's 4G private APN is drawn as the G0/2–G0/2 cable, 10.250.70.0/30 (LOS-CE1 .1, BEN-CE1 .2). LAN addressing: Benin 10.70.1.0/24 (BEN-PC1 .25), Lagos 10.10.1.0/24 (LOS-APP1 .50). LAP-BEN and LAP-LOS are on the CE consoles (9600 8N1). Lab simplification: a real PE keeps your routes in a VRF (lesson 6) and carries them between PEs with labels, so real OSPF routes from other sites often show as O IA or O E2.",
  devices:[
    {id:"lapb", kind:"laptop", label:"LAP-BEN", x:20, y:20},
    {id:"ben", kind:"router", label:"BEN-CE1", model:"ISR 1100 · Benin City branch", x:20, y:210, config:e=>{ ["en","conf t","hostname BEN-CE1","no ip domain-lookup","interface g0/0","description BENIN LAN","ip address 10.70.1.1 255.255.255.0","no shutdown","interface g0/1","description CARRIER-A MPLS access to PE-A","ip address 10.200.70.2 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/2","description CARRIER-B 4G private APN to LOS-CE1","ip address 10.250.70.2 255.255.255.252","no shutdown","exit","router ospf 1","router-id 7.7.7.7","passive-interface g0/0","network 10.70.1.0 0.0.0.255 area 0","network 10.200.70.0 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"bpc", kind:"pc", label:"BEN-PC1", x:40, y:400, ip:"10.70.1.25", mask:"255.255.255.0", gw:"10.70.1.1"},
    {id:"pe", kind:"router", label:"PE-A", model:"carrier A · MPLS (simplified)", x:390, y:40, config:e=>{ ["en","conf t","hostname PE-A","no ip domain-lookup","interface g0/0","description CUSTOMER BEN-CE1","ip address 10.200.70.1 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/1","description CUSTOMER LOS-CE1","ip address 10.200.10.1 255.255.255.252","ip ospf network point-to-point","no shutdown","exit","router ospf 1","router-id 100.0.0.1","network 10.200.0.0 0.0.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"los", kind:"router", label:"LOS-CE1", model:"ISR 4331 · Lagos head office", x:760, y:210, config:e=>{ ["en","conf t","hostname LOS-CE1","no ip domain-lookup","interface g0/0","description LAGOS DATA CENTRE LAN","ip address 10.10.1.1 255.255.255.0","no shutdown","interface g0/1","description CARRIER-A MPLS access to PE-A","ip address 10.200.10.2 255.255.255.252","ip ospf network point-to-point","no shutdown","interface g0/2","description CARRIER-B 4G private APN to BEN-CE1","ip address 10.250.70.1 255.255.255.252","no shutdown","exit","router ospf 1","router-id 1.1.1.1","passive-interface g0/0","network 10.10.1.0 0.0.0.255 area 0","network 10.200.10.0 0.0.0.3 area 0","exit","ip route 10.70.1.0 255.255.255.0 10.250.70.2 100","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"hsrv", kind:"server", label:"LOS-APP1", x:800, y:400, ip:"10.10.1.50", mask:"255.255.255.0", gw:"10.10.1.1"},
    {id:"lapl", kind:"laptop", label:"LAP-LOS", x:800, y:20},
  ],
  cables:[ {type:"cat6", a:"ben:g1", b:"pe:g0"}, {type:"cat6", a:"pe:g1", b:"los:g1"}, {type:"cat6", a:"ben:g2", b:"los:g2"},
    {type:"cat6", a:"bpc:eth", b:"ben:g0"}, {type:"cat6", a:"hsrv:eth", b:"los:g0"},
    {type:"console", a:"lapb:usb", b:"ben:con"}, {type:"console", a:"lapl:usb", b:"los:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"Trace both directions. BEN-PC1: <code>tracert 10.10.1.50</code>. LOS-APP1: <code>tracert 10.70.1.25</code>. Which carrier does each direction use?", done:B=>Bench.traced(B,"bpc","10.10.1.50") && Bench.traced(B,"hsrv","10.70.1.25")},
    {text:"On LAP-LOS: <code>enable</code>, then <code>show ip route 10.70.1.0</code>. How was the Benin route learned, with what distance, and why does it beat the OSPF route through PE-A?", done:B=>B.devs.los.env.log.some(l=>/Known via "static", distance 100/.test(l.out||""))},
    {text:"Fix the Lagos side: remove the static with <code>no ip route 10.70.1.0 255.255.255.0 10.250.70.2 100</code> and enter it again as a floating static with distance <b>200</b> (higher than OSPF's 110). <code>show ip route 10.70.1.0</code> should now say <code>Known via \"ospf 1\"</code>", done:B=>{ const rs=B.devs.los.env.routes; return rs.some(r=>r.net==="10.70.1.0" && r.nh==="10.250.70.2" && r.ad===200) && !rs.some(r=>r.net==="10.70.1.0" && r.ad===100) && B.devs.los.env.log.some(l=>/10\.70\.1\.0/.test(l.cmd||"") && /Known via "ospf 1"/.test(l.out||"")); }},
    {text:"Now the Benin side, which has no backup at all. On LAP-BEN: <code>enable</code>, <code>show ip route</code>, then add a floating static for the Lagos LAN (10.10.1.0/24) through the 4G link, next hop 10.250.70.1, distance 200", done:B=>B.devs.ben.env.routes.some(r=>r.net==="10.10.1.0" && r.mask==="255.255.255.0" && r.nh==="10.250.70.1" && r.ad===200)},
    {text:"BEN-CE1: <code>show ip route static</code>. Why is the route you typed not there?", done:B=>B.devs.ben.env.routes.some(r=>r.nh==="10.250.70.1" && r.ad===200) && B.devs.ben.env.log.some(l=>/^\s*sh\S*\s+ip\s+ro\S*\s+st/i.test(l.cmd||""))},
    {text:"The roadworks again: unplug the cable between BEN-CE1 G0/1 and PE-A G0/0 (carrier A's access circuit). On BEN-CE1, <code>show ip ospf neighbor</code> and <code>show ip route</code>: what replaced the OSPF route?", done:B=>!Bench.linked(B,"ben:g1","pe:g0") && B.devs.ben.env.log.some(l=>/S\s+10\.10\.1\.0\/24 \[200\/0\] via 10\.250\.70\.1/.test(l.out||""))},
    {text:"Prove the branch still works, both ways: BEN-PC1 <code>tracert 10.10.1.50</code> should show 10.250.70.1, and on LOS-CE1 <code>show ip route 10.70.1.0</code> should show the distance-200 static", done:B=>!Bench.linked(B,"ben:g1","pe:g0") && Bench.routeVia(B,"ben","10.10.1.50")==="10.250.70.1" && Bench.routeVia(B,"los","10.70.1.25")==="10.250.70.2" && B.devs.los.env.log.some(l=>/Known via "static", distance 200/.test(l.out||""))},
    {text:"Carrier A repairs the circuit: reconnect BEN-CE1 G0/1 to PE-A G0/0. On LOS-CE1, <code>show ip route 10.70.1.0</code> is back to OSPF by itself. Save both CE routers", done:B=>Bench.linked(B,"ben:g1","pe:g0") && Bench.routeVia(B,"los","10.70.1.25")==="10.200.10.1" && Bench.routeVia(B,"ben","10.10.1.50")==="10.200.70.1" && B.devs.ben.env.savedOnce && B.devs.los.env.savedOnce},
  ],
  win:"Benin City is now genuinely dual-carrier: MPLS both ways while it is up (the AD-100 static had sent every Lagos-to-Benin packet over 4G, draining the bundle), and distance-200 floating statics at both ends when it dies, stepping aside when OSPF returns. Two carriers become redundancy only when routing uses each at the right time, both ways.",
  solve:[["pc","bpc","tracert 10.10.1.50"],["pc","hsrv","tracert 10.70.1.25"],
    ["console","lapl",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route 10.70.1.0"],
    ["term","configure terminal"],["term","no ip route 10.70.1.0 255.255.255.0 10.250.70.2 100"],["term","ip route 10.70.1.0 255.255.255.0 10.250.70.2 200"],["term","end"],["term","show ip route 10.70.1.0"],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"],
    ["term","configure terminal"],["term","ip route 10.10.1.0 255.255.255.0 10.250.70.1 200"],["term","end"],["term","show ip route static"],
    ["unplug","ben:g1"],["term","show ip ospf neighbor"],["term","show ip route"],["pc","bpc","tracert 10.10.1.50"],
    ["console","lapl",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route 10.70.1.0"],
    ["plug","cat6","ben:g1","pe:g0"],["term","show ip route 10.70.1.0"],["term","copy running-config startup-config"],["term",""],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: same prefix, lower distance wins: 100 beats OSPF's 110. Task 5: a floating static stays in the configuration but out of the table while a better route exists.`)}
${K.reveal("Walkthrough — what you saw", `<p>The traceroutes disagreed: Benin → Lagos via <b>10.200.70.1</b> (PE-A), Lagos → Benin via <b>10.250.70.2</b> (4G). LOS-CE1's distance-100 &ldquo;backup&rdquo; beat OSPF's 110 permanently: asymmetric routing, a drained bundle. BEN-CE1 had no backup at all. After the fixes, unplugging the access circuit dropped the OSPF neighbour, the routes through PE-A vanished at both ends and the distance-200 statics installed.</p>`)}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"An Enugu clinic has an E-Line to the Abuja hub (OSPF) and a new satellite link from a second provider as a backup, with a floating static on each side. The E-Line's provider has an outage. Put what happens in order.", items:["The E-Line stops carrying frames and the clinic router's OSPF neighbour to Abuja goes down","The OSPF routes learned over the E-Line disappear from both routers' tables","The floating statics (distance above 110) install, pointing at the satellite link","Traffic flows over the satellite link, with about 600 ms round trips","When the E-Line returns, OSPF routes reinstall and the floating statics step aside"], why:"1. What is asked? The failover sequence on a dual-carrier site. 2. Which rule? A floating static installs only when the better route for the same prefix disappears, and steps aside when it returns. 3. Apply it: neighbour lost → OSPF routes withdrawn → floating statics install at both ends → traffic uses the backup (with GEO's latency) → recovery reverses it with no human involved."})}

<h2>Choosing a WAN</h2>
${K.remember(`<b>The rule:</b> start from the <b>traffic and the risk</b>, never from the product. <b>1.</b> Where does traffic go (hub, any-to-any, cloud)? <b>2.</b> What does it need (bandwidth, latency, jitter, symmetry)? <b>3.</b> What does an hour offline cost? <b>4.</b> What is available at each site? <b>5.</b> What does security policy demand? The answers pick the service, shape and homing.`)}
${K.when([
  ["Leased line / E-Line","Two sites, heavy steady traffic","A private, predictable wire","Many sites: a circuit per pair"],
  ["E-LAN","Many sites in one country, any-to-any, your own routing","One subnet, no circuit per pair","Sites span providers or continents"],
  ["MPLS L3VPN","Many sites, any-to-any, QoS and SLA needed","The provider routes and meshes for you","Tight budget, sites the carrier can't reach; no encryption"],
  ["Internet + VPN (lesson 3)","Cost matters, heavy cloud traffic","Cheap, everywhere, direct to the cloud","You need an end-to-end SLA"],
  ["4G / 5G","Backup, temporary or new sites","Installed in a day","The only link for heavy traffic"],
  ["Satellite","Nothing else reaches the site","Works almost anywhere","Latency-sensitive work on GEO"],
], "Which WAN service?")}
${K.case("A pharmacy chain chooses its WAN", `
<p><b>The situation:</b> 14 pharmacies and a head office running the stock and prescription system, which every till checks in real time. Staff use cloud email and supplier portals. Eleven shops can get fibre broadband; three small-town shops only DSL and 4G. Budget is tight, and the regulator requires patient data encrypted between sites.</p>
<p><b>Option A, MPLS everywhere:</b> SLA and QoS, but expensive new access circuits for the small towns, no encryption by itself, and cloud traffic still needs an internet exit.</p>
<p><b>Option B, broadband + VPN, 4G backup:</b> fibre (or DSL) primary and a 4G backup per shop, dual-carrier by construction; encrypted VPNs (lesson 3) satisfy the regulator; cloud traffic goes straight out. Head office gets dedicated internet access from one carrier and broadband from another.</p>
<p><b>The decision:</b> B. Hub-and-spoke traffic, heavy cloud use and an encryption rule that needs VPNs anyway; two carriers per shop cost less than single-homed MPLS. They accepted no end-to-end SLA and planned SD-WAN (lesson 4) to steer tills to the healthier link. With strict shop-to-shop voice, or the carrier everywhere, MPLS would have been a contender.</p>`)}
${K.job("Onne port yard — &ldquo;the system freezes and calls talk over each other&rdquo;", `
<p><b>The ticket:</b> &ldquo;Since the yard office moved, screens take 15–20 seconds to open and on calls to Lagos we talk over each other. The provider says the link is only 20% used.&rdquo;</p>
<p><b>Questions first:</b> what changed? (A new site on GEO VSAT; no fibre yet.) Capacity or delay?</p>
<ol>
<li><b>Measure, don't guess:</b> <code>ping</code> the Lagos server: 610–680 ms, no loss; <code>tracert</code> shows the delay at the hop after the satellite modem; 20% use. Not congestion.</li>
<li><b>Explain the symptoms:</b> at least 477 ms per round trip is physics; 300 ms each way makes calls feel like walkie-talkies; the application needs about 30 round trips per screen: 30 × 0.65 s ≈ 20 s.</li>
<li><b>Look for alternatives at the site:</b> good 4G coverage (35–60 ms) and a licensed LEO service; fibre is six months away.</li>
<li><b>Recommend:</b> 4G (or LEO) primary now, GEO VSAT as the backup via a floating static; fibre primary when it arrives.</li>
<li><b>Verify after the change:</b> ping 45 ms, screens about 2 s, calls normal; failover tested in a quiet hour.</li>
</ol>
<p><b>What you tell the yard manager:</b> &ldquo;The link isn't too small, it's too far: every request goes to a satellite 36,000 km up and back. 4G is about fifteen times quicker per round trip; the satellite stays as backup.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;Onne yard GEO VSAT: round trip 610–680 ms, 20% used: latency, not capacity. 4G now primary (45 ms), VSAT backup via floating static AD 200. Screens ~2 s, voice OK, failover tested. Revisit when fibre arrives.&rdquo;</p>`)}
${K.myth([
  ["MPLS encrypts your traffic, so it's as secure as a VPN.","MPLS keeps customers apart with VRFs and labels but encrypts nothing. If policy requires encryption, add IPsec on top."],
  ["A bigger satellite plan will fix slow screens on VSAT.","GEO latency (about 600 ms round trip) is distance, not bandwidth. Only a closer path (LEO, terrestrial) reduces it."],
  ["Fibre broadband is a dedicated line.","Most fibre-to-the-home is a PON: one fibre shared through a passive splitter by up to 32 or 64 customers. Dedicated internet access is a different, pricier product."],
  ["Two links means the site is redundant.","Only if they don't share a failure (same carrier, same duct) and routing actually uses the second one, in both directions."],
])}
${K.dodont([
  "Start from where the traffic goes and what an outage costs, then pick the service.",
  "Ask each carrier: shared or dedicated, symmetric or not, what SLA?",
  "Ask for access-route diversity when two carriers serve one site.",
  "Set <code>bandwidth</code> and a description with the circuit ID and CIR on every WAN interface.",
  "Test failover on purpose, in a change window, in both directions.",
],[
  "Don't buy a full mesh of circuits when E-LAN or MPLS gives any-to-any.",
  "Don't put latency-sensitive work on GEO satellite if anything closer exists.",
  "Don't assume MPLS satisfies an encryption requirement.",
  "Don't configure a &ldquo;backup&rdquo; static with a distance lower than the routing protocol it should back up.",
  "Don't run a 4G backup without a data-usage alert.",
])}
${K.exam(`Reading WAN questions: underline <b>who peers with whom</b> and <b>what is shared</b>. &ldquo;CE peers with&rdquo; → the PE. &ldquo;Keeps a routing table per customer&rdquo; → PE (VRF). &ldquo;Only label switching, no customer routes&rdquo; → P. &ldquo;Point-to-point Ethernet&rdquo; → E-Line; &ldquo;multipoint&rdquo; or &ldquo;any-to-any&rdquo; → E-LAN; &ldquo;root and leaf&rdquo; → E-Tree. &ldquo;Two connections, one provider&rdquo; → dual-homed; &ldquo;two providers&rdquo; → multihomed / dual-carrier. The usual trap: the right technology at the wrong layer, such as a CE adding labels. (The v1.1 exam lists WAN under topology architectures, 1.2.d; v2.0, from February 2027, drops that objective, but the job never will.)`)}
${K.check({q:"A company has 25 sites. Most traffic is between sites (voice and file sharing, any-to-any), voice needs QoS and a contractual SLA, and the carrier reaches every site. Which WAN service fits best?", o:["A full mesh of 300 leased lines","An MPLS Layer 3 VPN with QoS classes","Hub-and-spoke internet VPNs through the head office","GEO satellite at every site"], a:1, why:"Any-to-any traffic, QoS and an SLA, with the carrier present everywhere, is MPLS's strength: the provider does the meshing, so 25 access circuits replace 25 × 24 ÷ 2 = 300 point-to-point circuits. Hub-and-spoke VPNs would hair-pin every call; satellite adds about 600 ms."})}
<h3>Same logic, new situation</h3>
<p>A six-month field hospital at a remote site: no fibre, patchy 4G, heavy video consultations with a city hospital, and it must stay online. Choose the primary, the backup and the homing.</p>
${K.hint(`Six months rules out waiting for a fibre build. Which option gives interactive latency without cables, and what is the backup?`)}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> A temporary WAN for latency-sensitive traffic with no cable. <b>2. Which rule?</b> Start from the traffic (interactive video: low latency matters) and the risk (offline is unacceptable, so two carriers). <b>3. Apply it:</b> <b>LEO satellite</b> primary (tens of milliseconds, no cable, installed in days), <b>4G</b> from a different provider as backup (dual-carrier), GEO VSAT as a last resort if 4G is too patchy. Floating statics or costs fail over automatically; VPNs encrypt the medical data.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Name the three roles, say what each knows (routes, VRFs, labels), and finish with what it means for the customer.`)}
${K.reveal("&ldquo;Explain how an MPLS Layer 3 VPN works from the customer's point of view and inside the provider.&rdquo;", `<p>"My CE at each site peers with the provider's PE using static, OSPF or BGP, and the provider network behaves like one big router reaching all my sites, any-to-any, with an SLA and QoS. Inside, the PE keeps my routes in my VRF, so overlapping customer addresses don't matter, and exchanges them with other PEs over MP-BGP. The ingress PE pushes an inner VPN label for my VRF and an outer transport label to reach the far PE; P routers only swap the outer label and know no customer routes; the egress PE pops them and forwards a plain IP packet to my CE. And it's private by separation, not encryption, so if policy demands encryption I add IPsec."</p>`)}
${K.hint(`Give the three MEF types, what each means for subnets and OSPF neighbours, and one use for each.`)}
${K.reveal("&ldquo;What's the difference between E-Line, E-LAN and E-Tree, and how does each affect your routing design?&rdquo;", `<p>"They're the MEF services. E-Line is point-to-point, like a cable: a /30 and one neighbour, OSPF network type point-to-point. E-LAN is multipoint: one virtual switch, one subnet, any-to-any, so OSPF elects a DR and BDR. E-Tree is rooted multipoint: roots reach leaves, leaves can't reach each other, so on a shared subnet I give the leaves priority 0 so only a root can be DR. In all three the port speed isn't the service rate, so I set bandwidth to the CIR."</p>`)}
${K.hint(`Talk about shape, homing, diversity and making routing use the backup, in both directions, with a test.`)}
${K.reveal("&ldquo;A branch has to stay up even if a carrier fails. How do you design and prove its WAN?&rdquo;", `<p>"Two carriers, because dual-homing to one doesn't survive a carrier-wide outage: say MPLS from one and 4G from the other, with their access routes checked so they don't share a duct. Then routing at both ends: the backup is a floating static with a distance above the protocol's, or a higher cost, so return traffic fails over too, plus usage alerts on the 4G bundle. Then I prove it in a change window: pull the primary, check routing tables and traceroutes from both sides and the applications, restore it and confirm the primary takes back over."</p>`)}

${K.recap([
  "What the provider hands you (a wire, an Ethernet network, a routed network or the internet) decides who your routers peer with.",
  "Leased lines grew from TDM: DS0 = 64 kb/s, E1 = 2.048 Mb/s, T1 = 1.544 Mb/s; serial links ran Cisco HDLC (default) or PPP (standard, with authentication).",
  "E-Line point-to-point, E-LAN any-to-any on one subnet, E-Tree root-to-leaf only. Port speed isn't the CIR: set bandwidth.",
  "MPLS L3VPN: CE routes normally, no labels; PE keeps a VRF per customer and pushes/pops labels; P swaps outer labels, no customer routes. Private by separation, not encryption.",
  "DSL is distance-sensitive and asymmetric, cable and PON are shared, 4G/5G installs fast, GEO satellite costs about 600 ms per round trip (4 × 35,786 km), LEO tens of ms.",
  "Shape follows the traffic; homing (single, dual-homed, dual-carrier) follows the cost of an outage.",
  "A backup works only if routing uses it both ways: a floating static's distance must be above the protocol's (200 over OSPF's 110).",
])}
${K.next(`<b>Lesson 3 — Internet VPNs and tunnels.</b> Turning internet links into a private WAN: GRE (a packet inside a packet), its 24-byte overhead and 1476-byte MTU, GRE over IPsec and ${K.g("DMVPN","Dynamic Multipoint VPN: Cisco's way of building branch-to-branch tunnels on demand (lesson 3).")}. Benches: build a GRE tunnel with OSPF over it, then fix one that won't come up.`)}
`,
quiz:[
  {lvl:1, q:"In an MPLS Layer 3 VPN, which router is owned by the customer and never sees MPLS labels?", o:["P","PE","CE","Route reflector"], a:2, why:"The CE (customer edge) is the customer's router. It routes normally with the PE (static, OSPF, EIGRP or BGP). Labels are pushed and removed by the PEs and swapped by the P routers."},
  {lvl:1, type:"match", q:"Match each Metro Ethernet service with its description.", pairs:[["E-Line","Point-to-point between two sites"],["E-LAN","Multipoint: every site can reach every other site"],["E-Tree","Rooted multipoint: roots reach leaves, leaves cannot reach each other"]], why:"These are the MEF service types. E-Line acts like a cable, E-LAN like one big switch, and E-Tree enforces hub-and-spoke."},
  {lvl:1, type:"fill", q:"How many kb/s does one DS0 channel carry, and what is the full E1 rate in Mb/s?", fields:[{label:"DS0 (kb/s)", a:["64","64 kb/s","64kbps","64 kbps"]},{label:"E1 (Mb/s)", a:["2.048","2.048 Mb/s","2.048mbps","2.048 mbps"]}], why:"A DS0 is one 64 kb/s voice channel (8,000 samples a second × 8 bits). An E1 has 32 time slots: 32 × 64 kb/s = 2.048 Mb/s."},
  {lvl:1, q:"What is the default encapsulation on a Cisco router's serial interface?", o:["PPP","Cisco HDLC","Ethernet II","PPPoE"], a:1, why:"Cisco serial interfaces default to Cisco's HDLC, which adds a proprietary type field, so it needs a peer that speaks Cisco HDLC, in practice usually another Cisco router. PPP is the open standard you configure with encapsulation ppp."},
  {lvl:1, q:"Which broadband technology uses unpowered optical splitters to share one fibre among many customers?", o:["DSL","Cable (DOCSIS)","PON","LTE"], a:2, why:"A passive optical network splits one fibre from the provider's OLT among up to 32 or 64 ONTs using passive splitters. DSL uses telephone copper, cable uses coax, LTE uses radio."},
  {lvl:1, type:"multi", q:"Which two statements about a geostationary (GEO) satellite WAN link are true? (Choose two.)", o:["Round-trip times are typically around 550–700 ms","Its latency falls if you buy more bandwidth","Heavy rain can weaken or interrupt the signal","It is the lowest-latency WAN option","Its satellites orbit about 550 km up"], a:[0,2], why:"A GEO satellite is 35,786 km up, so a round trip crosses about 143,000 km (at least 477 ms) plus equipment delay. Rain fade affects the high frequencies VSAT uses. More bandwidth doesn't shorten the distance; around 550 km is a LEO orbit."},
  {lvl:2, q:"Which statement about an MPLS P router is correct?", o:["It keeps a VRF for each customer attached to it","It forwards packets by swapping the outer label and holds no customer routes","It exchanges routes with the customer's CE router using OSPF","It encrypts customer traffic between PE routers"], a:1, why:"A P (provider core) router has no customer-facing ports. It looks only at the outer label, swaps it and forwards, which is why it needs no customer routes. VRFs and CE peering are PE jobs; MPLS doesn't encrypt."},
  {lvl:2, type:"order", q:"Order what happens to a customer packet crossing an MPLS L3VPN from one site to another.", items:["The CE forwards an ordinary IP packet to its PE","The ingress PE looks in the customer's VRF and pushes a VPN label and a transport label","P routers swap the outer transport label hop by hop","The egress PE removes the labels and uses the VPN label to pick the customer's VRF","The egress PE forwards a plain IP packet to the far CE"], why:"Labels exist only inside the provider network: pushed at the ingress PE (inner VPN label + outer transport label), swapped by P routers, removed at the egress PE, which uses the VPN label to choose the right customer's table."},
  {lvl:2, q:"Ten branch routers connect to one E-LAN service, all in 10.255.9.0/24, running OSPF on that interface with default settings. What will show ip ospf neighbor on a router that is neither DR nor BDR show?", o:["Nine neighbours, all FULL","Two neighbours FULL (the DR and BDR) and seven in 2WAY/DROTHER","One neighbour FULL/  -","No neighbours, because E-LAN doesn't carry multicast"], a:1, why:"An E-LAN is one broadcast segment, so OSPF uses the broadcast network type and elects a DR and BDR. A DROTHER goes FULL with those two and stays 2WAY with the other seven DROTHERs (Module 5)."},
  {lvl:2, q:"The exhibit is from a branch router whose G0/1 is a 1 Gb/s port carrying a 100 Mb/s Metro Ethernet service. Users report the WAN is slow, but the monitoring graph shows the link 9% used. What is the best explanation and fix?", ex:"BR1-R1#show interfaces g0/1\nGigabitEthernet0/1 is up, line protocol is up\n  Hardware is Gigabit Ethernet, address is 0c1a.2b00.0011 (bia 0c1a.2b00.0011)\n  Description: CARRIER-A E-LINE circuit BR1-EL-0090\n  Internet address is 10.255.30.2/30\n  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,\n     reliability 255/255, txload 23/255, rxload 24/255\n  Encapsulation ARPA, loopback not set\n  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX", o:["The port is faulty; replace the cable","The router measures use against 1 Gb/s, but the service is 100 Mb/s, so about 90 Mb/s of traffic is a full service; set bandwidth 100000 so graphs and OSPF reflect the CIR","The duplex is wrong; set it to half","The provider is giving more than 100 Mb/s, so nothing is wrong"], a:1, why:"txload 23/255 of 1 Gb/s is about 90 Mb/s: almost all of the 100 Mb/s CIR, so the provider is dropping the excess. The router can't know the contract; bandwidth 100000 makes load figures, monitoring and OSPF cost match what was bought. bandwidth never changes the port speed."},
  {lvl:2, type:"multi", q:"A site has an MPLS circuit and a 4G backup from a different operator. Which two failures can it survive that a dual-homed site (two links, one carrier) cannot? (Choose two.)", o:["The MPLS carrier's whole network failing","A single access cable being cut","The MPLS carrier's billing system suspending the account","The site's only router losing power","The branch LAN switch failing"], a:[0,2], why:"A second carrier protects against anything that takes out the first carrier as a whole: a network-wide outage or an account problem. A dual-homed site already survives a single cut cable. A single router or LAN switch failing breaks both designs."},
  {lvl:3, q:"The exhibit is from LOS-CE1, which learns the Abuja branch LAN 10.80.1.0/24 by OSPF through the carrier's PE. A 4G backup link to the branch was added last week. Since then the 4G data bundle drains quickly although the MPLS circuit is up. What is wrong?", ex:"LOS-CE1#show ip route 10.80.1.0\nRouting entry for 10.80.1.0/24\n  Known via \"static\", distance 90, metric 0\n  Routing Descriptor Blocks:\n  * 10.250.80.2\n      Route metric is 0, traffic share count is 1", o:["Nothing; static routes are always preferred, which is correct for a backup","The backup static has distance 90, lower than OSPF's 110, so it wins and all Lagos-to-Abuja traffic uses 4G; it needs a distance above 110, such as 200","OSPF has failed on the MPLS circuit","The 4G link should be added to OSPF with network 10.250.80.0 0.0.0.3 area 0 to fix it"], a:1, why:"For the same prefix, the lower administrative distance wins. A floating static must have a distance higher than the route it backs up: above 110 for OSPF. With 90 it is the primary, so return traffic rides 4G (asymmetric routing) and drains the bundle."},
  {lvl:3, q:"A company has a head office and 18 branches. Branch traffic is almost all to head office, the budget is tight, staff use cloud applications heavily, and the security team requires encryption between sites. Which design fits best?", o:["A full mesh of E-Lines: 171 circuits","An MPLS L3VPN alone, because it is private","Internet broadband at each site with encrypted VPNs to head office, plus a 4G backup per branch","GEO satellite at every branch for independence from cables"], a:2, why:"Hub-oriented traffic, a tight budget, heavy cloud use and an encryption requirement all point to internet + VPN (lesson 3), with 4G from another operator as a cheap second carrier. A full mesh is 19 × 18 ÷ 2 = 171 circuits for traffic that goes to one place; MPLS alone doesn't encrypt; GEO adds about 600 ms."},
  {lvl:3, q:"A retail chain wants its 30 shops to reach the head office but never each other, and the provider offers Metro Ethernet. The team plans one shared subnet and OSPF in its default network type. What should they do to avoid an OSPF problem?", o:["Nothing; OSPF works the same on every Ethernet service","Use E-LAN instead and rely on ACLs","Use E-Tree with head office as root, and give every shop router ip ospf priority 0 so a leaf can never become the DR","Use E-Tree and set every shop router's priority to 255"], a:2, why:"E-Tree enforces root-to-leaf only, matching the requirement. But leaves can't hear each other, so if a leaf were elected DR the other leaves couldn't use it. Priority 0 on the leaves leaves only the head-office root eligible. Priority 255 would make leaves more likely to win."},
  {lvl:3, type:"fill", q:"A ping across a link through a satellite 20,000 km up (directly overhead) has to cross the dish-satellite distance four times. Ignoring equipment delay and using 300,000 km/s, what is the minimum round-trip time in milliseconds?", fields:[{label:"Round trip (ms)", a:["267","266.7","266","270","about 267","~267"]}], why:"4 × 20,000 km = 80,000 km. 80,000 ÷ 300,000 = 0.267 s ≈ 267 ms. The same method gives about 477 ms for GEO (35,786 km) and a few tens of ms for LEO; real links add equipment and queueing delay on top."},
],
cards:[
  {f:"The first question for any WAN service", b:"What does the provider hand you? A wire (leased line, E-Line): your routers peer directly. An Ethernet network (E-LAN): one shared subnet. A routed network (MPLS L3VPN): you peer with the PE. The internet (broadband, 4G, satellite): add a VPN for privacy."},
  {f:"CPE, demarc, access circuit", b:"CPE: customer premises equipment (your router, the provider's modem or terminal). Demarc: where the provider's responsibility ends. Access circuit (local loop, last mile): the link from your building to the provider's point of presence."},
  {f:"Leased-line arithmetic", b:"DS0 = 64 kb/s (one phone call: 8,000 samples × 8 bits). E1 = 32 × 64 = 2.048 Mb/s (Europe, Africa). T1 = 24 × 64 + 8 kb/s framing = 1.544 Mb/s (US; Cisco serial default BW 1544). Fractional = some of the slots."},
  {f:"HDLC vs PPP", b:"Cisco HDLC: the default on Cisco serial interfaces, proprietary type field, meant for Cisco-to-Cisco links (other vendors may not speak it). PPP (RFC 1661): open standard, works between vendors, optional PAP or CHAP authentication. Mismatched encapsulation: interface up, line protocol down."},
  {f:"E-Line, E-LAN, E-Tree", b:"MEF Metro Ethernet services. E-Line: point-to-point (EPL whole port, EVPL several VLAN-tagged circuits on one port). E-LAN: multipoint, any-to-any, one subnet, OSPF DR/BDR. E-Tree: rooted multipoint, leaves can't reach each other."},
  {f:"UNI, EVC, CIR", b:"UNI: the Ethernet port where the provider hands you the service (the demarc). EVC: the provider's logical connection between UNIs. CIR: the guaranteed rate you bought (e.g. 100 Mb/s on a 1 Gb/s port); the provider polices above it. Set bandwidth to the CIR."},
  {f:"MPLS L3VPN roles", b:"CE: customer router, routes normally with the PE, never sees labels. PE: provider edge, a VRF per customer, MP-BGP to other PEs, pushes and pops labels. P: provider core, swaps the outer label only, holds no customer routes."},
  {f:"MPLS labels", b:"A 4-byte shim between Layer 2 and Layer 3 ('Layer 2.5'): 20-bit label, 3-bit traffic class, bottom-of-stack bit, 8-bit TTL. L3VPN uses two: an outer transport label (to reach the far PE) and an inner VPN label (which customer VRF). Private by separation, not encryption."},
  {f:"DSL, cable, PON", b:"DSL: telephone copper to a DSLAM; speed falls with distance; ADSL asymmetric; often PPPoE (MTU 1492). Cable: DOCSIS over HFC to a CMTS; coax shared per node. PON: OLT, passive splitter (1:32/1:64), ONT; GPON 2.488/1.244 Gb/s shared."},
  {f:"4G / 5G as WAN", b:"A router with an LTE or 5G modem and SIM. Installed in a day, independent of cables: the classic backup and temporary-site link. Shared radio cell, variable throughput and latency, data caps. Private APN delivers SIM traffic into your own network; 5G FWA replaces a cable."},
  {f:"Satellite latency", b:"GEO: 35,786 km up; round trip = 4 × 35,786 km ≈ 143,000 km ≈ 477 ms minimum, typically 550–700 ms. LEO: a few hundred to ~2,000 km, tens of ms. Rain fade on Ku/Ka bands. Latency hurts voice and chatty apps whatever the bandwidth."},
  {f:"Single-homed, dual-homed, dual-carrier", b:"Single-homed: one link, one provider, survives nothing. Dual-homed: two links, one provider, survives a cut cable or dead router but not a carrier outage. Dual-carrier / multihomed: two providers. Check access-route diversity."},
  {f:"Making a backup link work", b:"Routing must use it, in both directions. A floating static needs a distance above the route it backs up (above 110 for OSPF, e.g. 200); or give the backup a higher OSPF cost via bandwidth. A lower distance makes the 'backup' the primary."},
  {f:"Choosing a WAN: five questions", b:"1. Where does traffic go? 2. What does it need (bandwidth, latency, jitter, symmetry)? 3. What does an hour offline cost? 4. What is available at each site? 5. What does security policy demand? The answers pick the service, the shape and the homing."},
],
});

// ---------- Module 10 · Lesson 3 ----------
L.push({
id:"wan-vpn", mins:115, level:"Intermediate · builds on Module 5 (OSPF, statics), Module 8 lesson 3 (IPsec) and Module 10 lesson 2",
t:"Internet VPNs and tunnels — GRE (a packet inside a packet), its MTU, OSPF over a tunnel, recursive routing, GRE over IPsec and DMVPN",
html:`
${K.goals([
  "Explain why private addresses and routing protocols can't cross the internet on their own, and how a tunnel fixes both.",
  "Draw a GRE packet (outer IP header, 4-byte GRE header, original packet), and calculate the tunnel MTU and TCP MSS for any underlay.",
  "Configure a GRE tunnel on IOS, predict whether its line protocol is up or down, and run OSPF across it.",
  "Diagnose a tunnel that is down or flapping: wrong destination, keepalives, recursive routing — and fix it.",
  "Say when to use plain GRE, GRE over IPsec, an IPsec VTI, DMVPN or a remote-access VPN.",
])}
${K.pre([
  "Module 5: static and default routes, longest match, OSPF neighbours, network types, cost and <code>bandwidth</code>, traceroute.",
  "Module 7: private addresses and NAT/PAT. Module 8: IPsec and remote-access VPNs (lesson 3), ACLs (lessons 4–5).",
  "Module 10 lesson 2: internet access types, PPPoE's 1492-byte MTU, and why an internet WAN needs a VPN.",
])}

<h2>Why this matters at work</h2>
<p>A microfinance bank's MPLS contract to its eleven branches ends in March; the board has approved broadband plus 4G backup at every branch, like lesson 2's pharmacy case. Your manager says: &ldquo;The branches still need to reach the core-banking servers on 10.10.0.0/16, OSPF must keep learning new branch subnets by itself, and audit wants it encrypted. Build a pilot to Ibadan this week.&rdquo;</p>
<p>The internet carries packets between the routers' <b>public</b> addresses but drops anything addressed to 10.x. The fix is a <b>tunnel</b>. This lesson builds one (GRE), runs OSPF across it, breaks it the two ways that fill real tickets, then adds encryption (GRE over IPsec) and scale (DMVPN).</p>

<h2>Why tunnel? Private addresses and routing protocols across the internet</h2>
${K.remember(`<b>The rule:</b> the internet routes only <b>public unicast</b>. Your LANs use <b>private</b> addresses and OSPF uses <b>multicast</b> hellos. A tunnel puts your whole packet inside a new one <b>from one router's public address to the other's</b>; the far router unwraps it and finds your original packet.`)}
<p>Without a tunnel: HQ-R1 in Lagos has LAN 10.1.0.0/24 and internet address 203.0.113.2; IBD-R1 in Ibadan has LAN 10.2.0.0/24 and 198.51.100.2 from another ISP. Each has a default route to its ISP. HQ-PC1 pings IBD-PC1:</p>
${K.out(`C:\\>ping 10.2.0.10

Pinging 10.2.0.10 with 32 bytes of data:
Reply from 203.0.113.1: Destination host unreachable.
Reply from 203.0.113.1: Destination host unreachable.`, "The lab's output (trimmed to two replies). 203.0.113.1 is HQ's ISP router: it has no route to 10.2.0.0/24, and no ISP ever will.")}
<p>Two separate problems hide in that one failure:</p>
<ul>
<li><b>Addressing.</b> 10.0.0.0/8 is private (Module 7): thousands of companies use 10.2.0.0/24, so no ISP routes it. PAT lets HQ's traffic <i>leave</i> as 203.0.113.2, but nothing can send a packet <i>to</i> 10.2.0.10.</li>
<li><b>Routing protocols.</b> OSPF hellos go to multicast 224.0.0.5 with TTL 1 (Module 5) and never pass the first router.</li>
</ul>
<p>A tunnel turns the internet into one virtual cable. Two words name the layers (lesson 4 and Module 11 reuse them): the ${K.g("underlay","The real network that carries a tunnel's packets — here, the internet between the two routers' public addresses.")} is the real network the tunnel crosses; the ${K.g("overlay","The virtual network built on top of the underlay: tunnel interfaces, their addresses and everything routed across them.")} is the virtual network on top: the tunnel interfaces, their own small subnet (172.16.0.0/30), your LANs and OSPF.</p>
${K.svg("0 0 760 300",
  K.band(10,8,200,24,"LAGOS HQ")+K.band(250,8,260,24,"INTERNET · UNDERLAY")+K.band(550,8,200,24,"IBADAN BRANCH")+
  K.dev("router",110,96,"HQ-R1","G0/1 203.0.113.2")+K.dev("cloud",380,98,"","")+K.txt(380,134,"ISP1 · ISP2",{mid:true,c:"fg",f:"body",s:11})+K.dev("router",650,96,"IBD-R1","G0/1 198.51.100.2")+
  K.link(136,98,352,98)+K.link(408,98,624,98)+
  `<path d="M110,72 C 250,60 510,60 650,72" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="7 4"/>`+
  K.txt(380,52,"Tunnel0 · 172.16.0.0/30 · OVERLAY",{mid:true,c:"accent",s:10.5,b:true})+
  K.txt(20,170,"What actually crosses the internet when HQ-PC1 (10.1.0.10) pings IBD-PC1 (10.2.0.10):",{c:"fg",f:"body",s:11.5,b:true})+
  K.band(20,184,250,28,"new IP 203.0.113.2→198.51.100.2","var(--panel2)")+K.band(270,184,60,28,"GRE","var(--panel2)")+K.band(330,184,230,28,"orig IP 10.1.0.10→10.2.0.10")+K.band(560,184,110,28,"ICMP data")+
  K.txt(145,230,"20 bytes · protocol 47 · ISPs route on this",{mid:true,f:"body",s:10})+K.txt(300,246,"4 bytes",{mid:true,f:"body",s:10})+K.txt(445,230,"your original packet, untouched",{mid:true,f:"body",s:10})+
  K.txt(380,270,"The ISPs see only public addresses. IBD-R1 removes the outer header and routes the original packet.",{mid:true,c:"fg",f:"body",s:11})+
  K.txt(380,290,"Underlay = the network that carries the tunnel. Overlay = the tunnel and what runs over it.",{mid:true,f:"body",s:11}),
  "A packet inside a packet: the outer header crosses the internet; the inner one is yours.")}
${K.analogy(`A letter for &ldquo;Room 4, Accounts&rdquo; goes inside an envelope with the company's street address. The post office reads only the envelope; the company's post room opens it and delivers by room number. &ldquo;Room 4&rdquo; means nothing to the post office, as 10.2.0.10 means nothing to an ISP.`)}
<p>The routers then behave as if a cable joined their Tunnel0 interfaces: a <b>virtual point-to-point link</b>.</p>
${K.check({q:"A Kano branch with LAN 10.21.0.0/24 and internet address 198.51.100.130 wants to reach the Lagos LAN 10.10.0.0/24 over the internet. Which address does the Lagos ISP route on when a branch PC's packet crosses a GRE tunnel?", o:["10.10.0.x, the destination PC","The Lagos router's public address, in the outer header","224.0.0.5, the OSPF multicast group","The tunnel interface's 172.x address"], a:1, why:"The ISPs see only the outer header, between the two routers' public addresses. The 10.x addresses ride inside; the tunnel subnet exists only on the two routers."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"An Abuja clinic and a Kaduna clinic, each on broadband with one public address, want to run OSPF between their routers and share 10.x LANs. A colleague suggests three alternatives to a tunnel. Which two would fail, and why? (Choose two.)", o:["Ask both ISPs to route 10.x between the clinics","Configure OSPF on the internet-facing interfaces and wait for a neighbour","Build a GRE tunnel between the two public addresses and run OSPF on the tunnel","Use an IPsec VTI between the two public addresses"], a:[0,1], why:"1. What is asked? Which ideas can't carry private addresses and OSPF across the internet. 2. Which rule? The internet routes only public unicast; OSPF hellos are multicast with TTL 1. 3. Apply it: no ISP will route private space (thousands of customers use it), and OSPF hellos die at the first ISP router, so options 1 and 2 fail. GRE wraps both in public unicast; a VTI (Module 8) is a routable IPsec tunnel interface that can carry OSPF too."})}

<h2>GRE: a packet inside a packet, and what it costs</h2>
${K.remember(`<b>The rule:</b> GRE adds <b>24 bytes</b>: a new <b>20-byte IPv4 header</b> (tunnel source → destination, <b>protocol 47</b>) plus a <b>4-byte GRE header</b>, and <b>no encryption</b>. So the tunnel carries 1500 − 24 = <b>1476</b> bytes, and anyone on the path can read the inner packet.`)}
<p>Module 8 met ${K.g("GRE","Generic Routing Encapsulation (RFC 2784): wraps any packet in a new IP header plus a 4-byte GRE header, IP protocol 47. No encryption.")} briefly. The router takes the original packet whole and puts two headers in front:</p>
<ol>
<li><b>The GRE header, 4 bytes:</b> flags (zero by default), version 0 and a 16-bit <b>Protocol Type</b>, 0x0800 for IPv4 (Ethernet's EtherType). That field makes GRE &ldquo;generic&rdquo;: IPv4, IPv6, multicast, anything. Optional checksum, key and sequence-number fields add 4 bytes each.</li>
<li><b>A new IPv4 header, 20 bytes:</b> from the <b>tunnel source</b> to the far router (the <b>tunnel destination</b>), protocol <b>47</b> (as ESP is 50).</li>
</ol>
<p>The far router checks that one of its tunnels expects GRE from that source, removes the outer 24 bytes and routes the original packet as if it arrived on its Tunnel0. The lab's frame log:</p>
${K.out(`GRE encapsulation on HQ-R1 Tunnel0: the original packet 10.1.0.10 → 10.2.0.10 goes inside a NEW IP header 203.0.113.2 → 198.51.100.2, protocol 47 (GRE) — +24 bytes (20 outer IP + 4 GRE). The routers in between see only the outer header.
  ISP1 received it on Gi0/1, decrements TTL to 254 and routes it
  ...
GRE decapsulation on IBD-R1: the outer header 203.0.113.2 → 198.51.100.2 matches Tunnel0 (its source 198.51.100.2, destination 203.0.113.2) — the outer header is removed and the original packet arrives on Tunnel0`, "The lab's frame log for one ping, shortened.")}
<h3>What that means for TTL and traceroute</h3>
<p>The ISP routers decrement only the <b>outer</b> TTL. The inner packet loses one at HQ-R1 and one at IBD-R1, so the reply arrives with <code>TTL=126</code>, as if a cable joined the routers. Traceroute agrees: the internet path is <b>one hop</b>, the far tunnel address:</p>
${K.out(`C:\\>tracert 10.2.0.10

Tracing route to 10.2.0.10 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  10.1.0.1
  2    <1 ms    <1 ms    <1 ms  172.16.0.2
  3    <1 ms    <1 ms    <1 ms  10.2.0.10

Trace complete.`, "The lab's tracert from HQ-PC1. 172.16.0.2 is IBD-R1's Tunnel0; real internet times would be tens of milliseconds.")}
<h3>No encryption, and no ports</h3>
<p>Anyone capturing packets on the path can read the inner packet, so real internet WANs add IPsec (later). And GRE has <b>no port numbers</b>, so PAT (Module 7) often can't translate it: endpoints normally sit on public addresses, as in the labs.</p>
${K.mistake(`Forgetting the edge ACL. One that permits only TCP and UDP drops <b>protocol 47</b> and the tunnel silently carries nothing. Name it: <code>permit gre host 198.51.100.2 host 203.0.113.2</code> (the lab logs a denied GRE packet as <code>denied 47</code>).`)}
<h3>The MTU: why 1476, and why engineers set 1400</h3>
<p>The ${K.g("MTU","Maximum transmission unit: the largest IP packet a link can carry without splitting it — 1500 bytes on Ethernet.")} of an Ethernet underlay is 1500 bytes. The outer packet must fit, and 24 bytes are new headers, so the original packet can be at most <b>1500 − 24 = 1476</b> bytes: <code>Tunnel transport MTU 1476 bytes</code> in <code>show interfaces tunnel 0</code>, <code>MTU is 1476 bytes</code> in <code>show ip interface Tunnel0</code>.</p>
<p>A 1500-byte packet from a PC is then either split (${K.g("fragmentation","Splitting an IP packet that is too big for the next link into smaller pieces, which the destination reassembles. Slow and fragile.")}, costing CPU and doubling the packets) or, if the sender set the ${K.g("DF bit","Don't Fragment: an IPv4 header flag telling routers to drop a too-big packet (and report it by ICMP) instead of splitting it.")}, dropped with an ICMP &ldquo;fragmentation needed&rdquo; reply so the sender shrinks its packets (${K.g("PMTUD","Path MTU discovery: hosts send with DF set and shrink their packets when a router reports, by ICMP, that one was too big.")}). If a firewall blocks that ICMP, big packets vanish silently: <b>pings work, but web pages and file transfers hang</b>.</p>
<p>The cleanest fix makes TCP send smaller segments. The ${K.g("MSS","Maximum segment size: the largest TCP payload a host will accept in one segment, announced in the SYN. MSS = IP MTU − 40 (20 IP + 20 TCP).")} is the most TCP data one segment may carry: <b>MSS = MTU − 40</b> (20 IP + 20 TCP). Two tunnel commands:</p>
${K.steps([
  ["<code>ip mtu 1400</code>", "The largest packet the router sends into the tunnel. Cisco recommends 1400 for GRE: it leaves room for IPsec too."],
  ["<code>ip tcp adjust-mss 1360</code>", "The router rewrites the MSS in TCP connection-setup (SYN) packets crossing the tunnel, so both ends send at most 1360 bytes of data."],
  ["Plain GRE, or a smaller underlay", "Without IPsec 1476 is enough (MSS 1436). On PPPoE DSL (MTU 1492, lesson 2): 1468, MSS 1428."],
])}
${K.svg("0 0 760 250",
  K.txt(20,22,"One full-size packet on an Ethernet underlay (IP MTU 1500), carrying a GRE tunnel",{c:"fg",f:"body",s:12,b:true})+
  K.band(20,38,90,30,"outer IP","var(--panel2)")+K.band(110,38,60,30,"GRE","var(--panel2)")+K.band(170,38,90,30,"inner IP")+K.band(260,38,70,30,"TCP")+K.band(330,38,410,30,"TCP data ≤ 1436 (the MSS)")+
  K.txt(65,86,"20",{mid:true,f:"body",s:10.5})+K.txt(140,86,"4",{mid:true,f:"body",s:10.5})+K.txt(215,86,"20",{mid:true,f:"body",s:10.5})+K.txt(295,86,"20",{mid:true,f:"body",s:10.5})+
  `<line x1="20" y1="98" x2="170" y2="98" stroke="var(--warn)" stroke-width="1.5"/><line x1="170" y1="98" x2="740" y2="98" stroke="var(--accent)" stroke-width="1.5"/>`+
  K.txt(95,114,"24 bytes of GRE overhead",{mid:true,c:"warn",f:"body",s:10.5})+K.txt(455,114,"the original packet: at most 1500 − 24 = 1476 bytes (tunnel IP MTU)",{mid:true,c:"accent",f:"body",s:10.5})+
  K.txt(20,150,"The same tunnel with ip mtu 1400 and ip tcp adjust-mss 1360 (room left for IPsec):",{c:"fg",f:"body",s:11.5,b:true})+
  K.band(20,162,90,30,"outer IP","var(--panel2)")+K.band(110,162,60,30,"GRE","var(--panel2)")+K.band(170,162,90,30,"inner IP")+K.band(260,162,70,30,"TCP")+K.band(330,162,330,30,"TCP data ≤ 1360")+K.band(660,162,80,30,"spare","var(--chip)")+
  K.txt(380,222,"MSS = IP MTU − 40 (20 IP + 20 TCP):  1476 → 1436   ·   1400 → 1360   ·   1468 → 1428",{mid:true,c:"fg",f:"body",s:11})+
  K.txt(380,242,"Bar widths are not to scale: the data field is really about 60 times wider than a header.",{mid:true,f:"body",s:10}),
  "Where 1476, 1436, 1400 and 1360 come from. The lab shows ip mtu and adjust-mss but doesn't simulate packet sizes.")}
${K.tip(`On a real Windows PC, <code>ping -f -l 1472 10.2.0.10</code> sets Don't Fragment with a 1472-byte payload. The largest size that gets replies is the path MTU − 28 (20 IP + 8 ICMP): 1472 on a clean 1500 path, 1448 through a default GRE tunnel.`)}
${K.check({q:"A tunnel runs over an underlay whose IP MTU is 1500. Without any ip mtu command, what is the largest original packet the tunnel can carry without fragmenting, and what TCP MSS fits it?", o:["1500 and 1460","1476 and 1436","1476 and 1460","1400 and 1360"], a:1, why:"1500 − 24 (20 outer IP + 4 GRE) = 1476; MSS = 1476 − 40 = 1436. 1400/1360 is the setting that leaves room for IPsec."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A GRE tunnel is configured with the optional 4-byte GRE key field, over a provider link whose IP MTU is 1500. What tunnel IP MTU and TCP MSS should you expect?", fields:[{label:"Tunnel IP MTU (bytes)", a:["1472"]},{label:"TCP MSS (bytes)", a:["1432"]}], why:"1. What is asked? The room left inside the tunnel, then the TCP payload. 2. Which rule? Tunnel MTU = underlay MTU − every byte of encapsulation; MSS = MTU − 40. 3. Apply it: the overhead is 20 (outer IP) + 4 (GRE) + 4 (key) = 28, so 1500 − 28 = 1472; then 1472 − 40 = 1432."})}
${K.drill({title:"GRE — MTU and MSS for any underlay", types:["gremtu"], count:5})}

<h2>Configuring a GRE tunnel, and when it is up</h2>
${K.remember(`<b>The rule:</b> a tunnel is an interface with an <b>IP address</b> (overlay subnet), a <b>tunnel source</b> (your public interface) and a <b>tunnel destination</b> (the far public address); the far router is the <b>mirror image</b>. Its line protocol comes up when the source is up with an address and the destination is <b>routable</b>. The far end needn't answer, unless keepalives are on.`)}
<h3>Worked example: HQ-R1 (Lagos) to IBD-R1 (Ibadan)</h3>
${K.steps([
  ["Plan the overlay", "A small private subnet used nowhere else for the two tunnel interfaces: 172.16.0.0/30 (HQ-R1 .1, IBD-R1 .2), the &ldquo;cable&rdquo; between them."],
  ["Note the underlay", "HQ-R1's internet interface is G0/1, 203.0.113.2; IBD-R1's is G0/1, 198.51.100.2. Each has a default route to its ISP, so each can route to the other's public address."],
  ["Configure HQ-R1", "<code>interface Tunnel0</code> creates the interface. Then <code>ip address 172.16.0.1 255.255.255.252</code>, <code>tunnel source GigabitEthernet0/1</code> (an interface or one of the router's own addresses) and <code>tunnel destination 198.51.100.2</code>."],
  ["Configure IBD-R1, the mirror image", "<code>ip address 172.16.0.2 255.255.255.252</code>, <code>tunnel source GigabitEthernet0/1</code>, <code>tunnel destination 203.0.113.2</code>: source and destination swap."],
  ["Route across it", "A static such as <code>ip route 10.2.0.0 255.255.255.0 Tunnel0</code> on HQ-R1 (and the reverse), or OSPF on the tunnel subnet (next section)."],
])}
${K.out(`HQ-R1(config)#interface Tunnel0
%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down
HQ-R1(config-if)#ip address 172.16.0.1 255.255.255.252
HQ-R1(config-if)#tunnel source GigabitEthernet0/1
HQ-R1(config-if)#tunnel destination 198.51.100.2
%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to up`, "HQ-R1's side in the lab, with the timestamps trimmed from the % lines (the lab and real IOS both print them). Up the moment the destination was set, before IBD-R1 was configured.")}
<p><code>tunnel mode gre ip</code> is the default, so the running-config never shows it. Other modes (multipoint GRE for DMVPN, <code>ipsec ipv4</code> for a VTI) come later; the lab builds point-to-point GRE only.</p>
<h3>Reading show interfaces tunnel 0</h3>
${K.out(`HQ-R1#show interfaces tunnel 0
Tunnel0 is up, line protocol is up
  Hardware is Tunnel
  Internet address is 172.16.0.1/30
  MTU 9976 bytes, BW 100 Kbit/sec, DLY 50000 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation TUNNEL, loopback not set
  Keepalive not set
  Tunnel source 203.0.113.2 (GigabitEthernet0/1), destination 198.51.100.2
  Tunnel protocol/transport GRE/IP
  ...
  Tunnel transport MTU 1476 bytes`, "The lab's output, trimmed to the lines worth reading (the lab prints more lines, modelled on IOS XE; exact sub-lines vary by version).")}
<ul>
<li><b>up, line protocol is up</b>: administrative state, then the tunnel's own test (below).</li>
<li><b>MTU 9976 … BW 100 Kbit/sec</b>: 9976 is a buffer figure, not what the tunnel carries (IOS 15 prints 17912); 100 Kbit/s is the default bandwidth, whatever the link gives. It matters to OSPF.</li>
<li><b>Keepalive not set</b>: nobody checks the far end.</li>
<li><b>Tunnel source … destination</b>: the outer header. Read it first in any tunnel ticket.</li>
</ul>
<p>The short view, <code>show ip interface brief</code>: <code>Tunnel0  172.16.0.1  YES manual up  up</code>.</p>
<h3>The line-protocol rules</h3>
<p>A tunnel has no far end to hear, so IOS checks local facts (from Cisco's GRE troubleshooting note; the lab follows them):</p>
${K.steps([
  ["The tunnel isn't shut", "<code>shutdown</code> on Tunnel0 gives administratively down / down."],
  ["The source is usable", "Up/up with an IP address. Missing, down, or an address the router doesn't own: <code>Tunnel0 is up, line protocol is down</code>."],
  ["A destination is set", "No <code>tunnel destination</code>: down."],
  ["The destination is routable", "Some route to it, and the <b>default route counts</b>. It needn't answer, only be routable."],
  ["The route doesn't point into the tunnel itself", "Otherwise the tunnel would need itself to work: recursive routing (next section)."],
])}
<p>Not on the list: the far router. Without keepalives HQ-R1's tunnel is up/up while IBD-R1 is unconfigured, off or misaddressed, and traffic vanishes into it.</p>
<h3>Keepalives: make the tunnel prove the far end is there</h3>
<p>With a GRE ${K.g("keepalive","A periodic test packet a GRE tunnel sends through itself; if several replies in a row are missed, the line protocol goes down.")}, <code>keepalive 10 3</code> on Tunnel0 (the defaults plain <code>keepalive</code> gives), the router sends a test every 10 seconds that the far router unwraps and sends straight back; after 3 missed replies the line protocol goes <b>down</b> and its routes are withdrawn, so a backup can take over. One side can use keepalives alone, as long as the far end has a correct mirror-image tunnel. The show output reads <code>Keepalive set (10 sec), retries 3</code>.</p>
${K.when([
  ["Keepalives off (default)","OSPF runs over the tunnel","OSPF's hellos detect a dead far end","Statics point into the tunnel: they stay while traffic black-holes"],
  ["Keepalives on","Statics or a backup depend on the tunnel","The line protocol becomes honest","With OSPF on top they add little"],
], "GRE keepalives: on or off?")}
${K.mistake(`Believing up/up means the tunnel works. Prove it with a ping to the far end's <b>tunnel</b> address (172.16.0.2); if that fails, look at the far end.`)}
<h3>Try it yourself: bring a tunnel up one rule at a time</h3>
${K.term({env:"ios2", title:"PHC-R1 — prepare Port Harcourt's end of a new tunnel", opts:{kind:"router", host:"PHC-R1", model:"ISR 1100", motd:"PHC-R1 — Port Harcourt branch router (lab). Console session, no enable secret."},
  setup:env=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description PORT HARCOURT LAN","ip address 10.22.0.1 255.255.255.0","no shutdown","interface g0/1","description INTERNET ISP-P new circuit PH-BB-0310","ip address 203.0.113.202 255.255.255.252","no shutdown","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"Ticket: &ldquo;Port Harcourt's new broadband is live on G0/1, 203.0.113.202/30 (ISP router .201). Head office (198.51.100.90) configures its end tonight. Prepare ours: tunnel 172.30.0.0/30, we are .1, ready for IPsec later.&rdquo; After each step, name the rule holding the line protocol down.",
  tasks:[
    {text:"<code>enable</code>, then <code>show ip interface brief</code>: is G0/1 up/up with its address? (It must be, to be a tunnel source.)", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+ip\s+int\S*\s+br/i.test(h))},
    {text:"<code>configure terminal</code>, <code>interface Tunnel0</code>, <code>ip address 172.30.0.1 255.255.255.252</code>, <code>tunnel source g0/1</code>. Which rule keeps the line protocol down now?", done:e=>{ const t=(e.tunInfo?e.tunInfo():[]).find(x=>x.ios==="Tunnel0"); return !!(t && t.ip==="172.30.0.1" && t.srcIf==="GigabitEthernet0/1"); }},
    {text:"<code>tunnel destination 198.51.100.90</code>, then <code>do show ip interface brief</code>. Still <code>up  down</code>, with a source and a destination. Why? (Look at the routing table: <code>do show ip route</code>.)", done:e=>{ const t=(e.tunInfo?e.tunInfo():[]).find(x=>x.ios==="Tunnel0"); return !!(t && t.dst==="198.51.100.90") && e.history.filter(h=>/^\s*(do\s+)?sh\S*\s+ip\s+int\S*\s+br/i.test(h)).length>=2; }},
    {text:"Give the router its default route to the ISP: <code>exit</code>, then <code>ip route 0.0.0.0 0.0.0.0 203.0.113.201</code>. Watch the console: the line protocol comes up, although head office hasn't configured anything", done:e=>{ const t=(e.tunInfo?e.tunInfo():[]).find(x=>x.ios==="Tunnel0"); return !!(t && t.up); }},
    {text:"Back in <code>interface Tunnel0</code>: <code>ip mtu 1400</code> and <code>ip tcp adjust-mss 1360</code>. Then <code>end</code>, <code>show ip interface tunnel 0</code> (find <code>MTU is … bytes</code>) and <code>show interfaces tunnel 0</code> (find the transport MTU). Why are the two numbers different?", done:e=>{ const i=e.intfs.Tunnel0; return !!(i && i.ipMtu===1400 && i.mss===1360) && e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+ip\s+int\S*\s+tu/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+int\S*\s+tu/i.test(h)); }},
    {text:"Save: <code>copy running-config startup-config</code> (press Enter to accept the file name)", done:e=>!!e.savedOnce},
  ],
  win:"PHC-R1's tunnel is ready and up/up, and it went up/up the moment the destination became routable — before head office typed a single command. That is the trap: without keepalives (or OSPF over it) the line protocol never tells you whether the far end exists. ip mtu 1400 now limits what the router sends into the tunnel; the transport MTU (1476) is still the most GRE could carry.",
  solve:["enable","show ip interface brief","configure terminal","interface Tunnel0","ip address 172.30.0.1 255.255.255.252","tunnel source g0/1","tunnel destination 198.51.100.90","do show ip interface brief","do show ip route","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.201","interface Tunnel0","ip mtu 1400","ip tcp adjust-mss 1360","end","show ip interface tunnel 0","show interfaces tunnel 0","copy running-config startup-config",""]})}
${K.hint(`Task 2: the source is fine; the tunnel has nowhere to send yet. Task 3: the router has only connected routes, and 198.51.100.90 isn't in any of them. Task 5: ip mtu is what you chose to send; the transport MTU is what GRE over this underlay could carry.`)}
${K.check({q:"A branch tunnel shows 'Tunnel0 is up, line protocol is up' and 'Keepalive not set'. The far router was powered off an hour ago. What will a static route pointing at Tunnel0 do?", o:["It is removed, because the tunnel goes down","It stays installed and traffic is sent into the tunnel and lost","It moves automatically to the backup link","The router reloads the tunnel every 10 seconds"], a:1, why:"Without keepalives only local checks count, so the tunnel stays up/up and the static stays installed: a black hole. Keepalives or OSPF over the tunnel would detect the dead far end."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Four tunnels, no keepalives. Match each situation with the state you would see in show interfaces tunnel 0 and the rule behind it.", pairs:[["Source G0/1 is up with an address, destination set, only a default route to the ISP, far router switched off","Up/up: the default route makes the destination routable"],["Source G0/1 was shut down by mistake","Line protocol down: the source isn't usable"],["shutdown typed on Tunnel0","Administratively down: the tunnel itself is shut"],["Destination set but the router has no default route and no route to that address","Line protocol down: the destination isn't routable"]], why:"1. What is asked? The state of each tunnel and the rule behind it. 2. Which rule? Line protocol up needs: not shut, a usable source (up with an IP), a destination, and a route to it (the default counts); the far end is irrelevant without keepalives. 3. Apply it: the first tunnel passes every local check, so it is up/up even with the far router off; a shut source and a missing route each fail one rule; shutdown on the tunnel itself is administratively down."})}

<h2>Running OSPF over the tunnel, and recursive routing</h2>
${K.remember(`<b>The rule:</b> run OSPF on the <b>tunnel subnet and the LANs</b>, <b>never the public (underlay) subnets</b>. A router that learns its tunnel destination <i>through the tunnel</i> has <b>recursive routing</b>, and IOS shuts the tunnel down.`)}
<h3>Worked example: OSPF between HQ-R1 and IBD-R1</h3>
<p>On each router, under <code>router ospf 1</code>, a <code>network</code> statement for its LAN and one for the tunnel subnet: <code>network 172.16.0.0 0.0.0.3 area 0</code>. Hellos leave Tunnel0, are wrapped in GRE, cross the ISPs as public unicast and are unwrapped at the far end's Tunnel0. Seconds later:</p>
${K.out(`HQ-R1#show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
198.51.100.2      0   FULL/  -        00:00:36    172.16.0.2      Tunnel0

HQ-R1#show ip route ospf | include 10.2
O        10.2.0.0/24 [110/1001] via 172.16.0.2, 00:11:27, Tunnel0`, "The lab's output. No router-id was set, so IBD-R1's ID is its highest interface address (Module 5).")}
<ul>
<li><b>FULL/  -</b>: a GRE tunnel is network type <b>POINT_TO_POINT</b> by default, so no DR or BDR (Module 5).</li>
<li><b>[110/1001]</b>: the default 100 Kbit/s bandwidth gives cost 100,000 ÷ 100 = <b>1000</b>, plus 1 for IBD-R1's Gigabit LAN (<code>show ip ospf interface tunnel0</code>: <code>Network Type POINT_TO_POINT, Cost: 1000</code>).</li>
</ul>
<p>Cost 1000 suits a <b>backup</b> tunnel (any real link beats it). For a primary path, set <code>bandwidth</code> on both tunnel interfaces (lesson 2 again): <code>bandwidth 10000</code> (10 Mb/s) gives cost 10.</p>
${K.mistake(`Using <code>network 0.0.0.0 255.255.255.255 area 0</code> to &ldquo;make OSPF easy&rdquo; on an internet router. Every interface joins OSPF, including the internet one: hellos go to the ISP, and the public subnet is advertised into the tunnel, which breaks it, as you're about to see.`)}
<h3>Recursive routing: the tunnel that needs itself</h3>
<p>Suppose someone adds <code>network 198.51.100.0 0.0.0.3 area 0</code> on IBD-R1. Follow HQ-R1's table:</p>
${K.steps([
  ["IBD-R1 advertises its WAN subnet", "OSPF carries 198.51.100.0/30 across the tunnel; HQ-R1 installs <code>O 198.51.100.0/30 via 172.16.0.2, Tunnel0</code>."],
  ["Longest match picks it", "To send GRE, HQ-R1 looks up its tunnel destination, 198.51.100.2: the OSPF /30 beats the default /0 (Module 5), so the answer is &ldquo;out of Tunnel0&rdquo;."],
  ["The loop", "The GRE packet would go into the tunnel, be wrapped again, look up the same destination, forever. IOS detects this and disables the tunnel."],
  ["The flap", "Tunnel down → OSPF route gone → default route best again → tunnel up → OSPF relearns the /30 → down again. Real IOS flaps for as long as the mistake is there."],
])}
${K.svg("0 0 760 278",
  K.dev("router",110,70,"HQ-R1","dest 198.51.100.2")+K.dev("cloud",380,190,"","")+K.txt(380,226,"internet (ISP1 · ISP2)",{mid:true,c:"fg",f:"body",s:11})+K.dev("router",650,70,"IBD-R1","G0/1 198.51.100.2")+
  K.link(130,92,356,180)+K.link(404,180,630,92)+
  `<path d="M140,62 H620" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="7 4"/>`+K.txt(380,54,"Tunnel0 (OSPF neighbours across it)",{mid:true,c:"accent",s:10.5})+
  K.arrow(560,80,200,80,"",false)+K.txt(380,98,"OSPF: 198.51.100.0/30 via Tunnel0 (IBD-R1 advertised its WAN)",{mid:true,c:"bad",f:"body",s:10.5})+
  K.txt(380,140,"to reach 198.51.100.2 …",{mid:true,c:"fg",f:"body",s:10.5})+K.txt(380,156,"… send it into Tunnel0?",{mid:true,c:"bad",f:"body",s:10.5,b:true})+
  K.txt(20,250,"Fix: advertise only the LANs and the tunnel subnet into OSPF,",{f:"body",s:10.5,c:"fg"})+K.txt(20,266,"or pin the destination to the underlay: ip route 198.51.100.2 255.255.255.255 203.0.113.1",{f:"body",s:10.5,c:"fg"}),
  "HQ-R1's best route to its own tunnel destination points into the tunnel: recursive routing.")}
<p>What HQ-R1 logs (lab output, timestamps trimmed; the lab and real IOS both stamp each line):</p>
${K.out(`%TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing
%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down
%OSPF-5-ADJCHG: Process 1, Nbr 198.51.100.2 on Tunnel0 from FULL to DOWN, Neighbor Down: Interface down or detached`, "Search syslog for RECURDOWN, not \"RECURSIVE\". The lab holds the tunnel down while the fault lasts; real IOS retries after a short wait, so it flaps.")}
<p>Two fixes; the first is the real one:</p>
<ol>
<li><b>Don't advertise the underlay into the overlay:</b> specific <code>network</code> statements for the LAN and tunnel subnet only.</li>
<li><b>Pin the destination to the underlay:</b> <code>ip route 198.51.100.2 255.255.255.255 203.0.113.1</code>. A /32 beats any /30 OSPF can bring, so the destination is always reached via the ISP: a good safety net.</li>
</ol>
${K.dyk(`Every overlay technology has this trap, so many designs keep the underlay's routes (the ISP default) in a separate table from the overlay's. Lesson 6 shows the tool, VRFs: a &ldquo;front-door VRF&rdquo; holds the internet route, and the tunnel looks up its destination there.`)}
${K.check({q:"Kano's tunnel to Lagos comes up for about a minute, then logs %TUN-5-RECURDOWN, over and over. Lagos's public address is 203.0.113.34. Which route on KAN-R1 is the most likely cause?", o:["S* 0.0.0.0/0 via the Kano ISP","O 203.0.113.32/30 via 172.18.0.1, Tunnel0","C 10.21.0.0/24 directly connected, GigabitEthernet0/0","O 10.10.0.0/24 [110/1001] via 172.18.0.1, Tunnel0"], a:1, why:"203.0.113.34 is inside 203.0.113.32/30, a longer match than the default, pointing out of Tunnel0: recursive routing, because Lagos advertises its WAN subnet into OSPF. A LAN route through the tunnel is what you want."})}

<h3>Hands-on: build GRE between Abuja and Enugu, then run OSPF over it</h3>
<p>Two branches on two ISPs. You can watch the outer packet cross the ISP routers but have no login on them (as in real life).</p>
${K.bench({id:"m10-gre-ospf", points:110, from:"CCNA · Module 10 · lesson 3", title:"Abuja ↔ Enugu over the internet: a GRE tunnel with OSPF on top", viewBox:"0 0 1030 540", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Enugu staff need the Abuja file server (ABJ-SRV, 10.20.0.10). Build a GRE tunnel over the broadband and run OSPF across it.&rdquo; Abuja LAN 10.20.0.0/24 · ABJ-R1 G0/1 <b>203.0.113.6/30</b> (ISP-A .5) · Enugu LAN 10.23.0.0/24 (ENU-PC1 .40) · ENU-R1 G0/1 <b>198.51.100.26/30</b> (ISP-B .25) · tunnel <b>172.20.0.0/30</b> (ABJ-R1 .1, ENU-R1 .2). Both routers have a default route to their ISP and OSPF process 1 for their LAN (router IDs 1.1.1.1, 4.4.4.4). LAP-ABJ and LAP-ENU are on the consoles (9600 8N1): press Enter, then <code>enable</code>. Read the frame log after each ping.",
  devices:[
    {id:"lapa", kind:"laptop", label:"LAP-ABJ", x:20, y:20},
    {id:"abj", kind:"router", label:"ABJ-R1", model:"ISR 1100 · Abuja office", x:20, y:200, config:e=>{ ["en","conf t","hostname ABJ-R1","no ip domain-lookup","interface g0/0","description ABUJA LAN","ip address 10.20.0.1 255.255.255.0","no shutdown","interface g0/1","description INTERNET ISP-A","ip address 203.0.113.6 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.5","router ospf 1","router-id 1.1.1.1","passive-interface g0/0","network 10.20.0.0 0.0.0.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"srv", kind:"server", label:"ABJ-SRV", x:60, y:400, ip:"10.20.0.10", mask:"255.255.255.0", gw:"10.20.0.1"},
    {id:"ispa", kind:"router", label:"ISP-A", model:"internet · ISP A (no login)", x:280, y:200, config:e=>{ ["en","conf t","hostname ISP-A","interface g0/1","ip address 203.0.113.5 255.255.255.252","no shutdown","interface g0/0","ip address 192.0.2.9 255.255.255.252","no shutdown","exit","ip route 198.51.100.24 255.255.255.252 192.0.2.10","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"ispb", kind:"router", label:"ISP-B", model:"internet · ISP B (no login)", x:540, y:200, config:e=>{ ["en","conf t","hostname ISP-B","interface g0/0","ip address 192.0.2.10 255.255.255.252","no shutdown","interface g0/1","ip address 198.51.100.25 255.255.255.252","no shutdown","exit","ip route 203.0.113.4 255.255.255.252 192.0.2.9","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lape", kind:"laptop", label:"LAP-ENU", x:820, y:20},
    {id:"enu", kind:"router", label:"ENU-R1", model:"ISR 1100 · Enugu office", x:800, y:200, config:e=>{ ["en","conf t","hostname ENU-R1","no ip domain-lookup","interface g0/0","description ENUGU LAN","ip address 10.23.0.1 255.255.255.0","no shutdown","interface g0/1","description INTERNET ISP-B","ip address 198.51.100.26 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 198.51.100.25","router ospf 1","router-id 4.4.4.4","passive-interface g0/0","network 10.23.0.0 0.0.0.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"epc", kind:"pc", label:"ENU-PC1", x:840, y:400, ip:"10.23.0.40", mask:"255.255.255.0", gw:"10.23.0.1"},
  ],
  cables:[ {type:"cat6", a:"abj:g1", b:"ispa:g1"}, {type:"cat6", a:"ispa:g0", b:"ispb:g0"}, {type:"cat6", a:"ispb:g1", b:"enu:g1"},
    {type:"cat6", a:"srv:eth", b:"abj:g0"}, {type:"cat6", a:"epc:eth", b:"enu:g0"},
    {type:"console", a:"lapa:usb", b:"abj:con"}, {type:"console", a:"lape:usb", b:"enu:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"Prove the problem first. ENU-PC1 → Command Prompt: <code>ping 10.20.0.10</code>. Which router answers &ldquo;Destination host unreachable&rdquo;, and why can it never route 10.20.0.0/24?", done:B=>Bench.tried(B,"epc",/^\s*ping\s+10\.20\.0\.10\s*$/i)},
    {text:"On LAP-ABJ: <code>enable</code>, <code>configure terminal</code>, <code>interface Tunnel0</code>, a <code>description</code>, <code>ip address 172.20.0.1 255.255.255.252</code>, <code>tunnel source g0/1</code>, <code>tunnel destination 198.51.100.26</code>. Then <code>do show ip interface brief</code>: Tunnel0 is up/up, although ENU-R1 has no tunnel yet. Which rule allows that?", done:B=>{ const i=B.devs.abj.env.intfs.Tunnel0; return !!(i && i.ip==="172.20.0.1" && i.tun && i.tun.dst==="198.51.100.26") && Bench.tunnelUp(B,"abj",0); }},
    {text:"Still on ABJ-R1: <code>end</code>, then <code>ping 172.20.0.2</code> (ENU-R1's future tunnel address). In the frame log, follow the GRE packet to ENU-R1. What does ENU-R1 do with it, and why?", done:B=>B.devs.abj.env.log.some(l=>/^\s*ping\s+172\.20\.0\.2\s*$/i.test(l.cmd||""))},
    {text:"On LAP-ENU: the mirror image on ENU-R1: <code>interface Tunnel0</code>, a description, <code>ip address 172.20.0.2 255.255.255.252</code>, <code>tunnel source g0/1</code>, <code>tunnel destination 203.0.113.6</code>. Then from ENU-R1 <code>ping 172.20.0.1</code>: !!!!!", done:B=>{ const i=B.devs.enu.env.intfs.Tunnel0; return !!(i && i.ip==="172.20.0.2" && i.tun && i.tun.dst==="203.0.113.6") && Bench.tunnelUp(B,"enu",0) && Bench.pinged(B,"enu","172.20.0.1"); }},
    {text:"Run OSPF over the tunnel: on <b>both</b> routers, under <code>router ospf 1</code>, add <code>network 172.20.0.0 0.0.0.3 area 0</code>: only the tunnel subnet, never the 203.0.113.x or 198.51.100.x WAN subnets. Then <code>show ip ospf neighbor</code>: the other router, <code>FULL/  -</code>, on Tunnel0", done:B=>Bench.ospfNbr(B,"enu","1.1.1.1","FULL") && Bench.ospfNbr(B,"abj","4.4.4.4","FULL") && !Bench.recursive(B,"abj",0) && !Bench.recursive(B,"enu",0) && Bench.tunnelUp(B,"abj",0) && Bench.tunnelUp(B,"enu",0)},
    {text:"ENU-R1: <code>show ip route ospf</code> and <code>show ip ospf interface brief</code>. The Abuja LAN is <code>[110/1001]</code> via 172.20.0.1, Tunnel0: where do the 1000 and the 1 come from?", done:B=>{ const r=Bench.route(B,"enu","10.20.0.0/24","O"); return !!(r && r.metric===1001) && B.devs.enu.env.log.some(l=>/\[110\/1001\]/.test(l.out||"")) && B.devs.enu.env.log.some(l=>/^\s*sh\S*\s+ip\s+ospf\s+int\S*\s+br/i.test(l.cmd||"")); }},
    {text:"Watch a packet inside a packet: ENU-PC1 <code>ping 10.20.0.10</code>, then read the frame log (find the NEW IP header, protocol 47, and the ISPs routing the outer packet). Then <code>tracert 10.20.0.10</code>: why only three hops?", done:B=>Bench.pinged(B,"epc","10.20.0.10") && Bench.traced(B,"epc","10.20.0.10") && Bench.routeVia(B,"enu","10.20.0.10")==="172.20.0.1"},
    {text:"Save both routers: <code>copy running-config startup-config</code> on ABJ-R1 and on ENU-R1", done:B=>!!(B.devs.abj.env.savedOnce && B.devs.enu.env.savedOnce)},
  ],
  win:"Enugu reaches the Abuja server across two ISPs that have never heard of 10.20.0.0/24: every packet travelled inside a new header between 203.0.113.6 and 198.51.100.26, protocol 47, and OSPF formed a FULL point-to-point adjacency across the same tunnel. The far LAN costs 1001 because the tunnel defaults to 100 Kbit/s; set bandwidth on both ends when the tunnel is your primary path. One thing still missing for a real bank: encryption (GRE over IPsec, next section).",
  solve:[["pc","epc","ping 10.20.0.10"],
    ["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface Tunnel0"],["term","description GRE to ENU-R1 over the internet"],["term","ip address 172.20.0.1 255.255.255.252"],["term","tunnel source g0/1"],["term","tunnel destination 198.51.100.26"],["term","do show ip interface brief"],["term","end"],["term","ping 172.20.0.2"],
    ["console","lape",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface Tunnel0"],["term","description GRE to ABJ-R1 over the internet"],["term","ip address 172.20.0.2 255.255.255.252"],["term","tunnel source g0/1"],["term","tunnel destination 203.0.113.6"],["term","end"],["term","ping 172.20.0.1"],
    ["term","configure terminal"],["term","router ospf 1"],["term","network 172.20.0.0 0.0.0.3 area 0"],["term","end"],
    ["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","router ospf 1"],["term","network 172.20.0.0 0.0.0.3 area 0"],["term","end"],["term","show ip ospf neighbor"],["term","copy running-config startup-config"],["term",""],
    ["console","lape",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip ospf neighbor"],["term","show ip route ospf"],["term","show ip ospf interface brief"],
    ["pc","epc","ping 10.20.0.10"],["pc","epc","tracert 10.20.0.10"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 2: no keepalives, so only local rules count; the default route makes the destination routable. Task 3: look for &ldquo;can't unwrap it&rdquo;. Task 6: tunnel cost 1000, plus 1 for the far LAN.`)}
${K.reveal("Walkthrough — what you saw", `<p>ISP-B answered &ldquo;Destination host unreachable&rdquo;: it routes only public addresses. ABJ-R1's tunnel went up/up once its destination was routable, but its ping died at ENU-R1, which had no matching tunnel to unwrap it. With the mirror image the ping worked, OSPF went <code>FULL/  -</code> on Tunnel0 and installed <code>O 10.20.0.0/24 [110/1001] via 172.20.0.1</code>. The PC's ping crossed ISP-B and ISP-A as 198.51.100.26 → 203.0.113.6, protocol 47; tracert showed 10.23.0.1, 172.20.0.1, 10.20.0.10: the internet is one overlay hop.</p>`)}

<h3>Hands-on ticket: the Kano tunnel that won't stay up</h3>
<p>Nobody tells you the fault; the symptoms change as you fix them.</p>
${K.bench({id:"m10-gre-ticket", points:120, from:"CCNA · Module 10 · lesson 3", title:"Kano moved to a new ISP: the tunnel to Lagos is down, then flapping", viewBox:"0 0 1030 540", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Since Kano moved to the new ISP (ISP-K) on Friday, Kano can't open anything on the Lagos servers. ISP-K says the internet works. Over the weekend someone also &lsquo;simplified&rsquo; LOS-R1's OSPF.&rdquo; Lagos LAN 10.10.0.0/24 (LOS-SRV .10) · LOS-R1 G0/1 <b>203.0.113.34/30</b> (ISP-L .33) · Kano LAN 10.21.0.0/24 (KAN-PC1 .21) · KAN-R1 G0/1 now <b>198.51.100.130/30</b> (ISP-K .129); Kano's old address was 198.51.100.70 · tunnel subnet 172.18.0.0/30 (LOS-R1 .1, KAN-R1 .2) · both tunnels have <code>keepalive 10 3</code> · OSPF process 1, router IDs 1.1.1.1 (LOS-R1), 2.2.2.2 (KAN-R1). LAP-LOS and LAP-KAN are on the consoles (9600 8N1); no login on the ISP routers.",
  devices:[
    {id:"lapl", kind:"laptop", label:"LAP-LOS", x:20, y:20},
    {id:"los", kind:"router", label:"LOS-R1", model:"ISR 4331 · Lagos head office", x:20, y:200, config:e=>{ ["en","conf t","hostname LOS-R1","no ip domain-lookup","interface g0/0","description LAGOS DATA CENTRE LAN","ip address 10.10.0.1 255.255.255.0","no shutdown","interface g0/1","description INTERNET ISP-L","ip address 203.0.113.34 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.33","interface Tunnel0","description GRE to KAN-R1","ip address 172.18.0.1 255.255.255.252","keepalive 10 3","tunnel source g0/1","tunnel destination 198.51.100.70","exit","router ospf 1","router-id 1.1.1.1","passive-interface g0/0","network 0.0.0.0 255.255.255.255 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"srv", kind:"server", label:"LOS-SRV", x:60, y:400, ip:"10.10.0.10", mask:"255.255.255.0", gw:"10.10.0.1"},
    {id:"ispl", kind:"router", label:"ISP-L", model:"internet · Lagos ISP (no login)", x:280, y:200, config:e=>{ ["en","conf t","hostname ISP-L","interface g0/1","ip address 203.0.113.33 255.255.255.252","no shutdown","interface g0/0","ip address 192.0.2.37 255.255.255.252","no shutdown","exit","ip route 198.51.100.128 255.255.255.252 192.0.2.38","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"ispk", kind:"router", label:"ISP-K", model:"internet · Kano's new ISP (no login)", x:540, y:200, config:e=>{ ["en","conf t","hostname ISP-K","interface g0/0","ip address 192.0.2.38 255.255.255.252","no shutdown","interface g0/1","ip address 198.51.100.129 255.255.255.252","no shutdown","exit","ip route 203.0.113.32 255.255.255.252 192.0.2.37","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lapk", kind:"laptop", label:"LAP-KAN", x:820, y:20},
    {id:"kan", kind:"router", label:"KAN-R1", model:"ISR 1100 · Kano branch", x:800, y:200, config:e=>{ ["en","conf t","hostname KAN-R1","no ip domain-lookup","interface g0/0","description KANO LAN","ip address 10.21.0.1 255.255.255.0","no shutdown","interface g0/1","description INTERNET ISP-K new circuit","ip address 198.51.100.130 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 198.51.100.129","interface Tunnel0","description GRE to LOS-R1","ip address 172.18.0.2 255.255.255.252","keepalive 10 3","tunnel source g0/1","tunnel destination 203.0.113.34","exit","router ospf 1","router-id 2.2.2.2","passive-interface g0/0","network 10.21.0.0 0.0.0.255 area 0","network 172.18.0.0 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"kpc", kind:"pc", label:"KAN-PC1", x:840, y:400, ip:"10.21.0.21", mask:"255.255.255.0", gw:"10.21.0.1"},
  ],
  cables:[ {type:"cat6", a:"los:g1", b:"ispl:g1"}, {type:"cat6", a:"ispl:g0", b:"ispk:g0"}, {type:"cat6", a:"ispk:g1", b:"kan:g1"},
    {type:"cat6", a:"srv:eth", b:"los:g0"}, {type:"cat6", a:"kpc:eth", b:"kan:g0"},
    {type:"console", a:"lapl:usb", b:"los:con"}, {type:"console", a:"lapk:usb", b:"kan:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"Reproduce the complaint: KAN-PC1 → <code>ping 10.10.0.10</code>. Who answers, and what does that tell you about where Kano's traffic is going?", done:B=>Bench.tried(B,"kpc",/^\s*ping\s+10\.10\.0\.10\s*$/i)},
    {text:"Gather evidence on both ends: on LOS-R1 and on KAN-R1, <code>show ip interface brief</code> and <code>show interfaces tunnel 0</code>. Both tunnels are up / down, yet both have a source, a destination and a default route. Which line explains it, and which address is wrong?", done:B=>B.devs.los.env.log.some(l=>/Keepalive set \(10 sec\)/.test(l.out||"") && /destination 198\.51\.100\.70/.test(l.out||"")) && B.devs.kan.env.log.some(l=>/^\s*sh\S*\s+ip\s+int\S*\s+br/i.test(l.cmd||""))},
    {text:"Fix the first fault on the router that has it, so its tunnel matches Kano's new address. Both tunnels should come up (watch the consoles)", done:B=>{ const t=B.devs.los.env.intfs.Tunnel0; return !!(t && t.tun && t.tun.dst==="198.51.100.130" && t.tun.ka) && Bench.tunnelUp(B,"los",0); }},
    {text:"A minute later Kano's tunnel drops again. On KAN-R1, <code>show logging</code>: find the message that explains it, then work out which OSPF route caused it", done:B=>Bench.logged(B,"kan",/TUN-5-RECURDOWN/) && B.devs.kan.env.log.some(l=>/^\s*sh\S*\s+log/i.test(l.cmd||"") && /TUN-5-RECURDOWN/.test(l.out||""))},
    {text:"Fix the root cause (the weekend &ldquo;simplification&rdquo;) so OSPF advertises only what it should, with keepalives still on. Both tunnels stay up/up, KAN-R1 has a FULL neighbour 1.1.1.1, and the Lagos LAN is an OSPF route through Tunnel0 on KAN-R1", done:B=>Bench.tunnelUp(B,"los",0) && Bench.tunnelUp(B,"kan",0) && !Bench.recursive(B,"kan",0) && !Bench.recursive(B,"los",0) && Bench.ospfNbr(B,"kan","1.1.1.1","FULL") && !!B.devs.kan.env.intfs.Tunnel0.tun.ka && (()=>{ const r=Bench.route(B,"kan","10.10.0.0/24","O"); return !!(r && r.metric===1001); })()},
    {text:"Prove the ticket is solved: KAN-PC1 <code>ping 10.10.0.10</code> succeeds through the tunnel (check the frame log for protocol 47). Then save LOS-R1 and KAN-R1", done:B=>Bench.pinged(B,"kpc","10.10.0.10") && Bench.routeVia(B,"kan","10.10.0.10")==="172.18.0.1" && !!(B.devs.los.env.savedOnce && B.devs.kan.env.savedOnce)},
  ],
  win:"Two faults, two lessons. LOS-R1 still pointed its tunnel at Kano's old address, so Kano's GRE packets had no matching tunnel to unwrap them in Lagos and the keepalives on both ends (honestly) kept the line protocol down. Once that was fixed, LOS-R1's catch-all network 0.0.0.0 255.255.255.255 advertised its own WAN subnet, 203.0.113.32/30, into the tunnel: KAN-R1 then learned its tunnel destination through the tunnel itself and logged %TUN-5-RECURDOWN (on real IOS it would keep flapping). Specific network statements fixed the cause; a /32 static to 203.0.113.34 via ISP-K on KAN-R1 would make a good safety net too.",
  solve:[["pc","kpc","ping 10.10.0.10"],
    ["console","lapl",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip interface brief"],["term","show interfaces tunnel 0"],
    ["console","lapk",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip interface brief"],["term","show interfaces tunnel 0"],
    ["console","lapl",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface Tunnel0"],["term","tunnel destination 198.51.100.130"],["term","end"],
    ["console","lapk",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show logging"],["term","show ip route"],
    ["console","lapl",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","router ospf 1"],["term","no network 0.0.0.0 255.255.255.255 area 0"],["term","network 10.10.0.0 0.0.0.255 area 0"],["term","network 172.18.0.0 0.0.0.3 area 0"],["term","end"],["term","show ip ospf neighbor"],["term","copy running-config startup-config"],["term",""],
    ["pc","kpc","ping 10.10.0.10"],
    ["console","lapk",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route ospf"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Task 1: an ISP router answering means Kano's tunnel is down and the PC's packet followed the default route, private address and all. Task 2: compare LOS-R1's destination with KAN-R1's G0/1 address. Task 4: which OSPF route on KAN-R1 contains 203.0.113.34? Task 5: what does network 0.0.0.0 255.255.255.255 put into OSPF on LOS-R1?`)}
${K.reveal("Walkthrough — what you saw", `<p><b>Evidence:</b> ISP-K (198.51.100.129) answered KAN-PC1: Kano's tunnel was down, so the default route sent a 10.x packet onto the internet. Both tunnels were <code>up, line protocol is down</code> with <code>Keepalive set (10 sec), retries 3</code>, and LOS-R1's destination was 198.51.100.70, Kano's <b>old</b> address. <b>Fault 1:</b> <code>tunnel destination 198.51.100.130</code> on LOS-R1; both came up, OSPF went FULL. <b>Fault 2:</b> KAN-R1 logged <code>%TUN-5-RECURDOWN</code>: LOS-R1's catch-all network statement advertised 203.0.113.32/30, which contains KAN-R1's tunnel destination and beats its default route. Specific statements for 10.10.0.0/24 and 172.18.0.0/30 ended it: <code>O 10.10.0.0/24 [110/1001] via 172.18.0.1, Tunnel0</code>.</p>`)}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A Port Harcourt tunnel to Abuja has OSPF on top. An engineer adds the Abuja router's internet subnet to OSPF. Put what happens on the Port Harcourt router in order.", items:["OSPF over the tunnel delivers a route for Abuja's internet subnet","That route is a longer match than the default route for the tunnel destination, and it points out of Tunnel0","The router detects recursive routing, logs %TUN-5-RECURDOWN and takes Tunnel0's line protocol down","The OSPF neighbour on Tunnel0 goes from FULL to DOWN and the route disappears","The default route is best again, the tunnel comes back, OSPF relearns the route, and the cycle repeats (a flap)"], why:"1. What is asked? The sequence of a recursive-routing flap. 2. Which rule? The tunnel destination must never be reached through the tunnel; longest match decides which route is used. 3. Apply it: the advertised /30 (or similar) beats the /0 default, the tunnel would need itself, IOS disables it, the adjacency and its routes go, the default wins again, and the loop restarts until someone removes the underlay subnet from OSPF or pins the destination with a /32 static."})}

<h2>Adding encryption and scale: GRE over IPsec and DMVPN</h2>
${K.remember(`<b>The rule:</b> each tool does one job. <b>GRE</b> carries anything but encrypts nothing. Classic crypto-map <b>IPsec</b> encrypts but carries only the unicast its policy matches. <b>GRE over IPsec</b>: GRE wraps, IPsec encrypts the GRE packet. <b>DMVPN</b> adds scale: one multipoint hub tunnel, branch-to-branch tunnels on demand.`)}
<h3>GRE over IPsec</h3>
<p>Module 8 lesson 3 taught IPsec (IKE builds the security associations, ESP, protocol 50, encrypts) and that a crypto-map tunnel can't carry OSPF's multicast hellos; its case study fixed that with GRE over IPsec. Here is the packet:</p>
${K.svg("0 0 760 210",
  K.txt(20,22,"GRE only (this lesson's labs) — readable by anyone on the path",{c:"fg",f:"body",s:11.5,b:true})+
  K.band(20,32,180,28,"IP 203→198 · proto 47","var(--panel2)")+K.band(200,32,60,28,"GRE","var(--panel2)")+K.band(260,32,120,28,"orig IP")+K.band(380,32,110,28,"data")+
  K.txt(20,98,"GRE over IPsec (ESP transport mode) — the outer header stays, everything after it is encrypted",{c:"fg",f:"body",s:11.5,b:true})+
  K.band(20,108,180,28,"IP 203→198 · proto 50","var(--panel2)")+K.band(200,108,70,28,"ESP","var(--panel2)")+K.band(270,108,60,28,"GRE")+K.band(330,108,120,28,"orig IP")+K.band(450,108,110,28,"data")+K.band(560,108,90,28,"ESP trailer")+K.band(650,108,60,28,"ICV","var(--panel2)")+
  `<line x1="270" y1="148" x2="650" y2="148" stroke="var(--accent)" stroke-width="1.5"/>`+K.txt(460,164,"encrypted: the internet can't read GRE, your addresses or your data",{mid:true,c:"accent",f:"body",s:10.5})+
  K.txt(20,196,"Outer protocol 47 becomes 50: edge ACLs now need ESP and IKE (UDP 500/4500), not GRE.",{f:"body",s:10.5,c:"fg"}),
  "GRE first, then ESP. Transport mode keeps the GRE packet's outer header instead of adding a second one.")}
<ul>
<li><b>Order of work:</b> the packet is routed into Tunnel0, GRE wraps it, IPsec protects the GRE packet, usually in transport mode because GRE already supplies the outer header (Module 8).</li>
<li><b>On real IOS</b> the tunnel gets one extra line, <code>tunnel protection ipsec profile</code> plus a profile name pointing to the IPsec settings. Beyond the CCNA and not in the lab; the GRE part is what you built.</li>
<li><b>Overhead:</b> ESP adds a header, padding, trailer and integrity check on top of GRE's 24 bytes (the amount depends on the algorithms): hence 1400/1360.</li>
<li><b>The alternative:</b> an IPsec ${K.g("VTI","Virtual Tunnel Interface (tunnel mode ipsec ipv4): an IPsec tunnel presented as a routable Tunnel interface, which can carry routing protocols without GRE.")} (Module 8), a routable IPsec Tunnel interface without the GRE header, common in new IPv4 designs. GRE over IPsec remains the classic answer to &ldquo;run a routing protocol over an IPsec VPN&rdquo;.</li>
</ul>
<h3>DMVPN: tunnels that build themselves</h3>
<p>Point-to-point tunnels don't scale: 60 branches need 60 tunnel interfaces on the hub, and direct branch-to-branch calls would need a full mesh of 60 × 59 ÷ 2 = 1,770 tunnels (Module 1's n(n − 1) ÷ 2). Cisco's ${K.g("DMVPN","Dynamic Multipoint VPN (Cisco): one multipoint GRE tunnel on the hub and spokes, NHRP to find each spoke's public address, IPsec for encryption; spoke-to-spoke tunnels are built on demand.")} (Dynamic Multipoint VPN) solves both with three pieces:</p>
<ul>
<li>${K.g("mGRE","Multipoint GRE: one tunnel interface with no fixed destination, able to reach many peers.")} (multipoint GRE): one Tunnel interface with <b>no fixed destination</b>, able to reach any number of peers.</li>
<li>${K.g("NHRP","Next Hop Resolution Protocol: lets DMVPN spokes register their public address with the hub and ask it for other spokes' addresses.")}: each spoke <b>registers</b> with the hub (&ldquo;tunnel address 10.255.0.12, public address 198.51.100.130&rdquo;); a spoke wanting another spoke <b>asks the hub</b> for its public address (in DMVPN terms, its ${K.g("NBMA","Non-broadcast multi-access: a network many routers share but that can't broadcast to all of them. In DMVPN, the public (underlay) addresses.")} address).</li>
<li><b>IPsec</b> on top, usually one profile shared by every tunnel, so the whole overlay is encrypted.</li>
</ul>
${K.svg("0 0 760 334",
  K.dev("router",380,56,"HUB · Lagos","mGRE Tunnel0 · NHRP server")+
  K.dev("router",120,200,"SPOKE · Kano","198.51.100.130")+K.dev("router",380,200,"SPOKE · Ibadan","198.51.100.2")+K.dev("router",640,200,"SPOKE · Enugu","198.51.100.26")+
  `<path d="M340,112 L130,178 M380,112 L380,176 M420,112 L630,178" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="7 4"/>`+
  K.txt(205,118,"permanent",{mid:true,c:"accent",f:"body",s:10.5})+K.txt(205,132,"spoke–hub tunnel",{mid:true,c:"accent",f:"body",s:10.5})+
  `<path d="M150,258 C 300,318 460,318 610,258" fill="none" stroke="var(--warn)" stroke-width="2" stroke-dasharray="3 4"/>`+
  K.txt(380,326,"spoke-to-spoke tunnel, built on demand",{mid:true,c:"warn",f:"body",s:10.5,b:true})+
  K.txt(560,112,"1. spokes register (NHRP)",{c:"fg",f:"body",s:10.5})+K.txt(560,128,"2. Kano asks: where is Enugu?",{c:"fg",f:"body",s:10.5})+K.txt(560,144,"3. Kano builds a direct tunnel",{c:"fg",f:"body",s:10.5}),
  "DMVPN as a concept (no lab engine): one hub mGRE interface for every spoke; spokes find each other through NHRP, so Kano–Enugu traffic needn't cross Lagos.")}
<p>Adding branch 61 means configuring branch 61 only, and branch-to-branch voice goes direct. (The CCNA expects the idea, not DMVPN's &ldquo;phases&rdquo;.) Lesson 4's SD-WAN goes further, with a central controller instead of NHRP.</p>
${K.when([
  ["Plain GRE","Two sites, labs, already-encrypted traffic","Simplest; carries OSPF, multicast, IPv6","Traffic must be private on the internet"],
  ["GRE over IPsec","A few sites needing OSPF and encryption","Routing plus encryption","Dozens of sites: a tunnel per pair"],
  ["IPsec VTI","Router-to-router IPv4 with routing","Encrypted Tunnel interface, no GRE header","Other protocols must be carried"],
  ["DMVPN","Many branches, some spoke-to-spoke","Hub config doesn't grow; direct branch paths","Small networks; non-Cisco sites"],
  ["Remote-access VPN","Individual users","Per-user tunnel and login","Joining whole sites"],
], "Which internet VPN?")}
${K.check({q:"A design must run OSPF between a head office and four branches over the internet, encrypted, using a crypto-map IPsec tunnel to each branch. During testing, pings between LANs work but OSPF never forms. What change fixes it?", o:["Raise the OSPF hello timer","Put GRE tunnels between the sites and protect the GRE traffic with IPsec (GRE over IPsec), running OSPF on the tunnels","Use AH instead of ESP","Turn on NAT-T"], a:1, why:"A crypto map carries only the unicast traffic its policy matches, so multicast hellos never cross. GRE carries them and IPsec encrypts the GRE (a VTI also works). AH doesn't encrypt; NAT-T is for NAT in the path."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A cooperative bank has 40 branches on broadband. Branch-to-branch video calls are common, the head office team is small, the data must be encrypted and OSPF must learn new branch LANs automatically. Which two choices fit? (Choose two.)", o:["DMVPN with IPsec, so branches build direct tunnels to each other on demand","Run OSPF (or another routing protocol) over the DMVPN tunnels","Plain GRE from every branch to every other branch: 780 tunnels","Crypto-map IPsec only, with static routes for every LAN","Remote-access VPN clients on every branch PC"], a:[0,1], why:"1. What is asked? A scalable, encrypted, routed design with branch-to-branch traffic. 2. Which rule? GRE carries the routing protocol, IPsec encrypts, and DMVPN's mGRE + NHRP removes per-pair tunnels while allowing direct spoke-to-spoke paths. 3. Apply it: DMVPN with IPsec, and a routing protocol over it. A GRE full mesh is 40 × 39 ÷ 2 = 780 unencrypted tunnels; crypto maps can't carry OSPF; remote access is for users, not sites."})}

<h2>Remote-access VPNs and putting it together</h2>
${K.remember(`<b>The rule:</b> <b>site-to-site</b> tunnels join <b>networks</b>, router to router, always on; PCs know nothing about them. <b>Remote access</b> joins <b>one user's device</b>, on demand, with a client and a login. Most companies run both.`)}
<p>Recap from Module 8 lesson 3: a client (Cisco Secure Client, formerly AnyConnect, or Windows' IKEv2 client) tunnels to a headend over <b>TLS</b> (TCP 443, DTLS on UDP 443) or <b>IKEv2</b> (UDP 500/4500); the user logs in (RADIUS plus MFA) and gets an inside address; policy picks <b>split</b> or full tunnelling. To the WAN, those users are one more &ldquo;site&rdquo; (the headend's address pool) that OSPF must advertise if branch servers must answer them.</p>
${K.case("A logistics firm replaces MPLS with internet tunnels", `
<p><b>The situation:</b> a haulage company's MPLS renewal (Lagos hub, six depots) tripled in price. Every depot had broadband. Dispatch, CCTV and phones talk to Lagos; Kano and Kaduna also swap many files.</p>
<p><b>Pilot:</b> GRE from Lagos to Kano with OSPF, MPLS still primary (tunnel cost 1000 made it a natural backup). Surprise one: CCTV uploads stalled while pings were perfect; the depot firewall blocked ICMP &ldquo;fragmentation needed&rdquo;, and <code>ip mtu 1400</code> plus <code>ip tcp adjust-mss 1360</code> fixed it. Surprise two: someone added the depot's internet subnet to OSPF &ldquo;for monitoring&rdquo; and the tunnel flapped. New build rule: OSPF on tunnels and LANs only, plus a /32 static to each tunnel destination.</p>
<p><b>Rollout:</b> auditors required encryption and Kano–Kaduna traffic shouldn't cross Lagos, so production became DMVPN with IPsec, OSPF on top, <code>bandwidth</code> set to each depot's real speed, and a 4G router per depot as a second carrier (lesson 2).</p>
<p><b>The result:</b> about a third of the MPLS cost, encrypted, new depots added without touching the hub. <b>Given up:</b> the carrier SLA and QoS. Lesson 4's SD-WAN is what many firms add next, to steer voice to the healthier path.</p>`)}
${K.job("Kano depot — &ldquo;the tunnel is up but nothing gets through&rdquo;", `
<p><b>The ticket (08:10):</b> &ldquo;Since the router swap last night at Kano depot, dispatch can't reach Lagos. The new router's tunnel shows up/up. Field engineer has left site.&rdquo;</p>
<p><b>Questions first:</b> what changed? (A replacement router, built from a saved template.) What fails? (Everything to Lagos; browsing works.)</p>
<ol>
<li><b>The overlay from the hub:</b> on LOS-R1, <code>show ip ospf neighbor</code> shows every depot FULL except Kano, stuck at <code>INIT/  -</code>: the hub hears Kano's hellos, but Kano never hears the hub's, whatever Kano's tunnel says.</li>
<li><b>The tunnel from Kano</b> (through the depot's out-of-band console modem): <code>show interfaces tunnel 0</code> is up/up, <code>Keepalive not set</code>, <code>Tunnel source 198.51.100.130 (GigabitEthernet0/1), destination 203.0.113.34</code>. Source and destination look right.</li>
<li><b>Test the overlay:</b> <code>ping 172.18.0.1</code> from KAN-R1: 0 percent. Up/up proves only the local rules.</li>
<li><b>Check the path:</b> LOS-R1's side is correct, so look at what changed. The template was <b>older</b> than the tunnel: <code>show access-lists</code> for G0/1's inbound ACL has nothing for protocol 47, so the implicit deny drops LOS-R1's GRE packets.</li>
<li><b>Fix, with a change record:</b> <code>permit gre host 203.0.113.34 host 198.51.100.130</code> above the final deny. Seconds later, <code>%OSPF-5-ADJCHG … LOADING to FULL</code> on both ends; dispatch works.</li>
<li><b>Prevent the repeat:</b> <code>keepalive 10 3</code> on the depot tunnels so up/up tells the truth, and update the template in the configuration archive.</li>
</ol>
<p><b>What you tell the depot manager:</b> &ldquo;The new router's firewall rules came from an old copy and blocked the tunnel. Fixed, and the master copy is updated.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;KAN-R1 replacement: G0/1 inbound ACL from an outdated template lacked permit gre; tunnel up/up (no keepalives) while GRE was dropped. Added permit gre host 203.0.113.34 host 198.51.100.130; OSPF FULL, dispatch confirmed 08:47. Added keepalive 10 3; template updated.&rdquo;</p>`)}
${K.myth([
  ["A GRE tunnel encrypts traffic because it's a VPN.","GRE only wraps packets; anyone on the path can read them. Encryption comes from IPsec."],
  ["Line protocol up means the far end is reachable.","Without keepalives, up/up proves only local facts: a usable source, a destination and a route to it."],
  ["The tunnel MTU is 9976 because show interfaces says so.","That is a buffer figure. GRE over a 1500-byte underlay carries 1476-byte packets."],
  ["Advertising everything into OSPF is harmless.","Advertising the tunnel's own underlay subnet into it causes recursive routing and a flapping tunnel."],
])}
${K.dodont([
  "Give each point-to-point tunnel its own small subnet (/30 or /31).",
  "Put only the tunnel subnet and LANs into OSPF; add a /32 static to each tunnel destination via the ISP.",
  "Set ip mtu 1400 and ip tcp adjust-mss 1360 on tunnels carrying TCP.",
  "Turn on keepalives when statics or a backup depend on the tunnel's state.",
  "Permit protocol 47 (or ESP and IKE) between the two endpoints on edge ACLs, nothing wider.",
],[
  "Don't send confidential traffic over plain GRE across the internet.",
  "Don't use network 0.0.0.0 255.255.255.255 on a router with an internet interface.",
  "Don't trust up/up without pinging the far tunnel address.",
  "Don't build a full mesh of point-to-point tunnels for dozens of sites: use DMVPN or SD-WAN.",
])}
${K.exam(`Reading tunnel questions: first underline the <b>outer</b> addresses (public tunnel source and destination) and the <b>inner</b> ones (private LANs and tunnel subnet); most wrong answers swap them. Then name the rule: protocol number → 47 (ESP 50); MTU → 1476, MSS = MTU − 40; up/down → usable source, routable destination; RECURDOWN → destination learned through the tunnel; routing over IPsec → GRE over IPsec or VTI; on-demand spoke tunnels → DMVPN. VPNs are objective 5.5 in v1.1 and 4.5 in v2.0 (from February 2027).`)}
${K.check({q:"Which statement describes a site-to-site VPN rather than a remote-access VPN?", o:["Each user starts a client and logs in when they need it","The headend assigns each laptop an inside address from a pool","Two routers keep an always-on tunnel and the PCs behind them need no VPN software","It usually runs over TLS on TCP 443 from a hotel network"], a:2, why:"Site-to-site joins networks: routers keep the tunnel and hosts use it unaware. Clients, logins, address pools and TLS on 443 are remote access."})}
<h3>Same logic, new situation</h3>
<p>A hotel group's 15 hotels each have broadband. Guests must never reach the corporate network, reception PCs must reach the head-office booking server, managers work from laptops and phones while travelling, and auditors want encryption. Which tunnel types, for whom?</p>
${K.hint(`Separate the &ldquo;networks&rdquo; from the &ldquo;people&rdquo;, and find the traffic that must stay out of the tunnels.`)}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> A VPN type per kind of traffic. <b>2. Which rule?</b> Site-to-site joins networks; remote access joins one user's device; encryption comes from IPsec or TLS, never GRE alone. <b>3. Apply it:</b> reception LANs get <b>site-to-site</b> GRE over IPsec to head office (DMVPN if hotels talk to each other), OSPF on the tunnels advertising only the reception LAN. Managers get a <b>remote-access</b> client (TLS or IKEv2, MFA). Guest Wi-Fi goes straight to the internet, never into the tunnels (lesson 6 separates it on the same router with a VRF).</p>`)}

<h2>Interview corner</h2>
${K.hint(`Packet in a packet, protocol 47, 24 bytes; what it carries; what it doesn't do.`)}
${K.reveal("&ldquo;What is GRE and why would you use it?&rdquo;", `<p>"GRE wraps a packet in a new IP header between two routers' public addresses plus a 4-byte GRE header, IP protocol 47: 24 bytes overhead, a 1476-byte tunnel MTU over Ethernet. It carries anything, multicast included, so private LANs and OSPF can cross the internet. It doesn't encrypt, so on the internet I'd use GRE over IPsec or a VTI, with ip mtu 1400 and adjust-mss 1360."</p>`)}
${K.hint(`Line-protocol rules, then a ping to the far tunnel address, then the path (ACLs), then routing.`)}
${K.reveal("&ldquo;A GRE tunnel is down, or up but passing nothing. How do you troubleshoot it?&rdquo;", `<p>"First show interfaces tunnel. If it's down, the rules in order: source up with an address, destination set, a route to it, not pointing into the tunnel (the log would show TUN-5-RECURDOWN). If it's up but passes nothing, up/up proves little without keepalives: I ping the far tunnel address, check the far end is the mirror image and edge ACLs permit protocol 47. Then OSPF: neighbours on the tunnel, only LANs and the tunnel subnet advertised."</p>`)}
${K.hint(`Scale (mGRE), discovery (NHRP), encryption (IPsec), spoke-to-spoke on demand.`)}
${K.reveal("&ldquo;Explain DMVPN to someone who knows GRE.&rdquo;", `<p>"Point-to-point GRE needs a tunnel per pair of sites, so a 60-branch hub has 60 tunnel interfaces and branch-to-branch traffic crosses the hub. DMVPN uses one multipoint GRE interface instead. Spokes register their tunnel and public addresses with the hub through NHRP; a spoke needing another spoke asks the hub for its public address and builds a direct tunnel on demand. IPsec encrypts, a routing protocol runs on top, and a new branch means configuring only that branch."</p>`)}

${K.recap([
  "The internet routes only public unicast, so private LANs and OSPF hellos cross it inside a tunnel. Underlay = the real network; overlay = the tunnel and what runs over it.",
  "GRE: new 20-byte IP header (protocol 47) + 4-byte GRE header = 24 bytes; no encryption; the tunnel is one hop.",
  "Tunnel MTU = underlay MTU − 24 (1500 → 1476); MSS = MTU − 40. Usual setting: ip mtu 1400, ip tcp adjust-mss 1360.",
  "Up/up = not shut, source up with an address, destination set and routable (default counts). The far end needn't answer unless keepalives are on.",
  "OSPF over GRE: point-to-point (FULL/  -), cost 1000 (100 Kbit/s default), far LAN [110/1001].",
  "Tunnel destination learned through the tunnel = recursive routing: %TUN-5-RECURDOWN and a flap. Keep the underlay out of OSPF; pin the destination with a /32.",
  "GRE over IPsec: GRE carries routing, IPsec encrypts. DMVPN: mGRE + NHRP + IPsec, spoke-to-spoke on demand. Remote access joins users, not sites.",
])}
${K.next(`<b>Lesson 4 — SD-WAN.</b> A branch with MPLS, broadband and 4G at once: which path should each application take? Cisco Catalyst SD-WAN builds an encrypted overlay over every transport, measures each path and steers traffic by central policy.`)}
`,
quiz:[
  {lvl:1, q:"Which IP protocol number identifies GRE in the outer IP header of a tunnelled packet?", o:["6","17","47","50"], a:2, why:"GRE is IP protocol 47. 6 is TCP, 17 is UDP and 50 is ESP (IPsec). An edge ACL must permit protocol 47 between the tunnel endpoints for plain GRE to work."},
  {lvl:1, type:"fill", q:"Plain GRE over an IPv4 underlay with a 1500-byte MTU: how many bytes of overhead does it add, and what IP MTU is left inside the tunnel?", fields:[{label:"Overhead (bytes)", a:["24","24 bytes"]},{label:"Tunnel IP MTU (bytes)", a:["1476","1476 bytes"]}], why:"A new 20-byte IPv4 header plus the 4-byte GRE header = 24 bytes, so 1500 − 24 = 1476 bytes are left for the original packet. IOS shows Tunnel transport MTU 1476 bytes."},
  {lvl:1, q:"What does GRE do to the confidentiality of the traffic it carries?", o:["It encrypts it with AES","It encrypts only the inner IP header","Nothing: GRE wraps packets but does not encrypt them","It encrypts it only when keepalives are enabled"], a:2, why:"GRE is encapsulation only; anyone who captures the packets can read the inner packet. Encryption comes from IPsec, for example GRE over IPsec or a VTI."},
  {lvl:1, type:"match", q:"Match each term with its meaning.", pairs:[["Underlay","The real network that carries the tunnel's packets, such as the internet"],["Overlay","The virtual network of tunnel interfaces and the routes across them"],["Tunnel source","This router's own interface or address used in the outer header"],["Tunnel destination","The far router's address the outer header is sent to"]], why:"The underlay routes the outer packets between the tunnel source and destination (public addresses). The overlay is the tunnel interfaces, their subnet and the private networks routed across them."},
  {lvl:1, type:"fill", q:"A tunnel is configured with ip mtu 1400. What TCP MSS should ip tcp adjust-mss be set to so that a full TCP segment fits?", fields:[{label:"MSS (bytes)", a:["1360","1360 bytes"]}], why:"MSS = IP MTU − 20 (IP header) − 20 (TCP header) = 1400 − 40 = 1360. The router rewrites the MSS in TCP SYN packets passing through the tunnel."},
  {lvl:2, q:"The exhibit is from a branch router. What is the most likely reason the tunnel's line protocol is down?", ex:"BR2-R1#show interfaces tunnel 0\nTunnel0 is up, line protocol is down\n  Hardware is Tunnel\n  Internet address is 172.19.0.2/30\n  Keepalive not set\n  Tunnel source 198.51.100.66 (GigabitEthernet0/1), destination 203.0.113.18\n\nBR2-R1#show ip route 203.0.113.18\n% Network not in table\n\nBR2-R1#show ip route | include Gateway\nGateway of last resort is not set", o:["The far router has no tunnel configured","There is no route to the tunnel destination: the router has no default route","The tunnel needs keepalives to come up","The tunnel source must be a loopback interface"], a:1, why:"The source is set and the interface is up (the source line shows its address), so the failing rule is 'destination routable': there is no specific route and no default route. Without keepalives the far end's configuration doesn't affect the line protocol, and any up interface with an address can be the source."},
  {lvl:2, type:"multi", q:"A GRE tunnel has no keepalives configured. Which three conditions must be true for its line protocol to be up? (Choose three.)", o:["The tunnel source interface is up/up with an IP address","A tunnel destination is configured","The routing table has a route to the destination (a default route counts) that doesn't point into the tunnel","The far router has a matching tunnel","An OSPF neighbour has formed across the tunnel","The far end answers pings"], a:[0,1,2], why:"Without keepalives IOS checks only local facts: a usable source, a destination, and a route to it that isn't recursive. The far end's configuration, OSPF and ping replies don't affect the line protocol, which is why an unconfigured far end leaves the tunnel up/up but black-holing traffic."},
  {lvl:2, q:"A PC in Lagos runs tracert to a PC in Ibadan. The traffic crosses a GRE tunnel through four ISP routers. How many hops does tracert show between the two LAN gateways?", o:["None: tracert fails through tunnels","One: the far router's tunnel address","Four: one per ISP router","Five: the four ISP routers plus the far router"], a:1, why:"The ISP routers decrement only the outer header's TTL. The inner packet loses TTL only at the two tunnel routers, so the whole internet path is one hop, shown as the far end's tunnel interface address."},
  {lvl:2, type:"order", q:"Order what happens to a packet from a branch PC to a head-office server across a GRE tunnel.", items:["The branch router routes the packet out of Tunnel0","The branch router adds a GRE header and a new IP header from its public address to head office's, protocol 47","ISP routers forward the outer packet using only the public addresses","The head-office router finds a tunnel whose source and destination match the outer header and removes it","The head-office router routes the original packet to the server as if it arrived on its Tunnel0"], why:"Routing decides to use the tunnel; encapsulation adds the 24 bytes; the underlay forwards on the outer header; the far router decapsulates only if one of its tunnels is the mirror image; then the inner packet is routed normally."},
  {lvl:2, q:"The exhibit is from a branch router running OSPF over a GRE tunnel that is the branch's only WAN path. Users say file copies to head office are slow, and the team wants OSPF to reflect the 10 Mb/s broadband the tunnel really uses. What explains the 1001, and what should they configure?", ex:"BR3-R1#show ip route ospf | include 10.1\nO        10.1.0.0/24 [110/1001] via 172.16.3.1, 00:42:10, Tunnel0\n\nBR3-R1#show ip ospf interface brief\nInterface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C\nGi0/0        1     0               10.3.0.1/24        1     DR    0/0\nTu0          1     0               172.16.3.2/30      1000  P2P   1/1", o:["The neighbour is in the wrong area; change the area","The tunnel's default bandwidth is 100 Kbit/s, giving cost 1000 plus 1 for the far LAN; configure bandwidth 10000 on both tunnel interfaces","OSPF adds 1000 for every ISP router on the path; nothing can change it","The cost is wrong because the network type should be broadcast"], a:1, why:"Tunnel interfaces default to BW 100 Kbit/s, so cost = 100,000 ÷ 100 = 1000, plus 1 for head office's Gigabit LAN. bandwidth 10000 (kb/s) on both ends gives cost 10 (route 11). bandwidth changes OSPF's view and monitoring, not the actual speed, and each router costs its own interface, so set it on both ends."},
  {lvl:2, q:"Why is GRE over IPsec used instead of a classic crypto-map IPsec tunnel when two sites must run OSPF over the internet?", o:["Crypto-map IPsec can't encrypt TCP","A crypto-map tunnel carries only the unicast traffic its policy matches, so OSPF's multicast hellos don't cross; GRE carries them and IPsec then encrypts the GRE packets","GRE adds stronger encryption than IPsec","OSPF needs protocol 47 to form neighbours"], a:1, why:"Each tool does one job: GRE gives a routable tunnel interface that carries multicast and routing protocols; IPsec encrypts. Together they give an encrypted overlay OSPF can run on. A VTI is the other common answer."},
  {lvl:2, q:"In DMVPN, which protocol lets a spoke register its public address with the hub and ask for another spoke's public address?", o:["OSPF","NHRP","IKE","ARP"], a:1, why:"NHRP (Next Hop Resolution Protocol) maps tunnel addresses to public (NBMA) addresses. Spokes register with the hub, and a spoke resolves another spoke's public address through the hub before building a direct mGRE tunnel. IKE then negotiates IPsec for it."},
  {lvl:3, q:"The exhibit is from KAD-R1, a branch whose GRE tunnel to head office (public address 203.0.113.50) flaps every minute or so. What is the cause and the best fix?", ex:"KAD-R1#show logging | include Tunnel0\n%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to up\n%OSPF-5-ADJCHG: Process 1, Nbr 1.1.1.1 on Tunnel0 from LOADING to FULL, Loading Done\n%TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing\n%LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down\n%OSPF-5-ADJCHG: Process 1, Nbr 1.1.1.1 on Tunnel0 from FULL to DOWN, Neighbor Down: Interface down or detached", o:["The ISP link is unstable; ask the ISP to check the circuit","Head office advertises a subnet containing 203.0.113.50 into OSPF over the tunnel, so KAD-R1 learns its tunnel destination via the tunnel; remove the underlay subnet from OSPF at head office (and optionally add a /32 static to 203.0.113.50 via the ISP on KAD-R1)","Keepalives are missing; add keepalive 10 3","The OSPF hello timers don't match; set them equal"], a:1, why:"RECURDOWN right after the adjacency reaches FULL means OSPF has delivered a route that makes the tunnel destination reachable through the tunnel itself. With the tunnel down the route disappears and the tunnel comes back: a flap. Fix the cause (don't advertise the underlay) and pin the destination with a longer-match /32 static via the ISP."},
  {lvl:3, q:"After moving a branch to GRE over IPsec, users report that pings and small web pages work but large downloads and file copies stall after a few seconds. The tunnel and OSPF are stable. What is the most likely cause and fix?", o:["OSPF cost is too high; set bandwidth on the tunnel","Packets too big for the tunnel's MTU are dropped (fragmentation needed messages blocked); set ip mtu 1400 and ip tcp adjust-mss 1360 on the tunnel interfaces","The IPsec keys expire after a few seconds; increase the lifetime","The ISP blocks protocol 47"], a:1, why:"Small packets fit, full-size ones don't: GRE plus ESP overhead pushes 1500-byte packets over the path MTU, and if ICMP fragmentation-needed is filtered PMTUD can't shrink them. Clamping the MSS makes TCP send smaller segments from the start. Blocked GRE or ESP would stop everything, including pings."},
  {lvl:3, q:"ABJ-R1 and WAR-R1 both show Tunnel0 up, line protocol up, with no keepalives, but OSPF never forms and a ping from ABJ-R1 to WAR-R1's tunnel address 172.21.0.2 fails. Using the exhibit, what is wrong?", ex:"ABJ-R1#show running-config interface Tunnel0\ninterface Tunnel0\n ip address 172.21.0.1 255.255.255.252\n tunnel source GigabitEthernet0/1\n tunnel destination 198.51.100.18\n\nABJ-R1#show ip interface brief | include 0/1\nGigabitEthernet0/1     203.0.113.10    YES manual up                    up\n\nWAR-R1#show running-config interface Tunnel0\ninterface Tunnel0\n ip address 172.21.0.2 255.255.255.252\n tunnel source GigabitEthernet0/1\n tunnel destination 203.0.113.14\n\nWAR-R1#show ip interface brief | include 0/1\nGigabitEthernet0/1     198.51.100.18   YES manual up                    up", o:["The tunnel subnets don't match","WAR-R1's tunnel destination (203.0.113.14) isn't ABJ-R1's address (203.0.113.10), so the tunnels aren't mirror images: ABJ-R1's GRE packets arrive at WAR-R1 but no tunnel there matches them; correct WAR-R1's destination","ABJ-R1 must use a loopback as its tunnel source","OSPF needs a broadcast network type on tunnels"], a:1, why:"Each tunnel must be the mirror image of the other: its source = the other's destination. WAR-R1 expects GRE from 203.0.113.14, so it can't match (unwrap) packets from 203.0.113.10, and its replies go to the wrong address. Both show up/up because without keepalives only local rules count; keepalives would have taken them down and revealed the fault."},
  {lvl:3, type:"multi", q:"A retailer has a head office and 50 shops on broadband. Shops talk only to head office, card data must be encrypted, and the network team wants OSPF to learn shop LANs automatically. Which two statements describe a sound design? (Choose two.)", o:["Encrypted tunnels from each shop to head office (GRE over IPsec, VTI or DMVPN) with OSPF on the tunnels","Advertise only the shop LANs and tunnel subnets into OSPF, never the broadband subnets","Plain GRE, because the shops talk only to head office","A full mesh of 1,225 GRE tunnels so every shop has a backup path through the others","Put network 0.0.0.0 255.255.255.255 area 0 on every shop router for simplicity"], a:[0,1], why:"Card data needs encryption (GRE alone doesn't encrypt), and OSPF needs a tunnel that carries it: GRE over IPsec, a VTI, or DMVPN for easier scaling. Keeping the underlay out of OSPF prevents recursive routing. A full mesh is pointless for hub-only traffic, and the catch-all network statement both leaks the underlay and sends hellos to the ISP."},
],
cards:[
  {f:"Why tunnel across the internet?", b:"The internet routes only public unicast. Private (RFC 1918) addresses can't be routed there, and OSPF hellos are multicast with TTL 1. A tunnel wraps both in public unicast between the two routers' public addresses."},
  {f:"Underlay vs overlay", b:"Underlay: the real network carrying the tunnel (the internet, routing between the public addresses). Overlay: the tunnel interfaces, their subnet and everything routed across them (your LANs, OSPF)."},
  {f:"The GRE packet", b:"New IPv4 header (20 bytes: tunnel source → tunnel destination, protocol 47) + GRE header (4 bytes: flags, version 0, protocol type 0x0800 for IPv4) + the original packet, untouched. 24 bytes overhead. No encryption, no ports."},
  {f:"GRE MTU and MSS", b:"Tunnel IP MTU = underlay MTU − 24: 1500 → 1476 (PPPoE 1492 → 1468). MSS = MTU − 40: 1476 → 1436. Engineers set ip mtu 1400 and ip tcp adjust-mss 1360 to leave room for IPsec. Symptom of a problem: pings work, big transfers stall."},
  {f:"Configuring GRE", b:"interface Tunnel0 · ip address (tunnel subnet, e.g. /30) · tunnel source <interface or own IP> · tunnel destination <far public IP>. The far end is the mirror image (source and destination swapped). tunnel mode gre ip is the default and isn't shown."},
  {f:"Tunnel line-protocol rules", b:"Up/up when: not shut; the source is up/up with an IP; a destination is set; there is a route to it (the default counts) that doesn't point into the tunnel. The far end does NOT have to answer unless keepalives are on."},
  {f:"GRE keepalives", b:"keepalive 10 3: a test every 10 s, line protocol down after 3 missed replies. Makes up/up honest (and withdraws statics through a dead tunnel). The two ends needn't agree; the far end needs a matching tunnel. Shown as Keepalive set (10 sec), retries 3."},
  {f:"show interfaces tunnel 0: what to read", b:"Tunnel0 is up, line protocol is up/down · BW 100 Kbit/sec (default) · Keepalive not set / set · Tunnel source A (Gi0/1), destination B · Tunnel protocol/transport GRE/IP · Tunnel transport MTU 1476 bytes. The MTU 9976 line is a buffer figure, not the tunnel MTU."},
  {f:"OSPF over a GRE tunnel", b:"Network type POINT_TO_POINT (FULL/  -, no DR). Default tunnel BW 100 Kbit/s → cost 1000, so a far LAN is [110/1001]. bandwidth 10000 on both tunnels → cost 10. Advertise LANs and the tunnel subnet only."},
  {f:"Recursive routing", b:"The best route to the tunnel destination points out of the tunnel itself (usually because the far end advertised its WAN subnet into OSPF). IOS logs %TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing; the tunnel flaps. Fix: keep the underlay out of OSPF; add a /32 static to the destination via the ISP."},
  {f:"Tunnels and traceroute / TTL", b:"ISP routers decrement only the outer TTL. The inner packet loses one TTL per tunnel router, so the whole internet path is one hop: tracert shows the far tunnel address, and a PC two routers away sees TTL 126."},
  {f:"GRE over IPsec", b:"GRE wraps (carries OSPF, multicast); IPsec ESP then encrypts the GRE packet, usually in transport mode (outer protocol becomes 50). Real IOS: tunnel protection ipsec profile NAME on the tunnel. Alternative: IPsec VTI (tunnel mode ipsec ipv4). Edge ACL: ESP + UDP 500/4500, not GRE."},
  {f:"DMVPN", b:"Cisco Dynamic Multipoint VPN: one mGRE (multipoint GRE) tunnel on the hub; spokes register their public (NBMA) address with the hub using NHRP and resolve other spokes through it, building spoke-to-spoke tunnels on demand; IPsec encrypts; a routing protocol runs on top. Adding a spoke doesn't change the hub."},
  {f:"Site-to-site vs remote access", b:"Site-to-site (GRE over IPsec, VTI, DMVPN): router to router, always on, hosts need nothing. Remote access (Module 8): one user's device, a client (TLS on TCP 443 / DTLS, or IKEv2 on UDP 500/4500), user login + MFA, split or full tunnelling."},
],
});

// ---------- Module 10 · Lesson 4 ----------
L.push({
id:"wan-sdwan", mins:100, level:"Intermediate · builds on lessons 1–3 and Modules 5, 8 and 9",
t:"SD-WAN — overlay and underlay, the Cisco Catalyst SD-WAN Manager, Controller, Validator and WAN Edges, and how it compares with MPLS and DMVPN",
html:`
${K.goals([
  "Name the four limits of a traditional multi-link WAN and say how SD-WAN answers each.",
  "Separate overlay from underlay, name transports by colour, and count the tunnels a design builds.",
  "Give each Cisco Catalyst SD-WAN component its current and old name, its plane, its job and what breaks when it fails.",
  "Walk a new branch router through zero-touch provisioning, and pick each application's path from measured loss, delay and jitter.",
  "Choose between MPLS, DMVPN and SD-WAN (or a mix) for an organisation and defend the choice.",
])}
${K.pre([
  "Lessons 1–3 of this module: WAN architectures; WAN types (MPLS and the customer, provider-edge and provider router roles, broadband, 4G/5G, hub-and-spoke versus full mesh); GRE tunnels, GRE over IPsec and Cisco's dynamic multipoint VPN.",
  "Module 5: static routes, administrative distance and floating statics, OSPF neighbours.",
  "Module 8 lesson 3: IPsec site-to-site VPNs. Module 7: QoS markings (DSCP).",
  "Module 9 lesson 3: the management, control and data planes, and why a controller takes the decisions that need the whole network's view.",
])}

<h2>Why this matters at work</h2>
<p>A microfinance bank has 40 branches across Nigeria. Every branch has an MPLS circuit, which carries everything, and a business broadband link that sits idle as the backup. For three weeks the Port Harcourt branch has had the same complaint at about 10:00 every morning: calls to head office sound robotic and card payments time out. The MPLS link never goes down. It just gets <i>bad</i>, dropping a few packets in every hundred, while the broadband link carries nothing.</p>
<p>The CIO asks: &ldquo;Why do we only ever use one of the two links we pay for, why can't the network notice that one is bad, and why does opening the Kano branch need an engineer on a flight with a laptop?&rdquo; The industry's answer to all three is <b>SD-WAN</b>. This lesson covers what it fixes, how it is built (overlay and underlay, Cisco's four components), how a branch router configures itself out of the box, how it chooses a path per application, and how it compares with MPLS and ${K.g("DMVPN","Dynamic Multipoint VPN (Cisco): hub-and-spoke GRE over IPsec tunnels across the internet, with spoke-to-spoke tunnels on demand. Lesson 3.")}. On the bench you'll feel the problem first: a carrier fault that two good links and a backup route can't get around.</p>

<h2>The problem: two links, one blind choice</h2>
${K.remember(`<b>The rule:</b> a traditional router picks a path by <b>destination only</b>, from a table built <b>box by box</b>, and changes its mind only when something <b>it can see</b> goes down: its own interface, or a routing neighbour. ${K.g("SD-WAN","Software-defined WAN: central controllers configure every site's routers, which build encrypted tunnels over any transports, measure every path and choose a path per application.")} keeps the routing and adds three things: a <b>central brain</b> that configures every site at once, <b>constant measurement</b> of every path from end to end, and <b>policy that chooses a path per application</b>.`)}
<p>Lesson 2 called a branch with links to two carriers <b>dual-carrier</b>, and Module 5 gave you the tool for the second link: a <b>floating static</b>, a backup route with a higher administrative distance that enters the table only when the main route leaves it. Thousands of branches run that design. It has four limits, and each is a reason SD-WAN exists.</p>
<h3>1. Every router is configured on its own</h3>
<p>Forty branches means forty routers, each with its own routes and backup routes typed at its own CLI. One new head-office subnet means forty logins, and on one of them somebody mistypes a digit. Module 9 lesson 3 had the same problem with autonomous access points, which is why Wi-Fi controllers exist.</p>
<h3>2. The path is chosen by destination, not by application</h3>
<p>A routing table has one best route per prefix. It has no column for &ldquo;voice call&rdquo; or &ldquo;overnight backup&rdquo;. A voice packet and a 2 GB backup to the same subnet follow the same next hop. QoS (Module 7) can prioritise voice <i>within</i> a link, not send it down a different one.</p>
<h3>3. The router can't see failures beyond its own link, or links that are up but bad</h3>
<p>A static route stays while its exit interface is up and its next hop resolves; it never tests whether packets reach the far site. If the carrier fails somewhere past the router's own cable, the interface stays up/up and traffic goes into a black hole. Worse is a ${K.g("brownout","A link that is up but performing badly: losing packets, adding delay or jitter. Routing sees an up interface; users feel the damage.")}: the link passes most traffic but loses 6% of packets, with wildly varying delay (${K.g("jitter","The variation in delay from one packet to the next. Voice and video need it low: packets arriving unevenly sound robotic or freeze.")}). OSPF hellos still arrive, so even a routing protocol keeps the path.</p>
<h3>4. Capacity is expensive and slow, and the backup sits idle</h3>
<p>MPLS comes with a service-level agreement (${K.g("SLA","Service-level agreement: the provider's written promise about availability, delay or loss, with penalties if it misses them.")}), costs accordingly and can take weeks to order. Broadband and 4G are cheap and quick but best-effort. In an active/standby design the second link works only on a bad day.</p>
${K.svg("0 0 760 300",
  K.dev("phone",45,95,"IP phone","")+K.dev("pc",45,205,"Backup PC","")+
  K.link(60,95,96,140)+K.link(64,200,96,160)+
  K.dev("router",120,150,"PHC-R1","Port Harcourt")+
  K.box(260,60,220,46,"Carrier A — MPLS","up/up · 6% loss · 45 ms jitter",true)+
  K.box(260,198,220,46,"Carrier B — broadband","up/up · 0.2% loss · idle")+
  K.link(144,140,260,83)+K.link(480,83,636,140)+
  K.link(144,160,260,221)+K.link(480,221,636,160,"",true)+
  K.dev("router",660,150,"LOS-R1","Lagos HQ")+
  K.txt(370,48,"voice, card payments and backups: all here",{mid:true,c:"bad",f:"body",s:11})+
  K.txt(370,262,"paid for every month, waiting for the MPLS port to go down",{mid:true,f:"body",s:11})+
  K.txt(380,292,"The table: one route per destination, kept while the interface is up/up — however bad the link.",{mid:true,c:"fg",f:"body",s:11}),
  "What the router sees (two up/up links and a valid route) against what users feel (a bad MPLS path and an idle broadband link).")}
${K.analogy(`Delivery drivers who each carry a printed map with one route per address, and change route only if the road outside the depot is closed. A jam 50 km on? They drive into it. SD-WAN is a dispatch office with live traffic reports from every road and one rule book for all drivers: &ldquo;urgent medical parts take the fastest clear road; furniture can take the slow one.&rdquo;`)}
${K.out(`KAN-R1#show interfaces g0/1
GigabitEthernet0/1 is up, line protocol is up
  Hardware is Gigabit Ethernet, address is 0c1a.2b00.0002 (bia 0c1a.2b00.0002)
  Description: WAN CARRIER-A MPLS
  Internet address is 10.255.4.2/30
  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,
     reliability 255/255, txload 1/255, rxload 1/255`, "Every line describes this router's own end of the cable: reliability 255/255 means no errors on this port, even if the carrier drops packets 300 km away.")}
<h3>Try it: what a branch router can and can't tell you</h3>
${K.term({env:"ios2", title:"KAN-R1 — two WAN links, one table", opts:{kind:"router", host:"KAN-R1", model:"ISR 4331", motd:"KAN-R1 — Kano branch router (lab). Console session, no enable secret."},
  setup:env=>{ ["enable","configure terminal","no ip domain-lookup","interface g0/0","description KANO LAN","ip address 10.60.1.1 255.255.255.0","no shutdown","interface g0/1","description WAN CARRIER-A MPLS","ip address 10.255.4.2 255.255.255.252","no shutdown","interface g0/2","description WAN CARRIER-B METRO-E","ip address 10.255.8.2 255.255.255.252","no shutdown","exit","ip route 10.10.0.0 255.255.0.0 10.255.4.1","ip route 10.10.0.0 255.255.0.0 10.255.8.1 10","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"KAN-R1 has two WAN links: Carrier A's MPLS on Gi0/1 and Carrier B's Metro Ethernet on Gi0/2 (lesson 2), with a primary and a floating static route to head office (10.10.0.0/16). Ask it what it knows.",
  tasks:[
    {text:"<code>enable</code>, then <code>show ip interface brief</code>. Both WAN links are up/up. Does that tell you either link is delivering packets to Lagos?", done:e=>e.history.some(h=>/^\s*sh\S*\s+ip\s+int\S*\s+br/i.test(h))},
    {text:"<code>show ip route 10.10.1.20</code> (the head-office voice server) and <code>show ip route 10.10.5.40</code> (the backup server). Same entry, same next hop: where in the table could &ldquo;this is a voice call&rdquo; change the path?", done:e=>e.history.some(h=>/^\s*sh\S*\s+ip\s+ro\S*\s+10\.10\.1\.20\s*$/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+ip\s+ro\S*\s+10\.10\.5\.40\s*$/i.test(h))},
    {text:"<code>show interfaces g0/1</code>: find the reliability and load lines. What do they measure, and whose end of the link?", done:e=>e.history.some(h=>/^\s*sh\S*\s+int\S*\s+g\S*0\/1\s*$/i.test(h))},
    {text:"Head office adds a card-payments subnet, 10.30.0.0/16. Give this branch the same pair: <code>configure terminal</code>, <code>ip route 10.30.0.0 255.255.0.0 10.255.4.1</code> and the floating backup <code>ip route 10.30.0.0 255.255.0.0 10.255.8.1 10</code>, then <code>end</code>", done:e=>(e.routes||[]).some(r=>r.net==="10.30.0.0" && r.mask==="255.255.0.0" && r.nh==="10.255.4.1" && !(+r.ad>1)) && (e.routes||[]).some(r=>r.net==="10.30.0.0" && r.mask==="255.255.0.0" && r.nh==="10.255.8.1" && +r.ad===10)},
    {text:"<code>show running-config | section ip route</code> (the <code>| section</code> filter shows only the matching lines, Module 2). Four lines on this router. How many lines, and logins, for 40 branches?", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+run\S*\s*\|\s*s\S*\s+ip\s+route/i.test(h)) && (e.routes||[]).filter(r=>r.net==="10.30.0.0").length===2},
  ],
  win:"You just saw the three blind spots from the router's side: up/up says nothing about the far end, one prefix gives one path whatever the application, and every change is typed into one box at a time. For 40 branches that's 80 new lines and 40 logins. SD-WAN writes that change once, centrally.",
  solve:["enable","show ip interface brief","show ip route 10.10.1.20","show ip route 10.10.5.40","show interfaces g0/1","configure terminal","ip route 10.30.0.0 255.255.0.0 10.255.4.1","ip route 10.30.0.0 255.255.0.0 10.255.8.1 10","end","show running-config | section ip route"]})}
${K.hint(`Task 2: both lookups land on the same 10.10.0.0/16 entry, <code>* 10.255.4.1</code>: the table is keyed by destination only. Task 4: without the 10 at the end, both routes have distance 1 and share the traffic.`)}
${K.mistake(`Reading &ldquo;up/up&rdquo; as &ldquo;working&rdquo;. It means this router's port has a signal and its line protocol is alive. It says nothing about the carrier's network, the far router or packet loss in between. Prove a WAN path with a ping or traceroute to the far site, not with <code>show ip interface brief</code>.`)}
${K.check({q:"A branch has MPLS (primary static, AD 1) and an internet-based backup (floating static, AD 10). Which event makes the router move to the backup by itself?", o:["The MPLS link starts losing 5% of packets","The carrier's router at the far end of the MPLS network crashes, while the branch's own MPLS port stays up","Someone unplugs the branch router's MPLS cable, so its MPLS interface goes down","Voice calls need lower jitter than the MPLS link gives"], a:2, why:"A static route leaves the table when its exit interface goes down or its next hop stops resolving. Only the unplugged cable does that. Loss, jitter and failures past the router's own link leave the interface up/up, so the primary route stays."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A logistics company's Abuja depot router has MPLS (primary static) and a 4G router as backup (floating static). Which two events will the routing table handle automatically? (Choose two.)", o:["The MPLS cable is cut in the street, so the depot router's MPLS port loses link","The MPLS link loses 8% of packets every afternoon","Carrier A's link between its own core and the head office fails","An engineer types shutdown on the depot router's MPLS interface","Video calls should use the 4G link while file sync uses MPLS"], a:[0,3], why:"1. What is asked? Which events change the routing table on their own. 2. Which rule? A static route is removed only when something the router can see changes: its exit interface going down, or its next hop no longer resolving. 3. Apply it: a cut cable and a shutdown both take the interface down, so the floating route takes over. Loss, a failure deeper in the carrier's network and per-application choices are invisible to the table."})}

<h2>Overlay and underlay: tunnels over any transport</h2>
${K.remember(`<b>The rule:</b> the ${K.g("underlay","The transport networks that actually carry packets between sites.")} is whatever carries IP packets between sites: MPLS, broadband, 4G/5G. The ${K.g("overlay","The virtual network built on top of the underlay: here, the tunnels between WAN Edge routers.")} is the set of encrypted tunnels the SD-WAN routers build across it, and it is what your traffic and policy see. If a transport carries IP between two routers, SD-WAN can tunnel across it.`)}
<p>You have built an overlay already. Lesson 3's GRE tunnel was a packet inside a packet: the outer header crossed the internet (the underlay), the inner one was the original packet (the overlay), and OSPF ran across it as if the branches shared a cable. SD-WAN does the same at scale without you typing tunnel commands: every SD-WAN router builds IPsec tunnels (Module 8) to the other sites over every transport it has, encrypted by default.</p>
<p>That gives ${K.g("transport independence","Using and mixing any transport that carries IP, because the overlay hides the difference.")}: a branch can have MPLS and broadband today, swap MPLS for a second broadband line next year and add 4G in an afternoon, with the same policy throughout.</p>
${K.svg("0 0 760 330",
  K.txt(12,70,"OVERLAY",{c:"accent",b:true,s:12})+K.txt(12,86,"tunnels your",{f:"body",s:10.5})+K.txt(12,100,"traffic and",{f:"body",s:10.5})+K.txt(12,114,"policy see",{f:"body",s:10.5})+
  K.txt(12,262,"UNDERLAY",{c:"fg",b:true,s:12})+K.txt(12,278,"any transport",{f:"body",s:10.5})+K.txt(12,292,"that carries IP",{f:"body",s:10.5})+
  K.link(10,195,750,195,"",true)+
  `<path d="M240,104 Q450,40 660,104" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="6 4"/>`+
  K.link(266,112,424,112,"",true)+K.link(476,112,634,112,"",true)+
  K.txt(450,62,"IPsec tunnels (BFD tests each one)",{mid:true,c:"accent",s:10.5})+
  K.dev("router",240,120,"","")+K.dev("router",450,120,"","")+K.dev("router",660,120,"","")+
  K.txt(272,152,"LOS-E1",{c:"fg",b:true,f:"display",s:11.5})+K.txt(272,165,"Lagos HQ",{s:10})+
  K.txt(482,152,"ABJ-E1",{c:"fg",b:true,f:"display",s:11.5})+K.txt(482,165,"Abuja",{s:10})+
  K.txt(692,152,"KAN-E1",{c:"fg",b:true,f:"display",s:11.5})+K.txt(692,165,"Kano",{s:10})+
  K.link(232,136,292,246)+K.link(248,136,462,246)+
  K.link(442,136,312,246)+K.link(458,136,482,246)+
  K.link(652,136,502,246)+K.link(668,136,656,246)+
  K.dev("cloud",300,268,"MPLS","colour: mpls")+K.dev("cloud",485,268,"Internet","colour: biz-internet")+K.dev("cloud",655,268,"4G","colour: lte"),
  "Bottom: the underlay, three transports. Top: the overlay, the tunnels the WAN Edges build across them. Kano has no MPLS, yet its tunnels look the same to policy as everyone else's.")}
<h3>Cisco's words for a transport: TLOC and colour</h3>
<p>Cisco Catalyst SD-WAN gives every router a ${K.g("system IP","A unique ID for each SD-WAN device, written like an IPv4 address (for example 1.1.1.10), like an OSPF router ID.")} and labels each transport with a <b>colour</b>: <code>mpls</code>, <code>biz-internet</code>, <code>public-internet</code>, <code>lte</code>, <code>metro-ethernet</code> and others. One router's attachment to one transport is a ${K.g("TLOC","Transport locator: one SD-WAN router's attachment to one transport.")}: system IP + colour + encapsulation (IPsec or GRE). Tunnels run TLOC to TLOC, and policy speaks in colours (&ldquo;voice prefers biz-internet&rdquo;): beyond the CCNA, but day-one vocabulary on the job.</p>
<h3>Worked example: how many tunnels?</h3>
<p>Use lesson 2's full-mesh formula once per colour. A common design builds tunnels only between matching colours, because an MPLS address often can't reach an internet one.</p>
${K.steps([
  ["The design", "Five sites; every site has <code>mpls</code> and <code>biz-internet</code>. Full mesh, tunnels between matching colours only."],
  ["Pairs of sites", "Full mesh among n sites: n(n−1)/2 = 5 × 4 ÷ 2 = <b>10</b> pairs."],
  ["Per colour", "Each pair gets one tunnel per shared colour: 10 on mpls + 10 on biz-internet = <b>20 tunnels</b>."],
  ["Per router", `Each router has 4 peers × 2 colours = <b>8 tunnels</b>, each one tested by its own ${K.g("BFD","Bidirectional Forwarding Detection: small hellos sent both ways through a path to detect failure fast; SD-WAN also uses them to measure loss, latency and jitter.")} session (later in this lesson).`],
  ["The twist", "Kano drops MPLS and keeps internet only. mpls: 4 sites → 6 tunnels. biz-internet: still 5 sites → 10. Total <b>16</b>; Kano itself terminates 4."],
])}
${K.dyk(`A 100-site full mesh has 100 × 99 ÷ 2 = 4,950 site pairs. With classic IPsec every pair negotiates its own keys with IKE (Module 8). In Cisco Catalyst SD-WAN the Controller hands each router its peers' keys, so a new site needn't negotiate with 99 others first.`)}
${K.check({q:"In SD-WAN, which is the underlay?", o:["The IPsec tunnels between the SD-WAN routers","The MPLS, broadband and 4G networks that carry the tunnels' packets","The policy that decides which application uses which path","The controllers that distribute routes"], a:1, why:"The underlay is the transport that really carries packets. The tunnels are the overlay; policy and controllers sit above both."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A pharmacy chain has 8 sites, all with mpls and biz-internet; 3 of them also have lte. Tunnels are built in a full mesh between matching colours only. How many tunnels exist in total, and how many does one of the lte sites terminate?", fields:[{label:"Total tunnels", a:["59"]},{label:"Tunnels at one lte site", a:["16"]}], why:"1. What is asked? A tunnel count per design and per router. 2. Which rule? Full mesh per colour: n(n−1)/2 pairs among the sites that have that colour, then add the colours. 3. Apply it: mpls 8×7÷2 = 28, biz-internet 28, lte 3×2÷2 = 3, total 59. An lte site has 7 mpls peers + 7 biz-internet peers + 2 lte peers = 16."})}

<h2>Cisco Catalyst SD-WAN: four roles, four planes</h2>
${K.remember(`<b>The rule:</b> split the WAN's work by plane, as Module 9 split Wi-Fi between the AP and its controller. Work done <b>per packet</b> stays in the router at each site. Work that needs <b>the whole network's view</b> moves to central components. Cisco gives each plane its own component, and user traffic never passes through the central ones.`)}
<p>Cisco's SD-WAN came from Viptela, a company Cisco bought in 2017, whose parts were vManage, vSmart, vBond and vEdge. When the product became <b>Cisco Catalyst SD-WAN</b>, Cisco renamed the central parts. Documentation, CLI output, job adverts and exams use both sets of names.</p>
<div class="tablewrap"><table>
<tr><th>Component (old name)</th><th>Plane</th><th>What it does</th><th>If it fails</th></tr>
<tr><td><b>SD-WAN Manager</b> (vManage)</td><td>Management</td><td>The single GUI and ${K.g("API","Application programming interface: a way for programs, not people, to query or command a system. Module 11.")} for the whole WAN: configuration templates, monitoring, upgrades, certificates, policy</td><td>Traffic flows; no configuration changes or dashboards</td></tr>
<tr><td><b>SD-WAN Controller</b> (vSmart)</td><td>Control</td><td>The brain of the overlay. Runs ${K.g("OMP","Overlay Management Protocol: Cisco SD-WAN's control protocol between Controllers and WAN Edges, carrying routes, TLOCs, keys and policy.")} with every router: learns each site's routes and TLOCs and hands them to the others, distributes encryption keys, applies central policy (full mesh, hub-and-spoke)</td><td>Edges forward on what they last learned for a while (graceful restart); changes stop spreading</td></tr>
<tr><td><b>SD-WAN Validator</b> (vBond)</td><td>Orchestration</td><td>First point of contact: authenticates each new router by certificate, tells it where the Manager and Controllers are, helps routers behind NAT find each other. Needs a public IP</td><td>Running sites carry on; new or rebooting routers can't join</td></tr>
<tr><td><b>WAN Edge</b> (vEdge; Cisco IOS XE routers were called cEdge)</td><td>Data</td><td>The router at each site (Catalyst 8000, ISR 1000/4000, ASR 1000, virtual Catalyst 8000V): builds the tunnels, runs BFD, forwards user traffic, runs OSPF or BGP towards the LAN</td><td>That site, or that half of a two-router site, is off the overlay</td></tr>
</table></div>
<p>You'll also see <b>SD-WAN Analytics</b> (formerly vAnalytics), an optional trends service, and <b>Cloud OnRamp</b>, features that connect sites straight to cloud and ${K.g("SaaS","Software as a service: applications run by a provider and used over the internet, such as hosted email. Lesson 7 defines it properly.")} services. The Manager, Controller and Validator usually run as virtual machines, hosted by Cisco or in the organisation's own data centre, with at least two Controllers and Validators in production.</p>
${K.svg("0 0 760 350",
  K.band(10,22,140,40,"MANAGEMENT")+K.box(165,18,240,48,"SD-WAN Manager","formerly vManage",true)+K.txt(420,46,"GUI + API: configure, monitor, upgrade",{c:"fg",f:"body",s:11})+
  K.band(10,84,140,40,"CONTROL")+K.box(165,80,240,48,"SD-WAN Controller","formerly vSmart",true)+K.txt(420,108,"OMP: routes, TLOCs, keys, policy",{c:"fg",f:"body",s:11})+
  K.band(10,146,140,40,"ORCHESTRATION")+K.box(165,142,240,48,"SD-WAN Validator","formerly vBond",true)+K.txt(420,170,"first contact: checks identity, introduces",{c:"fg",f:"body",s:11})+
  K.band(10,232,140,40,"DATA")+
  K.dev("router",260,250,"LOS-E1","WAN Edge")+K.dev("router",470,250,"ABJ-E1","WAN Edge")+K.dev("router",680,250,"KAN-E1","WAN Edge")+
  K.link(286,250,444,250,"",true)+K.link(496,250,654,250,"",true)+
  K.txt(365,240,"IPsec + BFD",{mid:true,c:"accent",s:10})+K.txt(575,240,"IPsec + BFD",{mid:true,c:"accent",s:10})+
  K.txt(380,322,"Each WAN Edge keeps secure control connections (DTLS or TLS) to the Manager and the Controllers,",{mid:true,f:"body",s:10.5})+
  K.txt(380,338,"meets the Validator when it joins, and sends user traffic only through the tunnels.",{mid:true,f:"body",s:10.5}),
  "The four Cisco Catalyst SD-WAN components and the plane each one owns. The three central components never carry user traffic.")}
<p>Control connections use DTLS (met with CAPWAP in Module 9) or TLS. Over them the Manager pushes configuration with ${K.g("NETCONF","Network Configuration Protocol: a standard way for software to read and write a device's configuration. Module 11.")} and the Controller runs OMP.</p>
${K.remember(`<b>M-C-V-E, and the old names:</b> the <b>Manager</b> manages (v<b>Manage</b>, the GUI). The <b>Controller</b> is the smart one that controls routes (v<b>Smart</b>). The <b>Validator</b> makes the first handshake, the bond (v<b>Bond</b>). The <b>Edge</b> forwards at the edge (v<b>Edge</b>). Planes in order: management, control, orchestration, data.`)}
${K.myth([
  ["If the SD-WAN Manager goes down, the WAN stops.","It is the management plane: forwarding carries on; you lose dashboards and changes until it returns."],
  ["SD-WAN traffic flows through the controllers.","Controllers handle routes, keys and policy only. User traffic goes WAN Edge to WAN Edge through the tunnels."],
  ["SD-WAN replaces MPLS.","SD-WAN is an overlay; MPLS can be one of its underlays, and many organisations keep it at key sites."],
  ["SD-WAN makes a cheap internet link as good as MPLS.","It moves traffic away from a bad path but can't make a bad link good, or help when every link at a site fails together."],
])}
${K.check({q:"Which Cisco Catalyst SD-WAN component runs OMP with every WAN Edge and distributes routes, encryption keys and central policy?", o:["SD-WAN Manager (vManage)","SD-WAN Controller (vSmart)","SD-WAN Validator (vBond)","The WAN Edge (vEdge/cEdge)"], a:1, why:"The Controller is the control plane: it learns every site's routes and TLOCs over OMP and reflects them, with keys and policy, to the other edges. The Manager is management (GUI, configuration), the Validator orchestration (first contact), the WAN Edge data."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"An SD-WAN network has an outage report from four different days. Match each failure with its most likely effect.", pairs:[["Both SD-WAN Manager servers are unreachable for an hour","Tunnels keep forwarding, but no one can change configuration or see dashboards"],["Every SD-WAN Controller is unreachable","Edges forward on last-learned routes for a while; new routes and policy don't spread"],["The SD-WAN Validator is down while a new Enugu router is unboxed","Running sites carry on, but the Enugu router can't join the overlay"],["The only WAN Edge at the Jos branch loses power","Jos drops off the overlay; every other site is unaffected"]], why:"1. What is asked? The effect of losing each component. 2. Which rule? Each component owns one plane, and user traffic flows only through the WAN Edges and their tunnels. 3. Apply it: lose management and you lose control of the network but not its traffic; lose the control plane and the edges run on what they know; lose orchestration and only joining stops; lose a data-plane router and its site goes dark."})}

<h2>Zero-touch provisioning: a router that configures itself</h2>
${K.remember(`<b>The rule:</b> a new WAN Edge knows only its serial number and certificate. Give it an address and a way to the internet, and it asks, in order: <b>where do I belong?</b> (a Cisco cloud service), <b>am I allowed?</b> (the Validator), <b>what is my configuration?</b> (the Manager), <b>what are the routes, keys and policy?</b> (the Controller). Then it builds its tunnels.`)}
<p>The old way: stage the router at head office, ship it, then talk someone through the cabling or fly an engineer out. ${K.g("Zero-touch provisioning (ZTP)","A new device configures itself on first boot by contacting a provisioning service, so nobody has to type its configuration on site.")} turns that into &ldquo;plug in the cables and switch it on&rdquo;. For Cisco IOS XE WAN Edges the first stop is Cisco's ${K.g("Plug and Play Connect","PnP Connect: Cisco's cloud service that recognises a device by its serial number and tells it which organisation's SD-WAN Validator to contact.")} cloud service; older vEdge routers used an equivalent ZTP server.</p>
${K.steps([
  ["Before it ships", "The team adds the router's serial number to the organisation's device list (so the Manager and Validator will recognise it) and, in the Manager, attaches a configuration: hostname, site ID, system IP, interfaces, transports."],
  ["On site", "Someone with no network training connects the WAN cable to the port that runs DHCP by default, connects the LAN and powers on."],
  ["Get an address", "The router gets an address, gateway and DNS server from the ISP by DHCP (Module 7), over broadband, 4G or fibre."],
  ["Where do I belong?", "Plug and Play Connect looks up its serial number and replies with the organisation's Validator address."],
  ["Am I allowed?", "Router and Validator prove their identities with certificates; the Validator checks the serial against the authorised list and gives the router the Manager and Controller addresses. This connection is temporary."],
  ["What is my configuration?", "The Manager pushes the full configuration over NETCONF."],
  ["Routes, keys, policy", "Over OMP the Controllers give it the other sites' routes, TLOCs, keys and policy, and it advertises its own."],
  ["Live", "It builds IPsec tunnels to the other WAN Edges, BFD starts measuring them, and the branch is on the overlay."],
])}
${K.svg("0 0 760 330",
  K.box(20,14,120,40,"NEW WAN EDGE","Kano branch",true)+K.box(170,14,120,40,"PnP CONNECT","Cisco cloud")+K.box(320,14,120,40,"VALIDATOR","")+K.box(470,14,120,40,"MANAGER","")+K.box(620,14,120,40,"CONTROLLER","")+
  K.link(80,54,80,318,"",true)+K.link(230,54,230,318,"",true)+K.link(380,54,380,318,"",true)+K.link(530,54,530,318,"",true)+K.link(680,54,680,318,"",true)+
  K.txt(90,82,"① DHCP from the ISP",{s:10.5})+
  K.arrow(80,112,226,112,"② serial no.?",true)+K.arrow(230,124,84,124)+K.txt(156,140,"→ Validator",{mid:true,s:10})+
  K.arrow(80,166,376,166,"③ certificates (DTLS)",true)+K.arrow(380,178,84,178)+K.txt(230,194,"→ Manager, Controllers",{mid:true,s:10})+
  K.arrow(80,220,526,220,"④ my configuration?",true)+K.arrow(530,232,84,232)+K.txt(305,248,"→ full config (NETCONF)",{mid:true,s:10})+
  K.arrow(80,274,676,274,"⑤ OMP: routes, TLOCs, keys, policy",true)+K.arrow(680,286,84,286)+
  K.txt(90,312,"⑥ IPsec tunnels + BFD to the other edges: the site is live",{c:"ok",f:"body",s:11}),
  "Zero-touch provisioning, in order. Each conversation tells the router where the next one is.")}
<h3>Worked example: the Kano branch opens on Monday</h3>
<p>Friday: the Lagos team enters the new Catalyst 8200's serial number, attaches the &ldquo;small branch, broadband + 4G&rdquo; configuration with Kano's site ID, system IP and LAN subnet, and couriers the box. Monday 09:00: the branch manager plugs in the ISP cable and the LAN switch and powers on. By about 09:15 the Manager shows KAN-E1 with control connections up and tunnels to every site. Nobody typed a command in Kano.</p>
${K.mistake(`Shipping the router before its serial is on the device list or a configuration is attached. It reaches Plug and Play, is turned away or gets no configuration, and sits retrying while the branch waits. Check its status in the Manager before the courier leaves.`)}
${K.mistake(`Assuming every transport works for zero-touch. The out-of-the-box router expects DHCP on its WAN port. If the ISP gives a static address or needs a username-and-password login, it can't reach Plug and Play alone: pre-stage it, or give it a small bootstrap configuration file.`)}
${K.check({q:"A new WAN Edge at a branch got an address by DHCP and contacted Cisco's Plug and Play service, but the Validator refuses it. Which is the most likely cause?", o:["The ISP's DHCP server is down","Its serial number isn't on the organisation's authorised device list","The Controller has no routes for the branch yet","The branch LAN switch is not cabled"], a:1, why:"DHCP and Plug and Play already worked, so the failure is at the Validator step: the Validator authenticates the router and checks its serial against the authorised list. The Controller comes later, and the LAN plays no part in joining."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"The WAN Edge at an Enugu branch died and a replacement with a new serial number has arrived. The team has added the new serial and moved Enugu's configuration onto it. Put what happens after it is powered on in order.", items:["It gets an address from the ISP by DHCP on its WAN port","It asks Plug and Play Connect which organisation it belongs to","It proves its identity to the Validator and learns where the Manager and Controllers are","The Manager pushes Enugu's configuration to it","It learns routes, keys and policy from the Controllers over OMP","It builds IPsec tunnels to the other sites and BFD starts measuring them"], why:"1. What is asked? The join order for a replacement. 2. Which rule? Each step tells the router where to go next: address, then who it belongs to, then whether it is allowed, then its configuration, then the overlay's routes and keys, then tunnels. 3. Apply it: a replacement follows the same steps as a brand-new router. The only extra work was before power-on: the new serial on the list and Enugu's configuration attached to it."})}
${K.hint(`Twist: the replacement gets its address and reaches Plug and Play, but Enugu's ISP blocks outbound traffic to anything except web ports, so it can't reach the Validator. Which step fails, and what does the branch see?`)}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> Where the chain breaks. <b>2. Which rule?</b> Every step depends on reaching the next component. <b>3. Apply it:</b> the Validator step fails, so the router never learns where the Manager and Controllers are: no configuration, no tunnels, no Enugu in the dashboard. The fix is in the underlay (the ISP or firewall must let the control traffic out), not in SD-WAN policy, which is why troubleshooting starts at the underlay.</p>`)}

<h2>Choosing a path per application</h2>
${K.remember(`<b>The rule:</b> <b>measure</b> every path all the time, <b>define</b> what each application needs, then <b>send</b> each application down a path that meets them now, moving it when that path stops qualifying: within minutes by default, faster if tuned.`)}
<h3>Measuring: BFD in every tunnel</h3>
<p>Each tunnel carries BFD hellos, by default about once a second. From them each WAN Edge works out, per tunnel and end to end, the <b>loss</b> (hellos that didn't return), <b>latency</b> (round-trip time) and <b>jitter</b> (how much that time varies). If enough hellos in a row go missing, the tunnel is declared down within seconds, whatever its interfaces say. Because BFD runs <i>through the tunnel to the far router</i>, it sees what a static route can't: a carrier fault in the middle, a dead far end, a brownout.</p>
<h3>Defining needs: SLA classes and application lists</h3>
<p>In the Manager you write what each kind of traffic can tolerate as an <b>SLA class</b>, for example VOICE: loss ≤ 1%, latency ≤ 150 ms, jitter ≤ 30 ms (you choose the values). The router recognises applications by addresses, ports, DSCP markings (Module 7) or ${K.g("deep packet inspection","DPI: looking inside packets, beyond the IP and port numbers, to recognise which application sent them.")}. A policy then says: &ldquo;voice must meet VOICE, prefer biz-internet; payments must meet PAYMENTS; backups go anywhere.&rdquo; That is <b>application-aware routing</b>.</p>
<h3>Worked example: Port Harcourt at 10:00</h3>
<p>The Port Harcourt router has three tunnels to Lagos. Over its recent measurement window, BFD measured:</p>
<div class="tablewrap"><table>
<tr><th>Tunnel to Lagos (colour)</th><th>Loss</th><th>Latency</th><th>Jitter</th></tr>
<tr><td>mpls</td><td>6%</td><td>38 ms</td><td>45 ms</td></tr>
<tr><td>biz-internet</td><td>0.3%</td><td>52 ms</td><td>6 ms</td></tr>
<tr><td>lte</td><td>1.5%</td><td>95 ms</td><td>22 ms</td></tr>
</table></div>
${K.steps([
  ["VOICE (loss ≤ 1%, latency ≤ 150 ms, jitter ≤ 30 ms)", "mpls fails on loss and jitter; lte fails on loss; biz-internet passes all three. Voice moves to <b>biz-internet</b>."],
  ["PAYMENTS (loss ≤ 2%, latency ≤ 200 ms)", "mpls fails (6% loss); biz-internet and lte both pass. Policy prefers biz-internet; lte stays ready as the next choice."],
  ["Backups (no SLA)", "Normal routing, so they can stay on mpls: TCP resends what's lost."],
  ["11:00, MPLS recovers", "BFD sees loss fall under the thresholds and voice can return. Nobody typed a command."],
])}
<p>If <i>no</i> tunnel meets an SLA, the traffic isn't dropped: by default it falls back to ordinary routing across the tunnels that are up, unless the policy names a backup colour or is marked strict, which drops it.</p>
<h3>Central policy and local internet breakout</h3>
<p>A <b>control policy</b> on the Controller sets the topology (full mesh, hub-and-spoke, regional hubs) for every site at once. A <b>data policy</b> can send guest or SaaS traffic straight out of the branch's own internet link instead of through head office: ${K.g("direct internet access","DIA, or local internet breakout: internet-bound traffic leaves by the branch's own internet link.")}. Cloud email and video calls stop crossing the WAN twice (lesson 7).</p>
${K.tip(`Catalyst SD-WAN calls its VRFs (lesson 6) <b>VPNs</b>. VPN 0 is the transport side, VPN 512 is for management, and other numbers carry user traffic (staff, guests, payments) kept apart across the whole overlay. &ldquo;VPN 10&rdquo; on an SD-WAN screen means a VRF, not an IPsec VPN.`)}
${K.check({q:"Why does BFD detect a failure inside the carrier's network that a static route on the same router misses?", o:["BFD reads the carrier's routing table","BFD hellos travel through the tunnel to the far router and back, so it tests the whole path, not just the local interface","BFD raises the interface's reliability counter","BFD shuts the interface down whenever loss appears"], a:1, why:"A static route checks only local facts: the exit interface is up and the next hop resolves. BFD tests end to end, through the tunnel, in both directions; missing or late hellos reveal a failure or a brownout anywhere on the path."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Kaduna branch has three tunnels to head office. mpls: loss 0.5%, latency 41 ms, jitter 12 ms. biz-internet: loss 3%, latency 60 ms, jitter 9 ms. lte: loss 0.8%, latency 160 ms, jitter 35 ms. The VIDEO SLA is loss ≤ 1%, latency ≤ 150 ms, jitter ≤ 30 ms. Which colour meets VIDEO, and how many colours fail it?", fields:[{label:"Colour that meets VIDEO", a:["mpls","MPLS","mpls tunnel","the mpls tunnel"]},{label:"Number that fail", a:["2","two"]}], why:"1. What is asked? Which paths pass an SLA. 2. Which rule? A path must meet every threshold in the class; one miss fails it. 3. Apply it: mpls passes all three. biz-internet fails on loss (3% > 1%). lte has acceptable loss, but fails on latency (160 > 150) and jitter (35 > 30). Video uses mpls; two colours fail."})}

<h3>Hands-on: the failure a static route can't see</h3>
<p>Port Harcourt before SD-WAN: Carrier A's MPLS as primary, Carrier B's E-Line as backup, static routes at both ends. You'll add the branch's backup route, break the carrier's network in the middle, and watch which router notices: the fault BFD catches in seconds.</p>
${K.bench({id:"m10-blind-backup", points:110, from:"CCNA · Module 10 · lesson 4", title:"Port Harcourt: two carriers, one fault the routing table can't see", viewBox:"0 0 1000 470", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Port Harcourt says it can't reach Lagos, but Lagos says its backup took over fine.&rdquo; PHC-R1 reaches LOS-R1 two ways: <b>Carrier A's MPLS</b> through CARRIER-A-PE (one router here stands in for the provider's whole network of edge and core routers, lesson 2), and <b>Carrier B's E-Line</b>, drawn as a cable because to the customer an E-Line looks like one. Routing to the carriers is static, as at many small branches. Your console cable is on PHC-R1 (YOUR LAPTOP → Terminal app, 9600 8N1, no flow control). To work on LOS-R1, unplug the console cable from the laptop's USB port, connect a console cable from the laptop to LOS-R1's CON port and open the terminal again (then <code>enable</code>). Use PHC-PC's Command Prompt for ping and tracert.",
  devices:[
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:20},
    {id:"pc", kind:"pc", label:"PHC-PC", x:20, y:330, ip:"10.40.1.10", mask:"255.255.255.0", gw:"10.40.1.1"},
    {id:"phc", kind:"router", label:"PHC-R1", model:"ISR 4331 · Port Harcourt", x:160, y:200, config:e=>{ ["en","conf t","hostname PHC-R1","no ip domain-lookup","interface g0/0","description PHC LAN","ip address 10.40.1.1 255.255.255.0","no shutdown","interface g0/1","description WAN CARRIER-A MPLS","ip address 10.255.1.2 255.255.255.252","no shutdown","interface g0/2","description WAN CARRIER-B E-LINE","ip address 10.255.9.2 255.255.255.252","no shutdown","exit","ip route 10.10.1.0 255.255.255.0 10.255.1.1","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"pea", kind:"router", label:"CARRIER-A-PE", model:"stands in for the MPLS network", x:400, y:40, config:e=>{ ["en","conf t","hostname CARRIER-A-PE","interface g0/1","description TO PHC-R1","ip address 10.255.1.1 255.255.255.252","no shutdown","interface g0/2","description TO LOS-R1","ip address 10.255.2.1 255.255.255.252","no shutdown","exit","ip route 10.40.1.0 255.255.255.0 10.255.1.2","ip route 10.10.1.0 255.255.255.0 10.255.2.2","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"los", kind:"router", label:"LOS-R1", model:"ISR 4451 · Lagos HQ", x:640, y:200, config:e=>{ ["en","conf t","hostname LOS-R1","no ip domain-lookup","interface g0/0","description LOS SERVER LAN","ip address 10.10.1.1 255.255.255.0","no shutdown","interface g0/1","description WAN CARRIER-A MPLS","ip address 10.255.2.2 255.255.255.252","no shutdown","interface g0/2","description WAN CARRIER-B E-LINE","ip address 10.255.9.1 255.255.255.252","no shutdown","exit","ip route 10.40.1.0 255.255.255.0 10.255.2.1","ip route 10.40.1.0 255.255.255.0 10.255.9.2 10","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"srv", kind:"server", label:"LOS-SRV", x:870, y:330, ip:"10.10.1.20", mask:"255.255.255.0", gw:"10.10.1.1"},
  ],
  cables:[ {type:"console", a:"lap:usb", b:"phc:con"}, {type:"cat6", a:"pc:eth", b:"phc:g0"}, {type:"cat6", a:"phc:g1", b:"pea:g1"}, {type:"cat6", a:"pea:g2", b:"los:g1"}, {type:"cat6", a:"phc:g2", b:"los:g2"}, {type:"cat6", a:"srv:eth", b:"los:g0"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Baseline: on PHC-PC run <code>ping 10.10.1.20</code> (LOS-SRV in Lagos) and <code>tracert 10.10.1.20</code>. Hop 2 is 10.255.1.1: whose router is that?", done:B=>Bench.traced(B,"pc","10.10.1.20") && Bench.routeVia(B,"phc","10.10.1.20")==="10.255.1.1"},
    {text:"Console into PHC-R1, <code>enable</code>, <code>show ip route static</code>. Add the backup over Carrier B: <code>configure terminal</code>, <code>ip route 10.10.1.0 255.255.255.0 10.255.9.1 10</code>, <code>end</code>, then <code>show ip route static</code> again. Why isn't the new route in the table (Module 5)?", done:B=>(B.devs.phc.env.routes||[]).some(r=>r.net==="10.10.1.0" && r.nh==="10.255.9.1" && +r.ad===10) && !!Bench.route(B,"phc","10.10.1.0/24") && Bench.route(B,"phc","10.10.1.0/24").ad===1},
    {text:"The fault: Carrier A's fibre between its network and Lagos is cut. <b>Unplug the cable from CARRIER-A-PE Gi0/2.</b> Then from PHC-PC <code>ping 10.10.1.20</code> and <code>tracert 10.10.1.20</code>. Who replies, and with what message?", done:B=>!Bench.linked(B,"pea:g2","los:g1") && Bench.blocked(B,"pc","10.10.1.20")},
    {text:"On PHC-R1: <code>show ip interface brief</code> and <code>show ip route 10.10.1.20</code>. The path is dead, so why is the router still using it, and why is your backup route still waiting?", done:B=>!Bench.linked(B,"pea:g2","los:g1") && B.devs.phc.env.log.some(l=>/Known via "static", distance 1/.test(l.out||"") && /\* 10\.255\.1\.1/.test(l.out||""))},
    {text:"Move your console cable to LOS-R1 (as the intro explains), <code>enable</code>, then <code>show ip interface brief</code> and <code>show ip route static</code>. Lagos moved to Carrier B by itself: which line shows it, and what could Lagos see that Port Harcourt couldn't?", done:B=>B.devs.los.env.log.some(l=>/S\s+10\.40\.1\.0\/24 \[10\/0\] via 10\.255\.9\.2/.test(l.out||""))},
    {text:"The fix a person makes at 02:00: move the console back to PHC-R1, <code>enable</code>, <code>configure terminal</code>, <code>interface g0/1</code>, <code>shutdown</code>, <code>end</code>, and <code>show ip route static</code>. Then <code>ping</code> and <code>tracert 10.10.1.20</code> from PHC-PC: which hop disappeared, and why did the TTL in the replies go up by one?", done:B=>!!B.devs.phc.env.intfs["GigabitEthernet0/1"].shut && Bench.routeVia(B,"phc","10.10.1.20")==="10.255.9.1" && Bench.pingedNow(B,"pc","10.10.1.20") && Bench.traced(B,"pc","10.10.1.20")},
    {text:"Carrier A repairs the fibre: plug a Cat6 cable back from CARRIER-A-PE Gi0/2 to LOS-R1 Gi0/1. On PHC-R1: <code>configure terminal</code>, <code>interface g0/1</code>, <code>no shutdown</code>, <code>end</code>, <code>show ip route static</code>, and a last <code>tracert 10.10.1.20</code> from PHC-PC. Which path is back, and why didn't you have to delete the backup route?", done:B=>B.devs.phc.env.history.some(h=>/^\s*no\s+shut/i.test(h)) && Bench.up(B,"pea:g2","los:g1") && !B.devs.phc.env.intfs["GigabitEthernet0/1"].shut && Bench.routeVia(B,"phc","10.10.1.20")==="10.255.1.1" && Bench.routeVia(B,"los","10.40.1.20")==="10.255.2.1" && Bench.traced(B,"pc","10.10.1.20") && Bench.pingedNow(B,"pc","10.10.1.20")},
  ],
  win:"You found the blind spot. When the carrier's link to Lagos failed, LOS-R1's own MPLS port went down, so its primary route left the table and the floating route took over by itself. PHC-R1's port stayed up/up and its next hop still answered ARP, so it kept sending traffic into the carrier, which replied &ldquo;Destination host unreachable&rdquo;: half an outage, until a person shut the interface. An SD-WAN router runs BFD through each tunnel to the far router, so both ends would have seen the tunnel die within seconds and moved traffic automatically, and BFD would also have caught the case routing never sees: a link that is up but losing packets.",
  solve:[["pc","pc","ping 10.10.1.20"],["pc","pc","tracert 10.10.1.20"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route static"],
    ["term","configure terminal"],["term","ip route 10.10.1.0 255.255.255.0 10.255.9.1 10"],["term","end"],["term","show ip route static"],
    ["unplug","pea:g2"],["pc","pc","ping 10.10.1.20"],["pc","pc","tracert 10.10.1.20"],
    ["term","show ip interface brief"],["term","show ip route 10.10.1.20"],
    ["unplug","lap:usb"],["plug","console","lap:usb","los:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip interface brief"],["term","show ip route static"],
    ["unplug","lap:usb"],["plug","console","lap:usb","phc:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface g0/1"],["term","shutdown"],["term","end"],["term","show ip route static"],
    ["pc","pc","ping 10.10.1.20"],["pc","pc","tracert 10.10.1.20"],
    ["plug","cat6","pea:g2","los:g1"],["term","configure terminal"],["term","interface g0/1"],["term","no shutdown"],["term","end"],["term","show ip route static"],["pc","pc","tracert 10.10.1.20"]]})}
${K.hint(`Task 3: <b>10.255.1.1</b>, the carrier's router, has lost its own route to Lagos, so it answers &ldquo;Destination host unreachable&rdquo; (Windows counts those as Received). Task 4: Gi0/1 is up/up and 10.255.1.1 is on its connected /30, so the static stays valid and the AD 10 route stays out. Task 5: LOS-R1's Gi0/1 is down/down, so <code>S 10.40.1.0/24 [10/0] via 10.255.9.2</code> took over. Task 6: one router fewer, so TTL 126 instead of 125.`)}
${K.mistake(`Fixing the 02:00 outage by deleting the primary static route. Shut the interface instead: the configuration stays intact and <code>no shutdown</code> restores it after the repair. The traditional automation is IP SLA tracking (pinging the far end and removing a route when pings fail): a CCNP topic, configured router by router, and still not per application.`)}

${K.job("Port Harcourt after SD-WAN — &ldquo;calls are robotic again every morning&rdquo;", `
<p><b>The ticket:</b> &ldquo;Since last week, calls from the Port Harcourt branch to head office break up between about 09:45 and 11:00. We thought SD-WAN fixed this.&rdquo; Two months after the bank moved to Cisco Catalyst SD-WAN, the old complaint is back.</p>
<p><b>Questions first:</b> which sites, which application, when, what changed? (Only Port Harcourt; only calls; a new softphone app went to branches last week.)</p>
<ol>
<li><b>Underlay and tunnels (the Manager's view of PHC-E1).</b> Control connections and all three tunnels to Lagos are up. The mpls tunnel shows 5–7% loss and high jitter from 09:45 to 11:00 daily: the carrier's brownout is back. biz-internet is clean.</li>
<li><b>Is the policy moving traffic?</b> Card payments moved to biz-internet minutes into the brownout, as designed, so measurement and policy work. Why not the calls?</li>
<li><b>What does the policy match?</b> The VOICE rule matches DSCP EF (Module 7). A capture shows the new softphone sends unmarked traffic (DSCP 0), so it misses the VOICE rule and falls through to normal routing, which prefers mpls.</li>
<li><b>Fix, in a change window:</b> add the softphone to the VOICE rule by application name (deep packet inspection) as well as EF; ask the desktop team to make the app mark EF; log a fault with Carrier A. SD-WAN routes around a bad link, it doesn't repair it.</li>
<li><b>Verify the next morning:</b> at 10:30 the Manager shows softphone flows on biz-internet while mpls is lossy; the branch confirms clear calls.</li>
</ol>
<p><b>What you tell the branch manager:</b> &ldquo;The network was steering calls away from the bad line, but the new phone app wasn't labelled as a call. We've taught the network to recognise it, and the carrier is fixing the line.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;Port Harcourt mpls brownout 09:45–11:00 daily (5–7% loss). Payments moved as designed. New softphone sends DSCP 0, missed VOICE rule (EF only), stayed on mpls. Added softphone application to VOICE; desktop team to mark EF; carrier fault raised. Verified: softphone on biz-internet during brownout. Rollback: remove the application match.&rdquo;</p>`)}

<h2>SD-WAN, MPLS and DMVPN compared — and choosing</h2>
${K.remember(`<b>The rule:</b> <b>MPLS is a service you buy</b>: the provider builds the paths and promises their quality. <b>DMVPN is a design you build</b>, router by router: tunnels over the internet, with a routing protocol choosing paths. <b>SD-WAN is a system you run</b>: controllers build the overlay over any transport, and policy chooses per application. They aren't rivals at the same layer: SD-WAN can use MPLS as one of its underlays.`)}
<p>Recap: in an <b>MPLS Layer 3 VPN</b> (lesson 2) your ${K.g("CE","Customer edge: the customer's router that connects to the provider. It runs no MPLS.")} routers hand packets to the provider's ${K.g("PE","Provider edge: the provider's router facing the customer, keeping each customer's routes in its own VRF.")} routers: any site to any site, with QoS and an SLA, but unencrypted (private, not secret). DMVPN (lesson 3) builds hub-and-spoke tunnels over the internet with multipoint GRE, IPsec and ${K.g("NHRP","Next Hop Resolution Protocol: lets a DMVPN spoke ask the hub for another spoke's public address, so the two can build a direct tunnel.")}, plus spoke-to-spoke tunnels on demand, each router configured at its own CLI.</p>
<div class="tablewrap"><table>
<tr><th></th><th>MPLS Layer 3 VPN</th><th>DMVPN</th><th>SD-WAN</th></tr>
<tr><td><b>Who builds the paths</b></td><td>The provider</td><td>You, router by router (CLI)</td><td>Controllers, from central policy</td></tr>
<tr><td><b>Transports</b></td><td>That provider's network</td><td>Internet (any IP network)</td><td>Any mix: MPLS, broadband, 4G/5G</td></tr>
<tr><td><b>Encryption</b></td><td>None by default</td><td>IPsec (normally added)</td><td>IPsec by default, keys from the Controller</td></tr>
<tr><td><b>Path choice</b></td><td>Provider routing; your routing per prefix</td><td>Routing protocol metrics per prefix</td><td>Per application, from measured loss, latency and jitter</td></tr>
<tr><td><b>Site-to-site</b></td><td>Any to any</td><td>Through the hub, or direct tunnels on demand</td><td>Full mesh, hub-and-spoke or regional, set by policy</td></tr>
<tr><td><b>New site</b></td><td>Order a circuit: weeks</td><td>Ship a router, configure it by hand</td><td>Zero-touch: plug in and power on</td></tr>
<tr><td><b>Quality promise</b></td><td>Yes: the SLA</td><td>No: internet is best effort</td><td>Only what the underlay gives; SD-WAN measures and steers</td></tr>
<tr><td><b>Main cost</b></td><td>Circuits</td><td>Engineering time</td><td>Licences and controllers; cheaper circuits</td></tr>
</table></div>
${K.when([
  ["MPLS only","A few large sites need guaranteed delay and loss","The provider's SLA; nothing to run yourself","Many small sites, cloud-heavy traffic, tight budgets"],
  ["DMVPN","A few dozen Cisco sites, a skilled team, no SD-WAN licence budget","Cheap encrypted internet transport, spoke-to-spoke","Hundreds of sites, frequent changes, per-application needs"],
  ["SD-WAN over MPLS + internet","Critical sites keep MPLS; both links should work, per application","SLA where it matters; the second link earns its keep","Every site is tiny"],
  ["SD-WAN over internet + 4G","Many small, cloud-heavy sites and a small team","Cheap, zero-touch, local breakout","Applications need guarantees the internet can't give"],
], "Which WAN?")}
${K.case("A microfinance bank's 60-branch WAN refresh", `
<p><b>The situation:</b> a microfinance bank: Lagos head office and data centre, a disaster-recovery site in Abuja, 12 large branches and 48 small ones, many in towns reached by one fixed-line provider plus the mobile networks. Every site has MPLS from one carrier. The bill is the second-largest IT cost, new branches wait up to ten weeks for a circuit, core banking is moving to a hosted service, and the IT team is six people.</p>
<p><b>Option A, more MPLS:</b> keeps the SLA, but costs grow, cloud traffic still crosses the WAN to Lagos first, and new branches still wait.</p>
<p><b>Option B, DMVPN over broadband:</b> cheap and quick to install, but 63 routers configured by hand for six people and no per-application path choice.</p>
<p><b>Option C, SD-WAN over a hybrid underlay:</b> MPLS kept at the data centre, the DR site and the 12 large branches; broadband from a second provider where one exists, and 4G everywhere; Cisco-hosted controllers; zero-touch for new branches; SLA classes for voice and payments; local breakout to the hosted banking service and email.</p>
<p><b>The decision:</b> C, for the six-person team (central policy), roll-out speed (a new branch goes live the day its broadband is installed) and the cloud move (local breakout), keeping MPLS where an SLA paid for itself. The pilot's lesson: at two branches the MPLS and broadband cables shared one duct into the building, and one road crew cut both. SD-WAN can only choose between paths that fail <i>separately</i>, so 4G went into every site and carriers were asked for diverse building entries.</p>`)}
${K.dodont([
  "Start an SD-WAN fault from the underlay: can each transport reach the internet and the other sites?",
  "Give each critical site transports that fail separately (different providers, ducts, or 4G).",
  "Write SLA classes from what each application really needs, and test the match rules with real traffic.",
  "Keep at least two Controllers and two Validators, and back up the Manager.",
],[
  "Don't read an up tunnel as a healthy one: check its loss, latency and jitter.",
  "Don't expect SD-WAN to fix a bad carrier link. Raise the fault with the carrier as well.",
  "Don't ship a WAN Edge before its serial is authorised and its configuration attached.",
  "Don't put the Validator behind NAT that hides its address: every new router must reach it.",
])}
${K.exam(`Reading SD-WAN questions: find what is really being asked, then match the clue words. &ldquo;First point of contact&rdquo;, &ldquo;authenticates&rdquo;, &ldquo;orchestration&rdquo;, &ldquo;NAT traversal&rdquo; → <b>Validator (vBond)</b>. &ldquo;GUI&rdquo;, &ldquo;single pane of glass&rdquo;, &ldquo;templates&rdquo;, &ldquo;monitoring&rdquo; → <b>Manager (vManage)</b>. &ldquo;OMP&rdquo;, &ldquo;routes&rdquo;, &ldquo;policy distribution&rdquo;, &ldquo;control plane&rdquo; → <b>Controller (vSmart)</b>. &ldquo;Forwards&rdquo;, &ldquo;data plane&rdquo;, &ldquo;builds tunnels&rdquo; → <b>WAN Edge</b>. Either name set may appear. &ldquo;Underlay&rdquo; = transport, &ldquo;overlay&rdquo; = tunnels. CCNA v1.1 lists WAN architectures (1.2.d) and overlay/underlay architecture (6.3, Module 11); v2.0 (from 3 February 2027) lists controller-based management (5.3). SD-WAN is the textbook example of both.`)}
${K.check({q:"An organisation wants per-application path choice across MPLS and broadband at 80 sites, with new sites brought up without an engineer on site. Which fits?", o:["Add more bandwidth to the MPLS links","DMVPN with OSPF over broadband","SD-WAN with MPLS and broadband as underlays","GRE tunnels with floating static routes at every site"], a:2, why:"Only SD-WAN chooses paths per application from live measurements and offers zero-touch provisioning; it can keep MPLS as one underlay. DMVPN and GRE with statics choose per prefix and are configured router by router; more MPLS bandwidth adds neither feature."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Four organisations ask for advice. Match each with the WAN that fits best.", pairs:[["A stock-exchange data link between two sites that needs guaranteed delay, with a large budget","MPLS (or another private service with an SLA)"],["A chain of 120 small pharmacies using cloud applications, with two IT staff","SD-WAN over broadband and 4G"],["A firm with 6 sites, Cisco routers already in place, a skilled engineer and no budget for SD-WAN licences","DMVPN over the internet"],["A bank keeping its data centres on MPLS but wanting both links at 50 branches in use, chosen per application","SD-WAN with MPLS and internet as underlays"]], why:"1. What is asked? The best fit for each set of needs. 2. Which rule? MPLS is bought for its quality promise; DMVPN is built by hand and suits a few sites and skilled people; SD-WAN is run centrally, suits many sites and choosing per application, and can keep MPLS underneath. 3. Apply it: guaranteed delay means an SLA; 120 small cloud-using sites and two staff means central control and cheap transports; 6 sites and no licence budget suits DMVPN; keeping MPLS while using both links per application is a hybrid SD-WAN."})}

<h2>Interview corner</h2>
${K.hint(`Name the limits of routing by destination with static backups (per-box configuration, destination only, blind to far-end failures and brownouts), then the three things SD-WAN adds.`)}
${K.reveal("&ldquo;What does SD-WAN give you that two links and a floating static route don't?&rdquo;", `<p>"A floating static only reacts to what the router can see: its own interface going down or its next hop disappearing. A carrier failure further along, or a link that's up but losing packets, goes unnoticed. It also chooses by destination only, and it's configured box by box. SD-WAN builds IPsec tunnels over every transport, runs BFD through each one to measure loss, latency and jitter end to end, and moves each application to a path that meets its SLA within minutes. Policy is written once on the Manager, and new sites come up zero-touch. It doesn't fix a bad link, so I'd still raise it with the carrier, but users stop feeling it."</p>`)}
${K.hint(`Give the four components with both names and their planes, then the failure effect of each: management, control, orchestration, data.`)}
${K.reveal("&ldquo;Walk me through the Cisco SD-WAN components. What happens if each one fails?&rdquo;", `<p>"Four. The SD-WAN Manager, formerly vManage, is the management plane: GUI and API for configuration, monitoring and upgrades. If it fails, traffic flows but I can't make changes or see dashboards. The SD-WAN Controller, formerly vSmart, is the control plane: it runs OMP with every WAN Edge and distributes routes, TLOCs, keys and policy. Lose them all and edges forward on what they learned for a while, but changes stop spreading, so we run two or more. The SD-WAN Validator, formerly vBond, is orchestration: it authenticates new routers by certificate and introduces them to the Manager and Controllers; if it's down, only joining stops. The WAN Edges are the data plane; if one fails, its site drops off unless it has a second edge."</p>`)}
${K.hint(`Define both layers, then troubleshoot bottom up: underlay reachability, then control connections, then tunnels and BFD, then policy.`)}
${K.reveal("&ldquo;Explain overlay and underlay. A site's tunnels are down: how do you troubleshoot it?&rdquo;", `<p>"The underlay is the transport that carries packets: MPLS, broadband, 4G. The overlay is the IPsec tunnels the WAN Edges build across it, which traffic and policy see. I troubleshoot bottom up. Underlay first: does the router have an address and a default route on each transport, and can it reach the internet or the other site's transport address? Most dead overlays are a dead underlay or a firewall. Then the control connections: if they're down, I check certificates, the device list, the clock and whether control traffic is allowed. Then BFD sessions per colour, with their loss and latency. Last, policy: is a control policy blocking tunnels to that site?"</p>`)}

${K.drill({title:"keep lessons 2–3 sharp: MPLS roles and tunnel overhead", types:["mplsrole","gremtu"], count:5})}
${K.recap([
  "Traditional routing chooses by destination only, is configured box by box, and misses brownouts and far-end failures; SD-WAN adds a central brain, end-to-end measurement and per-application policy.",
  "Underlay = the transports (MPLS, broadband, 4G/5G); overlay = the IPsec tunnels between WAN Edges. Any IP transport will do.",
  "A TLOC is system IP + colour + encapsulation; tunnels per colour follow n(n−1)/2.",
  "Manager (vManage, management), Controller (vSmart, control, OMP), Validator (vBond, orchestration), WAN Edge (data). User traffic flows only edge to edge.",
  "Zero-touch: DHCP, Plug and Play Connect, Validator, Manager, Controllers, tunnels.",
  "BFD in every tunnel measures loss, latency and jitter; each application gets a path that meets its SLA class.",
  "MPLS is a service you buy, DMVPN a design you build, SD-WAN a system you run, and SD-WAN can use MPLS underneath.",
])}
${K.next(`<b>Lesson 5 — Virtualization.</b> The SD-WAN controllers and the Catalyst 8000V are virtual machines. Next: type 1 and type 2 hypervisors, virtual switches and how a VM's traffic reaches the network, containers versus VMs, and routers and firewalls as software.`)}
`,
quiz:[
  {lvl:1, q:"A new Cisco Catalyst SD-WAN router powers on at a branch. Which component authenticates it first and tells it where the Manager and Controllers are?", o:["SD-WAN Manager (vManage)","SD-WAN Controller (vSmart)","SD-WAN Validator (vBond)","Another WAN Edge"], a:2, why:"The Validator is the orchestration plane: the first point of contact that checks the router's certificate and serial against the authorised list and introduces it to the Manager and Controllers."},
  {lvl:1, type:"match", q:"Match each current Cisco Catalyst SD-WAN name with its old Viptela-era name.", pairs:[["SD-WAN Manager","vManage"],["SD-WAN Controller","vSmart"],["SD-WAN Validator","vBond"],["WAN Edge router","vEdge (IOS XE routers: cEdge)"]], why:"Cisco renamed the components when the product became Catalyst SD-WAN: vManage → Manager, vSmart → Controller, vBond → Validator. The routers at the sites are WAN Edges; vEdge was the original Viptela router and cEdge the name for Cisco IOS XE routers."},
  {lvl:1, q:"In SD-WAN, what is the overlay?", o:["The MPLS, broadband and 4G links at each site","The encrypted tunnels the SD-WAN routers build across those links","The cabling inside each branch","The provider's SLA document"], a:1, why:"The overlay is the virtual network of tunnels between WAN Edges, which user traffic and policy see. The transports underneath are the underlay."},
  {lvl:1, type:"fill", q:"Which protocol does the Cisco SD-WAN Controller run with the WAN Edges to distribute overlay routes, TLOCs, keys and policy? (Give its abbreviation or full name.)", fields:[{label:"Protocol", a:["OMP","Overlay Management Protocol","the Overlay Management Protocol"]}], why:"OMP, the Overlay Management Protocol, runs over the secure control connections between the Controllers and every WAN Edge. The Controller reflects each site's routes and TLOCs to the others."},
  {lvl:1, q:"Which plane does the Cisco SD-WAN Manager belong to?", o:["Data plane","Control plane","Management plane","Orchestration plane"], a:2, why:"The Manager (vManage) is the management plane: GUI, API, configuration, monitoring and upgrades. The Controller is control, the Validator orchestration, the WAN Edges data."},
  {lvl:2, type:"multi", q:"Both SD-WAN Manager servers are unreachable for an hour; Controllers, Validators and WAN Edges are fine. Which two statements are true during that hour? (Choose two.)", o:["Existing tunnels keep forwarding user traffic","Administrators can't push configuration changes or view the dashboards","Every IPsec tunnel drops until the Manager returns","WAN Edges stop learning routes from the other sites","New routers can still be authenticated by the Validator, and then get their full configuration"], a:[0,1], why:"The Manager is the management plane only: forwarding and the control plane (OMP through the Controllers) carry on, but configuration changes and monitoring stop. A new router could pass the Validator but couldn't get its configuration without the Manager."},
  {lvl:2, type:"order", q:"Put the zero-touch provisioning steps of a new Cisco IOS XE WAN Edge in order.", items:["It gets an address on its WAN port by DHCP","Plug and Play Connect recognises its serial number and returns the organisation's Validator address","The Validator authenticates it and gives it the Manager and Controller addresses","The Manager pushes its configuration","The Controllers give it routes, TLOCs, keys and policy over OMP","It builds IPsec tunnels to the other sites"], why:"Each step tells the router where the next one is: address first, then which organisation it belongs to, then authentication and introductions (Validator), then configuration (Manager), then the overlay's routes and keys (Controllers), then the tunnels."},
  {lvl:2, q:"A branch router has a primary static route to head office over MPLS and a floating static (AD 10) over a second carrier. Users can't reach head office. Based on the exhibit, why hasn't the backup taken over?", ex:"PHC-R1#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     10.40.1.1       YES manual up                    up\nGigabitEthernet0/1     10.255.1.2      YES manual up                    up\nGigabitEthernet0/2     10.255.9.2      YES manual up                    up\nPHC-R1#show ip route 10.10.1.20\nRouting entry for 10.10.1.0/24\n  Known via \"static\", distance 1, metric 0\n  Routing Descriptor Blocks:\n  * 10.255.1.1\n      Route metric is 0, traffic share count is 1\n\nC:\\Users\\ada>ping 10.10.1.20\nReply from 10.255.1.1: Destination host unreachable.", o:["The floating static has the wrong mask","The MPLS interface is still up and its next hop still resolves, so the primary route stays; the failure is inside the carrier's network, beyond what the router can see","Gi0/2 is down","The PC's default gateway is wrong"], a:1, why:"A static route stays while its exit interface is up and its next hop resolves. Gi0/1 is up/up and 10.255.1.1 is on its connected subnet, so the AD 1 route stays and the AD 10 backup can't enter. The carrier's router (10.255.1.1) answers 'Destination host unreachable': it has lost its own path to head office. BFD through an SD-WAN tunnel would test the whole path and catch this."},
  {lvl:2, type:"fill", q:"Six sites each have mpls and biz-internet. Tunnels are built in a full mesh between matching colours only. How many tunnels does the design have in total?", fields:[{label:"Tunnels", a:["30","30 tunnels","thirty"]}], why:"Full mesh per colour: 6 × 5 ÷ 2 = 15 site pairs, one tunnel per pair per shared colour: 15 on mpls + 15 on biz-internet = 30. Each router terminates 5 × 2 = 10."},
  {lvl:2, q:"Based on the exhibit, which tunnel will application-aware routing use for VOICE? The VOICE SLA class is loss ≤ 1%, latency ≤ 150 ms, jitter ≤ 30 ms, and policy prefers biz-internet when more than one path qualifies.", ex:"Tunnel to head office   Loss    Latency   Jitter\nmpls                    0.2%    35 ms     8 ms\nbiz-internet            2.5%    48 ms     14 ms\nlte                     0.6%    110 ms    24 ms", o:["biz-internet, because policy prefers it","mpls or lte: both meet the SLA, biz-internet fails on loss","lte only, because it has the lowest jitter","None, so voice is dropped"], a:1, why:"A path must meet every threshold. biz-internet fails on loss (2.5% > 1%), so the preference for it doesn't apply. mpls (0.2%, 35 ms, 8 ms) and lte (0.6%, 110 ms, 24 ms) both pass, so voice uses one of them, per the rest of the policy. Preference only chooses among paths that meet the SLA."},
  {lvl:2, q:"What is the main difference between DMVPN and SD-WAN?", o:["DMVPN can't encrypt traffic; SD-WAN can","DMVPN is configured router by router and chooses paths by routing protocol per prefix; SD-WAN uses central controllers, zero-touch provisioning and per-application path choice from live measurements","DMVPN needs MPLS; SD-WAN needs the internet","They are the same technology under different names"], a:1, why:"DMVPN builds GRE over IPsec tunnels over the internet but every hub and spoke is configured by hand and a routing protocol picks paths per prefix. SD-WAN centralises configuration and policy, provisions sites with zero touch and steers each application using BFD measurements. Both encrypt; neither requires a particular transport."},
  {lvl:2, type:"multi", q:"Which three are jobs of the SD-WAN Controller (vSmart)? (Choose three.)", o:["Reflecting each site's routes and TLOCs to the other WAN Edges over OMP","Distributing data-plane encryption keys","Applying central control policy, such as hub-and-spoke or full mesh","Forwarding user traffic between branches","Hosting the GUI where administrators build templates","Being the first point of contact that authenticates new routers"], a:[0,1,2], why:"The Controller is the control plane: OMP routes and TLOCs, keys and control policy. User traffic goes edge to edge (data plane), the GUI is the Manager, and first contact is the Validator."},
  {lvl:3, q:"A retailer has 70 small shops with cheap broadband and 4G available everywhere, tills that talk to a cloud payments service, two IT staff, and a plan to open 15 shops a year. Which WAN design fits best?", o:["MPLS to every shop, with all internet traffic going through head office","DMVPN with every shop configured by hand","SD-WAN over broadband and 4G, with zero-touch provisioning, SLA classes for payments and local internet breakout to the cloud service","Leased lines from every shop to head office"], a:2, why:"Many small sites, a tiny team, cloud applications and fast growth point to SD-WAN over cheap transports: zero-touch for new shops, central policy, payments steered to the best path, and direct internet access to the cloud instead of hair-pinning through head office. MPLS and leased lines are costly and slow to order; DMVPN by hand doesn't scale for two people."},
  {lvl:3, q:"A replacement WAN Edge at a Jos branch gets a DHCP address and reaches Plug and Play Connect, which returns the Validator's address. The Validator logs show it rejected the device, and the router never appears in the Manager. Which is the most likely cause?", o:["The ISP's DHCP isn't working","The replacement's serial number wasn't added to the organisation's authorised device list (or wasn't synced to the Validator)","The Controller has a hub-and-spoke policy","The branch LAN switch has the wrong VLAN"], a:1, why:"Steps 1–2 worked (an address and an answer from Plug and Play). The Validator rejects devices whose identity it can't match to the authorised list, so the new serial is the suspect: the old router's serial was authorised, the replacement's wasn't. The Controller and LAN only matter after the router has joined."},
  {lvl:3, q:"After moving to SD-WAN with MPLS and broadband at every site, two branches still go completely offline during roadworks. Both links reach each building through the same street duct. What change addresses this?", o:["Tighten the SLA classes so traffic moves sooner","Add a transport that fails separately, such as 4G/5G, and ask carriers for diverse routes into the building","Add a second Controller","Move the Validator to head office"], a:1, why:"SD-WAN can only choose between paths that fail independently. One cut duct kills both links, so no policy or controller can help. A radio transport (4G/5G) or physically diverse fibre gives a path that survives the same event. SLA tuning and controller redundancy don't create a surviving path."},
],
cards:[
  {f:"Four limits of a traditional multi-link WAN", b:"1. Configured box by box. 2. Path chosen by destination only, not by application. 3. Blind to failures beyond its own link and to brownouts (up but lossy). 4. Expensive, slow capacity, with the backup idle."},
  {f:"What SD-WAN adds", b:"A central brain that configures every site at once; constant end-to-end measurement of every path (BFD); policy that chooses a path per application; zero-touch provisioning; any transport (transport independence)."},
  {f:"Overlay vs underlay", b:"Underlay: the transports that carry packets (MPLS, broadband, 4G/5G). Overlay: the IPsec tunnels the WAN Edges build across them, which traffic and policy see."},
  {f:"TLOC and colour", b:"TLOC (transport locator) = system IP + colour + encapsulation: one router's attachment to one transport. Colours label transports: mpls, biz-internet, public-internet, lte, metro-ethernet, etc. Tunnels run TLOC to TLOC."},
  {f:"SD-WAN Manager (vManage)", b:"Management plane. GUI and API: configuration (templates, configuration groups), monitoring, upgrades, certificates, policy authoring. If it fails, traffic flows on but no changes or dashboards."},
  {f:"SD-WAN Controller (vSmart)", b:"Control plane. Runs OMP with every WAN Edge: reflects routes and TLOCs, distributes encryption keys, applies control policy (topology). Never carries user traffic. If all fail, edges forward on last-learned state for a while."},
  {f:"SD-WAN Validator (vBond)", b:"Orchestration plane. First point of contact: authenticates new routers (certificates, authorised serial list), tells them where the Manager and Controllers are, helps with NAT traversal. Needs a reachable public address. If down, new routers can't join."},
  {f:"WAN Edge (vEdge / cEdge)", b:"Data plane: the router at each site (Catalyst 8000, ISR 1000/4000, ASR 1000, Catalyst 8000V). Builds IPsec tunnels, runs BFD, forwards traffic, applies data policy, runs OSPF/BGP to the LAN."},
  {f:"Zero-touch provisioning order", b:"DHCP on the WAN port → Plug and Play Connect (serial → Validator address) → Validator (authenticate, learn Manager + Controllers) → Manager (configuration via NETCONF) → Controllers (OMP routes, keys, policy) → IPsec tunnels + BFD."},
  {f:"BFD and application-aware routing", b:"BFD hellos run through every tunnel in both directions, measuring loss, latency and jitter end to end and detecting a dead tunnel within seconds. SLA classes set thresholds per application; traffic uses a path that meets all of them."},
  {f:"MPLS vs DMVPN vs SD-WAN", b:"MPLS: a service you buy (provider paths, SLA, no encryption). DMVPN: a design you build (GRE over IPsec over the internet, configured per router, routing picks paths). SD-WAN: a system you run (controllers, any transport, per-application policy, zero-touch); can use MPLS as an underlay."},
  {f:"What SD-WAN can't do", b:"It can't make a bad link good (raise it with the carrier) and can't save a site whose links all fail together (same duct, same power). Give critical sites transports that fail separately, such as 4G/5G."},
],
});

// ---------- Module 10 · Lesson 5 ----------
L.push({
id:"wan-virt", mins:100, level:"Intermediate · builds on Modules 1, 4, 5 and 9 and lessons 1–4 of this module",
t:"Virtualization — hypervisors, VMs, virtual switches and trunks to hosts, containers and NFV",
html:`
${K.goals([
  "Explain what a virtual machine is and what the hypervisor shares out, and size a small host cluster that survives the loss of one host.",
  "Tell a type 1 (bare-metal) hypervisor from a type 2 (hosted) one, from a product name or a description.",
  "Trace a VM's frame from its virtual NIC through the virtual switch and onto the physical network, and configure the switch port to a hypervisor host as a trunk.",
  "Compare virtual machines and containers and choose between them for a workload.",
  "Describe network functions virtualization (virtual routers, firewalls and controllers) and fix a VM that goes dark after it moves to another host.",
])}
${K.pre([
  "Module 1: servers, virtual machines and data-centre traffic. Module 4: VLANs, 802.1Q trunks, the native VLAN, <code>switchport trunk allowed vlan</code>, DTP, PortFast and EtherChannel.",
  "Module 4–5: router-on-a-stick (subinterfaces with <code>encapsulation dot1Q</code>) and routing between VLANs.",
  "Module 9 lesson 3: the Catalyst 9800-CL, a wireless controller that runs as a virtual machine.",
  "Lessons 1–4 of this module, especially lesson 1's spine-leaf data centre.",
])}

<h2>Why this matters at work</h2>
<p>A Lagos payments company has moved 40 physical servers onto four virtualization hosts. On Thursday night the server team moved the database VM to another host to patch the first. On Friday the payment API can't reach its database, and the server team writes: &ldquo;The VM is fine on our side. Must be the network.&rdquo; Half right: the VM is fine, but the new host's switch port doesn't carry the database's VLAN.</p>
<p>Virtualization changed what sits at the end of a switch port: not one server in one VLAN, but a rack of servers in one box, in several VLANs, able to move between boxes. This lesson covers the server and container parts of CCNA 200-301 v1.1 topic 1.12; v2.0 (from 3 February 2027) keeps hypervisors, VMs and containers (topic 1.2) and adds the switch port to virtualized hosts (2.2.d). You'll learn what is inside that box, how its traffic reaches your switches, how containers differ and how routers became software, then trunk a new host and fix that Friday ticket.</p>

<h2>Server virtualization: one physical server, many virtual ones</h2>
${K.remember(`<b>The rule:</b> a virtual machine is a whole computer made of software. The <b>hypervisor</b> slices one physical server's CPU, memory, storage and network into <b>virtual hardware</b>, and each VM's operating system believes it owns a real machine. Hence VMs need virtual network cards, a virtual switch, and a host cable that carries many servers at once.`)}
<p>Before virtualization, most server rooms ran <b>one application per physical server</b>, each bought for its busiest day. Most of the time each processor sat almost idle (10–15% average use is often quoted), yet every box needed rack space, power, cooling and a switch port. Module 1 introduced the fix: run many servers as <b>virtual machines</b> on one powerful machine. The vocabulary:</p>
<ul>
<li>The ${K.g("host","The physical server that runs the hypervisor and its virtual machines.")} is the physical server; its VMs are its ${K.g("guests","The virtual machines running on a host.")}, and each guest runs its own ${K.g("guest OS","The operating system installed inside a virtual machine (Windows Server, Ubuntu…), which sees only the virtual hardware.")}.</li>
<li>The ${K.g("hypervisor","Software on a server that creates and runs virtual machines and shares the physical hardware between them. Also called a virtual machine monitor (VMM).")} creates the VMs, gives each its slice of the hardware and keeps them apart.</li>
<li>Each VM gets virtual parts: a number of ${K.g("vCPUs","Virtual CPUs: the processor cores a VM sees. The hypervisor schedules them onto the host's real cores.")}, memory, a virtual disk (a file on the host's storage, which is why a VM can be copied or moved) and ${K.g("vNICs","Virtual network interface cards: the network adapters a VM sees. Each has its own MAC address and plugs into a virtual switch.")}, each with its own MAC address.</li>
</ul>
${K.analogy(`An apartment building. The building (host) has one water main and one power supply; the manager (hypervisor) gives each flat (VM) its own meter and lock. Tenants can't enter each other's flats, yet one building houses twelve families.`)}
<h3>What you gain, and what it costs</h3>
<p>Each gain comes from one fact: a VM is software, so it can be copied, paused and moved.</p>
<ul>
<li><b>Consolidation:</b> ten or twenty servers per host: fewer boxes, less power, fewer switch ports.</li>
<li><b>Speed:</b> a new server is a template clone, ready in minutes.</li>
<li><b>Snapshots:</b> save a VM's state before a risky upgrade and roll back in seconds.</li>
<li><b>Live migration:</b> move a running VM to another host with no downtime, so hosts can be patched in working hours. VMware calls this ${K.g("vMotion","VMware's live migration: a running VM moves to another host while it keeps its MAC address, IP address and open connections.")}; Hyper-V calls it Live Migration.</li>
<li><b>High availability:</b> if a host dies, its VMs restart on the survivors within minutes.</li>
</ul>
<p>The costs: one host failure takes down every VM on it, so hosts are built in clusters with spare capacity; a busy VM can slow its neighbours (the &ldquo;noisy neighbour&rdquo;); licences and skills cost money; and forgotten VMs pile up (&ldquo;VM sprawl&rdquo;), each still needing patches.</p>
<h3>Worked example: how many hosts, and why the answer is never one</h3>
<p>An Abuja insurer wants to move 12 physical servers onto hosts. Each old server has 4 processor cores at about 10% use and will become a VM with 16 GB of memory. The candidate host has 32 cores and 256 GB of memory.</p>
${K.steps([
  ["Add up the real demand", "CPU: 12 × 4 cores × 10% ≈ 5 cores of real work. Memory: 12 × 16 GB = 192 GB. Memory, not CPU, is the tight resource, as usual."],
  ["Reserve room for the hypervisor", "Keep memory for the hypervisor itself, say 16 GB (it depends on the product). Usable per host: 240 GB."],
  ["Plan for a failure (N+1)", `One host would fit all 12 VMs, but its failure would stop everything. Designers plan ${K.g("N+1","Enough hosts (N) to run the load, plus one spare, so the cluster survives one host failing.")}: if any one host fails, the rest must still hold every VM. With two hosts, the survivor needs 192 GB and has 240 GB, so it fits.`],
  ["The answer", "Two hosts, six VMs each in normal running; either can carry all twelve while the other is broken or being patched."],
  ["What changed for the network", "Twelve servers' traffic now leaves through each host's few network cards, in several VLANs at once: the subject of section 3."],
])}
${K.dyk(`Virtualization is older than the PC. IBM ran virtual machines on its System/360 mainframes in the late 1960s (CP-67) and sold VM/370 from 1972. x86 servers caught up in the 2000s, with VMware and then Intel VT-x and AMD-V (processor help for hypervisors).`)}
${K.check({q:"What does a hypervisor do?", o:["It is the operating system installed inside each virtual machine","It creates virtual machines and shares the host's CPU, memory, storage and network between them while keeping them isolated","It is a physical switch that connects servers in a data centre","It is a backup copy of a virtual machine"], a:1, why:"The hypervisor creates VMs and gives each a slice of the real hardware, keeping them apart. The OS inside a VM is the guest OS; a saved VM state is a snapshot."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Port Harcourt hospital has three hosts, each with 384 GB of memory, and keeps 32 GB per host for the hypervisor. Every VM needs 24 GB, and a VM can't be split across hosts. How many VMs fit on one host, and how many can the cluster run so that all of them still fit when any one host fails?", fields:[{label:"VMs per host", a:["14","fourteen"]},{label:"Cluster total (N+1)", a:["28","twenty-eight","twenty eight"]}], why:"1. What is asked? Capacity per host, then capacity that survives one failure. 2. Which rule? Usable memory = host memory − hypervisor reserve; a whole VM must fit on one host; N+1 means the survivors carry everything. 3. Apply it: (384 − 32) ÷ 24 = 14.67, so 14 whole VMs per host. If one host fails, two remain: 2 × 14 = 28. (Dividing 704 GB by 24 would give 29, but the 29th VM would have to be split across two hosts.)"})}

<h2>Hypervisors: type 1 (bare metal) and type 2 (hosted)</h2>
${K.remember(`<b>The rule:</b> ask <b>what sits directly on the hardware</b>. If the hypervisor does, it is <b>type 1</b> (bare metal, native). If a normal operating system does, and the hypervisor runs as an application on top of it, it is <b>type 2</b> (hosted). Hook: type <b>1</b> is the <b>1st</b> thing on the metal; type <b>2</b> lives on the <b>2nd</b> floor, above an OS. (The labels go back to Robert Goldberg's 1973 thesis.)`)}
${K.svg("0 0 720 300",
  K.band(10,8,340,24,"TYPE 1 — BARE METAL")+K.band(370,8,340,24,"TYPE 2 — HOSTED")+
  K.txt(180,62,"Nothing between the hypervisor",{mid:true,f:"body",s:11})+K.txt(180,78,"and the hardware",{mid:true,f:"body",s:11})+
  K.box(20,110,100,80,"VM 1","app + guest OS")+K.box(130,110,100,80,"VM 2","app + guest OS")+K.box(240,110,100,80,"VM 3","app + guest OS")+
  K.box(20,202,320,40,"Type 1 hypervisor","ESXi · Hyper-V · KVM · Xen",true)+
  K.box(20,252,320,40,"Server hardware","CPU · memory · NICs · disks")+
  K.box(380,62,100,80,"VM 1","app + guest OS")+K.box(490,62,100,80,"VM 2","app + guest OS")+K.box(600,62,100,80,"Your apps","browser, email")+
  K.box(380,154,210,40,"Type 2 hypervisor","VirtualBox · Workstation",true)+
  K.box(380,202,320,40,"Host operating system","Windows · macOS · Linux")+
  K.box(380,252,320,40,"Laptop or PC hardware","CPU · memory · NIC · disk"),
  "Read each stack from the bottom. Type 1: the hypervisor is the first software on the hardware. Type 2: the hypervisor is an application inside an ordinary operating system, sharing the machine with your other apps.")}
<h3>Type 1: what data centres run</h3>
<p>A ${K.g("type 1 hypervisor","A hypervisor that runs directly on the server hardware, with no general-purpose operating system underneath. Also called bare-metal or native.")} installs onto the server like an operating system, but its only job is running VMs. Examples: <b>VMware ${K.g("ESXi","VMware's type 1 hypervisor, installed directly on a server.")}</b>, <b>Microsoft Hyper-V</b>, <b>${K.g("KVM","Kernel-based Virtual Machine: a part of the Linux kernel that turns Linux itself into a hypervisor.")}</b> (usually classed as type 1: the Linux kernel itself becomes the hypervisor) and <b>Xen</b>. You manage it remotely, often through a central tool such as VMware vCenter. Data centres want it because nothing sits between the VMs and the hardware (near-physical performance), there is no general-purpose OS underneath to crash, patch or attack, and the cluster features (live migration, high availability) are built for it.</p>
<h3>Type 2: what your laptop runs</h3>
<p>A ${K.g("type 2 hypervisor","A hypervisor that runs as an application on top of an ordinary operating system, which owns the hardware. Also called hosted.")} is a program you install on Windows, macOS or Linux: <b>Oracle VirtualBox</b>, <b>VMware Workstation</b>, <b>Parallels Desktop</b> on a Mac. Every VM request passes through the hypervisor <i>and</i> the host OS, so it is slower, and a host OS reboot takes every VM with it. In return it is easy: ideal for a study lab or running Linux on a Windows laptop.</p>
${K.dyk(`Turning on Hyper-V on a Windows 11 laptop doesn't make it type 2. The Hyper-V hypervisor then loads first, on the hardware, and your Windows desktop runs on top of it in a special parent partition: type 1, even on a laptop.`)}
${K.when([
  ["Type 1 (ESXi, Hyper-V, KVM, Xen)","Production servers","Near-physical performance, small attack surface, live migration and high availability","A one-off test on your own laptop"],
  ["Type 2 (VirtualBox, Workstation, Parallels)","Study labs, testing, another OS on a desktop","Installs like an app","Anything that must stay up: the host OS's reboots take it down"],
], "Type 1 or type 2?")}
${K.exam(`Reading hypervisor questions: underline the clue words first. &ldquo;Bare metal&rdquo;, &ldquo;native&rdquo;, &ldquo;runs directly on the hardware&rdquo; → type 1. &ldquo;Hosted&rdquo;, &ldquo;installed on top of an operating system&rdquo;, &ldquo;runs as an application&rdquo; → type 2. Trap options swap the layers: &ldquo;a type 1 hypervisor runs on a host operating system&rdquo; is wrong however confident it sounds.`)}
${K.drill({title:"type 1 or type 2?", types:["hypervisor"], count:5})}
${K.check({q:"A developer installs Oracle VirtualBox on her Windows 11 laptop and runs two Linux VMs in it. Which statement is correct?", o:["VirtualBox is a type 1 hypervisor because it runs VMs","VirtualBox is a type 2 hypervisor: it runs as an application on Windows, which owns the hardware","The Linux VMs are containers, because they share the laptop","Windows becomes the guest OS of the Linux VMs"], a:1, why:"VirtualBox is installed on top of an ordinary OS, so it is hosted (type 2). The Linux VMs each have their own guest OS; Windows is the host OS underneath."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Match each description with the hypervisor type. (You won't know every product: use the rule.)", pairs:[["A product installed from a USB stick onto an empty server; it boots straight into a menu for managing VMs","Type 1"],["A tool you install on your Mac next to your browser, to run a Windows VM in a window","Type 2"],["Linux with the KVM module loaded, running VMs on a rack server","Type 1 (the kernel is the hypervisor)"]], why:"1. What is asked? What sits directly on the hardware in each case. 2. Which rule? Hypervisor on the hardware = type 1; hypervisor as an app inside an OS = type 2. 3. Apply it: the USB-installed product replaces any OS, so it is type 1; the Mac tool runs alongside other apps on macOS, so type 2; with KVM the Linux kernel itself becomes the hypervisor, so it is usually classed as type 1."})}

<h2>Inside the host: virtual switches, port groups and the trunk to the host</h2>
${K.remember(`<b>The rule:</b> a VM's traffic reaches the wire through a <b>virtual switch inside the host</b>. VMs plug into it with vNICs; its <b>uplinks</b> are the host's physical NICs. With VMs in several VLANs, the vSwitch tags their frames, so <b>the physical switch port to the host must be an 802.1Q trunk carrying every one of those VLANs</b>.`)}
<p>A VM's vNIC plugs into a ${K.g("virtual switch","A software Layer 2 switch inside a host: VMs' vNICs connect to it, the host's physical NICs are its uplinks. VMware calls it a vSwitch.")} inside the host (a <b>vSwitch</b> in VMware). It learns MACs and forwards frames like any switch; its ports are the vNICs plus the host's physical NICs, which VMware names ${K.g("vmnic0, vmnic1…","VMware's names for a host's physical network cards, used as the uplinks of a virtual switch.")} and uses as the vSwitch's <b>uplinks</b>.</p>
<p>VLANs are set on a ${K.g("port group","VMware: a named set of virtual switch ports sharing one policy, above all one VLAN ID, which sets the VLAN of every vNIC attached to it.")}: a named set of vSwitch ports sharing one VLAN ID. Put a vNIC in the &ldquo;DB&rdquo; port group (VLAN ID 20) and the vSwitch tags that VM's frames for VLAN 20 on the way out of the uplink and strips the tag on the way in. The VM knows nothing about VLANs, like a PC on an access port.</p>
${K.svg("0 0 760 380",
  K.box(10,10,460,360,"","")+K.txt(240,30,"ESXI-PH1 — one physical host",{mid:true,c:"fg",b:true,f:"body",s:12})+
  K.box(25,42,140,46,"TRACK-WEB","vNIC · VLAN 10")+K.box(170,42,140,46,"TRACK-APP","vNIC · VLAN 10")+K.box(315,42,140,46,"TRACK-DB","vNIC · VLAN 20")+
  K.link(95,88,95,190)+K.link(240,88,240,190)+K.link(385,88,385,190)+
  K.box(25,150,430,110,"","")+K.txt(240,172,"vSwitch0 — software Layer 2 switch",{mid:true,c:"fg",b:true,f:"body",s:11.5})+
  K.band(40,190,270,24,"port group APP · VLAN 10")+K.band(320,190,125,24,"DB · VLAN 20")+
  K.txt(240,240,"tags 10 and 20 added here on the way out",{mid:true,f:"body",s:10.5})+
  K.link(240,260,240,300)+
  K.box(150,300,180,40,"vmnic0","physical NIC · uplink",true)+
  K.link(330,320,624,320)+K.txt(547,310,"802.1Q trunk",{mid:true,c:"accent",b:true,s:11})+K.txt(547,340,"tags 10 + 20",{mid:true,s:10.5})+
  K.dev("switch",650,320,"PH-DC-SW1","")+K.txt(650,371,"Gi0/4 = trunk",{mid:true,s:10})+
  K.txt(495,70,"What PH-DC-SW1 sees on Gi0/4:",{c:"fg",b:true,f:"body",s:11})+
  K.txt(495,92,"• frames of two VLANs, tagged",{f:"body",s:11})+
  K.txt(495,112,"• three server MACs on one port",{f:"body",s:11})+
  K.txt(495,132,"• no DTP and no STP from the host",{f:"body",s:11})+
  K.txt(495,170,"TRACK-WEB ↔ TRACK-APP (same VLAN,",{f:"body",s:10.5})+
  K.txt(495,186,"same host) never leave the vSwitch.",{f:"body",s:10.5}),
  "Inside one host: three VMs plug their vNICs into port groups on vSwitch0; the vSwitch tags each frame with its port group's VLAN and sends it out the physical uplink, a trunk to the data-centre switch.")}
<h3>Three ways to tag, and the switch port each needs</h3>
<p>VMware's standard vSwitch has three tagging modes, set by the port group's VLAN ID; they sum up the choices any hypervisor gives you:</p>
<div class="tablewrap"><table>
<tr><th>Port group VLAN ID</th><th>Who tags</th><th>VMware name</th><th>Physical switch port</th></tr>
<tr><td>0 (none)</td><td>Nobody: frames leave untagged</td><td>External switch tagging (EST)</td><td>Access port in the VLAN. One VLAN per uplink, so it wastes NICs</td></tr>
<tr><td>1–4094</td><td>The vSwitch, per port group</td><td>Virtual switch tagging (VST): the usual choice</td><td>Trunk carrying every VLAN the port groups use</td></tr>
<tr><td>4095</td><td>The VM's own OS (the vSwitch passes tags through)</td><td>Virtual guest tagging (VGT)</td><td>Trunk; the VM itself must understand 802.1Q, such as a virtual router with subinterfaces</td></tr>
</table></div>
<p>Hyper-V sets a VLAN ID on each VM's adapter instead. Exam version: VMs in several VLANs on one host means a trunk to the host.</p>
<h3>Worked example: a frame from TRACK-WEB to TRACK-DB</h3>
<p>Port Harcourt logistics firm: host ESXI-PH1, vmnic0 cabled to PH-DC-SW1 Gi0/4. TRACK-WEB is 10.70.10.15 in VLAN 10 (MAC 0050.56b3.4a10), TRACK-DB is 10.70.20.25 in VLAN 20 (0050.56b3.4a20). Their gateway is PH-R1, a router-on-a-stick on switch port Gi0/1 (subinterfaces Gi0/0.10 = 10.70.10.1, Gi0/0.20 = 10.70.20.1). Both VMs are on the <i>same host</i>. Does the frame stay inside it?</p>
${K.steps([
  ["Different subnet, so the gateway", "10.70.20.25 is outside TRACK-WEB's /24, so it sends the frame to its gateway's MAC (after an ARP for 10.70.10.1)."],
  ["Into the vSwitch, out tagged 10", "The gateway's MAC is not inside the host, so the vSwitch sends the frame out vmnic0 <b>with an 802.1Q tag for VLAN 10</b> (TRACK-WEB's port group)."],
  ["Across the physical network", "PH-DC-SW1 learns TRACK-WEB's MAC on trunk Gi0/4 in VLAN 10 and forwards the frame out trunk Gi0/1, still tagged 10, to PH-R1."],
  ["Routed, sent back tagged 20", "PH-R1 routes it from Gi0/0.10 out Gi0/0.20; PH-DC-SW1 sends it back down Gi0/4, now tagged 20."],
  ["Back into the same host", "The vSwitch reads tag 20, strips it and delivers the frame to TRACK-DB. Same box, different VLANs: a trip to the router and back."],
])}
<p>The switch's MAC table shows what is really on that cable:</p>
${K.out(`PH-DC-SW1#show mac address-table interface g0/4
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0050.56b3.4a10    DYNAMIC     Gi0/4
  20    0050.56b3.4a20    DYNAMIC     Gi0/4
Total Mac Addresses for this criterion: 2`, "Two server MAC addresses in two VLANs on one physical port: a hypervisor host. Both start 0050.56, a VMware prefix.")}
${K.out(`PH-DC-SW1#show interfaces trunk
Port        Mode             Encapsulation  Status        Native vlan
Gi0/1       on               802.1q         trunking      999
Gi0/4       on               802.1q         trunking      999

Port        Vlans allowed on trunk
Gi0/1       10,20
Gi0/4       10,20

Port        Vlans allowed and active in management domain
Gi0/1       10,20
Gi0/4       10,20

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       10,20
Gi0/4       10,20`, "Gi0/4 to the host is a hard-coded trunk with an unused native VLAN (999) and only the VLANs its VMs use.")}
${K.tip(`VM MAC addresses give the host away. The first three bytes are the ${K.g("OUI","Organizationally Unique Identifier: the first three bytes of a MAC address, assigned to one vendor (Module 2).")}, and VMware uses 00:50:56 (and 00:0C:29 for addresses a host generates itself), Hyper-V uses 00:15:5D. A port with a dozen such MACs is a hypervisor host, whatever its description says.`)}
<p>Two VMs in the <i>same</i> VLAN on the <i>same</i> host talk through the vSwitch only, so the physical switch and the rack's firewall never see that traffic.</p>
<h3>How a vSwitch differs from a Catalyst</h3>
<ul>
<li><b>No Spanning Tree.</b> A vSwitch never forwards a frame from one uplink out another, so it can't loop and takes no part in STP. Make it an edge port so it forwards at once after a reboot: <code>spanning-tree portfast edge trunk</code> (older releases: <code>spanning-tree portfast trunk</code>, which current IOS and the lab accept and save as <code>portfast edge trunk</code>; <code>show spanning-tree</code> lists the port as <code>P2p Edge</code>).</li>
<li><b>No DTP.</b> A host never negotiates, so <code>dynamic auto</code> stays access. Set <code>switchport mode trunk</code> and <code>switchport nonegotiate</code>, as for a router-on-a-stick.</li>
<li><b>Two uplinks, two switches,</b> so one switch failure isolates no servers. VMware's default teaming (each VM pinned to one uplink) needs no switch configuration; only its &ldquo;IP hash&rdquo; option needs a static EtherChannel (<code>mode on</code>), and LACP needs VMware's ${K.g("distributed switch","A virtual switch defined once in the management server (VMware vCenter) and applied to many hosts, so every host has identical port groups.")}.</li>
</ul>
<h3>When a VM moves</h3>
<p>Live migration copies a running VM's memory to another host and switches over in a moment, keeping its MAC, IP and open sessions. The new host sends frames from the VM's MAC (VMware sends ${K.g("RARP","Reverse ARP: an old protocol VMware reuses after a migration, sending a frame from the VM's MAC so switches relearn it at once.")} frames) so the physical switches move the MAC to the new port at once.</p>
<p>That works only if the new host's port carries the VM's VLAN. <b>Every host a VM may move to must carry every VLAN it may need</b>, on its port groups and its physical trunk. Forget one, and the VM goes dark the moment it lands: the opening ticket, and this lesson's bench.</p>
${K.mistake(`Leaving the switch port to a hypervisor as an access port (or <code>dynamic auto</code>, which becomes access because the host sends no DTP). The first VM in the access VLAN works, hiding the problem; VMs in other VLANs get nothing.`)}
${K.mistake(`Adding a VLAN to a host's trunk with <code>switchport trunk allowed vlan 120</code>. That <i>replaces</i> the whole list, so every other VLAN on that host drops at once. Use <code>switchport trunk allowed vlan add 120</code> (Module 4), and read <code>show interfaces trunk</code> before and after.`)}
${K.check({q:"A host runs VMs in VLANs 30, 31 and 32, with each port group tagging its VLAN. What must the physical switch port facing the host be?", o:["An access port in VLAN 30; the vSwitch handles the other VLANs internally","An 802.1Q trunk that allows VLANs 30, 31 and 32","A routed port with an IP address in each VLAN","Dynamic auto, so the host can negotiate the trunk"], a:1, why:"The vSwitch tags each VM's frames with its port group's VLAN, so tagged frames for three VLANs arrive on one cable: an 802.1Q trunk allowing those VLANs. Hosts don't speak DTP, so dynamic auto would stay access."})}

<h3>Try it: trunk a new host in the Lagos data centre</h3>
<p>A Lagos bank adds host <b>ESXI-03</b>, vmnic2 cabled to LOS-DC-SW2 Gi0/7. Its VMs use VLANs 210 (PAY-WEB) and 220 (PAY-DB); its live-migration traffic needs a new VLAN 230. VLAN 999 is the unused native VLAN.</p>
${K.term({env:"ios2", title:"LOS-DC-SW2 — prepare Gi0/7 for hypervisor host ESXI-03", opts:{kind:"switch", host:"LOS-DC-SW2", model:"Catalyst 9300", motd:"LOS-DC-SW2 — Lagos data-centre switch (lab). Console session, no enable secret."},
  setup:env=>{ ["enable","configure terminal","vlan 210","name PAY-WEB","vlan 220","name PAY-DB","vlan 999","name NATIVE-UNUSED","exit","interface g0/5","description ESXI-01 vmnic2","switchport trunk native vlan 999","switchport trunk allowed vlan 210,220","switchport mode trunk","switchport nonegotiate","interface g0/6","description ESXI-02 vmnic2","switchport trunk native vlan 999","switchport trunk allowed vlan 210,220","switchport mode trunk","switchport nonegotiate","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"Gi0/5 and Gi0/6 already serve ESXI-01 and ESXI-02. Gi0/7 is still at factory defaults. Make it match its neighbours, plus the new VLAN 230 (which the other two hosts will get in a later change).",
  tasks:[
    {text:"Look first: <code>enable</code>, then <code>show interfaces g0/7 switchport</code>. Note the Administrative Mode and the Operational Mode: why would this port stay an access port once the host is plugged in?", done:e=>e.history.some(h=>/^\s*sh\S*\s+int\S*\s+g\S*0\/7\s+sw/i.test(h))},
    {text:"<code>configure terminal</code>, then create the new VLAN: <code>vlan 230</code> and <code>name VMOTION</code>", done:e=>!!e.vlans[230] && /vmotion/i.test(e.vlans[230])},
    {text:"<code>interface g0/7</code>: a <code>description</code> that names ESXI-03, <code>switchport mode trunk</code>, <code>switchport nonegotiate</code> (hosts never speak DTP), <code>switchport trunk native vlan 999</code> and <code>switchport trunk allowed vlan 210,220,230</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/7"]; return i.mode==="trunk" && !!i.nonegotiate && i.native===999 && Array.isArray(i.allowed) && i.allowed.length===3 && [210,220,230].every(v=>i.allowed.includes(v)) && /esxi-03/i.test(i.desc||""); }},
    {text:"<code>end</code>, then <code>show interfaces trunk</code>: Gi0/7 trunking, native 999, VLANs 210,220,230. Compare it with Gi0/5 and Gi0/6: which VLAN will a VM lack if it migrates from ESXI-03 to ESXI-01 and needs VLAN 230?", done:e=>e.mode==="priv" && e.intfs["GigabitEthernet0/7"].mode==="trunk" && e.history.some(h=>/^\s*sh\S*\s+int\S*\s+trunk/i.test(h))},
    {text:"Save: <code>copy running-config startup-config</code> (press Enter to accept the file name)", done:e=>!!e.savedOnce},
  ],
  win:"Gi0/7 is a hard-coded trunk for ESXI-03: no DTP, unused native VLAN 999, and only the three VLANs the host needs. You also spotted the trap waiting in <code>show interfaces trunk</code>: Gi0/5 and Gi0/6 don't carry 230 yet, so the change to add it to the other hosts has to happen before any VM relies on it.",
  solve:["enable","show interfaces g0/7 switchport","configure terminal","vlan 230","name VMOTION","exit","interface g0/7","description ESXI-03 vmnic2","switchport mode trunk","switchport nonegotiate","switchport trunk native vlan 999","switchport trunk allowed vlan 210,220,230","end","show interfaces trunk","copy running-config startup-config",""]})}
${K.hint(`Task 1: the port says <b>dynamic auto</b>. Auto only becomes a trunk if the other end asks with DTP, and a hypervisor never does. Task 4: Gi0/5 and Gi0/6 allow 210,220 only.`)}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A Kano university's server team adds a VM in a new VLAN 44 on host HV-KN2. The VM can't reach its gateway; VMs in VLAN 40 on the same host work. HV-KN2's switch port shows 'Vlans allowed on trunk: 40-42'. Which two actions could each explain or fix it? (Choose two.)", o:["Run switchport trunk allowed vlan add 44 on the host's switch port (after checking VLAN 44 exists on the switch)","Change the host's switch port to an access port in VLAN 44","Check that the VM's port group on the host is set to VLAN ID 44","Run switchport trunk allowed vlan 44 on the host's switch port","Enable DTP on the host so the trunk renegotiates"], a:[0,2], why:"1. What is asked? Why one VLAN fails on a host where others work. 2. Which rule? The VM's frames are tagged with its port group's VLAN, and the physical trunk must allow that VLAN. 3. Apply it: VLAN 44 isn't in 40-42, so add it (with add, so 40-42 survive); and confirm the port group really tags 44. An access port in 44 would cut VLAN 40; allowed vlan 44 without add would replace the list; hosts don't run DTP."})}

<h2>Containers: sharing the kernel</h2>
${K.remember(`<b>The rule:</b> a VM virtualizes the <b>hardware</b>, so every VM brings its own complete operating system. A container virtualizes the <b>operating system</b>: all the containers on a host share the host's ${K.g("kernel","The core of an operating system, controlling processor, memory, devices and networking for every program.")} and package only the application and the libraries it needs. Smaller and faster, but every container must suit that kernel.`)}
<p>A VM is heavy by design: gigabytes of guest OS that boots and is patched like a real machine, even if all you want is one isolated web app. A ${K.g("container","An application and its libraries running as isolated processes on a shared host kernel, started from an image by an engine such as Docker.")} keeps the isolation and drops the rest. It is built from an ${K.g("image","A read-only template for containers (app, libraries, settings), pulled from a registry.")} (the app plus its libraries, often only tens of megabytes) and started by a ${K.g("container engine","Software that pulls images and starts, stops and connects containers, e.g. Docker or containerd.")}. To the host each container is a group of processes, kept apart by Linux kernel features: namespaces (its own view of processes, files and network interfaces) and cgroups (caps on CPU and memory).</p>
${K.svg("0 0 720 310",
  K.band(10,8,340,24,"VIRTUAL MACHINES")+K.band(370,8,340,24,"CONTAINERS")+
  K.box(20,44,100,34,"App A","+ libraries")+K.box(130,44,100,34,"App B","+ libraries")+K.box(240,44,100,34,"App C","+ libraries")+
  K.box(20,84,100,52,"Guest OS","own kernel")+K.box(130,84,100,52,"Guest OS","own kernel")+K.box(240,84,100,52,"Guest OS","own kernel")+
  K.box(20,148,320,40,"Hypervisor","virtual hardware for each VM",true)+
  K.box(20,198,320,40,"Server hardware","")+
  K.box(380,96,100,40,"App A","+ libraries")+K.box(490,96,100,40,"App B","+ libraries")+K.box(600,96,100,40,"App C","+ libraries")+
  K.box(380,148,320,40,"Container engine","Docker · containerd",true)+
  K.box(380,198,320,40,"Host OS — one shared kernel","Linux")+
  K.box(380,248,320,40,"Server hardware (or a VM)","")+
  K.txt(180,262,"Each VM: own kernel, gigabytes,",{mid:true,f:"body",s:11})+K.txt(180,278,"boots in seconds to minutes",{mid:true,f:"body",s:11})+
  K.txt(540,62,"Containers: one kernel, megabytes,",{mid:true,f:"body",s:11})+K.txt(540,78,"start in about a second or less",{mid:true,f:"body",s:11}),
  "The same three applications as VMs (left) and as containers (right). The containers drop the guest operating systems and share the host's kernel; they can run on bare metal or, very often, inside a VM.")}
<div class="tablewrap"><table>
<tr><th></th><th>Virtual machine</th><th>Container</th></tr>
<tr><td><b>What is virtualized</b></td><td>Hardware (by the hypervisor)</td><td>The operating system (by the kernel and a container engine)</td></tr>
<tr><td><b>Carries</b></td><td>A full guest OS and its own kernel</td><td>The app and its libraries only</td></tr>
<tr><td><b>Typical size</b></td><td>Gigabytes</td><td>Megabytes to a few hundred megabytes</td></tr>
<tr><td><b>Start-up</b></td><td>Boots: seconds to minutes</td><td>Starts a process: often under a second</td></tr>
<tr><td><b>Isolation</b></td><td>Strong: separate kernels</td><td>Good, but every container trusts one shared kernel</td></tr>
<tr><td><b>Different OS from the host?</b></td><td>Yes: Windows and Linux VMs on one host</td><td>No: Linux containers need a Linux kernel</td></tr>
</table></div>
<p>Containers suit ${K.g("microservices","An application built from many small services, each deployed and scaled on its own.")}: an app split into many small services, each in its own container, started and stopped in seconds as load changes. Hundreds of containers across many hosts need a manager, an ${K.g("orchestrator","Software that places, restarts, scales and connects containers across many hosts. Kubernetes is the best known.")} such as <b>Kubernetes</b>, which places containers on hosts, restarts any that die and adds copies when traffic grows.</p>
<h3>What the network sees</h3>
<p>Docker's default network is a software bridge inside the host (docker0, 172.17.0.0/16) with a virtual interface per container. To reach a container from outside you <b>publish</b> a port, and the host translates its own IP and port to the container's (Module 7's port forwarding), so the physical switch often sees only the host. In clouds, containers usually run <i>inside VMs</i>: layered, not rivals.</p>
${K.when([
  ["Virtual machine","A different OS from the host, a full server, strong tenant isolation, a vendor appliance","Own kernel and virtual hardware","You need hundreds of small, fast-scaling copies of one app"],
  ["Container","Microservices and APIs that scale up and down; one build from laptop to production","Small, starts in about a second","The app needs another OS or kernel, or tenants must not share a kernel"],
  ["Containers inside VMs","Most public clouds and many data centres","VMs isolate tenants; containers give speed inside them","—"],
], "VM or container?")}
${K.drill({title:"VM or container?", types:["vmcontainer"], count:5})}
${K.check({q:"Which statement about containers is correct?", o:["Each container includes its own guest operating system and kernel","Containers on a host share the host's kernel and package only the application and its libraries","A container needs a type 1 hypervisor to run","A Linux container can run directly on a Windows kernel without any Linux kernel"], a:1, why:"Containers virtualize the OS, not the hardware: they share the host kernel, so they are small and fast, and a Linux container needs a Linux kernel (on Windows or macOS, Docker Desktop runs a small Linux VM)."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A fintech in Abuja is planning three workloads. Which two are better run as containers than as VMs? (Choose two.)", o:["A card-payment API that must go from 4 to 60 copies in minutes on busy salary days","A legacy Windows accounting server that the vendor supports only as a full Windows installation","A set of 30 small services (login, alerts, statements) released several times a week","A Linux firewall appliance image the vendor ships only as a VM","Two customers' systems that must not share a kernel for compliance reasons"], a:[0,2], why:"1. What is asked? Which workloads fit containers. 2. Which rule? Containers share one kernel and start fast, so they suit many small, quickly scaled copies of an app on the same OS; anything that needs its own OS, a vendor VM image or kernel-level separation belongs in a VM. 3. Apply it: the payment API and the 30 microservices are containers; the Windows server, the vendor appliance and the two separate customers are VMs."})}

<h2>Network functions virtualization: routers and firewalls as software</h2>
${K.remember(`<b>The rule:</b> a router, firewall or wireless controller is <b>software that used to be sold inside a box</b>. Network functions virtualization (NFV) runs that software as a VM (or container) on ordinary servers, so you deploy a router the way you deploy a server: in minutes, from an image, wherever there is a host. It still behaves like the box: same CLI, same protocols, same VLANs and trunks.`)}
<p>In 2012 a group of large telecoms operators described ${K.g("NFV","Network functions virtualization: running routing, firewalling and other network functions as software on standard servers instead of appliances.")} in a paper through ${K.g("ETSI","European Telecommunications Standards Institute: the European body that publishes telecoms standards, including the NFV framework.")}: instead of another appliance per service in every exchange, run the functions as software on standard x86 servers. Their vocabulary:</p>
<ul>
<li>A ${K.g("VNF","Virtual network function: one network function (router, firewall, load balancer, WLC…) running as software on a virtualized platform.")}: one function as software, such as a virtual router or firewall.</li>
<li>The ${K.g("NFVI","NFV infrastructure: the servers, storage, network and virtualization layer that VNFs run on.")}: the servers, switches and hypervisors they run on.</li>
<li>${K.g("MANO","Management and orchestration: the NFV software that deploys VNFs, scales them, heals them and chains them together.")}: the automation that creates and scales VNFs and links them into a <b>service chain</b> (router, then firewall, then load balancer).</li>
</ul>
<p>Cisco examples you will meet: the <b>Catalyst 8000V</b> (a full IOS XE router as a VM, successor to the ${K.g("CSR 1000v","Cloud Services Router 1000v: Cisco's earlier virtual router, replaced by the Catalyst 8000V.")}), the <b>${K.g("ASAv","Adaptive Security Appliance virtual: Cisco's ASA firewall software running as a VM.")}</b> and <b>Secure Firewall Threat Defense Virtual</b> firewalls, and the <b>Catalyst 9800-CL</b> wireless controller from Module 9. They run in clouds (lesson 7), data centres (virtual firewalls between VMs) and branches, where one small server runs the router, firewall and SD-WAN edge (lesson 4) as VNFs, sometimes called a universal ${K.g("CPE","Customer premises equipment: the provider-managed devices at a customer's site, such as the branch router.")}.</p>
${K.svg("0 0 740 240",
  K.band(10,8,300,24,"BEFORE — ONE BOX PER FUNCTION")+K.band(330,8,400,24,"NFV — FUNCTIONS AS VMs (VNFs)")+
  K.dev("router",70,80,"Router","appliance")+K.dev("firewall",160,80,"Firewall","appliance")+K.dev("server",250,80,"Load balancer","appliance")+
  K.txt(160,170,"Each: own power, space, spares,",{mid:true,f:"body",s:11})+K.txt(160,186,"weeks to order and install",{mid:true,f:"body",s:11})+
  K.box(340,44,120,46,"vRouter","Catalyst 8000V")+K.box(475,44,120,46,"vFirewall","ASAv")+K.box(610,44,110,46,"vWLC","9800-CL")+
  K.arrow(460,67,473,67,"",true)+K.arrow(595,67,608,67,"",true)+
  K.box(340,104,380,40,"Hypervisor + standard x86 servers (NFVI)","the same hosts that run server VMs",true)+
  K.band(340,156,380,26,"MANO: deploy · scale · heal · chain the VNFs")+
  K.txt(530,206,"New function = new VM from an image,",{mid:true,f:"body",s:11})+K.txt(530,222,"deployed in minutes on any host",{mid:true,f:"body",s:11}),
  "Left: dedicated appliances. Right: the same functions as virtual network functions on shared servers, chained in software (arrows) and managed by MANO.")}
${K.when([
  ["Physical appliance","Very high throughput at the internet edge or core","Custom chips (ASICs) forward faster per watt","You need it in a cloud, quickly, or in many small places"],
  ["Virtual appliance (VNF)","Clouds, filtering between VMs, labs, one-box branches","Deploy in minutes, scale by adding VMs","Throughput beyond the host's CPUs; no host on site"],
], "Physical or virtual network function?")}
${K.myth([
  ["Virtual machines and containers are the same thing.","A VM has its own guest OS and kernel on virtual hardware; a container shares the host's kernel and packages only the app."],
  ["Type 2 hypervisors are newer and better than type 1.","The numbers are categories, not versions. Type 1 runs on the hardware and is what production uses; type 2 runs on an OS and suits desktops."],
  ["A VM can be in any VLAN, so the switch port doesn't matter.","The VM's frames are tagged by its port group and must be allowed on the host's physical trunk, on every host it can move to."],
  ["A virtual router is a simplified toy.","A Catalyst 8000V runs IOS XE with the same CLI and protocols as a hardware router; its limit is throughput, set by the host's CPUs and its licence."],
])}
<h3>Hands-on: a VM moves and goes dark</h3>
<p>Now the Friday ticket, in Abuja. Hosts ESXI-01 and ESXI-02 connect to ABJ-DC-SW1. The gateway for both VM VLANs is <b>VR-01, a Catalyst 8000V virtual router</b> on ESXI-01: an NFV router-on-a-stick whose vNIC sits in a tag-passing (VGT) port group, so its subinterfaces see VLANs 110 and 120.</p>
${K.bench({id:"m10-vmotion", points:110, from:"CCNA · Module 10 · lesson 5", title:"Abuja data centre: the database VM moved hosts and went dark", viewBox:"0 0 980 560", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;We moved DB01 to ESXI-02 to free memory on ESXI-01. Since then WEB01 can't reach the database. APP02 on ESXI-02 is fine. Is it the network?&rdquo; VLAN 110 = APP (10.40.110.0/24), VLAN 120 = DB (10.40.120.0/24), gateways .1 on VR-01. <b>How the lab draws it:</b> each host's virtual switch is a small switch (ESXI-01-vSwitch0, ESXI-02-vSwitch0) and each VM a server whose cable is its vNIC; their ports are set as the server team built them (port groups = access ports in their VLAN; uplink and VR-01's port group = trunks). A real vSwitch runs no STP or DTP and is configured from vSphere, so leave them alone and work on ABJ-DC-SW1 (console from NOC-LAPTOP). The migration is done by moving DB01's cable: its MAC and IP stay the same, as in a real vMotion.",
  devices:[
    {id:"sw", kind:"switch", label:"ABJ-DC-SW1", model:"Catalyst 9300", x:280, y:20, config:e=>{ ["en","conf t","hostname ABJ-DC-SW1","vlan 110","name APP","vlan 120","name DB","vlan 999","name NATIVE-UNUSED","exit",
      "int g0/2","description ESXI-01 vmnic0","switchport trunk native vlan 999","switchport trunk allowed vlan 110,120","switchport mode trunk","switchport nonegotiate",
      "int g0/3","description ESXI-02 vmnic0","switchport trunk native vlan 999","switchport trunk allowed vlan 110","switchport mode trunk","switchport nonegotiate"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"NOC-LAPTOP", x:760, y:10},
    {id:"hv1", kind:"switch", label:"ESXI-01 vSwitch0", model:"virtual switch inside ESXI-01 (lab stand-in)", x:20, y:190, config:e=>{ ["en","conf t","hostname ESXI-01-vSwitch0","vlan 110","name APP","vlan 120","name DB","vlan 999","exit",
      "int g0/1","description uplink vmnic0","switchport trunk native vlan 999","switchport trunk allowed vlan 110,120","switchport mode trunk","switchport nonegotiate",
      "int g0/2","description port group APP (WEB01)","switchport mode access","switchport access vlan 110",
      "int g0/3","description port group DB","switchport mode access","switchport access vlan 120",
      "int g0/4","description port group VGT (VR-01)","switchport trunk native vlan 999","switchport trunk allowed vlan 110,120","switchport mode trunk","switchport nonegotiate"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"hv2", kind:"switch", label:"ESXI-02 vSwitch0", model:"virtual switch inside ESXI-02 (lab stand-in)", x:540, y:190, config:e=>{ ["en","conf t","hostname ESXI-02-vSwitch0","vlan 110","name APP","vlan 120","name DB","vlan 999","exit",
      "int g0/1","description uplink vmnic0","switchport trunk native vlan 999","switchport trunk allowed vlan 110,120","switchport mode trunk","switchport nonegotiate",
      "int g0/2","description port group APP (APP02)","switchport mode access","switchport access vlan 110",
      "int g0/3","description port group DB","switchport mode access","switchport access vlan 120"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"vr", kind:"router", label:"VR-01", model:"Catalyst 8000V · VM on ESXI-01", mac:"0050.56a1", x:20, y:400, config:e=>{ ["en","conf t","hostname VR-01","int g0/0","description vNIC in VGT port group","no shut","int g0/0.110","encapsulation dot1Q 110","ip address 10.40.110.1 255.255.255.0","int g0/0.120","encapsulation dot1Q 120","ip address 10.40.120.1 255.255.255.0"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"web", kind:"server", label:"WEB01", x:250, y:400, ip:"10.40.110.11", mask:"255.255.255.0", gw:"10.40.110.1", mac:"0050.56a1.1011"},
    {id:"db", kind:"server", label:"DB01", x:400, y:400, ip:"10.40.120.21", mask:"255.255.255.0", gw:"10.40.120.1", mac:"0050.56a1.2021"},
    {id:"app", kind:"server", label:"APP02", x:640, y:400, ip:"10.40.110.12", mask:"255.255.255.0", gw:"10.40.110.1", mac:"0050.56a2.1012"},
  ],
  cables:[ {type:"cat6", a:"hv1:g1", b:"sw:g2"}, {type:"cat6", a:"hv2:g1", b:"sw:g3"}, {type:"cat6", a:"vr:g0", b:"hv1:g4"}, {type:"cat6", a:"web:eth", b:"hv1:g2"}, {type:"cat6", a:"db:eth", b:"hv1:g3"}, {type:"cat6", a:"app:eth", b:"hv2:g2"}, {type:"console", a:"lap:usb", b:"sw:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"Baseline before the move: on WEB01's <b>Command Prompt</b>, <code>ping 10.40.120.21</code> (DB01, still on ESXI-01). Read the frame log: does the frame ever reach ABJ-DC-SW1? (WEB01, VR-01 and DB01 are all inside ESXI-01.)", done:B=>Bench.tried(B,"web",/^\s*ping\s+10\.40\.120\.21\b/)},
    {text:"Do the live migration: unplug DB01's cable from <b>ESXI-01-vSwitch0 Gi0/3</b> and plug it into <b>ESXI-02-vSwitch0 Gi0/3</b> (the DB port group on ESXI-02).", done:B=>Bench.linked(B,"db:eth","hv2:g3")},
    {text:"Reproduce the ticket: from DB01 <code>ping 10.40.120.1</code> (its gateway) and from WEB01 <code>ping 10.40.120.21</code>. In the frame log, find the last device that touches DB01's frame, and what it says.", done:B=>Bench.linked(B,"db:eth","hv2:g3") && Bench.tried(B,"db",/^\s*ping\s+10\.40\.120\.1\b/) && Bench.tried(B,"web",/^\s*ping\s+10\.40\.120\.21\b/)},
    {text:"Diagnose on ABJ-DC-SW1 (console from NOC-LAPTOP): <code>enable</code>, <code>show interfaces trunk</code>, and <code>show mac address-table vlan 120</code> (the MAC addresses the switch has learned in VLAN 120). Compare Gi0/2 (ESXI-01) with Gi0/3 (ESXI-02).", done:B=>{ const h=B.devs.sw.env.history; return h.some(x=>/^\s*sh\S*\s+int\S*\s+trunk/i.test(x)) && h.some(x=>/^\s*sh\S*\s+mac\S*\s+add\S*/i.test(x)); }},
    {text:"Fix it without breaking APP02: on Gi0/3 add VLAN 120 to the trunk, keeping VLAN 110 (Module 4's <code>add</code> keyword), then <code>end</code>.", done:B=>{ const i=B.devs.sw.env.intfs["GigabitEthernet0/3"]; return Array.isArray(i.allowed) && i.allowed.includes(110) && i.allowed.includes(120) && B.devs.sw.env.mode==="priv"; }},
    {text:"Verify: DB01 <code>ping 10.40.120.1</code> and WEB01 <code>ping 10.40.120.21</code> both succeed, and <code>show mac address-table vlan 120</code> now lists DB01's MAC (0050.56a1.2021) on <b>Gi0/3</b>.", done:B=>Bench.linked(B,"db:eth","hv2:g3") && Bench.pingedNow(B,"db","10.40.120.1") && Bench.pingedNow(B,"web","10.40.120.21") && Bench.macPort(B,"sw","0050.56a1.2021",120)==="Gi0/3"},
    {text:"Prove you didn't break VLAN 110: from APP02 <code>ping 10.40.110.1</code>.", done:B=>{ const i=B.devs.sw.env.intfs["GigabitEthernet0/3"]; return Bench.pingedNow(B,"app","10.40.110.1") && Array.isArray(i.allowed) && i.allowed.includes(110) && i.allowed.includes(120); }},
  ],
  win:"DB01 is reachable on its new host. The VM never changed: same MAC, same IP, same port group. What changed was the physical trunk under it: ESXI-02's switch port carried VLAN 110 only, so ABJ-DC-SW1 dropped every VLAN 120 frame from ESXI-02 (the lab's log says why; a real switch drops them silently). One <code>add</code> fixed it without touching APP02. The real lesson for the change process: every host a VM can move to must carry every VLAN that VM can need, so check every host's trunk when a port group is created, not after the first migration.",
  solve:[["pc","web","ping 10.40.120.21"],["unplug","db:eth"],["plug","cat6","db:eth","hv2:g3"],["pc","db","ping 10.40.120.1"],["pc","web","ping 10.40.120.21"],
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","enable"],["term","show interfaces trunk"],["term","show mac address-table vlan 120"],
    ["term","configure terminal"],["term","interface g0/3"],["term","switchport trunk allowed vlan add 120"],["term","end"],
    ["pc","db","ping 10.40.120.1"],["pc","web","ping 10.40.120.21"],["term","show mac address-table vlan 120"],["pc","app","ping 10.40.110.1"]]})}
${K.hint(`Task 1: the whole conversation stays inside ESXI-01; ABJ-DC-SW1 sees only flooded broadcasts. Task 3: DB01's frame leaves ESXI-02's uplink tagged 120, and ABJ-DC-SW1 drops it: &ldquo;VLAN 120 isn't allowed on trunk Gi0/3&rdquo;. Task 4: Gi0/2 allows 110,120; Gi0/3 allows 110 only. Before the fix the MAC table has no entry for DB01 at all: its frames were never accepted.`)}
${K.job("Kano — &ldquo;the new payroll VM can't reach anything&rdquo;", `
<p><b>The ticket:</b> &ldquo;We built PAY-APP03 on host HV-KAN-02 this morning: 10.32.0.43/24, gateway 10.32.0.1, the payroll VLAN. It can't ping its gateway. The other payroll VMs on HV-KAN-01 are fine. Please check the switch.&rdquo;</p>
<p><b>Questions first:</b> which physical port is HV-KAN-02 on, what does it carry, and which VLAN are the VM's frames <i>actually</i> arriving in? Ask for the VM's MAC address: the one thing both teams can see.</p>
<ol>
<li><b>The VM's MAC:</b> the server team reads it from vSphere: 0050.56a9.3c41.</li>
<li><b>Where is it, and in which VLAN?</b> On KAN-SRV-SW1:
${K.out(`KAN-SRV-SW1#show mac address-table address 0050.56a9.3c41
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
 302    0050.56a9.3c41    DYNAMIC     Gi0/6
Total Mac Addresses for this criterion: 1`, "The VM is on Gi0/6 (HV-KAN-02), but its frames are arriving in VLAN 302, not the payroll VLAN 320.")}
</li>
<li><b>The port:</b> <code>show interfaces g0/6 switchport</code> shows a trunk with Trunking VLANs Enabled: ALL. The switch is doing what it is told: delivering a VLAN 302 frame into VLAN 302, the CCTV VLAN, where nobody owns 10.32.0.1.</li>
<li><b>The cause:</b> the port group on HV-KAN-02 says VLAN ID <b>302</b>, a typo for 320. On HV-KAN-01 it is 320, so those VMs work.</li>
<li><b>The fix:</b> the server team corrects the port group to 320. <code>show mac address-table address 0050.56a9.3c41</code> now shows VLAN 320 on Gi0/6, and the ping works.</li>
<li><b>Hardening, in a change window:</b> a trunk allowing <i>all</i> VLANs let a typo put a payroll server in the CCTV network. Restrict both host ports to the exact VLAN list, and ask for port groups to be defined once on a distributed switch.</li>
</ol>
<p><b>What you tell the server team:</b> &ldquo;Your VM reaches our switch tagged for VLAN 302, the CCTV network: the port group on HV-KAN-02 says 302, not 320. Change it and it'll work; we're tightening that trunk too.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;PAY-APP03 (0050.56a9.3c41) learned in VLAN 302 on KAN-SRV-SW1 Gi0/6 (HV-KAN-02); expected 320. Cause: port group VLAN typo on HV-KAN-02. Corrected by server team; MAC now in VLAN 320, ping OK. Follow-up: restrict Gi0/5–6 allowed VLANs (currently ALL).&rdquo;</p>`)}
${K.case("An Abuja insurer goes virtual", `
<p><b>The situation:</b> the insurer from the worked example has 12 servers in Abuja and three branches, each with a router and a small firewall. The plan: consolidate, add a customer portal, and stop flying an engineer out whenever a branch box fails.</p>
<p><b>Hosts:</b> two type 1 hosts (N+1), each with two NICs to two switches. Every host port is a hard-coded trunk with an unused native VLAN and the same allowed list: server VLANs, host management and live migration. Default teaming, so no EtherChannel, and the port descriptions say so.</p>
<p><b>The portal:</b> 15 small services that scale on claim days become <b>containers</b>, run by Kubernetes inside three Linux VMs: containers for speed, VMs to keep the portal apart from the core systems.</p>
<p><b>Security inside the hosts:</b> portal and database VMs share hosts, so their traffic never crosses the physical firewall. A <b>virtual firewall</b> (a VNF) becomes the only path into the database VLAN.</p>
<p><b>Branches:</b> at the next refresh, one small server per branch runs a virtual router and firewall; a failed VNF is redeployed from head office in minutes. Physical firewalls stay at the internet edge, where throughput matters most.</p>
<p><b>The lesson:</b> VMs move (so every host trunk is identical), containers share a kernel (so VMs set the security boundary), and network functions are software (so they sit wherever the traffic is).</p>`)}
${K.dodont([
  "Make every switch port to a host a hard-coded trunk with <code>switchport nonegotiate</code> and an unused native VLAN.",
  "Allow exactly the VLANs the hosts need, identically on every host in a cluster.",
  "Add VLANs with <code>switchport trunk allowed vlan add</code> and check <code>show interfaces trunk</code> before and after.",
  "Ask the server team for a VM's MAC address and find it with <code>show mac address-table address</code>.",
  "Agree NIC teaming with the server team before you configure any EtherChannel.",
],[
  "Don't leave host ports in <code>dynamic auto</code>: hosts never send DTP.",
  "Don't type <code>switchport trunk allowed vlan N</code> on a live host trunk without <code>add</code>.",
  "Don't assume the physical firewall sees traffic between VMs on the same host.",
  "Don't put one VLAN on one host only if its VMs can migrate.",
  "Don't run production VMs on a type 2 hypervisor on someone's desktop.",
])}
${K.check({q:"After a live migration, a VM keeps its IP and MAC but nobody can reach it. Other VMs on the new host, in a different VLAN, work. What is the most likely cause?", o:["The VM's IP address changed during the migration","The new host's physical switch port doesn't allow the VM's VLAN on its trunk","Live migration always needs the VM to be rebooted","The physical switch needs a static MAC entry for every VM"], a:1, why:"Live migration keeps the VM's MAC and IP. If its frames are tagged for a VLAN the new host's trunk doesn't carry, the physical switch drops them. Other VLANs on that host keep working, which is the giveaway."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A Lagos hospital's virtual firewall VM (a VNF on host HV-LOS-3) routes between VLANs 50 and 60 using subinterfaces on a single vNIC. Put the path of a frame from a VLAN 50 VM on another host, HV-LOS-1, to the firewall in order.", items:["The VM sends an untagged frame to its vNIC","HV-LOS-1's vSwitch tags it for VLAN 50 (port group VLAN 50) and sends it out its uplink","The physical switch receives it on HV-LOS-1's trunk and forwards it out HV-LOS-3's trunk, still tagged 50","HV-LOS-3's vSwitch passes it, tag intact, to the firewall's port group (VGT, VLAN 4095)","The firewall's VLAN 50 subinterface receives it"], why:"1. What is asked? Where tags are added and kept on the way to a VNF. 2. Which rule? Port groups tag VM frames (VST); a VNF that needs several VLANs on one vNIC sits in a pass-through (VGT) port group; physical trunks in between must carry the VLAN. 3. Apply it: untagged from the VM, tagged by the first vSwitch, carried by both trunks, passed with its tag to the firewall, whose subinterface for VLAN 50 takes it: router-on-a-stick, inside a VM."})}

<h2>Interview corner</h2>
${K.hint(`Say what runs directly on the hardware in each, give two products for each, and say where each belongs.`)}
${K.reveal("&ldquo;What's the difference between a type 1 and a type 2 hypervisor?&rdquo;", `<p>"A type 1, bare-metal hypervisor runs directly on the hardware: ESXi, Hyper-V, KVM, Xen. Nothing sits in between, so performance is near physical, the attack surface is small, and it has cluster features like live migration and high availability: that's what data centres run. A type 2, hosted hypervisor such as VirtualBox or VMware Workstation is an application on an ordinary OS, so every VM depends on that OS. Great for a laptop lab, wrong for production. One catch: Hyper-V on a Windows laptop is still type 1, because the hypervisor loads underneath Windows."</p>`)}
${K.hint(`Follow the frame from the VM to the switch: vNIC, vSwitch, port group VLAN, uplink, trunk. Then give the port configuration and one thing that commonly goes wrong.`)}
${K.reveal("&ldquo;How does a VM's traffic reach the physical network, and how would you configure the switch port to a host?&rdquo;", `<p>"The VM's virtual NIC plugs into a virtual switch inside the host. The VM's port group sets its VLAN, the vSwitch tags its frames, and they leave through the host's physical NICs, its uplinks. With VMs in several VLANs, the switch port is an 802.1Q trunk: <code>switchport mode trunk</code>, <code>switchport nonegotiate</code> because hosts don't speak DTP, an unused native VLAN, an allowed list of exactly the VLANs the cluster uses (the same on every host), and PortFast for trunks so it forwards straight after a host reboot. I'd agree NIC teaming before building any EtherChannel. The classic failure is a VM migrating to a host whose trunk lacks its VLAN, so I add VLANs with <code>allowed vlan add</code> and find a VM by its MAC with <code>show mac address-table address</code>."</p>`)}
${K.hint(`Contrast them in one sentence (hardware vs OS), then size, speed, isolation, OS choice, and say they're often used together. Bonus: where NFV fits.`)}
${K.reveal("&ldquo;Containers or VMs: how do you decide?&rdquo;", `<p>"A VM virtualizes the hardware, so each one has its own guest OS and kernel: strong isolation and any OS, at the cost of gigabytes and a real boot. A container virtualizes the OS: containers share the host kernel and carry only the app and libraries, so they're small, start in about a second and pack densely, but they all depend on one kernel and must suit it. Containers suit microservices and APIs that scale, orchestrated by Kubernetes; VMs suit full servers, other operating systems, vendor appliances and anything that mustn't share a kernel. Usually they're layered. Network functions went the same way: NFV runs routers and firewalls, like the Catalyst 8000V, as VMs."</p>`)}

${K.recap([
  "A VM is a whole computer in software: the hypervisor (virtual machine monitor) shares a host's CPU, memory, storage and network as vCPUs, memory, virtual disks and vNICs.",
  "Virtualization gives consolidation, fast provisioning, snapshots, live migration and high availability; it needs N+1 clusters because one host failure hits many VMs.",
  "Type 1 hypervisors (ESXi, Hyper-V, KVM, Xen) run on the hardware and run data centres; type 2 (VirtualBox, Workstation, Parallels) run on an OS and suit desktops and labs.",
  "VMs plug into a virtual switch; the port group sets each VM's VLAN; with several VLANs, the host's switch port is an 802.1Q trunk (nonegotiate, unused native VLAN, exact allowed list).",
  "A vSwitch runs no STP or DTP; VMs in the same VLAN on one host never touch the wire; VMware MACs start 00:50:56 or 00:0C:29.",
  "Live migration keeps a VM's MAC and IP, so every host it can move to must carry every VLAN it needs.",
  "Containers share the host kernel and package only the app: small and fast, orchestrated by Kubernetes, often inside VMs.",
  "NFV runs network functions (Catalyst 8000V, ASAv, 9800-CL) as VNFs on standard servers (NFVI), managed by MANO.",
])}
${K.next(`<b>Lesson 6 — VRFs.</b> Virtualization doesn't stop at servers: one router can hold several separate routing tables. You'll separate two tenants with the same 10.0.0.0/24 on one router with VRF-Lite, see the same subnet in two tables, and fix a VRF route that went missing.`)}
`,
quiz:[
  {lvl:1, q:"Which describes a type 1 hypervisor?", o:["It runs as an application on top of Windows or macOS","It runs directly on the server hardware, with no general-purpose operating system underneath","It is a container engine that shares the host kernel","It is the operating system installed inside each virtual machine"], a:1, why:"Type 1 (bare-metal, native) hypervisors such as ESXi, Hyper-V, KVM and Xen run directly on the hardware. Type 2 runs on a host OS; a container engine is a different technology; the OS inside a VM is the guest OS."},
  {lvl:1, q:"A student installs VMware Workstation on a Windows laptop to run a Linux VM for study. What kind of hypervisor is this?", o:["Type 1, because it is made by VMware","Type 2, because it runs as an application on top of the laptop's operating system","A container runtime","Not a hypervisor: it is an emulator for network devices"], a:1, why:"Workstation is installed on top of Windows, which owns the hardware, so it is a hosted (type 2) hypervisor. The vendor doesn't decide the type; ESXi is VMware's type 1 product."},
  {lvl:1, type:"match", q:"Match each virtualization term with its meaning.", pairs:[["Host","The physical server that runs the hypervisor"],["Guest OS","The operating system installed inside a virtual machine"],["vNIC","A VM's virtual network card, with its own MAC address"],["Port group","A set of virtual switch ports sharing one VLAN ID"],["Hypervisor","Software that creates VMs and shares the hardware between them"]], why:"The host is the physical box; the hypervisor (virtual machine monitor) runs on it and creates the VMs; each VM runs a guest OS and connects through vNICs to a virtual switch, whose port groups set the VLAN."},
  {lvl:1, type:"fill", q:"Containers on the same host share one part of the operating system, which is why a Linux container needs a Linux host. Which part?", fields:[{label:"Shared part", a:["kernel","the kernel","host kernel","the host kernel","os kernel","linux kernel"]}], why:"Containers virtualize the OS: each is an isolated group of processes on the host's kernel, carrying only the app and its libraries. VMs, by contrast, each bring their own kernel."},
  {lvl:1, q:"What does network functions virtualization (NFV) mean?", o:["Running network functions such as routers and firewalls as software (VNFs) on standard servers instead of dedicated appliances","Replacing all routers with switches","Encrypting network traffic between virtual machines","Splitting one VLAN into several subnets"], a:0, why:"NFV, defined through ETSI from 2012, runs network functions as virtual network functions on standard x86 servers (the NFVI), managed by MANO. Examples: Catalyst 8000V, ASAv, Catalyst 9800-CL."},
  {lvl:1, type:"multi", q:"Which three are benefits of server virtualization? (Choose three.)", o:["Several servers consolidated onto one physical host","A running VM can be moved to another host for maintenance","Snapshots let you roll back a failed upgrade","One host failure can no longer affect more than one service","The physical switch no longer needs VLANs"], a:[0,1,2], why:"Consolidation, live migration and snapshots are core benefits. The opposite of option four is true: one host failure hits every VM on it, hence N+1 clusters. VLANs matter more, not less: the host's port becomes a trunk."},
  {lvl:2, q:"Based on the exhibit, the VM DB01 (VLAN 120) can't reach its gateway after it was migrated to the host on Gi0/3. Other VMs on that host, in VLAN 110, work. What is the cause?", ex:"ABJ-DC-SW1#show interfaces trunk\nPort        Mode             Encapsulation  Status        Native vlan\nGi0/2       on               802.1q         trunking      999\nGi0/3       on               802.1q         trunking      999\n\nPort        Vlans allowed on trunk\nGi0/2       110,120\nGi0/3       110", o:["The native VLAN 999 is wrong on both trunks","VLAN 120 is not allowed on Gi0/3, the trunk to the VM's new host","Gi0/3 must be an access port in VLAN 120","DTP has not negotiated the trunk on Gi0/3"], a:1, why:"The VM's frames leave the new host tagged 120, and Gi0/3 allows only 110, so the switch drops them. The fix is switchport trunk allowed vlan add 120 on Gi0/3. Mode 'on' means a hard-coded trunk; an access port would break VLAN 110."},
  {lvl:2, q:"A server team says host HV-05 will run VMs in VLANs 15, 25 and 35, with each port group tagging its VLAN. The switch port is at factory defaults (dynamic auto). What happens if you leave it, and what should it be?", o:["It negotiates a trunk with the host automatically; leave it","It stays an access port in VLAN 1 because the host never sends DTP; configure a trunk allowing 15, 25 and 35 with nonegotiate","It becomes a routed port; give it three IP addresses","It works for all three VLANs because the vSwitch removes the tags"], a:1, why:"Dynamic auto becomes a trunk only if the far end asks with DTP, and hypervisor hosts never do, so the port stays access and drops tagged frames. Hard-code switchport mode trunk, switchport nonegotiate, an unused native VLAN and the exact allowed list."},
  {lvl:2, type:"multi", q:"Which two statements correctly compare containers with virtual machines? (Choose two.)", o:["Containers usually start much faster because no guest OS has to boot","Each container carries its own kernel, like a VM","A host can run Windows and Linux VMs side by side, but Linux containers need a Linux kernel","Containers give stronger isolation than VMs because they are smaller","Containers can only run on type 2 hypervisors"], a:[0,2], why:"Containers share the host kernel: no boot, so fast start; but they must suit that kernel. VMs bring their own kernels, so any OS, and stronger isolation. Containers run on any Linux host, bare metal or a VM."},
  {lvl:2, type:"order", q:"Two VMs on the same host: VM-A in VLAN 10 and VM-B in VLAN 20. Their gateway is a router-on-a-stick connected to the physical switch. Put VM-A's frame to VM-B in order.", items:["VM-A sends the frame to its gateway's MAC address","The host's vSwitch tags it for VLAN 10 and sends it out the physical uplink","The physical switch forwards it on the trunk to the router","The router routes it out its VLAN 20 subinterface, tagged 20","The physical switch sends it back down the host's trunk, and the vSwitch delivers it to VM-B"], why:"Different VLANs means routing, and the router is outside the host, so the frame leaves the host tagged 10, is routed, and returns tagged 20, even though both VMs are in the same box. Same-VLAN VMs on one host would stay inside the vSwitch."},
  {lvl:2, type:"fill", q:"A host's switch port Gi0/9 allows VLANs 10,20. Type the interface command that adds VLAN 30 without removing 10 and 20.", fields:[{label:"Command", a:["switchport trunk allowed vlan add 30"], ios:true}], why:"switchport trunk allowed vlan add 30 extends the list. switchport trunk allowed vlan 30 would replace it, cutting VLANs 10 and 20 off every VM on that host."},
  {lvl:2, q:"Based on the exhibit, what is most likely connected to Gi0/12?", ex:"DC-SW3#show mac address-table interface g0/12\n          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n  10    0050.56a4.11c0    DYNAMIC     Gi0/12\n  10    0050.56a4.11c7    DYNAMIC     Gi0/12\n  20    0050.56a4.20e2    DYNAMIC     Gi0/12\n  30    0050.56a4.3a19    DYNAMIC     Gi0/12\nTotal Mac Addresses for this criterion: 4", o:["A single physical PC with four network cards","A VMware hypervisor host with several VMs in VLANs 10, 20 and 30, on a trunk","An unmanaged hub with four printers","A router with four routed interfaces"], a:1, why:"Several MACs in three VLANs on one port, all starting 00:50:56 (a VMware OUI): VMs behind a host's virtual switch, arriving tagged on a trunk. One PC wouldn't be in three VLANs; routed router ports don't put MACs in a switch's VLANs like this."},
  {lvl:3, q:"A bank runs two hosts per cluster. During a patch window the server team moves every VM to host B; afterwards, only the VMs in VLAN 340 are unreachable. VLAN 340 was created last month. What should the network engineer check first, and why?", o:["The VMs' IP addresses, because live migration changes them","Whether host B's physical trunk (and its port group) carries VLAN 340, because a VLAN added later may have been added to host A's trunk only","Whether Spanning Tree on host B's vSwitch is blocking VLAN 340","Whether host B needs to be rebooted to learn the new VLAN"], a:1, why:"Live migration keeps IPs and MACs, and vSwitches don't run STP. The clue is that only the newest VLAN fails: it was very likely added to one host's trunk or port group and not the other. Check show interfaces trunk on both host ports and add it with allowed vlan add."},
  {lvl:3, q:"Security asks why the data-centre firewall never logged traffic between the web VMs and the database VMs, although policy says it must pass the firewall. Both groups are in VLAN 70 on the same host. What is the explanation, and a fix?", o:["The firewall is broken; replace it","VMs in the same VLAN on the same host are switched inside the vSwitch and never reach the physical network; put the database in its own VLAN routed through the firewall, or add a virtual firewall inside the host","The physical switch is filtering the traffic with an ACL","Live migration hides traffic from firewalls"], a:1, why:"Same VLAN, same host: the vSwitch delivers the frames directly. Nothing crosses a cable, so nothing outside the host sees it. Separate the tiers into VLANs whose gateway is the firewall, or filter east-west traffic with a virtual firewall (a VNF) in the host."},
  {lvl:3, q:"A virtual router VM must route between VLANs 81, 82 and 83 using subinterfaces on one vNIC. VMs in those VLANs, on other hosts, reach nothing through it, although its subinterfaces are up. Its port group is set to VLAN ID 81. What is wrong?", o:["Virtual routers can't use subinterfaces","With VLAN ID 81 the vSwitch strips tags and delivers only VLAN 81, untagged; the router's port group needs to pass tags through (VGT, VLAN 4095 on a standard vSwitch) so its dot1Q subinterfaces see 81, 82 and 83","The physical switch must be an access port in VLAN 81","The router needs a type 2 hypervisor"], a:1, why:"A VLAN ID of 81 means virtual switch tagging: only VLAN 81 frames reach the vNIC, with the tag removed, so the dot1Q subinterfaces get nothing they expect. A router-on-a-stick inside a VM needs the tags intact: guest tagging (VLAN 4095 on a VMware standard vSwitch, or a VLAN trunk range on a distributed switch), plus physical trunks carrying all three VLANs."},
],
cards:[
  {f:"Virtual machine (VM)", b:"A whole computer in software: vCPUs, memory, a virtual disk (a file) and vNICs, created by a hypervisor, running its own guest OS. Can be cloned, snapshotted and live-migrated."},
  {f:"Host, guest and guest OS", b:"Host: the physical server running the hypervisor. Guests: the VMs on it. Guest OS: the operating system inside each VM, which sees only virtual hardware."},
  {f:"Type 1 hypervisor", b:"Bare metal / native: runs directly on the hardware. ESXi, Hyper-V (even on a Windows laptop), KVM, Xen. Near-physical performance, small attack surface, cluster features (live migration, high availability). Data-centre choice."},
  {f:"Type 2 hypervisor", b:"Hosted: an application on top of an ordinary OS that owns the hardware. VirtualBox, VMware Workstation, Parallels Desktop. Easy, slower, depends on the host OS. Labs and desktops."},
  {f:"Virtualization: gains and costs", b:"Gains: consolidation, fast provisioning, snapshots, live migration, high-availability restarts. Costs: one host failure hits many VMs (plan N+1), noisy neighbours, licences, VM sprawl."},
  {f:"Virtual switch (vSwitch)", b:"A software Layer 2 switch in the host. VMs' vNICs plug in; the host's physical NICs (vmnic0…) are its uplinks. Runs no STP and no DTP; never forwards uplink to uplink."},
  {f:"Port group and VLAN tagging modes (VMware)", b:"Port group = vSwitch ports sharing one VLAN ID. VLAN 0 = no tag (EST, access port). 1–4094 = the vSwitch tags (VST, trunk). 4095 = the guest tags (VGT, trunk; e.g. a virtual router)."},
  {f:"Switch port to a hypervisor host", b:"switchport mode trunk, switchport nonegotiate (hosts send no DTP), unused native VLAN, allowed list = exactly the cluster's VLANs (same on every host), PortFast for trunks (spanning-tree portfast edge trunk on IOS XE). Add VLANs with allowed vlan add."},
  {f:"Live migration (vMotion)", b:"A running VM moves to another host keeping its MAC, IP and sessions; the host sends RARP frames so switches relearn the MAC. Every host a VM can move to must carry every VLAN it needs."},
  {f:"Spotting VMs on a switch", b:"Many MACs, often in several VLANs, on one port. OUIs: 00:50:56 and 00:0C:29 VMware, 00:15:5D Hyper-V. Find one VM: show mac address-table address <MAC>."},
  {f:"Container", b:"An app plus its libraries, built from an image and run by an engine (Docker, containerd) as isolated processes on the host's shared kernel (namespaces, cgroups). MBs, starts in about a second; Linux containers need a Linux kernel."},
  {f:"VM vs container: choosing", b:"VM: other OS, full servers, vendor appliances, kernel-level isolation. Container: microservices and APIs that scale fast, orchestrated by Kubernetes. Usually layered: containers inside VMs."},
  {f:"NFV, VNF, NFVI, MANO", b:"NFV (ETSI, 2012): network functions as software on standard servers. VNF: one virtual function (Catalyst 8000V router, ASAv/FTDv firewall, 9800-CL WLC). NFVI: the servers and hypervisor. MANO: deploys, scales, heals and chains VNFs."},
],
});

// ---------- Module 10 · Lesson 6 ----------
L.push({
id:"wan-vrf", mins:100, level:"Intermediate · builds on Modules 4–6 and lessons 2 and 5 of this module",
t:"VRFs — one router, several routing tables: VRF-Lite, per-VRF routing and troubleshooting",
html:`
${K.goals([
  "Explain what a VRF is, why the same subnet can live in two VRFs on one router, and which table a router uses for each packet.",
  "Configure VRF-Lite with <code>vrf definition</code>, <code>address-family ipv4</code> and <code>vrf forwarding</code>, knowing that joining a VRF removes the interface's address.",
  "Route inside a VRF with <code>ip route vrf</code> and <code>router ospf N vrf NAME</code>, and test it with <code>show ip route vrf</code>, <code>ping vrf</code> and <code>traceroute vrf</code>.",
  "Troubleshoot a missing VRF route: an interface left in the global table, or a static route or OSPF network put in the wrong table.",
  "Choose between VRF-Lite, VLANs with ACLs and MPLS Layer 3 VPNs for a separation problem.",
])}
${K.pre([
  "Module 4: VLANs, 802.1Q trunks and router-on-a-stick subinterfaces (<code>encapsulation dot1Q</code>).",
  "Module 5: the routing table (connected, local, static, OSPF), longest match, <code>ip route</code>, <code>router ospf</code> and <code>network</code> statements, <code>ping</code> and <code>traceroute</code> from a router.",
  "Module 6 named VRFs in passing; lesson 2 of this module showed a provider edge (PE) router keeping one VRF per customer in an MPLS Layer 3 VPN.",
  "Lesson 5: virtualization, the idea that one physical box can be split into several isolated ones.",
])}

<h2>Why this matters at work</h2>
<p>A managed-services company in Abuja looks after the networks of thirty small businesses from one rack of routers. Two new clients sign on the same week: a law firm and a dental clinic. Both use 192.168.1.0/24, because both were set up years ago by whoever installed their first internet router. Renumbering means visiting every printer, camera and card terminal, and sales has promised &ldquo;no changes on your side&rdquo;.</p>
<p>On a normal router that promise is impossible: one router has one routing table, and one table can't hold the same subnet twice. A <b>VRF</b> gives the router a second, separate table, so both clients keep 192.168.1.0/24 and never see each other. VRFs are part of CCNA 200-301 v1.1 topic 1.12 (&ldquo;server virtualization, containers, and VRFs&rdquo;). The v2.0 exam (first test date 3 February 2027) drops VRFs from its topic list, but guest, CCTV, payment and management networks and every provider edge router still use them.</p>

<h2>One router, several routing tables</h2>
${K.remember(`<b>The rule:</b> a ${K.g("VRF","Virtual Routing and Forwarding instance: a separate routing table (with its own interfaces, routes and ARP entries) inside one router or Layer 3 switch.")} is a separate routing table inside one router. <b>Every interface belongs to exactly one table</b>: the global table or one VRF. A packet is routed <b>only in the table of the interface it arrived on</b>, so routes in one VRF are invisible to the others, and the same subnet can exist in two VRFs without clashing.`)}
<p>Every router so far had one routing table. Once VRFs exist it gets a name: the ${K.g("global table","The router's ordinary routing table: every interface that is not in a VRF belongs to it, and plain show ip route, ip route and ping use it. Also called the default VRF.")}. A VRF adds another, named table next to it, and you move interfaces into it. From then on:</p>
<ul>
<li>Those interfaces' <b>connected and local routes</b> appear in the VRF's table and nowhere else.</li>
<li>Static routes and routing protocols you configure <b>for that VRF</b> fill that table only.</li>
<li>The router keeps <b>a separate ARP table</b> per VRF, so 10.0.9.10 in one VRF can be a different machine (a different MAC) from 10.0.9.10 in another.</li>
<li>A packet that arrives on a VRF interface is looked up <b>in that VRF's table only</b>. If the destination isn't there, it is dropped, even if the global table or another VRF knows the way.</li>
</ul>
<p>That last point is the whole idea: separation doesn't come from a filter someone could forget, but from routes to the other side not existing in your table.</p>
${K.analogy(`An office building where each company has its own phone system. The law firm's extension 101 rings the senior partner; the clinic's extension 101 rings the front desk. Both numbers are &ldquo;101&rdquo; and nobody is confused, because a call made on the law firm's system can only reach law-firm extensions. The building (the router) is shared; the directories (the routing tables) are not.`)}
${K.svg("130 0 500 390",
  K.box(140,10,480,240,"","")+K.txt(380,32,"BLDG-R1 — one router, three routing tables",{mid:true,c:"fg",b:true,f:"body",s:12})+
  K.band(155,46,145,24,"VRF TENANT-A")+K.band(308,46,145,24,"VRF TENANT-B")+K.band(461,46,145,24,"GLOBAL TABLE")+
  K.box(155,76,145,74,"","")+K.box(308,76,145,74,"","")+K.box(461,76,145,74,"","")+
  K.txt(162,100,"C 10.0.0.0/24 Gi0/0",{s:10})+K.txt(162,120,"C 10.0.9.0/24 Gi0/2.50",{s:10})+K.txt(162,140,"own ARP table",{s:10,f:"body"})+
  K.txt(315,100,"C 10.0.0.0/24 Gi0/1",{s:10})+K.txt(315,120,"C 10.0.9.0/24 Gi0/2.60",{s:10})+K.txt(315,140,"own ARP table",{s:10,f:"body"})+
  K.txt(468,100,"C 172.16.0.0/24 Gi0/3",{s:10})+K.txt(468,120,"(building Wi-Fi)",{s:10,f:"body"})+K.txt(468,140,"own ARP table",{s:10,f:"body"})+
  K.link(190,150,190,278)+K.link(265,150,265,278)+K.link(345,150,345,278)+K.link(420,150,420,278)+K.link(535,150,535,280)+
  K.txt(195,200,"Gi0/0",{s:10})+K.txt(270,200,"Gi0/2.50",{s:10})+K.txt(350,200,"Gi0/1",{s:10})+K.txt(425,200,"Gi0/2.60",{s:10})+K.txt(540,200,"Gi0/3",{s:10})+
  K.dev("pc",190,300,"A-PC1","10.0.0.10")+K.dev("server",265,300,"A-SRV","10.0.9.10")+K.dev("pc",345,300,"B-PC1","10.0.0.10")+K.dev("server",420,300,"B-SRV","10.0.9.10")+K.dev("ap",535,300,"WIFI-AP","172.16.0.0/24")+
  K.txt(227,376,"Tenant A",{mid:true,c:"accent",b:true,f:"body"})+K.txt(382,376,"Tenant B",{mid:true,c:"accent",b:true,f:"body"})+K.txt(535,376,"Building",{mid:true,c:"accent",b:true,f:"body"}),
  "One physical router, three tables. Tenant A and tenant B use identical subnets (10.0.0.0/24 and 10.0.9.0/24); each pair of interfaces belongs to its own VRF, so each subnet appears once per table and never clashes. The building's own Wi-Fi stays in the global table.")}
<h3>Why would you want this? Four jobs VRFs do</h3>
<ol>
<li><b>Overlapping addresses.</b> Customers, building tenants or merged companies with the same private ranges keep their addressing on one router.</li>
<li><b>Separation.</b> Guest Wi-Fi, CCTV, card-payment terminals get their own VRF and exit (default route), so they can't route to staff even if an ACL is wrong.</li>
<li><b>Provider edge routers.</b> In lesson 2's MPLS Layer 3 VPN, each ${K.g("PE","Provider edge router: the provider's router facing customers in an MPLS VPN; it keeps one VRF per customer (lesson 2).")} keeps one VRF per customer, with labels and BGP carrying each VRF's routes across the core.</li>
<li><b>Management.</b> The management port sits in its own VRF, away from user traffic.</li>
</ol>
<p>When VRFs are used <i>without</i> MPLS, on ordinary routers and Layer 3 switches, the result is called ${K.g("VRF-Lite","VRFs on ordinary routers and Layer 3 switches without MPLS: each device keeps separate tables, and each link between devices carries one subinterface per VRF.")}. This lesson configures VRF-Lite; the provider version (lesson 2) is CCNP material.</p>
${K.dyk(`Cisco ISR 4000 and ASR 1000 routers put their dedicated management Ethernet port in a VRF called <b>Mgmt-intf</b> by default. <code>show vrf</code> on a new one lists it, with the management port (GigabitEthernet0) as its interface: management traffic gets its own table (and default route, once added). The lab's routers have no management port.`)}
${K.check({q:"A router has G0/0 in VRF RED and G0/1 in VRF BLUE, both configured as 10.5.5.1/24. Why does IOS accept the second address?", o:["IOS never checks for overlapping addresses","The two interfaces are in different routing tables, and overlap is only a problem inside one table","Because the second interface is shut down","Because VRFs use NAT to hide one of the addresses"], a:1, why:"Each VRF is its own table. 10.5.5.0/24 appears once in RED's table and once in BLUE's, so nothing clashes. Inside one table (two interfaces in RED, or two in the global table) IOS still refuses the overlap. No NAT is involved."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Router PH-EDGE has: G0/0 in VRF CCTV (10.60.0.1/24), G0/1 in VRF STAFF (10.70.0.1/24), G0/2 in the global table (10.80.0.1/24). It has no static routes and no routing protocols. Match each arriving packet with what the router does.", pairs:[["Arrives on G0/0, destination 10.60.0.25","Looked up in CCTV, delivered out G0/0"],["Arrives on G0/0, destination 10.70.0.25","Looked up in CCTV, no route: dropped"],["Arrives on G0/2, destination 10.60.0.25","Looked up in the global table, no route: dropped"],["Arrives on G0/1, destination 10.70.0.40","Looked up in STAFF, delivered out G0/1"]], why:"1. What is asked? Which table each packet uses and whether that table has a route. 2. Which rule? A packet is looked up only in the table of the interface it arrived on; each table holds only its own interfaces' connected routes. 3. Apply it: CCTV knows only 10.60.0.0/24, STAFF only 10.70.0.0/24, the global table only 10.80.0.0/24. A camera packet for the staff subnet finds nothing in CCTV and is dropped, even though the router itself has a STAFF interface in that subnet."})}

<h2>Configuring VRF-Lite: create, assign, re-address</h2>
${K.remember(`<b>The rule:</b> three steps, always in this order. <b>Create</b> the VRF (<code>vrf definition NAME</code>, then <code>address-family ipv4</code>). <b>Assign</b> an interface to it (<code>vrf forwarding NAME</code>). <b>Re-address</b> the interface, because joining or leaving a VRF <b>wipes its IP address</b>. Hook: <i>create, assign, re-address</i>.`)}
<h3>Step 1: create the VRF</h3>
<p><code>vrf definition NAME</code> creates the VRF and enters <code>R1(config-vrf)#</code>, where you can add a <code>description</code>. Names are case-sensitive; capitals (GUEST, CUST_A) stand out in configs. It is the <b>multiprotocol</b> form, so you say which protocols the VRF carries: <code>address-family ipv4</code> (the lab shows <code>(config-vrf-af)#</code>) switches IPv4 on and <code>exit-address-family</code> leaves. Without it the lab refuses <code>ip address</code> on the VRF's interfaces.</p>
<p>The older single-protocol form, <code>ip vrf NAME</code>, is IPv4 only with no address-family step; its interface command is <code>ip vrf forwarding NAME</code>. Recognise both; use <code>vrf definition</code> for new work.</p>
<p>You may also meet <code>rd 65000:1</code> inside a VRF. A ${K.g("route distinguisher (RD)","An 8-byte value (written like 65000:1) that MP-BGP adds in front of a customer prefix so identical prefixes from different VRFs stay unique between PE routers. Not needed for VRF-Lite.")} matters only when BGP carries VRF routes between provider edge routers (lesson 2's ${K.g("MP-BGP","Multiprotocol BGP: the BGP extension that carries VPN routes (RD + prefix) between PE routers in an MPLS VPN. Taught in CCNP-level courses.")}). VRF-Lite doesn't need one (<code>show vrf</code> lists it as <code>&lt;not set&gt;</code>); some older IOS releases want one before <code>ip vrf</code> works. ${K.g("Route targets","BGP values (route-target import/export) that decide which PE VRFs receive which customer routes in an MPLS VPN. Stored but unused in VRF-Lite.")} (<code>route-target import|export</code>) are likewise an MPLS VPN feature.</p>
<h3>Step 2: assign the interface, and watch the address disappear</h3>
<p>Under the interface, <code>vrf forwarding NAME</code> moves it into the VRF. If the interface already has an IPv4 address, IOS removes it and tells you:</p>
${K.out(`R1(config)#interface GigabitEthernet0/1
R1(config-if)#vrf forwarding CUST_A
% Interface GigabitEthernet0/1 IPv4 disabled and address(es) removed due to enabling VRF CUST_A
R1(config-if)#ip address 10.1.1.1 255.255.255.0`, "The lab's message when an interface joins a VRF. Real IOS output shows the same message, with disabling, when an interface leaves a VRF (no vrf forwarding); the joining form swaps in enabling.")}
<p>Why? The address was a connected route in the global table; the move takes it to another table, and IOS makes you re-enter it deliberately. <code>no vrf forwarding</code> wipes it too.</p>
<p>So the order is <b><code>vrf forwarding</code> first, then <code>ip address</code></b>; the other way round, the address you typed is the one removed. On a live interface everything behind it loses its gateway until the address is back: a maintenance-window change. Naming a VRF that doesn't exist is refused (the lab prints <code>% VRF NOPE not configured.</code>).</p>
${K.mistake(`Pasting a change that puts <code>ip address</code> before <code>vrf forwarding</code>. The paste &ldquo;succeeds&rdquo;, the interface ends up in the VRF with <b>no address</b>, and the site goes dark. After any VRF change, read <code>show ip vrf interfaces</code> or <code>show ip interface brief</code> and look for <code>unassigned</code>.`)}
<h3>Worked example: two customers with the same LAN on one provider router</h3>
<p>Port Harcourt, a small ISP point of presence. Router <b>PHC-PE1</b> connects two business customers through their own routers (CE routers, lesson 2): ENERGY on G0/0 (link 10.255.1.0/30) and SCHOOL on G0/1 (link 10.255.2.0/30). Both customers' LANs behind their CE routers are <b>192.168.1.0/24</b>. PHC-PE1 must reach both LANs.</p>
${K.steps([
  ["Spot the clash", "PHC-PE1 needs a route to 192.168.1.0/24 via ENERGY-CE (10.255.1.2) <i>and</i> a route to 192.168.1.0/24 via SCHOOL-CE (10.255.2.2). One table holds one best route per prefix, so one customer would lose."],
  ["Create the VRFs", "<code>vrf definition ENERGY</code> → <code>description Customer 1001 - oilfield services</code> → <code>address-family ipv4</code> → <code>exit-address-family</code> → <code>exit</code>. The same again for <code>SCHOOL</code>."],
  ["Assign and address the customer links", "<code>interface g0/0</code> → <code>vrf forwarding ENERGY</code> → <code>ip address 10.255.1.1 255.255.255.252</code>. <code>interface g0/1</code> → <code>vrf forwarding SCHOOL</code> → <code>ip address 10.255.2.1 255.255.255.252</code>."],
  ["Add one static route per VRF", "<code>ip route vrf ENERGY 192.168.1.0 255.255.255.0 10.255.1.2</code> and <code>ip route vrf SCHOOL 192.168.1.0 255.255.255.0 10.255.2.2</code>. Same prefix twice, each in its own table (the next section explains <code>ip route vrf</code> and <code>show ip route vrf ENERGY</code>, which shows one VRF's table)."],
  ["Verify the VRFs and their interfaces", "<code>show vrf</code> lists each VRF, its RD and protocols, and its interfaces; <code>show ip vrf interfaces</code> lists each VRF interface with its address and state."],
])}
${K.out(`PHC-PE1#show vrf
  Name                             Default RD            Protocols   Interfaces
  ENERGY                           <not set>             ipv4        Gi0/0
  SCHOOL                           <not set>             ipv4        Gi0/1
PHC-PE1#show ip vrf interfaces
Interface              IP-Address      VRF                              Protocol
Gi0/0                  10.255.1.1      ENERGY                           up
Gi0/1                  10.255.2.1      SCHOOL                           up`, "show vrf: Name, Default RD (not set, because VRF-Lite doesn't need one), Protocols (ipv4, from the address family) and Interfaces. show ip vrf interfaces adds each interface's address. The column names match real IOS; the spacing is the lab's.")}
<p>In the running-config the <code>vrf definition</code> blocks appear near the top, after the hostname, and inside each interface <code>vrf forwarding</code> comes before <code>ip address</code>, the order IOS needs.</p>
${K.tip(`Name VRFs after what they hold (GUEST, CCTV, CUST_1001), describe every VRF and VRF interface, and keep names identical on every device: Guest and GUEST are two different VRFs.`)}
<h3>Try it: give the CCTV cameras their own table</h3>
<p>Port Harcourt office router <b>PH-R1</b> has staff on G0/0 (10.60.10.0/24) and CCTV cameras on G0/1 (10.60.0.0/24), both global, so staff can route to the cameras. Security wants the cameras in VRF CCTV, with G0/2 as their link to the contractor's recording site (10.60.9.0/30; recorders on 10.60.50.0/24 behind 10.60.9.2).</p>
${K.term({env:"ios2", title:"PH-R1 — move the cameras into VRF CCTV", opts:{kind:"router", host:"PH-R1", model:"ISR 4331", motd:"PH-R1 — Port Harcourt office router (lab). Console session, no enable secret."},
  setup:env=>{ ["enable","configure terminal","hostname PH-R1","interface g0/0","description STAFF LAN","ip address 10.60.10.1 255.255.255.0","no shutdown","interface g0/1","description CCTV cameras","ip address 10.60.0.1 255.255.255.0","no shutdown","interface g0/2","description to security contractor (recording site)","no shutdown","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"A standalone router: nothing is cabled, so this terminal is for configuration and show commands (ping needs the benches below). Work in the order create, assign, re-address.",
  tasks:[
    {text:"<code>enable</code>, <code>configure terminal</code>, then create the VRF: <code>vrf definition CCTV</code>, a <code>description</code>, <code>address-family ipv4</code> and <code>exit-address-family</code>.", done:e=>!!(e.vrfs && e.vrfs.CCTV && e.vrfs.CCTV.af4 && e.vrfs.CCTV.style==="def")},
    {text:"<code>interface g0/1</code> and <code>vrf forwarding CCTV</code>. Read the message, then <code>do show ip interface brief</code>: what address does G0/1 have now?", done:e=>e.intfs["GigabitEthernet0/1"].vrf==="CCTV" && e.history.some(h=>/^\s*do\s+sh\S*\s+ip\s+int\S*\s+br/i.test(h))},
    {text:"Re-address the cameras' gateway: <code>ip address 10.60.0.1 255.255.255.0</code> on G0/1 (now inside CCTV).", done:e=>e.intfs["GigabitEthernet0/1"].vrf==="CCTV" && e.intfs["GigabitEthernet0/1"].ip==="10.60.0.1"},
    {text:"Put G0/2 in CCTV too, with <code>ip address 10.60.9.1 255.255.255.252</code>.", done:e=>e.intfs["GigabitEthernet0/2"].vrf==="CCTV" && e.intfs["GigabitEthernet0/2"].ip==="10.60.9.1"},
    {text:"Give CCTV a route to the recorders: <code>ip route vrf CCTV 10.60.50.0 255.255.255.0 10.60.9.2</code>.", done:e=>e.routes.some(r=>r.vrf==="CCTV" && r.net==="10.60.50.0" && r.mask==="255.255.255.0" && r.nh==="10.60.9.2") && e.rib("CCTV").some(x=>x.net==="10.60.50.0" && x.len===24)},
    {text:"<code>end</code>, then compare <code>show vrf</code>, <code>show ip route vrf CCTV</code> and the plain <code>show ip route</code>. Which table still has 10.60.10.0/24, and which has the cameras?", done:e=>e.mode==="priv" && e.history.some(h=>/^\s*sh\S*\s+vrf\s*$/i.test(h)) && e.history.some(h=>/^\s*sh\S*\s+ip\s+ro\S*\s+vrf\s+CCTV\s*$/.test(h)) && e.history.some(h=>/^\s*sh\S*\s+ip\s+ro\S*\s*$/i.test(h))},
    {text:"Save: <code>copy running-config startup-config</code> (press Enter to accept the file name).", done:e=>!!e.savedOnce},
  ],
  win:"The cameras now live in their own table. <code>show ip route</code> (global) holds only the staff LAN; <code>show ip route vrf CCTV</code> holds the cameras, the contractor link and the static to the recorders. A staff PC can no longer route to a camera, because the global table has no route to 10.60.0.0/24, and no ACL had to be written.",
  solve:["enable","configure terminal","vrf definition CCTV","description CCTV cameras and recorders","address-family ipv4","exit-address-family","exit","interface g0/1","vrf forwarding CCTV","do show ip interface brief","ip address 10.60.0.1 255.255.255.0","interface g0/2","vrf forwarding CCTV","ip address 10.60.9.1 255.255.255.252","exit","ip route vrf CCTV 10.60.50.0 255.255.255.0 10.60.9.2","end","show vrf","show ip route vrf CCTV","show ip route","copy running-config startup-config",""]})}
${K.hint(`Task 2: G0/1 shows <code>unassigned</code>: the address went with the move. Task 4: G0/2 had no address, so <code>vrf forwarding</code> prints nothing. Task 6: <code>show vrf</code> lists G0/1 and G0/2 under CCTV, one per line.`)}
${K.check({q:"An engineer types these lines on a live interface: ip address 10.9.9.1 255.255.255.0, then vrf forwarding GUEST. Users behind it lose connectivity. Why?", o:["GUEST needs a route distinguisher before it can carry traffic","vrf forwarding removed the address typed a moment earlier, so the interface is in GUEST with no IP address","The interface must be shut down before it can join a VRF","vrf forwarding only works on subinterfaces"], a:1, why:"Joining a VRF wipes the interface's IPv4 address. The order must be vrf forwarding first, then ip address. VRF-Lite needs no RD, no shutdown is needed, and physical interfaces, subinterfaces, SVIs and loopbacks can all join VRFs."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"Router KAN-R2's G0/3 (10.8.8.1/24) serves a lab network in the global table. It must move into a new VRF called LAB, with its users keeping the same gateway address. Put the commands in the right order (all from global configuration mode).", items:["vrf definition LAB","address-family ipv4","exit-address-family","interface g0/3","vrf forwarding LAB","ip address 10.8.8.1 255.255.255.0"], why:"1. What is asked? The order that leaves G0/3 in LAB with its address. 2. Which rule? Create, assign, re-address: the VRF and its IPv4 address family must exist before an interface can join it, and joining wipes the address. 3. Apply it: create LAB with IPv4, go to G0/3, join LAB (the old address is removed), then type the same address again."})}

<h2>Routing inside a VRF: statics, OSPF, ping and traceroute</h2>
${K.remember(`<b>The rule:</b> every command that touches a routing table has to <b>name the table</b>. <code>ip route vrf</code>, <code>router ospf N vrf NAME</code>, <code>show ip route vrf</code>, <code>ping vrf</code>, <code>traceroute vrf</code>, <code>show ip arp vrf</code>. Leave out <code>vrf NAME</code> and the command works on the <b>global table</b>, which is the most common VRF mistake there is.`)}
<h3>Connected routes, and reading a VRF's table</h3>
<p>Connected and local routes appear in the VRF's table automatically. <code>show ip route vrf NAME</code> shows that table: Module 5's layout with a <code>Routing Table: NAME</code> heading on top.</p>
${K.out(`PHC-PE1#show ip route vrf ENERGY

Routing Table: ENERGY
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       ...
Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C        10.255.1.0/30 is directly connected, GigabitEthernet0/0
L        10.255.1.1/32 is directly connected, GigabitEthernet0/0
S     192.168.1.0/24 [1/0] via 10.255.1.2
PHC-PE1#show ip route vrf SCHOOL static

Routing Table: SCHOOL
...
Gateway of last resort is not set

S     192.168.1.0/24 [1/0] via 10.255.2.2
PHC-PE1#show ip route
...
Gateway of last resort is not set`, "Same prefix, 192.168.1.0/24, in two tables with two different next hops. The global table is empty: every PHC-PE1 interface is in a VRF. The code legend is shortened here (...); the lab prints it in full.")}
<p>Filters work as before: <code>static</code>, <code>connected</code>, <code>ospf</code> or an address after the VRF name.</p>
<h3>Static routes in a VRF, and the global-table trap</h3>
<p><code>ip route vrf NAME NETWORK MASK NEXT-HOP</code> is Module 5's static route with the table named; the next hop is resolved <b>in that VRF</b>. A guest default route:</p>
${K.out(`ip route vrf GUEST 0.0.0.0 0.0.0.0 10.255.0.2`, "A default route that exists only in GUEST's table: guests follow it; staff in the global table never see it.")}
<p>Now the trap: the old habit, <code>ip route 0.0.0.0 0.0.0.0 10.255.0.2</code>, without <code>vrf GUEST</code>. That route belongs to the <b>global</b> table, which can't reach 10.255.0.2 (that subnet is connected only in GUEST), so it is <b>installed nowhere</b>. The line sits in the running-config looking correct; neither table has a default.</p>
${K.mistake(`Checking the running-config instead of the table. <code>show running-config | include ip route</code> tells you what was typed; <code>show ip route vrf NAME</code> tells you what the router will use. When they disagree, look for a missing <code>vrf</code> keyword or a next hop that isn't reachable in the route's own table.`)}
<h3>OSPF per VRF</h3>
<p>Each VRF needs its own OSPF process with its own process ID: <code>router ospf 90 vrf GUEST</code>. Its <code>network</code> statements match only GUEST's interfaces; the global <code>router ospf 1</code> matches only global ones, however wide its wildcard. Each process is a separate OSPF router with its own neighbours, database and router ID (picked from its own VRF's interfaces).</p>
<p>Example: Abuja campus router <b>ABJ-DIST1</b>. Staff (VLAN 10, 10.10.10.0/24) and the link to ABJ-CORE are global, OSPF 1. Guests (VLAN 90, 172.20.90.0/24) and the link to GUEST-EDGE (the guest internet router, which advertises a default) are in GUEST, OSPF 90:</p>
${K.out(`router ospf 1
 network 10.0.0.0 0.255.255.255 area 0
router ospf 90 vrf GUEST
 network 10.99.0.0 0.0.255.255 area 0
 network 172.20.90.0 0.0.0.255 area 0`, "Two processes on one router. The guest link 10.99.1.0/30 matches process 1's network statement too, but process 1 only looks at global interfaces.")}
${K.out(`ABJ-DIST1#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0               10.1.0.1/30        1     DR    1/1
Gi0/2.10     1     0               10.10.10.1/24      1     DR    0/0
Lo0          1     0               10.0.0.11/32       1     LOOP  0/0
Gi0/1        90    0               10.99.1.1/30       1     BDR   1/1
Gi0/2.90     90    0               172.20.90.1/24     1     DR    0/0
Lo1          90    0               10.99.0.11/32      1     LOOP  0/0
ABJ-DIST1#show ip route vrf GUEST ospf

Routing Table: GUEST
...
Gateway of last resort is 10.99.1.2 to network 0.0.0.0

O*E2  0.0.0.0/0 [110/1] via 10.99.1.2, 00:12:12, GigabitEthernet0/1
      10.0.0.0/8 is variably subnetted, 4 subnets, 2 masks
O        10.99.0.99/32 [110/2] via 10.99.1.2, 00:36:06, GigabitEthernet0/1`, "show ip ospf interface brief shows which process (PID) owns each interface; show ip ospf neighbor (not shown) lists both processes' neighbours in one table. Only GUEST's table has the default from GUEST-EDGE. Output as the lab prints it; real IOS uses the same columns.")}
${K.svg("0 0 720 250",
  K.box(20,30,190,60,"1. Packet arrives","on GigabitEthernet0/1")+K.box(265,30,190,60,"2. Find the VRF","Gi0/1 is in TENANT-B",true)+K.box(510,30,190,60,"3. Look up the address","in TENANT-B's table only",true)+
  K.arrow(210,60,263,60,"")+K.arrow(455,60,508,60,"")+
  K.arrow(580,90,420,148,"")+K.arrow(630,90,630,148,"")+
  K.box(330,150,180,56,"Route found","forward out a TENANT-B port")+K.box(530,150,180,56,"No route","drop + ICMP unreachable")+
  K.txt(20,170,"Same for the router's",{f:"body",s:11})+K.txt(20,186,"own pings: ping uses",{f:"body",s:11})+K.txt(20,202,"global, ping vrf B uses B",{f:"body",s:11})+
  K.txt(360,238,"The global table and the other VRFs are never consulted: that is the isolation.",{mid:true,f:"body",s:11}),
  "How a router with VRFs decides: the incoming interface picks the table, and only that table is searched (longest match, as in Module 5). ARP for the next hop also happens in that VRF.")}
<h3>Testing from the router: ping vrf, traceroute vrf, show ip arp vrf</h3>
<p>A ping typed on the router has no incoming interface to pick a table from, so a plain <code>ping</code> uses the <b>global</b> table. To test inside a VRF, name it:</p>
${K.out(`PHC-PE1#ping 192.168.1.20
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.1.20, timeout is 2 seconds:
.....
Success rate is 0 percent (0/5)
PHC-PE1#ping vrf SCHOOL 192.168.1.20
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.1.20, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/1/3 ms`, "Lab output. The plain ping fails: the global table has no route to 192.168.1.0/24. ping vrf SCHOOL succeeds; the first dot is the echo lost while ARP resolves the next hop, as in Module 5, and a second try gives 100 percent. ping vrf ENERGY 192.168.1.20 would reach a different PC with the same address.")}
<p>The other tools follow the same pattern:</p>
<ul>
<li><code>ping vrf NAME IP source INTERFACE</code>: the source must be an interface (or address) in that same VRF.</li>
<li><code>traceroute vrf NAME IP</code>: the same traceroute, in the named table.</li>
<li><code>show ip arp vrf NAME</code>: that VRF's ARP table only. Plain <code>show ip arp</code> shows the global one.</li>
<li><code>show ip protocols vrf NAME</code>: the routing process of that VRF.</li>
</ul>
${K.dyk(`Every IOS traceroute since Module 5 has printed a line you could ignore: <code>VRF info: (vrf in name/id, vrf out name/id)</code>. IOS was always ready to tell you which table a trace used; now you know why that line is there.`)}
${K.exam(`Reading VRF questions: before you judge any exhibit, look for the word <b>vrf</b> in every command shown. Without it, <code>show ip route</code> and <code>ping</code> show the global table only, so &ldquo;the route is missing&rdquo; or &ldquo;the router can't reach the host&rdquo; may be the wrong conclusion. Then ask which table each interface in the question belongs to. Trap answers suggest adding ACLs or NAT to fix what is really a missing <code>vrf</code> keyword.`)}
${K.check({q:"On a router, G0/2 is in VRF GUEST and connected to 10.99.1.0/30. The engineer types ip route 0.0.0.0 0.0.0.0 10.99.1.2. What happens?", o:["The default route is installed in GUEST, because the next hop is on a GUEST interface","The route is added to the global table but not installed, because the global table can't reach 10.99.1.2; GUEST still has no default","The route is installed in every table","IOS rejects the command with a syntax error"], a:1, why:"A plain ip route is a global-table route, and its next hop is resolved in the global table, where 10.99.1.0/30 doesn't exist. It stays in the running-config but isn't installed. The fix is ip route vrf GUEST 0.0.0.0 0.0.0.0 10.99.1.2."})}

<h3>Hands-on: two tenants, one router, the same addresses</h3>
<p>A Victoria Island (Lagos) office building runs one router for its tenants: an accounting firm (A) and, from Monday, a clinic (B). Both use <b>10.0.0.0/24</b> for users and <b>10.0.9.0/24</b> for servers.</p>
${K.bench({id:"m10-tenants", points:110, from:"CCNA · Module 10 · lesson 6", title:"Victoria Island building: two tenants with identical addressing on BLDG-R1", viewBox:"0 0 880 480", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Tenant B moves in Monday with tenant A's addressing (gateways .1). Users are patched to BLDG-R1 G0/1, the server to VLAN 60 (subinterface G0/2.60 exists). Make both work without renumbering anyone.&rdquo; Tenant A runs in the global table today (G0/0, G0/2.50). Console in from NOC-LAPTOP; BLDG-SW1 is correct, leave it alone.",
  devices:[
    {id:"r", kind:"router", label:"BLDG-R1", model:"ISR 4331", x:330, y:20, config:e=>{ ["en","conf t","hostname BLDG-R1","int g0/0","description Tenant A users","ip address 10.0.0.1 255.255.255.0","no shut","int g0/1","description Tenant B users","no shut","int g0/2","description trunk to BLDG-SW1","no shut",
      "int g0/2.50","description Tenant A servers","encapsulation dot1Q 50","ip address 10.0.9.1 255.255.255.0","int g0/2.60","description Tenant B servers","encapsulation dot1Q 60","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"BLDG-SW1", model:"Catalyst 9200", x:420, y:200, config:e=>{ ["en","conf t","hostname BLDG-SW1","vlan 50","name TENANT-A-SRV","vlan 60","name TENANT-B-SRV","exit","int g0/1","description trunk to BLDG-R1","switchport mode trunk","int g0/2","switchport mode access","switchport access vlan 50","int g0/3","switchport mode access","switchport access vlan 60","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"NOC-LAPTOP", x:700, y:10},
    {id:"apc", kind:"pc", label:"A-PC1", x:40, y:220, ip:"10.0.0.10", mask:"255.255.255.0", gw:"10.0.0.1"},
    {id:"bpc", kind:"pc", label:"B-PC1", x:190, y:220, ip:"10.0.0.10", mask:"255.255.255.0", gw:"10.0.0.1"},
    {id:"asrv", kind:"server", label:"A-SRV", x:480, y:360, ip:"10.0.9.10", mask:"255.255.255.0", gw:"10.0.9.1"},
    {id:"bsrv", kind:"server", label:"B-SRV", x:680, y:360, ip:"10.0.9.10", mask:"255.255.255.0", gw:"10.0.9.1"},
  ],
  cables:[ {type:"cat6", a:"apc:eth", b:"r:g0"}, {type:"cat6", a:"bpc:eth", b:"r:g1"}, {type:"cat6", a:"r:g2", b:"sw:g1"}, {type:"cat6", a:"asrv:eth", b:"sw:g2"}, {type:"cat6", a:"bsrv:eth", b:"sw:g3"}, {type:"console", a:"lap:usb", b:"r:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"Baseline: from A-PC1's <b>Command Prompt</b>, <code>ping 10.0.9.10</code> (A-SRV: it works today). From B-PC1, the same <code>ping 10.0.9.10</code>: why does B-PC1 itself report the failure?", done:B=>Bench.pinged(B,"apc","10.0.9.10") && Bench.tried(B,"bpc",/^\s*ping\s+10\.0\.9\.10\b/)},
    {text:"Try the old way first: console in from NOC-LAPTOP, <code>enable</code>, <code>configure terminal</code>, <code>interface g0/1</code>, <code>ip address 10.0.0.1 255.255.255.0</code>. Read IOS's reply: which interface does it say this overlaps with, and why?", done:B=>B.devs.r.env.history.some(h=>/^\s*ip\s+add\S*\s+10\.0\.0\.1\s+255\.255\.255\.0/i.test(h))},
    {text:"Create both VRFs: <code>vrf definition TENANT-A</code> and <code>vrf definition TENANT-B</code>, each with <code>address-family ipv4</code> and <code>exit-address-family</code>.", done:B=>{ const v=B.devs.r.env.vrfs||{}; return !!(v["TENANT-A"] && v["TENANT-A"].af4 && v["TENANT-B"] && v["TENANT-B"].af4); }},
    {text:"Move tenant A into TENANT-A: <code>vrf forwarding TENANT-A</code> on G0/0 and on G0/2.50, re-entering 10.0.0.1/24 and 10.0.9.1/24 after each (tenant A is offline for those seconds; at work this is a maintenance-window change).", done:B=>Bench.vrfOf(B,"r","GigabitEthernet0/0")==="TENANT-A" && Bench.vrfOf(B,"r","GigabitEthernet0/2.50")==="TENANT-A" && !!Bench.vrfRoute(B,"r","TENANT-A","10.0.0.0/24","C") && !!Bench.vrfRoute(B,"r","TENANT-A","10.0.9.0/24","C")},
    {text:"Put tenant B in TENANT-B: G0/1 and G0/2.60 with the <b>same</b> addresses, 10.0.0.1/24 and 10.0.9.1/24. This time IOS accepts them: why?", done:B=>Bench.vrfOf(B,"r","GigabitEthernet0/1")==="TENANT-B" && Bench.vrfOf(B,"r","GigabitEthernet0/2.60")==="TENANT-B" && !!Bench.vrfRoute(B,"r","TENANT-B","10.0.0.0/24","C") && !!Bench.vrfRoute(B,"r","TENANT-B","10.0.9.0/24","C")},
    {text:"Both tenants work: A-PC1 and B-PC1 each <code>ping 10.0.9.10</code> and get replies. Then on BLDG-R1 compare <code>show ip arp vrf TENANT-A</code> with <code>show ip arp vrf TENANT-B</code>: same IP address 10.0.9.10, two different MAC addresses.", done:B=>Bench.vrfOf(B,"r","GigabitEthernet0/1")==="TENANT-B" && Bench.vrfOf(B,"r","GigabitEthernet0/0")==="TENANT-A" && Bench.pingedNow(B,"apc","10.0.9.10") && Bench.pingedNow(B,"bpc","10.0.9.10") && Bench.arpHas(B,"r","10.0.9.10%TENANT-A") && Bench.arpHas(B,"r","10.0.9.10%TENANT-B") && B.devs.r.env.history.some(h=>/^\s*sh\S*\s+ip\s+arp\s+vrf\s/i.test(h))},
    {text:"Read the tables: <code>show vrf</code>, <code>show ip route vrf TENANT-A</code>, <code>show ip route vrf TENANT-B</code> and the plain <code>show ip route</code>. What is left in the global table?", done:B=>{ const h=B.devs.r.env.history; return h.some(x=>/^\s*sh\S*\s+vrf\s*$/i.test(x)) && h.some(x=>/^\s*sh\S*\s+ip\s+ro\S*\s+vrf\s+TENANT-A\s*$/.test(x)) && h.some(x=>/^\s*sh\S*\s+ip\s+ro\S*\s+vrf\s+TENANT-B\s*$/.test(x)) && h.some(x=>/^\s*sh\S*\s+ip\s+ro\S*\s*$/i.test(x)); }},
    {text:"Test from the router itself: <code>ping 10.0.9.10</code> (which table does it use?), then <code>ping vrf TENANT-B 10.0.9.10</code>.", done:B=>Bench.vrfPinged(B,"r","TENANT-B","10.0.9.10") && B.devs.r.env.history.some(h=>/^\s*ping\s+10\.0\.9\.10\s*$/i.test(h))},
  ],
  win:"Two tenants, identical addressing, one router. IOS refused 10.0.0.1/24 on G0/1 while both interfaces shared the global table, and accepted it once each sat in its own VRF: overlap is only checked inside one table. Each tenant's ping was routed in its own table and answered by its own server; <code>show ip arp vrf</code> proved it with two MACs for one IP. The global table is now empty, which is why BLDG-R1's plain <code>ping 10.0.9.10</code> failed and <code>ping vrf TENANT-B</code> worked.",
  solve:[["pc","apc","ping 10.0.9.10"],["pc","bpc","ping 10.0.9.10"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","enable"],["term","configure terminal"],["term","interface g0/1"],["term","ip address 10.0.0.1 255.255.255.0"],["term","exit"],
    ["term","vrf definition TENANT-A"],["term","address-family ipv4"],["term","exit-address-family"],["term","exit"],["term","vrf definition TENANT-B"],["term","address-family ipv4"],["term","exit-address-family"],["term","exit"],
    ["term","interface g0/0"],["term","vrf forwarding TENANT-A"],["term","ip address 10.0.0.1 255.255.255.0"],["term","interface g0/2.50"],["term","vrf forwarding TENANT-A"],["term","ip address 10.0.9.1 255.255.255.0"],
    ["term","interface g0/1"],["term","vrf forwarding TENANT-B"],["term","ip address 10.0.0.1 255.255.255.0"],["term","interface g0/2.60"],["term","vrf forwarding TENANT-B"],["term","ip address 10.0.9.1 255.255.255.0"],["term","end"],
    ["pc","apc","ping 10.0.9.10"],["pc","bpc","ping 10.0.9.10"],["term","show ip arp vrf TENANT-A"],["term","show ip arp vrf TENANT-B"],
    ["term","show vrf"],["term","show ip route vrf TENANT-A"],["term","show ip route vrf TENANT-B"],["term","show ip route"],["term","ping 10.0.9.10"],["term","ping vrf TENANT-B 10.0.9.10"]]})}
${K.hint(`Task 1: B-PC1's gateway, 10.0.0.1 on G0/1, has no address yet, so ARP for it gets no answer and Windows reports &ldquo;Destination host unreachable&rdquo; from B-PC1's own address. Task 2: the lab replies <code>% 10.0.0.0 overlaps with GigabitEthernet0/0</code>: both interfaces are still in the global table. Task 8: the plain ping uses the global table, which is now empty.`)}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A Kano university Layer 3 switch has VLAN 20 (lecturers, global table) and VLAN 30 (students, VRF STUDENT). A static default for students exists: ip route vrf STUDENT 0.0.0.0 0.0.0.0 172.31.0.2. From the switch, ping 172.31.0.2 fails, but students browse the internet fine. Which two statements are true? (Choose two.)", o:["The plain ping used the global table, where 172.31.0.2 isn't reachable","ping vrf STUDENT 172.31.0.2 is the right test from the switch","The student default route must be broken, because the switch can't ping its next hop","Lecturers can reach the internet through the STUDENT default route","The switch needs an ACL to let its own pings into the VRF"], a:[0,1], why:"1. What is asked? Why the switch's own ping fails while students work. 2. Which rule? A router's own ping uses the global table unless you name the VRF; routes in a VRF serve only that VRF's interfaces. 3. Apply it: 172.31.0.2 is reachable only in STUDENT, so the plain ping fails and ping vrf STUDENT succeeds. The default is fine (students prove it), lecturers in the global table never see the STUDENT default, and no ACL is involved."})}

<h2>Troubleshooting: when a VRF route goes missing</h2>
${K.remember(`<b>The rule:</b> a VRF problem is almost always <b>something in the wrong table</b>. Ask four questions, in order. <b>1.</b> Which table is each interface in? (<code>show ip vrf interfaces</code>.) <b>2.</b> Is the route in <i>that</i> table? (<code>show ip route vrf NAME</code>.) <b>3.</b> If not, where did its static or OSPF network go? (running-config, <code>show ip ospf interface brief</code>.) <b>4.</b> Test in the right table (<code>ping vrf NAME … source …</code>).`)}
<p>Three faults cover almost every case:</p>
<ul>
<li><b>An interface in the wrong table</b> (never moved, or moved into the wrong VRF): its hosts reach what they shouldn't and miss what they should. <code>show ip vrf interfaces</code> lists only VRF members, so a missing line is the answer; <code>unassigned</code> in <code>show ip interface brief</code> means the address was lost in a move.</li>
<li><b>A static in the wrong table</b> (<code>ip route</code> without <code>vrf</code>, or the wrong VRF named): often not even installed.</li>
<li><b>OSPF in the wrong process</b> (a <code>network</code> statement under the global process for a VRF interface): the subnet is never advertised to that VRF's neighbours.</li>
</ul>
${K.mistake(`Fixing a VRF problem by &ldquo;leaking&rdquo; routes between tables or adding the subnet to the global table &ldquo;so it works&rdquo;. That turns a configuration slip into a hole in the separation the VRF was built for. Put the interface, static or network statement in the table it belongs to.`)}
${K.job("Ikeja branch — &ldquo;the two new ATMs can't reach the card processor&rdquo;", `
<p><b>The ticket:</b> &ldquo;We installed two ATMs in the new banking hall at the Ikeja branch yesterday, VLAN 40, 10.30.40.0/24. They can't reach the card processor at head office. The four ATMs on VLAN 30 work. The change ticket says the network side is done.&rdquo;</p>
<p><b>What you know:</b> ATMs live in VRF ATM on every branch router (OSPF 30 to HQ-ATM, in front of the card processor); staff are global (OSPF 1).</p>
<ol>
<li><b>Question 1, which table?</b> On IKJ-BR1, <code>show ip vrf interfaces</code> lists Gi0/1 (WAN ATM link), Gi0/2.30 and Gi0/2.40 in ATM. The new subinterface is in the right VRF, with 10.30.40.1.</li>
<li><b>Question 2, is the route there?</b> On the branch, <code>show ip route vrf ATM connected</code> shows <code>C 10.30.40.0/24 … GigabitEthernet0/2.40</code>. But replies need a route back: on HQ-ATM, <code>show ip route ospf</code> has 10.30.30.0/24 and <b>no</b> 10.30.40.0/24. The branch isn't advertising it.</li>
<li><b>Question 3, where did OSPF go?</b>
${K.out(`IKJ-BR1#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0               10.1.8.2/30        1     DR    1/1
Gi0/2.10     1     0               10.18.10.1/24      1     DR    0/0
Gi0/1        30    0               10.31.8.2/30       1     DR    1/1
Gi0/2.30     30    0               10.30.30.1/24      1     DR    0/0
IKJ-BR1#show running-config | section router ospf
router ospf 1
 network 10.1.8.0 0.0.0.3 area 0
 network 10.18.10.0 0.0.0.255 area 0
 network 10.30.40.0 0.0.0.255 area 0
router ospf 30 vrf ATM
 network 10.31.8.0 0.0.0.3 area 0
 network 10.30.30.0 0.0.0.255 area 0`, "Gi0/2.40 isn't in any OSPF process. Its network statement was typed under router ospf 1, the global process, which ignores VRF interfaces. (Lab output.)")}
</li>
<li><b>The fix:</b> <code>router ospf 1</code> → <code>no network 10.30.40.0 0.0.0.255 area 0</code>; <code>router ospf 30 vrf ATM</code> (plain <code>router ospf 30</code> also re-enters it) → <code>network 10.30.40.0 0.0.0.255 area 0</code>.</li>
<li><b>Verify:</b> <code>show ip ospf interface brief</code> now lists Gi0/2.40 under PID 30; HQ-ATM's table shows <code>O 10.30.40.0/24 [110/2] via 10.31.8.2</code>; from the branch, <code>ping vrf ATM</code> to the processor <b>with <code>source g0/2.40</code></b> succeeds. A ping without the source would leave from the WAN link and prove nothing about the new subnet.</li>
</ol>
<p><b>What you tell the branch:</b> &ldquo;The new ATM network was set up but not announced to head office, so the processor didn't know the way back. Fixed at 14:20; please run a test transaction on both ATMs.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;IKJ-BR1: network 10.30.40.0/24 was under router ospf 1 (global); Gi0/2.40 is in VRF ATM. Moved to router ospf 30 vrf ATM. HQ-ATM now learns 10.30.40.0/24; ping vrf ATM from Gi0/2.40 OK. Suggest the branch template carry the ATM network lines under the VRF process.&rdquo;</p>`)}
<h3>Hands-on: the guest network ticket</h3>
<p>A Kano hotel keeps guest Wi-Fi in VRF GUEST, with its own exit through GUEST-FW; staff are global. On Monday a contractor added a guest network for the new event hall.</p>
${K.bench({id:"m10-guest-vrf", points:120, from:"CCNA · Module 10 · lesson 6", title:"Kano hotel: guests offline, and the event hall can see the staff server", viewBox:"0 0 840 490", openLog:true,
  intro:"<b>Ticket 1 (front desk):</b> &ldquo;Lobby guests (VLAN 20) can't get online since Monday.&rdquo; <b>Ticket 2 (security):</b> &ldquo;A laptop on the event-hall guest network (VLAN 30) reached the staff file server, 10.20.10.50. Guests must never reach staff systems.&rdquo; The design: VLAN 10 STAFF global; VLANs 20, 30 and G0/1 to GUEST-FW (10.255.0.0/30) in GUEST, with a default to 10.255.0.2. 198.51.100.80 stands for the internet; GUEST-FW is a router standing in for the guest firewall (which would also do NAT). Guests use static addresses (the lab's DHCP is global-only). Fix KAN-R1 only, from NOC-LAPTOP.",
  devices:[
    {id:"r", kind:"router", label:"KAN-R1", model:"ISR 4321", x:200, y:20, config:e=>{ ["en","conf t","hostname KAN-R1","vrf definition GUEST","description Guest Wi-Fi - internet only","address-family ipv4","exit-address-family","exit",
      "int g0/0","description trunk to KAN-SW1","no shut","int g0/0.10","description STAFF","encapsulation dot1Q 10","ip address 10.20.10.1 255.255.255.0",
      "int g0/0.20","description GUEST-LOBBY","encapsulation dot1Q 20","vrf forwarding GUEST","ip address 192.168.20.1 255.255.255.0",
      "int g0/0.30","description GUEST-HALL (added Monday)","encapsulation dot1Q 30","ip address 192.168.30.1 255.255.255.0",
      "int g0/1","description to GUEST-FW (guest internet)","vrf forwarding GUEST","ip address 10.255.0.1 255.255.255.252","no shut","exit",
      "ip route 0.0.0.0 0.0.0.0 10.255.0.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"fw", kind:"router", label:"GUEST-FW", model:"guest firewall (lab stand-in)", x:600, y:20, config:e=>{ ["en","conf t","hostname GUEST-FW","int g0/1","ip address 10.255.0.2 255.255.255.252","no shut","int lo0","description internet test address","ip address 198.51.100.80 255.255.255.255","exit","ip route 192.168.20.0 255.255.255.0 10.255.0.1","ip route 192.168.30.0 255.255.255.0 10.255.0.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"KAN-SW1", model:"Catalyst 9200", x:200, y:200, config:e=>{ ["en","conf t","hostname KAN-SW1","vlan 10","name STAFF","vlan 20","name GUEST-LOBBY","vlan 30","name GUEST-HALL","exit","int g0/1","description trunk to KAN-R1","switchport mode trunk","int g0/2","switchport mode access","switchport access vlan 10","int g0/3","switchport mode access","switchport access vlan 20","int g0/4","switchport mode access","switchport access vlan 30","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"NOC-LAPTOP", x:20, y:10},
    {id:"srv", kind:"server", label:"STAFF-SRV", x:160, y:370, ip:"10.20.10.50", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"lobby", kind:"laptop", label:"LOBBY-PC", x:380, y:370, ip:"192.168.20.25", mask:"255.255.255.0", gw:"192.168.20.1"},
    {id:"hall", kind:"laptop", label:"HALL-PC", x:600, y:370, ip:"192.168.30.40", mask:"255.255.255.0", gw:"192.168.30.1"},
  ],
  cables:[ {type:"cat6", a:"r:g0", b:"sw:g1"}, {type:"cat6", a:"r:g1", b:"fw:g1"}, {type:"cat6", a:"srv:eth", b:"sw:g2"}, {type:"cat6", a:"lobby:eth", b:"sw:g3"}, {type:"cat6", a:"hall:eth", b:"sw:g4"}, {type:"console", a:"lap:usb", b:"r:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"Reproduce both tickets: from LOBBY-PC <code>ping 198.51.100.80</code>, and from HALL-PC <code>ping 10.20.10.50</code>. Which device answers each one?", done:B=>Bench.tried(B,"lobby",/^\s*ping\s+198\.51\.100\.80\b/) && Bench.tried(B,"hall",/^\s*ping\s+10\.20\.10\.50\b/)},
    {text:"Diagnose before changing anything: console in, <code>enable</code>, then <code>show ip vrf interfaces</code>, <code>show ip route vrf GUEST</code>, <code>show ip route</code> and <code>show running-config | include ip route</code>. Which interface is missing from GUEST, and where did the default route go?", done:B=>{ const h=B.devs.r.env.history; return h.some(x=>/^\s*sh\S*\s+(ip\s+vrf(\s+int\S*)?|vrf)\s*$/i.test(x)) && h.some(x=>/^\s*sh\S*\s+ip\s+ro\S*\s+vrf\s+GUEST\s*$/.test(x)) && h.some(x=>/^\s*sh\S*\s+run\S*/i.test(x)); }},
    {text:"Fix 1: put the event-hall subinterface G0/0.30 into GUEST and restore its gateway address, 192.168.30.1/24.", done:B=>Bench.vrfOf(B,"r","GigabitEthernet0/0.30")==="GUEST" && B.devs.r.env.intfs["GigabitEthernet0/0.30"].ip==="192.168.30.1"},
    {text:"Fix 2: remove the useless global default (<code>no ip route 0.0.0.0 0.0.0.0 10.255.0.2</code>) and add it to the right table with <code>ip route vrf</code>. Check it with <code>show ip route vrf GUEST static</code>.", done:B=>!!Bench.vrfRoute(B,"r","GUEST","0.0.0.0/0","S*") && !B.devs.r.env.routes.some(x=>!x.vrf && x.net==="0.0.0.0")},
    {text:"Verify the guests: LOBBY-PC and HALL-PC both <code>ping 198.51.100.80</code> successfully, and HALL-PC's <code>ping 10.20.10.50</code> now fails. Who answers that failed ping now, and why there?", done:B=>Bench.vrfOf(B,"r","GigabitEthernet0/0.30")==="GUEST" && !!Bench.vrfRoute(B,"r","GUEST","0.0.0.0/0","S*") && Bench.pinged(B,"lobby","198.51.100.80") && Bench.pinged(B,"hall","198.51.100.80") && Bench.blocked(B,"hall","10.20.10.50")},
    {text:"Prove staff are untouched and test like an engineer: from STAFF-SRV <code>ping 10.20.10.1</code>, and on KAN-R1 <code>ping vrf GUEST 198.51.100.80</code>.", done:B=>Bench.pingedNow(B,"srv","10.20.10.1") && Bench.vrfPinged(B,"r","GUEST","198.51.100.80")},
  ],
  win:"Two faults, both &ldquo;something in the wrong table&rdquo;. G0/0.30 had been left in the global table, next to the staff VLAN, so the event hall routed straight to the staff server; moving it into GUEST (and re-entering its address) put it in a table with no route to staff. The default route had been typed without <code>vrf GUEST</code>, so it landed in the global table, where its next hop wasn't reachable, and was never installed anywhere. Now a hall guest's ping to the staff server follows GUEST's default to GUEST-FW, which has no route either and answers &ldquo;unreachable&rdquo;; a real guest firewall would drop it by policy as well. Security's question is answered by routing, not by an ACL that someone might edit.",
  solve:[["pc","lobby","ping 198.51.100.80"],["pc","hall","ping 10.20.10.50"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term","enable"],
    ["term","show ip vrf interfaces"],["term","show ip route vrf GUEST"],["term","show ip route"],["term","show running-config | include ip route"],
    ["term","configure terminal"],["term","interface g0/0.30"],["term","vrf forwarding GUEST"],["term","ip address 192.168.30.1 255.255.255.0"],["term","exit"],
    ["term","no ip route 0.0.0.0 0.0.0.0 10.255.0.2"],["term","ip route vrf GUEST 0.0.0.0 0.0.0.0 10.255.0.2"],["term","end"],["term","show ip route vrf GUEST static"],
    ["pc","lobby","ping 198.51.100.80"],["pc","hall","ping 198.51.100.80"],["pc","hall","ping 10.20.10.50"],["pc","srv","ping 10.20.10.1"],["term","ping vrf GUEST 198.51.100.80"]]})}
${K.hint(`Task 1: the lobby ping is answered by its gateway, 192.168.20.1 (&ldquo;Destination host unreachable&rdquo;: GUEST has no default). The hall ping is answered by the staff server itself. Task 2: <code>show ip vrf interfaces</code> lists Gi0/0.20 and Gi0/1 only; <code>show ip route</code> (global) contains 192.168.30.0/24 next to 10.20.10.0/24; the running-config has <code>ip route 0.0.0.0 0.0.0.0 10.255.0.2</code> but neither table has a default. Task 5: the answer now comes from 10.255.0.2.`)}
${K.check({q:"After an upgrade, users on a router's G0/2.70 (meant to be in VRF CCTV) can reach the staff VLAN, and the CCTV recorder can't reach them. show ip vrf interfaces doesn't list Gi0/2.70. What is the most likely cause and fix?", o:["The CCTV VRF has lost its route distinguisher; add rd 65000:70","G0/2.70 is still in the global table; add vrf forwarding CCTV to it and re-enter its IP address","The trunk to the switch doesn't allow VLAN 70","OSPF process for CCTV must be restarted"], a:1, why:"show ip vrf interfaces lists only VRF members, so a missing line means the interface is in the global table, where staff routes live and CCTV routes don't. Move it into CCTV and re-enter the address. VRF-Lite needs no RD; a trunk problem would stop the users reaching anything at all."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"An Abuja L3 switch has its payment-terminal VLAN in VRF PCI. The terminals can't reach their processor at 172.16.200.5, which sits behind the VRF PCI next hop 10.250.0.2. The running-config shows: ip route 172.16.200.0 255.255.255.0 10.250.0.2. Type the command that installs the route in the right table (keep the same prefix and next hop).", fields:[{label:"Command", a:["ip route vrf PCI 172.16.200.0 255.255.255.0 10.250.0.2"], ios:true}], why:"1. What is asked? A static route that the PCI VRF will use. 2. Which rule? Every routing command names its table; a plain ip route belongs to the global table, and its next hop (reachable only in PCI) can't be resolved there, so it isn't installed. 3. Apply it: ip route vrf PCI 172.16.200.0 255.255.255.0 10.250.0.2, then remove the useless global line with no ip route 172.16.200.0 255.255.255.0 10.250.0.2, and test with ping vrf PCI 172.16.200.5."})}

<h2>Designing with VRFs: where they fit and where they stop</h2>
${K.remember(`<b>The rule:</b> a VRF separates routing <b>on one device</b>. Separation across a network needs every device on the path to keep the same VRFs and every link to carry them separately (VRF-Lite), or a technology that carries them for you (MPLS Layer 3 VPN). And separation is the point: traffic <b>between</b> VRFs should pass through something that decides, usually a firewall.`)}
<h3>VRF-Lite across several devices</h3>
<p>If guests cross three routers to reach their exit, each router needs a GUEST VRF and each link a separate path per VRF: usually one 802.1Q subinterface per VRF (Module 4's router-on-a-stick idea), plus routing per VRF on every router.</p>
${K.svg("0 0 760 300",
  K.dev("pc",70,50,"STAFF-PC","")+K.dev("pc",70,170,"GUEST-PC","")+K.dev("pc",690,50,"STAFF-SRV","")+K.dev("pc",690,170,"GUEST-WEB","")+
  K.dev("router",230,100,"HQ-R1","")+K.dev("router",530,100,"BR-R2","")+
  K.link(88,50,206,92)+K.link(88,170,206,108)+K.link(672,50,554,92)+K.link(672,170,554,108)+
  K.link(254,90,506,90)+K.link(254,112,506,112,"",true)+
  K.txt(380,82,"Gi0/2.10 — global — OSPF 1",{mid:true,s:10})+K.txt(380,130,"Gi0/2.20 — VRF GUEST — OSPF 20",{mid:true,c:"accent",s:10})+
  K.band(20,222,720,26,"Every link carries one subinterface per VRF; every router runs one routing process per VRF")+
  K.txt(380,282,"MPLS L3VPN (lesson 2) avoids this: VRFs only on the PEs, labels and MP-BGP across the core",{mid:true,f:"body",s:11}),
  "VRF-Lite end to end: two VRFs (global and GUEST) between two routers need two subinterfaces on the link and two OSPF processes on each router. With 5 VRFs and 10 routers, that is 5 subinterfaces per link and 5 processes per router.")}
<p>Fine for a campus with a guest and a CCTV VRF; hopeless for a provider with hundreds of customers. Hence MPLS Layer 3 VPNs: VRFs only on the PEs, a core that forwards on labels, and MP-BGP carrying every VRF's routes, kept apart by route distinguishers (lesson 2).</p>
<h3>Talking between VRFs, on purpose</h3>
<p>Sometimes tables must share something (a DNS server, one shared application). Two ways:</p>
<ul>
<li><b>Through a firewall (the usual design).</b> Each VRF's default route points to its own firewall subinterface; the firewall's policy decides what crosses, logs it and often translates addresses.</li>
<li><b>Route leaking</b> (stretch). A VRF static can resolve its next hop in the global table (the <code>global</code> keyword at the end of <code>ip route vrf</code>), and MP-BGP route targets can import routes between VRFs. Easy to get wrong: a leaked /24 instead of a /32 opens a whole subnet. Know it exists; CCNP covers it.</li>
</ul>
<p>Real IOS has VRF-aware versions of most services (DHCP, NAT, SSH, syslog, SNMP); in this lab DHCP, NAT and SSH use the global table only, so the benches give guests static addresses.</p>
${K.when([
  ["VRF-Lite on one router or L3 switch","Overlapping tenants, or guest / CCTV / payment networks kept apart on a few devices","Separate tables, no MPLS, a few commands; a missing route can't be &ldquo;forgotten open&rdquo;","Many routers must each carry many VRFs end to end"],
  ["VLANs plus ACLs in one table","A few groups with unique addressing that may talk under rules","Simple, one table to read","Addresses overlap (impossible in one table), or one ACL typo would expose everything"],
  ["MPLS Layer 3 VPN (provider)","Many sites and customers, any-to-any, over a provider core","VRFs only on PEs; the core scales; one MP-BGP session carries all VRFs","A single site, or you don't control a provider network"],
  ["Separate physical routers or firewalls","A regulator or contract demands physical separation","Nothing is shared, so a configuration slip can't cross over","Cost, rack space and spares for every separated network"],
], "How should I separate these networks?")}
${K.myth([
  ["A VRF is a type of VLAN.","A VLAN separates Layer 2 broadcast domains on switches; a VRF separates Layer 3 routing tables on a router. They are often paired (one VLAN per VRF) but work at different layers."],
  ["VRFs encrypt or secure the traffic.","A VRF separates routing; it encrypts nothing. On a shared link the frames are in clear text, and a leaked route or wrong interface breaks the separation. Encryption needs IPsec (Module 8)."],
  ["You need MPLS and a route distinguisher to use VRFs.","VRF-Lite runs on ordinary routers and L3 switches with neither. RDs and route targets matter when MP-BGP carries VPN routes between PE routers."],
  ["If an interface is in a VRF, the router's own ping and show ip route use that VRF.","A router's own commands use the global table unless you name the VRF: ping vrf NAME, show ip route vrf NAME."],
])}
${K.case("A Lagos co-working operator grows from two tenants to twelve", `
<p><b>The situation:</b> the Victoria Island building from the first bench expects twelve tenants, most with their old addressing, sharing one internet connection.</p>
<p><b>Separation:</b> one VRF per tenant on the Layer 3 core, named after the lease (TENANT-07) with a description naming the company; each tenant's VLANs get SVIs in its VRF. Nobody renumbers.</p>
<p><b>The shared exit:</b> each VRF's default route points to its own subinterface on the building firewall, which translates each tenant to its own public address, applies per-tenant policy and bandwidth, and denies tenant-to-tenant traffic by default. Two tenants sharing a printer becomes a firewall rule with a ticket, not a leaked route.</p>
<p><b>Operations:</b> monitoring and SSH reach every device through a management VRF; the runbook starts every fault with <code>show ip vrf interfaces</code>.</p>
<p><b>The lesson:</b> VRFs solved overlap and separation on one device, the firewall became the one place where tables meet, and naming kept twelve tables readable.</p>`)}
${K.dodont([
  "Create the VRF (with <code>address-family ipv4</code>), then <code>vrf forwarding</code>, then <code>ip address</code>: in that order.",
  "Name VRFs after their purpose, add descriptions, and keep names identical on every device.",
  "Type <code>vrf NAME</code> in every routing, show and ping command, and use <code>source</code> on <code>ping vrf</code> to test a specific subnet.",
  "Start every VRF fault with <code>show ip vrf interfaces</code> and <code>show ip route vrf NAME</code>.",
  "Send traffic between VRFs through a firewall with a policy.",
],[
  "Don't type <code>vrf forwarding</code> on a live interface outside a change window: its address disappears.",
  "Don't trust the running-config for routes: a static can be configured and not installed.",
  "Don't conclude &ldquo;no route&rdquo; from a plain <code>show ip route</code> or a plain <code>ping</code>.",
  "Don't leak routes or move a VRF interface to the global table to make a fault go away.",
  "Don't put DHCP clients in overlapping VRF subnets in this lab: its DHCP works in the global table only.",
])}
${K.check({q:"A provider serves 300 business customers across 40 routers, and many customers use the same private ranges. Which approach fits best?", o:["VRF-Lite on all 40 routers, with one subinterface per customer on every link","An MPLS Layer 3 VPN: a VRF per customer on the PE routers only, MP-BGP between PEs and labels across the core","One global table with an ACL per customer","Ask customers to renumber so one table works"], a:1, why:"VRF-Lite would need 300 subinterfaces per link and 300 routing processes per router. MPLS L3VPN keeps VRFs on the PEs only, carries every VRF's routes over MP-BGP (route distinguishers keep overlapping prefixes unique) and the core forwards on labels. One table can't hold overlapping prefixes at all."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"Two Port Harcourt companies merge. Both use 10.1.0.0/16, and for six months both must reach one shared HR application at 172.30.5.10 while their own networks stay apart. They will share one router in the new office. Which two design choices follow from the rules in this lesson? (Choose two.)", o:["Put each company in its own VRF on the shared router, so 10.1.0.0/16 can exist twice","Put both companies in the global table and add ACLs between them","Reach the HR application through a firewall that each VRF's default route points to, with policy on what may cross","Add the HR application's interface to both VRFs at once","Leak the whole 10.1.0.0/16 of each company into the other's VRF"], a:[0,2], why:"1. What is asked? Overlapping addresses kept apart, plus one controlled shared service. 2. Which rule? Overlap is only allowed in different tables; traffic between tables should cross something that decides. 3. Apply it: one VRF per company, and a firewall (often doing NAT, since both sides use 10.1.0.0/16) in front of the shared application. One table can't hold 10.1.0.0/16 twice; an interface belongs to exactly one VRF; leaking the overlapping /16s would collide."})}

<h2>Interview corner</h2>
${K.hint(`Define it in one sentence, give the rule about which table a packet uses, then two or three real uses, and end with VRF-Lite vs MPLS.`)}
${K.reveal("&ldquo;What is a VRF, and when would you use one?&rdquo;", `<p>"A VRF is a separate routing table inside one router or Layer 3 switch. Every interface belongs to exactly one table, the global one or a VRF, and a packet is routed only in the table of the interface it came in on, so the tables can't see each other and can even use the same subnets. I'd use them for overlapping customers or tenants, to keep guest Wi-Fi, CCTV or payment terminals away from staff without relying on ACLs, and for management. Without MPLS that's VRF-Lite; an MPLS Layer 3 VPN uses the same VRFs on its PE routers, with MP-BGP carrying their routes."</p>`)}
${K.hint(`Walk the four questions in order, name a command for each, and mention the two classic slips.`)}
${K.reveal("&ldquo;Users in a VRF can't reach a server. How do you troubleshoot it?&rdquo;", `<p>"I look for something in the wrong table. First, which table is each interface in: <code>show ip vrf interfaces</code>, plus <code>show ip interface brief</code> for an interface left unassigned. Second, is the route in that VRF's table: <code>show ip route vrf NAME</code>, not the plain command. Third, if not, where did it go: a static without <code>vrf</code> lands in the global table and often isn't installed, and a <code>network</code> statement under the global OSPF process never matches a VRF interface, so I check the running-config and <code>show ip ospf interface brief</code>, and the return path on the far router. Then I test with <code>ping vrf NAME</code> and a <code>source</code> in the users' subnet, because a plain ping tests the global table."</p>`)}
${K.hint(`Say what changes when you type vrf forwarding, why IOS does it, and how you'd run the change safely.`)}
${K.reveal("&ldquo;What happens when you put an interface that's in production into a VRF?&rdquo;", `<p>"IOS removes its IPv4 address and says so: the connected route moves to the VRF's table and IOS wants the address entered again deliberately. Everything behind it loses its gateway until I re-enter it. So I'd do it in a change window with the sequence ready: <code>vrf forwarding</code>, then <code>ip address</code>, then the VRF's statics or OSPF network statements, then verify with <code>show ip vrf interfaces</code>, <code>show ip route vrf</code> and <code>ping vrf</code>. <code>no vrf forwarding</code> wipes the address too."</p>`)}

${K.recap([
  "A VRF is a separate routing table (own interfaces, routes and ARP table) inside one router or L3 switch; everything else is in the global table.",
  "Every interface belongs to exactly one table; a packet is routed only in its incoming interface's table. That is the separation, and why overlapping subnets are fine.",
  "Uses: overlapping tenants or customers, guest / CCTV / payment separation, management, and every MPLS PE. Without MPLS it's called VRF-Lite.",
  "Configure: vrf definition NAME + address-family ipv4 (or the older ip vrf NAME), then vrf forwarding NAME, then re-enter the IP address, because joining or leaving a VRF wipes it.",
  "VRF-Lite needs no route distinguisher or route targets; those matter when MP-BGP carries VPN routes between PEs.",
  "Name the table everywhere: ip route vrf, router ospf N vrf NAME (its own process ID), show ip route vrf, ping vrf, traceroute vrf, show ip arp vrf. Without vrf, it's the global table.",
  "Most VRF faults are something in the wrong table: an interface not moved, a static or OSPF network in the global table. A static whose next hop isn't reachable in its own table isn't installed at all.",
  "VRF-Lite across many routers needs a subinterface per VRF per link; MPLS L3VPN scales it. Traffic between VRFs should pass a firewall.",
])}
${K.next(`<b>Lesson 7 — Cloud.</b> From virtual routers and virtual tables to someone else's data centre: NIST's five characteristics of cloud, IaaS, PaaS and SaaS, the deployment models, and the four ways a company's network reaches the cloud (internet, internet VPN, private WAN, intercloud exchange). You'll meet the cloud's own version of a separate routing domain, the virtual private cloud.`)}
`,
quiz:[
  {lvl:1, q:"What is a VRF?", o:["A VLAN that spans several switches","A separate routing table inside one router or Layer 3 switch, with its own interfaces and routes","An encrypted tunnel between two routers","A backup copy of the routing table"], a:1, why:"VRF = virtual routing and forwarding: one device holds several separate routing tables. Each interface belongs to one of them (or to the global table). VLANs are Layer 2; tunnels and encryption are different features."},
  {lvl:1, q:"What happens to an interface's IPv4 address when you configure vrf forwarding on it?", o:["It is kept and copied into the VRF","It is removed, and IOS says so; you re-enter it after the command","It is changed to the next free address","Nothing, unless the VRF has a route distinguisher"], a:1, why:"Joining (or leaving) a VRF removes the interface's IPv4 addresses, with a console message. The order is vrf forwarding first, then ip address."},
  {lvl:1, type:"match", q:"Match each command with what it does.", pairs:[["vrf definition GUEST","Creates the VRF and enters VRF configuration mode"],["address-family ipv4","Enables IPv4 for the VRF"],["vrf forwarding GUEST","Moves the current interface into the VRF"],["ip route vrf GUEST 0.0.0.0 0.0.0.0 10.9.0.2","Adds a default route to GUEST's table only"],["ping vrf GUEST 10.9.0.2","Tests reachability using GUEST's table"]], why:"Create (vrf definition + address-family), assign (vrf forwarding), route (ip route vrf) and test (ping vrf). Each routing or testing command names the table."},
  {lvl:1, type:"fill", q:"Type the command that displays the routing table of the VRF named GUEST.", fields:[{label:"Command", a:["show ip route vrf GUEST"], ios:true}], why:"show ip route vrf GUEST prints Routing Table: GUEST and only that VRF's routes. The plain show ip route shows the global table only."},
  {lvl:1, type:"multi", q:"Which two are typical reasons to configure VRF-Lite? (Choose two.)", o:["Two tenants on one router use the same private subnet","Guest Wi-Fi must have no route to the staff network","Traffic between two sites must be encrypted","A link needs more bandwidth","Switches need fewer VLANs"], a:[0,1], why:"VRFs give separate tables, so overlapping addresses and routing separation are the classic uses. They encrypt nothing (that's IPsec) and add no bandwidth; VRFs are often paired with VLANs rather than replacing them."},
  {lvl:2, q:"Based on the exhibit, an engineer on PE1 says customer B's server 10.2.2.10 is unreachable because ping fails. Customer B's users reach it fine. What is the best explanation?", ex:"PE1#show ip vrf interfaces\nInterface              IP-Address      VRF                              Protocol\nGi0/1                  10.1.1.1        CUST_B                           up\nGi0/2.20               10.2.2.1        CUST_B                           up\nPE1#ping 10.2.2.10\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 10.2.2.10, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)", o:["Gi0/2.20 is down","The plain ping used the global table, which has no route to 10.2.2.0/24; ping vrf CUST_B 10.2.2.10 tests the right table","CUST_B needs a route distinguisher before the router can ping","The server's firewall blocks the router"], a:1, why:"10.2.2.0/24 is connected only in CUST_B. A router's own ping uses the global table unless the VRF is named, so it finds no route. The interfaces are up, VRF-Lite needs no RD, and the users' success shows the path works."},
  {lvl:2, type:"order", q:"G0/2 on a router is live in the global table with 10.40.0.1/24. Put the steps of moving it into a new VRF CAMS in the order that keeps the outage shortest and ends with a verified result.", items:["Create vrf definition CAMS with address-family ipv4","Enter interface g0/2 and type vrf forwarding CAMS","Re-enter ip address 10.40.0.1 255.255.255.0","Add the CAMS static routes with ip route vrf CAMS","Verify with show ip vrf interfaces, show ip route vrf CAMS and ping vrf CAMS"], why:"Create the VRF first (the interface can't join a VRF that doesn't exist). The outage starts at vrf forwarding, which wipes the address, so re-address immediately, then give the VRF its routes, then verify in the right table."},
  {lvl:2, q:"G0/1 is in VRF GUEST on subnet 10.255.0.0/30. The running-config contains ip route 0.0.0.0 0.0.0.0 10.255.0.2, but guests can't reach the internet. What is wrong?", o:["The default route is in GUEST but has the wrong next hop","The route was entered for the global table; its next hop isn't reachable there, so it is installed nowhere and GUEST has no default","Guests need NAT on G0/1","Default routes can't be used in VRFs"], a:1, why:"A plain ip route belongs to the global table, and the global table can't resolve 10.255.0.2 (that subnet is connected only in GUEST). Replace it with ip route vrf GUEST 0.0.0.0 0.0.0.0 10.255.0.2."},
  {lvl:2, type:"multi", q:"Which two statements about OSPF and VRFs are correct? (Choose two.)", o:["Each VRF runs its own OSPF process, configured with router ospf N vrf NAME","network 0.0.0.0 255.255.255.255 area 0 under the global process does not enable OSPF on VRF interfaces","One OSPF process can serve the global table and every VRF at once","A VRF's OSPF process must use the same process ID as the global one","OSPF cannot run inside a VRF; only static routes can"], a:[0,1], why:"Each VRF needs its own process (with its own ID and router ID); a process only ever matches interfaces of its own table, so a global catch-all network statement ignores VRF interfaces."},
  {lvl:2, q:"Based on the exhibit, a guest laptop on VLAN 30 (192.168.30.0/24, subinterface Gi0/0.30) can open the staff file server. The design says VLANs 20 and 30 are in VRF GUEST. What is the cause?", ex:"KAN-R1#show ip vrf interfaces\nInterface              IP-Address      VRF                              Protocol\nGi0/0.20               192.168.20.1    GUEST                            up\nGi0/1                  10.255.0.1      GUEST                            up", o:["Gi0/0.30 is missing: it is still in the global table with the staff VLAN, so its traffic is routed there","GUEST has no route distinguisher","VLAN 30 isn't allowed on the trunk","The staff server is in VRF GUEST"], a:0, why:"show ip vrf interfaces lists every VRF member; Gi0/0.30 isn't there, so it is in the global table next to the staff subnet. Fix: vrf forwarding GUEST on Gi0/0.30, then re-enter 192.168.30.1/24."},
  {lvl:2, type:"fill", q:"From the router, test reachability of 10.0.9.10 inside the VRF named TENANT-B. Type the command.", fields:[{label:"Command", a:["ping vrf TENANT-B 10.0.9.10"], ios:true}], why:"ping vrf TENANT-B 10.0.9.10 builds the echo in TENANT-B's table. A plain ping 10.0.9.10 would use the global table."},
  {lvl:2, q:"An engineer configures VRF-Lite with vrf definition CUST_A and no rd line. show vrf shows <not set> under Default RD. What does that mean?", o:["The VRF is broken and can't carry traffic","Nothing is wrong: a route distinguisher is only needed when MP-BGP carries VPN routes between PE routers","The VRF will use the global table's routes","IOS will assign a random RD at the next reload"], a:1, why:"An RD makes identical prefixes from different VRFs unique inside MP-BGP (MPLS L3VPN). VRF-Lite on one device doesn't use BGP for that, so no RD is needed."},
  {lvl:3, q:"A Lagos hospital's new medical-device VLAN (Gi0/1.80) was moved into VRF MEDICAL during working hours. Immediately, every device on it lost contact, and show ip interface brief shows Gi0/1.80 as unassigned, up, up. Nothing else changed. What happened, and what should the change plan have said?", o:["The VLAN was pruned from the trunk; add it back","vrf forwarding MEDICAL removed the subinterface's address; the plan should have run vrf forwarding then ip address back to back in a change window, then routes and verification","MEDICAL needs an RD before the interface comes up","The subinterface must be shut down and re-enabled after joining a VRF"], a:1, why:"unassigned with up/up is the signature of a VRF move: joining wipes the IPv4 address. The plan must re-enter the address immediately (vrf forwarding first, then ip address), add the VRF's statics or OSPF, and verify with show ip vrf interfaces and ping vrf. No RD or shut/no shut is needed."},
  {lvl:3, q:"New ATMs on Gi0/2.40 (VRF ATM) can't reach the card processor. On the branch, show ip route vrf ATM shows C 10.30.40.0/24, and Gi0/2.40 is in VRF ATM. On the head-office router, 10.30.40.0/24 is missing. show ip ospf interface brief on the branch lists Gi0/2.30 under PID 30 but no Gi0/2.40. What is the most likely cause?", o:["The processor blocks the new subnet","The network statement for 10.30.40.0/24 is missing from the VRF ATM process (for example, typed under the global process), so the subnet isn't advertised","The branch needs a second VRF for the new ATMs","Gi0/2.40 must be in the global table to run OSPF"], a:1, why:"The interface is in the right VRF and the connected route exists, but OSPF doesn't run on it, so the far end has no return route. A network statement under the global process never matches a VRF interface. Move it to router ospf 30 vrf ATM, then test with ping vrf ATM sourced from Gi0/2.40."},
  {lvl:3, q:"Guests in VRF GUEST must use one DNS server, 10.20.10.53, which sits in the staff network in the global table. Security insists guests reach nothing else in staff. Which design best meets both requirements?", o:["Move the guest subinterfaces into the global table so they can reach the DNS server","Leak 10.20.10.0/24 into GUEST with a static route using the global keyword","Send guest traffic through a firewall (GUEST's default points to it) that permits only DNS to 10.20.10.53, or give guests their own DNS resolver in the guest network","Put the DNS server's interface into both tables"], a:2, why:"Moving guests to the global table removes the separation; leaking a /24 opens the whole staff subnet; an interface belongs to one table only. A firewall between the tables enforces 'DNS to one host only' and logs it, and a separate guest resolver avoids crossing at all. (A leaked /32 is possible, but it lets every protocol through to that host.)"},
],
cards:[
  {f:"VRF", b:"Virtual Routing and Forwarding: a separate routing table (own interfaces, routes and ARP table) inside one router or L3 switch. Everything not in a VRF is in the global table."},
  {f:"The VRF forwarding rule", b:"Every interface belongs to exactly one table. A packet is routed only in the table of the interface it arrived on, so VRFs can't see each other and the same subnet can exist in several VRFs."},
  {f:"VRF-Lite", b:"VRFs on ordinary routers and L3 switches without MPLS. Across several devices, every device keeps the VRFs and every link carries one subinterface per VRF."},
  {f:"Uses of VRFs", b:"Overlapping tenants or customers on one router; guest, CCTV or payment networks separated from staff; management networks (ISR 4000 and ASR 1000 routers ship with Mgmt-intf); one VRF per customer on an MPLS PE."},
  {f:"Configuring VRF-Lite", b:"vrf definition NAME, address-family ipv4, exit-address-family; interface: vrf forwarding NAME, then ip address. Older form: ip vrf NAME and ip vrf forwarding NAME."},
  {f:"vrf forwarding removes the address", b:"Joining or leaving a VRF removes the interface's IPv4 address, with a console message. Type vrf forwarding first, then ip address; treat it as an outage on a live interface."},
  {f:"Route distinguisher and route targets", b:"RD (e.g. 65000:1) makes VPN prefixes unique in MP-BGP; route targets choose which VRFs import which routes. Both MPLS L3VPN features; VRF-Lite needs neither (show vrf shows <not set>)."},
  {f:"Routing in a VRF", b:"Connected routes appear automatically. Statics: ip route vrf NAME NET MASK NEXT-HOP. OSPF: router ospf N vrf NAME, its own process ID and router ID; a global process never matches VRF interfaces."},
  {f:"Verifying VRFs", b:"show vrf, show ip vrf, show ip vrf interfaces, show ip route vrf NAME, show ip arp vrf NAME, show ip protocols vrf NAME, ping vrf NAME IP [source interface], traceroute vrf NAME IP."},
  {f:"The global-table trap", b:"Commands without vrf use the global table: a plain ping, show ip route or ip route. A plain ip route whose next hop is reachable only in a VRF is configured but not installed anywhere."},
  {f:"Troubleshooting VRFs: four questions", b:"1. Which table is each interface in? 2. Is the route in that table? 3. If not, where did the static or OSPF network go? 4. Test in the right table with ping vrf ... source ... (and check the return path)."},
  {f:"VRF-Lite vs MPLS L3VPN", b:"VRF-Lite: VRFs on every device, a subinterface per VRF per link; fine for a few VRFs. MPLS L3VPN: VRFs only on PEs, labels across the core, MP-BGP carries all VRFs' routes; scales to many customers."},
  {f:"Between VRFs", b:"Usually through a firewall (each VRF's default points to it; policy decides what crosses), sometimes route leaking (a static with the global keyword, or BGP route targets). Leak as narrowly as possible."},
  {f:"VRFs and the exam", b:"CCNA 200-301 v1.1 topic 1.12 includes VRFs (with server virtualization and containers). v2.0, from 3 February 2027, drops VRFs from the list; they remain everyday job knowledge."},
],
});

// ---------- Module 10 · Lesson 7 ----------
L.push({
id:"wan-cloud", mins:105, level:"Intermediate · builds on lessons 1–6 and Modules 5, 7 and 8",
t:"Cloud computing and the enterprise network — NIST's definition, service and deployment models, and the four ways to reach a cloud",
html:`
${K.goals([
  "Recite NIST's definition of cloud computing and test any service against its five essential characteristics.",
  "Say who manages what in IaaS, PaaS and SaaS, and place a real service in the right model.",
  "Tell public, private, community and hybrid clouds apart using one question: who may use it?",
  "Choose between the internet, an internet VPN, a private WAN (direct connect) and an intercloud exchange for reaching a cloud, and say where DNS, DHCP and security live afterwards.",
  "Read a VPC design (subnets, route tables, internet gateway, NAT gateway, private gateway) and prove on a bench which path a branch's traffic takes to a cloud server.",
])}
${K.pre([
  "Lessons 1–6 of this module, especially lesson 2 (MPLS WANs), lesson 3 (tunnels across the internet) and lesson 5 (virtual machines).",
  "Module 5: static routes and longest match. Module 7: DHCP pools, DNS (<code>nslookup</code>) and NAT/PAT (<code>show ip nat translations</code>).",
  "Module 8: site-to-site IPsec VPNs, stateful firewalls, and <code>curl</code> to test a web server.",
])}

<h2>Why this matters at work</h2>
<p>A payments company in Abuja moved its finance application from the server room to a public cloud over a weekend. On Monday the finance team in the Abuja branch said it was &ldquo;fine, just slower&rdquo;. The Kano branch said it was down. The cloud console showed every server healthy. The application team said: &ldquo;It's a network problem.&rdquo; Nobody on the network team had been invited to the migration meetings.</p>
<p>It is the most common cloud story there is. The servers moved, but so did the paths to them, the names that point at them, their addresses and the firewalls that guard them. The engineer who knows what a cloud is, which parts the provider runs and how traffic gets there fixes Monday morning. This lesson starts with the official definition (what the exam tests), moves to what changes on your network, and ends on a bench where a branch reaches a cloud server two ways.</p>

<h2>What makes something a cloud: NIST's definition and the five characteristics</h2>
${K.remember(`<b>The rule:</b> &ldquo;cloud&rdquo; is not a place; it is a way of <b>delivering</b> computing. Customers <b>serve themselves</b>, <b>over the network</b>, from a <b>shared pool</b> that <b>grows and shrinks quickly</b>, and pay by what is <b>measured</b>. Miss one and it is hosting or a virtualised server room.`)}
<p>The definition everyone quotes comes from ${K.g("NIST","The US National Institute of Standards and Technology, whose publications are widely used as neutral definitions and security guidance.")} ${K.g("Special Publication (SP) 800-145","The NIST Definition of Cloud Computing, by Peter Mell and Timothy Grance, published in September 2011. Two pages of definitions that the industry and exams still use.")}. Its core sentence:</p>
<div class="callout">Cloud computing is <i>&ldquo;a model for enabling ubiquitous, convenient, on-demand network access&rdquo;</i> to a shared pool of configurable resources (networks, servers, storage, applications, services) that can be <i>&ldquo;rapidly provisioned and released with minimal management effort or service provider interaction.&rdquo;</i> &mdash; NIST SP 800-145</div>
<p>Read it slowly: reached <b>over a network, on demand</b>; a <b>shared pool</b> of hardware; resources <b>provisioned and released</b> in minutes; <b>no provider staff</b> doing anything by hand for you. NIST then names <b>five essential characteristics</b>, <b>three service models</b> and <b>four deployment models</b>. This section is the five.</p>
<div class="tablewrap"><table>
<tr><th>Characteristic</th><th>NIST (key words)</th><th>In plain words, and what it looks like</th></tr>
<tr><td><b>On-demand self-service</b></td><td>Provisioning happens automatically, <i>&ldquo;without requiring human interaction with each service provider.&rdquo;</i></td><td>You create what you need yourself, at any hour, with no ticket: a web console, a CLI or an ${K.g("API","Application programming interface: a defined way for one program to ask another to do something, here to create or delete cloud resources from a script.")} call makes a server in minutes.</td></tr>
<tr><td><b>Broad network access</b></td><td>Capabilities are <i>&ldquo;available over the network and accessed through standard mechanisms&rdquo;</i> from phones, tablets, laptops and workstations.</td><td>Ordinary networks, ordinary tools, any device: HTTPS from a phone, SSH to a cloud server, from Lagos or London.</td></tr>
<tr><td><b>Resource pooling</b></td><td>Resources are <i>&ldquo;pooled to serve multiple consumers using a multi-tenant model.&rdquo;</i></td><td>Customers share the same hardware, kept apart by software. You pick a region such as &ldquo;Africa (Cape Town)&rdquo;, never a rack.</td></tr>
<tr><td><b>Rapid elasticity</b></td><td>Capabilities <i>&ldquo;scale rapidly outward and inward commensurate with demand.&rdquo;</i></td><td>Four web servers on a normal day, twenty on salary day, four again by evening. Capacity <i>appears</i> unlimited.</td></tr>
<tr><td><b>Measured service</b></td><td>Resource use is controlled <i>&ldquo;by leveraging a metering capability&rdquo;</i>, typically pay-per-use.</td><td>CPU hours, gigabytes and data transferred are metered, so use can be watched, limited and billed.</td></tr>
</table></div>
<p>The ${K.g("multi-tenant","Many customers (tenants) sharing the same infrastructure, each isolated from the others. Lesson 6's VRFs are the same idea inside one router.")} model is lesson 6's idea at data-centre scale: one router with several VRFs keeps customers apart on shared hardware.</p>
${K.remember(`The five, in NIST's order: <b>O</b>n-demand self-service, <b>B</b>road network access, <b>R</b>esource pooling, <b>R</b>apid elasticity, <b>M</b>easured service. &ldquo;<b>O</b>ur <b>B</b>ig <b>R</b>ented <b>R</b>oom is <b>M</b>etered.&rdquo;`)}
${K.analogy(`The electricity grid against a diesel generator in the compound. The grid is on demand (flip a switch), reached through a standard socket, shared by a city, able to feed one bulb or a factory, and metered. The generator is yours: sized for your biggest load, fuelled by you, and still yours when idle. On-premises servers are the generator; a cloud is the grid on a good day.`)}
<h3>Worked example: is this a cloud?</h3>
<p>A Port Harcourt engineering firm says &ldquo;we already have a private cloud&rdquo;: six servers with a hypervisor (lesson 5). A department wanting a VM emails IT and waits two or three days, and pays a fixed yearly share of the IT budget. Test it against the five:</p>
${K.steps([
  ["On-demand self-service?", "No. A human handles every request by email."],
  ["Broad network access?", "Yes. Staff reach the VMs over the network with normal tools."],
  ["Resource pooling?", "Yes. Every department's VMs share the six hosts."],
  ["Rapid elasticity?", "No. More power at month-end means buying a server: weeks."],
  ["Measured service?", "No. A flat charge says nothing about who used what."],
  ["Verdict", "A <b>virtualised server room</b>, not a cloud. A self-service portal, spare capacity handed out and reclaimed automatically, and metering with chargeback would make it a private cloud."],
])}
${K.myth([
  ["Virtualisation and cloud are the same thing.","Virtualisation (lesson 5) sits underneath most clouds; a cloud also needs self-service, elasticity and metering. VMs that IT creates by hand are not a cloud."],
  ["&ldquo;Cloud&rdquo; means a big public provider such as AWS.","NIST includes private and community clouds, which can sit in your own building. The five characteristics make a cloud, not who owns the hardware."],
  ["Once you are in the cloud, the network team has nothing left to do.","You still choose addresses, routes, paths, DNS and firewall rules, and the network matters more because every user is now remote from the servers."],
  ["A private link to the cloud is encrypted because it is private.","Private WANs and direct connections keep traffic off the internet but don't encrypt it by default. Add IPsec (lesson 3, Module 8) or TLS if the data needs it."],
])}
${K.check({q:"A hosting company rents a customer one physical server for a three-year contract. The customer phones the company to add disks; the bill is the same every month. Which NIST characteristics are clearly missing?", o:["Only broad network access","On-demand self-service, rapid elasticity and measured service","Only resource pooling","None — renting a server from a company is cloud computing"], a:1, why:"Phoning means no self-service; a fixed server can't scale quickly; a flat bill isn't metered. (A dedicated server isn't pooled either.) That is hosting, not cloud."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A university's IT team gives each department a self-service web portal: pick a VM size, click Create, and it is running in five minutes. VMs come from a shared pool of hosts. The pool is fixed at 40 servers and is usually 95% full, so requests often fail until something is deleted. Every department pays the same fee per year whatever it uses. Which two NIST characteristics are missing? (Choose two.)", o:["On-demand self-service","Broad network access","Resource pooling","Rapid elasticity","Measured service"], a:[3,4], why:"1. What is asked? Which of the five the setup fails. 2. Which rule? Test each characteristic separately against the facts. 3. Apply it: self-service is there (the portal, no human); network access is there; pooling is there (shared hosts). A pool that is always full and can't grow fails rapid elasticity; a flat fee per department with no metering fails measured service."})}

<h2>Service models: IaaS, PaaS and SaaS — who manages what</h2>
${K.remember(`<b>The rule:</b> picture the stack from the cables up. The provider always runs the bottom (building, hardware, hypervisor); the model says <b>where the line is</b>. <b>IaaS</b>: you take over from the <b>operating system</b> up. <b>PaaS</b>: you bring only <b>code and data</b>. <b>SaaS</b>: you just <b>use</b> it. The deciding question: <b>who patches the operating system?</b>`)}
<p>NIST defines three service models, each named for what the provider hands you ready to use.</p>
<ul>
<li>${K.g("IaaS","Infrastructure as a service: the provider supplies virtual servers, storage and networks; you manage the operating system and everything above it.")} NIST: the consumer provisions processing, storage and networks, able to <i>&ldquo;deploy and run arbitrary software, which can include operating systems and applications.&rdquo;</i> You get VMs, disks and virtual networks, and you install, patch and secure the operating system. Examples: Amazon EC2, Azure Virtual Machines.</li>
<li>${K.g("PaaS","Platform as a service: the provider runs the servers, operating system and runtime; you deploy your own application code and data onto it.")} NIST: the consumer deploys its own or acquired applications but <i>&ldquo;does not manage or control the underlying cloud infrastructure&rdquo;</i> (network, servers, OS, storage). You upload code; the provider runs the OS, the language runtime, scaling and patching. Examples: AWS Elastic Beanstalk, Google App Engine, managed databases.</li>
<li>${K.g("SaaS","Software as a service: the provider runs the whole application; you use it, usually through a browser or app, and manage only your users and settings.")} NIST: the consumer can <i>&ldquo;use the provider's applications running on a cloud infrastructure,&rdquo;</i> controlling at most limited user-specific settings. You sign in and use it. Examples: Microsoft 365 email, Cisco Webex.</li>
</ul>
${K.svg("0 0 760 360",
  K.txt(20,20,"Who manages each layer?",{c:"fg",b:true,f:"body",s:12.5})+
  `<rect x="440" y="10" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.35" stroke="var(--accent)"/>`+K.txt(460,22,"you (the customer)",{f:"body",s:11})+
  `<rect x="590" y="10" width="14" height="14" rx="3" fill="var(--panel2)" stroke="var(--line)"/>`+K.txt(610,22,"the provider",{f:"body",s:11})+
  K.txt(80,50,"On-premises",{mid:true,c:"fg",b:true,f:"body",s:11.5})+K.txt(250,50,"IaaS",{mid:true,c:"fg",b:true,f:"body",s:11.5})+K.txt(420,50,"PaaS",{mid:true,c:"fg",b:true,f:"body",s:11.5})+K.txt(590,50,"SaaS",{mid:true,c:"fg",b:true,f:"body",s:11.5})+
  ["Application","Data","Runtime","Operating system","Virtualisation","Servers and storage","Networking","Facility and power"].map((lay,i)=>{
    const y = 62 + i*32, you = [8,4,2,0];
    return [0,1,2,3].map(c=>{ const x = 15 + c*170, mine = i < you[c];
      return `<rect x="${x}" y="${y}" width="130" height="26" rx="5" fill="${mine?"var(--accent)":"var(--panel2)"}" ${mine?'opacity="0.35"':""} stroke="${mine?"var(--accent)":"var(--line)"}"/>`+K.txt(x+65,y+17,lay,{mid:true,c:"fg",f:"body",s:10.5}); }).join("");
  }).join("")+
  K.txt(380,334,"Moving right, the line goes up: you manage less, and you control less.",{mid:true,c:"fg",f:"body",s:11.5})+
  K.txt(380,352,"In every model you still own your users, your data and who may access it.",{mid:true,f:"body",s:11}),
  "Who manages each layer in each model.")}
<p>The diagram's bottom line is the part people forget: in <b>every</b> model the customer decides who gets an account and who may see the data. Providers call this the ${K.g("shared responsibility model","The provider secures the parts it runs (facilities, hardware, hypervisor, and more as you move from IaaS to SaaS); the customer secures what it controls (accounts, data, configuration, and in IaaS the OS and firewall rules).")}. A SaaS mailbox with the password &ldquo;Welcome1&rdquo; is the customer's breach.</p>
${K.analogy(`Getting from Ikeja to Victoria Island. <b>On-premises</b> is owning a car: you buy, insure, fuel and fix it. <b>IaaS</b> is renting a car: the company services it, you drive and fill the tank. <b>PaaS</b> is a car with a driver: you say where, the driver drives. <b>SaaS</b> is the city bus: route, vehicle and driver are theirs; you buy a ticket and ride.`)}
<p><b>For the network engineer:</b> in <b>IaaS</b> you still design nearly everything (addresses, subnets, routes, gateways, firewall rules, VPNs), often with lesson 5's virtual routers and firewalls. In <b>PaaS</b>, how your offices reach the platform and who may connect. In <b>SaaS</b>, only the path: internet capacity, breakout and DNS.</p>
${K.exam(`Reading service-model questions: ignore the brand names and find the <b>verb</b> that says who does what to the <b>operating system</b>. &ldquo;Installs and patches its own OS&rdquo;, &ldquo;rents virtual machines&rdquo; → IaaS. &ldquo;Uploads code&rdquo;, &ldquo;managed database&rdquo; → PaaS. &ldquo;Uses through a browser&rdquo;, &ldquo;no installation&rdquo; → SaaS. The trap: VMs the provider runs (&ldquo;on VMs the provider manages&rdquo;) still mean PaaS or SaaS. Cloud is CCNA v1.1 topic 1.2.f (that exam runs until 2 February 2027); v2.0 drops it, but cloud interviews always ask it.`)}
${K.remember(`<b>I</b>aaS: <b>I</b> manage the OS. <b>P</b>aaS: I bring the <b>P</b>rogram. <b>S</b>aaS: I just <b>S</b>ign in.`)}
${K.check({q:"An Ibadan start-up writes a Java web application and deploys it to a provider service that runs the servers, the operating system and the Java runtime, and adds more capacity automatically when traffic grows. Which service model is this?", o:["IaaS, because there are servers underneath","PaaS, because the company brings only its application code and the provider runs the OS and runtime","SaaS, because users reach it through a browser","On-premises, because the company wrote the code"], a:1, why:"The provider manages the OS and runtime; the company brings code and data: PaaS. The browser describes the start-up's own customers, not the model it bought."})}
${K.drill({title:"which service model is it?", types:["cloudsvc"], count:5})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A Kano agritech team runs its sensor-data app on a managed app platform. A new feature needs a special network driver loaded into the operating system kernel, which the platform doesn't allow, so the team moves the app to virtual machines it rents from the same provider. Which model were they on before, which are they on now, and who patches the operating system now?", fields:[{label:"Before", a:["PaaS","platform as a service"]},{label:"Now", a:["IaaS","infrastructure as a service"]},{label:"Who patches the OS now", a:["the team","team","the customer","customer","the company","company","us","we","the agritech team","them"]}], why:"1. What is asked? The model before and after, and the new owner of the OS. 2. Which rule? Whoever controls the OS decides the model: provider-run OS with your code = PaaS; your own OS on rented VMs = IaaS. 3. Apply it: the platform blocked kernel changes because the provider owns the OS (PaaS). Renting VMs hands the OS to the team (IaaS), so patching it is now their job too: more control, more work."})}

<h2>Deployment models: public, private, community and hybrid</h2>
${K.remember(`<b>The rule:</b> one question: <b>who may use this cloud's infrastructure?</b> Anyone → <b>public</b>. One organisation → <b>private</b>. A group with shared concerns → <b>community</b>. Two or more of those joined so data and apps can move → <b>hybrid</b>. Where the hardware sits and who runs it do <b>not</b> decide it.`)}
<div class="tablewrap"><table>
<tr><th>Model</th><th>NIST: provisioned for&hellip;</th><th>Example</th></tr>
<tr><td><b>Public</b></td><td><i>&ldquo;open use by the general public&rdquo;</i>; it <i>&ldquo;exists on the premises of the cloud provider.&rdquo;</i></td><td>AWS, Microsoft Azure, Google Cloud: anyone with a card can sign up.</td></tr>
<tr><td><b>Private</b></td><td><i>&ldquo;exclusive use by a single organization comprising multiple consumers (e.g., business units)&rdquo;</i>; on or off premises.</td><td>A bank's own self-service platform in its two data centres.</td></tr>
<tr><td><b>Community</b></td><td><i>&ldquo;a specific community of consumers from organizations that have shared concerns&rdquo;</i> (mission, security, policy, compliance); on or off premises.</td><td>Government agencies sharing a cloud built to the same security rules.</td></tr>
<tr><td><b>Hybrid</b></td><td><i>&ldquo;two or more distinct cloud infrastructures&rdquo;</i> (private, community or public), still separate but bound together by technology that gives <i>&ldquo;data and application portability&rdquo;</i></td><td>A retailer's private cloud for payments, bursting its web shop into a public cloud at Christmas.</td></tr>
</table></div>
<p>Three details trip people up.</p>
<ul>
<li><b>Private doesn't mean &ldquo;in our building&rdquo;.</b> A third party can host it, as long as the infrastructure is for your organisation alone.</li>
<li><b>Hybrid means joined, not merely both.</b> NIST's example is ${K.g("cloud bursting","Running normally in one cloud (often private) and overflowing into another (often public) when demand peaks, then shrinking back.")}. Everyday speech calls any mix of on-premises and cloud &ldquo;hybrid&rdquo;; the strict meaning is two clouds bound together so workloads and data can move between them. The binding is usually a network (a VPN or private link, shared addressing, shared DNS), which is why hybrid lands on the network team's desk.</li>
<li><b>Multicloud is not a NIST model.</b> ${K.g("Multicloud","Using services from two or more public cloud providers (for example AWS and Azure). An industry term, not one of NIST's four deployment models.")} means using more than one public provider: common, and it matters for the network (intercloud exchanges, next section), but never the answer to a NIST question.</li>
</ul>
${K.when([
  ["Public","Demand goes up and down, you want to start fast, or you have no data centre","No hardware to buy; pay for use","Rules require dedicated hardware, or steady heavy use makes renting dearer than owning"],
  ["Private","Strict control, data-location rules, steady load, an existing data centre","Your hardware, your rules, your location","You need sudden large growth or have no team to run it"],
  ["Community","Several organisations share the same compliance needs","Shared cost, built to the common rules","Members' needs differ widely"],
  ["Hybrid","Some workloads must stay private, others need public scale","Each workload where it fits best","There is no budget or skill to join the two (network, identity, DNS, security)"],
], "Which deployment model?")}
${K.check({q:"Twelve microfinance banks agree to share one cloud platform built and run by a technology company to meet the same central-bank security and audit rules. Only the twelve banks can use it. Which NIST deployment model is this?", o:["Public, because a third-party company runs it","Private, because it isn't open to everyone","Community, because it is for a specific group of organisations with shared compliance concerns","Hybrid, because there are twelve organisations"], a:2, why:"Who may use it? A group of organisations with shared concerns: community. Who runs it doesn't change the model."})}
${K.drill({title:"which deployment model is it?", types:["clouddeploy"], count:5})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Match each situation with its NIST deployment model.", pairs:[["A telecoms operator runs a self-service VM platform in its own data centre, used only by its own engineering, billing and marketing teams","Private"],["Five state hospitals use one cloud designed for their common patient-data rules; nobody else may join","Community"],["An insurer runs claims on its private cloud and, every December, automatically moves overflow claims processing into a public provider over a private link","Hybrid"],["A news website runs on a provider's shared infrastructure that any paying customer can use","Public"]], why:"1. What is asked? The deployment model for each. 2. Which rule? Ask who may use the infrastructure: one organisation (private), a group with shared concerns (community), anyone (public), or two clouds bound together (hybrid). 3. Apply it: the operator's own teams are business units of one organisation; the hospitals share rules; the insurer's private and public clouds are joined and work moves between them; the news site is on infrastructure open to all."})}

<h2>How the cloud changes the enterprise network</h2>
${K.remember(`<b>The rule:</b> moving a server to the cloud moves the <b>destination</b>, so four things must follow it: the <b>path</b> (which link), the <b>addresses</b> (private or public), the <b>names</b> (which DNS answer) and the <b>security</b> (which firewall sees it). Change one without the others and you get the Monday-morning ticket.`)}
<h3>Before and after: where the traffic goes</h3>
<p>In the classic enterprise, branches send nearly everything to the head-office data centre over a private WAN (lesson 2), and head office has the one big internet connection and firewall. Once the applications move to the cloud, the main flow is <b>branch → cloud</b>. Three consequences follow:</p>
<ul>
<li><b>The internet becomes critical.</b> With finance and email in the cloud, an internet outage stops work: companies add a second ISP, and branches need their own internet links.</li>
<li><b>Backhaul or local breakout.</b> ${K.g("Backhaul","Carrying branch traffic over the WAN to a central site before it goes to the internet, so it passes the central firewall. Safe and simple, but it adds delay and fills the head-office links.")} (branch traffic goes to head office first) keeps security in one place but adds delay and fills links. ${K.g("Local internet breakout","A branch sending internet- and cloud-bound traffic directly out of its own internet link instead of via head office. Also called direct internet access.")} is faster but needs security at every branch. SD-WAN (lesson 4) makes this choice per application.</li>
<li><b>The cloud is a site on your WAN diagram</b> (Module 1): it needs non-clashing addresses, routes, redundancy and capacity like any branch.</li>
</ul>
<h3>Four ways to reach a public cloud</h3>
${K.svg("0 0 760 370",
  K.box(10,50,120,250,"ENTERPRISE","HQ and branches",true)+
  K.box(620,50,130,160,"CLOUD A","provider 1")+K.box(620,255,130,48,"CLOUD B","provider 2")+
  K.link(130,75,620,75)+
  K.txt(150,67,"① Internet",{c:"fg",b:true,f:"body",s:11.5})+K.txt(150,91,"public addresses, TLS per app, best effort",{f:"body",s:10.5})+
  `<line x1="130" y1="130" x2="620" y2="130" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 4"/>`+
  K.txt(150,122,"② Internet VPN",{c:"fg",b:true,f:"body",s:11.5})+K.txt(150,146,"IPsec tunnel over the internet, best effort",{c:"accent",f:"body",s:10.5})+
  `<line x1="130" y1="185" x2="620" y2="185" stroke="var(--ok)" stroke-width="2.2"/>`+
  K.txt(150,177,"③ Private WAN / direct connect",{c:"fg",b:true,f:"body",s:11.5})+K.txt(150,201,"MPLS or a dedicated circuit, with an SLA",{c:"ok",f:"body",s:10.5})+
  `<line x1="130" y1="275" x2="300" y2="275" stroke="var(--ok)" stroke-width="2.2"/>`+
  K.txt(140,267,"④ Intercloud exchange",{c:"fg",b:true,f:"body",s:11.5})+K.txt(140,291,"one private circuit",{c:"ok",f:"body",s:10.5})+
  K.box(300,250,150,50,"EXCHANGE","colocation site",true)+
  `<line x1="450" y1="262" x2="620" y2="205" stroke="var(--ok)" stroke-width="1.6"/>`+`<line x1="450" y1="282" x2="620" y2="282" stroke="var(--ok)" stroke-width="1.6"/>`+
  K.txt(375,318,"then short virtual links to each cloud",{mid:true,f:"body",s:10.5})+
  K.txt(380,354,"①② ride the internet: cheap and quick. ③④ are private circuits: predictable, with an SLA, but slower to order.",{mid:true,c:"fg",s:10.5,f:"body"}),
  "Four ways to a public cloud. Real designs often combine two: a private circuit, with an internet VPN as backup.")}
${K.steps([
  ["① The internet", "Users reach the service's public addresses over their normal internet link; each application protects itself with TLS (HTTPS). The default for SaaS: cheap and instant, but best effort, with no SLA end to end."],
  ["② An internet VPN", "A site-to-site IPsec tunnel (Module 8, lesson 3) from your edge to a VPN gateway in the cloud: your private addresses reach the cloud's private addresses, encrypted, within the hour, at the internet's performance. AWS builds two tunnels per VPN connection so one can fail."],
  ["③ A private WAN or direct connection", "A dedicated circuit to the provider: your MPLS provider (lesson 2) adds the cloud as a site, or you order <b>AWS Direct Connect</b>, <b>Azure ExpressRoute</b> or <b>Google Cloud Interconnect</b> where the provider is present. Predictable, with an SLA and private addressing end to end, but weeks to order, a monthly charge, and not encrypted by default."],
  ["④ An intercloud exchange", "A provider already connected to many clouds. You buy one circuit to the exchange, then order short virtual connections to each cloud; adding or changing a cloud becomes an order form, not a new circuit."],
])}
<p>${K.g("Intercloud exchange","A service, usually in a colocation data centre, connected to many public cloud providers, so one private circuit from the customer can reach several clouds and connections to them can be added or moved quickly.")} is the name CCNA study guides use for option ④. It usually lives in ${K.g("colocation","Renting space, power and cooling for your own equipment in a third party's data centre, where carriers and cloud providers are also present and can be cross-connected cheaply.")} data centres, where your router and the cloud provider's sit in the same building, joined by a short cross-connect cable.</p>
${K.when([
  ["Internet","SaaS, public web apps, pilots, anything protected by TLS","Nothing to buy; works from anywhere","You need private addressing end to end or guaranteed performance"],
  ["Internet VPN","Private subnets must reach the cloud's private subnets now, cheaply; or as the backup to a private link","Encrypted, quick, cheap","Heavy steady traffic or strict latency needs"],
  ["Private WAN / direct connect","Large, steady or latency-sensitive traffic; compliance wants the path off the internet","Predictable performance with an SLA","Short projects, or you may soon switch providers"],
  ["Intercloud exchange","Several clouds, or a likely move between providers","One circuit, many clouds, quick changes","One small workload a VPN would serve"],
], "Which path to the cloud?")}
${K.mistake(`Ordering a private circuit and calling the job done. The circuit carries only traffic that is <b>routed</b> onto it and <b>addressed</b> to the cloud's private addresses. With no route for the cloud's range, or with DNS still returning the public address, traffic keeps using the internet. This lesson's bench is that ticket.`)}
<h3>Where DNS, DHCP and security live now</h3>
<p>On-premises you ran DHCP on a router, DNS on your servers and one firewall at the edge. In an IaaS cloud each changes owner:</p>
<ul>
<li><b>DHCP:</b> the platform gives each VM its private address from the subnet you defined; you run no DHCP server there, only settings for the options (AWS calls them <i>DHCP option sets</i>). An AWS VM keeps its private address for life, like a Module 7 reservation you never made.</li>
<li><b>DNS:</b> the provider runs a resolver in each virtual network, and you can create <b>private zones</b> only your networks can see. The same name then has two answers: public for the internet, private for staff on the VPN or private link. That is ${K.g("split-horizon DNS","Giving different answers to the same DNS name depending on who asks: for example a public address to internet users and a private address to internal users.")}, and offices get the private answer only if their queries reach the private zone. In AWS that takes a <i>Route 53 Resolver inbound endpoint</i> in the VPC, because the built-in resolver answers only from inside the VPC.</li>
<li><b>Security:</b> the one edge firewall is joined by small rule sets on each subnet and server (next section) and virtual firewalls running as VMs (lesson 5). Traffic that never enters your building never meets your old firewall.</li>
</ul>
${K.dyk(`A cloud server never sees its own public address. Log in to an AWS VM reachable at 198.51.100.10 and run <code>ipconfig</code> or <code>ip addr</code>: you see only its private address, such as 10.100.0.10. The internet gateway does one-to-one static NAT (Module 7) outside the VM: the same inside local / inside global pair as <code>ip nat inside source static</code>. You will watch it on the bench.`)}
<h3>Worked example: preparing a branch router for a private link</h3>
<p>The Port Harcourt branch is joining the company's cloud network, <b>10.120.0.0/16</b>. A private circuit has arrived on PH-R1 Gi0/2: <b>10.255.20.2/30</b> is yours, <b>10.255.20.1</b> the provider's cloud gateway. The cloud team runs a DNS resolver endpoint at <b>10.120.0.53</b> for the private names. One change per rule of this section:</p>
${K.steps([
  ["The path: interface and route", "Address Gi0/2 and bring it up, then <code>ip route 10.120.0.0 255.255.0.0 10.255.20.1</code>. By longest match (Module 5) the /16 beats the default route for every cloud address; internet traffic still uses the default. Real direct connections usually exchange routes with BGP (beyond CCNA); a static route is the same decision by hand."],
  ["The names", "In the branch DHCP pool, list the cloud resolver first: <code>dns-server 10.120.0.53 192.0.2.53</code>. Windows asks the first server and uses the second only if the first doesn't answer."],
  ["The addresses", "Branch 10.70.1.0/24 to cloud 10.120.0.0/16, private to private over a private link: no NAT, which works only because the ranges don't overlap."],
  ["Prove it", "<code>show ip route 10.120.4.25</code> must name the static route via 10.255.20.1."],
])}
${K.term({env:"ios2", title:"PH-R1 — add the private link to the cloud", opts:{kind:"router", host:"PH-R1", model:"ISR 4331", motd:"PH-R1 — Port Harcourt branch router (lab). Console session, no enable secret."},
  setup:env=>{ ["enable","configure terminal","interface g0/0","description BRANCH LAN","ip address 10.70.1.1 255.255.255.0","no shutdown","interface g0/1","description INTERNET ISP","ip address 203.0.113.6 255.255.255.252","no shutdown","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.5","ip dhcp excluded-address 10.70.1.1 10.70.1.19","ip dhcp pool PH-LAN","network 10.70.1.0 255.255.255.0","default-router 10.70.1.1","dns-server 192.0.2.53","exit","end","disable"].forEach(c=>env.exec(c)); env.history.length=0; },
  intro:"PH-R1 today: LAN on Gi0/0, the internet on Gi0/1 with a default route, and a DHCP pool handing out a public DNS server. Make 10.120.0.0/16 use the new circuit on Gi0/2, and make branch PCs ask the cloud resolver first.",
  tasks:[
    {text:"Look first: <code>enable</code>, then <code>show ip route 10.120.4.25</code> (a cloud server). What does IOS say, and which route would actually carry that packet today?", done:e=>e.history.some(h=>/^\s*sh\S*\s+ip\s+ro\S*\s+10\.120\.4\.25/i.test(h))},
    {text:"<code>configure terminal</code>, <code>interface g0/2</code>: a <code>description</code> that mentions the cloud, <code>ip address 10.255.20.2 255.255.255.252</code>, <code>no shutdown</code>", done:e=>{ const i=e.intfs["GigabitEthernet0/2"]; return i.ip==="10.255.20.2" && i.mask==="255.255.255.252" && !i.shut && /cloud/i.test(i.desc||""); }},
    {text:"Back in global configuration (<code>exit</code>): <code>ip route 10.120.0.0 255.255.0.0 10.255.20.1</code>", done:e=>(e.routes||[]).some(r=>r.net==="10.120.0.0" && r.mask==="255.255.0.0" && r.nh==="10.255.20.1")},
    {text:"<code>ip dhcp pool PH-LAN</code>, then <code>dns-server 10.120.0.53 192.0.2.53</code> (the cloud resolver first, the public one second)", done:e=>{ const p=e.dhcp && e.dhcp.pools && e.dhcp.pools["PH-LAN"]; return !!p && p.dns[0]==="10.120.0.53" && p.dns.includes("192.0.2.53"); }},
    {text:"<code>end</code>, then prove the decision: <code>show ip route 10.120.4.25</code> now names the static route via 10.255.20.1. Check the pool with <code>show running-config | section dhcp</code>", done:e=>e.mode==="priv" && (e.routes||[]).some(r=>r.net==="10.120.0.0") && e.history.filter(h=>/^\s*sh\S*\s+ip\s+ro\S*\s+10\.120\.4\.25/i.test(h)).length>=2 && e.history.some(h=>/^\s*sh\S*\s+run\S*\s*\|\s*sec\S*\s+dhcp/i.test(h))},
    {text:"Save: <code>copy running-config startup-config</code> (press Enter to accept the file name)", done:e=>!!e.savedOnce},
  ],
  win:"PH-R1 sends every 10.120.x.x packet over the private link (/16 beats /0) and everything else to the ISP, and PCs will ask the cloud resolver first at their next renewal. Notice the first <code>show ip route 10.120.4.25</code>: &ldquo;% Subnet not in table&rdquo;, although the default route would have carried the packet. That command lists only specific entries; the default route forwards but is never shown as the match.",
  solve:["enable","show ip route 10.120.4.25","configure terminal","interface g0/2","description PRIVATE LINK TO CLOUD VPC","ip address 10.255.20.2 255.255.255.252","no shutdown","exit","ip route 10.120.0.0 255.255.0.0 10.255.20.1","ip dhcp pool PH-LAN","dns-server 10.120.0.53 192.0.2.53","end","show ip route 10.120.4.25","show running-config | section dhcp","copy running-config startup-config",""]})}
${K.hint(`<code>dns-server</code> replaces the pool's whole list: type both servers on one line, in order. PCs pick it up at their next renewal; <code>ipconfig /renew</code> forces it.`)}
${K.check({q:"A branch has a default route to its ISP and a new static route 10.120.0.0/16 via a private link to the cloud. A user browses to the cloud server 10.120.4.25. Which path does the packet take, and why?", o:["The ISP, because the default route was configured first","The private link, because 10.120.0.0/16 is a longer (more specific) match than 0.0.0.0/0","Both, load-shared equally","Neither, because the two routes conflict"], a:1, why:"Longest match (Module 5): /16 beats /0, so 10.120.x.x takes the private link and everything else the default. Configuration order doesn't matter."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Match each requirement with the best way to reach the cloud.", pairs:[["A three-week pilot of a SaaS survey tool, no sensitive data","The internet (the app uses TLS)"],["A branch's private subnet must reach a cloud database's private address by tomorrow, encrypted, on a small budget","An internet VPN (IPsec)"],["A trading system replicates 2 Gb/s to the cloud all day and needs predictable delay with an SLA","A private WAN or direct connection"],["The company uses two cloud providers and expects to move workloads between them next year","An intercloud exchange"]], why:"1. What is asked? A path for each need. 2. Which rule? Internet paths are cheap and instant but best effort; private circuits are predictable but slow to order and tied to a provider; an exchange gives private circuits to many clouds. 3. Apply it: a TLS SaaS pilot needs nothing extra; private-to-private, encrypted and fast to set up is a VPN; heavy steady traffic with an SLA is a private circuit; several clouds and expected moves is the exchange."})}

${K.job("Kano and Kaduna — &ldquo;Teams and email are slow every afternoon&rdquo;", `
<p><b>The ticket:</b> &ldquo;Since we moved to cloud email and online meetings, calls from the Kano and Kaduna branches freeze every afternoon. Lagos head office is fine.&rdquo;</p>
<p><b>Questions first:</b> what changed? (Email and meetings moved from head-office servers to a SaaS provider.) Where does branch internet traffic go? What is full in the afternoon?</p>
<ol>
<li><b>Path:</b> <code>tracert</code> from a Kano PC to the meeting service: hop 1 the Kano gateway, then the provider's routers, the Lagos WAN router and the Lagos firewall. Branches have no internet link, so SaaS traffic is <b>backhauled</b> over the MPLS WAN and out of Lagos.</li>
<li><b>Utilisation:</b> the Kano WAN link (20 Mb/s) runs at 95% from 14:00 to 17:00, and the Lagos internet link is near full with every branch's meetings.</li>
<li><b>Why it worked before:</b> email used to sit in Lagos, so traffic was branch → head office, what the WAN was sized for. Now it is branch → head office → internet → provider and back.</li>
<li><b>Options:</b> (a) upgrade every WAN link and the Lagos internet link; (b) local internet breakout at each branch, with branch security and SD-WAN choosing paths per application (lesson 4); (c) a QoS policy (Module 7) giving meetings priority on the WAN now.</li>
<li><b>Decision:</b> (c) today, so calls work this week; (b) as the project, because the traffic pattern has changed for good. (a) pays to carry traffic the long way round.</li>
</ol>
<p><b>What you tell the branch managers:</b> &ldquo;Your meetings travel from Kano to Lagos and out to the internet over a link every branch shares. Today we've given meetings priority, so calls should stop freezing. Next month each branch gets its own protected internet connection for cloud services.&rdquo;</p>
<p><b>Ticket note:</b> &ldquo;Cause: SaaS backhauled via MPLS to Lagos; Kano and Kaduna WAN links 90–95% 14:00–17:00; Lagos internet near capacity. Interim: QoS priority for meeting traffic on branch WAN links (change approved). Project raised: branch local breakout with branch security and SD-WAN. Verified: Kano test call clear at 15:00, WAN 70%.&rdquo;</p>`)}

<h2>A first look at cloud networking building blocks: VPCs, subnets and gateways</h2>
${K.remember(`<b>The rule:</b> a cloud network is the network you know, rebuilt as software objects: a <b>VPC</b> is your address range, <b>subnets</b> are slices of it, <b>route tables</b> decide by longest match, <b>gateways</b> are the doors, <b>security groups</b> and <b>network ACLs</b> are the firewalls. Same logic, different console.`)}
<p>This section uses AWS's names, which the AWS course on this platform builds on; Azure's <i>virtual network</i> and Google Cloud's <i>VPC network</i> work the same way. A ${K.g("VPC","Virtual Private Cloud: a private network inside a cloud provider, with your own address range, subnets, route tables and gateways.")} is created in one ${K.g("region","A geographic area where a cloud provider has data centres, such as Europe (Ireland) or Africa (Cape Town). Resources are created in a region.")} with an IPv4 ${K.g("CIDR","Classless Inter-Domain Routing notation: an address range written as network/prefix length, such as 10.100.0.0/16 (Module 3's prefixes).")} block between /16 and /28. Each subnet lives in one ${K.g("Availability Zone","One or more separate data centres inside a region, with independent power and networking. Spreading subnets across zones survives a data-centre failure.")}.</p>
${K.svg("0 0 760 420",
  `<rect x="150" y="30" width="600" height="300" rx="10" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="7 4"/>`+
  K.txt(162,50,"VPC 10.100.0.0/16 · one region",{c:"accent",b:true,s:11.5})+
  `<rect x="170" y="66" width="260" height="140" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+
  K.txt(182,86,"Public subnet 10.100.0.0/24",{c:"fg",b:true,s:11})+
  K.dev("server",230,134,"WEB1","10.100.0.10")+K.box(300,112,116,40,"NAT gateway","outbound only")+
  K.txt(182,198,"route: 0.0.0.0/0 → internet gateway",{s:10})+
  `<rect x="470" y="66" width="260" height="140" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+
  K.txt(482,86,"Private subnet 10.100.1.0/24",{c:"fg",b:true,s:11})+
  K.dev("server",680,118,"DB1","10.100.1.20")+
  K.txt(482,184,"route: 0.0.0.0/0 → NAT gateway",{s:10})+K.txt(482,199,"route: 10.40.0.0/16 → private gw",{s:10})+
  K.box(170,240,180,44,"Internet gateway","1:1 NAT for public IPs",true)+
  K.box(520,240,210,44,"Private gateway","VPN or direct connect",true)+
  K.link(300,206,260,240)+K.link(600,206,625,240)+
  K.dev("cloud",80,262,"INTERNET","")+K.link(104,262,170,262)+
  K.box(520,358,210,44,"OFFICES","10.40.0.0/16")+K.link(625,284,625,358,"",true)+K.txt(633,348,"IPsec or circuit",{s:10})+
  K.txt(20,350,"Security group: on each server, stateful",{c:"fg",f:"body",s:11})+K.txt(20,368,"(allow rules only; replies return).",{f:"body",s:11})+
  K.txt(20,390,"Network ACL: on each subnet, stateless",{c:"fg",f:"body",s:11})+K.txt(20,408,"(numbered allow and deny rules).",{f:"body",s:11}),
  "A two-subnet VPC. A subnet is public only because its route table sends 0.0.0.0/0 to the internet gateway; the private one goes out through the NAT gateway and reaches the offices through the private gateway.")}
<div class="tablewrap"><table>
<tr><th>Building block</th><th>What it is</th><th>What it resembles</th></tr>
<tr><td><b>VPC</b></td><td>Your private address range in one region, isolated from other customers</td><td>A VRF (lesson 6)</td></tr>
<tr><td><b>Subnet</b></td><td>A slice of the VPC range, in one Availability Zone</td><td>A VLAN and its subnet</td></tr>
<tr><td><b>Route table</b></td><td>Routes for subnets; the VPC range is always local; longest match wins</td><td><code>show ip route</code></td></tr>
<tr><td><b>Internet gateway</b></td><td>The door to the internet; 1:1 NAT for servers with public addresses</td><td><code>ip nat inside source static</code></td></tr>
<tr><td><b>NAT gateway</b></td><td>Private-subnet servers can start outbound connections; nothing outside can start one in</td><td>PAT (<code>overload</code>)</td></tr>
<tr><td><b>Virtual private gateway</b> or transit gateway</td><td>Where VPNs and direct connections land; a transit gateway also joins many VPCs</td><td>A head-office WAN router; a hub (lesson 2)</td></tr>
<tr><td><b>Security group</b></td><td>Stateful allow-list on each server's interface</td><td>A stateful firewall (Module 8)</td></tr>
<tr><td><b>Network ACL</b></td><td>Stateless, numbered allow/deny rules on each subnet, checked in order</td><td>An extended ACL: return traffic needs its own rule (Module 8)</td></tr>
</table></div>
<h3>The five addresses AWS keeps in every subnet</h3>
<p>AWS reserves the first four addresses and the last one of each subnet. For 10.100.1.0/24: <b>.0</b> network, <b>.1</b> the VPC router (the subnet's gateway), <b>.2</b> reserved for DNS (the resolver itself is at the VPC base + 2: 10.100.0.2), <b>.3</b> future use, <b>.255</b> the last address (no broadcast in a VPC, but still kept). A /24 gives 256 − 5 = <b>251</b> usable, not Module 3's 254.</p>
${K.dyk(`The smallest AWS subnet, a /28, leaves 16 − 5 = 11 addresses for servers. Engineers using on-premises arithmetic (16 − 2 = 14) find out when they launch the twelfth server.`)}
${K.mistake(`Giving the VPC the same range as an office. A 10.40.0.0/16 VPC can't be routed to an Abuja office that also uses 10.40.0.0/16: one prefix in two places. Take cloud ranges from the company address plan before the first VPC is built, as for a new branch. VRFs (lesson 6) keep overlapping customers apart; <i>joining</i> overlapping networks needs NAT and complicates everything after.`)}
${K.check({q:"A VPC has two subnets. Subnet A's route table has 10.100.0.0/16 local and 0.0.0.0/0 to the internet gateway. Subnet B's has 10.100.0.0/16 local and 0.0.0.0/0 to a NAT gateway. A server in subnet B has no public address. Which statement is true?", o:["Subnet B is public because it can reach the internet","Subnet A is public; the server in B can start connections to the internet through the NAT gateway, but nobody on the internet can start a connection to it","Both subnets are private because they share the VPC range","The server in B can be reached from the internet at the NAT gateway's address"], a:1, why:"'Public' means the route table points 0.0.0.0/0 at the internet gateway: subnet A. Subnet B uses a NAT gateway, which, like PAT, lets inside hosts start outbound connections and lets only the replies back in."})}
<h3>Same logic, new situation</h3>
${K.q({type:"fill", q:"A cloud team creates the AWS subnet 10.20.8.0/26 for application servers. How many addresses can be given to servers, which address is the subnet's gateway (the VPC router), and which is the last address you can give a server?", fields:[{label:"Usable addresses", a:["59"]},{label:"Gateway (VPC router)", a:["10.20.8.1"]},{label:"Last usable address", a:["10.20.8.62"]}], why:"1. What is asked? Usable count, gateway and last usable address in an AWS subnet. 2. Which rule? Module 3's block size, minus AWS's five: the first four (network, VPC router, DNS, future) and the last. 3. Apply it: a /26 has 64 addresses, 10.20.8.0 to 10.20.8.63. 64 − 5 = 59 usable. The router is the base plus one, 10.20.8.1. The last address .63 is reserved, so the highest server address is 10.20.8.62; the first is 10.20.8.4."})}

<h3>Hands-on: the Abuja ticket — same app, two paths</h3>
<p>Back to the opening story. The finance app runs on APP1 in the VPC: private 10.100.0.10, published at 198.51.100.10. A private link was delivered to ABJ-R1 Gi0/2 last week and addressed by the installer.</p>
${K.bench({id:"m10-cloud-path", points:110, from:"CCNA · Module 10 · lesson 7", title:"Abuja branch: reach the cloud app over the private link, not the internet", viewBox:"0 0 960 540", openLog:true,
  intro:"<b>Ticket:</b> &ldquo;Since the private link to the cloud was installed, nothing has changed: app.example.com is as slow as before.&rdquo; <b>Build sheet:</b> ABJ-PC gets DHCP from ABJ-R1 (10.40.1.0/24, PAT to the internet on Gi0/1). ISP-R1 is the internet and knows only public addresses; PUB-DNS (192.0.2.53) has the public record app.example.com → 198.51.100.10. <b>VPC-R1 is one lab router playing three cloud parts:</b> the VPC router (10.100.0.1), the internet gateway (static NAT 10.100.0.10 ↔ 198.51.100.10 on Gi0/1) and the private gateway at the end of the private link (Gi0/2, 10.255.9.1). In AWS these are managed objects with no CLI, and the private gateway learns your range over BGP; a static route for 10.40.0.0/16 stands in here. CLOUD-DNS (10.100.0.53) is the VPC's resolver endpoint: app.example.com → 10.100.0.10. Use ABJ-PC's <b>Command Prompt</b> and ABJ-R1's CLI. The lab adds no delay, so &ldquo;slow&rdquo; shows as the path, not the timings.",
  devices:[
    {id:"r", kind:"router", label:"ABJ-R1", x:20, y:170, config:e=>{ ["en","conf t","hostname ABJ-R1","int g0/0","description BRANCH LAN","ip address 10.40.1.1 255.255.255.0","ip nat inside","no shut","int g0/1","description INTERNET ISP-R1","ip address 203.0.113.2 255.255.255.252","ip nat outside","no shut","int g0/2","description PRIVATE LINK TO CLOUD VPC","ip address 10.255.9.2 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 203.0.113.1","access-list 1 permit 10.40.0.0 0.0.255.255","ip nat inside source list 1 interface g0/1 overload","ip dhcp excluded-address 10.40.1.1 10.40.1.19","ip dhcp pool ABJ-LAN","network 10.40.1.0 255.255.255.0","default-router 10.40.1.1","dns-server 192.0.2.53","exit"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"sw", kind:"switch", label:"ABJ-SW1", x:20, y:300},
    {id:"pc", kind:"pc", label:"ABJ-PC", x:20, y:420, dhcp:true},
    {id:"isp", kind:"router", label:"ISP-R1", x:300, y:20, config:e=>{ ["en","conf t","hostname ISP-R1","int g0/1","description CUSTOMER ABJ-R1","ip address 203.0.113.1 255.255.255.252","no shut","int g0/0","description CLOUD PROVIDER EDGE","ip address 198.51.100.1 255.255.255.0","no shut","int g0/2","description DNS HOSTING","ip address 192.0.2.1 255.255.255.0","no shut"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"pdns", kind:"server", label:"PUB-DNS", x:560, y:10, ip:"192.0.2.53", mask:"255.255.255.0", gw:"192.0.2.1", services:{dns:{name:"ns1.example.com", records:{"app.example.com":"198.51.100.10"}, authoritative:true}}},
    {id:"vpc", kind:"router", label:"VPC-R1", x:540, y:170, config:e=>{ ["en","conf t","hostname VPC-R1","int g0/0","description VPC SUBNET 10.100.0.0/24","ip address 10.100.0.1 255.255.255.0","ip nat inside","no shut","int g0/1","description INTERNET GATEWAY","ip address 198.51.100.2 255.255.255.0","ip nat outside","no shut","int g0/2","description PRIVATE GATEWAY TO ABUJA","ip address 10.255.9.1 255.255.255.252","no shut","exit","ip route 0.0.0.0 0.0.0.0 198.51.100.1","ip route 10.40.0.0 255.255.0.0 10.255.9.2","ip nat inside source static 10.100.0.10 198.51.100.10"].forEach(c=>e.exec(c)); e.exec("end"); e.history.length=0; }},
    {id:"vsw", kind:"switch", label:"VPC-SW1", x:520, y:300},
    {id:"app", kind:"server", label:"APP1", x:560, y:420, ip:"10.100.0.10", mask:"255.255.255.0", gw:"10.100.0.1", services:{web:{title:"Finance portal"}}},
    {id:"cdns", kind:"server", label:"CLOUD-DNS", x:720, y:420, ip:"10.100.0.53", mask:"255.255.255.0", gw:"10.100.0.1", services:{dns:{name:"resolver.example.com", records:{"app.example.com":"10.100.0.10"}, authoritative:true}}},
  ],
  cables:[ {type:"cat6", a:"r:g0", b:"sw:g1"}, {type:"cat6", a:"pc:eth", b:"sw:g2"}, {type:"cat6", a:"r:g1", b:"isp:g1"}, {type:"cat6", a:"isp:g2", b:"pdns:eth"}, {type:"cat6", a:"isp:g0", b:"vpc:g1"}, {type:"cat6", a:"r:g2", b:"vpc:g2"}, {type:"cat6", a:"vpc:g0", b:"vsw:g1"}, {type:"cat6", a:"app:eth", b:"vsw:g2"}, {type:"cat6", a:"cdns:eth", b:"vsw:g3"} ],
  tray:["cat6"],
  tasks:[
    {text:"Reproduce the complaint. On ABJ-PC: <code>ipconfig /all</code> (which DNS server?), <code>nslookup app.example.com</code> (which address?), then <code>curl http://app.example.com</code> and read the frame log. How many times is the packet translated, by which routers, and which source address does APP1 see?", done:B=>Bench.tried(B,"pc",/^\s*nslookup\s+app/i) && Bench.fetched(B,"pc","198.51.100.10")},
    {text:"Check the private link on ABJ-R1: <code>enable</code>, <code>show ip interface brief</code> (is Gi0/2 up/up?), <code>ping 10.255.9.1</code> (does the cloud end answer?), then <code>show ip route 10.100.0.10</code>. Is there a route that would use the link?", done:B=>{ const h=B.devs.r.env.history; return h.some(x=>/^\s*ping\s+10\.255\.9\.1\s*$/i.test(x)) && h.some(x=>/^\s*sh\S*\s+ip\s+ro\S*\s+10\.100\./i.test(x)); }},
    {text:"Try the private address directly from ABJ-PC: <code>ping 10.100.0.10</code>. Read the frame log: which router gives up, and why can't the internet carry a packet for a private address?", done:B=>Bench.blocked(B,"pc","10.100.0.10")},
    {text:"Fix the path. On ABJ-R1: <code>configure terminal</code>, <code>ip route 10.100.0.0 255.255.0.0 10.255.9.1</code>, <code>end</code>. Then from ABJ-PC <code>ping 10.100.0.10</code> and <code>tracert 10.100.0.10</code>: which hop is new, and does the frame log show any NAT now?", done:B=>!!Bench.route(B,"r","10.100.0.0/16","S") && Bench.pinged(B,"pc","10.100.0.10") && Bench.traced(B,"pc","10.100.0.10")},
    {text:"Run <code>curl http://app.example.com</code> again: it still goes over the internet. Why? Fix the names: on ABJ-R1 <code>configure terminal</code>, <code>ip dhcp pool ABJ-LAN</code>, <code>dns-server 10.100.0.53 192.0.2.53</code>, <code>end</code>. On ABJ-PC <code>ipconfig /renew</code>, <code>ipconfig /flushdns</code> (real Windows caches answers; the lab doesn't, but make it a habit) and <code>nslookup app.example.com</code>.", done:B=>(B.devs.pc.dns||[])[0]==="10.100.0.53" && Bench.tried(B,"pc",/^\s*ipconfig\s+\/flushdns/i) && Bench.resolved(B,"pc","app.example.com")},
    {text:"Prove it: <code>curl http://app.example.com</code> and read the frame log (Gi0/2, no NAT lines), then <code>show ip nat translations</code> on ABJ-R1: is there a TCP entry to 10.100.0.10?", done:B=>Bench.fetched(B,"pc","10.100.0.10") && !Bench.natHas(B,"r",/10\.100\.0\.10:80/)},
  ],
  win:"The finance app now travels Abuja → private link → VPC with no NAT at all: branch 10.40.1.x talks to 10.100.0.10 directly, because the ranges don't overlap and both routers have a route for the other side. Two things had to change, and neither was the circuit: a <b>route</b> so packets for the cloud range take Gi0/2 (longest match beats the default), and <b>DNS</b> so the name returns the private address instead of the public one. The internet path still works as a fallback for anyone using the public name, and the old translations in <code>show ip nat translations</code> are a record of the path you just retired (the lab keeps them; a real router removes these finished ones after about a minute).",
  solve:[["pc","pc","ipconfig /all"],["pc","pc","nslookup app.example.com"],["pc","pc","curl http://app.example.com"],
    ["cli","r","enable"],["cli","r","show ip interface brief"],["cli","r","ping 10.255.9.1"],["cli","r","show ip route 10.100.0.10"],
    ["pc","pc","ping 10.100.0.10"],
    ["cli","r","configure terminal"],["cli","r","ip route 10.100.0.0 255.255.0.0 10.255.9.1"],["cli","r","end"],
    ["pc","pc","ping 10.100.0.10"],["pc","pc","tracert 10.100.0.10"],
    ["cli","r","configure terminal"],["cli","r","ip dhcp pool ABJ-LAN"],["cli","r","dns-server 10.100.0.53 192.0.2.53"],["cli","r","end"],
    ["pc","pc","ipconfig /renew"],["pc","pc","ipconfig /flushdns"],["pc","pc","nslookup app.example.com"],
    ["pc","pc","curl http://app.example.com"],["cli","r","show ip nat translations"]]})}
${K.hint(`Task 1: two NAT lines on the way in (ABJ-R1's PAT, then VPC-R1's static NAT) and two on the way back; APP1 sees 203.0.113.2. Task 3: ISP-R1 has no route for 10.100.0.10 and answers &ldquo;Destination host unreachable&rdquo;: internet routers carry only public addresses. Task 4: hop 2 becomes 10.255.9.1. Task 5: the route only helps packets addressed to 10.100.x.x, and the public DNS still answers 198.51.100.10.`)}
${K.hint(`Twist to think about: the finance team in Kano uses the public name over the internet, and the app team wants to close the public address entirely. What must the Kano branch have first?`, "Twist")}
${K.reveal("Show the reasoning", `<p><b>1. What is asked?</b> What Kano needs before the public path goes. <b>2. Which rule?</b> Traffic takes the private path only if it is <b>routed</b> there and <b>addressed</b> to the private address, which is reachable only over a private path. <b>3. Apply it:</b> Kano needs a private path to the VPC (its own circuit, an IPsec VPN to the cloud's private gateway, or the company WAN via Abuja), a route for 10.100.0.0/16, and DNS that returns 10.100.0.10. Close the public address first and Kano is down: the other half of the opening ticket.</p>`)}

${K.case("A bank moves its reporting platform to a public cloud", `
<p><b>The situation:</b> a mid-sized bank (head office Lagos, recovery site Abuja, 60 branches on MPLS) moves its reporting platform to a public cloud. Each night about 400 GB replicates from the core banking system, which stays on-premises. Regulators require customer data to travel only over encrypted paths; the board wants no single point of failure.</p>
<p><b>Models:</b> <b>PaaS</b> for the database and analytics (the provider patches and scales them), <b>IaaS</b> for two virtual firewalls in front of them. On-premises systems and the public cloud, joined by private links and shared DNS: <b>hybrid</b>.</p>
<p><b>Addressing:</b> the cloud team proposed 10.0.0.0/16, a common example default, which would have overlapped head office. The network team gave the VPC 10.200.0.0/16 from the address plan, with subnets in two Availability Zones.</p>
<p><b>Connectivity:</b> 400 GB a night is about 90 Mb/s for ten hours: steady, and too important for best effort. So option ③: two direct connections from colocation sites near Lagos and Abuja to different provider locations, so losing a circuit, router or building leaves the other. Private circuits aren't encrypted by default, so IPsec runs over each one (lesson 3). An <b>internet VPN</b> is the last-resort path with a worse preference: a floating route in Module 5's terms. An intercloud exchange was considered, but with one provider and no plan to move, two circuits were simpler.</p>
<p><b>DNS and security:</b> a private zone for the reporting names, with head-office DNS forwarding it to resolver endpoints in the VPC, so analysts get private addresses. Security groups allow only the replication servers and analysts' subnets.</p>
<p><b>Lesson:</b> the first night ran one circuit at 85%, so capacity was added before go-live. Every design question was a new-branch question: addresses, paths, backups, names, firewall rules. Only the console changed.</p>`)}
${K.dodont([
  "Take every VPC range from the company address plan.",
  "Change route, DNS and firewall together when an app's path moves.",
  "Prove the path from a client: <code>nslookup</code>, <code>tracert</code>, the NAT table.",
  "Give a private cloud link a backup, usually an internet VPN.",
],[
  "Don't assume a private circuit is encrypted.",
  "Don't backhaul all SaaS through head office without checking capacity.",
  "Don't call a virtualised server room a private cloud.",
  "Don't remove a public endpoint before every site has a private path and DNS.",
])}

<h2>Interview corner</h2>
${K.hint(`Draw the stack, say where the line sits for each model, give one example each, and mention shared responsibility.`)}
${K.reveal("&ldquo;Explain IaaS, PaaS and SaaS, with an example of each.&rdquo;", `<p>"They're NIST's three service models, and the difference is where the line sits between what the provider manages and what I manage. In IaaS I get virtual machines, storage and networks and manage the OS up, like EC2 instances I patch myself. In PaaS I bring code and data and the provider runs the OS, runtime and scaling, like a managed database. In SaaS I just use the application, like cloud email. In all three I still own users, data and access: shared responsibility. For the network, IaaS means I still design subnets, routes, gateways and firewall rules; SaaS mostly means getting the path and internet capacity right."</p>`)}
${K.hint(`List the four options, then give the trade-offs (performance, SLA, encryption, setup time, portability), and finish with a combination.`)}
${K.reveal("&ldquo;How would you connect our offices to a VPC, and how would you choose?&rdquo;", `<p>"Four ways. The internet with TLS for public services. An internet VPN, IPsec to the cloud's VPN gateway: private to private, encrypted, in an hour, but best effort. A private WAN or direct connection such as Direct Connect or ExpressRoute: predictable with an SLA, but weeks to order and not encrypted by default. An intercloud exchange: one circuit to many clouds, if we're multicloud. I'd choose by volume, latency, compliance and how long we'll stay with the provider; a common design is a direct connection with an IPsec VPN as backup. Then I'd check the VPC range doesn't overlap ours, routes exist on both sides, DNS gives staff the private addresses and security groups allow only what's needed, and prove the path with nslookup and tracert from a branch PC."</p>`)}
${K.hint(`Name the five characteristics and say which a virtualised server room usually lacks.`)}
${K.reveal("&ldquo;We have VMware in our server room. Is that a private cloud?&rdquo;", `<p>"Not automatically. NIST SP 800-145 gives five essential characteristics: on-demand self-service, broad network access, resource pooling, rapid elasticity and measured service. A VMware cluster gives pooling and network access. If departments email IT and wait days for a VM, there's no self-service; if it can't grow quickly, no elasticity; if nobody meters use, no measured service. Add a self-service portal, capacity handed out and reclaimed automatically, and metering with chargeback, and it's a private cloud: private because only we use it, wherever the hardware sits."</p>`)}

${K.recap([
  "NIST SP 800-145: on-demand network access to a shared pool of resources, rapidly provisioned and released with minimal provider interaction.",
  "Five characteristics: on-demand self-service, broad network access, resource pooling, rapid elasticity, measured service. Virtualisation alone isn't cloud.",
  "Service model = who manages the OS: IaaS (you), PaaS (provider; you bring code), SaaS (provider; you just use it). You always own users, data and access.",
  "Deployment model = who may use it: public, private, community, hybrid (clouds bound together). Multicloud isn't a NIST model.",
  "Four paths: internet, internet VPN, private WAN or direct connection, intercloud exchange. Private circuits aren't encrypted by default.",
  "Moving an app moves path, addresses, names and security: change route, DNS and firewall rules together.",
  "VPC: range, subnets, route tables (public = default route to the internet gateway), internet gateway (1:1 NAT), NAT gateway, private gateway, security groups (stateful), network ACLs (stateless); five reserved addresses per subnet.",
])}
${K.next(`<b>Lesson 8 — Putting it together: troubleshooting WAN, tunnel and VRF problems.</b> A fault-finding method for GRE tunnels and VRFs, the Module 10 challenge with six independent faults, and the portfolio project: design the WAN for the three-site network, including how it reaches the cloud.`)}
`,
quiz:[
  {lvl:1, type:"order", q:"Put NIST's five essential characteristics of cloud computing in the order SP 800-145 lists them.", items:["On-demand self-service","Broad network access","Resource pooling","Rapid elasticity","Measured service"], why:"NIST SP 800-145 lists them in this order. Memory aid: Our Big Rented Room is Metered."},
  {lvl:1, type:"match", q:"Match each service model with what the customer manages.", pairs:[["IaaS","The operating system, runtime, applications and data on rented virtual machines"],["PaaS","Only the applications it deploys and their data; the provider runs the OS and runtime"],["SaaS","Only its users and application settings; the provider runs the whole application"]], why:"The line moves up the stack from IaaS to SaaS. The question that decides it is who manages the operating system: the customer in IaaS, the provider in PaaS and SaaS."},
  {lvl:1, q:"Which NIST deployment model is provisioned for exclusive use by a single organisation and may be on or off its premises?", o:["Public","Private","Community","Hybrid"], a:1, why:"Private cloud: exclusive use by one organisation (which may have many business units). It can be in the organisation's own data centre or hosted by a third party. Location doesn't decide the model."},
  {lvl:1, type:"fill", q:"Which NIST essential characteristic means a customer can create servers or storage itself, when it needs them, without a person at the provider handling the request?", fields:[{label:"Characteristic", a:["on-demand self-service","on demand self service","on-demand self service","self-service","self service"]}], why:"On-demand self-service: the consumer provisions capabilities unilaterally and automatically, with no human interaction with the provider for each request (a console, CLI or API)."},
  {lvl:1, q:"In an AWS VPC, what makes a subnet a public subnet?", o:["It has more than 250 addresses","Its route table has a route for 0.0.0.0/0 pointing to an internet gateway","It uses addresses outside RFC 1918","It has a NAT gateway in it"], a:1, why:"A subnet is public only because of its route table: a default route to the internet gateway. A private subnet may reach the internet outbound through a NAT gateway, but it has no route to the internet gateway itself."},
  {lvl:2, q:"A hospital group's IT team says it runs a private cloud. Departments request VMs by email and wait about a week; the hosts are shared; a fixed annual charge is split equally between departments; adding capacity means buying servers. Which statement is most accurate?", o:["It is a private cloud because only the hospital group uses it","It is a virtualised data centre: it lacks on-demand self-service, rapid elasticity and measured service","It is a community cloud because several departments share it","It is a public cloud because the hosts are shared"], a:1, why:"Being used by one organisation makes it private only if it is a cloud first. Email requests (no self-service), weeks to add capacity (no rapid elasticity) and a flat split (no metering) fail three of NIST's five. Departments of one organisation are business units, not a community."},
  {lvl:2, type:"multi", q:"A company moves its HR application from its own servers to SaaS. Which two responsibilities stay with the company? (Choose two.)", o:["Patching the application servers' operating systems","Deciding which staff get accounts and what they can see","Replacing failed disks in the provider's data centre","Making sure the offices have enough internet capacity and a working path to the service","Scaling the application's database when usage grows"], a:[1,3], why:"In SaaS the provider runs the application, the OS, the hardware and the scaling. The customer keeps users and access (shared responsibility) and, for the network team, the path: internet capacity, breakout and DNS."},
  {lvl:2, q:"Which description matches an intercloud exchange?", o:["An IPsec tunnel from a branch router to a cloud VPN gateway","A provider, usually in a colocation data centre, connected to many cloud providers, so one private circuit from the customer can reach several clouds","A cloud service that copies data between two regions of the same provider","The internet gateway that does NAT for a VPC"], a:1, why:"An intercloud exchange gives one private circuit to the exchange and short virtual connections from there to each cloud, which makes multicloud and moving between providers easier than ordering a new circuit per provider."},
  {lvl:2, q:"An Abuja PC gets the exhibit's results. The company has a working private link and route from Abuja to its VPC (10.100.0.0/16). Why does the app traffic still cross the internet?", ex:"C:\\Users\\aisha>nslookup app.example.com\nServer:  ns1.example.com\nAddress:  192.0.2.53\n\nName:    app.example.com\nAddress:  198.51.100.10\n\nC:\\Users\\aisha>tracert app.example.com\n\nTracing route to app.example.com [198.51.100.10]\nover a maximum of 30 hops:\n\n  1    <1 ms    <1 ms    <1 ms  10.40.1.1\n  2     8 ms     7 ms     8 ms  203.0.113.1\n  3    12 ms    11 ms    12 ms  198.51.100.2\n  4    12 ms    12 ms    12 ms  198.51.100.10\n\nTrace complete.", o:["The private link is down","The PC asks a public DNS server, which returns the app's public address, so the packets follow the default route to the ISP","The VPC's route table has no route back to Abuja","The PC's default gateway is wrong"], a:1, why:"The route to 10.100.0.0/16 only catches packets addressed to private cloud addresses. DNS returned 198.51.100.10, a public address, so the router uses its default route (hop 2 is the ISP). Point the PCs at a resolver that answers with the private address (split-horizon DNS)."},
  {lvl:2, type:"fill", q:"An AWS subnet is 10.30.4.0/27. How many addresses can be assigned to instances, and what is the VPC router's address in this subnet?", fields:[{label:"Usable addresses", a:["27"]},{label:"VPC router", a:["10.30.4.1"]}], why:"A /27 has 32 addresses. AWS reserves five per subnet: the network address, base + 1 (the VPC router), base + 2 (DNS), base + 3 (future use) and the last address. 32 − 5 = 27; the router is 10.30.4.1."},
  {lvl:2, q:"A branch router has a default route to its ISP and the route 10.120.0.0/16 via a private link. A cloud database is at 10.120.9.40. The exhibit shows the router's output. What happens to a packet from a branch PC to 10.120.9.40?", ex:"PH-R1#show ip route 10.120.9.40\nRouting entry for 10.120.0.0/16\n  Known via \"static\", distance 1, metric 0\n  Routing Descriptor Blocks:\n  * 10.255.20.1\n      Route metric is 0, traffic share count is 1", o:["It follows the default route to the ISP, because the default route was configured first","It is sent to 10.255.20.1 over the private link, because the /16 is the longest match","It is dropped, because two routes match","It is load-shared between the ISP and the private link"], a:1, why:"Longest match: 10.120.0.0/16 is more specific than 0.0.0.0/0, so the router forwards to 10.255.20.1. The output confirms the static route is the entry chosen for that address."},
  {lvl:2, type:"multi", q:"Which two statements about AWS security groups and network ACLs are correct? (Choose two.)", o:["Security groups are stateful: return traffic for an allowed connection is allowed automatically","Network ACLs are stateful and apply to each server","Network ACLs are stateless and apply at the subnet, with numbered allow and deny rules","Security groups can contain deny rules that override allow rules","Security groups apply to whole VPCs only"], a:[0,2], why:"Security groups attach to a server's interface, contain allow rules only and are stateful, like Module 8's stateful firewall. Network ACLs attach to subnets, are stateless (return traffic needs its own rule, like an extended ACL) and are evaluated in number order with allow and deny."},
  {lvl:3, q:"A logistics firm will replicate 1 Gb/s to a public cloud all day and needs predictable delay. Regulators require the data to be encrypted in transit, and the firm wants to survive the loss of one path. Which design fits best?", o:["An internet VPN only, because it is encrypted","A direct connection only, because it is private and therefore encrypted","Two direct connections at different locations with IPsec running over them, plus an internet VPN as a last-resort backup","SaaS replication over the internet using HTTPS only, with no private path"], a:2, why:"Steady 1 Gb/s with predictable delay calls for private circuits, and two at different locations remove a single point of failure. Private circuits aren't encrypted by default, so IPsec runs over them to meet the regulator. A VPN alone is best effort; one direct connection is neither encrypted nor redundant."},
  {lvl:3, q:"A cloud team builds a VPC with 10.40.0.0/16 and a private link to the Abuja office. Abuja already uses 10.40.0.0/16 internally. Abuja users can't reach any cloud server over the link. What is the root cause, and the cleanest fix?", o:["The private link needs QoS; enable it","The ranges overlap, so neither side can route to the other; renumber the VPC with a range from the company's address plan","DNS is wrong; add split-horizon DNS","The security groups block Abuja; allow 10.40.0.0/16"], a:1, why:"With the same prefix on both sides, Abuja's router sees 10.40.0.0/16 as its own LAN and never sends those packets over the link (and the VPC treats them as local). NAT could hide the overlap but complicates everything; the clean fix is a non-overlapping VPC range, which is why cloud ranges belong in the address plan from the start."},
  {lvl:3, q:"After branches move email and meetings to SaaS, calls from every branch freeze in the afternoons. Branches have no internet link; all their traffic goes over the MPLS WAN to head office and out through the head-office firewall, and both the branch WAN links and the head-office internet link are near full. Which long-term change addresses the cause?", o:["Add a second DNS server at head office","Give each branch a local internet link and break out SaaS traffic locally, with security at the branch and SD-WAN choosing the path per application","Move the SaaS provider's servers into the head-office data centre","Shorten the DHCP lease time at each branch"], a:1, why:"The cause is the traffic pattern: branch-to-cloud traffic is backhauled through head office. Local internet breakout sends it straight to the provider, freeing the WAN and the head-office link; security must then be applied at each branch, and SD-WAN (lesson 4) can steer each application. DNS and DHCP changes don't affect capacity, and SaaS servers can't be moved on-premises."},
],
cards:[
  {f:"NIST SP 800-145 definition of cloud computing", b:"\"A model for enabling ubiquitous, convenient, on-demand network access\" to a shared pool of configurable resources (networks, servers, storage, applications, services), provisioned and released quickly with minimal management effort or provider interaction. Published September 2011 (Mell and Grance): 5 characteristics, 3 service models, 4 deployment models."},
  {f:"The five essential characteristics", b:"On-demand self-service, broad network access, resource pooling (multi-tenant), rapid elasticity, measured service. Memory aid: Our Big Rented Room is Metered. Virtualisation alone isn't a cloud."},
  {f:"IaaS", b:"Infrastructure as a service: the provider supplies compute, storage and networks; the customer manages the operating system and everything above it (e.g. rented virtual machines, virtual networks, firewall VMs)."},
  {f:"PaaS", b:"Platform as a service: the provider runs the servers, OS and runtime; the customer deploys its own application code and data (e.g. a managed app platform, a managed database)."},
  {f:"SaaS", b:"Software as a service: the provider runs the whole application; the customer uses it (browser or app) and manages only users and settings (e.g. cloud email, online meetings)."},
  {f:"Shared responsibility", b:"The provider secures what it runs (facilities, hardware, hypervisor, and more as you go from IaaS to SaaS); the customer always owns its users, data and access, and in IaaS also the OS and firewall rules."},
  {f:"The four deployment models", b:"Decided by who may use the infrastructure. Public: anyone (on the provider's premises). Private: one organisation (on or off premises). Community: a group of organisations with shared concerns. Hybrid: two or more distinct clouds bound together for data and application portability (e.g. cloud bursting). Multicloud isn't a NIST model."},
  {f:"Four ways to reach a public cloud", b:"1. The internet (TLS per app). 2. Internet VPN (IPsec site-to-site). 3. Private WAN or direct connection (MPLS, AWS Direct Connect, Azure ExpressRoute, Google Cloud Interconnect): predictable, SLA, weeks to order, not encrypted by default. 4. Intercloud exchange: one circuit to an exchange connected to many clouds."},
  {f:"Backhaul vs local internet breakout", b:"Backhaul: branch internet and cloud traffic goes over the WAN to head office first (central security, but delay and full links). Local breakout: each branch goes straight to the internet (faster, but security needed at every branch; SD-WAN helps choose per application)."},
  {f:"Where DNS, DHCP and security live in IaaS", b:"DHCP: the platform assigns VM addresses (options via settings such as AWS DHCP option sets). DNS: provider resolver plus private zones; split-horizon gives staff the private address (offices need a resolver endpoint). Security: security groups, network ACLs and virtual firewalls instead of one edge firewall."},
  {f:"VPC building blocks (AWS names)", b:"VPC: your address range in one region (/16 to /28). Subnet: a slice in one Availability Zone. Route table: longest match; public subnet = 0.0.0.0/0 to the internet gateway. Internet gateway: 1:1 NAT for public IPs. NAT gateway: outbound only. Private gateway or transit gateway: VPN and direct connections land here."},
  {f:"Security group vs network ACL", b:"Security group: on each server interface, allow rules only, stateful (replies return automatically). Network ACL: on each subnet, numbered allow and deny rules in order, stateless (return traffic needs its own rule)."},
  {f:"AWS reserved addresses per subnet", b:"Five: the network address, base + 1 (VPC router, the subnet's gateway), base + 2 (DNS), base + 3 (future use) and the last address. A /24 gives 251 usable, a /28 gives 11."},
],
});

// ---------- Module 10 · Lesson 8 ----------
L.push({
id:"wan-trouble", mins:140, level:"Intermediate · builds on Module 10 lessons 1–7",
t:"Putting it together: troubleshooting WAN, tunnels and VRFs, the Module 10 challenge and a portfolio project",
html:`
${K.goals([
  "Troubleshoot any tunnel or VRF problem in four layers — road, pipe, map, room — and stop at the first one that fails.",
  "Name why a GRE tunnel is down from show interfaces tunnel, the routes and the log — and tell a useful up/up from a useless one.",
  "Find VRF faults: an interface outside its VRF, a static or OSPF process in the wrong table, a test from the wrong table, an overlap refused.",
  "Fix six independent GRE and VRF faults in the Module 10 challenge without deleting tunnels or VRFs to hide a symptom.",
  "Design and document the WAN for your three-site network — links, tunnels, guest and staff VRFs, cloud connectivity — as a portfolio project.",
])}
${K.pre(["Module 10 lessons 1–7, especially lesson 3 (GRE: source, destination, protocol 47, MTU 1476, recursive routing, OSPF over a tunnel) and lesson 6 (VRF-Lite: vrf forwarding, ip route vrf, router ospf N vrf, show ip route vrf, ping vrf).","Module 5 (statics, floating statics, OSPF), Module 7 (NAT), Module 8 (ACLs, IPsec VPN concepts)."])}

<h2>Why this matters at work</h2>
<p>Monday, 07:40, a managed-service provider's operations centre in Lagos. A freight company's weekend changes: a replacement router in Sokoto, a new depot-to-depot tunnel, guest Wi-Fi moved into a VRF, an acquired office plugged into the head-office router. Six tickets are open, and two say &ldquo;the tunnel is up&rdquo; as if that settled anything.</p>
<p>Tunnels and VRFs fail in a few ways, each leaving a fingerprint in a command you already know. What slows people down is looking in the wrong place: debugging OSPF when the GRE packets never crossed the internet, or reading the global table for a route that lives in a VRF. This lesson gives you an order to look in, the fingerprints, a broken three-site WAN and a portfolio design.</p>

<h2>The method: road, pipe, map, room</h2>
${K.remember(`<p><b>The WAN troubleshooting rule:</b> a packet between two sites over a tunnel depends on four layers, each built on the one below. <b>Road</b> — can the two tunnel endpoints reach each other across the underlay, GRE included? <b>Pipe</b> — is the tunnel interface up/up, and does up/up mean anything? <b>Map</b> — is the routing protocol FULL across the tunnel, with the right routes? <b>Room</b> — is every interface, route and test in the right VRF? Check from the bottom up and <b>stop at the first &ldquo;no&rdquo;</b>. Memory hook: <b>&ldquo;Road, pipe, map, room.&rdquo;</b></p>`)}
<p>Why this order: a tunnel rides on the underlay, OSPF hellos ride inside the tunnel, and a perfect global map does nothing for a guest in a VRF. Fixing a higher layer above a broken one changes nothing you can measure.</p>
${K.svg("0 0 760 262",
  [["1 · Road","the underlay",["show ip route &lt;far IP&gt;","ping &lt;far IP&gt; source &lt;WAN&gt;","ACLs: permit gre"],["WAN down · bad default","ACL drops protocol 47"]],
   ["2 · Pipe","the tunnel",["show ip interface brief","show interfaces tunnel 0","show logging"],["source down / not ours","wrong destination"]],
   ["3 · Map","overlay routing",["show ip ospf neighbor","show ip ospf int brief","show ip route ospf"],["tunnel not in a network","area mismatch · passive"]],
   ["4 · Room","the right VRF",["show ip vrf interfaces","show ip route vrf X","ping vrf X &lt;ip&gt;"],["interface outside its VRF","static in the wrong table"]]].map(([t,s,ev,fa],k)=>{ const x = 10+k*188; return K.txt(x+86,20,"layer "+(k+1),{mid:true,s:9.5})+K.box(x,28,172,58,t,s,k===0)+K.txt(x+86,110,"evidence",{mid:true,s:9.5,c:"accent"})+ev.map((l,j)=>K.txt(x+86,126+j*14,l,{mid:true,s:9.5,c:"fg"})).join("")+K.txt(x+86,184,"if “no”, usually",{mid:true,s:9.5,c:"bad"})+fa.map((l,j)=>K.txt(x+86,200+j*14,l,{mid:true,s:9.5,c:"fg"})).join(""); }).join("")+
  [0,1,2].map(k=>K.arrow(184+k*188,57,196+k*188,57)).join("")+
  K.txt(380,248,"Bottom up: a fault in a lower layer makes every higher layer look broken too.",{mid:true,f:"body",s:11.5,c:"fg"}),
  "The four layers of a tunnelled, VRF-separated WAN, the evidence for each and the faults that usually close it.")}
<h3>What each layer really asks</h3>
<ol>
<li><b>Road.</b> The outer packets go from one public address to the other, protocol 47. Each router needs a route to the far endpoint (the default counts), and every ACL on the way must permit GRE. A ping between the public addresses proves only that ICMP crosses.</li>
<li><b>Pipe.</b> A GRE tunnel is up/up when its source is an up interface with an address, and its destination is set and routable — not through the tunnel itself. The far end needn't answer unless you configure a keepalive; without one, up/up describes this router only.</li>
<li><b>Map.</b> OSPF must run on the tunnel at both ends, same area, not passive, one subnet. The neighbour shows <code>FULL/  -</code> on the tunnel and far LANs arrive as <code>O … [110/1001]</code> via the far tunnel address. The underlay must <i>never</i> be advertised into the tunnel, or recursive routing takes the pipe down.</li>
<li><b>Room.</b> Every interface, route, OSPF process and test belongs to one table — global or one VRF: <code>ip route vrf</code>, <code>router ospf N vrf</code>, <code>show ip route vrf</code>, <code>ping vrf</code>. Most VRF tickets are one of these in the wrong table.</li>
</ol>
${K.analogy(`<p>A sealed envelope inside a courier bag between two offices. Is the road open for the van (road)? Is the bag addressed right at both ends (pipe)? Does each office's directory list the other's rooms (map)? Is the letter going to the right building's room 10, when both buildings have one (room)? Nobody re-reads the directory while the road is closed.</p>`)}
<h3>Worked ticket: the Asaba tunnel is up, but the neighbour is gone</h3>
<p>An Asaba branch (AS-R1) reaches Lagos (LG-R1) over a GRE tunnel with OSPF. At 08:32 the security team applied their standard internet-edge ACL 110 inbound on AS-R1's WAN interface. Ticket at 08:40: &ldquo;Asaba can't reach any Lagos system, but the tunnel shows up.&rdquo; Replayed in the lab:</p>
${K.steps([
  ["Road","<code>ping 203.0.113.42 source g0/1</code> (Lagos's public address, from Asaba's WAN) succeeds. Hold that thought: ICMP is not GRE."],
  ["Pipe","<code>show ip interface brief | include Tunnel</code>: <code>up up</code>, no keepalive — Asaba's own settings only."],
  ["Map","<code>show ip ospf neighbor</code> is empty; the log says <i>Dead timer expired</i> at 08:33, one dead interval (40 seconds) after the ACL arrived. Hellos stopped arriving."],
  ["Back down to the road","Hellos travel <i>inside</i> GRE. The new ACL permits ICMP and established TCP, then <code>deny ip any any log</code> — protocol 47 matches the deny. The road was open for pings only."],
  ["Fix and prove","Above the deny: <code>ip access-list extended 110</code>, <code>5 permit gre host 203.0.113.42 host 198.51.100.66</code>. The neighbour returns and AS-PC's ping to Lagos gets <code>TTL=126</code> replies."],
])}
${K.out(`AS-R1#show ip interface brief | include Tunnel
Tunnel0                172.16.40.2     YES manual up                    up
AS-R1#show logging
*Oct 12 08:33:09.699: %OSPF-5-ADJCHG: Process 1, Nbr 4.4.4.1 on Tunnel0 from FULL to DOWN, Neighbor Down: Dead timer expired
AS-R1#show access-lists
Extended IP access list 110
    5 permit gre host 203.0.113.42 host 198.51.100.66
    10 permit icmp any any (5 matches)
    20 permit tcp any any established
    30 deny ip any any log`, "Replayed in the lab, the log trimmed to one line. On real kit the deny line's counter also climbs and the log shows protocol 47 denied; the lab doesn't count OSPF hellos against ACL lines.")}
${K.mistake(`Trusting <i>up/up</i> on a tunnel without keepalives. It means &ldquo;my source works and I have a route to the destination&rdquo; — nothing about the far end, the ISP or an ACL. Check the map or test with traffic first.`)}
${K.dodont([
  "Write down which layer you're testing and what would prove it.",
  "Test the road with what really crosses it: check every ACL for protocol 47.",
  "Change one thing, then re-check the same layer before moving up.",
],[
  "Delete and recreate a tunnel or VRF to &ldquo;reset&rdquo; it — you lose the evidence and the addresses.",
  "Add <code>network 0.0.0.0 255.255.255.255 area 0</code> to make OSPF &ldquo;just work&rdquo;.",
  "Test a VRF with a plain <code>ping</code> from the router.",
])}
${K.check({q:"A tunnel shows up/up at both ends, no keepalives are configured, and show ip ospf neighbor is empty on both routers. What can you conclude?", o:["The road and the pipe are proven; the fault must be in OSPF","Only that each router has a valid source and a route to its destination — the GRE packets may still be dropped on the way, or the far end's tunnel may not match","The tunnel works; restart OSPF","The VRF is wrong"], a:1, why:"Without keepalives, up/up is local: a working source and a routable destination. A road that drops protocol 47 or a mismatched far end both leave it up/up — so go back down if the hellos aren't arriving."})}
<h3>Same logic, new situation</h3>
${K.q({type:"match", q:"Four tickets from a bank's branch WAN on the morning after a change window. Match each with the first of the four layers that fails.", pairs:[["Ilorin: Tunnel0 is up, line protocol is down; the WAN default route was deleted by mistake","Layer 1 — road"],["Jos: the WAN works, but Tunnel0's source is an interface that is shut","Layer 2 — pipe"],["Owerri: both tunnels up/up, but the branch tunnel's subnet is in no OSPF network statement","Layer 3 — map"],["Kaduna: OSPF is FULL, but guests on the VRF GUEST subinterface have no default route in their table","Layer 4 — room"]], why:"1. What is asked? The first failing layer for each. 2. Which rule? Road, pipe, map, room — bottom up, stop at the first no. 3. Apply it: no route to the tunnel destination breaks the road (the pipe goes down because of it); a shut source breaks the pipe with a working road; up/up tunnels with no OSPF on one end is the map; a full map in the global table can't help a VRF that lacks its own route — the room."})}

<h2>Tunnel fingerprints: down, or up and useless</h2>
${K.remember(`<p><b>The line-protocol rule (lesson 3):</b> a GRE tunnel is <b>up/up</b> when (1) it isn't shut, (2) its source is an up/up interface with an address — on <i>this</i> router, (3) a destination is set, (4) the destination is routable, but not through the tunnel, and (5) with a keepalive, the far end answers. IOS checks them in roughly that order, so fixing one can reveal the next.</p>`)}
<div class="tablewrap"><table>
<tr><th>Tunnel shows</th><th>Fingerprint</th><th>Usual cause → smallest fix</th></tr>
<tr><td>administratively down / down</td><td><code>shutdown</code> on Tunnel0</td><td>Someone shut it → <code>no shutdown</code></td></tr>
<tr><td>up / down</td><td>The source interface is down, or the source line has no interface in brackets (not this router's address)</td><td>ISP move or renumbering → <code>tunnel source</code> = the live WAN <i>interface</i></td></tr>
<tr><td>up / down</td><td>No route to the destination, not even a default</td><td>Default missing or its next hop unresolvable → fix the underlay route</td></tr>
<tr><td>up / down, flapping on real kit</td><td><code>%TUN-5-RECURDOWN</code>; the destination learned by OSPF via the tunnel</td><td>Underlay advertised into the tunnel → specific <code>network</code> statements; a /32 static to the destination via the ISP</td></tr>
<tr><td>up / down with keepalive</td><td><code>Keepalive set (10 sec), retries 3</code>; no replies</td><td>Far end dead or mismatched, or GRE dropped → far end, then road</td></tr>
<tr><td>up / up, nothing passes</td><td>No keepalive; the ends don't mirror, or an ACL drops protocol 47; frame log: the far router can't unwrap it</td><td>Destination typo → each end's destination = the other's source</td></tr>
<tr><td>up / up, no neighbour</td><td><code>show ip ospf interface brief</code> lacks <code>Tu0</code>, or an area mismatch is logged</td><td>Map fault → add the tunnel subnet to OSPF in the right area</td></tr>
</table></div>
<h3>Keepalives: making &ldquo;up&rdquo; mean something</h3>
<p>An Ilorin branch reaches head office with a static route out Tunnel0 and no routing protocol. When head office powered its router off for maintenance, Ilorin's tunnel stayed up/up, the static stayed, and every packet vanished into a ${K.g("black hole","A path that silently swallows traffic: the router keeps forwarding into it because nothing tells it the far side is gone.")}. With <code>keepalive 10 3</code>, unanswered keepalives take the line protocol down, the static leaves the table, and a floating backup route (Module 5) can take over:</p>
${K.out(`IL-R1(config-if)#keepalive 10 3
*Oct 12 08:32:55.425: %LINEPROTO-5-UPDOWN: Line protocol on Interface Tunnel0, changed state to down
IL-R1#show interfaces tunnel 0
Tunnel0 is up, line protocol is down
  Hardware is Tunnel
  Internet address is 172.16.44.2/30
  MTU 9976 bytes, BW 100 Kbit/sec, DLY 50000 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation TUNNEL, loopback not set
  Keepalive set (10 sec), retries 3
  Tunnel source 198.51.100.14 (GigabitEthernet0/1), destination 203.0.113.6`, "Replayed in the lab (later lines trimmed). The lab takes the tunnel down at once; a real router waits for the three missed keepalives, about 30 seconds.")}
<p>With OSPF over the tunnel the dead timer already removes a silent neighbour's routes; keepalives still make <code>show ip interface brief</code> honest.</p>
${K.dyk(`The <code>MTU 9976 bytes</code> in <code>show interfaces tunnel</code> is not what the tunnel can carry. The real limit is further down: <code>Tunnel transport MTU 1476 bytes</code> (1500 minus 24 bytes of outer IP and GRE header), shown by <code>show ip interface tunnel 0</code> as <code>MTU is 1476 bytes</code>.`)}
${K.exam(`Read tunnel and VRF exhibits by their headers first. <code>is up, line protocol is down</code> is a protocol problem (source, route, recursion, keepalive), not a shutdown (<code>administratively down</code>). <code>Routing Table: GUEST</code> means a VRF table, not the global one, and a command that <i>verifies</i> a VRF names it (<code>show ip route vrf …</code>, <code>ping vrf …</code>). VRFs are v1.1 topic 1.12; v2.0 drops them from its text, but the job hasn't.`)}
<h3>Try it: a depot tunnel after an ISP renumbering</h3>
<p>On Friday the ISP renumbered the Kaduna depot's line: KD-R1's WAN is now 198.51.100.50/30, gateway .49 (it was .54, gateway .53). Someone updated Gi0/1 and nothing else; the tunnel to Abuja (203.0.113.30) has been down since.</p>
${K.hint(`Does the source line of <code>show interfaces tunnel 0</code> name one of the router's interfaces in brackets? Then: is there a route to the destination? A static whose next hop is on no connected subnet never enters the table.`)}
${K.term({env:"ios2", title:"KD-R1 — the tunnel that didn't follow the renumbering", opts:{kind:"router", host:"KD-R1", model:"ISR4331", motd:"KD-R1 — console session. WAN Gi0/1 198.51.100.50/30, ISP gateway 198.51.100.49. Tunnel0 to Abuja HQ 203.0.113.30."},
  setup:e=>{ ["enable","configure terminal","hostname KD-R1","no ip domain-lookup",
    "interface g0/0","description DEPOT LAN","ip address 10.70.0.1 255.255.255.0","no shutdown",
    "interface g0/1","description WAN to ISP (renumbered Friday)","ip address 198.51.100.50 255.255.255.252","no shutdown",
    "interface Tunnel0","description GRE to Abuja HQ","ip address 172.16.70.2 255.255.255.252","tunnel source 198.51.100.54","tunnel destination 203.0.113.30","exit",
    "ip route 0.0.0.0 0.0.0.0 198.51.100.53","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code> (no password here). The router is alone, so nothing answers across the tunnel — you're fixing the pipe.",
  tasks:[
    {text:"Gather the pipe's evidence: <code>show ip interface brief</code> (Tunnel0's status) and <code>show interfaces tunnel 0</code> (its source and destination line)", done:e=>e.history.some(h=>/^sh\S*\s+ip\s+int\S*\s+br/i.test(h)) && e.history.some(h=>/^sh\S*\s+int\S*\s+tu\S*\s*0$/i.test(h))},
    {text:"Fix the source so the next renumbering can't break it: under <code>interface Tunnel0</code>, <code>tunnel source g0/1</code> — name the interface, not an address", done:e=>{ const t=e.intfs.Tunnel0; return !!t && !!t.tun && t.tun.src==="GigabitEthernet0/1"; }},
    {text:"The pipe's next question: route to the destination? Replace the default route with one via the ISP's new gateway (<code>no ip route 0.0.0.0 0.0.0.0 198.51.100.53</code>, then <code>ip route 0.0.0.0 0.0.0.0 198.51.100.49</code>). Done when Tunnel0 is up/up", done:e=>{ const t=(e.tunInfo()||[]).find(x=>x.ios==="Tunnel0"); return !!t && t.up && e.routes.some(r=>!r.vrf && r.net==="0.0.0.0" && r.nh==="198.51.100.49") && !e.routes.some(r=>r.nh==="198.51.100.53"); }},
    {text:"Prove and save: <code>show interfaces tunnel 0</code> again (line protocol up, source shown with its interface), then <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && ((e.tunInfo()||[]).find(x=>x.ios==="Tunnel0")||{}).up===true},
  ],
  win:"Two faults on one pipe, revealed in the router's own order. The source was typed as the old address, which the router no longer owns — the bracket with the interface name was missing from the source line. Then the default route pointed at the old gateway, which isn't on any connected subnet, so it never entered the table and the destination had no route. Naming the interface as the source survives the next renumbering; the default route was the road under the pipe.",
  solve:["enable","show ip interface brief","show interfaces tunnel 0","configure terminal","interface Tunnel0","tunnel source g0/1","exit",
    "no ip route 0.0.0.0 0.0.0.0 198.51.100.53","ip route 0.0.0.0 0.0.0.0 198.51.100.49","end","show interfaces tunnel 0","copy running-config startup-config",""]})}
<h3>Hands-on: walk the layers on one broken tunnel</h3>
<p>Three faults on <i>one</i> path, as in many real tickets: each fix reveals the next. One line of the clinic's old template will trip you twice.</p>
${K.bench({id:"m10-walk-layers", points:120, openLog:true, from:"CCNA · Module 10 · lesson 8", title:"Benin City clinic — a new tunnel to Abuja that never carried a packet: road, pipe, map, in order", viewBox:"0 0 800 270",
  intro:"A health group's Benin City clinic (BN-R1) was joined to Abuja head office (AB-R1) by a GRE tunnel with OSPF; CLINIC-PC still can't reach HQ-PC. <b>Access:</b> your console cable is on BN-R1 (9600 8N1, no flow control, no enable password); move it to AB-R1 when you need it. <b>Design:</b> ISP gateways 198.51.100.33 (clinic) and 203.0.113.17 (HQ); tunnel 172.16.60.0/30 (AB-R1 .1, BN-R1 .2); OSPF process 1, area 0, router IDs 6.6.6.1 and 6.6.6.2; LANs 10.60.0.0/24 and 10.61.0.0/24. Only the LANs and the tunnel subnet belong in OSPF. <b>Lab note:</b> real routers flap a recursively routed tunnel; the lab holds it down until the fault is gone.",
  devices:[
    {id:"ab", kind:"router", label:"AB-R1", model:"Abuja head office", x:20, y:20, config:e=>{ ["en","conf t","hostname AB-R1","no ip domain-lookup",
      "int g0/0","description HQ LAN","ip address 10.60.0.1 255.255.255.0","no shut",
      "int g0/1","description WAN to ISP","ip address 203.0.113.18 255.255.255.252","no shut",
      "interface Tunnel0","description GRE to Benin clinic","ip address 172.16.60.1 255.255.255.252","tunnel source g0/1","tunnel destination 198.51.100.34","exit",
      "ip route 0.0.0.0 0.0.0.0 203.0.113.17",
      "router ospf 1","router-id 6.6.6.1","passive-interface g0/0","network 10.60.0.0 0.0.0.255 area 0","network 172.16.60.0 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"isp", kind:"router", label:"ISP", model:"internet (stand-in)", x:300, y:20, config:e=>{ ["en","conf t","hostname ISP","no ip domain-lookup",
      "int g0/0","ip address 203.0.113.17 255.255.255.252","no shut","int g0/1","ip address 198.51.100.33 255.255.255.252","no shut","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"bn", kind:"router", label:"BN-R1", model:"Benin City clinic", x:580, y:20, config:e=>{ ["en","conf t","hostname BN-R1","no ip domain-lookup",
      "int g0/0","description CLINIC LAN","ip address 10.61.0.1 255.255.255.0","no shut",
      "int g0/1","description WAN to ISP","ip address 198.51.100.34 255.255.255.252","no shut",
      "interface Tunnel0","description GRE to Abuja","ip address 172.16.60.2 255.255.255.252","tunnel source g0/1","tunnel destination 203.0.113.18","exit",
      "ip route 0.0.0.0 0.0.0.0 198.51.100.38",
      "router ospf 1","router-id 6.6.6.2","network 0.0.0.0 255.255.255.255 area 1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"abp", kind:"pc", label:"HQ-PC", x:66, y:160, ip:"10.60.0.10", mask:"255.255.255.0", gw:"10.60.0.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:346, y:160},
    {id:"bnp", kind:"pc", label:"CLINIC-PC", x:626, y:160, ip:"10.61.0.10", mask:"255.255.255.0", gw:"10.61.0.1"},
  ],
  cables:[ {type:"cat6", a:"ab:g1", b:"isp:g0"}, {type:"cat6", a:"isp:g1", b:"bn:g1"}, {type:"cat6", a:"abp:eth", b:"ab:g0"}, {type:"cat6", a:"bnp:eth", b:"bn:g0"}, {type:"console", a:"lap:usb", b:"bn:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Layer 1 — road, and the pipe on top of it.</b> On BN-R1, <code>show ip interface brief</code> shows Tunnel0 up/down. Is there a route to the tunnel destination? <code>show ip route</code>, then compare the default route's next hop with the design. Done when BN-R1's default route goes via 198.51.100.33 (the wrong line removed) and BN-R1's Tunnel0 is up/up", done:B=>Bench.routeVia(B,"bn","203.0.113.18")==="198.51.100.33" && !B.devs.bn.env.routes.some(r=>r.nh==="198.51.100.38") && Bench.tunnelUp(B,"bn",0)},
    {text:"<b>Layer 3 — the map.</b> Both tunnels are up; is OSPF FULL? <code>show ip ospf interface brief</code> on BN-R1 shows each interface's area, and AB-R1's log has a complaint. Put the clinic's OSPF right — and watch AB-R1's log as you do it. Done when the neighbour is FULL across the tunnel, AB-R1 learns 10.61.0.0/24 by OSPF, AB-R1's Tunnel0 is up/up and AB-R1 has <i>not</i> learned the clinic's WAN subnet 198.51.100.32/30 through OSPF", done:B=>Bench.ospfNbr(B,"ab","6.6.6.2") && !!Bench.route(B,"ab","10.61.0.0/24","O") && Bench.tunnelUp(B,"ab",0) && !Bench.route(B,"ab","198.51.100.32/30","O")},
    {text:"<b>Prove it with traffic.</b> From CLINIC-PC, <code>ping 10.60.0.10</code> with the frame log open: find the GRE encapsulation line and the protocol 47 hops. Done when CLINIC-PC reaches HQ-PC and BN-R1 sends that traffic into the tunnel (next hop 172.16.60.1)", done:B=>Bench.pinged(B,"bnp","10.60.0.10") && Bench.routeVia(B,"bn","10.60.0.10")==="172.16.60.1"},
    {text:"<b>The evidence for the ticket.</b> Move your console cable to AB-R1 and run <code>show interfaces tunnel 0</code> and <code>show ip ospf neighbor</code> — the two outputs that prove the pipe and the map from head office", done:B=>{ const h=B.devs.ab.env.history; return h.some(c=>/^sh\S*\s+int\S*\s+tu\S*\s*0$/i.test(c)) && h.some(c=>/^sh\S*\s+ip\s+ospf\s+nei/i.test(c)) && Bench.tunnelUp(B,"ab",0); }},
  ],
  win:"Road, pipe, map, in order. The clinic's default route pointed at 198.51.100.38, which isn't on its WAN subnet, so it never entered the table: no route to the tunnel destination, line protocol down. Then OSPF: the template's <code>network 0.0.0.0 255.255.255.255 area 1</code> put the tunnel in the wrong area — and if you changed only the area, the catch-all advertised the clinic's WAN subnet into the tunnel, AB-R1 learned its own tunnel destination through the tunnel, and <code>%TUN-5-RECURDOWN</code> took the pipe down again. Specific network statements for the LAN and the tunnel subnet fix both. That one line tripped two layers.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip interface brief"],["term","show ip route"],
    ["term","configure terminal"],["term","no ip route 0.0.0.0 0.0.0.0 198.51.100.38"],["term","ip route 0.0.0.0 0.0.0.0 198.51.100.33"],
    ["term","router ospf 1"],["term","no network 0.0.0.0 255.255.255.255 area 1"],["term","network 10.61.0.0 0.0.0.255 area 0"],["term","network 172.16.60.0 0.0.0.3 area 0"],["term","passive-interface g0/0"],["term","end"],["term","write memory"],
    ["pc","bnp","ping 10.60.0.10"],
    ["unplug","lap:usb"],["plug","console","lap:usb","ab:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces tunnel 0"],["term","show ip ospf neighbor"]]
})}
${K.check({q:"A branch's tunnel goes down with %TUN-5-RECURDOWN a minute after a colleague 'tidied' the head-office OSPF config. What did the tidy-up most likely do?", o:["Removed the tunnel subnet from OSPF","Made head office advertise its WAN subnet (the branch's tunnel destination) into OSPF, so the branch learned it through the tunnel","Changed the OSPF router ID","Set the tunnel's bandwidth"], a:1, why:"Recursive routing: the branch learns head office's WAN subnet over OSPF across the tunnel, and that /30 beats its default, so the route to the destination points into the tunnel. Stop advertising the underlay; add a /32 static to the destination via the ISP."})}
<h3>Same logic, new situation</h3>
${K.q({type:"multi", q:"A Calabar branch router has Tunnel0 'up, line protocol is down'. Its WAN Gi0/1 is up/up with 192.0.2.14/30, the default route goes via 192.0.2.13, and show interfaces tunnel 0 says 'Tunnel source 192.0.2.18, destination 203.0.113.9'. Which two statements are true? (Choose two.)", o:["The tunnel source is an address this router doesn't own, so the pipe can't come up","The road is broken: there's no route to 203.0.113.9","tunnel source GigabitEthernet0/1 fixes the source and survives a future renumbering","OSPF must be configured before the line protocol comes up","The far end must answer before the line protocol comes up"], a:[0,2], why:"1. What is asked? Why the pipe is down, and the fix. 2. Which rule? Up/up needs a source that is an up interface with an address on this router, then a routable destination. 3. Apply it: no interface in brackets on the source line means 192.0.2.18 isn't one of the router's addresses (its WAN is .14). The default route makes the destination routable, so the road is fine. OSPF runs over the tunnel and doesn't decide its line protocol, and without keepalives the far end needn't answer."})}

<h2>VRF fingerprints: the right room</h2>
${K.remember(`<p><b>The one-table rule (lesson 6):</b> every interface, static route, OSPF process, ARP entry and test belongs to <b>exactly one</b> table — global or one VRF — and a packet is routed in the table of the interface it <i>arrived</i> on. A VRF fault is almost always one thing in the wrong table.</p>`)}
<div class="tablewrap"><table>
<tr><th>The user sees</th><th>Fingerprint</th><th>Usual cause → smallest fix</th></tr>
<tr><td>Separated users reach each other</td><td><code>show ip vrf interfaces</code> doesn't list their interface</td><td>Left in the global table → <code>vrf forwarding X</code>, re-enter the address</td></tr>
<tr><td>Gateway stops answering after a change</td><td><code>show ip interface brief</code>: the interface is <code>unassigned</code></td><td><code>vrf forwarding</code> typed after <code>ip address</code> → re-enter the address</td></tr>
<tr><td>A VRF reaches its own subnets only</td><td><code>show ip route vrf X</code>: <code>Gateway of last resort is not set</code>; a plain <code>ip route</code> in the running-config</td><td>Static in the global table → <code>ip route vrf X …</code>, remove the global copy</td></tr>
<tr><td>No OSPF neighbour on a VRF interface</td><td><code>show ip ospf interface brief</code> doesn't list it</td><td>Global process → <code>router ospf N vrf X</code></td></tr>
<tr><td>&ldquo;It doesn't ping&rdquo; from the router</td><td>Plain <code>ping</code> fails, <code>ping vrf X</code> works</td><td>Test run in the global table → nothing to fix</td></tr>
<tr><td>An interface refuses its address</td><td><code>% … overlaps with …</code></td><td>Overlap within one table → the interface belongs in another VRF</td></tr>
</table></div>
<h3>Worked example: the medical-devices VRF that learns nothing</h3>
<p>A hospital keeps pump gateways in VRF ${K.g("MED","The hospital's name for its medical-devices VRF — VRF names are labels you choose.")}, apart from staff traffic. MH-R1 has Gi0/0 (global) to the staff core and Gi0/1 (VRF MED) to the MED core; both cores run OSPF. Ticket: &ldquo;Pump gateways (10.90.50.0/24) unreachable from MH-R1 since its rebuild.&rdquo;</p>
${K.steps([
  ["Road and pipe","No tunnel: a direct cable to MED-CORE, up/up."],
  ["Map","<code>show ip ospf neighbor</code> lists only the staff core; <code>show ip ospf interface brief</code> only Gi0/0. The rebuild put <code>network 10.90.0.0 0.0.255.255 area 0</code> under <code>router ospf 1</code> — the global process, which never runs on VRF interfaces."],
  ["Room","<code>show ip route vrf MED</code>: only the connected link. The map exists — in the wrong room."],
  ["Fix","Remove the line from process 1; add <code>router ospf 2 vrf MED</code> with <code>network 10.90.0.0 0.0.255.255 area 0</code>. A VRF needs its own process ID."],
  ["Prove it from the right table","<code>show ip route vrf MED ospf</code> shows the pump subnet and <code>ping vrf MED 10.90.50.10</code> succeeds; a plain ping still fails, correctly."],
])}
${K.out(`MH-R1#show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0               10.80.1.1/30       1     BDR   1/1
Gi0/1        2     0               10.90.1.1/30       1     BDR   1/1
MH-R1#show ip route vrf MED ospf
...
      10.0.0.0/8 is variably subnetted, 3 subnets, 3 masks
O        10.90.50.0/24 [110/2] via 10.90.1.2, 00:23:45, GigabitEthernet0/1
MH-R1#show ip ospf | include Routing Process
 Routing Process "ospf 1" with ID 8.8.1.1
 Routing Process "ospf 2" with ID 10.90.1.1`, "After the fix, replayed in the lab (the route table's header trimmed). Process 2 takes its router ID from MED's own interfaces.")}
${K.mistake(`Typing <code>vrf forwarding</code> on a live interface and walking away. IOS removes the IPv4 address (one line says so); until you re-enter it, every host behind it has lost its gateway. <code>vrf forwarding</code> first, <code>ip address</code> second — paste both together.`)}
${K.when([
  ["<code>ping &lt;far IP&gt; source &lt;WAN&gt;</code> + ACL check","layer 1: the endpoints may not reach each other","tests the underlay; the ACL check covers protocol 47","OSPF is FULL — the road is proven"],
  ["<code>show interfaces tunnel 0</code>","layer 2: up/down, or a doubtful up/up","source, destination, keepalive in one place","the tunnel is passing traffic"],
  ["<code>show ip ospf neighbor</code> / <code>interface brief</code>","layer 3: pipe up, routes missing","who's FULL; each process's interfaces and areas","the pipe is down — fix it first"],
  ["<code>show ip route vrf</code> / <code>ping vrf</code>","layer 4: the users are in a VRF","the VRF's own table and a test from it","the users are in the global table"],
], "Which evidence for which layer")}
${K.check({q:"A router's guest subinterface is in VRF GUEST. show ip route vrf GUEST says 'Gateway of last resort is not set', and the running-config contains 'ip route 0.0.0.0 0.0.0.0 172.31.0.2', where 172.31.0.2 is the guest firewall on another GUEST subinterface. What is wrong?", o:["Nothing: the global default covers every VRF","The default was configured in the global table, where 172.31.0.2 isn't reachable, so it was never installed anywhere; it must be ip route vrf GUEST 0.0.0.0 0.0.0.0 172.31.0.2","The guest firewall needs OSPF","The subinterface must leave the VRF"], a:1, why:"A plain ip route belongs to the global table and its next hop must resolve there. 172.31.0.2 lives only in GUEST, so IOS keeps the line but installs nothing. GUEST needs its own static."})}
<h3>Same logic, new situation</h3>
${K.q({type:"order", q:"A co-working space in Yaba gives tenant BETA a new uplink on subinterface Gi0/2.102 (VRF BETA, 10.255.0.5/30, provider at .6). Gi0/2.102 already exists in the global table with that address. Put the steps in the order that works first time.", items:["interface g0/2.102, then vrf forwarding BETA","ip address 10.255.0.5 255.255.255.252 (the VRF change removed it)","ip route vrf BETA 0.0.0.0 0.0.0.0 10.255.0.6","show ip route vrf BETA — confirm the S* default via 10.255.0.6","ping vrf BETA 10.255.0.6 to prove it from BETA's table"], why:"1. What is asked? A working order. 2. Which rule? One table per interface, route and test; vrf forwarding removes the address; a static's next hop must resolve in its own table. 3. Apply it: move the interface first, re-enter the address, add the default in BETA (its next hop is now reachable there), verify the table, then test from it with ping vrf."})}

<h2>When all four layers pass: big packets and designs that hide faults</h2>
<p>Two kinds of problem survive a clean road, pipe, map and room: packet size (a tunnel adds 24 bytes), and designs that route around a fault — or paper over a clash — until the next change arrives.</p>
${K.job("“Small things work, big things hang”",`
<h3>Ticket 7318 · 10:20 · &ldquo;Since the Abeokuta warehouse moved onto the internet tunnel, the stock system logs in but reports never finish downloading. Ping is fine.&rdquo;</h3>
<p><b>Symptom and questions.</b> Logins and pings work, so all four layers pass. &ldquo;Which things fail?&rdquo; <i>Big reports and file copies.</i> &ldquo;Since when?&rdquo; <i>The tunnel.</i> Small packets fine, large ones failing, after adding a tunnel: the classic MTU sign.</p>
<p><b>Checks.</b> Every tunnelled packet gets 24 more bytes (lesson 3): a full 1500-byte packet becomes 1524, too big for the 1500-byte internet link. With the DF (Don't Fragment) bit set, the router must drop it and send back an ICMP &ldquo;fragmentation needed&rdquo; message — which some firewalls drop. The proof from a warehouse PC: <code>ping -f -l 1472 10.50.0.20</code> (1472 + 28 header bytes = 1500) fails, saying the packet needs to be fragmented; <code>ping -f -l 1400 10.50.0.20</code> works. (The lab doesn't model MTU: this one lives on real kit and in the drill below.)</p>
<p><b>Fix.</b> On both tunnel interfaces, <code>ip mtu 1400</code> (room for GRE and later IPsec overhead) and <code>ip tcp adjust-mss 1360</code> (1400 − 20 IP − 20 TCP), so TCP sessions agree on segments that fit. <b>Proof:</b> the report downloads; the DF ping at 1372 bytes passes through the tunnel and 1400 doesn't.</p>
<p><b>What you say.</b> &ldquo;The tunnel adds a small wrapper to every packet, so the biggest ones no longer fitted the internet line. The routers now ask your computers for slightly smaller pieces. Tell me if any report still hangs.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Abeokuta tunnel: 1500-byte DF packets dropped (GRE +24). ip mtu 1400 / adjust-mss 1360 both ends. Verified: reports OK, DF ping 1372 OK. Added to tunnel template.&rdquo;</i></p>`)}
${K.case("Two companies, one 10.10.0.0/16",`
<p><i>A composite of a common pattern.</i> A Lagos logistics firm bought a rival whose whole network used 10.10.0.0/16 — head office's block. Renumbering 400 devices would take months; the board wanted the acquired staff on shared payroll by month-end. In the global table IOS refused every overlapping address. <b>Design:</b> the acquired network went into <b>VRF ${K.g("ACQ","Short for acquired: the name chosen for this VRF.")}</b> on the head-office router, so both kept 10.10.10.0/24; the few shared services were reached through NAT on a firewall between the tables, and a renumbering project moved ACQ into a fresh range site by site. <b>Lesson:</b> a VRF buys time when addresses collide — a bridge to a clean design, not a home.</p>`)}
${K.myth([
  ["A tunnel that shows up/up is working.","Without keepalives up/up proves only the local source and a route to the destination; the far end, the ISP and every ACL are untested."],
  ["If I can ping the far router's public address, GRE will get through.","ICMP and GRE are different protocols; an edge ACL can permit one and drop protocol 47."],
  ["A plain ping from the router tests the VRF.","It uses the global table. Test a VRF with ping vrf NAME — and from a host inside it."],
  ["network 0.0.0.0 255.255.255.255 area 0 is a harmless shortcut on a tunnel router.","It advertises the underlay — including the tunnel destinations — into the tunnel and causes recursive routing."],
])}
${K.drill({title:"Module 10 mixed review — GRE MTU, cloud models, hypervisors, VMs and containers, MPLS roles", types:["gremtu","cloudsvc","clouddeploy","hypervisor","vmcontainer","mplsrole"], count:10})}
${K.check({q:"After a new GRE tunnel goes live, users can log in to a remote web application, but large downloads stall. Pings work. What is the best first fix?", o:["Add keepalives to the tunnel","Set ip mtu 1400 and ip tcp adjust-mss 1360 on both tunnel interfaces","Increase the tunnel bandwidth to 10000","Move the tunnel into a VRF"], a:1, why:"Small packets pass, large ones stall: GRE's 24 bytes push full-size packets over the 1500-byte underlay MTU. A lower tunnel IP MTU and a clamped TCP MSS keep segments small enough; the other options don't change packet size."})}

<h2>The Module 10 challenge</h2>
<p>Savanna Freight's weekend change left its three-site WAN in pieces: six tickets, six independent faults — fix them in any order. A ticket ticks only when its fault is fixed <i>and</i> the design is intact: tunnels and VRFs kept, the underlay out of OSPF, traffic on the intended path.</p>
${K.svg("0 0 760 360",
  K.dev("cloud",380,58,"INTERNET","")+K.txt(412,48,"ISP knows public /30s only",{s:9.5})+
  K.dev("router",110,178,"LG-R1","Lagos HQ · 1.1.1.1")+K.dev("router",650,178,"SK-R1","Sokoto · 2.2.2.2")+K.dev("router",380,262,"WR-R1","Warri · 3.3.3.3")+
  K.link(128,164,356,74)+K.link(632,164,404,74)+K.link(380,248,380,98)+
  `<path d="M136,186 L624,186" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/>`+K.txt(250,180,"Tunnel0 · 172.16.0.0/30",{mid:true,s:9.5,c:"accent"})+
  `<path d="M128,196 L356,262" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/>`+K.txt(196,252,"Tu1 ↔ Tu0 · .4/30",{mid:true,s:9.5,c:"accent"})+
  `<path d="M632,196 L404,262" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/>`+K.txt(566,252,"Tu1 ↔ Tu1 · .8/30",{mid:true,s:9.5,c:"accent"})+
  K.txt(20,292,"global: STAFF 10.10.10.0/24",{s:9.5,c:"fg"})+K.txt(20,307,"VRF GUEST 192.168.30.0/24 → GUEST-EDGE",{s:9.5,c:"fg"})+K.txt(20,322,"VRF ACQ 10.10.10.0/24 on Gi0/2",{s:9.5,c:"fg"})+
  K.txt(740,292,"global: STAFF 10.20.10.0/24",{end:true,s:9.5,c:"fg"})+K.txt(740,307,"VRF GUEST 192.168.20.0/24",{end:true,s:9.5,c:"fg"})+K.txt(740,322,"+ portal 192.168.21.0/24",{end:true,s:9.5,c:"fg"})+
  K.txt(380,330,"global: STAFF 10.30.10.0/24",{mid:true,s:9.5,c:"fg"})+
  K.txt(380,352,"OSPF area 0 on all three tunnels · no keepalives · GRE without IPsec in this lab",{mid:true,f:"body",s:10.5,c:"muted"}),
  "The challenge WAN: three GRE tunnels in a triangle over one ISP, OSPF across them, and VRFs at Lagos and Sokoto. The same 10.10.10.0/24 exists twice on LG-R1 — once in the global table, once in VRF ACQ.")}
${K.tip(`Work like the job: <b>reproduce</b> the symptom, walk <b>road, pipe, map, room</b> on the path the ticket describes, read the fingerprint, make the <b>smallest fix</b> that keeps the design, <b>prove it</b> from the user's side — and note ticket, layer, fingerprint, fix and proof for your portfolio.`)}
${K.bench({id:"m10-challenge", points:300, challenge:true, openLog:true, from:"CCNA · Module 10 · lesson 8", title:"Module 10 challenge — Savanna Freight's Monday after the WAN change weekend", viewBox:"0 0 1090 540",
  intro:"<b>Access:</b> your console cable is on LG-R1 (9600 8N1, no flow control); move it to SK-R1 or WR-R1 as needed. Enable secret on all three: <code>Savanna-Lab26</code>. <b>Design:</b> one static default per site to its ISP — 203.0.113.1 (Lagos), 198.51.100.1 (Sokoto: the new router's WAN is Gi0/1), 198.51.100.5 (Warri) — and no other hand-made global routes. Tunnels: LG-R1 Tunnel0 172.16.0.1 ↔ SK-R1 Tunnel0 .2 · LG-R1 Tunnel1 172.16.0.5 ↔ WR-R1 Tunnel0 .6 · SK-R1 Tunnel1 172.16.0.9 ↔ WR-R1 Tunnel1 .10; every tunnel's source is its router's WAN Gi0/1. OSPF 1, area 0, router IDs 1.1.1.1 / 2.2.2.2 / 3.3.3.3: staff LANs 10.10.10.0/24, 10.20.10.0/24, 10.30.10.0/24 and the three tunnel subnets — never the WAN subnets. <b>VRFs:</b> GUEST on LG-R1 (Gi0/0.30 guests, Gi0/0.31 to GUEST-EDGE 172.31.0.2, the guest broadband line; test page 192.0.2.80) and on SK-R1 (Gi0/0.20 guests, Gi0/0.21 the portal SK-PORTAL 192.168.21.10); ACQ on LG-R1 Gi0/2 (the acquired office keeps 10.10.10.0/24, gateway .1). Guests reach only guest services. <b>Lab notes:</b> recursion holds a tunnel down instead of flapping; no keepalives; production would use GRE over IPsec.",
  devices:[
    {id:"isp", kind:"router", label:"INTERNET", model:"ISP core (stand-in)", x:450, y:10, config:e=>{ ["en","conf t","hostname ISP","no ip domain-lookup",
      "int g0/0","description to Savanna Lagos","ip address 203.0.113.1 255.255.255.252","no shut",
      "int g0/1","description to Savanna Sokoto","ip address 198.51.100.1 255.255.255.252","no shut",
      "int g0/2","description to Savanna Warri","ip address 198.51.100.5 255.255.255.252","no shut","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:20, y:10},
    {id:"hq", kind:"router", label:"LG-R1", model:"Lagos head office", x:150, y:150, config:e=>{ ["en","conf t","hostname LG-R1","enable algorithm-type scrypt secret Savanna-Lab26","no ip domain-lookup",
      "vrf definition GUEST","address-family ipv4","exit-address-family","exit","vrf definition ACQ","address-family ipv4","exit-address-family","exit",
      "int g0/1","description WAN to ISP","ip address 203.0.113.2 255.255.255.252","no shut",
      "int g0/0","description TRUNK to LG-SW1","no shut",
      "int g0/0.10","description STAFF","encapsulation dot1Q 10","ip address 10.10.10.1 255.255.255.0",
      "int g0/0.30","description GUEST WI-FI","encapsulation dot1Q 30","vrf forwarding GUEST","ip address 192.168.30.1 255.255.255.0",
      "int g0/0.31","description GUEST-EDGE link","encapsulation dot1Q 31","vrf forwarding GUEST","ip address 172.31.0.1 255.255.255.248",
      "int g0/2","description ACQUIRED OFFICE (VRF ACQ)","ip address 10.10.10.1 255.255.255.0","no shut",
      "interface Tunnel0","description GRE to Sokoto","ip address 172.16.0.1 255.255.255.252","tunnel source g0/1","tunnel destination 198.51.100.2",
      "interface Tunnel1","description GRE to Warri","ip address 172.16.0.5 255.255.255.252","tunnel source g0/1","tunnel destination 198.51.100.6","exit",
      "ip route 0.0.0.0 0.0.0.0 203.0.113.1","ip route 0.0.0.0 0.0.0.0 172.31.0.2",
      "router ospf 1","router-id 1.1.1.1","passive-interface g0/0.10","network 10.10.10.0 0.0.0.255 area 0","network 172.16.0.0 0.0.0.3 area 0","network 172.16.0.4 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"acq", kind:"pc", label:"ACQ-PC", x:20, y:150, ip:"10.10.10.25", mask:"255.255.255.0", gw:"10.10.10.1"},
    {id:"ph", kind:"router", label:"WR-R1", model:"Warri branch", x:450, y:150, config:e=>{ ["en","conf t","hostname WR-R1","enable algorithm-type scrypt secret Savanna-Lab26","no ip domain-lookup",
      "int g0/1","description WAN to ISP","ip address 198.51.100.6 255.255.255.252","no shut",
      "int g0/0","description STAFF LAN","ip address 10.30.10.1 255.255.255.0","no shut",
      "interface Tunnel0","description GRE to Lagos","ip address 172.16.0.6 255.255.255.252","tunnel source g0/1","tunnel destination 203.0.113.20",
      "interface Tunnel1","description GRE to Sokoto","ip address 172.16.0.10 255.255.255.252","tunnel source g0/1","tunnel destination 198.51.100.2","exit",
      "ip route 0.0.0.0 0.0.0.0 198.51.100.5",
      "router ospf 1","router-id 3.3.3.3","passive-interface g0/0","network 10.30.10.0 0.0.0.255 area 0","network 172.16.0.4 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"kn", kind:"router", label:"SK-R1", model:"Sokoto branch", x:760, y:150, config:e=>{ ["en","conf t","hostname SK-R1","enable algorithm-type scrypt secret Savanna-Lab26","no ip domain-lookup",
      "vrf definition GUEST","address-family ipv4","exit-address-family","exit",
      "int g0/1","description WAN to ISP","ip address 198.51.100.2 255.255.255.252","no shut",
      "int g0/2","description WAN on the old router - not cabled","ip address 192.0.2.10 255.255.255.252","shutdown",
      "int g0/0","description TRUNK to SK-SW1","no shut",
      "int g0/0.10","description STAFF","encapsulation dot1Q 10","ip address 10.20.10.1 255.255.255.0",
      "int g0/0.20","description GUEST WI-FI","encapsulation dot1Q 20","ip address 192.168.20.1 255.255.255.0",
      "int g0/0.21","description GUEST PORTAL","encapsulation dot1Q 21","vrf forwarding GUEST","ip address 192.168.21.1 255.255.255.0",
      "interface Tunnel0","description GRE to Lagos","ip address 172.16.0.2 255.255.255.252","tunnel source g0/2","tunnel destination 203.0.113.2",
      "interface Tunnel1","description GRE to Warri","ip address 172.16.0.9 255.255.255.252","tunnel source g0/1","tunnel destination 198.51.100.6","exit",
      "ip route 0.0.0.0 0.0.0.0 198.51.100.1",
      "router ospf 1","router-id 2.2.2.2","passive-interface g0/0.10","network 10.20.10.0 0.0.0.255 area 0","network 172.16.0.0 0.0.0.3 area 0","network 172.16.0.8 0.0.0.3 area 0","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"lsw", kind:"switch", label:"LG-SW1", model:"Catalyst 9200 · Lagos", x:10, y:290, config:e=>{ ["en","conf t","hostname LG-SW1","no ip domain-lookup","vlan 10","name STAFF","vlan 30","name GUEST","vlan 31","name GUEST-EDGE","exit",
      "int g0/1","description TRUNK to LG-R1","switchport mode trunk","switchport trunk allowed vlan 10,30,31",
      "int g0/2","switchport mode access","switchport access vlan 10","int g0/3","switchport mode access","switchport access vlan 30","int g0/4","switchport mode access","switchport access vlan 31","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"php", kind:"pc", label:"WR-PC", x:496, y:290, ip:"10.30.10.10", mask:"255.255.255.0", gw:"10.30.10.1"},
    {id:"ksw", kind:"switch", label:"SK-SW1", model:"Catalyst 9200 · Sokoto", x:660, y:290, config:e=>{ ["en","conf t","hostname SK-SW1","no ip domain-lookup","vlan 10","name STAFF","vlan 20","name GUEST","vlan 21","name PORTAL","exit",
      "int g0/1","description TRUNK to SK-R1","switchport mode trunk","switchport trunk allowed vlan 10,20,21",
      "int g0/2","switchport mode access","switchport access vlan 10","int g0/3","switchport mode access","switchport access vlan 20","int g0/4","switchport mode access","switchport access vlan 21","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"ge", kind:"router", label:"GUEST-EDGE", model:"guest broadband (stand-in)", x:10, y:430, config:e=>{ ["en","conf t","hostname GUEST-EDGE","no ip domain-lookup",
      "int g0/0","description to LG-R1 guest VRF","ip address 172.31.0.2 255.255.255.248","no shut",
      "int lo0","description guest test page","ip address 192.0.2.80 255.255.255.255","exit",
      "ip route 192.168.30.0 255.255.255.0 172.31.0.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"srv", kind:"server", label:"LG-SRV", x:230, y:430, ip:"10.10.10.50", mask:"255.255.255.0", gw:"10.10.10.1"},
    {id:"lgu", kind:"laptop", label:"LG-VISITOR", x:350, y:430, ip:"192.168.30.20", mask:"255.255.255.0", gw:"192.168.30.1"},
    {id:"knp", kind:"pc", label:"SK-PC", x:660, y:430, ip:"10.20.10.10", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"kng", kind:"laptop", label:"SK-GUEST", x:790, y:430, ip:"192.168.20.20", mask:"255.255.255.0", gw:"192.168.20.1"},
    {id:"kpo", kind:"server", label:"SK-PORTAL", x:920, y:430, ip:"192.168.21.10", mask:"255.255.255.0", gw:"192.168.21.1"},
  ],
  cables:[ {type:"cat6",a:"hq:g1",b:"isp:g0"},{type:"cat6",a:"kn:g1",b:"isp:g1"},{type:"cat6",a:"ph:g1",b:"isp:g2"},
    {type:"cat6",a:"hq:g0",b:"lsw:g1"},{type:"cat6",a:"hq:g2",b:"acq:eth"},{type:"cat6",a:"ge:g0",b:"lsw:g4"},{type:"cat6",a:"srv:eth",b:"lsw:g2"},{type:"cat6",a:"lgu:eth",b:"lsw:g3"},
    {type:"cat6",a:"kn:g0",b:"ksw:g1"},{type:"cat6",a:"knp:eth",b:"ksw:g2"},{type:"cat6",a:"kng:eth",b:"ksw:g3"},{type:"cat6",a:"kpo:eth",b:"ksw:g4"},
    {type:"cat6",a:"ph:g0",b:"php:eth"},{type:"console",a:"lap:usb",b:"hq:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>Sokoto (Aisha, branch manager):</b> &ldquo;Since our router was replaced on Saturday, the dashboard shows the Lagos tunnel down, and when Sokoto reaches the Lagos server at all, it goes the long way round.&rdquo; <i>Done when SK-R1's Tunnel0 is up/up on its WAN line, LG-R1 and SK-R1 are OSPF neighbours across it, both send Lagos&ndash;Sokoto traffic straight down it, and SK-PC pings LG-SRV 10.10.10.50.</i>", hint:"Pipe first: <code>show ip interface brief</code> and <code>show interfaces tunnel 0</code> on SK-R1. Which interface is the tunnel's source, and is that interface up? Which interface is the WAN cable plugged into on the new router?", done:B=>{ const t=(B.devs.kn.env.tunInfo()||[]).find(x=>x.ios==="Tunnel0")||{}; return Bench.tunnelUp(B,"kn",0) && t.srcIf==="GigabitEthernet0/1" && Bench.ospfNbr(B,"hq","2.2.2.2") && Bench.routeVia(B,"hq","10.20.10.10")==="172.16.0.2" && Bench.routeVia(B,"kn","10.10.10.50")==="172.16.0.1" && Bench.pinged(B,"knp","10.10.10.50"); }},
    {text:"<b>Warri (Emeka, operations):</b> &ldquo;IT says our Lagos tunnel is up on both routers, but WR-PC can't open anything on the Lagos server.&rdquo; <i>Done when LG-R1 and WR-R1 are OSPF neighbours across their tunnel (both ends still sourced from Gi0/1), both send Lagos&ndash;Warri traffic straight down it, and WR-PC pings LG-SRV 10.10.10.50.</i>", hint:"Up/up without keepalives proves each router's own settings only. Compare the two ends: each tunnel's destination must be the other end's source address. A ping across it with the frame log open shows where the GRE packet dies.", done:B=>Bench.ospfNbr(B,"hq","3.3.3.3") && ((B.devs.hq.env.tunInfo()||[]).find(x=>x.ios==="Tunnel1")||{}).srcIf==="GigabitEthernet0/1" && ((B.devs.ph.env.tunInfo()||[]).find(x=>x.ios==="Tunnel0")||{}).srcIf==="GigabitEthernet0/1" && Bench.routeVia(B,"hq","10.30.10.10")==="172.16.0.6" && Bench.routeVia(B,"ph","10.10.10.50")==="172.16.0.5" && Bench.pinged(B,"php","10.10.10.50")},
    {text:"<b>Network team (depot-to-depot):</b> &ldquo;The Sokoto&ndash;Warri tunnel we built last month is up at both ends, but depot traffic still detours through Lagos.&rdquo; <i>Done when SK-R1 and WR-R1 are OSPF neighbours across their tunnel, both send Sokoto&ndash;Warri traffic straight down it, SK-PC pings WR-PC 10.30.10.10, and no tunnel anywhere is disabled by recursive routing.</i>", hint:"Both ends up, so ask the map: <code>show ip ospf interface brief</code> on each router lists the interfaces its OSPF process runs on. And beware the quick fix that advertises everything — recursive routing is waiting on the other routers.", done:B=>Bench.ospfNbr(B,"kn","3.3.3.3") && Bench.routeVia(B,"kn","10.30.10.10")==="172.16.0.10" && Bench.routeVia(B,"ph","10.20.10.10")==="172.16.0.9" && Bench.pinged(B,"knp","10.30.10.10") && !["hq","kn","ph"].some(r=>Bench.recursive(B,r,0)||Bench.recursive(B,r,1))},
    {text:"<b>Security audit (Sokoto):</b> &ldquo;From the guest Wi-Fi our tester reached a staff PC, 10.20.10.10. Guests must reach the guest portal and nothing else.&rdquo; <i>Done when SK-R1's guest subinterface Gi0/0.20 is in VRF GUEST with its gateway address 192.168.20.1, SK-GUEST (still 192.168.20.20) reaches SK-PORTAL 192.168.21.10, and a ping from SK-GUEST to 10.20.10.10 fails.</i>", hint:"The room: <code>show ip vrf interfaces</code> on SK-R1 — which guest-facing interface is missing from GUEST? Remember what <code>vrf forwarding</code> does to an interface's address.", done:B=>{ const i=B.devs.kn.env.intfs["GigabitEthernet0/0.20"]; return Bench.vrfOf(B,"kn","GigabitEthernet0/0.20")==="GUEST" && !!i && i.ip==="192.168.20.1" && B.devs.kng.ip==="192.168.20.20" && Bench.pinged(B,"kng","192.168.21.10") && Bench.blocked(B,"kng","10.20.10.10"); }},
    {text:"<b>Lagos reception (Bisi):</b> &ldquo;Visitors connect to the guest Wi-Fi but get no internet — even the guest test page, 192.0.2.80, won't open.&rdquo; <i>Done when VRF GUEST on LG-R1 has its default route via GUEST-EDGE 172.31.0.2, LG-VISITOR pings 192.0.2.80, the global table's default still points at the ISP, and no global route points at 172.31.0.2.</i>", hint:"<code>show ip route vrf GUEST</code>: is there a gateway of last resort? Then <code>show running-config | include ip route</code> — which table does each static line belong to, and can its next hop be reached in that table?", done:B=>{ const d=Bench.vrfRoute(B,"hq","GUEST","0.0.0.0/0"); return Bench.vrfOf(B,"hq","GigabitEthernet0/0.30")==="GUEST" && !!d && (d.via||[])[0]==="172.31.0.2" && Bench.routeVia(B,"hq","192.0.2.80")==="203.0.113.1" && !B.devs.hq.env.routes.some(r=>!r.vrf && r.nh==="172.31.0.2") && Bench.pinged(B,"lgu","192.0.2.80"); }},
    {text:"<b>The acquired office (Tunde, ACQ-PC):</b> &ldquo;We were moved onto the Lagos router last night and kept our addressing, 10.10.10.0/24. Our gateway 10.10.10.1 doesn't answer.&rdquo; <i>Done when LG-R1's Gi0/2 is in VRF ACQ with 10.10.10.1/24, ACQ-PC (still 10.10.10.25) pings it, LG-R1 reaches ACQ-PC with <code>ping vrf ACQ 10.10.10.25</code>, and staff VLAN 10 keeps 10.10.10.1 in the global table.</i>", hint:"<code>show ip interface brief</code> on LG-R1: what address does Gi0/2 have? Try to give it 10.10.10.1 and read IOS's answer. One router can hold the same subnet twice — but not in one routing table.", done:B=>{ const e=B.devs.hq.env, g=e.intfs["GigabitEthernet0/2"], s=e.intfs["GigabitEthernet0/0.10"]; return Bench.vrfOf(B,"hq","GigabitEthernet0/2")==="ACQ" && g.ip==="10.10.10.1" && g.mask==="255.255.255.0" && !s.vrf && s.ip==="10.10.10.1" && B.devs.acq.ip==="10.10.10.25" && Bench.pinged(B,"acq","10.10.10.1") && Bench.vrfPinged(B,"hq","ACQ","10.10.10.25"); }},
  ],
  win:"Six tickets, one method. Sokoto's new router still used the old router's WAN port as the tunnel source (pipe). Warri's tunnel pointed at 203.0.113.20 instead of Lagos's 203.0.113.2 — up/up at both ends with no keepalives, and nothing unwrapped (pipe, at the far end). The depot tunnel was missing from Warri's OSPF networks (map) — and the catch-all shortcut would have advertised its WAN subnet and taken two tunnels down with recursive routing. Sokoto's guest subinterface had been left in the global table, so guests could reach staff (room). Lagos's guest default was typed as a global route whose next hop only exists in GUEST, so it was never installed anywhere (room). And the acquired office's 10.10.10.1 collided with the staff VLAN in the global table until Gi0/2 joined VRF ACQ (room). Every tunnel and VRF is still in place, and every path is the designed one.",
  solve:[
    ["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Savanna-Lab26"],
    ["term","show ip interface brief"],["term","show ip route vrf GUEST"],["term","show running-config | include ip route"],
    ["term","configure terminal"],["term","no ip route 0.0.0.0 0.0.0.0 172.31.0.2"],["term","ip route vrf GUEST 0.0.0.0 0.0.0.0 172.31.0.2"],
    ["term","interface g0/2"],["term","vrf forwarding ACQ"],["term","ip address 10.10.10.1 255.255.255.0"],["term","end"],
    ["pc","acq","ping 10.10.10.1"],["term","ping vrf ACQ 10.10.10.25"],["pc","lgu","ping 192.0.2.80"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","kn:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Savanna-Lab26"],
    ["term","show interfaces tunnel 0"],["term","show ip vrf interfaces"],
    ["term","configure terminal"],["term","interface Tunnel0"],["term","tunnel source g0/1"],
    ["term","interface g0/0.20"],["term","vrf forwarding GUEST"],["term","ip address 192.168.20.1 255.255.255.0"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","ph:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","Savanna-Lab26"],
    ["term","show interfaces tunnel 0"],["term","show ip ospf interface brief"],
    ["term","configure terminal"],["term","interface Tunnel0"],["term","tunnel destination 203.0.113.2"],["term","exit"],
    ["term","router ospf 1"],["term","network 172.16.0.8 0.0.0.3 area 0"],["term","end"],["term","write memory"],
    ["pc","knp","ping 10.10.10.50"],["pc","php","ping 10.10.10.50"],["pc","knp","ping 10.30.10.10"],
    ["pc","kng","ping 192.168.21.10"],["pc","kng","ping 10.20.10.10"]]
})}
${K.hint(`Stuck? Sort the tickets by layer: two tunnels that carry nothing (pipe — one fault at the near end, one at the far end), one tunnel up but unused (map), three about who reaches whom inside a site (room).`)}
<h3>Instructor walkthrough</h3>
<p>Open these only after you've tried.</p>
${K.reveal("Ticket 1 — the new router's tunnel uses the old router's port",`<p><b>Pipe.</b> SK-R1: <code>Tunnel0 … up down</code>; <code>show interfaces tunnel 0</code>: <code>Tunnel source 192.0.2.10 (GigabitEthernet0/2)</code> — the old router's WAN port, pasted with its config; on the new router it's shut and uncabled, and the line is on Gi0/1. Without this tunnel, Sokoto reaches Lagos only via Warri (once tickets 2 and 3 are fixed): the long way round.</p>
<p><b>Fix:</b> <code>interface Tunnel0</code>, <code>tunnel source g0/1</code>; LG-R1's destination was already right. <b>Proof:</b> line protocol up, <code>2.2.2.2 … FULL/  -  … Tunnel0</code> on LG-R1, SK-PC's tracert shows 172.16.0.1 as the only hop between the LANs. Re-enabling Gi0/2 can't help: there's no cable in it.</p>`)}
${K.reveal("Ticket 2 — one digit at the far end",`<p><b>Pipe, at the far end.</b> Both ends up/up (no keepalives). WR-R1's <code>show interfaces tunnel 0</code>: <code>destination 203.0.113.20</code>; LG-R1's source is 203.0.113.2. <code>ping 172.16.0.6</code> from LG-R1 with the frame log open: the GRE packet reaches WR-R1, which has no tunnel with that source/destination pair and can't unwrap it. WR-R1's own GRE packets head for 203.0.113.20, which the ISP has no route to.</p>
<p><b>Fix:</b> on WR-R1, <code>tunnel destination 203.0.113.2</code>. <b>Proof:</b> <code>3.3.3.3</code> FULL on LG-R1's Tunnel1; WR-PC gets <code>TTL=126</code> replies from 10.10.10.50. <code>keepalive 10 3</code> would show this mistake as up/down next time.</p>`)}
${K.reveal("Ticket 3 — the depot tunnel nobody told OSPF about",`<p><b>Map.</b> Both Tunnel1s are up/up, but <code>show ip ospf interface brief</code> on WR-R1 lists Gi0/0 and Tu0 only — no <code>network</code> covers 172.16.0.8/30, so WR-R1 ignores SK-R1's hellos.</p>
<p><b>Fix:</b> on WR-R1, <code>router ospf 1</code>, <code>network 172.16.0.8 0.0.0.3 area 0</code>. <b>Proof:</b> <code>3.3.3.3 … FULL/  -  … Tunnel1</code> on SK-R1, <code>O 10.30.10.0/24 [110/1001] via 172.16.0.10</code>, SK-PC's tracert shows 172.16.0.10. <b>The trap:</b> <code>network 0.0.0.0 255.255.255.255 area 0</code> would also form the neighbour — and advertise WR-R1's WAN subnet 198.51.100.4/30, the destination of two other tunnels, so SK-R1 and LG-R1 learn it through those tunnels and log <code>%TUN-5-RECURDOWN</code>.</p>`)}
${K.reveal("Ticket 4 — the guest subinterface left in the global table",`<p><b>Room.</b> <code>show ip vrf interfaces</code> on SK-R1 lists Gi0/0.21 only. Gi0/0.20 is global, so guests are routed to the staff LAN — and not to the portal, which lives in GUEST.</p>
<p><b>Fix:</b> <code>interface g0/0.20</code>, <code>vrf forwarding GUEST</code> (IOS removes the address and says so), <code>ip address 192.168.20.1 255.255.255.0</code>. <b>Proof:</b> SK-GUEST reaches 192.168.21.10; its ping to 10.20.10.10 now gets <i>Destination host unreachable</i> from its gateway. An ACL would also have blocked the staff PC, but left guests in the corporate table — the design says VRF.</p>`)}
${K.reveal("Ticket 5 — the guest default in the wrong table",`<p><b>Room.</b> <code>show ip route vrf GUEST</code>: <code>Gateway of last resort is not set</code>. The running-config has <code>ip route 0.0.0.0 0.0.0.0 172.31.0.2</code> — a global route whose next hop exists only in GUEST, so it is installed nowhere; the global default to the ISP hides it from a quick look.</p>
<p><b>Fix:</b> <code>no ip route 0.0.0.0 0.0.0.0 172.31.0.2</code>, <code>ip route vrf GUEST 0.0.0.0 0.0.0.0 172.31.0.2</code>. <b>Proof:</b> <code>S* 0.0.0.0/0 [1/0] via 172.31.0.2</code> under <code>Routing Table: GUEST</code>; LG-VISITOR reaches 192.0.2.80; the global table still sends staff traffic to the ISP.</p>`)}
${K.reveal("Ticket 6 — the same subnet twice, in one table",`<p><b>Room.</b> LG-R1's Gi0/2 is <code>unassigned</code>. Typing the address gives <code>% 10.10.10.0 overlaps with GigabitEthernet0/0.10</code>: staff VLAN 10 already uses 10.10.10.0/24 in the global table. VRF ACQ exists; nobody put Gi0/2 in it.</p>
<p><b>Fix:</b> <code>interface g0/2</code>, <code>vrf forwarding ACQ</code>, <code>ip address 10.10.10.1 255.255.255.0</code>. <b>Proof:</b> ACQ-PC's gateway answers; <code>ping vrf ACQ 10.10.10.25</code> succeeds while a plain <code>ping 10.10.10.25</code> fails — the global table looks for it on staff VLAN 10, where it doesn't exist. Renumbering would also work, months from now.</p>
<p><b>Finally</b> <code>write memory</code> on all three routers, a ticket note each, and a checklist for the next change weekend: &ldquo;tunnel source = interface name · each destination = the other end's source · new tunnel subnets in OSPF at both ends, never the WAN · <code>vrf forwarding</code> before <code>ip address</code> · <code>ip route vrf</code> · prove with <code>ping vrf</code>.&rdquo;</p>`)}

<h2>Portfolio project: the WAN for your three-site network</h2>
<p>&ldquo;Have you designed a WAN?&rdquo; is best answered by a repository with a design, its reasons, configs and <i>evidence</i>. Build on your Modules 5–9 three-site network (head office with two routers, two branches, an &ldquo;ISP&rdquo;) in the Ladder Lab builder (GRE, VRFs), CML or GNS3 (real IOS, IPsec too). Packet Tracer covers GRE; check your version for VRFs and IPsec.</p>
${K.svg("0 0 760 320",
  K.band(10,10,250,24,"HEAD OFFICE · HSRP pair")+K.band(510,10,240,24,"BRANCHES 1 and 2")+
  K.dev("router",70,82,"HQ-R1","fibre · primary")+K.dev("router",200,82,"HQ-R2","second ISP")+
  K.dev("cloud",380,150,"INTERNET","two ISPs + 4G")+
  K.dev("router",570,82,"BR1-R1","broadband + 4G")+K.dev("router",690,82,"BR2-R1","broadband + 4G")+
  K.link(70,138,356,152)+K.link(218,100,360,146)+K.link(552,100,404,140)+K.link(690,138,404,156)+
  `<path d="M94,92 C250,40 450,40 546,86" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/>`+
  `<path d="M94,96 C260,20 560,20 666,86" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="6 4"/>`+
  K.txt(380,26,"GRE over IPsec · OSPF area 0",{mid:true,s:9.5,c:"accent"})+
  K.box(285,232,190,50,"CLOUD VPC","IPsec VPN or Direct Connect",true)+K.link(380,204,380,232)+
  K.txt(20,232,"VRF GUEST at every site:",{f:"body",s:10.5,c:"fg",b:true})+K.txt(20,248,"local internet breakout,",{f:"body",s:10.5,c:"fg"})+K.txt(20,264,"never in the tunnels",{f:"body",s:10.5,c:"fg"})+
  K.txt(740,232,"Staff (global table):",{end:true,f:"body",s:10.5,c:"fg",b:true})+K.txt(740,248,"tunnels to HQ, OSPF,",{end:true,f:"body",s:10.5,c:"fg"})+K.txt(740,264,"backup over 4G",{end:true,f:"body",s:10.5,c:"fg"})+
  K.txt(380,306,"Underlay = ISP links (statics only) · overlay = tunnels + OSPF · VRFs split guests from staff",{mid:true,f:"body",s:10.5,c:"muted"}),
  "A portfolio WAN: hub-and-spoke tunnels from head office to each branch over the internet, a cloud VPC reached by VPN, and guest traffic kept in its own VRF with a local breakout.")}
<h3>The brief</h3>
<div class="tablewrap"><table>
<tr><th>Deliverable</th><th>What it contains</th><th>Lessons</th></tr>
<tr><td><b>Architecture and links</b></td><td>Each site's access (fibre, broadband, 4G backup), single- or dual-homed, and why; hub-and-spoke or partial mesh</td><td>1, 2</td></tr>
<tr><td><b>Tunnels</b></td><td>Per tunnel: source interface, destination, subnet, <code>ip mtu 1400</code> / <code>adjust-mss 1360</code>, keepalives (check your platform: keepalive support with tunnel protection varies by release); GRE over IPsec in production (or the case for SD-WAN)</td><td>3, 4, M8</td></tr>
<tr><td><b>Routing</b></td><td>OSPF over the tunnels only; underlay by statics; a 4G floating static backup; the recursion rule written down</td><td>3, M5</td></tr>
<tr><td><b>VRFs</b></td><td>GUEST per site: interfaces, its own default to a local breakout, what it may reach</td><td>6</td></tr>
<tr><td><b>Cloud</b></td><td>How you reach the VPC (internet, IPsec VPN, private WAN or Direct Connect), its subnets, where DNS and security live</td><td>5, 7</td></tr>
<tr><td><b>Evidence and break/fix log</b></td><td>Every tunnel and VRF proved layer by layer; three faults introduced on purpose — symptom, layer, fingerprint, fix, proof</td><td>8</td></tr>
</table></div>
${K.when([
  ["Internet VPN (IPsec) to the cloud gateway","a few sites, a quick start","fast to set up, cheap, encrypted","you need an SLA or very high throughput"],
  ["GRE over IPsec to a virtual router in the VPC","you want OSPF (multicast) across to the cloud","a routing protocol over an encrypted tunnel","the cloud's native VPN gateway does what you need"],
  ["Direct Connect / ExpressRoute","steady heavy traffic, predictable latency","private circuit with an SLA","you need it next week"],
  ["SD-WAN with cloud on-ramp","many branches, several transports, app-aware paths","central policy, transport independence (lesson 4)","three sites and a small team — tunnels are enough"],
], "Choosing how the WAN reaches the cloud")}
<h3>Build it, break it, prove it</h3>
${K.steps([
  ["Paper first","Addressing, tunnel and VRF tables before any command — a subnet missing on paper will be missing from OSPF."],
  ["Underlay, then one tunnel, then the rest","ISP links and statics; one tunnel to up/up with keepalives; OSPF across it; proof; then the next tunnel."],
  ["Rooms last","GUEST at each site with its own default; prove guests reach the internet and <i>can't</i> reach staff."],
  ["Break it, then publish","Three faults from this lesson, written up; on GitHub with keys and passwords replaced by placeholders."],
])}
<h3>A write-up template you can copy</h3>
${K.out(`# WAN for a three-site network: GRE tunnels, OSPF, VRF-separated guests and a cloud link — with evidence
Author: <name> · Built with: <Ladder Lab / CML / GNS3> · <month year>

## 1. Problem and design — sites, links and why
## 2. Addressing (underlay /30s, tunnel subnets, LANs, VRFs)
| Subnet | Purpose | Table (global / VRF) | Gateway |
## 3. Tunnels
| Tunnel | Source if | Destination | Subnet | MTU / MSS | Keepalive | OSPF cost |
## 4. Routing — underlay statics, OSPF networks, floating backup, recursion rule
## 5. VRFs
| VRF | Interfaces | Default route | May reach | Must not reach |
## 6. Cloud connectivity — option chosen and why
## 7. Evidence (outputs in /evidence)
| Path | Road | Pipe | Map | Room | Negative test |
## 8. What broke and how I fixed it
| # | Fault | Symptom | Layer | Fingerprint | Fix | Proof |
## 9. Limits — simulated in <tool>; IPsec/Direct Connect on paper; next: SD-WAN, BGP`, "Save as README.md and fill each angle bracket. Every row of section 3 and section 5 needs a row in section 7.")}
<p><b>&ldquo;Done&rdquo; evidence:</b> per tunnel, <code>show interfaces tunnel</code> (up/up with keepalives) at both ends, OSPF FULL on it, a traceroute showing the far tunnel address as one hop; per VRF, <code>show ip vrf interfaces</code>, <code>show ip route vrf</code> and <code>ping vrf</code> plus a host test; negative tests both ways between guests and staff; the 4G backup taking over when the primary line is shut.</p>
${K.tip(`Post it: 150 words on LinkedIn, the diagram and one fault proved by one line of evidence. &ldquo;Up/up at both ends, carrying nothing: one digit in the far end's destination&rdquo; is a ready interview story.`)}
${K.check({q:"Which evidence best proves that a branch's guest VRF is really separated from staff?", o:["show vrf listing GUEST","show ip vrf interfaces listing the guest subinterface, plus a guest PC that reaches the internet stand-in and fails to reach a staff PC, and a staff PC that fails to reach the guest subnet","A plain ping from the router to a guest PC","show ip route on the branch router"], a:1, why:"show vrf proves only that the VRF exists. Membership plus host tests in both directions prove the design; a plain ping and show ip route look at the global table."})}
<h3>Same logic, new situation</h3>
${K.hint(`Ask what the tunnel destination will be learned through once OSPF runs, and what decides which of two matching routes wins.`)}
${K.reveal("Your design runs OSPF on HQ-R1's LAN, its tunnels and — for convenience — its WAN interface toward the second ISP, which a branch tunnel uses as its destination. What happens, and how do you design it out?",`<p><b>1. What is asked?</b> The effect of advertising an underlay subnet into OSPF over tunnels. <b>2. Which rule?</b> A tunnel's destination must be reached through the underlay, never the tunnel; the longest match wins. <b>3. Apply it:</b> the branch learns HQ-R2's WAN /30 across the tunnel; the /30 beats its default, so the route to the destination points into the tunnel — <code>%TUN-5-RECURDOWN</code>, and on real kit a flapping tunnel. Design it out twice: <code>network</code> statements only for LANs and tunnel subnets, and a /32 static to each destination via the ISP.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Give the layers in order and the command for each — interviewers listen for a method.`)}
${K.reveal("&ldquo;A GRE tunnel between two sites is up/up, but OSPF won't form across it. How do you troubleshoot?&rdquo;",`<p>&ldquo;Up/up without keepalives only proves the local source and a route to the destination. So first the road: do the endpoints reach each other, and does every ACL permit GRE, protocol 47? Then the pipe at <i>both</i> ends: each end's destination must be the other's source. Then the map: <code>show ip ospf interface brief</code> at both ends — tunnel in OSPF, same area, not passive, same subnet; the log shows area mismatches. Once FULL, I check the far LAN arrives via the tunnel and no underlay subnet is advertised into it.&rdquo;</p>`)}
${K.hint(`Define it, say what the router does, and give two fixes.`)}
${K.reveal("&ldquo;What is recursive routing on a GRE tunnel, and how do you prevent it?&rdquo;",`<p>&ldquo;The best route to the tunnel's destination points out of the tunnel itself — usually the far WAN subnet advertised into the protocol running over the tunnel, beating the default. IOS logs <code>%TUN-5-RECURDOWN</code> and takes the tunnel down; the route disappears, the tunnel returns, and it flaps. Prevent it: advertise only LANs and tunnel subnets into the overlay, and pin each destination with a /32 static via the ISP.&rdquo;</p>`)}
${K.hint(`Links, overlay, routing, separation, cloud — and how you'd prove each.`)}
${K.reveal("&ldquo;How would you design the WAN for a head office and two branches, with guest Wi-Fi and a cloud presence?&rdquo;",`<p>&ldquo;Head office dual-homed to two ISPs, branches on broadband with 4G backup. Hub-and-spoke GRE over IPsec, OSPF over the tunnels only, statics for the underlay, MTU 1400 with MSS clamping, keepalives, after checking the platform supports them with tunnel protection, because that varies by release. Guests in a VRF at each site with a local breakout, so their traffic never enters the tunnels. The cloud over an IPsec VPN first, Direct Connect if traffic grows; SD-WAN if the sites multiply. Every tunnel and VRF proved layer by layer, with negative tests.&rdquo;</p>`)}

${K.recap([
  "Road, pipe, map, room — check from the bottom up and stop at the first no.",
  "Road: the endpoints must reach each other with GRE — an ACL can permit ping and still drop protocol 47.",
  "Pipe: up/up needs an up source with an address on this router and a routable destination (not through the tunnel); with keepalives, far-end answers. Without them, up/up is local.",
  "Each end's destination must be the other's source; name the source by interface so renumbering can't break it.",
  "Map: the tunnel subnet in OSPF at both ends, same area, never the underlay — advertising a tunnel destination into the tunnel gives %TUN-5-RECURDOWN.",
  "Room: one table per interface, route, OSPF process and test — vrf forwarding then ip address; ip route vrf; router ospf N vrf; ping vrf.",
  "After all four pass: big packets stall → ip mtu 1400 and ip tcp adjust-mss 1360 on both ends.",
])}
${K.next(`<b>Module 11 — network automation and programmability.</b> You just fixed three routers by hand, one console at a time. Next: software-defined networking, controllers, REST APIs and ${K.g("JSON","JavaScript Object Notation: a text format for structured data used by most network APIs (Module 11).")}, and the tools that configure and check hundreds of devices the same way every time.`)}
`,
quiz:[
  {type:"order", q:"Put the four troubleshooting layers for a tunnelled, VRF-separated WAN in the order you check them.", items:["Road — can the tunnel endpoints reach each other across the underlay, GRE included?","Pipe — is the tunnel up/up, and for the right reasons?","Map — is the routing protocol FULL across the tunnel, with the right routes?","Room — are the interfaces, routes and tests in the right VRF?"], why:"Each layer rides on the one below: the tunnel needs the underlay, OSPF hellos ride in the tunnel, and a VRF's users need routes in their own table. Bottom up, stop at the first no.", lvl:1},
  {q:"A GRE tunnel has no keepalives configured. The far router's tunnel was deleted by mistake. What does the near router's show ip interface brief show for its tunnel?", o:["administratively down / down","up / down","up / up — the near router can't tell without keepalives","down / down"], a:2, why:"Without keepalives the line protocol depends only on local conditions: a valid source and a routable destination. The far end can be gone and the tunnel still shows up/up while traffic disappears.", lvl:1},
  {q:"Based on the exhibit, why is Tunnel0's line protocol down?", ex:"BR-R1#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     10.5.0.1        YES manual up                    up\nGigabitEthernet0/1     192.0.2.14      YES manual up                    up\nTunnel0                172.16.5.2      YES manual up                    down\n\nBR-R1#show interfaces tunnel 0 | include Tunnel source\n  Tunnel source 192.0.2.18, destination 203.0.113.9\n\nBR-R1#show ip route | include 0.0.0.0/0\nS*    0.0.0.0/0 [1/0] via 192.0.2.13", o:["There is no route to 203.0.113.9","The tunnel source 192.0.2.18 isn't an address of this router","OSPF isn't running on the tunnel","The tunnel is shut down"], a:1, why:"The source line has no interface in brackets: 192.0.2.18 doesn't belong to any interface (Gi0/1 is .14). The default route via 192.0.2.13 makes the destination routable, OSPF doesn't decide a tunnel's line protocol, and a shut tunnel would show administratively down.", lvl:2},
  {type:"multi", q:"Which two conditions take a GRE tunnel's line protocol down on a router with no keepalives configured? (Choose two.)", o:["The tunnel source interface goes down","The far end's tunnel is shut down","There is no route to the tunnel destination, not even a default","OSPF on the tunnel has an area mismatch","An ACL at the ISP drops protocol 47"], a:[0,2], why:"Without keepalives only local conditions count: an up source interface with an address, and a routable destination. The far end, an ACL in the path and OSPF problems all leave the tunnel up/up while traffic fails.", lvl:2},
  {q:"A router logs %TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing. What is the cause?", o:["The tunnel's keepalives went unanswered","The best route to the tunnel destination points out of Tunnel0 itself","The tunnel source and destination are the same address","Two tunnels share one source interface"], a:1, why:"Recursive routing: the destination (or its subnet) was learned through the tunnel — typically the far WAN subnet advertised into OSPF over the tunnel — so the tunnel would have to carry its own outer packets. Two tunnels sharing a source is normal.", lvl:2},
  {type:"fill", q:"A GRE tunnel (no key, no checksum) runs over a 1500-byte IPv4 underlay. What is the tunnel's default IP MTU, and what TCP MSS fits it exactly?", fields:[{label:"Tunnel IP MTU (bytes)", a:["1476","1476 bytes"]},{label:"TCP MSS (bytes)", a:["1436","1436 bytes"]}], why:"GRE over IPv4 adds a 20-byte outer IP header and a 4-byte GRE header: 1500 − 24 = 1476. The MSS is the IP MTU minus the 20-byte IP and 20-byte TCP headers: 1476 − 40 = 1436. Many designs use ip mtu 1400 and adjust-mss 1360 to leave room for IPsec too.", lvl:1},
  {q:"Based on the exhibit, why can't guests reach the internet?", ex:"GW-R1#show ip route vrf GUEST | include Gateway\nGateway of last resort is not set\n\nGW-R1#show running-config | include ip route\nip route 0.0.0.0 0.0.0.0 203.0.113.1\nip route 0.0.0.0 0.0.0.0 172.31.0.2\n\n(172.31.0.2 is the guest firewall, on Gi0/0.31, which is in VRF GUEST)", o:["The guest firewall has no route back","The second static was configured in the global table, where 172.31.0.2 can't be reached, so it is installed nowhere; GUEST needs ip route vrf GUEST 0.0.0.0 0.0.0.0 172.31.0.2","Two default routes cancel each other","VRF GUEST needs a route distinguisher"], a:1, why:"A plain ip route belongs to the global table and its next hop must resolve there. 172.31.0.2 exists only in GUEST, so that line installs nothing, while the global default to 203.0.113.1 keeps the global table looking normal. VRF-Lite needs no route distinguisher.", lvl:2},
  {q:"On a router, ping 10.2.2.10 fails, but ping vrf CUST_A 10.2.2.10 succeeds. What does this tell you?", o:["The VRF is misconfigured","10.2.2.10 is reachable in VRF CUST_A; the plain ping looked in the global table, which has no route to it","ARP is broken","The global table must be fixed"], a:1, why:"A plain ping from the router uses the global table. Hosts in a VRF are reachable only from that VRF's table, which ping vrf uses. Nothing is broken; the first test was run from the wrong room.", lvl:1},
  {q:"An engineer types vrf forwarding STAFF on a working LAN interface. A minute later every PC on that LAN has lost its gateway. Why, and what fixes it?", o:["The VRF needs a route distinguisher; add rd 65000:1","Moving an interface into a VRF removes its IPv4 address; re-enter the ip address on the interface","The PCs must be rebooted","STAFF must be added to OSPF"], a:1, why:"IOS removes the interface's IPv4 (and IPv6) addresses when it joins or leaves a VRF, and prints a message saying so. Re-enter the address after vrf forwarding. VRF-Lite doesn't need a route distinguisher.", lvl:1},
  {type:"match", q:"Match each finding with the layer where the fault sits.", pairs:[["An edge ACL permits ICMP but ends with deny ip any any; OSPF over the tunnel died when it was applied","Road"],["Tunnel0 is up, line protocol is down; its source interface is shut","Pipe"],["Both tunnels up/up; show ip ospf interface brief on one end doesn't list Tu0","Map"],["OSPF is FULL; the guest subinterface's VRF has no default route","Room"]], why:"Road = the underlay between the endpoints, including ACLs that must pass protocol 47; pipe = the tunnel's line protocol; map = the routing protocol across the tunnel; room = the VRF tables.", lvl:2},
  {q:"Based on the exhibit, why does the router learn nothing from the MED core switch on Gi0/1?", ex:"MH-R1#show ip vrf interfaces\nInterface              IP-Address      VRF                              Protocol\nGi0/1                  10.90.1.1       MED                              up\n\nMH-R1#show ip ospf interface brief\nInterface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C\nGi0/0        1     0               10.80.1.1/30       1     BDR   1/1\n\nMH-R1#show running-config | section router ospf\nrouter ospf 1\n network 10.80.0.0 0.0.255.255 area 0\n network 10.90.0.0 0.0.255.255 area 0", o:["Gi0/1 needs ip ospf network point-to-point","A global OSPF process never runs on VRF interfaces; MED needs its own process, router ospf 2 vrf MED, with the network statement","The area must be 1 for VRF interfaces","The wildcard mask is wrong"], a:1, why:"Gi0/1 is in VRF MED, and the network 10.90.0.0 line sits under the global process 1, which only enables OSPF on global-table interfaces. A VRF needs its own OSPF process ID: router ospf 2 vrf MED, network 10.90.0.0 0.0.255.255 area 0.", lvl:2},
  {q:"Since Friday's change at a branch, its GRE tunnel to head office goes down and up every minute or so, and calls drop each time. The head-office log repeats %TUN-5-RECURDOWN, and show ip route 198.51.100.34 (the branch's tunnel source) on head office shows it known via OSPF over Tunnel0. The branch's OSPF now contains network 0.0.0.0 255.255.255.255 area 0. What is the best fix?", o:["Add keepalives on both tunnels","Replace the catch-all with network statements for the branch LAN and tunnel subnet only; optionally add a /32 static on head office to 198.51.100.34 via its ISP","Raise the tunnel's OSPF cost","Shut the branch WAN interface out of OSPF with passive-interface and keep the catch-all"], a:1, why:"The catch-all advertises the branch's WAN subnet into the tunnel, so head office routes its own tunnel destination through the tunnel. Specific network statements stop advertising the underlay; a /32 static via the ISP beats any OSPF route to the destination. passive-interface stops hellos but still advertises the WAN subnet, so it doesn't fix it; keepalives and cost don't touch the route.", lvl:3},
  {q:"A warehouse moved onto a new GRE tunnel. Logins and pings work; large reports and file copies stall. The underlay MTU is 1500 everywhere. What should you change?", o:["Add keepalive 10 3 at both ends","Set ip mtu 1400 and ip tcp adjust-mss 1360 on both tunnel interfaces","Move the warehouse LAN into a VRF","Lower the OSPF hello interval"], a:1, why:"Small packets pass and large ones stall right after adding a tunnel: GRE's 24 bytes push full-size packets over 1500, and DF-set packets are dropped (often with the ICMP 'fragmentation needed' replies filtered on the way). Lowering the tunnel IP MTU and clamping the TCP MSS keeps segments small enough. The other options don't change packet size.", lvl:3},
  {q:"Your company buys a rival whose office uses 10.10.10.0/24 — the same as your head-office staff VLAN. Their router must connect to your head-office router this week; renumbering will take months. What is the best design for now?", o:["Put the rival's link in the global table with the same subnet","Put the rival's interface in its own VRF on the head-office router, keeping its addressing, and plan renumbering; reach any shared service through a controlled path such as NAT or a firewall","Change your own staff VLAN to a new subnet this week","Give the rival's link a /25 so the two don't overlap exactly"], a:1, why:"IOS refuses overlapping subnets in one routing table, so the global table can't hold both. A VRF keeps the networks apart on one router while renumbering happens. A /25 still overlaps the /24, and renumbering your own staff VLAN this week moves the risk to every head-office user.", lvl:3},
  {type:"multi", q:"An inbound ACL on a branch's WAN interface was replaced at 08:30. Since then the tunnel shows up/up but OSPF over it is down; a ping from the branch WAN to head office's public address works. Which two actions make sense? (Choose two.)", o:["Check the ACL for a permit for protocol 47 between the two tunnel endpoints","Insert a permit gre line for the two tunnel endpoints (head office public address to branch public address) above the ACL's deny line","Delete the tunnel and rebuild it","Add network 0.0.0.0 255.255.255.255 area 0","Remove the ACL from the interface permanently"], a:[0,1], why:"Hellos ride inside GRE (protocol 47); a ping proves only that ICMP crosses. Find and fix the missing GRE permit, keeping the rest of the ACL. Rebuilding the tunnel or a catch-all OSPF line changes nothing at the road, and removing the ACL removes the protection.", lvl:2},
  {q:"A company runs OSPF between its head office and an AWS VPC and wants the link encrypted over the internet, with the routing protocol carried across. Which approach fits?", o:["A plain GRE tunnel","GRE over IPsec to a virtual router in the VPC — GRE carries OSPF's multicast, IPsec encrypts it","An IPsec crypto map with no tunnel interface","A VRF on the head-office router"], a:1, why:"Plain GRE carries OSPF but isn't encrypted; classic crypto-map IPsec encrypts but carries only unicast, so no OSPF hellos. GRE over IPsec gives both. A VRF separates tables and encrypts nothing.", lvl:2},
],
cards:[
  {f:"The four WAN troubleshooting layers", b:"Road (underlay: can the endpoints reach each other, GRE included?), pipe (tunnel up/up, and why?), map (OSPF FULL across the tunnel?), room (the right VRF?). Bottom up; stop at the first no."},
  {f:"When is a GRE tunnel up/up?", b:"Not shut; source = an up interface with an address on this router; destination set; destination routable (any route, default included, but not through the tunnel); with keepalives, the far end answers."},
  {f:"Up/up without keepalives", b:"Proves only local settings. The far end can be dead or mismatched, or an ACL can drop protocol 47, and the tunnel still shows up/up while traffic black-holes."},
  {f:"keepalive 10 3", b:"Sends a keepalive every 10 seconds; three unanswered in a row take the line protocol down, so statics out the tunnel leave the table and backups can take over."},
  {f:"Source line without an interface in brackets", b:"'Tunnel source 192.0.2.18, destination ...' with no (GigabitEthernet0/x) = the address isn't the router's. Use tunnel source <interface> so renumbering can't break it."},
  {f:"Both ends of a tunnel must mirror", b:"Each end's tunnel destination = the other end's source address. One wrong digit: both may show up/up, and the far router can't unwrap the GRE packets."},
  {f:"%TUN-5-RECURDOWN", b:"Recursive routing: the route to the tunnel destination points into the tunnel. Cause: underlay advertised into OSPF over the tunnel. Fix: specific network statements; /32 static to the destination via the ISP."},
  {f:"ACLs and GRE", b:"An edge ACL must permit protocol 47 between the endpoints (permit gre host A host B). A working ping between the public addresses proves only ICMP."},
  {f:"The one-table rule", b:"Every interface, static, OSPF process, ARP entry and test belongs to one table: global or one VRF. Packets are routed in the table of the interface they arrived on."},
  {f:"vrf forwarding removes the address", b:"Moving an interface into or out of a VRF deletes its IPv4/IPv6 addresses. Order: vrf forwarding first, then ip address."},
  {f:"Statics and OSPF per VRF", b:"ip route vrf NAME ... (a plain ip route is global and its next hop must resolve there); router ospf N vrf NAME (a global process never runs on VRF interfaces)."},
  {f:"Testing a VRF", b:"ping vrf NAME ip, show ip route vrf NAME. A plain ping or show ip route from the router uses the global table."},
  {f:"Big packets stall over a tunnel", b:"GRE adds 24 bytes (MTU 1476). Set ip mtu 1400 and ip tcp adjust-mss 1360 on both tunnel interfaces."},
],
});


const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>/^ccna-m([1-9])$/.test(l.mod||"")).length;
K.module("ccna", {
  id:"ccna-m10", t:"WAN, virtualization and cloud: architectures, WAN links, VPNs and GRE, SD-WAN, VRFs and the cloud",
  blurb:"See how real networks are shaped — 2-tier, 3-tier and spine-leaf — and how sites reach each other: leased lines, Metro Ethernet, MPLS, broadband and 4G/5G; build GRE tunnels and run OSPF across them, split one router into VRFs, understand virtual machines, containers and SD-WAN, and connect a company to the cloud — then fix a broken WAN in the Module 10 challenge.",
}, L, { at, modAt:9, replace:["Virtualization, cloud, containers & network automation (SDN)"] });
})();
