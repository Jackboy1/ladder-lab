// CCNA · Module 4 — VLANs, trunks, inter-VLAN routing, Spanning Tree & EtherChannel (built to the CONTENT_GUIDE.md standard).
// Replaces the classic lessons "VLANs, trunks, inter-VLAN routing & SVIs" and "Spanning Tree & EtherChannel".
(function(){
const L = [];

// ---------- Module 4 · Lesson 1 ----------
L.push({
id:"vlan-basics", mins:80, level:"Beginner+ · builds on Modules 1–3",
t:"VLANs: one switch, many networks — creating VLANs, access ports and the voice VLAN",
html:`
${K.goals([
  "Explain to a manager, in two sentences, what a VLAN is and what problem it solves.",
  "Create and name VLANs, put access ports into them, and read <code>show vlan brief</code> line by line.",
  "Predict what happens to users when a VLAN is deleted, when a VLAN number is mistyped, and when two VLANs share one subnet.",
  "Configure a desk port for an IP phone with a PC behind it (access VLAN + voice VLAN) and explain how the phone learns its VLAN.",
  "Design a small office VLAN plan — users, voice, printers, servers, management, guest, parking — mapped to the subnets you learned to build in Module 3.",
])}
${K.pre(["Module 2: how a switch learns, floods and forwards (lesson 2), broadcast domains (lesson 3), ARP (lesson 4) and switch management (lesson 5). Module 3: IPv4 subnets and VLSM. You should be able to console into a switch and use <code>configure terminal</code> without thinking about it (Module 1 lesson 8)."])}

<h2>Why this matters at work</h2>
<p>A logistics company in Ikeja, Lagos, has one floor, three 48-port switches and one big flat network: 140 staff PCs, 60 IP phones, eight printers, two servers, the CCTV recorder and the guest Wi-Fi, all in the same subnet. Every time the CCTV recorder or a printer sends a broadcast, all 200-plus devices have to stop and look at it. A visitor on guest Wi-Fi can see the finance file server. When one PC catches a worm, it can scan every device on the floor in seconds.</p>
<p>The fix does not need new switches or new cables. An engineer spends an evening creating a few ${K.g("VLANs","Virtual LANs: separate Layer 2 networks (broadcast domains) configured on the same physical switches.")} — staff, voice, printers, servers, guest — and moving each port into the right one. On Monday nothing looks different, yet the network is now five smaller, quieter, separated networks. Almost every switch you touch in your career will be configured this way, and &ldquo;which VLAN is this port in?&rdquo; is one of the first questions you'll ask on any ticket.</p>

<h2>The problem: one switch, one big broadcast domain</h2>
<p>In Module 2 you saw that a switch floods every ${K.g("broadcast","A frame sent to ffff.ffff.ffff — every device in the broadcast domain must receive and process it.")} out of every port except the one it came in on. You also saw that a ${K.g("broadcast domain","The set of devices that receive each other's broadcasts. A router (or a VLAN boundary) ends it.")} ends only at a router. Out of the box, every port on a Cisco switch is in the same VLAN — VLAN 1 — so every device on the switch, and on every switch joined to it, is in one broadcast domain.</p>
<p>Fine for six devices at home. In a real office it causes three problems:</p>
<ul>
<li><b>Noise.</b> ARP requests, DHCP discovers and printer announcements reach every device, and each costs a little CPU on every PC, phone and printer. One misbehaving device can flood everyone.</li>
<li><b>Security.</b> Everything can reach everything at Layer 2. The guest laptop and the payroll PC are neighbours, and an attacker on one port can ARP-scan the whole site.</li>
<li><b>Organisation.</b> With everything mixed together you can't give groups different addresses or rules, and moving someone between departments means re-cabling them.</li>
</ul>
<p>The old answer was physical: separate switches per department, joined by a router. That wastes ports and turns every desk move into a cable move. VLANs give the separation without the hardware.</p>
${K.svg("0 0 720 300",
  K.band(20,8,320,26,"BEFORE — one flat network (VLAN 1)")+
  K.dev("switch",180,80,"SW1","all ports in VLAN 1")+
  K.dev("pc",50,220,"Sales-1","")+K.dev("pc",130,220,"Sales-2","")+K.dev("pc",230,220,"Acc-1","")+K.dev("pc",310,220,"Acc-2","")+
  K.link(168,92,56,198)+K.link(176,92,132,198)+K.link(184,92,228,198)+K.link(192,92,304,198)+
  K.arrow(62,196,160,98,"ARP?",true)+K.arrow(190,98,130,192,"",true)+K.arrow(196,98,228,192,"",true)+K.arrow(202,98,306,192,"",true)+
  K.txt(180,285,"one broadcast reaches everyone",{c:"warn",s:11,mid:true})+
  K.band(380,8,320,26,"AFTER — same switch, two VLANs")+
  K.dev("switch",540,80,"SW1","")+
  K.band(380,154,150,22,"VLAN 10 · SALES","var(--chip)")+K.band(550,154,150,22,"VLAN 20 · ACCOUNTS","var(--chip)")+
  K.dev("pc",410,220,"Sales-1","")+K.dev("pc",490,220,"Sales-2","")+K.dev("pc",590,220,"Acc-1","")+K.dev("pc",670,220,"Acc-2","")+
  K.link(528,92,416,198)+K.link(536,92,492,198)+K.link(544,92,588,198)+K.link(552,92,664,198)+
  K.arrow(422,196,520,98,"ARP?",true)+K.arrow(530,98,490,192,"",true)+
  K.txt(540,285,"the broadcast stays inside VLAN 10",{c:"ok",s:11,mid:true}),
  "Left: one broadcast domain — Sales-1's ARP request is flooded to every port. Right: the same switch split into two VLANs. The ARP request is flooded only to ports in VLAN 10; Accounts never sees it.")}
${K.analogy(`<p>Picture an open-plan office with one loudspeaker: every announcement — &ldquo;Mr Okafor, call reception&rdquo; — reaches all 200 people. VLANs give each department its own room and speakers without building walls; the rooms are drawn in the switch's configuration. People in different rooms can still talk, but only through a corridor with a receptionist in it — a router, which you'll meet in lesson 3.</p>`)}
${K.check({q:"A 48-port switch has every port in VLAN 1. A PC on port 3 sends an ARP request. Which devices receive it?", o:["Only the device that owns the IP address being asked about","Every device on the switch (and on switches joined to it), because they are all in one broadcast domain","Only devices with an entry in the MAC address table","Only the default gateway"], a:1, why:"An ARP request is a broadcast. With every port in VLAN 1 there is one broadcast domain, so the switch floods it out every port except port 3, and onwards across any connected switches."})}

<h2>What a VLAN is — and the numbers it uses</h2>
<p>A ${K.g("VLAN","A Virtual LAN: a group of switch ports that form their own broadcast domain, separate from other VLANs on the same switch.")} is a group of switch ports that behave as if they were on their own separate switch. Plain-language version: <b>a VLAN is a broadcast domain that you create with configuration instead of hardware.</b></p>
<p>The precise version. Inside the switch, every port belongs to a VLAN, and the switch keeps the VLANs apart:</p>
<ul>
<li>A frame that arrives on a port in VLAN 10 can only leave through ports in VLAN 10.</li>
<li>Broadcasts and unknown unicasts are flooded only to the other ports in the same VLAN.</li>
<li>The MAC address table is kept per VLAN — you saw the <code>Vlan</code> column in Module 2. The same switch can learn a MAC in VLAN 10 and know nothing about it in VLAN 20.</li>
<li>To get from one VLAN to another, traffic must be <b>routed</b>, by a router or a Layer 3 switch, exactly as if the VLANs were separate physical networks (lesson 3).</li>
</ul>
<h3>One VLAN, one subnet</h3>
<p>Because a VLAN is a broadcast domain, and in Module 3 a subnet was the set of addresses that can reach each other without a router, the two line up: <b>in a normal design, each VLAN gets exactly one IP subnet</b>. VLAN 10 might be <code>10.20.10.0/24</code> and VLAN 20 <code>10.20.20.0/24</code>, each with its own default gateway.</p>
<p>Why one-to-one? Get it wrong either way and it hurts:</p>
<ul>
<li><b>One subnet split across two VLANs</b> (the classic mistake). PC1 in VLAN 10 is <code>192.168.1.11/24</code>, PC4 in VLAN 20 is <code>192.168.1.14/24</code>. PC1 thinks PC4 is local and ARPs for it; the broadcast stays in VLAN 10, and the ping fails with &ldquo;Destination host unreachable&rdquo;. You'll do this in the bench.</li>
<li><b>Two subnets in one VLAN.</b> It works, but you've kept the shared broadcast domain and lost the separation. Avoid it.</li>
</ul>
${K.remember(`<b>One VLAN = one broadcast domain = one subnet.</b> If two devices are in different VLANs, they need a router to talk — and they should be in different subnets so they know to use it.`)}
<h3>VLAN IDs: what numbers you can use</h3>
<p>Every VLAN has a number, the ${K.g("VLAN ID","The VLAN's number, 1–4094. It travels in the 802.1Q tag on trunk links (lesson 2).")}, from 1 to 4094, and an optional name. The number is what matters to the switch; the name is for humans. The ID travels in a 12-bit field of the ${K.g("802.1Q","The IEEE standard for VLAN tagging: it adds a small tag carrying the VLAN ID to each frame on a link that carries many VLANs. Lesson 2 covers it in full.")} tag (lesson 2) — 12 bits gives 4,096 values, and 0 and 4095 are reserved, which leaves 1–4094.</p>
<div class="tablewrap"><table>
<tr><th>VLAN IDs</th><th>Range</th><th>What you need to know</th></tr>
<tr><td><code>1</code></td><td>Normal</td><td>The ${K.g("default VLAN","VLAN 1: every port is in it out of the box. It cannot be deleted or renamed.")}. Every port starts here. Cannot be deleted or renamed.</td></tr>
<tr><td><code>2–1001</code></td><td>Normal</td><td>Yours to create, name and delete. Most offices only ever use these.</td></tr>
<tr><td><code>1002–1005</code></td><td>Normal (reserved)</td><td>Created automatically for two long-dead LAN types, ${K.g("FDDI","Fiber Distributed Data Interface: a 1980s–90s 100 Mb/s ring network that ran over fibre. Ethernet replaced it long ago.")} and Token Ring. Cannot be deleted or used. They appear in every <code>show vlan brief</code> as <code>act/unsup</code>.</td></tr>
<tr><td><code>1006–4094</code></td><td>${K.g("Extended","VLAN IDs 1006–4094. Usable, but with VTP versions 1 and 2 the switch must be in VTP transparent (or off) mode (lesson 2).")}</td><td>Usable, mostly by service providers and big data centres. With ${K.g("VTP","VLAN Trunking Protocol: Cisco's protocol for copying VLAN definitions between switches. Lesson 2.")} versions 1 and 2 the switch must be in transparent (or off) mode to create them; in the default server mode IOS refuses with <code>Extended VLAN(s) not allowed in current VTP mode</code> (lesson 2).</td></tr>
</table></div>
${K.dyk(`Normal-range VLANs are saved in their own flash file, <code>vlan.dat</code>, the moment you create them. So a lab switch given <code>erase startup-config</code> and a reload loses its port settings but still shows your old VLANs. To wipe a switch completely, engineers also delete <code>flash:vlan.dat</code>. (Extended VLANs, 1006–4094, are the exception under VTP v1/v2: they live in the running-config, so they need saving and an erase does remove them.)`)}
${K.q({type:"match", q:"Match each VLAN ID with the statement that describes it.", pairs:[["VLAN 1","The default VLAN — every port starts here; it can't be deleted"],["VLAN 250","Normal range — free to create, name and delete"],["VLAN 1003","Reserved for Token Ring — listed as act/unsup, can't be deleted"],["VLAN 2000","Extended range — needs VTP transparent mode with VTP v1/v2"],["VLAN 4095","Reserved — not a usable VLAN ID"]], why:"1 is the default; 2–1001 are yours; 1002–1005 are the legacy FDDI/Token Ring VLANs; 1006–4094 are extended; 0 and 4095 are reserved by the 802.1Q standard."})}
${K.check({q:"Two PCs are plugged into the same switch. PC A is in VLAN 10 and PC B is in VLAN 20. There is no router. Which statement is true?", o:["They can communicate because they share a switch","They can communicate only if they are in the same subnet","They cannot communicate: different VLANs are different broadcast domains, and traffic between them must be routed","They can communicate, but only with broadcasts"], a:2, why:"The switch keeps VLANs apart completely. Without a router (or Layer 3 switch) between VLAN 10 and VLAN 20, no frame from A can reach B, whatever IP addresses they have."})}

<h2>Creating VLANs and assigning access ports</h2>
<p>Putting a device in a VLAN takes two jobs: create the VLAN, then make the device's port an ${K.g("access port","A switch port that carries one data VLAN, untagged. PCs, printers and servers connect to access ports.")} in that VLAN. An access port carries traffic for one VLAN, and the device on it never knows: its frames go in and out untagged, exactly like on a home switch. The alternative, a ${K.g("trunk port","A port that carries many VLANs at once, each frame tagged with its VLAN ID (802.1Q). Used between switches and to routers. Lesson 2.")}, carries many VLANs between switches and is lesson 2.</p>
<h3>Step 1 — create and name the VLAN</h3>
${K.out(`SW1#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
SW1(config)#vlan 10
SW1(config-vlan)#name SALES
SW1(config-vlan)#vlan 20
SW1(config-vlan)#name ACCOUNTS
SW1(config-vlan)#exit
SW1(config)#`, "Creating two VLANs. vlan 10 creates the VLAN (or opens it if it already exists) and enters VLAN configuration mode; name sets its label.")}
<ul>
<li><code>vlan 10</code> creates VLAN 10 and moves you to <code>(config-vlan)#</code>. Unnamed, IOS calls it <code>VLAN0010</code>.</li>
<li><code>name SALES</code> labels it (up to 32 characters). Keep names to one word in capitals, hyphens if needed (<code>HR-STAFF</code>).</li>
<li>Typing <code>vlan 20</code> inside VLAN 10's mode is fine: it's a global command, so IOS drops back to global config and runs it. (You can also create several at once with a list or range, e.g. <code>vlan 10,20,30</code> or <code>vlan 100-105</code>; name them afterwards one by one.)</li>
</ul>
<h3>Step 2 — make the port an access port and pick its VLAN</h3>
${K.out(`SW1(config)#interface range gigabitEthernet 1/0/1 - 2
SW1(config-if-range)#switchport mode access
SW1(config-if-range)#switchport access vlan 10
SW1(config-if-range)#exit
SW1(config)#interface range gigabitEthernet 1/0/3 - 4
SW1(config-if-range)#switchport mode access
SW1(config-if-range)#switchport access vlan 20
SW1(config-if-range)#end
SW1#copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]`, "Ports 1–2 become access ports in VLAN 10, ports 3–4 in VLAN 20. interface range applies the same commands to several ports at once.")}
<ul>
<li><code>switchport mode access</code> fixes the port as an access port. Without it, a Catalyst port is <code>dynamic auto</code> and could negotiate itself into a trunk (${K.g("DTP","Dynamic Trunking Protocol: a Cisco protocol that lets two connected switch ports agree by themselves whether to become a trunk. Lesson 2.")}, lesson 2).</li>
<li><code>switchport access vlan 10</code> puts the port in VLAN 10 — instantly, with no link drop, and the device never knows.</li>
<li>Port settings live in the running-config, so <b>save</b>, or a power cut puts every port back in VLAN 1.</li>
</ul>
${K.steps([
  ["Create", "<code>vlan 30</code> — the VLAN must exist before ports in it can forward."],
  ["Name", "<code>name PRINTERS</code> — so the next engineer understands <code>show vlan brief</code>."],
  ["Mode", "<code>interface g1/0/7</code> then <code>switchport mode access</code> — stop it negotiating."],
  ["Assign", "<code>switchport access vlan 30</code>; add a <code>description</code> while you're there."],
  ["Verify", "<code>show vlan brief</code> and <code>show interfaces g1/0/7 switchport</code> — then test from the device."],
  ["Save", "<code>copy running-config startup-config</code>."],
])}
${K.remember(`<b>Create → Name → Mode → Assign → Verify → Save.</b> &ldquo;Cats Never Make Any Vet Smile.&rdquo;`)}
${K.mistake(`Typing the wrong VLAN number. If you type <code>switchport access vlan 100</code> when you meant 10, IOS does not refuse — it says <code>% Access VLAN does not exist. Creating vlan 100</code>, creates an empty VLAN 100 and puts the user in it, alone. Their link light stays green and their PC is cut off. Read every message IOS prints back to you.`)}
<h3>Reading show vlan brief, line by line</h3>
<p>This is the command you'll run most often in this module. Here is a real-format output from a 24-port Catalyst 9200 after a few VLANs have been set up:</p>
${K.out(`SW-IKJ-2F#show vlan brief

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi1/0/23, Gi1/1/1, Gi1/1/2, Gi1/1/3
                                                Gi1/1/4
10   STAFF                            active    Gi1/0/1, Gi1/0/2, Gi1/0/3, Gi1/0/4
                                                Gi1/0/5, Gi1/0/6, Gi1/0/7, Gi1/0/8
20   VOICE                            active    Gi1/0/1, Gi1/0/2, Gi1/0/3, Gi1/0/4
30   PRINTERS                         active    Gi1/0/19, Gi1/0/20
999  PARKING                          active    Gi1/0/21, Gi1/0/22
1002 fddi-default                     act/unsup
1003 token-ring-default               act/unsup
1004 fddinet-default                  act/unsup
1005 trnet-default                    act/unsup`, "show vlan brief on an office access switch. Ports 9–18 and 24 are missing from the list — the reasons are below.")}
<ul>
<li><b>VLAN</b> and <b>Name</b> — the ID and label. VLAN 1 is always called <code>default</code>.</li>
<li><b>Status</b> — <code>active</code>: exists and forwards. <code>act/unsup</code> (1002–1005): exists, can't be used.</li>
<li><b>Ports</b> — the <b>access ports</b> in that VLAN, four per line, wrapping under the same VLAN.</li>
<li><b>Gi1/0/1–4 appear twice</b>, under STAFF and VOICE: a data VLAN plus a voice VLAN for IP phones (later in this lesson). Normal.</li>
<li><b>Gi1/0/24 isn't listed.</b> It's the uplink, a <b>trunk</b>, and trunks never appear here — use <code>show interfaces trunk</code> (lesson 2). <b>Ports 9–18 are missing too</b>: their VLAN was deleted (next section).</li>
</ul>
<p>For one port in detail, use <code>show interfaces g1/0/5 switchport</code>: look for <code>Administrative Mode: static access</code>, <code>Access Mode VLAN: 10 (STAFF)</code> and <code>Voice VLAN: 20 (VOICE)</code>. <code>show interfaces status</code> also has a <code>Vlan</code> column.</p>
${K.exam(`Know what <code>show vlan brief</code> does <b>not</b> show: trunk ports, and ports in a VLAN that doesn't exist. &ldquo;Gi0/24 is missing from the output&rdquo; — think <i>trunk</i> first. Every unconfigured port is in VLAN 1.`)}
<h3>Deleting a VLAN: the ports don't move</h3>
<p><code>no vlan 40</code> deletes VLAN 40. What it does <i>not</i> do is move VLAN 40's ports anywhere. Each port keeps <code>switchport access vlan 40</code> in its config, pointing at a VLAN that no longer exists. The port is now <b>inactive</b>: link up, green light, but it forwards nothing. The users on it are offline, and the ports disappear from <code>show vlan brief</code>, which makes the fault easy to miss. <code>show interfaces switchport</code> gives it away:</p>
${K.out(`SW-IKJ-2F#show interfaces gi1/0/9 switchport
Name: Gi1/0/9
Switchport: Enabled
Administrative Mode: static access
Operational Mode: static access
Administrative Trunking Encapsulation: dot1q
Operational Trunking Encapsulation: native
Negotiation of Trunking: Off
Access Mode VLAN: 40 (Inactive)
Trunking Native Mode VLAN: 1 (default)
Voice VLAN: none`, "Access Mode VLAN: 40 (Inactive) — the port is assigned to a VLAN that doesn't exist. Recreate VLAN 40 or move the port to the right VLAN.")}
<p>Two ways out: recreate the VLAN (<code>vlan 40</code>) and the ports come back to life, or move them to the VLAN they should be in.</p>
${K.mistake(`Deleting a VLAN to &ldquo;tidy up&rdquo; without checking its ports. Every device in it goes offline with green link lights. Run <code>show vlan brief</code> first, move the ports, check it isn't used on other switches, then delete.`)}
<h3>Practise: set up an office access switch</h3>
<p>This switch is on the 2nd floor of the Ikeja office. A contractor left a test VLAN on it. Your job: build the VLANs, configure six desk ports for staff PCs with IP phones, deal with the contractor's VLAN, park an unused port, and save.</p>
${K.hint(`Configuration commands need <code>configure terminal</code> first. <code>interface range g0/1 - 6</code> configures six ports at once. Inside <code>(config-vlan)#</code> or <code>(config-if)#</code> you can still run show commands with <code>do</code>, e.g. <code>do show vlan brief</code>. <code>?</code> after a partial command lists what can come next.`)}
${K.term({env:"ios2", title:"VLANs and access ports on SW-IKJ-2F", opts:{kind:"switch", host:"SW-IKJ-2F", model:"C9200L-24P-4G",
  motd:"SW-IKJ-2F — 2nd floor access switch, Ikeja office. Gi0/1-6 desks (PC + IP phone), Gi0/7 printer, Gi0/8 spare, Gi0/9-10 uplinks."},
  setup:env=>{ env.vlans[40] = "OLD-TEST"; Object.assign(env.intfs["GigabitEthernet0/7"], {mode:"access", vlan:40}); },
  intro:"Start with <code>enable</code> and <code>show vlan brief</code> to see what's there before you change anything.",
  tasks:[
    {text:"Create VLAN 10 named <code>STAFF</code>, VLAN 20 named <code>VOICE</code> and VLAN 30 named <code>PRINTERS</code>", done:e=>/^staff$/i.test(e.vlans[10]||"") && /^voice$/i.test(e.vlans[20]||"") && /^printers$/i.test(e.vlans[30]||"")},
    {text:"Desk ports Gi0/1–Gi0/6: <code>switchport mode access</code>, access VLAN 10, and <code>switchport voice vlan 20</code> for the phones (a second VLAN on the same port just for IP-phone traffic — the voice VLAN section below explains how the phone and the PC share one cable)", done:e=>[1,2,3,4,5,6].every(n=>{ const i = e.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===10 && i.voiceVlan===20; })},
    {text:"Delete the contractor's VLAN 40 with <code>no vlan 40</code>, then run <code>show interfaces g0/7 switchport</code> and find <code>Access Mode VLAN: 40 (Inactive)</code>", done:e=>!e.vlans[40] && e.log.some(l=>/Access Mode VLAN: 40 \(Inactive\)/.test(l.out))},
    {text:"Gi0/7 is the floor printer: move it to VLAN 30 (access)", done:e=>{ const i = e.intfs["GigabitEthernet0/7"]; return i.mode==="access" && i.vlan===30; }},
    {text:"Park the spare port: create VLAN 999 named <code>PARKING</code>, make Gi0/8 an access port in VLAN 999, and <code>shutdown</code> it", done:e=>{ const i = e.intfs["GigabitEthernet0/8"]; return /^parking$/i.test(e.vlans[999]||"") && i.mode==="access" && i.vlan===999 && i.shut; }},
    {text:"Non-Cisco phones arrive next month and learn their VLAN by LLDP, not CDP: turn LLDP on with <code>lldp run</code>", done:e=>e.lldpRun},
    {text:"<code>show vlan brief</code> — check Gi0/1–Gi0/6 are listed under both STAFF and VOICE, and Gi0/7 under PRINTERS", done:e=>e.log.some(l=>/^20\s+VOICE\s+active\s+Gi0\/1, Gi0\/2/mi.test(l.out) && /^30\s+PRINTERS\s+active\s+Gi0\/7/mi.test(l.out))},
    {text:"Save the configuration", done:e=>e.savedOnce},
  ],
  win:"You built a real access-switch VLAN layout: data and voice VLANs on the desk ports, a printer VLAN, a parked and shut spare port, LLDP ready for third-party phones — and you saw for yourself that deleting a VLAN strands its ports as Inactive.",
  solve:["enable","show vlan brief","configure terminal","vlan 10","name STAFF","vlan 20","name VOICE","vlan 30","name PRINTERS","exit","interface range g0/1 - 6","switchport mode access","switchport access vlan 10","switchport voice vlan 20","exit","no vlan 40","do show interfaces g0/7 switchport","interface g0/7","switchport access vlan 30","exit","vlan 999","name PARKING","exit","interface g0/8","switchport mode access","switchport access vlan 999","shutdown","exit","lldp run","end","show vlan brief","copy running-config startup-config",""]})}
<p>Did you spot it? After <code>no vlan 40</code>, Gi0/7 vanished from <code>show vlan brief</code>, and only <code>show interfaces g0/7 switchport</code> still said <code>40 (Inactive)</code> — the one clue the floor's printing had died.</p>
${K.check({q:"You run no vlan 50 on an access switch. Ports Gi1/0/10–12 were access ports in VLAN 50. What happens to them?", o:["They move to VLAN 1 automatically","They keep switchport access vlan 50, become inactive and stop forwarding, and disappear from show vlan brief","They become trunk ports","The switch refuses to delete a VLAN that has ports"], a:1, why:"Deleting a VLAN doesn't touch port configuration. The ports still point at VLAN 50, which no longer exists, so they forward nothing. show interfaces switchport shows Access Mode VLAN: 50 (Inactive)."})}

<h2>Hands-on: split one switch into two networks</h2>
<p>Now watch VLANs work on the wire. The bench has one switch and four PCs: PC1 and PC2 are Sales, PC3 and PC4 are Accounts. Today they're all in VLAN 1 and all in <code>192.168.1.0/24</code> — one flat network. You'll prove that, split the switch into two VLANs, and watch broadcasts stop crossing the line. The frame log is open: amber dots are broadcasts, teal dots are unicasts.</p>
${K.bench({id:"m4-vlan-split", points:80, from:"CCNA · Module 4 · lesson 1", title:"one switch, two VLANs — watch the broadcast stay inside", viewBox:"0 0 760 380", openLog:true,
  intro:"Console in from the laptop (console cable USB → CON, 9600 8N1, no flow control). Use each PC's Command Prompt for pings and IP settings to re-address. PC MACs end in 0011–0014 so you can spot them in the log.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · sales & accounts", x:170, y:20},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:630, y:20},
    {id:"pc1", kind:"pc", label:"PC1 Sales", x:20, y:250, ip:"192.168.1.11", mask:"255.255.255.0", gw:"192.168.1.1", mac:"a4bb.6d10.0011"},
    {id:"pc2", kind:"pc", label:"PC2 Sales", x:190, y:250, ip:"192.168.1.12", mask:"255.255.255.0", gw:"192.168.1.1", mac:"a4bb.6d10.0012"},
    {id:"pc3", kind:"pc", label:"PC3 Accts", x:410, y:250, ip:"192.168.1.13", mask:"255.255.255.0", gw:"192.168.1.1", mac:"a4bb.6d20.0013"},
    {id:"pc4", kind:"pc", label:"PC4 Accts", x:580, y:250, ip:"192.168.1.14", mask:"255.255.255.0", gw:"192.168.1.1", mac:"a4bb.6d20.0014"},
  ],
  cables:[ {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"pc2:eth", b:"sw1:g2"}, {type:"cat6", a:"pc3:eth", b:"sw1:g3"}, {type:"cat6", a:"pc4:eth", b:"sw1:g4"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Console into SW1 from the laptop (9600 baud, 8 data bits, no parity, 1 stop bit, no flow control)", done:B=>Bench.consoleOk(B,"sw1")},
    {text:"<code>enable</code>, then <code>show vlan brief</code> — every port is in VLAN 1 <code>default</code>", done:B=>B.devs.sw1.env.log.some(l=>/^1\s+default\s+active\s+Gi0\/1, Gi0\/2, Gi0\/3, Gi0\/4/m.test(l.out))},
    {text:"Flat network: from PC1, <code>ping 192.168.1.13</code> (PC3, Accounts). In the log, the one ARP broadcast is flooded to PC2, PC3 <i>and</i> PC4", done:B=>Bench.tried(B,"pc1",/^\s*ping\s+192\.168\.1\.13\s*$/i)},
    {text:"Create VLAN 10 named <code>SALES</code> and VLAN 20 named <code>ACCOUNTS</code>", done:B=>{ const v = B.devs.sw1.env.vlans; return /^sales$/i.test(v[10]||"") && /^accounts$/i.test(v[20]||""); }},
    {text:"Make Gi0/1 and Gi0/2 access ports in VLAN 10", done:B=>{ const f = B.devs.sw1.env.intfs; return [1,2].every(n=>f["GigabitEthernet0/"+n].mode==="access" && f["GigabitEthernet0/"+n].vlan===10); }},
    {text:"Make Gi0/3 and Gi0/4 access ports in VLAN 20", done:B=>{ const f = B.devs.sw1.env.intfs; return [3,4].every(n=>f["GigabitEthernet0/"+n].mode==="access" && f["GigabitEthernet0/"+n].vlan===20); }},
    {text:"<code>show vlan brief</code> again — SALES lists Gi0/1, Gi0/2 and ACCOUNTS lists Gi0/3, Gi0/4", done:B=>B.devs.sw1.env.log.some(l=>/^10\s+SALES\s+active\s+Gi0\/1, Gi0\/2\s*$/mi.test(l.out) && /^20\s+ACCOUNTS\s+active\s+Gi0\/3, Gi0\/4\s*$/mi.test(l.out))},
    {text:"From PC1, <code>ping 192.168.1.12</code> (PC2) — same VLAN, still works", done:B=>{ const f = B.devs.sw1.env.intfs; return f["GigabitEthernet0/1"].vlan===10 && f["GigabitEthernet0/2"].vlan===10 && Bench.pinged(B,"pc1","192.168.1.12"); }},
    {text:"From PC1, <code>ping 192.168.1.14</code> (PC4, Accounts) — it fails. In the log, the ARP request goes out Gi0/2 only and nobody answers", done:B=>{ const f = B.devs.sw1.env.intfs; return f["GigabitEthernet0/1"].vlan===10 && f["GigabitEthernet0/4"].vlan===20 && Bench.tried(B,"pc1",/^\s*ping\s+192\.168\.1\.14\s*$/i) && !Bench.pinged(B,"pc1","192.168.1.14"); }},
    {text:"One VLAN, one subnet: give Accounts its own subnet — PC3 <code>192.168.20.13</code>, PC4 <code>192.168.20.14</code>, mask <code>255.255.255.0</code>, gateway <code>192.168.20.1</code> — then ping PC4 from PC3", done:B=>{ const a = B.devs.pc3, b = B.devs.pc4; return a.ip==="192.168.20.13" && b.ip==="192.168.20.14" && a.mask==="255.255.255.0" && b.mask==="255.255.255.0" && a.gw==="192.168.20.1" && b.gw==="192.168.20.1" && Bench.pinged(B,"pc3","192.168.20.14"); }},
    {text:"Save SW1's configuration", done:B=>B.devs.sw1.env.savedOnce},
  ],
  win:"You split one physical switch into two broadcast domains. Before, one ARP reached every PC; after, broadcasts stayed inside their VLAN, PCs in the same VLAN still talked, PCs in different VLANs couldn't, and each VLAN got its own subnet — ready for the router in lesson 3.",
  solve:[["plug","console","lap:usb","sw1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show vlan brief"],
    ["pc","pc1","ping 192.168.1.13"],
    ["term","configure terminal"],["term","vlan 10"],["term","name SALES"],["term","vlan 20"],["term","name ACCOUNTS"],["term","exit"],
    ["term","interface range g0/1 - 2"],["term","switchport mode access"],["term","switchport access vlan 10"],["term","exit"],
    ["term","interface range g0/3 - 4"],["term","switchport mode access"],["term","switchport access vlan 20"],["term","end"],
    ["term","show vlan brief"],["pc","pc1","ping 192.168.1.12"],["pc","pc1","ping 192.168.1.14"],
    ["ip","pc3","192.168.20.13","255.255.255.0","192.168.20.1"],["ip","pc4","192.168.20.14","255.255.255.0","192.168.20.1"],["pc","pc3","ping 192.168.20.14"],
    ["term","write memory"]]})}
${K.hint(`If the ARP request in step 3 doesn't seem to reach PC4, open the frame log and read the line <i>&ldquo;SW1 received a broadcast → flooded out Gi0/2, Gi0/3, Gi0/4 in VLAN 1&rdquo;</i>. After the split, the same line reads <i>&ldquo;flooded out Gi0/2 in VLAN 10&rdquo;</i> — that one line is the whole lesson.`)}
<p>Read what you saw. Before the split, PC1's ARP request went out Gi0/2, Gi0/3 and Gi0/4: one broadcast domain. After it, the ARP request for PC4 went out <b>Gi0/2 only</b> and nobody answered. Windows reports a failed ARP as <code>Reply from 192.168.1.11: Destination host unreachable</code> — the &ldquo;reply&rdquo; is PC1 itself saying it found no MAC for PC4.</p>
<p>Ping PC3 again from PC1 after the split and the log shows something subtler: PC1 still has PC3's MAC cached, so it sends a unicast straight away — and the switch, with no entry for that MAC <i>in VLAN 10</i>, floods it to Gi0/2 only. Even a frame addressed to PC3's MAC can't cross the boundary.</p>
<p>The last step fixed the design, not the connectivity: Accounts now has a subnet matching its VLAN, with a gateway (<code>192.168.20.1</code>) that lesson 3's router will provide. That router is where you'll decide what may cross.</p>
${K.check({q:"In the bench, after the split, PC1 (VLAN 10, 192.168.1.11/24) pinged PC4 (VLAN 20, 192.168.1.14/24) and got 'Destination host unreachable'. Why exactly did it fail?", o:["The switch dropped the ICMP packet because it was addressed to another VLAN","PC1 sent an ARP broadcast for 192.168.1.14 because it thought PC4 was local; the switch flooded it only within VLAN 10, so PC4 never heard it and never replied","PC4's firewall blocked the ping","PC1 had no default gateway"], a:1, why:"PC1's mask says .14 is on its own subnet, so it ARPs directly instead of using a gateway. The ARP broadcast stays in VLAN 10, PC4 is in VLAN 20, nobody answers, and Windows reports the failed ARP as Destination host unreachable."})}

<h2>The voice VLAN: a phone and a PC on one port</h2>
<p>Most desks have one network socket but two devices: an IP phone and a PC. Rather than cable every desk twice, IP phones contain a small three-port switch — wall, PC, and the phone itself — so the PC plugs into the back of the phone and both share one cable.</p>
<p>You still want them in <b>different VLANs</b>: voice must be protected from a PC's big download, and phones need their own DHCP scope and security rules. One port, two VLANs is the job of the ${K.g("voice VLAN","A second VLAN on an access port, used by an IP phone. Voice frames are 802.1Q-tagged; the PC's data frames stay untagged in the access VLAN.")}.</p>
${K.svg("0 0 720 280",
  K.dev("switch",110,90,"SW-IKJ-2F","Gi1/0/5")+
  K.dev("phone",380,90,"IP phone","3-port switch inside")+
  K.dev("pc",620,90,"PC","untagged only")+
  K.link(136,90,370,90,"one cable to the wall")+K.link(390,90,602,90,"PC port on the phone")+
  K.band(170,150,180,24,"data: untagged → VLAN 10","var(--chip)")+
  K.band(170,182,180,24,"voice: tag 20 → VLAN 20","var(--chip)")+
  K.band(440,150,160,24,"data: untagged","var(--chip)")+
  K.arrow(330,232,150,232,"CDP/LLDP: voice VLAN = 20",true)+
  K.txt(110,265,"switchport access vlan 10 · switchport voice vlan 20",{c:"fg",s:11}),
  "One switch port, two VLANs. The PC's frames pass through the phone untagged and land in the access (data) VLAN, 10. The phone tags its own voice frames with VLAN 20. The switch tells the phone which VLAN to tag with, using CDP (Cisco phones) or LLDP-MED (other brands).")}
<h3>How the two kinds of frame are told apart</h3>
<ul>
<li><b>Data from the PC</b> arrives at the switch <b>untagged</b>, as from any normal NIC. The switch puts it in the port's access VLAN — VLAN 10.</li>
<li><b>Voice from the phone</b> arrives with an ${K.g("802.1Q tag","A 4-byte field inserted into an Ethernet frame that carries the VLAN ID (and a priority value). Explained fully in lesson 2.")} saying &ldquo;VLAN 20&rdquo;. The switch reads the tag and puts the frame in VLAN 20. (The tag also carries a priority, which QoS uses to put voice first — a later module.)</li>
<li>Traffic <i>to</i> the PC leaves the switch untagged; traffic to the phone leaves tagged for VLAN 20. The phone's internal switch sorts it out.</li>
</ul>
<p>The port is still an access port — not a trunk. It carries one untagged data VLAN plus one voice VLAN and nothing else. That's why it's listed twice in <code>show vlan brief</code>, once under each VLAN, and why you'll sometimes hear it called a ${K.g("multi-VLAN access port","Cisco's term for an access port with a voice VLAN: one data VLAN untagged plus one tagged voice VLAN.")}.</p>
<h3>How the phone knows which VLAN to tag</h3>
<p>Nobody configures the phone. When it boots, the switch tells it, using a discovery protocol: ${K.g("CDP","Cisco Discovery Protocol: Cisco devices announce themselves to directly connected neighbours. Carries the voice VLAN to Cisco phones. On by default.")} for Cisco phones (on by default on Catalyst switches), or ${K.g("LLDP","Link Layer Discovery Protocol: the IEEE standard version of CDP. Its LLDP-MED extension tells non-Cisco phones their voice VLAN. Off by default on Catalyst; turn it on with lldp run.")} with its LLDP-MED extension for other brands. The phone hears &ldquo;voice VLAN is 20&rdquo;, starts tagging, and asks the DHCP server for an address in the voice subnet. If CDP or LLDP is off, the phone never hears the announcement: it sends untagged, lands in the data VLAN, and gets a PC address — and the call manager may not reach it.</p>
<h3>Worked example: a new phone deployment</h3>
<p>A Lagos insurance broker is replacing desk phones on the 2nd floor. Desks plug into Gi1/0/1–24; voice is VLAN 20 (<code>10.20.20.0/24</code>), staff PCs VLAN 10 (<code>10.20.10.0/24</code>).</p>
${K.steps([
  ["Check the VLANs exist", "<code>show vlan brief</code> — STAFF and VOICE are there (if not: <code>vlan 20</code>, <code>name VOICE</code>)."],
  ["Configure the desk ports", "<code>interface range g1/0/1 - 24</code>, <code>switchport mode access</code>, <code>switchport access vlan 10</code>, <code>switchport voice vlan 20</code>."],
  ["Let the phones hear the switch", "CDP is on by default (<code>show cdp neighbors</code> lists Cisco phones once they boot). These phones are another brand, so add <code>lldp run</code>."],
  ["Verify one phone", "<code>show interfaces g1/0/1 switchport</code> shows <code>Access Mode VLAN: 10 (STAFF)</code> and <code>Voice VLAN: 20 (VOICE)</code>; the phone shows an IP in <code>10.20.20.x</code>, the PC behind it <code>10.20.10.x</code>."],
  ["Roll out and save", "Spot-check a few, make a test call, <code>copy running-config startup-config</code>."],
])}
${K.q({type:"order", q:"An IP phone with a PC behind it is plugged into a port configured with switchport access vlan 10 and switchport voice vlan 20. Put what happens in order.", items:["The link comes up and the phone boots","The switch's CDP or LLDP announcement tells the phone its voice VLAN is 20","The phone tags its own voice frames with VLAN 20 and gets an address from the voice subnet","The PC's frames pass through the phone untagged and the switch puts them in VLAN 10"], why:"The phone can't tag until it knows the VLAN, and it learns that from the switch's CDP (Cisco) or LLDP-MED (other brands) announcement. The PC never changes: its untagged frames always land in the access VLAN."})}
${K.when([
  ["Access port, data VLAN only","A PC, printer, server or camera — one device, one VLAN","Simplest; device needs no VLAN awareness","An IP phone is on the desk"],
  ["Access port + voice VLAN","An IP phone, often with a PC plugged into it","Two VLANs on one cable; phone learns its VLAN by CDP/LLDP","The device behind the port needs several VLANs (e.g. an access point)"],
  ["Parking VLAN + shutdown","An unused socket","Nothing can plug in and get onto a live network","The port is about to be used — move it into the right VLAN and bring it up"],
  ["Trunk (lesson 2)","Switch-to-switch links, routers on a stick, many access points","Carries many VLANs, each tagged","A user desk port — never trunk to a desk"],
], "How to configure a switch port")}
${K.check({q:"Desk port Gi1/0/12 has switchport access vlan 10 and switchport voice vlan 20. A PC is plugged into the back of the IP phone. How does the switch tell the PC's frames from the phone's?", o:["By the source IP address","The PC's frames arrive untagged (VLAN 10); the phone's voice frames carry an 802.1Q tag for VLAN 20","The phone uses a different physical pair in the cable","It can't — they must be on separate ports"], a:1, why:"An access port with a voice VLAN accepts untagged frames into the access VLAN and frames tagged with the voice VLAN ID into the voice VLAN. The phone learned VLAN 20 from CDP or LLDP."})}

<h2>Designing VLANs for an office — and keeping VLAN 1 empty</h2>
<p>The other half of the job is deciding <i>which</i> VLANs a site needs — a decision that lasts years. Group devices that need the same treatment (security rules, kind of traffic, who's responsible) and give each group its own VLAN and subnet.</p>
<h3>A typical office plan</h3>
<p>Here is a plan for a 250-person office using <code>10.20.0.0/16</code>, with subnets sized the Module 3 way: count the hosts, add room to grow, pick the prefix. A handy convention makes the plan self-explaining: the <b>VLAN number matches the third octet</b>, and the gateway is always <code>.1</code>.</p>
<div class="tablewrap"><table>
<tr><th>VLAN</th><th>Name</th><th>Who's in it</th><th>Subnet</th><th>Why separate</th></tr>
<tr><td>10</td><td>STAFF</td><td>Staff PCs and laptops (wired)</td><td><code>10.20.10.0/24</code></td><td>The main user population; up to 254 hosts</td></tr>
<tr><td>20</td><td>VOICE</td><td>IP phones (voice VLAN on desk ports)</td><td><code>10.20.20.0/24</code></td><td>Protect call quality; own DHCP options and rules</td></tr>
<tr><td>30</td><td>PRINTERS</td><td>Printers and copiers</td><td><code>10.20.30.0/26</code></td><td>Old, rarely-patched firmware; 62 hosts is plenty</td></tr>
<tr><td>40</td><td>SERVERS</td><td>Local file and app servers</td><td><code>10.20.40.0/27</code></td><td>Valuable targets; tight rules about who reaches them</td></tr>
<tr><td>50</td><td>GUEST</td><td>Visitors (guest Wi-Fi, lounge ports)</td><td><code>10.20.50.0/24</code></td><td>Internet only — must never reach staff networks</td></tr>
<tr><td>99</td><td>${K.g("MGMT","Short for management: the VLAN that holds the network devices' own IP addresses, which IT uses to log in to and monitor them.")}</td><td>Switch, AP and UPS management addresses</td><td><code>10.20.99.0/27</code></td><td>Only IT should reach the devices' admin interfaces</td></tr>
<tr><td>999</td><td>PARKING</td><td>Every unused port, shut down</td><td>none — never routed</td><td>A dead end for anything plugged in by mistake</td></tr>
</table></div>
${K.svg("0 0 720 250",
  K.box(40,20,640,70,"SW-VI-1F · Catalyst 9200 · 24 ports","",true)+
  K.band(50,58,300,24,"Gi1/0/1–16 · STAFF 10 + VOICE 20","var(--chip)")+
  K.band(356,58,92,24,"17–18 · PRN 30","var(--chip)")+
  K.band(454,58,84,24,"19 · GUEST 50","var(--chip)")+
  K.band(544,58,72,24,"20–23 · 999","var(--chip)")+
  K.band(622,58,52,24,"24","var(--chip)")+
  K.dev("phone",120,160,"phone + PC","x16 desks")+K.dev("printer",400,160,"printers","")+K.dev("pc",496,160,"lounge kiosk","")+K.dev("cloud",648,160,"uplink","trunk · lesson 2")+
  K.link(120,90,120,140)+K.link(400,90,400,144)+K.link(496,90,496,142)+K.link(648,90,648,144)+
  K.txt(580,130,"parked + shut",{c:"warn",s:10.5,mid:true}),
  "One access switch, laid out by function: desk ports carry STAFF plus VOICE, printers and the guest kiosk get their own VLANs, unused ports are parked in VLAN 999 and shut down, and the uplink is a trunk (lesson 2).")}
<h3>VLAN 1: leave it empty</h3>
<p>Every port starts in VLAN 1, it can't be deleted, and control protocols such as CDP, DTP and VTP use it too. If users also live there, any unconfigured port — a new switch, a reset port, a forgotten socket — drops whoever plugs in onto the user network. So:</p>
<ul>
<li><b>Don't put users, phones, printers or servers in VLAN 1.</b></li>
<li><b>Don't manage switches through VLAN 1.</b> Module 2 used <code>interface vlan 1</code> to teach the idea; in production management gets its own VLAN (99 here).</li>
<li><b>Park every unused port</b>: <code>switchport mode access</code>, <code>switchport access vlan 999</code>, <code>shutdown</code>. A ${K.g("parking VLAN","An unused VLAN with no subnet and no router, used for every unused port. Sometimes called a black-hole VLAN.")} has no subnet, gateway or members, so a port enabled by mistake reaches nothing.</li>
<li>Changing the trunks' native VLAN away from 1 is the other half of this practice — that's lesson 2.</li>
</ul>
${K.myth([
  ["VLANs need more switches or separate cabling.","They're configuration. One switch can hold dozens of VLANs on the same cables; that's the point."],
  ["Two PCs on the same switch can always talk to each other.","Not if they're in different VLANs. Without a router (or Layer 3 switch), no frame crosses between VLANs."],
  ["For security, delete VLAN 1.","You can't — VLAN 1 can never be deleted. You move everything <i>off</i> it and park unused ports elsewhere."],
  ["Putting servers in their own VLAN makes them secure by itself.","VLANs separate at Layer 2. Once a router connects the VLANs, everything can reach everything unless you filter it (ACLs or a firewall, later modules)."],
  ["erase startup-config wipes the VLANs.","Normal-range VLANs live in <code>vlan.dat</code> in flash and survive it. Only the port settings are erased."],
])}
${K.dodont([
  "Write the VLAN plan down — ID, name, subnet, gateway, purpose — before you configure anything.",
  "Set <code>switchport mode access</code> on every user port, not just the VLAN.",
  "Give every VLAN a meaningful name and every port a <code>description</code>.",
  "Park unused ports in a dead VLAN and shut them down.",
  "Check <code>show vlan brief</code> before you delete a VLAN, and save after every change.",
],[
  "Don't leave users or management in VLAN 1.",
  "Don't split one subnet across two VLANs, or squeeze two subnets into one VLAN.",
  "Don't make one giant VLAN for the whole building &ldquo;to keep it simple&rdquo; — keep broadcast domains to a few hundred hosts.",
  "Don't ignore <code>% Access VLAN does not exist. Creating vlan</code> — it usually means a typo.",
  "Don't delete a VLAN without moving its ports first.",
])}
${K.tip(`Keep VLAN numbering identical on every switch and site. When VLAN 20 is voice everywhere, any engineer can read any switch.`)}
${K.check({q:"Which configuration is the recommended way to handle unused switch ports?", o:["Leave them in VLAN 1 and enabled so new staff can plug in","Leave them in VLAN 1 but shut them down","Make them access ports in an unused 'parking' VLAN (not VLAN 1) and shut them down","Make them trunk ports so they can be used for anything"], a:2, why:"An unused port should be useless to whoever plugs into it: shut down, and in a VLAN with no subnet or router. VLAN 1 is where unconfigured things and control traffic live, so it's the worst place to leave a live socket."})}

${K.job("“Visitors can't print in the new lounge” — and the guest printer is in the staff VLAN",`
<p><b>The ticket.</b> &ldquo;Reception, Victoria Island office. Since the lounge was moved on Saturday, visitors on guest Wi-Fi can't print to the guest printer. Staff can print to it fine.&rdquo; Raised by the office manager, Mrs Adebayo, on Monday at 08:40.</p>
<p><b>Questions first.</b> &ldquo;Was the printer moved or replaced?&rdquo; — <i>&ldquo;Moved. Facilities plugged it into the wall in the new lounge.&rdquo;</i> &ldquo;Staff can print to it?&rdquo; — <i>&ldquo;Yes, someone printed a boarding pass from her desk.&rdquo;</i> That's the clue: staff shouldn't reach the guest printer at all. If staff can and guests can't, it's on the wrong side of the VLAN line.</p>
<p><b>Checks.</b> The printer's label gives its MAC, <code>0017.c8a2.41f0</code>. On the lounge switch:</p>
${K.out(`SW-VI-1F#show mac address-table address 0017.c8a2.41f0
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0017.c8a2.41f0    DYNAMIC     Gi1/0/14
Total Mac Addresses for this criterion: 1

SW-VI-1F#show interfaces gi1/0/14 switchport | include Mode VLAN
Access Mode VLAN: 10 (STAFF)
Trunking Native Mode VLAN: 1 (default)

SW-VI-1F#show vlan brief | include GUEST
50   GUEST                            active    Gi1/0/22`, "The printer was learned in VLAN 10 on Gi1/0/14. The only GUEST port is Gi1/0/22 — the old lounge socket.")}
<p>The printer landed on a staff socket and took a staff DHCP address (<code>10.20.10.87</code>), so guests in <code>10.20.50.0/24</code> can't reach it — and a printer visitors plug USB sticks into has sat on the staff network all weekend.</p>
<p><b>The fix.</b> Move the new socket to the guest VLAN, bounce it so the printer renews DHCP, and park the old socket:</p>
${K.out(`SW-VI-1F(config)#interface gi1/0/14
SW-VI-1F(config-if)#description LOUNGE GUEST PRINTER
SW-VI-1F(config-if)#switchport mode access
SW-VI-1F(config-if)#switchport access vlan 50
SW-VI-1F(config-if)#shutdown
SW-VI-1F(config-if)#no shutdown
SW-VI-1F(config-if)#interface gi1/0/22
SW-VI-1F(config-if)#description SPARE - parked
SW-VI-1F(config-if)#switchport access vlan 999
SW-VI-1F(config-if)#shutdown
SW-VI-1F(config-if)#end
SW-VI-1F#copy running-config startup-config`, "The shutdown / no shutdown makes the printer see its link drop, so it renews DHCP and gets a guest-subnet address.")}
<p>Verify: <code>show vlan brief | include GUEST</code> now lists Gi1/0/14. The printer's config page shows <code>10.20.50.31</code>. A phone on guest Wi-Fi prints a test page, and a ping to the printer from a staff PC now fails, as it should.</p>
<p><b>What you say.</b> &ldquo;The printer went into a staff network socket when the lounge moved, so visitors couldn't reach it. I've moved that socket to the guest network and it's working. Next time anything with a network cable moves, please raise a ticket first so we can set the socket up.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Guest printer unreachable from guest Wi-Fi after lounge move. MAC 0017.c8a2.41f0 found on SW-VI-1F Gi1/0/14 in VLAN 10 (STAFF), DHCP 10.20.10.87 — guest device on staff VLAN (security issue, flagged to IT security). Gi1/0/14: desc set, access VLAN 50 GUEST, bounced; printer now 10.20.50.31. Old lounge port Gi1/0/22 parked VLAN 999, shut. Saved. Verified test print from guest Wi-Fi; staff PC can no longer reach printer. Cabling sheet and floor plan updated. 25 min.&rdquo;</i></p>`)}

${K.case("A hospital takes its medical devices off the flat network",`
<p>A 220-bed private hospital ran its campus as one flat <code>/21</code> with nearly 1,400 devices — nurses' and admin PCs, patient monitors, infusion pumps, imaging, IP phones, CCTV, badge readers, and guest Wi-Fi bridged straight in. Two incidents forced a change. Ransomware on a billing PC scanned every address within minutes, including monitors running an unpatchable embedded OS. And a faulty CCTV recorder's nightly broadcast storm was delaying alarm messages from monitors to the nurses' central station.</p>
<p><b>The design.</b> The team grouped devices by how they must be treated, not by floor: <b>CLINICAL-DEVICES</b> (monitors and pumps — life-critical, talking only to their central station servers), <b>IMAGING</b> (huge transfers), <b>CLINICAL-STAFF</b>, <b>ADMIN</b>, <b>VOICE</b>, <b>CCTV</b>, <b>BUILDING</b>, <b>GUEST</b>, <b>MGMT</b>, and <b>PARKING</b>. Each VLAN got its own subnet sized from a real device count, all under about 250 hosts. Nurse-station ports got CLINICAL-STAFF plus the VOICE voice VLAN; bedside monitor ports were access ports in CLINICAL-DEVICES, described with the bed number; about 300 unused sockets were parked and shut.</p>
<p><b>The hard part was people.</b> Biomedical staff had been plugging monitors into any free socket. The new rule: a device moves only with a ticket naming its VLAN, and the port is configured before it arrives. Tracing MACs (Module 2) also turned up 40 devices nobody could identify.</p>
<p><b>The result.</b> Traffic between VLANs now passes a firewall (routing in lesson 3, filtering later), so monitors reach only their central stations and a compromised admin PC can't even ARP for a pump. The CCTV recorder's broadcasts now reach only cameras. The lessons: <b>group devices by risk and behaviour</b>; <b>one VLAN, one subnet, documented</b>; <b>park unused ports</b>; and <b>VLANs separate, but the rules between them protect you</b>.</p>`)}
${K.exam(`Scenario questions hide the VLAN inside a symptom: &ldquo;same switch, same subnet, can't ping&rdquo; (different VLANs); &ldquo;link up, no network after a VLAN was removed&rdquo; (inactive); &ldquo;phones get data-subnet addresses&rdquo; (no voice VLAN, or CDP/LLDP off).`)}

<h2>Interview corner</h2>
${K.hint(`Define it in one line, then give the three reasons (smaller broadcast domains, security/separation, flexibility without re-cabling), then mention that routing joins them.`)}
${K.reveal("“What is a VLAN, and why would you use one?”",`<p>"A VLAN is a separate broadcast domain created in switch configuration, so one switch can host several logical networks, each normally with one IP subnet. I use them to keep broadcast domains small, to separate groups that need different security — staff, guests, phones, servers — and to move a user between networks by reconfiguring a port instead of re-cabling. Traffic between VLANs has to be routed, by a router or Layer 3 switch, which is also where you filter it."</p>`)}
${K.hint(`One VLAN untagged versus many VLANs tagged; who plugs into each; the commands; and DTP as the reason to set the mode explicitly.`)}
${K.reveal("“What's the difference between an access port and a trunk port?”",`<p>"An access port belongs to one data VLAN and sends and receives frames untagged, so the PC or printer never needs to know VLANs exist; it can also carry a voice VLAN for a phone. A trunk carries many VLANs over one link, tagging each frame with 802.1Q so the far end knows its VLAN, except the untagged native VLAN. Trunks go between switches, to router-on-a-stick routers and often to access points. I set <code>switchport mode access</code> or <code>switchport mode trunk</code> explicitly rather than leaving ports to negotiate with DTP."</p>`)}
${K.hint(`The phone's built-in switch, untagged versus tagged, and how the phone learns the VLAN.`)}
${K.reveal("“How do an IP phone and a PC share one switch port, but end up in different VLANs?”",`<p>"The phone has a small built-in switch, so the PC plugs into the phone and both share the one cable. On the switch port I configure an access VLAN for data and a voice VLAN — <code>switchport access vlan 10</code> and <code>switchport voice vlan 20</code>. The switch tells the phone its voice VLAN using CDP for Cisco phones or LLDP-MED for other brands. The phone then tags its voice frames with VLAN 20, while the PC's frames pass through untagged and land in VLAN 10. In <code>show vlan brief</code> the port appears under both VLANs, and <code>show interfaces switchport</code> shows both."</p>`)}

${K.recap([
  "A VLAN is a broadcast domain made in configuration: frames, floods and MAC learning stay inside it, and traffic between VLANs must be routed.",
  "Normal design: one VLAN = one subnet. Splitting a subnet across VLANs makes ARP fail; two subnets in one VLAN wastes the separation.",
  "VLAN IDs: 1 is the default (can't delete or rename), 2–1001 are yours, 1002–1005 are reserved legacy VLANs (act/unsup), 1006–4094 are extended.",
  "Create with vlan N and name; assign with switchport mode access and switchport access vlan N; verify with show vlan brief and show interfaces switchport; save.",
  "show vlan brief lists access ports only: trunks are missing, ports in a deleted VLAN are missing, and voice ports appear twice.",
  "Deleting a VLAN leaves its ports pointing at it: Access Mode VLAN shows (Inactive) and the users are offline.",
  "A voice VLAN puts an IP phone (tagged) and the PC behind it (untagged) on one access port in two VLANs; the phone learns the VLAN from CDP or LLDP-MED.",
  "Keep VLAN 1 empty, manage switches in a management VLAN, and park unused ports in a dead VLAN with shutdown.",
])}
${K.next(`<b>Lesson 2 — Trunks and 802.1Q.</b> So far every VLAN lived on one switch. Next: how VLAN 10 on the 1st floor and VLAN 10 on the 2nd floor become one network across a single uplink — the 802.1Q tag, the native VLAN, allowed VLAN lists, and the DTP and VTP protocols that can help or quietly break it.`)}
`,
quiz:[
  {lvl:1, q:"Out of the box, which VLAN are the access ports of a Cisco Catalyst switch in?", o:["VLAN 0","VLAN 1","VLAN 1002","No VLAN until one is configured"], a:1, why:"Every port starts in VLAN 1, the default VLAN. It can't be deleted or renamed, which is one reason best practice is to move users off it."},
  {lvl:1, q:"Which statement best describes a VLAN?", o:["A separate collision domain on a hub","A broadcast domain created by configuration on a switch, normally mapped to one IP subnet","A secure tunnel across the internet","A group of routers sharing a routing table"], a:1, why:"A VLAN is a Layer 2 broadcast domain defined in the switch's configuration. Broadcasts, floods and MAC learning stay inside it, and in a normal design it carries exactly one subnet."},
  {lvl:2, q:"PC1 (192.168.5.10/24) is on Gi0/1 in VLAN 10. PC2 (192.168.5.20/24) is on Gi0/2 of the same switch in VLAN 20. There is no router. PC1 pings PC2. What happens?", o:["The ping succeeds because both PCs are in the same subnet","The ping succeeds because both PCs are on the same switch","PC1 sends an ARP broadcast that the switch floods only within VLAN 10, so PC2 never replies and the ping fails","The switch routes the ping between VLAN 10 and VLAN 20"], a:2, why:"PC1 believes PC2 is local, so it ARPs directly. The broadcast never leaves VLAN 10, PC2 never hears it, and the ping fails. A Layer 2 switch never forwards between VLANs, and the PCs should also be in different subnets."},
  {lvl:2, type:"multi", q:"Which two VLANs can never be deleted on a Catalyst switch? (Choose two.)", o:["VLAN 1","VLAN 99","VLAN 1002","VLAN 1006","VLAN 4094"], a:[0,2], why:"VLAN 1 (the default) and VLANs 1002–1005 (the legacy FDDI and Token Ring VLANs) are permanent. VLAN 99, 1006 and 4094 are ordinary VLANs that you create and can delete."},
  {lvl:1, type:"match", q:"Match each command with what it does.", pairs:[["vlan 30","Creates VLAN 30 (or opens it) and enters VLAN configuration mode"],["name PRINTERS","Labels the VLAN you are configuring"],["switchport mode access","Fixes the port as an access port so it can't negotiate a trunk"],["switchport access vlan 30","Puts the port's untagged data traffic in VLAN 30"],["switchport voice vlan 20","Adds a tagged VLAN for an IP phone on the same access port"]], why:"Create and name the VLAN globally; then on the interface set the mode, the access VLAN and, for desks with phones, the voice VLAN."},
  {lvl:1, type:"order", q:"Put these steps in order to make Gi1/0/7 an access port in a new VLAN 30 called PRINTERS and keep it after a reload.", items:["configure terminal","vlan 30","name PRINTERS","interface gigabitEthernet 1/0/7","switchport mode access","switchport access vlan 30","end, then copy running-config startup-config"], why:"Create and name the VLAN first, then configure the interface: mode, then VLAN. Finally leave config mode and save, because the port settings are only in the running-config until you do."},
  {lvl:1, type:"fill", q:"Which interface command stops a port negotiating a trunk and fixes it as an access port?", fields:[{label:"Command", a:["switchport mode access"], ios:true}], why:"switchport mode access sets the port's administrative mode to static access. Without it a Catalyst port is dynamic auto and could become a trunk if the neighbour asks (DTP, lesson 2)."},
  {lvl:2, type:"fill", q:"Desk ports already have switchport access vlan 10. Which interface command adds VLAN 150 for the IP phones on the same ports?", fields:[{label:"Command", a:["switchport voice vlan 150"], ios:true}], why:"switchport voice vlan 150 adds a voice VLAN. The phone learns VLAN 150 from CDP or LLDP-MED and tags its frames; the PC behind it stays untagged in VLAN 10."},
  {lvl:1, type:"fill", q:"Which privileged EXEC command lists every VLAN, its name, its status and its access ports in a compact table?", fields:[{label:"Command", a:["show vlan brief"], ios:true}], why:"show vlan brief is the quick view of VLANs and the access ports in each. Trunk ports aren't listed; use show interfaces trunk for those."},
  {lvl:2, q:"Based on the exhibit, what is configured on Gi1/0/5?", ex:"SW1#show vlan brief\n\nVLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Gi1/0/9, Gi1/0/10\n10   STAFF                            active    Gi1/0/5, Gi1/0/6, Gi1/0/7, Gi1/0/8\n20   VOICE                            active    Gi1/0/5, Gi1/0/6\n1002 fddi-default                     act/unsup\n1003 token-ring-default               act/unsup\n1004 fddinet-default                  act/unsup\n1005 trnet-default                    act/unsup", o:["Gi1/0/5 is a trunk carrying VLANs 10 and 20","Gi1/0/5 is misconfigured: a port can only appear in one VLAN","Gi1/0/5 is an access port with access VLAN 10 and voice VLAN 20, typical of a desk with an IP phone and a PC","Gi1/0/5 is in VLAN 20 only; the VLAN 10 entry is left over from before"], a:2, why:"An access port with a voice VLAN is listed under both its access (data) VLAN and its voice VLAN. A trunk wouldn't appear in show vlan brief at all."},
  {lvl:3, q:"A user on Gi1/0/9 reports no network since last night, though the link light is green. Yesterday a colleague 'tidied up unused VLANs'. You see the exhibit. What is the cause and the quickest safe fix?", ex:"SW-3F#show interfaces gi1/0/9 switchport\nName: Gi1/0/9\nSwitchport: Enabled\nAdministrative Mode: static access\nOperational Mode: static access\nNegotiation of Trunking: Off\nAccess Mode VLAN: 40 (Inactive)\nTrunking Native Mode VLAN: 1 (default)\nVoice VLAN: none", o:["The cable is faulty; replace it","VLAN 40 was deleted, so the port is inactive; recreate VLAN 40 (if it is still the right VLAN) or move the port to the correct VLAN","The port is err-disabled; shutdown and no shutdown","The port has become a trunk; set switchport mode access"], a:1, why:"Inactive means the port points at a VLAN that no longer exists, so it forwards nothing despite link up. Recreating VLAN 40 restores every port that used it in one step; otherwise move the port to the VLAN it should be in. Check the other ports that were in VLAN 40 too — they will have vanished from show vlan brief."},
  {lvl:2, q:"An engineer types switchport access vlan 100 on a user's port, meaning VLAN 10. IOS replies: % Access VLAN does not exist. Creating vlan 100. What is the result?", o:["The command is rejected and the port stays in its old VLAN","The port is placed in VLAN 10 because VLAN 100 doesn't exist","A new, empty VLAN 100 is created and the user's port is put in it, cutting them off from VLAN 10","The port becomes inactive until VLAN 100 is named"], a:2, why:"IOS creates a missing access VLAN automatically. The user is now alone in VLAN 100 with a green link light. Read that message as a warning: it almost always means a typo."},
  {lvl:2, q:"A 24-port switch has ports 1–8 in VLAN 10, ports 9–16 in VLAN 20 and ports 17–24 in VLAN 30, all with devices connected. How many broadcast domains and collision domains are there?", o:["1 broadcast domain, 24 collision domains","3 broadcast domains, 3 collision domains","3 broadcast domains, 24 collision domains","24 broadcast domains, 24 collision domains"], a:2, why:"Each VLAN is one broadcast domain, so there are three. Every switch port is its own collision domain (Module 2), so there are 24, whatever VLANs they are in."},
  {lvl:2, q:"What is the recommended configuration for the unused ports on an access switch?", o:["Leave them in VLAN 1 and enabled, ready for new staff","Configure them as trunks so they can serve any VLAN","Make them access ports in an unused parking VLAN that isn't VLAN 1, and shut them down","Delete VLAN 1 so they have no VLAN"], a:2, why:"An unused socket should give nothing to whoever plugs into it: shut down, and in a VLAN with no subnet or router. VLAN 1 can't be deleted, and leaving live ports in it puts strangers on the default network."},
  {lvl:3, type:"multi", q:"New Cisco IP phones were installed on Gi1/0/1–24. The PCs plugged into the phones work, but the phones get addresses from the staff data subnet and can't register with the call manager. Which two causes are most likely? (Choose two.)", o:["switchport voice vlan was never configured on the desk ports","CDP has been disabled on the switch or on those ports, so the phones never learn their voice VLAN","The access VLAN on the ports is wrong","The ports are administratively shut down","VLAN 1 has been deleted"], a:[0,1], why:"Phones send untagged and land in the data VLAN when either there's no voice VLAN on the port or the phone never hears it (CDP disabled; LLDP off for non-Cisco phones). The PCs working rules out a wrong access VLAN or shut ports, and VLAN 1 can't be deleted."},
  {lvl:3, q:"You're designing VLANs for a new clinic: 60 staff PCs, 60 IP phones, 4 printers, 2 local servers, guest Wi-Fi for patients, and switch management. Which plan is best?", o:["One VLAN for everything, with a /24, to keep it simple","Two VLANs: one for wired devices and one for wireless","Separate VLANs for staff, voice, printers, servers, guest and management, each with its own subnet, plus a parking VLAN for unused ports","A VLAN per floor, with all device types mixed on each floor"], a:2, why:"Group devices by how they must be treated — security, traffic type, who manages them — and give each group its own VLAN and subnet. Guests in particular must be isolated from staff and servers. A parking VLAN handles unused ports. Per-floor or all-in-one designs mix devices that need different rules."},
],
cards:[
  {f:"What is a VLAN?", b:"A broadcast domain created in switch configuration. Frames, floods and MAC learning stay inside it; traffic between VLANs must be routed. Normally one VLAN = one subnet."},
  {f:"Three reasons to use VLANs", b:"Smaller broadcast domains (less noise), separation/security between groups, and flexibility: move a user between networks by reconfiguring a port, not re-cabling."},
  {f:"VLAN ID ranges", b:"1 default (can't delete/rename); 2–1001 normal, yours to use; 1002–1005 reserved legacy FDDI/Token Ring (act/unsup); 1006–4094 extended; 0 and 4095 reserved."},
  {f:"Create and name a VLAN", b:"configure terminal → vlan 30 → name PRINTERS. Unnamed VLANs are called VLAN0030. Normal-range VLANs are saved in flash:vlan.dat as you create them."},
  {f:"Make a port an access port in VLAN 30", b:"interface g1/0/7 → switchport mode access → switchport access vlan 30 → save. Set the mode explicitly so the port can't negotiate a trunk (DTP)."},
  {f:"What show vlan brief does NOT show", b:"Trunk ports (use show interfaces trunk) and ports assigned to a VLAN that doesn't exist. Ports with a voice VLAN appear twice."},
  {f:"Deleting a VLAN that still has ports", b:"The ports keep switchport access vlan N, become inactive (Access Mode VLAN: N (Inactive)) and forward nothing. Recreate the VLAN or move the ports."},
  {f:"switchport access vlan with a VLAN that doesn't exist", b:"IOS creates it: % Access VLAN does not exist. Creating vlan N. Often a typo that strands the user in an empty VLAN."},
  {f:"Voice VLAN", b:"switchport voice vlan 20 on an access port: the IP phone tags voice frames with VLAN 20, the PC behind it sends untagged into the access VLAN. One cable, two VLANs."},
  {f:"How does an IP phone learn its voice VLAN?", b:"From the switch: CDP for Cisco phones (on by default), LLDP-MED for other brands (lldp run). Without it, the phone sends untagged and lands in the data VLAN."},
  {f:"VLAN 1 best practice", b:"Keep users, devices and switch management off VLAN 1. Put management in its own VLAN. VLAN 1 can't be deleted."},
  {f:"Parking (black-hole) VLAN", b:"An unused VLAN with no subnet or router. Unused ports: switchport mode access, switchport access vlan 999, shutdown."},
  {f:"One subnet across two VLANs — what breaks?", b:"Hosts think the other side is local and ARP directly; the ARP broadcast stays in its own VLAN, so nobody answers: Destination host unreachable."},
],
});
// ---------- Module 4 · Lesson 2 ----------
L.push({
id:"vlan-trunks", mins:75, level:"Intermediate · builds on Module 4 lesson 1",
t:"Trunks and 802.1Q: tagging, the native VLAN, allowed lists, DTP and VTP",
html:`
${K.goals([
  "Explain why a switch-to-switch link must carry many VLANs, and draw the 4-byte 802.1Q tag field by field.",
  "Configure a trunk safely: <code>switchport mode trunk</code>, a matching unused native VLAN, an allowed list edited with <code>add</code>/<code>remove</code>, and <code>switchport nonegotiate</code>.",
  "Predict from any pair of DTP modes whether a link trunks, and explain why two default Catalysts don't.",
  "Read <code>show interfaces trunk</code> and <code>show interfaces … switchport</code>, and diagnose a native VLAN mismatch and an overwritten allowed list.",
  "Explain the VTP modes and how one switch with a higher revision can delete every VLAN in an office.",
])}
${K.pre(["Module 4 lesson 1 (VLANs, access ports, <code>show vlan brief</code>, the voice VLAN).", "Module 1 (the Ethernet frame and FCS) and Module 2 (MAC learning, CDP/LLDP)."])}

<h2>Why this matters at work</h2>
<p>A logistics firm in Ikeja adds a second-floor switch for its new finance team. The installer runs a cable from the first-floor switch, the link lights go green, and he goes home. On Monday nobody upstairs can reach anything. The cable is perfect. The problem is that the link between the switches is an <b>access port</b>, so it carries exactly one VLAN — VLAN 1, which nobody uses.</p>
<p>In lesson 1 you split one switch into VLANs. The moment a VLAN has users on <i>two</i> switches, the link between them must carry many VLANs at once and keep them apart. That link is a <b>trunk</b>, and many Layer 2 outages — "the link is up but VLAN 20 is dead", "the new switch wiped our VLANs", "CDP keeps complaining about the native VLAN" — come from how trunks are tagged, negotiated and filtered. In this lesson you'll build one, break one and fix one from the logs.</p>

<h2>One link, many VLANs: trunks and the 802.1Q tag</h2>
<p>Picture two switches, each with Staff PCs in VLAN 10 and Finance PCs in VLAN 20. Staff must reach Staff on the other switch, Finance must reach Finance, and the two must never mix. You could run one access cable per VLAN — but that burns two ports per VLAN, and 30 VLANs would need 30 cables between every pair of switches.</p>
<p>The real answer is a ${K.g("trunk","A link carrying frames from many VLANs, each marked with a tag naming its VLAN.")}: one link that carries every VLAN, where each frame wears a small label naming its VLAN. The sending switch adds the label; the receiving switch reads it, puts the frame in the right VLAN, and removes the label before the frame reaches a PC.</p>
${K.svg("0 0 720 300",
  K.txt(175,20,"Option 1 · one access cable per VLAN",{c:"fg",s:12,mid:true,b:true,f:"display"})+
  K.dev("switch",80,80,"SW1","")+K.dev("switch",270,80,"SW2","")+
  K.link(106,74,244,74,"VLAN 10 cable")+K.link(106,92,244,92,"VLAN 20 cable")+
  K.dev("pc",45,200,"PC","VLAN 10")+K.dev("pc",115,200,"PC","VLAN 20")+K.dev("pc",235,200,"PC","VLAN 10")+K.dev("pc",305,200,"PC","VLAN 20")+
  K.link(70,92,48,180)+K.link(88,92,112,180)+K.link(262,92,238,180)+K.link(280,92,302,180)+
  K.txt(175,280,"2 VLANs = 2 cables · 30 VLANs = 30 cables",{c:"bad",s:11,mid:true})+
  K.link(360,10,360,290,"",true)+
  K.txt(545,20,"Option 2 · one 802.1Q trunk",{c:"fg",s:12,mid:true,b:true,f:"display"})+
  K.dev("switch",450,80,"SW1","")+K.dev("switch",640,80,"SW2","")+
  K.link(476,80,614,80,"trunk")+
  K.band(490,92,52,18,"tag 10","var(--chip)")+K.band(552,92,52,18,"tag 20","var(--chip)")+
  K.dev("pc",415,200,"PC","VLAN 10")+K.dev("pc",485,200,"PC","VLAN 20")+K.dev("pc",605,200,"PC","VLAN 20")+K.dev("pc",675,200,"PC","VLAN 10")+
  K.link(440,92,418,180)+K.link(458,92,482,180)+K.link(632,92,608,180)+K.link(650,92,672,180)+
  K.txt(545,280,"Every VLAN shares one link; each frame carries a tag",{c:"ok",s:11,mid:true}),
  "Separate access links work but don't scale. A trunk carries every VLAN on one link and keeps them apart with a tag. PCs never see the tag: the switch adds it on the trunk and removes it on the access port.")}
<h3>The 802.1Q tag, field by field</h3>
<p>The standard tag is IEEE ${K.g("802.1Q","The IEEE standard for VLAN tagging on Ethernet; engineers say 'dot1q'.")} ("dot1q"). Take the Ethernet frame from Module 1 — destination MAC, source MAC, Type, data, FCS — and insert <b>4 bytes straight after the source MAC</b>:</p>
${K.svg("0 0 740 270",
  K.txt(10,58,"Untagged frame",{c:"fg",s:11.5,f:"display",b:true})+
  K.box(150,36,90,36,"Dest MAC","6 bytes")+K.box(240,36,90,36,"Source MAC","6 bytes")+K.box(330,36,60,36,"Type","2")+K.box(390,36,220,36,"Data (packet)","46–1500 bytes")+K.box(610,36,70,36,"FCS","4")+
  K.txt(10,128,"802.1Q-tagged frame",{c:"fg",s:11.5,f:"display",b:true})+
  K.box(150,106,80,36,"Dest MAC","6")+K.box(230,106,80,36,"Source MAC","6")+K.box(310,106,80,36,"802.1Q tag","4 bytes",true)+K.box(390,106,60,36,"Type","2")+K.box(450,106,180,36,"Data (packet)","unchanged")+K.box(630,106,70,36,"FCS","recalculated",true)+
  K.link(310,142,180,196,"",true)+K.link(390,142,660,196,"",true)+
  K.box(180,196,170,40,"TPID = 0x8100","16 bits: 'a tag follows'",true)+K.box(350,196,90,40,"PCP","3 bits: CoS 0–7")+K.box(440,196,70,40,"DEI","1 bit")+K.box(510,196,150,40,"VLAN ID (VID)","12 bits: 1–4094",true)+
  K.txt(420,258,"16 + 3 + 1 + 12 bits = 32 bits = 4 bytes",{c:"muted",s:10.5,mid:true}),
  "Where the tag goes and what is inside it. The data is untouched, but the frame grew, so the FCS must be recalculated.")}
<ul>
<li>${K.g("TPID","Tag Protocol Identifier, 0x8100: tells the receiver an 802.1Q tag follows.")} — always <code>0x8100</code>, sitting where the Type field used to be, so the receiver knows a tag follows.</li>
<li>${K.g("PCP","Priority Code Point: 3 bits of Class of Service (CoS) 0–7. Voice is usually CoS 5.")} — 3 bits of priority (CoS 0–7). IP phones mark voice CoS 5; ${K.g("QoS","Quality of Service: features that give some traffic, such as voice, priority when links are busy.")} (a later module) uses this.</li>
<li>${K.g("DEI","Drop Eligible Indicator: 1 bit, 'drop me first when congested'. Formerly CFI.")} — 1 bit, "drop me first if congested" (older books: ${K.g("CFI","Canonical Format Indicator: the bit's original name, from the days of Token Ring. It was always 0 on Ethernet, so the IEEE reused it as DEI.")}).</li>
<li>${K.g("VID","VLAN Identifier: 12 bits; 1–4094 usable, 0 and 4095 reserved.")} — 12 bits = 4096 values; 0 and 4095 are reserved, so <b>VLANs 1–4094</b>.</li>
</ul>
<p>Because 4 bytes were inserted, the ${K.g("FCS","Frame Check Sequence: the 4-byte error check over the whole frame (Module 1).")} no longer matches the frame, so the switch <b>recalculates the FCS</b> when it adds the tag, and again when it removes it. The tag lives only on the trunk: PC network cards expect untagged frames, so the switch strips it on access ports.</p>
${K.dyk(`The 4-byte tag pushed the largest normal Ethernet frame from 1518 to <b>1522 bytes</b>. The IEEE updated Ethernet (${K.g("802.3ac","The 1998 amendment to the Ethernet standard (802.3) that raised the maximum frame size by 4 bytes to make room for the VLAN tag.")}) so tagged frames weren't counted as oversized errors; old tools still call them &ldquo;baby giants&rdquo;.`)}
<h3>Worked example: decode a tag from a capture</h3>
<p>A capture on a trunk shows <code>81 00 A0 14</code> right after the source MAC. What VLAN and priority?</p>
${K.steps([
  ["Split off the TPID", `<p><code>81 00</code> = TPID 0x8100: an 802.1Q tag. <code>A0 14</code> holds PCP, DEI and VID.</p>`],
  ["Write A014 in binary", `<p>A = <code>1010</code>, 0 = <code>0000</code>, 1 = <code>0001</code>, 4 = <code>0100</code> → <code>1010 0000 0001 0100</code>.</p>`],
  ["Cut it 3 · 1 · 12", `<p>PCP = <code>101</code> = <b>5</b>. DEI = <code>0</code>. VID = <code>0000 0001 0100</code> = 16 + 4 = <b>20</b>.</p>`],
  ["Say what it means", `<p><b>VLAN 20</b>, priority <b>CoS 5</b> — almost certainly IP phone voice traffic crossing the trunk.</p>`],
])}
${K.q({type:"fill", q:"A capture shows the tag bytes 81 00 60 1E after the source MAC. Decode the PCP (priority) and the VLAN ID.", fields:[{label:"PCP (0–7)", a:["3"]},{label:"VLAN ID", a:["30"]}], why:"0x601E = 0110 0000 0001 1110. The first 3 bits, 011, give PCP 3; the next bit is DEI 0; the last 12 bits, 0000 0001 1110 = 30, are the VLAN."})}
<h3>ISL: the tag you'll only read about</h3>
<p>Cisco's older ${K.g("ISL","Inter-Switch Link: Cisco's obsolete trunking that wrapped the whole frame in a 26-byte header and 4-byte trailer.")} (Inter-Switch Link) wrapped the <i>entire</i> frame in a 26-byte header and 4-byte trailer and worked only between Cisco devices. It is history: Catalyst 2960 and 9000 switches support only 802.1Q. On older 3560/3750 switches you'll still meet <code>switchport trunk encapsulation dot1q</code>, which must be set before the port accepts <code>switchport mode trunk</code>.</p>
${K.exam(`Know it cold: <b>4 bytes</b>, inserted <b>after the source MAC</b>, TPID <b>0x8100</b>, PCP 3 bits, DEI 1 bit, VID <b>12 bits</b> (1–4094), <b>FCS recalculated</b>. ISL encapsulates the whole frame and is Cisco-only. Wrong options say the tag goes &ldquo;before the destination MAC&rdquo; or &ldquo;after the FCS&rdquo;.`)}
${K.check({q:"Why must a switch recalculate the FCS when it adds an 802.1Q tag?", o:["The tag changes the destination MAC","The FCS covers the whole frame, and 4 bytes were inserted","The receiver uses the FCS to find the VLAN","It doesn't: the FCS is copied unchanged"], a:1, why:"The FCS is a check over every byte. Inserting the tag changes the frame, so a new FCS is computed when tagging and again when the tag is removed."})}

<h2>The native VLAN: the one VLAN a trunk doesn't tag</h2>
<p>On every 802.1Q trunk, one VLAN's frames are <b>not tagged</b>: the ${K.g("native VLAN","The VLAN sent untagged on an 802.1Q trunk; untagged frames received go into it. Default VLAN 1; must match on both ends.")}, VLAN 1 by default. The rule works both ways:</p>
<ul>
<li><b>Sending:</b> native-VLAN frames leave the trunk with <b>no tag</b>; every other VLAN is tagged.</li>
<li><b>Receiving:</b> any <b>untagged</b> frame arriving on the trunk goes into the receiver's <b>own</b> native VLAN.</li>
</ul>
<p>It exists because 802.1Q had to coexist with devices that didn't understand tags: untagged frames on a trunk had to land somewhere.</p>
<h3>Why both ends must match</h3>
<p>Nothing on the wire says which VLAN an untagged frame came from. If the two ends disagree, untagged traffic silently changes VLAN as it crosses.</p>
${K.svg("0 0 720 270",
  K.dev("switch",110,60,"SW1","native VLAN 99")+K.dev("switch",610,60,"SW2","native VLAN 1")+
  K.link(136,60,584,60,"trunk Gi0/8 ↔ Gi0/8")+
  K.arrow(200,80,520,80,"VLAN 99 frame — sent with NO tag",true)+
  K.box(20,140,200,52,"SW1: VLAN 99 is my native","so I send it untagged")+
  K.box(260,140,200,52,"On the wire: no tag","nothing says 'VLAN 99'")+
  K.box(500,140,200,52,"SW2: untagged = my native","so it goes into VLAN 1",true)+
  K.arrow(220,166,258,166)+K.arrow(460,166,498,166)+
  K.txt(360,222,"VLAN 10, 20, 30 are tagged on both sides — they cross normally.",{c:"ok",s:11,mid:true})+
  K.txt(360,242,"Untagged traffic leaks VLAN 99 → VLAN 1 (and VLAN 1 → VLAN 99 the other way).",{c:"bad",s:11,mid:true})+
  K.txt(360,262,"CDP notices and logs %CDP-4-NATIVE_VLAN_MISMATCH on both switches.",{c:"muted",s:10.5,mid:true}),
  "A native VLAN mismatch. The trunk stays up and tagged VLANs work, which is why it is easy to miss — but untagged frames cross into the wrong VLAN.")}
<ol>
<li><b>The trunk stays up and tagged VLANs keep working</b> — which is why mismatches survive for months.</li>
<li><b>Untagged traffic leaks between two VLANs</b>, joining networks that should be separate: broken services and a security hole.</li>
<li><b>The switches complain.</b> ${K.g("CDP","Cisco Discovery Protocol (Module 2); it advertises each trunk's native VLAN.")} advertises each port's native VLAN, so both switches log the disagreement — you read the log with <code>show logging</code>, which lists the switch's recent system messages. Real Catalysts running Cisco's per-VLAN Spanning Tree also block both mismatched VLANs on that port (shown as <i>${K.g("PVID","Port VLAN ID: the VLAN a port gives to untagged frames, which on a trunk is its native VLAN.")} inconsistent</i>), so traffic in those two VLANs may vanish rather than leak. Spanning Tree is lesson 4; lesson 7 shows how to spot this. The lab does this too: <code>show logging</code> adds <code>%SPANTREE-2-BLOCK_PVID_LOCAL</code> / <code>BLOCK_PVID_PEER</code> lines, and <code>show spanning-tree</code> marks the port <code>BKN*</code> … <code>*PVID_Inc</code>.</li>
</ol>
${K.out(`SW-2F#show logging | include NATIVE
*Oct 11 10:14:14.274: %CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/8 (1), with SW-CORE GigabitEthernet0/8 (99).`, "First number: THIS switch's native VLAN on its port (1). Second: the neighbour SW-CORE's (99). It repeats until fixed, on both switches.")}
<h3>Best practice: an unused native VLAN</h3>
<p>Real networks pick a dedicated VLAN that <b>no device is ever put into</b> — 99 or 999 are common — create it on every switch and set it as native on <b>both ends of every trunk</b>:</p>
${K.out(`SW-CORE(config)#vlan 99
SW-CORE(config-vlan)#name NATIVE-UNUSED
SW-CORE(config-vlan)#interface g0/8
SW-CORE(config-if)#switchport trunk native vlan 99`, "Do it on both ends; the CDP messages stop once they match.")}
<p>Why unused? Because of ${K.g("VLAN hopping","Attacks that get frames into a VLAN the attacker shouldn't reach: switch spoofing or double tagging.")} attacks, previewed here and covered in the security module:</p>
<ul>
<li>${K.g("Switch spoofing","An attacker's device uses DTP to turn its port into a trunk and reach every VLAN.")} — a laptop pretends to be a switch and negotiates a trunk on a port left in a dynamic DTP mode (next section), then receives every VLAN.</li>
<li>${K.g("Double tagging","An attacker in the native VLAN sends a frame with two tags; the first switch strips the outer one and the next delivers it into the inner tag's VLAN. One-way.")} — an attacker <i>in the trunk's native VLAN</i> sends a frame with two tags. The first switch strips the outer (native) tag and forwards it; the next switch reads the inner tag and delivers it into the victim VLAN. If nobody is ever in the native VLAN, the attack has nowhere to start.</li>
</ul>
${K.tip(`Some Catalysts can tag the native VLAN too, with the global command <code>vlan dot1q tag native</code>. The unused native VLAN is the CCNA-level habit.`)}
${K.mistake(`Changing the native VLAN on one end and walking away. Change <b>both</b> ends in the same window, then check that the <b>Native vlan</b> column of <code>show interfaces trunk</code> matches on each switch.`)}
${K.check({q:"SW1's trunk uses native VLAN 99 and SW2's end uses native VLAN 1. What do users in VLAN 10 notice?", o:["Nothing — VLAN 10 is tagged on both ends","The trunk goes down","Their traffic moves into VLAN 99","Their frames are sent untagged"], a:0, why:"A mismatch affects only untagged traffic (VLANs 99 and 1 leak into each other). Tagged VLANs carry their number in the tag and cross normally."})}

<h2>Controlling what crosses: the allowed VLAN list</h2>
<p>By default a trunk carries <b>every VLAN, 1–4094</b>: broadcasts for VLANs with nobody on the far side still cross, and anyone who gets onto a trunk sees everything. So engineers restrict each trunk with the ${K.g("allowed VLAN list","The VLANs a trunk carries (switchport trunk allowed vlan). Others are dropped. Default: all.")}:</p>
<div class="tablewrap"><table>
<tr><th>Interface command</th><th>Effect on the list</th></tr>
<tr><td><code>switchport trunk allowed vlan 10,20,99</code></td><td><b>Replaces</b> it with exactly 10, 20, 99</td></tr>
<tr><td><code>switchport trunk allowed vlan add 30</code></td><td>Adds 30 to what's there</td></tr>
<tr><td><code>switchport trunk allowed vlan remove 20</code></td><td>Takes 20 out</td></tr>
<tr><td><code>switchport trunk allowed vlan except 1-9</code></td><td>Everything except 1–9 (replaces)</td></tr>
<tr><td><code>switchport trunk allowed vlan all</code> / <code>none</code></td><td>All VLANs / none</td></tr>
</table></div>
<p>Frames in a VLAN not on the list are <b>dropped</b> at the trunk, both directions.</p>
<h3>The classic mistake: forgetting <code>add</code></h3>
<p>A trunk carries 10, 20 and 99. The change says "add VLAN 30 for the cameras". The engineer types <code>switchport trunk allowed vlan 30</code>. IOS accepts it without a word — and the trunk now carries VLAN 30 <i>only</i>. The floor goes dark. Safe habits: use <code>add</code>/<code>remove</code>, look at the list before and after, and never paste a list from another switch's template — a template from a floor without VLAN 20 is exactly how you lose VLAN 20.</p>
${K.mistake(`<code>switchport trunk allowed vlan 30</code> <b>replaces</b> the list. To add, type <code>switchport trunk allowed vlan add 30</code>. On a core trunk, the missing word can disconnect a building.`)}
<h3>Reading <code>show interfaces trunk</code>, section by section</h3>
<p>It lists only ports <b>actually trunking now</b> (empty output = no trunks), in four sections:</p>
${K.out(`SW-CORE#show interfaces trunk

Port        Mode             Encapsulation  Status        Native vlan
Gi1/0/47    on               802.1q         trunking      99
Gi1/0/48    auto             802.1q         trunking      1

Port        Vlans allowed on trunk
Gi1/0/47    10,20,30,99
Gi1/0/48    1-4094

Port        Vlans allowed and active in management domain
Gi1/0/47    10,20,99
Gi1/0/48    1,10,20,99

Port        Vlans in spanning tree forwarding state and not pruned
Gi1/0/47    10,20,99
Gi1/0/48    1,10,99`, "Gi1/0/47 was configured properly; Gi1/0/48 became a trunk by DTP with every default left in place.")}
<ul>
<li><b>1 — is it a trunk?</b> <code>Mode on</code> = <code>switchport mode trunk</code>; <code>auto</code>/<code>desirable</code> = negotiated by DTP. <code>Status trunking</code> = working. <code>Native vlan</code> must match the far end.</li>
<li><b>2 — allowed:</b> the list as configured; <code>1-4094</code> = unrestricted.</li>
<li><b>3 — allowed and existing here.</b> ${K.g("management domain","Here: the VLANs that exist on this switch.")} means "VLANs this switch has". VLAN 30 is allowed on Gi1/0/47 but missing here: <b>it was never created on SW-CORE</b>, so it can't cross.</li>
<li><b>4 — actually forwarding:</b> not blocked by Spanning Tree (and not ${K.g("pruned","VTP pruning: an optional VTP feature that stops a trunk carrying VLANs the far switch has no ports in. Off by default.")}). VLAN 20 is missing on Gi1/0/48 because this redundant link blocks it to prevent a loop — normal (lesson 4).</li>
</ul>
${K.remember(`Read it as a funnel: <b>trunking → allowed → exists → forwarding</b>. Where a VLAN drops out tells you why it can't cross: not a trunk, not in the list, not created here, or blocked by Spanning Tree.`)}
${K.exam(`&ldquo;VLAN 30 is allowed but can't cross&rdquo; → look for it missing from <i>allowed and active</i>: the VLAN doesn't exist on that switch. And trunk ports <b>don't</b> appear in <code>show vlan brief</code> — normal.`)}
<p>For one port, <code>show interfaces g0/8 switchport</code> compares configuration with reality:</p>
${K.out(`SW-2F#show interfaces g0/8 switchport
Name: Gi0/8
Switchport: Enabled
Administrative Mode: trunk
Operational Mode: trunk
Administrative Trunking Encapsulation: dot1q
Operational Trunking Encapsulation: dot1q
Negotiation of Trunking: Off
Access Mode VLAN: 1 (default)
Trunking Native Mode VLAN: 99 (NATIVE-UNUSED)
Voice VLAN: none
Trunking VLANs Enabled: 10,20,30,99`, "Trimmed. Administrative = what you configured; Operational = what it's doing now. Negotiation Off = no DTP sent.")}
<h3>Practise: build a trunk on SW-DIST1</h3>
<p>VLANs 10 (STAFF), 20 (FINANCE) and 30 (CCTV) exist; Gi0/1 goes to the second-floor switch. Build the trunk, make the classic mistake on purpose, repair it, then lock down a desk port and VTP.</p>
${K.hint(`<code>switchport nonegotiate</code> is refused while a port is dynamic: set <code>switchport mode trunk</code> first. Use <code>do</code> for show commands in config mode. Abbreviations work: <code>sw tr al vl add 30</code>.`)}
${K.term({env:"ios2", title:"build and repair a trunk on SW-DIST1", opts:{kind:"switch", host:"SW-DIST1", model:"C9300-24T", motd:"SW-DIST1 — console session. Gi0/1 is the uplink to SW-2F. Gi0/5 is a desk socket."},
  setup:env=>{ ["en","conf t","vlan 10","name STAFF","vlan 20","name FINANCE","vlan 30","name CCTV","end","disable"].forEach(c=>env.exec(c)); env.history.length = 0; },
  intro:"A lab Catalyst with no cables, so every port counts as connected. Start with <code>enable</code> and <code>configure terminal</code>.",
  tasks:[
    {text:"Create VLAN 99 named <code>NATIVE-UNUSED</code>", done:e=>e.vlans[99]==="NATIVE-UNUSED"},
    {text:"On <code>interface g0/1</code>: <code>switchport mode trunk</code>", done:e=>e.intfs["GigabitEthernet0/1"].mode==="trunk"},
    {text:"Set the native VLAN: <code>switchport trunk native vlan 99</code>", done:e=>e.intfs["GigabitEthernet0/1"].native===99},
    {text:"Restrict the trunk: <code>switchport trunk allowed vlan 10,20,99</code>", done:e=>e.history.some(h=>/^\s*sw\S*\s+tr\S*\s+al\S*\s+v\S*\s+10,20,99\s*$/i.test(h))},
    {text:"Make the classic mistake on purpose: <code>switchport trunk allowed vlan 30</code>, then <code>do show interfaces trunk</code> — what's left?", done:e=>e.history.some(h=>/^\s*sw\S*\s+tr\S*\s+al\S*\s+v\S*\s+30\s*$/i.test(h))},
    {text:"Repair it with <code>add</code> (not by retyping): the final list must be exactly 10,20,30,99", done:e=>JSON.stringify(e.intfs["GigabitEthernet0/1"].allowed)==="[10,20,30,99]" && e.history.some(h=>/\sadd\s/i.test(h))},
    {text:"Silence DTP on the trunk: <code>switchport nonegotiate</code>", done:e=>e.intfs["GigabitEthernet0/1"].nonegotiate===true},
    {text:"Make desk port <code>g0/5</code> a hard-coded access port in VLAN 10", done:e=>e.intfs["GigabitEthernet0/5"].mode==="access" && e.intfs["GigabitEthernet0/5"].vlan===10},
    {text:"Try to create extended VLAN 2001 with <code>vlan 2001</code> — VTP server mode refuses it. Read the message", done:e=>e.history.some(h=>/^\s*vl\S*\s+2001\s*$/i.test(h))},
    {text:"Take the switch out of VTP's reach: <code>vtp mode transparent</code> (VTP, covered later in this lesson, can copy VLAN lists between switches — and wipe them; transparent mode stops this switch taking part), then <code>do show vtp status</code>", done:e=>e.vtpMode==="transparent" && e.history.some(h=>/sh\S*\s+vtp/i.test(h))},
    {text:"Now <code>vlan 2001</code> works: name it <code>LAB-EXT</code>", done:e=>e.vlans[2001]==="LAB-EXT"},
    {text:"In privileged EXEC, <code>show interfaces g0/1 switchport</code> — find <i>Negotiation of Trunking: Off</i>", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+g\S*0\/1\s+sw/i.test(h))},
    {text:"Save: <code>copy running-config startup-config</code>", done:e=>e.savedOnce},
  ],
  win:"You built a trunk with an unused native VLAN, watched a missing <code>add</code> wipe the allowed list, repaired it, silenced DTP, hard-coded a desk port and took the switch out of VTP's reach.",
  solve:["enable","configure terminal","vlan 99","name NATIVE-UNUSED","interface g0/1","description Trunk to SW-2F Gi0/1","switchport mode trunk","switchport trunk native vlan 99","switchport trunk allowed vlan 10,20,99","switchport trunk allowed vlan 30","do show interfaces trunk","switchport trunk allowed vlan add 10,20,99","switchport nonegotiate","interface g0/5","switchport mode access","switchport access vlan 10","exit","vlan 2001","vtp mode transparent","do show vtp status","vlan 2001","name LAB-EXT","end","show interfaces g0/1 switchport","copy running-config startup-config",""]})}
<p>After the mistake, every section showed <b>30</b> alone — on a live network VLANs 10, 20 and 99 would have stopped that instant. <code>add 10,20,99</code> merged them back without touching 30.</p>
${K.check({q:"A trunk allows VLANs 10, 20 and 99. You must also carry VLAN 40 without interrupting anything. Which command?", o:["switchport trunk allowed vlan 40","switchport trunk allowed vlan add 40","switchport trunk allowed vlan except 40","switchport trunk native vlan 40"], a:1, why:"add gives 10,20,40,99. Without add, the list becomes 40 alone. except 40 allows everything but 40."})}

<h2>DTP: how switches negotiate a trunk</h2>
<p>Cisco switches can also <i>negotiate</i> trunks with ${K.g("DTP","Dynamic Trunking Protocol: Cisco-proprietary; two switch ports agree whether the link becomes a trunk.")}, the Cisco-proprietary Dynamic Trunking Protocol. A port can be configured five ways:</p>
<div class="tablewrap"><table>
<tr><th>Configuration</th><th>Behaviour</th><th>Sends DTP?</th></tr>
<tr><td><code>switchport mode access</code></td><td>Always access</td><td>No</td></tr>
<tr><td><code>switchport mode trunk</code></td><td>Always trunk; tells the far end &ldquo;let's trunk&rdquo;</td><td>Yes</td></tr>
<tr><td><code>dynamic desirable</code></td><td><b>Asks</b> to trunk</td><td>Yes</td></tr>
<tr><td><code>dynamic auto</code></td><td><b>Waits</b> to be asked — <b>the modern Catalyst default</b></td><td>Yes (says it's willing, never asks)</td></tr>
<tr><td><code>trunk</code> + <code>switchport nonegotiate</code></td><td>Always trunk, but silent</td><td>No</td></tr>
</table></div>
<h3>The full combination table</h3>
<p>One idea explains it: <b>a trunk forms only if someone asks</b> (trunk or desirable) <b>and nobody refuses</b> (access). This table came from the lab simulator and matches real Catalysts:</p>
<div class="tablewrap"><table>
<tr><th>Side A ↓ · Side B →</th><th>access</th><th>auto</th><th>desirable</th><th>trunk</th><th>trunk + nonegotiate</th></tr>
<tr><td><b>access</b></td><td>access</td><td>access</td><td>access</td><td>⚠ mismatch</td><td>⚠ mismatch</td></tr>
<tr><td><b>auto</b></td><td>access</td><td><b>access</b></td><td>trunk</td><td>trunk</td><td>⚠ mismatch</td></tr>
<tr><td><b>desirable</b></td><td>access</td><td>trunk</td><td>trunk</td><td>trunk</td><td>⚠ mismatch</td></tr>
<tr><td><b>trunk</b></td><td>⚠ mismatch</td><td>trunk</td><td>trunk</td><td>trunk</td><td>trunk</td></tr>
<tr><td><b>trunk + nonegotiate</b></td><td>⚠ mismatch</td><td>⚠ mismatch</td><td>⚠ mismatch</td><td>trunk</td><td>trunk</td></tr>
</table></div>
<p><b>Mismatch</b> = one end trunks, the other is access. The link is up, but the access side drops the tagged frames; only untagged (native) traffic gets through. It looks working and behaves broken.</p>
<p>Note <b>auto + auto = access</b>: both wait, nobody asks. Two new Catalyst 2960 or 9000 switches cabled with defaults form an <b>access link in VLAN 1</b> — the Ikeja outage. (Some older Catalysts defaulted to desirable, hence old notes saying switches "trunk automatically".)</p>
${K.remember(`<b>&ldquo;Auto waits, desirable asks, trunk insists, access refuses.&rdquo;</b> Two waiters never talk. Nonegotiate = &ldquo;I insist, silently&rdquo;, so the far end must be hard-coded too.`)}
${K.q({type:"match", q:"Match each pair of port configurations with the result on the link.", pairs:[["dynamic auto + dynamic auto","Access link (nobody asks)"],["dynamic auto + dynamic desirable","Trunk (desirable asks, auto agrees)"],["trunk + dynamic auto","Trunk (trunk tells auto to trunk)"],["trunk with nonegotiate + dynamic auto","Mismatch: trunk on one side, access on the other"],["access + dynamic desirable","Access link (access refuses)"]], why:"A trunk forms only if someone asks and nobody refuses. nonegotiate stops DTP, so an auto neighbour never hears the request and stays access while the other end trunks."})}
<h3>Routers don't speak DTP</h3>
<p>Routers, servers and firewalls never send DTP, so a <code>dynamic auto</code> port facing them stays access. A switch port to a ${K.g("router-on-a-stick","One router connected to a switch by a single trunk, routing between the VLANs on it (lesson 3).")}, a ${K.g("hypervisor","Software on a server that runs many virtual machines; its uplink often carries several VLANs.")} or a wireless controller <b>must</b> be <code>switchport mode trunk</code>.</p>
<h3>Security: hard-code everything</h3>
<p>A desk port left dynamic can be talked into trunking by an attacker's laptop (switch spoofing), or by any switch someone plugs in under a desk. The professional rule: <b>trunks</b> = <code>switchport mode trunk</code> + <code>switchport nonegotiate</code> on both ends; <b>user ports</b> = <code>switchport mode access</code>, never dynamic; <b>unused ports</b> = access, an unused VLAN, <code>shutdown</code>.</p>
${K.when([
  ["<code>trunk</code> + <code>nonegotiate</code>","Every production switch-to-switch trunk, both ends","Predictable; sends no DTP","The far end is still dynamic — it stays access"],
  ["<code>switchport mode trunk</code>","Links to routers, hypervisors, wireless controllers","Always trunks","—"],
  ["<code>switchport mode access</code>","Every desk, printer, camera and phone port","Can never become a trunk","The device needs several VLANs (a phone + PC uses the voice VLAN)"],
  ["<code>dynamic auto</code> / <code>desirable</code>","Labs only","Saves typing","Production: anyone can negotiate a trunk"],
], "Which port mode, and when")}
${K.check({q:"Two new Catalyst 9200s are cabled together with default port settings. PCs in VLAN 20 exist on both. What happens?", o:["DTP forms a trunk","The link is an access link in VLAN 1, so VLAN 20 can't cross","The link stays down","It trunks carrying only the native VLAN"], a:1, why:"Both ports default to dynamic auto: both wait, nobody asks, so the link is access in VLAN 1. Hard-code it as a trunk."})}

<h2>Hands-on: watch DTP build a trunk and tags appear</h2>
<p>Two switches, each with a Staff PC (VLAN 10) and a Finance PC (VLAN 20), joined on port 8 by a link <b>never configured</b>: both ends <code>dynamic auto</code>. Each laptop is consoled to one switch. With the frame log open, dots crossing a trunk carry their tag's VLAN number.</p>
${K.bench({id:"m4-trunk-dtp", points:80, from:"CCNA · Module 4 · lesson 2", title:"auto + auto, then a trunk: watch DTP and 802.1Q tags", viewBox:"0 0 760 390", openLog:true,
  intro:"LAPTOP-A is consoled to SW1, LAPTOP-B to SW2 (Terminal app at 9600 8N1, no flow control; after switching laptops, type <code>enable</code> again). PCs need no gateway: you test within each VLAN, across the two switches.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · floor 1", x:10, y:20,
      config:e=>{ ["en","conf t","hostname SW1","vlan 10","name STAFF","vlan 20","name FINANCE","exit","interface g0/1","switchport mode access","switchport access vlan 10","interface g0/2","switchport mode access","switchport access vlan 20","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.saw = re => e.seen.some(s=>re.test(s.out));
        e.exec = line => { const o = run(line); e.seen.push({line:String(line), out: typeof o==="string" ? o : (o && o.text) || ""}); return o; }; }},
    {id:"lapa", kind:"laptop", label:"LAPTOP-A", x:450, y:20},
    {id:"sw2", kind:"switch", label:"SW2", model:"Catalyst 9200 · floor 2", x:330, y:150,
      config:e=>{ ["en","conf t","hostname SW2","vlan 10","name STAFF","vlan 20","name FINANCE","exit","interface g0/1","switchport mode access","switchport access vlan 10","interface g0/2","switchport mode access","switchport access vlan 20","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.saw = re => e.seen.some(s=>re.test(s.out));
        e.exec = line => { const o = run(line); e.seen.push({line:String(line), out: typeof o==="string" ? o : (o && o.text) || ""}); return o; }; }},
    {id:"lapb", kind:"laptop", label:"LAPTOP-B", x:190, y:140},
    {id:"pc1", kind:"pc", label:"PC1", x:10, y:280, ip:"10.10.10.11", mask:"255.255.255.0", mac:"a4bb.6d10.0011"},
    {id:"pc2", kind:"pc", label:"PC2", x:140, y:280, ip:"10.10.20.12", mask:"255.255.255.0", mac:"a4bb.6d20.0012"},
    {id:"pc3", kind:"pc", label:"PC3", x:470, y:280, ip:"10.10.10.13", mask:"255.255.255.0", mac:"a4bb.6d10.0013"},
    {id:"pc4", kind:"pc", label:"PC4", x:620, y:280, ip:"10.10.20.14", mask:"255.255.255.0", mac:"a4bb.6d20.0014"},
  ],
  cables:[ {type:"cat6", a:"sw1:g8", b:"sw2:g8"}, {type:"console", a:"lapa:usb", b:"sw1:con"}, {type:"console", a:"lapb:usb", b:"sw2:con"},
    {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"pc2:eth", b:"sw1:g2"}, {type:"cat6", a:"pc3:eth", b:"sw2:g1"}, {type:"cat6", a:"pc4:eth", b:"sw2:g2"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Open the Terminal app on LAPTOP-A (console to SW1) at 9600 8N1, no flow control, and <code>enable</code>", done:B=>Bench.consoleOk(B,"sw1") || B.devs.sw1.env.seen.length>0},
    {text:"On SW1, <code>show interfaces g0/8 switchport</code> — Administrative Mode <i>dynamic auto</i>, Operational Mode <i>static access</i>. (<code>show interfaces trunk</code> prints nothing.)", done:B=>B.devs.sw1.env.saw(/Administrative Mode: dynamic auto[\s\S]*Operational Mode: static access/)},
    {text:"Prove VLAN 10 can't cross: from PC1's Command Prompt, <code>ping 10.10.10.13</code> (PC3). The log shows SW1 flooding the ARP to no other ports", done:B=>Bench.tried(B,"pc1",/^ping\s+10\.10\.10\.13\s*$/)},
    {text:"On SW1: <code>configure terminal</code>, <code>interface g0/8</code>, <code>switchport mode trunk</code>", done:B=>B.devs.sw1.env.intfs["GigabitEthernet0/8"].mode==="trunk"},
    {text:"<code>end</code>, then <code>show interfaces trunk</code> on SW1 — Gi0/8, Mode <i>on</i>, Status <i>trunking</i>", done:B=>B.devs.sw1.env.saw(/Gi0\/8\s+on\s+802\.1q\s+trunking/)},
    {text:"From PC1, <code>ping 10.10.10.13</code> again — it works. Watch the dots marked <b>10</b> and read &ldquo;with an 802.1Q tag for VLAN 10&rdquo; in the log", done:B=>Bench.pinged(B,"pc1","10.10.10.13")},
    {text:"From PC2, <code>ping 10.10.20.14</code> (PC4) — the same trunk now carries frames tagged <b>20</b>", done:B=>Bench.pinged(B,"pc2","10.10.20.14")},
    {text:"On LAPTOP-B (SW2): <code>enable</code>, <code>show interfaces trunk</code>. SW2 was never configured, yet Gi0/8 shows Mode <i>auto</i>, Status <i>trunking</i> — DTP did that", done:B=>B.devs.sw2.env.saw(/Gi0\/8\s+auto\s+802\.1q\s+trunking/) && Bench.trunking(B,"sw2","g8")},
    {text:"Harden it. SW2 first: <code>switchport mode trunk</code> then <code>switchport nonegotiate</code> on g0/8; then <code>switchport nonegotiate</code> on SW1's g0/8. Both ends stay trunking", done:B=>{ const a = B.devs.sw1.env.intfs["GigabitEthernet0/8"], b = B.devs.sw2.env.intfs["GigabitEthernet0/8"]; return a.mode==="trunk" && a.nonegotiate && b.mode==="trunk" && b.nonegotiate && Bench.trunking(B,"sw1","g8") && Bench.trunking(B,"sw2","g8"); }},
    {text:"On SW2, <code>show interfaces g0/8 switchport</code> — Administrative Mode <i>trunk</i>, Negotiation of Trunking <i>Off</i>", done:B=>B.devs.sw2.env.saw(/Administrative Mode: trunk[\s\S]*Negotiation of Trunking: Off/)},
  ],
  win:"You proved auto + auto stays access, made one end a trunk and watched DTP convert the other, saw frames cross tagged 10 and 20, and finished with both ends hard-coded and DTP silenced — the way production trunks are built.",
  solve:[["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces g0/8 switchport"],["term","show interfaces trunk"],
    ["pc","pc1","ping 10.10.10.13"],["term","configure terminal"],["term","interface g0/8"],["term","switchport mode trunk"],["term","end"],["term","show interfaces trunk"],
    ["pc","pc1","ping 10.10.10.13"],["pc","pc2","ping 10.10.20.14"],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces trunk"],
    ["term","configure terminal"],["term","interface g0/8"],["term","switchport mode trunk"],["term","switchport nonegotiate"],["term","end"],["term","show interfaces g0/8 switchport"],
    ["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface g0/8"],["term","switchport nonegotiate"],["term","end"],["term","show interfaces trunk"]]})}
${K.hint(`<code>Command rejected: Conflict between 'nonegotiate' and 'dynamic' status</code> = the port is still dynamic; set <code>switchport mode trunk</code> first. A ping failing after hardening? See the experiment below.`)}
<p>In the first ping, SW1 learned PC1 in VLAN 10 and &ldquo;flooded out no other ports&rdquo;: the uplink was an access port in VLAN 1, invisible to VLAN 10. After the trunk formed, the ARP left Gi0/8 &ldquo;with an 802.1Q tag for VLAN 10&rdquo;, SW2 learned PC1 <i>in VLAN 10</i> and flooded only to its VLAN 10 port; PC4 never saw it.</p>
<p><b>Try this (press Reset first):</b> set SW1 to <code>switchport mode trunk</code> plus <code>switchport nonegotiate</code> while SW2 is still auto. SW2 never hears a request and stays access; SW1 still shows <i>trunking</i> — a one-sided trunk — and PC1's ping fails with &ldquo;SW2 Gi0/8 is an access port and dropped a frame tagged for VLAN 10&rdquo;. That's the mismatch row, live.</p>
${K.dodont([
  "Hard-code both ends of every trunk, then add <code>switchport nonegotiate</code> — far end first.",
  "Set every user port to <code>switchport mode access</code>.",
  "Use one unused native VLAN, identical on both ends of every trunk.",
  "Change allowed lists only with <code>add</code>/<code>remove</code>, and verify on <b>both</b> switches.",
],[
  "Don't rely on DTP defaults — two default Catalysts give you an access link.",
  "Don't put users, phones or printers in the native VLAN.",
  "Don't type <code>allowed vlan X</code> when you mean <code>add X</code>.",
  "Don't connect a router to a dynamic port and expect a trunk.",
])}
${K.check({q:"In the bench, SW2's never-configured Gi0/8 showed Mode 'auto', Status 'trunking'. Why?", o:["Catalyst ports default to trunk","SW2 is dynamic auto, and SW1 in trunk mode sent DTP asking to trunk","CDP converted the port","Spanning Tree trunks every switch link"], a:1, why:"auto waits to be asked; switchport mode trunk on SW1 asks. That's the trunk + auto = trunk row."})}

<h2>VTP: sharing the VLAN list — and why most engineers turn it off</h2>
<p>Each switch keeps its own VLAN database: a VLAN missing on one switch can't cross (section 3 of <code>show interfaces trunk</code>). Creating every VLAN on 40 switches is tedious, so Cisco built ${K.g("VTP","VLAN Trunking Protocol: Cisco-proprietary; switches in one domain share a VLAN database over trunks; the highest revision wins.")} (VLAN Trunking Protocol): create a VLAN once and it appears on every switch in the same ${K.g("VTP domain","The shared name a group of VTP switches uses. A switch with no domain name adopts the first one it hears.")}, carried over trunks.</p>
<div class="tablewrap"><table>
<tr><th>Mode</th><th>Create/delete VLANs?</th><th>Syncs from the domain?</th><th>Relays VTP?</th></tr>
<tr><td><b>Server</b> (default)</td><td>Yes, and advertises them</td><td>Yes</td><td>Yes</td></tr>
<tr><td><b>Client</b></td><td>No</td><td>Yes</td><td>Yes</td></tr>
<tr><td><b>Transparent</b></td><td>Yes, locally</td><td>No</td><td>Yes</td></tr>
<tr><td><b>Off</b> (current IOS)</td><td>Yes, locally</td><td>No</td><td>No</td></tr>
</table></div>
<p>A brand-new switch with no domain name quietly adopts the first domain it hears on a trunk.</p>
<h3>Revision numbers and the classic disaster</h3>
<p>Every VLAN change on a server raises the domain's ${K.g("configuration revision","VTP's change counter. A switch accepts any advertisement with a higher revision and replaces its VLAN database with it.")} by one. A switch that hears a <b>higher revision</b> assumes it is newer and <b>replaces its entire VLAN database</b>. That rule is the danger.</p>
${K.svg("0 0 720 270",
  K.box(20,20,190,50,"CORE (server)","domain OFFICE · rev 12 · VLANs 1,10,20,30")+
  K.box(20,110,190,50,"SW-1F (client)","rev 12 · VLANs 1,10,20,30")+
  K.box(20,200,190,50,"SW-2F (client)","rev 12 · VLANs 1,10,20,30")+
  K.box(500,110,200,56,"LAB-SW from the spare shelf","domain OFFICE · rev 40 · VLAN 1 only",true)+
  K.arrow(498,138,214,135,"1 · plugged in, trunk forms",true)+
  K.arrow(330,128,214,48,"2 · advertises rev 40",true)+
  K.arrow(330,148,214,222,"",true)+
  K.txt(360,200,"3 · rev 40 &gt; rev 12, so every switch",{c:"bad",s:11,mid:true})+
  K.txt(360,216,"replaces its VLAN database: 10, 20, 30 deleted",{c:"bad",s:11,mid:true})+
  K.txt(360,240,"4 · every access port in VLAN 10/20/30 goes inactive",{c:"bad",s:11,mid:true}),
  "The VTP revision disaster: a switch with the same domain name and a higher revision — even one with almost no VLANs — overwrites every switch in the domain. Clients can do it too.")}
<p>A lab switch whose VLANs were created and deleted hundreds of times has a high revision. Reused in production with the same domain name, it advertises its near-empty database; every server and client accepts it; VLANs vanish and their access ports go <b>inactive</b>. A client with a higher revision does the same damage as a server. To reset a switch's revision to 0, change its domain to a dummy name and back, or go transparent and back.</p>
<h3>Best practice: transparent or off</h3>
<p>Most organisations set every switch to <code>vtp mode transparent</code> (or <code>off</code>) and create VLANs deliberately, often with templates or automation. Nobody can overwrite a transparent switch. VTP version 3 adds a &ldquo;primary server&rdquo; that prevents most accidents, but many teams still choose transparent.</p>
${K.out(`SW-CORE#show vtp status
VTP Version capable             : 1 to 3
VTP version running             : 1
VTP Domain Name                 : OFFICE
VTP Pruning Mode                : Disabled
VTP Operating Mode              : Server
Maximum VLANs supported locally : 1005
Number of existing VLANs        : 9
Configuration Revision          : 12`, "Trimmed real output: check the Operating Mode and Configuration Revision. (The lab simulator stores mode and domain and shows a shorter version without the revision.)")}
${K.when([
  ["Transparent","Most production networks","Can't be overwritten; VLANs are local; still relays VTP","You need VTPv3-managed VLANs across hundreds of switches"],
  ["Off","Switches that should ignore VTP completely","Like transparent, without relaying","Older IOS without it — use transparent"],
  ["Server/client (VTPv3)","Large campuses wanting central VLAN management","One place to create VLANs; primary server guards against accidents","Small and mid-sized networks"],
  ["Server (default), left alone","Never on purpose","—","Always: it's how revision disasters happen"],
], "Which VTP mode, and when")}
${K.dyk(`VTP versions 1 and 2 carry only VLANs 1–1005. To create an extended VLAN (1006–4094) with them, a switch must be <b>transparent</b> or off — you saw <code>Extended VLAN(s) not allowed in current VTP mode</code> in the terminal earlier. VTP version 3 carries the extended range.`)}
${K.myth([
  ["Every frame on a trunk carries a tag.","Native VLAN frames cross untagged."],
  ["A native VLAN mismatch brings the trunk down.","The trunk stays up and tagged VLANs work; untagged traffic leaks (or real Catalysts' Spanning Tree blocks it) and CDP logs the mismatch."],
  ["Two Cisco switches trunk automatically when cabled.","Modern defaults are dynamic auto; auto + auto = access."],
  ["<code>switchport trunk allowed vlan 30</code> adds VLAN 30.","It <b>replaces</b> the list. Use <code>add 30</code>."],
  ["Only a VTP server can overwrite a domain's VLANs.","Any switch in the domain with a higher revision can — clients too."],
])}
${K.check({q:"Which VTP mode lets a switch create its own VLANs, never be overwritten, and still pass VTP messages on?", o:["Server","Client","Transparent","Off"], a:2, why:"Transparent keeps local VLANs and relays VTP. Off doesn't relay. Servers and clients sync to the highest revision."})}

<h2>Hands-on: diagnose a trunk that half-works</h2>
<p>The second-floor trunk after a weekend change: Staff (VLAN 10) work; Finance upstairs can't reach the finance server downstairs. Nobody has told you what changed.</p>
${K.bench({id:"m4-trunk-fix", points:70, from:"CCNA · Module 4 · lesson 2", title:"the floor-2 trunk: a native mismatch and a lost VLAN", viewBox:"0 0 760 390", openLog:true,
  intro:"LAPTOP-A is consoled to SW-CORE (floor 1, with the finance server), LAPTOP-B to SW-2F (type <code>enable</code> after each switch of laptop). Both ends of Gi0/8 are hard-coded trunks. Find why VLAN 20 is dead upstairs, and what else is wrong.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW-CORE", model:"Catalyst 9300 · comms room", x:10, y:20,
      config:e=>{ ["en","conf t","hostname SW-CORE","vlan 10","name STAFF","vlan 20","name FINANCE","vlan 30","name CCTV","vlan 99","name NATIVE-UNUSED","exit","interface g0/1","switchport mode access","switchport access vlan 10","interface g0/2","switchport mode access","switchport access vlan 20",
        "interface g0/8","description Trunk to SW-2F","switchport mode trunk","switchport trunk native vlan 99","switchport trunk allowed vlan 10,20,30,99","switchport nonegotiate","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.saw = re => e.seen.some(s=>re.test(s.out));
        e.exec = line => { const o = run(line); e.seen.push({line:String(line), out: typeof o==="string" ? o : (o && o.text) || ""}); return o; }; }},
    {id:"lapa", kind:"laptop", label:"LAPTOP-A", x:450, y:20},
    {id:"sw2", kind:"switch", label:"SW-2F", model:"Catalyst 9200 · floor 2", x:330, y:150,
      config:e=>{ ["en","conf t","hostname SW-2F","vlan 10","name STAFF","vlan 20","name FINANCE","vlan 30","name CCTV","vlan 99","name NATIVE-UNUSED","exit","interface g0/1","switchport mode access","switchport access vlan 10","interface g0/2","switchport mode access","switchport access vlan 20",
        "interface g0/8","description Trunk to SW-CORE","switchport mode trunk","switchport trunk allowed vlan 10,30,99","switchport nonegotiate","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.saw = re => e.seen.some(s=>re.test(s.out));
        e.exec = line => { const o = run(line); e.seen.push({line:String(line), out: typeof o==="string" ? o : (o && o.text) || ""}); return o; }; }},
    {id:"lapb", kind:"laptop", label:"LAPTOP-B", x:190, y:140},
    {id:"pc1", kind:"pc", label:"STAFF-1F", x:10, y:280, ip:"10.10.10.11", mask:"255.255.255.0", mac:"3c52.8210.0011"},
    {id:"srv", kind:"server", label:"FIN-SRV", x:140, y:280, ip:"10.10.20.10", mask:"255.255.255.0", mac:"0011.8520.0010"},
    {id:"pc3", kind:"pc", label:"STAFF-2F", x:470, y:280, ip:"10.10.10.23", mask:"255.255.255.0", mac:"3c52.8210.0023"},
    {id:"pc4", kind:"pc", label:"FIN-2F", x:620, y:280, ip:"10.10.20.24", mask:"255.255.255.0", mac:"3c52.8220.0024"},
  ],
  cables:[ {type:"cat6", a:"sw1:g8", b:"sw2:g8"}, {type:"console", a:"lapa:usb", b:"sw1:con"}, {type:"console", a:"lapb:usb", b:"sw2:con"},
    {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"srv:eth", b:"sw1:g2"}, {type:"cat6", a:"pc3:eth", b:"sw2:g1"}, {type:"cat6", a:"pc4:eth", b:"sw2:g2"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Reproduce the complaint: from FIN-2F, <code>ping 10.10.20.10</code> (FIN-SRV) — it fails", done:B=>Bench.tried(B,"pc4",/^ping\s+10\.10\.20\.10\s*$/)},
    {text:"Rule out the cable: from STAFF-2F, <code>ping 10.10.10.11</code> (STAFF-1F) — VLAN 10 crosses the same trunk", done:B=>Bench.pinged(B,"pc3","10.10.10.11")},
    {text:"On SW-2F (LAPTOP-B): <code>show interfaces trunk</code>. Read the Native vlan column and the allowed list", done:B=>B.devs.sw2.env.saw(/Port\s+Mode\s+Encapsulation/)},
    {text:"On SW-CORE (LAPTOP-A): <code>show interfaces trunk</code> — compare the two ends", done:B=>B.devs.sw1.env.saw(/Port\s+Mode\s+Encapsulation/)},
    {text:"On either switch, <code>show logging</code> — find <code>%CDP-4-NATIVE_VLAN_MISMATCH</code> and read both numbers", done:B=>(Bench.logged(B,"sw2",/NATIVE_VLAN_MISMATCH/) || Bench.logged(B,"sw1",/NATIVE_VLAN_MISMATCH/)) && (B.devs.sw1.env.saw(/NATIVE_VLAN_MISMATCH/) || B.devs.sw2.env.saw(/NATIVE_VLAN_MISMATCH/))},
    {text:"Fix the allowed list on SW-2F <b>without retyping it</b> — it must end up 10,20,30,99", done:B=>JSON.stringify(B.devs.sw2.env.intfs["GigabitEthernet0/8"].allowed)==="[10,20,30,99]"},
    {text:"Fix the native VLAN on SW-2F so both ends match", done:B=>B.devs.sw2.env.intfs["GigabitEthernet0/8"].native===99},
    {text:"Prove it: from FIN-2F, <code>ping 10.10.20.10</code> succeeds — dots tagged <b>20</b> cross the trunk", done:B=>Bench.pinged(B,"pc4","10.10.20.10")},
    {text:"Verify on SW-2F: <code>show interfaces trunk</code> shows native 99 and 10,20,30,99 in every section", done:B=>B.devs.sw2.env.saw(/Gi0\/8\s+on\s+802\.1q\s+trunking\s+99[\s\S]*10,20,30,99[\s\S]*10,20,30,99[\s\S]*10,20,30,99/)},
    {text:"Save SW-2F: <code>copy running-config startup-config</code>", done:B=>{ const s = B.devs.sw2.env.startup; return !!(s && s.intfs && s.intfs["GigabitEthernet0/8"].native===99 && JSON.stringify(s.intfs["GigabitEthernet0/8"].allowed)==="[10,20,30,99]"); }},
  ],
  win:"You proved the link was fine, found VLAN 20 missing from one end's allowed list, read a native VLAN mismatch from the log, fixed both on the right switch without disturbing anything else, then verified and saved.",
  solve:[["pc","pc4","ping 10.10.20.10"],["pc","pc3","ping 10.10.10.11"],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces trunk"],["term","show logging"],
    ["console","lapa",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces trunk"],
    ["console","lapb",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","interface g0/8"],["term","switchport trunk allowed vlan add 20"],["term","switchport trunk native vlan 99"],["term","end"],
    ["pc","pc4","ping 10.10.20.10"],["term","show interfaces trunk"],["term","copy running-config startup-config"],["term",""]]})}
${K.hint(`Compare the two <code>show interfaces trunk</code> outputs section by section: which VLAN is on SW-CORE's list but not SW-2F's, and which column differs? Both faults are on the same switch.`)}
${K.reveal("Show what was wrong",`<p><b>Fault 1 — allowed list.</b> SW-2F allowed <code>10,30,99</code>; SW-CORE <code>10,20,30,99</code>. The log showed SW-2F flooding FIN-2F's ARP &ldquo;out no other ports in VLAN 20&rdquo;: as far as VLAN 20 was concerned, the trunk didn't exist. Someone added VLAN 30 by retyping the list without 20. Fix: <code>switchport trunk allowed vlan add 20</code>.</p><p><b>Fault 2 — native VLAN.</b> SW-CORE used 99, SW-2F the default 1, and CDP logged the mismatch. Spanning Tree then blocked VLAN 99 on Gi0/8 (<code>%SPANTREE-2-BLOCK_PVID_PEER</code> in the log, and 99 missing from SW-2F's last <code>show interfaces trunk</code> section); VLAN 1 wasn't on SW-2F's allowed list, so only 99 was blocked. It didn't cause the outage — tagged VLANs don't care — but without that blocking, untagged traffic in VLANs 99 and 1 would leak between them. Fix: <code>switchport trunk native vlan 99</code> on SW-2F. The old log line stays as history.</p>`)}

${K.job("“After the weekend change, VLAN 20 users on the second floor lost everything”",`
<p><b>The ticket</b> (Monday 08:10, a bank office in Garki, Abuja): &ldquo;Second floor — the loans team can't open the banking app, email, anything. Saturday's IT change was supposed to add the new CCTV cameras.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;Everyone upstairs?&rdquo; — <i>&ldquo;No, customer service is fine.&rdquo;</i> &ldquo;Loans on other floors?&rdquo; — <i>&ldquo;Fine.&rdquo;</i> Loans is VLAN 20, customer service VLAN 10. One VLAN, one floor, after an uplink change: the trunk is the suspect, and not the cable, because VLAN 10 crosses it.</p>
<p><b>Checks.</b> <code>show vlan brief</code> on SW-2F: VLAN 20 exists, loans ports are in it. Then the uplink:</p>
${K.out(`SW-2F#show interfaces trunk

Port        Mode             Encapsulation  Status        Native vlan
Gi1/0/48    on               802.1q         trunking      99

Port        Vlans allowed on trunk
Gi1/0/48    10,30,99

Port        Vlans allowed and active in management domain
Gi1/0/48    10,30,99

Port        Vlans in spanning tree forwarding state and not pruned
Gi1/0/48    10,30,99`, "VLAN 20 is missing from the very first list.")}
<p>The core end lists <code>10,20,30,99</code>. <code>show running-config interface Gi1/0/48</code> on SW-2F shows <code>switchport trunk allowed vlan 10,30,99</code>: the engineer pasted the trunk line from the third-floor template — and the third floor has no loans team.</p>
<p><b>The fix</b>, approved by phone as an emergency change: <code>switchport trunk allowed vlan add 20</code> on Gi1/0/48, then <code>show interfaces trunk</code> shows <code>10,20,30,99</code> in every section, then <code>copy running-config startup-config</code>. A loans PC pings its gateway and the banking app opens; you check the cameras (VLAN 30) still work, so the fix hasn't undone Saturday's change.</p>
<p><b>What you say.</b> To the loans manager: &ldquo;Saturday's camera work accidentally cut your team off the link to your floor. It's restored — please retry and call me if anything fails.&rdquo; To the change owner, privately: &ldquo;Template lines replace the allowed list; use <code>add</code>, and check <code>show interfaces trunk</code> before and after.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;2F loans (VLAN 20) down after CHG-0412 (add VLAN 30 CCTV). SW-2F Gi1/0/48 allowed 10,30,99 (core 10,20,30,99) — list replaced by 3F template line. Fix: allowed vlan add 20; verified all sections, app and CCTV OK, saved. Recommend pre/post sh int trunk on change checklist. 25 min.&rdquo;</i></p>`)}

${K.case("The spare-shelf switch that deleted an office's VLANs",`
<p>An MSP in Lagos ran a shipping company's network in Apapa: a core and six access switches, all left in VTP server mode in domain <code>APAPA</code>, every port at its default, <code>dynamic auto</code>.</p>
<p>During a UPS failure, a technician grabbed a spare switch for the warehouse office. It had spent a year in the MSP's training lab: domain <code>APAPA</code> (copied in a class), configuration revision 57, only VLAN 1, uplink left in <code>dynamic desirable</code>. He plugged it into a wall socket. Desirable met auto, so <b>DTP formed a trunk</b>; the switch advertised revision 57; every office switch, at revision 23, accepted it. VLANs 10, 20, 30 and 40 were deleted everywhere, their ports went inactive, and dispatch, finance and the gate system all stopped.</p>
<p>Recovery took ninety minutes. The review found three failures in a row — any one fixed would have prevented it:</p>
<ul>
<li><b>VTP left in server mode.</b> Transparent switches would have ignored the advertisement.</li>
<li><b>Desk ports left dynamic.</b> As <code>switchport mode access</code>, the socket could never have trunked, so VTP couldn't cross.</li>
<li><b>No reset before reuse.</b> Erasing the spare switch would have made it harmless.</li>
</ul>
<p>The new standard: VTP transparent everywhere, user ports hard-coded access, trunks hard-coded with <code>nonegotiate</code> and an unused native VLAN, and &ldquo;erase and reload&rdquo; for anything leaving the shelf. DTP opened the door; VTP walked through it.</p>`)}
${K.check({q:"In the Apapa case, which single change to the office switches would have prevented the outage even with the lab switch plugged in the same way?", o:["Native VLAN 99","VTP transparent mode on every office switch","A restricted allowed list on the core trunk","CDP on every port"], a:1, why:"Transparent switches never replace their VLANs from an advertisement. (Access-only desk ports would also have worked, by stopping the trunk.) Native VLAN, allowed lists and CDP don't stop VTP."})}

<h2>Interview corner</h2>
${K.hint(`Define it, both directions, why both ends must match, and the best practice with its security reason.`)}
${K.reveal("“What is the native VLAN?”",`<p>"On an 802.1Q trunk every VLAN is tagged except the native VLAN, VLAN 1 by default. Native frames are sent untagged, and untagged frames received go into the receiver's native VLAN. Since nothing on the wire says where an untagged frame came from, both ends must match; otherwise the trunk stays up but untagged traffic leaks between the two native VLANs — or Cisco's per-VLAN Spanning Tree blocks both on that port — and CDP logs a mismatch. I use an unused VLAN such as 99 as native on both ends of every trunk and put nothing in it, which defeats double-tagging attacks."</p>`)}
${K.hint(`The modes, the one rule, the default and its consequence, and production practice.`)}
${K.reveal("“Explain DTP modes.”",`<p>"DTP is Cisco's trunk negotiation. Access never trunks; trunk always trunks and tells the neighbour to; dynamic desirable asks; dynamic auto waits — the modern default. A trunk forms if one side asks and neither is access, so auto plus auto stays access, which is why two default switches don't trunk. Nonegotiate turns DTP off, so the far end must be hard-coded too, and routers never speak DTP. In production I hard-code trunks with nonegotiate and set user ports to access, because dynamic ports allow switch spoofing."</p>`)}
${K.hint(`Name the protocol, the mechanism, why a client can do it, recovery and prevention.`)}
${K.reveal("“Someone plugged in a switch and every VLAN disappeared. What happened?”",`<p>"VTP. The switch had the same domain name and a higher configuration revision; a trunk formed, probably by DTP on a dynamic port, and every server and client accepted its database because higher revision wins — clients included. VLANs it lacked were deleted and their ports went inactive. I'd disconnect it and recreate the VLANs. To prevent it: VTP transparent or off (or VTPv3 with a primary server), access-only user ports, and erase or reset any switch before connecting it."</p>`)}

${K.recap([
  "802.1Q inserts a 4-byte tag after the source MAC: TPID 0x8100, PCP 3 bits, DEI 1 bit, VID 12 bits (1–4094); the FCS is recalculated. ISL is obsolete.",
  "The native VLAN crosses untagged and must match on both ends, or untagged traffic leaks and CDP logs NATIVE_VLAN_MISMATCH. Use an unused native VLAN.",
  "switchport trunk allowed vlan X replaces the list; add/remove/except edit it.",
  "show interfaces trunk is a funnel: trunking → allowed → exists here → forwarding.",
  "DTP: access refuses, trunk insists, desirable asks, auto waits (the default). Auto + auto = access. Routers don't speak DTP.",
  "Production: trunks hard-coded with nonegotiate, user ports access.",
  "VTP: highest revision wins, so one reused switch can delete every VLAN. Use transparent or off.",
])}
${K.next(`<b>Lesson 3 — Inter-VLAN routing: router-on-a-stick and Layer 3 switches.</b> VLAN 10 still can't talk to VLAN 20 — that needs a router. You'll connect one to a hard-coded trunk with a ${K.g("subinterface","A logical interface inside one physical router port, e.g. Gi0/0.10; each one handles one VLAN.")} per VLAN (<code>encapsulation dot1Q</code>), then do the same on a Layer 3 switch with SVIs.`)}
`,
quiz:[
  {lvl:1, q:"Where in an Ethernet frame does the 802.1Q tag go?", o:["Before the destination MAC address","Between the source MAC address and the Type field","After the data, just before the FCS","It replaces the FCS"], a:1, why:"802.1Q inserts 4 bytes straight after the source MAC. The TPID 0x8100 sits there so the receiver knows a tag follows; the original Type field comes next."},
  {lvl:1, q:"The VLAN ID field in an 802.1Q tag is 12 bits long. How many VLANs can be used?", o:["1005","4094","4096","65,535"], a:1, why:"12 bits give 4096 values (0–4095). VLAN 0 and 4095 are reserved, leaving 1–4094. 1005 is the old normal-range limit that VTP versions 1 and 2 carry."},
  {lvl:2, q:"A switch adds an 802.1Q tag to a frame before sending it on a trunk. Which statement is correct?", o:["The FCS stays the same because only the header changed","The switch recalculates the FCS because the frame's contents changed","The receiving switch ignores the FCS on tagged frames","The tag is appended after the FCS so the FCS doesn't need changing"], a:1, why:"The FCS covers the whole frame. Inserting 4 bytes changes it, so the old FCS would fail. The switch computes a new FCS when it tags the frame and again when it removes the tag."},
  {lvl:1, q:"What happens to a frame in the native VLAN when it is sent out of an 802.1Q trunk?", o:["It is tagged with VLAN 1","It is sent untagged","It is dropped","It is tagged with the highest VLAN number on the trunk"], a:1, why:"Native-VLAN frames cross the trunk untagged, and untagged frames received on a trunk are placed into the receiver's native VLAN. That's why both ends must agree."},
  {lvl:1, q:"Which statement about ISL is true?", o:["It is the IEEE standard used on all modern switches","It inserts a 4-byte tag after the source MAC","It is Cisco's obsolete trunking method that encapsulates the whole frame with a new header and trailer","It is the protocol switches use to negotiate trunks"], a:2, why:"ISL wrapped the entire frame in a 26-byte header and 4-byte trailer and worked only between Cisco devices. Modern Catalysts support only 802.1Q. Trunk negotiation is DTP, not ISL."},
  {lvl:2, type:"multi", q:"Which two pairs of port configurations form a trunk between two Cisco switches? (Choose two.)", o:["dynamic auto and dynamic auto","dynamic auto and dynamic desirable","access and dynamic desirable","trunk and dynamic auto","trunk with nonegotiate and dynamic auto"], a:[1,3], why:"A trunk forms if one side asks (desirable or trunk) and the other isn't access. auto + auto: nobody asks. access refuses. With nonegotiate the trunk side sends no DTP, so the auto side never hears the request and stays access."},
  {lvl:2, q:"PCs in VLAN 30 on SW1 can't reach PCs in VLAN 30 on SW2. VLANs 10 and 20 cross fine. Based on SW1's output, what is the most likely cause?", ex:"SW1#show interfaces trunk\n\nPort        Mode             Encapsulation  Status        Native vlan\nGi0/24      on               802.1q         trunking      99\n\nPort        Vlans allowed on trunk\nGi0/24      10,20,30,99\n\nPort        Vlans allowed and active in management domain\nGi0/24      10,20,99\n\nPort        Vlans in spanning tree forwarding state and not pruned\nGi0/24      10,20,99", o:["VLAN 30 is not in the allowed list","VLAN 30 has not been created on SW1","There is a native VLAN mismatch","Spanning Tree is blocking VLAN 30"], a:1, why:"VLAN 30 is allowed, but it is missing from 'allowed and active in management domain', which lists only VLANs that exist on this switch. It disappears at section 3, not section 4, so it isn't Spanning Tree. Create VLAN 30 on SW1."},
  {lvl:2, type:"fill", q:"A trunk allows VLANs 10, 20 and 99. Type the interface command that adds VLAN 40 without removing any VLAN already allowed.", fields:[{label:"Command", a:["switchport trunk allowed vlan add 40"], ios:true}], why:"The add keyword merges 40 into the existing list. Without it, switchport trunk allowed vlan 40 replaces the list with VLAN 40 only and cuts off 10, 20 and 99."},
  {lvl:1, type:"match", q:"Match each switchport mode with how it behaves.", pairs:[["switchport mode access","Never trunks, sends no DTP"],["switchport mode trunk","Always trunks and tells the neighbour to trunk"],["dynamic desirable","Actively asks the neighbour to form a trunk"],["dynamic auto","Waits; trunks only if the neighbour asks"],["trunk plus nonegotiate","Always trunks but sends no DTP at all"]], why:"access refuses, trunk insists, desirable asks, auto waits. nonegotiate keeps a trunk but stops DTP, so the neighbour must also be hard-coded as a trunk."},
  {lvl:2, type:"order", q:"Put the VTP revision disaster in the order it happens.", items:["A switch with the same VTP domain name and a higher configuration revision is connected","A trunk forms on the link (for example by DTP on a dynamic port)","The new switch advertises its VLAN database with its higher revision","Every server and client in the domain replaces its VLAN database with the advertised one","Access ports in VLANs that no longer exist become inactive and users lose connectivity"], why:"VTP messages only cross trunks, so a trunk must form first. A higher revision always wins, so every switch in the domain, clients included, overwrites its VLANs. Ports assigned to deleted VLANs go inactive."},
  {lvl:3, q:"Both switches log the message below every minute. VLANs 10 and 20 work across the trunk, but a building-management controller in VLAN 99 on SW-CORE has lost contact with its sensors in VLAN 99 on SW-2F. What is the right fix?", ex:"SW-2F#show logging | include NATIVE\n*Oct 11 10:14:14.274: %CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/8 (1), with SW-CORE GigabitEthernet0/8 (99).", o:["Disable CDP on Gi0/8 so the messages stop","Set switchport trunk native vlan 99 on SW-2F's Gi0/8 so both ends match, then move the controller out of the native VLAN","Remove VLAN 99 from the allowed list on SW-CORE","Change both ports to dynamic desirable so DTP can agree the native VLAN"], a:1, why:"SW-2F uses native 1 and SW-CORE uses 99, so SW-CORE's VLAN 99 frames cross untagged and land in VLAN 1 on SW-2F (and real Catalysts' Spanning Tree blocks VLANs 1 and 99 on that port) — either way VLAN 99 can't cross. Match the native VLAN on both ends. Then, because best practice is an unused native VLAN, the controller shouldn't live in VLAN 99 at all. Silencing CDP hides the evidence; DTP doesn't negotiate the native VLAN."},
  {lvl:3, q:"After a weekend change to add VLAN 30, Finance users (VLAN 20) on the second floor have no network; Staff (VLAN 10) on the same floor are fine. Given SW-2F's uplink configuration, what is the best fix?", ex:"SW-2F#show running-config interface Gi1/0/48\ninterface GigabitEthernet1/0/48\n description Trunk to SW-CORE\n switchport trunk native vlan 99\n switchport trunk allowed vlan 10,30,99\n switchport mode trunk\n switchport nonegotiate", o:["switchport trunk allowed vlan 20","switchport trunk allowed vlan add 20","switchport mode dynamic desirable","no switchport nonegotiate"], a:1, why:"VLAN 20 was dropped when the list was replaced during the change. add 20 restores it without disturbing 10, 30 and 99. Typing allowed vlan 20 would repeat the original mistake and cut off everything else. The trunk itself is working, so DTP settings are irrelevant."},
  {lvl:2, q:"A router will route between VLANs 10 and 20 over one link (router-on-a-stick). The switch port facing the router is at its default, dynamic auto. What happens?", o:["DTP negotiates a trunk with the router automatically","The port stays an access port, because routers don't send DTP, so tagged VLAN traffic never reaches the router","The port err-disables","The port becomes a trunk carrying only the native VLAN"], a:1, why:"dynamic auto waits for the neighbour to ask, and a router never sends DTP. The port stays access in VLAN 1. Configure switchport mode trunk on the switch port facing a router-on-a-stick."},
  {lvl:3, type:"multi", q:"You are writing a switch-hardening standard for a bank's branches. Which three settings belong in it? (Choose three.)", o:["Hard-code switch-to-switch links with switchport mode trunk and switchport nonegotiate","Set every user-facing port to switchport mode access","Use a dedicated, unused VLAN as the native VLAN on every trunk","Leave ports in dynamic desirable so new switches connect automatically","Keep the native VLAN as VLAN 1 and put the printers in it","Leave every switch in VTP server mode so VLANs sync"], a:[0,1,2], why:"Hard-coded trunks without DTP and access-only user ports stop switch spoofing and accidental trunks. An unused native VLAN defeats double tagging. Dynamic desirable, users in the native VLAN and VTP servers everywhere are exactly the weaknesses attackers and accidents exploit."},
  {lvl:1, type:"fill", q:"Which command shows one port's administrative and operational mode, its native VLAN and whether it negotiates trunking? Use port Gi0/1.", fields:[{label:"Command", a:["show interfaces g0/1 switchport","show interfaces gi0/1 switchport","show interfaces gig0/1 switchport","show interfaces gigabitethernet0/1 switchport","show interfaces gigabitethernet 0/1 switchport"], ios:true}], why:"show interfaces <port> switchport shows Administrative Mode (what you configured), Operational Mode (what it is doing now), Negotiation of Trunking, the native VLAN and the allowed list for that port."},
  {lvl:3, q:"An engineer sets SW1's Gi0/8 to switchport mode trunk and switchport nonegotiate. SW2's Gi0/8 is still dynamic auto. show interfaces trunk on SW1 lists Gi0/8 as trunking, but PCs in VLAN 10 can't reach each other across the link. What is going on?", o:["SW1 is sending tagged frames, but SW2 never received a DTP request, so its port is an access port and drops them","The native VLANs don't match","nonegotiate disables 802.1Q tagging","VLAN 10 must be added to the allowed list on SW1"], a:0, why:"nonegotiate stops SW1 sending DTP. SW2 in dynamic auto waits to be asked, never is, and stays access. SW1 trunks and tags VLAN 10; SW2's access port drops tagged frames. Hard-code SW2 as a trunk too — ideally before adding nonegotiate on SW1."},
],
cards:[
  {f:"What is a trunk?", b:"A link that carries frames from many VLANs, each marked with a tag naming its VLAN. Used between switches, and from a switch to a router-on-a-stick, hypervisor or wireless controller."},
  {f:"The 802.1Q tag", b:"4 bytes inserted after the source MAC: TPID 0x8100 (16 bits), PCP priority (3 bits), DEI (1 bit), VLAN ID (12 bits, VLANs 1-4094). The FCS is recalculated."},
  {f:"ISL", b:"Cisco's obsolete proprietary trunking: wrapped the whole frame in a 26-byte header and 4-byte trailer. Catalyst 2960 and 9000 support only 802.1Q."},
  {f:"Native VLAN", b:"The one VLAN sent untagged on an 802.1Q trunk (default VLAN 1). Untagged frames received go into the receiver's native VLAN. Must match on both ends."},
  {f:"Native VLAN mismatch: symptoms", b:"Trunk stays up, tagged VLANs work, untagged traffic leaks between the two native VLANs (real Catalysts' Spanning Tree may block both instead), and CDP logs %CDP-4-NATIVE_VLAN_MISMATCH on both switches."},
  {f:"Native VLAN best practice", b:"A dedicated, unused VLAN (e.g. 99) as native on both ends of every trunk; never put devices in it. Defeats double-tagging VLAN hopping."},
  {f:"switchport trunk allowed vlan: replace vs add", b:"Without a keyword it REPLACES the list. add, remove and except edit it. Forgetting add is the classic trunk outage."},
  {f:"show interfaces trunk: the four sections", b:"1 mode/status/native VLAN; 2 VLANs allowed; 3 allowed and existing on this switch; 4 allowed, existing and forwarding in Spanning Tree. A VLAN missing in section 3 doesn't exist on that switch."},
  {f:"DTP modes", b:"access refuses, trunk insists, dynamic desirable asks, dynamic auto waits (the modern Catalyst default). A trunk forms if someone asks and nobody refuses."},
  {f:"auto + auto = ?", b:"An access link (VLAN 1). Both ports wait to be asked, so nobody asks. Two default Catalysts cabled together don't trunk."},
  {f:"switchport nonegotiate", b:"Stops a trunk port sending DTP. Only allowed on mode trunk (or access). The far end must also be hard-coded as a trunk, or it stays access (a one-sided trunk)."},
  {f:"Routers and DTP", b:"Routers never send DTP. A switch port facing a router-on-a-stick must be switchport mode trunk."},
  {f:"VTP modes", b:"Server: creates VLANs and syncs. Client: syncs only. Transparent: local VLANs, relays VTP. Off: local VLANs, ignores VTP. Best practice: transparent or off."},
  {f:"VTP revision disaster", b:"A switch with the same domain and a higher configuration revision overwrites every switch's VLAN database (clients too); deleted VLANs' ports go inactive. Prevent: transparent/off, access-only user ports, reset before reuse."},
],
});
// ---------- Module 4 · Lesson 3 ----------
L.push({
id:"vlan-routing", mins:70, level:"Beginner · builds on lessons 1–2 and Modules 2–3",
t:"Inter-VLAN routing: router-on-a-stick and Layer 3 switches",
html:`
${K.goals([
  "Explain why two VLANs can't talk without routing, and where the routing happens in each of the three designs.",
  "Configure router-on-a-stick: a static trunk on the switch and 802.1Q subinterfaces (including native) on the router.",
  "Configure a Layer 3 switch: <code>ip routing</code>, SVIs as default gateways and a routed uplink with <code>no switchport</code>.",
  "Follow one packet from VLAN 10 to VLAN 20: the tag, MACs and TTL on every link.",
  "Verify and troubleshoot it with <code>show vlan brief</code>, <code>show interfaces trunk</code>, <code>show ip interface brief</code> and <code>show ip route</code>, and choose the right design for a site.",
])}
${K.pre(["Lesson 1 (creating VLANs, access ports) and lesson 2 (802.1Q trunks, tags, the native VLAN, allowed lists and DTP).",
  "Module 2: the switch management SVI (<code>interface vlan 1</code>) and the default gateway. Module 3: IPv4 subnets — a VLAN gets its own subnet.",
  "Module 1: a router changes the Ethernet header at every hop and lowers the TTL by one."])}

<h2>Why this matters at work</h2>
<p>A bank branch in Garki, Abuja, has just been split into VLANs, as lessons 1 and 2 showed you: VLAN 10 for staff, VLAN 20 for tellers. Monday morning the manager phones: <i>&ldquo;The tellers can't print to the back-office printer, and nobody can reach the banking app.&rdquo;</i> The VLANs work perfectly — that is the problem. A VLAN is a wall, and nothing crosses it unless something routes it across.</p>
<p>This lesson is about that &ldquo;something&rdquo;. You'll configure the two designs you'll meet on almost every job — <b>router-on-a-stick</b> (one trunk, a subinterface per VLAN) and the <b>Layer 3 switch</b> — and watch a single ping cross from VLAN 10 to VLAN 20 on the bench, tag by tag. By the end you could fix that branch in ten minutes and explain why it broke.</p>

<h2>VLANs are subnets — so crossing one needs routing</h2>
<p>A VLAN is a separate broadcast domain (lesson 1), and each gets its own subnet (Module 3): VLAN 10 is <code>192.168.10.0/24</code>, VLAN 20 is <code>192.168.20.0/24</code>. Together they give the rule for this lesson:</p>
<div class="callout"><b>One VLAN = one subnet = one broadcast domain.</b> Moving a packet from one VLAN to another means moving it from one subnet to another — and that is the job of a router.</div>
<p>Remember what a PC does when it sends (Module 2): destination in my subnet → ARP for it directly; destination elsewhere → ARP for the ${K.g("default gateway","The router address a host sends to when the destination is in another subnet. It must be in the host's own subnet.")} and send the frame to the gateway's MAC. So a PC in VLAN 10 needs a gateway <i>inside VLAN 10</i> — usually <code>192.168.10.1</code> — with something behind it that can forward the packet into VLAN 20.</p>
<p>This is ${K.g("inter-VLAN routing","Routing packets between VLANs (subnets), using a router or a Layer 3 switch as each VLAN's default gateway.")}. A Layer 2 switch can't do it: it forwards only inside the VLAN a frame arrived in (Module 2). Something with an IP address in each subnet has to take the packet in on one side and send it out on the other.</p>
${K.analogy(`<p>Each floor of an office block is a VLAN with no stairs between floors. To send a parcel to another floor you hand it to your floor's post room (the default gateway), which sends it by lift. Router-on-a-stick is one shared lift shaft; a Layer 3 switch builds the post room into the core of every floor.</p>`)}
<h3>Three ways to give every VLAN a gateway</h3>
<p>All three do the same routing; they differ in where it happens and how many cables it takes.</p>
${K.svg("0 0 760 340",
  K.band(10,8,230,24,"1 · a router port per VLAN")+K.band(265,8,230,24,"2 · router-on-a-stick")+K.band(520,8,230,24,"3 · Layer 3 switch")+
  K.dev("router",125,70,"R1","Gi0/0 · Gi0/1")+K.dev("switch",125,170,"SW1","")+
  K.link(112,124,108,160)+K.link(138,124,142,160)+K.txt(104,146,"VLAN 10",{s:10,end:true})+K.txt(146,146,"VLAN 20",{s:10})+
  K.dev("pc",75,250,"PC1","VLAN 10")+K.dev("pc",175,250,"PC2","VLAN 20")+K.link(115,182,80,228)+K.link(135,182,170,228)+
  K.dev("router",380,70,"R1","Gi0/0.10 · Gi0/0.20")+K.dev("switch",380,170,"SW1","")+
  K.link(380,124,380,158,"")+K.txt(388,146,"one 802.1Q trunk",{c:"accent",s:10.5})+
  K.dev("pc",330,250,"PC1","VLAN 10")+K.dev("pc",430,250,"PC2","VLAN 20")+K.link(370,182,335,228)+K.link(390,182,425,228)+
  K.dev("switch",635,120,"CORE-SW1","ip routing")+K.txt(635,85,"SVIs: Vlan10 · Vlan20",{c:"accent",s:10.5,mid:true})+
  K.dev("pc",585,250,"PC1","VLAN 10")+K.dev("pc",685,250,"PC2","VLAN 20")+K.link(625,172,590,228)+K.link(645,172,680,228)+
  K.txt(125,328,"N VLANs = N router ports",{mid:true})+K.txt(380,328,"all VLANs share one link",{mid:true})+K.txt(635,328,"routing inside the switch",{mid:true}),
  "Three ways to route between VLANs. Left: one physical router interface per VLAN (legacy). Middle: one trunk and one subinterface per VLAN. Right: a Layer 3 switch with a virtual interface (SVI) per VLAN.")}
<p><b>1 · One router interface per VLAN (the legacy design).</b> Each VLAN gets its own cable from a switch access port to its own router interface. No trunking, so it's easy to understand — but every new VLAN costs a router port and a switch port. Fine for 2 VLANs, impossible for 12. You'll see it in old cabinets and exam diagrams.</p>
<p><b>2 · Router-on-a-stick.</b> One cable, configured as a trunk, carries every VLAN to the router. The router splits that one physical interface into logical ${K.g("subinterfaces","Logical interfaces carved out of one physical interface (e.g. Gi0/0.10). Each has its own IP address and 802.1Q VLAN.")}, one per VLAN, each with its own IP address. The name comes from the drawing: the router hangs off the switch on a single &ldquo;stick&rdquo;.</p>
<p><b>3 · Layer 3 switch.</b> A ${K.g("Layer 3 switch","A switch that can also route: it has SVIs or routed ports with IP addresses and forwards packets between them in hardware. Also called a multilayer switch.")} (also called a <i>multilayer switch</i>) routes internally. Each VLAN gets a ${K.g("SVI","Switched Virtual Interface: interface vlan N, a virtual Layer 3 interface inside a switch that represents the whole VLAN.")} — the same <code>interface vlan</code> you used for management in Module 2, now one per VLAN, each acting as that VLAN's gateway. No external router touches VLAN-to-VLAN traffic.</p>
${K.check({q:"A PC in VLAN 10 (192.168.10.25/24) sends a packet to a PC in VLAN 20 (192.168.20.40/24). What MAC address does PC1 put in the destination field of the frame it sends?", o:["PC2's MAC address","The broadcast address ffff.ffff.ffff","The MAC address of its default gateway","The switch's MAC address, because the switch knows both VLANs"], a:2, why:"Another subnet means the frame goes to the default gateway's MAC; the IP header still says 192.168.20.40."})}

<h2>Router-on-a-stick: one trunk, a subinterface per VLAN</h2>
<p>${K.g("Router-on-a-stick","Inter-VLAN routing where one router interface connects to a switch trunk and uses an 802.1Q subinterface per VLAN. Often written ROAS.")} (<b>ROAS</b>) has two halves: the router's subinterfaces and the switch port they plug into. Get either wrong and nothing crosses.</p>
<h3>The router half: subinterfaces with dot1Q</h3>
<p>A subinterface is written as the physical interface, a dot, and a number: <code>GigabitEthernet0/0.10</code>. The number after the dot is only a label, but engineers make it match the VLAN ID so it documents itself. What ties the subinterface to a VLAN is one command:</p>
<ul>
<li><code>encapsulation dot1Q 10</code> — &ldquo;frames arriving with an ${K.g("802.1Q","The IEEE trunking standard: a 4-byte tag inserted in the Ethernet frame that carries a 12-bit VLAN ID. Cisco types it dot1Q.")} tag of 10 belong to this subinterface, and frames I send from it get tag 10.&rdquo;</li>
<li><code>ip address 192.168.10.1 255.255.255.0</code> — the gateway address for VLAN 10's hosts.</li>
</ul>
<p>The order matters. IOS refuses an IP address on a LAN subinterface until it knows which VLAN that subinterface is in:</p>
${K.out(`BRANCH-R1(config)#interface g0/0.10
BRANCH-R1(config-subif)#ip address 192.168.10.1 255.255.255.0
% Configuring IP routing on a LAN subinterface is only allowed if that
subinterface is already configured as part of an IEEE 802.10, IEEE 802.1Q,
or ISL vLAN.`, "Typing the IP address before the encapsulation. The prompt changes to (config-subif)# so you know you're on a subinterface. IEEE 802.10 and ISL (Cisco's own old trunking protocol) are long-obsolete VLAN methods still named in the message; modern routers support only 802.1Q.")}
${K.remember(`<b>&ldquo;E before I&rdquo;</b> — <b>E</b>ncapsulation before <b>I</b>P. On every subinterface: <code>encapsulation dot1Q N</code> first, then <code>ip address</code>.`)}
<p>Then the <b>physical</b> interface: router interfaces start <code>shutdown</code> (Module 1), and a subinterface is never more &ldquo;up&rdquo; than its parent, so <code>interface g0/0</code> → <code>no shutdown</code>. The parent usually has no IP address of its own.</p>
${K.dyk(`Every subinterface uses the <b>same MAC address</b> as its physical interface. On the bench you'll see BRANCH-R1 answer ARP for 192.168.10.1 and for 192.168.20.1 with the same MAC, 0050.0c53.0001. That's fine: the 802.1Q tag tells the router which subinterface each frame is for. The switch keeps a MAC table per VLAN, so <code>show mac address-table</code> on SW1 lists that MAC twice on Gi0/8 — once in VLAN 10, once in VLAN 20.`)}
<h3>The native VLAN subinterface</h3>
<p>In lesson 2 you met the ${K.g("native VLAN","The one VLAN on a trunk whose frames are sent untagged. Default VLAN 1; both ends of the trunk must agree.")}, carried <i>untagged</i>. If the switch sends VLAN 99 untagged, the router must know untagged frames belong to VLAN 99. Either mark a subinterface native — <code>interface g0/0.99</code> → <code>encapsulation dot1Q 99 native</code> → <code>ip address …</code> — or put the native VLAN's address on the physical interface, which receives untagged frames. The <code>native</code> keyword is clearer. What matters is that router and switch agree, exactly as two switches must (lesson 2).</p>
<h3>The switch half: a static trunk</h3>
<p>The switch port facing the router must be a trunk. Here is the trap: Catalyst ports default to <code>switchport mode dynamic auto</code> and trunk only if the far end <i>asks</i> with ${K.g("DTP","Dynamic Trunking Protocol: Cisco switch-to-switch messages that negotiate whether a link becomes a trunk.")} (lesson 2). <b>Routers don't speak DTP.</b> The router never asks, so the port stays an access port in VLAN 1, and VLAN 10 and 20 frames never reach the router. Configure it statically: <code>switchport mode trunk</code> (many engineers add <code>switchport nonegotiate</code> too).</p>
${K.steps([
  ["Bring up the physical router interface", `<p><code>interface g0/0</code> → <code>description Trunk to SW1 Gi0/8</code> → <code>no shutdown</code>.</p>`],
  ["One subinterface per VLAN — encapsulation first", `<p><code>interface g0/0.10</code> → <code>encapsulation dot1Q 10</code> → <code>ip address 192.168.10.1 255.255.255.0</code><br><code>interface g0/0.20</code> → <code>encapsulation dot1Q 20</code> → <code>ip address 192.168.20.1 255.255.255.0</code></p>`],
  ["The native VLAN, if it carries traffic", `<p><code>interface g0/0.99</code> → <code>encapsulation dot1Q 99 native</code> → <code>ip address 192.168.99.1 255.255.255.0</code> — matching <code>switchport trunk native vlan 99</code> on the switch.</p>`],
  ["Make the switch port a static trunk", `<p><code>interface g0/8</code> → <code>switchport mode trunk</code>. If you restrict the allowed list, include every routed VLAN.</p>`],
  ["Point the hosts at their gateway and test", `<p>VLAN 10 hosts use <code>192.168.10.1</code>, VLAN 20 hosts <code>192.168.20.1</code>. Ping the gateway first, then a host in the other VLAN.</p>`],
])}
${K.mistake(`Leaving the switch port to the router at its default (<code>dynamic auto</code>). The router looks perfect — subinterfaces up/up, addresses right — but <code>show interfaces trunk</code> on the switch is empty. Always configure <code>switchport mode trunk</code> towards a router.`)}
<h3>Try it yourself: configure a ROAS router</h3>
<p>This router isn't cabled — it's for practising the command order, including a native VLAN subinterface.</p>
${K.hint(`From <code>BRANCH-R2&gt;</code>: <code>enable</code>, <code>configure terminal</code>, then <code>interface g0/0.10</code>. Try the IP address first on purpose to see the error. Abbreviations work: <code>int g0/0.20</code>, <code>enc dot1q 20</code>.`)}
${K.term({env:"ios2", title:"router-on-a-stick subinterfaces on BRANCH-R2", opts:{kind:"router", host:"BRANCH-R2", model:"C1111-4P",
  motd:"BRANCH-R2 — console session. Gi0/0 will become the trunk to the branch switch (VLANs 10, 20 and native VLAN 99)."},
  intro:"An ISR branch router out of the box: Gi0/0 is shut and has no subinterfaces yet.",
  tasks:[
    {text:"<code>enable</code>, <code>conf t</code>, <code>interface g0/0.10</code>, then type <code>ip address 192.168.10.1 255.255.255.0</code> <i>before</i> the encapsulation — read the error", done:e=>e.log.some(l=>/IEEE 802\.1Q/.test(l.out||""))},
    {text:"Fix it: <code>encapsulation dot1Q 10</code>, then the IP address again", done:e=>{ const i = e.intfs["GigabitEthernet0/0.10"]||{}; return i.encap===10 && !i.encapNative && i.ip==="192.168.10.1"; }},
    {text:"Create <code>g0/0.20</code> for VLAN 20 with <code>192.168.20.1 255.255.255.0</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/0.20"]||{}; return i.encap===20 && i.ip==="192.168.20.1" && i.mask==="255.255.255.0"; }},
    {text:"Create <code>g0/0.99</code> for the native VLAN: <code>encapsulation dot1Q 99 native</code>, IP <code>192.168.99.1 255.255.255.0</code>", done:e=>{ const i = e.intfs["GigabitEthernet0/0.99"]||{}; return i.encap===99 && i.encapNative===true && i.ip==="192.168.99.1"; }},
    {text:"Bring up the parent: <code>interface g0/0</code>, <code>no shutdown</code>", done:e=>!e.intfs["GigabitEthernet0/0"].shut},
    {text:"<code>do show ip interface brief</code> — three subinterfaces, each up/up with its own address", done:e=>e.log.some(l=>/IP-Address/.test(l.out||"") && /GigabitEthernet0\/0\.99/.test(l.out||""))},
    {text:"<code>end</code> and save with <code>copy running-config startup-config</code>", done:e=>e.savedOnce},
  ],
  win:"You built a router-on-a-stick configuration in the right order — encapsulation before IP — including a native VLAN subinterface, and brought the parent interface up so the subinterfaces could come up.",
  solve:["enable","configure terminal","interface g0/0.10","ip address 192.168.10.1 255.255.255.0","encapsulation dot1Q 10","ip address 192.168.10.1 255.255.255.0","interface g0/0.20","encapsulation dot1Q 20","ip address 192.168.20.1 255.255.255.0","interface g0/0.99","encapsulation dot1Q 99 native","ip address 192.168.99.1 255.255.255.0","interface g0/0","no shutdown","do show ip interface brief","end","copy running-config startup-config",""]})}
<p>In your <code>show ip interface brief</code>, <code>Gi0/0</code> is up/up with no address (it only carries the trunk), and each subinterface has its own line and gateway address. Their status follows the parent: shut <code>Gi0/0</code> and all three go down together. What the output does <b>not</b> show is the VLAN each subinterface is tagged for — a wrong <code>encapsulation dot1Q</code> number still says up/up. Read the tags in <code>show running-config</code> (on real routers <code>show interfaces g0/0.10</code> and <code>show vlans</code> show them too). Remember that for the on-the-job scenario.</p>
${K.check({q:"A router has interface Gi0/0.30 with encapsulation dot1Q 30 and ip address 192.168.30.1/24. The switch port it connects to is in its factory default state. What happens when a PC in VLAN 30 pings 192.168.30.1?", o:["It works: the switch negotiates a trunk with the router using DTP","It fails: the switch port stays an access port in VLAN 1 because routers don't send DTP","It works, because the router's subinterface sends DTP on behalf of VLAN 30","It fails because subinterface numbers must start at 1"], a:1, why:"Dynamic auto waits for DTP, which a router never sends, so the port stays an access port in VLAN 1. Configure switchport mode trunk."})}

<h2>Follow one packet from VLAN 10 to VLAN 20</h2>
<p>Now watch a ping cross the VLAN wall, on the network you'll build below: PC1 (VLAN 10) on <code>Gi0/1</code>, PC2 (VLAN 20) on <code>Gi0/3</code>, BRANCH-R1 on trunk <code>Gi0/8</code>.</p>
${K.svg("0 0 720 330",
  K.dev("router",360,60,"BRANCH-R1","Gi0/0.10 in · Gi0/0.20 out")+
  K.dev("switch",360,200,"SW1","Gi0/8 = trunk")+
  K.dev("pc",90,270,"PC1","192.168.10.11 · VLAN 10")+K.dev("pc",630,270,"PC2","192.168.20.21 · VLAN 20")+
  K.link(345,74,345,188)+K.link(375,74,375,188)+K.link(334,210,100,250)+K.link(386,210,620,250)+
  K.arrow(150,232,300,206,"① untagged",true)+
  K.arrow(330,180,330,98,"",true)+K.txt(320,140,"② tag 10 ↑",{c:"accent",s:11,end:true})+
  K.arrow(390,98,390,180,"",true)+K.txt(400,140,"③ tag 20 ↓",{c:"accent",s:11})+
  K.arrow(420,206,570,232,"④ untagged",true)+
  K.txt(20,22,"Access ports: untagged.  Trunk: tagged.",{c:"fg",s:11.5})+
  K.txt(20,40,"The frame crosses the trunk twice.",{c:"fg",s:11.5}),
  "One ping from PC1 to PC2 through router-on-a-stick. The frame goes up the trunk tagged 10, the router routes it, and it comes back down the same trunk tagged 20.")}
${K.steps([
  ["① PC1 → SW1 (access port, VLAN 10)", `<p>192.168.20.21 isn't in PC1's subnet, so PC1 ARPs for 192.168.10.1 and sends the ping to the gateway's MAC, <b>untagged</b> — PCs never tag. SW1 knows from access port <code>Gi0/1</code> that it belongs to <b>VLAN 10</b>.</p>`],
  ["② SW1 → BRANCH-R1 (trunk, tag 10)", `<p>The router's MAC was learned on <code>Gi0/8</code>, a trunk, so SW1 sends it there with an 802.1Q tag of <b>10</b>. The router hands tag-10 frames to <code>Gi0/0.10</code>.</p>`],
  ["Inside BRANCH-R1: routing", `<p>The router removes the old Ethernet header, finds a connected route to 192.168.20.0/24 on <code>Gi0/0.20</code>, <b>lowers the TTL</b> (128 → 127), ARPs for PC2 out of <code>Gi0/0.20</code> if needed, and builds a new frame.</p>`],
  ["③ BRANCH-R1 → SW1 (trunk, tag 20)", `<p>The new frame leaves <code>Gi0/0.20</code>, so it is tagged <b>20</b> — and goes back down the same cable it came up.</p>`],
  ["④ SW1 → PC2 (access port, VLAN 20)", `<p>SW1 forwards it out access port <code>Gi0/3</code> without the tag. The reply makes the same trip in reverse: tag 20 up, routed, tag 10 down.</p>`],
])}
<p>Every field, link by link — Module 1's rule in action: <i>MACs change at a routed hop, IPs don't</i>:</p>
<div class="tablewrap"><table>
<tr><th>Link</th><th>802.1Q tag</th><th>Source MAC</th><th>Destination MAC</th><th>Source → destination IP</th><th>TTL</th></tr>
<tr><td>① PC1 → SW1 Gi0/1</td><td>none</td><td>a4bb.6d10.0011 (PC1)</td><td>0050.0c53.0001 (R1)</td><td>192.168.10.11 → 192.168.20.21</td><td>128</td></tr>
<tr><td>② SW1 Gi0/8 → R1</td><td><b>10</b></td><td>a4bb.6d10.0011 (PC1)</td><td>0050.0c53.0001 (R1)</td><td>192.168.10.11 → 192.168.20.21</td><td>128</td></tr>
<tr><td>③ R1 → SW1 Gi0/8</td><td><b>20</b></td><td>0050.0c53.0001 (R1)</td><td>a4bb.6d20.0021 (PC2)</td><td>192.168.10.11 → 192.168.20.21</td><td><b>127</b></td></tr>
<tr><td>④ SW1 Gi0/3 → PC2</td><td>none</td><td>0050.0c53.0001 (R1)</td><td>a4bb.6d20.0021 (PC2)</td><td>192.168.10.11 → 192.168.20.21</td><td>127</td></tr>
</table></div>
<p>The <b>switch never changes MACs</b> — only the tag. The <b>router changes the MACs and the tag</b> and lowers the TTL. PC1 sees <code>TTL=127</code> in the replies: PC2's reply starts at 128 and crosses one router. TTL 127 proves a router sat in the path.</p>
${K.exam(`&ldquo;How many times does the frame cross the trunk?&rdquo; With router-on-a-stick, <b>twice</b> — up in the source VLAN, down in the destination VLAN. That is the design's bottleneck. &ldquo;The switch routes it directly&rdquo; is wrong unless it's a Layer 3 switch.`)}
${K.q({type:"order", q:"Put the life of PC1's ping to PC2 (router-on-a-stick, VLAN 10 to VLAN 20) in order.", items:["PC1 sends an untagged frame to its gateway's MAC on access port Gi0/1","SW1 forwards it out trunk Gi0/8 with an 802.1Q tag of 10","The router accepts it on Gi0/0.10, lowers the TTL and finds a connected route out of Gi0/0.20","The router sends a new frame tagged 20 back down the same trunk","SW1 removes the tag and delivers it to PC2 on access port Gi0/3"], why:"Hosts never tag; the switch tags on the trunk; the router routes between subinterfaces, rewriting the MACs and the tag; the switch removes the tag on the access port. The frame crosses the trunk twice."})}
<h3>Hands-on: build router-on-a-stick and watch the tag change</h3>
<p>Everything is cabled: BRANCH-R1 <code>G0/0</code> to SW1 port 8, PC1 on port 1 (VLAN 10), PC2 on port 3 (VLAN 20). SW1 has its VLANs and access ports; port 8 is at factory default. A laptop is on each console. After each ping, read the frame log and watch the number on the dots between SW1 and the router.</p>
${K.bench({id:"m4-roas", points:90, from:"CCNA · Module 4 · lesson 3", title:"router-on-a-stick: one trunk, two VLANs, one router", viewBox:"0 0 760 420", openLog:true,
  intro:"Configure BRANCH-R1's subinterfaces from LAPTOP-R, try a ping, then fix the switch side from LAPTOP-SW. Console settings for both: 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control. After you move to the other laptop, press Enter and type enable again.",
  devices:[
    {id:"r1", kind:"router", label:"BRANCH-R1", model:"ISR 1100 · branch router", x:20, y:20,
      config:e=>{ ["en","conf t","hostname BRANCH-R1","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = [];
        e.exec = line => { const o = run(line); if (typeof o==="string" && /Codes: L - local/.test(o)) e.seen.push({route:true, both:/C\s+192\.168\.10\.0\/24 is directly connected, GigabitEthernet0\/0\.10/.test(o) && /C\s+192\.168\.20\.0\/24 is directly connected, GigabitEthernet0\/0\.20/.test(o)}); return o; }; }},
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · branch access", x:300, y:170,
      config:e=>{ ["en","conf t","hostname SW1","vlan 10","name STAFF","vlan 20","name TELLERS","exit","interface range g0/1 - 2","switchport mode access","switchport access vlan 10","interface range g0/3 - 4","switchport mode access","switchport access vlan 20","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = [];
        e.exec = line => { const o = run(line); const t = String(line).trim().split(/\s+/); if (/^do$/i.test(t[0]||"")) t.shift();
          if (typeof o==="string" && /^sh/i.test(t[0]||"") && /^int/i.test(t[1]||"") && /^tr/i.test(t[2]||"")) e.seen.push({trunk:true, empty:o.trim()==="", g8:/Gi0\/8\s+on/.test(o)});
          return o; }; }},
    {id:"lap1", kind:"laptop", label:"LAPTOP-R", x:240, y:20},
    {id:"lap2", kind:"laptop", label:"LAPTOP-SW", x:620, y:40},
    {id:"pc1", kind:"pc", label:"PC1", x:220, y:300, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1", mac:"a4bb.6d10.0011"},
    {id:"pc2", kind:"pc", label:"PC2", x:480, y:300, ip:"192.168.20.21", mask:"255.255.255.0", gw:"192.168.20.1", mac:"a4bb.6d20.0021"},
  ],
  cables:[ {type:"cat6", a:"r1:g0", b:"sw1:g8"}, {type:"cat6", a:"pc1:eth", b:"sw1:g1"}, {type:"cat6", a:"pc2:eth", b:"sw1:g3"},
           {type:"console", a:"lap1:usb", b:"r1:con"}, {type:"console", a:"lap2:usb", b:"sw1:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Open LAPTOP-R's Terminal app and console into BRANCH-R1 (9600 8N1, no flow control)", done:B=>Bench.consoleOk(B,"r1")},
    {text:"<code>enable</code>, <code>conf t</code>, then bring up the parent: <code>interface g0/0</code> → <code>no shutdown</code>", done:B=>!B.devs.r1.env.intfs["GigabitEthernet0/0"].shut},
    {text:"Create <code>interface g0/0.10</code> → <code>encapsulation dot1Q 10</code> → <code>ip address 192.168.10.1 255.255.255.0</code>", done:B=>{ const i = B.devs.r1.env.intfs["GigabitEthernet0/0.10"]||{}; return i.encap===10 && i.ip==="192.168.10.1"; }},
    {text:"Create <code>interface g0/0.20</code> → <code>encapsulation dot1Q 20</code> → <code>ip address 192.168.20.1 255.255.255.0</code>", done:B=>{ const i = B.devs.r1.env.intfs["GigabitEthernet0/0.20"]||{}; return i.encap===20 && i.ip==="192.168.20.1"; }},
    {text:"From PC1's Command Prompt, <code>ping 192.168.10.1</code> (its gateway). It fails — the log shows SW1 flooding PC1's ARP out &ldquo;no other ports in VLAN 10&rdquo;", done:B=>Bench.tried(B,"pc1",/^ping\s+192\.168\.10\.1$/)},
    {text:"Open LAPTOP-SW, console into SW1, <code>enable</code>, <code>show interfaces trunk</code> — nothing is listed: Gi0/8 is dynamic auto and the router never sends DTP", done:B=>B.devs.sw1.env.seen.some(s=>s.trunk && s.empty)},
    {text:"Fix the switch side: <code>conf t</code> → <code>interface g0/8</code> → <code>switchport mode trunk</code> → <code>end</code>, then <code>show interfaces trunk</code> shows Gi0/8 trunking", done:B=>Bench.trunking(B,"sw1","g8") && B.devs.sw1.env.seen.some(s=>s.trunk && s.g8)},
    {text:"From PC1, <code>ping 192.168.20.21</code> (PC2 in VLAN 20). Replies show <b>TTL=127</b>; on the trunk the request goes up tagged 10 and comes down tagged 20 (the log and the number on the dots)", done:B=>Bench.pinged(B,"pc1","192.168.20.21")},
    {text:"Back on BRANCH-R1 (LAPTOP-R), <code>show ip route</code> — one connected route per VLAN, each on its subinterface", done:B=>B.devs.r1.env.seen.some(s=>s.route && s.both)},
  ],
  win:"You built router-on-a-stick from both ends, proved that a router never negotiates a trunk, and watched one ping go up the trunk tagged 10 and come back down tagged 20, one TTL lighter.",
  solve:[["console","lap1",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","conf t"],
    ["term","interface g0/0"],["term","no shutdown"],
    ["term","interface g0/0.10"],["term","encapsulation dot1Q 10"],["term","ip address 192.168.10.1 255.255.255.0"],
    ["term","interface g0/0.20"],["term","encapsulation dot1Q 20"],["term","ip address 192.168.20.1 255.255.255.0"],["term","end"],
    ["pc","pc1","ping 192.168.10.1"],
    ["console","lap2",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces trunk"],
    ["term","conf t"],["term","interface g0/8"],["term","switchport mode trunk"],["term","end"],["term","show interfaces trunk"],
    ["pc","pc1","ping 192.168.20.21"],
    ["console","lap1",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show ip route"]]})}
${K.hint(`PC2 ping still failing after the trunk is up? If the router's ARP for 192.168.20.21 gets no answer, check the <code>encapsulation dot1Q</code> number on <code>Gi0/0.20</code>. If nothing reaches the router, check the trunk and the parent interface.`)}
<p>The log tells the story: <i>&ldquo;SW1 sends it out trunk Gi0/8 with an 802.1Q tag for VLAN 10&rdquo;</i>, then <i>&ldquo;BRANCH-R1 received it on Gi0/0.10, decrements TTL to 127 and routes it&rdquo;</i>, then the frame coming down the trunk with 20 on its dots. (Each log line names the address of the interface sending that hop, so the routed hop shows 192.168.20.1; the IP header still says 192.168.10.11.) Before the trunk, PC1's ARP was flooded &ldquo;out no other ports in VLAN 10&rdquo; — port 8 was an access port in VLAN 1.</p>
<p>On the router, <code>show ip route</code> now reads:</p>
${K.out(`BRANCH-R1#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       O - OSPF, IA - OSPF inter area, * - candidate default

Gateway of last resort is not set

      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0.10
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0.10
      192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.20.0/24 is directly connected, GigabitEthernet0/0.20
L        192.168.20.1/32 is directly connected, GigabitEthernet0/0.20`, "Each VLAN's subnet is a connected (C) route on its subinterface, plus a local (L) /32 for the router's own address.")}
<p>Both subnets are directly connected, so no static routes are needed. A missing <code>C</code> line means that subinterface is down or has no address.</p>
${K.check({q:"After router-on-a-stick is configured, PC1 (VLAN 10) pings PC2 (VLAN 20) and gets replies with TTL=127. What does the 127 tell you?", o:["The ping crossed 127 switches","The reply crossed exactly one router hop (128 − 1); a router really is routing between the VLANs","The native VLAN is mismatched","PC2 is in the same VLAN as PC1"], a:1, why:"Windows starts at 128; each router hop subtracts one and switches never touch it. 127 = one router in the path."})}

<h2>The Layer 3 switch: SVIs and ip routing</h2>
<p>Router-on-a-stick works, but every inter-VLAN packet climbs the trunk and comes back down. With 300 users, servers in their own VLAN and nightly backups, the router's one link and its processor become the slowest part of the network. A Layer 3 switch removes the trip.</p>
<h3>How it works</h3>
<p>In Module 2, <code>interface vlan 1</code> was only a way <i>into</i> the switch for management. On a Layer 3 switch with routing on, each SVI becomes its VLAN's default gateway, and the switch routes between them in hardware — the same ${K.g("ASIC","Application-Specific Integrated Circuit: a chip built for one job, here forwarding frames and packets at full port speed.")} chips that switch frames also route packets, at or near ${K.g("line rate","The full speed of the port: a 1 Gb/s port forwarding 1 Gb/s with no slowdown.")}. A packet from PC1 enters port 1, is routed from Vlan10 to Vlan20 inside the switch, and leaves port 3.</p>
${K.svg("0 0 720 330",
  K.box(150,20,420,170,"","",true)+K.txt(360,42,"CORE-SW1 (Layer 3 switch, ip routing)",{c:"fg",s:12,mid:true,f:"display",b:true})+
  K.box(290,58,140,40,"routing engine","in hardware (ASICs)",true)+
  K.band(175,128,110,26,"Vlan10 .10.1")+K.band(305,128,110,26,"Vlan20 .20.1")+K.band(435,128,110,26,"Gi0/8 10.0.0.2")+
  K.arrow(330,98,240,126)+K.arrow(360,98,360,126)+K.arrow(390,98,480,126)+
  K.txt(230,176,"ports 1–2: VLAN 10",{s:10.5,mid:true})+K.txt(360,176,"ports 3–4: VLAN 20",{s:10.5,mid:true})+K.txt(490,176,"routed port",{s:10.5,mid:true})+
  K.dev("pc",150,270,"PC1","gw 192.168.10.1")+K.dev("pc",360,270,"PC2","gw 192.168.20.1")+K.dev("router",620,270,"EDGE-R1","10.0.0.1 · internet")+
  K.link(230,190,160,248)+K.link(360,190,360,248)+K.link(490,190,610,254,"no switchport"),
  "A Layer 3 switch: one SVI per VLAN is that VLAN's default gateway, the routing engine moves packets between them in hardware, and a routed port (no switchport) connects to the edge router.")}
<h3>The configuration</h3>
${K.steps([
  ["Turn routing on", `<p><code>ip routing</code> in global configuration. Without it, hosts can ping their SVI gateway but nothing is routed between VLANs. It is off out of the box on classic Catalysts such as the 3560 and 3750, and usually on Catalyst 9000 models too, but defaults vary by platform and software release — never assume: check for the line with <code>show running-config | include ip routing</code>. With routing off, <code>show ip route</code> prints <code>Default gateway is …</code> and a host table instead of a routing table.</p>`],
  ["Make sure each VLAN exists and has a live port", `<p><code>vlan 10</code>, <code>vlan 20</code> (lesson 1), access ports assigned. An SVI only comes up when its VLAN has at least one active port — more on this below.</p>`],
  ["One SVI per VLAN, as the gateway", `<p><code>interface vlan 10</code> → <code>ip address 192.168.10.1 255.255.255.0</code> → <code>no shutdown</code>. Add <code>no shutdown</code> out of habit: many Catalysts (and the lab) create a new SVI enabled, but some platforms create it shut, and <code>Vlan1</code> is administratively down out of the box.</p>`],
  ["A routed uplink to the edge router", `<p><code>interface g0/8</code> → <code>no switchport</code> → <code>ip address 10.0.0.2 255.255.255.252</code>. ${K.g("no switchport","Turns a switch port into a routed port: no VLANs, no STP, its own IP address — like a router interface.")} turns the port into a ${K.g("routed port","A physical switch port behaving like a router interface (after no switchport). It belongs to no VLAN.")}. Before it, IOS rejects an IP address on a switch port.</p>`],
  ["A default route towards the internet", `<p><code>ip route 0.0.0.0 0.0.0.0 10.0.0.1</code> (Module 3's static routes). The edge router needs a route back, such as <code>ip route 192.168.0.0 255.255.0.0 10.0.0.2</code> (or a routing protocol, later in the course).</p>`],
])}
${K.mistake(`Configuring perfect SVIs and forgetting <code>ip routing</code>. Every host pings its own gateway, so the SVIs &ldquo;look fine&rdquo;, yet VLAN 10 can't reach VLAN 20. The bench log says it plainly: <i>&ldquo;isn't routing (no ip routing) — dropped&rdquo;</i>. On the switch, <code>show ip route</code> gives it away too: instead of a routing table it prints <code>Default gateway is not set</code> and a host table, because with routing off the switch behaves like a host.`)}
<h3>When is an SVI up?</h3>
<p>Catalyst switches use a rule often called ${K.g("autostate","The rule that keeps an SVI's line protocol down until its VLAN has at least one active, forwarding port.")}: the SVI's line protocol is <b>up</b> only when all of these are true —</p>
<ul>
<li>the VLAN <b>exists</b> in the switch's VLAN database;</li>
<li>at least one port carrying it is <b>up and forwarding</b> (an access port with a device, or a trunk that allows it);</li>
<li>the SVI is not <code>shutdown</code>.</li>
</ul>
<p>Create <code>interface vlan 30</code> before anything is in VLAN 30 and it shows <code>up down</code>. Not a fault — nobody is in VLAN 30 yet. (If VLAN 30 doesn't exist in the VLAN database at all, the SVI shows <code>down down</code> instead.)</p>
${K.remember(`An SVI comes up with <b>&ldquo;VLAN, Port, No-shut&rdquo;</b>: the VLAN exists, a port in it is live, and the SVI isn't shut. <b>Routing</b> between SVIs is a separate switch: <code>ip routing</code>.`)}
<h3>Hands-on: the same network, routed by the switch</h3>
<p>The same two VLANs plus an unused guest VLAN 30 — but CORE-SW1 is a Layer 3 switch, and EDGE-R1 is the internet router on a routed /30 link, already configured with a test address 203.0.113.1 and a route back to 192.168.0.0/16. PC3 isn't plugged in yet.</p>
${K.bench({id:"m4-l3switch", points:100, from:"CCNA · Module 4 · lesson 3", title:"Layer 3 switch: SVIs, ip routing and a routed uplink", viewBox:"0 0 760 420", openLog:true,
  intro:"Console into CORE-SW1 from the laptop (9600 8N1, no flow control). Build the SVIs, test before and after ip routing, add the routed uplink and default route, then bring VLAN 30 to life.",
  devices:[
    {id:"edge", kind:"router", label:"EDGE-R1", model:"ISR 1100 · internet edge", x:20, y:20,
      config:e=>{ ["en","conf t","hostname EDGE-R1","interface g0/0","description Routed link to CORE-SW1","ip address 10.0.0.1 255.255.255.252","no shutdown","interface loopback0","description Test address on the internet side","ip address 203.0.113.1 255.255.255.255","exit","ip route 192.168.0.0 255.255.0.0 10.0.0.2","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"core", kind:"switch", label:"CORE-SW1", model:"Catalyst 9300 · Layer 3 core", x:300, y:160,
      config:e=>{ ["en","conf t","hostname CORE-SW1","vlan 10","name STAFF","vlan 20","name TELLERS","vlan 30","name GUEST","exit","interface range g0/1 - 2","switchport mode access","switchport access vlan 10","interface range g0/3 - 4","switchport mode access","switchport access vlan 20","interface range g0/5 - 6","switchport mode access","switchport access vlan 30","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = [];
        e.exec = line => { const o = run(line); if (typeof o==="string" && /IP-Address/.test(o)) e.seen.push({brief:true, v30updown:/Vlan30\s+192\.168\.30\.1\s+YES manual up\s+down/.test(o)}); return o; }; }},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:620, y:30},
    {id:"pc1", kind:"pc", label:"PC1", x:180, y:300, ip:"192.168.10.11", mask:"255.255.255.0", gw:"192.168.10.1", mac:"a4bb.6d10.0011"},
    {id:"pc2", kind:"pc", label:"PC2", x:360, y:300, ip:"192.168.20.21", mask:"255.255.255.0", gw:"192.168.20.1", mac:"a4bb.6d20.0021"},
    {id:"pc3", kind:"pc", label:"PC3", x:560, y:300, ip:"192.168.30.31", mask:"255.255.255.0", gw:"192.168.30.1", mac:"a4bb.6d30.0031"},
  ],
  cables:[ {type:"cat6", a:"edge:g0", b:"core:g8"}, {type:"cat6", a:"pc1:eth", b:"core:g1"}, {type:"cat6", a:"pc2:eth", b:"core:g3"}, {type:"console", a:"lap:usb", b:"core:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Console into CORE-SW1 from the laptop", done:B=>Bench.consoleOk(B,"core")},
    {text:"Create the gateways: <code>interface vlan 10</code> → <code>ip address 192.168.10.1 255.255.255.0</code> → <code>no shutdown</code>, and the same for <code>vlan 20</code> with <code>192.168.20.1</code>", done:B=>{ const I = B.devs.core.env.intfs, a = I.Vlan10||{}, b = I.Vlan20||{}; return a.ip==="192.168.10.1" && !a.shut && b.ip==="192.168.20.1" && !b.shut; }},
    {text:"From PC1, <code>ping 192.168.10.1</code> — the SVI answers as a gateway even without routing", done:B=>Bench.pinged(B,"pc1","192.168.10.1")},
    {text:"From PC1, <code>ping 192.168.20.21</code> (PC2) — it times out. The log says why", done:B=>Bench.tried(B,"pc1",/^ping\s+192\.168\.20\.21$/)},
    {text:"Turn routing on: <code>conf t</code> → <code>ip routing</code>", done:B=>B.devs.core.env.ipRouting===true},
    {text:"Ping PC2 from PC1 again — TTL=127, and in the log the packet never leaves the switch: routed from Vlan10 to Vlan20 inside it", done:B=>Bench.pinged(B,"pc1","192.168.20.21")},
    {text:"Routed uplink: <code>interface g0/8</code> → <code>no switchport</code> → <code>ip address 10.0.0.2 255.255.255.252</code>", done:B=>{ const i = B.devs.core.env.intfs["GigabitEthernet0/8"]; return i.mode==="routed" && i.ip==="10.0.0.2"; }},
    {text:"Default route: <code>ip route 0.0.0.0 0.0.0.0 10.0.0.1</code>", done:B=>B.devs.core.env.routes.some(r=>r.net==="0.0.0.0" && r.mask==="0.0.0.0" && r.nh==="10.0.0.1")},
    {text:"From PC1, <code>ping 203.0.113.1</code> (the internet side of EDGE-R1)", done:B=>Bench.pinged(B,"pc1","203.0.113.1")},
    {text:"Create <code>interface vlan 30</code> with <code>192.168.30.1 255.255.255.0</code> and <code>no shutdown</code>, then <code>show ip interface brief</code> — Vlan30 is <b>up/down</b>: no live port in VLAN 30 yet", done:B=>B.devs.core.env.seen.some(s=>s.brief && s.v30updown)},
    {text:"Plug PC3 into CORE-SW1 port 5 (VLAN 30) with a Cat6 cable, check Vlan30 is now up/up, and <code>ping 203.0.113.1</code> from PC3", done:B=>Bench.pinged(B,"pc3","203.0.113.1")},
  ],
  win:"You replaced router-on-a-stick with a Layer 3 switch: SVIs as gateways, ip routing between them, a routed uplink with a default route — and you watched an SVI wait for its first live port before coming up.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","conf t"],
    ["term","interface vlan 10"],["term","ip address 192.168.10.1 255.255.255.0"],["term","no shutdown"],
    ["term","interface vlan 20"],["term","ip address 192.168.20.1 255.255.255.0"],["term","no shutdown"],["term","end"],
    ["pc","pc1","ping 192.168.10.1"],["pc","pc1","ping 192.168.20.21"],
    ["term","conf t"],["term","ip routing"],["term","end"],["pc","pc1","ping 192.168.20.21"],
    ["term","conf t"],["term","interface g0/8"],["term","no switchport"],["term","ip address 10.0.0.2 255.255.255.252"],["term","exit"],["term","ip route 0.0.0.0 0.0.0.0 10.0.0.1"],["term","end"],
    ["pc","pc1","ping 203.0.113.1"],
    ["term","conf t"],["term","interface vlan 30"],["term","ip address 192.168.30.1 255.255.255.0"],["term","no shutdown"],["term","end"],["term","show ip interface brief"],
    ["plug","cat6","pc3:eth","core:g5"],["term","show ip interface brief"],["pc","pc3","ping 203.0.113.1"]]})}
${K.hint(`<code>% Invalid input</code> on the IP address for <code>g0/8</code>? It's still a switch port — <code>no switchport</code> first. Internet ping fails? Check <code>show ip route</code> says <code>Gateway of last resort is 10.0.0.1</code>.`)}
<p>Compare the logs. With router-on-a-stick each echo crossed the trunk twice each way. Here: <i>&ldquo;CORE-SW1 (Layer 3 switch) received it on Vlan10, decrements TTL to 127 and routes it between VLANs&rdquo;</i>, and the frame goes straight out port 3. The ping to 203.0.113.1 shows <code>TTL=254</code>: the router's reply starts at 255 and crosses CORE-SW1.</p>
${K.out(`CORE-SW1#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       O - OSPF, IA - OSPF inter area, * - candidate default

Gateway of last resort is 10.0.0.1 to network 0.0.0.0

S*       0.0.0.0/0 [1/0] via 10.0.0.1
      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C        10.0.0.0/30 is directly connected, GigabitEthernet0/8
L        10.0.0.2/32 is directly connected, GigabitEthernet0/8
      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, Vlan10
L        192.168.10.1/32 is directly connected, Vlan10
      192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.20.0/24 is directly connected, Vlan20
L        192.168.20.1/32 is directly connected, Vlan20
      192.168.30.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.30.0/24 is directly connected, Vlan30
L        192.168.30.1/32 is directly connected, Vlan30`, "The Layer 3 switch's routing table at the end of the bench.")}
<ul>
<li><b>S* 0.0.0.0/0</b> — the default route, so the gateway of last resort is set.</li>
<li><b>C 10.0.0.0/30 … GigabitEthernet0/8</b> — the routed port: a physical interface, not a VLAN.</li>
<li><b>C … Vlan10/20/30</b> — one connected route per SVI. Vlan30's appeared only when PC3 brought the SVI up.</li>
</ul>
${K.check({q:"On a Layer 3 switch, hosts in VLAN 10 and VLAN 20 can each ping their own SVI gateway but not each other. Both SVIs are up/up, and show ip route prints \"Default gateway is not set\" and a host table instead of a routing table. What is the most likely missing command?", o:["switchport mode trunk on the access ports","ip routing","no switchport on the SVIs","encapsulation dot1Q on the SVIs"], a:1, why:"Answering for its own SVIs needs no routing; forwarding between them needs ip routing. Without it the switch acts as a host, which is why show ip route shows a default-gateway line and host table rather than connected routes. SVIs never take no switchport or encapsulation."})}

<h2>Choosing, verifying and troubleshooting</h2>
<h3>Which design, when</h3>
${K.when([
  ["Router interface per VLAN","2–3 VLANs, spare router ports, labs","Simple: no trunking","You'll add VLANs — each costs a router and a switch port"],
  ["Router-on-a-stick","Small branches: a few VLANs, light traffic between them","Cheap: one port, one trunk, many VLANs","Heavy inter-VLAN traffic — one link and the router CPU carry it twice"],
  ["Layer 3 switch (SVIs)","Campus or busy office: many VLANs, servers in their own VLANs","Hardware routing at line rate; no trip over a trunk","A tiny site where one router already does everything"],
], "Three inter-VLAN routing designs")}
<p>The router doesn't disappear. Most campus Layer 3 switches don't do the edge jobs a router is bought for — ${K.g("NAT","Network Address Translation: lets private addresses share a public address to reach the internet (later module).")}, VPNs, ISP-facing WAN interfaces — so it stays at the edge on a routed link, as on the bench.</p>
${K.myth([
  ["Router-on-a-stick routing happens in the switch.","The switch only tags and untags. Every inter-VLAN packet goes up the trunk to the router and back down — that is why the link is the bottleneck."],
  ["The subinterface number decides the VLAN.","Only <code>encapsulation dot1Q N</code> does. <code>Gi0/0.30</code> with <code>encapsulation dot1Q 3</code> is in VLAN 3. Matching numbers are a convention, not a rule."],
  ["If an SVI is configured, it is up.","It stays up/down until its VLAN exists and has an active port — and even up/up SVIs don't route to each other without <code>ip routing</code>."],
])}
<h3>Verification: four commands, four questions</h3>
<p>Check in the order the packet travels. Each command answers one question:</p>
<div class="tablewrap"><table>
<tr><th>Command</th><th>Where</th><th>Question it answers</th></tr>
<tr><td><code>show vlan brief</code></td><td>switch</td><td>Does the VLAN exist, and is the host's access port in it? (Trunk ports are <b>not</b> listed here.)</td></tr>
<tr><td><code>show interfaces trunk</code></td><td>switch</td><td>Is the port to the router trunking? Is the VLAN allowed, active and forwarding on it? Which native VLAN?</td></tr>
<tr><td><code>show ip interface brief</code></td><td>router / L3 switch</td><td>Is each subinterface or SVI up/up with the right gateway address?</td></tr>
<tr><td><code>show ip route</code></td><td>router / L3 switch</td><td>Is there a connected route for every VLAN subnet (and a default route out)?</td></tr>
</table></div>
<p>Plus <code>show running-config</code> on the router for the <code>encapsulation dot1Q</code> numbers, and <code>ipconfig</code> on the PC for its gateway.</p>
${K.out(`SW1#show interfaces trunk
Port        Mode             Encapsulation  Status        Native vlan
Gi0/8       on               802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/8       1-4094

Port        Vlans allowed and active in management domain
Gi0/8       1,10,20

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/8       1,10,20`, "The ROAS bench's switch after the fix.")}
<ul>
<li><b>Mode on</b> — static <code>switchport mode trunk</code>: no negotiation, which is what a router needs.</li>
<li><b>Native vlan 1</b> — must match the router's native subinterface (or physical interface).</li>
<li><b>Allowed / active / forwarding</b> — every routed VLAN must appear in all three lines, or it never reaches the router.</li>
</ul>
<h3>The common faults</h3>
${K.q({type:"match", q:"Match each fault with what you'd see.", pairs:[
  ["Switch port to the router left at dynamic auto","show interfaces trunk on the switch lists nothing"],
  ["Subinterface has the wrong encapsulation dot1Q number","Subinterface up/up with the right IP, but hosts can't ARP for the gateway"],
  ["VLAN 30 missing from switchport trunk allowed vlan","Trunk is up, but VLAN 30 is absent from its allowed list"],
  ["ip routing missing on the Layer 3 switch","Hosts ping their own SVI but nothing in another VLAN"],
  ["No active port in VLAN 30","Vlan30 shows up/down in show ip interface brief"],
  ["Host default gateway typed as another VLAN's address","Host reaches its own VLAN but nothing beyond it"]],
  why:"Each fault breaks a different step of the packet's journey, so each shows up in a different command. Work in the order the packet travels: host settings, access port and VLAN, trunk, gateway interface, routing."})}
${K.dodont([
  "Configure <code>switchport mode trunk</code> (and <code>switchport nonegotiate</code>) on every switch port facing a router.",
  "Number subinterfaces after their VLAN: <code>Gi0/0.30</code> ↔ <code>encapsulation dot1Q 30</code>.",
  "Add a new VLAN in every place at once: the VLAN, the access ports, the trunk allowed list, the subinterface or SVI.",
],[
  "Don't trust <code>up/up</code> on a subinterface to mean the VLAN is right — read the encapsulation.",
  "Don't run both designs as gateways for the same VLAN — two devices answering for 192.168.10.1 is an outage.",
])}
${K.mistake(`Setting a host's default gateway to the router's address in a <i>different</i> VLAN — for example a VLAN 20 PC (192.168.20.25/24) with gateway 192.168.10.1. The gateway must be inside the host's own subnet; Windows warns about it, and the PC can only reach its own VLAN.`)}

${K.job("“The new VLAN 30 can't get online” — a branch, a typo and a subinterface",`
<p><b>The ticket.</b> &ldquo;Ikeja branch. We added VLAN 30 for the new self-service kiosks yesterday. Kiosks can't reach the card portal on the internet. Staff and tellers are fine.&rdquo; The branch uses router-on-a-stick: an ISR router (real naming <code>Gi0/0/0</code>) trunked to the access switch.</p>
<p><b>Questions first.</b> &ldquo;Can a kiosk ping anything at all?&rdquo; — <i>&ldquo;Another kiosk, yes. Not its gateway.&rdquo;</i> &ldquo;What gateway does it have?&rdquo; — <i>&ldquo;192.168.30.1.&rdquo;</i> So VLAN 30 works at Layer 2; the fault lies between the access port and the router's VLAN 30 interface.</p>
<p><b>Checks, in packet order.</b> Switch: <code>show vlan brief</code> — VLAN 30 exists on Gi1/0/21–22; <code>show interfaces trunk</code> — Gi1/0/48 trunks and allows, activates and forwards 30. The switch is innocent. Router:</p>
${K.out(`IKJ-R1#show ip interface brief | include 0/0/0
GigabitEthernet0/0/0   unassigned      YES NVRAM  up                    up
GigabitEthernet0/0/0.10 192.168.10.1    YES NVRAM  up                    up
GigabitEthernet0/0/0.20 192.168.20.1    YES NVRAM  up                    up
GigabitEthernet0/0/0.30 192.168.30.1    YES manual up                    up

IKJ-R1#show running-config interface GigabitEthernet0/0/0.30
Building configuration...

Current configuration : 116 bytes
!
interface GigabitEthernet0/0/0.30
 description KIOSKS
 encapsulation dot1Q 3
 ip address 192.168.30.1 255.255.255.0
end`, "Everything is up/up with the right address — but the subinterface is tagged for VLAN 3, not 30.")}
<p>There it is: <code>encapsulation dot1Q 3</code> — a dropped zero. The router listens for tag 3, the switch sends tag 30, and the kiosks' ARPs are never answered. Nothing logs an error: each device is consistent with itself, and <code>show ip route</code> even lists 192.168.30.0/24 as connected.</p>
<p><b>The fix.</b> In an agreed five-minute window: <code>interface g0/0/0.30</code> → <code>encapsulation dot1Q 30</code>, re-apply <code>ip address 192.168.30.1 255.255.255.0</code> and confirm it with <code>show ip interface brief</code> (never assume the address survived an encapsulation change), then save. From a kiosk: gateway replies, portal replies, app connects.</p>
<p><b>What you say.</b> &ldquo;The router had the kiosks' network under the wrong number — 3 instead of 30 — so their traffic never reached it. It's corrected and tested; staff and tellers were never affected.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;IKJ kiosks (VLAN 30) no gateway. Switch OK: VLAN 30 on Gi1/0/21–22, trunk Gi1/0/48 allows/forwards 30. Router Gi0/0/0.30 up/up but encapsulation dot1Q 3 (typo, change CHG-2291). Corrected to 30, IP re-applied, saved. Verified gateway + portal from both kiosks. Suggest peer check of encapsulation in VLAN changes. 25 min.&rdquo;</i></p>`)}
${K.tip(`VLAN can't reach its ROAS gateway? Line up three numbers: the access port's VLAN, the trunk's allowed list and the subinterface's <code>encapsulation dot1Q</code>. They must match.`)}

${K.case("From router-on-a-stick to a Layer 3 core: an MSP migration in Lagos",`
<p>A logistics company in Apapa, Lagos, had grown to three floors on the router-on-a-stick design its MSP installed years earlier: one ISR router, one 1 Gb/s trunk, seven VLANs. Every evening the warehouse system froze while backups ran from the server VLAN to storage in the staff VLAN. The router's trunk was near its limit and its CPU was high: every backup packet crossed the trunk twice and shared it with every scanner, call and download. The design, not a fault, was the problem.</p>
<p><b>The design.</b> A Layer 3 core switch went in between router and access switches: <code>ip routing</code> and one SVI per VLAN with the <b>same IP</b> the subinterface had used, so no host needed a new gateway. A routed /30 link ran to the router, with a default route on the core and static routes back on the router.</p>
<p><b>The cutover.</b> Two devices owning one gateway address is an outage, so order was everything. On a Saturday night, after a UPS check, all was pre-built with the SVIs shut. Then one VLAN at a time, guest Wi-Fi first: shut the subinterface, <code>no shutdown</code> the SVI, test. Rollback: the same two commands reversed.</p>
<p><b>The result.</b> Backups ran inside the core at line rate and the freezes stopped. The lessons: <b>ROAS suits small sites that busy ones outgrow</b>; <b>reuse gateway IPs so hosts never notice</b>; <b>move one VLAN at a time</b>; and <b>remember the return path</b> — the first VLAN failed until the router's static route back to the core was added.</p>`)}
${K.exam(`Know the exact commands: <code>encapsulation dot1Q 10</code>, <code>encapsulation dot1Q 99 native</code>, <code>ip routing</code>, <code>interface vlan 10</code>, <code>no switchport</code>. Trap answers include <code>switchport mode trunk</code> on the <i>router</i>, <code>encapsulation dot1Q</code> on an SVI, and assuming DTP will form the trunk to a router.`)}
${K.check({q:"An office has 40 users, three VLANs and very little traffic between them; one ISR router already handles the internet connection and has one free port. Which design is the sensible choice?", o:["Buy a Layer 3 core switch for inter-VLAN routing","Router-on-a-stick on the existing router","One router interface per VLAN","No routing: put all three VLANs in one subnet"], a:1, why:"Light inter-VLAN traffic and an existing router: ROAS is cheap and enough. A Layer 3 switch pays off when inter-VLAN traffic is heavy."})}

<h2>Interview corner</h2>
${K.hint(`Both halves (static trunk; subinterfaces), then the path and the bottleneck.`)}
${K.reveal("“How does router-on-a-stick work?”",`<p>"One router interface connects to an 802.1Q trunk. I create a subinterface per VLAN — say Gi0/0.10 with encapsulation dot1Q 10 and 192.168.10.1/24, the VLAN's gateway. The switch port must be switchport mode trunk because routers don't speak DTP. A packet from VLAN 10 to 20 goes up the trunk tagged 10, is routed with the TTL lowered, and comes back down tagged 20. It's cheap and works well for small sites, but every inter-VLAN packet crosses the trunk twice, so that link and the router's CPU are the bottleneck."</p>`)}
${K.hint(`Reasons, trade-offs, and how router and switch work together.`)}
${K.reveal("“When would you use a Layer 3 switch instead of router-on-a-stick?”",`<p>"When there's heavy traffic between VLANs or many VLANs — a campus, servers in their own VLAN, backups between departments. It routes between SVIs in hardware at line rate with no trip over one trunk, and scales with more uplinks. It usually doesn't do NAT, VPN or WAN, so I keep a router at the edge on a routed link, with a default route from the core. For a small branch with light inter-VLAN traffic, router-on-a-stick on the existing router is cheaper and perfectly good."</p>`)}
${K.hint(`Think autostate: three conditions. Then the separate question of routing.`)}
${K.reveal("“You've created an SVI and it shows up/down. What do you check?”",`<p>"Up/down means the switch doesn't see the VLAN as active. I check the VLAN exists in show vlan brief, that a port carrying it is up and forwarding — an access port with a device, or a trunk that allows it — and that the SVI isn't shut. If it's up/up but hosts can't reach other VLANs, I check ip routing and the connected route in show ip route."</p>`)}

${K.recap([
  "A VLAN is a subnet; crossing VLANs is routing, and each VLAN needs a gateway in its own subnet.",
  "Three designs: a router interface per VLAN (legacy), router-on-a-stick (one trunk, a subinterface per VLAN), a Layer 3 switch (an SVI per VLAN + ip routing).",
  "ROAS: interface g0/0.10 → encapsulation dot1Q 10 → ip address (encapsulation first); native VLAN with encapsulation dot1Q N native; parent interface no shutdown.",
  "The switch port to a router must be switchport mode trunk — routers don't speak DTP, so dynamic auto stays access.",
  "On ROAS a frame goes up the trunk tagged with the source VLAN and down tagged with the destination VLAN; the router rewrites the MACs and lowers the TTL.",
  "Layer 3 switch: ip routing, interface vlan N as gateways, no switchport for routed uplinks, a default route to the edge — routed in hardware at line rate.",
  "An SVI is up only when its VLAN exists, has an active port, and isn't shut.",
  "Verify with show vlan brief, show interfaces trunk, show ip interface brief, show ip route — and read encapsulation dot1Q in the running-config.",
])}
${K.next(`<b>Lesson 4 — Loops and Spanning Tree.</b> You've connected VLANs to each other; now connect switches to each other with more than one cable for redundancy — and see why that, without Spanning Tree, brings the whole network down in seconds. You'll watch a real broadcast storm on the bench, then elect a root bridge.`)}
`,
quiz:[
  {lvl:1, q:"Why does a PC in VLAN 10 need a router (or Layer 3 switch) to reach a PC in VLAN 20?", o:["Because the switch's MAC table is full","Because each VLAN is a separate broadcast domain and subnet, and a Layer 2 switch never forwards frames between VLANs","Because VLAN 20 uses a different cable type","Because PCs can only send to their default gateway"], a:1, why:"A VLAN is its own broadcast domain with its own subnet. A Layer 2 switch forwards only within the VLAN a frame arrived in, so moving traffic between VLANs needs routing."},
  {lvl:1, q:"Which router subinterface command assigns the subinterface to VLAN 30?", o:["switchport access vlan 30","vlan 30","encapsulation dot1Q 30","ip vlan 30"], a:2, why:"encapsulation dot1Q 30 tells the router that frames tagged 30 belong to this subinterface and tags frames it sends with 30. switchport commands don't exist on a router interface."},
  {lvl:2, q:"A router's Gi0/0 subinterfaces are correctly configured for VLANs 10 and 20. The switch port Gi0/24 that connects to it is in its factory default state. What happens?", o:["The switch and router negotiate a trunk with DTP and routing works","Gi0/24 stays an access port in VLAN 1, so VLAN 10 and 20 traffic never reaches the router","Gi0/24 becomes a trunk but only for VLAN 1","The router err-disables the switch port"], a:1, why:"Catalyst ports default to dynamic auto and only trunk if the far end asks with DTP. Routers never send DTP, so the port stays an access port in VLAN 1. The fix is switchport mode trunk on Gi0/24."},
  {lvl:2, type:"fill", q:"On a Layer 3 switch, both SVIs are up/up and hosts can ping their own gateway, but nothing is routed between VLAN 10 and VLAN 20. Which global configuration command fixes it?", fields:[{label:"Command", a:["ip routing"], ios:true}], why:"An SVI answers for its own address without routing, but forwarding packets between SVIs requires ip routing in global configuration."},
  {lvl:1, type:"fill", q:"Which interface command turns a Layer 3 switch port into a routed port so you can give it an IP address?", fields:[{label:"Command", a:["no switchport"], ios:true}], why:"no switchport removes the port from Layer 2 switching (no VLAN, no STP) and makes it behave like a router interface. IOS rejects ip address on a normal switch port."},
  {lvl:2, type:"multi", q:"Which three conditions must be true for an SVI (interface vlan 30) on a Catalyst switch to be up/up? (Choose three.)", o:["VLAN 30 exists in the switch's VLAN database","At least one port carrying VLAN 30 is up and forwarding","The SVI is not administratively shut down","ip routing is enabled","The SVI has encapsulation dot1Q 30 configured"], a:[0,1,2], why:"Autostate keeps an SVI down until its VLAN exists and has an active, forwarding port (access or trunk), and the SVI must not be shut. ip routing controls routing between SVIs, not their state; encapsulation dot1Q is a router subinterface command."},
  {lvl:1, type:"order", q:"Put these router-on-a-stick steps for VLAN 10 in the correct order.", items:["interface g0/0.10","encapsulation dot1Q 10","ip address 192.168.10.1 255.255.255.0","Set VLAN 10 hosts' default gateway to 192.168.10.1 and ping it"], why:"Enter the subinterface, set the 802.1Q VLAN, then the IP address — IOS rejects an IP address on a LAN subinterface without an encapsulation. Then point the hosts at the gateway and test."},
  {lvl:2, type:"match", q:"Match each verification command with the question it answers in an inter-VLAN routing problem.", pairs:[["show vlan brief","Does the VLAN exist and is the host's access port in it?"],["show interfaces trunk","Is the link to the router trunking and is the VLAN allowed and forwarding?"],["show ip interface brief","Is each subinterface or SVI up/up with the right address?"],["show ip route","Is there a connected route for each VLAN subnet?"]], why:"Each command checks one step of the packet's path: the VLAN and access port, the trunk, the gateway interface, and the routing table. Note that show vlan brief does not list trunk ports."},
  {lvl:2, q:"Users in VLAN 30 can't reach their gateway 192.168.30.1 on the router-on-a-stick router; VLANs 10 and 20 work. Based on the exhibit from the switch, what is the fix?", ex:"SW1#show interfaces trunk\nPort        Mode             Encapsulation  Status        Native vlan\nGi0/8       on               802.1q         trunking      1\n\nPort        Vlans allowed on trunk\nGi0/8       1,10,20\n\nPort        Vlans allowed and active in management domain\nGi0/8       1,10,20\n\nPort        Vlans in spanning tree forwarding state and not pruned\nGi0/8       1,10,20", o:["switchport mode trunk on Gi0/8","switchport trunk allowed vlan add 30 on Gi0/8","switchport trunk native vlan 30 on Gi0/8","switchport trunk allowed vlan 30 on Gi0/8"], a:1, why:"The trunk is up but VLAN 30 isn't in the allowed list, so VLAN 30 frames are never sent to the router. allowed vlan add 30 adds it. allowed vlan 30 without add would replace the list and cut off VLANs 10 and 20."},
  {lvl:3, q:"After a change, VLAN 40 hosts can ping each other but not their gateway 192.168.40.1. The switch shows VLAN 40 on the hosts' access ports and allowed and forwarding on the trunk to the router. Based on the exhibit from the router, what is wrong?", ex:"R1#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     unassigned      YES unset  up                    up\nGigabitEthernet0/0.10  192.168.10.1    YES manual up                    up\nGigabitEthernet0/0.40  192.168.40.1    YES manual up                    up\n\nR1#show running-config | section 0/0.40\ninterface GigabitEthernet0/0.40\n encapsulation dot1Q 41\n ip address 192.168.40.1 255.255.255.0", o:["The subinterface is down","The subinterface listens for VLAN 41 instead of VLAN 40, so frames tagged 40 are not accepted","The subinterface number must be 41","The parent interface needs an IP address in 192.168.40.0/24"], a:1, why:"Only encapsulation dot1Q decides the VLAN. Gi0/0.40 is tagged for VLAN 41, so the router ignores frames tagged 40 and never answers the hosts' ARPs. The interface still shows up/up. Fix: encapsulation dot1Q 40."},
  {lvl:3, q:"A 350-user office uses router-on-a-stick on a 1 Gb/s trunk with eight VLANs. File transfers between the server VLAN and user VLANs are slow at busy times, the router's CPU is high and the trunk is near its limit. Internet use is light. What is the best design change?", o:["Add more subinterfaces on the router","Change the native VLAN to the server VLAN","Move inter-VLAN routing to a Layer 3 switch with SVIs, and connect the router to it by a routed link for internet traffic","Replace the trunk with eight access links to eight router subinterfaces"], a:2, why:"The bottleneck is the single trunk and the router CPU carrying every inter-VLAN packet twice. A Layer 3 switch routes between VLANs in hardware at line rate; the router stays at the edge for internet traffic on a routed link with a default route from the core."},
  {lvl:2, q:"With router-on-a-stick, PC1 in VLAN 10 sends one packet to PC2 in VLAN 20. How many times does that packet cross the trunk between the switch and the router, and with which tags?", o:["Once, tagged 10","Once, tagged 20","Twice: up tagged 10, then down tagged 20","Twice, untagged both times"], a:2, why:"The switch sends it up the trunk tagged with the source VLAN (10); the router routes it and sends it back down the same trunk tagged with the destination VLAN (20). That double trip is why ROAS trunks become bottlenecks."},
  {lvl:3, q:"A new guest VLAN 50 has been added to a Layer 3 switch, but guest laptops on the new Wi-Fi access point can't get online. Based on the exhibit, what is the cause?", ex:"CORE-SW1#show ip interface brief | include Vlan\nVlan1                  unassigned      YES unset  administratively down down\nVlan10                 192.168.10.1    YES manual up                    up\nVlan50                 192.168.50.1    YES manual up                    down\n\nCORE-SW1#show vlan brief | include 50\n50   GUEST                            active", o:["ip routing is disabled","The SVI is administratively shut down","VLAN 50 has no active port: the access point's port isn't carrying VLAN 50, so the SVI's line protocol stays down","The SVI needs no switchport"], a:2, why:"Vlan50 is up/down: autostate keeps the SVI's line protocol down until a port carrying VLAN 50 is up and forwarding, and VLAN 50 lists no access ports. Assign the access point's port to VLAN 50 (or, if the AP is on a trunk — trunks never appear in show vlan brief — allow VLAN 50 on that trunk). ip routing doesn't affect an SVI's up/down state, and the SVI isn't shut (status is up)."},
  {lvl:2, q:"A PC in VLAN 20 has IP 192.168.20.25/24 and default gateway 192.168.10.1. It can reach other VLAN 20 hosts but nothing in other VLANs. The router-on-a-stick configuration is correct. What is the fix?", o:["Change the PC's mask to /16","Set the PC's default gateway to 192.168.20.1, the VLAN 20 subinterface","Move the PC to VLAN 10","Add encapsulation dot1Q 10 to the VLAN 20 subinterface"], a:1, why:"A default gateway must be in the host's own subnet. 192.168.10.1 is VLAN 10's gateway and unreachable from 192.168.20.0/24, so the PC can't send anything off its subnet. Use 192.168.20.1."},
  {lvl:1, q:"On a router-on-a-stick router, what does encapsulation dot1Q 99 native do on subinterface Gi0/0.99?", o:["Tags every frame on the trunk with VLAN 99","Makes the subinterface accept and send VLAN 99 frames untagged, matching a switch trunk whose native VLAN is 99","Disables 802.1Q on the trunk","Makes VLAN 99 the management VLAN of the switch"], a:1, why:"The native VLAN is carried untagged. Marking the subinterface native tells the router that untagged frames belong to it, matching switchport trunk native vlan 99 on the switch."},
  {lvl:2, type:"multi", q:"Which two are advantages of routing between VLANs on a Layer 3 switch rather than router-on-a-stick? (Choose two.)", o:["Packets are routed in hardware at or near line rate","Inter-VLAN traffic no longer has to cross a single trunk to a router and back","It provides NAT and VPN for internet access, so no router is needed","It needs no IP addresses on the VLANs","It is always cheaper than using the existing router"], a:[0,1], why:"A Layer 3 switch routes between SVIs in hardware and removes the trip over one trunk. Most campus Layer 3 switches don't replace the edge router's NAT/VPN/WAN role, SVIs still need gateway addresses, and a Layer 3 switch usually costs more than reusing an existing router."},
],
cards:[
  {f:"Why do VLANs need a router to talk?", b:"Each VLAN is a separate broadcast domain and IP subnet. A Layer 2 switch forwards only inside a VLAN, so traffic between VLANs must be routed by a router or Layer 3 switch."},
  {f:"Three inter-VLAN routing designs", b:"A router interface per VLAN (legacy, doesn't scale), router-on-a-stick (one trunk, a subinterface per VLAN), Layer 3 switch (an SVI per VLAN plus ip routing)."},
  {f:"Router-on-a-stick subinterface config", b:"interface g0/0.10, encapsulation dot1Q 10, ip address 192.168.10.1 255.255.255.0. Encapsulation before IP. The parent interface needs no shutdown."},
  {f:"Native VLAN on a ROAS router", b:"encapsulation dot1Q N native on a subinterface (or the IP on the physical interface). Must match switchport trunk native vlan N on the switch."},
  {f:"Why must the switch port to a router be switchport mode trunk?", b:"Routers don't speak DTP. A dynamic auto port waits for DTP that never comes and stays an access port in VLAN 1."},
  {f:"ROAS packet path VLAN 10 to VLAN 20", b:"Up the trunk tagged 10, routed on the router (new MACs, TTL minus 1), back down the same trunk tagged 20. The trunk is crossed twice."},
  {f:"TTL=127 in ping replies from another VLAN", b:"Windows starts at 128; one router hop lowered it by one. Proof that a router is in the path."},
  {f:"Layer 3 switch config", b:"ip routing; interface vlan N with ip address and no shutdown for each VLAN; no switchport plus ip address for a routed uplink; ip route 0.0.0.0 0.0.0.0 next-hop."},
  {f:"When is an SVI up/up?", b:"The VLAN exists, at least one port carrying it is up and forwarding, and the SVI isn't shut. Otherwise it shows up/down (or administratively down)."},
  {f:"no switchport", b:"Makes a Layer 3 switch port a routed port: no VLAN, no STP, its own IP address, like a router interface."},
  {f:"ROAS vs Layer 3 switch", b:"ROAS: cheap, fine for small sites, but one trunk and the router CPU carry all inter-VLAN traffic twice. Layer 3 switch: hardware routing at line rate, scales; router stays at the edge."},
  {f:"Subinterface up/up but hosts can't reach the gateway", b:"Check the encapsulation dot1Q number in the running-config — the subinterface number doesn't set the VLAN. Then the trunk allowed list and the access port VLAN."},
  {f:"Four inter-VLAN verification commands", b:"show vlan brief (VLAN and access ports), show interfaces trunk (trunking, allowed, forwarding), show ip interface brief (gateway interfaces), show ip route (connected route per VLAN)."},
],
});
// ---------- Module 4 · Lesson 4 ----------
L.push({
id:"stp-basics", mins:85, level:"Beginner+ · builds on Module 2 and Module 4 lessons 1–3",
t:"Loops and Spanning Tree: broadcast storms, BPDUs, the root bridge, costs, port roles and states",
html:`
${K.goals([
  "Explain why a Layer 2 loop turns one broadcast into a storm, and why IP's TTL can't help.",
  "Work out a bridge ID and elect the root bridge.",
  "Run a full election on paper: root ports, designated ports and the blocked port.",
  "Read <code>show spanning-tree</code> and find the root, the root port and every blocked port.",
  "Describe the 802.1D states and timers, what Rapid STP changed, and what PVST+ means.",
])}
${K.pre(["Module 1: Ethernet frame fields and the first IOS session.","Module 2 lesson 2: MAC learning, flooding and the "+K.g("MACFLAP","Short for MAC flapping: the log message (%SW_MATM-4-MACFLAP_NOTIF) a Catalyst writes when one MAC address keeps jumping between two ports — the classic sign of a loop.")+" message.","Module 4 lessons 1–3: VLANs, 802.1Q trunks and inter-VLAN routing."])}

<h2>Why this matters at work</h2>
<p>A logistics company in Apapa, Lagos, adds a second cable between its warehouse switch and its office switch, so a single damaged cable can't cut the warehouse off. The junior who patched it rings the senior engineer: &ldquo;One of the new ports is amber, not green. Is it faulty?&rdquo; It isn't. The switches have agreed that one of the two paths must stay quiet, and they are holding it in reserve. If the first cable fails, the amber port turns green by itself.</p>
<p>Across town, a call centre's switch had that protection turned off years ago. At 2 a.m. a supervisor plugged a loose patch lead from one wall socket into the next, and within seconds every phone and PC on the floor froze. The difference between these two stories is <b>Spanning Tree</b>, and this lesson teaches you to explain it, read it and predict it.</p>

<h2>Redundancy, and why a Layer 2 loop is a disaster</h2>
<p>One uplink per floor switch is a ${K.g("single point of failure","One part whose failure takes a whole service down.")}: cut it and the floor is offline. So we build ${K.g("redundancy","Extra links or devices so one failure doesn't stop the network.")}: a second uplink, usually making a triangle or square of switches.</p>
<p>Routers cope with redundant paths, because every router decrements the IP ${K.g("TTL","Time To Live: an IP header field each router decrements; at 0 the packet is dropped.")}, so a looping packet dies. Switches are different. In Module 2 you saw that a switch <b>floods</b> broadcasts and unknown unicasts out of every port except the one they came in on. Add a loop and nothing ever stops the flooding.</p>
<h3>Following one broadcast around a triangle</h3>
${K.svg("0 0 720 350",
  K.dev("switch",360,50,"SW1")+K.dev("switch",160,200,"SW2")+K.dev("switch",560,200,"SW3")+K.dev("pc",60,290,"PC1","sends one ARP")+
  K.link(338,62,182,188)+K.link(382,62,538,188)+K.link(188,200,532,200)+K.link(140,212,72,272)+
  K.arrow(200,170,320,88,"copy 1",true)+K.arrow(400,88,520,170,"copy 1",true)+K.arrow(510,218,210,218,"copy 1 again…",true)+
  K.arrow(220,186,500,186,"copy 2")+K.arrow(540,142,420,62,"copy 2")+K.arrow(280,62,160,142,"copy 2")+
  K.band(430,262,270,24,"Dst · Src · Type · Data · FCS","var(--chip)")+
  K.txt(565,304,"no TTL anywhere in the Ethernet header",{c:"bad",s:11,mid:true}),
  "One ARP broadcast from PC1 enters a triangle with nothing blocking. SW2 floods it both ways; each copy is flooded on by the next switch and comes back to where it started — forever, because nothing in an Ethernet frame counts hops.")}
${K.steps([
  ["PC1 sends one broadcast", `<p>An ARP request to <code>ffff.ffff.ffff</code> arrives at SW2.</p>`],
  ["SW2 floods it out both uplinks", `<p>One copy to SW1, one to SW3: <b>two copies</b> now.</p>`],
  ["SW1 and SW3 flood their copies on", `<p>SW1 sends copy 1 to SW3; SW3 sends copy 2 to SW1.</p>`],
  ["The copies come back", `<p>Both copies return to SW2, which has no memory of seeing them, so it floods them again.</p>`],
  ["It never ends", `<p>Each lap takes microseconds, and every new ARP or DHCP broadcast adds two more immortal copies. Within seconds the links are full of repeats.</p>`],
])}
<p>In a triangle the copies circle; in bigger meshes, where a switch has three or more inter-switch links, they <b>multiply</b> every lap. Either way you get a ${K.g("broadcast storm","Flooded frames circling a Layer 2 loop endlessly, filling every link.")}.</p>
<h3>Three things go wrong at once</h3>
<ul>
<li><b>Broadcast storm.</b> Links fill, every host must process every copy, and switch CPUs hit near 100%, so you often can't even SSH to the switch.</li>
<li><b>MAC table instability.</b> SW1 learns PC1's MAC on one port, then the other, thousands of times a second. This ${K.g("MAC flapping","The same MAC learned on one port, then another, rapidly. The classic sign of a loop.")} is logged as <code>%SW_MATM-4-MACFLAP_NOTIF</code> (Module 2), and frames to PC1 go the wrong way half the time.</li>
<li><b>Duplicate frames.</b> A flooded unicast goes both ways round and arrives more than once.</li>
</ul>
<h3>Why the IP TTL doesn't save you</h3>
<p>In Module 1 you took an Ethernet frame apart: destination, source, type, data, FCS. There is no hop count anywhere, so a switch can't tell a new frame from one that has been round ten times. The IP TTL sits inside the data and only routers decrement it; switches never look. And the ARP request that usually starts a storm isn't IP at all. So the loop itself must be prevented.</p>
${K.analogy(`<p>Imagine three friends with the rule &ldquo;forward every WhatsApp message to everyone else&rdquo;. One &ldquo;good morning&rdquo; circles between them forever. The cure: one of them agrees <i>not</i> to forward to one friend, so the paths can't form a circle.</p>`)}
${K.dyk(`Radia Perlman designed the Spanning Tree algorithm at Digital Equipment Corporation in 1985, and wrote a short poem about it, &ldquo;Algorhyme&rdquo;, still quoted in networking classes.`)}
${K.check({q:"A network has a loop between three switches and Spanning Tree is disabled. A PC sends one ARP request. Why doesn't the frame die out after a while?", o:["Switches decrement the IP TTL only on unicast frames","Ethernet frames have no TTL or hop count, and switches flood broadcasts out every other port, so copies circle forever","The FCS keeps changing, so the switches treat each copy as a new frame","ARP requests are sent to the router, which keeps re-sending them"], a:1, why:"Nothing in an Ethernet header counts hops, and switches don't read the IP TTL (an ARP request doesn't even have one). Each switch floods the broadcast again on arrival, so the copies never stop."})}

<h2>Spanning Tree's job: BPDUs and the bridge ID</h2>
<p>${K.g("Spanning Tree Protocol (STP)","IEEE 802.1D: switches agree a loop-free tree of active links and block the redundant ports.")} (IEEE ${K.g("802.1D","The original IEEE standard for Spanning Tree (and for bridges in general). 'Classic STP' means the 802.1D version, with its slow timers.")}) lets the switches agree one loop-free set of links that spans every switch, and put every other redundant port into a <b>blocking</b> state: link up, but no user frames. If an active link fails, STP unblocks a port. The standard calls switches <i>bridges</i>, hence &ldquo;root bridge&rdquo; and &ldquo;bridge ID&rdquo;.</p>
<h3>BPDUs: how switches talk about the tree</h3>
<p>Switches exchange ${K.g("BPDUs","Bridge Protocol Data Units: the STP messages switches exchange.")}, small frames to a multicast MAC (<code>0180.c200.0000</code> for standard STP; Cisco's per-VLAN version uses <code>0100.0ccc.cccd</code>). Each switch reads them and sends its own; they aren't flooded. A BPDU carries:</p>
<ul>
<li><b>Root bridge ID</b>: who the sender thinks the root is.</li>
<li><b>Root path cost</b>: how far the sender is from that root.</li>
<li><b>Sender bridge ID</b> and <b>sender port ID</b>: who sent it, and out of which port.</li>
<li><b>Timers</b>: hello, max age and forward delay (later in this lesson).</li>
</ul>
<p>In classic 802.1D the root sends a BPDU every ${K.g("hello time","How often BPDUs are sent: 2 s by default.")} (2 s) and the others relay it. When BPDUs stop arriving, a switch knows something upstream changed.</p>
<h3>The bridge ID: priority, VLAN and MAC</h3>
<p>Every switch has a ${K.g("bridge ID (BID)","Priority + VLAN (sys-id-ext) + MAC address. Lowest wins.")}; the lowest BID becomes the ${K.g("root bridge","The switch with the lowest bridge ID: the centre of the tree.")}, the centre of the tree.</p>
${K.svg("0 0 720 180",
  K.txt(180,30,"2 bytes: shown as \"Priority\" in IOS",{mid:true,c:"fg",s:11})+K.txt(520,30,"6 bytes",{mid:true,c:"fg",s:11})+
  K.band(20,42,120,34,"priority · 4 bits")+K.band(140,42,200,34,"sys-id-ext · 12 bits")+K.band(340,42,360,34,"switch base MAC address · 48 bits")+
  K.band(20,92,120,30,"32768","var(--panel2)")+K.band(140,92,200,30,"+ 1  (VLAN 1)","var(--panel2)")+K.band(340,92,360,30,"0c75.bd11.0000","var(--panel2)")+
  K.txt(360,150,"Bridge ID for VLAN 1 = 32769 / 0c75.bd11.0000",{mid:true,c:"fg",s:12,b:true})+
  K.txt(360,170,"compare priority first; only if equal, compare MAC — lowest wins",{mid:true,s:11}),
  "The bridge ID. The priority you configure is a multiple of 4096; Cisco adds the VLAN number (the extended system ID) so every VLAN's tree has its own BID.")}
<ul>
<li><b>Priority</b>: default <b>32768</b>, changeable only in steps of <b>4096</b>, because only 4 bits are left for it.</li>
<li><b>${K.g("sys-id-ext","Extended system ID: the VLAN number added to the priority, so each VLAN's tree has its own BID.")}</b> (extended system ID): the VLAN number. Cisco runs one tree per VLAN, so a default switch shows <b>32769</b> in VLAN 1 and <b>32778</b> in VLAN 10.</li>
<li><b>MAC address</b>: the tie-breaker. With all priorities at default, the lowest MAC (often the oldest switch) becomes root, rarely the one you'd choose. Lesson 5 fixes that.</li>
</ul>
<h3>Path cost: how STP measures &ldquo;near the root&rdquo;</h3>
<p>Each port has a ${K.g("port cost","STP's measure of a link; faster links cost less.")} set by its speed. A switch's ${K.g("root path cost","The sum of port costs along a switch's best path to the root. The root's is 0.")} is the sum along its best path: it adds the cost of the port a BPDU <i>arrives on</i> to the cost inside the BPDU. One 1 Gb/s hop from the root = 4; two = 8.</p>
<div class="tablewrap"><table>
<tr><th>Link speed</th><th>STP cost (802.1D short method)</th></tr>
<tr><td>10 Mb/s</td><td>100</td></tr>
<tr><td>100 Mb/s</td><td>19</td></tr>
<tr><td>1 Gb/s</td><td>4</td></tr>
<tr><td>10 Gb/s</td><td>2</td></tr>
</table></div>
<p>A &ldquo;long&rdquo; method with bigger numbers also exists (<code>spanning-tree pathcost method long</code>); the CCNA and this lab use the table above.</p>
${K.remember(`<b>&ldquo;A hundred, nineteen, four, two&rdquo;</b> for <b>ten, a hundred, a gig, ten gig</b>. Faster link, smaller cost. And for the BID: <b>&ldquo;priority first, MAC second, lowest wins.&rdquo;</b>`)}
${K.exam(`Given <code>Priority 32778</code> in VLAN 10, the configured priority is 32768 (subtract the VLAN). &ldquo;Highest priority becomes root&rdquo; is wrong: <b>lowest</b> wins, and priority beats any MAC.`)}
${K.check({q:"Three switches in VLAN 1 show these bridge IDs: SW-A 32769 / 0019.aa00.0001, SW-B 28673 / 00d0.ff00.0009, SW-C 32769 / 0001.0000.0002. Which is the root bridge?", o:["SW-A, the first one installed","SW-B, because its priority value is lowest","SW-C, because its MAC is lowest","None: they must have equal priorities to hold an election"], a:1, why:"Priority is compared before MAC. 28673 (configured 28672 + VLAN 1) is lower than 32769, so SW-B wins even though SW-C has the lowest MAC. MAC only breaks a tie between equal priorities."})}

<h2>The election, step by step: root bridge, root ports, designated ports</h2>
<p>Every STP calculation follows four steps.</p>
${K.steps([
  ["1 · Elect one root bridge", `<p>Each switch first claims to be root; on hearing a lower root BID it accepts that one and relays it. The <b>lowest bridge ID</b> wins, and <b>all the root's ports are designated</b>.</p>`],
  ["2 · Each non-root switch picks one root port", `<p>Its ${K.g("root port","A non-root switch's one best port towards the root. Forwards.")} is its best way to the root: <b>lowest root path cost</b>; if tied, <b>lowest neighbour bridge ID</b>; then <b>lowest neighbour port ID</b>.</p>`],
  ["3 · Each link picks one designated port", `<p>The ${K.g("designated port","On each link, the port on the end closest to the root. Forwards.")} is on the end whose switch has the <b>lowest root path cost</b>, then <b>lowest BID</b>, then <b>lowest port ID</b>. Ports facing PCs are designated: nobody competes.</p>`],
  ["4 · Every other port blocks", `<p>Cisco calls it an ${K.g("alternate port","Lost both elections: discards user frames but still listens to BPDUs, ready to take over.")} (<code>Altn BLK</code> in <code>show spanning-tree</code>: ${K.g("Altn","Short for alternate: the port's role.")} ${K.g("BLK","Short for blocking: the port's state. It drops user frames but still listens to BPDUs. Rapid STP calls the same state discarding.")}). It still hears BPDUs, and only <b>one end</b> of that link blocks.</p>`],
])}
<p>A ${K.g("port ID","Port priority (default 128) + port number, shown as 128.1.")} is shown as <code>128.1</code> for Gi0/1. It only matters when two cables join the same two switches.</p>
${K.remember(`Tie-breakers: <b>Cost → Bridge → Port</b>. And: <b>&ldquo;one root per network, one root port per switch, one designated port per link, the rest block.&rdquo;</b>`)}
${K.q({type:"match", q:"Match each Spanning Tree role with its description.", pairs:[["Root bridge","The switch with the lowest bridge ID; all its ports forward"],["Root port","A non-root switch's single best port towards the root"],["Designated port","The forwarding port on each link, on the end closest to the root"],["Alternate port","A port that lost both elections; it discards frames but listens to BPDUs"]], why:"There is one root bridge per tree, one root port on each non-root switch, and one designated port on each link. Every other port is an alternate port and blocks, ready to take over if the active path fails."})}

<h3>Worked example 1: a triangle with one slow link</h3>
<p>All priorities default (32769), so the MAC decides. SW-A–SW-B and SW-A–SW-C are 1 Gb/s (cost 4); SW-B–SW-C is 100 Mb/s (cost 19).</p>
${K.svg("0 0 720 340",
  K.dev("switch",360,60,"SW-B · ROOT","32769 · 0050.0f00.0001")+K.dev("switch",150,250,"SW-A","32769 · 0050.0f00.0003")+K.dev("switch",570,250,"SW-C","32769 · 0050.0f00.0002")+
  K.link(338,72,172,238,"1 Gb/s · cost 4")+K.link(382,72,548,238,"100 Mb/s · cost 19")+K.link(178,250,542,250,"1 Gb/s · cost 4")+
  K.txt(276,128,"Gi0/1 DP",{c:"ok",s:10.5,end:true})+K.txt(444,128,"Gi0/2 DP",{c:"ok",s:10.5})+
  K.txt(178,222,"Gi0/1 RP",{c:"ok",s:10.5})+K.txt(200,272,"Gi0/2 DP",{c:"ok",s:10.5})+
  K.txt(540,222,"Gi0/2 ALT ✕",{c:"warn",s:10.5,end:true,b:true})+K.txt(520,272,"Gi0/1 RP",{c:"ok",s:10.5,end:true})+
  K.txt(150,310,"root path cost 4",{mid:true,s:10.5})+K.txt(570,310,"root path cost 8 (via SW-A)",{mid:true,s:10.5}),
  "The finished election. SW-B is root (lowest MAC). SW-C's best path is the long way round through SW-A (4 + 4 = 8), not its direct 100 Mb/s link (19), so the direct link is the one that blocks — at SW-C's end.")}
${K.steps([
  ["Root bridge", `<p>Lowest MAC: <b>SW-B</b> (<code>…0001</code>). Both its ports are designated.</p>`],
  ["SW-A's root port", `<p>Direct: 4. Via SW-C: 4 + 19 = 23. <b>Gi0/1</b>, cost 4.</p>`],
  ["SW-C's root port: the surprise", `<p>Direct over 100 Mb/s: 19. Via SW-A: 4 + 4 = 8. <b>Gi0/1 (towards SW-A)</b> wins, cost 8. The direct link isn't always best.</p>`],
  ["Designated ports", `<p>Both links touching SW-B: SW-B's end. SW-A–SW-C: SW-A (4 beats 8), so <b>SW-A Gi0/2</b>.</p>`],
  ["What's left blocks", `<p><b>SW-C Gi0/2</b> (the slow link) is <b>Altn BLK</b>: a standby if SW-A fails.</p>`],
])}

<h3>Worked example 2: a square with configured priorities</h3>
<p>All links 1 Gb/s. DS1's priority is 24576 and DS2's is 28672 (lesson 5 shows how); AS1 and AS2 are default. AS2 has the lowest MAC: the trap.</p>
${K.svg("0 0 720 360",
  K.dev("switch",170,60,"DS1 · ROOT","24577 · 0050.0f10.0000")+K.dev("switch",550,60,"DS2","28673 · 0050.0f20.0000")+
  K.dev("switch",170,270,"AS2","32769 · 0050.0f05.0000")+K.dev("switch",550,270,"AS1","32769 · 0050.0f30.0000")+
  K.link(198,60,522,60,"cost 4")+K.link(170,72,170,258,"")+K.link(550,72,550,258,"")+K.link(198,270,522,270,"cost 4")+
  K.txt(205,50,"Gi0/1 DP",{c:"ok",s:10.5})+K.txt(515,50,"Gi0/1 RP",{c:"ok",s:10.5,end:true})+
  K.txt(178,132,"Gi0/2 DP",{c:"ok",s:10.5})+K.txt(542,132,"Gi0/2 DP",{c:"ok",s:10.5,end:true})+
  K.txt(178,236,"Gi0/1 RP",{c:"ok",s:10.5})+K.txt(542,236,"Gi0/1 RP",{c:"ok",s:10.5,end:true})+
  K.txt(205,296,"Gi0/2 DP",{c:"ok",s:10.5})+K.txt(515,296,"Gi0/2 ALT ✕",{c:"warn",s:10.5,end:true,b:true})+
  K.txt(170,340,"root path cost 4",{mid:true,s:10.5})+K.txt(550,340,"root path cost 8 (tie broken by DS2's lower BID)",{mid:true,s:10.5}),
  "The square after the election. AS1 has two equal-cost paths (8 each); the neighbour with the lower bridge ID, DS2, wins. On the AS1–AS2 link AS2 is closer to the root, so AS1's end blocks.")}
${K.steps([
  ["Root bridge", `<p>Priority before MAC: <b>DS1</b> (24577) wins; AS2's low MAC doesn't help.</p>`],
  ["DS2 and AS2", `<p>One hop from DS1: root port Gi0/1, cost 4.</p>`],
  ["AS1: a tie", `<p>Via DS2 = 8, via AS2 = 8. Neighbour BID: DS2 28673 beats AS2 32769, so <b>Gi0/1</b> is the root port.</p>`],
  ["Designated ports", `<p>DS1's links: DS1. DS2–AS1: DS2 (4 beats 8). AS1–AS2: <b>AS2</b> (4 beats 8).</p>`],
  ["The alternate port", `<p><b>AS1 Gi0/2</b>: Altn BLK. One loop, one blocked port.</p>`],
])}
${K.mistake(`Using <i>your own</i> port number to break a root port tie. It's the <b>neighbour's</b> sending port ID that counts (exercise 3 below).`)}
${K.mistake(`Assuming the direct link to the root is always the root port. Two fast hops (8) beat one slow one (19).`)}

<h3>Try it yourself: three elections on paper</h3>
<p>For each, find the root, each root port and cost, the designated ports and the blocked port. Links are 1 Gb/s unless stated.</p>
<ol>
<li><b>The tempting MAC.</b> CORE: priority 24576, MAC <code>5c50.15aa.0000</code>. ACC1: default priority, MAC <code>0019.0a11.0000</code>. ACC2: default priority, MAC <code>0019.0a12.0000</code>. Links: CORE Gi0/1–ACC1 Gi0/1, CORE Gi0/2–ACC2 Gi0/1, ACC1 Gi0/2–ACC2 Gi0/2.</li>
<li><b>The square with a 10 Gb/s link.</b> S1 <code>0011.0004.0000</code>, S2 <code>0011.0002.0000</code>, S3 <code>0011.0003.0000</code>, all default priority. S4: priority 4096, MAC <code>00ff.0001.0000</code>. Links: S1 Gi0/1–S2 Gi0/1, S2 Gi0/2–S3 Gi0/1, S3 Gi0/2–S4 Gi0/1 (<b>10 Gb/s</b>), S4 Gi0/2–S1 Gi0/2.</li>
<li><b>Two cables, crossed.</b> SW-A: priority 4096. SW-B: default. Two cables join them: SW-A Gi0/2–SW-B Gi0/1, and SW-A Gi0/1–SW-B Gi0/2.</li>
</ol>
${K.hint(`Root first (priority, then MAC). Add up each path's cost; on a tie use the <b>neighbour's</b> BID, then its port ID. The 10 Gb/s link costs 2. In network 3, which SW-A port does each SW-B port hear?`)}
${K.reveal("Show the answers",`<ol>
<li><b>Root: CORE</b>: 24577 beats 32769, whatever the MACs. ACC1 root port Gi0/1 (cost 4); ACC2 root port Gi0/1 (cost 4). ACC1–ACC2 link: both cost 4, so the lower BID wins: ACC1 (<code>…0a11</code> &lt; <code>…0a12</code>). ACC1 Gi0/2 is designated; <b>ACC2 Gi0/2 is Altn BLK</b>.</li>
<li><b>Root: S4</b> (4097). S3 reaches it over the 10 Gb/s link: root port Gi0/2, cost 2. S1 is direct: root port Gi0/2, cost 4. S2: via S3 = 2 + 4 = 6; via S1 = 4 + 4 = 8, so root port Gi0/2 (towards S3), cost 6. S1–S2 link: S1 (4) beats S2 (6), so S1 Gi0/1 is designated and <b>S2 Gi0/1 is Altn BLK</b>. S2–S3: S3 designated. S3–S4 and S4–S1: S4 designated.</li>
<li><b>Root: SW-A</b>. Both of SW-B's ports cost 4 and both hear the same neighbour BID (SW-A), so the neighbour's port ID decides. SW-B Gi0/2 hears SW-A's Gi0/1 (128.1); SW-B Gi0/1 hears SW-A's Gi0/2 (128.2). 128.1 is lower, so <b>SW-B's root port is Gi0/2</b> and <b>SW-B Gi0/1 is Altn BLK</b>. Both of SW-A's ports are designated.</li>
</ol><p>Every one of these answers was checked by running the same networks in this course's simulator.</p>`)}
${K.check({q:"Two non-root switches, SW5 (root path cost 8, BID 32769 / 0011.2222.0005) and SW6 (root path cost 4, BID 32769 / 0011.2222.0001), are joined by one link. Which port on that link is designated?", o:["SW5's, because its MAC is higher","SW6's, because its root path cost is lower","Both, because each switch is non-root","Neither; a link between two non-root switches always blocks at both ends"], a:1, why:"Root path cost is compared first. SW6 is closer to the root (4 versus 8), so its port is designated and SW5's port on that link blocks, unless it is SW5's root port. The bridge ID would only matter if the costs were equal."})}

<h2>Port states, timers, and what Rapid STP changed</h2>
<p>A port's <b>role</b> is what STP wants; its <b>state</b> is what it's doing now. Classic 802.1D won't let a port jump straight to forwarding, in case it briefly creates a loop while others are still deciding:</p>
<div class="tablewrap"><table>
<tr><th>802.1D state</th><th>Receives BPDUs</th><th>Sends BPDUs</th><th>Learns MACs</th><th>Forwards user frames</th><th>How long</th></tr>
<tr><td><b>Disabled</b></td><td>No</td><td>No</td><td>No</td><td>No</td><td>While the port is shut down</td></tr>
<tr><td><b>Blocking</b></td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>Stable; up to 20 s (max age) after a failure</td></tr>
<tr><td><b>Listening</b></td><td>Yes</td><td>Yes</td><td>No</td><td>No</td><td>15 s (forward delay)</td></tr>
<tr><td><b>Learning</b></td><td>Yes</td><td>Yes</td><td><b>Yes</b></td><td>No</td><td>15 s (forward delay)</td></tr>
<tr><td><b>Forwarding</b></td><td>Yes</td><td>Yes</td><td>Yes</td><td><b>Yes</b></td><td>Stable</td></tr>
</table></div>
<p>Listening lets BPDUs spread; learning fills the MAC table so the port doesn't start by flooding everything.</p>
<h3>The three timers, and the 30–50 second wait</h3>
<ul>
<li><b>Hello</b>: <b>2 s</b> between BPDUs.</li>
<li>${K.g("Max age","How long a switch keeps a port's last BPDU before deciding the path has gone.")}: <b>20 s</b> without BPDUs before a path is declared dead.</li>
<li>${K.g("Forward delay","Time spent in listening, and again in learning.")}: <b>15 s</b>, once in listening and once in learning.</li>
</ul>
${K.svg("0 0 720 210",
  K.txt(20,26,"Classic 802.1D after an indirect failure",{c:"fg",s:12,b:true,f:"body"})+
  K.band(20,36,200,34,"Blocking · max age 20 s","var(--chip)")+K.band(220,36,150,34,"Listening · 15 s","var(--panel2)")+K.band(370,36,150,34,"Learning · 15 s","var(--panel2)")+K.band(520,36,180,34,"Forwarding","var(--chip)")+
  K.txt(20,92,"0 s",{s:10.5})+K.txt(220,92,"20 s",{s:10.5,mid:true})+K.txt(370,92,"35 s",{s:10.5,mid:true})+K.txt(520,92,"50 s: traffic flows",{s:10.5,mid:true,c:"bad"})+
  K.txt(20,134,"Rapid STP (802.1w) on point-to-point links",{c:"fg",s:12,b:true,f:"body"})+
  K.band(20,144,140,34,"Discarding","var(--chip)")+K.band(160,144,110,34,"Learning","var(--panel2)")+K.band(270,144,430,34,"Forwarding","var(--chip)")+
  K.txt(160,198,"alternate port takes over / proposal-agreement: usually a second or two",{s:10.5,c:"ok"}),
  "Why classic STP feels slow: a port that must change from blocking to forwarding waits up to 20 s for max age, then 15 s listening and 15 s learning. Rapid STP replaces the timers with a handshake.")}
<ul>
<li><b>Indirect failure</b> (BPDUs just stop arriving): 20 + 15 + 15 = <b>50 s</b>.</li>
<li><b>Direct failure</b> (the switch's own root port goes down, so it skips max age): <b>30 s</b>.</li>
<li><b>A new PC</b>: its port waits 30 s too, so DHCP may give up and leave a 169.254 address (Module 3). ${K.g("PortFast","A setting for desk ports that lets them forward at once instead of waiting through listening and learning.")} fixes that in lesson 5.</li>
</ul>
<p>After a change, a ${K.g("TCN","Topology change notification: a BPDU telling the root the tree changed, so MAC aging drops to 15 s for a while.")} BPDU makes every switch age MACs after 15 s instead of 300 s, so stale entries vanish fast.</p>
${K.q({type:"order", q:"Put the classic 802.1D port states in the order a port passes through them when it moves from blocking to forwarding.", items:["Blocking","Listening","Learning","Forwarding"], why:"From blocking, a port spends one forward delay (15 s) listening, sending and receiving BPDUs, then another 15 s learning MAC addresses, and only then forwards user frames. Disabled is not part of this sequence: it means the port is shut down."})}
${K.remember(`States: <b>&ldquo;Big Lions Learn Fast&rdquo;</b>: Blocking, Listening, Learning, Forwarding. Timers: <b>2 · 20 · 15</b> (hello, max age, forward delay). Worst case: <b>20 + 15 + 15 = 50</b>.`)}
<h3>Rapid STP: same idea, much faster</h3>
<p>Fifty seconds is too long for voice calls and card payments. ${K.g("Rapid STP (RSTP)","IEEE 802.1w: same election, but a proposal/agreement handshake replaces the timers.")} (${K.g("802.1w","The IEEE standard that defined Rapid Spanning Tree (2001). It was later folded into the main 802.1D and 802.1Q standards, but everyone still says 802.1w.")}) keeps the election and costs, and changes the speed:</p>
<ul>
<li><b>States</b>: ${K.g("discarding","RSTP's one 'not forwarding' state, replacing disabled, blocking and listening.")}, learning, forwarding.</li>
<li><b>Roles</b>: root, designated, <b>alternate</b> (a ready replacement root port) and ${K.g("backup","A spare for the switch's own designated port on a shared (hub) segment.")} (rare: a hub, or two ports of one switch cabled together).</li>
<li><b>Proposal/agreement</b> on point-to-point (<code>P2p</code>) links: forwarding in about a second. Every switch sends BPDUs, and a neighbour is lost after three missed hellos (6 s).</li>
</ul>
<h3>PVST+: one tree per VLAN</h3>
<p>Cisco's ${K.g("PVST+","Per-VLAN Spanning Tree Plus: a separate 802.1D tree per VLAN.")} runs a separate tree for <b>every VLAN</b>, with its own BPDUs, root and blocked ports, so VLAN 10 can block on one uplink while VLAN 20 blocks on the other. ${K.g("Rapid PVST+","Cisco's per-VLAN RSTP; the Catalyst 9000 default.")} is the RSTP version and the Catalyst 9000 default (older 2960s default to PVST+). ${K.g("MST","IEEE 802.1s: maps many VLANs to a few tree instances.")} groups VLANs into a few instances for large networks.</p>
${K.when([
  ["802.1D","Old or non-Cisco gear that only speaks it","Universal",`New designs: 30–50 s ${K.g("convergence","The time the switches take to agree a new loop-free tree after a change, so traffic flows again.")}`],
  ["PVST+","Older Cisco switches (2960 default)","Per-VLAN roots","Rapid PVST+ is available"],
  ["Rapid PVST+","Most Cisco campuses (Catalyst 9000 default)","Per-VLAN trees, fast convergence","Hundreds of VLANs: per-VLAN BPDUs cost CPU"],
  ["MST","Large or multi-vendor networks","Few instances, standard, rapid","Small networks: extra planning"],
], "Which Spanning Tree flavour, and when")}
${K.myth([
  ["IP's TTL will eventually stop a switching loop.","Switches never touch the TTL, and ARP isn't IP. The loop runs until STP or a person breaks it."],
  ["An amber (blocked) port is faulty.","It's a healthy standby that still hears BPDUs. Only one end of that link blocks."],
  ["The biggest or fastest switch becomes root.","Lowest bridge ID wins, often the oldest switch, which is why you choose the root (lesson 5)."],
  ["A higher priority number is better.","Lower wins: 4096 beats 32768."],
  ["STP shares traffic over all redundant links.",`One path per VLAN; PVST+ and ${K.g("EtherChannel","Several parallel links bundled into one logical link, so STP blocks none of them and all carry traffic.")} (lesson 6) help use more links.`],
])}
${K.check({q:"With default 802.1D timers, a switch's root port is fine but a link two switches away fails. The switch only notices because BPDUs stop arriving on its root port. Roughly how long before its alternate port forwards traffic?", o:["2 seconds","15 seconds","30 seconds","50 seconds"], a:3, why:"Indirect failure: max age (20 s), then listening (15 s) and learning (15 s) = 50 s. Rapid STP cuts this to a second or two."})}

<h2>Hands-on: read a real tree, then break a link</h2>
<p>A triangle of three Catalyst switches (trunk uplinks, default priorities), PC1 on SW2 and PC2 on SW3. Base MACs: <b>SW1 <code>0c75.bd11.0000</code></b>, <b>SW2 <code>0c75.bd3a.0000</code></b>, <b>SW3 <code>0c75.bd2f.0000</code></b>. Cabling: SW1 Gi0/1–SW2 Gi0/1, SW1 Gi0/2–SW3 Gi0/1, SW2 Gi0/2–SW3 Gi0/2, all 1 Gb/s. Predict first.</p>
${K.q({type:"fill", q:"Predict before you check: which switch becomes root, which switch has the blocked (Altn BLK) port, and which port is it?", fields:[{label:"Root bridge", a:["SW1"]},{label:"Switch with the blocked port", a:["SW2"]},{label:"Blocked port", a:["Gi0/2","Gi 0/2","G0/2","GigabitEthernet0/2","GigabitEthernet 0/2","Gig0/2","Gig 0/2","G 0/2"]}], why:"All priorities are 32769, so the lowest MAC wins: SW1 (bd11). SW2 and SW3 each reach SW1 directly at cost 4. On the SW2–SW3 link both ends cost 4, so the lower bridge ID wins: SW3 (bd2f is lower than bd3a). SW3 Gi0/2 is designated, and SW2's end, Gi0/2, blocks."})}
${K.hint(`Compare hex character by character: <code>bd11</code> &lt; <code>bd2f</code> &lt; <code>bd3a</code>. The SW2–SW3 tie is broken by bridge ID.`)}
${K.bench({id:"m4-stp-triangle", points:80, from:"CCNA · Module 4 · lesson 4", title:"read the tree, find the amber port, then break a link", viewBox:"0 0 940 470", openLog:true,
  intro:"Console in with the laptop (move the console cable from switch to switch: unplug it, plug it into the next CON port, open the Terminal again). Base MACs: SW1 0c75.bd11.0000 · SW2 0c75.bd3a.0000 · SW3 0c75.bd2f.0000. Watch the port lights: green = forwarding, amber = Spanning Tree blocking.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · distribution", mac:"0c75.bd11", x:260, y:20,
      config:e=>{ ["en","conf t","interface GigabitEthernet0/1","description Link to SW2","switchport mode trunk","interface GigabitEthernet0/2","description Link to SW3","switchport mode trunk","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = l => { const o = run(l); if (typeof o==="string" && /VLAN0|MACFLAP|spanning tree instance/.test(o)) e.seen.push(o); return o; }; }},
    {id:"sw2", kind:"switch", label:"SW2", model:"Catalyst 9200 · floor 1", mac:"0c75.bd3a", x:10, y:200,
      config:e=>{ ["en","conf t","interface GigabitEthernet0/1","description Link to SW1","switchport mode trunk","interface GigabitEthernet0/2","description Link to SW3","switchport mode trunk","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = l => { const o = run(l); if (typeof o==="string" && /VLAN0|MACFLAP|spanning tree instance/.test(o)) e.seen.push(o); return o; }; }},
    {id:"sw3", kind:"switch", label:"SW3", model:"Catalyst 9200 · floor 2", mac:"0c75.bd2f", x:509, y:200,
      config:e=>{ ["en","conf t","interface GigabitEthernet0/1","description Link to SW1","switchport mode trunk","interface GigabitEthernet0/2","description Link to SW2","switchport mode trunk","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = l => { const o = run(l); if (typeof o==="string" && /VLAN0|MACFLAP|spanning tree instance/.test(o)) e.seen.push(o); return o; }; }},
    {id:"pc1", kind:"pc", label:"PC1", x:120, y:360, ip:"10.10.1.11", mask:"255.255.255.0", gw:"10.10.1.1", mac:"a4bb.6d00.0011"},
    {id:"pc2", kind:"pc", label:"PC2", x:640, y:360, ip:"10.10.1.12", mask:"255.255.255.0", gw:"10.10.1.1", mac:"a4bb.6d00.0012"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:800, y:20},
  ],
  cables:[ {type:"cat6", a:"sw1:g1", b:"sw2:g1"}, {type:"cat6", a:"sw1:g2", b:"sw3:g1"}, {type:"cat6", a:"sw2:g2", b:"sw3:g2"}, {type:"cat6", a:"pc1:eth", b:"sw2:g5"}, {type:"cat6", a:"pc2:eth", b:"sw3:g5"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Console into SW1 (laptop USB → SW1 CON, 9600 8N1, no flow control), <code>enable</code>, <code>show spanning-tree</code>. Find &ldquo;This bridge is the root&rdquo;", done:B=>B.devs.sw1.env.seen.some(o=>/VLAN0001/.test(o) && /This bridge is the root/.test(o))},
    {text:"Move the console to SW2 and run <code>show spanning-tree</code>. Find the <b>Altn BLK</b> port: is it the one you predicted? (Its light is amber.)", done:B=>B.devs.sw2.env.seen.some(o=>/Gi0\/2\s+Altn BLK/.test(o))},
    {text:"Move the console to SW3 and run <code>show spanning-tree</code>. Every port forwards: SW3 won the SW2–SW3 link because its bridge ID is lower", done:B=>B.devs.sw3.env.seen.some(o=>/VLAN0001/.test(o) && /Gi0\/2\s+Desg FWD/.test(o))},
    {text:"From PC1's Command Prompt, <code>ping 10.10.1.12</code> (PC2). In the frame log, see the frames go SW2 → SW1 → SW3, and SW2 Gi0/2 discard the copy of the broadcast", done:B=>Bench.pinged(B,"pc1","10.10.1.12")},
    {text:"Break the active path: unplug the cable between SW1 Gi0/1 and SW2 Gi0/1. Watch SW2's port 2 change from amber to green", done:B=>!Bench.linked(B,"sw1:g1","sw2:g1") && Bench.stpRole(B,"sw2","g2",1)==="Root FWD"},
    {text:"On SW2, <code>show spanning-tree</code> again: Gi0/2 is now the <b>Root</b> port, forwarding, and the root cost has gone from 4 to 8", done:B=>B.devs.sw2.env.seen.some(o=>/Gi0\/2\s+Root FWD/.test(o))},
    {text:"Ping PC2 from PC1 again. This time the frames take the direct SW2 → SW3 link (SW2 learns PC2's MAC on Gi0/2)", done:B=>Bench.pinged(B,"pc1","10.10.1.12") && !Bench.linked(B,"sw1:g1","sw2:g1") && Bench.macPort(B,"sw2","a4bb.6d00.0012")==="Gi0/2"},
  ],
  win:"You predicted the election, found the one blocked port by reading show spanning-tree, followed the traffic round the long way through the root, and then watched Spanning Tree turn the standby link on by itself when you pulled a cable. On real switches that last step takes about a second with Rapid PVST+ (about 30 s with classic STP, because SW2's own root port failed, so there is no max age wait); the bench shows the result straight away.",
  solve:[["plug","console","lap:usb","sw1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show spanning-tree"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show spanning-tree"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw3:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show spanning-tree"],
    ["pc","pc1","ping 10.10.1.12"],["unplug","sw1:g1"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show spanning-tree"],
    ["pc","pc1","ping 10.10.1.12"]]})}
<h3>Reading <code>show spanning-tree</code> line by line</h3>
<p>SW2's output from the bench, before you pulled the cable:</p>
${K.out(`SW2#show spanning-tree
VLAN0001
  Spanning tree enabled protocol rstp
  Root ID    Priority    32769
             Address     0c75.bd11.0000
             Cost        4
             Port        1 (GigabitEthernet0/1)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     0c75.bd3a.0000
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         128.1    P2p
Gi0/2               Altn BLK 4         128.2    P2p
Gi0/5               Desg FWD 4         128.5    P2p`, "SW2 in the triangle bench: not the root, root port Gi0/1, one alternate port.")}
<ul>
<li><b>VLAN0001</b>: one block per VLAN (per-VLAN STP). <b>rstp</b> = Rapid PVST+, the Catalyst 9000 default; classic PVST+ says <code>ieee</code>.</li>
<li><b>Root ID</b>: the root's priority and MAC (SW1). <b>Cost 4</b> is SW2's root path cost; <b>Port 1</b> its root port. On the root these lines read <code>This bridge is the root</code>.</li>
<li><b>Hello / Max Age / Forward Delay</b>: 2, 20, 15 seconds.</li>
<li><b>Bridge ID</b>: SW2's own BID, 32768 + sys-id-ext 1. If it matches the Root ID, you're on the root.</li>
<li><b>Port table</b>: Role (Root, ${K.g("Desg","Short for designated: the port that forwards onto its link.")}, Altn, Back — backup), Sts (${K.g("FWD","Short for forwarding: the port sends and receives user frames.")}, BLK, ${K.g("LRN","Short for learning: the port is filling its MAC table but not yet forwarding user frames.")}), Cost, Prio.Nbr (port ID) and Type (<code>P2p</code> point-to-point, <code>Shr</code> shared, <code>Edge</code> PortFast).</li>
</ul>
<p>Gi0/5 faces PC1, which sends no BPDUs, so it's designated. Cisco shows <code>Altn</code> even in classic PVST+ mode.</p>
${K.tip(`To find every blocked port on a busy switch in one go, filter the output: <code>show spanning-tree | include VLAN|Altn</code> prints each VLAN header and only the alternate ports under it.`)}
<h3>Practise reading trees: three VLANs, two roots</h3>
<p>The square from worked example 2, with VLANs 10 and 20 added: DS1 is root for VLANs 1 and 10, DS2 for VLAN 20. You're on AS1's console.</p>
${K.hint(`Start with <code>enable</code>. Compare the Root ID address and Gi0/2's role in VLAN 1 and VLAN 20.`)}
${K.term({env:"ios2", title:"read PVST+ on AS1-3F", opts:{kind:"switch", host:"AS1-3F", model:"C9200L-24P-4G", mac:"0050.0f30",
  motd:"AS1-3F — console session. Access switch, 3rd floor. Gi0/1 = uplink to DS2, Gi0/2 = link to AS2, Gi0/5 = desk 3-05 (VLAN 10).",
  hooks:{
    stp: v => ({
      1:{isRoot:false, root:{prio:24577, mac:"0050.0f10.0000"}, bridge:{prio:32769, mac:"0050.0f30.0000"}, rootCost:8, rootPort:"GigabitEthernet0/1", rootPortNum:1,
         ports:[{name:"GigabitEthernet0/1", role:"Root", state:"FWD", cost:4, prio:"128.1", type:"P2p"},{name:"GigabitEthernet0/2", role:"Altn", state:"BLK", cost:4, prio:"128.2", type:"P2p"}]},
      10:{isRoot:false, root:{prio:24586, mac:"0050.0f10.0000"}, bridge:{prio:32778, mac:"0050.0f30.0000"}, rootCost:8, rootPort:"GigabitEthernet0/1", rootPortNum:1,
         ports:[{name:"GigabitEthernet0/1", role:"Root", state:"FWD", cost:4, prio:"128.1", type:"P2p"},{name:"GigabitEthernet0/2", role:"Altn", state:"BLK", cost:4, prio:"128.2", type:"P2p"},{name:"GigabitEthernet0/5", role:"Desg", state:"FWD", cost:4, prio:"128.5", type:"P2p"}]},
      20:{isRoot:false, root:{prio:24596, mac:"0050.0f20.0000"}, bridge:{prio:32788, mac:"0050.0f30.0000"}, rootCost:4, rootPort:"GigabitEthernet0/1", rootPortNum:1,
         ports:[{name:"GigabitEthernet0/1", role:"Root", state:"FWD", cost:4, prio:"128.1", type:"P2p"},{name:"GigabitEthernet0/2", role:"Desg", state:"FWD", cost:4, prio:"128.2", type:"P2p"}]},
    })[+v] || null,
    stpState: (n, v) => n==="GigabitEthernet0/2" && +v!==20 ? "BLK" : "FWD",
  }},
  setup:env=>{
    ["en","conf t","vlan 10","name STAFF","vlan 20","name VOICE","exit","interface GigabitEthernet0/1","description Uplink to DS2","switchport mode trunk","interface GigabitEthernet0/2","description Link to AS2","switchport mode trunk",
     "interface GigabitEthernet0/5","description Desk 3-05","switchport mode access","switchport access vlan 10","end","disable"].forEach(c=>env.exec(c));
    env.history.length = 0; env.seen = [];
    const run = env.exec; env.exec = line => { const o = run(line); if (typeof o==="string") env.seen.push(o); return o; };
  },
  intro:"A Catalyst access switch in a four-switch square running Rapid PVST+. Everything here is read-only: you're investigating, not changing.",
  tasks:[
    {text:"<code>enable</code>, then <code>show spanning-tree vlan 1</code> (the tree for just one VLAN): note the root's MAC (DS1), the root cost (8) and the Altn BLK port", done:e=>e.seen.some(o=>/VLAN0001[\s\S]*Root ID[\s\S]*Altn BLK/.test(o))},
    {text:"<code>show spanning-tree vlan 10</code>: the same tree as VLAN 1, plus desk port Gi0/5 as a designated port. Note priority 32778 (32768 + 10)", done:e=>e.seen.some(o=>/VLAN0010[\s\S]*Gi0\/5/.test(o))},
    {text:"<code>show spanning-tree vlan 20</code>: a different root (DS2, 0050.0f20.0000), cost 4, and Gi0/2 now forwards", done:e=>e.seen.some(o=>/VLAN0020[\s\S]*Root ID[\s\S]*0050\.0f20/.test(o))},
    {text:"<code>show interfaces trunk</code>: the last block shows Gi0/2 forwarding only VLAN 20", done:e=>e.seen.some(o=>/forwarding state and not pruned/.test(o))},
    {text:"<code>show spanning-tree | include VLAN|Altn</code>: every blocked port, VLAN by VLAN, in a few lines", done:e=>e.seen.some(o=>/VLAN0001/.test(o) && /Altn/.test(o) && !/Root ID/.test(o))},
    {text:"<code>show running-config | include spanning-tree</code>: the mode and <code>spanning-tree extend system-id</code>, the setting that adds the VLAN to the priority", done:e=>e.seen.some(o=>/extend system-id/.test(o))},
  ],
  win:"You read three trees on one switch: in VLANs 1 and 10 AS1 blocks its link to AS2, while in VLAN 20 (rooted at DS2) the same port forwards. That's PVST+ load-sharing: each VLAN blocks in a different place, so more of the cabling does useful work.",
  solve:["enable","show spanning-tree vlan 1","show spanning-tree vlan 10","show spanning-tree vlan 20","show interfaces trunk","show spanning-tree | include VLAN|Altn","show running-config | include spanning-tree"]})}
<p>In VLAN 20 AS1 is one hop from the root, wins the AS1–AS2 link, and the block moves to AS2. Same cables, two trees.</p>
${K.check({q:"On a switch, show spanning-tree vlan 10 shows the Root ID and Bridge ID with exactly the same priority and address. What does that tell you?", o:["The switch has lost contact with the root","This switch is the root bridge for VLAN 10","VLAN 10 has no ports","Two switches have the same MAC address"], a:1, why:"When a switch's own bridge ID is the root ID, it is the root for that VLAN. IOS also prints 'This bridge is the root' in the Root ID section, and lists no root port or root cost."})}

<h2>Hands-on: the storm lab — turn Spanning Tree off and watch</h2>
<p>The same triangle, but with <code>no spanning-tree vlan 1</code> on all three switches. Nothing breaks the loop.</p>
${K.bench({id:"m4-stp-storm", points:90, from:"CCNA · Module 4 · lesson 4", title:"the storm lab: no Spanning Tree, one ping", viewBox:"0 0 940 470", openLog:true,
  intro:"STP is disabled for VLAN 1 on every switch (no spanning-tree vlan 1). Make PC1 talk, watch the amber broadcast dots lap the triangle, read the evidence on a switch, then turn Spanning Tree back on everywhere and prove the network works.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1", model:"Catalyst 9200 · distribution", mac:"0c75.bd11", x:260, y:20,
      config:e=>{ ["en","conf t","interface GigabitEthernet0/1","description Link to SW2","switchport mode trunk","interface GigabitEthernet0/2","description Link to SW3","switchport mode trunk","exit","no spanning-tree vlan 1","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = l => { const o = run(l); if (typeof o==="string" && /VLAN0|MACFLAP|spanning tree instance/.test(o)) e.seen.push(o); return o; }; }},
    {id:"sw2", kind:"switch", label:"SW2", model:"Catalyst 9200 · floor 1", mac:"0c75.bd3a", x:10, y:200,
      config:e=>{ ["en","conf t","interface GigabitEthernet0/1","description Link to SW1","switchport mode trunk","interface GigabitEthernet0/2","description Link to SW3","switchport mode trunk","exit","no spanning-tree vlan 1","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = l => { const o = run(l); if (typeof o==="string" && /VLAN0|MACFLAP|spanning tree instance/.test(o)) e.seen.push(o); return o; }; }},
    {id:"sw3", kind:"switch", label:"SW3", model:"Catalyst 9200 · floor 2", mac:"0c75.bd2f", x:509, y:200,
      config:e=>{ ["en","conf t","interface GigabitEthernet0/1","description Link to SW1","switchport mode trunk","interface GigabitEthernet0/2","description Link to SW2","switchport mode trunk","exit","no spanning-tree vlan 1","end"].forEach(c=>e.exec(c)); e.history.length=0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = l => { const o = run(l); if (typeof o==="string" && /VLAN0|MACFLAP|spanning tree instance/.test(o)) e.seen.push(o); return o; }; }},
    {id:"pc1", kind:"pc", label:"PC1", x:120, y:360, ip:"10.10.1.11", mask:"255.255.255.0", gw:"10.10.1.1", mac:"a4bb.6d00.0011"},
    {id:"pc2", kind:"pc", label:"PC2", x:640, y:360, ip:"10.10.1.12", mask:"255.255.255.0", gw:"10.10.1.1", mac:"a4bb.6d00.0012"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:800, y:20},
  ],
  cables:[ {type:"cat6", a:"sw1:g1", b:"sw2:g1"}, {type:"cat6", a:"sw1:g2", b:"sw3:g1"}, {type:"cat6", a:"sw2:g2", b:"sw3:g2"}, {type:"cat6", a:"pc1:eth", b:"sw2:g5"}, {type:"cat6", a:"pc2:eth", b:"sw3:g5"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"From PC1, <code>ping 10.10.1.12</code>. It fails. Watch the amber ARP dots go round and round the triangle, and read the storm warning in the frame log", done:B=>Bench.stormed(B)},
    {text:"Console into any switch, <code>enable</code>, <code>show logging</code>: find the <code>%SW_MATM-4-MACFLAP_NOTIF</code> line. Whose MAC is flapping, and between which ports?", done:B=>["sw1","sw2","sw3"].some(s=>Bench.logged(B,s,/MACFLAP/) && B.devs[s].env.seen.some(o=>/MACFLAP/.test(o)))},
    {text:"On the same switch, <code>show spanning-tree</code>: &ldquo;No spanning tree instance exists.&rdquo; (Bonus: <code>show running-config | include spanning-tree</code> shows the culprit line.)", done:B=>["sw1","sw2","sw3"].some(s=>B.devs[s].env.seen.some(o=>/No spanning tree instance exists/.test(o)))},
    {text:"Turn Spanning Tree back on for VLAN 1 on <b>all three</b> switches: <code>configure terminal</code>, <code>spanning-tree vlan 1</code>, <code>end</code>", done:B=>["sw1","sw2","sw3"].every(s=>!B.devs[s].env.stpOff[1])},
    {text:"From PC1, ping PC2 again: four replies. The frame log now says SW2 Gi0/2 discarded the looping copy", done:B=>Bench.pinged(B,"pc1","10.10.1.12")},
    {text:"On SW2, <code>show spanning-tree</code>: find the port that Spanning Tree blocked to break the loop", done:B=>B.devs.sw2.env.seen.some(o=>/Gi0\/2\s+Altn BLK/.test(o))},
  ],
  win:"You caused a real broadcast storm with one ping, found the MAC-flapping evidence in the log, and ended it by switching Spanning Tree back on. STP elected SW1 as root again and blocked SW2 Gi0/2, the same port as before. On a real network you would also save the configuration so the fix survives a reload.",
  solve:[["pc","pc1","ping 10.10.1.12"],
    ["plug","console","lap:usb","sw1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show logging"],["term","show spanning-tree"],["term","configure terminal"],["term","spanning-tree vlan 1"],["term","end"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw3:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","spanning-tree vlan 1"],["term","end"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","configure terminal"],["term","spanning-tree vlan 1"],["term","end"],
    ["pc","pc1","ping 10.10.1.12"],["term","show spanning-tree"]]})}
${K.hint(`Ping still failing after re-enabling one or two switches? In this lab a switch with STP off forwards on every port and takes no part in the tree, so all three must run STP. (A real switch with STP off may pass other switches' BPDUs through, so the result can vary; never rely on it.)`)}
<p>SW1's log during the storm:</p>
${K.out(`SW1#show logging
Syslog logging: enabled (0 messages dropped, 0 flushes, 0 overruns)
    Console logging: level debugging
    Buffer logging:  level debugging

Log Buffer (8192 bytes):
*Oct 11 10:14:07.137: %SW_MATM-4-MACFLAP_NOTIF: Host a4bb.6d00.0011 in vlan 1 is flapping between port Gi0/1 and port Gi0/2`, "One line that tells you almost everything: there is a loop in VLAN 1, and it runs through SW1's Gi0/1 and Gi0/2.")}
<ul>
<li><b>SW_MATM-4</b>: the MAC table manager, ${K.g("severity","How serious a log message is, from 0 (emergencies) to 7 (debugging); lower is more serious.")} 4 (warning).</li>
<li><b>Host a4bb.6d00.0011</b>: PC1, learned on one port then the other as copies arrive from both sides.</li>
<li><b>vlan 1 … Gi0/1 and Gi0/2</b>: the looping VLAN and two ports on the loop: follow them to the cable.</li>
</ul>
<p>The bench animates three laps; a real storm never stops by itself.</p>
${K.mistake(`Turning STP off to &ldquo;fix&rdquo; slow-starting ports. PortFast (lesson 5) fixes those; without STP, the next looped cable takes down the VLAN.`)}
${K.dodont([
  "Keep STP on everywhere, even with no planned loops.",
  "Run <code>show spanning-tree</code> before re-cabling an uplink.",
  "Check <code>show logging</code> for MACFLAP when a whole VLAN dies.",
  "In a storm, shut one looping port first, then find the cable.",
],[
  "Don't type <code>no spanning-tree vlan</code> in production.",
  "Don't &ldquo;fix&rdquo; an amber Altn BLK port.",
  "Don't let users patch wall sockets together.",
  "Don't rely on SSH during a storm; have console access.",
])}

${K.job("The 2 a.m. call-centre outage: two wall ports patched together",`
<p><b>The call.</b> 02:07. The night supervisor at a call centre in Ikeja: &ldquo;Every PC and phone on the 3rd floor froze. Calls dropped.&rdquo; Monitoring shows switch SW-3F flapping.</p>
<p><b>Questions.</b> &ldquo;When did it start? Did anyone plug anything in?&rdquo; <i>&ldquo;About 02:00. I plugged some loose blue cables back in.&rdquo;</i> A whole floor at once, right after cabling: think Layer 2.</p>
<p><b>Checks.</b> SSH times out, so you use the console server. <code>show processes cpu sorted</code>: <code>CPU utilization for five seconds: 99%/88%</code>. Then:</p>
${K.out(`SW-3F#show logging | include MACFLAP
*Oct 12 02:00:41.512: %SW_MATM-4-MACFLAP_NOTIF: Host 3c52.82a1.0c11 in vlan 20 is flapping between port Gi1/0/14 and port Gi1/0/15
*Oct 12 02:00:43.020: %SW_MATM-4-MACFLAP_NOTIF: Host 0c1a.2b00.0102 in vlan 20 is flapping between port Gi1/0/14 and port Gi1/0/15
SW-3F#show spanning-tree vlan 20
Spanning tree instance(s) for vlan 20 does not exist.
SW-3F#show running-config | include spanning-tree
spanning-tree mode rapid-pvst
spanning-tree extend system-id
no spanning-tree vlan 20`, "MAC flapping between two desk ports, and no Spanning Tree for VLAN 20 at all.")}
<p>MACs flapping between two neighbouring <i>desk</i> ports: those sockets are joined. And a contractor's <code>no spanning-tree vlan 20</code> (&ldquo;phones come up faster&rdquo;) is why nothing blocked it.</p>
<p><b>The fix.</b> Stop the bleeding: <code>interface Gi1/0/15</code>, <code>shutdown</code>; the CPU drops to 9% and calls reconnect. Remove the patch lead from socket 3-14 to 3-15. Then <code>spanning-tree vlan 20</code>, <code>no shutdown</code> on Gi1/0/15, check its role in <code>show spanning-tree vlan 20</code>, and <code>copy running-config startup-config</code>.</p>
<p><b>What you say.</b> &ldquo;A cable joining two wall sockets made the network repeat messages endlessly. It's removed and you're back; please leave loose cables to IT.&rdquo; To your manager: &ldquo;Twenty-minute outage from a looped lead; STP had been disabled for the voice VLAN. It's back on. I'll audit other floors and plan PortFast for the phones.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;02:07 3F VLAN 20 down. Console: CPU 99%, MACFLAP Gi1/0/14 ↔ Gi1/0/15. Cause: lead socket 3-14 to 3-15 + 'no spanning-tree vlan 20'. Shut Gi1/0/15 (02:19 restored), lead removed, STP VLAN 20 re-enabled, port restored, saved. Follow-up: audit for disabled STP; PortFast + BPDU guard change.&rdquo;</i></p>`)}

${K.case("The campus that went dark: a hostel loop and a flat VLAN",`
<p>A composite of common campus incidents. A university runs thirty buildings in one big data VLAN, and a contractor put <code>spanning-tree bpdufilter enable</code> on every hostel access port to stop &ldquo;STP noise&rdquo;. Interface BPDU filter stops sending and ignores received BPDUs: STP is effectively off on those ports.</p>
<p>A student plugs an unmanaged 8-port switch into both wall sockets in his room &ldquo;for double speed&rdquo;. The access switch would normally see its own BPDUs come back and block a port, but the filter hid them. Every broadcast on campus now circled the hostel loop and flooded back to all thirty buildings. Uplinks filled, core CPUs strained, and the portal, library and finance office went down. With no SSH, the team spent two hours walking building to building on the console, following MACFLAP messages to the hostel.</p>
<p><b>What they changed:</b> BPDU guard instead of BPDU filter on access ports (lesson 5), so a loop shuts one port; one VLAN per building, routed (lesson 3), so a loop floods only one building; out-of-band console access; and <b>storm control</b>, which drops broadcasts above a set rate. Their summary: <b>STP is the seat belt. The day you disable it is the day you crash.</b></p>`)}
${K.check({q:"During a suspected storm you can't SSH to the access switch, but the console works. show logging shows many MACs flapping between Gi1/0/22 and Gi1/0/23, two desk ports. What should you do first?", o:["Reload the switch to clear the MAC table","Shut down one of the two ports to break the loop, then find the cable","Run clear mac address-table dynamic every minute until it stops","Lower the MAC aging time to 10 seconds"], a:1, why:"Two desk ports flapping means the sockets are joined. Shutting one breaks the loop at once; a reload or clear doesn't remove the loop. Then find the cable and ask why STP didn't block it."})}

<h2>Interview corner</h2>
${K.hint(`Say what the bridge ID is made of, how it's compared, how switches learn about each other (BPDUs), and finish with why you'd set it on purpose.`)}
${K.reveal("“How is the root bridge elected?”",`<p>"Each switch has a bridge ID: priority (32768 by default, steps of 4096) plus the VLAN number, then its MAC. Every switch starts by claiming root in its BPDUs; when it hears a lower root ID it accepts that and relays it. Lowest wins, priority first, MAC as tie-breaker. With defaults the oldest switch often wins, so I set the root and a backup root deliberately per VLAN."</p>`)}
${K.hint(`Describe the flooding behaviour, the three symptoms, then the key point: no TTL in Ethernet, and switches don't read IP.`)}
${K.reveal("“What happens in a Layer 2 loop, and why doesn't IP's TTL help?”",`<p>"Switches flood broadcasts out every other port, so with an unblocked loop a broadcast circles both ways and is re-flooded every lap. You get a storm that fills links and pegs CPUs, MAC flapping (MACFLAP logs), and duplicate frames. TTL can't help: Ethernet has no TTL, only routers decrement the IP TTL, and ARP isn't IP. So Spanning Tree must block redundant ports before a loop forms."</p>`)}
${K.hint(`Walk the four steps in order, give the tie-breakers, and mention that a blocked port is a healthy standby.`)}
${K.reveal("“How does Spanning Tree decide which port to block?”",`<p>"First it elects the root bridge, the lowest bridge ID. Then every other switch picks one root port: the port with the lowest root path cost, using 4 for a gigabit link, 19 for 100 meg and 2 for 10 gig, with ties broken by the lowest neighbour bridge ID and then the lowest neighbour port ID. Then each link picks one designated port: the end whose switch has the lower root path cost, then lower bridge ID, then lower port ID. Any port that's neither root nor designated becomes an alternate port and discards traffic. Only one end of that link blocks, and it keeps listening to BPDUs, so it can take over if the active path fails. With Rapid STP that's about a second; with classic 802.1D it's 30 to 50 seconds because of the listening and learning timers."</p>`)}

${K.recap([
  "Redundant links remove single points of failure, but a Layer 2 loop with nothing blocking causes a broadcast storm, MAC flapping (MACFLAP_NOTIF) and duplicate frames.",
  "Ethernet frames have no TTL and switches never read the IP TTL, so nothing stops a looping frame. STP prevents the loop by blocking redundant ports.",
  "Switches exchange BPDUs every 2 s. The bridge ID is priority (default 32768, steps of 4096) plus the VLAN (sys-id-ext) plus the MAC. Lowest BID becomes root.",
  "Port costs: 10 Mb/s 100, 100 Mb/s 19, 1 Gb/s 4, 10 Gb/s 2. Root path cost is the sum along the best path to the root.",
  "One root bridge; one root port per non-root switch (lowest cost, then neighbour BID, then neighbour port ID); one designated port per link; everything else is an alternate port and blocks.",
  "802.1D states: blocking, listening (15 s), learning (15 s), forwarding, plus disabled. Timers 2 / 20 / 15 give 30–50 s convergence.",
  "RSTP (802.1w): discarding, learning, forwarding; alternate and backup roles; proposal/agreement converges in about a second.",
  "PVST+ and Rapid PVST+ run one tree per VLAN, so different VLANs can have different roots and block in different places. Catalyst 9000 defaults to Rapid PVST+.",
])}
${K.next(`<b>Lesson 5 — Spanning Tree in practice.</b> You can now predict which switch STP will choose as root, and you've seen that the default choice is often wrong. Next you take control: set the root and a backup root per VLAN, run Rapid PVST+, make desk ports start instantly with PortFast, and protect the tree with BPDU guard and ${K.g("root guard","Blocks a port that hears a better root bridge ID, so a stray switch can't take over as root.")}.`)}
`,
quiz:[
  {lvl:1, q:"Why can a broadcast frame circle a Layer 2 loop forever when Spanning Tree is not running?", o:["Ethernet frames have no TTL or hop count, and switches flood broadcasts out every other port each time they arrive","Switches reset the IP TTL to 255 on every hop","The FCS changes on each lap, so each copy looks like a new frame to the switch","Broadcasts are sent to the default gateway, which keeps returning them"], a:0, why:"Nothing in an Ethernet header counts hops, and switches don't read or decrement the IP TTL (an ARP broadcast isn't even IP). Each switch floods the broadcast again on arrival, so the copies never die."},
  {lvl:1, q:"What is the default Spanning Tree bridge priority on a Cisco Catalyst switch, before the VLAN number is added?", o:["0","4096","32768","65535"], a:2, why:"The default priority is 32768. With the extended system ID, IOS shows 32768 plus the VLAN number, for example 32769 in VLAN 1."},
  {lvl:2, q:"show spanning-tree vlan 30 on a switch shows: Bridge ID Priority 28702 (priority 28672 sys-id-ext 30). What is this switch's configured bridge priority for VLAN 30?", o:["28702","28672","30","32768"], a:1, why:"The priority field in the bridge ID is the configured priority plus the VLAN number (the extended system ID). 28702 minus 30 is 28672, a valid multiple of 4096."},
  {lvl:1, type:"multi", q:"Which two values make up the bridge ID that switches compare to elect the root bridge? (Choose two.)", o:["The bridge priority, including the VLAN number (sys-id-ext)","The switch's MAC address","The root path cost","The port ID","The management IP address of the switch"], a:[0,1], why:"The bridge ID is the 2-byte priority field (priority plus sys-id-ext) followed by the 6-byte MAC address. Root path cost and port ID are used for choosing root and designated ports, not for electing the root bridge."},
  {lvl:2, q:"Four switches run in VLAN 1 with these bridge IDs. Which becomes the root bridge? SW1: 32769 / 0001.4210.0001 · SW2: 24577 / 00d0.97ff.1234 · SW3: 24577 / 00d0.97aa.0001 · SW4: 32769 / 0000.0c00.0001", o:["SW1","SW2","SW3","SW4"], a:2, why:"Priority is compared first: SW2 and SW3 tie at 24577, lower than 32769. Their MACs then break the tie: 00d0.97aa.0001 is lower than 00d0.97ff.1234, so SW3 is root. SW4's very low MAC doesn't matter, because its priority is higher."},
  {lvl:2, type:"order", q:"A non-root switch has several ports with a path to the root. Put the tie-breakers it uses to choose its root port in order.", items:["Lowest root path cost through that port","Lowest bridge ID of the neighbour sending the BPDU","Lowest port priority of the neighbour's sending port","Lowest port number of the neighbour's sending port"], why:"Cost first. If tied, the BPDU from the neighbour with the lowest bridge ID wins. If still tied (two cables to the same neighbour), the neighbour's port ID decides: its port priority first, then its port number."},
  {lvl:1, type:"match", q:"Match each link speed with its 802.1D (short method) Spanning Tree cost.", pairs:[["10 Mb/s","100"],["100 Mb/s","19"],["1 Gb/s","4"],["10 Gb/s","2"]], why:"Faster links cost less. The revised 802.1D values are 100, 19, 4 and 2. A switch's root path cost is the total of these port costs along its best path to the root."},
  {lvl:2, type:"match", q:"Match each classic 802.1D port state with what the port does.", pairs:[["Blocking","Receives BPDUs only; no learning, no forwarding"],["Listening","Sends and receives BPDUs; no MAC learning yet"],["Learning","Learns MAC addresses but doesn't forward user frames"],["Forwarding","Forwards user frames and learns MAC addresses"],["Disabled","Administratively down; takes no part in STP"]], why:"Blocking and forwarding are stable states. Listening (15 s) and learning (15 s) are transitional, so the tree settles and the MAC table fills before the port forwards. Disabled means the port is shut down."},
  {lvl:2, type:"fill", q:"With default 802.1D timers, how many seconds can it take for a blocked port to start forwarding after an indirect link failure (max age, then listening, then learning)?", fields:[{label:"Seconds", a:["50","50 s","50 sec","50 seconds"]}], why:"Max age 20 s + listening 15 s + learning 15 s = 50 s. For a direct failure the switch skips max age, so it's 30 s. RSTP brings this down to about a second."},
  {lvl:2, type:"fill", q:"Someone typed no spanning-tree vlan 1 on a switch. Which global configuration command turns Spanning Tree back on for VLAN 1?", fields:[{label:"Command", a:["spanning-tree vlan 1"], ios:true}], why:"spanning-tree vlan 1 re-enables the Spanning Tree instance for VLAN 1. Its absence from the running-config is the normal state; the 'no' form is what disables it."},
  {lvl:2, q:"Based on the exhibit, which statement is correct?", ex:"SW2#show spanning-tree\nVLAN0001\n  Spanning tree enabled protocol rstp\n  Root ID    Priority    32769\n             Address     0c75.bd11.0000\n             Cost        4\n             Port        1 (GigabitEthernet0/1)\n             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec\n\n  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)\n             Address     0c75.bd3a.0000\n\nInterface           Role Sts Cost      Prio.Nbr Type\n------------------- ---- --- --------- -------- --------\nGi0/1               Root FWD 4         128.1    P2p\nGi0/2               Altn BLK 4         128.2    P2p\nGi0/5               Desg FWD 4         128.5    P2p", o:["SW2 is the root bridge for VLAN 1","SW2 reaches the root through Gi0/1 at a cost of 4, and Gi0/2 discards user frames but still receives BPDUs","Gi0/2 is faulty and should be replaced","Gi0/5 is blocking because it faces a PC"], a:1, why:"The Root ID address differs from SW2's own Bridge ID, so SW2 isn't root. Its root port is Gi0/1 (cost 4). Gi0/2 is an alternate port: a healthy standby that discards data but listens to BPDUs. Gi0/5 faces a PC and is a designated, forwarding port."},
  {lvl:3, q:"At 09:10 every user in VLAN 30 on one floor loses the network, and SSH to the floor switch times out. On the console the CPU is at 98% and you see the exhibit. What is the most likely cause, and the best first action?", ex:"FLOOR4#show logging | include MACFLAP\n*Oct 13 09:10:02.118: %SW_MATM-4-MACFLAP_NOTIF: Host 00aa.bb21.0a14 in vlan 30 is flapping between port Gi1/0/31 and port Gi1/0/32\n*Oct 13 09:10:02.804: %SW_MATM-4-MACFLAP_NOTIF: Host 5c26.0a11.93e4 in vlan 30 is flapping between port Gi1/0/31 and port Gi1/0/32\nFLOOR4#show spanning-tree vlan 30\nSpanning tree instance(s) for vlan 30 does not exist.", o:["A duplex mismatch on Gi1/0/31; set both ends to auto","A MAC flooding attack; enable port security on every port","A Layer 2 loop through Gi1/0/31 and Gi1/0/32 with STP disabled for VLAN 30; shut one of those ports, then remove the loop and re-enable STP for VLAN 30","The MAC table is full; clear it and lower the aging time"], a:2, why:"Several MACs flapping between the same two ports, high CPU and lost management all point to a loop, and STP is not running for VLAN 30, so nothing blocks it. Shutting one of the two ports breaks the loop at once. Then find the cable joining them and run spanning-tree vlan 30 so the next loop is blocked automatically."},
  {lvl:3, q:"A square of four 1 Gb/s switches: DS1 is root; DS2 and AS2 connect directly to DS1; AS1 connects to DS2 on Gi0/1 (its root port) and to AS2 on Gi0/2 (Altn BLK). The DS2–AS1 cable is cut. What happens on AS1?", o:["AS1 becomes the root bridge","Gi0/2 becomes AS1's root port with a root path cost of 8, and starts forwarding","AS1 is cut off, because its only root port has failed","Gi0/2 stays blocked until an engineer runs shutdown and no shutdown on it"], a:1, why:"The alternate port is a ready-made replacement path. Through AS2, AS1's root path cost is 4 (AS2 to DS1) + 4 (its own Gi0/2) = 8. Gi0/2 becomes the root port and forwards: almost instantly with RSTP, about 30 s with classic 802.1D, because this is a direct failure."},
  {lvl:3, q:"Users complain that PCs take about 30 seconds after boot before they can reach the network, and some get a 169.254 address. A colleague suggests running no spanning-tree vlan 10 on the access switches to fix it. What's the best response?", o:["Agree: STP isn't needed on access switches","Agree, but only outside working hours","Disagree: the delay is the listening and learning states on the desk ports. Keep STP and use PortFast (with BPDU guard) on desk ports and Rapid PVST+, so a looped cable can't take the VLAN down","Disagree: lower the max age timer to 6 seconds instead"], a:2, why:"A desk port walks through listening (15 s) and learning (15 s) before forwarding, which delays DHCP. Disabling STP removes the protection against loops: one patched cable could take down the whole VLAN. PortFast lets desk ports forward immediately, BPDU guard keeps them safe, and Rapid PVST+ speeds up the rest (lesson 5)."},
  {lvl:2, type:"multi", q:"Which three are port states in Rapid Spanning Tree (802.1w)? (Choose three.)", o:["Discarding","Learning","Forwarding","Listening","Blocking"], a:[0,1,2], why:"RSTP merges disabled, blocking and listening into one state, discarding, and keeps learning and forwarding. Listening and blocking are classic 802.1D states."},
  {lvl:2, q:"What does PVST+ mean for a Cisco switch carrying VLANs 10 and 20 on its trunks?", o:["One Spanning Tree for the whole switch, shared by every VLAN","A separate Spanning Tree instance per VLAN, so VLAN 10 and VLAN 20 can have different root bridges and block different ports","Spanning Tree runs only on VLAN 1","STP is replaced by EtherChannel on trunks"], a:1, why:"PVST+ (and Rapid PVST+) run one tree per VLAN, with per-VLAN BPDUs and bridge IDs (priority + VLAN + MAC). That lets you make different switches root for different VLANs, so each uplink carries some VLANs instead of sitting idle."},
],
cards:[
  {f:"Why is a Layer 2 loop catastrophic?", b:"Switches flood broadcasts out every other port and Ethernet has no TTL, so copies circle forever: broadcast storm, MAC table flapping (MACFLAP_NOTIF) and duplicate frames. High CPU, management lost."},
  {f:"Why doesn't the IP TTL stop a switching loop?", b:"Only routers read and decrement the IP TTL. Switches forward frames unchanged, and ARP broadcasts aren't IP at all."},
  {f:"What does Spanning Tree (802.1D) do?", b:"Switches exchange BPDUs, elect a root bridge, build one loop-free tree of forwarding ports and block the redundant ports, unblocking them if an active link fails."},
  {f:"BPDU", b:"Bridge Protocol Data Unit: STP message carrying root bridge ID, root path cost, sender bridge ID and port ID, and timers. Sent every 2 s (hello)."},
  {f:"Bridge ID", b:"Priority (default 32768, steps of 4096) + VLAN number (sys-id-ext) + switch MAC. Lowest wins the root election: priority first, MAC as tie-breaker."},
  {f:"STP port costs (short method)", b:"10 Mb/s = 100, 100 Mb/s = 19, 1 Gb/s = 4, 10 Gb/s = 2. Root path cost = sum of costs along the path to the root."},
  {f:"Root port: how it's chosen", b:"One per non-root switch. Lowest root path cost, then lowest neighbour bridge ID, then lowest neighbour port ID (priority, then number)."},
  {f:"Designated port", b:"One per link: the end whose switch has the lowest root path cost (then lowest BID, then lowest port ID). All root bridge ports are designated. Forwards."},
  {f:"Alternate port (Altn BLK)", b:"Neither root nor designated. Discards user frames but keeps receiving BPDUs; a ready replacement for the root port. Only one end of the link blocks."},
  {f:"802.1D states and timers", b:"Blocking, listening (15 s), learning (15 s), forwarding, plus disabled. Hello 2 s, max age 20 s, forward delay 15 s: 30 s direct failure, 50 s indirect."},
  {f:"RSTP (802.1w) vs 802.1D", b:"Same election and costs. States: discarding, learning, forwarding. Roles add alternate and backup. Proposal/agreement on point-to-point links: about a second instead of 30–50 s."},
  {f:"PVST+ / Rapid PVST+", b:"Cisco's one-tree-per-VLAN versions of 802.1D / RSTP. Different VLANs can have different roots and blocked ports. Catalyst 9000 default: rapid-pvst; 2960: pvst."},
  {f:"%SW_MATM-4-MACFLAP_NOTIF", b:"A MAC keeps moving between two ports. The classic sign of a Layer 2 loop: follow the two ports named to find the cable closing the loop."},
],
});
// ---------- Module 4 · Lesson 5 ----------
L.push({
id:"stp-practice", mins:80, level:"Beginner+ · builds on Module 4 lesson 4",
t:"Spanning Tree in practice: Rapid PVST+, controlling the root, PortFast and the guards",
html:`
${K.goals([
  "Explain why Rapid PVST+ converges in about a second, not 30–50 seconds, and switch a Catalyst to it.",
  "Put the root bridge where it belongs with <code>spanning-tree vlan N priority</code> or the <code>root primary</code> / <code>root secondary</code> macros — and say what those macros really write.",
  "Share the load between two distribution switches with per-VLAN roots, and prove it with <code>show spanning-tree</code>.",
  "Configure PortFast and BPDU guard on desk ports, recognise an err-disabled port, and recover it in the right order.",
  "Say where root guard and loop guard go, and how each differs from BPDU guard.",
])}
${K.pre(["Module 4 lesson 4: BPDUs, the bridge ID, root election, port costs, port roles and the 802.1D states.","Module 4 lessons 1–2 (access ports, trunks) and Module 2 (<code>show interfaces status</code>, err-disabled ports, the console bench)."])}

<h2>Why this matters at work</h2>
<p>An insurance company in Ikoyi has two Catalyst 9300 distribution switches in its comms room. After a weekend of UPS maintenance, the third floor says the file server is slow. Nothing is broken: Spanning Tree is doing what it was told, and nobody told it anything. With every priority at the default, the switch with the <b>lowest MAC address</b> won the root election — a 2009 Catalyst 2960 in the second-floor closet — so third-floor traffic detours through that closet to reach the comms room.</p>
<p>The same week, a new hire plugs a small switch from home into his desk socket. The port goes dark and he raises a ticket. The engineer who answers needs to know why the switch did that, why it was right to, and how to bring the port back. This lesson covers the Spanning Tree settings engineers put on every switch: the fast protocol, a root chosen on purpose, and the guards.</p>

<h2>Rapid PVST+: the Spanning Tree you actually run</h2>
<p>Lesson 4's ${K.g("802.1D","The original Spanning Tree standard. Ports move blocking → listening → learning → forwarding on timers.")} rules — elect a root, choose root and designated ports, block the rest — are still the foundation. What changed is <b>how fast</b> a port may start forwarding, and <b>how many trees</b> a switch runs.</p>
<h3>Why classic Spanning Tree is slow</h3>
<p>A classic port that might be needed spends 15 seconds <b>listening</b> and 15 seconds <b>learning</b> (each one ${K.g("forward delay","15 seconds by default: the time a classic port spends in listening, then again in learning.")}) before it forwards. It can't ask its neighbour &ldquo;is it safe?&rdquo;, so it waits. After a failure it can't see directly, it first waits out the ${K.g("max age","20 seconds by default: how long a switch keeps BPDU information it has stopped hearing.")} of 20 seconds as well: up to 50 seconds of frozen network, and dropped calls.</p>
<h3>What Rapid Spanning Tree changes</h3>
<p>${K.g("RSTP","Rapid Spanning Tree, IEEE 802.1w: the same election, but neighbours agree instead of waiting.")} keeps the same bridge IDs, costs and roles, and replaces the waiting with conversation:</p>
<ul>
<li><b>A handshake instead of a timer.</b> On a ${K.g("point-to-point link","A full-duplex link with exactly two switches on it. Half-duplex links are 'shared' and fall back to timers.")}, the upstream switch sends a <i>proposal</i>; the downstream switch makes its own ports safe and replies with an <i>agreement</i>. The port forwards, typically in well under a second.</li>
<li><b>A backup is ready.</b> The alternate port is a pre-computed replacement root port. If the root port fails, the alternate takes over at once.</li>
<li><b>Edge ports.</b> An ${K.g("edge port","An RSTP port leading to an end device. It forwards as soon as the link comes up. On Cisco, PortFast makes a port an edge port.")} to a PC or printer forwards the instant the link comes up — that is PortFast, below.</li>
</ul>
<p>RSTP has three states — <b>discarding</b> (replacing disabled, blocking and listening), <b>learning</b>, <b>forwarding</b> — and adds a ${K.g("backup port","A second port of the same switch on one shared (hub) segment. Rare today.")} role you will rarely see.</p>
${K.analogy(`<p>Classic STP is a driver at a blind junction who always waits 30 seconds. Rapid STP adds a warden: &ldquo;clear?&rdquo; &ldquo;clear!&rdquo; — and traffic moves in a second, under the same road rules.</p>`)}
<h3>PVST+, Rapid PVST+ and MST</h3>
<p>Cisco's ${K.g("PVST+","Per-VLAN Spanning Tree Plus: a separate 802.1D tree for every VLAN, each with its own root and blocked ports.")} runs <b>one tree per VLAN</b> — that's why <code>show spanning-tree</code> prints a block per VLAN and the bridge ID carries the VLAN number. ${K.g("Rapid PVST+","Cisco's per-VLAN RSTP: one rapid tree per VLAN. The default on Catalyst 9000.")} is the same idea with the rapid rules. ${K.g("MST","Multiple Spanning Tree, IEEE 802.1s: maps many VLANs onto a few RSTP instances.")} (${K.g("802.1s","The IEEE standard that defined Multiple Spanning Tree (MST). It was later folded into 802.1Q.")}) maps groups of VLANs onto a few instances. For the CCNA, know it exists; you won't configure it.</p>
${K.when([
  ["Rapid PVST+","Almost every Cisco campus and office","Fast convergence plus a root per VLAN for load sharing","Hundreds of VLANs on switches with weak CPUs"],
  ["PVST+ (classic)","Only very old kit, or a lab about 802.1D timers","Nothing — it is the slow version","Anywhere a 30–50 s outage hurts"],
  ["MST","Large or multi-vendor networks with many VLANs","Few trees; open IEEE standard","Small networks: more design for no gain"],
], "Which Spanning Tree mode — and why")}
<h3>Checking and changing the mode</h3>
<p>Catalyst 9000 switches start in <code>rapid-pvst</code>; older Catalyst 2960s start in <code>pvst</code>. One global command changes it:</p>
${K.out(`ACC-2F(config)#spanning-tree mode rapid-pvst
ACC-2F(config)#end
ACC-2F#show spanning-tree summary
Switch is in rapid-pvst mode
Root bridge for: none
Portfast Default                        is disabled
PortFast BPDU Guard Default             is disabled

Name                   Blocking Listening Learning Forwarding STP Active
---------------------- -------- --------- -------- ---------- ----------
VLAN0010                     1         0        0          5          6
VLAN0020                     1         0        0          5          6`, "show spanning-tree summary on a real Catalyst (trimmed). The lab switches print the first lines only.")}
<p>On an access switch, <b>Root bridge for</b> should say <code>none</code>. Changing the mode restarts Spanning Tree on the switch, so use a ${K.g("maintenance window","An agreed quiet time (often evening or weekend) when users expect a short outage, so risky changes are made then.")}.</p>
${K.dyk(`Rapid and classic switches interoperate. A Rapid PVST+ port that hears old-style BPDUs falls back to 802.1D on that one port (shown as <code>P2p Peer(STP)</code>) — loop-free, but slow. The 2004 edition of 802.1D folded RSTP in and retired the original algorithm.`)}
${K.exam(`Classic STP: about 30 s (2 × 15 s forward delay) for a new port, up to 50 s (20 s max age + 30 s) for an indirect failure. RSTP: about a second on point-to-point links. RSTP states: <b>discarding, learning, forwarding</b>; roles: root, designated, alternate, backup. &ldquo;Cisco's per-VLAN implementation of 802.1w&rdquo; = Rapid PVST+.`)}
${K.check({q:"A floor of Catalyst 2960s takes about 30 seconds to forward on a new uplink, while the core 9300s recover in about a second. Most likely reason?", o:["The 2960s have slower CPUs","The 2960s are still in their default pvst mode, using 802.1D timers","The 9300s have PortFast on their uplinks","The 2960s have a lower bridge priority"], a:1, why:"Older 2960s default to pvst: 15 s listening plus 15 s learning. spanning-tree mode rapid-pvst gives them the proposal/agreement handshake."})}

<h2>Reading show spanning-tree, line by line</h2>
<p>Here is the insurance company's DIST1 on Monday morning — <b>not</b> the root.</p>
${K.out(`DIST1#show spanning-tree vlan 10

VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    32778
             Address     0019.e7a1.0000
             Cost        4
             Port        2 (GigabitEthernet1/0/2)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32778  (priority 32768 sys-id-ext 10)
             Address     7c21.0e4a.0000
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi1/0/1             Altn BLK 4         128.1    P2p
Gi1/0/2             Root FWD 4         128.2    P2p
Gi1/0/3             Desg FWD 4         128.3    P2p
Gi1/0/4             Desg FWD 4         128.4    P2p Edge`, "A distribution switch that lost the root election to an old access switch.")}
${K.steps([
  ["VLAN0010 · protocol rstp", `<p>One block per VLAN. <code>rstp</code> = Rapid PVST+; classic PVST+ prints <code>ieee</code>.</p>`],
  ["Root ID", `<p>Priority <b>32778</b> (default 32768 + VLAN 10) and Address <b>0019.e7a1.0000</b> identify the root. That MAC belongs to ACC1, an access switch: the problem in one line.</p>`],
  ["Cost and Port", `<p>This switch's root path cost (4 = one gigabit link) and its root port, Gi1/0/2. On the root itself, these lines become <code>This bridge is the root</code>.</p>`],
  ["Bridge ID", `<p>This switch, split into configured priority and VLAN. If it matches the Root ID, you are on the root.</p>`],
  ["The interface table", `<p><b>Role</b>: Root, Desg, Altn, Back. <b>Sts</b>: FWD, BLK (discarding), LRN. <b>Prio.Nbr</b>: port priority and number (128.1), lesson 4's tie-breaker. <b>Type</b>: <code>P2p</code> switch link, <code>P2p Edge</code> PortFast port, <code>Shr</code> shared (half duplex).</p>`],
])}
<p>Note Gi1/0/1, DIST1's link to its partner: blocked, because the tree is built around a closet switch.</p>
<h3>Try it on paper: who wins, and what blocks?</h3>
<p>Three switches in a triangle, all links cost 4, VLAN 30: CORE-A has <code>spanning-tree vlan 30 priority 24576</code> and MAC <code>7c21.0e4a.0000</code>; CORE-B (MAC <code>7c21.0e3b.0000</code>) and ACC-1 (MAC <code>0019.e7a1.0000</code>) have no priority set. Write down each switch's Bridge ID priority, the root, and which end of which link blocks.</p>
${K.hint(`Add 30 to each priority. Lowest wins; MAC only breaks a tie. CORE-B and ACC-1 both reach the root at cost 4, so on the link between them the lower bridge ID is designated — and the other end blocks.`)}
${K.reveal("Show the answer",`<p>CORE-A 24606, CORE-B 32798, ACC-1 32798. CORE-A is root (without that one line, ACC-1 would have won on its lower MAC). On the CORE-B ↔ ACC-1 link the priorities tie, so the MAC decides: ACC-1 is designated and <b>CORE-B's port towards ACC-1 blocks</b>. The access switch's end blocks only once CORE-B's priority is lowered too — the job of <code>root secondary</code>.</p>`)}
${K.q({type:"fill", q:"DIST1 has spanning-tree vlan 30 priority 24576. What number follows Priority in DIST1's Bridge ID line in show spanning-tree vlan 30?", fields:[{label:"Priority shown", a:["24606"]}], why:"The advertised priority is the configured value plus the VLAN number: 24576 + 30 = 24606, shown as (priority 24576 sys-id-ext 30)."})}
${K.check({q:"show spanning-tree vlan 10 shows the same Address under Root ID and Bridge ID, and This bridge is the root. Which is true?", o:["Every port on this switch is a root port","Every forwarding port on this switch for VLAN 10 is designated","The switch is root for every VLAN","The switch has no alternate ports in any VLAN"], a:1, why:"The root has no root port: all its active ports are designated for that VLAN. Being root is per VLAN — another switch may be root for VLAN 20."})}

<h2>Choosing the root on purpose</h2>
<p>Left alone, the election picks the lowest MAC, and manufacturers hand MACs out in order — so the root is usually your <b>oldest</b> switch. Put it instead in the <b>middle of the traffic</b>: the core, or the distribution pair that access switches uplink to. Root ports then point straight at the servers and gateways. Choose a <b>secondary</b> too, usually the other distribution switch.</p>
${K.svg("0 0 760 300",
  [0,380].map((ox,p)=>
    K.band(ox+10,6,350,24,p?"After: DIST1 root, DIST2 secondary":"Before: ACC1 root by accident (lowest MAC)")+
    K.link(ox+106,70,ox+264,70)+K.link(ox+80,82,ox+80,206)+K.link(ox+290,82,ox+290,206)+K.link(ox+100,82,ox+270,206)+K.link(ox+270,82,ox+100,206)+
    K.dev("switch",ox+80,70,"DIST1",p?"ROOT · 24576":"32768")+K.dev("switch",ox+290,70,"DIST2",p?"28672":"32768")+
    K.dev("switch",ox+80,218,"ACC1",p?"32768":"ROOT · 0019.e7a1")+K.dev("switch",ox+290,218,"ACC2","32768 · PC-A")+
    (p
      ? `<circle cx="${ox+118}" cy="182" r="7" fill="var(--warn)"/><circle cx="${ox+290}" cy="186" r="7" fill="var(--warn)"/>`+K.txt(ox+130,176,"BLK",{c:"warn",s:10,b:true})+K.txt(ox+302,180,"BLK",{c:"warn",s:10,b:true})+
        K.arrow(ox+262,198,ox+112,90,"",true)+K.txt(ox+185,288,"PC-A → SRV: ACC2 → DIST1 (one hop)",{c:"accent",s:10.5,mid:true})
      : `<circle cx="${ox+122}" cy="70" r="7" fill="var(--warn)"/><circle cx="${ox+256}" cy="194" r="7" fill="var(--warn)"/>`+K.txt(ox+122,56,"BLK",{c:"warn",s:10,b:true,mid:true})+K.txt(ox+222,200,"BLK",{c:"warn",s:10,b:true,end:true})+
        K.arrow(ox+302,198,ox+302,92,"",true)+K.arrow(ox+274,96,ox+112,204,"",true)+K.arrow(ox+68,198,ox+68,92,"",true)+K.txt(ox+185,288,"PC-A → SRV: ACC2 → DIST2 → ACC1 → DIST1",{c:"accent",s:10.5,mid:true})
    )).join(""),
  "Same five links, two trees. Left: the default election made a closet switch root, so ACC2's traffic to the server on DIST1 detours through ACC1. Right: root and secondary chosen; each access switch blocks its second uplink.")}
<h3>Option 1: set the priority yourself</h3>
<p>Because the low 12 bits carry the VLAN number, the priority moves in steps of <b>4096</b>, from 0 to 61440:</p>
${K.out(`DIST1(config)#spanning-tree vlan 10 priority 30000
% Bridge Priority must be in increments of 4096.
% Allowed values are:
  0     4096  8192  12288 16384 20480 24576 28672
  32768 36864 40960 45056 49152 53248 57344 61440
DIST1(config)#spanning-tree vlan 10 priority 24576`, "The 16 legal priorities. Lower wins; 32768 is the default.")}
<p>It takes lists and ranges: <code>spanning-tree vlan 10,20 priority 24576</code> or <code>spanning-tree vlan 1-4094 priority 24576</code>.</p>
<h3>Option 2: root primary and root secondary</h3>
<p><code>spanning-tree vlan 10 root primary</code> is a ${K.g("macro","A command that works something out once and writes ordinary config lines. It doesn't stay active.")}: it sets <b>24576</b> if that wins, or <b>4096 less than the current root's priority</b> if the root is already below 24576. <code>root secondary</code> sets <b>28672</b> — better than any default switch, worse than the primary. Neither is a standing order; each calculates once and writes a plain line:</p>
${K.out(`DIST2(config)#spanning-tree vlan 20 root primary
DIST2(config)#spanning-tree vlan 10 root secondary
DIST2(config)#end
DIST2#show running-config | include spanning-tree
spanning-tree mode rapid-pvst
spanning-tree extend system-id
spanning-tree vlan 10 priority 28672
spanning-tree vlan 20 priority 24576`, "The macros leave only the priorities they chose. (Captured on the bench below.)")}
<p>A switch added later with priority 4096 still wins — so many engineers type explicit priorities (<b>4096 root, 8192 secondary</b>), and root guard (later in this lesson) exists.</p>
${K.remember(`<b>&ldquo;Two-four for the boss, two-eight for the deputy.&rdquo;</b> root primary 24576 (or 4096 below the current root), root secondary 28672, default 32768, steps of 4096, range 0–61440.`)}
${K.mistake(`Setting the root for today's VLANs and forgetting next year's. Priority is <b>per VLAN</b>: create VLAN 30 in March and its tree starts at 32768 everywhere, so the old closet switch is root again for VLAN 30. Use a range on the root, or put the priority on your &ldquo;new VLAN&rdquo; checklist.`)}
<h3>Per-VLAN load sharing</h3>
<p>With one root for every VLAN, each access switch blocks its uplink to the secondary, and that uplink carries nothing until something fails. Because PVST+ runs a tree per VLAN, make <b>DIST1 root for VLAN 10 and DIST2 root for VLAN 20</b>: in VLAN 10 each access switch forwards towards DIST1 and blocks towards DIST2, and in VLAN 20 the reverse: <code>root primary</code> for one VLAN and <code>root secondary</code> for the other on each switch. Both uplinks work, and each switch backs up the other.</p>
${K.svg("0 0 760 270",
  [[0,"VLAN 10 · root DIST1"],[380,"VLAN 20 · root DIST2"]].map(([ox,t],p)=>
    K.band(ox+10,6,350,24,t)+
    K.dev("switch",ox+90,70,"DIST1",p?"28672 (backup)":"24576 (root)")+K.dev("switch",ox+280,70,"DIST2",p?"24576 (root)":"28672 (backup)")+
    K.dev("switch",ox+90,200,"ACC1","")+K.dev("switch",ox+280,200,"ACC2","")+
    K.link(ox+116,70,ox+254,70)+
    K.link(ox+90,82,ox+90,188,"",!!p)+K.link(ox+280,82,ox+280,188,"",!p)+
    K.link(ox+110,82,ox+262,188,"",!!p)+K.link(ox+262,82,ox+110,188,"",!p)+
    (p
      ? `<circle cx="${ox+90}" cy="170" r="6" fill="var(--warn)"/><circle cx="${ox+250}" cy="178" r="6" fill="var(--warn)"/>`
      : `<circle cx="${ox+280}" cy="170" r="6" fill="var(--warn)"/><circle cx="${ox+122}" cy="178" r="6" fill="var(--warn)"/>`)
  ).join("")+
  K.txt(380,262,"solid = forwarding for this VLAN · dashed + amber dot = blocked at the access switch end",{s:10.5,mid:true}),
  "Per-VLAN load sharing: the same four uplinks carry two trees. Every uplink forwards for one VLAN and stands by for the other.")}
${K.tip(`Keep each VLAN's STP root and its <b>default gateway</b> on the same switch. Later you'll meet ${K.g("HSRP","Hot Standby Router Protocol: two Layer 3 switches share one virtual gateway IP; one is active.")}; if DIST1 is root for VLAN 10 but DIST2 is its active gateway, every VLAN 10 packet crosses the inter-switch link for nothing.`)}
<h3>Port cost and port priority: rarely needed</h3>
<p><code>spanning-tree cost N</code> on an interface changes that port's cost, so <b>this</b> switch may choose a different root port (IOS also has a per-VLAN form, <code>spanning-tree vlan 10 cost N</code>). <code>spanning-tree port-priority N</code> (0–240 in steps of 16, default 128) changes the port ID this switch advertises — the <b>downstream</b> switch uses it to choose between two of its own ports leading here. Use them rarely — each tweak is a hidden exception for the next engineer. Put the root in the right place first.</p>
${K.check({q:"DIST1 is root for VLAN 10 with priority 24576 and a lower MAC address than DIST2. A colleague types spanning-tree vlan 10 root primary on DIST2. What priority does DIST2 get?", o:["24576, so the MAC decides","20480, 4096 below DIST1","0, the lowest possible","28672"], a:1, why:"24576 would only tie with DIST1, and DIST1's lower MAC would still win, so the macro sets 4096 less than the current root: 20480. DIST2 takes the root — root primary on the wrong switch is a real outage risk."})}

<h3>Hands-on: move the root and share the load</h3>
<p>The insurance company in miniature: the DIST1/DIST2 pair, ACC1 (the 2009 closet switch with the low MAC), ACC2 with PC-A, and ${K.g("SRV","The bench's server (10.10.10.50). SRV is a common short name for a server in device labels and hostnames.")} on DIST1. All run Rapid PVST+ with default priorities. The frame log shows the path.</p>
${K.bench({id:"m4-stp-root", points:90, from:"CCNA · Module 4 · lesson 5", title:"move the root to the core and split VLANs 10 and 20", viewBox:"0 0 760 490", openLog:true, power:true,
  intro:"Build sheet: inter-switch links are trunks allowing VLANs 10 and 20; PC-A and SRV are in VLAN 10 (10.10.10.0/24). The console is on DIST1. Amber light = blocking; click a port to see its role per VLAN.",
  devices:[
    {id:"dist1", kind:"switch", label:"DIST1", model:"Catalyst 9300 · distribution", x:40, y:20, mac:"7c21.0e4a", ports:[1,2,3,4].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})).concat([{id:"con", type:"console", label:"CON"}]),
      config:e=>{ ["en","conf t","hostname DIST1","vlan 10","name STAFF","vlan 20","name VOICE-PRINT","exit","interface range g0/1 - 3","switchport mode trunk","switchport trunk allowed vlan 10,20","interface g0/4","description SRV","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"dist2", kind:"switch", label:"DIST2", model:"Catalyst 9300 · distribution", x:480, y:20, mac:"7c21.0e3b", ports:[1,2,3,4].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})).concat([{id:"con", type:"console", label:"CON"}]),
      config:e=>{ ["en","conf t","hostname DIST2","vlan 10","name STAFF","vlan 20","name VOICE-PRINT","exit","interface range g0/1 - 3","switchport mode trunk","switchport trunk allowed vlan 10,20","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"acc1", kind:"switch", label:"ACC1", model:"Catalyst 2960 · 2nd-floor closet (2009)", x:40, y:260, mac:"0019.e7a1", ports:[1,2,3,4].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})).concat([{id:"con", type:"console", label:"CON"}]),
      config:e=>{ ["en","conf t","hostname ACC1","vlan 10","name STAFF","vlan 20","name VOICE-PRINT","exit","interface range g0/1 - 3","switchport mode trunk","switchport trunk allowed vlan 10,20","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"acc2", kind:"switch", label:"ACC2", model:"Catalyst 9200 · 3rd floor", x:480, y:260, mac:"a0f8.4911", ports:[1,2,3,4].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})).concat([{id:"con", type:"console", label:"CON"}]),
      config:e=>{ ["en","conf t","hostname ACC2","vlan 10","name STAFF","vlan 20","name VOICE-PRINT","exit","interface range g0/1 - 3","switchport mode trunk","switchport trunk allowed vlan 10,20","interface g0/4","description PC-A","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"srv", kind:"server", label:"SRV", x:300, y:20, ip:"10.10.10.50", mask:"255.255.255.0", gw:"10.10.10.1", mac:"0050.56a0.0050"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:300, y:200},
    {id:"pca", kind:"pc", label:"PC-A", x:480, y:380, ip:"10.10.10.21", mask:"255.255.255.0", gw:"10.10.10.1", mac:"a4bb.6d00.0a21"},
  ],
  cables:[ {type:"cat6", a:"dist1:g1", b:"dist2:g1"}, {type:"cat6", a:"dist1:g2", b:"acc1:g1"}, {type:"cat6", a:"dist1:g3", b:"acc2:g1"}, {type:"cat6", a:"dist2:g2", b:"acc1:g2"}, {type:"cat6", a:"dist2:g3", b:"acc2:g2"},
           {type:"cat6", a:"srv:eth", b:"dist1:g4"}, {type:"cat6", a:"pca:eth", b:"acc2:g4"}, {type:"console", a:"lap:usb", b:"dist1:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Open the laptop's Terminal app on DIST1 (9600 8N1, no flow control), <code>enable</code>, and run <code>show spanning-tree vlan 10</code>. The Root ID address <code>0019.e7a1.0000</code> is ACC1 — the old closet switch — and DIST1's Gi0/1 to DIST2 is <code>Altn BLK</code>", done:B=>B.devs.dist1.env.log.some(l=>/VLAN0010/.test(l.out) && /0019\.e7a1/.test(l.out))},
    {text:"From PC-A's Command Prompt, <code>ping 10.10.10.50</code> (SRV). In the frame log, follow the echo request: ACC2 → DIST2 → ACC1 → DIST1. A second-floor closet is carrying third-floor traffic", done:B=>Bench.pinged(B,"pca","10.10.10.50")},
    {text:"On DIST1, <code>conf t</code> then <code>spanning-tree vlan 10 priority 24576</code>. Watch the amber lights move: DIST1 is now root for VLAN 10", done:B=>Bench.stpRoot(B,10)==="dist1"},
    {text:"Still on DIST1, make it the backup for VLAN 20 with <code>spanning-tree vlan 20 priority 28672</code>, then <code>end</code> and <code>write memory</code>", done:B=>{ const s = B.devs.dist1.env.startup; return !!(s && s.stpPrio && s.stpPrio[10]===24576 && s.stpPrio[20]===28672); }},
    {text:"Move the console cable to DIST2. There: <code>spanning-tree vlan 20 root primary</code> and <code>spanning-tree vlan 10 root secondary</code>. Check with <code>show running-config | include spanning-tree</code> — the macros wrote plain priorities", done:B=>Bench.stpRoot(B,20)==="dist2" && B.devs.dist2.env.stpPrio[10]===28672},
    {text:"Click ACC2's ports 1 and 2: in VLAN 10 port 1 (to DIST1) is the root port and port 2 blocks; in VLAN 20 it is the mirror image. Both uplinks now carry traffic", done:B=>Bench.stpRoot(B,10)==="dist1" && Bench.stpRoot(B,20)==="dist2" && Bench.stpRole(B,"acc2","g1",10)==="Root FWD" && Bench.stpRole(B,"acc2","g2",10)==="Altn BLK" && Bench.stpRole(B,"acc2","g1",20)==="Altn BLK" && Bench.stpRole(B,"acc2","g2",20)==="Root FWD"},
    {text:"Ping SRV from PC-A again. The log now shows ACC2 → DIST1 directly; ACC2 learns SRV on Gi0/1", done:B=>Bench.pinged(B,"pca","10.10.10.50") && Bench.macPort(B,"acc2","0050.56a0.0050")==="Gi0/1"},
    {text:"Test the secondary: power off DIST1, then on DIST2 run <code>show spanning-tree vlan 10</code> — <i>This bridge is the root</i>. ACC1 did not take over. Power DIST1 back on", done:B=>B.devs.dist1.on && B.devs.dist2.env.log.some(l=>{ const i = l.out.indexOf("VLAN0010"); if (i<0) return false; const j = l.out.indexOf("VLAN0020", i); return /This bridge is the root/.test(l.out.slice(i, j<0 ? undefined : j)); })},
  ],
  win:"You found an accidental root, moved it to the distribution layer with one command, split VLANs 10 and 20 between the two distribution switches, watched the blocked ports move to the access-switch ends, and proved the secondary takes over when the root dies.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show spanning-tree vlan 10"],
    ["pc","pca","ping 10.10.10.50"],
    ["term","conf t"],["term","spanning-tree vlan 10 priority 24576"],["term","spanning-tree vlan 20 priority 28672"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","dist2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","conf t"],["term","spanning-tree vlan 20 root primary"],["term","spanning-tree vlan 10 root secondary"],["term","end"],["term","show running-config | include spanning-tree"],
    ["pc","pca","ping 10.10.10.50"],
    ["power","dist1",false],["term","show spanning-tree vlan 10"],["power","dist1",true]]})}
${K.hint(`After moving the console cable, open the Terminal app again: a new device means a new session. Put a priority on the wrong VLAN? <code>no spanning-tree vlan 20 priority</code> returns it to 32768.`)}
<p>Look at what moved. Before, the blocks sat in the core and on ACC2's link to DIST1. After the first command, the third floor reached the server in one hop. Once the secondary was set, DIST2 outranked ACC1 too, so the blocks moved to the <b>access-switch ends</b> of the uplinks — where spare capacity should wait. When DIST1 died, DIST2 took VLAN 10, because 28672 beats 32768.</p>
${K.mistake(`Pulling the power on the root to &ldquo;test failover&rdquo; before saving. A real switch reboots with its startup-config, so an unsaved priority vanishes and the old closet switch is root again. That's why the bench had you <code>write memory</code> first.`)}

<h2>PortFast and BPDU guard: protecting the desk ports</h2>
<h3>PortFast: no waiting on edge ports</h3>
<p>On a classic port, a booting PC sends its DHCP requests into 30 seconds of listening and learning and may give up with a 169.254 address; network boot (${K.g("PXE","Preboot Execution Environment: a PC starts up from the network instead of its own disk, fetching its boot files from a server. IT teams use it to install Windows or Linux on many machines at once.")}) can fail outright. A desk port leads to one host that can't make a loop, so there is nothing to wait for. ${K.g("PortFast","Makes an access port forward as soon as the link comes up (an edge port).")} says so: the port forwards as soon as the link is up. Nor does it cause a ${K.g("topology change","An STP event that makes switches flush learned MACs.")} when a PC boots or shuts down, so 8 a.m. doesn't flush every MAC table a hundred times.</p>
${K.svg("0 0 760 230",
  K.txt(20,18,"seconds after the cable is plugged in →",{s:10.5})+
  [0,5,10,15,20,25,30].map(s=>K.txt(220+s*15,32,String(s),{s:10,mid:true})).join("")+
  K.txt(20,64,"Classic STP port",{c:"fg",s:11.5,f:"body",b:true})+K.txt(20,78,"(pvst, no PortFast)",{s:10})+
  K.band(220,52,225,28,"listening · 15 s","var(--chip)")+K.band(445,52,225,28,"learning · 15 s","var(--chip)")+K.band(670,52,80,28,"forwarding","var(--ok)")+
  K.txt(20,124,"Rapid PVST+ switch link",{c:"fg",s:11.5,f:"body",b:true})+K.txt(20,138,"(point-to-point)",{s:10})+
  K.band(220,112,24,28,"","var(--chip)")+K.band(244,112,506,28,"forwarding after proposal / agreement (< 1 s)","var(--ok)")+
  K.txt(20,184,"PortFast / edge port",{c:"fg",s:11.5,f:"body",b:true})+K.txt(20,198,"(classic or rapid)",{s:10})+
  K.band(220,172,530,28,"forwarding from the moment the link comes up","var(--ok)")+
  K.arrow(250,222,250,84,"",true)+K.txt(258,220,"PC's first DHCP requests go out here",{c:"accent",s:10.5}),
  "On a classic port, the host's first DHCP requests fall into 30 seconds of listening and learning and are dropped.")}
${K.out(`ACC-3F(config)#interface range g1/0/1 - 24
ACC-3F(config-if-range)#switchport mode access
ACC-3F(config-if-range)#spanning-tree portfast
%Warning: portfast should only be enabled on ports connected to a single
 host. Connecting hubs, concentrators, switches, bridges, etc... to this
 interface  when portfast is enabled, can cause temporary bridging loops.
 Use with CAUTION

%Portfast will be configured in 24 interfaces due to the range command
 but will only have effect when the interfaces are in a non-trunking mode.
ACC-3F(config-if-range)#exit
ACC-3F(config)#spanning-tree portfast default`, "PortFast on a range of desk ports, or globally. IOS warns you every time, and the warning is the lesson.")}
<p><code>spanning-tree portfast default</code> covers every access-mode port and never trunks, so it is safe in an access-switch template. Newer IOS XE also accepts <code>spanning-tree portfast edge</code>. A trunk to a server or router can be made an edge port with <code>spanning-tree portfast trunk</code> — only if the far end is a host.</p>
<h3>Why never on a port facing a switch</h3>
<p>PortFast promises &ldquo;nothing behind this port can make a loop&rdquo;. Connect a switch and the promise is false: the port forwards at once, and if that switch has another path back into your network, frames circle until Spanning Tree catches up — lesson 4's broadcast storm. On RSTP an edge port that hears a BPDU drops its edge status, but the stranger's switch still joins the election — and could win it. Hence BPDU guard.</p>
<h3>BPDU guard: a desk port that hears a switch shuts itself</h3>
<p>PCs, printers and phones never send BPDUs; only switches do. ${K.g("BPDU guard","On a port that should face only hosts: any BPDU arriving puts the port into err-disabled at once.")} turns that into a rule: <b>a BPDU arrives, the port is err-disabled</b>. The light turns amber and the log says why:</p>
${K.out(`%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port GigabitEthernet1/0/15 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Gi1/0/15, putting Gi1/0/15 in err-disable state`, "The two messages BPDU guard writes. Search the log for BPDUGUARD when a desk port goes dead.")}
<ul>
<li><code>spanning-tree bpduguard enable</code> (interface) — on that port, with or without PortFast.</li>
<li><code>spanning-tree portfast bpduguard default</code> (global) — on every <b>PortFast</b> port. With <code>portfast default</code>, every desk port is fast and guarded and trunks are untouched.</li>
</ul>
<p>It catches two desk accidents. A small <b>managed</b> switch runs STP and sends BPDUs. A cheap <b>unmanaged</b> switch looped — cabled to two wall sockets, or with a spare cable between two of its own ports — doesn't run STP, but carries your switch's own BPDUs around the loop and back into a guarded port. An unmanaged switch with no loop sends no BPDUs; port security (later) handles that.</p>
<h3>err-disabled: finding it and recovering it</h3>
<p>From Module 2, an ${K.g("err-disabled","The switch itself shut the port after a violation (BPDU guard, port security...). It stays down until recovered.")} port is one the switch shut by itself.</p>
${K.out(`ACC-3F#show interfaces status err-disabled

Port      Name               Status       Reason               Err-disabled Vlans
Gi1/0/15  DESK-3.12 TUNDE    err-disabled bpduguard`, "Real Catalyst: only the shut ports, with the reason. On the bench, use show interfaces status (or | include err).")}
${K.steps([
  ["Remove the cause", `<p>Unplug the rogue switch or the looping cable. Skip this and the next BPDU err-disables the port again.</p>`],
  ["Bounce the port", `<p><code>interface g1/0/15</code>, <code>shutdown</code>, <code>no shutdown</code>. Shutdown clears the err-disabled state.</p>`],
  ["Verify", `<p><code>show interfaces status</code> says <code>connected</code>; the user's PC gets an address.</p>`],
])}
<p><code>errdisable recovery cause bpduguard</code> makes the switch retry by itself after the interval (300 seconds by default, <code>errdisable recovery interval</code>). If the rogue switch is still there, the port flaps every five minutes, so many teams keep it manual. (Not modelled in the lab.)</p>
${K.dodont([
  "Put <code>spanning-tree portfast default</code> and <code>spanning-tree portfast bpduguard default</code> in every access-switch template.",
  "Use PortFast on ports to PCs, printers, phones, cameras and single-NIC servers.",
  "Remove the cause before <code>shutdown</code> / <code>no shutdown</code>.",
  "Record the port, the device and the person — BPDU guard events are security events.",
],[
  "Don't enable PortFast on uplinks or any switch-facing port.",
  "Don't &ldquo;fix&rdquo; a BPDU guard err-disable by removing BPDU guard.",
  "Don't use <code>spanning-tree bpdufilter</code> to quieten a port: it stops BPDUs both ways and can let a real loop form.",
  "Don't set automatic recovery and forget it — a flapping desk port is a ticket nobody raised.",
])}
${K.check({q:"A switch has spanning-tree portfast default and spanning-tree portfast bpduguard default. Its trunk to the distribution switch, Gi1/0/48, receives BPDUs every 2 seconds. What happens to Gi1/0/48?", o:["BPDU guard err-disables it","Nothing: both defaults apply only to access (PortFast) ports, not trunks","It becomes an edge port","It goes root-inconsistent"], a:1, why:"portfast default covers non-trunking access ports, and portfast bpduguard default covers PortFast ports. The trunk is a normal STP port; BPDUs there are expected."})}

<h3>Hands-on: plug a home switch into a guarded desk port</h3>
<p>ACC-3F is built from the company template: desk ports Gi0/1–5 in VLAN 10, PortFast and BPDU guard as global defaults, uplink Gi0/6 trunked to DIST1. Tunde has brought a small managed switch from home (HOME-SW) — like most managed switches, it runs Spanning Tree — and his PC is plugged into it.</p>
${K.bench({id:"m4-bpduguard", points:70, from:"CCNA · Module 4 · lesson 5", title:"BPDU guard err-disables a desk port — and you bring it back", viewBox:"0 0 760 440",
  intro:"The console is already cabled to ACC-3F. SRV (10.10.10.50) hangs off DIST1. Watch ACC-3F port 3's light when HOME-SW is plugged in: amber means err-disabled.",
  devices:[
    {id:"dist", kind:"switch", label:"DIST1", model:"Catalyst 9300 · distribution", x:20, y:20, mac:"7c21.0e4a", ports:[1,2].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})).concat([{id:"con", type:"console", label:"CON"}]),
      config:e=>{ ["en","conf t","hostname DIST1","vlan 10","name STAFF","exit","interface g0/1","description ACC-3F","switchport mode trunk","interface g0/2","description SRV","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"srv", kind:"server", label:"SRV", x:260, y:20, ip:"10.10.10.50", mask:"255.255.255.0", gw:"10.10.10.1"},
    {id:"lap", kind:"laptop", label:"LAPTOP", x:440, y:20},
    {id:"acc", kind:"switch", label:"ACC-3F", model:"Catalyst 9200 · 3rd floor", x:20, y:180, mac:"a0f8.4933", ports:[1,2,3,4,5,6].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})).concat([{id:"con", type:"console", label:"CON"}]),
      config:e=>{ ["en","conf t","hostname ACC-3F","vlan 10","name STAFF","exit","spanning-tree portfast default","spanning-tree portfast bpduguard default","interface range g0/1 - 5","switchport mode access","switchport access vlan 10","interface g0/1","description DESK-3.10 NGOZI","interface g0/3","description DESK-3.12 TUNDE","interface g0/6","description UPLINK-DIST1","switchport mode trunk","end"].forEach(c=>e.exec(c)); e.history.length=0; e.log.length=0; }},
    {id:"home", kind:"switch", label:"HOME-SW", model:"desktop switch from home", x:440, y:180, mac:"000a.f310", fresh:true, ports:[1,2,3].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i}))},
    {id:"pc1", kind:"pc", label:"PC-NGOZI", x:20, y:330, ip:"10.10.10.31", mask:"255.255.255.0", gw:"10.10.10.1"},
    {id:"tunde", kind:"pc", label:"PC-TUNDE", x:480, y:330, ip:"10.10.10.32", mask:"255.255.255.0", gw:"10.10.10.1"},
  ],
  cables:[ {type:"cat6", a:"dist:g1", b:"acc:g6"}, {type:"cat6", a:"srv:eth", b:"dist:g2"}, {type:"cat6", a:"pc1:eth", b:"acc:g1"}, {type:"cat6", a:"tunde:eth", b:"home:g2"}, {type:"console", a:"lap:usb", b:"acc:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"Open the Terminal app on ACC-3F (9600 8N1, no flow control), <code>enable</code>, and run <code>show spanning-tree summary</code>: PortFast Default and PortFast BPDU Guard Default are both enabled", done:B=>B.devs.acc.env.log.some(l=>/PortFast BPDU Guard Default\s+is enabled/.test(l.out))},
    {text:"Run <code>show spanning-tree vlan 10</code>: Ngozi's port Gi0/1 is <code>P2p Edge</code> (PortFast), the uplink Gi0/6 is plain <code>P2p</code> and is the root port", done:B=>B.devs.acc.env.log.some(l=>/VLAN0010/.test(l.out) && /P2p Edge/.test(l.out))},
    {text:"Be Tunde: plug a Cat6 cable from HOME-SW port 1 into ACC-3F port 3 (his desk socket). Port 3's light turns amber", done:B=>Bench.logged(B,"acc",/BLOCK_BPDUGUARD.*GigabitEthernet0\/3/)},
    {text:"From PC-TUNDE, <code>ping 10.10.10.50</code> — it fails. That is Tunde's ticket", done:B=>Bench.tried(B,"tunde",/ping/i) && Bench.logged(B,"acc",/BLOCK_BPDUGUARD/)},
    {text:"Be the engineer: <code>show interfaces status</code> (Gi0/3 is <code>err-disabled</code>) and <code>show logging</code> (find <code>%SPANTREE-2-BLOCK_BPDUGUARD</code>)", done:B=>{ const L = B.devs.acc.env.log; return L.some(l=>/Gi0\/3.*err-disabled/.test(l.out)) && L.some(l=>/BLOCK_BPDUGUARD/.test(l.out) && /Log Buffer/.test(l.out)); }},
    {text:"Remove the cause: unplug HOME-SW from port 3, and move PC-TUNDE's cable from HOME-SW straight into ACC-3F port 3", done:B=>Bench.linked(B,"tunde:eth","acc:g3") && !Bench.linked(B,"home:g1","acc:g3")},
    {text:"Recover the port: <code>conf t</code>, <code>interface g0/3</code>, <code>shutdown</code>, <code>no shutdown</code>. The light turns green and <code>show interfaces status</code> says <code>connected</code>", done:B=>!Bench.errdis(B,"acc","g3") && Bench.upAt(B,"acc:g3") && Bench.logged(B,"acc",/BLOCK_BPDUGUARD/)},
    {text:"From PC-TUNDE, <code>ping 10.10.10.50</code> — replies. Ticket closed", done:B=>Bench.pinged(B,"tunde","10.10.10.50")},
  ],
  win:"You watched BPDU guard do its job in real time — a switch on a desk port, one BPDU, port err-disabled with an amber light and a log entry — then removed the cause and recovered the port in the right order.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show spanning-tree summary"],["term","show spanning-tree vlan 10"],
    ["plug","cat6","home:g1","acc:g3"],["pc","tunde","ping 10.10.10.50"],["term","show interfaces status"],["term","show logging"],
    ["unplug","home:g1"],["unplug","tunde:eth"],["plug","cat6","tunde:eth","acc:g3"],
    ["term","conf t"],["term","interface g0/3"],["term","shutdown"],["term","no shutdown"],["term","end"],["term","show interfaces status"],
    ["pc","tunde","ping 10.10.10.50"]]})}
${K.hint(`<code>no shutdown</code> alone won't revive an err-disabled port — <code>shutdown</code> first. Port amber again at once? HOME-SW is still plugged in: remove the cause first.`)}
<p>HOME-SW's MAC, <code>000a.f310…</code>, is lower than any switch in the building: without BPDU guard, a box from someone's living room could have won the root election.</p>
${K.q({type:"order", q:"A desk port is err-disabled by BPDU guard. Put the engineer's actions in order.", items:["Find the port and reason with show interfaces status err-disabled and show logging","Physically remove the switch (or the looped cable) from the desk socket","Enter the interface and type shutdown","Type no shutdown","Confirm the port is connected and the user's device works"], why:"Diagnose, then remove the cause — otherwise the next BPDU disables the port again. shutdown clears err-disabled, no shutdown brings it up; then verify with the user."})}

<h2>Root guard and loop guard: protecting the tree itself</h2>
<h3>Root guard: the root stays where you put it</h3>
<p>${K.g("Root guard","Blocks a port (root-inconsistent) if a better root is advertised through it.")} goes on the <b>distribution downlinks</b> to access switches, and on ports facing switches you don't control. Those ports should always be designated, with the root upstream. If a ${K.g("superior BPDU","A BPDU advertising a better (lower) root bridge ID than the current root.")} arrives, something below is claiming to be a better root; the port goes ${K.g("root-inconsistent","Root guard's blocking state: the port stays up but discards traffic for that VLAN.")} for that VLAN (<code>show spanning-tree</code> marks it ${K.g("BKN","Short for broken: the state show spanning-tree prints for a port that STP has blocked because of an inconsistency, such as root guard firing or a native VLAN mismatch.")}), and the rest of the tree is untouched.</p>
${K.out(`DIST1(config)#interface g1/0/2
DIST1(config-if)#spanning-tree guard root
%SPANTREE-2-ROOTGUARD_CONFIG_CHANGE: Root guard enabled on port GigabitEthernet1/0/2.

! later, someone sets priority 0 on ACC1:
%SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port GigabitEthernet1/0/2 on VLAN0010.

DIST1#show spanning-tree vlan 10 | include Gi1/0/2
Gi1/0/2             Desg BKN*4         128.2    P2p *ROOT_Inc`, "Root guard on a distribution downlink. BKN* and *ROOT_Inc mark the blocked port.")}
<p>Root guard err-disables nothing and recovers by itself when the superior BPDUs stop.</p>
<h3>Loop guard: a blocked port must not wake up by itself</h3>
<p>A link that fails in <b>one direction</b> — a damaged fibre strand, a bad transceiver — is dangerous. An alternate port blocks because it keeps hearing BPDUs from across the link. If they stop while the link stays up, a normal port decides nobody is there, becomes designated and forwards: a loop. ${K.g("Loop guard","Keeps a root or alternate port blocking (loop-inconsistent) if its BPDUs stop.")} (<code>spanning-tree guard loop</code>, or <code>spanning-tree loopguard default</code>) makes that port go <b>loop-inconsistent</b> and keep blocking until BPDUs return. It belongs on access uplinks and can't share a port with root guard.</p>
${K.svg("0 0 760 340",
  K.dev("switch",230,50,"DIST1","root")+K.dev("switch",530,50,"DIST2","secondary")+K.link(256,50,504,50)+
  K.dev("switch",230,180,"ACC1","")+K.dev("switch",530,180,"ACC2","")+
  K.link(230,62,230,168)+K.link(530,62,530,168)+K.link(250,62,510,168)+K.link(510,62,250,168)+
  K.dev("pc",150,290,"PC","")+K.dev("printer",310,290,"printer","")+K.dev("pc",470,290,"PC","")+K.dev("phone",600,290,"phone","")+
  K.link(214,192,156,270)+K.link(246,192,306,272)+K.link(514,192,470,270)+K.link(546,192,598,272)+
  K.box(14,82,170,40,"ROOT GUARD","DIST downlinks",true)+K.arrow(184,102,222,110,"",true)+
  K.box(576,82,170,40,"ROOT GUARD","DIST downlinks",true)+K.arrow(576,102,538,110,"",true)+
  K.box(14,150,150,40,"LOOP GUARD","ACC uplinks")+K.arrow(164,164,222,150)+
  K.box(596,150,150,40,"LOOP GUARD","ACC uplinks")+K.arrow(596,164,538,150)+
  K.box(300,212,170,40,"PORTFAST + BPDU GUARD","every desk port",true)+K.arrow(300,238,262,248,"",true)+K.arrow(470,240,500,248,"",true),
  "Where each feature goes in a two-tier campus: root guard faces down from the root, loop guard sits on the access uplinks, PortFast and BPDU guard on every host port.")}
${K.when([
  ["BPDU guard","Ports facing hosts only","Any BPDU means a switch where none belongs","Uplinks and legitimate switch links"],
  ["Root guard","Distribution ports facing access switches; ports to outsiders' switches","Downstream switch runs STP but can never become root","A switch's own root port"],
  ["Loop guard","Root and alternate ports on access uplinks, especially fibre","Stops a one-way fault turning a blocked port into a loop","Ports with root guard; edge ports"],
], "Which guard, where — and why")}
${K.remember(`<b>BPDU guard keeps switches off desks. Root guard keeps the root where it is. Loop guard keeps blocked ports blocked.</b> BPDU guard <b>err-disables</b>; root guard and loop guard <b>block</b> (root- or loop-inconsistent) and recover by themselves.`)}
${K.myth([
  ["PortFast turns Spanning Tree off on the port.","The port still sends BPDUs and runs STP; it only skips listening and learning."],
  ["root primary makes a switch root permanently.","It writes a priority once; a lower one added later still wins."],
  ["BPDU guard and root guard are the same thing.","BPDU guard err-disables on any BPDU. Root guard blocks one VLAN only on superior BPDUs, and recovers by itself."],
  ["Rapid PVST+ can't run alongside PVST+ switches.","It interoperates: that link falls back to 802.1D timers and converges slowly."],
])}
<h3>Practise the commands: harden an access switch</h3>
<p>ACC-2F is an older Catalyst 2960-X still in its default <code>pvst</code> mode. Desk ports are Gi0/1–6; Gi0/9 goes to a contractor's switch in the shared plant room. Bring it up to the company template. (The switch isn't cabled, so the summary and running-config tell the story.)</p>
${K.hint(`<code>interface range g0/1 - 6</code> configures six ports at once. Root guard is an interface command. Check with <code>show running-config | include spanning-tree</code>.`)}
${K.term({env:"ios2", title:"Rapid PVST+, PortFast, BPDU guard and root guard on ACC-2F", opts:{kind:"switch", host:"ACC-2F", model:"WS-C2960X-24PS-L", motd:"ACC-2F — console session (lab switch, no enable secret). Spanning Tree mode is still the 2960 default."},
  setup:env=>{ env.stpMode = "pvst"; ["en","conf t","vlan 10","name STAFF","exit","interface g0/10","description UPLINK-DIST1","switchport mode trunk","interface g0/9","description CONTRACTOR-SW","switchport mode trunk","end","disable"].forEach(c=>env.exec(c)); env.baseline(); env.history.length = 0; env.log.length = 0; },
  intro:"Start at user EXEC. Check the mode, switch to rapid, make six desk ports fast and guarded, protect the root from the contractor's switch, and save.",
  tasks:[
    {text:"<code>enable</code>, then <code>show spanning-tree summary</code> — the switch is in <code>pvst</code> mode", done:e=>e.log.some(l=>/Switch is in pvst mode/.test(l.out))},
    {text:"Switch to Rapid PVST+: <code>spanning-tree mode rapid-pvst</code>", done:e=>e.stpMode==="rapid-pvst"},
    {text:"Gi0/1–6: access ports in VLAN 10 with <code>spanning-tree portfast</code> and <code>spanning-tree bpduguard enable</code>", done:e=>[1,2,3,4,5,6].every(n=>{ const i = e.intfs["GigabitEthernet0/"+n]; return i.mode==="access" && i.vlan===10 && i.stp && i.stp.portfast && i.stp.bpduguard===true; })},
    {text:"Add the global safety net for any future PortFast port: <code>spanning-tree portfast bpduguard default</code>", done:e=>e.bpduDefault===true},
    {text:"Gi0/9 faces the contractor's switch: <code>spanning-tree guard root</code>", done:e=>(e.intfs["GigabitEthernet0/9"].stp||{}).guard==="root"},
    {text:"<code>end</code>, check <code>show spanning-tree summary</code> again (rapid-pvst, BPDU Guard Default enabled), then <code>write memory</code>", done:e=>!!(e.startup && e.startup.stpMode==="rapid-pvst" && e.startup.bpduDefault===true)},
  ],
  win:"ACC-2F now converges in about a second, its desk ports come up instantly but shut on the first BPDU, and the contractor's switch can run STP but can never become your root.",
  solve:["enable","show spanning-tree summary","configure terminal","spanning-tree mode rapid-pvst","interface range g0/1 - 6","switchport mode access","switchport access vlan 10","spanning-tree portfast","spanning-tree bpduguard enable","exit","spanning-tree portfast bpduguard default","interface g0/9","spanning-tree guard root","end","show spanning-tree summary","write memory"]})}
${K.mistake(`Putting root guard on a switch's <b>root port</b>, such as an access switch's uplink. The real root's BPDUs arrive there, so root guard blocks the only path to the root. It belongs where the root must <i>never</i> be.`)}
${K.exam(`&ldquo;Which feature stops a switch on an access port from affecting the STP topology?&rdquo; → <b>BPDU guard</b>. &ldquo;…lets a downstream switch participate in STP but never become root?&rdquo; → <b>root guard</b>. &ldquo;Which command enables BPDU guard on all PortFast ports?&rdquo; → <code>spanning-tree portfast bpduguard default</code>.`)}
${K.q({type:"match", q:"Match each feature with what happens when it acts.", pairs:[["BPDU guard","The port is err-disabled until it is recovered"],["Root guard","The port goes root-inconsistent for that VLAN and recovers by itself"],["Loop guard","The port goes loop-inconsistent instead of becoming designated"],["PortFast","The port forwards as soon as the link comes up"]], why:"Only BPDU guard err-disables. Root guard and loop guard block in an inconsistent state and recover automatically. PortFast blocks nothing: it skips the waiting states on edge ports."})}
${K.check({q:"On DIST1: Gi1/0/2 Desg BKN*4 128.2 P2p *ROOT_Inc in show spanning-tree vlan 10. What happened, and how is the port restored?", o:["BPDU guard err-disabled it; shutdown and no shutdown","The switch on Gi1/0/2 advertises a better root and root guard is blocking; remove that switch's low priority and the port recovers by itself","A one-way fibre fault; replace the transceiver","PortFast is on; remove it"], a:1, why:"*ROOT_Inc is root guard's root-inconsistent state. Fix the downstream switch's priority; when the superior BPDUs stop, the port unblocks automatically."})}

${K.job("“My internet stopped when I plugged in my switch”",`
<p><b>The ticket.</b> 10:20, a fintech in Yaba, Lagos. &ldquo;Desk 4.07 — Emeka. I brought a little switch from home so my laptop and printer can both connect. Now nothing works. Urgent, demo at 11.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;What's plugged into the little switch?&rdquo; — <i>&ldquo;The wall cable, my laptop, my printer, and a spare cable from the box — both ends, into two empty holes.&rdquo;</i> That spare cable is a loop, and your desk ports have BPDU guard.</p>
<p><b>Checks.</b> The cabling sheet says desk 4.07 is Gi1/0/14 on SW-4F. Over SSH:</p>
${K.out(`SW-4F#show interfaces status err-disabled

Port      Name               Status       Reason               Err-disabled Vlans
Gi1/0/14  DESK-4.07 EMEKA    err-disabled bpduguard

SW-4F#show logging | include BPDUGUARD|ERR_DISABLE
*Oct 13 10:14:51.203: %SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port GigabitEthernet1/0/14 with BPDU Guard enabled. Disabling port.
*Oct 13 10:14:51.207: %PM-4-ERR_DISABLE: bpduguard error detected on Gi1/0/14, putting Gi1/0/14 in err-disable state`, "The desk port, err-disabled by BPDU guard at the moment the spare cable went in.")}
<p>The unmanaged switch doesn't run STP, but SW-4F sends a BPDU out of Gi1/0/14 every 2 seconds. The little switch flooded it round the spare cable and back up the wall cable into Gi1/0/14 — a BPDU on a desk port, so BPDU guard shut it within seconds. Without it, the loop would have stormed the floor's VLAN. One desk was sacrificed to save the floor.</p>
<p><b>The fix.</b> Emeka removes the spare cable (you ask him to hold it up). Then on SW-4F: <code>interface Gi1/0/14</code>, <code>shutdown</code>, <code>no shutdown</code>; <code>show interfaces status</code> shows <code>connected a-full a-1000</code> and his laptop reaches the payment ${K.g("sandbox","A test copy of a system (here, the payment platform) where developers can try things without touching real money or customers.")} at 10:31. After the demo, policy applies: no personal switches. You patch the spare socket at 4.07 to Gi1/0/15 (template config) for the printer, and the little switch goes home.</p>
<p><b>What you say.</b> &ldquo;The spare cable made a loop that could have taken the whole floor offline, so our switch turned your socket off to protect everyone. You're back on, and your printer has its own socket. Please don't connect switches at desks — ask us for more sockets instead.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Desk 4.07 (Emeka). SW-4F Gi1/0/14 err-disabled (bpduguard) 10:14: unmanaged desk switch with a cable looped between two of its own ports. Loop removed, shut/no shut, connected a-full a-1000, user online 10:31. After demo: desk switch returned to user, printer patched to Gi1/0/15. Security informed (rogue device policy). 25 min.&rdquo;</i></p>`)}

${K.case("Two distribution switches, one of them asleep: per-VLAN load sharing on a campus",`
<p>A university in Abuja ran its main academic building on two Catalyst 9300 distribution switches, DIST-A and DIST-B, with 14 access switches dual-homed to both over 10 Gb/s fibre. VLANs: 10 staff, 20 students, 30 labs, 40 voice, 50 cameras. The installer had typed <code>spanning-tree vlan 1-4094 root primary</code> on DIST-A and <code>root secondary</code> on DIST-B.</p>
<p><b>The problem.</b> At the start of semester, students complained of slow downloads at 10 a.m. and 2 p.m. The graphs showed every access uplink to DIST-A peaking above 90% while every uplink to DIST-B carried almost nothing: <code>show spanning-tree</code> on the access switches showed the DIST-B port <code>Altn BLK</code> in every VLAN. Half the uplink capacity was a spare tyre.</p>
<p><b>The options.</b> Upgrade every uplink to 25 Gb/s (expensive, weeks away), or <b>split the roots per VLAN</b> — two lines per switch, that evening.</p>
<p><b>The change.</b> VLANs 20 (students, the heaviest) and 40 (voice) went to DIST-B; 10, 30 and 50 stayed on DIST-A:</p>
${K.out(`DIST-A(config)#spanning-tree vlan 10,30,50 priority 4096
DIST-A(config)#spanning-tree vlan 20,40 priority 8192

DIST-B(config)#spanning-tree vlan 20,40 priority 4096
DIST-B(config)#spanning-tree vlan 10,30,50 priority 8192`, "Explicit priorities, so nothing in the building outbids either switch by accident.")}
<p>They moved the HSRP active gateway for VLANs 20 and 40 to DIST-B too, and they added <code>spanning-tree guard root</code> on every DIST-A/DIST-B downlink, after finding that a technician had once set a lab switch to priority 0 &ldquo;to learn STP&rdquo;.</p>
<p><b>The result.</b> Peaks fell to about 55% on each side. When DIST-B rebooted for an upgrade, VLANs 20 and 40 moved to DIST-A in about a second.</p>
<p><b>The lessons.</b> A secondary root that blocks everything is redundancy, not capacity. Align root and active gateway per VLAN. Size it so either switch can carry everything alone.</p>`)}

<h2>Interview corner</h2>
${K.hint(`What it skips and why that's safe; where it's dangerous; what you pair it with.`)}
${K.reveal("“What does PortFast do, and where must you never use it?”",`<p>"PortFast makes an access port forward as soon as the link comes up, skipping 30 seconds of listening and learning — an edge port in RSTP terms. It's safe only on ports to a single host: PCs, printers, phones, single-NIC servers. Never on an uplink or anything leading to a switch, hub or bridge, because a port that forwards immediately can create a loop before Spanning Tree reacts. I use <code>spanning-tree portfast default</code>, which only touches access ports, and pair it with <code>spanning-tree portfast bpduguard default</code>, so a switch plugged into a desk port err-disables it instead of joining the tree."</p>`)}
${K.hint(`Compare what triggers each, what each does to the port, and where each goes.`)}
${K.reveal("“What's the difference between BPDU guard and root guard?”",`<p>"BPDU guard is for ports that should never see a switch: any BPDU and the port is err-disabled until someone removes the cause and bounces it. It goes on PortFast desk ports. Root guard is for ports that may face a switch but never the root: the downstream switch runs STP normally, but a superior BPDU puts the port root-inconsistent for that VLAN until the superior BPDUs stop, then it recovers by itself. It goes on distribution downlinks and ports to outsiders' switches. BPDU guard keeps switches off desks; root guard keeps the root where we designed it."</p>`)}
${K.hint(`Why the default is bad, the command, where root and backup go, how you check.`)}
${K.reveal("“How do you control which switch becomes root, and why bother?”",`<p>"By default every priority is 32768, so the lowest MAC wins — usually the oldest switch, often in a closet. I set priority per VLAN on the distribution or core pair in steps of 4096 — say 4096 and 8192 — or use <code>root primary</code> and <code>root secondary</code>, which write 24576 and 28672. With two distribution switches I split the VLANs between them so both uplinks carry traffic, aligned with the HSRP active gateway, and add root guard on the downlinks. Then I verify with <code>show spanning-tree vlan N</code>."</p>`)}

${K.recap([
  "Rapid PVST+ (per-VLAN 802.1w) uses proposal/agreement, pre-computed alternate ports and edge ports to converge in about a second, not 30–50 s. Catalyst 9000 defaults to rapid-pvst, older 2960s to pvst.",
  "show spanning-tree vlan N: Root ID (the root, cost, root port), Bridge ID (this switch: priority + sys-id-ext), then each port's role, state, cost, priority.number and type.",
  "Left alone, the lowest MAC — often the oldest switch — becomes root. Set it on the core/distribution with spanning-tree vlan N priority (0–61440, steps of 4096).",
  "root primary sets 24576 (or 4096 below the current root); root secondary sets 28672. Both are one-time macros.",
  "Per-VLAN load sharing: each distribution switch is root for some VLANs and backup for the rest, so both uplinks forward.",
  "PortFast skips listening and learning on host ports — never on switch-facing ports. BPDU guard err-disables a port that receives any BPDU; remove the cause, then shutdown / no shutdown.",
  "Root guard (distribution downlinks) blocks superior BPDUs as root-inconsistent; loop guard (access uplinks) keeps a port blocking when BPDUs stop. Both recover by themselves.",
])}
${K.next(`<b>Lesson 6 — EtherChannel: ${K.g("LACP","Link Aggregation Control Protocol: the open IEEE standard that lets two switches agree which parallel links to bundle. Next lesson.")}, ${K.g("PAgP","Port Aggregation Protocol: Cisco's own older protocol that does the same job as LACP. Next lesson.")} and static bundles.</b> Bundle parallel links into one logical port, so Spanning Tree sees one link and every member carries traffic.`)}
`,
quiz:[
  {lvl:1, q:"What is the default Spanning Tree mode on a Cisco Catalyst 9000 series switch?", o:["pvst","rapid-pvst","mst","802.1D"], a:1, why:"Catalyst 9000 switches start in rapid-pvst (Cisco's per-VLAN RSTP). Older Catalyst 2960s start in pvst, the classic per-VLAN 802.1D."},
  {lvl:1, q:"Which value can you configure with spanning-tree vlan 10 priority?", o:["30000","32769","20480","65535"], a:2, why:"Bridge priority must be a multiple of 4096 between 0 and 61440, because the low 12 bits carry the VLAN number (the extended system ID). 20480 = 5 × 4096."},
  {lvl:1, type:"fill", q:"Which global configuration command switches a Catalyst switch from classic PVST+ to Rapid PVST+?", fields:[{label:"Command", a:["spanning-tree mode rapid-pvst"], ios:true}], why:"spanning-tree mode rapid-pvst. Expect a brief disruption while Spanning Tree restarts on the switch."},
  {lvl:1, type:"match", q:"Match each command with what it configures.", pairs:[["spanning-tree vlan 10 root secondary","Priority 28672 for VLAN 10"],["spanning-tree portfast default","PortFast on every access port"],["spanning-tree portfast bpduguard default","BPDU guard on every PortFast port"],["spanning-tree guard root","Root guard on one interface"],["spanning-tree mode rapid-pvst","Per-VLAN RSTP on the whole switch"]], why:"root secondary writes 28672; the two global defaults cover access/PortFast ports only; guard root is an interface command; the mode command is global."},
  {lvl:2, q:"No Spanning Tree priorities have been configured anywhere. Which switch becomes root for VLAN 10?", ex:"DIST1   base MAC 7c21.0e4a.0000   Catalyst 9300, core of the building\nDIST2   base MAC 7c21.0e3b.0000   Catalyst 9300\nACC1    base MAC 0019.e7a1.0000   Catalyst 2960, bought 2009\nACC2    base MAC a0f8.4911.0000   Catalyst 9200", o:["DIST1, because it is the core switch","DIST2, because it has the lowest MAC of the 9300s","ACC1, because all priorities tie at 32778 and it has the lowest MAC","ACC2, because it is the newest"], a:2, why:"With every priority at the default, each switch advertises 32768 + 10 = 32778. The tie is broken by the lowest MAC address: 0019.e7a1.0000, the old closet switch. That is why you set the root on purpose."},
  {lvl:2, q:"DIST1 is root for VLAN 30 with priority 16384. An engineer types spanning-tree vlan 30 root primary on DIST2. What happens?", o:["DIST2 sets 24576 and DIST1 stays root","DIST2 sets 12288 and becomes root for VLAN 30","DIST2 sets 0 and becomes root","The command is rejected because a root already exists"], a:1, why:"root primary sets 24576 only if that would win. The current root is already lower (16384), so the macro sets 4096 less than the current root: 12288. DIST2 becomes root — a real risk when the macro is typed on the wrong switch."},
  {lvl:2, type:"multi", q:"Which two statements about PortFast are true? (Choose two.)", o:["It lets an access port skip listening and learning and forward as soon as the link comes up","It disables Spanning Tree on the port so no BPDUs are sent","It should be enabled on uplinks between switches to speed up convergence","spanning-tree portfast default enables it on access ports but not on trunks","It err-disables the port if a BPDU arrives"], a:[0,3], why:"PortFast skips the waiting states on edge ports; the global default applies only to non-trunking access ports. The port still sends BPDUs. It must never be used towards switches. Err-disabling on a BPDU is BPDU guard, not PortFast."},
  {lvl:2, q:"A user reports no network after plugging in a small switch. What is the state of the port, and how do you restore it?", ex:"%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port GigabitEthernet1/0/22 with BPDU Guard enabled. Disabling port.\n%PM-4-ERR_DISABLE: bpduguard error detected on Gi1/0/22, putting Gi1/0/22 in err-disable state", o:["Root-inconsistent; it recovers by itself when the BPDUs stop","Err-disabled; remove the switch, then shutdown and no shutdown on Gi1/0/22","Administratively down; type no shutdown","Loop-inconsistent; replace the cable"], a:1, why:"BPDU guard err-disables the port. Remove the cause first, then shutdown / no shutdown (or let errdisable recovery do it). Without removing the switch, the next BPDU disables the port again."},
  {lvl:2, type:"order", q:"Classic 802.1D: put the states a port passes through, from link up to forwarding traffic, in order (no PortFast).", items:["Blocking","Listening","Learning","Forwarding"], why:"A classic port starts blocking, then spends 15 seconds (forward delay) listening and 15 seconds learning before forwarding. PortFast skips listening and learning; RSTP replaces blocking and listening with discarding."},
  {lvl:2, q:"Which feature lets a downstream switch take part in Spanning Tree normally but stops it from ever becoming the root bridge?", o:["BPDU guard","Root guard","Loop guard","PortFast"], a:1, why:"Root guard accepts normal BPDUs but puts the port into root-inconsistent (blocking) for a VLAN if a superior BPDU arrives. BPDU guard would err-disable the port on any BPDU, so the downstream switch could not participate at all."},
  {lvl:2, q:"On a Rapid PVST+ network, an access switch's root port fails. Its alternate port leads to the other distribution switch. What happens?", o:["The alternate port goes through 15 s listening and 15 s learning","The switch waits 20 s max age, then elects a new root port","The alternate port becomes the root port and forwards almost immediately","The switch becomes the root bridge"], a:2, why:"In RSTP the alternate port is a pre-computed backup root port. When a directly connected root port fails, the alternate takes over at once — one of the main reasons Rapid PVST+ converges in about a second."},
  {lvl:3, q:"Users on VLAN 20 complain that file copies to a server on DIST1 are slow, while VLAN 10 is fine. You run this on ACC3. What is the most useful next step?", ex:"ACC3#show spanning-tree vlan 20\n\nVLAN0020\n  Spanning tree enabled protocol rstp\n  Root ID    Priority    20\n             Address     0026.cb11.4f00\n             Cost        8\n             Port        2 (GigabitEthernet1/0/50)\n...\nInterface           Role Sts Cost      Prio.Nbr Type\n------------------- ---- --- --------- -------- --------------------------------\nGi1/0/49            Altn BLK 4         128.49   P2p\nGi1/0/50            Root FWD 4         128.50   P2p", o:["Enable PortFast on Gi1/0/49 so it forwards","Find the switch with MAC 0026.cb11.4f00: someone has set priority 0 for VLAN 20 on it and it has taken the root, so VLAN 20 detours. Fix it and add root guard on the distribution downlinks","Raise the cost of Gi1/0/50 to 100","Change the mode to pvst on ACC3"], a:1, why:"Priority 20 means configured priority 0 plus VLAN 20: someone deliberately set 0, and that switch is two links away (cost 8). VLAN 20 now follows a tree centred on the wrong switch. Find it (CDP on the root port, hop by hop), remove the priority, and protect the design with root guard. PortFast on an uplink would risk a loop."},
  {lvl:3, q:"A campus has DIST1 as root and DIST2 as secondary for all 40 VLANs; every access switch's uplink to DIST1 runs near capacity while its uplink to DIST2 is idle. Which change uses both uplinks with the least risk?", o:["Disable Spanning Tree on the uplinks to DIST2","Make DIST2 root for about half the VLANs and DIST1 secondary for those, aligning the active gateway for each VLAN with its root","Enable PortFast on the uplinks to DIST2","Lower the port cost on every DIST2 uplink to 1"], a:1, why:"Per-VLAN roots make each uplink forward for some VLANs and stand by for the rest, with full redundancy kept. Disabling STP or PortFast on uplinks risks loops. Cost changes on every uplink are fragile, and with one root for all VLANs each access switch would still block one uplink."},
  {lvl:3, type:"multi", q:"You are writing the template for 200 new access switches. Which three lines belong in it? (Choose three.)", o:["spanning-tree mode rapid-pvst","spanning-tree portfast default","spanning-tree portfast bpduguard default","spanning-tree vlan 1-4094 root primary","spanning-tree guard root on the uplink interfaces"], a:[0,1,2], why:"Access switches should run rapid-pvst with PortFast and BPDU guard on their host ports. They should never be root (root primary belongs on distribution). Root guard on an access switch's uplink would block its path to the real root; it belongs on the distribution side of that link."},
  {lvl:2, type:"fill", q:"Which interface command enables BPDU guard on one port, whether or not PortFast is configured there?", fields:[{label:"Command", a:["spanning-tree bpduguard enable"], ios:true}], why:"spanning-tree bpduguard enable turns BPDU guard on for that interface. The global spanning-tree portfast bpduguard default only covers PortFast-enabled ports."},
],
cards:[
  {f:"Rapid PVST+", b:"Cisco's per-VLAN version of RSTP (802.1w). One rapid tree per VLAN. Default on Catalyst 9000; older 2960s default to pvst. Command: spanning-tree mode rapid-pvst."},
  {f:"Why RSTP converges in about a second", b:"Proposal/agreement handshake on point-to-point links instead of 15 s + 15 s timers, pre-computed alternate ports that take over at once, and edge ports that forward immediately."},
  {f:"RSTP port states and roles", b:"States: discarding, learning, forwarding. Roles: root, designated, alternate, backup (plus disabled)."},
  {f:"Classic STP timers", b:"Hello 2 s, forward delay 15 s (listening and learning each), max age 20 s. New port: about 30 s to forward. Indirect failure: up to 50 s."},
  {f:"Legal bridge priorities", b:"0 to 61440 in steps of 4096; default 32768. The shown priority = configured value + VLAN number (extended system ID)."},
  {f:"root primary / root secondary", b:"primary: 24576, or 4096 below the current root if that is already lower. secondary: 28672. One-time macros that write a plain priority line."},
  {f:"Per-VLAN load sharing", b:"Make DIST1 root for some VLANs and DIST2 for the others (each the other's secondary), so every access uplink forwards for some VLANs. Align with the active gateway."},
  {f:"Port cost vs port priority", b:"Cost (on this switch) changes this switch's root port choice. Port priority (0-240, steps of 16, default 128, on the upstream switch) is the downstream switch's tie-breaker. Rarely needed."},
  {f:"PortFast", b:"Host-facing access ports forward as soon as the link comes up (edge port), skipping listening/learning, and don't cause topology changes. Never on switch-facing ports. Global: spanning-tree portfast default (access ports only)."},
  {f:"BPDU guard", b:"Any BPDU on the port → err-disabled. Interface: spanning-tree bpduguard enable. Global for PortFast ports: spanning-tree portfast bpduguard default. Log: %SPANTREE-2-BLOCK_BPDUGUARD."},
  {f:"Recovering an err-disabled port", b:"Find it (show interfaces status err-disabled, show logging), remove the cause, then shutdown and no shutdown. Or errdisable recovery cause bpduguard (default interval 300 s)."},
  {f:"Root guard", b:"On distribution downlinks / ports to outside switches. A superior BPDU puts the port root-inconsistent (BKN*, *ROOT_Inc) for that VLAN; recovers by itself. Command: spanning-tree guard root."},
  {f:"Loop guard", b:"On root/alternate ports (access uplinks). If BPDUs stop arriving, the port goes loop-inconsistent instead of becoming designated — protects against one-way link faults. spanning-tree guard loop."},
],
});
// ---------- Module 4 · Lesson 6 ----------
L.push({
id:"etherchannel", mins:75, level:"Intermediate · builds on lessons 2, 4 and 5",
t:"EtherChannel: bundling links with LACP, PAgP or static mode",
html:`
${K.goals([
  "Explain why STP blocks a second uplink, and how an EtherChannel makes 2–8 links one Port-channel that nothing needs to block.",
  "Choose between LACP, PAgP and <code>on</code>, and predict from both ends' modes whether a bundle forms.",
  "Configure a Layer 2 EtherChannel with <code>interface range</code>, <code>channel-group</code> and the Port-channel interface.",
  "Read <code>show etherchannel summary</code> flag by flag, and confirm the bundle in <code>show spanning-tree</code> and <code>show interfaces trunk</code>.",
  "Explain per-flow load balancing, and configure a Layer 3 EtherChannel.",
])}
${K.pre(["Module 4 lesson 2 (802.1Q trunks, the native VLAN, allowed VLAN lists), lessons 4 and 5 (root bridge, port costs, root and alternate ports, Rapid PVST+). From earlier modules: interface configuration, speed and duplex, and reading <code>show</code> output."])}

<h2>Why this matters at work</h2>
<p>A microfinance bank in Ikeja, Lagos, pays its MSP to &ldquo;double the uplink&rdquo; from the banking-hall switch. A second fibre goes in, the light goes green — and three weeks later the monitoring graph shows the new port has carried <b>zero</b> traffic. Two lanes paid for, one used.</p>
<p>Nothing is broken. Spanning Tree saw two paths between the same switches — a loop — and blocked one, as lesson 4 said it would. The fix is to make the switches treat the two cables as <b>one</b> link: an <b>EtherChannel</b>. You get the bandwidth of both cables, and if one is cut the other carries on with no STP reconvergence. It is on every campus and data-centre network and a named CCNA exam topic.</p>

<h2>The problem: two uplinks, and STP puts one to sleep</h2>
<p>Engineers run two cables between switches for <b>bandwidth</b> (two 1 Gb/s links should carry 2 Gb/s) and <b>resilience</b> (if one cable, optic or port dies, the other keeps the floor online). Lesson 4 showed what STP does with that: two links between the same switches form a loop, so on the non-root switch one port becomes the ${K.g("root port","The one port on a non-root switch with the best path to the root bridge. It forwards.")} and the other an ${K.g("alternate port","A Rapid PVST+ port with a path to the root that isn't the best one. It discards frames (BLK) and takes over if the root port fails.")}, blocking. That amber LED is STP preventing the storm you created in lesson 5. The second cable is a backup only: no extra bandwidth.</p>
<h3>The idea: make two cables look like one</h3>
<p>An ${K.g("EtherChannel","Cisco's name for link aggregation: 2–8 parallel Ethernet links bundled into one logical link. The IEEE term is a LAG (link aggregation group).")} bundles parallel physical links into one logical interface, a ${K.g("Port-channel","The logical interface for an EtherChannel bundle (Po1, Po2…). STP, VLANs and trunking see only it.")} (<code>Po1</code>, <code>Po2</code>…). The physical ports in it are ${K.g("member ports","The physical interfaces bundled into a Port-channel. Their settings must match.")}. Spanning Tree, the MAC table, trunking and VLANs all see <b>one</b> port, <code>Po1</code>. One port can't loop with itself, so STP has nothing to block and both cables carry traffic.</p>
${K.svg("0 0 720 310",
  K.txt(180,22,"Without a bundle",{c:"fg",s:13,mid:true,f:"display",b:true})+
  K.txt(540,22,"With an EtherChannel",{c:"fg",s:13,mid:true,f:"display",b:true})+
  `<line x1="360" y1="10" x2="360" y2="300" stroke="var(--line)" stroke-width="1"/>`+
  K.dev("switch",180,62,"DIST-SW","root bridge")+K.dev("switch",180,232,"ACC-SW","")+
  K.link(160,74,160,220,"")+K.link(200,74,200,220,"",true)+
  K.txt(150,150,"Gi0/7",{end:true,s:10.5})+K.txt(150,164,"Root FWD",{end:true,s:10.5,c:"ok"})+
  K.txt(210,150,"Gi0/8",{s:10.5})+K.txt(210,164,"Altn BLK",{s:10.5,c:"warn"})+
  `<circle cx="200" cy="208" r="5" fill="var(--warn)"/>`+
  K.txt(180,296,"2 Gb/s of cable, 1 Gb/s of service",{mid:true,s:11})+
  K.dev("switch",540,62,"DIST-SW","root bridge")+K.dev("switch",540,232,"ACC-SW","")+
  K.link(520,74,520,220,"")+K.link(560,74,560,220,"")+
  `<ellipse cx="540" cy="147" rx="40" ry="24" fill="none" stroke="var(--accent)" stroke-width="1.6"/>`+
  K.txt(590,140,"Po1",{c:"accent",s:12,b:true})+K.txt(590,154,"one logical link",{s:10.5})+K.txt(590,168,"STP cost 3, FWD",{s:10.5,c:"ok"})+
  `<circle cx="520" cy="208" r="5" fill="var(--ok)"/><circle cx="560" cy="208" r="5" fill="var(--ok)"/>`+
  K.txt(540,296,"both members carry traffic; STP sees one port",{mid:true,s:11}),
  "Left: two parallel links form a loop, so Rapid PVST+ blocks one (amber LED). Right: the same two cables bundled into Port-channel 1. STP sees a single port with a lower cost and forwards on it; frames are spread across both members.")}
<ul>
<li><b>2 to 8 active members.</b> With LACP you can configure up to 16; the extra eight wait as ${K.g("hot-standby","LACP members beyond the eight active ones. They carry nothing until an active member fails. Flag H.")} ports.</li>
<li><b>Resilience without STP.</b> If a member fails, its traffic moves to the others within moments. <code>Po1</code> stays up, so STP doesn't reconverge.</li>
<li><b>STP still runs</b> — on <code>Po1</code>, with a cost for the combined bandwidth: 4 for one 1 Gb/s link, 3 for a 2 × 1 Gb/s bundle.</li>
</ul>
${K.analogy(`<p>A toll plaza has two booths. Without a bundle, the warden closes one so drivers don't weave and collide — that is STP. With EtherChannel both booths sit under one sign, &ldquo;Lane 1&rdquo;; each driver is given a booth on arrival and stays in it. Twice the cars get through, and if a booth breaks the sign stays up.</p>`)}
${K.mistake(`&ldquo;Fixing&rdquo; a blocked uplink by disabling STP or tuning costs until both forward. Two forwarding paths between the same switches is a loop, whatever the costs. Bundle the links; don't fight STP.`)}
${K.check({q:"A distribution switch and an access switch are joined by two 1 Gb/s trunks, not bundled. What do users on the access switch get?", o:["2 Gb/s of uplink bandwidth, shared by STP","1 Gb/s: STP blocks one trunk, which takes over only if the other fails","No connectivity, because two trunks between two switches cause a storm","2 Gb/s, but only for VLAN 1"], a:1, why:"Rapid PVST+ makes one port the root port and the other an alternate (blocking) port: a backup only. EtherChannel gets both forwarding."})}

<h2>LACP, PAgP or on: how the two ends agree</h2>
<p>Both switches must agree to bundle. If one sends frames across both cables as one link while the other still sees two separate ports, the second sees the same MACs arriving on two ports and frames looping back. There are three ways to form a bundle: two negotiation protocols and one &ldquo;just do it&rdquo; mode.</p>
<h3>LACP — the open standard</h3>
<p>${K.g("LACP","Link Aggregation Control Protocol: the IEEE standard (802.3ad, now 802.1AX) for negotiating a bundle. Modes: active and passive.")} is the IEEE standard, <b>${K.g("802.3ad","The 2000 addition to the Ethernet standard (802.3) that first defined LACP and link bundling.")}</b>, now <b>${K.g("802.1AX","The IEEE standard that has held LACP since 2008, when it moved out of the Ethernet standard into its own document.")}</b>. Each end sends ${K.g("LACPDUs","LACP's control frames, describing the sender so both ends agree which links belong in the bundle. Every 30 s by default (1 s with fast rate).")}, and only links both ends agree on become members. Being a standard, it works with other vendors' switches, firewalls, storage and servers. Two modes:</p>
<ul>
<li><code>active</code> — starts the negotiation: sends LACPDUs and asks to bundle.</li>
<li><code>passive</code> — waits: answers LACPDUs but never starts.</li>
</ul>
<h3>PAgP — Cisco's own</h3>
<p>${K.g("PAgP","Port Aggregation Protocol: Cisco-proprietary bundle negotiation. Modes: desirable and auto.")} came first and only works between Cisco devices. Its modes mirror LACP's:</p>
<ul>
<li><code>desirable</code> — starts the negotiation (like <code>active</code>).</li>
<li><code>auto</code> — waits and answers (like <code>passive</code>).</li>
</ul>
<h3>Static on — no protocol at all</h3>
<p>Mode <code>on</code> forces a bundle with nothing sent and nothing checked. Both ends must be <code>on</code>. If one isn't, the switches disagree about what the cables are, and you can get a loop or a ${K.g("black hole","Traffic silently thrown away: frames go in and nothing comes out, with no error message to warn you.")}. Catalyst ${K.g("EtherChannel guard","spanning-tree etherchannel guard misconfig, on by default on Catalyst: err-disables a bundle when the far end isn't bundled the same way.")} err-disables the bundle when it detects this — a safety net, not a design.</p>
${K.svg("0 0 720 270",
  K.box(20,16,150,56,"SW1: active","LACP",true)+K.box(330,16,150,56,"SW2: passive","LACP",true)+
  K.arrow(172,34,328,34,"LACPDU: bundle?",true)+K.arrow(328,58,172,58,"LACPDU: yes",true)+
  K.txt(500,40,"Bundle forms",{c:"ok",s:12,b:true})+K.txt(500,56,"Po1(SU), members (P)",{s:11})+
  K.box(20,104,150,56,"SW1: passive","LACP")+K.box(330,104,150,56,"SW2: passive","LACP")+
  K.link(172,132,328,132,"both waiting for the other",true)+
  K.txt(500,128,"No bundle",{c:"bad",s:12,b:true})+K.txt(500,144,"members stand-alone (I)",{s:11})+K.txt(500,158,"STP blocks one link",{s:11})+
  K.box(20,192,150,56,"SW1: on","no protocol")+K.box(330,192,150,56,"SW2: active","LACP")+
  K.arrow(328,210,172,210,"LACPDU: bundle?")+K.txt(250,240,"(on never answers)",{mid:true,s:10.5})+
  K.txt(500,214,"No bundle on SW2",{c:"bad",s:12,b:true})+K.txt(500,230,"SW1 forces Po1 up anyway:",{s:11})+K.txt(500,244,"the two ends disagree",{s:11,c:"warn"}),
  "Negotiation needs at least one side that asks. Active + passive: SW1 asks, SW2 answers, the bundle forms. Passive + passive: nobody asks, so nothing forms. On + active: on sends nothing and ignores LACPDUs, so the two ends never agree.")}
<h3>The compatibility table</h3>
<p>This table is the heart of the exam questions. Read each row as &ldquo;this end + that end&rdquo;.</p>
<div class="tablewrap"><table>
<tr><th>One end</th><th>Other end</th><th>Bundle?</th><th>Why</th></tr>
<tr><td><code>active</code></td><td><code>active</code></td><td>Yes</td><td>Both ask. Recommended.</td></tr>
<tr><td><code>active</code></td><td><code>passive</code></td><td>Yes</td><td>One asks, one answers.</td></tr>
<tr><td><code>passive</code></td><td><code>passive</code></td><td><b>No</b></td><td>Both wait. Silence.</td></tr>
<tr><td><code>desirable</code></td><td><code>desirable</code></td><td>Yes</td><td>Both ask.</td></tr>
<tr><td><code>desirable</code></td><td><code>auto</code></td><td>Yes</td><td>One asks, one answers.</td></tr>
<tr><td><code>auto</code></td><td><code>auto</code></td><td><b>No</b></td><td>Both wait.</td></tr>
<tr><td><code>on</code></td><td><code>on</code></td><td>Yes</td><td>Forced, no checks.</td></tr>
<tr><td><code>on</code></td><td>any LACP/PAgP mode</td><td><b>No — risky</b></td><td>The <code>on</code> end bundles alone.</td></tr>
<tr><td>LACP mode</td><td>PAgP mode</td><td><b>No</b></td><td>Different protocols.</td></tr>
</table></div>
${K.remember(`<b>Someone has to ask.</b> LACP: <b>A</b>ctive <b>A</b>sks, <b>P</b>assive <b>P</b>auses. PAgP: <b>D</b>esirable <b>D</b>emands, <b>A</b>uto <b>A</b>nswers. Two pausers (passive+passive, auto+auto) never talk. <b>On</b> doesn't talk at all — so it only matches another <b>on</b>.`)}
${K.when([
  ["LACP <code>active</code> both ends","Almost always: switches, servers, firewalls, other vendors","Open standard; negotiated, so a mis-patched cable or unconfigured far end just doesn't bundle","The far device can't do LACP (rare)"],
  ["LACP <code>active</code> / <code>passive</code>","One side (say the core) should never start a bundle itself","Still negotiated and checked","Both sides could end up passive"],
  ["PAgP","An older all-Cisco network already using it","Negotiated","Non-Cisco devices; new designs"],
  ["Static <code>on</code>","A device that can't negotiate, both ends yours","No negotiation delay","Anywhere a one-sided mistake could go unnoticed"],
], "LACP, PAgP or on?")}
${K.dyk(`LACP was <b>IEEE 802.3ad</b> from 2000; in 2008 the IEEE moved it to its own standard, <b>802.1AX</b>. Both numbers mean LACP — Linux still calls it bonding mode <code>802.3ad</code>.`)}
${K.check({q:"SW1's uplinks are configured with channel-group 1 mode auto. SW2's matching ports use channel-group 1 mode auto. What happens?", o:["A PAgP bundle forms","An LACP bundle forms","No bundle forms, because neither side starts PAgP negotiation","The ports err-disable"], a:2, why:"auto only answers PAgP; it never starts. Two auto ends wait forever, the ports stay individual, and STP blocks one of them. At least one end must be desirable."})}
${K.q({type:"match", q:"Match each pair of EtherChannel modes with the result.", pairs:[["active + passive","LACP bundle forms"],["desirable + auto","PAgP bundle forms"],["passive + passive","No bundle: nobody starts"],["on + on","Static bundle, no negotiation"],["on + active","No agreement: the on end bundles alone, the other stays individual"]], why:"LACP and PAgP need at least one end that starts the negotiation (active or desirable). Two listening ends never bundle. on matches only on, because it sends and understands no negotiation frames."})}

<h2>Configuring an EtherChannel</h2>
<p>One rule decides whether a bundle can work: <b>every member must look identical</b>. The bundle is one port, so its members can't disagree about what that port is.</p>
<h3>The member consistency rules</h3>
<ul>
<li><b>Same speed and duplex</b> — no 1 Gb/s with 10 Gb/s.</li>
<li><b>Same switchport mode</b> — all access or all trunk.</li>
<li><b>Access: the same access VLAN. Trunk: the same native VLAN and allowed VLAN list.</b></li>
<li>Same STP port settings, and all Layer 2 or all Layer 3 — never a mix.</li>
</ul>
<p>A member that breaks a rule isn't bundled: its flag becomes <code>s</code>, ${K.g("suspended","Member flag s: in the channel group but not allowed to carry traffic, usually because its settings don't match.")}, and it carries nothing while the rest of the bundle keeps working. A Catalyst logs it, for example <code>%EC-5-CANNOT_BUNDLE2: Gi0/8 is not compatible with Gi0/7 and will be suspended (vlan mask is different)</code> — &ldquo;vlan mask&rdquo; is the allowed VLAN list.</p>
<h3>The commands</h3>
${K.steps([
  ["Select all the members at once", `<p><code>interface range gi0/7 - 8</code>. An ${K.g("interface range","Configures several interfaces with one set of commands. Prompt: (config-if-range).")} applies each command to every port, the easiest way to keep members identical. Set common settings such as <code>switchport mode trunk</code> here.</p>`],
  ["Join them to a channel group", `<p><code>channel-group 1 mode active</code>. The ${K.g("channel group","The bundle number on this switch; group 1 is Port-channel 1. Locally significant.")} number becomes the Port-channel number — IOS says <code>Creating a port-channel interface Port-channel 1</code>. The mode picks the protocol: <code>active</code>/<code>passive</code> LACP, <code>desirable</code>/<code>auto</code> PAgP, <code>on</code> static. Matching the number at both ends is tidy, not required.</p>`],
  ["Configure the Port-channel interface", `<p><code>interface port-channel 1</code> (short: <code>interface po1</code>). It starts with the first member's settings. From now on put Layer 2 settings here — allowed list, native VLAN — and IOS <b>pushes them to every member</b>, keeping them identical.</p>`],
  ["Do the same on the other switch", `<p>Same trunk settings and a compatible mode. Until it joins, LACP members stay unbundled and STP keeps protecting the network — a big reason to prefer LACP over <code>on</code>.</p>`],
  ["Verify, then save", `<p><code>show etherchannel summary</code>, <code>show spanning-tree</code>, <code>show interfaces trunk</code>, then <code>copy running-config startup-config</code>.</p>`],
])}
${K.out(`ACC-SW#show running-config | section GigabitEthernet0/[78]|Port-channel
interface GigabitEthernet0/7
 switchport trunk allowed vlan 10,20,30
 switchport mode trunk
 channel-group 1 mode active
interface GigabitEthernet0/8
 switchport trunk allowed vlan 10,20,30
 switchport mode trunk
 channel-group 1 mode active
interface Port-channel1
 switchport trunk allowed vlan 10,20,30
 switchport mode trunk`, "A healthy Layer 2 LACP bundle: each member is in group 1 with LACP active, and the trunk lines match on all three interfaces. The allowed list was typed once, under Port-channel1.")}
${K.mistake(`Changing one member after the bundle is up — say, adding a VLAN under <code>interface gi0/7</code> only. The odd one out is suspended, the bundle silently loses capacity, and the new VLAN may not cross at all. Change <code>interface port-channel N</code> instead.`)}
${K.tip(`Adding <code>channel-group</code> to live links makes them ${K.g("flap","Go down and come back up. A link that keeps doing it is said to be flapping.")} briefly while the bundle forms. Use a ${K.g("change window","An agreed, approved time slot (often after hours) for work that might disrupt users.")}, and if the uplinks are your only path to the switch, work from the console.`)}
<h3>Try it yourself: build two bundles on a distribution switch</h3>
<p>DIST-SW1 links to ACC-1 on Gi0/1–2 and to ACC-2 on Gi0/3–4. The change ticket: LACP to ACC-1, PAgP to ACC-2 (an old all-Cisco closet), both trunks; Po1 carries only VLANs 10 and 20, native VLAN 99. No neighbours are connected here, so this is configuration practice; the benches below negotiate for real.</p>
${K.hint(`<code>interface range g0/1 - 2</code> selects both ports. After <code>channel-group</code>, go to <code>interface po1</code> (short for <code>interface port-channel 1</code>) and type the trunk commands once. A group can only use one protocol, so try adding Gi0/3–4 to group 1 in PAgP mode and read what IOS says.`)}
${K.term({env:"ios2", title:"build two bundles on DIST-SW1", opts:{kind:"switch", host:"DIST-SW1", model:"C9300-24T",
  motd:"DIST-SW1 — distribution switch, 3rd floor comms room. Gi0/1-2 to ACC-1, Gi0/3-4 to ACC-2."},
  setup:env=>{ ["enable","configure terminal","vlan 10","name STAFF","vlan 20","name VOICE","vlan 99","name NATIVE","end","disable"].forEach(c=>env.exec(c)); env.history.length = 0; },
  intro:"VLANs 10, 20 and 99 already exist. Start with <code>enable</code> and <code>configure terminal</code>.",
  tasks:[
    {text:"Bundle Gi0/1 and Gi0/2 into channel group 1 with LACP, this switch starting the negotiation: <code>interface range g0/1 - 2</code>, then <code>channel-group 1 mode active</code>", done:e=>["GigabitEthernet0/1","GigabitEthernet0/2"].every(n=>e.intfs[n].channel && e.intfs[n].channel.group===1 && e.intfs[n].channel.mode==="active")},
    {text:"Try adding Gi0/3–4 to group 1 using PAgP: <code>interface range g0/3 - 4</code>, <code>channel-group 1 mode desirable</code>. Read the rejection: one group, one protocol", done:e=>e.history.some(h=>/channel-group\s+1\s+mode\s+d/i.test(h))},
    {text:"Put Gi0/3–4 into their own group 2 with PAgP, starting the negotiation: <code>channel-group 2 mode desirable</code>", done:e=>["GigabitEthernet0/3","GigabitEthernet0/4"].every(n=>e.intfs[n].channel && e.intfs[n].channel.group===2 && e.intfs[n].channel.mode==="desirable")},
    {text:"Configure Port-channel 1 as a trunk carrying only VLANs 10 and 20, native VLAN 99: <code>interface po1</code>, then <code>switchport mode trunk</code>, <code>switchport trunk allowed vlan 10,20</code>, <code>switchport trunk native vlan 99</code>", done:e=>{ const p = e.intfs["Port-channel1"]; return !!(p && p.mode==="trunk" && p.native===99 && JSON.stringify(p.allowed)==="[10,20]"); }},
    {text:"Prove the settings reached the members: <code>do show running-config | section interface</code> — Gi0/1 and Gi0/2 now carry the same trunk lines as Po1", done:e=>e.history.some(h=>/sh\S*\s+run/i.test(h)) && ["GigabitEthernet0/1","GigabitEthernet0/2"].every(n=>e.intfs[n].mode==="trunk" && e.intfs[n].native===99 && JSON.stringify(e.intfs[n].allowed)==="[10,20]")},
    {text:"Make Port-channel 2 a trunk (<code>interface po2</code>, <code>switchport mode trunk</code>), then <code>end</code> and <code>write memory</code>", done:e=>!!(e.intfs["Port-channel2"] && e.intfs["Port-channel2"].mode==="trunk" && e.savedOnce)},
  ],
  win:"You built an LACP bundle and a PAgP bundle, saw IOS refuse to mix protocols in one group, and configured the trunk once on the Port-channel so both members inherited it.",
  solve:["enable","configure terminal","interface range g0/1 - 2","channel-group 1 mode active","exit","interface range g0/3 - 4","channel-group 1 mode desirable","channel-group 2 mode desirable","exit","interface po1","switchport mode trunk","switchport trunk allowed vlan 10,20","switchport trunk native vlan 99","do show running-config | section interface","interface po2","switchport mode trunk","end","write memory"]})}
<p>Task 2's <code>Command rejected (Channel protocol mismatch…)</code> is real IOS behaviour: a group is LACP, PAgP or static, never a mix.</p>
${K.check({q:"An engineer configures a new bundle and then types switchport trunk allowed vlan add 40 under interface Gi0/2, one of its two members. What is the most likely result?", o:["Both members carry VLAN 40","Gi0/2 no longer matches the other member and is suspended; the bundle loses capacity","The Port-channel interface copies the change automatically","The switch reloads the bundle with VLAN 40"], a:1, why:"Settings flow down from the Port-channel to the members, not up from a member. A member whose allowed list differs is suspended (flag s). The change belonged under interface port-channel."})}

<h2>Verifying: reading the summary, STP and trunk outputs</h2>
<p>Three commands tell you everything about a Layer 2 bundle. Learn to read each one line by line.</p>
<h3>show etherchannel summary</h3>
${K.out(`ACC-SW#show etherchannel summary
Flags:  D - down        P - bundled in port-channel
        I - stand-alone s - suspended
        H - Hot-standby (LACP only)
        R - Layer3      S - Layer2
        U - in use      f - failed to allocate aggregator

        M - not in use, minimum links not met
        u - unsuitable for bundling
        w - waiting to be aggregated
        d - default port

Number of channel-groups in use: 1
Number of aggregators:           1

Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
1      Po1(SU)       LACP        Gi0/7(P)  Gi0/8(P)`, "A working bundle, as you'll see it on the first bench below.")}
<ul>
<li>The legend prints every time. Letters after the <b>Port-channel</b> describe the bundle; letters after each <b>port</b> describe that member.</li>
<li><b><code>Po1(SU)</code></b> — ${K.g("SU","Port-channel flags in show etherchannel summary: S = switched (Layer 2), U = in use. The healthy state for a Layer 2 bundle.")} means <code>S</code> Layer 2 (switched), <code>U</code> in use: healthy. A Layer 3 bundle shows ${K.g("RU","Port-channel flags: R = routed (Layer 3), U = in use. The healthy state for a Layer 3 bundle.")}.</li>
<li><b><code>Po1(SD)</code></b> — Layer 2, <b>down</b>: no member is bundled.</li>
<li><b><code>LACP</code></b> — the protocol; <code>PAgP</code>, or <code>-</code> for static <code>on</code>.</li>
<li><b><code>(P)</code></b> — member bundled and carrying traffic. You want every member P.</li>
<li><b><code>(I)</code></b> — ${K.g("stand-alone","Member flag I: running as an ordinary individual port because negotiation found no partner.")}: no partner, so it's an ordinary port, and STP may block it.</li>
<li><b><code>(s)</code></b> — suspended: settings don't match, so it carries nothing.</li>
<li><b><code>(D)</code></b> — down: no link, shut or err-disabled.</li>
<li><b><code>(H)</code></b> — LACP hot-standby.</li>
</ul>
${K.remember(`<b>Bundle letters: Switched or Routed + Up or Down</b> (<code>SU</code>, <code>SD</code>, <code>RU</code>, <code>RD</code>). <b>Member letters: P is Present, I is Individual, s is sulking (suspended), D is Dead.</b> Healthy = <code>Po1(SU)</code> with every member <code>(P)</code>.`)}
<h3>show spanning-tree: Po1 is one port</h3>
<p>Here is the access switch before and after bundling, from the same bench. Before:</p>
${K.out(`ACC-SW#show spanning-tree vlan 10 | begin Interface
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Desg FWD 4         128.1    P2p
Gi0/7               Root FWD 4         128.7    P2p
Gi0/8               Altn BLK 4         128.8    P2p`, "No bundle: Gi0/8 is the alternate port, blocking. Its LED is amber.")}
<p>After:</p>
${K.out(`ACC-SW#show spanning-tree vlan 10 | begin Interface
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Desg FWD 4         128.1    P2p
Po1                 Root FWD 3         128.65   P2p`, "Bundled: Gi0/7 and Gi0/8 have disappeared from STP's list. Po1 is the root port, forwarding, with the lower bundle cost of 3.")}
<p>If a member port ever appears here on its own, it isn't bundled.</p>
<h3>show interfaces trunk: the trunk is Po1</h3>
${K.out(`ACC-SW#show interfaces trunk
Port        Mode             Encapsulation  Status        Native vlan
Po1         on               802.1q         trunking      1

Port        Vlans allowed on trunk
Po1         1-4094

Port        Vlans allowed and active in management domain
Po1         1,10

Port        Vlans in spanning tree forwarding state and not pruned
Po1         1,10`, "The trunk is listed once, as Po1. The members don't appear separately.")}
<p>The last block lists VLANs STP is forwarding on the bundle; before bundling, Gi0/8 would have shown <code>none</code> there.</p>
${K.exam(`CCNA 200-301 topic 2.4: &ldquo;Configure and verify (Layer 2/Layer 3) EtherChannel (LACP)&rdquo;. Expect a <code>show etherchannel summary</code> exhibit: <code>SU</code> working Layer 2, <code>RU</code> working Layer 3, <code>SD</code> no working members; <code>(I)</code> and <code>(s)</code> members carry no bundle traffic. Trap: <code>Po1(SU)</code> with one member <code>(s)</code> is up — on fewer links than you think.`)}

<h3>Hands-on: bundle two blocked uplinks with LACP</h3>
<p>Two switches, two copper trunks, already cabled. DIST-SW is root, so ACC-SW's port 8 is blocking (amber LED). Configure LACP <code>active</code> on ACC-SW and <code>passive</code> on DIST-SW, and watch it go green as both cables join <code>Po1</code>.</p>
${K.bench({id:"m4-lacp-uplinks", points:80, from:"CCNA · Module 4 · lesson 6", title:"two uplinks, one blocked: bundle them with LACP", viewBox:"0 0 760 380",
  intro:"The console cable is in ACC-SW: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP at 9600 8N1, no flow control. To reach DIST-SW later, click ACC-SW's console port, <b>Unplug</b>, and plug a tray console cable into DIST-SW's CON port. Neither switch has an enable secret. Gi0/7 and Gi0/8 are already trunks on both switches.",
  devices:[
    {id:"sw1", kind:"switch", label:"DIST-SW", model:"Catalyst 9300 · distribution", x:20, y:20,
      config:e=>{ ["en","conf t","hostname DIST-SW","vlan 10","name STAFF","exit","spanning-tree vlan 1,10 priority 4096","interface range g0/7 - 8","switchport mode trunk","interface g0/1","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length = 0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = line => { const o = run(line); e.seen.push({line:String(line), out: typeof o==="string" ? o : (o && o.text) || ""}); return o; }; }},
    {id:"srv", kind:"server", label:"FILE-SRV", x:600, y:12, ip:"10.10.10.20", mask:"255.255.255.0", gw:"10.10.10.1"},
    {id:"sw2", kind:"switch", label:"ACC-SW", model:"Catalyst 9200 · branch floor", x:20, y:250,
      config:e=>{ ["en","conf t","hostname ACC-SW","vlan 10","name STAFF","exit","interface range g0/7 - 8","switchport mode trunk","interface g0/1","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length = 0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = line => { const o = run(line); e.seen.push({line:String(line), out: typeof o==="string" ? o : (o && o.text) || ""}); return o; }; }},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:480, y:250},
    {id:"pc1", kind:"pc", label:"TELLER-PC", x:620, y:250, ip:"10.10.10.31", mask:"255.255.255.0", gw:"10.10.10.1"},
  ],
  cables:[ {type:"cat6", a:"sw1:g7", b:"sw2:g7"}, {type:"cat6", a:"sw1:g8", b:"sw2:g8"}, {type:"cat6", a:"srv:eth", b:"sw1:g1"}, {type:"cat6", a:"pc1:eth", b:"sw2:g1"}, {type:"console", a:"lap:usb", b:"sw2:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Open the console session to ACC-SW from YOUR LAPTOP (9600 baud, 8 data bits, no parity, 1 stop bit, no flow control)", done:B=>Bench.consoleOk(B,"sw2") || B.devs.sw2.env.seen.length>0},
    {text:"<code>enable</code>, then <code>show spanning-tree vlan 10</code>: Gi0/8 is <b>Altn BLK</b> — the second uplink is idle (amber LED)", done:B=>B.devs.sw2.env.seen.some(s=>/Gi0\/8\s+Altn BLK/.test(s.out))},
    {text:"On ACC-SW, bundle both uplinks with LACP, this side asking: <code>configure terminal</code>, <code>interface range g0/7 - 8</code>, <code>channel-group 1 mode active</code>, <code>end</code>", done:B=>["GigabitEthernet0/7","GigabitEthernet0/8"].every(n=>{ const c = B.devs.sw2.env.intfs[n].channel; return c && c.group===1 && c.mode==="active"; })},
    {text:"<code>show etherchannel summary</code> on ACC-SW before touching DIST-SW. Po1 exists — but what are the bundle and member flags while nobody answers?", done:B=>B.devs.sw2.env.seen.some(s=>/Po1\(S[DU]\)/.test(s.out))},
    {text:"Move the console to DIST-SW and make its Gi0/7–8 answer: <code>channel-group 1 mode passive</code>. The bundle forms on both switches", done:B=>["GigabitEthernet0/7","GigabitEthernet0/8"].every(n=>{ const c = B.devs.sw1.env.intfs[n].channel; return c && c.group===1 && c.mode==="passive"; }) && Bench.bundled(B,"sw1",1) && Bench.bundled(B,"sw2",1)},
    {text:"<code>show etherchannel summary</code>: <b>Po1(SU)</b>, with Gi0/7 and Gi0/8 both <b>(P)</b>", done:B=>["sw1","sw2"].some(k=>B.devs[k].env.seen.some(s=>/Po1\(SU\)[\s\S]*Gi0\/7\(P\)\s+Gi0\/8\(P\)/.test(s.out)))},
    {text:"<code>show spanning-tree vlan 10</code>: one port, <b>Po1</b>, forwarding — nothing blocks", done:B=>Bench.stpRole(B,"sw2","po1",10)==="Root FWD" && ["sw1","sw2"].some(k=>B.devs[k].env.seen.some(s=>/^Po1\s+(Root|Desg) FWD/m.test(s.out)))},
    {text:"<code>show interfaces trunk</code>: the trunk is listed as <b>Po1</b>, not as two ports", done:B=>["sw1","sw2"].some(k=>B.devs[k].env.seen.some(s=>/^Po1\s+on\s+802\.1q/m.test(s.out)))},
    {text:"From TELLER-PC, <code>ping 10.10.10.20</code> across the bundle, then <code>write memory</code> on DIST-SW", done:B=>Bench.pinged(B,"pc1","10.10.10.20") && Bench.bundled(B,"sw2",1) && B.devs.sw1.env.savedOnce},
  ],
  win:"You turned a blocked backup link into a working bundle: Po1(SU) with both members (P), one STP port with cost 3, one trunk — and the teller PC still reaches the server, now over two cables.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show spanning-tree vlan 10"],["pc","pc1","ping 10.10.10.20"],
    ["term","configure terminal"],["term","interface range g0/7 - 8"],["term","channel-group 1 mode active"],["term","end"],["term","show etherchannel summary"],
    ["unplug","lap:usb"],["plug","console","lap:usb","sw1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],
    ["term","configure terminal"],["term","interface range g0/7 - 8"],["term","channel-group 1 mode passive"],["term","end"],["term","show etherchannel summary"],["term","show spanning-tree vlan 10"],["term","show interfaces trunk"],
    ["pc","pc1","ping 10.10.10.20"],["term","write memory"]]})}
${K.hint(`After task 3, ACC-SW shows <code>Po1(SD)</code> with both members <code>(I)</code>: it sends LACPDUs, but DIST-SW has no channel group yet, so there's no partner — and STP still blocks Gi0/8, so nothing dangerous happens while you move the console. If <code>channel-group</code> gives <code>% Invalid input</code>, check you're at <code>(config-if-range)#</code>.`)}
<p>With only ACC-SW configured, the network ran exactly as before. With <code>mode on</code>, ACC-SW would have bundled at once and sent traffic down both cables to a switch that still saw two separate ports.</p>
${K.check({q:"On the bench, after configuring only ACC-SW, show etherchannel summary showed Po1(SD) with Gi0/7(I) and Gi0/8(I). What did that mean?", o:["The bundle was working at half speed","LACP found no partner, so both ports ran as individual links and STP kept one blocking","Both ports were suspended because their settings differed","Both ports were down"], a:1, why:"SD = Layer 2 bundle, down (no bundled members). I = stand-alone: negotiation found nobody to bundle with, so the port behaves as a normal port. STP still sees two ports and blocks one, which keeps the network safe."})}

<h2>Load balancing and Layer 3 EtherChannel</h2>
<p>How does a switch choose a cable for each frame? Not by alternating: frames of one conversation would arrive out of order, which TCP treats as loss. It uses ${K.g("per-flow load balancing","Each flow (a conversation identified by its addresses) always uses the same member, so its frames stay in order; different flows spread across members.")}: chosen address fields go through a ${K.g("hash","A quick calculation turning input (here, addresses) into a small number; the same input always gives the same number.")} whose result picks a member. One ${K.g("flow","All the frames between the same pair of addresses (or ports, depending on the hash).")} always lands on the same cable; many flows spread across all of them.</p>
${K.steps([
  ["The setup", `<p>Two members, hashing on source and destination IP. PCs <code>10.1.1.10</code> and <code>10.1.1.11</code> copy files from <code>10.9.9.20</code>. (A simplified version of the hardware's sum, but the idea is exact.)</p>`],
  ["Flow 1: 10.1.1.10 ↔ 10.9.9.20", `<p>${K.g("XOR","Exclusive OR: compares two binary numbers bit by bit; each result bit is 1 where the two bits differ and 0 where they are the same.")} the last octets: <code>00001010</code> (10) XOR <code>00010100</code> (20) = <code>00011110</code>. With two members only the lowest bit matters: <b>0</b> → member 1.</p>`],
  ["Flow 2: 10.1.1.11 ↔ 10.9.9.20", `<p><code>00001011</code> (11) XOR <code>00010100</code> = <code>00011111</code>. Lowest bit <b>1</b> → member 2.</p>`],
  ["The result", `<p>Together the copies reach 2 Gb/s, but each is capped at its one 1 Gb/s member. The hash never splits a flow.</p>`],
])}
${K.svg("0 0 720 270",
  K.dev("pc",60,50,"PC-A","10.1.1.10")+K.dev("pc",60,135,"PC-B","10.1.1.11")+K.dev("pc",60,220,"PC-C","10.1.1.12")+
  K.dev("switch",250,135,"ACC-SW","")+K.dev("switch",470,135,"DIST-SW","")+K.dev("server",640,135,"FILE-SRV","10.9.9.20")+
  K.link(80,50,224,128,"")+K.link(80,135,224,135,"")+K.link(80,220,224,142,"")+
  K.link(276,126,444,126,"")+K.link(276,144,444,144,"")+K.link(496,135,622,135,"")+
  `<ellipse cx="360" cy="135" rx="60" ry="22" fill="none" stroke="var(--accent)" stroke-width="1.4"/>`+
  K.txt(360,108,"member 1 (Gi0/7): flows A and C",{mid:true,s:10.5,c:"accent"})+
  K.txt(360,172,"member 2 (Gi0/8): flow B",{mid:true,s:10.5,c:"accent"})+
  K.txt(360,200,"Po1 = 2 Gb/s in total",{mid:true,s:11,c:"fg"})+
  K.txt(360,232,"but any single flow ≤ 1 Gb/s",{mid:true,s:11,c:"warn"})+
  K.txt(360,250,"(the hash never splits one flow)",{mid:true,s:10.5}),
  "Per-flow load balancing on a two-member bundle hashing on source and destination IP: each PC's conversation with the server is pinned to one member. Many flows use the full bundle; one flow never gets more than one link.")}
<h3>Choosing the hash: port-channel load-balance</h3>
<p>The fields are a global setting: <code>src-mac</code>, <code>dst-mac</code>, <code>src-dst-mac</code>, <code>src-ip</code>, <code>dst-ip</code>, <code>src-dst-ip</code>, plus Layer 4 port options on some platforms. The default varies by platform and software (often <code>src-mac</code> on older access switches, <code>src-dst-ip</code> on many current ones; the lab's switches show <code>src-mac</code>), so check:</p>
${K.out(`DIST-SW1(config)#port-channel load-balance src-dst-ip
DIST-SW1(config)#end
DIST-SW1#show etherchannel load-balance
EtherChannel Load-Balancing Configuration:
        src-dst-ip

EtherChannel Load-Balancing Addresses Used Per-Protocol:
Non-IP: Source XOR Destination MAC address
  IPv4: Source XOR Destination IP address
  IPv6: Source XOR Destination IP address`, "Setting and checking the hash. src-dst-ip combines both IP addresses; non-IP frames fall back to the MAC addresses.")}
<p>The command is global, so it covers every bundle. <b>Hash on fields that vary.</b> An access switch's upstream traffic nearly all goes to one MAC, the gateway's: hash on <code>dst-mac</code> and it all lands on one member. <code>src-dst-ip</code> mixes many addresses and spreads well. Many Catalysts also spread most evenly with <b>2, 4 or 8</b> members, because the hash yields 8 &ldquo;buckets&rdquo;: 3 members split 3:3:2.</p>
${K.mistake(`Promising a user that a two-link bundle will make their one big copy twice as fast. One flow rides one member. The bundle helps the whole floor, not one copy.`)}
<h3>Layer 3 EtherChannel</h3>
<p>So far the Port-channel was a switchport: a ${K.g("Layer 2 EtherChannel","A bundle of switchports (access or trunk); STP runs on it. Flag S.")}. Between Layer 3 switches, or to a router or firewall, you often want a <b>routed</b> link: an IP at each end, no VLANs, no STP. Lesson 3's <code>no switchport</code> makes a ${K.g("routed port","A switch port acting as a router interface: an IP address, no VLAN.")}; a ${K.g("Layer 3 EtherChannel","A bundle of routed ports; the IP address goes on the Port-channel. Flag R.")} bundles them:</p>
${K.out(`DIST-SW1(config)#ip routing
DIST-SW1(config)#interface range gi1/0/23 - 24
DIST-SW1(config-if-range)#no switchport
DIST-SW1(config-if-range)#channel-group 2 mode active
Creating a port-channel interface Port-channel 2
DIST-SW1(config-if-range)#interface port-channel 2
DIST-SW1(config-if)#ip address 10.0.0.1 255.255.255.252
DIST-SW1(config-if)#no shutdown
DIST-SW1(config-if)#end
DIST-SW1#show etherchannel summary | begin Group
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
2      Po2(RU)       LACP        Gi1/0/23(P)  Gi1/0/24(P)`, "A Layer 3 LACP bundle to the core: the members are routed (no switchport), the IP address lives on Port-channel 2, and the summary shows R for Layer 3.")}
<ul>
<li><code>no switchport</code> on the members <b>before</b> <code>channel-group</code>, so the new Port-channel is routed too. (<code>ip routing</code> lets the switch route, lesson 3.)</li>
<li><code>ip address</code> goes on <code>interface port-channel 2</code>, <b>never</b> on a member: one routed interface, one IP.</li>
<li><code>Po2(RU)</code> — Layer 3, in use. The far end needs routed members, a compatible mode and an address in the same /30.</li>
</ul>
<p>No STP runs on a routed bundle, and if a member fails the interface stays up, so routes don't change.</p>
${K.when([
  ["Layer 2 EtherChannel (trunk)","Access to distribution uplinks carrying VLANs","VLANs cross it; STP sees one port","You want a routed boundary"],
  ["Layer 3 EtherChannel","Distribution to core, switch to router or firewall","One routed interface, more bandwidth, no STP","The link must carry several VLANs"],
], "Layer 2 or Layer 3 bundle?")}
${K.check({q:"A two-member 10 Gb/s bundle connects a backup server to the core. The nightly backup is one TCP stream from one server to one storage array, and it never goes faster than about 10 Gb/s. Why?", o:["The bundle is misconfigured; it should reach 20 Gb/s","Per-flow hashing puts the whole stream on one member, so one flow can't exceed one link's speed","LACP limits each bundle to the speed of one member","STP blocks one member"], a:1, why:"The hash maps a given source/destination pair to one member so frames stay in order. A single stream is a single flow, so it uses one 10 Gb/s link. Two parallel streams (or more hosts) could use both."})}
${K.q({type:"fill", q:"Configure the switch to hash on both the source and destination IP addresses for all its EtherChannels. Type the global configuration command.", fields:[{label:"Command", a:["port-channel load-balance src-dst-ip"], ios:true}], why:"port-channel load-balance src-dst-ip is a global command that applies to every bundle on the switch. Check it with show etherchannel load-balance."})}

<h2>When it won't bundle: troubleshooting</h2>
<p>The member flags in <code>show etherchannel summary</code> — read on <b>both</b> switches — tell you which of the usual causes you have.</p>
<div class="tablewrap"><table>
<tr><th>Summary shows</th><th>Meaning</th><th>Check</th><th>Typical fix</th></tr>
<tr><td><code>Po1(SD)</code>, members <code>(I)</code></td><td>No negotiation partner</td><td>Modes at both ends: <code>show running-config | include channel-group</code></td><td>One end active/desirable; same protocol; far end configured at all</td></tr>
<tr><td>Members <code>(s)</code></td><td>Settings don't match</td><td><code>show interfaces gi0/7 switchport</code> vs gi0/8; <code>%EC-5-CANNOT_BUNDLE2</code> in the log</td><td>Set it on <code>interface port-channel N</code></td></tr>
<tr><td>Members <code>(D)</code></td><td>Link down</td><td><code>show interfaces status</code></td><td>Cable, optic, <code>no shutdown</code>, err-disable cause</td></tr>
<tr><td>No group listed</td><td>Not configured here</td><td><code>show running-config interface gi0/7</code></td><td>Configure the bundle</td></tr>
</table></div>
<h3>Hands-on: repair a bundle that never came up</h3>
<p>Floor 3 of a Lagos head office reaches CORE-SW over two trunks &ldquo;bundled&rdquo; last week, but one cable is idle, and the new CCTV VLAN 30 must reach the NVR. The core team say CORE-SW is <code>channel-group 1 mode passive</code> on Gi0/7–8 and must not be changed. Your console is on FL3-SW: diagnose with the summary, fix the mode, then fix whatever it shows next.</p>
${K.bench({id:"m4-ec-repair", points:90, from:"CCNA · Module 4 · lesson 6", title:"repair a bundle that never came up", viewBox:"0 0 760 490",
  intro:"Console is cabled to FL3-SW: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. CORE-SW is the root bridge and is configured correctly (LACP passive, trunk allowing VLANs 10, 20 and 30). STAFF-PC (VLAN 10) uses FILE-SRV; CCTV-PC (VLAN 30) uses the NVR.",
  devices:[
    {id:"sw1", kind:"switch", label:"CORE-SW", model:"Catalyst 9500 · comms room", x:20, y:20,
      config:e=>{ ["en","conf t","hostname CORE-SW","vlan 10","name STAFF","vlan 20","name VOICE","vlan 30","name CCTV","exit","spanning-tree vlan 1,10,20,30 priority 4096","interface range g0/7 - 8","switchport mode trunk","switchport trunk allowed vlan 10,20,30","channel-group 1 mode passive","interface g0/1","switchport mode access","switchport access vlan 30","interface g0/2","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length = 0; }},
    {id:"nvr", kind:"server", label:"NVR", x:480, y:10, ip:"10.30.30.20", mask:"255.255.255.0", gw:"10.30.30.1"},
    {id:"fs", kind:"server", label:"FILE-SRV", x:620, y:10, ip:"10.10.10.20", mask:"255.255.255.0", gw:"10.10.10.1"},
    {id:"sw2", kind:"switch", label:"FL3-SW", model:"Catalyst 9200 · floor 3", x:20, y:250,
      config:e=>{ ["en","conf t","hostname FL3-SW","vlan 10","name STAFF","vlan 20","name VOICE","vlan 30","name CCTV","exit","interface range g0/7 - 8","switchport mode trunk","switchport trunk allowed vlan 10,20","channel-group 1 mode passive","interface g0/7","switchport trunk allowed vlan add 30","interface g0/1","switchport mode access","switchport access vlan 30","interface g0/2","switchport mode access","switchport access vlan 10","end"].forEach(c=>e.exec(c)); e.history.length = 0; },
      setup:d=>{ const e = d.env, run = e.exec; e.seen = []; e.exec = line => { const o = run(line); e.seen.push({line:String(line), out: typeof o==="string" ? o : (o && o.text) || ""}); return o; }; }},
    {id:"cam", kind:"pc", label:"CCTV-PC", x:480, y:250, ip:"10.30.30.31", mask:"255.255.255.0", gw:"10.30.30.1"},
    {id:"pc2", kind:"pc", label:"STAFF-PC", x:620, y:250, ip:"10.10.10.31", mask:"255.255.255.0", gw:"10.10.10.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:480, y:380},
  ],
  cables:[ {type:"cat6", a:"sw1:g7", b:"sw2:g7"}, {type:"cat6", a:"sw1:g8", b:"sw2:g8"}, {type:"cat6", a:"nvr:eth", b:"sw1:g1"}, {type:"cat6", a:"fs:eth", b:"sw1:g2"},
           {type:"cat6", a:"cam:eth", b:"sw2:g1"}, {type:"cat6", a:"pc2:eth", b:"sw2:g2"}, {type:"console", a:"lap:usb", b:"sw2:con"} ],
  tray:["console","cat6"],
  tasks:[
    {text:"Console into FL3-SW, <code>enable</code>, and run <code>show etherchannel summary</code>. Read the bundle flag and both member flags", done:B=>B.devs.sw2.env.seen.some(s=>/Po1\(SD\)[\s\S]*Gi0\/7\(I\)/.test(s.out))},
    {text:"Confirm what the flags imply: <code>show spanning-tree vlan 10</code> shows one uplink as <b>Altn BLK</b>", done:B=>B.devs.sw2.env.seen.some(s=>/Gi0\/8\s+Altn BLK/.test(s.out))},
    {text:"Find the mode on this side: <code>show running-config | include channel-group</code>. Compare it with what the core team told you", done:B=>B.devs.sw2.env.seen.some(s=>/channel-group 1 mode passive/.test(s.out))},
    {text:"Fix the mode without touching CORE-SW: make FL3-SW's Gi0/7–8 start the LACP negotiation", done:B=>["GigabitEthernet0/7","GigabitEthernet0/8"].every(n=>{ const c = B.devs.sw2.env.intfs[n].channel; return c && c.group===1 && c.mode==="active"; })},
    {text:"Run the summary again. Po1 is now up (SU) and Gi0/8 is (P), but Gi0/7 has moved from (I) to a new flag: find out why by comparing the two members —<code>show interfaces g0/7 switchport</code> and <code>show interfaces g0/8 switchport</code>, or <code>show running-config | section GigabitEthernet0/[78]</code>", done:B=>B.devs.sw2.env.seen.some(s=>/Gi0\/[78]\(s\)/.test(s.out) || /Trunking VLANs Enabled/.test(s.out) || /interface GigabitEthernet0\/8\n[\s\S]*allowed vlan/.test(s.out))},
    {text:"Fix it the right way: set the allowed list once on <code>interface po1</code> (VLANs 10, 20 and 30) so it reaches both members", done:B=>{ const I = B.devs.sw2.env.intfs; return ["Port-channel1","GigabitEthernet0/7","GigabitEthernet0/8"].every(n=>I[n] && JSON.stringify(I[n].allowed)==="[10,20,30]") && Bench.bundled(B,"sw2",1) && Bench.bundled(B,"sw1",1); }},
    {text:"Verify: <code>show etherchannel summary</code> shows <b>Po1(SU)</b> with both members <b>(P)</b>, and <code>show spanning-tree vlan 10</code> lists only <b>Po1</b> for the uplink", done:B=>B.devs.sw2.env.seen.some(s=>/Po1\(SU\)[\s\S]*Gi0\/7\(P\)\s+Gi0\/8\(P\)/.test(s.out)) && Bench.stpRole(B,"sw2","po1",10)==="Root FWD" && B.devs.sw2.env.seen.some(s=>/^Po1\s+Root FWD/m.test(s.out))},
    {text:"Prove both VLANs cross the bundle: CCTV-PC pings the NVR (10.30.30.20) and STAFF-PC pings FILE-SRV (10.10.10.20). Then <code>write memory</code>", done:B=>Bench.pinged(B,"cam","10.30.30.20") && Bench.pinged(B,"pc2","10.10.10.20") && Bench.bundled(B,"sw2",1) && B.devs.sw2.env.savedOnce},
  ],
  win:"You read the summary like an engineer: (I) meant no negotiation partner (passive facing passive), (s) meant a member that didn't match (VLAN 30 added to Gi0/7 only), while Po1(SU) ran on Gi0/8 alone. You fixed the mode, put the allowed list on Po1 where it reaches every member, and proved both VLANs cross a working Po1(SU).",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show etherchannel summary"],["term","show spanning-tree vlan 10"],["term","show running-config | include channel-group"],
    ["term","configure terminal"],["term","interface range g0/7 - 8"],["term","channel-group 1 mode active"],["term","end"],["term","show etherchannel summary"],["term","show interfaces g0/7 switchport"],["term","show interfaces g0/8 switchport"],
    ["term","configure terminal"],["term","interface po1"],["term","switchport trunk allowed vlan 10,20,30"],["term","end"],["term","show etherchannel summary"],["term","show spanning-tree vlan 10"],
    ["pc","cam","ping 10.30.30.20"],["pc","pc2","ping 10.10.10.20"],["term","write memory"]]})}
${K.hint(`Two passive ends never start LACP: one must be <code>active</code>. After that, compare the <code>Trunking VLANs Enabled</code> line of each member. Someone added VLAN 30 under <code>interface g0/7</code> only. Under <code>interface po1</code>, <code>switchport trunk allowed vlan 10,20,30</code> sets the list on Po1 and both members in one go.`)}
<p>Note: as on a real Catalyst, only the member that differs is suspended: you saw <code>Po1(SU)</code> with <code>Gi0/7(s)</code> and <code>Gi0/8(P)</code>, a bundle that is up on fewer links than it should be — the exam trap from earlier. A real Catalyst also logs <code>%EC-5-CANNOT_BUNDLE2</code> for the suspended member; the bench doesn't print that message, so compare the members' settings as you did. The diagnosis and fix are the same.</p>
${K.myth([
  ["A 2 × 1 Gb/s EtherChannel gives every transfer 2 Gb/s.","Each flow is hashed to one member; one flow never exceeds 1 Gb/s."],
  ["STP is switched off on EtherChannel links.","STP runs on the Port-channel as one port; it just has no loop to block."],
  ["The channel-group number must match on both switches.","It's locally significant: Po1 can face Po5. Matching is only housekeeping."],
  ["Mode on is simplest, so it's safest.","It's the riskiest: no checks, so a one-sided mistake can loop or black-hole traffic."],
  ["Bundle 1 Gb/s with 10 Gb/s to get 11 Gb/s.","Members must match speed and duplex; a mismatched member is suspended."],
])}
${K.dodont([
  "Use LACP, <code>active</code> on both ends.",
  "Build members with <code>interface range</code>; change them later under <code>interface port-channel N</code>.",
  "Check the summary on <b>both</b> switches after any change.",
  "Use 2, 4 or 8 same-speed members, and a hash on fields that vary.",
],[
  "Don't use <code>on</code> unless the far device can't negotiate.",
  "Don't change VLAN or trunk settings on one member.",
  "Don't put an IP address on a Layer 3 bundle's member.",
  "Don't mix LACP and PAgP, or routed and switched ports, in one group.",
])}
${K.check({q:"show etherchannel summary on one switch shows: 1  Po1(SU)  LACP  Gi0/7(P)  Gi0/8(s). What is true?", o:["The bundle is down","The bundle is up on Gi0/7 only; Gi0/8 is suspended, probably because its settings differ from the bundle","Both members carry traffic, but Gi0/8 is slower","Gi0/8 is the LACP hot-standby member"], a:1, why:"SU = Layer 2, in use. Gi0/7 (P) carries all the traffic; Gi0/8 (s) is suspended and carries none. Compare Gi0/8's switchport settings with the bundle's and fix them under interface port-channel 1. Hot-standby would be (H)."})}

${K.job("“We paid for a second uplink and it never carries traffic”",`
<p><b>The ticket.</b> &ldquo;Ikeja branch. Second fibre between BR-ACC and BR-DIST installed three weeks ago for double bandwidth. The graph for Gi1/1/2 is flat at zero. Lunchtime is still slow when the tellers run end-of-day reports. — Branch manager.&rdquo;</p>
<p><b>Questions first.</b> &ldquo;Bandwidth or backup?&rdquo; — <i>&ldquo;Bandwidth; the quote said 2 Gb/s.&rdquo;</i> &ldquo;Was anything configured?&rdquo; — <i>&ldquo;The installer just patched it.&rdquo;</i> You can predict the answer before logging in.</p>
<p><b>Checks.</b> On BR-ACC:</p>
${K.out(`BR-ACC#show spanning-tree vlan 10 | begin Interface
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi1/0/5             Desg FWD 4         128.5    P2p Edge
Gi1/1/1             Root FWD 4         128.25   P2p
Gi1/1/2             Altn BLK 4         128.26   P2p
BR-ACC#show etherchannel summary | begin Group
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------`, "Gi1/1/2 is the alternate port, blocking, in VLAN 10 (and every other VLAN). No channel groups exist. The second fibre is a standby link.")}
<p>Nothing is faulty: the design was never finished. <code>show interfaces trunk</code> shows both uplinks with the same native VLAN and allowed list, and <code>show interfaces status</code> both at <code>a-full a-1000</code>, so they can be bundled as they are.</p>
<p><b>The fix.</b> In a 15-minute window after closing, BR-DIST first, then BR-ACC:</p>
${K.out(`BR-DIST(config)#interface range gi1/0/47 - 48
BR-DIST(config-if-range)#channel-group 1 mode active
Creating a port-channel interface Port-channel 1
BR-DIST(config-if-range)#end
BR-ACC(config)#interface range gi1/1/1 - 2
BR-ACC(config-if-range)#channel-group 1 mode active
Creating a port-channel interface Port-channel 1
BR-ACC(config-if-range)#end
BR-ACC#show etherchannel summary | begin Group
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
1      Po1(SU)       LACP        Gi1/1/1(P)  Gi1/1/2(P)`, "LACP active on both ends. While only BR-DIST was configured, the ports stayed individual and STP kept protecting the network; the bundle formed when BR-ACC joined.")}
<p><code>show spanning-tree vlan 10</code> now shows <code>Po1 Root FWD 3</code>, <code>show interfaces trunk</code> lists Po1, a teller PC reaches the core banking server, and both switches are saved. <code>show etherchannel load-balance</code> shows <code>src-mac</code> — fine upstream, where the teller MACs vary.</p>
<p><b>What you say.</b> &ldquo;The second fibre worked, but the switches kept it as a spare. I've joined the two into one link: they share the load, and if either fails the branch stays online. Busy times get the extra capacity; one single big download still runs at one fibre's speed.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Ikeja BR-ACC Gi1/1/2 idle since install: sh span vlan 10 = Altn BLK, no EtherChannel configured. Not a fault — STP blocking redundant link. Change window 18:30: LACP active both ends, BR-DIST Gi1/0/47-48 and BR-ACC Gi1/1/1-2 → Po1. Verified Po1(SU), members (P), Po1 Root FWD cost 3, trunk on Po1, teller ping to core OK. Load-balance src-mac (left as is). Saved both. Monitoring updated to graph Po1. 35 min.&rdquo;</i></p>`)}

${K.case("The server team asks for LACP to a NIC team",`
<p>A payments company's data centre in Lekki is building a database host with two 10 Gb/s NICs in one team. The server team ask for &ldquo;LACP on ${K.g("Te1/0/11","TenGigabitEthernet1/0/11: a 10 Gb/s port. On a stack the first number is the stack member, so Te2/0/11 is port 11 on switch 2.")} and Te2/0/11&rdquo;. Linux calls this a <b>bond</b> in mode <code>802.3ad</code>; Windows and VMware call it a team or ${K.g("LAG","Link Aggregation Group: the general, vendor-neutral name for a bundle of links that act as one. Cisco calls it an EtherChannel.")}. Same protocol you used between switches.</p>
<p><b>Same switch?</b> The two ports are on different members of a switch <b>stack</b>, which acts as one switch, so one Port-channel can include both — protecting the server from a whole switch failing. Two independent switches couldn't share one bundle; they must act as one (a stack, ${K.g("StackWise Virtual","A Cisco Catalyst feature (common on 9500s) that joins two switches over a link so they run as one logical switch.")}, or ${K.g("vPC","virtual Port Channel: a feature of Cisco's Nexus data-centre switches that lets two separate switches each carry members of the same bundle.")} on Nexus).</p>
<p><b>Really LACP?</b> Some server teaming modes are &ldquo;switch independent&rdquo; and expect two ordinary switch ports; a channel against them causes trouble. The engineer confirms <code>802.3ad</code>, then configures both ports in <code>channel-group 11 mode active</code>, with the Port-channel as an access port in the database VLAN with PortFast (lesson 5).</p>
<p><b>Build day.</b> During a network (PXE) install there is no bond yet, so no LACPDUs. Most Catalysts run such members stand-alone, so the installer still has a link, but some platforms suspend them — so the team check the platform first.</p>
<p><b>Expectations.</b> The team expected 20 Gb/s for nightly replication. It's one or two TCP streams to one address, so it mostly rides one member. They switch the tool to parallel streams, and with Layer 4 port hashing the streams spread.</p>
<p><b>Verification.</b> <code>Po11(SU)</code>, both members <code>(P)</code>; on the server, <code>/proc/net/bonding/bond0</code> shows the same ${K.g("aggregator ID","Linux's number for the bundle a NIC has joined. Both NICs showing the same ID means both are in one LACP bundle.")} on both NICs. Shutting Te1/0/11 in the acceptance window, the database keeps answering. The write-up: <b>confirm the server's teaming mode first</b>, <b>a bundle spans two switches only if they act as one</b>, <b>one stream rides one link</b>.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Name all three, say what each sends (or doesn't), give the modes and the bad pairs, then say which you'd choose and why.`)}
${K.reveal("“LACP vs PAgP vs on — which would you use?”",`<p>"All three bundle 2 to 8 links into one Port-channel. LACP is the IEEE standard, 802.3ad/802.1AX: active starts negotiation, passive only answers. PAgP is Cisco's, with desirable and auto. On forces the bundle with no protocol. At least one end must ask, so passive+passive or auto+auto never forms, and on only matches on. I'd use LACP active on both ends: any vendor, and a mis-patch or unconfigured far end simply doesn't bundle while STP keeps protecting the network. On gives no warning and can loop, so only for a device that can't negotiate."</p>`)}
${K.hint(`Explain how traffic is shared — per flow, by a hash — and why it must be that way.`)}
${K.reveal("“Why doesn't a single file copy go faster over a two-link EtherChannel?”",`<p>"EtherChannel balances per flow, not per frame. The switch hashes fields such as source and destination IP — per <code>port-channel load-balance</code> — and the result picks one member. Every frame of one conversation hashes the same, so it stays on one link and in order; splitting it would reorder packets, which TCP treats as loss. So one copy is capped at one member's speed; the extra capacity serves many flows. If the spread is poor, I'd check <code>show etherchannel load-balance</code> and hash on fields that vary."</p>`)}
${K.hint(`Go flag by flag, then name the two or three most likely causes and how you'd check each.`)}
${K.reveal("“show etherchannel summary shows Po1(SD) — how do you troubleshoot it?”",`<p>"SD is a Layer 2 bundle with no bundled members, so I read the member flags on both switches. (I) means no partner: I compare modes — passive with passive, auto with auto, LACP with PAgP, or no channel-group at the far end. (s) means the members don't match: I compare speed, duplex, mode, VLANs and allowed list with <code>show interfaces switchport</code> and check the log for %EC-5-CANNOT_BUNDLE2, then fix it on the Port-channel interface. (D) means link down: cabling, optics, shutdown. Then I verify Po1(SU) with every member (P), and Po1 alone in show spanning-tree and show interfaces trunk."</p>`)}

${K.recap([
  "Parallel uplinks are a loop, so STP blocks one; an EtherChannel makes 2–8 links one Port-channel, one STP port, nothing blocked.",
  "LACP (802.3ad/802.1AX): active asks, passive answers. PAgP: desirable asks, auto answers. On matches only on.",
  "Never bundle: passive+passive, auto+auto, on with a negotiating mode, LACP with PAgP. Best: LACP active both ends.",
  "Members must match speed, duplex, mode and VLAN settings, or they are suspended (s).",
  "interface range + channel-group N mode X; then Layer 2 settings on interface port-channel N, which flow to the members.",
  "Summary: SU healthy, SD down, RU Layer 3; members P bundled, I stand-alone, s suspended, D down.",
  "Load balancing is per flow by a hash; one flow never exceeds one member. Layer 3 bundle: no switchport, IP on the Port-channel.",
])}
${K.next(`<b>Lesson 7 — Troubleshooting VLANs, trunks and STP, and the Module 4 challenge.</b> You have every Layer 2 tool now. Next: a structured troubleshooting method, then a pre-broken campus with faults in all of them.`)}
`,
quiz:[
  {lvl:1, q:"What does an EtherChannel do?", o:["Splits one physical link into several VLANs","Bundles several parallel physical links into one logical link","Disables Spanning Tree on trunk links","Encrypts traffic between two switches"], a:1, why:"An EtherChannel combines 2 to 8 parallel links into one logical Port-channel interface. STP, trunking and VLANs see it as one port, so nothing needs to be blocked."},
  {lvl:1, q:"Which EtherChannel negotiation protocol is an IEEE open standard?", o:["PAgP","LACP","DTP","VTP"], a:1, why:"LACP is IEEE 802.3ad, now 802.1AX, and works between vendors. PAgP is Cisco-proprietary. DTP negotiates trunks and VTP distributes VLANs; neither builds bundles."},
  {lvl:2, type:"multi", q:"Which two combinations of modes on the two ends of a link will form an EtherChannel? (Choose two.)", o:["active and passive","passive and passive","auto and auto","desirable and auto","on and active"], a:[0,3], why:"A negotiated bundle needs at least one end that starts: active (LACP) or desirable (PAgP). passive+passive and auto+auto both wait forever. on doesn't negotiate, so it only bundles with on."},
  {lvl:2, q:"Two switches are connected by two 1 Gb/s trunks, not bundled. SW1 is the root bridge for every VLAN. What does show spanning-tree on SW2 show for the two uplinks?", o:["Both Root FWD","One Root FWD and one Altn BLK","Both Desg FWD","Both Altn BLK"], a:1, why:"The two links form a loop. On the non-root switch, the better one becomes the root port (forwarding) and the other an alternate port (blocking). Bundling them into a Port-channel removes the loop from STP's point of view."},
  {lvl:2, q:"Based on the exhibit, what is the state of the bundle?", ex:"SW2#show etherchannel summary | begin Group\nGroup  Port-channel  Protocol    Ports\n------+-------------+-----------+-----------------------------------------------\n1      Po1(SD)       LACP        Gi0/7(I)  Gi0/8(I)", o:["Working Layer 2 bundle with two members","Layer 2 bundle down; both ports run as individual links because LACP found no partner","Layer 3 bundle down because both members are shut","Both members suspended because their VLAN settings differ"], a:1, why:"SD = Layer 2, down (no bundled members). I = stand-alone: the port is in the group but negotiation found no partner, so it runs as a normal port and STP treats it individually. Suspended would be (s); down would be (D)."},
  {lvl:3, q:"After a change, a bundle shows Po1(SU) with Gi0/7(P) and Gi0/8(s). Users report the uplink is up but slower than usual, and the new VLAN 40 doesn't reach the floor. show running-config shows switchport trunk allowed vlan 10,20,40 under Gi0/8 only. What is the best fix?", o:["Shut and re-enable Gi0/8","Set the allowed VLAN list (10,20,40) under interface port-channel 1 so every member matches","Change Gi0/8 to channel-group 1 mode on","Remove Gi0/8 from the bundle permanently"], a:1, why:"Gi0/8 was changed on its own, so it no longer matches the bundle and is suspended: the bundle runs on Gi0/7 alone, which still allows only 10 and 20. Configuring the list on the Port-channel pushes it to both members, Gi0/8 rejoins as (P) and VLAN 40 crosses the bundle."},
  {lvl:1, type:"fill", q:"You are in interface range configuration mode for Gi0/1–2. Which command adds them to channel group 1 using LACP, with this switch starting the negotiation?", fields:[{label:"Command", a:["channel-group 1 mode active"], ios:true}], why:"channel-group 1 mode active puts the ports in group 1 (creating Port-channel 1) with LACP in active mode. passive would wait; desirable/auto would select PAgP; on would skip negotiation."},
  {lvl:2, type:"fill", q:"Which privileged EXEC command shows each Port-channel with its protocol and the flags (P, I, s, D) of every member?", fields:[{label:"Command", a:["show etherchannel summary"], ios:true}], why:"show etherchannel summary lists each group, the Port-channel's flags (SU, SD, RU), the protocol (LACP, PAgP or - for on) and each member with its flag."},
  {lvl:1, type:"order", q:"Put the steps for building a Layer 2 LACP EtherChannel on one switch in order.", items:["Select the member ports with interface range","Give them identical switchport settings","Add them to the group with channel-group 1 mode active","Configure trunk settings under interface port-channel 1","Verify with show etherchannel summary and save"], why:"Select the members together so they stay identical, set the common switchport settings, join them to the group (which creates Port-channel 1 from the first member's settings), make further Layer 2 settings on the Port-channel so they flow to the members, then verify and save."},
  {lvl:2, type:"match", q:"Match each show etherchannel summary flag with its meaning.", pairs:[["P","Member bundled in the port-channel"],["I","Member running stand-alone: no negotiation partner"],["s","Member suspended: settings don't match"],["SU","Layer 2 port-channel in use"],["RU","Layer 3 port-channel in use"]], why:"Letters after a member describe the member (P, I, s, D, H). Letters after the Port-channel describe the bundle: S or R for Layer 2 or Layer 3, U or D for in use or down."},
  {lvl:3, q:"A backup server copies a 2 TB file to a storage array over a 2 × 10 Gb/s LACP bundle hashing on src-dst-ip. The copy never exceeds about 10 Gb/s, and show etherchannel summary shows Po1(SU) with both members (P). What explains this, and what would help?", o:["The bundle is faulty; rebuild it with mode on","One flow is hashed to one member; running several parallel streams (or adding Layer 4 port hashing where supported) lets the copy use both links","STP is blocking one member; raise its cost","LACP limits bundles to the speed of one link; use PAgP"], a:1, why:"A single source/destination pair always hashes to the same member, so one copy is capped at one 10 Gb/s link. The bundle is healthy. Parallel streams with different ports, with a hash that includes Layer 4 ports, can spread across members."},
  {lvl:2, q:"Which statement about a Layer 3 EtherChannel on a Catalyst switch is correct?", o:["The IP address is configured on each member interface","The members are configured with no switchport and the IP address goes on the Port-channel interface","It requires PAgP","show etherchannel summary shows it as SU"], a:1, why:"A Layer 3 bundle is made of routed ports (no switchport), and the single IP address lives on the Port-channel interface. It can use LACP, PAgP or on, and the summary shows R (RU when in use)."},
  {lvl:3, q:"An engineer configures channel-group 1 mode on for SW1's two uplinks. SW2's ports are still ordinary trunks with no channel-group. What risk has the engineer created?", o:["None: on is always safe","SW1 treats the links as one and sends traffic across both, while SW2 sees two separate ports — the ends disagree, which can loop or black-hole traffic until EtherChannel guard err-disables the bundle","SW2 will automatically join the bundle with LACP","Both links will go down until SW2 is configured with mode on"], a:1, why:"on bundles without asking. SW1 believes Po1 is up; SW2 still has two individual ports and may see the same MACs on both. Catalyst EtherChannel guard (on by default) detects this and err-disables the bundle. With LACP, the ports would simply stay individual until both sides agreed."},
  {lvl:2, q:"Based on the exhibit, which statement is true?", ex:"SW2#show spanning-tree vlan 10 | begin Interface\nInterface           Role Sts Cost      Prio.Nbr Type\n------------------- ---- --- --------- -------- --------------------------------\nGi0/1               Desg FWD 4         128.1    P2p\nPo1                 Root FWD 3         128.65   P2p", o:["Po1 is blocked because its cost is lower","The uplinks are bundled: STP sees Po1 as one root port with cost 3, and nothing is blocking","Gi0/7 and Gi0/8 have been shut down","Spanning Tree is disabled on the bundle"], a:1, why:"Only Po1 appears for the uplink: the members are hidden inside the bundle. Its cost of 3 reflects 2 Gb/s of bandwidth (a single 1 Gb/s port costs 4). It is the root port and forwarding."},
  {lvl:3, q:"A server team wants an LACP bundle from a server's two NICs to two switches that are not stacked and run independently. What should the network engineer tell them?", o:["Configure channel-group mode on at both switches instead","A normal EtherChannel can't span two independent switches; they need to act as one (a stack, StackWise Virtual or vPC), or the server should use a switch-independent teaming mode","Use PAgP, which supports two switches","Configure the same channel-group number on both switches and it will work"], a:1, why:"An EtherChannel has to end on one logical switch on each side. Two independent switches send different LACP system IDs (each switch's own identity in its LACPDUs, built from a priority and its MAC address), so the bundle can't form across them. Stacks, StackWise Virtual or vPC make two switches appear as one; otherwise the server should use a teaming mode that doesn't need a switch-side channel."},
],
cards:[
  {f:"EtherChannel / Port-channel", b:"2–8 parallel links bundled into one logical interface (Po1, Po2…). STP, VLANs and trunking see one port; frames are spread across the members."},
  {f:"Why bundle instead of letting STP block?", b:"Without a bundle, a second parallel link is a loop and STP blocks it (alternate port). A bundle uses both links, and a member failure doesn't trigger STP reconvergence."},
  {f:"LACP", b:"IEEE 802.3ad, now 802.1AX. Modes: active (starts negotiation) and passive (only answers). Works with any vendor. Best practice: active on both ends."},
  {f:"PAgP", b:"Cisco-proprietary bundle negotiation. Modes: desirable (starts) and auto (only answers)."},
  {f:"Mode on", b:"Static bundle, no negotiation and no checks. Only works with on at the other end; on facing a negotiating or unconfigured end risks loops or black holes."},
  {f:"Mode pairs that never bundle", b:"passive + passive, auto + auto, on + any negotiating mode, LACP + PAgP."},
  {f:"Member consistency rules", b:"Same speed and duplex, same switchport mode, same access VLAN, or same native VLAN and allowed list on trunks. A member that differs is suspended (s)."},
  {f:"Configure a Layer 2 LACP bundle", b:"interface range gi0/7 - 8; channel-group 1 mode active; then interface port-channel 1 for trunk settings, which flow to every member."},
  {f:"show etherchannel summary — bundle flags", b:"SU = Layer 2, in use (healthy). SD = Layer 2, down. RU = Layer 3, in use. Protocol column: LACP, PAgP or - (on)."},
  {f:"show etherchannel summary — member flags", b:"P = bundled. I = stand-alone (no negotiation partner). s = suspended (settings mismatch). D = down. H = LACP hot-standby."},
  {f:"EtherChannel load balancing", b:"Per flow: a hash of chosen fields (port-channel load-balance src-dst-ip, etc.) picks a member. One flow always uses one link, so it can't exceed one member's speed."},
  {f:"Layer 3 EtherChannel", b:"Members configured with no switchport, then channel-group; the IP address goes on interface port-channel N. Summary flag R (RU). No STP on the routed link."},
  {f:"STP cost of a 2 x 1 Gb/s bundle", b:"3 (short method), versus 4 for a single 1 Gb/s link. show spanning-tree lists Po1 only, never the members."},
],
});
// ---------- Module 4 · Lesson 7 ----------
L.push({
id:"l2-verify", mins:90, level:"Beginner+ · builds on Module 4 lessons 1–6",
t:"Troubleshooting VLANs, trunks and Spanning Tree — and the Module 4 challenge",
html:`
${K.goals([
  "Work any &ldquo;can't reach it&rdquo; ticket on a switched network with an eight-question Layer 2 method, and say why the order saves time.",
  "Read the Layer 2 show commands — interfaces status, vlan brief, interfaces trunk, switchport, spanning-tree, etherchannel summary, logging — and tell good output from bad at a glance.",
  "Recognise the fingerprints of the classic faults: wrong VLAN, missing VLAN, DTP auto + auto, VLAN not allowed, native mismatch, wrong root, BPDU-guard err-disable, a bundle that won't form, missing routing.",
  "Fix each fault without breaking something else — <code>allowed vlan add</code>, not a replacement list; remove the cause before bouncing a port — and prove the fix.",
  "Find and fix eight faults in a pre-broken office network in the Module 4 challenge.",
])}
${K.pre(["Module 4 lessons 1–6: VLANs, trunks and DTP, inter-VLAN routing, Spanning Tree, PortFast/BPDU guard, EtherChannel.","Module 2 lesson 7: the bottom-up ladder, err-disabled recovery, CDP, finding a host by its MAC.","Module 3: IPv4 subnets and gateways."])}

<h2>Why this matters at work</h2>
<p>Monday, 08:10, at a managed-service provider in Yaba, Lagos. Over the weekend a contractor replaced a client's core and floor switches, and his phone is now off. Five tickets are open. Floor 2 has &ldquo;no network at all&rdquo;. Sales on floor 1 can't reach the file server, though their colleagues in Staff can. Someone's port &ldquo;died&rdquo; after they plugged in a small switch. Monitoring says a port-channel is down and one switch has stopped answering.</p>
<p>Every one of those is a Layer 2 fault, and every one has a <b>fingerprint</b>: a specific line in a specific <code>show</code> command that gives it away. This lesson turns the module's fingerprints into one repeatable method, lets you watch three happen on a bench, then hands you that Monday as the Module 4 challenge.</p>

<h2>A Layer 2 method: eight questions, in order</h2>
<p>In Module 2 you climbed a ladder for one user's port. Module 4 added VLANs, trunks, Spanning Tree, bundles and inter-VLAN routing: many more places where a frame can be dropped. This method follows the frame's journey from the user's port, across the uplink, to the gateway.</p>
<p>Each question has one command that answers it, and a ${K.g("fingerprint","The one line of output that identifies a particular fault — e.g. 'Operational Mode: static access' on an uplink that should be a trunk.")} that tells you the answer is &ldquo;no&rdquo;. Ask in order and stop at the first &ldquo;no&rdquo;: there's no point studying Spanning Tree on a link that isn't even trunking.</p>
${K.svg("0 0 720 432",
  [["1 · Is the port up?","the user's port","show interfaces status","connected — not notconnect, disabled or err-disabled"],
   ["2 · Which VLAN is it in?","and does that VLAN exist?","show vlan brief · show interfaces Gx switchport","listed under the user's VLAN; VLAN active"],
   ["3 · Is the uplink trunking?","DTP, mode, nonegotiate","show interfaces trunk · … switchport","uplink listed, Status trunking"],
   ["4 · Allowed? Native matches?","on BOTH ends of every trunk","show interfaces trunk · show logging","VLAN in every list; same native both ends"],
   ["5 · Is STP blocking it?","and is the root where it should be?","show spanning-tree vlan N","root = core; uplink Root/Desg FWD"],
   ["6 · Is the bundle up?","EtherChannel members","show etherchannel summary","Po1(SU), members (P)"],
   ["7 · Gateway and routing?","SVI or subinterface, ip routing","show ip interface brief · show running-config","SVI up/up; ip routing present"],
   ["8 · Where is the host?","MAC table, neighbours, log","show mac address-table · show cdp neighbors","MAC on the port you expect"]]
  .map((r,i)=>{ const y = 8+i*53; return K.box(16,y,196,42,r[0],r[1],i===0)+K.txt(230,y+17,r[2],{c:"fg",s:11.5})+K.txt(230,y+34,"good: "+r[3],{c:"ok",s:10.5,f:"body"})+(i<7?K.arrow(114,y+42,114,y+53):""); }).join(""),
  "The Layer 2 troubleshooting questions. Follow the frame: the user's port, its VLAN, the uplink, the trunk's lists, Spanning Tree, the bundle, the gateway — stop at the first answer that isn't 'good'.")}
${K.remember(`<p><b>&ldquo;Please Verify The Allowed Switches Before Going Home&rdquo;</b> — <b>P</b>ort up, <b>V</b>LAN, <b>T</b>runking, <b>A</b>llowed and native, <b>S</b>panning Tree, <b>B</b>undle, <b>G</b>ateway and routing, <b>H</b>ost location.</p>`)}
<p>First scope it, as in Module 2: <b>who</b>, <b>what</b>, <b>since when</b>, <b>what changed</b>? Scope picks the starting question. One desk: that port (1–2). A whole floor: its uplink (3–6). One VLAN on every floor: what only that VLAN uses — its allowed-list entries, its definition on the core, its gateway (4 and 7). Everybody: the core.</p>
${K.analogy(`<p>A parcel goes missing between Lagos and Abuja. You check in order: did it leave, was it labelled right, did the lorry run, was the road open? VLANs are labels, trunks lorries, Spanning Tree road closures, the gateway the hub.</p>`)}
${K.when([
  ["Follow the frame (this method)","One VLAN, one floor or one user can't reach something","Each check proves one stage of the path; the scope tells you which stage to start at","Everything works and one application is slow"],
  ["Compare with a working neighbour","A port or switch 'just like' a working one fails","Side-by-side show running-config exposes the difference in seconds","There is no working twin"],
  ["Start at the logs","An alert, a port that died, a flapping link","show logging timestamps err-disables, CDP mismatches and MAC flapping","Quiet misconfigurations that never log (allowed lists, wrong VLANs)"],
], "Which troubleshooting approach — and when")}
${K.tip(`Collect facts <b>from both ends</b> of every link: native mismatches, allowed lists, ${K.g("DTP","Dynamic Trunking Protocol: Cisco switches negotiating whether a link becomes a trunk (lesson 2).")} and ${K.g("LACP","Link Aggregation Control Protocol (IEEE 802.3ad): negotiates EtherChannel bundles; modes active and passive (lesson 6).")} modes only show up when you compare the two sides.`)}
${K.check({q:"Every Sales user (VLAN 20) on both floors can't reach the file server, but Staff users (VLAN 10) on the same switches are fine. Where do you start?", o:["Each Sales user's patch cord","Things VLAN 20 shares everywhere: whether VLAN 20 is allowed on the core trunks, defined on the core, and has a working gateway SVI","The access switches' power supplies","The server's network card"], a:1, why:"Staff on the same switches work, so the switches, cables and uplinks are alive. A fault that hits one VLAN everywhere lives in something only that VLAN uses: its allowed-list entries, its VLAN definition or its gateway."})}

<h2>Questions 1 and 2: is the port up, and which VLAN is it in?</h2>
<p><code>show interfaces status</code> answers both on one screen.</p>
${K.out(`FL4-SW#show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Gi0/1     PO2 to DIST-SW     connected    trunk      a-full   a-1000 10/100/1000BaseTX
Gi0/2     PO2 to DIST-SW     connected    trunk      a-full   a-1000 10/100/1000BaseTX
Gi0/5     DESK-4.05 KEMI STA connected    30         a-full   a-1000 10/100/1000BaseTX
Gi0/6     DESK-4.06 FINANCE  connected    30         a-full   a-1000 10/100/1000BaseTX
Gi0/7                        notconnect   1          auto     auto   10/100/1000BaseTX`, "A floor switch (trimmed). The Name column is cut to 18 characters, exactly as on real kit.")}
<ul>
<li><b>Status</b> — as in Module 2: <code>connected</code> is up; <code>notconnect</code> means no signal; <code>disabled</code> means <code>shutdown</code>; <code>err-disabled</code> means the switch shut it — read the log.</li>
<li><b>Vlan</b> — the access VLAN, or <code>trunk</code> if the port is <i>operationally</i> trunking now. An uplink showing a number instead of <code>trunk</code> is the first clue for question 3.</li>
<li><b>Gi0/5</b> — the description says Kemi is in Staff (VLAN 10), the port says <b>30</b> (Finance). Documentation and reality disagree: the fingerprint of a <b>host in the wrong VLAN</b>.</li>
</ul>
<h3>Fingerprint: host in the wrong VLAN</h3>
<p>The link is perfect and the IP settings are right, yet pinging the user's own gateway gives <code>Reply from &lt;own IP&gt;: Destination host unreachable</code>. Their ARP broadcast for the gateway floods only inside the wrong VLAN, so the gateway never hears it. Usual causes: the user changed department, or a new port was left in VLAN 1. Fix: <code>switchport access vlan 10</code> under the interface. Proof: the ping works and <code>show mac address-table interface g0/5</code> shows the MAC in VLAN 10.</p>
<h3>Fingerprint: the VLAN that isn't there</h3>
<p><code>show vlan brief</code> answers a different question: <b>does this VLAN exist on this switch?</b> VLANs are local to each switch (unless VTP copies them, lesson 2).</p>
${K.out(`FL2-SW#show vlan brief
VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi0/3, Gi0/4, Gi0/7, Gi0/8
10   STAFF                            active    Gi0/5
1002 fddi-default                     act/unsup
...
FL2-SW#show interfaces g0/6 switchport
Name: Gi0/6
Administrative Mode: static access
Operational Mode: static access
Access Mode VLAN: 40 (Inactive)`, "The printer port Gi0/6 appears nowhere in show vlan brief, and switchport says why: VLAN 40 doesn't exist here.")}
<p>A port whose access VLAN says <code>(Inactive)</code> and which has vanished from <code>show vlan brief</code> is the fingerprint of a <b>VLAN missing on one switch</b>. On a switch that only passes the VLAN through, the VLAN drops out of the &ldquo;allowed and active&rdquo; line of <code>show interfaces trunk</code> instead. Fix: create it (<code>vlan 40</code>, <code>name PRINTERS</code>).</p>
${K.mistake(`Assuming a VLAN exists everywhere because it exists on the core. Every switch on the path, including one that only carries the VLAN between two trunks, needs it in its own database. With VTP transparent or off (the safe modern choice, lesson 2), that means creating it on each switch.`)}
<h3>err-disabled: read the reason before you touch it</h3>
<p>A port can be ${K.g("err-disabled","Error-disabled: shut by the switch itself after a violation (BPDU guard, port security, link flapping). It stays down until someone recovers it, or errdisable recovery is configured.")}; in this module the usual reason is ${K.g("BPDU guard","A per-port Spanning Tree protection, usually with PortFast: if a BPDU arrives — a switch was plugged in — the port is err-disabled at once (lesson 5).")}. <code>show logging</code> names it:</p>
${K.out(`FL4-SW#show logging
...
*Oct 11 10:14:07.137: %SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port GigabitEthernet0/12 with BPDU Guard enabled. Disabling port.
*Oct 11 10:14:14.274: %PM-4-ERR_DISABLE: bpduguard error detected on Gi0/12, putting Gi0/12 in err-disable state`, "What arrived (a BPDU: a switch is on that desk) and what the switch did about it.")}
<p>On real kit, <code>show interfaces status err-disabled</code> lists every err-disabled port with its reason, and <code>show errdisable recovery</code> shows whether automatic recovery is on (it's off by default). In the lab, use <code>show interfaces status</code> plus <code>show logging</code>. The order never changes: <b>remove the cause</b>, <b>then</b> <code>shutdown</code> / <code>no shutdown</code>, then verify. (A cheap unmanaged desk switch usually sends no BPDUs of its own, so BPDU guard can miss it; port security, Module 2, enforces one device per port.)</p>
<h3>Try it: three VLAN fingerprints on one switch</h3>
<p>ACC-SW3 was handed over with a Staff desk still in VLAN 1, a printer port in a deleted VLAN, and an uplink allowed list typed from memory. Read before you fix.</p>
${K.hint(`<code>show interfaces g0/5 switchport</code> tells you which VLAN the printer port wants. On the uplink, <code>switchport trunk allowed vlan add 20,30</code> adds to the list; leaving out <code>add</code> would replace the whole list.`)}
${K.term({env:"ios2", title:"ACC-SW3 — wrong VLAN, missing VLAN, short allowed list", opts:{kind:"switch", host:"ACC-SW3", model:"C9200L-24P-4G", motd:"ACC-SW3 — console session (lab switch, no enable secret). You are at user EXEC."},
  setup:e=>{ ["enable","configure terminal","vlan 10","name STAFF","vlan 20","name SALES","exit","interface g0/1","description UPLINK to CORE-SW Gi0/7","switchport mode trunk","switchport trunk allowed vlan 1,10",
    "interface g0/3","description DESK-3.03 STAFF","switchport mode access","interface g0/4","description DESK-3.04 SALES","switchport mode access","switchport access vlan 20",
    "interface g0/5","description PRN-3F printer","switchport mode access","switchport access vlan 30","exit","no vlan 30","end"].forEach(c=>e.exec(c)); e.baseline(); e.history.length=0; e.mode="user"; },
  intro:"Start with <code>enable</code>. Every enabled port on this practice switch counts as cabled.",
  tasks:[
    {text:"<code>show interfaces status</code> — compare each desk port's Name with its Vlan column", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+st/i.test(h))},
    {text:"<code>show vlan brief</code> — which port isn't listed under any VLAN?", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+vl/i.test(h))},
    {text:"<code>show interfaces g0/5 switchport</code> — read the Access Mode VLAN line", done:e=>e.history.some(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+g\S*\s*0\/5\s+sw/i.test(h))},
    {text:"Re-create the printers' VLAN: <code>vlan 30</code>, <code>name PRINTERS</code>", done:e=>e.vlans[30]==="PRINTERS"},
    {text:"Put the Staff desk Gi0/3 into VLAN 10", done:e=>e.intfs["GigabitEthernet0/3"].vlan===10},
    {text:"Let VLANs 20 and 30 across the uplink Gi0/1 <i>without</i> removing 1 or 10", done:e=>{ const a=e.intfs["GigabitEthernet0/1"].allowed; return !a || [1,10,20,30].every(v=>a.includes(v)); }},
    {text:"Verify with <code>show interfaces trunk</code>, then save with <code>copy running-config startup-config</code>", done:e=>!!e.savedOnce && e.history.some(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+tr/i.test(h))},
  ],
  win:"Three classic VLAN faults found from three show commands, fixed without collateral damage, and saved. Notice that none of them would ever have appeared in a log.",
  solve:["enable","show interfaces status","show vlan brief","show interfaces g0/5 switchport","configure terminal","vlan 30","name PRINTERS","exit","interface g0/3","switchport access vlan 10","interface g0/1","switchport trunk allowed vlan add 20,30","end","show interfaces trunk","copy running-config startup-config",""]})}
${K.check({q:"A printer port shows 'Access Mode VLAN: 40 (Inactive)' in show interfaces switchport and doesn't appear in show vlan brief. What is the fix?", o:["no shutdown on the port","Create VLAN 40 on this switch","Make the port a trunk","Reload the switch"], a:1, why:"Inactive means the port's access VLAN doesn't exist in this switch's VLAN database, so the port can't forward. Create the VLAN (vlan 40, plus a name) and the port becomes active in it."})}

<h2>Questions 3 and 4: is the uplink trunking, carrying the VLAN, with a matching native?</h2>
<p>If one desk works but a whole floor doesn't, move to the floor's uplink. For a VLAN to cross it, the link must be <b>operationally a trunk</b>, the VLAN must be <b>allowed and active at both ends</b>, and the ends must agree on the <b>native VLAN</b>.</p>
<h3>show interfaces trunk — four lists, read top to bottom</h3>
${K.out(`DIST-SW#show interfaces trunk
Port        Mode             Encapsulation  Status        Native vlan
Gi0/7       on               802.1q         trunking      999
Po2         on               802.1q         trunking      999

Port        Vlans allowed on trunk
Gi0/7       1-4094
Po2         10,30,40,99,999

Port        Vlans allowed and active in management domain
Gi0/7       1,10,30,40,99,999
Po2         10,30,40,99,999

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/7       1,10,30,40,99,999
Po2         10,30,40,99,999`, "A healthy distribution switch: one trunk and one EtherChannel trunk (Po2).")}
<ul>
<li><b>Block 1</b> — only ports that <i>are</i> trunking. <b>Mode</b>: <code>on</code> (configured <code>switchport mode trunk</code>) or <code>desirable</code>/<code>auto</code> (negotiated by DTP). <b>Native vlan</b> must match the far end.</li>
<li><b>Block 2</b> — the configured allowed list; <code>1-4094</code> is the default.</li>
<li><b>Block 3</b> — allowed <i>and</i> existing on this switch.</li>
<li><b>Block 4</b> — of those, the ones Spanning Tree forwards on this port.</li>
</ul>
<p>Trace a troubled VLAN down the blocks on <i>both</i> switches: the first one it's missing from names the cause.</p>
<h3>Fingerprint: the trunk that never formed (DTP auto + auto)</h3>
<p>Catalyst ports default to <code>switchport mode dynamic auto</code>: they <i>accept</i> a trunk if asked, but never ask. Two of them wait forever and the link comes up as an <b>access</b> port in VLAN 1:</p>
${K.out(`FL3-SW#show interfaces trunk

FL3-SW#show interfaces g0/10 switchport
Name: Gi0/10
Switchport: Enabled
Administrative Mode: dynamic auto
Operational Mode: static access
...
Access Mode VLAN: 1 (default)`, "Empty show interfaces trunk, and 'Administrative Mode: dynamic auto / Operational Mode: static access' on the uplink.")}
<p>The light is green and CDP sees the neighbour, but only VLAN 1 crosses. Fix: <code>switchport mode trunk</code> at both ends. Add <code>switchport nonegotiate</code> (DTP off) only once <b>both</b> ends are hard-set.</p>
${K.mistake(`Adding <code>switchport nonegotiate</code> while the far end is still <code>dynamic auto</code>. This end stops sending DTP, the far end never hears a request and stays an access port: one side tags, the other drops the tags.`)}
${K.q({type:"match", q:"Match each pair of port modes at the two ends of a switch-to-switch link with what the link becomes.", pairs:[["dynamic auto + dynamic auto","Access port (no trunk)"],["dynamic desirable + dynamic auto","Trunk, negotiated by DTP"],["trunk + dynamic auto","Trunk (the trunk end asks, auto agrees)"],["trunk with nonegotiate + dynamic auto","Mismatch: one end trunks, the other stays access"],["router subinterfaces + switchport dynamic auto","No trunk: routers don't speak DTP"]], why:"Auto only answers; desirable and trunk ask (unless nonegotiate silences them). Two answerers never form a trunk. Routers don't run DTP, so a switch port facing a router-on-a-stick must be switchport mode trunk."})}
${K.exam(`DTP combinations: auto + auto = <b>access</b>; desirable + auto, desirable + desirable, trunk + auto, trunk + desirable = <b>trunk</b>; trunk + access = misconfiguration. &ldquo;Administrative Mode&rdquo; is what's configured, &ldquo;Operational Mode&rdquo; is what's happening.`)}
<h3>Fingerprint: the VLAN that isn't allowed</h3>
<p>Everyone in one VLAN behind a trunk is dead; other VLANs on the same trunk are fine. Block 2 (or <code>Trunking VLANs Enabled</code> in <code>show interfaces … switchport</code>) at one end lacks it. In the bench below you'll watch the frame cross the cable with its tag and the receiving switch drop it.</p>
<p>The core shows a second fingerprint: that VLAN's gateway ${K.g("SVI","Switch Virtual Interface: the Layer 3 interface of a VLAN on a switch (interface vlan 20), used as the VLAN's gateway on a Layer 3 switch.")} may read <code>up / down</code> in <code>show ip interface brief</code>. That's ${K.g("autostate","An SVI's line protocol is up only while at least one Layer 2 port in that VLAN is up and forwarding; otherwise the SVI goes up/down.")}: no port on the core carries the VLAN any more.</p>
${K.mistake(`Typing <code>switchport trunk allowed vlan 30</code> to &ldquo;add&rdquo; VLAN 30. Without <code>add</code> it <b>replaces</b> the list and cuts off every other VLAN on that trunk at once. Use <code>add</code> or <code>remove</code>, and check block 2 before and after.`)}
<h3>Fingerprint: native VLAN mismatch</h3>
<p>The ${K.g("native VLAN","The one VLAN a trunk sends untagged (default 1). Both ends must agree, because an untagged frame goes into whatever the receiving end calls its native VLAN.")} is the only VLAN sent untagged. If the ends disagree, untagged frames from one switch land in a <i>different</i> VLAN on the other, and traffic in both native VLANs leaks or vanishes. CDP complains every minute:</p>
${K.out(`DIST-SW#show logging
...
*Oct 11 10:14:21.411: %CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/8 (1), with FL5-SW GigabitEthernet0/9 (999).`, "Both port names and both native VLANs in one line.")}
<p>It hurts most when one end's native is a VLAN in use, such as management: that switch sends its own management frames untagged, and the far end files them in its native VLAN. PVST+ and Rapid PVST+ also block the port for the affected VLANs, at both ends: <code>BKN*</code> with type <code>P2p *PVID_Inc</code> in <code>show spanning-tree vlan N</code>, and <code>%SPANTREE-2-BLOCK_PVID_PEER</code> / <code>BLOCK_PVID_LOCAL</code> in the log. ${K.g("PVID_Inc","Port VLAN ID inconsistent: PVST+ BPDUs carry the sender's VLAN number, so the switch notices when a BPDU sent in one VLAN arrives in another (the two natives) and blocks the port for those VLANs until the natives match.")} stands for port VLAN ID inconsistent. The lab does the same. Fix: both ends to the site standard.</p>
${K.svg("0 0 760 330",
  K.dev("pc",50,70,"SALES PC","VLAN 20")+K.dev("switch",230,70,"ACCESS SW","floor")+K.dev("switch",470,70,"CORE","L3 · SVIs")+K.dev("server",690,70,"SERVER","VLAN 30")+
  K.link(70,78,204,72,"Gi0/4")+K.link(256,72,444,72,"802.1Q trunk / bundle")+K.link(496,72,672,72,"Gi0/5")+
  K.band(10,150,130,24,"① port","var(--chip)")+K.band(165,150,130,24,"② VLAN exists","var(--chip)")+K.band(305,150,130,24,"③④⑥ trunk + bundle","var(--chip)")+K.band(445,150,130,24,"⑦ gateway","var(--chip)")+K.band(605,150,145,24,"server side","var(--chip)")+
  K.txt(75,195,"up? err-disabled?",{mid:true,c:"fg"})+K.txt(75,211,"in VLAN 20?",{mid:true,c:"fg"})+
  K.txt(230,195,"VLAN 20 in this",{mid:true,c:"fg"})+K.txt(230,211,"switch's database?",{mid:true,c:"fg"})+
  K.txt(370,195,"trunking both ends?",{mid:true,c:"fg"})+K.txt(370,211,"20 allowed both ends?",{mid:true,c:"fg"})+K.txt(370,227,"native matches?",{mid:true,c:"fg"})+K.txt(370,243,"⑤ STP forwarding?",{mid:true,c:"fg"})+K.txt(370,259,"bundle up?",{mid:true,c:"fg"})+
  K.txt(510,195,"SVI 20 up/up?",{mid:true,c:"fg"})+K.txt(510,211,"ip routing on?",{mid:true,c:"fg"})+K.txt(510,227,"VLAN 20 on core?",{mid:true,c:"fg"})+
  K.txt(677,195,"port in VLAN 30?",{mid:true,c:"fg"})+K.txt(677,211,"server gateway right?",{mid:true,c:"fg"})+
  K.txt(380,300,"Every check is a place where the frame can die. The first one that fails is your fault — fix it, then keep walking.",{mid:true,f:"body",s:11.5}),
  "Where a frame from a Sales PC can die on its way to the server, numbered by the method's questions.")}
${K.check({q:"show interfaces trunk on the core lists Gi0/3 with VLAN 20 in 'Vlans allowed on trunk' but NOT in 'Vlans allowed and active in management domain'. What does that tell you?", o:["VLAN 20 is blocked by Spanning Tree on Gi0/3","VLAN 20 doesn't exist in the core's VLAN database","The native VLAN doesn't match","Gi0/3 isn't trunking"], a:1, why:"Block 3 lists the VLANs that are allowed AND exist (are active) on this switch. Allowed but not active means the VLAN isn't defined on this switch. A VLAN missing only from block 4 would point at STP; a port missing from block 1 isn't trunking."})}

<h2>Questions 5 and 6: is Spanning Tree blocking it, and is the bundle up?</h2>
<h3>show spanning-tree vlan N — where is the root, and what is blocked?</h3>
<p>Blocking a <i>redundant</i> link is healthy. Blocking the only path isn't, and nor is a ${K.g("root bridge","The switch all Spanning Tree paths are measured from: the lowest bridge ID (priority + VLAN number, then MAC). It should be a core or distribution switch, chosen on purpose.")} in the wrong place, which sends traffic on silly paths and leaves the design to chance.</p>
${K.out(`DIST-SW#show spanning-tree vlan 30
VLAN0030
  Spanning tree enabled protocol rstp
  Root ID    Priority    8222
             Address     0050.2b17.0000
             Cost        4
             Port        9 (GigabitEthernet0/9)
...
  Bridge ID  Priority    32798  (priority 32768 sys-id-ext 30)
             Address     0050.7c40.0000
...
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/9               Root FWD 4         128.9    P2p
Gi0/10              Altn BLK 4         128.10   P2p`, "The distribution switch is NOT the root for VLAN 30: the root has priority 8192 + 30 and a different MAC, out of Gi0/9.")}
<ul>
<li><b>Root ID</b> differs from <b>Bridge ID</b>: this switch isn't the root (the root itself says &ldquo;This bridge is the root&rdquo;).</li>
<li><b>8222</b> = 8192 + VLAN 30: someone set 8192 elsewhere. <code>show cdp neighbors</code> names the switch out of Gi0/9. If it's an access switch, that's the fingerprint of the <b>root in the wrong place</b>.</li>
<li><b>Gi0/10 Altn BLK</b> — two parallel links, one forwarding: correct STP, but if they were meant to be one EtherChannel, the bundle is down (question 6).</li>
</ul>
<p>Fix the root at <b>both</b> ends: a low priority on the core on purpose (<code>spanning-tree vlan 30 priority 4096</code>, or <code>root primary</code>), and <code>no spanning-tree vlan 30 priority</code> on the stray switch. Do only one and a tie or the lowest MAC may still pick the wrong switch.</p>
${K.mistake(`Typing <code>no spanning-tree vlan 10</code> to remove a priority. That <b>turns Spanning Tree off</b> for VLAN 10, and on any redundant topology the next broadcast becomes a storm (lesson 4). The priority alone is removed with <code>no spanning-tree vlan 10 priority</code>.`)}
${K.dyk(`<code>spanning-tree vlan 10 root primary</code> isn't a permanent claim. It's a one-time calculation: IOS writes 24576, or 4096 below the current root if that is already lower, into the config. If a lower priority appears later, or the VLAN wasn't reaching this switch when you typed it, the core quietly loses. Explicit priorities keep the design deterministic.`)}
<h3>show etherchannel summary — flags tell the story</h3>
${K.out(`DIST-SW#show etherchannel summary
...
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
2      Po2(SD)       LACP        Gi0/9(I)  Gi0/10(I)`, "Po2 is down (SD = Layer 2, down) and both members are stand-alone (I): LACP is configured but no bundle formed.")}
<div class="tablewrap"><table>
<tr><th>What you see</th><th>What it means</th><th>Usual cause (lesson 6)</th></tr>
<tr><td><code>Po(SU)</code>, members <code>(P)</code></td><td>Layer 2 bundle up, in use</td><td>Healthy</td></tr>
<tr><td><code>Po(SD)</code>, members <code>(I)</code></td><td>Members run as separate links; STP blocks all but one</td><td>Modes don't negotiate: LACP passive + passive, PAgP auto + auto, <code>on</code> facing LACP/PAgP, or no channel-group at the far end</td></tr>
<tr><td>members <code>(s)</code></td><td>Suspended: refused into the bundle</td><td>Member settings differ (VLAN, allowed list, native, mode, speed/duplex)</td></tr>
<tr><td>members <code>(D)</code></td><td>Member link down</td><td>Physical or shut — back to question 1</td></tr>
</table></div>
<p>Passive/passive doesn't stop traffic: one link carries everything, so users notice nothing and monitoring reports it. Fix: <code>channel-group N mode active</code> at one end (both, by design). Members <code>(s)</code>? A change made on one member only, such as an allowed list edited on Gi0/9 alone, is enough; make bundle changes on the port-channel interface so members stay identical.</p>
${K.remember(`<p><b>&ldquo;Passive plus passive is two shy people at a party&rdquo;</b> — nobody starts the conversation. One side must be <b>active</b> (LACP) or <b>desirable</b> (PAgP).</p>`)}
<h3>Hands-on: watch three fingerprints happen</h3>
<p>PC1 can't reach SRV-01, though both are in VLAN 10. Watch where the frame dies and fix it, find a second fault in the log, then play the careless visitor with a switch.</p>
${K.bench({id:"m4-fingerprints", points:90, from:"CCNA · Module 4 · lesson 7", title:"read three Layer 2 fingerprints", viewBox:"0 0 760 420", openLog:true,
  intro:"Your console cable is already on SW2-COMMS: open <b>Terminal app (PuTTY)</b> on YOUR LAPTOP, 9600 8N1, no flow control. These lab switches have no enable secret. The office standard native VLAN is 999.",
  devices:[
    {id:"sw1", kind:"switch", label:"SW1-FLOOR3", model:"Catalyst 9200 · floor 3", platform:"C9200L", x:10, y:20, config:e=>{ ["en","conf t","hostname SW1-FLOOR3","no ip domain-lookup","vlan 10","name STAFF","vlan 20","name SALES","vlan 30","name PRINTERS","vlan 999","name NATIVE_UNUSED","exit",
      "interface g0/1","description UPLINK to SW2-COMMS Gi0/1","switchport mode trunk","switchport trunk native vlan 999",
      "interface g0/3","description DESK-3.03 STAFF","switchport mode access","switchport access vlan 10","spanning-tree portfast","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pc1", kind:"pc", label:"PC1", x:20, y:140, ip:"10.40.10.11", mask:"255.255.255.0", gw:"10.40.10.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:600, y:96},
    {id:"sw2", kind:"switch", label:"SW2-COMMS", model:"Catalyst 9200 · comms room", platform:"C9200L", x:330, y:200, config:e=>{ ["en","conf t","hostname SW2-COMMS","no ip domain-lookup","vlan 10","name STAFF","vlan 20","name SALES","vlan 30","name PRINTERS","vlan 999","name NATIVE_UNUSED","exit",
      "interface g0/1","description UPLINK to SW1-FLOOR3 Gi0/1","switchport mode trunk","switchport trunk allowed vlan 20,30,999",
      "interface g0/3","description SRV-01 file server","switchport mode access","switchport access vlan 10","spanning-tree portfast",
      "interface g0/5","description SPARE DESK PORT","switchport mode access","switchport access vlan 10","spanning-tree portfast","spanning-tree bpduguard enable","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"srv", kind:"server", label:"SRV-01", x:360, y:312, ip:"10.40.10.20", mask:"255.255.255.0", gw:"10.40.10.1"},
    {id:"spare", kind:"switch", label:"VISITOR-SW", model:"a switch someone brought in", x:90, y:320, ports:[1,2,3,4].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})), config:e=>{ ["en","conf t","hostname VISITOR-SW","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
  ],
  cables:[ {type:"cat6", a:"sw1:g1", b:"sw2:g1"}, {type:"cat6", a:"pc1:eth", b:"sw1:g3"}, {type:"cat6", a:"srv:eth", b:"sw2:g3"}, {type:"console", a:"lap:usb", b:"sw2:con"} ],
  tray:["cat6"],
  tasks:[
    {text:"From PC1's Command Prompt, <code>ping 10.40.10.20</code> (SRV-01: same VLAN, other switch). It fails. In <b>What just happened on the wire</b>, find the switch that drops the frame, and the reason it gives", done:B=>Bench.tried(B,"pc1",/ping\s+10\.40\.10\.20/)},
    {text:"Open the console to SW2-COMMS, <code>enable</code>, and run <code>show interfaces trunk</code>. Read the <b>Vlans allowed on trunk</b> line", done:B=>B.devs.sw2.env.history.some(h=>/^\s*(do\s+)?sh\S*\s+int\S*\s+tr/i.test(h))},
    {text:"Under <code>interface g0/1</code>, add VLAN 10 without removing anything (<code>switchport trunk allowed vlan add 10</code>), then ping again and watch the dot carry the tag 10 all the way", done:B=>Bench.pinged(B,"pc1","10.40.10.20")},
    {text:"Run <code>show logging</code>: CDP has been complaining about this trunk. Fix SW2-COMMS's end so its native VLAN matches the standard, 999", done:B=>B.devs.sw2.env.intfs["GigabitEthernet0/1"].native===999 && B.devs.sw2.env.history.some(h=>/^\s*(do\s+)?sh\S*\s+log/i.test(h))},
    {text:"Play the careless visitor: take a Cat6 from the tray and connect VISITOR-SW port 1 to SW2-COMMS port 5 (a desk port with PortFast and BPDU guard). Watch port 5's LED, then read <code>show interfaces status</code> and <code>show logging</code>", done:B=>Bench.logged(B,"sw2",/BPDUGUARD/) && Bench.logged(B,"sw2",/ERR_DISABLE/)},
    {text:"Recover it properly: unplug the visitor's switch first, then <code>shutdown</code> and <code>no shutdown</code> under <code>interface g0/5</code>. Done when Gi0/5 is no longer err-disabled and reads notconnect, ready for a PC", done:B=>Bench.logged(B,"sw2",/BPDUGUARD/) && !Bench.errdis(B,"sw2","g5") && !B.devs.sw2.env.intfs["GigabitEthernet0/5"].shut && !Bench.cableAt(B,"sw2:g5")},
  ],
  win:"You watched a tagged frame die at an allowed list and then cross once you fixed it, found a native mismatch that only the log mentioned, and saw BPDU guard do its job — then recovered the port in the right order.",
  solve:[["pc","pc1","ping 10.40.10.20"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","show interfaces trunk"],["term","show interfaces g0/1 switchport"],
    ["term","configure terminal"],["term","interface g0/1"],["term","switchport trunk allowed vlan add 10"],["term","end"],["pc","pc1","ping 10.40.10.20"],
    ["term","show logging"],["term","configure terminal"],["term","interface g0/1"],["term","switchport trunk native vlan 999"],["term","end"],
    ["plug","cat6","spare:g1","sw2:g5"],["pc","pc1","ping 10.40.10.20"],["term","show interfaces status"],["term","show logging"],
    ["unplug","sw2:g5"],["term","configure terminal"],["term","interface g0/5"],["term","shutdown"],["term","no shutdown"],["term","end"],["term","show interfaces status"],["term","write memory"]]})}
${K.hint(`The drop note in the frame log names the switch and port: check that port's allowed list. The CDP message gives each end's native VLAN in brackets. Bounce Gi0/5 with VISITOR-SW still plugged in and it err-disables again — try it.`)}
${K.check({q:"show etherchannel summary shows 'Po1(SD) LACP Gi0/1(I) Gi0/2(I)' on both switches, and users report no problems. What is the most likely configuration?", o:["Both ends use channel-group 1 mode active","Both ends use channel-group 1 mode passive","One end uses active, the other passive","Gi0/1 and Gi0/2 are shut down"], a:1, why:"Stand-alone (I) members with LACP mean LACP never formed a bundle. Active + active and active + passive both negotiate; passive + passive never does, because neither side starts. Users don't notice because the links still work individually, with STP blocking one."})}

<h2>Questions 7 and 8: is the gateway there, and where is the host?</h2>
<h3>The gateway: SVIs, ip routing and router-on-a-stick</h3>
<p>To leave its VLAN, a frame needs a gateway (lesson 3). On a Layer 3 switch, check three things:</p>
<ul>
<li><b>Does the SVI exist, with the right IP?</b> <code>show ip interface brief</code>. No <code>interface vlan 20</code> means no gateway: <code>Destination host unreachable</code>.</li>
<li><b>Is it up/up?</b> <code>up / down</code> is autostate: go back to questions 2–4 for that VLAN on the core.</li>
<li><b>Is routing on?</b> <code>show running-config | include ip routing</code>, or <code>show ip route</code>: with routing off it prints <code>Default gateway is …</code> and no routing table at all. Without it the switch answers on its own SVIs (users reach their gateway) but forwards nothing between VLANs: <code>Request timed out</code>. Older Catalysts such as the 3560/3750 shipped with routing off; whatever the model, verify it.</li>
</ul>
<p>With ${K.g("router-on-a-stick","Inter-VLAN routing on one router interface split into 802.1Q subinterfaces (g0/0.10, g0/0.20), each the gateway for one VLAN — lesson 3.")} check the router: each subinterface's <code>encapsulation dot1Q</code> number must match its VLAN and its IP that VLAN's subnet, the physical port needs <code>no shutdown</code>, and the switch port facing it must be <code>switchport mode trunk</code>, because routers don't speak DTP. Fingerprints: the router port missing from the switch's <code>show interfaces trunk</code>, or <code>encapsulation dot1Q 20</code> paired with a 10.20.<b>10</b>.x address.</p>
<h3>Where is the host? MAC table, CDP and the log</h3>
<p><code>show mac address-table address 0050.xxxx.xxxx</code> shows the <b>VLAN</b> and port where a host was learned: VLAN 20 for a Staff user confirms a wrong-VLAN port; an uplink means follow it with <code>show cdp neighbors</code> (Module 2). Glance at <code>show logging</code> on every switch you touch: err-disables, CDP mismatches and <code>%SW_MATM-4-MACFLAP_NOTIF</code> (a MAC flapping between ports — a loop) all land there.</p>
${K.q({type:"order", q:"Floor 2 says 'the network is down' after a switch replacement. Put the checks in the order the method uses.", items:["Scope it: who, what, since when, what changed","show interfaces status on a user's port: connected, right VLAN?","show vlan brief: does the user's VLAN exist on this switch?","show interfaces trunk and switchport on the uplink: is it trunking?","Compare allowed lists and native VLAN at both ends of the uplink","show spanning-tree vlan N: right root, uplink forwarding?","show etherchannel summary if the uplink is a bundle","show ip interface brief and ip routing on the core: gateway up and routing on?"], why:"Follow the frame from the user's port outward: port and VLAN first, then the uplink's operational mode, its lists and native VLAN, then Spanning Tree and the bundle, and finally the gateway. Each step depends on the ones before it."})}
${K.myth([
  ["If the uplink's light is green and CDP sees the neighbour, the trunk is fine.","They only prove the link is alive. It can still be an access port (auto + auto), miss a VLAN in its allowed list, or have a native mismatch."],
  ["Two Cisco switches connected together always form a trunk on their own.","Modern Catalyst ports default to dynamic auto, and auto + auto stays an access port. Configure trunks deliberately."],
  ["A native VLAN mismatch is just a cosmetic log message.","Untagged frames land in the wrong VLAN, so traffic in both native VLANs leaks or vanishes."],
  ["An EtherChannel that isn't bundled means the link is down.","Stand-alone members keep forwarding as separate links, so users often notice nothing. show etherchannel summary does."],
])}
${K.dodont([
  "Compare both ends of every trunk and bundle: mode, allowed list, native VLAN, channel-group mode.",
  "Use switchport trunk allowed vlan add / remove, and read show interfaces trunk before and after.",
  "Hard-code uplinks as switchport mode trunk at both ends; add nonegotiate only after that.",
  "Set the root bridge explicitly on the core, per VLAN, and document it.",
  "Remove the cause of an err-disable before bouncing the port, and record it in the ticket.",
],[
  "Type a bare switchport trunk allowed vlan N on a live trunk.",
  "Type no spanning-tree vlan N to remove a priority — it turns STP off.",
  "Leave a stray low STP priority on an access switch after lab work.",
  "Assume a VLAN exists on a switch because it exists on the core.",
  "Close a ticket without proof: a ping from the user's machine and the healthy show output.",
])}
${K.job("An MSP morning of Layer 2 tickets",`
<p>You're on the ${K.g("MSP","Managed Service Provider: runs other organisations' networks for a fee, from a Network Operations Centre.")} desk with SSH to every client switch.</p>
<h3>Ticket 6102 · 08:05 · Microfinance bank, Garki, Abuja — &ldquo;new teller desk can't reach the core banking server&rdquo;</h3>
<p><b>Symptom.</b> A teller PC added on Friday gets nothing; the other tellers are fine.</p>
<p><b>Questions.</b> &ldquo;Same IP range as the others?&rdquo; — <i>&ldquo;Yes, from the sheet.&rdquo;</i> &ldquo;Which wall port?&rdquo; — <i>&ldquo;T-05.&rdquo;</i> One new desk: start at question 1 on that port.</p>
<p><b>Checks.</b> <code>show interfaces status</code>: Gi1/0/5 <code>connected</code>, Vlan <code>1</code>; the other tellers are in <code>30</code>. <code>show mac address-table interface Gi1/0/5</code> shows the PC's MAC in VLAN 1. From the PC, <code>ping 10.30.30.1</code> gives <code>Destination host unreachable</code>. The port was patched but never configured.</p>
<p><b>Fix.</b> Under <code>interface Gi1/0/5</code>: <code>description TELLER-05</code>, <code>switchport mode access</code>, <code>switchport access vlan 30</code>, <code>spanning-tree portfast</code>, <code>spanning-tree bpduguard enable</code> (the teller template), then <code>write memory</code>. The MAC moves to VLAN 30; gateway and server answer.</p>
<p><b>What you say.</b> &ldquo;The new desk's network point was connected but never set up for the teller network. It now matches the other counters — please confirm the banking app opens.&rdquo;</p>
<p><b>Ticket note.</b> <i>&ldquo;Gi1/0/5 (T-05) in VLAN 1 (unconfigured). Set access VLAN 30 + teller-port template (PortFast, BPDU guard), described, saved. MAC in VLAN 30, ping ${K.g("GW","Ticket shorthand for gateway: here, the VLAN's default gateway address.")} + core banking OK, user confirmed. 11 min.&rdquo;</i></p>
`)}
${K.case("The one-word change that took down a hospital's imaging network",`
<p>A private hospital in Lagos carried its imaging VLAN (40) and six others over a pair of core trunks. A Saturday change said: &ldquo;Add VLAN 45 (new lab analysers) to the core trunks.&rdquo; The engineer typed <code>switchport trunk allowed vlan 45</code> on both — no <code>add</code>. Within a second the trunks carried only VLAN 45. Imaging, wards, pharmacy, voice and his own management VLAN dropped together; he walked to the comms room with a console cable. It took 25 minutes, and two urgent scans crossed the city by motorbike courier.</p>
<p>Afterwards: every trunk change starts and ends with <code>show interfaces trunk</code> saved in the ticket; core changes run with <code>reload in 10</code> scheduled (Module 2), so a lock-out undoes itself; allowed-list snippets are peer-reviewed and always say <code>add</code> or <code>remove</code>. On the team's wall: <b>the network did exactly what it was told.</b></p>`)}
${K.check({q:"Users in VLAN 10 can ping their gateway 10.20.10.1 (an SVI on the Layer 3 core), but pings to the server in VLAN 30 time out. Both SVIs are up/up. What do you check next?", o:["The users' access VLAN","Whether ip routing is enabled on the core","The native VLAN on the users' uplink","The EtherChannel flags"], a:1, why:"Reaching the gateway proves the access port, VLAN, uplink and SVI are fine. With both SVIs up/up and forwarding between VLANs failing, the next suspect is routing itself: without ip routing, a Layer 3 switch answers on its own SVIs but doesn't route between them."})}

<h2>The Module 4 challenge</h2>
<p>Here is that Monday: a Layer 3 core (CORE-SW) with FS1 and the NOC's PC plugged into it; floor 1's switch on a two-link EtherChannel; floor 2's switch on one uplink; Staff (VLAN 10) and Sales (VLAN 20) on both floors; management in VLAN 99. The contractor left <b>eight independent faults</b> from this module.</p>
${K.svg("0 0 780 408",
  K.dev("switch",390,40,"CORE-SW","L3 · SVIs .1 · Po1 + Gi0/3")+K.dev("server",90,40,"FS1","VLAN 30 · 10.20.30.10")+K.dev("pc",90,160,"NOC-PC","VLAN 99 · 10.20.99.50")+
  K.dev("switch",210,200,"ACC-SW1","floor 1 · 10.20.99.11")+K.dev("switch",570,200,"ACC-SW2","floor 2 · 10.20.99.12")+
  K.dev("pc",130,310,"AMAKA","Staff · 10.20.10.11")+K.dev("pc",290,310,"TUNDE","Sales · 10.20.20.11")+K.dev("pc",500,310,"CHIDI","Staff · 10.20.10.21")+K.dev("switch",650,290,"DESK-SW","")+K.dev("pc",735,350,"BOLA","Sales")+
  K.link(110,45,364,45,"Gi0/5")+K.link(110,160,368,52,"Gi0/6")+K.link(372,51,214,189)+K.link(382,51,226,189)+K.txt(270,120,"Po1 (Gi0/1–2)",{end:true,c:"accent",b:true})+K.link(408,51,556,189)+K.txt(500,120,"Gi0/3 ⇄ Gi0/1",{c:"accent",b:true})+
  K.link(200,211,138,292)+K.link(220,211,284,292)+K.link(560,211,506,292)+K.link(584,211,636,280)+K.link(664,301,726,334),
  "The challenge office. Gateways are .1 SVIs on CORE-SW; every trunk should use native VLAN 999. PC IP settings are correct throughout.")}
<p>No instructions: each complaint is an outcome. Scope it, then ask the eight questions with real commands. Click any port to read its link, VLAN and Spanning Tree state. Some faults hide others, so fix shared causes first.</p>
${K.tip(`Every complaint has a free <b>Hint</b> button — but give each complaint ten honest minutes first, starting with the fault that affects the most people.`)}
${K.bench({id:"m4-challenge", points:180, challenge:true, from:"CCNA · Module 4 · lesson 7", title:"Module 4 challenge — the Monday after the switch swap", viewBox:"0 0 900 640",
  intro:"Console cable is on CORE-SW (9600 8N1, no flow control). Move it to ACC-SW1 or ACC-SW2 when you need to. Enable secret on all three managed switches: <code>NocLab26</code>. VLANs: 10 STAFF 10.20.10.0/24 · 20 SALES 10.20.20.0/24 · 30 SERVERS 10.20.30.0/24 · 99 MGMT 10.20.99.0/24 · 999 NATIVE_UNUSED (native on every trunk). Gateways are the .1 SVIs on CORE-SW. The PCs' IP settings are correct. The port-channel is <code>interface port-channel 1</code> (<code>interface po1</code> for short).",
  devices:[
    {id:"core", kind:"switch", label:"CORE-SW", model:"Catalyst 9300 · Layer 3 core", platform:"C9300", x:240, y:20, config:e=>{ ["en","conf t","hostname CORE-SW","enable secret NocLab26","no ip domain-lookup",
      "vlan 10","name STAFF","vlan 20","name SALES","vlan 30","name SERVERS","vlan 99","name MGMT","vlan 999","name NATIVE_UNUSED","exit",
      "interface range g0/1 - 2","description PO1 to ACC-SW1","switchport mode trunk","switchport trunk native vlan 999","switchport trunk allowed vlan 10,99,999","channel-group 1 mode passive",
      "interface g0/3","description UPLINK to ACC-SW2 Gi0/1","switchport trunk native vlan 999",
      "interface g0/5","description FS1 file server","switchport mode access","switchport access vlan 30","spanning-tree portfast",
      "interface g0/6","description NOC-PC","switchport mode access","switchport access vlan 99","spanning-tree portfast",
      "interface vlan 10","ip address 10.20.10.1 255.255.255.0","no shutdown","interface vlan 20","ip address 10.20.20.1 255.255.255.0","no shutdown",
      "interface vlan 30","ip address 10.20.30.1 255.255.255.0","no shutdown","interface vlan 99","ip address 10.20.99.1 255.255.255.0","no shutdown","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"fs1", kind:"server", label:"FS1", x:20, y:20, ip:"10.20.30.10", mask:"255.255.255.0", gw:"10.20.30.1"},
    {id:"noc", kind:"pc", label:"NOC-PC", x:20, y:140, ip:"10.20.99.50", mask:"255.255.255.0", gw:"10.20.99.1"},
    {id:"lap", kind:"laptop", label:"YOUR LAPTOP", x:700, y:120},
    {id:"acc1", kind:"switch", label:"ACC-SW1", model:"Catalyst 9200 · floor 1", platform:"C9200L", x:10, y:270, config:e=>{ ["en","conf t","hostname ACC-SW1","enable secret NocLab26","no ip domain-lookup",
      "vlan 10","name STAFF","vlan 20","name SALES","vlan 99","name MGMT","vlan 999","name NATIVE_UNUSED","exit",
      "interface range g0/1 - 2","description PO1 to CORE-SW","switchport mode trunk","switchport trunk native vlan 999","channel-group 1 mode passive",
      "interface g0/3","description DESK-1.03 AMAKA STAFF","switchport mode access","switchport access vlan 20","spanning-tree portfast",
      "interface g0/4","description DESK-1.04 TUNDE SALES","switchport mode access","switchport access vlan 20","spanning-tree portfast",
      "interface vlan 99","ip address 10.20.99.11 255.255.255.0","no shutdown","exit","ip default-gateway 10.20.99.1","spanning-tree vlan 10,20,99 priority 4096","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"acc2", kind:"switch", label:"ACC-SW2", model:"Catalyst 9200 · floor 2", platform:"C9200L", x:470, y:270, config:e=>{ ["en","conf t","hostname ACC-SW2","enable secret NocLab26","no ip domain-lookup",
      "vlan 10","name STAFF","vlan 20","name SALES","vlan 99","name MGMT","vlan 999","name NATIVE_UNUSED","exit",
      "interface g0/1","description UPLINK to CORE-SW Gi0/3","switchport trunk native vlan 99",
      "interface g0/3","description DESK-2.03 CHIDI STAFF","switchport mode access","switchport access vlan 10","spanning-tree portfast",
      "interface g0/4","description DESK-2.04 BOLA SALES","switchport mode access","switchport access vlan 20","spanning-tree portfast","spanning-tree bpduguard enable",
      "interface vlan 99","ip address 10.20.99.12 255.255.255.0","no shutdown","exit","ip default-gateway 10.20.99.1","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pca", kind:"pc", label:"AMAKA", x:20, y:440, ip:"10.20.10.11", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"pcb", kind:"pc", label:"TUNDE", x:180, y:440, ip:"10.20.20.11", mask:"255.255.255.0", gw:"10.20.20.1"},
    {id:"pcc", kind:"pc", label:"CHIDI", x:470, y:440, ip:"10.20.10.21", mask:"255.255.255.0", gw:"10.20.10.1"},
    {id:"desk", kind:"switch", label:"DESK-SW", model:"Catalyst compact · from the store room", x:620, y:420, ports:[1,2,3,4].map(i=>({id:"g"+i, type:"rj45", label:String(i), ios:"GigabitEthernet0/"+i})), config:e=>{ ["en","conf t","hostname DESK-SW","end"].forEach(c=>e.exec(c)); e.history.length=0; }},
    {id:"pcd", kind:"pc", label:"BOLA", x:700, y:530, ip:"10.20.20.21", mask:"255.255.255.0", gw:"10.20.20.1"},
  ],
  cables:[ {type:"cat6", a:"core:g1", b:"acc1:g1"}, {type:"cat6", a:"core:g2", b:"acc1:g2"}, {type:"cat6", a:"core:g3", b:"acc2:g1"},
           {type:"cat6", a:"fs1:eth", b:"core:g5"}, {type:"cat6", a:"noc:eth", b:"core:g6"},
           {type:"cat6", a:"pca:eth", b:"acc1:g3"}, {type:"cat6", a:"pcb:eth", b:"acc1:g4"}, {type:"cat6", a:"pcc:eth", b:"acc2:g3"},
           {type:"cat6", a:"desk:g1", b:"acc2:g4"}, {type:"cat6", a:"pcd:eth", b:"desk:g2"}, {type:"console", a:"lap:usb", b:"core:con"} ],
  tray:["cat6","console"],
  tasks:[
    {text:"<b>NOC (Ngozi):</b> &ldquo;Even NOC-PC, plugged straight into CORE-SW, can't reach FS1 — and last night's backup to FS1 failed.&rdquo; <i>Done when NOC-PC can ping FS1 (10.20.30.10).</i>", hint:"NOC-PC and FS1 are both cabled to CORE-SW, in different VLANs, so no trunk or access switch is involved. NOC-PC can ping its own gateway, 10.20.99.1. What does a Layer 3 switch need, beyond SVIs with addresses, before it moves packets between VLANs? Look near the top of show running-config.", done:B=>Bench.pinged(B,"noc","10.20.30.10")},
    {text:"<b>Floor 2 · Chidi (Staff):</b> &ldquo;Since the weekend's switch swap nobody on floor 2 can reach anything — not even the file server.&rdquo; <i>Done when CHIDI can ping FS1.</i>", hint:"Chidi's port looks fine, so look at what floor 2 shares: ACC-SW2's uplink. Is anything listed in show interfaces trunk at either end? Then compare Administrative Mode with Operational Mode in show interfaces g0/1 switchport on ACC-SW2. What do two dynamic auto ports become?", done:B=>Bench.pinged(B,"pcc","10.20.30.10")},
    {text:"<b>Floor 1 · Tunde (Sales):</b> &ldquo;None of us in Sales on floor 1 can reach FS1. Our lights are green.&rdquo; <i>Done when TUNDE can ping FS1.</i>", hint:"VLAN 20 exists on ACC-SW1 and Tunde's port is in it. Does VLAN 20 get across to CORE-SW? Compare the allowed VLANs at both ends of the floor-1 uplink: Trunking VLANs Enabled in show interfaces g0/1 switchport on CORE-SW (or show interfaces trunk once Po1 is up). On CORE-SW, the Vlan20 line of show ip interface brief is a clue too. Change it on interface po1 so both members match.", done:B=>Bench.pinged(B,"pcb","10.20.30.10")},
    {text:"<b>Floor 1 · Amaka (moved from Sales to Staff on Friday):</b> &ldquo;Same IP settings as the other Staff PCs, but I can't reach anything — not even my gateway.&rdquo; <i>Done when AMAKA can ping FS1.</i>", hint:"Her IP settings are in the Staff subnet, 10.20.10.0/24. Which VLAN is her port really in? Compare the Vlan column of show interfaces status on ACC-SW1 with the port's description.", done:B=>Bench.pinged(B,"pca","10.20.30.10")},
    {text:"<b>Floor 2 · Bola (Sales):</b> &ldquo;I plugged in the little switch from the store room so my laptop and printer can share my desk point — and now my port is dead.&rdquo; <i>Done when BOLA is plugged straight into her wall port on ACC-SW2, that port isn't err-disabled, and she can ping FS1.</i>", hint:"show interfaces status on ACC-SW2, then show logging: the switch says exactly what it did and why. Remove the cause first: click the DESK-SW cable at ACC-SW2 port 4 and unplug it, unplug BOLA from DESK-SW, and cable BOLA's NIC straight to ACC-SW2 port 4 with a Cat6 from the tray. Then recover the port. (Floor 2's uplink has to work too.)", done:B=>{ const c=Bench.cableAt(B,"pcd:eth"); return !!c && [c.a,c.b].some(r=>r.startsWith("acc2:")) && !Bench.errdis(B,"acc2","g4") && Bench.pinged(B,"pcd","10.20.30.10"); }},
    {text:"<b>NOC monitoring:</b> &ldquo;ACC-SW1 (10.20.99.11) is green, but ACC-SW2 (10.20.99.12) stays red — even after floor 2's users came back.&rdquo; <i>Done when NOC-PC can ping 10.20.99.12.</i>", hint:"Management is VLAN 99 end to end, so routing isn't involved. Once the floor-2 uplink is trunking, read show logging on CORE-SW or ACC-SW2, and compare the Native vlan column of show interfaces trunk at both ends. The office standard is 999.", done:B=>Bench.pinged(B,"noc","10.20.99.12")},
    {text:"<b>Monitoring alert:</b> &ldquo;Port-channel1 (CORE-SW ⇄ ACC-SW1) is DOWN. Floor 1 is running on one of its two links; the other is blocked.&rdquo; <i>Done when Po1 is bundled with both links at both ends.</i>", hint:"show etherchannel summary on both switches: what are the flags on Gi0/1 and Gi0/2? Then compare the channel-group … mode lines in show running-config at each end. Which LACP mode pairs actually negotiate?", done:B=>Bench.bundled(B,"core",1) && Bench.bundled(B,"acc1",1)},
    {text:"<b>STP audit:</b> &ldquo;Design standard: CORE-SW is the root bridge for every VLAN. The audit found another switch as root for VLANs 10, 20 and 99.&rdquo; <i>Done when CORE-SW is root for VLANs 10, 20 and 99.</i>", hint:"show spanning-tree vlan 10 on CORE-SW: whose address is the Root ID, and with what priority? Find where that priority was set (show running-config | include spanning-tree on the access switches). Fix both ends: give CORE-SW a low priority (for example 4096 for each VLAN) and remove the stray setting with no spanning-tree vlan … priority — not no spanning-tree vlan …", done:B=>[10,20,99].every(v=>Bench.stpRoot(B,v)==="core")},
  ],
  win:"Eight faults across the whole module — routing off, a trunk that never formed, a VLAN missing from an allowed list, a user in the wrong VLAN, a BPDU-guard err-disable, a native VLAN typo, a passive/passive bundle and a stray root bridge — found by asking the same eight questions every time. That's a Monday on a real NOC desk, done properly.",
  solve:[["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","NocLab26"],["term","configure terminal"],
    ["term","ip routing"],["term","interface range g0/1 - 2"],["term","channel-group 1 mode active"],["term","interface po1"],["term","switchport trunk allowed vlan add 20"],
    ["term","interface g0/3"],["term","switchport mode trunk"],["term","exit"],["term","spanning-tree vlan 1,10,20,30,99,999 priority 4096"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","acc1:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","NocLab26"],["term","configure terminal"],
    ["term","interface g0/3"],["term","switchport access vlan 10"],["term","exit"],["term","no spanning-tree vlan 10,20,99 priority"],["term","interface range g0/1 - 2"],["term","channel-group 1 mode active"],["term","end"],["term","write memory"],
    ["unplug","lap:usb"],["plug","console","lap:usb","acc2:con"],["console","lap",{speed:"9600",data:"8",parity:"None",stop:"1",flow:"None"}],["term",""],["term","enable"],["term","NocLab26"],["term","configure terminal"],
    ["term","interface g0/1"],["term","switchport trunk native vlan 999"],["term","switchport mode trunk"],
    ["unplug","acc2:g4"],["unplug","pcd:eth"],["plug","cat6","pcd:eth","acc2:g4"],["term","interface g0/4"],["term","shutdown"],["term","no shutdown"],["term","end"],["term","write memory"],
    ["pc","noc","ping 10.20.30.10"],["pc","pcc","ping 10.20.30.10"],["pc","pcb","ping 10.20.30.10"],["pc","pca","ping 10.20.30.10"],["pc","pcd","ping 10.20.30.10"],["pc","noc","ping 10.20.99.12"]]})}
${K.hint(`Stuck on where to begin? Take the complaint that affects the most people first. If even NOC-PC on the core can't reach FS1, nothing else will either. Then floor 2's uplink (it hides two more faults), then floor 1 port by port, then the alerts. Compare both ends of every link.`)}
<h3>Instructor walkthrough</h3>
<p>Open these only after you've tried.</p>
${K.reveal("Fault 1 — CORE-SW isn't routing",`<p><b>Found:</b> NOC-PC pings its gateway but gets <code>Request timed out</code> to FS1. Both SVIs are up/up; <code>show running-config | include ip routing</code> returns nothing, and <code>show ip route</code> prints only <code>Default gateway is not set</code> instead of a routing table. It masks every user complaint, so fix it first. <b>Fix:</b> <code>ip routing</code>. <b>Proof:</b> NOC-PC pings FS1 with TTL 127 (one routed hop).</p>`)}
${K.reveal("Fault 2 — floor 2's uplink is DTP auto + auto",`<p><b>Found:</b> floor 2 gets <code>Destination host unreachable</code>; <code>show interfaces trunk</code> is empty on ACC-SW2; Gi0/1 shows <code>dynamic auto</code> / <code>static access</code>, and so does CORE-SW Gi0/3. <b>Fix:</b> <code>switchport mode trunk</code> at both ends. <b>Proof:</b> both list the port as <code>trunking</code>; Chidi pings FS1. This uncovers fault 6.</p>`)}
${K.reveal("Fault 3 — VLAN 20 missing from the floor-1 allowed list",`<p><b>Found:</b> CORE-SW <code>show interfaces g0/1 switchport</code>: <code>Trunking VLANs Enabled: 10,99,999</code>; <code>Vlan20 … up down</code> in <code>show ip interface brief</code> (autostate). <b>Fix:</b> <code>interface po1</code>, <code>switchport trunk allowed vlan add 20</code> — on the port-channel, so both members stay identical (editing one member suspends it). <b>Proof:</b> Po1 lists 20 in all four blocks; Tunde pings FS1.</p>`)}
${K.reveal("Fault 4 — Amaka's port is still in Sales",`<p><b>Found:</b> she can't ping her own gateway; <code>show interfaces status</code> on ACC-SW1 shows <code>DESK-1.03 AMAKA ST … 20</code>. Her ARP for 10.20.10.1 floods in VLAN 20, where nobody owns it. <b>Fix:</b> <code>interface g0/3</code>, <code>switchport access vlan 10</code>. <b>Proof:</b> her MAC in VLAN 10; she pings FS1.</p>`)}
${K.reveal("Fault 5 — Bola's port err-disabled by BPDU guard",`<p><b>Found:</b> ACC-SW2 Gi0/4 <code>err-disabled</code>, amber; <code>show logging</code> shows <code>BLOCK_BPDUGUARD</code> then <code>ERR_DISABLE: bpduguard</code>. DESK-SW runs Spanning Tree, so it sends BPDUs. <b>Fix:</b> cause first — unplug DESK-SW, cable Bola straight into Gi0/4 — then <code>shutdown</code>, <code>no shutdown</code>. <b>Proof:</b> Gi0/4 <code>connected</code> in VLAN 20; Bola pings FS1. Tell her: a second cabled point for the printer, not a desk switch.</p>`)}
${K.reveal("Fault 6 — native VLAN typo: 99 instead of 999",`<p><b>Found:</b> floor 2 works, but 10.20.99.12 doesn't answer. ACC-SW2's log: <code>%CDP-4-NATIVE_VLAN_MISMATCH … GigabitEthernet0/1 (99), with CORE-SW GigabitEthernet0/3 (999)</code>; CORE-SW logs the mirror image. ACC-SW2 sends its management replies untagged and the core would file them in VLAN 999 — so PVST+ blocks VLANs 99 and 999 on that trunk at both ends (CORE-SW <code>show spanning-tree vlan 99</code>: <code>Gi0/3 Desg BKN* … P2p *PVID_Inc</code>; <code>%SPANTREE-2-BLOCK_PVID_PEER</code> / <code>BLOCK_PVID_LOCAL</code> in the log). <b>Fix:</b> ACC-SW2 Gi0/1 <code>switchport trunk native vlan 999</code> — back to the standard, rather than bending the core to 99. <b>Proof:</b> native 999 at both ends; NOC-PC pings 10.20.99.12.</p>`)}
${K.reveal("Fault 7 — Po1 passive at both ends",`<p><b>Found:</b> <code>Po1(SD) LACP Gi0/1(I) Gi0/2(I)</code> at both ends; <code>channel-group 1 mode passive</code> on all four members; STP shows <code>Gi0/2 Altn BLK</code>. <b>Fix:</b> <code>interface range g0/1 - 2</code>, <code>channel-group 1 mode active</code> (both ends, by design). <b>Proof:</b> <code>Po1(SU)</code>, members <code>(P)</code>; STP lists one port, Po1, cost 3.</p>`)}
${K.reveal("Fault 8 — an access switch left as root",`<p><b>Found:</b> CORE-SW <code>show spanning-tree vlan 10</code>: Root ID priority <code>4106</code>, ACC-SW1's address; ACC-SW1 has <code>spanning-tree vlan 10,20,99 priority 4096</code> left from staging. <b>Fix:</b> both ends — CORE-SW <code>spanning-tree vlan 1,10,20,30,99,999 priority 4096</code>; ACC-SW1 <code>no spanning-tree vlan 10,20,99 priority</code>. Do only one and the lowest MAC (ACC-SW1's or ACC-SW2's) still wins. <b>Proof:</b> &ldquo;This bridge is the root&rdquo; on CORE-SW for 10, 20 and 99.</p>
<p><b>Finally</b> <code>write memory</code> on all three, and a ticket note listing each fault, fix and proof.</p>`)}

<h2>Interview corner</h2>
${K.hint(`Scope first, then walk the frame's path with a command for each step, and finish with proof.`)}
${K.reveal("&ldquo;Users in one VLAN can't reach the server. How do you troubleshoot it?&rdquo;",`<p>&ldquo;I scope it first: that VLAN everywhere or on one switch, can users reach their gateway, what changed? For one VLAN everywhere I check what only it uses. On the core: is the VLAN in <code>show vlan brief</code>, and is its SVI up/up? Up/down means no live port in that VLAN. On each trunk towards the users, <code>show interfaces trunk</code> at both ends: trunking, the VLAN in all four lists, native matching — <code>show logging</code> shows a CDP native mismatch. Then <code>show spanning-tree vlan N</code> and <code>show etherchannel summary</code>. If users reach the gateway but not the server, I check <code>ip routing</code> or the ROAS subinterfaces, then the server's port and gateway. I fix the first fault — with <code>allowed vlan add</code>, never a replacement list — and prove it with a ping from a user's PC.&rdquo;</p>`)}
${K.hint(`Where the evidence lives, how to read it, the recovery order — and what you'd never do.`)}
${K.reveal("&ldquo;How do you find where a port is err-disabled, and why?&rdquo;",`<p>&ldquo;<code>show interfaces status err-disabled</code> lists the ports and reasons; <code>show logging</code> (or the syslog server) gives the reason and time — say <code>%SPANTREE-2-BLOCK_BPDUGUARD</code> then <code>%PM-4-ERR_DISABLE: bpduguard</code>, or a port-security violation. Then I find the cause on the ground: what was plugged in, by whom. I remove it, then <code>shutdown</code> / <code>no shutdown</code>, verify connected with the expected MAC, and record it. Bouncing it first just err-disables it again and hides the evidence. <code>errdisable recovery cause bpduguard</code> can automate recovery, but it's off by default and should be a deliberate choice.&rdquo;</p>`)}
${K.hint(`Defaults, the combination table, how to see it in output, and the production habit.`)}
${K.reveal("&ldquo;Two new switches are connected, but VLAN traffic doesn't cross the link. Why might that be?&rdquo;",`<p>&ldquo;Most often DTP: Catalyst ports default to dynamic auto, and auto + auto never negotiates, so the link is an access port in VLAN 1. <code>show interfaces trunk</code> is empty; switchport shows dynamic auto / static access. I set <code>switchport mode trunk</code> at both ends, then <code>nonegotiate</code> if the site disables DTP. If it is trunking, I check the VLANs are allowed and exist on both switches and the native matches. In production uplinks are hard-set trunks with explicit allowed lists and an unused native VLAN.&rdquo;</p>`)}

${K.recap([
  "Follow the frame: port, VLAN, trunking, allowed and native at both ends, STP, bundle, gateway and routing, host.",
  "Wrong VLAN: gateway unreachable, Vlan column contradicts the description. Missing VLAN: (Inactive), port gone from show vlan brief.",
  "DTP auto + auto = access: empty show interfaces trunk; dynamic auto / static access.",
  "show interfaces trunk: trunking, allowed, active, STP forwarding — the first block a VLAN is missing from names the cause. Use allowed vlan add.",
  "Native mismatch: %CDP-4-NATIVE_VLAN_MISMATCH; set both ends to the standard.",
  "Wrong root: fix both ends. no spanning-tree vlan N turns STP off.",
  "EtherChannel: P bundled, I stand-alone, s suspended. SVI up/down = autostate; no ip routing = gateway reachable, nothing routed.",
])}
${K.next(`<b>Module 5 — Routing: static routes, OSPF and first-hop redundancy.</b> You can now get a frame to its gateway in the right VLAN. Next, what happens after the gateway: how routers choose paths with static routes and OSPF, and how HSRP keeps the gateway itself from becoming a single point of failure.`)}
`,
quiz:[
  {q:"On a switch whose uplink shows 'connected' in show interfaces status, show interfaces trunk prints nothing at all. What does that tell you?", o:["The trunk is up but carries only VLAN 1","No port on this switch is operationally trunking","Spanning Tree is blocking every trunk","The native VLAN is mismatched"], a:1, why:"show interfaces trunk lists only ports that are trunking right now. An empty output on a switch with a connected uplink means the uplink came up as an access port: typically DTP auto + auto, or a port set to access mode.", lvl:1},
  {q:"Floor 3's users can't reach anything after a switch swap. Based on the output from the floor switch's uplink, what is the cause?", ex:"FL3-SW#show interfaces g0/1 switchport\nName: Gi0/1\nSwitchport: Enabled\nAdministrative Mode: dynamic auto\nOperational Mode: static access\nAdministrative Trunking Encapsulation: dot1q\nOperational Trunking Encapsulation: native\nNegotiation of Trunking: On\nAccess Mode VLAN: 1 (default)\nTrunking Native Mode VLAN: 999 (NATIVE_UNUSED)\n\nCORE-SW#show interfaces g0/7 switchport | include Mode:\nAdministrative Mode: dynamic auto\nOperational Mode: static access", o:["The native VLAN doesn't match","Both ends are dynamic auto, so DTP never forms a trunk; set switchport mode trunk on the uplink at both ends","VLAN 1 is missing from the allowed list","Spanning Tree is blocking Gi0/1"], a:1, why:"Dynamic auto only responds to DTP requests; two auto ports never ask, so the link stays an access port in VLAN 1 and only VLAN 1 crosses. Hard-setting switchport mode trunk on both ends fixes it. The native VLAN shown only matters once the link is trunking.", lvl:2},
  {type:"multi", q:"Which two combinations of port modes at the two ends of a switch-to-switch link result in a trunk? (Choose two.)", o:["dynamic auto + dynamic auto","dynamic desirable + dynamic auto","switchport mode trunk + dynamic auto","switchport mode access + dynamic desirable","switchport mode trunk with switchport nonegotiate + dynamic auto"], a:[1,2], why:"Desirable and trunk ports send DTP requests that an auto port accepts. Auto + auto never negotiates. An access port never trunks. Nonegotiate stops DTP, so the auto end never hears a request and stays an access port.", lvl:2},
  {q:"A trunk carries VLANs 10, 20 and 99. To let VLAN 30 across, an engineer types 'switchport trunk allowed vlan 30' under the interface. What happens?", o:["VLAN 30 is added to the existing list","The command is rejected because add is missing","The allowed list becomes only VLAN 30, cutting off VLANs 10, 20 and 99","VLAN 30 becomes the native VLAN"], a:2, why:"Without add or remove, switchport trunk allowed vlan replaces the whole list. The correct command is switchport trunk allowed vlan add 30, and show interfaces trunk should be compared before and after.", lvl:2},
  {q:"This message appears every minute on DIST-SW. Which statement is correct?", ex:"%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/24 (1), with FL6-SW GigabitEthernet0/1 (999).", o:["It is cosmetic; CDP is using the wrong VLAN","Untagged frames are being put into a different VLAN at each end, so traffic in VLANs 1 and 999 is affected; set both ends to the same native VLAN","Gi0/3 is not trunking","VLAN 99 is not allowed on the trunk"], a:1, why:"The two ends disagree about which VLAN is sent untagged, so a frame sent untagged in one VLAN arrives in the other. Traffic in both native VLANs leaks or disappears, and PVST+ on real switches blocks those VLANs on the port. Fix it to the site standard on both ends.", lvl:2},
  {type:"fill", q:"Type the command that shows, for each trunk, its native VLAN, its allowed VLANs and the VLANs Spanning Tree is forwarding on it.", fields:[{label:"Command", a:["show interfaces trunk"], ios:true}], why:"show interfaces trunk prints four blocks: the trunking ports with mode and native VLAN, the allowed list, the allowed and active VLANs, and the VLANs in STP forwarding state. The first block a VLAN is missing from points at the cause.", lvl:1},
  {q:"What is the most likely cause of this output on both switches of a two-link uplink?", ex:"CORE-SW#show etherchannel summary\nGroup  Port-channel  Protocol    Ports\n------+-------------+-----------+-----------------------------------------------\n1      Po1(SD)       LACP        Gi0/1(I)  Gi0/2(I)", o:["One member cable is faulty","Both ends are configured with channel-group 1 mode passive","Both ends are configured with channel-group 1 mode active","The members have different allowed VLAN lists"], a:1, why:"(I) stand-alone with LACP means no LACP bundle was negotiated, which happens when neither side initiates (passive + passive) or the far end isn't running LACP. Active + active bundles. Mismatched member settings show as (s) suspended, and a faulty link shows (D).", lvl:2},
  {type:"match", q:"Match each show etherchannel summary flag with its meaning.", pairs:[["P","Bundled in the port-channel"],["I","Stand-alone: working as a separate link"],["s","Suspended: refused because its settings differ"],["D","Down"],["SU","Layer 2 port-channel, in use"]], why:"P is the healthy member state. I means negotiation didn't produce a bundle; s means the port was refused because its configuration doesn't match the other members; D means the link is down. On the port-channel itself, S = Layer 2 and U = in use (SD = Layer 2, down).", lvl:1},
  {q:"The design says CORE1 must be the root for VLAN 20. You see the output below on CORE1, and show cdp neighbors says Gi0/2 connects to FL2-SW. What is the best fix?", ex:"CORE1#show spanning-tree vlan 20\nVLAN0020\n  Root ID    Priority    4116\n             Address     0050.3a11.0000\n             Cost        4\n             Port        2 (GigabitEthernet0/2)\n  Bridge ID  Priority    32788  (priority 32768 sys-id-ext 20)\n             Address     0050.9e02.0000", o:["On CORE1: no spanning-tree vlan 20","On CORE1: spanning-tree vlan 20 priority 4096 only","Set a low priority on CORE1 (for example 4096) AND remove the stray priority on FL2-SW with no spanning-tree vlan 20 priority","Shut Gi0/2 on CORE1 so FL2-SW can't be root"], a:2, why:"FL2-SW has priority 4096 (4116 minus the VLAN). Setting the core to 4096 alone creates a tie that the lower MAC, 0050.3a11.0000 on FL2-SW, still wins. Fix both ends so the design is deterministic. no spanning-tree vlan 20 would disable STP for that VLAN, and shutting the uplink cuts off the floor.", lvl:3},
  {type:"order", q:"A desk port is err-disabled and show logging shows BLOCK_BPDUGUARD. Put the recovery steps in the right order.", items:["Read show logging to confirm the reason (bpduguard) and the time","Find out what was plugged in at that desk","Remove the switch from the desk port","Enter shutdown on the interface","Enter no shutdown on the interface","Verify the port is connected with the expected single MAC","Record the cause and the fix in the ticket"], why:"Evidence first, then the cause on the ground, then remove it. Only then bounce the port — bouncing with the switch still attached err-disables it again — and verify and document.", lvl:2},
  {q:"Sales users (VLAN 20) on every floor can't leave their subnet; Staff (VLAN 10) is fine. On the Layer 3 core, show ip interface brief shows 'Vlan20 10.20.20.1 YES manual up down'. What is the most likely cause?", o:["ip routing is disabled","No port on the core is carrying VLAN 20: it's missing from the trunks' allowed lists or not active on the core","The SVI has the wrong IP address","BPDU guard has err-disabled the SVI"], a:1, why:"An SVI is up/up only while at least one Layer 2 port in its VLAN is up and forwarding (autostate). Up/down means no trunk or access port on the core carries VLAN 20, so check the allowed lists on the core trunks and that VLAN 20 exists on the core. Missing ip routing would affect VLAN 10 too.", lvl:3},
  {type:"multi", q:"The NOC (10.50.99.20, VLAN 99) can ping FL1-SW at 10.50.99.11 but not FL2-SW at 10.50.99.12. Users on FL2-SW work normally. Which two faults could each cause this on their own? (Choose two.)", o:["FL2-SW's uplink uses native VLAN 99 while the core end uses 999","VLAN 99 is missing from the allowed list on FL2-SW's uplink","ip routing is disabled on the core","A user port on FL2-SW is in the wrong VLAN","A desk port on FL2-SW is err-disabled by BPDU guard"], a:[0,1], why:"Management is VLAN 99 end to end, so routing isn't involved. A native mismatch makes FL2-SW send its VLAN 99 frames untagged, which the core would put into VLAN 999, so PVST+ blocks VLANs 99 and 999 on that trunk; a missing allowed-list entry drops VLAN 99 entirely. Single user-port problems don't affect the switch's management address.", lvl:3},
  {q:"A router-on-a-stick has g0/0.10 (encapsulation dot1Q 10) and g0/0.20 (encapsulation dot1Q 20), both correctly addressed, and g0/0 is no shutdown. The switch port facing it is left at its default. No VLAN can reach its gateway. What is the fix?", o:["Add ip routing on the router","Configure switchport mode trunk on the switch port facing the router","Configure switchport mode dynamic auto on the switch port","Change the router to encapsulation isl"], a:1, why:"Catalyst ports default to dynamic auto, and routers don't speak DTP, so nothing asks for a trunk and the port stays an access port in VLAN 1. The tagged frames from the subinterfaces are dropped. The switch port must be configured as switchport mode trunk.", lvl:3},
  {q:"Which command shows the VLAN and the port on which a switch learned a particular host's MAC address?", o:["show vlan brief","show mac address-table address 0050.56a1.3c2e","show interfaces trunk","show cdp neighbors"], a:1, why:"The MAC address table records each learned MAC with its VLAN and port. Filtering by address answers 'where is this host and in which VLAN?' directly. A MAC learned on an uplink means follow it with CDP to the next switch.", lvl:1},
  {q:"An engineer wanted to remove a stray STP priority on an access switch and typed 'no spanning-tree vlan 10'. Minutes later VLAN 10 users on that floor report everything has frozen and show logging fills with MACFLAP messages. What happened, and what is the fix?", o:["The root moved to the core; nothing needs fixing","Spanning Tree was disabled for VLAN 10, so a redundant link now forms a loop and a broadcast storm; re-enable it with spanning-tree vlan 10, then remove the priority with no spanning-tree vlan 10 priority","BPDU guard err-disabled the uplink; bounce it","The native VLAN changed to 10; set it back to 999"], a:1, why:"no spanning-tree vlan 10 turns STP off for that VLAN. With any redundant path, broadcasts circle forever and MAC addresses flap between ports. Re-enabling STP stops the storm; the priority alone is removed with no spanning-tree vlan 10 priority.", lvl:3},
],
cards:[
  {f:"The Layer 2 troubleshooting questions, in order", b:"Port up, VLAN (and does it exist), uplink trunking, allowed and native at both ends, STP forwarding and root, bundle up, gateway and routing, host location. Mnemonic: Please Verify The Allowed Switches Before Going Home."},
  {f:"Fingerprint: host in the wrong VLAN", b:"Link connected, IP settings right, ping to own gateway gives Destination host unreachable. show interfaces status Vlan column contradicts the description. Fix: switchport access vlan N."},
  {f:"Fingerprint: VLAN missing on a switch", b:"show interfaces x switchport says Access Mode VLAN N (Inactive), and the port vanishes from show vlan brief. On a transit switch the VLAN drops out of 'allowed and active' in show interfaces trunk. Fix: create the VLAN."},
  {f:"Fingerprint: DTP auto + auto", b:"show interfaces trunk empty; uplink shows a VLAN number, not trunk; Administrative Mode dynamic auto, Operational Mode static access. Fix: switchport mode trunk on both ends."},
  {f:"show interfaces trunk — four blocks", b:"1 trunking ports (mode, native). 2 allowed list. 3 allowed and active (exist on this switch). 4 STP forwarding and not pruned. The first block a VLAN is missing from names the cause."},
  {f:"Allowed list: add, don't replace", b:"switchport trunk allowed vlan add 30 adds; switchport trunk allowed vlan 30 replaces the whole list and cuts off every other VLAN. remove takes one away."},
  {f:"Fingerprint: native VLAN mismatch", b:"%CDP-4-NATIVE_VLAN_MISMATCH with both port names and VLAN numbers; different Native vlan values in show interfaces trunk at each end. Untagged traffic lands in the wrong VLAN. Fix both ends to the standard."},
  {f:"Fingerprint: root bridge in the wrong place", b:"show spanning-tree vlan N on the core: Root ID address isn't its own, with a low priority from another switch. Fix: low priority on the core AND remove the stray one (no spanning-tree vlan N priority)."},
  {f:"no spanning-tree vlan N vs no spanning-tree vlan N priority", b:"The first disables Spanning Tree for VLAN N (storm risk on any loop). The second only removes a configured priority."},
  {f:"Fingerprint: err-disabled by BPDU guard", b:"Port err-disabled, LED amber; show logging: %SPANTREE-2-BLOCK_BPDUGUARD then %PM-4-ERR_DISABLE: bpduguard. Remove the switch, then shutdown / no shutdown, verify, record."},
  {f:"show etherchannel summary flags", b:"P bundled, I stand-alone (modes didn't negotiate: passive+passive, auto+auto, on vs LACP/PAgP), s suspended (member settings differ), D down. Po1(SU) = Layer 2, in use; (SD) = down."},
  {f:"SVI up/down and missing ip routing", b:"SVI up/down = autostate: no live, forwarding port in that VLAN on the switch. No ip routing = users reach their gateway SVI but nothing routes between VLANs (Request timed out)."},
  {f:"Router-on-a-stick checks", b:"Subinterface encapsulation dot1Q matches the VLAN and the IP is in that VLAN's subnet; physical port no shutdown; switch port facing the router is switchport mode trunk (routers don't speak DTP)."},
],
});

const t = LL.tracks.find(x=>x.id==="ccna");
const at = t.lessons.filter(l=>/^ccna-m[123]$/.test(l.mod||"")).length;
K.module("ccna", {
  id:"ccna-m4", t:"VLANs, trunks, inter-VLAN routing, Spanning Tree & EtherChannel",
  blurb:"Segment a LAN with VLANs, carry them over 802.1Q trunks, route between them, stop loops with Spanning Tree, bundle links with EtherChannel — and troubleshoot it all in the Module 4 challenge.",
}, L, { at, modAt:3, replace:["VLANs, trunks, inter-VLAN routing & SVIs","Spanning Tree & EtherChannel"] });
})();
